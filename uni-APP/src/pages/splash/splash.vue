<template>
  <view class="splash-container">
    <view class="splash-content">
      <!-- 应用Logo -->
      <image class="app-logo" src="/static/images/icon/app-icon.png" mode="aspectFit"></image>
      
      <!-- 应用名称 -->
      <text class="app-name">校园墙</text>
      
      <!-- 标语 -->
      <text class="app-slogan">连接校园，分享生活</text>
      
      <!-- 加载动画 -->
      <view class="loading-container">
        <view class="loading-dot" v-for="i in 3" :key="i"></view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'SplashPage',
  onLoad() {
    // 模拟初始化过程
    setTimeout(() => {
      // 跳转到首页
      uni.reLaunch({
        url: '/pages/index/home'
      });
    }, 3000); // 3秒后跳转
  }
}
</script>

<style lang="scss" scoped>
.splash-container {
  width: 100vw;
  height: 100vh;
  background-image: url('/static/images/splash/splash.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 1;
  }
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  position: relative;
  z-index: 2;
  text-align: center;
}

.app-logo {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 40rpx;
  border-radius: 50rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.5);
  border: 6rpx solid rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10rpx);
}

.app-name {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  text-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.3);
}

.app-slogan {
  font-size: 28rpx;
  opacity: 0.8;
  margin-bottom: 80rpx;
}

.loading-container {
  display: flex;
  gap: 16rpx;
}

.loading-dot {
  width: 16rpx;
  height: 16rpx;
  background: white;
  border-radius: 50%;
  opacity: 0.3;
  animation: loading 1.5s infinite;
}

.loading-dot:nth-child(1) { animation-delay: 0s; }
.loading-dot:nth-child(2) { animation-delay: 0.3s; }
.loading-dot:nth-child(3) { animation-delay: 0.6s; }

@keyframes loading {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  30% {
    opacity: 1;
    transform: scale(1.2);
  }
}
</style>
