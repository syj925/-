# 校园墙后端服务架构文档

## 目录
- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [服务架构](#服务架构)
- [目录结构](#目录结构)
- [数据库设计](#数据库设计)
- [API实现](#API实现)
- [性能优化](#性能优化)
- [部署方案](#部署方案)
- [开发规范](#开发规范)

## 项目概述

校园墙后端服务是为校园墙小程序提供API接口支持的服务端应用，使用Node.js开发，基于Express框架，采用MVC架构模式，支持高并发访问，并通过缓存、集群等技术手段提升系统性能和稳定性。

### 关键需求

- 支持2000+用户同时在线访问
- 高并发请求处理
- 响应时间控制在100ms以内
- 数据安全与隐私保护
- 可扩展性设计，支持未来功能扩展
- 多环境部署支持（开发、测试、生产）

## 技术栈

### 核心技术

- **运行环境**: Node.js 18+ (LTS版本)
- **Web框架**: Express.js
- **数据库**: MySQL 8.0
- **ORM框架**: Sequelize
- **缓存系统**: Redis
- **实时通信**: WebSocket (Socket.io)
- **进程管理**: PM2 (集群模式)
- **认证方式**: JWT (JSON Web Token)
- **API规范**: RESTful
- **文档工具**: Swagger/OpenAPI

### 辅助工具

- **日志系统**: Winston
- **任务调度**: node-schedule
- **验证框架**: Joi/Yup
- **安全防护**: Helmet
- **跨域处理**: CORS
- **文件存储**: 本地存储/云存储
- **请求处理**: Multer (文件上传)
- **测试框架**: Jest
- **代码质量**: ESLint, Prettier

## 服务架构

采用分层架构设计，将系统分为以下几层：

1. **路由层 (Routes)**: 负责API路由定义和请求分发
2. **控制器层 (Controllers)**: 处理HTTP请求，调用服务层方法
3. **服务层 (Services)**: 实现业务逻辑，调用数据访问层
4. **数据访问层 (DAL/Repositories)**: 与数据库交互，实现CRUD操作
5. **模型层 (Models)**: 定义数据模型和关系
6. **中间件层 (Middlewares)**: 实现通用功能，如认证、日志记录等
7. **工具层 (Utils)**: 提供通用工具函数和辅助方法
8. **WebSocket层 (WebSockets)**: 处理实时通信和消息推送

### WebSocket架构

WebSocket服务用于实现实时通信功能，包括：

1. **连接管理**: 处理客户端连接/断开，维护连接状态
2. **用户映射**: 维护用户ID与WebSocket连接的映射关系
3. **消息推送**: 实时推送消息、通知等
4. **在线状态**: 跟踪和广播用户在线状态变化
5. **断线重连**: 支持客户端断线重连机制

WebSocket实现主要通过Socket.io框架，结合Redis适配器实现集群环境下的广播和消息分发：

```javascript
// WebSocket服务架构
const socketService = {
  // 连接映射表
  connections: new Map(),
  
  // 初始化WebSocket服务
  initialize(server) {
    this.io = require('socket.io')(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    
    // 使用Redis适配器实现集群支持
    if (process.env.NODE_ENV === 'production') {
      const redisAdapter = require('socket.io-redis');
      this.io.adapter(redisAdapter({
        host: config.redis.host,
        port: config.redis.port
      }));
    }
    
    this.setupEventHandlers();
  },
  
  // 设置事件处理器
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // 认证处理
      socket.on('authenticate', (data) => this.handleAuthentication(socket, data));
      
      // 断开连接处理
      socket.on('disconnect', () => this.handleDisconnect(socket));
      
      // 其他事件处理
      // ...
    });
  },
  
  // 处理用户认证
  handleAuthentication(socket, data) {
    // 验证token
    // 关联用户ID和socket连接
    // 更新用户在线状态
  },
  
  // 处理断开连接
  handleDisconnect(socket) {
    // 清理连接映射
    // 更新用户在线状态
  },
  
  // 向特定用户发送消息
  sendToUser(userId, eventName, data) {
    const userSockets = this.connections.get(userId);
    if (userSockets && userSockets.length > 0) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit(eventName, data);
      });
      return true;
    }
    return false;
  },
  
  // 广播消息给所有连接的客户端
  broadcast(eventName, data, exceptUserId = null) {
    if (exceptUserId) {
      // 广播给除特定用户外的所有用户
      this.io.sockets.emit(eventName, data);
    } else {
      // 广播给所有用户
      this.io.emit(eventName, data);
    }
  }
};
```

### 高可用架构

为支持高并发访问，采用以下架构设计：

1. **负载均衡**: 通过PM2集群模式实现多进程负载均衡
2. **缓存策略**: 使用Redis缓存热点数据，减轻数据库压力
3. **数据库优化**: 合理设计表结构和索引，优化查询性能
4. **连接池管理**: 管理数据库连接池，避免连接泄漏
5. **异步处理**: 将耗时操作异步化，提升响应速度
6. **限流保护**: 实现API限流，防止恶意请求和DoS攻击
7. **WebSocket集群**: 使用Redis适配器实现WebSocket集群支持

## 目录结构

```
server/
├── config/                   # 配置文件
│   ├── database.js           # 数据库配置
│   ├── redis.js              # Redis配置
│   ├── jwt.js                # JWT配置
│   ├── logger.js             # 日志配置
│   ├── websocket.js          # WebSocket配置
│   └── index.js              # 配置聚合
├── src/                      # 源代码
│   ├── routes/               # 路由定义
│   │   ├── index.js          # 路由聚合
│   │   ├── user.routes.js    # 用户相关路由
│   │   ├── post.routes.js    # 帖子相关路由
│   │   ├── comment.routes.js # 评论相关路由
│   │   ├── follow.routes.js  # 关注相关路由
│   │   └── ...               # 其他路由
│   ├── controllers/          # 控制器
│   │   ├── user.controller.js    # 用户控制器
│   │   ├── post.controller.js    # 帖子控制器
│   │   ├── comment.controller.js # 评论控制器
│   │   ├── follow.controller.js  # 关注控制器
│   │   └── ...                   # 其他控制器
│   ├── services/             # 服务层
│   │   ├── user.service.js   # 用户服务
│   │   ├── post.service.js   # 帖子服务
│   │   ├── comment.service.js # 评论服务
│   │   ├── follow.service.js  # 关注服务
│   │   ├── websocket.service.js # WebSocket服务
│   │   └── ...               # 其他服务
│   ├── repositories/         # 数据访问层
│   │   ├── user.repository.js    # 用户数据访问
│   │   ├── post.repository.js    # 帖子数据访问
│   │   ├── comment.repository.js # 评论数据访问
│   │   ├── follow.repository.js  # 关注数据访问
│   │   └── ...                   # 其他数据访问
│   ├── models/               # 数据模型
│   │   ├── index.js          # 模型聚合
│   │   ├── user.model.js     # 用户模型
│   │   ├── post.model.js     # 帖子模型
│   │   ├── comment.model.js  # 评论模型
│   │   ├── follow.model.js   # 关注模型
│   │   └── ...               # 其他模型
│   ├── middlewares/          # 中间件
│   │   ├── auth.middleware.js  # 认证中间件
│   │   ├── error.middleware.js # 错误处理中间件
│   │   ├── logger.middleware.js # 日志中间件
│   │   ├── rate-limit.middleware.js # 限流中间件
│   │   └── ...                  # 其他中间件
│   ├── utils/                # 工具函数
│   │   ├── jwt.js            # JWT工具
│   │   ├── encryption.js     # 加密工具
│   │   ├── validators.js     # 数据验证工具
│   │   └── ...               # 其他工具
│   ├── constants/            # 常量定义
│   │   ├── error-codes.js    # 错误码定义
│   │   ├── status-codes.js   # 状态码定义
│   │   ├── websocket-events.js # WebSocket事件定义
│   │   └── ...               # 其他常量
│   ├── websockets/           # WebSocket处理
│   │   ├── index.js          # WebSocket入口
│   │   ├── handlers/         # 事件处理器
│   │   │   ├── auth.handler.js  # 认证处理
│   │   │   ├── message.handler.js # 消息处理
│   │   │   └── ...           # 其他处理器
│   │   └── middleware/       # WebSocket中间件
│   ├── app.js                # 应用入口
│   └── server.js             # 服务器启动
├── scripts/                  # 脚本文件
│   ├── init-db.js            # 数据库初始化
│   ├── seed-data.js          # 测试数据填充
│   └── ...                   # 其他脚本
├── logs/                     # 日志文件
├── uploads/                  # 上传文件存储
├── docs/                     # 文档
│   └── api-docs.json         # API文档
├── test/                     # 测试
│   ├── unit/                 # 单元测试
│   ├── integration/          # 集成测试
│   └── e2e/                  # 端到端测试
├── .env                      # 环境变量
├── .env.example              # 环境变量示例
├── .eslintrc.js              # ESLint配置
├── .prettierrc               # Prettier配置
├── package.json              # 项目依赖
├── ecosystem.config.js       # PM2配置
└── README.md                 # 项目说明
```

## 数据库设计

基于MySQL数据库，使用Sequelize作为ORM框架。

### 数据库连接配置

数据库名称应避免使用`campus_wall`，由于该名称已被其他项目使用。

```javascript
// config/database.js
module.exports = {
  development: {
    username: 'root',
    password: '20060711',
    database: 'campus_community',
    host: '127.0.0.1',
    dialect: 'mysql',
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    logging: console.log
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    pool: {
      max: 50,
      min: 10,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  }
};
```

### Redis配置

```javascript
// config/redis.js
module.exports = {
  development: {
    host: '192.168.159.130',
    port: 6379,
    password: '',
    db: 0
  },
  production: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB
  }
};
```

### 主要数据表设计

#### 用户表 (users)

| 字段名 | 类型 | 说明 | 索引 |
| ----- | ---- | ---- | ---- |
| id | VARCHAR(36) | 主键，UUID | PRIMARY |
| username | VARCHAR(50) | 用户名 | UNIQUE |
| password | VARCHAR(100) | 加密后的密码 | |
| phone | VARCHAR(20) | 手机号 | UNIQUE |
| email | VARCHAR(100) | 邮箱 | UNIQUE |
| avatar | VARCHAR(255) | 头像URL | |
| role | ENUM | 角色：student,teacher,admin | INDEX |
| gender | ENUM | 性别：male,female,other | |
| bio | TEXT | 个人简介 | |
| school | VARCHAR(100) | 学校 | INDEX |
| department | VARCHAR(100) | 院系 | |
| is_disabled | BOOLEAN | 是否禁用 | INDEX |
| created_at | DATETIME | 创建时间 | |
| updated_at | DATETIME | 更新时间 | |

#### 帖子表 (posts)

| 字段名 | 类型 | 说明 | 索引 |
| ----- | ---- | ---- | ---- |
| id | VARCHAR(36) | 主键，UUID | PRIMARY |
| title | VARCHAR(200) | 帖子标题 | |
| content | TEXT | 帖子内容 | |
| user_id | VARCHAR(36) | 作者ID，外键 | INDEX |
| category_id | INT | 分类ID，外键 | INDEX |
| status | ENUM | 状态：published,draft,deleted | INDEX |
| view_count | INT | 浏览量 | |
| like_count | INT | 点赞数 | |
| comment_count | INT | 评论数 | |
| favorite_count | INT | 收藏数 | |
| is_top | BOOLEAN | 是否置顶 | INDEX |
| location_name | VARCHAR(100) | 位置名称 | |
| longitude | DECIMAL(10,7) | 经度 | |
| latitude | DECIMAL(10,7) | 纬度 | |
| created_at | DATETIME | 创建时间 | INDEX |
| updated_at | DATETIME | 更新时间 | |

#### 帖子图片表 (post_images)

| 字段名 | 类型 | 说明 | 索引 |
| ----- | ---- | ---- | ---- |
| id | VARCHAR(36) | 主键，UUID | PRIMARY |
| post_id | VARCHAR(36) | 帖子ID，外键 | INDEX |
| url | VARCHAR(255) | 图片URL | |
| thumbnail_url | VARCHAR(255) | 缩略图URL | |
| width | INT | 图片宽度 | |
| height | INT | 图片高度 | |
| size | INT | 文件大小(字节) | |
| order | INT | 排序顺序 | |
| created_at | DATETIME | 创建时间 | |

#### 评论表 (comments)

| 字段名 | 类型 | 说明 | 索引 |
| ----- | ---- | ---- | ---- |
| id | VARCHAR(36) | 主键，UUID | PRIMARY |
| content | TEXT | 评论内容 | |
| user_id | VARCHAR(36) | 作者ID，外键 | INDEX |
| post_id | VARCHAR(36) | 帖子ID，外键 | INDEX |
| reply_to | VARCHAR(36) | 回复的评论ID，外键 | INDEX |
| like_count | INT | 点赞数 | |
| status | ENUM | 状态：normal,deleted | INDEX |
| created_at | DATETIME | 创建时间 | INDEX |
| updated_at | DATETIME | 更新时间 | |

#### 分类表 (categories)

| 字段名 | 类型 | 说明 | 索引 |
| ----- | ---- | ---- | ---- |
| id | INT | 主键，自增 | PRIMARY |
| name | VARCHAR(50) | 分类名称 | UNIQUE |
| icon | VARCHAR(255) | 图标URL | |
| sort | INT | 排序顺序 | |
| created_at | DATETIME | 创建时间 | |
| updated_at | DATETIME | 更新时间 | |

#### 话题表 (topics)

| 字段名 | 类型 | 说明 | 索引 |
| ----- | ---- | ---- | ---- |
| id | INT | 主键，自增 | PRIMARY |
| name | VARCHAR(50) | 话题名称 | UNIQUE |
| post_count | INT | 帖子数量 | |
| is_hot | BOOLEAN | 是否热门 | INDEX |
| created_at | DATETIME | 创建时间 | |
| updated_at | DATETIME | 更新时间 | |

#### 帖子-话题关联表 (post_topics)

| 字段名 | 类型 | 说明 | 索引 |
| ----- | ---- | ---- | ---- |
| post_id | VARCHAR(36) | 帖子ID，外键 | PRIMARY, INDEX |
| topic_id | INT | 话题ID，外键 | PRIMARY, INDEX |
| created_at | DATETIME | 创建时间 | |

#### 点赞表 (likes)

| 字段名 | 类型 | 说明 | 索引 |
| ----- | ---- | ---- | ---- |
| id | VARCHAR(36) | 主键，UUID | PRIMARY |
| user_id | VARCHAR(36) | 用户ID，外键 | INDEX |
| target_id | VARCHAR(36) | 目标ID | INDEX |
| target_type | ENUM | 目标类型：post,comment | INDEX |
| created_at | DATETIME | 创建时间 | |

#### 收藏表 (favorites)

| 字段名 | 类型 | 说明 | 索引 |
| ----- | ---- | ---- | ---- |
| id | VARCHAR(36) | 主键，UUID | PRIMARY |
| user_id | VARCHAR(36) | 用户ID，外键 | INDEX |
| post_id | VARCHAR(36) | 帖子ID，外键 | INDEX |
| created_at | DATETIME | 创建时间 | |

#### 消息表 (messages)

| 字段名 | 类型 | 说明 | 索引 |
| ----- | ---- | ---- | ---- |
| id | VARCHAR(36) | 主键，UUID | PRIMARY |
| type | ENUM | 类型：comment,like,system,follow | INDEX |
| title | VARCHAR(100) | 标题 | |
| content | TEXT | 内容 | |
| sender_id | VARCHAR(36) | 发送者ID，外键 | INDEX |
| receiver_id | VARCHAR(36) | 接收者ID，外键 | INDEX |
| post_id | VARCHAR(36) | 相关帖子ID，外键 | INDEX |
| comment_id | VARCHAR(36) | 相关评论ID，外键 | INDEX |
| is_read | BOOLEAN | 是否已读 | INDEX |
| created_at | DATETIME | 创建时间 | INDEX |
| updated_at | DATETIME | 更新时间 | |

#### 关注表 (follows)

| 字段名 | 类型 | 说明 | 索引 |
| ----- | ---- | ---- | ---- |
| id | VARCHAR(36) | 主键，UUID | PRIMARY |
| follower_id | VARCHAR(36) | 关注者ID，外键 | INDEX |
| followed_id | VARCHAR(36) | 被关注者ID，外键 | INDEX |
| created_at | DATETIME | 创建时间 | INDEX |
| updated_at | DATETIME | 更新时间 | |

### 索引优化

为提高查询性能，将创建以下复合索引：

1. 用户查询优化：
   ```sql
   CREATE INDEX idx_users_role_created ON users(role, created_at);
   CREATE INDEX idx_users_school_department ON users(school, department);
   ```

2. 帖子查询优化：
   ```sql
   CREATE INDEX idx_posts_category_status_created ON posts(category_id, status, created_at);
   CREATE INDEX idx_posts_user_status_created ON posts(user_id, status, created_at);
   ```

3. 评论查询优化：
   ```sql
   CREATE INDEX idx_comments_post_created ON comments(post_id, created_at);
   CREATE INDEX idx_comments_user_created ON comments(user_id, created_at);
   ```

4. 消息查询优化：
   ```sql
   CREATE INDEX idx_messages_receiver_type_read_created ON messages(receiver_id, type, is_read, created_at);
   ```

5. 点赞和收藏查询优化：
   ```sql
   CREATE UNIQUE INDEX idx_likes_user_target ON likes(user_id, target_id, target_type);
   CREATE UNIQUE INDEX idx_favorites_user_post ON favorites(user_id, post_id);
   ```

6. 关注关系查询优化：
   ```sql
   CREATE UNIQUE INDEX idx_follows_relation ON follows(follower_id, followed_id);
   CREATE INDEX idx_follows_follower ON follows(follower_id, created_at);
   CREATE INDEX idx_follows_followed ON follows(followed_id, created_at);
   ```

## API实现

### 核心模块设计

基于之前的API规范文档，将实现以下核心模块：

1. 用户模块
2. 帖子模块
3. 评论模块
4. 消息模块
5. 文件上传模块
6. 分类与话题模块
7. 搜索模块
8. 系统配置模块
9. 关注/粉丝模块
10. WebSocket实时通知模块

每个模块都会遵循以下实现方式：

1. **路由定义**: 设置API路径和HTTP方法
2. **参数验证**: 使用Joi/Yup验证请求数据
3. **权限控制**: 通过中间件进行身份验证和权限检查
4. **业务逻辑**: 在服务层实现核心业务逻辑
5. **数据访问**: 通过仓库模式访问数据库
6. **响应格式化**: 统一API响应格式
7. **错误处理**: 全局错误处理机制
8. **日志记录**: 请求和错误日志记录

### 关注/粉丝模块实现

关注/粉丝模块用于实现用户之间的关注关系，主要功能包括：

1. **关注用户**: 用户可以关注其他用户
2. **取消关注**: 用户可以取消关注其他用户
3. **获取关注列表**: 获取用户的关注列表
4. **获取粉丝列表**: 获取用户的粉丝列表
5. **关注状态检查**: 检查是否已关注某用户

实现示例：

```javascript
// follow.service.js
class FollowService {
  constructor(followRepository, userRepository) {
    this.followRepository = followRepository;
    this.userRepository = userRepository;
  }

  // 关注用户
  async followUser(followerId, followedId) {
    // 验证用户是否存在
    const follower = await this.userRepository.findById(followerId);
    const followed = await this.userRepository.findById(followedId);
    
    if (!follower || !followed) {
      throw new ApiError(404, '用户不存在');
    }
    
    // 检查是否自己关注自己
    if (followerId === followedId) {
      throw new ApiError(400, '不能关注自己');
    }
    
    // 检查是否已关注
    const existingFollow = await this.followRepository.findByFollowerAndFollowed(followerId, followedId);
    if (existingFollow) {
      throw new ApiError(400, '已经关注该用户');
    }
    
    // 创建关注关系
    const follow = await this.followRepository.create({
      followerId,
      followedId
    });
    
    // 发送关注通知
    await this.sendFollowNotification(followerId, followedId);
    
    return follow;
  }
  
  // 取消关注
  async unfollowUser(followerId, followedId) {
    // 验证关注关系是否存在
    const follow = await this.followRepository.findByFollowerAndFollowed(followerId, followedId);
    if (!follow) {
      throw new ApiError(404, '未关注该用户');
    }
    
    // 删除关注关系
    await this.followRepository.delete(follow.id);
    
    return { success: true };
  }
  
  // 获取用户关注列表
  async getFollowing(userId, page = 1, limit = 20) {
    // 分页获取关注列表
    const follows = await this.followRepository.findFollowingByUserId(userId, page, limit);
    
    // 获取被关注用户的详细信息
    const followingUsers = await Promise.all(
      follows.rows.map(async (follow) => {
        const user = await this.userRepository.findById(follow.followedId);
        return {
          ...user,
          followId: follow.id,
          followedAt: follow.createdAt
        };
      })
    );
    
    return {
      total: follows.count,
      page,
      limit,
      rows: followingUsers
    };
  }
  
  // 获取用户粉丝列表
  async getFollowers(userId, page = 1, limit = 20) {
    // 分页获取粉丝列表
    const followers = await this.followRepository.findFollowersByUserId(userId, page, limit);
    
    // 获取粉丝用户的详细信息
    const followerUsers = await Promise.all(
      followers.rows.map(async (follow) => {
        const user = await this.userRepository.findById(follow.followerId);
        return {
          ...user,
          followId: follow.id,
          followedAt: follow.createdAt
        };
      })
    );
    
    return {
      total: followers.count,
      page,
      limit,
      rows: followerUsers
    };
  }
  
  // 检查是否已关注
  async checkFollowStatus(followerId, followedId) {
    const follow = await this.followRepository.findByFollowerAndFollowed(followerId, followedId);
    return !!follow;
  }
  
  // 发送关注通知
  async sendFollowNotification(followerId, followedId) {
    // 创建通知消息
    const follower = await this.userRepository.findById(followerId);
    
    // 创建消息记录
    const message = {
      type: 'follow',
      title: '新的粉丝',
      content: `${follower.username} 关注了你`,
      senderId: followerId,
      receiverId: followedId,
      isRead: false
    };
    
    // 保存消息
    await messageRepository.create(message);
    
    // 通过WebSocket发送实时通知
    const socketService = require('../services/websocket.service');
    socketService.sendToUser(followedId, 'new_notification', {
      type: 'follow',
      sender: {
        id: followerId,
        username: follower.username,
        avatar: follower.avatar
      }
    });
  }
}
```

### WebSocket实时通知实现

WebSocket用于实现实时通知和消息推送，主要功能包括：

1. **实时消息推送**: 新消息、评论、点赞等实时推送
2. **在线状态管理**: 跟踪用户在线状态
3. **未读消息计数**: 实时更新未读消息数量
4. **通知事件**: 关注、点赞、评论等事件的实时通知

实现示例：

```javascript
// message.service.js (增强版)
class MessageService {
  constructor(messageRepository, redisClient) {
    this.messageRepository = messageRepository;
    this.redisClient = redisClient;
    this.socketService = require('./websocket.service');
  }
  
  // 创建新消息
  async createMessage(messageData) {
    // 保存消息到数据库
    const message = await this.messageRepository.create(messageData);
    
    // 更新未读消息计数
    await this.incrementUnreadCount(message.receiverId);
    
    // 发送实时通知
    this.sendRealTimeNotification(message);
    
    return message;
  }
  
  // 获取用户消息列表
  async getUserMessages(userId, page = 1, limit = 20, type = null) {
    const query = { receiverId: userId };
    
    if (type) {
      query.type = type;
    }
    
    const messages = await this.messageRepository.findAll(query, page, limit);
    
    return {
      total: messages.count,
      page,
      limit,
      rows: messages.rows
    };
  }
  
  // 标记消息为已读
  async markAsRead(messageId, userId) {
    const message = await this.messageRepository.findById(messageId);
    
    if (!message) {
      throw new ApiError(404, '消息不存在');
    }
    
    if (message.receiverId !== userId) {
      throw new ApiError(403, '无权操作此消息');
    }
    
    if (!message.isRead) {
      message.isRead = true;
      await this.messageRepository.update(messageId, { isRead: true });
      
      // 减少未读消息计数
      await this.decrementUnreadCount(userId);
    }
    
    return message;
  }
  
  // 标记所有消息为已读
  async markAllAsRead(userId, type = null) {
    const query = { 
      receiverId: userId,
      isRead: false
    };
    
    if (type) {
      query.type = type;
    }
    
    const unreadCount = await this.messageRepository.count(query);
    
    if (unreadCount > 0) {
      await this.messageRepository.updateMany(query, { isRead: true });
      
      // 重置未读消息计数
      await this.resetUnreadCount(userId, type);
    }
    
    return { markedCount: unreadCount };
  }
  
  // 获取未读消息数量
  async getUnreadCount(userId) {
    // 首先尝试从Redis获取
    const cacheKey = `unread_messages:${userId}`;
    let count = await this.redisClient.get(cacheKey);
    
    if (count === null) {
      // 缓存中没有，从数据库获取
      count = await this.messageRepository.count({
        receiverId: userId,
        isRead: false
      });
      
      // 设置缓存
      await this.redisClient.set(cacheKey, count);
    }
    
    return { count: parseInt(count) };
  }
  
  // 增加未读消息计数
  async incrementUnreadCount(userId) {
    const cacheKey = `unread_messages:${userId}`;
    await this.redisClient.incr(cacheKey);
    
    // 推送未读消息数更新
    const count = await this.redisClient.get(cacheKey);
    this.socketService.sendToUser(userId, 'unread_count_updated', {
      count: parseInt(count)
    });
  }
  
  // 减少未读消息计数
  async decrementUnreadCount(userId) {
    const cacheKey = `unread_messages:${userId}`;
    const currentCount = parseInt(await this.redisClient.get(cacheKey) || '0');
    
    if (currentCount > 0) {
      await this.redisClient.decr(cacheKey);
      
      // 推送未读消息数更新
      const count = await this.redisClient.get(cacheKey);
      this.socketService.sendToUser(userId, 'unread_count_updated', {
        count: parseInt(count)
      });
    }
  }
  
  // 重置未读消息计数
  async resetUnreadCount(userId, type = null) {
    if (type) {
      // 重置特定类型的未读计数需要重新计算
      const count = await this.messageRepository.count({
        receiverId: userId,
        isRead: false
      });
      
      const cacheKey = `unread_messages:${userId}`;
      await this.redisClient.set(cacheKey, count);
    } else {
      // 全部已读，直接设置为0
      const cacheKey = `unread_messages:${userId}`;
      await this.redisClient.set(cacheKey, 0);
    }
    
    // 推送未读消息数更新
    const count = await this.redisClient.get(`unread_messages:${userId}`);
    this.socketService.sendToUser(userId, 'unread_count_updated', {
      count: parseInt(count)
    });
  }
  
  // 发送实时通知
  sendRealTimeNotification(message) {
    // 根据消息类型构建不同的通知内容
    let notificationData = {
      messageId: message.id,
      type: message.type,
      title: message.title,
      content: message.content,
      createdAt: message.createdAt
    };
    
    // 添加发送者信息
    if (message.sender) {
      notificationData.sender = {
        id: message.sender.id,
        username: message.sender.username,
        avatar: message.sender.avatar
      };
    }
    
    // 添加相关资源信息
    if (message.post) {
      notificationData.post = {
        id: message.post.id,
        title: message.post.title
      };
    }
    
    if (message.comment) {
      notificationData.comment = {
        id: message.comment.id,
        content: message.comment.content
      };
    }
    
    // 通过WebSocket发送通知
    this.socketService.sendToUser(message.receiverId, 'new_notification', notificationData);
  }
}
```

### 缓存策略

使用Redis实现多级缓存策略：

1. **热点数据缓存**:
   - 分类列表、热门话题等变化较少的数据
   - 热门帖子、热搜关键词等频繁访问的数据

2. **查询结果缓存**:
   - 分页查询结果缓存，设置较短的过期时间
   - 详情页数据缓存，设置合理的过期策略

3. **计数器缓存**:
   - 帖子点赞、评论、收藏等计数，定期同步到数据库
   - 用户未读消息数，实时更新

4. **接口限流**:
   - 基于Redis的请求限流，防止接口被滥用

### 异步任务处理

对于耗时操作，采用异步任务处理方式：

1. **消息通知**: 异步发送通知消息
2. **数据统计**: 异步更新统计数据
3. **图片处理**: 异步处理上传图片（压缩、生成缩略图）
4. **定时任务**: 定期清理过期数据、同步缓存数据到数据库

## 性能优化

为支持2000+用户同时在线，采取以下性能优化措施：

### 数据库优化

1. **索引优化**: 为常用查询添加合适的索引
2. **连接池管理**: 合理配置连接池大小
3. **查询优化**: 避免N+1查询问题，合理使用JOIN和子查询
4. **分页优化**: 使用游标分页代替传统OFFSET分页
5. **数据分区**: 考虑对大表进行分区，如按时间分区消息表

### 缓存优化

1. **多级缓存**: 实现内存缓存和Redis缓存
2. **缓存预热**: 系统启动时预加载热点数据
3. **缓存穿透防护**: 使用布隆过滤器防止缓存穿透
4. **缓存雪崩防护**: 设置随机过期时间，避免同时失效

### API性能优化

1. **响应压缩**: 启用gzip/brotli压缩
2. **数据精简**: 根据客户端需求返回必要字段
3. **批量操作**: 支持批量创建和更新操作
4. **异步处理**: 将耗时操作异步化

### 系统架构优化

1. **负载均衡**: 使用PM2集群模式分发请求
2. **水平扩展**: 支持多实例部署，通过负载均衡分发请求
3. **垂直拆分**: 考虑将上传服务等拆分为独立服务
4. **读写分离**: 考虑实现数据库读写分离

## 部署方案

### PM2集群配置

使用PM2实现Node.js集群部署，充分利用多核CPU：

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: "campus-wall-api",
    script: "./src/server.js",
    instances: "max",   // 使用所有可用CPU核心
    exec_mode: "cluster",
    watch: false,
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    },
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    combine_logs: true,
    merge_logs: true,
    error_file: "./logs/pm2-error.log",
    out_file: "./logs/pm2-out.log"
  }]
};
```

### Docker部署 (可选)

可以考虑使用Docker容器化部署：

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### 环境变量配置

使用.env文件管理环境变量：

```
# .env.example
NODE_ENV=development
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_USERNAME=root
DB_PASSWORD=20060711
DB_NAME=campus_community
DB_PORT=3306

# Redis配置
REDIS_HOST=192.168.159.130
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880  # 5MB

# WebSocket配置
WS_PATH=/socket.io
WS_ORIGINS=*
WS_REDIS_ENABLED=true

# 限流配置
RATE_LIMIT_WINDOW=15*60*1000  # 15分钟
RATE_LIMIT_MAX=100  # 最大请求次数
```

## 开发规范

### 代码风格

使用ESLint和Prettier保持代码风格统一：

```javascript
// .eslintrc.js
module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // 自定义规则
  },
};
```

### 命名规范

- **文件命名**: 使用kebab-case (如user-service.js)
- **类命名**: 使用PascalCase (如UserService)
- **变量/函数命名**: 使用camelCase (如getUserById)
- **常量命名**: 使用UPPER_SNAKE_CASE (如MAX_FILE_SIZE)
- **数据库表/字段**: 使用snake_case (如user_id)

### API返回格式

统一API返回格式为：

```json
{
  "code": 0,          // 状态码，0表示成功
  "msg": "success",   // 状态描述
  "data": {}          // 响应数据
}
```

### 错误处理

实现统一的错误处理中间件，处理以下类型的错误：

1. **验证错误**: 请求参数验证失败
2. **认证错误**: 未授权或token无效
3. **权限错误**: 没有操作权限
4. **资源错误**: 资源不存在
5. **业务错误**: 业务逻辑错误
6. **系统错误**: 未预期的系统错误

#### 错误码定义

```javascript
// constants/error-codes.js
module.exports = {
  // 系统级别错误 (1000-1999)
  SYSTEM_ERROR: { code: 1000, message: '系统错误' },
  DATABASE_ERROR: { code: 1001, message: '数据库错误' },
  REDIS_ERROR: { code: 1002, message: '缓存服务错误' },
  FILE_UPLOAD_ERROR: { code: 1003, message: '文件上传失败' },
  
  // 认证与授权错误 (2000-2999)
  UNAUTHORIZED: { code: 2000, message: '未授权，请先登录' },
  TOKEN_EXPIRED: { code: 2001, message: '登录已过期，请重新登录' },
  TOKEN_INVALID: { code: 2002, message: '无效的身份凭证' },
  PERMISSION_DENIED: { code: 2003, message: '无权执行此操作' },
  ACCOUNT_DISABLED: { code: 2004, message: '账号已被禁用' },
  
  // 用户相关错误 (3000-3999)
  USER_NOT_FOUND: { code: 3000, message: '用户不存在' },
  USERNAME_EXISTS: { code: 3001, message: '用户名已存在' },
  EMAIL_EXISTS: { code: 3002, message: '邮箱已注册' },
  PHONE_EXISTS: { code: 3003, message: '手机号已注册' },
  PASSWORD_INCORRECT: { code: 3004, message: '密码错误' },
  USER_REGISTER_FAILED: { code: 3005, message: '用户注册失败' },
  
  // 帖子相关错误 (4000-4999)
  POST_NOT_FOUND: { code: 4000, message: '帖子不存在' },
  POST_CREATE_FAILED: { code: 4001, message: '帖子创建失败' },
  POST_UPDATE_FAILED: { code: 4002, message: '帖子更新失败' },
  POST_DELETE_FAILED: { code: 4003, message: '帖子删除失败' },
  POST_CATEGORY_INVALID: { code: 4004, message: '帖子分类无效' },
  
  // 评论相关错误 (5000-5999)
  COMMENT_NOT_FOUND: { code: 5000, message: '评论不存在' },
  COMMENT_CREATE_FAILED: { code: 5001, message: '评论创建失败' },
  COMMENT_UPDATE_FAILED: { code: 5002, message: '评论更新失败' },
  COMMENT_DELETE_FAILED: { code: 5003, message: '评论删除失败' },
  
  // 点赞相关错误 (6000-6999)
  LIKE_ALREADY_EXISTS: { code: 6000, message: '已点赞' },
  LIKE_NOT_FOUND: { code: 6001, message: '点赞不存在' },
  LIKE_CREATE_FAILED: { code: 6002, message: '点赞失败' },
  LIKE_DELETE_FAILED: { code: 6003, message: '取消点赞失败' },
  
  // 收藏相关错误 (7000-7999)
  FAVORITE_ALREADY_EXISTS: { code: 7000, message: '已收藏' },
  FAVORITE_NOT_FOUND: { code: 7001, message: '收藏不存在' },
  FAVORITE_CREATE_FAILED: { code: 7002, message: '收藏失败' },
  FAVORITE_DELETE_FAILED: { code: 7003, message: '取消收藏失败' },
  
  // 消息相关错误 (8000-8999)
  MESSAGE_NOT_FOUND: { code: 8000, message: '消息不存在' },
  MESSAGE_SEND_FAILED: { code: 8001, message: '消息发送失败' },
  MESSAGE_UPDATE_FAILED: { code: 8002, message: '消息更新失败' },
  MESSAGE_DELETE_FAILED: { code: 8003, message: '消息删除失败' },
  
  // 话题相关错误 (9000-9999)
  TOPIC_NOT_FOUND: { code: 9000, message: '话题不存在' },
  TOPIC_CREATE_FAILED: { code: 9001, message: '话题创建失败' },
  TOPIC_UPDATE_FAILED: { code: 9002, message: '话题更新失败' },
  TOPIC_DELETE_FAILED: { code: 9003, message: '话题删除失败' },
  
  // 文件相关错误 (10000-10999)
  FILE_TOO_LARGE: { code: 10000, message: '文件大小超过限制' },
  FILE_TYPE_INVALID: { code: 10001, message: '文件类型不支持' },
  FILE_UPLOAD_FAILED: { code: 10002, message: '文件上传失败' },
  FILE_DELETE_FAILED: { code: 10003, message: '文件删除失败' },
  
  // 关注相关错误 (11000-11999)
  FOLLOW_NOT_FOUND: { code: 11000, message: '关注关系不存在' },
  FOLLOW_ALREADY_EXISTS: { code: 11001, message: '已经关注该用户' },
  FOLLOW_SELF_ERROR: { code: 11002, message: '不能关注自己' },
  FOLLOW_CREATE_FAILED: { code: 11003, message: '关注失败' },
  FOLLOW_DELETE_FAILED: { code: 11004, message: '取消关注失败' },
  
  // WebSocket相关错误 (12000-12999)
  WEBSOCKET_CONNECTION_FAILED: { code: 12000, message: 'WebSocket连接失败' },
  WEBSOCKET_AUTH_FAILED: { code: 12001, message: 'WebSocket认证失败' },
  WEBSOCKET_MESSAGE_FAILED: { code: 12002, message: 'WebSocket消息发送失败' },
  
  // 请求限制错误 (13000-13999)
  RATE_LIMIT_EXCEEDED: { code: 13000, message: '请求频率超出限制，请稍后再试' },
  
  // 参数验证错误 (14000-14999)
  VALIDATION_ERROR: { code: 14000, message: '参数验证失败' },
  PARAMETER_MISSING: { code: 14001, message: '缺少必要参数' },
  PARAMETER_INVALID: { code: 14002, message: '参数无效' }
};
```

### 限流中间件

为防止API被恶意大量请求，实现基于Redis的限流中间件：

```javascript
// middlewares/rate-limit.middleware.js
const redis = require('../utils/redis');
const { RATE_LIMIT_EXCEEDED } = require('../constants/error-codes');

/**
 * 限流中间件
 * @param {number} max - 时间窗口内最大请求次数
 * @param {number} windowMs - 时间窗口大小，单位毫秒
 * @returns {Function} - Express中间件
 */
module.exports = function rateLimit(max = 100, windowMs = 15 * 60 * 1000) {
  return async (req, res, next) => {
    try {
      // 获取客户端IP
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      
      // 获取当前路由
      const route = req.originalUrl || req.url;
      
      // 构造Redis键
      const key = `rate_limit:${ip}:${route}`;
      
      // 获取当前计数
      const current = await redis.get(key);
      
      if (current !== null && parseInt(current) >= max) {
        // 超出限制
        return res.status(429).json({
          code: RATE_LIMIT_EXCEEDED.code,
          msg: RATE_LIMIT_EXCEEDED.message,
          data: {
            retryAfter: Math.ceil(windowMs / 1000)
          }
        });
      }
      
      // 增加计数
      if (current === null) {
        // 首次请求，设置初始值和过期时间
        await redis.set(key, 1, 'PX', windowMs);
      } else {
        // 增加计数
        await redis.incr(key);
      }
      
      next();
    } catch (error) {
      // 如果Redis出错，不阻止请求
      console.error('Rate limiting error:', error);
      next();
    }
  };
};
```

### 日志规范

使用Winston实现结构化日志：

1. **请求日志**: 记录API请求和响应
2. **错误日志**: 记录系统错误和异常
3. **业务日志**: 记录关键业务操作
4. **性能日志**: 记录慢查询和性能问题

```javascript
// logger.js
const winston = require('winston');
const { format, transports } = winston;
const path = require('path');

// 定义日志格式
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// 创建Logger实例
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'campus-wall-api' },
  transports: [
    // 控制台日志
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message} ${info.stack || ''}`
        )
      )
    }),
    // 信息日志文件
    new transports.File({ 
      filename: path.join(__dirname, '../logs/info.log'),
      level: 'info'
    }),
    // 错误日志文件
    new transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error'
    }),
    // 所有日志文件
    new transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log') 
    })
  ]
});

// 开发环境下的额外配置
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

module.exports = logger;
```

## 后续扩展

系统设计考虑了后续功能扩展的可能性：

1. **社交功能**: ✅ 关注/粉丝系统已实现，支持用户之间的关注关系建立
   - 已实现功能：
     - 用户关注/取消关注
     - 关注列表/粉丝列表查询
     - 关注状态检查
     - 关注事件通知
   - 待实现功能：
     - 好友关系（双向关注）
     - 用户推荐算法

2. **活动模块**: 校园活动发布与报名
   - 活动创建与管理
   - 活动报名与签到
   - 活动提醒与通知

3. **通知系统**: ✅ 实时通知已实现，基于WebSocket技术
   - 已实现功能：
     - WebSocket连接管理
     - 用户在线状态跟踪
     - 实时消息推送
     - 未读消息计数
     - 多种通知类型支持（关注、评论、点赞等）
   - 待实现功能：
     - 消息优先级处理
     - 消息分组与归档

4. **内容审核**: AI自动审核或人工审核流程
   - 自动敏感词过滤
   - 内容举报与处理
   - 人工审核流程
   - 违规用户管理

5. **数据分析**: 用户行为分析和数据报表
   - 用户活跃度分析
   - 内容热度分析
   - 趋势分析
   - 运营数据报表

6. **多语言支持**: 国际化支持
   - 多语言界面
   - 文本翻译API集成
   - 语言偏好设置

## 开发计划

1. **阶段一**: ✅ 基础框架搭建
   - 项目初始化和配置
   - 数据库设计和模型定义
   - 核心功能框架实现

2. **阶段二**: ✅ 核心功能实现
   - 用户认证与管理
   - 帖子管理
   - 评论功能
   - 文件上传

3. **阶段三**: ✅ 扩展功能实现
   - 消息通知（含实时通知）
   - 分类与话题
   - 搜索功能
   - 系统配置
   - 关注/粉丝功能

4. **阶段四**: 优化与完善
   - 性能优化
   - 安全加固
   - 测试与修复
   - 文档完善

5. **阶段五**: 进阶功能（规划中）
   - 活动模块
   - 内容审核
   - 数据分析
   - 多语言支持 