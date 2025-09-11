const { StatusCodes } = require('http-status-codes');
const { ResponseUtil } = require('../../utils');
const logger = require('../../../config/logger');
const messageService = require('../../services/message.service');

/**
 * 管理员消息管理控制器
 */
class AdminMessageController {
  /**
   * 获取系统通知列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getSystemMessages(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        type = '', 
        searchQuery = '',
        startDate,
        endDate 
      } = req.query;

      logger.info('Admin get system messages request:', {
        adminId: req.user.id,
        page,
        limit,
        type,
        searchQuery
      });

      // 调用服务层
      const result = await messageService.getSystemMessages({
        page: parseInt(page),
        pageSize: parseInt(limit),
        type: type || null,
        searchQuery: searchQuery || null,
        startDate,
        endDate
      });

      res.status(StatusCodes.OK).json(ResponseUtil.success(result, '获取系统通知列表成功'));
    } catch (error) {
      logger.error('Admin get system messages error:', error);
      next(error);
    }
  }

  /**
   * 获取系统通知详情
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getSystemMessageDetail(req, res, next) {
    try {
      const { id } = req.params;

      logger.info('Admin get system message detail request:', {
        messageId: id,
        adminId: req.user.id
      });

      // 调用服务层
      const message = await messageService.getSystemMessageDetail(id);

      res.status(StatusCodes.OK).json(ResponseUtil.success(message, '获取通知详情成功'));
    } catch (error) {
      logger.error('Admin get system message detail error:', error);
      next(error);
    }
  }

  /**
   * 创建系统通知
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async createSystemMessage(req, res, next) {
    try {
      const { title, content, type, targetGroup, sendNow, scheduledTime, specificUsers } = req.body;

      logger.info('Admin create system message request:', {
        title,
        type,
        targetGroup,
        sendNow,
        adminId: req.user.id
      });

      // 调用服务层
      const newMessage = await messageService.createSystemMessage({
        title,
        content,
        type,
        targetGroup,
        sendNow,
        scheduledTime,
        specificUsers
      }, req.user.id);

      res.status(StatusCodes.CREATED).json(ResponseUtil.success(newMessage, '系统通知创建成功'));
    } catch (error) {
      logger.error('Admin create system message error:', error);
      next(error);
    }
  }

  /**
   * 删除系统通知
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async deleteSystemMessage(req, res, next) {
    try {
      const { id } = req.params;

      logger.info('Admin delete system message request:', {
        messageId: id,
        adminId: req.user.id
      });

      // 调用服务层
      const success = await messageService.deleteSystemMessage(id);

      if (success) {
        res.status(StatusCodes.OK).json(ResponseUtil.success(null, '系统通知删除成功'));
      } else {
        res.status(StatusCodes.NOT_FOUND).json(ResponseUtil.error('系统通知不存在或删除失败', StatusCodes.NOT_FOUND));
      }
    } catch (error) {
      logger.error('Admin delete system message error:', error);
      next(error);
    }
  }

  /**
   * 获取系统通知统计
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getSystemMessageStats(req, res, next) {
    try {
      logger.info('Admin get system message stats request:', {
        adminId: req.user.id
      });

      // 调用服务层
      const stats = await messageService.getSystemMessageStats();

      res.status(StatusCodes.OK).json(ResponseUtil.success(stats, '获取通知统计成功'));
    } catch (error) {
      logger.error('Admin get system message stats error:', error);
      next(error);
    }
  }

  /**
   * 获取系统通知接收者列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getSystemMessageRecipients(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, isRead } = req.query;

      logger.info('Admin get system message recipients request:', {
        messageId: id,
        page,
        limit,
        isRead,
        adminId: req.user.id
      });

      // 调用服务层
      const result = await messageService.getSystemMessageRecipients(id, {
        page: parseInt(page),
        pageSize: parseInt(limit),
        isRead
      });

      res.status(StatusCodes.OK).json(ResponseUtil.success(result, '获取接收者列表成功'));
    } catch (error) {
      logger.error('Admin get system message recipients error:', error);
      next(error);
    }
  }

  /**
   * 搜索用户
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

      if (!query || query.trim().length < 1) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('搜索关键词不能为空', StatusCodes.BAD_REQUEST)
        );
      }

      // 调用服务层
      const users = await messageService.searchUsers(query.trim());

      res.status(StatusCodes.OK).json(ResponseUtil.success(users, '搜索用户成功'));
    } catch (error) {
      logger.error('Admin search users error:', error);
      next(error);
    }
  }
}

module.exports = new AdminMessageController();
