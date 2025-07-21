const { EventRegistration, Event, User } = require('../models');
const { Op } = require('sequelize');

/**
 * 活动报名数据访问层
 */
class EventRegistrationRepository {
  /**
   * 创建报名记录
   * @param {Object} registrationData 报名数据
   * @returns {Promise<Object>} 创建的报名记录
   */
  async create(registrationData) {
    return await EventRegistration.create(registrationData);
  }

  /**
   * 根据ID查找报名记录
   * @param {String} id 报名记录ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object|null>} 报名记录
   */
  async findById(id, options = {}) {
    const defaultOptions = {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'start_time', 'end_time', 'location']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    };

    return await EventRegistration.findByPk(id, { ...defaultOptions, ...options });
  }

  /**
   * 查找用户在特定活动的报名记录
   * @param {String} eventId 活动ID
   * @param {String} userId 用户ID
   * @returns {Promise<Object|null>} 报名记录
   */
  async findByEventAndUser(eventId, userId) {
    return await EventRegistration.findOne({
      where: { event_id: eventId, user_id: userId }
    });
  }

  /**
   * 更新报名记录
   * @param {String} id 报名记录ID
   * @param {Object} updateData 更新数据
   * @returns {Promise<Object>} 更新后的报名记录
   */
  async update(id, updateData) {
    await EventRegistration.update(updateData, { where: { id } });
    return await this.findById(id);
  }

  /**
   * 删除报名记录
   * @param {String} id 报名记录ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async delete(id) {
    const result = await EventRegistration.destroy({ where: { id } });
    return result > 0;
  }

  /**
   * 获取活动的报名列表
   * @param {String} eventId 活动ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 报名列表和总数
   */
  async findByEvent(eventId, options = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      keyword
    } = options;

    const where = { event_id: eventId };
    
    // 状态筛选
    if (status !== undefined) {
      where.status = status;
    }

    const include = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }
    ];

    // 关键词搜索（搜索用户信息）
    if (keyword) {
      include[0].where = {
        [Op.or]: [
          { username: { [Op.like]: `%${keyword}%` } },
          { nickname: { [Op.like]: `%${keyword}%` } }
        ]
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await EventRegistration.findAndCountAll({
      where,
      include,
      order: [['registered_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      registrations: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * 获取用户的报名列表
   * @param {String} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 报名列表和总数
   */
  async findByUser(userId, options = {}) {
    const {
      page = 1,
      limit = 10,
      status
    } = options;

    const where = { user_id: userId };
    
    // 状态筛选
    if (status !== undefined) {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await EventRegistration.findAndCountAll({
      where,
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'start_time', 'end_time', 'location', 'cover_image', 'status']
        }
      ],
      order: [['registered_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      registrations: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * 检查用户是否已报名活动
   * @param {String} eventId 活动ID
   * @param {String} userId 用户ID
   * @returns {Promise<Boolean>} 是否已报名
   */
  async isRegistered(eventId, userId) {
    const count = await EventRegistration.count({
      where: { 
        event_id: eventId, 
        user_id: userId,
        status: { [Op.in]: [1, 2] } // 已报名或已参加
      }
    });
    return count > 0;
  }

  /**
   * 取消报名
   * @param {String} eventId 活动ID
   * @param {String} userId 用户ID
   * @param {String} reason 取消原因
   * @returns {Promise<Object>} 更新后的报名记录
   */
  async cancelRegistration(eventId, userId, reason = null) {
    const registration = await this.findByEventAndUser(eventId, userId);
    if (!registration) {
      throw new Error('报名记录不存在');
    }

    return await this.update(registration.id, {
      status: 0,
      canceled_at: new Date(),
      cancel_reason: reason
    });
  }

  /**
   * 签到
   * @param {String} registrationId 报名记录ID
   * @returns {Promise<Object>} 更新后的报名记录
   */
  async checkIn(registrationId) {
    return await this.update(registrationId, {
      status: 2,
      check_in_time: new Date()
    });
  }

  /**
   * 批量更新报名状态
   * @param {Array} registrationIds 报名记录ID数组
   * @param {Number} status 新状态
   * @returns {Promise<Number>} 更新的记录数
   */
  async batchUpdateStatus(registrationIds, status) {
    const [affectedRows] = await EventRegistration.update(
      { status },
      { where: { id: { [Op.in]: registrationIds } } }
    );
    return affectedRows;
  }

  /**
   * 获取活动报名统计
   * @param {String} eventId 活动ID
   * @returns {Promise<Object>} 统计信息
   */
  async getEventStatistics(eventId) {
    const totalCount = await EventRegistration.count({
      where: { event_id: eventId }
    });

    const activeCount = await EventRegistration.count({
      where: { event_id: eventId, status: { [Op.in]: [1, 2] } }
    });

    const canceledCount = await EventRegistration.count({
      where: { event_id: eventId, status: 0 }
    });

    const checkedInCount = await EventRegistration.count({
      where: { event_id: eventId, status: 2 }
    });

    return {
      total: totalCount,
      active: activeCount,
      canceled: canceledCount,
      checked_in: checkedInCount
    };
  }

  /**
   * 获取用户报名统计
   * @param {String} userId 用户ID
   * @returns {Promise<Object>} 统计信息
   */
  async getUserStatistics(userId) {
    const totalCount = await EventRegistration.count({
      where: { user_id: userId }
    });

    const activeCount = await EventRegistration.count({
      where: { user_id: userId, status: { [Op.in]: [1, 2] } }
    });

    const canceledCount = await EventRegistration.count({
      where: { user_id: userId, status: 0 }
    });

    const attendedCount = await EventRegistration.count({
      where: { user_id: userId, status: 2 }
    });

    return {
      total: totalCount,
      active: activeCount,
      canceled: canceledCount,
      attended: attendedCount
    };
  }
}

module.exports = new EventRegistrationRepository();
