const likeRepository = require('../repositories/like.repository');
const postRepository = require('../repositories/post.repository');
const commentRepository = require('../repositories/comment.repository');
const userRepository = require('../repositories/user.repository');
const messageService = require('./message.service');
const statusCacheService = require('./status-cache.service');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const errorCodes = require('../constants/error-codes');
const logger = require('../../config/logger');

/**
 * 点赞服务层
 */
class LikeService {
  /**
   * 点赞
   * @param {String} userId 用户ID
   * @param {String} targetId 目标ID
   * @param {String} targetType 目标类型
   * @returns {Promise<Object>} 点赞结果
   */
  async like(userId, targetId, targetType) {
    // 检查用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    // 检查用户是否被禁用
    if (user.is_disabled) {
      throw ErrorMiddleware.createError(
        '账号已被禁用',
        StatusCodes.FORBIDDEN,
        errorCodes.USER_DISABLED
      );
    }
    
    // 检查目标是否存在
    let targetOwnerId;
    if (targetType === 'post') {
      const post = await postRepository.findById(targetId);
      if (!post) {
        throw ErrorMiddleware.createError(
          '帖子不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.POST_NOT_EXIST
        );
      }
      if (post.status !== 'published') {
        throw ErrorMiddleware.createError(
          '帖子状态异常，无法点赞',
          StatusCodes.BAD_REQUEST,
          errorCodes.POST_STATUS_ERROR
        );
      }
      targetOwnerId = post.user_id;
    } else if (targetType === 'comment') {
      const comment = await commentRepository.findById(targetId);
      if (!comment) {
        throw ErrorMiddleware.createError(
          '评论不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.COMMENT_NOT_EXIST
        );
      }
      if (comment.status !== 'normal') {
        throw ErrorMiddleware.createError(
          '评论已删除，无法点赞',
          StatusCodes.BAD_REQUEST,
          errorCodes.COMMENT_DELETED
        );
      }
      targetOwnerId = comment.user_id;
    } else {
      throw ErrorMiddleware.createError(
        '不支持的目标类型',
        StatusCodes.BAD_REQUEST,
        errorCodes.INVALID_TARGET_TYPE
      );
    }
    
    // 检查是否已点赞（包括软删除的记录）
    const existingLike = await likeRepository.findExisting(userId, targetId, targetType);
    if (existingLike && !existingLike.deletedAt) {
      // 已经点赞，直接返回
      return { message: '已点赞' };
    }
    
    let like;
    if (existingLike && existingLike.deletedAt) {
      // 恢复软删除的点赞记录 - 这种情况仍需立即操作数据库
      like = await likeRepository.restore(existingLike.id);
      
      // 更新计数
      if (targetType === 'post') {
        await postRepository.updateCounter(targetId, 'like_count', 1);
      } else if (targetType === 'comment') {
        await commentRepository.updateCounter(targetId, 'like_count', 1);
      }
    } else {
      // Write-Back策略：只更新缓存，添加到待处理队列
      like = { success: true }; // 模拟创建成功
    }

    // 发送消息通知
    if (targetOwnerId !== userId) {
      const messageContent = targetType === 'post'
        ? `${user.nickname || user.username} 点赞了你的帖子`
        : `${user.nickname || user.username} 点赞了你的评论`;

      const messageTitle = targetType === 'post' ? '点赞通知' : '评论点赞通知';
      
      await messageService.createMessage({
        sender_id: userId,
        receiver_id: targetOwnerId,
        title: messageTitle,
        content: messageContent,
        type: 'like',
        related_id: like.id,
        post_id: targetType === 'post' ? targetId : null
      }).catch(err => console.error('发送点赞通知失败', err));
    }
    
    // 更新状态缓存（仅对帖子）
    if (targetType === 'post') {
      try {
        await statusCacheService.addLike(userId, targetId);
        
        // 如果不是恢复操作，添加到待处理操作队列（Write-Back策略）
        if (!existingLike || !existingLike.deletedAt) {
          await statusCacheService.addPendingOperation({
            type: 'like',
            action: 'like',
            userId: userId,
            targetId: targetId,
            targetType: targetType,
            timestamp: Date.now()
          });
          
          logger.info(`点赞操作已加入队列: ${userId} -> ${targetType}:${targetId}`);
        }
      } catch (error) {
        logger.warn('更新点赞缓存失败，但不影响点赞操作:', error);
      }
    }

    // 注释：移除推荐缓存清除逻辑
    // 原因：用户点赞不应该影响推荐内容缓存，让推荐缓存自然过期即可
    // 状态信息已通过 statusCacheService 实时更新

    return {
      success: true,
      message: '点赞成功'
    };
  }

  /**
   * 取消点赞
   * @param {String} userId 用户ID
   * @param {String} targetId 目标ID
   * @param {String} targetType 目标类型
   * @returns {Promise<Object>} 取消点赞结果
   */
  async unlike(userId, targetId, targetType) {
    // 检查目标是否存在
    if (targetType === 'post') {
      const post = await postRepository.findById(targetId);
      if (!post) {
        throw ErrorMiddleware.createError(
          '帖子不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.POST_NOT_EXIST
        );
      }
    } else if (targetType === 'comment') {
      const comment = await commentRepository.findById(targetId);
      if (!comment) {
        throw ErrorMiddleware.createError(
          '评论不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.COMMENT_NOT_EXIST
        );
      }
    } else {
      throw ErrorMiddleware.createError(
        '不支持的目标类型',
        StatusCodes.BAD_REQUEST,
        errorCodes.INVALID_TARGET_TYPE
      );
    }
    
    // Write-Back策略：只更新缓存，添加到待处理队列
    const result = true; // 模拟删除成功，实际会在定时任务中删除DB记录

    // 更新状态缓存（仅对帖子）
    if (result && targetType === 'post') {
      try {
        await statusCacheService.removeLike(userId, targetId);
        
        // 添加到待处理操作队列（Write-Back策略）
        await statusCacheService.addPendingOperation({
          type: 'like',
          action: 'unlike',
          userId: userId,
          targetId: targetId,
          targetType: targetType,
          timestamp: Date.now()
        });
        
        logger.info(`取消点赞操作已加入队列: ${userId} -> ${targetType}:${targetId}`);
      } catch (error) {
        logger.warn('更新取消点赞缓存失败，但不影响取消点赞操作:', error);
      }
    }

    // 注释：移除推荐缓存清除逻辑
    // 原因：用户取消点赞不应该影响推荐内容缓存，让推荐缓存自然过期即可
    // 状态信息已通过 statusCacheService 实时更新

    return {
      success: true,
      message: '取消点赞成功'
    };
  }

  /**
   * 获取目标的点赞列表
   * @param {String} targetId 目标ID
   * @param {String} targetType 目标类型
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async getTargetLikes(targetId, targetType, page = 1, pageSize = 20) {
    // 检查目标是否存在
    if (targetType === 'post') {
      const post = await postRepository.findById(targetId);
      if (!post) {
        throw ErrorMiddleware.createError(
          '帖子不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.POST_NOT_EXIST
        );
      }
    } else if (targetType === 'comment') {
      const comment = await commentRepository.findById(targetId);
      if (!comment) {
        throw ErrorMiddleware.createError(
          '评论不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.COMMENT_NOT_EXIST
        );
      }
    } else {
      throw ErrorMiddleware.createError(
        '不支持的目标类型',
        StatusCodes.BAD_REQUEST,
        errorCodes.INVALID_TARGET_TYPE
      );
    }
    
    return await likeRepository.findByTargetId(targetId, targetType, page, pageSize);
  }

  /**
   * 获取用户的点赞列表
   * @param {String} userId 用户ID
   * @param {String} targetType 目标类型
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async getUserLikes(userId, targetType, page = 1, pageSize = 20) {
    // 检查用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    return await likeRepository.findByUserId(userId, targetType, page, pageSize);
  }

  /**
   * 检查用户是否已点赞
   * @param {String} userId 用户ID
   * @param {String} targetId 目标ID
   * @param {String} targetType 目标类型
   * @returns {Promise<Boolean>} 是否已点赞
   */
  async isLiked(userId, targetId, targetType) {
    if (!userId) return false;
    return await likeRepository.exists(userId, targetId, targetType);
  }
}

module.exports = new LikeService(); 