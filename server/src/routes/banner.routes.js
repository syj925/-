const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/banner.controller');
const { AuthMiddleware, AdminMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

// 请求体验证模式
const createBannerSchema = Joi.object({
  title: Joi.string().min(1).max(100).required()
    .messages({
      'string.base': '轮播图标题必须是字符串',
      'string.empty': '轮播图标题不能为空',
      'string.min': '轮播图标题长度不能小于{#limit}个字符',
      'string.max': '轮播图标题长度不能超过{#limit}个字符',
      'any.required': '轮播图标题是必填项'
    }),
  image: Joi.string().custom((value, helpers) => {
      // 允许完整URL或相对路径
      if (!value) return helpers.error('any.required');

      // 检查是否是完整URL
      if (value.startsWith('http://') || value.startsWith('https://')) {
        try {
          new URL(value);
          return value;
        } catch (error) {
          return helpers.error('string.uri');
        }
      }

      // 检查是否是相对路径（以/开头）
      if (value.startsWith('/')) {
        return value;
      }

      return helpers.error('string.format');
    }).required()
    .messages({
      'string.base': '轮播图图片必须是字符串',
      'string.empty': '轮播图图片不能为空',
      'string.uri': '轮播图图片URL格式不正确',
      'string.format': '轮播图图片必须是完整URL或以/开头的相对路径',
      'any.required': '轮播图图片是必填项'
    }),
  linkType: Joi.string().valid('url', 'post', 'topic', 'event', 'page').default('url')
    .messages({
      'string.base': '链接类型必须是字符串',
      'any.only': '链接类型只能是url、post、topic、event或page'
    }),
  linkValue: Joi.string().max(255).allow('', null)
    .messages({
      'string.base': '链接值必须是字符串',
      'string.max': '链接值长度不能超过{#limit}个字符'
    }),
  targetId: Joi.string().uuid().allow(null)
    .messages({
      'string.base': '目标ID必须是字符串',
      'string.uuid': '目标ID必须是有效的UUID'
    }),
  scene: Joi.string().valid('home', 'discover', 'search-main', 'search-topic').default('home')
    .messages({
      'string.base': '展示场景必须是字符串',
      'any.only': '展示场景只能是home、discover、search-main或search-topic'
    }),
  platform: Joi.string().valid('app', 'web', 'admin', 'all').default('all')
    .messages({
      'string.base': '展示平台必须是字符串',
      'any.only': '展示平台只能是app、web、admin或all'
    }),
  sortOrder: Joi.number().integer().min(0).default(0)
    .messages({
      'number.base': '排序权重必须是数字',
      'number.integer': '排序权重必须是整数',
      'number.min': '排序权重不能小于{#limit}'
    }),
  priority: Joi.number().integer().min(0).default(0)
    .messages({
      'number.base': '优先级必须是数字',
      'number.integer': '优先级必须是整数',
      'number.min': '优先级不能小于{#limit}'
    }),
  status: Joi.string().valid('active', 'inactive').default('active')
    .messages({
      'string.base': '状态必须是字符串',
      'any.only': '状态只能是active或inactive'
    }),
  startTime: Joi.date().allow(null)
    .messages({
      'date.base': '开始时间必须是有效的日期'
    }),
  endTime: Joi.date().min(Joi.ref('startTime')).allow(null)
    .messages({
      'date.base': '结束时间必须是有效的日期',
      'date.min': '结束时间必须晚于开始时间'
    }),
  tags: Joi.array().items(Joi.string()).allow(null)
    .messages({
      'array.base': '标签必须是数组',
      'string.base': '标签项必须是字符串'
    })
});

const updateBannerSchema = Joi.object({
  title: Joi.string().min(1).max(100),
  image: Joi.string().custom((value, helpers) => {
    // 允许完整URL或相对路径
    if (!value) return value;

    // 检查是否是完整URL
    if (value.startsWith('http://') || value.startsWith('https://')) {
      try {
        new URL(value);
        return value;
      } catch (error) {
        return helpers.error('string.uri');
      }
    }

    // 检查是否是相对路径（以/开头）
    if (value.startsWith('/')) {
      return value;
    }

    return helpers.error('string.format');
  }).messages({
    'string.uri': '轮播图图片URL格式不正确',
    'string.format': '轮播图图片必须是完整URL或以/开头的相对路径'
  }),
  linkType: Joi.string().valid('url', 'post', 'topic', 'event', 'page'),
  linkValue: Joi.string().max(255).allow('', null),
  targetId: Joi.string().uuid().allow(null),
  scene: Joi.string().valid('home', 'discover', 'search-main', 'search-topic'),
  platform: Joi.string().valid('app', 'web', 'admin', 'all'),
  sortOrder: Joi.number().integer().min(0),
  priority: Joi.number().integer().min(0),
  status: Joi.string().valid('active', 'inactive'),
  startTime: Joi.date().allow(null),
  endTime: Joi.date().min(Joi.ref('startTime')).allow(null),
  tags: Joi.array().items(Joi.string()).allow(null)
});

const sortBannersSchema = Joi.object({
  banners: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid().required(),
      sortOrder: Joi.number().integer().min(0).required()
    })
  ).required()
    .messages({
      'array.base': '轮播图列表必须是数组',
      'any.required': '轮播图列表是必填项'
    })
});

const recordClickSchema = Joi.object({
  bannerId: Joi.string().uuid().required()
    .messages({
      'string.base': '轮播图ID必须是字符串',
      'string.uuid': '轮播图ID必须是有效的UUID',
      'any.required': '轮播图ID是必填项'
    }),
  scene: Joi.string().valid('home', 'discover', 'search-main', 'search-topic').default('home'),
  platform: Joi.string().valid('app', 'web').default('app')
});

const recordViewSchema = Joi.object({
  bannerIds: Joi.array().items(Joi.string().uuid()).required()
    .messages({
      'array.base': '轮播图ID列表必须是数组',
      'string.uuid': '轮播图ID必须是有效的UUID',
      'any.required': '轮播图ID列表是必填项'
    }),
  scene: Joi.string().valid('home', 'discover', 'search-main', 'search-topic').default('home'),
  platform: Joi.string().valid('app', 'web').default('app')
});

// 公开接口 - 获取轮播图
router.get('/', bannerController.getList);
router.get('/scene/:scene', bannerController.getBannersByScene);

// 公开接口 - 记录统计
router.post('/click', 
  Validator.validateBody(recordClickSchema), 
  bannerController.recordClick
);
router.post('/view', 
  Validator.validateBody(recordViewSchema), 
  bannerController.recordView
);

// 需要登录的接口
router.get('/:id/statistics', 
  AuthMiddleware.authenticate(), 
  bannerController.getStatistics
);

// 管理员接口 - 轮播图管理
router.post('/', 
  AdminMiddleware.authenticate(),
  Validator.validateBody(createBannerSchema),
  bannerController.create
);

router.get('/:id', 
  AdminMiddleware.authenticate(),
  bannerController.getBannerById
);

router.put('/:id', 
  AdminMiddleware.authenticate(),
  Validator.validateBody(updateBannerSchema),
  bannerController.update
);

router.delete('/:id', 
  AdminMiddleware.authenticate(),
  bannerController.delete
);

router.put('/sort/order', 
  AdminMiddleware.authenticate(),
  Validator.validateBody(sortBannersSchema),
  bannerController.updateSortOrder
);

module.exports = router;
