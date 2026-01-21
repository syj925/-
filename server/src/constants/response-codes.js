/**
 * 响应状态码常量定义
 * 统一管理HTTP状态码，避免魔法数字，提高代码可读性
 */
const { StatusCodes } = require('http-status-codes');

const ResponseCodes = {
  // 成功响应 2xx
  SUCCESS: StatusCodes.OK,                    // 200 - 请求成功
  CREATED: StatusCodes.CREATED,               // 201 - 资源创建成功
  ACCEPTED: StatusCodes.ACCEPTED,             // 202 - 请求已接受，但处理未完成
  NO_CONTENT: StatusCodes.NO_CONTENT,         // 204 - 请求成功，无返回内容

  // 客户端错误 4xx
  BAD_REQUEST: StatusCodes.BAD_REQUEST,       // 400 - 请求参数错误
  UNAUTHORIZED: StatusCodes.UNAUTHORIZED,     // 401 - 未授权，需要身份验证
  FORBIDDEN: StatusCodes.FORBIDDEN,           // 403 - 已授权但被禁止访问
  NOT_FOUND: StatusCodes.NOT_FOUND,           // 404 - 资源不存在
  METHOD_NOT_ALLOWED: StatusCodes.METHOD_NOT_ALLOWED, // 405 - 请求方法不允许
  CONFLICT: StatusCodes.CONFLICT,             // 409 - 请求冲突
  UNPROCESSABLE_ENTITY: StatusCodes.UNPROCESSABLE_ENTITY, // 422 - 请求格式正确但无法处理
  TOO_MANY_REQUESTS: StatusCodes.TOO_MANY_REQUESTS, // 429 - 请求过多

  // 服务器错误 5xx
  INTERNAL_ERROR: StatusCodes.INTERNAL_SERVER_ERROR, // 500 - 服务器内部错误
  BAD_GATEWAY: StatusCodes.BAD_GATEWAY,       // 502 - 网关错误
  SERVICE_UNAVAILABLE: StatusCodes.SERVICE_UNAVAILABLE, // 503 - 服务不可用

  // 业务场景映射 - 为不同业务场景提供语义化的状态码
  
  // 用户相关
  USER_ERROR: StatusCodes.BAD_REQUEST,        // 用户操作错误
  LOGIN_FAILED: StatusCodes.BAD_REQUEST,      // 登录失败
  USER_NOT_FOUND: StatusCodes.NOT_FOUND,      // 用户不存在
  USER_FORBIDDEN: StatusCodes.FORBIDDEN,      // 用户操作被禁止
  
  // 文件上传相关
  UPLOAD_ERROR: StatusCodes.BAD_REQUEST,      // 上传参数错误
  FILE_TYPE_ERROR: StatusCodes.BAD_REQUEST,   // 文件类型不支持
  FILE_SIZE_ERROR: StatusCodes.BAD_REQUEST,   // 文件大小超限
  UPLOAD_FAILED: StatusCodes.INTERNAL_SERVER_ERROR, // 上传处理失败
  
  // 内容相关
  CONTENT_ERROR: StatusCodes.BAD_REQUEST,     // 内容格式错误
  CONTENT_NOT_FOUND: StatusCodes.NOT_FOUND,   // 内容不存在
  CONTENT_FORBIDDEN: StatusCodes.FORBIDDEN,   // 内容访问被禁止
  
  // 验证相关
  VALIDATION_ERROR: StatusCodes.BAD_REQUEST,  // 数据验证失败
  AUTH_ERROR: StatusCodes.UNAUTHORIZED,       // 认证失败
  PERMISSION_ERROR: StatusCodes.FORBIDDEN,    // 权限不足
  
  // 限流相关
  RATE_LIMIT_ERROR: StatusCodes.TOO_MANY_REQUESTS, // 请求频率限制
  
  // 系统相关
  SYSTEM_ERROR: StatusCodes.INTERNAL_SERVER_ERROR, // 系统错误
  SYSTEM_BUSY: StatusCodes.SERVICE_UNAVAILABLE     // 系统繁忙
};

/**
 * 根据错误类型获取对应的HTTP状态码
 * @param {string} errorType 错误类型
 * @returns {number} HTTP状态码
 */
const getStatusCodeByErrorType = (errorType) => {
  const errorTypeMap = {
    'PARAM_ERROR': ResponseCodes.BAD_REQUEST,
    'INVALID_TOKEN': ResponseCodes.UNAUTHORIZED,
    'TOKEN_EXPIRED': ResponseCodes.UNAUTHORIZED,
    'NO_PERMISSION': ResponseCodes.FORBIDDEN,
    'NOT_FOUND': ResponseCodes.NOT_FOUND,
    'RATE_LIMIT_EXCEEDED': ResponseCodes.TOO_MANY_REQUESTS,
    'SERVER_ERROR': ResponseCodes.INTERNAL_ERROR,
    
    // 用户相关错误
    'USER_NOT_EXIST': ResponseCodes.NOT_FOUND,
    'PASSWORD_ERROR': ResponseCodes.BAD_REQUEST,
    'USER_DISABLED': ResponseCodes.FORBIDDEN,
    'USERNAME_EXISTS': ResponseCodes.CONFLICT,
    'PHONE_EXISTS': ResponseCodes.CONFLICT,
    'EMAIL_EXISTS': ResponseCodes.CONFLICT,
    
    // 文件上传错误
    'UPLOAD_FAILED': ResponseCodes.UPLOAD_FAILED,
    'FILE_TYPE_NOT_ALLOWED': ResponseCodes.FILE_TYPE_ERROR,
    'FILE_SIZE_EXCEEDED': ResponseCodes.FILE_SIZE_ERROR
  };
  
  return errorTypeMap[errorType] || ResponseCodes.INTERNAL_ERROR;
};

module.exports = {
  ResponseCodes,
  getStatusCodeByErrorType
};
