# 校园墙小程序架构文档

## 项目概述
校园墙小程序是一个基于uni-app框架开发的跨平台应用，旨在为校园用户提供信息分享、交流互动的平台。采用前后端分离架构，前端使用uni-app (Vue 3 + Vite)开发，后端提供API服务，并配备管理后台。

## 设计风格
- 现代极简风格：简洁优雅的界面设计
- 渐变配色方案：使用渐变色彩增强视觉吸引力
- 卡片式布局：信息以卡片形式呈现，层次分明
- 精心打磨的圆角设计：营造柔和友好的视觉体验
- 细腻的微交互：增强用户体验和反馈
- 舒适的留白与间距：提高内容可读性
- 纯CSS图标：特别是点赞、收藏等交互图标

## 技术栈
- 前端框架：uni-app (Vue 3 + Vite)
- 状态管理：Pinia
- 请求库：uni.request (封装)
- CSS预处理：SCSS
- 图标：纯CSS图标 (特别是点赞、收藏等交互图标)
- 后端：Node.js + Express
- 数据库：MySQL + Redis
- 实时通信：WebSocket

## 目录结构
```
uni-APP/
├── src/                      # 源代码
│   ├── api/                  # API请求封装
│   │   ├── index.js          # API入口
│   │   ├── request.js        # 请求封装
│   │   └── modules/          # API模块
│   │       ├── user.js       # 用户相关API
│   │       ├── post.js       # 帖子相关API
│   │       └── comment.js    # 评论相关API
│   ├── components/           # 通用组件
│   │   ├── common/           # 基础组件
│   │   │   ├── AppHeader.vue # 通用头部
│   │   │   ├── AppTabBar.vue # 底部导航
│   │   │   ├── AppIcon.vue   # 纯CSS图标
│   │   │   └── ...
│   │   ├── post/             # 帖子相关组件
│   │   │   ├── PostCard.vue  # 帖子卡片
│   │   │   ├── PostList.vue  # 帖子列表
│   │   │   └── ...
│   │   └── ...
│   ├── hooks/                # 自定义hooks
│   │   └── ...
│   ├── pages/                # 页面
│   │   ├── index/            # 首页
│   │   │   └── home.vue      # 首页内容
│   │   ├── discover/         # 发现页
│   │   │   └── discover.vue  # 发现页内容
│   │   ├── post/             # 帖子详情页
│   │   │   └── detail.vue    # 帖子详情内容
│   │   ├── publish/          # 发布页
│   │   │   └── publish.vue   # 发布页内容
│   │   ├── message/          # 消息页
│   │   │   └── message.vue   # 消息页内容
│   │   ├── profile/          # 个人中心
│   │   │   └── profile.vue   # 个人中心内容
│   │   └── auth/             # 认证相关(子包)
│   │       ├── login/        # 登录页
│   │       │   └── index.vue # 登录页内容
│   │       └── register/     # 注册页
│   │           └── index.vue # 注册页内容
│   ├── static/               # 静态资源
│   │   ├── images/           # 图片
│   │   │   ├── common/       # 通用图片
│   │   │   ├── tabbar/       # 底部导航图标
│   │   │   └── ...
│   │   └── ...
│   ├── store/                # 状态管理
│   │   ├── index.js          # Store入口
│   │   └── modules/          # Store模块
│   │       ├── user.js       # 用户状态
│   │       └── ...
│   ├── styles/               # 全局样式
│   │   ├── variables.scss    # 变量定义
│   │   ├── mixins.scss       # 混合函数
│   │   ├── reset.scss        # 重置样式
│   │   └── common.scss       # 通用样式
│   ├── utils/                # 工具函数
│   │   ├── index.js          # 工具入口
│   │   ├── auth.js           # 认证相关
│   │   ├── date.js           # 日期处理
│   │   └── ...
│   ├── App.vue               # 应用入口组件
│   ├── main.js               # 应用入口
│   ├── pages.json            # 页面配置
│   ├── manifest.json         # 应用配置
│   └── uni.scss              # 全局样式变量
└── campus-wall-architecture.md # 架构文档
```

## 功能模块

### 1. 认证模块
- 用户登录/注册
- 账号验证
- 密码找回
- 登录状态管理

### 2. 首页模块
- 帖子流展示
- 分类筛选
- 热门/最新切换
- 下拉刷新/上拉加载
- 空状态处理

### 3. 发现模块
- 话题发现
- 热门推荐
- 校园活动

### 4. 发布模块
- 文字内容发布
- 图片上传
- 话题选择
- 位置标记

### 5. 帖子详情模块
- 帖子内容展示
- 评论列表
- 发表评论
- 点赞/收藏功能

### 6. 消息模块
- 评论通知
- 点赞通知
- 系统通知
- 私信功能

### 7. 个人中心模块
- 用户信息展示
- 我的帖子
- 我的收藏
- 设置

## 页面路由

| 路径 | 页面 | 说明 |
| --- | --- | --- |
| /pages/index/home | 首页 | 展示帖子流 |
| /pages/discover/discover | 发现页 | 发现内容和话题 |
| /pages/post/detail | 帖子详情 | 展示帖子内容和评论 |
| /pages/publish/publish | 发布页 | 创建新帖子 |
| /pages/message/message | 消息页 | 展示消息通知 |
| /pages/profile/profile | 个人中心 | 展示用户信息 |
| /pages/auth/login/index | 登录页 | 用户登录 |
| /pages/auth/register/index | 注册页 | 用户注册 |

## 组件设计

### 公共组件
- AppHeader：顶部导航栏，支持自定义按钮和返回
- AppTabBar：底部导航栏，支持五个主要入口
- AppIcon：纯CSS图标组件，实现点赞、收藏等交互图标
- AppEmpty：空状态展示
- AppLoading：加载状态
- AppAvatar：用户头像
- AppButton：按钮组件
- AppTag：标签组件

### 业务组件
- PostCard：帖子卡片，展示帖子内容摘要和交互按钮
- PostList：帖子列表，支持下拉刷新和上拉加载
- CommentItem：评论项
- CommentList：评论列表
- UserInfo：用户信息展示
- ImagePreview：图片预览
- TagList：标签列表

## 交互特性
- 下拉刷新：支持首页和个人中心的下拉刷新
- 上拉加载：帖子列表支持上拉加载更多
- 微交互：点赞、收藏等操作有平滑动画反馈
- 页面过渡：页面切换有平滑过渡效果
- 加载状态：各种操作有明确的加载状态提示
- 空状态：无数据时有友好的空状态展示

## 状态管理
使用Pinia进行状态管理，主要包含以下Store：

- UserStore：用户信息、登录状态
- PostStore：帖子数据缓存
- MessageStore：消息通知

## API接口规划

### 用户相关
- POST /api/users/login：用户登录
- POST /api/users/register：用户注册
- GET /api/users/info：获取用户信息
- PUT /api/users/info：更新用户信息
- GET /api/users/:id/followings：获取用户关注列表
- GET /api/users/:id/followers：获取用户粉丝列表
- GET /api/users/:id/followings/count：获取用户关注数量
- GET /api/users/:id/followers/count：获取用户粉丝数量

### 帖子相关
- GET /api/posts：获取帖子列表
- GET /api/posts/:id：获取帖子详情
- POST /api/posts：创建帖子
- DELETE /api/posts/:id：删除帖子
- GET /api/posts/hot：获取热门帖子

### 交互相关
- POST /api/likes/:targetType/:targetId：点赞目标
- DELETE /api/likes/:targetType/:targetId：取消点赞
- POST /api/favorites/:targetType/:targetId：收藏目标
- DELETE /api/favorites/:targetType/:targetId：取消收藏
- POST /api/follows/:userId：关注用户
- DELETE /api/follows/:userId：取消关注用户
- GET /api/follows/:userId/check：检查是否已关注用户
- GET /api/follows/:userId/common：获取共同关注

### 评论相关
- GET /api/posts/:id/comments：获取评论列表
- POST /api/posts/:id/comments：发表评论
- DELETE /api/comments/:id：删除评论
- GET /api/comments/:id/replies：获取评论回复
- POST /api/comments/:id/replies：回复评论

### 消息相关
- GET /api/messages：获取消息列表
- GET /api/messages/:id：获取消息详情
- PUT /api/messages/:id/read：标记消息已读
- DELETE /api/messages/:id：删除消息
- PUT /api/messages/read/batch：批量标记已读
- DELETE /api/messages/batch：批量删除消息
- GET /api/messages/unread/count：获取未读消息数量

### 分类与话题
- GET /api/categories：获取分类列表
- GET /api/topics：获取话题列表
- GET /api/topics/:id：获取话题详情
- GET /api/topics/:id/posts：获取话题下的帖子

## UI设计规范

### 色彩系统
- 主色调：#5B8EF9（清新蓝）
- 辅助色：#FF6B6B（活力红）、#48DBB4（清新绿）
- 渐变色：linear-gradient(135deg, #5B8EF9, #7BA6FF)（主渐变）
- 背景色：#F8F9FE（浅灰背景）
- 文字色：
  - 主文本：#333333
  - 次要文本：#666666
  - 辅助文本：#999999
  - 浅色文本：#CCCCCC
- 边框/分割线：#EAEAEA
- 卡片背景：#FFFFFF

### 字体规范
- 主标题：20px，粗体
- 次级标题：18px，中等
- 正文：16px，常规
- 辅助文本：14px，常规
- 小字提示：12px，常规

### 圆角规范
- 大圆角：16rpx（卡片、按钮）
- 中圆角：8rpx（输入框、提示框）
- 小圆角：4rpx（标签、徽标）

### 间距规范
- 页面边距：30rpx
- 卡片内边距：24rpx
- 元素间距：
  - 大间距：20rpx
  - 中间距：16rpx
  - 小间距：12rpx
  - 微间距：8rpx

### 阴影规范
- 卡片阴影：0 4rpx 16rpx rgba(0, 0, 0, 0.08)
- 浮动按钮：0 8rpx 24rpx rgba(91, 142, 249, 0.24)
- 弹出层：0 12rpx 32rpx rgba(0, 0, 0, 0.12)

## 性能优化策略
- 图片懒加载与压缩
- 列表虚拟滚动
- 状态缓存管理
- 请求合并与防抖
- 组件按需加载
- 页面预加载

## 跨平台适配
- 微信小程序优先适配
- H5兼容处理
- 条件编译处理平台差异
- 屏幕尺寸自适应
- 安全区域适配

## 安全考虑
- 数据传输加密
- 敏感信息脱敏
- 防XSS攻击
- 内容审核机制
- 用户权限控制

## 特殊处理
- 下拉刷新：全局统一处理下拉刷新样式和行为
- 状态栏适配：适配不同机型的状态栏高度
- 安全区域：考虑全面屏手机的底部安全区域
- 图标实现：核心交互图标使用纯CSS实现，避免字体图标
- WebSocket实时通信：支持消息推送、未读计数、在线状态等功能

## 前后端集成
前端应用通过封装的API模块与后端服务进行数据交互，主要包括：

### HTTP请求集成
- 统一请求封装：封装uni.request为Promise风格API
- 请求拦截器：处理认证令牌、请求参数等
- 响应拦截器：统一处理响应、错误处理、状态码等
- 接口模块化：按业务功能拆分API模块，便于维护

### WebSocket实时通信
- 自动连接：登录成功后自动建立WebSocket连接
- 断线重连：网络异常时自动尝试重新连接，最多5次，间隔3秒
- 心跳检测：每30秒发送ping消息保持连接活跃
- 消息处理：基于事件的消息订阅与处理机制

#### WebSocket连接流程
1. 用户登录成功，获取JWT令牌
2. 前端创建WebSocket连接，URL格式为：`ws://server-address/ws?token=xxx`
3. 服务端验证token有效性，建立连接并关联用户ID
4. 连接成功后，服务端发送未读消息计数
5. 前端开始心跳检测

#### WebSocket消息格式
服务端发送给客户端的消息格式：
```json
{
  "type": "消息类型",
  "data": {
    // 消息内容，根据type不同而不同
  }
}
```

主要消息类型：
- `new_notification`: 新通知
- `unread_count_updated`: 未读消息数更新
- `user_online_status`: 用户在线状态变更
- `pong`: 心跳响应

客户端发送给服务端的消息格式：
```json
{
  "type": "消息类型",
  "data": {
    // 消息内容
  }
}
```

主要消息类型：
- `ping`: 心跳检测

### 数据流向
1. **用户认证流程**：
   - 用户登录 → 获取令牌 → 存储令牌 → 建立WebSocket连接
   - 后续请求自动携带令牌进行身份验证

2. **实时通知流程**：
   - 用户操作触发通知 → 后端通过WebSocket推送消息 → 前端接收并处理通知
   - 支持的通知类型：评论、点赞、关注、系统通知等

3. **社交互动流程**：
   - 关注用户：前端请求关注API → 后端处理关系并通知被关注者 → 实时更新关注状态
   - 点赞/评论：操作后实时通知内容创建者 → 消息计数更新

### 缓存策略
- 列表数据：缓存首页帖子列表、用户信息等，减少请求次数
- 图片缓存：使用uni-app内置的图片缓存机制
- 用户信息：登录状态、个人资料等存储在本地
- 消息未读计数：通过WebSocket实时更新，保持最新状态

## 迁移与维护

### 从初版迁移
本项目基于校园墙初版（uni-APP初版）进行重构和功能增强：

**迁移策略**：
- 保留核心业务逻辑，重新设计技术架构
- 采用现代化的分层架构替代原有结构
- 优化数据库设计和API接口
- 重构前端组件，提升用户体验

**已知兼容性问题**：
- 数据库字段变更：`signature` → `bio`
- API接口规范化调整
- 前端组件重构

**迁移文档**：详见 `docs/migration-fixes.md`

### 维护指南
- 定期检查数据库字段一致性
- 保持前后端API接口同步
- 及时更新依赖包版本
- 监控系统性能和错误日志

## 后续开发计划
- 版本1.0：基础功能实现（已完成）
  - 完成所有页面UI和交互
  - 实现基础数据流
  - 前后端对接
- 版本1.1：社交功能增强（当前）
  - ✅ 实现用户关注功能
  - ✅ 修复数据库兼容性问题
  - 🔄 优化动画和交互体验
  - 🔄 实现实时消息通知
  - 🔄 WebSocket实时通信
- 版本1.2：性能优化与体验提升
  - 优化页面加载性能
  - 增强缓存策略
  - 改进数据预加载
  - 优化弱网环境体验
- 版本2.0：增加话题与活动功能
  - 话题专区功能
  - 校园活动发布与报名
  - 高级搜索功能
  - 用户个性化推荐