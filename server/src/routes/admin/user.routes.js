const express = require('express');
const Joi = require('joi');

const adminUserController = require('../../controllers/admin/user.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const { Validator } = require('../../utils');

const router = express.Router();

const adminUpdateUserSchema = Joi.object({
  nickname: Joi.string().min(1).max(50).allow(null, '').optional().messages({
    'string.empty': '昵称不能为空',
    'string.min': '昵称至少1个字符',
    'string.max': '昵称最多50个字符'
  }),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).allow(null, '').optional().messages({
    'string.pattern.base': '手机号格式不正确'
  }),
  email: Joi.string().email().allow(null, '').optional().messages({
    'string.email': '邮箱格式不正确'
  }),
  gender: Joi.string().valid('male', 'female', 'other').allow(null, '').optional().messages({
    'any.only': '性别只能是male、female或other'
  }),
  school: Joi.string().max(100).allow(null, '').optional().messages({
    'string.max': '学校名称最多100个字符'
  }),
  department: Joi.string().max(100).allow(null, '').optional().messages({
    'string.max': '院系名称最多100个字符'
  }),
  bio: Joi.string().max(500).allow(null, '').optional().messages({
    'string.max': '个人简介最多500个字符'
  }),
  password: Joi.string().min(6).max(30).allow(null, '').optional().messages({
    'string.min': '密码至少6个字符',
    'string.max': '密码最多30个字符'
  }),
  role: Joi.string().valid('student', 'teacher', 'admin').optional().messages({
    'any.only': '角色只能是student、teacher或admin'
  }),
  is_disabled: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().max(20)).max(8).optional().messages({
    'array.base': '标签必须是数组格式',
    'string.max': '标签长度不能超过20个字符',
    'array.max': '最多只能添加8个标签'
  }),
  settings: Joi.object({
    privacy: Joi.object({
      anonymousMode: Joi.boolean().optional(),
      allowSearch: Joi.boolean().optional(),
      showLocation: Joi.boolean().optional(),
      allowFollow: Joi.boolean().optional(),
      allowComment: Joi.boolean().optional(),
      allowMessage: Joi.boolean().optional(),
      favoriteVisible: Joi.boolean().optional(),
      followListVisible: Joi.boolean().optional(),
      fansListVisible: Joi.boolean().optional()
    }).optional()
  }).optional().messages({
    'object.base': '用户设置必须是对象格式'
  })
}).min(1).messages({
  'object.min': '至少需要提供一个要更新的字段'
});

router.get('/pending', adminUserController.getPendingUsers);
router.get('/search', adminUserController.searchUsers);
router.get('/', adminUserController.getUserList);
router.get('/rejection-logs', adminUserController.getRejectionLogs);
router.get('/:id', adminUserController.getUserDetail);
router.put('/:id', Validator.validateBody(adminUpdateUserSchema), adminUserController.updateUser);
router.delete('/:id', adminUserController.deleteUser);
router.put('/:id/audit', adminUserController.auditUser);
router.put('/:id/disable', adminUserController.disableUser);
router.put('/:id/enable', adminUserController.enableUser);
router.get(
  '/:userId/badges',
  validationMiddleware.validateUUID('userId'),
  adminUserController.getUserBadges
);

module.exports = router;
