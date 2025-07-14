/**
 * 修复数据库索引问题的工具
 * 当数据库遇到"Too many keys specified; max 64 keys allowed"错误时使用
 * 
 * 使用方法: node utils/fixIndexes.js
 */

const { sequelize } = require('../config/db');

// 修复用户名唯一索引
const fixUsernameIndex = async () => {
  try {
    console.log('开始修复用户名唯一性索引...');
    
    // 1. 获取users表中所有索引信息
    const [indexes] = await sequelize.query(`
      SHOW INDEXES FROM users
    `);
    
    console.log('当前索引数量: ', indexes.length);
    
    // 2. 检查是否已有username唯一索引
    const usernameIndex = indexes.find(idx => 
      idx.Column_name === 'username' && idx.Non_unique === 0
    );
    
    if (usernameIndex) {
      console.log('用户名已有唯一性索引，无需修复');
      return;
    }
    
    // 3. 检查是否有重复的用户名(需要先解决这些问题)
    const [duplicates] = await sequelize.query(`
      SELECT username, COUNT(*) as count
      FROM users
      GROUP BY username
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length > 0) {
      console.error('存在重复的用户名，请先解决以下冲突:');
      console.table(duplicates);
      return;
    }
    
    // 4. 如果索引数量太多，先删除一些不必要的索引
    if (indexes.length >= 64) {
      console.log('索引数量接近上限，正在清理部分非关键索引...');
      // 这里需要根据实际情况决定要删除哪些索引
      // 注意: 删除索引需要仔细评估影响
    }
    
    // 5. 添加用户名唯一性索引
    await sequelize.query(`
      ALTER TABLE users ADD UNIQUE INDEX username_unique (username)
    `);
    
    console.log('用户名唯一性索引添加成功！');
  } catch (error) {
    console.error('修复索引失败:', error);
  } finally {
    await sequelize.close();
  }
};

// 执行修复
fixUsernameIndex(); 