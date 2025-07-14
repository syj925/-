/**
 * 点赞相关API
 */

export default (http) => ({
  /**
   * 点赞
   * @param {String} targetType 点赞目标类型：post-帖子, comment-评论
   * @param {String} targetId 目标ID
   * @returns {Promise}
   */
  like: (targetType, targetId) => http.post('/api/likes', {
    target_type: targetType,
    target_id: targetId
  }),

  /**
   * 取消点赞
   * @param {String} targetType 点赞目标类型：post-帖子, comment-评论
   * @param {String} targetId 目标ID
   * @returns {Promise}
   */
  unlike: (targetType, targetId) => http.delete(`/api/likes/${targetType}/${targetId}`),

  /**
   * 检查是否点赞
   * @param {String} targetType 点赞目标类型：post-帖子, comment-评论
   * @param {String} targetId 目标ID
   * @returns {Promise}
   */
  checkLike: (targetType, targetId) => http.get(`/api/likes/check/${targetType}/${targetId}`),

  /**
   * 获取用户点赞列表
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise}
   */
  getUserLikes: (page = 1, pageSize = 20) => http.get('/api/likes/user/me', { page, pageSize }),

  /**
   * 获取目标的点赞列表
   * @param {String} targetType 目标类型
   * @param {String} targetId 目标ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise}
   */
  getTargetLikes: (targetType, targetId, page = 1, pageSize = 20) =>
    http.get(`/api/likes/${targetType}/${targetId}`, { page, pageSize })
});