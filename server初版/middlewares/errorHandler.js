/**
 * 全局错误处理中间件
 * 处理应用程序中未捕获的错误
 */
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * 错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  logger.error('服务器错误', err);
  
  // 设置状态码
  const statusCode = err.statusCode || 500;
  
  // 准备错误响应
  const errorResponse = {
    code: statusCode,
    message: err.message || '服务器内部错误'
  };
  
  // 在开发环境中提供更多调试信息
  if (config.server.env === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.path = req.path;
    errorResponse.method = req.method;
  }
  
  // 返回错误响应
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler; 