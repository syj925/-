/**
 * 添加status字段到notification_recipients表的脚本
 */
const { sequelize } = require('./config/db');

async function addStatusColumn() {
  try {
    console.log('开始添加status列到notification_recipients表...');
    
    // 检查列是否已存在
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'notification_recipients' AND COLUMN_NAME = 'status'
    `);
    
    if (results.length > 0) {
      console.log('status列已存在，无需添加');
      return;
    }

    // 创建枚举类型
    await sequelize.query(`
      CREATE TYPE IF NOT EXISTS enum_notification_recipients_status AS ENUM ('delivered', 'read', 'archived')
    `).catch(err => {
      // MySQL不支持创建类型，可能会报错，忽略这个错误
      console.log('创建枚举类型失败，可能是MySQL不支持或类型已存在:', err.message);
    });
    
    // 添加列
    await sequelize.query(`
      ALTER TABLE notification_recipients 
      ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'delivered' 
      AFTER read_at
    `);
    
    console.log('status列添加成功!');
  } catch (error) {
    console.error('添加status列失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 执行函数
addStatusColumn(); 