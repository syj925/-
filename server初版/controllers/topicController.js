const { Topic, Post, User, PostTopic, TopicView } = require('../models/associations');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/db');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

/**
 * @desc    获取热门话题列表
 * @route   GET /api/topics/hot
 * @access  Public
 */
exports.getHotTopics = async (req, res, next) => {
  try {
    // 解析查询参数
    const limit = parseInt(req.query.limit, 10) || 10;
    
    // 查询热门话题（按使用次数排序）
    const topics = await Topic.findAll({
      where: {
        status: 'active'
      },
      attributes: [
        'id', 'name', 'description', 'coverImage', 'usageCount', 
        'views', 'status', 'metaTitle', 'metaDescription', 'metaKeywords',
        'created_at', 'updated_at'
      ],
      order: [['usageCount', 'DESC']],
      limit
    });
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: topics
    });
  } catch (error) {
    console.error('获取热门话题失败:', error);
    next(error);
  }
};

/**
 * @desc    获取话题列表
 * @route   GET /api/topics
 * @access  Public
 */
exports.getTopics = async (req, res, next) => {
  try {
    // 解析查询参数
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || '';
    
    // 计算跳过的记录数
    const offset = (page - 1) * limit;
    
    // 构建搜索条件
    const whereCondition = {
      status: 'active'
    };
    
    // 如果有搜索关键词，添加搜索条件
    if (search) {
      whereCondition.name = {
        [Op.like]: `%${search}%`
      };
    }
    
    // 查询话题列表 - 显式指定字段列表，避免使用不存在的字段
    const { count, rows: topics } = await Topic.findAndCountAll({
      where: whereCondition,
      attributes: [
        'id', 'name', 'description', 'coverImage', 
        'pendingImage', 'imageStatus', 'usageCount', 
        'views', 'status', 'metaTitle', 
        'metaDescription', 'metaKeywords',
        'created_at', 'updated_at'
      ],
      order: [['usageCount', 'DESC']],
      limit,
      offset
    });
    
    // 计算总页数
    const totalPages = Math.ceil(count / limit);
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: {
        topics,
        pagination: {
          page,
          limit,
          total: count,
          pages: totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取话题详情
 * @route   GET /api/topics/:id
 * @access  Public
 */
exports.getTopic = async (req, res, next) => {
  try {
    // 获取话题ID
    const topicId = req.params.id;
    
    // 查询话题，明确指定查询字段
    const topic = await Topic.findOne({
      where: {
        id: topicId,
        status: 'active'
      },
      attributes: [
        'id', 'name', 'description', 'coverImage', 
        'pendingImage', 'imageStatus', 'usageCount', 
        'views', 'status', 'metaTitle', 
        'metaDescription', 'metaKeywords',
        'sensitiveWordsLevel', 'autoReview',
        'customSensitiveWords', 'bannedWords',
        'created_at', 'updated_at'
      ]
    });
    
    // 如果话题不存在
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '话题不存在'
      });
    }
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: topic
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    创建话题
 * @route   POST /api/topics
 * @access  Private (Admin)
 */
exports.createTopic = async (req, res, next) => {
  try {
    // 获取请求数据
    const { name, description, coverImage, pendingImage, imageStatus } = req.body;
    
    // 验证必要字段
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '请提供话题名称'
      });
    }
    
    // 检查话题是否已存在
    const existingTopic = await Topic.findOne({
      where: {
        name,
        status: {
          [Op.ne]: 'deleted'  // 排除已删除的话题
        }
      }
    });
    
    if (existingTopic) {
      return res.status(400).json({
        success: false,
        message: '话题已存在'
      });
    }
    
    // 创建话题，处理图片审核
    const topicData = {
      name,
      description: description || null
    };
    
    // 处理图片
    if (pendingImage) {
      // 如果提供了待审核图片
      topicData.pendingImage = pendingImage;
      topicData.imageStatus = 'pending';
      console.log('设置话题待审核图片:', name, pendingImage);
    } else if (coverImage) {
      // 如果是默认封面图片
      topicData.coverImage = coverImage;
      topicData.imageStatus = imageStatus || 'default';
      console.log('设置话题默认图片:', name, coverImage);
    }
    
    const topic = await Topic.create(topicData);
    
    // 响应成功信息
    res.status(201).json({
      success: true,
      message: '话题创建成功',
      data: {
        topic,
        id: topic.id
      }
    });
  } catch (error) {
    console.error('创建话题错误:', error);
    next(error);
  }
};

/**
 * @desc    更新话题
 * @route   PUT /api/topics/:id
 * @access  Private (Admin)
 */
exports.updateTopic = async (req, res, next) => {
  try {
    // 获取话题ID和请求数据
    const topicId = req.params.id;
    const { name, description, status, coverImage, pendingImage } = req.body;
    
    // 查询话题是否存在
    const topic = await Topic.findByPk(topicId);
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '话题不存在'
      });
    }
    
    // 如果要更新名称，检查是否与其他话题重名
    if (name && name !== topic.name) {
      const existingTopic = await Topic.findOne({
        where: {
          name,
          id: {
            [Op.ne]: topicId
          },
          status: {
            [Op.ne]: 'deleted'  // 排除已删除的话题
          }
        }
      });
      
      if (existingTopic) {
        return res.status(400).json({
          success: false,
          message: '话题名称已存在'
        });
      }
    }
    
    // 更新话题信息
    if (name) topic.name = name;
    if (description !== undefined) topic.description = description;
    if (status && ['active', 'hidden', 'deleted'].includes(status)) topic.status = status;
    
    // 处理图片更新
    if (pendingImage) {
      // 如果提供了待审核图片，设置为待审核状态
      topic.pendingImage = pendingImage;
      topic.imageStatus = 'pending';
      console.log('设置话题图片为待审核状态:', topic.name, pendingImage);
    } else if (coverImage && req.user && req.user.role === 'admin') {
      // 管理员可以直接更新封面图片
      topic.coverImage = coverImage;
    }
    
    // 保存更新
    await topic.save();
    
    // 响应成功信息
    res.status(200).json({
      success: true,
      message: '话题更新成功',
      data: topic
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取话题下的帖子
 * @route   GET /api/topics/:id/posts
 * @access  Public
 */
exports.getTopicPosts = async (req, res, next) => {
  try {
    // 获取话题ID和查询参数
    const topicId = req.params.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    
    // 计算跳过的记录数
    const offset = (page - 1) * limit;
    
    // 查询话题是否存在，明确指定查询字段
    const topic = await Topic.findOne({
      where: {
        id: topicId,
        status: 'active'
      },
      attributes: [
        'id', 'name', 'description', 'coverImage', 
        'usageCount', 'views', 'status'
      ]
    });
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '话题不存在或已删除'
      });
    }
    
    // 查询话题下的帖子
    const { count, rows: posts } = await Post.findAndCountAll({
      include: [
        {
          model: Topic,
          as: 'topicList',
          where: {
            id: topicId
          },
          attributes: ['id', 'name'],
          through: { attributes: [] }
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
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    
    // 计算总页数
    const totalPages = Math.ceil(count / limit);
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: {
        topic: {
          id: topic.id,
          name: topic.name,
          description: topic.description,
          coverImage: topic.coverImage,
          usageCount: topic.usageCount
        },
        posts,
        pagination: {
          page,
          limit,
          total: count,
          pages: totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    搜索话题
 * @route   GET /api/topics/search
 * @access  Public
 */
exports.searchTopics = async (req, res, next) => {
  try {
    // 获取查询参数
    const keyword = req.query.keyword || '';
    const limit = parseInt(req.query.limit, 10) || 10;
    
    if (!keyword.trim()) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // 构建搜索条件
    const whereCondition = {
      status: 'active',
      name: {
        [Op.like]: `%${keyword}%`
      }
    };
    
    // 搜索话题
    const topics = await Topic.findAll({
      where: whereCondition,
      order: [['usageCount', 'DESC']],
      limit,
      attributes: ['id', 'name', 'usageCount', 'coverImage']
    });
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: topics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    检查用户是否浏览过特定话题
 * @route   GET /api/topics/:id/view-status
 * @access  Private
 */
exports.checkViewStatus = async (req, res, next) => {
  try {
    const topicId = req.params.id;
    const userId = req.user.id;
    
    // 查询话题是否存在
    const topic = await Topic.findByPk(topicId);
    
    // 如果话题不存在
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '话题不存在'
      });
    }
    
    // 检查用户是否浏览过该话题
    const view = await TopicView.findOne({
      where: {
        userId,
        topicId
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        hasViewed: !!view,
        viewDate: view ? view.createdAt : null,
        topicViews: topic.views
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    批量检查用户是否浏览过多个话题
 * @route   POST /api/topics/batch-view-status
 * @access  Private
 */
exports.batchCheckViewStatus = async (req, res, next) => {
  try {
    const { topicIds } = req.body;
    const userId = req.user.id;
    
    // 验证请求
    if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的话题ID数组'
      });
    }
    
    // 获取所有指定的话题基本信息
    const topics = await Topic.findAll({
      where: {
        id: topicIds
      },
      attributes: ['id', 'views']
    });
    
    // 创建话题ID到话题信息的映射
    const topicMap = {};
    topics.forEach(topic => {
      topicMap[topic.id] = {
        views: topic.views
      };
    });
    
    // 获取用户浏览过的话题
    const views = await TopicView.findAll({
      where: {
        userId,
        topicId: topicIds
      }
    });
    
    // 创建浏览信息映射
    const viewMap = {};
    views.forEach(view => {
      viewMap[view.topicId] = {
        hasViewed: true,
        viewDate: view.createdAt
      };
    });
    
    // 构建结果
    const result = {};
    topicIds.forEach(id => {
      if (topicMap[id]) {
        result[id] = {
          ...topicMap[id],
          ...(viewMap[id] || { hasViewed: false, viewDate: null })
        };
      } else {
        result[id] = {
          exists: false,
          hasViewed: false
        };
      }
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    更新现有recordView方法以支持用户级别浏览跟踪
 * @route   POST /api/topics/:id/view
 * @access  Public
 */
exports.recordView = async (req, res, next) => {
  try {
    // 获取话题ID
    const topicId = req.params.id;
    // 获取用户ID（如果已登录）
    const userId = req.user ? req.user.id : null;
    
    console.log(`开始记录话题浏览量，话题ID: ${topicId}, 用户ID: ${userId || '未登录'}`);
    
    // 查询话题，明确指定查询字段
    const topic = await Topic.findOne({
      where: {
        id: topicId,
        status: 'active'
      },
      attributes: [
        'id', 'name', 'description', 'views', 'status'
      ]
    });
    
    // 如果话题不存在
    if (!topic) {
      console.log(`话题ID ${topicId} 不存在或已被删除`);
      return res.status(404).json({
        success: false,
        message: '话题不存在或已被删除'
      });
    }
    
    console.log(`话题ID ${topicId} 有效，当前浏览量: ${topic.views || 0}`);
    
    // 确保views字段在数据库表中存在
    try {
      // 检查views列是否存在
      const [columns] = await sequelize.query(
        `SHOW COLUMNS FROM topics LIKE 'views'`
      );
      
      if (columns.length === 0) {
        console.log('topics表中views列不存在，尝试添加...');
        // 如果不存在，添加列
        await sequelize.query(
          `ALTER TABLE topics ADD COLUMN views INT DEFAULT 0 COMMENT '话题浏览量' AFTER usage_count`
        );
        console.log('成功添加views列到topics表');
      }
    } catch (error) {
      console.error('检查/添加views列时出错:', error);
    }
    
    // 直接通过SQL更新浏览量，避免ORM问题
    try {
      await sequelize.query(
        `UPDATE topics SET views = IFNULL(views, 0) + 1 WHERE id = ?`,
        {
          replacements: [topicId]
        }
      );
      console.log(`通过SQL更新话题浏览量成功`);
    } catch (error) {
      console.error('通过SQL更新话题浏览量失败:', error);
      throw error; // 传递错误到外层catch
    }
    
    // 如果用户已登录，记录用户浏览数据
    if (userId) {
      try {
        // 检查topic_views表是否存在
        const [tables] = await sequelize.query(
          `SHOW TABLES LIKE 'topic_views'`
        );
        
        // 如果表存在，记录浏览数据
        if (tables.length > 0) {
          // 检查该用户是否已有此话题的浏览记录
          const [records] = await sequelize.query(
            `SELECT id FROM topic_views WHERE user_id = ? AND topic_id = ?`,
            {
              replacements: [userId, topicId]
            }
          );
          
          if (records && records.length > 0) {
            // 更新现有记录的时间戳
            await sequelize.query(
              `UPDATE topic_views SET viewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
              {
                replacements: [records[0].id]
              }
            );
            console.log(`更新用户 ${userId} 对话题 ${topicId} 的浏览记录时间戳`);
          } else {
            // 创建新的浏览记录
            await sequelize.query(
              `INSERT INTO topic_views (user_id, topic_id, viewed_at, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              {
                replacements: [userId, topicId]
              }
            );
            console.log(`创建用户 ${userId} 对话题 ${topicId} 的新浏览记录`);
          }
        } else {
          console.log('topic_views表不存在，跳过用户浏览记录');
        }
      } catch (error) {
        // 记录错误但不中断流程
        console.error('记录用户浏览数据时出错:', error);
      }
    }
    
    // 获取更新后的浏览量
    const updatedTopic = await Topic.findByPk(topicId, {
      attributes: ['id', 'views']
    });
    
    console.log(`话题ID ${topicId} 浏览量更新成功，新浏览量: ${updatedTopic.views}`);
    
    // 响应成功信息
    res.status(200).json({
      success: true,
      message: '浏览量记录成功',
      data: {
        views: updatedTopic.views
      }
    });
  } catch (error) {
    console.error('记录话题浏览量失败:', error);
    res.status(500).json({
      success: false,
      message: '记录浏览量失败',
      error: error.message
    });
  }
}; 