# 内容管理功能实现文档

## 概述

本文档记录了校园墙系统内容管理功能的完整实现，包括敏感词过滤、内容长度验证、发布限制等核心功能，以及相应的前端错误处理机制。

## 功能列表

### 1. 敏感词过滤系统
- **文件位置**: `server/src/middlewares/sensitive-word.middleware.js`
- **功能描述**: 自动检测和处理用户发布内容中的敏感词汇
- **处理方式**: 
  - `replace`: 替换为星号 (***) 
  - `reject`: 直接拒绝发布
  - `audit`: 提交管理员审核

### 2. 内容长度验证系统
- **文件位置**: `server/src/middlewares/content-length.middleware.js`
- **功能描述**: 验证帖子和评论的字符长度限制
- **验证规则**:
  - 帖子内容: 5-1000字符（可配置）
  - 评论内容: 1-500字符
  - 支持多字段同时验证

### 3. 发布限制系统
- **文件位置**: `server/src/middlewares/publish-limit.middleware.js`
- **功能描述**: 限制用户每日发布内容的数量
- **限制规则**:
  - 每日发帖限制: 默认10篇（可配置）
  - 每日评论限制: 默认50条（可配置）
  - 按自然日重置

### 4. 自动审核关键词
- **功能描述**: 基于关键词自动处理内容审核
- **实现方式**: 
  - 自动通过关键词: 包含指定词汇自动审核通过
  - 自动拒绝关键词: 包含指定词汇自动拒绝

## 系统设置配置

### 管理后台设置项

#### 审核设置
- `enableAudit`: 是否开启内容审核
- `autoApproveKeywords`: 自动审核通过关键词
- `autoRejectKeywords`: 自动审核拒绝关键词

#### 发布限制
- `allowAnonymous`: 是否允许匿名发帖
- `dailyPostLimit`: 每日发帖数量限制
- `dailyCommentLimit`: 每日评论数量限制
- `minPostLength`: 帖子最小字数
- `maxPostLength`: 帖子最大字数

#### 敏感词过滤
- `enableSensitiveFilter`: 是否启用敏感词过滤
- `sensitiveWordAction`: 敏感词处理方式
- `sensitiveWords`: 敏感词列表（逗号分隔）

#### 图片设置
- `allowImageUpload`: 是否允许上传图片
- `maxImageSize`: 单张图片大小限制(MB)
- `maxImagesPerPost`: 每个帖子最多图片数
- `allowedImageTypes`: 允许的图片格式

#### 互动设置
- `maxReplyLevel`: 评论最大层级

## 技术实现

### 中间件架构

```javascript
// 帖子创建路由中间件顺序
router.post('/', 
  AuthMiddleware.authenticate(),           // 用户认证
  PublishLimitMiddleware.postLimiter(),    // 发布限制检查
  ContentLengthMiddleware.validateMultipleFields([...]), // 内容长度验证
  SensitiveWordMiddleware.multiContentFilter([...]),     // 敏感词过滤
  RateLimitMiddleware.postLimiter(),       // 频率限制
  Validator.validateBody(createPostSchema), // 数据验证
  postController.createPost                // 业务逻辑
);
```

### 数据库设计

所有配置项存储在 `settings` 表中：

```sql
CREATE TABLE settings (
  id VARCHAR(36) PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description VARCHAR(255),
  type ENUM('string', 'number', 'boolean', 'json'),
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### API接口

#### 用户发布统计
- **接口**: `GET /api/user/publish-stats`
- **功能**: 获取用户今日发布统计信息
- **返回数据**:
```json
{
  "posts": {
    "todayCount": 3,
    "dailyLimit": 10,
    "remaining": 7,
    "canPublish": true
  },
  "comments": {
    "todayCount": 15,
    "dailyLimit": 50,
    "remaining": 35,
    "canPublish": true
  },
  "resetTime": "2024-01-25T23:59:59.999Z"
}
```

## 前端错误处理

### 错误类型定义

| 错误类型 | 状态码 | 处理方式 | 用户体验 |
|---------|--------|----------|----------|
| `SENSITIVE_WORDS_DETECTED` | 400 | Modal弹窗 | 显示具体敏感词列表 |
| `CONTENT_TOO_SHORT` | 400 | Toast提示 | 显示最小字数要求 |
| `CONTENT_TOO_LONG` | 400 | Toast提示 | 显示最大字数限制 |
| `DAILY_POST_LIMIT_EXCEEDED` | 429 | Modal弹窗 | 显示今日使用情况 |
| `DAILY_COMMENT_LIMIT_EXCEEDED` | 429 | Modal弹窗 | 显示今日使用情况 |
| `CONTENT_REQUIRED` | 400 | Toast提示 | 提示输入内容 |
| `VALIDATION_ERROR` | 400 | Toast提示 | 显示验证失败原因 |

### 错误处理实现

```javascript
// 前端错误处理函数
const handleSpecificError = (errorData) => {
  const { errorType, message, detectedWords, todayCount, dailyLimit } = errorData;
  
  switch (errorType) {
    case 'SENSITIVE_WORDS_DETECTED':
      uni.showModal({
        title: '内容包含敏感词',
        content: `检测到敏感词：${detectedWords?.join(', ')}，请修改后重试`,
        showCancel: false,
        confirmText: '我知道了'
      });
      break;
    // ... 其他错误类型处理
  }
};
```

## 文件结构

```
server/src/
├── middlewares/
│   ├── sensitive-word.middleware.js     # 敏感词过滤中间件
│   ├── content-length.middleware.js     # 内容长度验证中间件
│   ├── publish-limit.middleware.js      # 发布限制中间件
│   └── index.js                        # 中间件导出文件
├── routes/
│   ├── post.routes.js                  # 帖子路由（已集成中间件）
│   ├── comment.routes.js               # 评论路由（已集成中间件）
│   └── user.routes.js                  # 用户路由（新增统计接口）
└── migrations/
    └── 20250110-create-settings-table.js # 数据库迁移文件

uni-APP/src/
├── api/
│   ├── request.js                      # 请求拦截器（错误处理）
│   └── modules/
│       └── user.js                     # 用户API（新增统计接口）
└── ...

admin/src/
└── views/
    └── Settings.vue                    # 管理后台设置页面
```

## 使用示例

### 1. 敏感词过滤示例

**用户输入**: "这是一个赌博网站推广"
**系统处理**: 
- `replace`模式: "这是一个***网站推广"
- `reject`模式: 直接拒绝并提示用户
- `audit`模式: 提交管理员审核

### 2. 长度验证示例

**用户输入**: "好"（1个字符）
**系统响应**: "内容至少需要5个字符，当前只有1个字符"

### 3. 发布限制示例

**场景**: 用户今日已发布10篇帖子（达到限制）
**系统响应**: "您今日已发布10篇帖子，已达到每日10篇的限制。请明天后再试。"

## 配置建议

### 生产环境推荐配置

```javascript
// 内容设置推荐值
{
  enableAudit: true,                    // 开启内容审核
  dailyPostLimit: 5,                    // 每日发帖5篇
  dailyCommentLimit: 30,                // 每日评论30条
  minPostLength: 10,                    // 最少10字符
  maxPostLength: 500,                   // 最多500字符
  enableSensitiveFilter: true,          // 开启敏感词过滤
  sensitiveWordAction: 'audit',         // 敏感词提交审核
  maxReplyLevel: 3                      // 最多3级回复
}
```

## 维护说明

### 1. 敏感词库维护
- 定期更新敏感词列表
- 根据实际情况调整处理策略
- 监控敏感词检测日志

### 2. 限制参数调整
- 根据用户活跃度调整发布限制
- 根据内容质量调整长度限制
- 定期评估限制效果

### 3. 错误监控
- 监控各类错误的触发频率
- 分析用户行为模式
- 优化错误提示文案

## 已知问题和临时解决方案

### 1. 话题管理API缺失问题

**问题描述**:
- 管理后台设置页面中的"推荐话题设置"功能需要调用 `/api/admin/topics` 接口
- 当前新版本服务器中缺少管理员话题管理API实现
- 导致设置页面加载时出现404错误

**临时解决方案**:
- 将推荐话题选择器改为文本输入框
- 暂时禁用话题列表获取功能
- 推荐话题ID以逗号分隔的字符串形式存储

**待完成工作**:
- [ ] 实现管理员话题控制器 (`AdminTopicController`)
- [ ] 添加管理员话题路由 (`/api/admin/topics`)
- [ ] 恢复可视化话题选择功能

**影响范围**:
- 管理后台设置页面正常加载
- 推荐话题功能暂时只能手动输入ID

## 更新日志

### v1.0.1 (2024-01-25)
- 🐛 修复管理后台设置页面话题API 404错误
- 🔧 临时禁用推荐话题可视化选择功能
- 📝 添加已知问题说明文档

### v1.0.0 (2024-01-25)
- ✅ 实现敏感词过滤系统
- ✅ 实现内容长度验证系统
- ✅ 实现发布限制系统
- ✅ 完善前端错误处理机制
- ✅ 更新管理后台设置界面
- ✅ 集成所有中间件到路由系统

---

**文档维护**: 请在功能更新时及时更新此文档
**最后更新**: 2024-01-25
**版本**: v1.0.1
