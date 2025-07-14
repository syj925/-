import api from '../../utils/api.js';
import store from '../../utils/store.js';
import postActions from '../../utils/postActions.js';
import interactionActions from '../../utils/interactionActions.js';

methods: {
  async register() {
    // 原有注册逻辑
    // ... existing code ...
    
    // 注册成功处理
    if (result.success) {
      console.log('注册成功，保存用户信息');
      // 保存token和用户信息
      uni.setStorageSync('token', result.data.token);
      uni.setStorageSync('user', JSON.stringify(result.data.user));
      store.mutations.setUser(result.data.user);
      store.mutations.setToken(result.data.token);
      
      // 新增：注册成功后初始化用户状态
      try {
        console.log('开始初始化新用户互动状态');
        
        // 初始化各类状态容器
        await postActions.loadPostStatusesFromStorage();
        await interactionActions.restoreInteractionStates();
        
        // 强制刷新全局状态
        postActions.broadcastStateChanges();
        interactionActions.broadcastStateChanges();
      } catch (error) {
        console.error('初始化新用户互动状态失败:', error);
      }
      
      // 显示成功提示并跳转
      uni.showToast({
        title: '注册成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          setTimeout(() => {
            uni.switchTab({ url: '/pages/index/index' });
          }, 500);
        }
      });
    } else {
      // 注册失败处理
      // ... existing code ...
    }
  },
  
  // ... existing code ...
} 