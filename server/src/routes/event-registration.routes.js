const express = require('express');
const router = express.Router();
const eventRegistrationController = require('../controllers/event-registration.controller');
const { AuthMiddleware, ValidationMiddleware } = require('../middlewares');
const { body, param, query } = require('express-validator');

/**
 * 活动报名路由
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
router.get('/my-registrations', 
  AuthMiddleware.authenticate,
  paginationValidation,
  query('status')
    .optional()
    .isIn(['0', '1', '2'])
    .withMessage('状态筛选值无效'),
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.getMyRegistrations
);

// 获取我的报名统计 (需要登录)
router.get('/my-statistics', 
  AuthMiddleware.authenticate,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.getMyRegistrationStatistics
);

// 批量更新报名状态 (需要登录，管理员或活动创建者)
router.put('/batch-status', 
  AuthMiddleware.authenticate,
  batchOperationValidation,
  statusUpdateValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.batchUpdateStatus
);

// 批量签到 (需要登录，管理员或活动创建者)
router.post('/batch-check-in', 
  AuthMiddleware.authenticate,
  batchOperationValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.batchCheckIn
);

// 获取报名详情 (需要登录)
router.get('/:id', 
  AuthMiddleware.authenticate,
  registrationIdValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.getRegistrationById
);

// 更新报名信息 (需要登录，只有报名用户本人可以更新)
router.put('/:id', 
  AuthMiddleware.authenticate,
  registrationIdValidation,
  updateRegistrationValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.updateRegistration
);

// 签到 (需要登录，管理员或活动创建者)
router.post('/:id/check-in', 
  AuthMiddleware.authenticate,
  registrationIdValidation,
  ValidationMiddleware.handleValidationErrors,
  eventRegistrationController.checkIn
);

module.exports = router;
