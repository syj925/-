/**
 * 中间件入口文件
 */
const AuthMiddleware = require('./auth.middleware');
const ErrorMiddleware = require('./error.middleware');
const LoggerMiddleware = require('./logger.middleware');
const RateLimitMiddleware = require('./rate-limit.middleware');
const UploadMiddleware = require('./upload.middleware');
const ValidationMiddleware = require('./validation.middleware');
const AdminMiddleware = require('./admin.middleware');
const SensitiveWordMiddleware = require('./sensitive-word.middleware');
const ContentLengthMiddleware = require('./content-length.middleware');
const PublishLimitMiddleware = require('./publish-limit.middleware');

module.exports = {
  AuthMiddleware,
  ErrorMiddleware,
  LoggerMiddleware,
  RateLimitMiddleware,
  UploadMiddleware,
  ValidationMiddleware,
  AdminMiddleware,
  SensitiveWordMiddleware,
  ContentLengthMiddleware,
  PublishLimitMiddleware
};