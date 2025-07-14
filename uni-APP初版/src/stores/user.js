/**
 * 用户状态管理
 */
import { reactive } from 'vue';
import api from '../utils/api.js';

// 用户状态
const state = reactive({
  user: null,
  token: null,
  isLoggedIn: false,
});

// 创建状态管理Store
export const useUserStore = () => {
  // 获取用户信息
  const getUserInfo = async () => {
    try {
      const token = uni.getStorageSync('token');
      if (!token) {
        return null;
      }
      
      const res = await api.auth.getInfo();
      if (res.success && res.data) {
        state.user = res.data;
        state.isLoggedIn = true;
        return res.data;
      }
      return null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  };
  
  // 设置用户信息
  const setUserInfo = (userInfo) => {
    state.user = userInfo;
    state.isLoggedIn = !!userInfo;
  };
  
  // 检查是否登录
  const isLoggedIn = () => {
    return !!state.user && !!uni.getStorageSync('token');
  };
  
  // 退出登录
  const logout = () => {
    state.user = null;
    state.isLoggedIn = false;
    uni.removeStorageSync('token');
  };
  
  return {
    // 状态
    user: state.user,
    isLoggedIn: state.isLoggedIn,
    
    // 方法
    getUserInfo,
    setUserInfo,
    isLoggedIn,
    logout
  };
};

export default useUserStore; 