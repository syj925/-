# 表情模块 API

## 概述

表情模块提供表情包和表情的查询、收藏、使用记录等功能。

**Base URL**: `/api/emojis`

---

## API 列表

### 1. 获取初始化数据

🔓 **可选认证**

```http
GET /api/emojis/init
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| version | string | 否 | 本地缓存版本号 |

#### 说明

支持版本检查，如果本地版本与服务器一致，返回空数据节省流量。

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "version": "2024013001",
    "needUpdate": true,
    "packs": [...],
    "recentEmojis": [...],
    "favoriteEmojis": [...]
  }
}
```

---

### 2. 获取表情包列表

🌐 **公开接口**

```http
GET /api/emojis/packs
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "list": [
      {
        "id": "pack-uuid",
        "name": "默认表情",
        "cover": "/uploads/emojis/packs/default.png",
        "emojiCount": 50,
        "isDefault": true,
        "sortOrder": 1
      }
    ]
  }
}
```

---

### 3. 获取表情包详情

🌐 **公开接口**

```http
GET /api/emojis/packs/:packId
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| packId | string | 表情包 ID |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "id": "pack-uuid",
    "name": "默认表情",
    "cover": "/uploads/emojis/packs/default.png",
    "emojis": [
      {
        "id": "emoji-uuid",
        "name": "微笑",
        "url": "/uploads/emojis/smile.gif",
        "type": "animated"
      }
    ]
  }
}
```

---

### 4. 搜索表情

🌐 **公开接口**

```http
GET /api/emojis/search
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

---

### 5. 获取热门表情

🌐 **公开接口**

```http
GET /api/emojis/hot
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | number | 否 | 数量限制 |

---

### 6. 获取用户个人数据

🔐 **需要登录**

```http
GET /api/emojis/user-data
```

#### 说明

获取用户的最近使用、收藏等个人表情数据。

---

### 7. 记录表情使用

🔐 **需要登录**

```http
POST /api/emojis/usage
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| emoji_id | string | 是 | 表情 ID (UUID) |

---

### 8. 获取最近使用的表情

🔐 **需要登录**

```http
GET /api/emojis/recent
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | number | 否 | 数量限制 (默认 30) |

---

### 9. 获取收藏的表情

🔐 **需要登录**

```http
GET /api/emojis/favorites
```

---

### 10. 收藏表情

🔐 **需要登录**

```http
POST /api/emojis/favorites
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| emoji_id | string | 是 | 表情 ID (UUID) |

---

### 11. 取消收藏表情

🔐 **需要登录**

```http
DELETE /api/emojis/favorites/:emojiId
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| emojiId | string | 表情 ID |

---

### 12. 获取用户的表情包

🔐 **需要登录**

```http
GET /api/emojis/user/packs
```

---

### 13. 添加表情包

🔐 **需要登录**

```http
POST /api/emojis/user/packs
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pack_id | string | 是 | 表情包 ID (UUID) |
| source | string | 否 | 来源 (default/download/purchase/gift) |

---

### 14. 移除表情包

🔐 **需要登录**

```http
DELETE /api/emojis/user/packs/:packId
```

---

### 15. 上传自定义表情

🔐 **需要登录**

```http
POST /api/emojis/custom
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 表情名称 (1-50字符) |
| url | string | 是 | 图片 URL (最多500字符) |
| type | string | 否 | 类型 (static/animated) |
| file_size | number | 否 | 文件大小 (最大 2MB) |
| width | number | 否 | 宽度 (最大 500px) |
| height | number | 否 | 高度 (最大 500px) |

---

### 16. 获取自定义表情列表

🔐 **需要登录**

```http
GET /api/emojis/custom
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "list": [
      {
        "id": "custom-emoji-uuid",
        "name": "我的表情",
        "url": "/uploads/custom-emojis/xxx.gif",
        "type": "animated",
        "status": "approved",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```
