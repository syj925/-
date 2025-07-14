const likeService = require('../services/like.service');
const { ResponseUtil } = require('../utils');
const { StatusCodes } = require('http-status-codes');

/**
 * 点赞控制器
 */
class LikeController {
  /**
   * 点赞
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async like(req, res, next) {
    try {
      const userId = req.user.id;
      const { target_id, target_type } = req.body;
      
      const result = await likeService.like(userId, target_id, target_type);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取消点赞
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async unlike(req, res, next) {
    try {
      const userId = req.user.id;
      const { target_id, target_type } = req.params;
      
      const result = await likeService.unlike(userId, target_id, target_type);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取目标的点赞列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getTargetLikes(req, res, next) {
    try {
      const { target_id, target_type } = req.params;
      const { page = 1, pageSize = 20 } = req.query;
      
      const result = await likeService.getTargetLikes(
        target_id,
        target_type,
        parseInt(page, 10),
        parseInt(pageSize, 10)
      );
      
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
   * 获取用户的点赞列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUserLikes(req, res, next) {
    try {
      const userId = req.user.id;
      const { target_type } = req.query;
      const { page = 1, pageSize = 20 } = req.query;
      
      const result = await likeService.getUserLikes(
        userId,
        target_type,
        parseInt(page, 10),
        parseInt(pageSize, 10)
      );
      
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
   * 检查用户是否已点赞
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async isLiked(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      const { target_id, target_type } = req.params;
      
      const result = await likeService.isLiked(userId, target_id, target_type);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success({ liked: result }));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LikeController(); 