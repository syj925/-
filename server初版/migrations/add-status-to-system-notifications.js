'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // 添加status列
      await queryInterface.addColumn('system_notifications', 'status', {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'published',
        after: 'sender_id'
      });
      
      console.log('已添加status列到system_notifications表');
    } catch (error) {
      console.error('迁移失败:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // 删除列
      await queryInterface.removeColumn('system_notifications', 'status');
      console.log('已从system_notifications表中删除status列');
    } catch (error) {
      console.error('回滚失败:', error);
      throw error;
    }
  }
}; 
 
 
 