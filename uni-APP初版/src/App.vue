<script>
import CustomTabBar from './custom-tab-bar/index.vue'
import api from './utils/api.js'
import config from './utils/config.js'
import NetworkStatus from './components/NetworkStatus.vue'
import { useAppStore } from './stores/appStore.js'

export default {
  components: {
    CustomTabBar,
    NetworkStatus
  },
  globalData: {
    needRefreshPostList: false
  },
  onLaunch: function () {
    try {
      console.log('App启动')
      
      // 创建Pinia store实例
      this.store = useAppStore()
      
      // 设置全局错误捕获
      // #ifdef APP-PLUS
      const originalError = console.error;
      console.error = function(...args) {
        // 记录错误
        console.log('应用错误:', JSON.stringify(args))
        // 调用原始方法
        return originalError.apply(console, args);
      };

      // 使用uni-app API捕获错误，替换window.addEventListener
      uni.onError((err) => {
        console.log('全局错误:', err);
        // 添加全局错误处理
        this.handleGlobalError(err);
      });
      
      // 监听网络状态变化
      uni.onNetworkStatusChange((res) => {
        console.log('网络状态变化:', res.isConnected ? '已连接' : '已断开', res.networkType);
        this.store.setNetworkStatus({
          isConnected: res.isConnected,
          networkType: res.networkType
        });
        
        // 如果网络恢复，尝试重新连接后端
        if (res.isConnected && !this.store.isApiAvailable) {
          this.healthCheck();
        }
      });
      
      // 在Android平台特别处理
      const sysInfo = uni.getSystemInfoSync();
      if (sysInfo.platform === 'android') {
        console.log('当前为Android平台，添加额外兼容性处理');
        
        // Android平台下添加额外的错误防护
        try {
          // 初始化关键状态
          if (!this.store.network.isConnected) {
            this.store.setNetworkStatus({
              isConnected: true,
              networkType: 'unknown'
            });
          }
        } catch (e) {
          console.error('Android平台初始化错误:', e);
        }
      }
      // #endif
      
      // 获取初始网络状态
      uni.getNetworkType({
        success: (res) => {
          console.log('初始网络状态:', res.networkType);
          this.store.setNetworkStatus({
            isConnected: res.networkType !== 'none',
            networkType: res.networkType
          });
        },
        fail: (err) => {
          console.error('获取网络状态失败:', err);
          // 默认设置为已连接，避免过早进入离线模式
          this.store.setNetworkStatus({
            isConnected: true,
            networkType: 'unknown'
          });
        }
      });
      
      // 延迟执行可能需要权限的操作
      setTimeout(() => {
        this.safeInit();
      }, 500);
    } catch (err) {
      console.log('应用启动错误:', err)
      // 错误恢复处理
      try {
        // 确保网络状态至少有默认值
        if (!this.store?.network) {
          this.store = useAppStore()
          this.store.setNetworkStatus({
            isConnected: true,
            networkType: 'unknown'
          });
        }
        
        // 如果是致命错误，显示友好提示
        uni.showToast({
          title: '应用初始化遇到问题，部分功能可能不可用',
          icon: 'none',
          duration: 3000
        });
      } catch (e) {
        console.error('错误恢复失败:', e);
      }
    }
  },
  onShow: function () {
    // App显示
    console.log('App显示')
  },
  onHide: function () {
    // App隐藏
    console.log('App隐藏')
  },
  methods: {
    // 安全初始化 - 延迟执行可能需要权限的操作
    safeInit() {
      try {
        // 检查登录状态
        this.checkLoginStatus()
        // 健康检查
        this.healthCheck()
      } catch (err) {
        console.log('安全初始化错误:', err)
      }
    },
    
    // 检查登录状态
    checkLoginStatus() {
      try {
        // 通过获取token判断用户是否已登录
        const token = uni.getStorageSync('token');
        if (token) {
          // 设置token到store
          this.store.setToken(token);
          // 获取用户信息
          this.getUserInfo();
        } else {
          // 清除可能存在的无效用户数据
          this.store.clearUserData();
          // 触发用户信息准备完成事件（未登录状态）
          uni.$emit('userInfoReady', { loggedIn: false });
        }
      } catch (err) {
        console.log('检查登录状态错误:', err)
        // 出错时默认为未登录状态
        uni.$emit('userInfoReady', { loggedIn: false, error: err });
      }
    },
    
    // 获取用户信息
    getUserInfo() {
      api.auth.getInfo()
        .then(res => {
          if (res.success) {
            // 更新用户信息到全局状态
            const userData = res.data.user || res.data;
            
            // 确保userData有效
            if (userData && userData.id) {
              this.store.setUser(userData);
            } else {
              this.store.clearUserData();
            }
            
            // 触发用户信息准备完成事件
            uni.$emit('userInfoReady', { loggedIn: true, userInfo: userData });
          } else {
            // 清除无效登录状态
            this.store.clearUserData();
            // 触发用户信息准备完成事件（获取失败）
            uni.$emit('userInfoReady', { loggedIn: false, error: '获取用户信息失败' });
          }
        })
        .catch(err => {
          console.error('获取用户信息出错', err);
          // 清除无效登录状态
          this.store.clearUserData();
          // 触发用户信息准备完成事件（获取出错）
          uni.$emit('userInfoReady', { loggedIn: false, error: err });
        })
    },
    
    // 健康检查
    healthCheck() {
      // 使用统一的方式进行健康检查，不区分平台
      try {
        // 使用更安全的方式检查API连接
        uni.request({
          url: `${config.BASE_API_URL}/health`,
          method: 'GET',
          timeout: 5000,
          success: (res) => {
            console.log('API服务正常');
            // 更新API可用性状态
            this.store.setApiAvailability(true);
          },
          fail: (err) => {
            console.log('API健康检查失败:', err);
            // 更新API可用性状态
            this.store.setApiAvailability(false);
            
            // 设置离线模式
            this.store.setOfflineMode(true);
            
            // 显示轻提示
            uni.showToast({
              title: '服务器连接失败，进入离线模式',
              icon: 'none',
              duration: 3000
            });
          }
        });
      } catch (err) {
        console.log('健康检查错误:', err);
        // 默认设置为不可用
        this.store.setApiAvailability(false);
      }
    },
    handleGlobalError(err) {
      console.log('处理全局错误:', err);
      
      // 判断是否为网络错误
      if (err && (
        err.includes && (
          err.includes('network') || 
          err.includes('网络') || 
          err.includes('timeout') || 
          err.includes('超时')
        ) || (
          err.message && (
            err.message.includes('network') || 
            err.message.includes('网络') || 
            err.message.includes('timeout') || 
            err.message.includes('超时')
          )
        )
      )) {
        console.log('检测到网络错误，可能需要切换到离线模式');
        // 检查网络连接
        uni.getNetworkType({
          success: (res) => {
            if (res.networkType === 'none') {
              // 网络已断开
              this.store.setNetworkStatus({
                isConnected: false,
                networkType: 'none'
              });
            }
            // 设置离线模式
            this.store.setOfflineMode(true);
          }
        });
      }
    }
  }
}
</script>

<template>
  <view>
    <!-- 页面内容区域 -->
    <view class="content">
      <slot></slot>
    </view>
    <!-- 自定义TabBar组件 -->
    <CustomTabBar></CustomTabBar>
    <NetworkStatus></NetworkStatus>
  </view>
</template>

<style>
/* 导入全局样式文件 */
@import './styles/global.css';

/* 全局基础样式设置 */
page {
  background-color: var(--secondary-color);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 16px;
  color: var(--text-color);
  line-height: 1.5;
  -webkit-transform-style: preserve-3d;
  transform-style: preserve-3d;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

/* 定义主题颜色变量 */
:root {
  /* 主色系 */
  --primary-color: #4A90E2;
  --primary-color-light: #75B5FF;
  --primary-color-dark: #3A7BC8;

  /* 功能色 */
  --success-color: #09BE4F;
  --warning-color: #FFB703;
  --error-color: #FF2B2B;
  --info-color: #909399;

  /* 文本颜色 */
  --text-color: #181818;
  --text-color-secondary: #909399;
  --text-color-disabled: #C0C0C0;

  /* 背景颜色 */
  --background-color: #FFFFFF;
  --secondary-color: #F7F8FC;

  /* 边框颜色 */
  --border-color: #EBEEF5;
  --border-color-light: #F2F2F2;

  /* 阴影效果 */
  --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  --header-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --button-shadow: 0 4px 10px rgba(74, 144, 226, 0.3);
  --button-shadow-active: 0 2px 5px rgba(74, 144, 226, 0.2);
  --floating-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  --input-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);

  /* 边框圆角 */
  --border-radius: 12rpx;
  --border-radius-sm: 8rpx;
  --border-radius-lg: 16rpx;
  --border-radius-pill: 100rpx;

  /* 过渡效果 */
  --transition-fast: 0.2s;
  --transition-normal: 0.3s;
  --transition-slow: 0.4s;

  /* 动画曲线 */
  --ease-in-out: cubic-bezier(0.645, 0.045, 0.355, 1);
  --ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 主题颜色渐变 */
.primary-gradient {
  background: linear-gradient(120deg, var(--primary-color-light), var(--primary-color));
}

/* 美化滚动条 (仅在H5端生效) */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(144, 147, 153, 0.3);
  border-radius: 6px;
}

::-webkit-scrollbar-track {
  background-color: transparent;
}

/* 关闭iOS点击元素时的半透明灰色背景 */
* {
  -webkit-tap-highlight-color: transparent;
}

/* 全局公共样式 */
page {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 卡片样式 */
.card {
  background-color: #FFFFFF;
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: 16px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  border: 1px solid rgba(74, 144, 226, 0.05);
  backdrop-filter: blur(10px);
}

.card:active {
  transform: translateY(2px);
  box-shadow: 0 5px 10px rgba(74, 144, 226, 0.05);
}

/* 按钮样式 */
.btn {
  background: var(--primary-gradient);
  color: var(--text-color-light);
  border-radius: 24px;
  padding: 12px 24px;
  border: none;
  font-weight: 600;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: var(--button-shadow);
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.btn:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0));
  z-index: -1;
  transform: translateY(-100%);
  transition: transform 0.3s ease;
}

.btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 5px rgba(74, 144, 226, 0.2);
}

.btn:active:before {
  transform: translateY(0);
}

/* 内容容器 */
.container {
  padding: 16px;
}

/* 过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 文本溢出省略 */
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 标题样式 */
.title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 15px;
  background: linear-gradient(to right, var(--primary-color), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

/* 标签样式 */
.tag {
  display: inline-block;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 12px;
  background-color: rgba(74, 144, 226, 0.1);
  color: var(--primary-color);
  margin-right: 6px;
}

/* 分割线 */
.divider {
  height: 1px;
  background: linear-gradient(to right, rgba(74, 144, 226, 0.05), rgba(74, 144, 226, 0.2), rgba(74, 144, 226, 0.05));
  margin: 15px 0;
}

/* 半透明背景区域 */
.glass-panel {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: var(--border-radius);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.08);
}

/* 间距辅助类 */
.mt-10 { margin-top: 10px; }
.mb-10 { margin-bottom: 10px; }
.ml-10 { margin-left: 10px; }
.mr-10 { margin-right: 10px; }
.p-10 { padding: 10px; }
.p-15 { padding: 15px; }
.p-20 { padding: 20px; }

/* 重置图片和图标渲染 */
image, 
.category-icon,
.back-icon,
.search-icon,
.category-icon-box {
  /* 修复图标显示问题 */
  will-change: transform;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

/* 优化页面过渡效果 */
.uni-page-head,
.uni-tabbar {
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  z-index: 999;
  position: relative;
}
</style>
