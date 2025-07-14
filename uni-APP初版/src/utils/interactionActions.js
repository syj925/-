/**
 * 统一交互状态管理模块
 * 用于管理点赞、收藏、话题浏览和活动报名等状态
 */
import api from './api.js';
import store from './store.js';
import postActions from './postActions.js';

// 缓存过期时间设置
const CACHE_EXPIRATION = {
  POST: 12 * 60 * 60 * 1000, // 帖子交互状态：12小时
  TOPIC: 24 * 60 * 60 * 1000, // 话题交互状态：24小时
  EVENT: 6 * 60 * 60 * 1000,   // 活动交互状态：6小时
  TOPIC_VIEW: 24 * 60 * 60 * 1000,   // 话题浏览缓存24小时
  EVENT_REGISTRATION: 30 * 60 * 1000, // 活动注册状态缓存30分钟
  ALL_USER_STATES: 10 * 60 * 1000     // 全部用户状态缓存10分钟
};

// 全局状态映射
const stateStorage = {
  // 话题状态映射 - topicId -> { viewed: boolean, lastViewTime: timestamp }
  topicStateMap: new Map(),
  
  // 活动状态映射 - eventId -> { registered: boolean, registrationTime: timestamp }
  eventStateMap: new Map(),
  
  // 最后状态更新时间戳映射
  lastUpdateTimeMap: new Map()
};

// 全局状态版本号
let globalStateVersion = 0;

// 延迟更新时间
const UPDATE_DELAY = 100;  // 延迟更新时间，避免频繁操作

// 活动页面类型枚举
const ACTIVE_PAGES = {
  INDEX: 'index',
  DETAIL: 'detail', 
  TOPIC: 'topic',
  EVENT: 'event'
};

// 全局状态映射
let topicStateMap = new Map();    // 话题状态映射 {topicId: {viewed: true, viewedAt: timestamp}}
let eventStateMap = new Map();    // 事件状态映射 {eventId: {registered: true, registeredAt: timestamp}}
let lastUpdateTimeMap = new Map(); // 最后更新时间映射
let activePage = null;            // 当前活动页面
let activeContext = null;         // 当前活动页面上下文
let isInitialized = false;        // 是否初始化过
let lastSyncTime = 0;             // 上次同步时间
let syncTimer = null;             // 状态同步定时器
let stateVersion = 0;             // 全局状态版本号

// 设置当前活动页面
const setActivePage = (page, context = {}) => {
  console.log('[interactionActions] 设置活动页面:', page, '上下文:', context);
  
  // 记录前一个页面
  const previousPage = activePage;
  const previousContext = activeContext;
  
  // 更新当前页面
  activePage = page;
  activeContext = context;
  
  // 存储到sessionStorage以便页面刷新后恢复
  try {
    uni.setStorageSync('activePage', page);
    uni.setStorageSync('activeContext', JSON.stringify(context));
  } catch (error) {
    console.error('[interactionActions] 保存活动页面失败:', error);
  }
  
  // 处理页面切换时的状态同步
  if (previousPage !== page) {
    console.log('[interactionActions] 页面已切换:', previousPage, '->', page);
    
    // 从话题页到事件页或反之，保证状态正确
    if ((previousPage === ACTIVE_PAGES.TOPIC && page === ACTIVE_PAGES.EVENT) ||
        (previousPage === ACTIVE_PAGES.EVENT && page === ACTIVE_PAGES.TOPIC)) {
      // 广播当前状态，确保跨页面状态一致
      setTimeout(() => {
        broadcastStateChanges();
      }, UPDATE_DELAY);
    }
    
    // 话题详情页加载或离开时
    if (page === ACTIVE_PAGES.TOPIC && context.topicId) {
      const topicId = context.topicId;
      console.log(`[interactionActions] 进入话题页面，ID: ${topicId}`);
    } 
    
    // 事件详情页加载或离开时
    if (page === ACTIVE_PAGES.EVENT && context.eventId) {
      const eventId = context.eventId;
      console.log(`[interactionActions] 进入事件页面，ID: ${eventId}`);
    }
  }
};

// 获取当前活动页面
const getActivePage = () => {
  if (!activePage) {
    try {
      // 尝试从sessionStorage恢复
      const storedPage = uni.getStorageSync('activePage');
      const storedContext = uni.getStorageSync('activeContext');
      
      if (storedPage) {
        activePage = storedPage;
        try {
          activeContext = JSON.parse(storedContext || '{}');
        } catch (e) {
          activeContext = {};
        }
      }
    } catch (error) {
      console.error('[interactionActions] 获取存储的活动页面失败:', error);
    }
  }
  
  return {
    page: activePage,
    context: activeContext
  };
};

/**
 * 话题浏览记录处理
 * @param {String|Number} topicId 话题ID
 * @returns {Promise<Object>} 处理结果
 */
async function handleTopicView(topicId) {
  if (!topicId) {
    console.error('无效的话题ID');
    return { success: false, error: '无效的话题ID' };
  }

  try {
    console.log(`记录话题 ${topicId} 浏览`);
    
    // 先从缓存获取上次浏览时间
    const topicState = stateStorage.topicStateMap.get(topicId) || {};
    const now = Date.now();
    const lastViewTime = topicState.lastViewTime || 0;
    
    // 如果短时间内（1小时内）重复浏览，不重复记录
    if (now - lastViewTime < 60 * 60 * 1000) {
      console.log(`话题 ${topicId} 近期已浏览过，跳过记录`);
      return { success: true, fromCache: true };
    }

    // 记录浏览到服务器
    const result = await api.topics.recordView(topicId);
    
    if (result && result.success) {
      console.log(`话题 ${topicId} 浏览记录成功，当前浏览量: ${result.data.views}`);
      
      // 更新本地缓存
      stateStorage.topicStateMap.set(topicId, {
        ...topicState,
        viewed: true,
        lastViewTime: now,
        views: result.data.views
      });
      
      // 更新最后更新时间
      stateStorage.lastUpdateTimeMap.set(`topic_${topicId}`, now);
      
      // 更新全局版本号
      globalStateVersion++;
      
      // 保存到本地存储
      saveTopicViewState(topicId, true);
      
      return { 
        success: true, 
        views: result.data.views 
      };
    } else {
      console.error('话题浏览记录失败:', result?.message || '未知错误');
      return { success: false, error: result?.message || '记录浏览失败' };
    }
  } catch (error) {
    console.error('话题浏览记录出错:', error);
    return { success: false, error };
  }
}

/**
 * 活动报名状态处理
 * @param {Object} event 活动对象
 * @returns {Promise<Object>} 处理结果
 */
async function handleEventRegistration(event) {
  if (!event || !event.id) {
    console.error('无效的活动数据');
    return { success: false, error: '无效的活动数据' };
  }
  
  // 验证用户登录状态
  if (!postActions.verifyUserLoginStatus()) {
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
    return { success: false, error: '未登录', notLoggedIn: true };
  }
  
  const eventId = event.id;
  
  try {
    console.log(`处理活动 ${eventId} 报名`);
    
    // 先检查缓存中的报名状态
    const cachedState = await getEventRegistrationState(eventId);
    if (cachedState && cachedState.registered) {
      console.log(`用户已经报名过活动 ${eventId}`);
      uni.showToast({
        title: '您已报名过此活动',
        icon: 'none'
      });
      return { success: true, registered: true, fromCache: true };
    }
    
    // 显示确认对话框
    return new Promise((resolve) => {
      uni.showModal({
        title: '报名确认',
        content: `确定要报名参加"${event.title || '此活动'}"吗？`,
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({
              title: '报名中...'
            });
            
            try {
              // 调用API报名
              const result = await api.events.register(eventId);
              uni.hideLoading();
              
              if (result && result.success) {
                console.log(`活动 ${eventId} 报名成功`);
                
                // 更新全局状态
                const now = Date.now();
                stateStorage.eventStateMap.set(eventId, {
                  registered: true,
                  registrationTime: now
                });
                
                // 更新最后更新时间
                stateStorage.lastUpdateTimeMap.set(`event_${eventId}`, now);
                
                // 增加版本号
                globalStateVersion++;
                
                // 保存到本地存储
                saveEventRegistrationState(eventId, true);
                
                // 强制刷新状态，确保与服务器同步
                setTimeout(() => {
                  try {
                    forceRefreshEventStatus(eventId);
                  } catch(e) {
                    console.error(`刷新活动${eventId}状态失败`, e);
                  }
                }, 300);
                
                uni.showToast({
                  title: '报名成功',
                  icon: 'success'
                });
                
                resolve({ 
                  success: true, 
                  registered: true,
                  ...result.data
                });
              } else {
                console.error(`活动 ${eventId} 报名失败:`, result?.message || '未知错误');
                uni.showToast({
                  title: result?.message || '报名失败',
                  icon: 'none'
                });
                resolve({ success: false, error: result?.message || '报名失败' });
              }
            } catch (error) {
              uni.hideLoading();
              console.error(`活动 ${eventId} 报名出错:`, error);
              uni.showToast({
                title: '报名失败，请稍后再试',
                icon: 'none'
              });
              resolve({ success: false, error });
            }
          } else {
            // 用户取消
            resolve({ success: false, canceled: true });
          }
        }
      });
    });
  } catch (error) {
    console.error('活动报名处理出错:', error);
    return { success: false, error };
  }
}

/**
 * 获取活动报名状态
 * @param {String|Number} eventId 活动ID
 * @returns {Promise<Object>} 活动报名状态
 */
async function getEventRegistrationState(eventId) {
  if (!eventId) return null;
  
  try {
    console.log(`获取活动 ${eventId} 报名状态`);
    
    // 首先检查全局状态映射
    const eventState = stateStorage.eventStateMap.get(eventId);
    if (eventState !== undefined) {
      console.log(`从全局状态映射获取活动 ${eventId} 报名状态:`, eventState);
      return eventState;
    }
    
    // 然后检查本地存储
    try {
      const storageKey = `event_registration_${eventId}`;
      const storageData = uni.getStorageSync(storageKey);
      
      if (storageData) {
        const data = JSON.parse(storageData);
        const now = Date.now();
        
        // 检查缓存是否过期
        if (data.timestamp && now - data.timestamp < CACHE_EXPIRATION.EVENT) {
          console.log(`从本地存储获取活动 ${eventId} 报名状态:`, data);
          
          // 更新到全局状态映射
          stateStorage.eventStateMap.set(eventId, {
            registered: data.registered,
            registrationTime: data.timestamp
          });
          
          // 更新最后更新时间
          stateStorage.lastUpdateTimeMap.set(`event_${eventId}`, data.timestamp);
          
          return {
            registered: data.registered,
            registrationTime: data.timestamp
          };
        } else {
          // 缓存过期，清除
          uni.removeStorageSync(storageKey);
        }
      }
    } catch (e) {
      console.error(`获取活动 ${eventId} 本地报名状态失败:`, e);
    }
    
    // 没有缓存，尝试从API获取
    if (postActions.verifyUserLoginStatus()) {
      try {
        const result = await api.events.checkRegistrationStatus(eventId);
        
        if (result && result.success) {
          console.log(`从API获取活动 ${eventId} 报名状态:`, result.data);
          
          const registered = result.data.isRegistered || false;
          const registrationTime = result.data.registrationDate ? new Date(result.data.registrationDate).getTime() : Date.now();
          
          // 更新全局状态
          stateStorage.eventStateMap.set(eventId, {
            registered,
            registrationTime
          });
          
          // 更新最后更新时间
          stateStorage.lastUpdateTimeMap.set(`event_${eventId}`, Date.now());
          
          // 保存到本地存储
          saveEventRegistrationState(eventId, registered);
          
          return {
            registered,
            registrationTime
          };
        }
      } catch (err) {
        console.error(`从API获取活动 ${eventId} 报名状态失败:`, err);
      }
    }
    
    return null;
  } catch (error) {
    console.error(`获取活动 ${eventId} 报名状态出错:`, error);
    return null;
  }
}

/**
 * 保存话题浏览状态到本地存储
 * @param {String|Number} topicId 话题ID
 * @param {Boolean} viewed 是否已浏览
 */
function saveTopicViewState(topicId, viewed) {
  try {
    const userObj = store.getters.getUser();
    const user = userObj?.user || userObj;
    
    const storageKey = `topic_view_${topicId}`;
    const viewData = {
      topicId,
      viewed,
      userId: user?.id || 'anonymous',
      timestamp: Date.now(),
      expiration: Date.now() + CACHE_EXPIRATION.TOPIC
    };
    
    uni.setStorageSync(storageKey, JSON.stringify(viewData));
    console.log(`保存话题 ${topicId} 浏览状态到本地存储`);
  } catch (e) {
    console.error(`保存话题 ${topicId} 浏览状态失败:`, e);
  }
}

/**
 * 保存活动报名状态到本地存储
 * @param {String|Number} eventId 活动ID
 * @param {Boolean} registered 是否已报名
 */
function saveEventRegistrationState(eventId, registered) {
  try {
    const userObj = store.getters.getUser();
    if (!userObj) return;
    
    const user = userObj.user || userObj;
    if (!user || !user.id) return;
    
    const storageKey = `event_registration_${eventId}`;
    const registrationData = {
      eventId,
      registered,
      userId: user.id,
      timestamp: Date.now(),
      expiration: Date.now() + CACHE_EXPIRATION.EVENT
    };
    
    uni.setStorageSync(storageKey, JSON.stringify(registrationData));
    console.log(`保存活动 ${eventId} 报名状态到本地存储`);
  } catch (e) {
    console.error(`保存活动 ${eventId} 报名状态失败:`, e);
  }
}

/**
 * 用户登录后加载交互状态
 */
function loadInteractionStates() {
  try {
    console.log('加载用户交互状态');
    
    // 简单延迟确保用户信息已完全加载
    setTimeout(() => {
      if (postActions.verifyUserLoginStatus()) {
        // 尝试从本地存储恢复全局状态
        restoreGlobalState();
      }
    }, 500);
  } catch (error) {
    console.error('加载交互状态出错:', error);
  }
}

/**
 * 从本地存储恢复全局状态
 */
function restoreGlobalState() {
  try {
    console.log('从本地存储恢复全局状态');
    
    // 恢复帖子状态 - 这部分已在postActions.js中实现
    
    // 恢复话题状态
    restoreTopicStates();
    
    // 恢复活动状态
    restoreEventStates();
    
  } catch (error) {
    console.error('恢复全局状态出错:', error);
  }
}

/**
 * 从本地存储恢复话题状态
 */
function restoreTopicStates() {
  try {
    // 尝试找出所有话题浏览状态
    uni.getStorageInfo({
      success: (res) => {
        const topicViewKeys = res.keys.filter(key => key.startsWith('topic_view_'));
        
        if (topicViewKeys.length > 0) {
          console.log(`找到 ${topicViewKeys.length} 个话题浏览记录`);
          
          let restoredCount = 0;
          const now = Date.now();
          
          topicViewKeys.forEach(key => {
            try {
              const data = uni.getStorageSync(key);
              if (data) {
                const viewData = JSON.parse(data);
                
                // 检查是否过期
                if (viewData.expiration && viewData.expiration > now) {
                  const topicId = viewData.topicId;
                  
                  stateStorage.topicStateMap.set(topicId, {
                    viewed: viewData.viewed,
                    lastViewTime: viewData.timestamp,
                    views: viewData.views
                  });
                  
                  stateStorage.lastUpdateTimeMap.set(`topic_${topicId}`, viewData.timestamp);
                  
                  restoredCount++;
                } else {
                  // 清除过期数据
                  uni.removeStorageSync(key);
                }
              }
            } catch (e) {
              console.error(`恢复话题状态出错:`, e);
            }
          });
          
          console.log(`成功恢复 ${restoredCount} 个话题浏览状态`);
        }
      }
    });
  } catch (error) {
    console.error('恢复话题状态出错:', error);
  }
}

/**
 * 从本地存储恢复活动状态
 */
function restoreEventStates() {
  try {
    // 尝试找出所有活动报名状态
    uni.getStorageInfo({
      success: (res) => {
        const eventKeys = res.keys.filter(key => key.startsWith('event_registration_'));
        
        if (eventKeys.length > 0) {
          console.log(`找到 ${eventKeys.length} 个活动报名记录`);
          
          let restoredCount = 0;
          const now = Date.now();
          
          eventKeys.forEach(key => {
            try {
              const data = uni.getStorageSync(key);
              if (data) {
                const registrationData = JSON.parse(data);
                
                // 检查是否过期
                if (registrationData.expiration && registrationData.expiration > now) {
                  const eventId = registrationData.eventId;
                  
                  stateStorage.eventStateMap.set(eventId, {
                    registered: registrationData.registered,
                    registrationTime: registrationData.timestamp
                  });
                  
                  stateStorage.lastUpdateTimeMap.set(`event_${eventId}`, registrationData.timestamp);
                  
                  restoredCount++;
                } else {
                  // 清除过期数据
                  uni.removeStorageSync(key);
                }
              }
            } catch (e) {
              console.error(`恢复活动状态出错:`, e);
            }
          });
          
          console.log(`成功恢复 ${restoredCount} 个活动报名状态`);
        }
      }
    });
  } catch (error) {
    console.error('恢复活动状态出错:', error);
  }
}

/**
 * 清除用户交互状态缓存
 * 通常在用户登出时调用
 */
function clearInteractionStates() {
  try {
    console.log('清除用户交互状态缓存');
    
    // 清除全局状态映射
    stateStorage.topicStateMap.clear();
    stateStorage.eventStateMap.clear();
    stateStorage.lastUpdateTimeMap.clear();
    
    // 重置全局版本号
    globalStateVersion = 0;
    
    // 清除本地存储中的状态
    uni.getStorageInfo({
      success: (res) => {
        // 清除话题浏览状态
        res.keys.filter(key => key.startsWith('topic_view_'))
          .forEach(key => {
            uni.removeStorageSync(key);
          });
        
        // 清除活动报名状态
        res.keys.filter(key => key.startsWith('event_registration_'))
          .forEach(key => {
            uni.removeStorageSync(key);
          });
      }
    });
  } catch (error) {
    console.error('清除交互状态缓存出错:', error);
  }
}

// 广播状态变化
const broadcastStateChanges = () => {
  console.log('[interactionActions] 广播状态变化');
  
  // 保存当前状态到存储
  saveTopicStatesToStorage();
  saveEventStatesToStorage();
  
  // 记录同步时间
  lastSyncTime = Date.now();
};

// 保存话题状态到存储
const saveTopicStatesToStorage = () => {
  try {
    // 将Map转换为对象
    const topicStates = {};
    stateStorage.topicStateMap.forEach((value, key) => {
      topicStates[key] = value;
    });
    
    // 保存到localStorage
    uni.setStorageSync('topicStates', JSON.stringify({
      data: topicStates,
      version: globalStateVersion,
      timestamp: Date.now()
    }));
    
    console.log(`[interactionActions] 已保存${Object.keys(topicStates).length}个话题状态到存储`);
  } catch (error) {
    console.error('[interactionActions] 保存话题状态到存储失败:', error);
  }
};

// 保存事件状态到存储
const saveEventStatesToStorage = () => {
  try {
    // 将Map转换为对象
    const eventStates = {};
    stateStorage.eventStateMap.forEach((value, key) => {
      eventStates[key] = value;
    });
    
    // 保存到localStorage
    uni.setStorageSync('eventStates', JSON.stringify({
      data: eventStates,
      version: globalStateVersion,
      timestamp: Date.now()
    }));
    
    console.log(`[interactionActions] 已保存${Object.keys(eventStates).length}个事件状态到存储`);
  } catch (error) {
    console.error('[interactionActions] 保存事件状态到存储失败:', error);
  }
};

// 从存储恢复交互状态
const restoreInteractionStates = () => {
  try {
    // 恢复话题状态
    const topicStatesStr = uni.getStorageSync('topicStates');
    if (topicStatesStr) {
      const topicStatesData = JSON.parse(topicStatesStr);
      
      // 检查数据是否过期
      if (Date.now() - topicStatesData.timestamp < CACHE_EXPIRATION.ALL_USER_STATES) {
        // 恢复Map
        stateStorage.topicStateMap = new Map();
        Object.keys(topicStatesData.data).forEach(key => {
          stateStorage.topicStateMap.set(key, topicStatesData.data[key]);
        });
        
        console.log(`[interactionActions] 已从存储恢复${stateStorage.topicStateMap.size}个话题状态`);
        
        // 恢复版本号
        if (topicStatesData.version > globalStateVersion) {
          globalStateVersion = topicStatesData.version;
        }
      } else {
        console.log('[interactionActions] 话题状态缓存已过期，不恢复');
      }
    }
    
    // 恢复事件状态
    const eventStatesStr = uni.getStorageSync('eventStates');
    if (eventStatesStr) {
      const eventStatesData = JSON.parse(eventStatesStr);
      
      // 检查数据是否过期
      if (Date.now() - eventStatesData.timestamp < CACHE_EXPIRATION.ALL_USER_STATES) {
        // 恢复Map
        stateStorage.eventStateMap = new Map();
        Object.keys(eventStatesData.data).forEach(key => {
          stateStorage.eventStateMap.set(key, eventStatesData.data[key]);
        });
        
        console.log(`[interactionActions] 已从存储恢复${stateStorage.eventStateMap.size}个事件状态`);
        
        // 恢复版本号，取较大者
        if (eventStatesData.version > globalStateVersion) {
          globalStateVersion = eventStatesData.version;
        }
      } else {
        console.log('[interactionActions] 事件状态缓存已过期，不恢复');
      }
    }
    
    // 恢复活动页面
    getActivePage();
    
    // 标记为已初始化
    isInitialized = true;
    
    // 返回恢复的状态数量
    return {
      success: true,
      topicStatesCount: stateStorage.topicStateMap.size,
      eventStatesCount: stateStorage.eventStateMap.size,
      version: globalStateVersion
    };
  } catch (error) {
    console.error('[interactionActions] 恢复交互状态失败:', error);
    return { success: false, error: error.message || '恢复状态失败' };
  }
};

// 模块初始化
const initialize = () => {
  if (isInitialized) return;
  
  console.log('[interactionActions] 初始化交互状态管理');
  
  try {
    // 使用try-catch包裹所有可能会抛出异常的操作
    
    // 检测当前环境
    let platform = 'unknown';
    try {
      const sysInfo = uni.getSystemInfoSync();
      platform = sysInfo.platform;
      console.log(`[interactionActions] 当前环境: ${platform}`);
    } catch (e) {
      console.error('[interactionActions] 获取系统信息失败:', e);
    }
    
    // 初始化默认状态，避免空引用
    if (!stateStorage.topicStateMap) stateStorage.topicStateMap = new Map();
    if (!stateStorage.eventStateMap) stateStorage.eventStateMap = new Map();
    if (!stateStorage.lastUpdateTimeMap) stateStorage.lastUpdateTimeMap = new Map();
    
    // 恢复状态 - 使用安全的方式执行
    try {
      // 在原生环境中延迟执行
      if (platform === 'android' || platform === 'ios') {
        setTimeout(() => {
          try {
            restoreInteractionStates();
            console.log('[interactionActions] 原生环境延迟恢复状态成功');
          } catch (err) {
            console.error('[interactionActions] 原生环境延迟恢复状态失败:', err);
            // 出错时进行备用初始化，确保关键状态存在
            safeRestore();
          }
        }, 1000);
      } else {
        // H5环境直接执行
        restoreInteractionStates();
      }
    } catch (error) {
      console.error('[interactionActions] 恢复状态失败但继续初始化:', error);
      // 出错时进行备用初始化，确保关键状态存在
      safeRestore();
    }
    
    // 恢复活动页面 - 使用安全的方式执行
    try {
      getActivePage();
    } catch (error) {
      console.error('[interactionActions] 恢复活动页面失败但继续初始化:', error);
      // 设置一个默认的活动页面状态
      activePage = null;
      activeContext = null;
    }
    
    // 标记为已初始化
    isInitialized = true;
    
    console.log('[interactionActions] 初始化完成');
  } catch (error) {
    console.error('[interactionActions] 初始化过程中出现未捕获异常:', error);
    // 即使出错，也标记为已初始化，避免反复尝试
    isInitialized = true;
    
    // 确保至少有最基本的状态存在
    safeRestore();
  }
};

// 安全恢复基本状态
const safeRestore = () => {
  try {
    console.log('[interactionActions] 执行安全恢复');
    
    // 确保全局状态对象存在
    if (!stateStorage.topicStateMap) stateStorage.topicStateMap = new Map();
    if (!stateStorage.eventStateMap) stateStorage.eventStateMap = new Map();
    if (!stateStorage.lastUpdateTimeMap) stateStorage.lastUpdateTimeMap = new Map();
    
    // 加载可能存在的本地存储数据
    try {
      const topicStatesStr = uni.getStorageSync('topicStates');
      if (topicStatesStr) {
        const topicStatesData = JSON.parse(topicStatesStr);
        if (topicStatesData && topicStatesData.data) {
          Object.keys(topicStatesData.data).forEach(key => {
            stateStorage.topicStateMap.set(key, topicStatesData.data[key]);
          });
          console.log(`[interactionActions] 安全恢复了${stateStorage.topicStateMap.size}个话题状态`);
        }
      }
    } catch (e) {
      console.error('[interactionActions] 恢复话题状态失败:', e);
    }
    
    try {
      const eventStatesStr = uni.getStorageSync('eventStates');
      if (eventStatesStr) {
        const eventStatesData = JSON.parse(eventStatesStr);
        if (eventStatesData && eventStatesData.data) {
          Object.keys(eventStatesData.data).forEach(key => {
            stateStorage.eventStateMap.set(key, eventStatesData.data[key]);
          });
          console.log(`[interactionActions] 安全恢复了${stateStorage.eventStateMap.size}个事件状态`);
        }
      }
    } catch (e) {
      console.error('[interactionActions] 恢复事件状态失败:', e);
    }
  } catch (e) {
    console.error('[interactionActions] 安全恢复失败:', e);
  }
};

// 自动初始化
initialize();

/**
 * 检查话题浏览状态
 * @param {String|Number} topicId 话题ID
 * @returns {Promise<Object>} 话题浏览状态
 */
const checkTopicViewStatus = async (topicId) => {
  try {
    if (!topicId) {
      return { success: false, error: '无效的话题ID' };
    }
    
    console.log(`检查话题 ${topicId} 浏览状态`);
    
    // 首先检查全局状态映射
    const topicState = stateStorage.topicStateMap.get(topicId);
    if (topicState !== undefined) {
      return { 
        success: true, 
        data: {
          hasViewed: !!topicState.viewed,
          viewDate: topicState.lastViewTime,
          fromCache: true
        }
      };
    }
    
    // 如果用户已登录，从API获取
    if (postActions.verifyUserLoginStatus()) {
      try {
        const result = await api.topics.checkViewStatus(topicId);
        
        if (result && result.success) {
          // 更新全局状态
          stateStorage.topicStateMap.set(topicId, {
            viewed: result.data.hasViewed,
            lastViewTime: result.data.viewDate ? new Date(result.data.viewDate).getTime() : null,
            views: result.data.topicViews
          });
          
          return result;
        }
        return { success: false, error: '获取浏览状态失败' };
      } catch (error) {
        console.error(`检查话题 ${topicId} 浏览状态出错:`, error);
        return { success: false, error };
      }
    }
    
    return { success: false, notLoggedIn: true };
  } catch (error) {
    console.error(`检查话题 ${topicId} 浏览状态出错:`, error);
    return { success: false, error };
  }
};

/**
 * 强制刷新话题状态
 * @param {String|Number} topicId 话题ID
 * @returns {Promise<Object>} 刷新结果
 */
const forceRefreshTopicStatus = async (topicId) => {
  try {
    if (!topicId) {
      return { success: false, error: '无效的话题ID' };
    }
    
    console.log(`强制刷新话题 ${topicId} 状态`);
    
    // 如果用户已登录，从API获取
    if (postActions.verifyUserLoginStatus()) {
      try {
        const result = await api.topics.checkViewStatus(topicId);
        
        if (result && result.success) {
          // 更新全局状态
          stateStorage.topicStateMap.set(topicId, {
            viewed: result.data.hasViewed,
            lastViewTime: result.data.viewDate ? new Date(result.data.viewDate).getTime() : null,
            views: result.data.topicViews
          });
          
          return result;
        }
        return { success: false, error: '获取浏览状态失败' };
      } catch (error) {
        console.error(`刷新话题 ${topicId} 状态出错:`, error);
        return { success: false, error };
      }
    }
    
    return { success: false, notLoggedIn: true };
  } catch (error) {
    console.error(`刷新话题 ${topicId} 状态出错:`, error);
    return { success: false, error };
  }
};

/**
 * 批量刷新话题状态
 * @param {Array<String|Number>} topicIds 话题ID数组
 * @returns {Promise<Object>} 刷新结果
 */
const refreshTopicStatuses = async (topicIds) => {
  try {
    if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
      return { success: false, error: '无效的话题ID数组' };
    }
    
    console.log(`批量刷新${topicIds.length}个话题状态`);
    
    // 如果用户已登录，从API获取
    if (postActions.verifyUserLoginStatus()) {
      try {
        const result = await api.topics.batchCheckViewStatus(topicIds);
        
        if (result && result.success) {
          // 更新全局状态
          Object.keys(result.data).forEach(topicId => {
            const topicData = result.data[topicId];
            stateStorage.topicStateMap.set(topicId, {
              viewed: topicData.hasViewed,
              lastViewTime: topicData.viewDate ? new Date(topicData.viewDate).getTime() : null,
              views: topicData.views
            });
          });
          
          return result;
        }
        return { success: false, error: '批量获取浏览状态失败' };
      } catch (error) {
        console.error(`批量刷新话题状态出错:`, error);
        return { success: false, error };
      }
    }
    
    return { success: false, notLoggedIn: true };
  } catch (error) {
    console.error(`批量刷新话题状态出错:`, error);
    return { success: false, error };
  }
};

/**
 * 检查活动报名状态
 * @param {String|Number} eventId 活动ID
 * @returns {Promise<Object>} 活动报名状态
 */
const checkEventRegistrationStatus = async (eventId) => {
  if (!eventId) return { success: false, error: '无效的活动ID' };
  
  try {
    console.log(`检查活动 ${eventId} 报名状态`);
    
    const eventState = await getEventRegistrationState(eventId);
    
    if (eventState) {
      return { 
        success: true, 
        data: {
          isRegistered: eventState.registered,
          registrationDate: eventState.registrationTime,
          fromCache: true
        }
      };
    }
    
    // 如果用户已登录，从API获取
    if (postActions.verifyUserLoginStatus()) {
      try {
        const result = await api.events.checkRegistrationStatus(eventId);
        
        if (result && result.success) {
          // 缓存查询结果，确保数据一致性
          const registered = result.data.isRegistered || false;
          const registrationTime = result.data.registrationDate ? new Date(result.data.registrationDate).getTime() : Date.now();
          
          // 更新全局状态
          stateStorage.eventStateMap.set(eventId, {
            registered,
            registrationTime
          });
          
          // 更新最后更新时间
          stateStorage.lastUpdateTimeMap.set(`event_${eventId}`, Date.now());
          
          // 保存到本地存储
          saveEventRegistrationState(eventId, registered);
        }
        
        return result;
      } catch (error) {
        console.error(`检查活动 ${eventId} 报名状态出错:`, error);
        return { success: false, error };
      }
    }
    
    return { success: false, notLoggedIn: true };
  } catch (error) {
    console.error(`检查活动 ${eventId} 报名状态出错:`, error);
    return { success: false, error };
  }
};

/**
 * 强制刷新活动状态
 * @param {String|Number} eventId 活动ID
 * @returns {Promise<Object>} 刷新结果
 */
const forceRefreshEventStatus = async (eventId) => {
  try {
    if (!eventId) {
      return { success: false, error: '无效的活动ID' };
    }
    
    console.log(`强制刷新活动 ${eventId} 状态`);
    
    // 如果用户已登录，从API获取
    if (postActions.verifyUserLoginStatus()) {
      try {
        const result = await api.events.checkRegistrationStatus(eventId);
        
        if (result && result.success) {
          const registered = result.data.isRegistered || false;
          const registrationTime = result.data.registrationDate ? new Date(result.data.registrationDate).getTime() : null;
          
          // 更新全局状态
          stateStorage.eventStateMap.set(eventId, {
            registered,
            registrationTime
          });
          
          // 更新最后更新时间
          stateStorage.lastUpdateTimeMap.set(`event_${eventId}`, Date.now());
          
          // 保存到本地存储
          saveEventRegistrationState(eventId, registered);
          
          return result;
        }
        return { success: false, error: '获取报名状态失败' };
      } catch (error) {
        console.error(`刷新活动 ${eventId} 状态出错:`, error);
        return { success: false, error };
      }
    }
    
    return { success: false, notLoggedIn: true };
  } catch (error) {
    console.error(`刷新活动 ${eventId} 状态出错:`, error);
    return { success: false, error };
  }
};

/**
 * 批量刷新活动状态
 * @param {Array<String|Number>} eventIds 活动ID数组
 * @returns {Promise<Object>} 刷新结果
 */
const refreshEventStatuses = async (eventIds) => {
  try {
    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return { success: false, error: '无效的活动ID数组' };
    }
    
    console.log(`批量刷新${eventIds.length}个活动状态`);
    
    // 如果用户已登录，从API获取
    if (postActions.verifyUserLoginStatus()) {
      try {
        const result = await api.events.batchCheckRegistration(eventIds);
        
        if (result && result.success) {
          // 更新全局状态
          Object.keys(result.data).forEach(eventId => {
            const eventData = result.data[eventId];
            if (eventData.exists !== false) {
              stateStorage.eventStateMap.set(eventId, {
                registered: eventData.isRegistered,
                registrationTime: eventData.registrationDate ? new Date(eventData.registrationDate).getTime() : null
              });
              
              // 更新最后更新时间
              stateStorage.lastUpdateTimeMap.set(`event_${eventId}`, Date.now());
              
              // 保存到本地存储
              saveEventRegistrationState(eventId, eventData.isRegistered);
            }
          });
          
          return result;
        }
        return { success: false, error: '批量获取报名状态失败' };
      } catch (error) {
        console.error(`批量刷新活动状态出错:`, error);
        return { success: false, error };
      }
    }
    
    return { success: false, notLoggedIn: true };
  } catch (error) {
    console.error(`批量刷新活动状态出错:`, error);
    return { success: false, error };
  }
};

/**
 * 清除状态缓存
 * @param {Boolean} clearAll 是否清除全部缓存
 * @returns {Object} 清除结果
 */
const clearStateCache = (clearAll = false) => {
  try {
    console.log(`清除状态缓存，${clearAll ? '包括全部缓存' : '仅临时缓存'}`);
    
    // 清除内存中的缓存
    if (clearAll) {
      stateStorage.topicStateMap.clear();
      stateStorage.eventStateMap.clear();
      stateStorage.lastUpdateTimeMap.clear();
      globalStateVersion = 0;
      
      // 清除本地存储中的缓存
      try {
        uni.removeStorageSync('topicStates');
        uni.removeStorageSync('eventStates');
        
        // 清除话题浏览和活动报名的单独缓存
        uni.getStorageInfo({
          success: (res) => {
            res.keys.forEach(key => {
              if (key.startsWith('topic_view_') || key.startsWith('event_registration_')) {
                uni.removeStorageSync(key);
              }
            });
          }
        });
      } catch (e) {
        console.error('清除本地存储缓存出错:', e);
      }
    } else {
      // 仅清除临时缓存
      // 这里可以实现部分缓存清除的逻辑
    }
    
    return { success: true };
  } catch (error) {
    console.error('清除状态缓存出错:', error);
    return { success: false, error };
  }
};

/**
 * 检查用户登录状态
 * @returns {Boolean} 是否已登录
 */
const checkLogin = () => {
  return postActions.verifyUserLoginStatus();
};

// 修改导出对象
export default {
  // 常量
  ACTIVE_PAGES,
  CACHE_EXPIRATION,
  
  // 页面管理
  setActivePage,
  getActivePage,
  
  // 话题相关
  handleTopicView,
  checkTopicViewStatus,
  forceRefreshTopicStatus,
  refreshTopicStatuses,
  
  // 事件相关
  handleEventRegistration,
  getEventRegistrationState,
  checkEventRegistrationStatus,
  forceRefreshEventStatus,
  refreshEventStatuses,
  
  // 状态管理
  restoreInteractionStates,
  broadcastStateChanges,
  clearStateCache,
  
  // 工具函数
  checkLogin
}; 