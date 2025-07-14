/**
 * 广播帖子状态变更到全局store和UI组件
 */
function broadcastStateChanges() {
  console.log('=== 开始广播状态变化 ===');
  const start = Date.now();
  
  try {
    // 获取所有全局缓存的状态
    const allStates = Array.from(globalPostStateMap.entries());
    const allCollectStates = Array.from(collectStateMap.entries());
    
    if (allStates.length === 0 && allCollectStates.length === 0) {
      console.log('没有缓存的状态可广播');
      return;
    }
    
    console.log(`广播 ${allStates.length} 个帖子状态, ${allCollectStates.length} 个收藏状态`);
    
    // 更新全局store中的所有状态
    allStates.forEach(([postId, status]) => {
      // 确保状态包含必要的字段
      if (status) {
        // 确保收藏状态与专用映射一致
        if (collectStateMap.has(postId)) {
          const collectState = collectStateMap.get(postId);
          if (status.isCollected !== collectState) {
            console.log(`修正帖子 ${postId} 的收藏状态: ${status.isCollected} -> ${collectState}`);
            status.isCollected = collectState;
          }
        }
        
        // 更新到store
        store.mutations.updatePostStatus(postId, {
          ...status,
          _timestamp: Date.now()
        });
        
        console.log(`广播帖子 ${postId} 状态: 点赞=${status.isLiked}, 收藏=${status.isCollected}`);
      }
    });
    
    // 处理仅在收藏映射中存在的状态
    allCollectStates.forEach(([postId, isCollected]) => {
      if (!globalPostStateMap.has(postId)) {
        console.log(`仅收藏映射中存在的帖子 ${postId}, 收藏状态=${isCollected}`);
        
        // 创建最小状态对象
        const minimalState = { isCollected };
        
        // 添加到全局映射
        globalPostStateMap.set(postId, minimalState);
        
        // 更新到store
        store.mutations.updatePostStatus(postId, {
          ...minimalState,
          _timestamp: Date.now()
        });
      }
    });
    
    // 递增全局状态版本号
    globalStateVersion++;
    console.log(`全局状态版本号更新为: ${globalStateVersion}`);
    
    // 尝试保存全局状态到本地存储
    try {
      // 创建状态对象
      const stateSnapshot = {};
      globalPostStateMap.forEach((state, id) => {
        // 确保状态包含所有必要字段
        stateSnapshot[id] = {
          isLiked: state.isLiked,
          isCollected: state.isCollected,
          likes: state.likes,
          collections: state.collections
        };
      });
      
      // 创建收藏状态对象
      const collectSnapshot = {};
      collectStateMap.forEach((isCollected, id) => {
        collectSnapshot[id] = isCollected;
      });
      
      // 更新时间戳并保存
      const globalState = {
        version: globalStateVersion,
        timestamp: Date.now(),
        states: stateSnapshot,
        collectStates: collectSnapshot
      };
      
      // 保存到存储
      uni.setStorageSync('global_post_states', JSON.stringify(globalState));
      
      console.log(`已保存全局状态到存储: ${Object.keys(stateSnapshot).length} 个状态, ${Object.keys(collectSnapshot).length} 个收藏状态`);
    } catch (e) {
      console.error('保存全局状态失败:', e);
    }
  } catch (e) {
    console.error('广播状态变化失败:', e);
    return { success: false, error: e, reason: '状态广播失败' };
  } finally {
    console.log(`=== 广播状态变化耗时: ${Date.now() - start}ms ===`);
  }
}

export default broadcastStateChanges; 