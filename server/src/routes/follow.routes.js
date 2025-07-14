const express = require('express');
const router = express.Router();
const followController = require('../controllers/follow.controller');
const { AuthMiddleware, RateLimitMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

// 请求体验证模式
const followSchema = Joi.object({
  user_id: Joi.string().uuid().required()
    .messages({
      'string.base': '用户ID必须是字符串',
      'string.uuid': '用户ID必须是有效的UUID格式',
      'any.required': '用户ID是必填项'
    })
});

// 关注和取消关注路由
router.post('/', AuthMiddleware.authenticate(), RateLimitMiddleware.apiLimiter(), Validator.validateBody(followSchema), followController.followUser);
router.delete('/:user_id', AuthMiddleware.authenticate(), followController.unfollowUser);

// 获取用户关注和粉丝列表
router.get('/me/followings', AuthMiddleware.authenticate(), followController.getMyFollowings);
router.get('/me/followers', AuthMiddleware.authenticate(), followController.getMyFollowers);
router.get('/user/:user_id/followings', followController.getFollowings);
router.get('/user/:user_id/followers', followController.getFollowers);

// 获取用户关注和粉丝数量
router.get('/user/:user_id/counts', followController.getFollowCounts);

// 检查是否已关注
router.get('/check/:user_id', followController.isFollowing);

// 获取共同关注
router.get('/common/:user_id1/:user_id2', followController.getCommonFollowings);

// 批量检查关注状态
router.post('/batch-check', AuthMiddleware.authenticate(), followController.batchCheckFollowStatus);

// 检查两个用户是否互相关注
router.get('/mutual/:user_id1/:user_id2', followController.checkMutualFollow);

// 获取互相关注列表
router.get('/me/mutual', AuthMiddleware.authenticate(), followController.getMyMutualFollowings);
router.get('/user/:user_id/mutual', followController.getMutualFollowings);

module.exports = router;