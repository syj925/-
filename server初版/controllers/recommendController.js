const { User, Topic, PostTopic, Post, Comment, Like, Collection, PostView, Setting } = require('../models/associations');
const { Op } = require('sequelize');

/**
 * @desc    记录帖子浏览量
 * @route   POST /api/posts/:id/view
 * @access  Public
 */
exports.recordView = async (req, res, next) => {
  try {
    const postId = req.params.id;
    
    // 查询帖子是否存在
    const post = await Post.findByPk(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 获取用户ID和IP地址
    const userId = req.user ? req.user.id : null;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // 创建浏览记录
    try {
      await PostView.create({
        postId,
        userId,
        ipAddress
      });
      
      // 增加帖子浏览量
      post.views += 1;
      await post.save();
    } catch (err) {
      console.error('记录浏览量错误:', err);
      // 即使记录失败，我们也继续处理请求，不中断用户体验
    }
    
    res.status(200).json({
      success: true,
      message: '浏览量记录成功',
      data: {
        views: post.views
      }
    });
  } catch (error) {
    console.error('记录浏览量错误:', error);
    next(error);
  }
};

/**
 * 获取推荐算法配置参数
 * @returns {Promise<object>} 权重参数对象
 */
const getRecommendSettings = async () => {
  try {
    // 获取所有设置
    const settings = await Setting.findAll({
      where: {
        key: {
          [Op.in]: ['likeWeight', 'commentWeight', 'collectionWeight', 'viewWeight', 
                  'timeDecayDays', 'maxAgeDays', 'maxAdminRecommended']
        }
      }
    });
    
    // 转换为键值对格式
    const settingsObj = {
      likeWeight: 2.0,       // 默认值
      commentWeight: 3.0,    // 默认值
      collectionWeight: 4.0, // 默认值
      viewWeight: 0.5,       // 默认值
      timeDecayDays: 10,     // 默认天数半衰期
      maxAgeDays: 30,        // 默认最大天数
      maxAdminRecommended: 5 // 默认管理员推荐数量
    };
    
    // 使用服务器上的配置覆盖默认值
    settings.forEach(setting => {
      const key = setting.key;
      if (key === 'likeWeight' || key === 'commentWeight' || 
          key === 'collectionWeight' || key === 'viewWeight') {
        settingsObj[key] = parseFloat(setting.value);
      } else {
        settingsObj[key] = parseInt(setting.value);
      }
    });
    
    return settingsObj;
  } catch (error) {
    console.error('获取推荐设置错误:', error);
    // 返回默认设置
    return {
      likeWeight: 2.0,
      commentWeight: 3.0,
      collectionWeight: 4.0,
      viewWeight: 0.5,
      timeDecayDays: 10,
      maxAgeDays: 30,
      maxAdminRecommended: 5
    };
  }
};

/**
 * @desc    获取推荐帖子列表
 * @route   GET /api/posts/recommended
 * @access  Public
 */
exports.getRecommendedPosts = async (req, res, next) => {
  try {
    // 获取推荐配置参数
    const settings = await getRecommendSettings();
    
    // 解析查询参数
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    
    // 计算跳过的记录数
    const offset = (page - 1) * limit;
    
    // 查询条件: 已发布的帖子
    const whereClause = { status: 'published' };
    
    // 查询管理员推荐的帖子
    const adminRecommendedPosts = await Post.findAll({
      where: {
        ...whereClause,
        isRecommended: true
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
          through: { attributes: [] },
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: settings.maxAdminRecommended // 使用设置中的管理员推荐数量
    });
    
    // 获取热门帖子 (基于算法: 自定义权重)
    // 1. 获取创建时间在指定天数内的非管理员推荐帖子
    const maxAgeDaysAgo = new Date();
    maxAgeDaysAgo.setDate(maxAgeDaysAgo.getDate() - settings.maxAgeDays);
    
    // 排除已经被管理员推荐的帖子ID
    const adminRecommendedIds = adminRecommendedPosts.map(post => post.id);
    
    // 查询所有符合条件的帖子
    const recentPosts = await Post.findAll({
      where: {
        ...whereClause,
        created_at: {
          [Op.gte]: maxAgeDaysAgo
        },
        ...(adminRecommendedIds.length > 0 ? {
          id: {
            [Op.notIn]: adminRecommendedIds
          }
        } : {})
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
          through: { attributes: [] },
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // 计算每篇帖子的推荐得分
    const scoredPosts = recentPosts.map(post => {
      // 基础分数: 点赞*权重 + 评论*权重 + 收藏*权重 + 浏览量*权重
      const baseScore = (post.likes * settings.likeWeight) + 
                        (post.comments * settings.commentWeight) + 
                        (post.collections * settings.collectionWeight) + 
                        (post.views * settings.viewWeight);
      
      // 时间衰减因子: 越新的帖子权重越高
      const ageInDays = (new Date() - new Date(post.created_at)) / (1000 * 60 * 60 * 24);
      const timeFactor = Math.exp(-ageInDays / settings.timeDecayDays); // 使用设置的天数半衰期
      
      // 对于新帖子，检查是否有最小互动
      // 判断是否是新帖子（小于1天）且互动很少
      const isNewPostWithMinimalInteraction = ageInDays < 1 && 
        (post.likes + post.comments + post.collections) < 3 && 
        post.views < 10;
      
      // 最终得分
      let finalScore = baseScore * timeFactor;
      
      // 如果是新帖子且互动很少，不让它获得太高的推荐分数
      if (isNewPostWithMinimalInteraction) {
        // 为新帖子设置一个较低的得分，确保它不会超过有实际互动的帖子
        finalScore = Math.min(finalScore, 0.5);  // 限制新帖子的最高分
      }
      
      // 转换为JSON对象并添加得分
      const postObj = post.toJSON();
      postObj.recommendScore = finalScore;
      return postObj;
    });
    
    // 按得分排序
    scoredPosts.sort((a, b) => b.recommendScore - a.recommendScore);
    
    // 分页处理热门帖子
    const algorithmRecommended = scoredPosts.slice(offset, offset + limit);
    
    // 合并两种推荐结果,确保管理员推荐的排在前面
    const allRecommendedPosts = [
      ...adminRecommendedPosts.map(post => {
        const postObj = post.toJSON();
        postObj.isAdminRecommended = true;
        return postObj;
      }),
      ...algorithmRecommended
    ];
    
    // 处理每个帖子,添加最新评论等信息
    const postsWithComments = await Promise.all(allRecommendedPosts.map(async (post) => {
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
      
      // 添加评论信息
      post.latestComments = latestComments.map(comment => ({
        id: comment.id,
        userId: comment.author.id,
        username: comment.author.nickname,
        content: comment.content
      }));
      
      // 判断当前用户是否点赞和收藏
      post.isLiked = false;
      post.isCollected = false;
      
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
        
        post.isLiked = !!like;
        post.isCollected = !!collection;
      }
      
      // 添加发布者信息
      post.username = post.author.nickname;
      post.avatar = post.author.avatar;
      post.userId = post.author.id;
      
      return post;
    }));
    
    // 计算总页数 (基于算法推荐的数量)
    const total = scoredPosts.length;
    const totalPages = Math.ceil(total / limit);
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: {
        posts: postsWithComments,
        pagination: {
          page,
          limit,
          total,
          pages: totalPages
        }
      }
    });
  } catch (error) {
    console.error('获取推荐帖子错误:', error);
    next(error);
  }
}; 