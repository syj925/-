# 校园墙表情系统 - API接口文档

> 版本: v1.0  
> 更新日期: 2026-01-21  
> 基础路径: `/api`

---

## 一、接口总览

### 1.1 客户端接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /emojis/init | 初始化（版本检查+更新） | 可选 |
| GET | /emojis/packs | 获取表情包列表 | 可选 |
| GET | /emojis/packs/:id | 获取表情包详情 | 可选 |
| GET | /emojis/search | 搜索表情 | 可选 |
| GET | /emojis/hot | 热门表情 | 可选 |
| POST | /emojis/use | 记录使用 | 必须 |

### 1.2 用户操作接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /emojis/recent | 最近使用 | 必须 |
| GET | /emojis/favorites | 收藏列表 | 必须 |
| POST | /emojis/favorites | 添加收藏 | 必须 |
| DELETE | /emojis/favorites/:emoji_id | 取消收藏 | 必须 |
| GET | /emojis/my-packs | 我的表情包 | 必须 |
| POST | /emojis/packs/:id/add | 添加表情包 | 必须 |
| DELETE | /emojis/packs/:id/remove | 移除表情包 | 必须 |

### 1.3 自定义表情接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /emojis/custom | 上传自定义表情 | 必须 |
| GET | /emojis/custom/my | 我的上传记录 | 必须 |
| DELETE | /emojis/custom/:id | 删除上传 | 必须 |

### 1.4 商店接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /emojis/store | 商店列表 | 可选 |
| GET | /emojis/store/featured | 精选推荐 | 可选 |
| POST | /emojis/store/:id/download | 下载表情包 | 必须 |

### 1.5 管理后台接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /admin/emojis/packs | 表情包列表 | Admin |
| POST | /admin/emojis/packs | 创建表情包 | Admin |
| PUT | /admin/emojis/packs/:id | 编辑表情包 | Admin |
| DELETE | /admin/emojis/packs/:id | 删除表情包 | Admin |
| POST | /admin/emojis | 添加表情 | Admin |
| PUT | /admin/emojis/:id | 编辑表情 | Admin |
| DELETE | /admin/emojis/:id | 删除表情 | Admin |
| POST | /admin/emojis/batch-upload | 批量上传 | Admin |
| GET | /admin/emojis/pending | 待审核列表 | Admin |
| POST | /admin/emojis/:id/review | 审核表情 | Admin |
| POST | /admin/emojis/publish-version | 发布版本 | Admin |

---

## 二、通用响应格式

### 2.1 成功响应

```json
{
  "code": 0,
  "success": true,
  "msg": "操作成功",
  "data": { }
}
```

### 2.2 错误响应

```json
{
  "code": 400,
  "success": false,
  "msg": "错误信息",
  "error": "ERROR_CODE"
}
```

### 2.3 分页响应

```json
{
  "code": 0,
  "success": true,
  "data": {
    "list": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100
    }
  }
}
```

---

## 三、客户端接口详情

### 3.1 初始化表情系统

**请求**
```
GET /api/emojis/init
```

**参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| client_version | int | 否 | 客户端当前版本，默认0 |

**响应**
```json
{
  "code": 0,
  "success": true,
  "data": {
    "current_version": 8,
    "need_update": true,
    "update_type": "incremental",
    "changes": [
      {
        "version": 6,
        "type": "add",
        "pack_id": "uuid-xxx",
        "pack_name": "新表情包",
        "emojis": [
          {
            "id": "emoji-uuid",
            "code": "[新表情]",
            "name": "新表情",
            "url": "/uploads/emojis/items/xxx/new.png",
            "type": "static"
          }
        ]
      }
    ],
    "packs": null
  }
}
```

**update_type 说明**
| 值 | 说明 |
|------|------|
| none | 无需更新 |
| incremental | 增量更新，解析changes数组 |
| full | 全量更新，解析packs数组 |

---

### 3.2 获取表情包列表

**请求**
```
GET /api/emojis/packs
```

**参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 类型筛选: system/official/user/store |
| include_emojis | boolean | 否 | 是否包含表情列表，默认true |

**响应**
```json
{
  "code": 0,
  "success": true,
  "data": {
    "version": 8,
    "packs": [
      {
        "id": "pack-uuid",
        "name": "经典表情",
        "description": "常用表情包",
        "cover_url": "/uploads/emojis/packs/xxx/cover.png",
        "type": "official",
        "emoji_count": 30,
        "emojis": [
          {
            "id": "emoji-uuid",
            "code": "[doge]",
            "name": "doge",
            "url": "/uploads/emojis/items/xxx/doge.png",
            "type": "static"
          }
        ]
      }
    ]
  }
}
```

---

### 3.3 获取表情包详情

**请求**
```
GET /api/emojis/packs/:id
```

**响应**
```json
{
  "code": 0,
  "success": true,
  "data": {
    "id": "pack-uuid",
    "name": "经典表情",
    "description": "常用表情包",
    "cover_url": "/uploads/emojis/packs/xxx/cover.png",
    "type": "official",
    "author": {
      "id": "user-uuid",
      "nickname": "管理员"
    },
    "download_count": 1234,
    "emojis": [
      {
        "id": "emoji-uuid",
        "code": "[doge]",
        "name": "doge",
        "keywords": "狗,滑稽,doge",
        "url": "/uploads/emojis/items/xxx/doge.png",
        "type": "static",
        "use_count": 5678
      }
    ]
  }
}
```

---

### 3.4 搜索表情

**请求**
```
GET /api/emojis/search
```

**参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 搜索关键字 |
| limit | int | 否 | 返回数量，默认20，最大50 |

**响应**
```json
{
  "code": 0,
  "success": true,
  "data": {
    "keyword": "笑",
    "list": [
      {
        "id": "emoji-uuid",
        "code": "[笑哭]",
        "name": "笑哭",
        "url": "/uploads/emojis/items/xxx/laugh_cry.png",
        "type": "static",
        "pack": {
          "id": "pack-uuid",
          "name": "经典表情"
        }
      }
    ],
    "total": 15
  }
}
```

---

### 3.5 热门表情

**请求**
```
GET /api/emojis/hot
```

**参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | int | 否 | 返回数量，默认30 |

**响应**
```json
{
  "code": 0,
  "success": true,
  "data": {
    "list": [
      {
        "id": "emoji-uuid",
        "code": "[doge]",
        "name": "doge",
        "url": "/uploads/emojis/items/xxx/doge.png",
        "type": "static",
        "use_count": 12345
      }
    ]
  }
}
```

---

### 3.6 记录使用

**请求**
```
POST /api/emojis/use
```

**请求体**
```json
{
  "emoji_id": "emoji-uuid"
}
```

**响应**
```json
{
  "code": 0,
  "success": true,
  "msg": "已记录"
}
```

---

## 四、用户操作接口详情

### 4.1 最近使用

**请求**
```
GET /api/emojis/recent
```

**响应**
```json
{
  "code": 0,
  "success": true,
  "data": {
    "list": [
      {
        "id": "emoji-uuid",
        "code": "[doge]",
        "name": "doge",
        "url": "/uploads/emojis/items/xxx/doge.png",
        "type": "static",
        "last_used_at": "2026-01-21T10:00:00Z"
      }
    ]
  }
}
```

---

### 4.2 收藏列表

**请求**
```
GET /api/emojis/favorites
```

**响应**
```json
{
  "code": 0,
  "success": true,
  "data": {
    "list": [
      {
        "id": "favorite-uuid",
        "emoji": {
          "id": "emoji-uuid",
          "code": "[doge]",
          "name": "doge",
          "url": "/uploads/emojis/items/xxx/doge.png"
        },
        "created_at": "2026-01-20T10:00:00Z"
      }
    ]
  }
}
```

---

### 4.3 添加收藏

**请求**
```
POST /api/emojis/favorites
```

**请求体**
```json
{
  "emoji_id": "emoji-uuid"
}
```

**响应**
```json
{
  "code": 0,
  "success": true,
  "msg": "收藏成功",
  "data": {
    "id": "favorite-uuid"
  }
}
```

---

### 4.4 取消收藏

**请求**
```
DELETE /api/emojis/favorites/:emoji_id
```

**响应**
```json
{
  "code": 0,
  "success": true,
  "msg": "已取消收藏"
}
```

---

### 4.5 我的表情包

**请求**
```
GET /api/emojis/my-packs
```

**响应**
```json
{
  "code": 0,
  "success": true,
  "data": {
    "list": [
      {
        "id": "pack-uuid",
        "name": "经典表情",
        "cover_url": "/uploads/emojis/packs/xxx/cover.png",
        "source": "download",
        "sort_order": 0,
        "emoji_count": 30
      }
    ]
  }
}
```

---

### 4.6 添加表情包

**请求**
```
POST /api/emojis/packs/:id/add
```

**响应**
```json
{
  "code": 0,
  "success": true,
  "msg": "添加成功"
}
```

---

### 4.7 移除表情包

**请求**
```
DELETE /api/emojis/packs/:id/remove
```

**响应**
```json
{
  "code": 0,
  "success": true,
  "msg": "已移除"
}
```

---

## 五、自定义表情接口详情

### 5.1 上传自定义表情

**请求**
```
POST /api/emojis/custom
Content-Type: multipart/form-data
```

**请求体**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 表情名称 |
| file | File | 是 | 表情图片文件 |

**响应**
```json
{
  "code": 0,
  "success": true,
  "msg": "表情已提交，等待审核",
  "data": {
    "id": "custom-emoji-uuid",
    "name": "我的表情",
    "url": "/uploads/emojis/custom/user-uuid/xxx.gif",
    "type": "animated",
    "status": "pending"
  }
}
```

**错误码**
| 错误码 | 说明 |
|--------|------|
| EMOJI_UPLOAD_LIMIT | 每日上传已达上限 |
| EMOJI_FILE_TOO_LARGE | 文件过大 |
| EMOJI_INVALID_TYPE | 不支持的文件类型 |

---

### 5.2 我的上传记录

**请求**
```
GET /api/emojis/custom/my
```

**参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | pending/approved/rejected |
| page | int | 否 | 页码 |
| limit | int | 否 | 每页数量 |

**响应**
```json
{
  "code": 0,
  "success": true,
  "data": {
    "list": [
      {
        "id": "custom-uuid",
        "name": "我的表情",
        "url": "/uploads/emojis/custom/xxx.gif",
        "type": "animated",
        "status": "approved",
        "emoji_id": "emoji-uuid",
        "emoji_code": "[用户名_我的表情]",
        "reviewed_at": "2026-01-21T12:00:00Z"
      },
      {
        "id": "custom-uuid-2",
        "name": "另一个表情",
        "url": "/uploads/emojis/custom/yyy.png",
        "type": "static",
        "status": "rejected",
        "reject_reason": "内容不适合",
        "reviewed_at": "2026-01-21T11:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 5
    }
  }
}
```

---

### 5.3 删除上传

**请求**
```
DELETE /api/emojis/custom/:id
```

**说明**: 仅能删除待审核状态的表情

**响应**
```json
{
  "code": 0,
  "success": true,
  "msg": "已删除"
}
```

---

## 六、商店接口详情

### 6.1 商店列表

**请求**
```
GET /api/emojis/store
```

**参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| limit | int | 否 | 每页数量 |
| sort | string | 否 | hot/new/price |

**响应**
```json
{
  "code": 0,
  "success": true,
  "data": {
    "list": [
      {
        "id": "pack-uuid",
        "name": "可爱动物",
        "description": "超萌动物表情包",
        "cover_url": "/uploads/emojis/packs/xxx/cover.png",
        "author": {
          "id": "user-uuid",
          "nickname": "创作者"
        },
        "price": 0.00,
        "is_free": true,
        "download_count": 5678,
        "emoji_count": 20,
        "preview_emojis": [
          { "url": "/uploads/emojis/items/xxx/1.png" },
          { "url": "/uploads/emojis/items/xxx/2.png" },
          { "url": "/uploads/emojis/items/xxx/3.png" }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50
    }
  }
}
```

---

### 6.2 精选推荐

**请求**
```
GET /api/emojis/store/featured
```

**响应**
```json
{
  "code": 0,
  "success": true,
  "data": {
    "list": [
      {
        "id": "pack-uuid",
        "name": "热门精选",
        "cover_url": "/uploads/emojis/packs/xxx/cover.png",
        "download_count": 10000
      }
    ]
  }
}
```

---

### 6.3 下载表情包

**请求**
```
POST /api/emojis/store/:id/download
```

**响应**
```json
{
  "code": 0,
  "success": true,
  "msg": "添加成功",
  "data": {
    "pack": {
      "id": "pack-uuid",
      "name": "可爱动物",
      "emojis": [ ]
    }
  }
}
```

---

## 七、管理后台接口详情

### 7.1 表情包管理列表

**请求**
```
GET /api/admin/emojis/packs
```

**参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 类型筛选 |
| status | string | 否 | 状态筛选 |
| keyword | string | 否 | 名称搜索 |
| page | int | 否 | 页码 |
| limit | int | 否 | 每页数量 |

**响应**
```json
{
  "code": 0,
  "success": true,
  "data": {
    "list": [
      {
        "id": "pack-uuid",
        "name": "经典表情",
        "type": "official",
        "status": "active",
        "emoji_count": 30,
        "download_count": 5678,
        "version": 3,
        "created_at": "2026-01-01T00:00:00Z"
      }
    ],
    "pagination": { }
  }
}
```

---

### 7.2 创建表情包

**请求**
```
POST /api/admin/emojis/packs
Content-Type: multipart/form-data
```

**请求体**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 名称 |
| description | string | 否 | 描述 |
| type | string | 是 | system/official/store |
| cover | File | 否 | 封面图 |
| price | number | 否 | 价格 |
| is_featured | boolean | 否 | 是否精选 |
| status | string | 否 | active/inactive |

**响应**
```json
{
  "code": 0,
  "success": true,
  "msg": "创建成功",
  "data": {
    "id": "pack-uuid",
    "name": "新表情包"
  }
}
```

---

### 7.3 编辑表情包

**请求**
```
PUT /api/admin/emojis/packs/:id
Content-Type: multipart/form-data
```

**请求体**: 同创建

**响应**
```json
{
  "code": 0,
  "success": true,
  "msg": "更新成功"
}
```

---

### 7.4 删除表情包

**请求**
```
DELETE /api/admin/emojis/packs/:id
```

**响应**
```json
{
  "code": 0,
  "success": true,
  "msg": "删除成功"
}
```

---

### 7.5 添加表情

**请求**
```
POST /api/admin/emojis
Content-Type: multipart/form-data
```

**请求体**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pack_id | string | 是 | 所属表情包ID |
| code | string | 是 | 表情代码，格式[xxx] |
| name | string | 是 | 表情名称 |
| keywords | string | 否 | 关键字，逗号分隔 |
| file | File | 是 | 表情图片 |
| sort_order | number | 否 | 排序 |

**响应**
```json
{
  "code": 0,
  "success": true,
  "msg": "添加成功",
  "data": {
    "id": "emoji-uuid",
    "code": "[新表情]"
  }
}
```

---

### 7.6 批量上传表情

**请求**
```
POST /api/admin/emojis/batch-upload
Content-Type: multipart/form-data
```

**请求体**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pack_id | string | 是 | 所属表情包ID |
| files | File[] | 是 | 表情图片数组 |
| auto_code | boolean | 否 | 自动生成代码 |

**响应**
```json
{
  "code": 0,
  "success": true,
  "msg": "上传成功",
  "data": {
    "success_count": 10,
    "fail_count": 0,
    "emojis": [ ]
  }
}
```

---

### 7.7 待审核列表

**请求**
```
GET /api/admin/emojis/pending
```

**参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| limit | int | 否 | 每页数量 |

**响应**
```json
{
  "code": 0,
  "success": true,
  "data": {
    "list": [
      {
        "id": "custom-uuid",
        "name": "用户表情",
        "url": "/uploads/emojis/custom/xxx.gif",
        "type": "animated",
        "file_size": 102400,
        "uploader": {
          "id": "user-uuid",
          "nickname": "用户昵称",
          "avatar": "/uploads/avatars/xxx.png"
        },
        "created_at": "2026-01-21T10:00:00Z"
      }
    ],
    "pagination": { },
    "stats": {
      "pending_count": 15,
      "today_reviewed": 8
    }
  }
}
```

---

### 7.8 审核表情

**请求**
```
POST /api/admin/emojis/:id/review
```

**请求体**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | approve/reject |
| reason | string | 条件 | 拒绝时必填 |
| code | string | 条件 | 通过时指定代码 |
| pack_id | string | 条件 | 通过时指定表情包 |

**响应（通过）**
```json
{
  "code": 0,
  "success": true,
  "msg": "审核通过",
  "data": {
    "custom_emoji_id": "custom-uuid",
    "emoji_id": "emoji-uuid",
    "emoji_code": "[用户名_表情名]",
    "status": "approved"
  }
}
```

**响应（拒绝）**
```json
{
  "code": 0,
  "success": true,
  "msg": "已拒绝",
  "data": {
    "custom_emoji_id": "custom-uuid",
    "status": "rejected",
    "reason": "内容不适合"
  }
}
```

---

### 7.9 发布版本

**请求**
```
POST /api/admin/emojis/publish-version
```

**请求体**
```json
{
  "description": "新增10个表情"
}
```

**响应**
```json
{
  "code": 0,
  "success": true,
  "msg": "版本已发布",
  "data": {
    "version": 9,
    "published_at": "2026-01-21T12:00:00Z"
  }
}
```

---

## 八、错误码定义

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| EMOJI_PACK_NOT_FOUND | 404 | 表情包不存在 |
| EMOJI_NOT_FOUND | 404 | 表情不存在 |
| EMOJI_CODE_EXISTS | 400 | 表情代码已存在 |
| EMOJI_UPLOAD_LIMIT | 429 | 每日上传已达上限 |
| EMOJI_FILE_TOO_LARGE | 400 | 文件过大 |
| EMOJI_INVALID_TYPE | 400 | 不支持的文件类型 |
| EMOJI_INVALID_CODE | 400 | 表情代码格式错误 |
| EMOJI_ALREADY_FAVORITE | 400 | 已收藏该表情 |
| EMOJI_ALREADY_OWNED | 400 | 已拥有该表情包 |
| EMOJI_PENDING_DELETE | 400 | 仅能删除待审核的表情 |
| EMOJI_REVIEW_INVALID | 400 | 无效的审核操作 |

---

## 九、WebSocket事件

### 9.1 表情版本更新通知

**事件**: `emoji_version_update`

**数据**
```json
{
  "type": "emoji_version_update",
  "version": 9,
  "change_count": 10,
  "timestamp": 1737453600000
}
```

**说明**: 管理员发布新版本后，通过WebSocket通知在线客户端

---

## 附录

### A. 表情对象结构

```typescript
interface Emoji {
  id: string;
  code: string;        // [表情名]
  name: string;
  keywords?: string;   // 逗号分隔
  url: string;
  thumbnail_url?: string;
  type: 'static' | 'animated';
  width?: number;
  height?: number;
  use_count?: number;
}

interface EmojiPack {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  type: 'system' | 'official' | 'user' | 'store';
  author?: User;
  price?: number;
  is_featured?: boolean;
  download_count?: number;
  emoji_count?: number;
  emojis?: Emoji[];
  version?: number;
}
```

### B. 认证说明

- 认证头: `Authorization: Bearer {token}`
- 可选认证: 未登录可访问公开数据，登录后可获取个人数据
- 必须认证: 涉及个人操作的接口
- Admin权限: 需要管理员角色
