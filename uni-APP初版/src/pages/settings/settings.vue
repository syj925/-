<template>
  <view class="settings-container">
    <view class="header">
      <view class="back-icon ripple" @click="goBack">
        <image class="back-icon-img" src="../../static/icons/icon_ztc.png" mode="aspectFit"></image>
      </view>
      <text class="header-title">设置</text>
    </view>
    
    <view class="content">
      <view class="settings-group" :style="{ animation: 'slide-in-up 0.5s forwards' }">
        <view class="group-title">账户设置</view>
        <view class="menu-list">
          <view class="menu-item ripple tap-feedback" @tap="navigateTo('privacy')">
            <view class="menu-icon privacy-icon">
              <image class="menu-icon-img" src="../../static/images/yssz.png" mode="aspectFit"></image>
            </view>
            <view class="menu-info">
              <text class="menu-title">隐私设置</text>
              <text class="menu-desc">管理个人信息可见性</text>
            </view>
            <image class="arrow-icon" src="/static/images/arrow-right.png" mode="aspectFit"></image>
          </view>
        
          <view class="menu-item ripple tap-feedback" @tap="navigateTo('security')">
            <view class="menu-icon security-icon">
              <image class="menu-icon-img" src="../../static/images/zhaq.png" mode="aspectFit"></image>
            </view>
            <view class="menu-info">
              <text class="menu-title">账号安全</text>
              <text class="menu-desc">密码修改与安全验证</text>
            </view>
            <image class="arrow-icon" src="/static/images/arrow-right.png" mode="aspectFit"></image>
          </view>
        </view>
      </view>
      
      <view class="settings-group" :style="{ animation: 'slide-in-up 0.5s 0.2s forwards', opacity: 0 }">
        <view class="group-title">通用设置</view>
        <view class="menu-list">
          <view class="menu-item ripple tap-feedback" @tap="navigateTo('about')">
            <view class="menu-icon about-icon">
              <image class="menu-icon-img" src="../../static/images/gywm.png" mode="aspectFit"></image>
            </view>
            <view class="menu-info">
              <text class="menu-title">关于我们</text>
              <text class="menu-desc">版本信息与服务条款</text>
            </view>
            <image class="arrow-icon" src="/static/images/arrow-right.png" mode="aspectFit"></image>
          </view>
          
          <view class="menu-item ripple tap-feedback" @tap="navigateTo('feedback')">
            <view class="menu-icon feedback-icon">
              <image class="menu-icon-img" src="../../static/images/yjfk.png" mode="aspectFit"></image>
            </view>
            <view class="menu-info">
              <text class="menu-title">意见反馈</text>
              <text class="menu-desc">问题报告与功能建议</text>
            </view>
            <image class="arrow-icon" src="/static/images/arrow-right.png" mode="aspectFit"></image>
          </view>
          
          <view class="menu-item ripple tap-feedback" @tap="clearCache">
            <view class="menu-icon clear-icon">
              <image class="menu-icon-img" src="../../static/images/qchc.png" mode="aspectFit"></image>
            </view>
            <view class="menu-info">
              <text class="menu-title">清除缓存</text>
              <text class="menu-desc">{{ cacheSize }}</text>
            </view>
            <image class="arrow-icon" src="/static/images/arrow-right.png" mode="aspectFit"></image>
          </view>
        </view>
      </view>
      
      <view class="logout-button tap-feedback ripple" 
        @tap="showLogoutConfirm" 
        :style="{ animation: 'fade-in 0.6s 0.3s forwards', opacity: 0 }">
        退出登录
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'SettingsPage',
  data() {
    return {
      // 缓存大小
      cacheSize: '2.5MB'
    }
  },
  onLoad() {
    // 加载用户设置数据
    this.loadUserSettings();
  },
  methods: {
    goBack() {
      uni.navigateBack({
        delta: 1,
        animationType: 'slide-out-right',
        animationDuration: 300
      });
    },
    loadUserSettings() {
      // 获取缓存大小（模拟）
      this.getCacheSize();
    },
    getCacheSize() {
      // 实际应用中应该调用相关API获取缓存大小
      // 这里使用模拟数据
      setTimeout(() => {
        this.cacheSize = '2.5MB';
      }, 300);
    },
    navigateTo(page) {
      const routes = {
        privacy: '/pages/settings/privacy/privacy',
        security: '/pages/settings/security/security',
        about: '/pages/about/about',
        feedback: '/pages/feedback/feedback'
      };
      
      if (routes[page]) {
        uni.navigateTo({
          url: routes[page],
          animationType: 'slide-in-right',
          animationDuration: 300
        });
        
        // 添加震动反馈
        uni.vibrateShort();
      }
    },
    clearCache() {
      uni.showLoading({
        title: '清理中...'
      });
      
      // 模拟清理过程
      setTimeout(() => {
        uni.hideLoading();
        this.cacheSize = '0KB';
        
        // 添加震动反馈
        uni.vibrateShort();
        
        uni.showToast({
          title: '缓存已清理',
          icon: 'success'
        });
      }, 1500);
    },
    showLogoutConfirm() {
      uni.showModal({
        title: '退出登录',
        content: '确定要退出当前账号吗？',
        confirmColor: '#4A90E2',
        success: (res) => {
          if (res.confirm) {
            this.logout();
          }
        }
      });
    },
    logout() {
      // 实际应用中这里需要清除用户登录状态和本地存储的相关信息
      uni.showToast({
        title: '已退出登录',
        icon: 'success',
        duration: 2000,
        success: () => {
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/login/login'
            });
          }, 2000);
        }
      });
    }
  }
}
</script>

<style>
.settings-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #F5F9FF;
}

.header {
  position: relative;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4A90E2;
  color: #FFFFFF;
  padding-top: var(--status-bar-height);
  box-shadow: 0 2px 10px rgba(74, 144, 226, 0.2);
  z-index: 10;
}

.back-icon {
  position: absolute;
  left: 15px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-icon:active {
  background-color: rgba(255, 255, 255, 0.2);
}

.back-icon-img {
  width: 24px;
  height: 24px;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
}

.content {
  flex: 1;
  padding: 20px 15px;
}

.group-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  padding-left: 5px;
  font-weight: 500;
}

.settings-group {
  margin-bottom: 25px;
}

.menu-list {
  background-color: #FFFFFF;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #F0F0F0;
  transition: all 0.2s ease;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: #F7FAFF;
}

.active-setting {
  background-color: #F7FAFF;
}

.menu-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.menu-icon-img {
  width: 24px;
  height: 24px;
}

.privacy-icon {
  background-color: #E1EDFF;
}

.security-icon {
  background-color: #E5F8E5;
}

.about-icon {
  background-color: #E5F1FF;
}

.feedback-icon {
  background-color: #F0E5FF;
}

.clear-icon {
  background-color: #FFF5E5;
}

.menu-info {
  flex: 1;
}

.menu-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
  font-weight: 500;
}

.menu-desc {
  font-size: 13px;
  color: #999;
}

.arrow-icon {
  width: 16px;
  height: 16px;
}

.switch-item {
  min-height: 50px;
}

.logout-button {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #FFFFFF;
  color: #FF6666;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
  margin-top: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.logout-button:active {
  transform: scale(0.98);
  background-color: #FFF5F5;
}
</style> 