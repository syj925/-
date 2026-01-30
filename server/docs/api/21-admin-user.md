# 管理员用户管理 API

> 👑 本模块所有接口均需要管理员权限

## 概述

用户管理模块提供用户列表查询、用户审核、用户禁用/启用、用户删除等功能。

**Base URL**: `/api/admin`

---

## 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| [获取用户列表](#获取用户列表) | GET | `/users` | 分页获取用户列表 |
| [获取待审核用户](#获取待审核用户) | GET | `/users/pending` | 获取待审核用户列表 |
| [搜索用户](#搜索用户) | GET | `/users/search` | 搜索用户 |
| [获取用户详情](#获取用户详情) | GET | `/users/:id` | 获取用户详细信息 |
| [更新用户信息](#更新用户信息) | PUT | `/users/:id` | 更新用户信息 |
| [删除用户](#删除用户) | DELETE | `/users/:id` | 删除用户 |
| [审核用户](#审核用户) | PUT | `/users/:id/audit` | 审核用户注册 |
| [禁用用户](#禁用用户) | PUT | `/users/:id/disable` | 禁用用户账号 |
| [启用用户](#启用用户) | PUT | `/users/:id/enable` | 启用用户账号 |
| [获取用户徽章](#获取用户徽章) | GET | `/users/:userId/badges` | 获取用户徽章列表 |
| [获取拒绝记录](#获取拒绝记录) | GET | `/users/rejection-logs` | 获取用户注册拒绝记录 |

---

## 获取用户列表

👑 需要管理员权限

分页获取用户列表，支持多条件筛选。

### 请求

```http
GET /api/admin/users
Authorization: Bearer <token>
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 10 |
| query | string | 否 | 搜索关键词 (用户名/昵称/手机号/邮箱) |
| role | string | 否 | 角色筛选 (student/teacher/admin) |
| status | string | 否 | 状态筛选 (active/disabled/pending) |
| includeBadges | boolean | 否 | 是否包含用户徽章 |

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "list": [
      {
        "id": "uuid",
        "username": "zhangsan",
        "nickname": "张三",
        "avatar": "/uploads/avatars/xxx.png",
        "phone": "13800138001",
        "email": "zhangsan@example.com",
        "gender": "male",
        "school": "XX大学",
        "department": "计算机学院",
        "role": "student",
        "status": "active",
        "is_disabled": false,
        "post_count": 10,
        "follower_count": 50,
        "following_count": 30,
        "badges": [
          {
            "id": "uuid",
            "name": "活跃用户",
            "color": "#FF6B6B"
          }
        ],
        "created_at": "2024-01-01T00:00:00.000Z",
        "last_login_at": "2024-01-30T10:00:00.000Z"
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

## 获取待审核用户

👑 需要管理员权限

获取等待审核的用户注册申请列表。

### 请求

```http
GET /api/admin/users/pending
Authorization: Bearer <token>
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 10 |

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "list": [
      {
        "id": "uuid",
        "username": "lisi",
        "nickname": "李四",
        "phone": "13800138002",
        "school": "XX大学",
        "department": "软件学院",
        "created_at": "2024-01-30T08:00:00.000Z"
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

## 搜索用户

👑 需要管理员权限

搜索用户，用于发送系统消息等场景。

### 请求

```http
GET /api/admin/users/search
Authorization: Bearer <token>
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| query | string | 是 | 搜索关键词 |

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": [
    {
      "id": "uuid",
      "username": "zhangsan",
      "nickname": "张三",
      "avatar": "/uploads/avatars/xxx.png"
    }
  ]
}
```

---

## 获取用户详情

👑 需要管理员权限

获取用户的详细信息。

### 请求

```http
GET /api/admin/users/:id
Authorization: Bearer <token>
```

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 用户 ID (UUID) |

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "id": "uuid",
    "username": "zhangsan",
    "nickname": "张三",
    "avatar": "/uploads/avatars/xxx.png",
    "bio": "这是个人简介",
    "phone": "13800138001",
    "email": "zhangsan@example.com",
    "gender": "male",
    "school": "XX大学",
    "department": "计算机学院",
    "role": "student",
    "status": "active",
    "is_disabled": false,
    "tags": ["编程", "音乐"],
    "settings": {
      "privacy": {
        "anonymousMode": false,
        "allowSearch": true,
        "showLocation": true,
        "allowFollow": true,
        "allowComment": true,
        "allowMessage": true
      }
    },
    "statistics": {
      "post_count": 10,
      "comment_count": 50,
      "like_count": 100,
      "follower_count": 50,
      "following_count": 30
    },
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-30T10:00:00.000Z",
    "last_login_at": "2024-01-30T10:00:00.000Z"
  }
}
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 用户不存在 |

---

## 更新用户信息

👑 需要管理员权限

更新用户的基本信息。

### 请求

```http
PUT /api/admin/users/:id
Authorization: Bearer <token>
Content-Type: application/json
```

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 用户 ID (UUID) |

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nickname | string | 否 | 昵称 (1-50 字符) |
| phone | string | 否 | 手机号 |
| email | string | 否 | 邮箱 |
| gender | string | 否 | 性别 (male/female/other) |
| school | string | 否 | 学校 (最多 100 字符) |
| department | string | 否 | 院系 (最多 100 字符) |
| bio | string | 否 | 个人简介 (最多 500 字符) |
| password | string | 否 | 新密码 (6-30 字符) |
| role | string | 否 | 角色 (student/teacher/admin) |
| is_disabled | boolean | 否 | 是否禁用 |
| tags | array | 否 | 标签数组 (最多 8 个) |
| settings | object | 否 | 用户设置 |

### 请求示例

```json
{
  "nickname": "新昵称",
  "school": "新学校",
  "role": "student"
}
```

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "更新成功",
  "data": {
    "id": "uuid",
    "nickname": "新昵称",
    "school": "新学校"
  }
}
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| 100 | 参数错误 |
| 200 | 用户不存在 |
| 204 | 手机号已存在 |
| 205 | 邮箱已存在 |

---

## 删除用户

👑 需要管理员权限

删除用户账号。

### 请求

```http
DELETE /api/admin/users/:id
Authorization: Bearer <token>
```

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 用户 ID (UUID) |

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "删除成功",
  "data": null
}
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 用户不存在 |
| 103 | 无权限操作 (不能删除管理员) |

---

## 审核用户

👑 需要管理员权限

审核用户注册申请。

### 请求

```http
PUT /api/admin/users/:id/audit
Authorization: Bearer <token>
Content-Type: application/json
```

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 用户 ID (UUID) |

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 操作类型 (approve/reject) |
| reason | string | 条件 | 拒绝原因 (action 为 reject 时必填) |

### 请求示例 - 通过

```json
{
  "action": "approve"
}
```

### 请求示例 - 拒绝

```json
{
  "action": "reject",
  "reason": "信息不完整，请补充学校信息"
}
```

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "审核完成",
  "data": {
    "id": "uuid",
    "status": "active"
  }
}
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| 100 | 参数错误 |
| 200 | 用户不存在 |
| 109 | 无效的操作 (用户不在待审核状态) |

---

## 禁用用户

👑 需要管理员权限

禁用用户账号，禁用后用户无法登录。

### 请求

```http
PUT /api/admin/users/:id/disable
Authorization: Bearer <token>
```

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 用户 ID (UUID) |

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "用户已禁用",
  "data": {
    "id": "uuid",
    "is_disabled": true
  }
}
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 用户不存在 |
| 103 | 无权限操作 (不能禁用管理员) |

---

## 启用用户

👑 需要管理员权限

启用被禁用的用户账号。

### 请求

```http
PUT /api/admin/users/:id/enable
Authorization: Bearer <token>
```

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 用户 ID (UUID) |

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "用户已启用",
  "data": {
    "id": "uuid",
    "is_disabled": false
  }
}
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 用户不存在 |

---

## 获取用户徽章

👑 需要管理员权限

获取指定用户的徽章列表。

### 请求

```http
GET /api/admin/users/:userId/badges
Authorization: Bearer <token>
```

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户 ID (UUID) |

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": [
    {
      "id": "uuid",
      "badge_id": "uuid",
      "name": "活跃用户",
      "description": "连续 7 天登录",
      "color": "#FF6B6B",
      "type": "achievement",
      "rarity": "common",
      "is_visible": true,
      "granted_at": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

---

## 获取拒绝记录

👑 需要管理员权限

获取用户注册被拒绝的记录。

### 请求

```http
GET /api/admin/users/rejection-logs
Authorization: Bearer <token>
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 10 |
| username | string | 否 | 用户名筛选 |
| startTime | string | 否 | 开始时间 |
| endTime | string | 否 | 结束时间 |

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "list": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "username": "lisi",
        "reason": "信息不完整",
        "operator_id": "uuid",
        "operator_name": "admin",
        "created_at": "2024-01-30T10:00:00.000Z"
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

## 数据模型

### 用户状态

| 状态 | 说明 |
|------|------|
| pending | 待审核 |
| active | 正常 |
| disabled | 已禁用 |

### 用户角色

| 角色 | 说明 |
|------|------|
| student | 学生 |
| teacher | 教师 |
| admin | 管理员 |
