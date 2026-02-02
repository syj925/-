const express = require('express');
const router = express.Router();
const followController = require('../controllers/follow.controller');
const { AuthMiddleware, RateLimitMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

/**
 * @swagger
 * components:
 *   schemas:
 *     Follow:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 关注关系ID
 *         follower_id:
 *           type: string
 *           format: uuid
 *           description: 发起关注的用户ID
 *         following_id:
 *           type: string
 *           format: uuid
 *           description: 被关注的用户ID
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         follower:
 *           $ref: '#/components/schemas/User'
 *           description: 可选的关注者详情
 *         following:
 *           $ref: '#/components/schemas/User'
 *           description: 可选的被关注者详情
 */

/**
 * @swagger
 * tags:
 *   name: Follows
 *   description: 用户关注关系API
 */

// 请求体验证模式
const followSchema = Joi.object({
  user_id: Joi.string().uuid().required()
    .messages({
      'string.base': '用户ID必须是字符串',
      'string.uuid': '用户ID必须是有效的UUID格式',
      'any.required': '用户ID是必填项'
    })
});

// 关注和取消关注路由
/**
 * @swagger
 * /api/follows:
 *   post:
 *     summary: 关注指定用户
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: 目标用户ID
 *     responses:
 *       200:
 *         description: 返回新的关注关系或状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Follow'
 */
router.post('/', AuthMiddleware.authenticate(), RateLimitMiddleware.apiLimiter(), Validator.validateBody(followSchema), followController.followUser);
/**
 * @swagger
 * /api/follows/{user_id}:
 *   delete:
 *     summary: 取消关注用户
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 要取消关注的用户ID
 *     responses:
 *       200:
 *         description: 取消关注成功
 */
router.delete('/:user_id', AuthMiddleware.authenticate(), followController.unfollowUser);

// 获取用户关注和粉丝列表
/**
 * @swagger
 * /api/follows/me/followings:
 *   get:
 *     summary: 获取我的关注列表
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/me/followings', AuthMiddleware.authenticate(), followController.getMyFollowings);
/**
 * @swagger
 * /api/follows/me/followers:
 *   get:
 *     summary: 获取我的粉丝列表
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 粉丝列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/me/followers', AuthMiddleware.authenticate(), followController.getMyFollowers);
/**
 * @swagger
 * /api/follows/user/{user_id}/followings:
 *   get:
 *     summary: 获取指定用户的关注列表
 *     tags: [Follows]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 用户关注列表
 */
router.get('/user/:user_id/followings', followController.getFollowings);
/**
 * @swagger
 * /api/follows/user/{user_id}/followers:
 *   get:
 *     summary: 获取指定用户的粉丝列表
 *     tags: [Follows]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 用户粉丝列表
 */
router.get('/user/:user_id/followers', followController.getFollowers);

// 获取用户关注和粉丝数量
/**
 * @swagger
 * /api/follows/user/{user_id}/counts:
 *   get:
 *     summary: 获取指定用户关注/粉丝数量
 *     tags: [Follows]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 数量信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     followings:
 *                       type: integer
 *                     followers:
 *                       type: integer
 */
router.get('/user/:user_id/counts', followController.getFollowCounts);

// 检查是否已关注
/**
 * @swagger
 * /api/follows/check/{user_id}:
 *   get:
 *     summary: 检查当前用户是否关注目标用户
 *     tags: [Follows]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 返回是否关注
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     following:
 *                       type: boolean
 */
router.get('/check/:user_id', AuthMiddleware.optionalAuthenticate(), followController.isFollowing);

// 获取共同关注
/**
 * @swagger
 * /api/follows/common/{user_id1}/{user_id2}:
 *   get:
 *     summary: 获取两个用户的共同关注列表
 *     tags: [Follows]
 *     parameters:
 *       - in: path
 *         name: user_id1
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: user_id2
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 共同关注的用户列表
 */
router.get('/common/:user_id1/:user_id2', followController.getCommonFollowings);

// 批量检查关注状态
/**
 * @swagger
 * /api/follows/batch-check:
 *   post:
 *     summary: 批量检查关注状态
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: 要检查的用户ID列表
 *     responses:
 *       200:
 *         description: 批量结果
 */
router.post('/batch-check', AuthMiddleware.authenticate(), followController.batchCheckFollowStatus);

// 检查两个用户是否互相关注
/**
 * @swagger
 * /api/follows/mutual/{user_id1}/{user_id2}:
 *   get:
 *     summary: 检查两个用户是否互相关注
 *     tags: [Follows]
 *     parameters:
 *       - in: path
 *         name: user_id1
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: user_id2
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 返回互关状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     mutual:
 *                       type: boolean
 */
router.get('/mutual/:user_id1/:user_id2', followController.checkMutualFollow);

// 获取互相关注列表
/**
 * @swagger
 * /api/follows/me/mutual:
 *   get:
 *     summary: 获取我与他人的互关用户列表
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 互关用户
 */
router.get('/me/mutual', AuthMiddleware.authenticate(), followController.getMyMutualFollowings);
/**
 * @swagger
 * /api/follows/user/{user_id}/mutual:
 *   get:
 *     summary: 获取指定用户的互关列表
 *     tags: [Follows]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 互关用户
 */
router.get('/user/:user_id/mutual', followController.getMutualFollowings);

// 获取关注和粉丝数据（合并API）
/**
 * @swagger
 * /api/follows/me/data:
 *   get:
 *     summary: 获取我的关注/粉丝统计数据
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 综合数据
 */
router.get('/me/data', AuthMiddleware.authenticate(), followController.getMyFollowData);
/**
 * @swagger
 * /api/follows/user/{user_id}/data:
 *   get:
 *     summary: 获取指定用户的关注/粉丝数据
 *     tags: [Follows]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 综合数据
 */
router.get('/user/:user_id/data', followController.getUserFollowData);

module.exports = router;
