# 数据库结构说明文档

## 概述

本文档描述了校园墙应用的数据库结构和主要表之间的关系。数据库使用 MySQL 实现，通过 Sequelize ORM 进行管理。

## 数据库配置

- **数据库名称**: campus_wall
- **默认用户**: root
- **默认端口**: 3306
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_general_ci

## 核心表结构

### 用户相关表

#### 1. users - 用户表

存储所有用户的基本信息。

**主要字段**:
- `id`: 主键，自增整数
- `nickname`: 用户昵称
- `username`: 用户名（登录账号）
- `password`: 加密存储的密码
- `avatar`: 头像地址，默认为 '/uploads/default-avatar.png'
- `bio`: 个人简介
- `email`: 电子邮箱
- `role`: 用户角色，枚举类型 ('user', 'admin')，默认为 'user'
- `status`: 账号状态，枚举类型 ('active', 'inactive', 'banned')，默认为 'active'

#### 2. relationships - 用户关系表

管理用户之间的关注关系。

**主要字段**:
- `id`: 主键，自增整数
- `follower_id`: 关注者ID
- `following_id`: 被关注者ID
- `status`: 关系状态，枚举类型 ('active', 'blocked')，默认为 'active'

**索引**:
- `follower_id`: 关注者ID
- `following_id`: 被关注者ID

#### 3. follows - 用户关注表 (旧版)

与 relationships 表功能类似，但增加了备注功能。

**主要字段**:
- `id`: 主键，自增整数
- `follower_id`: 关注者ID
- `following_id`: 被关注者ID
- `remark`: 备注信息

**索引**:
- 唯一索引 `follows_follower_id_following_id`: (follower_id, following_id)，确保不重复关注

#### 4. user_settings - 用户设置表

存储用户个性化设置。

**主要字段**:
- `id`: 主键，自增整数
- `user_id`: 用户ID，关联 users 表
- `notification_email`: 是否接收邮件通知，默认为 1 (开启)
- `notification_system`: 是否接收系统通知，默认为 1 (开启)
- `theme`: 主题设置，默认为 'light'
- `language`: 语言设置，默认为 'zh-CN'

### 内容相关表

#### 1. posts - 帖子表

存储用户发布的帖子内容。

**主要字段**:
- `id`: 主键，自增整数
- `user_id`: 发布者ID，关联 users 表
- `content`: 帖子内容
- `images`: 图片地址，JSON格式字符串
- `topics`: 话题标签，JSON格式字符串
- `category_id`: 分类ID
- `likes`: 点赞数，默认为 0
- `comments`: 评论数，默认为 0
- `collections`: 收藏数，默认为 0
- `views`: 浏览量，默认为 0
- `is_recommended`: 是否推荐，默认为 0
- `status`: 帖子状态，枚举类型 ('published', 'draft', 'hidden', 'deleted')，默认为 'published'

**索引**:
- `idx_posts_userid_created`: (user_id, created_at)，用于用户发布的帖子按时间排序
- `idx_posts_status_created`: (status, created_at)，用于按状态和时间筛选帖子
- `idx_posts_recommend_created`: (is_recommended, created_at)，用于推荐内容按时间排序
- `idx_posts_category_created`: (category_id, created_at)，用于按分类和时间筛选帖子

#### 2. comments - 评论表

存储用户对帖子的评论。

**主要字段**:
- `id`: 主键，自增整数
- `user_id`: 评论者ID，关联 users 表
- `post_id`: 帖子ID，关联 posts 表
- `content`: 评论内容
- `likes`: 点赞数，默认为 0
- `parent_id`: 父评论ID，用于实现评论嵌套
- `status`: 评论状态，枚举类型 ('active', 'hidden', 'deleted')，默认为 'active'

**索引**:
- `idx_comments_postid_parent`: (post_id, parent_id)，用于获取帖子下的评论
- `idx_comments_userid_created`: (user_id, created_at)，用于用户评论历史
- `idx_comments_status`: (status)，用于按状态筛选评论

#### 3. topics - 话题表

存储系统中的话题标签。

**主要字段**:
- `id`: 主键，自增整数
- `name`: 话题名称
- `description`: 话题描述
- `cover_image`: 封面图片地址
- `pending_image`: 待审核的封面图片地址
- `image_status`: 图片状态，枚举类型 ('pending', 'approved', 'rejected')，默认为 'approved'
- `usage_count`: 使用次数，默认为 0
- `views`: 浏览量，默认为 0
- `status`: 话题状态，枚举类型 ('active', 'inactive')，默认为 'active'
- `meta_title`: SEO 标题
- `meta_description`: SEO 描述
- `meta_keywords`: SEO 关键词
- `sensitive_words_level`: 敏感词级别，枚举类型 ('low', 'medium', 'high')，默认为 'medium'
- `auto_review`: 是否自动审核，默认为 1
- `custom_sensitive_words`: 自定义敏感词
- `banned_words`: 禁用词汇

#### 4. post_topics - 帖子话题关联表

存储帖子与话题的多对多关系。

**主要字段**:
- `id`: 主键，自增整数
- `post_id`: 帖子ID，关联 posts 表
- `topic_id`: 话题ID，关联 topics 表

**索引**:
- 唯一索引 `post_topics_post_id_topic_id`: (post_id, topic_id)，确保不重复关联

#### 5. post_views - 帖子浏览记录表

记录用户对帖子的浏览记录。

**主要字段**:
- `id`: 主键，自增整数
- `post_id`: 帖子ID，关联 posts 表
- `user_id`: 用户ID，关联 users 表（可为空，表示未登录用户）
- `ip_address`: IP地址

**索引**:
- `post_id`: 帖子ID
- `user_id`: 用户ID
- `created_at`: 创建时间

### 互动相关表

#### 1. likes - 点赞表

存储用户对帖子或评论的点赞。

**主要字段**:
- `id`: 主键，自增整数
- `user_id`: 用户ID，关联 users 表
- `target_type`: 目标类型，枚举类型 ('post', 'comment')
- `target_id`: 目标ID
- `created_at`: 创建时间

**索引**:
- 唯一索引 `likes_user_id_target_type_target_id`: (user_id, target_type, target_id)，确保用户不能重复点赞同一内容

#### 2. collections - 收藏表

存储用户收藏的帖子。

**主要字段**:
- `id`: 主键，自增整数
- `user_id`: 用户ID，关联 users 表
- `post_id`: 帖子ID，关联 posts 表
- `name`: 收藏夹名称
- `created_at`: 创建时间

**索引**:
- 唯一索引 `collections_user_id_post_id`: (user_id, post_id)，确保用户不能重复收藏同一帖子
- `idx_collections_userid_created`: (user_id, created_at)，用于用户收藏历史

#### 3. messages - 消息表

存储系统消息和用户通知。

**主要字段**:
- `id`: 主键，自增整数
- `sender_id`: 发送者ID，关联 users 表
- `recipient_id`: 接收者ID，关联 users 表
- `type`: 消息类型，枚举类型 ('system', 'comment', 'like', 'mention')，默认为 'system'
- `title`: 消息标题
- `content`: 消息内容
- `is_read`: 是否已读，默认为 0
- `post_id`: 相关帖子ID，关联 posts 表
- `comment_id`: 相关评论ID，关联 comments 表
- `data`: 附加数据，JSON格式字符串

**索引**:
- `idx_messages_recipient_read`: (recipient_id, is_read)，用于用户未读消息查询
- `idx_messages_type_created`: (type, created_at)，用于按类型和时间筛选消息

### 活动相关表

#### 1. events - 活动表

存储系统中的活动信息。

**主要字段**:
- `id`: 主键，自增整数
- `title`: 活动标题
- `description`: 活动描述
- `location`: 活动地点
- `start_time`: 开始时间
- `end_time`: 结束时间
- `cover_image`: 封面图片地址
- `max_participants`: 最大参与人数，默认为 0
- `current_participants`: 当前参与人数，默认为 0
- `status`: 活动状态，枚举类型 ('upcoming', 'ongoing', 'completed', 'canceled', 'full')，默认为 'upcoming'
- `creator_id`: 创建者ID，关联 users 表

**索引**:
- `idx_events_status_start`: (status, start_time)，用于按状态和开始时间筛选活动
- `idx_events_creator_created`: (creator_id, created_at)，用于用户创建的活动
- `idx_events_start_time`: (start_time)，用于按开始时间排序

#### 2. event_participants - 活动参与者表

存储用户参与活动的记录。

**主要字段**:
- `id`: 主键，自增整数
- `event_id`: 活动ID，关联 events 表
- `user_id`: 用户ID，关联 users 表
- `created_at`: 创建时间

#### 3. event_images - 活动图片表

存储活动的图片集。

**主要字段**:
- `id`: 主键，自增整数
- `url`: 图片地址
- `event_id`: 活动ID，关联 events 表
- `order`: 排序序号，默认为 0

#### 4. event_notices - 活动公告表

存储活动的通知和公告。

**主要字段**:
- `id`: 主键，自增整数
- `title`: 公告标题
- `content`: 公告内容
- `event_id`: 活动ID，关联 events 表
- `order`: 排序序号，默认为 0

### 系统相关表

#### 1. settings - 系统设置表

存储系统全局设置。

**主要字段**:
- `id`: 主键，自增整数
- `key`: 设置键名
- `value`: 设置值
- `description`: 设置描述
- `type`: 值类型，默认为 'string'
- `is_system`: 是否为系统设置，默认为 0

#### 2. logs - 系统日志表

记录系统操作日志。

**主要字段**:
- `id`: 主键，自增整数
- `user_id`: 用户ID，关联 users 表
- `action`: 操作类型
- `description`: 操作描述
- `ip`: IP地址
- `user_agent`: 用户代理
- `target`: 操作目标
- `target_id`: 目标ID
- `old_data`: 旧数据，JSON格式字符串
- `new_data`: 新数据，JSON格式字符串

## 主要表关系

1. **用户与帖子**：一对多关系，一个用户可以发布多个帖子
   - `posts.user_id` → `users.id`

2. **用户与评论**：一对多关系，一个用户可以发表多个评论
   - `comments.user_id` → `users.id`

3. **帖子与评论**：一对多关系，一个帖子可以有多个评论
   - `comments.post_id` → `posts.id`

4. **评论与评论**：自关联，实现评论嵌套
   - `comments.parent_id` → `comments.id`

5. **帖子与话题**：多对多关系，通过 post_topics 表连接
   - `post_topics.post_id` → `posts.id`
   - `post_topics.topic_id` → `topics.id`

6. **用户与活动**：一对多关系，一个用户可以创建多个活动
   - `events.creator_id` → `users.id`

7. **用户与活动参与**：多对多关系，通过 event_participants 表连接
   - `event_participants.user_id` → `users.id`
   - `event_participants.event_id` → `events.id`

8. **用户之间的关系**：通过 relationships 表表示关注关系
   - `relationships.follower_id` → `users.id`
   - `relationships.following_id` → `users.id`

## 数据迁移与同步

系统使用 Sequelize 的迁移功能管理数据库结构变更，主要迁移文件包括：

1. `20250518000000-add-seo-and-review-fields-to-topics.js`: 为话题表添加SEO和审核相关字段
2. `20250518092327-add_views_and_recommended_to_posts.js`: 为帖子表添加浏览量和推荐字段
3. `20250520064635-add-image-fields-to-topics.js`: 为话题表添加图片相关字段
4. `20250520071500-add-views-to-topics.js`: 为话题表添加浏览量字段
5. `create-event-indexes.js`: 为活动相关表添加性能优化索引

## 数据库优化

系统对数据库进行了多项性能优化，主要包括：

1. 对高频查询添加了合适的索引，如用户ID、创建时间、状态等字段
2. 使用软删除（Soft Delete）机制，不直接删除数据
3. 实现了连接池管理，提高数据库连接效率
4. 对大型表（如posts、comments）进行了分页查询优化
5. 添加了复合索引以支持常见的筛选和排序操作

## 注意事项

1. 所有表均使用软删除机制，通过 `deleted_at` 字段标记删除状态
2. 所有表均有 `created_at` 和 `updated_at` 字段记录创建和更新时间
3. 表名使用复数形式，字段名使用下划线命名法
4. 外键关系设置为 `ON DELETE SET NULL ON UPDATE CASCADE`，防止级联删除
5. 系统默认使用开发环境配置，如需修改请编辑 `config/config.js` 文件 