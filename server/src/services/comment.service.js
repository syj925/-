const commentRepository = require('../repositories/comment.repository');
const postRepository = require('../repositories/post.repository');
const userRepository = require('../repositories/user.repository');
const messageService = require('./message.service');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const errorCodes = require('../constants/error-codes');

/**
 * 评论服务层
 */
class CommentService {
  /**
   * 创建评论
   * @param {Object} commentData 评论数据
   * @returns {Promise<Object>} 创建的评论对象
   */
  async createComment(commentData) {
    // 检查用户是否存在
    const user = await userRepository.findById(commentData.user_id);
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
    
    // 检查帖子是否存在
    const post = await postRepository.findById(commentData.post_id);
    if (!post) {
      throw ErrorMiddleware.createError(
        '帖子不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.POST_NOT_EXIST
      );
    }
    
    // 检查帖子状态
    if (post.status !== 'published') {
      throw ErrorMiddleware.createError(
        '帖子状态异常，无法评论',
        StatusCodes.BAD_REQUEST,
        errorCodes.POST_STATUS_ERROR
      );
    }
    
    // 如果是回复评论，检查父评论是否存在
    if (commentData.reply_to) {
      const parentComment = await commentRepository.findById(commentData.reply_to);
      if (!parentComment) {
        throw ErrorMiddleware.createError(
          '回复的评论不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.COMMENT_NOT_EXIST
        );
      }
      
      // 检查父评论是否属于同一帖子
      if (parentComment.post_id !== commentData.post_id) {
        throw ErrorMiddleware.createError(
          '回复的评论不属于该帖子',
          StatusCodes.BAD_REQUEST,
          errorCodes.COMMENT_NOT_MATCH
        );
      }
    }

    // 获取用户设置，决定是否匿名（安全的后端控制）
    let isAnonymous = false;

    console.log('=== 后端匿名检查调试 ===');
    console.log('用户ID:', commentData.user_id);
    console.log('用户对象:', user);
    console.log('用户设置字段:', user?.settings);

    if (user && user.settings) {
      try {
        const settings = typeof user.settings === 'string'
          ? JSON.parse(user.settings)
          : user.settings;
        console.log('解析后的设置:', settings);
        isAnonymous = settings?.privacy?.anonymousMode || false;
        console.log('匿名模式设置:', isAnonymous);
      } catch (error) {
        console.error('解析用户设置失败:', error);
        isAnonymous = false;
      }
    } else {
      console.log('用户或设置为空，使用默认值 false');
    }

    // 将匿名设置和状态添加到评论数据中
    const finalCommentData = {
      ...commentData,
      is_anonymous: isAnonymous,
      status: commentData.status || 'normal' // 默认为正常状态
    };

    console.log('最终评论数据:', finalCommentData);
    console.log('=== 后端匿名检查结束 ===');

    // 创建评论（使用增强的多级回复方法）
    const comment = finalCommentData.reply_to
      ? await commentRepository.createReply(finalCommentData)
      : await commentRepository.create(finalCommentData);

    // 更新帖子评论计数
    await postRepository.updateCounter(post.id, 'comment_count', 1);

    // 发送通知
    await this.sendCommentNotifications(comment, post, commentData, user);

    // 发送@用户通知
    if (comment.mentioned_users && comment.mentioned_users.length > 0) {
      await this.sendMentionNotifications(comment, post, user);
    }

    // 获取完整的评论数据（包含作者信息）
    const fullComment = await commentRepository.findById(comment.id);

    // 处理匿名显示：对于匿名评论，始终隐藏作者身份（因为这是新创建的评论，返回给前端时应该显示匿名）
    if (fullComment.is_anonymous) {
      if (fullComment.author) {
        fullComment.author.dataValues = {
          id: 'anonymous',
          username: '匿名用户',
          nickname: '匿名用户',
          avatar: '/static/images/default-avatar.png'
        };
      }
    }

    return fullComment;
  }

  /**
   * 发送评论相关通知
   * @param {Object} comment 评论对象
   * @param {Object} post 帖子对象
   * @param {Object} commentData 评论数据
   * @param {Object} user 用户对象
   */
  async sendCommentNotifications(comment, post, commentData, user) {
    // 发送消息通知
    if (post.user_id !== commentData.user_id) {
      // 通知帖子作者
      messageService.createMessage({
        sender_id: commentData.user_id,
        receiver_id: post.user_id,
        content: `${user.username} 评论了你的帖子`,
        type: 'comment',
        related_id: comment.id,
        post_id: post.id
      }).catch(err => console.error('发送消息失败', err));
    }

    // 如果是回复评论，通知被回复的评论作者
    if (commentData.reply_to) {
      const parentComment = await commentRepository.findById(commentData.reply_to);
      if (parentComment && parentComment.user_id !== commentData.user_id) {
        messageService.createMessage({
          sender_id: commentData.user_id,
          receiver_id: parentComment.user_id,
          content: `${user.username} 回复了你的评论`,
          type: 'reply',
          related_id: comment.id,
          post_id: post.id
        }).catch(err => console.error('发送消息失败', err));
      }
    }
  }

  /**
   * 发送@用户通知
   * @param {Object} comment 评论对象
   * @param {Object} post 帖子对象
   * @param {Object} user 当前用户对象
   */
  async sendMentionNotifications(comment, post, user) {
    if (!comment.mentioned_users || comment.mentioned_users.length === 0) {
      return;
    }

    for (const mention of comment.mentioned_users) {
      try {
        // 根据用户名查找用户
        const mentionedUser = await userRepository.findByUsername(mention.username);
        if (mentionedUser && mentionedUser.id !== comment.user_id) {
          // 创建@通知消息
          await messageService.createMessage({
            sender_id: comment.user_id,
            receiver_id: mentionedUser.id,
            type: 'mention',
            title: '有人@了你',
            content: `${user.nickname || user.username} 在评论中@了你: ${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}`,
            post_id: post.id,
            comment_id: comment.id,
            data: {
              comment_id: comment.id,
              post_id: post.id,
              mention_content: comment.content,
              mention_position: mention.position
            }
          });

          console.log(`✅ 发送@通知成功: ${user.username} -> ${mentionedUser.username}`);
        }
      } catch (error) {
        console.error('处理@用户通知失败:', error);
      }
    }
  }

  /**
   * 解析评论中的@用户
   * @param {String} content 评论内容
   * @returns {Array} 被@的用户列表
   */
  parseMentionedUsers(content) {
    if (!content) return [];

    // 匹配@用户的正则表达式
    const mentionRegex = /@([a-zA-Z0-9_\u4e00-\u9fa5]+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push({
        username: match[1],
        position: match.index
      });
    }

    return mentions;
  }

  /**
   * 验证@用户是否存在
   * @param {Array} mentions 提及的用户列表
   * @returns {Array} 验证后的用户列表
   */
  async validateMentionedUsers(mentions) {
    const validMentions = [];

    for (const mention of mentions) {
      try {
        const user = await userRepository.findByUsername(mention.username);
        if (user && !user.is_disabled) {
          validMentions.push({
            ...mention,
            user_id: user.id,
            nickname: user.nickname
          });
        }
      } catch (error) {
        console.error(`验证@用户失败: ${mention.username}`, error);
      }
    }

    return validMentions;
  }

  /**
   * 获取评论详情
   * @param {String} id 评论ID
   * @returns {Promise<Object>} 评论对象
   */
  async getCommentById(id) {
    const comment = await commentRepository.findById(id);
    
    if (!comment) {
      throw ErrorMiddleware.createError(
        '评论不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.COMMENT_NOT_EXIST
      );
    }
    
    if (comment.status === 'deleted') {
      throw ErrorMiddleware.createError(
        '评论已删除',
        StatusCodes.NOT_FOUND,
        errorCodes.COMMENT_DELETED
      );
    }
    
    return comment;
  }

  /**
   * 获取评论的多级回复
   * @param {String} commentId 评论ID
   * @param {Number} maxLevel 最大层级深度
   * @returns {Promise<Array>} 回复树
   */
  async getCommentRepliesTree(commentId, maxLevel = 3) {
    const comment = await commentRepository.findById(commentId);
    if (!comment) {
      throw ErrorMiddleware.createError(
        '评论不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.COMMENT_NOT_EXIST
      );
    }

    return await commentRepository.getRepliesTree(commentId, maxLevel);
  }

  /**
   * 获取评论的直接回复
   * @param {String} commentId 评论ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async getCommentDirectReplies(commentId, page = 1, pageSize = 10) {
    const comment = await commentRepository.findById(commentId);
    if (!comment) {
      throw ErrorMiddleware.createError(
        '评论不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.COMMENT_NOT_EXIST
      );
    }

    return await commentRepository.getDirectReplies(commentId, page, pageSize);
  }

  /**
   * 更新评论
   * @param {String} id 评论ID
   * @param {Object} commentData 评论数据
   * @param {String} userId 当前用户ID
   * @returns {Promise<Object>} 更新后的评论对象
   */
  async updateComment(id, commentData, userId) {
    // 检查评论是否存在
    const comment = await commentRepository.findById(id);
    
    if (!comment) {
      throw ErrorMiddleware.createError(
        '评论不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.COMMENT_NOT_EXIST
      );
    }
    
    if (comment.status === 'deleted') {
      throw ErrorMiddleware.createError(
        '评论已删除',
        StatusCodes.NOT_FOUND,
        errorCodes.COMMENT_DELETED
      );
    }
    
    // 检查是否有权限修改评论
    if (comment.user_id !== userId) {
      // 检查当前用户是否为管理员
      const user = await userRepository.findById(userId);
      if (user.role !== 'admin') {
        throw ErrorMiddleware.createError(
          '无权限修改该评论',
          StatusCodes.FORBIDDEN,
          errorCodes.NO_PERMISSION
        );
      }
    }
    
    await commentRepository.update(id, commentData);
    
    return await commentRepository.findById(id);
  }

  /**
   * 删除评论
   * @param {String} id 评论ID
   * @param {String} userId 当前用户ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async deleteComment(id, userId) {
    // 检查评论是否存在
    const comment = await commentRepository.findById(id);
    
    if (!comment) {
      throw ErrorMiddleware.createError(
        '评论不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.COMMENT_NOT_EXIST
      );
    }
    
    // 检查是否有权限删除评论
    if (comment.user_id !== userId) {
      // 检查当前用户是否为管理员
      const user = await userRepository.findById(userId);
      if (user.role !== 'admin') {
        throw ErrorMiddleware.createError(
          '无权限删除该评论',
          StatusCodes.FORBIDDEN,
          errorCodes.NO_PERMISSION
        );
      }
    }
    
    // 软删除评论
    const result = await commentRepository.delete(id);
    
    // 更新帖子评论计数
    if (result) {
      await postRepository.updateCounter(comment.post_id, 'comment_count', -1);
    }
    
    return result;
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
    
    const comments = await commentRepository.findByPostId(postId, page, pageSize, sort);

    // 处理评论数据
    for (const comment of comments.list) {
      // 处理匿名显示：只对非作者隐藏身份
      if (comment.is_anonymous && comment.user_id !== currentUserId) {
        if (comment.author) {
          comment.author.dataValues = {
            id: 'anonymous',
            username: '匿名用户',
            nickname: '匿名用户',
            avatar: '/static/images/default-avatar.png'
          };
        }
      }

      // 如果有当前用户ID，添加是否点赞的信息
      if (currentUserId) {
        comment.dataValues.is_liked = await commentRepository.isLikedByUser(comment.id, currentUserId);
      }

      // 处理回复
      if (comment.replies && comment.replies.length > 0) {
        for (const reply of comment.replies) {
          // 处理回复的匿名显示：只对非作者隐藏身份
          if (reply.is_anonymous && reply.user_id !== currentUserId) {
            if (reply.author) {
              reply.author.dataValues = {
                id: 'anonymous',
                username: '匿名用户',
                nickname: '匿名用户',
                avatar: '/static/images/default-avatar.png'
              };
            }
          }

          // 如果有当前用户ID，添加是否点赞的信息
          if (currentUserId) {
            reply.dataValues.is_liked = await commentRepository.isLikedByUser(reply.id, currentUserId);
          }
        }
      }
    }

    return comments;
  }

  /**
   * 获取评论回复列表
   * @param {String} commentId 评论ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @param {String} currentUserId 当前用户ID（可选）
   * @returns {Promise<Object>} 分页结果
   */
  async getCommentReplies(commentId, page = 1, pageSize = 20, currentUserId = null) {
    // 检查评论是否存在
    const comment = await commentRepository.findById(commentId);
    
    if (!comment) {
      throw ErrorMiddleware.createError(
        '评论不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.COMMENT_NOT_EXIST
      );
    }
    
    if (comment.status === 'deleted') {
      throw ErrorMiddleware.createError(
        '评论已删除',
        StatusCodes.NOT_FOUND,
        errorCodes.COMMENT_DELETED
      );
    }
    
    const replies = await commentRepository.findReplies(commentId, page, pageSize);
    
    // 如果有当前用户ID，添加是否点赞的信息
    if (currentUserId) {
      for (const reply of replies.list) {
        reply.dataValues.is_liked = await commentRepository.isLikedByUser(reply.id, currentUserId);
      }
    }
    
    return replies;
  }

  /**
   * 获取用户评论列表
   * @param {String} userId 用户ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise<Object>} 分页结果
   */
  async getUserComments(userId, page = 1, pageSize = 20) {
    // 检查用户是否存在
    const user = await userRepository.findById(userId);

    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }

    return await commentRepository.findByUserId(userId, page, pageSize);
  }

  /**
   * 获取用户评论审核记录
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 审核记录列表和分页信息
   */
  async getUserCommentAuditHistory(options) {
    const { userId, auditStatus, page = 1, pageSize = 10 } = options;

    // 检查用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }

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
      // 默认显示待审核和被拒绝的评论（不显示已通过的）
      queryOptions.status = ['pending', 'rejected'];
    }

    const result = await commentRepository.findByUserId(userId, page, pageSize, queryOptions.status);

    // 格式化数据以匹配前端期望的格式
    const formattedComments = result.list.map(comment => {
      // 格式化审核状态
      let auditStatusText = '';
      let auditStatusColor = '';

      switch (comment.status) {
        case 'pending':
          auditStatusText = '待审核';
          auditStatusColor = '#f39c12';
          break;
        case 'rejected':
          auditStatusText = '未通过';
          auditStatusColor = '#e74c3c';
          break;
        default:
          auditStatusText = '未知';
          auditStatusColor = '#95a5a6';
      }

      return {
        id: comment.id,
        content: comment.content,
        // 为了兼容前端审核记录页面，添加一些字段
        title: comment.content ? comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : '') : '无内容',
        post: comment.post ? {
          id: comment.post.id,
          title: comment.post.title || '无标题',
          content: comment.post.content
        } : null,
        status: comment.status,
        auditStatusText,
        auditStatusColor,
        like_count: comment.like_count || 0,
        comment_count: 0, // 评论没有子评论计数
        is_anonymous: comment.is_anonymous || false,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        // 标识这是评论类型，用于前端区分显示
        type: 'comment'
      };
    });

    return {
      list: formattedComments,
      pagination: result.pagination
    };
  }


}

module.exports = new CommentService();