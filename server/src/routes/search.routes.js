const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { AuthMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

/**
 * @swagger
 * components:
 *   schemas:
 *     SearchResult:
 *       type: object
 *       properties:
 *         keyword:
 *           type: string
 *         type:
 *           type: string
 *           enum: [all, posts, users, topics]
 *         items:
 *           type: array
 *           items:
 *             type: object
 *           description: 匹配结果列表
 */

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: 全局搜索API
 */

/**
 * 搜索路由
 * 采用项目一致的做法：GET请求不做复杂验证，POST请求使用Joi验证
 */

// POST请求的验证模式
const saveSearchHistorySchema = Joi.object({
  keyword: Joi.string().min(1).max(100).required()
    .messages({
      'string.empty': '搜索关键词不能为空',
      'string.min': '搜索关键词长度必须在1-100字符之间',
      'string.max': '搜索关键词长度必须在1-100字符之间',
      'any.required': '搜索关键词是必填项'
    }),
  type: Joi.string().valid('all', 'posts', 'users', 'topics').optional()
    .messages({
      'any.only': '搜索类型必须是 all, posts, users, topics 之一'
    })
});

// 搜索路由（使用可选认证：有token时保存搜索历史）
/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: 全局搜索
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, posts, users, topics]
 *     responses:
 *       200:
 *         description: 搜索结果
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchResult'
 * /api/search/posts:
 *   get:
 *     summary: 搜索帖子
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 帖子搜索结果
 * /api/search/users:
 *   get:
 *     summary: 搜索用户
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 用户搜索结果
 * /api/search/topics:
 *   get:
 *     summary: 搜索话题
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 话题搜索结果
 * /api/search/suggestions:
 *   get:
 *     summary: 获取搜索建议
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 建议列表
 * /api/search/hot:
 *   get:
 *     summary: 获取热门搜索
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: 热门搜索关键词
 */
router.get('/', AuthMiddleware.optionalAuthenticate(), searchController.globalSearch);
router.get('/posts', AuthMiddleware.optionalAuthenticate(), searchController.searchPosts);
router.get('/users', AuthMiddleware.optionalAuthenticate(), searchController.searchUsers);
router.get('/topics', AuthMiddleware.optionalAuthenticate(), searchController.searchTopics);
router.get('/suggestions', searchController.getSearchSuggestions);
router.get('/hot', searchController.getHotSearches);

// 需要登录的路由
/**
 * @swagger
 * /api/search/history:
 *   post:
 *     summary: 保存搜索历史
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - keyword
 *             properties:
 *               keyword:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [all, posts, users, topics]
 *     responses:
 *       200:
 *         description: 保存成功
 *   get:
 *     summary: 获取搜索历史
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 搜索历史
 *   delete:
 *     summary: 清空搜索历史
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 已清空
 * /api/search/history/item:
 *   delete:
 *     summary: 删除单条搜索历史
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - keyword
 *             properties:
 *               keyword:
 *                 type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.post('/history',
  AuthMiddleware.authenticate(),
  Validator.validateBody(saveSearchHistorySchema),
  searchController.saveSearchHistory
);

router.get('/history', AuthMiddleware.authenticate(), searchController.getSearchHistory);

router.delete('/history/item', 
  AuthMiddleware.authenticate(), 
  Validator.validateBody(Joi.object({
    keyword: Joi.string().min(1).max(100).required()
      .messages({
        'string.empty': '搜索关键词不能为空',
        'string.min': '搜索关键词长度必须在1-100字符之间',
        'string.max': '搜索关键词长度必须在1-100字符之间',
        'any.required': '搜索关键词是必填项'
      })
  })),
  searchController.removeSearchHistory
);

router.delete('/history', AuthMiddleware.authenticate(), searchController.clearSearchHistory);

module.exports = router;
