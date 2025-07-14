'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // 添加importance列
      await queryInterface.addColumn('system_notifications', 'importance', {
        type: Sequelize.ENUM('low', 'normal', 'high'),
        allowNull: false,
        defaultValue: 'normal',
        after: 'type'
      });
      
      console.log('已添加importance列到system_notifications表');
    } catch (error) {
      console.error('迁移失败:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // 删除列
      await queryInterface.removeColumn('system_notifications', 'importance');
      console.log('已从system_notifications表中删除importance列');
    } catch (error) {
      console.error('回滚失败:', error);
      throw error;
    }
  }
}; 