const { Message, User, Post, Comment } = require('../models');
const { Op } = require('sequelize');

/**
 * 消息数据访问层
 */
class MessageRepository {
  /**
   * 创建消息
   * @param {Object} messageData 消息数据
   * @returns {Promise<Object>} 创建的消息对象
   */
  async create(messageData) {
    return await Message.create(messageData);
  }

  /**
   * 根据ID查找消息
   * @param {String} id 消息ID
   * @returns {Promise<Object>} 消息对象
   */
  async findById(id) {
    return await Message.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Post,
          as: 'post',
          attributes: ['id', 'title']
        },
        {
          model: Comment,
          as: 'comment',
          attributes: ['id', 'content']
        }
      ]
    });
  }

  /**
   * 获取用户的消息列表
   * @param {String} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async findByUserId(userId, options = {}) {
    const {
      page = 1,
      pageSize = 20,
      isRead = null,
      type = null,
      startDate = null,
      endDate = null
    } = options;

    // 构建查询条件
    const where = {
      receiver_id: userId
    };

    // 是否已读
    if (isRead !== null) {
      where.is_read = isRead;
    }

    // 消息类型
    if (type) {
      where.type = type;
    }

    // 时间范围
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      where.created_at = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      where.created_at = {
        [Op.lte]: endDate
      };
    }

    const { rows, count } = await Message.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Post,
          as: 'post',
          attributes: ['id', 'title']
        },
        {
          model: Comment,
          as: 'comment',
          attributes: ['id', 'content']
        }
      ]
    });

    return {
      list: rows,
      pagination: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        total: count
      }
    };
  }

  /**
   * 标记消息为已读
   * @param {String} id 消息ID
   * @returns {Promise<Boolean>} 是否成功
   */
  async markAsRead(id) {
    const result = await Message.update(
      { is_read: true },
      { where: { id } }
    );
    return result[0] > 0;
  }

  /**
   * 批量标记消息为已读
   * @param {String} userId 用户ID
   * @param {Array<String>} ids 消息ID数组，为空则标记所有消息
   * @returns {Promise<Number>} 标记的消息数量
   */
  async markMultipleAsRead(userId, ids = []) {
    const where = {
      receiver_id: userId,
      is_read: false
    };

    if (ids && ids.length > 0) {
      where.id = {
        [Op.in]: ids
      };
    }

    const result = await Message.update(
      { is_read: true },
      { where }
    );

    return result[0];
  }

  /**
   * 删除消息
   * @param {String} id 消息ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async delete(id) {
    const result = await Message.destroy({ where: { id } });
    return result > 0;
  }

  /**
   * 批量删除消息
   * @param {String} userId 用户ID
   * @param {Array<String>} ids 消息ID数组，为空则删除所有消息
   * @returns {Promise<Number>} 删除的消息数量
   */
  async deleteMultiple(userId, ids = []) {
    const where = { receiver_id: userId };

    if (ids && ids.length > 0) {
      where.id = {
        [Op.in]: ids
      };
    }

    return await Message.destroy({ where });
  }

  /**
   * 获取用户未读消息数量
   * @param {String} userId 用户ID
   * @param {String} type 消息类型，可选
   * @returns {Promise<Number>} 未读消息数量
   */
  async countUnread(userId, type = null) {
    const where = {
      receiver_id: userId,
      is_read: false
    };

    if (type) {
      where.type = type;
    }

    return await Message.count({ where });
  }
}

module.exports = new MessageRepository(); 