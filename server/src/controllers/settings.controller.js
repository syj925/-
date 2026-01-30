const { StatusCodes } = require('http-status-codes');
const ResponseUtil = require('../utils/response');
const userService = require('../services/user.service');

/**
 * 设置控制器
 */
class SettingsController {
  /**
   * 获取用户设置
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUserSettings(req, res, next) {
    try {
      const userId = req.user.id;
      
      // 通过 userService 查询用户
      const user = await userService.getUserSettings(userId);
      
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json(
          ResponseUtil.error('用户不存在', StatusCodes.NOT_FOUND)
        );
      }
      
      // 获取用户设置，如果没有则返回默认设置
      const settings = user.settings || {
        privacy: {
          anonymousMode: false,
          allowSearch: true,
          showLocation: false,
          allowFollow: true,
          allowComment: true,
          allowMessage: true,
          favoriteVisible: false,
          followListVisible: true,
          fansListVisible: true
        }
      };
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(settings, '获取设置成功')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新用户设置
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async updateUserSettings(req, res, next) {
    try {
      const userId = req.user.id;
      const { privacy } = req.body;
      
      // 通过 userService 查询用户
      const user = await userService.getUserSettings(userId);
      
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json(
          ResponseUtil.error('用户不存在', StatusCodes.NOT_FOUND)
        );
      }
      
      // 获取当前设置或初始化
      let currentSettings = user.settings || {
        privacy: {
          anonymousMode: false,
          allowSearch: true,
          showLocation: false,
          allowFollow: true,
          allowComment: true,
          allowMessage: true,
          favoriteVisible: false,
          followListVisible: true,
          fansListVisible: true
        }
      };
      
      // 合并隐私设置
      if (privacy) {
        currentSettings.privacy = {
          ...currentSettings.privacy,
          ...privacy
        };
      }
      
      // 通过 userService 更新用户设置
      await userService.updateUserSettings(userId, currentSettings);
      
      res.status(StatusCodes.OK).json(
        ResponseUtil.success(currentSettings, '设置更新成功')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新隐私设置
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async updatePrivacySettings(req, res, next) {
    try {
      const userId = req.user.id;
      const privacySettings = req.body;

      // 通过 userService 更新隐私设置
      const updatedPrivacy = await userService.updatePrivacySettings(userId, privacySettings);

      if (!updatedPrivacy) {
        return res.status(StatusCodes.NOT_FOUND).json(
          ResponseUtil.error('用户不存在', StatusCodes.NOT_FOUND)
        );
      }

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(updatedPrivacy, '隐私设置更新成功')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取隐私设置
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getPrivacySettings(req, res, next) {
    try {
      const userId = req.user.id;

      // 通过 userService 获取隐私设置
      const privacySettings = await userService.getPrivacySettings(userId);

      if (!privacySettings) {
        return res.status(StatusCodes.NOT_FOUND).json(
          ResponseUtil.error('用户不存在', StatusCodes.NOT_FOUND)
        );
      }

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(privacySettings, '获取隐私设置成功')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SettingsController();
