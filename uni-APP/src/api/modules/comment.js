/**
 * 评论相关API
 */

export default (http) => ({
  /**
   * 获取帖子评论列表
   * @param {String|Number} postId 帖子ID
   * @param {Object} params 查询参数 (page, pageSize, sort)
   * @returns {Promise}
   */
  getList: (postId, params = {}) => http.get(`/api/posts/${postId}/comments`, params),

  /**
   * 发表评论
   * @param {Object} data 评论数据 (postId, content, replyTo?)
   * @returns {Promise}
   */
  create: (data) => http.post(`/api/comments`, data),

  /**
   * 删除评论
   * @param {String|Number} id 评论ID
   * @returns {Promise}
   */
  delete: (id) => http.delete(`/api/comments/${id}`),

  /**
   * 获取评论详情
   * @param {String|Number} id 评论ID
   * @returns {Promise}
   */
  getDetail: (id) => http.get(`/api/comments/${id}`),

  /**
   * 获取评论回复列表
   * @param {String|Number} id 评论ID
   * @param {Object} params 查询参数 (page, pageSize)
   * @returns {Promise}
   */
  getReplies: (id, params = {}) => http.get(`/api/comments/${id}/replies`, params),

  /**
   * 获取用户的评论
   * @param {Object} params 查询参数 (page, pageSize)
   * @returns {Promise}
   */
  getUserComments: (params = {}) => http.get('/api/comments/user/me', params),

  /**
   * 获取评论的多级回复树
   * @param {String} commentId 评论ID
   * @param {Number} maxLevel 最大层级
   * @returns {Promise}
   */
  getRepliesTree: (commentId, maxLevel = 3) => {
    return http.get(`/api/comments/${commentId}/replies-tree`, { maxLevel });
  },

  /**
   * 获取评论的直接回复
   * @param {String} commentId 评论ID
   * @param {Object} params 查询参数 (page, pageSize)
   * @returns {Promise}
   */
  getDirectReplies: (commentId, params = {}) => {
    return http.get(`/api/comments/${commentId}/direct-replies`, params);
  }
});