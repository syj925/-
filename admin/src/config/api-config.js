/**
 * API配置文件
 * 统一管理API接口格式、字段映射等配置
 */

// API响应格式配置
export const API_RESPONSE_CONFIG = {
  // 后端统一响应格式
  SUCCESS_CODE: 0,
  SUCCESS_FIELD: 'code',
  MESSAGE_FIELD: 'msg',
  DATA_FIELD: 'data',
  
  // 前端期望格式（如果需要转换）
  FRONTEND_SUCCESS_FIELD: 'success',
  FRONTEND_MESSAGE_FIELD: 'message'
};

// 字段映射配置 - 前端字段名 -> 后端字段名
export const FIELD_MAPPING = {
  // 活动相关字段
  event: {
    // 时间字段
    startTime: 'start_time',
    endTime: 'end_time',
    registrationDeadline: 'registration_deadline',
    
    // 布尔字段
    isRecommended: 'is_recommended',
    allowCancelRegistration: 'allow_cancel_registration',
    
    // 数字字段
    maxParticipants: 'max_participants',
    currentParticipants: 'current_participants',
    viewCount: 'view_count',
    
    // 字符串/对象字段
    coverImage: 'cover_image',
    detailImages: 'detail_images',
    formConfig: 'form_config',
    registrationFields: 'registration_fields',
    
    // 时间戳字段
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  },
  
  // 用户相关字段
  user: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    lastLoginAt: 'last_login_at',
    isActive: 'is_active',
    isVerified: 'is_verified'
  },
  
  // 帖子相关字段
  post: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    likeCount: 'like_count',
    commentCount: 'comment_count',
    shareCount: 'share_count',
    viewCount: 'view_count',
    isAnonymous: 'is_anonymous',
    isRecommended: 'is_recommended'
  },
  
  // 评论相关字段
  comment: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    likeCount: 'like_count',
    parentId: 'parent_id',
    isAnonymous: 'is_anonymous'
  }
};

// 反向映射 - 后端字段名 -> 前端字段名
export const REVERSE_FIELD_MAPPING = {};
Object.keys(FIELD_MAPPING).forEach(category => {
  REVERSE_FIELD_MAPPING[category] = {};
  Object.entries(FIELD_MAPPING[category]).forEach(([frontend, backend]) => {
    REVERSE_FIELD_MAPPING[category][backend] = frontend;
  });
});

// API状态码配置
export const API_STATUS_CODES = {
  SUCCESS: 0,
  ERROR: 1,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500
};

// 分页配置
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100
};

// 活动状态配置 - 统一使用字符串格式
export const EVENT_STATUS = {
  UPCOMING: 'upcoming',    // 未开始
  ONGOING: 'ongoing',      // 进行中
  ENDED: 'ended',          // 已结束
  CANCELED: 'canceled'     // 已取消
};

export const EVENT_STATUS_LABELS = {
  [EVENT_STATUS.CANCELED]: '已取消',
  [EVENT_STATUS.UPCOMING]: '报名中',
  [EVENT_STATUS.ONGOING]: '进行中',
  [EVENT_STATUS.ENDED]: '已结束'
};

// 报名状态配置
export const REGISTRATION_STATUS = {
  CANCELED: 0,    // 已取消
  REGISTERED: 1,  // 已报名
  ATTENDED: 2     // 已参加
};

export const REGISTRATION_STATUS_LABELS = {
  [REGISTRATION_STATUS.CANCELED]: '已取消',
  [REGISTRATION_STATUS.REGISTERED]: '已报名',
  [REGISTRATION_STATUS.ATTENDED]: '已参加'
};

/**
 * 数据转换工具函数
 */

/**
 * 将前端数据转换为后端格式
 * @param {Object} data 前端数据
 * @param {String} category 数据类别 (event, user, post, comment)
 * @returns {Object} 转换后的后端数据
 */
export function transformToBackend(data, category = 'event') {
  if (!data || typeof data !== 'object') return data;
  
  const mapping = FIELD_MAPPING[category] || {};
  const transformed = { ...data };
  
  Object.entries(mapping).forEach(([frontend, backend]) => {
    if (frontend in transformed) {
      transformed[backend] = transformed[frontend];
      delete transformed[frontend];
    }
  });
  
  return transformed;
}

/**
 * 将后端数据转换为前端格式
 * @param {Object} data 后端数据
 * @param {String} category 数据类别 (event, user, post, comment)
 * @returns {Object} 转换后的前端数据
 */
export function transformToFrontend(data, category = 'event') {
  if (!data || typeof data !== 'object') return data;
  
  const mapping = REVERSE_FIELD_MAPPING[category] || {};
  const transformed = { ...data };
  
  Object.entries(mapping).forEach(([backend, frontend]) => {
    if (backend in transformed) {
      transformed[frontend] = transformed[backend];
      delete transformed[backend];
    }
  });
  
  return transformed;
}

/**
 * 检查API响应是否成功
 * @param {Object} response API响应
 * @returns {Boolean} 是否成功
 */
export function isApiSuccess(response) {
  return response && response[API_RESPONSE_CONFIG.SUCCESS_FIELD] === API_RESPONSE_CONFIG.SUCCESS_CODE;
}

/**
 * 获取API响应消息
 * @param {Object} response API响应
 * @returns {String} 响应消息
 */
export function getApiMessage(response) {
  return response ? response[API_RESPONSE_CONFIG.MESSAGE_FIELD] : '未知错误';
}

/**
 * 获取API响应数据
 * @param {Object} response API响应
 * @returns {Any} 响应数据
 */
export function getApiData(response) {
  return response ? response[API_RESPONSE_CONFIG.DATA_FIELD] : null;
}

/**
 * 格式化分页参数
 * @param {Object} params 分页参数
 * @returns {Object} 格式化后的参数
 */
export function formatPaginationParams(params = {}) {
  return {
    page: params.page || PAGINATION_CONFIG.DEFAULT_PAGE,
    limit: Math.min(params.limit || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE, PAGINATION_CONFIG.MAX_PAGE_SIZE),
    ...params
  };
}

export default {
  API_RESPONSE_CONFIG,
  FIELD_MAPPING,
  REVERSE_FIELD_MAPPING,
  API_STATUS_CODES,
  PAGINATION_CONFIG,
  EVENT_STATUS,
  EVENT_STATUS_LABELS,
  REGISTRATION_STATUS,
  REGISTRATION_STATUS_LABELS,
  transformToBackend,
  transformToFrontend,
  isApiSuccess,
  getApiMessage,
  getApiData,
  formatPaginationParams
};
