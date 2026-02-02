const { Topic, Post, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const redisClient = require('../utils/redis-client');
const cacheService = require('../services/cache.service');
const logger = require('../../config/logger');

/**
 * 话题数据访问层
 */
class TopicRepository {
  /**
   * 创建话题
   * @param {Object} topicData 话题数据
   * @returns {Promise<Object>} 创建的话题对象
   */
  async create(topicData) {
    const topic = await Topic.create(topicData);
    
    // 清除缓存
    await cacheService.clearTopicCache();
    
    return topic;
  }

  /**
   * 根据ID查找话题
   * @param {Number} id 话题ID
   * @returns {Promise<Object>} 话题对象
   */
  async findById(id) {
    // 尝试从缓存获取
    const cacheKey = `topic:${id}`;
    const cachedTopic = await redisClient.get(cacheKey);

    if (cachedTopic) {
      try {
        // Redis客户端已经自动反序列化了数据，直接使用
        if (typeof cachedTopic === 'object' && cachedTopic !== null) {
          return cachedTopic;
        } else if (typeof cachedTopic === 'string') {
          // 兼容旧格式的字符串数据
          return JSON.parse(cachedTopic);
        } else {
          // 其他类型的数据，清除缓存
          logger.warn(`缓存数据类型异常，清除缓存: ${cacheKey}`, { type: typeof cachedTopic });
          await redisClient.del(cacheKey);
        }
      } catch (error) {
        // 如果缓存数据格式错误，删除缓存并继续从数据库获取
        logger.warn(`缓存数据格式错误，清除缓存: ${cacheKey}`, error.message);
        await redisClient.del(cacheKey);
      }
    }

    const topic = await Topic.findByPk(id);

    // 缓存结果（不需要手动JSON.stringify，Redis客户端会自动处理）
    if (topic) {
      await redisClient.set(cacheKey, topic, 3600); // 缓存1小时
    }

    return topic;
  }

  /**
   * 根据名称查找话题
   * @param {String} name 话题名称
   * @returns {Promise<Object>} 话题对象
   */
  async findByName(name) {
    // 尝试从缓存获取
    const cacheKey = `topic:name:${name}`;
    const cachedTopic = await redisClient.get(cacheKey);

    if (cachedTopic) {
      try {
        // Redis客户端已经自动反序列化了数据，直接使用
        if (typeof cachedTopic === 'object' && cachedTopic !== null) {
          return cachedTopic;
        } else if (typeof cachedTopic === 'string') {
          // 兼容旧格式的字符串数据
          return JSON.parse(cachedTopic);
        } else {
          // 其他类型的数据，清除缓存
          logger.warn(`缓存数据类型异常，清除缓存: ${cacheKey}`, { type: typeof cachedTopic });
          await redisClient.del(cacheKey);
        }
      } catch (error) {
        // 如果缓存数据格式错误，删除缓存并继续从数据库获取
        logger.warn(`缓存数据格式错误，清除缓存: ${cacheKey}`, error.message);
        await redisClient.del(cacheKey);
      }
    }

    const topic = await Topic.findOne({
      where: {
        name: name
      }
    });

    // 缓存结果（不需要手动JSON.stringify，Redis客户端会自动处理）
    if (topic) {
      await redisClient.set(cacheKey, topic, 3600); // 缓存1小时
    }

    return topic;
  }

  /**
   * 根据多个ID查找话题
   * @param {Array<Number>} ids 话题ID数组
   * @returns {Promise<Array>} 话题对象数组
   */
  async findByIds(ids) {
    return await Topic.findAll({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });
  }

  /**
   * 更新话题
   * @param {Number} id 话题ID
   * @param {Object} topicData 话题数据
   * @returns {Promise<Object>} 更新后的话题对象
   */
  async update(id, topicData) {
    const topic = await Topic.findByPk(id);
    if (!topic) return null;
    
    await topic.update(topicData);
    
    // 清除缓存
    await cacheService.clearTopicCache(id);
    
    return topic;
  }

  /**
   * 删除话题
   * @param {Number} id 话题ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async delete(id) {
    // 检查话题是否有关联的帖子
    const topic = await Topic.findByPk(id, {
      include: [
        {
          model: Post,
          as: 'posts',
          required: false
        }
      ]
    });
    
    if (!topic) return false;
    
    if (topic.posts && topic.posts.length > 0) {
      throw new Error('此话题下有帖子，无法删除');
    }
    
    const result = await Topic.destroy({ where: { id } });
    
    // 清除缓存
    if (result > 0) {
      await cacheService.clearTopicCache(id);
    }
    
    return result > 0;
  }

  /**
   * 获取所有话题
   * @returns {Promise<Array>} 话题列表
   */
  async findAll() {
    // 尝试从缓存获取
    const cacheKey = 'topics:all';
    const cachedTopics = await redisClient.get(cacheKey);

    if (cachedTopics) {
      try {
        // Redis客户端已经自动反序列化了数据，直接使用
        if (Array.isArray(cachedTopics)) {
          return cachedTopics;
        } else if (typeof cachedTopics === 'string') {
          // 兼容旧格式的字符串数据
          return JSON.parse(cachedTopics);
        } else {
          // 其他类型的数据，清除缓存
          logger.warn(`缓存数据类型异常，清除缓存: ${cacheKey}`, { type: typeof cachedTopics });
          await redisClient.del(cacheKey);
        }
      } catch (error) {
        // 如果缓存数据格式错误，删除缓存并继续从数据库获取
        logger.warn(`缓存数据格式错误，清除缓存: ${cacheKey}`, error.message);
        await redisClient.del(cacheKey);
      }
    }

    const topics = await Topic.findAll({
      order: [
        ['post_count', 'DESC'],
        ['created_at', 'DESC']
      ]
    });

    // 缓存结果（不需要手动JSON.stringify，Redis客户端会自动处理）
    await redisClient.set(cacheKey, topics, 1800); // 缓存30分钟
    
    return topics;
  }

  /**
   * 获取热门话题
   * @param {Number} limit 限制数量
   * @returns {Promise<Array>} 话题列表
   */
  async findHotTopics(limit = 10) {
    // 尝试从缓存获取
    const cacheKey = `topics:hot:${limit}`;

    try {
      const cachedTopics = await redisClient.get(cacheKey);

      if (cachedTopics) {
        // 如果缓存数据是数组，直接返回
        if (Array.isArray(cachedTopics)) {
          return cachedTopics;
        }
        // 如果是字符串，尝试解析
        if (typeof cachedTopics === 'string') {
          return JSON.parse(cachedTopics);
        }
      }
    } catch (error) {
      logger.warn(`获取热门话题缓存失败: ${error.message}，将清除缓存并重新查询`);
      // 清除有问题的缓存
      await redisClient.del(cacheKey);
    }

    const topics = await Topic.findAll({
      where: {
        is_hot: true
      },
      order: [
        ['hot_score', 'DESC'],
        ['post_count', 'DESC']
      ],
      limit
    });

    // 缓存结果
    try {
      await redisClient.set(cacheKey, JSON.stringify(topics), 1800); // 缓存30分钟
    } catch (error) {
      logger.warn(`缓存热门话题失败: ${error.message}`);
    }

    return topics;
  }

  /**
   * 搜索话题
   * @param {String} keyword 关键词
   * @returns {Promise<Array>} 话题列表
   */
  async search(keyword) {
    return await Topic.findAll({
      where: {
        name: { [Op.like]: `%${keyword}%` }
      },
      order: [
        ['post_count', 'DESC'],
        ['created_at', 'DESC']
      ]
    });
  }

  /**
   * 增加话题帖子数量
   * @param {Number} id 话题ID
   * @param {Number} value 增加的数量，可以为负数
   * @param {Object} transaction 事务对象
   * @returns {Promise<Boolean>} 是否成功
   */
  async incrementPostCount(id, value = 1, transaction = null) {
    try {
      // 验证value参数防止SQL注入
      const safeValue = parseInt(value, 10);
      if (isNaN(safeValue)) {
        logger.warn(`无效的value参数: ${value}`, { topicId: id });
        return false;
      }
      
      // 使用原子操作更新计数，避免并发问题
      const [affectedRows] = await Topic.update(
        {
          post_count: sequelize.literal(`GREATEST(0, post_count + ${safeValue})`)
        },
        {
          where: { id },
          transaction
        }
      );

      if (affectedRows === 0) return false;

      // 清除缓存
      await cacheService.clearTopicCache(id);

      return true;
    } catch (error) {
      logger.error(`增加话题帖子数量失败: ${error.message}`, { topicId: id, value });
      return false;
    }
  }

  /**
   * 获取话题的帖子列表
   * @param {Number} topicId 话题ID
   * @param {Object} options 分页选项
   * @returns {Promise<Object>} 分页结果
   */
  async getTopicPosts(topicId, options = {}) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'createdAt',
      orderDirection = 'DESC'
    } = options;

    const topic = await Topic.findByPk(topicId);
    if (!topic) return null;

    const { rows, count } = await Post.findAndCountAll({
      include: [
        {
          model: Topic,
          as: 'topics',
          through: { attributes: [] },
          where: { id: topicId }
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'nickname', 'username', 'avatar']
        }
      ],
      where: {
        status: 'published'
      },
      order: [[orderBy, orderDirection]],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      distinct: true
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
   * 增加话题浏览量
   * @param {Number} id 话题ID
   * @param {Number} value 增加的数量
   * @returns {Promise<Object>} 更新后的话题对象
   */
  async incrementViewCount(id, value = 1) {
    const topic = await Topic.findByPk(id);
    if (!topic) return null;

    topic.view_count = Math.max(0, topic.view_count + value);
    await topic.save();

    // 清除缓存
    await cacheService.clearTopicCache(id);

    return topic;
  }

  /**
   * 计算并更新话题热度分数
   * @param {Number} id 话题ID
   * @returns {Promise<Object>} 更新后的话题对象
   */
  async updateHotScore(id) {
    const topic = await Topic.findByPk(id);
    if (!topic) return null;

    // 热度计算公式：帖子数量 * 0.6 + 浏览量 * 0.4 / 100
    const hotScore = (topic.post_count * 0.6) + (topic.view_count * 0.4 / 100);

    topic.hot_score = hotScore;
    await topic.save();

    // 清除缓存
    await cacheService.clearTopicCache(id);

    return topic;
  }

  /**
   * 获取话题统计信息
   * @param {Number} id 话题ID
   * @returns {Promise<Object>} 统计信息
   */
  async getTopicStatistics(id) {
    const topic = await Topic.findByPk(id, {
      include: [
        {
          model: Post,
          as: 'posts',
          attributes: ['id', 'created_at'],
          where: { status: 'published' },
          required: false
        }
      ]
    });

    if (!topic) return null;

    // 计算最近7天的帖子数量
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPosts = topic.posts ? topic.posts.filter(post =>
      new Date(post.created_at) >= sevenDaysAgo
    ).length : 0;

    return {
      id: topic.id,
      name: topic.name,
      description: topic.description,
      post_count: topic.post_count,
      view_count: topic.view_count,
      hot_score: topic.hot_score,
      is_hot: topic.is_hot,
      recent_posts_count: recentPosts,
      created_at: topic.created_at,
      updated_at: topic.updated_at
    };
  }

  /**
   * 获取热门话题（按热度分数排序）
   * @param {Number} limit 限制数量
   * @returns {Promise<Array>} 话题列表
   */
  async findTrendingTopics(limit = 10) {
    const cacheKey = `topics:trending:${limit}`;
    const cachedTopics = await redisClient.get(cacheKey);

    if (cachedTopics) {
      try {
        // Redis客户端已经自动反序列化了数据，直接使用
        if (Array.isArray(cachedTopics)) {
          return cachedTopics;
        } else if (typeof cachedTopics === 'string') {
          // 兼容旧格式的字符串数据
          return JSON.parse(cachedTopics);
        } else {
          // 其他类型的数据，清除缓存
          logger.warn(`缓存数据类型异常，清除缓存: ${cacheKey}`, { type: typeof cachedTopics });
          await redisClient.del(cacheKey);
        }
      } catch (error) {
        // 如果缓存数据格式错误，删除缓存并继续从数据库获取
        logger.warn(`缓存数据格式错误，清除缓存: ${cacheKey}`, error.message);
        await redisClient.del(cacheKey);
      }
    }

    const topics = await Topic.findAll({
      where: {
        status: 'active'
      },
      order: [
        ['hot_score', 'DESC'],
        ['post_count', 'DESC'],
        ['view_count', 'DESC']
      ],
      limit
    });

    // 缓存结果（不需要手动JSON.stringify，Redis客户端会自动处理）
    await redisClient.set(cacheKey, topics, 1800); // 缓存30分钟

    return topics;
  }

  /**
   * 分页获取话题列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async findAndCountAll(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      keyword = '',
      status = 'active',
      is_hot,
      orderBy = 'hot_score',
      orderDirection = 'DESC'
    } = options;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (keyword) {
      where.name = { [Op.like]: `%${keyword}%` };
    }

    if (typeof is_hot === 'boolean') {
      where.is_hot = is_hot;
    }

    const { rows, count } = await Topic.findAndCountAll({
      where,
      order: [[orderBy, orderDirection]],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });

    return {
      list: rows,
      pagination: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        total: count,
        pages: Math.ceil(count / pageSize)
      }
    };
  }

  /**
   * 查找待审核图片的话题
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async findPendingImageTopics(options = {}) {
    const { page = 1, limit = 12 } = options;
    const offset = (page - 1) * limit;

    try {
      const { rows, count } = await Topic.findAndCountAll({
        where: {
          image_status: 'pending',
          pending_image: {
            [Op.ne]: null
          }
        },
        attributes: [
          'id', 'name', 'description', 'cover_image',
          'pending_image', 'image_status', 'post_count',
          'view_count', 'status', 'createdAt', 'updatedAt'
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [['updatedAt', 'DESC']]
      });

      return {
        list: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('查找待审核图片话题失败:', error);
      throw error;
    }
  }
}

module.exports = new TopicRepository(); 