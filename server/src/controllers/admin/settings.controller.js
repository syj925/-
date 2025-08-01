const { StatusCodes } = require('http-status-codes');
const { ResponseUtil } = require('../../utils');
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

      // 引入Setting模型
      const { Setting } = require('../../models');

      // 获取所有系统设置
      const settings = await Setting.findAll({
        attributes: ['key', 'value', 'type']
      });

      // 转换为键值对格式
      const settingsObj = {};
      settings.forEach(setting => {
        let value = setting.value;
        
        // 根据类型转换值
        switch (setting.type) {
          case 'boolean':
            value = value === 'true';
            break;
          case 'number':
            value = parseFloat(value) || 0;
            break;
          case 'json':
            try {
              value = JSON.parse(value);
            } catch (e) {
              value = [];
            }
            break;
          default:
            // string类型保持原样
            break;
        }
        
        settingsObj[setting.key] = value;
      });

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

      // 引入Setting和Topic模型
      const { Setting, Topic } = require('../../models');

      // 检查是否更新了推荐话题设置
      let featuredTopicIdsChanged = false;
      let newFeaturedTopicIds = [];

      // 批量更新系统设置
      for (const key in settings) {
        if (Object.hasOwnProperty.call(settings, key)) {
          const value = settings[key];

          // 处理不同类型的设置值
          let settingValue;
          let settingType;

          if (Array.isArray(value)) {
            settingValue = JSON.stringify(value);
            settingType = 'json';
          } else if (typeof value === 'boolean') {
            settingValue = String(value);
            settingType = 'boolean';
          } else if (typeof value === 'number') {
            settingValue = String(value);
            settingType = 'number';
          } else {
            settingValue = String(value);
            settingType = 'string';
          }

          // 检查是否是推荐话题设置
          if (key === 'featuredTopicIds') {
            featuredTopicIdsChanged = true;
            // 解析推荐话题ID
            if (settingValue && settingValue.trim()) {
              newFeaturedTopicIds = settingValue
                .split(',')
                .map(id => parseInt(id.trim()))
                .filter(id => !isNaN(id));
            }
          }

          // 查找设置是否存在，不存在则创建
          const [setting, created] = await Setting.findOrCreate({
            where: { key },
            defaults: {
              key,
              value: settingValue,
              description: `${key}设置`,
              type: settingType
            }
          });

          if (!created) {
            // 更新现有设置
            await setting.update({
              value: settingValue,
              type: settingType
            });
          }
        }
      }

      // 如果推荐话题设置发生变化，同步更新话题的热门状态
      if (featuredTopicIdsChanged) {
        logger.info('推荐话题设置已更改，同步更新话题热门状态:', {
          newFeaturedTopicIds
        });

        // 获取当前所有热门话题的ID
        const currentHotTopics = await Topic.findAll({
          where: { is_hot: true },
          attributes: ['id'],
          raw: true
        });
        const currentHotTopicIds = currentHotTopics.map(topic => topic.id);

        // 计算需要移除热门状态的话题（当前是热门但不在新列表中）
        const topicsToRemoveHot = currentHotTopicIds.filter(id => !newFeaturedTopicIds.includes(id));

        // 计算需要添加热门状态的话题（在新列表中但当前不是热门）
        const topicsToAddHot = newFeaturedTopicIds.filter(id => !currentHotTopicIds.includes(id));

        let updateCount = 0;

        // 移除不再是推荐的话题的热门状态
        if (topicsToRemoveHot.length > 0) {
          const removeResult = await Topic.update(
            { is_hot: false },
            {
              where: {
                id: topicsToRemoveHot
              }
            }
          );
          updateCount += removeResult[0];
          logger.info('移除热门状态的话题:', {
            topicIds: topicsToRemoveHot,
            affectedRows: removeResult[0]
          });
        }

        // 为新推荐的话题添加热门状态
        if (topicsToAddHot.length > 0) {
          const addResult = await Topic.update(
            { is_hot: true },
            {
              where: {
                id: topicsToAddHot,
                status: 'active'
              }
            }
          );
          updateCount += addResult[0];
          logger.info('添加热门状态的话题:', {
            topicIds: topicsToAddHot,
            affectedRows: addResult[0]
          });
        }

        logger.info('话题热门状态同步完成:', {
          featuredTopicIds: newFeaturedTopicIds,
          totalUpdatedRows: updateCount,
          removedHotTopics: topicsToRemoveHot.length,
          addedHotTopics: topicsToAddHot.length
        });
      }

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

      // 引入Setting模型
      const { Setting } = require('../../models');

      // 检查是否已存在推荐设置
      const existingSettings = await Setting.findOne({
        where: { key: 'likeWeight' }
      });

      if (existingSettings) {
        return res.status(StatusCodes.OK).json(
          ResponseUtil.success(null, '推荐设置已存在，无需初始化')
        );
      }

      // 创建默认推荐设置
      const defaultSettings = [
        { key: 'likeWeight', value: '2.0', description: '点赞权重', type: 'number' },
        { key: 'commentWeight', value: '3.0', description: '评论权重', type: 'number' },
        { key: 'collectionWeight', value: '4.0', description: '收藏权重', type: 'number' },
        { key: 'viewWeight', value: '0.5', description: '浏览权重', type: 'number' },
        { key: 'timeDecayDays', value: '10', description: '时间衰减天数', type: 'number' },
        { key: 'maxAgeDays', value: '30', description: '最大天数', type: 'number' },
        { key: 'maxAdminRecommended', value: '5', description: '管理员推荐最大数量', type: 'number' }
      ];

      // 批量创建设置
      await Setting.bulkCreate(
        defaultSettings.map(setting => ({
          ...setting,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      );

      res.status(StatusCodes.OK).json(ResponseUtil.success(null, '推荐设置初始化成功'));
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

      // 引入Setting模型
      const { Setting } = require('../../models');

      // 检查是否已存在搜索设置
      const existingSettings = await Setting.findOne({
        where: { key: 'hotSearchKeywords' }
      });

      if (existingSettings) {
        return res.status(StatusCodes.OK).json(
          ResponseUtil.success(null, '搜索设置已存在，无需初始化')
        );
      }

      // 创建默认搜索设置
      const defaultSettings = [
        { key: 'hotSearchKeywords', value: '', description: '热搜关键词', type: 'string' },
        { key: 'topicBaseWeight', value: '0.5', description: '话题基础权重', type: 'number' },
        { key: 'topicRecentWeight', value: '0.5', description: '话题最近权重', type: 'number' },
        { key: 'topicRecentDays', value: '7', description: '话题最近天数', type: 'number' },
        { key: 'maxHotTopics', value: '10', description: '热门话题最大数量', type: 'number' }
      ];

      // 批量创建设置
      await Setting.bulkCreate(
        defaultSettings.map(setting => ({
          ...setting,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      );

      res.status(StatusCodes.OK).json(ResponseUtil.success(null, '搜索设置初始化成功'));
    } catch (error) {
      logger.error('Admin init search settings error:', error);
      next(error);
    }
  }
}

module.exports = new AdminSettingsController();
