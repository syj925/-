<template>
  <view class="topic-list-container">
    <!-- 话题头部 -->
    <view class="topic-header">
      <view class="header-content">
        <view class="header-left">
          <image class="topic-icon" src="/static/icons/topic.png" mode="aspectFit"></image>
          <view class="topic-info">
            <text class="topic-name">话题广场</text>
            <text class="topic-desc">发现感兴趣的校园话题</text>
          </view>
        </view>
        <view class="topic-stats">
          <text class="topic-count">{{ totalCount }}+ 话题</text>
        </view>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-section">
      <view class="search-bar">
        <image class="search-icon" src="/static/icons/search.png" mode="aspectFit"></image>
        <input 
          class="search-input" 
          placeholder="搜索话题..." 
          v-model="searchKeyword"
          @input="onSearchInput"
          @confirm="searchTopics"
        />
        <view class="search-btn" @tap="searchTopics" v-if="searchKeyword">
          <text>搜索</text>
        </view>
      </view>
    </view>

    <!-- 话题分类标签 -->
    <view class="topic-tabs">
      <view 
        class="tab-item" 
        :class="{ active: currentTab === tab.key }"
        v-for="tab in tabs" 
        :key="tab.key"
        @tap="switchTab(tab.key)"
      >
        <text class="tab-text">{{ tab.name }}</text>
      </view>
    </view>
    
    <!-- 话题列表 -->
    <view class="topic-list">
      <template v-if="!loading && topics.length > 0">
        <view 
          class="topic-item" 
          v-for="(item, index) in topics" 
          :key="index" 
          @tap="navigateToTopic(item.id)"
        >
          <view class="topic-left">
            <view class="topic-tag">#</view>
          </view>
          <view class="topic-content">
            <text class="topic-title">{{ item.name }}</text>
            <text class="topic-desc" v-if="item.description">{{ item.description }}</text>
            <view class="topic-meta">
              <text class="topic-participants">{{ item.post_count || 0 }}条内容</text>
              <text class="topic-views">{{ item.view_count || 0 }}次浏览</text>
              <text class="topic-hot" v-if="item.is_hot">🔥 热门</text>
            </view>
          </view>
          <view class="topic-right">
            <text class="topic-score">{{ formatHotScore(item.hot_score) }}</text>
          </view>
        </view>
      </template>
      
      <view class="empty-list" v-if="!loading && topics.length === 0">
        <image src="/static/images/empty-data.png" mode="aspectFit"></image>
        <text>{{ searchKeyword ? '没有找到相关话题' : '暂无话题' }}</text>
      </view>
      
      <view class="loading" v-if="loading">
        <text>加载中...</text>
      </view>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="!loading && topics.length > 0 && hasMore" @tap="loadMore">
      <text>加载更多</text>
    </view>
    
    <view class="no-more" v-if="!loading && topics.length > 0 && !hasMore">
      <text>没有更多话题了</text>
    </view>
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
      currentTab: 'trending',
      currentPage: 1,
      pageSize: 10,
      totalCount: 0,
      hasMore: true,
      searchTimer: null,
      tabs: [
        { key: 'trending', name: '趋势' },
        { key: 'hot', name: '热门' },
        { key: 'latest', name: '最新' }
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
        
        if (this.searchKeyword) {
          // 搜索话题
          result = await topicApi.search(this.searchKeyword, this.pageSize * this.currentPage)
          result = {
            list: result.data || [],
            pagination: {
              total: result.data?.length || 0
            }
          }
        } else {
          // 根据标签获取话题
          const params = {
            page: this.currentPage,
            pageSize: this.pageSize,
            orderBy: this.getOrderBy(),
            orderDirection: 'DESC'
          }
          
          if (this.currentTab === 'hot') {
            result = await topicApi.getHot(this.pageSize * this.currentPage)
            result = {
              list: result.data || [],
              pagination: {
                total: result.data?.length || 0
              }
            }
          } else if (this.currentTab === 'trending') {
            result = await topicApi.getTrending(this.pageSize * this.currentPage)
            result = {
              list: result.data || [],
              pagination: {
                total: result.data?.length || 0
              }
            }
          } else {
            result = await topicApi.getList(params)
            result = result.data
          }
        }
        
        if (result && result.list) {
          if (isRefresh || this.currentPage === 1) {
            this.topics = result.list
          } else {
            this.topics = [...this.topics, ...result.list]
          }
          
          this.totalCount = result.pagination?.total || this.topics.length
          this.hasMore = result.list.length >= this.pageSize
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
    
    // 跳转到话题详情
    navigateToTopic(id) {
      uni.navigateTo({
        url: `/pages/topic/detail?id=${id}`
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.topic-list-container {
  padding: 0 30rpx 40rpx;
  background-color: #f7f8fa;
  min-height: 100vh;
}

.topic-header {
  background: linear-gradient(to right, rgba(74, 144, 226, 0.1), rgba(74, 144, 226, 0.15));
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 30rpx;
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .header-left {
    display: flex;
    align-items: center;
  }
  
  .topic-icon {
    width: 60rpx;
    height: 60rpx;
    margin-right: 20rpx;
  }
  
  .topic-info {
    .topic-name {
      display: block;
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 8rpx;
    }
    
    .topic-desc {
      font-size: 26rpx;
      color: #666;
    }
  }
  
  .topic-stats {
    .topic-count {
      font-size: 28rpx;
      color: #4A90E2;
      font-weight: 500;
    }
  }
}

.search-section {
  margin-bottom: 30rpx;
  
  .search-bar {
    display: flex;
    align-items: center;
    background: white;
    border-radius: 50rpx;
    padding: 20rpx 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
    
    .search-icon {
      width: 32rpx;
      height: 32rpx;
      margin-right: 20rpx;
    }
    
    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: #333;
    }
    
    .search-btn {
      background: #4A90E2;
      color: white;
      padding: 12rpx 24rpx;
      border-radius: 30rpx;
      font-size: 26rpx;
    }
  }
}

.topic-tabs {
  display: flex;
  background: white;
  border-radius: 50rpx;
  padding: 8rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 20rpx;
    border-radius: 40rpx;
    transition: all 0.3s ease;
    
    &.active {
      background: #4A90E2;
      
      .tab-text {
        color: white;
        font-weight: 500;
      }
    }
    
    .tab-text {
      font-size: 28rpx;
      color: #666;
    }
  }
}

.topic-list {
  .topic-item {
    display: flex;
    align-items: flex-start;
    background: white;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
    transition: transform 0.2s ease;
    
    &:active {
      transform: scale(0.98);
    }
  }
  
  .topic-left {
    margin-right: 20rpx;
    
    .topic-tag {
      width: 60rpx;
      height: 60rpx;
      background: linear-gradient(135deg, #4A90E2, #357ABD);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 32rpx;
      font-weight: bold;
    }
  }
  
  .topic-content {
    flex: 1;
    
    .topic-title {
      display: block;
      font-size: 32rpx;
      font-weight: 500;
      color: #333;
      margin-bottom: 8rpx;
    }
    
    .topic-desc {
      display: block;
      font-size: 26rpx;
      color: #666;
      margin-bottom: 16rpx;
      line-height: 1.4;
    }
    
    .topic-meta {
      display: flex;
      align-items: center;
      gap: 20rpx;
      
      text {
        font-size: 24rpx;
        color: #999;
      }
      
      .topic-hot {
        color: #FF6B6B !important;
        font-weight: 500;
      }
    }
  }
  
  .topic-right {
    .topic-score {
      font-size: 24rpx;
      color: #4A90E2;
      font-weight: 500;
    }
  }
}

.empty-list {
  text-align: center;
  padding: 100rpx 0;
  
  image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 30rpx;
  }
  
  text {
    font-size: 28rpx;
    color: #999;
  }
}

.loading {
  text-align: center;
  padding: 40rpx 0;
  
  text {
    font-size: 28rpx;
    color: #999;
  }
}

.load-more {
  text-align: center;
  padding: 40rpx 0;
  
  text {
    font-size: 28rpx;
    color: #4A90E2;
  }
}

.no-more {
  text-align: center;
  padding: 40rpx 0;
  
  text {
    font-size: 26rpx;
    color: #ccc;
  }
}
</style>
