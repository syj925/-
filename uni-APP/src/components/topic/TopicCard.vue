<template>
  <view class="topic-card" @click="handleClick">
    <view class="topic-header">
      <view class="topic-icon">#</view>
      <view class="topic-info">
        <view class="topic-name">{{ topic.name }}</view>
        <view class="topic-stats">
          <text class="stat-item">{{ topic.postsCount || 0 }} 帖子</text>
          <text class="stat-item">{{ topic.viewCount || 0 }} 浏览</text>
        </view>
      </view>
      <view class="topic-hot-score" v-if="topic.hotScore > 0">
        🔥 {{ formatHotScore(topic.hotScore) }}
      </view>
    </view>
    
    <view v-if="topic.description" class="topic-description">
      {{ topic.description }}
    </view>
  </view>
</template>

<script>
export default {
  name: 'TopicCard',
  props: {
    topic: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      clicking: false
    }
  },
  methods: {
    handleClick() {
      // 防止重复点击
      if (this.clicking) {
        return
      }

      this.clicking = true
      this.$emit('click', this.topic.id)

      // 500ms后重置点击状态
      setTimeout(() => {
        this.clicking = false
      }, 500)
    },
    
    formatHotScore(score) {
      if (score >= 1000) {
        return (score / 1000).toFixed(1) + 'k'
      }
      return score.toString()
    }
  }
}
</script>

<style lang="scss" scoped>
.topic-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  
  .topic-header {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    
    .topic-icon {
      width: 60rpx;
      height: 60rpx;
      background: linear-gradient(135deg, #007aff, #5ac8fa);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 32rpx;
      font-weight: bold;
      margin-right: 20rpx;
    }
    
    .topic-info {
      flex: 1;
      
      .topic-name {
        font-size: 32rpx;
        font-weight: 500;
        color: #333;
        margin-bottom: 8rpx;
      }
      
      .topic-stats {
        display: flex;
        gap: 30rpx;
        
        .stat-item {
          font-size: 24rpx;
          color: #666;
        }
      }
    }
    
    .topic-hot-score {
      background-color: #fff3e0;
      color: #ff9800;
      padding: 8rpx 16rpx;
      border-radius: 20rpx;
      font-size: 22rpx;
      font-weight: 500;
    }
  }
  
  .topic-description {
    font-size: 26rpx;
    color: #666;
    line-height: 1.5;
    max-height: 3em;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>
