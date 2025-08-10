const { Banner, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * 轮播图数据访问层
 */
class BannerRepository {
  /**
   * 根据ID查找轮播图
   * @param {String} id 轮播图ID
   * @returns {Promise<Object>} 轮播图对象
   */
  async findById(id) {
    return await Banner.findByPk(id);
  }

  /**
   * 根据场景获取轮播图
   * @param {Object} params 查询参数
   * @returns {Promise<Array>} 轮播图列表
   */
  async findByScene(params) {
    const { scene, platform = 'all', status = 'active', limit = 5, includeExpired = false } = params;
    
    const whereConditions = {
      scene,
      status
    };
    
    // 平台筛选
    if (platform !== 'all') {
      whereConditions.platform = {
        [Op.or]: [platform, 'all']
      };
    }
    
    // 时间范围筛选
    if (!includeExpired) {
      const now = new Date();
      whereConditions[Op.and] = [
        {
          [Op.or]: [
            { startTime: { [Op.lte]: now } },
            { startTime: null }
          ]
        },
        {
          [Op.or]: [
            { endTime: { [Op.gte]: now } },
            { endTime: null }
          ]
        }
      ];
    }
    
    return await Banner.findAll({
      where: whereConditions,
      order: [
        ['priority', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit)
    });
  }

  /**
   * 获取所有轮播图（分页）
   * @param {Object} params 查询参数
   * @returns {Promise<Object>} 分页结果
   */
  async findAll(params) {
    const { 
      page = 1, 
      limit = 10, 
      scene, 
      platform, 
      status,
      keyword 
    } = params;
    
    const whereConditions = {};
    
    if (scene) whereConditions.scene = scene;
    if (platform && platform !== 'all') whereConditions.platform = platform;
    if (status) whereConditions.status = status;
    
    if (keyword) {
      whereConditions.title = {
        [Op.like]: `%${keyword}%`
      };
    }
    
    const offset = (page - 1) * limit;
    
    return await Banner.findAndCountAll({
      where: whereConditions,
      order: [
        ['priority', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  }

  /**
   * 创建轮播图
   * @param {Object} bannerData 轮播图数据
   * @returns {Promise<Object>} 创建的轮播图
   */
  async create(bannerData) {
    return await Banner.create(bannerData);
  }

  /**
   * 更新轮播图
   * @param {String} id 轮播图ID
   * @param {Object} bannerData 更新数据
   * @returns {Promise<Object>} 更新后的轮播图
   */
  async update(id, bannerData) {
    const [affectedRows] = await Banner.update(bannerData, {
      where: { id }
    });
    
    if (affectedRows === 0) {
      throw new Error('轮播图不存在或更新失败');
    }
    
    return await Banner.findByPk(id);
  }

  /**
   * 删除轮播图（软删除）
   * @param {String} id 轮播图ID
   * @returns {Promise<Boolean>} 删除结果
   */
  async delete(id) {
    const affectedRows = await Banner.destroy({
      where: { id }
    });
    
    if (affectedRows === 0) {
      throw new Error('轮播图不存在或删除失败');
    }
    
    return true;
  }

  /**
   * 增加点击次数
   * @param {String} bannerId 轮播图ID
   * @returns {Promise<Boolean>} 操作结果
   */
  async incrementClick(bannerId) {
    const [affectedRows] = await Banner.increment('clickCount', {
      where: { id: bannerId }
    });
    
    return affectedRows > 0;
  }

  /**
   * 批量增加展示次数
   * @param {Array} bannerIds 轮播图ID数组
   * @returns {Promise<Boolean>} 操作结果
   */
  async incrementViews(bannerIds) {
    const [affectedRows] = await Banner.increment('viewCount', {
      where: {
        id: {
          [Op.in]: bannerIds
        }
      }
    });
    
    return affectedRows > 0;
  }

  /**
   * 批量更新排序
   * @param {Array} sortData 排序数据
   * @returns {Promise<Boolean>} 操作结果
   */
  async updateSortOrder(sortData) {
    const transaction = await sequelize.transaction();
    
    try {
      for (const item of sortData) {
        await Banner.update(
          { sortOrder: item.sortOrder },
          { where: { id: item.id }, transaction }
        );
      }
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 获取轮播图统计数据
   * @param {String} bannerId 轮播图ID
   * @param {Object} dateRange 日期范围
   * @returns {Promise<Object>} 统计数据
   */
  async getStatistics(bannerId, dateRange = {}) {
    const banner = await Banner.findByPk(bannerId, {
      attributes: ['id', 'title', 'clickCount', 'viewCount', 'createdAt']
    });
    
    if (!banner) {
      throw new Error('轮播图不存在');
    }
    
    // 这里可以扩展更复杂的统计逻辑
    // 比如按日期范围统计点击量等
    
    return {
      id: banner.id,
      title: banner.title,
      totalClicks: banner.clickCount,
      totalViews: banner.viewCount,
      clickRate: banner.viewCount > 0 ? (banner.clickCount / banner.viewCount * 100).toFixed(2) : 0,
      createdAt: banner.createdAt
    };
  }

  /**
   * 检查轮播图是否存在
   * @param {String} id 轮播图ID
   * @returns {Promise<Boolean>} 是否存在
   */
  async exists(id) {
    const count = await Banner.count({
      where: { id }
    });
    return count > 0;
  }

  /**
   * 获取场景下的轮播图数量
   * @param {String} scene 场景
   * @returns {Promise<Number>} 数量
   */
  async countByScene(scene) {
    return await Banner.count({
      where: { scene, status: 'active' }
    });
  }
}

module.exports = new BannerRepository();
