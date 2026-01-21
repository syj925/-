const onlineStatsService = require('../../services/online-stats.service');
const { StatusCodes } = require('http-status-codes');
const { ResponseUtil } = require('../../utils');

/**
 * 管理员在线统计控制器
 * 处理管理员相关的在线统计HTTP请求
 */
class OnlineStatsController {
  /**
   * 获取当前在线人数
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getOnlineCount(req, res, next) {
    try {
      const count = await onlineStatsService.getCurrentOnlineCount();
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success({ onlineCount: count }, '获取在线人数成功')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取详细的在线统计信息
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getDetailedStats(req, res, next) {
    try {
      const stats = await onlineStatsService.getDetailedStats();
      
      // 记录统计日志（异步执行，不阻塞响应）
      onlineStatsService.logStats(stats).catch(err => {
        console.warn('记录统计日志失败:', err.message);
      });
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(stats, '获取详细统计信息成功')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取在线统计概览（用于仪表盘）
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getDashboardStats(req, res, next) {
    try {
      const detailedStats = await onlineStatsService.getDetailedStats();
      
      // 为仪表盘优化的数据格式
      const dashboardData = {
        onlineCount: detailedStats.totalOnline,
        timestamp: detailedStats.timestamp,
        serverUptime: detailedStats.serverInfo.uptime,
        isPeakTime: detailedStats.businessMetrics.peakTime,
        onlineRate: detailedStats.businessMetrics.onlineRate,
        serverLoad: {
          memory: detailedStats.businessMetrics.serverLoad.memoryUsage.percentage,
          uptime: detailedStats.businessMetrics.serverLoad.uptime
        }
      };
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(dashboardData, '获取仪表盘统计数据成功')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OnlineStatsController();
