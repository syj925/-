<template>
  <view class="topic-list">
    <topic-card 
      v-for="topic in topics" 
      :key="topic.id"
      :topic="topic"
      @click="handleTopicClick"
    ></topic-card>
    
    <!-- 加载更多 -->
    <view v-if="hasMore || loading" class="load-more">
      <view class="load-more-content" @click="handleLoadMore">
        <text v-if="loading" class="load-more-icon">⏳</text>
        <text v-else class="load-more-icon">⬇️</text>
        <text class="load-more-text">{{ loading ? '加载中...' : '点击加载更多' }}</text>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view v-if="!loading && topics.length === 0" class="empty-state">
      <view class="empty-icon">#️⃣</view>
      <text class="empty-text">暂无话题</text>
    </view>
  </view>
</template>

<script>
import TopicCard from './TopicCard.vue'

export default {
  name: 'TopicList',
  components: {
    TopicCard
  },
  props: {
    topics: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    hasMore: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      navigating: false
    }
  },
  computed: {
    loadMoreStatus() {
      if (this.loading) return 'loading'
      if (this.hasMore) return 'more'
      return 'noMore'
    },
    loadMoreText() {
      return {
        contentdown: '点击加载更多',
        contentrefresh: '加载中...',
        contentnomore: '没有更多了'
      }
    }
  },
  methods: {
    handleTopicClick(topicId) {
      // 防止重复导航
      if (this.navigating) {
        return
      }

      this.navigating = true

      // 找到对应的topic对象
      const topic = this.topics.find(t => t.id === topicId)
      this.$emit('topic-click', topic || { id: topicId })

      // 默认跳转到话题详情页
      uni.navigateTo({
        url: `/pages/topic/detail?id=${topicId}`,
        success: () => {
          // 导航成功后重置状态
          setTimeout(() => {
            this.navigating = false
          }, 500)
        },
        fail: (err) => {
          console.error('导航失败:', err)
          this.navigating = false
        }
      })
    },
    
    handleLoadMore() {
      if (!this.loading && this.hasMore) {
        this.$emit('load-more')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.topic-list {
  .load-more {
    padding: 30rpx;

    .load-more-content {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20rpx;
      background: #f8f9fa;
      border-radius: 12rpx;
      cursor: pointer;
      transition: background-color 0.3s;

      &:hover {
        background: #e9ecef;
      }

      .load-more-icon {
        font-size: 32rpx;
        margin-right: 16rpx;
      }

      .load-more-text {
        font-size: 28rpx;
        color: #666;
      }
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 100rpx 30rpx;
    
    .empty-icon {
      font-size: 120rpx;
      margin-bottom: 30rpx;
    }
    
    .empty-text {
      font-size: 28rpx;
      color: #999;
    }
  }
}
</style>
