# 评论模块 API

## 概述

评论模块提供帖子评论的创建、获取、回复、删除等功能。

**Base URL**: `/api/comments`

---

## API 列表

### 1. 创建评论

🔐 **需要登录**

```http
POST /api/comments
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| post_id | string | 是 | 帖子 ID (UUID) |
| content | string | 是 | 评论内容 |
| reply_to | string | 否 | 回复的评论 ID |
| emoji_image | object | 否 | 图片表情 (与 images 互斥) |
| images | array | 否 | 普通图片列表 |
| is_anonymous | boolean | 否 | 是否匿名 |
| mentioned_users | array | 否 | @的用户 ID 列表 |

#### emoji_image 对象结构

```json
{
  "id": "emoji-uuid",
  "url": "/uploads/emojis/xxx.gif",
  "name": "表情名称"
}
```

#### 请求示例

```json
{
  "post_id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "说得太对了！",
  "is_anonymous": false
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "评论成功",
  "data": {
    "id": "comment-uuid",
    "content": "说得太对了！",
    "post_id": "550e8400-e29b-41d4-a716-446655440000",
    "user": {
      "id": "user-uuid",
      "nickname": "张三",
      "avatar": "/uploads/avatars/xxx.png"
    },
    "like_count": 0,
    "reply_count": 0,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 100 | 参数错误 |
| 300 | 帖子不存在 |
| 400 | 评论不存在 (回复时) |
| 402 | 评论内容不能为空 |
| 108 | 评论过于频繁 |

---

### 2. 获取评论详情

🔓 **可选认证**

```http
GET /api/comments/:id
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 评论 ID (UUID) |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "id": "comment-uuid",
    "content": "评论内容",
    "post_id": "post-uuid",
    "user": {
      "id": "user-uuid",
      "nickname": "张三",
      "avatar": "/uploads/avatars/xxx.png"
    },
    "reply_to": null,
    "reply_user": null,
    "like_count": 10,
    "reply_count": 5,
    "is_liked": false,
    "is_anonymous": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 评论不存在 |

---

### 3. 获取评论回复列表

🔓 **可选认证**

```http
GET /api/comments/:id/replies
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 评论 ID |

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "list": [
      {
        "id": "reply-uuid",
        "content": "回复内容",
        "user": {
          "id": "user-uuid",
          "nickname": "李四",
          "avatar": "/uploads/avatars/xxx.png"
        },
        "reply_user": {
          "id": "original-user-uuid",
          "nickname": "张三"
        },
        "like_count": 3,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 5
    }
  }
}
```

---

### 4. 获取评论回复树

🔓 **可选认证**

```http
GET /api/comments/:id/replies-tree
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 评论 ID |

#### 说明

返回多级嵌套的评论回复树结构。

---

### 5. 获取评论直接回复

🔓 **可选认证**

```http
GET /api/comments/:id/direct-replies
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 评论 ID |

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

---

### 6. 更新评论

🔐 **需要登录**

```http
PUT /api/comments/:id
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 评论 ID |

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 新的评论内容 |

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 评论不存在 |
| 103 | 无权限操作 (非本人评论) |

---

### 7. 删除评论

🔐 **需要登录**

```http
DELETE /api/comments/:id
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 评论 ID |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "删除成功",
  "data": null
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 评论不存在 |
| 103 | 无权限操作 |

---

### 8. 获取帖子评论

🔓 **可选认证**

```http
GET /api/comments/post/:postId
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| postId | string | 帖子 ID |

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |
| order | string | 否 | 排序 (latest/hot) |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "list": [
      {
        "id": "comment-uuid",
        "content": "这是一条评论",
        "user": {
          "id": "user-uuid",
          "nickname": "张三",
          "avatar": "/uploads/avatars/xxx.png"
        },
        "like_count": 10,
        "reply_count": 5,
        "is_liked": false,
        "replies": [
          {
            "id": "reply-uuid",
            "content": "这是回复",
            "user": {
              "id": "user-uuid",
              "nickname": "李四",
              "avatar": "/uploads/avatars/xxx.png"
            }
          }
        ],
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 50
    }
  }
}
```

---

### 9. 获取我的评论

🔐 **需要登录**

```http
GET /api/comments/user/me
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

---

### 10. 获取评论审核历史

🔐 **需要登录**

```http
GET /api/comments/user/audit-history
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

---

## 频率限制

| 接口 | 限制 |
|------|------|
| 创建评论 | 每日最多 50 条 |
| 每分钟 | 最多 10 条 |
