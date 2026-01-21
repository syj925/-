const express = require('express');
const router = express.Router();
const onlineStatsController = require('../../controllers/admin/online-stats.controller');
const { AuthMiddleware } = require('../../middlewares');

/**
 * 管理员在线统计路由
 * 提供在线用户统计相关的API接口
 */

/**
 * @route GET /api/admin/stats/online/count
 * @desc 获取当前在线人数
 * @access Private (Admin only)
 */
router.get('/count', 
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin', 'super_admin']),
  onlineStatsController.getOnlineCount
);

/**
 * @route GET /api/admin/stats/online/detailed
 * @desc 获取详细的在线统计信息
 * @access Private (Admin only)
 */
router.get('/detailed',
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin', 'super_admin']),
  onlineStatsController.getDetailedStats
);

/**
 * @route GET /api/admin/stats/online/dashboard
 * @desc 获取仪表盘优化的在线统计数据
 * @access Private (Admin only)
 */
router.get('/dashboard',
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin', 'super_admin']),
  onlineStatsController.getDashboardStats
);

module.exports = router;
