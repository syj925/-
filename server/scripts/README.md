# 校园墙数据库脚本说明

本目录包含校园墙项目的数据库管理脚本。

## 📋 脚本列表

### 🚀 数据库恢复脚本

#### `force-restore.js`
**用途**: 强制重建数据库和表结构
**使用场景**: 
- 系统重装后的数据库恢复
- 解决表结构冲突问题
- 开发环境重置

**使用方法**:
```bash
node scripts/force-restore.js
```

**功能**:
- 删除现有数据库
- 重新创建数据库
- 创建所有表结构（禁用外键检查）
- 插入基础数据（分类、管理员账户、系统设置）

---

#### `add-foreign-keys.js`
**用途**: 在表创建完成后添加外键约束
**使用场景**: 
- 在force-restore.js执行后运行
- 为数据库添加完整性约束

**使用方法**:
```bash
node scripts/add-foreign-keys.js
```

**功能**:
- 检查现有外键约束
- 添加缺失的外键约束
- 提供详细的执行报告

---

### 🔍 诊断和检查脚本

#### `check-database-config.js`
**用途**: 检查数据库配置和连接状态
**使用场景**: 
- 排查数据库连接问题
- 验证配置是否正确
- 系统健康检查

**使用方法**:
```bash
node scripts/check-database-config.js
```

**功能**:
- 验证数据库连接
- 检查Redis连接
- 显示配置信息
- 统计表和模型数量

---

### 🛠️ 维护脚本

#### `backup-database.js`
**用途**: 数据库备份
**使用场景**: 
- 定期数据备份
- 重要操作前的安全备份

**使用方法**:
```bash
node scripts/backup-database.js
```

---

#### `clear-cache.js`
**用途**: 清理Redis缓存
**使用场景**: 
- 缓存数据异常时清理
- 系统维护

**使用方法**:
```bash
node scripts/clear-cache.js
```

---

#### `seed-data.js`
**用途**: 插入测试数据
**使用场景**: 
- 开发环境数据填充
- 功能测试

**使用方法**:
```bash
node scripts/seed-data.js
```

---

## 🎯 常用操作流程

### 系统重装后的完整恢复流程

1. **检查环境配置**
   ```bash
   node scripts/check-database-config.js
   ```

2. **强制恢复数据库**
   ```bash
   node scripts/force-restore.js
   ```

3. **启动服务器验证**
   ```bash
   npm run dev
   ```

4. **添加外键约束（可选）**
   ```bash
   node scripts/add-foreign-keys.js
   ```

5. **插入测试数据（可选）**
   ```bash
   node scripts/seed-data.js
   ```

### 日常维护流程

1. **数据备份**
   ```bash
   node scripts/backup-database.js
   ```

2. **清理缓存**
   ```bash
   node scripts/clear-cache.js
   ```

3. **健康检查**
   ```bash
   node scripts/check-database-config.js
   ```

---

## ⚠️ 注意事项

1. **force-restore.js** 会删除所有现有数据，请谨慎使用
2. **add-foreign-keys.js** 需要在表创建完成后运行
3. 所有脚本都会自动读取项目配置文件
4. 建议在执行重要操作前先运行备份脚本

---

## 📝 脚本维护

- 定期检查脚本是否需要更新
- 新增功能时考虑是否需要相应的维护脚本
- 保持脚本的简洁性和可读性
