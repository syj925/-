/**
 * 表情缓存服务
 * 管理表情系统的所有缓存操作
 */
const { redisClient } = require('../utils');
const cacheConfig = require('../../config/cache');
const logger = require('../../config/logger');

class EmojiCacheService {
  constructor() {
    this.config = cacheConfig.EMOJI;
  }

  // ==================== 表情包缓存 ====================

  /**
   * 获取表情包列表缓存
   * @returns {Promise<Array|null>}
   */
  async getPacksCache() {
    try {
      const cached = await redisClient.get(this.config.PACKS_KEY);
      if (cached) {
        logger.debug('从缓存获取表情包列表');
        return cached;
      }
    } catch (error) {
      logger.warn('读取表情包缓存失败:', error.message);
    }
    return null;
  }

  /**
   * 设置表情包列表缓存
   * @param {Array} packs 表情包列表
   */
  async setPacksCache(packs) {
    try {
      await redisClient.set(this.config.PACKS_KEY, packs, this.config.PACKS_TTL);
      logger.debug('表情包列表已缓存');
    } catch (error) {
      logger.warn('写入表情包缓存失败:', error.message);
    }
  }

  // ==================== 表情映射表缓存 ====================

  /**
   * 获取表情映射表缓存
   * @returns {Promise<Object|null>}
   */
  async getEmojiMapCache() {
    try {
      const cached = await redisClient.get(this.config.MAP_KEY);
      if (cached) {
        logger.debug('从缓存获取表情映射表');
        return cached;
      }
    } catch (error) {
      logger.warn('读取表情映射表缓存失败:', error.message);
    }
    return null;
  }

  /**
   * 设置表情映射表缓存
   * @param {Object} map 映射表 { code: emoji }
   */
  async setEmojiMapCache(map) {
    try {
      await redisClient.set(this.config.MAP_KEY, map, this.config.MAP_TTL);
      logger.debug('表情映射表已缓存');
    } catch (error) {
      logger.warn('写入表情映射表缓存失败:', error.message);
    }
  }

  // ==================== 版本控制 ====================

  /**
   * 获取当前版本号
   * @returns {Promise<number>}
   */
  async getVersion() {
    try {
      const version = await redisClient.get(this.config.VERSION_KEY);
      return version ? parseInt(version) : 1;
    } catch (error) {
      logger.warn('读取表情版本失败:', error.message);
      return 1;
    }
  }

  /**
   * 设置版本号
   * @param {number} version 版本号
   */
  async setVersion(version) {
    try {
      await redisClient.set(this.config.VERSION_KEY, version.toString());
      logger.info(`表情版本设置为: ${version}`);
    } catch (error) {
      logger.error('设置表情版本失败:', error.message);
    }
  }

  /**
   * 版本号自增
   * @returns {Promise<number>} 新版本号
   */
  async incrementVersion() {
    try {
      const client = redisClient.getClient();
      const newVersion = await client.incr(this.config.VERSION_KEY);
      logger.info(`表情版本更新: ${newVersion}`);
      return newVersion;
    } catch (error) {
      logger.error('更新表情版本失败:', error.message);
      return null;
    }
  }

  // ==================== 搜索缓存 ====================

  /**
   * 获取搜索结果缓存
   * @param {string} keyword 搜索关键字
   * @returns {Promise<Array|null>}
   */
  async getSearchCache(keyword) {
    try {
      const key = `${this.config.SEARCH_PREFIX}${keyword}`;
      const cached = await redisClient.get(key);
      if (cached) {
        logger.debug(`从缓存获取搜索结果: ${keyword}`);
        return cached;
      }
    } catch (error) {
      logger.warn('读取搜索缓存失败:', error.message);
    }
    return null;
  }

  /**
   * 设置搜索结果缓存
   * @param {string} keyword 搜索关键字
   * @param {Array} results 搜索结果
   */
  async setSearchCache(keyword, results) {
    try {
      const key = `${this.config.SEARCH_PREFIX}${keyword}`;
      await redisClient.set(key, results, this.config.SEARCH_TTL);
      logger.debug(`搜索结果已缓存: ${keyword}`);
    } catch (error) {
      logger.warn('写入搜索缓存失败:', error.message);
    }
  }

  // ==================== 热门表情缓存 ====================

  /**
   * 获取热门表情缓存
   * @returns {Promise<Array|null>}
   */
  async getHotCache() {
    try {
      const cached = await redisClient.get(this.config.HOT_KEY);
      if (cached) {
        logger.debug('从缓存获取热门表情');
        return cached;
      }
    } catch (error) {
      logger.warn('读取热门表情缓存失败:', error.message);
    }
    return null;
  }

  /**
   * 设置热门表情缓存
   * @param {Array} emojis 热门表情列表
   */
  async setHotCache(emojis) {
    try {
      await redisClient.set(this.config.HOT_KEY, emojis, this.config.HOT_TTL);
      logger.debug('热门表情已缓存');
    } catch (error) {
      logger.warn('写入热门表情缓存失败:', error.message);
    }
  }

  // ==================== 用户最近使用 ====================

  /**
   * 添加到用户最近使用列表
   * @param {string} userId 用户ID
   * @param {string} emojiId 表情ID
   */
  async addRecentEmoji(userId, emojiId) {
    const key = `${this.config.RECENT_PREFIX}${userId}`;
    try {
      const client = redisClient.getClient();
      // LRU: 先移除已有的，再添加到头部
      await client.lrem(key, 0, emojiId);
      await client.lpush(key, emojiId);
      await client.ltrim(key, 0, this.config.RECENT_LIMIT - 1);
      await client.expire(key, this.config.RECENT_TTL);
      logger.debug(`用户${userId}最近使用表情已更新`);
    } catch (error) {
      logger.warn('更新最近使用表情失败:', error.message);
    }
  }

  /**
   * 获取用户最近使用的表情ID列表
   * @param {string} userId 用户ID
   * @returns {Promise<Array>} 表情ID列表
   */
  async getRecentEmojiIds(userId) {
    const key = `${this.config.RECENT_PREFIX}${userId}`;
    try {
      const client = redisClient.getClient();
      const ids = await client.lrange(key, 0, -1);
      return ids || [];
    } catch (error) {
      logger.warn('获取最近使用表情失败:', error.message);
      return [];
    }
  }

  // ==================== 使用计数 ====================

  /**
   * 增加表情使用计数（Redis中暂存）
   * @param {string} emojiId 表情ID
   */
  async incrementUseCount(emojiId) {
    try {
      const client = redisClient.getClient();
      await client.hincrby(this.config.USE_COUNT_KEY, emojiId, 1);
    } catch (error) {
      logger.warn('增加使用计数失败:', error.message);
    }
  }

  /**
   * 获取所有待同步的使用计数
   * @returns {Promise<Object>} { emojiId: count }
   */
  async getAllUseCounts() {
    try {
      const client = redisClient.getClient();
      const counts = await client.hgetall(this.config.USE_COUNT_KEY);
      return counts || {};
    } catch (error) {
      logger.warn('获取使用计数失败:', error.message);
      return {};
    }
  }

  /**
   * 清除使用计数（同步后调用）
   */
  async clearUseCounts() {
    try {
      await redisClient.del(this.config.USE_COUNT_KEY);
      logger.debug('使用计数已清除');
    } catch (error) {
      logger.warn('清除使用计数失败:', error.message);
    }
  }

  // ==================== 上传限制 ====================

  /**
   * 检查并增加用户今日上传次数
   * @param {string} userId 用户ID
   * @param {number} limit 每日限制
   * @returns {Promise<{allowed: boolean, count: number}>}
   */
  async checkUploadLimit(userId, limit = 10) {
    const today = new Date().toISOString().split('T')[0];
    const key = `${this.config.UPLOAD_LIMIT_PREFIX}${userId}:${today}`;
    
    try {
      const client = redisClient.getClient();
      const count = await client.incr(key);
      
      if (count === 1) {
        // 首次上传，设置过期时间
        await client.expire(key, 24 * 60 * 60);
      }
      
      return {
        allowed: count <= limit,
        count
      };
    } catch (error) {
      logger.warn('检查上传限制失败:', error.message);
      // 出错时允许上传
      return { allowed: true, count: 0 };
    }
  }

  // ==================== 缓存清除 ====================

  /**
   * 清除所有表情相关缓存
   * @param {Object} options 选项
   */
  async clearAllCache(options = {}) {
    const {
      clearPacks = true,
      clearMap = true,
      clearSearch = true,
      clearHot = true
    } = options;

    const keysToDelete = [];

    if (clearPacks) keysToDelete.push(this.config.PACKS_KEY);
    if (clearMap) keysToDelete.push(this.config.MAP_KEY);
    if (clearHot) keysToDelete.push(this.config.HOT_KEY);

    try {
      // 删除固定键
      if (keysToDelete.length > 0) {
        await redisClient.del(...keysToDelete);
      }

      // 删除搜索缓存（模式匹配）
      if (clearSearch) {
        await redisClient.deletePattern(`${this.config.SEARCH_PREFIX}*`);
      }

      logger.info('表情缓存已清除', { clearPacks, clearMap, clearSearch, clearHot });
    } catch (error) {
      logger.error('清除表情缓存失败:', error.message);
    }
  }

  /**
   * 清除指定表情包相关缓存
   * @param {string} packId 表情包ID
   */
  async clearPackCache(packId) {
    // 表情包变更需要清除列表和映射表
    await this.clearAllCache({
      clearPacks: true,
      clearMap: true,
      clearSearch: true,
      clearHot: false
    });
  }
}

module.exports = new EmojiCacheService();
