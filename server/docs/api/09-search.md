# 搜索模块 API

## 概述

搜索模块提供全局搜索、分类搜索、搜索历史管理等功能。

**Base URL**: `/api/search`

---

## API 列表

### 1. 全局搜索

🔓 **可选认证**

```http
GET /api/search
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "posts": {
      "list": [...],
      "total": 50
    },
    "users": {
      "list": [...],
      "total": 10
    },
    "topics": {
      "list": [...],
      "total": 5
    }
  }
}
```

---

### 2. 搜索帖子

🔓 **可选认证**

```http
GET /api/search/posts
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| category_id | number | 否 | 分类筛选 |
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
        "id": "post-uuid",
        "title": "帖子标题",
        "content": "帖子内容...",
        "user": {
          "id": "user-uuid",
          "nickname": "张三"
        },
        "like_count": 10,
        "comment_count": 5,
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

### 3. 搜索用户

🔓 **可选认证**

```http
GET /api/search/users
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
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
        "id": "user-uuid",
        "username": "zhangsan",
        "nickname": "张三",
        "avatar": "/uploads/avatars/xxx.png",
        "bio": "个人简介",
        "follower_count": 100
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 10
    }
  }
}
```

---

### 4. 搜索话题

🔓 **可选认证**

```http
GET /api/search/topics
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

---

### 5. 获取搜索建议

🌐 **公开接口**

```http
GET /api/search/suggestions
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 输入关键词 |
| limit | number | 否 | 建议数量 (默认 10) |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": [
    "校园生活",
    "校园美食",
    "校园活动"
  ]
}
```

---

### 6. 获取热门搜索

🌐 **公开接口**

```http
GET /api/search/hot
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": [
    {
      "keyword": "期末考试",
      "count": 1000
    },
    {
      "keyword": "选课",
      "count": 800
    }
  ]
}
```

---

### 7. 保存搜索历史

🔐 **需要登录**

```http
POST /api/search/history
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词 (1-100字符) |
| type | string | 否 | 搜索类型 (all/posts/users/topics) |

---

### 8. 获取搜索历史

🔐 **需要登录**

```http
GET /api/search/history
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | number | 否 | 数量限制 |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": [
    {
      "keyword": "校园活动",
      "type": "all",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 9. 删除单条搜索历史

🔐 **需要登录**

```http
DELETE /api/search/history/item
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 要删除的关键词 |

---

### 10. 清空搜索历史

🔐 **需要登录**

```http
DELETE /api/search/history
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "搜索历史已清空",
  "data": null
}
```
