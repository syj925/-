const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const eventRegistrationController = require('../controllers/event-registration.controller');
const { AuthMiddleware, ValidationMiddleware } = require('../middlewares');
const { body, param, query } = require('express-validator');

/**
 * 活动路由
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
router.get('/', 
  paginationValidation,
  ValidationMiddleware.handleValidationErrors,
  eventController.getEvents
);

// 获取推荐活动 (公开)
router.get('/recommended', 
  ValidationMiddleware.handleValidationErrors,
  eventController.getRecommendedEvents
);

// 获取即将开始的活动 (公开)
router.get('/upcoming', 
  ValidationMiddleware.handleValidationErrors,
  eventController.getUpcomingEvents
);

// 获取我创建的活动 (需要登录)
router.get('/my-events',
  AuthMiddleware.authenticate(),
  paginationValidation,
  ValidationMiddleware.handleValidationErrors,
  eventController.getMyEvents
);

// 批量检查报名状态 (需要登录)
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
router.get('/:id/statistics', 
  uuidValidation,
  ValidationMiddleware.handleValidationErrors,
  eventController.getEventStatistics
);

// 报名活动 (需要登录)
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
router.get('/:id/registration-status',
  AuthMiddleware.authenticate(),
  uuidValidation,
  ValidationMiddleware.handleValidationErrors,
  eventController.checkRegistrationStatus
);

// ==================== 活动报名管理路由 ====================

// 获取活动报名列表 (需要登录，活动创建者)
router.get('/:eventId/registrations',
  AuthMiddleware.authenticate(),
  eventIdValidation,
  paginationValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.getEventRegistrations
);

// 获取活动报名统计 (需要登录，活动创建者)
router.get('/:eventId/registration-statistics',
  AuthMiddleware.authenticate(),
  eventIdValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.getEventRegistrationStatistics
);

// 导出活动报名数据 (需要登录，活动创建者)
router.get('/:eventId/registrations/export',
  AuthMiddleware.authenticate(),
  eventIdValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.exportEventRegistrations
);

// 获取报名表单配置 (公开)
router.get('/:eventId/form-config', 
  eventIdValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.getFormConfig
);

module.exports = router;
