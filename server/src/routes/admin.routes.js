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
 * @route POST /api/admin/login
 * @desc 管理员登录
 * @access Public
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

/**
 * @route GET /api/admin/users/:userId/badges
 * @desc 获取用户徽章列表
 * @param {string} userId - 用户ID
 * @access Private (Admin)
 */
router.get('/users/:userId/badges', 
  validationMiddleware.validateUUID('userId'),
  adminUserController.getUserBadges
);

// ==================== 帖子管理路由 ====================

/**
 * @route GET /api/admin/posts/pending
 * @desc 获取待审核帖子列表
 * @query {number} page - 页码
 * @query {number} limit - 每页数量
 * @access Private (Admin)
 */
router.get('/posts/pending', adminPostController.getPendingPosts);

/**
 * @route GET /api/admin/posts
 * @desc 获取帖子列表
 * @query {number} page - 页码
 * @query {number} limit - 每页数量
 * @query {string} search - 搜索关键词
 * @query {string} status - 状态筛选
 * @query {string} userId - 用户ID筛选
 * @query {string} categoryId - 分类ID筛选
 * @access Private (Admin)
 */
router.get('/posts', adminPostController.getPostList);

/**
 * @route GET /api/admin/posts/:id
 * @desc 获取帖子详情
 * @param {string} id - 帖子ID
 * @access Private (Admin)
 */
router.get('/posts/:id', adminPostController.getPostDetail);

/**
 * @route PUT /api/admin/posts/:id
 * @desc 更新帖子
 * @param {string} id - 帖子ID
 * @body {Object} updateData - 更新数据
 * @access Private (Admin)
 */
router.put('/posts/:id', adminPostController.updatePost);

/**
 * @route DELETE /api/admin/posts/:id
 * @desc 删除帖子
 * @param {string} id - 帖子ID
 * @access Private (Admin)
 */
router.delete('/posts/:id', adminPostController.deletePost);

/**
 * @route PUT /api/admin/posts/:id/audit
 * @desc 审核帖子
 * @param {string} id - 帖子ID
 * @body {string} action - 操作类型 (approve/reject)
 * @body {string} reason - 拒绝原因 (可选)
 * @access Private (Admin)
 */
router.put('/posts/:id/audit', adminPostController.auditPost);

/**
 * @route PUT /api/admin/posts/:id/recommend
 * @desc 设置/取消推荐帖子
 * @param {string} id - 帖子ID
 * @body {boolean} isRecommended - 是否推荐
 * @access Private (Admin)
 */
router.put('/posts/:id/recommend', adminPostController.setRecommendStatus);

/**
 * @route PUT /api/admin/posts/:id/top
 * @desc 设置/取消置顶帖子
 * @param {string} id - 帖子ID
 * @body {boolean} isTop - 是否置顶
 * @access Private (Admin)
 */
router.put('/posts/:id/top', adminPostController.setTopStatus);

// 推荐算法管理路由
const adminRecommendationController = require('../controllers/admin/recommendation.controller');

/**
 * @route GET /api/admin/recommendation/settings
 * @desc 获取推荐算法设置
 * @access Private (Admin)
 */
router.get('/recommendation/settings', (req, res, next) => adminRecommendationController.getRecommendationSettings(req, res, next));

/**
 * @route PUT /api/admin/recommendation/settings
 * @desc 更新推荐算法设置
 * @body {Object} settings - 推荐设置对象
 * @access Private (Admin)
 */
router.put('/recommendation/settings', (req, res, next) => adminRecommendationController.updateRecommendationSettings(req, res, next));

/**
 * @route POST /api/admin/recommendation/init
 * @desc 初始化推荐算法设置
 * @access Private (Admin)
 */
router.post('/recommendation/init', (req, res, next) => adminRecommendationController.initializeRecommendationSettings(req, res, next));

/**
 * @route DELETE /api/admin/recommendation/cache
 * @desc 清除推荐缓存
 * @access Private (Admin)
 */
router.delete('/recommendation/cache', (req, res, next) => adminRecommendationController.clearRecommendationCache(req, res, next));

/**
 * @route GET /api/admin/recommendation/stats
 * @desc 获取推荐算法统计信息
 * @access Private (Admin)
 */
router.get('/recommendation/stats', (req, res, next) => adminRecommendationController.getRecommendationStats(req, res, next));

/**
 * @route GET /api/admin/recommendation/test
 * @desc 测试推荐算法
 * @query {string} strategy - 推荐策略
 * @query {number} pageSize - 页面大小
 * @access Private (Admin)
 */
router.get('/recommendation/test', (req, res, next) => adminRecommendationController.testRecommendationAlgorithm(req, res, next));

/**
 * @route POST /api/admin/recommendation/recalculate
 * @desc 触发推荐分数重新计算
 * @access Private (Admin)
 */
router.post('/recommendation/recalculate', (req, res, next) => adminRecommendationController.triggerScoreRecalculation(req, res, next));
router.post('/recommendation/analyze', (req, res, next) => adminRecommendationController.analyzePostScore(req, res, next));

/**
 * @route POST /api/admin/recommendation/auto-update/start
 * @desc 启动推荐内容自动更新任务
 * @access Private (Admin)
 */
router.post('/recommendation/auto-update/start', (req, res, next) => adminRecommendationController.startAutoUpdate(req, res, next));

/**
 * @route POST /api/admin/recommendation/auto-update/stop
 * @desc 停止推荐内容自动更新任务
 * @access Private (Admin)
 */
router.post('/recommendation/auto-update/stop', (req, res, next) => adminRecommendationController.stopAutoUpdate(req, res, next));

/**
 * @route GET /api/admin/recommendation/auto-update/status
 * @desc 获取推荐内容自动更新状态
 * @access Private (Admin)
 */
router.get('/recommendation/auto-update/status', (req, res, next) => adminRecommendationController.getAutoUpdateStatus(req, res, next));

/**
 * @route GET /api/admin/recommendation/presets
 * @desc 获取预设配置列表
 * @access Private (Admin)
 */
router.get('/recommendation/presets', (req, res, next) => adminRecommendationController.getPresetConfigurations(req, res, next));

/**
 * @route POST /api/admin/recommendation/presets/apply
 * @desc 应用预设配置
 * @body {string} presetId - 预设配置ID
 * @access Private (Admin)
 */
router.post('/recommendation/presets/apply', (req, res, next) => adminRecommendationController.applyPresetConfiguration(req, res, next));

/**
 * @route GET /api/admin/recommendation/export
 * @desc 导出当前配置
 * @access Private (Admin)
 */
router.get('/recommendation/export', (req, res, next) => adminRecommendationController.exportCurrentConfiguration(req, res, next));

/**
 * @route POST /api/admin/recommendation/import
 * @desc 导入自定义配置
 * @body {Object} configData - 配置数据
 * @access Private (Admin)
 */
router.post('/recommendation/import', (req, res, next) => adminRecommendationController.importCustomConfiguration(req, res, next));

// ==================== 评论管理路由 ====================

/**
 * @route GET /api/admin/comments/pending
 * @desc 获取待审核评论列表
 * @query {number} page - 页码
 * @query {number} limit - 每页数量
 * @access Private (Admin)
 */
router.get('/comments/pending', adminCommentController.getPendingComments);

/**
 * @route GET /api/admin/comments
 * @desc 获取评论列表
 * @query {number} page - 页码
 * @query {number} limit - 每页数量
 * @query {string} search - 搜索关键词
 * @query {string} status - 状态筛选
 * @query {string} postId - 帖子ID筛选
 * @query {string} userId - 用户ID筛选
 * @access Private (Admin)
 */
router.get('/comments', adminCommentController.getCommentList);

/**
 * @route GET /api/admin/comments/:id
 * @desc 获取评论详情
 * @param {string} id - 评论ID
 * @access Private (Admin)
 */
router.get('/comments/:id', adminCommentController.getCommentDetail);

/**
 * @route PUT /api/admin/comments/:id
 * @desc 更新评论
 * @param {string} id - 评论ID
 * @body {Object} updateData - 更新数据
 * @access Private (Admin)
 */
router.put('/comments/:id', adminCommentController.updateComment);

/**
 * @route DELETE /api/admin/comments/:id
 * @desc 删除评论
 * @param {string} id - 评论ID
 * @access Private (Admin)
 */
router.delete('/comments/:id', adminCommentController.deleteComment);

/**
 * @route PUT /api/admin/comments/:id/audit
 * @desc 审核评论
 * @param {string} id - 评论ID
 * @body {string} action - 操作类型 (approve/reject)
 * @body {string} reason - 拒绝原因 (可选)
 * @access Private (Admin)
 */
router.put('/comments/:id/audit', adminCommentController.auditComment);

// ==================== 话题管理路由 ====================

/**
 * @route GET /api/admin/topics
 * @desc 获取话题列表
 * @query {number} page - 页码
 * @query {number} limit - 每页数量
 * @query {string} search - 搜索关键词
 * @query {string} status - 状态筛选
 * @query {string} orderBy - 排序字段
 * @query {string} orderDirection - 排序方向
 * @access Private (Admin)
 */
router.get('/topics', adminTopicController.getTopicList);

/**
 * @route POST /api/admin/topics
 * @desc 创建话题
 * @body {string} name - 话题名称
 * @body {string} description - 话题描述
 * @body {string} cover_image - 封面图片
 * @body {string} status - 话题状态
 * @access Private (Admin)
 */
router.post('/topics', adminTopicController.createTopic);

/**
 * @route PUT /api/admin/topics/:id
 * @desc 更新话题
 * @param {string} id - 话题ID
 * @body {Object} updateData - 更新数据
 * @access Private (Admin)
 */
router.put('/topics/:id', adminTopicController.updateTopic);

/**
 * @route DELETE /api/admin/topics/:id
 * @desc 删除话题
 * @param {string} id - 话题ID
 * @access Private (Admin)
 */
router.delete('/topics/:id', adminTopicController.deleteTopic);

/**
 * @route PATCH /api/admin/topics/:id/hot
 * @desc 设置话题热门状态
 * @param {string} id - 话题ID
 * @body {boolean} is_hot - 是否热门
 * @access Private (Admin)
 */
router.patch('/topics/:id/hot', adminTopicController.setHotStatus);

/**
 * @route GET /api/admin/topics/pending-images
 * @desc 获取待审核话题图片列表
 * @query {number} page - 页码
 * @query {number} limit - 每页数量
 * @access Private (Admin)
 */
router.get('/topics/pending-images', adminTopicController.getPendingTopicImages);

/**
 * @route PUT /api/admin/topics/:id/review-image
 * @desc 审核话题图片
 * @param {string} id - 话题ID
 * @body {string} action - 审核动作 (approve/reject)
 * @access Private (Admin)
 */
router.put('/topics/:id/review-image', adminTopicController.reviewTopicImage);

// ==================== 分类统计管理路由 ====================

/**
 * @route /api/admin/categories/*
 * @desc 分类管理相关路由
 * @access Private (Admin)
 */
router.use('/categories', categoryRoutes);

/**
 * @route /api/admin/category-stats
 * @desc 分类统计管理相关路由
 * @access Private (Admin)
 */
router.use('/category-stats', categoryStatsRoutes);

/**
 * @route /api/admin/stats/online
 * @desc 在线用户统计管理相关路由
 * @access Private (Admin)
 */
router.use('/stats/online', onlineStatsRoutes);

/**
 * @route /api/admin/audit
 * @desc 审核管理相关路由
 * @access Private (Admin)
 */
router.use('/audit', auditRoutes);

// ==================== 徽章管理路由 ====================

/**
 * @route /api/admin/badges/*
 * @desc 徽章管理相关路由
 * @access Private (Admin)
 */
router.use('/badges', badgeRoutes);

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

// ==================== 消息管理路由 ====================

/**
 * @route GET /api/admin/messages/system
 * @desc 获取系统通知列表
 * @query {number} page - 页码
 * @query {number} limit - 每页数量
 * @query {string} type - 通知类型
 * @query {string} searchQuery - 搜索关键词
 * @access Private (Admin)
 */
router.get('/messages/system', adminMessageController.getSystemMessages);

/**
 * @route GET /api/admin/messages/system/stats
 * @desc 获取系统通知统计
 * @access Private (Admin)
 */
router.get('/messages/system/stats', adminMessageController.getSystemMessageStats);

/**
 * @route POST /api/admin/messages/system
 * @desc 创建系统通知
 * @body {Object} messageData - 通知数据
 * @access Private (Admin)
 */
router.post('/messages/system', adminMessageController.createSystemMessage);

/**
 * @route GET /api/admin/messages/system/:id
 * @desc 获取系统通知详情
 * @param {string} id - 通知ID
 * @access Private (Admin)
 */
router.get('/messages/system/:id', adminMessageController.getSystemMessageDetail);

/**
 * @route DELETE /api/admin/messages/system/:id
 * @desc 删除系统通知
 * @param {string} id - 通知ID
 * @access Private (Admin)
 */
router.delete('/messages/system/:id', adminMessageController.deleteSystemMessage);

/**
 * @route GET /api/admin/messages/system/:id/recipients
 * @desc 获取系统通知接收者列表
 * @param {string} id - 通知ID
 * @query {number} page - 页码
 * @query {number} limit - 每页数量
 * @query {string} isRead - 阅读状态
 * @access Private (Admin)
 */
router.get('/messages/system/:id/recipients', adminMessageController.getSystemMessageRecipients);

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

// ==================== 活动管理路由 ====================

/**
 * @route GET /api/admin/events
 * @desc 获取活动列表（管理员）
 * @query {number} page - 页码
 * @query {number} limit - 每页数量
 * @query {string} title - 活动标题搜索
 * @query {string} status - 活动状态筛选
 * @query {string} startDate - 开始日期筛选
 * @query {string} endDate - 结束日期筛选
 * @query {boolean} isRecommended - 是否推荐筛选
 * @query {string} organizer - 组织者筛选
 * @access Private (Admin)
 */
router.get('/events', adminEventController.getEventList);

/**
 * @route GET /api/admin/events/statistics
 * @desc 获取全局活动统计数据（管理员）
 * @access Private (Admin)
 */
router.get('/events/statistics', adminEventController.getGlobalEventStatistics);

/**
 * @route GET /api/admin/events/:id
 * @desc 获取活动详情（管理员）
 * @param {string} id - 活动ID
 * @access Private (Admin)
 */
router.get('/events/:id', adminEventController.getEventDetail);

/**
 * @route POST /api/admin/events
 * @desc 创建活动（管理员）
 * @body {object} eventData - 活动数据
 * @access Private (Admin)
 */
router.post('/events', adminEventController.createEvent);

/**
 * @route PUT /api/admin/events/:id
 * @desc 更新活动（管理员）
 * @param {string} id - 活动ID
 * @body {object} updateData - 更新数据
 * @access Private (Admin)
 */
router.put('/events/:id', adminEventController.updateEvent);

/**
 * @route DELETE /api/admin/events/:id
 * @desc 删除活动（管理员）
 * @param {string} id - 活动ID
 * @access Private (Admin)
 */
router.delete('/events/:id', adminEventController.deleteEvent);

/**
 * @route GET /api/admin/events/:id/registrations
 * @desc 获取活动报名列表（管理员）
 * @param {string} id - 活动ID
 * @query {number} page - 页码
 * @query {number} limit - 每页数量
 * @query {string} status - 报名状态筛选
 * @query {string} keyword - 关键词搜索
 * @query {string} startDate - 开始日期筛选
 * @query {string} endDate - 结束日期筛选
 * @access Private (Admin)
 */
router.get('/events/:id/registrations', adminEventController.getEventRegistrations);

/**
 * @route PUT /api/admin/events/:eventId/registrations/:registrationId/status
 * @desc 更新报名状态（管理员）
 * @param {string} eventId - 活动ID
 * @param {string} registrationId - 报名ID
 * @body {object} statusData - 状态数据 {status, reason}
 * @access Private (Admin)
 */
router.put('/events/:eventId/registrations/:registrationId/status', adminEventController.updateRegistrationStatus);

/**
 * @route PUT /api/admin/events/:eventId/registrations/batch-status
 * @desc 批量更新报名状态（管理员）
 * @param {string} eventId - 活动ID
 * @body {object} batchData - 批量数据 {registrationIds, status, reason}
 * @access Private (Admin)
 */
router.put('/events/:eventId/registrations/batch-status', adminEventController.batchUpdateRegistrationStatus);

/**
 * @route GET /api/admin/events/:id/statistics
 * @desc 获取活动统计数据（管理员）
 * @param {string} id - 活动ID
 * @access Private (Admin)
 */
router.get('/events/:id/statistics', adminEventController.getEventStatistics);

/**
 * @route GET /api/admin/events/:id/registrations/export
 * @desc 导出活动报名数据（管理员）
 * @param {string} id - 活动ID
 * @query {string} format - 导出格式 (excel/csv)
 * @access Private (Admin)
 */
router.get('/events/:id/registrations/export', adminEventController.exportEventRegistrations);

// ==================== 表情管理路由 ====================
const emojiController = require('../controllers/emoji.controller');

// 表情包管理
router.get('/emoji-packs', emojiController.getPacks);
router.get('/emoji-packs/:packId', emojiController.getPackById);
router.post('/emoji-packs', emojiController.createPack);
router.put('/emoji-packs/:packId', emojiController.updatePack);
router.delete('/emoji-packs/:packId', emojiController.deletePack);

// 表情管理
router.post('/emojis', emojiController.createEmoji);
router.put('/emojis/:emojiId', emojiController.updateEmoji);
router.delete('/emojis/:emojiId', emojiController.deleteEmoji);

// 审核管理
router.get('/emojis/pending', emojiController.getPendingEmojis);
router.post('/emojis/:customEmojiId/review', emojiController.reviewEmoji);

// 同步使用计数（定时任务）
router.post('/emojis/sync-counts', emojiController.syncUseCounts);

// 清除表情系统缓存
router.post('/emojis/clear-cache', emojiController.clearCache);

// ==================== 统计路由 ====================
const statisticsController = require('../controllers/admin/statistics.controller');

/**
 * @route GET /api/admin/statistics
 * @desc 获取综合统计数据
 * @access Private (Admin)
 */
router.get('/statistics', statisticsController.getAllStats);

// ==================== 日志管理路由 ====================
const adminLogController = require('../controllers/admin/log.controller');

/**
 * @route GET /api/admin/logs
 * @desc 获取操作日志列表
 * @access Private (Admin)
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

// 获取当前配置版本信息
router.get('/config-version', configController.getAdminConfigVersion);

// 获取版本历史
router.get('/config-versions', configController.getVersionHistory);

// 发布新配置版本
router.post('/config-version', configController.publishConfigVersion);

// 回滚到指定版本
router.post('/config-rollback', configController.rollbackToVersion);

module.exports = router;
