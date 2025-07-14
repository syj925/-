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

async function syncModelFields() {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 获取当前表结构
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${config.database}' 
      AND TABLE_NAME = 'users'
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME.toLowerCase());
    console.log('现有列:', existingColumns.join(', '));
    
    // 定义模型中存在但可能不在表中的字段
    const modelFields = [
      { name: 'is_disabled', type: 'BOOLEAN NOT NULL DEFAULT false' },
      { name: 'phone', type: 'VARCHAR(20) UNIQUE' },
      { name: 'gender', type: "ENUM('male', 'female', 'other')" },
      { name: 'school', type: 'VARCHAR(100)' },
      { name: 'department', type: 'VARCHAR(100)' },
      { name: 'last_login_at', type: 'DATETIME' }
    ];
    
    // 检查并添加缺失的字段
    for (const field of modelFields) {
      if (!existingColumns.includes(field.name)) {
        await sequelize.query(`
          ALTER TABLE users 
          ADD COLUMN ${field.name} ${field.type}
        `);
        console.log(`成功添加 ${field.name} 字段到 users 表`);
      } else {
        console.log(`${field.name} 字段已存在于 users 表中`);
      }
    }

    console.log('字段同步完成');
    process.exit(0);
  } catch (error) {
    console.error('同步模型字段时出错:', error);
    process.exit(1);
  }
}

// 执行同步
syncModelFields(); 