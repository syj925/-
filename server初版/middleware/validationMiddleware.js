/**
 * 验证中间件
 * 用于验证请求参数、请求体等
 */
const { validationResult } = require('express-validator');

/**
 * 验证请求中间件
 * 使用express-validator验证请求，如果有错误则返回400错误
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      message: '请求参数验证失败',
      errors: errors.array()
    });
  }
  next();
};

/**
 * 验证ID参数中间件
 * 验证URL参数中的ID是否为有效的整数
 * @param {string} paramName - 参数名称，默认为'id'
 * @returns {Function} - Express中间件函数
 */
exports.validateIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !/^\d+$/.test(id)) {
      return res.status(400).json({
        code: 400,
        message: `无效的${paramName}参数，必须是整数`
      });
    }
    next();
  };
};

/**
 * 验证分页参数中间件
 * 验证请求中的分页参数是否有效
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.validatePagination = (req, res, next) => {
  const { page, limit } = req.query;
  
  // 设置默认值
  req.query.page = page ? parseInt(page, 10) : 1;
  req.query.limit = limit ? parseInt(limit, 10) : 10;
  
  // 验证参数
  if (req.query.page < 1) {
    req.query.page = 1;
  }
  
  if (req.query.limit < 1 || req.query.limit > 100) {
    req.query.limit = 10;
  }
  
  next();
}; 