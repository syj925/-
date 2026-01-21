const { WebSocketService } = require('../utils');
const logger = require('../../config/logger');

/**
 * 在线统计服务层
 * 负责处理在线用户统计相关的业务逻辑
 */
class OnlineStatsService {
  /**
   * 获取当前在线用户数量
   * @returns {Promise<Number>} 在线用户数量
   */
  async getCurrentOnlineCount() {
    try {
      return WebSocketService.getOnlineCount();
    } catch (error) {
      logger.error('获取在线用户数量失败:', error);
      throw error;
    }
  }

  /**
   * 获取详细的在线统计信息
   * @returns {Promise<Object>} 详细统计信息
   */
  async getDetailedStats() {
    try {
      const stats = WebSocketService.getOnlineStats();
      
      // 可以在这里添加更多业务逻辑，比如：
      // - 统计不同用户角色的在线数量
      // - 计算在线率等业务指标
      // - 记录统计日志等
      
      return {
        ...stats,
        // 添加业务相关的统计信息
        businessMetrics: {
          onlineRate: this._calculateOnlineRate(stats.totalOnline),
          peakTime: this._isPeakTime(),
          serverLoad: this._getServerLoad()
        }
      };
    } catch (error) {
      logger.error('获取详细在线统计失败:', error);
      throw error;
    }
  }

  /**
   * 计算在线率（示例业务逻辑）
   * @param {Number} currentOnline 当前在线数
   * @returns {Number} 在线率百分比
   * @private
   */
  _calculateOnlineRate(currentOnline) {
    // 这里可以基于历史数据计算在线率
    // 示例：假设平均在线数为100
    const averageOnline = 100;
    return Math.round((currentOnline / averageOnline) * 100);
  }

  /**
   * 判断是否为高峰时段
   * @returns {Boolean} 是否为高峰时段
   * @private
   */
  _isPeakTime() {
    const hour = new Date().getHours();
    // 定义高峰时段：上午9-11点，下午2-5点，晚上7-10点
    return (hour >= 9 && hour <= 11) || 
           (hour >= 14 && hour <= 17) || 
           (hour >= 19 && hour <= 22);
  }

  /**
   * 获取服务器负载信息
   * @returns {Object} 服务器负载信息
   * @private
   */
  _getServerLoad() {
    const memUsage = process.memoryUsage();
    return {
      memoryUsage: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      uptime: Math.floor(process.uptime()),
      cpuUsage: process.cpuUsage()
    };
  }

  /**
   * 记录在线统计日志（用于后续分析）
   * @param {Object} stats 统计信息
   * @returns {Promise<void>}
   */
  async logStats(stats) {
    try {
      logger.info('在线统计记录:', {
        timestamp: new Date().toISOString(),
        onlineCount: stats.totalOnline,
        serverInfo: stats.serverInfo
      });
      
      // 这里可以扩展：
      // - 将统计数据写入数据库
      // - 发送到监控系统
      // - 触发告警等
    } catch (error) {
      logger.error('记录统计日志失败:', error);
    }
  }
}

module.exports = new OnlineStatsService();
