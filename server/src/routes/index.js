const express = require('express');
const router = express.Router();

// 引入各个模块的路由
const userRoutes = require('./user.routes');
const postRoutes = require('./post.routes');
const categoryRoutes = require('./category.routes');
const topicRoutes = require('./topic.routes');
const commentRoutes = require('./comment.routes');
const likeRoutes = require('./like.routes');
const favoriteRoutes = require('./favorite.routes');
const messageRoutes = require('./message.routes');
const followRoutes = require('./follow.routes');
const uploadRoutes = require('./upload.routes');
const adminRoutes = require('./admin.routes');
const searchRoutes = require('./search.routes');
const settingsRoutes = require('./settings.routes');
const userController = require('../controllers/user.controller');
const { Validator } = require('../utils');
const Joi = require('joi');
// 后续将在此处引入其他路由

// 认证相关API
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).max(30).required(),
  nickname: Joi.string().min(2).max(20).required()
});

// 添加认证API路由，确保路径和前端匹配
router.post('/api/auth/login', Validator.validateBody(loginSchema), userController.login);
router.post('/api/auth/register', Validator.validateBody(registerSchema), userController.register);

// API路由
router.use('/api/users', userRoutes);
router.use('/api/posts', postRoutes);
router.use('/api/comments', commentRoutes);
router.use('/api/likes', likeRoutes);
router.use('/api/favorites', favoriteRoutes);
router.use('/api/follows', followRoutes);
router.use('/api/messages', messageRoutes);
router.use('/api/topics', topicRoutes);
router.use('/api/categories', categoryRoutes);
router.use('/api/upload', uploadRoutes);
router.use('/api/search', searchRoutes);
router.use('/api/settings', settingsRoutes);

// 管理员API路由
router.use('/api/admin', adminRoutes);

// API状态检查路由
router.get('/status', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 健康检查
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router; 