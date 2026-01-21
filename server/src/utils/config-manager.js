/**
 * 配置管理器 - 统一处理系统配置获取和类型转换
 * 避免在多个地方重复配置获取逻辑
 */
class ConfigManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 获取审核配置 - 专门为帖子和评论审核场景优化
   * 返回已转换类型的配置对象
   */
  async getAuditSettings() {
    const cacheKey = 'audit_settings';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const { Setting } = require('../models');
    const auditSettings = await Setting.findAll({
      where: {
        key: ['forceManualAudit', 'enableSmartAudit', 'autoApproveKeywords', 'autoRejectKeywords']
      }
    });

    const settings = this._convertSettingsToObject(auditSettings);
    
    // 确保布尔值正确转换（防止字符串"false"被当作true）
    settings.forceManualAudit = settings.forceManualAudit === true || settings.forceManualAudit === 'true';
    settings.enableSmartAudit = settings.enableSmartAudit === true || settings.enableSmartAudit === 'true';
    
    // 缓存结果
    this.cache.set(cacheKey, {
      data: settings,
      timestamp: Date.now()
    });

    return settings;
  }

  /**
   * 通用配置获取方法
   * @param {Array<string>} keys 配置键名数组
   * @param {string} cacheKey 缓存键名
   * @returns {Promise<Object>} 配置对象
   */
  async getSettings(keys, cacheKey = null) {
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const { Setting } = require('../models');
    const settingsResult = await Setting.findAll({
      where: { key: keys }
    });

    const settings = this._convertSettingsToObject(settingsResult);
    
    if (cacheKey) {
      this.cache.set(cacheKey, {
        data: settings,
        timestamp: Date.now()
      });
    }

    return settings;
  }

  /**
   * 将设置数组转换为键值对象，并处理类型转换
   * @param {Array} settingsArray Setting模型实例数组
   * @returns {Object} 转换后的配置对象
   * @private
   */
  _convertSettingsToObject(settingsArray) {
    const settings = {};
    settingsArray.forEach(setting => {
      let value = setting.value;
      if (setting.type === 'boolean') {
        value = value === 'true' || value === true;
      }
      settings[setting.key] = value;
    });
    return settings;
  }

  /**
   * 清除指定缓存
   * @param {string} cacheKey 缓存键名，不传则清除所有缓存
   */
  clearCache(cacheKey = null) {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }
}

// 导出单例实例
module.exports = new ConfigManager();
