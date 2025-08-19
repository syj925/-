# 🎯 统一缓存配置使用指南

## 📝 简介

为了解决缓存时间分散在不同文件中难以维护的问题，我们创建了统一的缓存配置系统 `server/config/cache.js`。

## 🏗️ 配置结构

### 1. **用户状态缓存** - `USER_STATUS`
```javascript
USER_STATUS: {
  TTL: 24 * 60 * 60,          // 24小时 - 用户行为状态
  COUNT_TTL: 5 * 60,          // 5分钟 - 用户统计数据（关注数、粉丝数等）
  PREFIX: 'user_status:',      // 缓存前缀
  DIRTY_PREFIX: 'dirty:',      // 脏数据标记前缀
}
```
**用途**：用户点赞、收藏、关注等状态缓存 + 统计数据缓存

### 2. **推荐系统缓存** - `RECOMMENDATION`
```javascript
RECOMMENDATION: {
  TTL: 15 * 60,               // 15分钟
  PREFIX: 'recommendation:',   // 缓存前缀
  STRATEGY_TTL: {
    hot: 10 * 60,             // 热门推荐
    latest: 5 * 60,           // 最新推荐
    mixed: 15 * 60,           // 混合推荐
  }
}
```
**用途**：帖子推荐算法结果缓存

### 3. **管理员仪表盘缓存** - `DASHBOARD`
```javascript
DASHBOARD: {
  BASIC: 5 * 60,              // 基础数据
  TREND: 60 * 60,             // 趋势数据
  USER_DIST: 30 * 60,         // 用户分布
  ACTIVE: 15 * 60,            // 活跃用户
  HOT_POSTS: 10 * 60,         // 热门帖子
  PREFIX: 'dashboard:',        // 缓存前缀
}
```
**用途**：管理后台各种统计数据缓存

### 4. **认证相关缓存** - `AUTH`
```javascript
AUTH: {
  JWT_EXPIRES: '7d',           // JWT过期时间
  ADMIN_JWT_EXPIRES: '24h',    // 管理员JWT过期时间
  VERIFY_CODE_TTL: 5 * 60,     // 验证码
  RESET_TOKEN_TTL: 30 * 60,    // 重置密码token
}
```
**用途**：JWT token、验证码等认证相关缓存

## 🔧 使用方法

### **引入配置**
```javascript
const cacheConfig = require('../../config/cache');
```

### **基础使用**
```javascript
// 获取缓存时间
const userStatusTTL = cacheConfig.USER_STATUS.TTL;
const recommendationTTL = cacheConfig.RECOMMENDATION.TTL;

// 获取缓存前缀
const prefix = cacheConfig.USER_STATUS.PREFIX;
```

### **环境敏感配置**
```javascript
// 自动根据环境调整TTL
const userStatusTTL = cacheConfig.getTTL('USER_STATUS', cacheConfig.USER_STATUS.TTL);
const userCountTTL = cacheConfig.getTTL('USER_COUNT', cacheConfig.USER_STATUS.COUNT_TTL);

// 开发环境：用户状态5秒，统计数据30秒
// 生产环境：用户状态12秒，统计数据8秒 (Write-Back优化策略)
// 测试环境：用户状态30秒，统计数据10秒
```

### **工具方法**
```javascript
// 时间转换工具
const oneHour = cacheConfig.UTILS.hours(1);     // 3600秒
const oneDay = cacheConfig.UTILS.days(1);       // 86400秒
const thirtyMin = cacheConfig.UTILS.minutes(30); // 1800秒

// 环境变量
const dbUrl = cacheConfig.UTILS.env('DATABASE_URL', 'localhost');
```

## 📊 已迁移的文件

### ✅ **已完成**
- `server/src/services/status-cache.service.js` - 用户状态缓存 + 统计数据缓存
- `server/src/services/follow.service.js` - 关注功能缓存优化
- `server/src/services/recommendation.service.js` - 推荐缓存前缀
- `server/src/services/admin/dashboard.service.js` - 仪表盘缓存
- `server/config/jwt.js` - JWT过期时间
- `server/src/utils/websocket.js` - 在线状态缓存
- `server/src/repositories/setting.repository.js` - 推荐缓存默认值

### 🚧 **待迁移**
- `server/src/middlewares/rate-limit.middleware.js` - 限流缓存
- `server/src/services/user.service.js` - 验证码缓存
- 其他分散的缓存配置

## 🎯 环境配置

### **开发环境** (`NODE_ENV=development`)
- 用户状态缓存：5秒（实时调试）
- 用户统计数据：30秒（快速验证）
- 推荐缓存：2分钟（快速更新）
- 仪表盘缓存：1分钟（实时数据）

### **生产环境** (`NODE_ENV=production`) - Write-Back优化策略
- 用户状态缓存：12秒（快速多实例同步）
- 用户统计数据：8秒（实时统计显示）
- 推荐缓存：15分钟（平衡性能和实时性）
- 仪表盘缓存：5分钟（管理效率）
- **特点**：采用Write-Back策略，Redis作为权威数据源，5秒批量写入数据库

### **测试环境** (`NODE_ENV=test`)
- 用户状态缓存：30秒（便于测试验证）
- 用户统计数据：10秒（快速测试反馈）
- 其他缓存都很短，便于自动化测试

## 🚀 优势

### **1. 集中管理**
- ✅ 所有缓存时间在一个文件中
- ✅ 修改方便，不用到处找
- ✅ 避免重复配置

### **2. 环境敏感**
- ✅ 开发环境短缓存，便于调试
- ✅ 生产环境优化缓存，Write-Back策略下实现秒级数据同步
- ✅ 测试环境超短缓存，快速验证

### **3. 一致性**
- ✅ 同类缓存使用相同策略
- ✅ 避免配置不一致导致的问题
- ✅ 统一的命名规范

### **4. 可维护性**
- ✅ 新增缓存配置只需修改一个文件
- ✅ 配置变更影响所有相关服务
- ✅ 便于版本控制和代码审查

## 🔧 添加新的缓存配置

### **步骤1：在cache.js中添加配置**
```javascript
// 新增邮件缓存配置
EMAIL: {
  SEND_COOLDOWN: 60,          // 发送冷却时间
  TEMPLATE_CACHE: 30 * 60,    // 模板缓存
  PREFIX: 'email:',           // 缓存前缀
}
```

### **步骤2：在服务中使用**
```javascript
const cacheConfig = require('../../config/cache');

class EmailService {
  constructor() {
    this.cooldown = cacheConfig.EMAIL.SEND_COOLDOWN;
    this.templateTTL = cacheConfig.EMAIL.TEMPLATE_CACHE;
    this.prefix = cacheConfig.EMAIL.PREFIX;
  }
}
```

### **步骤3：添加环境配置（可选）**
```javascript
// 在ENVIRONMENT配置中添加
development: {
  EMAIL_COOLDOWN: 10,         // 开发环境缩短冷却时间
},

// 在getTTL方法中添加支持
getTTL(cacheType, defaultTTL) {
  const envConfig = this.getEnvConfig();
  switch(cacheType) {
    case 'USER_STATUS':
      return envConfig.USER_STATUS_TTL || defaultTTL;
    case 'USER_COUNT':         // 用户统计数据缓存
      return envConfig.USER_COUNT_TTL || defaultTTL;
    case 'EMAIL':              // 新增的邮件缓存
      return envConfig.EMAIL_COOLDOWN || defaultTTL;
    default:
      return defaultTTL;
  }
}
```

## ⚠️ 注意事项

1. **向后兼容**：现有代码逐步迁移，避免大范围改动
2. **性能考虑**：require缓存配置不会有性能问题
3. **热更新**：修改cache.js需要重启服务生效
4. **环境变量**：JWT等敏感配置仍可通过环境变量覆盖
5. **Write-Back策略**：用户状态缓存采用Write-Back，缓存TTL主要影响多实例同步而非数据持久化
6. **数据一致性**：短TTL + Write-Back策略 = 快速同步 + 高性能，适合高并发场景

## 🎯 最佳实践

1. **新功能优先使用统一配置**
2. **现有功能逐步迁移**
3. **相同类型的缓存使用相同TTL**
4. **为新配置添加清晰的注释**
5. **考虑不同环境的需求差异**
6. **Write-Back场景下优先考虑数据同步速度而非减少数据库压力**
7. **统计数据缓存TTL应小于操作缓存TTL，确保数据一致性**
8. **生产环境短TTL配合Write-Back策略，实现高性能 + 实时性的平衡**

---

## 📋 实际案例：关注功能缓存优化

### **问题背景**
传统缓存策略下，生产环境用户状态缓存24小时，统计数据缓存5分钟，导致：
- 用户关注操作后，对方可能5分钟后才看到粉丝数变化
- 多实例部署时，不同服务器缓存数据不一致时间过长

### **优化策略**
```javascript
// 优化前
production: {
  USER_STATUS_TTL: 24 * 60 * 60,     // 24小时
  USER_COUNT_TTL: 5 * 60,            // 5分钟
}

// 优化后
production: {
  USER_STATUS_TTL: 12,               // 12秒
  USER_COUNT_TTL: 8,                 // 8秒
}
```

### **技术保障**
- **Write-Back策略**：5秒批量写入数据库，保证数据持久化
- **Redis权威**：缓存作为数据权威来源，确保一致性
- **分布式锁**：防止多实例同时写入，避免数据冲突

### **优化效果**
| 指标 | 优化前 | 优化后 | 提升效果 |
|------|--------|--------|----------|
| 关注状态同步 | 最长24小时 | 最长12秒 | 7200倍 |
| 统计数据同步 | 最长5分钟 | 最长8秒 | 37.5倍 |
| 多实例一致性 | 小时级 | 秒级 | 质的飞跃 |
| 用户体验 | 延迟感知 | 近实时 | 极大改善 |

**总结**：Write-Back策略下，短TTL不会增加数据库压力，反而能显著提升数据一致性和用户体验。
