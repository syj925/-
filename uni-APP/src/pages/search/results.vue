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
              <input v-model="searchKeyword" class="search-input" placeholder="搜索内容" confirm-type="search"
                @confirm="onSearchConfirm" @input="onSearchInput" />
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
          <view class="tabs-scroll">
            <view class="tabs-container">
              <view v-for="tab in searchTabs" :key="tab.type" class="tab-item" :class="{
                active: currentTab === tab.type
              }" @click="switchTab(tab.type)">
                <text class="tab-name">{{ tab.name }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 筛选器 -->
        <view v-if="currentTab !== 'all'" class="filters-bar">
          <scroll-view class="filters-scroll" scroll-x>
            <view class="filters-container"
              style="display: flex; flex-direction: row; align-items: center; flex-wrap: nowrap; overflow-x: auto;">
              <!-- 排序筛选 -->
              <view class="filter-section"
                style="display: flex; flex-direction: row; align-items: center; flex-shrink: 0;">
                <text class="section-title">排序</text>
                <view class="filter-chips" style="display: flex; flex-direction: row; flex-wrap: nowrap;">
                  <view v-for="sort in sortOptions" :key="sort.value" class="filter-chip"
                    :class="{ active: currentSort === sort.value }" @click="changeSortOrder(sort.value)">
                    <text>{{ sort.label }}</text>
                  </view>
                </view>
              </view>

              <!-- 时间筛选 -->
              <view class="filter-section"
                style="display: flex; flex-direction: row; align-items: center; flex-shrink: 0;">
                <text class="section-title">时间</text>
                <view class="filter-chips" style="display: flex; flex-direction: row; flex-wrap: nowrap;">
                  <view v-for="time in timeFilters" :key="time.value" class="filter-chip"
                    :class="{ active: currentTimeFilter === time.value }" @click="changeTimeFilter(time.value)">
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
              <!-- 话题结果 -->
              <view v-if="searchResults.topics?.list?.length > 0" class="result-category">
                <view class="category-header">
                  <view class="header-left">
                    <text class="category-title">话题</text>
                  </view>
                  <view class="header-right" @click="switchTab('topics')">
                    <view class="view-all-container">
                      <text class="view-all">查看全部</text>
                      <view class="view-all-count">
                        <text>{{ searchResults.topics.pagination?.total || 0 }}</text>
                      </view>
                    </view>
                  </view>
                </view>
                <view class="category-items">
                  <view v-for="topic in searchResults.topics.list.slice(0, 3)" :key="'topic-' + topic.id"
                    class="result-card topic-card" @click="goToTopicDetail(topic.id)">
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
                <!-- 话题展示更多提示 -->
                <view v-if="searchResults.topics.list.length > 3" class="show-more-btn" @click="switchTab('topics')">
                  <view class="show-more-container">
                    <text class="show-more-text">点击显示更多话题</text>
                    <view class="show-more-count">
                      <text>{{ searchResults.topics.list.length - 3 }}</text>
                    </view>
                  </view>
                </view>
              </view>

              <!-- 用户结果 -->
              <view v-if="searchResults.users?.list?.length > 0" class="result-category">
                <view class="category-header">
                  <view class="header-left">
                    <text class="category-title">用户</text>
                  </view>
                  <view class="header-right" @click="switchTab('users')">
                    <view class="view-all-container">
                      <text class="view-all">查看全部</text>
                      <view class="view-all-count">
                        <text>{{ searchResults.users.pagination?.total || 0 }}</text>
                      </view>
                    </view>
                  </view>
                </view>
                <view class="category-items">
                  <SearchUserCard 
                    v-for="user in searchResults.users.list.slice(0, 6)" 
                    :key="'user-' + user.id"
                    :user="user"
                    @follow-change="handleFollowChange"
                  />
                </view>
                <!-- 用户展示更多提示 -->
                <view v-if="searchResults.users.list.length > 6" class="show-more-btn" @click="switchTab('users')">
                  <view class="show-more-container">
                    <text class="show-more-text">查看更多用户</text>
                    <view class="show-more-count">
                      <text>{{ searchResults.users.list.length - 6 }}</text>
                    </view>
                  </view>
                </view>
              </view>

              <!-- 帖子结果 -->
              <view v-if="searchResults.posts?.list?.length > 0" class="result-category">
                <view class="category-header">
                  <view class="header-left">
                    <text class="category-title">帖子</text>
                  </view>
                </view>
                <view class="category-items">
                  <PostCard v-for="post in searchResults.posts.list" :key="'post-' + post.id" :post="post"
                    :compact="true" @like="handlePostLike" @comment="handlePostComment" @favorite="handlePostFavorite"
                    @share="handlePostShare" @userClick="handleUserClick" @commentLike="handleCommentLike" />
                </view>
              </view>
            </template>

            <!-- 单类型结果展示 -->
            <template v-else>
              <!-- 帖子列表 -->
              <template v-if="currentTab === 'posts'">
                <PostCard v-for="item in currentResults.list" :key="item.id" :post="item" :compact="true"
                  @like="handlePostLike" @comment="handlePostComment" @favorite="handlePostFavorite"
                  @share="handlePostShare" @userClick="handleUserClick" @commentLike="handleCommentLike" />
              </template>

              <!-- 用户列表 -->
              <template v-else-if="currentTab === 'users'">
                <SearchUserCard 
                  v-for="item in currentResults.list" 
                  :key="item.id"
                  :user="item"
                  @follow-change="handleFollowChange"
                />
              </template>

              <!-- 话题列表 -->
              <template v-else-if="currentTab === 'topics'">
                <view v-for="item in currentResults.list" :key="item.id" class="result-card topic-card"
                  @click="goToItemDetail(item, currentTab)">
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
                </view>
              </template>
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
              <text class="empty-title">没有找到相关内容</text>
              <text class="empty-desc">试试其他关键词吧</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 初始状态 -->
      <view v-else class="initial-state">
        <text class="initial-text">输入关键词开始搜索</text>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/api'
import PostCard from '@/components/post/PostCard.vue'
import SearchUserCard from '@/components/user/SearchUserCard.vue'
import { UrlUtils } from '@/utils'

export default {
  name: 'SearchResultsPage',
  components: {
    PostCard,
    SearchUserCard
  },
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

      console.log('🔍 开始搜索:', {
        keyword: this.searchKeyword,
        type: this.currentTab,
        hasToken: !!uni.getStorageSync('token')
      })

      try {
        // 执行搜索（后端会自动保存搜索历史）
        const res = await api.search.globalSearch({
          keyword: this.searchKeyword,
          type: this.currentTab,
          page: 1,
          pageSize: this.pageSize,
          orderBy: this.currentSort,
          timeFilter: this.currentTimeFilter
        })

        console.log('✅ 搜索成功:', {
          keyword: this.searchKeyword,
          resultsCount: {
            posts: res.data.posts?.list?.length || 0,
            users: res.data.users?.list?.length || 0,
            topics: res.data.topics?.list?.length || 0
          },
          searchTime: Date.now() - startTime + 'ms'
        })

        this.searchResults = res.data
        this.currentPage = 1
        this.searchTime = Date.now() - startTime
        this.updateHasMore()

        // 手动保存搜索历史（作为备用方案）
        this.saveSearchHistoryManually()

      } catch (error) {
        console.error('❌ 搜索失败:', error)
        uni.showToast({
          title: '搜索失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    // 手动保存搜索历史
    async saveSearchHistoryManually() {
      const token = uni.getStorageSync('token')
      if (!token) {
        console.log('⚠️ 未登录，跳过保存搜索历史')
        return
      }

      try {
        console.log('💾 手动保存搜索历史:', {
          keyword: this.searchKeyword,
          type: this.currentTab
        })

        const res = await api.search.saveSearchHistory({
          keyword: this.searchKeyword,
          type: this.currentTab
        })

        console.log('✅ 搜索历史保存成功:', res)
      } catch (error) {
        console.error('❌ 搜索历史保存失败:', error)
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

    // 处理关注状态变化
    handleFollowChange(event) {
      const { userId, isFollowed } = event
      console.log(`用户 ${userId} 关注状态变化为: ${isFollowed}`)
      
      // 可以在这里更新搜索结果中的用户关注状态
      if (this.searchResults?.users?.list) {
        const userIndex = this.searchResults.users.list.findIndex(user => user.id === userId)
        if (userIndex !== -1) {
          this.searchResults.users.list[userIndex].isFollowed = isFollowed
        }
      }
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
      // 使用URL工具函数，避免硬编码服务器地址
      return UrlUtils.ensureAbsoluteUrl(imagePath)
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
    },

    // PostCard 事件处理方法
    handlePostLike(post) {
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        uni.navigateTo({ url: '/pages/auth/login/index' });
        return;
      }

      // 先乐观更新UI
      const originalState = post.isLiked;
      const originalCount = post.likeCount;
      const newState = !post.isLiked;
      post.isLiked = newState;
      post.likeCount += newState ? 1 : -1;

      // 调用API
      const apiPromise = newState 
        ? this.$api.like.like('post', post.id)
        : this.$api.like.unlike('post', post.id);
      
      apiPromise
        .then(res => {
          uni.showToast({ title: newState ? '点赞成功' : '取消点赞', icon: 'success' });
        })
        .catch(err => {
          console.error('点赞操作失败:', err);
          // 恢复原始状态
          post.isLiked = originalState;
          post.likeCount = originalCount;
          uni.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
        });
    },

    handlePostComment(post) {
      console.log('评论帖子:', post.id)
      // 跳转到帖子详情页的评论区
      uni.navigateTo({
        url: `/pages/post/detail?id=${post.id}&scrollToComments=true`
      })
    },

    handlePostFavorite(post) {
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        uni.navigateTo({ url: '/pages/auth/login/index' });
        return;
      }

      // 先乐观更新UI
      const originalState = post.isFavorited;
      const originalCount = post.favoriteCount;
      const newState = !post.isFavorited;
      post.isFavorited = newState;
      post.favoriteCount += newState ? 1 : -1;

      // 调用API
      const apiPromise = newState 
        ? this.$api.favorite.favorite(post.id)
        : this.$api.favorite.unfavorite(post.id);
      
      apiPromise
        .then(res => {
          uni.showToast({ title: newState ? '收藏成功' : '取消收藏', icon: 'success' });
        })
        .catch(err => {
          console.error('收藏操作失败:', err);
          // 恢复原始状态
          post.isFavorited = originalState;
          post.favoriteCount = originalCount;
          uni.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
        });
    },

    handlePostShare(post) {
      console.log('分享帖子:', post.id)
      // TODO: 实现分享逻辑
      uni.showToast({
        title: '分享功能待实现',
        icon: 'none'
      })
    },

    handleUserClick(user) {
      console.log('点击用户:', user.id)
      if (user && user.id) {
        uni.navigateTo({
          url: `/pages/user/user-profile?id=${user.id}`
        })
      }
    },

    handleCommentLike(comment) {
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        uni.navigateTo({ url: '/pages/auth/login/index' });
        return;
      }

      // 先乐观更新UI
      const originalState = comment.isLiked;
      const originalCount = comment.likeCount;
      const newState = !comment.isLiked;
      comment.isLiked = newState;
      comment.likeCount += newState ? 1 : -1;

      // 调用API
      const apiPromise = newState 
        ? this.$api.like.like('comment', comment.id)
        : this.$api.like.unlike('comment', comment.id);
      
      apiPromise
        .then(res => {
          uni.showToast({ title: newState ? '点赞成功' : '取消点赞', icon: 'success' });
        })
        .catch(err => {
          console.error('评论点赞操作失败:', err);
          // 恢复原始状态
          comment.isLiked = originalState;
          comment.likeCount = originalCount;
          uni.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
        });
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
        color: #333333;
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

      &:nth-child(1) {
        animation-delay: -0.32s;
      }

      &:nth-child(2) {
        animation-delay: -0.16s;
      }

      &:nth-child(3) {
        animation-delay: 0s;
      }
    }
  }

  .loading-text {
    font-size: 28rpx;
    color: #666;
  }
}

@keyframes loading-bounce {

  0%,
  80%,
  100% {
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
    width: 100%;
  }

  .tabs-container {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    padding: 20rpx 20rpx;
    gap: 12rpx;
    width: 100%;
    justify-content: space-between;
  }

  .tab-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16rpx 12rpx;
    border-radius: 50rpx;
    background: #f5f7fa;
    transition: all 0.3s ease;
    white-space: nowrap;
    flex: 1;
    min-width: 0;

    &.active {
      background: #ffffff;

      .tab-name {
        color: #333333;
        font-weight: bold;
      }
    }

    .tab-name {
      font-size: 26rpx;
      color: #333333;
      font-weight: 500;
      transition: all 0.3s ease;
      white-space: nowrap;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
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
  margin-bottom: 10rpx;

  .category-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10rpx;

    .header-left {
      display: flex;
      align-items: center;

      .category-title {
        font-size: 32rpx;
        color: #333;
        font-weight: 600;
      }
    }

    .header-right {
      display: flex;
      align-items: center;

      .view-all-container {
        display: flex;
        align-items: center;
        gap: 8rpx;
      }

      .view-all {
        font-size: 24rpx;
        color: #333333;
        padding: 8rpx 16rpx;
        border: 1rpx solid #ddd;
        border-radius: 20rpx;
        background: #ffffff;
      }

      .view-all-count {
        padding: 6rpx 12rpx;
        background: #f5f5f5;
        border: 1rpx solid #ddd;
        border-radius: 16rpx;

        text {
          font-size: 20rpx;
          color: #666666;
          font-weight: 500;
        }
      }
    }
  }

  .category-items {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }

  /* 显示更多按钮 */
  .show-more-btn {
    margin-top: 14rpx;
    padding: 24rpx 32rpx;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 16rpx;
    border: 2rpx solid #e9ecef;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.98);
      background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
    }

    .show-more-container {
      display: flex;
      align-items: center;
      gap: 8rpx;
    }

    .show-more-text {
      font-size: 26rpx;
      color: #333333;
      font-weight: 500;
      padding: 8rpx 16rpx;
      border: 1rpx solid #ddd;
      border-radius: 20rpx;
      background: #ffffff;
    }

    .show-more-count {
      padding: 6rpx 12rpx;
      background: #f5f5f5;
      border: 1rpx solid #ddd;
      border-radius: 16rpx;

      text {
        font-size: 22rpx;
        color: #666666;
        font-weight: 500;
      }
    }
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

/* PostCard组件在搜索结果页面中使用compact模式，无需额外样式调整 */

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
      -webkit-line-clamp: 1;
      line-clamp: 1;
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
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        font-size: 40rpx;
        color: #333333;
        font-weight: bold;
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

  .initial-text {
    font-size: 28rpx;
    color: #999;
  }
}
</style>
