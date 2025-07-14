'use strict';

const { sequelize } = require('./config/db');
const { DataTypes } = require('sequelize');

async function addFields() {
  try {
    console.log('开始添加SEO和审核配置字段...');
    
    // 添加SEO相关字段
    await sequelize.getQueryInterface().addColumn('topics', 'meta_title', {
      type: DataTypes.STRING(100),
      allowNull: true
    });
    
    await sequelize.getQueryInterface().addColumn('topics', 'meta_description', {
      type: DataTypes.STRING(200),
      allowNull: true
    });
    
    await sequelize.getQueryInterface().addColumn('topics', 'meta_keywords', {
      type: DataTypes.STRING(100),
      allowNull: true
    });
    
    // 添加敏感词级别ENUM
    await sequelize.query(`ALTER TABLE topics ADD COLUMN sensitive_words_level ENUM('low', 'medium', 'high') DEFAULT 'medium' NOT NULL`);
    
    // 添加审核配置相关字段
    await sequelize.getQueryInterface().addColumn('topics', 'auto_review', {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    });
    
    await sequelize.getQueryInterface().addColumn('topics', 'custom_sensitive_words', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    
    await sequelize.getQueryInterface().addColumn('topics', 'banned_words', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    
    console.log('所有字段添加成功!');
  } catch (error) {
    console.error('添加字段时发生错误:', error);
    
    // 检查是否是"列已存在"的错误
    if (error.name === 'SequelizeDatabaseError' && error.message && error.message.includes('Duplicate column')) {
      console.log('字段已存在，无需再次添加');
    } else {
      throw error;
    }
  }
}

// 执行函数
addFields()
  .then(() => {
    console.log('操作完成');
    process.exit(0);
  })
  .catch(err => {
    console.error('执行失败:', err);
    process.exit(1);
  }); 