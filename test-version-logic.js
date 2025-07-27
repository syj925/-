/**
 * 测试配置更新的版本比较逻辑
 * 验证是否正确实现版本检查而不是盲目更新
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testVersionLogic() {
  console.log('🧪 开始测试配置更新版本比较逻辑...\n');

  try {
    // 1. 检查当前服务器版本信息
    console.log('1️⃣ 检查当前服务器版本信息...');
    const versionResponse = await axios.get(`${BASE_URL}/api/config-version`);
    
    if (versionResponse.data.code === 0) {
      const serverVersion = versionResponse.data.data;
      console.log('✅ 服务器版本信息:');
      console.log(`   版本号: ${serverVersion.version}`);
      console.log(`   更新时间: ${serverVersion.updateTime}`);
      console.log(`   强制更新: ${serverVersion.forceUpdate}`);
      console.log(`   下载次数: ${serverVersion.downloadCount}`);
    } else {
      console.log('❌ 获取服务器版本失败');
      return;
    }

    // 2. 检查配置内容
    console.log('\n2️⃣ 检查配置内容...');
    const configResponse = await axios.get(`${BASE_URL}/api/content-rules`);
    
    if (configResponse.data.code === 0) {
      const config = configResponse.data.data;
      console.log('✅ 配置内容获取成功:');
      console.log(`   配置更新间隔: ${config.configUpdateInterval} 分钟`);
      console.log(`   最小帖子长度: ${config.minPostLength}`);
      console.log(`   最大帖子长度: ${config.maxPostLength}`);
    } else {
      console.log('❌ 获取配置内容失败');
    }

    // 3. 模拟版本比较逻辑
    console.log('\n3️⃣ 模拟版本比较逻辑...');
    
    const testCases = [
      { local: '1.0.0', remote: '1.0.0', expected: '相同版本，无需更新' },
      { local: '1.0.0', remote: '1.0.1', expected: '远程版本更新，需要更新' },
      { local: '1.0.1', remote: '1.0.0', expected: '本地版本更新，无需更新' },
      { local: '1.0.0', remote: '2.0.0', expected: '远程主版本更新，需要更新' },
      { local: null, remote: '1.0.0', expected: '无本地版本，需要下载' }
    ];

    function compareVersions(version1, version2) {
      if (!version1 || !version2) return version1 === version2 ? 0 : (version1 ? 1 : -1);
      
      const v1Parts = version1.split('.').map(Number);
      const v2Parts = version2.split('.').map(Number);
      
      const maxLength = Math.max(v1Parts.length, v2Parts.length);
      
      for (let i = 0; i < maxLength; i++) {
        const v1Part = v1Parts[i] || 0;
        const v2Part = v2Parts[i] || 0;
        
        if (v1Part < v2Part) return -1;
        if (v1Part > v2Part) return 1;
      }
      
      return 0;
    }

    function needsUpdate(localVersion, remoteVersion, forceUpdate = false) {
      // 如果没有本地版本，需要下载
      if (!localVersion) {
        return true;
      }

      // 版本比较
      const comparison = compareVersions(localVersion, remoteVersion);
      
      // 如果远程版本更新，需要更新
      if (comparison < 0) {
        return true;
      }

      // 如果版本相同，检查是否需要强制更新
      if (comparison === 0 && forceUpdate) {
        return true;
      }

      return false;
    }

    testCases.forEach((testCase, index) => {
      const result = needsUpdate(testCase.local, testCase.remote);
      const status = result ? '需要更新' : '无需更新';
      
      console.log(`   测试 ${index + 1}: 本地 ${testCase.local || 'null'} vs 远程 ${testCase.remote}`);
      console.log(`   结果: ${status} (期望: ${testCase.expected})`);
      
      const expectedNeedsUpdate = testCase.expected.includes('需要') || testCase.expected.includes('下载');
      const isCorrect = result === expectedNeedsUpdate;
      console.log(`   ${isCorrect ? '✅' : '❌'} ${isCorrect ? '正确' : '错误'}\n`);
    });

    // 4. 测试强制更新逻辑
    console.log('4️⃣ 测试强制更新逻辑...');
    
    const forceUpdateCases = [
      { local: '1.0.0', remote: '1.0.0', force: false, expected: false },
      { local: '1.0.0', remote: '1.0.0', force: true, expected: true },
      { local: '1.0.0', remote: '1.0.1', force: false, expected: true },
      { local: '1.0.0', remote: '1.0.1', force: true, expected: true }
    ];

    forceUpdateCases.forEach((testCase, index) => {
      const result = needsUpdate(testCase.local, testCase.remote, testCase.force);
      
      console.log(`   测试 ${index + 1}: 本地 ${testCase.local} vs 远程 ${testCase.remote}, 强制: ${testCase.force}`);
      console.log(`   结果: ${result ? '需要更新' : '无需更新'} (期望: ${testCase.expected ? '需要更新' : '无需更新'})`);
      
      const isCorrect = result === testCase.expected;
      console.log(`   ${isCorrect ? '✅' : '❌'} ${isCorrect ? '正确' : '错误'}\n`);
    });

    // 5. 检查实际的App行为
    console.log('5️⃣ 分析可能的问题原因...');
    
    console.log('🔍 可能导致"立刻强制更新"的原因:');
    console.log('   1. 本地版本为空或未正确保存');
    console.log('   2. 服务器设置了 forceUpdate: true');
    console.log('   3. 版本比较逻辑有bug');
    console.log('   4. 缓存清理导致本地版本丢失');
    console.log('   5. 时间间隔到了就检查，但检查后发现需要更新');

    console.log('\n💡 建议检查:');
    console.log('   1. App启动时的本地版本是什么');
    console.log('   2. 服务器返回的版本信息是什么');
    console.log('   3. 是否有强制更新标志');
    console.log('   4. 版本比较的具体结果');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }

  console.log('\n🏁 配置更新版本比较逻辑测试完成');
}

// 运行测试
testVersionLogic().catch(console.error);
