const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topic.controller');
const { AuthMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

/**
 * @swagger
 * components:
 *   schemas:
 *     Topic:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: 话题ID
 *         name:
 *           type: string
 *           description: 话题名称
 *         description:
 *           type: string
 *           nullable: true
 *           description: 话题描述
 *         cover_image:
 *           type: string
 *           nullable: true
 *           description: 话题封面
 *         is_hot:
 *           type: boolean
 *           description: 是否为热门话题
 *         status:
 *           type: string
 *           description: 话题状态
 *         view_count:
 *           type: integer
 *           description: 浏览次数
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
 *   name: Topics
 *   description: 话题管理API
 */

// 请求体验证模式
const createTopicSchema = Joi.object({
  name: Joi.string().min(1).max(50).required()
    .messages({
      'string.base': '话题名称必须是字符串',
      'string.empty': '话题名称不能为空',
      'string.min': '话题名称长度不能小于{#limit}个字符',
      'string.max': '话题名称长度不能超过{#limit}个字符',
      'any.required': '话题名称是必填项'
    }),
  is_hot: Joi.boolean().optional()
    .messages({
      'boolean.base': '热门状态必须是布尔值'
    })
});

const updateTopicSchema = Joi.object({
  name: Joi.string().min(1).max(50).optional()
    .messages({
      'string.base': '话题名称必须是字符串',
      'string.min': '话题名称长度不能小于{#limit}个字符',
      'string.max': '话题名称长度不能超过{#limit}个字符'
    }),
  is_hot: Joi.boolean().optional()
    .messages({
      'boolean.base': '热门状态必须是布尔值'
    })
}).min(1);

const hotStatusSchema = Joi.object({
  isHot: Joi.boolean().required()
    .messages({
      'boolean.base': '热门状态必须是布尔值',
      'any.required': '热门状态是必填项'
    })
});

const createTopicByUserSchema = Joi.object({
  name: Joi.string().min(2).max(20).required()
    .messages({
      'string.base': '话题名称必须是字符串',
      'string.empty': '话题名称不能为空',
      'string.min': '话题名称至少需要2个字符',
      'string.max': '话题名称不能超过20个字符',
      'any.required': '话题名称是必填项'
    }),
  description: Joi.string().max(100).optional().allow('')
    .messages({
      'string.base': '话题描述必须是字符串',
      'string.max': '话题描述不能超过100个字符'
    }),
  cover_image: Joi.string().optional().allow('')
    .messages({
      'string.base': '封面图片必须是字符串'
    })
});

// 公开路由
/**
 * @swagger
 * /api/topics:
 *   get:
 *     summary: 获取话题列表
 *     tags: [Topics]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码，默认1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 每页数量，默认10
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 过滤状态
 *       - in: query
 *         name: is_hot
 *         schema:
 *           type: boolean
 *         description: 是否仅返回热门话题
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *         description: 排序字段
 *       - in: query
 *         name: orderDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: 分页话题列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Topic'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     total:
 *                       type: integer
 */
router.get('/', topicController.getAllTopics);
/**
 * @swagger
 * /api/topics/hot:
 *   get:
 *     summary: 获取热门话题
 *     tags: [Topics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 返回条数，默认10
 *     responses:
 *       200:
 *         description: 热门话题列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Topic'
 */
router.get('/hot', topicController.getHotTopics);
/**
 * @swagger
 * /api/topics/trending:
 *   get:
 *     summary: 获取趋势话题
 *     tags: [Topics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 返回条数，默认10
 *     responses:
 *       200:
 *         description: 趋势话题
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Topic'
 */
router.get('/trending', topicController.getTrendingTopics);
/**
 * @swagger
 * /api/topics/search:
 *   get:
 *     summary: 搜索话题
 *     tags: [Topics]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 匹配的话题
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Topic'
 */
router.get('/search', topicController.searchTopics);
/**
 * @swagger
 * /api/topics/{id}:
 *   get:
 *     summary: 获取话题详情
 *     tags: [Topics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 话题详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Topic'
 */
router.get('/:id', topicController.getTopicById);
/**
 * @swagger
 * /api/topics/{id}/posts:
 *   get:
 *     summary: 获取话题下帖子
 *     tags: [Topics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: 帖子列表
 */
router.get('/:id/posts', AuthMiddleware.optionalAuthenticate(), topicController.getTopicPosts);
/**
 * @swagger
 * /api/topics/{id}/statistics:
 *   get:
 *     summary: 获取话题统计信息
 *     tags: [Topics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 统计数据
 */
router.get('/:id/statistics', topicController.getTopicStatistics);
/**
 * @swagger
 * /api/topics/{id}/view:
 *   post:
 *     summary: 记录话题浏览量
 *     tags: [Topics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 浏览数据
 */
router.post('/:id/view', topicController.recordTopicView);

// 用户创建话题路由
/**
 * @swagger
 * /api/topics/create:
 *   post:
 *     summary: 用户创建话题
 *     tags: [Topics]
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
 *               description:
 *                 type: string
 *               cover_image:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Topic'
 */
router.post('/create', AuthMiddleware.authenticate(), Validator.validateBody(createTopicByUserSchema), topicController.createTopicByUser);

// 管理员路由
/**
 * @swagger
 * /api/topics:
 *   post:
 *     summary: 管理员创建话题
 *     tags: [Topics]
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
 *               is_hot:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Topic'
 */
router.post('/', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), Validator.validateBody(createTopicSchema), topicController.createTopic);
/**
 * @swagger
 * /api/topics/{id}:
 *   put:
 *     summary: 更新话题
 *     tags: [Topics]
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
 *               is_hot:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 更新后的话题
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Topic'
 */
router.put('/:id', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), Validator.validateBody(updateTopicSchema), topicController.updateTopic);
/**
 * @swagger
 * /api/topics/{id}:
 *   delete:
 *     summary: 删除话题
 *     tags: [Topics]
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
router.delete('/:id', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), topicController.deleteTopic);
/**
 * @swagger
 * /api/topics/{id}/hot:
 *   put:
 *     summary: 设置话题热门状态
 *     tags: [Topics]
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
 *             required:
 *               - isHot
 *             properties:
 *               isHot:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 更新后的状态
 */
router.put('/:id/hot', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), Validator.validateBody(hotStatusSchema), topicController.setHotStatus);

module.exports = router;
