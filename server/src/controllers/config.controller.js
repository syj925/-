const configService = require('../services/config.service');
const { ResponseUtil } = require('../utils');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../config/logger');

/**
 * 配置控制器 - 处理系统配置相关请求
 */
class ConfigController {
  /**
   * 获取所有分类（管理后台格式）
   * GET /api/content/categories
   */
  async getAllCategories(req, res, next) {
    try {
      const result = await configService.getAllCategories();
      
      // 返回管理后台期望的格式
      res.json(result);
    } catch (error) {
      logger.error('获取分类列表失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '获取分类列表失败',
        error: error.message
      });
    }
  }

  /**
   * 获取配置版本信息
   * GET /api/config-version
   */
  async getConfigVersion(req, res, next) {
    try {
      const versionInfo = await configService.getConfigVersion();
      
      res.json({
        code: 0,
        message: '获取版本信息成功',
        data: versionInfo
      });
    } catch (error) {
      logger.error('获取配置版本信息失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: 500,
        message: '获取版本信息失败',
        data: null
      });
    }
  }

  /**
   * 获取内容验证规则
   * GET /api/content-rules
   */
  async getContentRules(req, res, next) {
    try {
      const contentRules = await configService.getContentRules();
      
      res.json({
        code: 0,
        message: '获取验证规则成功',
        data: contentRules
      });
    } catch (error) {
      logger.error('获取验证规则失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: 500,
        message: '获取验证规则失败',
        data: null
      });
    }
  }

  /**
   * 重置强制更新标志
   * POST /api/reset-force-update
   */
  async resetForceUpdate(req, res, next) {
    try {
      const versionInfo = await configService.resetForceUpdate();
      
      res.json({
        code: 0,
        message: '强制更新标志已重置',
        data: versionInfo
      });
    } catch (error) {
      logger.error('重置强制更新标志失败:', error);
      
      if (error.message === '未找到配置版本信息') {
        return res.status(StatusCodes.NOT_FOUND).json({
          code: 404,
          message: '未找到配置版本信息',
          data: null
        });
      }
      
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: 500,
        message: '重置失败',
        data: null
      });
    }
  }

  // ==================== 管理员端配置版本管理 ====================

  /**
   * 获取配置版本信息（管理员端）
   * GET /api/admin/config-version
   */
  async getAdminConfigVersion(req, res, next) {
    try {
      const versionInfo = await configService.getAdminConfigVersion();
      
      res.json({
        success: true,
        data: versionInfo
      });
    } catch (error) {
      logger.error('获取配置版本信息失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '获取配置版本信息失败'
      });
    }
  }

  /**
   * 获取版本历史
   * GET /api/admin/config-versions
   */
  async getVersionHistory(req, res, next) {
    try {
      const history = await configService.getVersionHistory();
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('获取版本历史失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '获取版本历史失败'
      });
    }
  }

  /**
   * 发布新配置版本
   * POST /api/admin/config-version
   */
  async publishConfigVersion(req, res, next) {
    try {
      const { version, description, forceUpdate, config } = req.body;
      
      const newVersionInfo = await configService.publishConfigVersion({
        version,
        description,
        forceUpdate,
        config
      });
      
      res.json({
        success: true,
        message: '配置版本发布成功',
        data: newVersionInfo
      });
    } catch (error) {
      logger.error('发布配置版本失败:', error);
      
      if (error.message.includes('不能为空') || error.message.includes('已存在')) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '发布配置版本失败'
      });
    }
  }

  /**
   * 回滚到指定版本
   * POST /api/admin/config-rollback
   */
  async rollbackToVersion(req, res, next) {
    try {
      const { targetVersion } = req.body;
      
      const rollbackVersionInfo = await configService.rollbackToVersion(targetVersion);
      
      res.json({
        success: true,
        message: '配置回滚成功',
        data: rollbackVersionInfo
      });
    } catch (error) {
      logger.error('配置回滚失败:', error);
      
      if (error.message === '目标版本不能为空') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message === '版本历史不存在' || error.message === '目标版本不存在') {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '配置回滚失败'
      });
    }
  }
}

module.exports = new ConfigController();
