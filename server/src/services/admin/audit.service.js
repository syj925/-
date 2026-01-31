const { AuditLog, Post, Comment, User, sequelize } = require('../../models');
const { StatusCodes } = require('http-status-codes');
const errorCodes = require('../../constants/error-codes');
const logger = require('../../../config/logger');
const { ErrorMiddleware } = require('../../middlewares');

class AuditService {
  /**
   * 创建审核日志
   * @param {Object} data 日志数据
   * @param {Object} transaction 事务对象
   */
  async createLog(data, transaction) {
    return await AuditLog.create(data, { transaction });
  }

  /**
   * 批量审核内容
   * @param {String} adminId 管理员ID
   * @param {String} targetType 目标类型 (post, comment, user)
   * @param {Array} items 审核项列表 [{ id, action, reason }]
   * @param {String} ipAddress 操作IP
   */
  async batchAudit(adminId, targetType, items, ipAddress) {
    const t = await sequelize.transaction();

    try {
      const results = {
        success: [],
        failed: []
      };

      for (const item of items) {
        const { id, action, reason } = item;
        
        try {
          // 1. 获取目标模型
          let Model;
          let updateData = {};
          
          if (targetType === 'post') {
            Model = Post;
            if (action === 'approve') updateData = { status: 'published' };
            if (action === 'reject') updateData = { status: 'rejected' };
            if (action === 'delete') updateData = { status: 'deleted' }; // 或者是软删除
          } else if (targetType === 'comment') {
            Model = Comment;
            if (action === 'approve') updateData = { status: 'normal' };
            if (action === 'reject') updateData = { status: 'hidden' }; // 评论通常隐藏
            if (action === 'delete') updateData = { status: 'deleted' };
          } else if (targetType === 'user') {
            Model = User;
            if (action === 'ban') updateData = { status: 'banned', is_disabled: true };
            if (action === 'unban') updateData = { status: 'active', is_disabled: false };
          } else {
            throw new Error('未知的目标类型');
          }

          // 2. 更新状态
          const target = await Model.findByPk(id, { transaction: t });
          if (!target) {
            throw new Error('目标不存在');
          }

          await target.update(updateData, { transaction: t });

          // 3. 记录日志
          await this.createLog({
            admin_id: adminId,
            target_type: targetType,
            target_id: id,
            action,
            reason,
            ip_address: ipAddress
          }, t);

          results.success.push(id);
        } catch (error) {
          logger.error(`审核失败 ID: ${id}`, error);
          results.failed.push({ id, error: error.message });
        }
      }

      await t.commit();
      return results;
    } catch (error) {
      await t.rollback();
      logger.error('批量审核事务失败', error);
      throw error;
    }
  }

  /**
   * 获取审核日志列表
   * @param {Object} options 查询参数
   */
  async getAuditLogs(options) {
    const { page = 1, pageSize = 20, adminId, targetType, action } = options;
    const offset = (page - 1) * pageSize;
    const where = {};

    if (adminId) where.admin_id = adminId;
    if (targetType) where.target_type = targetType;
    if (action) where.action = action;

    return await AuditLog.findAndCountAll({
      where,
      limit: parseInt(pageSize),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    });
  }
}

module.exports = new AuditService();
