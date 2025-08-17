const { Favorite, User, Post, Category, PostImage } = require('../models');
const { Op } = require('sequelize');

/**
 * 收藏数据访问层
 */
class FavoriteRepository {
  /**
   * 创建收藏
   * @param {Object} favoriteData 收藏数据
   * @returns {Promise<Object>} 创建的收藏对象
   */
  async create(favoriteData) {
    return await Favorite.create(favoriteData);
  }

  /**
   * 删除收藏
   * @param {String} userId 用户ID
   * @param {String} postId 帖子ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async delete(userId, postId) {
    const result = await Favorite.destroy({
      where: {
        user_id: userId,
        post_id: postId
      }
    });
    return result > 0;
  }

  /**
   * 查询用户是否已收藏
   * @param {String} userId 用户ID
   * @param {String} postId 帖子ID
   * @returns {Promise<Boolean>} 是否已收藏
   */
  async exists(userId, postId) {
    const count = await Favorite.count({
      where: {
        user_id: userId,
        post_id: postId
      }
      // 注意：这里不使用 paranoid: false，只查询未删除的记录
    });
    return count > 0;
  }

  /**
   * 查找现有的收藏记录（包括软删除的）
   * @param {String} userId 用户ID
   * @param {String} postId 帖子ID
   * @returns {Promise<Object|null>} 收藏记录
   */
  async findExisting(userId, postId) {
    return await Favorite.findOne({
      where: {
        user_id: userId,
        post_id: postId
      },
      paranoid: false // 查询包含软删除的记录
    });
  }

  /**
   * 恢复软删除的收藏记录
   * @param {String} favoriteId 收藏ID
   * @returns {Promise<Object>} 恢复的收藏记录
   */
  async restore(favoriteId) {
    const favorite = await Favorite.findByPk(favoriteId, { paranoid: false });
    if (favorite && favorite.deletedAt) {
      await favorite.restore();
      return favorite;
    }
    return favorite;
  }

  /**
   * 获取用户的收藏列表
   * @param {String} userId 用户ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async findByUserId(userId, page = 1, pageSize = 20) {
    const { rows, count } = await Favorite.findAndCountAll({
      where: { user_id: userId },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Post,
          as: 'post',
          attributes: ['id', 'title', 'content', 'user_id', 'like_count', 'comment_count', 'favorite_count', 'view_count', 'created_at'],
          where: { status: 'published' },
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'nickname', 'avatar']
            },
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name', 'icon']
            },
            {
              model: PostImage,
              as: 'images',
              attributes: ['id', 'url', 'thumbnail_url'],
              limit: 1
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
   * 获取帖子的收藏数量
   * @param {String} postId 帖子ID
   * @returns {Promise<Number>} 收藏数量
   */
  async countByPostId(postId) {
    return await Favorite.count({
      where: { post_id: postId }
    });
  }

  /**
   * 获取帖子的收藏用户列表
   * @param {String} postId 帖子ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async findUsersByPostId(postId, page = 1, pageSize = 20) {
    const { rows, count } = await Favorite.findAndCountAll({
      where: { post_id: postId },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar', 'school', 'department']
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
   * 统计用户收藏的帖子数量
   * @param {String} userId 用户ID
   * @returns {Promise<Number>} 收藏数量
   */
  async countByUserId(userId) {
    return await Favorite.count({
      where: { user_id: userId }
    });
  }
}

module.exports = new FavoriteRepository();