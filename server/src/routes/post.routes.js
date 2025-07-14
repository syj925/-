const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { AuthMiddleware, RateLimitMiddleware, UploadMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

// 请求体验证模式
const createPostSchema = Joi.object({
  title: Joi.string().min(2).max(200).optional().allow('')
    .messages({
      'string.base': '标题必须是字符串',
      'string.min': '如果提供标题，长度不能小于{#limit}个字符',
      'string.max': '标题长度不能超过{#limit}个字符'
    }),
  content: Joi.string().min(2).max(10000).required()
    .messages({
      'string.base': '内容必须是字符串',
      'string.empty': '内容不能为空',
      'string.min': '内容长度不能小于{#limit}个字符',
      'string.max': '内容长度不能超过{#limit}个字符',
      'any.required': '内容是必填项'
    }),
  category_id: Joi.number().integer().required()
    .messages({
      'number.base': '分类ID必须是数字',
      'number.integer': '分类ID必须是整数',
      'any.required': '分类ID是必填项'
    }),
  topics: Joi.array().items(Joi.string().min(1).max(20)).optional()
    .messages({
      'array.base': '话题必须是数组',
      'string.base': '话题名称必须是字符串',
      'string.min': '话题名称不能为空',
      'string.max': '话题名称不能超过20个字符'
    }),
  images: Joi.array().items(Joi.object({
    url: Joi.string().required(),
    thumbnail_url: Joi.string().optional(),
    width: Joi.number().integer().optional(),
    height: Joi.number().integer().optional(),
    size: Joi.number().integer().optional()
  })).max(9).optional()
    .messages({
      'array.base': '图片必须是数组',
      'array.max': '最多上传{#limit}张图片'
    }),
  location: Joi.object({
    name: Joi.string().required(),
    longitude: Joi.number().required(),
    latitude: Joi.number().required()
  }).optional()
    .messages({
      'object.base': '位置信息必须是对象'
    }),
  is_anonymous: Joi.boolean().optional()
    .messages({
      'boolean.base': '匿名模式必须是布尔值'
    })
});

const updatePostSchema = Joi.object({
  title: Joi.string().min(2).max(200).optional()
    .messages({
      'string.base': '标题必须是字符串',
      'string.min': '标题长度不能小于{#limit}个字符',
      'string.max': '标题长度不能超过{#limit}个字符'
    }),
  content: Joi.string().min(2).max(10000).optional()
    .messages({
      'string.base': '内容必须是字符串',
      'string.min': '内容长度不能小于{#limit}个字符',
      'string.max': '内容长度不能超过{#limit}个字符'
    }),
  category_id: Joi.number().integer().optional()
    .messages({
      'number.base': '分类ID必须是数字',
      'number.integer': '分类ID必须是整数'
    }),
  topics: Joi.array().items(Joi.string().min(1).max(20)).optional()
    .messages({
      'array.base': '话题必须是数组',
      'string.base': '话题名称必须是字符串',
      'string.min': '话题名称不能为空',
      'string.max': '话题名称不能超过20个字符'
    }),
  images: Joi.array().items(Joi.object({
    url: Joi.string().required(),
    thumbnail_url: Joi.string().optional(),
    width: Joi.number().integer().optional(),
    height: Joi.number().integer().optional(),
    size: Joi.number().integer().optional()
  })).max(9).optional()
    .messages({
      'array.base': '图片必须是数组',
      'array.max': '最多上传{#limit}张图片'
    }),
  location: Joi.object({
    name: Joi.string().required(),
    longitude: Joi.number().required(),
    latitude: Joi.number().required()
  }).optional()
    .messages({
      'object.base': '位置信息必须是对象'
    })
}).min(1);

const topStatusSchema = Joi.object({
  isTop: Joi.boolean().required()
    .messages({
      'boolean.base': '置顶状态必须是布尔值',
      'any.required': '置顶状态是必填项'
    })
});

// 帖子列表路由（公开）
router.get('/', postController.getPosts);
router.get('/hot', postController.getHotPosts);
router.get('/:id', postController.getPostDetail);
router.get('/:id/comments', postController.getPostComments);

// 需要登录的帖子操作路由
router.post('/', AuthMiddleware.authenticate(), RateLimitMiddleware.postLimiter(), Validator.validateBody(createPostSchema), postController.createPost);
router.put('/:id', AuthMiddleware.authenticate(), Validator.validateBody(updatePostSchema), postController.updatePost);
router.delete('/:id', AuthMiddleware.authenticate(), postController.deletePost);
router.get('/user/favorites', AuthMiddleware.authenticate(), postController.getUserFavorites);
router.get('/user/me', AuthMiddleware.authenticate(), postController.getUserPosts);

// 管理员专用路由
router.put('/:id/top', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), Validator.validateBody(topStatusSchema), postController.setTopStatus);

// 上传图片路由
router.post('/upload', AuthMiddleware.authenticate(), UploadMiddleware.uploadPostImages(), (req, res) => {
  res.json({
    code: 0,
    data: req.files.map(file => ({
      url: file.url,
      thumbnail_url: file.url, // 暂时使用原图作为缩略图
      width: 800, // 默认宽度
      height: 600, // 默认高度
      size: file.size
    }))
  });
});

module.exports = router; 