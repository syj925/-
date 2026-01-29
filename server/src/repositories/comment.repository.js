const { Comment, User, Post, Like, sequelize } = require('../models');
const { Op } = require('sequelize');
const redisClient = require('../utils/redis-client');

/**
 * 评论数据访问层
 */
class CommentRepository {
  /**
   * 创建评论
   * @param {Object} commentData 评论数据
   * @returns {Promise<Object>} 创建的评论对象
   */
  async create(commentData) {
    const comment = await Comment.create(commentData);

    return comment;
  }

  /**
   * 创建回复评论（增强方法）
   * @param {Object} commentData 评论数据
   * @returns {Promise<Object>} 创建的评论对象
   */
  async createReply(commentData) {
    const comment = await Comment.create(commentData);

    
    // 更新父评论的回复数量
    if (comment.reply_to) {
      await this.incrementReplyCount(comment.reply_to);
    }
    
    return comment;
  }

  /**
   * 增加评论的回复数量
   * @param {String} commentId 评论ID
   */
  async incrementReplyCount(commentId) {
    await Comment.increment('reply_count', {
      where: { id: commentId }
    });
  }

  /**
   * 根据ID查找评论
   * @param {String} id 评论ID
   * @returns {Promise<Object>} 评论对象
   */
  async findById(id) {
    return await Comment.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    });
  }

  /**
   * 更新评论信息
   * @param {String} id 评论ID
   * @param {Object} commentData 评论数据
   * @returns {Promise<Object>} 更新后的评论对象
   */
  async update(id, commentData) {
    const comment = await Comment.findByPk(id);
    if (!comment) return null;
    
    await comment.update(commentData);
    return comment;
  }

  /**
   * 删除评论（软删除）
   * @param {String} id 评论ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async delete(id) {
    const result = await Comment.update(
      { status: 'deleted' },
      { where: { id } }
    );
    
    return result[0] > 0;
  }

  /**
   * 物理删除评论
   * @param {String} id 评论ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async hardDelete(id) {
    const result = await Comment.destroy({ where: { id } });
    return result > 0;
  }

  /**
   * 获取帖子的评论列表
   * @param {String} postId 帖子ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @param {String} sort 排序方式：latest, hot, most_liked
   * @returns {Promise<Object>} 分页结果
   */
  async findByPostId(postId, page = 1, pageSize = 20, sort = 'latest') {
    // 构建排序条件
    let order;
    switch (sort) {
      case 'hot':
        // 热门排序：使用热度分数算法
        order = [
          [
            sequelize.literal(`(
              0.7 * LOG(Comment.like_count + 1) +
              0.3 * EXP(-0.1 * TIMESTAMPDIFF(HOUR, Comment.created_at, NOW()))
            )`),
            'DESC'
          ],
          [sequelize.col('Comment.created_at'), 'DESC']
        ];
        break;
      case 'most_liked':
        // 点赞最多排序
        order = [[sequelize.col('Comment.like_count'), 'DESC'], [sequelize.col('Comment.created_at'), 'DESC']];
        break;
      case 'latest':
      default:
        // 最新排序（默认）
        order = [[sequelize.col('Comment.created_at'), 'DESC']];
        break;
    }

    const { rows, count } = await Comment.findAndCountAll({
      where: {
        post_id: postId,
        reply_to: null, // 只查询顶级评论
        status: 'normal'
      },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order,
      attributes: [
        'id', 'content', 'user_id', 'post_id', 'reply_to', 'like_count', 'status', 'is_anonymous', 'images', 'emoji_image', 'created_at', 'updated_at', 'deleted_at',
        // 添加热度分数计算
        [
          sequelize.literal(`(
            0.7 * LOG(Comment.like_count + 1) +
            0.3 * EXP(-0.1 * TIMESTAMPDIFF(HOUR, Comment.created_at, NOW()))
          )`),
          'hot_score'
        ],
        // 添加热门标识判定
        [
          sequelize.literal(`(
            Comment.like_count >= 5 AND (
              0.7 * LOG(Comment.like_count + 1) +
              0.3 * EXP(-0.1 * TIMESTAMPDIFF(HOUR, Comment.created_at, NOW()))
            ) > 1.5
          ) OR Comment.like_count >= 10`),
          'is_hot'
        ]
      ],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: Comment,
          as: 'replies',
          where: { status: 'normal' },
          required: false,
          limit: 3,
          order: [['created_at', 'ASC']],
          attributes: ['id', 'content', 'user_id', 'post_id', 'reply_to', 'like_count', 'status', 'is_anonymous', 'images', 'emoji_image', 'created_at', 'updated_at'],
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'nickname', 'avatar']
            }
          ]
        }
      ]
    });
    
    return {
      list: rows,
      pagination: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        total: count
      }
    };
  }

  /**
   * 获取评论的回复列表
   * @param {String} commentId 评论ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async findReplies(commentId, page = 1, pageSize = 20) {
    const { rows, count } = await Comment.findAndCountAll({
      where: {
        reply_to: commentId,
        status: 'normal'
      },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'ASC']],
      attributes: [
        'id', 'content', 'user_id', 'post_id', 'reply_to', 'like_count', 'status', 'is_anonymous', 'images', 'emoji_image', 'created_at', 'updated_at'
      ],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    });
    
    return {
      list: rows,
      pagination: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        total: count
      }
    };
  }

  /**
   * 获取用户的评论列表
   * @param {String} userId 用户ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @param {String|Array} status 状态筛选，可以是单个状态或状态数组
   * @returns {Promise<Object>} 分页结果
   */
  async findByUserId(userId, page = 1, pageSize = 20, status = 'normal') {
    // 构建查询条件
    const where = {
      user_id: userId
    };

    // 处理状态筛选
    if (status) {
      if (Array.isArray(status)) {
        where.status = { [Op.in]: status };
      } else {
        where.status = status;
      }
    }

    const { rows, count } = await Comment.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Post,
          as: 'post',
          attributes: ['id', 'title', 'content'],
          paranoid: false // 允许查询软删除的帖子
        }
      ],
      paranoid: false // 允许查询软删除的评论
    });

    return {
      list: rows,
      pagination: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        total: count
      }
    };
  }

  /**
   * 更新评论计数器
   * @param {String} id 评论ID
   * @param {String} field 字段名
   * @param {Number} value 变化值
   * @returns {Promise<Boolean>} 是否成功
   */
  async updateCounter(id, field, value) {
    if (!['like_count'].includes(field)) {
      throw new Error('Invalid counter field');
    }
    
    const comment = await Comment.findByPk(id);
    if (!comment) return false;
    
    comment[field] = Math.max(0, comment[field] + value);
    await comment.save();
    
    return true;
  }

  /**
   * 检查用户是否已点赞该评论
   * @param {String} commentId 评论ID
   * @param {String} userId 用户ID
   * @returns {Promise<Boolean>} 是否已点赞
   */
  async isLikedByUser(commentId, userId) {
    const count = await Like.count({
      where: {
        target_id: commentId,
        user_id: userId,
        target_type: 'comment'
      }
    });
    return count > 0;
  }

  /**
   * 统计帖子的评论总数
   * @param {String} postId 帖子ID
   * @returns {Promise<Number>} 评论总数
   */
  async countByPostId(postId) {
    return await Comment.count({
      where: {
        post_id: postId,
        status: 'normal'
      }
    });
  }

  /**
   * 获取评论的所有回复（多级）
   * @param {String} commentId 评论ID
   * @param {Number} maxLevel 最大层级深度
   * @returns {Promise<Array>} 回复列表
   */
  async getRepliesTree(commentId, maxLevel = 3) {
    // 获取根评论
    const comment = await Comment.findByPk(commentId);
    if (!comment) return [];

    // 确定根评论ID：如果当前评论是顶级评论，则它就是根评论
    const rootCommentId = comment.reply_level === 0 ? commentId : (comment.root_comment_id || commentId);

    // 查询所有相关的回复（包括根评论本身和所有子回复）
    const allComments = await Comment.findAll({
      where: {
        [Op.or]: [
          { id: rootCommentId }, // 包含根评论本身
          { root_comment_id: rootCommentId } // 包含所有子回复
        ],
        reply_level: {
          [Op.lte]: maxLevel
        },
        status: 'normal'
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ],
      order: [['reply_level', 'ASC'], ['created_at', 'ASC']]
    });

    // 构建树形结构
    return this.buildCommentTree(allComments);
  }

  /**
   * 构建评论树形结构
   * @param {Array} comments 评论列表
   * @returns {Array} 树形结构的评论
   */
  buildCommentTree(comments) {
    const commentMap = new Map();
    const rootComments = [];

    // 创建评论映射
    comments.forEach(comment => {
      comment.dataValues.children = [];
      commentMap.set(comment.id, comment);
    });

    // 构建树形结构
    comments.forEach(comment => {
      if (comment.reply_to) {
        const parent = commentMap.get(comment.reply_to);
        if (parent) {
          parent.dataValues.children.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  }

  /**
   * 获取评论的直接回复
   * @param {String} commentId 评论ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async getDirectReplies(commentId, page = 1, pageSize = 10) {
    const { rows, count } = await Comment.findAndCountAll({
      where: {
        reply_to: commentId,
        status: 'normal'
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ],
      order: [['created_at', 'ASC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });

    return {
      list: rows,
      pagination: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        total: count
      }
    };
  }

  /**
   * 创建回复并更新相关计数
   * @param {Object} replyData 回复数据
   * @returns {Promise<Object>} 创建的回复
   */
  async createReply(replyData) {
    const transaction = await sequelize.transaction();

    try {
      // 解析@用户
      const mentionedUsers = this.parseMentionedUsers(replyData.content);

      // 确定回复层级和根评论ID
      let replyLevel = 0;
      let rootCommentId = null;

      if (replyData.reply_to) {
        const parentComment = await Comment.findByPk(replyData.reply_to, { transaction });
        if (parentComment) {
          replyLevel = parentComment.reply_level + 1;
          rootCommentId = parentComment.root_comment_id || parentComment.id;

          // 限制回复层级深度
          if (replyLevel > 5) {
            replyLevel = 5;
          }
        }
      }

      // 创建回复
      const reply = await Comment.create({
        ...replyData,
        reply_level: replyLevel,
        root_comment_id: rootCommentId,
        mentioned_users: mentionedUsers
      }, { transaction });

      // 更新父评论的回复数量
      if (replyData.reply_to) {
        await Comment.increment('reply_count', {
          where: { id: replyData.reply_to },
          transaction
        });
      }

      // 更新根评论的总回复数量
      if (rootCommentId && rootCommentId !== replyData.reply_to) {
        await Comment.increment('reply_count', {
          where: { id: rootCommentId },
          transaction
        });
      }

      await transaction.commit();

      // 获取完整的回复信息
      return await Comment.findByPk(reply.id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'nickname', 'avatar']
          }
        ]
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 解析评论中@的用户
   * @param {String} content 评论内容
   * @returns {Array} 被@的用户列表
   */
  parseMentionedUsers(content) {
    if (!content) return [];

    // 匹配@用户的正则表达式
    const mentionRegex = /@([a-zA-Z0-9_\u4e00-\u9fa5]+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push({
        username: match[1],
        position: match.index
      });
    }

    return mentions;
  }
}

module.exports = new CommentRepository(); 