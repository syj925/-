/**
 * @file 批量状态管理控制器
 * @description 用于处理批量状态查询和用户状态同步
 */
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const db = require('../models/associations');
const Topic = db.Topic;
const Event = db.Event;
const TopicView = db.TopicView;
const EventRegistration = db.EventRegistration;
const Like = db.Like;
const Collection = db.Collection;
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

/**
 * @desc    批量获取多种内容的状态
 * @route   POST /api/batch/status
 * @access  Private
 */
exports.getBatchStatus = catchAsync(async (req, res) => {
  // 获取当前用户ID
  const userId = req.user ? req.user.id : null;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '未授权，请先登录'
    });
  }

  // 获取请求参数
  const { postIds, commentIds, topicIds, eventIds } = req.body;
  
  // 检查参数是否有效
  if (
    (!postIds || !postIds.length) && 
    (!commentIds || !commentIds.length) && 
    (!topicIds || !topicIds.length) && 
    (!eventIds || !eventIds.length)
  ) {
    return res.status(400).json({
      success: false,
      message: '请至少提供一种内容的ID'
    });
  }

  // 存储结果
  const result = {
    posts: {},
    comments: {},
    topics: {},
    events: {}
  };

  // 处理帖子状态
  if (postIds && postIds.length > 0) {
    // 获取点赞状态
    const likedPosts = await sequelize.query(
      'SELECT post_id FROM likes WHERE user_id = ? AND target_type = ? AND post_id IN (?)',
      {
        replacements: [userId, 'post', postIds],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    // 获取收藏状态
    const collectedPosts = await sequelize.query(
      'SELECT post_id FROM collections WHERE user_id = ? AND post_id IN (?)',
      {
        replacements: [userId, postIds],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    // 整理数据
    const likedPostIds = likedPosts.map(item => item.post_id);
    const collectedPostIds = collectedPosts.map(item => item.post_id);
    
    postIds.forEach(postId => {
      result.posts[postId] = {
        isLiked: likedPostIds.includes(Number(postId)),
        isCollected: collectedPostIds.includes(Number(postId))
      };
    });
  }

  // 处理评论状态
  if (commentIds && commentIds.length > 0) {
    // 获取点赞状态
    const likedComments = await sequelize.query(
      'SELECT target_id FROM likes WHERE user_id = ? AND target_type = ? AND target_id IN (?)',
      {
        replacements: [userId, 'comment', commentIds],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    // 整理数据
    const likedCommentIds = likedComments.map(item => item.target_id);
    
    commentIds.forEach(commentId => {
      result.comments[commentId] = {
        isLiked: likedCommentIds.includes(Number(commentId))
      };
    });
  }

  // 处理话题状态
  if (topicIds && topicIds.length > 0) {
    // 使用自定义表记录用户浏览话题状态
    const viewedTopics = await TopicView.findAll({
      where: {
        userId,
        topicId: {
          [Op.in]: topicIds
        }
      },
      attributes: ['topicId', 'viewedAt']
    }).catch(err => {
      logger.error('获取话题浏览状态出错:', err);
      return [];
    });
    
    // 整理数据
    const viewedTopicMap = {};
    viewedTopics.forEach(item => {
      viewedTopicMap[item.topicId] = {
        viewed: true,
        viewedAt: item.viewedAt
      };
    });
    
    topicIds.forEach(topicId => {
      result.topics[topicId] = viewedTopicMap[topicId] || { viewed: false };
    });
  }

  // 处理活动状态
  if (eventIds && eventIds.length > 0) {
    // 获取用户已注册的活动
    const registeredEvents = await EventRegistration.findAll({
      where: {
        userId,
        eventId: {
          [Op.in]: eventIds
        },
        status: 'registered'
      },
      attributes: ['eventId', 'createdAt']
    }).catch(err => {
      logger.error('获取活动注册状态出错:', err);
      return [];
    });
    
    // 整理数据
    const registeredEventMap = {};
    registeredEvents.forEach(item => {
      registeredEventMap[item.eventId] = {
        registered: true,
        registeredAt: item.createdAt
      };
    });
    
    eventIds.forEach(eventId => {
      result.events[eventId] = registeredEventMap[eventId] || { registered: false };
    });
  }

  // 返回结果
  return res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * @desc    同步用户状态（登录后调用）
 * @route   GET /api/batch/sync-user-status
 * @access  Private
 */
exports.syncUserStatus = catchAsync(async (req, res) => {
  // 获取当前用户ID
  const userId = req.user ? req.user.id : null;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '未授权，请先登录'
    });
  }

  // 存储结果
  const result = {
    likes: [],
    collections: [],
    topicViews: [],
    eventRegistrations: [],
    lastSynced: new Date().getTime()
  };
  
  // 获取用户点赞的帖子
  const likedPosts = await Like.findAll({
    where: {
      userId,
      targetType: 'post'
    },
    attributes: ['postId']
  });
  
  // 获取用户收藏的帖子
  const collectedPosts = await Collection.findAll({
    where: {
      userId
    },
    attributes: ['postId']
  });
  
  // 获取用户浏览的话题
  const viewedTopics = await TopicView.findAll({
    where: {
      userId
    },
    attributes: ['topicId', 'viewedAt']
  }).catch(err => {
    logger.error('获取话题浏览记录出错:', err);
    return [];
  });
  
  // 获取用户注册的活动
  const registeredEvents = await EventRegistration.findAll({
    where: {
      userId,
      status: 'registered'
    },
    attributes: ['eventId', 'createdAt']
  });
  
  // 整理数据
  result.likes = likedPosts.map(item => item.postId);
  result.collections = collectedPosts.map(item => item.postId);
  result.topicViews = viewedTopics.map(item => ({
    id: item.topicId,
    viewedAt: item.viewedAt
  }));
  result.eventRegistrations = registeredEvents.map(item => ({
    id: item.eventId,
    registeredAt: item.createdAt
  }));

  // 返回结果
  return res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * 批量获取内容状态
 * 同时查询多种内容（帖子、话题、活动）的用户交互状态
 */
exports.getBatchContentStatus = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { posts, topics, events } = req.body;
  
  logger.info(`用户[${userId}]批量查询内容状态: 帖子${posts?.length || 0}个, 话题${topics?.length || 0}个, 活动${events?.length || 0}个`);
  
  if (!posts && !topics && !events) {
    return res.status(400).json({
      success: false,
      message: '请求参数错误，至少需要提供一种内容ID'
    });
  }
  
  const result = {};
  
  // 查询帖子点赞和收藏状态
  if (posts && Array.isArray(posts) && posts.length > 0) {
    // 获取用户点赞的帖子
    const likes = await Like.findAll({
      where: {
        userId,
        targetType: 'post',
        targetId: {
          [Op.in]: posts
        }
      },
      attributes: ['targetId', 'createdAt']
    });
    
    // 获取用户收藏的帖子
    const collections = await Collection.findAll({
      where: {
        userId,
        postId: {
          [Op.in]: posts
        }
      },
      attributes: ['postId', 'createdAt']
    });
    
    // 转换为易于使用的格式
    result.posts = {
      likes: likes.reduce((acc, like) => {
        acc[like.targetId] = {
          status: true,
          timestamp: like.createdAt.getTime()
        };
        return acc;
      }, {}),
      collections: collections.reduce((acc, collection) => {
        acc[collection.postId] = {
          status: true,
          timestamp: collection.createdAt.getTime()
        };
        return acc;
      }, {})
    };
    
    // 填充未点赞和未收藏的帖子，确保所有请求的帖子都有状态
    posts.forEach(postId => {
      if (!result.posts.likes[postId]) {
        result.posts.likes[postId] = { status: false, timestamp: null };
      }
      if (!result.posts.collections[postId]) {
        result.posts.collections[postId] = { status: false, timestamp: null };
      }
    });
  }
  
  // 查询话题浏览状态
  if (topics && Array.isArray(topics) && topics.length > 0) {
    // 获取用户浏览过的话题
    const views = await TopicView.findAll({
      where: {
        userId,
        topicId: {
          [Op.in]: topics
        }
      },
      attributes: ['topicId', 'createdAt']
    });
    
    // 转换为易于使用的格式
    result.topics = {
      views: views.reduce((acc, view) => {
        acc[view.topicId] = {
          status: true,
          timestamp: view.createdAt.getTime()
        };
        return acc;
      }, {})
    };
    
    // 填充未浏览的话题，确保所有请求的话题都有状态
    topics.forEach(topicId => {
      if (!result.topics.views[topicId]) {
        result.topics.views[topicId] = { status: false, timestamp: null };
      }
    });
  }
  
  // 查询活动注册状态
  if (events && Array.isArray(events) && events.length > 0) {
    // 获取用户注册的活动
    const registrations = await EventRegistration.findAll({
      where: {
        userId,
        eventId: {
          [Op.in]: events
        }
      },
      attributes: ['eventId', 'createdAt', 'status']
    });
    
    // 获取活动的基本信息（参与人数和最大人数）
    const eventInfos = await Event.findAll({
      where: {
        id: {
          [Op.in]: events
        }
      },
      attributes: ['id', 'maxParticipants', 'currentParticipants']
    });
    
    const eventInfoMap = eventInfos.reduce((acc, event) => {
      acc[event.id] = {
        maxParticipants: event.maxParticipants,
        currentParticipants: event.currentParticipants,
        isFull: event.currentParticipants >= event.maxParticipants
      };
      return acc;
    }, {});
    
    // 转换为易于使用的格式
    result.events = {
      registrations: registrations.reduce((acc, registration) => {
        acc[registration.eventId] = {
          status: registration.status === 'registered',
          timestamp: registration.createdAt.getTime(),
          ...eventInfoMap[registration.eventId]
        };
        return acc;
      }, {})
    };
    
    // 填充未注册的活动，确保所有请求的活动都有状态
    events.forEach(eventId => {
      if (!result.events.registrations[eventId]) {
        result.events.registrations[eventId] = { 
          status: false, 
          timestamp: null,
          ...(eventInfoMap[eventId] || { 
            maxParticipants: 0,
            currentParticipants: 0,
            isFull: false
          })
        };
      }
    });
  }
  
  res.status(200).json({
    success: true,
    message: '批量获取内容状态成功',
    data: result
  });
});

/**
 * 同步用户状态
 * 获取用户所有交互状态（点赞、收藏、浏览、注册等）用于初始化客户端状态
 */
exports.syncUserStatus = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { since } = req.query;
  
  // 解析时间戳，如果提供了since参数，则只获取该时间之后的状态
  const sinceDate = since ? new Date(parseInt(since)) : new Date(0);
  
  logger.info(`用户[${userId}]请求同步状态，时间戳: ${sinceDate.toISOString()}`);
  
  // 初始化结果对象
  const result = {
    likes: [],
    collections: [],
    topicViews: [],
    eventRegistrations: [],
    lastSynced: new Date().getTime()
  };
  
  // 查询函数，带独立错误处理
  const safeQuery = async (sql, replacements, errorMsg) => {
    try {
      return await sequelize.query(sql, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });
    } catch (err) {
      logger.error(`${errorMsg}: ${err.message}`);
      return []; // 返回空数组而不是抛出错误
    }
  };
  
  // 获取用户点赞记录
  const likes = await safeQuery(
    'SELECT target_type, target_id, created_at FROM likes WHERE user_id = :userId AND created_at > :since',
    { userId, since: sinceDate },
    '获取用户点赞记录失败'
  );
  
  // 获取用户收藏记录
  const collections = await safeQuery(
    'SELECT post_id, created_at FROM collections WHERE user_id = :userId AND created_at > :since',
    { userId, since: sinceDate },
    '获取用户收藏记录失败'
  );
  
  // 获取用户浏览话题记录
  const topicViews = await safeQuery(
    'SELECT topic_id, created_at FROM topic_views WHERE user_id = :userId AND created_at > :since',
    { userId, since: sinceDate },
    '获取用户话题浏览记录失败'
  );
  
  // 获取用户活动注册记录
  const eventRegistrations = await safeQuery(
    'SELECT event_id, created_at FROM event_registrations WHERE user_id = :userId AND status = :status AND created_at > :since',
    { userId, status: 'registered', since: sinceDate },
    '获取用户活动注册记录失败'
  );
  
  // 安全地转换日期
  const safeGetTime = (dateStr) => {
    try {
      return new Date(dateStr).getTime();
    } catch (err) {
      return 0;
    }
  };
  
  // 整理数据
  if (likes && likes.length) {
    result.likes = likes.map(like => ({
      type: like.target_type || '',
      id: like.target_id || 0,
      timestamp: safeGetTime(like.created_at)
    }));
    logger.debug(`处理后的点赞数据: ${JSON.stringify(result.likes).substring(0, 200)}${result.likes.length > 5 ? '...(共' + result.likes.length + '条)' : ''}`);
  }
  
  if (collections && collections.length) {
    result.collections = collections.map(collection => ({
      type: 'post',  // 收藏默认为帖子类型
      id: collection.post_id || 0,
      timestamp: safeGetTime(collection.created_at)
    }));
    logger.debug(`处理后的收藏数据: ${JSON.stringify(result.collections).substring(0, 200)}${result.collections.length > 5 ? '...(共' + result.collections.length + '条)' : ''}`);
  }
  
  if (topicViews && topicViews.length) {
    result.topicViews = topicViews.map(view => ({
      id: view.topic_id || 0,
      timestamp: safeGetTime(view.created_at)
    }));
  }
  
  if (eventRegistrations && eventRegistrations.length) {
    result.eventRegistrations = eventRegistrations.map(registration => ({
      id: registration.event_id || 0,
      timestamp: safeGetTime(registration.created_at)
    }));
  }
  
  // 返回结果
  return res.status(200).json({
    success: true,
    message: '同步用户状态成功',
    data: result
  });
}); 