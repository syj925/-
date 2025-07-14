/**
 * 评论排序查询索引优化脚本
 * 
 * 为热门评论排序功能添加必要的数据库索引，提升查询性能
 */

const { sequelize } = require('../src/models');

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
 * 添加索引（如果不存在）
 */
async function addIndexIfNotExists(tableName, indexName, columns, options = {}) {
  try {
    const exists = await indexExists(tableName, indexName);
    if (exists) {
      console.log(`✅ 索引 ${indexName} 已存在，跳过创建`);
      return;
    }

    const uniqueClause = options.unique ? 'UNIQUE' : '';
    const sql = `CREATE ${uniqueClause} INDEX ${indexName} ON ${tableName} (${columns})`;
    
    await sequelize.query(sql);
    console.log(`✅ 成功创建索引: ${indexName}`);
  } catch (error) {
    console.error(`❌ 创建索引 ${indexName} 失败:`, error.message);
  }
}

/**
 * 优化评论排序查询的索引
 */
async function optimizeCommentIndexes() {
  console.log('🚀 开始优化评论排序查询索引...\n');

  try {
    // 1. 复合索引：post_id + reply_to + status + like_count + created_at
    // 用于热门排序和点赞最多排序
    await addIndexIfNotExists(
      'comments',
      'idx_comments_hot_sort',
      'post_id, reply_to, status, like_count DESC, created_at DESC'
    );

    // 2. 复合索引：post_id + reply_to + status + created_at
    // 用于最新排序（优化现有查询）
    await addIndexIfNotExists(
      'comments',
      'idx_comments_latest_sort',
      'post_id, reply_to, status, created_at DESC'
    );

    // 3. 单独的 like_count 索引（如果不存在）
    // 用于快速点赞数排序
    await addIndexIfNotExists(
      'comments',
      'idx_comments_like_count',
      'like_count DESC'
    );

    // 4. 复合索引：status + created_at
    // 用于全局评论排序
    await addIndexIfNotExists(
      'comments',
      'idx_comments_status_created',
      'status, created_at DESC'
    );

    // 5. 复合索引：user_id + created_at + like_count
    // 用于用户评论历史和热度分析
    await addIndexIfNotExists(
      'comments',
      'idx_comments_user_activity',
      'user_id, created_at DESC, like_count DESC'
    );

    console.log('\n🎉 评论排序索引优化完成！');
    
    // 显示索引使用建议
    console.log('\n📊 索引使用说明：');
    console.log('1. idx_comments_hot_sort: 用于热门排序和点赞最多排序');
    console.log('2. idx_comments_latest_sort: 用于最新排序');
    console.log('3. idx_comments_like_count: 用于纯点赞数排序');
    console.log('4. idx_comments_status_created: 用于全局评论排序');
    console.log('5. idx_comments_user_activity: 用于用户评论分析');

  } catch (error) {
    console.error('❌ 索引优化过程中出错:', error);
  }
}

/**
 * 分析查询性能
 */
async function analyzeQueryPerformance() {
  console.log('\n🔍 分析查询性能...\n');

  const queries = [
    {
      name: '最新排序查询',
      sql: `
        EXPLAIN SELECT * FROM comments 
        WHERE post_id = 'test-post-id' AND reply_to IS NULL AND status = 'normal' 
        ORDER BY created_at DESC 
        LIMIT 20
      `
    },
    {
      name: '点赞最多排序查询',
      sql: `
        EXPLAIN SELECT * FROM comments 
        WHERE post_id = 'test-post-id' AND reply_to IS NULL AND status = 'normal' 
        ORDER BY like_count DESC, created_at DESC 
        LIMIT 20
      `
    },
    {
      name: '热门排序查询',
      sql: `
        EXPLAIN SELECT * FROM comments 
        WHERE post_id = 'test-post-id' AND reply_to IS NULL AND status = 'normal' 
        ORDER BY (0.7 * LOG(like_count + 1) + 0.3 * EXP(-0.1 * TIMESTAMPDIFF(HOUR, created_at, NOW()))) DESC, created_at DESC 
        LIMIT 20
      `
    }
  ];

  for (const query of queries) {
    try {
      console.log(`📈 ${query.name}:`);
      const [results] = await sequelize.query(query.sql);
      console.table(results);
      console.log('');
    } catch (error) {
      console.warn(`分析 ${query.name} 时出错:`, error.message);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    // 优化索引
    await optimizeCommentIndexes();

    // 分析性能（可选）
    if (process.argv.includes('--analyze')) {
      await analyzeQueryPerformance();
    }

    console.log('\n✨ 索引优化完成！');
    
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  optimizeCommentIndexes,
  analyzeQueryPerformance
};
