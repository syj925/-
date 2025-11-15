/**
 * 标签相关API
 */

export default (http) => ({
  /**
   * 获取热门标签
   * @param {number} limit 限制数量
   * @returns {Promise}
   */
  getHotTags: (limit = 10) => {
    return http.get('/api/tags/hot', { limit });
  },

  /**
   * 根据分类获取标签
   * @param {string} category 标签分类
   * @param {number} limit 限制数量
   * @returns {Promise}
   */
  getTagsByCategory: (category, limit = 30) => {
    return http.get(`/api/tags/category/${category}`, { limit });
  },

  /**
   * 获取标签列表（管理员）
   * @param {Object} params 查询参数
   * @returns {Promise}
   */
  getTagList: (params = {}) => {
    return http.get('/api/tags', params);
  },

  /**
   * 获取单个标签详情
   * @param {string} id 标签ID
   * @returns {Promise}
   */
  getTagById: (id) => {
    return http.get(`/api/tags/${id}`);
  }
});

