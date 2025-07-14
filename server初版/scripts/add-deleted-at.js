/**
 * 添加deleted_at列到notification_recipients表
 * 解决"Unknown column 'NotificationRecipient.deleted_at' in 'field list'"错误
 */

const { sequelize } = require('../config/db');

async function addDeletedAtColumn() {
  try {
    console.log('开始添加deleted_at列到notification_recipients表...');
    
    // 检查列是否已存在
    const [checkResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'notification_recipients' 
      AND COLUMN_NAME = 'deleted_at'
    `);
    
    if (checkResults && checkResults.length > 0) {
      console.log('deleted_at列已存在，无需添加');
      return;
    }
    
    // 添加deleted_at列
    await sequelize.query(`
      ALTER TABLE notification_recipients 
      ADD COLUMN deleted_at DATETIME NULL AFTER updated_at
    `);
    
    console.log('deleted_at列添加成功');
  } catch (error) {
    console.error('添加deleted_at列失败:', error);
    process.exit(1);
  }
}

// 执行
addDeletedAtColumn()
  .then(() => {
    console.log('操作完成');
    process.exit(0);
  })
  .catch(err => {
    console.error('操作失败:', err);
    process.exit(1);
  }); 