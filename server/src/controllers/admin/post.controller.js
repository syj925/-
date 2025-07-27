const { StatusCodes } = require('http-status-codes');
const adminPostService = require('../../services/admin/post.service');
const { ResponseUtil } = require('../../utils');
const logger = require('../../../config/logger');

/**
 * 管理员帖子控制器
 * 处理帖子管理相关的HTTP请求
 */
class AdminPostController {
  /**
   * 获取帖子列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getPostList(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        userId = '',
        categoryId = ''
      } = req.query;

      logger.info('管理员获取帖子列表', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        params: { page, limit, search, status, userId, categoryId }
      });

      const result = await adminPostService.getPostList({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        userId,
        categoryId
      });

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(result, '获取帖子列表成功')
      );
    } catch (error) {
      logger.error('获取帖子列表失败:', error?.message || error || 'Unknown error');
      next(error || new Error('获取帖子列表失败'));
    }
  }

  /**
   * 获取待审核帖子列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getPendingPosts(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;

      logger.info('管理员获取待审核帖子列表', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        params: { page, limit }
      });

      const result = await adminPostService.getPendingPosts({
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(result, '获取待审核帖子列表成功')
      );
    } catch (error) {
      logger.error('获取待审核帖子列表失败:', error?.message || error || 'Unknown error');
      next(error || new Error('获取待审核帖子列表失败'));
    }
  }

  /**
   * 获取帖子详情
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getPostDetail(req, res, next) {
    try {
      const { id } = req.params;

      logger.info('管理员获取帖子详情', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        postId: id
      });

      const post = await adminPostService.getPostById(id);

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(post, '获取帖子详情成功')
      );
    } catch (error) {
      logger.error('获取帖子详情失败:', error);
      next(error);
    }
  }

  /**
   * 更新帖子
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async updatePost(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      logger.info('管理员更新帖子', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        postId: id,
        updateData
      });

      const updatedPost = await adminPostService.updatePost(id, updateData);

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(updatedPost, '更新帖子成功')
      );
    } catch (error) {
      logger.error('更新帖子失败:', error);
      next(error);
    }
  }

  /**
   * 删除帖子
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async deletePost(req, res, next) {
    try {
      const { id } = req.params;

      logger.info('管理员删除帖子', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        postId: id
      });

      await adminPostService.deletePost(id);

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(null, '删除帖子成功')
      );
    } catch (error) {
      logger.error('删除帖子失败:', error);
      next(error);
    }
  }

  /**
   * 审核帖子
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async auditPost(req, res, next) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;

      logger.info('管理员审核帖子请求', {
        adminId: req.admin?.id,
        adminUsername: req.admin?.username,
        postId: id,
        action,
        reason,
        body: req.body,
        params: req.params
      });

      // 验证必要参数
      if (!id) {
        throw new Error('帖子ID不能为空');
      }
      if (!action || !['approve', 'reject'].includes(action)) {
        throw new Error('无效的审核动作');
      }

      const result = await adminPostService.auditPost(id, action, reason);

      logger.info('审核帖子成功', { postId: id, action, result });

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(result, result.message)
      );
    } catch (error) {
      logger.error('审核帖子失败:', {
        error: error.message,
        stack: error.stack,
        postId: req.params?.id,
        action: req.body?.action
      });
      next(error);
    }
  }

  /**
   * 设置/取消推荐帖子
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async setRecommendStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isRecommended } = req.body;

      logger.info('管理员设置帖子推荐状态', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        postId: id,
        isRecommended
      });

      const result = await adminPostService.setRecommendStatus(id, isRecommended);

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(result, result.message)
      );
    } catch (error) {
      logger.error('设置帖子推荐状态失败:', error);
      next(error);
    }
  }

  /**
   * 设置/取消置顶帖子
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async setTopStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isTop } = req.body;

      logger.info('管理员设置帖子置顶状态', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        postId: id,
        isTop
      });

      const result = await adminPostService.setTopStatus(id, isTop);

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(result, result.message)
      );
    } catch (error) {
      logger.error('设置帖子置顶状态失败:', error);
      next(error);
    }
  }
}

module.exports = new AdminPostController();
