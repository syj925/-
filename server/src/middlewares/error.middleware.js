const { ResponseUtil } = require('../utils');
const errorCodes = require('../constants/error-codes');
const logger = require('../../config/logger');
const { StatusCodes } = require('http-status-codes');

/**
 * 错误处理中间件
 */
class ErrorMiddleware {
  /**
   * 404错误处理中间件
   * @returns {Function} Express中间件
   */
  static notFound() {
    return (req, res, next) => {
      const error = new Error(`未找到资源 - ${req.originalUrl}`);
      error.statusCode = StatusCodes.NOT_FOUND;
      next(error);
    };
  }

  /**
   * 全局错误处理中间件
   * @returns {Function} Express中间件
   */
  static handler() {
    return (err, req, res, next) => {
      // 记录详细的错误信息用于调试
      console.log('=== 错误处理中间件调试 ===');
      console.log('错误对象:', {
        message: err.message,
        statusCode: err.statusCode,
        errorCode: err.errorCode,
        name: err.name,
        stack: err.stack?.split('\n').slice(0, 3).join('\n')
      });
      console.log('请求信息:', {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        params: req.params
      });

      // 获取状态码，默认500
      const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
      
      // 根据状态码选择错误码
      let errorCode;
      switch (statusCode) {
        case StatusCodes.BAD_REQUEST:
          errorCode = errorCodes.PARAM_ERROR;
          break;
        case StatusCodes.UNAUTHORIZED:
          errorCode = errorCodes.INVALID_TOKEN;
          break;
        case StatusCodes.FORBIDDEN:
          errorCode = errorCodes.NO_PERMISSION;
          break;
        case StatusCodes.NOT_FOUND:
          errorCode = errorCodes.NOT_FOUND;
          break;
        case StatusCodes.METHOD_NOT_ALLOWED:
          errorCode = errorCodes.METHOD_NOT_ALLOWED;
          break;
        case StatusCodes.TOO_MANY_REQUESTS:
          errorCode = errorCodes.RATE_LIMIT_EXCEEDED;
          break;
        default:
          errorCode = errorCodes.SERVER_ERROR;
      }

      // 自定义错误码优先
      if (err.errorCode) {
        errorCode = err.errorCode;
      }

      console.log('最终错误码:', errorCode);
      console.log('状态码:', statusCode);

      // Sequelize错误处理
      if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        errorCode = errorCodes.PARAM_ERROR;

        // 安全地提取Sequelize错误信息
        const details = (err.errors && Array.isArray(err.errors))
          ? err.errors.map(e => ({
              field: e.path || e.field,
              message: e.message
            }))
          : [{ field: 'unknown', message: err.message }];

        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          code: errorCode.code,
          msg: errorCode.message,
          message: errorCode.message,
          data: { details }
        });
      }

      // 记录错误日志（生产环境不记录404错误）
      if (statusCode === StatusCodes.INTERNAL_SERVER_ERROR || process.env.NODE_ENV !== 'production') {
        logger.error(`[${req.method}] ${req.originalUrl}`, {
          error: err.message,
          stack: err.stack,
          body: req.body,
          params: req.params,
          query: req.query
        });
      }
      
      // 处理未捕获的Promise拒绝和异常
      if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          code: errorCodes.PARAM_ERROR.code,
          msg: errorCodes.PARAM_ERROR.message,
          message: errorCodes.PARAM_ERROR.message,
          data: { message: '无效的JSON格式' }
        });
      }

      // 确保 errorCode 有效，如果无效则使用默认值
      const finalErrorCode = errorCode || errorCodes.SERVER_ERROR;

      // 构建错误响应
      const errorResponse = {
        success: false,
        code: finalErrorCode.code,
        msg: finalErrorCode.message,
        message: finalErrorCode.message,
        data: {
          message: err.message,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
      };

      console.log('错误响应:', errorResponse);
      console.log('=== 错误处理结束 ===\n');

      // 返回错误响应
      res.status(statusCode).json(errorResponse);
    };
  }

  /**
   * 自定义错误类
   * @param {String} message 错误消息
   * @param {Number} statusCode HTTP状态码
   * @param {Object} errorCode 错误码对象
   * @returns {Error} 自定义错误对象
   */
  static createError(message, statusCode = 500, errorCode = null) {
    const error = new Error(message);
    error.statusCode = statusCode;
    if (errorCode) {
      error.errorCode = errorCode;
    }
    return error;
  }
}

module.exports = ErrorMiddleware; 