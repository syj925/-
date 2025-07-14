/**
 * 从本地存储恢复全局帖子状态
 * @returns {Object} 恢复结果
 */
function restoreGlobalState() {
  console.log('=== 开始恢复全局帖子状态 ===');
  const start = Date.now();
  
  try {
    // 尝试从存储中读取全局状态
    const storedState = uni.getStorageSync('global_post_states');
    if (!storedState) {
      console.log('没有找到存储的全局状态');
      return { success: false, reason: '无存储状态' };
    }
    
    // 解析状态
    const globalState = JSON.parse(storedState);
    if (!globalState || !globalState.states) {
      console.log('存储的全局状态格式无效');
      return { success: false, reason: '状态格式无效' };
    }
    
    // 恢复版本号
    if (globalState.version) {
      globalStateVersion = globalState.version;
      console.log(`恢复全局状态版本号: ${globalStateVersion}`);
    }
    
    // 恢复帖子状态
    let statesCount = 0;
    if (globalState.states) {
      Object.entries(globalState.states).forEach(([postId, state]) => {
        if (postId && state) {
          globalPostStateMap.set(postId, state);
          statesCount++;
        }
      });
    }
    
    // 恢复收藏状态
    let collectCount = 0;
    if (globalState.collectStates) {
      Object.entries(globalState.collectStates).forEach(([postId, isCollected]) => {
        if (postId !== undefined) {
          collectStateMap.set(postId, isCollected);
          collectCount++;
        }
      });
    }
    
    console.log(`已恢复 ${statesCount} 个帖子状态和 ${collectCount} 个收藏状态`);
    return { success: true, statesCount, collectCount };
  } catch (e) {
    console.error('恢复全局状态失败:', e);
    return { success: false, error: e, reason: '存储访问失败' };
  } finally {
    console.log(`=== 恢复全局状态耗时: ${Date.now() - start}ms ===`);
  }
}

export default restoreGlobalState; 