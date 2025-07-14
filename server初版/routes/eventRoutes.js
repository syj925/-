const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect, admin } = require('../middlewares/auth');
const { cacheRequest, clearCache } = require('../middlewares/cacheMiddleware');
const config = require('../config/config');

// 公开路由
router.get('/', cacheRequest('events', config.performance.cache.events), eventController.getUpcomingEvents);
// router.get('/hot', cacheRequest('events:hot', config.performance.cache.events), eventController.getHotEvents);
// 需要登录的路由 - 将特定路由放在通用路由之前
// router.get('/user/:userId', protect, eventController.getUserEvents);
router.get('/:id', cacheRequest('event', config.performance.cache.events, (req) => `event:${req.params.id}`), eventController.getEventById);

// 获取活动表单配置（公开）
router.get('/:id/form-config', eventController.getEventFormConfig);

// 其他需要登录的路由
// router.post('/', protect, clearCache('events:*'), eventController.createEvent);
// 活动报名和退出路由
router.post('/:id/join', protect, clearCache('event:*'), eventController.joinEvent);
router.post('/:id/leave', protect, clearCache('event:*'), eventController.leaveEvent);
// 取消报名路由
router.post('/:id/cancel-registration', protect, clearCache('event:*'), eventController.cancelRegistration);

// 检查注册状态（需要登录）
router.get('/:id/registration-status', protect, eventController.checkRegistrationStatus);

// 批量检查注册状态（需要登录）
router.post('/batch-registration-status', protect, eventController.batchCheckRegistrationStatus);

// 管理员路由
// router.put('/:id', protect, admin, clearCache('event:*'), eventController.updateEvent);
// router.delete('/:id', protect, admin, clearCache('event:*'), eventController.deleteEvent);

// 获取活动报名列表（管理员或创建者）
router.get('/:id/registrations', protect, eventController.getEventRegistrations);

// 导出活动报名数据（管理员或创建者）
router.get('/:id/export-registrations', protect, eventController.exportEventRegistrations);

module.exports = router; 