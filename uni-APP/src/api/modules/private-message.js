/**
 * 私信相关API
 */

export default (http) => ({
  /**
   * 发送私信
   * @param {Object} data 私信数据
   * @param {String} data.receiverId 接收者ID
   * @param {String} data.content 消息内容
   * @returns {Promise}
   */
  send: (data) => http.post('/api/private-messages', data),

  /**
   * 获取私信对话列表
   * @param {Object} params 查询参数
   * @param {Number} params.page 页码
   * @param {Number} params.pageSize 每页大小
   * @returns {Promise}
   */
  getConversations: (params = {}) => http.get('/api/private-messages/conversations', { params }),

  /**
   * 获取与指定用户的私信记录
   * @param {String} userId 用户ID
   * @param {Object} params 查询参数
   * @param {Number} params.page 页码
   * @param {Number} params.pageSize 每页大小
   * @returns {Promise}
   */
  getMessages: (userId, params = {}) => http.get(`/api/private-messages/conversation/${userId}`, { params }),

  /**
   * 删除私信
   * @param {String} messageId 消息ID
   * @returns {Promise}
   */
  delete: (messageId) => http.delete(`/api/private-messages/${messageId}`),

  /**
   * 标记与指定用户的私信对话为已读
   * @param {String} userId 用户ID
   * @returns {Promise}
   */
  markConversationAsRead: (userId) => http.put(`/api/private-messages/conversation/${userId}/read`)
});