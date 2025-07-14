const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const messageController = require('../controllers/messageController');

// 获取消息列表
router.get('/', protect, messageController.getMessages);

// 获取未读消息数
router.get('/unread-count', protect, messageController.getUnreadCount);

// 标记所有消息为已读
router.put('/read-all', protect, messageController.markAllAsRead);

// 删除所有消息
router.delete('/delete-all', protect, messageController.deleteAllMessages);

// 获取消息详情
router.get('/:id', protect, messageController.getMessageDetail);

// 标记消息为已读
router.put('/:id/read', protect, messageController.markAsRead);

// 删除单条消息
router.delete('/:id', protect, messageController.deleteMessage);

module.exports = router; 