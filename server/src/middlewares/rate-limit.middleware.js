const rateLimit = require('express-rate-limit');
const { ResponseUtil } = require('../utils');
const errorCodes = require('../constants/error-codes');
const redisClient = require('../utils/redis-client');
const logger = require('../../config/logger');

/**
 * 限流中间件
 */
class RateLimitMiddleware {
  /**
   * 创建基本限流中间件
   * @param {Object} options 限流选项
   * @returns {Function} Express中间件
   */
  static createLimiter(options = {}) {
    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100, // 每个IP在windowMs内最多请求100次
      standardHeaders: true, // 返回标准的RateLimit头
      legacyHeaders: false, // 禁用X-RateLimit-*头
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED),
      keyGenerator: (req) => req.ip,
      skip: (req) => false,
      handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded: ${req.ip}`, {
          ip: req.ip,
          path: req.originalUrl,
          method: req.method
        });
        
        return res.status(429).json(
          ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
            message: '请求过于频繁，请稍后再试'
          })
        );
      }
    };

    const mergedOptions = { ...defaultOptions, ...options };
    return rateLimit(mergedOptions);
  }

  /**
   * 创建API通用限流中间件
   * @returns {Function} Express中间件
   */
  static apiLimiter() {
    return this.createLimiter({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 300, // 每个IP 15分钟内最多300次请求
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED)
    });
  }

  /**
   * 创建登录限流中间件
   * @returns {Function} Express中间件
   */
  static loginLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1小时
      max: 10, // 每个IP 1小时内最多10次登录尝试
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
        message: '登录尝试次数过多，请1小时后再试'
      })
    });
  }

  /**
   * 创建注册限流中间件
   * @returns {Function} Express中间件
   */
  static registerLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1小时
      max: 5, // 每个IP 1小时内最多5次注册尝试
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
        message: '注册尝试次数过多，请1小时后再试'
      })
    });
  }

  /**
   * 创建验证码发送限流中间件
   * @returns {Function} Express中间件
   */
  static verifyCodeLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1分钟
      max: 1, // 每个IP 1分钟内最多1次验证码发送
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
        message: '验证码发送过于频繁，请1分钟后再试'
      })
    });
  }

  /**
   * 创建帖子发布限流中间件
   * @returns {Function} Express中间件
   */
  static postLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1小时
      max: 10, // 每个IP 1小时内最多10篇帖子
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
        message: '发帖过于频繁，请1小时后再试'
      })
    });
  }

  /**
   * 创建评论限流中间件
   * @returns {Function} Express中间件
   */
  static commentLimiter() {
    return this.createLimiter({
      windowMs: 10 * 60 * 1000, // 10分钟
      max: 30, // 每个IP 10分钟内最多30条评论
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
        message: '评论过于频繁，请稍后再试'
      })
    });
  }

  /**
   * 创建点赞限流中间件
   * @returns {Function} Express中间件
   */
  static likeLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1分钟
      max: 30, // 每个IP 1分钟内最多30次点赞
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
        message: '点赞过于频繁，请稍后再试'
      })
    });
  }

  /**
   * 创建收藏限流中间件
   * @returns {Function} Express中间件
   */
  static favoritePostLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1分钟
      max: 20, // 每个IP 1分钟内最多20次收藏
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
        message: '收藏过于频繁，请稍后再试'
      })
    });
  }

  /**
   * 创建文件上传限流中间件
   * @returns {Function} Express中间件
   */
  static uploadLimiter() {
    return this.createLimiter({
      windowMs: 10 * 60 * 1000, // 10分钟
      max: 20, // 每个IP 10分钟内最多20次上传
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
        message: '文件上传过于频繁，请稍后再试'
      })
    });
  }

  /**
   * 创建基于用户的限流中间件
   * @param {Object} options 限流选项
   * @returns {Function} Express中间件
   */
  static createUserLimiter(options = {}) {
    const defaultOptions = {
      windowMs: 15 * 60 * 1000,
      max: 100,
      keyGenerator: (req) => {
        // 如果用户已认证，使用用户ID，否则使用IP
        return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
      }
    };

    return this.createLimiter({ ...defaultOptions, ...options });
  }

  /**
   * 创建Redis限流中间件（用于集群环境）
   * @param {Object} options 限流选项
   * @returns {Function} Express中间件
   */
  static createRedisLimiter(options = {}) {
    const defaultOptions = {
      windowMs: 15 * 60 * 1000,
      max: 100
    };

    const mergedOptions = { ...defaultOptions, ...options };

    return async (req, res, next) => {
      try {
        const key = `rate_limit:${mergedOptions.keyGenerator ? mergedOptions.keyGenerator(req) : req.ip}`;
        const window = Math.floor(Date.now() / mergedOptions.windowMs);
        const redisKey = `${key}:${window}`;

        // 获取当前计数
        const current = await redisClient.get(redisKey);
        const count = current ? parseInt(current) : 0;

        if (count >= mergedOptions.max) {
          return res.status(429).json(
            ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
              message: '请求过于频繁，请稍后再试'
            })
          );
        }

        // 增加计数
        const newCount = await redisClient.incr(redisKey);
        
        // 设置过期时间（如果是第一次访问）
        if (newCount === 1) {
          await redisClient.expire(redisKey, Math.ceil(mergedOptions.windowMs / 1000));
        }

        // 设置响应头
        res.set({
          'X-RateLimit-Limit': mergedOptions.max,
          'X-RateLimit-Remaining': Math.max(0, mergedOptions.max - newCount),
          'X-RateLimit-Reset': new Date(Date.now() + mergedOptions.windowMs)
        });

        next();
      } catch (err) {
        // Redis错误时跳过限流
        logger.error('Redis rate limiter error:', err);
        next();
      }
    };
  }

  /**
   * 创建动态限流中间件
   * @param {Function} optionsGenerator 动态生成选项的函数
   * @returns {Function} Express中间件
   */
  static createDynamicLimiter(optionsGenerator) {
    return (req, res, next) => {
      const options = optionsGenerator(req);
      const limiter = this.createLimiter(options);
      return limiter(req, res, next);
    };
  }

  /**
   * 创建基于路径的限流中间件
   * @param {Object} pathLimits 路径限制配置
   * @returns {Function} Express中间件
   */
  static createPathBasedLimiter(pathLimits) {
    const limiters = {};
    
    // 为每个路径创建专用的限流器
    Object.keys(pathLimits).forEach(path => {
      limiters[path] = this.createLimiter(pathLimits[path]);
    });

    return (req, res, next) => {
      const path = req.route?.path || req.path;
      const limiter = limiters[path];
      
      if (limiter) {
        return limiter(req, res, next);
      }
      
      next();
    };
  }

  /**
   * 创建滑动窗口限流中间件
   * @param {Object} options 限流选项
   * @returns {Function} Express中间件
   */
  static createSlidingWindowLimiter(options = {}) {
    const { windowMs = 15 * 60 * 1000, max = 100 } = options;

    return async (req, res, next) => {
      try {
        const key = `sliding_limit:${req.ip}`;
        const now = Date.now();
        const windowStart = now - windowMs;

        // 清理过期的记录
        await redisClient.zremrangebyscore(key, 0, windowStart);

        // 获取当前窗口内的请求数
        const count = await redisClient.zcard(key);

        if (count >= max) {
          return res.status(429).json(
            ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
              message: '请求过于频繁，请稍后再试'
            })
          );
        }

        // 记录当前请求
        await redisClient.zadd(key, now, `${now}-${Math.random()}`);
        await redisClient.expire(key, Math.ceil(windowMs / 1000));

        next();
      } catch (err) {
        // Redis错误时跳过限流
        logger.error('Redis rate limiter error:', err);
        next();
      }
    };
  }
}

module.exports = RateLimitMiddleware;