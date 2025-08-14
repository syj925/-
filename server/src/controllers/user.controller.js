const userService = require('../services/user.service');
const { ResponseUtil } = require('../utils');
const { StatusCodes } = require('http-status-codes');
const errorCodes = require('../constants/error-codes');
const logger = require('../../config/logger');

/**
 * 用户控制器
 */
class UserController {
  /**
   * 用户注册
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async register(req, res, next) {
    try {
      // 构建用户数据
      const userData = {
        username: req.body.username,
        password: req.body.password,
        nickname: req.body.nickname || req.body.username
      };

      const result = await userService.register(userData);

      // 如果需要审核，返回特殊状态码和消息
      if (result.needAudit) {
        return res.status(StatusCodes.ACCEPTED).json(
          ResponseUtil.success(result, result.message)
        );
      }

      res.status(StatusCodes.CREATED).json(ResponseUtil.success(result, '注册成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 用户登录
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await userService.login(username, password);
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取当前用户信息
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getCurrentUser(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await userService.getUserInfo(userId);
      res.status(StatusCodes.OK).json(ResponseUtil.success(user));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 搜索用户（支持@功能）
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async searchUsers(req, res, next) {
    try {
      const { keyword, limit = 10 } = req.query;

      if (!keyword) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('搜索关键词不能为空')
        );
      }

      const users = await userService.searchUsers(keyword, parseInt(limit, 10));

      res.status(StatusCodes.OK).json(ResponseUtil.success(users));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户信息
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUserInfo(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserInfo(id);
      res.status(StatusCodes.OK).json(ResponseUtil.success(user));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新用户信息
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async updateUserInfo(req, res, next) {
    try {
      const userId = req.user.id;
      const userData = req.body;
      const updatedUser = await userService.updateUserInfo(userId, userData);
      res.status(StatusCodes.OK).json(ResponseUtil.success(updatedUser));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 修改密码
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;
      const result = await userService.changePassword(userId, oldPassword, newPassword);
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 重置密码（管理员专用）
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async resetPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const result = await userService.resetPassword(id, newPassword);
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUserList(req, res, next) {
    try {
      const {
        page = 1,
        pageSize = 10,
        keyword,
        role,
        school,
        isDisabled
      } = req.query;

      const options = {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        keyword,
        role,
        school,
        isDisabled: isDisabled === 'true'
      };

      const result = await userService.findUsers(options);
      res.status(StatusCodes.OK).json(ResponseUtil.page(
        result.list,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 禁用用户
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async disableUser(req, res, next) {
    try {
      const { id } = req.params;
      const result = await userService.setUserStatus(id, true);
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 启用用户
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async enableUser(req, res, next) {
    try {
      const { id } = req.params;
      const result = await userService.setUserStatus(id, false);
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除用户
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const result = await userService.deleteUser(id);
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 发送手机验证码
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async sendPhoneCode(req, res, next) {
    try {
      const { phone } = req.body;
      const result = await userService.sendPhoneCode(phone);
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 验证手机验证码
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async verifyPhoneCode(req, res, next) {
    try {
      const { phone, code } = req.body;
      const result = await userService.verifyPhoneCode(phone, code);
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户主页信息
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUserProfile(req, res, next) {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id; // 可选认证，可能为空

      const userProfile = await userService.getUserProfile(id, currentUserId);
      res.status(StatusCodes.OK).json(ResponseUtil.success(userProfile));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户发布的帖子
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUserProfilePosts(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, pageSize = 10, sort = 'latest' } = req.query;
      const currentUserId = req.user?.id;

      const options = {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        userId: id,
        sort,
        currentUserId
      };

      const result = await userService.getUserProfilePosts(options);

      res.status(StatusCodes.OK).json(ResponseUtil.page(
        result.list,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total
      ));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();