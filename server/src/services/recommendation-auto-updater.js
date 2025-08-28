const logger = require('../../config/logger');
const redisClient = require('../utils/redis-client');

/**
 * 推荐算法自动更新服务
 * 负责定期检查配置并执行自动更新任务
 */
class RecommendationAutoUpdater {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.checkInterval = 60 * 1000; // 每分钟检查一次
  }

  /**
   * 启动自动更新检查服务
   */
  start() {
    if (this.isRunning) {
      logger.info('🔄 推荐自动更新服务已在运行');
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(async () => {
      await this.checkAndExecuteUpdate();
    }, this.checkInterval);

    logger.info('🚀 推荐自动更新检查服务已启动', {
      checkInterval: `${this.checkInterval / 1000}秒`
    });
  }

  /**
   * 停止自动更新检查服务
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('🛑 推荐自动更新检查服务已停止');
  }

  /**
   * 检查并执行自动更新
   */
  async checkAndExecuteUpdate() {
    try {
      // 获取自动更新配置
      const config = await redisClient.get('recommendation:auto_update:config');
      if (!config || !config.enabled) {
        // logger.debug('⏸️ 自动更新未启用，跳过检查');
        return; // 未启用自动更新
      }

      // 检查是否到了更新时间
      const now = new Date();
      const nextUpdateTime = new Date(config.nextUpdateTime);
      
      // 🆕 开发调试：显示详细时间信息
      if (config.frequency === '10sec') {
        logger.info('🧪 开发测试模式 - 时间检查', {
          frequency: config.frequency,
          currentTime: now.toLocaleString('zh-CN'),
          nextUpdateTime: nextUpdateTime.toLocaleString('zh-CN'),
          timeRemaining: Math.round((nextUpdateTime - now) / 1000) + '秒',
          shouldUpdate: now >= nextUpdateTime
        });
      }
      
      if (now < nextUpdateTime) {
        return; // 还没到更新时间
      }

      logger.info('⏰ 到达自动更新时间，开始执行推荐分数更新', {
        strategy: config.strategy,
        frequency: config.frequency,
        nextUpdateTime: config.nextUpdateTime
      });

      // 执行推荐分数更新
      await this.executeUpdate(config);

      // 更新下次执行时间
      await this.updateNextExecutionTime(config);

    } catch (error) {
      logger.error('❌ 自动更新检查失败:', error);
      
      // 更新错误状态
      try {
        const status = await redisClient.get('recommendation:auto_update:status') || {};
        status.lastError = error.message;
        status.lastErrorTime = new Date().toISOString();
        await redisClient.set('recommendation:auto_update:status', status, 86400);
      } catch (statusError) {
        logger.error('更新错误状态失败:', statusError);
      }
    }
  }

  /**
   * 执行推荐分数更新
   */
  async executeUpdate(config) {
    try {
      const recommendationService = require('./recommendation.service.v2');
      const calculator = require('./recommendation-score-calculator');

      let result;
      
      if (config.strategy === 'full') {
        // 全量更新：强制重新计算所有帖子
        logger.info('🔄 执行全量更新...');
        result = await calculator.calculateAndUpdateScores({ forceUpdate: true });
      } else if (config.strategy === 'smart') {
        // 智能更新：根据系统负载选择策略
        logger.info('🧠 执行智能更新...');
        result = await calculator.calculateAndUpdateScores({ forceUpdate: false });
      } else {
        // 增量更新：只更新最近变动的内容
        logger.info('📈 执行增量更新...');
        result = await calculator.calculateAndUpdateScores({ forceUpdate: false });
      }

      // 更新执行状态
      const status = await redisClient.get('recommendation:auto_update:status') || {};
      status.lastRun = new Date().toISOString();
      status.lastResult = result;
      status.lastError = null;
      status.lastErrorTime = null;
      await redisClient.set('recommendation:auto_update:status', status, 86400);

      logger.info('✅ 自动更新执行完成', {
        strategy: config.strategy,
        result
      });

    } catch (error) {
      logger.error('❌ 执行自动更新失败:', error);
      throw error;
    }
  }

  /**
   * 更新下次执行时间
   */
  async updateNextExecutionTime(config) {
    try {
      const nextUpdateTime = this.calculateNextUpdateTime(config.frequency);
      config.nextUpdateTime = nextUpdateTime;
      
      await redisClient.set('recommendation:auto_update:config', config, 86400);
      
      logger.info('🔄 下次自动更新时间已更新', {
        nextUpdateTime
      });
    } catch (error) {
      logger.error('更新下次执行时间失败:', error);
    }
  }

  /**
   * 计算下次更新时间
   */
  calculateNextUpdateTime(frequency) {
    const now = new Date();
    
    switch (frequency) {
      case '10sec':
        return new Date(now.getTime() + 10 * 1000).toISOString();         // 🆕 开发测试：10秒
      case '30min':
        return new Date(now.getTime() + 30 * 60 * 1000).toISOString();
      case '1hour':
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      case '2hour':
        return new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
      case '6hour':
        return new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();
      case '12hour':
        return new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();
      case '24hour':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 默认1小时
    }
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval
    };
  }
}

// 创建单例实例
const autoUpdater = new RecommendationAutoUpdater();

module.exports = autoUpdater;
