// API请求工具类
import request from './request.js';
import config from './config.js';

// API接口对象
const api = {
  // 系统管理接口
  system: {
    // 获取系统健康状态
    healthCheck: () => {
      return request({
        url: '/health',
        method: 'GET'
      });
    }
  },

  // 用户认证相关接口
  auth: {
    // 用户注册
    register: (data) => {
      return request({
        url: '/auth/register',
        method: 'POST',
        data
      });
    },
    
    // 用户登录
    login: (data) => {
      return request({
        url: '/auth/login',
        method: 'POST',
        data
      });
    },
    
    // 获取当前用户信息
    getInfo: () => {
      return request({
        url: '/auth/me'
      }).then(response => {
        console.log('获取当前用户信息原始响应:', JSON.stringify(response));
        
        // 确保返回的数据结构一致
        if (response.success && response.data) {
          // 后端直接返回user对象，不需要额外处理
          // 保留此原始数据结构以便调试
          return response;
        }
        
        return response;
      }).catch(error => {
        console.error('获取用户信息异常:', error);
        throw error;
      });
    },
    
    // 更新用户信息
    updateInfo: (data) => {
      return request({
        url: '/auth/me',
        method: 'PUT',
        data
      });
    }
  },
  
  // 帖子相关接口
  posts: {
    // 获取帖子列表
    getList: (params) => {
      return request({
        url: '/posts',
        data: params
      });
    },
    
    // 获取推荐帖子
    getRecommended: (params) => {
      return request({
        url: '/posts/recommended',
        data: params
      });
    },
    
    // 获取单个帖子详情
    getDetail: (id, options = {}) => {
      // 确保id是合法值
      if (!id) {
        console.error('无效的帖子ID:', id);
        return Promise.reject({ success: false, message: '无效的帖子ID' });
      }
      
      // 构建URL
      const url = `/posts/${id}`;
      
      // 提取请求选项
      const { data = {}, headers = {} } = options;
      
      return request({
        url,
        data,
        headers
      });
    },
    
    // 获取单个帖子详情（别名方法，与getDetail功能相同）
    get: (id, options = {}) => {
      // 确保id是合法值
      if (!id) {
        console.error('无效的帖子ID:', id);
        return Promise.reject({ success: false, message: '无效的帖子ID' });
      }
      
      // 构建URL
      const url = `/posts/${id}`;
      
      // 提取请求选项
      const { data = {}, headers = {} } = options;
      
      return request({
        url,
        data,
        headers
      });
    },
    
    // 创建帖子
    create: (data) => {
      return request({
        url: '/posts',
        method: 'POST',
        data
      });
    },
    
    // 更新帖子
    update: (id, data) => {
      return request({
        url: `/posts/${id}`,
        method: 'PUT',
        data
      });
    },
    
    // 删除帖子
    delete: (id) => {
      return request({
        url: `/posts/${id}`,
        method: 'DELETE'
      });
    },
    
    // 点赞帖子
    like: (id) => {
      return request({
        url: `/posts/${id}/like`,
        method: 'POST'
      });
    },
    
    // 取消点赞
    unlike: (id) => {
      return request({
        url: `/posts/${id}/like`,
        method: 'DELETE'
      });
    },
    
    // 获取帖子状态
    getStatus: (id, options = {}) => {
      return request({
        url: `/posts/${id}/status`,
        method: 'GET',
        data: options.data || {
          _t: Date.now(),
          _r: Math.random().toString(36).substring(2, 15)
        },
        header: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          ...(options.headers || {})
        }
      }).then(response => {
        console.log('获取帖子状态响应:', id, response);
        return response;
      }).catch(error => {
        console.error('获取帖子状态异常:', id, error);
        throw error;
      });
    },
    
    // 批量检查帖子状态
    checkStatuses: async (postIds, options = {}) => {
      // 由于服务器没有批量检查接口，改为逐个请求
      console.log('批量检查帖子状态 (逐个请求):', postIds);
      
      if (!postIds || !postIds.length) {
        return { success: true, data: {} };
      }
      
      // 准备请求头
      const headers = options.headers || {};
      
      try {
        // 存储所有帖子状态
        const allStatuses = {};
        
        // 逐个发送请求，但限制并发量
        const batchSize = 3; // 一次最多处理3个请求
        
        for (let i = 0; i < postIds.length; i += batchSize) {
          const batch = postIds.slice(i, i + batchSize);
          console.log(`处理帖子状态批次 ${Math.floor(i/batchSize) + 1}/${Math.ceil(postIds.length/batchSize)}:`, batch);
          
          // 并行处理一批请求
          const batchPromises = batch.map(async (postId) => {
            try {
              if (!postId) {
                console.error('无效的帖子ID:', postId);
                return;
              }
              
              // 添加随机参数，避免缓存
              const randomParam = Math.random().toString(36).substring(2, 15);
              
              // 使用专门的status端点获取状态，而不是完整帖子
              const url = `/posts/${postId}/status`;
              
              // 安全添加查询参数
              const requestParams = {
                _r: randomParam,
                _t: Date.now()
              };
              
              console.log(`请求帖子${postId}状态，URL:`, url);
              
              // 使用request模块发送请求
              const result = await request(url, 'GET', {
                data: requestParams,
                headers
              });
              
              // 如果成功，提取需要的状态数据
              if (result && result.success && result.data && result.data.post) {
                console.log(`获取帖子${postId}状态成功:`, result.data.post);
                
                // 不使用默认值覆盖，直接使用服务器返回的状态
                const statusData = {
                  isLiked: result.data.post.isLiked,
                  isCollected: result.data.post.isCollected,
                  likes: result.data.post.likes,
                  collections: result.data.post.collections
                };
                
                allStatuses[postId] = statusData;
              } else {
                console.error(`获取帖子${postId}状态失败:`, result?.message || '未知错误');
              }
            } catch (err) {
              console.error(`获取帖子${postId}状态请求异常:`, err);
            }
          });
          
          // 等待当前批次完成
          await Promise.all(batchPromises);
          
          // 添加小延迟，防止请求过于频繁
          if (i + batchSize < postIds.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        // 返回所有状态数据
        return {
          success: true,
          data: allStatuses
        };
      } catch (error) {
        console.error('批量获取帖子状态出错:', error);
        return {
          success: false,
          message: error.message || '网络错误',
          data: {}
        };
      }
    },
    
    // 单独检查点赞状态
    checkLikeStatus: (id) => {
      return request({
        url: `/posts/${id}/like/status`,
        data: {
          _t: Date.now(),
          _r: Math.random().toString(36).substring(2, 15)
        },
        header: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }).then(response => {
        console.log('获取点赞状态响应:', id, response);
        return response;
      }).catch(error => {
        console.error('获取点赞状态异常:', id, error);
        throw error;
      });
    },
    
    // 单独检查收藏状态
    checkCollectionStatus: (id) => {
      return request({
        url: `/posts/${id}/collect/status`,
        data: {
          _t: Date.now(),
          _r: Math.random().toString(36).substring(2, 15)
        },
        header: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }).then(response => {
        console.log('获取收藏状态响应:', id, response);
        return response;
      }).catch(error => {
        console.error('获取收藏状态异常:', id, error);
        throw error;
      });
    },
    
    // 收藏帖子
    collect: (id, data = {}) => {
      return request({
        url: `/posts/${id}/collect`,
        method: 'POST',
        data
      });
    },
    
    // 取消收藏
    uncollect: (id) => {
      return request({
        url: `/posts/${id}/collect`,
        method: 'DELETE'
      });
    },
    
    // 记录帖子浏览量
    recordView: (id) => {
      return request({
        url: `/posts/${id}/view`,
        method: 'POST'
      });
    },
    
    // 获取用户帖子
    getUserPosts: (params) => {
      return request({
        url: `/users/${params.userId}/posts`,
        data: { 
          page: params.page || 1,
          limit: params.limit || 10,
          sort: params.sort || 'latest'
        }
      });
    }
  },
  
  // 评论相关接口
  comments: {
    // 获取帖子评论列表
    getList: (postId, params) => {
      console.log(`开始获取帖子${postId}的评论，参数:`, params);
      return request({
        url: `/posts/${postId}/comments`,
        data: params
      }).then(response => {
        console.log(`帖子${postId}评论列表API响应:`, response);
        return response;
      }).catch(error => {
        console.error(`帖子${postId}评论列表请求异常:`, error);
        throw error;
      });
    },
    
    // 添加评论
    add: (postId, data) => {
      console.log(`添加帖子${postId}评论，数据:`, data);
      return request({
        url: `/posts/${postId}/comments`,
        method: 'POST',
        data
      }).then(response => {
        console.log(`添加帖子${postId}评论响应:`, response);
        return response;
      }).catch(error => {
        console.error(`添加帖子${postId}评论异常:`, error);
        throw error;
      });
    },
    
    // 删除评论
    delete: (id) => {
      return request({
        url: `/comments/${id}`,
        method: 'DELETE'
      });
    },
    
    // 点赞评论
    like: (id) => {
      return request({
        url: `/comments/${id}/like`,
        method: 'POST'
      });
    },
    
    // 取消评论点赞
    unlike: (id) => {
      return request({
        url: `/comments/${id}/like`,
        method: 'DELETE'
      });
    },
    
    // 获取帖子热门评论
    getTopComments: (postId, limit = 2) => {
      return request({
        url: `/posts/${postId}/comments`,
        data: {
          page: 1,
          limit: limit,
          sort: 'popular'
        }
      }).then(response => {
        console.log('原始热门评论响应:', postId, JSON.stringify(response));
        return response;
      }).catch(error => {
        console.error('获取热门评论请求异常:', error);
        throw error;
      });
    },
    
    // 回复评论
    reply: (commentId, data) => {
      return request({
        url: `/comments/reply`,
        method: 'POST',
        data
      });
    },
    
    // 回复评论的回复
    replyToReply: (commentId, replyId, data) => {
      return request({
        url: `/comments/reply`,
        method: 'POST',
        data
      });
    },
    
    // 获取评论回复列表
    getReplies: (commentId, params = {}) => {
      return request({
        url: `/comments/${commentId}/replies`,
        data: params
      });
    },
    
    // 点赞回复
    likeReply: (id) => {
      return request({
        url: `/comments/replies/${id}/like`,
        method: 'POST'
      });
    },
    
    // 取消回复点赞
    unlikeReply: (id) => {
      return request({
        url: `/comments/replies/${id}/like`,
        method: 'DELETE'
      });
    }
  },
  
  // 用户关系相关接口
  users: {
    // 获取用户资料
    getProfile: (id) => {
      return request({
        url: `/users/${id}/profile`
      });
    },
    
    // 新增：获取用户标签
    getBadges: (id) => {
      return request({
        url: `/users/${id}/badges`
      });
    },
    
    // 关注用户
    follow: (id, data = {}) => {
      return request({
        url: `/users/${id}/follow`,
        method: 'POST',
        data
      });
    },
    
    // 检查是否关注用户
    checkFollow: (id) => {
      return request({
        url: `/users/${id}/follow/status`
      });
    },
    
    // 取消关注
    unfollow: (id) => {
      return request({
        url: `/users/${id}/follow`,
        method: 'DELETE'
      });
    },
    
    // 获取用户的关注列表
    getFollowing: (id, params = {}) => {
      return request({
        url: `/users/${id}/following`,
        data: params
      });
    },
    
    // 获取互相关注的用户列表
    getMutualFollows: () => {
      return request({
        url: '/users/mutual-follows'
      });
    },
    
    // 获取用户的粉丝列表
    getFollowers: (id, params = {}) => {
      // 构建API请求数据
      const requestData = {
        page: params.page || 1,
        limit: params.limit || 20,
        include_deleted: params.includeDeleted
      };
      
      console.log(`[API] 获取用户${id}的粉丝列表, 参数:`, requestData);
      
      return request({
        url: `/users/${id}/followers`,
        data: requestData
      }).then(response => {
        console.log(`[API] 粉丝列表响应:`, response);
        return response;
      }).catch(error => {
        console.error(`[API] 获取粉丝列表失败:`, error);
        throw error;
      });
    },
    
    // 获取用户帖子
    getUserPosts: (params) => {
      return request({
        url: `/users/${params.userId}/posts`,
        data: { 
          page: params.page || 1,
          limit: params.limit || 10,
          sort: params.sort || 'latest'
        }
      });
    },
    
    // 获取用户点赞的帖子
    getLikedPosts: (id, params) => {
      return request({
        url: `/users/${id}/likes/posts`,
        data: params
      });
    },
    
    // 获取用户收藏的帖子
    getCollections: (id, params) => {
      return request({
        url: `/users/${id}/collections`,
        data: params
      });
    }
  },
  
  // 话题相关接口
  topics: {
    // 获取热门话题
    getHot: (limit) => {
      return request({
        url: '/topics/hot',
        data: { limit }
      });
    },
    
    // 获取话题列表
    getList: (params) => {
      return request({
        url: '/topics',
        data: params
      });
    },
    
    // 搜索话题
    search: (keyword, limit = 10) => {
      return request({
        url: '/topics/search',
        data: { 
          keyword,
          limit
        }
      });
    },
    
    // 创建话题
    create: (data) => {
      return request({
        url: '/topics',
        method: 'POST',
        data
      });
    },
    
    // 获取话题详情
    getDetail: (id) => {
      return request({
        url: `/topics/${id}`
      });
    },
    
    // 获取话题下的帖子
    getPosts: (id, params) => {
      return request({
        url: `/topics/${id}/posts`,
        data: params
      });
    },
    
    // 记录话题浏览量
    recordView: (id) => {
      return request({
        url: `/topics/${id}/view`,
        method: 'POST'
      });
    },
    
    // 检查话题浏览状态
    checkViewStatus: (topicId) => {
      if (!topicId) {
        console.error('话题ID不能为空');
        return Promise.reject({ success: false, message: '话题ID不能为空' });
      }
      
      return request({
        url: `/topics/${topicId}/view-status`,
        method: 'GET'
      });
    },
    
    // 批量检查话题浏览状态
    batchCheckViewStatus: (topicIds) => {
      if (!topicIds || !topicIds.length) {
        console.error('话题ID数组不能为空');
        return Promise.reject({ success: false, message: '话题ID数组不能为空' });
      }
      
      return request({
        url: '/topics/batch-view-status',
        method: 'POST',
        data: { topicIds }
      });
    }
  },
  
  // 标签相关接口
  tags: {
    // 获取标签列表
    getList: (params) => {
      return request({
        url: '/tags',
        data: params
      });
    },
    
    // 获取热门标签
    getHot: (limit) => {
      return request({
        url: '/tags/hot',
        data: { limit }
      });
    },
    
    // 获取指定分类的标签
    getByCategory: (category, params = {}) => {
      return request({
        url: `/tags/category/${category}`,
        data: params
      });
    },
    
    // 获取标签详情
    getDetail: (id) => {
      return request({
        url: `/tags/${id}`
      });
    },
    
    // 获取用户标签
    getUserTags: (userId) => {
      return request({
        url: `/users/${userId}/tags`
      });
    },
    
    // 设置用户标签
    setUserTags: (tagIds) => {
      return request({
        url: '/users/tags',
        method: 'POST',
        data: { tagIds }
      });
    }
  },
  
  // 搜索相关接口
  search: {
    // 全局搜索
    global: (params) => {
      return request({
        url: '/search',
        data: params
      });
    },
    
    // 搜索帖子
    posts: (params) => {
      return request({
        url: '/search/posts',
        data: params
      });
    },
    
    // 获取热门搜索词
    getHotSearches: () => {
      return request({
        url: '/search/hot'
      });
    },
    
    // 获取搜索建议
    getSuggestions: (keyword) => {
      return request({
        url: '/search/suggestions',
        data: { keyword }
      });
    },
    
    // 搜索帖子 (兼容页面代码)
    searchPosts: (params) => {
      return request({
        url: '/search/posts',
        data: params
      });
    },
    
    // 搜索用户
    searchUsers: (params) => {
      return request({
        url: '/search/users',
        data: params
      });
    },
    
    // 搜索话题
    searchTopics: (params) => {
      return request({
        url: '/search/topics',
        data: params
      });
    },
    
    // 获取话题热榜
    getTrendingTopics: (limit = 10) => {
      return request({
        url: '/topics/trending',
        data: { limit }
      });
    }
  },
  
  // 消息相关接口
  messages: {
    // 获取消息列表
    getList: (params) => {
      return request({
        url: '/messages',
        data: params
      });
    },
    
    // 获取消息详情
    getDetail: (id) => {
      return request({
        url: `/messages/${id}`
      });
    },
    
    // 标记消息已读
    markAsRead: (id) => {
      return request({
        url: `/messages/${id}/read`,
        method: 'PUT'
      });
    },
    
    // 标记所有消息已读
    markAllAsRead: (type) => {
      const data = type ? { type } : {};
      return request({
        url: '/messages/read-all',
        method: 'PUT',
        data
      });
    },
    
    // 删除消息
    delete: (id) => {
      return request({
        url: `/messages/${id}`,
        method: 'DELETE'
      });
    },
    
    // 清空消息
    deleteAll: (type) => {
      const data = type ? { type } : {};
      return request({
        url: '/messages/delete-all',
        method: 'DELETE',
        data
      });
    },
    
    // 获取未读消息数
    getUnreadCount: () => {
      return request({
        url: '/messages/unread-count'
      });
    }
  },
  
  // 校园活动相关接口
  events: {
    // 获取活动列表
    getList: (params = {}) => {
      return request({
        url: '/events',
        data: params
      });
    },
    
    // 获取活动详情
    getDetail: (id) => {
      return request({
        url: `/events/${id}`
      });
    },
    
    // 获取活动报名表单配置
    getFormConfig: (id) => {
      console.log(`[API] 获取活动表单配置 - 活动ID: ${id}`);
      return request({
        url: `/events/${id}/form-config`,
        method: 'GET'
      }).then(res => {
        console.log(`[API] 获取表单配置结果:`, res);
        return res;
      }).catch(err => {
        console.error(`[API] 获取表单配置失败:`, err);
        throw err;
      });
    },
    
    // 报名参加活动
    register: (id, formData = {}) => {
      console.log(`[API] 开始报名活动 - 活动ID: ${id}, 表单数据:`, formData);
      return request({
        url: `/events/${id}/join`,
        method: 'POST',
        data: { formData }
      }).then(res => {
        console.log(`[API] 活动报名结果:`, res);
        return res;
      }).catch(err => {
        console.error(`[API] 活动报名失败:`, err);
        throw err;
      });
    },
    
    // 取消报名
    cancelRegistration: (id, reason = '') => {
      console.log(`[API] 取消活动报名 - 活动ID: ${id}, 原因: ${reason}`);
      return request({
        url: `/events/${id}/cancel-registration`,
        method: 'POST',
        data: { reason }
      }).then(res => {
        console.log(`[API] 取消报名结果:`, res);
        return res;
      }).catch(err => {
        console.error(`[API] 取消报名失败:`, err);
        throw err;
      });
    },
    
    // 检查用户是否已注册该事件
    checkRegistrationStatus: (eventId) => {
      if (!eventId) {
        console.error('事件ID不能为空');
        return Promise.reject({ success: false, message: '事件ID不能为空' });
      }
      
      console.log(`[API] 开始检查活动注册状态 - 活动ID: ${eventId}`);
      return request({
        url: `/events/${eventId}/registration-status`,
        method: 'GET'
      }).then(res => {
        console.log(`[API] 检查注册状态返回:`, res);
        return res;
      }).catch(err => {
        console.error(`[API] 检查注册状态失败:`, err);
        throw err;
      });
    },
    
    // 批量检查注册状态
    batchCheckRegistration: (eventIds) => {
      if (!eventIds || !eventIds.length) {
        console.error('事件ID数组不能为空');
        return Promise.reject({ success: false, message: '事件ID数组不能为空' });
      }
      
      return request({
        url: `/events/batch-registration-status`,
        method: 'POST',
        data: { eventIds }
      });
    }
  },
  
  // 回复相关接口
  replies: {
    // 点赞回复
    likeReply: (id) => {
      return request({
        url: `/comments/replies/${id}/like`,
        method: 'POST'
      });
    },
    
    // 取消回复点赞
    unlikeReply: (id) => {
      return request({
        url: `/comments/replies/${id}/like`,
        method: 'DELETE'
      });
    }
  },
  
  // 系统设置相关接口
  settings: {
    // 获取消息相关设置
    getMessageSettings: () => {
      return request({
        url: '/settings/message'
      }).then(res => {
        // 确保返回的数据格式一致
        if (res.success && res.data) {
          return {
            success: true,
            data: {
              readDelaySeconds: parseInt(res.data.readDelaySeconds) || 5
            }
          };
        }
        
        return {
          success: false,
          message: res.message || '获取设置失败',
          data: {
            readDelaySeconds: 5  // 默认值
          }
        };
      }).catch(err => {
        console.error('获取消息设置失败:', err);
        // 如果请求失败，返回默认值
        return {
          success: false,
          message: err.message || '网络错误',
          data: {
            readDelaySeconds: 5  // 默认值
          }
        };
      });
    }
  },
  
  // 添加批量状态检查API，统一状态获取接口
  batch: {
    // 批量获取多种内容的状态
    getStatusByUserAndIds: (params) => {
      // params结构: { postIds, commentIds, topicIds, eventIds }
      if (!params || Object.keys(params).every(key => !params[key] || !params[key].length)) {
        console.error('至少需要一种内容的ID数组');
        return Promise.reject({ success: false, message: '至少需要一种内容的ID数组' });
      }
      
      // 过滤掉空数组
      const filteredParams = {};
      Object.keys(params).forEach(key => {
        if (params[key] && params[key].length) {
          filteredParams[key] = params[key];
        }
      });
      
      return request({
        url: '/batch/status',
        method: 'POST',
        data: filteredParams
      });
    },
    
    // 获取单个帖子的状态（包括点赞、收藏状态）
    getPostStatus: (postId) => {
      if (!postId) {
        console.error('帖子ID不能为空');
        return Promise.reject({ success: false, message: '帖子ID不能为空' });
      }
      
      return request({
        url: `/posts/${postId}/status`,
        method: 'GET'
      });
    },
    
    // 批量更新用户状态（登录后初始化用）
    syncUserStatus: () => {
      return request({
        url: '/batch/sync-user-status',
        method: 'GET'
      });
    }
  },
  
  // 内容相关接口
  content: {
    // 获取轮播图列表
    getBanners: (params = {}) => {
      return request({
        url: '/content/banners',
        data: params
      });
    },
    
    // 获取分类列表
    getCategories: (params = {}) => {
      return request({
        url: '/content/categories',
        data: params
      });
    },
    
    // 根据类型获取分类
    getCategoriesByType: (type) => {
      return request({
        url: `/content/categories/type/${type}`
      });
    }
  }
};

export default api; 