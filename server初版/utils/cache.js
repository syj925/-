/**
 * Redis缓存工具
 * 提供缓存功能，可以缓存常用数据以提高性能
 */
const Redis = require('ioredis');
const config = require('../config/config');
const logger = require('./logger');

// Redis客户端实例
let redisClient = null;

/**
 * 初始化Redis客户端
 * @returns {Promise<Redis>} - Redis客户端实例
 */
const initRedisClient = async () => {
  if (redisClient) {
    return redisClient;
  }
  
  // 如果禁用了Redis缓存，返回null
  if (!config.redis.enabled) {
    logger.info('Redis缓存已禁用');
    return null;
  }
  
  try {
    // 解析Redis连接URL
    const redisUrl = config.redis.url;
    console.log('正在连接Redis:', redisUrl);
    
    // 创建Redis客户端
    const clientConfig = {
      socket: {
        connectTimeout: 20000, // 20秒连接超时
        keepAlive: true,
        keepAliveInitialDelay: 10000 // 10秒后开始发送keepalive包
      },
      maxRetriesPerRequest: config.redis.maxRetries || 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * (config.redis.retryDelay || 1000), 5000);
        return delay;
      }
    };
    
    console.log('Redis客户端配置:', JSON.stringify(clientConfig));
    
    // 创建客户端
    console.log('尝试建立Redis连接...');
    redisClient = new Redis(redisUrl, clientConfig);
    
    // 监听连接事件
    redisClient.on('connect', () => {
      console.log('Redis连接成功');
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis连接错误:', err);
    });
    
    // 测试连接
    await redisClient.ping();
    console.log('Redis PING成功，连接已验证');
    
    return redisClient;
  } catch (error) {
    logger.error('Redis初始化失败:', error);
    return null; // 返回null而不是抛出错误
  }
};

/**
 * 获取缓存值
 * @param {string} key - 缓存键
 * @returns {Promise<any>} - 缓存值，如果不存在返回null
 */
const getCache = async (key) => {
  // 如果Redis客户端不可用，直接返回null
  if (!redisClient || !config.redis.enabled) {
    logger.debug(`缓存未启用或Redis未连接，跳过获取缓存[${key}]`);
    return null;
  }
  
  try {
    const value = await redisClient.get(key);
    if (!value) {
      return null;
    }
    
    return JSON.parse(value);
  } catch (error) {
    logger.error(`获取缓存[${key}]失败:`, error);
    return null;
  }
};

/**
 * 设置缓存值
 * @param {string} key - 缓存键
 * @param {any} value - 缓存值
 * @param {number} [ttl=null] - 过期时间（秒），不设置则使用默认值
 * @returns {Promise<boolean>} - 是否成功
 */
const setCache = async (key, value, ttl = null) => {
  // 如果Redis客户端不可用，直接返回false
  if (!redisClient || !config.redis.enabled) {
    logger.debug(`缓存未启用或Redis未连接，跳过设置缓存[${key}]`);
    return false;
  }
  
  try {
    const ttlValue = ttl || config.redis.ttl;
    const stringValue = JSON.stringify(value);
    
    if (ttlValue) {
      await redisClient.set(key, stringValue, 'EX', ttlValue);
    } else {
      await redisClient.set(key, stringValue);
    }
    
    return true;
  } catch (error) {
    logger.error(`设置缓存[${key}]失败:`, error);
    return false;
  }
};

/**
 * 删除缓存
 * @param {string} key - 缓存键
 * @returns {Promise<boolean>} - 是否成功
 */
const deleteCache = async (key) => {
  // 如果Redis客户端不可用，直接返回false
  if (!redisClient || !config.redis.enabled) {
    logger.debug(`缓存未启用或Redis未连接，跳过删除缓存[${key}]`);
    return false;
  }
  
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error(`删除缓存[${key}]失败:`, error);
    return false;
  }
};

/**
 * 删除匹配模式的所有缓存
 * @param {string} pattern - 匹配模式，例如：user:*
 * @returns {Promise<boolean>} - 是否成功
 */
const deletePattern = async (pattern) => {
  // 如果Redis客户端不可用，直接返回false
  if (!redisClient || !config.redis.enabled) {
    logger.debug(`缓存未启用或Redis未连接，跳过删除缓存模式[${pattern}]`);
    return false;
  }
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    return true;
  } catch (error) {
    logger.error(`删除缓存模式[${pattern}]失败:`, error);
    return false;
  }
};

module.exports = {
  initRedisClient,
  getCache,
  setCache,
  deleteCache,
  deletePattern
};