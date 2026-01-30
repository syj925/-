# 校园墙后端服务架构文档

## 项目概述

校园墙后端服务基于 Node.js + Express，采用分层架构模式，支持高并发访问。

### 技术栈

| 类别 | 技术 |
|------|------|
| 运行环境 | Node.js 18+ |
| Web 框架 | Express.js |
| 数据库 | MySQL 8.0 |
| ORM | Sequelize |
| 缓存 | Redis |
| 实时通信 | Socket.io |
| 进程管理 | PM2 (集群模式) |
| 认证 | JWT |
| 日志 | Winston |
| 测试 | Jest |

---

## 服务架构

```
请求 → 路由层 → 控制器层 → 服务层 → 数据访问层 → 模型层
                ↓
            中间件层 (认证、日志、限流)
```

| 层级 | 职责 |
|------|------|
| Routes | API 路由定义和请求分发 |
| Controllers | 处理 HTTP 请求，调用服务层 |
| Services | 业务逻辑实现 |
| Repositories | 数据库操作封装 |
| Models | Sequelize 数据模型定义 |
| Middlewares | 认证、错误处理、日志、限流 |

---

## 目录结构

```
server/
├── config/                   # 配置文件
│   ├── database.js           # 数据库配置
│   ├── redis.js              # Redis 配置
│   └── logger.js             # 日志配置
├── src/
│   ├── routes/               # 路由定义
│   ├── controllers/          # 控制器
│   ├── services/             # 服务层
│   ├── repositories/         # 数据访问层
│   ├── models/               # 数据模型
│   ├── middlewares/          # 中间件
│   ├── utils/                # 工具函数
│   ├── constants/            # 常量定义
│   ├── websockets/           # WebSocket 处理
│   └── app.js                # 应用入口
├── docs/api/                 # API 文档
├── uploads/                  # 上传文件
├── logs/                     # 日志文件
├── test/                     # 测试文件
├── .env                      # 环境变量
├── ecosystem.config.js       # PM2 配置
└── package.json
```

---

## 核心数据表

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| users | 用户 | id, username, password, phone, avatar, role |
| posts | 帖子 | id, title, content, user_id, category_id, status |
| comments | 评论 | id, content, user_id, post_id, reply_to |
| likes | 点赞 | id, user_id, target_id, target_type |
| favorites | 收藏 | id, user_id, post_id |
| follows | 关注 | id, follower_id, followed_id |
| messages | 消息 | id, type, sender_id, receiver_id, is_read |
| topics | 话题 | id, name, post_count, is_hot |
| categories | 分类 | id, name, icon, sort |

---

## 性能优化策略

### 缓存策略
- 热点数据缓存 (分类、热门话题)
- 计数器缓存 (点赞数、评论数)
- 未读消息数实时更新

### 数据库优化
- 复合索引优化查询
- 连接池管理
- 避免 N+1 查询

### 系统优化
- PM2 集群模式 (多核利用)
- gzip 响应压缩
- API 限流保护

---

## 部署配置

### PM2 配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: "campus-wall-api",
    script: "./src/server.js",
    instances: "max",
    exec_mode: "cluster",
    env_production: {
      NODE_ENV: "production"
    }
  }]
};
```

### 环境变量

```env
NODE_ENV=production
PORT=3000

# 数据库
DB_HOST=localhost
DB_NAME=campus_community
DB_USERNAME=root
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

---

## API 文档

完整 API 文档请查看 `docs/api/` 目录：

- **用户端 API**: 00-overview.md ~ 16-settings.md
- **管理端 API**: 20-admin-auth.md ~ 23-admin-system.md
