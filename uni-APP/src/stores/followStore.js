import { defineStore } from 'pinia'
import api from '@/api/index'

export const useFollowStore = defineStore('follow', {
  state: () => ({
    followMap: {}, // userId -> boolean 存储关注状态
    initialized: false, // 是否已初始化
    lastUpdateTime: 0, // 最后更新时间
    loading: false, // 是否正在加载
    error: null // 错误信息
  }),
  
  getters: {
    // 检查是否关注某个用户
    isFollowing: (state) => (userId) => {
      return !!state.followMap[userId]
    },
    
    // 检查是否已初始化
    isInitialized: (state) => state.initialized,
    
    // 获取关注的用户ID列表
    followingUserIds: (state) => {
      return Object.keys(state.followMap).filter(userId => state.followMap[userId])
    },
    
    // 获取关注总数
    followingCount: (state) => {
      return Object.values(state.followMap).filter(status => status).length
    }
  },
  
  actions: {
    // 设置初始化状态
    setInitialized(value) {
      this.initialized = value;
      this.lastUpdateTime = Date.now();
    },
    
    // 批量设置关注状态
    batchSetFollowStatus(statusMap) {
      this.followMap = {
        ...this.followMap,
        ...statusMap
      };
      this.lastUpdateTime = Date.now();
    },
    
    // 更新单个用户的关注状态
    updateFollowStatus(userId, isFollowing) {
      this.followMap[userId] = !!isFollowing;
      this.lastUpdateTime = Date.now();
    },
    
    // 设置加载状态
    setLoading(loading) {
      this.loading = loading;
    },
    
    // 设置错误信息
    setError(error) {
      this.error = error;
    },
    
    // 清除错误
    clearError() {
      this.error = null;
    },
    
    // 初始化关注状态（启动时调用）
    async initializeFollowData() {
      if (this.initialized) {
        return;
      }
      
      try {
        this.setLoading(true);
        this.clearError();
        
        // 分页获取当前用户的所有关注列表
        let page = 1;
        const pageSize = 50; // 较大的页面大小，减少请求次数
        let hasMore = true;
        const statusMap = {};
        
        while (hasMore) {
          const response = await api.follow.getMyFollowings(page, pageSize);
          
          if (response && response.code === 0 && response.data) {
            const { list, total, currentPage, totalPages } = response.data;
            
            // 将关注的用户ID列表转换为状态映射
            if (list && Array.isArray(list)) {
              list.forEach(user => {
                const userId = user.id || user.userId || user.user_id;
                if (userId) {
                  statusMap[userId] = true;
                  console.log(`🔍 Store初始化: 用户${userId}(${user.nickname || user.username}) -> 已关注`);
                } else {
                  console.warn('⚠️ 发现无效的用户对象:', user);
                }
              });
            }
            
            // 检查是否还有更多数据
            hasMore = currentPage < totalPages;
            page++;
          } else {
            hasMore = false;
          }
        }
        
        this.batchSetFollowStatus(statusMap);
        this.setInitialized(true);
        
        console.log(`初始化关注状态完成，共关注 ${Object.keys(statusMap).length} 个用户`);
        console.log('🔍 Store初始化后的关注状态映射:', statusMap);
        console.log('🔍 Store中的最终followMap:', this.followMap);
      } catch (error) {
        console.error('初始化关注状态失败:', error);
        this.setError(error.message || '初始化关注状态失败');
      } finally {
        this.setLoading(false);
      }
    },
    
    // 批量检查并更新关注状态
    async batchCheckFollowStatus(userIds) {
      if (!userIds || userIds.length === 0) {
        return;
      }
      
      // 过滤出尚未知晓状态的用户ID
      const uncheckedUserIds = userIds.filter(userId => 
        this.followMap[userId] === undefined
      );
      
      if (uncheckedUserIds.length === 0) {
        return;
      }
      
      try {
        this.setLoading(true);
        this.clearError();
        
        const response = await api.follow.batchCheckFollow(uncheckedUserIds);
        
        console.log('🔍 批量检查关注状态API响应:', response);
        
        if (response && (response.success || response.code === 0) && response.data) {
          // 直接使用 boolean 值
          const statusMap = {};
          Object.keys(response.data).forEach(userId => {
            const followStatus = response.data[userId];
            statusMap[userId] = !!followStatus;
          });
          
          this.batchSetFollowStatus(statusMap);
        }
      } catch (error) {
        console.error('批量检查关注状态失败:', error);
        this.setError(error.message || '检查关注状态失败');
      } finally {
        this.setLoading(false);
      }
    },
    
    // 关注用户
    async followUser(userId) {
      try {
        this.setLoading(true);
        this.clearError();
        
        const response = await api.follow.follow(userId);
        
        console.log('🔍 关注API响应:', response);
        
        if (response && (response.success || response.code === 0)) {
          // 更新为已关注状态
          this.updateFollowStatus(userId, true);
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('关注用户失败:', error);
        this.setError(error.message || '关注用户失败');
        return false;
      } finally {
        this.setLoading(false);
      }
    },
    
    // 取消关注用户
    async unfollowUser(userId) {
      try {
        this.setLoading(true);
        this.clearError();
        
        const response = await api.follow.unfollow(userId);
        
        console.log('🔍 取消关注API响应:', response);
        
        if (response && (response.success || response.code === 0)) {
          // 更新为未关注状态
          this.updateFollowStatus(userId, false);
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('取消关注失败:', error);
        this.setError(error.message || '取消关注失败');
        return false;
      } finally {
        this.setLoading(false);
      }
    },
    
    // 刷新关注状态（手动刷新时调用）
    async refreshFollowData() {
      this.initialized = false;
      await this.initializeFollowData();
    },
    
    // 清除所有关注状态数据
    clearFollowData() {
      this.followMap = {};
      this.initialized = false;
      this.lastUpdateTime = 0;
      this.clearError();
    }
  },
  
  // 持久化配置 - 使用uni-app存储
  persist: {
    key: 'campus-wall-follow-store',
    storage: {
      getItem(key) {
        return uni.getStorageSync(key);
      },
      setItem(key, value) {
        uni.setStorageSync(key, value);
      },
      removeItem(key) {
        uni.removeStorageSync(key);
      }
    },
    // 只持久化关注状态映射和初始化状态
    paths: ['followMap', 'initialized', 'lastUpdateTime']
  }
});
