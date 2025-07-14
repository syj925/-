const messageService = require('../services/message.service');
const { ResponseUtil } = require('../utils');
const { StatusCodes } = require('http-status-codes');

/**
 * 消息控制器
 */
class MessageController {
  /**
   * 获取消息详情
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getMessageById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const message = await messageService.getMessageById(id, userId);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(message));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户消息列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUserMessages(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        pageSize = 20,
        isRead,
        type,
        startDate,
        endDate
      } = req.query;
      
      const options = {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10)
      };
      
      if (isRead !== undefined) {
        options.isRead = isRead === 'true';
      }
      
      if (type) {
        options.type = type;
      }
      
      if (startDate) {
        options.startDate = new Date(startDate);
      }
      
      if (endDate) {
        options.endDate = new Date(endDate);
      }
      
      const result = await messageService.getUserMessages(userId, options);
      
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
   * 标记消息为已读
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const result = await messageService.markAsRead(id, userId);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success({ success: result }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量标记消息为已读
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async markMultipleAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const { ids } = req.body;
      
      const result = await messageService.markMultipleAsRead(userId, ids);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除消息
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async deleteMessage(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const result = await messageService.deleteMessage(id, userId);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success({ success: result }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量删除消息
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async deleteMultiple(req, res, next) {
    try {
      const userId = req.user.id;
      const { ids } = req.body;
      
      const result = await messageService.deleteMultiple(userId, ids);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户未读消息数量
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;
      const { type } = req.query;
      
      const count = await messageService.getUnreadCount(userId, type);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success({ count }));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MessageController(); 