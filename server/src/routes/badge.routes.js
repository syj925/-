const express = require('express');
const badgeController = require('../controllers/badge.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const RateLimitMiddleware = require('../middlewares/rate-limit.middleware');

const router = express.Router();

/**
 * 徽章相关路由（前端API）
 */

// 公开路由 - 无需认证
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

// 公开的用户徽章路由（无需认证）
router.get('/user/:userId',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 200 }),
  validationMiddleware.validateUUID('userId'),
  badgeController.getUserBadgesPublic
);

// 需要认证的路由
router.use(authMiddleware.authenticate);

router.get('/user/:userId/stats',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  validationMiddleware.validateUUID('userId'),
  badgeController.getUserBadgeStats
);

// 当前用户徽章相关路由
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
