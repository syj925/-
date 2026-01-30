const { UserRejectionLog, User } = require('../models');
const { Op } = require('sequelize');

/**
 * 用户拒绝记录数据访问层
 */
class UserRejectionLogRepository {
  /**
   * 创建拒绝记录
   * @param {Object} data 拒绝记录数据
   * @returns {Promise<Object>} 创建的记录
   */
  async create(data) {
    return await UserRejectionLog.create(data);
  }

  /**
   * 根据ID查找记录
   * @param {Number} id 记录ID
   * @returns {Promise<Object|null>} 记录对象
   */
  async findById(id) {
    return await UserRejectionLog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'username', 'nickname']
        }
      ]
    });
  }

  /**
   * 查询拒绝记录列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} {rows, count}
   */
  async findAndCountAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      username,
      startTime,
      endTime
    } = options;

    // 构建查询条件
    const whereCondition = {};

    if (username) {
      whereCondition.username = {
        [Op.like]: `%${username}%`
      };
    }

    if (startTime) {
      whereCondition.rejected_at = {
        ...whereCondition.rejected_at,
        [Op.gte]: new Date(startTime)
      };
    }

    if (endTime) {
      whereCondition.rejected_at = {
        ...whereCondition.rejected_at,
        [Op.lte]: new Date(endTime)
      };
    }

    return await UserRejectionLog.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'username', 'nickname']
        }
      ],
      attributes: [
        'id',
        'username',
        'nickname',
        'email',
        'rejection_reason',
        'rejected_by',
        'rejected_at',
        'ip_address'
      ],
      order: [['rejected_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
  }

  /**
   * 根据用户名查找记录
   * @param {String} username 用户名
   * @returns {Promise<Array>} 记录列表
   */
  async findByUsername(username) {
    return await UserRejectionLog.findAll({
      where: { username },
      order: [['rejected_at', 'DESC']]
    });
  }

  /**
   * 根据管理员ID查找记录
   * @param {String} adminId 管理员ID
   * @param {Object} options 分页选项
   * @returns {Promise<Object>} {rows, count}
   */
  async findByAdminId(adminId, options = {}) {
    const { page = 1, limit = 20 } = options;

    return await UserRejectionLog.findAndCountAll({
      where: { rejected_by: adminId },
      order: [['rejected_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
  }

  /**
   * 删除记录
   * @param {Number} id 记录ID
   * @returns {Promise<Boolean>} 是否成功
   */
  async delete(id) {
    const result = await UserRejectionLog.destroy({
      where: { id }
    });
    return result > 0;
  }

  /**
   * 统计记录总数
   * @param {Object} where 查询条件
   * @returns {Promise<Number>} 记录数
   */
  async count(where = {}) {
    return await UserRejectionLog.count({ where });
  }
}

module.exports = new UserRejectionLogRepository();
