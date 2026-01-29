const express = require('express');
const router = express.Router();
const emojiController = require('../controllers/emoji.controller');
const { AuthMiddleware, RateLimitMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

// ==================== 验证模式 ====================

// 记录使用
const usageSchema = Joi.object({
  emoji_id: Joi.string().uuid().required()
    .messages({
      'string.uuid': '表情ID必须是有效的UUID格式',
      'any.required': '表情ID是必填项'
    })
});

// 收藏表情
const favoriteSchema = Joi.object({
  emoji_id: Joi.string().uuid().required()
    .messages({
      'string.uuid': '表情ID必须是有效的UUID格式',
      'any.required': '表情ID是必填项'
    })
});

// 添加表情包
const addPackSchema = Joi.object({
  pack_id: Joi.string().uuid().required()
    .messages({
      'string.uuid': '表情包ID必须是有效的UUID格式',
      'any.required': '表情包ID是必填项'
    }),
  source: Joi.string().valid('default', 'download', 'purchase', 'gift').default('download')
});

// 上传自定义表情
const uploadCustomSchema = Joi.object({
  name: Joi.string().min(1).max(50).required()
    .messages({
      'string.min': '表情名称至少1个字符',
      'string.max': '表情名称最多50个字符',
      'any.required': '表情名称是必填项'
    }),
  url: Joi.string().max(500).required()
    .messages({
      'string.max': 'URL最多500个字符',
      'any.required': '图片URL是必填项'
    }),
  type: Joi.string().valid('static', 'animated').default('static'),
  file_size: Joi.number().integer().positive().max(2 * 1024 * 1024),
  width: Joi.number().integer().positive().max(500),
  height: Joi.number().integer().positive().max(500)
});

// ==================== 公开API ====================

// 获取初始化数据（支持版本检查）
router.get('/init', 
  AuthMiddleware.optionalAuthenticate(),
  emojiController.getInitData
);

// 获取表情包列表
router.get('/packs', emojiController.getPacks);

// 获取单个表情包详情
router.get('/packs/:packId', emojiController.getPackById);

// 搜索表情
router.get('/search', emojiController.searchEmojis);

// 获取热门表情
router.get('/hot', emojiController.getHotEmojis);

// ==================== 需要登录的API ====================

// 获取用户个人表情数据（独立于全局版本号）
// 用于前端单独请求用户数据，不触发全局更新
router.get('/user-data',
  AuthMiddleware.authenticate(),
  emojiController.getUserData
);

// 记录表情使用
router.post('/usage',
  AuthMiddleware.authenticate(),
  Validator.validateBody(usageSchema),
  emojiController.recordUsage
);

// 获取用户最近使用的表情
router.get('/recent',
  AuthMiddleware.authenticate(),
  emojiController.getRecentEmojis
);

// 获取用户收藏的表情
router.get('/favorites',
  AuthMiddleware.authenticate(),
  emojiController.getFavorites
);

// 收藏表情
router.post('/favorites',
  AuthMiddleware.authenticate(),
  Validator.validateBody(favoriteSchema),
  emojiController.addFavorite
);

// 取消收藏表情
router.delete('/favorites/:emojiId',
  AuthMiddleware.authenticate(),
  emojiController.removeFavorite
);

// 获取用户拥有的表情包
router.get('/user/packs',
  AuthMiddleware.authenticate(),
  emojiController.getUserPacks
);

// 添加表情包到用户
router.post('/user/packs',
  AuthMiddleware.authenticate(),
  Validator.validateBody(addPackSchema),
  emojiController.addPack
);

// 移除用户的表情包
router.delete('/user/packs/:packId',
  AuthMiddleware.authenticate(),
  emojiController.removePack
);

// ==================== 自定义表情API ====================

// 上传自定义表情
router.post('/custom',
  AuthMiddleware.authenticate(),
  RateLimitMiddleware.uploadLimiter(),
  Validator.validateBody(uploadCustomSchema),
  emojiController.uploadCustomEmoji
);

// 获取用户的自定义表情列表
router.get('/custom',
  AuthMiddleware.authenticate(),
  emojiController.getUserCustomEmojis
);

module.exports = router;
