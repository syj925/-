const { Op } = require('sequelize');
const {
  User,
  Post,
  PostImage,
  Topic,
  Category,
  SearchHistory,
  Like,
  Follow,
  sequelize
} = require('../models');
const logger = require('../../config/logger');

/**
 * 搜索服务
 */
class SearchService {
  /**
   * 全局搜索
   * @param {Object} params 搜索参数
   * @returns {Promise<Object>} 搜索结果
   */
  async globalSearch({ keyword, type, page, pageSize, userId }) {
    try {
      const offset = (page - 1) * pageSize;
      const results = {};

      // 根据类型进行搜索
      if (type === 'all' || type === 'posts') {
        const postResults = await this.searchPosts({
          keyword,
          page: 1,
          pageSize: type === 'all' ? 5 : pageSize,
          userId
        });
        results.posts = postResults;
      }

      if (type === 'all' || type === 'users') {
        const userResults = await this.searchUsers({
          keyword,
          page: 1,
          pageSize: type === 'all' ? 5 : pageSize,
          currentUserId: userId
        });
        results.users = userResults;
      }

      if (type === 'all' || type === 'topics') {
        const topicResults = await this.searchTopics({
          keyword,
          page: 1,
          pageSize: type === 'all' ? 5 : pageSize
        });
        results.topics = topicResults;
      }

      // 保存搜索历史
      if (userId) {
        await this.saveSearchHistory({ userId, keyword, type });
      }

      return results;
    } catch (error) {
      logger.error('全局搜索失败:', error);
      throw error;
    }
  }

  /**
   * 搜索帖子
   * @param {Object} params 搜索参数
   * @returns {Promise<Object>} 搜索结果
   */
  async searchPosts({ keyword, page, pageSize, categoryId, topicId, userId }) {
    try {
      const offset = (page - 1) * pageSize;
      
      // 构建搜索条件
      const whereCondition = {
        [Op.and]: [
          {
            [Op.or]: [
              { title: { [Op.like]: `%${keyword}%` } },
              { content: { [Op.like]: `%${keyword}%` } }
            ]
          },
          { status: 'published' }
        ]
      };

      // 添加分类筛选
      if (categoryId) {
        whereCondition[Op.and].push({ categoryId });
      }

      // 添加话题筛选
      if (topicId) {
        whereCondition[Op.and].push({ topicId });
      }

      const { count, rows } = await Post.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'nickname', 'avatar']
          },
          {
            model: Topic,
            as: 'topics',
            attributes: ['id', 'name', 'description']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          },
          {
            model: PostImage,
            as: 'images',
            attributes: ['id', 'url', 'thumbnail_url', 'width', 'height', 'order'],
            order: [['order', 'ASC']],
            separate: true,
            limit: 9
          }
        ],
        order: [
          ['created_at', 'DESC'],
          ['like_count', 'DESC']
        ],
        limit: pageSize,
        offset,
        distinct: true
      });

      // 如果用户已登录，获取点赞状态
      if (userId && rows.length > 0) {
        const postIds = rows.map(post => post.id);
        const likes = await Like.findAll({
          where: {
            userId,
            targetId: { [Op.in]: postIds },
            targetType: 'post'
          }
        });

        const likedPostIds = new Set(likes.map(like => like.targetId));

        rows.forEach(post => {
          post.dataValues.isLiked = likedPostIds.has(post.id);
        });
      }

      // 为每个帖子添加热门评论预览和字段映射
      const postService = require('./post.service');
      for (const post of rows) {
        const hotComments = await postService.getPostHotComments(post.id, 3, userId);
        post.dataValues.hot_comments = hotComments.list;
        post.dataValues.total_comments = hotComments.total;

        // 添加字段映射，确保前端兼容性
        post.dataValues.likeCount = post.like_count || 0;
        post.dataValues.commentCount = post.comment_count || 0;
        post.dataValues.favoriteCount = post.favorite_count || 0;
        post.dataValues.viewCount = post.view_count || 0;
        post.dataValues.createTime = post.created_at;
        post.dataValues.isLiked = post.dataValues.isLiked || false;
        post.dataValues.isFavorited = post.dataValues.isFavorited || false;
      }

      return {
        list: rows,
        pagination: {
          page,
          pageSize,
          total: count,
          totalPages: Math.ceil(count / pageSize)
        }
      };
    } catch (error) {
      logger.error('搜索帖子失败:', error);
      throw error;
    }
  }

  /**
   * 搜索用户
   * @param {Object} params 搜索参数
   * @returns {Promise<Object>} 搜索结果
   */
  async searchUsers({ keyword, page, pageSize, currentUserId }) {
    try {
      const offset = (page - 1) * pageSize;
      
      const whereCondition = {
        [Op.or]: [
          { username: { [Op.like]: `%${keyword}%` } },
          { nickname: { [Op.like]: `%${keyword}%` } }
        ]
      };

      // 排除当前用户
      if (currentUserId) {
        whereCondition[Op.and] = [
          whereCondition,
          { id: { [Op.ne]: currentUserId } }
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where: whereCondition,
        attributes: ['id', 'username', 'nickname', 'avatar'],
        order: [
          ['created_at', 'DESC']
        ],
        limit: pageSize,
        offset
      });

      // 如果当前用户已登录，获取关注状态
      if (currentUserId && rows.length > 0) {
        const userIds = rows.map(user => user.id);
        const follows = await Follow.findAll({
          where: {
            followerId: currentUserId,
            followingId: { [Op.in]: userIds }
          }
        });
        
        const followedUserIds = new Set(follows.map(follow => follow.followingId));
        
        rows.forEach(user => {
          user.dataValues.isFollowed = followedUserIds.has(user.id);
        });
      }

      return {
        list: rows,
        pagination: {
          page,
          pageSize,
          total: count,
          totalPages: Math.ceil(count / pageSize)
        }
      };
    } catch (error) {
      logger.error('搜索用户失败:', error);
      throw error;
    }
  }

  /**
   * 搜索话题
   * @param {Object} params 搜索参数
   * @returns {Promise<Object>} 搜索结果
   */
  async searchTopics({ keyword, page, pageSize }) {
    try {
      const offset = (page - 1) * pageSize;
      
      const { count, rows } = await Topic.findAndCountAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [
                { name: { [Op.like]: `%${keyword}%` } },
                { description: { [Op.like]: `%${keyword}%` } }
              ]
            },
            { status: 'active' }
          ]
        },
        order: [
          ['hot_score', 'DESC'],
          ['post_count', 'DESC'],
          ['view_count', 'DESC']
        ],
        limit: pageSize,
        offset
      });

      // 为每个话题添加字段映射，确保前端兼容性
      rows.forEach(topic => {
        topic.dataValues.postCount = topic.post_count || 0;
        topic.dataValues.postsCount = topic.post_count || 0; // 兼容不同的前端组件
        topic.dataValues.viewCount = topic.view_count || 0;
        topic.dataValues.hotScore = topic.hot_score || 0;
        topic.dataValues.isHot = topic.is_hot || false;
      });

      return {
        list: rows,
        pagination: {
          page,
          pageSize,
          total: count,
          totalPages: Math.ceil(count / pageSize)
        }
      };
    } catch (error) {
      logger.error('搜索话题失败:', error);
      throw error;
    }
  }

  /**
   * 获取搜索建议
   * @param {Object} params 参数
   * @returns {Promise<Object>} 搜索建议
   */
  async getSearchSuggestions({ keyword, limit }) {
    try {
      const suggestions = [];

      // 获取话题建议
      const topics = await Topic.findAll({
        where: {
          name: { [Op.like]: `%${keyword}%` },
          status: 'active'
        },
        attributes: ['id', 'name'],
        order: [['post_count', 'DESC']],
        limit: Math.ceil(limit / 2)
      });

      suggestions.push(...topics.map(topic => ({
        type: 'topic',
        text: topic.name,
        id: topic.id
      })));

      // 获取用户建议
      const users = await User.findAll({
        where: {
          [Op.or]: [
            { username: { [Op.like]: `%${keyword}%` } },
            { nickname: { [Op.like]: `%${keyword}%` } }
          ]
        },
        attributes: ['id', 'username', 'nickname'],
        order: [['created_at', 'DESC']],
        limit: Math.floor(limit / 2)
      });

      suggestions.push(...users.map(user => ({
        type: 'user',
        text: user.nickname || user.username,
        id: user.id
      })));

      return { suggestions: suggestions.slice(0, limit) };
    } catch (error) {
      logger.error('获取搜索建议失败:', error);
      throw error;
    }
  }

  /**
   * 获取热门搜索
   * @param {Object} params 参数
   * @returns {Promise<Object>} 热门搜索
   */
  async getHotSearches({ limit }) {
    try {
      // 获取最近7天的热门搜索关键词
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const hotSearches = await SearchHistory.findAll({
        where: {
          created_at: { [Op.gte]: sevenDaysAgo }
        },
        attributes: [
          'keyword',
          [sequelize.fn('COUNT', sequelize.col('keyword')), 'searchCount']
        ],
        group: ['keyword'],
        order: [[sequelize.literal('searchCount'), 'DESC']],
        limit
      });

      return { hotSearches };
    } catch (error) {
      logger.error('获取热门搜索失败:', error);
      throw error;
    }
  }

  /**
   * 保存搜索历史
   * @param {Object} params 参数
   * @returns {Promise<void>}
   */
  async saveSearchHistory({ userId, keyword, type }) {
    try {
      // 检查是否已存在相同的搜索记录
      const existingRecord = await SearchHistory.findOne({
        where: { userId, keyword, type }
      });

      if (existingRecord) {
        // 更新时间
        await existingRecord.update({ updated_at: new Date() });
      } else {
        // 创建新记录
        await SearchHistory.create({ userId, keyword, type });
      }

      // 保持用户搜索历史不超过50条
      const userHistoryCount = await SearchHistory.count({ where: { userId } });
      if (userHistoryCount > 50) {
        const oldRecords = await SearchHistory.findAll({
          where: { userId },
          order: [['updated_at', 'ASC']],
          limit: userHistoryCount - 50
        });
        
        const oldRecordIds = oldRecords.map(record => record.id);
        await SearchHistory.destroy({
          where: { id: { [Op.in]: oldRecordIds } }
        });
      }
    } catch (error) {
      logger.error('保存搜索历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取搜索历史
   * @param {Object} params 参数
   * @returns {Promise<Object>} 搜索历史
   */
  async getSearchHistory({ userId, limit }) {
    try {
      const history = await SearchHistory.findAll({
        where: { userId },
        attributes: ['keyword', 'type', 'updated_at'],
        order: [['updated_at', 'DESC']],
        limit
      });

      return { history };
    } catch (error) {
      logger.error('获取搜索历史失败:', error);
      throw error;
    }
  }

  /**
   * 清除搜索历史
   * @param {number} userId 用户ID
   * @returns {Promise<void>}
   */
  async clearSearchHistory(userId) {
    try {
      await SearchHistory.destroy({ where: { userId } });
    } catch (error) {
      logger.error('清除搜索历史失败:', error);
      throw error;
    }
  }
}

module.exports = new SearchService();
