/**
 * 配置文件
 */
const config = {
  // API基础URL
  BASE_API_URL: 'http://localhost:12349/api',
  
  // 默认头像
  DEFAULT_AVATAR: '/uploads/default-avatar.png',
  
  // 头像基础URL（测试用）
  AVATAR_BASE_URL: 'http://localhost:12349',
  
  // 默认封面图
  DEFAULT_COVER: '/static/images/default-cover.jpg',
  
  // 图片上传地址
  UPLOAD_URL: 'http://localhost:12349/api/upload',
  
  // 请求超时时间（毫秒）
  TIMEOUT: 10000,
  
  // token过期时间（天）
  TOKEN_EXPIRE_DAYS: 7
};

export default config; 