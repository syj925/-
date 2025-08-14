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
    console.log('🔍 getUserInfo called for userId:', id);
    const user = await userRepository.findById(id);
    console.log('🔍 User found:', user ? 'YES' : 'NO');
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.USER_NOT_EXIST
      );
    }

    // 获取用户统计数据
    console.log('🔍 Calling getUserStats for userId:', id);
    let stats;
    try {
      stats = await this.getUserStats(id);
      console.log('🔍 getUserStats result:', stats);
    } catch (error) {
      console.error('🔍 getUserStats error:', error);
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
    console.log('🔍 getUserInfo returning result:', JSON.stringify(result, null, 2));
    return result;
  }

  /**
   * 获取用户统计数据
   * @param {String} userId 用户ID
   * @returns {Promise<Object>} 统计数据
   */
  async getUserStats(userId) {
    console.log('🔍 getUserStats method called for userId:', userId);
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

    // 处理字段名映射（前端驼峰命名转数据库下划线命名）
    const mappedUserData = { ...userData };
    if (userData.backgroundImage !== undefined) {
      mappedUserData.background_image = userData.backgroundImage;
      delete mappedUserData.backgroundImage;
    }

    // 更新用户信息
    const updatedUser = await userRepository.update(id, mappedUserData);
    return updatedUser;
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
    logger.info(`向手机号 ${phone} 发送验证码: ${code}`);
    
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

    // 获取用户基本信息
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ErrorMiddleware.createError(
        '用户不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.NOT_FOUND
      );
    }

    // 获取用户统计数据
    const [postCount, likeCount, favoriteCount, followCount, fansCount] = await Promise.all([
      postRepository.countByUserId(userId),
      likeRepository.countByUserId(userId),
      favoriteRepository.countByUserId(userId),
      followRepository.countFollowings(userId),
      followRepository.countFollowers(userId)
    ]);

    // 获取关注状态（如果当前用户已登录）
    let isFollowed = false;
    let isMutualFollow = false;
    if (currentUserId && currentUserId !== userId) {
      isFollowed = await followRepository.isFollowing(currentUserId, userId);
      if (isFollowed) {
        isMutualFollow = await followRepository.isFollowing(userId, currentUserId);
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
        fansCount
      },

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
      currentUserId
    };

    const result = await postRepository.findAll(queryOptions);

    return result;
  }
}

module.exports = new UserService();