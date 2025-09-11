const { Message, User, Post, Comment, MessageRead } = require('../models');
const { Op, literal, fn, col } = require('sequelize');

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
    console.log('📝 [MessageRepository] 开始创建消息');
    
    try {
      const message = await Message.create(messageData);
      console.log('✅ [MessageRepository] 消息创建成功，ID:', message.id);
      
      // 直接返回创建的消息对象，避免重新查询的时序问题
      const result = {
        id: message.id,
        type: message.type,
        title: message.title,
        content: message.content,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        post_id: message.post_id || null,
        comment_id: message.comment_id || null,
        is_read: message.is_read || false,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      };
      
      return result;
      
    } catch (error) {
      console.error('❌ [MessageRepository] 创建消息失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID查找消息
   * @param {String} id 消息ID
   * @returns {Promise<Object>} 消息对象
   */
  async findById(id) {
    return await Message.findOne({
      where: { id },
      attributes: ['id', 'type', 'sub_type', 'title', 'content', 'sender_id', 'receiver_id', 'post_id', 'comment_id', 'is_read', 'createdAt', 'updatedAt'],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'username', 'nickname', 'avatar']
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

    // 构建查询条件：包含用户消息和系统消息
    const where = {
      [Op.or]: [
        { receiver_id: userId }, // 用户的个人消息
        { type: 'system' }        // 系统消息对所有用户可见
      ]
    };

    // 是否已读（只对用户个人消息有效，系统消息已读状态是独立的）
    if (isRead !== null) {
      where[Op.or][0].is_read = isRead; // 只对用户消息应用已读筛选
    }

    // 消息类型
    if (type) {
      if (type === 'system') {
        // 如果只要系统消息，移除用户消息条件
        delete where[Op.or];
        where.type = 'system';
      } else {
        // 如果要特定类型的非系统消息，移除系统消息条件
        delete where[Op.or];
        where.receiver_id = userId;
      where.type = type;
      }
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
      attributes: ['id', 'type', 'sub_type', 'title', 'content', 'sender_id', 'receiver_id', 'post_id', 'comment_id', 'is_read', 'createdAt', 'updatedAt'],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'nickname', 'avatar']
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
        },
        {
          model: MessageRead,
          as: 'messageReads',
          where: { user_id: userId },
          required: false, // LEFT JOIN，系统消息可能没有阅读记录
          attributes: ['read_at']
        }
      ]
    });

    // 处理消息的已读状态
    const processedRows = rows.map(message => {
      let isRead = message.is_read;
      
      // 对于系统消息，检查用户的个人阅读状态
      if (message.type === 'system') {
        isRead = message.messageReads && message.messageReads.length > 0;
      }
      
      return {
        ...message.toJSON(),
        is_read: isRead
      };
    });

    return {
      list: processedRows,
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
   * @param {String} type 消息类型，可选，如果指定则按类型标记
   * @returns {Promise<Number>} 标记的消息数量
   */
  async markMultipleAsRead(userId, ids = [], type = null) {
    if (type === 'system') {
      // 系统消息：在 message_reads 表中创建阅读记录
      return await this.markSystemMessagesAsRead(userId, ids);
    }
    
    // 非系统消息：更新消息表的 is_read 字段
    const where = {
      receiver_id: userId,
      is_read: false
    };

    // 如果指定了类型（非系统消息）
    if (type) {
      where.type = type;
    }
    // 否则如果指定了ID数组，按ID标记
    else if (ids && ids.length > 0) {
      where.id = {
        [Op.in]: ids
      };
    }
    // 如果都没指定，则标记所有非系统消息为已读
    else {
      // 排除系统消息
      where.type = {
        [Op.ne]: 'system'
      };
    }

    const result = await Message.update(
      { is_read: true },
      { where }
    );

    return result[0];
  }

  /**
   * 标记系统消息为已读
   * @param {String} userId 用户ID
   * @param {Array<String>} messageIds 消息ID数组，为空则标记所有系统消息
   * @returns {Promise<Number>} 标记的消息数量
   */
  async markSystemMessagesAsRead(userId, messageIds = []) {
    let systemMessages;
    
    if (messageIds && messageIds.length > 0) {
      // 标记指定的系统消息
      systemMessages = await Message.findAll({
        where: {
          id: { [Op.in]: messageIds },
          type: 'system'
        },
        attributes: ['id']
      });
    } else {
      // 标记所有系统消息
      systemMessages = await Message.findAll({
        where: { type: 'system' },
        attributes: ['id']
      });
    }

    if (systemMessages.length === 0) {
      return 0;
    }

    // 获取用户还未阅读的系统消息
    const alreadyReadIds = await MessageRead.findAll({
      where: {
        user_id: userId,
        message_id: { [Op.in]: systemMessages.map(m => m.id) }
      },
      attributes: ['message_id']
    });

    const alreadyReadIdSet = new Set(alreadyReadIds.map(r => r.message_id));
    const unreadMessages = systemMessages.filter(m => !alreadyReadIdSet.has(m.id));

    if (unreadMessages.length === 0) {
      return 0;
    }

    // 批量创建阅读记录
    const readRecords = unreadMessages.map(message => ({
      user_id: userId,
      message_id: message.id,
      read_at: new Date()
    }));

    await MessageRead.bulkCreate(readRecords, {
      ignoreDuplicates: true // 避免重复记录
    });

    return unreadMessages.length;
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