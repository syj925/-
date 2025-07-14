const express = require('express');
const router = express.Router();

// 导入所有路由
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const postRoutes = require('./postRoutes');
const topicRoutes = require('./topicRoutes');
const eventRoutes = require('./eventRoutes');
const commentRoutes = require('./commentRoutes');
const messageRoutes = require('./messageRoutes');
const notificationRoutes = require('./notificationRoutes');
const searchRoutes = require('./searchRoutes');
const uploadRoutes = require('./uploadRoutes');
const batchRoutes = require('./batchRoutes');
const adminRoutes = require('./adminRoutes');
const contentRoutes = require('./contentRoutes');
const tagRoutes = require('./tagRoutes');
const badgeRoutes = require('./badgeRoutes');
const settingsRoutes = require('./settingsRoutes');
const recommendController = require('../controllers/recommendController');

// 使用各模块路由
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
// 推荐相关路由
router.get('/posts/recommended', recommendController.getRecommendedPosts);
router.use('/posts', postRoutes);
router.use('/topics', topicRoutes);
router.use('/tags', tagRoutes);
router.use('/events', eventRoutes);
router.use('/comments', commentRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/search', searchRoutes);
router.use('/upload', uploadRoutes);
router.use('/batch', batchRoutes);
router.use('/admin', adminRoutes);
router.use('/content', contentRoutes);
router.use('/settings', settingsRoutes);
router.use('/', badgeRoutes);

// 添加测试路由，用于检查模型初始化情况
router.get('/test-models', (req, res) => {
  const db = require('../models/associations');
  
  // 获取可用模型
  const modelNames = Object.keys(db).filter(key => 
    key !== 'sequelize' && 
    key !== 'Sequelize' && 
    typeof db[key] !== 'function'
  );
  
  // 收集模型信息
  const models = {};
  modelNames.forEach(name => {
    const model = db[name];
    models[name] = {
      isInitialized: model ? true : false,
      type: typeof model,
      hasFind: model && typeof model.findAll === 'function',
      modelName: model ? model.name : 'N/A',
      tableName: model && model.tableName ? model.tableName : 'N/A'
    };
  });
  
  // 收集db对象的所有键以进行调试
  const allKeys = Object.keys(db);
  const keyTypes = {};
  allKeys.forEach(key => {
    keyTypes[key] = typeof db[key];
  });
  
  res.json({
    allKeys,
    keyTypes,
    modelCount: modelNames.length,
    models
  });
});

// 健康检查路由
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 默认路由
router.get('/', (req, res) => {
  res.json({
    message: 'API is working',
    version: '1.0.0',
    endpoints: [
      '/auth',
      '/users',
      '/posts',
      '/topics',
      '/tags',
      '/events',
      '/comments',
      '/messages',
      '/notifications',
      '/search',
      '/upload',
      '/batch',
      '/admin',
      '/content',
      '/admin/badges'
    ]
  });
});

// 404 路由
router.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

module.exports = router; 