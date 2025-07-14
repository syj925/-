const commentService = require('../services/comment.service');
const { ResponseUtil } = require('../utils');
const { StatusCodes } = require('http-status-codes');

/**
 * 评论控制器
 */
class CommentController {
  /**
   * 创建评论
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async createComment(req, res, next) {
    try {
      const userId = req.user.id;
      const { post_id, content, reply_to } = req.body;

      // 后端根据用户设置决定是否匿名，不信任前端传递的 is_anonymous
      const comment = await commentService.createComment({
        user_id: userId,
        post_id,
        content,
        reply_to: reply_to || null
      });

      res.status(StatusCodes.CREATED).json(ResponseUtil.success(comment));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取评论详情
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getCommentById(req, res, next) {
    try {
      const { id } = req.params;
      
      const comment = await commentService.getCommentById(id);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(comment));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新评论
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async updateComment(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { content } = req.body;
      
      const comment = await commentService.updateComment(id, { content }, userId);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(comment));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除评论
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async deleteComment(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const result = await commentService.deleteComment(id, userId);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取帖子评论列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getPostComments(req, res, next) {
    try {
      const { postId } = req.params;
      const { page = 1, pageSize = 20 } = req.query;
      const currentUserId = req.user ? req.user.id : null;
      
      const result = await commentService.getPostComments(
        postId,
        parseInt(page, 10),
        parseInt(pageSize, 10),
        currentUserId
      );
      
      res.status(StatusCodes.OK).json(ResponseUtil.page(
        result.list,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取评论的多级回复树
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getCommentRepliesTree(req, res, next) {
    try {
      const { id } = req.params;
      const { maxLevel = 3 } = req.query;

      const repliesTree = await commentService.getCommentRepliesTree(id, parseInt(maxLevel, 10));

      res.status(StatusCodes.OK).json(ResponseUtil.success(repliesTree));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取评论的直接回复
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getCommentDirectReplies(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, pageSize = 10 } = req.query;

      const replies = await commentService.getCommentDirectReplies(
        id,
        parseInt(page, 10),
        parseInt(pageSize, 10)
      );

      res.status(StatusCodes.OK).json(ResponseUtil.success(replies));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取评论回复列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getCommentReplies(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, pageSize = 20 } = req.query;
      const currentUserId = req.user ? req.user.id : null;
      
      const result = await commentService.getCommentReplies(
        id,
        parseInt(page, 10),
        parseInt(pageSize, 10),
        currentUserId
      );
      
      res.status(StatusCodes.OK).json(ResponseUtil.page(
        result.list,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户评论列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUserComments(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, pageSize = 20 } = req.query;

      const result = await commentService.getUserComments(
        userId,
        parseInt(page, 10),
        parseInt(pageSize, 10)
      );

      res.status(StatusCodes.OK).json(ResponseUtil.page(
        result.list,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total
      ));
    } catch (error) {
      next(error);
    }
  }


}

module.exports = new CommentController(); 