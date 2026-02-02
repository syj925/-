const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { AuthMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: 分类ID
 *         name:
 *           type: string
 *           description: 分类名称
 *         icon:
 *           type: string
 *           nullable: true
 *           description: 分类图标URL
 *         sort:
 *           type: integer
 *           description: 排序值，数字越小越靠前
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 */

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: 分类管理API
 */

// 请求体验证模式
const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(50).required()
    .messages({
      'string.base': '分类名称必须是字符串',
      'string.empty': '分类名称不能为空',
      'string.min': '分类名称长度不能小于{#limit}个字符',
      'string.max': '分类名称长度不能超过{#limit}个字符',
      'any.required': '分类名称是必填项'
    }),
  icon: Joi.string().max(255).optional()
    .messages({
      'string.base': '图标必须是字符串',
      'string.max': '图标长度不能超过{#limit}个字符'
    }),
  sort: Joi.number().integer().min(0).optional()
    .messages({
      'number.base': '排序必须是数字',
      'number.integer': '排序必须是整数',
      'number.min': '排序不能小于{#limit}'
    })
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(1).max(50).optional()
    .messages({
      'string.base': '分类名称必须是字符串',
      'string.min': '分类名称长度不能小于{#limit}个字符',
      'string.max': '分类名称长度不能超过{#limit}个字符'
    }),
  icon: Joi.string().max(255).optional()
    .messages({
      'string.base': '图标必须是字符串',
      'string.max': '图标长度不能超过{#limit}个字符'
    }),
  sort: Joi.number().integer().min(0).optional()
    .messages({
      'number.base': '排序必须是数字',
      'number.integer': '排序必须是整数',
      'number.min': '排序不能小于{#limit}'
    })
}).min(1);

const sortCategorySchema = Joi.object({
  sortData: Joi.array().items(
    Joi.object({
      id: Joi.number().integer().required(),
      sort: Joi.number().integer().min(0).required()
    })
  ).min(1).required()
    .messages({
      'array.base': '排序数据必须是数组',
      'array.min': '排序数据不能为空',
      'any.required': '排序数据是必填项'
    })
});

// 公开路由
/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: 获取分类列表
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: withPostCount
 *         schema:
 *           type: boolean
 *         description: 是否返回带帖子数量的统计数据
 *     responses:
 *       200:
 *         description: 分类列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get('/', categoryController.getAllCategories);
/**
 * @swagger
 * /api/categories/search:
 *   get:
 *     summary: 搜索分类
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 分类关键词
 *     responses:
 *       200:
 *         description: 匹配的分类列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get('/search', categoryController.searchCategories);
/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: 获取分类详情
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 分类ID
 *     responses:
 *       200:
 *         description: 分类详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */
router.get('/:id', categoryController.getCategoryById);

// 管理员路由
/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: 创建分类
 *     tags: [Categories]
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
 *               icon:
 *                 type: string
 *               sort:
 *                 type: integer
 *                 description: 排序值
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */
router.post('/', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), Validator.validateBody(createCategorySchema), categoryController.createCategory);
/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: 更新分类
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *               sort:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 更新后的分类
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */
router.put('/:id', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), Validator.validateBody(updateCategorySchema), categoryController.updateCategory);
/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: 删除分类
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:id', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), categoryController.deleteCategory);
/**
 * @swagger
 * /api/categories/sort:
 *   post:
 *     summary: 批量更新分类排序
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sortData
 *             properties:
 *               sortData:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - sort
 *                   properties:
 *                     id:
 *                       type: integer
 *                     sort:
 *                       type: integer
 *     responses:
 *       200:
 *         description: 排序更新结果
 */
router.post('/sort', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), Validator.validateBody(sortCategorySchema), categoryController.updateCategorySort);

module.exports = router;
