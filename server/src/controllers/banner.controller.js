const bannerService = require('../services/banner.service');
const { ResponseUtil } = require('../utils');
const { StatusCodes } = require('http-status-codes');
const errorCodes = require('../constants/error-codes');
const logger = require('../../config/logger');

/**
 * 轮播图控制器
 */
class BannerController {
  /**
   * 获取轮播图列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getList(req, res, next) {
    try {
      const { platform = 'app', status = 'active', limit = 10, page, keyword, scene } = req.query;
      
      // 如果有分页参数，使用管理后台接口
      if (page) {
        const result = await bannerService.getBannerList({
          page,
          limit,
          scene,
          platform,
          status,
          keyword
        });
        
        res.json(ResponseUtil.success(result));
      } else {
        // 前端获取轮播图列表
        const banners = await bannerService.getBannersByScene({
          scene: scene || 'home',
          platform,
          status,
          limit
        });
        
        res.json(ResponseUtil.success(banners));
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 根据场景获取轮播图
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getBannersByScene(req, res, next) {
    try {
      const { scene } = req.params;
      const { platform = 'app', status = 'active', limit = 10 } = req.query;
      
      const banners = await bannerService.getBannersByScene({
        scene,
        platform,
        status,
        limit
      });
      
      res.json(ResponseUtil.success(banners));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 根据ID获取轮播图详情
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getBannerById(req, res, next) {
    try {
      const { id } = req.params;
      
      const banner = await bannerService.getBannerById(id);
      
      res.json(ResponseUtil.success(banner));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 创建轮播图
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async create(req, res, next) {
    try {
      const bannerData = {
        title: req.body.title,
        image: req.body.image,
        linkType: req.body.linkType || 'url',
        linkValue: req.body.linkValue,
        targetId: req.body.targetId,
        scene: req.body.scene || 'home',
        platform: req.body.platform || 'all',
        sortOrder: req.body.sortOrder || 0,
        priority: req.body.priority || 0,
        status: req.body.status || 'active',
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        tags: req.body.tags
      };
      
      const banner = await bannerService.createBanner(bannerData);
      
      res.status(StatusCodes.CREATED).json(ResponseUtil.success(banner, '轮播图创建成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新轮播图
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const bannerData = req.body;
      
      const banner = await bannerService.updateBanner(id, bannerData);
      
      res.json(ResponseUtil.success(banner, '轮播图更新成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除轮播图
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      
      await bannerService.deleteBanner(id);
      
      res.json(ResponseUtil.success(null, '轮播图删除成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 记录轮播图点击
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async recordClick(req, res, next) {
    try {
      const { bannerId, scene = 'home', platform = 'app' } = req.body;
      
      await bannerService.recordClick(bannerId, scene, platform);
      
      res.json(ResponseUtil.success(null, '点击记录成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 记录轮播图展示
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async recordView(req, res, next) {
    try {
      const { bannerIds, scene = 'home', platform = 'app' } = req.body;
      
      await bannerService.recordView(bannerIds, scene, platform);
      
      res.json(ResponseUtil.success(null, '展示记录成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新轮播图排序
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async updateSortOrder(req, res, next) {
    try {
      const { banners } = req.body;
      
      await bannerService.updateSortOrder(banners);
      
      res.json(ResponseUtil.success(null, '排序更新成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取轮播图统计数据
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getStatistics(req, res, next) {
    try {
      const { id } = req.params;
      const dateRange = req.query;
      
      const statistics = await bannerService.getStatistics(id, dateRange);
      
      res.json(ResponseUtil.success(statistics));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BannerController();
