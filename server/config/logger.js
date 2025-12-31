const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// 确定环境
const env = process.env.NODE_ENV || 'development';
const logDir = process.env.LOG_DIR || 'logs';
const logLevel = process.env.LOG_LEVEL || (env === 'development' ? 'info' : 'info');

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 自定义格式，避免循环引用问题
const safeStringify = (obj) => {
  if (obj === null || obj === undefined) return '';
  
  const cache = new Set();
  const result = JSON.stringify(obj, (key, value) => {
    if (key === 'parent' || key === 'sequelize' || key === 'model' || key === 'options' || key === 'include') {
      return '[Circular]';
    }
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular]';
      }
      cache.add(value);
    }
    return value;
  }, 2);
  return result;
};

// 定义日志格式
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? safeStringify(meta) : ''}`;
  })
);

// 控制台输出格式
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? safeStringify(meta) : ''}`;
  })
);

// 创建日志实例
const logger = createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'campus-wall-api' },
  transports: [
    // 错误日志
    new transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 所有日志
    new transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 服务器日志
    new transports.File({
      filename: path.join(logDir, 'server.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // 未捕获的异常处理
  exceptionHandlers: [
    new transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
  // 拒绝的Promise处理
  rejectionHandlers: [
    new transports.File({ 
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
  exitOnError: false
});

// 添加控制台输出（无论环境如何，都输出到控制台以便调试和监控）
logger.add(new transports.Console({
  format: consoleFormat,
  handleExceptions: true,
  handleRejections: true
}));

module.exports = logger; 