const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { protect, admin } = require('../middlewares/auth');
const { cacheRequest, clearCache } = require('../middlewares/cacheMiddleware');
const config = require('../config/config');

// 公开路由
// 获取标签列表
router.get('/', cacheRequest('tags', config.performance.cache.tags || 300), tagController.getTags);

// 获取热门标签
router.get('/hot', cacheRequest('tags:hot', config.performance.cache.tags || 300), tagController.getHotTags);

// 根据分类获取标签
router.get('/category/:category', cacheRequest('tags:category', config.performance.cache.tags || 300, (req) => `tags:category:${req.params.category}`), tagController.getTagsByCategory);

// 获取标签详情
router.get('/:id', cacheRequest('tag', config.performance.cache.tags || 300, (req) => `tag:${req.params.id}`), tagController.getTag);

// 需要认证的路由
// 创建标签（需要管理员权限）
router.post('/', protect, admin, clearCache('tags:*'), tagController.createTag);

// 更新标签（需要管理员权限）
router.put('/:id', protect, admin, clearCache('tag:*'), tagController.updateTag);

// 删除标签（需要管理员权限）
router.delete('/:id', protect, admin, clearCache('tags:*'), tagController.deleteTag);

// 设置/取消热门标签（需要管理员权限）
router.put('/:id/hot', protect, admin, clearCache('tags:*'), tagController.toggleHot);

// 启用/禁用标签（需要管理员权限）
router.put('/:id/status', protect, admin, clearCache('tags:*'), tagController.toggleStatus);

module.exports = router; 