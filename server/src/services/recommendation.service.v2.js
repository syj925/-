const { Post, User, Category, PostImage, Topic } = require('../models');
const settingRepository = require('../repositories/setting.repository');
const statusCacheService = require('./status-cache.service');
const redisClient = require('../utils/redis-client');
const logger = require('../../config/logger');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const errorCodes = require('../constants/error-codes');
const { Op } = require('sequelize');

/**
 * 推荐系统 v2.0 - 简化架构版本
 * 
 * 核心设计理念：
 * - 简单查询（基于预计算字段）
 * - 保持配置化（算法参数可调）
 * - 单一职责（专注推荐列表获取）
 * - 性能优化（索引友好的查询）
 */
class RecommendationServiceV2 {
  constructor() {
    this.settingsCacheKey = 'recommendation:settings';
    this.defaultSettings = {
      // 🎯 算法权重配置（保持可配置）
      likeWeight: 2.0,
      commentWeight: 3.0,
      collectionWeight: 4.0,
      viewWeight: 0.5,
      timeDecayDays: 10,
      maxAgeDays: 30,
      
      // 🎛️ 推荐策略配置
      scoreThreshold: 15.0,      // 算法推荐分数阈值
      maxAdminRecommended: 5,    // 管理员推荐上限
      enableScoreSort: true,     // 启用分数排序
      
      // ⏰ 更新频率配置
      updateIntervalHours: 1,    // 分数更新间隔（小时）
      
      // 🆕 新增配置
      newPostBonus: 5.0,         // 新帖保护加分
      imageBonus: 3.0,           // 有图片加分
      contentBonus: 2.0,         // 长内容加分
      topicBonus: 1.0,           // 有话题加分
      engagementFactor: 0.2,     // 互动质量因子
      minInteractionScore: 2     // 最低互动分数
    };
  }

  /**
   * 🎯 主要接口：获取推荐帖子列表（极简版）
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 推荐结果
   */
  async getRecommendedPosts(options = {}) {
    const {
      page = 1,
      pageSize = 6,
      userId = null
    } = options;

    logger.info('🎯 获取推荐帖子 v2.0', { page, pageSize, userId });

    try {
      // 1. 简单查询推荐帖子（基于预计算字段）
      const result = await this.queryRecommendedPosts({ page, pageSize });
      
      // 2. 添加用户交互状态（复用现有逻辑）
      if (userId && result.list && result.list.length > 0) {
        await this.addUserInteractionStates(result.list, userId);
      }

      // 3. 添加热门评论预览功能
      if (result.list && result.list.length > 0) {
        await this.addHotCommentsPreview(result.list, userId);
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
   * 🔍 核心查询：推荐帖子数据库查询（性能优化）
   * @param {Object} options 查询选项  
   * @returns {Promise<Object>} 查询结果
   */
  async queryRecommendedPosts({ page, pageSize }) {
    const offset = (page - 1) * pageSize;
    
    // 🚀 简单高效的查询（使用索引）
    const queryOptions = {
      where: {
        status: 'published',
        [Op.or]: [
          { is_recommended: true },      // 管理员推荐
          { auto_recommended: true }     // 算法推荐
        ]
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar', 'school', 'department']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon']
        },
        {
          model: PostImage,
          as: 'images',
          attributes: ['id', 'url', 'thumbnail_url', 'width', 'height', 'order'],
          order: [['order', 'ASC']]
        },
        {
          model: Topic,
          as: 'topics',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ],
      order: [
        ['is_recommended', 'DESC'],      // 管理员推荐优先
        ['recommend_score', 'DESC'],     // 按分数排序  
        ['created_at', 'DESC']          // 同分数按时间
      ],
      offset,
      limit: pageSize
    };

    // 执行查询
    const { count, rows } = await Post.findAndCountAll(queryOptions);

    // 🔧 数据清理（移除循环引用）
    const cleanList = rows.map(post => {
      const cleanPost = post.toJSON ? post.toJSON() : post;
      return cleanPost;
    });

    return {
      list: cleanList,
      pagination: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        total: count,
        pages: Math.ceil(count / pageSize)
      }
    };
  }

  /**
   * 🎨 添加用户交互状态（复用现有StatusCacheService）
   * @param {Array} posts 帖子列表
   * @param {String} userId 用户ID
   */
  async addUserInteractionStates(posts, userId) {
    if (!posts || posts.length === 0 || !userId) return;

    const postIds = posts.map(post => post.id);
    const authorIds = posts.map(post => post.author?.id).filter(Boolean);

    try {
      // 📡 批量获取用户状态（并行查询）
      const [likeStates, favoriteStates, followingStates] = await Promise.all([
        statusCacheService.isLiked(userId, postIds),
        statusCacheService.isFavorited(userId, postIds),
        authorIds.length > 0 ? statusCacheService.isFollowing(userId, authorIds) : {}
      ]);

      // 🎯 统一状态注入（与其他API保持一致）
      posts.forEach(post => {
        // 清除可能存在的根级别状态字段
        delete post.is_liked;
        delete post.is_favorited;
        
        // 设置标准的dataValues状态
        post.dataValues = post.dataValues || {};
        post.dataValues.is_liked = likeStates[post.id] || false;
        post.dataValues.is_favorited = favoriteStates[post.id] || false;
        
        // 🔧 同时设置到根级别，支持两种命名格式
        post.is_liked = likeStates[post.id] || false;
        post.is_favorited = favoriteStates[post.id] || false;
        // 🔧 同时设置驼峰命名格式，确保前端组件能访问到
        post.isLiked = likeStates[post.id] || false;
        post.isFavorited = favoriteStates[post.id] || false;
        
        // 添加作者关注状态
        if (post.author && post.author.id) {
          post.author.dataValues = post.author.dataValues || {};
          post.author.dataValues.isFollowing = followingStates[post.author.id] || false;
          // 🔧 同时设置到根级别，确保前端能正确访问
          post.author.isFollowing = followingStates[post.author.id] || false;
          post.author.is_following = followingStates[post.author.id] || false;
        }
      });

      logger.debug('✅ 用户状态注入完成', { 
        userId, 
        postCount: posts.length,
        likeCount: Object.keys(likeStates).length,
        favoriteCount: Object.keys(favoriteStates).length 
      });

    } catch (error) {
      logger.error('用户状态注入失败:', error);
      // 状态注入失败不影响主要功能，继续返回帖子数据
    }
  }

  /**
   * 🎛️ 获取推荐配置（保持原有配置能力）
   * @returns {Promise<Object>} 推荐设置对象
   */
  async getRecommendationSettings() {
    try {
      // 先尝试从缓存获取
      const cached = await redisClient.get(this.settingsCacheKey);
      if (cached) {
        return cached;
      }

      // 从数据库获取配置
      const settings = await settingRepository.getRecommendationSettings();
      const finalSettings = { ...this.defaultSettings, ...settings };

      // 缓存配置（5分钟）
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
   * 🧹 清除推荐配置缓存
   */
  async clearRecommendationCache() {
    try {
      await redisClient.del(this.settingsCacheKey);
      logger.info('✅ 推荐配置缓存已清除');
    } catch (error) {
      logger.error('清除推荐缓存失败:', error);
    }
  }

  /**
   * 📊 获取推荐统计信息
   * @returns {Promise<Object>} 统计数据
   */
  async getRecommendationStats() {
    try {
      const [
        totalPosts,
        manualRecommended,
        autoRecommended,
        avgScore,
        maxScore,
        lastUpdateTime
      ] = await Promise.all([
        Post.count({ where: { status: 'published' } }),
        Post.count({ where: { status: 'published', is_recommended: true } }),
        Post.count({ where: { status: 'published', auto_recommended: true } }),
        Post.findOne({
          where: { status: 'published' },
          attributes: [[Post.sequelize.fn('AVG', Post.sequelize.col('recommend_score')), 'avgScore']]
        }),
        Post.findOne({
          where: { status: 'published' },
          attributes: [[Post.sequelize.fn('MAX', Post.sequelize.col('recommend_score')), 'maxScore']]
        }),
        Post.findOne({
          where: { 
            status: 'published',
            score_updated_at: { [Op.ne]: null }
          },
          attributes: [[Post.sequelize.fn('MAX', Post.sequelize.col('score_updated_at')), 'lastUpdateTime']]
        })
      ]);

      return {
        totalPosts,
        manualRecommended,
        autoRecommended,
        totalRecommended: manualRecommended + autoRecommended,
        recommendationCoverage: totalPosts > 0 ? 
          ((manualRecommended + autoRecommended) / totalPosts * 100).toFixed(2) : 0,
        avgScore: parseFloat(avgScore?.dataValues?.avgScore || 0).toFixed(2),
        maxScore: parseFloat(maxScore?.dataValues?.maxScore || 0).toFixed(2),
        lastUpdateTime: lastUpdateTime?.dataValues?.lastUpdateTime || null
      };
    } catch (error) {
      logger.error('获取推荐统计失败:', error);
      return {
        totalPosts: 0,
        manualRecommended: 0,
        autoRecommended: 0,
        totalRecommended: 0,
        recommendationCoverage: 0,
        avgScore: 0,
        maxScore: 0,
        lastUpdateTime: null
      };
    }
  }

  /**
   * 🔧 触发推荐分数重新计算（手动触发）
   * 🚀 修复：直接执行计算，不依赖定时任务
   */
  async triggerScoreRecalculation() {
    try {
      logger.info('🔄 开始手动触发推荐分数重计算');
      
      // 🔧 修复：直接调用计算器执行强制重新计算
      const calculator = require('./recommendation-score-calculator');
      const result = await calculator.calculateAndUpdateScores({ forceUpdate: true });
      
      logger.info('✅ 手动推荐分数重计算完成', result);
      
      return { 
        success: true, 
        message: '推荐分数重新计算完成',
        ...result 
      };
    } catch (error) {
      logger.error('触发推荐分数重计算失败:', error);
      throw new Error(`触发重计算失败: ${error.message}`);
    }
  }

  /**
   * 🔍 分析单个帖子的推荐分数详情
   * @param {Number} postId 帖子ID
   * @returns {Promise<Object>} 详细分析结果
   */
  async analyzePostScore(postId) {
    try {
      logger.info(`🔍 开始分析帖子 ${postId} 的推荐分数`);
      const calculator = require('./recommendation-score-calculator');
      const analysis = await calculator.analyzePostScore(postId);
      logger.info(`✅ 帖子 ${postId} 分数分析完成`);
      return analysis;
    } catch (error) {
      logger.error(`分析帖子 ${postId} 分数失败:`, error);
      throw new Error(`分析失败: ${error.message}`);
    }
  }

  /**
   * 🔥 为帖子列表添加热门评论预览
   * @param {Array} posts 帖子列表
   * @param {String} userId 当前用户ID（可选）
   */
  async addHotCommentsPreview(posts, userId = null) {
    try {
      const postService = require('./post.service');
      
      // 为每个帖子添加热门评论预览
      for (const post of posts) {
        const hotComments = await postService.getPostHotComments(post.id, 2, userId);
        
        // 添加到帖子数据中（同时设置到dataValues和根级别，确保前端能访问）
        if (post.dataValues) {
          post.dataValues.hot_comments = hotComments.list;
          post.dataValues.total_comments = hotComments.total;
        }
        
        // 同时设置到根级别，确保前端组件能访问
        post.hot_comments = hotComments.list;
        post.total_comments = hotComments.total;
      }
    } catch (error) {
      logger.error('添加热门评论预览失败:', error);
      // 不影响主要功能，只记录错误
    }
  }
}

module.exports = new RecommendationServiceV2();
