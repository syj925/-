'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 添加SEO相关字段
    await queryInterface.addColumn('topics', 'meta_title', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    
    await queryInterface.addColumn('topics', 'meta_description', {
      type: Sequelize.STRING(200),
      allowNull: true
    });
    
    await queryInterface.addColumn('topics', 'meta_keywords', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    
    // 添加审核配置相关字段
    await queryInterface.addColumn('topics', 'sensitive_words_level', {
      type: Sequelize.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
      allowNull: false
    });
    
    await queryInterface.addColumn('topics', 'auto_review', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    
    await queryInterface.addColumn('topics', 'custom_sensitive_words', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('topics', 'banned_words', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // 删除审核配置相关字段
    await queryInterface.removeColumn('topics', 'banned_words');
    await queryInterface.removeColumn('topics', 'custom_sensitive_words');
    await queryInterface.removeColumn('topics', 'auto_review');
    await queryInterface.removeColumn('topics', 'sensitive_words_level');
    
    // 删除SEO相关字段
    await queryInterface.removeColumn('topics', 'meta_keywords');
    await queryInterface.removeColumn('topics', 'meta_description');
    await queryInterface.removeColumn('topics', 'meta_title');
  }
}; 