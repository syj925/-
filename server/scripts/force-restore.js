/**
 * 强制数据库恢复脚本
 * 先删除数据库，再重新创建
 */

const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const projectConfig = require('../config');

console.log('🚀 强制数据库恢复');
console.log('==================');

async function forceRestore() {
  let sequelize;
  
  try {
    // 1. 连接MySQL服务器（不指定数据库）
    console.log('🔌 连接MySQL服务器...');
    sequelize = new Sequelize('', projectConfig.database.username, projectConfig.database.password, {
      host: projectConfig.database.host,
      port: projectConfig.database.port,
      dialect: 'mysql',
      logging: false
    });
    
    await sequelize.authenticate();
    console.log('✅ MySQL连接成功');
    
    // 2. 删除并重新创建数据库
    console.log('🗑️ 删除现有数据库...');
    await sequelize.query(`DROP DATABASE IF EXISTS ${projectConfig.database.database}`);
    
    console.log('🆕 创建新数据库...');
    await sequelize.query(`CREATE DATABASE ${projectConfig.database.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    await sequelize.close();
    console.log('✅ 数据库重建完成');
    
    // 3. 连接到新数据库并创建表
    console.log('📋 连接新数据库并创建表...');
    const models = require('../src/models/index');

    // 临时禁用外键检查
    console.log('🔧 临时禁用外键检查...');
    await models.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // 使用force: true强制重建所有表
    await models.sequelize.sync({
      force: true,
      logging: false
    });

    // 重新启用外键检查
    await models.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ 数据表创建完成');
    
    // 4. 创建基础数据
    console.log('📝 创建基础数据...');
    
    // 创建默认分类
    const categories = [
      { name: '学习交流', icon: '📚', sort: 1 },
      { name: '生活分享', icon: '🌟', sort: 2 },
      { name: '社团活动', icon: '🎭', sort: 3 },
      { name: '求助问答', icon: '❓', sort: 4 },
      { name: '闲聊灌水', icon: '💬', sort: 5 }
    ];
    
    for (const category of categories) {
      await models.Category.create(category);
    }
    console.log('✅ 默认分类创建完成');
    
    // 创建管理员账户
    const adminPassword = await bcrypt.hash('admin123', 10);
    await models.User.create({
      username: 'admin',
      nickname: '系统管理员',
      email: 'admin@campus.com',
      password: adminPassword,
      role: 'admin',
      status: 'active',
      avatar: '/uploads/default-avatar.png'
    });
    console.log('✅ 管理员账户创建完成');
    
    // 创建系统设置
    const settings = [
      { key: 'site_name', value: '校园墙', description: '网站名称' },
      { key: 'site_description', value: '校园社交平台', description: '网站描述' },
      { key: 'max_post_length', value: '1000', description: '帖子最大长度' },
      { key: 'max_comment_length', value: '500', description: '评论最大长度' },
      { key: 'posts_per_page', value: '20', description: '每页帖子数量' }
    ];
    
    for (const setting of settings) {
      await models.Setting.create(setting);
    }
    console.log('✅ 系统设置创建完成');
    
    await models.sequelize.close();
    
    console.log('');
    console.log('🎉 数据库强制恢复完成！');
    console.log('');
    console.log('📊 恢复结果:');
    console.log(`   ✅ 数据库: ${projectConfig.database.database}`);
    console.log(`   ✅ 分类: ${categories.length} 个`);
    console.log(`   ✅ 管理员: admin / admin123`);
    console.log(`   ✅ 设置: ${settings.length} 项`);
    console.log('');
    console.log('🚀 下一步操作:');
    console.log('   npm run dev');
    console.log('');
    
  } catch (error) {
    console.error('❌ 恢复失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

forceRestore();
