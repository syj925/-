const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middlewares/auth');

// 删除评论路由
router.delete('/:id', protect, commentController.deleteComment);

// 评论点赞/取消点赞路由
router.post('/:id/like', protect, commentController.likeComment);
router.delete('/:id/like', protect, commentController.unlikeComment);

// 评论回复路由
router.post('/reply', protect, commentController.replyToComment);
router.get('/:id/replies', commentController.getCommentReplies);

// 评论回复点赞/取消点赞路由
router.post('/replies/:id/like', protect, commentController.likeComment);
router.delete('/replies/:id/like', protect, commentController.unlikeComment);

// 管理员修复评论点赞数路由
router.post('/:id/fix-likes', protect, commentController.fixCommentLikes);
router.post('/fix-all-likes', protect, commentController.fixAllCommentLikes);

module.exports = router; 