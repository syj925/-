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
        res.status(429).json(options.message());
      }
    };

    return rateLimit({
      ...defaultOptions,
      ...options
    });
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
      windowMs: 24 * 60 * 60 * 1000, // 24小时
      max: 5, // 每个IP 24小时内最多5次注册尝试
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
        message: '注册尝试次数过多，请24小时后再试'
      })
    });
  }

  /**
   * 创建验证码限流中间件
   * @returns {Function} Express中间件
   */
  static verifyCodeLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1小时
      max: 5, // 每个IP 1小时内最多5次验证码请求
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
        message: '验证码请求次数过多，请1小时后再试'
      })
    });
  }

  /**
   * 创建上传限流中间件
   * @returns {Function} Express中间件
   */
  static uploadLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1小时
      max: 30, // 每个IP 1小时内最多30次上传
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
        message: '上传次数过多，请稍后再试'
      })
    });
  }

  /**
   * 创建发帖限流中间件
   * @returns {Function} Express中间件
   */
  static postLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1小时
      max: 50, // 每个IP 1小时内最多50次发帖
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
        message: '发帖次数过多，请稍后再试'
      })
    });
  }

  /**
   * 创建评论限流中间件
   * @returns {Function} Express中间件
   */
  static commentLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1小时
      max: 100, // 每个IP 1小时内最多100次评论
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
        message: '评论次数过多，请稍后再试'
      })
    });
  }

  /**
   * 创建点赞限流中间件
   * @returns {Function} Express中间件
   */
  static likeLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1小时
      max: 200, // 每个IP 1小时内最多200次点赞
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
        message: '点赞次数过多，请稍后再试'
      })
    });
  }

  /**
   * 创建收藏限流中间件
   * @returns {Function} Express中间件
   */
  static favoritePostLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1小时
      max: 100, // 每个IP 1小时内最多100次收藏
      message: () => ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED, {
        message: '收藏次数过多，请稍后再试'
      })
    });
  }

  /**
   * 创建基于Redis的限流中间件（高级版，用于分布式环境）
   * 注意：此方法需要配合Redis使用，适用于生产环境
   * @param {Object} options 限流选项
   * @returns {Function} Express中间件
   */
  static createRedisLimiter(options = {}) {
    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100, // 最大请求数
      keyPrefix: 'ratelimit:', // Redis键前缀
      handler: (req, res, next) => {
        logger.warn(`Redis rate limit exceeded: ${req.ip}`, {
          ip: req.ip,
          path: req.originalUrl,
          method: req.method
        });
        return res.status(429).json(ResponseUtil.error(errorCodes.RATE_LIMIT_EXCEEDED));
      }
    };

    const opts = { ...defaultOptions, ...options };

    return async (req, res, next) => {
      try {
        // 生成键
        const key = `${opts.keyPrefix}${req.ip}`;
        
        // 获取当前计数
        const current = await redisClient.get(key) || 0;
        
        // 设置头信息
        res.setHeader('X-RateLimit-Limit', opts.max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, opts.max - current));
        
        // 检查是否超过限制
        if (current >= opts.max) {
          return opts.handler(req, res, next);
        }
        
        // 增加计数并设置过期时间
        await redisClient.incr(key);
        await redisClient.expire(key, Math.floor(opts.windowMs / 1000));
        
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