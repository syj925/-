/**
 * 日志工具
 * 提供统一的日志记录功能
 */
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// 确保日志目录存在
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 当前环境
const env = process.env.NODE_ENV || 'development';

/**
 * 格式化日期时间
 * @returns {string} - 格式化后的日期时间字符串
 */
function getFormattedDateTime() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * 写入日志到文件
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {Object} [data=null] - 额外数据
 */
function writeToFile(level, message, data = null) {
  const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
  const logEntry = {
    timestamp: getFormattedDateTime(),
    level,
    message,
    data: data || undefined
  };
  
  fs.appendFile(
    logFile, 
    JSON.stringify(logEntry) + '\n',
    (err) => {
      if (err) {
        console.error('写入日志文件失败:', err);
      }
    }
  );
}

/**
 * 记录调试日志
 * @param {string} message - 日志消息
 * @param {Object} [data=null] - 额外数据
 */
function debug(message, data = null) {
  if (env === 'development') {
    console.debug(`[DEBUG] ${getFormattedDateTime()} - ${message}`);
    if (data) {
      console.debug(data);
    }
  }
  
  // 开发环境下可以选择是否写入文件
  if (config.server?.logDebugToFile) {
    writeToFile('DEBUG', message, data);
  }
}

/**
 * 记录信息日志
 * @param {string} message - 日志消息
 * @param {Object} [data=null] - 额外数据
 */
function info(message, data = null) {
  console.info(`[INFO] ${getFormattedDateTime()} - ${message}`);
  if (data && env === 'development') {
    console.info(data);
  }
  writeToFile('INFO', message, data);
}

/**
 * 记录警告日志
 * @param {string} message - 日志消息
 * @param {Object} [data=null] - 额外数据
 */
function warn(message, data = null) {
  console.warn(`[WARN] ${getFormattedDateTime()} - ${message}`);
  if (data) {
    console.warn(data);
  }
  writeToFile('WARN', message, data);
}

/**
 * 记录错误日志
 * @param {string} message - 日志消息
 * @param {Error|Object} [error=null] - 错误对象或额外数据
 */
function error(message, error = null) {
  console.error(`[ERROR] ${getFormattedDateTime()} - ${message}`);
  if (error) {
    if (error instanceof Error) {
      console.error(error.stack || error.message);
      writeToFile('ERROR', message, { 
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } else {
      console.error(error);
      writeToFile('ERROR', message, error);
    }
  } else {
    writeToFile('ERROR', message);
  }
}

module.exports = {
  debug,
  info,
  warn,
  error
}; 