const express = require('express');
const router = express.Router();
const Joi = require('joi');

// 引入管理员相关控制器
const adminAuthController = require('../controllers/admin/auth.controller');
const adminDashboardController = require('../controllers/admin/dashboard.controller');
const adminUserController = require('../controllers/admin/user.controller');
const adminSettingsController = require('../controllers/admin/settings.controller');
const adminEventController = require('../controllers/admin/event.controller');
const adminPostController = require('../controllers/admin/post.controller');
const adminCommentController = require('../controllers/admin/comment.controller');
const adminTopicController = require('../controllers/admin/topic.controller');
const adminMessageController = require('../controllers/admin/message.controller');
const configController = require('../controllers/config.controller');

// 引入分类统计路由
const categoryStatsRoutes = require('./admin/category-stats.routes');
// 引入审核管理路由
const auditRoutes = require('./admin/audit.routes');
// 引入分类管理路由
const categoryRoutes = require('./admin/category.routes');
// 引入徽章管理路由
const badgeRoutes = require('./admin/badge.routes');
// 引入在线统计路由
const onlineStatsRoutes = require('./admin/online-stats.routes');

// 引入中间件
const AdminMiddleware = require('../middlewares/admin.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const { Validator } = require('../utils');

/**
 * @swagger
 * components:
 *   schemas:
 *     Admin:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 管理员ID
 *         username:
 *           type: string
 *           description: 管理员用户名
 *         role:
 *           type: string
 *           description: 管理员角色
 *         token:
 *           type: string
 *           description: 管理员访问令牌
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
 *   name: Admin
 *   description: 管理端接口
 */

// 管理员登录验证规则
const adminLoginSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    'string.empty': '用户名不能为空',
    'string.min': '用户名至少3个字符',
    'string.max': '用户名最多50个字符',
    'any.required': '用户名是必填项'
  }),
  password: Joi.string().min(6).max(30).required().messages({
    'string.empty': '密码不能为空',
    'string.min': '密码至少6个字符',
    'string.max': '密码最多30个字符',
    'any.required': '密码是必填项'
  })
});

// 修改密码验证规则
const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'string.empty': '旧密码不能为空',
    'any.required': '旧密码是必填项'
  }),
  newPassword: Joi.string().min(6).max(30).required().messages({
    'string.empty': '新密码不能为空',
    'string.min': '新密码至少6个字符',
    'string.max': '新密码最多30个字符',
    'any.required': '新密码是必填项'
  })
});

// 管理员更新用户信息验证规则
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

// ==================== 公开路由（无需认证） ====================

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: 管理员登录
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: 登录成功并返回管理员信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Admin'
 */
router.post('/login', 
  AdminMiddleware.formatResponse(),
  AdminMiddleware.logOperation(),
  Validator.validateBody(adminLoginSchema),
  adminAuthController.login
);

// ==================== 需要认证的路由 ====================

// 应用管理员认证中间件
router.use(AdminMiddleware.authenticate());
router.use(AdminMiddleware.formatResponse());
router.use(AdminMiddleware.logOperation());

/**
 * @swagger
 * /api/admin/logout:
 *   post:
 *     summary: 管理员退出登录
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 * /api/admin/profile:
 *   get:
 *     summary: 获取当前管理员信息
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 管理员资料
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Admin'
 * /api/admin/refresh-token:
 *   post:
 *     summary: 刷新管理员令牌
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 返回新的访问令牌
 * /api/admin/change-password:
 *   put:
 *     summary: 修改管理员密码
 *     tags: [Admin]
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
router.post('/logout', adminAuthController.logout);
router.get('/profile', adminAuthController.getCurrentAdmin);
router.post('/refresh-token', adminAuthController.refreshToken);
router.put('/change-password',
  Validator.validateBody(changePasswordSchema),
  adminAuthController.changePassword
);

// ==================== 仪表盘数据路由 ====================

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: 获取仪表盘基础数据
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 仪表盘指标
 * /api/admin/dashboard/trend:
 *   get:
 *     summary: 获取指标趋势数据
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *         description: 统计周期
 *     responses:
 *       200:
 *         description: 趋势数据
 * /api/admin/dashboard/user-distribution:
 *   get:
 *     summary: 获取用户分布数据
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户分布信息
 * /api/admin/dashboard/refresh-cache:
 *   post:
 *     summary: 刷新仪表盘缓存
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 缓存刷新成功
 * /api/admin/dashboard/system-status:
 *   get:
 *     summary: 获取系统状态
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 系统状态
 */
router.get('/dashboard', adminDashboardController.getDashboardData);
router.get('/dashboard/trend', adminDashboardController.getTrendData);
router.get('/dashboard/user-distribution', adminDashboardController.getUserDistribution);
router.post('/dashboard/refresh-cache', adminDashboardController.refreshCache);
router.get('/dashboard/system-status', adminDashboardController.getSystemStatus);

// ==================== 用户管理路由 ====================

/**
 * @swagger
 * /api/admin/users/pending:
 *   get:
 *     summary: 获取待审核用户列表
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 待审核用户数据
 * /api/admin/users/search:
 *   get:
 *     summary: 搜索用户
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 匹配的用户
 * /api/admin/users:
 *   get:
 *     summary: 获取用户列表
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *         name: query
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeBadges
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: 用户列表
 * /api/admin/users/rejection-logs:
 *   get:
 *     summary: 获取用户注册拒绝记录
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *         name: username
 *         schema:
 *           type: string
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 拒绝记录
 * /api/admin/users/{id}:
 *   get:
 *     summary: 获取用户详情
 *     tags: [Admin]
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
 *         description: 用户详情
 *   put:
 *     summary: 更新用户信息
 *     tags: [Admin]
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
 *             description: 用户字段任意组合
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除用户
 *     tags: [Admin]
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
 * /api/admin/users/{id}/audit:
 *   put:
 *     summary: 审核用户
 *     tags: [Admin]
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
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 审核结果
 * /api/admin/users/{id}/disable:
 *   put:
 *     summary: 禁用用户
 *     tags: [Admin]
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
 *         description: 禁用成功
 * /api/admin/users/{id}/enable:
 *   put:
 *     summary: 启用用户
 *     tags: [Admin]
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
 *         description: 启用成功
 * /api/admin/users/{userId}/badges:
 *   get:
 *     summary: 获取指定用户徽章
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 徽章列表
 */
router.get('/users/pending', adminUserController.getPendingUsers);
router.get('/users/search', adminUserController.searchUsers);
router.get('/users', adminUserController.getUserList);
router.get('/users/rejection-logs', adminUserController.getRejectionLogs);
router.get('/users/:id', adminUserController.getUserDetail);
router.put('/users/:id', Validator.validateBody(adminUpdateUserSchema), adminUserController.updateUser);
router.delete('/users/:id', adminUserController.deleteUser);
router.put('/users/:id/audit', adminUserController.auditUser);
router.put('/users/:id/disable', adminUserController.disableUser);
router.put('/users/:id/enable', adminUserController.enableUser);
router.get('/users/:userId/badges', 
  validationMiddleware.validateUUID('userId'),
  adminUserController.getUserBadges
);

// ==================== 帖子管理路由 ====================

/**
 * @swagger
 * /api/admin/posts/pending:
 *   get:
 *     summary: 获取待审核帖子列表
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 待审核帖子
 * /api/admin/posts:
 *   get:
 *     summary: 获取帖子列表
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 帖子列表
 * /api/admin/posts/{id}:
 *   get:
 *     summary: 获取帖子详情
 *     tags: [Admin]
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
 *         description: 帖子详情
 *   put:
 *     summary: 更新帖子
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除帖子
 *     tags: [Admin]
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
 * /api/admin/posts/{id}/audit:
 *   put:
 *     summary: 审核帖子
 *     tags: [Admin]
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
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 审核结果
 * /api/admin/posts/{id}/recommend:
 *   put:
 *     summary: 设置帖子推荐状态
 *     tags: [Admin]
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
 *               isRecommended:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 状态已更新
 * /api/admin/posts/{id}/top:
 *   put:
 *     summary: 设置帖子置顶状态
 *     tags: [Admin]
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
 *               isTop:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 置顶状态更新
 */
router.get('/posts/pending', adminPostController.getPendingPosts);
router.get('/posts', adminPostController.getPostList);
router.get('/posts/:id', adminPostController.getPostDetail);
router.put('/posts/:id', adminPostController.updatePost);
router.delete('/posts/:id', adminPostController.deletePost);
router.put('/posts/:id/audit', adminPostController.auditPost);
router.put('/posts/:id/recommend', adminPostController.setRecommendStatus);
router.put('/posts/:id/top', adminPostController.setTopStatus);

// 推荐算法管理路由
const adminRecommendationController = require('../controllers/admin/recommendation.controller');

/**
 * @swagger
 * /api/admin/recommendation/settings:
 *   get:
 *     summary: 获取推荐算法设置
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 设置数据
 *   put:
 *     summary: 更新推荐算法设置
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 更新成功
 * /api/admin/recommendation/init:
 *   post:
 *     summary: 初始化推荐算法设置
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 初始化完成
 * /api/admin/recommendation/cache:
 *   delete:
 *     summary: 清除推荐缓存
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 缓存已清除
 * /api/admin/recommendation/stats:
 *   get:
 *     summary: 获取推荐统计信息
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 统计数据
 * /api/admin/recommendation/test:
 *   get:
 *     summary: 测试推荐算法
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: strategy
 *         schema:
 *           type: string
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 测试结果
 * /api/admin/recommendation/recalculate:
 *   post:
 *     summary: 触发推荐分数重新计算
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 已触发
 * /api/admin/recommendation/analyze:
 *   post:
 *     summary: 分析帖子得分
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 分析结果
 * /api/admin/recommendation/auto-update/start:
 *   post:
 *     summary: 启动推荐内容自动更新
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 任务已启动
 * /api/admin/recommendation/auto-update/stop:
 *   post:
 *     summary: 停止推荐内容自动更新
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 任务已停止
 * /api/admin/recommendation/auto-update/status:
 *   get:
 *     summary: 获取自动更新状态
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 任务状态
 * /api/admin/recommendation/presets:
 *   get:
 *     summary: 获取推荐预设配置
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 预设列表
 * /api/admin/recommendation/presets/apply:
 *   post:
 *     summary: 应用推荐预设配置
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               presetId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 应用成功
 * /api/admin/recommendation/export:
 *   get:
 *     summary: 导出推荐配置
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 导出结果
 * /api/admin/recommendation/import:
 *   post:
 *     summary: 导入推荐配置
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 导入成功
 */
router.get('/recommendation/settings', (req, res, next) => adminRecommendationController.getRecommendationSettings(req, res, next));
router.put('/recommendation/settings', (req, res, next) => adminRecommendationController.updateRecommendationSettings(req, res, next));
router.post('/recommendation/init', (req, res, next) => adminRecommendationController.initializeRecommendationSettings(req, res, next));
router.delete('/recommendation/cache', (req, res, next) => adminRecommendationController.clearRecommendationCache(req, res, next));
router.get('/recommendation/stats', (req, res, next) => adminRecommendationController.getRecommendationStats(req, res, next));
router.get('/recommendation/test', (req, res, next) => adminRecommendationController.testRecommendationAlgorithm(req, res, next));
router.post('/recommendation/recalculate', (req, res, next) => adminRecommendationController.triggerScoreRecalculation(req, res, next));
router.post('/recommendation/analyze', (req, res, next) => adminRecommendationController.analyzePostScore(req, res, next));
router.post('/recommendation/auto-update/start', (req, res, next) => adminRecommendationController.startAutoUpdate(req, res, next));
router.post('/recommendation/auto-update/stop', (req, res, next) => adminRecommendationController.stopAutoUpdate(req, res, next));
router.get('/recommendation/auto-update/status', (req, res, next) => adminRecommendationController.getAutoUpdateStatus(req, res, next));
router.get('/recommendation/presets', (req, res, next) => adminRecommendationController.getPresetConfigurations(req, res, next));
router.post('/recommendation/presets/apply', (req, res, next) => adminRecommendationController.applyPresetConfiguration(req, res, next));
router.get('/recommendation/export', (req, res, next) => adminRecommendationController.exportCurrentConfiguration(req, res, next));
router.post('/recommendation/import', (req, res, next) => adminRecommendationController.importCustomConfiguration(req, res, next));

// ==================== 评论管理路由 ====================

/**
 * @swagger
 * /api/admin/comments/pending:
 *   get:
 *     summary: 获取待审核评论列表
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 待审核评论
 * /api/admin/comments:
 *   get:
 *     summary: 获取评论列表
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: postId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 评论列表
 * /api/admin/comments/{id}:
 *   get:
 *     summary: 获取评论详情
 *     tags: [Admin]
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
 *         description: 评论详情
 *   put:
 *     summary: 更新评论
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除评论
 *     tags: [Admin]
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
 * /api/admin/comments/{id}/audit:
 *   put:
 *     summary: 审核评论
 *     tags: [Admin]
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
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 审核结果
 */
router.get('/comments/pending', adminCommentController.getPendingComments);
router.get('/comments', adminCommentController.getCommentList);
router.get('/comments/:id', adminCommentController.getCommentDetail);
router.put('/comments/:id', adminCommentController.updateComment);
router.delete('/comments/:id', adminCommentController.deleteComment);
router.put('/comments/:id/audit', adminCommentController.auditComment);

// ==================== 话题管理路由 ====================

/**
 * @swagger
 * /api/admin/topics:
 *   get:
 *     summary: 获取话题列表
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderDirection
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 话题列表
 *   post:
 *     summary: 创建话题
 *     tags: [Admin]
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
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 * /api/admin/topics/{id}:
 *   put:
 *     summary: 更新话题
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除话题
 *     tags: [Admin]
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
 * /api/admin/topics/{id}/hot:
 *   patch:
 *     summary: 设置话题热门状态
 *     tags: [Admin]
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
 *               is_hot:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 状态更新
 * /api/admin/topics/pending-images:
 *   get:
 *     summary: 获取待审核话题图片
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 待审核图片
 * /api/admin/topics/{id}/review-image:
 *   put:
 *     summary: 审核话题图片
 *     tags: [Admin]
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
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *     responses:
 *       200:
 *         description: 审核完成
 */
router.get('/topics', adminTopicController.getTopicList);
router.post('/topics', adminTopicController.createTopic);
router.put('/topics/:id', adminTopicController.updateTopic);
router.delete('/topics/:id', adminTopicController.deleteTopic);
router.patch('/topics/:id/hot', adminTopicController.setHotStatus);
router.get('/topics/pending-images', adminTopicController.getPendingTopicImages);
router.put('/topics/:id/review-image', adminTopicController.reviewTopicImage);

// ==================== 分类统计管理路由 ====================

router.use('/categories', categoryRoutes);

router.use('/category-stats', categoryStatsRoutes);

router.use('/stats/online', onlineStatsRoutes);

router.use('/audit', auditRoutes);

// ==================== 徽章管理路由 ====================

router.use('/badges', badgeRoutes);

// ==================== 系统设置路由 ====================

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: 获取系统设置
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 设置数据
 *   put:
 *     summary: 更新系统设置
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 更新成功
 * /api/admin/settings/init-recommendation:
 *   post:
 *     summary: 初始化推荐算法设置
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 初始化完成
 * /api/admin/settings/init-search:
 *   post:
 *     summary: 初始化搜索设置
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 初始化完成
 */
router.get('/settings', adminSettingsController.getSettings);
router.put('/settings', adminSettingsController.updateSettings);
router.post('/settings/init-recommendation', adminSettingsController.initRecommendSettings);
router.post('/settings/init-search', adminSettingsController.initSearchSettings);

// ==================== 消息管理路由 ====================

/**
 * @swagger
 * /api/admin/messages/system:
 *   get:
 *     summary: 获取系统通知列表
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: searchQuery
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 通知列表
 *   post:
 *     summary: 创建系统通知
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: 创建成功
 * /api/admin/messages/system/stats:
 *   get:
 *     summary: 获取系统通知统计
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 通知统计
 * /api/admin/messages/system/{id}:
 *   get:
 *     summary: 获取通知详情
 *     tags: [Admin]
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
 *         description: 通知详情
 *   delete:
 *     summary: 删除通知
 *     tags: [Admin]
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
 * /api/admin/messages/system/{id}/recipients:
 *   get:
 *     summary: 获取通知接收者
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 接收者列表
 */
router.get('/messages/system', adminMessageController.getSystemMessages);
router.get('/messages/system/stats', adminMessageController.getSystemMessageStats);
router.post('/messages/system', adminMessageController.createSystemMessage);
router.get('/messages/system/:id', adminMessageController.getSystemMessageDetail);
router.delete('/messages/system/:id', adminMessageController.deleteSystemMessage);
router.get('/messages/system/:id/recipients', adminMessageController.getSystemMessageRecipients);

// ==================== 管理员状态检查路由 ====================

/**
 * @swagger
 * /api/admin/status:
 *   get:
 *     summary: 管理员系统状态检查
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 系统状态
 * /api/admin/health:
 *   get:
 *     summary: 管理端健康检查
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 健康信息
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: '管理员系统运行正常',
    data: {
      admin: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '系统健康',
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }
  });
});

// ==================== 活动管理路由 ====================

/**
 * @swagger
 * /api/admin/events:
 *   get:
 *     summary: 获取活动列表
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *         name: title
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: isRecommended
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: organizer
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 活动列表
 *   post:
 *     summary: 创建活动
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: 创建成功
 * /api/admin/events/statistics:
 *   get:
 *     summary: 获取全局活动统计
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 统计数据
 * /api/admin/events/{id}:
 *   get:
 *     summary: 获取活动详情
 *     tags: [Admin]
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
 *         description: 活动详情
 *   put:
 *     summary: 更新活动
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除活动
 *     tags: [Admin]
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
 * /api/admin/events/{id}/registrations:
 *   get:
 *     summary: 获取活动报名列表
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 报名列表
 * /api/admin/events/{eventId}/registrations/{registrationId}/status:
 *   put:
 *     summary: 更新报名状态
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: registrationId
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
 *               status:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 状态已更新
 * /api/admin/events/{eventId}/registrations/batch-status:
 *   put:
 *     summary: 批量更新报名状态
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
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
 *               registrationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 批量处理结果
 * /api/admin/events/{id}/statistics:
 *   get:
 *     summary: 获取活动统计数据
 *     tags: [Admin]
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
 *         description: 活动统计
 * /api/admin/events/{id}/registrations/export:
 *   get:
 *     summary: 导出活动报名数据
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [excel, csv]
 *     responses:
 *       200:
 *         description: 导出结果
 */
router.get('/events', adminEventController.getEventList);
router.get('/events/statistics', adminEventController.getGlobalEventStatistics);
router.get('/events/:id', adminEventController.getEventDetail);
router.post('/events', adminEventController.createEvent);
router.put('/events/:id', adminEventController.updateEvent);
router.delete('/events/:id', adminEventController.deleteEvent);
router.get('/events/:id/registrations', adminEventController.getEventRegistrations);
router.put('/events/:eventId/registrations/:registrationId/status', adminEventController.updateRegistrationStatus);
router.put('/events/:eventId/registrations/batch-status', adminEventController.batchUpdateRegistrationStatus);
router.get('/events/:id/statistics', adminEventController.getEventStatistics);
router.get('/events/:id/registrations/export', adminEventController.exportEventRegistrations);

// ==================== 表情管理路由 ====================
const emojiController = require('../controllers/emoji.controller');

/**
 * @swagger
 * /api/admin/emoji-packs:
 *   get:
 *     summary: 获取表情包列表
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 表情包列表
 *   post:
 *     summary: 创建表情包
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: 创建成功
 * /api/admin/emoji-packs/{packId}:
 *   get:
 *     summary: 获取表情包详情
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 表情包详情
 *   put:
 *     summary: 更新表情包
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除表情包
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 * /api/admin/emojis:
 *   post:
 *     summary: 创建表情
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: 创建成功
 * /api/admin/emojis/{emojiId}:
 *   put:
 *     summary: 更新表情
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emojiId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除表情
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emojiId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 * /api/admin/emojis/pending:
 *   get:
 *     summary: 获取待审核表情
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 待审核表情列表
 * /api/admin/emojis/{customEmojiId}/review:
 *   post:
 *     summary: 审核自定义表情
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customEmojiId
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
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 审核完成
 * /api/admin/emojis/sync-counts:
 *   post:
 *     summary: 同步表情使用计数
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 同步完成
 * /api/admin/emojis/clear-cache:
 *   post:
 *     summary: 清除表情缓存
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 缓存已清除
 */
router.get('/emoji-packs', emojiController.getPacks);
router.get('/emoji-packs/:packId', emojiController.getPackById);
router.post('/emoji-packs', emojiController.createPack);
router.put('/emoji-packs/:packId', emojiController.updatePack);
router.delete('/emoji-packs/:packId', emojiController.deletePack);
router.post('/emojis', emojiController.createEmoji);
router.put('/emojis/:emojiId', emojiController.updateEmoji);
router.delete('/emojis/:emojiId', emojiController.deleteEmoji);
router.get('/emojis/pending', emojiController.getPendingEmojis);
router.post('/emojis/:customEmojiId/review', emojiController.reviewEmoji);
router.post('/emojis/sync-counts', emojiController.syncUseCounts);
router.post('/emojis/clear-cache', emojiController.clearCache);

// ==================== 统计路由 ====================
const statisticsController = require('../controllers/admin/statistics.controller');

/**
 * @swagger
 * /api/admin/statistics:
 *   get:
 *     summary: 获取综合统计数据
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 统计数据
 */
router.get('/statistics', statisticsController.getAllStats);

// ==================== 日志管理路由 ====================
const adminLogController = require('../controllers/admin/log.controller');

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: 获取操作日志列表
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 日志列表
 */
router.get('/logs', adminLogController.getLogs);

// ==================== 错误处理 ====================

// 管理员路由专用错误处理中间件
router.use((error, req, res, next) => {
  // 记录错误日志
  const logger = require('../../config/logger');
  logger.error('Admin route error:', {
    error: error.message,
    stack: error.stack,
    adminId: req.user?.id,
    path: req.path,
    method: req.method,
    timestamp: new Date()
  });

  // 返回管理员格式的错误响应
  const statusCode = error.statusCode || 500;
  const message = error.message || '服务器内部错误';

  res.status(statusCode).json(
    AdminMiddleware.formatAdminResponse({
      success: false,
      message: message
    })
  );
});

// ==================== 配置版本管理 ====================

/**
 * @swagger
 * /api/admin/config-version:
 *   get:
 *     summary: 获取当前配置版本
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 当前版本信息
 *   post:
 *     summary: 发布新配置版本
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: 发布成功
 * /api/admin/config-versions:
 *   get:
 *     summary: 获取配置版本历史
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 版本列表
 * /api/admin/config-rollback:
 *   post:
 *     summary: 回滚到指定配置版本
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               versionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 回滚完成
 */
router.get('/config-version', configController.getAdminConfigVersion);
router.get('/config-versions', configController.getVersionHistory);
router.post('/config-version', configController.publishConfigVersion);
router.post('/config-rollback', configController.rollbackToVersion);

module.exports = router;
