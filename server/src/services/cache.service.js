const { redisClient } = require('../utils');
const logger = require('../../config/logger');

/**
 * Cache Management Service
 * Centralizes cache invalidation and management logic
 */
class CacheService {
  constructor() {
    this.redis = redisClient;
  }

  /**
   * Clear all topic related caches
   * @param {String} [topicId] Optional specific topic ID to clear
   */
  async clearTopicCache(topicId) {
    try {
      const keys = ['topics:all', 'topics:hot'];
      if (topicId) {
        keys.push(`topic:${topicId}`);
      }
      
      // Pattern match for other topic lists if needed
      // const patternKeys = await this.redis.getClient().keys('topics:*');
      
      await this.redis.del(...keys);
      logger.debug('Topic cache cleared', { topicId });
    } catch (error) {
      logger.error('Failed to clear topic cache:', error);
    }
  }

  /**
   * Clear all category related caches
   * @param {String} [categoryId] Optional specific category ID to clear
   */
  async clearCategoryCache(categoryId) {
    try {
      const keys = ['categories:all', 'categories:enabled:all'];
      if (categoryId) {
        keys.push(`category:${categoryId}`);
      }
      await this.redis.del(...keys);
      logger.debug('Category cache cleared', { categoryId });
    } catch (error) {
      logger.error('Failed to clear category cache:', error);
    }
  }

  /**
   * Clear post related caches
   * @param {String} postId Post ID
   */
  async clearPostCache(postId) {
    try {
      const keys = [`post:${postId}`, `post:${postId}:details`];
      // Also clear hot posts cache if this post might be in it
      // Since we don't know for sure, clearing generic lists might be needed
      // For now, just clear specific post
      await this.redis.del(...keys);
      logger.debug('Post cache cleared', { postId });
    } catch (error) {
      logger.error('Failed to clear post cache:', error);
    }
  }

  /**
   * Generic cache clear by pattern
   * @param {String} pattern Redis key pattern
   */
  async clearByPattern(pattern) {
    try {
      await this.redis.deletePattern(pattern);
    } catch (error) {
      logger.error(`Failed to clear cache by pattern ${pattern}:`, error);
    }
  }
}

module.exports = new CacheService();
