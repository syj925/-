const { StatusCodes } = require('http-status-codes');
const { ResponseUtil } = require('../../utils');
const settingService = require('../../services/setting.service');
const logger = require('../../../config/logger');

/**
 * 管理员系统设置控制器
 */
class AdminSettingsController {
  /**
   * 获取系统设置
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getSettings(req, res, next) {
    try {
      logger.info('Admin get settings request:', {
        adminId: req.user.id
      });

      const settingsObj = await settingService.getAllSettings();

      res.status(StatusCodes.OK).json(ResponseUtil.success(settingsObj, '获取系统设置成功'));
    } catch (error) {
      logger.error('Admin get settings error:', error);
      next(error);
    }
  }

  /**
   * 更新系统设置
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async updateSettings(req, res, next) {
    try {
      const settings = req.body;

      logger.info('Admin update settings request:', {
        adminId: req.user.id,
        settingsKeys: Object.keys(settings)
      });

      await settingService.updateSettings(settings);

      res.status(StatusCodes.OK).json(ResponseUtil.success(null, '系统设置更新成功'));
    } catch (error) {
      logger.error('Admin update settings error:', error);
      next(error);
    }
  }

  /**
   * 初始化推荐算法设置
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async initRecommendSettings(req, res, next) {
    try {
      logger.info('Admin init recommend settings request:', {
        adminId: req.user.id
      });

      const result = await settingService.initRecommendSettings();

      res.status(StatusCodes.OK).json(ResponseUtil.success(null, result.message));
    } catch (error) {
      logger.error('Admin init recommend settings error:', error);
      next(error);
    }
  }

  /**
   * 初始化搜索设置
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async initSearchSettings(req, res, next) {
    try {
      logger.info('Admin init search settings request:', {
        adminId: req.user.id
      });

      const result = await settingService.initSearchSettings();

      res.status(StatusCodes.OK).json(ResponseUtil.success(null, result.message));
    } catch (error) {
      logger.error('Admin init search settings error:', error);
      next(error);
    }
  }
}

module.exports = new AdminSettingsController();
