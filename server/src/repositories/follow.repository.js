const { Follow, User } = require('../models');
const { Op } = require('sequelize');

/**
 * 关注数据访问层
 */
class FollowRepository {
  /**
   * 创建关注关系
   * @param {Object} followData 关注数据
   * @returns {Promise<Object>} 创建的关注对象
   */
  async create(followData) {
    return await Follow.create(followData);
  }

  /**
   * 删除关注关系
   * @param {String} followerId 关注者ID
   * @param {String} followingId 被关注者ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async delete(followerId, followingId) {
    const result = await Follow.destroy({
      where: {
        follower_id: followerId,
        following_id: followingId
      }
    });
    return result > 0;
  }

  /**
   * 查询是否已关注
   * @param {String} followerId 关注者ID
   * @param {String} followingId 被关注者ID
   * @returns {Promise<Boolean>} 是否已关注
   */
  async exists(followerId, followingId) {
    const count = await Follow.count({
      where: {
        follower_id: followerId,
        following_id: followingId
      }
    });
    return count > 0;
  }

  /**
   * 查询是否已关注（别名方法）
   * @param {String} followerId 关注者ID
   * @param {String} followingId 被关注者ID
   * @returns {Promise<Boolean>} 是否已关注
   */
  async isFollowing(followerId, followingId) {
    return await this.exists(followerId, followingId);
  }

  /**
   * 查找现有的关注记录（包括软删除的）
   * @param {String} followerId 关注者ID
   * @param {String} followingId 被关注者ID
   * @returns {Promise<Object|null>} 关注记录
   */
  async findExisting(followerId, followingId) {
    return await Follow.findOne({
      where: {
        follower_id: followerId,
        following_id: followingId
      },
      paranoid: false // 查询包含软删除的记录
    });
  }

  /**
   * 恢复软删除的关注记录
   * @param {String} followId 关注ID
   * @returns {Promise<Object>} 恢复的关注记录
   */
  async restore(followId) {
    const follow = await Follow.findByPk(followId, { paranoid: false });
    if (follow && follow.deletedAt) {
      await follow.restore();
      return follow;
    }
    return follow;
  }

  /**
   * 获取用户的关注列表
   * @param {String} userId 用户ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async findFollowings(userId, page = 1, pageSize = 20) {
    const { rows, count } = await Follow.findAndCountAll({
      where: { follower_id: userId },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'following',
          attributes: ['id', 'username', 'avatar', 'school', 'department', 'bio']
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
   * 获取用户的粉丝列表
   * @param {String} userId 用户ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async findFollowers(userId, page = 1, pageSize = 20) {
    const { rows, count } = await Follow.findAndCountAll({
      where: { following_id: userId },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['id', 'username', 'avatar', 'school', 'department', 'bio']
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
   * 获取用户的关注数量
   * @param {String} userId 用户ID
   * @returns {Promise<Number>} 关注数量
   */
  async countFollowings(userId) {
    return await Follow.count({
      where: { follower_id: userId }
    });
  }

  /**
   * 获取用户的粉丝数量
   * @param {String} userId 用户ID
   * @returns {Promise<Number>} 粉丝数量
   */
  async countFollowers(userId) {
    return await Follow.count({
      where: { following_id: userId }
    });
  }

  /**
   * 获取共同关注列表
   * @param {String} userId1 用户1 ID
   * @param {String} userId2 用户2 ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async findCommonFollowings(userId1, userId2, page = 1, pageSize = 20) {
    // 查询用户1的关注ID列表
    const followings1 = await Follow.findAll({
      where: { follower_id: userId1 },
      attributes: ['following_id']
    });
    
    const followingIds1 = followings1.map(f => f.following_id);
    
    // 查询用户2的关注中，也在用户1关注列表中的用户
    const { rows, count } = await Follow.findAndCountAll({
      where: { 
        follower_id: userId2,
        following_id: {
          [Op.in]: followingIds1
        }
      },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      include: [
        {
          model: User,
          as: 'following',
          attributes: ['id', 'username', 'avatar', 'school', 'department', 'bio']
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
   * 批量检查关注状态
   * @param {String} followerId 关注者ID
   * @param {Array} userIds 要检查的用户ID数组
   * @returns {Promise<Object>} 关注状态映射
   */
  async batchCheckFollowStatus(followerId, userIds) {
    if (!userIds || userIds.length === 0) {
      return {};
    }

    const follows = await Follow.findAll({
      where: {
        follower_id: followerId,
        following_id: {
          [Op.in]: userIds
        }
      },
      attributes: ['following_id']
    });

    // 创建关注状态映射
    const followStatusMap = {};
    userIds.forEach(userId => {
      followStatusMap[userId] = false;
    });

    follows.forEach(follow => {
      followStatusMap[follow.following_id] = true;
    });

    return followStatusMap;
  }

  /**
   * 获取用户的互相关注列表
   * @param {String} userId 用户ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async findMutualFollowings(userId, page = 1, pageSize = 20) {
    // 首先获取用户关注的所有用户ID
    const followings = await Follow.findAll({
      where: { follower_id: userId },
      attributes: ['following_id']
    });

    const followingIds = followings.map(f => f.following_id);

    if (followingIds.length === 0) {
      return {
        list: [],
        pagination: {
          page: parseInt(page, 10),
          pageSize: parseInt(pageSize, 10),
          total: 0
        }
      };
    }

    // 查询这些用户中也关注了当前用户的用户
    const { rows, count } = await Follow.findAndCountAll({
      where: {
        follower_id: {
          [Op.in]: followingIds
        },
        following_id: userId
      },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['id', 'username', 'avatar', 'school', 'department', 'bio']
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
}

module.exports = new FollowRepository();