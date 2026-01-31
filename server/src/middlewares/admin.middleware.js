const { JwtUtil, ResponseUtil } = require('../utils');
const errorCodes = require('../constants/error-codes');
const logger = require('../../config/logger');
const { OperationLog } = require('../models');

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
      const startTime = Date.now();
      
      // 记录请求参数（排除敏感信息）
      let sanitizedBody = null;
      if (req.body && Object.keys(req.body).length > 0) {
        sanitizedBody = { ...req.body };
        delete sanitizedBody.password;
        delete sanitizedBody.newPassword;
        delete sanitizedBody.oldPassword;
      }

      // 保存原始的 json 方法以记录响应
      const originalJson = res.json;
      
      res.json = function(data) {
        // 异步记录日志，不阻塞响应
        (async () => {
          try {
            const duration = Date.now() - startTime;
            
            // 只有修改类操作或特定的GET操作才记录入库，避免日志爆炸
            // 但为了演示效果，目前记录所有非GET操作，或者特定路径
            if (req.method === 'GET') {
              // GET请求仅记录日志文件，不入库，除非是敏感查询（如导出）
              return;
            }

            // 确定操作模块
            let type = '其他';
            const path = req.path;
            if (path.includes('/users')) type = '用户管理';
            else if (path.includes('/posts')) type = '帖子管理';
            else if (path.includes('/comments')) type = '评论管理';
            else if (path.includes('/topics')) type = '话题管理';
            else if (path.includes('/events')) type = '活动管理';
            else if (path.includes('/emoji')) type = '表情管理';
            else if (path.includes('/settings')) type = '系统设置';
            else if (path.includes('/audit')) type = '审核管理';
            else if (path.includes('/login')) type = '系统登录';
            
            // 确定操作类型
            let action = '其他';
            if (path.includes('/login')) action = '登录';
            else if (path.includes('/logout')) action = '登出';
            else if (req.method === 'POST') action = '添加';
            else if (req.method === 'PUT') action = '修改';
            else if (req.method === 'DELETE') action = '删除';
            else if (path.includes('/audit') || path.includes('/review')) action = '审核';

            // 尝试从响应数据中获取用户信息（针对登录接口）
            let userId = req.user?.id;
            let username = req.user?.username;
            
            if (!userId && path.includes('/login') && data?.success) {
              // 假设登录响应数据结构中有 user 对象
              userId = data.data?.user?.id || data.data?.id;
              username = data.data?.user?.username || data.data?.username || req.body?.username;
            }

            await OperationLog.create({
              admin_id: userId,
              admin_username: username || req.body?.username, // 登录时可能没有req.user
              method: req.method,
              path: req.path,
              ip: req.ip || req.connection.remoteAddress,
              user_agent: req.get('User-Agent'),
              status_code: res.statusCode,
              duration,
              type,
              description: `${action} ${type}`,
              request_body: sanitizedBody ? JSON.stringify(sanitizedBody) : null
            });
          } catch (err) {
            logger.error('Operation Log Save Error:', err);
          }
        })();
        
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
