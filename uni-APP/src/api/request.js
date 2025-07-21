/**
 * 请求封装
 */

// 导入配置
import appConfig from '@/config';

// 基础URL - 根据运行环境自动选择
let BASE_URL;

// 获取服务器地址
const initBaseUrl = () => {
  // 清除可能存在的错误服务器缓存
  try {
    const savedServer = uni.getStorageSync('best_server_ip');
    if (savedServer && savedServer.includes('172.168.4.28')) {
      console.warn('检测到错误的服务器地址缓存，正在清除:', savedServer);
      uni.removeStorageSync('best_server_ip');
    }

    const userServer = uni.getStorageSync('user_server_url');
    if (userServer && userServer.includes('172.168.4.28')) {
      console.warn('检测到错误的用户服务器地址，正在清除:', userServer);
      uni.removeStorageSync('user_server_url');
    }
  } catch (error) {
    console.error('清除错误缓存时出错:', error);
  }

  // 优先使用用户自定义服务器
  const userServer = appConfig.getUserServer();
  if (userServer) {
    BASE_URL = userServer;
    console.log('使用用户自定义服务器地址:', BASE_URL);
    return;
  }
  
  // 判断当前环境
  // #ifdef H5
  // H5环境使用完整URL
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  // 修改为使用完整URL，确保端口号正确
  BASE_URL = isLocalhost ? 'http://localhost:3000' : 'http://172.168.8.227:3000';
  console.log('H5环境设置BASE_URL:', BASE_URL, '当前域名:', window.location.hostname);
  // #endif
  
  // #ifdef APP-PLUS || MP
  // 移动设备环境使用IP地址
  // 提供多个备选地址，以防某个地址不可用
  const SERVER_IPS = appConfig.getAllServers();
  
  // 默认使用第一个IP
  BASE_URL = SERVER_IPS[0];
  
  // 如果本地存储中有最佳IP，优先使用
  const savedIP = uni.getStorageSync('best_server_ip');
  if (savedIP) {
    console.log(`使用保存的最佳服务器IP: ${savedIP}`);
    BASE_URL = savedIP;
  }
  
  // 动态检测可用IP (下次启动App时会使用)
  setTimeout(() => {
    checkServerAvailability();
  }, 1000);
  // #endif
  
  // 如果没有匹配到任何条件，使用默认值
  if (!BASE_URL) {
    BASE_URL = appConfig.getConfig().serverUrls[0];
  }
  
  // 输出当前使用的服务器地址
  console.log(`当前使用的服务器地址: ${BASE_URL}`);
};

// 初始化BASE_URL
initBaseUrl();

/**
 * 检查服务器可用性并存储最佳IP
 */
function checkServerAvailability() {
  console.log('开始检测服务器可用性...');
  
  // 获取所有服务器地址
  const SERVER_IPS = appConfig.getAllServers();
  
  // 遍历所有服务器IP
  Promise.all(SERVER_IPS.map(ip => {
    return new Promise(resolve => {
      console.log(`正在检测服务器: ${ip}`);
      
      // 设置较短的超时时间
      const timeoutId = setTimeout(() => {
        console.log(`服务器 ${ip} 连接超时`);
        resolve({ ip, status: 'timeout', time: 5000 });
      }, 5000);
      
      // 发起测试请求
      uni.request({
        url: `${ip}${appConfig.getHealthCheckPath()}`,
        method: 'GET',
        timeout: 5000,
        success: (res) => {
          clearTimeout(timeoutId);
          const time = new Date().getTime() - startTime;
          console.log(`服务器 ${ip} 连接成功，响应时间: ${time}ms`, res);
          resolve({ ip, status: 'success', time });
        },
        fail: (err) => {
          clearTimeout(timeoutId);
          const time = new Date().getTime() - startTime;
          console.log(`服务器 ${ip} 连接失败，耗时: ${time}ms`, err);
          resolve({ ip, status: 'fail', time });
        }
      });
      
      const startTime = new Date().getTime();
    });
  }))
  .then(results => {
    // 筛选出可用的服务器
    const available = results.filter(r => r.status === 'success');
    
    if (available.length > 0) {
      // 按响应时间排序
      available.sort((a, b) => a.time - b.time);
      
      // 保存最佳IP到本地存储
      const bestIP = available[0].ip;
      console.log(`找到最佳服务器: ${bestIP}，响应时间: ${available[0].time}ms`);
      uni.setStorageSync('best_server_ip', bestIP);
      
      // 更新当前使用的BASE_URL
      BASE_URL = bestIP;
      console.log('更新当前BASE_URL为:', BASE_URL);
    } else {
      console.log('所有服务器均不可用');
    }
  });
}

// 请求超时时间 - 从配置中获取
const TIMEOUT = appConfig.getTimeout();

/**
 * 请求拦截器
 * @param {Object} config 请求配置
 */
const requestInterceptor = (config) => {
  // 获取token
  const token = uni.getStorageSync('token');

  // 添加token到请求头
  if (token) {
    config.header = {
      ...config.header,
      'Authorization': `Bearer ${token}`
    };
  }

  console.log(`准备发送请求: ${config.method} ${config.url}`, config.data);
  return config;
};

/**
 * 响应拦截器
 * @param {Object} response 响应数据
 */
const responseInterceptor = (response) => {
  const { statusCode, data } = response;

  console.log(`收到响应: ${statusCode}`, data);

  // 请求成功
  if (statusCode >= 200 && statusCode < 300) {
    // API格式可能是: { code: 0, msg: 'success', data: {} } 
    // 或者是: { code: 200, msg: 'success', data: {} }
    if (data.code === 0 || data.code === 200) {
      // 直接返回data对象而非data.data，允许调用者处理完整响应
      return data;
    } else {
      // 业务逻辑错误 - 不在这里显示错误提示，让具体页面处理
      console.error('业务逻辑错误:', JSON.stringify(data, null, 2));
      // 创建一个包含完整错误信息的错误对象
      const error = new Error(
        (data.data && data.data.message) ||
        data.message ||
        data.msg ||
        '请求失败'
      );
      error.code = data.code;
      error.data = data.data;
      return Promise.reject(error);
    }
  }
  
  // 401未授权
  if (statusCode === 401) {
    uni.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none'
    });
    
    // 清除token
    uni.removeStorageSync('token');
    
    // 跳转到登录页
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/auth/login/index'
      });
    }, 1500);
    
    return Promise.reject({code: 401, msg: '登录已过期，请重新登录'});
  }
  
  // 400错误，通常是参数验证错误
  if (statusCode === 400) {
    console.error('400错误 - 参数验证失败:', JSON.stringify(data, null, 2));

    // 如果有详细的错误信息，打印出来
    if (data.data && data.data.details) {
      console.error('验证错误详情:', JSON.stringify(data.data.details, null, 2));
    }

    // 创建包含完整错误信息的错误对象
    const error = new Error(
      (data.data && data.data.message) ||
      data.message ||
      data.msg ||
      '参数验证失败'
    );
    error.code = data.code || 400;
    error.data = data.data;
    return Promise.reject(error);
  }
  
  // 404资源不存在
  if (statusCode === 404) {
    console.error('404错误 - 资源不存在:', JSON.stringify(data, null, 2));
    const error = new Error('请求的资源不存在');
    error.code = 404;
    return Promise.reject(error);
  }
  
  // 服务器错误
  if (statusCode >= 500) {
    console.error('500错误 - 服务器错误:', JSON.stringify(data, null, 2));
    const error = new Error('服务器错误，请稍后再试');
    error.code = 500;
    return Promise.reject(error);
  }
  
  // 其他错误
  console.error(`未处理的HTTP错误 ${statusCode}:`, JSON.stringify(data, null, 2));
  const error = new Error(
    (data.data && data.data.message) ||
    data.message ||
    data.msg ||
    '请求失败'
  );
  error.code = statusCode;
  return Promise.reject(error);
};

/**
 * 处理URL，确保正确的协议
 */
const ensureValidUrl = (url) => {
  // 如果已经是完整URL，则直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 如果是相对路径，拼接到BASE_URL
  if (url.startsWith('/')) {
    return BASE_URL + url;
  }
  
  // 如果是其他格式，添加/并拼接
  return BASE_URL + '/' + url;
};

/**
 * 请求函数
 * @param {Object} options 请求配置
 */
const request = (options) => {
  // 合并配置
  const finalUrl = ensureValidUrl(options.url);
  
  const config = {
    url: finalUrl,
    method: options.method || 'GET',
    data: options.data,
    timeout: TIMEOUT,
    header: {
      'Content-Type': 'application/json',
      ...options.header
    }
  };
  
  // 去掉可能导致URL错误的参数
  delete options.url;
  
  // 合并其他参数
  Object.keys(options).forEach(key => {
    if (key !== 'method' && key !== 'data' && key !== 'header') {
      config[key] = options[key];
    }
  });
  
  // 请求拦截
  const interceptedConfig = requestInterceptor(config);
  
  return new Promise((resolve, reject) => {
    // 添加请求超时计时器
    const requestStartTime = Date.now()
    let isResolved = false

    // 设置超时处理（30秒）
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true
        console.error('请求超时，请检查网络连接')
        reject(new Error('请求超时，请检查网络连接'))
      }
    }, 30000)

    uni.request({
      ...interceptedConfig,
      success: (response) => {
        if (isResolved) return
        isResolved = true
        clearTimeout(timeoutId)

        try {
          const result = responseInterceptor(response);
          resolve(result);
        } catch (error) {
          console.error('响应处理失败:', error)
          reject(error);
        }
      },
      fail: (error) => {
        if (isResolved) return
        isResolved = true
        clearTimeout(timeoutId)

        console.error('网络请求失败:', error)
        
        // 处理file协议错误
        if (error.errMsg && error.errMsg.includes('scheme')) {
          console.log('检测到协议错误，使用完整URL重试');
          
          // 强制使用BASE_URL
          const retryUrl = BASE_URL + (options.url && options.url.startsWith('/') ? options.url : '/' + (options.url || ''));
          
          uni.request({
            ...interceptedConfig,
            url: retryUrl,
            success: (response) => {
              try {
                const result = responseInterceptor(response);
                resolve(result);
              } catch (error) {
                reject(error);
              }
            },
            fail: (retryError) => {
              console.error('重试请求仍然失败:', retryError);
              uni.showToast({
                title: '网络连接失败',
                icon: 'none'
              });
              reject({code: -1, msg: '网络请求失败'});
            }
          });
          return;
        }
        
        // 分析错误类型
        let errorMessage = '网络请求失败'
        let errorCode = -1

        if (error.errMsg) {
          if (error.errMsg.includes('timeout')) {
            errorMessage = '请求超时，请检查网络连接'
            errorCode = -2
          } else if (error.errMsg.includes('fail')) {
            errorMessage = '网络连接失败，请检查服务器地址'
            errorCode = -3
          } else if (error.errMsg.includes('abort')) {
            errorMessage = '请求被中断'
            errorCode = -4
          }
        }

        uni.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 3000
        });

        reject({
          code: errorCode,
          msg: errorMessage,
          originalError: error
        });
      }
    });
  });
};

/**
 * 更新服务器地址
 * @param {String} newBaseUrl 新的服务器地址
 * @returns {Boolean} 是否更新成功
 */
export const updateBaseUrl = (newBaseUrl) => {
  if (!newBaseUrl) return false;
  
  try {
    // 保存到配置
    appConfig.setUserServer(newBaseUrl);
    
    // 更新当前使用的BASE_URL
    BASE_URL = newBaseUrl;
    console.log('已更新服务器地址为:', BASE_URL);
    
    // 测试新服务器连接
    uni.request({
      url: `${BASE_URL}${appConfig.getHealthCheckPath()}`,
      method: 'GET',
      timeout: 5000,
      success: () => {
        uni.showToast({
          title: '服务器连接成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('新服务器连接测试失败:', err);
        uni.showToast({
          title: '服务器连接失败，但已保存设置',
          icon: 'none'
        });
      }
    });
    
    return true;
  } catch (error) {
    console.error('更新服务器地址失败:', error);
    return false;
  }
};

/**
 * 重置服务器地址为默认值
 * @returns {Boolean} 是否重置成功
 */
export const resetBaseUrl = () => {
  try {
    // 清除用户自定义服务器
    appConfig.setUserServer('');
    
    // 清除最佳服务器记录
    uni.removeStorageSync('best_server_ip');
    
    // 重新初始化BASE_URL
    initBaseUrl();
    
    uni.showToast({
      title: '已重置服务器地址',
      icon: 'success'
    });
    
    return true;
  } catch (error) {
    console.error('重置服务器地址失败:', error);
    return false;
  }
};

// 请求方法
export const http = {
  get config() {
    return { baseURL: BASE_URL }; // 使用getter确保始终返回最新的BASE_URL
  },
  get: (url, data, options = {}) => request({ url, method: 'GET', data, ...options }),
  post: (url, data, options = {}) => request({ url, method: 'POST', data, ...options }),
  put: (url, data, options = {}) => request({ url, method: 'PUT', data, ...options }),
  delete: (url, data, options = {}) => request({ url, method: 'DELETE', data, ...options }),
  updateBaseUrl, // 添加更新服务器地址方法
  resetBaseUrl // 添加重置服务器地址方法
};

export default http; 