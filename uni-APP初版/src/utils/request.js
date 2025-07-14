import config from './config.js';
import { showAuthModal } from './auth.js';
import { useAppStore } from '../stores/appStore.js';

// 获取应用全局实例
let appInstance = null;
try {
  const pages = getCurrentPages();
  if (pages && pages.length > 0) {
    const page = pages[pages.length - 1];
    appInstance = page.$vm.$app;
  }
} catch (e) {
  console.error('获取app实例失败:', e);
}

// 请求计数器
let requestCounter = 0;

/**
 * 封装请求方法 - 支持options对象形式
 * @param {Object} options - 请求配置项
 */
const requestWithOptions = (options = {}) => {
  // 生成唯一请求ID
  const requestId = ++requestCounter;
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    // 默认配置
    const baseUrl = config.BASE_API_URL;
    const timeout = options.timeout || 60000;
    const header = {
      'content-type': 'application/json',
      ...options.header
    };
    
    // 获取token
    const token = uni.getStorageSync('token');
    if (token) {
      header.Authorization = `Bearer ${token}`;
      console.log(`请求[${requestId}] - 添加Authorization token头`);
    } else {
      console.warn(`请求[${requestId}] - 没有找到token，请求将不包含Authorization头`);
    }
    
    // 请求方法，默认为GET
    const method = (options.method || 'GET').toUpperCase();
    
    // 完整URL
    const url = (() => {
      // 检查URL是否有效
      if (!options.url || typeof options.url !== 'string') {
        console.warn(`请求URL无效: ${options.url}，将使用baseUrl: ${baseUrl}`);
        return baseUrl;
      }
      
      // 已经是完整URL的情况
      if (options.url.startsWith('http://') || options.url.startsWith('https://')) {
        return options.url;
      }
      
      // 确保URL以'/'开头但不重复
      const cleanPath = options.url.startsWith('/') ? options.url : `/${options.url}`;
      
      // 移除可能的重复'/api'前缀
      let finalPath = cleanPath;
      if (finalPath.startsWith('/api/api/')) {
        finalPath = finalPath.replace('/api/api/', '/api/');
        console.log('检测到并修正了双重/api前缀:', cleanPath, '->', finalPath);
      }
      
      // 确保baseUrl不以'/'结尾以避免双斜杠
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      
      return `${cleanBase}${finalPath}`;
    })();
    
    // 发起请求
    console.log(`请求[${requestId}] - 开始: ${method} ${url}`);
    console.log(`请求[${requestId}] - 请求头:`, JSON.stringify(header));
    if (options.data) {
      console.log(`请求[${requestId}] - 请求数据:`, JSON.stringify(options.data));
    }
    
    uni.request({
      url,
      data: options.data,
      method,
      header,
      timeout,
      success: (res) => {
        const { statusCode, data } = res;
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`请求[${requestId}] - 完成: ${method} ${url} (${duration}ms) 状态码:${statusCode}`);
        
        // 处理HTTP状态码
        if (statusCode >= 200 && statusCode < 300) {
          // 业务层状态处理
          if (data.success === false) {
            console.log(`请求[${requestId}] - 业务层错误:`, JSON.stringify(data));
            
            // 特殊错误码处理
            if (data.code === 401) {
              console.error('用户未授权，需要登录');
              // 清除当前token
              uni.removeStorageSync('token');
              // 显示登录模态框
              showAuthModal();
            }
          } else {
            console.log(`请求[${requestId}] - 成功:`, data.success ? '成功' : '失败');
          }
          
          // 正常返回业务数据
          resolve(data);
        } else if (statusCode === 401) {
          console.error(`请求[${requestId}] - 授权错误：未授权(401)`);
          
          // 清除当前token
          uni.removeStorageSync('token');
          
          // 显示登录模态框
          showAuthModal();
          
          // 返回错误
          reject({
            message: '请重新登录',
            code: 401,
            data
          });
        } else if (statusCode === 403) {
          console.error(`请求[${requestId}] - 权限错误：禁止访问(403)`);
          
          // 显示错误提示
          uni.showToast({
            title: '您没有权限执行此操作',
            icon: 'none'
          });
          
          // 返回错误
          reject({
            message: '没有权限',
            code: 403,
            data
          });
        } else if (statusCode === 404) {
          console.error(`请求[${requestId}] - 资源错误：资源不存在(404)`);
          
          // 返回错误
          reject({
            message: '请求的资源不存在',
            code: 404,
            data
          });
        } else if (statusCode === 500) {
          console.error(`请求[${requestId}] - 服务器错误(500)`, data);
          
          // 详细记录服务器错误信息
          if (data && typeof data === 'object') {
            console.error(`服务器错误详情: 
              成功状态: ${data.success}
              错误消息: ${data.message}
              错误类型: ${data.errorType || '未知'} 
              错误详情: ${data.errorDetail || '无'}`);
          }
          
          // 返回错误
          reject({
            message: data && data.message ? data.message : '服务器内部错误',
            code: 500,
            data
          });
        } else {
          console.error(`请求[${requestId}] - 未知HTTP状态码:${statusCode}`, data);
          
          // 返回错误
          reject({
            message: data && data.message ? data.message : `HTTP错误 ${statusCode}`,
            code: statusCode,
            data
          });
        }
      },
      fail: (err) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.error(`请求[${requestId}] - 失败: ${method} ${url} (${duration}ms)`, err);
        
        // 处理请求错误
        if (err.errMsg.includes('timeout')) {
          // 超时处理
          reject({
            message: '请求超时，请检查网络',
            code: 'TIMEOUT',
            error: err
          });
          
          // 通知系统可能需要进入离线模式
          try {
            const appStore = useAppStore();
            if (appStore) {
              appStore.setApiAvailability(false);
            }
          } catch (storeError) {
            console.error('更新API可用性状态失败:', storeError);
          }
        } else if (err.errMsg.includes('fail')) {
          // 网络错误
          reject({
            message: '网络请求失败，请检查网络连接',
            code: 'NETWORK_ERROR',
            error: err
          });
          
          // 检查网络状态
          try {
            uni.getNetworkType({
              success: (res) => {
                try {
                  const appStore = useAppStore();
                  if (appStore) {
                    appStore.setNetworkStatus({
                      isConnected: res.networkType !== 'none',
                      networkType: res.networkType
                    });
                    
                    if (res.networkType === 'none') {
                      // 网络已断开
                      appStore.setOfflineMode(true);
                    } else {
                      // 网络正常但API不可用
                      appStore.setApiAvailability(false);
                    }
                  }
                } catch (storeError) {
                  console.error('更新网络状态失败:', storeError);
                }
              },
              fail: (netErr) => {
                console.error('检查网络状态失败:', netErr);
                // 假设网络已断开
                try {
                  const appStore = useAppStore();
                  if (appStore) {
                    appStore.setNetworkStatus({
                      isConnected: false,
                      networkType: 'none'
                    });
                    appStore.setOfflineMode(true);
                  }
                } catch (storeError) {
                  console.error('设置离线模式失败:', storeError);
                }
              }
            });
          } catch (networkCheckError) {
            console.error('执行网络检查时出错:', networkCheckError);
          }
        } else {
          // 其他错误
          reject({
            message: '请求发生错误',
            code: 'REQUEST_ERROR',
            error: err
          });
        }
      },
      complete: () => {
        // 请求完成
      }
    });
  });
};

/**
 * 重载版本 - 支持(url, method, options)的调用方式
 * @param {String} url - 请求URL
 * @param {String} method - 请求方法
 * @param {Object} options - 请求选项
 */
const requestWithUrlMethod = (url, method = 'GET', options = {}) => {
  // 确保url是有效字符串
  if (!url) {
    console.error('无效的URL参数');
    return Promise.reject({ 
      success: false, 
      message: '无效的URL参数' 
    });
  }
  
  // 处理URL参数
  let cleanUrl = url;
  
  // 如果URL是字符串，清理并格式化它
  if (typeof url === 'string') {
    // 移除可能的重复'/api'前缀
    if (url.startsWith('/api/api/')) {
      cleanUrl = url.replace('/api/api/', '/api/');
    }
  } else {
    console.error('URL必须是字符串');
    return Promise.reject({ 
      success: false, 
      message: 'URL必须是字符串' 
    });
  }
  
  // 合并参数，构建完整的options对象
  return requestWithOptions({
    url: cleanUrl,
    method,
    data: options.data,
    header: options.headers,
    timeout: options.timeout
  });
};

/**
 * 通用request方法 - 自动判断参数格式
 */
const request = function() {
  // 根据参数类型判断调用方式
  if (arguments.length === 1 && typeof arguments[0] === 'object') {
    // 对象形式调用: request({url, method, data})
    return requestWithOptions(arguments[0]);
  } else if (arguments.length >= 1 && typeof arguments[0] === 'string') {
    // 多参数形式调用: request(url, method, options)
    return requestWithUrlMethod(...arguments);
  } else {
    // 无效参数
    console.error('无效的请求参数');
    return Promise.reject({ success: false, message: '无效的请求参数' });
  }
};

export default request; 