const badgeRepository = require('../repositories/badge.repository');
const userBadgeRepository = require('../repositories/user-badge.repository');
const userRepository = require('../repositories/user.repository');
const postRepository = require('../repositories/post.repository');
const likeRepository = require('../repositories/like.repository');
const logger = require('../../config/logger');

/**
 * 徽章业务逻辑服务
 */
class BadgeService {
  /**
   * 创建徽章
   * @param {Object} badgeData 徽章数据
   * @param {String} adminId 管理员ID
   * @returns {Promise<Object>} 创建的徽章对象
   */
  async createBadge(badgeData, adminId) {
    // 验证徽章名称唯一性
    const existingBadge = await badgeRepository.findByName(badgeData.name);
    if (existingBadge) {
      throw new Error('徽章名称已存在');
    }

    // 验证颜色格式
    if (badgeData.color && !/^#[0-9A-Fa-f]{6}$/.test(badgeData.color)) {
      throw new Error('颜色格式不正确，请使用十六进制颜色代码');
    }

    // 创建徽章
    const badge = await badgeRepository.create({
      ...badgeData,
      created_by: adminId
    });

    logger.info('徽章创建成功', {
      badgeId: badge.id,
      badgeName: badge.name,
      adminId
    });

    return badge;
  }

  /**
   * 获取徽章列表
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 徽章列表
   */
  async getBadges(options = {}) {
    return await badgeRepository.findAll(options);
  }

  /**
   * 获取徽章列表（直接查询数据库，不使用缓存）
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 徽章列表
   */
  async getBadgesFromDB(options = {}) {
    return await badgeRepository.findAllFromDB(options);
  }

  /**
   * 根据ID获取徽章
   * @param {String} id 徽章ID
   * @returns {Promise<Object>} 徽章对象
   */
  async getBadgeById(id) {
    const badge = await badgeRepository.findById(id);
    if (!badge) {
      throw new Error('徽章不存在');
    }
    return badge;
  }

  /**
   * 更新徽章
   * @param {String} id 徽章ID
   * @param {Object} badgeData 徽章数据
   * @param {String} adminId 管理员ID
   * @returns {Promise<Object>} 更新后的徽章对象
   */
  async updateBadge(id, badgeData, adminId) {
    const badge = await badgeRepository.findById(id);
    if (!badge) {
      throw new Error('徽章不存在');
    }

    // 如果修改名称，检查唯一性
    if (badgeData.name && badgeData.name !== badge.name) {
      const existingBadge = await badgeRepository.findByName(badgeData.name);
      if (existingBadge && existingBadge.id !== id) {
        throw new Error('徽章名称已存在');
      }
    }

    // 验证颜色格式
    if (badgeData.color && !/^#[0-9A-Fa-f]{6}$/.test(badgeData.color)) {
      throw new Error('颜色格式不正确，请使用十六进制颜色代码');
    }

    const updatedBadge = await badgeRepository.update(id, {
      ...badgeData,
      updated_by: adminId
    });

    // 如果更新了用户可见的属性（名称、图标、颜色、描述），清除所有用户缓存
    const userVisibleFields = ['name', 'icon', 'color', 'description'];
    const hasUserVisibleChanges = userVisibleFields.some(field => badgeData[field] !== undefined);
    
    if (hasUserVisibleChanges) {
      const userBadgeRepository = require('../repositories/user-badge.repository');
      await userBadgeRepository.clearAllUserBadgeCache();
    }

    logger.info('徽章更新成功', {
      badgeId: id,
      badgeName: updatedBadge.name,
      adminId,
      clearedAllCache: hasUserVisibleChanges
    });

    return updatedBadge;
  }

  /**
   * 删除徽章
   * @param {String} id 徽章ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async deleteBadge(id) {
    const badge = await badgeRepository.findById(id);
    if (!badge) {
      throw new Error('徽章不存在');
    }

    const result = await badgeRepository.delete(id);

    if (result) {
      // 徽章删除成功后，清除所有用户的徽章缓存
      // 因为删除徽章影响所有拥有该徽章的用户
      const userBadgeRepository = require('../repositories/user-badge.repository');
      await userBadgeRepository.clearAllUserBadgeCache();
      
      logger.info('徽章删除成功', {
        badgeId: id,
        badgeName: badge.name
      });
    }

    return result;
  }

  /**
   * 搜索徽章
   * @param {String} keyword 关键词
   * @param {Object} options 搜索选项
   * @returns {Promise<Array>} 徽章列表
   */
  async searchBadges(keyword, options = {}) {
    if (!keyword || keyword.trim().length === 0) {
      return [];
    }

    return await badgeRepository.search(keyword.trim(), options);
  }

  /**
   * 授予用户徽章
   * @param {String} userId 用户ID
   * @param {String} badgeId 徽章ID
   * @param {String} grantedBy 授予者ID
   * @returns {Promise<Object>} 用户徽章对象
   */
  async grantUserBadge(userId, badgeId, grantedBy) {
    // 验证用户存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证徽章存在
    const badge = await badgeRepository.findById(badgeId);
    if (!badge) {
      throw new Error('徽章不存在');
    }

    if (badge.status !== 'active') {
      throw new Error('徽章已禁用，无法授予');
    }

    // 检查用户是否已拥有该徽章
    const hasBadge = await userBadgeRepository.hasBadge(userId, badgeId);
    if (hasBadge) {
      throw new Error('用户已拥有该徽章');
    }

    const userBadge = await userBadgeRepository.grantBadge(userId, badgeId, grantedBy);

    logger.info('徽章授予成功', {
      userId,
      badgeId,
      badgeName: badge.name,
      grantedBy
    });

    return userBadge;
  }

  /**
   * 撤销用户徽章
   * @param {String} userId 用户ID
   * @param {String} badgeId 徽章ID
   * @returns {Promise<Boolean>} 是否成功撤销
   */
  async revokeUserBadge(userId, badgeId) {
    // 验证用户徽章存在
    const hasBadge = await userBadgeRepository.hasBadge(userId, badgeId);
    if (!hasBadge) {
      throw new Error('用户未拥有该徽章');
    }

    const result = await userBadgeRepository.revokeBadge(userId, badgeId);

    if (result) {
      logger.info('徽章撤销成功', {
        userId,
        badgeId
      });
    }

    return result;
  }

  /**
   * 获取用户徽章
   * @param {String} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 用户徽章列表
   */
  async getUserBadges(userId, options = {}) {
    return await userBadgeRepository.getUserBadges(userId, options);
  }

  /**
   * 获取用户徽章（直接查询数据库，不使用缓存）
   * @param {String} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 用户徽章列表
   */
  async getUserBadgesFromDB(userId, options = {}) {
    return await userBadgeRepository.getUserBadgesFromDB(userId, options);
  }

  /**
   * 更新用户徽章显示设置
   * @param {String} userId 用户ID
   * @param {String} badgeId 徽章ID
   * @param {Object} settings 设置项
   * @returns {Promise<Object>} 更新后的用户徽章对象
   */
  async updateUserBadgeDisplay(userId, badgeId, settings) {
    return await userBadgeRepository.updateDisplaySettings(userId, badgeId, settings);
  }

  /**
   * 批量更新用户徽章显示顺序
   * @param {String} userId 用户ID
   * @param {Array} badgeOrders 徽章顺序数组
   * @returns {Promise<Boolean>} 是否成功
   */
  async updateUserBadgeOrder(userId, badgeOrders) {
    // 验证所有徽章都属于该用户
    for (const { badgeId } of badgeOrders) {
      const hasBadge = await userBadgeRepository.hasBadge(userId, badgeId);
      if (!hasBadge) {
        throw new Error(`用户未拥有徽章: ${badgeId}`);
      }
    }

    return await userBadgeRepository.updateDisplayOrder(userId, badgeOrders);
  }

  /**
   * 检查自动授予条件
   * @param {String} userId 用户ID
   * @returns {Promise<Array>} 新授予的徽章列表
   */
  async checkAutoGrantConditions(userId) {
    // 获取所有自动授予的徽章
    const autoGrantBadges = await badgeRepository.findAutoGrantBadges();
    
    if (autoGrantBadges.length === 0) {
      return [];
    }

    const results = [];
    
    for (const badge of autoGrantBadges) {
      try {
        // 检查用户是否已有此徽章
        const hasBadge = await userBadgeRepository.hasBadge(userId, badge.id);
        if (hasBadge) {
          continue;
        }

        // 评估授予条件
        const shouldGrant = await this.evaluateGrantCondition(userId, badge.grant_condition);
        
        if (shouldGrant) {
          await userBadgeRepository.grantBadge(userId, badge.id, null); // null表示系统自动授予
          results.push(badge);
          
          logger.info('自动授予徽章成功', {
            userId,
            badgeId: badge.id,
            badgeName: badge.name
          });
        }
      } catch (error) {
        logger.error(`检查徽章 ${badge.name} 自动授予条件失败:`, {
          error: error.message,
          userId,
          badgeId: badge.id
        });
      }
    }

    return results;
  }

  /**
   * 评估授予条件
   * @param {String} userId 用户ID
   * @param {Object} condition 授予条件
   * @returns {Promise<Boolean>} 是否满足条件
   */
  async evaluateGrantCondition(userId, condition) {
    if (!condition || typeof condition !== 'object') {
      return false;
    }

    try {
      switch (condition.type) {
        case 'post_count':
          return await this.checkPostCountCondition(userId, condition.value);
        
        case 'like_count':
          return await this.checkLikeCountCondition(userId, condition.value);
        
        case 'register_days':
          return await this.checkRegisterDaysCondition(userId, condition.value);
        
        case 'follower_count':
          return await this.checkFollowerCountCondition(userId, condition.value);
        
        case 'comment_count':
          return await this.checkCommentCountCondition(userId, condition.value);
        
        default:
          logger.warn('未知的徽章授予条件类型', { type: condition.type });
          return false;
      }
    } catch (error) {
      logger.error('评估徽章授予条件失败', {
        error: error.message,
        userId,
        condition
      });
      return false;
    }
  }

  /**
   * 检查发帖数量条件
   * @param {String} userId 用户ID
   * @param {Number} requiredCount 要求的数量
   * @returns {Promise<Boolean>} 是否满足条件
   */
  async checkPostCountCondition(userId, requiredCount) {
    const userPosts = await postRepository.findAll({
      where: {
        user_id: userId,
        status: 'published'
      }
    });
    
    return userPosts.length >= requiredCount;
  }

  /**
   * 检查获得点赞数条件
   * @param {String} userId 用户ID
   * @param {Number} requiredCount 要求的数量
   * @returns {Promise<Boolean>} 是否满足条件
   */
  async checkLikeCountCondition(userId, requiredCount) {
    // 获取用户所有帖子的点赞数
    const userPosts = await postRepository.findAll({
      where: {
        user_id: userId,
        status: 'published'
      }
    });

    let totalLikes = 0;
    for (const post of userPosts) {
      const likeCount = await likeRepository.count({
        where: {
          target_id: post.id,
          target_type: 'post'
        }
      });
      totalLikes += likeCount;
    }

    return totalLikes >= requiredCount;
  }

  /**
   * 检查注册天数条件
   * @param {String} userId 用户ID
   * @param {Number} requiredDays 要求的天数
   * @returns {Promise<Boolean>} 是否满足条件
   */
  async checkRegisterDaysCondition(userId, requiredDays) {
    const user = await userRepository.findById(userId);
    if (!user) {
      return false;
    }

    const registerDays = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return registerDays >= requiredDays;
  }

  /**
   * 检查粉丝数量条件
   * @param {String} userId 用户ID
   * @param {Number} requiredCount 要求的数量
   * @returns {Promise<Boolean>} 是否满足条件
   */
  async checkFollowerCountCondition(userId, requiredCount) {
    // 这里需要根据你们的Follow模型实现
    // 暂时返回false，后续可以完善
    return false;
  }

  /**
   * 检查评论数量条件
   * @param {String} userId 用户ID
   * @param {Number} requiredCount 要求的数量
   * @returns {Promise<Boolean>} 是否满足条件
   */
  async checkCommentCountCondition(userId, requiredCount) {
    // 这里需要根据你们的Comment模型实现
    // 暂时返回false，后续可以完善
    return false;
  }

  /**
   * 获取徽章统计信息
   * @returns {Promise<Object>} 徽章统计信息
   */
  async getBadgeStatistics() {
    return await badgeRepository.getStatistics();
  }

  /**
   * 获取用户徽章统计
   * @param {String} userId 用户ID
   * @returns {Promise<Object>} 用户徽章统计信息
   */
  async getUserBadgeStatistics(userId) {
    return await userBadgeRepository.getUserBadgeStats(userId);
  }

  /**
   * 获取徽章的用户列表
   * @param {String} badgeId 徽章ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 用户列表和分页信息
   */
  async getBadgeUsers(badgeId, options = {}) {
    // 验证徽章存在
    const badge = await badgeRepository.findById(badgeId);
    if (!badge) {
      throw new Error('徽章不存在');
    }

    return await userBadgeRepository.getBadgeUsers(badgeId, options);
  }

  /**
   * 批量授予徽章
   * @param {Array} grants 授予数据 [{userId, badgeId, grantedBy}, ...]
   * @returns {Promise<Array>} 成功授予的徽章列表
   */
  async batchGrantBadges(grants) {
    const validGrants = [];
    
    // 验证所有授予数据
    for (const grant of grants) {
      try {
        // 验证用户存在
        const user = await userRepository.findById(grant.userId);
        if (!user) {
          logger.warn('用户不存在，跳过授予', { userId: grant.userId });
          continue;
        }

        // 验证徽章存在且可用
        const badge = await badgeRepository.findById(grant.badgeId);
        if (!badge || badge.status !== 'active') {
          logger.warn('徽章不存在或已禁用，跳过授予', { badgeId: grant.badgeId });
          continue;
        }

        // 检查是否已拥有
        const hasBadge = await userBadgeRepository.hasBadge(grant.userId, grant.badgeId);
        if (!hasBadge) {
          validGrants.push(grant);
        }
      } catch (error) {
        logger.error('验证授予数据失败', {
          error: error.message,
          grant
        });
      }
    }

    if (validGrants.length === 0) {
      return [];
    }

    return await userBadgeRepository.batchGrantBadges(validGrants);
  }

  /**
   * 获取最近授予的徽章
   * @param {Number} limit 限制数量
   * @param {Number} days 天数
   * @returns {Promise<Array>} 最近授予的徽章列表
   */
  async getRecentlyGrantedBadges(limit = 10, days = 7) {
    return await userBadgeRepository.getRecentlyGranted(limit, days);
  }

  /**
   * 撤销用户徽章
   * @param {String} userId 用户ID
   * @param {String} badgeId 徽章ID
   * @returns {Promise<Boolean>} 是否成功
   */
  async revokeUserBadge(userId, badgeId) {
    // 验证用户存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证徽章存在
    const badge = await badgeRepository.findById(badgeId);
    if (!badge) {
      throw new Error('徽章不存在');
    }

    return await userBadgeRepository.revokeUserBadge(userId, badgeId);
  }

  /**
   * 更新用户徽章可见性
   * @param {String} userId 用户ID
   * @param {String} badgeId 徽章ID
   * @param {Boolean} isVisible 是否可见
   * @returns {Promise<Boolean>} 是否成功
   */
  async updateBadgeVisibility(userId, badgeId, isVisible) {
    // 验证用户存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证徽章存在
    const badge = await badgeRepository.findById(badgeId);
    if (!badge) {
      throw new Error('徽章不存在');
    }

    return await userBadgeRepository.updateBadgeVisibility(userId, badgeId, isVisible);
  }

  /**
   * 批量撤销徽章
   * @param {Array} revokes 撤销数据 [{userId, badgeId}, ...]
   * @returns {Promise<Number>} 成功撤销的数量
   */
  async batchRevokeBadges(revokes) {
    const validRevokes = [];
    
    // 验证所有撤销数据
    for (const revoke of revokes) {
      try {
        // 验证用户存在
        const user = await userRepository.findById(revoke.userId);
        if (!user) {
          logger.warn('用户不存在，跳过撤销', { userId: revoke.userId });
          continue;
        }

        // 验证徽章存在
        const badge = await badgeRepository.findById(revoke.badgeId);
        if (!badge) {
          logger.warn('徽章不存在，跳过撤销', { badgeId: revoke.badgeId });
          continue;
        }

        validRevokes.push(revoke);
      } catch (error) {
        logger.warn('验证撤销数据失败，跳过', { revoke, error: error.message });
      }
    }

    if (validRevokes.length === 0) {
      return 0;
    }

    return await userBadgeRepository.batchRevokeBadges(validRevokes);
  }
}

module.exports = new BadgeService();
