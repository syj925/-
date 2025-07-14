const likeRepository = require('../repositories/like.repository');
const postRepository = require('../repositories/post.repository');
const commentRepository = require('../repositories/comment.repository');
const userRepository = require('../repositories/user.repository');
const messageService = require('./message.service');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const errorCodes = require('../constants/error-codes');

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
    
    // 使用 findOrCreate 避免并发问题
    let like;
    try {
      const [likeRecord, created] = await likeRepository.findOrCreate({
        user_id: userId,
        target_id: targetId,
        target_type: targetType
      });

      like = likeRecord;

      if (!created) {
        // 如果已经存在，直接返回成功
        return { message: '已点赞' };
      }
    } catch (error) {
      // 如果是唯一约束错误，说明已经点赞了
      if (error.name === 'SequelizeUniqueConstraintError') {
        return { message: '已点赞' };
      }
      throw error;
    }

    // 更新计数
    if (targetType === 'post') {
      await postRepository.updateCounter(targetId, 'like_count', 1);
    } else if (targetType === 'comment') {
      await commentRepository.updateCounter(targetId, 'like_count', 1);
    }

    // 发送消息通知
    if (targetOwnerId !== userId) {
      const messageContent = targetType === 'post'
        ? `${user.username} 点赞了你的帖子`
        : `${user.username} 点赞了你的评论`;

      messageService.createMessage({
        sender_id: userId,
        receiver_id: targetOwnerId,
        content: messageContent,
        type: 'like',
        related_id: like.id,
        post_id: targetType === 'post' ? targetId : null
      }).catch(err => console.error('发送消息失败', err));
    }
    
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
    
    // 直接尝试删除点赞记录
    const result = await likeRepository.delete(userId, targetId, targetType);

    // 更新计数
    if (result) {
      if (targetType === 'post') {
        await postRepository.updateCounter(targetId, 'like_count', -1);
      } else if (targetType === 'comment') {
        await commentRepository.updateCounter(targetId, 'like_count', -1);
      }
    }

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