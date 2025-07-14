# 话题管理功能迁移修复指南

## 问题说明

在执行数据库迁移时出现了以下错误：
```
ERROR: Key column 'startTime' doesn't exist in table
```

这是因为系统尝试为事件表创建索引，但该表的结构与迁移文件不匹配。我们需要单独应用SEO和审核配置的字段，而不运行不兼容的索引创建。

## 解决方案

### 方法一：使用修复脚本（推荐）

我们已经创建了一个直接添加所需字段的修复脚本，避开了迁移机制的问题。

1. 进入server目录
```
cd server
```

2. 运行修复脚本
```
node fix-migration.js
```

3. 如果显示"所有字段添加成功!"和"操作完成"，则说明修复成功

### 方法二：手动在数据库中添加字段

如果方法一不起作用，您可以直接在数据库中执行SQL添加需要的字段：

```sql
ALTER TABLE topics ADD COLUMN meta_title VARCHAR(100) NULL;
ALTER TABLE topics ADD COLUMN meta_description VARCHAR(200) NULL;
ALTER TABLE topics ADD COLUMN meta_keywords VARCHAR(100) NULL;
ALTER TABLE topics ADD COLUMN sensitive_words_level ENUM('low', 'medium', 'high') DEFAULT 'medium' NOT NULL;
ALTER TABLE topics ADD COLUMN auto_review BOOLEAN DEFAULT false;
ALTER TABLE topics ADD COLUMN custom_sensitive_words TEXT NULL;
ALTER TABLE topics ADD COLUMN banned_words TEXT NULL;
```

## 验证功能

修复数据库结构后，您可以通过以下步骤验证新功能是否正常工作：

1. 启动后端服务
```
cd server
npm start
```

2. 在另一个终端窗口启动前端服务
```
cd admin
npx vite
```
注意：在PowerShell中不能使用`&&`连接命令，请使用分号`;`或分开执行命令。

3. 访问前端应用程序（默认为http://localhost:8081）

4. 登录后，进入话题管理页面，应该能够看到以下新功能：
   - 批量操作按钮和复选框
   - 每个话题行的SEO设置和审核配置按钮
   - 点击这些按钮会打开相应的配置对话框

## 功能说明

### 1. 话题数据统计
- 路径：/topic/statistics
- 功能：查看话题总数、活跃话题、隐藏话题、热门话题排行等数据

### 2. 内容审核配置
- 在话题列表中点击"审核配置"按钮
- 功能：设置敏感词过滤级别、自动审核、自定义敏感词和禁止词语

### 3. 批量操作功能
- 在话题列表中选择多个话题，使用批量操作按钮
- 功能：批量激活、隐藏或删除话题

### 4. 话题合并工具
- 路径：/topic/merge
- 功能：选择源话题和目标话题，将源话题合并到目标话题

### 5. SEO设置
- 在话题列表中点击"SEO设置"按钮
- 功能：设置Meta标题、Meta描述和Meta关键词

## 问题排查

如果遇到任何问题，请检查：
1. 服务器日志，查看是否有错误信息
2. 开发者工具网络请求，查看API响应
3. 数据库结构，确认字段是否添加成功 