/**
 * 调试Redis缓存问题
 */

const redisClient = require('../src/utils/redis-client');
const config = require('../config');

async function debugRedisCache() {
  console.log('🔧 初始化Redis客户端...');
  redisClient.init();
  
  // 等待连接
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const testKey = 'banners:home:app:active:5';
    const testData = [
      {
        id: 'test-id',
        title: 'Test Banner',
        image: '/test.png',
        scene: 'home'
      }
    ];
    
    console.log('📝 测试数据写入...');
    console.log('键:', testKey);
    console.log('数据:', JSON.stringify(testData, null, 2));
    console.log('Redis配置:', config.redis);
    
    // 写入数据
    await redisClient.setex(testKey, 300, testData);
    console.log('✅ 数据写入成功');
    
    // 读取数据
    console.log('📖 读取数据...');
    const cached = await redisClient.get(testKey);
    console.log('缓存数据类型:', typeof cached);
    console.log('缓存数据内容:', cached);
    
    if (typeof cached === 'object') {
      console.log('🔍 对象详细信息:');
      console.log('- 是否为数组:', Array.isArray(cached));
      console.log('- 构造函数:', cached.constructor.name);
      console.log('- JSON字符串:', JSON.stringify(cached));
    }
    
    // 检查实际存储的键
    console.log('🔍 检查Redis中的实际键...');
    const client = redisClient.getClient();
    const allKeys = await client.keys('*banner*');
    console.log('所有轮播图相关键:', allKeys);
    
    // 直接从Redis获取原始数据
    if (allKeys.length > 0) {
      for (const key of allKeys) {
        const rawValue = await client.get(key);
        console.log(`键 ${key}:`);
        console.log('- 原始值类型:', typeof rawValue);
        console.log('- 原始值内容:', rawValue);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await redisClient.getClient().quit();
    console.log('🔌 Redis连接已关闭');
  }
}

// 执行调试
debugRedisCache().then(() => {
  console.log('🎉 调试完成');
  process.exit(0);
}).catch(error => {
  console.error('💥 调试失败:', error);
  process.exit(1);
});
