<template>
  <view class="search-page">
    <!-- 搜索头部 -->
    <view class="search-header">
      <view class="search-input-container">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          type="text"
          v-model="searchKeyword"
          placeholder="搜索帖子、用户、话题..."
          @input="onSearchInput"
          @confirm="onSearchConfirm"
          confirm-type="search"
          focus
        />
        <view v-if="searchKeyword" class="clear-btn" @click="clearSearch">
          <text class="clear-icon">×</text>
        </view>
      </view>
      <view class="cancel-btn" @click="goBack">取消</view>
    </view>

    <!-- 搜索类型切换 -->
    <view v-if="searchKeyword && searchResults" class="search-tabs">
      <view 
        v-for="tab in searchTabs" 
        :key="tab.type"
        class="search-tab"
        :class="{ active: currentTab === tab.type }"
        @click="switchTab(tab.type)"
      >
        {{ tab.name }}
        <text v-if="getTabCount(tab.type) > 0" class="tab-count">({{ getTabCount(tab.type) }})</text>
      </view>
    </view>

    <!-- 搜索内容区域 -->
    <view class="search-content">
      <!-- 搜索建议 -->
      <view v-if="!searchKeyword || (!searchResults && searchSuggestions.length > 0)" class="search-suggestions">
        <view class="suggestions-title">搜索建议</view>
        <view class="suggestions-list">
          <view
            v-for="suggestion in searchSuggestions"
            :key="suggestion.id"
            class="suggestion-item"
            @click="selectSuggestion(suggestion)"
          >
            <text class="suggestion-icon">{{ getSuggestionIcon(suggestion.type) }}</text>
            <text class="suggestion-text">{{ suggestion.text }}</text>
          </view>
        </view>
      </view>

      <!-- 热门搜索 -->
      <view v-if="!searchKeyword && hotSearches.length > 0" class="hot-searches">
        <view class="hot-title">热门搜索</view>
        <view class="hot-list">
          <view 
            v-for="(item, index) in hotSearches" 
            :key="index"
            class="hot-item"
            @click="selectHotSearch(item.keyword)"
          >
            {{ item.keyword }}
          </view>
        </view>
      </view>

      <!-- 搜索历史 -->
      <view v-if="!searchKeyword && searchHistory.length > 0" class="search-history">
        <view class="history-header">
          <text class="history-title">搜索历史</text>
          <view class="clear-history-btn" @click="clearHistory">
            <text class="clear-history-icon">🗑️</text>
          </view>
        </view>
        <view class="history-list">
          <view
            v-for="(item, index) in searchHistory"
            :key="index"
            class="history-item"
            @click="selectHistory(item.keyword)"
          >
            <text class="history-icon">🕒</text>
            <text class="history-text">{{ item.keyword }}</text>
          </view>
        </view>
      </view>

      <!-- 搜索结果 -->
      <view v-if="searchResults" class="search-results">
        <!-- 全部结果 -->
        <view v-if="currentTab === 'all'" class="all-results">
          <!-- 帖子结果 -->
          <view v-if="searchResults.posts && searchResults.posts.list.length > 0" class="result-section">
            <view class="section-header">
              <text class="section-title">帖子</text>
              <text class="section-more" @click="switchTab('posts')">查看更多</text>
            </view>
            <view class="posts-list">
              <post-card
                v-for="post in searchResults.posts.list.slice(0, 3)"
                :key="post.id"
                :post="post"
              ></post-card>
            </view>
          </view>

          <!-- 用户结果 -->
          <view v-if="searchResults.users && searchResults.users.list.length > 0" class="result-section">
            <view class="section-header">
              <text class="section-title">用户</text>
              <text class="section-more" @click="switchTab('users')">查看更多</text>
            </view>
            <view class="users-list">
              <user-card 
                v-for="user in searchResults.users.list.slice(0, 3)" 
                :key="user.id"
                :user="user"
                @click="goToUserProfile(user.id)"
              ></user-card>
            </view>
          </view>

          <!-- 话题结果 -->
          <view v-if="searchResults.topics && searchResults.topics.list.length > 0" class="result-section">
            <view class="section-header">
              <text class="section-title">话题</text>
              <text class="section-more" @click="switchTab('topics')">查看更多</text>
            </view>
            <view class="topics-list">
              <topic-card
                v-for="topic in searchResults.topics.list.slice(0, 3)"
                :key="topic.id"
                :topic="topic"
                @click="goToTopicDetail"
              ></topic-card>
            </view>
          </view>
        </view>

        <!-- 帖子结果 -->
        <view v-else-if="currentTab === 'posts'" class="posts-results">
          <post-list
            :list="currentResults.list || []"
            :loading="loading"
            :finished="!hasMore"
            @load-more="loadMore"
          ></post-list>
        </view>

        <!-- 用户结果 -->
        <view v-else-if="currentTab === 'users'" class="users-results">
          <user-list
            :users="currentResults.list || []"
            :loading="loading"
            :has-more="hasMore"
            @load-more="loadMore"
          ></user-list>
        </view>

        <!-- 话题结果 -->
        <view v-else-if="currentTab === 'topics'" class="topics-results">
          <topic-list
            :topics="currentResults.list || []"
            :loading="loading"
            :has-more="hasMore"
            @load-more="loadMore"
          ></topic-list>
        </view>

        <!-- 无结果 -->
        <view v-if="!loading && isEmptyResults" class="empty-results">
          <view class="empty-icon">🔍</view>
          <text class="empty-text">没有找到相关内容</text>
          <text class="empty-tip">试试其他关键词吧</text>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading && !searchResults" class="loading-container">
      <view class="loading-content">
        <text class="loading-icon">⏳</text>
        <text class="loading-text">搜索中...</text>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/api'
import PostCard from '@/components/post/PostCard.vue'
import PostList from '@/components/post/PostList.vue'
import UserCard from '@/components/user/UserCard.vue'
import UserList from '@/components/user/UserList.vue'
import TopicCard from '@/components/topic/TopicCard.vue'
import TopicList from '@/components/topic/TopicList.vue'

export default {
  name: 'SearchPage',
  components: {
    PostCard,
    PostList,
    UserCard,
    UserList,
    TopicCard,
    TopicList
  },
  data() {
    return {
      searchKeyword: '',
      searchResults: null,
      searchSuggestions: [],
      hotSearches: [],
      searchHistory: [],
      currentTab: 'all',
      loading: false,
      hasMore: false,
      currentPage: 1,
      pageSize: 10,
      searchTabs: [
        { type: 'all', name: '全部' },
        { type: 'posts', name: '帖子' },
        { type: 'users', name: '用户' },
        { type: 'topics', name: '话题' }
      ],
      debounceTimer: null,
      navigating: false
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
    // 获取传入的搜索关键词
    if (options.keyword) {
      this.searchKeyword = decodeURIComponent(options.keyword)
      this.performSearch()
    }
    
    this.loadInitialData()
  },
  methods: {
    async loadInitialData() {
      try {
        // 并行加载热门搜索和搜索历史
        const [hotSearchesRes, historyRes] = await Promise.all([
          api.search.getHotSearches({ limit: 10 }),
          api.search.getSearchHistory({ limit: 20 })
        ])
        
        this.hotSearches = hotSearchesRes.data.hotSearches || []
        this.searchHistory = historyRes.data.history || []
      } catch (error) {
        console.error('加载初始数据失败:', error)
      }
    },
    
    onSearchInput() {
      // 防抖处理搜索建议
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }
      
      this.debounceTimer = setTimeout(() => {
        if (this.searchKeyword.trim()) {
          this.getSearchSuggestions()
        } else {
          this.searchSuggestions = []
          this.searchResults = null
        }
      }, 300)
    },
    
    onSearchConfirm() {
      if (this.searchKeyword.trim()) {
        this.performSearch()
      }
    },
    
    async getSearchSuggestions() {
      try {
        const res = await api.search.getSearchSuggestions({
          keyword: this.searchKeyword,
          limit: 8
        })
        this.searchSuggestions = res.data.suggestions || []
      } catch (error) {
        console.error('获取搜索建议失败:', error)
      }
    },
    
    async performSearch() {
      if (!this.searchKeyword.trim()) return
      
      this.loading = true
      this.searchSuggestions = []
      
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
          pageSize: this.pageSize
        })
        
        this.searchResults = res.data
        this.currentPage = 1
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

    async switchTab(type) {
      this.currentTab = type
      this.currentPage = 1

      if (type !== 'all' && this.searchKeyword.trim()) {
        this.loading = true

        try {
          // 确保 searchResults 对象存在
          if (!this.searchResults) {
            this.searchResults = {
              posts: { list: [], pagination: null },
              users: { list: [], pagination: null },
              topics: { list: [], pagination: null }
            }
          }

          let res
          switch (type) {
            case 'posts':
              res = await api.search.searchPosts({
                keyword: this.searchKeyword,
                page: 1,
                pageSize: this.pageSize
              })
              this.searchResults.posts = res.data
              break
            case 'users':
              res = await api.search.searchUsers({
                keyword: this.searchKeyword,
                page: 1,
                pageSize: this.pageSize
              })
              this.searchResults.users = res.data
              break
            case 'topics':
              res = await api.search.searchTopics({
                keyword: this.searchKeyword,
                page: 1,
                pageSize: this.pageSize
              })
              this.searchResults.topics = res.data
              break
          }

          this.updateHasMore()
        } catch (error) {
          console.error('切换标签搜索失败:', error)
        } finally {
          this.loading = false
        }
      }
    },

    async loadMore() {
      if (this.loading || !this.hasMore) return

      this.loading = true
      const nextPage = this.currentPage + 1

      try {
        let res
        switch (this.currentTab) {
          case 'posts':
            res = await api.search.searchPosts({
              keyword: this.searchKeyword,
              page: nextPage,
              pageSize: this.pageSize
            })
            this.searchResults.posts.list.push(...res.data.list)
            this.searchResults.posts.pagination = res.data.pagination
            break
          case 'users':
            res = await api.search.searchUsers({
              keyword: this.searchKeyword,
              page: nextPage,
              pageSize: this.pageSize
            })
            this.searchResults.users.list.push(...res.data.list)
            this.searchResults.users.pagination = res.data.pagination
            break
          case 'topics':
            res = await api.search.searchTopics({
              keyword: this.searchKeyword,
              page: nextPage,
              pageSize: this.pageSize
            })
            this.searchResults.topics.list.push(...res.data.list)
            this.searchResults.topics.pagination = res.data.pagination
            break
        }

        this.currentPage = nextPage
        this.updateHasMore()
      } catch (error) {
        console.error('加载更多失败:', error)
      } finally {
        this.loading = false
      }
    },

    updateHasMore() {
      const current = this.currentResults
      if (current.pagination) {
        this.hasMore = current.pagination.page < current.pagination.totalPages
      } else {
        this.hasMore = false
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

    getSuggestionIcon(type) {
      switch (type) {
        case 'user':
          return '👤'
        case 'topic':
          return '💬'
        default:
          return '🔍'
      }
    },

    selectSuggestion(suggestion) {
      this.searchKeyword = suggestion.text
      this.performSearch()
    },

    selectHotSearch(keyword) {
      this.searchKeyword = keyword
      this.performSearch()
    },

    selectHistory(keyword) {
      this.searchKeyword = keyword
      this.performSearch()
    },

    clearSearch() {
      this.searchKeyword = ''
      this.searchResults = null
      this.searchSuggestions = []
    },

    async clearHistory() {
      try {
        await uni.showModal({
          title: '确认清除',
          content: '确定要清除所有搜索历史吗？'
        })

        await api.search.clearSearchHistory()
        this.searchHistory = []

        uni.showToast({
          title: '清除成功',
          icon: 'success'
        })
      } catch (error) {
        if (error.cancel) return
        console.error('清除搜索历史失败:', error)
      }
    },

    goBack() {
      uni.navigateBack()
    },

    goToPostDetail(postId) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${postId}`
      })
    },

    goToUserProfile(userId) {
      uni.navigateTo({
        url: `/pages/profile/profile?userId=${userId}`
      })
    },

    goToTopicDetail(topicId) {
      if (!topicId) {
        uni.showToast({
          title: '话题ID无效',
          icon: 'none'
        });
        return;
      }

      // 防止重复导航
      if (this.navigating) {
        return;
      }

      this.navigating = true;

      uni.navigateTo({
        url: `/pages/topic/detail?id=${topicId}`,
        success: () => {
          setTimeout(() => {
            this.navigating = false;
          }, 1000);
        },
        fail: (err) => {
          console.error('导航失败:', err);
          this.navigating = false;
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.search-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;

  .search-input-container {
    flex: 1;
    display: flex;
    align-items: center;
    background-color: #f5f5f5;
    border-radius: 40rpx;
    padding: 20rpx 30rpx;
    margin-right: 20rpx;

    .search-input {
      flex: 1;
      margin-left: 20rpx;
      font-size: 28rpx;
      color: #333;

      &::placeholder {
        color: #999;
      }
    }

    .search-icon {
      font-size: 32rpx;
      color: #999;
    }

    .clear-btn {
      margin-left: 20rpx;
      padding: 10rpx;

      .clear-icon {
        font-size: 32rpx;
        color: #999;
        font-weight: bold;
      }
    }
  }

  .cancel-btn {
    font-size: 28rpx;
    color: #007aff;
    padding: 10rpx;
  }
}

.search-tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;

  .search-tab {
    flex: 1;
    text-align: center;
    padding: 30rpx 20rpx;
    font-size: 28rpx;
    color: #666;
    position: relative;

    &.active {
      color: #007aff;
      font-weight: 500;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60rpx;
        height: 4rpx;
        background-color: #007aff;
        border-radius: 2rpx;
      }
    }

    .tab-count {
      font-size: 24rpx;
      margin-left: 8rpx;
    }
  }
}

.search-content {
  padding: 30rpx;
}

.search-suggestions {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;

  .suggestions-title {
    font-size: 28rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 20rpx;
  }

  .suggestions-list {
    .suggestion-item {
      display: flex;
      align-items: center;
      padding: 20rpx 0;
      border-bottom: 1rpx solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      .suggestion-icon {
        font-size: 28rpx;
        color: #666;
      }

      .suggestion-text {
        margin-left: 20rpx;
        font-size: 28rpx;
        color: #333;
      }
    }
  }
}

.hot-searches {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;

  .hot-title {
    font-size: 28rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 20rpx;
  }

  .hot-list {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;

    .hot-item {
      background-color: #f5f5f5;
      border-radius: 30rpx;
      padding: 16rpx 24rpx;
      font-size: 26rpx;
      color: #666;
    }
  }
}

.search-history {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .history-title {
      font-size: 28rpx;
      font-weight: 500;
      color: #333;
    }

    .clear-history-btn {
      padding: 10rpx;

      .clear-history-icon {
        font-size: 28rpx;
        color: #999;
      }
    }
  }

  .history-list {
    .history-item {
      display: flex;
      align-items: center;
      padding: 20rpx 0;
      border-bottom: 1rpx solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      .history-icon {
        font-size: 24rpx;
        color: #999;
      }

      .history-text {
        margin-left: 20rpx;
        font-size: 28rpx;
        color: #666;
      }
    }
  }
}

.search-results {
  .result-section {
    background-color: #fff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;

      .section-title {
        font-size: 32rpx;
        font-weight: 500;
        color: #333;
      }

      .section-more {
        font-size: 26rpx;
        color: #007aff;
      }
    }
  }
}

.empty-results {
  text-align: center;
  padding: 100rpx 30rpx;

  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 30rpx;
  }

  .empty-text {
    display: block;
    font-size: 32rpx;
    color: #666;
    margin-bottom: 20rpx;
  }

  .empty-tip {
    display: block;
    font-size: 26rpx;
    color: #999;
  }
}

.loading-container {
  padding: 60rpx 30rpx;

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .loading-icon {
      font-size: 48rpx;
      margin-bottom: 20rpx;
      animation: rotate 2s linear infinite;
    }

    .loading-text {
      font-size: 28rpx;
      color: #666;
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
