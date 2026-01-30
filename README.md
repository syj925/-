<p align="center">
  <h1 align="center">🏫 校园墙 Campus Wall</h1>
  <p align="center">
    <strong>一站式校园社交平台</strong><br>
    帖子发布 · 话题讨论 · 活动报名 · 实时私信
  </p>
  <p align="center">
    <a href="./README.en.md">English</a> | 中文
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white" alt="Vue 3">
  <img src="https://img.shields.io/badge/uni--app-3.0-2B9939?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDJMMiA3bDEwIDUgMTAtNS0xMC01eiIvPjwvc3ZnPg==" alt="uni-app">
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/Redis-6.0-DC382D?logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
</p>

---

## 📖 项目简介

**校园墙**是一个功能完善的校园社交平台，旨在为高校师生提供一个便捷的信息交流和社交互动空间。

平台支持**多端适配**：
- 📱 **移动端** - 基于 uni-app，支持 H5、微信小程序等 12+ 平台
- 💻 **管理后台** - 基于 Vue 3 + Element Plus 的现代化管理界面
- ⚙️ **后端服务** - 基于 Node.js + Express 的 RESTful API

### 为什么选择校园墙？

| 特性 | 说明 |
|------|------|
| 🚀 **开箱即用** | 完整的前后端代码，配置即可部署 |
| 📱 **多端适配** | 一套代码编译到微信/支付宝/H5/App 等多平台 |
| 🔐 **安全可靠** | JWT 认证、速率限制、XSS 防护、SQL 注入防护 |
| 📊 **数据可视化** | ECharts 驱动的数据仪表盘 |
| 🔄 **实时通信** | WebSocket 支持的私信和通知系统 |
| 🎨 **界面美观** | 现代化 UI 设计，支持响应式布局 |

---

## ✨ 功能特性

### 用户端功能

<table>
<tr>
<td width="50%">

**📝 内容发布**
- 图文帖子发布（支持多图）
- 话题标签 (#话题#)
- 分类投稿
- 匿名发布
- 帖子编辑/删除

</td>
<td width="50%">

**💬 社交互动**
- 评论与嵌套回复
- 点赞（帖子/评论）
- 收藏管理
- 用户关注/粉丝
- 互关好友

</td>
</tr>
<tr>
<td>

**📨 消息通知**
- 系统通知
- 互动消息（点赞/评论/关注）
- 私信聊天（WebSocket 实时）
- 消息已读状态

</td>
<td>

**🎉 活动系统**
- 活动发布与报名
- 自定义报名表单
- 报名人数限制
- 报名状态管理
- 我的活动列表

</td>
</tr>
<tr>
<td>

**👤 个人中心**
- 个人资料编辑
- 头像上传
- 隐私设置
- 审核历史
- 我的帖子/收藏

</td>
<td>

**🔍 发现与搜索**
- 全局搜索（帖子/用户/话题）
- 搜索历史
- 热门话题
- 推荐帖子
- 首页轮播图

</td>
</tr>
</table>

### 管理端功能

<table>
<tr>
<td width="50%">

**👥 用户管理**
- 用户列表与搜索
- 用户审核（注册审核）
- 封禁/解封用户
- 驳回记录查看
- 用户数据统计

</td>
<td width="50%">

**📋 内容管理**
- 帖子审核/删除
- 评论管理
- 话题 CRUD（增删改查）
- 话题合并
- 话题统计

</td>
</tr>
<tr>
<td>

**🏷️ 分类与标签**
- 分类管理
- 用户标签管理
- 轮播图管理
- 徽章系统配置

</td>
<td>

**⚙️ 系统设置**
- 推荐算法配置
- 系统参数设置
- 操作日志
- 数据仪表盘

</td>
</tr>
</table>

### 特色功能

- **🎭 表情系统** - 支持自定义表情包、表情收藏、使用历史
- **🏅 徽章系统** - 用户成就徽章、手动授予/撤销
- **📊 热门评论算法** - 基于互动数据的智能排序
- **🔔 实时推送** - WebSocket 消息即时送达

---

## 🛠️ 技术栈

### 后端服务 (server/)

| 分类 | 技术 |
|------|------|
| **运行时** | Node.js 18+ |
| **框架** | Express 4.18 |
| **ORM** | Sequelize 6.35 |
| **数据库** | MySQL 8.0 |
| **缓存** | Redis 6.0 (ioredis) |
| **认证** | JWT (jsonwebtoken) + bcryptjs |
| **实时通信** | Socket.IO 4.8 / WebSocket |
| **文件处理** | Multer + Sharp (图片压缩) |
| **验证** | Joi 17 |
| **安全** | Helmet + express-rate-limit + CORS |
| **日志** | Winston 3 |
| **定时任务** | node-schedule |
| **导出** | ExcelJS |

### 管理后台 (admin/)

| 分类 | 技术 |
|------|------|
| **框架** | Vue 3.5 (Composition API) |
| **构建** | Vite 6 |
| **UI 组件** | Element Plus 2.9 |
| **状态管理** | Pinia 3 |
| **路由** | Vue Router 4.5 |
| **图表** | ECharts 5 |
| **HTTP** | Axios |
| **导出** | XLSX |
| **样式** | SCSS (sass-embedded) |

### 移动端 (uni-APP/)

| 分类 | 技术 |
|------|------|
| **框架** | uni-app 3.0 + Vue 3.4 |
| **状态管理** | Pinia 2 + 持久化插件 |
| **国际化** | vue-i18n 9 |
| **样式** | SCSS |
| **支持平台** | H5, 微信/支付宝/百度/抖音/QQ/快手/飞书/京东小程序, 鸿蒙, 快应用, 小红书 |

---

## 📁 项目结构

```
校园墙/
├── server/                     # 后端 API 服务
│   ├── src/
│   │   ├── controllers/        # 控制器层 - 请求处理
│   │   │   └── admin/          # 管理端控制器
│   │   ├── services/           # 服务层 - 业务逻辑
│   │   │   └── admin/          # 管理端服务
│   │   ├── repositories/       # 数据访问层
│   │   ├── models/             # Sequelize 模型 (28个)
│   │   ├── routes/             # 路由定义 (24个模块)
│   │   │   └── admin/          # 管理端路由
│   │   ├── middlewares/        # 中间件 (认证/验证/错误处理)
│   │   ├── utils/              # 工具函数
│   │   └── constants/          # 常量定义
│   ├── config/                 # 配置文件
│   ├── scripts/                # 脚本工具
│   ├── uploads/                # 上传文件目录
│   └── docs/
│       ├── api/                # API 文档 (21个)
│       └── guides/             # 使用指南
│
├── admin/                      # Vue 3 管理后台
│   ├── src/
│   │   ├── views/              # 页面组件 (29个)
│   │   │   ├── user/           # 用户管理
│   │   │   ├── content/        # 内容管理
│   │   │   ├── topic/          # 话题管理
│   │   │   ├── event/          # 活动管理
│   │   │   ├── badge/          # 徽章管理
│   │   │   ├── tag/            # 标签管理
│   │   │   ├── emoji/          # 表情管理
│   │   │   └── message/        # 消息管理
│   │   ├── components/         # 公共组件
│   │   ├── api/                # API 接口封装
│   │   ├── stores/             # Pinia 状态
│   │   ├── router/             # 路由配置
│   │   └── assets/             # 静态资源
│   └── public/                 # 公共资源
│
├── uni-APP/                    # uni-app 移动端
│   ├── src/
│   │   ├── pages/              # 页面 (36个)
│   │   │   ├── index/          # 首页
│   │   │   ├── discover/       # 发现
│   │   │   ├── publish/        # 发布
│   │   │   ├── message/        # 消息
│   │   │   ├── profile/        # 个人中心
│   │   │   ├── post/           # 帖子详情
│   │   │   ├── topic/          # 话题
│   │   │   ├── event/          # 活动
│   │   │   ├── search/         # 搜索
│   │   │   ├── auth/           # 登录注册
│   │   │   ├── settings/       # 设置
│   │   │   └── user/           # 用户主页
│   │   ├── components/         # 公共组件
│   │   ├── api/                # API 接口
│   │   ├── stores/             # Pinia 状态
│   │   ├── utils/              # 工具函数
│   │   └── static/             # 静态资源
│   └── docs/                   # 前端文档
│
├── docs/                       # 项目文档
│   ├── features/               # 功能设计文档 (12个)
│   └── guides/                 # 使用指南 (4个)
│
├── AGENTS.md                   # AI 编码指南
├── README.md                   # 项目说明 (中文)
├── README.en.md                # 项目说明 (英文)
├── CONTRIBUTING.md             # 贡献指南
└── LICENSE                     # 开源许可证
```

---

## 🚀 快速开始

### 环境要求

| 依赖 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 18.0.0 | 推荐使用 LTS 版本 |
| MySQL | >= 8.0 | 数据库 |
| Redis | >= 6.0 | 缓存与会话 |
| npm/pnpm | 最新版 | 包管理器 |

### 1. 克隆项目

```bash
git clone https://github.com/syj925/-.git 校园墙
cd 校园墙
```

### 2. 启动后端服务

```bash
cd server

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等

# 开发模式启动 (热重载)
npm run dev

# 服务运行在 http://localhost:3000
```

<details>
<summary>📄 .env 配置示例</summary>

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=campus_wall
DB_USER=root
DB_PASSWORD=your_password

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT 配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 文件上传
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

</details>

### 3. 启动管理后台

```bash
cd admin

# 安装依赖
npm install

# 开发模式启动
npm run dev

# 管理后台运行在 http://localhost:8888
```

### 4. 启动移动端

```bash
cd uni-APP

# 安装依赖
npm install

# H5 开发模式
npm run dev:h5
# 运行在 http://localhost:5173

# 微信小程序开发
npm run dev:mp-weixin
# 使用微信开发者工具打开 dist/dev/mp-weixin

# 其他平台
npm run dev:mp-alipay     # 支付宝小程序
npm run dev:mp-baidu      # 百度小程序
npm run dev:mp-toutiao    # 抖音小程序
npm run dev:mp-qq         # QQ 小程序
npm run dev:mp-harmony    # 鸿蒙
```

### 5. 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |

> ⚠️ **安全提示**: 生产环境请务必修改默认密码！

---

## 📚 API 文档

后端 API 文档位于 `server/docs/api/` 目录：

### 用户端 API

| 模块 | 文档 | 说明 |
|------|------|------|
| 总览 | [00-overview.md](./server/docs/api/00-overview.md) | 认证方式、响应格式、错误码 |
| 认证 | [01-auth.md](./server/docs/api/01-auth.md) | 登录、注册、验证码 |
| 用户 | [02-user.md](./server/docs/api/02-user.md) | 用户信息、个人主页 |
| 帖子 | [03-post.md](./server/docs/api/03-post.md) | 帖子发布、列表、详情 |
| 评论 | [04-comment.md](./server/docs/api/04-comment.md) | 评论、回复 |
| 交互 | [05-interaction.md](./server/docs/api/05-interaction.md) | 点赞、收藏、关注 |
| 消息 | [06-message.md](./server/docs/api/06-message.md) | 通知、私信 |
| 话题 | [07-topic.md](./server/docs/api/07-topic.md) | 话题列表、详情 |
| 分类 | [08-category.md](./server/docs/api/08-category.md) | 内容分类 |
| 搜索 | [09-search.md](./server/docs/api/09-search.md) | 全局搜索 |
| 上传 | [10-upload.md](./server/docs/api/10-upload.md) | 文件上传 |
| 活动 | [11-event.md](./server/docs/api/11-event.md) | 活动、报名 |
| 徽章 | [12-badge.md](./server/docs/api/12-badge.md) | 用户徽章 |
| 轮播图 | [13-banner.md](./server/docs/api/13-banner.md) | 首页轮播 |
| 标签 | [14-tag.md](./server/docs/api/14-tag.md) | 用户标签 |
| 表情 | [15-emoji.md](./server/docs/api/15-emoji.md) | 表情包 |
| 设置 | [16-settings.md](./server/docs/api/16-settings.md) | 用户设置 |

### 管理端 API

| 模块 | 文档 | 说明 |
|------|------|------|
| 认证 | [20-admin-auth.md](./server/docs/api/20-admin-auth.md) | 管理员登录 |
| 用户管理 | [21-admin-user.md](./server/docs/api/21-admin-user.md) | 用户审核、管理 |
| 内容管理 | [22-admin-content.md](./server/docs/api/22-admin-content.md) | 帖子、评论、话题 |
| 系统管理 | [23-admin-system.md](./server/docs/api/23-admin-system.md) | 设置、仪表盘 |

---

## 🚢 生产部署

### 方式一：Docker Compose (推荐)

<details>
<summary>📄 docker-compose.yml</summary>

```yaml
version: '3.8'

services:
  # MySQL 数据库
  mysql:
    image: mysql:8.0
    container_name: campus-wall-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: campus_wall
      TZ: Asia/Shanghai
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    command: --default-authentication-plugin=mysql_native_password

  # Redis 缓存
  redis:
    image: redis:6-alpine
    container_name: campus-wall-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  # 后端 API
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: campus-wall-server
    restart: unless-stopped
    depends_on:
      - mysql
      - redis
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: campus_wall
      DB_USER: root
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: ${JWT_SECRET}
    volumes:
      - ./server/uploads:/app/uploads
    ports:
      - "3000:3000"

  # 管理后台 (Nginx 静态托管)
  admin:
    image: nginx:alpine
    container_name: campus-wall-admin
    restart: unless-stopped
    volumes:
      - ./admin/dist:/usr/share/nginx/html
      - ./nginx/admin.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "8888:80"

volumes:
  mysql_data:
  redis_data:
```

</details>

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f server

# 停止服务
docker-compose down
```

### 方式二：PM2 部署

```bash
# 全局安装 PM2
npm install -g pm2

# 进入后端目录
cd server

# 安装生产依赖
npm install --production

# 使用 PM2 启动
pm2 start src/server.js --name campus-wall-api

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

<details>
<summary>📄 ecosystem.config.js (PM2 配置)</summary>

```javascript
module.exports = {
  apps: [{
    name: 'campus-wall-api',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '1G'
  }]
};
```

</details>

### 方式三：Nginx 反向代理

<details>
<summary>📄 nginx.conf</summary>

```nginx
# 后端 API 反向代理
upstream campus_wall_api {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.your-domain.com;

    # 强制 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # API 代理
    location / {
        proxy_pass http://campus_wall_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传文件静态服务
    location /uploads {
        alias /path/to/校园墙/server/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# 管理后台
server {
    listen 443 ssl http2;
    server_name admin.your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /path/to/校园墙/admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://campus_wall_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

</details>

---

## 🧪 开发指南

### 常用命令

#### 后端 (server/)

```bash
npm start              # 生产模式启动
npm run dev            # 开发模式 (nodemon 热重载)
npm test               # 运行 Jest 测试
npm run lint           # ESLint 代码检查
npm run seed-data      # 填充测试数据
npm run backup-db      # 备份数据库
npm run clear-cache    # 清除 Redis 缓存
```

#### 管理后台 (admin/)

```bash
npm run dev            # 开发服务器
npm run build          # 生产构建
npm run preview        # 预览构建结果
```

#### 移动端 (uni-APP/)

```bash
npm run dev:h5         # H5 开发
npm run build:h5       # H5 构建
npm run dev:mp-weixin  # 微信小程序开发
npm run build:mp-weixin # 微信小程序构建
```

### 代码规范

- **后端**: CommonJS 模块，分层架构 (Controller → Service → Repository → Model)
- **前端**: Vue 3 Composition API + `<script setup>` + SCSS
- **命名**: 文件 kebab-case，组件 PascalCase，变量 camelCase
- **注释**: JSDoc 风格，解释"为什么"而非"是什么"

详见 [AGENTS.md](./AGENTS.md) 中的完整编码规范。

---

## 🗄️ 数据模型

项目包含 **28 个数据模型**：

| 模块 | 模型 | 说明 |
|------|------|------|
| **用户** | User, Follow, UserTag, UserBadge, UserRejectionLog | 用户及关系 |
| **内容** | Post, PostImage, Comment, Like, Favorite | 帖子与互动 |
| **分类** | Category, Topic, Tag | 内容分类 |
| **消息** | Message, MessageRead | 通知与私信 |
| **活动** | Event, EventRegistration | 活动报名 |
| **徽章** | Badge, UserBadge | 成就系统 |
| **表情** | Emoji, EmojiPack, EmojiVersion, EmojiFavorite, EmojiUsageHistory, UserEmojiPack, UserCustomEmoji | 表情系统 |
| **其他** | Banner, Setting, SearchHistory | 系统配置 |

---

## 🤝 贡献指南

我们欢迎任何形式的贡献！详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

### 快速开始

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 提交规范

```
<type>(<scope>): <subject>

type: feat | fix | docs | style | refactor | test | chore
scope: server | admin | uni-app | docs
```

---

## 📄 开源许可

本项目采用 [MIT License](./LICENSE) 开源许可证。

---

## 🙏 致谢

- [Express](https://expressjs.com/) - 后端框架
- [Vue.js](https://vuejs.org/) - 前端框架
- [Element Plus](https://element-plus.org/) - UI 组件库
- [uni-app](https://uniapp.dcloud.io/) - 跨平台框架
- [Sequelize](https://sequelize.org/) - ORM 框架

---

<p align="center">
  如果这个项目对你有帮助，请给一个 ⭐ Star 支持一下！
</p>
