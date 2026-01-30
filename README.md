# 校园墙 Campus Wall

校园社交平台 - 支持帖子发布、评论互动、话题讨论、用户关注等功能。

## 技术栈

| 模块 | 技术 |
|------|------|
| 后端 API | Node.js + Express + Sequelize + MySQL + Redis |
| 管理后台 | Vue 3 + Element Plus + Vite |
| 移动端 | uni-app + Vue 3 |

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis >= 6.0

### 后端服务

```bash
cd server
npm install
cp .env.example .env  # 编辑配置
npm run dev           # 开发模式 (端口 3000)
```

### 管理后台

```bash
cd admin
npm install
npm run dev           # 开发模式 (端口 8888)
```

### 移动端

```bash
cd uni-APP
npm install
npm run dev:h5        # H5 开发模式
npm run dev:mp-weixin # 微信小程序
```

## 项目结构

```
校园墙/
├── server/             # 后端 API 服务
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── services/       # 业务逻辑
│   │   ├── repositories/   # 数据访问
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由
│   │   └── middlewares/    # 中间件
│   └── docs/api/           # API 文档
├── admin/              # Vue 3 管理后台
│   └── src/
│       ├── views/          # 页面
│       ├── components/     # 组件
│       └── api/            # API 接口
├── uni-APP/            # uni-app 移动端
│   └── src/
│       ├── pages/          # 页面
│       ├── components/     # 组件
│       └── api/            # API 接口
└── docs/               # 项目文档
```

## 核心功能

### 用户端
- 用户注册/登录、个人资料、隐私设置
- 帖子发布、图片上传、话题标签
- 点赞、评论、收藏、关注
- 消息通知、私信
- 活动报名

### 管理端
- 用户审核与管理
- 帖子/评论审核
- 话题/分类管理
- 数据统计仪表盘
- 推荐算法配置
- 系统设置

## API 文档

后端 API 文档位于 `server/docs/api/`：

| 文档 | 说明 |
|------|------|
| 00-overview.md | 总览、错误码、响应格式 |
| 01-auth.md ~ 16-settings.md | 用户端 API |
| 20-admin-auth.md ~ 23-admin-system.md | 管理端 API |

## 开发命令

### 后端

```bash
npm start          # 生产模式
npm run dev        # 开发模式 (nodemon)
npm test           # 运行测试
npm run lint       # 代码检查
```

### 前端

```bash
npm run dev        # 开发服务器
npm run build      # 生产构建
npm run preview    # 预览构建
```

## 默认账号

| 类型 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |

## 端口配置

| 服务 | 端口 |
|------|------|
| 后端 API | 3000 |
| 管理后台 | 8888 |
| 移动端 H5 | 5173 |

## License

MIT
