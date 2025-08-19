/**
 * 关注相关API
 * 包含防抖和状态管理机制
 */

// 请求状态管理器
class FollowRequestManager {
  constructor() {
    // 存储正在进行的请求 {userId: {action: 'follow'|'unfollow', promise: Promise}}
    this.pendingRequests = new Map();
    // 最近操作的缓存 {userId: {action: 'follow'|'unfollow', timestamp: number}}
    this.recentOperations = new Map();
    // 防抖时间（毫秒）
    this.debounceTime = 1000;
  }

  /**
   * 执行关注/取消关注操作（带防抖）
   */
  async executeFollowAction(userId, action, apiCall) {
    const key = `${userId}`;
    
    // 检查是否有正在进行的请求
    if (this.pendingRequests.has(key)) {
      const pending = this.pendingRequests.get(key);
      // 如果是相同的操作，返回现有的Promise
      if (pending.action === action) {
        console.log(`防抖：复用正在进行的${action}请求 - 用户${userId}`);
        return pending.promise;
      } else {
        // 如果是相反的操作，等待当前请求完成后再执行
        console.log(`防抖：等待${pending.action}完成后执行${action} - 用户${userId}`);
        try {
          await pending.promise;
        } catch (e) {
          // 忽略错误，继续执行新操作
        }
      }
    }

    // 检查最近是否执行过相同操作
    const recent = this.recentOperations.get(key);
    if (recent && recent.action === action && (Date.now() - recent.timestamp) < this.debounceTime) {
      console.log(`防抖：${this.debounceTime}ms内重复${action}操作被忽略 - 用户${userId}`);
      throw new Error(`操作太频繁，请稍后再试`);
    }

    // 创建新的请求Promise
    const requestPromise = this.executeWithRetry(userId, action, apiCall);
    
    // 存储请求状态
    this.pendingRequests.set(key, {
      action,
      promise: requestPromise
    });

    try {
      const result = await requestPromise;
      
      // 记录成功的操作
      this.recentOperations.set(key, {
        action,
        timestamp: Date.now()
      });
      
      return result;
    } finally {
      // 清除pending状态
      this.pendingRequests.delete(key);
    }
  }

  /**
   * 带智能重试的请求执行
   */
  async executeWithRetry(userId, action, apiCall, retryCount = 0) {
    const maxRetries = 3; // 增加重试次数
    
    try {
      return await apiCall();
    } catch (error) {
      console.log(`${action}请求失败 - 用户${userId}:`, error.message);
      
      // 处理"已关注"或"未关注"的冲突错误
      if (this.isConflictError(error, action) && retryCount < maxRetries) {
        // 使用指数退避算法：首次重试200ms，然后800ms，最后1600ms
        const delayTime = 200 * Math.pow(2, retryCount * 2);
        console.log(`检测到状态冲突，${delayTime}ms后第${retryCount + 1}次重试...`);
        
        // 延迟重试，给Write-Back机制和缓存足够时间同步数据
        await this.delay(delayTime);
        return this.executeWithRetry(userId, action, apiCall, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * 判断是否为状态冲突错误
   * 注意：后端已实现幂等性处理，理论上不应该再出现这些错误
   */
  isConflictError(error, action) {
    const message = error.message || '';
    // 保留检测逻辑以防万一，但这些错误现在应该很少见了
    if (action === 'follow') {
      return message.includes('已关注') || message.includes('already following');
    } else if (action === 'unfollow') {
      return message.includes('未关注') || message.includes('not following');
    }
    return false;
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清理过期的操作记录
   */
  cleanup() {
    const now = Date.now();
    const expireTime = this.debounceTime * 2; // 清理2倍防抖时间之前的记录
    
    for (const [key, operation] of this.recentOperations.entries()) {
      if (now - operation.timestamp > expireTime) {
        this.recentOperations.delete(key);
      }
    }
  }
}

// 创建全局请求管理器实例
const followRequestManager = new FollowRequestManager();

// 定期清理过期记录
setInterval(() => {
  followRequestManager.cleanup();
}, 30000); // 每30秒清理一次

export default (http) => ({
  /**
   * 关注用户（带防抖）
   * @param {String|Number} userId 要关注的用户ID
   * @returns {Promise}
   */
  follow: (userId) => {
    return followRequestManager.executeFollowAction(
      userId,
      'follow',
      () => http.post('/api/follows', { user_id: userId })
    );
  },

  /**
   * 取消关注（带防抖）
   * @param {String|Number} userId 要取消关注的用户ID
   * @returns {Promise}
   */
  unfollow: (userId) => {
    return followRequestManager.executeFollowAction(
      userId,
      'unfollow',
      () => http.delete(`/api/follows/${userId}`)
    );
  },

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