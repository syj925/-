const settingRepository = require('../repositories/setting.repository');
const categoryRepository = require('../repositories/category.repository');
const logger = require('../../config/logger');

/**
 * 配置服务 - 处理系统配置相关业务逻辑
 */
class ConfigService {
  /**
   * 获取所有分类（管理后台格式）
   * @returns {Promise<Object>} 分类列表
   */
  async getAllCategories() {
    try {
      const categories = await categoryRepository.findAllWithStats();
      
      // 转换为管理后台需要的格式
      const formattedCategories = categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description || '',
        icon: category.icon,
        sort: category.sort,
        status: category.status === 'enabled' ? 'active' : 'inactive',
        postCount: category.post_count || 0,
        createdAt: category.created_at,
        updatedAt: category.updated_at
      }));

      return {
        items: formattedCategories,
        totalItems: formattedCategories.length
      };
    } catch (error) {
      logger.error('获取分类列表失败:', error);
      throw error;
    }
  }

  /**
   * 按类型获取分类（前端格式）
   * @param {String} type 分类类型
   * @returns {Promise<Array>} 分类列表
   */
  async getCategoriesByType(type) {
    try {
      if (type !== 'post') {
        throw new Error('无效的分类类型');
      }
      
      const categories = await categoryRepository.findAllByType(type, { status: 'enabled' });
      return categories;
    } catch (error) {
      logger.error('按类型获取分类失败:', error);
      throw error;
    }
  }

  /**
   * 获取配置版本信息
   * @returns {Promise<Object>} 版本信息
   */
  async getConfigVersion() {
    try {
      const versionValue = await settingRepository.getSetting('configVersion');
      
      let versionInfo;
      if (versionValue) {
        try {
          if (versionValue === '[object Object]') throw new Error('Invalid data');
          versionInfo = typeof versionValue === 'object' ? versionValue : JSON.parse(versionValue);
        } catch {
          versionInfo = this.getDefaultVersionInfo();
        }
      } else {
        // 创建默认版本信息
        versionInfo = this.getDefaultVersionInfo();
        await settingRepository.setSetting('configVersion', JSON.stringify(versionInfo), '当前配置版本信息');
      }

      // 添加下载地址
      versionInfo.downloadUrl = '/api/content-rules';

      return versionInfo;
    } catch (error) {
      logger.error('获取配置版本信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取默认版本信息
   * @returns {Object} 默认版本信息
   */
  getDefaultVersionInfo() {
    return {
      version: '1.0.0',
      updateTime: new Date().toISOString(),
      description: '初始版本',
      forceUpdate: false,
      downloadCount: 0
    };
  }

  /**
   * 获取内容验证规则
   * @returns {Promise<Object>} 验证规则
   */
  async getContentRules() {
    try {
      const ruleKeys = [
        'minPostLength',
        'maxPostLength',
        'enableSensitiveFilter',
        'sensitiveWords',
        'sensitiveWordAction',
        'dailyPostLimit',
        'dailyCommentLimit',
        'allowAnonymous',
        'maxImagesPerPost',
        'maxImageSize',
        'allowedImageTypes',
        'maxReplyLevel',
        'configUpdateInterval'
      ];

      // 获取所有规则设置
      const rules = {};
      for (const key of ruleKeys) {
        const value = await settingRepository.getSetting(key);
        if (value !== null) {
          rules[key] = value;
        }
      }

      // 设置默认值并转换类型
      const contentRules = {
        minPostLength: Number(rules.minPostLength) || 5,
        maxPostLength: Number(rules.maxPostLength) || 1000,
        enableSensitiveFilter: rules.enableSensitiveFilter === 'true',
        sensitiveWords: rules.sensitiveWords ? rules.sensitiveWords.split(',').map(w => w.trim()).filter(w => w) : [],
        sensitiveWordAction: rules.sensitiveWordAction || 'block',
        dailyPostLimit: Number(rules.dailyPostLimit) || 10,
        dailyCommentLimit: Number(rules.dailyCommentLimit) || 50,
        allowAnonymous: rules.allowAnonymous !== 'false',
        maxImagesPerPost: Number(rules.maxImagesPerPost) || 9,
        maxImageSize: Number(rules.maxImageSize) || 5,
        allowedImageTypes: typeof rules.allowedImageTypes === 'string' ? rules.allowedImageTypes.split(',').map(t => t.trim()).filter(t => t) : (Array.isArray(rules.allowedImageTypes) ? rules.allowedImageTypes : ['jpg', 'jpeg', 'png', 'gif', 'webp']),
        maxReplyLevel: Number(rules.maxReplyLevel) || 3,
        configUpdateInterval: Number(rules.configUpdateInterval) || 5
      };

      // 更新下载统计
      await this.incrementDownloadCount();

      return contentRules;
    } catch (error) {
      logger.error('获取验证规则失败:', error);
      throw error;
    }
  }

  /**
   * 增加配置下载计数
   */
  async incrementDownloadCount() {
    try {
      const versionValue = await settingRepository.getSetting('configVersion');
      if (versionValue) {
        const versionInfo = JSON.parse(versionValue);
        versionInfo.downloadCount = (versionInfo.downloadCount || 0) + 1;
        await settingRepository.setSetting('configVersion', JSON.stringify(versionInfo));
      }
    } catch (error) {
      logger.error('更新下载统计失败:', error);
      // 不抛出错误，统计失败不影响主要功能
    }
  }

  /**
   * 重置强制更新标志
   * @returns {Promise<Object>} 更新后的版本信息
   */
  async resetForceUpdate() {
    try {
      const versionValue = await settingRepository.getSetting('configVersion');
      
      if (!versionValue) {
        throw new Error('未找到配置版本信息');
      }

      const versionInfo = JSON.parse(versionValue);
      versionInfo.forceUpdate = false;
      versionInfo.updateTime = new Date().toISOString();

      await settingRepository.setSetting('configVersion', JSON.stringify(versionInfo));

      return versionInfo;
    } catch (error) {
      logger.error('重置强制更新标志失败:', error);
      throw error;
    }
  }

  // ==================== 管理员端配置版本管理 ====================

  /**
   * 获取配置版本信息（管理员端格式）
   * @returns {Promise<Object>} 版本信息
   */
  async getAdminConfigVersion() {
    try {
      const versionValue = await settingRepository.getSetting('configVersion');
      
      let versionInfo;
      try {
        if (versionValue === '[object Object]') throw new Error('Invalid data');
        versionInfo = versionValue ? (typeof versionValue === 'object' ? versionValue : JSON.parse(versionValue)) : this.getDefaultVersionInfo();
      } catch {
        versionInfo = this.getDefaultVersionInfo();
      }

      return versionInfo;
    } catch (error) {
      logger.error('获取配置版本信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取版本历史
   * @returns {Promise<Array>} 版本历史列表
   */
  async getVersionHistory() {
    try {
      const historyValue = await settingRepository.getSetting('configVersionHistory');
      try {
        if (historyValue === '[object Object]') return [];
        return historyValue ? (typeof historyValue === 'object' ? historyValue : JSON.parse(historyValue)) : [];
      } catch {
        return [];
      }
    } catch (error) {
      logger.error('获取版本历史失败:', error);
      throw error;
    }
  }

  /**
   * 发布新配置版本
   * @param {Object} params 版本参数
   * @returns {Promise<Object>} 新版本信息
   */
  async publishConfigVersion({ version, description, forceUpdate, config }) {
    try {
      if (!version || !description) {
        throw new Error('版本号和更新说明不能为空');
      }

      if (!config) {
        throw new Error('配置内容不能为空');
      }

      // 检查版本号是否已存在
      const historyValue = await settingRepository.getSetting('configVersionHistory');
      if (historyValue) {
        const history = JSON.parse(historyValue);
        const versionExists = history.some(v => v.version === version);
        if (versionExists) {
          throw new Error(`版本号 ${version} 已存在，请使用新的版本号`);
        }
      }

      const updateTime = new Date().toISOString();

      // 新版本信息
      const newVersionInfo = {
        version,
        description,
        forceUpdate: forceUpdate || false,
        updateTime,
        downloadCount: 0
      };

      // 获取并更新版本历史
      const history = historyValue ? JSON.parse(historyValue) : [];
      history.unshift(newVersionInfo);

      // 只保留最近20个版本
      if (history.length > 20) {
        history.splice(20);
      }

      // 更新当前版本信息
      await settingRepository.setSetting('configVersion', JSON.stringify(newVersionInfo), '当前配置版本信息');

      // 更新版本历史
      await settingRepository.setSetting('configVersionHistory', JSON.stringify(history), '配置版本历史记录');

      // 更新所有配置项
      await this.updateConfigSettings(config);

      return newVersionInfo;
    } catch (error) {
      logger.error('发布配置版本失败:', error);
      throw error;
    }
  }

  /**
   * 更新配置项
   * @param {Object} config 配置对象
   */
  async updateConfigSettings(config) {
    const configUpdates = [
      { key: 'minPostLength', value: config.minPostLength?.toString(), type: 'number' },
      { key: 'maxPostLength', value: config.maxPostLength?.toString(), type: 'number' },
      { key: 'enableSensitiveFilter', value: config.enableSensitiveFilter?.toString(), type: 'boolean' },
      { key: 'sensitiveWords', value: Array.isArray(config.sensitiveWords) ? config.sensitiveWords.join(',') : config.sensitiveWords, type: 'string' },
      { key: 'sensitiveWordAction', value: config.sensitiveWordAction, type: 'string' },
      { key: 'dailyPostLimit', value: config.dailyPostLimit?.toString(), type: 'number' },
      { key: 'dailyCommentLimit', value: config.dailyCommentLimit?.toString(), type: 'number' },
      { key: 'allowAnonymous', value: config.allowAnonymous?.toString(), type: 'boolean' },
      { key: 'maxImagesPerPost', value: config.maxImagesPerPost?.toString(), type: 'number' },
      { key: 'maxImageSize', value: config.maxImageSize?.toString(), type: 'number' },
      { key: 'allowedImageTypes', value: Array.isArray(config.allowedImageTypes) ? config.allowedImageTypes.join(',') : config.allowedImageTypes, type: 'string' },
      { key: 'maxReplyLevel', value: config.maxReplyLevel?.toString(), type: 'number' },
      { key: 'configUpdateInterval', value: config.configUpdateInterval?.toString(), type: 'number' }
    ];

    for (const update of configUpdates) {
      if (update.value !== undefined && update.value !== null) {
        await settingRepository.setSetting(update.key, update.value, `配置项: ${update.key}`);
      }
    }
  }

  /**
   * 回滚到指定版本
   * @param {String} targetVersion 目标版本号
   * @returns {Promise<Object>} 回滚后的版本信息
   */
  async rollbackToVersion(targetVersion) {
    try {
      if (!targetVersion) {
        throw new Error('目标版本不能为空');
      }

      // 获取版本历史
      const historyValue = await settingRepository.getSetting('configVersionHistory');
      if (!historyValue) {
        throw new Error('版本历史不存在');
      }

      const history = JSON.parse(historyValue);
      const targetVersionInfo = history.find(v => v.version === targetVersion);

      if (!targetVersionInfo) {
        throw new Error('目标版本不存在');
      }

      // 更新当前版本信息
      const rollbackVersionInfo = {
        ...targetVersionInfo,
        updateTime: new Date().toISOString(),
        description: `回滚到版本 ${targetVersion}: ${targetVersionInfo.description}`
      };

      await settingRepository.setSetting('configVersion', JSON.stringify(rollbackVersionInfo), '当前配置版本信息');

      return rollbackVersionInfo;
    } catch (error) {
      logger.error('配置回滚失败:', error);
      throw error;
    }
  }
}

module.exports = new ConfigService();
