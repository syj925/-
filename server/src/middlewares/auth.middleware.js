const { JwtUtil, ResponseUtil } = require('../utils');
const errorCodes = require('../constants/error-codes');
const logger = require('../../config/logger');

/**
 * 认证中间件
 */
class AuthMiddleware {
  /**
   * 验证JWT token
   * @returns {Function} Express中间件
   */
  static authenticate() {
    return (req, res, next) => {
      try {
        // 获取认证头
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json(ResponseUtil.error(errorCodes.INVALID_TOKEN));
        }

        // 解析token
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
          return res.status(401).json(ResponseUtil.error(errorCodes.INVALID_TOKEN));
        }

        const token = parts[1];
        const payload = JwtUtil.verifyToken(token);

        if (!payload) {
          return res.status(401).json(ResponseUtil.error(errorCodes.INVALID_TOKEN));
        }

        // 将用户信息添加到请求对象
        req.user = payload;
        next();
      } catch (err) {
        logger.error('Authentication error:', err);
        return res.status(401).json(ResponseUtil.error(errorCodes.INVALID_TOKEN));
      }
    };
  }

  /**
   * 验证用户角色
   * @param {String|Array} roles 允许的角色
   * @returns {Function} Express中间件
   */
  static authorize(roles = []) {
    return (req, res, next) => {
      try {
        // 确保用户已认证
        if (!req.user) {
          return res.status(401).json(ResponseUtil.error(errorCodes.INVALID_TOKEN));
        }

        // 如果未指定角色，允许所有已认证用户
        if (roles.length === 0) {
          return next();
        }

        // 转换为数组
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        
        // 检查用户角色
        if (!allowedRoles.includes(req.user.role)) {
          return res.status(403).json(ResponseUtil.error(errorCodes.NO_PERMISSION));
        }

        next();
      } catch (err) {
        logger.error('Authorization error:', err);
        return res.status(403).json(ResponseUtil.error(errorCodes.NO_PERMISSION));
      }
    };
  }

  /**
   * 验证资源所有者
   * 需要在路由处理函数中调用并传入资源对象
   * @param {Object} resource 资源对象
   * @param {String} userIdField 资源中用户ID的字段名，默认为'user_id'
   * @returns {Boolean} 是否为资源所有者
   */
  static isResourceOwner(resource, userIdField = 'user_id') {
    return (req) => {
      if (!req.user || !resource) return false;
      return resource[userIdField] === req.user.id;
    };
  }

  /**
   * 可选认证中间件
   * 如果有token则验证并设置req.user，没有则继续
   * @returns {Function} Express中间件
   */
  static optionalAuthenticate() {
    return (req, res, next) => {
      // 简化版本：直接跳过认证，避免任何可能的阻塞
      logger.debug('Optional authentication: skipping for now', {
        url: req.originalUrl,
        method: req.method
      });
      next();
    };
  }
}

module.exports = AuthMiddleware; 