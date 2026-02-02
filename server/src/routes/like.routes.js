const express = require('express');
const router = express.Router();
const likeController = require('../controllers/like.controller');
const { AuthMiddleware, RateLimitMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

/**
 * @swagger
 * components:
 *   schemas:
 *     Like:
 *       type: object
 *       required:
 *         - target_id
 *         - target_type
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 点赞记录ID
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: 点赞用户ID
 *         target_id:
 *           type: string
 *           format: uuid
 *           description: 点赞对象ID
 *         target_type:
 *           type: string
 *           enum: [post, comment]
 *           description: 点赞对象类型
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 点赞时间
 */

/**
 * @swagger
 * tags:
 *   name: Likes
 *   description: 点赞管理API
 */

// 请求体验证模式
const likeSchema = Joi.object({
  target_id: Joi.string().uuid().required()
    .messages({
      'string.base': '目标ID必须是字符串',
      'string.uuid': '目标ID必须是有效的UUID格式',
      'any.required': '目标ID是必填项'
    }),
  target_type: Joi.string().valid('post', 'comment').required()
    .messages({
      'string.base': '目标类型必须是字符串',
      'string.valid': '目标类型必须是post或comment',
      'any.required': '目标类型是必填项'
    })
});

// 点赞和取消点赞路由
/**
 * @swagger
 * /api/likes:
 *   post:
 *     summary: 点赞帖子或评论
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target_id
 *               - target_type
 *             properties:
 *               target_id:
 *                 type: string
 *                 format: uuid
 *               target_type:
 *                 type: string
 *                 enum: [post, comment]
 *     responses:
 *       200:
 *         description: 点赞成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Like'
 */
router.post('/', AuthMiddleware.authenticate(), RateLimitMiddleware.likeLimiter(), Validator.validateBody(likeSchema), likeController.like);
/**
 * @swagger
 * /api/likes/{target_type}/{target_id}:
 *   delete:
 *     summary: 取消点赞
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: target_type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [post, comment]
 *       - in: path
 *         name: target_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 取消点赞成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *   get:
 *     summary: 获取目标的点赞列表
 *     tags: [Likes]
 *     parameters:
 *       - in: path
 *         name: target_type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [post, comment]
 *       - in: path
 *         name: target_id
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
 *         description: 点赞分页数据
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
 *                         $ref: '#/components/schemas/Like'
 *                     pagination:
 *                       type: object
 */
router.delete('/:target_type/:target_id', AuthMiddleware.authenticate(), likeController.unlike);

// 获取点赞列表路由
/**
 * @swagger
 * /api/likes/user/me:
 *   get:
 *     summary: 获取我点赞过的内容
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: target_type
 *         schema:
 *           type: string
 *           enum: [post, comment]
 *         description: 过滤点赞对象类型
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
 *         description: 点赞分页数据
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
 *                         $ref: '#/components/schemas/Like'
 *                     pagination:
 *                       type: object
 */
router.get('/user/me', AuthMiddleware.authenticate(), likeController.getUserLikes);
router.get('/:target_type/:target_id', likeController.getTargetLikes);

// 检查是否已点赞路由（可选认证）
/**
 * @swagger
 * /api/likes/check/{target_type}/{target_id}:
 *   get:
 *     summary: 检查当前用户是否点赞
 *     tags: [Likes]
 *     parameters:
 *       - in: path
 *         name: target_type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [post, comment]
 *       - in: path
 *         name: target_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 点赞状态
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
 *                     liked:
 *                       type: boolean
 */
router.get('/check/:target_type/:target_id', AuthMiddleware.optionalAuthenticate(), likeController.isLiked);

module.exports = router; 
