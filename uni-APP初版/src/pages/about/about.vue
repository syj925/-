<template>
  <view class="about-container">
    <view class="header">
      <view class="back-icon ripple" @click="goBack">
        <image class="back-icon-img" src="../../static/icons/icon_ztc.png" mode="aspectFit"></image>
      </view>
      <text class="header-title">关于我们</text>
    </view>
    
    <view class="content">
      <view class="logo-container">
        <image class="app-logo" src="/static/logo.png" mode="aspectFit" 
          :style="{ animation: 'card-pop-in 0.6s ease-out' }"></image>
        <text class="app-name" :style="{ animation: 'fade-in 0.8s 0.3s forwards' }">校园墙</text>
        <text class="app-version" :style="{ animation: 'fade-in 0.8s 0.5s forwards', opacity: 0 }">v1.0.0</text>
      </view>
      
      <view class="about-sections">
        <view 
          class="about-section" 
          v-for="(section, index) in sections" 
          :key="index"
          :style="{ animation: `slide-in-up 0.5s ${0.2 + index * 0.1}s forwards`, opacity: 0 }"
        >
          <text class="section-title">{{ section.title }}</text>
          <text v-for="(content, cIndex) in section.contents" :key="cIndex" class="section-content">{{ content }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'AboutPage',
  data() {
    return {
      sections: [
        {
          title: '应用简介',
          contents: ['校园墙是一个专为高校学生打造的社交平台，旨在为校园生活提供更便捷的信息分享与交流空间。']
        },
        {
          title: '联系我们',
          contents: ['邮箱：support@campuswall.com', '微信：campuswall_support']
        },
        {
          title: '版权信息',
          contents: ['© 2023 校园墙团队 保留所有权利']
        }
      ]
    }
  },
  methods: {
    goBack() {
      uni.navigateBack({
        delta: 1,
        animationType: 'slide-out-right',
        animationDuration: 300
      });
    }
  }
}
</script>

<style>
.about-container {
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
  z-index: 100;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
}

.app-logo {
  width: 90px;
  height: 90px;
  margin-bottom: 20px;
  border-radius: 22px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.app-logo:active {
  transform: scale(1.05);
}

.app-name {
  font-size: 26px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  letter-spacing: 1px;
}

.app-version {
  font-size: 14px;
  color: #666;
  background-color: #EEF4FF;
  padding: 3px 12px;
  border-radius: 12px;
}

.about-sections {
  width: 100%;
}

.about-section {
  width: 100%;
  margin-bottom: 24px;
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.about-section:active {
  transform: translateY(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 17px;
  font-weight: 600;
  color: #4A90E2;
  margin-bottom: 12px;
  display: block;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 4px;
  background-color: #4A90E2;
  border-radius: 2px;
}

.section-content {
  font-size: 15px;
  color: #555;
  line-height: 1.6;
  display: block;
  margin-bottom: 8px;
}
</style> 