const Joi = require('joi');
const errorCodes = require('../constants/error-codes');
const ResponseUtil = require('./response');

/**
 * 请求验证工具类
 */
class Validator {
  /**
   * 验证请求数据
   * @param {Object} schema Joi验证模式
   * @param {Object} data 待验证数据
   * @returns {Object} { error, value }
   */
  static validate(schema, data) {
    return schema.validate(data, {
      abortEarly: false,  // 返回所有错误
      stripUnknown: true, // 删除未知字段
      errors: {
        wrap: {
          label: ''       // 不包装字段名
        }
      }
    });
  }

  /**
   * 创建中间件：验证请求体
   * @param {Object} schema Joi验证模式
   * @returns {Function} Express中间件
   */
  static validateBody(schema) {
    return (req, res, next) => {
      const { error, value } = this.validate(schema, req.body);
      if (error) {
        return res.status(400).json(ResponseUtil.error(
          errorCodes.PARAM_ERROR,
          { details: this.formatError(error) }
        ));
      }
      
      // 将验证后的数据替换原始请求体
      req.body = value;
      next();
    };
  }

  /**
   * 创建中间件：验证查询参数
   * @param {Object} schema Joi验证模式
   * @returns {Function} Express中间件
   */
  static validateQuery(schema) {
    return (req, res, next) => {
      const { error, value } = this.validate(schema, req.query);
      if (error) {
        return res.status(400).json(ResponseUtil.error(
          errorCodes.PARAM_ERROR,
          { details: this.formatError(error) }
        ));
      }
      
      // 将验证后的数据替换原始查询参数
      req.query = value;
      next();
    };
  }

  /**
   * 创建中间件：验证路径参数
   * @param {Object} schema Joi验证模式
   * @returns {Function} Express中间件
   */
  static validateParams(schema) {
    return (req, res, next) => {
      const { error, value } = this.validate(schema, req.params);
      if (error) {
        return res.status(400).json(ResponseUtil.error(
          errorCodes.PARAM_ERROR,
          { details: this.formatError(error) }
        ));
      }
      
      // 将验证后的数据替换原始路径参数
      req.params = value;
      next();
    };
  }

  /**
   * 格式化验证错误信息
   * @param {Object} error Joi验证错误
   * @returns {Array} 格式化后的错误信息
   */
  static formatError(error) {
    return error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
  }

  /**
   * 通用验证模式：分页参数
   * @returns {Object} Joi验证模式
   */
  static paginationSchema() {
    return Joi.object({
      page: Joi.number().integer().min(1).default(1)
        .messages({
          'number.base': '页码必须是数字',
          'number.integer': '页码必须是整数',
          'number.min': '页码不能小于1'
        }),
      pageSize: Joi.number().integer().min(1).max(500).default(10)
        .messages({
          'number.base': '每页条数必须是数字',
          'number.integer': '每页条数必须是整数',
          'number.min': '每页条数不能小于1',
          'number.max': '每页条数不能大于500'
        })
    });
  }

  /**
   * 通用验证模式：ID参数
   * @returns {Object} Joi验证模式
   */
  static idSchema() {
    return Joi.object({
      id: Joi.string().required()
        .messages({
          'string.empty': 'ID不能为空',
          'any.required': 'ID是必填项'
        })
    });
  }
}

module.exports = Validator; 