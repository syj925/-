const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { AuthMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

// 请求体验证模式
const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(50).required()
    .messages({
      'string.base': '分类名称必须是字符串',
      'string.empty': '分类名称不能为空',
      'string.min': '分类名称长度不能小于{#limit}个字符',
      'string.max': '分类名称长度不能超过{#limit}个字符',
      'any.required': '分类名称是必填项'
    }),
  icon: Joi.string().max(255).optional()
    .messages({
      'string.base': '图标必须是字符串',
      'string.max': '图标长度不能超过{#limit}个字符'
    }),
  sort: Joi.number().integer().min(0).optional()
    .messages({
      'number.base': '排序必须是数字',
      'number.integer': '排序必须是整数',
      'number.min': '排序不能小于{#limit}'
    })
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(1).max(50).optional()
    .messages({
      'string.base': '分类名称必须是字符串',
      'string.min': '分类名称长度不能小于{#limit}个字符',
      'string.max': '分类名称长度不能超过{#limit}个字符'
    }),
  icon: Joi.string().max(255).optional()
    .messages({
      'string.base': '图标必须是字符串',
      'string.max': '图标长度不能超过{#limit}个字符'
    }),
  sort: Joi.number().integer().min(0).optional()
    .messages({
      'number.base': '排序必须是数字',
      'number.integer': '排序必须是整数',
      'number.min': '排序不能小于{#limit}'
    })
}).min(1);

const sortCategorySchema = Joi.object({
  sortData: Joi.array().items(
    Joi.object({
      id: Joi.number().integer().required(),
      sort: Joi.number().integer().min(0).required()
    })
  ).min(1).required()
    .messages({
      'array.base': '排序数据必须是数组',
      'array.min': '排序数据不能为空',
      'any.required': '排序数据是必填项'
    })
});

// 公开路由
router.get('/', categoryController.getAllCategories);
router.get('/search', categoryController.searchCategories);
router.get('/:id', categoryController.getCategoryById);

// 管理员路由
router.post('/', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), Validator.validateBody(createCategorySchema), categoryController.createCategory);
router.put('/:id', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), Validator.validateBody(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), categoryController.deleteCategory);
router.post('/sort', AuthMiddleware.authenticate(), AuthMiddleware.authorize('admin'), Validator.validateBody(sortCategorySchema), categoryController.updateCategorySort);

module.exports = router; 