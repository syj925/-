const tagRepository = require('../repositories/tag.repository');
const { ErrorMiddleware } = require('../middlewares');
const { StatusCodes } = require('http-status-codes');
const errorCodes = require('../constants/error-codes');
const logger = require('../../config/logger');

/**
 * 标签服务层
 */
class TagService {
  /**
   * 创建标签
   * @param {Object} tagData 标签数据
   * @returns {Promise<Object>} 创建的标签
   */
  async createTag(tagData) {
    try {
      // 检查标签名称是否已存在
      const nameExists = await tagRepository.isNameExists(tagData.name);
      if (nameExists) {
        throw ErrorMiddleware.createError(
          '标签名称已存在',
          StatusCodes.BAD_REQUEST,
          errorCodes.DUPLICATE_RESOURCE
        );
      }

      const tag = await tagRepository.create(tagData);
      
      logger.info(`标签创建成功: ${tag.name}`, {
        tagId: tag.id,
        category: tag.category
      });

      return this._formatTagResponse(tag);
    } catch (error) {
      logger.error('创建标签失败:', error);
      throw error;
    }
  }

  /**
   * 获取标签详情
   * @param {String} id 标签ID
   * @returns {Promise<Object>} 标签详情
   */
  async getTagById(id) {
    const tag = await tagRepository.findById(id);
    if (!tag) {
      throw ErrorMiddleware.createError(
        '标签不存在',
        StatusCodes.NOT_FOUND,
        errorCodes.NOT_FOUND
      );
    }

    return this._formatTagResponse(tag);
  }

  /**
   * 获取标签列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 标签列表和分页信息
   */
  async getTagList(options) {
    try {
      const result = await tagRepository.findAndCountAll(options);
      
      return {
        items: result.items.map(tag => this._formatTagResponse(tag)),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      };
    } catch (error) {
      logger.error('获取标签列表失败:', error);
      throw error;
    }
  }

  /**
   * 更新标签
   * @param {String} id 标签ID
   * @param {Object} updateData 更新数据
   * @returns {Promise<Object>} 更新后的标签
   */
  async updateTag(id, updateData) {
    try {
      // 检查标签是否存在
      const existingTag = await tagRepository.findById(id);
      if (!existingTag) {
        throw ErrorMiddleware.createError(
          '标签不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.NOT_FOUND
        );
      }

      // 如果更新名称，检查是否重复
      if (updateData.name && updateData.name !== existingTag.name) {
        const nameExists = await tagRepository.isNameExists(updateData.name, id);
        if (nameExists) {
          throw ErrorMiddleware.createError(
            '标签名称已存在',
            StatusCodes.BAD_REQUEST,
            errorCodes.DUPLICATE_RESOURCE
          );
        }
      }

      await tagRepository.update(id, updateData);
      const updatedTag = await tagRepository.findById(id);

      logger.info(`标签更新成功: ${updatedTag.name}`, {
        tagId: id,
        updateData
      });

      return this._formatTagResponse(updatedTag);
    } catch (error) {
      logger.error('更新标签失败:', error);
      throw error;
    }
  }

  /**
   * 删除标签
   * @param {String} id 标签ID
   * @returns {Promise<Boolean>} 是否删除成功
   */
  async deleteTag(id) {
    try {
      const existingTag = await tagRepository.findById(id);
      if (!existingTag) {
        throw ErrorMiddleware.createError(
          '标签不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.NOT_FOUND
        );
      }

      await tagRepository.delete(id);

      logger.info(`标签删除成功: ${existingTag.name}`, {
        tagId: id
      });

      return true;
    } catch (error) {
      logger.error('删除标签失败:', error);
      throw error;
    }
  }

  /**
   * 切换标签热门状态
   * @param {String} id 标签ID
   * @returns {Promise<Object>} 更新后的标签
   */
  async toggleHotStatus(id) {
    try {
      const tag = await tagRepository.findById(id);
      if (!tag) {
        throw ErrorMiddleware.createError(
          '标签不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.NOT_FOUND
        );
      }

      const newStatus = tag.status === 'hot' ? 'normal' : 'hot';
      await tagRepository.update(id, { status: newStatus });
      
      const updatedTag = await tagRepository.findById(id);

      logger.info(`标签热门状态切换成功: ${tag.name} -> ${newStatus}`, {
        tagId: id,
        oldStatus: tag.status,
        newStatus
      });

      return this._formatTagResponse(updatedTag);
    } catch (error) {
      logger.error('切换标签热门状态失败:', error);
      throw error;
    }
  }

  /**
   * 切换标签启用/禁用状态
   * @param {String} id 标签ID
   * @returns {Promise<Object>} 更新后的标签
   */
  async toggleStatus(id) {
    try {
      const tag = await tagRepository.findById(id);
      if (!tag) {
        throw ErrorMiddleware.createError(
          '标签不存在',
          StatusCodes.NOT_FOUND,
          errorCodes.NOT_FOUND
        );
      }

      const newStatus = tag.status === 'disabled' ? 'normal' : 'disabled';
      await tagRepository.update(id, { status: newStatus });
      
      const updatedTag = await tagRepository.findById(id);

      logger.info(`标签状态切换成功: ${tag.name} -> ${newStatus}`, {
        tagId: id,
        oldStatus: tag.status,
        newStatus
      });

      return this._formatTagResponse(updatedTag);
    } catch (error) {
      logger.error('切换标签状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取热门标签
   * @param {Number} limit 限制数量
   * @returns {Promise<Array>} 热门标签列表
   */
  async getHotTags(limit = 10) {
    try {
      const tags = await tagRepository.getHotTags(limit);
      return tags.map(tag => this._formatTagResponse(tag));
    } catch (error) {
      logger.error('获取热门标签失败:', error);
      throw error;
    }
  }

  /**
   * 根据分类获取标签
   * @param {String} category 分类
   * @param {Number} limit 限制数量
   * @returns {Promise<Array>} 标签列表
   */
  async getTagsByCategory(category, limit = 50) {
    try {
      const tags = await tagRepository.findByCategory(category, limit);
      return tags.map(tag => this._formatTagResponse(tag));
    } catch (error) {
      logger.error('根据分类获取标签失败:', error);
      throw error;
    }
  }

  /**
   * 增加标签使用次数
   * @param {String} id 标签ID
   * @param {Number} increment 增加数量
   * @returns {Promise<void>}
   */
  async incrementUseCount(id, increment = 1) {
    try {
      await tagRepository.incrementUseCount(id, increment);
      
      logger.debug(`标签使用次数增加: ${id} +${increment}`);
    } catch (error) {
      logger.error('增加标签使用次数失败:', error);
      // 这里不抛出错误，避免影响主业务
    }
  }

  /**
   * 批量更新标签状态
   * @param {Array} ids 标签ID数组
   * @param {String} status 新状态
   * @returns {Promise<Boolean>} 是否更新成功
   */
  async batchUpdateStatus(ids, status) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw ErrorMiddleware.createError(
          '请选择要更新的标签',
          StatusCodes.BAD_REQUEST,
          errorCodes.INVALID_INPUT
        );
      }

      const validStatuses = ['hot', 'normal', 'disabled'];
      if (!validStatuses.includes(status)) {
        throw ErrorMiddleware.createError(
          '无效的状态值',
          StatusCodes.BAD_REQUEST,
          errorCodes.INVALID_INPUT
        );
      }

      await tagRepository.batchUpdateStatus(ids, status);

      logger.info(`批量更新标签状态成功: ${ids.length}个标签 -> ${status}`, {
        tagIds: ids,
        status
      });

      return true;
    } catch (error) {
      logger.error('批量更新标签状态失败:', error);
      throw error;
    }
  }

  /**
   * 格式化标签响应数据
   * @param {Object} tag 标签对象
   * @returns {Object} 格式化后的标签数据
   * @private
   */
  _formatTagResponse(tag) {
    if (!tag) return null;

    return {
      id: tag.id,
      name: tag.name,
      category: tag.category,
      description: tag.description,
      color: tag.color,
      status: tag.status,
      useCount: tag.use_count,
      sortOrder: tag.sort_order,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt
    };
  }

  /**
   * 获取标签统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getTagStatistics() {
    try {
      const allTags = await tagRepository.findAndCountAll({ 
        page: 1, 
        limit: 10000 // 获取所有标签进行统计
      });

      const stats = {
        total: allTags.total,
        hot: 0,
        normal: 0,
        disabled: 0,
        categories: {
          interest: 0,
          skill: 0,
          major: 0,
          grade: 0,
          other: 0
        },
        totalUseCount: 0
      };

      allTags.items.forEach(tag => {
        // 按状态统计
        stats[tag.status]++;
        
        // 按分类统计
        if (stats.categories.hasOwnProperty(tag.category)) {
          stats.categories[tag.category]++;
        }
        
        // 总使用次数
        stats.totalUseCount += tag.use_count || 0;
      });

      return stats;
    } catch (error) {
      logger.error('获取标签统计信息失败:', error);
      throw error;
    }
  }
}

module.exports = new TagService();
