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

      // 安全的序列化处理
      let stringValue;
      if (value === null || value === undefined) {
        stringValue = '';
      } else if (typeof value === 'object') {
        try {
          // 清理可能的循环引用
          const cleanValue = this.cleanDataForSerialization(value);
          stringValue = JSON.stringify(cleanValue);
        } catch (serializeError) {
          logger.error(`JSON序列化失败: ${serializeError.message}`, { key, valueType: typeof value });
          return 'OK';
        }
      } else {
        stringValue = String(value);
      }

      // 验证序列化结果
      if (stringValue === '[object Object]') {
        logger.error('检测到无效的序列化结果，跳过缓存设置', { key, value });
        return 'OK';
      }

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

      // 检查是否是无效的对象字符串
      if (value === '[object Object]' || (typeof value === 'string' && value.startsWith('[object'))) {
        logger.warn('缓存值不是字符串:', {
          key,
          value: typeof value === 'string' ? value.split('').reduce((obj, char, index) => {
            obj[index] = char;
            return obj;
          }, {}) : value,
          service: 'campus-wall-api'
        });
        return null;
      }

      // 尝试解析JSON
      try {
        return JSON.parse(value);
      } catch (e) {
        // 如果解析失败，检查是否是字符串形式的对象
        if (typeof value === 'string' && value.includes('"service"')) {
          logger.warn('发现损坏的缓存数据，清除该键:', { key, value: value.substring(0, 100) });
          await this.del(key); // 清除损坏的缓存
          return null;
        }
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

      // 安全的序列化处理
      let stringValue;
      if (value === null || value === undefined) {
        stringValue = '';
      } else if (typeof value === 'object') {
        try {
          // 清理可能的循环引用
          const cleanValue = this.cleanDataForSerialization(value);
          stringValue = JSON.stringify(cleanValue);
        } catch (serializeError) {
          logger.error(`JSON序列化失败: ${serializeError.message}`, { key, valueType: typeof value });
          return 'OK';
        }
      } else {
        stringValue = String(value);
      }

      // 验证序列化结果
      if (stringValue === '[object Object]') {
        logger.error('检测到无效的序列化结果，跳过缓存设置', { key, value });
        return 'OK';
      }

      return await this.client.setex(key, ttl, stringValue);
    } catch (err) {
      logger.error(`Redis setex error: ${err.message}`, { key, ttl, value });
      return 'OK'; // 仍然返回OK，不要影响主流程
    }
  }

  /**
   * 获取匹配模式的键列表
   * @param {String} pattern 匹配模式
   * @returns {Promise<Array>} 键名数组
   */
  async keys(pattern) {
    try {
      // 如果未连接，直接返回空数组
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping keys for pattern: ${pattern}`);
        return [];
      }

      return await this.client.keys(pattern);
    } catch (err) {
      logger.error(`Redis keys error: ${err.message}`, { pattern });
      return [];
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

           // 修复前缀问题：keys()返回的是完整key，需要去掉前缀再删除
           const config = require('../../config');
           const keyPrefix = config.redis.keyPrefix || '';
           
           const keysWithoutPrefix = keys.map(key => {
             if (keyPrefix && key.startsWith(keyPrefix)) {
               return key.substring(keyPrefix.length);
             }
             return key;
           });
     
           return await this.client.del(...keysWithoutPrefix);
    } catch (err) {
      logger.error(`Redis deletePattern error: ${err.message}`, { pattern });
      return 0;
    }
  }

  /**
   * Set数据结构 - 添加元素
   * @param {String} key 键
   * @param {...String} members 成员
   * @returns {Promise<Number>} 添加的元素数量
   */
  async sadd(key, ...members) {
    try {
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping sadd for key: ${key}`);
        return 0;
      }
      return await this.client.sadd(key, ...members);
    } catch (err) {
      logger.error(`Redis sadd error: ${err.message}`, { key, members });
      return 0;
    }
  }

  /**
   * Set数据结构 - 移除元素
   * @param {String} key 键
   * @param {...String} members 成员
   * @returns {Promise<Number>} 移除的元素数量
   */
  async srem(key, ...members) {
    try {
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping srem for key: ${key}`);
        return 0;
      }
      return await this.client.srem(key, ...members);
    } catch (err) {
      logger.error(`Redis srem error: ${err.message}`, { key, members });
      return 0;
    }
  }

  /**
   * Set数据结构 - 检查元素是否存在
   * @param {String} key 键
   * @param {String} member 成员
   * @returns {Promise<Boolean>} 是否存在
   */
  async sismember(key, member) {
    try {
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping sismember for key: ${key}`);
        return false;
      }
      const result = await this.client.sismember(key, member);
      return result === 1;
    } catch (err) {
      logger.error(`Redis sismember error: ${err.message}`, { key, member });
      return false;
    }
  }

  /**
   * Set数据结构 - 获取所有成员
   * @param {String} key 键
   * @returns {Promise<Array>} 成员数组
   */
  async smembers(key) {
    try {
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping smembers for key: ${key}`);
        return [];
      }
      return await this.client.smembers(key);
    } catch (err) {
      logger.error(`Redis smembers error: ${err.message}`, { key });
      return [];
    }
  }

  /**
   * Set数据结构 - 获取集合元素数量
   * @param {String} key 键
   * @returns {Promise<Number>} 元素数量
   */
  async scard(key) {
    try {
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping scard for key: ${key}`);
        return 0;
      }
      return await this.client.scard(key);
    } catch (err) {
      logger.error(`Redis scard error: ${err.message}`, { key });
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

  /**
   * List数据结构 - 左侧推入元素
   * @param {String} key 键
   * @param {...String} values 值
   * @returns {Promise<Number>} 推入后列表长度
   */
  async lpush(key, ...values) {
    try {
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping lpush for key: ${key}`);
        return 0;
      }
      return await this.client.lpush(key, ...values);
    } catch (err) {
      logger.error(`Redis lpush error: ${err.message}`, { key, values });
      return 0;
    }
  }

  /**
   * List数据结构 - 右侧推入元素
   * @param {String} key 键
   * @param {...String} values 值
   * @returns {Promise<Number>} 推入后列表长度
   */
  async rpush(key, ...values) {
    try {
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping rpush for key: ${key}`);
        return 0;
      }
      return await this.client.rpush(key, ...values);
    } catch (err) {
      logger.error(`Redis rpush error: ${err.message}`, { key, values });
      return 0;
    }
  }

  /**
   * List数据结构 - 左侧弹出元素
   * @param {String} key 键
   * @returns {Promise<String|null>} 弹出的元素或null
   */
  async lpop(key) {
    try {
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping lpop for key: ${key}`);
        return null;
      }
      return await this.client.lpop(key);
    } catch (err) {
      logger.error(`Redis lpop error: ${err.message}`, { key });
      return null;
    }
  }

  /**
   * List数据结构 - 右侧弹出元素
   * @param {String} key 键
   * @returns {Promise<String|null>} 弹出的元素或null
   */
  async rpop(key) {
    try {
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping rpop for key: ${key}`);
        return null;
      }
      return await this.client.rpop(key);
    } catch (err) {
      logger.error(`Redis rpop error: ${err.message}`, { key });
      return null;
    }
  }

  /**
   * List数据结构 - 获取列表长度
   * @param {String} key 键
   * @returns {Promise<Number>} 列表长度
   */
  async llen(key) {
    try {
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping llen for key: ${key}`);
        return 0;
      }
      return await this.client.llen(key);
    } catch (err) {
      logger.error(`Redis llen error: ${err.message}`, { key });
      return 0;
    }
  }

  /**
   * List数据结构 - 获取指定范围的元素
   * @param {String} key 键
   * @param {Number} start 开始位置
   * @param {Number} stop 结束位置
   * @returns {Promise<Array>} 元素数组
   */
  async lrange(key, start, stop) {
    try {
      if (!this.isConnected) {
        logger.warn(`Redis not connected, skipping lrange for key: ${key}`);
        return [];
      }
      return await this.client.lrange(key, start, stop);
    } catch (err) {
      logger.error(`Redis lrange error: ${err.message}`, { key, start, stop });
      return [];
    }
  }

  /**
   * 清理数据以避免循环引用
   * @param {any} data 要清理的数据
   * @returns {any} 清理后的数据
   */
  cleanDataForSerialization(data) {
    if (!data) return data;

    // 如果是 Sequelize 模型实例，使用 toJSON() 方法
    if (data.toJSON && typeof data.toJSON === 'function') {
      return data.toJSON();
    }

    // 如果是数组，递归处理每个元素
    if (Array.isArray(data)) {
      return data.map(item => this.cleanDataForSerialization(item));
    }

    // 如果是普通对象，递归处理属性
    if (typeof data === 'object' && data !== null) {
      const cleaned = {};
      for (const [key, value] of Object.entries(data)) {
        // 跳过函数和循环引用
        if (typeof value === 'function') continue;
        if (value === data) continue; // 简单的循环引用检测

        cleaned[key] = this.cleanDataForSerialization(value);
      }
      return cleaned;
    }

    return data;
  }
}

// 创建单例
const redisClient = new RedisClient();

module.exports = redisClient; 