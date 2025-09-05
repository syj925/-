const { Tag } = require('../models');
const { Op } = require('sequelize');

/**
 * 标签数据访问层
 */
class TagRepository {
  /**
   * 创建标签
   * @param {Object} tagData 标签数据
   * @returns {Promise<Object>} 创建的标签对象
   */
  async create(tagData) {
    return await Tag.create(tagData);
  }

  /**
   * 根据ID获取标签
   * @param {String} id 标签ID
   * @returns {Promise<Object|null>} 标签对象
   */
  async findById(id) {
    return await Tag.findByPk(id);
  }

  /**
   * 获取标签列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async findAndCountAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status,
      orderBy = [['sort_order', 'DESC'], ['use_count', 'DESC'], ['createdAt', 'DESC']]
    } = options;

    const whereCondition = {
      deleted_at: null
    };

    // 搜索条件
    if (search) {
      whereCondition.name = {
        [Op.like]: `%${search}%`
      };
    }

    if (category) {
      whereCondition.category = category;
    }

    if (status) {
      whereCondition.status = status;
    }

    const result = await Tag.findAndCountAll({
      where: whereCondition,
      order: orderBy,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    return {
      items: result.rows,
      total: result.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(result.count / parseInt(limit))
    };
  }

  /**
   * 更新标签
   * @param {String} id 标签ID
   * @param {Object} updateData 更新数据
   * @returns {Promise<Array>} 更新结果
   */
  async update(id, updateData) {
    return await Tag.update(updateData, {
      where: { id }
    });
  }

  /**
   * 删除标签
   * @param {String} id 标签ID
   * @returns {Promise<Number>} 删除的行数
   */
  async delete(id) {
    return await Tag.destroy({
      where: { id }
    });
  }

  /**
   * 增加使用次数
   * @param {String} id 标签ID
   * @param {Number} increment 增加数量
   * @returns {Promise<void>}
   */
  async incrementUseCount(id, increment = 1) {
    await Tag.increment('use_count', {
      by: increment,
      where: { id }
    });
  }

  /**
   * 获取热门标签
   * @param {Number} limit 限制数量
   * @returns {Promise<Array>} 热门标签列表
   */
  async getHotTags(limit = 10) {
    return await Tag.findAll({
      where: {
        status: { [Op.in]: ['hot', 'normal'] },
        deleted_at: null
      },
      order: [
        ['status', 'DESC'], // hot优先
        ['use_count', 'DESC'],
        ['sort_order', 'DESC']
      ],
      limit: parseInt(limit)
    });
  }

  /**
   * 根据分类获取标签
   * @param {String} category 分类
   * @param {Number} limit 限制数量
   * @returns {Promise<Array>} 标签列表
   */
  async findByCategory(category, limit = 50) {
    return await Tag.findAll({
      where: {
        category,
        status: { [Op.in]: ['hot', 'normal'] },
        deleted_at: null
      },
      order: [
        ['sort_order', 'DESC'],
        ['use_count', 'DESC']
      ],
      limit: parseInt(limit)
    });
  }

  /**
   * 批量更新状态
   * @param {Array} ids 标签ID数组
   * @param {String} status 新状态
   * @returns {Promise<Array>} 更新结果
   */
  async batchUpdateStatus(ids, status) {
    return await Tag.update(
      { status },
      { where: { id: { [Op.in]: ids } } }
    );
  }

  /**
   * 检查标签名称是否存在
   * @param {String} name 标签名称
   * @param {String} excludeId 排除的ID
   * @returns {Promise<Boolean>} 是否存在
   */
  async isNameExists(name, excludeId = null) {
    const whereCondition = {
      name,
      deleted_at: null
    };

    if (excludeId) {
      whereCondition.id = { [Op.ne]: excludeId };
    }

    const count = await Tag.count({ where: whereCondition });
    return count > 0;
  }
}

module.exports = new TagRepository();


