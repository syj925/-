const { OperationLog, User } = require('../../models');
const { ResponseUtil } = require('../../utils');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../../config/logger');
const { Op } = require('sequelize');

class AdminLogController {
  /**
   * 获取操作日志列表
   */
  async getLogs(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        username,
        startTime,
        endTime
      } = req.query;

      const where = {};

      if (type) {
        where.type = type;
      }

      if (username) {
        where.admin_username = { [Op.like]: `%${username}%` };
      }

      if (startTime && endTime) {
        where.created_at = {
          [Op.between]: [startTime, endTime]
        };
      }

      const offset = (page - 1) * limit;

      const { rows, count } = await OperationLog.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'admin',
            attributes: ['id', 'username', 'nickname']
          }
        ]
      });

      // 格式化数据
      const list = rows.map(log => ({
        id: log.id,
        type: log.type,
        content: log.description,
        user: log.admin_username || (log.admin ? log.admin.username : '未知'),
        ip: log.ip,
        time: log.createdAt || log.created_at,
        data: log.request_body ? JSON.parse(log.request_body) : null
      }));

      res.status(StatusCodes.OK).json(ResponseUtil.page(
        list,
        parseInt(page),
        parseInt(limit),
        count
      ));
    } catch (error) {
      logger.error('获取操作日志失败:', error);
      next(error);
    }
  }
}

module.exports = new AdminLogController();
