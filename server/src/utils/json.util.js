/**
 * JSON处理工具类
 */
const logger = require('../../config/logger');

class JsonUtil {
  /**
   * 安全的JSON序列化，处理循环引用
   * @param {*} obj 要序列化的对象
   * @param {number} space 缩进空格数
   * @returns {string} JSON字符串
   */
  static safeStringify(obj, space = 0) {
    const seen = new WeakSet();
    
    return JSON.stringify(obj, (key, val) => {
      if (val != null && typeof val === 'object') {
        if (seen.has(val)) {
          return '[Circular]';
        }
        seen.add(val);
      }
      return val;
    }, space);
  }

  /**
   * 将Sequelize模型转换为普通对象
   * @param {*} model Sequelize模型实例
   * @returns {Object} 普通对象
   */
  static modelToPlainObject(model) {
    if (!model) return null;
    
    if (Array.isArray(model)) {
      return model.map(item => this.modelToPlainObject(item));
    }
    
    if (typeof model.toJSON === 'function') {
      return model.toJSON();
    }
    
    if (typeof model.get === 'function') {
      return model.get({ plain: true });
    }
    
    return model;
  }

  /**
   * 创建API响应的安全数据对象
   * @param {*} data 原始数据
   * @returns {Object} 安全的响应数据
   */
  static createSafeResponseData(data) {
    try {
      // 先转换为普通对象
      const plainData = this.modelToPlainObject(data);
      
      // 测试是否可以序列化
      this.safeStringify(plainData);
      
      return plainData;
    } catch (error) {
      logger.error('创建安全响应数据失败:', error);
      
      // 如果转换失败，返回基本信息
      if (data && typeof data === 'object') {
        const safeData = {};
        
        // 只复制基本属性
        const basicProps = ['id', 'title', 'content', 'status', 'user_id', 'post_id', 'created_at', 'updated_at'];
        
        for (const prop of basicProps) {
          if (data[prop] !== undefined) {
            safeData[prop] = data[prop];
          }
        }
        
        return safeData;
      }
      
      return data;
    }
  }

  /**
   * 安全的JSON解析
   * @param {string} str JSON字符串
   * @param {*} defaultValue 解析失败时的默认值
   * @returns {*} 解析结果
   */
  static safeParse(str, defaultValue = null) {
    try {
      return JSON.parse(str);
    } catch (error) {
      logger.error('JSON解析失败:', error);
      return defaultValue;
    }
  }

  /**
   * 深度清理对象，移除循环引用和不必要的属性
   * @param {*} obj 要清理的对象
   * @param {number} maxDepth 最大深度
   * @returns {*} 清理后的对象
   */
  static deepClean(obj, maxDepth = 10) {
    const seen = new WeakSet();
    
    const clean = (value, depth = 0) => {
      if (depth > maxDepth) {
        return '[Max Depth Reached]';
      }
      
      if (value === null || typeof value !== 'object') {
        return value;
      }
      
      if (seen.has(value)) {
        return '[Circular]';
      }
      
      seen.add(value);
      
      if (Array.isArray(value)) {
        return value.map(item => clean(item, depth + 1));
      }
      
      const cleaned = {};
      for (const [key, val] of Object.entries(value)) {
        // 跳过一些可能导致问题的属性
        if (key.startsWith('_') || key === 'parent' || key === 'include') {
          continue;
        }
        
        cleaned[key] = clean(val, depth + 1);
      }
      
      return cleaned;
    };
    
    return clean(obj);
  }
}

module.exports = JsonUtil;
