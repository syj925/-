const { User, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * 用户数据访问层
 */
class UserRepository {
  /**
   * 根据ID查找用户
   * @param {String} id 用户ID
   * @param {Boolean} withPassword 是否包含密码
   * @returns {Promise<Object>} 用户对象
   */
  async findById(id, withPassword = false) {
    const scope = withPassword ? 'withPassword' : 'defaultScope';
    return await User.scope(scope).findByPk(id);
  }

  /**
   * 根据用户名查找用户
   * @param {String} username 用户名
   * @param {Boolean} withPassword 是否包含密码
   * @returns {Promise<Object>} 用户对象
   */
  async findByUsername(username, withPassword = false) {
    const scope = withPassword ? 'withPassword' : 'defaultScope';
    return await User.scope(scope).findOne({ where: { username } });
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

    return await User.findAll({
      where: {
        [Op.or]: [
          {
            username: {
              [Op.like]: `%${keyword}%`
            }
          },
          {
            nickname: {
              [Op.like]: `%${keyword}%`
            }
          }
        ],
        is_disabled: false
      },
      attributes: ['id', 'username', 'nickname', 'avatar'],
      limit,
      order: [
        // 优先显示用户名完全匹配的
        [sequelize.literal(`CASE WHEN username = '${keyword}' THEN 0 ELSE 1 END`), 'ASC'],
        // 然后按昵称完全匹配
        [sequelize.literal(`CASE WHEN nickname = '${keyword}' THEN 0 ELSE 1 END`), 'ASC'],
        // 最后按用户名排序
        ['username', 'ASC']
      ]
    });
  }

  /**
   * 根据手机号查找用户
   * @param {String} phone 手机号
   * @param {Boolean} withPassword 是否包含密码
   * @returns {Promise<Object>} 用户对象
   */
  async findByPhone(phone, withPassword = false) {
    const scope = withPassword ? 'withPassword' : 'defaultScope';
    return await User.scope(scope).findOne({ where: { phone } });
  }

  /**
   * 根据邮箱查找用户
   * @param {String} email 邮箱
   * @param {Boolean} withPassword 是否包含密码
   * @returns {Promise<Object>} 用户对象
   */
  async findByEmail(email, withPassword = false) {
    const scope = withPassword ? 'withPassword' : 'defaultScope';
    return await User.scope(scope).findOne({ where: { email } });
  }

  /**
   * 创建用户
   * @param {Object} userData 用户数据
   * @returns {Promise<Object>} 创建的用户对象
   */
  async create(userData) {
    return await User.create(userData);
  }

  /**
   * 更新用户
   * @param {String} id 用户ID
   * @param {Object} userData 用户数据
   * @returns {Promise<Object>} 更新后的用户对象
   */
  async update(id, userData) {
    const user = await User.findByPk(id);
    if (!user) return null;
    
    await user.update(userData);
    return user;
  }

  /**
   * 删除用户（软删除）
   * @param {String} id 用户ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async delete(id) {
    const result = await User.destroy({ where: { id } });
    return result > 0;
  }

  /**
   * 分页查询用户
   * @param {Object} options 查询选项
   * @param {Number} options.page 页码
   * @param {Number} options.pageSize 每页数量
   * @param {String} options.keyword 关键词搜索
   * @param {String} options.role 角色过滤
   * @param {String} options.school 学校过滤
   * @param {String} options.status 状态过滤
   * @param {Boolean} options.isDisabled 是否禁用过滤
   * @returns {Promise<Object>} 分页结果
   */
  async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      role,
      school,
      status,
      isDisabled,
      includeBadges = false
    } = options;

    const where = {};

    // 关键词搜索
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { nickname: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } }
      ];
    }

    // 角色过滤
    if (role) {
      where.role = role;
    }

    // 学校过滤
    if (school) {
      where.school = school;
    }

    // 状态过滤
    if (status) {
      where.status = status;
    }

    // 禁用状态过滤
    if (isDisabled !== undefined) {
      where.is_disabled = isDisabled;
    }

    // 构建查询选项
    const queryOptions = {
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']]
    };

    // 如果需要包含徽章数据
    if (includeBadges) {
      const { Badge, UserBadge } = require('../models');
      queryOptions.include = [{
        model: Badge,
        as: 'badges',
        through: {
          model: UserBadge,
          attributes: [],
          where: { is_visible: true }
        },
        required: false,
        where: { status: 'active' }
      }];
    }

    // 执行查询
    const { rows, count } = await User.findAndCountAll(queryOptions);

    return {
      list: rows,
      pagination: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        total: count
      }
    };
  }

  /**
   * 更新用户最后登录时间
   * @param {String} id 用户ID
   * @returns {Promise<Boolean>} 是否成功更新
   */
  async updateLastLoginAt(id) {
    const result = await User.update(
      { last_login_at: new Date() },
      { where: { id } }
    );
    return result[0] > 0;
  }

  /**
   * 禁用或启用用户
   * @param {String} id 用户ID
   * @param {Boolean} isDisabled 是否禁用
   * @returns {Promise<Boolean>} 是否成功更新
   */
  async setDisabledStatus(id, isDisabled) {
    const result = await User.update(
      { is_disabled: isDisabled },
      { where: { id } }
    );
    return result[0] > 0;
  }

  /**
   * 检查用户名是否已存在
   * @param {String} username 用户名
   * @param {String} excludeId 排除的用户ID
   * @returns {Promise<Boolean>} 是否存在
   */
  async isUsernameExists(username, excludeId = null) {
    const where = { username };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await User.count({ where });
    return count > 0;
  }

  /**
   * 检查手机号是否已存在
   * @param {String} phone 手机号
   * @param {String} excludeId 排除的用户ID
   * @returns {Promise<Boolean>} 是否存在
   */
  async isPhoneExists(phone, excludeId = null) {
    const where = { phone };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await User.count({ where });
    return count > 0;
  }

  /**
   * 检查邮箱是否已存在
   * @param {String} email 邮箱
   * @param {String} excludeId 排除的用户ID
   * @returns {Promise<Boolean>} 是否存在
   */
  async isEmailExists(email, excludeId = null) {
    const where = { email };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await User.count({ where });
    return count > 0;
  }

  /**
   * 更新最后登录时间
   * @param {String} id 用户ID
   * @returns {Promise<Boolean>} 是否成功更新
   */
  async updateLastLogin(id) {
    const result = await User.update(
      { last_login_at: new Date() },
      { where: { id } }
    );
    return result[0] > 0;
  }

  /**
   * 更新用户密码
   * @param {String} id 用户ID
   * @param {String} hashedPassword 加密后的密码
   * @returns {Promise<Boolean>} 是否成功更新
   */
  async updatePassword(id, hashedPassword) {
    const result = await User.update(
      { password: hashedPassword },
      { where: { id } }
    );
    return result[0] > 0;
  }

  /**
   * 获取所有活跃用户（不包括管理员）
   * @returns {Promise<Array>} 用户列表
   */
  async findAllActive() {
    return await User.findAll({
      where: {
        role: { [Op.ne]: 'admin' },
        // 可以添加其他活跃状态条件，比如最近登录时间等
      },
      attributes: ['id', 'username', 'nickname'],
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * 根据角色查找用户
   * @param {String} role 用户角色
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async findByRole(role, options = {}) {
    const {
      page = 1,
      limit = 10,
      keyword = '',
      searchFields = ['username', 'nickname', 'email']
    } = options;

    const where = { role };

    // 添加搜索条件
    if (keyword) {
      where[Op.or] = searchFields.map(field => ({
        [field]: {
          [Op.like]: `%${keyword}%`
        }
      }));
    }

    const offset = (page - 1) * limit;

    return await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * 根据ID数组查找用户列表
   * @param {Array} ids 用户ID数组
   * @returns {Promise<Array>} 用户列表
   */
  async findByIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }

    return await User.findAll({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });
  }
}

module.exports = new UserRepository();