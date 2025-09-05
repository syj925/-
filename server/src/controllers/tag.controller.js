const tagService = require('../services/tag.service');
const { ResponseUtil } = require('../utils');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../config/logger');

/**
 * 标签控制器
 */
class TagController {
  /**
   * 创建标签
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async createTag(req, res, next) {
    try {
      const tagData = {
        name: req.body.name,
        category: req.body.category || 'interest',
        description: req.body.description,
        color: req.body.color || '#409EFF',
        status: req.body.status || 'normal',
        sort_order: req.body.sortOrder || 0
      };

      const tag = await tagService.createTag(tagData);
      
      res.status(StatusCodes.CREATED).json(
        ResponseUtil.success(tag, '标签创建成功')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取标签详情
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getTagById(req, res, next) {
    try {
      const { id } = req.params;
      const tag = await tagService.getTagById(id);
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(tag)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取标签列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getTagList(req, res, next) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        category: req.query.category,
        status: req.query.status
      };

      const result = await tagService.getTagList(options);
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(result)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新标签
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async updateTag(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = {};

      // 只更新提供的字段
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.category !== undefined) updateData.category = req.body.category;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.color !== undefined) updateData.color = req.body.color;
      if (req.body.status !== undefined) updateData.status = req.body.status;
      if (req.body.sortOrder !== undefined) updateData.sort_order = req.body.sortOrder;

      const tag = await tagService.updateTag(id, updateData);
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(tag, '标签更新成功')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除标签
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async deleteTag(req, res, next) {
    try {
      const { id } = req.params;
      await tagService.deleteTag(id);
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(null, '标签删除成功')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 切换标签热门状态
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async toggleHotStatus(req, res, next) {
    try {
      const { id } = req.params;
      const tag = await tagService.toggleHotStatus(id);
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(tag, '标签状态切换成功')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 切换标签启用/禁用状态
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async toggleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const tag = await tagService.toggleStatus(id);
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(tag, '标签状态切换成功')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取热门标签
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getHotTags(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const tags = await tagService.getHotTags(limit);
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(tags)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 根据分类获取标签
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getTagsByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      
      const tags = await tagService.getTagsByCategory(category, limit);
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(tags)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量更新标签状态
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async batchUpdateStatus(req, res, next) {
    try {
      const { ids, status } = req.body;
      
      await tagService.batchUpdateStatus(ids, status);
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(null, '批量更新成功')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取标签统计信息
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getTagStatistics(req, res, next) {
    try {
      const stats = await tagService.getTagStatistics();
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(stats)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 增加标签使用次数
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async incrementUseCount(req, res, next) {
    try {
      const { id } = req.params;
      const increment = parseInt(req.body.increment) || 1;
      
      await tagService.incrementUseCount(id, increment);
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(null, '使用次数更新成功')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TagController();
