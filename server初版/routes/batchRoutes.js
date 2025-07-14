const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const { protect } = require('../middlewares/auth');

// 批量获取内容状态（需要用户登录）
router.post('/status', protect, batchController.getBatchStatus);

// 用户状态同步（需要用户登录）
router.get('/sync-user-status', protect, batchController.syncUserStatus);

module.exports = router; 