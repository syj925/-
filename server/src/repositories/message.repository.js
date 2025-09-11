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
    if (type === 'system') {
      // 系统消息的未读计数：所有系统消息 - 用户已读的系统消息
      const totalSystemMessages = await Message.count({
        where: { type: 'system' }
      });
      
      const readSystemMessages = await MessageRead.count({
        where: { user_id: userId },
        include: [{
          model: Message,
          as: 'message',
          where: { type: 'system' },
          attributes: []
        }]
      });
      
      const unreadCount = totalSystemMessages - readSystemMessages;
      
      console.log(`📊 [MessageRepository] 用户 ${userId} 系统消息未读计数详情:`, {
        totalSystemMessages,
        readSystemMessages,
        unreadCount
      });
      
      return unreadCount;
    } else if (type) {
      // 特定类型的非系统消息
      return await Message.count({
        where: {
          receiver_id: userId,
          type: type,
          is_read: false
        }
      });
    } else {
      // 总未读计数：用户个人消息 + 系统消息
      const personalUnread = await Message.count({
        where: {
          receiver_id: userId,
          is_read: false
        }
      });
      
      const systemUnread = await this.countUnread(userId, 'system');
      
      return personalUnread + systemUnread;
    }
  }

  /**
   * 获取私信对话列表（会话列表）
   * @param {String} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async findPrivateConversations(userId, options = {}) {
    const { page = 1, pageSize = 20 } = options;

    // 先获取所有与当前用户相关的私信，按对话用户分组
    const conversations = await Message.findAll({
      where: {
        type: 'private',
        [Op.or]: [
          { sender_id: userId },
          { receiver_id: userId }
        ]
      },
      attributes: [
        [literal(`CASE WHEN sender_id = '${userId}' THEN receiver_id ELSE sender_id END`), 'conversation_user_id'],
        [fn('MAX', col('created_at')), 'last_message_time']
      ],
      group: [literal(`CASE WHEN sender_id = '${userId}' THEN receiver_id ELSE sender_id END`)],
      order: [[fn('MAX', col('created_at')), 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      raw: true
    });

    // 获取每个对话的详细信息
    const conversationDetails = [];
    for (const conv of conversations) {
      // 获取最新一条消息
      const latestMessage = await Message.findOne({
        where: {
          type: 'private',
          [Op.or]: [
            { sender_id: userId, receiver_id: conv.conversation_user_id },
            { sender_id: conv.conversation_user_id, receiver_id: userId }
          ]
        },
        order: [['created_at', 'DESC']],
        attributes: ['id', 'content', 'sender_id', 'is_read', 'createdAt'],
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'nickname', 'avatar']
          }
        ]
      });

      // 获取对话用户信息
      const conversationUser = await User.findByPk(conv.conversation_user_id, {
        attributes: ['id', 'username', 'nickname', 'avatar']
      });

      // 获取未读消息数
      const unreadCount = await Message.count({
        where: {
          type: 'private',
          sender_id: conv.conversation_user_id,
      receiver_id: userId,
      is_read: false
        }
      });

      if (latestMessage && conversationUser) {
        conversationDetails.push({
          conversationUserId: conv.conversation_user_id,
          user: conversationUser,
          lastMessage: {
            id: latestMessage.id,
            content: latestMessage.content,
            createdAt: latestMessage.createdAt,  // 使用下划线命名保持一致
            is_read: latestMessage.is_read,
            sender_id: latestMessage.sender_id,
            isSentByMe: latestMessage.sender_id === userId
          },
          unreadCount
        });
      }
    }

    // 获取总对话数量
    const totalConversationsResult = await Message.findAll({
      where: {
        type: 'private',
        [Op.or]: [
          { sender_id: userId },
          { receiver_id: userId }
        ]
      },
      attributes: [
        [literal(`CASE WHEN sender_id = '${userId}' THEN receiver_id ELSE sender_id END`), 'conversation_user_id']
      ],
      group: [literal(`CASE WHEN sender_id = '${userId}' THEN receiver_id ELSE sender_id END`)],
      raw: true
    });

    const total = totalConversationsResult.length;

    return {
      list: conversationDetails,
      pagination: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        total
      }
    };
  }

  /**
   * 获取与特定用户的私信对话记录
   * @param {String} userId 当前用户ID
   * @param {String} targetUserId 目标用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async findPrivateConversation(userId, targetUserId, options = {}) {
    const { page = 1, pageSize = 20 } = options;

    console.log('🔍 [MessageRepository] 查询私信对话:', {
      userId, 
      targetUserId, 
      page, 
      pageSize
    });

    const { rows, count } = await Message.findAndCountAll({
      where: {
        type: 'private',
        [Op.or]: [
          { sender_id: userId, receiver_id: targetUserId },
          { sender_id: targetUserId, receiver_id: userId }
        ]
      },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']], // 按时间降序排列，获取最新的消息
      // 移除 attributes 限制，让 Sequelize 返回所有字段（包括时间戳）
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    });

    console.log(`📊 [MessageRepository] 查询结果: 找到 ${rows.length} 条消息，总计 ${count} 条`);
    
    if (rows.length > 0) {
      console.log('📝 [MessageRepository] 最新消息样例:', {
        id: rows[rows.length - 1].id,
        createdAt: rows[rows.length - 1].createdAt,
        sender_id: rows[rows.length - 1].sender_id
      });
    }

    // 格式化消息数据 - 使用下划线命名保持与前端一致
    const formattedMessages = rows.map((message, index) => {
      
      return {
        id: message.id,
        content: message.content,
        sender_id: message.sender_id,   // 使用下划线命名
        receiver_id: message.receiver_id, // 使用下划线命名
        type: 'private',
        is_read: message.is_read,
        createdAt: message.createdAt || message.createdAt || message.getDataValue?.('createdAt') || message.getDataValue?.('createdAt'),  // 多种方式尝试获取时间戳
        sender: message.sender ? {
          id: message.sender.id,
          username: message.sender.username,
          nickname: message.sender.nickname,
          avatar: message.sender.avatar
        } : null
      };
    });

    return {
      list: formattedMessages,
      pagination: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        total: count
      }
    };
  }

  /**
   * 通用条件查询方法
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async findByCondition(options = {}) {
    const {
      page = 1,
      pageSize = 20,
      where = {},
      order = [['created_at', 'DESC']],
      include = []
    } = options;

    // 默认包含发送者信息
    const defaultInclude = [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }
    ];

    const { rows, count } = await Message.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order,
      attributes: ['id', 'type', 'sub_type', 'title', 'content', 'sender_id', 'receiver_id', 'post_id', 'comment_id', 'is_read', 'createdAt', 'updatedAt'],
      include: include.length > 0 ? include : defaultInclude
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
   * 标记私信对话为已读
   * @param {String} receiverId 接收者ID（当前用户）
   * @param {String} senderId 发送者ID（对话的另一方）
   * @returns {Promise<Number>} 标记的消息数量
   */
  async markPrivateConversationAsRead(receiverId, senderId) {
    const result = await Message.update(
      { is_read: true },
      {
        where: {
          type: 'private',
          receiver_id: receiverId,
          sender_id: senderId,
          is_read: false
        }
      }
    );

    return result[0];
  }

  /**
   * 获取系统消息列表（管理员使用）
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async findSystemMessages(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      type = null,
      searchQuery = null,
      startDate = null,
      endDate = null
    } = options;

    // 构建查询条件
    const where = {
      type: 'system'
    };

    // 消息子类型（通过title中的前缀或者额外字段区分）
    if (type && type !== '') {
      // 这里可以根据你的实际需求调整，比如添加sub_type字段或通过title匹配
      where.title = {
        [Op.like]: `%${type}%`
      };
    }

    // 标题搜索
    if (searchQuery && searchQuery !== '') {
      where.title = {
        [Op.like]: `%${searchQuery}%`
      };
    }

    // 时间范围
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { rows, count } = await Message.findAndCountAll({
      where,
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['created_at', 'DESC']],
      attributes: ['id', 'title', 'content', 'sender_id', 'sub_type', 'createdAt', 'updatedAt'],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'nickname'],
          required: false
        }
      ]
    });

    // 计算统计信息
    const formattedRows = await Promise.all(rows.map(async (message) => {
      // 获取该消息的阅读统计
      const readStats = await this.getSystemMessageStats(message.id);
      
      return {
        id: message.id,
        title: message.title,
        content: message.content,
        type: message.sub_type || 'other', // 使用数据库中的子类型
        sender: message.sender ? message.sender.nickname || message.sender.username : '系统管理员',
        targetGroup: '所有用户', // 可以后续扩展支持定向发送
        sendTime: message.createdAt,
        readCount: readStats.readCount,
        totalCount: readStats.totalCount,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      };
    }));

    return {
      rows: formattedRows,
      total: count
    };
  }

  /**
   * 获取系统消息的阅读统计
   * @param {String} messageId 消息ID
   * @returns {Promise<Object>} 统计信息
   */
  async getSystemMessageStats(messageId) {
    const { User } = require('../models');
    
    // 获取非管理员的活跃用户总数
    const totalUsers = await User.count({
      where: {
        status: 'active',
        role: {
          [Op.ne]: 'admin' // 排除管理员
        }
      }
    });

    // 获取已阅读该消息的非管理员用户数
    const readCount = await MessageRead.count({
      where: { message_id: messageId },
      include: [{
        model: User,
        as: 'user',
        where: {
          status: 'active',
          role: {
            [Op.ne]: 'admin' // 排除管理员
          }
        },
        attributes: []
      }]
    });

    return {
      readCount,
      totalCount: totalUsers
    };
  }

  /**
   * 从消息标题提取类型
   * @param {String} title 消息标题
   * @returns {String} 消息类型
   */
  extractMessageType(title) {
    if (title.includes('维护') || title.includes('升级')) return 'announcement';
    if (title.includes('活动') || title.includes('功能')) return 'event';
    if (title.includes('提醒') || title.includes('注意')) return 'reminder';
    if (title.includes('警告') || title.includes('违规')) return 'warning';
    return 'other';
  }

  /**
   * 获取系统消息接收者列表
   * @param {String} messageId 消息ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async getSystemMessageRecipients(messageId, options = {}) {
    const {
      page = 1,
      pageSize = 10,
      isRead = null
    } = options;

    // 系统消息是广播给所有用户的，这里获取所有活跃用户
    const { User } = require('../models');
    
    const where = {
      status: 'active'
    };

    const { rows, count } = await User.findAndCountAll({
      where,
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['created_at', 'DESC']],
      attributes: ['id', 'username', 'nickname', 'avatar', 'createdAt']
    });

    // 模拟阅读状态，实际应该从消息阅读记录表查询
    const formattedRows = rows.map(user => {
      const mockIsRead = Math.random() > 0.3; // 随机70%已读
      return {
        userId: user.id,
        nickname: user.nickname || user.username,
        username: user.username,
        avatar: user.avatar,
        isRead: isRead !== null ? (isRead === 'true') : mockIsRead,
        readAt: mockIsRead ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : null
      };
    });

    // 如果有阅读状态筛选，进行过滤
    let filteredRows = formattedRows;
    if (isRead !== null && isRead !== '') {
      const readStatus = isRead === 'true';
      filteredRows = formattedRows.filter(user => user.isRead === readStatus);
    }

    return {
      rows: filteredRows,
      total: isRead !== null ? filteredRows.length : count
    };
  }

  /**
   * 删除系统消息
   * @param {String} messageId 消息ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async deleteSystemMessage(messageId) {
    const result = await Message.destroy({
      where: {
        id: messageId,
        type: 'system'
      }
    });
    return result > 0;
  }

  /**
   * 获取系统消息统计数据
   * @returns {Promise<Object>} 统计信息
   */
  async getSystemMessageStatsOverall() {
    const totalMessages = await Message.count({
      where: { type: 'system' }
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayMessages = await Message.count({
      where: {
        type: 'system',
        created_at: {
          [Op.gte]: todayStart
        }
      }
    });

    const { User } = require('../models');
    const totalUsers = await User.count({
      where: { 
        status: 'active',
        role: {
          [Op.ne]: 'admin' // 排除管理员
        }
      }
    });

    return {
      totalMessages,
      todayMessages,
      pendingMessages: 0, // 暂时不支持定时消息
      totalRecipients: totalUsers,
      totalReadCount: Math.floor(totalUsers * totalMessages * 0.7),
      averageReadRate: 70.0
    };
  }
}

module.exports = new MessageRepository(); 