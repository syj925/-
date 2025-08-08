const postService = require('../services/post.service');
const { ResponseUtil } = require('../utils');
const JsonUtil = require('../utils/json.util');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../config/logger');

/**
 * 帖子控制器
 */
class PostController {
  /**
   * 创建帖子
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async createPost(req, res, next) {
    try {
      const userId = req.user.id;
      const { title, content, category_id, topics, location, images, is_anonymous } = req.body;

      // 获取审核设置
      const { Setting } = require('../models');
      const auditSettings = await Setting.findAll({
        where: {
          key: ['forceManualAudit', 'enableSmartAudit', 'autoApproveKeywords', 'autoRejectKeywords']
        }
      });

      // 转换设置为对象
      const settings = {};
      auditSettings.forEach(setting => {
        let value = setting.value;
        if (setting.type === 'boolean') {
          value = value === 'true';
        }
        settings[setting.key] = value;
      });

      // 确保布尔值正确转换（防止字符串"false"被当作true）
      settings.forceManualAudit = settings.forceManualAudit === true || settings.forceManualAudit === 'true';
      settings.enableSmartAudit = settings.enableSmartAudit === true || settings.enableSmartAudit === 'true';



      // 确定帖子状态
      let postStatus = 'published'; // 默认直接发布

      // 1. 检查是否开启强制人工审核
      if (settings.forceManualAudit) {
        postStatus = 'pending';
      } else {
        // 2. 检查拒绝关键词 - 匹配的内容进入待审核而不是直接拒绝
        if (settings.autoRejectKeywords) {
          const rejectWords = settings.autoRejectKeywords.split(',').map(w => w.trim()).filter(w => w);
          const hasRejectWords = rejectWords.some(word =>
            content.toLowerCase().includes(word.toLowerCase()) ||
            (title && title.toLowerCase().includes(word.toLowerCase()))
          );

          if (hasRejectWords) {
            postStatus = 'pending';
          }
        }

        // 3. 检查自动通过关键词（只有在没有匹配拒绝关键词时才生效）
        if (postStatus !== 'pending' && settings.autoApproveKeywords) {
          const approveWords = settings.autoApproveKeywords.split(',').map(w => w.trim()).filter(w => w);
          const hasApproveWords = approveWords.some(word =>
            content.toLowerCase().includes(word.toLowerCase()) ||
            (title && title.toLowerCase().includes(word.toLowerCase()))
          );

          if (hasApproveWords) {
            postStatus = 'published';
          } else if (settings.enableSmartAudit) {
            // 4. 智能审核模式：未匹配关键词的内容进入审核
            postStatus = 'pending';
          }
        }
      }

      // 构造帖子数据
      const postData = {
        title,
        content,
        user_id: userId,
        category_id,
        status: postStatus
      };

      // 处理匿名模式
      if (is_anonymous !== undefined) {
        // 前端明确指定了匿名模式
        postData.is_anonymous = is_anonymous;
      } else {
        // 前端没有指定，检查用户的隐私设置
        const { User } = require('../models');
        const user = await User.findByPk(userId, {
          attributes: ['settings']
        });

        if (user && user.settings && user.settings.privacy) {
          postData.is_anonymous = user.settings.privacy.anonymousMode || false;
        } else {
          postData.is_anonymous = false;
        }
      }

      // 添加位置信息
      if (location) {
        postData.location_name = location.name;
        postData.longitude = location.longitude;
        postData.latitude = location.latitude;
      }

      const post = await postService.createPost(postData, images, topics);

      // 根据帖子状态返回不同的消息
      let message = '帖子发布成功';
      let needsAudit = false;

      if (post.status === 'pending') {
        message = '帖子已提交，等待管理员审核';
        needsAudit = true;
      }

      // 创建安全的返回数据，避免循环引用
      const safePostData = JsonUtil.createSafeResponseData(post);
      const responseData = {
        ...safePostData,
        needsAudit,
        auditMessage: needsAudit ? '您的帖子正在审核中，审核通过后将会显示' : null
      };

      res.status(StatusCodes.CREATED).json(ResponseUtil.success(responseData, message));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取帖子详情
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getPostDetail(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user ? req.user.id : null;
      
      const post = await postService.getPostById(id, true, userId);
      
      // 增加浏览量
      postService.incrementViewCount(id).catch(err => {
        logger.error(`增加浏览量失败: ${err.message}`, { postId: id });
      });
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(post));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新帖子
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async updatePost(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { title, content, category_id, topics, location, images } = req.body;
      
      // 构造帖子数据
      const postData = {};
      
      if (title !== undefined) postData.title = title;
      if (content !== undefined) postData.content = content;
      if (category_id !== undefined) postData.category_id = category_id;
      
      // 添加位置信息
      if (location) {
        postData.location_name = location.name;
        postData.longitude = location.longitude;
        postData.latitude = location.latitude;
      }
      
      const post = await postService.updatePost(id, postData, images, topics, userId);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(post));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除帖子
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async deletePost(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const result = await postService.deletePost(id, userId);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取帖子列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getPosts(req, res, next) {
    try {
      // 记录请求参数
      logger.info(`获取帖子列表请求参数: ${JSON.stringify(req.query)}`);
      
      const {
        page = 1,
        pageSize = 10,
        userId,
        categoryId,
        category, // 兼容前端传递的 category 参数
        topicId,
        keyword,
        status = 'published',
        orderBy = 'createdAt',
        orderDirection = 'DESC',
        schoolFilter,
        nearbyLat,
        nearbyLng,
        nearbyDistance
      } = req.query;

      // 兼容处理：优先使用 categoryId，如果没有则使用 category
      const finalCategoryId = categoryId || category;
      
      const options = {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        userId,
        categoryId: finalCategoryId, // 使用处理后的分类ID
        topicId,
        keyword,
        status,
        orderBy,
        orderDirection,
        includeDetails: true,
        schoolFilter,
        nearbyLat: nearbyLat ? parseFloat(nearbyLat) : undefined,
        nearbyLng: nearbyLng ? parseFloat(nearbyLng) : undefined,
        nearbyDistance: nearbyDistance ? parseFloat(nearbyDistance) : undefined
      };
      
      const currentUserId = req.user ? req.user.id : null;
      logger.info(`当前用户ID: ${currentUserId}`);
      
      const result = await postService.getPosts(options, currentUserId);
      
      // 记录结果数量
      logger.info(`查询到帖子数量: ${result.list.length}, 总数: ${result.pagination.total}`);
      
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
   * 获取热门帖子
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getHotPosts(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const currentUserId = req.user ? req.user.id : null;
      
      const posts = await postService.getHotPosts(parseInt(limit, 10), currentUserId);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(posts));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取帖子评论
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getPostComments(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, pageSize = 20, sort = 'latest' } = req.query;
      const currentUserId = req.user ? req.user.id : null;

      const result = await postService.getPostComments(
        id,
        parseInt(page, 10),
        parseInt(pageSize, 10),
        currentUserId,
        sort
      );
      
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
   * 设置帖子置顶状态
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async setTopStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isTop } = req.body;
      
      const result = await postService.setTopStatus(id, isTop);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户收藏的帖子
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUserFavorites(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, pageSize = 10 } = req.query;
      
      const result = await postService.getUserFavorites(
        userId,
        parseInt(page, 10),
        parseInt(pageSize, 10)
      );
      
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
   * 获取当前用户发布的帖子
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUserPosts(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, pageSize = 10, type = 'published' } = req.query;

      const options = {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        userId,
        status: type === 'drafts' ? 'draft' : 'published',
        orderBy: 'createdAt',
        orderDirection: 'DESC',
        includeDetails: true
      };

      const result = await postService.getPosts(options, userId);

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
   * 获取用户审核记录
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUserAuditHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, pageSize = 10, status } = req.query;

      const options = {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        userId,
        auditStatus: status, // pending, rejected, published
        orderBy: 'createdAt',
        orderDirection: 'DESC',
        includeDetails: true
      };

      const result = await postService.getUserAuditHistory(options);

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
   * 获取推荐内容
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getRecommended(req, res, next) {
    try {
      const { page = 1, pageSize = 6, strategy } = req.query;
      const userId = req.user ? req.user.id : null;

      logger.info('获取推荐内容', { page, pageSize, userId, strategy });

      // 使用新的推荐服务
      const recommendationService = require('../services/recommendation.service');

      const options = {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        userId,
        strategy
      };

      const result = await recommendationService.getRecommendedPosts(options);

      res.status(StatusCodes.OK).json(ResponseUtil.page(
        result.list,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total,
        {
          strategy: result.strategy,
          adminRecommendedCount: result.adminRecommendedCount,
          algorithmRecommendedCount: result.algorithmRecommendedCount
        }
      ));
    } catch (error) {
      logger.error('获取推荐内容失败', { error: error.message });
      next(error);
    }
  }
}

module.exports = new PostController(); 