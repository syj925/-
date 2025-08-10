const { User, Post, Comment, Topic, Like, Favorite, Follow, Sequelize } = require('../../models');
const { Op } = require('sequelize');
const redisClient = require('../../utils/redis-client');
const logger = require('../../../config/logger');

/**
 * 管理员仪表盘服务
 */
class AdminDashboardService {
  constructor() {
    // 缓存键定义
    this.CACHE_KEYS = {
      DASHBOARD_BASIC: 'admin:dashboard:basic',
      DASHBOARD_TREND: 'admin:dashboard:trend:',
      DASHBOARD_USER_DIST: 'admin:dashboard:user_dist',
      DASHBOARD_ACTIVE_USERS: 'admin:dashboard:active',
      DASHBOARD_HOT_POSTS: 'admin:dashboard:hot_posts'
    };

    // 缓存过期时间（秒）
    this.CACHE_TTL = {
      BASIC: 300,        // 5分钟
      TREND: 3600,       // 1小时
      USER_DIST: 1800,   // 30分钟
      ACTIVE: 900,       // 15分钟
      HOT_POSTS: 600     // 10分钟
    };
  }

  /**
   * 获取仪表盘基础数据
   * @returns {Promise<Object>} 仪表盘数据
   */
  async getDashboardData() {
    try {
      // 尝试从缓存获取
      const cached = await this.getFromCache(this.CACHE_KEYS.DASHBOARD_BASIC);
      if (cached) {
        logger.debug('从缓存获取仪表盘基础数据');
        return cached;
      }

      logger.info('从数据库获取仪表盘基础数据');

      // 并行获取各项统计数据
      const [
        userStats,
        postStats, 
        commentStats,
        topicStats,
        activeUsers,
        hotPosts
      ] = await Promise.all([
        this.getUserStats(),
        this.getPostStats(),
        this.getCommentStats(),
        this.getTopicStats(),
        this.getActiveUsers(),
        this.getHotPosts()
      ]);

      const data = {
        userCount: userStats.total,
        postCount: postStats.total,
        commentCount: commentStats.total,
        topicCount: topicStats.total,
        newUserCount: userStats.today,
        newPostCount: postStats.today,
        newCommentCount: commentStats.today,
        newTopicCount: topicStats.today,
        activeUsers,
        hotPosts
      };

      // 缓存结果
      await this.setCache(this.CACHE_KEYS.DASHBOARD_BASIC, data, this.CACHE_TTL.BASIC);

      return data;
    } catch (error) {
      logger.error('获取仪表盘基础数据失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取趋势数据
   * @param {string} period 时间周期 (day/week/month)
   * @returns {Promise<Object>} 趋势数据
   */
  async getTrendData(period = 'week') {
    try {
      const cacheKey = `${this.CACHE_KEYS.DASHBOARD_TREND}${period}`;
      
      // 尝试从缓存获取
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        logger.debug('从缓存获取趋势数据', { period });
        return cached;
      }

      logger.info('从数据库获取趋势数据', { period });

      const { dateFormat, dateRange } = this.getPeriodConfig(period);
      
      // 并行获取各项趋势数据
      const [userTrend, postTrend, commentTrend] = await Promise.all([
        this.getUserTrend(dateFormat, dateRange),
        this.getPostTrend(dateFormat, dateRange),
        this.getCommentTrend(dateFormat, dateRange)
      ]);

      const data = {
        users: userTrend,
        posts: postTrend,
        comments: commentTrend
      };

      // 缓存结果
      await this.setCache(cacheKey, data, this.CACHE_TTL.TREND);

      return data;
    } catch (error) {
      logger.error('获取趋势数据失败', { error: error.message, period });
      throw error;
    }
  }

  /**
   * 获取用户分布数据
   * @returns {Promise<Array>} 用户分布数据
   */
  async getUserDistribution() {
    try {
      // 尝试从缓存获取
      const cached = await this.getFromCache(this.CACHE_KEYS.DASHBOARD_USER_DIST);
      if (cached) {
        logger.debug('从缓存获取用户分布数据');
        return cached;
      }

      logger.info('从数据库获取用户分布数据');

      const distribution = await User.findAll({
        attributes: [
          'role',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where: {
          deleted_at: null
        },
        group: ['role'],
        raw: true
      });

      // 转换为前端需要的格式
      const roleMap = {
        'student': '学生',
        'teacher': '教师', 
        'admin': '管理员',
        'user': '普通用户'
      };

      const data = distribution.map(item => ({
        value: parseInt(item.count),
        name: roleMap[item.role] || '其他'
      }));

      // 缓存结果
      await this.setCache(this.CACHE_KEYS.DASHBOARD_USER_DIST, data, this.CACHE_TTL.USER_DIST);

      return data;
    } catch (error) {
      logger.error('获取用户分布数据失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取用户统计
   * @returns {Promise<Object>} 用户统计数据
   */
  async getUserStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await User.findOne({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
        [
          Sequelize.fn('COUNT', 
            Sequelize.literal(`CASE WHEN created_at >= '${today.toISOString()}' THEN 1 END`)
          ), 
          'today'
        ]
      ],
      where: {
        deleted_at: null
      },
      raw: true
    });

    return {
      total: parseInt(result.total) || 0,
      today: parseInt(result.today) || 0
    };
  }

  /**
   * 获取帖子统计
   * @returns {Promise<Object>} 帖子统计数据
   */
  async getPostStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Post.findOne({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
        [
          Sequelize.fn('COUNT', 
            Sequelize.literal(`CASE WHEN created_at >= '${today.toISOString()}' THEN 1 END`)
          ), 
          'today'
        ]
      ],
      where: {
        status: 'published',
        deleted_at: null
      },
      raw: true
    });

    return {
      total: parseInt(result.total) || 0,
      today: parseInt(result.today) || 0
    };
  }

  /**
   * 获取评论统计
   * @returns {Promise<Object>} 评论统计数据
   */
  async getCommentStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Comment.findOne({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
        [
          Sequelize.fn('COUNT', 
            Sequelize.literal(`CASE WHEN created_at >= '${today.toISOString()}' THEN 1 END`)
          ), 
          'today'
        ]
      ],
      where: {
        deleted_at: null
      },
      raw: true
    });

    return {
      total: parseInt(result.total) || 0,
      today: parseInt(result.today) || 0
    };
  }

  /**
   * 获取话题统计
   * @returns {Promise<Object>} 话题统计数据
   */
  async getTopicStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Topic.findOne({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
        [
          Sequelize.fn('COUNT',
            Sequelize.literal(`CASE WHEN created_at >= '${today.toISOString()}' THEN 1 END`)
          ),
          'today'
        ]
      ],
      where: {
        deleted_at: null,
        status: 'active'
      },
      raw: true
    });

    return {
      total: parseInt(result.total) || 0,
      today: parseInt(result.today) || 0
    };
  }

  /**
   * 获取活跃用户列表（最近30天发帖数）
   * @returns {Promise<Array>} 活跃用户列表
   */
  async getActiveUsers() {
    try {
      // 尝试从缓存获取
      const cached = await this.getFromCache(this.CACHE_KEYS.DASHBOARD_ACTIVE_USERS);
      if (cached) {
        return cached;
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 使用 Sequelize ORM 查询活跃用户
      const activeUsers = await User.findAll({
        attributes: [
          'id', 'username', 'nickname', 'avatar',
          [Sequelize.fn('COUNT', Sequelize.col('posts.id')), 'posts']
        ],
        include: [{
          model: Post,
          as: 'posts',
          attributes: [],
          where: {
            created_at: {
              [Op.gte]: thirtyDaysAgo
            },
            status: 'published',
            deleted_at: null
          },
          required: true
        }],
        where: {
          deleted_at: null
        },
        group: ['User.id'],
        order: [[Sequelize.literal('posts'), 'DESC']],
        limit: 10,
        subQuery: false,
        raw: true  // 关键：使用 raw 模式获取原始数据
      });

      // 调试日志
      logger.info('活跃用户原始数据', {
        count: activeUsers.length,
        sample: activeUsers[0] || null
      });

      const data = activeUsers.map(user => {
        logger.info('单个用户数据处理', {
          userId: user.id,
          username: user.username,
          posts: user.posts,
          finalPosts: parseInt(user.posts) || 0
        });

        return {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar ? `http://localhost:3000${user.avatar}` : null,
          posts: parseInt(user.posts) || 0
        };
      });

      // 缓存结果
      await this.setCache(this.CACHE_KEYS.DASHBOARD_ACTIVE_USERS, data, this.CACHE_TTL.ACTIVE);

      return data;
    } catch (error) {
      logger.error('获取活跃用户失败', { error: error.message });
      return [];
    }
  }

  /**
   * 获取热门帖子列表（按点赞数）
   * @returns {Promise<Array>} 热门帖子列表
   */
  async getHotPosts() {
    try {
      // 尝试从缓存获取
      const cached = await this.getFromCache(this.CACHE_KEYS.DASHBOARD_HOT_POSTS);
      if (cached) {
        return cached;
      }

      const hotPosts = await Post.findAll({
        attributes: ['id', 'content', 'like_count', 'created_at'],
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar'],
          required: true
        }],
        where: {
          status: 'published',
          deleted_at: null
        },
        order: [
          ['like_count', 'DESC'],
          ['created_at', 'DESC']
        ],
        limit: 10
      });

      const data = hotPosts.map(post => ({
        id: post.id,
        content: post.content,
        likes: post.like_count || 0,
        createdAt: post.created_at,
        user: post.author ? {
          id: post.author.id,
          username: post.author.username,
          nickname: post.author.nickname,
          avatar: post.author.avatar
        } : null
      }));

      // 缓存结果
      await this.setCache(this.CACHE_KEYS.DASHBOARD_HOT_POSTS, data, this.CACHE_TTL.HOT_POSTS);

      return data;
    } catch (error) {
      logger.error('获取热门帖子失败', { error: error.message });
      return [];
    }
  }

  /**
   * 获取时间周期配置
   * @param {string} period 时间周期
   * @returns {Object} 配置对象
   */
  getPeriodConfig(period) {
    const configs = {
      day: {
        dateFormat: '%H',
        dateRange: 1,
        points: 8
      },
      week: {
        dateFormat: '%w',
        dateRange: 7,
        points: 7
      },
      month: {
        dateFormat: '%d',
        dateRange: 30,
        points: 7
      }
    };

    return configs[period] || configs.week;
  }

  /**
   * 获取用户趋势数据
   * @param {string} dateFormat 日期格式
   * @param {number} dateRange 日期范围
   * @returns {Promise<Array>} 趋势数据
   */
  async getUserTrend(dateFormat, dateRange) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    const trend = await User.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), dateFormat), 'period'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.gte]: startDate
        },
        deleted_at: null
      },
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), dateFormat)],
      order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), dateFormat), 'ASC']],
      raw: true
    });

    return this.fillTrendData(trend, dateRange);
  }

  /**
   * 获取帖子趋势数据
   * @param {string} dateFormat 日期格式
   * @param {number} dateRange 日期范围
   * @returns {Promise<Array>} 趋势数据
   */
  async getPostTrend(dateFormat, dateRange) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    const trend = await Post.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), dateFormat), 'period'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.gte]: startDate
        },
        status: 'published',
        deleted_at: null
      },
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), dateFormat)],
      order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), dateFormat), 'ASC']],
      raw: true
    });

    return this.fillTrendData(trend, dateRange);
  }

  /**
   * 获取评论趋势数据
   * @param {string} dateFormat 日期格式
   * @param {number} dateRange 日期范围
   * @returns {Promise<Array>} 趋势数据
   */
  async getCommentTrend(dateFormat, dateRange) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    const trend = await Comment.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), dateFormat), 'period'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.gte]: startDate
        },
        deleted_at: null
      },
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), dateFormat)],
      order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), dateFormat), 'ASC']],
      raw: true
    });

    return this.fillTrendData(trend, dateRange);
  }

  /**
   * 填充趋势数据（补齐缺失的时间点）
   * @param {Array} trend 原始趋势数据
   * @param {number} dateRange 日期范围
   * @returns {Array} 填充后的数据
   */
  fillTrendData(trend, dateRange) {
    const result = new Array(dateRange === 1 ? 8 : 7).fill(0);

    trend.forEach(item => {
      const index = parseInt(item.period);
      if (index >= 0 && index < result.length) {
        result[index] = parseInt(item.count);
      }
    });

    return result;
  }

  /**
   * 获取系统状态
   * @returns {Promise<Object>} 系统状态
   */
  async getSystemStatus() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 清除所有缓存
   * @returns {Promise<void>}
   */
  async clearCache() {
    const keys = Object.values(this.CACHE_KEYS);
    for (const key of keys) {
      if (key.endsWith(':')) {
        // 处理带前缀的键
        const pattern = `${key}*`;
        await redisClient.deletePattern(pattern);
      } else {
        await redisClient.del(key);
      }
    }
    logger.info('仪表盘缓存已清除');
  }

  /**
   * 从缓存获取数据
   * @param {string} key 缓存键
   * @returns {Promise<any>} 缓存数据
   */
  async getFromCache(key) {
    try {
      const data = await redisClient.get(key);
      // Redis客户端已经自动进行了JSON解析，直接返回结果
      return data;
    } catch (error) {
      logger.warn('从缓存获取数据失败', { key, error: error.message });
      return null;
    }
  }

  /**
   * 设置缓存数据
   * @param {string} key 缓存键
   * @param {any} data 数据
   * @param {number} ttl 过期时间（秒）
   * @returns {Promise<void>}
   */
  async setCache(key, data, ttl) {
    try {
      // Redis客户端会自动进行JSON序列化，不需要手动JSON.stringify
      await redisClient.setex(key, ttl, data);
    } catch (error) {
      logger.warn('设置缓存数据失败', { key, error: error.message });
    }
  }
}

module.exports = new AdminDashboardService();
