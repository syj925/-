<template>
  <view class="topic-detail-page">
    <!-- 话题封面背景 -->
    <view class="topic-cover-bg" v-if="topicCoverUrl">
      <image
        :src="topicCoverUrl"
        mode="aspectFill"
        class="cover-bg-image"
      />
      <view class="cover-overlay"></view>
    </view>

    <!-- 话题头部信息 -->
    <view class="topic-header" :class="{ 'has-cover': topicCoverUrl }">
      <view class="header-content">
        <!-- 话题封面和基本信息 -->
        <view class="topic-main">
          <view class="topic-cover" v-if="topicCoverUrl">
            <image
              :src="topicCoverUrl"
              mode="aspectFill"
              class="cover-image"
            />
          </view>
          <view class="topic-icon" v-else>
            <text class="topic-hash">#</text>
          </view>

          <view class="topic-info">
            <view class="topic-title-row">
              <text class="topic-name">{{ topicInfo.name || '话题详情' }}</text>
              <view class="topic-badges">
                <text class="topic-hot" v-if="topicInfo.is_hot">🔥 热门</text>
                <text class="topic-type" v-if="topicInfo.type && topicInfo.type !== 'general'">{{ getTopicTypeText(topicInfo.type) }}</text>
              </view>
            </view>
            <text class="topic-desc" v-if="topicInfo.description">{{ topicInfo.description }}</text>
          </view>
        </view>

        <!-- 话题统计信息 -->
        <view class="topic-stats">
          <view class="stat-item">
            <text class="stat-number">{{ formatNumber(topicInfo.post_count || 0) }}</text>
            <text class="stat-label">内容</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ formatNumber(topicInfo.view_count || 0) }}</text>
            <text class="stat-label">浏览</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ formatNumber(topicInfo.hot_score || 0) }}</text>
            <text class="stat-label">热度</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 内容筛选栏 -->
    <view class="filter-section">
      <scroll-view
        class="filter-scroll"
        scroll-x
        scroll-with-animation
        :scroll-into-view="'sort-' + sortBy"
      >
        <view class="filter-list">
          <view
            v-for="sort in sortOptions"
            :key="sort.key"
            :id="'sort-' + sort.key"
            class="filter-item"
            :class="{ active: sortBy === sort.key }"
            @tap="changeSortBy(sort.key)"
          >
            {{ sort.name }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 帖子列表 -->
    <view class="posts-section">
      <!-- 使用PostList组件 -->
      <post-list
        :list="posts"
        :loading="loading"
        :refreshing="refreshing"
        :finished="!hasMore"
        :show-empty-action="true"
        @like="handleLike"
        @comment="handleComment"
        @favorite="handleFavorite"
        @share="handleShare"
        @edit="handleEdit"
        @delete="handleDelete"
        @commentLike="handleCommentLike"
        @userClick="handleUserClick"
        @emptyAction="goToPublish"
      ></post-list>
    </view>

    <!-- 底部发布按钮 -->
    <view class="bottom-publish">
      <view class="publish-btn" @tap="goToPublish">
        <text class="publish-icon">✏️</text>
        <text class="publish-text">参与话题讨论</text>
      </view>
    </view>

    <!-- 底部安全区占位 -->
    <view class="safe-area"></view>
  </view>
</template>

<script>
import { topicApi } from '@/api'
import PostList from '@/components/post/PostList.vue'

export default {
  components: {
    PostList
  },
  data() {
    return {
      topicId: '',
      topicInfo: {},
      posts: [],
      loading: false,
      refreshing: false,
      sortBy: 'latest',
      currentPage: 1,
      pageSize: 10,
      hasMore: true,
      sortOptions: [
        { key: 'latest', name: '最新' },
        { key: 'hot', name: '最热' }
      ]
    }
  },

  computed: {
    // 话题封面图片URL
    topicCoverUrl() {
      if (!this.topicInfo) return ''

      // 优先使用已审核通过的封面图片
      if (this.topicInfo.cover_image && this.topicInfo.image_status === 'approved') {
        return this.getFullImageUrl(this.topicInfo.cover_image)
      }

      return ''
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
    // PostList组件事件处理
    handleLike(post) {
      // 处理点赞
      console.log('点赞帖子:', post.id)
    },

    handleComment(post) {
      // 跳转到帖子详情页面
      uni.navigateTo({
        url: `/pages/post/detail?id=${post.id}`
      })
    },

    handleFavorite(post) {
      // 处理收藏
      console.log('收藏帖子:', post.id)
    },

    handleShare(post) {
      // 处理分享
      console.log('分享帖子:', post.id)
    },

    handleEdit(post) {
      // 编辑帖子
      console.log('编辑帖子:', post.id)
    },

    handleDelete(post) {
      // 删除帖子
      console.log('删除帖子:', post.id)
    },

    handleCommentLike(comment) {
      // 处理评论点赞
      console.log('点赞评论:', comment.id)
    },

    handleUserClick(user) {
      // 跳转到用户页面
      uni.navigateTo({
        url: `/pages/user/user-profilee?id=${user.id}`
      })
    },

    // 跳转到发布页面
    goToPublish() {
      uni.navigateTo({
        url: `/pages/publish/publish?topicId=${this.topicId}&topicName=${this.topicInfo.name}`
      })
    },
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

    // 获取完整图片URL
    getFullImageUrl(imagePath) {
      if (!imagePath) return ''

      // 如果已经是完整URL，直接返回
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath
      }

      // 拼接服务器地址
      const baseUrl = 'http://localhost:3000'
      return baseUrl + (imagePath.startsWith('/') ? imagePath : '/' + imagePath)
    },

    // 获取话题类型文本
    getTopicTypeText(type) {
      const typeMap = {
        'general': '普通',
        'academic': '学术',
        'life': '生活',
        'entertainment': '娱乐',
        'sports': '体育',
        'technology': '科技',
        'news': '新闻',
        'discussion': '讨论'
      }
      return typeMap[type] || type
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
      // 确保postId是字符串或数字，不是对象
      const id = typeof postId === 'object' ? postId.id : postId;
      console.log('navigateToPost called with:', postId, 'using id:', id);

      if (!id) {
        console.error('Invalid post ID:', postId);
        return;
      }

      uni.navigateTo({
        url: `/pages/post/detail?id=${id}`
      })
    },
    
    // 创建帖子（兼容旧方法名）
    createPost() {
      this.goToPublish()
    },
    
    // 返回
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.topic-detail-page {
  min-height: 100vh;
  background-color: $bg-page;
  display: flex;
  flex-direction: column;
  position: relative;
}

// 话题封面背景
.topic-cover-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 400rpx;
  z-index: 0;
  overflow: hidden;

  .cover-bg-image {
    width: 100%;
    height: 100%;
    filter: blur(20rpx);
    transform: scale(1.1);
  }

  .cover-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg,
      rgba(0, 0, 0, 0.3) 0%,
      rgba(0, 0, 0, 0.1) 50%,
      rgba($bg-page, 0.8) 90%,
      $bg-page 100%
    );
  }
}

// 话题头部
.topic-header {
  background-color: $bg-card;
  padding: $spacing-lg;
  margin: $spacing-md;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  position: relative;
  z-index: 1;

  &.has-cover {
    margin-top: 200rpx;
    background: rgba($bg-card, 0.95);
    backdrop-filter: blur(20rpx);
  }

  .header-content {
    .topic-main {
      display: flex;
      align-items: flex-start;
      margin-bottom: $spacing-lg;

      .topic-cover {
        width: 120rpx;
        height: 120rpx;
        border-radius: $radius-md;
        overflow: hidden;
        margin-right: $spacing-md;
        box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.15);

        .cover-image {
          width: 100%;
          height: 100%;
        }
      }

      .topic-icon {
        width: 120rpx;
        height: 120rpx;
        background: $gradient-blue;
        border-radius: $radius-md;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: $spacing-md;
        box-shadow: 0 8rpx 20rpx rgba($primary-color, 0.3);

        .topic-hash {
          color: $text-white;
          font-size: 48rpx;
          font-weight: bold;
        }
      }

      .topic-info {
        flex: 1;

        .topic-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: $spacing-xs;

          .topic-name {
            font-size: $font-size-xl;
            font-weight: 600;
            color: $text-primary;
            flex: 1;
            margin-right: $spacing-sm;
          }

          .topic-badges {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: $spacing-xs;

            .topic-hot {
              font-size: $font-size-xs;
              color: $accent-yellow;
              font-weight: 500;
              background: rgba($accent-yellow, 0.1);
              padding: 4rpx 8rpx;
              border-radius: $radius-xs;
            }

            .topic-type {
              font-size: $font-size-xs;
              color: $primary-color;
              background: rgba($primary-color, 0.1);
              padding: 4rpx 8rpx;
              border-radius: $radius-xs;
            }
          }
        }

        .topic-desc {
          font-size: $font-size-md;
          color: $text-secondary;
          line-height: 1.6;
          margin-bottom: $spacing-xs;
          display: block;
        }
      }
    }

    .topic-stats {
      display: flex;
      justify-content: space-around;
      padding: $spacing-md 0;
      border-top: 1rpx solid $border-light;

      .stat-item {
        text-align: center;

        .stat-number {
          font-size: $font-size-lg;
          font-weight: 600;
          color: $text-primary;
          display: block;
          margin-bottom: $spacing-xs;
        }

        .stat-label {
          font-size: $font-size-sm;
          color: $text-tertiary;
        }
      }
    }
  }
}

// 筛选栏
.filter-section {
  background-color: $bg-card;
  padding: $spacing-sm 0;
  margin: 0 $spacing-md $spacing-md;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  position: relative;
  z-index: 1;
}

.filter-scroll {
  white-space: nowrap;
  width: 100%;
}

.filter-list {
  display: inline-block;
  padding: 0 $spacing-md;
}

.filter-item {
  display: inline-block;
  font-size: $font-size-md;
  color: $text-tertiary;
  padding: $spacing-xs $spacing-md;
  margin-right: $spacing-md;
  border-radius: $radius-xl;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;

  &.active {
    color: $text-white;
    background: $gradient-blue;
    box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.3);
    transform: translateY(-2rpx);
  }

  &:last-child {
    margin-right: 0;
  }
}

// 帖子列表区域
.posts-section {
  flex: 1;
  padding: 0 $spacing-md;
  position: relative;
  z-index: 1;
}

// 底部发布按钮
.bottom-publish {
  padding: $spacing-md;
  background-color: $bg-card;
  border-top: 1rpx solid $border-light;
  position: relative;
  z-index: 1;

  .publish-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: $gradient-blue;
    border-radius: $radius-xl;
    padding: $spacing-md;
    box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.3);

    .publish-icon {
      font-size: $font-size-lg;
      margin-right: $spacing-xs;
    }

    .publish-text {
      font-size: $font-size-md;
      color: $text-white;
      font-weight: 500;
    }
  }
}

// 底部安全区
.safe-area {
  height: 34rpx;
}
</style>
