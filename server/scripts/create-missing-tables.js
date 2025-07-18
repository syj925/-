/**
 * 创建缺失的数据库表
 * 主要是 user_rejection_logs 表
 */

const { Sequelize } = require('sequelize');
const projectConfig = require('../config');

console.log('🔧 创建缺失的数据库表');
console.log('====================');

async function createMissingTables() {
  let sequelize;
  
  try {
    // 连接数据库
    console.log('🔌 连接数据库...');
    sequelize = new Sequelize(
      projectConfig.database.database,
      projectConfig.database.username,
      projectConfig.database.password,
      {
        ...projectConfig.database,
        logging: false
      }
    );
    
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 创建 user_rejection_logs 表
    console.log('📋 创建 user_rejection_logs 表...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_rejection_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL COMMENT '被拒绝的用户名',
        nickname VARCHAR(100) COMMENT '用户昵称',
        email VARCHAR(100) COMMENT '用户邮箱',
        rejection_reason TEXT NOT NULL COMMENT '拒绝原因',
        rejected_by CHAR(36) NOT NULL COMMENT '操作管理员ID',
        rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '拒绝时间',
        ip_address VARCHAR(45) COMMENT 'IP地址',
        user_agent TEXT COMMENT '用户代理',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_rejected_by (rejected_by),
        INDEX idx_rejected_at (rejected_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户注册拒绝记录表';
    `);
    
    console.log('✅ user_rejection_logs 表创建成功');
    
    // 检查是否还有其他缺失的表
    console.log('🔍 检查其他可能缺失的表...');
    
    // 检查表是否存在的函数
    const checkTableExists = async (tableName) => {
      const result = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = '${projectConfig.database.database}' 
        AND table_name = '${tableName}'
      `, { type: sequelize.QueryTypes.SELECT });
      return result[0].count > 0;
    };
    
    // 需要检查的表列表
    const requiredTables = [
      'users', 'posts', 'comments', 'likes', 'favorites', 'follows',
      'categories', 'topics', 'post_topics', 'post_images', 
      'messages', 'search_histories', 'settings', 'user_rejection_logs'
    ];
    
    console.log('📊 表存在性检查结果：');
    let missingTables = [];
    
    for (const tableName of requiredTables) {
      const exists = await checkTableExists(tableName);
      if (exists) {
        console.log(`   ✅ ${tableName}`);
      } else {
        console.log(`   ❌ ${tableName} - 缺失`);
        missingTables.push(tableName);
      }
    }
    
    if (missingTables.length === 0) {
      console.log('');
      console.log('🎉 所有必需的表都已存在！');
    } else {
      console.log('');
      console.log('⚠️ 发现缺失的表：');
      missingTables.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log('');
      console.log('💡 建议：如果有其他缺失的表，请运行 force-restore.js 重新创建所有表');
    }
    
    console.log('');
    console.log('🎯 缺失表创建完成！');
    console.log('');
    console.log('📝 创建的表：');
    console.log('   ✅ user_rejection_logs - 用户注册拒绝记录表');
    console.log('');
    console.log('🚀 现在可以正常使用管理后台的用户审核功能了！');
    console.log('');
    
  } catch (error) {
    console.error('❌ 创建表失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

createMissingTables();
