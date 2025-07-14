# 校园墙后端服务

这是校园墙应用的后端服务器项目，基于Node.js + Express + MySQL开发。

## 技术栈

- Node.js
- Express.js
- MySQL
- Sequelize ORM
- Redis (缓存)
- PM2 (进程管理)

## 系统需求

- Node.js 16.x+
- MySQL 8.0+
- Redis (可选但推荐用于缓存)

## 高并发优化和启动

为了支持1000-2000人同时在线使用，本项目进行了以下优化：

1. **多进程部署**：使用PM2集群模式充分利用多核CPU
2. **缓存机制**：Redis缓存热门内容，减轻数据库压力
3. **请求限流**：防止单个IP过度请求，保护系统
4. **数据库索引优化**：针对高频查询添加了专门索引

### 快速启动（推荐）

项目提供了便捷的启动脚本，自动处理依赖安装、索引优化和PM2启动：

**Windows**:
```bash
# 在server目录下运行
start.bat
```

**Linux/Mac**:
```bash
# 在server目录下运行
chmod +x start.sh  # 首次运行前授予执行权限
./start.sh
```

### 手动启动

```bash
# 安装依赖
npm install

# 安装PM2（如果尚未安装）
npm install -g pm2

# 优化数据库索引（可选但推荐）
node scripts/add-indexes.js

# 以生产模式启动
pm2 start ecosystem.config.js --env production
```

### PM2常用命令

- `pm2 list` - 查看所有运行中的应用
- `pm2 monit` - 监控CPU/内存使用情况
- `pm2 logs` - 查看应用日志
- `pm2 stop campus-wall` - 停止应用
- `pm2 restart campus-wall` - 重启应用

更多关于高并发部署的详细说明请参考 [DEPLOY.md](./DEPLOY.md)。

## 开发环境快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

默认数据库配置:
- 数据库: MySQL
- 用户名: root
- 密码: 20060711
- 数据库名: campus_wall

数据库配置在 `config/config.js` 文件中，可以根据需要修改。

### 3. 启动服务器（开发模式）

```bash
npm run dev
```

服务器默认运行在 http://localhost:12349

## API文档

详细的API接口文档请参考：`api.md` 和 `校园墙后端API接口文档.md`

## 项目结构

```
server/
├── config/           # 配置文件
├── controllers/      # 控制器
├── middlewares/      # 中间件
├── models/           # 数据模型
├── routes/           # 路由
├── uploads/          # 上传文件
├── utils/            # 工具函数
├── scripts/          # 辅助脚本
├── app.js            # 应用入口
└── package.json      # 项目配置
```

## 主要功能

- 用户注册/登录
- 帖子的创建/查看/更新/删除
- 评论功能
- 点赞/收藏
- 用户关系管理
- 话题和搜索
- 消息通知系统 

# 校园墙应用部署指南

## 问题解决方案

### 当前问题
1. Redis连接错误
2. 目录结构混乱 (server/server)
3. PowerShell命令分隔符问题
4. 依赖包缺失

### 解决方案

#### 1. Redis连接问题
应用已更新为可以在没有Redis的情况下运行。当Redis连接失败时，系统会自动降级，以无缓存模式运行。如果需要更好的性能，您可以：

- 安装Redis服务器: 
  - Windows: https://github.com/microsoftarchive/redis/releases
  - Linux: `sudo apt install redis-server`
  
- 修改配置: 编辑 `config/config.js` 中的Redis配置

#### 2. 目录结构问题
我们发现项目中存在嵌套的server目录结构，新的启动脚本会自动检测并修复这个问题。

#### 3. PowerShell问题
Windows PowerShell中不支持`&&`作为命令分隔符，需使用`;`代替。我们提供了专门的PowerShell脚本`start.ps1`来解决这个问题。

#### 4. 依赖缺失
更新后的启动脚本会自动安装所有必需的依赖项。

## 启动指南

### 使用PowerShell启动 (推荐Windows用户)
```
cd server
.\start.ps1
```

### 使用CMD启动 (Windows)
```
cd server
start.bat
```

### 使用Bash启动 (Linux/Mac)
```
cd server
chmod +x start.sh
./start.sh
```

### 手动启动 (任何平台)
```
cd server
npm install
node app.js
```

## 目录结构说明
```
server/
  ├── app.js              # 主应用文件
  ├── config/             # 配置文件
  ├── controllers/        # 控制器
  ├── middlewares/        # 中间件
  ├── models/             # 数据库模型
  ├── routes/             # 路由
  ├── scripts/            # 实用脚本
  ├── utils/              # 工具函数
  ├── ecosystem.config.js # PM2配置
  ├── start.bat           # Windows启动脚本
  ├── start.ps1           # PowerShell启动脚本
  └── start.sh            # Linux/Mac启动脚本
```

## 常见问题排查

### Redis连接错误
如果看到"Redis连接错误"，不必担心，应用会自动以无缓存模式运行。但如果您想使用Redis:
1. 确保已安装Redis并运行
2. 检查配置文件中的连接信息
3. 使用`redis-cli ping`测试连接

### 数据库连接错误
1. 确保MySQL/MariaDB已安装并运行
2. 检查`config/config.js`中的数据库配置
3. 确保数据库用户有足够权限

### 应用不启动
1. 检查是否有其它进程占用端口
2. 检查日志文件
3. 确保所有依赖已安装 (`npm install`)

## PM2命令参考
- 查看应用列表: `pm2 list`
- 监控应用: `pm2 monit`
- 查看日志: `pm2 logs`
- 重启应用: `pm2 restart campus-wall`
- 停止应用: `pm2 stop campus-wall` 