const redisClient = require('../src/utils/redis-client');

/**
 * 清理Redis缓存
 */
async function clearCache() {
  try {
    console.log('开始清理Redis缓存...');

    // 清理话题相关缓存
    const topicKeys = [
      'topics:hot:*',
      'topics:trending:*',
      'topics:list:*',
      'topics:detail:*'
    ];

    for (const pattern of topicKeys) {
      try {
        const keys = await redisClient.getClient().keys(pattern);
        if (keys.length > 0) {
          await redisClient.getClient().del(...keys);
          console.log(`✅ 清理了 ${keys.length} 个缓存键: ${pattern}`);
        } else {
          console.log(`⚠️ 没有找到匹配的缓存键: ${pattern}`);
        }
      } catch (error) {
        console.error(`❌ 清理缓存模式 ${pattern} 失败:`, error.message);
      }
    }

    console.log('\n🎉 Redis缓存清理完成！');
    console.log('现在可以重新启动服务器测试API');

  } catch (error) {
    console.error('❌ 清理缓存失败:', error);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    await clearCache();
    process.exit(0);
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { clearCache };
