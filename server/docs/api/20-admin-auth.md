# 管理员认证 API

> 👑 本模块所有接口（除登录外）均需要管理员权限

## 概述

管理员认证模块提供管理后台的登录、登出、Token 刷新和密码修改功能。

**Base URL**: `/api/admin`

---

## 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| [管理员登录](#管理员登录) | POST | `/login` | 管理员账号登录 |
| [管理员登出](#管理员登出) | POST | `/logout` | 退出登录 |
| [获取当前管理员信息](#获取当前管理员信息) | GET | `/profile` | 获取当前登录管理员信息 |
| [刷新 Token](#刷新-token) | POST | `/refresh-token` | 刷新访问令牌 |
| [修改密码](#修改密码) | PUT | `/change-password` | 修改管理员密码 |

---

## 管理员登录

管理员账号密码登录。

### 请求

```http
POST /api/admin/login
Content-Type: application/json
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 (3-50 字符) |
| password | string | 是 | 密码 (6-30 字符) |

### 请求示例

```json
{
  "username": "admin",
  "password": "admin123"
}
```

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 7200,
    "admin": {
      "id": "uuid",
      "username": "admin",
      "role": "super_admin",
      "nickname": "超级管理员",
      "avatar": "/uploads/avatars/admin.png",
      "lastLoginAt": "2024-01-30T10:00:00.000Z",
      "lastLoginIp": "127.0.0.1"
    }
  }
}
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| 100 | 参数错误 |
| 200 | 用户不存在 |
| 201 | 密码错误 |
| 202 | 账号已被禁用 |

---

## 管理员登出

👑 需要管理员权限

退出管理员登录状态。

### 请求

```http
POST /api/admin/logout
Authorization: Bearer <token>
```

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "登出成功",
  "data": null
}
```

---

## 获取当前管理员信息

👑 需要管理员权限

获取当前登录的管理员详细信息。

### 请求

```http
GET /api/admin/profile
Authorization: Bearer <token>
```

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "id": "uuid",
    "username": "admin",
    "role": "super_admin",
    "nickname": "超级管理员",
    "avatar": "/uploads/avatars/admin.png",
    "email": "admin@example.com",
    "phone": "13800138000",
    "permissions": ["user:read", "user:write", "post:read", "post:write"],
    "lastLoginAt": "2024-01-30T10:00:00.000Z",
    "lastLoginIp": "127.0.0.1",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| 101 | 无效的 Token |
| 102 | Token 已过期 |

---

## 刷新 Token

👑 需要管理员权限

使用刷新令牌获取新的访问令牌。

### 请求

```http
POST /api/admin/refresh-token
Authorization: Bearer <token>
Content-Type: application/json
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refreshToken | string | 否 | 刷新令牌 (可选，也可通过 Header 传递) |

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "刷新成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 7200
  }
}
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| 101 | 无效的 Token |
| 102 | Token 已过期 |

---

## 修改密码

👑 需要管理员权限

修改当前管理员的登录密码。

### 请求

```http
PUT /api/admin/change-password
Authorization: Bearer <token>
Content-Type: application/json
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldPassword | string | 是 | 旧密码 |
| newPassword | string | 是 | 新密码 (6-30 字符) |

### 请求示例

```json
{
  "oldPassword": "admin123",
  "newPassword": "newPassword456"
}
```

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "密码修改成功",
  "data": null
}
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| 100 | 参数错误 |
| 201 | 旧密码错误 |

---

## 管理员状态检查

👑 需要管理员权限

检查管理员系统运行状态。

### 请求

```http
GET /api/admin/status
Authorization: Bearer <token>
```

### 响应示例

```json
{
  "success": true,
  "message": "管理员系统运行正常",
  "data": {
    "admin": {
      "id": "uuid",
      "username": "admin",
      "role": "super_admin"
    },
    "timestamp": "2024-01-30T10:00:00.000Z",
    "version": "1.0.0"
  }
}
```

---

## 系统健康检查

👑 需要管理员权限

获取系统健康状态信息。

### 请求

```http
GET /api/admin/health
Authorization: Bearer <token>
```

### 响应示例

```json
{
  "success": true,
  "message": "系统健康",
  "data": {
    "status": "healthy",
    "uptime": 86400,
    "memory": {
      "rss": 104857600,
      "heapTotal": 62914560,
      "heapUsed": 41943040,
      "external": 8388608
    },
    "timestamp": "2024-01-30T10:00:00.000Z"
  }
}
```

---

## 数据模型

### 管理员对象 (Admin)

```json
{
  "id": "uuid",
  "username": "用户名",
  "role": "super_admin|admin|operator",
  "nickname": "昵称",
  "avatar": "/uploads/avatars/xxx.png",
  "email": "邮箱",
  "phone": "手机号",
  "permissions": ["权限1", "权限2"],
  "lastLoginAt": "最后登录时间",
  "lastLoginIp": "最后登录IP",
  "created_at": "创建时间",
  "updated_at": "更新时间"
}
```

### 角色说明

| 角色 | 说明 |
|------|------|
| super_admin | 超级管理员，拥有全部权限 |
| admin | 管理员，拥有大部分管理权限 |
| operator | 运营人员，拥有内容管理权限 |
