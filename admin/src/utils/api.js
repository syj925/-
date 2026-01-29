import axios from 'axios';
import { API_BASE_URL } from '@/config';

// 创建axios实例
const instance = axios.create({
  baseURL: API_BASE_URL, // 后端API地址（从配置文件获取）
  timeout: 10000 // 请求超时时间
});

// 请求拦截器
instance.interceptors.request.use(
  config => {
    // 如果有token，添加到请求头
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    console.error('API请求错误:', error);

    if (error.response) {
      // 401未授权，转到登录页
      if (error.response.status === 401) {
        localStorage.removeItem('admin_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // 统一错误格式
      const errorData = error.response.data || {};
      const errorMessage = errorData.message || errorData.msg || '服务器错误';

      return Promise.reject({
        success: false,
        message: errorMessage,
        code: errorData.code,
        data: errorData.data,
        status: error.response.status
      });
    }

    return Promise.reject({
      success: false,
      message: '网络错误，请检查网络连接',
      code: -1
    });
  }
);

// API接口
export default {
  // 管理员登录
  login: (username, password) => {
    return instance.post('/admin/login', { username, password });
  },
  
  // 仪表盘
  dashboard: {
    getData: () => instance.get('/admin/dashboard'),
    getTrendData: (period) => instance.get('/admin/dashboard/trend', { params: { period } }),
    getUserDistribution: () => instance.get('/admin/dashboard/user-distribution'),
    // 在线统计相关API
    getOnlineStats: () => instance.get('/admin/stats/online/dashboard'),
    getOnlineCount: () => instance.get('/admin/stats/online/count'),
    getDetailedStats: () => instance.get('/admin/stats/online/detailed')
  },
  
  // 用户管理
  users: {
    getList: (params) => instance.get('/admin/users', { params }),
    getOne: (id) => instance.get(`/admin/users/${id}`),
    update: (id, data) => instance.put(`/admin/users/${id}`, data),
    delete: (id) => instance.delete(`/admin/users/${id}`),
    // 获取待审核用户列表
    getPendingUsers: (params) => instance.get('/admin/users/pending', { params }),
    // 审核用户
    auditUser: (id, action, reason = null) => instance.put(`/admin/users/${id}/audit`, { action, reason }),
    // 获取用户注册拒绝记录
    getRejectionLogs: (params) => instance.get('/admin/users/rejection-logs', { params }),
    // 搜索用户
    search: (params) => instance.get('/admin/users/search', { params })
  },
  
  // 帖子管理
  posts: {
    getList: (params) => instance.get('/admin/posts', { params }),
    getOne: (id) => instance.get(`/admin/posts/${id}`),
    update: (id, data) => instance.put(`/admin/posts/${id}`, data),
    delete: (id) => instance.delete(`/admin/posts/${id}`),
    // 获取待审核帖子列表
    getPendingPosts: (params) => instance.get('/admin/posts/pending', { params }),
    // 审核帖子
    auditPost: (id, action, reason = null) => instance.put(`/admin/posts/${id}/audit`, { action, reason }),
    // 设置/取消推荐帖子
    recommend: (id, data) => instance.put(`/admin/posts/${id}/recommend`, data)
  },
  
  // 评论管理
  comments: {
    getList: (params) => instance.get('/admin/comments', { params }),
    update: (id, data) => instance.put(`/admin/comments/${id}`, data),
    delete: (id) => instance.delete(`/admin/comments/${id}`),
    // 获取待审核评论列表
    getPendingComments: (params) => instance.get('/admin/comments/pending', { params }),
    // 审核评论
    auditComment: (id, action) => instance.put(`/admin/comments/${id}/audit`, { action }),
    // 获取帖子评论列表
    getPostComments: (postId, params) => instance.get(`/posts/${postId}/comments`, { params })
  },
  
  // 话题管理
  topics: {
    getList: (params) => instance.get('/admin/topics', { params }),
    create: (data) => instance.post('/admin/topics', data),
    update: (id, data) => instance.put(`/admin/topics/${id}`, data),
    delete: (id) => instance.delete(`/admin/topics/${id}`),
    // 设置热门状态
    setHotStatus: (id, isHot) => instance.patch(`/admin/topics/${id}/hot`, { is_hot: isHot }),
    // 新增API方法（保留兼容性）
    getStatistics: (params) => instance.get('/admin/topics/statistics', { params }),
    batchOperate: (data) => instance.post('/admin/topics/batch', data),
    merge: (data) => instance.post('/admin/topics/merge', data),
    updateSeo: (id, data) => instance.put(`/admin/topics/${id}/seo`, data),
    updateReviewConfig: (id, data) => instance.put(`/admin/topics/${id}/review-config`, data),
    // 获取待审核话题图片列表
    getPendingTopicImages: (params) => instance.get('/admin/topics/pending-images', { params }),
    // 审核话题图片
    reviewTopicImage: (id, data) => instance.put(`/admin/topics/${id}/review-image`, data)
  },
  
  // 标签管理
  tags: {
    // 获取标签列表
    getList: (params) => instance.get('/tags', { params }),
    // 获取单个标签详情
    getOne: (id) => instance.get(`/tags/${id}`),
    // 创建标签
    create: (data) => instance.post('/tags', data),
    // 更新标签
    update: (id, data) => instance.put(`/tags/${id}`, data),
    // 删除标签
    delete: (id) => instance.delete(`/tags/${id}`),
    // 设置/取消热门标签
    toggleHot: (id) => instance.patch(`/tags/${id}/toggle-hot`),
    // 启用/禁用标签
    toggleStatus: (id) => instance.patch(`/tags/${id}/toggle-status`),
    // 获取指定分类的标签
    getByCategory: (category, limit) => instance.get(`/tags/category/${category}`, { params: { limit } }),
    // 获取热门标签
    getHotTags: (limit) => instance.get('/tags/hot', { params: { limit } })
  },
  
  // 活动管理
  events: {
    getList: (params) => instance.get('/admin/events', { params }),
    create: (data) => instance.post('/admin/events', data),
    update: (id, data) => instance.put(`/admin/events/${id}`, data),
    delete: (id) => instance.delete(`/admin/events/${id}`),
    // 获取活动详情
    getDetail: (id) => instance.get(`/admin/events/${id}`),
    // 获取活动报名列表
    getRegistrations: (eventId, params) => instance.get(`/admin/events/${eventId}/registrations`, { params }),
    // 更新报名状态
    updateRegistrationStatus: (eventId, registrationId, data) => 
      instance.put(`/admin/events/${eventId}/registrations/${registrationId}/status`, data),
    // 批量更新报名状态
    batchUpdateRegistrationStatus: (eventId, data) => 
      instance.put(`/admin/events/${eventId}/registrations/batch-status`, data),
    // 获取所有报名数据（用于导出）
    getAllRegistrations: (eventId) => 
      instance.get(`/admin/events/${eventId}/registrations/export`, {
        params: { _t: new Date().getTime() } // 添加时间戳参数，避免304缓存
      }),
    // 删除报名记录
    deleteRegistration: (eventId, registrationId) => 
      instance.delete(`/admin/events/${eventId}/registrations/${registrationId}`)
  },
  
  // 系统设置
  settings: {
    get: () => instance.get('/admin/settings'),
    update: (data) => instance.put('/admin/settings', data),
    initRecommendSettings: () => instance.post('/admin/settings/init-recommendation'),
    initSearchSettings: () => instance.post('/admin/settings/init-search')
  },

  // 推荐算法管理 v2.0
  recommendation: {
    getSettings: () => instance.get('/admin/recommendation/settings'),
    updateSettings: (data) => instance.put('/admin/recommendation/settings', data),
    initSettings: () => instance.post('/admin/recommendation/init'),
    clearCache: () => instance.delete('/admin/recommendation/cache'),
    getStats: () => instance.get('/admin/recommendation/stats'),
    test: (params) => instance.get('/admin/recommendation/test', { params }),
    recalculate: () => instance.post('/admin/recommendation/recalculate'), // 🆕 v2.0新增：触发分数重新计算
    analyzePost: (postId) => instance.post('/admin/recommendation/analyze', { postId }), // 🆕 v2.0新增：分析帖子分数详情
    
    // 🆕 v2.0新增：自动更新控制
    startAutoUpdate: (config) => instance.post('/admin/recommendation/auto-update/start', config),
    stopAutoUpdate: () => instance.post('/admin/recommendation/auto-update/stop'),
    getAutoUpdateStatus: () => instance.get('/admin/recommendation/auto-update/status'),
    
    // 🆕 v2.0新增：预设配置管理
    getPresets: () => instance.get('/admin/recommendation/presets'), // 获取预设配置列表
    applyPreset: (presetId) => instance.post('/admin/recommendation/presets/apply', { presetId }), // 应用预设配置
    exportConfig: () => instance.get('/admin/recommendation/export'), // 导出当前配置
    importConfig: (configData) => instance.post('/admin/recommendation/import', { configData }) // 导入自定义配置
  },
  
  // 用户徽章管理
  badge: {
    // 获取管理后台徽章列表（支持搜索和筛选）
    getAdminList: (params) => instance.get('/admin/badges', { params }),
    // 获取单个徽章详情
    getOne: (id) => instance.get(`/admin/badges/${id}`),
    // 创建新徽章
    create: (data) => instance.post('/admin/badges', data),
    // 更新徽章信息
    update: (id, data) => instance.put(`/admin/badges/${id}`, data),
    // 删除徽章
    delete: (id) => instance.delete(`/admin/badges/${id}`),
    // 更新徽章状态
    updateStatus: (id, data) => instance.patch(`/admin/badges/${id}/status`, data),
    // 获取徽章统计信息
    getStatistics: () => instance.get('/admin/badges/statistics'),
    // 获取徽章授予记录
    getGrants: (badgeId, params) => instance.get(`/admin/badges/${badgeId}/grants`, { params }),
    
    // 批量操作
    batchGrant: (data) => instance.post('/admin/badges/batch-grant', data),
    batchRevoke: (data) => instance.post('/admin/badges/batch-revoke', data),
    
    // 单个撤销和可见性控制
    revokeBadge: (data) => instance.post('/admin/badges/revoke', data),
    updateVisibility: (data) => instance.post('/admin/badges/visibility', data),
    
    // 自动授予徽章检查
    checkAutoGrant: (userId) => instance.post('/admin/badges/check-auto-grant', { userId }),
    
    // 用户徽章管理
    getUserBadges: (userId, includeHidden = false) => instance.get(`/admin/users/${userId}/badges`, {
      params: { includeHidden }
    }),
    grantUserBadge: (userId, badgeId, grantedBy) => instance.post(`/admin/badges/grant`, {
      userId,
      badgeId,
      grantedBy
    }),
    // 删除徽章使用 revokeBadge API
    // revokeUserBadge: (userId, badgeId) => instance.delete(`/admin/users/${userId}/badges/${badgeId}`),
    
    // 用户徽章显示设置
    updateUserBadgeDisplay: (userId, badgeId, data) => 
      instance.put(`/admin/users/${userId}/badges/${badgeId}/display`, data)
  },
  
  // 标签管理
  tags: {
    // 获取标签列表
    getList: (params) => {
      return instance.get('/tags', { params }).then(response => {
        // 转换数据格式以匹配前端期望
        if (response.success && response.data) {
          return {
            ...response,
            data: {
              tags: response.data.items || [],
              pagination: {
                total: response.data.total || 0,
                page: response.data.page || 1,
                limit: response.data.limit || 10,
                totalPages: response.data.totalPages || 0
              }
            }
          };
        }
        return response;
      });
    },
    // 获取单个标签
    getOne: (id) => instance.get(`/tags/${id}`),
    // 创建标签
    create: (data) => instance.post('/tags', data),
    // 更新标签
    update: (id, data) => instance.put(`/tags/${id}`, data),
    // 删除标签
    delete: (id) => instance.delete(`/tags/${id}`),
    // 切换热门状态
    toggleHot: (id) => instance.patch(`/tags/${id}/toggle-hot`),
    // 切换标签状态 
    toggleStatus: (id) => instance.patch(`/tags/${id}/toggle-status`),
    // 批量更新状态
    batchUpdateStatus: (data) => instance.patch('/tags/batch/status', data),
    // 获取统计信息
    getStatistics: () => instance.get('/tags/admin/statistics'),
    // 获取热门标签
    getHot: (params) => instance.get('/tags/hot', { params }),
    // 根据分类获取标签
    getByCategory: (category, params) => instance.get(`/tags/category/${category}`, { params })
  },
  
  // 日志查询
  logs: {
    getList: (params) => instance.get('/admin/logs', { params })
  },
  
  content: {
    // 轮播图管理
    getBanners: (params) => {
      console.log('正在请求轮播图API, 参数:', params);
      // 添加时间戳参数，避免304缓存响应
      const timestamp = new Date().getTime();
      const enhancedParams = { ...params, _t: timestamp };
      
      // 修改请求路径，使用正确的路由
      return instance.get('/banners', { params: enhancedParams })
        .then(response => {
          console.log('轮播图API原始响应:', response);
          
          // 处理后端直接返回数据对象的情况（非标准包装格式）
          if (response && response.items && response.totalItems !== undefined) {
            // 构建标准格式的响应
            return {
              success: true,
              data: {
                items: response.items,
                total: response.totalItems
              },
              message: '成功'
            };
          } else if (response && response.data) {
            // 已经是标准格式
            return response;
          } else {
            console.warn('轮播图API响应格式异常:', response);
            // 构建一个空的标准格式响应
            return {
              success: true,
              data: {
                items: [],
                total: 0
              },
              message: '返回数据格式不完整'
            };
          }
        })
        .catch(error => {
          console.error('轮播图API错误:', error);
          // 尝试提取更详细的错误信息
          const errorMessage = error.response?.data?.message || error.message || '未知错误';
          console.error('错误详情:', errorMessage);
          throw error;
        });
    },
    getBanner: (id) => instance.get(`/banners/${id}`),
    createBanner: (data) => instance.post('/banners', data),
    updateBanner: (id, data) => instance.put(`/banners/${id}`, data),
    deleteBanner: (id) => instance.delete(`/banners/${id}`),
    updateBannerStatus: (id, data) => instance.put(`/banners/${id}/status`, data),
    getBannerStats: (id) => instance.get(`/banners/${id}/statistics`),

    // 分类管理
    getCategories: (params) => {
      console.log('正在请求分类API, 参数:', params);
      // 添加时间戳参数，避免304缓存响应
      const timestamp = new Date().getTime();
      const enhancedParams = { 
        ...params, 
        _t: timestamp,
        includeInactive: true // 增加参数，表示包含禁用的分类
      };
      
      return instance.get('/content/categories', { params: enhancedParams })
        .then(response => {
          console.log('分类API原始响应:', response);
          
          // 处理后端直接返回数据对象的情况（非标准包装格式）
          if (response && response.items && response.totalItems !== undefined) {
            // 构建标准格式的响应
            return {
              success: true,
              data: {
                rows: response.items,
                total: response.totalItems
              },
              message: '成功'
            };
          } else if (response && response.data) {
            // 已经是标准格式
            return response;
          } else {
            console.warn('分类API响应格式异常:', response);
            // 构建一个空的标准格式响应
            return {
              success: true,
              data: {
                rows: [],
                total: 0
              },
              message: '返回数据格式不完整'
            };
          }
        })
        .catch(error => {
          console.error('分类API错误:', error);
          // 尝试提取更详细的错误信息
          const errorMessage = error.response?.data?.message || error.message || '未知错误';
          console.error('错误详情:', errorMessage);
          throw error;
        });
    },
    getCategory: (id) => instance.get(`/content/categories/${id}`),
    getCategoriesByType: (type, params) => instance.get(`/content/categories/type/${type}`, { params }),
    createCategory: (data) => instance.post('/content/admin/categories', data),
    updateCategory: (id, data) => instance.put(`/content/admin/categories/${id}`, data),
    deleteCategory: (id) => instance.delete(`/content/admin/categories/${id}`),
    
    // 消息管理
    messages: {
      // 系统通知相关
      getSystemMessages: (params) => instance.get('/admin/messages/system', { params }),
      getSystemMessageDetail: (id) => instance.get(`/admin/messages/system/${id}`),
      createSystemMessage: (data) => instance.post('/admin/messages/system', data),
      deleteSystemMessage: (id) => instance.delete(`/admin/messages/system/${id}`),
      getSystemMessageStats: () => instance.get('/admin/messages/system/stats'),
      getSystemMessageRecipients: (id, params) => instance.get(`/admin/messages/system/${id}/recipients`, { params }),
      
      // 用户互动消息相关
      getInteractionMessages: (params) => instance.get('/admin/messages/interaction', { params }),
      getInteractionMessageDetail: (id) => instance.get(`/admin/messages/interaction/${id}`),
      deleteInteractionMessage: (id) => instance.delete(`/admin/messages/interaction/${id}`),
      
      // 用户搜索 - 用于发送系统消息时选择用户
      searchUsers: (query) => instance.get('/admin/users/search', { params: { query } })
    }
  },

  // 表情管理
  emoji: {
    // 表情包管理
    getPacks: (params) => instance.get('/admin/emoji-packs', { params }),
    getPackById: (id) => instance.get(`/admin/emoji-packs/${id}`),
    createPack: (data) => instance.post('/admin/emoji-packs', data),
    updatePack: (id, data) => instance.put(`/admin/emoji-packs/${id}`, data),
    deletePack: (id) => instance.delete(`/admin/emoji-packs/${id}`),
    
    // 表情管理
    createEmoji: (data) => instance.post('/admin/emojis', data),
    updateEmoji: (id, data) => instance.put(`/admin/emojis/${id}`, data),
    deleteEmoji: (id) => instance.delete(`/admin/emojis/${id}`),
    
    // 审核管理
    getPendingEmojis: (params) => instance.get('/admin/emojis/pending', { params }),
    reviewEmoji: (id, data) => instance.post(`/admin/emojis/${id}/review`, data),
    
    // 同步使用计数
    syncUseCounts: () => instance.post('/admin/emojis/sync-counts'),
    
    // 清除缓存
    clearCache: () => instance.post('/admin/emojis/clear-cache')
  },

  // 配置版本管理
  config: {
    // 获取当前配置版本信息
    getCurrentVersion: () => instance.get('/admin/config-version'),

    // 获取版本历史
    getVersionHistory: () => instance.get('/admin/config-versions'),

    // 发布新版本
    publishVersion: (data) => instance.post('/admin/config-version', data),

    // 回滚到指定版本
    rollbackToVersion: (data) => instance.post('/admin/config-rollback', data)
  }
};