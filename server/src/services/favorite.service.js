const favoriteRepository = require('../repositories/favorite.repository');
const postRepository = require('../repositories/post.repository');
const userRepository = require('../repositories/user.repository');
const messageService = require('./message.service');
const statusCacheService = require('./status-cache.service');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const errorCodes = require('../constants/error-codes');
const logger = require('../../config/logger');

/**
 * 收藏服务层
 */
class FavoriteService {
  /**
   * 收藏帖子
   * @param {String} userId 用户ID
   * @param {String} postId 帖子ID
   * @returns {Promise<Object>} 收藏结果
   */
  async addFavorite(userId, postId) {
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
    
    // 检查帖子是否存在
    const post = await postRepository.findById(postId);
    if (!post) {
      throw ErrorMiddleware.createError(
        '帖子不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.POST_NOT_EXIST
      );
    }
    
    // 检查帖子状态
    if (post.status !== 'published') {
      throw ErrorMiddleware.createError(
        '帖子状态异常，无法收藏',
        StatusCodes.BAD_REQUEST,
        errorCodes.POST_STATUS_ERROR
      );
    }
    
    // 检查是否已收藏（包括软删除的记录）
    const existingFavorite = await favoriteRepository.findExisting(userId, postId);
    if (existingFavorite && !existingFavorite.deletedAt) {
      throw ErrorMiddleware.createError(
        '已收藏，请勿重复操作',
        StatusCodes.BAD_REQUEST,
        errorCodes.ALREADY_FAVORITED
      );
    }
    
    let favorite;
    if (existingFavorite && existingFavorite.deletedAt) {
      // 恢复软删除的收藏记录 - 这种情况仍需立即操作数据库
      favorite = await favoriteRepository.restore(existingFavorite.id);
      
      // 更新帖子收藏计数
      await postRepository.updateCounter(postId, 'favorite_count', 1);
    } else {
      // Write-Back策略：只更新缓存，添加到待处理队列
      favorite = { success: true }; // 模拟创建成功
    }
    
    // 发送消息通知
    if (post.user_id !== userId) {
      messageService.createMessage({
        sender_id: userId,
        receiver_id: post.user_id,
        title: '收藏通知',
        content: `${user.username} 收藏了你的帖子`,
        type: 'system',
        post_id: postId
      }).catch(err => console.error('发送消息失败', err));
    }
    
    // 更新状态缓存
    try {
      await statusCacheService.addFavorite(userId, postId);
      
      // 如果不是恢复操作，添加到待处理操作队列（Write-Back策略）
      if (!existingFavorite || !existingFavorite.deletedAt) {
        await statusCacheService.addPendingOperation({
          type: 'favorite',
          action: 'favorite',
          userId: userId,
          targetId: postId,
          targetType: 'post',
          timestamp: Date.now()
        });
        
        logger.info(`收藏操作已加入队列: ${userId} -> post:${postId}`);
      }
    } catch (error) {
      logger.warn('更新收藏缓存失败，但不影响收藏操作:', error);
    }
    
    // 注释：移除推荐缓存清除逻辑
    // 原因：用户收藏不应该影响推荐内容缓存，让推荐缓存自然过期即可
    // 状态信息已通过 statusCacheService 实时更新

    return {
      success: true,
      message: '收藏成功'
    };
  }

  /**
   * 取消收藏
   * @param {String} userId 用户ID
   * @param {String} postId 帖子ID
   * @returns {Promise<Object>} 取消收藏结果
   */
  async removeFavorite(userId, postId) {
    // 检查帖子是否存在
    const post = await postRepository.findById(postId);
    if (!post) {
      throw ErrorMiddleware.createError(
        '帖子不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.POST_NOT_EXIST
      );
    }
    
    // 检查是否已收藏
    const exists = await favoriteRepository.exists(userId, postId);
    if (!exists) {
      throw ErrorMiddleware.createError(
        '未收藏，无法取消',
        StatusCodes.BAD_REQUEST,
        errorCodes.NOT_FAVORITED
      );
    }
    
    // Write-Back策略：只更新缓存，添加到待处理队列
    const result = true; // 模拟删除成功，实际会在定时任务中删除DB记录
    
    // 更新状态缓存
    if (result) {
      try {
        await statusCacheService.removeFavorite(userId, postId);
        
        // 添加到待处理操作队列（Write-Back策略）
        await statusCacheService.addPendingOperation({
          type: 'favorite',
          action: 'unfavorite',
          userId: userId,
          targetId: postId,
          targetType: 'post',
          timestamp: Date.now()
        });
        
        logger.info(`取消收藏操作已加入队列: ${userId} -> post:${postId}`);
      } catch (error) {
        logger.warn('更新取消收藏缓存失败，但不影响取消收藏操作:', error);
      }
    }
    
    // 注释：移除推荐缓存清除逻辑
    // 原因：用户取消收藏不应该影响推荐内容缓存，让推荐缓存自然过期即可
    // 状态信息已通过 statusCacheService 实时更新

    return {
      success: result,
      message: result ? '取消收藏成功' : '取消收藏失败'
    };
  }

  /**
   * 获取用户收藏列表
   * @param {String} userId 用户ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async getUserFavorites(userId, page = 1, pageSize = 20) {
    // 检查用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    return await favoriteRepository.findByUserId(userId, page, pageSize);
  }

  /**
   * 获取帖子收藏用户列表
   * @param {String} postId 帖子ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async getPostFavoriteUsers(postId, page = 1, pageSize = 20) {
    // 检查帖子是否存在
    const post = await postRepository.findById(postId);
    if (!post) {
      throw ErrorMiddleware.createError(
        '帖子不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.POST_NOT_EXIST
      );
    }
    
    return await favoriteRepository.findUsersByPostId(postId, page, pageSize);
  }

  /**
   * 检查用户是否已收藏帖子
   * @param {String} userId 用户ID
   * @param {String} postId 帖子ID
   * @returns {Promise<Boolean>} 是否已收藏
   */
  async isFavorited(userId, postId) {
    if (!userId) return false;
    return await favoriteRepository.exists(userId, postId);
  }
}

module.exports = new FavoriteService(); 