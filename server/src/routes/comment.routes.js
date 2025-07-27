const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const {
  AuthMiddleware,
  RateLimitMiddleware,
  PublishLimitMiddleware
} = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

// 请求体验证模式
const createCommentSchema = Joi.object({
  post_id: Joi.string().uuid().required()
    .messages({
      'string.base': '帖子ID必须是字符串',
      'string.uuid': '帖子ID必须是有效的UUID格式',
      'any.required': '帖子ID是必填项'
    }),
  content: Joi.string().required()
    .messages({
      'any.required': '评论内容是必填项'
    }),
  reply_to: Joi.string().uuid().allow(null).optional()
    .messages({
      'string.base': '回复ID必须是字符串',
      'string.uuid': '回复ID必须是有效的UUID格式'
    })
});

const updateCommentSchema = Joi.object({
  content: Joi.string().required()
    .messages({
      'any.required': '评论内容是必填项'
    })
});

// 创建评论路由
router.post('/',
  AuthMiddleware.authenticate(),
  PublishLimitMiddleware.commentLimiter(),
  RateLimitMiddleware.commentLimiter(),
  Validator.validateBody(createCommentSchema),
  commentController.createComment
);

// 评论详情路由
router.get('/:id', commentController.getCommentById);
router.get('/:id/replies', commentController.getCommentReplies);

// 获取评论的多级回复树
router.get('/:id/replies-tree', commentController.getCommentRepliesTree);

// 获取评论的直接回复
router.get('/:id/direct-replies', commentController.getCommentDirectReplies);

// 更新和删除评论路由（需要登录）
router.put('/:id',
  AuthMiddleware.authenticate(),
  Validator.validateBody(updateCommentSchema),
  commentController.updateComment
);
router.delete('/:id', AuthMiddleware.authenticate(), commentController.deleteComment);

// 帖子评论路由
router.get('/post/:postId', commentController.getPostComments);

// 用户评论路由
router.get('/user/me', AuthMiddleware.authenticate(), commentController.getUserComments);

// 用户评论审核记录路由
router.get('/user/audit-history', AuthMiddleware.authenticate(), commentController.getUserCommentAuditHistory);

module.exports = router;