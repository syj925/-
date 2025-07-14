const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { AuthMiddleware } = require('../middlewares');
const { Validator } = require('../utils');
const Joi = require('joi');

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

// 公开路由（不需要登录）
// 全局搜索
router.get('/', searchController.globalSearch);

// 搜索帖子
router.get('/posts', searchController.searchPosts);

// 搜索用户
router.get('/users', searchController.searchUsers);

// 搜索话题
router.get('/topics', searchController.searchTopics);

// 获取搜索建议
router.get('/suggestions', searchController.getSearchSuggestions);

// 获取热门搜索
router.get('/hot', searchController.getHotSearches);

// 需要登录的路由
// 保存搜索历史
router.post('/history',
  AuthMiddleware.authenticate(),
  Validator.validateBody(saveSearchHistorySchema),
  searchController.saveSearchHistory
);

// 获取搜索历史
router.get('/history', AuthMiddleware.authenticate(), searchController.getSearchHistory);

// 清除搜索历史
router.delete('/history', AuthMiddleware.authenticate(), searchController.clearSearchHistory);

module.exports = router;
