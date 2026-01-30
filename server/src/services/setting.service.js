const settingRepository = require('../repositories/setting.repository');
const topicService = require('./topic.service');
const logger = require('../../config/logger');

/**
 * 系统设置服务层
 * 处理系统设置相关的业务逻辑
 */
class SettingService {
  /**
   * 获取所有系统设置
   * @returns {Promise<Object>} 设置对象（键值对格式）
   */
  async getAllSettings() {
    const settings = await settingRepository.getAllSettings();
    
    // 转换为键值对格式
    const settingsObj = {};
    settings.forEach(setting => {
      let value = setting.value;
      
      // 根据类型转换值
      switch (setting.type) {
        case 'boolean':
          value = value === 'true';
          break;
        case 'number':
          value = parseFloat(value) || 0;
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = [];
          }
          break;
        default:
          // string类型保持原样
          break;
      }
      
      settingsObj[setting.key] = value;
    });

    return settingsObj;
  }

  /**
   * 获取单个设置
   * @param {String} key 设置键
   * @param {*} defaultValue 默认值
   * @returns {Promise<*>} 设置值
   */
  async getSetting(key, defaultValue = null) {
    return await settingRepository.getSetting(key, defaultValue);
  }

  /**
   * 更新系统设置
   * @param {Object} settings 设置对象
   * @returns {Promise<void>}
   */
  async updateSettings(settings) {
    // 检查是否更新了推荐话题设置
    let featuredTopicIdsChanged = false;
    let newFeaturedTopicIds = [];

    // 批量更新系统设置
    for (const key in settings) {
      if (Object.hasOwnProperty.call(settings, key)) {
        const value = settings[key];

        // 处理不同类型的设置值
        let settingValue;
        let settingType;

        if (Array.isArray(value)) {
          settingValue = JSON.stringify(value);
          settingType = 'json';
        } else if (typeof value === 'boolean') {
          settingValue = String(value);
          settingType = 'boolean';
        } else if (typeof value === 'number') {
          settingValue = String(value);
          settingType = 'number';
        } else {
          settingValue = String(value);
          settingType = 'string';
        }

        // 检查是否是推荐话题设置
        if (key === 'featuredTopicIds') {
          featuredTopicIdsChanged = true;
          // 解析推荐话题ID
          if (settingValue && settingValue.trim()) {
            newFeaturedTopicIds = settingValue
              .split(',')
              .map(id => parseInt(id.trim()))
              .filter(id => !isNaN(id));
          }
        }

        // 使用 repository 设置值
        await settingRepository.setSetting(key, settingValue, `${key}设置`);
      }
    }

    // 如果推荐话题设置发生变化，同步更新话题的热门状态
    if (featuredTopicIdsChanged) {
      await this._syncFeaturedTopics(newFeaturedTopicIds);
    }
  }

  /**
   * 同步推荐话题状态
   * @param {Array<Number>} newFeaturedTopicIds 新的推荐话题ID列表
   * @private
   */
  async _syncFeaturedTopics(newFeaturedTopicIds) {
    try {
      logger.info('推荐话题设置已更改，同步更新话题热门状态:', {
        newFeaturedTopicIds
      });

      // 获取当前所有热门话题
      const hotTopics = await topicService.getHotTopics(100);
      const currentHotTopicIds = hotTopics.map(topic => topic.id);

      // 计算需要移除热门状态的话题
      const topicsToRemoveHot = currentHotTopicIds.filter(id => !newFeaturedTopicIds.includes(id));

      // 计算需要添加热门状态的话题
      const topicsToAddHot = newFeaturedTopicIds.filter(id => !currentHotTopicIds.includes(id));

      let updateCount = 0;

      // 移除不再是推荐的话题的热门状态
      for (const topicId of topicsToRemoveHot) {
        try {
          await topicService.setHotStatus(topicId, false);
          updateCount++;
        } catch (error) {
          logger.warn(`移除话题 ${topicId} 热门状态失败:`, error.message);
        }
      }

      // 为新推荐的话题添加热门状态
      for (const topicId of topicsToAddHot) {
        try {
          await topicService.setHotStatus(topicId, true);
          updateCount++;
        } catch (error) {
          logger.warn(`添加话题 ${topicId} 热门状态失败:`, error.message);
        }
      }

      logger.info('话题热门状态同步完成:', {
        featuredTopicIds: newFeaturedTopicIds,
        totalUpdatedRows: updateCount,
        removedHotTopics: topicsToRemoveHot.length,
        addedHotTopics: topicsToAddHot.length
      });
    } catch (error) {
      logger.error('同步推荐话题状态失败:', error);
      throw error;
    }
  }

  /**
   * 初始化推荐算法设置
   * @returns {Promise<Object>} 初始化结果
   */
  async initRecommendSettings() {
    // 检查是否已存在推荐设置
    const existingSetting = await settingRepository.getSetting('likeWeight');
    
    if (existingSetting) {
      return { exists: true, message: '推荐设置已存在，无需初始化' };
    }

    // 使用 repository 的初始化方法
    await settingRepository.initializeRecommendationSettings();
    
    return { exists: false, message: '推荐设置初始化成功' };
  }

  /**
   * 初始化搜索设置
   * @returns {Promise<Object>} 初始化结果
   */
  async initSearchSettings() {
    // 检查是否已存在搜索设置
    const existingSetting = await settingRepository.getSetting('hotSearchKeywords');
    
    if (existingSetting !== null) {
      return { exists: true, message: '搜索设置已存在，无需初始化' };
    }

    // 创建默认搜索设置
    const defaultSettings = {
      hotSearchKeywords: '',
      topicBaseWeight: '0.5',
      topicRecentWeight: '0.5',
      topicRecentDays: '7',
      maxHotTopics: '10'
    };

    await settingRepository.setMultipleSettings(defaultSettings);
    
    return { exists: false, message: '搜索设置初始化成功' };
  }

  /**
   * 获取推荐算法设置
   * @returns {Promise<Object>} 推荐设置
   */
  async getRecommendationSettings() {
    return await settingRepository.getRecommendationSettings();
  }

  /**
   * 获取配置版本
   * @returns {Promise<Object>} 配置版本信息
   */
  async getConfigVersion() {
    return await settingRepository.getConfigVersion();
  }

  /**
   * 设置配置版本
   * @param {Object} data 版本数据
   * @returns {Promise<Object>} 更新结果
   */
  async setConfigVersion(data) {
    return await settingRepository.setConfigVersion(data);
  }

  /**
   * 获取内容规则
   * @returns {Promise<Object>} 内容规则
   */
  async getContentRules() {
    return await settingRepository.getContentRules();
  }

  /**
   * 重置强制更新标志
   * @returns {Promise<Boolean>} 是否成功
   */
  async resetForceUpdate() {
    return await settingRepository.resetForceUpdate();
  }

  /**
   * 批量设置多个系统设置（管理员用）
   * @param {Object} settings 设置键值对
   * @returns {Promise<void>}
   */
  async setMultipleSettings(settings) {
    return await settingRepository.setMultipleSettings(settings);
  }

  /**
   * 初始化推荐算法设置（管理员用）
   * @returns {Promise<Object>} 初始化结果
   */
  async initializeRecommendationSettings() {
    return await settingRepository.initializeRecommendationSettings();
  }
}

module.exports = new SettingService();
