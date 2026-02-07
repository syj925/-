const { JwtUtil, ResponseUtil } = require("../utils");
const errorCodes = require("../constants/error-codes");
const logger = require("../../config/logger");

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
          logger.debug("请求缺少认证头", { method: req.method, url: req.url });
          return res
            .status(401)
            .json(ResponseUtil.error(errorCodes.INVALID_TOKEN));
        }

        // 解析token
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
          logger.debug("认证头格式错误", { method: req.method, url: req.url });
          return res
            .status(401)
            .json(ResponseUtil.error(errorCodes.INVALID_TOKEN));
        }

        const token = parts[1];
        const payload = JwtUtil.verifyToken(token);

        if (!payload) {
          logger.debug("JWT token验证失败", {
            method: req.method,
            url: req.url,
          });
          return res
            .status(401)
            .json(ResponseUtil.error(errorCodes.INVALID_TOKEN));
        }

        logger.debug("JWT token验证成功", {
          userId: payload.id,
          username: payload.username,
        });

        // 将用户信息添加到请求对象
        req.user = payload;
        next();
      } catch (err) {
        logger.error("认证中间件异常:", err);
        return res
          .status(401)
          .json(ResponseUtil.error(errorCodes.INVALID_TOKEN));
      }
    };
  }

  /**
   * 可选认证 - 如果有token就解析用户信息，没有也不报错
   * @returns {Function} Express中间件
   */
  static optionalAuthenticate() {
    return (req, res, next) => {
      try {
        // 获取认证头
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return next();
        }

        // 解析token
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
          logger.debug("可选认证：认证头格式错误，继续执行", {
            method: req.method,
            url: req.url,
          });
          return next();
        }

        const token = parts[1];
        const payload = JwtUtil.verifyToken(token);

        if (!payload) {
          logger.debug("可选认证：JWT token验证失败，继续执行", {
            method: req.method,
            url: req.url,
          });
          return next();
        }

        logger.debug("可选认证：JWT token验证成功", {
          userId: payload.id,
          username: payload.username,
        });

        // 将用户信息添加到请求对象
        req.user = payload;
        next();
      } catch (err) {
        logger.error("可选认证中间件异常，继续执行:", err);
        next();
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
          return res
            .status(401)
            .json(ResponseUtil.error(errorCodes.INVALID_TOKEN));
        }

        // 如果未指定角色，允许所有已认证用户
        if (roles.length === 0) {
          return next();
        }

        // 转换为数组
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        // 检查用户角色
        if (!allowedRoles.includes(req.user.role)) {
          return res
            .status(403)
            .json(ResponseUtil.error(errorCodes.NO_PERMISSION));
        }

        next();
      } catch (err) {
        logger.error("Authorization error:", err);
        return res
          .status(403)
          .json(ResponseUtil.error(errorCodes.NO_PERMISSION));
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
  static isResourceOwner(resource, userIdField = "user_id") {
    return (req) => {
      if (!req.user || !resource) return false;
      return resource[userIdField] === req.user.id;
    };
  }
}

module.exports = AuthMiddleware;
