# 校园墙 (Campus Wall) 项目综合评估报告

> 评估日期: 2026-01-30
> 评估范围: 后端架构、前端架构、移动端架构、测试覆盖、安全性

---

## 执行摘要

| 维度 | 评分 | 状态 |
|------|------|------|
| **后端架构** | 7.5/10 | 良好，有改进空间 |
| **前端架构 (Admin)** | 7/10 | 良好 |
| **移动端架构 (uni-app)** | 6.5/10 | 中等，需要优化 |
| **测试覆盖** | 2/10 | 严重不足 |
| **安全性** | 4/10 | 存在严重问题 |
| **综合评分** | 5.4/10 | 需要重点改进 |

---

## 目录

1. [后端架构评估](#1-后端架构评估)
2. [移动端架构评估](#2-移动端架构评估)
3. [测试覆盖评估](#3-测试覆盖评估)
4. [安全性评估](#4-安全性评估)
5. [优先级修复清单](#5-优先级修复清单)
6. [架构优化建议](#6-架构优化建议)

---

## 1. 后端架构评估

### 1.1 架构优势

项目采用了**良好的4层架构**设计：

```
Controller (19个) → Service (25个) → Repository (18个) → Model (29个)
```

**优点：**
- ✅ 清晰的文件命名规范 (`*.service.js`, `*.repository.js`, `*.controller.js`)
- ✅ 集中式中间件索引 (`middlewares/index.js`)
- ✅ 一致的类模式与单例导出
- ✅ 完善的错误码系统 (`error-codes.js` 包含 95+ 错误码)
- ✅ 批量状态查询模式 (见 `post.service.js` 第 412-416 行)

### 1.2 关键问题

#### 问题1：层级违规 - Service 直接访问 Model (高优先级)

**位置**: `user.service.js` 第 265-304 行, `post.service.js` 第 634-672 行

```javascript
// 错误: Service 直接导入并使用 Model，绕过了 Repository
const { Post, Comment, Favorite, Follow } = require('../models');
const postCount = await Post.count({
  where: { user_id: userId, status: 'published' }
});
```

**影响**: 违反关注点分离，使测试更困难
**修复**: 将所有数据库查询移至对应的 Repository

#### 问题2：循环导入模式

**位置**: `post.service.js` 第 85-86 行, 第 297-298 行

```javascript
// 错误: 方法体内的 require 创建隐藏依赖
async createPost(postData, images = [], topicNames = []) {
  const topicService = require('./topic.service');  // 内联 require
}
```

#### 问题3：重复的 `_generateToken` 方法

**位置**: `user.service.js` 第 572-578 行 和 第 678-684 行

同一个类中定义了两次相同的方法。

#### 问题4：God Class 反模式

| 文件 | 行数 | 问题 |
|------|------|------|
| `user.service.js` | 1239 行 | 处理过多职责 |
| `post.service.js` | 833 行 | 应该拆分 |

**建议**: 将 `user.service.js` 拆分为 `AuthService`, `ProfileService`, `UserStatsService`, `PrivacyService`

#### 问题5：路由顺序错误 (Bug)

**位置**: `post.routes.js` 第 91-93 行

```javascript
// 这些路由无法访问，因为 /:id 会先匹配
router.get('/:id', AuthMiddleware.optionalAuthenticate(), postController.getPostDetail);
// ... 后面 ...
router.get('/user/favorites', AuthMiddleware.authenticate(), postController.getUserFavorites);
router.get('/user/me', AuthMiddleware.authenticate(), postController.getUserPosts);
```

**影响**: `/user/favorites` 和 `/user/me` 会匹配到 `/:id`，id="user"
**修复**: 将具体路由放在参数化路由之前

#### 问题6：N+1 查询问题 (严重性能问题)

**位置**: `post.service.js` 第 525-563 行, `comment.service.js` 第 480-518 行

```javascript
// N+1 查询: 每条评论触发一次数据库查询
for (const comment of comments.list) {
  if (currentUserId) {
    comment.dataValues.is_liked = await commentRepository.isLikedByUser(comment.id, currentUserId);
  }
  
  if (comment.replies && comment.replies.length > 0) {
    for (const reply of comment.replies) {
      // 嵌套循环中又一个 N+1!
      reply.dataValues.is_liked = await commentRepository.isLikedByUser(reply.id, currentUserId);
    }
  }
}
```

**影响**: 20 条评论，每条 3 个回复 = 每次页面加载 80+ 次数据库查询！

**修复方案**:
```javascript
// 预先批量查询所有点赞状态
const allCommentIds = comments.flatMap(c => [c.id, ...c.replies.map(r => r.id)]);
const likeStates = await commentRepository.getLikeStatesForUser(currentUserId, allCommentIds);
```

#### 问题7：混合验证库

**当前状态**: 同时使用 `Joi` 和 `express-validator`

根据 AGENTS.md 规范，应该统一使用 Joi。

---

## 2. 移动端架构评估

### 2.1 架构优势

- ✅ 正确使用条件编译 (`#ifdef H5`, `#ifdef APP-PLUS || MP`)
- ✅ SSR 兼容的应用创建 (`createSSRApp()`)
- ✅ 使用 `easycom` 自动导入组件
- ✅ API 工厂模式 (`export default (http) => ({...})`)
- ✅ 乐观 UI 更新模式

### 2.2 关键问题

#### 问题1：286 个 console.log 语句 (高优先级)

**分布**: 29 个文件
**主要文件**: home.vue (28), message.vue (25), follow.vue (20)

**影响**: 生产环境日志污染，性能影响
**修复**: 使用 `utils/logger.js` 或构建时移除

#### 问题2：混合 API 风格

```javascript
// home.vue 使用 Options API (第 103-894 行)
export default {
  components: { PostList, Banner },
  data() { return {...} },
  methods: {...}
}

// Banner.vue 使用 Composition API (第 90 行)
<script setup>
import { ref, computed, onMounted } from 'vue'
```

**建议**: 统一使用 `<script setup>` Composition API

#### 问题3：Store 目录不一致

```
stores/             # 新模式
├── followStore.js
└── emoji.js

store/              # 旧模式
├── index.js
└── modules/
    ├── user.js
    └── message.js
```

**修复**: 整合到 `stores/` 目录，统一持久化配置

#### 问题4：重复组件

| 文件 | 状态 |
|------|------|
| `components/UserCard.vue` | 删除 |
| `components/user/UserCard.vue` | 保留 |

#### 问题5：大型单体组件

| 文件 | 行数 | 建议 |
|------|------|------|
| `publish.vue` | 1462 行 | 拆分 |
| `home.vue` | 1165 行 | 拆分 |
| `PostCard.vue` | 996 行 | 拆分评论预览 |
| `request.js` | 629 行 | 分离错误处理 |

#### 问题6：缺少生命周期清理

| 生命周期 | 使用次数 | 问题 |
|----------|----------|------|
| `onLoad` | 32 | - |
| `onShow` | 6 | - |
| `onHide` | 0 | **缺失** |
| `onUnload` | 8 | 需要更多 |

**影响**: 定时器、监听器未清理可能导致内存泄漏

#### 问题7：硬编码回退 URL

**位置**: `utils/url.js` 第 46 行

```javascript
return 'http://localhost:3000'; // 硬编码兜底 - 不良实践
```

---

## 3. 测试覆盖评估

### 3.1 测试文件清单

| 位置 | 文件数 | 状态 |
|------|--------|------|
| server/tests/ | 1 (follow.test.js) | **严重不足** |
| admin/ | 0 | **无测试** |
| uni-APP/ | 0 | **无测试** |

**预估覆盖率**: ~1.5% (1 个测试文件覆盖 25 个路由模块中的 1 个)

### 3.2 模块覆盖分析

| 模块 | 端点数 | 测试文件 | 覆盖率 |
|------|--------|----------|--------|
| Follow | 12 | follow.test.js | **部分** |
| User | 17 | 无 | **0%** |
| Post | 14 | 无 | **0%** |
| Comment | 10 | 无 | **0%** |
| Event | 17 | 无 | **0%** |
| Admin routes | 100+ | 无 | **0%** |

**预估**: 276 个 API 端点，仅约 10 个被测试

### 3.3 现有测试问题

#### 假 Token 认证 (严重问题)

```javascript
// follow.test.js 第 41-42 行: 硬编码的假 token
user1Token = 'Bearer test-token-1';
user2Token = 'Bearer test-token-2';
```

**影响**: 所有需要认证的测试都会失败

### 3.4 缺失的测试基础设施

| 项目 | 状态 |
|------|------|
| `__mocks__/` 目录 | **未找到** |
| jest.mock() 使用 | **未找到** |
| 数据库 Mock | **未实现** |
| 认证中间件 Mock | **未实现** |
| CI/CD 配置 | **无** |
| jest.config.js | **无** |

---

## 4. 安全性评估

### 4.1 严重问题

#### 问题1：生产环境凭证泄露 (紧急)

**文件**: `/server/.env.production` 已提交到仓库

```
DB_PASSWORD=20060711syj
REDIS_PASSWORD=20060711
JWT_SECRET=campus_wall_production_secret_key_2025
SERVER_DOMAIN=callxyq.xyz
```

#### 问题2：硬编码默认密码

**位置**: `/server/config/database.js` 第 6 行
```javascript
password: process.env.DB_PASSWORD || '20060711'
```

**位置**: `/server/config/jwt.js` 第 5 行
```javascript
secret: process.env.JWT_SECRET || 'campus_community_development_secret'
```

### 4.2 中等问题

| 问题 | 位置 | 风险等级 |
|------|------|----------|
| CORS 允许所有来源 (`origin: '*'`) | app.js | 中 |
| 密码最小长度仅 6 字符 | 验证规则 | 中 |
| 无密码复杂度要求 | 验证规则 | 中 |
| 无 JWT Token 黑名单 | 无法强制登出 | 中 |
| 无 XSS 清理中间件 | 中间件层 | 中 |
| 文件上传仅 MIME 验证 | upload.middleware.js | 中 |

### 4.3 良好实践

- ✅ 使用 bcrypt 进行密码哈希 (salt rounds: 10)
- ✅ 全面的 Rate Limiting (登录: 10次/小时, 注册: 5次/小时)
- ✅ 使用 Helmet 中间件
- ✅ Sequelize 参数化查询防止 SQL 注入
- ✅ UUID 文件名生成防止路径遍历

---

## 5. 优先级修复清单

### 紧急 (本周内)

| # | 问题 | 位置 | 影响 |
|---|------|------|------|
| 1 | 移除 `.env.production` | 仓库 | 安全 |
| 2 | 轮换所有暴露的凭证 | 生产环境 | 安全 |
| 3 | 添加 `.env.production` 到 `.gitignore` | 根目录 | 安全 |
| 4 | 修复路由顺序错误 | post.routes.js | Bug |

### 高优先级 (本月内)

| # | 问题 | 位置 | 影响 |
|---|------|------|------|
| 5 | 修复 N+1 查询 | post.service.js, comment.service.js | 性能 |
| 6 | 移除 286 个 console.log | 29 个文件 | 性能/日志 |
| 7 | 整合 Store 目录 | uni-APP/stores/ | 架构 |
| 8 | 删除重复 UserCard | components/UserCard.vue | 维护 |
| 9 | 实现 JWT Token 黑名单 | auth.middleware.js | 安全 |
| 10 | 移除 CORS `origin: '*'` | 生产配置 | 安全 |

### 中优先级 (本季度)

| # | 问题 | 位置 | 影响 |
|---|------|------|------|
| 11 | 添加测试基础设施 | server/tests/ | 质量 |
| 12 | 实现 CI/CD | GitHub Actions | 流程 |
| 13 | 拆分 God Class | user.service.js | 架构 |
| 14 | 统一验证库为 Joi | routes/*.js | 一致性 |
| 15 | 强化密码策略 | 验证规则 | 安全 |
| 16 | 统一 Vue API 风格 | uni-APP 页面 | 架构 |

---

## 6. 架构优化建议

### 6.1 后端架构改进

#### 推荐目录结构

```
server/
├── src/
│   ├── modules/           # 按功能模块组织
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.repository.js
│   │   │   └── auth.routes.js
│   │   ├── user/
│   │   ├── post/
│   │   └── ...
│   ├── shared/            # 共享模块
│   │   ├── middlewares/
│   │   ├── utils/
│   │   └── errors/
│   └── config/
└── tests/
    ├── setup.js
    ├── helpers/
    │   ├── auth.helper.js
    │   └── db.helper.js
    ├── unit/
    └── integration/
```

#### Service 层重构

```javascript
// 当前: user.service.js (1239 行)
// 建议拆分为:

// auth.service.js - 登录、注册、Token 管理
// profile.service.js - 个人资料管理
// user-stats.service.js - 统计数据
// privacy.service.js - 隐私设置
```

### 6.2 移动端架构改进

#### Store 整合

```
stores/                    # 统一目录
├── userStore.js           # 从 store/modules/user.js 迁移
├── messageStore.js        # 从 store/modules/message.js 迁移
├── followStore.js
├── emojiStore.js
└── index.js               # 统一导出
```

#### 路由常量

```javascript
// routes/index.js
export const ROUTES = {
  LOGIN: '/pages/auth/login/index',
  POST_DETAIL: (id) => `/pages/post/detail?id=${id}`,
  USER_PROFILE: (id) => `/pages/user/profile?id=${id}`,
  // ...
};
```

### 6.3 测试策略

#### 推荐测试金字塔

```
        E2E Tests (5%)
       /            \
    Integration (25%)
   /                  \
  Unit Tests (70%)
```

#### 优先测试模块

1. **认证流程** - login/register
2. **帖子 CRUD** - 核心功能
3. **评论系统** - 高频交互
4. **Admin 认证** - 权限关键

### 6.4 安全加固

1. **密码策略**: 8+ 字符，包含大小写字母和数字
2. **JWT 改进**: 实现 refresh token 轮换
3. **CORS**: 生产环境使用白名单
4. **文件上传**: 添加 magic byte 验证
5. **Secrets 管理**: 考虑使用 HashiCorp Vault 或云服务

---

## 附录

### A. 代码审查检查清单

#### 后端
- [ ] 层级架构遵循 (Controller → Service → Repository)
- [ ] 异步错误包装器用于所有路由
- [ ] 集中式错误中间件 (放在最后)
- [ ] 基于环境的配置
- [ ] Controller 中无业务逻辑

#### 数据库
- [ ] 使用迁移 (生产环境禁用 `sync()`)
- [ ] 使用 `attributes` 选择性获取字段
- [ ] 所有列表查询使用分页
- [ ] 多写操作使用事务
- [ ] 查询列添加索引

#### 前端
- [ ] 使用 `<script setup>` 语法
- [ ] Composables 使用 `use` 前缀命名
- [ ] 使用 `storeToRefs()` 解构 store 状态
- [ ] 实现错误边界
- [ ] 清理副作用 (onUnmounted/onHide)

---

*报告由 AI 代码审计工具生成*
*如需详细代码级别的修复建议，请针对具体问题咨询*
