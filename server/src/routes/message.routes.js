const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { AuthMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

// 请求体验证模式
const markMultipleSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1)
    .messages({
      'array.base': '消息ID列表必须是数组',
      'array.min': '消息ID列表不能为空',
      'string.uuid': '消息ID必须是有效的UUID格式'
    }),
  type: Joi.string().valid('follow', 'like', 'comment', 'reply', 'favorite', 'mention', 'system', 'private')
    .messages({
      'string.base': '消息类型必须是字符串',
      'any.only': '消息类型必须是: follow, like, comment, reply, favorite, mention, system, private 之一'
    })
}).or('ids', 'type')
  .messages({
    'object.missing': '必须提供消息ID列表或消息类型'
  });

const deleteMultipleSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1)
    .messages({
      'array.base': '消息ID列表必须是数组',
      'array.min': '消息ID列表不能为空',
      'string.uuid': '消息ID必须是有效的UUID格式'
    })
});

// 所有消息路由都需要登录
router.use(AuthMiddleware.authenticate());

// 获取消息列表
router.get('/', messageController.getUserMessages);

// 获取未读消息数量
router.get('/unread-count', messageController.getUnreadCount);

// 获取消息详情
router.get('/:id', messageController.getMessageById);

// 标记消息为已读
router.put('/:id/read', messageController.markAsRead);

// 批量标记消息为已读
router.put('/read/multiple', Validator.validateBody(markMultipleSchema), messageController.markMultipleAsRead);

// 批量标记所有消息为已读
router.put('/read/all', messageController.markMultipleAsRead);

// 删除消息
router.delete('/:id', messageController.deleteMessage);

// 批量删除消息
router.delete('/multiple', Validator.validateBody(deleteMultipleSchema), messageController.deleteMultiple);

module.exports = router; 