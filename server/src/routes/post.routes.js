const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const {
  AuthMiddleware,
  RateLimitMiddleware,
  UploadMiddleware,
  PublishLimitMiddleware
} = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

// 请求体验证模式
// 简化的验证规则（只验证数据类型和必填字段，长度验证由前端处理）
const createPostSchema = Joi.object({
  title: Joi.string().optional().allow(''),
  content: Joi.string().required()
    .messages({
      'any.required': '内容是必填项'
    }),
  category_id: Joi.number().integer().min(1).allow(null).optional()
    .messages({
      'number.base': '分类ID必须是数字',
      'number.min': '分类ID必须大于0'
    }),
  topics: Joi.array().items(Joi.string()).optional(),
  images: Joi.array().items(Joi.object({
    url: Joi.string().required(),
    thumbnail_url: Joi.string().optional(),
    width: Joi.number().integer().optional(),
    height: Joi.number().integer().optional(),
    size: Joi.number().integer().optional()
  })).optional(),
  location: Joi.object({
    name: Joi.string().required(),
    longitude: Joi.number().required(),
    latitude: Joi.number().required()
  }).optional(),
  is_anonymous: Joi.boolean().optional()
});

const updatePostSchema = Joi.object({
  title: Joi.string().optional(),
  content: Joi.string().optional(),
  category_id: Joi.number().integer().optional(),
  topics: Joi.array().items(Joi.string()).optional(),
  images: Joi.array().items(Joi.object({
    url: Joi.string().required(),
    thumbnail_url: Joi.string().optional(),
    width: Joi.number().integer().optional(),
    height: Joi.number().integer().optional(),
    size: Joi.number().integer().optional()
  })).optional(),
  location: Joi.object({
    name: Joi.string().required(),
    longitude: Joi.number().required(),
    latitude: Joi.number().required()
  }).optional()
}).min(1);

const topStatusSchema = Joi.object({
  isTop: Joi.boolean().required()
    .messages({
      'boolean.base': '置顶状态必须是布尔值',
      'any.required': '置顶状态是必填项'
    })
});

// 帖子列表路由（支持可选认证）
router.get('/', AuthMiddleware.optionalAuthenticate(), postController.getPosts);
router.get('/hot', AuthMiddleware.optionalAuthenticate(), postController.getHotPosts);
router.get('/recommended', AuthMiddleware.optionalAuthenticate(), postController.getRecommended);
router.get('/:id', AuthMiddleware.optionalAuthenticate(), postController.getPostDetail);
router.get('/:id/comments', AuthMiddleware.optionalAuthenticate(), postController.getPostComments);
router.get('/:id/comments/stats', AuthMiddleware.optionalAuthenticate(), postController.getPostCommentStats);

// 需要登录的帖子操作路由
router.post('/',
  AuthMiddleware.authenticate(),
  PublishLimitMiddleware.postLimiter(),
  RateLimitMiddleware.postLimiter(),
  Validator.validateBody(createPostSchema),
  postController.createPost
);
router.put('/:id',
  AuthMiddleware.authenticate(),
  Validator.validateBody(updatePostSchema),
  postController.updatePost
);
router.delete('/:id', AuthMiddleware.authenticate(), postController.deletePost);
router.get('/user/favorites', AuthMiddleware.authenticate(), postController.getUserFavorites);
router.get('/user/me', AuthMiddleware.authenticate(), postController.getUserPosts);
router.get('/user/audit-history', AuthMiddleware.authenticate(), postController.getUserAuditHistory);

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