const { sequelize } = require('../src/models');

async function checkSearchData() {
  try {
    console.log('检查搜索相关数据...');

    // 检查帖子数据
    const [posts] = await sequelize.query('SELECT COUNT(*) as count FROM posts WHERE status = "published"');
    console.log('已发布的帖子数量:', posts[0].count);

    // 检查用户数据
    const [users] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    console.log('用户数量:', users[0].count);

    // 检查话题数据
    const [topics] = await sequelize.query('SELECT COUNT(*) as count FROM topics WHERE status = "active"');
    console.log('活跃话题数量:', topics[0].count);

    // 测试搜索关键词"某某"
    const keyword = '某某';
    console.log(`\n测试搜索关键词: "${keyword}"`);

    // 搜索帖子
    const [postResults] = await sequelize.query(`
      SELECT COUNT(*) as count FROM posts 
      WHERE status = "published" 
      AND (title LIKE "%${keyword}%" OR content LIKE "%${keyword}%")
    `);
    console.log('匹配的帖子数量:', postResults[0].count);

    // 搜索用户
    const [userResults] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE username LIKE "%${keyword}%" OR nickname LIKE "%${keyword}%"
    `);
    console.log('匹配的用户数量:', userResults[0].count);

    // 搜索话题
    const [topicResults] = await sequelize.query(`
      SELECT COUNT(*) as count FROM topics 
      WHERE status = "active" 
      AND (name LIKE "%${keyword}%" OR description LIKE "%${keyword}%")
    `);
    console.log('匹配的话题数量:', topicResults[0].count);

    // 检查搜索历史
    const [historyResults] = await sequelize.query('SELECT * FROM search_histories ORDER BY updated_at DESC LIMIT 5');
    console.log('\n最近的搜索历史:');
    historyResults.forEach((record, index) => {
      console.log(`${index + 1}. 关键词: ${record.keyword}, 类型: ${record.type}, 时间: ${record.updated_at}`);
    });

  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    await sequelize.close();
  }
}

checkSearchData();