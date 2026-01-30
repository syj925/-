# 校园墙 API 文档

## 概述

校园墙是一个校园社交平台，提供帖子发布、评论互动、话题讨论、用户关注等功能。

### 基础信息

| 项目 | 说明 |
|------|------|
| Base URL | `http://localhost:3000` |
| API 前缀 | `/api` (用户端) / `/api/admin` (管理端) |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |

---

## 认证方式

### Bearer Token 认证

大部分 API 需要在请求头中携带 JWT Token：

```http
Authorization: Bearer <token>
```

### 认证级别

| 级别 | 说明 | 标识 |
|------|------|------|
| 公开 | 无需登录即可访问 | 🌐 |
| 可选认证 | 登录用户可获取更多信息 | 🔓 |
| 需要登录 | 必须携带有效 Token | 🔐 |
| 管理员 | 需要管理员权限 | 👑 |

---

## 响应格式

### 成功响应

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "message": "成功",
  "data": {
    // 响应数据
  }
}
```

### 错误响应

```json
{
  "success": false,
  "code": 200,
  "msg": "用户不存在",
  "data": null
}
```

### 分页响应

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "list": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100
    }
  }
}
```

### 前端成功判断

```javascript
if (res.code === 0 || res.success === true) {
  // 请求成功
}
const message = res.msg || res.message;
```

---

## 分页参数

所有支持分页的接口使用以下参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码，从 1 开始 |
| `limit` | number | 10 | 每页数量 |

---

## 错误码定义

### 通用错误 (1xx)

| 错误码 | 常量名 | 说明 |
|--------|--------|------|
| 100 | PARAM_ERROR | 参数错误 |
| 101 | INVALID_TOKEN | 无效的 token |
| 102 | TOKEN_EXPIRED | token 已过期 |
| 103 | NO_PERMISSION | 无权限操作 |
| 104 | NOT_FOUND | 资源不存在 |
| 105 | METHOD_NOT_ALLOWED | 方法不允许 |
| 106 | SERVER_ERROR | 服务器内部错误 |
| 107 | SERVICE_BUSY | 服务繁忙，请稍后再试 |
| 108 | RATE_LIMIT_EXCEEDED | 请求过于频繁，请稍后再试 |
| 109 | INVALID_OPERATION | 无效的操作 |
| 110 | RESOURCE_NOT_FOUND | 资源不存在 |
| 111 | DATABASE_ERROR | 数据库操作失败 |
| 112 | DUPLICATE_RESOURCE | 资源已存在 |
| 113 | INVALID_INPUT | 输入数据无效 |
| 114 | DATA_FORMAT_ERROR | 数据格式错误 |

### 用户相关错误 (2xx)

| 错误码 | 常量名 | 说明 |
|--------|--------|------|
| 200 | USER_NOT_EXIST | 用户不存在 |
| 201 | PASSWORD_ERROR | 密码错误 |
| 202 | USER_DISABLED | 账号已被禁用 |
| 203 | USERNAME_EXISTS | 用户名已存在 |
| 204 | PHONE_EXISTS | 手机号已存在 |
| 205 | EMAIL_EXISTS | 邮箱已存在 |
| 206 | VERIFY_CODE_ERROR | 验证码错误 |
| 207 | VERIFY_CODE_EXPIRED | 验证码已过期 |
| 208 | LOGIN_REQUIRED | 请先登录 |
| 209 | USER_PENDING_AUDIT | 账号正在审核中 |
| 210 | USER_BANNED | 账号已被封禁 |

### 帖子相关错误 (3xx)

| 错误码 | 常量名 | 说明 |
|--------|--------|------|
| 300 | POST_NOT_EXIST | 帖子不存在 |
| 301 | POST_DELETED | 帖子已被删除 |
| 302 | POST_CONTENT_EMPTY | 帖子内容不能为空 |
| 303 | POST_CATEGORY_REQUIRED | 请选择帖子分类 |
| 304 | POST_STATUS_ERROR | 帖子状态异常 |

### 评论相关错误 (4xx)

| 错误码 | 常量名 | 说明 |
|--------|--------|------|
| 400 | COMMENT_NOT_EXIST | 评论不存在 |
| 401 | COMMENT_DELETED | 评论已被删除 |
| 402 | COMMENT_CONTENT_EMPTY | 评论内容不能为空 |
| 403 | COMMENT_NOT_MATCH | 评论不匹配 |

### 文件上传相关错误 (5xx)

| 错误码 | 常量名 | 说明 |
|--------|--------|------|
| 500 | UPLOAD_FAILED | 上传失败 |
| 501 | FILE_TYPE_NOT_ALLOWED | 不支持的文件类型 |
| 502 | FILE_SIZE_EXCEEDED | 文件大小超出限制 |

### 交互相关错误 (6xx)

| 错误码 | 常量名 | 说明 |
|--------|--------|------|
| 600 | ALREADY_LIKED | 已点赞 |
| 601 | NOT_LIKED | 未点赞 |
| 602 | ALREADY_FAVORITED | 已收藏 |
| 603 | NOT_FAVORITED | 未收藏 |
| 604 | CATEGORY_NOT_EXIST | 分类不存在 |
| 605 | TOPIC_NOT_EXIST | 话题不存在 |
| 606 | TOPIC_EXISTS | 话题已存在 |
| 607 | TOPIC_HAS_POSTS | 话题下有帖子，无法删除 |
| 608 | INVALID_TARGET_TYPE | 不支持的目标类型 |
| 609 | ALREADY_FOLLOWED | 已关注该用户 |
| 610 | NOT_FOLLOWED | 未关注该用户 |
| 611 | TOPIC_NOT_FOUND | 话题不存在 |

### 消息相关错误 (7xx)

| 错误码 | 常量名 | 说明 |
|--------|--------|------|
| 700 | MESSAGE_NOT_EXIST | 消息不存在 |
| 701 | MESSAGE_READ_ERROR | 标记消息已读失败 |
| 702 | MESSAGE_DELETE_ERROR | 删除消息失败 |
| 703 | PRIVATE_MESSAGE_DISABLED | 私信功能已关闭 |
| 704 | RECEIVER_DISABLED_PRIVATE_MESSAGE | 对方已关闭私信功能 |

### 活动相关错误 (8xx)

| 错误码 | 常量名 | 说明 |
|--------|--------|------|
| 800 | EVENT_NOT_FOUND | 活动不存在 |
| 801 | EVENT_NOT_OPEN | 活动不在报名期间 |
| 802 | EVENT_FULL | 活动报名人数已满 |
| 803 | EVENT_ENDED | 活动已结束 |
| 804 | EVENT_NOT_STARTED | 活动尚未开始 |
| 805 | EVENT_HAS_REGISTRATIONS | 活动已有报名记录，无法删除 |
| 806 | REGISTRATION_CLOSED | 报名已截止 |
| 807 | ALREADY_REGISTERED | 已报名此活动 |
| 808 | REGISTRATION_NOT_FOUND | 报名记录不存在 |
| 809 | CANCEL_NOT_ALLOWED | 不允许取消报名 |
| 810 | INVALID_TIME | 时间设置无效 |
| 811 | INVALID_STATUS | 状态无效 |
| 812 | INVALID_PARAMS | 参数无效 |
| 813 | NOT_REGISTERED | 未报名此活动 |

### 其他错误

| 错误码 | 常量名 | 说明 |
|--------|--------|------|
| 999 | UNKNOWN_ERROR | 未知错误 |

---

## HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 (Token 无效或过期) |
| 403 | 禁止访问 (无权限) |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## API 模块索引

### 用户端 API

| 模块 | 文档 | 说明 |
|------|------|------|
| 认证 | [01-auth.md](./01-auth.md) | 登录、注册、验证码 |
| 用户 | [02-user.md](./02-user.md) | 用户信息、个人主页 |
| 帖子 | [03-post.md](./03-post.md) | 帖子发布、列表、详情 |
| 评论 | [04-comment.md](./04-comment.md) | 评论、回复 |
| 交互 | [05-interaction.md](./05-interaction.md) | 点赞、收藏、关注 |
| 消息 | [06-message.md](./06-message.md) | 通知、私信 |
| 话题 | [07-topic.md](./07-topic.md) | 话题列表、详情 |
| 分类 | [08-category.md](./08-category.md) | 内容分类 |
| 搜索 | [09-search.md](./09-search.md) | 全局搜索、历史记录 |
| 上传 | [10-upload.md](./10-upload.md) | 文件上传 |
| 活动 | [11-event.md](./11-event.md) | 活动、报名 |
| 徽章 | [12-badge.md](./12-badge.md) | 用户徽章 |
| 轮播图 | [13-banner.md](./13-banner.md) | 首页轮播 |
| 标签 | [14-tag.md](./14-tag.md) | 用户标签 |
| 表情 | [15-emoji.md](./15-emoji.md) | 表情包 |
| 设置 | [16-settings.md](./16-settings.md) | 用户设置 |

### 管理端 API

| 模块 | 文档 | 说明 |
|------|------|------|
| 认证 | [20-admin-auth.md](./20-admin-auth.md) | 管理员登录 |
| 用户管理 | [21-admin-user.md](./21-admin-user.md) | 用户审核、管理 |
| 内容管理 | [22-admin-content.md](./22-admin-content.md) | 帖子、评论、话题管理 |
| 系统管理 | [23-admin-system.md](./23-admin-system.md) | 设置、仪表盘、推荐算法 |

---

## 通用数据模型

### 用户对象 (User)

```json
{
  "id": "uuid",
  "username": "用户名",
  "nickname": "昵称",
  "avatar": "/uploads/avatars/xxx.png",
  "bio": "个人简介",
  "gender": "male|female|other",
  "school": "学校",
  "department": "院系",
  "role": "student|teacher|admin",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### 帖子对象 (Post)

```json
{
  "id": "uuid",
  "title": "标题",
  "content": "内容",
  "images": [
    {
      "url": "/uploads/images/xxx.png",
      "thumbnail_url": "/uploads/images/xxx_thumb.png",
      "width": 800,
      "height": 600
    }
  ],
  "category_id": 1,
  "category": {
    "id": 1,
    "name": "分类名"
  },
  "topics": ["话题1", "话题2"],
  "user": {
    "id": "uuid",
    "nickname": "昵称",
    "avatar": "/uploads/avatars/xxx.png"
  },
  "like_count": 10,
  "comment_count": 5,
  "favorite_count": 3,
  "view_count": 100,
  "is_liked": false,
  "is_favorited": false,
  "is_anonymous": false,
  "status": "published|pending|rejected|deleted",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### 评论对象 (Comment)

```json
{
  "id": "uuid",
  "content": "评论内容",
  "post_id": "uuid",
  "user": {
    "id": "uuid",
    "nickname": "昵称",
    "avatar": "/uploads/avatars/xxx.png"
  },
  "reply_to": "uuid|null",
  "reply_user": {
    "id": "uuid",
    "nickname": "昵称"
  },
  "like_count": 5,
  "reply_count": 2,
  "is_liked": false,
  "is_anonymous": false,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

## 更新日志

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2024-01-30 | 初始版本 |
