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

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - post_id
 *         - content
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 评论ID
 *         post_id:
 *           type: string
 *           format: uuid
 *           description: 所属帖子ID
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: 评论作者ID
 *         reply_to:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: 被回复的评论ID
 *         content:
 *           type: string
 *           description: 评论内容
 *         images:
 *           type: array
 *           nullable: true
 *           description: 附带图片URL列表
 *           items:
 *             type: string
 *         emoji_image:
 *           type: object
 *           nullable: true
 *           description: 图片表情信息
 *           properties:
 *             id:
 *               type: string
 *               nullable: true
 *             url:
 *               type: string
 *             name:
 *               type: string
 *         status:
 *           type: string
 *           description: 审核状态
 *         likes_count:
 *           type: integer
 *           description: 点赞数
 *         replies_count:
 *           type: integer
 *           description: 回复数
 *         needsAudit:
 *           type: boolean
 *           description: 是否等待审核
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 */

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: 评论互动API
 */

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
    }),
  // 图片表情（与普通图片互斥）
  emoji_image: Joi.object({
    id: Joi.string().allow(null).optional(),
    url: Joi.string().required(),
    name: Joi.string().optional()
  }).allow(null).optional(),
  // 普通图片列表
  images: Joi.array().items(Joi.string()).allow(null).optional(),
  // 其他可选字段
  is_anonymous: Joi.boolean().optional(),
  mentioned_users: Joi.array().items(Joi.string()).optional()
});

const updateCommentSchema = Joi.object({
  content: Joi.string().required()
    .messages({
      'any.required': '评论内容是必填项'
    })
});

// 创建评论路由
/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: 发布评论
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - post_id
 *               - content
 *             properties:
 *               post_id:
 *                 type: string
 *                 format: uuid
 *               content:
 *                 type: string
 *               reply_to:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               emoji_image:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     nullable: true
 *                   url:
 *                     type: string
 *                   name:
 *                     type: string
 *     responses:
 *       201:
 *         description: 评论创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: integer
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 */
router.post('/',
  AuthMiddleware.authenticate(),
  PublishLimitMiddleware.commentLimiter(),
  RateLimitMiddleware.commentLimiter(),
  Validator.validateBody(createCommentSchema),
  commentController.createComment
);

// 评论详情路由（支持可选认证）
/**
 * @swagger
 * /api/comments/{id}:
 *   get:
 *     summary: 获取评论详情
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 评论详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: integer
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *   put:
 *     summary: 更新评论内容
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: 新的评论内容
 *     responses:
 *       200:
 *         description: 评论更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *   delete:
 *     summary: 删除评论
 *     tags: [Comments]
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
 *         description: 评论删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: integer
 */
router.get('/:id', AuthMiddleware.optionalAuthenticate(), commentController.getCommentById);
/**
 * @swagger
 * /api/comments/{id}/replies:
 *   get:
 *     summary: 获取评论的回复列表
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码，默认1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 每页数量，默认20
 *     responses:
 *       200:
 *         description: 回复分页列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     list:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         pageSize:
 *                           type: integer
 *                         total:
 *                           type: integer
 */
router.get('/:id/replies', AuthMiddleware.optionalAuthenticate(), commentController.getCommentReplies);

// 获取评论的多级回复树
/**
 * @swagger
 * /api/comments/{id}/replies-tree:
 *   get:
 *     summary: 获取评论的多级回复树
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: maxLevel
 *         schema:
 *           type: integer
 *         description: 返回的最大层级，默认3
 *     responses:
 *       200:
 *         description: 回复树数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 */
router.get('/:id/replies-tree', AuthMiddleware.optionalAuthenticate(), commentController.getCommentRepliesTree);

// 获取评论的直接回复
/**
 * @swagger
 * /api/comments/{id}/direct-replies:
 *   get:
 *     summary: 获取评论的直接回复
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码，默认1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 每页数量，默认10
 *     responses:
 *       200:
 *         description: 直接回复列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 */
router.get('/:id/direct-replies', AuthMiddleware.optionalAuthenticate(), commentController.getCommentDirectReplies);

// 更新和删除评论路由（需要登录）
router.put('/:id',
  AuthMiddleware.authenticate(),
  Validator.validateBody(updateCommentSchema),
  commentController.updateComment
);
router.delete('/:id', AuthMiddleware.authenticate(), commentController.deleteComment);

// 帖子评论路由（支持可选认证）
/**
 * @swagger
 * /api/comments/post/{postId}:
 *   get:
 *     summary: 获取帖子下的评论
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
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
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, hot]
 *         description: 排序方式
 *     responses:
 *       200:
 *         description: 帖子评论分页数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     list:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *                     pagination:
 *                       type: object
 */
router.get('/post/:postId', AuthMiddleware.optionalAuthenticate(), commentController.getPostComments);

// 用户评论路由
/**
 * @swagger
 * /api/comments/user/me:
 *   get:
 *     summary: 获取当前用户的评论
 *     tags: [Comments]
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
 *         description: 用户评论分页数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     list:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *                     pagination:
 *                       type: object
 */
router.get('/user/me', AuthMiddleware.authenticate(), commentController.getUserComments);

// 用户评论审核记录路由
/**
 * @swagger
 * /api/comments/user/audit-history:
 *   get:
 *     summary: 获取我的评论审核记录
 *     tags: [Comments]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, rejected, normal]
 *         description: 审核状态过滤
 *     responses:
 *       200:
 *         description: 审核记录分页数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     list:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *                     pagination:
 *                       type: object
 */
router.get('/user/audit-history', AuthMiddleware.authenticate(), commentController.getUserCommentAuditHistory);

module.exports = router;
