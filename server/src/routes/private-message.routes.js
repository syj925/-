const express = require('express');
const router = express.Router();
const privateMessageController = require('../controllers/private-message.controller');
const { AuthMiddleware } = require('../middlewares');
const PrivateMessageMiddleware = require('../middlewares/privateMessage.middleware');
const { Validator } = require('../utils');
const Joi = require('joi');

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
 * @route POST /api/private-messages
 * @desc 发送私信
 * @access Private
 */
router.post('/', 
  Validator.validateBody(sendPrivateMessageSchema),
  PrivateMessageMiddleware.checkAllPrivateMessagePermissions,
  privateMessageController.sendPrivateMessage
);

/**
 * @route GET /api/private-messages
 * @desc 获取私信会话列表
 * @access Private
 */
router.get('/', 
  Validator.validateQuery(paginationSchema),
  privateMessageController.getConversationList
);

/**
 * @route GET /api/private-messages/status
 * @desc 获取私信功能状态
 * @access Private
 */
router.get('/status', 
  privateMessageController.getPrivateMessageStatus
);

/**
 * @route GET /api/private-messages/conversation/:userId
 * @desc 获取与指定用户的私信记录
 * @access Private
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
 * @route PUT /api/private-messages/conversation/:userId/read
 * @desc 标记与指定用户的私信对话为已读
 * @access Private
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

