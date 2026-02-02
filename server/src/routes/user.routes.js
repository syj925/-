const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { AuthMiddleware, RateLimitMiddleware, PublishLimitMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

// 请求体验证模式
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required()
    .messages({
      'string.base': '用户名必须是字符串',
      'string.empty': '用户名不能为空',
      'string.min': '用户名长度不能小于{#limit}个字符',
      'string.max': '用户名长度不能超过{#limit}个字符',
      'any.required': '用户名是必填项'
    }),
  password: Joi.string().min(6).max(30).required()
    .messages({
      'string.base': '密码必须是字符串',
      'string.empty': '密码不能为空',
      'string.min': '密码长度不能小于{#limit}个字符',
      'string.max': '密码长度不能超过{#limit}个字符',
      'any.required': '密码是必填项'
    }),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional()
    .messages({
      'string.base': '手机号必须是字符串',
      'string.pattern.base': '手机号格式不正确'
    }),
  email: Joi.string().email().optional()
    .messages({
      'string.base': '邮箱必须是字符串',
      'string.email': '邮箱格式不正确'
    }),
  role: Joi.string().valid('student', 'teacher').default('student')
    .messages({
      'string.base': '角色必须是字符串',
      'any.only': '角色只能是student或teacher'
    }),
  school: Joi.string().optional()
    .messages({
      'string.base': '学校必须是字符串'
    }),
  department: Joi.string().optional()
    .messages({
      'string.base': '院系必须是字符串'
    }),
  gender: Joi.string().valid('male', 'female', 'other').optional()
    .messages({
      'string.base': '性别必须是字符串',
      'any.only': '性别只能是male、female或other'
    }),
  bio: Joi.string().max(500).optional()
    .messages({
      'string.base': '个人简介必须是字符串',
      'string.max': '个人简介长度不能超过{#limit}个字符'
    })
});

const loginSchema = Joi.object({
  username: Joi.string().required()
    .messages({
      'string.base': '用户名必须是字符串',
      'string.empty': '用户名不能为空',
      'any.required': '用户名是必填项'
    }),
  password: Joi.string().required()
    .messages({
      'string.base': '密码必须是字符串',
      'string.empty': '密码不能为空',
      'any.required': '密码是必填项'
    })
});

const updateUserSchema = Joi.object({
  username: Joi.string().min(3).max(50).allow(null, '').optional()
    .messages({
      'string.base': '用户名必须是字符串',
      'string.min': '用户名长度不能小于{#limit}个字符',
      'string.max': '用户名长度不能超过{#limit}个字符'
    }),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).allow(null, '').optional()
    .messages({
      'string.base': '手机号必须是字符串',
      'string.pattern.base': '手机号格式不正确'
    }),
  email: Joi.string().email().allow(null, '').optional()
    .messages({
      'string.base': '邮箱必须是字符串',
      'string.email': '邮箱格式不正确'
    }),
  avatar: Joi.string().allow(null, '').optional()
    .messages({
      'string.base': '头像URL必须是字符串'
    }),
  backgroundImage: Joi.string().allow(null, '').optional()
    .messages({
      'string.base': '背景图片URL必须是字符串'
    }),
  school: Joi.string().allow(null, '').optional()
    .messages({
      'string.base': '学校必须是字符串'
    }),
  department: Joi.string().allow(null, '').optional()
    .messages({
      'string.base': '院系必须是字符串'
    }),
  gender: Joi.string().valid('male', 'female', 'other').allow(null, '').optional()
    .messages({
      'string.base': '性别必须是字符串',
      'any.only': '性别只能是male、female或other'
    }),
  bio: Joi.string().max(500).allow(null, '').optional()
    .messages({
      'string.base': '个人简介必须是字符串',
      'string.max': '个人简介长度不能超过{#limit}个字符'
    }),
  tags: Joi.array().items(Joi.string().max(20)).max(8).optional()
    .messages({
      'array.base': '标签必须是数组格式',
      'string.max': '标签长度不能超过20个字符',
      'array.max': '最多只能添加8个标签'
    })
}).min(1);

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required()
    .messages({
      'string.base': '旧密码必须是字符串',
      'string.empty': '旧密码不能为空',
      'any.required': '旧密码是必填项'
    }),
  newPassword: Joi.string().min(6).max(30).required()
    .messages({
      'string.base': '新密码必须是字符串',
      'string.empty': '新密码不能为空',
      'string.min': '新密码长度不能小于{#limit}个字符',
      'string.max': '新密码长度不能超过{#limit}个字符',
      'any.required': '新密码是必填项'
    })
});

const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).max(30).required()
    .messages({
      'string.base': '新密码必须是字符串',
      'string.empty': '新密码不能为空',
      'string.min': '新密码长度不能小于{#limit}个字符',
      'string.max': '新密码长度不能超过{#limit}个字符',
      'any.required': '新密码是必填项'
    })
});

const phoneCodeSchema = Joi.object({
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required()
    .messages({
      'string.base': '手机号必须是字符串',
      'string.empty': '手机号不能为空',
      'string.pattern.base': '手机号格式不正确',
      'any.required': '手机号是必填项'
    })
});

const verifyCodeSchema = Joi.object({
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required()
    .messages({
      'string.base': '手机号必须是字符串',
      'string.empty': '手机号不能为空',
      'string.pattern.base': '手机号格式不正确',
      'any.required': '手机号是必填项'
    }),
  code: Joi.string().length(6).required()
    .messages({
      'string.base': '验证码必须是字符串',
      'string.empty': '验证码不能为空',
      'string.length': '验证码长度必须为{#limit}位',
      'any.required': '验证码是必填项'
    })
});

// 认证相关路由
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 用户管理API
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: 获取当前用户信息
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *   put:
 *     summary: 更新当前用户信息
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.get('/me', AuthMiddleware.authenticate(), userController.getCurrentUser);
router.put('/me', AuthMiddleware.authenticate(), Validator.validateBody(updateUserSchema), userController.updateUserInfo);

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: 修改密码
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: 密码修改成功
 */
router.post('/change-password', AuthMiddleware.authenticate(), Validator.validateBody(changePasswordSchema), userController.changePassword);

// 搜索用户（支持@功能）
/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: 搜索用户
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 用户列表
 */
router.get('/search', AuthMiddleware.authenticate(), userController.searchUsers);

// 获取用户今日发布统计
router.get('/publish-stats', AuthMiddleware.authenticate(), userController.getPublishStats);

// 用户主页路由（支持可选认证）
/**
 * @swagger
 * /api/users/profile/{id}:
 *   get:
 *     summary: 获取用户主页信息
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 用户主页信息
 */
router.get('/profile/:id', AuthMiddleware.optionalAuthenticate(), userController.getUserProfile);
router.get('/profile/:id/posts', AuthMiddleware.optionalAuthenticate(), userController.getUserProfilePosts);

// 管理员路由
router.get('/', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), userController.getUserList);
router.get('/:id', AuthMiddleware.authenticate(), userController.getUserInfo);
router.put('/disable/:id', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), userController.disableUser);
router.put('/enable/:id', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), userController.enableUser);
router.delete('/:id', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), userController.deleteUser);
router.post('/reset-password/:id', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), Validator.validateBody(resetPasswordSchema), userController.resetPassword);

module.exports = router;