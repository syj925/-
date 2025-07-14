<template>
  <view class="network-status-container" v-if="showStatus">
    <view class="network-status-bar" :class="statusClass">
      <view class="status-icon">
        <image :src="statusIcon" mode="aspectFit" class="status-icon-img"></image>
      </view>
      <view class="status-text">{{ statusText }}</view>
      <view class="retry-button" v-if="canRetry" @tap="retryConnection">
        <text>重试</text>
      </view>
    </view>
  </view>
</template>

<script>
import { useAppStore } from '@/stores/appStore.js';
import config from '@/utils/config.js';

export default {
  name: 'NetworkStatus',
  data() {
    return {
      networkStatus: {
        isConnected: true,
        networkType: 'unknown'
      },
      apiAvailable: null,
      offlineMode: false
    };
  },
  computed: {
    showStatus() {
      // 如果网络已断开或API不可用，则显示状态条
      return !this.networkStatus.isConnected || this.apiAvailable === false || this.offlineMode;
    },
    statusClass() {
      if (!this.networkStatus.isConnected) {
        return 'disconnected';
      } else if (this.apiAvailable === false) {
        return 'api-unavailable';
      } else if (this.offlineMode) {
        return 'offline-mode';
      }
      return '';
    },
    statusText() {
      if (!this.networkStatus.isConnected) {
        return '网络连接已断开';
      } else if (this.apiAvailable === false) {
        return '服务器连接失败';
      } else if (this.offlineMode) {
        return '离线模式';
      }
      return '';
    },
    statusIcon() {
      if (!this.networkStatus.isConnected) {
        return '/static/icons/wifi-off.png';
      } else if (this.apiAvailable === false) {
        return '/static/icons/server-off.png';
      } else if (this.offlineMode) {
        return '/static/icons/cloud-off.png';
      }
      return '';
    },
    canRetry() {
      return this.networkStatus.isConnected && (this.apiAvailable === false || this.offlineMode);
    }
  },
  created() {
    // 安全地初始化网络状态
    try {
      this.safeInit();
    } catch (err) {
      console.error('NetworkStatus组件初始化错误:', err);
    }
    
    // 监听网络状态变化
    uni.$on('offlineModeChanged', this.updateOfflineStatus);
  },
  beforeUnmount() {
    // 移除事件监听
    uni.$off('offlineModeChanged', this.updateOfflineStatus);
  },
  methods: {
    // 安全初始化
    safeInit() {
      try {
        // 从Pinia store获取状态
        const appStore = useAppStore();
        if (appStore) {
          this.networkStatus = appStore.network || { isConnected: true, networkType: 'unknown' };
          this.apiAvailable = appStore.apiAvailable;
          this.offlineMode = appStore.offlineMode;
          
          console.log('NetworkStatus组件初始化成功:', 
            this.networkStatus.isConnected ? '已连接' : '已断开', 
            'API:', this.apiAvailable === null ? '未知' : this.apiAvailable ? '可用' : '不可用',
            '离线模式:', this.offlineMode ? '开启' : '关闭'
          );
        } else {
          console.warn('NetworkStatus: store未初始化，使用默认值');
        }
      } catch (err) {
        console.error('NetworkStatus安全初始化失败:', err);
        // 设置默认值
        this.networkStatus = { isConnected: true, networkType: 'unknown' };
        this.apiAvailable = null;
        this.offlineMode = false;
      }
    },
    updateOfflineStatus(event) {
      try {
        this.offlineMode = event.enabled;
      } catch (err) {
        console.error('更新离线状态失败:', err);
      }
    },
    retryConnection() {
      // 添加振动反馈
      try {
        uni.vibrateShort();
      } catch (e) {
        console.warn('振动反馈不可用:', e);
      }
      
      // 先检查网络状态
      uni.getNetworkType({
        success: (res) => {
          if (res.networkType === 'none') {
            uni.showToast({
              title: '请先连接网络',
              icon: 'none'
            });
            return;
          }
          
          // 更新网络状态
          const appStore = useAppStore();
          if (appStore) {
            appStore.setNetworkStatus({
              isConnected: res.networkType !== 'none',
              networkType: res.networkType
            });
          } else {
            this.networkStatus = {
              isConnected: res.networkType !== 'none',
              networkType: res.networkType
            };
          }
          
          // 显示加载中
          uni.showLoading({
            title: '正在连接...'
          });
          
          // 尝试连接API
          uni.request({
            url: `${config.BASE_API_URL || ''}/health`,
            timeout: 5000,
            success: () => {
              // API可用
              const appStore = useAppStore();
              if (appStore) {
                appStore.setApiAvailability(true);
                appStore.setOfflineMode(false);
              } else {
                this.apiAvailable = true;
                this.offlineMode = false;
              }
              
              uni.hideLoading();
              uni.showToast({
                title: '已恢复在线模式',
                icon: 'success'
              });
            },
            fail: () => {
              uni.hideLoading();
              uni.showToast({
                title: '服务器连接失败',
                icon: 'none'
              });
            }
          });
        },
        fail: () => {
          uni.showToast({
            title: '网络状态检测失败',
            icon: 'none'
          });
        }
      });
    }
  }
}
</script>

<style scoped>
.network-status-container {
  position: fixed;
  top: var(--status-bar-height, 20px);
  left: 0;
  right: 0;
  z-index: 999;
  padding: 0 8px;
}

.network-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  animation: slide-down 0.3s ease-out;
}

.disconnected {
  background-color: #FF2B2B;
  color: white;
}

.api-unavailable {
  background-color: #FFB703;
  color: #333;
}

.offline-mode {
  background-color: #909399;
  color: white;
}

.status-icon {
  width: 18px;
  height: 18px;
  margin-right: 8px;
}

.status-icon-img {
  width: 100%;
  height: 100%;
}

.status-text {
  flex: 1;
  font-weight: 500;
}

.retry-button {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

@keyframes slide-down {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
