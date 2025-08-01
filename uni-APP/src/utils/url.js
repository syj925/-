/**
 * URL相关工具函数
 * 支持相对路径和绝对路径的智能处理
 */

// 导入配置
import appConfig from '@/config';

// 获取当前环境下的BASE_URL
const getBaseUrl = () => {
  let baseUrl = '';

  // 尝试从API配置获取
  try {
    // 如果已经引入了API模块
    if (getApp() && getApp().globalData && getApp().globalData.$api &&
        getApp().globalData.$api.http && getApp().globalData.$api.http.config) {
      baseUrl = getApp().globalData.$api.http.config.baseURL;
      return baseUrl;
    }
  } catch (error) {
    // 静默处理错误
  }

  // 从配置中获取最佳服务器地址
  baseUrl = appConfig.getBestServer();

  // 如果仍然为空，使用最终默认值
  if (!baseUrl) {
    // 根据平台设置不同的默认值
    // #ifdef H5
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    baseUrl = isLocalhost ? 'http://localhost:3000' : 'http://192.168.1.6:3000';
    // #endif

    // #ifdef APP-PLUS || MP
    baseUrl = 'http://192.168.1.6:3000';
    // #endif
  }

  return baseUrl;
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
    // 检查是否包含需要替换的旧IP地址
    const oldIPs = ['localhost', '127.0.0.1', '192.168.1.6'];

    for (const oldIP of oldIPs) {
      if (urlStr.includes(oldIP)) {
        // 提取路径部分
        const urlParts = urlStr.split('/');
        const pathIndex = urlParts.findIndex(part => part.includes(oldIP));

        if (pathIndex >= 0) {
          // 重新构建URL，使用当前正确的服务器地址
          const pathParts = urlParts.slice(pathIndex + 1);
          const relativePath = pathParts.length > 0 ? '/' + pathParts.join('/') : '';

          const baseUrl = getBaseUrl();
          const correctedUrl = baseUrl + relativePath;

          console.log(`URL修正: ${urlStr} -> ${correctedUrl}`);
          return correctedUrl;
        }
      }
    }

    // 如果没有需要修正的IP，直接返回
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
      avatar: '/static/images/common/default-avatar.png',
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