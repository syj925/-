const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/auth');
const badgeController = require('../controllers/badgeController');

// 后台管理API路由
// ===================================

// 标签管理
router.get('/admin/badges', protect, admin, badgeController.getBadges);
router.post('/admin/badges', protect, admin, badgeController.createBadge);
router.get('/admin/badges/:id', protect, admin, badgeController.getBadge);
router.put('/admin/badges/:id', protect, admin, badgeController.updateBadge);
router.delete('/admin/badges/:id', protect, admin, badgeController.deleteBadge);
router.put('/admin/badges/:id/status', protect, admin, badgeController.updateBadgeStatus);

// 用户标签管理
router.get('/admin/users/:userId/badges', protect, admin, badgeController.getUserBadges);
router.post('/admin/users/:userId/badges', protect, admin, badgeController.addUserBadge);
router.delete('/admin/users/:userId/badges/:badgeId', protect, admin, badgeController.removeUserBadge);

// 前台API路由
// ===================================
router.get('/users/:id/badges', badgeController.getUserBadgesPublic);

module.exports = router; 