const recommendationService = require('../../services/recommendation.service');
const settingRepository = require('../../repositories/setting.repository');
const { ResponseUtil } = require('../../utils');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../../config/logger');
const { Post } = require('../../models');

/**
 * 管理员推荐算法控制器
 */
class AdminRecommendationController {
  /**
   * 获取推荐算法设置
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getRecommendationSettings(req, res, next) {
    try {
      logger.info('管理员获取推荐算法设置', {
        adminId: req.admin?.id,
        adminUsername: req.admin?.username
      });

      const settings = await recommendationService.getRecommendationSettings();

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(settings, '获取推荐设置成功')
      );
    } catch (error) {
      logger.error('获取推荐设置失败:', error);
      next(error);
    }
  }

  /**
   * 更新推荐算法设置
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async updateRecommendationSettings(req, res, next) {
    try {
      const {
        likeWeight,
        commentWeight,
        collectionWeight,
        viewWeight,
        timeDecayDays,
        maxAgeDays,
        maxAdminRecommended,
        minInteractionScore,
        strategy,
        enableCache,
        cacheExpireMinutes
      } = req.body;

      logger.info('管理员更新推荐算法设置', {
        adminId: req.admin?.id,
        adminUsername: req.admin?.username,
        settings: req.body
      });

      // 验证参数
      const validationErrors = this.validateRecommendationSettings(req.body);
      if (validationErrors.length > 0) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('参数验证失败', validationErrors)
        );
      }

      // 更新设置
      const settingsToUpdate = {};
      if (likeWeight !== undefined) settingsToUpdate.likeWeight = likeWeight;
      if (commentWeight !== undefined) settingsToUpdate.commentWeight = commentWeight;
      if (collectionWeight !== undefined) settingsToUpdate.collectionWeight = collectionWeight;
      if (viewWeight !== undefined) settingsToUpdate.viewWeight = viewWeight;
      if (timeDecayDays !== undefined) settingsToUpdate.timeDecayDays = timeDecayDays;
      if (maxAgeDays !== undefined) settingsToUpdate.maxAgeDays = maxAgeDays;
      if (maxAdminRecommended !== undefined) settingsToUpdate.maxAdminRecommended = maxAdminRecommended;
      if (minInteractionScore !== undefined) settingsToUpdate.minInteractionScore = minInteractionScore;
      if (strategy !== undefined) settingsToUpdate.strategy = strategy;
      if (enableCache !== undefined) settingsToUpdate.enableCache = enableCache;
      if (cacheExpireMinutes !== undefined) settingsToUpdate.cacheExpireMinutes = cacheExpireMinutes;

      await settingRepository.setMultipleSettings(settingsToUpdate);

      // 清除推荐缓存
      await recommendationService.clearRecommendationCache();

      // 获取更新后的设置
      const updatedSettings = await recommendationService.getRecommendationSettings();

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(updatedSettings, '推荐设置更新成功')
      );
    } catch (error) {
      logger.error('更新推荐设置失败:', error);
      next(error);
    }
  }

  /**
   * 初始化推荐算法设置
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async initializeRecommendationSettings(req, res, next) {
    try {
      logger.info('管理员初始化推荐算法设置', {
        adminId: req.admin?.id,
        adminUsername: req.admin?.username
      });

      const results = await settingRepository.initializeRecommendationSettings();

      // 清除推荐缓存
      await recommendationService.clearRecommendationCache();

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(results, '推荐设置初始化成功')
      );
    } catch (error) {
      logger.error('初始化推荐设置失败:', error);
      next(error);
    }
  }

  /**
   * 清除推荐缓存
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async clearRecommendationCache(req, res, next) {
    try {
      logger.info('管理员清除推荐缓存', {
        adminId: req.admin?.id,
        adminUsername: req.admin?.username
      });

      await recommendationService.clearRecommendationCache();

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(null, '推荐缓存清除成功')
      );
    } catch (error) {
      logger.error('清除推荐缓存失败:', error);
      next(error);
    }
  }

  /**
   * 获取推荐算法统计信息
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getRecommendationStats(req, res, next) {
    try {
      logger.info('管理员获取推荐算法统计', {
        adminId: req.admin?.id,
        adminUsername: req.admin?.username
      });

      // 获取推荐统计数据
      const stats = await this.calculateRecommendationStats();

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(stats, '获取推荐统计成功')
      );
    } catch (error) {
      logger.error('获取推荐统计失败:', error);
      next(error);
    }
  }

  /**
   * 测试推荐算法
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async testRecommendationAlgorithm(req, res, next) {
    try {
      const { strategy = 'mixed', pageSize = 10 } = req.query;

      logger.info('管理员测试推荐算法', {
        adminId: req.admin?.id,
        adminUsername: req.admin?.username,
        strategy,
        pageSize
      });

      const options = {
        page: 1,
        pageSize: parseInt(pageSize),
        strategy,
        userId: null // 匿名测试
      };

      const result = await recommendationService.getRecommendedPosts(options);

      // 添加调试信息
      const debugInfo = {
        strategy: result.strategy,
        totalPosts: result.list.length,
        adminRecommendedCount: result.adminRecommendedCount || 0,
        algorithmRecommendedCount: result.algorithmRecommendedCount || 0,
        posts: result.list.map(post => ({
          id: post.id,
          content: post.content?.substring(0, 50) + '...',
          isAdminRecommended: post.isAdminRecommended,
          recommendScore: post.recommendScore,
          scoreDetails: post.scoreDetails,
          like_count: post.like_count,
          comment_count: post.comment_count,
          favorite_count: post.favorite_count,
          view_count: post.view_count,
          created_at: post.created_at
        }))
      };

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(debugInfo, '推荐算法测试完成')
      );
    } catch (error) {
      logger.error('测试推荐算法失败:', error);
      next(error);
    }
  }

  /**
   * 验证推荐设置参数
   * @param {Object} settings 设置对象
   * @returns {Array} 验证错误数组
   */
  validateRecommendationSettings(settings) {
    const errors = [];

    // 权重参数验证
    const weightFields = ['likeWeight', 'commentWeight', 'collectionWeight', 'viewWeight'];
    weightFields.forEach(field => {
      if (settings[field] !== undefined) {
        const value = parseFloat(settings[field]);
        if (isNaN(value) || value < 0 || value > 10) {
          errors.push(`${field} 必须是 0-10 之间的数字`);
        }
      }
    });

    // 天数参数验证
    const dayFields = ['timeDecayDays', 'maxAgeDays'];
    dayFields.forEach(field => {
      if (settings[field] !== undefined) {
        const value = parseInt(settings[field]);
        if (isNaN(value) || value < 1 || value > 365) {
          errors.push(`${field} 必须是 1-365 之间的整数`);
        }
      }
    });

    // 数量参数验证
    if (settings.maxAdminRecommended !== undefined) {
      const value = parseInt(settings.maxAdminRecommended);
      if (isNaN(value) || value < 1 || value > 20) {
        errors.push('maxAdminRecommended 必须是 1-20 之间的整数');
      }
    }

    if (settings.cacheExpireMinutes !== undefined) {
      const value = parseInt(settings.cacheExpireMinutes);
      if (isNaN(value) || value < 1 || value > 1440) {
        errors.push('cacheExpireMinutes 必须是 1-1440 之间的整数');
      }
    }

    // 策略验证
    if (settings.strategy !== undefined) {
      const validStrategies = ['hot', 'latest', 'mixed'];
      if (!validStrategies.includes(settings.strategy)) {
        errors.push('strategy 必须是 hot, latest, mixed 中的一个');
      }
    }

    return errors;
  }

  /**
   * 计算推荐算法统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async calculateRecommendationStats() {
    try {
      // 获取推荐设置
      const recommendationService = require('../../services/recommendation.service');
      const postRepository = require('../../repositories/post.repository');
      const settings = await recommendationService.getRecommendationSettings();

      const [totalPosts, adminRecommendedPosts] = await Promise.all([
        Post.count({ where: { status: 'published' } }),
        Post.count({ where: { status: 'published', is_recommended: true } })
      ]);

      // 使用真实的候选帖子筛选逻辑
      let algorithmCandidates = 0;
      try {
        const candidates = await postRepository.findCandidatesForRecommendation({
          pageSize: 1000, // 获取所有候选帖子用于统计
          excludeIds: [], // 不排除任何帖子
          maxAgeDays: settings.maxAgeDays || 30,
          minInteractionScore: settings.minInteractionScore || 2,
          includeDetails: false // 只需要数量，不需要详细信息
        });
        algorithmCandidates = candidates.length;
      } catch (error) {
        logger.error('获取算法候选帖子失败:', error);
        // 如果获取失败，使用简单计算作为后备
        algorithmCandidates = Math.max(0, totalPosts - adminRecommendedPosts);
      }

      // 计算实际推荐覆盖率：(管理员推荐 + 算法候选) / 总帖子数
      const totalRecommendable = adminRecommendedPosts + algorithmCandidates;
      const recommendationCoverage = totalPosts > 0 ? (totalRecommendable / totalPosts * 100).toFixed(2) : 0;

      return {
        totalPosts,
        adminRecommendedPosts,
        algorithmCandidates,
        recommendationCoverage
      };
    } catch (error) {
      logger.error('计算推荐统计失败:', error);
      return {
        totalPosts: 0,
        adminRecommendedPosts: 0,
        algorithmCandidates: 0,
        recommendationCoverage: 0
      };
    }
  }
}

module.exports = new AdminRecommendationController();
