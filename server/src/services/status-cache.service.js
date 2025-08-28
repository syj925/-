const { redisClient } = require('../utils');
const logger = require('../../config/logger');
const { Like, Favorite, Follow } = require('../models');
const { Op } = require('sequelize');
const cacheConfig = require('../../config/cache');

/**
 * 用户状态缓存服务
 * 使用Redis缓存用户的点赞、收藏状态和关注状态，减少数据库查询压力
 */
class StatusCacheService {
  constructor() {
    this.CACHE_PREFIX = cacheConfig.USER_STATUS.PREFIX;
    this.DIRTY_PREFIX = cacheConfig.USER_STATUS.DIRTY_PREFIX;
    this.CACHE_TTL = cacheConfig.getTTL('USER_STATUS', cacheConfig.USER_STATUS.TTL);
    
    // Write-Back策略相关键名
    this.PENDING_OPERATIONS_KEY = 'user_status:pending_operations';
    this.FLUSH_LOCK_KEY = 'user_status:flush_lock';
    
    // 统计数据缓存键名
    this.COUNT_CACHE_PREFIX = 'user_status:counts:';
    this.COUNT_CACHE_TTL = cacheConfig.getTTL('USER_COUNT', cacheConfig.USER_STATUS.COUNT_TTL);
    
    // 启动定时写回任务
    this.startFlushTimer();
  }

  /**
   * 获取用户点赞状态缓存key
   */
  getLikesCacheKey(userId) {
    return `${this.CACHE_PREFIX}likes:${userId}`;
  }

  /**
   * 获取用户收藏状态缓存key
   */
  getFavoritesCacheKey(userId) {
    return `${this.CACHE_PREFIX}favorites:${userId}`;
  }

  /**
   * 获取用户关注状态缓存key
   */
  getFollowingsCacheKey(userId) {
    return `${this.CACHE_PREFIX}followings:${userId}`;
  }

  /**
   * 获取脏数据标记key
   */
  getDirtyKey(type, userId) {
    return `${this.DIRTY_PREFIX}${type}:${userId}`;
  }

  /**
   * 检查用户是否点赞了帖子
   * @param {String} userId 用户ID
   * @param {String|Array} postIds 帖子ID或ID数组
   * @returns {Promise<Boolean|Object>} 单个ID返回布尔值，多个ID返回对象映射
   */
  async isLiked(userId, postIds) {
    if (!userId) return Array.isArray(postIds) ? {} : false;

    const cacheKey = this.getLikesCacheKey(userId);
    
    try {
      // 检查缓存是否存在
      const exists = await redisClient.exists(cacheKey);
      if (!exists) {
        await this.loadUserLikesToCache(userId);
      }

      if (Array.isArray(postIds)) {
        // 批量查询
        const result = {};
        for (const postId of postIds) {
          result[postId] = await redisClient.sismember(cacheKey, postId);
        }
        return result;
      } else {
        // 单个查询
        return await redisClient.sismember(cacheKey, postIds);
      }
    } catch (error) {
      logger.error('获取点赞状态失败:', error);
      // 降级到数据库查询
      return await this.getLikesFromDB(userId, postIds);
    }
  }

  /**
   * 检查用户是否收藏了帖子
   * @param {String} userId 用户ID
   * @param {String|Array} postIds 帖子ID或ID数组
   * @returns {Promise<Boolean|Object>} 单个ID返回布尔值，多个ID返回对象映射
   */
  async isFavorited(userId, postIds) {
    if (!userId) return Array.isArray(postIds) ? {} : false;

    const cacheKey = this.getFavoritesCacheKey(userId);
    
    try {
      // 检查缓存是否存在
      const exists = await redisClient.exists(cacheKey);
      if (!exists) {
        await this.loadUserFavoritesToCache(userId);
      }

      if (Array.isArray(postIds)) {
        // 批量查询
        const result = {};
        for (const postId of postIds) {
          result[postId] = await redisClient.sismember(cacheKey, postId);
        }
        return result;
      } else {
        // 单个查询
        return await redisClient.sismember(cacheKey, postIds);
      }
    } catch (error) {
      logger.error('获取收藏状态失败:', error);
      // 降级到数据库查询
      return await this.getFavoritesFromDB(userId, postIds);
    }
  }

  /**
   * 添加点赞状态到缓存
   * @param {String} userId 用户ID
   * @param {String} postId 帖子ID
   */
  async addLike(userId, postId) {
    if (!userId || !postId) return;

    try {
      const cacheKey = this.getLikesCacheKey(userId);
      const dirtyKey = this.getDirtyKey('likes', userId);

      // 添加到缓存
      await redisClient.sadd(cacheKey, postId);
      await redisClient.expire(cacheKey, this.CACHE_TTL);

      // 标记为脏数据
      await redisClient.setex(dirtyKey, this.CACHE_TTL, Date.now().toString());
      
      logger.info(`缓存点赞状态: 用户${userId} 点赞帖子${postId}`);
    } catch (error) {
      logger.error('缓存点赞状态失败:', error);
    }
  }

  /**
   * 移除点赞状态从缓存
   * @param {String} userId 用户ID
   * @param {String} postId 帖子ID
   */
  async removeLike(userId, postId) {
    if (!userId || !postId) return;

    try {
      const cacheKey = this.getLikesCacheKey(userId);
      const dirtyKey = this.getDirtyKey('likes', userId);

      // 从缓存移除
      await redisClient.srem(cacheKey, postId);

      // 标记为脏数据
      await redisClient.setex(dirtyKey, this.CACHE_TTL, Date.now().toString());
      
      logger.info(`缓存取消点赞: 用户${userId} 取消点赞帖子${postId}`);
    } catch (error) {
      logger.error('缓存取消点赞失败:', error);
    }
  }

  /**
   * 添加收藏状态到缓存
   * @param {String} userId 用户ID
   * @param {String} postId 帖子ID
   */
  async addFavorite(userId, postId) {
    if (!userId || !postId) return;

    try {
      const cacheKey = this.getFavoritesCacheKey(userId);
      const dirtyKey = this.getDirtyKey('favorites', userId);

      // 添加到缓存
      await redisClient.sadd(cacheKey, postId);
      await redisClient.expire(cacheKey, this.CACHE_TTL);

      // 标记为脏数据
      await redisClient.setex(dirtyKey, this.CACHE_TTL, Date.now().toString());
      
      logger.info(`缓存收藏状态: 用户${userId} 收藏帖子${postId}`);
    } catch (error) {
      logger.error('缓存收藏状态失败:', error);
    }
  }

  /**
   * 移除收藏状态从缓存
   * @param {String} userId 用户ID
   * @param {String} postId 帖子ID
   */
  async removeFavorite(userId, postId) {
    if (!userId || !postId) return;

    try {
      const cacheKey = this.getFavoritesCacheKey(userId);
      const dirtyKey = this.getDirtyKey('favorites', userId);

      // 从缓存移除
      await redisClient.srem(cacheKey, postId);

      // 标记为脏数据
      await redisClient.setex(dirtyKey, this.CACHE_TTL, Date.now().toString());
      
      logger.info(`缓存取消收藏: 用户${userId} 取消收藏帖子${postId}`);
    } catch (error) {
      logger.error('缓存取消收藏失败:', error);
    }
  }

  /**
   * 从数据库加载用户点赞状态到缓存
   * @param {String} userId 用户ID
   */
  async loadUserLikesToCache(userId) {
    try {
      const likes = await Like.findAll({
        where: { 
          user_id: userId,
          deleted_at: null  // 🔧 只加载未删除的点赞
        },
        attributes: ['target_id'],
        raw: true
      });

      const cacheKey = this.getLikesCacheKey(userId);
      
      if (likes.length > 0) {
        const postIds = likes.map(like => like.target_id);
        await redisClient.sadd(cacheKey, ...postIds);
      } else {
        // 即使没有数据也要设置一个空集合，避免重复查询数据库
        await redisClient.sadd(cacheKey, '__PLACEHOLDER__');
        await redisClient.srem(cacheKey, '__PLACEHOLDER__');
      }
      
      await redisClient.expire(cacheKey, this.CACHE_TTL);
      
      logger.info(`加载用户点赞状态到缓存: 用户${userId}, ${likes.length}个点赞`);
    } catch (error) {
      logger.error('加载用户点赞状态失败:', error);
    }
  }

  /**
   * 从数据库加载用户收藏状态到缓存
   * @param {String} userId 用户ID
   */
  async loadUserFavoritesToCache(userId) {
    try {
      const favorites = await Favorite.findAll({
        where: { 
          user_id: userId,
          deleted_at: null  // 🔧 只加载未删除的收藏
        },
        attributes: ['post_id'],
        raw: true
      });

      const cacheKey = this.getFavoritesCacheKey(userId);
      
      if (favorites.length > 0) {
        const postIds = favorites.map(fav => fav.post_id);
        await redisClient.sadd(cacheKey, ...postIds);
      } else {
        // 即使没有数据也要设置一个空集合，避免重复查询数据库
        await redisClient.sadd(cacheKey, '__PLACEHOLDER__');
        await redisClient.srem(cacheKey, '__PLACEHOLDER__');
      }
      
      await redisClient.expire(cacheKey, this.CACHE_TTL);
      
      logger.info(`加载用户收藏状态到缓存: 用户${userId}, ${favorites.length}个收藏`);
    } catch (error) {
      logger.error('加载用户收藏状态失败:', error);
    }
  }

  /**
   * 降级方案：直接从数据库查询点赞状态
   * @param {String} userId 用户ID
   * @param {String|Array} postIds 帖子ID
   */
  async getLikesFromDB(userId, postIds) {
    try {
      const likes = await Like.findAll({
        where: {
          user_id: userId,
          target_id: Array.isArray(postIds) ? { [Op.in]: postIds } : postIds
        },
        attributes: ['target_id'],
        raw: true
      });

      if (Array.isArray(postIds)) {
        const likedSet = new Set(likes.map(like => like.target_id));
        const result = {};
        postIds.forEach(id => {
          result[id] = likedSet.has(id);
        });
        return result;
      } else {
        return likes.length > 0;
      }
    } catch (error) {
      logger.error('数据库查询点赞状态失败:', error);
      return Array.isArray(postIds) ? {} : false;
    }
  }

  /**
   * 降级方案：直接从数据库查询收藏状态
   * @param {String} userId 用户ID
   * @param {String|Array} postIds 帖子ID
   */
  async getFavoritesFromDB(userId, postIds) {
    try {
      const favorites = await Favorite.findAll({
        where: {
          user_id: userId,
          post_id: Array.isArray(postIds) ? { [Op.in]: postIds } : postIds
        },
        attributes: ['post_id'],
        raw: true
      });

      if (Array.isArray(postIds)) {
        const favSet = new Set(favorites.map(fav => fav.post_id));
        const result = {};
        postIds.forEach(id => {
          result[id] = favSet.has(id);
        });
        return result;
      } else {
        return favorites.length > 0;
      }
    } catch (error) {
      logger.error('数据库查询收藏状态失败:', error);
      return Array.isArray(postIds) ? {} : false;
    }
  }

  /**
   * 检查用户是否关注了其他用户
   * @param {String} userId 当前用户ID
   * @param {String|Array} targetUserIds 目标用户ID或ID数组
   * @returns {Promise<Boolean|Object>} 单个ID返回布尔值，多个ID返回对象映射
   */
  async isFollowing(userId, targetUserIds) {
    if (!userId) return Array.isArray(targetUserIds) ? {} : false;

    const cacheKey = this.getFollowingsCacheKey(userId);
    
    try {
      // 检查缓存是否存在
      const exists = await redisClient.exists(cacheKey);
      if (!exists) {
        await this.loadUserFollowingsToCache(userId);
      }

      if (Array.isArray(targetUserIds)) {
        // 批量查询
        const result = {};
        for (const targetUserId of targetUserIds) {
          result[targetUserId] = await redisClient.sismember(cacheKey, targetUserId);
        }
        return result;
      } else {
        // 单个查询
        return await redisClient.sismember(cacheKey, targetUserIds);
      }
    } catch (error) {
      logger.error('获取关注状态失败:', error);
      // 降级到数据库查询
      return await this.getFollowingsFromDB(userId, targetUserIds);
    }
  }

  /**
   * 添加关注状态到缓存
   * @param {String} userId 当前用户ID
   * @param {String} targetUserId 被关注用户ID
   */
  async addFollowing(userId, targetUserId) {
    if (!userId || !targetUserId) return;

    try {
      const cacheKey = this.getFollowingsCacheKey(userId);
      const dirtyKey = this.getDirtyKey('followings', userId);

      // 添加到缓存
      await redisClient.sadd(cacheKey, targetUserId);
      await redisClient.expire(cacheKey, this.CACHE_TTL);

      // 标记为脏数据
      await redisClient.setex(dirtyKey, this.CACHE_TTL, Date.now().toString());
      
      logger.info(`缓存关注状态: 用户${userId} 关注用户${targetUserId}`);
    } catch (error) {
      logger.error('缓存关注状态失败:', error);
    }
  }

  /**
   * 移除关注状态从缓存
   * @param {String} userId 当前用户ID
   * @param {String} targetUserId 被取消关注用户ID
   */
  async removeFollowing(userId, targetUserId) {
    if (!userId || !targetUserId) return;

    try {
      const cacheKey = this.getFollowingsCacheKey(userId);
      const dirtyKey = this.getDirtyKey('followings', userId);

      // 从缓存移除
      await redisClient.srem(cacheKey, targetUserId);

      // 标记为脏数据
      await redisClient.setex(dirtyKey, this.CACHE_TTL, Date.now().toString());
      
      logger.info(`缓存取消关注: 用户${userId} 取消关注用户${targetUserId}`);
    } catch (error) {
      logger.error('缓存取消关注失败:', error);
    }
  }

  /**
   * 从数据库加载用户关注状态到缓存
   * @param {String} userId 用户ID
   */
  async loadUserFollowingsToCache(userId) {
    try {
      const followings = await Follow.findAll({
        where: { 
          follower_id: userId,
          deleted_at: null  // 🔧 只加载未删除的关注
        },
        attributes: ['following_id'],
        raw: true
      });

      const cacheKey = this.getFollowingsCacheKey(userId);
      
      if (followings.length > 0) {
        const userIds = followings.map(follow => follow.following_id);
        await redisClient.sadd(cacheKey, ...userIds);
      } else {
        // 即使没有数据也要设置一个空集合，避免重复查询数据库
        await redisClient.sadd(cacheKey, '__PLACEHOLDER__');
        await redisClient.srem(cacheKey, '__PLACEHOLDER__');
      }
      
      await redisClient.expire(cacheKey, this.CACHE_TTL);
      
      logger.info(`加载用户关注状态到缓存: 用户${userId}, ${followings.length}个关注`);
    } catch (error) {
      logger.error('加载用户关注状态失败:', error);
    }
  }

  /**
   * 降级方案：直接从数据库查询关注状态
   * @param {String} userId 用户ID
   * @param {String|Array} targetUserIds 目标用户ID
   */
  async getFollowingsFromDB(userId, targetUserIds) {
    try {
      const followings = await Follow.findAll({
        where: {
          follower_id: userId,
          following_id: Array.isArray(targetUserIds) ? { [Op.in]: targetUserIds } : targetUserIds
        },
        attributes: ['following_id'],
        raw: true
      });

      if (Array.isArray(targetUserIds)) {
        const followingSet = new Set(followings.map(follow => follow.following_id));
        const result = {};
        targetUserIds.forEach(id => {
          result[id] = followingSet.has(id);
        });
        return result;
      } else {
        return followings.length > 0;
      }
    } catch (error) {
      logger.error('数据库查询关注状态失败:', error);
      return Array.isArray(targetUserIds) ? {} : false;
    }
  }

  /**
   * 清除用户所有状态缓存
   * @param {String} userId 用户ID
   */
  async clearUserCache(userId) {
    try {
      const likeKey = this.getLikesCacheKey(userId);
      const favoriteKey = this.getFavoritesCacheKey(userId);
      const followingKey = this.getFollowingsCacheKey(userId);

      await Promise.all([
        redisClient.del(likeKey),
        redisClient.del(favoriteKey),
        redisClient.del(followingKey),
        this.clearUserCounts(userId)   // 统计数据缓存
      ]);

      logger.info(`清除用户状态缓存: ${userId}`);
    } catch (error) {
      logger.error('清除用户状态缓存失败:', error);
    }
  }

  // ========== Write-Back策略相关方法 ==========

  /**
   * 启动定时写回任务
   */
  startFlushTimer() {
    // 每5秒执行一次批量写回
    setInterval(async () => {
      await this.flushPendingOperations();
    }, this.CACHE_TTL * 1000);
    
    logger.info(`Write-Back定时任务已启动，间隔${this.CACHE_TTL}秒`);
  }

  /**
   * 添加待处理操作到队列
   */
  async addPendingOperation(operation) {
    try {
      const operationData = JSON.stringify({
        ...operation,
        timestamp: Date.now()
      });
      
      await redisClient.lpush(this.PENDING_OPERATIONS_KEY, operationData);
      logger.info(`添加待处理操作: ${operation.type} - ${operation.userId} -> ${operation.targetId}`);
    } catch (error) {
      logger.error('添加待处理操作失败:', error);
    }
  }

  /**
   * 批量写回待处理操作到数据库
   */
  async flushPendingOperations() {
    // 使用分布式锁，防止多个实例同时执行
    const lockAcquired = await this.acquireFlushLock();
    if (!lockAcquired) {
      logger.debug('其他实例正在执行写回，跳过');
      return;
    }

    try {
      // 获取所有待处理操作
      const operations = await this.getAllPendingOperations();
      if (operations.length === 0) {
        return;
      }

      logger.info(`开始批量写回 ${operations.length} 个操作到数据库`);

      // 按类型分组处理
      const groupedOps = this.groupOperationsByType(operations);
      
      // 批量处理关注操作
      if (groupedOps.follow.length > 0) {
        await this.flushFollowOperations(groupedOps.follow);
      }
      
      // 批量处理点赞操作
      if (groupedOps.like.length > 0) {
        await this.flushLikeOperations(groupedOps.like);
      }
      
      // 批量处理收藏操作
      if (groupedOps.favorite.length > 0) {
        await this.flushFavoriteOperations(groupedOps.favorite);
      }

      // 清空已处理的操作
      await redisClient.del(this.PENDING_OPERATIONS_KEY);
      
      logger.info(`批量写回完成: 关注${groupedOps.follow.length}个, 点赞${groupedOps.like.length}个, 收藏${groupedOps.favorite.length}个`);

    } catch (error) {
      logger.error('批量写回失败:', error);
    } finally {
      await this.releaseFlushLock();
    }
  }

  /**
   * 获取分布式锁
   */
  async acquireFlushLock() {
    try {
      // 使用Redis的SET命令实现分布式锁：SET key value EX seconds NX
      const result = await redisClient.getClient().set(this.FLUSH_LOCK_KEY, 'locked', 'EX', 30, 'NX');
      return result === 'OK';
    } catch (error) {
      logger.error('获取写回锁失败:', error);
      return false;
    }
  }

  /**
   * 释放分布式锁
   */
  async releaseFlushLock() {
    try {
      await redisClient.del(this.FLUSH_LOCK_KEY);
    } catch (error) {
      logger.error('释放写回锁失败:', error);
    }
  }

  /**
   * 获取所有待处理操作
   */
  async getAllPendingOperations() {
    try {
      const operations = [];
      
      // 使用RPOP逐个取出操作，直到队列为空
      while (true) {
        const operationData = await redisClient.rpop(this.PENDING_OPERATIONS_KEY);
        if (!operationData) break;
        
        try {
          operations.push(JSON.parse(operationData));
        } catch (parseError) {
          logger.error('解析操作数据失败:', parseError);
        }
      }
      
      return operations;
    } catch (error) {
      logger.error('获取待处理操作失败:', error);
      return [];
    }
  }

  /**
   * 按操作类型分组
   */
  groupOperationsByType(operations) {
    const groups = {
      follow: [],
      like: [],
      favorite: []
    };

    operations.forEach(op => {
      if (groups[op.type]) {
        groups[op.type].push(op);
      }
    });

    return groups;
  }

  /**
   * 批量处理关注操作
   */
  async flushFollowOperations(operations) {
    const Follow = require('../models').Follow;
    
    for (const op of operations) {
      try {
        if (op.action === 'follow') {
          await Follow.findOrCreate({
            where: {
              follower_id: op.userId,
              following_id: op.targetId
            },
            defaults: {
              follower_id: op.userId,
              following_id: op.targetId
            }
          });
        } else if (op.action === 'unfollow') {
          await Follow.destroy({
            where: {
              follower_id: op.userId,
              following_id: op.targetId
            }
          });
        }
      } catch (error) {
        logger.error(`处理关注操作失败 ${op.userId}->${op.targetId}:`, error);
      }
    }
  }

  /**
   * 批量处理点赞操作
   */
  async flushLikeOperations(operations) {
    const { Like, Post, Comment } = require('../models');
    
    for (const op of operations) {
      try {
        const targetType = op.targetType || 'post';
        
        if (op.action === 'like') {
          const [like, created] = await Like.findOrCreate({
            where: {
              user_id: op.userId,
              target_id: op.targetId,
              target_type: targetType
            },
            defaults: {
              user_id: op.userId,
              target_id: op.targetId,
              target_type: targetType
            }
          });
          
          // 🔧 只有真正创建了新记录才更新计数
          if (created) {
            if (targetType === 'post') {
              await Post.increment('like_count', {
                where: { id: op.targetId }
              });
              logger.debug(`Write-Back: 更新帖子${op.targetId}点赞计数 +1`);
            } else if (targetType === 'comment') {
              await Comment.increment('like_count', {
                where: { id: op.targetId }
              });
              logger.debug(`Write-Back: 更新评论${op.targetId}点赞计数 +1`);
            }
          }
        } else if (op.action === 'unlike') {
          const deletedCount = await Like.destroy({
            where: {
              user_id: op.userId,
              target_id: op.targetId,
              target_type: targetType
            }
          });
          
          // 🔧 只有真正删除了记录才更新计数
          if (deletedCount > 0) {
            if (targetType === 'post') {
              await Post.decrement('like_count', {
                where: { id: op.targetId }
              });
              logger.debug(`Write-Back: 更新帖子${op.targetId}点赞计数 -1`);
            } else if (targetType === 'comment') {
              await Comment.decrement('like_count', {
                where: { id: op.targetId }
              });
              logger.debug(`Write-Back: 更新评论${op.targetId}点赞计数 -1`);
            }
          }
        }
      } catch (error) {
        logger.error(`处理点赞操作失败 ${op.userId}->${op.targetId}:`, error);
      }
    }
  }

  /**
   * 批量处理收藏操作
   */
  async flushFavoriteOperations(operations) {
    const { Favorite, Post } = require('../models');
    
    for (const op of operations) {
      try {
        if (op.action === 'favorite') {
          const [favorite, created] = await Favorite.findOrCreate({
            where: {
              user_id: op.userId,
              post_id: op.targetId
            },
            defaults: {
              user_id: op.userId,
              post_id: op.targetId
            }
          });
          
          // 🔧 只有真正创建了新记录才更新计数
          if (created) {
            await Post.increment('favorite_count', {
              where: { id: op.targetId }
            });
            logger.debug(`Write-Back: 更新帖子${op.targetId}收藏计数 +1`);
          }
        } else if (op.action === 'unfavorite') {
          const deletedCount = await Favorite.destroy({
            where: {
              user_id: op.userId,
              post_id: op.targetId
            }
          });
          
          // 🔧 只有真正删除了记录才更新计数
          if (deletedCount > 0) {
            await Post.decrement('favorite_count', {
              where: { id: op.targetId }
            });
            logger.debug(`Write-Back: 更新帖子${op.targetId}收藏计数 -1`);
          }
        }
      } catch (error) {
        logger.error(`处理收藏操作失败 ${op.userId}->${op.targetId}:`, error);
      }
    }
  }

  // ========== 统计数据缓存管理 ==========

  /**
   * 获取用户统计数据缓存键
   */
  getUserCountsCacheKey(userId) {
    return `${this.COUNT_CACHE_PREFIX}${userId}`;
  }

  /**
   * 获取用户统计数据（优先缓存）
   */
  async getUserCounts(userId) {
    const cacheKey = this.getUserCountsCacheKey(userId);
    
    try {
      // 尝试从缓存获取
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug(`从缓存获取用户统计数据: ${userId}`);
        return cached;
      }
    } catch (error) {
      logger.warn('获取统计数据缓存失败:', error);
    }
    
    // 缓存未命中，从数据库加载
    return await this.loadUserCountsToCache(userId);
  }

  /**
   * 从数据库加载用户统计数据到缓存
   */
  async loadUserCountsToCache(userId) {
    try {
      const followRepository = require('../repositories/follow.repository');
      
      // 从数据库获取统计数据
      const [followingCount, followerCount] = await Promise.all([
        followRepository.countFollowings(userId),
        followRepository.countFollowers(userId)
      ]);
      
      const counts = {
        following_count: followingCount,
        follower_count: followerCount,
        updated_at: Date.now()
      };
      
      // 缓存统计数据
      const cacheKey = this.getUserCountsCacheKey(userId);
      await redisClient.set(cacheKey, counts, this.COUNT_CACHE_TTL);
      
      logger.info(`加载用户统计数据到缓存: 用户${userId}, 关注${followingCount}个, 粉丝${followerCount}个`);
      return counts;
    } catch (error) {
      logger.error(`加载用户统计数据失败: ${userId}`, error);
      // 返回默认值
      return {
        following_count: 0,
        follower_count: 0,
        updated_at: Date.now()
      };
    }
  }

  /**
   * 更新用户关注数量缓存
   */
  async updateFollowingCount(userId, delta) {
    const cacheKey = this.getUserCountsCacheKey(userId);
    
    try {
      // 获取当前缓存数据
      let counts = await redisClient.get(cacheKey);
      if (!counts) {
        // 如果缓存不存在，先加载
        counts = await this.loadUserCountsToCache(userId);
      }
      
      // 更新关注数量
      counts.following_count = Math.max(0, counts.following_count + delta);
      counts.updated_at = Date.now();
      
      // 更新缓存
      await redisClient.set(cacheKey, counts, this.COUNT_CACHE_TTL);
      
      logger.debug(`更新用户${userId}关注数量: ${delta > 0 ? '+' : ''}${delta} -> ${counts.following_count}`);
      return counts.following_count;
    } catch (error) {
      logger.error(`更新关注数量缓存失败: ${userId}`, error);
      return null;
    }
  }

  /**
   * 更新用户粉丝数量缓存
   */
  async updateFollowerCount(userId, delta) {
    const cacheKey = this.getUserCountsCacheKey(userId);
    
    try {
      // 获取当前缓存数据
      let counts = await redisClient.get(cacheKey);
      if (!counts) {
        // 如果缓存不存在，先加载
        counts = await this.loadUserCountsToCache(userId);
      }
      
      // 更新粉丝数量
      counts.follower_count = Math.max(0, counts.follower_count + delta);
      counts.updated_at = Date.now();
      
      // 更新缓存
      await redisClient.set(cacheKey, counts, this.COUNT_CACHE_TTL);
      
      logger.debug(`更新用户${userId}粉丝数量: ${delta > 0 ? '+' : ''}${delta} -> ${counts.follower_count}`);
      return counts.follower_count;
    } catch (error) {
      logger.error(`更新粉丝数量缓存失败: ${userId}`, error);
      return null;
    }
  }

  /**
   * 清除用户统计数据缓存
   */
  async clearUserCounts(userId) {
    const cacheKey = this.getUserCountsCacheKey(userId);
    
    try {
      await redisClient.del(cacheKey);
      logger.debug(`清除用户统计数据缓存: ${userId}`);
    } catch (error) {
      logger.error(`清除统计数据缓存失败: ${userId}`, error);
    }
  }
}

module.exports = new StatusCacheService();
