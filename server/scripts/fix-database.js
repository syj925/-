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

async function fixDatabase() {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 获取当前表结构
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${config.database}' 
      AND TABLE_NAME = 'users'
    `);
    
    const existingColumns = {};
    columns.forEach(col => {
      existingColumns[col.COLUMN_NAME.toLowerCase()] = col.COLUMN_TYPE;
    });
    
    console.log('现有列:', Object.keys(existingColumns).join(', '));
    
    // 检查role字段是否需要更新
    if (existingColumns.role && !existingColumns.role.includes('student')) {
      console.log('需要更新role字段类型...');
      
      // 1. 创建临时字段
      await sequelize.query(`ALTER TABLE users ADD COLUMN role_new VARCHAR(20) NOT NULL DEFAULT 'student'`);
      
      // 2. 将现有值迁移到新字段
      await sequelize.query(`
        UPDATE users 
        SET role_new = CASE 
          WHEN role = 'user' THEN 'student' 
          WHEN role = 'admin' THEN 'admin' 
          ELSE 'student' 
        END
      `);
      
      // 3. 删除旧字段
      await sequelize.query(`ALTER TABLE users DROP COLUMN role`);
      
      // 4. 重命名新字段
      await sequelize.query(`ALTER TABLE users CHANGE role_new role ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student'`);
      
      console.log('role字段类型已更新');
    }
    
    // 定义模型中存在但可能不在表中的字段
    const modelFields = [
      { name: 'is_disabled', type: 'BOOLEAN NOT NULL DEFAULT false' },
      { name: 'phone', type: 'VARCHAR(20)' }, 
      { name: 'gender', type: "ENUM('male', 'female', 'other')" },
      { name: 'school', type: 'VARCHAR(100)' },
      { name: 'department', type: 'VARCHAR(100)' },
      { name: 'last_login_at', type: 'DATETIME' }
    ];
    
    // 检查并添加缺失的字段
    for (const field of modelFields) {
      if (!existingColumns[field.name]) {
        await sequelize.query(`
          ALTER TABLE users 
          ADD COLUMN ${field.name} ${field.type}
        `);
        console.log(`成功添加 ${field.name} 字段到 users 表`);
      } else {
        console.log(`${field.name} 字段已存在于 users 表中`);
      }
    }

    console.log('数据库修复完成');
    
    // 确认修复后的结构
    const [updatedColumns] = await sequelize.query(`
      DESCRIBE users
    `);
    
    console.log('修复后的表结构:');
    updatedColumns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('修复数据库时出错:', error);
    process.exit(1);
  }
}

// 执行修复
fixDatabase(); 