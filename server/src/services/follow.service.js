const followRepository = require('../repositories/follow.repository');
const userRepository = require('../repositories/user.repository');
const messageService = require('./message.service');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const errorCodes = require('../constants/error-codes');

/**
 * 关注服务层
 */
class FollowService {
  /**
   * 关注用户
   * @param {String} followerId 关注者ID
   * @param {String} followingId 被关注者ID
   * @returns {Promise<Object>} 关注结果
   */
  async followUser(followerId, followingId) {
    // 不能关注自己
    if (followerId === followingId) {
      throw ErrorMiddleware.createError(
        '不能关注自己',
        StatusCodes.BAD_REQUEST,
        errorCodes.INVALID_OPERATION
      );
    }
    
    // 检查被关注者是否存在
    const following = await userRepository.findById(followingId);
    if (!following) {
      throw ErrorMiddleware.createError(
        '被关注的用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    // 检查关注者是否存在
    const follower = await userRepository.findById(followerId);
    if (!follower) {
      throw ErrorMiddleware.createError(
        '关注者不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    // 检查是否已关注（包括软删除的记录）
    const existingFollow = await followRepository.findExisting(followerId, followingId);
    if (existingFollow && !existingFollow.deletedAt) {
      throw ErrorMiddleware.createError(
        '已关注该用户',
        StatusCodes.BAD_REQUEST,
        errorCodes.ALREADY_FOLLOWED
      );
    }
    
    let follow;
    if (existingFollow && existingFollow.deletedAt) {
      // 恢复软删除的关注记录
      follow = await followRepository.restore(existingFollow.id);
    } else {
      // 创建新关注关系
      follow = await followRepository.create({
        follower_id: followerId,
        following_id: followingId
      });
    }
    
    // 发送消息通知
    messageService.createMessage({
      sender_id: followerId,
      receiver_id: followingId,
      title: '新粉丝通知',
      content: `${follower.username} 关注了你`,
      type: 'follow'
    }).catch(err => console.error('发送消息失败', err));
    
    return {
      success: true,
      message: '关注成功'
    };
  }

  /**
   * 取消关注
   * @param {String} followerId 关注者ID
   * @param {String} followingId 被关注者ID
   * @returns {Promise<Object>} 取消关注结果
   */
  async unfollowUser(followerId, followingId) {
    // 不能取消关注自己
    if (followerId === followingId) {
      throw ErrorMiddleware.createError(
        '不能取消关注自己',
        StatusCodes.BAD_REQUEST,
        errorCodes.INVALID_OPERATION
      );
    }
    
    // 检查被关注者是否存在
    const following = await userRepository.findById(followingId);
    if (!following) {
      throw ErrorMiddleware.createError(
        '被关注的用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    // 检查是否已关注
    const exists = await followRepository.exists(followerId, followingId);
    if (!exists) {
      throw ErrorMiddleware.createError(
        '未关注该用户',
        StatusCodes.BAD_REQUEST,
        errorCodes.NOT_FOLLOWED
      );
    }
    
    // 删除关注关系
    const result = await followRepository.delete(followerId, followingId);
    
    return {
      success: result,
      message: result ? '取消关注成功' : '取消关注失败'
    };
  }

  /**
   * 获取用户的关注列表
   * @param {String} userId 用户ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async getFollowings(userId, page = 1, pageSize = 20) {
    // 检查用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    return await followRepository.findFollowings(userId, page, pageSize);
  }

  /**
   * 获取用户的粉丝列表
   * @param {String} userId 用户ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async getFollowers(userId, page = 1, pageSize = 20) {
    // 检查用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    return await followRepository.findFollowers(userId, page, pageSize);
  }

  /**
   * 获取用户的关注数量
   * @param {String} userId 用户ID
   * @returns {Promise<Number>} 关注数量
   */
  async getFollowingCount(userId) {
    // 检查用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    return await followRepository.countFollowings(userId);
  }

  /**
   * 获取用户的粉丝数量
   * @param {String} userId 用户ID
   * @returns {Promise<Number>} 粉丝数量
   */
  async getFollowerCount(userId) {
    // 检查用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    return await followRepository.countFollowers(userId);
  }

  /**
   * 检查用户是否已关注
   * @param {String} followerId 关注者ID
   * @param {String} followingId 被关注者ID
   * @returns {Promise<Boolean>} 是否已关注
   */
  async isFollowing(followerId, followingId) {
    if (!followerId || !followingId) return false;
    return await followRepository.exists(followerId, followingId);
  }

  /**
   * 获取两个用户的共同关注列表
   * @param {String} userId1 用户1 ID
   * @param {String} userId2 用户2 ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async getCommonFollowings(userId1, userId2, page = 1, pageSize = 20) {
    // 检查用户1是否存在
    const user1 = await userRepository.findById(userId1);
    if (!user1) {
      throw ErrorMiddleware.createError(
        '用户1不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    // 检查用户2是否存在
    const user2 = await userRepository.findById(userId2);
    if (!user2) {
      throw ErrorMiddleware.createError(
        '用户2不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    return await followRepository.findCommonFollowings(userId1, userId2, page, pageSize);
  }

  /**
   * 批量检查关注状态
   * @param {String} followerId 关注者ID
   * @param {Array} userIds 要检查的用户ID数组
   * @returns {Promise<Object>} 关注状态映射
   */
  async batchCheckFollowStatus(followerId, userIds) {
    // 检查关注者是否存在
    const follower = await userRepository.findById(followerId);
    if (!follower) {
      throw ErrorMiddleware.createError(
        '关注者不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }

    // 批量查询关注状态
    return await followRepository.batchCheckFollowStatus(followerId, userIds);
  }

  /**
   * 检查两个用户是否互相关注
   * @param {String} userId1 用户1 ID
   * @param {String} userId2 用户2 ID
   * @returns {Promise<Object>} 互相关注状态
   */
  async checkMutualFollow(userId1, userId2) {
    // 检查用户1是否存在
    const user1 = await userRepository.findById(userId1);
    if (!user1) {
      throw ErrorMiddleware.createError(
        '用户1不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }

    // 检查用户2是否存在
    const user2 = await userRepository.findById(userId2);
    if (!user2) {
      throw ErrorMiddleware.createError(
        '用户2不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }

    // 检查双向关注状态
    const user1FollowsUser2 = await followRepository.exists(userId1, userId2);
    const user2FollowsUser1 = await followRepository.exists(userId2, userId1);

    return {
      user1FollowsUser2,
      user2FollowsUser1,
      isMutual: user1FollowsUser2 && user2FollowsUser1
    };
  }

  /**
   * 获取用户的互相关注列表
   * @param {String} userId 用户ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async getMutualFollowings(userId, page = 1, pageSize = 20) {
    // 检查用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }

    return await followRepository.findMutualFollowings(userId, page, pageSize);
  }
}

module.exports = new FollowService();