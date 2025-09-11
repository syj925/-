/**
 * URL相关工具函数
 * 支持相对路径和绝对路径的智能处理
 */

// 导入配置
import appConfig from '@/config';

// 获取当前环境下的BASE_URL
const getBaseUrl = () => {
  let baseUrl = '';

  // 优先从配置文件获取最佳服务器地址
  try {
    baseUrl = appConfig.getBestServer();
    if (baseUrl) {
      console.log('🔗 使用配置文件服务器:', baseUrl);
      return baseUrl;
    }
  } catch (error) {
    console.warn('⚠️ 获取配置文件服务器失败:', error);
  }

  // 备选方案：从API配置获取
  try {
    if (getApp() && getApp().globalData && getApp().globalData.$api &&
        getApp().globalData.$api.http && getApp().globalData.$api.http.config) {
      baseUrl = getApp().globalData.$api.http.config.baseURL;
      if (baseUrl) {
        console.log('🔗 使用API配置服务器:', baseUrl);
        return baseUrl;
      }
    }
  } catch (error) {
    // 静默处理错误
  }

  // 最终备选方案：使用配置文件中的默认服务器
  try {
    const config = appConfig.getConfig();
    baseUrl = config.serverUrls[0];
    console.log('🔗 使用默认配置服务器:', baseUrl);
    return baseUrl;
  } catch (error) {
    console.error('❌ 获取服务器地址失败:', error);
    return 'http://localhost:3000'; // 硬编码兜底
  }
};

/**
 * 确保URL是完整的绝对URL
 * @param {String} url 需要规范化的URL
 * @returns {String} 完整的绝对URL
 */
export const ensureAbsoluteUrl = (url) => {
  // 处理空值或无效值
  if (!url || url === 'undefined' || url === 'null') {
    return '';
  }

  // 将非字符串转成字符串
  const urlStr = String(url);

  // 如果是本地静态资源，直接返回
  if (urlStr.startsWith('/static/')) {
    return urlStr;
  }

  // 如果已经是完整的URL，检查是否需要修正
  if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
    // 从配置中获取需要检查的服务器地址
    const config = appConfig.getConfig();
    const currentBestServer = appConfig.getBestServer();
    
    // 检查是否包含需要替换的地址（包括端口不匹配）
    const needsCorrection = config.serverUrls.some(serverUrl => {
      if (urlStr.startsWith(serverUrl)) return false; // 完全匹配，无需修正
      
      // 检查是否是同一域名但不同端口
      try {
        const urlObj = new URL(urlStr);
        const serverObj = new URL(serverUrl);
        return urlObj.hostname === serverObj.hostname && urlObj.port !== serverObj.port;
      } catch (e) {
        return false;
      }
    });

    // 如果需要修正，或者不在配置的服务器列表中
    if (needsCorrection || !config.serverUrls.some(server => urlStr.startsWith(server))) {
      try {
        const urlObj = new URL(urlStr);
        const baseObj = new URL(currentBestServer);
        
        // 重新构建URL，使用当前最佳服务器的协议、域名和端口
        const correctedUrl = `${baseObj.protocol}//${baseObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        
        console.log(`🔄 URL修正: ${urlStr} -> ${correctedUrl}`);
        return correctedUrl;
      } catch (error) {
        console.warn('⚠️ URL修正失败:', error);
        return urlStr;
      }
    }

    // 如果已经是正确的URL，直接返回
    return urlStr;
  }

  // 如果是相对路径，拼接基础URL
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    console.warn('无法获取基础URL，返回原始URL:', urlStr);
    return urlStr;
  }

  // 确保baseUrl不以/结尾
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  // 如果urlStr不以/开头，添加/
  const cleanUrl = urlStr.startsWith('/') ? urlStr : '/' + urlStr;

  return cleanBaseUrl + cleanUrl;
};

/**
 * 确保图片URL是完整的绝对URL
 * @param {String} imageUrl 图片URL
 * @param {String} defaultType 默认图片类型 ('avatar', 'event', 'post')
 * @returns {String} 处理后的URL
 */
export const ensureImageUrl = (imageUrl, defaultType = 'avatar') => {
  // 处理空值的情况，根据类型返回不同的默认图片
  if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') {
    const defaultImages = {
      avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGNUY1RjUiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzlFOUU5RSIvPgo8cGF0aCBkPSJNOCAzMi41QzggMjguOTE0NiAxMS40MTQ2IDI2IDE1IDI2SDI1QzI4LjU4NTQgMjYgMzIgMjguOTE0NiAzMiAzMi41VjQwSDhWMzIuNVoiIGZpbGw9IiM5RTlFOUUiLz4KPC9zdmc+',
      event: '/static/images/common/event-default.png',
      post: '/static/images/common/post-default.png'
    };
    return defaultImages[defaultType] || defaultImages.avatar;
  }

  // 将非字符串转成字符串
  const urlStr = String(imageUrl);

  // 如果是默认资源路径，直接返回
  if (urlStr.startsWith('/static/')) {
    return urlStr;
  }

  // 其他情况确保是绝对URL
  return ensureAbsoluteUrl(urlStr);
};

export default {
  ensureAbsoluteUrl,
  ensureImageUrl,
  getBaseUrl
}; 