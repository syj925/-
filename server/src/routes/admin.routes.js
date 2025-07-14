const express = require('express');
const router = express.Router();
const Joi = require('joi');

// 引入管理员相关控制器
const adminAuthController = require('../controllers/admin/auth.controller');
const adminDashboardController = require('../controllers/admin/dashboard.controller');
const adminUserController = require('../controllers/admin/user.controller');
const adminSettingsController = require('../controllers/admin/settings.controller');

// 引入中间件
const AdminMiddleware = require('../middlewares/admin.middleware');
const { Validator } = require('../utils');

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
  nickname: Joi.string().min(1).max(50).optional().messages({
    'string.empty': '昵称不能为空',
    'string.min': '昵称至少1个字符',
    'string.max': '昵称最多50个字符'
  }),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional().messages({
    'string.pattern.base': '手机号格式不正确'
  }),
  email: Joi.string().email().optional().messages({
    'string.email': '邮箱格式不正确'
  }),
  gender: Joi.string().valid('male', 'female', 'other').optional().messages({
    'any.only': '性别只能是male、female或other'
  }),
  school: Joi.string().max(100).optional().messages({
    'string.max': '学校名称最多100个字符'
  }),
  department: Joi.string().max(100).optional().messages({
    'string.max': '院系名称最多100个字符'
  }),
  bio: Joi.string().max(500).optional().messages({
    'string.max': '个人简介最多500个字符'
  }),
  password: Joi.string().min(6).max(30).optional().messages({
    'string.min': '密码至少6个字符',
    'string.max': '密码最多30个字符'
  }),
  role: Joi.string().valid('student', 'teacher', 'admin').optional().messages({
    'any.only': '角色只能是student、teacher或admin'
  }),
  is_disabled: Joi.boolean().optional()
}).min(1).messages({
  'object.min': '至少需要提供一个要更新的字段'
});

// ==================== 公开路由（无需认证） ====================

/**
 * @route POST /api/admin/login
 * @desc 管理员登录
 * @access Public
 */
router.post('/login', 
  AdminMiddleware.formatResponse(),
  Validator.validateBody(adminLoginSchema),
  adminAuthController.login
);

// ==================== 需要认证的路由 ====================

// 应用管理员认证中间件
router.use(AdminMiddleware.authenticate());
router.use(AdminMiddleware.formatResponse());
router.use(AdminMiddleware.logOperation());

/**
 * @route POST /api/admin/logout
 * @desc 管理员登出
 * @access Private (Admin)
 */
router.post('/logout', adminAuthController.logout);

/**
 * @route GET /api/admin/profile
 * @desc 获取当前管理员信息
 * @access Private (Admin)
 */
router.get('/profile', adminAuthController.getCurrentAdmin);

/**
 * @route POST /api/admin/refresh-token
 * @desc 刷新管理员token
 * @access Private (Admin)
 */
router.post('/refresh-token', adminAuthController.refreshToken);

/**
 * @route PUT /api/admin/change-password
 * @desc 修改管理员密码
 * @access Private (Admin)
 */
router.put('/change-password',
  Validator.validateBody(changePasswordSchema),
  adminAuthController.changePassword
);

// ==================== 仪表盘数据路由 ====================

/**
 * @route GET /api/admin/dashboard
 * @desc 获取仪表盘基础数据
 * @access Private (Admin)
 */
router.get('/dashboard', adminDashboardController.getDashboardData);

/**
 * @route GET /api/admin/dashboard/trend
 * @desc 获取趋势数据
 * @query {string} period - 时间周期 (day/week/month)
 * @access Private (Admin)
 */
router.get('/dashboard/trend', adminDashboardController.getTrendData);

/**
 * @route GET /api/admin/dashboard/user-distribution
 * @desc 获取用户分布数据
 * @access Private (Admin)
 */
router.get('/dashboard/user-distribution', adminDashboardController.getUserDistribution);

/**
 * @route POST /api/admin/dashboard/refresh-cache
 * @desc 刷新仪表盘缓存
 * @access Private (Admin)
 */
router.post('/dashboard/refresh-cache', adminDashboardController.refreshCache);

/**
 * @route GET /api/admin/dashboard/system-status
 * @desc 获取系统状态信息
 * @access Private (Admin)
 */
router.get('/dashboard/system-status', adminDashboardController.getSystemStatus);

// ==================== 用户管理路由 ====================

/**
 * @route GET /api/admin/users/pending
 * @desc 获取待审核用户列表
 * @query {number} page - 页码
 * @query {number} limit - 每页数量
 * @access Private (Admin)
 */
router.get('/users/pending', adminUserController.getPendingUsers);

/**
 * @route GET /api/admin/users/search
 * @desc 搜索用户（用于发送系统消息）
 * @query {string} query - 搜索关键词
 * @access Private (Admin)
 */
router.get('/users/search', adminUserController.searchUsers);

/**
 * @route GET /api/admin/users
 * @desc 获取用户列表
 * @query {number} page - 页码
 * @query {number} limit - 每页数量
 * @query {string} query - 搜索关键词
 * @query {string} role - 角色筛选
 * @query {string} status - 状态筛选
 * @query {boolean} includeBadges - 是否包含用户标签
 * @access Private (Admin)
 */
router.get('/users', adminUserController.getUserList);

/**
 * @route GET /api/admin/users/rejection-logs
 * @desc 获取用户注册拒绝记录
 * @query {number} page - 页码
 * @query {number} limit - 每页数量
 * @query {string} username - 用户名筛选
 * @query {string} startTime - 开始时间
 * @query {string} endTime - 结束时间
 * @access Private (Admin)
 */
router.get('/users/rejection-logs', adminUserController.getRejectionLogs);

/**
 * @route GET /api/admin/users/:id
 * @desc 获取用户详情
 * @param {string} id - 用户ID
 * @access Private (Admin)
 */
router.get('/users/:id', adminUserController.getUserDetail);

/**
 * @route PUT /api/admin/users/:id
 * @desc 更新用户信息
 * @param {string} id - 用户ID
 * @body {Object} userData - 用户数据
 * @access Private (Admin)
 */
router.put('/users/:id', Validator.validateBody(adminUpdateUserSchema), adminUserController.updateUser);

/**
 * @route DELETE /api/admin/users/:id
 * @desc 删除用户
 * @param {string} id - 用户ID
 * @access Private (Admin)
 */
router.delete('/users/:id', adminUserController.deleteUser);

/**
 * @route PUT /api/admin/users/:id/audit
 * @desc 审核用户
 * @param {string} id - 用户ID
 * @body {string} action - 操作类型 (approve/reject)
 * @body {string} reason - 拒绝原因 (当action为reject时必填)
 * @access Private (Admin)
 */
router.put('/users/:id/audit', adminUserController.auditUser);



/**
 * @route PUT /api/admin/users/:id/disable
 * @desc 禁用用户
 * @param {string} id - 用户ID
 * @access Private (Admin)
 */
router.put('/users/:id/disable', adminUserController.disableUser);

/**
 * @route PUT /api/admin/users/:id/enable
 * @desc 启用用户
 * @param {string} id - 用户ID
 * @access Private (Admin)
 */
router.put('/users/:id/enable', adminUserController.enableUser);

// ==================== 系统设置路由 ====================

/**
 * @route GET /api/admin/settings
 * @desc 获取系统设置
 * @access Private (Admin)
 */
router.get('/settings', adminSettingsController.getSettings);

/**
 * @route PUT /api/admin/settings
 * @desc 更新系统设置
 * @body {Object} settings - 设置数据
 * @access Private (Admin)
 */
router.put('/settings', adminSettingsController.updateSettings);

/**
 * @route POST /api/admin/settings/init-recommendation
 * @desc 初始化推荐算法设置
 * @access Private (Admin)
 */
router.post('/settings/init-recommendation', adminSettingsController.initRecommendSettings);

/**
 * @route POST /api/admin/settings/init-search
 * @desc 初始化搜索设置
 * @access Private (Admin)
 */
router.post('/settings/init-search', adminSettingsController.initSearchSettings);

// ==================== 管理员状态检查路由 ====================

/**
 * @route GET /api/admin/status
 * @desc 管理员系统状态检查
 * @access Private (Admin)
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

/**
 * @route GET /api/admin/health
 * @desc 管理员系统健康检查
 * @access Private (Admin)
 */
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

module.exports = router;
