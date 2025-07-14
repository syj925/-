const dashboardService = require('../../services/admin/dashboard.service');
const { ResponseUtil } = require('../../utils');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../../config/logger');

/**
 * 管理员仪表盘控制器
 */
class AdminDashboardController {
  /**
   * 获取仪表盘基础数据
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getDashboardData(req, res, next) {
    try {
      logger.info('管理员获取仪表盘数据', {
        adminId: req.user.id,
        adminUsername: req.user.username
      });

      const data = await dashboardService.getDashboardData();
      
      res.status(StatusCodes.OK).json({
        success: true,
        message: '获取仪表盘数据成功',
        data
      });
    } catch (error) {
      logger.error('获取仪表盘数据失败', {
        error: error.message,
        stack: error.stack,
        adminId: req.user?.id
      });
      next(error);
    }
  }

  /**
   * 获取趋势数据
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getTrendData(req, res, next) {
    try {
      const { period = 'week' } = req.query;
      
      // 验证period参数
      const validPeriods = ['day', 'week', 'month'];
      if (!validPeriods.includes(period)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '无效的时间周期参数，支持: day, week, month'
        });
      }

      logger.info('管理员获取趋势数据', {
        adminId: req.user.id,
        period
      });

      const data = await dashboardService.getTrendData(period);
      
      res.status(StatusCodes.OK).json({
        success: true,
        message: '获取趋势数据成功',
        data
      });
    } catch (error) {
      logger.error('获取趋势数据失败', {
        error: error.message,
        stack: error.stack,
        adminId: req.user?.id,
        period: req.query.period
      });
      next(error);
    }
  }

  /**
   * 获取用户分布数据
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUserDistribution(req, res, next) {
    try {
      logger.info('管理员获取用户分布数据', {
        adminId: req.user.id
      });

      const data = await dashboardService.getUserDistribution();
      
      res.status(StatusCodes.OK).json({
        success: true,
        message: '获取用户分布数据成功',
        data
      });
    } catch (error) {
      logger.error('获取用户分布数据失败', {
        error: error.message,
        stack: error.stack,
        adminId: req.user?.id
      });
      next(error);
    }
  }

  /**
   * 刷新仪表盘缓存
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async refreshCache(req, res, next) {
    try {
      logger.info('管理员刷新仪表盘缓存', {
        adminId: req.user.id
      });

      await dashboardService.clearCache();
      
      res.status(StatusCodes.OK).json({
        success: true,
        message: '缓存刷新成功'
      });
    } catch (error) {
      logger.error('刷新仪表盘缓存失败', {
        error: error.message,
        stack: error.stack,
        adminId: req.user?.id
      });
      next(error);
    }
  }

  /**
   * 获取系统状态信息
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getSystemStatus(req, res, next) {
    try {
      logger.info('管理员获取系统状态', {
        adminId: req.user.id
      });

      const status = await dashboardService.getSystemStatus();
      
      res.status(StatusCodes.OK).json({
        success: true,
        message: '获取系统状态成功',
        data: status
      });
    } catch (error) {
      logger.error('获取系统状态失败', {
        error: error.message,
        stack: error.stack,
        adminId: req.user?.id
      });
      next(error);
    }
  }
}

module.exports = new AdminDashboardController();
