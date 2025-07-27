<template>
  <view class="about-page">
    <!-- 导航栏 -->
    <view class="navbar">
      <view class="navbar-left" @tap="goBack">
        <app-icon name="arrow-left" size="lg" color="#333"></app-icon>
      </view>
      <view class="navbar-title">关于我们</view>
      <view class="navbar-right"></view>
    </view>
    
    <!-- 内容区 -->
    <view class="about-content">
      <!-- 应用信息 -->
      <view class="app-info">
        <view class="app-logo">
          <image src="/static/logo.png" mode="aspectFit" class="logo-image"></image>
        </view>
        <view class="app-name">校园墙</view>
        <view class="app-slogan">连接校园，分享生活</view>
        <view class="app-version" @tap="goToVersion">
          版本 {{ appVersion }}
          <app-icon name="arrow-right" size="sm" color="#999"></app-icon>
        </view>
      </view>

      <!-- 功能介绍 -->
      <view class="feature-section">
        <view class="section-title">主要功能</view>
        <view class="feature-list">
          <view class="feature-item">
            <view class="feature-icon">📝</view>
            <view class="feature-text">发布动态，分享校园生活</view>
          </view>
          <view class="feature-item">
            <view class="feature-icon">💬</view>
            <view class="feature-text">互动评论，交流想法</view>
          </view>
          <view class="feature-item">
            <view class="feature-icon">🔍</view>
            <view class="feature-text">搜索内容，发现精彩</view>
          </view>
          <view class="feature-item">
            <view class="feature-icon">🎯</view>
            <view class="feature-text">话题讨论，聚焦兴趣</view>
          </view>
          <view class="feature-item">
            <view class="feature-icon">🎉</view>
            <view class="feature-text">校园活动，不错过精彩</view>
          </view>
        </view>
      </view>

      <!-- 联系我们 -->
      <view class="contact-section">
        <view class="section-title">联系我们</view>
        <view class="contact-list">
          <view class="contact-item" @tap="copyText('support@campus-wall.com')">
            <view class="contact-icon">📧</view>
            <view class="contact-info">
              <view class="contact-label">邮箱</view>
              <view class="contact-value">support@campus-wall.com</view>
            </view>
            <app-icon name="copy" size="sm" color="#999"></app-icon>
          </view>
          <view class="contact-item" @tap="copyText('400-123-4567')">
            <view class="contact-icon">📞</view>
            <view class="contact-info">
              <view class="contact-label">客服热线</view>
              <view class="contact-value">400-123-4567</view>
            </view>
            <app-icon name="copy" size="sm" color="#999"></app-icon>
          </view>
        </view>
      </view>

      <!-- 法律信息 */
      <view class="legal-section">
        <view class="section-title">法律信息</view>
        <view class="legal-list">
          <view class="legal-item" @tap="openPrivacyPolicy">
            <view class="legal-text">隐私政策</view>
            <app-icon name="arrow-right" size="sm" color="#999"></app-icon>
          </view>
          <view class="legal-item" @tap="openUserAgreement">
            <view class="legal-text">用户协议</view>
            <app-icon name="arrow-right" size="sm" color="#999"></app-icon>
          </view>
        </view>
      </view>

      <!-- 版权信息 -->
      <view class="copyright">
        <text class="copyright-text">© 2024 校园墙. All rights reserved.</text>
        <text class="copyright-text">让校园生活更精彩</text>
      </view>
    </view>
  </view>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue';
import configUpdateManager from '@/utils/configUpdateManager';

export default {
  name: 'AboutPage',
  components: {
    AppIcon
  },
  data() {
    return {
      appVersion: '1.0.0'
    };
  },
  onLoad() {
    this.loadAppVersion();
  },
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },

    // 加载应用版本
    loadAppVersion() {
      try {
        // 获取本地配置版本
        const localVersion = configUpdateManager.getLocalConfigVersion();
        if (localVersion) {
          this.appVersion = localVersion;
        }
      } catch (error) {
        console.error('获取版本信息失败:', error);
      }
    },

    // 跳转到版本管理页面
    goToVersion() {
      uni.navigateTo({
        url: '/pages/settings/version'
      });
    },

    // 复制文本
    copyText(text) {
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({
            title: '已复制到剪贴板',
            icon: 'success',
            duration: 2000
          });
        },
        fail: () => {
          uni.showToast({
            title: '复制失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    },

    // 打开隐私政策
    openPrivacyPolicy() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none',
        duration: 2000
      });
    },

    // 打开用户协议
    openUserAgreement() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none',
        duration: 2000
      });
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.about-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

/* 导航栏 */
.navbar {
  @include flex(row, space-between, center);
  height: 88rpx;
  padding: 0 30rpx;
  background: #ffffff;
  border-bottom: 2rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-left, .navbar-right {
  width: 80rpx;
  @include flex(row, center, center);
}

.navbar-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
}

/* 内容区 */
.about-content {
  padding: 40rpx 30rpx;
}

/* 应用信息 */
.app-info {
  @include flex(column, center, center);
  padding: 60rpx 0;
  margin-bottom: 60rpx;
}

.app-logo {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 30rpx;
}

.logo-image {
  width: 100%;
  height: 100%;
  border-radius: 24rpx;
}

.app-name {
  font-size: 48rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 16rpx;
}

.app-slogan {
  font-size: $font-size-base;
  color: $text-secondary;
  margin-bottom: 30rpx;
}

.app-version {
  @include flex(row, center, center);
  padding: 16rpx 24rpx;
  background: #f8f9fa;
  border-radius: 50rpx;
  font-size: $font-size-sm;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:active {
    background: #e9ecef;
  }
}

/* 通用区块样式 */
.feature-section, .contact-section, .legal-section {
  margin-bottom: 60rpx;
}

.section-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 30rpx;
}

/* 功能列表 */
.feature-list {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 20rpx;
  border: 2rpx solid #f0f0f0;
}

.feature-item {
  @include flex(row, flex-start, center);
  padding: 24rpx;
  border-radius: 16rpx;
  margin-bottom: 8rpx;
  transition: all 0.3s ease;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:active {
    background: #f8f9fa;
  }
}

.feature-icon {
  font-size: 40rpx;
  margin-right: 24rpx;
}

.feature-text {
  font-size: $font-size-base;
  color: $text-primary;
  line-height: 1.5;
}

/* 联系方式 */
.contact-list {
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  border: 2rpx solid #f0f0f0;
}

.contact-item {
  @include flex(row, space-between, center);
  padding: 30rpx;
  border-bottom: 2rpx solid #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:active {
    background: #f8f9fa;
  }
}

.contact-icon {
  font-size: 40rpx;
  margin-right: 24rpx;
}

.contact-info {
  flex: 1;
}

.contact-label {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: 8rpx;
}

.contact-value {
  font-size: $font-size-base;
  color: $text-primary;
  font-weight: 500;
}

/* 法律信息 */
.legal-list {
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  border: 2rpx solid #f0f0f0;
}

.legal-item {
  @include flex(row, space-between, center);
  padding: 30rpx;
  border-bottom: 2rpx solid #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:active {
    background: #f8f9fa;
  }
}

.legal-text {
  font-size: $font-size-base;
  color: $text-primary;
}

/* 版权信息 */
.copyright {
  @include flex(column, center, center);
  padding: 60rpx 0;
  margin-top: 40rpx;
}

.copyright-text {
  font-size: $font-size-sm;
  color: $text-tertiary;
  line-height: 1.8;
  text-align: center;
}
</style>
