const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const { AuthMiddleware, RateLimitMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

// 请求体验证模式
const favoriteSchema = Joi.object({
  post_id: Joi.string().uuid().required()
    .messages({
      'string.base': '帖子ID必须是字符串',
      'string.uuid': '帖子ID必须是有效的UUID格式',
      'any.required': '帖子ID是必填项'
    })
});

// 收藏和取消收藏路由
router.post('/', AuthMiddleware.authenticate(), RateLimitMiddleware.favoritePostLimiter(), Validator.validateBody(favoriteSchema), favoriteController.addFavorite);
router.delete('/:post_id', AuthMiddleware.authenticate(), favoriteController.removeFavorite);

// 获取收藏列表路由
router.get('/user/me', AuthMiddleware.authenticate(), favoriteController.getUserFavorites);
router.get('/post/:post_id', favoriteController.getPostFavoriteUsers);

// 检查是否已收藏路由
router.get('/check/:post_id', favoriteController.isFavorited);

module.exports = router; 