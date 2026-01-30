const badgeService = require('../../services/badge.service');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../../config/logger');

/**
 * 管理后台徽章控制器
 */
class AdminBadgeController {
  /**
   * 获取徽章列表（管理后台）
   */
  async getBadgeList(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        type,
        status 
      } = req.query;

      // 管理后台直接查询数据库，不使用缓存确保数据实时性
      logger.info('🎯 [管理后台] 获取徽章列表，查询参数:', { type, status, search, page, limit });
      let badges = await badgeService.getBadgesFromDB({ 
        type, 
        status, 
        includeUserCount: true 
      });
      
      // 搜索过滤
      if (search) {
        const searchLower = search.toLowerCase();
        badges = badges.filter(badge => 
          badge.name.toLowerCase().includes(searchLower) ||
          badge.description?.toLowerCase().includes(searchLower)
        );
      }

      // 分页
      const total = badges.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedBadges = badges.slice(startIndex, endIndex);

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          items: paginatedBadges,
          total: total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
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
   * 创建徽章
   */
  async createBadge(req, res) {
    try {
      const badgeData = req.body;
      const adminId = req.user.id;
      

      // 基础数据验证
      if (!badgeData.name || badgeData.name.trim().length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '徽章名称不能为空'
        });
      }

      if (badgeData.name.length > 50) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '徽章名称不能超过50个字符'
        });
      }
      
      const badge = await badgeService.createBadge(badgeData, adminId);
      
      logger.info('管理员创建徽章成功', {
        adminId,
        badgeId: badge.id,
        badgeName: badge.name
      });

      res.status(StatusCodes.CREATED).json({
        success: true,
        data: badge,
        message: '创建徽章成功'
      });
    } catch (error) {
      logger.error('创建徽章失败:', error);
      
      if (error.message === '徽章名称已存在' || 
          error.message === '颜色格式不正确，请使用十六进制颜色代码') {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '创建徽章失败',
          error: error.message
        });
      }
    }
  }

  /**
   * 更新徽章
   */
  async updateBadge(req, res) {
    try {
      const { id } = req.params;
      const badgeData = req.body;
      const adminId = req.user.id;
      
      // 基础数据验证
      if (badgeData.name !== undefined) {
        if (!badgeData.name || badgeData.name.trim().length === 0) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: '徽章名称不能为空'
          });
        }

        if (badgeData.name.length > 50) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: '徽章名称不能超过50个字符'
          });
        }
      }
      
      const badge = await badgeService.updateBadge(id, badgeData, adminId);
      
      logger.info('管理员更新徽章成功', {
        adminId,
        badgeId: id,
        badgeName: badge.name
      });

      res.status(StatusCodes.OK).json({
        success: true,
        data: badge,
        message: '更新徽章成功'
      });
    } catch (error) {
      logger.error('更新徽章失败:', error);
      
      if (error.message === '徽章不存在') {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: error.message
        });
      } else if (error.message === '徽章名称已存在' || 
                 error.message === '颜色格式不正确，请使用十六进制颜色代码') {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '更新徽章失败',
          error: error.message
        });
      }
    }
  }

  /**
   * 删除徽章
   */
  async deleteBadge(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      
      await badgeService.deleteBadge(id);
      
      logger.info('管理员删除徽章成功', {
        adminId,
        badgeId: id
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: '删除徽章成功'
      });
    } catch (error) {
      logger.error('删除徽章失败:', error);
      
      if (error.message === '徽章不存在') {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: error.message
        });
      } else if (error.message === '此徽章已被用户使用，无法删除') {
        res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '删除徽章失败',
          error: error.message
        });
      }
    }
  }

  /**
   * 更新徽章状态
   */
  async updateBadgeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const adminId = req.user.id;
      
      // 验证状态值
      if (!['active', 'inactive'].includes(status)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '状态值只能是 active 或 inactive'
        });
      }
      
      const badge = await badgeService.updateBadge(id, { status }, adminId);
      
      logger.info('管理员更新徽章状态成功', {
        adminId,
        badgeId: id,
        status
      });

      res.status(StatusCodes.OK).json({
        success: true,
        data: badge,
        message: `${status === 'active' ? '启用' : '禁用'}徽章成功`
      });
    } catch (error) {
      logger.error('更新徽章状态失败:', error);
      
      if (error.message === '徽章不存在') {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '更新徽章状态失败',
          error: error.message
        });
      }
    }
  }

  /**
   * 授予用户徽章
   */
  async grantUserBadge(req, res) {
    try {
      const { userId, badgeId } = req.body;
      const grantedBy = req.user.id;
      
      // 验证参数
      if (!userId || !badgeId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '用户ID和徽章ID不能为空'
        });
      }
      
      await badgeService.grantUserBadge(userId, badgeId, grantedBy);
      
      logger.info('管理员授予用户徽章成功', {
        adminId: grantedBy,
        userId,
        badgeId
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: '授予用户徽章成功'
      });
    } catch (error) {
      logger.error('授予用户徽章失败:', error);
      
      if (error.message === '用户不存在' || 
          error.message === '徽章不存在' ||
          error.message === '用户已拥有该徽章' ||
          error.message === '徽章已禁用，无法授予') {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '授予用户徽章失败',
          error: error.message
        });
      }
    }
  }

  /**
   * 撤销用户徽章
   */
  async revokeUserBadge(req, res) {
    try {
      const { userId, badgeId } = req.body;
      const adminId = req.user.id;
      
      // 验证参数
      if (!userId || !badgeId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '用户ID和徽章ID不能为空'
        });
      }
      
      await badgeService.revokeUserBadge(userId, badgeId);
      
      logger.info('管理员撤销用户徽章成功', {
        adminId,
        userId,
        badgeId
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: '撤销用户徽章成功'
      });
    } catch (error) {
      logger.error('撤销用户徽章失败:', error);
      
      if (error.message === '用户未拥有该徽章') {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '撤销用户徽章失败',
          error: error.message
        });
      }
    }
  }

  /**
   * 批量授予徽章
   */
  async batchGrantBadges(req, res) {
    try {
      const { grants } = req.body;
      const grantedBy = req.user.id;
      
      // 验证参数
      if (!Array.isArray(grants) || grants.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '授予数据必须是非空数组'
        });
      }

      // 为每个授予数据添加授予者
      const grantsWithGranter = grants.map(grant => ({
        ...grant,
        grantedBy
      }));
      
      const results = await badgeService.batchGrantBadges(grantsWithGranter);
      
      logger.info('管理员批量授予徽章成功', {
        adminId: grantedBy,
        totalGrants: grants.length,
        successCount: results.length
      });

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          successCount: results.length,
          totalCount: grants.length,
          results: results
        },
        message: `批量授予徽章完成，成功 ${results.length}/${grants.length} 个`
      });
    } catch (error) {
      logger.error('批量授予徽章失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '批量授予徽章失败',
        error: error.message
      });
    }
  }

  /**
   * 获取徽章统计信息
   */
  async getBadgeStatistics(req, res) {
    try {
      const stats = await badgeService.getBadgeStatistics();
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: stats,
        message: '获取徽章统计成功'
      });
    } catch (error) {
      logger.error('获取徽章统计失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '获取徽章统计失败',
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
      const { q: keyword, type, status } = req.query;
      
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
      const { limit = 20, days = 7 } = req.query;
      
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
  /**
   * 获取徽章授予记录
   */
  async getBadgeGrants(req, res) {
    try {
      const { badgeId } = req.params;
      const { 
        page = 1, 
        limit = 20, 
        search = '' 
      } = req.query;

      // 验证徽章是否存在
      const badge = await badgeService.getBadgeById(badgeId);
      if (!badge) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: '徽章不存在'
        });
      }

      // 获取徽章授予记录（通过 service）
      const grantsResult = await badgeService.getBadgeGrants(badgeId, {
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });

      logger.info('获取徽章授予记录成功', {
        adminId: req.user.id,
        badgeId,
        total: grantsResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          ...grantsResult,
          badge: {
            id: badge.id,
            name: badge.name,
            description: badge.description,
            color: badge.color,
            icon: badge.icon
          }
        },
        message: '获取徽章授予记录成功'
      });
    } catch (error) {
      logger.error('获取徽章授予记录失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '获取徽章授予记录失败',
        error: error.message
      });
    }
  }

  /**
   * 撤销用户徽章
   */
  async revokeUserBadge(req, res) {
    try {
      const { userId, badgeId } = req.body;
      const revokedBy = req.user.id;
      
      // 验证参数
      if (!userId || !badgeId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '用户ID和徽章ID不能为空'
        });
      }
      
      const success = await badgeService.revokeUserBadge(userId, badgeId);
      
      if (success) {
        logger.info('管理员撤销用户徽章成功', {
          adminId: revokedBy,
          userId,
          badgeId
        });

        res.status(StatusCodes.OK).json({
          success: true,
          message: '徽章撤销成功'
        });
      } else {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: '未找到该用户的徽章记录'
        });
      }
    } catch (error) {
      logger.error('撤销用户徽章失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || '撤销徽章失败'
      });
    }
  }

  /**
   * 更新用户徽章可见性
   */
  async updateBadgeVisibility(req, res) {
    try {
      const { userId, badgeId, isVisible } = req.body;
      const updatedBy = req.user.id;
      
      // 验证参数
      if (!userId || !badgeId || typeof isVisible !== 'boolean') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '参数不完整或格式错误'
        });
      }
      
      const success = await badgeService.updateBadgeVisibility(userId, badgeId, isVisible);
      
      if (success) {
        logger.info('管理员更新徽章可见性成功', {
          adminId: updatedBy,
          userId,
          badgeId,
          isVisible
        });

        res.status(StatusCodes.OK).json({
          success: true,
          message: `徽章已${isVisible ? '显示' : '隐藏'}`
        });
      } else {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: '未找到该用户的徽章记录'
        });
      }
    } catch (error) {
      logger.error('更新徽章可见性失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || '更新可见性失败'
      });
    }
  }

  /**
   * 批量撤销徽章
   */
  async batchRevokeBadges(req, res) {
    try {
      const { revokes } = req.body;
      const revokedBy = req.user.id;
      
      // 验证参数
      if (!Array.isArray(revokes) || revokes.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '撤销数据必须是非空数组'
        });
      }
      
      const successCount = await badgeService.batchRevokeBadges(revokes);
      
      logger.info('管理员批量撤销徽章成功', {
        adminId: revokedBy,
        totalRevokes: revokes.length,
        successCount
      });

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          successCount,
          totalCount: revokes.length
        },
        message: `成功撤销 ${successCount}/${revokes.length} 个徽章`
      });
    } catch (error) {
      logger.error('批量撤销徽章失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || '批量撤销失败'
      });
    }
  }
}

module.exports = new AdminBadgeController();
