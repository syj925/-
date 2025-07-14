# 校园墙应用高并发部署指南

## 系统需求

- Node.js 16.x 或更高版本
- MySQL 8.x
- Redis（可选，但推荐用于缓存）
- PM2（用于进程管理）

## 基础部署步骤

### 1. 安装依赖

```bash
# 安装项目依赖
npm install

# 全局安装PM2
npm install -g pm2
```

### 2. 数据库配置

在 `.env` 文件中配置数据库连接信息（如不存在，请创建此文件）：

```
# 服务器配置
PORT=12349
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=campus_wall
DB_PORT=3306

# JWT配置
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=7d

# Redis配置（可选）
REDIS_URL=redis://127.0.0.1:6379
```

### 3. 使用PM2启动应用

```bash
# 使用ecosystem配置启动
pm2 start ecosystem.config.js --env production

# 或直接启动（不推荐）
pm2 start app.js -i max
```

### 4. 设置PM2开机自启

```bash
pm2 startup
pm2 save
```

## 高并发优化建议

本项目已经实施了以下高并发优化措施：

1. **多进程部署**：使用PM2集群模式充分利用多核CPU
2. **缓存机制**：Redis缓存热门内容，减轻数据库压力
3. **请求限流**：防止单个IP过度请求，保护系统
4. **优化的路由结构**：通过缓存中间件减少重复计算

## 扩展部署方案（多服务器）

当用户规模增长到需要多台服务器时，建议采用以下架构：

1. **负载均衡层**：使用Nginx或云服务商提供的负载均衡
2. **应用服务器集群**：多台运行Node.js应用的服务器
3. **Redis集群**：用于分布式缓存和会话存储
4. **数据库主从复制**：实现读写分离，提高数据库性能

### Nginx负载均衡配置示例

```nginx
upstream app_servers {
    server app1_ip:12349;
    server app2_ip:12349;
    # 添加更多服务器...
}

server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://app_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 监控与维护

1. **使用PM2监控**：`pm2 monit`查看实时性能
2. **日志管理**：`pm2 logs`查看应用日志
3. **性能问题排查**：监控CPU、内存使用和响应时间
4. **定期备份**：设置数据库定期备份策略

## 常见问题排查

1. **应用无响应**：检查PM2进程状态和日志
2. **数据库连接问题**：验证数据库连接配置和权限
3. **缓存未生效**：检查Redis连接和缓存键设置
4. **内存泄漏**：使用`pm2 monit`监控内存使用，必要时设置自动重启

如有任何问题，请联系技术支持。 