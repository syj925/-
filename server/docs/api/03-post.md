# 帖子模块 API

## 概述

帖子模块提供帖子的发布、获取、更新、删除等功能。

**Base URL**: `/api/posts`

---

## API 列表

### 1. 获取帖子列表

🔓 **可选认证**

```http
GET /api/posts
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 (默认 1) |
| limit | number | 否 | 每页数量 (默认 10) |
| category_id | number | 否 | 分类 ID |
| topic_id | string | 否 | 话题 ID |
| user_id | string | 否 | 用户 ID |
| status | string | 否 | 状态筛选 |
| order | string | 否 | 排序方式 (latest/hot) |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "list": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "帖子标题",
        "content": "帖子内容...",
        "images": [
          {
            "url": "/uploads/images/xxx.png",
            "thumbnail_url": "/uploads/images/xxx_thumb.png",
            "width": 800,
            "height": 600
          }
        ],
        "category": {
          "id": 1,
          "name": "校园生活"
        },
        "topics": ["话题1", "话题2"],
        "user": {
          "id": "user-uuid",
          "nickname": "张三",
          "avatar": "/uploads/avatars/xxx.png"
        },
        "like_count": 100,
        "comment_count": 50,
        "favorite_count": 30,
        "view_count": 1000,
        "is_liked": false,
        "is_favorited": false,
        "is_anonymous": false,
        "is_top": false,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100
    }
  }
}
```

---

### 2. 获取热门帖子

🔓 **可选认证**

```http
GET /api/posts/hot
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

---

### 3. 获取推荐帖子

🔓 **可选认证**

```http
GET /api/posts/recommended
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

---

### 4. 获取帖子详情

🔓 **可选认证**

```http
GET /api/posts/:id
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 帖子 ID (UUID) |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "帖子标题",
    "content": "完整的帖子内容...",
    "images": [],
    "category": {
      "id": 1,
      "name": "校园生活"
    },
    "topics": [
      {
        "id": "topic-uuid",
        "name": "话题名称"
      }
    ],
    "user": {
      "id": "user-uuid",
      "nickname": "张三",
      "avatar": "/uploads/avatars/xxx.png",
      "bio": "个人简介"
    },
    "location": {
      "name": "北京大学",
      "longitude": 116.310905,
      "latitude": 39.992806
    },
    "like_count": 100,
    "comment_count": 50,
    "favorite_count": 30,
    "view_count": 1001,
    "is_liked": false,
    "is_favorited": false,
    "is_anonymous": false,
    "is_top": false,
    "status": "published",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 300 | 帖子不存在 |
| 301 | 帖子已被删除 |

---

### 5. 获取帖子评论

🔓 **可选认证**

```http
GET /api/posts/:id/comments
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 帖子 ID |

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |
| order | string | 否 | 排序 (latest/hot) |

---

### 6. 获取帖子评论统计

🔓 **可选认证**

```http
GET /api/posts/:id/comments/stats
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "totalCount": 50,
    "topLevelCount": 30,
    "replyCount": 20
  }
}
```

---

### 7. 创建帖子

🔐 **需要登录**

```http
POST /api/posts
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 标题 |
| content | string | 是 | 内容 |
| category_id | number | 否 | 分类 ID |
| topics | array | 否 | 话题名称数组 |
| images | array | 否 | 图片数组 |
| location | object | 否 | 位置信息 |
| is_anonymous | boolean | 否 | 是否匿名 |

#### images 对象结构

```json
{
  "url": "/uploads/images/xxx.png",
  "thumbnail_url": "/uploads/images/xxx_thumb.png",
  "width": 800,
  "height": 600,
  "size": 102400
}
```

#### location 对象结构

```json
{
  "name": "北京大学",
  "longitude": 116.310905,
  "latitude": 39.992806
}
```

#### 请求示例

```json
{
  "title": "今天天气真好",
  "content": "阳光明媚，适合出去走走~",
  "category_id": 1,
  "topics": ["日常", "心情"],
  "images": [
    {
      "url": "/uploads/images/xxx.png",
      "width": 800,
      "height": 600
    }
  ],
  "is_anonymous": false
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "发布成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "今天天气真好",
    "content": "阳光明媚，适合出去走走~",
    "status": "published",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 100 | 参数错误 |
| 302 | 帖子内容不能为空 |
| 108 | 发布过于频繁 |

---

### 8. 更新帖子

🔐 **需要登录**

```http
PUT /api/posts/:id
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 帖子 ID |

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 标题 |
| content | string | 否 | 内容 |
| category_id | number | 否 | 分类 ID |
| topics | array | 否 | 话题数组 |
| images | array | 否 | 图片数组 |
| location | object | 否 | 位置信息 |

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 300 | 帖子不存在 |
| 103 | 无权限操作 (非本人帖子) |

---

### 9. 删除帖子

🔐 **需要登录**

```http
DELETE /api/posts/:id
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 帖子 ID |

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 300 | 帖子不存在 |
| 103 | 无权限操作 |

---

### 10. 获取我的收藏帖子

🔐 **需要登录**

```http
GET /api/posts/user/favorites
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

---

### 11. 获取我的帖子

🔐 **需要登录**

```http
GET /api/posts/user/me
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |
| status | string | 否 | 状态筛选 |

---

### 12. 获取审核历史

🔐 **需要登录**

```http
GET /api/posts/user/audit-history
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

---

### 13. 设置置顶状态

👑 **需要管理员权限**

```http
PUT /api/posts/:id/top
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| isTop | boolean | 是 | 是否置顶 |

---

### 14. 上传帖子图片

🔐 **需要登录**

```http
POST /api/posts/upload
```

#### 请求参数

- Content-Type: `multipart/form-data`
- 字段名: `files`
- 最多 9 张图片

#### 响应示例

```json
{
  "code": 0,
  "data": [
    {
      "url": "/uploads/images/xxx.png",
      "thumbnail_url": "/uploads/images/xxx.png",
      "width": 800,
      "height": 600,
      "size": 102400
    }
  ]
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 500 | 上传失败 |
| 501 | 不支持的文件类型 |
| 502 | 文件大小超出限制 |

---

## 频率限制

| 接口 | 限制 |
|------|------|
| 创建帖子 | 每日最多 10 篇 |
| 上传图片 | 每分钟最多 30 次 |
