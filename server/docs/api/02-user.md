# 用户模块 API

## 概述

用户模块提供用户信息获取、更新、密码修改等功能。

**Base URL**: `/api/users`

---

## API 列表

### 1. 获取当前用户信息

🔐 **需要登录**

```http
GET /api/users/me
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "zhangsan",
    "nickname": "张三",
    "avatar": "/uploads/avatars/xxx.png",
    "backgroundImage": "/uploads/backgrounds/xxx.png",
    "bio": "这是我的个人简介",
    "gender": "male",
    "phone": "138****8000",
    "email": "zhang***@example.com",
    "school": "北京大学",
    "department": "计算机学院",
    "role": "student",
    "tags": ["技术", "音乐"],
    "settings": {
      "privacy": {
        "anonymousMode": false,
        "allowSearch": true,
        "showLocation": true,
        "allowFollow": true,
        "allowComment": true,
        "allowMessage": true,
        "favoriteVisible": true,
        "followListVisible": true,
        "fansListVisible": true
      }
    },
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 101 | 无效的 token |
| 102 | token 已过期 |

---

### 2. 更新用户信息

🔐 **需要登录**

```http
PUT /api/users/me
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 否 | 用户名 (3-50字符) |
| phone | string | 否 | 手机号 |
| email | string | 否 | 邮箱 |
| avatar | string | 否 | 头像 URL |
| backgroundImage | string | 否 | 背景图 URL |
| school | string | 否 | 学校 |
| department | string | 否 | 院系 |
| gender | string | 否 | 性别 (male/female/other) |
| bio | string | 否 | 个人简介 (最多500字符) |
| tags | array | 否 | 标签数组 (最多8个，每个最多20字符) |

#### 请求示例

```json
{
  "nickname": "张三丰",
  "bio": "更新后的个人简介",
  "tags": ["技术", "音乐", "摄影"]
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "更新成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nickname": "张三丰",
    "bio": "更新后的个人简介"
  }
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 100 | 参数错误 |
| 203 | 用户名已存在 |
| 204 | 手机号已存在 |
| 205 | 邮箱已存在 |

---

### 3. 修改密码

🔐 **需要登录**

```http
POST /api/users/change-password
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldPassword | string | 是 | 旧密码 |
| newPassword | string | 是 | 新密码 (6-30字符) |

#### 请求示例

```json
{
  "oldPassword": "123456",
  "newPassword": "654321"
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "密码修改成功",
  "data": null
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 100 | 参数错误 |
| 201 | 旧密码错误 |

---

### 4. 搜索用户

🔐 **需要登录**

```http
GET /api/users/search
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| page | number | 否 | 页码 (默认 1) |
| limit | number | 否 | 每页数量 (默认 10) |

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
        "username": "zhangsan",
        "nickname": "张三",
        "avatar": "/uploads/avatars/xxx.png"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1
    }
  }
}
```

---

### 5. 获取用户发布统计

🔐 **需要登录**

```http
GET /api/users/publish-stats
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "todayPostCount": 3,
    "todayCommentCount": 10,
    "postLimit": 10,
    "commentLimit": 50
  }
}
```

---

### 6. 获取用户主页

🔓 **可选认证**

```http
GET /api/users/profile/:id
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 用户 ID (UUID) |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nickname": "张三",
    "avatar": "/uploads/avatars/xxx.png",
    "backgroundImage": "/uploads/backgrounds/xxx.png",
    "bio": "个人简介",
    "gender": "male",
    "school": "北京大学",
    "department": "计算机学院",
    "tags": ["技术", "音乐"],
    "postCount": 50,
    "followerCount": 100,
    "followingCount": 80,
    "isFollowed": false,
    "isFollowingMe": false,
    "isMutual": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 用户不存在 |

---

### 7. 获取用户主页帖子

🔓 **可选认证**

```http
GET /api/users/profile/:id/posts
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 用户 ID (UUID) |

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 (默认 1) |
| limit | number | 否 | 每页数量 (默认 10) |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "list": [
      {
        "id": "post-uuid",
        "title": "帖子标题",
        "content": "帖子内容",
        "images": [],
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

### 8. 获取指定用户信息

🔐 **需要登录**

```http
GET /api/users/:id
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 用户 ID (UUID) |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "zhangsan",
    "nickname": "张三",
    "avatar": "/uploads/avatars/xxx.png",
    "bio": "个人简介",
    "role": "student"
  }
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 用户不存在 |

---

## 管理员接口

### 9. 获取用户列表

👑 **需要管理员权限**

```http
GET /api/users
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |
| query | string | 否 | 搜索关键词 |
| role | string | 否 | 角色筛选 |
| status | string | 否 | 状态筛选 |

---

### 10. 禁用用户

👑 **需要管理员权限**

```http
PUT /api/users/disable/:id
```

---

### 11. 启用用户

👑 **需要管理员权限**

```http
PUT /api/users/enable/:id
```

---

### 12. 删除用户

👑 **需要管理员权限**

```http
DELETE /api/users/:id
```

---

### 13. 重置用户密码

👑 **需要管理员权限**

```http
POST /api/users/reset-password/:id
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| newPassword | string | 是 | 新密码 (6-30字符) |
