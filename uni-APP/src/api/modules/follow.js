/**
 * 关注相关API
 */

export default (http) => ({
  /**
   * 关注用户
   * @param {String|Number} userId 要关注的用户ID
   * @returns {Promise}
   */
  follow: (userId) => http.post('/api/follows', { userId }),

  /**
   * 取消关注
   * @param {String|Number} userId 要取消关注的用户ID
   * @returns {Promise}
   */
  unfollow: (userId) => http.delete('/api/follows', { userId }),

  /**
   * 获取我的关注列表
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise}
   */
  getMyFollowings: (page = 1, pageSize = 10) => http.get('/api/follows/me/followings', { page, pageSize }),

  /**
   * 获取我的粉丝列表
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise}
   */
  getMyFollowers: (page = 1, pageSize = 10) => http.get('/api/follows/me/followers', { page, pageSize }),

  /**
   * 检查是否关注
   * @param {String|Number} userId 目标用户ID
   * @returns {Promise}
   */
  checkFollow: (userId) => http.get(`/api/follows/check/${userId}`),

  /**
   * 获取用户关注和粉丝数量
   * @param {String|Number} userId 用户ID
   * @returns {Promise}
   */
  getUserCounts: (userId) => http.get(`/api/follows/user/${userId}/counts`),

  /**
   * 批量检查关注状态
   * @param {Array} userIds 用户ID数组
   * @returns {Promise}
   */
  batchCheckFollow: (userIds) => http.post('/api/follows/batch-check', { userIds }),

  /**
   * 检查两个用户是否互相关注
   * @param {String|Number} userId1 用户1 ID
   * @param {String|Number} userId2 用户2 ID
   * @returns {Promise}
   */
  checkMutualFollow: (userId1, userId2) => http.get(`/api/follows/mutual/${userId1}/${userId2}`),

  /**
   * 获取当前用户的互相关注列表
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise}
   */
  getMyMutualFollowings: (page = 1, pageSize = 20) => http.get('/api/follows/me/mutual', { page, pageSize }),

  /**
   * 获取指定用户的互相关注列表
   * @param {String|Number} userId 用户ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise}
   */
  getUserMutualFollowings: (userId, page = 1, pageSize = 20) => http.get(`/api/follows/user/${userId}/mutual`, { page, pageSize }),

  /**
   * 获取共同关注列表
   * @param {String|Number} userId1 用户1 ID
   * @param {String|Number} userId2 用户2 ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise}
   */
  getCommonFollowings: (userId1, userId2, page = 1, pageSize = 20) => http.get(`/api/follows/common/${userId1}/${userId2}`, { page, pageSize })
});