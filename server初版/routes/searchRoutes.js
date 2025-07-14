const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// 全局搜索
router.get('/', searchController.search);

// 搜索帖子
router.get('/posts', searchController.searchPosts);

// 获取热门搜索词
router.get('/hot', searchController.getHotSearches);

// 获取搜索建议
router.get('/suggestions', searchController.getSuggestions);

// 搜索用户
router.get('/users', searchController.searchUsers);

// 搜索话题
router.get('/topics', searchController.searchTopics);

module.exports = router; 