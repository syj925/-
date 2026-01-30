# 管理员系统管理 API

> 👑 本模块所有接口均需要管理员权限

## 概述

系统管理模块提供仪表盘数据、系统设置、推荐算法管理、消息管理、活动管理、表情管理、徽章管理和配置版本管理等功能。

**Base URL**: `/api/admin`

---

## 仪表盘

### 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| [获取仪表盘数据](#获取仪表盘数据) | GET | `/dashboard` | 获取基础统计数据 |
| [获取趋势数据](#获取趋势数据) | GET | `/dashboard/trend` | 获取趋势统计 |
| [获取用户分布](#获取用户分布) | GET | `/dashboard/user-distribution` | 获取用户分布数据 |
| [刷新仪表盘缓存](#刷新仪表盘缓存) | POST | `/dashboard/refresh-cache` | 刷新缓存数据 |
| [获取系统状态](#获取系统状态) | GET | `/dashboard/system-status` | 获取系统状态信息 |

---

### 获取仪表盘数据

👑 需要管理员权限

获取仪表盘基础统计数据。

#### 请求

```http
GET /api/admin/dashboard
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "overview": {
      "totalUsers": 1000,
      "totalPosts": 5000,
      "totalComments": 20000,
      "totalViews": 500000
    },
    "today": {
      "newUsers": 10,
      "newPosts": 50,
      "newComments": 200,
      "activeUsers": 300
    },
    "pending": {
      "pendingUsers": 5,
      "pendingPosts": 10,
      "pendingComments": 3
    }
  }
}
```

---

### 获取趋势数据

👑 需要管理员权限

获取指定时间周期的趋势统计数据。

#### 请求

```http
GET /api/admin/dashboard/trend
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| period | string | 否 | 时间周期 (day/week/month)，默认 week |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "dates": ["2024-01-24", "2024-01-25", "2024-01-26", "2024-01-27", "2024-01-28", "2024-01-29", "2024-01-30"],
    "users": [10, 15, 12, 20, 18, 25, 22],
    "posts": [50, 60, 45, 70, 55, 80, 65],
    "comments": [200, 220, 180, 250, 210, 280, 240]
  }
}
```

---

### 获取用户分布

👑 需要管理员权限

获取用户的分布统计数据。

#### 请求

```http
GET /api/admin/dashboard/user-distribution
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "byRole": {
      "student": 800,
      "teacher": 150,
      "admin": 50
    },
    "byGender": {
      "male": 500,
      "female": 450,
      "other": 50
    },
    "bySchool": [
      {"name": "XX大学", "count": 300},
      {"name": "YY大学", "count": 250}
    ]
  }
}
```

---

### 刷新仪表盘缓存

👑 需要管理员权限

手动刷新仪表盘缓存数据。

#### 请求

```http
POST /api/admin/dashboard/refresh-cache
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "缓存已刷新",
  "data": null
}
```

---

### 获取系统状态

👑 需要管理员权限

获取系统运行状态信息。

#### 请求

```http
GET /api/admin/dashboard/system-status
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "server": {
      "uptime": 86400,
      "nodeVersion": "18.17.0",
      "platform": "linux"
    },
    "memory": {
      "total": 8589934592,
      "used": 4294967296,
      "free": 4294967296
    },
    "database": {
      "status": "connected",
      "connections": 10
    },
    "redis": {
      "status": "connected",
      "usedMemory": "50MB"
    }
  }
}
```

---

## 系统设置

### 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| [获取系统设置](#获取系统设置) | GET | `/settings` | 获取系统设置 |
| [更新系统设置](#更新系统设置) | PUT | `/settings` | 更新系统设置 |
| [初始化推荐设置](#初始化推荐设置) | POST | `/settings/init-recommendation` | 初始化推荐算法设置 |
| [初始化搜索设置](#初始化搜索设置) | POST | `/settings/init-search` | 初始化搜索设置 |

---

### 获取系统设置

👑 需要管理员权限

#### 请求

```http
GET /api/admin/settings
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "site": {
      "name": "校园墙",
      "description": "校园社交平台",
      "logo": "/uploads/logo.png"
    },
    "registration": {
      "enabled": true,
      "requireAudit": true
    },
    "post": {
      "requireAudit": false,
      "maxImages": 9
    },
    "comment": {
      "requireAudit": false
    }
  }
}
```

---

### 更新系统设置

👑 需要管理员权限

#### 请求

```http
PUT /api/admin/settings
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

根据需要更新的设置项传递相应字段。

#### 请求示例

```json
{
  "registration": {
    "enabled": true,
    "requireAudit": false
  }
}
```

---

## 推荐算法管理

### 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| [获取推荐设置](#获取推荐设置) | GET | `/recommendation/settings` | 获取推荐算法设置 |
| [更新推荐设置](#更新推荐设置) | PUT | `/recommendation/settings` | 更新推荐算法设置 |
| [初始化推荐设置](#初始化推荐设置-1) | POST | `/recommendation/init` | 初始化推荐设置 |
| [清除推荐缓存](#清除推荐缓存) | DELETE | `/recommendation/cache` | 清除推荐缓存 |
| [获取推荐统计](#获取推荐统计) | GET | `/recommendation/stats` | 获取推荐统计信息 |
| [测试推荐算法](#测试推荐算法) | GET | `/recommendation/test` | 测试推荐算法 |
| [重新计算分数](#重新计算分数) | POST | `/recommendation/recalculate` | 重新计算推荐分数 |
| [启动自动更新](#启动自动更新) | POST | `/recommendation/auto-update/start` | 启动自动更新任务 |
| [停止自动更新](#停止自动更新) | POST | `/recommendation/auto-update/stop` | 停止自动更新任务 |
| [获取自动更新状态](#获取自动更新状态) | GET | `/recommendation/auto-update/status` | 获取自动更新状态 |
| [获取预设配置](#获取预设配置) | GET | `/recommendation/presets` | 获取预设配置列表 |
| [应用预设配置](#应用预设配置) | POST | `/recommendation/presets/apply` | 应用预设配置 |
| [导出配置](#导出配置) | GET | `/recommendation/export` | 导出当前配置 |
| [导入配置](#导入配置) | POST | `/recommendation/import` | 导入自定义配置 |

---

### 获取推荐设置

👑 需要管理员权限

#### 请求

```http
GET /api/admin/recommendation/settings
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "enabled": true,
    "weights": {
      "like": 1.0,
      "comment": 2.0,
      "favorite": 1.5,
      "view": 0.1,
      "share": 3.0
    },
    "decay": {
      "enabled": true,
      "halfLife": 7
    },
    "diversity": {
      "enabled": true,
      "factor": 0.3
    }
  }
}
```

---

### 更新推荐设置

👑 需要管理员权限

#### 请求

```http
PUT /api/admin/recommendation/settings
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| settings | object | 是 | 推荐设置对象 |

---

### 测试推荐算法

👑 需要管理员权限

#### 请求

```http
GET /api/admin/recommendation/test
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| strategy | string | 否 | 推荐策略 |
| pageSize | number | 否 | 返回数量 |

---

## 消息管理

### 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| [获取系统通知列表](#获取系统通知列表) | GET | `/messages/system` | 获取系统通知列表 |
| [获取通知统计](#获取通知统计) | GET | `/messages/system/stats` | 获取通知统计 |
| [创建系统通知](#创建系统通知) | POST | `/messages/system` | 创建系统通知 |
| [获取通知详情](#获取通知详情) | GET | `/messages/system/:id` | 获取通知详情 |
| [删除系统通知](#删除系统通知) | DELETE | `/messages/system/:id` | 删除系统通知 |
| [获取通知接收者](#获取通知接收者) | GET | `/messages/system/:id/recipients` | 获取通知接收者列表 |

---

### 获取系统通知列表

👑 需要管理员权限

#### 请求

```http
GET /api/admin/messages/system
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 10 |
| type | string | 否 | 通知类型 |
| searchQuery | string | 否 | 搜索关键词 |

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
        "title": "系统维护通知",
        "content": "系统将于今晚进行维护...",
        "type": "system",
        "target": "all",
        "read_count": 500,
        "total_count": 1000,
        "created_at": "2024-01-30T10:00:00.000Z"
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

### 创建系统通知

👑 需要管理员权限

#### 请求

```http
POST /api/admin/messages/system
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 通知标题 |
| content | string | 是 | 通知内容 |
| type | string | 否 | 通知类型 |
| target | string | 否 | 目标用户 (all/specific) |
| userIds | array | 条件 | 目标用户 ID 列表 (target 为 specific 时必填) |

#### 请求示例

```json
{
  "title": "系统维护通知",
  "content": "系统将于今晚 22:00-24:00 进行维护升级",
  "type": "system",
  "target": "all"
}
```

---

## 活动管理

### 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| [获取活动列表](#获取活动列表) | GET | `/events` | 获取活动列表 |
| [获取活动统计](#获取活动统计) | GET | `/events/statistics` | 获取全局活动统计 |
| [获取活动详情](#获取活动详情) | GET | `/events/:id` | 获取活动详情 |
| [创建活动](#创建活动) | POST | `/events` | 创建活动 |
| [更新活动](#更新活动) | PUT | `/events/:id` | 更新活动 |
| [删除活动](#删除活动) | DELETE | `/events/:id` | 删除活动 |
| [获取报名列表](#获取报名列表) | GET | `/events/:id/registrations` | 获取活动报名列表 |
| [更新报名状态](#更新报名状态) | PUT | `/events/:eventId/registrations/:registrationId/status` | 更新报名状态 |
| [批量更新报名状态](#批量更新报名状态) | PUT | `/events/:eventId/registrations/batch-status` | 批量更新报名状态 |
| [获取活动统计详情](#获取活动统计详情) | GET | `/events/:id/statistics` | 获取单个活动统计 |
| [导出报名数据](#导出报名数据) | GET | `/events/:id/registrations/export` | 导出报名数据 |

---

### 获取活动列表

👑 需要管理员权限

#### 请求

```http
GET /api/admin/events
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 10 |
| title | string | 否 | 活动标题搜索 |
| status | string | 否 | 活动状态筛选 |
| startDate | string | 否 | 开始日期筛选 |
| endDate | string | 否 | 结束日期筛选 |
| isRecommended | boolean | 否 | 是否推荐筛选 |
| organizer | string | 否 | 组织者筛选 |

---

### 创建活动

👑 需要管理员权限

#### 请求

```http
POST /api/admin/events
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 活动标题 |
| description | string | 是 | 活动描述 |
| cover_image | string | 否 | 封面图片 |
| start_time | string | 是 | 开始时间 |
| end_time | string | 是 | 结束时间 |
| registration_start | string | 是 | 报名开始时间 |
| registration_end | string | 是 | 报名截止时间 |
| location | string | 否 | 活动地点 |
| max_participants | number | 否 | 最大参与人数 |
| is_recommended | boolean | 否 | 是否推荐 |

---

### 导出报名数据

👑 需要管理员权限

#### 请求

```http
GET /api/admin/events/:id/registrations/export
Authorization: Bearer <token>
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| format | string | 否 | 导出格式 (excel/csv)，默认 excel |

---

## 表情管理

### 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取表情包列表 | GET | `/emoji-packs` | 获取表情包列表 |
| 获取表情包详情 | GET | `/emoji-packs/:packId` | 获取表情包详情 |
| 创建表情包 | POST | `/emoji-packs` | 创建表情包 |
| 更新表情包 | PUT | `/emoji-packs/:packId` | 更新表情包 |
| 删除表情包 | DELETE | `/emoji-packs/:packId` | 删除表情包 |
| 创建表情 | POST | `/emojis` | 创建表情 |
| 更新表情 | PUT | `/emojis/:emojiId` | 更新表情 |
| 删除表情 | DELETE | `/emojis/:emojiId` | 删除表情 |
| 获取待审核表情 | GET | `/emojis/pending` | 获取待审核表情 |
| 审核表情 | POST | `/emojis/:customEmojiId/review` | 审核自定义表情 |
| 同步使用计数 | POST | `/emojis/sync-counts` | 同步使用计数 |
| 清除缓存 | POST | `/emojis/clear-cache` | 清除表情缓存 |

---

## 徽章管理

### 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取徽章列表 | GET | `/badges` | 获取徽章列表 |
| 搜索徽章 | GET | `/badges/search` | 搜索徽章 |
| 获取徽章统计 | GET | `/badges/statistics` | 获取徽章统计 |
| 获取最近授予 | GET | `/badges/recent` | 获取最近授予记录 |
| 获取徽章详情 | GET | `/badges/:id` | 获取徽章详情 |
| 获取徽章用户 | GET | `/badges/:badgeId/users` | 获取拥有徽章的用户 |
| 获取授予记录 | GET | `/badges/:badgeId/grants` | 获取授予记录 |
| 创建徽章 | POST | `/badges` | 创建徽章 |
| 更新徽章 | PUT | `/badges/:id` | 更新徽章 |
| 更新徽章状态 | PATCH | `/badges/:id/status` | 更新徽章状态 |
| 删除徽章 | DELETE | `/badges/:id` | 删除徽章 |
| 授予徽章 | POST | `/badges/grant` | 授予用户徽章 |
| 撤销徽章 | POST | `/badges/revoke` | 撤销用户徽章 |
| 批量授予徽章 | POST | `/badges/batch-grant` | 批量授予徽章 |
| 批量撤销徽章 | POST | `/badges/batch-revoke` | 批量撤销徽章 |
| 更新徽章可见性 | POST | `/badges/visibility` | 更新徽章可见性 |

---

### 创建徽章

👑 需要管理员权限

#### 请求

```http
POST /api/admin/badges
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 徽章名称 (2-50 字符) |
| description | string | 否 | 徽章描述 (最多 500 字符) |
| color | string | 否 | 颜色 (十六进制，如 #FF6B6B) |
| type | string | 否 | 类型 (achievement/interest/system) |
| rarity | string | 否 | 稀有度 (common/rare/epic/legendary) |
| autoGrant | boolean | 否 | 是否自动授予 |
| grantCondition | object | 否 | 授予条件 |
| sortOrder | number | 否 | 排序顺序 |
| status | string | 否 | 状态 (active/inactive) |

---

### 授予徽章

👑 需要管理员权限

#### 请求

```http
POST /api/admin/badges/grant
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户 ID (UUID) |
| badgeId | string | 是 | 徽章 ID (UUID) |

---

## 配置版本管理

### 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取配置版本 | GET | `/config-version` | 获取当前配置版本 |
| 获取版本历史 | GET | `/config-versions` | 获取版本历史 |
| 发布新版本 | POST | `/config-version` | 发布新配置版本 |
| 回滚版本 | POST | `/config-rollback` | 回滚到指定版本 |

---

### 获取配置版本

👑 需要管理员权限

#### 请求

```http
GET /api/admin/config-version
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "version": "1.2.0",
    "publishedAt": "2024-01-30T10:00:00.000Z",
    "publisher": "admin",
    "changelog": "更新了推荐算法参数"
  }
}
```

---

### 发布新版本

👑 需要管理员权限

#### 请求

```http
POST /api/admin/config-version
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| version | string | 是 | 版本号 |
| changelog | string | 否 | 更新日志 |

---

### 回滚版本

👑 需要管理员权限

#### 请求

```http
POST /api/admin/config-rollback
Authorization: Bearer <token>
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| version | string | 是 | 目标版本号 |

---

## 在线统计

### 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取在线统计 | GET | `/stats/online` | 获取在线用户统计 |

---

## 分类统计

### 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取分类统计 | GET | `/category-stats` | 获取分类统计数据 |

---

## 错误码汇总

| 错误码 | 说明 |
|--------|------|
| 100 | 参数错误 |
| 101 | 无效的 Token |
| 102 | Token 已过期 |
| 103 | 无权限操作 |
| 104 | 资源不存在 |
| 106 | 服务器内部错误 |
| 107 | 服务繁忙 |
| 111 | 数据库操作失败 |
| 800 | 活动不存在 |
| 805 | 活动已有报名记录，无法删除 |
| 810 | 时间设置无效 |
| 811 | 状态无效 |
