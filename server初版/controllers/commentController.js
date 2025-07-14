const { Comment, User, Post, Message, Like } = require('../models/associations');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * @desc    获取帖子评论
 * @route   GET /api/posts/:postId/comments
 * @access  Public
 */
exports.getComments = async (req, res, next) => {
  try {
    // 获取路径参数
    const postId = req.params.postId;
    
    // 解析查询参数
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    
    // 计算跳过的记录数
    const offset = (page - 1) * limit;
    
    // 查询帖子是否存在
    const post = await Post.findByPk(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 当前用户ID (如果已登录)
    const currentUserId = req.user ? req.user.id : null;
    
    // 查询顶级评论（没有父评论的评论）
    const { count, rows: comments } = await Comment.findAndCountAll({
      where: {
        postId,
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
      limit,
      offset,
      distinct: true
    });
    
    // 如果有登录用户，查询该用户点赞的评论
    let userLikedCommentIds = [];
    if (currentUserId) {
      // 获取当前用户点赞的评论IDs
      const commentLikes = await Like.findAll({
        where: {
          userId: currentUserId,
          targetType: 'comment',
          targetId: comments.map(comment => comment.id)
        },
        attributes: ['targetId']
      });
      
      userLikedCommentIds = commentLikes.map(like => like.targetId);
    }
    
    // 获取每条评论的回复
    const commentsWithReplies = await Promise.all(comments.map(async (comment) => {
      // 转换为普通对象
      const commentObj = comment.toJSON();
      
      // 获取评论的回复
      const replies = await Comment.findAll({
        where: {
          parentId: comment.id,
          status: 'active'
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'nickname', 'username', 'avatar']
          }
        ],
        order: [['created_at', 'ASC']],
        limit: 5 // 最多获取5条回复
      });
      
      // 如果有登录用户，查询该用户对回复的点赞状态
      let replyLikedIds = [];
      if (currentUserId && replies.length > 0) {
        const replyLikes = await Like.findAll({
          where: {
            userId: currentUserId,
            targetType: 'comment',
            targetId: replies.map(reply => reply.id)
          },
          attributes: ['targetId']
        });
        
        replyLikedIds = replyLikes.map(like => like.targetId);
      }
      
      // 添加回复到评论对象
      commentObj.replies = replies.map(reply => {
        const replyObj = reply.toJSON();
        return {
          id: replyObj.id,
          content: replyObj.content,
          likes: replyObj.likes,
          createdAt: replyObj.created_at,
          userId: replyObj.isAnonymous ? null : replyObj.author.id,
          username: replyObj.isAnonymous ? '匿名用户' : replyObj.author.nickname,
          avatar: replyObj.isAnonymous ? '/uploads/default-avatar.png' : replyObj.author.avatar,
          isLiked: currentUserId ? replyLikedIds.includes(replyObj.id) : false,
          isAnonymous: replyObj.isAnonymous
        };
      });
      
      // 判断当前用户是否点赞了这条评论
      const isLiked = currentUserId ? userLikedCommentIds.includes(commentObj.id) : false;
      
      // 格式化评论对象，处理匿名评论
      return {
        id: commentObj.id,
        content: commentObj.content,
        likes: commentObj.likes,
        createdAt: commentObj.created_at,
        userId: commentObj.isAnonymous ? null : commentObj.author.id,
        username: commentObj.isAnonymous ? '匿名用户' : commentObj.author.nickname,
        avatar: commentObj.isAnonymous ? '/uploads/default-avatar.png' : commentObj.author.avatar,
        isLiked,
        isAnonymous: commentObj.isAnonymous,
        replies: commentObj.replies
      };
    }));
    
    // 计算总页数
    const totalPages = Math.ceil(count / limit);
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: {
        comments: commentsWithReplies,
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
 * @desc    添加评论
 * @route   POST /api/posts/:postId/comments
 * @access  Private
 */
exports.addComment = async (req, res, next) => {
  try {
    // 获取路径参数和请求数据
    const postId = req.params.postId;
    const { content, parentId, isAnonymous } = req.body;
    
    // 验证必要字段
    if (!content) {
      return res.status(400).json({
        success: false,
        message: '请提供评论内容'
      });
    }
    
    // 查询帖子是否存在
    const post = await Post.findByPk(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 如果是回复评论，检查父评论是否存在
    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: '父评论不存在'
        });
      }
      
      // 确保父评论属于该帖子
      if (parentComment.postId !== parseInt(postId)) {
        return res.status(400).json({
          success: false,
          message: '父评论不属于该帖子'
        });
      }
    }
    
    // 创建评论
    const comment = await Comment.create({
      content,
      parentId: parentId || null,
      postId,
      userId: req.user.id,
      isAnonymous: isAnonymous === true // 确保布尔值类型
    });
    
    // 更新帖子评论数
    post.comments += 1;
    await post.save();
    
    // 获取评论者信息
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'nickname', 'avatar']
    });
    
    // 发送消息通知给帖子作者（如果评论者不是作者本人）
    if (post.userId !== req.user.id) {
      try {
        // 根据匿名状态设置发送者信息
        const senderName = isAnonymous ? '匿名用户' : (user.nickname || user.username || '有用户');
        
        await Message.create({
          senderId: req.user.id,
          recipientId: post.userId,
          type: 'comment',
          title: '新评论通知',
          content: `${senderName} 评论了你的帖子`,
          isRead: false,
          postId: post.id,
          commentId: comment.id,
          data: JSON.stringify({
            content: content.substring(0, 100), // 只保留前100个字符
            postTitle: post.title || '你的帖子',
            isAnonymous: isAnonymous === true
          })
        });
        console.log('评论消息通知已发送');
      } catch (error) {
        console.error('发送评论通知失败:', error);
        // 消息发送失败不影响评论功能
      }
    }
    
    // 响应成功信息
    res.status(201).json({
      success: true,
      message: '评论发布成功',
      data: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        userId: isAnonymous ? null : req.user.id,
        username: isAnonymous ? '匿名用户' : user.nickname,
        avatar: isAnonymous ? '/uploads/default-avatar.png' : user.avatar,
        parentId: comment.parentId,
        likes: 0,
        isLiked: false,
        isAnonymous: isAnonymous === true
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    删除评论
 * @route   DELETE /api/comments/:id
 * @access  Private
 */
exports.deleteComment = async (req, res, next) => {
  try {
    // 获取评论ID
    const commentId = req.params.id;
    
    // 查找评论
    const comment = await Comment.findByPk(commentId);
    
    // 如果评论不存在
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    // 验证评论所有者
    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权删除此评论'
      });
    }
    
    // 减少帖子评论数
    const post = await Post.findByPk(comment.postId);
    if (post) {
      post.comments = Math.max(0, post.comments - 1);
      await post.save();
    }
    
    // 删除评论（软删除）
    await comment.destroy();
    
    // 响应成功信息
    res.status(200).json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    点赞评论
 * @route   POST /api/comments/:id/like
 * @access  Private
 */
exports.likeComment = async (req, res, next) => {
  try {
    // 获取评论ID
    const commentId = req.params.id;
    
    // 查找评论
    const comment = await Comment.findByPk(commentId);
    
    // 如果评论不存在
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    // 检查用户是否已经点赞过该评论
    const existingLike = await Like.findOne({
      where: {
        userId: req.user.id,
        targetType: 'comment',
        targetId: commentId
      }
    });

    // 如果已经点赞过，直接返回成功
    if (existingLike) {
      return res.status(200).json({
        success: true,
        message: '已经点赞过该评论',
        data: {
          likeCount: comment.likes
        }
      });
    }

    try {
      // 创建点赞记录
      await Like.create({
        userId: req.user.id,
        targetType: 'comment',
        targetId: commentId
      });
      
      // 增加评论点赞计数（作为缓存，保持向后兼容）
      comment.likes += 1;
      await comment.save();
      
      // 响应成功信息
      return res.status(200).json({
        success: true,
        message: '点赞成功',
        data: {
          likeCount: comment.likes
        }
      });
    } catch (error) {
      // 如果创建点赞记录失败，但是因为重复点赞导致的唯一约束错误，仍返回成功
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.log('捕获到重复点赞错误，仍返回成功状态');
        return res.status(200).json({
          success: true,
          message: '已经点赞过该评论',
          data: {
            likeCount: comment.likes
          }
        });
      }
      // 其他错误则抛出
      throw error;
    }
  } catch (error) {
    console.error('评论点赞出错:', error);
    next(error);
  }
};

/**
 * @desc    取消评论点赞
 * @route   DELETE /api/comments/:id/like
 * @access  Private
 */
exports.unlikeComment = async (req, res, next) => {
  try {
    // 获取评论ID
    const commentId = req.params.id;
    
    // 查找评论
    const comment = await Comment.findByPk(commentId);
    
    // 如果评论不存在
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    try {
      // 查找用户点赞记录
      const existingLike = await Like.findOne({
        where: {
          userId: req.user.id,
          targetType: 'comment',
          targetId: commentId
        }
      });

      // 如果没有点赞记录，直接返回成功
      if (!existingLike) {
        return res.status(200).json({
          success: true,
          message: '未点赞过该评论',
          data: {
            likeCount: comment.likes
          }
        });
      }

      // 删除点赞记录
      await existingLike.destroy();
      
      // 重新计算点赞数
      const newLikeCount = await Like.count({
        where: {
          targetType: 'comment',
          targetId: commentId
        }
      });
      
      // 更新评论点赞数
      comment.likes = newLikeCount;
      await comment.save();
      
      // 响应成功信息
      return res.status(200).json({
        success: true,
        message: '取消点赞成功',
        data: {
          likeCount: comment.likes
        }
      });
    } catch (error) {
      console.error('取消点赞失败:', error);
      throw error;
    }
  } catch (error) {
    console.error('评论取消点赞出错:', error);
    next(error);
  }
};

/**
 * @desc    回复评论
 * @route   POST /api/comments/reply
 * @access  Private
 */
exports.replyToComment = async (req, res, next) => {
  try {
    // 获取请求数据
    const { content, commentId, replyId, postId, isAnonymous } = req.body;
    
    // 验证必要字段
    if (!content) {
      return res.status(400).json({
        success: false,
        message: '请提供回复内容'
      });
    }
    
    if (!commentId) {
      return res.status(400).json({
        success: false,
        message: '请提供评论ID'
      });
    }
    
    if (!postId) {
      return res.status(400).json({
        success: false,
        message: '请提供帖子ID'
      });
    }
    
    // 查询帖子是否存在
    const post = await Post.findByPk(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 查询父评论是否存在
    const parentComment = await Comment.findByPk(commentId);
    
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: '父评论不存在'
      });
    }
    
    // 确保父评论属于该帖子
    if (parentComment.postId !== parseInt(postId)) {
      return res.status(400).json({
        success: false,
        message: '父评论不属于该帖子'
      });
    }
    
    // 创建回复
    const reply = await Comment.create({
      content,
      parentId: commentId,
      postId: parseInt(postId),
      userId: req.user.id,
      replyToId: replyId || null, // 如果有指定回复的用户ID，则保存
      isAnonymous: isAnonymous === true
    });
    
    // 更新帖子评论数
    post.comments += 1;
    await post.save();
    
    // 获取评论者信息
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'nickname', 'username', 'avatar']
    });

    // 给父评论作者发送通知（如果回复者不是父评论作者）
    if (parentComment.userId !== req.user.id) {
      try {
        // 根据匿名状态设置发送者信息
        const senderName = isAnonymous ? '匿名用户' : (user.nickname || user.username || '有用户');
        
        await Message.create({
          senderId: req.user.id,
          recipientId: parentComment.userId,
          type: 'comment',
          title: '新回复通知',
          content: `${senderName} 回复了你的评论`,
          isRead: false,
          postId: parseInt(postId),
          commentId: reply.id,
          data: JSON.stringify({
            content: content.substring(0, 100), // 只保留前100个字符
            isAnonymous: isAnonymous === true
          })
        });
        console.log('回复通知已发送');
      } catch (error) {
        console.error('发送回复通知失败:', error);
      }
    }
    
    // 响应成功信息
    res.status(201).json({
      success: true,
      message: '回复发布成功',
      data: {
        id: reply.id,
        content: reply.content,
        parentId: reply.parentId,
        createdAt: reply.created_at,
        userId: isAnonymous ? null : req.user.id,
        username: isAnonymous ? '匿名用户' : user.nickname,
        avatar: isAnonymous ? '/uploads/default-avatar.png' : user.avatar,
        likes: 0,
        isLiked: false,
        isAnonymous: isAnonymous === true
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取评论回复列表
 * @route   GET /api/comments/:id/replies
 * @access  Public
 */
exports.getCommentReplies = async (req, res, next) => {
  try {
    // 获取评论ID
    const commentId = req.params.id;
    
    // 解析查询参数
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    
    // 计算跳过的记录数
    const offset = (page - 1) * limit;
    
    // 查询评论是否存在
    const comment = await Comment.findByPk(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    // 当前用户ID (如果已登录)
    const currentUserId = req.user ? req.user.id : null;
    
    // 查询回复列表
    const { count, rows: replies } = await Comment.findAndCountAll({
      where: {
        parentId: commentId,
        status: 'active'
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'nickname', 'username', 'avatar']
        }
      ],
      order: [['created_at', 'ASC']],
      limit,
      offset,
      distinct: true
    });
    
    // 如果有登录用户，查询该用户点赞的回复
    let userLikedReplyIds = [];
    if (currentUserId && replies.length > 0) {
      const replyLikes = await Like.findAll({
        where: {
          userId: currentUserId,
          targetType: 'comment',
          targetId: replies.map(reply => reply.id)
        },
        attributes: ['targetId']
      });
      
      userLikedReplyIds = replyLikes.map(like => like.targetId);
    }
    
    // 格式化回复列表
    const formattedReplies = replies.map(reply => {
      const replyObj = reply.toJSON();
      return {
        id: replyObj.id,
        content: replyObj.content,
        likes: replyObj.likes,
        createdAt: replyObj.created_at,
        userId: replyObj.isAnonymous ? null : replyObj.author.id,
        username: replyObj.isAnonymous ? '匿名用户' : replyObj.author.nickname,
        avatar: replyObj.isAnonymous ? '/uploads/default-avatar.png' : replyObj.author.avatar,
        replyToId: replyObj.replyToId,
        isLiked: currentUserId ? userLikedReplyIds.includes(replyObj.id) : false,
        isAnonymous: replyObj.isAnonymous
      };
    });
    
    // 计算总页数
    const totalPages = Math.ceil(count / limit);
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: {
        replies: formattedReplies,
        pagination: {
          page,
          limit,
          total: count,
          pages: totalPages
        }
      }
    });
  } catch (error) {
    console.error('获取评论回复失败:', error);
    next(error);
  }
};

/**
 * @desc    修复评论点赞数
 * @route   POST /api/comments/:id/fix-likes
 * @access  Private (Admin)
 */
exports.fixCommentLikes = async (req, res, next) => {
  try {
    // 获取评论ID
    const commentId = req.params.id;
    
    // 检查是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权执行此操作'
      });
    }
    
    // 查找评论
    const comment = await Comment.findByPk(commentId);
    
    // 如果评论不存在
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    // 查询实际点赞数
    const actualLikes = await Like.count({
      where: {
        target_type: 'comment',
        target_id: commentId
      }
    });
    
    // 记录原始点赞数和实际点赞数
    const originalLikes = comment.likes;
    
    // 更新评论点赞数
    comment.likes = actualLikes;
    await comment.save();
    
    // 响应成功信息
    res.status(200).json({
      success: true,
      message: '评论点赞数已修复',
      data: {
        commentId,
        originalLikes,
        newLikes: actualLikes
      }
    });
  } catch (error) {
    console.error('修复评论点赞数失败:', error);
    next(error);
  }
};

/**
 * @desc    修复所有评论点赞数
 * @route   POST /api/comments/fix-all-likes
 * @access  Private (Admin)
 */
exports.fixAllCommentLikes = async (req, res, next) => {
  try {
    // 检查是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权执行此操作'
      });
    }
    
    // 获取所有评论
    const comments = await Comment.findAll();
    
    const results = [];
    let fixed = 0;
    
    // 更新每条评论的点赞数
    for (const comment of comments) {
      try {
        // 查询实际点赞数
        const actualLikes = await Like.count({
          where: {
            target_type: 'comment',
            target_id: comment.id
          }
        });
        
        // 如果点赞数不一致，进行更新
        if (comment.likes !== actualLikes) {
          const originalLikes = comment.likes;
          comment.likes = actualLikes;
          await comment.save();
          
          results.push({
            commentId: comment.id,
            originalLikes,
            newLikes: actualLikes
          });
          
          fixed++;
        }
      } catch (error) {
        console.error(`处理评论 ${comment.id} 时出错:`, error);
        results.push({
          commentId: comment.id,
          error: error.message
        });
      }
    }
    
    // 响应成功信息
    res.status(200).json({
      success: true,
      message: `已修复 ${fixed} 条评论的点赞数`,
      data: {
        fixed,
        total: comments.length,
        results
      }
    });
  } catch (error) {
    console.error('修复所有评论点赞数失败:', error);
    next(error);
  }
}; 