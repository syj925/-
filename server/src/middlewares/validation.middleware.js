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

  /**
   * 验证URL参数中的UUID
   * @param {String} paramName 参数名称
   * @returns {Function} Express中间件
   */
  static validateUUID(paramName) {
    return (req, res, next) => {
      const value = req.params[paramName];
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!value || !uuidRegex.test(value)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: `参数 ${paramName} 必须是有效的UUID格式`,
          error: 'INVALID_UUID'
        });
      }
      
      next();
    };
  }

  /**
   * 验证请求体数据
   * @param {Object} schema JSON Schema对象
   * @returns {Function} Express中间件
   */
  static validateBody(schema) {
    return (req, res, next) => {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '请求体不能为空',
          error: 'EMPTY_BODY'
        });
      }

      // 简单的JSON Schema验证实现
      const errors = this.validateSchema(req.body, schema);
      
      if (errors.length > 0) {

        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '请求参数验证失败',
          errors: errors
        });
      }
      
      next();
    };
  }

  /**
   * 简单的JSON Schema验证
   * @param {Object} data 要验证的数据
   * @param {Object} schema JSON Schema
   * @returns {Array} 错误数组
   */
  static validateSchema(data, schema) {
    const errors = [];
    
    // 验证必需字段
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data) || data[field] === undefined || data[field] === null) {
          errors.push({
            field: field,
            message: `字段 ${field} 是必需的`,
            code: 'REQUIRED_FIELD'
          });
        }
      }
    }
    
    // 验证字段类型和约束
    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (field in data && data[field] !== undefined && data[field] !== null) {
          const fieldErrors = this.validateField(data[field], fieldSchema, field);
          errors.push(...fieldErrors);
        }
      }
    }
    
    // 验证不允许的额外属性
    if (schema.additionalProperties === false) {
      const allowedFields = schema.properties ? Object.keys(schema.properties) : [];
      for (const field of Object.keys(data)) {
        if (!allowedFields.includes(field)) {
          errors.push({
            field: field,
            message: `不允许的字段: ${field}`,
            code: 'ADDITIONAL_PROPERTY'
          });
        }
      }
    }

    // 验证最少属性数量
    if (schema.minProperties && Object.keys(data).length < schema.minProperties) {
      errors.push({
        field: 'object',
        message: `至少需要 ${schema.minProperties} 个属性`,
        code: 'MIN_PROPERTIES'
      });
    }
    
    return errors;
  }

  /**
   * 验证单个字段
   * @param {*} value 字段值
   * @param {Object} fieldSchema 字段Schema
   * @param {String} fieldName 字段名
   * @returns {Array} 错误数组
   */
  static validateField(value, fieldSchema, fieldName) {
    const errors = [];
    
    // 类型验证
    if (fieldSchema.type) {
      let actualType;
      
      if (Array.isArray(value)) {
        actualType = 'array';
      } else if (fieldSchema.type === 'integer') {
        // 特殊处理 integer 类型：检查是否为整数
        actualType = (typeof value === 'number' && Number.isInteger(value)) ? 'integer' : typeof value;
      } else if (Array.isArray(fieldSchema.type)) {
        // 处理多类型情况，如 ['object', 'null']
        const possibleTypes = fieldSchema.type.map(type => {
          if (type === 'integer') {
            return (typeof value === 'number' && Number.isInteger(value)) ? 'integer' : null;
          } else if (type === 'null' && value === null) {
            return 'null';
          } else {
            return typeof value === type ? type : null;
          }
        }).filter(Boolean);
        
        if (possibleTypes.length === 0) {
          errors.push({
            field: fieldName,
            message: `字段 ${fieldName} 必须是 ${fieldSchema.type.join(' 或 ')} 类型`,
            code: 'INVALID_TYPE'
          });
          return errors;
        }
        // 如果匹配任一类型，则通过验证
      } else {
        actualType = typeof value;
      }
      
      // 单一类型验证
      if (!Array.isArray(fieldSchema.type) && actualType !== fieldSchema.type) {
        errors.push({
          field: fieldName,
          message: `字段 ${fieldName} 必须是 ${fieldSchema.type} 类型`,
          code: 'INVALID_TYPE'
        });
        return errors; // 类型错误时不再进行其他验证
      }
    }
    
    // 字符串验证
    if (fieldSchema.type === 'string') {
      if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
        errors.push({
          field: fieldName,
          message: `字段 ${fieldName} 最少需要 ${fieldSchema.minLength} 个字符`,
          code: 'MIN_LENGTH'
        });
      }
      
      if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
        errors.push({
          field: fieldName,
          message: `字段 ${fieldName} 最多允许 ${fieldSchema.maxLength} 个字符`,
          code: 'MAX_LENGTH'
        });
      }
      
      if (fieldSchema.pattern && !new RegExp(fieldSchema.pattern).test(value)) {
        errors.push({
          field: fieldName,
          message: `字段 ${fieldName} 格式不正确`,
          code: 'PATTERN_MISMATCH'
        });
      }
      
      if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
        errors.push({
          field: fieldName,
          message: `字段 ${fieldName} 必须是以下值之一: ${fieldSchema.enum.join(', ')}`,
          code: 'ENUM_MISMATCH'
        });
      }

      if (fieldSchema.format === 'uuid') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
          errors.push({
            field: fieldName,
            message: `字段 ${fieldName} 必须是有效的UUID格式`,
            code: 'INVALID_UUID'
          });
        }
      }
    }
    
    // 数字验证
    if (fieldSchema.type === 'integer' || fieldSchema.type === 'number') {
      if (fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
        errors.push({
          field: fieldName,
          message: `字段 ${fieldName} 不能小于 ${fieldSchema.minimum}`,
          code: 'MINIMUM'
        });
      }
      
      if (fieldSchema.maximum !== undefined && value > fieldSchema.maximum) {
        errors.push({
          field: fieldName,
          message: `字段 ${fieldName} 不能大于 ${fieldSchema.maximum}`,
          code: 'MAXIMUM'
        });
      }
    }
    
    // 数组验证
    if (fieldSchema.type === 'array') {
      if (fieldSchema.minItems && value.length < fieldSchema.minItems) {
        errors.push({
          field: fieldName,
          message: `字段 ${fieldName} 至少需要 ${fieldSchema.minItems} 个项目`,
          code: 'MIN_ITEMS'
        });
      }
      
      if (fieldSchema.maxItems && value.length > fieldSchema.maxItems) {
        errors.push({
          field: fieldName,
          message: `字段 ${fieldName} 最多允许 ${fieldSchema.maxItems} 个项目`,
          code: 'MAX_ITEMS'
        });
      }
      
      // 验证数组项目
      if (fieldSchema.items) {
        value.forEach((item, index) => {
          const itemErrors = this.validateField(item, fieldSchema.items, `${fieldName}[${index}]`);
          errors.push(...itemErrors);
        });
      }
    }
    
    return errors;
  }
}

module.exports = ValidationMiddleware;
