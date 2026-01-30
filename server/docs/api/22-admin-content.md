# 管理员内容管理 API

> 👑 本模块所有接口均需要管理员权限

## 概述

内容管理模块提供帖子、评论、话题的审核和管理功能。

**Base URL**: `/api/admin`

---

## 帖子管理

### 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| [获取帖子列表](#获取帖子列表) | GET | `/posts` | 分页获取帖子列表 |
| [获取待审核帖子](#获取待审核帖子) | GET | `/posts/pending` | 获取待审核帖子列表 |
| [获取帖子详情](#获取帖子详情) | GET | `/posts/:id` | 获取帖子详情 |
| [更新帖子](#更新帖子) | PUT | `/posts/:id` | 更新帖子内容 |
| [删除帖子](#删除帖子) | DELETE | `/posts/:id` | 删除帖子 |
| [审核帖子](#审核帖子) | PUT | `/posts/:id/audit` | 审核帖子 |
| [设置推荐状态](#设置推荐状态) | PUT | `/posts/:id/recommend` | 设置/取消推荐 |
| [设置置顶状态](#设置置顶状态) | PUT | `/posts/:id/top` | 设置/取消置顶 |

---

### 获取帖子列表

👑 需要管理员权限

分页获取帖子列表，支持多条件筛选。

#### 请求

```http
GET /api/admin/posts
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 10 |
| search | string | 否 | 搜索关键词 |
| status | string | 否 | 状态筛选 (published/pending/rejected/deleted) |
| userId | string | 否 | 用户 ID 筛选 |
| categoryId | string | 否 | 分类 ID 筛选 |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "list": [
      {
        "id": "uuid",
        "title": "帖子标题",
        "content": "帖子内容摘要...",
        "images": [{"url": "/uploads/images/xxx.png"}],
        "category": {"id": 1, "name": "校园生活"},
        "topics": ["校园", "分享"],
        "user": {
          "id": "uuid",
          "nickname": "张三",
          "avatar": "/uploads/avatars/xxx.png"
        },
        "status": "published",
        "is_anonymous": false,
        "is_recommended": false,
        "is_top": false,
        "like_count": 10,
        "comment_count": 5,
        "view_count": 100,
        "created_at": "2024-01-30T10:00:00.000Z"
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

### 获取待审核帖子

👑 需要管理员权限

获取等待审核的帖子列表。

#### 请求

```http
GET /api/admin/posts/pending
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 10 |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "list": [...],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 5
    }
  }
}
```

---

### 获取帖子详情

👑 需要管理员权限

获取帖子的完整详情。

#### 请求

```http
GET /api/admin/posts/:id
Authorization: Bearer <token>
```

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 帖子 ID (UUID) |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "id": "uuid",
    "title": "帖子标题",
    "content": "完整帖子内容",
    "images": [
      {
        "url": "/uploads/images/xxx.png",
        "thumbnail_url": "/uploads/images/xxx_thumb.png",
        "width": 800,
        "height": 600
      }
    ],
    "category": {"id": 1, "name": "校园生活"},
    "topics": ["话题1", "话题2"],
    "user": {
      "id": "uuid",
      "username": "zhangsan",
      "nickname": "张三",
      "avatar": "/uploads/avatars/xxx.png"
    },
    "status": "published",
    "reject_reason": null,
    "is_anonymous": false,
    "is_recommended": true,
    "is_top": false,
    "like_count": 10,
    "comment_count": 5,
    "favorite_count": 3,
    "view_count": 100,
    "share_count": 2,
    "created_at": "2024-01-30T10:00:00.000Z",
    "updated_at": "2024-01-30T12:00:00.000Z"
  }
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 300 | 帖子不存在 |

---

### 更新帖子

👑 需要管理员权限

更新帖子内容。

#### 请求

```http
PUT /api/admin/posts/:id
Authorization: Bearer <token>
Content-Type: application/json
```

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 帖子 ID (UUID) |

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 标题 |
| content | string | 否 | 内容 |
| category_id | number | 否 | 分类 ID |
| status | string | 否 | 状态 |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "更新成功",
  "data": {
    "id": "uuid",
    "title": "更新后的标题"
  }
}
```

---

### 删除帖子

👑 需要管理员权限

删除帖子。

#### 请求

```http
DELETE /api/admin/posts/:id
Authorization: Bearer <token>
```

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 帖子 ID (UUID) |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "删除成功",
  "data": null
}
```

---

### 审核帖子

👑 需要管理员权限

审核帖子，通过或拒绝。

#### 请求

```http
PUT /api/admin/posts/:id/audit
Authorization: Bearer <token>
Content-Type: application/json
```

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 帖子 ID (UUID) |

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 操作类型 (approve/reject) |
| reason | string | 否 | 拒绝原因 |

#### 请求示例

```json
{
  "action": "reject",
  "reason": "内容违规"
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "审核完成",
  "data": {
    "id": "uuid",
    "status": "rejected"
  }
}
```

---

### 设置推荐状态

👑 需要管理员权限

设置或取消帖子推荐。

#### 请求

```http
PUT /api/admin/posts/:id/recommend
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| isRecommended | boolean | 是 | 是否推荐 |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "设置成功",
  "data": {
    "id": "uuid",
    "is_recommended": true
  }
}
```

---

### 设置置顶状态

👑 需要管理员权限

设置或取消帖子置顶。

#### 请求

```http
PUT /api/admin/posts/:id/top
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| isTop | boolean | 是 | 是否置顶 |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "设置成功",
  "data": {
    "id": "uuid",
    "is_top": true
  }
}
```

---

## 评论管理

### 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| [获取评论列表](#获取评论列表) | GET | `/comments` | 分页获取评论列表 |
| [获取待审核评论](#获取待审核评论) | GET | `/comments/pending` | 获取待审核评论列表 |
| [获取评论详情](#获取评论详情) | GET | `/comments/:id` | 获取评论详情 |
| [更新评论](#更新评论) | PUT | `/comments/:id` | 更新评论内容 |
| [删除评论](#删除评论) | DELETE | `/comments/:id` | 删除评论 |
| [审核评论](#审核评论) | PUT | `/comments/:id/audit` | 审核评论 |

---

### 获取评论列表

👑 需要管理员权限

分页获取评论列表。

#### 请求

```http
GET /api/admin/comments
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 10 |
| search | string | 否 | 搜索关键词 |
| status | string | 否 | 状态筛选 |
| postId | string | 否 | 帖子 ID 筛选 |
| userId | string | 否 | 用户 ID 筛选 |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "list": [
      {
        "id": "uuid",
        "content": "评论内容",
        "post": {
          "id": "uuid",
          "title": "帖子标题"
        },
        "user": {
          "id": "uuid",
          "nickname": "张三"
        },
        "status": "published",
        "like_count": 5,
        "created_at": "2024-01-30T10:00:00.000Z"
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

### 获取待审核评论

👑 需要管理员权限

获取等待审核的评论列表。

#### 请求

```http
GET /api/admin/comments/pending
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 10 |

---

### 获取评论详情

👑 需要管理员权限

#### 请求

```http
GET /api/admin/comments/:id
Authorization: Bearer <token>
```

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 评论 ID (UUID) |

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 评论不存在 |

---

### 更新评论

👑 需要管理员权限

#### 请求

```http
PUT /api/admin/comments/:id
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 否 | 评论内容 |
| status | string | 否 | 状态 |

---

### 删除评论

👑 需要管理员权限

#### 请求

```http
DELETE /api/admin/comments/:id
Authorization: Bearer <token>
```

---

### 审核评论

👑 需要管理员权限

#### 请求

```http
PUT /api/admin/comments/:id/audit
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 操作类型 (approve/reject) |
| reason | string | 否 | 拒绝原因 |

---

## 话题管理

### 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| [获取话题列表](#获取话题列表) | GET | `/topics` | 分页获取话题列表 |
| [创建话题](#创建话题) | POST | `/topics` | 创建新话题 |
| [更新话题](#更新话题) | PUT | `/topics/:id` | 更新话题 |
| [删除话题](#删除话题) | DELETE | `/topics/:id` | 删除话题 |
| [设置热门状态](#设置热门状态) | PATCH | `/topics/:id/hot` | 设置话题热门状态 |
| [获取待审核话题图片](#获取待审核话题图片) | GET | `/topics/pending-images` | 获取待审核图片 |
| [审核话题图片](#审核话题图片) | PUT | `/topics/:id/review-image` | 审核话题图片 |

---

### 获取话题列表

👑 需要管理员权限

#### 请求

```http
GET /api/admin/topics
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 10 |
| search | string | 否 | 搜索关键词 |
| status | string | 否 | 状态筛选 |
| orderBy | string | 否 | 排序字段 |
| orderDirection | string | 否 | 排序方向 (asc/desc) |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "list": [
      {
        "id": "uuid",
        "name": "校园生活",
        "description": "分享校园日常",
        "cover_image": "/uploads/topics/xxx.png",
        "post_count": 100,
        "follower_count": 500,
        "view_count": 10000,
        "is_hot": true,
        "status": "active",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 20
    }
  }
}
```

---

### 创建话题

👑 需要管理员权限

#### 请求

```http
POST /api/admin/topics
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 话题名称 |
| description | string | 否 | 话题描述 |
| cover_image | string | 否 | 封面图片 URL |
| status | string | 否 | 状态 (active/inactive) |

#### 请求示例

```json
{
  "name": "新话题",
  "description": "话题描述",
  "cover_image": "/uploads/topics/new.png",
  "status": "active"
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "创建成功",
  "data": {
    "id": "uuid",
    "name": "新话题"
  }
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 606 | 话题已存在 |

---

### 更新话题

👑 需要管理员权限

#### 请求

```http
PUT /api/admin/topics/:id
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 话题名称 |
| description | string | 否 | 话题描述 |
| cover_image | string | 否 | 封面图片 |
| status | string | 否 | 状态 |

---

### 删除话题

👑 需要管理员权限

#### 请求

```http
DELETE /api/admin/topics/:id
Authorization: Bearer <token>
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 605 | 话题不存在 |
| 607 | 话题下有帖子，无法删除 |

---

### 设置热门状态

👑 需要管理员权限

#### 请求

```http
PATCH /api/admin/topics/:id/hot
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| is_hot | boolean | 是 | 是否热门 |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "设置成功",
  "data": {
    "id": "uuid",
    "is_hot": true
  }
}
```

---

### 获取待审核话题图片

👑 需要管理员权限

#### 请求

```http
GET /api/admin/topics/pending-images
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 10 |

---

### 审核话题图片

👑 需要管理员权限

#### 请求

```http
PUT /api/admin/topics/:id/review-image
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 审核动作 (approve/reject) |

---

## 分类管理

### 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取分类列表 | GET | `/categories` | 获取分类列表 |
| 创建分类 | POST | `/categories` | 创建新分类 |
| 获取分类详情 | GET | `/categories/:id` | 获取分类详情 |
| 更新分类 | PUT | `/categories/:id` | 更新分类 |
| 删除分类 | DELETE | `/categories/:id` | 删除分类 |
| 批量更新排序 | PUT | `/categories/batch/sort` | 批量更新分类排序 |
| 启用分类 | PUT | `/categories/:id/enable` | 启用分类 |
| 禁用分类 | PUT | `/categories/:id/disable` | 禁用分类 |

---

## 数据模型

### 帖子状态

| 状态 | 说明 |
|------|------|
| pending | 待审核 |
| published | 已发布 |
| rejected | 已拒绝 |
| deleted | 已删除 |

### 评论状态

| 状态 | 说明 |
|------|------|
| pending | 待审核 |
| published | 已发布 |
| rejected | 已拒绝 |
| deleted | 已删除 |

### 话题状态

| 状态 | 说明 |
|------|------|
| active | 启用 |
| inactive | 禁用 |
