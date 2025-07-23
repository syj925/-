const { StatusCodes } = require('http-status-codes');
const { ResponseUtil } = require('../../utils');
const eventService = require('../../services/event.service');
const eventRegistrationService = require('../../services/event-registration.service');
const eventRepository = require('../../repositories/event.repository');
const eventRegistrationRepository = require('../../repositories/event-registration.repository');
const logger = require('../../../config/logger');

/**
 * 管理员活动控制器
 * 提供活动管理的后台管理功能
 */
class AdminEventController {
  /**
   * 获取活动列表（管理员）
   * @route GET /api/admin/events
   * @access Private (Admin)
   */
  async getEventList(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        title,
        status,
        startDate,
        endDate,
        isRecommended,
        organizer
      } = req.query;

      logger.info('管理员获取活动列表', { 
        page, 
        limit, 
        filters: { title, status, startDate, endDate, isRecommended, organizer }
      });

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        title,
        status,
        startDate,
        endDate,
        isRecommended: isRecommended !== undefined ? isRecommended === 'true' : undefined,
        organizer
      };

      logger.info('开始调用 eventService.getEvents');
      const result = await eventService.getEvents(options);
      logger.info('eventService.getEvents 调用完成', {
        eventsCount: result.events ? result.events.length : 0,
        total: result.total
      });

      // 暂时简化，不加载统计信息以避免性能问题
      const response = {
        events: result.events,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      };

      logger.info('准备返回响应', { responseKeys: Object.keys(response) });
      res.status(StatusCodes.OK).json(ResponseUtil.success(response, '获取活动列表成功'));

    } catch (error) {
      logger.error('获取活动列表失败', { error: error.message });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseUtil.customError(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message)
      );
    }
  }

  /**
   * 获取活动详情（管理员）
   * @route GET /api/admin/events/:id
   * @access Private (Admin)
   */
  async getEventDetail(req, res) {
    try {
      const { id } = req.params;

      logger.info('管理员获取活动详情', { eventId: id });

      const event = await eventService.getEventById(id);
      const statistics = await eventRepository.getStatistics(id);

      res.status(StatusCodes.OK).json(ResponseUtil.success({
        event,
        statistics
      }, '获取活动详情成功'));

    } catch (error) {
      logger.error('获取活动详情失败', { error: error.message, eventId: req.params.id });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseUtil.customError(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message)
      );
    }
  }

  /**
   * 创建活动（管理员）
   * @route POST /api/admin/events
   * @access Private (Admin)
   */
  async createEvent(req, res) {
    try {
      const eventData = req.body;
      const adminId = req.admin.id;

      logger.info('管理员创建活动', { adminId, title: eventData.title });

      // 如果前端没有指定组织者ID，使用管理员ID
      const organizerId = eventData.organizer_id || adminId;

      // 移除eventData中的organizer_id，因为service会自己设置
      const { organizer_id, ...cleanEventData } = eventData;

      // 转换状态值：字符串转整数（用于数据库存储）
      if (cleanEventData.status) {
        const statusMap = {
          'upcoming': 1,    // 未开始
          'ongoing': 2,     // 进行中
          'ended': 3,       // 已结束
          'canceled': 4     // 已取消
        };
        const originalStatus = cleanEventData.status;
        cleanEventData.status = statusMap[cleanEventData.status] || 1;
        logger.info('状态转换', {
          originalStatus,
          convertedStatus: cleanEventData.status,
          statusMap
        });
      }

      const event = await eventService.createEvent(cleanEventData, organizerId, true);

      res.status(StatusCodes.CREATED).json(ResponseUtil.success(event, '活动创建成功'));

    } catch (error) {
      logger.error('创建活动失败', { error: error.message, adminId: req.admin?.id });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseUtil.customError(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message)
      );
    }
  }

  /**
   * 更新活动（管理员）
   * @route PUT /api/admin/events/:id
   * @access Private (Admin)
   */
  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const adminId = req.admin.id;

      logger.info('管理员更新活动', { eventId: id, adminId });

      // 转换状态值：字符串转整数（用于数据库存储）
      if (updateData.status) {
        const statusMap = {
          'upcoming': 1,    // 未开始
          'ongoing': 2,     // 进行中
          'ended': 3,       // 已结束
          'canceled': 4     // 已取消
        };
        updateData.status = statusMap[updateData.status] || updateData.status;
      }

      const event = await eventService.updateEvent(id, updateData, adminId, 'admin');

      res.status(StatusCodes.OK).json(ResponseUtil.success(event, '活动更新成功'));

    } catch (error) {
      logger.error('更新活动失败', { error: error.message, eventId: req.params.id });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseUtil.customError(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message)
      );
    }
  }

  /**
   * 删除活动（管理员）
   * @route DELETE /api/admin/events/:id
   * @access Private (Admin)
   */
  async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.admin.id;

      logger.info('管理员删除活动', { eventId: id, adminId });

      await eventService.deleteEvent(id, adminId, 'admin');

      res.status(StatusCodes.OK).json(ResponseUtil.success(null, '活动删除成功'));

    } catch (error) {
      logger.error('删除活动失败', { error: error.message, eventId: req.params.id });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseUtil.customError(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message)
      );
    }
  }

  /**
   * 获取活动报名列表（管理员）
   * @route GET /api/admin/events/:id/registrations
   * @access Private (Admin)
   */
  async getEventRegistrations(req, res) {
    try {
      const { id: eventId } = req.params;
      const {
        page = 1,
        limit = 20,
        status,
        keyword,
        startDate,
        endDate
      } = req.query;

      logger.info('管理员获取活动报名列表', { eventId, page, limit });

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        keyword,
        startDate,
        endDate
      };

      const result = await eventRegistrationRepository.findByEvent(eventId, options);

      return res.status(StatusCodes.OK).json(ResponseUtil.success(result, '获取报名列表成功'));

    } catch (error) {
      logger.error('获取活动报名列表失败', { error: error.message, eventId: req.params.id });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseUtil.customError(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message)
      );
    }
  }

  /**
   * 更新报名状态（管理员）
   * @route PUT /api/admin/events/:eventId/registrations/:registrationId/status
   * @access Private (Admin)
   */
  async updateRegistrationStatus(req, res) {
    try {
      const { eventId, registrationId } = req.params;
      const { status, reason } = req.body;
      const adminId = req.admin.id;

      logger.info('管理员更新报名状态', { eventId, registrationId, status, adminId });

      const registration = await eventRegistrationRepository.update(registrationId, {
        status: parseInt(status),
        admin_note: reason,
        updated_by: adminId
      });

      return res.status(StatusCodes.OK).json(ResponseUtil.success(registration, '报名状态更新成功'));

    } catch (error) {
      logger.error('更新报名状态失败', {
        error: error.message,
        eventId: req.params.eventId,
        registrationId: req.params.registrationId
      });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseUtil.customError(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message)
      );
    }
  }

  /**
   * 批量更新报名状态（管理员）
   * @route PUT /api/admin/events/:eventId/registrations/batch-status
   * @access Private (Admin)
   */
  async batchUpdateRegistrationStatus(req, res) {
    try {
      const { eventId } = req.params;
      const { registrationIds, status, reason } = req.body;
      const adminId = req.admin.id;

      logger.info('管理员批量更新报名状态', { 
        eventId, 
        count: registrationIds?.length, 
        status, 
        adminId 
      });

      if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.customError(StatusCodes.BAD_REQUEST, '请选择要更新的报名记录')
        );
      }

      const updateData = {
        status: parseInt(status),
        admin_note: reason,
        updated_by: adminId
      };

      // 批量更新
      const results = await Promise.all(
        registrationIds.map(id => eventRegistrationRepository.update(id, updateData))
      );

      return res.status(StatusCodes.OK).json(ResponseUtil.success({
        updated: results.length,
        registrationIds
      }, `成功更新 ${results.length} 条报名记录`));

    } catch (error) {
      logger.error('批量更新报名状态失败', {
        error: error.message,
        eventId: req.params.eventId
      });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseUtil.customError(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message)
      );
    }
  }

  /**
   * 获取全局活动统计数据（管理员）
   * @route GET /api/admin/events/statistics
   * @access Private (Admin)
   */
  async getGlobalEventStatistics(req, res) {
    try {
      logger.info('管理员获取全局活动统计');

      // 获取活动总数统计
      const totalEvents = await eventRepository.count();
      const upcomingEvents = await eventRepository.count({ status: 1 }); // 报名中
      const ongoingEvents = await eventRepository.count({ status: 2 }); // 进行中
      const endedEvents = await eventRepository.count({ status: 3 }); // 已结束
      const canceledEvents = await eventRepository.count({ status: 0 }); // 已取消

      // 获取报名统计
      const totalRegistrations = await eventRegistrationRepository.count();
      const activeRegistrations = await eventRegistrationRepository.count({ status: [1, 2] }); // 已报名和已参加
      const canceledRegistrations = await eventRegistrationRepository.count({ status: 0 }); // 已取消

      // 获取推荐活动数量
      const recommendedEvents = await eventRepository.count({ is_recommended: true });

      const statistics = {
        events: {
          total: totalEvents,
          upcoming: upcomingEvents,
          ongoing: ongoingEvents,
          ended: endedEvents,
          canceled: canceledEvents,
          recommended: recommendedEvents
        },
        registrations: {
          total: totalRegistrations,
          active: activeRegistrations,
          canceled: canceledRegistrations
        },
        summary: {
          averageRegistrationsPerEvent: totalEvents > 0 ? Math.round(totalRegistrations / totalEvents * 100) / 100 : 0,
          activeEventsRatio: totalEvents > 0 ? Math.round((upcomingEvents + ongoingEvents) / totalEvents * 100) : 0,
          registrationCancelRate: totalRegistrations > 0 ? Math.round(canceledRegistrations / totalRegistrations * 100) : 0
        }
      };

      return res.status(StatusCodes.OK).json(ResponseUtil.success(statistics, '获取全局活动统计成功'));

    } catch (error) {
      logger.error('获取全局活动统计失败', { error: error.message });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseUtil.customError(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message)
      );
    }
  }

  /**
   * 获取活动统计数据（管理员）
   * @route GET /api/admin/events/:id/statistics
   * @access Private (Admin)
   */
  async getEventStatistics(req, res) {
    try {
      const { id } = req.params;

      logger.info('管理员获取活动统计', { eventId: id });

      const statistics = await eventRepository.getStatistics(id);
      
      if (!statistics) {
        return res.status(StatusCodes.NOT_FOUND).json(
          ResponseUtil.customError(StatusCodes.NOT_FOUND, '活动不存在')
        );
      }

      return res.status(StatusCodes.OK).json(ResponseUtil.success(statistics, '获取活动统计成功'));

    } catch (error) {
      logger.error('获取活动统计失败', { error: error.message, eventId: req.params.id });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseUtil.customError(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message)
      );
    }
  }

  /**
   * 导出活动报名数据（管理员）
   * @route GET /api/admin/events/:id/registrations/export
   * @access Private (Admin)
   */
  async exportEventRegistrations(req, res) {
    try {
      const { id: eventId } = req.params;
      const { baseFields = '', formFields = '' } = req.query;

      logger.info('管理员导出活动报名数据', { eventId, baseFields, formFields });

      // 获取活动信息
      const event = await eventService.getEventById(eventId);

      // 获取所有报名数据
      const registrations = await eventRegistrationRepository.findByEvent(eventId, {
        page: 1,
        limit: 10000 // 获取所有数据
      });

      // 动态导入 exceljs
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('报名数据');

      // 解析要导出的字段
      const baseFieldsArray = baseFields ? baseFields.split(',') : [];
      const formFieldsArray = formFields ? formFields.split(',') : [];

      // 构建表头
      const headers = [];
      const fieldMap = {
        'id': 'ID',
        'username': '用户名',
        'nickname': '昵称',
        'registerTime': '报名时间',
        'status': '状态'
      };

      // 添加基础字段表头
      baseFieldsArray.forEach(field => {
        if (fieldMap[field]) {
          headers.push(fieldMap[field]);
        }
      });

      // 添加表单字段表头
      if (event.form_config && Array.isArray(event.form_config)) {
        formFieldsArray.forEach(fieldName => {
          const fieldConfig = event.form_config.find(config => config.name === fieldName);
          if (fieldConfig) {
            headers.push(fieldConfig.label || fieldName);
          }
        });
      }

      // 添加大标题
      const titleRow = worksheet.addRow([`${event.title} - 报名表`]);
      const titleCell = titleRow.getCell(1);

      // 合并标题行的所有列
      if (headers.length > 1) {
        worksheet.mergeCells(1, 1, 1, headers.length);
      }

      // 设置标题样式：大字体、加粗、居中
      titleCell.font = {
        size: 18,
        bold: true,
        name: '微软雅黑'
      };
      titleCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' } // 深蓝色背景
      };
      titleCell.font.color = { argb: 'FFFFFFFF' }; // 白色字体

      // 设置标题行高度
      titleRow.height = 35;

      // 添加空行分隔
      worksheet.addRow([]);

      // 设置表头
      const headerRow = worksheet.addRow(headers);

      // 设置表头样式：加粗、居中、背景色
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true, name: '微软雅黑' };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E6FA' } // 淡紫色背景
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // 添加数据行
      registrations.registrations.forEach(registration => {
        const row = [];

        // 添加基础字段数据
        baseFieldsArray.forEach(field => {
          switch (field) {
            case 'id':
              row.push(registration.id);
              break;
            case 'username':
              row.push(registration.user?.username || '');
              break;
            case 'nickname':
              row.push(registration.user?.nickname || '');
              break;
            case 'registerTime':
              row.push(registration.registered_at ? new Date(registration.registered_at).toLocaleString('zh-CN') : '');
              break;
            case 'status':
              const statusMap = { 1: '已报名', 0: '已取消' };
              row.push(statusMap[registration.status] || '未知');
              break;
            default:
              row.push('');
          }
        });

        // 添加表单字段数据
        formFieldsArray.forEach(fieldName => {
          const formData = registration.form_data || {};
          row.push(formData[fieldName] || '');
        });

        const dataRow = worksheet.addRow(row);

        // 设置数据行样式：居中对齐、边框、字体
        dataRow.eachCell((cell, colNumber) => {
          cell.font = { name: '微软雅黑' };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // 自动调整列宽
      worksheet.columns.forEach((column, index) => {
        let maxLength = 0;

        // 检查表头长度
        if (headers[index]) {
          maxLength = Math.max(maxLength, headers[index].length);
        }

        // 检查数据行长度
        column.eachCell({ includeEmpty: false }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, cellValue.length);
        });

        // 设置列宽，最小10，最大50，中文字符按2个字符计算
        const chineseCharCount = (headers[index] || '').match(/[\u4e00-\u9fa5]/g)?.length || 0;
        const adjustedLength = maxLength + chineseCharCount * 0.5;
        column.width = Math.max(10, Math.min(50, adjustedLength + 2));
      });

      // 设置响应头
      const fileName = `${event.title}_报名数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);

      // 输出Excel文件
      await workbook.xlsx.write(res);
      res.end();

      logger.info('Excel导出成功', { eventId, fileName, totalCount: registrations.total });

    } catch (error) {
      logger.error('导出活动报名数据失败', { error: error.message, eventId: req.params.id });
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseUtil.customError(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, error.message)
      );
    }
  }
}

module.exports = new AdminEventController();
