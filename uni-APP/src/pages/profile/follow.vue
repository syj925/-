<template>
  <view class="follow-page">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @tap="goBack">
        <text class="iconfont icon-arrow-left"></text>
      </view>
      <view class="nav-title">{{ pageTitle }}</view>
      <view class="nav-right"></view>
    </view>
    
    <!-- 标签页 -->
    <view class="tabs-container">
      <view class="tabs">
        <view 
          :class="['tab-item', { active: currentTab === 'following' }]"
          @tap="switchTab('following')"
        >
          <text class="tab-text">关注 {{ followingCount }}</text>
          <view class="tab-indicator" v-if="currentTab === 'following'"></view>
        </view>
        <view 
          :class="['tab-item', { active: currentTab === 'followers' }]"
          @tap="switchTab('followers')"
        >
          <text class="tab-text">粉丝 {{ followersCount }}</text>
          <view class="tab-indicator" v-if="currentTab === 'followers'"></view>
        </view>
      </view>
    </view>
    
    <!-- 内容区 -->
    <swiper 
      class="content-swiper" 
      :current="tabIndex" 
      @change="handleSwiperChange"
      :duration="300"
    >
      <!-- 关注列表 -->
      <swiper-item class="swiper-item">
        <scroll-view 
          scroll-y 
          class="scroll-view" 
          @scrolltolower="loadMore('following')"
          refresher-enabled 
          :refresher-triggered="followingRefreshing" 
          @refresherrefresh="refreshFollowing"
        >
          <view class="user-list" v-if="followingList.length > 0">
            <UserCard
              v-for="(user, index) in followingList"
              :key="user.id"
              :user="user"
              :showFollowTime="true"
              @follow-success="handleFollowSuccess"
              @follow-error="handleFollowError"
            />
          </view>
          
          <!-- 空状态 -->
          <view class="empty-container" v-else>
            <image class="empty-image" src="/static/images/common/empty-follow.png" mode="aspectFit"></image>
            <text class="empty-text">{{ followingLoading ? '加载中...' : '暂无关注用户' }}</text>
          </view>
          
          <!-- 加载更多 -->
          <view class="load-more" v-if="followingHasMore && followingList.length > 0">
            <text class="load-more-text">正在加载更多...</text>
          </view>
        </scroll-view>
      </swiper-item>
      
      <!-- 粉丝列表 -->
      <swiper-item class="swiper-item">
        <scroll-view 
          scroll-y 
          class="scroll-view" 
          @scrolltolower="loadMore('followers')"
          refresher-enabled 
          :refresher-triggered="followersRefreshing" 
          @refresherrefresh="refreshFollowers"
        >
          <view class="user-list" v-if="followersList.length > 0">
            <UserCard
              v-for="user in followersList"
              :key="user.id"
              :user="user"
              :showFollowTime="false"
              @follow-success="handleFollowSuccess"
              @follow-error="handleFollowError"
            />
          </view>
          
          <!-- 空状态 -->
          <view class="empty-container" v-else>
            <image class="empty-image" src="/static/images/common/empty-follow.png" mode="aspectFit"></image>
            <text class="empty-text">{{ followersLoading ? '加载中...' : '暂无粉丝' }}</text>
          </view>
          
          <!-- 加载更多 -->
          <view class="load-more" v-if="followersHasMore && followersList.length > 0">
            <text class="load-more-text">正在加载更多...</text>
          </view>
        </scroll-view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script>
import UserCard from '@/components/UserCard.vue';

export default {
  components: {
    UserCard
  },
  data() {
    return {
      userId: '',
      currentTab: 'following',
      tabIndex: 0,
      
      // 关注列表
      followingList: [],
      followingPage: 1,
      followingPageSize: 20,
      followingHasMore: true,
      followingRefreshing: false,
      followingLoading: false,
      followingCount: 0,
      
      // 粉丝列表
      followersList: [],
      followersPage: 1,
      followersPageSize: 20,
      followersHasMore: true,
      followersRefreshing: false,
      followersLoading: false,
      followersCount: 0
    };
  },
  
  computed: {
    pageTitle() {
      return this.currentTab === 'following' ? '关注列表' : '粉丝列表';
    }
  },
  
  onLoad(options) {
    // 如果没有传userId，则查看当前用户自己的关注/粉丝
    this.userId = options.userId || '';
    this.currentTab = options.type || 'following';
    this.tabIndex = this.currentTab === 'following' ? 0 : 1;

    this.loadData();
  },
  
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 切换标签页
    switchTab(tab) {
      this.currentTab = tab;
      this.tabIndex = tab === 'following' ? 0 : 1;
    },
    
    // 滑动切换
    handleSwiperChange(e) {
      const index = e.detail.current;
      this.tabIndex = index;
      this.currentTab = index === 0 ? 'following' : 'followers';
    },
    
    // 加载数据
    loadData() {
      if (this.currentTab === 'following') {
        this.loadFollowing();
      } else {
        this.loadFollowers();
      }
    },
    
    // 加载关注列表
    async loadFollowing() {
      if (this.followingLoading) return;

      this.followingLoading = true;

      try {
        // 根据是否有userId参数决定调用哪个API
        const response = this.userId
          ? await this.$api.follow.getUserFollowings(this.userId, this.followingPage, this.followingPageSize)
          : await this.$api.follow.getMyFollowings(this.followingPage, this.followingPageSize);

        if (response.success) {
          const newData = response.data.list || [];

          if (this.followingPage === 1) {
            this.followingList = newData;
          } else {
            this.followingList = [...this.followingList, ...newData];
          }

          // 批量检查关注状态
          if (newData.length > 0) {
            await this.batchCheckFollowStatus(newData);
          }

          this.followingHasMore = newData.length >= this.followingPageSize;
          this.followingCount = response.data.pagination?.total || this.followingList.length;
        } else {
          uni.showToast({
            title: response.message || '加载失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('加载关注列表失败:', error);
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      } finally {
        this.followingLoading = false;
        this.followingRefreshing = false;
      }
    },
    
    // 加载粉丝列表
    async loadFollowers() {
      if (this.followersLoading) return;

      this.followersLoading = true;

      try {
        // 根据是否有userId参数决定调用哪个API
        const response = this.userId
          ? await this.$api.follow.getUserFollowers(this.userId, this.followersPage, this.followersPageSize)
          : await this.$api.follow.getMyFollowers(this.followersPage, this.followersPageSize);

        if (response.success) {
          const newData = response.data.list || [];

          if (this.followersPage === 1) {
            this.followersList = newData;
          } else {
            this.followersList = [...this.followersList, ...newData];
          }

          // 批量检查关注状态
          if (newData.length > 0) {
            await this.batchCheckFollowStatus(newData);
          }

          this.followersHasMore = newData.length >= this.followersPageSize;
          this.followersCount = response.data.pagination?.total || this.followersList.length;
        } else {
          uni.showToast({
            title: response.message || '加载失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('加载粉丝列表失败:', error);
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      } finally {
        this.followersLoading = false;
        this.followersRefreshing = false;
      }
    },
    
    // 刷新关注列表
    refreshFollowing() {
      this.followingRefreshing = true;
      this.followingPage = 1;
      this.loadFollowing();
    },
    
    // 刷新粉丝列表
    refreshFollowers() {
      this.followersRefreshing = true;
      this.followersPage = 1;
      this.loadFollowers();
    },
    
    // 加载更多
    loadMore(type) {
      if (type === 'following' && this.followingHasMore) {
        this.followingPage++;
        this.loadFollowing();
      } else if (type === 'followers' && this.followersHasMore) {
        this.followersPage++;
        this.loadFollowers();
      }
    },
    
    // 切换关注状态
    async toggleFollow(user) {
      if (!user || !user.id) return;

      // 检查登录状态
      const userInfo = uni.getStorageSync('userInfo');
      if (!userInfo || !userInfo.token) {
        uni.showModal({
          title: '提示',
          content: '请先登录',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/auth/login'
              });
            }
          }
        });
        return;
      }

      const originalStatus = user.isFollowing;
      const action = originalStatus ? '取消关注' : '关注';

      try {
        // 乐观更新UI
        user.isFollowing = !originalStatus;

        // 调用API
        const response = originalStatus
          ? await this.$api.follow.unfollow(user.id)
          : await this.$api.follow.follow(user.id);

        if (response.success) {
          uni.showToast({
            title: originalStatus ? '已取消关注' : '关注成功',
            icon: 'success'
          });

          // 更新计数
          if (originalStatus) {
            this.followingCount = Math.max(0, this.followingCount - 1);
          } else {
            this.followingCount += 1;
          }
        } else {
          // 恢复原状态
          user.isFollowing = originalStatus;
          uni.showToast({
            title: response.message || `${action}失败`,
            icon: 'none'
          });
        }
      } catch (error) {
        // 恢复原状态
        user.isFollowing = originalStatus;
        console.error(`${action}失败:`, error);
        uni.showToast({
          title: `${action}失败，请重试`,
          icon: 'none'
        });
      }
    },

    // 批量检查关注状态
    async batchCheckFollowStatus(users) {
      if (!users || users.length === 0) return;

      try {
        const userIds = users.map(user => user.id);
        const response = await this.$api.follow.batchCheckFollow(userIds);

        if (response.success) {
          const followStatusMap = response.data;

          // 更新用户的关注状态
          users.forEach(user => {
            if (followStatusMap.hasOwnProperty(user.id)) {
              user.isFollowing = followStatusMap[user.id];
            }
          });
        }
      } catch (error) {
        console.error('批量检查关注状态失败:', error);
        // 不显示错误提示，因为这不是关键功能
      }
    },
    
    // 跳转到用户主页
    goToUserProfile(userId) {
      uni.navigateTo({
        url: `/pages/profile/profile?userId=${userId}`
      });
    },

    // 处理关注成功
    handleFollowSuccess(data) {
      console.log('关注操作成功:', data);

      // 更新对应列表中的用户数据
      if (data.action === 'follow') {
        // 如果是关注操作，更新关注数
        this.followingCount += 1;
      } else {
        // 如果是取消关注操作，更新关注数
        this.followingCount = Math.max(0, this.followingCount - 1);

        // 从关注列表中移除该用户
        if (this.currentTab === 'following') {
          this.followingList = this.followingList.filter(user => user.id !== data.userId);
        }
      }
    },

    // 处理关注失败
    handleFollowError(data) {
      console.error('关注操作失败:', data);
      // 错误处理已在组件内部完成，这里可以做额外的处理
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.follow-page {
  height: 100vh;
  background-color: $bg-page;
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

/* 标签页 */
.tabs-container {
  margin-top: 88rpx;
  background-color: #fff;
  border-bottom: 1rpx solid $border-color;
}

.tabs {
  @include flex(row, center, center);
}

.tab-item {
  @include flex(column, center, center);
  position: relative;
  padding: 24rpx 0;
  flex: 1;
  transition: all 0.3s;

  &.active {
    .tab-text {
      color: $primary-color;
      font-weight: 600;
    }
  }
}

.tab-text {
  font-size: $font-size-base;
  color: $text-secondary;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 6rpx;
  background: $primary-color;
  border-radius: 3rpx;
}

/* 内容区 */
.content-swiper {
  margin-top: 176rpx;
  height: calc(100vh - 176rpx);
}

.swiper-item {
  height: 100%;
}

.scroll-view {
  height: 100%;
  padding: 20rpx;
}

/* 用户列表 */
.user-list {
  padding-bottom: 40rpx;
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
}

/* 加载更多 */
.load-more {
  @include center;
  padding: 40rpx;

  .load-more-text {
    font-size: $font-size-sm;
    color: $text-tertiary;
  }
}
</style>
