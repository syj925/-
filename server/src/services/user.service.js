const userRepository = require('../repositories/user.repository');
const { EncryptionUtil, JwtUtil, redisClient } = require('../utils');
const errorCodes = require('../constants/error-codes');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../config/logger');
const { ErrorMiddleware } = require('../middlewares');

/**
 * 用户服务层
 */
class UserService {
  /**
   * 用户注册
   * @param {Object} userData 用户数据
   * @returns {Promise<Object>} 注册结果
   */
  async register(userData) {
    // 首先检查系统是否允许注册
    const enableRegister = await this._getSystemSetting('enableRegister', 'true');
    if (enableRegister !== 'true') {
      throw ErrorMiddleware.createError(
        '系统暂时关闭用户注册功能',
        StatusCodes.FORBIDDEN,
        errorCodes.INVALID_OPERATION
      );
    }

    // 检查用户名是否存在
    if (await userRepository.isUsernameExists(userData.username)) {
      throw ErrorMiddleware.createError(
        '用户名已存在',
        StatusCodes.BAD_REQUEST,
        errorCodes.USERNAME_EXISTS
      );
    }

    // 检查手机号是否存在
    if (userData.phone && await userRepository.isPhoneExists(userData.phone)) {
      throw ErrorMiddleware.createError(
        '手机号已存在',
        StatusCodes.BAD_REQUEST,
        errorCodes.PHONE_EXISTS
      );
    }

    // 检查邮箱是否存在
    if (userData.email && await userRepository.isEmailExists(userData.email)) {
      throw ErrorMiddleware.createError(
        '邮箱已存在',
        StatusCodes.BAD_REQUEST,
        errorCodes.EMAIL_EXISTS
      );
    }

    // 加密密码
    userData.password = EncryptionUtil.hashPassword(userData.password);

    // 确保昵称存在，如果没有提供昵称，使用用户名作为昵称
    if (!userData.nickname) {
      userData.nickname = userData.username;
    }

    // 检查系统设置，决定新用户初始状态
    const requireUserAudit = await this._getSystemSetting('requireUserAudit', 'false');
    userData.status = requireUserAudit === 'true' ? 'inactive' : 'active';

    // 创建用户
    const user = await userRepository.create(userData);

    // 如果需要审核，不生成token，返回提示信息
    if (userData.status === 'inactive') {
      return {
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          status: user.status
        },
        needAudit: true,
        message: '注册成功，请等待管理员审核'
      };
    }

    // 生成token
    const token = this._generateToken(user);

    // 更新最后登录时间
    await userRepository.updateLastLoginAt(user.id);

    // 返回用户信息和token，格式与前端匹配
    return {
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar || null,
        role: user.role || 'user',
        school: user.school || '',
        department: user.department || ''
      },
      token
    };
  }

  /**
   * 用户登录
   * @param {String} username 用户名/手机号/邮箱
   * @param {String} password 密码
   * @returns {Promise<Object>} 登录结果
   */
  async login(username, password) {
    // 查找用户
    let user = null;
    
    // 尝试使用用户名查找
    user = await userRepository.findByUsername(username, true);
    
    // 尝试使用手机号查找
    if (!user && /^1[3-9]\d{9}$/.test(username)) {
      user = await userRepository.findByPhone(username, true);
    }
    
    // 尝试使用邮箱查找
    if (!user && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      user = await userRepository.findByEmail(username, true);
    }
    
    // 用户不存在
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.BAD_REQUEST,
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

    // 检查用户状态
    if (user.status === 'inactive') {
      throw ErrorMiddleware.createError(
        '账号正在审核中，请等待管理员审核',
        StatusCodes.FORBIDDEN,
        errorCodes.USER_PENDING_AUDIT
      );
    }

    if (user.status === 'banned') {
      throw ErrorMiddleware.createError(
        '账号已被封禁',
        StatusCodes.FORBIDDEN,
        errorCodes.USER_BANNED
      );
    }

    // 验证密码
    if (!EncryptionUtil.verifyPassword(password, user.password)) {
      throw ErrorMiddleware.createError(
        '密码错误',
        StatusCodes.BAD_REQUEST,
        errorCodes.PASSWORD_ERROR
      );
    }
    
    // 生成token
    const token = this._generateToken(user);
    
    // 更新最后登录时间
    await userRepository.updateLastLoginAt(user.id);
    
    // 返回用户信息和token，格式与前端匹配
    return {
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username,
        avatar: user.avatar || null,
        role: user.role || 'user',
        school: user.school || '',
        department: user.department || ''
      },
      token
    };
  }

  /**
   * 搜索用户（支持@功能）
   * @param {String} keyword 搜索关键词
   * @param {Number} limit 限制数量
   * @returns {Promise<Array>} 用户列表
   */
  async searchUsers(keyword, limit = 10) {
    if (!keyword || keyword.length < 1) {
      return [];
    }

    return await userRepository.searchUsers(keyword, limit);
  }

  /**
   * 获取用户信息
   * @param {String} id 用户ID
   * @returns {Promise<Object>} 用户信息
   */
  async getUserInfo(id) {

    const user = await userRepository.findById(id, false, true); // 第三个参数表示包含标签

    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }

    // 获取用户统计数据

    let stats;
    try {
      stats = await this.getUserStats(id);

    } catch (error) {
      logger.error('🔍 getUserStats error:', error);
      stats = {
        postCount: 0,
        likeCount: 0,
        favoriteCount: 0,
        followCount: 0,
        fansCount: 0
      };
    }

    // 处理字段名映射（数据库下划线命名转前端驼峰命名）
    const userJson = user.toJSON();
    if (userJson.background_image !== undefined) {
      userJson.backgroundImage = userJson.background_image;
      delete userJson.background_image;
    }

    // 返回包含统计数据的用户信息
    const result = {
      ...userJson,
      stats
    };

    return result;
  }

  /**
   * 获取用户统计数据
   * @param {String} userId 用户ID
   * @returns {Promise<Object>} 统计数据
   */
  async getUserStats(userId) {

    try {
      const { Post, Comment, Favorite, Follow } = require('../models');

      // 并行查询所有统计数据
      const [
        postCount,
        commentCount,
        likeCount,
        favoriteCount,
        followCount,
        fansCount
      ] = await Promise.all([
        // 用户发布的帖子数
        Post.count({
          where: {
            user_id: userId,
            status: 'published'
          }
        }),
        // 用户发表的评论数
        Comment.count({
          where: {
            user_id: userId,
            status: 'normal'
          }
        }),
        // 用户获得的点赞数（用户发布的帖子被点赞的总数）
        this.getUserLikeCount(userId),
        // 用户的收藏数
        Favorite.count({
          where: { user_id: userId }
        }),
        // 用户关注的人数
        Follow.count({
          where: { follower_id: userId }
        }),
        // 关注用户的人数（粉丝数）
        Follow.count({
          where: { following_id: userId }
        })
      ]);

      return {
        postCount: postCount || 0,
        commentCount: commentCount || 0,
        likeCount: likeCount || 0,
        favoriteCount: favoriteCount || 0,
        followCount: followCount || 0,
        fansCount: fansCount || 0
      };
    } catch (error) {
      logger.error('获取用户统计数据失败:', error);
      // 发生错误时返回0值，而不是抛出异常
      return {
        postCount: 0,
        likeCount: 0,
        favoriteCount: 0,
        followCount: 0,
        fansCount: 0
      };
    }
  }

  /**
   * 更新用户信息
   * @param {String} id 用户ID
   * @param {Object} userData 用户数据
   * @returns {Promise<Object>} 更新后的用户信息
   */
  async updateUserInfo(id, userData) {
    // 检查用户是否存在
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    // 检查用户名是否重复
    if (userData.username && userData.username !== existingUser.username) {
      if (await userRepository.isUsernameExists(userData.username, id)) {
        throw ErrorMiddleware.createError(
          '用户名已存在',
          StatusCodes.BAD_REQUEST,
          errorCodes.USERNAME_EXISTS
        );
      }
    }
    
    // 检查手机号是否重复
    if (userData.phone && userData.phone !== existingUser.phone) {
      if (await userRepository.isPhoneExists(userData.phone, id)) {
        throw ErrorMiddleware.createError(
          '手机号已存在',
          StatusCodes.BAD_REQUEST,
          errorCodes.PHONE_EXISTS
        );
      }
    }
    
    // 检查邮箱是否重复
    if (userData.email && userData.email !== existingUser.email) {
      if (await userRepository.isEmailExists(userData.email, id)) {
        throw ErrorMiddleware.createError(
          '邮箱已存在',
          StatusCodes.BAD_REQUEST,
          errorCodes.EMAIL_EXISTS
        );
      }
    }
    
    // 如果包含密码，需要加密
    if (userData.password) {
      userData.password = EncryptionUtil.hashPassword(userData.password);
    }

    // 处理空字符串，将空字符串转换为 null，避免验证错误
    const cleanedData = {};
    Object.keys(userData).forEach(key => {
      const value = userData[key];
      // 对于字符串类型字段，空字符串转为 null
      if (typeof value === 'string' && value.trim() === '') {
        cleanedData[key] = null;
      } else {
        cleanedData[key] = value;
      }
    });

    // 处理字段名映射（前端驼峰命名转数据库下划线命名）
    const mappedUserData = { ...cleanedData };
    if (cleanedData.backgroundImage !== undefined) {
      mappedUserData.background_image = cleanedData.backgroundImage;
      delete mappedUserData.backgroundImage;
    }

    // 处理标签更新
    if (userData.tags && Array.isArray(userData.tags)) {
      await this._updateUserTags(id, userData.tags);
    }

    // 更新用户信息
    const updatedUser = await userRepository.update(id, mappedUserData);
    
    // 返回包含标签的完整用户信息
    return await userRepository.findById(id, false, true);
  }

  /**
   * 更新用户标签
   * @private
   * @param {String} userId 用户ID
   * @param {Array} tagNames 标签名称数组
   * @returns {Promise<void>}
   */
  async _updateUserTags(userId, tagNames) {
    const { UserTag, Tag } = require('../models');
    
    // 删除用户现有的所有标签关联
    await UserTag.destroy({
      where: { user_id: userId }
    });

    // 如果没有标签，直接返回
    if (!tagNames || tagNames.length === 0) {
      return;
    }

    // 查找或创建标签，并建立关联
    for (const tagName of tagNames) {
      if (!tagName || tagName.trim() === '') continue;

      // 查找或创建标签
      const [tag] = await Tag.findOrCreate({
        where: { name: tagName.trim() },
        defaults: {
          name: tagName.trim(),
          category: 'interest',
          status: 'normal'
        }
      });

      // 创建用户标签关联
      await UserTag.create({
        user_id: userId,
        tag_id: tag.id
      });

      // 更新标签使用次数
      await tag.increment('use_count');
    }
  }

  /**
   * 修改密码
   * @param {String} id 用户ID
   * @param {String} oldPassword 旧密码
   * @param {String} newPassword 新密码
   * @returns {Promise<Boolean>} 是否成功
   */
  async changePassword(id, oldPassword, newPassword) {
    // 查找用户
    const user = await userRepository.findById(id, true);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    // 验证旧密码
    if (!EncryptionUtil.verifyPassword(oldPassword, user.password)) {
      throw ErrorMiddleware.createError(
        '旧密码错误',
        StatusCodes.BAD_REQUEST,
        errorCodes.PASSWORD_ERROR
      );
    }
    
    // 更新密码
    const hashedPassword = EncryptionUtil.hashPassword(newPassword);
    await userRepository.update(id, { password: hashedPassword });
    
    return true;
  }

  /**
   * 重置密码
   * @param {String} id 用户ID
   * @param {String} newPassword 新密码
   * @returns {Promise<Boolean>} 是否成功
   */
  async resetPassword(id, newPassword) {
    // 查找用户
    const user = await userRepository.findById(id);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    // 更新密码
    const hashedPassword = EncryptionUtil.hashPassword(newPassword);
    await userRepository.update(id, { password: hashedPassword });
    
    return true;
  }

  /**
   * 查询用户列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async findUsers(options) {
    return await userRepository.findAll(options);
  }

  /**
   * 禁用或启用用户
   * @param {String} id 用户ID
   * @param {Boolean} isDisabled 是否禁用
   * @returns {Promise<Boolean>} 是否成功
   */
  async setUserStatus(id, isDisabled) {
    // 查找用户
    const user = await userRepository.findById(id);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    // 更新状态
    return await userRepository.setDisabledStatus(id, isDisabled);
  }

  /**
   * 删除用户
   * @param {String} id 用户ID
   * @returns {Promise<Boolean>} 是否成功
   */
  async deleteUser(id) {
    // 查找用户
    const user = await userRepository.findById(id);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }
    
    // 删除用户
    return await userRepository.delete(id);
  }

  /**
   * 生成JWT令牌
   * @param {Object} user 用户对象
   * @returns {String} JWT令牌
   * @private
   */
  _generateToken(user) {
    return JwtUtil.generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    });
  }

  /**
   * 验证手机验证码
   * @param {String} phone 手机号
   * @param {String} code 验证码
   * @returns {Promise<Boolean>} 是否有效
   */
  async verifyPhoneCode(phone, code) {
    const key = `verify_code:phone:${phone}`;
    const savedCode = await redisClient.get(key);
    
    if (!savedCode) {
      throw ErrorMiddleware.createError(
        '验证码已过期',
        StatusCodes.BAD_REQUEST,
        errorCodes.VERIFY_CODE_EXPIRED
      );
    }
    
    if (savedCode !== code) {
      throw ErrorMiddleware.createError(
        '验证码错误',
        StatusCodes.BAD_REQUEST,
        errorCodes.VERIFY_CODE_ERROR
      );
    }
    
    // 验证成功后删除验证码
    await redisClient.del(key);
    
    return true;
  }

  /**
   * 发送手机验证码
   * @param {String} phone 手机号
   * @returns {Promise<Boolean>} 是否成功
   */
  async sendPhoneCode(phone) {
    // 生成验证码
    const code = EncryptionUtil.generateVerifyCode(6);
    
    // 存储验证码，有效期10分钟
    const key = `verify_code:phone:${phone}`;
    await redisClient.set(key, code, 600);
    
    // TODO: 调用短信发送接口
    logger.info(`向手机号 ${phone} 发送验证码成功`);
    // 注意: 生产环境中不应该记录验证码值
    
    return true;
  }

  /**
   * 获取用户获赞数
   * @param {String} userId 用户ID
   * @returns {Promise<Number>} 获赞数
   */
  async getUserLikeCount(userId) {
    try {
      const { Post, Like } = require('../models');

      // 先获取用户的所有已发布帖子ID
      const userPosts = await Post.findAll({
        where: {
          user_id: userId,
          status: 'published'
        },
        attributes: ['id'],
        raw: true
      });

      if (!userPosts || userPosts.length === 0) {
        return 0;
      }

      const postIds = userPosts.map(post => post.id);

      // 统计这些帖子的点赞数
      const likeCount = await Like.count({
        where: {
          target_type: 'post',
          target_id: postIds
        }
      });

      return likeCount || 0;
    } catch (error) {
      logger.error('获取用户获赞数失败', { userId, error: error.message });
      return 0;
    }
  }

  /**
   * 生成JWT token
   * @param {Object} user 用户对象
   * @returns {string} JWT token
   * @private
   */
  _generateToken(user) {
    return JwtUtil.generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    });
  }

  /**
   * 获取系统设置
   * @param {string} key 设置键
   * @param {string} defaultValue 默认值
   * @returns {Promise<string>} 设置值
   * @private
   */
  async _getSystemSetting(key, defaultValue = '') {
    try {
      const { Setting } = require('../models');
      const setting = await Setting.findOne({ where: { key } });
      return setting ? setting.value : defaultValue;
    } catch (error) {
      logger.error('Get system setting error:', error);
      return defaultValue;
    }
  }

  /**
   * 获取用户主页信息
   * @param {String} userId 用户ID
   * @param {String} currentUserId 当前用户ID（可选）
   * @returns {Promise<Object>} 用户主页信息
   */
  async getUserProfile(userId, currentUserId = null) {
    const userRepository = require('../repositories/user.repository');
    const followRepository = require('../repositories/follow.repository');
    const postRepository = require('../repositories/post.repository');
    const likeRepository = require('../repositories/like.repository');
    const favoriteRepository = require('../repositories/favorite.repository');
    const userBadgeRepository = require('../repositories/user-badge.repository');
    const badgeRepository = require('../repositories/badge.repository');

    // 获取用户基本信息
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.NOT_FOUND
      );
    }

    // 获取用户统计数据、徽章信息和标签信息
    const [postCount, likeCount, favoriteCount, followCount, fansCount, userBadges, userTags] = await Promise.all([
      postRepository.countByUserId(userId),
      likeRepository.countByUserId(userId),
      favoriteRepository.countByUserId(userId),
      followRepository.countFollowings(userId),
      followRepository.countFollowers(userId),
      this._getUserBadgesWithDetails(userId),
      this._getUserTagsWithDetails(userId)
    ]);

    // 获取关注状态（如果当前用户已登录）
    let isFollowed = false;
    let isMutualFollow = false;
    if (currentUserId && currentUserId !== userId) {
      const statusCacheService = require('./status-cache.service');
      
      try {
        // 优先从缓存获取关注状态
        const cacheStatus = await statusCacheService.isFollowing(currentUserId, [userId]);
        isFollowed = cacheStatus[userId] || false;
        
        if (isFollowed) {
          // 检查互相关注状态（也优先缓存）
          const reverseCacheStatus = await statusCacheService.isFollowing(userId, [currentUserId]);
          isMutualFollow = reverseCacheStatus[currentUserId] || false;
        }
      } catch (error) {
        // 缓存失败时回退到数据库查询
        logger.warn('获取关注状态缓存失败，回退到数据库查询:', error);
        isFollowed = await followRepository.isFollowing(currentUserId, userId);
        if (isFollowed) {
          isMutualFollow = await followRepository.isFollowing(userId, currentUserId);
        }
      }
    }

    // 构建用户主页信息
    const userProfile = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      background_image: user.background_image,
      bio: user.bio,
      school: user.school,
      department: user.department,
      gender: user.gender,
      role: user.role,
      createdAt: user.createdAt,

      // 统计数据
      stats: {
        postCount,
        likeCount,
        favoriteCount,
        followCount,
        fansCount,
        badgeCount: userBadges.length
      },

      // 徽章信息
      badges: userBadges,

      // 标签信息
      tags: userTags,

      // 关注状态
      followStatus: {
        isFollowed,
        isMutualFollow,
        isCurrentUser: currentUserId === userId
      }
    };

    return userProfile;
  }

  /**
   * 获取用户主页帖子列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 帖子列表和分页信息
   */
  async getUserProfilePosts(options) {
    const postRepository = require('../repositories/post.repository');
    const statusCacheService = require('./status-cache.service');

    const { userId, page, pageSize, sort, currentUserId } = options;

    // 验证用户是否存在
    const userRepository = require('../repositories/user.repository');
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.NOT_FOUND
      );
    }

    // 构建查询条件
    const queryOptions = {
      page,
      pageSize,
      userId,
      status: 'published', // 只显示已发布的帖子
      // 使用仓储已支持的排序键，避免受管理后台权重影响
      orderBy: sort === 'hot' ? 'hot' : 'createdAt',
      orderDirection: 'DESC',
      includeDetails: true,
      currentUserId,
      // 🔥 热门标签过滤：只显示上过推荐的帖子
      onlyRecommended: sort === 'hot'
    };

    const result = await postRepository.findAll(queryOptions);

    // 🔧 使用StatusCacheService添加用户交互状态
    if (currentUserId && result.list && result.list.length > 0) {
      const postIds = result.list.map(post => post.id);
      const authorIds = result.list.map(post => post.author?.id).filter(Boolean);

      try {
        const [likeStates, favoriteStates, followingStates] = await Promise.all([
          statusCacheService.isLiked(currentUserId, postIds),
          statusCacheService.isFavorited(currentUserId, postIds),
          authorIds.length > 0 ? statusCacheService.isFollowing(currentUserId, authorIds) : {}
        ]);

        // 统一状态注入
        result.list.forEach(post => {
          delete post.is_liked;
          delete post.is_favorited;
          
          post.dataValues = post.dataValues || {};
          post.dataValues.is_liked = likeStates[post.id] || false;
          post.dataValues.is_favorited = favoriteStates[post.id] || false;
          
          // 🔧 同时设置到根级别，支持两种命名格式
          post.is_liked = likeStates[post.id] || false;
          post.is_favorited = favoriteStates[post.id] || false;
          // 🔧 同时设置驼峰命名格式，确保前端组件能访问到
          post.isLiked = likeStates[post.id] || false;
          post.isFavorited = favoriteStates[post.id] || false;
          
          if (post.author && post.author.id) {
            post.author.dataValues = post.author.dataValues || {};
            post.author.dataValues.isFollowing = followingStates[post.author.id] || false;
          }
        });
      } catch (error) {
        logger.error('用户状态注入失败:', error);
        // 状态注入失败不影响主要功能
      }
    } else if (result.list && result.list.length > 0) {
      // 🔧 为未登录用户设置默认状态，确保前端组件正常工作
      result.list.forEach(post => {
        post.dataValues = post.dataValues || {};
        post.dataValues.is_liked = false;
        post.dataValues.is_favorited = false;
        
        // 🔧 同时设置到根级别，支持两种命名格式
        post.is_liked = false;
        post.is_favorited = false;
        // 🔧 同时设置驼峰命名格式，确保前端组件能访问到
        post.isLiked = false;
        post.isFavorited = false;
      });
    }

    return result;
  }

  /**
   * 获取用户徽章详细信息（私有方法）
   * @param {String} userId 用户ID
   * @returns {Promise<Array>} 用户徽章列表
   */
  async _getUserBadgesWithDetails(userId) {
    const userBadgeRepository = require('../repositories/user-badge.repository');
    const badgeRepository = require('../repositories/badge.repository');

    try {
      // 获取用户的所有徽章关联记录
      const userBadges = await userBadgeRepository.findByUserId(userId, {
        where: { is_visible: true }, // 只获取可见的徽章
        orderBy: { displayOrder: 'ASC', grantedAt: 'DESC' } // 按显示顺序和获得时间排序
      });

      if (!userBadges || userBadges.length === 0) {
        return [];
      }

      // 获取徽章详细信息
      const badgeIds = userBadges.map(ub => ub.badgeId);
      const badges = await badgeRepository.findByIds(badgeIds, {
        where: { status: 'active' } // 只获取激活状态的徽章
      });

      // 将徽章信息与用户徽章信息合并
      const badgeMap = new Map();
      badges.forEach(badge => {
        badgeMap.set(badge.id, badge);
      });

      const result = userBadges
        .map(userBadge => {
          const badge = badgeMap.get(userBadge.badgeId);
          if (!badge) return null;

          return {
            id: badge.id,
            name: badge.name,
            description: badge.description,
            color: badge.color,
            icon: badge.icon,
            type: badge.type,
            rarity: badge.rarity,
            grantedAt: userBadge.grantedAt,
            isVisible: userBadge.isVisible,
            displayOrder: userBadge.displayOrder
          };
        })
        .filter(item => item !== null); // 过滤掉无效的徽章

      return result;
    } catch (error) {
      logger.error('获取用户徽章详情失败:', error);
      return []; // 如果获取徽章失败，返回空数组而不是抛出错误
    }
  }

  /**
   * 获取用户标签详情（内部方法）
   * @param {String} userId 用户ID
   * @returns {Promise<Array>} 用户标签列表
   */
  async _getUserTagsWithDetails(userId) {
    // 🔑 生成缓存键
    const cacheKey = `user:${userId}:tags`;
    
    try {
      // 📥 1. 先尝试从 Redis 缓存读取
      logger.info(`🔍 [标签缓存] 尝试从缓存读取用户标签: ${userId}`, {
        service: 'campus-wall-api',
        cacheKey
      });
      
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info(`✅ [标签缓存] 缓存命中，返回缓存数据: ${userId}`, {
          service: 'campus-wall-api',
          cacheKey,
          tagsCount: Array.isArray(cached) ? cached.length : 0
        });
        return cached;
      }
      
      logger.info(`❌ [标签缓存] 缓存未命中，查询数据库: ${userId}`, {
        service: 'campus-wall-api',
        cacheKey
      });

      // 🗄️ 2. 缓存未命中，查询数据库
      const { User, Tag } = require('../models');

      // 通过User模型的关联获取用户标签
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Tag,
            as: 'tags',
            through: { attributes: [] }, // 不需要中间表的字段
            where: { status: 'normal' }, // 只获取正常状态的标签
            required: false // 即使没有标签也返回用户
          }
        ]
      });

      if (!user || !user.tags) {
        logger.info(`📝 [标签缓存] 用户无标签数据: ${userId}`, {
          service: 'campus-wall-api'
        });
        return [];
      }

      // 格式化标签数据
      const result = user.tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        category: tag.category,
        description: tag.description
      }));

      logger.info(`🗄️ [标签缓存] 数据库查询成功: ${userId}`, {
        service: 'campus-wall-api',
        tagsCount: result.length,
        tags: result.map(t => t.name).join(', ')
      });

      // 💾 3. 将结果缓存到 Redis (30分钟)
      try {
        await redisClient.setex(cacheKey, 1800, JSON.stringify(result));
        logger.info(`💾 [标签缓存] 成功缓存到Redis: ${userId}`, {
          service: 'campus-wall-api',
          cacheKey,
          ttl: 1800,
          tagsCount: result.length
        });
      } catch (cacheError) {
        logger.warn(`⚠️ [标签缓存] Redis缓存写入失败: ${cacheError.message}`, {
          service: 'campus-wall-api',
          userId
        });
      }

      return result;
    } catch (error) {
      logger.error('❌ [标签缓存] 获取用户标签详情失败:', {
        service: 'campus-wall-api',
        userId,
        error: error.message,
        stack: error.stack
      });
      return []; // 如果获取标签失败，返回空数组而不是抛出错误
    }
  }

  /**
   * 查找用户列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 用户列表和分页信息
   */
  async findUsers(options = {}) {
    try {
      const result = await userRepository.findAll(options);
      return {
        list: result.list,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: Math.ceil(result.total / result.pageSize)
        }
      };
    } catch (error) {
      logger.error('查找用户列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户今日发布统计
   * @param {Number} userId 用户ID
   * @returns {Promise<Object>} 发布统计
   */
  async getUserTodayPublishStats(userId) {
    try {
      // 使用 PublishLimitMiddleware 的方法获取统计
      const PublishLimitMiddleware = require('../middlewares/publish-limit.middleware');
      const stats = await PublishLimitMiddleware.getUserTodayStats(userId);
      return stats;
    } catch (error) {
      logger.error('获取用户今日发布统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户设置
   * @param {Number} userId 用户ID
   * @param {Array} attributes 需要返回的字段
   * @returns {Promise<Object>} 用户对象
   */
  async findById(userId, attributes = null) {
    const options = {};
    if (attributes) {
      options.attributes = attributes;
    }
    return await userRepository.findById(userId);
  }

  /**
   * 获取用户设置信息
   * @param {Number} userId 用户ID
   * @returns {Promise<Object>} 包含 settings 字段的用户对象
   */
  async getUserSettings(userId) {
    const user = await userRepository.findByIdWithSettings(userId);
    if (!user) {
      return null;
    }
    return user;
  }

  /**
   * 更新用户设置
   * @param {Number} userId 用户ID
   * @param {Object} settings 设置对象
   * @returns {Promise<Object>} 更新后的用户对象
   */
  async updateUserSettings(userId, settings) {
    const user = await userRepository.findByIdWithSettings(userId);
    if (!user) {
      return null;
    }
    
    // 合并设置
    const currentSettings = user.settings || {};
    const newSettings = { ...currentSettings, ...settings };
    
    // 更新用户
    await userRepository.update(userId, { settings: newSettings });
    
    // 返回更新后的用户
    return await userRepository.findByIdWithSettings(userId);
  }

  /**
   * 更新用户隐私设置
   * @param {Number} userId 用户ID
   * @param {Object} privacySettings 隐私设置
   * @returns {Promise<Object>} 更新后的隐私设置
   */
  async updatePrivacySettings(userId, privacySettings) {
    const user = await userRepository.findByIdWithSettings(userId);
    if (!user) {
      return null;
    }
    
    // 获取当前设置或初始化
    let currentSettings = user.settings || { privacy: {} };
    
    // 更新隐私设置
    currentSettings.privacy = {
      ...currentSettings.privacy,
      ...privacySettings
    };
    
    // 保存到数据库 - 使用 Sequelize 实例方法
    user.settings = currentSettings;
    user.changed('settings', true);
    await user.save();
    
    return currentSettings.privacy;
  }

  /**
   * 获取用户隐私设置
   * @param {Number} userId 用户ID
   * @returns {Promise<Object>} 隐私设置
   */
  async getPrivacySettings(userId) {
    const user = await userRepository.findByIdWithSettings(userId);
    if (!user) {
      return null;
    }
    
    // 返回隐私设置，如果没有则返回默认值
    return user.settings?.privacy || {
      anonymousMode: false,
      allowSearch: true,
      showLocation: false,
      allowFollow: true,
      allowComment: true,
      allowMessage: true,
      favoriteVisible: false,
      followListVisible: true,
      fansListVisible: true
    };
  }

  /**
   * 创建用户拒绝记录
   * @param {Object} data 拒绝记录数据
   * @returns {Promise<Object>} 创建的记录
   */
  async createRejectionLog(data) {
    const userRejectionLogRepository = require('../repositories/user-rejection-log.repository');
    return await userRejectionLogRepository.create(data);
  }

  /**
   * 获取用户拒绝记录列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async getRejectionLogs(options = {}) {
    const userRejectionLogRepository = require('../repositories/user-rejection-log.repository');
    const { page = 1, limit = 20, username, startTime, endTime } = options;
    
    const result = await userRejectionLogRepository.findAndCountAll({
      page,
      limit,
      username,
      startTime,
      endTime
    });

    return {
      list: result.rows,
      total: result.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(result.count / parseInt(limit))
    };
  }
}

module.exports = new UserService();