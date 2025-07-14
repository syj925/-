<template>
  <view class="privacy-container">
    <view class="header">
      <view class="back-icon ripple" @click="goBack">
        <image class="back-icon-img" src="../../../static/icons/icon_ztc.png" mode="aspectFit"></image>
      </view>
      <text class="header-title">隐私设置</text>
    </view>
    
    <view class="content">
      <view class="settings-header" 
        :style="{ animation: 'fade-in 0.6s forwards' }">
        <text class="settings-header-title">个性化您的隐私偏好</text>
        <text class="settings-header-subtitle">设置隐私与匿名选项</text>
      </view>
      
      <view class="settings-group"
        :style="{ animation: 'slide-in-up 0.5s 0.2s forwards', opacity: 0 }">
        <view class="setting-item switch-item" :class="{ 'active-setting': anonymousMode }">
          <view class="setting-info">
            <text class="setting-title">匿名模式</text>
            <text class="setting-desc">开启后您的发帖和评论将显示为匿名用户</text>
          </view>
          <switch 
            :checked="anonymousMode" 
            @change="handleAnonymousModeChange" 
            color="#4A90E2"
            class="switch-animation"
          />
        </view>
      </view>
      
      <view class="settings-group"
        :style="{ animation: 'slide-in-up 0.5s 0.3s forwards', opacity: 0 }">
        <view class="setting-item switch-item" :class="{ 'active-setting': allowSearch }">
          <view class="setting-info">
            <text class="setting-title">允许被搜索</text>
            <text class="setting-desc">允许其他用户通过搜索找到你</text>
          </view>
          <switch 
            :checked="allowSearch" 
            @change="handleSearchChange" 
            color="#4A90E2"
            class="switch-animation"
          />
        </view>
        
        <view class="setting-item switch-item" :class="{ 'active-setting': showLocation }">
          <view class="setting-info">
            <text class="setting-title">位置信息</text>
            <text class="setting-desc">在动态中显示你的位置信息</text>
          </view>
          <switch 
            :checked="showLocation" 
            @change="handleLocationChange" 
            color="#4A90E2"
            class="switch-animation"
          />
        </view>
      </view>
      
      <view class="privacy-tips"
        :style="{ animation: 'fade-in 0.8s 0.5s forwards', opacity: 0 }">
        <text class="tip-icon">🔒</text>
        <text class="tip-text">我们重视您的隐私设置，所有更改即时生效</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PrivacySettings',
  data() {
    return {
      anonymousMode: false,
      allowSearch: true,
      showLocation: false
    }
  },
  onLoad() {
    // 从本地存储加载匿名设置
    try {
      const value = uni.getStorageSync('anonymousMode');
      if (value !== '') {
        this.anonymousMode = value === 'true';
      }
    } catch (e) {
      console.error('读取匿名设置失败', e);
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
    handleAnonymousModeChange(e) {
      this.anonymousMode = e.detail.value;
      // 保存匿名模式设置到本地存储
      uni.setStorage({
        key: 'anonymousMode',
        data: String(this.anonymousMode)
      });
      this.saveSettings();
      this.showToastAnimation();
    },
    handleSearchChange(e) {
      this.allowSearch = e.detail.value;
      this.saveSettings();
      this.showToastAnimation();
    },
    handleLocationChange(e) {
      this.showLocation = e.detail.value;
      this.saveSettings();
      this.showToastAnimation();
    },
    saveSettings() {
      // 模拟保存设置
      uni.showToast({
        title: '设置已保存',
        icon: 'success',
        duration: 2000
      });
    },
    showToastAnimation() {
      // 添加震动反馈
      uni.vibrateShort({
        success: function () {
          console.log('振动成功');
        }
      });
    }
  }
}
</script>

<style>
.privacy-container {
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

.back-icon-img {
  width: 24px;
  height: 24px;
}

.back-icon:active {
  background-color: rgba(255, 255, 255, 0.2);
}

.header-title {
  font-size: 18px;
  font-weight: 500;
}

.content {
  flex: 1;
  padding: 20px 15px;
}

.settings-header {
  margin-bottom: 24px;
  padding: 0 5px;
}

.settings-header-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  display: block;
}

.settings-header-subtitle {
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

.active-setting {
  background-color: #F7FAFF;
}

.setting-info {
  flex: 1;
}

.setting-title {
  font-size: 16px;
  color: #333333;
  margin-bottom: 6px;
  display: block;
  font-weight: 500;
}

.setting-desc {
  font-size: 13px;
  color: #999999;
  display: block;
}

.picker-text {
  font-size: 15px;
  color: #4A90E2;
  padding-right: 20px;
  position: relative;
  font-weight: 500;
}

.picker-text::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-right: 1.5px solid #4A90E2;
  border-bottom: 1.5px solid #4A90E2;
  transform: translateY(-50%) rotate(45deg);
}

.switch-item {
  min-height: 60px;
}

.privacy-tips {
  display: flex;
  align-items: center;
  background-color: #EEF6FF;
  border-radius: 8px;
  padding: 12px 15px;
  margin-top: 30px;
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