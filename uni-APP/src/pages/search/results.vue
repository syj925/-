<template>
  <view class="search-results-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="nav-left" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <view class="nav-center">
          <view class="search-bar">
            <view class="search-input-wrapper">
              <input
                v-model="searchKeyword"
                class="search-input"
                placeholder="搜索内容"
                confirm-type="search"
                @confirm="onSearchConfirm"
                @input="onSearchInput"
              />
              <view v-if="searchKeyword" class="clear-btn" @click="clearSearch">
                <text>✕</text>
              </view>
            </view>
          </view>
        </view>
        <view class="nav-right" @click="onSearchConfirm">
          <text class="search-btn">搜索</text>
        </view>
      </view>
    </view>

    <!-- 搜索结果内容 -->
    <view class="results-content">
      <!-- 加载状态 -->
      <view v-if="loading && !searchResults" class="loading-container">
        <view class="loading-animation">
          <view class="loading-dot" v-for="i in 3" :key="i"></view>
        </view>
        <text class="loading-text">正在搜索...</text>
      </view>

      <!-- 搜索结果 -->
      <view v-else-if="searchResults" class="search-results">


        <!-- 分类标签 -->
        <view class="category-tabs">
          <scroll-view class="tabs-scroll" scroll-x>
            <view class="tabs-container" style="display: flex; flex-direction: row; flex-wrap: nowrap;">
              <view
                v-for="tab in searchTabs"
                :key="tab.type"
                class="tab-item"
                :class="{ 
                  active: currentTab === tab.type,
                  'has-count': getTabCount(tab.type) > 0
                }"
                @click="switchTab(tab.type)"
              >
                <view class="tab-icon">
                  <text>{{ getTabIcon(tab.type) }}</text>
                </view>
                <text class="tab-name">{{ tab.name }}</text>
                <view v-if="getTabCount(tab.type) > 0" class="tab-badge">
                  <text>{{ getTabCount(tab.type) }}</text>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 筛选器 -->
        <view v-if="currentTab !== 'all'" class="filters-bar">
          <scroll-view class="filters-scroll" scroll-x>
            <view class="filters-container" style="display: flex; flex-direction: row; align-items: center; flex-wrap: nowrap; overflow-x: auto;">
              <!-- 排序筛选 -->
              <view class="filter-section" style="display: flex; flex-direction: row; align-items: center; flex-shrink: 0;">
                <text class="section-title">排序</text>
                <view class="filter-chips" style="display: flex; flex-direction: row; flex-wrap: nowrap;">
                  <view
                    v-for="sort in sortOptions"
                    :key="sort.value"
                    class="filter-chip"
                    :class="{ active: currentSort === sort.value }"
                    @click="changeSortOrder(sort.value)"
                  >
                    <text>{{ sort.label }}</text>
                  </view>
                </view>
              </view>

              <!-- 时间筛选 -->
              <view class="filter-section" style="display: flex; flex-direction: row; align-items: center; flex-shrink: 0;">
                <text class="section-title">时间</text>
                <view class="filter-chips" style="display: flex; flex-direction: row; flex-wrap: nowrap;">
                  <view
                    v-for="time in timeFilters"
                    :key="time.value"
                    class="filter-chip"
                    :class="{ active: currentTimeFilter === time.value }"
                    @click="changeTimeFilter(time.value)"
                  >
                    <text>{{ time.label }}</text>
                  </view>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 结果列表 -->
        <scroll-view class="results-list" scroll-y @scrolltolower="loadMore">
          <view class="list-container">
            <!-- 全部结果展示 -->
            <template v-if="currentTab === 'all'">
              <!-- 帖子结果 -->
              <view v-if="searchResults.posts?.list?.length > 0" class="result-category">
                <view class="category-header">
                  <view class="header-left">
                    <text class="category-icon">📝</text>
                    <text class="category-title">帖子</text>
                  </view>
                  <view class="header-right" @click="switchTab('posts')">
                    <text class="view-all">查看全部 {{ searchResults.posts.pagination?.total || 0 }}</text>
                    <text class="arrow">→</text>
                  </view>
                </view>
                <view class="category-items">
                  <view
                    v-for="post in searchResults.posts.list.slice(0, 3)"
                    :key="'post-' + post.id"
                    class="result-card post-card"
                    @click="goToPostDetail(post.id)"
                  >
                    <view class="card-content">
                      <text class="post-title">{{ post.title || post.content }}</text>
                      <view class="post-meta">
                        <text class="author">{{ post.author?.nickname || post.author?.username }}</text>
                        <text class="stats">{{ post.like_count }}赞 · {{ post.comment_count }}评论</text>
                      </view>
                    </view>
                    <view v-if="post.images?.length > 0" class="card-thumb">
                      <image :src="getImageUrl(getFirstImage(post.images))" mode="aspectFill" />
                    </view>
                  </view>
                </view>
              </view>

              <!-- 用户结果 -->
              <view v-if="searchResults.users?.list?.length > 0" class="result-category">
                <view class="category-header">
                  <view class="header-left">
                    <text class="category-icon">👥</text>
                    <text class="category-title">用户</text>
                  </view>
                  <view class="header-right" @click="switchTab('users')">
                    <text class="view-all">查看全部 {{ searchResults.users.pagination?.total || 0 }}</text>
                    <text class="arrow">→</text>
                  </view>
                </view>
                <view class="category-items">
                  <view
                    v-for="user in searchResults.users.list.slice(0, 3)"
                    :key="'user-' + user.id"
                    class="result-card user-card"
                    @click="goToUserProfile(user.id)"
                  >
                    <view class="user-avatar">
                      <image :src="getImageUrl(user.avatar)" mode="aspectFill" />
                    </view>
                    <view class="user-info">
                      <text class="user-name">{{ user.nickname || user.username }}</text>
                      <text class="user-bio">{{ user.bio || '这个人很懒，什么都没写~' }}</text>
                    </view>
                    <view class="follow-button">
                      <text>关注</text>
                    </view>
                  </view>
                </view>
              </view>

              <!-- 话题结果 -->
              <view v-if="searchResults.topics?.list?.length > 0" class="result-category">
                <view class="category-header">
                  <view class="header-left">
                    <text class="category-icon">💬</text>
                    <text class="category-title">话题</text>
                  </view>
                  <view class="header-right" @click="switchTab('topics')">
                    <text class="view-all">查看全部 {{ searchResults.topics.pagination?.total || 0 }}</text>
                    <text class="arrow">→</text>
                  </view>
                </view>
                <view class="category-items">
                  <view
                    v-for="topic in searchResults.topics.list.slice(0, 3)"
                    :key="'topic-' + topic.id"
                    class="result-card topic-card"
                    @click="goToTopicDetail(topic.id)"
                  >
                    <view class="topic-avatar">
                      <image v-if="topic.cover_image" :src="getImageUrl(topic.cover_image)" mode="aspectFill" />
                      <view v-else class="default-avatar">
                        <text>{{ topic.name.charAt(0) }}</text>
                      </view>
                    </view>
                    <view class="topic-info">
                      <text class="topic-name">{{ topic.name }}</text>
                      <text class="topic-desc">{{ topic.description || '暂无描述' }}</text>
                      <text class="topic-stats">{{ topic.post_count }}个帖子</text>
                    </view>
                  </view>
                </view>
              </view>
            </template>

            <!-- 单类型结果展示 -->
            <template v-else>
              <view
                v-for="item in currentResults.list"
                :key="item.id"
                class="result-card"
                :class="currentTab + '-card'"
                @click="goToItemDetail(item, currentTab)"
              >
                <!-- 帖子卡片 -->
                <template v-if="currentTab === 'posts'">
                  <view class="card-content">
                    <text class="post-title">{{ item.title || item.content }}</text>
                    <view class="post-meta">
                      <text class="author">{{ item.author?.nickname || item.author?.username }}</text>
                      <text class="stats">{{ item.like_count }}赞 · {{ item.comment_count }}评论</text>
                    </view>
                  </view>
                  <view v-if="item.images?.length > 0" class="card-thumb">
                    <image :src="getImageUrl(getFirstImage(item.images))" mode="aspectFill" />
                  </view>
                </template>
                
                <!-- 用户卡片 -->
                <template v-else-if="currentTab === 'users'">
                  <view class="user-avatar">
                    <image :src="getImageUrl(item.avatar)" mode="aspectFill" />
                  </view>
                  <view class="user-info">
                    <text class="user-name">{{ item.nickname || item.username }}</text>
                    <text class="user-bio">{{ item.bio || '这个人很懒，什么都没写~' }}</text>
                  </view>
                  <view class="follow-button">
                    <text>关注</text>
                  </view>
                </template>
                
                <!-- 话题卡片 -->
                <template v-else-if="currentTab === 'topics'">
                  <view class="topic-avatar">
                    <image v-if="item.cover_image" :src="getImageUrl(item.cover_image)" mode="aspectFill" />
                    <view v-else class="default-avatar">
                      <text>{{ item.name.charAt(0) }}</text>
                    </view>
                  </view>
                  <view class="topic-info">
                    <text class="topic-name">{{ item.name }}</text>
                    <text class="topic-desc">{{ item.description || '暂无描述' }}</text>
                    <text class="topic-stats">{{ item.post_count }}个帖子</text>
                  </view>
                </template>
              </view>
            </template>

            <!-- 加载更多 -->
            <view v-if="loading" class="load-more">
              <text class="load-text">加载中...</text>
            </view>

            <!-- 没有更多 -->
            <view v-if="!hasMore && currentResults.list?.length > 0" class="no-more">
              <text>没有更多了</text>
            </view>

            <!-- 空状态 -->
            <view v-if="isEmptyResults" class="empty-state">
              <view class="empty-icon">
                <text>🔍</text>
              </view>
              <text class="empty-title">没有找到相关内容</text>
              <text class="empty-desc">试试其他关键词吧</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 初始状态 -->
      <view v-else class="initial-state">
        <view class="initial-icon">
          <text>🔍</text>
        </view>
        <text class="initial-text">输入关键词开始搜索</text>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/api'

export default {
  name: 'SearchResultsPage',
  data() {
    return {
      searchKeyword: '',
      searchResults: null,
      currentTab: 'all',
      loading: false,
      hasMore: false,
      currentPage: 1,
      pageSize: 10,
      searchTime: null,
      searchTabs: [
        { type: 'all', name: '全部' },
        { type: 'posts', name: '帖子' },
        { type: 'users', name: '用户' },
        { type: 'topics', name: '话题' }
      ],
      sortOptions: [
        { value: 'relevance', label: '相关度' },
        { value: 'time', label: '最新' },
        { value: 'hot', label: '最热' }
      ],
      timeFilters: [
        { value: 'all', label: '全部' },
        { value: 'today', label: '今天' },
        { value: 'week', label: '本周' },
        { value: 'month', label: '本月' }
      ],
      currentSort: 'relevance',
      currentTimeFilter: 'all'
    }
  },
  computed: {
    currentResults() {
      if (!this.searchResults) return { list: [] }

      switch (this.currentTab) {
        case 'posts':
          return this.searchResults.posts || { list: [] }
        case 'users':
          return this.searchResults.users || { list: [] }
        case 'topics':
          return this.searchResults.topics || { list: [] }
        default:
          return { list: [] }
      }
    },
    isEmptyResults() {
      if (!this.searchResults) return false
      
      if (this.currentTab === 'all') {
        const posts = this.searchResults.posts?.list || []
        const users = this.searchResults.users?.list || []
        const topics = this.searchResults.topics?.list || []
        return posts.length === 0 && users.length === 0 && topics.length === 0
      } else {
        return this.currentResults.list.length === 0
      }
    }
  },
  onLoad(options) {
    if (options.keyword) {
      this.searchKeyword = decodeURIComponent(options.keyword)
      this.performSearch()
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },

    clearSearch() {
      this.searchKeyword = ''
      this.searchResults = null
    },

    onSearchInput() {
      // 可以添加实时搜索建议功能
    },

    onSearchConfirm() {
      if (this.searchKeyword.trim()) {
        this.performSearch()
      }
    },

    async performSearch() {
      if (!this.searchKeyword.trim()) return

      this.loading = true
      const startTime = Date.now()

      try {
        // 保存搜索历史
        await api.search.saveSearchHistory({
          keyword: this.searchKeyword,
          type: this.currentTab
        })

        // 执行搜索
        const res = await api.search.globalSearch({
          keyword: this.searchKeyword,
          type: this.currentTab,
          page: 1,
          pageSize: this.pageSize,
          orderBy: this.currentSort,
          timeFilter: this.currentTimeFilter
        })

        this.searchResults = res.data
        this.currentPage = 1
        this.searchTime = Date.now() - startTime
        this.updateHasMore()

      } catch (error) {
        console.error('搜索失败:', error)
        uni.showToast({
          title: '搜索失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    switchTab(type) {
      this.currentTab = type
      if (this.searchKeyword.trim()) {
        this.performSearch()
      }
    },

    changeSortOrder(sortValue) {
      if (this.currentSort === sortValue) return

      this.currentSort = sortValue
      if (this.searchKeyword.trim()) {
        this.performSearch()
      }
    },

    changeTimeFilter(timeValue) {
      if (this.currentTimeFilter === timeValue) return

      this.currentTimeFilter = timeValue
      if (this.searchKeyword.trim()) {
        this.performSearch()
      }
    },

    getTabCount(type) {
      if (!this.searchResults) return 0

      switch (type) {
        case 'all':
          const posts = this.searchResults.posts?.pagination?.total || 0
          const users = this.searchResults.users?.pagination?.total || 0
          const topics = this.searchResults.topics?.pagination?.total || 0
          return posts + users + topics
        case 'posts':
          return this.searchResults.posts?.pagination?.total || 0
        case 'users':
          return this.searchResults.users?.pagination?.total || 0
        case 'topics':
          return this.searchResults.topics?.pagination?.total || 0
        default:
          return 0
      }
    },

    getTotalCount() {
      return this.getTabCount('all')
    },

    getTabIcon(type) {
      const iconMap = {
        'all': '🌟',
        'posts': '📝',
        'users': '👥',
        'topics': '💬'
      }
      return iconMap[type] || '🔍'
    },

    updateHasMore() {
      if (this.currentTab === 'all') {
        this.hasMore = false
      } else {
        const pagination = this.currentResults.pagination
        if (pagination) {
          this.hasMore = this.currentPage < Math.ceil(pagination.total / this.pageSize)
        } else {
          this.hasMore = false
        }
      }
    },

    async loadMore() {
      if (!this.hasMore || this.loading || this.currentTab === 'all') return

      this.loading = true

      try {
        const res = await api.search.globalSearch({
          keyword: this.searchKeyword,
          type: this.currentTab,
          page: this.currentPage + 1,
          pageSize: this.pageSize,
          orderBy: this.currentSort,
          timeFilter: this.currentTimeFilter
        })

        if (res.data[this.currentTab]?.list?.length > 0) {
          this.searchResults[this.currentTab].list.push(...res.data[this.currentTab].list)
          this.currentPage++
        }

        this.updateHasMore()

      } catch (error) {
        console.error('加载更多失败:', error)
      } finally {
        this.loading = false
      }
    },

    // 跳转方法
    goToPostDetail(postId) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${postId}`
      })
    },

    goToUserProfile(userId) {
      uni.navigateTo({
        url: `/pages/user/user-profile?id=${userId}`
      })
    },

    goToTopicDetail(topicId) {
      uni.navigateTo({
        url: `/pages/topic/detail?id=${topicId}`
      })
    },

    goToItemDetail(item, type) {
      switch (type) {
        case 'posts':
          this.goToPostDetail(item.id)
          break
        case 'users':
          this.goToUserProfile(item.id)
          break
        case 'topics':
          this.goToTopicDetail(item.id)
          break
      }
    },

    // 工具方法
    getImageUrl(imagePath) {
      if (!imagePath) return '/static/images/default-avatar.png'
      if (imagePath.startsWith('http')) return imagePath
      return `http://localhost:3000${imagePath}`
    },

    getFirstImage(images) {
      if (Array.isArray(images) && images.length > 0) {
        return images[0]
      }
      if (typeof images === 'string') {
        try {
          const parsed = JSON.parse(images)
          return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null
        } catch {
          return images
        }
      }
      return null
    }
  }
}
</script>

<style lang="scss" scoped>
.search-results-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

/* 自定义导航栏 */
.custom-navbar {
  background: #fff;
  padding-top: var(--status-bar-height);
  border-bottom: 1rpx solid #eee;

  .navbar-content {
    display: flex;
    align-items: center;
    height: 88rpx;
    padding: 0 30rpx;

    .nav-left {
      width: 80rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      .back-icon {
        font-size: 36rpx;
        color: #333;
        font-weight: 600;
      }
    }

    .nav-center {
      flex: 1;
      margin: 0 20rpx;

      .search-bar {
        .search-input-wrapper {
          position: relative;
          background: #f5f7fa;
          border-radius: 50rpx;
          padding: 0 40rpx;
          height: 60rpx;
          display: flex;
          align-items: center;

          .search-input {
            flex: 1;
            font-size: 28rpx;
            color: #333;

            &::placeholder {
              color: #999;
            }
          }

          .clear-btn {
            width: 40rpx;
            height: 40rpx;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;

            text {
              font-size: 20rpx;
              color: #666;
            }
          }
        }
      }
    }

    .nav-right {
      width: 100rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      .search-btn {
        font-size: 28rpx;
        color: #007aff;
        font-weight: 500;
      }
    }
  }
}

/* 搜索结果内容 */
.results-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 加载状态 */
.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .loading-animation {
    display: flex;
    gap: 8rpx;
    margin-bottom: 30rpx;

    .loading-dot {
      width: 12rpx;
      height: 12rpx;
      border-radius: 50%;
      background: #007aff;
      animation: loading-bounce 1.4s ease-in-out infinite both;

      &:nth-child(1) { animation-delay: -0.32s; }
      &:nth-child(2) { animation-delay: -0.16s; }
      &:nth-child(3) { animation-delay: 0s; }
    }
  }

  .loading-text {
    font-size: 28rpx;
    color: #666;
  }
}

@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}



/* 分类标签 */
.category-tabs {
  background: #fff;
  border-bottom: 1rpx solid #eee;

  .tabs-scroll {
    white-space: nowrap;
  }

  .tabs-container {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    padding: 20rpx 30rpx;
    gap: 16rpx;
    min-width: max-content;
  }

  .tab-item {
    position: relative;
    display: flex;
    align-items: center;
    padding: 16rpx 24rpx;
    border-radius: 50rpx;
    background: #f5f7fa;
    transition: all 0.3s ease;
    white-space: nowrap;
    flex-shrink: 0;

    &.active {
      background: linear-gradient(135deg, #007aff, #4dabf7);

      .tab-icon text,
      .tab-name {
        color: #fff;
      }

      .tab-badge {
        background: rgba(255, 255, 255, 0.2);

        text {
          color: #fff;
        }
      }
    }

    &.has-count {
      border: 2rpx solid rgba(0, 122, 255, 0.1);
    }

    .tab-icon {
      margin-right: 8rpx;

      text {
        font-size: 22rpx;
        transition: color 0.3s ease;
      }
    }

    .tab-name {
      font-size: 24rpx;
      color: #333;
      font-weight: 500;
      margin-right: 8rpx;
      transition: color 0.3s ease;
      white-space: nowrap;
    }

    .tab-badge {
      padding: 4rpx 12rpx;
      border-radius: 20rpx;
      background: rgba(0, 122, 255, 0.1);

      text {
        font-size: 20rpx;
        color: #007aff;
        font-weight: 600;
      }
    }
  }
}

/* 筛选器 */
.filters-bar {
  background: #fff;
  border-bottom: 1rpx solid #eee;

  .filters-scroll {
    white-space: nowrap;
  }

  .filters-container {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    flex-wrap: nowrap !important;
    padding: 20rpx 30rpx;
    gap: 40rpx;
    min-width: max-content;
  }

  .filter-section {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    flex-wrap: nowrap !important;
    flex-shrink: 0 !important;
    gap: 16rpx;

    .section-title {
      font-size: 24rpx;
      color: #333;
      font-weight: 500;
      white-space: nowrap;
      flex-shrink: 0;
      min-width: 60rpx;
    }

    .filter-chips {
      display: flex !important;
      flex-direction: row !important;
      flex-wrap: nowrap !important;
      gap: 12rpx;
    }
  }

  .filter-chip {
    padding: 12rpx 20rpx;
    border-radius: 50rpx;
    background: #f5f7fa;
    border: 2rpx solid transparent;
    transition: all 0.3s ease;
    white-space: nowrap;
    flex-shrink: 0;

    &.active {
      background: rgba(0, 122, 255, 0.1);
      border-color: #007aff;

      text {
        color: #007aff;
        font-weight: 500;
      }
    }

    text {
      font-size: 24rpx;
      color: #666;
    }
  }
}

/* 结果列表 */
.results-list {
  flex: 1;
  background: #f8f9fa;
}

.list-container {
  padding: 30rpx;
}

/* 结果分类 */
.result-category {
  margin-bottom: 50rpx;

  .category-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30rpx;

    .header-left {
      display: flex;
      align-items: center;

      .category-icon {
        font-size: 28rpx;
        margin-right: 12rpx;
      }

      .category-title {
        font-size: 32rpx;
        color: #333;
        font-weight: 600;
      }
    }

    .header-right {
      display: flex;
      align-items: center;

      .view-all {
        font-size: 24rpx;
        color: #007aff;
        margin-right: 8rpx;
      }

      .arrow {
        font-size: 24rpx;
        color: #007aff;
      }
    }
  }

  .category-items {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }
}

/* 结果卡片 */
.result-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  }
}

/* 帖子卡片 */
.post-card {
  display: flex;

  .card-content {
    flex: 1;
    margin-right: 30rpx;

    .post-title {
      font-size: 28rpx;
      color: #333;
      line-height: 1.5;
      margin-bottom: 20rpx;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .post-meta {
      display: flex;
      align-items: center;
      gap: 20rpx;

      .author {
        font-size: 24rpx;
        color: #666;
      }

      .stats {
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  .card-thumb {
    width: 120rpx;
    height: 120rpx;
    border-radius: 16rpx;
    overflow: hidden;
    background: #f5f7fa;

    image {
      width: 100%;
      height: 100%;
    }
  }
}

/* 用户卡片 */
.user-card {
  display: flex;
  align-items: center;

  .user-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 30rpx;
    background: #f5f7fa;

    image {
      width: 100%;
      height: 100%;
    }
  }

  .user-info {
    flex: 1;

    .user-name {
      font-size: 28rpx;
      color: #333;
      font-weight: 500;
      margin-bottom: 12rpx;
    }

    .user-bio {
      font-size: 24rpx;
      color: #999;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  .follow-button {
    padding: 16rpx 32rpx;
    border-radius: 50rpx;
    background: linear-gradient(135deg, #007aff, #4dabf7);

    text {
      font-size: 24rpx;
      color: #fff;
      font-weight: 500;
    }
  }
}

/* 话题卡片 */
.topic-card {
  display: flex;
  align-items: center;

  .topic-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 24rpx;
    overflow: hidden;
    margin-right: 30rpx;
    background: #f5f7fa;

    image {
      width: 100%;
      height: 100%;
    }

    .default-avatar {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #007aff, #4dabf7);
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        font-size: 40rpx;
        color: #fff;
        font-weight: 600;
      }
    }
  }

  .topic-info {
    flex: 1;

    .topic-name {
      font-size: 28rpx;
      color: #333;
      font-weight: 500;
      margin-bottom: 12rpx;
    }

    .topic-desc {
      font-size: 24rpx;
      color: #666;
      margin-bottom: 8rpx;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .topic-stats {
      font-size: 22rpx;
      color: #999;
    }
  }
}

/* 加载状态 */
.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx;

  .load-text {
    font-size: 24rpx;
    color: #999;
  }
}

.no-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx;

  text {
    font-size: 24rpx;
    color: #ccc;
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 60rpx;

  .empty-icon {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background: rgba(153, 153, 153, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40rpx;

    text {
      font-size: 60rpx;
      opacity: 0.5;
    }
  }

  .empty-title {
    font-size: 32rpx;
    color: #666;
    margin-bottom: 20rpx;
  }

  .empty-desc {
    font-size: 24rpx;
    color: #999;
  }
}

/* 初始状态 */
.initial-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .initial-icon {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background: rgba(0, 122, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40rpx;

    text {
      font-size: 60rpx;
      opacity: 0.8;
    }
  }

  .initial-text {
    font-size: 28rpx;
    color: #999;
  }
}
</style>
