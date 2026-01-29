const { Sequelize } = require('sequelize');
const config = require('../config');
const { Comment } = require('../src/models');

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

async function checkComments() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 使用Sequelize Model查询
    const comments = await Comment.findAll({
      attributes: ['id', 'content', 'images', 'emoji_image', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    console.log('\n📋 通过Sequelize Model查询的评论:');
    comments.forEach((comment, idx) => {
      console.log(`${idx + 1}. ID: ${comment.id.substring(0, 8)}...`);
      console.log(`   内容: ${comment.content?.substring(0, 30) || '无'}`);
      console.log(`   images: ${JSON.stringify(comment.images)}`);
      console.log(`   emoji_image: ${JSON.stringify(comment.emoji_image)}`);
      console.log(`   dataValues.emoji_image: ${JSON.stringify(comment.dataValues?.emoji_image)}`);
      console.log('');
    });
    
    // 统计有图片的评论数量
    const [countResult] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN images IS NOT NULL THEN 1 ELSE 0 END) as with_images,
        SUM(CASE WHEN emoji_image IS NOT NULL THEN 1 ELSE 0 END) as with_emoji_image
      FROM comments
    `);
    
    console.log('📊 统计:', countResult[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

checkComments();
