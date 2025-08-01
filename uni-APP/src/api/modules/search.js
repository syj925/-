/**
 * 搜索相关API
 */

export default (http) => ({
  /**
   * 全局搜索
   * @param {Object} params 搜索参数
   * @param {string} params.keyword 搜索关键词
   * @param {string} params.type 搜索类型 all|posts|users|topics
   * @param {number} params.page 页码
   * @param {number} params.pageSize 每页数量
   * @returns {Promise}
   */
  globalSearch: (params) => {
    return http.get('/api/search', params);
  },

  /**
   * 搜索帖子
   * @param {Object} params 搜索参数
   * @param {string} params.keyword 搜索关键词
   * @param {number} params.page 页码
   * @param {number} params.pageSize 每页数量
   * @param {number} params.categoryId 分类ID
   * @param {number} params.topicId 话题ID
   * @returns {Promise}
   */
  searchPosts: (params) => {
    return http.get('/api/search/posts', params);
  },

  /**
   * 搜索用户
   * @param {Object} params 搜索参数
   * @param {string} params.keyword 搜索关键词
   * @param {number} params.page 页码
   * @param {number} params.pageSize 每页数量
   * @returns {Promise}
   */
  searchUsers: (params) => {
    return http.get('/api/search/users', params);
  },

  /**
   * 搜索话题
   * @param {Object} params 搜索参数
   * @param {string} params.keyword 搜索关键词
   * @param {number} params.page 页码
   * @param {number} params.pageSize 每页数量
   * @returns {Promise}
   */
  searchTopics: (params) => {
    return http.get('/api/search/topics', params);
  },

  /**
   * 获取搜索建议
   * @param {Object} params 参数
   * @param {string} params.keyword 搜索关键词
   * @param {number} params.limit 限制数量
   * @returns {Promise}
   */
  getSearchSuggestions: (params) => {
    return http.get('/api/search/suggestions', params);
  },

  /**
   * 获取搜索建议（别名方法）
   * @param {Object} params 参数
   * @param {string} params.keyword 搜索关键词
   * @param {number} params.limit 限制数量
   * @returns {Promise}
   */
  getSuggestions: (params) => {
    return http.get('/api/search/suggestions', params);
  },

  /**
   * 获取热门搜索
   * @param {Object} params 参数
   * @param {number} params.limit 限制数量
   * @returns {Promise}
   */
  getHotSearches: (params) => {
    return http.get('/api/search/hot', params);
  },

  /**
   * 保存搜索历史
   * @param {Object} data 搜索数据
   * @param {string} data.keyword 搜索关键词
   * @param {string} data.type 搜索类型
   * @returns {Promise}
   */
  saveSearchHistory: (data) => {
    return http.post('/api/search/history', data);
  },

  /**
   * 获取搜索历史
   * @param {Object} params 参数
   * @param {number} params.limit 限制数量
   * @returns {Promise}
   */
  getSearchHistory: (params) => {
    return http.get('/api/search/history', params);
  },

  /**
   * 清除搜索历史
   * @returns {Promise}
   */
  clearSearchHistory: () => {
    return http.delete('/api/search/history');
  }
});
