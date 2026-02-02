const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const eventRegistrationController = require('../controllers/event-registration.controller');
const { AuthMiddleware, ValidationMiddleware } = require('../middlewares');
const { body, param, query } = require('express-validator');

/**
 * 活动路由
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - title
 *         - start_time
 *         - end_time
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 活动ID
 *         title:
 *           type: string
 *           description: 活动标题
 *         description:
 *           type: string
 *           description: 活动描述
 *         cover_image:
 *           type: string
 *           description: 活动封面图片URL
 *         detail_images:
 *           type: array
 *           items:
 *             type: string
 *           description: 活动详情图片列表
 *         organizer_id:
 *           type: string
 *           format: uuid
 *           description: 组织者ID
 *         start_time:
 *           type: string
 *           format: date-time
 *           description: 活动开始时间
 *         end_time:
 *           type: string
 *           format: date-time
 *           description: 活动结束时间
 *         location:
 *           type: string
 *           description: 活动地点
 *         max_participants:
 *           type: integer
 *           description: 最大参与人数
 *         current_participants:
 *           type: integer
 *           description: 当前参与人数
 *         registration_deadline:
 *           type: string
 *           format: date-time
 *           description: 报名截止时间
 *         form_config:
 *           type: array
 *           items:
 *             type: object
 *           description: 报名表单配置
 *         notices:
 *           type: array
 *           items:
 *             type: string
 *           description: 活动须知
 *         status:
 *           type: integer
 *           enum: [0, 1, 2, 3]
 *           description: 活动状态
 *         is_recommended:
 *           type: boolean
 *           description: 是否为推荐活动
 *         allow_cancel_registration:
 *           type: boolean
 *           description: 是否允许取消报名
 *         view_count:
 *           type: integer
 *           description: 浏览次数
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: 活动管理API
 */

// 活动创建验证规则
const createEventValidation = [
  body('title')
    .notEmpty()
    .withMessage('活动标题不能为空')
    .isLength({ max: 100 })
    .withMessage('活动标题不能超过100个字符'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('活动描述不能超过2000个字符'),
  body('start_time')
    .notEmpty()
    .withMessage('活动开始时间不能为空')
    .isISO8601()
    .withMessage('活动开始时间格式错误'),
  body('end_time')
    .notEmpty()
    .withMessage('活动结束时间不能为空')
    .isISO8601()
    .withMessage('活动结束时间格式错误'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('活动地点不能超过200个字符'),
  body('max_participants')
    .optional()
    .isInt({ min: 1 })
    .withMessage('最大参与人数必须是正整数'),
  body('registration_deadline')
    .optional()
    .isISO8601()
    .withMessage('报名截止时间格式错误'),
  body('form_config')
    .optional()
    .isArray()
    .withMessage('报名表单配置必须是数组'),
  body('notices')
    .optional()
    .isArray()
    .withMessage('活动须知必须是数组'),
  body('allow_cancel_registration')
    .optional()
    .isBoolean()
    .withMessage('是否允许取消报名必须是布尔值')
];

// 活动更新验证规则
const updateEventValidation = [
  body('title')
    .optional()
    .notEmpty()
    .withMessage('活动标题不能为空')
    .isLength({ max: 100 })
    .withMessage('活动标题不能超过100个字符'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('活动描述不能超过2000个字符'),
  body('start_time')
    .optional()
    .isISO8601()
    .withMessage('活动开始时间格式错误'),
  body('end_time')
    .optional()
    .isISO8601()
    .withMessage('活动结束时间格式错误'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('活动地点不能超过200个字符'),
  body('max_participants')
    .optional()
    .isInt({ min: 1 })
    .withMessage('最大参与人数必须是正整数'),
  body('registration_deadline')
    .optional()
    .isISO8601()
    .withMessage('报名截止时间格式错误'),
  body('status')
    .optional()
    .isIn([0, 1, 2, 3])
    .withMessage('活动状态值无效'),
  body('is_recommended')
    .optional()
    .isBoolean()
    .withMessage('是否推荐必须是布尔值'),
  body('allow_cancel_registration')
    .optional()
    .isBoolean()
    .withMessage('是否允许取消报名必须是布尔值')
];

// 报名验证规则
const registerEventValidation = [
  body('form_data')
    .optional()
    .isObject()
    .withMessage('报名表单数据必须是对象')
];

// UUID参数验证
const uuidValidation = [
  param('id').isUUID().withMessage('活动ID格式错误')
];

const eventIdValidation = [
  param('eventId').isUUID().withMessage('活动ID格式错误')
];

const registrationIdValidation = [
  param('id').isUUID().withMessage('报名记录ID格式错误')
];

// 分页查询验证
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数')
];

// ==================== 活动相关路由 ====================

// 获取活动列表 (公开)
/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: 获取活动列表
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 活动分页数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 pagination:
 *                   type: object
 *   post:
 *     summary: 创建活动
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: 活动创建成功
 */
router.get('/', 
  paginationValidation,
  ValidationMiddleware.handleValidationErrors,
  eventController.getEvents
);

// 获取推荐活动 (公开)
/**
 * @swagger
 * /api/events/recommended:
 *   get:
 *     summary: 获取推荐活动
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: 推荐活动列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
router.get('/recommended', 
  ValidationMiddleware.handleValidationErrors,
  eventController.getRecommendedEvents
);

// 获取即将开始的活动 (公开)
/**
 * @swagger
 * /api/events/upcoming:
 *   get:
 *     summary: 获取即将开始的活动
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: 即将开始的活动列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
router.get('/upcoming', 
  ValidationMiddleware.handleValidationErrors,
  eventController.getUpcomingEvents
);

// 获取我创建的活动 (需要登录)
/**
 * @swagger
 * /api/events/my-events:
 *   get:
 *     summary: 获取我创建的活动
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: 我的活动分页数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 pagination:
 *                   type: object
 */
router.get('/my-events',
  AuthMiddleware.authenticate(),
  paginationValidation,
  ValidationMiddleware.handleValidationErrors,
  eventController.getMyEvents
);

// 批量检查报名状态 (需要登录)
/**
 * @swagger
 * /api/events/batch-registration-status:
 *   post:
 *     summary: 批量检查报名状态
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event_ids
 *             properties:
 *               event_ids:
 *                 type: array
 *                 description: 活动ID列表
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: 返回每个活动的报名状态
 */
router.post('/batch-registration-status',
  AuthMiddleware.authenticate(),
  body('event_ids').isArray().withMessage('活动ID列表必须是数组'),
  ValidationMiddleware.handleValidationErrors,
  eventController.batchCheckRegistrationStatus
);

// 创建活动 (需要登录)
router.post('/',
  AuthMiddleware.authenticate(),
  createEventValidation,
  ValidationMiddleware.handleValidationErrors,
  eventController.createEvent
);

// 获取活动详情 (公开，但登录用户会获取更多信息)
/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: 获取活动详情
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 活动详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *   put:
 *     summary: 更新活动
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: 活动更新成功
 *   delete:
 *     summary: 删除活动
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 活动删除成功
 */
router.get('/:id',
  AuthMiddleware.optionalAuthenticate(),
  eventController.getEventById
);

// 更新活动 (需要登录，只有创建者可以更新)
router.put('/:id',
  AuthMiddleware.authenticate(),
  uuidValidation,
  updateEventValidation,
  ValidationMiddleware.handleValidationErrors,
  eventController.updateEvent
);

// 删除活动 (需要登录，只有创建者可以删除)
router.delete('/:id',
  AuthMiddleware.authenticate(),
  uuidValidation,
  ValidationMiddleware.handleValidationErrors,
  eventController.deleteEvent
);

// 获取活动统计信息 (公开)
/**
 * @swagger
 * /api/events/{id}/statistics:
 *   get:
 *     summary: 获取活动统计信息
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 活动统计数据
 */
router.get('/:id/statistics', 
  uuidValidation,
  ValidationMiddleware.handleValidationErrors,
  eventController.getEventStatistics
);

// 报名活动 (需要登录)
/**
 * @swagger
 * /api/events/{id}/register:
 *   post:
 *     summary: 报名活动
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               form_data:
 *                 type: object
 *                 description: 报名表单数据
 *     responses:
 *       200:
 *         description: 报名成功
 *   delete:
 *     summary: 取消报名
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 取消原因
 *     responses:
 *       200:
 *         description: 取消报名成功
 */
router.post('/:id/register',
  AuthMiddleware.authenticate(),
  uuidValidation,
  registerEventValidation,
  ValidationMiddleware.handleValidationErrors,
  eventController.registerEvent
);

// 取消报名 (需要登录)
router.delete('/:id/register',
  AuthMiddleware.authenticate(),
  uuidValidation,
  body('reason').optional().isString().withMessage('取消原因必须是字符串'),
  ValidationMiddleware.handleValidationErrors,
  eventController.cancelRegistration
);

// 检查报名状态 (需要登录)
/**
 * @swagger
 * /api/events/{id}/registration-status:
 *   get:
 *     summary: 检查当前用户的报名状态
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 报名状态
 */
router.get('/:id/registration-status',
  AuthMiddleware.authenticate(),
  uuidValidation,
  ValidationMiddleware.handleValidationErrors,
  eventController.checkRegistrationStatus
);

// ==================== 活动报名管理路由 ====================

// 获取活动报名列表 (需要登录，活动创建者)
/**
 * @swagger
 * /api/events/{eventId}/registrations:
 *   get:
 *     summary: 获取活动报名列表
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: 报名列表
 */
router.get('/:eventId/registrations',
  AuthMiddleware.authenticate(),
  eventIdValidation,
  paginationValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.getEventRegistrations
);

// 获取活动报名统计 (需要登录，活动创建者)
/**
 * @swagger
 * /api/events/{eventId}/registration-statistics:
 *   get:
 *     summary: 获取活动报名统计
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 报名统计数据
 */
router.get('/:eventId/registration-statistics',
  AuthMiddleware.authenticate(),
  eventIdValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.getEventRegistrationStatistics
);

// 导出活动报名数据 (需要登录，活动创建者)
/**
 * @swagger
 * /api/events/{eventId}/registrations/export:
 *   get:
 *     summary: 导出活动报名数据
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 导出文件或数据流
 */
router.get('/:eventId/registrations/export',
  AuthMiddleware.authenticate(),
  eventIdValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.exportEventRegistrations
);

// 获取报名表单配置 (公开)
/**
 * @swagger
 * /api/events/{eventId}/form-config:
 *   get:
 *     summary: 获取活动报名表单配置
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 报名表单配置
 */
router.get('/:eventId/form-config', 
  eventIdValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.getFormConfig
);

module.exports = router;
