'use strict';

/**
 * 迁移脚本：为评论表添加图片相关字段
 * - images: 普通评论图片列表（JSON数组）
 * - emoji_image: 图片表情（JSON对象，与images互斥）
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 添加普通图片字段
    await queryInterface.addColumn('comments', 'images', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment: '评论图片列表（普通图片）'
    });
    
    // 添加图片表情字段
    await queryInterface.addColumn('comments', 'emoji_image', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment: '图片表情（单个，与普通图片互斥）: { id, url, name }'
    });
    
    console.log('✅ 评论图片字段迁移完成');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('comments', 'images');
    await queryInterface.removeColumn('comments', 'emoji_image');
    console.log('✅ 评论图片字段回滚完成');
  }
};
