const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topic.controller');
const { AuthMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

// 请求体验证模式
const createTopicSchema = Joi.object({
  name: Joi.string().min(1).max(50).required()
    .messages({
      'string.base': '话题名称必须是字符串',
      'string.empty': '话题名称不能为空',
      'string.min': '话题名称长度不能小于{#limit}个字符',
      'string.max': '话题名称长度不能超过{#limit}个字符',
      'any.required': '话题名称是必填项'
    }),
  is_hot: Joi.boolean().optional()
    .messages({
      'boolean.base': '热门状态必须是布尔值'
    })
});

const updateTopicSchema = Joi.object({
  name: Joi.string().min(1).max(50).optional()
    .messages({
      'string.base': '话题名称必须是字符串',
      'string.min': '话题名称长度不能小于{#limit}个字符',
      'string.max': '话题名称长度不能超过{#limit}个字符'
    }),
  is_hot: Joi.boolean().optional()
    .messages({
      'boolean.base': '热门状态必须是布尔值'
    })
}).min(1);

const hotStatusSchema = Joi.object({
  isHot: Joi.boolean().required()
    .messages({
      'boolean.base': '热门状态必须是布尔值',
      'any.required': '热门状态是必填项'
    })
});

const createTopicByUserSchema = Joi.object({
  name: Joi.string().min(2).max(20).required()
    .messages({
      'string.base': '话题名称必须是字符串',
      'string.empty': '话题名称不能为空',
      'string.min': '话题名称至少需要2个字符',
      'string.max': '话题名称不能超过20个字符',
      'any.required': '话题名称是必填项'
    }),
  description: Joi.string().max(100).optional().allow('')
    .messages({
      'string.base': '话题描述必须是字符串',
      'string.max': '话题描述不能超过100个字符'
    }),
  cover_image: Joi.string().optional().allow('')
    .messages({
      'string.base': '封面图片必须是字符串'
    })
});

// 公开路由
router.get('/', topicController.getAllTopics);
router.get('/hot', topicController.getHotTopics);
router.get('/trending', topicController.getTrendingTopics);
router.get('/search', topicController.searchTopics);
router.get('/:id', topicController.getTopicById);
router.get('/:id/posts', topicController.getTopicPosts);
router.get('/:id/statistics', topicController.getTopicStatistics);
router.post('/:id/view', topicController.recordTopicView);

// 用户创建话题路由
router.post('/create', AuthMiddleware.authenticate(), Validator.validateBody(createTopicByUserSchema), topicController.createTopicByUser);

// 管理员路由
router.post('/', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), Validator.validateBody(createTopicSchema), topicController.createTopic);
router.put('/:id', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), Validator.validateBody(updateTopicSchema), topicController.updateTopic);
router.delete('/:id', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), topicController.deleteTopic);
router.put('/:id/hot', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), Validator.validateBody(hotStatusSchema), topicController.setHotStatus);

module.exports = router; 