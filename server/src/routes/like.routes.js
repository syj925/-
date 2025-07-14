const express = require('express');
const router = express.Router();
const likeController = require('../controllers/like.controller');
const { AuthMiddleware, RateLimitMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

// 请求体验证模式
const likeSchema = Joi.object({
  target_id: Joi.string().uuid().required()
    .messages({
      'string.base': '目标ID必须是字符串',
      'string.uuid': '目标ID必须是有效的UUID格式',
      'any.required': '目标ID是必填项'
    }),
  target_type: Joi.string().valid('post', 'comment').required()
    .messages({
      'string.base': '目标类型必须是字符串',
      'string.valid': '目标类型必须是post或comment',
      'any.required': '目标类型是必填项'
    })
});

// 点赞和取消点赞路由
router.post('/', AuthMiddleware.authenticate(), RateLimitMiddleware.likeLimiter(), Validator.validateBody(likeSchema), likeController.like);
router.delete('/:target_type/:target_id', AuthMiddleware.authenticate(), likeController.unlike);

// 获取点赞列表路由
router.get('/user/me', AuthMiddleware.authenticate(), likeController.getUserLikes);
router.get('/:target_type/:target_id', likeController.getTargetLikes);

// 检查是否已点赞路由（可选认证）
router.get('/check/:target_type/:target_id', AuthMiddleware.optionalAuthenticate(), likeController.isLiked);

module.exports = router; 