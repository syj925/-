// server/scripts/fix-email-field.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// 加载数据库配置
const config = require('../config/database')[process.env.NODE_ENV || 'development'];

// 创建Sequelize实例
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: console.log
  }
);

async function fixEmailField() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 修改email列允许NULL值
    await sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN email VARCHAR(255) NULL
    `);
    
    console.log('成功修改email列为允许NULL');
    
    process.exit(0);
  } catch (error) {
    console.error('修改email列时出错:', error);
    process.exit(1);
  }
}

fixEmailField();