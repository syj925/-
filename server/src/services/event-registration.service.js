const eventRegistrationRepository = require('../repositories/event-registration.repository');
const eventRepository = require('../repositories/event.repository');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const errorCodes = require('../constants/error-codes');

/**
 * 活动报名服务层
 */
class EventRegistrationService {
  /**
   * 获取活动报名列表
   * @param {String} eventId 活动ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 报名列表和分页信息
   */
  async getEventRegistrations(eventId, options = {}) {
    // 检查活动是否存在
    const eventExists = await eventRepository.exists(eventId);
    if (!eventExists) {
      throw ErrorMiddleware.createError(
        '活动不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.EVENT_NOT_FOUND
      );
    }

    return await eventRegistrationRepository.findByEvent(eventId, options);
  }

  /**
   * 获取用户报名列表
   * @param {String} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 报名列表和分页信息
   */
  async getUserRegistrations(userId, options = {}) {
    return await eventRegistrationRepository.findByUser(userId, options);
  }

  /**
   * 获取报名详情
   * @param {String} registrationId 报名记录ID
   * @returns {Promise<Object>} 报名详情
   */
  async getRegistrationById(registrationId) {
    const registration = await eventRegistrationRepository.findById(registrationId);
    
    if (!registration) {
      throw ErrorMiddleware.createError(
        '报名记录不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.REGISTRATION_NOT_FOUND
      );
    }

    return registration;
  }

  /**
   * 更新报名信息
   * @param {String} registrationId 报名记录ID
   * @param {Object} updateData 更新数据
   * @param {String} userId 当前用户ID
   * @returns {Promise<Object>} 更新后的报名记录
   */
  async updateRegistration(registrationId, updateData, userId) {
    const registration = await eventRegistrationRepository.findById(registrationId);
    
    if (!registration) {
      throw ErrorMiddleware.createError(
        '报名记录不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.REGISTRATION_NOT_FOUND
      );
    }

    // 检查权限（只有报名用户本人可以修改）
    if (registration.user_id !== userId) {
      throw ErrorMiddleware.createError(
        '无权限修改此报名记录',
        StatusCodes.FORBIDDEN,
        errorCodes.NO_PERMISSION
      );
    }

    // 检查活动状态（已结束的活动不能修改报名信息）
    if (registration.event.status === 3) {
      throw ErrorMiddleware.createError(
        '活动已结束，无法修改报名信息',
        StatusCodes.BAD_REQUEST,
        errorCodes.EVENT_ENDED
      );
    }

    return await eventRegistrationRepository.update(registrationId, updateData);
  }

  /**
   * 签到
   * @param {String} registrationId 报名记录ID
   * @param {String} operatorId 操作者ID
   * @returns {Promise<Object>} 更新后的报名记录
   */
  async checkIn(registrationId, operatorId) {
    const registration = await eventRegistrationRepository.findById(registrationId);
    
    if (!registration) {
      throw ErrorMiddleware.createError(
        '报名记录不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.REGISTRATION_NOT_FOUND
      );
    }

    // 检查报名状态
    if (registration.status !== 1) {
      throw ErrorMiddleware.createError(
        '报名状态异常，无法签到',
        StatusCodes.BAD_REQUEST,
        errorCodes.INVALID_STATUS
      );
    }

    // 检查活动时间（只能在活动进行期间签到）
    const now = new Date();
    const startTime = new Date(registration.event.start_time);
    const endTime = new Date(registration.event.end_time);

    if (now < startTime) {
      throw ErrorMiddleware.createError(
        '活动尚未开始，无法签到',
        StatusCodes.BAD_REQUEST,
        errorCodes.EVENT_NOT_STARTED
      );
    }

    if (now > endTime) {
      throw ErrorMiddleware.createError(
        '活动已结束，无法签到',
        StatusCodes.BAD_REQUEST,
        errorCodes.EVENT_ENDED
      );
    }

    return await eventRegistrationRepository.checkIn(registrationId);
  }

  /**
   * 批量更新报名状态
   * @param {Array} registrationIds 报名记录ID数组
   * @param {Number} status 新状态
   * @param {String} operatorId 操作者ID
   * @returns {Promise<Number>} 更新的记录数
   */
  async batchUpdateStatus(registrationIds, status, operatorId) {
    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      throw ErrorMiddleware.createError(
        '请选择要更新的报名记录',
        StatusCodes.BAD_REQUEST,
        errorCodes.INVALID_PARAMS
      );
    }

    // 验证状态值
    if (![0, 1, 2].includes(status)) {
      throw ErrorMiddleware.createError(
        '无效的状态值',
        StatusCodes.BAD_REQUEST,
        errorCodes.INVALID_STATUS
      );
    }

    return await eventRegistrationRepository.batchUpdateStatus(registrationIds, status);
  }

  /**
   * 检查用户报名状态
   * @param {String} eventId 活动ID
   * @param {String} userId 用户ID
   * @returns {Promise<Object>} 报名状态信息
   */
  async checkRegistrationStatus(eventId, userId) {
    const registration = await eventRegistrationRepository.findByEventAndUser(eventId, userId);

    if (!registration) {
      return {
        is_registered: false,
        status: null,
        registered_at: null,
        form_data: null
      };
    }

    // 检查报名状态：只有状态为1（已报名）或2（已参加）才算有效报名
    const isValidRegistration = registration.status === 1 || registration.status === 2;

    return {
      is_registered: isValidRegistration,
      status: registration.status,
      registered_at: registration.registered_at,
      form_data: registration.form_data,
      registration_id: registration.id
    };
  }

  /**
   * 批量检查报名状态
   * @param {Array} eventIds 活动ID数组
   * @param {String} userId 用户ID
   * @returns {Promise<Object>} 报名状态映射
   */
  async batchCheckRegistrationStatus(eventIds, userId) {
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return {};
    }

    const statusMap = {};
    
    // 逐个检查每个活动的报名状态
    for (const eventId of eventIds) {
      try {
        statusMap[eventId] = await this.checkRegistrationStatus(eventId, userId);
      } catch (error) {
        // 如果某个活动检查失败，设置为未报名状态
        statusMap[eventId] = {
          is_registered: false,
          status: null,
          registered_at: null,
          form_data: null
        };
      }
    }

    return statusMap;
  }

  /**
   * 获取活动报名统计
   * @param {String} eventId 活动ID
   * @returns {Promise<Object>} 统计信息
   */
  async getEventRegistrationStatistics(eventId) {
    // 检查活动是否存在
    const eventExists = await eventRepository.exists(eventId);
    if (!eventExists) {
      throw ErrorMiddleware.createError(
        '活动不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.EVENT_NOT_FOUND
      );
    }

    return await eventRegistrationRepository.getEventStatistics(eventId);
  }

  /**
   * 获取用户报名统计
   * @param {String} userId 用户ID
   * @returns {Promise<Object>} 统计信息
   */
  async getUserRegistrationStatistics(userId) {
    return await eventRegistrationRepository.getUserStatistics(userId);
  }

  /**
   * 导出活动报名数据
   * @param {String} eventId 活动ID
   * @param {Object} options 导出选项
   * @returns {Promise<Array>} 报名数据
   */
  async exportEventRegistrations(eventId, options = {}) {
    // 检查活动是否存在
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw ErrorMiddleware.createError(
        '活动不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.EVENT_NOT_FOUND
      );
    }

    // 获取所有报名记录（不分页）
    const { registrations } = await eventRegistrationRepository.findByEvent(eventId, {
      page: 1,
      limit: 10000, // 设置一个较大的限制
      status: options.status
    });

    // 格式化导出数据
    const exportData = registrations.map(registration => ({
      registration_id: registration.id,
      user_id: registration.user_id,
      username: registration.user.username,
      nickname: registration.user.nickname,
      form_data: registration.form_data,
      status: registration.status,
      status_text: this.getStatusText(registration.status),
      registered_at: registration.registered_at,
      canceled_at: registration.canceled_at,
      cancel_reason: registration.cancel_reason,
      check_in_time: registration.check_in_time,
      notes: registration.notes
    }));

    return {
      event_info: {
        id: event.id,
        title: event.title,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location
      },
      registrations: exportData,
      export_time: new Date(),
      total_count: exportData.length
    };
  }

  /**
   * 获取状态文本
   * @param {Number} status 状态值
   * @returns {String} 状态文本
   */
  getStatusText(status) {
    const statusMap = {
      0: '已取消',
      1: '已报名',
      2: '已参加'
    };
    return statusMap[status] || '未知状态';
  }
}

module.exports = new EventRegistrationService();
