const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tag.controller');
const { AuthMiddleware, RateLimitMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

// 标签创建验证规则
const createTagSchema = Joi.object({
  name: Joi.string().min(1).max(50).required().messages({
    'string.empty': '标签名称不能为空',
    'string.min': '标签名称至少1个字符',
    'string.max': '标签名称最多50个字符',
    'any.required': '标签名称是必填项'
  }),
  category: Joi.string().valid('interest', 'skill', 'major', 'grade', 'other').default('interest'),
  description: Joi.string().max(500).allow('').optional(),
  color: Joi.string()
    .pattern(/^(#[0-9A-Fa-f]{6}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[01](\.\d+)?)?\s*\))$/)
    .default('#409EFF')
    .messages({
      'string.pattern.base': '颜色格式无效，支持HEX格式(#FF0000)或RGBA格式(rgba(255,0,0,1))'
    }),
  status: Joi.string().valid('hot', 'normal', 'disabled').default('normal'),
  sortOrder: Joi.number().integer().min(0).default(0)
});

// 标签更新验证规则
const updateTagSchema = Joi.object({
  name: Joi.string().min(1).max(50).optional(),
  category: Joi.string().valid('interest', 'skill', 'major', 'grade', 'other').optional(),
  description: Joi.string().max(500).allow('').optional(),
  color: Joi.string()
    .pattern(/^(#[0-9A-Fa-f]{6}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[01](\.\d+)?)?\s*\))$/)
    .optional()
    .messages({
      'string.pattern.base': '颜色格式无效，支持HEX格式(#FF0000)或RGBA格式(rgba(255,0,0,1))'
    }),
  status: Joi.string().valid('hot', 'normal', 'disabled').optional(),
  sortOrder: Joi.number().integer().min(0).optional()
});

// 批量更新状态验证规则
const batchUpdateSchema = Joi.object({
  ids: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.min': '请至少选择一个标签',
    'any.required': '标签ID列表是必填项'
  }),
  status: Joi.string().valid('hot', 'normal', 'disabled').required().messages({
    'any.required': '状态是必填项',
    'any.only': '状态值无效'
  })
});

// 公开API路由（无需认证）

// 获取热门标签
router.get('/hot',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  tagController.getHotTags
);

// 根据分类获取标签
router.get('/category/:category',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  tagController.getTagsByCategory
);

// 管理员API路由（需要认证）

// 获取标签列表（管理员）
router.get('/',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 200 }),
  tagController.getTagList
);

// 获取单个标签详情
router.get('/:id',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  tagController.getTagById
);

// 创建标签（需要管理员权限）
router.post('/',
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin']),
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  Validator.validateBody(createTagSchema),
  tagController.createTag
);

// 更新标签（需要管理员权限）
router.put('/:id',
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin']),
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  Validator.validateBody(updateTagSchema),
  tagController.updateTag
);

// 删除标签（需要管理员权限）
router.delete('/:id',
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin']),
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  tagController.deleteTag
);

// 切换标签热门状态（需要管理员权限）
router.patch('/:id/toggle-hot',
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin']),
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  tagController.toggleHotStatus
);

// 切换标签状态（启用/禁用）（需要管理员权限）
router.patch('/:id/toggle-status',
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin']),
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  tagController.toggleStatus
);

// 批量更新标签状态（需要管理员权限）
router.patch('/batch/status',
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin']),
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 20 }),
  Validator.validateBody(batchUpdateSchema),
  tagController.batchUpdateStatus
);

// 获取标签统计信息（需要管理员权限）
router.get('/admin/statistics',
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin']),
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  tagController.getTagStatistics
);

// 增加标签使用次数（内部API，一般由其他服务调用）
router.post('/:id/increment',
  RateLimitMiddleware.createLimiter({ windowMs: 1 * 60 * 1000, max: 100 }),
  tagController.incrementUseCount
);

module.exports = router;
