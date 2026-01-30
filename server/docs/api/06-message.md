# 消息模块 API

## 概述

消息模块包含系统通知和私信功能。

---

## 通知消息 API

**Base URL**: `/api/messages`

> 所有通知消息接口都需要登录

### 1. 获取消息列表

🔐 **需要登录**

```http
GET /api/messages
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 消息类型筛选 |
| is_read | boolean | 否 | 已读状态筛选 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

#### 消息类型

| 类型 | 说明 |
|------|------|
| follow | 关注通知 |
| like | 点赞通知 |
| comment | 评论通知 |
| reply | 回复通知 |
| favorite | 收藏通知 |
| mention | @提醒通知 |
| system | 系统通知 |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "list": [
      {
        "id": "message-uuid",
        "type": "like",
        "content": "张三点赞了你的帖子",
        "is_read": false,
        "sender": {
          "id": "user-uuid",
          "nickname": "张三",
          "avatar": "/uploads/avatars/xxx.png"
        },
        "target": {
          "type": "post",
          "id": "post-uuid",
          "title": "帖子标题"
        },
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

### 2. 获取未读消息数量

🔐 **需要登录**

```http
GET /api/messages/unread-count
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "total": 10,
    "follow": 2,
    "like": 3,
    "comment": 2,
    "reply": 1,
    "favorite": 1,
    "mention": 0,
    "system": 1,
    "private": 0
  }
}
```

---

### 3. 获取消息详情

🔐 **需要登录**

```http
GET /api/messages/:id
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 消息 ID |

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 700 | 消息不存在 |

---

### 4. 标记消息为已读

🔐 **需要登录**

```http
PUT /api/messages/:id/read
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 消息 ID |

---

### 5. 批量标记消息为已读

🔐 **需要登录**

```http
PUT /api/messages/read/multiple
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | array | 条件必填 | 消息 ID 数组 |
| type | string | 条件必填 | 消息类型 (标记该类型所有消息) |

> `ids` 和 `type` 至少提供一个

#### 请求示例

```json
{
  "type": "like"
}
```

或

```json
{
  "ids": ["msg-uuid-1", "msg-uuid-2"]
}
```

---

### 6. 标记所有消息为已读

🔐 **需要登录**

```http
PUT /api/messages/read/all
```

---

### 7. 删除消息

🔐 **需要登录**

```http
DELETE /api/messages/:id
```

---

### 8. 批量删除消息

🔐 **需要登录**

```http
DELETE /api/messages/multiple
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | array | 是 | 消息 ID 数组 |

---

## 私信 API

**Base URL**: `/api/private-messages`

> 所有私信接口都需要登录

### 1. 发送私信

🔐 **需要登录**

```http
POST /api/private-messages
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| receiverId | string | 是 | 接收者 ID (UUID) |
| content | string | 是 | 消息内容 (1-2000字符) |

#### 请求示例

```json
{
  "receiverId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "你好，想请教一个问题"
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "发送成功",
  "data": {
    "id": "message-uuid",
    "content": "你好，想请教一个问题",
    "sender_id": "sender-uuid",
    "receiver_id": "receiver-uuid",
    "is_read": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 100 | 参数错误 |
| 200 | 用户不存在 |
| 703 | 私信功能已关闭 |
| 704 | 对方已关闭私信功能 |

---

### 2. 获取会话列表

🔐 **需要登录**

```http
GET /api/private-messages
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 (默认 1) |
| pageSize | number | 否 | 每页数量 (默认 50，最大 200) |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "list": [
      {
        "user": {
          "id": "user-uuid",
          "nickname": "张三",
          "avatar": "/uploads/avatars/xxx.png"
        },
        "lastMessage": {
          "id": "message-uuid",
          "content": "最后一条消息内容",
          "created_at": "2024-01-01T00:00:00.000Z"
        },
        "unreadCount": 3
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "total": 10
    }
  }
}
```

---

### 3. 获取私信功能状态

🔐 **需要登录**

```http
GET /api/private-messages/status
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "globalEnabled": true,
    "userEnabled": true
  }
}
```

---

### 4. 获取与指定用户的私信记录

🔐 **需要登录**

```http
GET /api/private-messages/conversation/:userId
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| userId | string | 对方用户 ID (UUID) |

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "list": [
      {
        "id": "message-uuid",
        "content": "消息内容",
        "sender_id": "sender-uuid",
        "receiver_id": "receiver-uuid",
        "is_read": true,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "total": 100
    },
    "user": {
      "id": "user-uuid",
      "nickname": "张三",
      "avatar": "/uploads/avatars/xxx.png"
    }
  }
}
```

---

### 5. 标记对话为已读

🔐 **需要登录**

```http
PUT /api/private-messages/conversation/:userId/read
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| userId | string | 对方用户 ID |

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "标记成功",
  "data": {
    "markedCount": 5
  }
}
```
