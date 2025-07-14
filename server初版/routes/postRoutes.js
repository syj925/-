const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const likeController = require('../controllers/likeController');
const collectionController = require('../controllers/collectionController');
const { protect, adminProtect } = require('../middlewares/auth');
const { cacheRequest, clearCache } = require('../middlewares/cacheMiddleware');
const config = require('../config/config');

// 公开路由
router.get('/', cacheRequest('posts', config.performance.cache.posts), postController.getPosts);
router.get('/:id', cacheRequest('post', config.performance.cache.posts, (req) => `post:${req.params.id}`), postController.getPost);
router.post('/:id/view', postController.recordView); // 记录浏览量

// 需要身份验证的路由
router.post('/', protect, clearCache('posts:*'), postController.createPost);
router.put('/:id', protect, clearCache('post:*'), postController.updatePost);
router.delete('/:id', protect, clearCache('post:*'), postController.deletePost);
router.put('/:id/recommend', adminProtect, postController.toggleRecommend); // 管理员设置推荐

// 评论相关路由
router.get('/:postId/comments', cacheRequest('comments', config.performance.cache.comments, (req) => `comments:${req.params.postId}`), commentController.getComments);
router.post('/:postId/comments', protect, clearCache('comments:*'), commentController.addComment);

// 点赞和收藏路由
router.post('/:id/like', protect, clearCache('post:*'), likeController.likePost);
router.delete('/:id/like', protect, clearCache('post:*'), likeController.unlikePost);
router.get('/:id/like/status', protect, likeController.checkLikeStatus);
router.post('/:id/collect', protect, clearCache('post:*'), collectionController.collectPost);
router.delete('/:id/collect', protect, clearCache('post:*'), collectionController.uncollectPost);
router.get('/:id/collect/status', protect, collectionController.checkCollectionStatus);
// 添加获取帖子状态的路由
router.get('/:id/status', protect, postController.getPostStatus);

module.exports = router; 