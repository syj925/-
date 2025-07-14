const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const searchController = require('../controllers/searchController');
const { protect, admin } = require('../middlewares/auth');
const { cacheRequest, clearCache } = require('../middlewares/cacheMiddleware');
const config = require('../config/config');

// 公开路由
router.get('/', cacheRequest('topics', config.performance.cache.topics), topicController.getTopics);
router.get('/hot', cacheRequest('topics:hot', config.performance.cache.topics), topicController.getHotTopics);
router.get('/trending', cacheRequest('topics:trending', config.performance.cache.topics), searchController.getTrendingTopics);
router.get('/search', topicController.searchTopics); // 无缓存，确保实时搜索结果
router.get('/:id', cacheRequest('topic', config.performance.cache.topics, (req) => `topic:${req.params.id}`), topicController.getTopic);
router.get('/:id/posts', cacheRequest('topic:posts', config.performance.cache.topics, (req) => `topic:${req.params.id}:posts`), topicController.getTopicPosts);

// 记录话题浏览量 - 禁用缓存，确保每次都能记录
router.post('/:id/view', (req, res, next) => {
  console.log(`收到话题${req.params.id}浏览记录请求`);
  next();
}, topicController.recordView);

// 查询话题浏览状态 - 需要用户登录
router.get('/:id/view-status', protect, topicController.checkViewStatus);

// 批量查询话题浏览状态 - 需要用户登录
router.post('/batch-view-status', protect, topicController.batchCheckViewStatus);

// 需要用户登录的路由
router.post('/', protect, clearCache('topics:*'), topicController.createTopic);

// 管理员路由（需要管理员权限）
router.put('/:id', protect, admin, clearCache('topic:*'), topicController.updateTopic);

module.exports = router; 