const messageRepository = require('../repositories/message.repository');
const userRepository = require('../repositories/user.repository');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const errorCodes = require('../constants/error-codes');
const { WebSocketService, redisClient } = require('../utils');
const logger = require('../../config/logger');

/**
 * 消息服务层
 */
class MessageService {
  /**
   * 创建消息
   * @param {Object} messageData 消息数据
   * @returns {Promise<Object>} 创建的消息对象
   */
  async createMessage(messageData) {
    logger.info('🔔 [MessageService] 开始创建消息:', JSON.stringify(messageData, null, 2));
    
    // 检查接收者是否存在
    const receiver = await userRepository.findById(messageData.receiver_id);
    if (!receiver) {
      throw ErrorMiddleware.createError(
        '接收者不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    logger.info('✅ [MessageService] 接收者存在:', receiver.username);
    
    // 如果有发送者，检查发送者是否存在
    if (messageData.sender_id) {
      const sender = await userRepository.findById(messageData.sender_id);
      if (!sender) {
        throw ErrorMiddleware.createError(
          '发送者不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.USER_NOT_EXIST
        );
      }
      logger.info('✅ [MessageService] 发送者存在:', sender.username);
    }
    
    // 创建消息
    logger.info('📝 [MessageService] 正在创建消息记录...');
    const message = await messageRepository.create(messageData);
    logger.info('✅ [MessageService] 消息创建成功:', {
      id: message.id,
      type: message.type,
      title: message.title,
      receiver_id: message.receiver_id,
      sender_id: message.sender_id
    });
    
    // 更新未读消息计数
    logger.info('📊 [MessageService] 正在更新未读计数...');
    await this._incrementUnreadCount(messageData.receiver_id);
    logger.info('✅ [MessageService] 未读计数更新完成');
    
    // 发送实时通知
    logger.info('📤 [MessageService] 准备发送WebSocket实时通知...');
    this._sendRealTimeNotification(message);
    
    return message;
  }

  /**
   * 获取消息详情
   * @param {String} id 消息ID
   * @param {String} userId 当前用户ID
   * @returns {Promise<Object>} 消息对象
   */
  async getMessageById(id, userId) {
    const message = await messageRepository.findById(id);
    
    if (!message) {
      throw ErrorMiddleware.createError(
        '消息不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.MESSAGE_NOT_EXIST
      );
    }
    
    // 检查权限，只有接收者可以查看消息
    if (message.receiver_id !== userId) {
      throw ErrorMiddleware.createError(
        '无权限查看该消息',
        StatusCodes.FORBIDDEN,
        errorCodes.NO_PERMISSION
      );
    }
    
    // 如果消息未读，标记为已读
    if (!message.is_read) {
      await messageRepository.markAsRead(id);
      message.is_read = true;
      // 减少未读消息计数
      await this._decrementUnreadCount(userId);
    }
    
    return message;
  }

  /**
   * 获取用户消息列表
   * @param {String} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async getUserMessages(userId, options = {}) {
    // 检查用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }

    // 如果是获取私信对话列表
    if (options.conversationList && options.type === 'private') {
      return await messageRepository.findPrivateConversations(userId, options);
    }

    // 如果是获取与特定用户的私信对话
    if (options.conversationWith && options.type === 'private') {
      return await messageRepository.findPrivateConversation(userId, options.conversationWith, options);
    }
    
    return await messageRepository.findByUserId(userId, options);
  }

  /**
   * 标记消息为已读
   * @param {String} id 消息ID
   * @param {String} userId 当前用户ID
   * @returns {Promise<Boolean>} 是否成功
   */
  async markAsRead(id, userId) {
    const message = await messageRepository.findById(id);
    
    if (!message) {
      throw ErrorMiddleware.createError(
        '消息不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.MESSAGE_NOT_EXIST
      );
    }
    
    // 检查权限，只有接收者可以标记消息
    if (message.receiver_id !== userId) {
      throw ErrorMiddleware.createError(
        '无权限操作该消息',
        StatusCodes.FORBIDDEN,
        errorCodes.NO_PERMISSION
      );
    }
    
    // 如果已读，无需重复操作
    if (message.is_read) {
      return true;
    }
    
    const result = await messageRepository.markAsRead(id);
    if (result) {
      // 减少未读消息计数
      await this._decrementUnreadCount(userId);
    }
    
    return result;
  }

  /**
   * 批量标记消息为已读
   * @param {String} userId 当前用户ID
   * @param {Array<String>} ids 消息ID数组，为空则标记所有消息
   * @param {String} type 消息类型，可选，如果指定则按类型标记
   * @returns {Promise<Object>} 操作结果
   */
  async markMultipleAsRead(userId, ids = [], type = null) {
    // 检查用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    const count = await messageRepository.markMultipleAsRead(userId, ids, type);
    
    if (count > 0) {
      // 如果是按类型或按ID标记，需要重新计算未读数量
      if (type || (ids && ids.length > 0)) {
        const remainingUnread = await messageRepository.countUnread(userId);
        await this._setUnreadCount(userId, remainingUnread);
      } else {
        // 如果是标记所有消息，直接重置为0
        await this._resetUnreadCount(userId);
      }
      
      // 发送未读消息计数更新
      this._sendUnreadCountUpdate(userId);
    }
    
    return {
      success: true,
      count,
      message: type ? `已成功标记${count}条${type}消息为已读` : `已成功标记${count}条消息为已读`
    };
  }

  /**
   * 删除消息
   * @param {String} id 消息ID
   * @param {String} userId 当前用户ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async deleteMessage(id, userId) {
    const message = await messageRepository.findById(id);
    
    if (!message) {
      throw ErrorMiddleware.createError(
        '消息不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.MESSAGE_NOT_EXIST
      );
    }
    
    // 检查权限，只有接收者可以删除消息
    if (message.receiver_id !== userId) {
      throw ErrorMiddleware.createError(
        '无权限删除该消息',
        StatusCodes.FORBIDDEN,
        errorCodes.NO_PERMISSION
      );
    }
    
    const result = await messageRepository.delete(id);
    
    if (result && !message.is_read) {
      // 如果删除的是未读消息，减少未读消息计数
      await this._decrementUnreadCount(userId);
    }
    
    return result;
  }

  /**
   * 批量删除消息
   * @param {String} userId 当前用户ID
   * @param {Array<String>} ids 消息ID数组，为空则删除所有消息
   * @returns {Promise<Object>} 操作结果
   */
  async deleteMultiple(userId, ids = []) {
    // 检查用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    // 如果有特定的ID列表，我们需要先检查有多少未读消息会被删除
    let unreadCount = 0;
    if (ids && ids.length > 0) {
      for (const id of ids) {
        const message = await messageRepository.findById(id);
        if (message && !message.is_read && message.receiver_id === userId) {
          unreadCount++;
        }
      }
    } else {
      // 如果删除所有消息，获取当前未读消息数量
      unreadCount = await this.getUnreadCount(userId);
    }
    
    const count = await messageRepository.deleteMultiple(userId, ids);
    
    if (count > 0 && unreadCount > 0) {
      // 如果删除了未读消息，更新未读消息计数
      if (ids && ids.length > 0) {
        // 减少特定数量
        await this._decrementUnreadCount(userId, unreadCount);
      } else {
        // 重置为0
        await this._resetUnreadCount(userId);
      }
      
      // 发送未读消息计数更新
      this._sendUnreadCountUpdate(userId);
    }
    
    return {
      success: true,
      count,
      message: `已成功删除${count}条消息`
    };
  }

  /**
   * 获取用户未读消息数量
   * @param {String} userId 用户ID
   * @param {String} type 消息类型，可选
   * @returns {Promise<Number>} 未读消息数量
   */
  async getUnreadCount(userId, type = null) {
    // 检查用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    // 如果指定了类型，使用数据库查询
    if (type) {
      return await messageRepository.countUnread(userId, type);
    }
    
    // 否则尝试从缓存获取
    try {
      const cachedCount = await redisClient.get(`unread:${userId}`);
      if (cachedCount !== null) {
        return parseInt(cachedCount, 10);
      }
    } catch (error) {
      // 忽略缓存错误，回退到数据库查询
    }
    
    // 从数据库获取并更新缓存
    const count = await messageRepository.countUnread(userId);
    await this._setUnreadCount(userId, count);
    
    return count;
  }

  /**
   * 减少用户未读消息计数（公共方法）
   * @param {String} userId 用户ID
   * @param {Number} value 减少值，默认为1
   * @returns {Promise<void>}
   */
  async decrementUnreadCount(userId, value = 1) {
    await this._decrementUnreadCount(userId, value);
  }

  /**
   * 增加未读消息计数
   * @param {String} userId 用户ID
   * @param {Number} value 增加值，默认为1
   * @private
   */
  async _incrementUnreadCount(userId, value = 1) {
    try {
      const currentCount = await redisClient.get(`unread:${userId}`);
      const newCount = currentCount ? parseInt(currentCount, 10) + value : value;
      await redisClient.set(`unread:${userId}`, newCount.toString());
      
      // 发送未读消息计数更新
      this._sendUnreadCountUpdate(userId);
    } catch (error) {
      // 忽略缓存错误
    }
  }

  /**
   * 减少未读消息计数
   * @param {String} userId 用户ID
   * @param {Number} value 减少值，默认为1
   * @private
   */
  async _decrementUnreadCount(userId, value = 1) {
    try {
      const currentCount = await redisClient.get(`unread:${userId}`);
      if (!currentCount) return;
      
      const newCount = Math.max(0, parseInt(currentCount, 10) - value);
      await redisClient.set(`unread:${userId}`, newCount.toString());
      
      // 发送未读消息计数更新
      this._sendUnreadCountUpdate(userId);
    } catch (error) {
      // 忽略缓存错误
    }
  }

  /**
   * 设置未读消息计数
   * @param {String} userId 用户ID
   * @param {Number} count 计数值
   * @private
   */
  async _setUnreadCount(userId, count) {
    try {
      await redisClient.set(`unread:${userId}`, count.toString());
    } catch (error) {
      // 忽略缓存错误
    }
  }

  /**
   * 重置未读消息计数为0
   * @param {String} userId 用户ID
   * @private
   */
  async _resetUnreadCount(userId) {
    try {
      await redisClient.set(`unread:${userId}`, '0');
    } catch (error) {
      // 忽略缓存错误
    }
  }

  /**
   * 清除用户的未读计数缓存，强制重新计算
   * @param {String} userId 用户ID
   * @private
   */
  async _clearUnreadCount(userId) {
    try {
      await redisClient.del(`unread:${userId}`);
      logger.info(`🧹 [MessageService] 已清除用户 ${userId} 的未读计数缓存`);
    } catch (error) {
      logger.error(`❌ [MessageService] 清除用户 ${userId} 缓存失败:`, error);
    }
  }

  /**
   * 发送未读消息计数更新
   * @param {String} userId 用户ID
   * @private
   */
  async _sendUnreadCountUpdate(userId) {
    try {
      // 清除缓存，强制重新计算（确保包含最新的系统通知）
      await this._clearUnreadCount(userId);
      
      // 实时重新计算未读计数，确保准确性
      const count = await this.getUnreadCount(userId);
      
      // 发送计数更新
      WebSocketService.sendToUser(userId, {
        type: 'unread_count',
        count: count
      });
      
      logger.info(`📊 [MessageService] 发送未读计数更新给用户 ${userId}: ${count}`);
    } catch (error) {
      logger.error(`❌ [MessageService] 发送未读计数失败 ${userId}:`, error);
      // 忽略发送错误
    }
  }

  /**
   * 广播系统通知给所有用户
   * @param {Object} message 系统消息对象
   * @private
   */
  async _broadcastSystemNotification(message) {
    try {
      logger.info('📡 [MessageService] 广播系统通知:', message.title);
      
      // 构造广播消息
      const broadcastData = {
        type: 'new_message',
        message: {
          id: message.id,
          type: message.type,
          sub_type: message.sub_type,
          title: message.title,
          content: message.content,
          sender_id: message.sender_id,
          created_at: message.createdAt
        }
      };
      
      // 通过WebSocket广播给所有连接的用户
      WebSocketService.broadcast(broadcastData);
      
      logger.info('✅ [MessageService] 系统通知广播成功');
    } catch (error) {
      logger.error('❌ [MessageService] 广播系统通知失败:', error);
      // 不抛出错误，避免影响消息创建流程
    }
  }

  /**
   * 更新所有用户的未读计数（系统通知会影响所有用户的计数）
   * @private
   */
  async _updateAllUsersUnreadCount() {
    try {
      logger.info('🔄 [MessageService] 更新所有用户的未读计数');
      
      // 获取所有活跃用户
      const userRepository = require('../repositories/user.repository');
      const activeUsers = await userRepository.findAllActive();
      
      logger.info(`📊 [MessageService] 找到 ${activeUsers.length} 个活跃用户需要更新`);
      
      // 为每个用户重新计算并更新未读计数
      for (const user of activeUsers) {
        try {
          // 先清除Redis缓存，强制重新计算
          await this._clearUnreadCount(user.id);
          
          // 重新计算未读计数（这会调用数据库查询）
          const newCount = await this.getUnreadCount(user.id);
          
          logger.info(`📊 [MessageService] 更新用户 ${user.username}(${user.id}) 未读计数: ${newCount}`);
          
          // 直接发送计算出的计数，避免从Redis读取时的时序问题
          WebSocketService.sendToUser(user.id, {
            type: 'unread_count',
            count: newCount
          });
        } catch (userError) {
          logger.error(`❌ [MessageService] 更新用户 ${user.id} 计数失败:`, userError);
        }
      }
      
      logger.info(`✅ [MessageService] 已更新 ${activeUsers.length} 个用户的未读计数`);
    } catch (error) {
      logger.error('❌ [MessageService] 更新所有用户未读计数失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 发送实时通知
   * @param {Object} message 消息对象
   * @private
   */
  async _sendRealTimeNotification(message) {
    try {
      // 获取发送者信息
      let senderInfo = null;
      if (message.sender_id) {
        const sender = await userRepository.findById(message.sender_id);
        if (sender) {
          senderInfo = {
            id: sender.id,
            username: sender.username,
            nickname: sender.nickname,
            avatar: sender.avatar
          };
        }
      }
      
      // 构造消息数据
      const notificationData = {
        type: 'new_message',
        message: {
          id: message.id,
          type: message.type,
          title: message.title,
          content: message.content,
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          post_id: message.post_id,
          sender: senderInfo,
          createdAt: message.createdAt,
          is_read: false // 新消息默认为未读
        }
      };
      
      // 发送通知（不再检查在线状态，直接尝试发送）
      const success = WebSocketService.sendToUser(message.receiver_id, notificationData);
      
      if (success) {
        logger.info(`✅ WebSocket通知发送成功: ${message.type} -> 用户${message.receiver_id}`);
      } else {
        logger.info(`⚠️ WebSocket通知发送失败（用户可能离线）: ${message.type} -> 用户${message.receiver_id}`);
      }
    } catch (error) {
      logger.error('发送WebSocket通知时出错:', error);
    }
  }

  // ==================== 系统消息管理方法 ====================

  /**
   * 获取系统消息列表（管理员使用）
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async getSystemMessages(options = {}) {
    logger.info('📋 [MessageService] 获取系统消息列表:', options);
    
    try {
      const result = await messageRepository.findSystemMessages(options);
      logger.info(`✅ [MessageService] 获取系统消息成功，共 ${result.total} 条`);
      return result;
    } catch (error) {
      logger.error('❌ [MessageService] 获取系统消息失败:', error);
      throw ErrorMiddleware.createError(
        '获取系统消息失败',
        StatusCodes.INTERNAL_SERVER_ERROR,
        errorCodes.DATABASE_ERROR
      );
    }
  }

  /**
   * 获取系统消息详情
   * @param {String} messageId 消息ID
   * @returns {Promise<Object>} 消息详情
   */
  async getSystemMessageDetail(messageId) {
    logger.info('🔍 [MessageService] 获取系统消息详情:', messageId);
    
    try {
      const message = await messageRepository.findById(messageId);
      
      if (!message || message.type !== 'system') {
        throw ErrorMiddleware.createError(
          '系统消息不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.MESSAGE_NOT_EXIST
        );
      }
      
      // 获取阅读统计
      const readStats = await messageRepository.getSystemMessageStats(messageId);
      
      const result = {
        id: message.id,
        title: message.title,
        content: message.content,
        type: messageRepository.extractMessageType(message.title),
        sender: message.sender ? message.sender.nickname || message.sender.username : '系统管理员',
        targetGroup: '所有用户',
        sendTime: message.createdAt,
        readCount: readStats.readCount,
        totalCount: readStats.totalCount,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      };
      
      logger.info('✅ [MessageService] 获取系统消息详情成功');
      return result;
    } catch (error) {
      logger.error('❌ [MessageService] 获取系统消息详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建系统消息
   * @param {Object} messageData 消息数据
   * @param {String} adminId 管理员ID
   * @returns {Promise<Object>} 创建的消息
   */
  async createSystemMessage(messageData, adminId) {
    logger.info('📝 [MessageService] 创建系统消息:', { 
      title: messageData.title, 
      type: messageData.type,
      targetGroup: messageData.targetGroup,
      adminId 
    });
    
    try {
      // 构建消息数据
      const systemMessageData = {
        type: 'system',
        title: messageData.title,
        content: messageData.content,
        sub_type: messageData.type, // 保存前端传来的子类型（如announcement, event等）
        sender_id: adminId, // 使用管理员ID作为发送者，表示是由管理员发送的系统消息
        receiver_id: adminId, // 使用管理员ID作为占位符，实际系统消息是广播
        post_id: null,
        comment_id: null,
        is_read: false
      };
      
      // 创建系统消息
      const message = await messageRepository.create(systemMessageData);
      
      // 如果是立即发送，推送系统通知给所有用户
      logger.info('🔧 [MessageService] 检查sendNow参数:', messageData.sendNow, typeof messageData.sendNow);
      if (messageData.sendNow) {
        logger.info('📤 [MessageService] 立即推送系统消息');
        
        // 通过WebSocket广播系统通知
        await this._broadcastSystemNotification(message);
        
        // 更新所有用户的未读计数
        await this._updateAllUsersUnreadCount();
      } else {
        logger.info('⏰ [MessageService] 消息设置为定时发送或sendNow为false，跳过立即推送');
      }
      
      logger.info('✅ [MessageService] 系统消息创建成功:', message.id);
      return {
        id: message.id,
        title: message.title,
        content: message.content,
        type: messageData.type,
        targetGroup: messageData.targetGroup,
        sender: '系统管理员',
        sendTime: message.createdAt,
        readCount: 0,
        totalCount: 0,
        createdAt: message.createdAt
      };
    } catch (error) {
      logger.error('❌ [MessageService] 创建系统消息失败:', error);
      throw ErrorMiddleware.createError(
        '创建系统消息失败',
        StatusCodes.INTERNAL_SERVER_ERROR,
        errorCodes.DATABASE_ERROR
      );
    }
  }

  /**
   * 删除系统消息
   * @param {String} messageId 消息ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async deleteSystemMessage(messageId) {
    logger.info('🗑️ [MessageService] 删除系统消息:', messageId);
    
    try {
      // 检查消息是否存在
      const message = await messageRepository.findById(messageId);
      if (!message || message.type !== 'system') {
        throw ErrorMiddleware.createError(
          '系统消息不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.MESSAGE_NOT_EXIST
        );
      }
      
      // 删除消息
      const success = await messageRepository.deleteSystemMessage(messageId);
      
      if (success) {
        logger.info('✅ [MessageService] 系统消息删除成功');
      } else {
        logger.info('⚠️ [MessageService] 系统消息删除失败');
      }
      
      return success;
    } catch (error) {
      logger.error('❌ [MessageService] 删除系统消息失败:', error);
      throw error;
    }
  }

  /**
   * 获取系统消息统计
   * @returns {Promise<Object>} 统计信息
   */
  async getSystemMessageStats() {
    logger.info('📊 [MessageService] 获取系统消息统计');
    
    try {
      const stats = await messageRepository.getSystemMessageStatsOverall();
      logger.info('✅ [MessageService] 获取统计信息成功');
      return stats;
    } catch (error) {
      logger.error('❌ [MessageService] 获取统计信息失败:', error);
      throw ErrorMiddleware.createError(
        '获取统计信息失败',
        StatusCodes.INTERNAL_SERVER_ERROR,
        errorCodes.DATABASE_ERROR
      );
    }
  }

  /**
   * 获取系统消息接收者列表
   * @param {String} messageId 消息ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async getSystemMessageRecipients(messageId, options = {}) {
    logger.info('👥 [MessageService] 获取系统消息接收者列表:', { messageId, options });
    
    try {
      // 检查消息是否存在
      const message = await messageRepository.findById(messageId);
      if (!message || message.type !== 'system') {
        throw ErrorMiddleware.createError(
          '系统消息不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.MESSAGE_NOT_EXIST
        );
      }
      
      const result = await messageRepository.getSystemMessageRecipients(messageId, options);
      logger.info(`✅ [MessageService] 获取接收者列表成功，共 ${result.total} 个用户`);
      return result;
    } catch (error) {
      logger.error('❌ [MessageService] 获取接收者列表失败:', error);
      throw error;
    }
  }

  /**
   * 搜索用户（用于发送系统消息时选择用户）
   * @param {String} query 搜索关键词
   * @returns {Promise<Array>} 用户列表
   */
  async searchUsers(query) {
    logger.info('🔍 [MessageService] 搜索用户:', query);
    
    try {
      const userRepository = require('../repositories/user.repository');
      
      // 搜索用户
      const users = await userRepository.searchUsers(query, { limit: 20 });
      
      // 格式化为前端需要的格式
      const result = users.map(user => ({
        value: user.id,
        label: `${user.nickname || user.username} (@${user.username})`
      }));
      
      logger.info(`✅ [MessageService] 搜索用户成功，找到 ${result.length} 个用户`);
      return result;
    } catch (error) {
      logger.error('❌ [MessageService] 搜索用户失败:', error);
      throw ErrorMiddleware.createError(
        '搜索用户失败',
        StatusCodes.INTERNAL_SERVER_ERROR,
        errorCodes.DATABASE_ERROR
      );
    }
  }

  /**
   * 标记私信对话为已读
   * @param {String} currentUserId 当前用户ID
   * @param {String} targetUserId 目标用户ID
   * @returns {Promise<Number>} 更新的消息数量
   */
  async markPrivateConversationAsRead(currentUserId, targetUserId) {
    return await messageRepository.markPrivateConversationAsRead(currentUserId, targetUserId);
  }

}

module.exports = new MessageService(); 