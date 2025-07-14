const Redis = require('ioredis');
const config = require('../src/config');

async function clearTopicCache() {
  const redis = new Redis(config.redis);
  
  try {
    console.log('正在清除话题相关缓存...');
    
    // 获取所有话题相关的缓存键
    const keys = await redis.keys('topic:*');
    const hotKeys = await redis.keys('topics:hot:*');
    const trendingKeys = await redis.keys('topics:trending:*');
    
    const allKeys = [...keys, ...hotKeys, ...trendingKeys];
    
    if (allKeys.length > 0) {
      console.log(`找到 ${allKeys.length} 个缓存键，正在删除...`);
      await redis.del(...allKeys);
      console.log('缓存清除完成！');
    } else {
      console.log('没有找到话题相关的缓存');
    }
    
  } catch (error) {
    console.error('清除缓存失败:', error);
  } finally {
    await redis.disconnect();
  }
}

clearTopicCache();
