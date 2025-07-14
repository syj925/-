/**
 * 话题相关API
 */

export default (http) => ({
  /**
   * 获取话题列表
   * @param {Object} params 查询参数 (page, pageSize, keyword, status, orderBy, orderDirection)
   * @returns {Promise}
   */
  getList: (params = {}) => http.get('/api/topics', params),

  /**
   * 获取热门话题
   * @param {Number} limit 返回数量，默认10
   * @returns {Promise}
   */
  getHot: (limit = 10) => http.get('/api/topics/hot', { limit }),

  /**
   * 获取趋势话题
   * @param {Number} limit 返回数量，默认10
   * @returns {Promise}
   */
  getTrending: (limit = 10) => http.get('/api/topics/trending', { limit }),

  /**
   * 搜索话题
   * @param {String} keyword 搜索关键词
   * @param {Number} limit 返回数量，默认10
   * @returns {Promise}
   */
  search: (keyword, limit = 10) => http.get('/api/topics/search', { keyword, limit }),

  /**
   * 获取话题详情
   * @param {String|Number} id 话题ID
   * @returns {Promise}
   */
  getDetail: (id) => http.get(`/api/topics/${id}`),

  /**
   * 获取话题统计信息
   * @param {String|Number} id 话题ID
   * @returns {Promise}
   */
  getStatistics: (id) => http.get(`/api/topics/${id}/statistics`),

  /**
   * 记录话题浏览量
   * @param {String|Number} id 话题ID
   * @returns {Promise}
   */
  recordView: (id) => http.post(`/api/topics/${id}/view`),

  /**
   * 获取话题下的帖子
   * @param {String|Number} id 话题ID
   * @param {Object} params 查询参数 (page, pageSize, orderBy, orderDirection)
   * @returns {Promise}
   */
  getPosts: (id, params = {}) => http.get(`/api/topics/${id}/posts`, params),

  /**
   * 创建话题（管理员）
   * @param {Object} data 话题数据
   * @returns {Promise}
   */
  create: (data) => http.post('/api/topics', data),

  /**
   * 创建话题（普通用户）
   * @param {Object} data 话题数据
   * @returns {Promise}
   */
  createByUser: (data) => http.post('/api/topics/create', data)
})