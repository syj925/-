/**
 * 清理轮播图相关的缓存数据
 */

const Redis = require('ioredis');
const config = require('../config');

async function clearBannerCache() {
  let client;

  try {
    console.log('🔧 连接Redis...');
    console.log('Redis配置:', config.redis);

    // 使用正确的Redis配置
    client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });
    
    console.log('🔍 查找轮播图相关缓存...');
    // 查找所有可能的轮播图缓存键（包括带前缀的）
    const bannerKeys = await client.keys('*banners*');

    console.log(`🎯 找到 ${bannerKeys.length} 个轮播图相关缓存键`);

    if (bannerKeys.length > 0) {
      console.log('📋 轮播图缓存键:');
      bannerKeys.forEach(key => console.log(`   - ${key}`));
    }

    const keys = bannerKeys;
    
    if (keys.length === 0) {
      console.log('✅ 没有找到轮播图缓存数据');
      return;
    }
    
    console.log(`📋 找到 ${keys.length} 个轮播图缓存键:`);
    keys.forEach(key => console.log(`   - ${key}`));
    
    console.log('🗑️ 清理缓存数据...');
    const result = await client.del(...keys);
    
    console.log(`✅ 成功清理 ${result} 个缓存键`);
    
  } catch (error) {
    console.error('❌ 清理缓存失败:', error);
  } finally {
    if (client) {
      await client.quit();
      console.log('🔌 Redis连接已关闭');
    }
  }
}

// 执行清理
clearBannerCache().then(() => {
  console.log('🎉 缓存清理完成');
  process.exit(0);
}).catch(error => {
  console.error('💥 脚本执行失败:', error);
  process.exit(1);
});
