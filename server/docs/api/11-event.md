# 活动模块 API

## 概述

活动模块提供活动的创建、查询、报名、签到等功能。

**Base URL**: `/api/events` 和 `/api/registrations`

---

## 活动 API

### 1. 获取活动列表

🌐 **公开接口**

```http
GET /api/events
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 (1-100) |
| status | number | 否 | 状态筛选 (0-3) |
| keyword | string | 否 | 关键词搜索 |

#### 活动状态

| 值 | 说明 |
|----|------|
| 0 | 草稿 |
| 1 | 报名中 |
| 2 | 进行中 |
| 3 | 已结束 |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "list": [
      {
        "id": "event-uuid",
        "title": "校园歌手大赛",
        "description": "年度校园歌手选拔活动",
        "cover_image": "/uploads/events/xxx.png",
        "start_time": "2024-03-01T14:00:00.000Z",
        "end_time": "2024-03-01T18:00:00.000Z",
        "location": "大礼堂",
        "max_participants": 100,
        "current_participants": 50,
        "registration_deadline": "2024-02-28T23:59:59.000Z",
        "status": 1,
        "is_recommended": true,
        "organizer": {
          "id": "user-uuid",
          "nickname": "学生会"
        },
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

### 2. 获取推荐活动

🌐 **公开接口**

```http
GET /api/events/recommended
```

---

### 3. 获取即将开始的活动

🌐 **公开接口**

```http
GET /api/events/upcoming
```

---

### 4. 获取我创建的活动

🔐 **需要登录**

```http
GET /api/events/my-events
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

---

### 5. 获取活动详情

🔓 **可选认证**

```http
GET /api/events/:id
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 活动 ID (UUID) |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "id": "event-uuid",
    "title": "校园歌手大赛",
    "description": "详细描述...",
    "cover_image": "/uploads/events/xxx.png",
    "start_time": "2024-03-01T14:00:00.000Z",
    "end_time": "2024-03-01T18:00:00.000Z",
    "location": "大礼堂",
    "max_participants": 100,
    "current_participants": 50,
    "registration_deadline": "2024-02-28T23:59:59.000Z",
    "allow_cancel_registration": true,
    "form_config": [
      {
        "field": "phone",
        "label": "联系电话",
        "type": "text",
        "required": true
      }
    ],
    "notices": ["请提前15分钟到场", "携带学生证"],
    "status": 1,
    "is_recommended": true,
    "is_registered": false,
    "organizer": {
      "id": "user-uuid",
      "nickname": "学生会",
      "avatar": "/uploads/avatars/xxx.png"
    },
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 800 | 活动不存在 |

---

### 6. 创建活动

🔐 **需要登录**

```http
POST /api/events
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 活动标题 (最多100字符) |
| description | string | 否 | 活动描述 (最多2000字符) |
| start_time | string | 是 | 开始时间 (ISO 8601) |
| end_time | string | 是 | 结束时间 (ISO 8601) |
| location | string | 否 | 活动地点 (最多200字符) |
| max_participants | number | 否 | 最大参与人数 |
| registration_deadline | string | 否 | 报名截止时间 |
| form_config | array | 否 | 报名表单配置 |
| notices | array | 否 | 活动须知 |
| allow_cancel_registration | boolean | 否 | 是否允许取消报名 |

#### 请求示例

```json
{
  "title": "读书分享会",
  "description": "本月读书分享活动",
  "start_time": "2024-03-15T14:00:00.000Z",
  "end_time": "2024-03-15T16:00:00.000Z",
  "location": "图书馆报告厅",
  "max_participants": 50,
  "registration_deadline": "2024-03-14T23:59:59.000Z"
}
```

---

### 7. 更新活动

🔐 **需要登录** (仅创建者)

```http
PUT /api/events/:id
```

---

### 8. 删除活动

🔐 **需要登录** (仅创建者)

```http
DELETE /api/events/:id
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 800 | 活动不存在 |
| 103 | 无权限操作 |
| 805 | 活动已有报名记录，无法删除 |

---

### 9. 报名活动

🔐 **需要登录**

```http
POST /api/events/:id/register
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| form_data | object | 否 | 报名表单数据 |

#### 请求示例

```json
{
  "form_data": {
    "phone": "13800138000",
    "department": "计算机学院"
  }
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 800 | 活动不存在 |
| 801 | 活动不在报名期间 |
| 802 | 活动报名人数已满 |
| 806 | 报名已截止 |
| 807 | 已报名此活动 |

---

### 10. 取消报名

🔐 **需要登录**

```http
DELETE /api/events/:id/register
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 否 | 取消原因 |

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 808 | 报名记录不存在 |
| 809 | 不允许取消报名 |
| 813 | 未报名此活动 |

---

### 11. 检查报名状态

🔐 **需要登录**

```http
GET /api/events/:id/registration-status
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "isRegistered": true,
    "registration": {
      "id": "registration-uuid",
      "status": 1,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 12. 批量检查报名状态

🔐 **需要登录**

```http
POST /api/events/batch-registration-status
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| event_ids | array | 是 | 活动 ID 数组 |

---

### 13. 获取活动统计

🌐 **公开接口**

```http
GET /api/events/:id/statistics
```

---

## 报名管理 API

**Base URL**: `/api/registrations`

### 14. 获取我的报名列表

🔐 **需要登录**

```http
GET /api/registrations/my-registrations
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |
| status | string | 否 | 状态筛选 (0/1/2) |

#### 报名状态

| 值 | 说明 |
|----|------|
| 0 | 已取消 |
| 1 | 已报名 |
| 2 | 已参加 |

---

### 15. 获取我的报名统计

🔐 **需要登录**

```http
GET /api/registrations/my-statistics
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "total": 10,
    "registered": 3,
    "attended": 5,
    "cancelled": 2
  }
}
```

---

### 16. 获取报名详情

🔐 **需要登录**

```http
GET /api/registrations/:id
```

---

### 17. 更新报名信息

🔐 **需要登录** (仅本人)

```http
PUT /api/registrations/:id
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| form_data | object | 否 | 报名表单数据 |
| notes | string | 否 | 备注 (最多500字符) |
