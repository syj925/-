const bannerRepository = require('../repositories/banner.repository');
const { redisClient } = require('../utils');
const errorCodes = require('../constants/error-codes');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../config/logger');
const { ErrorMiddleware } = require('../middlewares');

/**
 * 轮播图服务层
 */
class BannerService {
  /**
   * 根据场景获取轮播图
   * @param {Object} params 查询参数
   * @returns {Promise<Array>} 轮播图列表
   */
  async getBannersByScene(params) {
    const { scene, platform = 'app', status = 'active', limit = 10 } = params;
    const cacheKey = `banners:${scene}:${platform}:${status}:${limit}`;
    
    try {
      // 尝试从缓存获取
      if (redisClient) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          try {
            // Redis客户端已经自动反序列化了数据，直接使用
            if (Array.isArray(cached) && cached.length >= 0) {
              logger.debug(`从缓存获取轮播图数据: ${cacheKey}`, { count: cached.length });
              return cached;
            } else if (typeof cached === 'string') {
              // 如果是字符串，尝试解析（兼容旧格式）
              return JSON.parse(cached);
            } else {
              // 其他类型的数据，清除缓存
              logger.warn(`缓存数据类型异常，清除缓存: ${cacheKey}`, { type: typeof cached, data: cached });
              await redisClient.del(cacheKey);
            }
          } catch (parseError) {
            logger.warn(`缓存数据处理失败，清除缓存: ${cacheKey}`, parseError);
            await redisClient.del(cacheKey);
          }
        }
      }
      
      // 从数据库获取
      const banners = await bannerRepository.findByScene({
        scene,
        platform,
        status,
        limit,
        includeExpired: false
      });
      
      // 处理图片URL
      const processedBanners = banners.map(banner => ({
        ...banner.toJSON(),
        image: this.processImageUrl(banner.image)
      }));

      // 添加详细的调试日志
      logger.info(`[BannerService] 处理后的轮播图数据 - scene: ${scene}`, {
        count: processedBanners.length,
        banners: processedBanners.map(b => ({
          id: b.id,
          title: b.title,
          image: b.image,
          scene: b.scene
        }))
      });

      // 缓存结果（5分钟）
      // 注意：不要手动JSON.stringify，Redis客户端会自动处理序列化
      if (redisClient) {
        await redisClient.setex(cacheKey, 300, processedBanners);
      }

      return processedBanners;
    } catch (error) {
      logger.error('获取轮播图失败:', error);
      throw error;
    }
  }

  /**
   * 获取轮播图列表（管理后台用）
   * @param {Object} params 查询参数
   * @returns {Promise<Object>} 分页结果
   */
  async getBannerList(params) {
    try {
      const result = await bannerRepository.findAll(params);
      
      // 处理图片URL
      const processedBanners = result.rows.map(banner => ({
        ...banner.toJSON(),
        image: this.processImageUrl(banner.image)
      }));
      
      return {
        banners: processedBanners,
        total: result.count,
        page: parseInt(params.page) || 1,
        limit: parseInt(params.limit) || 10,
        totalPages: Math.ceil(result.count / (parseInt(params.limit) || 10))
      };
    } catch (error) {
      logger.error('获取轮播图列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取轮播图
   * @param {String} id 轮播图ID
   * @returns {Promise<Object>} 轮播图对象
   */
  async getBannerById(id) {
    try {
      const banner = await bannerRepository.findById(id);
      
      if (!banner) {
        throw ErrorMiddleware.createError(
          '轮播图不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.RESOURCE_NOT_FOUND
        );
      }
      
      return {
        ...banner.toJSON(),
        image: this.processImageUrl(banner.image)
      };
    } catch (error) {
      logger.error('获取轮播图详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建轮播图
   * @param {Object} bannerData 轮播图数据
   * @returns {Promise<Object>} 创建的轮播图
   */
  async createBanner(bannerData) {
    try {
      const banner = await bannerRepository.create(bannerData);
      
      // 清除相关缓存
      await this.clearCache(banner.scene);
      
      logger.info('轮播图创建成功', { bannerId: banner.id, title: banner.title });
      
      return {
        ...banner.toJSON(),
        image: this.processImageUrl(banner.image)
      };
    } catch (error) {
      logger.error('创建轮播图失败:', error);
      throw error;
    }
  }

  /**
   * 更新轮播图
   * @param {String} id 轮播图ID
   * @param {Object} bannerData 更新数据
   * @returns {Promise<Object>} 更新后的轮播图
   */
  async updateBanner(id, bannerData) {
    try {
      const banner = await bannerRepository.update(id, bannerData);
      
      // 清除相关缓存
      await this.clearCache(banner.scene);
      
      logger.info('轮播图更新成功', { bannerId: id });
      
      return {
        ...banner.toJSON(),
        image: this.processImageUrl(banner.image)
      };
    } catch (error) {
      logger.error('更新轮播图失败:', error);
      throw error;
    }
  }

  /**
   * 删除轮播图
   * @param {String} id 轮播图ID
   * @returns {Promise<Boolean>} 删除结果
   */
  async deleteBanner(id) {
    try {
      // 先获取轮播图信息用于清除缓存
      const banner = await bannerRepository.findById(id);
      if (!banner) {
        throw ErrorMiddleware.createError(
          '轮播图不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.RESOURCE_NOT_FOUND
        );
      }
      
      await bannerRepository.delete(id);
      
      // 清除相关缓存
      await this.clearCache(banner.scene);
      
      logger.info('轮播图删除成功', { bannerId: id });
      
      return true;
    } catch (error) {
      logger.error('删除轮播图失败:', error);
      throw error;
    }
  }

  /**
   * 记录轮播图点击
   * @param {String} bannerId 轮播图ID
   * @param {String} scene 场景
   * @param {String} platform 平台
   * @returns {Promise<Boolean>} 记录结果
   */
  async recordClick(bannerId, scene = 'home', platform = 'app') {
    try {
      await bannerRepository.incrementClick(bannerId);
      
      // 记录点击日志
      logger.info('轮播图点击记录', {
        bannerId,
        scene,
        platform,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error('记录轮播图点击失败:', error);
      throw error;
    }
  }

  /**
   * 记录轮播图展示
   * @param {Array} bannerIds 轮播图ID数组
   * @param {String} scene 场景
   * @param {String} platform 平台
   * @returns {Promise<Boolean>} 记录结果
   */
  async recordView(bannerIds, scene = 'home', platform = 'app') {
    try {
      await bannerRepository.incrementViews(bannerIds);
      
      // 记录展示日志
      logger.info('轮播图展示记录', {
        bannerIds,
        scene,
        platform,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error('记录轮播图展示失败:', error);
      throw error;
    }
  }

  /**
   * 更新排序
   * @param {Array} sortData 排序数据
   * @returns {Promise<Boolean>} 更新结果
   */
  async updateSortOrder(sortData) {
    try {
      await bannerRepository.updateSortOrder(sortData);
      
      // 清除所有缓存
      await this.clearCache();
      
      logger.info('轮播图排序更新成功');
      
      return true;
    } catch (error) {
      logger.error('更新轮播图排序失败:', error);
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
    try {
      return await bannerRepository.getStatistics(bannerId, dateRange);
    } catch (error) {
      logger.error('获取轮播图统计失败:', error);
      throw error;
    }
  }

  /**
   * 处理图片URL - 统一返回相对路径，避免跨环境访问问题
   * @param {String} imageUrl 图片URL
   * @returns {String} 处理后的URL
   */
  processImageUrl(imageUrl) {
    if (!imageUrl) return null;

    // 如果已经是完整URL，提取相对路径部分
    if (imageUrl.startsWith('http')) {
      try {
        const url = new URL(imageUrl);
        return url.pathname; // 返回路径部分，如 /uploads/images/xxx.jpg
      } catch (error) {
        logger.warn('无法解析图片URL:', imageUrl);
        return imageUrl;
      }
    }

    // 如果已经是相对路径，直接返回
    return imageUrl;
  }

  /**
   * 清除缓存
   * @param {String} scene 场景（可选）
   * @returns {Promise<Boolean>} 清除结果
   */
  async clearCache(scene = null) {
    try {
      if (!redisClient) return true;
      
      const pattern = scene ? `banners:${scene}:*` : 'banners:*';
      const keys = await redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      
      logger.info('轮播图缓存清除成功', { pattern });
      return true;
    } catch (error) {
      logger.error('清除轮播图缓存失败:', error);
      return false;
    }
  }
}

module.exports = new BannerService();
