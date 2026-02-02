const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { AuthMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [follow, like, comment, reply, favorite, mention, system, private]
 *           description: 消息类型
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         sender_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         receiver_id:
 *           type: string
 *           format: uuid
 *         post_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         comment_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         is_read:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: 通知消息API
 */

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
/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: 获取我的消息列表
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [follow, like, comment, reply, favorite, mention, system, private]
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: 分页的消息列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 */
router.get('/', messageController.getUserMessages);

// 获取未读消息数量
/**
 * @swagger
 * /api/messages/unread-count:
 *   get:
 *     summary: 获取未读消息数量
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 未读数量
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 */
router.get('/unread-count', messageController.getUnreadCount);

// 获取消息详情
/**
 * @swagger
 * /api/messages/{id}:
 *   get:
 *     summary: 获取消息详情
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 消息详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 */
router.get('/:id', messageController.getMessageById);

// 标记消息为已读
/**
 * @swagger
 * /api/messages/{id}/read:
 *   put:
 *     summary: 标记单条消息为已读
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 标记成功
 */
router.put('/:id/read', messageController.markAsRead);

// 批量标记消息为已读
/**
 * @swagger
 * /api/messages/read/multiple:
 *   put:
 *     summary: 批量标记消息为已读
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: 指定ID列表或消息类型，至少提供其一
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               type:
 *                 type: string
 *                 enum: [follow, like, comment, reply, favorite, mention, system, private]
 *     responses:
 *       200:
 *         description: 返回受影响条数
 */
router.put('/read/multiple', Validator.validateBody(markMultipleSchema), messageController.markMultipleAsRead);

// 批量标记所有消息为已读
/**
 * @swagger
 * /api/messages/read/all:
 *   put:
 *     summary: 标记所有消息为已读
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 全部标记结果
 */
router.put('/read/all', messageController.markMultipleAsRead);

// 删除消息
/**
 * @swagger
 * /api/messages/{id}:
 *   delete:
 *     summary: 删除单条消息
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:id', messageController.deleteMessage);

// 批量删除消息
/**
 * @swagger
 * /api/messages/multiple:
 *   delete:
 *     summary: 批量删除消息
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: 删除结果
 */
router.delete('/multiple', Validator.validateBody(deleteMultipleSchema), messageController.deleteMultiple);

module.exports = router; 
