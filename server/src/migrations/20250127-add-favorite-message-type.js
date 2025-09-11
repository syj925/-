'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 开始添加 favorite 消息类型...');
      
      // MySQL: 修改 ENUM 类型，添加 'favorite'
      await queryInterface.sequelize.query(`
        ALTER TABLE Messages 
        MODIFY COLUMN type ENUM('comment', 'like', 'favorite', 'system', 'follow', 'mention', 'reply') NOT NULL;
      `);
      
      console.log('✅ 成功添加 favorite 消息类型');
    } catch (error) {
      console.error('❌ 添加 favorite 消息类型失败:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 开始移除 favorite 消息类型...');
      
      // MySQL: 修改 ENUM 类型，移除 'favorite'
      await queryInterface.sequelize.query(`
        ALTER TABLE Messages 
        MODIFY COLUMN type ENUM('comment', 'like', 'system', 'follow', 'mention', 'reply') NOT NULL;
      `);
      
      console.log('✅ 成功移除 favorite 消息类型');
    } catch (error) {
      console.error('❌ 移除 favorite 消息类型失败:', error.message);
      throw error;
    }
  }
};
