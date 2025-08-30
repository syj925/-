const { StatusCodes } = require('http-status-codes');
const { ResponseUtil } = require('../utils');
const logger = require('../../config/logger');
const { Op } = require('sequelize');

/**
 * 发布限制中间件
 */
class PublishLimitMiddleware {
  /**
   * 获取发布限制设置（动态创建）
   * @returns {Promise<Object>} 发布限制设置
   */
  static async getPublishLimitSettings() {
    try {
      const { Setting } = require('../models');

      // 动态创建或获取每日发帖限制
      const [postLimitSetting] = await Setting.findOrCreate({
        where: { key: 'dailyPostLimit' },
        defaults: {
          key: 'dailyPostLimit',
          value: '10',
          description: '每日发帖限制',
          type: 'number',
          is_system: true
        }
      });

      // 动态创建或获取每日评论限制
      const [commentLimitSetting] = await Setting.findOrCreate({
        where: { key: 'dailyCommentLimit' },
        defaults: {
          key: 'dailyCommentLimit',
          value: '50',
          description: '每日评论限制',
          type: 'number',
          is_system: true
        }
      });

      return {
        dailyPostLimit: parseInt(postLimitSetting.value, 10) || 10,
        dailyCommentLimit: parseInt(commentLimitSetting.value, 10) || 50
      };
    } catch (error) {
      logger.error('获取发布限制设置失败:', error);
      return {
        dailyPostLimit: 10,
        dailyCommentLimit: 50
      };
    }
  }

  /**
   * 获取今日开始时间
   * @returns {Date} 今日开始时间
   */
  static getTodayStart() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /**
   * 获取今日结束时间
   * @returns {Date} 今日结束时间
   */
  static getTodayEnd() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  }

  /**
   * 检查用户今日发帖数量
   * @param {String} userId 用户ID
   * @returns {Promise<Number>} 今日发帖数量
   */
  static async getTodayPostCount(userId) {
    try {
      const { Post } = require('../models');
      
      const count = await Post.count({
        where: {
          user_id: userId,
          created_at: {
            [Op.between]: [this.getTodayStart(), this.getTodayEnd()]
          }
        }
      });
      
      return count;
    } catch (error) {
      logger.error('获取今日发帖数量失败:', error);
      return 0;
    }
  }

  /**
   * 检查用户今日评论数量
   * @param {String} userId 用户ID
   * @returns {Promise<Number>} 今日评论数量
   */
  static async getTodayCommentCount(userId) {
    try {
      const { Comment } = require('../models');
      
      const count = await Comment.count({
        where: {
          user_id: userId,
          created_at: {
            [Op.between]: [this.getTodayStart(), this.getTodayEnd()]
          }
        }
      });
      
      return count;
    } catch (error) {
      logger.error('获取今日评论数量失败:', error);
      return 0;
    }
  }

  /**
   * 帖子发布限制中间件
   * @returns {Function} Express中间件
   */
  static postLimiter() {
    return async (req, res, next) => {
      try {


        const userId = req.user?.id;
        
        if (!userId) {
          return res.status(StatusCodes.UNAUTHORIZED).json(
            ResponseUtil.error('用户未登录', StatusCodes.UNAUTHORIZED, {
              errorType: 'USER_NOT_AUTHENTICATED',
              message: '请先登录'
            })
          );
        }

        // 获取发布限制设置
        const settings = await this.getPublishLimitSettings();
        
        // 获取用户今日发帖数量
        const todayPostCount = await this.getTodayPostCount(userId);
        
        // 检查是否超过限制
        if (todayPostCount >= settings.dailyPostLimit) {
          logger.warn('用户发帖超过每日限制', {
            userId,
            todayPostCount,
            dailyLimit: settings.dailyPostLimit
          });

          return res.status(StatusCodes.TOO_MANY_REQUESTS).json(
            ResponseUtil.error('今日发帖次数已达上限', StatusCodes.TOO_MANY_REQUESTS, {
              errorType: 'DAILY_POST_LIMIT_EXCEEDED',
              todayCount: todayPostCount,
              dailyLimit: settings.dailyPostLimit,
              resetTime: this.getTodayEnd().toISOString(),
              message: `您今日已发布${todayPostCount}篇帖子，已达到每日${settings.dailyPostLimit}篇的限制。请明天再试。`
            })
          );
        }

        // 添加限制信息到请求对象
        req.publishLimitInfo = {
          type: 'post',
          todayCount: todayPostCount,
          dailyLimit: settings.dailyPostLimit,
          remaining: settings.dailyPostLimit - todayPostCount,
          resetTime: this.getTodayEnd().toISOString()
        };

        next();

      } catch (error) {
        logger.error('帖子发布限制中间件错误:', error);
        // 发生错误时不阻止发布，但记录日志
        next();
      }
    };
  }

  /**
   * 评论发布限制中间件
   * @returns {Function} Express中间件
   */
  static commentLimiter() {
    return async (req, res, next) => {
      try {
        const userId = req.user?.id;
        
        if (!userId) {
          return res.status(StatusCodes.UNAUTHORIZED).json(
            ResponseUtil.error('用户未登录', StatusCodes.UNAUTHORIZED, {
              errorType: 'USER_NOT_AUTHENTICATED',
              message: '请先登录'
            })
          );
        }

        // 获取发布限制设置
        const settings = await this.getPublishLimitSettings();
        
        // 获取用户今日评论数量
        const todayCommentCount = await this.getTodayCommentCount(userId);
        
        // 检查是否超过限制
        if (todayCommentCount >= settings.dailyCommentLimit) {
          logger.warn('用户评论超过每日限制', {
            userId,
            todayCommentCount,
            dailyLimit: settings.dailyCommentLimit
          });

          return res.status(StatusCodes.TOO_MANY_REQUESTS).json(
            ResponseUtil.error('今日评论次数已达上限', StatusCodes.TOO_MANY_REQUESTS, {
              errorType: 'DAILY_COMMENT_LIMIT_EXCEEDED',
              todayCount: todayCommentCount,
              dailyLimit: settings.dailyCommentLimit,
              resetTime: this.getTodayEnd().toISOString(),
              message: `您今日已发布${todayCommentCount}条评论，已达到每日${settings.dailyCommentLimit}条的限制。请明天再试。`
            })
          );
        }

        // 添加限制信息到请求对象
        req.publishLimitInfo = {
          type: 'comment',
          todayCount: todayCommentCount,
          dailyLimit: settings.dailyCommentLimit,
          remaining: settings.dailyCommentLimit - todayCommentCount,
          resetTime: this.getTodayEnd().toISOString()
        };

        next();

      } catch (error) {
        logger.error('评论发布限制中间件错误:', error);
        // 发生错误时不阻止发布，但记录日志
        next();
      }
    };
  }

  /**
   * 获取用户今日发布统计
   * @param {String} userId 用户ID
   * @returns {Promise<Object>} 发布统计信息
   */
  static async getUserTodayStats(userId) {
    try {
      const settings = await this.getPublishLimitSettings();
      const todayPostCount = await this.getTodayPostCount(userId);
      const todayCommentCount = await this.getTodayCommentCount(userId);

      return {
        posts: {
          todayCount: todayPostCount,
          dailyLimit: settings.dailyPostLimit,
          remaining: Math.max(0, settings.dailyPostLimit - todayPostCount),
          canPublish: todayPostCount < settings.dailyPostLimit
        },
        comments: {
          todayCount: todayCommentCount,
          dailyLimit: settings.dailyCommentLimit,
          remaining: Math.max(0, settings.dailyCommentLimit - todayCommentCount),
          canPublish: todayCommentCount < settings.dailyCommentLimit
        },
        resetTime: this.getTodayEnd().toISOString()
      };
    } catch (error) {
      logger.error('获取用户今日发布统计失败:', error);
      return {
        posts: { todayCount: 0, dailyLimit: 10, remaining: 10, canPublish: true },
        comments: { todayCount: 0, dailyLimit: 50, remaining: 50, canPublish: true },
        resetTime: this.getTodayEnd().toISOString()
      };
    }
  }

  /**
   * 检查用户是否可以发布内容
   * @param {String} userId 用户ID
   * @param {String} type 内容类型 ('post' | 'comment')
   * @returns {Promise<Object>} 检查结果
   */
  static async canUserPublish(userId, type) {
    try {
      const stats = await this.getUserTodayStats(userId);
      
      if (type === 'post') {
        return {
          canPublish: stats.posts.canPublish,
          reason: stats.posts.canPublish ? null : 'DAILY_POST_LIMIT_EXCEEDED',
          stats: stats.posts
        };
      } else if (type === 'comment') {
        return {
          canPublish: stats.comments.canPublish,
          reason: stats.comments.canPublish ? null : 'DAILY_COMMENT_LIMIT_EXCEEDED',
          stats: stats.comments
        };
      }
      
      return { canPublish: true, reason: null, stats: null };
    } catch (error) {
      logger.error('检查用户发布权限失败:', error);
      return { canPublish: true, reason: null, stats: null };
    }
  }
}

module.exports = PublishLimitMiddleware;
