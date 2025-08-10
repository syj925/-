/**
 * 清理话题相关缓存
 */

const redisClient = require('../src/utils/redis-client');
const config = require('../config');

async function clearTopicCache() {
  console.log('🔧 初始化Redis客户端...');
  redisClient.init();
  
  // 等待连接
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const client = redisClient.getClient();
    
    console.log('🔍 查找话题相关缓存...');
    // 查找所有可能的话题缓存键（包括带前缀的）
    const topicKeys = await client.keys('*topic*');
    
    console.log(`🎯 找到 ${topicKeys.length} 个话题相关缓存键`);
    
    if (topicKeys.length > 0) {
      console.log('📋 话题缓存键:');
      topicKeys.forEach(key => console.log(`   - ${key}`));
    }
    
    const keys = topicKeys;
    
    if (keys.length === 0) {
      console.log('✅ 没有找到需要清理的话题缓存');
      return;
    }
    
    console.log(`🗑️ 准备删除 ${keys.length} 个话题缓存键...`);
    
    // 使用redisClient的del方法删除缓存（会自动处理前缀）
    let deletedCount = 0;

    // 提取不带前缀的键名
    const keysToDelete = [];
    for (const fullKey of keys) {
      // 移除前缀 'campus_community:dev:'
      const keyWithoutPrefix = fullKey.replace('campus_community:dev:', '');
      keysToDelete.push(keyWithoutPrefix);
    }

    console.log('🔄 提取的键名（不带前缀）:');
    keysToDelete.forEach(key => console.log(`   - ${key}`));

    for (const key of keysToDelete) {
      try {
        const result = await redisClient.del(key);
        if (result) {
          deletedCount++;
          console.log(`   ✅ 删除: ${key}`);
        } else {
          console.log(`   ⚠️ 未找到: ${key}`);
        }
      } catch (error) {
        console.log(`   ❌ 删除失败: ${key}`, error.message);
      }
    }

    console.log(`✅ 成功删除 ${deletedCount} 个话题缓存键`);
    
    // 验证删除结果
    const remainingKeys = await client.keys('*topic*');
    if (remainingKeys.length === 0) {
      console.log('🎉 所有话题缓存已清理完成');
    } else {
      console.log(`⚠️ 还有 ${remainingKeys.length} 个话题缓存键未清理:`, remainingKeys);
    }
    
  } catch (error) {
    console.error('❌ 清理话题缓存失败:', error);
  } finally {
    await redisClient.getClient().quit();
    console.log('🔌 Redis连接已关闭');
  }
}

// 执行清理
clearTopicCache().then(() => {
  console.log('🎉 话题缓存清理完成');
  process.exit(0);
}).catch(error => {
  console.error('💥 话题缓存清理失败:', error);
  process.exit(1);
});
