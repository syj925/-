const express = require('express');
const router = express.Router();
const eventRegistrationController = require('../controllers/event-registration.controller');
const { AuthMiddleware, ValidationMiddleware } = require('../middlewares');
const { body, param, query } = require('express-validator');

/**
 * 活动报名路由
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EventRegistration:
 *       type: object
 *       required:
 *         - event_id
 *         - user_id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 报名记录ID
 *         event_id:
 *           type: string
 *           format: uuid
 *           description: 活动ID
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: 用户ID
 *         form_data:
 *           type: object
 *           description: 报名表单内容
 *         status:
 *           type: integer
 *           enum: [0, 1, 2]
 *           description: 报名状态
 *         registered_at:
 *           type: string
 *           format: date-time
 *           description: 报名时间
 *         canceled_at:
 *           type: string
 *           format: date-time
 *           description: 取消报名时间
 *         cancel_reason:
 *           type: string
 *           description: 取消报名原因
 *         check_in_time:
 *           type: string
 *           format: date-time
 *           description: 签到时间
 *         notes:
 *           type: string
 *           description: 备注信息
 */

/**
 * @swagger
 * tags:
 *   name: EventRegistrations
 *   description: 活动报名管理API
 */

// UUID参数验证
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
    .withMessage('每页数量必须是1-100之间的整数'),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数')
];

// 批量操作验证
const batchOperationValidation = [
  body('registration_ids')
    .isArray({ min: 1 })
    .withMessage('报名记录ID列表不能为空')
    .custom((value) => {
      if (!value.every(id => typeof id === 'string' && id.length > 0)) {
        throw new Error('报名记录ID格式错误');
      }
      return true;
    })
];

// 状态更新验证
const statusUpdateValidation = [
  body('status')
    .isIn([0, 1, 2])
    .withMessage('状态值必须是0(已取消)、1(已报名)或2(已参加)')
];

// 报名信息更新验证
const updateRegistrationValidation = [
  body('form_data')
    .optional()
    .isObject()
    .withMessage('报名表单数据必须是对象'),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('备注信息不能超过500个字符')
];

// ==================== 报名记录管理路由 ====================

// 获取我的报名列表 (需要登录)
/**
 * @swagger
 * /api/registrations/my-registrations:
 *   get:
 *     summary: 获取我的报名列表
 *     tags: [EventRegistrations]
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
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: 可选的分页大小参数
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ['0', '1', '2']
 *         description: 报名状态筛选
 *     responses:
 *       200:
 *         description: 报名记录分页数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EventRegistration'
 *                 pagination:
 *                   type: object
 */
router.get('/my-registrations',
  AuthMiddleware.authenticate(),
  paginationValidation,
  query('status')
    .optional()
    .custom((value) => {
      // 允许空字符串或有效的状态值
      if (value === '' || value === undefined || value === null) {
        return true;
      }
      return ['0', '1', '2'].includes(value);
    })
    .withMessage('状态筛选值无效'),
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.getMyRegistrations
);

// 获取我的报名统计 (需要登录)
/**
 * @swagger
 * /api/registrations/my-statistics:
 *   get:
 *     summary: 获取我的报名统计
 *     tags: [EventRegistrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 报名统计信息
 */
router.get('/my-statistics',
  AuthMiddleware.authenticate(),
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.getMyRegistrationStatistics
);

// 批量更新报名状态 (需要登录，管理员或活动创建者)
/**
 * @swagger
 * /api/registrations/batch-status:
 *   put:
 *     summary: 批量更新报名状态
 *     tags: [EventRegistrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registration_ids
 *               - status
 *             properties:
 *               registration_ids:
 *                 type: array
 *                 description: 报名记录ID列表
 *                 items:
 *                   type: string
 *                   format: uuid
 *               status:
 *                 type: integer
 *                 enum: [0, 1, 2]
 *                 description: 新的报名状态
 *     responses:
 *       200:
 *         description: 状态更新结果
 */
router.put('/batch-status',
  AuthMiddleware.authenticate(),
  batchOperationValidation,
  statusUpdateValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.batchUpdateStatus
);

// 批量签到 (需要登录，管理员或活动创建者)
/**
 * @swagger
 * /api/registrations/batch-check-in:
 *   post:
 *     summary: 批量签到
 *     tags: [EventRegistrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registration_ids
 *             properties:
 *               registration_ids:
 *                 type: array
 *                 description: 报名记录ID列表
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: 批量签到结果
 */
router.post('/batch-check-in',
  AuthMiddleware.authenticate(),
  batchOperationValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.batchCheckIn
);

// 获取报名详情 (需要登录)
/**
 * @swagger
 * /api/registrations/{id}:
 *   get:
 *     summary: 获取报名详情
 *     tags: [EventRegistrations]
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
 *         description: 报名详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventRegistration'
 *   put:
 *     summary: 更新报名信息
 *     tags: [EventRegistrations]
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
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: 报名信息更新成功
 */
router.get('/:id',
  AuthMiddleware.authenticate(),
  registrationIdValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.getRegistrationById
);

// 更新报名信息 (需要登录，只有报名用户本人可以更新)
router.put('/:id',
  AuthMiddleware.authenticate(),
  registrationIdValidation,
  updateRegistrationValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.updateRegistration
);

// 签到 (需要登录，管理员或活动创建者)
/**
 * @swagger
 * /api/registrations/{id}/check-in:
 *   post:
 *     summary: 报名签到
 *     tags: [EventRegistrations]
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
 *         description: 签到成功
 */
router.post('/:id/check-in',
  AuthMiddleware.authenticate(),
  registrationIdValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.checkIn
);

module.exports = router;
