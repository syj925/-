/**
 * 自定义应用错误类
 * 用于统一处理应用中的业务错误和API错误
 */
class AppError extends Error {
  /**
   * 创建新的应用错误
   * @param {string} message 错误消息
   * @param {number} statusCode HTTP状态码
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // 标记为已知的操作错误，而非未知的程序错误

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError; 