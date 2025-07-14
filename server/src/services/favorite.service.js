const favoriteRepository = require('../repositories/favorite.repository');
const postRepository = require('../repositories/post.repository');
const userRepository = require('../repositories/user.repository');
const messageService = require('./message.service');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const errorCodes = require('../constants/error-codes');

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
    
    // 检查是否已收藏
    const exists = await favoriteRepository.exists(userId, postId);
    if (exists) {
      throw ErrorMiddleware.createError(
        '已收藏，请勿重复操作',
        StatusCodes.BAD_REQUEST,
        errorCodes.ALREADY_FAVORITED
      );
    }
    
    // 创建收藏
    const favorite = await favoriteRepository.create({
      user_id: userId,
      post_id: postId
    });
    
    // 更新帖子收藏计数
    await postRepository.updateCounter(postId, 'favorite_count', 1);
    
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
    
    // 删除收藏
    const result = await favoriteRepository.delete(userId, postId);
    
    // 更新帖子收藏计数
    if (result) {
      await postRepository.updateCounter(postId, 'favorite_count', -1);
    }
    
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