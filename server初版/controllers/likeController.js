const { Like, Post, Comment, User } = require('../models/associations');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @desc    点赞帖子
 * @route   POST /api/posts/:id/like
 * @access  Private
 */
exports.likePost = async (req, res, next) => {
  // 创建事务
  const transaction = await sequelize.transaction();
  
  try {
    // 获取帖子ID
    const postId = req.params.id;
    
    // 查询帖子是否存在
    const post = await Post.findByPk(postId, { transaction });
    
    if (!post) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 查询用户是否已经点赞过该帖子 - 使用paranoid:false确保能查到软删除的记录
    const existingLike = await Like.findOne({
      where: {
        userId: req.user.id,
        targetType: 'post',
        targetId: postId
      },
      paranoid: false,
      transaction
    });
    
    // 如果已经点赞过，返回错误
    if (existingLike) {
      // 如果是已删除的记录，恢复它
      if (existingLike.deletedAt) {
        await existingLike.restore({ transaction });
        
        // 增加帖子点赞数
        post.likes += 1;
        await post.save({ transaction });
        
        // 提交事务
        await transaction.commit();
        
        // 响应成功
        return res.status(200).json({
          success: true,
          message: '点赞成功',
          data: {
            likeCount: post.likes
          }
        });
      } else {
        // 如果记录存在且未被删除，返回错误
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: '已经点赞过该帖子'
        });
      }
    }
    
    // 创建点赞记录
    await Like.create({
      userId: req.user.id,
      targetType: 'post',
      targetId: postId
    }, { transaction });
    
    // 增加帖子点赞数
    post.likes += 1;
    await post.save({ transaction });
    
    // 提交事务
    await transaction.commit();
    
    // 响应成功信息
    res.status(200).json({
      success: true,
      message: '点赞成功',
      data: {
        likeCount: post.likes
      }
    });
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    取消点赞帖子
 * @route   DELETE /api/posts/:id/like
 * @access  Private
 */
exports.unlikePost = async (req, res, next) => {
  // 创建事务
  const transaction = await sequelize.transaction();
  
  try {
    // 获取帖子ID
    const postId = req.params.id;
    
    // 查询帖子是否存在
    const post = await Post.findByPk(postId, { transaction });
    
    if (!post) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 查询用户是否已经点赞过该帖子
    const existingLike = await Like.findOne({
      where: {
        userId: req.user.id,
        targetType: 'post',
        targetId: postId
      },
      transaction
    });
    
    // 如果没有点赞过，返回错误
    if (!existingLike) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '未点赞过该帖子'
      });
    }
    
    // 删除点赞记录(软删除)
    await existingLike.destroy({ transaction });
    
    // 减少帖子点赞数（确保不会小于0）
    post.likes = Math.max(0, post.likes - 1);
    await post.save({ transaction });
    
    // 提交事务
    await transaction.commit();
    
    // 响应成功信息
    res.status(200).json({
      success: true,
      message: '取消点赞成功',
      data: {
        likeCount: post.likes
      }
    });
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    获取用户点赞的帖子列表
 * @route   GET /api/users/:id/likes/posts
 * @access  Private
 */
exports.getLikedPosts = async (req, res, next) => {
  try {
    // 获取路径参数和查询参数
    const userId = req.params.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    
    // 查询用户是否存在
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 检查权限（只能查看自己的点赞列表或管理员可查看所有）
    if (userId != req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权查看该用户的点赞列表'
      });
    }
    
    // 查询用户点赞的帖子ID
    const likedPostIds = await Like.findAll({
      attributes: ['targetId'],
      where: {
        userId,
        targetType: 'post'
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    const postIds = likedPostIds.map(like => like.targetId);
    
    // 如果没有点赞任何帖子
    if (postIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          posts: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          }
        }
      });
    }
    
    // 查询点赞的帖子详情
    const posts = await Post.findAll({
      where: {
        id: {
          [Op.in]: postIds
        },
        status: 'published'
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'nickname', 'username', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // 按照点赞的顺序重新排序帖子
    const sortedPosts = [];
    for (const id of postIds) {
      const post = posts.find(p => p.id === id);
      if (post) sortedPosts.push(post);
    }
    
    // 查询总数
    const totalLikes = await Like.count({
      where: {
        userId,
        targetType: 'post'
      }
    });
    
    // 计算总页数
    const totalPages = Math.ceil(totalLikes / limit);
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: {
        posts: sortedPosts,
        pagination: {
          page,
          limit,
          total: totalLikes,
          pages: totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    检查用户是否点赞帖子
 * @route   GET /api/posts/:id/like/status
 * @access  Private
 */
exports.checkLikeStatus = async (req, res, next) => {
  try {
    // 获取帖子ID
    const postId = req.params.id;
    
    // 查询帖子是否存在
    const post = await Post.findByPk(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 检查用户是否已登录
    if (!req.user) {
      return res.status(200).json({
        success: true,
        data: {
          isLiked: false
        }
      });
    }
    
    // 查询用户是否已经点赞过该帖子
    const existingLike = await Like.findOne({
      where: {
        userId: req.user.id,
        targetType: 'post',
        targetId: postId
      }
    });
    
    // 返回点赞状态
    res.status(200).json({
      success: true,
      data: {
        isLiked: !!existingLike
      }
    });
  } catch (error) {
    next(error);
  }
}; 