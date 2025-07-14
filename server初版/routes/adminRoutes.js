const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const adminController = require('../controllers/adminController');
const systemNotificationController = require('../controllers/systemNotificationController');

// 管理员登录
router.post('/login', adminController.login);

// 以下所有路由都需要管理员权限
router.use(auth.protect, auth.admin);

// 仪表盘数据
router.get('/dashboard', adminController.getDashboard);
router.get('/dashboard/trend', adminController.getTrendData);
router.get('/dashboard/user-distribution', adminController.getUserDistribution);

// 用户管理
router.get('/users', adminController.getUsers);
// 用户审核相关 - 先定义具体路径
router.get('/users/pending', adminController.getPendingUsers);
// 再定义参数路径
router.get('/users/:id', adminController.getUserDetail);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/audit', adminController.auditUser);

// 帖子管理
router.get('/posts', adminController.getPosts);
// 帖子审核相关 - 先定义具体路径
router.get('/posts/pending', adminController.getPendingPosts);
// 再定义参数路径
router.put('/posts/:id', adminController.updatePost);
router.delete('/posts/:id', adminController.deletePost);
router.put('/posts/:id/audit', adminController.auditPost);
router.put('/posts/:id/recommend', adminController.recommendPost);

// 评论管理
router.get('/comments', adminController.getComments);
// 评论审核相关 - 先定义具体路径
router.get('/comments/pending', adminController.getPendingComments);
// 再定义参数路径
router.put('/comments/:id', adminController.updateComment);
router.delete('/comments/:id', adminController.deleteComment);
router.put('/comments/:id/audit', adminController.auditComment);

// 话题管理
router.get('/topics', adminController.getTopics);
router.post('/topics', adminController.createTopic);
router.put('/topics/:id', adminController.updateTopic);
router.delete('/topics/:id', adminController.deleteTopic);
// 新增话题相关功能路由
router.get('/topics/statistics', adminController.getTopicStatistics);
router.post('/topics/batch', adminController.batchOperateTopics);
router.post('/topics/merge', adminController.mergeTopics);
router.put('/topics/:id/seo', adminController.updateTopicSeo);
router.put('/topics/:id/review-config', adminController.updateTopicReviewConfig);
// 话题图片审核相关
router.get('/topics/pending-images', adminController.getPendingTopicImages);
router.put('/topics/:id/review-image', adminController.reviewTopicImage);

// 活动管理
router.get('/events', adminController.getEvents);
router.post('/events', adminController.createEvent);
router.put('/events/:id', adminController.updateEvent);
router.delete('/events/:id', adminController.deleteEvent);

// 系统设置
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);
router.post('/settings/init-recommendation', adminController.initRecommendationSettings);
router.post('/settings/init-search', adminController.initSearchSettings);

// 操作日志
router.get('/logs', adminController.getLogs);

// 消息管理
router.get('/messages/system', systemNotificationController.getSystemMessages); // 获取系统通知列表
router.get('/messages/system/:id', systemNotificationController.getSystemMessageDetail); // 获取系统通知详情
router.post('/messages/system', systemNotificationController.createSystemMessage); // 创建系统通知
router.delete('/messages/system/:id', systemNotificationController.deleteSystemMessage); // 删除系统通知
router.get('/messages/system/stats', systemNotificationController.getSystemMessageStats); // 获取系统通知统计数据
router.get('/messages/system/:id/recipients', systemNotificationController.getSystemMessageRecipients); // 获取系统通知接收者列表

router.get('/messages/interaction', adminController.getInteractionMessages); // 获取互动消息列表
router.get('/messages/interaction/:id', adminController.getInteractionMessageDetail); // 获取互动消息详情
router.delete('/messages/interaction/:id', adminController.deleteInteractionMessage); // 删除互动消息

router.get('/users/search', systemNotificationController.searchUsers); // 搜索用户(用于发送系统消息)

// 挂载活动管理相关子路由
const adminEventRoutes = require('./adminEventRoutes');
router.use(adminEventRoutes);

module.exports = router; 