const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const { ResponseUtil } = require('../utils');
const logger = require('../../config/logger');

/**
 * 验证中间件
 */
class ValidationMiddleware {
  /**
   * 处理验证错误
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  static handleValidationErrors(req, res, next) {
    try {
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
          field: error.path || error.param,
          message: error.msg,
          value: error.value
        }));

        logger.warn('请求参数验证失败', {
          url: req.originalUrl,
          method: req.method,
          errors: errorMessages,
          ip: req.ip
        });

        return ResponseUtil.error(
          res,
          '请求参数验证失败',
          StatusCodes.BAD_REQUEST,
          {
            errors: errorMessages
          }
        );
      }

      next();
    } catch (error) {
      logger.error('验证中间件处理错误', {
        error: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method
      });

      return ResponseUtil.error(
        res,
        '服务器内部错误',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 创建自定义验证器
   * @param {Function} validator 验证函数
   * @param {String} message 错误消息
   * @returns {Function} 验证器函数
   */
  static custom(validator, message = '验证失败') {
    return (value, { req, location, path }) => {
      const result = validator(value, { req, location, path });
      
      if (result === false || (result instanceof Promise && result.then)) {
        throw new Error(message);
      }
      
      return result;
    };
  }

  /**
   * 验证UUID格式
   * @param {String} value 要验证的值
   * @returns {Boolean} 是否为有效UUID
   */
  static isUUID(value) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * 验证日期格式
   * @param {String} value 要验证的值
   * @returns {Boolean} 是否为有效日期
   */
  static isValidDate(value) {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * 验证手机号格式
   * @param {String} value 要验证的值
   * @returns {Boolean} 是否为有效手机号
   */
  static isMobilePhone(value) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(value);
  }

  /**
   * 验证邮箱格式
   * @param {String} value 要验证的值
   * @returns {Boolean} 是否为有效邮箱
   */
  static isEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * 验证密码强度
   * @param {String} value 要验证的值
   * @returns {Boolean} 是否为强密码
   */
  static isStrongPassword(value) {
    // 至少8位，包含大小写字母、数字和特殊字符
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(value);
  }

  /**
   * 验证中文字符
   * @param {String} value 要验证的值
   * @returns {Boolean} 是否包含中文字符
   */
  static containsChinese(value) {
    const chineseRegex = /[\u4e00-\u9fa5]/;
    return chineseRegex.test(value);
  }

  /**
   * 验证数组长度
   * @param {Array} value 要验证的数组
   * @param {Number} min 最小长度
   * @param {Number} max 最大长度
   * @returns {Boolean} 是否在指定长度范围内
   */
  static isArrayLength(value, min = 0, max = Infinity) {
    if (!Array.isArray(value)) {
      return false;
    }
    return value.length >= min && value.length <= max;
  }

  /**
   * 验证JSON格式
   * @param {String} value 要验证的值
   * @returns {Boolean} 是否为有效JSON
   */
  static isJSON(value) {
    try {
      JSON.parse(value);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证URL格式
   * @param {String} value 要验证的值
   * @returns {Boolean} 是否为有效URL
   */
  static isURL(value) {
    try {
      new URL(value);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证IP地址格式
   * @param {String} value 要验证的值
   * @returns {Boolean} 是否为有效IP地址
   */
  static isIP(value) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(value) || ipv6Regex.test(value);
  }

  /**
   * 验证文件类型
   * @param {Object} file 文件对象
   * @param {Array} allowedTypes 允许的文件类型
   * @returns {Boolean} 是否为允许的文件类型
   */
  static isAllowedFileType(file, allowedTypes = []) {
    if (!file || !file.mimetype) {
      return false;
    }
    return allowedTypes.includes(file.mimetype);
  }

  /**
   * 验证文件大小
   * @param {Object} file 文件对象
   * @param {Number} maxSize 最大文件大小（字节）
   * @returns {Boolean} 是否在允许的文件大小范围内
   */
  static isAllowedFileSize(file, maxSize = 5 * 1024 * 1024) { // 默认5MB
    if (!file || !file.size) {
      return false;
    }
    return file.size <= maxSize;
  }
}

module.exports = ValidationMiddleware;
