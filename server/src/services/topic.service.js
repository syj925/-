const topicRepository = require('../repositories/topic.repository');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const errorCodes = require('../constants/error-codes');

/**
 * 话题服务层
 */
class TopicService {
  /**
   * 创建话题（管理员）
   * @param {Object} topicData 话题数据
   * @returns {Promise<Object>} 创建的话题对象
   */
  async createTopic(topicData) {
    // 检查话题名称是否已存在
    const topics = await topicRepository.findAll();
    const existingTopic = topics.find(topic => topic.name === topicData.name);

    if (existingTopic) {
      throw ErrorMiddleware.createError(
        '话题名称已存在',
        StatusCodes.BAD_REQUEST,
        errorCodes.TOPIC_EXISTS
      );
    }

    return await topicRepository.create(topicData);
  }

  /**
   * 创建话题（普通用户）
   * @param {Object} topicData 话题数据
   * @returns {Promise<Object>} 创建的话题对象
   */
  async createTopicByUser(topicData) {
    // 检查话题名称是否已存在
    const existingTopic = await topicRepository.findByName(topicData.name);

    if (existingTopic) {
      throw ErrorMiddleware.createError(
        '话题名称已存在',
        StatusCodes.BAD_REQUEST,
        errorCodes.TOPIC_EXISTS
      );
    }

    // 验证话题名称
    if (!topicData.name || topicData.name.trim().length < 2) {
      throw ErrorMiddleware.createError(
        '话题名称至少需要2个字符',
        StatusCodes.BAD_REQUEST,
        errorCodes.INVALID_PARAMS
      );
    }

    if (topicData.name.trim().length > 20) {
      throw ErrorMiddleware.createError(
        '话题名称不能超过20个字符',
        StatusCodes.BAD_REQUEST,
        errorCodes.INVALID_PARAMS
      );
    }

    // 设置默认值（使用现有字段结构）
    const finalTopicData = {
      name: topicData.name.trim(),
      description: topicData.description?.trim() || '',
      cover_image: topicData.cover_image || '',
      is_hot: false,
      status: 'active',
      post_count: 0,
      view_count: 0,
      hot_score: 0
    };

    return await topicRepository.create(finalTopicData);
  }

  /**
   * 根据话题名称数组查找或创建话题
   * @param {Array<String>} topicNames 话题名称数组
   * @returns {Promise<Array<Number>>} 话题ID数组
   */
  async findOrCreateByNames(topicNames) {
    if (!topicNames || topicNames.length === 0) {
      return [];
    }

    const topicIds = [];

    for (const name of topicNames) {
      // 去除空格并检查有效性
      const trimmedName = name.trim();
      if (!trimmedName) continue;

      // 检查话题名称长度
      if (trimmedName.length > 20) {
        throw ErrorMiddleware.createError(
          `话题名称"${trimmedName}"过长，不能超过20个字符`,
          StatusCodes.BAD_REQUEST,
          errorCodes.INVALID_PARAMS
        );
      }

      // 查找现有话题
      const existingTopic = await topicRepository.findByName(trimmedName);

      if (existingTopic) {
        // 话题已存在，使用现有ID
        topicIds.push(existingTopic.id);
      } else {
        // 话题不存在，创建新话题
        const newTopic = await topicRepository.create({
          name: trimmedName,
          is_hot: false,
          status: 'active'
        });
        topicIds.push(newTopic.id);
      }
    }

    return topicIds;
  }

  /**
   * 获取话题详情
   * @param {Number} id 话题ID
   * @returns {Promise<Object>} 话题对象
   */
  async getTopicById(id) {
    const topic = await topicRepository.findById(id);
    
    if (!topic) {
      throw ErrorMiddleware.createError(
        '话题不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.TOPIC_NOT_EXIST
      );
    }
    
    return topic;
  }

  /**
   * 更新话题
   * @param {Number} id 话题ID
   * @param {Object} topicData 话题数据
   * @returns {Promise<Object>} 更新后的话题对象
   */
  async updateTopic(id, topicData) {
    // 检查话题是否存在
    const topic = await topicRepository.findById(id);
    
    if (!topic) {
      throw ErrorMiddleware.createError(
        '话题不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.TOPIC_NOT_EXIST
      );
    }
    
    // 如果更新了名称，检查是否与其他话题重名
    if (topicData.name && topicData.name !== topic.name) {
      const topics = await topicRepository.findAll();
      const existingTopic = topics.find(t => t.name === topicData.name && t.id !== id);
      
      if (existingTopic) {
        throw ErrorMiddleware.createError(
          '话题名称已存在',
          StatusCodes.BAD_REQUEST,
          errorCodes.TOPIC_EXISTS
        );
      }
    }
    
    return await topicRepository.update(id, topicData);
  }

  /**
   * 删除话题
   * @param {Number} id 话题ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async deleteTopic(id) {
    try {
      return await topicRepository.delete(id);
    } catch (error) {
      if (error.message === '此话题下有帖子，无法删除') {
        throw ErrorMiddleware.createError(
          '此话题下有帖子，无法删除',
          StatusCodes.BAD_REQUEST,
          errorCodes.TOPIC_HAS_POSTS
        );
      }
      throw error;
    }
  }

  /**
   * 获取所有话题
   * @returns {Promise<Array>} 话题列表
   */
  async getAllTopics() {
    return await topicRepository.findAll();
  }

  /**
   * 获取热门话题
   * @param {Number} limit 限制数量
   * @returns {Promise<Array>} 话题列表
   */
  async getHotTopics(limit = 10) {
    return await topicRepository.findHotTopics(limit);
  }

  /**
   * 设置话题热门状态
   * @param {Number} id 话题ID
   * @param {Boolean} isHot 是否热门
   * @returns {Promise<Object>} 更新后的话题对象
   */
  async setHotStatus(id, isHot) {
    // 检查话题是否存在
    const topic = await topicRepository.findById(id);
    
    if (!topic) {
      throw ErrorMiddleware.createError(
        '话题不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.TOPIC_NOT_EXIST
      );
    }
    
    return await topicRepository.update(id, { is_hot: isHot });
  }

  /**
   * 搜索话题
   * @param {String} keyword 关键词
   * @returns {Promise<Array>} 话题列表
   */
  async searchTopics(keyword) {
    if (!keyword || keyword.trim() === '') {
      return await topicRepository.findAll();
    }
    
    return await topicRepository.search(keyword);
  }

  /**
   * 获取话题下的帖子
   * @param {Number} topicId 话题ID
   * @param {Object} options 分页选项
   * @returns {Promise<Object>} 分页结果
   */
  async getTopicPosts(topicId, options = {}) {
    // 检查话题是否存在
    const topic = await topicRepository.findById(topicId);

    if (!topic) {
      throw ErrorMiddleware.createError(
        '话题不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.TOPIC_NOT_EXIST
      );
    }

    return await topicRepository.getTopicPosts(topicId, options);
  }

  /**
   * 记录话题浏览量
   * @param {Number} topicId 话题ID
   * @returns {Promise<Object>} 更新后的话题对象
   */
  async recordTopicView(topicId) {
    const topic = await topicRepository.findById(topicId);

    if (!topic) {
      throw ErrorMiddleware.createError(
        '话题不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.TOPIC_NOT_EXIST
      );
    }

    // 增加浏览量
    const updatedTopic = await topicRepository.incrementViewCount(topicId, 1);

    // 更新热度分数
    await topicRepository.updateHotScore(topicId);

    return updatedTopic;
  }

  /**
   * 获取话题统计信息
   * @param {Number} topicId 话题ID
   * @returns {Promise<Object>} 统计信息
   */
  async getTopicStatistics(topicId) {
    const statistics = await topicRepository.getTopicStatistics(topicId);

    if (!statistics) {
      throw ErrorMiddleware.createError(
        '话题不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.TOPIC_NOT_EXIST
      );
    }

    return statistics;
  }

  /**
   * 获取趋势话题
   * @param {Number} limit 限制数量
   * @returns {Promise<Array>} 话题列表
   */
  async getTrendingTopics(limit = 10) {
    return await topicRepository.findTrendingTopics(limit);
  }

  /**
   * 分页获取话题列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async getTopicList(options = {}) {
    return await topicRepository.findAndCountAll(options);
  }

  /**
   * 更新话题帖子数量
   * @param {Number} topicId 话题ID
   * @param {Number} increment 增量（可为负数）
   * @returns {Promise<Boolean>} 是否成功
   */
  async updatePostCount(topicId, increment = 1) {
    const success = await topicRepository.incrementPostCount(topicId, increment);

    if (success) {
      // 更新热度分数
      await topicRepository.updateHotScore(topicId);
    }

    return success;
  }
}

module.exports = new TopicService(); 