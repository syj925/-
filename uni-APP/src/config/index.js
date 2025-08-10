/**
 * 应用全局配置
 */

// 应用环境
export const ENV = process.env.NODE_ENV || 'development';

// 默认服务器配置
export const SERVER_CONFIG = {
  // 开发环境配置
  development: {
    // 服务器地址列表，按优先级排序
    serverUrls: [
      'http://localhost:3000',        // 本地开发服务器 (H5模式首选)
      'http://127.0.0.1:3000',        // 本地开发服务器 (备用)
      'http://192.168.1.3:3000',      // 网络地址
      'http://10.0.2.2:3000'          // Android模拟器专用
    ],
    // API版本
    apiVersion: 'v1',
    // 连接超时(毫秒)
    timeout: 30000,
    // 健康检查路径
    healthCheckPath: '/health'
  },
  // 生产环境配置
  production: {
    // 服务器地址列表，按优先级排序
    serverUrls: [
      'https://api.campuswall.example.com',  // 主服务器
      'https://api-backup.campuswall.example.com'  // 备用服务器
    ],
    // API版本
    apiVersion: 'v1',
    // 连接超时(毫秒)
    timeout: 30000,
    // 健康检查路径
    healthCheckPath: '/health'
  }
};

// 获取当前环境配置
export const getConfig = () => {
  return SERVER_CONFIG[ENV] || SERVER_CONFIG.development;
};

// 获取用户自定义服务器
export const getUserServer = () => {
  try {
    return uni.getStorageSync('user_server_url') || '';
  } catch (error) {
    console.error('获取用户自定义服务器失败:', error);
    return '';
  }
};

// 设置用户自定义服务器
export const setUserServer = (serverUrl) => {
  try {
    uni.setStorageSync('user_server_url', serverUrl);
    return true;
  } catch (error) {
    console.error('设置用户自定义服务器失败:', error);
    return false;
  }
};

// 获取最佳服务器
export const getBestServer = () => {
  try {
    // 优先使用用户自定义服务器
    const userServer = getUserServer();
    if (userServer) {
      console.log('使用用户自定义服务器:', userServer);
      return userServer;
    }
    
    // 其次使用已探测到的最佳服务器
    const bestServer = uni.getStorageSync('best_server_ip');
    if (bestServer) {
      console.log('使用已探测到的最佳服务器:', bestServer);
      return bestServer;
    }
    
    // 最后使用默认服务器
    const defaultServer = getConfig().serverUrls[0];
    console.log('使用默认服务器:', defaultServer);
    return defaultServer;
  } catch (error) {
    console.error('获取最佳服务器失败:', error);
    return getConfig().serverUrls[0];
  }
};

// 获取所有可用服务器
export const getAllServers = () => {
  const config = getConfig();
  const userServer = getUserServer();
  
  // 如果有用户自定义服务器，将其放在最前面
  if (userServer && !config.serverUrls.includes(userServer)) {
    return [userServer, ...config.serverUrls];
  }
  
  return config.serverUrls;
};

// 获取超时设置
export const getTimeout = () => {
  return getConfig().timeout || 30000;
};

// 获取健康检查路径
export const getHealthCheckPath = () => {
  return getConfig().healthCheckPath || '/health';
};

export default {
  ENV,
  getConfig,
  getUserServer,
  setUserServer,
  getBestServer,
  getAllServers,
  getTimeout,
  getHealthCheckPath
}; 