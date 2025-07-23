const { JwtUtil, ResponseUtil } = require('../utils');
const errorCodes = require('../constants/error-codes');
const logger = require('../../config/logger');

/**
 * 管理员专用中间件
 */
class AdminMiddleware {
  /**
   * 管理员认证中间件
   * 验证JWT token并确保用户是管理员
   * @returns {Function} Express中间件
   */
  static authenticate() {
    return (req, res, next) => {
      try {
        // 获取认证头
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json(AdminMiddleware.formatAdminResponse({
            success: false,
            message: '缺少认证令牌'
          }));
        }

        // 解析token
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
          return res.status(401).json(AdminMiddleware.formatAdminResponse({
            success: false,
            message: '认证令牌格式错误'
          }));
        }

        const token = parts[1];
        const payload = JwtUtil.verifyToken(token);
        
        if (!payload) {
          return res.status(401).json(AdminMiddleware.formatAdminResponse({
            success: false,
            message: '认证令牌无效'
          }));
        }

        // 验证管理员权限
        if (payload.role !== 'admin') {
          return res.status(403).json(AdminMiddleware.formatAdminResponse({
            success: false,
            message: '需要管理员权限'
          }));
        }

        // 将管理员信息添加到请求对象
        req.admin = payload;
        req.user = payload; // 保持兼容性
        next();
      } catch (err) {
        logger.error('Admin authentication error:', err);
        return res.status(401).json(AdminMiddleware.formatAdminResponse({
          success: false,
          message: '认证失败'
        }));
      }
    };
  }

  /**
   * 管理员响应格式统一中间件
   * 将标准的 {code, msg, data} 格式转换为 admin 期望的 {success, message, data} 格式
   * @returns {Function} Express中间件
   */
  static formatResponse() {
    return (req, res, next) => {
      // 保存原始的 json 方法
      const originalJson = res.json;
      
      // 重写 json 方法
      res.json = function(data) {
        // 如果已经是 admin 格式，直接返回
        if (data && data.hasOwnProperty('success')) {
          return originalJson.call(this, data);
        }
        
        // 转换标准格式到 admin 格式
        if (data && data.hasOwnProperty('code')) {
          const adminFormat = {
            success: data.code === 0,
            message: data.msg || '操作完成',
            data: data.data
          };
          return originalJson.call(this, adminFormat);
        }
        
        // 如果是其他格式，包装为成功响应
        const adminFormat = {
          success: true,
          message: '操作成功',
          data: data
        };
        return originalJson.call(this, adminFormat);
      };
      
      next();
    };
  }

  /**
   * 格式化管理员响应
   * @param {Object} response 响应对象
   * @returns {Object} 格式化后的响应
   */
  static formatAdminResponse(response) {
    if (response.success === undefined) {
      return {
        success: true,
        message: '操作成功',
        data: response
      };
    }
    return response;
  }

  /**
   * 管理员操作日志记录中间件
   * @returns {Function} Express中间件
   */
  static logOperation() {
    return (req, res, next) => {
      // 记录管理员操作
      const operation = {
        adminId: req.user?.id,
        adminUsername: req.user?.username,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      };

      // 记录请求参数（排除敏感信息）
      if (req.body && Object.keys(req.body).length > 0) {
        const sanitizedBody = { ...req.body };
        delete sanitizedBody.password;
        operation.requestBody = sanitizedBody;
      }

      logger.info('Admin operation:', operation);
      
      // 保存原始的 json 方法以记录响应
      const originalJson = res.json;
      res.json = function(data) {
        // 记录响应状态
        logger.info('Admin operation result:', {
          adminId: req.user?.id,
          path: req.path,
          statusCode: res.statusCode,
          success: data?.success !== false
        });
        
        return originalJson.call(this, data);
      };
      
      next();
    };
  }

  /**
   * 验证管理员权限级别
   * @param {String} requiredLevel 需要的权限级别 ('admin', 'super_admin')
   * @returns {Function} Express中间件
   */
  static requirePermission(requiredLevel = 'admin') {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json(AdminMiddleware.formatAdminResponse({
            success: false,
            message: '用户未认证'
          }));
        }

        // 检查权限级别
        const userRole = req.user.role;
        const hasPermission = userRole === 'admin' || 
                             (requiredLevel === 'super_admin' && userRole === 'super_admin');

        if (!hasPermission) {
          return res.status(403).json(AdminMiddleware.formatAdminResponse({
            success: false,
            message: '权限不足'
          }));
        }

        next();
      } catch (err) {
        logger.error('Permission check error:', err);
        return res.status(403).json(AdminMiddleware.formatAdminResponse({
          success: false,
          message: '权限验证失败'
        }));
      }
    };
  }
}

module.exports = AdminMiddleware;
