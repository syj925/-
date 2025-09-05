const express = require('express');
const adminBadgeController = require('../../controllers/admin/badge.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const adminMiddleware = require('../../middlewares/admin.middleware');
const validationMiddleware = require('../../middlewares/validation.middleware');
const RateLimitMiddleware = require('../../middlewares/rate-limit.middleware');

const router = express.Router();

/**
 * 管理后台徽章路由
 * 注意：在主路由 admin.routes.js 中已经应用了管理员认证中间件
 * 这里的路由会被挂载到 /api/admin/badges 下
 */

// 徽章管理路由
router.get('/',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 200 }),
  adminBadgeController.getBadgeList
);

router.get('/search',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  adminBadgeController.searchBadges
);

router.get('/statistics',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  adminBadgeController.getBadgeStatistics
);

router.get('/recent',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  adminBadgeController.getRecentlyGranted
);

router.get('/:id',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 200 }),
  validationMiddleware.validateUUID('id'),
  adminBadgeController.getBadgeDetail
);

router.get('/:badgeId/users',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  validationMiddleware.validateUUID('badgeId'),
  adminBadgeController.getBadgeUsers
);

router.get('/:badgeId/grants',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  validationMiddleware.validateUUID('badgeId'),
  adminBadgeController.getBadgeGrants
);

// 创建徽章
router.post('/',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 30 }),
  validationMiddleware.validateBody({
    type: 'object',
    properties: {
      name: { 
        type: 'string', 
        minLength: 2, 
        maxLength: 50 
      },
      description: { 
        type: 'string', 
        maxLength: 500 
      },
      color: { 
        type: 'string', 
        pattern: '^#[0-9A-Fa-f]{6}$' 
      },
      type: { 
        type: 'string', 
        enum: ['achievement', 'interest', 'system'] 
      },
      rarity: { 
        type: 'string', 
        enum: ['common', 'rare', 'epic', 'legendary'] 
      },
      autoGrant: { 
        type: 'boolean' 
      },
      grantCondition: { 
        type: ['object', 'null'] 
      },
      sortOrder: { 
        type: 'integer', 
        minimum: 0 
      },
      status: { 
        type: 'string', 
        enum: ['active', 'inactive'] 
      }
    },
    required: ['name'],
    additionalProperties: false
  }),
  adminBadgeController.createBadge
);

// 更新徽章
router.put('/:id',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  validationMiddleware.validateUUID('id'),
  validationMiddleware.validateBody({
    type: 'object',
    properties: {
      name: { 
        type: 'string', 
        minLength: 2, 
        maxLength: 50 
      },
      description: { 
        type: 'string', 
        maxLength: 500 
      },
      color: { 
        type: 'string', 
        pattern: '^#[0-9A-Fa-f]{6}$' 
      },
      type: { 
        type: 'string', 
        enum: ['achievement', 'interest', 'system'] 
      },
      rarity: { 
        type: 'string', 
        enum: ['common', 'rare', 'epic', 'legendary'] 
      },
      autoGrant: { 
        type: 'boolean' 
      },
      grantCondition: { 
        type: ['object', 'null'] 
      },
      sortOrder: { 
        type: 'integer', 
        minimum: 0 
      },
      status: { 
        type: 'string', 
        enum: ['active', 'inactive'] 
      }
    },
    additionalProperties: false,
    minProperties: 1
  }),
  adminBadgeController.updateBadge
);

// 更新徽章状态
router.patch('/:id/status',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  validationMiddleware.validateUUID('id'),
  validationMiddleware.validateBody({
    type: 'object',
    properties: {
      status: { 
        type: 'string', 
        enum: ['active', 'inactive'] 
      }
    },
    required: ['status'],
    additionalProperties: false
  }),
  adminBadgeController.updateBadgeStatus
);

// 删除徽章
router.delete('/:id',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 20 }),
  validationMiddleware.validateUUID('id'),
  adminBadgeController.deleteBadge
);

// 用户徽章管理
router.post('/grant',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  validationMiddleware.validateBody({
    type: 'object',
    properties: {
      userId: { 
        type: 'string',
        format: 'uuid'
      },
      badgeId: { 
        type: 'string',
        format: 'uuid'
      }
    },
    required: ['userId', 'badgeId'],
    additionalProperties: false
  }),
  adminBadgeController.grantUserBadge
);

router.post('/revoke',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  validationMiddleware.validateBody({
    type: 'object',
    properties: {
      userId: { 
        type: 'string',
        format: 'uuid'
      },
      badgeId: { 
        type: 'string',
        format: 'uuid'
      }
    },
    required: ['userId', 'badgeId'],
    additionalProperties: false
  }),
  adminBadgeController.revokeUserBadge
);

router.post('/batch-grant',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  validationMiddleware.validateBody({
    type: 'object',
    properties: {
      grants: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            userId: { 
              type: 'string',
              format: 'uuid'
            },
            badgeId: { 
              type: 'string',
              format: 'uuid'
            }
          },
          required: ['userId', 'badgeId'],
          additionalProperties: false
        },
        minItems: 1,
        maxItems: 100
      }
    },
    required: ['grants'],
    additionalProperties: false
  }),
  adminBadgeController.batchGrantBadges
);

// 撤销用户徽章
router.post('/revoke',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  validationMiddleware.validateBody({
    type: 'object',
    properties: {
      userId: { 
        type: 'string',
        format: 'uuid'
      },
      badgeId: { 
        type: 'string',
        format: 'uuid'
      }
    },
    required: ['userId', 'badgeId'],
    additionalProperties: false
  }),
  adminBadgeController.revokeUserBadge
);

// 更新徽章可见性
router.post('/visibility',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  validationMiddleware.validateBody({
    type: 'object',
    properties: {
      userId: { 
        type: 'string',
        format: 'uuid'
      },
      badgeId: { 
        type: 'string',
        format: 'uuid'
      },
      isVisible: {
        type: 'boolean'
      }
    },
    required: ['userId', 'badgeId', 'isVisible'],
    additionalProperties: false
  }),
  adminBadgeController.updateBadgeVisibility
);

// 批量撤销徽章
router.post('/batch-revoke',
  RateLimitMiddleware.createLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
  validationMiddleware.validateBody({
    type: 'object',
    properties: {
      revokes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            userId: { 
              type: 'string',
              format: 'uuid'
            },
            badgeId: { 
              type: 'string',
              format: 'uuid'
            }
          },
          required: ['userId', 'badgeId'],
          additionalProperties: false
        },
        minItems: 1,
        maxItems: 100
      }
    },
    required: ['revokes'],
    additionalProperties: false
  }),
  adminBadgeController.batchRevokeBadges
);

module.exports = router;
