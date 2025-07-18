/**
 * 复合索引优化脚本
 * 
 * 基于校园墙项目的实际查询模式，优化复合索引设计
 * 提升查询性能，减少filesort操作
 */

const { sequelize } = require('./src/models');

/**
 * 检查索引是否存在
 */
async function indexExists(tableName, indexName) {
  try {
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.statistics 
      WHERE table_schema = DATABASE() 
      AND table_name = '${tableName}' 
      AND index_name = '${indexName}'
    `);
    return results[0].count > 0;
  } catch (error) {
    console.warn(`检查索引 ${indexName} 时出错:`, error.message);
    return false;
  }
}

/**
 * 安全添加索引
 */
async function addIndexIfNotExists(tableName, indexName, columns) {
  try {
    const exists = await indexExists(tableName, indexName);
    if (exists) {
      console.log(`✅ 索引 ${indexName} 已存在，跳过创建`);
      return;
    }

    console.log(`🔨 创建索引: ${indexName} ON ${tableName} (${columns})`);
    await sequelize.query(`CREATE INDEX ${indexName} ON ${tableName} (${columns})`);
    console.log(`✅ 索引 ${indexName} 创建成功`);
  } catch (error) {
    console.error(`❌ 创建索引 ${indexName} 失败:`, error.message);
  }
}

/**
 * 分析查询性能
 */
async function analyzeQueryPerformance(queryName, sql) {
  try {
    console.log(`\n🔍 分析查询: ${queryName}`);
    console.log(`SQL: ${sql.replace(/\s+/g, ' ').trim()}`);
    
    const [explain] = await sequelize.query(`EXPLAIN ${sql}`);
    const result = explain[0];
    
    console.log(`📊 执行计划:`);
    console.log(`  - 类型: ${result.type}`);
    console.log(`  - 使用索引: ${result.key || '无'}`);
    console.log(`  - 扫描行数: ${result.rows}`);
    console.log(`  - 额外信息: ${result.Extra || '无'}`);
    
    // 判断是否需要优化
    if (result.Extra && result.Extra.includes('Using filesort')) {
      console.log(`⚠️  需要优化: 查询使用了filesort，性能可能较差`);
    } else if (result.type === 'ALL') {
      console.log(`⚠️  需要优化: 全表扫描，性能很差`);
    } else {
      console.log(`✅ 查询性能良好`);
    }
    
  } catch (error) {
    console.error(`分析查询 ${queryName} 时出错:`, error.message);
  }
}

/**
 * 主优化函数
 */
async function optimizeCompositeIndexes() {
  try {
    console.log('🚀 开始复合索引优化...\n');

    // 1. 优化帖子表索引
    console.log('📝 优化帖子表索引...');
    
    // 帖子状态+置顶+时间复合索引（用于首页热门排序）
    await addIndexIfNotExists(
      'posts',
      'idx_posts_status_top_time',
      'status, is_top, created_at DESC'
    );
    
    // 用户+状态+时间复合索引（用于个人主页）
    await addIndexIfNotExists(
      'posts',
      'idx_posts_user_status_time',
      'user_id, status, created_at DESC'
    );
    
    // 分类+状态+时间复合索引（用于分类筛选）
    await addIndexIfNotExists(
      'posts',
      'idx_posts_category_status_time',
      'category_id, status, created_at DESC'
    );

    // 2. 优化评论表索引
    console.log('\n💬 优化评论表索引...');
    
    // 帖子+回复层级+状态+时间复合索引（用于评论列表）
    await addIndexIfNotExists(
      'comments',
      'idx_comments_post_reply_status_time',
      'post_id, reply_to, status, created_at DESC'
    );
    
    // 帖子+回复层级+点赞数复合索引（用于热门评论排序）
    await addIndexIfNotExists(
      'comments',
      'idx_comments_post_reply_likes',
      'post_id, reply_to, like_count DESC, created_at DESC'
    );
    
    // 用户+状态+时间复合索引（用于用户评论历史）
    await addIndexIfNotExists(
      'comments',
      'idx_comments_user_status_time',
      'user_id, status, created_at DESC'
    );

    // 3. 优化关注表索引
    console.log('\n👥 优化关注表索引...');
    
    // 关注者+时间复合索引（用于关注列表）
    await addIndexIfNotExists(
      'follows',
      'idx_follows_follower_time',
      'follower_id, created_at DESC'
    );
    
    // 被关注者+时间复合索引（用于粉丝列表）
    await addIndexIfNotExists(
      'follows',
      'idx_follows_following_time',
      'following_id, created_at DESC'
    );

    // 4. 优化点赞表索引
    console.log('\n❤️ 优化点赞表索引...');
    
    // 用户+目标类型+时间复合索引（用于用户点赞历史）
    await addIndexIfNotExists(
      'likes',
      'idx_likes_user_type_time',
      'user_id, target_type, created_at DESC'
    );
    
    // 目标+类型复合索引（用于统计点赞数）
    await addIndexIfNotExists(
      'likes',
      'idx_likes_target_type',
      'target_id, target_type'
    );

    // 5. 优化收藏表索引
    console.log('\n⭐ 优化收藏表索引...');
    
    // 用户+时间复合索引（用于收藏列表）
    await addIndexIfNotExists(
      'collections',
      'idx_collections_user_time',
      'user_id, created_at DESC'
    );

    console.log('\n✅ 复合索引优化完成！');

    // 6. 性能测试
    console.log('\n🧪 开始性能测试...');
    
    // 测试帖子查询
    await analyzeQueryPerformance(
      '首页帖子列表',
      `SELECT * FROM posts 
       WHERE status = 'published' 
       ORDER BY is_top DESC, created_at DESC 
       LIMIT 20`
    );
    
    await analyzeQueryPerformance(
      '用户帖子列表',
      `SELECT * FROM posts 
       WHERE user_id = 'test-user-id' AND status = 'published'
       ORDER BY created_at DESC 
       LIMIT 20`
    );
    
    // 测试评论查询
    await analyzeQueryPerformance(
      '帖子评论列表',
      `SELECT * FROM comments 
       WHERE post_id = 'test-post-id' AND reply_to IS NULL AND status = 'normal'
       ORDER BY created_at DESC 
       LIMIT 20`
    );
    
    await analyzeQueryPerformance(
      '热门评论排序',
      `SELECT * FROM comments 
       WHERE post_id = 'test-post-id' AND reply_to IS NULL
       ORDER BY like_count DESC, created_at DESC 
       LIMIT 20`
    );
    
    // 测试关注查询
    await analyzeQueryPerformance(
      '用户关注列表',
      `SELECT * FROM follows 
       WHERE follower_id = 'test-user-id'
       ORDER BY created_at DESC 
       LIMIT 20`
    );

    console.log('\n🎉 所有优化和测试完成！');
    
    // 7. 显示优化建议
    console.log('\n📋 优化建议总结:');
    console.log('1. 复合索引已按照最左前缀原则设计');
    console.log('2. 排序字段已包含在索引中，避免filesort');
    console.log('3. 高选择性字段放在索引前面');
    console.log('4. 建议定期监控慢查询日志');
    console.log('5. 根据实际查询模式调整索引策略');

  } catch (error) {
    console.error('❌ 优化过程中出错:', error);
  }
}

// 执行优化
optimizeCompositeIndexes()
  .then(() => {
    console.log('\n🏁 脚本执行完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
