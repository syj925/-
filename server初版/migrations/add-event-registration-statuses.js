'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * 添加新的活动报名状态到EventRegistration表
     */
    try {
      console.log('开始添加新的活动报名状态...');
      
      // 修改status字段的类型
      await queryInterface.sequelize.query(
        'ALTER TABLE event_registrations MODIFY COLUMN `status` ENUM("registered", "pending", "confirmed", "rejected", "cancelled", "attended") DEFAULT "registered";'
      );
      
      console.log('活动报名状态添加成功!');
      return Promise.resolve();
    } catch (error) {
      console.error('添加活动报名状态失败:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * 恢复原来的状态设置
     */
    try {
      console.log('开始恢复原来的活动报名状态...');
      
      // 恢复status字段的类型
      await queryInterface.sequelize.query(
        'ALTER TABLE event_registrations MODIFY COLUMN `status` ENUM("registered", "attended", "cancelled") DEFAULT "registered";'
      );
      
      console.log('活动报名状态恢复成功!');
      return Promise.resolve();
    } catch (error) {
      console.error('恢复活动报名状态失败:', error);
      return Promise.reject(error);
    }
  }
}; 