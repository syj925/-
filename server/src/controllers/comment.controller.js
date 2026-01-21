const commentService = require('../services/comment.service');
const { ResponseUtil } = require('../utils');
const JsonUtil = require('../utils/json.util');
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

      // 获取审核设置
      const configManager = require('../utils/config-manager');
      const settings = await configManager.getAuditSettings();



      // 确定评论状态
      let commentStatus = 'normal'; // 默认正常状态

      // 1. 检查是否开启强制人工审核
      if (settings.forceManualAudit) {
        commentStatus = 'pending';
      } else {
        // 2. 检查拒绝关键词 - 匹配的内容进入待审核而不是直接拒绝
        if (settings.autoRejectKeywords) {
          const rejectWords = settings.autoRejectKeywords.split(',').map(w => w.trim()).filter(w => w);
          const hasRejectWords = rejectWords.some(word =>
            content.toLowerCase().includes(word.toLowerCase())
          );

          if (hasRejectWords) {
            commentStatus = 'pending';
          }
        }

        // 3. 检查自动通过关键词（只有在没有匹配拒绝关键词时才生效）
        if (commentStatus !== 'pending' && settings.autoApproveKeywords) {
          const approveWords = settings.autoApproveKeywords.split(',').map(w => w.trim()).filter(w => w);
          const hasApproveWords = approveWords.some(word =>
            content.toLowerCase().includes(word.toLowerCase())
          );

          if (hasApproveWords) {
            commentStatus = 'normal';
          } else if (settings.enableSmartAudit) {
            // 4. 智能审核模式：未匹配关键词的内容进入审核
            commentStatus = 'pending';
          }
        }
      }

      // 后端根据用户设置决定是否匿名，不信任前端传递的 is_anonymous
      const comment = await commentService.createComment({
        user_id: userId,
        post_id,
        content,
        reply_to: reply_to || null,
        status: commentStatus
      });

      // 根据评论状态返回不同的消息
      let message = '评论发布成功';
      let needsAudit = false;

      if (comment.status === 'pending') {
        message = '评论已提交，等待管理员审核';
        needsAudit = true;
      }

      // 创建安全的返回数据，避免循环引用
      const safeCommentData = JsonUtil.createSafeResponseData(comment);
      const responseData = {
        ...safeCommentData,
        needsAudit,
        auditMessage: needsAudit ? '您的评论正在审核中，审核通过后将会显示' : null
      };

      res.status(StatusCodes.CREATED).json(ResponseUtil.success(responseData, message));
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
      const { page = 1, pageSize = 20, sort = 'latest' } = req.query;
      const currentUserId = req.user ? req.user.id : null;

      const result = await commentService.getPostComments(
        postId,
        parseInt(page, 10),
        parseInt(pageSize, 10),
        currentUserId,
        sort
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

  /**
   * 获取用户评论审核记录
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUserCommentAuditHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, pageSize = 10, status } = req.query;

      const options = {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        userId,
        auditStatus: status, // pending, rejected, normal
        orderBy: 'createdAt',
        orderDirection: 'DESC',
        includeDetails: true
      };

      const result = await commentService.getUserCommentAuditHistory(options);

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