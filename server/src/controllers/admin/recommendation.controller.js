const recommendationService = require('../../services/recommendation.service.v2');
const settingService = require('../../services/setting.service');
const postService = require('../../services/post.service');
const { ResponseUtil } = require('../../utils');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../../config/logger');
const redisClient = require('../../utils/redis-client');
const RecommendationPresets = require('../../../config/recommendation-presets');

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
        cacheExpireMinutes,
        // 🆕 v2.0 新增字段
        scoreThreshold,
        newPostBonus,
        imageBonus,
        contentBonus,
        topicBonus,
        engagementFactor,
        maxSameAuthorRatio,
        diversityPeriodHours,
        updateIntervalHours,
        enableScoreSort,
        searchPageRecommendCount,
        enableSearchPageRecommend,
        searchRecommendTypes
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
      
      // 🎯 基础权重设置
      if (likeWeight !== undefined) settingsToUpdate.likeWeight = likeWeight;
      if (commentWeight !== undefined) settingsToUpdate.commentWeight = commentWeight;
      if (collectionWeight !== undefined) settingsToUpdate.collectionWeight = collectionWeight;
      if (viewWeight !== undefined) settingsToUpdate.viewWeight = viewWeight;
      if (timeDecayDays !== undefined) settingsToUpdate.timeDecayDays = timeDecayDays;
      if (maxAgeDays !== undefined) settingsToUpdate.maxAgeDays = maxAgeDays;
      
      // 🎛️ 推荐策略设置
      if (scoreThreshold !== undefined) settingsToUpdate.scoreThreshold = scoreThreshold;
      if (maxAdminRecommended !== undefined) settingsToUpdate.maxAdminRecommended = maxAdminRecommended;
      if (enableScoreSort !== undefined) settingsToUpdate.enableScoreSort = enableScoreSort;
      if (minInteractionScore !== undefined) settingsToUpdate.minInteractionScore = minInteractionScore;
      if (strategy !== undefined) settingsToUpdate.strategy = strategy;
      
      // 🎨 质量评估设置 (v2.0新增)
      if (newPostBonus !== undefined) settingsToUpdate.newPostBonus = newPostBonus;
      if (imageBonus !== undefined) settingsToUpdate.imageBonus = imageBonus;
      if (contentBonus !== undefined) settingsToUpdate.contentBonus = contentBonus;
      if (topicBonus !== undefined) settingsToUpdate.topicBonus = topicBonus;
      if (engagementFactor !== undefined) settingsToUpdate.engagementFactor = engagementFactor;
      
      // 🔄 多样性控制设置 (v2.0新增)
      if (maxSameAuthorRatio !== undefined) settingsToUpdate.maxSameAuthorRatio = maxSameAuthorRatio;
      if (diversityPeriodHours !== undefined) settingsToUpdate.diversityPeriodHours = diversityPeriodHours;
      
      // ⏰ 更新频率设置
      if (updateIntervalHours !== undefined) settingsToUpdate.updateIntervalHours = updateIntervalHours;
      
      // 🏪 缓存设置
      if (enableCache !== undefined) settingsToUpdate.enableCache = enableCache;
      if (cacheExpireMinutes !== undefined) settingsToUpdate.cacheExpireMinutes = cacheExpireMinutes;
      
      // 🔍 搜索页推荐设置
      if (searchPageRecommendCount !== undefined) settingsToUpdate.searchPageRecommendCount = searchPageRecommendCount;
      if (enableSearchPageRecommend !== undefined) settingsToUpdate.enableSearchPageRecommend = enableSearchPageRecommend;
      if (searchRecommendTypes !== undefined) settingsToUpdate.searchRecommendTypes = JSON.stringify(searchRecommendTypes);

      await settingService.setMultipleSettings(settingsToUpdate);

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

      const results = await settingService.initializeRecommendationSettings();

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

      // 🆕 使用新版推荐服务获取统计数据
      const stats = await recommendationService.getRecommendationStats();

      // 🔧 修复：强制禁用缓存，确保获取最新数据
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

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
   * 🆕 触发推荐分数重新计算
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async triggerScoreRecalculation(req, res, next) {
    try {
      logger.info('🎯 管理员触发推荐分数重新计算开始', {
        adminId: req.admin?.id,
        adminUsername: req.admin?.username,
        timestamp: new Date().toISOString()
      });

      logger.info('📋 正在调用推荐服务执行重新计算...');
      const result = await recommendationService.triggerScoreRecalculation();
      
      logger.info('✅ 推荐分数重新计算完成', {
        result,
        adminId: req.admin?.id,
        adminUsername: req.admin?.username,
        timestamp: new Date().toISOString()
      });

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(result, '推荐分数重计算已完成')
      );
    } catch (error) {
      logger.error('❌ 触发推荐分数重计算失败', {
        error: error.message,
        stack: error.stack,
        adminId: req.admin?.id,
        adminUsername: req.admin?.username,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * 🔍 分析帖子推荐分数详情
   */
  async analyzePostScore(req, res, next) {
    try {
      const { postId } = req.body;
      
      if (!postId) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('参数错误：缺少帖子ID', 400)
        );
      }

      logger.info('🔍 管理员请求分析帖子分数', {
        adminId: req.admin?.id,
        adminUsername: req.admin?.username,
        postId: postId
      });
      
      const analysis = await recommendationService.analyzePostScore(postId);
      
      logger.info('✅ 帖子分数分析完成', {
        adminId: req.admin?.id,
        postId: postId,
        finalScore: analysis.analysis.result.finalScore,
        isRecommended: analysis.analysis.result.isRecommended
      });
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(analysis, '帖子分数分析完成')
      );
    } catch (error) {
      logger.error('❌ 分析帖子分数失败', {
        error: error.message,
        stack: error.stack,
        adminId: req.admin?.id,
        postId: req.body?.postId,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * 🚀 启动自动更新任务
   */
  async startAutoUpdate(req, res, next) {
    try {
      const { strategy = 'incremental', frequency = '1hour' } = req.body;
      
      logger.info('🚀 启动推荐内容自动更新任务', { 
        strategy, 
        frequency,
        adminId: req.admin?.id 
      });
      
      // 保存自动更新配置到Redis
      const config = {
        enabled: true,
        strategy,
        frequency,
        startTime: new Date().toISOString(),
        nextUpdateTime: this.calculateNextUpdateTime(frequency)
      };
      
      await redisClient.set('recommendation:auto_update:config', config, 86400); // 24小时过期
      
      // 🆕 同时更新运行状态
      const status = {
        running: true,
        lastRun: null,
        lastError: null,
        taskId: `auto_update_${Date.now()}`,
        startedAt: new Date().toISOString()
      };
      await redisClient.set('recommendation:auto_update:status', status, 86400); // 24小时过期
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(config, '自动更新任务已启动')
      );
      
    } catch (error) {
      logger.error('启动自动更新任务失败:', error);
      next(error);
    }
  }

  /**
   * 🛑 停止自动更新任务
   */
  async stopAutoUpdate(req, res, next) {
    try {
      logger.info('🛑 停止推荐内容自动更新任务', {
        adminId: req.admin?.id
      });
      
      // 从Redis删除配置和状态
      await redisClient.del('recommendation:auto_update:config');
      await redisClient.del('recommendation:auto_update:status');
      
      const result = {
        status: 'stopped',
        timestamp: new Date().toISOString()
      };
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(result, '自动更新任务已停止')
      );
      
    } catch (error) {
      logger.error('停止自动更新任务失败:', error);
      next(error);
    }
  }

  /**
   * 📊 获取自动更新状态
   */
  async getAutoUpdateStatus(req, res, next) {
    try {
      // 从Redis获取配置（Redis客户端自动处理反序列化）
      const config = await redisClient.get('recommendation:auto_update:config');
      
      // 从Redis获取运行状态（Redis客户端自动处理反序列化）
      const status = await redisClient.get('recommendation:auto_update:status') || {};
      
      const result = {
        enabled: config ? config.enabled : false,
        strategy: config ? config.strategy : 'incremental',
        frequency: config ? config.frequency : '1hour',
        nextUpdateTime: config ? config.nextUpdateTime : null,
        running: status.running || false,
        lastRun: status.lastRun || null,
        lastError: status.lastError || null,
        taskId: status.taskId || null
      };
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(result, '获取自动更新状态成功')
      );
      
    } catch (error) {
      logger.error('获取自动更新状态失败:', error);
      next(error);
    }
  }

  /**
   * 🕐 计算下次更新时间
   */
  calculateNextUpdateTime(frequency) {
    const now = new Date();
    const frequencyMap = {
      '10sec': 10 * 1000,        // 🆕 开发测试：10秒
      '30min': 30 * 60 * 1000,
      '1hour': 60 * 60 * 1000,
      '2hour': 2 * 60 * 60 * 1000,
      '6hour': 6 * 60 * 60 * 1000,
      '12hour': 12 * 60 * 60 * 1000,
      '24hour': 24 * 60 * 60 * 1000
    };
    
    const interval = frequencyMap[frequency] || frequencyMap['1hour'];
    return new Date(now.getTime() + interval).toISOString();
  }

  /**
   * 计算推荐算法统计信息（保留兼容性）
   * @returns {Promise<Object>} 统计信息
   */
  async calculateRecommendationStats() {
    try {
      // 获取推荐设置
      const settings = await recommendationService.getRecommendationSettings();

      const [totalPosts, adminRecommendedPosts] = await Promise.all([
        postService.countPosts({ status: 'published' }),
        postService.countPosts({ status: 'published', is_recommended: true })
      ]);

      // 使用真实的候选帖子筛选逻辑
      let algorithmCandidates = 0;
      try {
        const candidates = await postService.findCandidatesForRecommendation({
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

  /**
   * 🎯 获取预设配置列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getPresetConfigurations(req, res, next) {
    try {
      logger.info('管理员获取预设配置列表', {
        adminId: req.admin?.id,
        adminUsername: req.admin?.username
      });

      // 转换预设配置为前端友好格式
      const presets = Object.keys(RecommendationPresets).map(key => ({
        id: key,
        name: RecommendationPresets[key].name,
        description: RecommendationPresets[key].description,
        settings: RecommendationPresets[key].settings
      }));

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(presets, '获取预设配置成功')
      );
    } catch (error) {
      logger.error('获取预设配置失败:', error);
      next(error);
    }
  }

  /**
   * 🚀 应用预设配置
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象  
   * @param {Function} next 下一个中间件
   */
  async applyPresetConfiguration(req, res, next) {
    try {
      const { presetId } = req.body;

      logger.info('管理员应用预设配置', {
        adminId: req.admin?.id,
        adminUsername: req.admin?.username,
        presetId
      });

      // 验证预设ID
      if (!RecommendationPresets[presetId]) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('无效的预设配置ID')
        );
      }

      const preset = RecommendationPresets[presetId];
      
      // 批量更新设置
      await settingService.setMultipleSettings(preset.settings);

      // 清除推荐缓存
      await recommendationService.clearRecommendationCache();

      // 获取更新后的设置
      const updatedSettings = await recommendationService.getRecommendationSettings();

      logger.info('预设配置应用成功', {
        adminId: req.admin?.id,
        presetName: preset.name,
        settingsCount: Object.keys(preset.settings).length
      });

      res.status(StatusCodes.OK).json(
        ResponseUtil.success({
          applied: preset.name,
          settings: updatedSettings
        }, `${preset.name}配置应用成功`)
      );
    } catch (error) {
      logger.error('应用预设配置失败:', error);
      next(error);
    }
  }

  /**
   * 📤 导出当前配置
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async exportCurrentConfiguration(req, res, next) {
    try {
      logger.info('管理员导出当前配置', {
        adminId: req.admin?.id,
        adminUsername: req.admin?.username
      });

      // 获取当前设置
      const currentSettings = await recommendationService.getRecommendationSettings();
      
      // 构造导出格式
      const exportData = {
        name: "自定义配置",
        description: `导出时间: ${new Date().toLocaleString()}`,
        version: "v2.0",
        timestamp: new Date().toISOString(),
        settings: currentSettings
      };

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(exportData, '配置导出成功')
      );
    } catch (error) {
      logger.error('导出配置失败:', error);
      next(error);
    }
  }

  /**
   * 📥 导入自定义配置
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async importCustomConfiguration(req, res, next) {
    try {
      const { configData } = req.body;

      logger.info('管理员导入自定义配置', {
        adminId: req.admin?.id,
        adminUsername: req.admin?.username,
        configName: configData?.name
      });

      // 验证配置数据格式
      if (!configData || !configData.settings) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('无效的配置数据格式')
        );
      }

      // 验证配置字段
      const validationErrors = this.validateRecommendationSettings(configData.settings);
      if (validationErrors.length > 0) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('配置验证失败', validationErrors)
        );
      }

      // 批量更新设置
      await settingService.setMultipleSettings(configData.settings);

      // 清除推荐缓存
      await recommendationService.clearRecommendationCache();

      // 获取更新后的设置
      const updatedSettings = await recommendationService.getRecommendationSettings();

      logger.info('自定义配置导入成功', {
        adminId: req.admin?.id,
        configName: configData.name,
        settingsCount: Object.keys(configData.settings).length
      });

      res.status(StatusCodes.OK).json(
        ResponseUtil.success({
          imported: configData.name,
          settings: updatedSettings
        }, '自定义配置导入成功')
      );
    } catch (error) {
      logger.error('导入自定义配置失败:', error);
      next(error);
    }
  }
}

module.exports = new AdminRecommendationController();
