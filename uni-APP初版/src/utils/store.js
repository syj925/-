/**
 * 简单的状态管理工具
 * 用于在应用内共享状态
 */
import { reactive } from 'vue';
import config from './config.js';

const store = {
  // 状态数据
  state: reactive({
    // 用户相关
    user: null,
    token: '',
    isLogin: false,
    
    // 帖子相关
    posts: [],
    currentPost: null,
    
    // 话题相关
    hotTopics: [],
    
    // 缓存相关
    cachedUsers: {},
    cachedTopics: {},
    postStatuses: {}, // 新增：帖子状态缓存
    
    // 网络和API状态
    network: {
      isConnected: true,       // 网络是否连接
      networkType: 'unknown',  // 网络类型
      lastOnlineTime: Date.now() // 最后一次在线时间
    },
    apiAvailable: null,        // API是否可用（null=未知，true=可用，false=不可用）
    offlineMode: false,        // 是否处于离线模式
    apiBaseUrl: ''             // API基础URL
  }),
  
  // getter方法
  getters: {
    // 获取用户信息
    getUser() {
      return store.state.user;
    },
    
    // 判断是否登录
    isLogin() {
      return store.state.isLogin && !!store.state.token;
    },
    
    // 获取当前帖子
    getCurrentPost() {
      return store.state.currentPost;
    },
    
    // 获取指定ID的帖子
    getPost(postId) {
      // 先从帖子列表中查找
      const post = store.state.posts.find(post => post.id === postId);
      if (post) {
        return post;
      }
      
      // 如果是当前帖子，则返回当前帖子
      if (store.state.currentPost && store.state.currentPost.id === postId) {
        return store.state.currentPost;
      }
      
      return null;
    },
    
    // 获取帖子状态
    getPostStatus(postId) {
      return store.state.postStatuses[postId] || null;
    },
    
    // 获取热门话题
    getHotTopics() {
      return store.state.hotTopics;
    },
    
    // 获取网络状态
    getNetworkStatus() {
      return store.state.network;
    },
    
    // 判断API是否可用
    isApiAvailable() {
      return store.state.apiAvailable === true;
    },
    
    // 判断是否处于离线模式
    isOfflineMode() {
      return store.state.offlineMode === true;
    }
  },
  
  // 修改状态的方法
  mutations: {
    // 设置用户信息
    setUser(user) {
      // 处理用户标签数据
      if (user && user.tags) {
        // 如果标签是字符串，尝试解析为JSON
        if (typeof user.tags === 'string') {
          try {
            user.tags = JSON.parse(user.tags);
            console.log('store中成功解析用户标签数据:', user.tags);
          } catch (error) {
            console.error('store中解析用户标签失败:', error);
            user.tags = [];
          }
        } 
        // 确保tags是数组
        else if (!Array.isArray(user.tags)) {
          console.warn('store中用户标签不是数组格式，重置为空数组');
          user.tags = [];
        }
      }
      
      store.state.user = user;
      store.state.isLogin = !!user;
      
      // 同时更新本地存储
      if (user) {
        try {
          uni.setStorageSync('userInfo', JSON.stringify(user));
        } catch (error) {
          console.error('存储用户信息失败:', error);
        }
      }
    },
    
    // 设置token
    setToken(token) {
      store.state.token = token;
      // 同时存储到本地
      uni.setStorageSync('token', token);
    },
    
    // 设置登录状态
    setLoginStatus(status) {
      store.state.isLogin = status;
    },
    
    // 设置帖子列表
    setPosts(posts) {
      store.state.posts = posts;
    },
    
    // 添加新帖子到列表
    addPost(post) {
      store.state.posts.unshift(post);
    },
    
    // 设置当前帖子
    setCurrentPost(post) {
      store.state.currentPost = post;
    },
    
    // 更新帖子
    updatePost(postId, data) {
      // 更新列表中的帖子
      const index = store.state.posts.findIndex(post => post.id === postId);
      if (index !== -1) {
        store.state.posts[index] = { ...store.state.posts[index], ...data };
      }
      
      // 更新当前帖子
      if (store.state.currentPost && store.state.currentPost.id === postId) {
        store.state.currentPost = { ...store.state.currentPost, ...data };
      }
      
      // 如果数据包含点赞或收藏状态，同时更新帖子状态缓存
      if (data.isLiked !== undefined || data.isCollected !== undefined) {
        this.updatePostStatus(postId, data);
      }
    },
    
    // 更新帖子状态
    updatePostStatus(postId, statusData) {
      postId = parseInt(postId);
      
      // 获取当前状态
      const currentStatus = store.state.postStatuses[postId] || {};
      
      // 确保状态数据中的布尔字段是强制布尔类型
      const sanitizedStatusData = { ...statusData };
      if (statusData.isLiked !== undefined) {
        sanitizedStatusData.isLiked = statusData.isLiked === true;
      }
      if (statusData.isCollected !== undefined) {
        sanitizedStatusData.isCollected = statusData.isCollected === true;
      }
      
      // 合并新状态
      const newStatus = {
        ...currentStatus,
        ...sanitizedStatusData,
        _timestamp: Date.now()
      };
      
      // 更新内存状态
      store.state.postStatuses[postId] = newStatus;
      
      // 更新本地存储
      try {
        uni.setStorageSync(`post_status_${postId}`, JSON.stringify(newStatus));
      } catch (error) {
        console.error('缓存帖子状态失败:', error);
      }
      
      // 同步更新帖子列表和当前帖子
      const updateData = {};
      if (sanitizedStatusData.isLiked !== undefined) updateData.isLiked = sanitizedStatusData.isLiked;
      if (sanitizedStatusData.isCollected !== undefined) updateData.isCollected = sanitizedStatusData.isCollected;
      
      if (Object.keys(updateData).length > 0) {
        const index = store.state.posts.findIndex(post => post.id === postId);
        if (index !== -1) {
          store.state.posts[index] = { ...store.state.posts[index], ...updateData };
        }
        
        if (store.state.currentPost && store.state.currentPost.id === postId) {
          store.state.currentPost = { ...store.state.currentPost, ...updateData };
        }
      }
    },
    
    // 加载帖子状态
    loadPostStatus(postId) {
      postId = parseInt(postId);
      
      try {
        const cached = uni.getStorageSync(`post_status_${postId}`);
        if (cached) {
          const status = JSON.parse(cached);
          store.state.postStatuses[postId] = status;
          return status;
        }
      } catch (error) {
        console.error('读取帖子状态缓存失败:', error);
      }
      
      return null;
    },
    
    // 批量加载帖子状态
    loadPostStatuses(postIds) {
      const loadedStatuses = {};
      let count = 0;
      
      postIds.forEach(id => {
        const status = this.loadPostStatus(id);
        if (status) {
          loadedStatuses[id] = status;
          count++;
        }
      });
      
      console.log(`从本地存储加载了${count}/${postIds.length}个帖子状态`);
      return loadedStatuses;
    },
    
    // 删除帖子
    deletePost(postId) {
      store.state.posts = store.state.posts.filter(post => post.id !== postId);
      
      // 如果当前帖子被删除，清空当前帖子
      if (store.state.currentPost && store.state.currentPost.id === postId) {
        store.state.currentPost = null;
      }
      
      // 删除帖子状态
      if (store.state.postStatuses[postId]) {
        delete store.state.postStatuses[postId];
        try {
          uni.removeStorageSync(`post_status_${postId}`);
        } catch (error) {
          console.error('删除帖子状态缓存失败:', error);
        }
      }
    },
    
    // 设置热门话题
    setHotTopics(topics) {
      store.state.hotTopics = topics;
    },
    
    // 缓存用户信息
    cacheUser(userId, userData) {
      store.state.cachedUsers[userId] = userData;
    },
    
    // 缓存话题信息
    cacheTopic(topicId, topicData) {
      store.state.cachedTopics[topicId] = topicData;
    },
    
    // 清空用户数据（用于退出登录）
    clearUserData() {
      store.state.user = null;
      store.state.token = '';
      store.state.isLogin = false;
      
      // 清除本地存储的token
      uni.removeStorageSync('token');
    },
    
    // 设置网络状态
    setNetworkStatus(status) {
      store.state.network = {
        ...store.state.network,
        ...status,
        lastUpdateTime: Date.now()
      };
      
      // 如果网络已连接，更新最后在线时间
      if (status.isConnected) {
        store.state.network.lastOnlineTime = Date.now();
      }
      
      // 如果网络断开，自动进入离线模式
      if (status.isConnected === false) {
        store.state.offlineMode = true;
        store.state.apiAvailable = false;
      }
      
      console.log('网络状态已更新:', store.state.network);
    },
    
    // 设置API可用性
    setApiAvailability(isAvailable) {
      store.state.apiAvailable = isAvailable;
      
      // 如果API不可用但网络连接正常，可能设为离线模式
      if (!isAvailable && store.state.network.isConnected) {
        console.log('API不可用但网络已连接，可能是后端服务问题');
      }
      
      // 如果API可用，自动退出离线模式
      if (isAvailable) {
        store.state.offlineMode = false;
      }
      
      console.log('API可用性已更新:', store.state.apiAvailable);
    },
    
    // 设置离线模式
    setOfflineMode(enabled) {
      store.state.offlineMode = enabled;
      console.log(enabled ? '已进入离线模式' : '已退出离线模式');
      
      // 触发事件通知其他组件
      uni.$emit('offlineModeChanged', {
        enabled: enabled
      });
    }
  },
  
  // 初始化方法
  init() {
    // 从本地存储恢复用户信息
    try {
      // 从本地存储加载 token
      const token = uni.getStorageSync('token');
      if (token) {
        this.mutations.setToken(token);
        this.mutations.setLoginStatus(true);
      }
      
      // 从本地存储加载用户信息
      const userInfo = uni.getStorageSync('userInfo');
      if (userInfo) {
        try {
          this.state.user = JSON.parse(userInfo);
        } catch (error) {
          console.error('解析用户信息失败:', error);
        }
      }
      
      // 设置API基础URL
      this.state.apiBaseUrl = uni.getStorageSync('apiBaseUrl') || '';
      if (!this.state.apiBaseUrl) {
        // 如果本地没有存储，使用配置中的默认值
        try {
          this.state.apiBaseUrl = config.BASE_API_URL || '';
          // 保存到本地存储
          uni.setStorageSync('apiBaseUrl', this.state.apiBaseUrl);
        } catch (error) {
          console.error('加载API基础URL失败:', error);
        }
      }
      
      // 加载帖子状态
      this.loadPostStatusesFromStorage();
    } catch (error) {
      console.error('初始化全局状态时发生错误:', error);
    }
  },
  
  // 加载所有帖子状态
  loadPostStatusesFromStorage() {
    try {
      const storage = uni.getStorageInfoSync();
      const keys = storage.keys || [];
      
      // 过滤出帖子状态相关的键
      const postStatusKeys = keys.filter(key => key.startsWith('post_status_'));
      
      console.log(`发现${postStatusKeys.length}个帖子状态缓存`);
      
      // 加载每个帖子状态
      postStatusKeys.forEach(key => {
        try {
          const statusData = uni.getStorageSync(key);
          if (statusData) {
            const status = JSON.parse(statusData);
            const postId = parseInt(key.replace('post_status_', ''));
            
            // 检查时间戳，如果超过1天则删除
            const now = Date.now();
            const timestamp = status._timestamp || 0;
            
            if (now - timestamp > 86400000) { // 1天 = 24 * 60 * 60 * 1000 毫秒
              console.log(`帖子${postId}状态缓存已过期，删除`);
              uni.removeStorageSync(key);
            } else {
              store.state.postStatuses[postId] = status;
            }
          }
        } catch (err) {
          console.error(`加载帖子状态缓存失败: ${key}`, err);
        }
      });
      
      console.log('帖子状态缓存加载完成，共加载', Object.keys(store.state.postStatuses).length, '个');
    } catch (error) {
      console.error('加载帖子状态缓存失败:', error);
    }
  }
};

// 初始化store
store.init();

export default store; 