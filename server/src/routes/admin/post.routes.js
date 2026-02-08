const express = require('express');

const adminPostController = require('../../controllers/admin/post.controller');

const router = express.Router();

router.get('/pending', adminPostController.getPendingPosts);
router.get('/', adminPostController.getPostList);
router.get('/:id', adminPostController.getPostDetail);
router.put('/:id', adminPostController.updatePost);
router.delete('/:id', adminPostController.deletePost);
router.put('/:id/audit', adminPostController.auditPost);
router.put('/:id/recommend', adminPostController.setRecommendStatus);
router.put('/:id/top', adminPostController.setTopStatus);

module.exports = router;
