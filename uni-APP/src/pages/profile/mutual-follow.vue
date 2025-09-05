<template>
  <view class="mutual-follow-page">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @tap="goBack">
        <text class="iconfont icon-arrow-left"></text>
      </view>
      <view class="nav-title">互相关注</view>
      <view class="nav-right"></view>
    </view>
    
    <!-- 内容区 -->
    <view class="content">
      <scroll-view 
        scroll-y 
        class="scroll-view" 
        @scrolltolower="loadMore"
        refresher-enabled 
        :refresher-triggered="refreshing" 
        @refresherrefresh="refresh"
      >
        <!-- 用户列表 -->
        <view class="user-list" v-if="userList.length > 0">
          <view 
            v-for="(user, index) in userList" 
            :key="user.id"
            class="user-item"
            @tap="goToUserProfile(user.id)"
          >
            <view class="user-avatar">
              <image :src="user.avatar || '/static/images/common/default-avatar.png'" mode="aspectFill"></image>
              <view class="mutual-badge">互关</view>
            </view>
            <view class="user-info">
              <view class="user-nickname">{{ user.nickname || user.username }}</view>
              <view class="user-bio" v-if="user.bio">{{ user.bio }}</view>
              <view class="user-stats">
                <text class="stat-item">{{ user.postCount || 0 }} 帖子</text>
                <text class="stat-item">{{ user.followersCount || 0 }} 粉丝</text>
              </view>
              <view class="follow-time" v-if="user.followTime">
                关注时间：{{ formatTime(user.followTime) }}
              </view>
            </view>
            <view class="user-action">
              <view class="mutual-icon">
                <text class="iconfont icon-heart"></text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view class="empty-container" v-else-if="!loading">
          <image class="empty-image" src="/static/images/common/empty-mutual.png" mode="aspectFit"></image>
          <text class="empty-text">暂无互相关注的用户</text>
          <text class="empty-tip">快去关注更多有趣的人吧~</text>
        </view>
        
        <!-- 加载状态 -->
        <view class="loading-container" v-if="loading">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 加载更多 -->
        <view class="load-more" v-if="hasMore && userList.length > 0">
          <text class="load-more-text">正在加载更多...</text>
        </view>
        
        <!-- 没有更多 -->
        <view class="no-more" v-if="!hasMore && userList.length > 0">
          <text class="no-more-text">没有更多了</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'MutualFollow',
  data() {
    return {
      userList: [],
      loading: false,
      refreshing: false,
      hasMore: true,
      page: 1,
      pageSize: 20
    };
  },
  
  onLoad() {
    this.loadData();
  },
  
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 加载数据
    async loadData() {
      if (this.loading) return;
      
      this.loading = true;
      
      try {
        const response = await this.$api.follow.getMyMutualFollowings(this.page, this.pageSize);
        
        if (response.success) {
          const newData = response.data.list || [];
          
          if (this.page === 1) {
            this.userList = newData;
          } else {
            this.userList = [...this.userList, ...newData];
          }
          
          this.hasMore = newData.length >= this.pageSize;
        } else {
          uni.showToast({
            title: response.message || '加载失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('加载互相关注列表失败:', error);
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      } finally {
        this.loading = false;
        this.refreshing = false;
      }
    },
    
    // 刷新
    refresh() {
      this.refreshing = true;
      this.page = 1;
      this.hasMore = true;
      this.loadData();
    },
    
    // 加载更多
    loadMore() {
      if (this.hasMore && !this.loading) {
        this.page++;
        this.loadData();
      }
    },
    
    // 跳转到用户资料页
    goToUserProfile(userId) {
      uni.navigateTo({
        url: `/pages/profile/profile?userId=${userId}`
      });
    },
    
    // 格式化时间
    formatTime(time) {
      if (!time) return '';
      
      const date = new Date(time);
      const now = new Date();
      const diff = now - date;
      
      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;
      const month = 30 * day;
      
      if (diff < hour) {
        return Math.floor(diff / minute) + '分钟前';
      } else if (diff < day) {
        return Math.floor(diff / hour) + '小时前';
      } else if (diff < month) {
        return Math.floor(diff / day) + '天前';
      } else {
        return date.toLocaleDateString();
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.mutual-follow-page {
  height: 100vh;
  background-color: $bg-color;
}

/* 导航栏 */
.nav-bar {
  @include flex(row, space-between, center);
  height: 88rpx;
  padding: 0 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid $border-color;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.nav-left, .nav-right {
  width: 80rpx;
  height: 60rpx;
  @include center;
}

.nav-left {
  .iconfont {
    font-size: 36rpx;
    color: $text-primary;
  }
}

.nav-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
}

/* 内容区 */
.content {
  margin-top: 88rpx;
  height: calc(100vh - 88rpx);
}

.scroll-view {
  height: 100%;
}

/* 用户列表 */
.user-list {
  padding: 20rpx;
}

.user-item {
  @include flex(row, flex-start, center);
  padding: 30rpx 20rpx;
  margin-bottom: 20rpx;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.user-avatar {
  position: relative;
  margin-right: 24rpx;
  
  image {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
  }
  
  .mutual-badge {
    position: absolute;
    bottom: -8rpx;
    right: -8rpx;
    background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
    color: #fff;
    font-size: 20rpx;
    padding: 4rpx 8rpx;
    border-radius: 12rpx;
    border: 2rpx solid #fff;
  }
}

.user-info {
  flex: 1;
  
  .user-nickname {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 8rpx;
  }
  
  .user-bio {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin-bottom: 12rpx;
    @include ellipsis(1);
  }
  
  .user-stats {
    @include flex(row, flex-start, center);
    margin-bottom: 8rpx;
    
    .stat-item {
      font-size: $font-size-xs;
      color: $text-tertiary;
      margin-right: 24rpx;
    }
  }
  
  .follow-time {
    font-size: $font-size-xs;
    color: $text-tertiary;
  }
}

.user-action {
  .mutual-icon {
    width: 60rpx;
    height: 60rpx;
    @include center;
    background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
    border-radius: 50%;
    
    .iconfont {
      font-size: 32rpx;
      color: #fff;
    }
  }
}

/* 空状态 */
.empty-container {
  @include center;
  flex-direction: column;
  padding: 120rpx 40rpx;
  
  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 40rpx;
    opacity: 0.6;
  }
  
  .empty-text {
    font-size: $font-size-lg;
    color: $text-secondary;
    margin-bottom: 16rpx;
  }
  
  .empty-tip {
    font-size: $font-size-sm;
    color: $text-tertiary;
  }
}

/* 加载状态 */
.loading-container {
  @include center;
  flex-direction: column;
  padding: 60rpx;
  
  .loading-spinner {
    width: 60rpx;
    height: 60rpx;
    border: 4rpx solid $border-color;
    border-top-color: $primary-color;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20rpx;
  }
  
  .loading-text {
    font-size: $font-size-sm;
    color: $text-secondary;
  }
}

.load-more, .no-more {
  @include center;
  padding: 40rpx;
  
  .load-more-text, .no-more-text {
    font-size: $font-size-sm;
    color: $text-tertiary;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
