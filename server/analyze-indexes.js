const { sequelize } = require('./src/models');

async function analyzeIndexes() {
  try {
    await sequelize.authenticate();
    console.log('=== 复合索引原理分析 ===\n');
    
    // 1. 分析帖子查询
    console.log('📝 帖子表查询分析:');
    console.log('查询: 获取已发布的置顶帖子，按时间排序');
    console.log('SQL: SELECT * FROM posts WHERE status = "published" AND is_top = 1 ORDER BY is_top DESC, created_at DESC LIMIT 20\n');
    
    const [postsExplain] = await sequelize.query(`
      EXPLAIN SELECT * FROM posts 
      WHERE status = 'published' AND is_top = 1 
      ORDER BY is_top DESC, created_at DESC 
      LIMIT 20
    `);
    
    console.log('执行计划:');
    postsExplain.forEach(row => {
      console.log(`  表: ${row.table}`);
      console.log(`  类型: ${row.type}`);
      console.log(`  可能的索引: ${row.possible_keys}`);
      console.log(`  使用的索引: ${row.key}`);
      console.log(`  索引长度: ${row.key_len}`);
      console.log(`  扫描行数: ${row.rows}`);
      console.log(`  额外信息: ${row.Extra}\n`);
    });
    
    // 2. 分析评论查询
    console.log('💬 评论表查询分析:');
    console.log('查询: 获取帖子的顶级评论，按点赞数排序');
    console.log('SQL: SELECT * FROM comments WHERE post_id = "test" AND reply_to IS NULL ORDER BY like_count DESC LIMIT 20\n');
    
    const [commentsExplain] = await sequelize.query(`
      EXPLAIN SELECT * FROM comments 
      WHERE post_id = 'test-post-id' AND reply_to IS NULL 
      ORDER BY like_count DESC, created_at DESC 
      LIMIT 20
    `);
    
    console.log('执行计划:');
    commentsExplain.forEach(row => {
      console.log(`  表: ${row.table}`);
      console.log(`  类型: ${row.type}`);
      console.log(`  可能的索引: ${row.possible_keys}`);
      console.log(`  使用的索引: ${row.key}`);
      console.log(`  索引长度: ${row.key_len}`);
      console.log(`  扫描行数: ${row.rows}`);
      console.log(`  额外信息: ${row.Extra}\n`);
    });
    
    // 3. 分析关注查询
    console.log('👥 关注表查询分析:');
    console.log('查询: 获取用户的关注列表');
    console.log('SQL: SELECT * FROM follows WHERE follower_id = "test" ORDER BY created_at DESC\n');
    
    const [followsExplain] = await sequelize.query(`
      EXPLAIN SELECT * FROM follows 
      WHERE follower_id = 'test-user-id' 
      ORDER BY created_at DESC 
      LIMIT 20
    `);
    
    console.log('执行计划:');
    followsExplain.forEach(row => {
      console.log(`  表: ${row.table}`);
      console.log(`  类型: ${row.type}`);
      console.log(`  可能的索引: ${row.possible_keys}`);
      console.log(`  使用的索引: ${row.key}`);
      console.log(`  索引长度: ${row.key_len}`);
      console.log(`  扫描行数: ${row.rows}`);
      console.log(`  额外信息: ${row.Extra}\n`);
    });
    
    await sequelize.close();
    console.log('分析完成！');
    
  } catch (error) {
    console.error('分析过程中出错:', error.message);
  }
}

analyzeIndexes();
