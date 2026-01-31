const userRepository = require('../repositories/user.repository');
const { EncryptionUtil, JwtUtil, redisClient } = require('../utils');
const errorCodes = require('../constants/error-codes');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../config/logger');
const { ErrorMiddleware } = require('../middlewares');

/**
 * 认证服务层
 * 处理注册、登录、密码管理等认证相关逻辑
 */
class AuthService {
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
    
    return true;
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
   * 获取系统设置 (私有辅助方法，从UserService复制)
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
}

module.exports = new AuthService();
