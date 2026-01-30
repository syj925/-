const messageService = require('../services/message.service');
const userService = require('../services/user.service');
const settingService = require('../services/setting.service');
const { ResponseUtil, ErrorMiddleware } = require('../utils');
const { StatusCodes } = require('http-status-codes');
const errorCodes = require('../constants/error-codes');
const logger = require('../../config/logger');

/**
 * 检查全局私信功能是否开启
 * @returns {Promise<boolean>}
 */
async function isPrivateMessageGloballyEnabled() {
  try {
    const value = await settingService.getSetting('private_message_enabled');

    // 默认开启私信功能
    if (value === null) {
      return true;
    }

    return value === 'true' || value === true;
  } catch (error) {
    logger.error('检查全局私信功能设置失败:', error);
    // 出错时默认开启
    return true;
  }
}

/**
 * 检查用户是否允许接收私信
 * @param {string} userId 用户ID
 * @returns {Promise<boolean>}
 */
async function userAllowsPrivateMessage(userId) {
  try {
    const user = await userService.findById(userId);

    if (!user) {
      return false;
    }

    // 默认允许接收私信
    const allowMessage = user.settings?.privacy?.allowMessage;
    return allowMessage !== false;
  } catch (error) {
    logger.error('检查用户私信设置失败:', error);
    // 出错时默认允许
    return true;
  }
}

/**
 * 私信控制器
 */
class PrivateMessageController {
  /**
   * 发送私信
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async sendPrivateMessage(req, res, next) {
    try {
      const senderId = req.user.id;
      const { receiverId, content } = req.body;

      logger.info('📨 [PrivateMessage] 尝试发送私信:', {
        senderId,
        receiverId,
        contentLength: content ? content.length : 0
      });

      // 1. 检查全局私信功能是否开启
      const globalEnabled = await isPrivateMessageGloballyEnabled();
      if (!globalEnabled) {
        logger.info('❌ [PrivateMessage] 全局私信功能已关闭');
        throw ErrorMiddleware.createError(
          '私信功能暂未开放',
          StatusCodes.FORBIDDEN,
          errorCodes.PRIVATE_MESSAGE_DISABLED
        );
      }

      // 2. 检查接收者是否存在
      const receiver = await userService.findById(receiverId);
      if (!receiver) {
        logger.info('❌ [PrivateMessage] 接收者不存在:', receiverId);
        throw ErrorMiddleware.createError(
          '接收者不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.USER_NOT_EXIST
        );
      }

      // 3. 检查接收者是否允许接收私信
      const receiverAllowsMessage = await userAllowsPrivateMessage(receiverId);
      if (!receiverAllowsMessage) {
        logger.info('❌ [PrivateMessage] 接收者已关闭私信功能:', receiverId);
        throw ErrorMiddleware.createError(
          '对方已关闭私信功能',
          StatusCodes.FORBIDDEN,
          errorCodes.RECEIVER_DISABLED_PRIVATE_MESSAGE
        );
      }

      // 4. 检查是否尝试发送给自己
      if (senderId === receiverId) {
        logger.info('❌ [PrivateMessage] 不能发送私信给自己');
        throw ErrorMiddleware.createError(
          '不能发送私信给自己',
          StatusCodes.BAD_REQUEST,
          errorCodes.INVALID_OPERATION
        );
      }

      // 5. 创建私信消息
      const messageData = {
        type: 'private',
        title: '私信消息',
        content: content.trim(),
        sender_id: senderId,
        receiver_id: receiverId
      };

      const message = await messageService.createMessage(messageData);
      
      logger.info('✅ [PrivateMessage] 私信发送成功:', message.id);

      const responseData = {
        id: message.id,
        content: message.content,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        type: message.type,
        created_at: message.created_at
      };
      
      logger.info('📤 [PrivateMessage] 发送响应数据:', JSON.stringify(responseData, null, 2));
      
      res.status(StatusCodes.CREATED).json(
        ResponseUtil.success(responseData, '私信发送成功')
      );

    } catch (error) {
      logger.error('❌ [PrivateMessage] 发送私信失败:', error);
      next(error);
    }
  }

  /**
   * 获取与指定用户的私信记录
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getConversation(req, res, next) {
    try {
      const currentUserId = req.user.id;
      const { userId } = req.params;
      const { page = 1, pageSize = 20 } = req.query;

      logger.info('💬 [PrivateMessage] 获取对话记录:', {
        currentUserId,
        targetUserId: userId,
        page,
        pageSize
      });

      // 检查全局私信功能是否开启
      const globalEnabled = await isPrivateMessageGloballyEnabled();
      if (!globalEnabled) {
        throw ErrorMiddleware.createError(
          '私信功能暂未开放',
          StatusCodes.FORBIDDEN,
          errorCodes.PRIVATE_MESSAGE_DISABLED
        );
      }

      // 检查目标用户是否存在
      const targetUser = await userService.findById(userId);
      
      if (!targetUser) {
        throw ErrorMiddleware.createError(
          '用户不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.USER_NOT_EXIST
        );
      }

      // 获取对话消息
      const options = {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        type: 'private',
        conversationWith: userId
      };

      const result = await messageService.getUserMessages(currentUserId, options);

      logger.info('✅ [PrivateMessage] 获取对话记录成功，消息数:', result.list.length);
      
      // 增加详细的调试信息
      if (result.list.length > 0) {
        const latestMessage = result.list[result.list.length - 1];
        logger.info('📝 [PrivateMessage] 最新消息详情:', {
          id: latestMessage.id,
          sender_id: latestMessage.sender_id,
          created_at: latestMessage.created_at,
          timestamp: new Date(latestMessage.created_at).getTime()
        });
        
        // 检查最近5分钟内的消息
        const recentMessages = result.list.filter(msg => {
          const msgTime = new Date(msg.created_at).getTime();
          const now = Date.now();
          return (now - msgTime) < 5 * 60 * 1000; // 5分钟
        });
        logger.info(`🕐 [PrivateMessage] 最近5分钟内的消息数量: ${recentMessages.length}`);
      } else {
        logger.info('⚠️ [PrivateMessage] 对话记录为空，当前用户:', currentUserId, '目标用户:', userId);
      }

      res.status(StatusCodes.OK).json(
        ResponseUtil.page(
          result.list,
          result.pagination.page,
          result.pagination.pageSize,
          result.pagination.total,
          { targetUser }
        )
      );

    } catch (error) {
      logger.error('❌ [PrivateMessage] 获取对话记录失败:', error);
      next(error);
    }
  }

  /**
   * 获取私信会话列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getConversationList(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, pageSize = 20 } = req.query;

      logger.info('📋 [PrivateMessage] 获取会话列表:', { userId, page, pageSize });

      // 检查全局私信功能是否开启
      const globalEnabled = await isPrivateMessageGloballyEnabled();
      if (!globalEnabled) {
        throw ErrorMiddleware.createError(
          '私信功能暂未开放',
          StatusCodes.FORBIDDEN,
          errorCodes.PRIVATE_MESSAGE_DISABLED
        );
      }

      const options = {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        type: 'private',
        conversationList: true
      };

      const result = await messageService.getUserMessages(userId, options);

      logger.info('✅ [PrivateMessage] 获取会话列表成功，会话数:', result.list.length);

      res.status(StatusCodes.OK).json(
        ResponseUtil.page(
          result.list,
          result.pagination.page,
          result.pagination.pageSize,
          result.pagination.total
        )
      );

    } catch (error) {
      logger.error('❌ [PrivateMessage] 获取会话列表失败:', error);
      next(error);
    }
  }

  /**
   * 获取私信功能状态
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getPrivateMessageStatus(req, res, next) {
    try {
      const userId = req.user.id;

      // 检查全局设置
      const globalEnabled = await isPrivateMessageGloballyEnabled();
      
      // 检查用户个人设置
      const userEnabled = await userAllowsPrivateMessage(userId);

      const status = {
        globalEnabled,
        userEnabled,
        available: globalEnabled && userEnabled
      };

      logger.info('📊 [PrivateMessage] 私信功能状态:', status);

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(status, '获取私信功能状态成功')
      );

    } catch (error) {
      logger.error('❌ [PrivateMessage] 获取私信功能状态失败:', error);
      next(error);
    }
  }

  /**
   * 标记与特定用户的私信对话为已读
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  async markConversationAsRead(req, res, next) {
    try {
      const currentUserId = req.user.id;
      const { userId: targetUserId } = req.params;

      logger.info('📖 [PrivateMessage] 标记对话已读:', {
        currentUserId,
        targetUserId
      });

      // 标记来自目标用户的未读私信为已读
      const updatedCount = await messageService.markPrivateConversationAsRead(
        currentUserId,
        targetUserId
      );

      logger.info(`✅ [PrivateMessage] 标记了 ${updatedCount} 条消息为已读`);

      // 如果标记了消息为已读，更新未读计数缓存
      if (updatedCount > 0) {
        // 使用messageService来正确更新缓存
        await messageService.decrementUnreadCount(currentUserId, updatedCount);
      }

      res.status(StatusCodes.OK).json(
        ResponseUtil.success({ updatedCount }, '标记消息已读成功')
      );

    } catch (error) {
      logger.error('❌ [PrivateMessage] 标记消息已读失败:', error);
      next(error);
    }
  }
}

module.exports = new PrivateMessageController();
