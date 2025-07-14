const Redis = require('ioredis');
const config = require('../../config');
const logger = require('../../config/logger');

/**
 * Redis客户端类
 */
class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.init();
  }

  /**
   * 初始化Redis连接
   */
  init() {
    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        db: config.redis.db,
        keyPrefix: config.redis.keyPrefix,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis数据库连接成功');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        logger.error('Redis connection error:', err);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });
    } catch (err) {
      logger.error('Redis initialization error:', err);
    }
  }

  /**
   * 获取Redis客户端实例
   * @returns {Object} Redis客户端
   */
  getClient() {
    return this.client;
  }

  /**
   * 设置键值对
   * @param {String} key 键
   * @param {String|Object|Number} value 值
   * @param {Number} ttl 过期时间（秒），可选
   * @returns {Promise<String>} 操作结果
   */
  async set(key, value, ttl = null) {
    try {
      // 如果未连接，直接返回
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping set for key: ${key}`);
        return 'OK';
      }
      
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      if (ttl) {
        return await this.client.set(key, stringValue, 'EX', ttl);
      }
      
      return await this.client.set(key, stringValue);
    } catch (err) {
      logger.error(`Redis set error: ${err.message}`, { key, value, ttl });
      return 'OK'; // 仍然返回OK，不要影响主流程
    }
  }

  /**
   * 获取键值
   * @param {String} key 键
   * @returns {Promise<String|Object|null>} 值或null
   */
  async get(key) {
    try {
      // 如果未连接，直接返回null
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping get for key: ${key}`);
        return null;
      }
      
      const value = await this.client.get(key);
      
      if (!value) return null;
      
      // 尝试解析JSON
      try {
        return JSON.parse(value);
      } catch (e) {
        logger.debug(`Redis value is not JSON: ${key}`, { value: value.substring(0, 100) });
        return value;
      }
    } catch (err) {
      logger.error(`Redis get error: ${err.message}`, { key });
      return null;
    }
  }

  /**
   * 删除键
   * @param {String} key 键
   * @returns {Promise<Number>} 删除的键数量
   */
  async del(key) {
    try {
      // 如果未连接，直接返回0
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping del for key: ${key}`);
        return 0;
      }
      
      return await this.client.del(key);
    } catch (err) {
      logger.error(`Redis del error: ${err.message}`, { key });
      return 0; // 返回0而不是抛出异常
    }
  }

  /**
   * 设置键的过期时间
   * @param {String} key 键
   * @param {Number} ttl 过期时间（秒）
   * @returns {Promise<Number>} 操作结果
   */
  async expire(key, ttl) {
    try {
      return await this.client.expire(key, ttl);
    } catch (err) {
      logger.error(`Redis expire error: ${err.message}`, { key, ttl });
      throw err;
    }
  }

  /**
   * 判断键是否存在
   * @param {String} key 键
   * @returns {Promise<Number>} 存在返回1，不存在返回0
   */
  async exists(key) {
    try {
      return await this.client.exists(key);
    } catch (err) {
      logger.error(`Redis exists error: ${err.message}`, { key });
      return 0;
    }
  }

  /**
   * 增加计数器值
   * @param {String} key 键
   * @param {Number} increment 增加值，默认为1
   * @returns {Promise<Number>} 操作后的值
   */
  async incr(key, increment = 1) {
    try {
      if (increment === 1) {
        return await this.client.incr(key);
      } else {
        return await this.client.incrby(key, increment);
      }
    } catch (err) {
      logger.error(`Redis incr error: ${err.message}`, { key, increment });
      throw err;
    }
  }

  /**
   * 减少计数器值
   * @param {String} key 键
   * @param {Number} decrement 减少值，默认为1
   * @returns {Promise<Number>} 操作后的值
   */
  async decr(key, decrement = 1) {
    try {
      if (decrement === 1) {
        return await this.client.decr(key);
      } else {
        return await this.client.decrby(key, decrement);
      }
    } catch (err) {
      logger.error(`Redis decr error: ${err.message}`, { key, decrement });
      throw err;
    }
  }

  /**
   * 设置键值对并指定过期时间
   * @param {String} key 键
   * @param {Number} ttl 过期时间（秒）
   * @param {String|Object|Number} value 值
   * @returns {Promise<String>} 操作结果
   */
  async setex(key, ttl, value) {
    try {
      // 如果未连接，直接返回
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping setex for key: ${key}`);
        return 'OK';
      }

      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return await this.client.setex(key, ttl, stringValue);
    } catch (err) {
      logger.error(`Redis setex error: ${err.message}`, { key, ttl, value });
      return 'OK'; // 仍然返回OK，不要影响主流程
    }
  }

  /**
   * 删除匹配模式的键
   * @param {String} pattern 匹配模式
   * @returns {Promise<Number>} 删除的键数量
   */
  async deletePattern(pattern) {
    try {
      // 如果未连接，直接返回0
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping deletePattern for pattern: ${pattern}`);
        return 0;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      return await this.client.del(...keys);
    } catch (err) {
      logger.error(`Redis deletePattern error: ${err.message}`, { pattern });
      return 0;
    }
  }

  /**
   * 缓存查询结果
   * @param {String} key 缓存键
   * @param {Function} queryFn 查询函数
   * @param {Number} ttl 过期时间（秒）
   * @returns {Promise<Any>} 查询结果
   */
  async cache(key, queryFn, ttl = 3600) {
    try {
      // 尝试从缓存获取
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // 缓存未命中，执行查询函数
      const result = await queryFn();

      // 缓存结果
      await this.set(key, result, ttl);

      return result;
    } catch (err) {
      logger.error(`Redis cache error: ${err.message}`, { key, ttl });
      // 出错时直接执行查询函数
      return await queryFn();
    }
  }
}

// 创建单例
const redisClient = new RedisClient();

module.exports = redisClient; 