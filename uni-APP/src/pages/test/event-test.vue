<template>
  <view class="event-test-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">活动API测试</text>
    </view>
    
    <!-- 测试按钮区域 -->
    <view class="test-buttons">
      <button class="test-btn" @tap="testRecommendedEvents" :loading="loading.recommended">
        测试推荐活动API
      </button>
      
      <button class="test-btn" @tap="testEventList" :loading="loading.list">
        测试活动列表API
      </button>
      
      <button class="test-btn" @tap="testUpcomingEvents" :loading="loading.upcoming">
        测试即将开始活动API
      </button>
    </view>
    
    <!-- API响应结果 -->
    <view class="test-results">
      <view class="result-section" v-if="results.recommended">
        <view class="result-title">推荐活动结果：</view>
        <view class="result-content">
          <text class="result-text">{{ JSON.stringify(results.recommended, null, 2) }}</text>
        </view>
      </view>
      
      <view class="result-section" v-if="results.list">
        <view class="result-title">活动列表结果：</view>
        <view class="result-content">
          <text class="result-text">{{ JSON.stringify(results.list, null, 2) }}</text>
        </view>
      </view>
      
      <view class="result-section" v-if="results.upcoming">
        <view class="result-title">即将开始活动结果：</view>
        <view class="result-content">
          <text class="result-text">{{ JSON.stringify(results.upcoming, null, 2) }}</text>
        </view>
      </view>
      
      <view class="result-section" v-if="results.error">
        <view class="result-title error">错误信息：</view>
        <view class="result-content error">
          <text class="result-text">{{ results.error }}</text>
        </view>
      </view>
    </view>
    
    <!-- 活动卡片预览 -->
    <view class="event-preview" v-if="previewEvents.length > 0">
      <view class="preview-title">活动卡片预览：</view>
      <view class="preview-list">
        <event-card
          v-for="event in previewEvents"
          :key="event.id"
          :event="event"
          @click="handleEventClick"
        />
      </view>
    </view>
  </view>
</template>

<script>
import { eventApi } from '@/api'
import EventCard from '@/components/event/EventCard.vue'

export default {
  name: 'EventTestPage',
  components: {
    EventCard
  },
  
  data() {
    return {
      loading: {
        recommended: false,
        list: false,
        upcoming: false
      },
      results: {
        recommended: null,
        list: null,
        upcoming: null,
        error: null
      },
      previewEvents: []
    }
  },
  
  methods: {
    // 测试推荐活动API
    async testRecommendedEvents() {
      try {
        this.loading.recommended = true
        this.results.error = null

        const result = await eventApi.getRecommended(4)

        this.results.recommended = result
        
        // 如果有数据，设置预览
        if (result.code === 0 && result.data && result.data.events) {
          this.previewEvents = result.data.events
        }
        
        uni.showToast({
          title: '推荐活动API测试完成',
          icon: 'success'
        })
        
      } catch (error) {
        console.error('测试推荐活动API失败:', error)
        this.results.error = `推荐活动API错误: ${error.message}`
        
        uni.showToast({
          title: '推荐活动API测试失败',
          icon: 'none'
        })
      } finally {
        this.loading.recommended = false
      }
    },
    
    // 测试活动列表API
    async testEventList() {
      try {
        this.loading.list = true
        this.results.error = null

        const result = await eventApi.getList({
          page: 1,
          pageSize: 10
        })

        this.results.list = result
        
        uni.showToast({
          title: '活动列表API测试完成',
          icon: 'success'
        })
        
      } catch (error) {
        console.error('测试活动列表API失败:', error)
        this.results.error = `活动列表API错误: ${error.message}`
        
        uni.showToast({
          title: '活动列表API测试失败',
          icon: 'none'
        })
      } finally {
        this.loading.list = false
      }
    },
    
    // 测试即将开始活动API
    async testUpcomingEvents() {
      try {
        this.loading.upcoming = true
        this.results.error = null

        const result = await eventApi.getUpcoming(5)

        this.results.upcoming = result
        
        uni.showToast({
          title: '即将开始活动API测试完成',
          icon: 'success'
        })
        
      } catch (error) {
        console.error('测试即将开始活动API失败:', error)
        this.results.error = `即将开始活动API错误: ${error.message}`
        
        uni.showToast({
          title: '即将开始活动API测试失败',
          icon: 'none'
        })
      } finally {
        this.loading.upcoming = false
      }
    },
    
    // 处理活动卡片点击
    handleEventClick(event) {

      uni.showModal({
        title: '活动详情',
        content: `活动名称: ${event.title}\n活动地点: ${event.location || '未设置'}\n参与人数: ${event.current_participants}/${event.max_participants || '不限'}`,
        showCancel: false
      })
    }
  },
  
  onLoad() {

  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.event-test-page {
  min-height: 100vh;
  background-color: $bg-page;
  padding: $spacing-lg;
}

.page-header {
  @include center;
  margin-bottom: $spacing-xl;
  
  .page-title {
    font-size: $font-size-xl;
    font-weight: bold;
    color: $text-primary;
  }
}

.test-buttons {
  margin-bottom: $spacing-xl;
  
  .test-btn {
    width: 100%;
    padding: $spacing-lg;
    margin-bottom: $spacing-md;
    background: $gradient-purple;
    color: $text-white;
    border: none;
    border-radius: $radius-lg;
    font-size: $font-size-md;
    font-weight: bold;
    
    &:active {
      transform: scale(0.98);
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.test-results {
  margin-bottom: $spacing-xl;
  
  .result-section {
    @include card;
    margin-bottom: $spacing-lg;
    border-radius: $radius-lg;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .result-title {
      font-size: $font-size-lg;
      font-weight: bold;
      color: $text-primary;
      margin-bottom: $spacing-md;
      
      &.error {
        color: $danger-color;
      }
    }
    
    .result-content {
      background-color: $bg-light;
      border-radius: $radius-md;
      padding: $spacing-md;
      
      &.error {
        background-color: rgba($danger-color, 0.1);
      }
      
      .result-text {
        font-size: $font-size-sm;
        color: $text-secondary;
        line-height: 1.5;
        word-break: break-all;
      }
    }
  }
}

.event-preview {
  .preview-title {
    font-size: $font-size-lg;
    font-weight: bold;
    color: $text-primary;
    margin-bottom: $spacing-lg;
  }
  
  .preview-list {
    .event-card {
      margin-bottom: $spacing-md;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
