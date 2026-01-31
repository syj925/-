const express = require('express');
const router = express.Router();
const auditController = require('../../controllers/admin/audit.controller');

/**
 * @route POST /api/admin/audit/batch
 * @desc 批量审核内容
 * @body {string} targetType - 目标类型 (post, comment, user)
 * @body {Array} items - 审核项列表 [{ id, action, reason }]
 * @access Private (Admin)
 */
router.post('/batch', auditController.batchAudit);

/**
 * @route GET /api/admin/audit/logs
 * @desc 获取审核日志列表
 * @query {number} page - 页码
 * @query {number} pageSize - 每页数量
 * @query {string} adminId - 管理员ID筛选
 * @query {string} targetType - 目标类型筛选
 * @query {string} action - 动作筛选
 * @access Private (Admin)
 */
router.get('/logs', auditController.getAuditLogs);

module.exports = router;
