const categoryRepository = require('../repositories/category.repository');
const postRepository = require('../repositories/post.repository');
const { sequelize } = require('../models');
const logger = require('../../config/logger');

/**
 * 分类统计服务
 */
class CategoryStatsService {
  /**
   * 更新单个分类的帖子计数
   * @param {number} categoryId 分类ID
   * @returns {Promise<void>}
   */
  async updateCategoryPostCount(categoryId) {
    try {
      if (!categoryId) return;

      const count = await postRepository.countByCategory(categoryId, 'published');
      await categoryRepository.updatePostCount(categoryId, count);
      
      logger.info(`分类 ${categoryId} 帖子计数已更新: ${count}`);
    } catch (error) {
      logger.error('更新分类帖子计数失败:', error);
      throw error;
    }
  }

  /**
   * 更新所有分类的帖子计数
   * @returns {Promise<void>}
   */
  async updateAllCategoryPostCounts() {
    try {
      const categories = await categoryRepository.findAll();
      
      for (const category of categories) {
        await this.updateCategoryPostCount(category.id);
      }
      
      logger.info('所有分类帖子计数已更新');
    } catch (error) {
      logger.error('更新所有分类帖子计数失败:', error);
      throw error;
    }
  }

  /**
   * 获取分类统计信息
   * @returns {Promise<Array>} 分类统计数据
   */
  async getCategoryStats() {
    try {
      const categories = await categoryRepository.findAllWithStats();
      
      // 计算总帖子数
      const totalPosts = categories.reduce((sum, category) => sum + (category.post_count || 0), 0);
      
      return {
        categories: categories.map(category => ({
          id: category.id,
          name: category.name,
          icon: category.icon,
          post_count: category.post_count || 0,
          percentage: totalPosts > 0 ? ((category.post_count || 0) / totalPosts * 100).toFixed(1) : 0
        })),
        total_posts: totalPosts
      };
    } catch (error) {
      logger.error('获取分类统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取热门分类（按帖子数量排序）
   * @param {number} limit 限制数量
   * @returns {Promise<Array>} 热门分类列表
   */
  async getHotCategories(limit = 10) {
    try {
      const categories = await categoryRepository.findAllWithStats();
      
      return categories
        .filter(category => (category.post_count || 0) > 0)
        .sort((a, b) => (b.post_count || 0) - (a.post_count || 0))
        .slice(0, limit)
        .map(category => ({
          id: category.id,
          name: category.name,
          icon: category.icon,
          post_count: category.post_count || 0
        }));
    } catch (error) {
      logger.error('获取热门分类失败:', error);
      throw error;
    }
  }

  /**
   * 重新计算并同步所有分类统计
   * @returns {Promise<Object>} 同步结果
   */
  async syncCategoryStats() {
    const transaction = await sequelize.transaction();
    
    try {
      // 使用SQL直接更新，提高性能
      await sequelize.query(`
        UPDATE categories SET post_count = (
          SELECT COUNT(*) 
          FROM posts 
          WHERE posts.category_id = categories.id 
          AND posts.status = 'published'
          AND posts.deleted_at IS NULL
        )
      `, { transaction });

      await transaction.commit();
      
      const stats = await this.getCategoryStats();
      
      logger.info('分类统计同步完成', {
        total_categories: stats.categories.length,
        total_posts: stats.total_posts
      });
      
      return {
        success: true,
        message: '分类统计同步完成',
        stats
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('分类统计同步失败:', error);
      throw error;
    }
  }
}

module.exports = new CategoryStatsService();
