const badgeService = require('../services/badge.service');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../config/logger');

/**
 * 徽章控制器（前端API）
 */
class BadgeController {
  /**
   * 获取徽章列表
   */
  async getBadges(req, res) {
    try {
      const { type, status = 'active', search } = req.query;
      
      let badges;
      if (search) {
        badges = await badgeService.searchBadges(search, { type, status });
      } else {
        badges = await badgeService.getBadges({ type, status });
      }
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: badges,
        message: '获取徽章列表成功'
      });
    } catch (error) {
      logger.error('获取徽章列表失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '获取徽章列表失败',
        error: error.message
      });
    }
  }

  /**
   * 获取徽章详情
   */
  async getBadgeDetail(req, res) {
    try {
      const { id } = req.params;
      
      const badge = await badgeService.getBadgeById(id);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: badge,
        message: '获取徽章详情成功'
      });
    } catch (error) {
      logger.error('获取徽章详情失败:', error);
      
      if (error.message === '徽章不存在') {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '获取徽章详情失败',
          error: error.message
        });
      }
    }
  }

  /**
   * 获取用户徽章（公开接口，无需认证）
   */
  async getUserBadgesPublic(req, res) {
    try {
      const { userId } = req.params;
      const { type, includeHidden = false } = req.query;
      
      // 公开接口只返回可见的徽章
      const userBadges = await badgeService.getUserBadges(userId, { 
        type, 
        includeHidden: false  // 公开接口强制只显示可见徽章
      });
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: userBadges,
        message: '获取用户徽章成功'
      });
    } catch (error) {
      logger.error('获取用户徽章失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '获取用户徽章失败',
        error: error.message
      });
    }
  }

  /**
   * 获取用户徽章（需要认证）
   */
  async getUserBadges(req, res) {
    try {
      const { userId } = req.params;
      const { type, includeHidden = false } = req.query;
      
      const userBadges = await badgeService.getUserBadges(userId, { 
        type, 
        includeHidden: includeHidden === 'true' 
      });
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: userBadges,
        message: '获取用户徽章成功'
      });
    } catch (error) {
      logger.error('获取用户徽章失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '获取用户徽章失败',
        error: error.message
      });
    }
  }

  /**
   * 获取当前用户徽章
   */
  async getMyBadges(req, res) {
    try {
      const userId = req.user.id;
      const { type, includeHidden = true } = req.query; // 当前用户默认包含隐藏徽章
      
      const userBadges = await badgeService.getUserBadges(userId, { 
        type, 
        includeHidden: includeHidden === 'true' 
      });
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: userBadges,
        message: '获取我的徽章成功'
      });
    } catch (error) {
      logger.error('获取我的徽章失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '获取我的徽章失败',
        error: error.message
      });
    }
  }

  /**
   * 更新徽章显示设置
   */
  async updateBadgeDisplay(req, res) {
    try {
      const userId = req.user.id;
      const { badgeId } = req.params;
      const { isVisible, displayOrder } = req.body;
      
      // 验证参数
      if (isVisible !== undefined && typeof isVisible !== 'boolean') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '显示设置必须是布尔值'
        });
      }
      
      if (displayOrder !== undefined && (!Number.isInteger(displayOrder) || displayOrder < 0)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '显示顺序必须是非负整数'
        });
      }

      const settings = {};
      if (isVisible !== undefined) settings.is_visible = isVisible;
      if (displayOrder !== undefined) settings.display_order = displayOrder;

      await badgeService.updateUserBadgeDisplay(userId, badgeId, settings);
      
      res.status(StatusCodes.OK).json({
        success: true,
        message: '更新徽章显示设置成功'
      });
    } catch (error) {
      logger.error('更新徽章显示设置失败:', error);
      
      if (error.message === '用户徽章不存在') {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '更新徽章显示设置失败',
          error: error.message
        });
      }
    }
  }

  /**
   * 批量更新徽章显示顺序
   */
  async updateBadgesOrder(req, res) {
    try {
      const userId = req.user.id;
      const { badgeOrders } = req.body;
      
      // 验证参数
      if (!Array.isArray(badgeOrders)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '徽章顺序必须是数组'
        });
      }

      // 验证数组元素格式
      for (const order of badgeOrders) {
        if (!order.badgeId || typeof order.badgeId !== 'string') {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: '徽章ID不能为空且必须是字符串'
          });
        }
        
        if (!Number.isInteger(order.displayOrder) || order.displayOrder < 0) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: '显示顺序必须是非负整数'
          });
        }
      }
      
      await badgeService.updateUserBadgeOrder(userId, badgeOrders);
      
      res.status(StatusCodes.OK).json({
        success: true,
        message: '更新徽章显示顺序成功'
      });
    } catch (error) {
      logger.error('更新徽章显示顺序失败:', error);
      
      if (error.message.includes('用户未拥有徽章')) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '更新徽章显示顺序失败',
          error: error.message
        });
      }
    }
  }

  /**
   * 触发自动徽章检查
   */
  async checkAutoGrant(req, res) {
    try {
      const userId = req.user.id;
      
      const newBadges = await badgeService.checkAutoGrantConditions(userId);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          newBadges: newBadges,
          count: newBadges.length
        },
        message: newBadges.length > 0 
          ? `恭喜！您获得了 ${newBadges.length} 个新徽章` 
          : '暂无新徽章'
      });
    } catch (error) {
      logger.error('检查自动徽章失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '检查自动徽章失败',
        error: error.message
      });
    }
  }

  /**
   * 获取用户徽章统计
   */
  async getUserBadgeStats(req, res) {
    try {
      const { userId } = req.params;
      
      const stats = await badgeService.getUserBadgeStatistics(userId);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: stats,
        message: '获取用户徽章统计成功'
      });
    } catch (error) {
      logger.error('获取用户徽章统计失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '获取用户徽章统计失败',
        error: error.message
      });
    }
  }

  /**
   * 获取我的徽章统计
   */
  async getMyBadgeStats(req, res) {
    try {
      const userId = req.user.id;
      
      const stats = await badgeService.getUserBadgeStatistics(userId);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: stats,
        message: '获取我的徽章统计成功'
      });
    } catch (error) {
      logger.error('获取我的徽章统计失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '获取我的徽章统计失败',
        error: error.message
      });
    }
  }

  /**
   * 获取徽章的用户列表
   */
  async getBadgeUsers(req, res) {
    try {
      const { badgeId } = req.params;
      const { 
        page = 1, 
        limit = 20, 
        orderBy = 'granted_at', 
        orderDirection = 'DESC' 
      } = req.query;
      
      const result = await badgeService.getBadgeUsers(badgeId, {
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy,
        orderDirection
      });
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: result,
        message: '获取徽章用户列表成功'
      });
    } catch (error) {
      logger.error('获取徽章用户列表失败:', error);
      
      if (error.message === '徽章不存在') {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '获取徽章用户列表失败',
          error: error.message
        });
      }
    }
  }

  /**
   * 搜索徽章
   */
  async searchBadges(req, res) {
    try {
      const { q: keyword, type, status = 'active' } = req.query;
      
      if (!keyword || keyword.trim().length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '搜索关键词不能为空'
        });
      }
      
      const badges = await badgeService.searchBadges(keyword, { type, status });
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: badges,
        message: '搜索徽章成功'
      });
    } catch (error) {
      logger.error('搜索徽章失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '搜索徽章失败',
        error: error.message
      });
    }
  }

  /**
   * 获取最近授予的徽章
   */
  async getRecentlyGranted(req, res) {
    try {
      const { limit = 10, days = 7 } = req.query;
      
      const recentBadges = await badgeService.getRecentlyGrantedBadges(
        parseInt(limit), 
        parseInt(days)
      );
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: recentBadges,
        message: '获取最近授予徽章成功'
      });
    } catch (error) {
      logger.error('获取最近授予徽章失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '获取最近授予徽章失败',
        error: error.message
      });
    }
  }
}

module.exports = new BadgeController();


