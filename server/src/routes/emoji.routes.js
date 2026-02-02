const express = require('express');
const router = express.Router();
const emojiController = require('../controllers/emoji.controller');
const { AuthMiddleware, RateLimitMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

/**
 * @swagger
 * components:
 *   schemas:
 *     Emoji:
 *       type: object
 *       required:
 *         - id
 *         - code
 *         - name
 *         - url
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 表情ID
 *         pack_id:
 *           type: string
 *           format: uuid
 *           description: 所属表情包ID
 *         code:
 *           type: string
 *           description: 唯一表情代码，如 [doge]
 *         name:
 *           type: string
 *           description: 表情名称
 *         keywords:
 *           type: string
 *           description: 搜索关键词，逗号分隔
 *         url:
 *           type: string
 *           description: 图片地址
 *         thumbnail_url:
 *           type: string
 *           description: 缩略图地址
 *         type:
 *           type: string
 *           enum: [static, animated]
 *           description: 图片类型
 *         width:
 *           type: integer
 *           description: 图片宽度
 *         height:
 *           type: integer
 *           description: 图片高度
 *         file_size:
 *           type: integer
 *           description: 文件大小（字节）
 *         use_count:
 *           type: integer
 *           description: 使用次数
 *         status:
 *           type: string
 *           enum: [active, pending, rejected]
 *         sort_order:
 *           type: integer
 *           description: 排序权重
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

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
/**
 * @swagger
 * /api/emojis/init:
 *   get:
 *     summary: 获取表情初始化数据
 *     tags: [Emojis]
 *     parameters:
 *       - in: query
 *         name: version
 *         schema:
 *           type: integer
 *         description: 客户端缓存的版本号，默认为0
 *     responses:
 *       200:
 *         description: 初始化数据（可能包含增量信息）
 */
router.get('/init', 
  AuthMiddleware.optionalAuthenticate(),
  emojiController.getInitData
);

// 获取表情包列表
/**
 * @swagger
 * /api/emojis/packs:
 *   get:
 *     summary: 获取表情包列表
 *     tags: [Emojis]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: 表情包类型（official/community 等）
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: includeEmojis
 *         schema:
 *           type: boolean
 *         description: 是否同时返回表情列表
 *     responses:
 *       200:
 *         description: 表情包数据
 */
router.get('/packs', emojiController.getPacks);

// 获取单个表情包详情
/**
 * @swagger
 * /api/emojis/packs/{packId}:
 *   get:
 *     summary: 获取表情包详情
 *     tags: [Emojis]
 *     parameters:
 *       - in: path
 *         name: packId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 表情包详情
 */
router.get('/packs/:packId', emojiController.getPackById);

// 搜索表情
/**
 * @swagger
 * /api/emojis/search:
 *   get:
 *     summary: 搜索表情
 *     tags: [Emojis]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键字
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: 表情搜索结果
 */
router.get('/search', emojiController.searchEmojis);

// 获取热门表情
/**
 * @swagger
 * /api/emojis/hot:
 *   get:
 *     summary: 获取热门表情
 *     tags: [Emojis]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: 热门表情列表
 */
router.get('/hot', emojiController.getHotEmojis);

// ==================== 需要登录的API ====================

// 获取用户个人表情数据（独立于全局版本号）
// 用于前端单独请求用户数据，不触发全局更新
/**
 * @swagger
 * /api/emojis/user-data:
 *   get:
 *     summary: 获取用户个人表情数据
 *     tags: [Emojis]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户表情数据（收藏、最近使用等）
 */
router.get('/user-data',
  AuthMiddleware.authenticate(),
  emojiController.getUserData
);

// 记录表情使用
/**
 * @swagger
 * /api/emojis/usage:
 *   post:
 *     summary: 记录表情使用
 *     tags: [Emojis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emoji_id
 *             properties:
 *               emoji_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: 记录成功
 */
router.post('/usage',
  AuthMiddleware.authenticate(),
  Validator.validateBody(usageSchema),
  emojiController.recordUsage
);

// 获取用户最近使用的表情
/**
 * @swagger
 * /api/emojis/recent:
 *   get:
 *     summary: 获取用户最近使用的表情
 *     tags: [Emojis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: 最近使用列表
 */
router.get('/recent',
  AuthMiddleware.authenticate(),
  emojiController.getRecentEmojis
);

// 获取用户收藏的表情
/**
 * @swagger
 * /api/emojis/favorites:
 *   get:
 *     summary: 获取收藏的表情
 *     tags: [Emojis]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 收藏表情列表
 *   post:
 *     summary: 收藏表情
 *     tags: [Emojis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emoji_id
 *             properties:
 *               emoji_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: 收藏成功
 */
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
/**
 * @swagger
 * /api/emojis/favorites/{emojiId}:
 *   delete:
 *     summary: 取消收藏表情
 *     tags: [Emojis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emojiId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 取消成功
 */
router.delete('/favorites/:emojiId',
  AuthMiddleware.authenticate(),
  emojiController.removeFavorite
);

// 获取用户拥有的表情包
/**
 * @swagger
 * /api/emojis/user/packs:
 *   get:
 *     summary: 获取用户拥有的表情包
 *     tags: [Emojis]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户表情包列表
 *   post:
 *     summary: 添加表情包到用户
 *     tags: [Emojis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pack_id
 *             properties:
 *               pack_id:
 *                 type: string
 *                 format: uuid
 *               source:
 *                 type: string
 *                 enum: [default, download, purchase, gift]
 *     responses:
 *       200:
 *         description: 添加成功
 */
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
/**
 * @swagger
 * /api/emojis/user/packs/{packId}:
 *   delete:
 *     summary: 移除用户表情包
 *     tags: [Emojis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 移除成功
 */
router.delete('/user/packs/:packId',
  AuthMiddleware.authenticate(),
  emojiController.removePack
);

// ==================== 自定义表情API ====================

// 上传自定义表情
/**
 * @swagger
 * /api/emojis/custom:
 *   post:
 *     summary: 上传自定义表情
 *     tags: [Emojis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - url
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [static, animated]
 *               file_size:
 *                 type: integer
 *               width:
 *                 type: integer
 *               height:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 上传成功
 *   get:
 *     summary: 获取用户自定义表情
 *     tags: [Emojis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, rejected]
 *     responses:
 *       200:
 *         description: 自定义表情列表
 */
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
