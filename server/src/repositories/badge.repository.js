const { Badge, UserBadge, User } = require('../models');
const { Op, Sequelize } = require('sequelize');
const redisClient = require('../utils/redis-client');
const logger = require('../../config/logger');

/**
 * 徽章数据访问层
 */
class BadgeRepository {
  /**
   * 创建徽章
   * @param {Object} badgeData 徽章数据
   * @returns {Promise<Object>} 创建的徽章对象
   */
  async create(badgeData) {
    const badge = await Badge.create(badgeData);
    
    // 清除所有徽章相关缓存
    await this.clearAllBadgeCache();
    
    return badge;
  }

  /**
   * 根据ID查找徽章
   * @param {String} id 徽章ID
   * @returns {Promise<Object>} 徽章对象
   */
  async findById(id) {
    const cacheKey = `badge:${id}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
    } catch (err) {
      logger.warn('Redis缓存读取失败，直接查询数据库:', err.message);
    }

    const badge = await Badge.findByPk(id);
    
    if (badge) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(badge), 1800); // 缓存30分钟
      } catch (err) {
        logger.warn('Redis缓存写入失败:', err.message);
      }
    }
    
    return badge;
  }

  /**
   * 根据名称查找徽章
   * @param {String} name 徽章名称
   * @returns {Promise<Object>} 徽章对象
   */
  async findByName(name) {
    try {
      const badge = await Badge.findOne({
        where: { name }
      });
      return badge;
    } catch (err) {
      logger.error('根据名称查询徽章出错:', err);
      return null;
    }
  }

  /**
   * 获取所有徽章
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 徽章列表
   */
  async findAll(options = {}) {
    const { type, status = 'active', includeUserCount = false } = options;
    
    const whereClause = { status };
    if (type) whereClause.type = type;

    // 构建缓存键
    const cacheKey = `badges:${status}:${type || 'all'}:${includeUserCount ? 'withcount' : 'simple'}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
    } catch (err) {
      logger.warn('Redis缓存读取失败，直接查询数据库:', err.message);
    }

    let badges;
    if (includeUserCount) {
      badges = await Badge.findAll({
        where: whereClause,
        attributes: {
          include: [
            [
              Sequelize.literal(`(
                SELECT COUNT(*)
                FROM user_badges
                WHERE user_badges.badge_id = Badge.id
                AND user_badges.deleted_at IS NULL
              )`),
              'user_count'
            ]
          ]
        },
        order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
      });
    } else {
      badges = await Badge.findAll({
        where: whereClause,
        order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
      });
    }

    // 缓存结果
    try {
      await redisClient.set(cacheKey, JSON.stringify(badges), 1800); // 缓存30分钟
    } catch (err) {
      logger.warn('Redis缓存写入失败:', err.message);
    }

    return badges;
  }

  /**
   * 获取所有徽章（直接查询数据库，不使用缓存）
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 徽章列表
   */
  async findAllFromDB(options = {}) {
    const { type, status = 'active', includeUserCount = false } = options;
    
    logger.info('🔍 [管理后台] 直接查询数据库获取徽章列表，绕过缓存', { type, status, includeUserCount });
    
    const whereClause = { status };
    if (type) whereClause.type = type;

    let badges;
    if (includeUserCount) {
      badges = await Badge.findAll({
        where: whereClause,
        attributes: {
          include: [
            [
              Sequelize.literal(`(
                SELECT COUNT(*)
                FROM user_badges
                WHERE user_badges.badge_id = Badge.id
                AND user_badges.deleted_at IS NULL
              )`),
              'user_count'
            ]
          ]
        },
        order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
      });
    } else {
      badges = await Badge.findAll({
        where: whereClause,
        order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
      });
    }

    logger.info('📊 [管理后台] 数据库查询结果:', {
      badgeCount: badges.length,
      badges: badges.map(b => ({ id: b.id, name: b.name, status: b.status }))
    });

    return badges;
  }

  /**
   * 更新徽章
   * @param {String} id 徽章ID
   * @param {Object} badgeData 徽章数据
   * @returns {Promise<Object>} 更新后的徽章对象
   */
  async update(id, badgeData) {
    const badge = await Badge.findByPk(id);
    if (!badge) return null;

    await badge.update(badgeData);
    
    // 清除所有徽章相关缓存
    await this.clearAllBadgeCache();
    
    return badge;
  }

  /**
   * 删除徽章
   * @param {String} id 徽章ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async delete(id) {
    // 检查是否有用户使用此徽章
    const userCount = await UserBadge.count({ 
      where: { 
        badge_id: id,
        deleted_at: null
      } 
    });
    
    if (userCount > 0) {
      throw new Error('此徽章已被用户使用，无法删除');
    }

    const result = await Badge.destroy({ where: { id } });
    
    if (result > 0) {
      // 清除所有徽章相关缓存
      await this.clearAllBadgeCache();
    }
    
    return result > 0;
  }

  /**
   * 搜索徽章
   * @param {String} keyword 关键词
   * @param {Object} options 搜索选项
   * @returns {Promise<Array>} 徽章列表
   */
  async search(keyword, options = {}) {
    const { type, status = 'active' } = options;
    
    const whereClause = {
      [Op.and]: [
        { status },
        {
          [Op.or]: [
            { name: { [Op.like]: `%${keyword}%` } },
            { description: { [Op.like]: `%${keyword}%` } }
          ]
        }
      ]
    };
    
    if (type) whereClause[Op.and].push({ type });

    return await Badge.findAll({
      where: whereClause,
      order: [['sort_order', 'ASC']]
    });
  }

  /**
   * 获取自动授予的徽章
   * @returns {Promise<Array>} 自动授予的徽章列表
   */
  async findAutoGrantBadges() {
    const cacheKey = 'badges:auto_grant';
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
    } catch (err) {
      logger.warn('Redis缓存读取失败，直接查询数据库:', err.message);
    }

    const badges = await Badge.findAll({
      where: {
        auto_grant: true,
        status: 'active'
      },
      order: [['sort_order', 'ASC']]
    });

    // 缓存结果
    try {
      await redisClient.set(cacheKey, JSON.stringify(badges), 3600); // 缓存1小时
    } catch (err) {
      logger.warn('Redis缓存写入失败:', err.message);
    }

    return badges;
  }

  /**
   * 批量更新徽章排序
   * @param {Array} sortData 排序数据 [{id, sort_order}, ...]
   * @returns {Promise<Boolean>} 是否成功
   */
  async updateSort(sortData) {
    // 使用事务确保所有更新成功或全部失败
    const transaction = await Badge.sequelize.transaction();
    
    try {
      for (const item of sortData) {
        await Badge.update(
          { sort_order: item.sort_order },
          { 
            where: { id: item.id },
            transaction
          }
        );
      }
      
      await transaction.commit();
      
      // 清除所有徽章相关缓存
      await this.clearAllBadgeCache();
      
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 获取徽章统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStatistics() {
    const cacheKey = 'badges:statistics';
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
    } catch (err) {
      logger.warn('Redis缓存读取失败，直接查询数据库:', err.message);
    }

    const stats = await Badge.findAll({
      attributes: [
        'type',
        'rarity',
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['type', 'rarity', 'status'],
      raw: true
    });

    // 缓存结果
    try {
      await redisClient.set(cacheKey, JSON.stringify(stats), 1800); // 缓存30分钟
    } catch (err) {
      logger.warn('Redis缓存写入失败:', err.message);
    }

    return stats;
  }

  /**
   * 根据ID数组获取徽章列表
   * @param {Array} ids 徽章ID数组
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 徽章列表
   */
  async findByIds(ids, options = {}) {
    if (!ids || ids.length === 0) {
      return [];
    }

    // 构建查询条件
    const whereCondition = {
      id: { [Op.in]: ids },
      deleted_at: null,
      ...(options.where || {})
    };

    const badges = await Badge.findAll({
      where: whereCondition,
      order: options.order || [['sort_order', 'ASC'], ['createdAt', 'DESC']],
      limit: options.limit,
      offset: options.offset
    });

    return badges.map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      color: badge.color,
      icon: badge.icon,
      type: badge.type,
      rarity: badge.rarity,
      autoGrant: badge.auto_grant,
      grantCondition: badge.grant_condition,
      sortOrder: badge.sort_order,
      status: badge.status,
      createdAt: badge.createdAt,
      updatedAt: badge.updatedAt
    }));
  }

  /**
   * 清除所有徽章相关缓存
   */
  async clearAllBadgeCache() {
    try {
      // 清除所有可能的徽章缓存键
      const patterns = [
        'badges:*',
        'badge:*',
        'badges:auto_grant',
        'badges:stats'
      ];

      for (const pattern of patterns) {
        await redisClient.deletePattern(pattern);
      }

      logger.info('🧹 已清除所有徽章相关缓存');
    } catch (err) {
      logger.warn('清除徽章缓存失败:', err.message);
    }
  }
}

module.exports = new BadgeRepository();
