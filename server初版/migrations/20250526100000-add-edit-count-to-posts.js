'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // 添加edit_count字段
      await queryInterface.addColumn('posts', 'edit_count', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: '帖子编辑次数，用于限制编辑'
      });
      
      console.log('添加edit_count字段成功');
      
      // 添加索引以优化查询性能
      await queryInterface.addIndex('posts', ['edit_count'], {
        name: 'idx_posts_edit_count'
      });
      
      console.log('为edit_count字段添加索引成功');
      
    } catch (error) {
      console.log('添加edit_count字段失败，可能已存在:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // 移除索引
      await queryInterface.removeIndex('posts', 'idx_posts_edit_count');
      
      // 移除edit_count字段
      await queryInterface.removeColumn('posts', 'edit_count');
      
      console.log('回滚edit_count字段成功');
    } catch (error) {
      console.log('移除edit_count字段失败:', error.message);
    }
  }
}; 