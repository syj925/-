/**
 * 表情相关API
 */

export default (http) => ({
  // ==================== 公开API ====================

  /**
   * 获取初始化数据
   * @param {number} version 客户端当前版本号
   * @returns {Promise}
   */
  getInitData: (version = 0) => http.get('/api/emojis/init', { version }),

  /**
   * 获取表情包列表
   * @param {Object} params 查询参数
   * @returns {Promise}
   */
  getPacks: (params = {}) => http.get('/api/emojis/packs', params),

  /**
   * 获取表情包详情
   * @param {string} packId 表情包ID
   * @returns {Promise}
   */
  getPackById: (packId) => http.get(`/api/emojis/packs/${packId}`),

  /**
   * 搜索表情
   * @param {string} keyword 搜索关键字
   * @param {number} limit 数量限制
   * @returns {Promise}
   */
  search: (keyword, limit = 50) => http.get('/api/emojis/search', { keyword, limit }),

  /**
   * 获取热门表情
   * @param {number} limit 数量限制
   * @returns {Promise}
   */
  getHot: (limit = 30) => http.get('/api/emojis/hot', { limit }),

  // ==================== 用户API ====================

  /**
   * 获取用户个人表情数据（独立于全局版本号）
   * 包括：收藏、最近使用、自定义表情、用户表情包
   * @returns {Promise}
   */
  getUserData: () => http.get('/api/emojis/user-data'),

  /**
   * 记录表情使用
   * @param {string} emojiId 表情ID
   * @returns {Promise}
   */
  recordUsage: (emojiId) => http.post('/api/emojis/usage', { emoji_id: emojiId }),

  /**
   * 获取最近使用的表情
   * @param {number} limit 数量限制
   * @returns {Promise}
   */
  getRecent: (limit = 30) => http.get('/api/emojis/recent', { limit }),

  /**
   * 获取收藏的表情
   * @returns {Promise}
   */
  getFavorites: () => http.get('/api/emojis/favorites'),

  /**
   * 收藏表情
   * @param {string} emojiId 表情ID
   * @returns {Promise}
   */
  addFavorite: (emojiId) => http.post('/api/emojis/favorites', { emoji_id: emojiId }),

  /**
   * 取消收藏表情
   * @param {string} emojiId 表情ID
   * @returns {Promise}
   */
  removeFavorite: (emojiId) => http.delete(`/api/emojis/favorites/${emojiId}`),

  /**
   * 获取用户拥有的表情包
   * @returns {Promise}
   */
  getUserPacks: () => http.get('/api/emojis/user/packs'),

  /**
   * 添加表情包到用户
   * @param {string} packId 表情包ID
   * @param {string} source 来源
   * @returns {Promise}
   */
  addPack: (packId, source = 'download') => http.post('/api/emojis/user/packs', { 
    pack_id: packId, 
    source 
  }),

  /**
   * 移除用户的表情包
   * @param {string} packId 表情包ID
   * @returns {Promise}
   */
  removePack: (packId) => http.delete(`/api/emojis/user/packs/${packId}`),

  // ==================== 自定义表情API ====================

  /**
   * 上传自定义表情
   * @param {Object} data 表情数据
   * @returns {Promise}
   */
  uploadCustom: (data) => http.post('/api/emojis/custom', data),

  /**
   * 获取用户的自定义表情列表
   * @param {string} status 状态筛选
   * @returns {Promise}
   */
  getCustomEmojis: (status = null) => http.get('/api/emojis/custom', { status })
});
