const express = require('express');
const badgeController = require('../controllers/badge.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const RateLimitMiddleware = require('../middlewares/rate-limit.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Badge:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 徽章ID
 *         name:
 *           type: string
 *           description: 徽章名称
 *         description:
 *           type: string
 *           description: 徽章描述
 *         icon:
 *           type: string
 *           description: 徽章图标URL
 *         criteria:
 *           type: string
 *           description: 授予条件
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   name: Badges
 *   description: 用户徽章API
 */

/**
 * 徽章相关路由（前端API）
 */

// 公开路由 - 无需认证
/**
 * @swagger
 * /api/badges:
 *   get:
 *     summary: 获取所有徽章
 *     tags: [Badges]
 *     responses:
 *       200:
 *         description: 徽章列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Badge'
 * /api/badges/search:
 *   get:
 *     summary: 搜索徽章
 *     tags: [Badges]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 匹配的徽章
 * /api/badges/recent:
 *   get:
 *     summary: 获取最近授予的徽章
 *     tags: [Badges]
 *     responses:
 *       200:
 *         description: 最近授予列表
 * /api/badges/{id}:
 *   get:
 *     summary: 获取徽章详情
 *     tags: [Badges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 徽章详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Badge'
 * /api/badges/{badgeId}/users:
 *   get:
 *     summary: 获取获得某徽章的用户
 *     tags: [Badges]
 *     parameters:
 *       - in: path
 *         name: badgeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 用户列表
 * /api/badges/user/{userId}:
 *   get:
 *     summary: 获取用户公开徽章
 *     tags: [Badges]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 徽章信息
 */
router.get('/', 
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), // 15分钟100次请求
  badgeController.getBadges
);

router.get('/search',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 50 }), // 15分钟50次搜索
  badgeController.searchBadges
);

router.get('/recent',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 30 }), // 15分钟30次请求
  badgeController.getRecentlyGranted
);

router.get('/:id',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  validationMiddleware.validateUUID('id'),
  badgeController.getBadgeDetail
);

router.get('/:badgeId/users',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  validationMiddleware.validateUUID('badgeId'),
  badgeController.getBadgeUsers
);

router.get('/user/:userId',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 200 }),
  validationMiddleware.validateUUID('userId'),
  badgeController.getUserBadgesPublic
);

// 需要认证的路由
router.use(authMiddleware.authenticate);

/**
 * @swagger
 * /api/badges/user/{userId}/stats:
 *   get:
 *     summary: 获取用户徽章统计
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 统计信息
 * /api/badges/my/badges:
 *   get:
 *     summary: 获取当前用户徽章
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 徽章列表
 * /api/badges/my/stats:
 *   get:
 *     summary: 获取当前用户徽章统计
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 统计信息
 * /api/badges/my/check-auto-grant:
 *   post:
 *     summary: 检查自动授予徽章
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 检查结果
 * /api/badges/my/badges/{badgeId}/display:
 *   put:
 *     summary: 更新徽章展示设置
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: badgeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isVisible:
 *                 type: boolean
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 更新成功
 * /api/badges/my/badges/order:
 *   put:
 *     summary: 批量更新徽章排序
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               badgeOrders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     badgeId:
 *                       type: string
 *                     displayOrder:
 *                       type: integer
 *                 minItems: 1
 *     responses:
 *       200:
 *         description: 排序已更新
 */
router.get('/user/:userId/stats',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  validationMiddleware.validateUUID('userId'),
  badgeController.getUserBadgeStats
);

router.get('/my/badges',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 200 }),
  badgeController.getMyBadges
);

router.get('/my/stats',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  badgeController.getMyBadgeStats
);

router.post('/my/check-auto-grant',
  RateLimitMiddleware.createLimiter({ windowMs: 5 * 60 * 1000, max: 10 }), // 5分钟10次检查
  badgeController.checkAutoGrant
);

router.put('/my/badges/:badgeId/display',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  validationMiddleware.validateUUID('badgeId'),
  validationMiddleware.validateBody({
    type: 'object',
    properties: {
      isVisible: { type: 'boolean' },
      displayOrder: { 
        type: 'integer', 
        minimum: 0 
      }
    },
    additionalProperties: false,
    minProperties: 1
  }),
  badgeController.updateBadgeDisplay
);

router.put('/my/badges/order',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 20 }),
  validationMiddleware.validateBody({
    type: 'object',
    properties: {
      badgeOrders: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            badgeId: { 
              type: 'string',
              format: 'uuid'
            },
            displayOrder: { 
              type: 'integer', 
              minimum: 0 
            }
          },
          required: ['badgeId', 'displayOrder'],
          additionalProperties: false
        },
        minItems: 1
      }
    },
    required: ['badgeOrders'],
    additionalProperties: false
  }),
  badgeController.updateBadgesOrder
);

module.exports = router;
