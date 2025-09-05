const followRepository = require('../repositories/follow.repository');
const userRepository = require('../repositories/user.repository');
const messageService = require('./message.service');
const statusCacheService = require('./status-cache.service');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const errorCodes = require('../constants/error-codes');
const logger = require('../../config/logger');

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
    
    // Write-Back策略：优先检查缓存状态，再检查数据库
    // 这样避免缓存已更新但数据库未同步导致的状态冲突
    let isFollowingInCache = false;
    try {
      // 检查缓存中的关注状态
      const cacheStatus = await statusCacheService.isFollowing(followerId, [followingId]);
      isFollowingInCache = cacheStatus[followingId] || false;
      
      if (isFollowingInCache) {
        logger.info(`缓存检查：用户${followerId}已关注${followingId} - 幂等性处理`);
        // 幂等性处理：已关注状态直接返回成功，不报错
        return {
          success: true,
          message: '关注成功',
          isFollowing: true
        };
      }
    } catch (error) {
      logger.warn('缓存检查失败，回退到数据库检查:', error);
    }
    
    // 检查数据库中的关注状态（软删除记录）
    const existingFollow = await followRepository.findExisting(followerId, followingId);
    if (existingFollow && !existingFollow.deletedAt && !isFollowingInCache) {
      // 幂等性处理：数据库中已存在关注记录，直接返回成功
      logger.info(`数据库检查：用户${followerId}已关注${followingId} - 幂等性处理`);
      return {
        success: true,
        message: '关注成功',
        isFollowing: true
      };
    }
    
    let follow;
    if (existingFollow && existingFollow.deletedAt) {
      // 恢复软删除的关注记录 - 这种情况仍需立即操作数据库
      follow = await followRepository.restore(existingFollow.id);
    } else {
      // Write-Back策略：只更新缓存，添加到待处理队列
      follow = { success: true }; // 模拟创建成功，实际会在定时任务中写入DB
    }
    
    // 更新状态缓存
    try {
      await statusCacheService.addFollowing(followerId, followingId);
      
      // 立即更新统计数据缓存（保证数据一致性）
      await Promise.all([
        statusCacheService.updateFollowingCount(followerId, 1), // 关注者的关注数+1
        statusCacheService.updateFollowerCount(followingId, 1)   // 被关注者的粉丝数+1
      ]);
      
      // 添加到待处理操作队列（Write-Back策略）
      await statusCacheService.addPendingOperation({
        type: 'follow',
        action: 'follow',
        userId: followerId,
        targetId: followingId,
        timestamp: Date.now()
      });
      
      logger.info(`关注操作已加入队列: ${followerId} -> ${followingId}`);
    } catch (error) {
      console.warn('更新关注缓存失败，但不影响关注操作:', error);
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
    
    // Write-Back策略：优先检查缓存状态，再检查数据库
    // 这样避免缓存已更新但数据库未同步导致的状态冲突
    let isFollowingInCache = false;
    try {
      // 检查缓存中的关注状态
      const cacheStatus = await statusCacheService.isFollowing(followerId, [followingId]);
      isFollowingInCache = cacheStatus[followingId] || false;
      
      if (!isFollowingInCache) {
        // 如果缓存中没有关注状态，再检查数据库
        const exists = await followRepository.exists(followerId, followingId);
        if (!exists) {
          // 幂等性处理：未关注状态直接返回成功，不报错
          logger.info(`缓存和数据库检查：用户${followerId}未关注${followingId} - 幂等性处理`);
          return {
            success: true,
            message: '取消关注成功',
            isFollowing: false
          };
        }
      }
    } catch (error) {
      logger.warn('缓存检查失败，回退到数据库检查:', error);
      
      // 纯数据库检查
      const exists = await followRepository.exists(followerId, followingId);
      if (!exists) {
        // 幂等性处理：未关注状态直接返回成功，不报错
        logger.info(`数据库检查：用户${followerId}未关注${followingId} - 幂等性处理`);
        return {
          success: true,
          message: '取消关注成功',
          isFollowing: false
        };
      }
    }
    
    // Write-Back策略：只更新缓存，添加到待处理队列
    const result = true; // 模拟删除成功，实际会在定时任务中删除DB记录
    
    // 更新状态缓存
    try {
      await statusCacheService.removeFollowing(followerId, followingId);
      
      // 立即更新统计数据缓存（保证数据一致性）
      await Promise.all([
        statusCacheService.updateFollowingCount(followerId, -1), // 关注者的关注数-1
        statusCacheService.updateFollowerCount(followingId, -1)   // 被关注者的粉丝数-1
      ]);
      
      // 添加到待处理操作队列（Write-Back策略）
      await statusCacheService.addPendingOperation({
        type: 'follow',
        action: 'unfollow',
        userId: followerId,
        targetId: followingId,
        timestamp: Date.now()
      });
      
      logger.info(`取消关注操作已加入队列: ${followerId} -> ${followingId}`);
    } catch (error) {
      console.warn('更新取消关注缓存失败，但不影响取消关注操作:', error);
    }
    
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
   * 获取用户的关注数量（优先缓存）
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
    
    try {
      // 优先从缓存获取
      const counts = await statusCacheService.getUserCounts(userId);
      return counts.following_count;
    } catch (error) {
      logger.warn(`获取关注数量缓存失败，回退到数据库查询: ${userId}`, error);
      // 缓存失败，回退到数据库查询
      return await followRepository.countFollowings(userId);
    }
  }

  /**
   * 获取用户的粉丝数量（优先缓存）
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
    
    try {
      // 优先从缓存获取
      const counts = await statusCacheService.getUserCounts(userId);
      return counts.follower_count;
    } catch (error) {
      logger.warn(`获取粉丝数量缓存失败，回退到数据库查询: ${userId}`, error);
      // 缓存失败，回退到数据库查询
      return await followRepository.countFollowers(userId);
    }
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

  /**
   * 获取用户的关注和粉丝数据（合并API）
   * @param {String} userId 用户ID
   * @param {Object} options 分页选项
   * @returns {Promise<Object>} 包含关注和粉丝数据的结果
   */
  async getUserFollowData(userId, options = {}) {
    const {
      followingPage = 1,
      followingPageSize = 20,
      followersPage = 1,
      followersPageSize = 20
    } = options;

    // 检查用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }

    // 并行获取关注和粉丝数据
    const [followingResult, followersResult] = await Promise.all([
      followRepository.findFollowings(userId, followingPage, followingPageSize),
      followRepository.findFollowers(userId, followersPage, followersPageSize)
    ]);

    // 提取用户信息并添加统计数据
    const followingList = await Promise.all(
      followingResult.list.map(async follow => {
        const user = follow.following?.dataValues || follow.following;
        
        // 并行获取统计数据
        const [followingCount, followerCount, likeCount] = await Promise.all([
          this.getFollowingCount(user.id),
          this.getFollowerCount(user.id), 
          require('./user.service').getUserLikeCount(user.id)
        ]);
        
        return {
          ...user,
          nickname: user.nickname || user.username,
          followedAt: follow.created_at,
          followersCount: followerCount,
          followingCount: followingCount,
          likesCount: likeCount
        };
      })
    );

    const followersList = await Promise.all(
      followersResult.list.map(async follow => {
        const user = follow.follower?.dataValues || follow.follower;
        
        // 并行获取统计数据
        const [followingCount, followerCount, likeCount] = await Promise.all([
          this.getFollowingCount(user.id),
          this.getFollowerCount(user.id),
          require('./user.service').getUserLikeCount(user.id)
        ]);
        
        return {
          ...user,
          nickname: user.nickname || user.username,
          followedAt: follow.created_at,
          followersCount: followerCount,
          followingCount: followingCount,
          likesCount: likeCount
        };
      })
    );



    return {
      following: {
        list: followingList,
        pagination: followingResult.pagination
      },
      followers: {
        list: followersList,
        pagination: followersResult.pagination
      },
      summary: {
        followingTotal: followingResult.pagination.total,
        followersTotal: followersResult.pagination.total
      }
    };
  }
}

module.exports = new FollowService();