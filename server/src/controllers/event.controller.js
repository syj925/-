const eventService = require('../services/event.service');
const eventRegistrationService = require('../services/event-registration.service');
const { StatusCodes } = require('http-status-codes');
const { ResponseUtil } = require('../utils');
const logger = require('../../config/logger');

/**
 * 活动控制器
 */
class EventController {
  /**
   * 创建活动
   * @route POST /api/events
   * @access Private
   */
  async createEvent(req, res) {
    try {
      const userId = req.user.id;
      const eventData = req.body;

      logger.info('创建活动', { userId, eventData: { ...eventData, form_config: '...' } });

      const event = await eventService.createEvent(eventData, userId);

      logger.info('活动创建成功', { eventId: event.id, userId });

      return res.status(StatusCodes.CREATED).json(ResponseUtil.success(event, '活动创建成功'));
    } catch (error) {
      logger.error('创建活动失败', { error: error.message, userId: req.user?.id });
      return res.status(error.statusCode || 500).json(ResponseUtil.customError(error.statusCode || 500, error.message));
    }
  }

  /**
   * 获取活动详情
   * @route GET /api/events/:id
   * @access Public
   */
  async getEventById(req, res) {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id;

      logger.info('获取活动详情', { eventId: id, currentUserId });

      const event = await eventService.getEventById(id, currentUserId);

      return res.json(ResponseUtil.success(event, '获取活动详情成功'));
    } catch (error) {
      logger.error('获取活动详情失败', { error: error.message, eventId: req.params.id });
      return res.status(error.statusCode || 500).json(ResponseUtil.customError(error.statusCode || 500, error.message));
    }
  }

  /**
   * 更新活动
   * @route PUT /api/events/:id
   * @access Private
   */
  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      logger.info('更新活动', { eventId: id, userId, updateData: { ...updateData, form_config: '...' } });

      const event = await eventService.updateEvent(id, updateData, userId);

      logger.info('活动更新成功', { eventId: id, userId });

      return res.json(ResponseUtil.success(event, '活动更新成功'));
    } catch (error) {
      logger.error('更新活动失败', { error: error.message, eventId: req.params.id, userId: req.user?.id });
      return res.status(error.statusCode || 500).json(ResponseUtil.customError(error.statusCode || 500, error.message));
    }
  }

  /**
   * 删除活动
   * @route DELETE /api/events/:id
   * @access Private
   */
  async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      logger.info('删除活动', { eventId: id, userId });

      await eventService.deleteEvent(id, userId);

      logger.info('活动删除成功', { eventId: id, userId });

      return res.json(ResponseUtil.success(null, '活动删除成功'));
    } catch (error) {
      logger.error('删除活动失败', { error: error.message, eventId: req.params.id, userId: req.user?.id });
      return res.status(error.statusCode || 500).json(ResponseUtil.customError(error.statusCode || 500, error.message));
    }
  }

  /**
   * 获取活动列表
   * @route GET /api/events
   * @access Public
   */
  async getEvents(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status ? parseInt(req.query.status) : undefined,
        organizerId: req.query.organizer_id,
        isRecommended: req.query.is_recommended ? req.query.is_recommended === 'true' : undefined,
        keyword: req.query.keyword,
        startDate: req.query.start_date,
        endDate: req.query.end_date
      };

      logger.info('获取活动列表', { options });

      const result = await eventService.getEvents(options);

      return res.json(ResponseUtil.success(result, '获取活动列表成功'));
    } catch (error) {
      logger.error('获取活动列表失败', { error: error.message });
      return res.status(error.statusCode || 500).json(ResponseUtil.customError(error.statusCode || 500, error.message));
    }
  }

  /**
   * 获取推荐活动
   * @route GET /api/events/recommended
   * @access Public
   */
  async getRecommendedEvents(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      logger.info('获取推荐活动', { limit });

      const events = await eventService.getRecommendedEvents(limit);

      return res.json(ResponseUtil.success(events, '获取推荐活动成功'));
    } catch (error) {
      logger.error('获取推荐活动失败', { error: error.message });
      return res.status(error.statusCode || 500).json(ResponseUtil.customError(error.statusCode || 500, error.message));
    }
  }

  /**
   * 获取即将开始的活动
   * @route GET /api/events/upcoming
   * @access Public
   */
  async getUpcomingEvents(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      logger.info('获取即将开始的活动', { limit });

      const events = await eventService.getUpcomingEvents(limit);

      return res.json(ResponseUtil.success(events, '获取即将开始的活动成功'));
    } catch (error) {
      logger.error('获取即将开始的活动失败', { error: error.message });
      return res.status(error.statusCode || 500).json(ResponseUtil.customError(error.statusCode || 500, error.message));
    }
  }

  /**
   * 报名活动
   * @route POST /api/events/:id/register
   * @access Private
   */
  async registerEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { form_data } = req.body;

      logger.info('报名活动', { eventId: id, userId, formData: form_data });

      const registration = await eventService.registerEvent(id, userId, form_data);

      logger.info('活动报名成功', { eventId: id, userId, registrationId: registration.id });

      return res.status(StatusCodes.CREATED).json(ResponseUtil.success(registration, '报名成功'));
    } catch (error) {
      logger.error('活动报名失败', { error: error.message, eventId: req.params.id, userId: req.user?.id });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ResponseUtil.customError(error.statusCode || 500, error.message));
    }
  }

  /**
   * 取消报名
   * @route DELETE /api/events/:id/register
   * @access Private
   */
  async cancelRegistration(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { reason } = req.body;

      logger.info('取消报名', { eventId: id, userId, reason });

      const registration = await eventService.cancelRegistration(id, userId, reason);

      logger.info('取消报名成功', { eventId: id, userId, registrationId: registration.id });

      return res.json(ResponseUtil.success(registration, '取消报名成功'));
    } catch (error) {
      logger.error('取消报名失败', { error: error.message, eventId: req.params.id, userId: req.user?.id });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ResponseUtil.customError(error.statusCode || 500, error.message));
    }
  }

  /**
   * 检查报名状态
   * @route GET /api/events/:id/registration-status
   * @access Private
   */
  async checkRegistrationStatus(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const status = await eventRegistrationService.checkRegistrationStatus(id, userId);

      return res.json(ResponseUtil.success(status, '获取报名状态成功'));
    } catch (error) {
      logger.error('获取报名状态失败', { error: error.message, eventId: req.params.id, userId: req.user?.id });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ResponseUtil.customError(error.statusCode || 500, error.message));
    }
  }

  /**
   * 批量检查报名状态
   * @route POST /api/events/batch-registration-status
   * @access Private
   */
  async batchCheckRegistrationStatus(req, res) {
    try {
      const { event_ids } = req.body;
      const userId = req.user.id;

      if (!Array.isArray(event_ids)) {
        return ResponseUtil.error(res, '活动ID列表格式错误', StatusCodes.BAD_REQUEST);
      }

      const statusMap = await eventRegistrationService.batchCheckRegistrationStatus(event_ids, userId);

      return res.json(ResponseUtil.success(statusMap, '批量获取报名状态成功'));
    } catch (error) {
      logger.error('批量获取报名状态失败', { error: error.message, userId: req.user?.id });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ResponseUtil.customError(error.statusCode || 500, error.message));
    }
  }

  /**
   * 获取活动统计信息
   * @route GET /api/events/:id/statistics
   * @access Public
   */
  async getEventStatistics(req, res) {
    try {
      const { id } = req.params;

      const statistics = await eventService.getEventStatistics(id);

      return res.json(ResponseUtil.success(statistics, '获取活动统计成功'));
    } catch (error) {
      logger.error('获取活动统计失败', { error: error.message, eventId: req.params.id });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ResponseUtil.customError(error.statusCode || 500, error.message));
    }
  }

  /**
   * 获取用户创建的活动
   * @route GET /api/events/my-events
   * @access Private
   */
  async getMyEvents(req, res) {
    try {
      const userId = req.user.id;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status ? parseInt(req.query.status) : undefined,
        keyword: req.query.keyword
      };

      logger.info('获取用户创建的活动', { userId, options });

      const result = await eventService.getUserEvents(userId, options);

      return res.json(ResponseUtil.success(result, '获取我的活动成功'));
    } catch (error) {
      logger.error('获取我的活动失败', { error: error.message, userId: req.user?.id });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ResponseUtil.customError(error.statusCode || 500, error.message));
    }
  }
}

module.exports = new EventController();
