const { User, SystemNotification, NotificationRecipient } = require('../models/associations');
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * 获取系统通知列表
 * @route GET /api/admin/messages/system
 * @access Admin
 */
exports.getSystemMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type, searchQuery, startDate, endDate } = req.query;
  
  // 分页参数处理
  const offset = (page - 1) * limit;
  
  // 查询条件
  const whereCondition = {};
  
  // 如果指定了通知类型，添加到查询条件
  if (type) {
    whereCondition.type = type;
  }
  
  // 如果有搜索关键词，添加到查询条件
  if (searchQuery) {
    whereCondition.title = {
      [Op.like]: `%${searchQuery}%`
    };
  }
  
  // 如果有日期范围，添加到查询条件
  if (startDate && endDate) {
    whereCondition.created_at = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }
  
  // 查询通知列表
  const notifications = await SystemNotification.findAll({
    where: whereCondition,
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  // 查询通知总数
  const total = await SystemNotification.count({
    where: whereCondition
  });
  
  // 格式化通知数据
  const formattedNotifications = notifications.map(notification => {
    const notificationObj = notification.toJSON();
    
    // 确保发送者信息正确显示
    if (notificationObj.sender) {
      notificationObj.sender = notificationObj.sender.nickname || notificationObj.sender.username;
    }
    
    // 调试日志
    console.log('原始通知对象:', JSON.stringify({
      id: notificationObj.id,
      title: notificationObj.title,
      readCount: notificationObj.readCount,
      read_count: notificationObj.read_count,
      totalCount: notificationObj.totalCount,
      total_count: notificationObj.total_count
    }));
    
    return {
      id: notificationObj.id,
      title: notificationObj.title,
      type: notificationObj.type,
      sender: notificationObj.sender || '系统',
      targetGroup: notificationObj.targetGroup || notificationObj.target_group,
      sendTime: notificationObj.scheduledAt || notificationObj.scheduled_at || notificationObj.created_at,
      readCount: parseInt(notificationObj.readCount || notificationObj.read_count || 0),
      totalCount: parseInt(notificationObj.totalCount || notificationObj.total_count || 0),
      content: notificationObj.content
    };
  });
  
  // 调试整体响应
  console.log('响应通知列表:', formattedNotifications.map(item => ({
    id: item.id, 
    title: item.title, 
    readCount: item.readCount, 
    totalCount: item.totalCount
  })));
  
  res.json({
    success: true,
    data: {
      rows: formattedNotifications,
      total: total
    }
  });
});

/**
 * 获取系统通知详情
 * @route GET /api/admin/messages/system/:id
 * @access Admin
 */
exports.getSystemMessageDetail = asyncHandler(async (req, res) => {
  const messageId = req.params.id;
  
  // 查询通知详情
  const notification = await SystemNotification.findByPk(messageId, {
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }
    ]
  });
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: '系统通知不存在或已被删除'
    });
  }
  
  // 格式化通知数据
  const notificationData = notification.toJSON();
  
  // 确保发送者信息正确显示
  if (notificationData.sender) {
    notificationData.sender = notificationData.sender.nickname || notificationData.sender.username;
  }
  
  // 添加调试日志
  console.log('通知详情原始数据:', JSON.stringify({
    id: notificationData.id,
    title: notificationData.title,
    readCount: notificationData.readCount,
    read_count: notificationData.read_count,
    totalCount: notificationData.totalCount, 
    total_count: notificationData.total_count
  }));
  
  res.json({
    success: true,
    data: {
      id: notificationData.id,
      title: notificationData.title,
      type: notificationData.type,
      sender: notificationData.sender || '系统',
      targetGroup: notificationData.targetGroup || notificationData.target_group,
      sendTime: notificationData.scheduledAt || notificationData.scheduled_at || notificationData.created_at,
      readCount: parseInt(notificationData.readCount || notificationData.read_count || 0),
      totalCount: parseInt(notificationData.totalCount || notificationData.total_count || 0),
      content: notificationData.content
    }
  });
});

/**
 * 获取系统通知接收者列表
 * @route GET /api/admin/messages/system/:id/recipients
 * @access Admin
 */
exports.getSystemMessageRecipients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, isRead } = req.query;
  const messageId = req.params.id;
  
  // 分页参数处理
  const offset = (page - 1) * limit;
  
  // 查询条件
  const whereCondition = {
    notificationId: messageId
  };
  
  // 如果指定了已读状态，添加到查询条件
  if (isRead !== undefined) {
    whereCondition.isRead = isRead === 'true';
  }
  
  // 查询接收者列表
  const recipients = await NotificationRecipient.findAll({
    where: whereCondition,
    include: [
      {
        model: User,
        as: 'recipient',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  // 查询总数
  const total = await NotificationRecipient.count({
    where: whereCondition
  });
  
  // 格式化接收者数据
  const formattedRecipients = recipients.map(recipient => {
    const recipientObj = recipient.toJSON();
    
    return {
      id: recipientObj.id,
      userId: recipientObj.recipient.id,
      username: recipientObj.recipient.username,
      nickname: recipientObj.recipient.nickname || recipientObj.recipient.username,
      avatar: recipientObj.recipient.avatar,
      isRead: recipientObj.isRead,
      readAt: recipientObj.readAt
    };
  });
  
  res.json({
    success: true,
    data: {
      rows: formattedRecipients,
      total: total
    }
  });
});

/**
 * 创建系统通知
 * @route POST /api/admin/messages/system
 * @access Admin
 */
exports.createSystemMessage = asyncHandler(async (req, res) => {
  const { title, content, type, targetGroup, specificUsers, sendNow, scheduledTime } = req.body;
  const senderId = req.user.id;
  
  // 使用事务确保数据一致性
  const transaction = await sequelize.transaction();
  
  try {
    // 创建系统通知
    const notification = await SystemNotification.create({
      title,
      content,
      type: type || 'announcement',
      senderId,
      targetGroup: targetGroup || 'all',
      scheduledTime: !sendNow ? scheduledTime : null,
      sent: sendNow,
      readCount: 0,
      totalCount: 0
    }, { transaction });
    
    // 查询接收者用户列表
    let recipients = [];
    
    if (targetGroup === 'specific' && specificUsers && specificUsers.length > 0) {
      // 指定用户
      recipients = await User.findAll({
        where: {
          id: {
            [Op.in]: specificUsers
          }
        }
      });
    } else {
      // 其他目标组（全部用户、新用户、活跃用户等）
      const whereCondition = {};
      
      if (targetGroup === 'new') {
        // 例如：一周内注册的新用户
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        whereCondition.created_at = {
          [Op.gte]: oneWeekAgo
        };
      } else if (targetGroup === 'active') {
        // 例如：一个月内有活动的用户（登录、发帖、评论等）
        // 这里简化处理，实际可能需要更复杂的查询
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        whereCondition.last_active_at = {
          [Op.gte]: oneMonthAgo
        };
      }
      
      recipients = await User.findAll({
        where: whereCondition
      });
    }
    
    // 更新通知的接收者总数
    notification.totalCount = recipients.length;
    await notification.save({ transaction });
    
    // 创建通知-接收者关联记录
    if (recipients.length > 0) {
      const recipientRecords = recipients.map(user => ({
        notificationId: notification.id,
        recipientId: user.id,
        isRead: false,
        readAt: null,
        status: 'delivered',
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      await NotificationRecipient.bulkCreate(recipientRecords, { transaction });
      
      // 同步创建用户消息记录
      const Message = require('../models/associations').Message;
      const messageRecords = recipients.map(user => {
        // 设置通知类型映射关系
        let messageType = 'system'; // 默认为系统类型
        
        // 将后台通知类型映射到前端适当的类型
        // Message.js 中允许的类型: 'system', 'comment', 'like', 'mention'
        // 但前台管理系统创建的类型: 'announcement', 'event', 'reminder', 'warning', 'other'
        // 所以这里统一都映射为system，但在data字段中保留原始类型以便前端自行处理
        
        return {
          senderId: senderId,
          recipientId: user.id,
          type: messageType,
          title: title,
          content: content,
          isRead: false,
          data: {
            notification_id: notification.id,
            notification_type: type || 'announcement',
            importance: notification.importance || 'normal'
          }
        };
      });
      
      // 批量创建用户消息
      await Message.bulkCreate(messageRecords, { transaction });
    }
    
    // 提交事务
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: '系统通知创建成功',
      data: {
        id: notification.id,
        title: notification.title,
        recipientsCount: recipients.length
      }
    });
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    
    console.error('创建系统通知失败:', error);
    res.status(500).json({
      success: false,
      message: '创建系统通知失败',
      error: error.message
    });
  }
});

/**
 * 删除系统通知
 * @route DELETE /api/admin/messages/system/:id
 * @access Admin
 */
exports.deleteSystemMessage = asyncHandler(async (req, res) => {
  const messageId = req.params.id;
  
  // 使用事务确保数据一致性
  const transaction = await sequelize.transaction();
  
  try {
    // 查找通知
    const notification = await SystemNotification.findByPk(messageId);
    
    if (!notification) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '系统通知不存在或已被删除'
      });
    }
    
    // 删除关联的接收者记录 - 使用 force: true 进行真正删除
    await NotificationRecipient.destroy({
      where: {
        notificationId: messageId
      },
      force: true,  // 真正删除记录而不是软删除
      transaction
    });
    
    // 软删除通知
    await notification.destroy({ transaction });
    
    // 提交事务
    await transaction.commit();
    
    res.json({
      success: true,
      message: '系统通知已删除'
    });
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    
    console.error('删除系统通知失败:', error);
    res.status(500).json({
      success: false,
      message: '删除系统通知失败',
      error: error.message
    });
  }
});

/**
 * 用于搜索用户（创建系统通知时选择用户）
 * @route GET /api/admin/users/search
 * @access Admin
 */
exports.searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.trim() === '') {
    return res.json({
      success: true,
      data: []
    });
  }
  
  // 搜索用户
  const users = await User.findAll({
    where: {
      [Op.or]: [
        {
          username: {
            [Op.like]: `%${query}%`
          }
        },
        {
          nickname: {
            [Op.like]: `%${query}%`
          }
        },
        {
          email: {
            [Op.like]: `%${query}%`
          }
        }
      ]
    },
    attributes: ['id', 'username', 'nickname', 'avatar'],
    limit: 10
  });
  
  // 格式化搜索结果
  const formattedUsers = users.map(user => ({
    value: user.id,
    label: user.nickname ? `${user.nickname} (${user.username})` : user.username,
    avatar: user.avatar
  }));
  
  res.json({
    success: true,
    data: formattedUsers
  });
});

/**
 * 获取系统通知统计信息
 * @route GET /api/admin/messages/system/stats
 * @access Admin
 */
exports.getSystemMessageStats = asyncHandler(async (req, res) => {
  // 获取通知总数
  const total = await SystemNotification.count();
  
  // 获取不同类型通知的数量
  const byType = await SystemNotification.findAll({
    attributes: ['type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['type']
  });
  
  // 获取最近7天的通知发送趋势
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const dailyStats = await SystemNotification.findAll({
    attributes: [
      [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where: {
      created_at: {
        [Op.gte]: sevenDaysAgo
      }
    },
    group: [sequelize.fn('DATE', sequelize.col('created_at'))]
  });
  
  // 获取阅读率最高的通知
  const topRead = await SystemNotification.findAll({
    attributes: [
      'id', 'title', 'read_count', 'total_count',
      [sequelize.literal('(read_count / total_count * 100)'), 'readRate']
    ],
    where: {
      total_count: {
        [Op.gt]: 0
      }
    },
    order: [[sequelize.literal('readRate'), 'DESC']],
    limit: 5
  });
  
  // 格式化统计数据
  const typeStats = {};
  byType.forEach(item => {
    const { type, count } = item.toJSON();
    typeStats[type] = count;
  });
  
  const trends = {};
  dailyStats.forEach(item => {
    const { date, count } = item.toJSON();
    trends[date] = count;
  });
  
  res.json({
    success: true,
    data: {
      total,
      byType: typeStats,
      trends,
      topRead: topRead.map(item => ({
        id: item.id,
        title: item.title,
        readCount: item.read_count,
        totalCount: item.total_count,
        readRate: parseFloat((item.read_count / item.total_count * 100).toFixed(2))
      }))
    }
  });
}); 