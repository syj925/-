const { Category, Post } = require('../models');
const { Op } = require('sequelize');
const redisClient = require('../utils/redis-client');

/**
 * 分类数据访问层
 */
class CategoryRepository {
  /**
   * 创建分类
   * @param {Object} categoryData 分类数据
   * @returns {Promise<Object>} 创建的分类对象
   */
  async create(categoryData) {
    const category = await Category.create(categoryData);
    
    // 清除缓存
    await redisClient.del('categories:all');
    
    return category;
  }

  /**
   * 根据ID查找分类
   * @param {Number} id 分类ID
   * @returns {Promise<Object>} 分类对象
   */
  async findById(id) {
    try {
      // 直接从数据库查询，跳过Redis缓存

      const category = await Category.findByPk(id);

      return category;
    } catch (err) {
      console.error('查询分类出错:', err);
      return null;
    }
  }

  /**
   * 根据名称查找分类
   * @param {String} name 分类名称
   * @returns {Promise<Object>} 分类对象
   */
  async findByName(name) {
    try {
      const category = await Category.findOne({
        where: { name }
      });
      return category;
    } catch (err) {
      console.error('根据名称查询分类出错:', err);
      return null;
    }
  }

  /**
   * 更新分类
   * @param {Number} id 分类ID
   * @param {Object} categoryData 分类数据
   * @returns {Promise<Object>} 更新后的分类对象
   */
  async update(id, categoryData) {
    const category = await Category.findByPk(id);
    if (!category) return null;
    
    await category.update(categoryData);
    
    // 清除缓存
    await redisClient.del(`category:${id}`);
    await redisClient.del('categories:all');
    
    return category;
  }

  /**
   * 删除分类
   * @param {Number} id 分类ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async delete(id) {
    // 检查是否有帖子使用此分类
    const postCount = await Post.count({ where: { category_id: id } });
    if (postCount > 0) {
      throw new Error('此分类下有帖子，无法删除');
    }
    
    const result = await Category.destroy({ where: { id } });
    
    // 清除缓存
    if (result > 0) {
      await redisClient.del(`category:${id}`);
      await redisClient.del('categories:all');
    }
    
    return result > 0;
  }

  /**
   * 获取所有分类
   * @param {Boolean} withPostCount 是否包含帖子数量
   * @returns {Promise<Array>} 分类列表
   */
  async findAll(withPostCount = false) {
    // 尝试从缓存获取 - 使用新的缓存键以避免旧缓存
    const cacheKey = 'categories:enabled:all';
    const cachedCategories = await redisClient.get(cacheKey);
    
    if (cachedCategories) {
      // 确保cachedCategories是字符串类型再进行解析
      return typeof cachedCategories === 'string' ? JSON.parse(cachedCategories) : cachedCategories;
    }
    
    let categories;
    if (withPostCount) {
      categories = await Category.findAll({
        where: {
          status: 'enabled'  // 只返回启用的分类
        },
        attributes: {
          include: [
            [
              // 使用Sequelize.literal进行子查询统计
              sequelize.literal(`(
                SELECT COUNT(*)
                FROM posts
                WHERE
                  posts.category_id = Category.id
                  AND posts.status = 'published'
              )`),
              'post_count'
            ]
          ]
        },
        order: [['sort', 'ASC']]
      });
    } else {
      categories = await Category.findAll({
        where: {
          status: 'enabled'  // 只返回启用的分类
        },
        order: [['sort', 'ASC']]
      });
    }
    
    // 缓存结果
    await redisClient.set(cacheKey, JSON.stringify(categories), 1800); // 缓存30分钟
    
    return categories;
  }

  /**
   * 更新分类排序
   * @param {Array<Object>} sortData 排序数据 [{id, sort}, ...]
   * @returns {Promise<Boolean>} 是否成功
   */
  async updateSort(sortData) {
    // 使用事务确保所有更新成功或全部失败
    const transaction = await Category.sequelize.transaction();
    
    try {
      for (const item of sortData) {
        await Category.update(
          { sort: item.sort },
          { 
            where: { id: item.id },
            transaction
          }
        );
      }
      
      await transaction.commit();
      
      // 清除缓存
      await redisClient.del('categories:all');
      
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 搜索分类
   * @param {String} keyword 关键词
   * @returns {Promise<Array>} 分类列表
   */
  async search(keyword) {
    return await Category.findAll({
      where: {
        name: { [Op.like]: `%${keyword}%` },
        status: 'enabled'  // 只返回启用的分类
      },
      order: [['sort', 'ASC']]
    });
  }

  /**
   * 更新分类帖子计数
   * @param {Number} categoryId 分类ID
   * @param {Number} count 帖子数量
   * @returns {Promise<Boolean>} 更新结果
   */
  async updatePostCount(categoryId, count) {
    const result = await Category.update(
      { post_count: count },
      { where: { id: categoryId } }
    );

    // 清除缓存
    await redisClient.del('categories:all');

    return result[0] > 0;
  }

  /**
   * 获取所有分类及统计信息
   * @returns {Promise<Array>} 分类列表
   */
  async findAllWithStats() {
    return await Category.findAll({
      attributes: ['id', 'name', 'icon', 'sort', 'post_count', 'status', 'created_at', 'updated_at'],
      order: [['sort', 'ASC'], ['id', 'ASC']]
    });
  }

  /**
   * 增加分类帖子计数
   * @param {Number} categoryId 分类ID
   * @param {Number} increment 增量（默认1）
   * @returns {Promise<Boolean>} 更新结果
   */
  async incrementPostCount(categoryId, increment = 1) {
    if (!categoryId) return false;

    const result = await Category.increment('post_count', {
      by: increment,
      where: { id: categoryId }
    });

    // 清除缓存
    await redisClient.del('categories:all');

    return result;
  }

  /**
   * 减少分类帖子计数
   * @param {Number} categoryId 分类ID
   * @param {Number} decrement 减量（默认1）
   * @returns {Promise<Boolean>} 更新结果
   */
  async decrementPostCount(categoryId, decrement = 1) {
    if (!categoryId) return false;

    const result = await Category.decrement('post_count', {
      by: decrement,
      where: { id: categoryId }
    });

    // 清除缓存
    await redisClient.del('categories:all');

    return result;
  }
}

module.exports = new CategoryRepository(); 