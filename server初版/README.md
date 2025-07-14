# 校园墙应用 - 服务端

这是校园墙应用的后端服务，使用 Node.js 和 Express 构建，数据库使用 MySQL。

## 特性

- RESTful API
- JWT 身份验证
- 文件上传
- 帖子、评论、点赞等功能
- 用户权限管理
- Redis 缓存支持

## 安装

1. 确保已安装 Node.js (v14+) 和 npm
2. 克隆仓库
3. 安装依赖：`npm install`
4. 配置环境变量（可选）
5. 初始化数据库（见下文）
6. 启动服务：`npm start`

## 数据库设置

我们提供了详细的数据库文档：

- [数据库结构说明文档](DATABASE-README.md) - 了解数据库表结构和关系
- [数据库初始化与管理指南](DATABASE-GUIDE.md) - 数据库初始化和维护指南

快速初始化数据库：

```bash
node db-init.js
```

## API 文档

主要 API 端点：

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/posts` - 获取帖子列表
- `GET /api/posts/:id` - 获取帖子详情
- `POST /api/posts` - 创建帖子
- `GET /api/topics` - 获取话题列表
- `GET /api/users/:id` - 获取用户信息

完整 API 文档请参见 [API.md](API.md)

## 配置

配置文件在 `config/config.js`，可以通过环境变量进行覆盖：

- `PORT` - 服务器端口
- `NODE_ENV` - 环境设置（development/production）
- `JWT_SECRET` - JWT 令牌密钥
- `DB_HOST` - 数据库主机
- `DB_USER` - 数据库用户名
- `DB_PASSWORD` - 数据库密码
- `DB_NAME` - 数据库名称
- `REDIS_URL` - Redis 连接 URL（可选）

## 开发

- 启动开发服务器：`npm run dev`
- 运行测试：`npm test`
- 代码检查：`npm run lint`

## 项目结构

```
server/
├── config/         # 配置文件
├── controllers/    # 控制器
├── middleware/     # 中间件
├── models/         # 数据模型
├── routes/         # 路由定义
├── scripts/        # 脚本工具
├── uploads/        # 上传文件目录
├── utils/          # 实用工具
├── app.js          # 应用入口
├── db-init.js      # 数据库初始化脚本
└── package.json    # 项目依赖
```

## 许可证

[ISC许可证](LICENSE) 