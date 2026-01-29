# 校园墙表情系统 - 设计文档

> 版本: v1.0  
> 更新日期: 2026-01-21  
> 作者: AI Assistant

---

## 一、系统概述

### 1.1 项目背景

校园墙平台需要一个完整的表情系统，支持用户在评论、帖子、私信中使用表情，提升用户互动体验。

### 1.2 功能目标

| 功能 | 描述 |
|------|------|
| Unicode表情 | 保留现有系统字体表情 |
| 官方图片表情 | 后台可配置的自定义图片表情 |
| 用户自定义表情 | 用户上传，审核通过后全站可用 |
| 表情搜索 | 支持关键字搜索表情 |
| 表情收藏 | 用户可收藏常用表情 |
| 表情商店 | 未来扩展，支持表情包下载/购买 |
| GIF动图 | 支持动态表情 |

### 1.3 设计原则

1. **扩展性**: 预留商店、付费等扩展接口
2. **性能优先**: 多级缓存，增量更新
3. **安全审核**: 用户上传必须审核
4. **兼容降级**: 表情代码可读，无图片时降级显示文字

---

## 二、系统架构

### 2.1 整体架构图

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           表情系统架构                                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         表情类型层                                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │ Unicode表情  │  │ 官方图片表情 │  │ 用户自定义   │              │  │
│  │  │ (现有保留)   │  │ (后台配置)   │  │ (审核机制)   │              │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         表情包层                                     │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │ 系统表情包   │  │ 用户收藏包   │  │ 商店表情包   │              │  │
│  │  │ (内置/免费)  │  │ (个人收藏)   │  │ (付费/下载)  │              │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│         ┌──────────────────────────┼──────────────────────────┐           │
│         ▼                          ▼                          ▼           │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐       │
│  │   客户端    │          │   服务端    │          │  管理后台   │       │
│  │ ┌─────────┐ │          │ ┌─────────┐ │          │ ┌─────────┐ │       │
│  │ │本地缓存 │ │◄────────►│ │Redis缓存│ │◄────────►│ │表情管理 │ │       │
│  │ │版本对比 │ │          │ │表情索引 │ │          │ │审核系统 │ │       │
│  │ │增量更新 │ │          │ │搜索服务 │ │          │ │商店配置 │ │       │
│  │ └─────────┘ │          │ └─────────┘ │          │ └─────────┘ │       │
│  └─────────────┘          └─────────────┘          └─────────────┘       │
│                                    │                                       │
│                                    ▼                                       │
│                           ┌─────────────┐                                  │
│                           │   MySQL     │                                  │
│                           │  持久存储   │                                  │
│                           └─────────────┘                                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 技术选型

| 组件 | 技术方案 | 说明 |
|------|----------|------|
| 后端框架 | Node.js + Express | 现有技术栈 |
| 数据库 | MySQL + Sequelize | 表情元数据存储 |
| 缓存 | Redis | 表情映射表、版本控制 |
| 文件存储 | 本地 + 可扩展CDN | 表情图片存储 |
| 前端框架 | Vue 3 + uni-app | 现有技术栈 |
| 状态管理 | Pinia | 表情状态管理 |

---

## 三、数据库设计

### 3.1 ER关系图

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  emoji_packs    │       │     emojis      │       │     users       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │       │ id (PK)         │
│ name            │  │    │ pack_id (FK)    │───────│                 │
│ type            │  └───►│ code            │       │                 │
│ cover_url       │       │ name            │       └────────┬────────┘
│ author_id (FK)  │───────│ keywords        │                │
│ price           │       │ url             │                │
│ status          │       │ type            │                │
│ version         │       │ status          │                │
└─────────────────┘       └────────┬────────┘                │
                                   │                         │
        ┌──────────────────────────┼─────────────────────────┤
        │                          │                         │
        ▼                          ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│user_emoji_packs │       │ emoji_favorites │       │user_custom_emojis│
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │       │ user_id (FK)    │       │ user_id (FK)    │
│ pack_id (FK)    │       │ emoji_id (FK)   │       │ name            │
│ source          │       │ created_at      │       │ url             │
│ created_at      │       └─────────────────┘       │ status          │
└─────────────────┘                                 │ reviewer_id     │
                                                    └─────────────────┘
```

### 3.2 表结构详细设计

#### 3.2.1 表情包表 (emoji_packs)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | CHAR(36) | PK | UUID主键 |
| name | VARCHAR(50) | NOT NULL | 表情包名称 |
| description | VARCHAR(200) | - | 描述 |
| cover_url | VARCHAR(500) | - | 封面图 |
| type | ENUM | NOT NULL | system/official/user/store |
| author_id | CHAR(36) | FK | 创建者ID |
| price | DECIMAL(10,2) | DEFAULT 0 | 价格 |
| is_featured | BOOLEAN | DEFAULT FALSE | 精选推荐 |
| download_count | INT | DEFAULT 0 | 下载次数 |
| status | ENUM | DEFAULT 'active' | active/inactive/pending/rejected |
| sort_order | INT | DEFAULT 0 | 排序 |
| version | INT | DEFAULT 1 | 版本号 |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |
| deleted_at | TIMESTAMP | - | 软删除时间 |

**索引设计**:
- `idx_type_status (type, status)` - 类型状态查询
- `idx_author (author_id)` - 作者查询
- `idx_featured (is_featured, sort_order)` - 精选排序

#### 3.2.2 表情表 (emojis)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | CHAR(36) | PK | UUID主键 |
| pack_id | CHAR(36) | FK, NOT NULL | 所属表情包 |
| code | VARCHAR(50) | UNIQUE | 表情代码 [doge] |
| name | VARCHAR(50) | NOT NULL | 表情名称 |
| keywords | VARCHAR(500) | - | 搜索关键字 |
| url | VARCHAR(500) | NOT NULL | 图片URL |
| thumbnail_url | VARCHAR(500) | - | 缩略图 |
| type | ENUM | DEFAULT 'static' | static/animated |
| width | INT | DEFAULT 100 | 宽度 |
| height | INT | DEFAULT 100 | 高度 |
| file_size | INT | - | 文件大小 |
| use_count | INT | DEFAULT 0 | 使用次数 |
| status | ENUM | DEFAULT 'active' | active/pending/rejected |
| sort_order | INT | DEFAULT 0 | 排序 |

**索引设计**:
- `uk_code (code)` - 唯一代码索引
- `idx_pack_status (pack_id, status, sort_order)` - 包内查询
- `ft_keywords (name, keywords)` - 全文搜索

#### 3.2.3 用户自定义表情表 (user_custom_emojis)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | CHAR(36) | PK | UUID主键 |
| user_id | CHAR(36) | FK, NOT NULL | 上传者 |
| name | VARCHAR(50) | NOT NULL | 名称 |
| url | VARCHAR(500) | NOT NULL | 图片URL |
| type | ENUM | DEFAULT 'static' | static/animated |
| file_size | INT | - | 文件大小 |
| status | ENUM | DEFAULT 'pending' | pending/approved/rejected |
| reject_reason | VARCHAR(200) | - | 拒绝原因 |
| reviewer_id | CHAR(36) | FK | 审核员 |
| reviewed_at | TIMESTAMP | - | 审核时间 |
| emoji_id | CHAR(36) | FK | 审核通过后的正式表情ID |

#### 3.2.4 其他关联表

**用户表情包关联表 (user_emoji_packs)**
- 记录用户拥有的表情包
- source: default/download/purchase/gift

**表情收藏表 (emoji_favorites)**
- 用户收藏的单个表情

**表情使用历史表 (emoji_usage_history)**
- 记录用户使用表情的频率
- 用于"最近使用"功能

**表情版本记录表 (emoji_versions)**
- 记录每次版本变更
- 用于客户端增量更新

---

## 四、缓存设计

### 4.1 缓存层级

```
┌─────────────────────────────────────────────────────────────┐
│                      缓存层级设计                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: 客户端缓存 (LocalStorage)                         │
│  ├── emoji_version    - 当前版本号                          │
│  ├── emoji_packs      - 表情包数据                          │
│  ├── emoji_map        - code→emoji 映射表                   │
│  └── emoji_recent     - 最近使用 (LRU, 30个)                │
│                                                             │
│  Layer 2: Redis缓存                                         │
│  ├── emoji:version    - 全局版本号                          │
│  ├── emoji:packs      - 表情包列表 (TTL: 30min)             │
│  ├── emoji:map        - 映射表 (TTL: 1hour)                 │
│  ├── emoji:search:*   - 搜索结果缓存 (TTL: 10min)           │
│  ├── emoji:recent:*   - 用户最近使用 (TTL: 24hour)          │
│  └── emoji:hot        - 热门表情 (TTL: 15min)               │
│                                                             │
│  Layer 3: MySQL持久存储                                      │
│  └── 所有表情数据                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 缓存更新策略

| 场景 | 策略 |
|------|------|
| 管理员添加/编辑表情 | 清除packs和map缓存，版本号+1 |
| 用户使用表情 | 更新recent缓存，异步更新use_count |
| 客户端启动 | 版本对比，增量/全量更新 |
| 搜索表情 | 先查缓存，miss后查库并缓存 |

### 4.3 版本控制机制

```
客户端启动
    │
    ▼
携带 client_version 请求 /api/emojis/init
    │
    ▼
服务端对比 current_version
    │
    ├── client_version == current_version
    │   └── 返回 update_type: "none"
    │
    ├── client_version < current_version (差距小)
    │   └── 返回 update_type: "incremental" + changes[]
    │
    └── client_version 太旧或为0
        └── 返回 update_type: "full" + 完整packs[]
```

---

## 五、文件存储设计

### 5.1 目录结构

```
uploads/
├── images/           # 现有图片目录
├── emojis/           # 表情专用目录
│   ├── packs/        # 表情包封面
│   │   └── {pack_id}/
│   │       └── cover.png
│   ├── items/        # 表情图片
│   │   └── {pack_id}/
│   │       ├── emoji1.png
│   │       └── emoji2.gif
│   └── custom/       # 用户上传待审核
│       └── {user_id}/
│           └── {timestamp}_{uuid}.gif
```

### 5.2 上传规范

| 属性 | 限制 |
|------|------|
| 文件类型 | PNG, GIF, WEBP |
| 静态图片大小 | ≤ 500KB |
| GIF动图大小 | ≤ 2MB |
| 图片尺寸 | 推荐 200x200，最大 500x500 |
| 文件名 | UUID + 原扩展名 |

### 5.3 CDN扩展

```javascript
// 配置示例
{
  "storage": {
    "type": "local",  // local | oss | cos
    "local": {
      "baseDir": "./uploads/emojis",
      "baseUrl": "/uploads/emojis"
    },
    "oss": {
      "bucket": "campus-wall-emojis",
      "region": "oss-cn-hangzhou",
      "baseUrl": "https://cdn.example.com/emojis"
    }
  }
}
```

---

## 六、安全设计

### 6.1 审核流程

```
用户上传表情
    │
    ▼
保存到 custom/{user_id}/ 目录
    │
    ▼
创建 user_custom_emojis 记录 (status: pending)
    │
    ▼
管理员在后台审核
    │
    ├── 拒绝
    │   ├── 更新 status: rejected
    │   ├── 记录 reject_reason
    │   └── 通知用户
    │
    └── 通过
        ├── 生成表情代码 [用户名_表情名]
        ├── 移动图片到 items/ 目录
        ├── 创建 emojis 记录
        ├── 更新 user_custom_emojis.emoji_id
        ├── 更新 status: approved
        ├── 版本号+1
        └── 清除缓存
```

### 6.2 安全措施

1. **文件校验**: 检查文件头，防止伪装
2. **大小限制**: 严格限制文件大小
3. **类型过滤**: 仅允许图片类型
4. **频率限制**: 每用户每天最多上传10个
5. **敏感内容检测**: 可接入第三方图片审核API

---

## 七、性能优化

### 7.1 前端优化

| 优化点 | 方案 |
|------|------|
| 首屏加载 | 仅加载第一个表情包 |
| 图片懒加载 | 可视区域内才加载 |
| 预编译正则 | 初始化时编译表情匹配正则 |
| 本地缓存 | LocalStorage存储表情数据 |
| 增量更新 | 仅下载变更的表情 |

### 7.2 后端优化

| 优化点 | 方案 |
|------|------|
| Redis缓存 | 表情映射表、搜索结果 |
| 数据库索引 | 全文索引支持搜索 |
| 批量操作 | 批量上传、批量审核 |
| 异步处理 | 使用次数异步更新 |
| 静态资源 | CDN加速 |

### 7.3 基准指标

| 指标 | 目标 |
|------|------|
| 表情包列表加载 | < 200ms |
| 单个表情图片 | < 100ms |
| 表情搜索响应 | < 300ms |
| 客户端初始化 | < 500ms |

---

## 八、扩展规划

### 8.1 表情商店 (Phase 2)

- 创作者入驻
- 表情包定价
- 收益分成
- 排行榜

### 8.2 表情互动 (Phase 3)

- 表情弹幕
- 表情投票
- 表情评分

### 8.3 AI功能 (Phase 4)

- 表情生成
- 表情推荐
- 敏感内容检测

---

## 九、文件清单

| 文件路径 | 说明 |
|----------|------|
| `server/src/models/emoji-pack.model.js` | 表情包模型 |
| `server/src/models/emoji.model.js` | 表情模型 |
| `server/src/models/user-custom-emoji.model.js` | 用户自定义表情模型 |
| `server/src/models/user-emoji-pack.model.js` | 用户表情包关联模型 |
| `server/src/models/emoji-favorite.model.js` | 表情收藏模型 |
| `server/src/services/emoji.service.js` | 表情服务 |
| `server/src/services/emoji-cache.service.js` | 表情缓存服务 |
| `server/src/controllers/emoji.controller.js` | 表情控制器 |
| `server/src/controllers/admin/emoji.controller.js` | 管理后台表情控制器 |
| `server/src/routes/emoji.routes.js` | 表情路由 |
| `server/src/routes/admin/emoji.routes.js` | 管理后台表情路由 |
| `server/src/utils/emoji-renderer.js` | 表情渲染工具 |
| `uni-APP/src/stores/emoji.js` | 前端表情Store |
| `uni-APP/src/components/emoji/EmojiPanel.vue` | 表情面板组件 |
| `uni-APP/src/components/emoji/EmojiText.vue` | 表情文本渲染组件 |
| `admin/src/views/emoji/EmojiManagement.vue` | 管理后台表情管理 |
| `admin/src/views/emoji/EmojiAudit.vue` | 管理后台表情审核 |

---

## 附录

### A. 表情代码规范

```
格式: [表情名]
示例: [doge] [笑哭] [666]
用户自定义: [用户名_表情名]
```

### B. 配置项

```javascript
// config/emoji.js
module.exports = {
  // 上传限制
  upload: {
    maxSize: 500 * 1024,      // 静态图片 500KB
    maxGifSize: 2 * 1024 * 1024, // GIF 2MB
    allowedTypes: ['image/png', 'image/gif', 'image/webp'],
    maxDimension: 500,
    dailyLimit: 10
  },
  
  // 缓存配置
  cache: {
    packsTTL: 30 * 60,
    mapTTL: 60 * 60,
    searchTTL: 10 * 60,
    recentLimit: 30
  },
  
  // 版本控制
  version: {
    incrementalThreshold: 10  // 超过10个版本差距则全量更新
  }
};
```
