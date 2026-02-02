const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tag.controller');
const { AuthMiddleware, RateLimitMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

/**
 * @swagger
 * components:
 *   schemas:
 *     Tag:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: 标签ID
 *         name:
 *           type: string
 *           description: 标签名称
 *         category:
 *           type: string
 *           enum: [interest, skill, major, grade, other]
 *           description: 标签分类
 *         description:
 *           type: string
 *           nullable: true
 *           description: 标签描述
 *         color:
 *           type: string
 *           description: HEX或RGBA颜色
 *         status:
 *           type: string
 *           enum: [hot, normal, disabled]
 *           description: 标签状态
 *         sort_order:
 *           type: integer
 *           description: 排序值
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   name: Tags
 *   description: 标签管理API
 */

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
/**
 * @swagger
 * /api/tags/hot:
 *   get:
 *     summary: 获取热门标签
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 返回条数，默认10
 *     responses:
 *       200:
 *         description: 热门标签列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tag'
 */
router.get('/hot',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  tagController.getHotTags
);

// 根据分类获取标签
/**
 * @swagger
 * /api/tags/category/{category}:
 *   get:
 *     summary: 根据分类获取标签
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [interest, skill, major, grade, other]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 返回条数，默认50
 *     responses:
 *       200:
 *         description: 标签列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tag'
 */
router.get('/category/:category',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  tagController.getTagsByCategory
);

// 管理员API路由（需要认证）

// 获取标签列表（管理员）
/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: 获取标签列表
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 标签列表
 */
router.get('/',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 200 }),
  tagController.getTagList
);

// 获取单个标签详情
/**
 * @swagger
 * /api/tags/{id}:
 *   get:
 *     summary: 获取标签详情
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 标签详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 */
router.get('/:id',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  tagController.getTagById
);

// 创建标签（需要管理员权限）
/**
 * @swagger
 * /api/tags:
 *   post:
 *     summary: 创建标签
 *     tags: [Tags]
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
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [interest, skill, major, grade, other]
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *               status:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 */
router.post('/',
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin']),
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  Validator.validateBody(createTagSchema),
  tagController.createTag
);

// 更新标签（需要管理员权限）
/**
 * @swagger
 * /api/tags/{id}:
 *   put:
 *     summary: 更新标签
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *               status:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 更新后的标签
 */
router.put('/:id',
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin']),
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  Validator.validateBody(updateTagSchema),
  tagController.updateTag
);

// 删除标签（需要管理员权限）
/**
 * @swagger
 * /api/tags/{id}:
 *   delete:
 *     summary: 删除标签
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:id',
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin']),
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  tagController.deleteTag
);

// 切换标签热门状态（需要管理员权限）
/**
 * @swagger
 * /api/tags/{id}/toggle-hot:
 *   patch:
 *     summary: 切换标签热门状态
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 状态切换成功
 */
router.patch('/:id/toggle-hot',
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin']),
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  tagController.toggleHotStatus
);

// 切换标签状态（启用/禁用）（需要管理员权限）
/**
 * @swagger
 * /api/tags/{id}/toggle-status:
 *   patch:
 *     summary: 切换标签启用状态
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 状态切换成功
 */
router.patch('/:id/toggle-status',
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin']),
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  tagController.toggleStatus
);

// 批量更新标签状态（需要管理员权限）
/**
 * @swagger
 * /api/tags/batch/status:
 *   patch:
 *     summary: 批量更新标签状态
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *               - status
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [hot, normal, disabled]
 *     responses:
 *       200:
 *         description: 批量更新结果
 */
router.patch('/batch/status',
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin']),
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 20 }),
  Validator.validateBody(batchUpdateSchema),
  tagController.batchUpdateStatus
);

// 获取标签统计信息（需要管理员权限）
/**
 * @swagger
 * /api/tags/admin/statistics:
 *   get:
 *     summary: 获取标签统计信息
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 标签统计
 */
router.get('/admin/statistics',
  AuthMiddleware.authenticate(),
  AuthMiddleware.authorize(['admin']),
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  tagController.getTagStatistics
);

// 增加标签使用次数（内部API，一般由其他服务调用）
/**
 * @swagger
 * /api/tags/{id}/increment:
 *   post:
 *     summary: 增加标签使用次数
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               increment:
 *                 type: integer
 *                 description: 增量，默认1
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.post('/:id/increment',
  RateLimitMiddleware.createLimiter({ windowMs: 1 * 60 * 1000, max: 100 }),
  tagController.incrementUseCount
);

module.exports = router;
