const userService = require('../../services/user.service');
const { ResponseUtil } = require('../../utils');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../../config/logger');

/**
 * 管理后台用户管理控制器
 */
class AdminUserController {
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
        limit = 10,
        query = '',
        role = '',
        status = '',
        includeBadges = false
      } = req.query;

      logger.info('Admin get user list request:', {
        page,
        limit,
        query,
        role,
        status,
        includeBadges,
        adminId: req.user.id
      });

      // 构建查询选项
      const options = {
        page: parseInt(page, 10),
        pageSize: parseInt(limit, 10),
        keyword: query,
        role,
        status,
        includeBadges: includeBadges === 'true'
      };

      const result = await userService.findUsers(options);

      // 格式化返回数据，匹配前端期望的格式
      const responseData = {
        items: result.list,
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.pageSize
      };

      res.status(StatusCodes.OK).json(ResponseUtil.success(responseData, '获取用户列表成功'));
    } catch (error) {
      logger.error('Admin get user list error:', error);
      next(error);
    }
  }

  /**
   * 获取用户详情
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUserDetail(req, res, next) {
    try {
      const { id } = req.params;

      logger.info('Admin get user detail request:', {
        userId: id,
        adminId: req.user.id
      });

      const user = await userService.getUserInfo(id);

      res.status(StatusCodes.OK).json(ResponseUtil.success(user, '获取用户详情成功'));
    } catch (error) {
      logger.error('Admin get user detail error:', error);
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
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      logger.info('Admin update user request:', {
        userId: id,
        updateData,
        adminId: req.user.id
      });

      const updatedUser = await userService.updateUserInfo(id, updateData);

      res.status(StatusCodes.OK).json(ResponseUtil.success(updatedUser, '更新用户信息成功'));
    } catch (error) {
      logger.error('Admin update user error:', error);
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

      logger.info('Admin delete user request:', {
        userId: id,
        adminId: req.user.id
      });

      await userService.deleteUser(id);

      res.status(StatusCodes.OK).json(ResponseUtil.success(null, '删除用户成功'));
    } catch (error) {
      logger.error('Admin delete user error:', error);
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

      logger.info('Admin disable user request:', {
        userId: id,
        adminId: req.user.id
      });

      await userService.setUserStatus(id, true);

      res.status(StatusCodes.OK).json(ResponseUtil.success(null, '禁用用户成功'));
    } catch (error) {
      logger.error('Admin disable user error:', error);
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

      logger.info('Admin enable user request:', {
        userId: id,
        adminId: req.user.id
      });

      await userService.setUserStatus(id, false);

      res.status(StatusCodes.OK).json(ResponseUtil.success(null, '启用用户成功'));
    } catch (error) {
      logger.error('Admin enable user error:', error);
      next(error);
    }
  }

  /**
   * 获取待审核用户列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getPendingUsers(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;

      logger.info('Admin get pending users request:', {
        page,
        limit,
        adminId: req.user.id
      });

      // 查询状态为待审核的用户
      const options = {
        page: parseInt(page, 10),
        pageSize: parseInt(limit, 10),
        status: 'inactive' // 待审核状态
      };

      const result = await userService.findUsers(options);

      // 格式化返回数据
      const responseData = {
        users: result.list,
        pagination: {
          page: result.pagination.page,
          limit: result.pagination.pageSize,
          total: result.pagination.total,
          pages: Math.ceil(result.pagination.total / result.pagination.pageSize)
        }
      };

      res.status(StatusCodes.OK).json(ResponseUtil.success(responseData, '获取待审核用户列表成功'));
    } catch (error) {
      logger.error('Admin get pending users error:', error);
      next(error);
    }
  }

  /**
   * 审核用户
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async auditUser(req, res, next) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;

      logger.info('Admin audit user request:', {
        userId: id,
        action,
        reason,
        adminId: req.user.id
      });

      if (!['approve', 'reject'].includes(action)) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('无效的操作类型', StatusCodes.BAD_REQUEST)
        );
      }

      if (action === 'approve') {
        // 通过审核
        const updateData = { status: 'active' };
        const updatedUser = await userService.updateUserInfo(id, updateData);

        res.status(StatusCodes.OK).json(ResponseUtil.success(updatedUser, '已通过用户审核'));
      } else {
        // 拒绝审核 - 需要提供拒绝原因
        if (!reason || reason.trim().length === 0) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            ResponseUtil.error('拒绝审核时必须提供拒绝原因', StatusCodes.BAD_REQUEST)
          );
        }

        // 获取用户信息用于记录
        const user = await userService.getUserInfo(id);
        if (!user) {
          return res.status(StatusCodes.NOT_FOUND).json(
            ResponseUtil.error('用户不存在', StatusCodes.NOT_FOUND)
          );
        }

        // 记录拒绝信息到拒绝日志表
        const { UserRejectionLog } = require('../../models');
        await UserRejectionLog.create({
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          rejection_reason: reason.trim(),
          rejected_by: req.user.id,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });

        // 删除用户数据（释放用户名，允许重新注册）
        await userService.deleteUser(id);

        logger.info('User registration rejected and deleted:', {
          userId: id,
          username: user.username,
          reason: reason.trim(),
          adminId: req.user.id
        });

        res.status(StatusCodes.OK).json(ResponseUtil.success(null, '已拒绝用户审核并删除用户数据'));
      }
    } catch (error) {
      logger.error('Admin audit user error:', error);
      next(error);
    }
  }

  /**
   * 获取用户注册拒绝记录
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getRejectionLogs(req, res, next) {
    try {
      const { page = 1, limit = 20, username, startTime, endTime } = req.query;

      logger.info('Admin get rejection logs request:', {
        page,
        limit,
        username,
        startTime,
        endTime,
        adminId: req.user.id
      });

      const { UserRejectionLog, User } = require('../../models');
      const { Op } = require('sequelize');

      // 构建查询条件
      const whereCondition = {};

      if (username) {
        whereCondition.username = {
          [Op.like]: `%${username}%`
        };
      }

      if (startTime) {
        whereCondition.rejected_at = {
          ...whereCondition.rejected_at,
          [Op.gte]: new Date(startTime)
        };
      }

      if (endTime) {
        whereCondition.rejected_at = {
          ...whereCondition.rejected_at,
          [Op.lte]: new Date(endTime)
        };
      }

      // 查询数据
      const result = await UserRejectionLog.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: User,
            as: 'admin',
            attributes: ['id', 'username', 'nickname']
          }
        ],
        attributes: [
          'id',
          'username',
          'nickname',
          'email',
          'rejection_reason',
          'rejected_by',
          'rejected_at',
          'ip_address'
        ],
        order: [['rejected_at', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      const responseData = {
        list: result.rows,
        total: result.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(result.count / parseInt(limit))
      };

      res.status(StatusCodes.OK).json(ResponseUtil.success(responseData, '获取拒绝记录成功'));
    } catch (error) {
      logger.error('Admin get rejection logs error:', error);
      next(error);
    }
  }

  /**
   * 搜索用户（用于发送系统消息）
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async searchUsers(req, res, next) {
    try {
      const { query } = req.query;

      logger.info('Admin search users request:', {
        query,
        adminId: req.user.id
      });

      if (!query || query.trim().length < 2) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('搜索关键词至少2个字符', StatusCodes.BAD_REQUEST)
        );
      }

      const options = {
        page: 1,
        pageSize: 20,
        keyword: query.trim()
      };

      const result = await userService.findUsers(options);

      // 只返回基本信息
      const users = result.list.map(user => ({
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar
      }));

      res.status(StatusCodes.OK).json(ResponseUtil.success(users, '搜索用户成功'));
    } catch (error) {
      logger.error('Admin search users error:', error);
      next(error);
    }
  }
}

module.exports = new AdminUserController();
