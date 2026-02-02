const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const { AuthMiddleware, RateLimitMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

/**
 * @swagger
 * components:
 *   schemas:
 *     Favorite:
 *       type: object
 *       required:
 *         - post_id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 收藏记录ID
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: 收藏用户ID
 *         post_id:
 *           type: string
 *           format: uuid
 *           description: 收藏的帖子ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 收藏时间
 */

/**
 * @swagger
 * tags:
 *   name: Favorites
 *   description: 收藏管理API
 */

// 请求体验证模式
const favoriteSchema = Joi.object({
  post_id: Joi.string().uuid().required()
    .messages({
      'string.base': '帖子ID必须是字符串',
      'string.uuid': '帖子ID必须是有效的UUID格式',
      'any.required': '帖子ID是必填项'
    })
});

// 收藏和取消收藏路由
/**
 * @swagger
 * /api/favorites:
 *   post:
 *     summary: 收藏帖子
 *     tags: [Favorites]
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
 *             properties:
 *               post_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: 收藏成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Favorite'
 */
router.post('/', AuthMiddleware.authenticate(), RateLimitMiddleware.favoritePostLimiter(), Validator.validateBody(favoriteSchema), favoriteController.addFavorite);
/**
 * @swagger
 * /api/favorites/{post_id}:
 *   delete:
 *     summary: 取消收藏帖子
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: post_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 取消收藏成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
router.delete('/:post_id', AuthMiddleware.authenticate(), favoriteController.removeFavorite);

// 获取收藏列表路由
/**
 * @swagger
 * /api/favorites/user/me:
 *   get:
 *     summary: 获取我的收藏列表
 *     tags: [Favorites]
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
 *         description: 收藏分页数据
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
 *                         $ref: '#/components/schemas/Favorite'
 *                     pagination:
 *                       type: object
 */
router.get('/user/me', AuthMiddleware.authenticate(), favoriteController.getUserFavorites);
/**
 * @swagger
 * /api/favorites/post/{post_id}:
 *   get:
 *     summary: 获取收藏指定帖子的用户
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: post_id
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
 *         description: 收藏用户分页数据
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
 *                         $ref: '#/components/schemas/Favorite'
 *                     pagination:
 *                       type: object
 */
router.get('/post/:post_id', favoriteController.getPostFavoriteUsers);

// 检查是否已收藏路由
/**
 * @swagger
 * /api/favorites/check/{post_id}:
 *   get:
 *     summary: 检查当前用户是否收藏帖子
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: post_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 收藏状态
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
 *                     favorited:
 *                       type: boolean
 */
router.get('/check/:post_id', favoriteController.isFavorited);

module.exports = router; 
