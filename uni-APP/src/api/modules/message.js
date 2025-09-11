/**
 * 消息相关API
 */

export default (http) => ({
  /**
   * 获取消息列表
   * @param {Object} params 查询参数 (page, pageSize, type)
   * @returns {Promise}
   */
  getList: (params = {}) => http.get('/api/messages', params),

  /**
   * 获取未读消息数
   * @returns {Promise}
   */
  getUnreadCount: () => http.get('/api/messages/unread-count'),

  /**
   * 标记消息已读
   * @param {String|Number} id 消息ID
   * @returns {Promise}
   */
  markAsRead: (id) => http.put(`/api/messages/${id}/read`),

  /**
   * 批量标记消息已读
   * @param {String} type 消息类型，可选
   * @returns {Promise}
   */
  readAll: (type) => {
    const data = type ? { type } : {};
    return http.put('/api/messages/read/multiple', data);
  }
});