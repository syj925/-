const express = require('express');
const router = express.Router();
const privateMessageController = require('../controllers/private-message.controller');
const { AuthMiddleware } = require('../middlewares');
const PrivateMessageMiddleware = require('../middlewares/privateMessage.middleware');
const { Validator } = require('../utils');
const Joi = require('joi');

/**
 * @swagger
 * components:
 *   schemas:
 *     PrivateMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         sender_id:
 *           type: string
 *           format: uuid
 *         receiver_id:
 *           type: string
 *           format: uuid
 *         content:
 *           type: string
 *         type:
 *           type: string
 *           enum: [private]
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
 *   name: PrivateMessages
 *   description: 私信消息API
 */

/**
 * 发送私信验证规则
 */
const sendPrivateMessageSchema = Joi.object({
  receiverId: Joi.string().uuid().required()
    .messages({
      'string.base': '接收者ID必须是字符串',
      'string.uuid': '接收者ID必须是有效的UUID格式',
      'any.required': '接收者ID是必需的'
    }),
  content: Joi.string().trim().min(1).max(2000).required()
    .messages({
      'string.base': '消息内容必须是字符串',
      'string.empty': '消息内容不能为空',
      'string.min': '消息内容不能为空',
      'string.max': '消息内容不能超过2000个字符',
      'any.required': '消息内容是必需的'
    })
});

/**
 * 分页验证规则
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(200).default(50) // 提高限制，支持消息页面一次加载更多
});

// 所有私信路由都需要登录
router.use(AuthMiddleware.authenticate());

/**
 * @swagger
 * /api/private-messages:
 *   post:
 *     summary: 发送私信
 *     tags: [PrivateMessages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - content
 *             properties:
 *               receiverId:
 *                 type: string
 *                 format: uuid
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: 私信发送成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PrivateMessage'
 */
router.post('/', 
  Validator.validateBody(sendPrivateMessageSchema),
  PrivateMessageMiddleware.checkAllPrivateMessagePermissions,
  privateMessageController.sendPrivateMessage
);

/**
 * @swagger
 * /api/private-messages:
 *   get:
 *     summary: 获取私信会话列表
 *     tags: [PrivateMessages]
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
 *     responses:
 *       200:
 *         description: 会话列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PrivateMessage'
 */
router.get('/', 
  Validator.validateQuery(paginationSchema),
  privateMessageController.getConversationList
);

/**
 * @swagger
 * /api/private-messages/status:
 *   get:
 *     summary: 获取私信功能状态
 *     tags: [PrivateMessages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 私信可用状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     globalEnabled:
 *                       type: boolean
 *                     userEnabled:
 *                       type: boolean
 *                     available:
 *                       type: boolean
 */
router.get('/status', 
  privateMessageController.getPrivateMessageStatus
);

/**
 * @swagger
 * /api/private-messages/conversation/{userId}:
 *   get:
 *     summary: 获取与指定用户的私信对话
 *     tags: [PrivateMessages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 分页对话消息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PrivateMessage'
 */
router.get('/conversation/:userId', 
  Validator.validateParams(Joi.object({
    userId: Joi.string().uuid().required()
      .messages({
        'string.uuid': '用户ID必须是有效的UUID格式',
        'any.required': '用户ID是必需的'
      })
  })),
  Validator.validateQuery(paginationSchema),
  PrivateMessageMiddleware.checkGlobalPrivateMessageEnabled,
  privateMessageController.getConversation
);

/**
 * @swagger
 * /api/private-messages/conversation/{userId}/read:
 *   put:
 *     summary: 标记指定会话为已读
 *     tags: [PrivateMessages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 返回更新数量
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: integer
 */
router.put('/conversation/:userId/read', 
  Validator.validateParams(Joi.object({
    userId: Joi.string().uuid().required()
      .messages({
        'string.uuid': '用户ID必须是有效的UUID格式',
        'any.required': '用户ID是必需的'
      })
  })),
  privateMessageController.markConversationAsRead
);

module.exports = router;
