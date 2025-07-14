const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const followController = require('../controllers/followController');
const likeController = require('../controllers/likeController');
const collectionController = require('../controllers/collectionController');
const userController = require('../controllers/userController');
const settingsController = require('../controllers/settingsController');

// 用户资料和帖子路由
router.get('/:id/profile', userController.getUserProfile);
router.get('/:id/posts', userController.getUserPosts);

// 用户标签路由
router.get('/:id/tags', userController.getUserTags);
router.post('/tags', protect, userController.setUserTags);

// 用户关注关系路由
router.post('/:id/follow', protect, followController.followUser);
router.delete('/:id/follow', protect, followController.unfollowUser);
router.get('/:id/follow/status', protect, followController.checkFollowStatus);
router.get('/:id/following', followController.getFollowing);
router.get('/:id/followers', followController.getFollowers);
router.get('/mutual-follows', protect, followController.getMutualFollows);

// 用户点赞和收藏路由
router.get('/:id/likes/posts', protect, likeController.getLikedPosts);
router.get('/:id/collections', protect, collectionController.getCollectedPosts);

// 设置相关路由
router.get('/settings', protect, settingsController.getUserSettings);
router.put('/settings', protect, settingsController.updateUserSettings);
router.put('/password', protect, settingsController.updatePassword);

module.exports = router; 