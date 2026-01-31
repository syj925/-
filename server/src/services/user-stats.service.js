const { Post, Comment, Favorite, Follow, Like } = require('../models');
const logger = require('../../config/logger');
const PublishLimitMiddleware = require('../middlewares/publish-limit.middleware');

/**
 * 用户统计服务层
 * 处理用户相关的统计数据
 */
class UserStatsService {
  /**
   * 获取用户统计数据
   * @param {String} userId 用户ID
   * @returns {Promise<Object>} 统计数据
   */
  async getUserStats(userId) {
    try {
      // 并行查询所有统计数据
      const [
        postCount,
        commentCount,
        likeCount,
        favoriteCount,
        followCount,
        fansCount
      ] = await Promise.all([
        // 用户发布的帖子数
        Post.count({
          where: {
            user_id: userId,
            status: 'published'
          }
        }),
        // 用户发表的评论数
        Comment.count({
          where: {
            user_id: userId,
            status: 'normal'
          }
        }),
        // 用户获得的点赞数（用户发布的帖子被点赞的总数）
        this.getUserLikeCount(userId),
        // 用户的收藏数
        Favorite.count({
          where: { user_id: userId }
        }),
        // 用户关注的人数
        Follow.count({
          where: { follower_id: userId }
        }),
        // 关注用户的人数（粉丝数）
        Follow.count({
          where: { following_id: userId }
        })
      ]);

      return {
        postCount: postCount || 0,
        commentCount: commentCount || 0,
        likeCount: likeCount || 0,
        favoriteCount: favoriteCount || 0,
        followCount: followCount || 0,
        fansCount: fansCount || 0
      };
    } catch (error) {
      logger.error('获取用户统计数据失败:', error);
      // 发生错误时返回0值，而不是抛出异常
      return {
        postCount: 0,
        commentCount: 0,
        likeCount: 0,
        favoriteCount: 0,
        followCount: 0,
        fansCount: 0
      };
    }
  }

  /**
   * 获取用户获赞数
   * @param {String} userId 用户ID
   * @returns {Promise<Number>} 获赞数
   */
  async getUserLikeCount(userId) {
    try {
      // 先获取用户的所有已发布帖子ID
      const userPosts = await Post.findAll({
        where: {
          user_id: userId,
          status: 'published'
        },
        attributes: ['id'],
        raw: true
      });

      if (!userPosts || userPosts.length === 0) {
        return 0;
      }

      const postIds = userPosts.map(post => post.id);

      // 统计这些帖子的点赞数
      const likeCount = await Like.count({
        where: {
          target_type: 'post',
          target_id: postIds
        }
      });

      return likeCount || 0;
    } catch (error) {
      logger.error('获取用户获赞数失败', { userId, error: error.message });
      return 0;
    }
  }

  /**
   * 获取用户今日发布统计
   * @param {Number} userId 用户ID
   * @returns {Promise<Object>} 发布统计
   */
  async getUserTodayPublishStats(userId) {
    try {
      const stats = await PublishLimitMiddleware.getUserTodayStats(userId);
      return stats;
    } catch (error) {
      logger.error('获取用户今日发布统计失败:', error);
      throw error;
    }
  }
}

module.exports = new UserStatsService();
