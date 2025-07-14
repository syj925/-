const express = require('express');
const router = express.Router();
const adminEventController = require('../controllers/adminEventController');

// 获取活动详情
router.get('/events/:id', adminEventController.getEventDetail);
// 获取活动报名列表
router.get('/events/:id/registrations', adminEventController.getEventRegistrations);
// 更新报名状态
router.put('/events/registrations/:registrationId/status', adminEventController.updateRegistrationStatus);
// 批量更新报名状态
router.put('/events/:id/registrations/batch', adminEventController.batchUpdateRegistrationStatus);
// 导出报名数据
router.get('/events/:id/registrations/export', adminEventController.exportRegistrations);

module.exports = router; 