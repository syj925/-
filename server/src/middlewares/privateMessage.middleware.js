const { Setting } = require('../models');
const { StatusCodes } = require('http-status-codes');
const { ResponseUtil } = require('../utils');
const logger = require('../../config/logger');

/**
 * 私信功能中间件
 */
class PrivateMessageMiddleware {
  /**
   * 检查系统级私信功能是否开启
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  static async checkGlobalPrivateMessageEnabled(req, res, next) {
    try {
      // 获取系统设置
      const enablePrivateMessageSetting = await Setting.findOne({
        where: { key: 'enablePrivateMessage' }
      });

      // 检查是否启用私信功能
      const isEnabled = enablePrivateMessageSetting 
        ? enablePrivateMessageSetting.value === 'true' 
        : true; // 默认启用

      if (!isEnabled) {
        logger.warn('Private message blocked - global feature disabled:', {
          userId: req.user?.id,
          path: req.path,
          method: req.method
        });

        return res.status(StatusCodes.FORBIDDEN).json(
          ResponseUtil.error('系统已禁用私信功能', StatusCodes.FORBIDDEN, 'PRIVATE_MESSAGE_DISABLED')
        );
      }

      next();
    } catch (error) {
      logger.error('Check global private message setting error:', error);
      next(error);
    }
  }

  /**
   * 检查用户私信权限
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  static async checkUserPrivateMessagePermission(req, res, next) {
    try {
      const { User } = require('../models');
      const userId = req.user.id;
      const targetUserId = req.params.userId || req.body.receiverId;

      // 获取当前用户信息
      const currentUser = await User.findByPk(userId);
      if (!currentUser) {
        return res.status(StatusCodes.NOT_FOUND).json(
          ResponseUtil.error('用户不存在', StatusCodes.NOT_FOUND)
        );
      }

      // 检查当前用户的私信权限
      const currentUserAllowMessage = currentUser.settings?.privacy?.allowMessage;
      if (currentUserAllowMessage === false) {
        logger.warn('Private message blocked - sender permission denied:', {
          userId,
          targetUserId,
          path: req.path
        });

        return res.status(StatusCodes.FORBIDDEN).json(
          ResponseUtil.error('您已禁用私信功能', StatusCodes.FORBIDDEN, 'USER_MESSAGE_DISABLED')
        );
      }

      // 如果有目标用户，检查目标用户的私信权限
      if (targetUserId) {
        const targetUser = await User.findByPk(targetUserId);
        if (!targetUser) {
          return res.status(StatusCodes.NOT_FOUND).json(
            ResponseUtil.error('目标用户不存在', StatusCodes.NOT_FOUND)
          );
        }

        const targetUserAllowMessage = targetUser.settings?.privacy?.allowMessage;
        if (targetUserAllowMessage === false) {
          logger.warn('Private message blocked - receiver permission denied:', {
            userId,
            targetUserId,
            path: req.path
          });

          return res.status(StatusCodes.FORBIDDEN).json(
            ResponseUtil.error('对方已禁用私信功能', StatusCodes.FORBIDDEN, 'TARGET_MESSAGE_DISABLED')
          );
        }
      }

      next();
    } catch (error) {
      logger.error('Check user private message permission error:', error);
      next(error);
    }
  }

  /**
   * 组合检查：系统级和用户级私信权限
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  static async checkAllPrivateMessagePermissions(req, res, next) {
    // 先检查系统级设置
    await PrivateMessageMiddleware.checkGlobalPrivateMessageEnabled(req, res, (error) => {
      if (error) return next(error);
      if (res.headersSent) return; // 如果已经响应，直接返回

      // 再检查用户级设置
      PrivateMessageMiddleware.checkUserPrivateMessagePermission(req, res, next);
    });
  }
}

module.exports = PrivateMessageMiddleware;



