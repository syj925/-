/**
 * 内容验证规则配置
 * 这是默认的验证规则，打包到App中，确保离线可用
 */

// 默认验证规则
export const defaultValidationRules = {
  // 帖子长度限制
  minPostLength: 5,
  maxPostLength: 1000,
  
  // 标题长度限制
  minTitleLength: 0,
  maxTitleLength: 200,
  
  // 评论长度限制
  minCommentLength: 1,
  maxCommentLength: 500,
  
  // 敏感词过滤
  enableSensitiveFilter: true,
  sensitiveWords: [
    // 广告相关
    '广告', '推广', '营销', '代理', '加盟',
    '微信', 'QQ', '联系方式', '电话', '手机号',
    
    // 违法违规
    '赌博', '博彩', '彩票', '贷款', '借钱',
    '色情', '黄色', '成人', '约炮', '一夜情',
    
    // 政治敏感
    '政治', '政府', '官员', '贪污', '腐败',
    
    // 暴力相关
    '暴力', '打架', '斗殴', '报复', '威胁',
    
    // 诈骗相关
    '诈骗', '骗子', '假货', '山寨', '盗版'
  ],
  sensitiveWordAction: 'block', // block: 阻止发布, replace: 替换为***, warn: 警告但允许发布
  
  // 发布限制
  dailyPostLimit: 10,
  dailyCommentLimit: 50,
  
  // 图片限制
  maxImagesPerPost: 9,
  maxImageSize: 5, // MB
  allowedImageTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  
  // 话题限制
  maxTopicsPerPost: 5,
  maxTopicLength: 20,
  
  // 其他限制
  maxReplyLevel: 3, // 最大回复层级
  enableImageUpload: true,
  enableLocationSharing: true,
  enableAnonymousPost: true
}

// 规则版本号（用于检查更新）
export const rulesVersion = '1.0.0'

// 远程配置URL（可选）
export const remoteConfigUrl = '/api/content-rules'

// 缓存配置
export const cacheConfig = {
  // 缓存过期时间（毫秒）
  expireTime: 5 * 60 * 1000, // 5分钟
  
  // 本地存储key
  storageKey: 'validation_rules_cache',
  
  // 版本存储key
  versionKey: 'validation_rules_version'
}

// 错误提示文案
export const errorMessages = {
  CONTENT_REQUIRED: '请输入内容',
  CONTENT_TOO_SHORT: '内容长度不足，至少需要{min}个字符',
  CONTENT_TOO_LONG: '内容过长，最多允许{max}个字符',
  TITLE_TOO_LONG: '标题过长，最多允许{max}个字符',
  SENSITIVE_WORDS_DETECTED: '内容包含敏感词：{words}，请修改后重试',
  DAILY_LIMIT_EXCEEDED: '今日发布次数已达上限（{limit}次），请明天再试',
  NETWORK_ERROR: '网络连接失败，使用本地验证规则',
  VALIDATION_FAILED: '内容验证失败，请检查后重试'
}

export default defaultValidationRules
