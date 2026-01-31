const topicService = require('../../services/topic.service');
const { ResponseUtil } = require('../../utils');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../../config/logger');

/**
 * 管理员话题控制器
 * 处理话题管理相关的HTTP请求
 */
class AdminTopicController {
  /**
   * 获取话题列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getTopicList(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        orderBy = 'post_count',
        orderDirection = 'DESC'
      } = req.query;

      logger.info('管理员获取话题列表', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        params: { page, limit, search, status, orderBy, orderDirection }
      });

      const result = await topicService.getAdminTopicList({
        page: parseInt(page),
        pageSize: parseInt(limit),
        keyword: search,
        status: status || undefined,
        orderBy,
        orderDirection
      });

      logger.info('话题列表查询结果', {
        topicCount: result.list?.length || 0,
        total: result.pagination?.total || 0,
        resultStructure: {
          hasListProperty: 'list' in result,
          hasPaginationProperty: 'pagination' in result,
          listType: Array.isArray(result.list) ? 'array' : typeof result.list,
          listLength: result.list?.length,
          paginationKeys: result.pagination ? Object.keys(result.pagination) : null,
          resultKeys: Object.keys(result)
        }
      });

      // 添加详细的响应数据日志
      logger.info('准备返回的响应数据结构', {
        responseCode: 0,
        responseMsg: '获取话题列表成功',
        responseDataKeys: Object.keys(result),
        listSample: result.list?.slice(0, 1) // 只记录第一条数据作为样本
      });

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(result, '获取话题列表成功')
      );
    } catch (error) {
      logger.error('获取话题列表失败:', {
        error: error.message,
        stack: error.stack,
        adminId: req.admin?.id
      });
      next(error);
    }
  }

  /**
   * 创建话题
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async createTopic(req, res, next) {
    try {
      const { name, description, cover_image, status = 'active' } = req.body;

      logger.info('管理员创建话题', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        topicData: { name, description, status }
      });

      const topic = await topicService.createTopic({
        name,
        description,
        cover_image,
        status,
        is_hot: false
      });

      logger.info('话题创建成功', { topicId: topic.id, name: topic.name });

      res.status(StatusCodes.CREATED).json(
        ResponseUtil.success(topic, '话题创建成功')
      );
    } catch (error) {
      logger.error('创建话题失败:', {
        error: error.message,
        stack: error.stack,
        adminId: req.admin?.id,
        topicData: req.body
      });
      next(error);
    }
  }

  /**
   * 更新话题
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async updateTopic(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      logger.info('管理员更新话题', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        topicId: id,
        updateData
      });

      const topic = await topicService.updateTopic(parseInt(id), updateData);

      logger.info('话题更新成功', { topicId: id });

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(topic, '话题更新成功')
      );
    } catch (error) {
      logger.error('更新话题失败:', {
        error: error.message,
        stack: error.stack,
        adminId: req.admin?.id,
        topicId: req.params?.id
      });
      next(error);
    }
  }

  /**
   * 删除话题
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async deleteTopic(req, res, next) {
    try {
      const { id } = req.params;

      logger.info('管理员删除话题', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        topicId: id
      });

      await topicService.deleteTopic(parseInt(id));

      logger.info('话题删除成功', { topicId: id });

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(null, '话题删除成功')
      );
    } catch (error) {
      logger.error('删除话题失败:', {
        error: error.message,
        stack: error.stack,
        adminId: req.admin?.id,
        topicId: req.params?.id
      });
      next(error);
    }
  }

  /**
   * 设置话题热门状态
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async setHotStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { is_hot } = req.body;

      logger.info('管理员设置话题热门状态', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        topicId: id,
        isHot: is_hot
      });

      const topic = await topicService.setHotStatus(parseInt(id), is_hot);

      const message = is_hot ? '话题已设为热门' : '话题已取消热门';
      logger.info('话题热门状态更新成功', { topicId: id, isHot: is_hot });

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(topic, message)
      );
    } catch (error) {
      logger.error('设置话题热门状态失败:', {
        error: error.message,
        stack: error.stack,
        adminId: req.admin?.id,
        topicId: req.params?.id
      });
      next(error);
    }
  }

  /**
   * 获取待审核话题图片列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async getPendingTopicImages(req, res, next) {
    try {
      const { page = 1, limit = 12 } = req.query;

      logger.info('管理员获取待审核话题图片列表', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        params: { page, limit }
      });

      const result = await topicService.getPendingImageTopics({ page, limit });

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(result, '获取待审核话题图片列表成功')
      );
    } catch (error) {
      logger.error('获取待审核话题图片列表失败:', {
        error: error.message,
        stack: error.stack,
        adminId: req.admin?.id
      });
      next(error);
    }
  }

  /**
   * 审核话题图片
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   */
  async reviewTopicImage(req, res, next) {
    try {
      const { id } = req.params;
      const { action } = req.body;

      logger.info('管理员审核话题图片', {
        adminId: req.admin.id,
        adminUsername: req.admin.username,
        topicId: id,
        action
      });

      const result = await topicService.reviewTopicImage(parseInt(id), action, req.admin.id, req.ip);

      const message = action === 'approve' ? '图片审核通过' : '图片审核拒绝';

      res.status(StatusCodes.OK).json(
        ResponseUtil.success(result, message)
      );
    } catch (error) {
      logger.error('审核话题图片失败:', {
        error: error.message,
        stack: error.stack,
        adminId: req.admin?.id,
        topicId: req.params.id,
        action: req.body.action
      });
      next(error);
    }
  }
}

module.exports = new AdminTopicController();
