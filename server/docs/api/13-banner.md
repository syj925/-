# 轮播图模块 API

## 概述

轮播图模块提供首页轮播图的查询和管理功能。

**Base URL**: `/api/banners`

---

## API 列表

### 1. 获取轮播图列表

🌐 **公开接口**

```http
GET /api/banners
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| scene | string | 否 | 展示场景 |
| platform | string | 否 | 展示平台 |
| status | string | 否 | 状态筛选 |

#### 展示场景

| 值 | 说明 |
|----|------|
| home | 首页 |
| discover | 发现页 |
| search-main | 搜索主页 |
| search-topic | 话题搜索 |

#### 展示平台

| 值 | 说明 |
|----|------|
| app | 移动应用 |
| web | 网页版 |
| admin | 管理后台 |
| all | 全平台 |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "list": [
      {
        "id": "banner-uuid",
        "title": "新学期活动",
        "image": "/uploads/banners/xxx.png",
        "linkType": "url",
        "linkValue": "https://example.com/event",
        "targetId": null,
        "scene": "home",
        "platform": "all",
        "sortOrder": 1,
        "status": "active"
      }
    ]
  }
}
```

---

### 2. 按场景获取轮播图

🌐 **公开接口**

```http
GET /api/banners/scene/:scene
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| scene | string | 展示场景 |

---

### 3. 记录点击

🌐 **公开接口**

```http
POST /api/banners/click
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| bannerId | string | 是 | 轮播图 ID (UUID) |
| scene | string | 否 | 展示场景 (默认 home) |
| platform | string | 否 | 平台 (默认 app) |

---

### 4. 记录浏览

🌐 **公开接口**

```http
POST /api/banners/view
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| bannerIds | array | 是 | 轮播图 ID 数组 |
| scene | string | 否 | 展示场景 |
| platform | string | 否 | 平台 |

---

### 5. 获取轮播图统计

🔐 **需要登录**

```http
GET /api/banners/:id/statistics
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 轮播图 ID |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "viewCount": 10000,
    "clickCount": 500,
    "clickRate": 5.0
  }
}
```

---

## 管理员接口

### 6. 创建轮播图

👑 **需要管理员权限**

```http
POST /api/banners
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 标题 (1-100字符) |
| image | string | 是 | 图片 URL |
| linkType | string | 否 | 链接类型 (默认 url) |
| linkValue | string | 否 | 链接值 |
| targetId | string | 否 | 目标 ID (UUID) |
| scene | string | 否 | 展示场景 (默认 home) |
| platform | string | 否 | 展示平台 (默认 all) |
| sortOrder | number | 否 | 排序权重 |
| priority | number | 否 | 优先级 |
| status | string | 否 | 状态 (active/inactive) |
| startTime | date | 否 | 开始时间 |
| endTime | date | 否 | 结束时间 |
| tags | array | 否 | 标签 |

#### 链接类型

| 值 | 说明 |
|----|------|
| url | 外部链接 |
| post | 帖子详情 |
| topic | 话题详情 |
| event | 活动详情 |
| page | 内部页面 |

#### 请求示例

```json
{
  "title": "开学季活动",
  "image": "/uploads/banners/welcome.png",
  "linkType": "event",
  "targetId": "event-uuid",
  "scene": "home",
  "status": "active",
  "sortOrder": 1
}
```

---

### 7. 获取轮播图详情

👑 **需要管理员权限**

```http
GET /api/banners/:id
```

---

### 8. 更新轮播图

👑 **需要管理员权限**

```http
PUT /api/banners/:id
```

#### 请求参数

同创建接口，所有字段均为可选。

---

### 9. 删除轮播图

👑 **需要管理员权限**

```http
DELETE /api/banners/:id
```

---

### 10. 批量更新排序

👑 **需要管理员权限**

```http
PUT /api/banners/sort/order
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| banners | array | 是 | 排序数据数组 |

#### banners 项结构

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 轮播图 ID |
| sortOrder | number | 是 | 排序权重 |

#### 请求示例

```json
{
  "banners": [
    { "id": "banner-uuid-1", "sortOrder": 1 },
    { "id": "banner-uuid-2", "sortOrder": 2 }
  ]
}
```
