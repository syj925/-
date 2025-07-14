const logger = require('../../config/logger');

/**
 * 日志中间件
 */
class LoggerMiddleware {
  /**
   * 请求日志中间件
   * @returns {Function} Express中间件
   */
  static requestLogger() {
    return (req, res, next) => {
      // 开始时间
      const start = Date.now();
      
      // 生成请求ID
      req.requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // 记录请求开始日志
      logger.info(`Request started: ${req.method} ${req.originalUrl}`, {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      // 响应完成时记录日志
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        
        logger[logLevel](`Request completed: ${req.method} ${req.originalUrl}`, {
          requestId: req.requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          contentLength: res.get('Content-Length') || 0
        });
        
        // 记录慢请求
        if (duration > 1000) { // 超过1秒的请求
          logger.warn(`Slow request: ${req.method} ${req.originalUrl}`, {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            duration: `${duration}ms`
          });
        }
      });

      next();
    };
  }

  /**
   * 创建业务日志记录器
   * @param {String} module 模块名称
   * @param {String} action 操作名称
   * @param {Object} data 日志数据
   * @param {Object} req Express请求对象（可选）
   */
  static logBusiness(module, action, data, req = null) {
    const logData = {
      module,
      action,
      data,
      timestamp: new Date().toISOString()
    };
    
    // 如果有请求对象，添加请求相关信息
    if (req) {
      logData.requestId = req.requestId;
      logData.userId = req.user ? req.user.id : null;
      logData.ip = req.ip;
    }
    
    logger.info(`[Business] ${module} - ${action}`, logData);
  }

  /**
   * 记录数据库查询日志
   * @param {String} sql SQL语句
   * @param {Number} duration 查询时间（毫秒）
   */
  static logQuery(sql, duration) {
    // 对于长时间查询，使用warn级别
    if (duration > 500) {
      logger.warn(`Slow query: ${duration}ms`, {
        sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
        duration: `${duration}ms`
      });
    } else {
      logger.debug(`DB query: ${duration}ms`, {
        sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
        duration: `${duration}ms`
      });
    }
  }
}

module.exports = LoggerMiddleware; 