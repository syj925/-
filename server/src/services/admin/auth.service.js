const userRepository = require('../../repositories/user.repository');
const { JwtUtil, EncryptionUtil } = require('../../utils');
const logger = require('../../../config/logger');
const bcrypt = require('bcryptjs');

/**
 * 管理员认证服务
 */
class AdminAuthService {
  /**
   * 管理员登录
   * @param {String} username 用户名
   * @param {String} password 密码
   * @returns {Promise<Object>} 登录结果
   */
  async login(username, password) {
    try {
      // 查找用户（包含密码字段）
      const user = await userRepository.findByUsername(username, true);
      
      if (!user) {
        throw new Error('用户不存在');
      }

      // 验证用户是否为管理员
      if (user.role !== 'admin') {
        throw new Error('非管理员用户');
      }

      // 检查账户是否被禁用
      if (user.is_disabled) {
        throw new Error('账户已被禁用');
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('密码错误');
      }

      // 更新最后登录时间
      await userRepository.updateLastLogin(user.id);

      // 生成JWT token
      const tokenPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
        nickname: user.nickname
      };
      
      const token = JwtUtil.generateToken(tokenPayload);

      // 返回登录结果（不包含密码）
      const userInfo = {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        last_login_at: new Date()
      };

      return {
        token,
        user: userInfo,
        expiresIn: '24h'
      };
    } catch (error) {
      logger.error('Admin login service error:', error);
      throw error;
    }
  }

  /**
   * 获取管理员信息
   * @param {String} adminId 管理员ID
   * @returns {Promise<Object>} 管理员信息
   */
  async getAdminInfo(adminId) {
    try {
      const admin = await userRepository.findById(adminId);
      
      if (!admin) {
        throw new Error('管理员不存在');
      }

      if (admin.role !== 'admin') {
        throw new Error('非管理员用户');
      }

      // 返回管理员信息（排除敏感字段）
      return {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        email: admin.email,
        avatar: admin.avatar,
        role: admin.role,
        school: admin.school,
        department: admin.department,
        created_at: admin.created_at,
        last_login_at: admin.last_login_at
      };
    } catch (error) {
      logger.error('Get admin info service error:', error);
      throw error;
    }
  }

  /**
   * 刷新管理员token
   * @param {String} adminId 管理员ID
   * @returns {Promise<String>} 新的token
   */
  async refreshToken(adminId) {
    try {
      const admin = await userRepository.findById(adminId);
      
      if (!admin) {
        throw new Error('管理员不存在');
      }

      if (admin.role !== 'admin') {
        throw new Error('非管理员用户');
      }

      if (admin.is_disabled) {
        throw new Error('账户已被禁用');
      }

      // 生成新的JWT token
      const tokenPayload = {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        nickname: admin.nickname
      };
      
      return JwtUtil.generateToken(tokenPayload);
    } catch (error) {
      logger.error('Refresh admin token service error:', error);
      throw error;
    }
  }

  /**
   * 修改管理员密码
   * @param {String} adminId 管理员ID
   * @param {String} oldPassword 旧密码
   * @param {String} newPassword 新密码
   * @returns {Promise<void>}
   */
  async changePassword(adminId, oldPassword, newPassword) {
    try {
      // 获取管理员信息（包含密码）
      const admin = await userRepository.findById(adminId, true);
      
      if (!admin) {
        throw new Error('管理员不存在');
      }

      // 验证旧密码
      const isOldPasswordValid = await bcrypt.compare(oldPassword, admin.password);
      if (!isOldPasswordValid) {
        throw new Error('旧密码错误');
      }

      // 验证新密码格式
      if (newPassword.length < 6 || newPassword.length > 30) {
        throw new Error('新密码长度必须在6-30位之间');
      }

      // 加密新密码
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // 更新密码
      await userRepository.updatePassword(adminId, hashedNewPassword);

      logger.info('Admin password changed successfully:', { adminId });
    } catch (error) {
      logger.error('Change admin password service error:', error);
      throw error;
    }
  }

  /**
   * 验证管理员权限
   * @param {String} adminId 管理员ID
   * @returns {Promise<Boolean>} 是否为有效管理员
   */
  async validateAdminPermission(adminId) {
    try {
      const admin = await userRepository.findById(adminId);
      
      if (!admin) {
        return false;
      }

      return admin.role === 'admin' && !admin.is_disabled;
    } catch (error) {
      logger.error('Validate admin permission service error:', error);
      return false;
    }
  }

  /**
   * 获取管理员列表
   * @param {Object} params 查询参数
   * @returns {Promise<Object>} 管理员列表
   */
  async getAdminList(params = {}) {
    try {
      const { page = 1, limit = 10, keyword = '' } = params;
      
      const queryOptions = {
        where: {
          role: 'admin'
        },
        page: parseInt(page),
        limit: parseInt(limit)
      };

      if (keyword) {
        queryOptions.keyword = keyword;
        queryOptions.searchFields = ['username', 'nickname', 'email'];
      }

      const result = await userRepository.findAndCountAll(queryOptions);
      
      // 格式化返回数据
      const admins = result.rows.map(admin => ({
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        email: admin.email,
        avatar: admin.avatar,
        role: admin.role,
        is_disabled: admin.is_disabled,
        created_at: admin.created_at,
        last_login_at: admin.last_login_at
      }));

      return {
        items: admins,
        total: result.count,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('Get admin list service error:', error);
      throw error;
    }
  }
}

module.exports = new AdminAuthService();
