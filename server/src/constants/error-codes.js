/**
 * 统一错误码定义
 */
module.exports = {
  // 成功
  SUCCESS: { code: 0, message: 'success' },
  
  // 通用错误 (1xx)
  PARAM_ERROR: { code: 100, message: '参数错误' },
  INVALID_TOKEN: { code: 101, message: '无效的token' },
  TOKEN_EXPIRED: { code: 102, message: 'token已过期' },
  NO_PERMISSION: { code: 103, message: '无权限操作' },
  NOT_FOUND: { code: 104, message: '资源不存在' },
  METHOD_NOT_ALLOWED: { code: 105, message: '方法不允许' },
  SERVER_ERROR: { code: 106, message: '服务器内部错误' },
  SERVICE_BUSY: { code: 107, message: '服务繁忙，请稍后再试' },
  RATE_LIMIT_EXCEEDED: { code: 108, message: '请求过于频繁，请稍后再试' },
  INVALID_OPERATION: { code: 109, message: '无效的操作' },

  // 用户相关错误 (2xx)
  USER_NOT_EXIST: { code: 200, message: '用户不存在' },
  PASSWORD_ERROR: { code: 201, message: '密码错误' },
  USER_DISABLED: { code: 202, message: '账号已被禁用' },
  USERNAME_EXISTS: { code: 203, message: '用户名已存在' },
  PHONE_EXISTS: { code: 204, message: '手机号已存在' },
  EMAIL_EXISTS: { code: 205, message: '邮箱已存在' },
  VERIFY_CODE_ERROR: { code: 206, message: '验证码错误' },
  VERIFY_CODE_EXPIRED: { code: 207, message: '验证码已过期' },
  LOGIN_REQUIRED: { code: 208, message: '请先登录' },
  USER_PENDING_AUDIT: { code: 209, message: '账号正在审核中' },
  USER_BANNED: { code: 210, message: '账号已被封禁' },
  
  // 帖子相关错误 (3xx)
  POST_NOT_EXIST: { code: 300, message: '帖子不存在' },
  POST_DELETED: { code: 301, message: '帖子已被删除' },
  POST_CONTENT_EMPTY: { code: 302, message: '帖子内容不能为空' },
  POST_CATEGORY_REQUIRED: { code: 303, message: '请选择帖子分类' },
  POST_STATUS_ERROR: { code: 304, message: '帖子状态异常' },
  
  // 评论相关错误 (4xx)
  COMMENT_NOT_EXIST: { code: 400, message: '评论不存在' },
  COMMENT_DELETED: { code: 401, message: '评论已被删除' },
  COMMENT_CONTENT_EMPTY: { code: 402, message: '评论内容不能为空' },
  COMMENT_NOT_MATCH: { code: 403, message: '评论不匹配' },
  
  // 文件上传相关错误 (5xx)
  UPLOAD_FAILED: { code: 500, message: '上传失败' },
  FILE_TYPE_NOT_ALLOWED: { code: 501, message: '不支持的文件类型' },
  FILE_SIZE_EXCEEDED: { code: 502, message: '文件大小超出限制' },
  
  // 交互相关错误 (6xx)
  ALREADY_LIKED: { code: 600, message: '已点赞' },
  NOT_LIKED: { code: 601, message: '未点赞' },
  ALREADY_FAVORITED: { code: 602, message: '已收藏' },
  NOT_FAVORITED: { code: 603, message: '未收藏' },
  CATEGORY_NOT_EXIST: { code: 604, message: '分类不存在' },
  TOPIC_NOT_EXIST: { code: 605, message: '话题不存在' },
  TOPIC_EXISTS: { code: 606, message: '话题已存在' },
  TOPIC_HAS_POSTS: { code: 607, message: '话题下有帖子，无法删除' },
  INVALID_TARGET_TYPE: { code: 608, message: '不支持的目标类型' },
  ALREADY_FOLLOWED: { code: 609, message: '已关注该用户' },
  NOT_FOLLOWED: { code: 610, message: '未关注该用户' },
  
  // 消息相关错误 (7xx)
  MESSAGE_NOT_EXIST: { code: 700, message: '消息不存在' },
  MESSAGE_READ_ERROR: { code: 701, message: '标记消息已读失败' },
  MESSAGE_DELETE_ERROR: { code: 702, message: '删除消息失败' },
  PRIVATE_MESSAGE_DISABLED: { code: 703, message: '私信功能已关闭' },
  RECEIVER_DISABLED_PRIVATE_MESSAGE: { code: 704, message: '对方已关闭私信功能' },

  // 活动相关错误 (8xx)
  EVENT_NOT_FOUND: { code: 800, message: '活动不存在' },
  EVENT_NOT_OPEN: { code: 801, message: '活动不在报名期间' },
  EVENT_FULL: { code: 802, message: '活动报名人数已满' },
  EVENT_ENDED: { code: 803, message: '活动已结束' },
  EVENT_NOT_STARTED: { code: 804, message: '活动尚未开始' },
  EVENT_HAS_REGISTRATIONS: { code: 805, message: '活动已有报名记录，无法删除' },
  REGISTRATION_CLOSED: { code: 806, message: '报名已截止' },
  ALREADY_REGISTERED: { code: 807, message: '已报名此活动' },
  REGISTRATION_NOT_FOUND: { code: 808, message: '报名记录不存在' },
  CANCEL_NOT_ALLOWED: { code: 809, message: '不允许取消报名' },
  INVALID_TIME: { code: 810, message: '时间设置无效' },
  INVALID_STATUS: { code: 811, message: '状态无效' },
  INVALID_PARAMS: { code: 812, message: '参数无效' },

  // 其他错误
  UNKNOWN_ERROR: { code: 999, message: '未知错误' }
}; 