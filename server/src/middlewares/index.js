/**
 * 中间件入口文件
 */
const AuthMiddleware = require('./auth.middleware');
const ErrorMiddleware = require('./error.middleware');
const LoggerMiddleware = require('./logger.middleware');
const RateLimitMiddleware = require('./rate-limit.middleware');
const UploadMiddleware = require('./upload.middleware');

module.exports = {
  AuthMiddleware,
  ErrorMiddleware,
  LoggerMiddleware,
  RateLimitMiddleware,
  UploadMiddleware
}; 