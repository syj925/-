const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const config = require('../config');
const logger = require('../config/logger');
const {
  ErrorMiddleware,
  LoggerMiddleware,
  RateLimitMiddleware
} = require('./middlewares');

// 初始化Express应用
const app = express();

// 安全头设置
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 自定义CORS配置，解决开发环境跨域问题
app.use((req, res, next) => {
  // 获取请求来源
  const origin = req.headers.origin;
  
  // 允许本地开发环境和指定域名访问，增加移动设备常用的访问方式
  const allowedOrigins = [
    'http://localhost:5173', 
    'http://localhost:8080', 
    'http://localhost:8081', 
    'http://localhost:8082', 
    'http://10.1.1.235:8080',
    'http://10.1.1.235:8081',
    // 添加用户的生产域名
    'https://www.callxyq.xyz',
    'http://www.callxyq.xyz',
    'https://callxyq.xyz',
    'http://callxyq.xyz',
    'capacitor://*',  // Capacitor移动应用
    'ionic://*',      // Ionic移动应用
    'file://*',       // 本地文件访问（某些移动应用）
    null,             // 某些移动设备不发送origin
    undefined         // 某些移动设备origin未定义
  ];
  
  // 如果请求源在允许列表中或环境为开发环境，则允许该源
  if (origin && allowedOrigins.includes(origin) || config.env === 'development') {
    res.header('Access-Control-Allow-Origin', origin || '*');
  } else {
    // 回退到配置的CORS设置或使用通配符允许所有源（仅开发环境使用）
    res.header('Access-Control-Allow-Origin', config.env === 'development' ? '*' : config.cors.origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// CORS配置（作为备份）
app.use(cors({
  ...config.cors,
  // 在开发环境中，允许所有源访问
  origin: config.env === 'development' ? '*' : config.cors.origin
}));

// 请求体解析
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 请求压缩
app.use(compression());

// 请求日志
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// 自定义请求日志
app.use(LoggerMiddleware.requestLogger());

// 健康检查接口 - 放在API限流之前，确保可以访问
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: '服务器正常运行', 
    timestamp: new Date().toISOString(),
    env: config.env
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: '服务器正常运行', 
    timestamp: new Date().toISOString(),
    env: config.env
  });
});

// API请求限流
app.use('/api', RateLimitMiddleware.apiLimiter());

// 静态文件服务
app.use('/uploads', express.static(config.upload.dir));

// API路由
app.use(require('./routes'));

// 处理404
app.use(ErrorMiddleware.notFound());

// 全局错误处理
app.use(ErrorMiddleware.handler());

module.exports = app; 