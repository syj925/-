const topicRepository = require('../repositories/topic.repository');
const auditService = require('./admin/audit.service');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const errorCodes = require('../constants/error-codes');
const StatusInjectionUtil = require('../utils/status-injection.util');
const statusCacheService = require('./status-cache.service');

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

    // 处理图片审核逻辑
    const processedTopicData = { ...topicData };

    if (topicData.cover_image) {
      // 用户上传了图片，需要审核
      processedTopicData.pending_image = topicData.cover_image;
      processedTopicData.cover_image = null; // 清空正式封面，等待审核
      processedTopicData.image_status = 'pending';
    } else {
      // 没有上传图片，使用默认状态
      processedTopicData.image_status = 'default';
    }

    // 设置默认值（使用现有字段结构）
    const finalTopicData = {
      name: processedTopicData.name.trim(),
      description: processedTopicData.description?.trim() || '',
      cover_image: processedTopicData.cover_image || null,
      pending_image: processedTopicData.pending_image || null,
      image_status: processedTopicData.image_status,
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
   * @param {String} userId 用户ID（可选）
   * @returns {Promise<Object>} 分页结果
   */
  async getTopicPosts(topicId, options = {}, userId = null) {
    // 检查话题是否存在
    const topic = await topicRepository.findById(topicId);

    if (!topic) {
      throw ErrorMiddleware.createError(
        '话题不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.TOPIC_NOT_EXIST
      );
    }

    const result = await topicRepository.getTopicPosts(topicId, options);

    // 🔧 使用StatusCacheService添加用户交互状态
    if (result.list && result.list.length > 0) {
      await StatusInjectionUtil.injectPostStatus(result.list, userId, statusCacheService);
    }

    return result;
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

  // ==================== 管理员专用方法 ====================

  /**
   * 管理员获取话题列表（支持高级筛选）
   * @param {Object} options 查询选项
   * @param {Number} options.page 页码
   * @param {Number} options.pageSize 每页数量
   * @param {String} options.keyword 搜索关键词
   * @param {String} options.status 状态筛选
   * @param {String} options.orderBy 排序字段
   * @param {String} options.orderDirection 排序方向
   * @returns {Promise<Object>} 分页结果
   */
  async getAdminTopicList(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      keyword = '',
      status = '',
      orderBy = 'post_count',
      orderDirection = 'DESC'
    } = options;

    // 构建查询条件 - 直接传递给仓库层
    const queryOptions = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      keyword: keyword || '',
      status: status || undefined, // 不传递空字符串，让仓库层使用默认值
      orderBy,
      orderDirection
    };

    const result = await topicRepository.findAndCountAll(queryOptions);

    // 仓库层已经返回了正确的格式 {list: rows, pagination: {...}}
    return result;
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
        errorCodes.TOPIC_NOT_FOUND
      );
    }

    // 更新热门状态
    const updatedTopic = await topicRepository.update(id, { is_hot: isHot });

    return updatedTopic;
  }

  /**
   * 获取待审核图片的话题列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 待审核话题列表
   */
  async getPendingImageTopics(options = {}) {
    const { page = 1, limit = 12 } = options;

    return await topicRepository.findPendingImageTopics({
      page: parseInt(page),
      limit: parseInt(limit)
    });
  }

  /**
   * 审核话题图片
   * @param {Number} topicId 话题ID
   * @param {String} action 审核动作：approve 或 reject
   * @param {String} adminId 管理员ID
   * @param {String} ipAddress 操作IP
   * @returns {Promise<Object>} 审核结果
   */
  async reviewTopicImage(topicId, action, adminId = null, ipAddress = null) {
    if (!['approve', 'reject'].includes(action)) {
      throw ErrorMiddleware.createError(
        '无效的审核动作',
        StatusCodes.BAD_REQUEST,
        errorCodes.INVALID_PARAMS
      );
    }

    const topic = await topicRepository.findById(topicId);
    if (!topic) {
      throw ErrorMiddleware.createError(
        '话题不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.TOPIC_NOT_FOUND
      );
    }

    // 检查是否有待审核的图片
    if (!topic.pending_image || topic.image_status !== 'pending') {
      throw ErrorMiddleware.createError(
        '该话题没有待审核的图片',
        StatusCodes.BAD_REQUEST,
        errorCodes.INVALID_PARAMS
      );
    }

    let updateData;
    let reason;

    if (action === 'approve') {
      // 审核通过：将待审核图片设为正式封面
      updateData = {
        cover_image: topic.pending_image,
        pending_image: null,
        image_status: 'approved'
      };
      reason = '话题封面审核通过';
    } else {
      // 审核拒绝：清除待审核图片
      updateData = {
        pending_image: null,
        image_status: 'rejected'
      };
      reason = '话题封面审核拒绝';
    }

    const updatedTopic = await topicRepository.update(topicId, updateData);

    // 记录审核日志
    if (adminId) {
      await auditService.createLog({
        admin_id: adminId,
        target_type: 'topic_image',
        target_id: topicId,
        action,
        reason,
        ip_address: ipAddress
      });
    }

    return updatedTopic;
  }
}

module.exports = new TopicService();
