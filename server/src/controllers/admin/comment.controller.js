const { StatusCodes } = require('http-status-codes');
const adminCommentService = require('../../services/admin/comment.service');
const { ResponseUtil } = require('../../utils');
const logger = require('../../../config/logger');

/**
 * 管理员评论控制器
 * 处理评论管理相关的HTTP请求
 */
class AdminCommentController {
  /**
   * 获取评论列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getCommentList(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        postId = '',
        userId = ''
      } = req.query;

      logger.info('管理员获取评论列表', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        params: { page, limit, search, status, postId, userId }
      });

      const result = await adminCommentService.getCommentList({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        postId,
        userId
      });

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(result, '获取评论列表成功')
      );
    } catch (error) {
      logger.error('获取评论列表失败:', error?.message || error || 'Unknown error');
      next(error || new Error('获取评论列表失败'));
    }
  }

  /**
   * 获取待审核评论列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getPendingComments(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;

      logger.info('管理员获取待审核评论列表', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        params: { page, limit }
      });

      const result = await adminCommentService.getPendingComments({
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(result, '获取待审核评论列表成功')
      );
    } catch (error) {
      logger.error('获取待审核评论列表失败:', error?.message || error || 'Unknown error');
      next(error || new Error('获取待审核评论列表失败'));
    }
  }

  /**
   * 获取评论详情
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getCommentDetail(req, res, next) {
    try {
      const { id } = req.params;

      logger.info('管理员获取评论详情', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        commentId: id
      });

      const comment = await adminCommentService.getCommentById(id);

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(comment, '获取评论详情成功')
      );
    } catch (error) {
      logger.error('获取评论详情失败:', error?.message || error || 'Unknown error');
      next(error || new Error('获取评论详情失败'));
    }
  }

  /**
   * 更新评论
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async updateComment(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      logger.info('管理员更新评论', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        commentId: id,
        updateData
      });

      const updatedComment = await adminCommentService.updateComment(id, updateData);

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(updatedComment, '更新评论成功')
      );
    } catch (error) {
      logger.error('更新评论失败:', error?.message || error || 'Unknown error');
      next(error || new Error('更新评论失败'));
    }
  }

  /**
   * 删除评论
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async deleteComment(req, res, next) {
    try {
      const { id } = req.params;

      logger.info('管理员删除评论', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        commentId: id
      });

      await adminCommentService.deleteComment(id);

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(null, '删除评论成功')
      );
    } catch (error) {
      logger.error('删除评论失败:', error?.message || error || 'Unknown error');
      next(error || new Error('删除评论失败'));
    }
  }

  /**
   * 审核评论
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async auditComment(req, res, next) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;

      logger.info('管理员审核评论', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        commentId: id,
        action,
        reason
      });

      const result = await adminCommentService.auditComment(id, action, reason, req.admin.id, req.ip);

      logger.info('审核评论成功', { commentId: id, action, result });

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(result, result.message)
      );
    } catch (error) {
      logger.error('审核评论失败:', {
        error: error.message,
        stack: error.stack,
        commentId: req.params?.id,
        action: req.body?.action
      });
      next(error);
    }
  }
}

module.exports = new AdminCommentController();
