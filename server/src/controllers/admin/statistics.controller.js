const statisticsService = require('../../services/admin/statistics.service');
const { ResponseUtil } = require('../../utils');
const { StatusCodes } = require('http-status-codes');

class StatisticsController {
  /**
   * 获取所有统计数据
   */
  async getAllStats(req, res, next) {
    try {
      const { days } = req.query;
      
      const [growth, contentDist, activity] = await Promise.all([
        statisticsService.getGrowthStats(days ? parseInt(days) : 7),
        statisticsService.getContentDistribution(),
        statisticsService.getActivityStats()
      ]);

      res.status(StatusCodes.OK).json(ResponseUtil.success({
        growth,
        contentDist,
        activity
      }));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StatisticsController();
