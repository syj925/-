const { Setting } = require('../models');
const { Op } = require('sequelize');
const redisClient = require('../utils/redis-client');
const logger = require('../../config/logger');

/**
 * 设置数据访问层
 */
class SettingRepository {
  constructor() {
    this.cachePrefix = 'setting:';
  }

  /**
   * 获取推荐算法相关设置
   * @returns {Promise<Object>} 推荐设置对象
   */
  async getRecommendationSettings() {
    try {
      const recommendationKeys = [
        // 🎯 基础权重配置
        'likeWeight',
        'commentWeight', 
        'collectionWeight',
        'viewWeight',
        'timeDecayDays',
        'maxAgeDays',
        
        // 🎛️ 推荐策略配置
        'scoreThreshold',
        'maxAdminRecommended',
        'enableScoreSort',
        'minInteractionScore',
        'strategy',
        
        // 🎨 质量评估配置 (v2.0新增)
        'newPostBonus',
        'imageBonus',
        'contentBonus',
        'topicBonus',
        'engagementFactor',
        
        // 🔄 多样性控制配置 (v2.0新增)
        'maxSameAuthorRatio',
        'diversityPeriodHours',
        
        // ⏰ 更新频率配置
        'updateIntervalHours',
        
        // 🏪 缓存配置
        'enableCache',
        'cacheExpireMinutes',
        
        // 🔍 搜索页推荐配置
        'searchPageRecommendCount',
        'enableSearchPageRecommend',
        'searchRecommendTypes'
      ];

      const settings = await Setting.findAll({
        where: {
          key: {
            [Op.in]: recommendationKeys
          }
        }
      });

      // 转换为键值对对象
      const settingsObj = {};
      settings.forEach(setting => {
        const key = setting.key;
        let value = setting.value;

        // 根据类型转换值
        if (['likeWeight', 'commentWeight', 'collectionWeight', 'viewWeight', 
             'scoreThreshold', 'minInteractionScore', 'newPostBonus', 'imageBonus', 
             'contentBonus', 'topicBonus', 'engagementFactor', 'maxSameAuthorRatio'].includes(key)) {
          value = parseFloat(value);
        } else if (['timeDecayDays', 'maxAgeDays', 'maxAdminRecommended', 'cacheExpireMinutes', 
                    'diversityPeriodHours', 'updateIntervalHours', 'searchPageRecommendCount'].includes(key)) {
          value = parseInt(value);
        } else if (['enableCache', 'enableScoreSort', 'enableSearchPageRecommend'].includes(key)) {
          value = value === 'true' || value === true;
        } else if (key === 'searchRecommendTypes') {
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = [];
          }
        }
        // strategy 保持字符串

        settingsObj[key] = value;
      });

      return settingsObj;
    } catch (error) {
      logger.error('获取推荐设置失败:', error);
      return {};
    }
  }

  /**
   * 获取单个设置值
   * @param {String} key 设置键
   * @param {String} defaultValue 默认值
   * @returns {Promise<String>} 设置值
   */
  async getSetting(key, defaultValue = null) {
    try {
      // 先尝试从缓存获取
      const cacheKey = `${this.cachePrefix}${key}`;
      const cached = await redisClient.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 从数据库获取
      const setting = await Setting.findOne({
        where: { key }
      });

      const value = setting ? setting.value : defaultValue;

      // 缓存结果（5分钟）
      if (value !== null) {
        await redisClient.setex(cacheKey, 300, value);
      }

      return value;
    } catch (error) {
      logger.error(`获取设置 ${key} 失败:`, error);
      return defaultValue;
    }
  }

  /**
   * 设置单个配置值
   * @param {String} key 设置键
   * @param {String} value 设置值
   * @param {String} description 描述
   * @returns {Promise<Object>} 设置对象
   */
  async setSetting(key, value, description = '') {
    try {
      const [setting, created] = await Setting.findOrCreate({
        where: { key },
        defaults: {
          key,
          value: String(value),
          description,
          type: this.inferType(value),
          is_system: true
        }
      });

      if (!created) {
        await setting.update({
          value: String(value),
          description: description || setting.description
        });
      }

      // 清除缓存
      const cacheKey = `${this.cachePrefix}${key}`;
      await redisClient.del(cacheKey);

      return setting;
    } catch (error) {
      logger.error(`设置配置 ${key} 失败:`, error);
      throw error;
    }
  }

  /**
   * 批量设置配置
   * @param {Object} settings 设置对象
   * @returns {Promise<Array>} 设置结果数组
   */
  async setMultipleSettings(settings) {
    try {
      const results = [];
      const cacheKeys = [];

      for (const [key, value] of Object.entries(settings)) {
        const [setting, created] = await Setting.findOrCreate({
          where: { key },
          defaults: {
            key,
            value: String(value),
            type: this.inferType(value),
            is_system: true
          }
        });

        if (!created) {
          await setting.update({
            value: String(value)
          });
        }

        results.push(setting);
        cacheKeys.push(`${this.cachePrefix}${key}`);
      }

      // 批量清除缓存
      if (cacheKeys.length > 0) {
        await redisClient.del(...cacheKeys);
      }

      return results;
    } catch (error) {
      logger.error('批量设置配置失败:', error);
      throw error;
    }
  }

  /**
   * 初始化推荐算法默认设置
   * @returns {Promise<Array>} 初始化结果
   */
  async initializeRecommendationSettings() {
    const defaultSettings = {
      likeWeight: '2.0',
      commentWeight: '3.0',
      collectionWeight: '4.0',
      viewWeight: '0.5',
      timeDecayDays: '10',
      maxAgeDays: '30',
      maxAdminRecommended: '5',
      strategy: 'mixed',
      enableCache: 'true',
      cacheExpireMinutes: '15',
      minInteractionScore: '2'
    };

    const settingsWithDescription = {
      likeWeight: { value: '2.0', description: '推荐算法中点赞的权重系数' },
      commentWeight: { value: '3.0', description: '推荐算法中评论的权重系数' },
      collectionWeight: { value: '4.0', description: '推荐算法中收藏的权重系数' },
      viewWeight: { value: '0.5', description: '推荐算法中浏览量的权重系数' },
      timeDecayDays: { value: '10', description: '推荐算法中时间衰减的半衰期(天)' },
      maxAgeDays: { value: '30', description: '推荐算法中内容的最大有效天数' },
      maxAdminRecommended: { value: '5', description: '首页最多显示的管理员推荐数量' },
      strategy: { value: 'mixed', description: '推荐策略: hot-热门, latest-最新, mixed-混合' },
      enableCache: { value: 'true', description: '是否启用推荐结果缓存' },
      cacheExpireMinutes: { 
        value: String(require('../../config/cache').RECOMMENDATION.TTL / 60), 
        description: '推荐结果缓存过期时间(分钟)' 
      },
      minInteractionScore: { value: '2', description: '推荐算法的最低互动分数阈值' }
    };

    try {
      const results = [];

      for (const [key, config] of Object.entries(settingsWithDescription)) {
        const [setting, created] = await Setting.findOrCreate({
          where: { key },
          defaults: {
            key,
            value: config.value,
            description: config.description,
            type: this.inferType(config.value),
            is_system: true
          }
        });

        results.push({ key, created, setting });
      }

      // 清除相关缓存
      await this.clearRecommendationCache();

      logger.info('推荐算法设置初始化完成', {
        total: results.length,
        created: results.filter(r => r.created).length,
        updated: results.filter(r => !r.created).length
      });

      return results;
    } catch (error) {
      logger.error('初始化推荐设置失败:', error);
      throw error;
    }
  }

  /**
   * 清除推荐相关缓存
   */
  async clearRecommendationCache() {
    try {
      const patterns = [
        `${this.cachePrefix}*`,
        'recommendation:*'
      ];

      for (const pattern of patterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      }

      logger.info('推荐相关缓存已清除');
    } catch (error) {
      logger.error('清除推荐缓存失败:', error);
    }
  }

  /**
   * 获取所有设置
   * @returns {Promise<Array>} 设置列表
   */
  async getAllSettings() {
    try {
      return await Setting.findAll({
        order: [['key', 'ASC']]
      });
    } catch (error) {
      logger.error('获取所有设置失败:', error);
      return [];
    }
  }

  /**
   * 根据前缀获取设置
   * @param {String} prefix 前缀
   * @returns {Promise<Array>} 设置列表
   */
  async getSettingsByPrefix(prefix) {
    try {
      return await Setting.findAll({
        where: {
          key: {
            [Op.like]: `${prefix}%`
          }
        },
        order: [['key', 'ASC']]
      });
    } catch (error) {
      logger.error(`获取前缀为 ${prefix} 的设置失败:`, error);
      return [];
    }
  }

  /**
   * 删除设置
   * @param {String} key 设置键
   * @returns {Promise<Boolean>} 是否删除成功
   */
  async deleteSetting(key) {
    try {
      const result = await Setting.destroy({
        where: { key }
      });

      if (result > 0) {
        // 清除缓存
        const cacheKey = `${this.cachePrefix}${key}`;
        await redisClient.del(cacheKey);
      }

      return result > 0;
    } catch (error) {
      logger.error(`删除设置 ${key} 失败:`, error);
      return false;
    }
  }

  /**
   * 推断值的类型
   * @param {*} value 值
   * @returns {String} 类型
   */
  inferType(value) {
    if (typeof value === 'boolean' || value === 'true' || value === 'false') {
      return 'boolean';
    }
    if (!isNaN(value) && !isNaN(parseFloat(value))) {
      return 'number'; // 统一使用 number，因为模型中没有 integer 类型
    }
    return 'string';
  }
}

module.exports = new SettingRepository();
