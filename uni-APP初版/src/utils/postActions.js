// 帖子交互行为统一管理
import api from './api.js';
import { useAppStore } from '../stores/appStore.js';

// 点赞和收藏状态缓存过期时间（毫秒）
const CACHE_EXPIRATION = 12 * 60 * 60 * 1000; // 12小时
// 最大重试次数
const MAX_RETRIES = 1;
// 请求超时时间
const REQUEST_TIMEOUT = 8000; // 8秒
// 状态同步间隔时间
const SYNC_INTERVAL = 1000; // 1秒
// 状态更新额外延迟
const UPDATE_DELAY = 100; // 100毫秒
// 活动页面监听常量
const ACTIVE_PAGES = {
  INDEX: 'index',
  DETAIL: 'detail',
  PROFILE: 'profile',
  TOPIC: 'topic'
};

// 全局状态映射 - 用于跨页面状态同步
const globalPostStateMap = new Map();
// 收藏状态映射 - 专门用于收藏状态同步
const collectStateMap = new Map();
// 最后状态更新时间戳映射
const lastUpdateTimeMap = new Map();
// 当前活动页面
let activePage = null;
// 状态初始化标记 - 用于防止重复初始化
let initializedPosts = new Set();
// 最后同步时间
let lastSyncTime = 0;
// 状态同步定时器
let syncTimer = null;
// 全局状态版本号 - 用于检测状态是否有更新
let globalStateVersion = 0;

// 获取Pinia store
function getStore() {
  try {
    return useAppStore();
  } catch (error) {
    console.error('获取Pinia store失败:', error);
    return null;
  }
}

/**
 * 设置当前活动页面
 * @param {String} pageName 页面名称
 * @param {Object} pageContext 页面上下文或附加数据
 */
function setActivePage(pageName, pageContext = {}) {
  console.log('设置当前活动页面:', pageName, pageContext);
  
  // 记录上一个页面
  const previousPage = activePage ? { ...activePage } : null;
  
  // 更新当前页面
  activePage = { name: pageName, context: pageContext, time: Date.now() };
  
  // 记录到sessionStorage以便页面刷新时恢复
  try {
    uni.setStorageSync('active_page', JSON.stringify(activePage));
  } catch (e) {
    console.error('保存活动页面信息失败:', e);
  }
  
  // 当页面变化时进行额外的操作
  if (previousPage && previousPage.name !== pageName) {
    console.log(`页面从 ${previousPage.name} 切换到 ${pageName}`);
    
    // 如果从首页切换到详情页，同步当前帖子的状态
    if (previousPage.name === ACTIVE_PAGES.INDEX && pageName === ACTIVE_PAGES.DETAIL && pageContext?.postId) {
      const postId = pageContext.postId;
      console.log(`从首页进入帖子详情页 ${postId}，同步状态`);
      
      // 如果全局状态映射中有该帖子的状态，同步到store
      if (globalPostStateMap.has(postId)) {
        const cachedState = globalPostStateMap.get(postId);
        console.log(`发现全局缓存的帖子 ${postId} 状态:`, cachedState);
        
        // 更新全局store
        const appStore = getStore();
        if (appStore) {
          appStore.updatePostStatus(postId, cachedState);
        }
        
        // 确保收藏状态被正确记录
        if (cachedState.isCollected !== undefined) {
          collectStateMap.set(postId, cachedState.isCollected);
          console.log(`更新收藏状态映射: ${postId} -> ${cachedState.isCollected}`);
        }
      } 
      
      // 页面切换时强制同步状态
      setTimeout(() => {
        forceRefreshPostStatus(postId);
      }, UPDATE_DELAY);
    }
    
    // 如果从详情页返回首页，同步所有可见帖子的状态
    if (previousPage.name === ACTIVE_PAGES.DETAIL && pageName === ACTIVE_PAGES.INDEX && previousPage.context?.postId) {
      const postId = previousPage.context.postId;
      console.log(`从帖子详情页 ${postId} 返回首页，同步状态`);
      
      // 如果全局状态映射中有该帖子的状态，同步给所有页面
      if (globalPostStateMap.has(postId)) {
        const cachedState = globalPostStateMap.get(postId);
        
        // 确保收藏状态被正确记录
        if (cachedState.isCollected !== undefined) {
          collectStateMap.set(postId, cachedState.isCollected);
          console.log(`从详情页返回时更新收藏状态映射: ${postId} -> ${cachedState.isCollected}`);
        }
      }
      
      // 延迟一点时间再进行全局同步，确保页面已加载完成
      setTimeout(() => {
        broadcastStateChanges();
      }, UPDATE_DELAY);
    }
  }
  
  // 当页面变化时，开始状态同步
  startStatusSync();
}

/**
 * 获取当前活动页面
 * @returns {Object|null} 活动页面信息
 */
function getActivePage() {
  if (activePage) return activePage;
  
  // 尝试从sessionStorage恢复
  try {
    const storedPage = uni.getStorageSync('active_page');
    if (storedPage) {
      activePage = JSON.parse(storedPage);
      return activePage;
    }
  } catch (e) {
    console.error('获取活动页面信息失败:', e);
  }
  
  return null;
}

/**
 * 初始化帖子状态 - 主动从服务器同步
 * @param {Array|Object} posts 帖子数组或单个帖子对象
 * @param {Boolean} forceRefresh 是否强制刷新
 * @returns {Promise<Object>} 状态同步结果
 */
async function initializePostStatus(posts, forceRefresh = false) {
  console.log('初始化帖子状态:', Array.isArray(posts) ? `${posts.length}个帖子` : '单个帖子', forceRefresh ? '(强制刷新)' : '');
  
  // 确保全局状态已恢复
  if (globalPostStateMap.size === 0) {
    restoreGlobalState();
  }
  
  // 将单个帖子转换为数组处理
  const postArray = Array.isArray(posts) ? posts : [posts];
  if (postArray.length === 0) return { success: true, total: 0, synced: 0 };
  
  // 收集帖子ID
  let postIds = postArray.map(post => post.id);
  
  // 先从全局映射中获取已缓存的状态
  let updatedFromGlobal = 0;
  postIds.forEach(id => {
    // 检查是否有全局缓存状态
    if (globalPostStateMap.has(id)) {
      const globalState = globalPostStateMap.get(id);
      const post = postArray.find(p => p.id === id);
      
      if (post && globalState) {
        // 应用全局缓存中的状态到帖子对象
        console.log(`从全局映射更新帖子 ${id} 状态`);
        
        // 保存原始状态用于日志
        const originalLiked = post.isLiked;
        const originalCollected = post.isCollected;
        
        // 更新帖子对象
        if (globalState.isLiked !== undefined) post.isLiked = globalState.isLiked;
        if (globalState.isCollected !== undefined) post.isCollected = globalState.isCollected;
        if (globalState.likes !== undefined) post.likes = globalState.likes;
        if (globalState.collections !== undefined) post.collections = globalState.collections;
        
        // 记录状态变化
        if (originalLiked !== post.isLiked) {
          console.log(`帖子 ${id} 点赞状态从 ${originalLiked} 更新为 ${post.isLiked} (全局缓存)`);
        }
        if (originalCollected !== post.isCollected) {
          console.log(`帖子 ${id} 收藏状态从 ${originalCollected} 更新为 ${post.isCollected} (全局缓存)`);
          
          // 确保收藏状态同步到专用映射
          collectStateMap.set(id, post.isCollected);
        }
        
        updatedFromGlobal++;
        
        // 标记已初始化
        initializedPosts.add(id);
      }
    }
  });
  
  if (updatedFromGlobal > 0) {
    console.log(`从全局状态映射更新了 ${updatedFromGlobal} 个帖子状态`);
  }
  
  // 过滤已初始化的帖子（除非强制刷新）
  if (!forceRefresh) {
    postIds = postIds.filter(id => !initializedPosts.has(id));
    if (postIds.length === 0) {
      console.log('所有帖子都已初始化，跳过API请求');
      return { 
        success: true, 
        total: postArray.length, 
        synced: 0, 
        skipped: postArray.length,
        updatedFromGlobal
      };
    }
  }
  
  console.log('需要从API初始化的帖子:', postIds.join(', '));
  
  // 先从本地存储加载缓存状态
  const loadResult = loadPostStatusesFromStorage(postIds);
  console.log(`从本地存储加载了 ${loadResult.loaded} 个帖子状态`);
  
  // 强制刷新、存在未初始化的帖子或来自详情页返回时，才向服务器请求最新状态
  if (forceRefresh || postIds.length > 0 || getActivePage()?.name === ACTIVE_PAGES.INDEX) {
    try {
      // 向服务器请求批量状态
      const result = await refreshPostStatuses(postIds);
      
      if (result && result.success && result.data) {
        // 更新帖子对象
        postArray.forEach(post => {
          if (post && post.id && globalPostStateMap.has(post.id)) {
            const globalState = globalPostStateMap.get(post.id);
            
            // 应用全局缓存中的状态到帖子对象
            if (globalState.isLiked !== undefined) post.isLiked = globalState.isLiked;
            if (globalState.isCollected !== undefined) post.isCollected = globalState.isCollected;
            if (globalState.likes !== undefined) post.likes = globalState.likes;
            if (globalState.collections !== undefined) post.collections = globalState.collections;
            
            // 标记已初始化
            initializedPosts.add(post.id);
          }
        });
        
        // 广播状态变化到所有页面
        broadcastStateChanges();
        
        return {
          success: true,
          total: postArray.length,
          synced: result.data.length,
          data: result.data,
          updatedFromGlobal
        };
      } else {
        console.warn('刷新帖子状态失败:', result?.message || '未知错误');
      }
    } catch (error) {
      console.error('刷新帖子状态时出错:', error);
      // 调用统一的API错误处理
      await handleApiError(error);
    }
  }
  
  // 即使API请求失败，也返回基本成功信息
  return {
    success: true,
    total: postArray.length,
    synced: 0,
    error: '从API同步帖子状态失败',
    updatedFromGlobal
  };
}

/**
 * 从本地存储加载帖子状态
 * @param {Array} postIds 帖子ID数组
 * @returns {Object} 加载结果统计
 */
function loadPostStatusesFromStorage(postIds) {
  const appStore = getStore();
  if (!appStore) {
    return { loaded: 0, total: postIds.length };
  }
  
  let loadedCount = 0;
  postIds.forEach(id => {
    const status = appStore.loadPostStatus(id);
    
    if (status) {
      // 如果存在缓存，更新全局状态映射
      globalPostStateMap.set(id, status);
      
      // 如果包含收藏状态，更新收藏状态映射
      if (status.isCollected !== undefined) {
        collectStateMap.set(id, status.isCollected);
      }
      
      loadedCount++;
    }
  });
  
  return { loaded: loadedCount, total: postIds.length };
}

/**
 * 刷新多个帖子的状态
 * @param {Array} postIds 帖子ID数组
 * @returns {Promise<Object>} API响应对象
 */
async function refreshPostStatuses(postIds) {
  if (!postIds || postIds.length === 0) {
    return { success: true, data: [] };
  }
  
  // 检查是否登录
  const isLoggedIn = verifyUserLoginStatus();
  if (!isLoggedIn) {
    console.log('刷新帖子状态: 用户未登录，跳过API请求');
    return { success: true, data: [] };
  }
  
  try {
    // 调用API获取帖子状态
    const result = await api.post.getPostsStatus(postIds);
    
    if (result.success && Array.isArray(result.data)) {
      console.log(`批量获取${postIds.length}个帖子状态成功:`, result.data);
      
      // 更新全局状态映射
      result.data.forEach(item => {
        if (item && item.postId) {
          const postId = item.postId;
          
          // 构造状态对象
          const statusObj = {
            isLiked: item.isLiked,
            isCollected: item.isCollected,
            _timestamp: Date.now()
          };
          
          // 更新全局状态映射
          globalPostStateMap.set(postId, statusObj);
          
          // 更新收藏状态映射
          if (item.isCollected !== undefined) {
            collectStateMap.set(postId, item.isCollected);
          }
          
          // 更新全局store的帖子状态
          const appStore = getStore();
          if (appStore) {
            appStore.updatePostStatus(postId, statusObj);
          }
          
          // 增加全局状态版本号，表示有更新
          globalStateVersion++;
        }
      });
    }
    
    return result;
  } catch (error) {
    console.error('获取帖子状态出错:', error);
    
    // 调用统一的API错误处理
    await handleApiError(error);
    
    return { success: false, message: '获取帖子状态失败', error };
  }
}

/**
 * 启动状态同步定时器
 */
function startStatusSync() {
  if (syncTimer) {
    console.log('状态同步定时器已存在，不再重复创建');
    return;
  }
  
  console.log('启动状态同步定时器');
  syncTimer = setInterval(async () => {
    await synchronizeActivePostsStatus();
  }, SYNC_INTERVAL);
}

/**
 * 停止状态同步定时器
 */
function stopStatusSync() {
  if (syncTimer) {
    console.log('停止状态同步定时器');
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

/**
 * 同步活跃帖子状态 - 定期同步帖子状态
 */
async function synchronizeActivePostsStatus() {
  const now = Date.now();
  
  // 如果距离上次同步的时间不足同步间隔，则跳过本次同步
  if (now - lastSyncTime < SYNC_INTERVAL) {
    return;
  }
  
  // 更新最后同步时间
  lastSyncTime = now;
  
  // 获取当前活动页面
  const page = getActivePage();
  if (!page) {
    return;
  }
  
  // 根据当前页面类型和全局状态版本号决定是否需要同步
  if (page.name === ACTIVE_PAGES.INDEX || page.name === ACTIVE_PAGES.PROFILE) {
    // 如果在首页或个人主页，广播状态变化到所有页面
    broadcastStateChanges();
  } else if (page.name === ACTIVE_PAGES.DETAIL && page.context?.postId) {
    // 如果在详情页，同步当前帖子状态
    const postId = page.context.postId;
    
    // 如果此帖子有更新，则刷新帖子状态
    if (lastUpdateTimeMap.has(postId)) {
      const lastUpdateTime = lastUpdateTimeMap.get(postId);
      
      // 如果距离最后更新时间超过阈值，则刷新状态
      if (now - lastUpdateTime > UPDATE_DELAY) {
        console.log(`帖子 ${postId} 距离最后更新已超过阈值，同步状态`);
        
        // 刷新帖子状态
        await refreshPostStatus(postId);
      }
    }
  }
}

/**
 * 验证用户登录状态
 * @returns {Boolean} 是否已登录
 */
function verifyUserLoginStatus() {
  // 获取app store
  const appStore = getStore();
  if (!appStore) {
    console.error('获取app store失败');
    return false;
  }
  
  // 检查登录状态
  const isLoggedIn = appStore.isLoggedIn;
  
  // 如果登录状态已过期，则重新登录
  if (!isLoggedIn) {
    console.log('用户登录状态已失效，需要重新登录');
    return false;
  }
  
  return true;
}

/**
 * 尝试刷新token
 * @returns {Promise<Boolean>} 是否成功刷新token
 */
async function tryRefreshToken() {
  console.log('尝试刷新token');
  
  try {
    // 调用API刷新token
    const result = await api.auth.refreshToken();
    
    if (result.success && result.data?.token) {
      console.log('刷新token成功');
      
      // 更新token
      const appStore = getStore();
      if (appStore) {
        appStore.setToken(result.data.token);
        appStore.setLoginStatus(true);
      }
      
      return true;
    } else {
      console.warn('刷新token失败:', result.message || '未知错误');
      return false;
    }
  } catch (error) {
    console.error('刷新token出错:', error);
    return false;
  }
}

/**
 * 统一的API错误处理
 * @param {Error|Object} error 错误对象
 * @param {Function} retryCallback 重试回调函数
 * @returns {Promise<void>}
 */
async function handleApiError(error, retryCallback) {
  if (!error) return;
  
  const appStore = getStore();
  if (!appStore) {
    console.error('获取app store失败，无法处理API错误');
    return;
  }
  
  // 检查网络状态
  const networkType = await getNetworkType();
  const isNetworkConnected = networkType !== 'none';
  
  // 如果网络未连接，设置离线模式
  if (!isNetworkConnected) {
    console.log('网络未连接，进入离线模式');
    
    // 更新网络状态
    appStore.setNetworkStatus({
      isConnected: false,
      networkType: 'none'
    });
    
    // 设置离线模式
    appStore.setOfflineMode(true);
    
    // 设置API不可用
    appStore.setApiAvailability(false);
    
    return;
  }
  
  // 根据错误类型进行处理
  if (error.code === 401) {
    // 未授权，尝试刷新token
    const refreshed = await tryRefreshToken();
    
    // 如果成功刷新token且有重试回调，则重试
    if (refreshed && typeof retryCallback === 'function') {
      console.log('token已刷新，重试操作');
      try {
        await retryCallback();
      } catch (retryError) {
        console.error('重试操作失败:', retryError);
      }
    } else {
      // 刷新token失败，清除登录状态
      appStore.clearUserData();
    }
  } else if (error.code >= 500 || error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
    // 服务器错误或网络错误
    console.warn('API服务器错误或网络错误，可能需要进入离线模式', error);
    
    // 设置API不可用
    appStore.setApiAvailability(false);
    
    // 根据网络状态决定是否进入离线模式
    if (isNetworkConnected) {
      console.log('网络已连接，但API不可用');
      appStore.setOfflineMode(true);
    }
  }
}

// 获取网络状态的辅助函数
function getNetworkType() {
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: (res) => {
        resolve(res.networkType);
      },
      fail: () => {
        resolve('unknown');
      }
    });
  });
}

/**
 * 处理帖子点赞/取消点赞
 * @param {Object} post 帖子对象
 * @returns {Promise<boolean>} 操作是否成功
 */
async function handlePostLike(post) {
  if (!post || !post.id) {
    console.error('无效的帖子数据');
    return false;
  }

  // 验证用户登录状态
  if (!verifyUserLoginStatus()) {
    uni.showModal({
      title: '提示',
      content: '请先登录后再操作',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/login/login'
          });
        }
      }
    });
    return false;
  }

  try {
    // 记录原始状态，用于回滚
    const originalLiked = post.isLiked;
    const originalLikes = post.likes || 0;
    
    // 乐观更新UI状态
    post.isLiked = !originalLiked;
    post.likes = post.likes + (post.isLiked ? 1 : -1);
    
    // 保存到本地存储
    savePostLikeStatus(post.id, post.isLiked);
    
    // 更新全局状态
    store.mutations.updatePost(post.id, {
      isLiked: post.isLiked,
      likes: post.likes
    });
    
    console.log(`执行帖子${post.isLiked ? '点赞' : '取消点赞'}操作:`, post.id);
    
    // 设置请求超时 - 使用普通的超时处理代替AbortController
    let timeoutFlag = false;
    let timeoutId = setTimeout(() => {
      timeoutFlag = true;
      console.log('请求超时');
    }, REQUEST_TIMEOUT);
    
    // 准备额外的请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${uni.getStorageSync('token')}`
    };
    
    let retryCount = 0;
    let success = false;
    
    // 实现重试逻辑
    while (retryCount <= MAX_RETRIES && !success) {
      try {
        if (timeoutFlag) {
          throw new Error('请求超时');
        }
        
        // 调用API
        const result = await (post.isLiked 
          ? api.posts.like(post.id, { headers }) 
          : api.posts.unlike(post.id, { headers })
        );
        
        clearTimeout(timeoutId);
        
        // 检查结果
        if (result && result.success) {
          console.log(`帖子${post.isLiked ? '点赞' : '取消点赞'}成功:`, post.id);
          success = true;
          
          // 使用服务器返回的实际状态更新
          if (result.data && result.data.likes !== undefined) {
            post.likes = result.data.likes;
            
            // 更新全局状态
            store.mutations.updatePost(post.id, {
              likes: post.likes
            });
          }
          
          return true;
        } else {
          // API操作失败，但请求成功发送
          console.error(`帖子${post.isLiked ? '点赞' : '取消点赞'}失败:`, result?.message || '未知错误');
          
          // 如果错误消息表明状态不一致，调整本地状态
          if (result && result.message) {
            if (result.message.includes('已经点赞')) {
              // 服务器已经点赞过，强制设置本地状态为已点赞
              post.isLiked = true;
              post.likes = Math.max(originalLikes, post.likes); // 保持较高的点赞数
              
              // 更新全局状态映射
              globalPostStateMap.set(post.id, {
                ...(globalPostStateMap.get(post.id) || {}),
                isLiked: true,
                likes: post.likes
              });
              
              // 更新最后更新时间
              lastUpdateTimeMap.set(post.id, Date.now());
              
              // 保存到本地存储
              savePostLikeStatus(post.id, true);
              
              // 更新全局状态
              store.mutations.updatePost(post.id, {
                isLiked: true,
                likes: post.likes
              });
              
              uni.showToast({
                title: '已经点过赞了',
                icon: 'none'
              });
              
              // 刷新获取准确计数
              setTimeout(() => refreshPostStatus(post.id), 500);
              
              return true;
            } else if (result.message.includes('未点赞')) {
              // 服务器未点赞过，强制设置本地状态为未点赞
              post.isLiked = false;
              post.likes = Math.max(0, originalLikes);
              
              // 更新全局状态映射
              globalPostStateMap.set(post.id, {
                ...(globalPostStateMap.get(post.id) || {}),
                isLiked: false,
                likes: post.likes
              });
              
              // 更新最后更新时间
              lastUpdateTimeMap.set(post.id, Date.now());
              
              // 保存到本地存储
              savePostLikeStatus(post.id, false);
              
              // 更新全局状态
              store.mutations.updatePost(post.id, {
                isLiked: false,
                likes: post.likes
              });
              
              uni.showToast({
                title: '尚未点过赞',
                icon: 'none'
              });
              
              // 刷新获取准确计数
              setTimeout(() => refreshPostStatus(post.id), 500);
              
              return true;
            } else {
              // 其他错误，尝试刷新状态
              await refreshPostStatus(post.id);
              
              // 显示提示
              uni.showToast({
                title: '操作状态已更新',
                icon: 'none'
              });
              
              return false;
            }
          }
          
          throw new Error(result?.message || '操作失败');
        }
      } catch (error) {
        retryCount++;
        console.error(`点赞操作失败 (尝试 ${retryCount}/${MAX_RETRIES + 1}):`, error);
        
        clearTimeout(timeoutId);
        
        if (retryCount <= MAX_RETRIES) {
          console.log(`将在1秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          // 处理错误
          await handleApiError(error, () => handlePostLike(post));
          
          // 回滚状态
          rollbackLikeStatus(post, originalLiked, originalLikes);
          return false;
        }
      }
    }
    
    // 如果执行到这里，说明重试失败
    if (!success) {
      // 回滚状态
      rollbackLikeStatus(post, originalLiked, originalLikes);
      
      // 显示错误提示
      uni.showToast({
        title: '操作失败，请稍后再试',
        icon: 'none'
      });
      
      return false;
    }
    
    return true;
  } catch (outerError) {
    console.error('处理帖子点赞操作出错:', outerError);
    
    // 显示错误提示
    uni.showToast({
      title: '操作失败，请稍后再试',
      icon: 'none'
    });
    
    return false;
  }
}

/**
 * 处理帖子收藏/取消收藏
 * @param {Object} post 帖子对象
 * @returns {Promise<boolean>} 操作是否成功
 */
async function handlePostCollect(post) {
  if (!post || !post.id) {
    console.error('无效的帖子数据');
    return false;
  }
  
  // 验证用户登录状态
  if (!verifyUserLoginStatus()) {
    uni.showModal({
      title: '提示',
      content: '请先登录后再操作',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/login/login'
          });
        }
      }
    });
    return false;
  }
  
  try {
    // 记录原始状态，用于回滚
    const originalCollected = post.isCollected;
    const originalCollections = post.collections || 0;
    
    // 乐观更新UI状态
    post.isCollected = !originalCollected;
    post.collections = post.collections + (post.isCollected ? 1 : -1);
    
    // 保存到本地存储
    savePostCollectStatus(post.id, post.isCollected);
    
    // 更新全局状态映射
    globalPostStateMap.set(post.id, {
      ...(globalPostStateMap.get(post.id) || {}),
      isCollected: post.isCollected,
      collections: post.collections
    });
    
    // 更新专用收藏状态映射
    collectStateMap.set(post.id, post.isCollected);
    
    // 记录更新时间
    lastUpdateTimeMap.set(post.id, Date.now());
    
    // 增加状态版本号
    globalStateVersion++;
    
    // 更新全局状态
    store.mutations.updatePost(post.id, {
      isCollected: post.isCollected,
      collections: post.collections
    });
    
    // 广播状态变化
    setTimeout(broadcastStateChanges, UPDATE_DELAY);
    
    console.log(`执行帖子${post.isCollected ? '收藏' : '取消收藏'}操作:`, post.id);
    
    // 设置请求超时 - 使用普通的超时处理代替AbortController
    let timeoutFlag = false;
    let timeoutId = setTimeout(() => {
      timeoutFlag = true;
      console.log('请求超时');
    }, REQUEST_TIMEOUT);
    
    // 准备额外的请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${uni.getStorageSync('token')}`
    };
    
    let retryCount = 0;
    let success = false;
    
    // 实现重试逻辑
    while (retryCount <= MAX_RETRIES && !success) {
      try {
        if (timeoutFlag) {
          throw new Error('请求超时');
        }
        
        // 调用API
        const result = await (post.isCollected 
          ? api.posts.collect(post.id, { headers }) 
          : api.posts.uncollect(post.id, { headers })
        );
        
        clearTimeout(timeoutId);
        
        // 检查结果
        if (result && result.success) {
          console.log(`帖子${post.isCollected ? '收藏' : '取消收藏'}成功:`, post.id);
          success = true;
          
          // 使用服务器返回的实际状态更新
          if (result.data && result.data.collections !== undefined) {
            post.collections = result.data.collections;
            
            // 更新全局状态映射
            globalPostStateMap.set(post.id, {
              ...(globalPostStateMap.get(post.id) || {}),
              collections: post.collections
            });
            
            // 记录更新时间
            lastUpdateTimeMap.set(post.id, Date.now());
            
            // 更新全局状态
            store.mutations.updatePost(post.id, {
              collections: post.collections
            });
            
            // 广播状态变化
            broadcastStateChanges();
          }
          
          // 强制刷新当前帖子状态，确保与服务器一致
          setTimeout(() => forceRefreshPostStatus(post.id), 1000);
          
          // 显示成功提示
          uni.showToast({
            title: post.isCollected ? '收藏成功' : '已取消收藏',
            icon: 'success'
          });
          
          return true;
        } else {
          // API操作失败，但请求成功发送
          console.error(`帖子${post.isCollected ? '收藏' : '取消收藏'}失败:`, result?.message || '未知错误');
          
          // 如果错误消息表明状态不一致，处理状态差异
          if (result && result.message) {
            if (result.message.includes('已经收藏')) {
              // 服务器已经收藏过，强制设置本地状态为已收藏
              post.isCollected = true;
              post.collections = Math.max(originalCollections, post.collections); // 保持较高的收藏数
              
              // 更新全局状态映射
              globalPostStateMap.set(post.id, {
                ...(globalPostStateMap.get(post.id) || {}),
                isCollected: true,
                collections: post.collections
              });
              
              // 更新专用收藏状态映射
              collectStateMap.set(post.id, true);
              
              // 更新最后更新时间
              lastUpdateTimeMap.set(post.id, Date.now());
              
              // 保存到本地存储
              savePostCollectStatus(post.id, true);
              
              // 更新全局状态
              store.mutations.updatePost(post.id, {
                isCollected: true,
                collections: post.collections
              });
              
              uni.showToast({
                title: '已经收藏过了',
                icon: 'none'
              });
              
              // 刷新获取准确计数
              setTimeout(() => refreshPostStatus(post.id), 500);
              
              return true;
            } else if (result.message.includes('未收藏')) {
              // 服务器未收藏过，强制设置本地状态为未收藏
              post.isCollected = false;
              post.collections = Math.max(0, originalCollections);
              
              // 更新全局状态映射
              globalPostStateMap.set(post.id, {
                ...(globalPostStateMap.get(post.id) || {}),
                isCollected: false,
                collections: post.collections
              });
              
              // 更新专用收藏状态映射
              collectStateMap.set(post.id, false);
              
              // 更新最后更新时间
              lastUpdateTimeMap.set(post.id, Date.now());
              
              // 保存到本地存储
              savePostCollectStatus(post.id, false);
              
              // 更新全局状态
              store.mutations.updatePost(post.id, {
                isCollected: false,
                collections: post.collections
              });
              
              uni.showToast({
                title: '尚未收藏过',
                icon: 'none'
              });
              
              // 刷新获取准确计数
              setTimeout(() => refreshPostStatus(post.id), 500);
              
              return true;
            } else {
              // 其他错误，尝试刷新状态
              await forceRefreshPostStatus(post.id);
              
              // 显示提示
              uni.showToast({
                title: '操作状态已更新',
                icon: 'none'
              });
              
              return false;
            }
          }
          
          throw new Error(result?.message || '操作失败');
        }
      } catch (error) {
        retryCount++;
        console.error(`收藏操作失败 (尝试 ${retryCount}/${MAX_RETRIES + 1}):`, error);
        
        clearTimeout(timeoutId);
        
        if (retryCount <= MAX_RETRIES) {
          console.log(`将在1秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          // 处理错误
          await handleApiError(error, () => handlePostCollect(post));
          
          // 回滚状态
          rollbackCollectStatus(post, originalCollected, originalCollections);
          return false;
        }
      }
    }
    
    // 如果执行到这里，说明重试失败
    if (!success) {
      // 回滚状态
      rollbackCollectStatus(post, originalCollected, originalCollections);
      
      // 显示错误提示
      uni.showToast({
        title: '操作失败，请稍后再试',
        icon: 'none'
      });
      
      return false;
    }
    
    return true;
  } catch (outerError) {
    console.error('处理帖子收藏操作出错:', outerError);
    
    // 显示错误提示
    uni.showToast({
      title: '操作失败，请稍后再试',
      icon: 'none'
    });
    
    return false;
  }
}

/**
 * 处理评论点赞/取消点赞
 * @param {Object} comment 评论对象
 * @param {String|Number} postId 帖子ID
 * @returns {Promise<boolean>} 操作是否成功
 */
async function handleCommentLike(comment, postId) {
  if (!comment || !comment.id) {
    console.error('无效的评论数据');
    return false;
  }
  
  // 验证用户登录状态
  if (!verifyUserLoginStatus()) {
    uni.showModal({
      title: '提示',
      content: '请先登录后再操作',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/login/login'
          });
        }
      }
    });
    return false;
  }
  
  try {
    // 记录原始状态，用于回滚
    const originalLiked = comment.isLiked;
    const originalLikes = comment.likes || 0;
    
    // 乐观更新UI状态
    comment.isLiked = !originalLiked;
    comment.likes = comment.likes + (comment.isLiked ? 1 : -1);
    
    // 保存到本地存储
    saveCommentLikeStatus(comment.id, comment.isLiked, postId);
    
    console.log(`执行评论${comment.isLiked ? '点赞' : '取消点赞'}操作:`, comment.id);
    
    // 设置请求超时 - 使用普通的超时处理代替AbortController
    let timeoutFlag = false;
    let timeoutId = setTimeout(() => {
      timeoutFlag = true;
      console.log('请求超时');
    }, REQUEST_TIMEOUT);
    
    // 准备额外的请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${uni.getStorageSync('token')}`
    };
    
    let retryCount = 0;
    let success = false;
    
    // 实现重试逻辑
    while (retryCount <= MAX_RETRIES && !success) {
      try {
        if (timeoutFlag) {
          throw new Error('请求超时');
        }
        
        // 调用API
        const result = await (comment.isLiked 
          ? api.comments.like(comment.id, { headers }) 
          : api.comments.unlike(comment.id, { headers })
        );
        
        clearTimeout(timeoutId);
        
        // 检查结果
        if (result && result.success) {
          console.log(`评论${comment.isLiked ? '点赞' : '取消点赞'}成功:`, comment.id);
          success = true;
          
          // 使用服务器返回的实际状态更新
          if (result.data && result.data.likes !== undefined) {
            comment.likes = result.data.likes;
          }
          
          return true;
        } else {
          // API操作失败，但请求成功发送
          console.error(`评论${comment.isLiked ? '点赞' : '取消点赞'}失败:`, result?.message || '未知错误');
          
          throw new Error(result?.message || '操作失败');
        }
      } catch (error) {
        retryCount++;
        console.error(`评论点赞操作失败 (尝试 ${retryCount}/${MAX_RETRIES + 1}):`, error);
        
        clearTimeout(timeoutId);
        
        if (retryCount <= MAX_RETRIES) {
          console.log(`将在1秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          // 处理错误
          await handleApiError(error, () => handleCommentLike(comment, postId));
          
          // 恢复原始状态
          comment.isLiked = originalLiked;
          comment.likes = originalLikes;
          
          // 更新本地存储
          saveCommentLikeStatus(comment.id, originalLiked, postId);
          
          return false;
        }
      }
    }
    
    // 如果执行到这里，说明重试失败
    if (!success) {
      // 恢复原始状态
      comment.isLiked = originalLiked;
      comment.likes = originalLikes;
      
      // 更新本地存储
      saveCommentLikeStatus(comment.id, originalLiked, postId);
      
      // 显示错误提示
      uni.showToast({
        title: '网络异常，请稍后再试',
        icon: 'none'
      });
      
      return false;
    }
    
    return true;
  } catch (outerError) {
    console.error('处理评论点赞操作出错:', outerError);
    
    // 显示错误提示
    uni.showToast({
      title: '操作失败，请稍后再试',
      icon: 'none'
    });
    
    return false;
  }
}

/**
 * 刷新帖子状态
 * @param {String|Number} postId 帖子ID
 * @returns {Promise<Object|null>} 帖子状态对象或null
 */
async function refreshPostStatus(postId) {
  if (!postId) {
    console.error('无效的帖子ID:', postId);
    return null;
  }
  
  try {
    console.log('刷新帖子状态:', postId);
    
    // 添加随机参数，避免缓存
    const randomParam = Math.random().toString(36).substring(2, 15);
    const headers = {
      'Authorization': `Bearer ${uni.getStorageSync('token')}`
    };
    
    // 使用专门的status端点获取帖子状态
    const result = await api.batch.getPostStatus(postId, { 
      data: {
        _r: randomParam,
        _t: Date.now()
      },
      headers 
    });
    
    if (result && result.success && result.data) {
      console.log('获取到最新帖子状态:', result.data);
      
      // 创建状态对象，确保没有默认值覆盖实际状态
      const statusData = {
        isLiked: result.data.isLiked,
        isCollected: result.data.isCollected,
        likes: result.data.likes,
        collections: result.data.collections,
        _timestamp: Date.now()
      };
      
      // 缓存到本地
      uni.setStorageSync(`post_status_${postId}`, JSON.stringify(statusData));
      
      // 更新全局状态
      if (store.mutations.updatePost) {
        store.mutations.updatePost(postId, statusData);
      }
      
      // 更新全局状态映射
      globalPostStateMap.set(postId, {
        isLiked: statusData.isLiked !== undefined ? statusData.isLiked : false,
        isCollected: statusData.isCollected !== undefined ? statusData.isCollected : false,
        likes: statusData.likes,
        collections: statusData.collections
      });
      
      // 更新最后更新时间
      lastUpdateTimeMap.set(postId, Date.now());
      
      return statusData;
    } else {
      console.error('获取帖子状态失败:', result ? result.message : '未知错误');
      return null;
    }
  } catch (error) {
    console.error('刷新帖子状态出错:', error);
    return null;
  }
}

/**
 * 回滚帖子点赞状态
 * @param {Object} post 帖子对象
 * @param {Boolean} originalLiked 原始点赞状态
 * @param {Number} originalLikes 原始点赞数
 */
function rollbackLikeStatus(post, originalLiked, originalLikes) {
  console.log('回滚点赞状态:', post.id, '从', post.isLiked, '到', originalLiked);
  
  post.isLiked = originalLiked;
  post.likes = originalLikes;
  
  // 更新本地存储
  savePostLikeStatus(post.id, originalLiked);
  
  // 更新全局状态
  store.mutations.updatePost(post.id, {
    isLiked: originalLiked,
    likes: originalLikes
  });
}

/**
 * 回滚帖子收藏状态
 * @param {Object} post 帖子对象
 * @param {Boolean} originalCollected 原始收藏状态
 * @param {Number} originalCollections 原始收藏数
 */
function rollbackCollectStatus(post, originalCollected, originalCollections) {
  console.log('回滚收藏状态:', post.id, '从', post.isCollected, '到', originalCollected);
  
  post.isCollected = originalCollected;
  post.collections = originalCollections;
  
  // 更新本地存储
  savePostCollectStatus(post.id, originalCollected);
  
  // 更新全局状态
  store.mutations.updatePost(post.id, {
    isCollected: originalCollected,
    collections: originalCollections
  });
}

/**
 * 保存帖子点赞状态到本地存储
 * @param {String|Number} postId 帖子ID
 * @param {Boolean} isLiked 是否点赞
 */
function savePostLikeStatus(postId, isLiked) {
  try {
    const userObj = store.getters.getUser();
    if (!userObj) return;
    
    const user = userObj.user || userObj;
    if (!user || !user.id) return;
    
    const likeData = {
      isLiked,
      postId,
      userId: user.id,
      timestamp: Date.now(),
      expiration: Date.now() + CACHE_EXPIRATION
    };
    
    uni.setStorageSync(`post_like_${postId}`, JSON.stringify(likeData));
  } catch (e) {
    console.error('保存点赞状态出错:', e);
  }
}

/**
 * 保存帖子收藏状态到本地存储
 * @param {String|Number} postId 帖子ID
 * @param {Boolean} isCollected 是否收藏
 */
function savePostCollectStatus(postId, isCollected) {
  try {
    const userObj = store.getters.getUser();
    if (!userObj) return;
    
    const user = userObj.user || userObj;
    if (!user || !user.id) return;
    
    const collectData = {
      isCollected,
      postId,
      userId: user.id,
      timestamp: Date.now(),
      expiration: Date.now() + CACHE_EXPIRATION
    };
    
    uni.setStorageSync(`post_collect_${postId}`, JSON.stringify(collectData));
  } catch (e) {
    console.error('保存收藏状态出错:', e);
  }
}

/**
 * 保存评论点赞状态到本地存储
 * @param {String|Number} commentId 评论ID
 * @param {Boolean} isLiked 是否点赞
 * @param {String|Number} postId 帖子ID，用于分组
 */
function saveCommentLikeStatus(commentId, isLiked, postId) {
  try {
    const userObj = store.getters.getUser();
    if (!userObj) return;
    
    const user = userObj.user || userObj;
    if (!user || !user.id) return;
    
    const likeData = {
      isLiked,
      commentId,
      postId,
      userId: user.id,
      timestamp: Date.now(),
      expiration: Date.now() + CACHE_EXPIRATION
    };
    
    uni.setStorageSync(`comment_like_${commentId}`, JSON.stringify(likeData));
    
    // 同时更新评论点赞状态缓存
    updateCommentLikeCache(commentId, isLiked, postId);
  } catch (e) {
    console.error('保存评论点赞状态出错:', e);
  }
}

/**
 * 更新评论点赞状态缓存
 * @param {String|Number} commentId 评论ID
 * @param {Boolean} isLiked 是否点赞
 * @param {String|Number} postId 帖子ID
 */
function updateCommentLikeCache(commentId, isLiked, postId) {
  try {
    // 获取当前帖子的评论点赞缓存
    const cacheKey = `post_comments_like_${postId}`;
    let commentLikesCache = {};
    
    try {
      const cacheData = uni.getStorageSync(cacheKey);
      if (cacheData) {
        commentLikesCache = JSON.parse(cacheData);
      }
    } catch (e) {
      console.error('获取评论点赞缓存出错:', e);
    }
    
    // 更新缓存
    commentLikesCache[commentId] = {
      isLiked,
      timestamp: Date.now(),
      expiration: Date.now() + CACHE_EXPIRATION
    };
    
    // 保存更新后的缓存
    uni.setStorageSync(cacheKey, JSON.stringify(commentLikesCache));
  } catch (e) {
    console.error('更新评论点赞缓存出错:', e);
  }
}

/**
 * 获取帖子点赞状态
 * @param {String|Number} postId 帖子ID
 * @returns {Boolean|null} 是否点赞，未找到返回null
 */
function getPostLikeStatus(postId) {
  try {
    const userObj = store.getters.getUser();
    if (!userObj) return null;
    
    const user = userObj.user || userObj;
    if (!user || !user.id) return null;
    
    const cacheKey = `post_like_${postId}`;
    const cacheData = uni.getStorageSync(cacheKey);
    
    if (cacheData) {
      const likeData = JSON.parse(cacheData);
      
      // 检查缓存是否过期
      if (likeData.expiration && likeData.expiration > Date.now()) {
        // 检查用户ID是否匹配
        if (likeData.userId === user.id) {
          return likeData.isLiked;
        }
      } else {
        // 缓存过期，清除
        uni.removeStorageSync(cacheKey);
      }
    }
    
    return null;
  } catch (e) {
    console.error('获取点赞状态出错:', e);
    return null;
  }
}

/**
 * 获取帖子收藏状态
 * @param {String|Number} postId 帖子ID
 * @returns {Boolean|null} 是否收藏，未找到返回null
 */
function getPostCollectStatus(postId) {
  try {
    const userObj = store.getters.getUser();
    if (!userObj) return null;
    
    const user = userObj.user || userObj;
    if (!user || !user.id) return null;
    
    const cacheKey = `post_collect_${postId}`;
    const cacheData = uni.getStorageSync(cacheKey);
    
    if (cacheData) {
      const collectData = JSON.parse(cacheData);
      
      // 检查缓存是否过期
      if (collectData.expiration && collectData.expiration > Date.now()) {
        // 检查用户ID是否匹配
        if (collectData.userId === user.id) {
          return collectData.isCollected;
        }
      } else {
        // 缓存过期，清除
        uni.removeStorageSync(cacheKey);
      }
    }
    
    return null;
  } catch (e) {
    console.error('获取收藏状态出错:', e);
    return null;
  }
}

/**
 * 获取评论点赞状态
 * @param {String|Number} commentId 评论ID
 * @returns {Boolean|null} 是否点赞，未找到返回null
 */
function getCommentLikeStatus(commentId) {
  try {
    const userObj = store.getters.getUser();
    if (!userObj) return null;
    
    const user = userObj.user || userObj;
    if (!user || !user.id) return null;
    
    const cacheKey = `comment_like_${commentId}`;
    const cacheData = uni.getStorageSync(cacheKey);
    
    if (cacheData) {
      const likeData = JSON.parse(cacheData);
      
      // 检查缓存是否过期
      if (likeData.expiration && likeData.expiration > Date.now()) {
        // 检查用户ID是否匹配
        if (likeData.userId === user.id) {
          return likeData.isLiked;
        }
      } else {
        // 缓存过期，清除
        uni.removeStorageSync(cacheKey);
      }
    }
    
    return null;
  } catch (e) {
    console.error('获取评论点赞状态出错:', e);
    return null;
  }
}

/**
 * 强制刷新帖子状态
 * @param {String|Number} postId 帖子ID
 * @returns {Promise<Object|null>} 刷新结果
 */
async function forceRefreshPostStatus(postId) {
  if (!postId) {
    console.error('强制刷新帖子状态：无效的帖子ID');
    return null;
  }
  
  console.log(`强制刷新帖子 ${postId} 状态`);
  
  try {
    // 直接从服务器获取最新状态
    const status = await refreshPostStatus(postId);
    
    if (status) {
      // 更新全局状态映射
      globalPostStateMap.set(postId, status);
      
      // 特别关注收藏状态
      if (status.isCollected !== undefined) {
        collectStateMap.set(postId, status.isCollected);
        console.log(`更新收藏状态映射: ${postId} -> ${status.isCollected}`);
      }
      
      // 增加状态版本号
      globalStateVersion++;
      
      // 记录更新时间
      lastUpdateTimeMap.set(postId, Date.now());
      
      // 设置帖子已初始化
      initializedPosts.add(postId);
      
      return status;
    }
  } catch (error) {
    console.error(`强制刷新帖子 ${postId} 状态失败:`, error);
  }
  
  return null;
}
/**
 * 从本地存储恢复全局帖子状态
 * @returns {Object} 恢复结果
 */
function restoreGlobalState() {
  console.log('=== 开始恢复全局帖子状态 ===');
  const start = Date.now();
  try {
    const storedState = uni.getStorageSync('global_post_states');
    if (!storedState) {
      console.log('没有找到存储的全局状态');
      return { success: false, reason: '无存储状态' };
    }
    const globalState = JSON.parse(storedState);
    if (!globalState || !globalState.states) {
      console.log('存储的全局状态格式无效');
      return { success: false, reason: '状态格式无效' };
    }
    if (globalState.version) {
      globalStateVersion = globalState.version;
      console.log(`恢复全局状态版本号: ${globalStateVersion}`);
    }
    let statesCount = 0;
    if (globalState.states) {
      Object.entries(globalState.states).forEach(([postId, state]) => {
        if (postId && state) {
          globalPostStateMap.set(postId, state);
          statesCount++;
        }
      });
    }
    let collectCount = 0;
    if (globalState.collectStates) {
      Object.entries(globalState.collectStates).forEach(([postId, isCollected]) => {
        if (postId !== undefined) {
          collectStateMap.set(postId, isCollected);
          collectCount++;
        }
      });
    }
    console.log(`已恢复 ${statesCount} 个帖子状态和 ${collectCount} 个收藏状态`);
    return { success: true, statesCount, collectCount };
  } catch (e) {
    console.error('恢复全局状态失败:', e);
    return { success: false, error: e, reason: '存储访问失败' };
  } finally {
    console.log(`=== 恢复全局状态耗时: ${Date.now() - start}ms ===`);
  }
}
/**
 * 广播帖子状态变更到全局store和UI组件
 */
function broadcastStateChanges() {
  console.log('=== 开始广播状态变化 ===');
  const start = Date.now();
  
  try {
    // 获取所有需要广播的状态
    const states = {};
    let stateCount = 0;
    let collectCount = 0;
    
    // 从全局状态映射获取状态
    globalPostStateMap.forEach((state, postId) => {
      // 确保状态字段有正确的布尔值
      const normalizedState = {
        isLiked: state.isLiked === true,
        isCollected: state.isCollected === true,
        likes: state.likes,
        collections: state.collections
      };
      
      states[postId] = normalizedState;
      stateCount++;
    });
    
    // 从收藏映射获取状态
    collectStateMap.forEach((isCollected, postId) => {
      if (!states[postId]) {
        states[postId] = { isCollected: isCollected === true };
      } else if (states[postId].isCollected === undefined) {
        states[postId].isCollected = isCollected === true;
      }
      collectCount++;
    });
    
    console.log(`广播 ${stateCount} 个帖子状态, ${collectCount} 个收藏状态`);
    
    if (stateCount === 0 && collectCount === 0) {
      console.log('没有缓存的状态可广播');
      return;
    }
    
    // 广播所有状态到当前页面
    const postIds = Object.keys(states);
    
    // 修正无效的状态数据
    postIds.forEach(postId => {
      const state = states[postId];
      
      // 如果状态字段为undefined，修正为false
      if (state.isLiked === undefined) {
        console.log(`修正帖子 ${postId} 的点赞状态: undefined -> false`);
        state.isLiked = false;
      }
      
      if (state.isCollected === undefined) {
        console.log(`修正帖子 ${postId} 的收藏状态: undefined -> false`);
        state.isCollected = false;
      }
      
      // 记录当前广播的状态
      console.log(`广播帖子 ${postId} 状态: 点赞=${state.isLiked}, 收藏=${state.isCollected}`);
    });
    
    // 更新到所有页面
    if (store && store.state && store.state.posts) {
      const posts = store.state.posts;
      
      posts.forEach(post => {
        if (post && post.id && states[post.id]) {
          const state = states[post.id];
          post.isLiked = state.isLiked;
          post.isCollected = state.isCollected;
          
          if (state.likes !== undefined) {
            post.likes = state.likes;
          }
          
          if (state.collections !== undefined) {
            post.collections = state.collections;
          }
        }
      });
    }
    
    // 更新当前帖子
    if (store && store.state && store.state.currentPost) {
      const post = store.state.currentPost;
      if (post && post.id && states[post.id]) {
        const state = states[post.id];
        post.isLiked = state.isLiked;
        post.isCollected = state.isCollected;
        
        if (state.likes !== undefined) {
          post.likes = state.likes;
        }
        
        if (state.collections !== undefined) {
          post.collections = state.collections;
          }
        }
    }
    
    // 增加全局状态版本
    globalStateVersion++;
    console.log('全局状态版本号更新为:', globalStateVersion);
    
    // 保存全局状态到存储
    try {
      uni.setStorageSync('global_post_state_version', globalStateVersion);
      uni.setStorageSync('global_post_state_timestamp', Date.now());
      console.log(`已保存全局状态到存储: ${stateCount} 个状态, ${collectCount} 个收藏状态`);
    } catch (e) {
      console.error('保存全局状态到存储失败:', e);
    }
  } catch (error) {
    console.error('广播状态变化异常:', error);
  }
  
  console.log(`=== 广播状态变化耗时: ${Date.now() - start}ms ===`);
}

/**
 * 从登录数据同步用户状态
 * @param {Object} syncData 服务器返回的同步数据
 */
function syncUserStatusFromLogin(syncData) {
  if (!syncData) {
    console.log('无同步数据，跳过状态同步');
    return { success: false, error: '无同步数据' };
  }
  
  try {
    const now = Date.now();
    let updatedCount = 0;
    
    // 处理点赞数据
    const likes = syncData.likes || [];
    console.log(`处理${likes.length}个点赞数据`);
    
    if (likes.length > 0) {
      likes.forEach(item => {
        if (item && (item.targetType === 'post' || item.type === 'post') && (item.targetId || item.id)) {
          const postId = String(item.targetId || item.id);
          
          // 更新内存状态
        store.mutations.updatePostStatus(postId, {
            isLiked: true,
            _timestamp: now // 使用当前时间戳，确保比本地缓存更新
          });
          
          // 更新全局映射
          const existingState = globalPostStateMap.get(postId) || {};
          globalPostStateMap.set(postId, {
            ...existingState,
            isLiked: true,
            likes: (existingState.likes || 0) + 1  // 保留原来的数据，只更新点赞状态
          });
          
          // 更新最后更新时间
          lastUpdateTimeMap.set(postId, now);
          
          // 更新本地存储
          try {
            // 先获取现有缓存
            const cacheKey = `post_status_${postId}`;
            const existingCache = uni.getStorageSync(cacheKey);
            let statusToCache = { isLiked: true, _timestamp: now };
            
            if (existingCache) {
              try {
                const parsed = JSON.parse(existingCache);
                statusToCache = {
                  ...parsed,
                  isLiked: true,  // 覆盖点赞状态
                  _timestamp: now  // 更新时间戳
                };
              } catch (e) {
                console.error(`解析缓存数据失败:`, e);
              }
            }
            
            uni.setStorageSync(cacheKey, JSON.stringify(statusToCache));
            updatedCount++;
          } catch (e) {
            console.error(`缓存用户点赞状态失败:`, e);
          }
        }
      });
    }
    
    // 处理收藏数据
    const collections = syncData.collections || [];
    console.log(`处理${collections.length}个收藏数据`);
    
    if (collections.length > 0) {
      collections.forEach(item => {
        if (item && (item.postId || item.id)) {
          const postId = String(item.postId || item.id);
          
          // 更新内存状态
          store.mutations.updatePostStatus(postId, {
            isCollected: true,
            _timestamp: now
          });
          
          // 更新全局映射
          const existingState = globalPostStateMap.get(postId) || {};
          globalPostStateMap.set(postId, {
            ...existingState,
            isCollected: true,
            collections: (existingState.collections || 0) + 1
          });
          
          // 更新专用收藏状态映射
          collectStateMap.set(postId, true);
          
          // 更新最后更新时间
          lastUpdateTimeMap.set(postId, now);
          
          // 更新本地存储
          try {
            // 先获取现有缓存
            const cacheKey = `post_status_${postId}`;
            const existingCache = uni.getStorageSync(cacheKey);
            let statusToCache = { isCollected: true, _timestamp: now };
            
            if (existingCache) {
              try {
                const parsed = JSON.parse(existingCache);
                statusToCache = {
                  ...parsed,
                  isCollected: true,  // 覆盖收藏状态
                  _timestamp: now  // 更新时间戳
                };
    } catch (e) {
                console.error(`解析缓存数据失败:`, e);
    }
            }
            
            uni.setStorageSync(cacheKey, JSON.stringify(statusToCache));
            updatedCount++;
  } catch (e) {
            console.error(`缓存用户收藏状态失败:`, e);
          }
        }
      });
    }
    
    // 立即广播状态变化
    if (updatedCount > 0) {
      globalStateVersion++; // 增加状态版本
      setTimeout(() => broadcastStateChanges(), 100);
      console.log(`同步完成，更新了${updatedCount}个状态`);
    } else {
      console.log('没有需要同步的状态数据');
    }
    
    return { success: true, updatedCount };
  } catch (error) {
    console.error('同步用户状态失败:', error);
    return { success: false, error: error.message };
  }
}

// 导出API
export default {
  setActivePage,
  getActivePage,
  initializePostStatus,
  handlePostLike,
  handlePostCollect,
  handleCommentLike,
  refreshPostStatus,
  forceRefreshPostStatus,
  broadcastStateChanges,
  syncUserStatusFromLogin,
  // 确保导出ACTIVE_PAGES常量
  ACTIVE_PAGES
}; 