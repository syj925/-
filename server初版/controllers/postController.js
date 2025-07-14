const { Post, User, Comment, Topic, PostTopic, Like, Collection, PostView } = require('../models/associations');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

/**
 * @desc    获取帖子列表
 * @route   GET /api/posts
 * @access  Public
 */
exports.getPosts = async (req, res, next) => {
  try {
    // 解析查询参数
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const categoryId = req.query.category;
    const sort = req.query.sort || 'latest';
    const topicId = req.query.topic;
    const userId = req.query.userId;
    const countOnly = req.query.countOnly === 'true';
    const isRecommended = req.query.isRecommended === 'true';
    
    console.log('getPosts请求参数:', {
      page, limit, category: categoryId, sort, topicId, userId, countOnly, isRecommended
    });
    
    // 计算跳过的记录数
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const whereClause = {
      status: 'published'
    };
    
    // 如果指定了分类，添加到查询条件
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    // 如果指定了用户ID，添加到查询条件
    if (userId) {
      whereClause.userId = userId;
      console.log(`按用户ID ${userId} 过滤帖子`);
    }
    
    // 如果需要筛选推荐帖子
    if (isRecommended) {
      whereClause.isRecommended = true;
      console.log('仅查询推荐帖子');
    }
    
    // 构建排序条件
    let order;
    if (sort === 'popular') {
      order = [['likes', 'DESC'], ['created_at', 'DESC']];
    } else {
      order = [['created_at', 'DESC']];
    }
    
    // 构建include条件
    const includeConditions = [
      {
        model: User, 
        as: 'author',
        attributes: ['id', 'nickname', 'username', 'avatar']
      }
    ];
    
    // 如果指定了话题，添加话题筛选条件
    if (topicId) {
      includeConditions.push({
        model: Topic,
        as: 'topicList',
        attributes: ['id', 'name'],
        through: { attributes: [] },
        where: { id: topicId }
      });
    } else {
      // 不筛选话题，但仍然获取帖子的话题
      includeConditions.push({
        model: Topic,
        as: 'topicList',
        attributes: ['id', 'name'],
        through: { attributes: [] },
        required: false
      });
    }
    
    // 如果只需要计数，则执行简单的计数查询
    if (countOnly) {
      const count = await Post.count({
        where: whereClause,
        include: includeConditions,
        distinct: true
      });
      
      return res.status(200).json({
        success: true,
        data: {
          pagination: {
            total: count
          }
        }
      });
    }
    
    // 查询帖子
    let { count, rows: posts } = await Post.findAndCountAll({
      where: whereClause,
      include: includeConditions,
      limit,
      offset,
      order,
      distinct: true
    });
    
    console.log(`查询到 ${count} 条帖子`);
    
    // 如果没有找到帖子，添加一些测试数据
    if (count === 0) {
      console.log(`分类 ${categoryId} 下没有数据，返回空列表`);
      
      // 不再添加测试数据，直接返回空列表
      count = 0;
      posts = [];
    } else {
      // 处理实际帖子，获取最新评论
      posts = await Promise.all(posts.map(async (post) => {
      // 转换为普通对象
        const postObject = post.toJSON ? post.toJSON() : post;
      
      // 获取最新两条评论
        let latestComments = [];
        try {
          latestComments = await Comment.findAll({
        where: { 
          postId: post.id,
          parentId: null,  // 只获取顶级评论
          status: 'active'
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'nickname', 'username', 'avatar']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 2
      });
        } catch (err) {
          console.error('获取评论失败:', err);
          latestComments = [];
        }
      
      // 添加评论信息到帖子对象
      postObject.latestComments = latestComments.map(comment => ({
        id: comment.id,
          userId: comment.author?.id,
          username: comment.author?.nickname,
        content: comment.content
      }));
      
      // 判断当前用户是否点赞和收藏
      postObject.isLiked = false;
      postObject.isCollected = false;
      
      // 如果用户已登录，检查是否点赞和收藏
      if (req.user) {
          try {
        // 检查是否点赞
        const like = await Like.findOne({
          where: {
            userId: req.user.id,
            target_type: 'post',
            target_id: post.id
          }
        });
        
        // 检查是否收藏
        const collection = await Collection.findOne({
          where: {
            userId: req.user.id,
            postId: post.id
          }
        });
        
        postObject.isLiked = !!like;
        postObject.isCollected = !!collection;
          } catch (err) {
            console.error('检查点赞/收藏状态失败:', err);
          }
      }
      
      // 添加发布者信息
        postObject.username = post.author?.nickname || '未知用户';
        postObject.avatar = post.author?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg';
        postObject.userId = post.author?.id || 0;
      
      return postObject;
    }));
    }
    
    // 计算总页数
    const totalPages = Math.ceil(count / limit);
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: {
        posts: posts || [],
        pagination: {
          page,
          limit,
          total: count,
          pages: totalPages
        }
      }
    });
  } catch (error) {
    console.error('获取帖子列表失败:', error);
    
    // 确保即使出错也返回正确格式的JSON
    res.status(500).json({
      success: false,
      message: '获取帖子列表失败',
      data: {
        posts: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      }
    });
  }
};

/**
 * @desc    获取单个帖子详情
 * @route   GET /api/posts/:id
 * @access  Public
 */
exports.getPost = async (req, res, next) => {
  try {
    // 获取帖子ID
    const postId = req.params.id;
    
    // 查询帖子详情
    const post = await Post.findOne({
      where: { 
        id: postId,
        status: 'published'
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'nickname', 'username', 'avatar']
        },
        {
          model: Topic,
          as: 'topicList',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });
    
    // 如果帖子不存在
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在或已被删除'
      });
    }
    
    // 增加浏览量
    post.views += 1;
    await post.save();
    
    // 转换为普通对象
    const postObject = post.toJSON();
    
    // 添加发布者信息
    postObject.username = post.author.nickname;
    postObject.avatar = post.author.avatar;
    postObject.userId = post.author.id;
    
    // 判断当前用户是否点赞和收藏
    postObject.isLiked = false;
    postObject.isCollected = false;
    
    // 如果用户已登录，检查是否点赞和收藏
    if (req.user) {
      // 检查是否点赞
      const like = await Like.findOne({
        where: {
          userId: req.user.id,
          target_type: 'post',
          target_id: post.id
        }
      });
      
      // 检查是否收藏
      const collection = await Collection.findOne({
        where: {
          userId: req.user.id,
          postId: post.id
        }
      });
      
      postObject.isLiked = !!like;
      postObject.isCollected = !!collection;
    }
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: postObject
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    创建帖子
 * @route   POST /api/posts
 * @access  Private
 */
exports.createPost = async (req, res, next) => {
  try {
    // 获取请求数据
    const { content, images, topics, categoryId } = req.body;
    
    // 验证必要字段
    if (!content) {
      return res.status(400).json({
        success: false,
        message: '请提供帖子内容'
      });
    }
    
    // 创建帖子
    const post = await Post.create({
      content,
      images: images || [],
      topics: topics || [],
      categoryId,
      userId: req.user.id
    });
    
    // 如果有话题标签，处理话题关联
    if (topics && Array.isArray(topics) && topics.length > 0) {
      // 查找或创建话题
      for (const topicName of topics) {
        if (topicName.trim()) {
          const [topic] = await Topic.findOrCreate({
            where: { name: topicName.trim() },
            defaults: { 
              name: topicName.trim(),
              usageCount: 1
            }
          });
          
          // 如果是已存在的话题，增加使用次数
          if (!topic.isNewRecord) {
            topic.usageCount += 1;
            await topic.save();
          }
          
          // 创建帖子与话题的关联
          await PostTopic.create({
            postId: post.id,
            topicId: topic.id
          });
        }
      }
    }
    
    // 创建成功后重新查询帖子，包含作者和话题信息
    const newPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'nickname', 'username', 'avatar']
        },
        {
          model: Topic,
          as: 'topicList',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });
    
    // 响应成功信息
    res.status(201).json({
      success: true,
      message: '帖子创建成功',
      data: newPost
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    更新帖子
 * @route   PUT /api/posts/:id
 * @access  Private
 */
exports.updatePost = async (req, res, next) => {
  try {
    // 获取帖子ID和请求数据
    const postId = req.params.id;
    const { content, images, topics, categoryId } = req.body;
    
    // 查找帖子
    const post = await Post.findByPk(postId);
    
    // 如果帖子不存在
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 验证帖子所有者
    if (post.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权修改此帖子'
      });
    }
    
    // 检查编辑次数是否超过限制（最多允许编辑2次）
    if (post.editCount >= 2) {
      return res.status(403).json({
        success: false,
        message: '已达到最大编辑次数限制（2次）'
      });
    }
    
    // 更新帖子
    if (content) post.content = content;
    if (images) post.images = images;
    if (topics) post.topics = topics;
    if (categoryId) post.categoryId = categoryId;
    
    // 增加编辑次数
    post.editCount = post.editCount + 1;
    
    // 保存更新
    await post.save();
    
    // 如果更新了话题，处理话题关联
    if (topics !== undefined) {
      // 删除原有的话题关联
      await PostTopic.destroy({
        where: { postId: post.id }
      });
      
      // 如果有新的话题标签，创建新的关联
      if (Array.isArray(topics) && topics.length > 0) {
        for (const topicName of topics) {
          if (topicName.trim()) {
            const [topic] = await Topic.findOrCreate({
              where: { name: topicName.trim() },
              defaults: { 
                name: topicName.trim(),
                usageCount: 1
              }
            });
            
            // 如果是已存在的话题，增加使用次数
            if (!topic.isNewRecord) {
              topic.usageCount += 1;
              await topic.save();
            }
            
            // 创建帖子与话题的关联
            await PostTopic.create({
              postId: post.id,
              topicId: topic.id
            });
          }
        }
      }
    }
    
    // 更新后重新查询帖子，包含作者和话题信息
    const updatedPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'nickname', 'username', 'avatar']
        },
        {
          model: Topic,
          as: 'topicList',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });
    
    // 响应成功信息
    res.status(200).json({
      success: true,
      message: '帖子更新成功',
      data: updatedPost
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    删除帖子
 * @route   DELETE /api/posts/:id
 * @access  Private
 */
exports.deletePost = async (req, res, next) => {
  try {
    // 获取帖子ID
    const postId = req.params.id;
    
    // 查找帖子
    const post = await Post.findByPk(postId);
    
    // 如果帖子不存在
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 验证帖子所有者
    if (post.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权删除此帖子'
      });
    }
    
    // 删除帖子相关的话题关联
    await PostTopic.destroy({
      where: { postId }
    });
    
    // 删除帖子（软删除）
    await post.destroy();
    
    // 响应成功信息
    res.status(200).json({
      success: true,
      message: '帖子删除成功'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取帖子状态（点赞和收藏）
 * @route   GET /api/posts/:id/status
 * @access  Private
 */
exports.getPostStatus = async (req, res, next) => {
  try {
    // 获取帖子ID
    const postId = req.params.id;
    console.log(`获取帖子${postId}的状态, 用户ID: ${req.user ? req.user.id : '未登录'}`);
    
    // 查询帖子是否存在
    const post = await Post.findByPk(postId, {
      attributes: ['id', 'likes', 'collections']
    });
    
    if (!post) {
      console.log(`帖子${postId}不存在`);
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 初始化帖子状态
    const postStatus = {
      id: parseInt(postId),
      likes: post.likes,
      collections: post.collections,
      isLiked: false,
      isCollected: false
    };
    
    // 如果用户已登录，检查点赞和收藏状态
    if (req.user) {
      try {
        // 检查是否点赞
        const like = await Like.findOne({
          where: {
            userId: req.user.id,
            target_type: 'post',
            target_id: postId
          }
        });
        
        // 检查是否收藏
        const collection = await Collection.findOne({
          where: {
            userId: req.user.id,
            postId
          }
        });
        
        postStatus.isLiked = !!like;
        postStatus.isCollected = !!collection;
        
        console.log(`帖子${postId}状态查询成功 - 点赞:${!!like}, 收藏:${!!collection}`);
      } catch (error) {
        console.error(`查询点赞收藏状态出错:`, error);
        // 出错但不中断请求，继续返回默认值
      }
    }
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: {
        post: postStatus
      }
    });
  } catch (error) {
    console.error(`getPostStatus 方法错误:`, error);
    next(error);
  }
};

/**
 * @desc    记录帖子浏览量（优化版）
 * @route   POST /api/posts/:id/view
 * @access  Public
 */
exports.recordView = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // 查找帖子
    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在或已被删除'
      });
    }
    
    // 防止频繁刷新计数，使用内存缓存
    // 生产环境应该使用Redis
    const cacheKey = `post_view:${id}:${userId || ip}`;
    const viewCache = req.app.locals.viewCache = req.app.locals.viewCache || {};
    
    if (!viewCache[cacheKey] || Date.now() - viewCache[cacheKey] > 300000) { // 5分钟间隔
      // 增加浏览量
      post.views += 1;
      await post.save();
      
      // 记录详细浏览数据
      const db = require('../models/associations');
      try {
        await db.PostView.create({
          postId: id,
          userId: userId,
          ipAddress: ip
        });
        
        console.log(`帖子${id}浏览量+1，当前浏览量: ${post.views}`);
      } catch (err) {
        console.error('保存浏览记录失败，但浏览量已更新:', err);
        // 即使保存记录失败，也不影响接口返回
      }
      
      // 设置缓存，5分钟内不重复计数
      viewCache[cacheKey] = Date.now();
      
      // 清理过期缓存
      Object.keys(viewCache).forEach(key => {
        if (Date.now() - viewCache[key] > 3600000) { // 1小时过期
          delete viewCache[key];
        }
      });
    }
    
    return res.json({
      success: true,
      message: '浏览已记录',
      data: { views: post.views }
    });
  } catch (error) {
    console.error('记录浏览量失败:', error);
    next(error);
  }
};

/**
 * @desc    管理员设置/取消推荐帖子
 * @route   PUT /api/posts/:id/recommend
 * @access  Admin
 */
exports.toggleRecommend = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isRecommended } = req.body;
    
    // 验证是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '只有管理员可以执行此操作'
      });
    }
    
    // 查找帖子
    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在或已被删除'
      });
    }
    
    // 更新推荐状态
    post.isRecommended = !!isRecommended;
    await post.save();
    
    return res.json({
      success: true,
      message: isRecommended ? '帖子已设为推荐' : '帖子已取消推荐',
      data: { isRecommended: post.isRecommended }
    });
  } catch (error) {
    console.error('更新帖子推荐状态失败:', error);
    next(error);
  }
};

/**
 * @desc    获取推荐帖子列表（优化版）
 * @route   GET /api/posts/recommended
 * @access  Public
 */
exports.getRecommendedPosts = async (req, res, next) => {
  try {
    // 解析查询参数
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    const { sequelize } = require('../config/db');
    
    // 构建推荐算法查询
    const { count, rows: posts } = await Post.findAndCountAll({
      where: { 
        status: 'published'
      },
      order: [
        // 优先显示管理员推荐的内容
        ['isRecommended', 'DESC'],
        // 热度公式: (点赞*2 + 评论*3 + 收藏*4 + 浏览量*0.5) + 时间权重
        [sequelize.literal(`
          (likes * 2 + 
           comments * 3 + 
           collections * 4 + 
           views * 0.5 + 
           (CASE WHEN DATEDIFF(NOW(), created_at) <= 7 
            THEN (7 - DATEDIFF(NOW(), created_at)) * 10 
            ELSE 0 END)
          )`), 'DESC']
      ],
      include: [
        {
          model: User, 
          as: 'author',
          attributes: ['id', 'nickname', 'username', 'avatar']
        },
        {
          model: Topic,
          as: 'topicList',
          attributes: ['id', 'name'],
          through: { attributes: [] },
          required: false
        }
      ],
      limit,
      offset,
      distinct: true
    });
    
    // 处理帖子，获取最新评论和用户互动状态
    const postsWithComments = await Promise.all(posts.map(async (post) => {
      // 转换为普通对象
      const postObject = post.toJSON();
      
      // 获取最新两条评论
      const latestComments = await Comment.findAll({
        where: { 
          postId: post.id,
          parentId: null,
          status: 'active'
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'nickname', 'username', 'avatar']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 2
      });
      
      // 添加评论信息到帖子对象
      postObject.latestComments = latestComments.map(comment => ({
        id: comment.id,
        userId: comment.author.id,
        username: comment.author.nickname,
        content: comment.content
      }));
      
      // 判断当前用户是否点赞和收藏
      postObject.isLiked = false;
      postObject.isCollected = false;
      
      // 如果用户已登录，检查是否点赞和收藏
      if (req.user) {
        // 检查是否点赞
        const like = await Like.findOne({
          where: {
            userId: req.user.id,
            target_type: 'post',
            target_id: post.id
          }
        });
        
        // 检查是否收藏
        const collection = await Collection.findOne({
          where: {
            userId: req.user.id,
            postId: post.id
          }
        });
        
        postObject.isLiked = !!like;
        postObject.isCollected = !!collection;
      }
      
      // 添加发布者信息
      postObject.username = post.author.nickname;
      postObject.avatar = post.author.avatar;
      postObject.userId = post.author.id;
      
      return postObject;
    }));
    
    // 计算总页数
    const totalPages = Math.ceil(count / limit);
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: {
        posts: postsWithComments,
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