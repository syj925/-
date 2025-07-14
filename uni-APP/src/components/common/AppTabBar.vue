<template>
  <view class="tabbar" :style="{ height: `${tabbarHeight}rpx` }">
    <view class="tabbar-content">
      <view 
        v-for="(item, index) in tabs" 
        :key="index" 
        class="tabbar-item" 
        :class="{ active: currentTab === item.pagePath }"
        @tap="switchTab(item)"
      >
        <view class="tabbar-icon">
          <image 
            :src="currentTab === item.pagePath ? item.selectedIconPath : item.iconPath" 
            mode="aspectFit"
          ></image>
        </view>
        <text class="tabbar-text">{{ item.text }}</text>
      </view>
      
      <!-- 中间的发布按钮 -->
      <view class="tabbar-publish" @tap="goPublish">
        <view class="tabbar-publish-icon">
          <app-icon name="add" size="lg" color="#FFFFFF"></app-icon>
        </view>
      </view>
    </view>
    <view class="tabbar-safe-area"></view>
  </view>
</template>

<script>
import AppIcon from './AppIcon.vue';

export default {
  name: 'AppTabBar',
  components: {
    AppIcon
  },
  data() {
    return {
      // 底部导航高度
      tabbarHeight: 110,
      // 当前选中的页面路径
      currentTab: '/pages/index/index',
      // 底部导航配置
      tabs: [
        {
          pagePath: '/pages/index/index',
          text: '首页',
          iconPath: '/static/images/tabbar/home.png',
          selectedIconPath: '/static/images/tabbar/home-active.png'
        },
        {
          pagePath: '/pages/message/index',
          text: '消息',
          iconPath: '/static/images/tabbar/message.png',
          selectedIconPath: '/static/images/tabbar/message-active.png'
        },
        {
          pagePath: '',
          text: '发布',
          iconPath: '',
          selectedIconPath: ''
        },
        {
          pagePath: '/pages/find/index',
          text: '发现',
          iconPath: '/static/images/tabbar/find.png',
          selectedIconPath: '/static/images/tabbar/find-active.png'
        },
        {
          pagePath: '/pages/profile/index',
          text: '我的',
          iconPath: '/static/images/tabbar/profile.png',
          selectedIconPath: '/static/images/tabbar/profile-active.png'
        }
      ]
    };
  },
  created() {
    // 获取当前页面路径
    const pages = getCurrentPages();
    if (pages.length) {
      const currentPage = pages[pages.length - 1];
      const route = `/${currentPage.route}`;
      
      // 设置当前选中的页面
      this.tabs.forEach(tab => {
        if (tab.pagePath === route) {
          this.currentTab = route;
        }
      });
    }
  },
  methods: {
    // 切换页面
    switchTab(item) {
      if (!item.pagePath || this.currentTab === item.pagePath) return;
      
      this.currentTab = item.pagePath;
      uni.switchTab({
        url: item.pagePath
      });
    },
    
    // 跳转到发布页面
    goPublish() {
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.navigateTo({
          url: '/pages/auth/login/index'
        });
        return;
      }
      
      // 跳转到发布页面
      uni.navigateTo({
        url: '/pages/publish/index'
      });
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.tabbar {
  width: 100%;
  position: fixed;
  bottom: 0;
  left: 0;
  background-color: #FFFFFF;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
  
  &-content {
    height: 110rpx;
    @include flex(row, space-around, center);
    position: relative;
    padding: 0 10rpx;
  }
  
  &-item {
    flex: 1;
    height: 100%;
    @include flex(column, center, center);
    position: relative;
    
    &.active {
      .tabbar-text {
        color: $primary-color;
      }
    }
  }
  
  &-icon {
    width: 48rpx;
    height: 48rpx;
    margin-bottom: 6rpx;
    
    image {
      width: 100%;
      height: 100%;
    }
  }
  
  &-text {
    font-size: $font-size-xs;
    color: $text-tertiary;
    line-height: 1;
  }
  
  &-publish {
    position: absolute;
    bottom: 20rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 110rpx;
    height: 110rpx;
    
    &-icon {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, $primary-color, $primary-light);
      border-radius: 50%;
      @include center;
      box-shadow: 0 4rpx 16rpx rgba($primary-color, 0.3);
    }
  }
  
  &-safe-area {
    height: env(safe-area-inset-bottom);
    width: 100%;
    background-color: #FFFFFF;
  }
}
</style> 