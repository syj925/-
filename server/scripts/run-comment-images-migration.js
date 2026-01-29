const { Sequelize } = require('sequelize');
const config = require('../config');

// 初始化数据库连接
const sequelize = new Sequelize(
  config.database.database,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: false
  }
);

/**
 * 运行评论图片字段迁移
 */
async function runMigration() {
  try {
    console.log('🚀 开始运行评论图片字段迁移...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    const queryInterface = sequelize.getQueryInterface();

    // 检查字段是否已存在
    const tableDescription = await queryInterface.describeTable('comments');
    
    // 添加 images 字段
    if (!tableDescription.images) {
      console.log('📋 添加 images 字段...');
      await queryInterface.addColumn('comments', 'images', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        comment: '评论图片列表（普通图片）'
      });
      console.log('✅ images 字段添加成功');
    } else {
      console.log('⏭️ images 字段已存在，跳过');
    }
    
    // 添加 emoji_image 字段
    if (!tableDescription.emoji_image) {
      console.log('📋 添加 emoji_image 字段...');
      await queryInterface.addColumn('comments', 'emoji_image', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        comment: '图片表情（单个，与普通图片互斥）: { id, url, name }'
      });
      console.log('✅ emoji_image 字段添加成功');
    } else {
      console.log('⏭️ emoji_image 字段已存在，跳过');
    }

    console.log('🎉 评论图片字段迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

runMigration();
