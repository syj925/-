const { Op } = require('sequelize');
const { Comment, User, Post } = require('../../models');
const logger = require('../../../config/logger');
const { ErrorMiddleware } = require('../../middlewares');
const errorCodes = require('../../constants/error-codes');
const { StatusCodes } = require('http-status-codes');

/**
 * 管理员评论服务类
 * 处理评论管理相关的业务逻辑
 */
class AdminCommentService {
  /**
   * 获取评论列表
   * @param {Object} options 查询选项
   * @param {number} options.page 页码
   * @param {number} options.limit 每页数量
   * @param {string} options.search 搜索关键词
   * @param {string} options.status 状态筛选
   * @param {string} options.postId 帖子ID筛选
   * @param {string} options.userId 用户ID筛选
   * @returns {Promise<Object>} 评论列表和分页信息
   */
  async getCommentList(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        postId = '',
        userId = ''
      } = options;

      // 构建查询条件
      const whereCondition = {};

      // 搜索条件 - 支持评论内容搜索
      if (search) {
        whereCondition.content = { [Op.like]: `%${search}%` };
      }

      // 状态筛选
      if (status) {
        whereCondition.status = status;
      }

      // 帖子筛选
      if (postId) {
        whereCondition.post_id = postId;
      }

      // 用户筛选
      if (userId) {
        whereCondition.user_id = userId;
      }

      // 分页计算
      const offset = (page - 1) * limit;

      // 查询评论列表
      const { rows: comments, count: total } = await Comment.findAndCountAll({
        where: whereCondition,
        attributes: [
          'id', 'content', 'user_id', 'post_id', 'reply_to', 'root_comment_id',
          'reply_level', 'reply_count', 'mentioned_users', 'like_count', 'status',
          'is_anonymous', 'created_at', 'updated_at', 'deleted_at'
        ],
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'nickname', 'avatar', 'phone'],
            paranoid: false // 包含软删除的用户
          },
          {
            model: Post,
            as: 'post',
            attributes: ['id', 'title', 'content'],
            paranoid: false // 包含软删除的帖子
          },

        ],
        limit: parseInt(limit),
        offset: offset,
        order: [['created_at', 'DESC']],
        paranoid: false // 包含软删除的评论
      });

      // 格式化返回数据，确保字段名兼容
      const formattedComments = comments.map(comment => {
        const commentData = comment.toJSON();
        return {
          ...commentData,
          // 字段名兼容处理
          createdAt: commentData.created_at,
          updatedAt: commentData.updated_at,
          isAnonymous: commentData.is_anonymous,
          likeCount: commentData.like_count,
          replyCount: commentData.reply_count,
          replyLevel: commentData.reply_level,
          mentionedUsers: commentData.mentioned_users,
          // 作者信息处理
          author: commentData.author ? {
            ...commentData.author,
            // 匿名处理
            nickname: commentData.is_anonymous ? '匿名用户' : (commentData.author.nickname || commentData.author.username),
            username: commentData.is_anonymous ? '匿名用户' : commentData.author.username,
            avatar: commentData.is_anonymous ? null : commentData.author.avatar
          } : null,
          // 兼容前端期望的字段名
          user: commentData.author
        };
      });

      return {
        comments: formattedComments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('获取评论列表失败:', error);
      throw ErrorMiddleware.createError('获取评论列表失败', StatusCodes.INTERNAL_SERVER_ERROR, errorCodes.SERVER_ERROR);
    }
  }

  /**
   * 获取待审核评论列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 待审核评论列表
   */
  async getPendingComments(options = {}) {
    try {
      const { page = 1, limit = 10 } = options;

      return await this.getCommentList({
        ...options,
        status: 'pending'
      });
    } catch (error) {
      logger.error('获取待审核评论列表失败:', error);
      throw ErrorMiddleware.createError('获取待审核评论列表失败', StatusCodes.INTERNAL_SERVER_ERROR, errorCodes.SERVER_ERROR);
    }
  }

  /**
   * 获取评论详情
   * @param {string} commentId 评论ID
   * @returns {Promise<Object>} 评论详情
   */
  async getCommentById(commentId) {
    try {
      const comment = await Comment.findByPk(commentId, {
        attributes: [
          'id', 'content', 'user_id', 'post_id', 'reply_to', 'root_comment_id',
          'reply_level', 'reply_count', 'mentioned_users', 'like_count', 'status',
          'is_anonymous', 'created_at', 'updated_at', 'deleted_at'
        ],
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'nickname', 'avatar', 'phone'],
            paranoid: false
          },
          {
            model: Post,
            as: 'post',
            attributes: ['id', 'title', 'content'],
            paranoid: false
          },
          {
            model: Comment,
            as: 'parentComment',
            attributes: ['id', 'content', 'user_id', 'created_at'],
            include: [
              {
                model: User,
                as: 'author',
                attributes: ['id', 'username', 'nickname'],
                paranoid: false
              }
            ]
          }
        ],
        paranoid: false
      });

      if (!comment) {
        throw new AppError('评论不存在', StatusCodes.NOT_FOUND);
      }

      // 格式化返回数据
      const commentData = comment.toJSON();
      return {
        ...commentData,
        createdAt: commentData.created_at,
        updatedAt: commentData.updated_at,
        isAnonymous: commentData.is_anonymous,
        likeCount: commentData.like_count,
        replyCount: commentData.reply_count,
        replyLevel: commentData.reply_level,
        mentionedUsers: commentData.mentioned_users
      };
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('获取评论详情失败:', error);
      throw ErrorMiddleware.createError('获取评论详情失败', StatusCodes.INTERNAL_SERVER_ERROR, errorCodes.SERVER_ERROR);
    }
  }

  /**
   * 更新评论
   * @param {string} commentId 评论ID
   * @param {Object} updateData 更新数据
   * @returns {Promise<Object>} 更新后的评论信息
   */
  async updateComment(commentId, updateData) {
    try {
      const comment = await Comment.findByPk(commentId, { paranoid: false });

      if (!comment) {
        throw new AppError('评论不存在', StatusCodes.NOT_FOUND);
      }

      // 构建更新数据
      const updateFields = {};

      // 允许更新的字段
      const allowedFields = ['content', 'status'];
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      }

      // 执行更新
      await comment.update(updateFields);

      logger.info('评论更新成功', { commentId, updateFields });

      return await this.getCommentById(commentId);
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('更新评论失败:', error);
      throw ErrorMiddleware.createError('更新评论失败', StatusCodes.INTERNAL_SERVER_ERROR, errorCodes.SERVER_ERROR);
    }
  }

  /**
   * 删除评论（软删除）
   * @param {string} commentId 评论ID
   * @returns {Promise<void>}
   */
  async deleteComment(commentId) {
    try {
      const comment = await Comment.findByPk(commentId);

      if (!comment) {
        throw new AppError('评论不存在', StatusCodes.NOT_FOUND);
      }

      // 软删除评论
      await comment.destroy();

      logger.info('评论删除成功', { commentId });
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('删除评论失败:', error);
      throw ErrorMiddleware.createError('删除评论失败', StatusCodes.INTERNAL_SERVER_ERROR, errorCodes.SERVER_ERROR);
    }
  }

  /**
   * 审核评论
   * @param {string} commentId 评论ID
   * @param {string} action 审核动作 ('approve' | 'reject')
   * @param {string} reason 拒绝原因（可选）
   * @returns {Promise<Object>} 审核后的评论信息
   */
  async auditComment(commentId, action, reason = null) {
    try {
      const comment = await Comment.findByPk(commentId, { paranoid: false });

      if (!comment) {
        throw ErrorMiddleware.createError('评论不存在', StatusCodes.NOT_FOUND, errorCodes.COMMENT_NOT_EXIST);
      }

      // 检查评论状态
      if (comment.status !== 'pending') {
        throw ErrorMiddleware.createError('该评论不在待审核状态', StatusCodes.BAD_REQUEST, errorCodes.INVALID_OPERATION);
      }

      let newStatus;
      let message;

      if (action === 'approve') {
        newStatus = 'normal';
        message = '评论审核通过';
      } else if (action === 'reject') {
        newStatus = 'rejected';
        message = '评论审核被拒绝';
      } else {
        throw ErrorMiddleware.createError('无效的审核动作', StatusCodes.BAD_REQUEST, errorCodes.PARAM_ERROR);
      }

      // 更新评论状态
      await comment.update({ status: newStatus });

      logger.info('评论审核完成', { commentId, action, newStatus, reason });

      return {
        id: comment.id,
        status: newStatus,
        message,
        reason
      };
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('审核评论失败:', error);
      throw ErrorMiddleware.createError('审核评论失败', StatusCodes.INTERNAL_SERVER_ERROR, errorCodes.SERVER_ERROR);
    }
  }
}

module.exports = new AdminCommentService();
