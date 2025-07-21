import request from '../request'

/**
 * 活动相关API
 */
export const eventApi = {
  /**
   * 获取活动列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.status - 活动状态
   * @param {string} params.sort - 排序方式
   * @param {string} params.keyword - 搜索关键词
   */
  getList(params = {}) {
    return request.get('/api/events', params)
  },

  /**
   * 获取推荐活动
   * @param {number} limit - 限制数量
   */
  getRecommended(limit = 6) {
    return request.get('/api/events/recommended', { limit })
  },

  /**
   * 获取即将开始的活动
   * @param {number} limit - 限制数量
   */
  getUpcoming(limit = 10) {
    return request.get('/api/events/upcoming', { limit })
  },

  /**
   * 获取活动详情
   * @param {string} id - 活动ID
   */
  getDetail(id) {
    return request.get(`/api/events/${id}`)
  },

  /**
   * 创建活动
   * @param {Object} eventData - 活动数据
   */
  create(eventData) {
    return request.post('/api/events', eventData)
  },

  /**
   * 更新活动
   * @param {string} id - 活动ID
   * @param {Object} eventData - 活动数据
   */
  update(id, eventData) {
    return request.put(`/api/events/${id}`, eventData)
  },

  /**
   * 删除活动
   * @param {string} id - 活动ID
   */
  delete(id) {
    return request.delete(`/api/events/${id}`)
  },

  /**
   * 报名活动
   * @param {string} id - 活动ID
   * @param {Object} formData - 报名表单数据
   */
  register(id, formData = {}) {
    return request.post(`/api/events/${id}/register`, formData)
  },

  /**
   * 取消报名
   * @param {string} id - 活动ID
   */
  cancelRegistration(id) {
    return request.delete(`/api/events/${id}/register`)
  },

  /**
   * 检查报名状态
   * @param {string} id - 活动ID
   */
  getRegistrationStatus(id) {
    return request.get(`/api/events/${id}/registration-status`)
  },

  /**
   * 获取我的报名列表
   * @param {Object} params - 查询参数
   */
  getMyRegistrations(params = {}) {
    return request.get('/api/registrations/my-registrations', params)
  },

  /**
   * 获取活动报名列表（管理员）
   * @param {string} eventId - 活动ID
   * @param {Object} params - 查询参数
   */
  getRegistrations(eventId, params = {}) {
    return request.get(`/api/events/${eventId}/registrations`, params)
  },

  /**
   * 签到
   * @param {string} registrationId - 报名记录ID
   */
  checkIn(registrationId) {
    return request.post(`/api/registrations/${registrationId}/check-in`)
  },

  /**
   * 获取报名统计
   * @param {string} eventId - 活动ID
   */
  getRegistrationStatistics(eventId) {
    return request.get(`/api/events/${eventId}/registration-statistics`)
  }
}

export default eventApi
