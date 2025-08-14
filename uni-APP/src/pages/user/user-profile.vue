<template>
  <view class="user-profile">
    <!-- 顶部悬浮操作栏（对齐 profile.vue 风格） -->
    <view class="top-action-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="action-btn" @click="goBack">
        <app-icon name="arrow-left" size="sm" color="#fff" />
      </view>
      <view class="action-title">{{ userInfo.nickname || userInfo.username || '用户主页' }}</view>
      <view class="action-btn" @click="showMoreActions">
        <app-icon name="more" size="sm" color="#fff" />
      </view>
    </view>

    <!-- 页面内容 -->
    <scroll-view 
      class="content-scroll" 
      scroll-y 
      :style="{ height: scrollViewHeight + 'px' }"
      @scrolltolower="loadMorePosts"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 用户信息卡片（参考 profile.vue 的头部视觉） -->
      <view class="user-profile-header" v-if="!loading">
        <!-- 顶部背景区域 -->
        <view class="header-background">
          <!-- 背景图片或渐变 -->
          <image
            v-if="userInfo.background_image && !safeBackgroundUrl.includes('gradient')"
            class="profile-bg"
            :src="safeBackgroundUrl"
            mode="aspectFill"
          ></image>
          <view
            v-else
            class="bg-primary gradient-bg"
            :style="{ background: safeBackgroundUrl }"
          ></view>
          <view class="profile-overlay"></view>
          <view class="bg-decoration">
            <view class="decoration-circle circle-1"></view>
            <view class="decoration-circle circle-2"></view>
            <view class="decoration-circle circle-3"></view>
          </view>
          <!-- 背景与内容边界模糊过渡 -->
          <view class="bg-bottom-blur"></view>
        </view>

        <!-- 信息行：头像 + 基本信息（与个人主页一致，右侧展示文字） -->
        <view class="header-info-row">
          <!-- 用户头像区域 -->
          <view class="avatar-section">
            <view class="avatar-wrapper">
              <view class="avatar-ring">
                <image
                  :src="safeAvatarUrl"
                  class="user-avatar"
                  mode="aspectFill"
                />
              </view>
              <view class="avatar-status" v-if="userInfo.isOnline">
                <view class="status-dot"></view>
              </view>
              <view class="avatar-border"></view>
              <view class="avatar-glow"></view>
            </view>
          </view>

          <!-- 用户信息区域 -->
          <view class="user-info-section">
            <view class="user-name-area">
              <text class="display-name">{{ userInfo.nickname || userInfo.username }}</text>
              <text class="username-text" v-if="userInfo.nickname">@{{ userInfo.username }}</text>
            </view>

            <view class="user-bio-area" v-if="userInfo.bio">
              <text class="bio-text">{{ userInfo.bio }}</text>
            </view>

            <view class="user-meta-area">
              <view class="meta-tag" v-if="userInfo.school">
                <text class="meta-icon">🏫</text>
                <text class="meta-text">{{ userInfo.school }}</text>
              </view>
              <view class="meta-tag" v-if="userInfo.department">
                <text class="meta-icon">🏢</text>
                <text class="meta-text">{{ userInfo.department }}</text>
              </view>
              <view class="meta-tag">
                <text class="meta-icon">📅</text>
                <text class="meta-text">{{ formatJoinDate(userInfo.createdAt) }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 统计数据卡片 -->
        <view class="stats-cards">
          <view class="stats-grid">
            <view class="stat-card" @click="showFollowList('posts')">
              <view class="stat-icon"><app-icon name="edit" size="sm" color="#667eea" /></view>
              <view class="stat-content">
                <text class="stat-number">{{ userInfo.stats?.postCount || 0 }}</text>
                <text class="stat-label">帖子</text>
              </view>
            </view>

            <view class="stat-card" @click="showFollowList('likes')">
              <view class="stat-icon"><app-icon name="heart" size="sm" color="#ff6b6b" /></view>
              <view class="stat-content">
                <text class="stat-number">{{ userInfo.stats?.likeCount || 0 }}</text>
                <text class="stat-label">获赞</text>
              </view>
            </view>

            <view class="stat-card" @click="showFollowList('following')">
              <view class="stat-icon"><app-icon name="users" size="sm" color="#5b8ef9" /></view>
              <view class="stat-content">
                <text class="stat-number">{{ userInfo.stats?.followCount || 0 }}</text>
                <text class="stat-label">关注</text>
              </view>
            </view>

            <view class="stat-card" @click="showFollowList('followers')">
              <view class="stat-icon"><app-icon name="star" size="sm" color="#ffb800" /></view>
              <view class="stat-content">
                <text class="stat-number">{{ userInfo.stats?.fansCount || 0 }}</text>
                <text class="stat-label">粉丝</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 操作按钮区域 -->
        <view class="action-section" v-if="!userInfo.followStatus?.isCurrentUser">
          <view class="action-buttons">
            <button
              class="primary-action-btn"
              :class="{ 'followed': userInfo.followStatus?.isFollowed }"
              @click="toggleFollow"
              :loading="followLoading"
            >
              <view class="btn-content">
                <text class="btn-icon" :class="followButtonIcon"></text>
                <text class="btn-text">{{ followButtonText }}</text>
              </view>
            </button>

            <button class="secondary-action-btn" @click="sendMessage">
              <view class="btn-content">
                <text class="btn-icon">💬</text>
                <text class="btn-text">私信</text>
              </view>
            </button>
          </view>
        </view>
      </view>
      
      <!-- 帖子列表标题 -->
      <view class="posts-section" v-if="!loading">
        <view class="section-header">
          <view class="section-title">
            <text class="title-text">动态</text>
            <view class="title-decoration"></view>
          </view>

          <view class="filter-tabs">
            <view
              class="filter-tab"
              :class="{ 'active': currentTab === 'latest' }"
              @click="switchTab('latest')"
            >
              <text class="tab-text">最新</text>
              <view class="tab-indicator" v-if="currentTab === 'latest'"></view>
            </view>
            <view
              class="filter-tab"
              :class="{ 'active': currentTab === 'hot' }"
              @click="switchTab('hot')"
            >
              <text class="tab-text">热门</text>
              <view class="tab-indicator" v-if="currentTab === 'hot'"></view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 帖子列表 -->
      <view class="posts-container">
        <post-card
          v-for="post in postList"
          :key="post.id"
          :post="post"
          @like="handleLike"
          @comment="handleComment"
          @favorite="handleFavorite"
          @click="goToPostDetail"
        />
        
        <!-- 加载更多 -->
        <view class="load-more" v-if="postList.length > 0">
          <text v-if="loadingMore">加载中...</text>
          <text v-else-if="noMorePosts">没有更多了</text>
          <text v-else @click="loadMorePosts">点击加载更多</text>
        </view>
        
        <!-- 空状态 -->
        <view class="empty-state" v-if="!loading && postList.length === 0">
          <image src="/static/images/empty-posts.png" class="empty-image" />
          <text class="empty-text">还没有发布任何帖子</text>
        </view>
      </view>
    </scroll-view>
    
    <!-- 加载状态 -->
    <view class="loading-container" v-if="loading">
      <view class="loading-skeleton">
        <!-- 骨架屏主卡片 -->
        <view class="skeleton-card">
          <view class="skeleton-content">
            <view class="skeleton-avatar"></view>
            <view class="skeleton-info">
              <view class="skeleton-line name"></view>
              <view class="skeleton-line username"></view>
              <view class="skeleton-line bio"></view>
            </view>
            <view class="skeleton-meta">
              <view class="skeleton-tag" v-for="i in 3" :key="i"></view>
            </view>
          </view>
        </view>

        <!-- 骨架屏统计卡片 -->
        <view class="skeleton-stats">
          <view class="skeleton-stat" v-for="i in 4" :key="i">
            <view class="skeleton-icon"></view>
            <view class="skeleton-number"></view>
            <view class="skeleton-label"></view>
          </view>
        </view>

        <!-- 骨架屏按钮 -->
        <view class="skeleton-buttons">
          <view class="skeleton-button"></view>
          <view class="skeleton-button"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import PostCard from '@/components/post/PostCard.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { userApi, followApi } from '@/api'
import { ensureAbsoluteUrl } from '@/utils/url'

export default {
  name: 'UserProfile',
  components: {
    PostCard,
    AppIcon
  },
  data() {
    return {
      statusBarHeight: 0,
      scrollViewHeight: 0,
      userId: '',
      userInfo: {},
      postList: [],
      currentTab: 'latest',
      loading: true,
      refreshing: false,
      loadingMore: false,
      followLoading: false,
      noMorePosts: false,
      currentPage: 1,
      pageSize: 10
    }
  },
  computed: {
    followButtonIcon() {
      if (this.userInfo.followStatus?.isFollowed) {
        return this.userInfo.followStatus?.isMutualFollow ? 'icon-heart-fill' : 'icon-user-minus'
      }
      return 'icon-user-plus'
    },
    followButtonText() {
      if (this.userInfo.followStatus?.isFollowed) {
        return this.userInfo.followStatus?.isMutualFollow ? '互相关注' : '已关注'
      }
      return '关注'
    },
    safeAvatarUrl() {
      if (!this.userInfo.avatar) {
        return '/static/images/common/default-avatar.png'
      }
      return ensureAbsoluteUrl(this.userInfo.avatar)
    },
    safeBackgroundUrl() {
      if (!this.userInfo.background_image) {
        return 'linear-gradient(135deg, #2b85e4 0%, #6ba7f0 100%)'
      }
      return ensureAbsoluteUrl(this.userInfo.background_image)
    }
  },
  onLoad(options) {
    this.userId = options.id
    this.initPage()
  },
  onReady() {
    this.calculateScrollViewHeight()
  },
  methods: {
    initPage() {
      // 获取状态栏高度
      const systemInfo = uni.getSystemInfoSync()
      this.statusBarHeight = systemInfo.statusBarHeight || 0
      
      // 加载用户信息和帖子
      this.loadUserProfile()
      this.loadUserPosts()
    },
    
    calculateScrollViewHeight() {
      const systemInfo = uni.getSystemInfoSync()
      const navbarHeight = this.statusBarHeight + 44 // 导航栏高度
      this.scrollViewHeight = systemInfo.windowHeight - navbarHeight
    },
    
    async loadUserProfile() {
      try {
        const response = await userApi.getUserProfile(this.userId)
        if (response.code === 0) {
          this.userInfo = response.data
        } else {
          uni.showToast({
            title: response.msg || '获取用户信息失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        uni.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
      }
    },
    
    async loadUserPosts(refresh = false) {
      if (refresh) {
        this.currentPage = 1
        this.noMorePosts = false
      }
      
      try {
        this.loading = refresh ? false : this.currentPage === 1
        this.loadingMore = !refresh && this.currentPage > 1
        
        const response = await userApi.getUserPosts(this.userId, {
          page: this.currentPage,
          pageSize: this.pageSize,
          sort: this.currentTab
        })
        
        if (response.code === 0) {
          const newPosts = response.data.list || []
          
          if (refresh || this.currentPage === 1) {
            this.postList = newPosts
          } else {
            this.postList.push(...newPosts)
          }
          
          // 检查是否还有更多数据
          if (newPosts.length < this.pageSize) {
            this.noMorePosts = true
          }
        } else {
          uni.showToast({
            title: response.msg || '获取帖子失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('获取帖子失败:', error)
        uni.showToast({
          title: '获取帖子失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
        this.loadingMore = false
        // 只有在非刷新模式下才重置 refreshing 状态
        // 刷新模式下的 refreshing 状态由 onRefresh 方法统一管理
        if (!refresh) {
          this.refreshing = false
        }
      }
    },
    
    // 页面交互方法
    goBack() {
      uni.navigateBack()
    },
    
    showMoreActions() {
      uni.showActionSheet({
        itemList: ['举报用户', '拉黑用户'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.reportUser()
          } else if (res.tapIndex === 1) {
            this.blockUser()
          }
        }
      })
    },
    
    async toggleFollow() {
      if (this.followLoading) return
      
      try {
        this.followLoading = true
        const isFollowed = this.userInfo.followStatus?.isFollowed
        
        const response = isFollowed 
          ? await followApi.unfollow(this.userId)
          : await followApi.follow(this.userId)
        
        if (response.code === 0) {
          // 更新关注状态
          this.userInfo.followStatus.isFollowed = !isFollowed
          
          // 更新粉丝数
          if (isFollowed) {
            this.userInfo.stats.fansCount = Math.max(0, this.userInfo.stats.fansCount - 1)
          } else {
            this.userInfo.stats.fansCount += 1
          }
          
          uni.showToast({
            title: isFollowed ? '取消关注成功' : '关注成功',
            icon: 'success'
          })
        } else {
          uni.showToast({
            title: response.msg || '操作失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('关注操作失败:', error)
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        })
      } finally {
        this.followLoading = false
      }
    },
    
    sendMessage() {
      uni.navigateTo({
        url: `/pages/message/chat?userId=${this.userId}&nickname=${this.userInfo.nickname || this.userInfo.username}`
      })
    },
    
    switchTab(tab) {
      if (this.currentTab === tab) return
      
      this.currentTab = tab
      this.currentPage = 1
      this.loadUserPosts(true)
    },
    
    onRefresh() {
      this.refreshing = true
      Promise.all([
        this.loadUserProfile(),
        this.loadUserPosts(true)
      ]).finally(() => {
        this.refreshing = false
      })
    },
    
    loadMorePosts() {
      if (this.loadingMore || this.noMorePosts) return
      
      this.currentPage++
      this.loadUserPosts()
    },
    
    // 帖子交互方法
    handleLike(post) {
      // 处理点赞逻辑
      console.log('点赞帖子:', post.id)
    },
    
    handleComment(post) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${post.id}&focusComment=true`
      })
    },
    
    handleFavorite(post) {
      // 处理收藏逻辑
      console.log('收藏帖子:', post.id)
    },
    
    goToPostDetail(post) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${post.id}`
      })
    },
    
    showFollowList(type) {
      const routes = {
        following: `/pages/follow/following?userId=${this.userId}`,
        followers: `/pages/follow/followers?userId=${this.userId}`,
        posts: '', // 当前页面已经显示帖子
        likes: '' // 可以扩展显示获赞列表
      }
      
      if (routes[type]) {
        uni.navigateTo({
          url: routes[type]
        })
      }
    },
    
    formatJoinDate(dateString) {
      if (!dateString) return ''
      
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      
      return `${year}年${month}月加入`
    },
    
    reportUser() {
      uni.showToast({
        title: '举报功能开发中',
        icon: 'none'
      })
    },
    
    blockUser() {
      uni.showToast({
        title: '拉黑功能开发中',
        icon: 'none'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.user-profile {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
}

/* 顶部悬浮操作栏 */
.top-action-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 24rpx 8rpx;
  background: linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 100%);
  backdrop-filter: blur(12rpx);

  .action-title {
    flex: 1;
    text-align: center;
    font-size: 32rpx;
    color: #fff;
    font-weight: 600;
    text-shadow: 0 2rpx 6rpx rgba(0,0,0,0.25);
  }

  .action-btn {
    width: 72rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 28rpx;
    background: rgba(255,255,255,0.18);
    border: 1rpx solid rgba(255,255,255,0.25);
    box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.12);
    transition: all .2s ease;

    &:active {
      transform: scale(0.95);
      background: rgba(255,255,255,0.28);
    }
  }
}

/* 内容滚动区域 */
.content-scroll {
  padding-top: 88rpx;
}

/* 用户主页头部 */
.user-profile-header {
  position: relative;
  margin: 0 0 24rpx;
  background: transparent;
  border-radius: 0;
  overflow: visible;
  box-shadow: none;

  /* 顶部背景区域 */
  .header-background {
    position: relative;
    height: 360rpx;
    overflow: hidden;

    .profile-bg {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: brightness(0.8);
    }

    .bg-primary {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #2b85e4 0%, #6ba7f0 100%);
    }

    .profile-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.05) 100%);
      z-index: 1;
    }

    .bg-decoration {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;

      .decoration-circle {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);

        &.circle-1 {
          width: 200rpx;
          height: 200rpx;
          top: -100rpx;
          right: -50rpx;
        }

        &.circle-2 {
          width: 120rpx;
          height: 120rpx;
          top: 60rpx;
          right: 80rpx;
          background: rgba(255, 255, 255, 0.05);
        }

        &.circle-3 {
          width: 80rpx;
          height: 80rpx;
          top: -40rpx;
          left: 60rpx;
          background: rgba(255, 255, 255, 0.08);
        }
      }
    }

    .bg-bottom-blur {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 180rpx;
      background: linear-gradient(to top,
        rgba(255, 255, 255, 0.75) 0%,
        rgba(255, 255, 255, 0.68) 15%,
        rgba(255, 255, 255, 0.58) 30%,
        rgba(255, 255, 255, 0.45) 45%,
        rgba(255, 255, 255, 0.32) 60%,
        rgba(255, 255, 255, 0.20) 75%,
        rgba(255, 255, 255, 0.10) 88%,
        transparent 100%);
      pointer-events: none;
    }
  }

  /* 顶部信息行：参照 profile.vue 布局（flex 对齐） */
  .header-info-row {
    display: flex;
    align-items: center; /* 让名字垂直对齐头像中心 */
    padding: 40rpx 30rpx;
    margin-top: -120rpx; /* 接近 profile.vue 的上移高度 */
    position: relative;
    z-index: 2;
    column-gap: 0; /* 使用头像右侧外边距控制间距 */
  }

  /* 头像区域 */
  .avatar-section {
    position: relative;
    display: flex;
    justify-content: flex-start;
    width: 180rpx; /* 与个人主页一致的头像容器宽度 */
    margin-right: 30rpx; /* 与个人主页一致的间距 */
    margin-top: -140rpx; /* 头像上移一点 */
    flex-shrink: 0;
    padding: 0;

    .avatar-wrapper {
      position: relative;

      .avatar-ring {
        position: relative;
        width: 180rpx;
        height: 180rpx;
        border-radius: 90rpx;
        background: linear-gradient(45deg, #667eea, #764ba2);
        padding: 6rpx;
        box-shadow: 0 16rpx 40rpx rgba(102, 126, 234, 0.3);

        .user-avatar {
          width: 168rpx;
          height: 168rpx;
          border-radius: 84rpx;
          border: 4rpx solid #ffffff;
        }
      }

      .avatar-border {
        position: absolute;
        top: -8rpx;
        left: -8rpx;
        right: -8rpx;
        bottom: -8rpx;
        border-radius: 50%;
        border: 3rpx solid rgba(255, 255, 255, 0.6);
        z-index: 3;
        animation: avatarPulse 2s infinite ease-in-out;
      }

      .avatar-glow {
        position: absolute;
        top: -10rpx;
        left: -10rpx;
        right: -10rpx;
        bottom: -10rpx;
        border-radius: 50%;
        background: linear-gradient(45deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1));
        opacity: 0.7;
        z-index: 2;
        animation: avatarGlow 3s infinite ease-in-out;
      }

      .avatar-status {
        position: absolute;
        bottom: 12rpx;
        right: 12rpx;
        width: 32rpx;
        height: 32rpx;
        border-radius: 16rpx;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;

        .status-dot {
          width: 20rpx;
          height: 20rpx;
          border-radius: 10rpx;
          background: #4ade80;
        }
      }
    }
  }

  @keyframes avatarPulse {
    0% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.05); opacity: 0.8; }
    100% { transform: scale(1); opacity: 0.6; }
  }

  @keyframes avatarGlow {
    0% { opacity: 0.7; transform: rotate(0deg); }
    50% { opacity: 0.9; transform: rotate(180deg); }
    100% { opacity: 0.7; transform: rotate(360deg); }
  }

  /* 用户信息区域 */
  .user-info-section {
    /* 占据右侧弹性列，和主页一致排列 */
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-top: 55rpx; /* 整体下移一点 */
    padding: 0;
    text-align: left;
    min-width: 0;
    box-sizing: border-box;

    .user-name-area {
      margin-bottom: 16rpx;
      padding: 0;

      .display-name {
        display: block;
        font-size: 44rpx;
        font-weight: 700;
        color: $text-primary;
        margin-bottom: 8rpx;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .username-text {
        font-size: 28rpx;
        color: $text-secondary;
        opacity: 0.8;
      }
    }

    .user-bio-area {
      margin-bottom: 24rpx;
      padding: 0;

      .bio-text {
        font-size: 28rpx;
        line-height: 1.5;
        color: $text-secondary;
      }
    }

    .user-meta-area {
      display: flex;
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 16rpx;
      padding: 0;
      /* 让标签行部分占用头像下方的空白区域 */
      transform: translateX(-215rpx);
      width: calc(100% + 140rpx);

      .meta-tag {
        display: flex;
        align-items: center;
        gap: 8rpx;
        padding: 12rpx 20rpx;
        background: rgba(102, 126, 234, 0.08);
        border-radius: 20rpx;

        .meta-icon {
          font-size: 24rpx;
        }

        .meta-text {
          font-size: 24rpx;
          color: $text-secondary;
        }
      }
    }
  }

  /* 统计卡片 */
  .stats-cards {
    padding: 0 24rpx 24rpx;

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16rpx;

      .stat-card {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 24rpx;
        padding: 24rpx 16rpx;
        text-align: center;
        transition: all 0.3s ease;
        border: 1rpx solid rgba(102, 126, 234, 0.1);

        &:active {
          transform: translateY(-4rpx);
          box-shadow: 0 12rpx 32rpx rgba(102, 126, 234, 0.15);
        }

        .stat-icon {
          margin-bottom: 12rpx;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-content {
          .stat-number {
            display: block;
            font-size: 32rpx;
            font-weight: 700;
            color: $text-primary;
            margin-bottom: 4rpx;
          }

          .stat-label {
            font-size: 22rpx;
            color: $text-secondary;
            opacity: 0.8;
          }
        }
      }
    }
  }

  /* 操作按钮区域 */
  .action-section {
    padding: 0 40rpx 40rpx;

    .action-buttons {
      display: flex;
      gap: 20rpx;

      .primary-action-btn,
      .secondary-action-btn {
        flex: 1;
        height: 88rpx;
        border-radius: 44rpx;
        border: none;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;

        &:active {
          transform: scale(0.98);
        }

        .btn-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12rpx;
          height: 100%;

          .btn-icon {
            font-size: 28rpx;
          }

          .btn-text {
            font-size: 28rpx;
            font-weight: 600;
          }
        }
      }

      .primary-action-btn {
        background: linear-gradient(135deg, #2b85e4 0%, #6ba7f0 100%);
        color: #ffffff;
        box-shadow: 0 8rpx 24rpx rgba(43, 133, 228, 0.3);

        &.followed {
          background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
          color: $text-primary;
          box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
        }

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        &:active::before {
          left: 100%;
        }
      }

      .secondary-action-btn {
        background: rgba(102, 126, 234, 0.08);
        color: $text-primary;
        border: 2rpx solid rgba(102, 126, 234, 0.2);

        &:active {
          background: rgba(102, 126, 234, 0.15);
        }
      }
    }
  }
}

/* 帖子区域 */
.posts-section {
  margin: 0 24rpx 32rpx;

  .section-header {
    background: #ffffff;
    border-radius: 32rpx;
    padding: 32rpx 40rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);

    .section-title {
      position: relative;
      margin-bottom: 32rpx;

      .title-text {
        font-size: 36rpx;
        font-weight: 700;
        color: $text-primary;
      }

      .title-decoration {
        position: absolute;
        bottom: -8rpx;
        left: 0;
        width: 60rpx;
        height: 6rpx;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 3rpx;
      }
    }

    .filter-tabs {
      display: flex;
      gap: 8rpx;

      .filter-tab {
        position: relative;
        flex: 1;
        height: 72rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 36rpx;
        transition: all 0.3s ease;
        background: rgba(102, 126, 234, 0.05);

        .tab-text {
          font-size: 28rpx;
          font-weight: 500;
          color: $text-secondary;
          transition: all 0.3s ease;
        }

        .tab-indicator {
          position: absolute;
          bottom: -2rpx;
          left: 50%;
          transform: translateX(-50%);
          width: 40rpx;
          height: 6rpx;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 3rpx;
        }

        &.active {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);

          .tab-text {
            color: #667eea;
            font-weight: 600;
          }
        }

        &:active {
          transform: scale(0.98);
        }
      }
    }
  }
}

/* 帖子容器 */
.posts-container {
  padding: 0 24rpx;

  .load-more {
    text-align: center;
    padding: 40rpx 0 60rpx;
    font-size: 28rpx;
    color: $text-secondary;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 20rpx;
    margin: 24rpx 0;
  }

  .empty-state {
    background: #ffffff;
    border-radius: 32rpx;
    padding: 80rpx 40rpx;
    text-align: center;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);

    .empty-image {
      width: 240rpx;
      height: 240rpx;
      margin: 0 auto 32rpx;
      opacity: 0.6;
      filter: grayscale(20%);
    }

    .empty-text {
      font-size: 32rpx;
      color: $text-secondary;
      font-weight: 500;
      margin-bottom: 16rpx;
    }

    &::before {
      content: '🌟';
      display: block;
      font-size: 80rpx;
      margin-bottom: 24rpx;
      opacity: 0.3;
    }
  }
}

/* 加载状态 */
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
  z-index: 999;

  .loading-skeleton {
    padding: 128rpx 24rpx 40rpx;

    .skeleton-card {
      background: #ffffff;
      border-radius: 40rpx;
      overflow: hidden;
      margin-bottom: 32rpx;
      box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.08);

      /* 骨架屏头部背景 */
      &::before {
        content: '';
        display: block;
        height: 240rpx;
        background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
        animation: skeleton-shimmer 1.5s infinite;
      }

      .skeleton-content {
        padding: 40rpx;
        position: relative;
        margin-top: -80rpx;

        .skeleton-avatar {
          width: 160rpx;
          height: 160rpx;
          border-radius: 80rpx;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          margin: 0 auto 32rpx;
          border: 6rpx solid #ffffff;
        }

        .skeleton-info {
          text-align: center;
          margin-bottom: 32rpx;

          .skeleton-line {
            height: 32rpx;
            border-radius: 16rpx;
            background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
            background-size: 200% 100%;
            animation: skeleton-loading 1.5s infinite;
            margin: 0 auto 16rpx;

            &.name {
              width: 200rpx;
              height: 40rpx;
            }

            &.username {
              width: 160rpx;
              height: 28rpx;
            }

            &.bio {
              width: 280rpx;
              height: 24rpx;
            }
          }
        }

        .skeleton-meta {
          display: flex;
          justify-content: center;
          gap: 16rpx;
          margin-bottom: 32rpx;

          .skeleton-tag {
            width: 80rpx;
            height: 32rpx;
            border-radius: 16rpx;
            background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
            background-size: 200% 100%;
            animation: skeleton-loading 1.5s infinite;
          }
        }
      }
    }

    .skeleton-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16rpx;
      margin-bottom: 32rpx;

      .skeleton-stat {
        background: #ffffff;
        border-radius: 24rpx;
        padding: 24rpx 16rpx;
        text-align: center;
        box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);

        .skeleton-icon {
          width: 32rpx;
          height: 32rpx;
          border-radius: 16rpx;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          margin: 0 auto 12rpx;
        }

        .skeleton-number,
        .skeleton-label {
          height: 24rpx;
          border-radius: 12rpx;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          margin: 0 auto 8rpx;
        }

        .skeleton-number {
          height: 32rpx;
          width: 60rpx;
        }

        .skeleton-label {
          width: 40rpx;
        }
      }
    }

    .skeleton-buttons {
      display: flex;
      gap: 20rpx;
      padding: 0 40rpx;

      .skeleton-button {
        flex: 1;
        height: 88rpx;
        border-radius: 44rpx;
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
      }
    }
  }
}

/* 动画效果 */
@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 页面进入动画 */
.user-profile-header {
  animation: fadeInUp 0.6s ease-out;
}

.posts-section {
  animation: fadeInUp 0.6s ease-out 0.1s both;
}

.posts-container {
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

/* 响应式适配 */
@media screen and (max-width: 750rpx) {
  .user-profile-header {
    margin: 32rpx 16rpx 24rpx;
    border-radius: 32rpx;

    .header-background {
      height: 200rpx;
    }

      .header-info-row {
        display: flex;
        align-items: center;
        padding: 30rpx 24rpx;
        margin-top: -100rpx;
      }

      .avatar-section {
        margin: -8rpx 20rpx 0 0; /* 小屏头像稍微上移 */
        padding: 0 0 24rpx;
        width: 140rpx;

      .avatar-wrapper .avatar-ring {
        width: 140rpx;
        height: 140rpx;
        border-radius: 70rpx;

        .user-avatar {
          width: 128rpx;
          height: 128rpx;
          border-radius: 64rpx;
        }
      }
    }

    .user-info-section {
      padding: 0 0 24rpx; /* 左侧与头像对齐 */
      margin-top: 12rpx; /* 小屏同样整体下移 */

      .user-meta-area {
        transform: translateX(-110rpx);
        width: calc(100% + 110rpx);
      }

      .user-name-area .display-name {
        font-size: 36rpx;
      }

      .user-bio-area .bio-text {
        font-size: 26rpx;
      }

      .user-meta-area .meta-tag {
        padding: 8rpx 16rpx;

        .meta-text {
          font-size: 22rpx;
        }
      }
    }

    .stats-cards {
      padding: 0 32rpx 24rpx;

      .stats-grid {
        gap: 12rpx;

        .stat-card {
          padding: 20rpx 12rpx;

          .stat-icon {
            font-size: 28rpx;
          }

          .stat-content {
            .stat-number {
              font-size: 28rpx;
            }

            .stat-label {
              font-size: 20rpx;
            }
          }
        }
      }
    }

    .action-section {
      padding: 0 32rpx 32rpx;

      .action-buttons {
        gap: 16rpx;

        .primary-action-btn,
        .secondary-action-btn {
          height: 76rpx;
          border-radius: 38rpx;

          .btn-content {
            .btn-icon {
              font-size: 24rpx;
            }

            .btn-text {
              font-size: 26rpx;
            }
          }
        }
      }
    }
  }

  .posts-section {
    margin: 0 16rpx 24rpx;

    .section-header {
      padding: 24rpx 32rpx;

      .section-title .title-text {
        font-size: 32rpx;
      }

      .filter-tabs .filter-tab {
        height: 64rpx;

        .tab-text {
          font-size: 26rpx;
        }
      }
    }
  }

  .posts-container {
    padding: 0 16rpx;
  }

  .loading-container .loading-skeleton {
    padding: 128rpx 16rpx 40rpx;

    .skeleton-card .skeleton-content {
      padding: 32rpx;

      .skeleton-avatar {
        width: 120rpx;
        height: 120rpx;
        border-radius: 60rpx;
      }
    }

    .skeleton-stats {
      gap: 12rpx;

      .skeleton-stat {
        padding: 20rpx 12rpx;
      }
    }

    .skeleton-buttons {
      padding: 0 32rpx;
      gap: 16rpx;

      .skeleton-button {
        height: 76rpx;
        border-radius: 38rpx;
      }
    }
  }
}

/* 超小屏幕适配 */
@media screen and (max-width: 600rpx) {
  .user-profile-header {
    .stats-cards .stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 16rpx;

      .stat-card {
        padding: 24rpx 16rpx;
      }
    }

    .action-section .action-buttons {
      flex-direction: column;
      gap: 16rpx;

      .primary-action-btn,
      .secondary-action-btn {
        width: 100%;
      }
    }
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .user-profile {
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  }

  .user-profile-header {
    background: #2d3748;
    box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);

    .header-background {
      .bg-primary {
        background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
      }
    }

    .stats-cards .stats-grid .stat-card {
      background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
      border-color: rgba(255, 255, 255, 0.1);
    }
  }

  .posts-section .section-header {
    background: #2d3748;
  }

  .posts-container .empty-state {
    background: #2d3748;
  }
}
</style>
