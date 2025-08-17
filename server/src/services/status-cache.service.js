const { redisClient } = require('../utils');
const logger = require('../../config/logger');
const { Like, Favorite } = require('../models');
const { Op } = require('sequelize');
const cacheConfig = require('../../config/cache');

/**
 * 用户状态缓存服务
 * 使用Redis缓存用户的点赞、收藏状态，减少数据库查询压力
 */
class StatusCacheService {
  constructor() {
    this.CACHE_PREFIX = cacheConfig.USER_STATUS.PREFIX;
    this.DIRTY_PREFIX = cacheConfig.USER_STATUS.DIRTY_PREFIX;
    this.CACHE_TTL = cacheConfig.getTTL('USER_STATUS', cacheConfig.USER_STATUS.TTL);
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
        where: { user_id: userId },
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
        where: { user_id: userId },
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
   * 清除用户所有状态缓存
   * @param {String} userId 用户ID
   */
  async clearUserCache(userId) {
    try {
      const likeKey = this.getLikesCacheKey(userId);
      const favoriteKey = this.getFavoritesCacheKey(userId);

      await Promise.all([
        redisClient.del(likeKey),
        redisClient.del(favoriteKey)
      ]);

      logger.info(`清除用户状态缓存: ${userId}`);
    } catch (error) {
      logger.error('清除用户状态缓存失败:', error);
    }
  }
}

module.exports = new StatusCacheService();
