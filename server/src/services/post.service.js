const postRepository = require('../repositories/post.repository');
const postImageRepository = require('../repositories/post-image.repository');
const userRepository = require('../repositories/user.repository');
const categoryRepository = require('../repositories/category.repository');
const topicRepository = require('../repositories/topic.repository');
const commentRepository = require('../repositories/comment.repository');
const messageService = require('./message.service');
const statusCacheService = require('./status-cache.service');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const errorCodes = require('../constants/error-codes');
const logger = require('../../config/logger');

/**
 * 帖子服务层
 */
class PostService {
  /**
   * 创建帖子
   * @param {Object} postData 帖子数据
   * @param {Array<Object>} images 帖子图片数据
   * @param {Array<String>} topicNames 话题名称数组
   * @returns {Promise<Object>} 创建的帖子对象
   */
  async createPost(postData, images = [], topicNames = []) {
    // 检查用户是否存在
    const user = await userRepository.findById(postData.user_id);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    // 检查用户是否被禁用
    if (user.is_disabled) {
      throw ErrorMiddleware.createError(
        '账号已被禁用',
        StatusCodes.FORBIDDEN,
        errorCodes.USER_DISABLED
      );
    }
    
    // 检查分类是否存在（category_id为null表示"全部"分类，无需检查）
    if (postData.category_id !== null && postData.category_id !== undefined) {

      const category = await categoryRepository.findById(postData.category_id);

      if (!category) {
        throw ErrorMiddleware.createError(
          '分类不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.CATEGORY_NOT_EXIST
        );
      }
    } else {

    }
    
    // 使用事务确保所有操作成功或全部失败
    const transaction = await postRepository.sequelize.transaction();
    
    try {
      // 创建帖子
      const post = await postRepository.create(postData, { transaction });
      
      // 上传帖子图片
      if (images && images.length > 0) {
        const postImages = images.map((image, index) => ({
          post_id: post.id,
          url: image.url,
          thumbnail_url: image.thumbnail_url,
          width: image.width,
          height: image.height,
          size: image.size,
          order: index
        }));
        
        await postImageRepository.bulkCreate(postImages, { transaction });
      }
      
      // 关联话题
      if (topicNames && topicNames.length > 0) {
        // 导入话题服务
        const topicService = require('./topic.service');

        // 根据话题名称查找或创建话题，获取话题ID数组
        const topicIds = await topicService.findOrCreateByNames(topicNames);

        if (topicIds.length > 0) {
          await post.setTopics(topicIds, { transaction });

          // 更新话题的帖子计数
          for (const topicId of topicIds) {
            await topicRepository.incrementPostCount(topicId, 1, transaction);
          }
        }
      }

      // 更新分类的帖子计数（如果有分类且状态为已发布）
      if (postData.category_id && postData.status === 'published') {
        const categoryRepository = require('../repositories/category.repository');
        await categoryRepository.incrementPostCount(postData.category_id, 1);
      }

      await transaction.commit();

      // 查询完整的帖子数据（包含关联数据）
      return await this.getPostById(post.id, true);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 获取帖子详情
   * @param {String} id 帖子ID
   * @param {Boolean} withDetails 是否包含详细信息
   * @param {String} currentUserId 当前用户ID（可选）
   * @returns {Promise<Object>} 帖子对象
   */
  async getPostById(id, withDetails = false, currentUserId = null) {
    // 获取帖子数据
    const post = await postRepository.findById(id, withDetails);
    
    if (!post) {
      throw ErrorMiddleware.createError(
        '帖子不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.POST_NOT_EXIST
      );
    }
    
    // 检查帖子状态
    if (post.status === 'deleted') {
      throw ErrorMiddleware.createError(
        '帖子已删除',
        StatusCodes.NOT_FOUND,
        errorCodes.POST_DELETED
      );
    }

    // 处理匿名帖子
    this.processAnonymousPost(post, currentUserId);

    // 如果有当前用户ID，添加是否点赞、收藏和关注的信息
    if (currentUserId) {
      const promises = [
        statusCacheService.isLiked(currentUserId, id),
        statusCacheService.isFavorited(currentUserId, id)
      ];
      
      // 如果有作者信息，查询关注状态
      if (post.author && post.author.id) {
        promises.push(statusCacheService.isFollowing(currentUserId, post.author.id));
      }
      
      const results = await Promise.all(promises);
      post.dataValues.is_liked = results[0];
      post.dataValues.is_favorited = results[1];
      
      // 🔧 同时设置到根级别，支持两种命名格式
      post.is_liked = results[0];
      post.is_favorited = results[1];
      // 🔧 同时设置驼峰命名格式，确保前端组件能访问到
      post.isLiked = results[0];
      post.isFavorited = results[1];
      
      // 添加作者的关注状态
      if (post.author && post.author.id && results.length > 2) {
        post.author.dataValues = post.author.dataValues || {};
        post.author.dataValues.isFollowing = results[2];
      }
    }

    return post;
  }

  /**
   * 处理匿名帖子，隐藏用户信息
   * @param {Object} post 帖子对象
   * @param {String} currentUserId 当前用户ID（可选）
   */
  processAnonymousPost(post, currentUserId = null) {
    // 如果帖子是匿名的，且当前用户不是帖子作者，则隐藏用户信息
    if (post.is_anonymous && post.user_id !== currentUserId) {
      if (post.author) {
        // 替换作者信息为匿名用户
        post.author.dataValues = {
          id: 'anonymous',
          username: '匿名用户',
          nickname: '匿名用户',
          avatar: null,
          school: null,
          department: null
        };
      }
    }
  }

  /**
   * 更新帖子
   * @param {String} id 帖子ID
   * @param {Object} postData 帖子数据
   * @param {Array<Object>} images 帖子图片数据
   * @param {Array<String>} topicNames 话题名称数组
   * @param {String} userId 当前用户ID
   * @returns {Promise<Object>} 更新后的帖子对象
   */
  async updatePost(id, postData, images = null, topicNames = null, userId) {
    // 检查帖子是否存在
    const post = await postRepository.findById(id);
    if (!post) {
      throw ErrorMiddleware.createError(
        '帖子不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.POST_NOT_EXIST
      );
    }
    
    // 检查帖子状态
    if (post.status === 'deleted') {
      throw ErrorMiddleware.createError(
        '帖子已删除',
        StatusCodes.NOT_FOUND,
        errorCodes.POST_DELETED
      );
    }
    
    // 检查是否有权限修改帖子
    if (post.user_id !== userId) {
      // 检查当前用户是否为管理员
      const user = await userRepository.findById(userId);
      if (user.role !== 'admin') {
        throw ErrorMiddleware.createError(
          '无权限修改该帖子',
          StatusCodes.FORBIDDEN,
          errorCodes.NO_PERMISSION
        );
      }
    }
    
    // 如果修改了分类，检查分类是否存在（category_id为null表示"全部"分类，无需检查）
    if (postData.category_id !== null && postData.category_id !== undefined) {
      const category = await categoryRepository.findById(postData.category_id);
      if (!category) {
        throw ErrorMiddleware.createError(
          '分类不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.CATEGORY_NOT_EXIST
        );
      }
    }
    
    // 获取原帖子信息（用于比较分类变化）
    const originalPost = await postRepository.findById(id);
    if (!originalPost) {
      throw ErrorMiddleware.createError(
        '帖子不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.POST_NOT_EXIST
      );
    }

    // 使用事务确保所有操作成功或全部失败
    const transaction = await postRepository.sequelize.transaction();

    try {
      // 更新帖子
      await postRepository.update(id, postData, { transaction });
      
      // 处理图片
      if (images !== null) {
        // 删除原有图片
        await postImageRepository.deleteByPostId(id, { transaction });
        
        // 上传新图片
        if (images && images.length > 0) {
          const postImages = images.map((image, index) => ({
            post_id: id,
            url: image.url,
            thumbnail_url: image.thumbnail_url,
            width: image.width,
            height: image.height,
            size: image.size,
            order: index
          }));
          
          await postImageRepository.bulkCreate(postImages, { transaction });
        }
      }
      
      // 处理话题
      if (topicNames !== null) {
        // 导入话题服务
        const topicService = require('./topic.service');

        // 根据话题名称查找或创建话题，获取话题ID数组
        const newTopicIds = topicNames && topicNames.length > 0
          ? await topicService.findOrCreateByNames(topicNames)
          : [];

        // 获取原有话题
        const oldTopics = await post.getTopics();
        const oldTopicIds = oldTopics.map(topic => topic.id);

        // 设置新话题
        await post.setTopics(newTopicIds, { transaction });

        // 更新话题的帖子计数
        const addedTopicIds = newTopicIds.filter(id => !oldTopicIds.includes(id));
        const removedTopicIds = oldTopicIds.filter(id => !newTopicIds.includes(id));

        for (const topicId of addedTopicIds) {
          await topicRepository.incrementPostCount(topicId, 1, transaction);
        }

        for (const topicId of removedTopicIds) {
          await topicRepository.incrementPostCount(topicId, -1, transaction);
        }
      }

      // 更新分类的帖子计数（考虑分类和状态变化）
      const oldCategoryId = originalPost.category_id;
      const oldStatus = originalPost.status;
      const newCategoryId = postData.category_id !== undefined ? postData.category_id : oldCategoryId;
      const newStatus = postData.status !== undefined ? postData.status : oldStatus;

      // 只有已发布状态的帖子才计入分类统计
      const oldPublished = oldStatus === 'published';
      const newPublished = newStatus === 'published';

      // 如果分类或发布状态发生了变化，更新计数
      if (oldCategoryId !== newCategoryId || oldPublished !== newPublished) {
        // 从旧分类减少计数（如果原来是已发布状态）
        if (oldCategoryId && oldPublished) {
          await categoryRepository.incrementPostCount(oldCategoryId, -1);
        }
        // 向新分类增加计数（如果现在是已发布状态）
        if (newCategoryId && newPublished) {
          await categoryRepository.incrementPostCount(newCategoryId, 1);
        }
      }

      await transaction.commit();
      
      // 查询完整的帖子数据（包含关联数据）
      return await this.getPostById(id, true);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 删除帖子
   * @param {String} id 帖子ID
   * @param {String} userId 当前用户ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async deletePost(id, userId) {
    // 检查帖子是否存在
    const post = await postRepository.findById(id);
    if (!post) {
      throw ErrorMiddleware.createError(
        '帖子不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.POST_NOT_EXIST
      );
    }
    
    // 检查是否有权限删除帖子
    if (post.user_id !== userId) {
      // 检查当前用户是否为管理员
      const user = await userRepository.findById(userId);
      if (user.role !== 'admin') {
        throw ErrorMiddleware.createError(
          '无权限删除该帖子',
          StatusCodes.FORBIDDEN,
          errorCodes.NO_PERMISSION
        );
      }
    }

    // 软删除帖子
    const result = await postRepository.delete(id);

    // 更新分类的帖子计数（只有已发布的帖子才需要减少计数）
    if (post.category_id && post.status === 'published') {
      await categoryRepository.incrementPostCount(post.category_id, -1);
    }

    return result;
  }

  /**
   * 获取帖子列表
   * @param {Object} options 查询选项
   * @param {String} currentUserId 当前用户ID（可选）
   * @returns {Promise<Object>} 分页结果
   */
  async getPosts(options, currentUserId = null) {
    const posts = await postRepository.findAll(options);

    // 如果有当前用户ID，批量添加是否点赞、收藏和关注的信息
    if (currentUserId) {
      const postIds = posts.list.map(post => post.id);
      const authorIds = posts.list.map(post => post.author?.id).filter(Boolean);
      
      const [likeStates, favoriteStates, followingStates] = await Promise.all([
        statusCacheService.isLiked(currentUserId, postIds),
        statusCacheService.isFavorited(currentUserId, postIds),
        authorIds.length > 0 ? statusCacheService.isFollowing(currentUserId, authorIds) : {}
      ]);

      posts.list.forEach(post => {
        post.dataValues.is_liked = likeStates[post.id] || false;
        post.dataValues.is_favorited = favoriteStates[post.id] || false;
        
        // 🔧 同时设置到根级别，支持两种命名格式
        post.is_liked = likeStates[post.id] || false;
        post.is_favorited = favoriteStates[post.id] || false;
        // 🔧 同时设置驼峰命名格式，确保前端组件能访问到
        post.isLiked = likeStates[post.id] || false;
        post.isFavorited = favoriteStates[post.id] || false;
        
        // 添加作者的关注状态
        if (post.author && post.author.id) {
          post.author.dataValues = post.author.dataValues || {};
          post.author.dataValues.isFollowing = followingStates[post.author.id] || false;
        }
      });
    }

    // 处理匿名帖子和添加热门评论预览
    for (const post of posts.list) {
      // 处理匿名帖子
      this.processAnonymousPost(post, currentUserId);

      // 添加热门评论预览
      const hotComments = await this.getPostHotComments(post.id, 2, currentUserId);
      post.dataValues.hot_comments = hotComments.list;
      post.dataValues.total_comments = hotComments.total;
    }

    return posts;
  }

  /**
   * 获取热门帖子
   * @param {Number} limit 限制数量
   * @param {String} currentUserId 当前用户ID（可选）
   * @returns {Promise<Array>} 帖子列表
   */
  async getHotPosts(limit = 10, currentUserId = null) {
    const posts = await postRepository.findHotPosts(limit);
    
    // 如果有当前用户ID，批量添加是否点赞、收藏和关注的信息
    if (currentUserId) {
      const postIds = posts.map(post => post.id);
      const authorIds = posts.map(post => post.author?.id).filter(Boolean);
      
      const [likeStates, favoriteStates, followingStates] = await Promise.all([
        statusCacheService.isLiked(currentUserId, postIds),
        statusCacheService.isFavorited(currentUserId, postIds),
        authorIds.length > 0 ? statusCacheService.isFollowing(currentUserId, authorIds) : {}
      ]);

      posts.forEach(post => {
        post.dataValues.is_liked = likeStates[post.id] || false;
        post.dataValues.is_favorited = favoriteStates[post.id] || false;
        
        // 🔧 同时设置到根级别，支持两种命名格式
        post.is_liked = likeStates[post.id] || false;
        post.is_favorited = favoriteStates[post.id] || false;
        // 🔧 同时设置驼峰命名格式，确保前端组件能访问到
        post.isLiked = likeStates[post.id] || false;
        post.isFavorited = favoriteStates[post.id] || false;
        
        // 添加作者的关注状态
        if (post.author && post.author.id) {
          post.author.dataValues = post.author.dataValues || {};
          post.author.dataValues.isFollowing = followingStates[post.author.id] || false;
        }
      });
    }
    
    return posts;
  }

  /**
   * 增加帖子浏览量
   * @param {String} id 帖子ID
   * @returns {Promise<Boolean>} 是否成功
   */
  async incrementViewCount(id) {
    return await postRepository.incrementViewCount(id);
  }

  /**
   * 获取帖子评论列表
   * @param {String} postId 帖子ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @param {String} currentUserId 当前用户ID（可选）
   * @param {String} sort 排序方式：latest, hot, most_liked
   * @returns {Promise<Object>} 分页结果
   */
  async getPostComments(postId, page = 1, pageSize = 20, currentUserId = null, sort = 'latest') {
    // 检查帖子是否存在
    const post = await postRepository.findById(postId);
    if (!post) {
      throw ErrorMiddleware.createError(
        '帖子不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.POST_NOT_EXIST
      );
    }
    
    const comments = await postRepository.getComments(postId, page, pageSize, sort);

    // 处理匿名显示和点赞信息
    for (const comment of comments.list) {
      // 处理匿名显示：对于匿名评论，只对非作者隐藏身份
      if (comment.is_anonymous && comment.user_id !== currentUserId) {
        if (comment.author) {
          comment.author.dataValues = {
            id: 'anonymous',
            username: '匿名用户',
            nickname: '匿名用户',
            avatar: null  // 让前端处理默认头像
          };
        }
      }

      // 添加是否点赞的信息
      if (currentUserId) {
        comment.dataValues.is_liked = await commentRepository.isLikedByUser(comment.id, currentUserId);
      }

      // 处理回复
      if (comment.replies && comment.replies.length > 0) {
        for (const reply of comment.replies) {
          // 处理回复的匿名显示
          if (reply.is_anonymous && reply.user_id !== currentUserId) {
            if (reply.author) {
              reply.author.dataValues = {
                id: 'anonymous',
                username: '匿名用户',
                nickname: '匿名用户',
                avatar: null  // 让前端处理默认头像
              };
            }
          }

          // 添加回复的点赞信息
          if (currentUserId) {
            reply.dataValues.is_liked = await commentRepository.isLikedByUser(reply.id, currentUserId);
          }
        }
      }
    }

    return comments;
  }

  /**
   * 获取帖子热门评论预览
   * @param {String} postId 帖子ID
   * @param {Number} limit 限制数量
   * @param {String} currentUserId 当前用户ID（可选）
   * @returns {Promise<Object>} 评论列表和总数
   */
  async getPostHotComments(postId, limit = 3, currentUserId = null) {
    // 获取热门评论（按点赞数降序）
    const comments = await postRepository.getComments(postId, 1, limit, 'most_liked');

    let likeStates = {};
    if (currentUserId) {
      const commentIdSet = new Set();
      const commentIds = [];

      const collectIds = commentItem => {
        if (!commentItem || !commentItem.id || commentIdSet.has(commentItem.id)) {
          return;
        }
        commentIdSet.add(commentItem.id);
        commentIds.push(commentItem.id);

        if (commentItem.replies && commentItem.replies.length > 0) {
          commentItem.replies.forEach(collectIds);
        }
      };

      comments.list.forEach(collectIds);

      if (commentIds.length > 0) {
        likeStates = await commentRepository.getLikeStatesForUser(currentUserId, commentIds);
      }
    }

    // 处理匿名显示、点赞信息和修复昵称
    for (const comment of comments.list) {
      // 处理匿名显示：对于匿名评论，只对非作者隐藏身份
      if (comment.is_anonymous && comment.user_id !== currentUserId) {
        if (comment.author) {
          comment.author.dataValues = {
            id: 'anonymous',
            username: '匿名用户',
            nickname: '匿名用户',
            avatar: null  // 让前端处理默认头像
          };
        }
      }

      // 添加是否点赞的信息
      comment.dataValues.is_liked = currentUserId
        ? Boolean(likeStates[comment.id])
        : false;

      // 修复问题昵称（仅对非匿名评论）
      if (!comment.is_anonymous || comment.user_id === currentUserId) {
        if (comment.author && (comment.author.nickname === '????' || !comment.author.nickname)) {
          comment.author.nickname = comment.author.username || '匿名用户';
        }
      }

      if (comment.replies && comment.replies.length > 0) {
        for (const reply of comment.replies) {
          if (currentUserId) {
            reply.dataValues.is_liked = Boolean(likeStates[reply.id]);
          } else {
            reply.dataValues.is_liked = false;
          }
        }
      }
    }

    // 获取总评论数
    const totalComments = await commentRepository.countByPostId(postId);

    return {
      list: comments.list,
      total: totalComments
    };
  }

  /**
   * 获取帖子评论统计信息
   * @param {String} postId 帖子ID
   * @returns {Promise<Object>} 统计信息
   */
  async getPostCommentStats(postId) {
    // 检查帖子是否存在
    const post = await postRepository.findById(postId);
    if (!post) {
      throw ErrorMiddleware.createError(
        '帖子不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.POST_NOT_EXIST
      );
    }

    const { Comment, User } = require('../models');
    const { Sequelize } = require('sequelize');

    // 获取总评论数
    const totalComments = await Comment.count({
      where: { 
        post_id: postId,
        status: 'approved'
      }
    });

    // 获取参与评论的用户数（去重）
    const participantCount = await Comment.count({
      where: { 
        post_id: postId,
        status: 'approved'
      },
      distinct: true,
      col: 'user_id'
    });

    // 获取总点赞数
    const totalLikes = await Comment.sum('like_count', {
      where: { 
        post_id: postId,
        status: 'approved'
      }
    }) || 0;

    // 获取热门评论数（点赞数 >= 10）
    const hotCommentCount = await Comment.count({
      where: { 
        post_id: postId,
        status: 'approved',
        like_count: {
          [Sequelize.Op.gte]: 10
        }
      }
    });

    return {
      totalComments,
      participantCount,
      totalLikes,
      hotCommentCount
    };
  }

  /**
   * 设置帖子置顶状态
   * @param {String} id 帖子ID
   * @param {Boolean} isTop 是否置顶
   * @returns {Promise<Boolean>} 是否成功
   */
  async setTopStatus(id, isTop) {
    // 检查帖子是否存在
    const post = await postRepository.findById(id);
    if (!post) {
      throw ErrorMiddleware.createError(
        '帖子不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.POST_NOT_EXIST
      );
    }
    
    return await postRepository.setTopStatus(id, isTop);
  }

  /**
   * 获取用户收藏的帖子
   * @param {String} userId 用户ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async getUserFavorites(userId, page = 1, pageSize = 10) {
    // 检查用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    const options = {
      page,
      pageSize,
      favoriteUserId: userId,
      includeDetails: true
    };
    
    const posts = await postRepository.findAll(options);
    
    // 批量添加是否点赞的信息（收藏状态已知为true）
    if (posts.list.length > 0) {
      const postIds = posts.list.map(post => post.id);
      const likeStates = await statusCacheService.isLiked(userId, postIds);

      posts.list.forEach(post => {
        post.dataValues.is_liked = likeStates[post.id] || false;
        post.dataValues.is_favorited = true; // 已知是收藏的
        
        // 🔧 同时设置到根级别，支持两种命名格式
        post.is_liked = likeStates[post.id] || false;
        post.is_favorited = true; // 已知是收藏的
        // 🔧 同时设置驼峰命名格式，确保前端组件能访问到
        post.isLiked = likeStates[post.id] || false;
        post.isFavorited = true; // 已知是收藏的
      });
    }
    
    return posts;
  }

  /**
   * 获取用户审核记录
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 审核记录列表和分页信息
   */
  async getUserAuditHistory(options) {
    const { userId, auditStatus, page = 1, pageSize = 10 } = options;

    // 构建查询选项
    const queryOptions = {
      userId,
      page,
      pageSize,
      orderBy: 'created_at',
      orderDirection: 'DESC',
      includeDetails: true
    };

    // 根据审核状态筛选
    if (auditStatus) {
      if (auditStatus === 'pending') {
        queryOptions.status = 'pending';
      } else if (auditStatus === 'rejected') {
        queryOptions.status = 'rejected';
      }
    } else {
      // 默认只显示待审核和被拒绝的帖子，已通过的没必要显示
      queryOptions.status = ['pending', 'rejected'];
    }

    const result = await postRepository.findAll(queryOptions);

    // 处理帖子数据，添加审核状态描述
    const processedPosts = result.list.map(post => {
      const postData = post.toJSON();

      // 添加审核状态描述
      switch (postData.status) {
        case 'pending':
          postData.auditStatusText = '待审核';
          postData.auditStatusColor = '#FF9500';
          break;
        case 'rejected':
          postData.auditStatusText = '审核未通过';
          postData.auditStatusColor = '#FF3B30';
          break;
        default:
          postData.auditStatusText = '未知状态';
          postData.auditStatusColor = '#8E8E93';
      }

      return postData;
    });

    return {
      list: processedPosts,
      pagination: result.pagination
    };
  }

  /**
   * 统计帖子数量（管理员用）
   * @param {Object} where 查询条件
   * @returns {Promise<Number>} 帖子数量
   */
  async countPosts(where = {}) {
    return await postRepository.count(where);
  }

  /**
   * 获取推荐候选帖子（管理员统计用）
   * @param {Object} options 选项
   * @returns {Promise<Array>} 候选帖子列表
   */
  async findCandidatesForRecommendation(options = {}) {
    return await postRepository.findCandidatesForRecommendation(options);
  }

  // ❌ getRecommendedPosts 方法已删除
  // 推荐功能现在由专门的 RecommendationService 处理
  // 位置：src/services/recommendation.service.v2.js
}

module.exports = new PostService();
