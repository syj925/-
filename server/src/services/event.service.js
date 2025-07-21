const eventRepository = require('../repositories/event.repository');
const eventRegistrationRepository = require('../repositories/event-registration.repository');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const errorCodes = require('../constants/error-codes');

/**
 * 活动服务层
 */
class EventService {
  /**
   * 创建活动
   * @param {Object} eventData 活动数据
   * @param {String} organizerId 组织者ID
   * @returns {Promise<Object>} 创建的活动对象
   */
  async createEvent(eventData, organizerId) {
    // 验证时间逻辑
    const startTime = new Date(eventData.start_time);
    const endTime = new Date(eventData.end_time);
    const now = new Date();

    if (startTime <= now) {
      throw ErrorMiddleware.createError(
        '活动开始时间必须晚于当前时间',
        StatusCodes.BAD_REQUEST,
        errorCodes.INVALID_TIME
      );
    }

    if (endTime <= startTime) {
      throw ErrorMiddleware.createError(
        '活动结束时间必须晚于开始时间',
        StatusCodes.BAD_REQUEST,
        errorCodes.INVALID_TIME
      );
    }

    // 验证报名截止时间
    if (eventData.registration_deadline) {
      const deadline = new Date(eventData.registration_deadline);
      if (deadline >= startTime) {
        throw ErrorMiddleware.createError(
          '报名截止时间必须早于活动开始时间',
          StatusCodes.BAD_REQUEST,
          errorCodes.INVALID_TIME
        );
      }
    }

    const event = await eventRepository.create({
      ...eventData,
      organizer_id: organizerId,
      current_participants: 0,
      view_count: 0
    });

    return event;
  }

  /**
   * 获取活动详情
   * @param {String} id 活动ID
   * @param {String} currentUserId 当前用户ID（可选）
   * @returns {Promise<Object>} 活动详情
   */
  async getEventById(id, currentUserId = null) {
    const event = await eventRepository.findById(id);

    if (!event) {
      throw ErrorMiddleware.createError(
        '活动不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.EVENT_NOT_FOUND
      );
    }

    // 异步增加浏览次数，不等待结果
    eventRepository.incrementViewCount(id).catch(err => {
      console.error('更新浏览量失败:', err);
    });

    // 如果有当前用户，检查报名状态（简化查询）
    let registrationStatus = null;
    if (currentUserId) {
      console.log('开始检查报名状态...');
      try {
        // 使用简化的查询，不包含关联表
        const { EventRegistration } = require('../models');
        const registration = await EventRegistration.findOne({
          where: { event_id: id, user_id: currentUserId },
          attributes: ['id', 'status', 'registered_at', 'form_data']
        });

        console.log('报名状态查询完成:', registration ? '已报名' : '未报名');

        if (registration) {
          registrationStatus = {
            is_registered: true,
            status: registration.status,
            registered_at: registration.registered_at,
            form_data: registration.form_data
          };
        } else {
          registrationStatus = {
            is_registered: false
          };
        }
      } catch (error) {
        console.error('检查报名状态失败:', error);
        // 如果报名状态查询失败，设置为未报名
        registrationStatus = {
          is_registered: false
        };
      }
    }

    return {
      ...event.toJSON(),
      registration_status: registrationStatus
    };
  }

  /**
   * 更新活动
   * @param {String} id 活动ID
   * @param {Object} updateData 更新数据
   * @param {String} organizerId 组织者ID
   * @returns {Promise<Object>} 更新后的活动对象
   */
  async updateEvent(id, updateData, organizerId) {
    const event = await eventRepository.findById(id);
    
    if (!event) {
      throw ErrorMiddleware.createError(
        '活动不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.EVENT_NOT_FOUND
      );
    }

    // 检查权限（只有组织者可以修改）
    if (event.organizer_id !== organizerId) {
      throw ErrorMiddleware.createError(
        '无权限修改此活动',
        StatusCodes.FORBIDDEN,
        errorCodes.NO_PERMISSION
      );
    }

    // 验证时间逻辑（如果更新了时间）
    if (updateData.start_time || updateData.end_time) {
      const startTime = new Date(updateData.start_time || event.start_time);
      const endTime = new Date(updateData.end_time || event.end_time);

      if (endTime <= startTime) {
        throw ErrorMiddleware.createError(
          '活动结束时间必须晚于开始时间',
          StatusCodes.BAD_REQUEST,
          errorCodes.INVALID_TIME
        );
      }
    }

    return await eventRepository.update(id, updateData);
  }

  /**
   * 删除活动
   * @param {String} id 活动ID
   * @param {String} organizerId 组织者ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async deleteEvent(id, organizerId) {
    const event = await eventRepository.findById(id);
    
    if (!event) {
      throw ErrorMiddleware.createError(
        '活动不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.EVENT_NOT_FOUND
      );
    }

    // 检查权限
    if (event.organizer_id !== organizerId) {
      throw ErrorMiddleware.createError(
        '无权限删除此活动',
        StatusCodes.FORBIDDEN,
        errorCodes.NO_PERMISSION
      );
    }

    // 检查是否有报名记录
    const registrationCount = await eventRegistrationRepository.getEventStatistics(id);
    if (registrationCount.active > 0) {
      throw ErrorMiddleware.createError(
        '活动已有用户报名，无法删除',
        StatusCodes.BAD_REQUEST,
        errorCodes.EVENT_HAS_REGISTRATIONS
      );
    }

    return await eventRepository.delete(id);
  }

  /**
   * 获取活动列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 活动列表和分页信息
   */
  async getEvents(options = {}) {
    return await eventRepository.findAll(options);
  }

  /**
   * 获取推荐活动
   * @param {Number} limit 限制数量
   * @returns {Promise<Array>} 推荐活动列表
   */
  async getRecommendedEvents(limit = 10) {
    return await eventRepository.findRecommended(limit);
  }

  /**
   * 获取即将开始的活动
   * @param {Number} limit 限制数量
   * @returns {Promise<Array>} 活动列表
   */
  async getUpcomingEvents(limit = 10) {
    return await eventRepository.findUpcoming(limit);
  }

  /**
   * 报名活动
   * @param {String} eventId 活动ID
   * @param {String} userId 用户ID
   * @param {Object} formData 报名表单数据
   * @returns {Promise<Object>} 报名记录
   */
  async registerEvent(eventId, userId, formData = {}) {
    const event = await eventRepository.findById(eventId);
    
    if (!event) {
      throw ErrorMiddleware.createError(
        '活动不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.EVENT_NOT_FOUND
      );
    }

    // 检查活动状态
    if (event.status !== 1) {
      throw ErrorMiddleware.createError(
        '活动不在报名期间',
        StatusCodes.BAD_REQUEST,
        errorCodes.EVENT_NOT_OPEN
      );
    }

    // 检查报名截止时间
    if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
      throw ErrorMiddleware.createError(
        '报名已截止',
        StatusCodes.BAD_REQUEST,
        errorCodes.REGISTRATION_CLOSED
      );
    }

    // 检查是否已有有效报名
    const isRegistered = await eventRegistrationRepository.isRegistered(eventId, userId);
    if (isRegistered) {
      throw ErrorMiddleware.createError(
        '您已报名此活动',
        StatusCodes.BAD_REQUEST,
        errorCodes.ALREADY_REGISTERED
      );
    }

    // 检查人数限制
    if (event.max_participants && event.current_participants >= event.max_participants) {
      throw ErrorMiddleware.createError(
        '活动报名人数已满',
        StatusCodes.BAD_REQUEST,
        errorCodes.EVENT_FULL
      );
    }

    // 检查是否存在已取消的报名记录
    const existingRegistration = await eventRegistrationRepository.findByEventAndUser(eventId, userId);

    let registration;
    let shouldUpdateCount = true;

    if (existingRegistration && existingRegistration.status === 0) {
      // 如果存在已取消的记录，更新状态（重新报名）
      registration = await eventRegistrationRepository.update(existingRegistration.id, {
        status: 1,
        form_data: formData,
        registered_at: new Date(),
        canceled_at: null,
        cancel_reason: null
      });
    } else if (existingRegistration) {
      // 如果存在其他状态的记录，说明已经报名了，不应该到这里
      throw ErrorMiddleware.createError(
        '您已报名此活动',
        StatusCodes.BAD_REQUEST,
        errorCodes.ALREADY_REGISTERED
      );
    } else {
      // 创建新的报名记录
      registration = await eventRegistrationRepository.create({
        event_id: eventId,
        user_id: userId,
        form_data: formData,
        status: 1
      });
    }

    // 更新活动参与人数
    await eventRepository.updateParticipantCount(eventId, 1);

    return registration;
  }

  /**
   * 取消报名
   * @param {String} eventId 活动ID
   * @param {String} userId 用户ID
   * @param {String} reason 取消原因
   * @returns {Promise<Object>} 更新后的报名记录
   */
  async cancelRegistration(eventId, userId, reason = null) {
    const event = await eventRepository.findById(eventId);

    if (!event) {
      throw ErrorMiddleware.createError(
        '活动不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.EVENT_NOT_FOUND
      );
    }

    // 检查是否允许取消报名
    if (!event.allow_cancel_registration) {
      throw ErrorMiddleware.createError(
        '此活动不允许取消报名',
        StatusCodes.BAD_REQUEST,
        errorCodes.CANCEL_NOT_ALLOWED
      );
    }

    // 检查用户是否确实已报名（状态为1或2）
    const isRegistered = await eventRegistrationRepository.isRegistered(eventId, userId);
    if (!isRegistered) {
      throw ErrorMiddleware.createError(
        '您尚未报名此活动',
        StatusCodes.BAD_REQUEST,
        errorCodes.NOT_REGISTERED
      );
    }

    const registration = await eventRegistrationRepository.cancelRegistration(eventId, userId, reason);

    // 只有在用户确实已报名的情况下才减少人数
    await eventRepository.updateParticipantCount(eventId, -1);

    return registration;
  }

  /**
   * 获取活动统计信息
   * @param {String} id 活动ID
   * @returns {Promise<Object>} 统计信息
   */
  async getEventStatistics(id) {
    const event = await eventRepository.findById(id);
    
    if (!event) {
      throw ErrorMiddleware.createError(
        '活动不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.EVENT_NOT_FOUND
      );
    }

    return await eventRepository.getStatistics(id);
  }

  /**
   * 获取用户创建的活动
   * @param {String} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 活动列表和分页信息
   */
  async getUserEvents(userId, options = {}) {
    return await eventRepository.findByOrganizer(userId, options);
  }
}

module.exports = new EventService();
