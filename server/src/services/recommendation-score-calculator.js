const { Post, User, Category, PostImage, Topic } = require('../models');
const settingRepository = require('../repositories/setting.repository');
const redisClient = require('../utils/redis-client');
const logger = require('../../config/logger');
const { Op, Sequelize } = require('sequelize');

/**
 * 推荐分数计算器 v2.0
 * 
 * 职责：
 * - 批量计算帖子推荐分数
 * - 更新auto_recommended字段
 * - 支持定时任务调用
 * - 保持算法配置化能力
 */
class RecommendationScoreCalculator {
  constructor() {
    this.batchSize = 100; // 批处理大小
    this.defaultSettings = {
      // 算法权重配置
      likeWeight: 2.0,
      commentWeight: 3.0,
      collectionWeight: 4.0,
      viewWeight: 0.5,
      timeDecayDays: 10,
      maxAgeDays: 30,
      
      // 推荐阈值配置
      scoreThreshold: 15.0,
      
      // 质量加分配置
      newPostBonus: 5.0,
      imageBonus: 3.0,
      contentBonus: 2.0,
      topicBonus: 1.0,
      engagementFactor: 0.2,
      minInteractionScore: 2,
      
      // 多样性控制
      maxSameAuthorRatio: 0.3,
      diversityPeriodHours: 24
    };
  }

  /**
   * 🚀 主要接口：批量计算并更新推荐分数
   * @param {Object} options 计算选项
   * @returns {Promise<Object>} 计算结果统计
   */
  async calculateAndUpdateScores(options = {}) {
    const {
      forceUpdate = false,
      maxAgeDays = null
    } = options;

    logger.info('🎯 开始批量计算推荐分数', { forceUpdate, maxAgeDays });

    try {
      // 1. 获取推荐配置
      const settings = await this.getSettings();
      
      // 2. 检查是否需要强制更新
      const shouldForceUpdate = forceUpdate || await this.checkForceUpdateFlag();
      
      // 3. 获取需要计算的帖子
      const posts = await this.getCandidatePosts(settings, shouldForceUpdate);
      
      if (posts.length === 0) {
        logger.info('📋 没有需要更新的帖子');
        return { processed: 0, recommended: 0, unrecommended: 0 };
      }

      // 4. 批量计算分数
      const results = await this.batchCalculateScores(posts, settings);
      
      // 5. 批量更新数据库
      const updateStats = await this.batchUpdateDatabase(results, settings);
      
      // 6. 清除强制更新标记
      if (shouldForceUpdate) {
        await redisClient.del('recommendation:force_update');
      }

      logger.info('✅ 推荐分数计算完成', updateStats);
      return updateStats;

    } catch (error) {
      logger.error('推荐分数计算失败:', error);
      throw error;
    }
  }

  /**
   * 📊 获取候选帖子（需要计算分数的帖子）
   * @param {Object} settings 推荐配置
   * @param {Boolean} forceUpdate 是否强制更新
   * @returns {Promise<Array>} 候选帖子列表
   */
  async getCandidatePosts(settings, forceUpdate = false) {
    const whereCondition = {
      status: 'published'
    };

    // 时间限制（只处理指定天数内的帖子）
    if (settings.maxAgeDays > 0) {
      const maxAgeDate = new Date();
      maxAgeDate.setDate(maxAgeDate.getDate() - settings.maxAgeDays);
      whereCondition.createdAt = {  // 🔧 修复：使用createdAt而不是created_at
        [Op.gte]: maxAgeDate
      };
    }

    // 如果不是强制更新，只更新最近变动的帖子
    if (!forceUpdate) {
      const lastUpdateThreshold = new Date();
      lastUpdateThreshold.setHours(lastUpdateThreshold.getHours() - (settings.updateIntervalHours || 1));
      
      whereCondition[Op.or] = [
        { score_updated_at: null },
        { score_updated_at: { [Op.lt]: lastUpdateThreshold } },
        { updatedAt: { [Op.gt]: Sequelize.col('score_updated_at') } }  // 🔧 修复：使用updatedAt
      ];
    }

    const posts = await Post.findAll({
      where: whereCondition,
      include: [
        {
          model: PostImage,
          as: 'images',
          attributes: ['id']
        },
        {
          model: Topic,
          as: 'topics',
          attributes: ['id'],
          through: { attributes: [] }
        }
      ],
      order: [['createdAt', 'DESC']],  // 🔧 修复：使用createdAt
      limit: 1000 // 限制单次处理数量
    });

    logger.info(`📋 获取到 ${posts.length} 个候选帖子`);
    return posts;
  }

  /**
   * 🧮 批量计算帖子分数
   * @param {Array} posts 帖子列表
   * @param {Object} settings 推荐配置
   * @returns {Promise<Array>} 计算结果
   */
  async batchCalculateScores(posts, settings) {
    const results = [];
    const now = new Date();

    // 获取作者多样性统计（批量计算时不排除任何帖子，以保证性能）
    const authorStats = await this.getAuthorDiversityStats(settings);

    for (const post of posts) {
      try {
        const score = this.calculatePostScore(post, settings, now, authorStats);
        
        results.push({
          id: post.id,
          originalScore: post.recommend_score || 0,
          newScore: score,
          shouldRecommend: score >= settings.scoreThreshold,
          authorId: post.user_id
        });

      } catch (error) {
        logger.error(`计算帖子 ${post.id} 分数失败:`, error);
        // 跳过有问题的帖子，继续处理其他帖子
      }
    }

    logger.info(`🧮 完成 ${results.length} 个帖子的分数计算`);
    return results;
  }

  /**
   * 🔍 详细分析单个帖子分数（调试和分析用）
   * @param {Number} postId 帖子ID
   * @returns {Promise<Object>} 详细分数分析结果
   */
  async analyzePostScore(postId) {
    try {
      // 获取帖子详情
      const post = await Post.findOne({
        where: { id: postId, status: 'published' },
        include: [
          {
            model: PostImage,
            as: 'images',
            attributes: ['id']
          },
          {
            model: Topic,
            as: 'topics',
            attributes: ['id', 'name'],
            through: { attributes: [] }
          },
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'nickname']
          }
        ]
      });

      if (!post) {
        throw new Error(`帖子 ${postId} 不存在或未发布`);
      }

      // 获取配置和统计
      const settings = await this.getSettings();
      const now = new Date();
      const authorStats = await this.getAuthorDiversityStats(settings, postId);

      // 详细计算过程
      const analysis = this.calculatePostScoreDetailed(post, settings, now, authorStats);

      return {
        post: {
          id: post.id,
          title: post.title,
          content: post.content?.substring(0, 100) + (post.content?.length > 100 ? '...' : ''),
          author: post.author,
          createdAt: post.createdAt,
          like_count: post.like_count || 0,
          comment_count: post.comment_count || 0,
          favorite_count: post.favorite_count || 0,
          view_count: post.view_count || 0,
          hasImages: post.images?.length > 0,
          imageCount: post.images?.length || 0,
          hasTopics: post.topics?.length > 0,
          topicCount: post.topics?.length || 0,
          topics: post.topics?.map(t => t.name) || [],
          contentLength: post.content?.length || 0,
          currentScore: post.recommend_score || 0,
          isRecommended: post.auto_recommended || false
        },
        settings: settings,
        analysis: analysis,
        timestamp: now.toISOString()
      };

    } catch (error) {
      logger.error('分析帖子分数失败:', error);
      throw error;
    }
  }

  /**
   * 🧮 详细分数计算（返回每一步的计算过程）
   * @param {Object} post 帖子对象
   * @param {Object} settings 推荐配置
   * @param {Date} now 当前时间
   * @param {Object} authorStats 作者多样性统计
   * @returns {Object} 详细计算结果
   */
  calculatePostScoreDetailed(post, settings, now, authorStats) {
    // 1. 基础互动分数详细计算
    const likeScore = (post.like_count || 0) * settings.likeWeight;
    const commentScore = (post.comment_count || 0) * settings.commentWeight;
    const favoriteScore = (post.favorite_count || 0) * settings.collectionWeight;
    const viewScore = (post.view_count || 0) * settings.viewWeight;
    const baseScore = likeScore + commentScore + favoriteScore + viewScore;

    // 2. 时间衰减因子
    const createdAt = post.createdAt || post.created_at;
    const ageInDays = (now - new Date(createdAt)) / (1000 * 60 * 60 * 24);
    const timeFactor = Math.exp(-ageInDays / settings.timeDecayDays);

    // 3. 新帖保护机制
    const isNewPost = ageInDays < 1;
    const totalInteraction = (post.like_count || 0) + (post.comment_count || 0) + (post.favorite_count || 0);
    const hasMinimalInteraction = totalInteraction < 3;
    const newPostBonus = (isNewPost && hasMinimalInteraction) ? settings.newPostBonus : 0;

    // 4. 内容质量加分详细
    const imageBonus = (post.images && post.images.length > 0) ? settings.imageBonus : 0;
    const contentBonus = (post.content && post.content.length > 100) ? settings.contentBonus : 0;
    const topicBonus = (post.topics && post.topics.length > 0) ? settings.topicBonus : 0;
    const qualityBonus = imageBonus + contentBonus + topicBonus;

    // 5. 互动质量加权
    const engagementRatio = post.comment_count / Math.max(post.like_count, 1);
    const qualityMultiplier = 1 + (engagementRatio * settings.engagementFactor);

    // 6. 作者多样性惩罚
    const authorPenalty = this.calculateAuthorDiversityPenalty(
      post.user_id, 
      authorStats, 
      settings
    );

    // 7. 最终分数计算
    const baseWithTime = baseScore * timeFactor;
    const totalBonus = newPostBonus + qualityBonus;
    const beforePenalty = (baseWithTime + totalBonus) * qualityMultiplier;
    let finalScore = beforePenalty - authorPenalty;
    
    // 限制分数范围
    const originalFinalScore = finalScore;
    finalScore = Math.max(0, Math.min(finalScore, 100));
    const wasClipped = originalFinalScore !== finalScore;

    return {
      // 基础分数组成
      baseScoreBreakdown: {
        likeScore: Math.round(likeScore * 100) / 100,
        commentScore: Math.round(commentScore * 100) / 100,
        favoriteScore: Math.round(favoriteScore * 100) / 100,
        viewScore: Math.round(viewScore * 100) / 100,
        total: Math.round(baseScore * 100) / 100
      },
      
      // 时间因子
      timeFactor: {
        ageInDays: Math.round(ageInDays * 100) / 100,
        decayDays: settings.timeDecayDays,
        factor: Math.round(timeFactor * 1000) / 1000,
        baseWithTime: Math.round(baseWithTime * 100) / 100
      },
      
      // 新帖保护
      newPostProtection: {
        isNewPost: isNewPost,
        hasMinimalInteraction: hasMinimalInteraction,
        totalInteraction: totalInteraction,
        bonus: newPostBonus,
        activated: newPostBonus > 0
      },
      
      // 质量加分
      qualityBonus: {
        imageBonus: imageBonus,
        contentBonus: contentBonus,
        topicBonus: topicBonus,
        total: qualityBonus
      },
      
      // 互动质量
      engagementQuality: {
        commentLikeRatio: Math.round(engagementRatio * 1000) / 1000,
        multiplier: Math.round(qualityMultiplier * 1000) / 1000,
        impact: Math.round((qualityMultiplier - 1) * 100 * 100) / 100 + '%'
      },
      
      // 作者多样性
      authorDiversity: {
        penalty: Math.round(authorPenalty * 100) / 100,
        authorId: post.user_id,
        explanation: authorPenalty > 0 ? '该作者推荐内容过多，被施加惩罚' : '作者多样性正常'
      },
      
      // 计算过程
      calculationSteps: {
        step1_baseScore: Math.round(baseScore * 100) / 100,
        step2_withTimeFactor: Math.round(baseWithTime * 100) / 100,
        step3_withBonus: Math.round((baseWithTime + totalBonus) * 100) / 100,
        step4_withMultiplier: Math.round(beforePenalty * 100) / 100,
        step5_withPenalty: Math.round((beforePenalty - authorPenalty) * 100) / 100,
        step6_final: Math.round(finalScore * 100) / 100
      },
      
      // 最终结果
      result: {
        finalScore: Math.round(finalScore * 100) / 100,
        isRecommended: finalScore >= settings.scoreThreshold,
        threshold: settings.scoreThreshold,
        wasClipped: wasClipped,
        originalScore: wasClipped ? Math.round(originalFinalScore * 100) / 100 : null
      }
    };
  }

  /**
   * 🎯 单个帖子分数计算（增强算法）
   * @param {Object} post 帖子对象
   * @param {Object} settings 推荐配置
   * @param {Date} now 当前时间
   * @param {Object} authorStats 作者多样性统计
   * @returns {Number} 推荐分数
   */
  calculatePostScore(post, settings, now, authorStats) {
    // 1. 基础互动分数
    const baseScore = 
      (post.like_count || 0) * settings.likeWeight +
      (post.comment_count || 0) * settings.commentWeight +
      (post.favorite_count || 0) * settings.collectionWeight +
      (post.view_count || 0) * settings.viewWeight;

    // 2. 时间衰减因子
    const createdAt = post.createdAt || post.created_at; // 兼容两种字段格式
    const ageInDays = (now - new Date(createdAt)) / (1000 * 60 * 60 * 24);
    const timeFactor = Math.exp(-ageInDays / settings.timeDecayDays);

    // 3. 🆕 新帖保护机制
    const isNewPost = ageInDays < 1;
    const hasMinimalInteraction = (post.like_count + post.comment_count + post.favorite_count) < 3;
    const newPostBonus = (isNewPost && hasMinimalInteraction) ? settings.newPostBonus : 0;

    // 4. 🎨 内容质量加分
    let qualityBonus = 0;
    
    // 有图片加分
    if (post.images && post.images.length > 0) {
      qualityBonus += settings.imageBonus;
    }
    
    // 长内容加分
    if (post.content && post.content.length > 100) {
      qualityBonus += settings.contentBonus;
    }
    
    // 有话题加分
    if (post.topics && post.topics.length > 0) {
      qualityBonus += settings.topicBonus;
    }

    // 5. 🎯 互动质量加权
    const engagementRatio = post.comment_count / Math.max(post.like_count, 1);
    const qualityMultiplier = 1 + (engagementRatio * settings.engagementFactor);

    // 6. 🔄 多样性惩罚（防止同一作者霸榜）
    const authorPenalty = this.calculateAuthorDiversityPenalty(
      post.user_id, 
      authorStats, 
      settings
    );

    // 7. 计算最终分数
    let finalScore = (baseScore * timeFactor + newPostBonus + qualityBonus) 
                    * qualityMultiplier 
                    - authorPenalty;

    // 限制分数范围 0-100
    finalScore = Math.max(0, Math.min(finalScore, 100));

    return Math.round(finalScore * 100) / 100; // 保留2位小数
  }

  /**
   * 📊 获取作者多样性统计
   * @param {Object} settings 推荐配置
   * @param {String} excludePostId 需要排除的帖子ID（防止循环依赖）
   * @returns {Promise<Object>} 作者统计信息
   */
  async getAuthorDiversityStats(settings, excludePostId = null) {
    try {
      const periodHours = settings.diversityPeriodHours || 24;
      const sinceTime = new Date();
      sinceTime.setHours(sinceTime.getHours() - periodHours);

      const whereCondition = {
        auto_recommended: true,
        score_updated_at: { [Op.gte]: sinceTime }
      };

      // 🔧 排除正在计算的帖子，避免循环依赖
      if (excludePostId) {
        whereCondition.id = { [Op.ne]: excludePostId };
        logger.debug(`📊 计算多样性统计时排除帖子: ${excludePostId}`);
      }

      const authorCounts = await Post.findAll({
        where: whereCondition,
        attributes: [
          'user_id',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['user_id'],
        raw: true
      });

      const stats = {};
      let totalRecommended = 0;

      authorCounts.forEach(item => {
        stats[item.user_id] = parseInt(item.count);
        totalRecommended += parseInt(item.count);
      });

      return { authorCounts: stats, totalRecommended };
    } catch (error) {
      logger.error('获取作者多样性统计失败:', error);
      return { authorCounts: {}, totalRecommended: 0 };
    }
  }

  /**
   * 🎯 计算作者多样性惩罚
   * @param {String} authorId 作者ID
   * @param {Object} authorStats 作者统计
   * @param {Object} settings 推荐配置
   * @returns {Number} 惩罚分数
   */
  calculateAuthorDiversityPenalty(authorId, authorStats, settings) {
    const { authorCounts, totalRecommended } = authorStats;
    
    if (totalRecommended === 0) return 0;
    
    const authorCount = authorCounts[authorId] || 0;
    const authorRatio = authorCount / totalRecommended;
    const maxRatio = settings.maxSameAuthorRatio || 0.3;
    
    if (authorRatio > maxRatio) {
      // 超过最大占比，施加惩罚
      return (authorRatio - maxRatio) * 20; // 每超过1%扣2分
    }
    
    return 0;
  }

  /**
   * 💾 批量更新数据库
   * @param {Array} results 计算结果
   * @param {Object} settings 推荐配置
   * @returns {Promise<Object>} 更新统计
   */
  async batchUpdateDatabase(results, settings) {
    let processed = 0;
    let recommended = 0;
    let unrecommended = 0;

    const now = new Date();
    const batchSize = this.batchSize;

    // 分批处理，避免单次更新过多
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      
      const updatePromises = batch.map(async (result) => {
        try {
          await Post.update({
            recommend_score: result.newScore,
            auto_recommended: result.shouldRecommend,
            score_updated_at: now
          }, {
            where: { id: result.id }
          });

          processed++;
          if (result.shouldRecommend) {
            recommended++;
          } else {
            unrecommended++;
          }

        } catch (error) {
          logger.error(`更新帖子 ${result.id} 失败:`, error);
        }
      });

      await Promise.all(updatePromises);
      
      // 添加小延迟，避免数据库压力过大
      if (i + batchSize < results.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { processed, recommended, unrecommended };
  }

  /**
   * 🎛️ 获取推荐配置
   * @returns {Promise<Object>} 推荐配置
   */
  async getSettings() {
    try {
      const settings = await settingRepository.getRecommendationSettings();
      return { ...this.defaultSettings, ...settings };
    } catch (error) {
      logger.error('获取推荐配置失败，使用默认配置:', error);
      return this.defaultSettings;
    }
  }

  /**
   * 🔄 检查强制更新标记
   * @returns {Promise<Boolean>} 是否需要强制更新
   */
  async checkForceUpdateFlag() {
    try {
      const flag = await redisClient.get('recommendation:force_update');
      return !!flag;
    } catch (error) {
      logger.error('检查强制更新标记失败:', error);
      return false;
    }
  }

  /**
   * 📊 获取计算统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getCalculationStats() {
    try {
      const [
        totalPosts,
        totalRecommended,
        avgScore,
        lastUpdateTime
      ] = await Promise.all([
        Post.count({ where: { status: 'published' } }),
        Post.count({ where: { status: 'published', auto_recommended: true } }),
        Post.findOne({
          where: { status: 'published' },
          attributes: [[Sequelize.fn('AVG', Sequelize.col('recommend_score')), 'avgScore']]
        }),
        Post.findOne({
          where: { status: 'published', score_updated_at: { [Op.not]: null } },
          attributes: [[Sequelize.fn('MAX', Sequelize.col('score_updated_at')), 'lastUpdate']]
        })
      ]);

      return {
        totalPosts,
        totalRecommended,
        recommendationRate: totalPosts > 0 ? (totalRecommended / totalPosts * 100).toFixed(2) : 0,
        avgScore: parseFloat(avgScore?.dataValues?.avgScore || 0).toFixed(2),
        lastUpdateTime: lastUpdateTime?.dataValues?.lastUpdate
      };
    } catch (error) {
      logger.error('获取计算统计失败:', error);
      return null;
    }
  }
}

module.exports = new RecommendationScoreCalculator();
