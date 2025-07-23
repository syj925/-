const { Event, EventRegistration, User } = require('../models');
const { Op } = require('sequelize');

/**
 * 活动数据访问层
 */
class EventRepository {
  /**
   * 创建活动
   * @param {Object} eventData 活动数据
   * @returns {Promise<Object>} 创建的活动对象
   */
  async create(eventData) {
    return await Event.create(eventData);
  }

  /**
   * 根据ID查找活动
   * @param {String} id 活动ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object|null>} 活动对象
   */
  async findById(id, options = {}) {
    const defaultOptions = {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    };

    return await Event.findByPk(id, { ...defaultOptions, ...options });
  }

  /**
   * 获取活动详情（带状态转换）
   * @param {String} id 活动ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object|null>} 活动对象（状态已转换）
   */
  async findByIdWithStatusConversion(id, options = {}) {
    const event = await this.findById(id, options);

    if (!event) {
      return null;
    }

    // 转换状态值：整数转字符串
    const statusMap = {
      1: 'upcoming',    // 未开始
      2: 'ongoing',     // 进行中
      3: 'ended',       // 已结束
      4: 'canceled'     // 已取消
    };

    const eventData = event.toJSON();
    eventData.status = statusMap[eventData.status] || 'upcoming';

    return eventData;
  }

  /**
   * 更新活动
   * @param {String} id 活动ID
   * @param {Object} updateData 更新数据
   * @returns {Promise<Object>} 更新后的活动对象
   */
  async update(id, updateData) {
    await Event.update(updateData, { where: { id } });
    return await this.findById(id);
  }

  /**
   * 删除活动
   * @param {String} id 活动ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async delete(id) {
    const result = await Event.destroy({ where: { id } });
    return result > 0;
  }

  /**
   * 获取活动列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 活动列表和总数
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      organizerId,
      isRecommended,
      keyword,
      startDate,
      endDate
    } = options;

    const where = {};
    
    // 状态筛选
    if (status !== undefined) {
      where.status = status;
    }

    // 组织者筛选
    if (organizerId) {
      where.organizer_id = organizerId;
    }

    // 推荐筛选
    if (isRecommended !== undefined) {
      where.is_recommended = isRecommended;
    }

    // 关键词搜索
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
        { location: { [Op.like]: `%${keyword}%` } }
      ];
    }

    // 时间范围筛选
    if (startDate || endDate) {
      where.start_time = {};
      if (startDate) {
        where.start_time[Op.gte] = startDate;
      }
      if (endDate) {
        where.start_time[Op.lte] = endDate;
      }
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ],
      order: [['start_time', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // 转换状态值：整数转字符串
    const statusMap = {
      1: 'upcoming',    // 未开始
      2: 'ongoing',     // 进行中
      3: 'ended',       // 已结束
      4: 'canceled'     // 已取消
    };

    const eventsWithConvertedStatus = rows.map(event => {
      const eventData = event.toJSON();
      eventData.status = statusMap[eventData.status] || 'upcoming';
      return eventData;
    });

    return {
      events: eventsWithConvertedStatus,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * 获取推荐活动
   * @param {Number} limit 限制数量
   * @returns {Promise<Array>} 推荐活动列表
   */
  async findRecommended(limit = 10) {
    const events = await Event.findAll({
      where: {
        is_recommended: true,
        status: 1 // 只显示报名中的活动
      },
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ],
      order: [['start_time', 'ASC']],
      limit: parseInt(limit)
    });

    // 转换状态值：整数转字符串
    const statusMap = {
      1: 'upcoming',    // 未开始
      2: 'ongoing',     // 进行中
      3: 'ended',       // 已结束
      4: 'canceled'     // 已取消
    };

    return events.map(event => {
      const eventData = event.toJSON();
      eventData.status = statusMap[eventData.status] || 'upcoming';
      return eventData;
    });
  }

  /**
   * 获取即将开始的活动
   * @param {Number} limit 限制数量
   * @returns {Promise<Array>} 活动列表
   */
  async findUpcoming(limit = 10) {
    const now = new Date();
    const events = await Event.findAll({
      where: {
        start_time: { [Op.gt]: now },
        status: 1 // 只显示报名中的活动
      },
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ],
      order: [['start_time', 'ASC']],
      limit: parseInt(limit)
    });

    // 转换状态值：整数转字符串
    const statusMap = {
      1: 'upcoming',    // 未开始
      2: 'ongoing',     // 进行中
      3: 'ended',       // 已结束
      4: 'canceled'     // 已取消
    };

    return events.map(event => {
      const eventData = event.toJSON();
      eventData.status = statusMap[eventData.status] || 'upcoming';
      return eventData;
    });
  }

  /**
   * 增加浏览次数
   * @param {String} id 活动ID
   * @returns {Promise<Boolean>} 是否成功
   */
  async incrementViewCount(id) {
    const [affectedRows] = await Event.update(
      { view_count: Event.sequelize.literal('view_count + 1') },
      { where: { id } }
    );
    return affectedRows > 0;
  }

  /**
   * 更新参与人数
   * @param {String} id 活动ID
   * @param {Number} count 参与人数变化量
   * @returns {Promise<Boolean>} 是否成功
   */
  async updateParticipantCount(id, count) {
    const [affectedRows] = await Event.update(
      { current_participants: Event.sequelize.literal(`current_participants + ${count}`) },
      { where: { id } }
    );
    return affectedRows > 0;
  }

  /**
   * 检查活动是否存在
   * @param {String} id 活动ID
   * @returns {Promise<Boolean>} 是否存在
   */
  async exists(id) {
    const count = await Event.count({ where: { id } });
    return count > 0;
  }

  /**
   * 统计活动数量
   * @param {Object} conditions 查询条件
   * @returns {Promise<Number>} 活动数量
   */
  async count(conditions = {}) {
    const where = {};

    // 处理状态条件
    if (conditions.status !== undefined) {
      where.status = conditions.status;
    }

    // 处理推荐条件
    if (conditions.is_recommended !== undefined) {
      where.is_recommended = conditions.is_recommended;
    }

    // 添加软删除条件
    where.deleted_at = null;

    return await Event.count({ where });
  }

  /**
   * 获取用户创建的活动
   * @param {String} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 活动列表和总数
   */
  async findByOrganizer(userId, options = {}) {
    return await this.findAll({ ...options, organizerId: userId });
  }

  /**
   * 获取活动统计信息
   * @param {String} id 活动ID
   * @returns {Promise<Object>} 统计信息
   */
  async getStatistics(id) {
    const event = await Event.findByPk(id);
    if (!event) {
      return null;
    }

    const registrationCount = await EventRegistration.count({
      where: { event_id: id, status: { [Op.in]: [1, 2] } } // 已报名和已参加
    });

    const canceledCount = await EventRegistration.count({
      where: { event_id: id, status: 0 } // 已取消
    });

    const checkedInCount = await EventRegistration.count({
      where: { event_id: id, status: 2 } // 已参加
    });

    return {
      total_registrations: registrationCount,
      canceled_registrations: canceledCount,
      checked_in_count: checkedInCount,
      view_count: event.view_count,
      max_participants: event.max_participants,
      current_participants: event.current_participants
    };
  }
}

module.exports = new EventRepository();
