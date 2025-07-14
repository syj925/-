const { User, Post, Like, Follow, Comment, Tag, Badge, UserBadge } = require('../models/associations');
const asyncHandler = require('express-async-handler');

/**
 * @desc    获取用户资料
 * @route   GET /api/users/:id/profile
 * @access  Public
 */
exports.getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  
  try {
    // 查询用户基本信息、标签和徽章
    const user = await User.findByPk(userId, {
      attributes: [
        'id', 
        'username',
        'nickname',
        'email', 
        'avatar', 
        'bio', 
        'created_at'
      ],
      include: [
        {
          model: Tag,
          as: 'tags',
          attributes: ['id', 'name', 'category', 'description', 'color', 'status'],
          through: { attributes: [] } // 不包含中间表数据
        },
        {
          model: Badge,
          as: 'badges',
          attributes: ['id', 'name', 'description', 'color'],
          through: { attributes: [] }, // 不包含中间表数据
          where: { status: true }, // 只显示启用状态的标签
          required: false // 左连接，即使用户没有标签也能查询到用户
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 查询用户统计信息
    let stats = {};
    try {
      // 分别查询各项统计数据
      const postCount = await Post.count({ where: { userId } });
      
      // 获取用户帖子的ID列表
      const userPosts = await Post.findAll({
        where: { userId },
        attributes: ['id']
      });
      const postIds = userPosts.map(p => p.id);
      
      // 统计点赞数
      const likeCount = postIds.length > 0 ? 
        await Like.count({
          where: {
            target_type: 'post',
            target_id: postIds
          }
        }) : 0;
      
      // 统计粉丝数和关注数
      const followerCount = await Follow.count({
        where: { following_id: userId }
      });
      
      const followingCount = await Follow.count({
        where: { follower_id: userId }
      });
      
      stats = {
        postCount,
        likeCount,
        followerCount,
        followingCount
      };
    } catch (statsError) {
      console.error('获取用户统计信息失败:', statsError);
      // 如果统计查询失败，使用默认值
      stats = {
        postCount: 0,
        likeCount: 0,
        followerCount: 0,
        followingCount: 0
      };
    }
    
    // 合并用户资料和统计数据
    const userProfile = {
      id: user.id,
      uid: user.id,  // 兼容前端uid字段
      username: user.nickname || user.username, // 优先使用昵称
      avatar: user.avatar || '',
      bio: user.bio || '',
      tags: user.tags || [], // 用户兴趣标签
      badges: user.badges || [], // 用户成就标签
      postCount: stats.postCount || 0,
      likeCount: stats.likeCount || 0,
      followerCount: stats.followerCount || 0,
      followingCount: stats.followingCount || 0,
      joinDate: user.created_at
    };

    res.status(200).json({
      success: true,
      data: userProfile
    });
    
  } catch (error) {
    console.error('获取用户资料失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户资料失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @desc    获取用户帖子
 * @route   GET /api/users/:id/posts
 * @access  Public
 */
exports.getUserPosts = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const sort = req.query.sort || 'latest';
  
  try {
    // 验证用户是否存在
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 构建查询选项
    const options = {
      where: { userId: userId },
      limit,
      offset,
      order: []
    };
    
    // 根据排序参数设置排序方式
    if (sort === 'latest') {
      options.order.push(['created_at', 'DESC']);
    } else if (sort === 'hot') {
      options.order.push(['likes', 'DESC']);
      options.order.push(['created_at', 'DESC']);
    }
    
    // 查询帖子
    const { count, rows: posts } = await Post.findAndCountAll(options);
    
    // 格式化帖子数据
    const formattedPosts = await Promise.all(posts.map(async post => {
      // 获取帖子的点赞数和评论数
      let likes = 0;
      let comments = 0;
      
      try {
        likes = await Like.count({
          where: {
            target_type: 'post',
            target_id: post.id
          }
        });
        
        comments = await Comment.count({
          where: { postId: post.id }
        });
      } catch (statsError) {
        console.error(`获取帖子(ID:${post.id})的点赞和评论数失败:`, statsError);
      }
      
      let images = [];
      try {
        if (post.images) {
          if (typeof post.images === 'string') {
            images = JSON.parse(post.images);
          } else {
            images = post.images;
          }
        }
      } catch (imgError) {
        console.error(`解析帖子(ID:${post.id})的图片数据失败:`, imgError);
      }
      
      let topics = [];
      try {
        if (post.topics) {
          if (typeof post.topics === 'string') {
            const parsedTopics = JSON.parse(post.topics);
            if (Array.isArray(parsedTopics)) {
              topics = parsedTopics.map(topic => typeof topic === 'object' && topic.name ? topic.name : topic);
            }
          } else if (Array.isArray(post.topics)) {
            topics = post.topics.map(topic => typeof topic === 'object' && topic.name ? topic.name : topic);
          }
        }
      } catch (topicError) {
        console.error(`解析帖子(ID:${post.id})的话题数据失败:`, topicError);
      }
      
      // 处理图片字段，如果只有一张图片，直接使用第一张作为post.image
      const image = images.length > 0 ? images[0] : null;
      
      return {
        id: post.id,
        title: post.title || '',
        content: post.content || '',
        image: image,
        images: images,
        likes: likes,
        comments: comments,
        time: formatDate(post.created_at || new Date()),
        topics: topics
      };
    }));
    
    res.status(200).json({
      success: true,
      data: {
        posts: formattedPosts,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('获取用户帖子失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户帖子失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @returns {string} - 格式化后的日期字符串
 */
function formatDate(date) {
  try {
    if (!date) return '未知时间';
    
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) {
      return '刚刚';
    } else if (diffMin < 60) {
      return `${diffMin}分钟前`;
    } else if (diffHour < 24) {
      return `${diffHour}小时前`;
    } else if (diffDay <= 7) {
      return `${diffDay}天前`;
    } else {
      const dateObj = new Date(date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '未知时间';
  }
}

/**
 * @desc    获取用户标签
 * @route   GET /api/users/:id/tags
 * @access  Public
 */
exports.getUserTags = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  
  try {
    // 验证用户是否存在
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 获取用户标签
    const userWithTags = await User.findOne({
      where: { id: userId },
      include: [
        {
          model: Tag,
          as: 'tags',
          attributes: ['id', 'name', 'category', 'description', 'color', 'status'],
          through: { attributes: [] } // 不包含中间表数据
        }
      ]
    });
    
    // 如果没有标签，返回空数组
    const tags = userWithTags.tags || [];
    
    res.status(200).json({
      success: true,
      data: tags
    });
    
  } catch (error) {
    console.error('获取用户标签失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户标签失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @desc    设置用户标签
 * @route   POST /api/users/tags
 * @access  Private
 */
exports.setUserTags = asyncHandler(async (req, res) => {
  const userId = req.user.id; // 从登录的用户获取ID
  const { tagIds } = req.body;
  
  try {
    // 验证请求体
    if (!tagIds || !Array.isArray(tagIds)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的标签ID数组'
      });
    }
    
    // 验证标签数量不超过限制
    if (tagIds.length > 10) {
      return res.status(400).json({
        success: false,
        message: '最多可以选择10个标签'
      });
    }
    
    // 验证所有标签是否存在
    const tags = await Tag.findAll({
      where: {
        id: tagIds
      }
    });
    
    if (tags.length !== tagIds.length) {
      return res.status(400).json({
        success: false,
        message: '部分标签不存在'
      });
    }
    
    // 获取用户
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 更新用户标签关联
    await user.setTags(tagIds);
    
    // 更新标签的使用次数
    for (const tag of tags) {
      tag.usageCount += 1;
      await tag.save();
    }
    
    // 获取更新后的用户标签
    const userWithTags = await User.findOne({
      where: { id: userId },
      include: [
        {
          model: Tag,
          as: 'tags',
          attributes: ['id', 'name', 'category', 'description', 'color', 'status'],
          through: { attributes: [] } // 不包含中间表数据
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      message: '用户标签设置成功',
      data: userWithTags.tags || []
    });
    
  } catch (error) {
    console.error('设置用户标签失败:', error);
    res.status(500).json({
      success: false,
      message: '设置用户标签失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}); 