'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // 重命名列
      await queryInterface.renameColumn('system_notifications', 'scheduled_time', 'scheduled_at');
      
      console.log('已将scheduled_time列重命名为scheduled_at');
    } catch (error) {
      console.error('迁移失败:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // 还原重命名
      await queryInterface.renameColumn('system_notifications', 'scheduled_at', 'scheduled_time');
      console.log('已将scheduled_at列重命名为scheduled_time');
    } catch (error) {
      console.error('回滚失败:', error);
      throw error;
    }
  }
}; 