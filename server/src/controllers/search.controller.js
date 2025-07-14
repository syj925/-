const { ResponseUtil } = require('../utils');
const { StatusCodes } = require('http-status-codes');
const searchService = require('../services/search.service');
const logger = require('../../config/logger');

/**
 * 搜索控制器
 */
class SearchController {
  /**
   * 全局搜索
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async globalSearch(req, res, next) {
    try {
      const { keyword, type = 'all', page = 1, pageSize = 10 } = req.query;
      
      if (!keyword || keyword.trim() === '') {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('请输入搜索关键词')
        );
      }

      const result = await searchService.globalSearch({
        keyword: keyword.trim(),
        type,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        userId: req.user?.id
      });

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      logger.error('全局搜索失败:', error);
      next(error);
    }
  }

  /**
   * 搜索帖子
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async searchPosts(req, res, next) {
    try {
      const { keyword, page = 1, pageSize = 10, categoryId, topicId } = req.query;
      
      if (!keyword || keyword.trim() === '') {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('请输入搜索关键词')
        );
      }

      const result = await searchService.searchPosts({
        keyword: keyword.trim(),
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        categoryId: categoryId ? parseInt(categoryId) : null,
        topicId: topicId ? parseInt(topicId) : null,
        userId: req.user?.id
      });

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      logger.error('搜索帖子失败:', error);
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
      const { keyword, page = 1, pageSize = 10 } = req.query;
      
      if (!keyword || keyword.trim() === '') {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('请输入搜索关键词')
        );
      }

      const result = await searchService.searchUsers({
        keyword: keyword.trim(),
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        currentUserId: req.user?.id
      });

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      logger.error('搜索用户失败:', error);
      next(error);
    }
  }

  /**
   * 搜索话题
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async searchTopics(req, res, next) {
    try {
      const { keyword, page = 1, pageSize = 10 } = req.query;
      
      if (!keyword || keyword.trim() === '') {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('请输入搜索关键词')
        );
      }

      const result = await searchService.searchTopics({
        keyword: keyword.trim(),
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      logger.error('搜索话题失败:', error);
      next(error);
    }
  }

  /**
   * 获取搜索建议
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getSearchSuggestions(req, res, next) {
    try {
      const { keyword, limit = 10 } = req.query;
      
      if (!keyword || keyword.trim() === '') {
        return res.status(StatusCodes.OK).json(
          ResponseUtil.success({ suggestions: [] })
        );
      }

      const result = await searchService.getSearchSuggestions({
        keyword: keyword.trim(),
        limit: parseInt(limit)
      });

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      logger.error('获取搜索建议失败:', error);
      next(error);
    }
  }

  /**
   * 获取热门搜索
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getHotSearches(req, res, next) {
    try {
      const { limit = 10 } = req.query;

      const result = await searchService.getHotSearches({
        limit: parseInt(limit)
      });

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      logger.error('获取热门搜索失败:', error);
      next(error);
    }
  }

  /**
   * 保存搜索历史
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async saveSearchHistory(req, res, next) {
    try {
      const { keyword, type = 'all' } = req.body;
      const userId = req.user?.id;

      if (!keyword || keyword.trim() === '') {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('搜索关键词不能为空')
        );
      }

      if (!userId) {
        return res.status(StatusCodes.OK).json(
          ResponseUtil.success({ message: '未登录用户不保存搜索历史' })
        );
      }

      await searchService.saveSearchHistory({
        userId,
        keyword: keyword.trim(),
        type
      });

      res.status(StatusCodes.OK).json(
        ResponseUtil.success({ message: '搜索历史保存成功' })
      );
    } catch (error) {
      logger.error('保存搜索历史失败:', error);
      next(error);
    }
  }

  /**
   * 获取搜索历史
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getSearchHistory(req, res, next) {
    try {
      const { limit = 20 } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(StatusCodes.OK).json(
          ResponseUtil.success({ history: [] })
        );
      }

      const result = await searchService.getSearchHistory({
        userId,
        limit: parseInt(limit)
      });

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      logger.error('获取搜索历史失败:', error);
      next(error);
    }
  }

  /**
   * 清除搜索历史
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async clearSearchHistory(req, res, next) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('用户未登录')
        );
      }

      await searchService.clearSearchHistory(userId);

      res.status(StatusCodes.OK).json(
        ResponseUtil.success({ message: '搜索历史清除成功' })
      );
    } catch (error) {
      logger.error('清除搜索历史失败:', error);
      next(error);
    }
  }
}

module.exports = new SearchController();
