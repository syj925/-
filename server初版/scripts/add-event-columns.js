const { sequelize } = require('../models/associations');

async function addColumns() {
  try {
    // 检查detail_images列是否存在
    const [detailImagesCheck] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'events' 
      AND COLUMN_NAME = 'detail_images'
    `);
    
    // 如果detail_images列不存在，添加它
    if (detailImagesCheck[0].count === 0) {
      console.log('添加detail_images列...');
      await sequelize.query(`
        ALTER TABLE events 
        ADD COLUMN detail_images TEXT NULL
      `);
      console.log('detail_images列添加成功');
    } else {
      console.log('detail_images列已存在，跳过');
    }
    
    // 检查notices列是否存在
    const [noticesCheck] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'events' 
      AND COLUMN_NAME = 'notices'
    `);
    
    // 如果notices列不存在，添加它
    if (noticesCheck[0].count === 0) {
      console.log('添加notices列...');
      await sequelize.query(`
        ALTER TABLE events 
        ADD COLUMN notices TEXT NULL
      `);
      console.log('notices列添加成功');
    } else {
      console.log('notices列已存在，跳过');
    }
    
    console.log('所有列添加完成');
    process.exit(0);
  } catch (error) {
    console.error('添加列时出错:', error);
    process.exit(1);
  }
}

// 执行添加列的函数
addColumns(); 