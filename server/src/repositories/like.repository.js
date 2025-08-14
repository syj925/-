const { Like, User, Post, Comment } = require('../models');
const { Op } = require('sequelize');

/**
 * 点赞数据访问层
 */
class LikeRepository {
  /**
   * 创建点赞
   * @param {Object} likeData 点赞数据
   * @returns {Promise<Object>} 创建的点赞对象
   */
  async create(likeData) {
    return await Like.create(likeData);
  }

  /**
   * 删除点赞
   * @param {String} userId 用户ID
   * @param {String} targetId 目标ID
   * @param {String} targetType 目标类型
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async delete(userId, targetId, targetType) {
    const result = await Like.destroy({
      where: {
        user_id: userId,
        target_id: targetId,
        target_type: targetType
      }
    });
    return result > 0;
  }

  /**
   * 查询用户是否已点赞
   * @param {String} userId 用户ID
   * @param {String} targetId 目标ID
   * @param {String} targetType 目标类型
   * @returns {Promise<Boolean>} 是否已点赞
   */
  async exists(userId, targetId, targetType) {
    const count = await Like.count({
      where: {
        user_id: userId,
        target_id: targetId,
        target_type: targetType
      }
    });
    return count > 0;
  }

  /**
   * 查找或创建点赞记录
   * @param {Object} data 点赞数据
   * @returns {Promise<Array>} [instance, created]
   */
  async findOrCreate(data) {
    return await Like.findOrCreate({
      where: {
        user_id: data.user_id,
        target_id: data.target_id,
        target_type: data.target_type
      },
      defaults: data
    });
  }

  /**
   * 获取用户的点赞列表
   * @param {String} userId 用户ID
   * @param {String} targetType 目标类型
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async findByUserId(userId, targetType, page = 1, pageSize = 20) {
    const where = { user_id: userId };
    if (targetType) {
      where.target_type = targetType;
    }
    
    // 构建include数组
    const include = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar']
      }
    ];

    // 根据目标类型添加相应的关联
    if (!targetType || targetType === 'post') {
      include.push({
        model: Post,
        as: 'post',
        required: false,
        attributes: ['id', 'title', 'content'],
        where: { status: 'published' }
      });
    }

    if (!targetType || targetType === 'comment') {
      include.push({
        model: Comment,
        as: 'comment',
        required: false,
        attributes: ['id', 'content'],
        where: { status: 'normal' }
      });
    }

    const { rows, count } = await Like.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']],
      include
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
   * 获取目标的点赞列表
   * @param {String} targetId 目标ID
   * @param {String} targetType 目标类型
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async findByTargetId(targetId, targetType, page = 1, pageSize = 20) {
    const { rows, count } = await Like.findAndCountAll({
      where: {
        target_id: targetId,
        target_type: targetType
      },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
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
   * 获取目标的点赞数量
   * @param {String} targetId 目标ID
   * @param {String} targetType 目标类型
   * @returns {Promise<Number>} 点赞数量
   */
  async countByTargetId(targetId, targetType) {
    return await Like.count({
      where: {
        target_id: targetId,
        target_type: targetType
      }
    });
  }

  /**
   * 统计用户获得的点赞数量（用户发布的帖子和评论获得的点赞总数）
   * @param {String} userId 用户ID
   * @returns {Promise<Number>} 点赞数量
   */
  async countByUserId(userId) {
    const { Post, Comment } = require('../models');

    // 获取用户发布的帖子ID列表
    const userPosts = await Post.findAll({
      where: { user_id: userId, status: 'published' },
      attributes: ['id']
    });
    const postIds = userPosts.map(post => post.id);

    // 获取用户发布的评论ID列表
    const userComments = await Comment.findAll({
      where: { user_id: userId, status: 'normal' },
      attributes: ['id']
    });
    const commentIds = userComments.map(comment => comment.id);

    // 统计帖子点赞数
    const postLikeCount = postIds.length > 0 ? await Like.count({
      where: {
        target_id: postIds,
        target_type: 'post'
      }
    }) : 0;

    // 统计评论点赞数
    const commentLikeCount = commentIds.length > 0 ? await Like.count({
      where: {
        target_id: commentIds,
        target_type: 'comment'
      }
    }) : 0;

    return postLikeCount + commentLikeCount;
  }
}

module.exports = new LikeRepository();