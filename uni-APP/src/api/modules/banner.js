/**
 * 轮播图相关API
 * 采用项目统一的API模块结构
 */

export default (http) => ({
  /**
   * 获取轮播图列表
   * @param {Object} params - 查询参数
   * @param {string} params.platform - 平台类型 (app/web/all)
   * @param {string} params.status - 状态 (active/inactive)
   * @param {number} params.limit - 限制数量
   * @param {string} params.scene - 场景 (home/discover/search-main/search-topic)
   */
  getList: (params = {}) => http.get('/api/banners', {
    platform: 'app',
    status: 'active',
    limit: 10,
    ...params
  }),

  /**
   * 根据场景获取轮播图
   * @param {string} scene - 场景名称
   * @param {Object} params - 查询参数
   */
  getBannersByScene: (scene, params = {}) => http.get(`/api/banners/scene/${scene}`, {
    platform: 'app',
    status: 'active',
    limit: 10,
    ...params
  }),

  /**
   * 根据ID获取轮播图详情
   * @param {string} id - 轮播图ID
   */
  getBannerById: (id) => http.get(`/api/banners/${id}`),

  /**
   * 记录轮播图点击
   * @param {string} bannerId - 轮播图ID
   * @param {string} scene - 场景
   * @param {string} platform - 平台
   */
  recordClick: (bannerId, scene = 'home', platform = 'app') => http.post('/api/banners/click', {
    bannerId,
    scene,
    platform
  }),

  /**
   * 记录轮播图展示
   * @param {Array|string} bannerIds - 轮播图ID或ID数组
   * @param {string} scene - 场景
   * @param {string} platform - 平台
   */
  recordView: (bannerIds, scene = 'home', platform = 'app') => http.post('/api/banners/view', {
    bannerIds: Array.isArray(bannerIds) ? bannerIds : [bannerIds],
    scene,
    platform
  }),

  /**
   * 获取轮播图统计数据
   * @param {string} bannerId - 轮播图ID
   * @param {Object} dateRange - 日期范围
   */
  getStatistics: (bannerId, dateRange = {}) => http.get(`/api/banners/${bannerId}/statistics`, dateRange)
})
