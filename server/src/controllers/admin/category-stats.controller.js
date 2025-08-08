const categoryStatsService = require('../../services/category-stats.service');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../../config/logger');

/**
 * 分类统计管理控制器
 */
class CategoryStatsController {
  /**
   * 获取分类统计信息
   */
  async getCategoryStats(req, res) {
    try {
      const stats = await categoryStatsService.getCategoryStats();
      
      res.status(StatusCodes.OK).json({
        code: 0,
        msg: '获取分类统计成功',
        data: stats
      });
    } catch (error) {
      logger.error('获取分类统计失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: 1,
        msg: '获取分类统计失败',
        error: error.message
      });
    }
  }

  /**
   * 获取热门分类
   */
  async getHotCategories(req, res) {
    try {
      const { limit = 10 } = req.query;
      const hotCategories = await categoryStatsService.getHotCategories(parseInt(limit));
      
      res.status(StatusCodes.OK).json({
        code: 0,
        msg: '获取热门分类成功',
        data: {
          categories: hotCategories,
          total: hotCategories.length
        }
      });
    } catch (error) {
      logger.error('获取热门分类失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: 1,
        msg: '获取热门分类失败',
        error: error.message
      });
    }
  }

  /**
   * 同步分类统计数据
   */
  async syncCategoryStats(req, res) {
    try {
      const result = await categoryStatsService.syncCategoryStats();
      
      res.status(StatusCodes.OK).json({
        code: 0,
        msg: '同步分类统计成功',
        data: result
      });
    } catch (error) {
      logger.error('同步分类统计失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: 1,
        msg: '同步分类统计失败',
        error: error.message
      });
    }
  }

  /**
   * 更新单个分类统计
   */
  async updateCategoryPostCount(req, res) {
    try {
      const { categoryId } = req.params;
      
      if (!categoryId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          code: 1,
          msg: '分类ID不能为空'
        });
      }

      await categoryStatsService.updateCategoryPostCount(parseInt(categoryId));
      
      res.status(StatusCodes.OK).json({
        code: 0,
        msg: '更新分类统计成功'
      });
    } catch (error) {
      logger.error('更新分类统计失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: 1,
        msg: '更新分类统计失败',
        error: error.message
      });
    }
  }

  /**
   * 获取分类详细统计（包含趋势数据）
   */
  async getCategoryDetailStats(req, res) {
    try {
      const { categoryId } = req.params;
      const { days = 7 } = req.query;
      
      if (!categoryId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          code: 1,
          msg: '分类ID不能为空'
        });
      }

      // 这里可以扩展获取趋势数据的逻辑
      const stats = await categoryStatsService.getCategoryStats();
      const categoryStats = stats.categories.find(cat => cat.id == categoryId);
      
      if (!categoryStats) {
        return res.status(StatusCodes.NOT_FOUND).json({
          code: 1,
          msg: '分类不存在'
        });
      }

      res.status(StatusCodes.OK).json({
        code: 0,
        msg: '获取分类详细统计成功',
        data: {
          category: categoryStats,
          trend_days: parseInt(days),
          // 可以在这里添加趋势数据
          trend_data: []
        }
      });
    } catch (error) {
      logger.error('获取分类详细统计失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: 1,
        msg: '获取分类详细统计失败',
        error: error.message
      });
    }
  }
}

module.exports = new CategoryStatsController();
