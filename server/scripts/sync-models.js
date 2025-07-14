const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 导入模型
const db = require('../src/models');
const logger = require('../config/logger');

async function syncModels() {
  try {
    console.log('开始同步数据库模型...');
    
    // 同步所有模型到数据库
    // 使用 { force: true } 将删除并重新创建表，谨慎使用
    // 使用 { alter: true } 将修改表以匹配模型，但会保留数据
    await db.sequelize.sync({ alter: true });
    
    console.log('数据库模型同步完成！');
    process.exit(0);
  } catch (error) {
    console.error('同步数据库模型时出错:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行同步
syncModels(); 