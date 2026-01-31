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
          <text class="tab-text">关注 {{ followingCount || 0 }}</text>
          <view class="tab-indicator" v-if="currentTab === 'following'"></view>
        </view>
        <view 
          :class="['tab-item', { active: currentTab === 'followers' }]"
          @tap="switchTab('followers')"
        >
          <text class="tab-text">粉丝 {{ followersCount || 0 }}</text>
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
          class="content-container" 
          @scrolltolower="loadMore('following')"
          refresher-enabled 
          :refresher-triggered="refreshing && currentTab === 'following'" 
          @refresherrefresh="refreshFollowing"
        >
          <view class="card-list" v-if="followingList.length > 0">
            <UserCard
              v-for="(user, index) in followingList"
              :key="user.id"
              :user="user"
              :showFollowTime="true"
              @follow-click="handleFollowClick"
              @follow-success="handleFollowSuccess"
              @follow-error="handleFollowError"
              @click="handleUserCardClick"
            />
          </view>
          
          <!-- 空状态 -->
          <view class="empty-container" v-else>
            <image class="empty-image" src="/static/images/common/empty-follow.png" mode="aspectFit"></image>
            <text class="empty-text">{{ loading ? '加载中...' : '暂无关注用户' }}</text>
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
          class="content-container" 
          @scrolltolower="loadMore('followers')"
          refresher-enabled 
          :refresher-triggered="refreshing && currentTab === 'followers'" 
          @refresherrefresh="refreshFollowers"
        >
          <view class="card-list" v-if="followersList.length > 0">
            <UserCard
              v-for="user in followersList"
              :key="user.id"
              :user="user"
              :showFollowTime="false"
              @follow-click="handleFollowClick"
              @follow-success="handleFollowSuccess"
              @follow-error="handleFollowError"
              @click="handleUserCardClick"
            />
          </view>
          
          <!-- 空状态 -->
          <view class="empty-container" v-else>
            <image class="empty-image" src="/static/images/common/empty-follow.png" mode="aspectFit"></image>
            <text class="empty-text">{{ loading ? '加载中...' : '暂无粉丝' }}</text>
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
import { useFollowStore } from '@/stores/followStore';

export default {
  components: {
    UserCard
  },
  data() {
    return {
      userId: '',
      currentTab: 'following',
      tabIndex: 0,
      followStore: null, // Pinia store引用
      followingOperations: new Set(), // 正在进行的关注操作，防止重复
      
      // 关注列表
      followingList: [],
      followingPage: 1,
      followingPageSize: 20,
      followingHasMore: true,
      followingCount: 0,
      
      // 粉丝列表
      followersList: [],
      followersPage: 1,
      followersPageSize: 20,
      followersHasMore: true,
      followersCount: 0,
      
      // 统一加载状态
      loading: false,
      refreshing: false,
      
      // 页面销毁标识
      isDestroyed: false
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

    // 初始化Pinia store
    this.followStore = useFollowStore();

    this.loadData();
  },
  
  onUnload() {
    // 标记页面已销毁，阻止后续的状态更新
    this.isDestroyed = true;
    
    // 清理资源，防止内存泄漏
    this.followingList = [];
    this.followersList = [];
    this.loading = false;
    this.refreshing = false;

  },
  
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 切换标签页
    async switchTab(tab) {
      if (this.currentTab === tab) return; // 避免重复切换
      
      this.currentTab = tab;
      this.tabIndex = tab === 'following' ? 0 : 1;
      
      // 切换标签页时重新更新用户状态
      await this.updateCurrentTabFollowStatus();
    },
    
    // 滑动切换
    async handleSwiperChange(e) {
      const index = e.detail.current;
      const newTab = index === 0 ? 'following' : 'followers';
      
      if (this.currentTab === newTab) return; // 避免重复切换
      
      this.tabIndex = index;
      this.currentTab = newTab;
      
      // 切换标签页时重新更新用户状态
      await this.updateCurrentTabFollowStatus();
    },
    
    // 更新当前标签页的关注状态
    async updateCurrentTabFollowStatus() {
      try {
        if (this.currentTab === 'following' && this.followingList.length > 0) {
          await this.updateUsersFollowStatus(this.followingList);
        } else if (this.currentTab === 'followers' && this.followersList.length > 0) {
          await this.updateUsersFollowStatus(this.followersList);
        }
      } catch (error) {
        console.error('更新标签页关注状态失败:', error);
      }
    },
    
    // 加载数据（使用合并API）
    async loadData() {
      if (this.loading || this.isDestroyed) return;

      this.loading = true;
      
      try {

        // 测试模式下可以启用模拟数据 (目前已禁用)
        /* 
        if (process.env.NODE_ENV === 'development' && false) {
          // 模拟数据已禁用
        }
        */
        
        // 使用合并API一次性获取关注和粉丝数据
        const response = this.userId 
          ? await this.$api.follow.getUserFollowData(this.userId, {
              followingPage: this.followingPage,
              followingPageSize: this.followingPageSize,
              followersPage: this.followersPage,
              followersPageSize: this.followersPageSize
            })
          : await this.$api.follow.getMyFollowData({
              followingPage: this.followingPage,
              followingPageSize: this.followingPageSize,
              followersPage: this.followersPage,
              followersPageSize: this.followersPageSize
            });

        await this.handleDataResponse(response);
      } catch (error) {
        console.error('加载数据失败:', error);
        if (!this.isDestroyed) {
          uni.showToast({
            title: '网络错误，请重试',
            icon: 'none'
          });
        }
      } finally {
        if (!this.isDestroyed) {
          this.loading = false;
          this.refreshing = false;
        }
      }
    },

    // 处理数据响应
    async handleDataResponse(response) {
      // 检查页面是否已销毁
      if (this.isDestroyed) {

        return;
      }

      if (response.success) {
        const { following, followers, summary } = response.data;

        // 关键修复：先处理关注状态，再设置列表数据（避免时序问题）
        const followingUsers = following.list || [];
        const followersUsers = followers.list || [];
        
        // 先为数据添加关注状态
        if (followingUsers.length > 0 && !this.isDestroyed) {

          await this.updateUsersFollowStatus(followingUsers);
        }
        
        if (followersUsers.length > 0 && !this.isDestroyed) {

          await this.updateUsersFollowStatus(followersUsers);
        }
        
        // 状态处理完成后，再设置列表数据（这样组件渲染时就有正确状态了）
        if (this.followingPage === 1) {
          this.followingList = followingUsers;
        } else {
          this.followingList = [...this.followingList, ...followingUsers];
        }
        
        if (this.followersPage === 1) {
          this.followersList = followersUsers;
        } else {
          this.followersList = [...this.followersList, ...followersUsers];
        }
        
        // 更新分页状态
        this.followingHasMore = followingUsers.length >= this.followingPageSize;
        this.followersHasMore = followersUsers.length >= this.followersPageSize;
        
        // 更新总数
        this.followingCount = summary.followingTotal || 0;
        this.followersCount = summary.followersTotal || 0;


      } else {
        if (!this.isDestroyed) {
          uni.showToast({
            title: response.message || '加载失败',
            icon: 'none'
          });
        }
      }
    },
    
    // 刷新关注列表
    refreshFollowing() {
      this.refreshing = true;
      this.followingPage = 1;
      this.followersPage = 1;
      this.loadData();
    },
    
    // 刷新粉丝列表
    refreshFollowers() {
      this.refreshing = true;
      this.followingPage = 1;
      this.followersPage = 1;
      this.loadData();
    },
    
    // 加载更多
    loadMore(type) {
      if (type === 'following' && this.followingHasMore) {
        this.followingPage++;
        this.loadData();
      } else if (type === 'followers' && this.followersHasMore) {
        this.followersPage++;
        this.loadData();
      }
    },
    
    // 更新用户关注状态（简化版本）
    async updateUsersFollowStatus(users) {
      if (!users || users.length === 0 || !this.followStore) return;

      try {
        // 获取需要查询状态的用户ID
        const userIds = users.map(user => user.id).filter(Boolean);
        const unknownUserIds = userIds.filter(userId => 
          this.followStore.followMap[userId] === undefined
        );

        // 如果有未知状态的用户，先批量查询
        if (unknownUserIds.length > 0) {

          await this.followStore.batchCheckFollowStatus(unknownUserIds);
        }
        
        // 从store获取关注状态并更新用户数据
        users.forEach(user => {
          if (user && user.id) {
            user.isFollowing = this.followStore.isFollowing(user.id);

          }
        });

      } catch (error) {
        console.error('从store获取关注状态失败:', error);
      }
    },

    // 处理关注按钮点击事件（使用Pinia store
    async handleFollowClick(data) {

      const { userId, currentStatus, action, user } = data;

      // 验证userId
      if (!userId || userId === 'undefined') {
        console.error('❌ Follow页面: userId无效', userId);
        return;
      }
      
      // 防止重复操作
      const operationKey = `${userId}-${action}`;
      if (this.followingOperations.has(operationKey)) {
        console.warn('⚠️ 操作正在进行中，跳过重复请求:', operationKey);
        return;
      }
      
      if (!this.followStore) {
        console.error('Pinia store未初始化');
        return;
      }

      // 添加到操作集合
      this.followingOperations.add(operationKey);

      try {

        // 乐观更新UI
        this.updateUserInLists(userId, { isFollowing: !currentStatus });
        
        // 使用Pinia store进行关注/取消关注
        const success = action === 'follow' 
          ? await this.followStore.followUser(userId)
          : await this.followStore.unfollowUser(userId);
        
        if (success) {
          // 触发成功事件
          this.handleFollowSuccess({
            userId,
            isFollowing: !currentStatus,
            action
          });
          
          uni.showToast({
            title: action === 'follow' ? '关注成功' : '已取消关注',
            icon: 'success'
          });
        } else {
          // 失败时回滚UI状态
          this.updateUserInLists(userId, { isFollowing: currentStatus });
          
          this.handleFollowError({
            userId,
            action,
            message: this.followStore.error || '操作失败'
          });
          
          uni.showToast({
            title: this.followStore.error || `${action === 'follow' ? '关注' : '取消关注'}失败`,
            icon: 'none'
          });
        }
      } catch (error) {
        console.error(`${action}操作失败:`, error);
        
        // 失败时回滚UI状态
        this.updateUserInLists(userId, { isFollowing: currentStatus });
        
        this.handleFollowError({
          userId,
          action,
          error
        });
        
        uni.showToast({
          title: `${action === 'follow' ? '关注' : '取消关注'}失败`,
          icon: 'none'
        });
      } finally {
        // 清理操作标记
        this.followingOperations.delete(operationKey);

      }
    },

    // 处理关注成功事件（从UserCard组件触发）
    handleFollowSuccess(data) {
      const { userId, isFollowing } = data;

    },

    // 处理关注失败事件
    handleFollowError(data) {
      console.error('关注操作失败:', data);
    },

    // 更新列表中指定用户的数据
    updateUserInLists(userId, updates) {
      // 更新关注列表
      const followingUser = this.followingList.find(user => user.id === userId);
      if (followingUser) {
        Object.assign(followingUser, updates);
      }
      
      // 更新粉丝列表
      const followerUser = this.followersList.find(user => user.id === userId);
      if (followerUser) {
        Object.assign(followerUser, updates);
      }
    },
    
    // 处理用户卡片点击事件
    handleUserCardClick(user) {
      if (user && user.id) {
        this.goToUserProfile(user.id);
      }
    },
    
    // 跳转到用户主页
    goToUserProfile(userId) {
      uni.navigateTo({
        url: `/pages/user/user-profile?id=${userId}`
      });
    },

    // 处理关注成功
    handleFollowSuccess(data) {

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
  position: relative;
  height: 100vh;
  background-color: $bg-page;
  overflow-x: hidden;
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
  position: fixed;
  top: 88rpx;
  left: 0;
  right: 0;
  z-index: 100;
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
  position: absolute;
  top: 161rpx;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(100vh - 161rpx);
}

.swiper-item {
  height: 100%;
  position: relative;
}

.content-container {
  height: calc(100vh - 161rpx);
  padding: 0;
  box-sizing: border-box;
}

.card-list {
  padding: 16rpx 0 30rpx;
  min-height: 100%;
}

/* 第一个用户卡片减少顶部间距 */
.card-list .user-card:first-child {
  margin-top: 0;
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
