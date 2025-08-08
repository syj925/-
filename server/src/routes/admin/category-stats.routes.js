const express = require('express');
const router = express.Router();
const categoryStatsController = require('../../controllers/admin/category-stats.controller');
const { AuthMiddleware, AdminMiddleware } = require('../../middlewares');

/**
 * 分类统计管理路由
 */

// 获取分类统计信息
router.get('/stats', categoryStatsController.getCategoryStats);

// 获取热门分类
router.get('/hot', categoryStatsController.getHotCategories);

// 同步分类统计数据
router.post('/sync', categoryStatsController.syncCategoryStats);

// 更新单个分类统计
router.put('/:categoryId/count', categoryStatsController.updateCategoryPostCount);

// 获取分类详细统计
router.get('/:categoryId/detail', categoryStatsController.getCategoryDetailStats);

module.exports = router;
