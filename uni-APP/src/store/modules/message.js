/**
 * 消息状态管理
 */
import { defineStore } from 'pinia';
import { messageApi } from '@/api';
import wsClient from '@/utils/websocket';

export const useMessageStore = defineStore('message', {
  state: () => ({
    unreadCount: 0,
    wsClient: null,
    isConnected: false,
    refreshTrigger: 0, // 用于触发页面刷新的时间戳
    lastNewMessage: null // 最新收到的消息
  }),

  actions: {
    /**
     * 获取未读消息数量
     */
    async fetchUnreadCount() {
      try {
        const result = await messageApi.getUnreadCount();
        if (result.success || result.code === 0) {
          this.unreadCount = result.data.count || 0;
          this.updateTabBarBadge();
        }
      } catch (error) {
        console.error('获取未读数量失败:', error);
      }
    },

    /**
     * 更新未读消息数量
     * @param {Number} change 变化量
     */
    updateUnreadCount(change) {
      this.unreadCount = Math.max(0, this.unreadCount + change);
      this.updateTabBarBadge();
    },

    /**
     * 设置未读消息数量
     * @param {Number} count 数量
     */
    setUnreadCount(count) {
      this.unreadCount = Math.max(0, count);
      this.updateTabBarBadge();
    },

    /**
     * 更新TabBar徽章显示
     */
    updateTabBarBadge() {
      try {
        // H5环境兼容性处理：uni.$nextTick在H5下不存在
        const nextTick = typeof uni.$nextTick === 'function' ? uni.$nextTick : (cb) => setTimeout(cb, 0);
        nextTick(() => {
          if (this.unreadCount > 0) {
            uni.setTabBarBadge({
              index: 3, // 消息tab的索引
              text: this.unreadCount > 99 ? '99+' : String(this.unreadCount),
              success: () => {
                console.log(`🔴 TabBar徽章已设置: ${this.unreadCount}`);
              },
              fail: (err) => {
                // H5环境在非TabBar页面会失败，忽略此错误
                console.log('TabBar徽章设置失败（可能不在TabBar页面）:', err.errMsg);
              }
            });
          } else {
            uni.removeTabBarBadge({
              index: 3,
              success: () => {
                console.log('✅ TabBar徽章已移除');
              },
              fail: (err) => {
                // H5环境在非TabBar页面会失败，忽略此错误
                console.log('TabBar徽章移除失败（可能不在TabBar页面）:', err.errMsg);
              }
            });
          }
        });
      } catch (error) {
        // 捕获所有TabBar操作错误，避免影响其他功能
        console.log('TabBar徽章操作异常:', error);
      }
    },

    /**
     * 初始化WebSocket连接
     */
    async initWebSocket() {
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          console.log('用户未登录，跳过WebSocket连接');
          return;
        }

        if (this.wsClient) {
          this.disconnectWebSocket();
        }

        this.wsClient = wsClient;
        
        // 监听未读数量更新（优先使用这个精确的计数）
        this.wsClient.on('unread_count', (data) => {
          console.log('📊 收到精确未读计数更新:', data.count);
          this.setUnreadCount(data.count);
        });

        // 监听新消息（只负责页面刷新，不更新计数）
        this.wsClient.on('new_message', (data) => {
          console.log('🔔 收到新消息WebSocket通知:', data);
          
          // 🚀 使用uni-app全局事件机制通知页面刷新
          this.notifyPageRefresh(data.message);
          
          // 不在这里更新未读计数，等待unread_count事件的精确计数
        });

        // 监听连接状态
        this.wsClient.on('connected', () => {
          this.isConnected = true;
          console.log('全局WebSocket连接成功');
        });

        this.wsClient.on('disconnected', () => {
          this.isConnected = false;
          console.log('全局WebSocket连接断开');
        });

        // 连接WebSocket
        await this.wsClient.connect(token);

      } catch (error) {
        console.error('全局WebSocket连接失败:', error);
      }
    },

    /**
     * 通知页面刷新（使用uni-app全局事件）
     * @param {Object} newMessage 新收到的消息
     */
    notifyPageRefresh(newMessage) {
      console.log('🔄 通知页面刷新:', newMessage.type, newMessage.content);
      
      // 使用uni-app全局事件通知所有监听的页面
      uni.$emit('messageReceived', {
        message: newMessage,
        timestamp: Date.now()
      });
      
      // 保留store状态更新（用于其他逻辑）
      this.lastNewMessage = newMessage;
      this.refreshTrigger = Date.now();
    },

    /**
     * 断开WebSocket连接
     */
    disconnectWebSocket() {
      if (this.wsClient) {
        this.wsClient.disconnect();
        this.isConnected = false;
      }
    },

    /**
     * 重置消息状态（用户登出时）
     */
    reset() {
      this.unreadCount = 0;
      this.disconnectWebSocket();
      uni.removeTabBarBadge({
        index: 3
      });
    }
  }
});