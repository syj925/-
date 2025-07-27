const { Op } = require('sequelize');
const { Post, User, Category, Topic, PostImage, Comment } = require('../../models');
const logger = require('../../../config/logger');
const { ErrorMiddleware } = require('../../middlewares');
const errorCodes = require('../../constants/error-codes');
const { StatusCodes } = require('http-status-codes');

/**
 * 管理员帖子服务类
 * 处理帖子管理相关的业务逻辑
 */
class AdminPostService {
  /**
   * 获取帖子列表
   * @param {Object} options 查询选项
   * @param {number} options.page 页码
   * @param {number} options.limit 每页数量
   * @param {string} options.search 搜索关键词
   * @param {string} options.status 状态筛选
   * @param {string} options.userId 用户ID筛选
   * @param {string} options.categoryId 分类ID筛选
   * @returns {Promise<Object>} 帖子列表和分页信息
   */
  async getPostList(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        userId = '',
        categoryId = ''
      } = options;

      // 构建查询条件
      const whereCondition = {};

      // 搜索条件 - 支持内容和标题搜索
      if (search) {
        whereCondition[Op.or] = [
          { content: { [Op.like]: `%${search}%` } },
          { title: { [Op.like]: `%${search}%` } }
        ];
      }

      // 状态筛选
      if (status) {
        whereCondition.status = status;
      }

      // 用户筛选
      if (userId) {
        whereCondition.user_id = userId;
      }

      // 分类筛选
      if (categoryId) {
        whereCondition.category_id = categoryId;
      }

      // 分页计算
      const offset = (page - 1) * limit;

      // 查询帖子列表
      const { rows: posts, count: total } = await Post.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'nickname', 'avatar', 'phone'],
            paranoid: false // 包含软删除的用户
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          },
          {
            model: PostImage,
            as: 'images',
            attributes: ['id', 'url', 'thumbnail_url']
          },
          {
            model: Topic,
            as: 'topics',
            attributes: ['id', 'name'],
            through: { attributes: [] }
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [
          ['is_top', 'DESC'], // 置顶帖子优先
          ['created_at', 'DESC'] // 按创建时间倒序
        ],
        paranoid: false // 包含软删除的帖子
      });

      // 格式化返回数据，确保字段名兼容
      const formattedPosts = posts.map(post => {
        const postData = post.toJSON();
        return {
          ...postData,
          // 字段名兼容处理
          createdAt: postData.createdAt || postData.created_at,
          updatedAt: postData.updatedAt || postData.updated_at,
          isRecommended: postData.is_recommended,
          isTop: postData.is_top,
          isAnonymous: postData.is_anonymous,
          viewCount: postData.view_count,
          likeCount: postData.like_count,
          commentCount: postData.comment_count,
          favoriteCount: postData.favorite_count,
          // 兼容前端期望的字段名
          views: postData.view_count,
          likes: postData.like_count,
          // 作者信息处理
          author: postData.author ? {
            ...postData.author,
            // 匿名处理
            nickname: postData.is_anonymous ? '匿名用户' : (postData.author.nickname || postData.author.username),
            username: postData.is_anonymous ? '匿名用户' : postData.author.username,
            avatar: postData.is_anonymous ? null : postData.author.avatar
          } : null
        };
      });

      return {
        posts: formattedPosts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('获取帖子列表失败:', error);
      throw ErrorMiddleware.createError(
        '获取帖子列表失败',
        StatusCodes.INTERNAL_SERVER_ERROR,
        errorCodes.SERVER_ERROR
      );
    }
  }

  /**
   * 获取待审核帖子列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 待审核帖子列表
   */
  async getPendingPosts(options = {}) {
    try {
      const { page = 1, limit = 10 } = options;

      return await this.getPostList({
        ...options,
        status: 'pending'
      });
    } catch (error) {
      logger.error('获取待审核帖子列表失败:', error);
      throw ErrorMiddleware.createError(
        '获取待审核帖子列表失败',
        StatusCodes.INTERNAL_SERVER_ERROR,
        errorCodes.SERVER_ERROR
      );
    }
  }

  /**
   * 获取帖子详情
   * @param {string} postId 帖子ID
   * @returns {Promise<Object>} 帖子详情
   */
  async getPostById(postId) {
    try {
      const post = await Post.findByPk(postId, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'nickname', 'avatar', 'phone'],
            paranoid: false
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          },
          {
            model: PostImage,
            as: 'images',
            attributes: ['id', 'url', 'thumbnail_url']
          },
          {
            model: Topic,
            as: 'topics',
            attributes: ['id', 'name'],
            through: { attributes: [] }
          }
        ],
        paranoid: false
      });

      if (!post) {
        throw ErrorMiddleware.createError(
          '帖子不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.POST_NOT_EXIST
        );
      }

      // 格式化返回数据
      const postData = post.toJSON();
      return {
        ...postData,
        createdAt: postData.created_at,
        updatedAt: postData.updated_at,
        isRecommended: postData.is_recommended,
        isTop: postData.is_top,
        isAnonymous: postData.is_anonymous,
        viewCount: postData.view_count,
        likeCount: postData.like_count,
        commentCount: postData.comment_count,
        favoriteCount: postData.favorite_count,
        views: postData.view_count,
        likes: postData.like_count
      };
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('获取帖子详情失败:', error);
      throw ErrorMiddleware.createError(
        '获取帖子详情失败',
        StatusCodes.INTERNAL_SERVER_ERROR,
        errorCodes.SERVER_ERROR
      );
    }
  }

  /**
   * 更新帖子
   * @param {string} postId 帖子ID
   * @param {Object} updateData 更新数据
   * @returns {Promise<Object>} 更新后的帖子信息
   */
  async updatePost(postId, updateData) {
    try {
      const post = await Post.findByPk(postId, { paranoid: false });

      if (!post) {
        throw ErrorMiddleware.createError(
          '帖子不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.POST_NOT_EXIST
        );
      }

      // 构建更新数据
      const updateFields = {};

      // 允许更新的字段
      const allowedFields = ['title', 'content', 'status', 'category_id', 'is_top', 'is_recommended'];
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      }

      // 兼容前端字段名
      if (updateData.isRecommended !== undefined) {
        updateFields.is_recommended = updateData.isRecommended;
      }
      if (updateData.isTop !== undefined) {
        updateFields.is_top = updateData.isTop;
      }
      if (updateData.categoryId !== undefined) {
        updateFields.category_id = updateData.categoryId;
      }

      // 执行更新
      await post.update(updateFields);

      logger.info('帖子更新成功', { postId, updateFields });

      return await this.getPostById(postId);
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('更新帖子失败:', error);
      throw ErrorMiddleware.createError(
        '更新帖子失败',
        StatusCodes.INTERNAL_SERVER_ERROR,
        errorCodes.SERVER_ERROR
      );
    }
  }

  /**
   * 删除帖子（软删除）
   * @param {string} postId 帖子ID
   * @returns {Promise<void>}
   */
  async deletePost(postId) {
    try {
      const post = await Post.findByPk(postId);

      if (!post) {
        throw ErrorMiddleware.createError('帖子不存在', StatusCodes.NOT_FOUND, errorCodes.POST_NOT_EXIST);
      }

      // 软删除帖子
      await post.destroy();

      logger.info('帖子删除成功', { postId });
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('删除帖子失败:', error);
      throw ErrorMiddleware.createError('删除帖子失败', StatusCodes.INTERNAL_SERVER_ERROR, errorCodes.SERVER_ERROR);
    }
  }

  /**
   * 审核帖子
   * @param {string} postId 帖子ID
   * @param {string} action 审核动作 ('approve' | 'reject')
   * @param {string} reason 拒绝原因（可选）
   * @returns {Promise<Object>} 审核后的帖子信息
   */
  async auditPost(postId, action, reason = null) {
    try {
      const post = await Post.findByPk(postId, { paranoid: false });

      if (!post) {
        throw ErrorMiddleware.createError('帖子不存在', StatusCodes.NOT_FOUND, errorCodes.POST_NOT_EXIST);
      }

      // 检查帖子状态
      if (post.status !== 'pending') {
        throw ErrorMiddleware.createError('该帖子不在待审核状态', StatusCodes.BAD_REQUEST, errorCodes.INVALID_OPERATION);
      }

      let newStatus;
      let message;

      if (action === 'approve') {
        newStatus = 'published';
        message = '帖子审核通过';
      } else if (action === 'reject') {
        newStatus = 'rejected';
        message = '帖子审核被拒绝';
      } else {
        throw ErrorMiddleware.createError('无效的审核动作', StatusCodes.BAD_REQUEST, errorCodes.PARAM_ERROR);
      }

      // 更新帖子状态
      await post.update({ status: newStatus });

      logger.info('帖子审核完成', { postId, action, newStatus, reason });

      return {
        id: post.id,
        status: newStatus,
        message,
        reason
      };
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('审核帖子失败:', error);
      throw ErrorMiddleware.createError('审核帖子失败', StatusCodes.INTERNAL_SERVER_ERROR, errorCodes.SERVER_ERROR);
    }
  }

  /**
   * 设置/取消推荐帖子
   * @param {string} postId 帖子ID
   * @param {boolean} isRecommended 是否推荐
   * @returns {Promise<Object>} 更新后的推荐状态
   */
  async setRecommendStatus(postId, isRecommended) {
    try {
      const post = await Post.findByPk(postId, { paranoid: false });

      if (!post) {
        throw ErrorMiddleware.createError('帖子不存在', StatusCodes.NOT_FOUND, errorCodes.POST_NOT_EXIST);
      }

      // 更新推荐状态
      await post.update({ is_recommended: !!isRecommended });

      const message = isRecommended ? '帖子已设为推荐' : '帖子已取消推荐';

      logger.info('帖子推荐状态更新', { postId, isRecommended });

      return {
        id: post.id,
        isRecommended: post.is_recommended,
        message
      };
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('设置帖子推荐状态失败:', error);
      throw ErrorMiddleware.createError('设置帖子推荐状态失败', StatusCodes.INTERNAL_SERVER_ERROR, errorCodes.SERVER_ERROR);
    }
  }

  /**
   * 设置/取消置顶帖子
   * @param {string} postId 帖子ID
   * @param {boolean} isTop 是否置顶
   * @returns {Promise<Object>} 更新后的置顶状态
   */
  async setTopStatus(postId, isTop) {
    try {
      const post = await Post.findByPk(postId, { paranoid: false });

      if (!post) {
        throw ErrorMiddleware.createError('帖子不存在', StatusCodes.NOT_FOUND, errorCodes.POST_NOT_EXIST);
      }

      // 如果要置顶，需要更新状态为pinned；如果取消置顶，恢复为published
      const newStatus = isTop ? 'pinned' : 'published';

      // 更新置顶状态和帖子状态
      await post.update({
        is_top: !!isTop,
        status: newStatus
      });

      const message = isTop ? '帖子已置顶' : '帖子已取消置顶';

      logger.info('帖子置顶状态更新', { postId, isTop, newStatus });

      return {
        id: post.id,
        isTop: post.is_top,
        status: post.status,
        message
      };
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('设置帖子置顶状态失败:', error);
      throw ErrorMiddleware.createError('设置帖子置顶状态失败', StatusCodes.INTERNAL_SERVER_ERROR, errorCodes.SERVER_ERROR);
    }
  }
}

module.exports = new AdminPostService();
