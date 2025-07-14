const { PostImage } = require('../models');

/**
 * 帖子图片数据访问层
 */
class PostImageRepository {
  /**
   * 创建帖子图片
   * @param {Object} imageData 图片数据
   * @returns {Promise<Object>} 创建的图片对象
   */
  async create(imageData) {
    return await PostImage.create(imageData);
  }

  /**
   * 批量创建帖子图片
   * @param {Array<Object>} imagesData 图片数据数组
   * @param {Object} options 附加选项，包括事务
   * @returns {Promise<Array>} 创建的图片对象数组
   */
  async bulkCreate(imagesData, options = {}) {
    return await PostImage.bulkCreate(imagesData, options);
  }

  /**
   * 根据ID查找图片
   * @param {String} id 图片ID
   * @returns {Promise<Object>} 图片对象
   */
  async findById(id) {
    return await PostImage.findByPk(id);
  }

  /**
   * 更新图片信息
   * @param {String} id 图片ID
   * @param {Object} imageData 图片数据
   * @returns {Promise<Object>} 更新后的图片对象
   */
  async update(id, imageData) {
    const image = await PostImage.findByPk(id);
    if (!image) return null;
    
    await image.update(imageData);
    return image;
  }

  /**
   * 删除图片
   * @param {String} id 图片ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async delete(id) {
    const result = await PostImage.destroy({ where: { id } });
    return result > 0;
  }

  /**
   * 根据帖子ID获取图片列表
   * @param {String} postId 帖子ID
   * @returns {Promise<Array>} 图片列表
   */
  async findByPostId(postId) {
    return await PostImage.findAll({
      where: { post_id: postId },
      order: [['order', 'ASC']]
    });
  }

  /**
   * 批量更新图片顺序
   * @param {Array<Object>} imagesOrder 图片顺序数组 [{id, order}, ...]
   * @returns {Promise<Boolean>} 是否成功
   */
  async updateOrder(imagesOrder) {
    // 使用事务确保所有更新成功或全部失败
    const transaction = await PostImage.sequelize.transaction();
    
    try {
      for (const item of imagesOrder) {
        await PostImage.update(
          { order: item.order },
          { 
            where: { id: item.id },
            transaction
          }
        );
      }
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 根据帖子ID删除所有图片
   * @param {String} postId 帖子ID
   * @param {Object} options 附加选项，包括事务
   * @returns {Promise<Number>} 删除的图片数量
   */
  async deleteByPostId(postId, options = {}) {
    const result = await PostImage.destroy({ 
      where: { post_id: postId },
      ...options
    });
    return result;
  }

  /**
   * 获取帖子第一张图片
   * @param {String} postId 帖子ID
   * @returns {Promise<Object>} 图片对象
   */
  async getFirstImage(postId) {
    return await PostImage.findOne({
      where: { post_id: postId },
      order: [['order', 'ASC']]
    });
  }
}

module.exports = new PostImageRepository(); 