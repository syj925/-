const categoryRepository = require('../repositories/category.repository');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const errorCodes = require('../constants/error-codes');

/**
 * 分类服务层
 */
class CategoryService {
  /**
   * 创建分类
   * @param {Object} categoryData 分类数据
   * @returns {Promise<Object>} 创建的分类对象
   */
  async createCategory(categoryData) {
    // 检查分类名称是否已存在
    const categories = await categoryRepository.findAll();
    const existingCategory = categories.find(category => category.name === categoryData.name);
    
    if (existingCategory) {
      throw ErrorMiddleware.createError(
        '分类名称已存在',
        StatusCodes.BAD_REQUEST,
        errorCodes.CATEGORY_EXISTS
      );
    }
    
    return await categoryRepository.create(categoryData);
  }

  /**
   * 获取分类详情
   * @param {Number} id 分类ID
   * @returns {Promise<Object>} 分类对象
   */
  async getCategoryById(id) {
    const category = await categoryRepository.findById(id);
    
    if (!category) {
      throw ErrorMiddleware.createError(
        '分类不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.CATEGORY_NOT_EXIST
      );
    }
    
    return category;
  }

  /**
   * 更新分类
   * @param {Number} id 分类ID
   * @param {Object} categoryData 分类数据
   * @returns {Promise<Object>} 更新后的分类对象
   */
  async updateCategory(id, categoryData) {
    // 检查分类是否存在
    const category = await categoryRepository.findById(id);
    
    if (!category) {
      throw ErrorMiddleware.createError(
        '分类不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.CATEGORY_NOT_EXIST
      );
    }
    
    // 如果更新了名称，检查是否与其他分类重名
    if (categoryData.name && categoryData.name !== category.name) {
      const categories = await categoryRepository.findAll();
      const existingCategory = categories.find(c => c.name === categoryData.name && c.id !== id);
      
      if (existingCategory) {
        throw ErrorMiddleware.createError(
          '分类名称已存在',
          StatusCodes.BAD_REQUEST,
          errorCodes.CATEGORY_EXISTS
        );
      }
    }
    
    return await categoryRepository.update(id, categoryData);
  }

  /**
   * 删除分类
   * @param {Number} id 分类ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async deleteCategory(id) {
    try {
      return await categoryRepository.delete(id);
    } catch (error) {
      if (error.message === '此分类下有帖子，无法删除') {
        throw ErrorMiddleware.createError(
          '此分类下有帖子，无法删除',
          StatusCodes.BAD_REQUEST,
          errorCodes.CATEGORY_HAS_POSTS
        );
      }
      throw error;
    }
  }

  /**
   * 获取所有分类
   * @param {Boolean} withPostCount 是否包含帖子数量
   * @returns {Promise<Array>} 分类列表
   */
  async getAllCategories(withPostCount = false) {
    return await categoryRepository.findAll(withPostCount);
  }

  /**
   * 更新分类排序
   * @param {Array<Object>} sortData 排序数据 [{id, sort}, ...]
   * @returns {Promise<Boolean>} 是否成功
   */
  async updateCategorySort(sortData) {
    // 检查所有分类是否存在
    const categories = await categoryRepository.findAll();
    const categoryIds = categories.map(category => category.id);
    
    for (const item of sortData) {
      if (!categoryIds.includes(item.id)) {
        throw ErrorMiddleware.createError(
          `分类ID ${item.id} 不存在`,
          StatusCodes.BAD_REQUEST,
          errorCodes.CATEGORY_NOT_EXIST
        );
      }
    }
    
    return await categoryRepository.updateSort(sortData);
  }

  /**
   * 搜索分类
   * @param {String} keyword 关键词
   * @returns {Promise<Array>} 分类列表
   */
  async searchCategories(keyword) {
    if (!keyword || keyword.trim() === '') {
      return await categoryRepository.findAll();
    }
    
    return await categoryRepository.search(keyword);
  }
}

module.exports = new CategoryService(); 