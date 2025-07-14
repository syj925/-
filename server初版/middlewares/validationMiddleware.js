/**
 * 请求验证中间件
 * 基于express-validator，用于验证和清理请求数据
 */
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * 验证请求数据的中间件
 * @param {Array} validations - express-validator验证规则数组
 * @returns {Function} Express中间件函数
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // 执行所有验证
    await Promise.all(validations.map(validation => validation.run(req)));

    // 获取验证结果
    const errors = validationResult(req);
    
    // 如果没有错误，继续
    if (errors.isEmpty()) {
      return next();
    }
    
    // 记录验证错误
    logger.debug('请求验证失败:', {
      path: req.path,
      method: req.method,
      errors: errors.array()
    });
    
    // 格式化并返回错误信息
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg
    }));
    
    // 返回400错误，带有验证错误信息
    return res.status(400).json({
      message: '请求验证失败',
      errors: formattedErrors
    });
  };
};

module.exports = {
  validate
};