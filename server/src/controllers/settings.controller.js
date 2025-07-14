const { StatusCodes } = require('http-status-codes');
const ResponseUtil = require('../utils/response');
const { User } = require('../models');

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
      
      // 查询用户记录
      const user = await User.findByPk(userId, {
        attributes: ['id', 'settings']
      });
      
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
      
      // 查询用户记录
      const user = await User.findByPk(userId);
      
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
      
      // 更新用户设置
      await user.update({ settings: currentSettings });
      
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

      // 调试日志
      console.log('更新隐私设置 - 用户ID:', userId);
      console.log('更新隐私设置 - 接收到的数据:', privacySettings);

      // 查询用户记录
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json(
          ResponseUtil.error('用户不存在', StatusCodes.NOT_FOUND)
        );
      }

      console.log('更新隐私设置 - 当前用户settings:', user.settings);

      // 获取当前设置或初始化
      let currentSettings = user.settings || { privacy: {} };

      // 更新隐私设置
      currentSettings.privacy = {
        ...currentSettings.privacy,
        ...privacySettings
      };

      console.log('更新隐私设置 - 合并后的settings:', currentSettings);

      // 保存到数据库 - 强制标记字段为已修改
      user.settings = currentSettings;
      user.changed('settings', true);
      await user.save();

      // 验证保存结果
      const updatedUser = await User.findByPk(userId, {
        attributes: ['id', 'settings']
      });
      console.log('更新隐私设置 - 保存后的settings:', updatedUser.settings);

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(currentSettings.privacy, '隐私设置更新成功')
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

      // 查询用户记录
      const user = await User.findByPk(userId, {
        attributes: ['id', 'settings']
      });

      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json(
          ResponseUtil.error('用户不存在', StatusCodes.NOT_FOUND)
        );
      }

      // 调试日志
      console.log('获取隐私设置 - 用户ID:', userId);
      console.log('获取隐私设置 - 原始settings:', user.settings);

      // 获取隐私设置
      const privacySettings = user.settings?.privacy || {
        anonymousMode: false,
        allowSearch: true,
        showLocation: false,
        allowFollow: true,
        allowComment: true,
        allowMessage: true,
        favoriteVisible: false,
        followListVisible: true,
        fansListVisible: true
      };

      console.log('获取隐私设置 - 返回的隐私设置:', privacySettings);

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(privacySettings, '获取隐私设置成功')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SettingsController();
