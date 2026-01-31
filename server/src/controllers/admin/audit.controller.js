const auditService = require('../../services/admin/audit.service');
const { ResponseUtil } = require('../../utils');
const { StatusCodes } = require('http-status-codes');

class AuditController {
  /**
   * 批量审核
   */
  async batchAudit(req, res, next) {
    try {
      const { targetType, items } = req.body;
      const adminId = req.user.id;
      const ipAddress = req.ip;

      if (!targetType || !items || !Array.isArray(items)) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('参数错误')
        );
      }

      const result = await auditService.batchAudit(adminId, targetType, items, ipAddress);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取审核日志列表
   */
  async getAuditLogs(req, res, next) {
    try {
      const result = await auditService.getAuditLogs(req.query);
      
      res.status(StatusCodes.OK).json(ResponseUtil.page(
        result.rows,
        req.query.page || 1,
        req.query.pageSize || 20,
        result.count
      ));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditController();
