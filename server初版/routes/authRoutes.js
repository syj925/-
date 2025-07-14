const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// 公开路由
router.post('/register', authController.register);
router.post('/login', authController.login);

// 需要身份验证的路由
router.get('/me', protect, authController.getMe);
router.put('/me', protect, authController.updateMe);

// 登出路由
router.post('/logout', protect, authController.logout);

module.exports = router; 