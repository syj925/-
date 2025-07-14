# 数据库索引优化步骤

为了提高校园墙应用在高并发场景下的性能，我们需要添加一些数据库索引。以下步骤可以安全地应用这些优化，不会影响现有功能。

## 方法一：独立运行索引优化脚本（推荐）

1. 确保服务器未在运行状态
2. 打开命令行终端，切换到项目的server目录
3. 运行以下命令：

```bash
node scripts/add-indexes.js
```

4. 如果成功，你将看到"索引添加完成"的消息
5. 正常启动服务器

## 方法二：在服务器启动时自动应用索引优化

1. 编辑 server/app.js 文件
2. 在文件顶部的 require 部分添加：
   ```javascript
   const { addIndexes } = require('./scripts/add-indexes');
   ```

3. 在数据库同步成功后添加索引优化代码：
   找到 `await syncModels();` 这一行之后，添加：
   ```javascript
   // 在模型同步成功后优化索引
   try {
     await addIndexes();
     console.log('数据库索引优化完成');
   } catch (indexError) {
     console.warn('数据库索引优化失败，但服务器仍将启动:', indexError.message);
   }
   ```

4. 保存文件并启动服务器

## 添加SEO和审核配置相关字段 (2025-05-18)

以下迁移将为话题表添加SEO和审核配置相关字段。

运行以下命令：

```bash
npx sequelize-cli db:migrate
```

或者在Windows上使用PowerShell：

```powershell
npx sequelize-cli db:migrate
```

这将添加以下字段到topics表：
- meta_title: SEO标题
- meta_description: SEO描述
- meta_keywords: SEO关键词
- sensitive_words_level: 敏感词过滤级别（low/medium/high）
- auto_review: 是否开启自动审核
- custom_sensitive_words: 自定义敏感词
- banned_words: 禁止发布词语

## 添加了哪些索引？

以下是我们添加的索引列表，这些索引将显著提高查询性能：

1. 帖子表 (posts)：
   - `idx_posts_userid_created` - 用户ID和创建时间联合索引，加速获取用户的帖子列表
   - `idx_posts_status_created` - 状态和创建时间联合索引，加速筛选不同状态的帖子
   - `idx_posts_category_created` - 分类ID和创建时间联合索引，加速分类筛选
   - `idx_posts_recommend_created` - 推荐标志和创建时间联合索引，加速获取推荐帖子

2. 评论表 (comments)：
   - `idx_comments_postid_parent` - 帖子ID和父评论ID联合索引，加速获取帖子评论和回复
   - `idx_comments_userid_created` - 用户ID和创建时间联合索引，加速获取用户的评论历史
   - `idx_comments_status` - 评论状态索引，加速过滤不同状态的评论

3. 消息表 (messages)：
   - `idx_messages_recipient_read` - 接收者ID、已读状态和创建时间联合索引，加速获取未读消息
   - `idx_messages_type_created` - 消息类型和创建时间联合索引，加速按类型筛选消息

4. 收藏表 (collections)：
   - `idx_collections_userid_created` - 用户ID和创建时间联合索引，加速获取用户收藏列表

这些索引针对高频查询进行了优化，将显著提高应用在高并发场景下的性能表现。 