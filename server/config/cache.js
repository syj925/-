/**
 * 缓存配置统一管理
 * 集中管理所有缓存的过期时间和相关配置
 */

module.exports = {
  // 🔧 用户状态缓存（点赞、收藏、关注等）
  USER_STATUS: {
    TTL: 24 * 60 * 60,          // 24小时 - 用户行为状态
    COUNT_TTL: 5 * 60,          // 5分钟 - 用户统计数据（关注数、粉丝数等）
    PREFIX: 'user_status:',      // 缓存前缀
    DIRTY_PREFIX: 'dirty:',      // 脏数据标记前缀
  },

  // 📊 推荐系统缓存
  RECOMMENDATION: {
    TTL: 15 * 60,               // 15分钟 - 推荐内容
    PREFIX: 'recommendation:',   // 缓存前缀
    STRATEGY_TTL: {
      hot: 10 * 60,             // 10分钟 - 热门推荐
      latest: 5 * 60,           // 5分钟 - 最新推荐
      mixed: 15 * 60,           // 15分钟 - 混合推荐
    }
  },

  // 🎛️ 管理员仪表盘缓存
  DASHBOARD: {
    BASIC: 5 * 60,              // 5分钟 - 基础数据
    TREND: 60 * 60,             // 1小时 - 趋势数据
    USER_DIST: 30 * 60,         // 30分钟 - 用户分布
    ACTIVE: 15 * 60,            // 15分钟 - 活跃用户
    HOT_POSTS: 10 * 60,         // 10分钟 - 热门帖子
    PREFIX: 'dashboard:',        // 缓存前缀
  },

  // 🔐 认证相关缓存
  AUTH: {
    JWT_EXPIRES: process.env.JWT_EXPIRES_IN || '7d',     // JWT过期时间
    ADMIN_JWT_EXPIRES: '24h',                            // 管理员JWT过期时间
    VERIFY_CODE_TTL: 5 * 60,                            // 5分钟 - 验证码
    RESET_TOKEN_TTL: 30 * 60,                           // 30分钟 - 重置密码token
  },

  // 🌐 实时功能缓存
  REALTIME: {
    ONLINE_STATUS: 60 * 60,     // 1小时 - 在线状态
    MESSAGE_CACHE: 10 * 60,     // 10分钟 - 消息缓存
    NOTIFICATION: 30 * 60,      // 30分钟 - 通知缓存
    PREFIX: 'realtime:',        // 缓存前缀
  },

  // 🚦 限流缓存
  RATE_LIMIT: {
    DEFAULT_WINDOW: 15 * 60,    // 15分钟 - 默认限流窗口
    LOGIN_WINDOW: 60 * 60,      // 1小时 - 登录限流窗口
    API_WINDOW: 60,             // 1分钟 - API限流窗口
    PREFIX: 'rate_limit:',      // 缓存前缀
  },

  // 📁 内容缓存
  CONTENT: {
    BANNER: 10 * 60,            // 10分钟 - 轮播图
    CATEGORIES: 30 * 60,        // 30分钟 - 分类数据
    HOT_TOPICS: 15 * 60,        // 15分钟 - 热门话题
    SEARCH_HISTORY: 7 * 24 * 60 * 60, // 7天 - 搜索历史
    PREFIX: 'content:',         // 缓存前缀
  },

  // 🎭 表情系统缓存
  EMOJI: {
    PACKS_TTL: 30 * 60,         // 30分钟 - 表情包列表
    MAP_TTL: 60 * 60,           // 1小时 - 表情映射表
    SEARCH_TTL: 10 * 60,        // 10分钟 - 搜索结果
    HOT_TTL: 15 * 60,           // 15分钟 - 热门表情
    RECENT_TTL: 24 * 60 * 60,   // 24小时 - 最近使用
    RECENT_LIMIT: 30,           // 最近使用数量限制
    VERSION_KEY: 'emoji:version',     // 版本号键
    PACKS_KEY: 'emoji:packs',         // 表情包列表键
    MAP_KEY: 'emoji:map',             // 映射表键
    HOT_KEY: 'emoji:hot',             // 热门表情键
    SEARCH_PREFIX: 'emoji:search:',   // 搜索缓存前缀
    RECENT_PREFIX: 'emoji:recent:',   // 最近使用前缀
    USE_COUNT_KEY: 'emoji:use_counts', // 使用计数键
    UPLOAD_LIMIT_PREFIX: 'emoji:upload:', // 上传限制前缀
  },

  // 🔧 工具方法
  UTILS: {
    /**
     * 将分钟转换为秒
     */
    minutes: (min) => min * 60,
    
    /**
     * 将小时转换为秒
     */
    hours: (hour) => hour * 60 * 60,
    
    /**
     * 将天转换为秒
     */
    days: (day) => day * 24 * 60 * 60,

    /**
     * 获取环境变量或默认值
     */
    env: (key, defaultValue) => process.env[key] || defaultValue,
  },

  // 🎯 环境特定配置
  ENVIRONMENT: {
    // 开发环境 - 较短的缓存时间，便于调试
    development: {
      USER_STATUS_TTL: 5,                // 5秒 - 开发阶段实时响应
      USER_COUNT_TTL: 30,                // 30秒 - 统计数据
      RECOMMENDATION_TTL: 2 * 60,        // 2分钟
      DASHBOARD_TTL: 1 * 60,             // 1分钟
    },
    
    // 生产环境 - 优化后的缓存时间（Write-Back策略下的快速响应）
    production: {
      USER_STATUS_TTL: 12,               // 12秒 - 用户行为状态
      USER_COUNT_TTL: 8,                 // 8秒 - 统计数据
      RECOMMENDATION_TTL: 15 * 60,       // 15分钟
      DASHBOARD_TTL: 5 * 60,             // 5分钟
    },
    
    // 测试环境 - 很短的缓存时间
    test: {
      USER_STATUS_TTL: 30,               // 30秒
      USER_COUNT_TTL: 10,                // 10秒 - 统计数据
      RECOMMENDATION_TTL: 10,            // 10秒
      DASHBOARD_TTL: 5,                  // 5秒
    }
  },

  /**
   * 根据当前环境获取配置
   */
  getEnvConfig() {
    const env = process.env.NODE_ENV || 'development';
    return this.ENVIRONMENT[env] || this.ENVIRONMENT.development;
  },

  /**
   * 获取最终的TTL值（考虑环境因素）
   */
  getTTL(cacheType, defaultTTL) {
    const envConfig = this.getEnvConfig();
    
    switch(cacheType) {
      case 'USER_STATUS':
        return envConfig.USER_STATUS_TTL || defaultTTL;
      case 'USER_COUNT':
        return envConfig.USER_COUNT_TTL || defaultTTL;
      case 'RECOMMENDATION':
        return envConfig.RECOMMENDATION_TTL || defaultTTL;
      case 'DASHBOARD':
        return envConfig.DASHBOARD_TTL || defaultTTL;
      default:
        return defaultTTL;
    }
  }
};
