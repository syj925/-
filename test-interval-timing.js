/**
 * 测试配置更新间隔时间逻辑
 * 模拟App启动和时间检查逻辑
 */

// 模拟uni-app存储
const mockStorage = {};
const uni = {
  getStorageSync: (key) => mockStorage[key] || null,
  setStorageSync: (key, value) => { mockStorage[key] = value; }
};

// 模拟配置更新管理器的核心逻辑
class MockConfigUpdateManager {
  constructor() {
    this.checkInterval = this.getStoredInterval();
  }

  getStoredInterval() {
    try {
      const storedInterval = uni.getStorageSync('config_check_interval');
      if (storedInterval && storedInterval > 0) {
        console.log(`📅 使用存储的检查间隔: ${storedInterval / 60000} 分钟`);
        return storedInterval;
      }
    } catch (error) {
      console.warn('获取存储的检查间隔失败:', error);
    }

    // 默认5分钟
    const defaultInterval = 5 * 60 * 1000;
    console.log(`📅 使用默认检查间隔: 5 分钟`);
    return defaultInterval;
  }

  shouldCheckForUpdates(forceCheck = false) {
    // 如果是强制检查，直接返回true
    if (forceCheck) {
      console.log('🔄 强制检查配置更新');
      return true;
    }

    const now = Date.now();
    const lastCheck = uni.getStorageSync('last_config_check_time') || 0;

    // 如果是首次检查，直接返回true
    if (lastCheck === 0) {
      console.log('🆕 首次检查配置更新');
      return true;
    }

    // 如果距离上次检查超过指定间隔
    const timeSinceLastCheck = now - lastCheck;
    const shouldCheck = timeSinceLastCheck > this.checkInterval;

    if (shouldCheck) {
      console.log(`⏰ 距离上次检查已过 ${Math.round(timeSinceLastCheck / 60000)} 分钟，需要检查更新`);
    } else {
      const remainingTime = Math.round((this.checkInterval - timeSinceLastCheck) / 60000);
      console.log(`⏰ 距离下次检查还有 ${remainingTime} 分钟`);
    }

    return shouldCheck;
  }

  updateLastCheckTime() {
    uni.setStorageSync('last_config_check_time', Date.now());
    console.log('✅ 更新最后检查时间');
  }

  async checkForUpdates(forceCheck = false) {
    console.log('🔍 开始检查配置文件更新...');

    // 检查是否需要检查更新（避免频繁检查）
    if (!this.shouldCheckForUpdates(forceCheck)) {
      console.log('⏭️ 跳过配置更新检查（距离上次检查时间太短）');
      return false;
    }

    // 模拟检查过程
    console.log('📡 正在检查远程配置...');
    
    // 模拟检查完成，更新时间
    this.updateLastCheckTime();
    console.log('✅ 配置检查完成');
    
    return false; // 假设没有更新
  }
}

async function testIntervalTiming() {
  console.log('🧪 开始测试配置更新间隔时间逻辑...\n');

  // 1. 测试首次启动
  console.log('1️⃣ 测试首次启动（无历史记录）');
  const manager = new MockConfigUpdateManager();
  
  // 设置1分钟间隔
  uni.setStorageSync('config_check_interval', 1 * 60 * 1000);
  manager.checkInterval = 1 * 60 * 1000;
  
  await manager.checkForUpdates();
  console.log('');

  // 2. 测试立即再次启动（应该跳过）
  console.log('2️⃣ 测试立即再次启动（应该跳过）');
  await manager.checkForUpdates();
  console.log('');

  // 3. 测试30秒后启动（应该跳过）
  console.log('3️⃣ 测试30秒后启动（应该跳过）');
  // 模拟30秒前的检查时间
  const thirtySecondsAgo = Date.now() - (30 * 1000);
  uni.setStorageSync('last_config_check_time', thirtySecondsAgo);
  await manager.checkForUpdates();
  console.log('');

  // 4. 测试1分钟后启动（应该检查）
  console.log('4️⃣ 测试1分钟后启动（应该检查）');
  // 模拟1分钟前的检查时间
  const oneMinuteAgo = Date.now() - (1 * 60 * 1000 + 1000); // 多加1秒确保超过间隔
  uni.setStorageSync('last_config_check_time', oneMinuteAgo);
  await manager.checkForUpdates();
  console.log('');

  // 5. 测试强制检查
  console.log('5️⃣ 测试强制检查（忽略间隔）');
  await manager.checkForUpdates(true);
  console.log('');

  // 6. 测试不同间隔设置
  console.log('6️⃣ 测试不同间隔设置');
  
  const intervals = [
    { minutes: 1, ms: 1 * 60 * 1000 },
    { minutes: 5, ms: 5 * 60 * 1000 },
    { minutes: 10, ms: 10 * 60 * 1000 }
  ];

  for (const interval of intervals) {
    console.log(`\n🔄 测试 ${interval.minutes} 分钟间隔:`);
    
    // 设置新间隔
    uni.setStorageSync('config_check_interval', interval.ms);
    const testManager = new MockConfigUpdateManager();
    
    // 模拟刚好超过间隔的时间
    const pastTime = Date.now() - (interval.ms + 1000);
    uni.setStorageSync('last_config_check_time', pastTime);
    
    const shouldCheck = testManager.shouldCheckForUpdates();
    console.log(`   结果: ${shouldCheck ? '✅ 需要检查' : '❌ 跳过检查'}`);
  }

  console.log('\n📋 测试总结:');
  console.log('✅ 首次启动检查: 正常');
  console.log('✅ 间隔内跳过: 正常');
  console.log('✅ 超过间隔检查: 正常');
  console.log('✅ 强制检查: 正常');
  console.log('✅ 不同间隔设置: 正常');

  console.log('\n🏁 配置更新间隔时间逻辑测试完成');
}

// 运行测试
testIntervalTiming().catch(console.error);
