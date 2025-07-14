const { User, Message, Post } = require('../models/associations');
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// 获取消息列表
exports.getMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type } = req.query;
  const userId = req.user.id;
  
  // 分页参数处理
  const offset = (page - 1) * limit;
  
  // 查询条件
  const whereCondition = {
    recipientId: userId
  };
  
  // 如果指定了消息类型，添加到查询条件
  if (type && type !== 'all') {
    whereCondition.type = type;
  }
  
  // 查询消息列表
  const messages = await Message.findAll({
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
  
  // 查询消息总数
  const total = await Message.count({
    where: whereCondition
  });
  
  // 格式化消息，确保发送者信息正确
  const formattedMessages = messages.map(message => {
    const messageObj = message.toJSON();
    
    // 确保时间格式正确
    if (messageObj.created_at) {
      messageObj.createdAt = messageObj.created_at;
    }
    
    // 确保ID正确映射
    if (messageObj.post_id) {
      messageObj.postId = messageObj.post_id;
    }
    
    if (messageObj.comment_id) {
      messageObj.commentId = messageObj.comment_id;
    }
    
    if (messageObj.is_read !== undefined) {
      messageObj.isRead = messageObj.is_read;
    }
    
    return messageObj;
  });
  
  // 获取未读消息数
  const unreadCount = await getUnreadMessageCount(userId);
  
  res.json({
    success: true,
    data: {
      messages: formattedMessages,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// 获取消息详情
exports.getMessageDetail = asyncHandler(async (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;
  
  // 查询消息详情
  const message = await Message.findOne({
    where: {
      id: messageId,
      recipientId: userId
    },
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }
    ]
  });
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: '消息不存在或已被删除'
    });
  }
  
  // 查询相关消息（同一发送者的其他消息）
  const relatedMessages = await Message.findAll({
    where: {
      recipientId: userId,
      senderId: message.senderId,
      id: { [Op.ne]: messageId } // 排除当前消息
    },
    order: [['created_at', 'DESC']],
    limit: 5,
    attributes: ['id', 'title', 'content', 'created_at']
  });
  
  res.json({
    success: true,
    data: {
      message,
      relatedMessages
    }
  });
});

// 标记消息为已读 - 完全不使用事务
exports.markAsRead = asyncHandler(async (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;
  
  console.log(`========== 开始标记消息为已读 ==========`);
  console.log(`消息ID=${messageId}, 用户ID=${userId}`);
  
  try {
    // 查找消息
    const message = await Message.findOne({
      where: {
        id: messageId,
        recipientId: userId
      }
    });
    
    if (!message) {
      console.log(`未找到消息：ID=${messageId}`);
      return res.status(404).json({
        success: false,
        message: '消息不存在或已被删除'
      });
    }
    
    console.log(`找到消息: ID=${message.id}, 类型=${message.type}, 已读状态=${message.isRead}`);
    
    // 如果消息尚未标记为已读，则更新状态
    if (!message.isRead) {
      console.log(`正在将消息标记为已读...`);
      message.isRead = true;
      await message.save();
      console.log(`消息已成功标记为已读`);
    } else {
      console.log(`消息已经是已读状态，跳过消息状态更新`);
    }
    
    // ===== 无论消息状态如何，都处理系统通知 =====
    if (message.type === 'system' && message.data) {
      console.log(`处理系统通知...`);
      
      // 安全解析消息数据
      let notificationId = null;
      try {
        const messageData = typeof message.data === 'string' 
          ? JSON.parse(message.data) 
          : message.data;
        
        console.log(`消息数据:`, messageData);
        notificationId = messageData?.notification_id;
        console.log(`通知ID: ${notificationId || '无'}`);
      } catch (parseError) {
        console.error(`解析消息数据失败:`, parseError);
      }
      
      // 如果有通知ID，尝试更新通知接收者记录
      if (notificationId) {
        try {
          // 导入模型
          const { NotificationRecipient } = require('../models/associations');
          
          const recipient = await NotificationRecipient.findOne({
            where: {
              notificationId: notificationId,
              recipientId: userId
            }
          });
          
          console.log(`查询通知接收者: ${recipient ? '找到' : '未找到'}`);
          
          // 检查通知接收者记录的已读状态
          let isAlreadyRead = false;
          if (recipient) {
            isAlreadyRead = recipient.isRead === true;
            console.log(`通知接收者记录已读状态: ${isAlreadyRead ? '已读' : '未读'}`);
          }
          
          if (recipient && !isAlreadyRead) {
            // 更新通知接收者为已读状态
            recipient.isRead = true;
            recipient.readAt = new Date();
            
            if ('status' in recipient.dataValues) {
              recipient.status = 'read';
            }
            
            await recipient.save();
            console.log(`通知接收者记录已更新为已读`);
            
            // 手动执行SQL更新已读计数
            try {
              const [results] = await sequelize.query(
                'UPDATE system_notifications SET read_count = read_count + 1 WHERE id = ? AND read_count < total_count',
                {
                  replacements: [notificationId],
                  type: sequelize.QueryTypes.UPDATE
                }
              );
              console.log(`系统通知已读计数更新结果:`, results);
            } catch (sqlError) {
              console.error(`更新系统通知已读计数失败:`, sqlError);
              // 继续执行，不因为这个步骤失败而中断整个流程
            }
          } else if (recipient) {
            // 如果通知接收者已经是已读状态，尝试重新确认系统通知的已读计数
            console.log(`通知接收者记录已经是已读状态，检查系统通知已读计数是否需要更新`);
            
            try {
              // 先查询系统通知，检查已读计数
              const [notifications] = await sequelize.query(
                'SELECT id, read_count, total_count FROM system_notifications WHERE id = ?',
                {
                  replacements: [notificationId],
                  type: sequelize.QueryTypes.SELECT
                }
              );
              
              if (notifications && notifications.length > 0) {
                const notification = notifications[0];
                console.log(`系统通知状态: ID=${notification.id}, 已读计数=${notification.read_count}, 总计数=${notification.total_count}`);
                
                // 查询所有已读接收者的数量
                const [readCount] = await sequelize.query(
                  'SELECT COUNT(*) as count FROM notification_recipients WHERE notification_id = ? AND is_read = true',
                  {
                    replacements: [notificationId],
                    type: sequelize.QueryTypes.SELECT
                  }
                );
                
                console.log(`实际已读接收者数量: ${readCount.count}`);
                
                // 如果已读计数不匹配，修正系统通知已读计数
                if (readCount.count !== notification.read_count) {
                  console.log(`发现已读计数不一致，正在修正: ${notification.read_count} -> ${readCount.count}`);
                  const [updateResult] = await sequelize.query(
                    'UPDATE system_notifications SET read_count = ? WHERE id = ?',
                    {
                      replacements: [readCount.count, notificationId],
                      type: sequelize.QueryTypes.UPDATE
                    }
                  );
                  console.log(`系统通知已读计数修正结果:`, updateResult);
                }
              }
            } catch (countError) {
              console.error(`检查系统通知已读计数失败:`, countError);
            }
          } else {
            console.log(`未找到对应的通知接收者记录`);
          }
        } catch (recipientError) {
          // 捕获但不中断，记录错误
          console.error(`处理通知接收者记录时出错:`, recipientError);
          // 继续执行后续代码，因为主消息已经标记为已读
        }
      }
    }
    
    console.log(`========== 标记消息为已读完成 ==========`);
    return res.json({
      success: true,
      message: '消息已标记为已读'
    });
  } catch (error) {
    console.error(`标记消息为已读失败:`, error);
    console.error(`错误堆栈:`, error.stack);
    
    res.status(500).json({
      success: false,
      message: '标记消息为已读失败',
      error: error.message
    });
    console.log(`========== 标记消息为已读失败 ==========`);
  }
});

// 标记所有消息为已读
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { type } = req.body;
  
  // 构建查询条件
  const whereCondition = {
    recipientId: userId,
    isRead: false
  };
  
  // 如果指定了消息类型，添加到查询条件
  if (type && type !== 'all') {
    whereCondition.type = type;
  }
  
  // 批量更新为已读
  await Message.update(
    { isRead: true },
    { where: whereCondition }
  );
  
  res.json({
    success: true,
    message: '所有消息已标记为已读'
  });
});

// 删除单条消息
exports.deleteMessage = asyncHandler(async (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;
  
  // 查找消息
  const message = await Message.findOne({
    where: {
      id: messageId,
      recipientId: userId
    }
  });
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: '消息不存在或已被删除'
    });
  }
  
  // 软删除消息
  await message.destroy();
  
  res.json({
    success: true,
    message: '消息已删除'
  });
});

// 删除所有消息
exports.deleteAllMessages = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { type } = req.body;
  
  // 构建查询条件
  const whereCondition = {
    recipientId: userId
  };
  
  // 如果指定了消息类型，添加到查询条件
  if (type && type !== 'all') {
    whereCondition.type = type;
  }
  
  // 查找所有符合条件的消息
  const messages = await Message.findAll({
    where: whereCondition
  });
  
  // 批量软删除
  for (const message of messages) {
    await message.destroy();
  }
  
  res.json({
    success: true,
    message: '消息已全部清空'
  });
});

// 获取未读消息数
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // 获取未读消息统计
  const unreadCount = await getUnreadMessageCount(userId);
  
  res.json({
    success: true,
    data: unreadCount
  });
});

// 辅助函数：获取未读消息统计
async function getUnreadMessageCount(userId) {
  // 获取所有未读消息总数
  const total = await Message.count({
    where: {
      recipientId: userId,
      isRead: false
    }
  });
  
  // 按类型分别统计
  const comment = await Message.count({
    where: {
      recipientId: userId,
      type: 'comment',
      isRead: false
    }
  });
  
  const like = await Message.count({
    where: {
      recipientId: userId,
      type: 'like',
      isRead: false
    }
  });
  
  const system = await Message.count({
    where: {
      recipientId: userId,
      type: 'system',
      isRead: false
    }
  });
  
  const mention = await Message.count({
    where: {
      recipientId: userId,
      type: 'mention',
      isRead: false
    }
  });
  
  return {
    total,
    comment,
    like,
    system,
    mention
  };
} 