<template>
  <view class="topic-container">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="nav-left" @tap="goBack">
          <view class="back-btn">
            <text class="iconfont icon-arrow-left"></text>
          </view>
        </view>
        <view class="nav-center">
          <text class="nav-title">话题详情</text>
        </view>
        <view class="nav-right">
          <view class="share-btn" @tap="shareTopic">
            <text class="iconfont icon-share"></text>
          </view>
        </view>
      </view>
    </view>

    <!-- 话题头部信息 -->
    <view class="topic-header">
      <view class="topic-cover" :style="{ background: getTopicGradient() }">
        <view class="cover-overlay"></view>
        <view class="topic-main-info">
          <view class="topic-icon">
            <text class="topic-hash">#</text>
          </view>
          <view class="topic-content">
            <text class="topic-name">{{ topicInfo.name || '话题详情' }}</text>
            <text class="topic-desc" v-if="topicInfo.description">{{ topicInfo.description }}</text>
          </view>
        </view>
      </view>

      <view class="topic-stats-card">
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-number">{{ formatNumber(topicInfo.post_count || 0) }}</text>
            <text class="stat-label">内容</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-number">{{ formatNumber(topicInfo.view_count || 0) }}</text>
            <text class="stat-label">浏览</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-number">{{ formatNumber(topicInfo.hot_score || 0) }}</text>
            <text class="stat-label">热度</text>
          </view>
        </view>
        <view class="topic-tags" v-if="topicInfo.is_hot">
          <view class="hot-tag">
            <text class="tag-icon">🔥</text>
            <text class="tag-text">热门话题</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 内容筛选栏 -->
    <view class="filter-section">
      <view class="filter-tabs">
        <view
          class="tab-item"
          :class="{ active: sortBy === 'latest' }"
          @tap="changeSortBy('latest')"
        >
          <text class="tab-text">最新</text>
          <view class="tab-indicator" v-if="sortBy === 'latest'"></view>
        </view>
        <view
          class="tab-item"
          :class="{ active: sortBy === 'hot' }"
          @tap="changeSortBy('hot')"
        >
          <text class="tab-text">最热</text>
          <view class="tab-indicator" v-if="sortBy === 'hot'"></view>
        </view>
      </view>
    </view>

    <!-- 帖子列表 -->
    <view class="posts-section">
      
      <view class="posts-list">
        <template v-if="!loading && posts.length > 0">
          <PostCard
            v-for="(post, index) in posts"
            :key="post.id"
            :post="post"
            @click="navigateToPost"
          />
        </template>

        <!-- 空状态 -->
        <view class="empty-state" v-if="!loading && posts.length === 0">
          <view class="empty-icon">
            <text class="iconfont icon-document"></text>
          </view>
          <text class="empty-title">暂无相关内容</text>
          <text class="empty-desc">成为第一个在这个话题下发布内容的人吧！</text>
          <view class="empty-action" @tap="createPost">
            <text class="action-text">发布内容</text>
          </view>
        </view>

        <!-- 加载状态 -->
        <view class="loading-state" v-if="loading && posts.length === 0">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="load-more-section" v-if="posts.length > 0">
        <view class="load-more-btn" v-if="!loading && hasMore" @tap="loadMore">
          <text class="load-text">加载更多</text>
        </view>

        <view class="loading-more" v-if="loading && posts.length > 0">
          <view class="loading-spinner small"></view>
          <text class="loading-text">加载中...</text>
        </view>

        <view class="no-more-data" v-if="!loading && !hasMore && posts.length > 0">
          <view class="divider-line"></view>
          <text class="no-more-text">已经到底了</text>
          <view class="divider-line"></view>
        </view>
      </view>
    </view>

    <!-- 悬浮发布按钮 -->
    <view class="floating-action">
      <view class="fab-btn" @tap="createPost">
        <text class="iconfont icon-edit"></text>
      </view>
    </view>
  </view>
</template>

<script>
import { topicApi } from '@/api'
import { formatTimeAgo } from '@/utils/date'
import PostCard from '@/components/post/PostCard.vue'

export default {
  components: {
    PostCard
  },
  data() {
    return {
      topicId: '',
      topicInfo: {},
      posts: [],
      loading: false,
      sortBy: 'latest',
      currentPage: 1,
      pageSize: 10,
      hasMore: true
    }
  },
  
  onLoad(options) {
    if (options.id) {
      // 确保ID是字符串或数字，不是对象
      let id = options.id;
      if (typeof id === 'object') {
        // 如果是对象，尝试获取其id属性
        id = id.id || id.toString();
      }
      this.topicId = String(id); // 强制转换为字符串
      this.loadTopicInfo()
      this.loadPosts()
      this.recordTopicView()
    } else {
      uni.showToast({
        title: '参数错误',
        icon: 'none'
      })
    }
  },
  
  onReachBottom() {
    if (this.hasMore && !this.loading) {
      this.loadMore()
    }
  },
  
  onPullDownRefresh() {
    this.refreshData()
  },
  
  methods: {
    // 加载话题信息
    async loadTopicInfo() {
      try {
        const result = await topicApi.getDetail(this.topicId)
        if (result.code === 0 && result.data) {
          this.topicInfo = result.data
          
          // 设置页面标题
          uni.setNavigationBarTitle({
            title: `# ${this.topicInfo.name}`
          })
        }
      } catch (error) {
        console.error('获取话题详情失败:', error)
        uni.showToast({
          title: '获取话题详情失败',
          icon: 'none'
        })
      }
    },
    
    // 加载帖子列表
    async loadPosts(isRefresh = false) {
      if (this.loading) return

      this.loading = true

      try {
        if (isRefresh) {
          this.currentPage = 1
          this.hasMore = true
        }

        const params = {
          page: this.currentPage,
          pageSize: this.pageSize,
          orderBy: this.sortBy === 'latest' ? 'created_at' : 'like_count',
          orderDirection: 'DESC'
        }

        const result = await topicApi.getPosts(this.topicId, params)

        if (result.code === 0 && result.data) {
          const rawPosts = result.data.list || []


          // 格式化帖子数据，确保与首页数据格式一致
          const newPosts = rawPosts.map(post => ({
            // 确保关键字段存在
            id: post.id,
            title: post.title || '',
            content: post.content || '',
            createTime: post.created_at || post.createdAt || post.create_time,
            created_at: post.created_at || post.createdAt || post.create_time,
            // 确保作者信息结构正确
            author: {
              id: post.author?.id || post.user_id,
              username: post.author?.username || post.username,
              nickname: post.author?.nickname || post.author?.username || post.nickname || post.username || '未知用户',
              avatar: post.author?.avatar || post.avatar
            },
            // 位置信息
            location: post.location_name || post.locationName || '',
            // 计数信息
            likeCount: post.like_count || post.likeCount || 0,
            like_count: post.like_count || post.likeCount || 0,
            commentCount: post.comment_count || post.commentCount || 0,
            comment_count: post.comment_count || post.commentCount || 0,
            favoriteCount: post.favorite_count || post.favoriteCount || 0,
            // 交互状态
            isLiked: post.is_liked || post.isLiked || false,
            is_liked: post.is_liked || post.isLiked || false,
            isFavorited: post.is_favorited || post.isFavorited || false,
            is_favorited: post.is_favorited || post.isFavorited || false,
            // 热门评论
            hot_comments: post.hot_comments || [],
            // 图片
            images: post.images || [],
            // 话题
            topics: post.topics || post.topicList || []
          }))

          if (isRefresh || this.currentPage === 1) {
            this.posts = newPosts
          } else {
            this.posts = [...this.posts, ...newPosts]
          }

          this.hasMore = newPosts.length >= this.pageSize
        }
        
      } catch (error) {
        console.error('加载帖子失败:', error)
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
        if (isRefresh) {
          uni.stopPullDownRefresh()
        }
      }
    },

    // 记录话题浏览量
    async recordTopicView() {
      try {
        await topicApi.recordView(this.topicId)
      } catch (error) {
        console.error('记录浏览量失败:', error)
      }
    },

    // 刷新数据
    refreshData() {
      this.loadTopicInfo()
      this.loadPosts(true)
    },
    
    // 加载更多
    loadMore() {
      if (this.hasMore && !this.loading) {
        this.currentPage++
        this.loadPosts()
      }
    },
    
    // 切换排序方式
    changeSortBy(sortBy) {
      if (this.sortBy === sortBy) return
      
      this.sortBy = sortBy
      this.currentPage = 1
      this.loadPosts(true)
    },
    
    // 获取话题渐变色
    getTopicGradient() {
      const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
      ]

      const hash = this.topicInfo.name ? this.topicInfo.name.charCodeAt(0) : 0
      return colors[hash % colors.length]
    },

    // 格式化数字
    formatNumber(num) {
      if (num < 1000) return num.toString()
      if (num < 10000) return (num / 1000).toFixed(1) + 'k'
      if (num < 100000) return (num / 10000).toFixed(1) + 'w'
      return (num / 10000).toFixed(0) + 'w'
    },



    // 分享话题
    shareTopic() {
      uni.showActionSheet({
        itemList: ['分享到微信', '分享到朋友圈', '复制链接'],
        success: (res) => {
          switch (res.tapIndex) {
            case 0:
              this.shareToWeChat()
              break
            case 1:
              this.shareToMoments()
              break
            case 2:
              this.copyLink()
              break
          }
        }
      })
    },

    // 分享到微信
    shareToWeChat() {
      uni.showToast({
        title: '分享功能开发中',
        icon: 'none'
      })
    },

    // 分享到朋友圈
    shareToMoments() {
      uni.showToast({
        title: '分享功能开发中',
        icon: 'none'
      })
    },

    // 复制链接
    copyLink() {
      uni.setClipboardData({
        data: `https://campuswall.com/topic/${this.topicId}`,
        success: () => {
          uni.showToast({
            title: '链接已复制',
            icon: 'success'
          })
        }
      })
    },
    
    // 格式化时间
    formatTime(time) {
      return formatTimeAgo(time)
    },
    
    // 预览图片
    previewImage(images, current) {
      uni.previewImage({
        urls: images,
        current: current
      })
    },
    
    // 跳转到帖子详情
    navigateToPost(postId) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${postId}`
      })
    },
    
    // 创建帖子
    createPost() {
      uni.navigateTo({
        url: `/pages/post/create?topicId=${this.topicId}&topicName=${this.topicInfo.name}`
      })
    },
    
    // 返回
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss" scoped>
// 主题色彩变量
$primary-color: #6366f1;
$secondary-color: #8b5cf6;
$success-color: #10b981;
$warning-color: #f59e0b;
$error-color: #ef4444;
$text-primary: #1f2937;
$text-secondary: #6b7280;
$text-muted: #9ca3af;
$bg-primary: #ffffff;
$bg-secondary: #f9fafb;
$bg-tertiary: #f3f4f6;
$border-color: #e5e7eb;
$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

.topic-container {
  background: $bg-secondary;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

// 自定义导航栏
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);

  .navbar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 30rpx;
    padding-top: calc(20rpx + var(--status-bar-height, 0));
    height: 88rpx;

    .nav-left, .nav-right {
      width: 80rpx;
      display: flex;
      justify-content: center;
    }

    .back-btn, .share-btn {
      width: 60rpx;
      height: 60rpx;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;

      &:active {
        transform: scale(0.95);
        background: rgba(0, 0, 0, 0.1);
      }

      .iconfont {
        font-size: 32rpx;
        color: $text-primary;
      }
    }

    .nav-center {
      flex: 1;
      text-align: center;

      .nav-title {
        font-size: 32rpx;
        font-weight: 600;
        color: $text-primary;
      }
    }
  }
}

// 话题头部
.topic-header {
  margin-top: calc(88rpx + var(--status-bar-height, 0));

  .topic-cover {
    position: relative;
    padding: 60rpx 30rpx 40rpx;
    overflow: hidden;

    .cover-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.2);
    }

    .topic-main-info {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: flex-start;
      gap: 24rpx;

      .topic-icon {
        width: 80rpx;
        height: 80rpx;
        border-radius: 20rpx;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10rpx);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .topic-hash {
          font-size: 36rpx;
          font-weight: bold;
          color: white;
        }
      }

      .topic-content {
        flex: 1;
        padding-top: 8rpx;

        .topic-name {
          font-size: 44rpx;
          font-weight: 700;
          color: white;
          line-height: 1.3;
          margin-bottom: 12rpx;
          text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
        }

        .topic-desc {
          font-size: 28rpx;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.5;
          text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.3);
        }
      }
    }
  }

  .topic-stats-card {
    background: $bg-primary;
    margin: -20rpx 30rpx 0;
    border-radius: 24rpx;
    padding: 32rpx;
    box-shadow: $shadow-lg;
    position: relative;
    z-index: 3;

    .stats-grid {
      display: flex;
      align-items: center;

      .stat-item {
        flex: 1;
        text-align: center;

        .stat-number {
          display: block;
          font-size: 36rpx;
          font-weight: 700;
          color: $text-primary;
          margin-bottom: 8rpx;
        }

        .stat-label {
          font-size: 24rpx;
          color: $text-muted;
          font-weight: 500;
        }
      }

      .stat-divider {
        width: 1rpx;
        height: 40rpx;
        background: $border-color;
        margin: 0 20rpx;
      }
    }

    .topic-tags {
      margin-top: 24rpx;
      padding-top: 24rpx;
      border-top: 1rpx solid $border-color;

      .hot-tag {
        display: inline-flex;
        align-items: center;
        gap: 8rpx;
        background: linear-gradient(135deg, #ff6b6b, #ffa500);
        color: white;
        padding: 12rpx 20rpx;
        border-radius: 50rpx;
        font-size: 24rpx;
        font-weight: 600;

        .tag-icon {
          font-size: 20rpx;
        }
      }
    }
  }
}

// 筛选栏
.filter-section {
  background: $bg-primary;
  margin: 30rpx 30rpx 0;
  border-radius: 20rpx;
  box-shadow: $shadow-sm;

  .filter-tabs {
    display: flex;
    padding: 8rpx;

    .tab-item {
      flex: 1;
      position: relative;
      text-align: center;
      padding: 20rpx 0;
      border-radius: 16rpx;
      transition: all 0.3s ease;

      .tab-text {
        font-size: 28rpx;
        font-weight: 500;
        color: $text-secondary;
        transition: color 0.3s ease;
      }

      .tab-indicator {
        position: absolute;
        bottom: 8rpx;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 4rpx;
        background: $primary-color;
        border-radius: 2rpx;
      }

      &.active {
        background: rgba(99, 102, 241, 0.08);

        .tab-text {
          color: $primary-color;
          font-weight: 600;
        }
      }
    }
  }
}

// 帖子列表
.posts-section {
  padding: 30rpx;
}

.posts-list {
  // PostCard组件有自己的样式，这里不需要额外样式
}


// 空状态
.empty-state {
  text-align: center;
  padding: 120rpx 60rpx;

  .empty-icon {
    width: 120rpx;
    height: 120rpx;
    margin: 0 auto 32rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
    display: flex;
    align-items: center;
    justify-content: center;

    .iconfont {
      font-size: 48rpx;
      color: $text-muted;
    }
  }

  .empty-title {
    display: block;
    font-size: 32rpx;
    font-weight: 600;
    color: $text-secondary;
    margin-bottom: 16rpx;
  }

  .empty-desc {
    display: block;
    font-size: 26rpx;
    color: $text-muted;
    line-height: 1.5;
    margin-bottom: 48rpx;
  }

  .empty-action {
    background: linear-gradient(135deg, $primary-color, $secondary-color);
    color: white;
    padding: 24rpx 48rpx;
    border-radius: 50rpx;
    display: inline-block;
    font-size: 28rpx;
    font-weight: 600;
    box-shadow: $shadow-md;
    transition: all 0.3s ease;

    &:active {
      transform: translateY(2rpx);
      box-shadow: $shadow-sm;
    }

    .action-text {
      color: white;
    }
  }
}

// 加载状态
.loading-state {
  text-align: center;
  padding: 80rpx 0;

  .loading-spinner {
    width: 60rpx;
    height: 60rpx;
    margin: 0 auto 24rpx;
    border: 4rpx solid $border-color;
    border-top: 4rpx solid $primary-color;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    font-size: 28rpx;
    color: $text-muted;
  }
}

// 加载更多区域
.load-more-section {
  padding: 40rpx 0;

  .load-more-btn {
    text-align: center;
    padding: 24rpx;
    margin: 0 30rpx;
    background: $bg-primary;
    border: 2rpx solid $primary-color;
    border-radius: 50rpx;
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.98);
      background: rgba(99, 102, 241, 0.05);
    }

    .load-text {
      font-size: 28rpx;
      color: $primary-color;
      font-weight: 600;
    }
  }

  .loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    padding: 24rpx;

    .loading-spinner {
      width: 32rpx;
      height: 32rpx;
      border: 3rpx solid $border-color;
      border-top: 3rpx solid $primary-color;
      border-radius: 50%;
      animation: spin 1s linear infinite;

      &.small {
        width: 24rpx;
        height: 24rpx;
        border-width: 2rpx;
      }
    }

    .loading-text {
      font-size: 26rpx;
      color: $text-muted;
    }
  }

  .no-more-data {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24rpx;
    padding: 40rpx 60rpx;

    .divider-line {
      flex: 1;
      height: 1rpx;
      background: $border-color;
    }

    .no-more-text {
      font-size: 24rpx;
      color: $text-muted;
      white-space: nowrap;
    }
  }
}

// 悬浮发布按钮
.floating-action {
  position: fixed;
  bottom: 40rpx;
  right: 40rpx;
  z-index: 999;

  .fab-btn {
    width: 112rpx;
    height: 112rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, $primary-color, $secondary-color);
    box-shadow: 0 8rpx 24rpx rgba(99, 102, 241, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.95);
      box-shadow: 0 4rpx 12rpx rgba(99, 102, 241, 0.3);
    }

    .iconfont {
      font-size: 40rpx;
      color: white;
    }
  }
}

// 动画
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
