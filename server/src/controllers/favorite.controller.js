const favoriteService = require('../services/favorite.service');
const { ResponseUtil } = require('../utils');
const { StatusCodes } = require('http-status-codes');

/**
 * 收藏控制器
 */
class FavoriteController {
  /**
   * 收藏帖子
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async addFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { post_id } = req.body;
      
      const result = await favoriteService.addFavorite(userId, post_id);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取消收藏
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async removeFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { post_id } = req.params;
      
      const result = await favoriteService.removeFavorite(userId, post_id);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户收藏列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUserFavorites(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, pageSize = 20 } = req.query;
      
      const result = await favoriteService.getUserFavorites(
        userId,
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
   * 获取帖子收藏用户列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getPostFavoriteUsers(req, res, next) {
    try {
      const { post_id } = req.params;
      const { page = 1, pageSize = 20 } = req.query;
      
      const result = await favoriteService.getPostFavoriteUsers(
        post_id,
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
   * 检查用户是否已收藏帖子
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async isFavorited(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      const { post_id } = req.params;
      
      const result = await favoriteService.isFavorited(userId, post_id);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success({ favorited: result }));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FavoriteController(); 