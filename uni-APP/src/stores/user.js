/**
 * 用户状态管理 (Pinia Store)
 */
import { defineStore } from "pinia";
import api from "@/api";

export const useUserStore = defineStore("user", {
  // 状态
  state: () => ({
    token: uni.getStorageSync("token") || null,
    userInfo: null,
  }),

  // Getters
  getters: {
    // 判断是否已登录
    isLoggedIn() {
      return !!this.token;
    },
    // 安全地获取用户信息，避免在组件中出现null错误
    safeUserInfo() {
      return (
        this.userInfo || {
          nickname: "游客",
          avatar: "/static/images/common/default-avatar.png",
          // 可以根据需要添加其他默认字段
        }
      );
    },
  },

  // Actions
  actions: {
    // 登录成功后调用的Action
    loginSuccess(payload) {
      const { token, userInfo } = payload;
      this.token = token;
      this.userInfo = userInfo;
      // 虽然持久化插件会自动处理，但为保险起见，也手动写入一次关键的token
      uni.setStorageSync("token", token);
    },

    // 从API获取用户个人资料
    async fetchUserProfile() {
      if (!this.isLoggedIn) {
        console.warn("用户未登录，无法获取个人资料。");
        return;
      }
      try {
        const res = await api.user.getInfo();
        if (res.code === 0 || res.code === 200) {
          this.userInfo = res.data;
          return res.data;
        } else {
          // Token可能已失效，触发登出
          this.logout();
          throw new Error("获取用户资料失败，Token可能已失效。");
        }
      } catch (error) {
        console.error("获取用户资料时出错:", error);
        // 网络错误时不应清除缓存的用户信息，以保证离线可用性
        // 如果需要，可以在这里添加错误上报逻辑
      }
    },

    // 登出时清空用户状态
    logout() {
      this.token = null;
      this.userInfo = null;
      uni.removeStorageSync("token");
      // 触发一个全局事件，通知其他部分（如WebSocket）断开连接
      uni.$emit("userLoggedOut");
    },

    // 更新部分用户信息（例如编辑资料后）
    updateUserInfo(partialUserInfo) {
      if (this.userInfo) {
        this.userInfo = { ...this.userInfo, ...partialUserInfo };
      }
    },
  },

  // 配置 pinia-plugin-persistedstate
  persist: {
    enabled: true,
    strategies: [
      {
        key: "user-store", // 持久化存储的key
        storage: {
          getItem: (key) => uni.getStorageSync(key),
          setItem: (key, value) => uni.setStorageSync(key, value),
          removeItem: (key) => uni.removeStorageSync(key),
        },
        paths: ["token", "userInfo"], // 指定需要持久化的state属性
      },
    ],
  },
});
