/**
 * 徽章相关API
 */

// 缓存和请求去重
const cache = new Map();
const pendingRequests = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

export default (http) => ({
  /**
   * 获取徽章列表
   * @param {Object} params - 查询参数
   * @param {string} params.type - 徽章类型：achievement、interest、system
   * @param {string} params.status - 徽章状态：active、inactive
   */
  getBadges: (params = {}) => {
    return http.get('/api/badges', params);
  },

  /**
   * 获取用户徽章列表
   * @param {string} userId - 用户ID
   * @param {Object} params - 查询参数
   * @param {string} params.type - 徽章类型
   * @param {boolean} params.includeHidden - 是否包含隐藏的徽章
   */
  getUserBadges: (userId, params = {}) => {
    const cacheKey = `${userId}_${JSON.stringify(params)}`;
    
    // 检查缓存
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log('🎯 使用缓存的徽章数据:', cacheKey);
      return Promise.resolve(cached.data);
    }
    
    // 检查是否有相同请求正在进行
    if (pendingRequests.has(cacheKey)) {
      console.log('⏳ 等待正在进行的徽章请求:', cacheKey);
      return pendingRequests.get(cacheKey);
    }
    
    // 发起新请求
    console.log('🚀 发起新的徽章请求:', cacheKey);
    const requestPromise = http.get(`/api/badges/user/${userId}`, params)
      .then(result => {
        // 缓存结果
        cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        
        // 清除pending状态
        pendingRequests.delete(cacheKey);
        
        return result;
      })
      .catch(error => {
        // 清除pending状态
        pendingRequests.delete(cacheKey);
        throw error;
      });
    
    // 添加到pending列表
    pendingRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
  },

  /**
   * 更新徽章显示设置
   * @param {string} badgeId - 徽章ID
   * @param {Object} data - 更新数据
   * @param {boolean} data.isVisible - 是否显示
   * @param {number} data.displayOrder - 显示顺序
   */
  updateBadgeDisplay: (badgeId, data) => {
    return http.put(`/api/badges/display/${badgeId}`, data);
  },

  /**
   * 批量更新徽章显示顺序
   * @param {Array} badgeOrders - 徽章顺序数组
   * @param {string} badgeOrders[].badgeId - 徽章ID
   * @param {number} badgeOrders[].displayOrder - 显示顺序
   */
  updateBadgesOrder: (badgeOrders) => {
    return http.put('/api/badges/order', { badgeOrders });
  },

  /**
   * 获取当前用户的徽章
   * @param {Object} params - 查询参数
   */
  getMyBadges: (params = {}) => {
    return http.get('/api/badges/my', params);
  }
});
