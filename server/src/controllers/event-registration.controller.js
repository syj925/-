const eventRegistrationService = require('../services/event-registration.service');
const eventService = require('../services/event.service');
const { StatusCodes } = require('http-status-codes');
const { ResponseUtil } = require('../utils');
const logger = require('../../config/logger');

/**
 * 活动报名控制器
 */
class EventRegistrationController {
  /**
   * 获取活动报名列表
   * @route GET /api/events/:eventId/registrations
   * @access Private (活动组织者)
   */
  async getEventRegistrations(req, res) {
    try {
      const { eventId } = req.params;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status ? parseInt(req.query.status) : undefined,
        keyword: req.query.keyword
      };

      logger.info('获取活动报名列表', { eventId, options });

      const result = await eventRegistrationService.getEventRegistrations(eventId, options);

      return ResponseUtil.success(res, result, '获取活动报名列表成功');
    } catch (error) {
      logger.error('获取活动报名列表失败', { error: error.message, eventId: req.params.eventId });
      return ResponseUtil.error(res, error.message, error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 获取用户报名列表
   * @route GET /api/registrations/my-registrations
   * @access Private
   */
  async getMyRegistrations(req, res) {
    try {
      const userId = req.user.id;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status ? parseInt(req.query.status) : undefined
      };

      logger.info('获取用户报名列表', { userId, options });

      const result = await eventRegistrationService.getUserRegistrations(userId, options);

      return ResponseUtil.success(res, result, '获取我的报名列表成功');
    } catch (error) {
      logger.error('获取用户报名列表失败', { error: error.message, userId: req.user?.id });
      return ResponseUtil.error(res, error.message, error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 获取报名详情
   * @route GET /api/registrations/:id
   * @access Private
   */
  async getRegistrationById(req, res) {
    try {
      const { id } = req.params;

      logger.info('获取报名详情', { registrationId: id });

      const registration = await eventRegistrationService.getRegistrationById(id);

      return ResponseUtil.success(res, registration, '获取报名详情成功');
    } catch (error) {
      logger.error('获取报名详情失败', { error: error.message, registrationId: req.params.id });
      return ResponseUtil.error(res, error.message, error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 更新报名信息
   * @route PUT /api/registrations/:id
   * @access Private
   */
  async updateRegistration(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      logger.info('更新报名信息', { registrationId: id, userId, updateData });

      const registration = await eventRegistrationService.updateRegistration(id, updateData, userId);

      logger.info('报名信息更新成功', { registrationId: id, userId });

      return ResponseUtil.success(res, registration, '报名信息更新成功');
    } catch (error) {
      logger.error('更新报名信息失败', { error: error.message, registrationId: req.params.id, userId: req.user?.id });
      return ResponseUtil.error(res, error.message, error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 签到
   * @route POST /api/registrations/:id/check-in
   * @access Private (活动组织者或管理员)
   */
  async checkIn(req, res) {
    try {
      const { id } = req.params;
      const operatorId = req.user.id;

      logger.info('活动签到', { registrationId: id, operatorId });

      const registration = await eventRegistrationService.checkIn(id, operatorId);

      logger.info('签到成功', { registrationId: id, operatorId });

      return ResponseUtil.success(res, registration, '签到成功');
    } catch (error) {
      logger.error('签到失败', { error: error.message, registrationId: req.params.id, operatorId: req.user?.id });
      return ResponseUtil.error(res, error.message, error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 批量更新报名状态
   * @route PUT /api/registrations/batch-status
   * @access Private (活动组织者或管理员)
   */
  async batchUpdateStatus(req, res) {
    try {
      const { registration_ids, status } = req.body;
      const operatorId = req.user.id;

      logger.info('批量更新报名状态', { registrationIds: registration_ids, status, operatorId });

      const updatedCount = await eventRegistrationService.batchUpdateStatus(registration_ids, status, operatorId);

      logger.info('批量更新报名状态成功', { updatedCount, operatorId });

      return ResponseUtil.success(res, { updated_count: updatedCount }, `成功更新${updatedCount}条记录`);
    } catch (error) {
      logger.error('批量更新报名状态失败', { error: error.message, operatorId: req.user?.id });
      return ResponseUtil.error(res, error.message, error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 获取活动报名统计
   * @route GET /api/events/:eventId/registration-statistics
   * @access Private (活动组织者)
   */
  async getEventRegistrationStatistics(req, res) {
    try {
      const { eventId } = req.params;

      logger.info('获取活动报名统计', { eventId });

      const statistics = await eventRegistrationService.getEventRegistrationStatistics(eventId);

      return ResponseUtil.success(res, statistics, '获取活动报名统计成功');
    } catch (error) {
      logger.error('获取活动报名统计失败', { error: error.message, eventId: req.params.eventId });
      return ResponseUtil.error(res, error.message, error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 获取用户报名统计
   * @route GET /api/registrations/my-statistics
   * @access Private
   */
  async getMyRegistrationStatistics(req, res) {
    try {
      const userId = req.user.id;

      logger.info('获取用户报名统计', { userId });

      const statistics = await eventRegistrationService.getUserRegistrationStatistics(userId);

      return ResponseUtil.success(res, statistics, '获取我的报名统计成功');
    } catch (error) {
      logger.error('获取用户报名统计失败', { error: error.message, userId: req.user?.id });
      return ResponseUtil.error(res, error.message, error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 导出活动报名数据
   * @route GET /api/events/:eventId/registrations/export
   * @access Private (活动组织者)
   */
  async exportEventRegistrations(req, res) {
    try {
      const { eventId } = req.params;
      const options = {
        status: req.query.status ? parseInt(req.query.status) : undefined
      };

      logger.info('导出活动报名数据', { eventId, options });

      const exportData = await eventRegistrationService.exportEventRegistrations(eventId, options);

      // 设置响应头，提示下载
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="event_${eventId}_registrations.json"`);

      return ResponseUtil.success(res, exportData, '导出活动报名数据成功');
    } catch (error) {
      logger.error('导出活动报名数据失败', { error: error.message, eventId: req.params.eventId });
      return ResponseUtil.error(res, error.message, error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 批量签到
   * @route POST /api/registrations/batch-check-in
   * @access Private (活动组织者或管理员)
   */
  async batchCheckIn(req, res) {
    try {
      const { registration_ids } = req.body;
      const operatorId = req.user.id;

      if (!Array.isArray(registration_ids) || registration_ids.length === 0) {
        return ResponseUtil.error(res, '请选择要签到的报名记录', StatusCodes.BAD_REQUEST);
      }

      logger.info('批量签到', { registrationIds: registration_ids, operatorId });

      // 批量更新状态为已参加
      const updatedCount = await eventRegistrationService.batchUpdateStatus(registration_ids, 2, operatorId);

      logger.info('批量签到成功', { updatedCount, operatorId });

      return ResponseUtil.success(res, { updated_count: updatedCount }, `成功签到${updatedCount}人`);
    } catch (error) {
      logger.error('批量签到失败', { error: error.message, operatorId: req.user?.id });
      return ResponseUtil.error(res, error.message, error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 获取报名表单配置
   * @route GET /api/events/:eventId/form-config
   * @access Public
   */
  async getFormConfig(req, res) {
    try {
      const { eventId } = req.params;

      // 通过事件服务获取活动信息，包含表单配置
      const event = await eventService.getEventById(eventId);

      const formConfig = {
        form_config: event.form_config || [],
        notices: event.notices || []
      };

      return ResponseUtil.success(res, formConfig, '获取报名表单配置成功');
    } catch (error) {
      logger.error('获取报名表单配置失败', { error: error.message, eventId: req.params.eventId });
      return ResponseUtil.error(res, error.message, error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new EventRegistrationController();
