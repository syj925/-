const { User, Post, Comment, Topic, Event, Setting, Log, Message, sequelize } = require('../models/associations');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const moment = require('moment');

// 管理员登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { username } });
    
    // 检查用户是否存在
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 检查用户是否是管理员
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无管理员权限'
      });
    }

    // 验证密码
    const isMatch = await user.checkPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expire }
    );

    // 返回用户信息和令牌
    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取仪表盘数据
exports.getDashboard = async (req, res) => {
  try {
    // 获取用户总数
    const userCount = await User.count();
    
    // 获取帖子总数
    const postCount = await Post.count();
    
    // 获取评论总数
    const commentCount = await Comment.count();
    
    // 获取话题总数
    const topicCount = await Topic.count();
    
    // 获取今日新增用户数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newUserCount = await User.count({
      where: {
        created_at: {
          [Op.gte]: today
        }
      }
    });
    
    // 获取今日新增帖子数
    const newPostCount = await Post.count({
      where: {
        created_at: {
          [Op.gte]: today
        }
      }
    });
    
    // 获取今日新增评论数
    const newCommentCount = await Comment.count({
      where: {
        created_at: {
          [Op.gte]: today
        }
      }
    });
    
    // 获取活跃用户排行榜（发帖最多的用户）
    // 使用更简单的查询方式，避免复杂的GROUP BY
    const activeUsersData = await sequelize.query(`
      SELECT u.id, u.username, u.nickname, u.avatar, COUNT(p.id) as postCount
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id
      WHERE u.deleted_at IS NULL AND (p.deleted_at IS NULL OR p.id IS NULL)
      GROUP BY u.id, u.username, u.nickname, u.avatar
      ORDER BY postCount DESC
      LIMIT 10
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    const activeUsers = activeUsersData.map(user => ({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      postCount: parseInt(user.postCount)
    }));
    
    // 获取热门帖子排行榜
    const hotPostsData = await sequelize.query(`
      SELECT p.id, p.content, p.created_at as createdAt, p.likes, 
             u.id as userId, u.username, u.nickname, u.avatar
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.deleted_at IS NULL AND u.deleted_at IS NULL
      ORDER BY p.likes DESC
      LIMIT 10
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    const hotPosts = hotPostsData.map(post => ({
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      likes: post.likes,
      author: {
        id: post.userId,
        username: post.username,
        nickname: post.nickname,
        avatar: post.avatar
      }
    }));
    
    res.status(200).json({
      success: true,
      data: {
        userCount,
        postCount,
        commentCount,
        topicCount,
        newUserCount,
        newPostCount,
        newCommentCount,
        activeUsers,
        hotPosts
      }
    });
  } catch (error) {
    console.error('获取仪表盘数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取用户列表
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, query = '', role = '', status = '', includeBadges = false } = req.query;
    
    // 构建查询条件
    const whereCondition = {};
    
    // 搜索条件
    if (query) {
      whereCondition[Op.or] = [
        { username: { [Op.like]: `%${query}%` } },
        { nickname: { [Op.like]: `%${query}%` } },
        { email: { [Op.like]: `%${query}%` } }
      ];
    }
    
    // 角色筛选
    if (role) {
      whereCondition.role = role;
    }
    
    // 状态筛选
    if (status) {
      whereCondition.status = status;
    }
    
    // 分页
    const offset = (page - 1) * limit;
    
    // 构建查询选项
    const findOptions = {
      where: whereCondition,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    };
    
    // 如果需要包含标签信息，添加include选项
    if (includeBadges === 'true') {
      // 修复: 正确导入Badge模型，确保传递Sequelize.DataTypes参数
      const Badge = sequelize.models.Badge;
      if (!Badge) {
        console.log('Badge模型未在sequelize.models中找到，尝试显式加载');
        // 确保正确导入Badge模型并传递DataTypes
        const { DataTypes } = require('sequelize');
        require('../models/Badge')(sequelize, DataTypes);
      }
      
      // 再次尝试获取Badge模型
      const BadgeModel = sequelize.models.Badge;
      
      if (!BadgeModel) {
        throw new Error('无法加载Badge模型');
      }
      
      findOptions.include = [
        {
          model: BadgeModel,
          as: 'badges',
          through: { attributes: [] },
          required: false
        }
      ];
    }
    
    // 查询用户列表
    const { rows, count } = await User.findAndCountAll(findOptions);
    
    // 确保每个用户对象都有badges属性，即使为空数组
    if (includeBadges === 'true') {
      rows.forEach(user => {
        if (!user.badges) {
          user.badges = [];
        }
      });
    }
    
    // 按前端期望的格式返回数据
    res.status(200).json({
      success: true,
      data: {
        items: rows,
        total: count
      },
      message: '获取用户列表成功'
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试',
      error: error.message
    });
  }
};

// 更新用户
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, email, avatar, bio, department, status, role, password } = req.body;
    
    // 查询用户是否存在
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 更新用户信息
    const updatedData = {};
    
    if (nickname !== undefined) updatedData.nickname = nickname;
    if (email !== undefined) updatedData.email = email;
    if (avatar !== undefined) updatedData.avatar = avatar;
    if (bio !== undefined) updatedData.bio = bio;
    if (department !== undefined) updatedData.department = department;
    if (status !== undefined) updatedData.status = status;
    if (role !== undefined) updatedData.role = role;
    if (password !== undefined && password.trim() !== '') updatedData.password = password;
    
    await user.update(updatedData);
    
    res.status(200).json({
      success: true,
      message: '用户信息更新成功',
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        department: user.department,
        status: user.status,
        role: user.role
      }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 删除用户
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查询用户是否存在
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 不允许删除自己
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      });
    }
    
    // 删除用户
    await user.destroy();
    
    res.status(200).json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取帖子列表
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', userId = '', categoryId = '' } = req.query;
    
    // 构建查询条件
    const whereCondition = {};
    
    // 搜索条件
    if (search) {
      whereCondition.content = { [Op.like]: `%${search}%` };
    }
    
    // 状态筛选
    if (status) {
      whereCondition.status = status;
    }
    
    // 用户筛选
    if (userId) {
      whereCondition.userId = userId;
    }
    
    // 分类筛选
    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }
    
    // 分页
    const offset = (page - 1) * limit;
    
    // 查询帖子列表
    const { rows: posts, count: total } = await Post.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'nickname', 'avatar'],
          as: 'author'
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取帖子列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 更新帖子
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, images, status, topics, categoryId } = req.body;
    
    // 查询帖子是否存在
    const post = await Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 更新帖子信息
    const updatedData = {};
    
    if (content !== undefined) updatedData.content = content;
    if (images !== undefined) updatedData.images = images;
    if (status !== undefined) updatedData.status = status;
    if (categoryId !== undefined) updatedData.categoryId = categoryId;
    
    await post.update(updatedData);
    
    // 更新帖子话题
    if (topics && Array.isArray(topics)) {
      // 先删除旧的话题关联
      await post.setTopics([]);
      
      // 添加新的话题关联
      for (const topicName of topics) {
        let topic = await Topic.findOne({ where: { name: topicName } });
        
        // 如果话题不存在，则创建新话题
        if (!topic) {
          topic = await Topic.create({
            name: topicName,
            description: `关于${topicName}的话题`
          });
        }
        
        // 建立帖子和话题的关联
        await post.addTopic(topic);
      }
    }
    
    res.status(200).json({
      success: true,
      message: '帖子更新成功',
      data: await Post.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'nickname', 'avatar']
          },
          {
            model: Topic,
            through: { attributes: [] }
          }
        ]
      })
    });
  } catch (error) {
    console.error('更新帖子错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 删除帖子
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查询帖子是否存在
    const post = await Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 删除帖子
    await post.destroy();
    
    res.status(200).json({
      success: true,
      message: '帖子删除成功'
    });
  } catch (error) {
    console.error('删除帖子错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 推荐/取消推荐帖子
exports.recommendPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRecommended } = req.body;
    
    // 查询帖子是否存在
    const post = await Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 更新帖子推荐状态
    await post.update({ 
      isRecommended: !!isRecommended 
    });
    
    res.status(200).json({
      success: true,
      message: isRecommended ? '帖子已设为推荐' : '帖子已取消推荐',
      data: {
        id: post.id,
        isRecommended: post.isRecommended
      }
    });
  } catch (error) {
    console.error('更新帖子推荐状态错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取评论列表
exports.getComments = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', postId = '', userId = '' } = req.query;
    
    // 构建查询条件
    const whereCondition = {};
    
    // 搜索条件
    if (search) {
      whereCondition.content = { [Op.like]: `%${search}%` };
    }
    
    // 帖子筛选
    if (postId) {
      whereCondition.postId = postId;
    }
    
    // 用户筛选
    if (userId) {
      whereCondition.userId = userId;
    }
    
    // 分页
    const offset = (page - 1) * limit;
    
    // 查询评论列表
    const { rows: comments, count: total } = await Comment.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'nickname', 'avatar'],
          as: 'author'
        },
        {
          model: Post,
          attributes: ['id', 'content'],
          as: 'post'
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取评论列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 更新评论
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, status } = req.body;
    
    // 查询评论是否存在
    const comment = await Comment.findByPk(id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    // 更新评论信息
    const updatedData = {};
    
    if (content !== undefined) updatedData.content = content;
    if (status !== undefined) updatedData.status = status;
    
    await comment.update(updatedData);
    
    res.status(200).json({
      success: true,
      message: '评论更新成功',
      data: await Comment.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'nickname', 'avatar']
          }
        ]
      })
    });
  } catch (error) {
    console.error('更新评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 删除评论
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查询评论是否存在
    const comment = await Comment.findByPk(id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    // 删除评论
    await comment.destroy();
    
    res.status(200).json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 话题管理相关功能 - 获取话题列表
exports.getTopics = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    // 构建查询条件
    const whereCondition = {};
    
    // 搜索条件
    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 状态筛选
    if (status) {
      whereCondition.status = status;
    }
    
    // 分页
    const offset = (page - 1) * limit;
    
    // 查询话题列表
    const { rows: topics, count: total } = await Topic.findAndCountAll({
      where: whereCondition,
      attributes: [
        'id', 'name', 'description', 'coverImage', 
        'pendingImage', 'imageStatus', 'usageCount', 
        'views', 'status', 'metaTitle', 
        'metaDescription', 'metaKeywords',
        'sensitiveWordsLevel', 'autoReview',
        'customSensitiveWords', 'bannedWords',
        'created_at', 'updated_at'
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['usageCount', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: {
        topics,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取话题列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 创建话题
exports.createTopic = async (req, res) => {
  try {
    const { name, description, coverImage } = req.body;
    
    // 检查话题是否已存在
    const existingTopic = await Topic.findOne({ where: { name } });
    
    if (existingTopic) {
      return res.status(400).json({
        success: false,
        message: '话题已存在'
      });
    }
    
    // 创建新话题
    const newTopic = await Topic.create({
      name,
      description,
      coverImage,
      usageCount: 0,
      status: 'active'
    });
    
    res.status(201).json({
      success: true,
      message: '话题创建成功',
      data: newTopic
    });
  } catch (error) {
    console.error('创建话题错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 更新话题
exports.updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, coverImage, status, imageStatus } = req.body;
    
    // 查询话题是否存在
    const topic = await Topic.findByPk(id);
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '话题不存在'
      });
    }
    
    // 更新话题信息
    const updatedData = {};
    
    if (name !== undefined) {
      // 检查新名称是否已被其他话题使用
      if (name !== topic.name) {
        const existingTopic = await Topic.findOne({ where: { name } });
        if (existingTopic) {
          return res.status(400).json({
            success: false,
            message: '话题名称已存在'
          });
        }
      }
      updatedData.name = name;
    }
    
    if (description !== undefined) updatedData.description = description;
    if (status !== undefined) updatedData.status = status;
    
    // 处理图片状态更新
    if (imageStatus !== undefined) {
      updatedData.imageStatus = imageStatus;
      
      // 如果图片审核通过，将待审核图片设置为正式封面图片
      if (imageStatus === 'approved' && topic.pendingImage) {
        updatedData.coverImage = topic.pendingImage;
        updatedData.pendingImage = null;
      }
      
      // 如果图片审核被拒绝，清除待审核图片
      if (imageStatus === 'rejected') {
        updatedData.pendingImage = null;
      }
    } else if (coverImage !== undefined) {
      updatedData.coverImage = coverImage;
    }
    
    await topic.update(updatedData);
    
    res.status(200).json({
      success: true,
      message: '话题更新成功',
      data: topic
    });
  } catch (error) {
    console.error('更新话题错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 删除话题
exports.deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查询话题是否存在
    const topic = await Topic.findByPk(id);
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '话题不存在'
      });
    }
    
    // 检查话题是否被使用
    const postsCount = await topic.countPosts();
    
    if (postsCount > 0) {
      // 软删除话题
      await topic.update({ status: 'deleted' });
      
      return res.status(200).json({
        success: true,
        message: '话题已被标记为删除状态',
        data: { softDelete: true }
      });
    }
    
    // 硬删除话题
    await topic.destroy();
    
    res.status(200).json({
      success: true,
      message: '话题删除成功'
    });
  } catch (error) {
    console.error('删除话题错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 活动管理
exports.getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    
    // 构建查询条件
    const whereCondition = {};
    
    // 搜索条件
    if (search) {
      whereCondition[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 状态筛选
    if (status) {
      whereCondition.status = status;
    }
    
    // 分页
    const offset = (page - 1) * limit;
    
    // 查询活动列表
    const { rows: events, count: total } = await Event.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: offset,
      order: [['startTime', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取活动列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 创建活动
exports.createEvent = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      coverImage, 
      detailImages, 
      notices, 
      location, 
      startTime, 
      endTime, 
      maxParticipants, 
      registrationFields,
      allowCancelRegistration,
      registrationDeadline
    } = req.body;
    
    // 创建新活动
    const newEvent = await Event.create({
      title,
      description,
      coverImage,
      detailImages,
      notices,
      location,
      startTime,
      endTime,
      maxParticipants,
      currentParticipants: 0,
      status: 'upcoming',
      creatorId: req.user.id, // 添加当前登录用户的ID作为创建者
      registrationFields: registrationFields || [],
      allowCancelRegistration: allowCancelRegistration !== undefined ? allowCancelRegistration : true,
      registrationDeadline
    });
    
    res.status(201).json({
      success: true,
      message: '活动创建成功',
      data: newEvent
    });
  } catch (error) {
    console.error('创建活动错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 更新活动
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      coverImage, 
      detailImages, 
      notices, 
      location, 
      startTime, 
      endTime, 
      maxParticipants, 
      status,
      registrationFields,
      allowCancelRegistration,
      registrationDeadline,
      isRecommended
    } = req.body;
    
    // 查询活动是否存在
    const event = await Event.findByPk(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }
    
    // 更新活动信息
    const updatedData = {};
    
    if (title !== undefined) updatedData.title = title;
    if (description !== undefined) updatedData.description = description;
    if (coverImage !== undefined) updatedData.coverImage = coverImage;
    if (detailImages !== undefined) updatedData.detailImages = detailImages;
    if (notices !== undefined) updatedData.notices = notices;
    if (location !== undefined) updatedData.location = location;
    if (startTime !== undefined) updatedData.startTime = startTime;
    if (endTime !== undefined) updatedData.endTime = endTime;
    if (maxParticipants !== undefined) updatedData.maxParticipants = maxParticipants;
    if (status !== undefined) updatedData.status = status;
    if (registrationFields !== undefined) updatedData.registrationFields = registrationFields;
    if (allowCancelRegistration !== undefined) updatedData.allowCancelRegistration = allowCancelRegistration;
    if (registrationDeadline !== undefined) updatedData.registrationDeadline = registrationDeadline;
    if (isRecommended !== undefined) updatedData.isRecommended = isRecommended;
    
    console.log('更新活动数据:', JSON.stringify(updatedData)); // 添加日志
    
    await event.update(updatedData);
    
    res.status(200).json({
      success: true,
      message: '活动更新成功',
      data: event
    });
  } catch (error) {
    console.error('更新活动错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 删除活动
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查询活动是否存在
    const event = await Event.findByPk(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }
    
    // 删除活动
    await event.destroy();
    
    res.status(200).json({
      success: true,
      message: '活动删除成功'
    });
  } catch (error) {
    console.error('删除活动错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取系统设置
exports.getSettings = async (req, res) => {
  try {
    // 使用原始SQL查询获取所有设置
    const settings = await sequelize.query(
      'SELECT * FROM settings',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    // 转换为键值对格式
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    res.status(200).json({
      success: true,
      data: settingsObj
    });
  } catch (error) {
    console.error('获取系统设置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 更新系统设置
exports.updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    // 批量更新系统设置
    for (const key in settings) {
      if (Object.hasOwnProperty.call(settings, key)) {
        const value = settings[key];
        
        // 处理数组类型的设置值
        const settingValue = Array.isArray(value) ? JSON.stringify(value) : value;
        
        // 查找设置是否存在
        let [setting, created] = await Setting.findOrCreate({ 
          where: { key },
          defaults: {
            key,
            value: settingValue,
            description: `${key}设置`,
            type: Array.isArray(value) ? 'json' : typeof value === 'number' ? 'number' : 'string'
          }
        });
        
        if (!created) {
          // 更新设置
          await setting.update({ value: settingValue });
        }
      }
    }
    
    res.status(200).json({
      success: true,
      message: '系统设置更新成功'
    });
  } catch (error) {
    console.error('更新系统设置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 初始化推荐设置
exports.initRecommendationSettings = async (req, res) => {
  try {
    // 检查是否已存在推荐设置
    const existingSettings = await Setting.findOne({
      where: {
        key: 'likeWeight'
      }
    });
    
    if (existingSettings) {
      return res.status(200).json({
        success: true,
        message: '推荐设置已存在，无需初始化'
      });
    }
    
    // 使用批量创建初始化推荐设置
    const now = new Date();
    await Setting.bulkCreate([
      {
        key: 'likeWeight',
        value: '2.0',
        description: '推荐算法中点赞的权重系数',
        type: 'number',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'commentWeight',
        value: '3.0',
        description: '推荐算法中评论的权重系数',
        type: 'number',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'collectionWeight',
        value: '4.0',
        description: '推荐算法中收藏的权重系数',
        type: 'number',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'viewWeight',
        value: '0.5',
        description: '推荐算法中浏览量的权重系数',
        type: 'number',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'timeDecayDays',
        value: '10',
        description: '推荐算法中时间衰减的半衰期(天)',
        type: 'number',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'maxAgeDays',
        value: '30',
        description: '推荐算法中内容的最大持续天数',
        type: 'number',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'maxAdminRecommended',
        value: '5',
        description: '首页显示的管理员手动推荐内容的最大数量',
        type: 'number',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      },
      // 添加搜索设置默认值
      {
        key: 'hotSearchKeywords',
        value: '校园活动\n期末考试\n寻物启事\n二手交易\n实习招聘\n美食推荐\n考研资料',
        description: '热门搜索词列表',
        type: 'string',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'topicBaseWeight',
        value: '0.7',
        description: '话题热榜基础权重',
        type: 'number',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'topicRecentWeight',
        value: '0.3',
        description: '话题热榜时效权重',
        type: 'number',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'topicRecentDays',
        value: '7',
        description: '话题热榜统计天数',
        type: 'number',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'maxHotTopics',
        value: '10',
        description: '话题热榜最大数量',
        type: 'number',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      },
    ]);
    
    res.status(200).json({
      success: true,
      message: '推荐设置初始化成功'
    });
  } catch (error) {
    console.error('初始化推荐设置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 初始化搜索设置
exports.initSearchSettings = async (req, res) => {
  try {
    // 检查是否已存在搜索设置
    const existingSettings = await Setting.findOne({
      where: {
        key: 'hotSearchKeywords'
      }
    });
    
    if (existingSettings) {
      return res.status(200).json({
        success: true,
        message: '搜索设置已存在，无需初始化'
      });
    }
    
    // 使用批量创建初始化搜索设置
    const now = new Date();
    await Setting.bulkCreate([
      {
        key: 'hotSearchKeywords',
        value: '校园活动\n期末考试\n寻物启事\n二手交易\n实习招聘\n美食推荐\n考研资料',
        description: '热门搜索词列表',
        type: 'string',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'topicBaseWeight',
        value: '0.7',
        description: '话题热榜基础权重',
        type: 'number',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'topicRecentWeight',
        value: '0.3',
        description: '话题热榜时效权重',
        type: 'number',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'topicRecentDays',
        value: '7',
        description: '话题热榜统计天数',
        type: 'number',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'maxHotTopics',
        value: '10',
        description: '话题热榜最大数量',
        type: 'number',
        isSystem: true,
        createdAt: now,
        updatedAt: now
      }
    ]);
    
    res.status(200).json({
      success: true,
      message: '搜索设置初始化成功'
    });
  } catch (error) {
    console.error('初始化搜索设置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取操作日志
exports.getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId = '', action = '', startDate = '', endDate = '' } = req.query;
    
    // 构建查询条件
    const whereCondition = {};
    
    // 用户筛选
    if (userId) {
      whereCondition.userId = userId;
    }
    
    // 操作类型筛选
    if (action) {
      whereCondition.action = action;
    }
    
    // 日期范围筛选
    if (startDate || endDate) {
      whereCondition.created_at = {};
      
      if (startDate) {
        whereCondition.created_at[Op.gte] = new Date(startDate);
      }
      
      if (endDate) {
        whereCondition.created_at[Op.lte] = new Date(endDate);
      }
    }
    
    // 分页
    const offset = (page - 1) * limit;
    
    // 查询日志列表
    const { rows: logs, count: total } = await Log.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取操作日志错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取仪表盘趋势数据
exports.getTrendData = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    let startDate, endDate, format, intervals;
    const now = new Date();
    
    // 根据周期设置日期范围
    switch (period) {
      case 'day':
        startDate = moment().startOf('day').toDate();
        endDate = moment().endOf('day').toDate();
        format = 'HH'; // 小时格式
        intervals = 8; // 每3小时一个数据点
        break;
      case 'week':
        startDate = moment().startOf('week').toDate();
        endDate = moment().endOf('week').toDate();
        format = 'dddd'; // 星期几
        intervals = 7; // 7天
        break;
      case 'month':
        startDate = moment().startOf('month').toDate();
        endDate = moment().endOf('month').toDate();
        format = 'DD'; // 日期
        intervals = 6; // 每5天一个数据点
        break;
      default:
        startDate = moment().startOf('week').toDate();
        endDate = moment().endOf('week').toDate();
        format = 'dddd';
        intervals = 7;
    }
    
    // 查询指定时间范围内的用户注册数据
    const userStats = await getStatsForPeriod(User, startDate, endDate, period, intervals);
    
    // 查询指定时间范围内的帖子发布数据
    const postStats = await getStatsForPeriod(Post, startDate, endDate, period, intervals);
    
    // 查询指定时间范围内的评论发布数据
    const commentStats = await getStatsForPeriod(Comment, startDate, endDate, period, intervals);
    
    res.status(200).json({
      success: true,
      data: {
        users: userStats,
        posts: postStats,
        comments: commentStats
      }
    });
  } catch (error) {
    console.error('获取趋势数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取用户分布数据
exports.getUserDistribution = async (req, res) => {
  try {
    // 获取所有用户的角色分布
    const roleCounts = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role']
    });
    
    // 转换为前端所需的格式
    const roleData = roleCounts.map(item => ({
      name: getRoleName(item.role),
      value: parseInt(item.get('count'))
    }));
    
    // 如果没有足够的角色数据，生成默认数据
    if (roleData.length < 2) {
      const totalUsers = await User.count();
      return res.status(200).json({
        success: true,
        data: [
          { name: '学生', value: Math.floor(totalUsers * 0.8) },
          { name: '教师', value: Math.floor(totalUsers * 0.15) },
          { name: '管理员', value: Math.ceil(totalUsers * 0.05) }
        ]
      });
    }
    
    res.status(200).json({
      success: true,
      data: roleData
    });
  } catch (error) {
    console.error('获取用户分布数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 辅助函数：根据周期获取统计数据
async function getStatsForPeriod(Model, startDate, endDate, period, intervals) {
  let result = [];
  
  switch (period) {
    case 'day':
      // 按小时统计
      result = await getDailyStats(Model, startDate, endDate);
      break;
    case 'week':
      // 按天统计
      result = await getWeeklyStats(Model, startDate, endDate);
      break;
    case 'month':
      // 按5天间隔统计
      result = await getMonthlyStats(Model, startDate, endDate, intervals);
      break;
  }
  
  return result;
}

// 获取每日（小时级别）统计
async function getDailyStats(Model, startDate, endDate) {
  // 每3小时一个数据点
  const stats = [];
  const hours = ['0点', '3点', '6点', '9点', '12点', '15点', '18点', '21点'];
  
  for (let i = 0; i < 8; i++) {
    const hourStart = moment(startDate).add(i * 3, 'hours').toDate();
    const hourEnd = moment(startDate).add((i + 1) * 3, 'hours').toDate();
    
    const count = await Model.count({
      where: {
        created_at: {
          [Op.gte]: hourStart,
          [Op.lt]: hourEnd
        }
      }
    });
    
    stats.push(count);
  }
  
  return stats;
}

// 获取每周（天级别）统计
async function getWeeklyStats(Model, startDate, endDate) {
  const stats = [];
  
  for (let i = 0; i < 7; i++) {
    const dayStart = moment(startDate).add(i, 'days').startOf('day').toDate();
    const dayEnd = moment(startDate).add(i, 'days').endOf('day').toDate();
    
    const count = await Model.count({
      where: {
        created_at: {
          [Op.gte]: dayStart,
          [Op.lt]: dayEnd
        }
      }
    });
    
    stats.push(count);
  }
  
  return stats;
}

// 获取每月（5天间隔）统计
async function getMonthlyStats(Model, startDate, endDate, intervals) {
  const stats = [];
  const daysInMonth = moment(endDate).diff(moment(startDate), 'days') + 1;
  const step = Math.floor(daysInMonth / intervals);
  
  for (let i = 0; i < intervals; i++) {
    const intervalStart = moment(startDate).add(i * step, 'days').startOf('day').toDate();
    const intervalEnd = moment(startDate).add((i + 1) * step, 'days').startOf('day').toDate();
    
    const count = await Model.count({
      where: {
        created_at: {
          [Op.gte]: intervalStart,
          [Op.lt]: i === intervals - 1 ? endDate : intervalEnd
        }
      }
    });
    
    stats.push(count);
  }
  
  return stats;
}

// 辅助函数：获取角色显示名称
function getRoleName(role) {
  switch (role) {
    case 'admin':
      return '管理员';
    case 'teacher':
      return '教师';
    case 'student':
      return '学生';
    case 'user':
      return '普通用户';
    default:
      return role || '其他';
  }
}

// 获取待审核用户列表
exports.getPendingUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // 分页
    const offset = (page - 1) * limit;
    
    // 查询状态为inactive（待审核）的用户
    const { rows: users, count: total } = await User.findAndCountAll({
      where: { status: 'inactive' },
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取待审核用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 审核用户
exports.auditUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    // 查询用户是否存在
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 检查用户状态是否为待审核
    if (user.status !== 'inactive') {
      return res.status(400).json({
        success: false,
        message: '该用户不在待审核状态'
      });
    }
    
    // 根据action处理
    if (action === 'approve') {
      // 通过审核
      await user.update({ status: 'active' });
      
      res.status(200).json({
        success: true,
        message: '已通过用户审核',
        data: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          status: user.status
        }
      });
    } else if (action === 'reject') {
      // 拒绝审核，设为禁用状态
      await user.update({ status: 'banned' });
      
      res.status(200).json({
        success: true,
        message: '已拒绝用户审核',
        data: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          status: user.status
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: '无效的操作类型'
      });
    }
  } catch (error) {
    console.error('审核用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取待审核帖子列表
exports.getPendingPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // 分页
    const offset = (page - 1) * limit;
    
    // 查询状态为pending（待审核）的帖子
    const { rows: posts, count: total } = await Post.findAndCountAll({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'nickname', 'avatar'],
          as: 'author'
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取待审核帖子列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 审核帖子
exports.auditPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    // 查询帖子是否存在
    const post = await Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 检查帖子状态是否为待审核
    if (post.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '该帖子不在待审核状态'
      });
    }
    
    // 根据action处理
    if (action === 'approve') {
      // 通过审核
      await post.update({ status: 'active' });
      
      res.status(200).json({
        success: true,
        message: '已通过帖子审核',
        data: {
          id: post.id,
          content: post.content,
          status: post.status
        }
      });
    } else if (action === 'reject') {
      // 拒绝审核，设为禁用状态
      await post.update({ status: 'rejected' });
      
      res.status(200).json({
        success: true,
        message: '已拒绝帖子审核',
        data: {
          id: post.id,
          content: post.content,
          status: post.status
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: '无效的操作类型'
      });
    }
  } catch (error) {
    console.error('审核帖子错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取待审核评论列表
exports.getPendingComments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // 分页
    const offset = (page - 1) * limit;
    
    // 查询状态为pending（待审核）的评论
    const { rows: comments, count: total } = await Comment.findAndCountAll({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'nickname', 'avatar'],
          as: 'author'
        },
        {
          model: Post,
          attributes: ['id', 'content'],
          as: 'post'
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取待审核评论列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 审核评论
exports.auditComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    // 查询评论是否存在
    const comment = await Comment.findByPk(id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    // 检查评论状态是否为待审核
    if (comment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '该评论不在待审核状态'
      });
    }
    
    // 根据action处理
    if (action === 'approve') {
      // 通过审核
      await comment.update({ status: 'active' });
      
      res.status(200).json({
        success: true,
        message: '已通过评论审核',
        data: {
          id: comment.id,
          content: comment.content,
          status: comment.status
        }
      });
    } else if (action === 'reject') {
      // 拒绝审核，设为禁用状态
      await comment.update({ status: 'rejected' });
      
      res.status(200).json({
        success: true,
        message: '已拒绝评论审核',
        data: {
          id: comment.id,
          content: comment.content,
          status: comment.status
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: '无效的操作类型'
      });
    }
  } catch (error) {
    console.error('审核评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取单个用户详情
exports.getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查询用户是否存在
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] } // 不返回密码字段
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 获取用户发布的帖子数量
    const postsCount = await Post.count({
      where: { userId: id }
    });
    
    // 获取用户发表的评论数量
    const commentsCount = await Comment.count({
      where: { userId: id }
    });
    
    // 返回用户详细信息
    res.status(200).json({
      success: true,
      data: {
        ...user.toJSON(),
        postsCount,
        commentsCount
      }
    });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取话题统计数据
exports.getTopicStatistics = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const today = new Date();
    let startDate, endDate;
    
    // 设置统计周期
    switch(period) {
      case 'day':
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        endDate = new Date(today);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        endDate = new Date(today);
        break;
      case 'year':
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        endDate = new Date(today);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        endDate = new Date(today);
    }
    
    // 获取话题总数
    const totalTopics = await Topic.count();
    
    // 获取活跃话题数量
    const activeTopics = await Topic.count({
      where: { status: 'active' }
    });
    
    // 获取隐藏话题数量
    const hiddenTopics = await Topic.count({
      where: { status: 'hidden' }
    });
    
    // 获取已删除话题数量
    const deletedTopics = await Topic.count({
      where: { status: 'deleted' }
    });
    
    // 获取新增话题数量
    const newTopics = await Topic.count({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      }
    });
    
    // 获取使用最多的前10个话题
    const topUsedTopics = await Topic.findAll({
      attributes: ['id', 'name', 'usageCount', 'status', 'views', 'created_at', 'updated_at'],
      order: [['usageCount', 'DESC']],
      limit: 10
    });
    
    // 获取最近创建的10个话题
    const recentTopics = await Topic.findAll({
      attributes: ['id', 'name', 'usageCount', 'status', 'views', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    // 返回统计数据
    res.status(200).json({
      success: true,
      data: {
        totalTopics,
        activeTopics,
        hiddenTopics,
        deletedTopics,
        newTopics,
        topUsedTopics,
        recentTopics,
        period
      }
    });
  } catch (error) {
    console.error('获取话题统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 批量操作话题
exports.batchOperateTopics = async (req, res) => {
  try {
    const { ids, action } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要操作的话题'
      });
    }
    
    if (!action) {
      return res.status(400).json({
        success: false,
        message: '请指定要执行的操作'
      });
    }
    
    let updatedData = {};
    let message = '';
    
    switch (action) {
      case 'activate':
        updatedData = { status: 'active' };
        message = '话题已成功激活';
        
        // 批量更新话题
        await Topic.update(updatedData, {
          where: { id: ids }
        });
        break;
        
      case 'hide':
        updatedData = { status: 'hidden' };
        message = '话题已成功隐藏';
        
        // 批量更新话题
        await Topic.update(updatedData, {
          where: { id: ids }
        });
        break;
        
      case 'delete':
        // 执行硬删除而不是软删除
        await Topic.destroy({
          where: { id: ids },
          force: true // 强制物理删除，而不是软删除
        });
        
        message = '话题已成功物理删除';
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: '不支持的操作'
        });
    }
    
    res.status(200).json({
      success: true,
      message: message,
      data: { affected: ids.length }
    });
  } catch (error) {
    console.error('批量操作话题错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 合并话题
exports.mergeTopics = async (req, res) => {
  try {
    const { sourceId, targetId } = req.body;
    
    if (!sourceId || !targetId) {
      return res.status(400).json({
        success: false,
        message: '请提供源话题ID和目标话题ID'
      });
    }
    
    if (sourceId === targetId) {
      return res.status(400).json({
        success: false,
        message: '源话题和目标话题不能相同'
      });
    }
    
    // 查询源话题和目标话题
    const sourceTopicPromise = Topic.findByPk(sourceId);
    const targetTopicPromise = Topic.findByPk(targetId);
    
    const [sourceTopic, targetTopic] = await Promise.all([sourceTopicPromise, targetTopicPromise]);
    
    if (!sourceTopic) {
      return res.status(404).json({
        success: false,
        message: '源话题不存在'
      });
    }
    
    if (!targetTopic) {
      return res.status(404).json({
        success: false,
        message: '目标话题不存在'
      });
    }
    
    // 开启事务
    const transaction = await sequelize.transaction();
    
    try {
      // 更新帖子关联的话题
      await sequelize.query(
        `UPDATE post_topics 
         SET topic_id = ? 
         WHERE topic_id = ?`,
        {
          replacements: [targetId, sourceId],
          type: sequelize.QueryTypes.UPDATE,
          transaction
        }
      );
      
      // 更新目标话题的使用次数
      await targetTopic.update({
        usageCount: targetTopic.usageCount + sourceTopic.usageCount
      }, { transaction });
      
      // 软删除源话题
      await sourceTopic.update({ 
        status: 'deleted',
        name: `${sourceTopic.name} (已合并至 ${targetTopic.name})`
      }, { transaction });
      
      // 提交事务
      await transaction.commit();
      
      res.status(200).json({
        success: true,
        message: `话题 ${sourceTopic.name} 已成功合并至 ${targetTopic.name}`,
        data: {
          target: targetTopic,
          source: sourceTopic
        }
      });
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('合并话题错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 更新话题SEO信息
exports.updateTopicSeo = async (req, res) => {
  try {
    const { id } = req.params;
    const { metaTitle, metaDescription, metaKeywords } = req.body;
    
    // 查询话题是否存在
    const topic = await Topic.findByPk(id);
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '话题不存在'
      });
    }
    
    // 更新SEO信息
    const updatedData = {};
    if (metaTitle !== undefined) updatedData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updatedData.metaDescription = metaDescription;
    if (metaKeywords !== undefined) updatedData.metaKeywords = metaKeywords;
    
    await topic.update(updatedData);
    
    res.status(200).json({
      success: true,
      message: 'SEO信息更新成功',
      data: topic
    });
  } catch (error) {
    console.error('更新话题SEO信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 更新话题审核配置
exports.updateTopicReviewConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { sensitiveWordsLevel, autoReview, customSensitiveWords, bannedWords } = req.body;
    
    // 查询话题是否存在
    const topic = await Topic.findByPk(id);
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '话题不存在'
      });
    }
    
    // 更新审核配置
    const updatedData = {};
    if (sensitiveWordsLevel !== undefined) updatedData.sensitiveWordsLevel = sensitiveWordsLevel;
    if (autoReview !== undefined) updatedData.autoReview = autoReview;
    if (customSensitiveWords !== undefined) updatedData.customSensitiveWords = customSensitiveWords;
    if (bannedWords !== undefined) updatedData.bannedWords = bannedWords;
    
    await topic.update(updatedData);
    
    res.status(200).json({
      success: true,
      message: '审核配置更新成功',
      data: topic
    });
  } catch (error) {
    console.error('更新话题审核配置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 话题图片审核
exports.reviewTopicImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // action: approve或reject
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: '无效的操作类型'
      });
    }
    
    // 查询话题是否存在，明确指定需要获取的字段
    const topic = await Topic.findByPk(id, {
      attributes: [
        'id', 'name', 'description', 'coverImage', 
        'pendingImage', 'imageStatus', 'usageCount', 
        'views', 'status', 'metaTitle', 
        'metaDescription', 'metaKeywords', 
        'sensitiveWordsLevel', 'autoReview',
        'customSensitiveWords', 'bannedWords'
      ]
    });
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '话题不存在'
      });
    }
    
    // 检查是否有待审核的图片
    if (!topic.pendingImage || topic.imageStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '该话题没有待审核的图片'
      });
    }
    
    // 处理审核
    if (action === 'approve') {
      // 通过审核
      await topic.update({
        coverImage: topic.pendingImage,
        pendingImage: null,
        imageStatus: 'approved'
      });
      
      res.status(200).json({
        success: true,
        message: '已通过话题图片审核',
        data: topic
      });
    } else {
      // 拒绝审核
      await topic.update({
        pendingImage: null,
        imageStatus: 'rejected'
      });
      
      res.status(200).json({
        success: true,
        message: '已拒绝话题图片',
        data: topic
      });
    }
  } catch (error) {
    console.error('审核话题图片错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取待审核话题图片列表
exports.getPendingTopicImages = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // 分页
    const offset = (page - 1) * limit;
    
    // 查询待审核图片的话题，明确指定需要的字段
    const { rows: topics, count: total } = await Topic.findAndCountAll({
      where: { 
        imageStatus: 'pending',
        pendingImage: {
          [Op.ne]: null
        }
      },
      attributes: [
        'id', 'name', 'description', 'coverImage', 
        'pendingImage', 'imageStatus', 'usageCount', 
        'views', 'status', 'created_at', 'updated_at'
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['updated_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: {
        topics,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取待审核话题图片列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// ========================= 消息管理相关功能 =========================
// 获取系统消息列表
exports.getSystemMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10, type = '', searchQuery = '', startDate = '', endDate = '' } = req.query;
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const whereCondition = {
      type: 'system' // 系统消息类型
    };
    
    // 如果有消息子类型筛选
    if (type) {
      whereCondition.subType = type;
    }
    
    // 如果有搜索关键词
    if (searchQuery) {
      whereCondition.title = { [Op.like]: `%${searchQuery}%` };
    }
    
    // 日期范围筛选
    if (startDate && endDate) {
      whereCondition.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereCondition.created_at = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereCondition.created_at = { [Op.lte]: new Date(endDate) };
    }
    
    // 查询消息
    const { count, rows } = await Message.findAndCountAll({
      where: whereCondition,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // 格式化消息数据
    const formattedMessages = rows.map(message => {
      const msg = message.toJSON();
      return {
        id: msg.id,
        title: msg.title,
        content: msg.content,
        type: msg.subType || 'other',
        sender: msg.senderId ? 'admin' : 'system',
        targetGroup: msg.recipientType || 'all',
        sendTime: msg.created_at,
        readCount: msg.readCount || 0,
        totalCount: msg.totalCount || 0
      };
    });
    
    res.json({
      success: true,
      data: {
        rows: formattedMessages,
        total: count
      }
    });
  } catch (error) {
    console.error('获取系统消息列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取系统消息详情
exports.getSystemMessageDetail = async (req, res) => {
  try {
    const messageId = req.params.id;
    
    const message = await Message.findByPk(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: '消息不存在或已被删除'
      });
    }
    
    const formattedMessage = {
      id: message.id,
      title: message.title,
      content: message.content,
      type: message.subType || 'other',
      sender: message.senderId ? 'admin' : 'system',
      targetGroup: message.recipientType || 'all',
      sendTime: message.created_at,
      readCount: message.readCount || 0,
      totalCount: message.totalCount || 0
    };
    
    res.json({
      success: true,
      data: formattedMessage
    });
  } catch (error) {
    console.error('获取系统消息详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 创建系统消息
exports.createSystemMessage = async (req, res) => {
  try {
    const { title, content, type = 'announcement', targetGroup = 'all', specificUsers = [], sendNow = true, scheduledTime } = req.body;
    
    // 验证必填字段
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '标题和内容不能为空'
      });
    }
    
    // 创建消息基本信息
    const messageData = {
      title,
      content,
      type: 'system',
      subType: type,
      senderId: req.user.id,
      recipientType: targetGroup,
      isRead: false
    };
    
    let recipients = [];
    let totalCount = 0;
    
    // 根据目标用户组获取接收者列表
    if (targetGroup === 'all') {
      // 获取所有用户的ID
      const users = await User.findAll({
        attributes: ['id']
      });
      recipients = users.map(user => user.id);
      totalCount = users.length;
    } else if (targetGroup === 'new') {
      // 获取最近30天注册的新用户
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newUsers = await User.findAll({
        where: {
          created_at: { [Op.gte]: thirtyDaysAgo }
        },
        attributes: ['id']
      });
      recipients = newUsers.map(user => user.id);
      totalCount = newUsers.length;
    } else if (targetGroup === 'active') {
      // 获取最近活跃用户（最近30天有登录记录的）
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsers = await User.findAll({
        where: {
          last_login_at: { [Op.gte]: thirtyDaysAgo }
        },
        attributes: ['id']
      });
      recipients = activeUsers.map(user => user.id);
      totalCount = activeUsers.length;
    } else if (targetGroup === 'specific' && specificUsers.length > 0) {
      // 使用指定的用户列表
      recipients = specificUsers;
      totalCount = specificUsers.length;
    }
    
    // 批量创建消息
    const messages = [];
    
    if (recipients.length > 0) {
      for (const recipientId of recipients) {
        messages.push({
          ...messageData,
          recipientId
        });
      }
      
      // 如果是定时发送
      if (!sendNow && scheduledTime) {
        // 暂存到待发送队列（实际项目中可能会使用消息队列或定时任务）
        // 这里简化处理，添加一个scheduled_time字段
        messageData.scheduled_time = new Date(scheduledTime);
        
        // 创建一条调度记录
        await Message.create({
          ...messageData,
          recipientId: null, // 调度记录没有具体接收者
          status: 'scheduled',
          recipientsData: JSON.stringify(recipients), // 存储接收者列表
          totalCount
        });
        
        return res.json({
          success: true,
          message: '系统消息已安排定时发送',
          data: { scheduledTime }
        });
      }
      
      // 立即发送
      await Message.bulkCreate(messages);
    }
    
    res.json({
      success: true,
      message: '系统消息已发送',
      data: { recipientCount: totalCount }
    });
  } catch (error) {
    console.error('创建系统消息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 删除系统消息
exports.deleteSystemMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    
    // 找到系统消息
    const message = await Message.findOne({
      where: {
        id: messageId,
        type: 'system'
      }
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: '消息不存在或已被删除'
      });
    }
    
    // 如果是单条消息，直接删除
    await message.destroy();
    
    // 如果是批量发送的消息，需要删除所有相关消息
    if (message.batchId) {
      await Message.destroy({
        where: {
          batchId: message.batchId
        }
      });
    }
    
    res.json({
      success: true,
      message: '系统消息已删除'
    });
  } catch (error) {
    console.error('删除系统消息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取互动消息列表
exports.getInteractionMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10, type = '', searchQuery = '', startDate = '', endDate = '' } = req.query;
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const whereCondition = {
      type: { [Op.ne]: 'system' } // 非系统消息
    };
    
    // 如果有消息子类型筛选
    if (type) {
      whereCondition.type = type;
    }
    
    // 如果有搜索关键词（搜索发送者或接收者用户名）
    if (searchQuery) {
      // 这里需要联表查询，所以先不加入whereCondition，后面在include中处理
    }
    
    // 日期范围筛选
    if (startDate && endDate) {
      whereCondition.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereCondition.created_at = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereCondition.created_at = { [Op.lte]: new Date(endDate) };
    }
    
    // 构建include对象，用于联表查询
    const includeOptions = [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'username', 'nickname', 'avatar']
      },
      {
        model: User,
        as: 'recipient',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }
    ];
    
    // 如果有搜索关键词，添加到include的where条件中
    if (searchQuery) {
      includeOptions.forEach(include => {
        include.where = {
          [Op.or]: [
            { username: { [Op.like]: `%${searchQuery}%` } },
            { nickname: { [Op.like]: `%${searchQuery}%` } }
          ]
        };
        include.required = false; // 使用left join
      });
    }
    
    // 查询消息
    const { count, rows } = await Message.findAndCountAll({
      where: whereCondition,
      include: includeOptions,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true // 确保count正确
    });
    
    // 格式化消息数据
    const formattedMessages = rows.map(message => {
      const msg = message.toJSON();
      return {
        id: msg.id,
        type: msg.type,
        sender: msg.sender ? (msg.sender.nickname || msg.sender.username) : 'system',
        senderId: msg.sender ? msg.sender.id : null,
        receiver: msg.recipient ? (msg.recipient.nickname || msg.recipient.username) : null,
        receiverId: msg.recipientId,
        content: msg.content,
        targetType: msg.targetType,
        targetId: msg.targetId,
        createTime: msg.created_at,
        isRead: msg.isRead
      };
    });
    
    res.json({
      success: true,
      data: {
        rows: formattedMessages,
        total: count
      }
    });
  } catch (error) {
    console.error('获取互动消息列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取互动消息详情
exports.getInteractionMessageDetail = async (req, res) => {
  try {
    const messageId = req.params.id;
    
    const message = await Message.findOne({
      where: {
        id: messageId,
        type: { [Op.ne]: 'system' }
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: '消息不存在或已被删除'
      });
    }
    
    const msg = message.toJSON();
    const formattedMessage = {
      id: msg.id,
      type: msg.type,
      sender: msg.sender ? (msg.sender.nickname || msg.sender.username) : 'system',
      senderId: msg.sender ? msg.sender.id : null,
      senderAvatar: msg.sender ? msg.sender.avatar : null,
      receiver: msg.recipient ? (msg.recipient.nickname || msg.recipient.username) : null,
      receiverId: msg.recipientId,
      receiverAvatar: msg.recipient ? msg.recipient.avatar : null,
      content: msg.content,
      targetType: msg.targetType,
      targetId: msg.targetId,
      createTime: msg.created_at,
      isRead: msg.isRead
    };
    
    res.json({
      success: true,
      data: formattedMessage
    });
  } catch (error) {
    console.error('获取互动消息详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 删除互动消息
exports.deleteInteractionMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    
    // 找到互动消息
    const message = await Message.findOne({
      where: {
        id: messageId,
        type: { [Op.ne]: 'system' }
      }
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: '消息不存在或已被删除'
      });
    }
    
    // 删除消息
    await message.destroy();
    
    res.json({
      success: true,
      message: '互动消息已删除'
    });
  } catch (error) {
    console.error('删除互动消息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 获取系统消息统计数据
exports.getSystemMessageStats = async (req, res) => {
  try {
    // 获取各类型消息数量
    const stats = await Message.findAll({
      attributes: [
        'subType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        type: 'system'
      },
      group: ['subType']
    });
    
    // 获取发送成功率
    const totalMessages = await Message.count({
      where: {
        type: 'system'
      }
    });
    
    const readMessages = await Message.count({
      where: {
        type: 'system',
        isRead: true
      }
    });
    
    const readRate = totalMessages > 0 ? (readMessages / totalMessages * 100).toFixed(2) : 0;
    
    res.json({
      success: true,
      data: {
        typeStats: stats,
        totalMessages,
        readMessages,
        readRate
      }
    });
  } catch (error) {
    console.error('获取系统消息统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};

// 搜索用户（用于发送系统消息时选择用户）
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${query}%` } },
          { nickname: { [Op.like]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'username', 'nickname', 'avatar'],
      limit: 10
    });
    
    const formattedUsers = users.map(user => ({
      value: user.id,
      label: user.nickname ? `${user.nickname} (${user.username})` : user.username,
      avatar: user.avatar
    }));
    
    res.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error('搜索用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
};