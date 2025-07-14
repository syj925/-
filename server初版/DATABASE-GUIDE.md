# 数据库初始化与管理指南

本指南提供了数据库初始化、同步和管理的详细步骤。

## 前提条件

1. 确保已安装 MySQL 5.7+ 或 MariaDB 10.3+
2. 确保已安装 Node.js 14.0+ 和 npm 6.0+
3. 在 server 目录下执行 `npm install` 安装所有依赖

## 配置数据库连接

数据库连接参数在 `server/config/config.js` 文件中配置，默认配置如下：

```javascript
database: {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '20060711',
  name: process.env.DB_NAME || 'campus_wall',
  port: process.env.DB_PORT || 3306
}
```

如需修改连接参数，可以：

1. 直接编辑 config.js 文件
2. 设置环境变量 (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT)
3. 创建 .env 文件在 server 目录下，并设置相关变量

## 数据库初始化

我们提供了一个综合性的初始化脚本 `db-init.js`，它包含以下步骤：

1. 创建数据库（如果不存在）
2. 测试数据库连接
3. 安全地同步模型（不更改现有结构）
4. 优化数据库索引

### 执行初始化

```bash
cd server
node db-init.js
```

这将执行完整的初始化过程，并显示详细的日志输出。整个过程通常需要几秒钟完成。

### 初始化过程说明

1. **创建数据库**：脚本首先尝试创建名为 `campus_wall` 的数据库（如果不存在）
2. **测试连接**：验证与数据库的连接是否正常
3. **同步模型**：将 `models` 目录中定义的所有模型同步到数据库，创建必要的表
4. **优化索引**：根据 `scripts/add-indexes.js` 中的定义添加性能优化索引

## 高级数据库管理

### 使用 Sequelize CLI

我们的项目支持 Sequelize CLI，可以用于高级数据库操作：

```bash
# 查看迁移状态
npx sequelize-cli db:migrate:status

# 运行所有迁移
npx sequelize-cli db:migrate

# 撤销最近的迁移
npx sequelize-cli db:migrate:undo

# 创建新的迁移
npx sequelize-cli migration:generate --name add-new-field
```

### 使用表结构查看工具

我们提供了一个 `show-tables.js` 工具，可以显示数据库中所有表的详细结构：

```bash
cd server
node show-tables.js
```

这将输出所有表的字段、索引和外键关系。

### 处理特定表的索引

如果需要为特定表添加或修改索引，可以使用我们的索引管理脚本：

```bash
# 运行索引优化脚本
cd server
node scripts/add-indexes.js
```

## 迁移修复

如果在执行 Sequelize 迁移时遇到问题，我们提供了一个修复脚本 `fix-migration.js`：

```bash
cd server
node fix-migration.js
```

这个脚本会直接添加必要的字段而不使用迁移机制，避免迁移过程中可能出现的问题。

### 迁移问题说明

我们的系统中存在一个已知问题：在某些情况下，Sequelize 的迁移机制可能会尝试创建与数据库结构不匹配的索引。修复脚本通过直接添加字段并处理可能的错误情况来解决这个问题。

## 数据库备份与恢复

### 备份数据库

```bash
# 使用 mysqldump 工具备份
mysqldump -u root -p campus_wall > backup_campus_wall.sql
```

### 恢复数据库

```bash
# 使用 mysql 客户端恢复
mysql -u root -p campus_wall < backup_campus_wall.sql
```

## 故障排除

### 连接问题

如果遇到数据库连接问题：

1. 确认 MySQL 服务正在运行
2. 验证连接参数（用户名、密码、主机、端口）
3. 检查 MySQL 用户是否有足够权限

### 同步错误

如果在同步模型时出现错误：

1. 检查错误信息中的表名和字段名
2. 如果是索引相关错误，检查模型中的索引定义
3. 尝试使用 `fix-migration.js` 脚本修复

### 索引问题

如果发现索引相关问题：

1. 执行 `show-tables.js` 查看当前索引结构
2. 比较 `models` 目录中的索引定义与数据库中的实际索引
3. 如有必要，手动调整模型中的索引定义

## 数据库结构变更最佳实践

1. 使用 Sequelize 迁移来管理结构变更，而不是直接修改模型
2. 为新字段始终设置默认值或允许为 NULL
3. 为频繁查询的字段添加索引，但避免过度索引
4. 遵循命名约定：表名复数，字段名下划线
5. 在生产环境中进行变更前，先在开发环境中测试

## 索引命名约定

Sequelize 和 MySQL 在处理索引名称时可能会有所不同。我们建议以下命名约定：

1. 主键索引: `PRIMARY`
2. 外键索引: `表名_字段名_foreign_idx`
3. 唯一索引: `表名_字段1_字段2`
4. 普通索引: `idx_表名_字段1_字段2`

遵循这些约定可以减少索引名冲突的可能性。

## 帮助与支持

如果遇到数据库相关问题，可以：

1. 查阅 Sequelize 官方文档: [https://sequelize.org/](https://sequelize.org/)
2. 检查 MySQL 错误日志: `/var/log/mysql/error.log` (Linux) 或 MySQL 控制台
3. 参考项目中的 `DATABASE-README.md` 了解数据库结构

## 常见错误与解决方案

### 1. "Table already exists"

- **原因**: 尝试创建已存在的表
- **解决方案**: 使用 `{ force: false }` 选项进行同步

### 2. "Unknown column in field list"

- **原因**: 查询中使用了不存在的列名
- **解决方案**: 检查模型定义，确保字段名匹配

### 3. "Duplicate entry for key 'PRIMARY'"

- **原因**: 尝试插入已存在主键的记录
- **解决方案**: 使用 `upsert` 而不是 `create`

### 4. "Error: ER_NO_REFERENCED_ROW"

- **原因**: 外键约束失败
- **解决方案**: 确保引用的记录存在 