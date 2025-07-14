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

async function addBackgroundImageField() {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 检查列是否存在
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${config.database}' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'background_image'
    `);
    
    // 如果列不存在，则添加
    if (results.length === 0) {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN background_image VARCHAR(255) NULL AFTER avatar
      `);
      console.log('成功添加 background_image 字段到 users 表');
    } else {
      console.log('background_image 字段已存在于 users 表中');
    }

    // 关闭数据库连接
    await sequelize.close();
    console.log('数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('修改数据库表时出错:', error);
    process.exit(1);
  }
}

// 执行修改
addBackgroundImageField();
