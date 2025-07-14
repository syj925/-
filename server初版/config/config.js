/**
 * 服务器配置文件
 */
module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 12349,
    env: process.env.NODE_ENV || 'development'
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expire: process.env.JWT_EXPIRE || '7d'
  },
  
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '20060711',
    name: process.env.DB_NAME || 'campus_wall',
    port: process.env.DB_PORT || 3306
  },
  
  // 上传文件配置
  upload: {
    path: process.env.UPLOAD_PATH || 'uploads',
    maxFileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024 // 5MB
  },
  
  // Redis配置
  redis: {
    url: process.env.REDIS_URL || 'redis://192.168.159.130:6379',
    ttl: process.env.REDIS_TTL || 86400, // 默认缓存1天
    enabled: true, // 恢复Redis启用状态
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10)
  },
  
  // 性能相关配置
  performance: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100 // 每个IP在windowMs内最多请求次数
    },
    cache: {
      posts: 30 * 60, // 帖子缓存30分钟
      users: 60 * 60, // 用户缓存1小时
      comments: 15 * 60 // 评论缓存15分钟
    }
  }
}; 