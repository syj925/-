const postRepository = require('../repositories/post.repository');
const settingRepository = require('../repositories/setting.repository');
const redisClient = require('../utils/redis-client');
const logger = require('../../config/logger');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const errorCodes = require('../constants/error-codes');
const cacheConfig = require('../../config/cache');

/**
 * 推荐算法服务层
 * 基于新版架构设计的智能推荐系统
 */
class RecommendationService {
  constructor() {
    this.cachePrefix = cacheConfig.RECOMMENDATION.PREFIX;
    this.settingsCacheKey = 'recommendation:settings';
    this.defaultSettings = {
      likeWeight: 2.0,
      commentWeight: 3.0,
      collectionWeight: 4.0,
      viewWeight: 0.5,
      timeDecayDays: 10,
      maxAgeDays: 30,
      maxAdminRecommended: 5,
      strategy: 'mixed', // hot, latest, mixed
      enableCache: true,
      cacheExpireMinutes: 15
    };
  }

  /**
   * 获取推荐帖子列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 推荐结果
   */
  async getRecommendedPosts(options = {}) {
    const {
      page = 1,
      pageSize = 6,
      userId = null,
      strategy = null
    } = options;

    logger.info('获取推荐帖子', { page, pageSize, userId, strategy });

    try {
      // 获取推荐配置
      const settings = await this.getRecommendationSettings();
      const finalStrategy = strategy || settings.strategy;

      // 检查缓存
      const cacheKey = `${this.cachePrefix}posts:${finalStrategy}:${page}:${pageSize}:${userId || 'anonymous'}`;
      
      if (settings.enableCache) {
        const cached = await this.getCachedResult(cacheKey);
        if (cached) {
          logger.info('返回缓存的推荐结果');
          return cached;
        }
      }

      // 根据策略获取推荐结果
      let result;
      switch (finalStrategy) {
        case 'hot':
          result = await this.getHotRecommendations(options, settings);
          break;
        case 'latest':
          result = await this.getLatestRecommendations(options, settings);
          break;
        case 'mixed':
        default:
          result = await this.getMixedRecommendations(options, settings);
          break;
      }

      // 缓存结果
      if (settings.enableCache && result) {
        await this.setCachedResult(cacheKey, result, settings.cacheExpireMinutes);
      }

      return result;
    } catch (error) {
      logger.error('获取推荐帖子失败:', error);
      throw ErrorMiddleware.createError(
        '获取推荐内容失败',
        StatusCodes.INTERNAL_SERVER_ERROR,
        errorCodes.SERVER_ERROR
      );
    }
  }

  /**
   * 混合推荐策略（默认）
   * 结合管理员推荐和算法推荐
   */
  async getMixedRecommendations(options, settings) {
    const { page, pageSize, userId } = options;

    // 1. 获取管理员推荐的帖子
    const adminRecommended = await this.getAdminRecommendedPosts(settings);

    // 2. 获取算法推荐的帖子
    const algorithmRecommended = await this.getAlgorithmRecommendedPosts(options, settings, adminRecommended);

    // 3. 合并结果，管理员推荐优先
    const allPosts = [...adminRecommended, ...algorithmRecommended];

    // 4. 分页处理
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPosts = allPosts.slice(startIndex, endIndex);

    // 5. 添加用户交互状态
    const postsWithUserState = await this.addUserInteractionState(paginatedPosts, userId);

    // 6. 清理数据以避免循环引用
    const cleanedPosts = postsWithUserState.map(post => this.cleanDataForSerialization(post));

    return {
      list: cleanedPosts,
      pagination: {
        page,
        pageSize,
        total: allPosts.length,
        pages: Math.ceil(allPosts.length / pageSize)
      },
      strategy: 'mixed',
      adminRecommendedCount: adminRecommended.length,
      algorithmRecommendedCount: algorithmRecommended.length
    };
  }

  /**
   * 热门推荐策略
   */
  async getHotRecommendations(options, settings) {
    const queryOptions = {
      ...options,
      status: 'published',
      orderBy: 'hot',
      orderDirection: 'DESC',
      includeDetails: true
    };

    const result = await postRepository.findAll(queryOptions);
    const postsWithUserState = await this.addUserInteractionState(result.list, options.userId);
    const cleanedPosts = postsWithUserState.map(post => this.cleanDataForSerialization(post));

    return {
      ...result,
      list: cleanedPosts,
      strategy: 'hot'
    };
  }

  /**
   * 最新推荐策略
   */
  async getLatestRecommendations(options, settings) {
    const queryOptions = {
      ...options,
      status: 'published',
      orderBy: 'createdAt',
      orderDirection: 'DESC',
      includeDetails: true
    };

    const result = await postRepository.findAll(queryOptions);
    const postsWithUserState = await this.addUserInteractionState(result.list, options.userId);
    const cleanedPosts = postsWithUserState.map(post => this.cleanDataForSerialization(post));

    return {
      ...result,
      list: cleanedPosts,
      strategy: 'latest'
    };
  }

  /**
   * 获取管理员推荐的帖子
   */
  async getAdminRecommendedPosts(settings) {
    const queryOptions = {
      page: 1,
      pageSize: settings.maxAdminRecommended,
      status: 'published',
      isRecommended: true,
      orderBy: 'createdAt',
      orderDirection: 'DESC',
      includeDetails: true
    };

    const result = await postRepository.findAll(queryOptions);
    return result.list.map(post => {
      const cleanedPost = this.cleanDataForSerialization(post);
      return {
        ...cleanedPost,
        isAdminRecommended: true,
        recommendScore: 1000 // 给管理员推荐最高分
      };
    });
  }

  /**
   * 获取算法推荐的帖子
   */
  async getAlgorithmRecommendedPosts(options, settings, excludePosts = []) {
    const { pageSize } = options;
    const excludeIds = excludePosts.map(post => post.id);

    // 获取候选帖子（排除管理员推荐的）
    const candidateOptions = {
      page: 1,
      pageSize: Math.max(pageSize * 3, 50), // 获取更多候选帖子用于算法计算
      status: 'published',
      excludeIds,
      includeDetails: true,
      maxAgeDays: settings.maxAgeDays,
      minInteractionScore: settings.minInteractionScore || 2 // 使用配置的最低互动分数阈值
    };

    const candidates = await postRepository.findCandidatesForRecommendation(candidateOptions);

    // 计算推荐分数
    const scoredPosts = this.calculateRecommendationScores(candidates, settings);

    // 按分数排序并返回指定数量
    scoredPosts.sort((a, b) => b.recommendScore - a.recommendScore);

    // 清理数据并返回
    const cleanedPosts = scoredPosts.slice(0, pageSize).map(post => this.cleanDataForSerialization(post));
    return cleanedPosts;
  }

  /**
   * 计算推荐分数
   */
  calculateRecommendationScores(posts, settings) {
    const now = new Date();

    return posts.map(post => {
      // 基础互动分数
      const baseScore = 
        (post.like_count || 0) * settings.likeWeight +
        (post.comment_count || 0) * settings.commentWeight +
        (post.favorite_count || 0) * settings.collectionWeight +
        (post.view_count || 0) * settings.viewWeight;

      // 时间衰减因子
      const ageInDays = (now - new Date(post.created_at)) / (1000 * 60 * 60 * 24);
      const timeFactor = Math.exp(-ageInDays / settings.timeDecayDays);

      // 新帖子保护机制
      const isNewPost = ageInDays < 1;
      const hasMinimalInteraction = (post.like_count + post.comment_count + post.favorite_count) < 3;
      
      let finalScore = baseScore * timeFactor;

      // 新帖子且互动少的情况下，给予基础分数
      if (isNewPost && hasMinimalInteraction) {
        finalScore = Math.max(finalScore, 1.0); // 确保新帖子有基础曝光机会
      }

      // 质量加权（可扩展）
      const qualityBonus = this.calculateQualityBonus(post);
      finalScore += qualityBonus;

      const cleanedPost = this.cleanDataForSerialization(post);
      return {
        ...cleanedPost,
        recommendScore: finalScore,
        isAdminRecommended: false,
        scoreDetails: {
          baseScore,
          timeFactor,
          qualityBonus,
          ageInDays: Math.round(ageInDays * 100) / 100
        }
      };
    });
  }

  /**
   * 计算内容质量加分
   */
  calculateQualityBonus(post) {
    let bonus = 0;

    // 内容长度加分
    if (post.content && post.content.length > 50) {
      bonus += 0.5;
    }

    // 有图片加分
    if (post.images && post.images.length > 0) {
      bonus += 0.3;
    }

    // 有话题标签加分
    if (post.topics && post.topics.length > 0) {
      bonus += 0.2;
    }

    return bonus;
  }

  /**
   * 添加用户交互状态
   */
  async addUserInteractionState(posts, userId) {
    if (!userId || !posts.length) {
      return posts.map(post => {
        // 确保转换为普通对象，避免循环引用
        const plainPost = post.toJSON ? post.toJSON() : post;
        return {
          ...plainPost,
          isLiked: false,
          isFavorited: false
        };
      });
    }

    // 使用状态缓存服务获取用户的点赞和收藏状态
    const statusCacheService = require('./status-cache.service');
    const postIds = posts.map(post => post.id);
    
    const [likeStates, favoriteStates] = await Promise.all([
      statusCacheService.isLiked(userId, postIds),
      statusCacheService.isFavorited(userId, postIds)
    ]);

    return posts.map(post => {
      // 确保转换为普通对象，避免循环引用
      const plainPost = post.toJSON ? post.toJSON() : post;
      return {
        ...plainPost,
        isLiked: likeStates[post.id] || false,
        isFavorited: favoriteStates[post.id] || false
      };
    });
  }

  /**
   * 获取推荐配置
   */
  async getRecommendationSettings() {
    try {
      // 先尝试从缓存获取
      const cached = await redisClient.get(this.settingsCacheKey);
      if (cached && typeof cached === 'string') {
        try {
          return JSON.parse(cached);
        } catch (parseError) {
          logger.warn('缓存配置解析失败:', parseError);
          // 清除无效缓存
          await redisClient.del(this.settingsCacheKey);
        }
      }

      // 从数据库获取配置
      const settings = await settingRepository.getRecommendationSettings();
      const finalSettings = { ...this.defaultSettings, ...settings };

      // 缓存配置（5分钟）
      // 注意：不要手动JSON.stringify，Redis客户端会自动处理序列化
      try {
        await redisClient.setex(this.settingsCacheKey, 300, finalSettings);
      } catch (cacheError) {
        logger.warn('缓存配置失败:', cacheError);
      }

      return finalSettings;
    } catch (error) {
      logger.error('获取推荐配置失败:', error);
      return this.defaultSettings;
    }
  }

  /**
   * 清除推荐缓存
   */
  async clearRecommendationCache() {
    try {
      const pattern = `${this.cachePrefix}*`;
      
      // 使用现有的 deletePattern 方法
      const deletedCount = await redisClient.deletePattern(pattern);
      logger.info(`清除推荐缓存: ${deletedCount} 个键`);

      // 清除配置缓存
      await redisClient.del(this.settingsCacheKey);
    } catch (error) {
      logger.error('清除推荐缓存失败:', error);
    }
  }

  /**
   * 智能缓存更新 - 只清除特定用户的缓存
   * @param {String} userId 用户ID
   */
  async invalidateUserCache(userId) {
    // 注释：此方法已不再使用
    // 原因：用户操作不应该清除推荐缓存，让缓存自然过期即可
    // 状态信息通过 statusCacheService 单独管理
    logger.debug(`推荐缓存清除已禁用，用户ID: ${userId}`);
    return;
  }

  /**
   * 防抖缓存清除 - 避免频繁清除
   * @param {String} userId 用户ID
   */
  async debouncedCacheInvalidation(userId) {
    // 注释：此方法已不再使用
    // 原因：用户操作不应该清除推荐缓存，让缓存自然过期即可
    // 状态信息通过 statusCacheService 单独管理
    logger.debug(`防抖缓存清除已禁用，用户ID: ${userId}`);
    return;
  }

  /**
   * 获取缓存结果
   */
  async getCachedResult(key) {
    try {
      const cached = await redisClient.get(key);
      if (!cached) return null;

      // Redis客户端已经自动进行了JSON解析，直接返回结果
      return cached;
    } catch (error) {
      logger.error('获取缓存失败:', error);
      return null;
    }
  }

  /**
   * 设置缓存结果
   */
  async setCachedResult(key, data, expireMinutes) {
    try {
      // 清理数据，移除循环引用
      const cleanData = this.cleanDataForSerialization(data);
      // Redis客户端会自动进行JSON序列化，不需要手动JSON.stringify
      await redisClient.setex(key, expireMinutes * 60, cleanData);
    } catch (error) {
      logger.error('设置缓存失败:', error);
    }
  }

  /**
   * 清理数据以避免循环引用
   * 使用 Sequelize 的 toJSON() 方法进行安全序列化
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

    // 如果是普通对象，直接返回
    if (typeof data === 'object' && data !== null) {
      return data;
    }

    return data;
  }


}

module.exports = new RecommendationService();
