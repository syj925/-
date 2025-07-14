<template>
  <view class="security-container">
    <view class="header">
      <view class="back-icon ripple" @click="goBack">
        <image class="back-icon-img" src="../../../static/icons/icon_ztc.png" mode="aspectFit"></image>
      </view>
      <text class="header-title">账号安全</text>
    </view>
    
    <view class="content">
      <view class="security-header" 
        :style="{ animation: 'fade-in 0.5s forwards' }">
        <text class="security-header-title">保障您的账号安全</text>
        <text class="security-header-subtitle">定期更新密码和验证方式，提高账号安全性</text>
      </view>
      
      <view class="settings-group"
        :style="{ animation: 'slide-in-up 0.5s 0.1s forwards', opacity: 0 }">
        <view class="setting-item tap-feedback" @tap="changePassword">
          <view class="setting-icon password-icon">
            <image class="setting-icon-img" src="/static/images/aqmm.png" mode="aspectFit"></image>
          </view>
          <view class="setting-info">
            <text class="setting-title">修改密码</text>
            <text class="setting-desc">定期更改密码可以提高账号安全性</text>
          </view>
          <image class="arrow-icon" src="/static/images/arrow-right.png" mode="aspectFit"></image>
        </view>
        
        <view class="setting-item tap-feedback" @tap="bindEmail">
          <view class="setting-icon email-icon">
            <image class="setting-icon-img" src="/static/images/yxbb.png" mode="aspectFit"></image>
          </view>
          <view class="setting-info">
            <text class="setting-title">绑定邮箱</text>
            <text class="setting-desc">{{ email ? '当前绑定: ' + maskEmail(email) : '未绑定邮箱' }}</text>
          </view>
          <image class="arrow-icon" src="/static/images/arrow-right.png" mode="aspectFit"></image>
        </view>
      </view>
      
      <button 
        class="logout-button ripple tap-feedback" 
        @tap="showLogoutConfirm"
        :style="{ animation: 'fade-in 0.5s 0.3s forwards', opacity: 0 }"
      >退出登录</button>
      
      <view class="security-tips"
        :style="{ animation: 'fade-in 0.5s 0.4s forwards', opacity: 0 }">
        <text class="tip-icon">🛡️</text>
        <text class="tip-text">启用多种安全验证方式，可以有效保护您的账号安全</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'SecuritySettings',
  data() {
    return {
      phone: '13812345678', // 示例数据，实际应从用户数据中获取
      email: 'example@mail.com', // 示例数据，实际应从用户数据中获取
      twoFactorAuth: false,
      loginNotify: true
    }
  },
  methods: {
    goBack() {
      uni.navigateBack({
        delta: 1,
        animationType: 'slide-out-right',
        animationDuration: 300
      });
    },
    maskPhone(phone) {
      if (!phone) return '';
      return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    },
    maskEmail(email) {
      if (!email) return '';
      const parts = email.split('@');
      if (parts.length !== 2) return email;
      
      let name = parts[0];
      const domain = parts[1];
      
      if (name.length <= 2) {
        name = name.charAt(0) + '*';
      } else {
        name = name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
      }
      
      return name + '@' + domain;
    },
    changePassword() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none'
      });
      
      // 添加震动反馈
      uni.vibrateShort();
    },
    bindEmail() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none'
      });
      
      // 添加震动反馈
      uni.vibrateShort();
    },
    saveSettings() {
      uni.showToast({
        title: '设置已保存',
        icon: 'success'
      });
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
.security-container {
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

.security-header {
  margin-bottom: 24px;
  padding: 0 5px;
}

.security-header-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  display: block;
}

.security-header-subtitle {
  font-size: 14px;
  color: #666;
  display: block;
}

.settings-group {
  background-color: #FFFFFF;
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
}

.settings-group:active {
  transform: scale(0.99);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #F0F0F0;
  transition: background-color 0.3s;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:active {
  background-color: #F9F9F9;
}

.active-setting {
  background-color: #F7FAFF;
}

.setting-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.setting-icon-img {
  width: 24px;
  height: 24px;
}

.password-icon {
  background-color: #FFE5E5;
}

.phone-icon {
  background-color: #E5FFEF;
}

.email-icon {
  background-color: #E5F1FF;
}

.verify-icon {
  background-color: #F0E5FF;
}

.notify-icon {
  background-color: #FFF5E5;
}

.setting-info {
  flex: 1;
}

.setting-title {
  font-size: 16px;
  color: #333333;
  margin-bottom: 4px;
  display: block;
  font-weight: 500;
}

.setting-desc {
  font-size: 13px;
  color: #999999;
  display: block;
}

.arrow-icon {
  width: 16px;
  height: 16px;
}

.switch-item {
  min-height: 60px;
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
  margin-top: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.logout-button:active {
  transform: scale(0.98);
  background-color: #FFF5F5;
}

.security-tips {
  display: flex;
  align-items: center;
  background-color: #EEF6FF;
  border-radius: 8px;
  padding: 12px 15px;
  margin-top: 20px;
}

.tip-icon {
  font-size: 18px;
  margin-right: 10px;
}

.tip-text {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}
</style> 