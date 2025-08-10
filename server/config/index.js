const path = require('path');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const databaseConfig = require('./database')[env];
const redisConfig = require('./redis')[env];
const jwtConfig = require('./jwt');
const logger = require('./logger');

module.exports = {
  env,
  port: process.env.PORT || 3000,
  database: databaseConfig,
  redis: redisConfig,
  jwt: jwtConfig,
  logger,
  // 服务器域名配置
  server: {
    // 生产环境域名，开发环境为空则使用请求头的host
    domain: process.env.SERVER_DOMAIN || '',
    // 是否使用HTTPS
    useHttps: process.env.USE_HTTPS === 'true' || false,
    // 静态文件访问路径前缀
    staticPath: process.env.STATIC_PATH || '/uploads'
  },
  upload: {
    dir: process.env.UPLOAD_DIR || path.join(__dirname, '../uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || 5242880, 10), // 默认5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    // 文件URL生成策略：'relative' | 'absolute'
    // 修改为relative避免跨环境访问问题
    urlStrategy: process.env.UPLOAD_URL_STRATEGY || 'relative'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true
  },
  rateLimiter: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP 15分钟内限制100次请求
    standardHeaders: true,
    legacyHeaders: false,
  }
}; 