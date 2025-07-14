const categoryService = require('../services/category.service');
const { ResponseUtil } = require('../utils');
const { StatusCodes } = require('http-status-codes');

/**
 * 分类控制器
 */
class CategoryController {
  /**
   * 创建分类
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async createCategory(req, res, next) {
    try {
      const { name, icon, sort } = req.body;
      
      const category = await categoryService.createCategory({
        name,
        icon,
        sort: sort || 0
      });
      
      res.status(StatusCodes.CREATED).json(ResponseUtil.success(category));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取分类详情
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      
      const category = await categoryService.getCategoryById(parseInt(id, 10));
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(category));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新分类
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { name, icon, sort } = req.body;
      
      const categoryData = {};
      if (name !== undefined) categoryData.name = name;
      if (icon !== undefined) categoryData.icon = icon;
      if (sort !== undefined) categoryData.sort = sort;
      
      const category = await categoryService.updateCategory(parseInt(id, 10), categoryData);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(category));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除分类
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      
      const result = await categoryService.deleteCategory(parseInt(id, 10));
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取所有分类
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getAllCategories(req, res, next) {
    try {
      const { withPostCount } = req.query;
      
      const categories = await categoryService.getAllCategories(
        withPostCount === 'true'
      );
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(categories));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新分类排序
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async updateCategorySort(req, res, next) {
    try {
      const { sortData } = req.body;
      
      const result = await categoryService.updateCategorySort(sortData);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 搜索分类
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async searchCategories(req, res, next) {
    try {
      const { keyword } = req.query;
      
      const categories = await categoryService.searchCategories(keyword);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(categories));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController(); 