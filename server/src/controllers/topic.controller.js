const topicService = require('../services/topic.service');
const { ResponseUtil } = require('../utils');
const { StatusCodes } = require('http-status-codes');

/**
 * 话题控制器
 */
class TopicController {
  /**
   * 创建话题
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async createTopic(req, res, next) {
    try {
      const { name, is_hot } = req.body;

      const topic = await topicService.createTopic({
        name,
        is_hot: is_hot || false
      });

      res.status(StatusCodes.CREATED).json(ResponseUtil.success(topic));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 创建话题（普通用户）
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async createTopicByUser(req, res, next) {
    try {
      const topicData = req.body;

      // 普通用户创建的话题默认为活跃状态
      topicData.status = 'active';
      topicData.is_hot = false;

      const topic = await topicService.createTopicByUser(topicData);

      res.status(StatusCodes.CREATED).json(ResponseUtil.success(topic, '话题创建成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取话题详情
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getTopicById(req, res, next) {
    try {
      const { id } = req.params;
      
      const topic = await topicService.getTopicById(parseInt(id, 10));
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(topic));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新话题
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async updateTopic(req, res, next) {
    try {
      const { id } = req.params;
      const { name, is_hot } = req.body;
      
      const topicData = {};
      if (name !== undefined) topicData.name = name;
      if (is_hot !== undefined) topicData.is_hot = is_hot;
      
      const topic = await topicService.updateTopic(parseInt(id, 10), topicData);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(topic));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除话题
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async deleteTopic(req, res, next) {
    try {
      const { id } = req.params;
      
      const result = await topicService.deleteTopic(parseInt(id, 10));
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取所有话题
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getAllTopics(req, res, next) {
    try {
      const { page, pageSize, keyword, status, is_hot, orderBy, orderDirection } = req.query;

      const options = {
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
        keyword,
        status: status || 'active',
        orderBy: orderBy || 'hot_score',
        orderDirection: orderDirection || 'DESC'
      };

      // 处理 is_hot 参数
      if (is_hot !== undefined) {
        options.is_hot = is_hot === 'true';
      }

      const result = await topicService.getTopicList(options);

      res.status(StatusCodes.OK).json(ResponseUtil.page(
        result.list,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取热门话题
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getHotTopics(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      
      const topics = await topicService.getHotTopics(parseInt(limit, 10));
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(topics));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 设置话题热门状态
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async setHotStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isHot } = req.body;
      
      const topic = await topicService.setHotStatus(parseInt(id, 10), isHot);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(topic));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 搜索话题
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async searchTopics(req, res, next) {
    try {
      const { keyword } = req.query;
      
      const topics = await topicService.searchTopics(keyword);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(topics));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取话题下的帖子
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getTopicPosts(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, pageSize = 10, orderBy = 'createdAt', orderDirection = 'DESC' } = req.query;

      const options = {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        orderBy,
        orderDirection
      };

      const result = await topicService.getTopicPosts(parseInt(id, 10), options);

      res.status(StatusCodes.OK).json(ResponseUtil.page(
        result.list,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 记录话题浏览量
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async recordTopicView(req, res, next) {
    try {
      const { id } = req.params;

      const topic = await topicService.recordTopicView(parseInt(id, 10));

      res.status(StatusCodes.OK).json(ResponseUtil.success({
        id: topic.id,
        view_count: topic.view_count
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取话题统计信息
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getTopicStatistics(req, res, next) {
    try {
      const { id } = req.params;

      const statistics = await topicService.getTopicStatistics(parseInt(id, 10));

      res.status(StatusCodes.OK).json(ResponseUtil.success(statistics));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取趋势话题
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getTrendingTopics(req, res, next) {
    try {
      const { limit = 10 } = req.query;

      const topics = await topicService.getTrendingTopics(parseInt(limit, 10));

      res.status(StatusCodes.OK).json(ResponseUtil.success(topics));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TopicController(); 