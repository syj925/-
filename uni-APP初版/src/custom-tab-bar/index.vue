<template>
  <view class="tab-bar">
    <view class="tab-bar-content">
      <view class="tab-item" :class="{active: active === 0}" @tap="switchTab('/pages/index/index')">
        <image class="tab-icon" :src="active === 0 ? '/static/icons/home-active.png' : '/static/icons/home.png'" mode="aspectFit"></image>
        <view class="tab-text">首页</view>
      </view>
      <view class="tab-item" :class="{active: active === 1}" @tap="switchTab('/pages/discover/discover')">
        <image class="tab-icon" :src="active === 1 ? '/static/icons/discover-active.png' : '/static/icons/discover.png'" mode="aspectFit"></image>
        <view class="tab-text">发现</view>
      </view>
      <view class="tab-item center">
        <view class="center-button" @tap="openPublish">
          <image class="center-icon" src="/static/icons/publish.png" mode="aspectFit"></image>
        </view>
      </view>
      <view class="tab-item" :class="{active: active === 3}" @tap="switchTab('/pages/message/message')">
        <image class="tab-icon" :src="active === 3 ? '/static/icons/message-active.png' : '/static/icons/message.png'" mode="aspectFit"></image>
        <view class="tab-text">消息</view>
      </view>
      <view class="tab-item" :class="{active: active === 4}" @tap="switchTab('/pages/profile/profile')">
        <image class="tab-icon" :src="active === 4 ? '/static/icons/profile-active.png' : '/static/icons/profile.png'" mode="aspectFit"></image>
        <view class="tab-text">我的</view>
      </view>
    </view>
    <!-- 适配底部安全区域 -->
    <view class="tab-bar-placeholder" :style="{height: safeAreaHeight + 'px'}"></view>
  </view>
</template>

<script>
export default {
  name: 'CustomTabBar',
  data() {
    return {
      active: 0,
      safeAreaHeight: 0,
      tabList: [
        { pagePath: '/pages/index/index', text: '首页', icon: 'icon-home' },
        { pagePath: '/pages/discover/discover', text: '发现', icon: 'icon-discover' },
        { pagePath: '', text: '发布', icon: 'icon-add' },
        { pagePath: '/pages/message/message', text: '消息', icon: 'icon-message' },
        { pagePath: '/pages/profile/profile', text: '我的', icon: 'icon-user' }
      ]
    }
  },
  created() {
    this.updateActive();
    // 获取底部安全区域高度
    const systemInfo = uni.getSystemInfoSync();
    this.safeAreaHeight = systemInfo.safeAreaInsets?.bottom || 0;
    
    // 监听页面显示事件
    uni.$on('tabChange', this.handleTabChange);
  },
  onShow() {
    this.updateActive();
  },
  beforeDestroy() {
    uni.$off('tabChange', this.handleTabChange);
  },
  methods: {
    handleTabChange(index) {
      this.active = index;
    },
    updateActive() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (!currentPage) return;
      
      const currentPath = `/${currentPage.route}`;
      const tabIndex = this.tabList.findIndex(item => item.pagePath === currentPath);
      
      if (tabIndex !== -1) {
        this.active = tabIndex;
      }
    },
    switchTab(path) {
      if (!path) return;
      
      // 判断当前页面是否就是要跳转的页面
      const currentPages = getCurrentPages();
      const currentPage = currentPages[currentPages.length - 1];
      const currentPath = `/${currentPage.route}`;
      
      if (currentPath === path) return;
      
      // 判断是否是tabBar页面
      const isTabBarPage = this.tabList.some(item => item.pagePath === path);
      
      if (isTabBarPage) {
        uni.switchTab({
          url: path,
          success: () => {
            // 找到对应的索引
            const tabIndex = this.tabList.findIndex(item => item.pagePath === path);
            if (tabIndex !== -1) {
              this.active = tabIndex;
            }
          }
        });
      } else {
        uni.navigateTo({
          url: path
        });
      }
    },
    openPublish() {
      // 直接跳转，不使用动画
      uni.navigateTo({
        url: '/pages/publish/publish',
        animationType: 'none'
      });
    }
  }
}
</script>

<style>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #FFFFFF;
  box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.05);
  z-index: 999;
}

.tab-bar-content {
  display: flex;
  height: 50px;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #999999;
  position: relative;
  transition: all 0.3s;
}

.tab-item:active {
  opacity: 0.7;
}

.tab-item.active {
  color: #4A90E2;
  transform: scale(1.05);
}

.tab-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 2px;
  transition: transform 0.3s;
}

.tab-item.active .tab-icon {
  transform: translateY(-2px);
}

.tab-text {
  font-size: 10px;
  line-height: 12px;
}

.tab-item.center {
  position: relative;
}

.center-button {
  position: absolute;
  width: 44px;
  height: 44px;
  background-color: #4A90E2;
  border-radius: 50%;
  top: -10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
  transition: transform 0.2s, box-shadow 0.3s;
}

.center-button:active {
  transform: translateY(2px) scale(0.95);
  box-shadow: 0 1px 3px rgba(74, 144, 226, 0.3);
}

.center-icon {
  width: 24px;
  height: 24px;
}

/* 适配底部安全区域 */
.tab-bar-placeholder {
  width: 100%;
  background-color: #FFFFFF;
}
</style> 