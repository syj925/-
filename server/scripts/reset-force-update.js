/**
 * 重置强制更新标志的脚本
 * 用于将当前版本的 forceUpdate 设置为 false
 */

const axios = require('axios');

async function resetForceUpdate() {
  try {
    console.log('🔧 开始重置强制更新标志...');

    // 1. 获取当前版本信息
    const versionResponse = await axios.get('http://localhost:3000/api/config-version');
    const currentVersion = versionResponse.data.data;
    
    console.log('📋 当前版本信息:');
    console.log(`版本: ${currentVersion.version}`);
    console.log(`强制更新: ${currentVersion.forceUpdate}`);
    console.log(`下载次数: ${currentVersion.downloadCount}`);

    if (!currentVersion.forceUpdate) {
      console.log('✅ 强制更新标志已经是 false，无需重置');
      return;
    }

    // 2. 直接通过数据库更新（需要后端支持）
    // 这里我们创建一个新版本，但保持相同的版本号，只是将 forceUpdate 设为 false
    
    console.log('🔄 正在重置强制更新标志...');
    
    // 注意：这个操作需要管理员权限，在实际环境中应该通过管理后台进行
    console.log('⚠️  需要通过管理后台或直接数据库操作来重置强制更新标志');
    console.log('💡 建议操作：');
    console.log('1. 登录管理后台');
    console.log('2. 发布一个新版本（如 1.0.3），将强制更新设为 false');
    console.log('3. 或者直接在数据库中修改 configVersion 设置');

  } catch (error) {
    console.error('❌ 重置过程中发生错误:', error.message);
  }
}

// 运行重置
resetForceUpdate().catch(console.error);
