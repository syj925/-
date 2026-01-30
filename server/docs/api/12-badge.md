# 徽章模块 API

## 概述

徽章模块提供用户徽章的查询、展示管理等功能。

**Base URL**: `/api/badges`

---

## API 列表

### 1. 获取徽章列表

🌐 **公开接口**

```http
GET /api/badges
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |
| type | string | 否 | 类型筛选 |
| rarity | string | 否 | 稀有度筛选 |

#### 徽章类型

| 值 | 说明 |
|----|------|
| achievement | 成就徽章 |
| interest | 兴趣徽章 |
| system | 系统徽章 |

#### 稀有度

| 值 | 说明 |
|----|------|
| common | 普通 |
| rare | 稀有 |
| epic | 史诗 |
| legendary | 传说 |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "list": [
      {
        "id": "badge-uuid",
        "name": "新手上路",
        "description": "完成首次发帖",
        "icon": "/uploads/badges/newbie.png",
        "color": "#4CAF50",
        "type": "achievement",
        "rarity": "common",
        "grantCount": 1000
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

### 2. 搜索徽章

🌐 **公开接口**

```http
GET /api/badges/search
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

---

### 3. 获取最近授予的徽章

🌐 **公开接口**

```http
GET /api/badges/recent
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": [
    {
      "badge": {
        "id": "badge-uuid",
        "name": "活跃用户",
        "icon": "/uploads/badges/active.png"
      },
      "user": {
        "id": "user-uuid",
        "nickname": "张三",
        "avatar": "/uploads/avatars/xxx.png"
      },
      "granted_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 4. 获取徽章详情

🌐 **公开接口**

```http
GET /api/badges/:id
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 徽章 ID (UUID) |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "id": "badge-uuid",
    "name": "新手上路",
    "description": "完成首次发帖",
    "icon": "/uploads/badges/newbie.png",
    "color": "#4CAF50",
    "type": "achievement",
    "rarity": "common",
    "autoGrant": true,
    "grantCondition": {
      "type": "post_count",
      "value": 1
    },
    "grantCount": 1000,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 5. 获取徽章拥有者列表

🌐 **公开接口**

```http
GET /api/badges/:badgeId/users
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| badgeId | string | 徽章 ID |

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

---

### 6. 获取用户徽章 (公开)

🌐 **公开接口**

```http
GET /api/badges/user/:userId
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| userId | string | 用户 ID |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": [
    {
      "id": "badge-uuid",
      "name": "新手上路",
      "icon": "/uploads/badges/newbie.png",
      "color": "#4CAF50",
      "rarity": "common",
      "isVisible": true,
      "displayOrder": 1,
      "granted_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 7. 获取用户徽章统计

🔐 **需要登录**

```http
GET /api/badges/user/:userId/stats
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "total": 10,
    "byType": {
      "achievement": 5,
      "interest": 3,
      "system": 2
    },
    "byRarity": {
      "common": 5,
      "rare": 3,
      "epic": 2,
      "legendary": 0
    }
  }
}
```

---

### 8. 获取我的徽章

🔐 **需要登录**

```http
GET /api/badges/my/badges
```

---

### 9. 获取我的徽章统计

🔐 **需要登录**

```http
GET /api/badges/my/stats
```

---

### 10. 检查自动授予徽章

🔐 **需要登录**

```http
POST /api/badges/my/check-auto-grant
```

#### 说明

检查当前用户是否满足自动授予徽章的条件，如果满足则自动授予。

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "granted": [
      {
        "id": "badge-uuid",
        "name": "活跃用户"
      }
    ]
  }
}
```

---

### 11. 更新徽章展示设置

🔐 **需要登录**

```http
PUT /api/badges/my/badges/:badgeId/display
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| badgeId | string | 徽章 ID |

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| isVisible | boolean | 否 | 是否展示 |
| displayOrder | number | 否 | 展示顺序 |

---

### 12. 批量更新徽章顺序

🔐 **需要登录**

```http
PUT /api/badges/my/badges/order
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| badgeOrders | array | 是 | 徽章顺序数组 |

#### badgeOrders 项结构

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| badgeId | string | 是 | 徽章 ID |
| displayOrder | number | 是 | 展示顺序 |

#### 请求示例

```json
{
  "badgeOrders": [
    { "badgeId": "badge-uuid-1", "displayOrder": 1 },
    { "badgeId": "badge-uuid-2", "displayOrder": 2 }
  ]
}
```
