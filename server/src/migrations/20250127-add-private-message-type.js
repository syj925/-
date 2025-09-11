'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('开始执行迁移：添加私信消息类型...');
    
    try {
      // 修改 Messages 表的 type 字段，添加 'private' 类型
      await queryInterface.sequelize.query(`
        ALTER TABLE Messages 
        MODIFY COLUMN type ENUM('comment', 'like', 'favorite', 'system', 'follow', 'mention', 'reply', 'private') 
        NOT NULL;
      `);
      
      console.log('✅ 成功添加 private 消息类型到 Messages 表');
      
    } catch (error) {
      console.error('❌ 添加 private 消息类型失败:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('开始回滚迁移：移除私信消息类型...');
    
    try {
      // 首先删除所有 private 类型的消息
      await queryInterface.sequelize.query(`
        DELETE FROM Messages WHERE type = 'private';
      `);
      
      // 然后恢复原来的 ENUM
      await queryInterface.sequelize.query(`
        ALTER TABLE Messages 
        MODIFY COLUMN type ENUM('comment', 'like', 'favorite', 'system', 'follow', 'mention', 'reply') 
        NOT NULL;
      `);
      
      console.log('✅ 成功回滚 private 消息类型');
      
    } catch (error) {
      console.error('❌ 回滚 private 消息类型失败:', error);
      throw error;
    }
  }
};














module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('开始执行迁移：添加私信消息类型...');
    
    try {
      // 修改 Messages 表的 type 字段，添加 'private' 类型
      await queryInterface.sequelize.query(`
        ALTER TABLE Messages 
        MODIFY COLUMN type ENUM('comment', 'like', 'favorite', 'system', 'follow', 'mention', 'reply', 'private') 
        NOT NULL;
      `);
      
      console.log('✅ 成功添加 private 消息类型到 Messages 表');
      
    } catch (error) {
      console.error('❌ 添加 private 消息类型失败:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('开始回滚迁移：移除私信消息类型...');
    
    try {
      // 首先删除所有 private 类型的消息
      await queryInterface.sequelize.query(`
        DELETE FROM Messages WHERE type = 'private';
      `);
      
      // 然后恢复原来的 ENUM
      await queryInterface.sequelize.query(`
        ALTER TABLE Messages 
        MODIFY COLUMN type ENUM('comment', 'like', 'favorite', 'system', 'follow', 'mention', 'reply') 
        NOT NULL;
      `);
      
      console.log('✅ 成功回滚 private 消息类型');
      
    } catch (error) {
      console.error('❌ 回滚 private 消息类型失败:', error);
      throw error;
    }
  }
};












