const adminAuthService = require('../../services/admin/auth.service');
const { ResponseUtil } = require('../../utils');
const { StatusCodes } = require('http-status-codes');
const errorCodes = require('../../constants/error-codes');
const logger = require('../../../config/logger');
const AdminMiddleware = require('../../middlewares/admin.middleware');

/**
 * 管理员认证控制器
 */
class AdminAuthController {
  /**
   * 管理员登录
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      
      // 参数验证
      if (!username || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          AdminMiddleware.formatAdminResponse({
            success: false,
            message: '用户名和密码不能为空'
          })
        );
      }

      // 调用服务层进行登录验证
      const result = await adminAuthService.login(username, password);
      
      // 记录登录成功日志
      logger.info('Admin login successful:', {
        adminId: result.user.id,
        username: result.user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      });

      // 返回管理员期望的响应格式
      res.status(StatusCodes.OK).json(
        AdminMiddleware.formatAdminResponse({
          success: true,
          message: '登录成功',
          data: result
        })
      );
    } catch (error) {
      // 记录登录失败日志
      logger.warn('Admin login failed:', {
        username: req.body.username,
        ip: req.ip,
        error: error.message,
        timestamp: new Date()
      });

      // 根据错误类型返回相应的状态码和消息
      if (error.message === '用户不存在' || error.message === '密码错误') {
        return res.status(StatusCodes.UNAUTHORIZED).json(
          AdminMiddleware.formatAdminResponse({
            success: false,
            message: '用户名或密码错误'
          })
        );
      }

      if (error.message === '非管理员用户') {
        return res.status(StatusCodes.FORBIDDEN).json(
          AdminMiddleware.formatAdminResponse({
            success: false,
            message: '您没有管理员权限'
          })
        );
      }

      if (error.message === '账户已被禁用') {
        return res.status(StatusCodes.FORBIDDEN).json(
          AdminMiddleware.formatAdminResponse({
            success: false,
            message: '账户已被禁用，请联系系统管理员'
          })
        );
      }

      // 其他错误
      logger.error('Admin login error:', error);
      next(error);
    }
  }

  /**
   * 管理员登出
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async logout(req, res, next) {
    try {
      // 记录登出日志
      logger.info('Admin logout:', {
        adminId: req.user.id,
        username: req.user.username,
        ip: req.ip,
        timestamp: new Date()
      });

      // 在实际应用中，这里可以将token加入黑名单
      // 目前只是返回成功响应
      res.status(StatusCodes.OK).json(
        AdminMiddleware.formatAdminResponse({
          success: true,
          message: '登出成功'
        })
      );
    } catch (error) {
      logger.error('Admin logout error:', error);
      next(error);
    }
  }

  /**
   * 获取当前管理员信息
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getCurrentAdmin(req, res, next) {
    try {
      const adminInfo = await adminAuthService.getAdminInfo(req.user.id);
      
      res.status(StatusCodes.OK).json(
        AdminMiddleware.formatAdminResponse({
          success: true,
          message: '获取管理员信息成功',
          data: adminInfo
        })
      );
    } catch (error) {
      logger.error('Get current admin error:', error);
      next(error);
    }
  }

  /**
   * 刷新管理员token
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async refreshToken(req, res, next) {
    try {
      const newToken = await adminAuthService.refreshToken(req.user.id);
      
      res.status(StatusCodes.OK).json(
        AdminMiddleware.formatAdminResponse({
          success: true,
          message: 'Token刷新成功',
          data: { token: newToken }
        })
      );
    } catch (error) {
      logger.error('Refresh admin token error:', error);
      next(error);
    }
  }

  /**
   * 修改管理员密码
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      
      if (!oldPassword || !newPassword) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          AdminMiddleware.formatAdminResponse({
            success: false,
            message: '旧密码和新密码不能为空'
          })
        );
      }

      await adminAuthService.changePassword(req.user.id, oldPassword, newPassword);
      
      // 记录密码修改日志
      logger.info('Admin password changed:', {
        adminId: req.user.id,
        username: req.user.username,
        ip: req.ip,
        timestamp: new Date()
      });

      res.status(StatusCodes.OK).json(
        AdminMiddleware.formatAdminResponse({
          success: true,
          message: '密码修改成功'
        })
      );
    } catch (error) {
      if (error.message === '旧密码错误') {
        return res.status(StatusCodes.BAD_REQUEST).json(
          AdminMiddleware.formatAdminResponse({
            success: false,
            message: '旧密码错误'
          })
        );
      }

      logger.error('Change admin password error:', error);
      next(error);
    }
  }
}

module.exports = new AdminAuthController();
