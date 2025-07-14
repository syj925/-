const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// 获取消息相关设置
router.get('/message', settingsController.getMessageSettings);

module.exports = router; 