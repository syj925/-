const { UserBadge, Badge, User } = require('../models');
const { Op } = require('sequelize');
const redisClient = require('../utils/redis-client');
const logger = require('../../config/logger');

/**
 * 用户徽章数据访问层
 */
class UserBadgeRepository {
  /**
   * 授予用户徽章
   * @param {String} userId 用户ID
   * @param {String} badgeId 徽章ID
   * @param {String} grantedBy 授予者ID，null表示系统自动授予
   * @returns {Promise<Object>} 创建的用户徽章对象
   */
  async grantBadge(userId, badgeId, grantedBy = null) {

    
    // 检查是否已经存在记录（包括软删除的）
    const existing = await UserBadge.findOne({
      where: { 
        user_id: userId, 
        badge_id: badgeId
      },
      paranoid: false  // 包括软删除的记录
    });
    


    if (existing) {
      if (!existing.deletedAt) {
        throw new Error('用户已拥有该徽章');
      }
      
      // 如果记录被软删除，恢复它

      await existing.restore();
      
      // 更新授予者和其他字段
      await existing.update({
        granted_by: grantedBy,
        is_visible: true,
        display_order: 0,
        granted_at: new Date()
      });

      // 清除用户徽章缓存
      await this.clearUserBadgeCache(userId);
      

      return existing;
    }

    // 创建新记录
    const userBadge = await UserBadge.create({
      user_id: userId,
      badge_id: badgeId,
      granted_by: grantedBy,
      is_visible: true,
      display_order: 0
    });

    // 清除用户徽章缓存
    await this.clearUserBadgeCache(userId);
    

    return userBadge;
  }

  /**
   * 撤销用户徽章
   * @param {String} userId 用户ID
   * @param {String} badgeId 徽章ID
   * @returns {Promise<Boolean>} 是否成功撤销
   */
  async revokeBadge(userId, badgeId) {
    logger.info(`🗑️  开始撤销徽章（老方法） - userId: ${userId}, badgeId: ${badgeId}`);
    
    const result = await UserBadge.destroy({
      where: { 
        user_id: userId, 
        badge_id: badgeId 
      }
    });

    logger.info(`🗑️  软删除操作结果（老方法）: ${result} 条记录被删除`);

    if (result > 0) {
      await this.clearUserBadgeCache(userId);
      logger.info(`✅ 徽章撤销成功（老方法） - userId: ${userId}, badgeId: ${badgeId}`);
    } else {
      logger.info(`❌ 徽章撤销失败（老方法） - userId: ${userId}, badgeId: ${badgeId}`);
    }

    return result > 0;
  }

  /**
   * 获取用户徽章列表
   * @param {String} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 用户徽章列表
   */
  async getUserBadges(userId, options = {}) {
    const { includeHidden = false, type } = options;
    
    const cacheKey = `user:${userId}:badges:${includeHidden ? 'all' : 'visible'}${type ? `:${type}` : ''}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const parsedData = typeof cached === 'string' ? JSON.parse(cached) : cached;
        return parsedData;
      }
    } catch (err) {
      logger.warn('Redis缓存读取失败，直接查询数据库:', err.message);
    }

    const whereClause = { user_id: userId };
    if (!includeHidden) {
      whereClause.is_visible = true;
    }

    const badgeWhere = { status: 'active' };
    if (type) {
      badgeWhere.type = type;
    }

    const userBadges = await UserBadge.findAll({
      where: whereClause,
      include: [{
        model: Badge,
        as: 'badge',
        where: badgeWhere,
        required: true
      }],
      order: [['display_order', 'ASC'], ['granted_at', 'DESC']],
      paranoid: true  // 明确排除软删除记录
    });

    // 缓存结果
    try {
      const cacheData = JSON.stringify(userBadges);
      await redisClient.set(cacheKey, cacheData, 1800); // 缓存30分钟
    } catch (err) {
      logger.warn('Redis缓存写入失败:', err.message);
    }
    
    return userBadges;
  }

  /**
   * 获取用户徽章列表（直接查询数据库，不使用缓存）
   * @param {String} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 用户徽章列表
   */
  async getUserBadgesFromDB(userId, options = {}) {
    const { includeHidden = false, type } = options;
    
    logger.info('🔍 [管理后台] 直接查询数据库获取用户徽章，绕过缓存', { 
      userId, 
      includeHidden, 
      type 
    });

    const whereClause = { user_id: userId };
    if (!includeHidden) {
      whereClause.is_visible = true;
    }

    const badgeWhere = { status: 'active' };
    if (type) {
      badgeWhere.type = type;
    }

    const userBadges = await UserBadge.findAll({
      where: whereClause,
      include: [{
        model: Badge,
        as: 'badge',
        where: badgeWhere,
        required: true
      }],
      order: [['display_order', 'ASC'], ['granted_at', 'DESC']],
      paranoid: true  // 明确排除软删除记录
    });

    logger.info('📊 [管理后台] 用户徽章查询结果:', {
      userId,
      badgeCount: userBadges.length,
      badges: userBadges.map(ub => ({
        id: ub.id,
        badge_id: ub.badge_id,
        badge_name: ub.badge?.name,
        is_visible: ub.is_visible,
        deleted_at: ub.deleted_at
      }))
    });
    
    return userBadges;
  }

  /**
   * 检查用户是否拥有特定徽章
   * @param {String} userId 用户ID
   * @param {String} badgeId 徽章ID
   * @returns {Promise<Boolean>} 是否拥有徽章
   */
  async hasBadge(userId, badgeId) {
    const userBadge = await UserBadge.findOne({
      where: { 
        user_id: userId, 
        badge_id: badgeId,
        deleted_at: null
      }
    });

    return !!userBadge;
  }

  /**
   * 更新用户徽章显示设置
   * @param {String} userId 用户ID
   * @param {String} badgeId 徽章ID
   * @param {Object} settings 设置项
   * @returns {Promise<Object>} 更新后的用户徽章对象
   */
  async updateDisplaySettings(userId, badgeId, settings) {
    const userBadge = await UserBadge.findOne({
      where: { 
        user_id: userId, 
        badge_id: badgeId,
        deleted_at: null
      }
    });

    if (!userBadge) {
      throw new Error('用户徽章不存在');
    }

    await userBadge.update(settings);
    
    // 清除缓存
    await this.clearUserBadgeCache(userId);
    
    return userBadge;
  }

  /**
   * 批量更新徽章显示顺序
   * @param {String} userId 用户ID
   * @param {Array} badgeOrders 徽章顺序数组 [{badgeId, displayOrder}, ...]
   * @returns {Promise<Boolean>} 是否成功
   */
  async updateDisplayOrder(userId, badgeOrders) {
    const transaction = await UserBadge.sequelize.transaction();
    
    try {
      for (const { badgeId, displayOrder } of badgeOrders) {
        await UserBadge.update(
          { display_order: displayOrder },
          { 
            where: { 
              user_id: userId, 
              badge_id: badgeId,
              deleted_at: null
            },
            transaction 
          }
        );
      }
      
      await transaction.commit();
      
      // 清除缓存
      await this.clearUserBadgeCache(userId);
      
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 获取用户徽章数量统计
   * @param {String} userId 用户ID
   * @returns {Promise<Object>} 徽章数量统计
   */
  async getUserBadgeStats(userId) {
    const cacheKey = `user:${userId}:badge_stats`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
    } catch (err) {
      logger.warn('Redis缓存读取失败，直接查询数据库:', err.message);
    }

    const stats = await UserBadge.findAll({
      where: { user_id: userId },
      include: [{
        model: Badge,
        as: 'badge',
        attributes: ['type', 'rarity']
      }],
      attributes: []
    });

    const result = {
      total: stats.length,
      visible: stats.filter(ub => ub.is_visible).length,
      byType: {},
      byRarity: {}
    };

    stats.forEach(userBadge => {
      const badge = userBadge.badge;
      
      // 按类型统计
      if (!result.byType[badge.type]) {
        result.byType[badge.type] = 0;
      }
      result.byType[badge.type]++;
      
      // 按稀有度统计
      if (!result.byRarity[badge.rarity]) {
        result.byRarity[badge.rarity] = 0;
      }
      result.byRarity[badge.rarity]++;
    });

    // 缓存结果
    try {
      await redisClient.set(cacheKey, JSON.stringify(result), 1800); // 缓存30分钟
    } catch (err) {
      logger.warn('Redis缓存写入失败:', err.message);
    }

    return result;
  }

  /**
   * 获取徽章的用户列表
   * @param {String} badgeId 徽章ID
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 拥有该徽章的用户列表
   */
  async getBadgeUsers(badgeId, options = {}) {
    const { page = 1, limit = 20, orderBy = 'granted_at', orderDirection = 'DESC' } = options;
    
    const offset = (page - 1) * limit;
    
    const userBadges = await UserBadge.findAndCountAll({
      where: { badge_id: badgeId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }],
      order: [[orderBy, orderDirection]],
      limit: parseInt(limit),
      offset: offset
    });

    return {
      users: userBadges.rows,
      total: userBadges.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(userBadges.count / limit)
    };
  }

  /**
   * 清除用户徽章缓存
   * @param {String} userId 用户ID
   */
  async clearUserBadgeCache(userId) {
    try {
      // 清除特定用户的徽章缓存
      const userBadgePattern = `user:${userId}:badges*`;
      const deleteResult = await redisClient.deletePattern(userBadgePattern);
      
      if (deleteResult > 0) {
        logger.info(`已清除用户 ${userId} 的徽章缓存: ${deleteResult} 个key`);
      }
      
    } catch (err) {
      logger.error('Redis缓存清除失败:', { userId, error: err.message });
    }
  }

  /**
   * 强制清除所有用户徽章相关缓存
   */
  async clearAllUserBadgeCache() {
    try {
      const pattern = `user:*:badges*`;
      const deleteResult = await redisClient.deletePattern(pattern);
      
      if (deleteResult > 0) {
        logger.info(`已清除所有用户徽章缓存: ${deleteResult} 个key`);
      }
    } catch (err) {
      logger.error('清除所有用户徽章缓存失败:', err.message);
    }
  }

  /**
   * 批量授予用户徽章
   * @param {Array} grants 授予数据 [{userId, badgeId, grantedBy}, ...]
   * @returns {Promise<Array>} 创建的用户徽章列表
   */
  async batchGrantBadges(grants) {
    const transaction = await UserBadge.sequelize.transaction();
    const results = [];
    
    try {
      for (const grant of grants) {
        // 检查是否已经存在记录（包括软删除的）
        const existing = await UserBadge.findOne({
          where: { 
            user_id: grant.userId, 
            badge_id: grant.badgeId
          },
          paranoid: false,  // 包括软删除的记录
          transaction
        });

        if (existing) {
          if (!existing.deletedAt) {
            // 已经存在且未被删除，跳过
            continue;
          }
          
          // 恢复被软删除的记录
          await existing.restore({ transaction });
          await existing.update({
            granted_by: grant.grantedBy || null,
            is_visible: true,
            display_order: 0,
            granted_at: new Date()
          }, { transaction });
          
          results.push(existing);
          
          // 清除用户缓存
          await this.clearUserBadgeCache(grant.userId);
        } else {
          // 创建新记录
          const userBadge = await UserBadge.create({
            user_id: grant.userId,
            badge_id: grant.badgeId,
            granted_by: grant.grantedBy || null,
            is_visible: true,  // 管理员授予的徽章默认可见
            display_order: 0
          }, { transaction });
          
          results.push(userBadge);
          
          // 清除用户缓存
          await this.clearUserBadgeCache(grant.userId);
        }
      }
      
      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 获取最近授予的徽章
   * @param {Number} limit 限制数量
   * @param {Number} days 天数
   * @returns {Promise<Array>} 最近授予的徽章列表
   */
  async getRecentlyGranted(limit = 10, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await UserBadge.findAll({
      where: {
        granted_at: {
          [Op.gte]: startDate
        }
      },
      include: [
        {
          model: Badge,
          as: 'badge',
          attributes: ['id', 'name', 'color', 'icon', 'rarity']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ],
      order: [['granted_at', 'DESC']],
      limit: parseInt(limit)
    });
  }

  /**
   * 根据用户ID获取徽章关联记录
   * @param {String} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 用户徽章列表
   */
  async findByUserId(userId, options = {}) {
    const cacheKey = `user_badges:${userId}:${JSON.stringify(options)}`;
    
    try {
      // 尝试从缓存获取
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('获取用户徽章缓存失败:', error.message);
    }

    // 构建查询条件
    const whereCondition = {
      user_id: userId,
      deleted_at: null,
      ...(options.where || {})
    };

    // 构建排序条件
    const order = [];
    if (options.orderBy) {
      for (const [field, direction] of Object.entries(options.orderBy)) {
        // 转换字段名（驼峰转下划线）
        const dbField = field === 'displayOrder' ? 'display_order' :
                       field === 'grantedAt' ? 'granted_at' :
                       field === 'isVisible' ? 'is_visible' : field;
        order.push([dbField, direction]);
      }
    } else {
      // 默认排序
      order.push(['display_order', 'ASC'], ['granted_at', 'DESC']);
    }

    const userBadges = await UserBadge.findAll({
      where: whereCondition,
      order: order,
      limit: options.limit,
      offset: options.offset
    });

    // 转换为标准格式
    const result = userBadges.map(ub => ({
      id: ub.id,
      userId: ub.user_id,
      badgeId: ub.badge_id,
      grantedAt: ub.granted_at,
      grantedBy: ub.granted_by,
      isVisible: ub.is_visible,
      displayOrder: ub.display_order,
      createdAt: ub.createdAt,
      updatedAt: ub.updatedAt
    }));

    // 缓存结果
    try {
      await redisClient.setex(cacheKey, 300, JSON.stringify(result)); // 缓存5分钟
    } catch (error) {
      logger.warn('设置用户徽章缓存失败:', error.message);
    }

    return result;
  }

  /**
   * 通用查询方法
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 查询结果
   */
  async findAll(options = {}) {
    const { where, order, limit, offset, include } = options;
    
    return await UserBadge.findAll({
      where,
      order,
      limit,
      offset,
      include
    });
  }

  /**
   * 撤销用户徽章
   * @param {String} userId 用户ID
   * @param {String} badgeId 徽章ID
   * @returns {Promise<Boolean>} 是否成功
   */
  async revokeUserBadge(userId, badgeId) {
    logger.info(`🗑️  开始撤销徽章 - userId: ${userId}, badgeId: ${badgeId}`);
    
    // 先检查记录是否存在（包括软删除的记录）
    const existingRecord = await UserBadge.findOne({
      where: {
        user_id: userId,
        badge_id: badgeId
      },
      paranoid: false  // 包括软删除的记录
    });

    logger.info(`🔍 撤销前记录检查结果:`, existingRecord ? {
      id: existingRecord.id,
      is_visible: existingRecord.is_visible,
      deletedAt: existingRecord.deletedAt,
      granted_at: existingRecord.granted_at
    } : '无现有记录');

    if (!existingRecord) {
      logger.info(`❌ 撤销失败 - 记录不存在: userId=${userId}, badgeId=${badgeId}`);
      return false;  // 记录不存在
    }

    // 如果记录已经被软删除，直接返回成功（视为已撤销）
    if (existingRecord.deletedAt) {
      logger.info(`⚠️  用户徽章记录已被软删除: userId=${userId}, badgeId=${badgeId}`);
      return true;
    }

    // 执行软删除
    const result = await UserBadge.destroy({
      where: {
        user_id: userId,
        badge_id: badgeId
      }
      // 使用默认软删除，不使用 force: true
    });

    logger.info(`🗑️  软删除操作结果: ${result} 条记录被删除`);

    if (result > 0) {
      // 清除用户缓存
      await this.clearUserBadgeCache(userId);
      logger.info(`✅ 徽章撤销成功 - userId: ${userId}, badgeId: ${badgeId}`);
      return true;
    }
    logger.info(`❌ 徽章撤销失败 - 软删除操作返回0: userId=${userId}, badgeId=${badgeId}`);
    return false;
  }

  /**
   * 更新用户徽章可见性
   * @param {String} userId 用户ID
   * @param {String} badgeId 徽章ID
   * @param {Boolean} isVisible 是否可见
   * @returns {Promise<Boolean>} 是否成功
   */
  async updateBadgeVisibility(userId, badgeId, isVisible) {
    const [affectedRows] = await UserBadge.update(
      { is_visible: isVisible },
      {
        where: {
          user_id: userId,
          badge_id: badgeId,
          deleted_at: null
        }
      }
    );

    if (affectedRows > 0) {
      // 清除用户缓存
      await this.clearUserBadgeCache(userId);
      return true;
    }
    return false;
  }

  /**
   * 批量撤销用户徽章
   * @param {Array} revokes 撤销数据 [{userId, badgeId}, ...]
   * @returns {Promise<Number>} 成功撤销的数量
   */
  async batchRevokeBadges(revokes) {
    const transaction = await UserBadge.sequelize.transaction();
    let successCount = 0;
    
    try {
      for (const revoke of revokes) {
        // 先检查记录是否存在（包括软删除的记录）
        const existingRecord = await UserBadge.findOne({
          where: {
            user_id: revoke.userId,
            badge_id: revoke.badgeId
          },
          paranoid: false,  // 包括软删除的记录
          transaction
        });

        if (!existingRecord) {
          continue;  // 记录不存在，跳过
        }

        // 如果记录已经被软删除，视为成功
        if (existingRecord.deletedAt) {
          successCount++;
          continue;
        }

        // 执行软删除
        const result = await UserBadge.destroy({
          where: {
            user_id: revoke.userId,
            badge_id: revoke.badgeId
          },
          transaction
          // 使用默认软删除
        });
        
        if (result > 0) {
          successCount++;
          // 清除用户缓存
          await this.clearUserBadgeCache(revoke.userId);
        }
      }
      
      await transaction.commit();
      return successCount;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new UserBadgeRepository();
