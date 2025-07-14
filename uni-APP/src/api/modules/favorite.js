/**
 * 收藏相关API
 */

export default (http) => ({
  /**
   * 收藏帖子
   * @param {String} postId 帖子ID
   * @returns {Promise}
   */
  favorite: (postId) => http.post('/api/favorites', { post_id: postId }),

  /**
   * 取消收藏
   * @param {String} postId 帖子ID
   * @returns {Promise}
   */
  unfavorite: (postId) => http.delete(`/api/favorites/${postId}`),

  /**
   * 获取用户收藏列表
   * @param {Object} params 查询参数 (page, pageSize)
   * @returns {Promise}
   */
  getUserFavorites: (params = {}) => http.get('/api/favorites/user/me', params),

  /**
   * 检查是否收藏
   * @param {String} postId 帖子ID
   * @returns {Promise}
   */
  checkFavorite: (postId) => http.get(`/api/favorites/check/${postId}`)
}); 