<template>
  <view class="settings-page">
    <!-- 顶部导航栏 -->
    <view class="page-header">
      <view class="header-left" @tap="goBack">
        <text class="iconfont icon-back"></text>
      </view>
      <view class="header-title">设置</view>
      <view class="header-right"></view>
    </view>
    
    <!-- 设置列表 -->
    <scroll-view scroll-y class="settings-content">
      <!-- 账户与安全 -->
      <view class="settings-section">
        <view class="section-title">账户与安全</view>
        
        <view class="settings-item" @tap="navigateTo('/pages/profile/edit')">
          <text class="item-label">编辑个人资料</text>
          <text class="iconfont icon-right"></text>
        </view>
        
        <view class="settings-item" @tap="navigateTo('/pages/profile/change-password')">
          <text class="item-label">修改密码</text>
          <text class="iconfont icon-right"></text>
        </view>
        
        <view class="settings-item" @tap="navigateTo('/pages/profile/privacy-settings')">
          <text class="item-label">隐私设置</text>
          <text class="iconfont icon-right"></text>
        </view>
      </view>
      
      <!-- 通知设置 -->
      <view class="settings-section">
        <view class="section-title">通知设置</view>
        
        <view class="settings-item">
          <text class="item-label">消息通知</text>
          <switch :checked="settings.notifications.message" @change="toggleSetting('notifications.message')" color="#2b85e4" />
        </view>
        
        <view class="settings-item">
          <text class="item-label">点赞通知</text>
          <switch :checked="settings.notifications.like" @change="toggleSetting('notifications.like')" color="#2b85e4" />
        </view>
        
        <view class="settings-item">
          <text class="item-label">评论通知</text>
          <switch :checked="settings.notifications.comment" @change="toggleSetting('notifications.comment')" color="#2b85e4" />
        </view>
        
        <view class="settings-item">
          <text class="item-label">关注通知</text>
          <switch :checked="settings.notifications.follow" @change="toggleSetting('notifications.follow')" color="#2b85e4" />
        </view>
      </view>
      
      <!-- 应用设置 -->
      <view class="settings-section">
        <view class="section-title">应用设置</view>
        
        <view class="settings-item">
          <text class="item-label">深色模式</text>
          <switch :checked="settings.app.darkMode" @change="toggleSetting('app.darkMode')" color="#2b85e4" />
        </view>
        
        <view class="settings-item">
          <text class="item-label">自动播放视频</text>
          <switch :checked="settings.app.autoPlayVideo" @change="toggleSetting('app.autoPlayVideo')" color="#2b85e4" />
        </view>
        
        <view class="settings-item" @tap="clearCache">
          <text class="item-label">清除缓存</text>
          <text class="item-value">{{ cacheSize }}</text>
        </view>
        
        <view class="settings-item" @tap="navigateTo('/pages/settings/server')">
          <text class="item-label">服务器设置</text>
          <text class="iconfont icon-right"></text>
        </view>
      </view>
      
      <!-- 关于 -->
      <view class="settings-section">
        <view class="section-title">关于</view>
        
        <view class="settings-item" @tap="navigateTo('/pages/about/index')">
          <text class="item-label">关于我们</text>
          <text class="iconfont icon-right"></text>
        </view>
        
        <view class="settings-item" @tap="navigateTo('/pages/about/feedback')">
          <text class="item-label">意见反馈</text>
          <text class="iconfont icon-right"></text>
        </view>
        
        <view class="settings-item" @tap="checkUpdate">
          <text class="item-label">检查更新</text>
          <text class="item-value">{{ appVersion }}</text>
        </view>
      </view>
      
      <button class="logout-btn" @tap="logout">退出登录</button>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      settings: {
        notifications: {
          message: true,
          like: true,
          comment: true,
          follow: true
        },
        app: {
          darkMode: false,
          autoPlayVideo: true
        }
      },
      cacheSize: '0MB',
      appVersion: 'v1.0.0'
    };
  },
  
  onLoad() {
    // 加载用户设置
    this.loadSettings();
    
    // 获取缓存大小
    this.getCacheSize();
    
    // 获取应用版本
    this.getAppVersion();
  },
  
  methods: {
    // 加载用户设置
    loadSettings() {
      try {
        const savedSettings = uni.getStorageSync('user_settings');
        if (savedSettings) {
          this.settings = JSON.parse(savedSettings);
        }
      } catch (error) {
        console.error('加载用户设置失败:', error);
      }
    },
    
    // 保存用户设置
    saveSettings() {
      try {
        uni.setStorageSync('user_settings', JSON.stringify(this.settings));
        console.log('用户设置已保存');
      } catch (error) {
        console.error('保存用户设置失败:', error);
      }
    },
    
    // 切换设置开关
    toggleSetting(key) {
      // 使用字符串路径设置嵌套对象属性
      const keys = key.split('.');
      let current = this.settings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = !current[keys[keys.length - 1]];
      
      // 保存设置
      this.saveSettings();
      
      // 应用设置
      this.applySettings(key);
    },
    
    // 应用设置
    applySettings(key) {
      // 根据不同设置应用不同效果
      switch (key) {
        case 'app.darkMode':
          // 应用深色模式
          if (this.settings.app.darkMode) {
            // 添加深色模式样式
            uni.setTabBarStyle({
              color: '#8a8a8a',
              selectedColor: '#ffffff',
              backgroundColor: '#222222',
              borderStyle: 'black'
            });
          } else {
            // 还原默认样式
            uni.setTabBarStyle({
              color: '#8a8a8a',
              selectedColor: '#2b85e4',
              backgroundColor: '#ffffff',
              borderStyle: 'white'
            });
          }
          break;
          
        case 'app.autoPlayVideo':
          // 应用视频自动播放设置
          console.log('自动播放视频设置更改为:', this.settings.app.autoPlayVideo);
          break;
          
        default:
          console.log('设置已更新:', key);
      }
    },
    
    // 获取缓存大小
    getCacheSize() {
      // #ifdef APP-PLUS
      plus.cache.calculate((size) => {
        const sizeInMB = (size / (1024 * 1024)).toFixed(2);
        this.cacheSize = `${sizeInMB}MB`;
      });
      // #endif
      
      // #ifdef H5 || MP
      this.cacheSize = '计算中...';
      // 模拟获取缓存大小
      setTimeout(() => {
        const randomSize = (Math.random() * 10).toFixed(2);
        this.cacheSize = `${randomSize}MB`;
      }, 500);
      // #endif
    },
    
    // 清除缓存
    clearCache() {
      uni.showModal({
        title: '提示',
        content: '确定要清除缓存吗？',
        success: (res) => {
          if (res.confirm) {
            // 显示加载中
            uni.showLoading({
              title: '清除中...'
            });
            
            // #ifdef APP-PLUS
            plus.cache.clear(() => {
              uni.hideLoading();
              uni.showToast({
                title: '缓存已清除',
                icon: 'success'
              });
              this.getCacheSize();
            });
            // #endif
            
            // #ifdef H5 || MP
            // 模拟清除缓存
            setTimeout(() => {
              uni.hideLoading();
              uni.showToast({
                title: '缓存已清除',
                icon: 'success'
              });
              this.cacheSize = '0MB';
            }, 1000);
            // #endif
          }
        }
      });
    },
    
    // 获取应用版本
    getAppVersion() {
      // #ifdef APP-PLUS
      this.appVersion = plus.runtime.version;
      // #endif
      
      // #ifdef H5 || MP
      this.appVersion = 'v1.0.0';
      // #endif
    },
    
    // 检查更新
    checkUpdate() {
      uni.showLoading({
        title: '检查更新中...'
      });
      
      // 模拟检查更新
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({
          title: '已是最新版本',
          icon: 'success'
        });
      }, 1500);
    },
    
    // 页面导航
    navigateTo(url) {
      uni.navigateTo({ url });
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 退出登录
    logout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 清除token和用户信息
            uni.removeStorageSync('token');
            uni.removeStorageSync('userInfo');
            
            // 返回登录页
            uni.reLaunch({
              url: '/pages/auth/login/index'
            });
          }
        }
      });
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.settings-page {
  min-height: 100vh;
  background-color: $bg-page;
  position: relative;
}

.page-header {
  @include flex(row, space-between, center);
  height: 90rpx;
  background-color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
  
  .header-left {
    padding: 15rpx;
    margin: -15rpx;
    
    .iconfont {
      font-size: 40rpx;
      color: $text-primary;
    }
  }
  
  .header-title {
    font-size: 32rpx;
    font-weight: bold;
    color: $text-primary;
  }
}

.settings-content {
  padding: 90rpx 0 50rpx;
  height: calc(100vh - 90rpx);
}

.settings-section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
  
  .section-title {
    font-size: 28rpx;
    font-weight: bold;
    color: $text-primary;
    margin-bottom: 30rpx;
    border-left: 6rpx solid $primary-color;
    padding-left: 15rpx;
  }
}

.settings-item {
  @include flex(row, space-between, center);
  height: 90rpx;
  border-bottom: 1rpx solid $border-light;
  
  &:last-child {
    border-bottom: none;
  }
  
  .item-label {
    font-size: 28rpx;
    color: $text-primary;
  }
  
  .item-value {
    font-size: 26rpx;
    color: $text-tertiary;
  }
  
  .iconfont {
    font-size: 24rpx;
    color: $text-tertiary;
  }
}

.logout-btn {
  width: 90%;
  height: 90rpx;
  background-color: $danger-color;
  color: #fff;
  border-radius: $radius-lg;
  font-size: 32rpx;
  @include center;
  margin: 60rpx auto;
}
</style> 