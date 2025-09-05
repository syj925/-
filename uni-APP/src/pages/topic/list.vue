<template>
  <view class="topic-page">
    <!-- 搜索头部 -->
    <view class="search-header">
      <view class="search-input-container">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          type="text"
          v-model="searchKeyword"
          placeholder="搜索话题..."
          @input="onSearchInput"
          @confirm="searchTopics"
          confirm-type="search"
        />
        <view v-if="searchKeyword" class="clear-btn" @tap="clearSearch">
          <text class="clear-icon">×</text>
        </view>
      </view>
    </view>

    <!-- 话题分类 -->
    <view class="category">
      <scroll-view
        class="category-scroll"
        scroll-x
        scroll-with-animation
        :scroll-into-view="'tab-' + currentTab"
      >
        <view class="category-list">
          <view
            v-for="tab in tabs"
            :key="tab.key"
            :id="'tab-' + tab.key"
            class="category-item"
            :class="{ active: currentTab === tab.key }"
            @tap="switchTab(tab.key)"
          >
            {{ tab.name }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 话题列表 -->
    <view class="topic-list">
      <view
        class="topic-item"
        v-for="topic in topics"
        :key="topic.id"
        @tap="navigateToTopic(topic.id)"
      >
        <view class="topic-left">
          <view class="topic-tag">#</view>
        </view>
        <view class="topic-content">
          <view class="topic-header">
            <text class="topic-title">{{ topic.name }}</text>
            <text class="topic-hot" v-if="topic.is_hot">🔥</text>
          </view>
          <text class="topic-desc" v-if="topic.description">{{ topic.description }}</text>
          <view class="topic-meta">
            <text class="topic-participants">{{ topic.post_count || 0 }}条内容</text>
            <text class="topic-views">{{ formatNumber(topic.view_count || 0) }}次浏览</text>
          </view>
        </view>
        <view class="topic-right">
          <text class="topic-score">{{ formatHotScore(topic.hot_score) }}</text>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="loading" v-if="loading">
        <text>加载中...</text>
      </view>

      <!-- 空状态 -->
      <view class="empty-list" v-if="!loading && topics.length === 0">
        <text class="empty-icon">📝</text>
        <text class="empty-text">{{ searchKeyword ? '没有找到相关话题' : '暂无话题' }}</text>
        <text class="empty-desc">{{ searchKeyword ? '试试其他关键词吧' : '快来创建第一个话题吧' }}</text>
      </view>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="!loading && topics.length > 0 && hasMore" @tap="loadMore">
      <text>加载更多</text>
    </view>

    <view class="no-more" v-if="!loading && topics.length > 0 && !hasMore">
      <text>没有更多话题了</text>
    </view>

    <!-- 底部安全区占位 -->
    <view class="safe-area"></view>
  </view>
</template>

<script>
import { topicApi } from '@/api'

export default {
  data() {
    return {
      topics: [],
      loading: false,
      searchKeyword: '',
      currentTab: 'hot',
      currentPage: 1,
      pageSize: 10,
      totalCount: 0,
      hasMore: true,
      searchTimer: null,
      tabs: [
        { key: 'hot', name: '热门' },
        { key: 'trending', name: '趋势' },
        { key: 'latest', name: '最新' },
        { key: 'all', name: '全部' }
      ]
    }
  },
  
  onLoad() {
    this.loadTopics()
  },
  
  onReachBottom() {
    if (this.hasMore && !this.loading) {
      this.loadMore()
    }
  },
  
  onPullDownRefresh() {
    this.refreshTopics()
  },
  
  methods: {
    // 清除搜索
    clearSearch() {
      this.searchKeyword = ''
      this.refreshTopics()
    },

    // 格式化数字
    formatNumber(num) {
      if (!num) return '0'
      if (num < 1000) return num.toString()
      if (num < 10000) return (num / 1000).toFixed(1) + 'k'
      return (num / 10000).toFixed(1) + 'w'
    },
    // 加载话题列表
    async loadTopics(isRefresh = false) {
      if (this.loading) return
      
      this.loading = true
      
      try {
        if (isRefresh) {
          this.currentPage = 1
          this.hasMore = true
        }
        
        let result
        
        // 统一使用列表API，通过不同参数实现不同功能
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize,
          orderBy: this.getOrderBy(),
          orderDirection: 'DESC'
        }

        // 添加搜索关键词
        if (this.searchKeyword) {
          params.keyword = this.searchKeyword
        }

        // 添加特殊筛选条件
        if (this.currentTab === 'hot') {
          params.is_hot = true
        }

        result = await topicApi.getList(params)
        result = result.data
        
        if (result && result.list) {
          if (isRefresh || this.currentPage === 1) {
            this.topics = result.list
          } else {
            this.topics = [...this.topics, ...result.list]
          }

          this.totalCount = result.pagination?.total || this.topics.length

          // 修复hasMore判断逻辑
          if (result.pagination?.total) {
            // 如果有总数信息，根据总数判断
            this.hasMore = this.topics.length < result.pagination.total
          } else {
            // 如果没有总数信息，根据返回数据量判断
            this.hasMore = result.list.length === this.pageSize
          }
        }
        
      } catch (error) {
        console.error('加载话题失败:', error)
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
    
    // 刷新话题列表
    refreshTopics() {
      this.loadTopics(true)
    },
    
    // 加载更多
    loadMore() {
      if (this.hasMore && !this.loading) {
        this.currentPage++
        this.loadTopics()
      }
    },
    
    // 切换标签
    switchTab(tabKey) {
      if (this.currentTab === tabKey) return
      
      this.currentTab = tabKey
      this.currentPage = 1
      this.searchKeyword = ''
      this.loadTopics(true)
    },
    
    // 搜索输入
    onSearchInput() {
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => {
        if (this.searchKeyword.trim()) {
          this.searchTopics()
        } else {
          this.loadTopics(true)
        }
      }, 500)
    },
    
    // 搜索话题
    searchTopics() {
      this.currentPage = 1
      this.loadTopics(true)
    },
    
    // 获取排序字段
    getOrderBy() {
      switch (this.currentTab) {
        case 'trending':
          return 'hot_score'
        case 'hot':
          return 'post_count'
        case 'latest':
          return 'created_at'
        default:
          return 'hot_score'
      }
    },
    
    // 格式化热度分数
    formatHotScore(score) {
      if (!score) return '0'
      if (score >= 1000) {
        return (score / 1000).toFixed(1) + 'k'
      }
      return Math.round(score).toString()
    },
    
    // 跳转到话题详情（兼容旧方法名）
    navigateToTopic(id) {
      uni.navigateTo({
        url: `/pages/topic/detail?id=${id}`
      })
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.topic-page {
  min-height: 100vh;
  background-color: $bg-page;
  display: flex;
  flex-direction: column;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 280rpx;
    background: linear-gradient(180deg, rgba($primary-color, 0.08), rgba($primary-color, 0) 90%);
    z-index: 0;
    pointer-events: none;
  }
}

// 搜索头部
.search-header {
  background-color: $bg-card;
  padding: $spacing-md;
  border-radius: 0 0 $radius-lg $radius-lg;
  box-shadow: $shadow-sm;
  position: relative;
  z-index: 1;
}

.search-input-container {
  display: flex;
  align-items: center;
  background-color: $bg-secondary;
  border-radius: $radius-xl;
  padding: $spacing-sm $spacing-md;
  position: relative;
}

.search-icon {
  font-size: $font-size-lg;
  margin-right: $spacing-sm;
}

.search-input {
  flex: 1;
  font-size: $font-size-md;
  color: $text-primary;
  background: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: $text-tertiary;
  }
}

.clear-btn {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: $text-tertiary;

  .clear-icon {
    color: $text-white;
    font-size: $font-size-lg;
    font-weight: bold;
  }
}

// 分类标签
.category {
  background-color: $bg-card;
  padding: $spacing-sm 0;
  border-radius: 0 0 $radius-lg $radius-lg;
  box-shadow: $shadow-sm;
  position: relative;
  z-index: 1;
  margin-bottom: $spacing-md;
}

.category-scroll {
  white-space: nowrap;
  width: 100%;
}

.category-list {
  display: inline-block;
  padding: 0 $spacing-md;
}

.category-item {
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
    color: #333333;
    font-weight: bold;
    background: transparent;
    box-shadow: none;
    transform: none;
  }

  &:last-child {
    margin-right: 0;
  }
}

// 话题列表
.topic-list {
  padding: 0 $spacing-md;

  .topic-item {
    display: flex;
    align-items: flex-start;
    background-color: $bg-card;
    border-radius: $radius-lg;
    padding: $spacing-lg;
    margin-bottom: $spacing-md;
    box-shadow: $shadow-sm;
    transition: all 0.3s;
    position: relative;
    z-index: 1;

    &:active {
      transform: scale(0.98);
      box-shadow: $shadow-md;
    }
  }

  .topic-left {
    margin-right: $spacing-md;

    .topic-tag {
      width: 60rpx;
      height: 60rpx;
      background: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333333;
      font-size: $font-size-xl;
      font-weight: bold;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
    }
  }

  .topic-content {
    flex: 1;

    .topic-header {
      display: flex;
      align-items: center;
      margin-bottom: $spacing-xs;

      .topic-title {
        font-size: $font-size-lg;
        font-weight: 600;
        color: $text-primary;
        margin-right: $spacing-xs;
      }

      .topic-hot {
        font-size: $font-size-sm;
      }
    }

    .topic-desc {
      font-size: $font-size-md;
      color: $text-secondary;
      margin-bottom: $spacing-sm;
      line-height: 1.5;
    }

    .topic-meta {
      display: flex;
      align-items: center;
      gap: $spacing-md;

      text {
        font-size: $font-size-sm;
        color: $text-tertiary;
      }
    }
  }

  .topic-right {
    .topic-score {
      font-size: $font-size-sm;
      color: $primary-color;
      font-weight: 500;
    }
  }
}

// 加载状态
.loading {
  text-align: center;
  padding: $spacing-xl 0;

  text {
    font-size: $font-size-md;
    color: $text-tertiary;
  }
}

// 空状态
.empty-list {
  text-align: center;
  padding: 100rpx $spacing-md;

  .empty-icon {
    font-size: 120rpx;
    display: block;
    margin-bottom: $spacing-lg;
  }

  .empty-text {
    font-size: $font-size-lg;
    font-weight: 500;
    color: $text-primary;
    margin-bottom: $spacing-sm;
    display: block;
  }

  .empty-desc {
    font-size: $font-size-md;
    color: $text-tertiary;
    display: block;
  }
}

// 加载更多
.load-more {
  text-align: center;
  padding: $spacing-lg 0;

  text {
    font-size: $font-size-md;
    color: $primary-color;
    font-weight: 500;
  }
}

// 没有更多
.no-more {
  text-align: center;
  padding: $spacing-lg 0;

  text {
    font-size: $font-size-sm;
    color: $text-tertiary;
  }
}

// 底部安全区
.safe-area {
  height: 34rpx;
}
</style>
