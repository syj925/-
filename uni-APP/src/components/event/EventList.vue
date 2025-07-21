<template>
  <view class="event-list">
    <!-- 活动列表 -->
    <view class="event-list__content" v-if="events.length > 0">
      <event-card
        v-for="event in events"
        :key="event.id"
        :event="event"
        @card-click="handleEventClick"
      />
    </view>
    
    <!-- 空状态 -->
    <view class="event-list__empty" v-else-if="!loading">
      <view class="empty-icon">
        <AppIcon name="calendar" size="xl" color="#CCCCCC" />
      </view>
      <text class="empty-text">暂无活动</text>
      <text class="empty-desc">{{ emptyDesc }}</text>
    </view>
    
    <!-- 加载状态 -->
    <view class="event-list__loading" v-if="loading">
      <view class="loading-item" v-for="n in 3" :key="n">
        <view class="loading-cover"></view>
        <view class="loading-content">
          <view class="loading-title"></view>
          <view class="loading-meta"></view>
          <view class="loading-progress"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import EventCard from './EventCard.vue'
import AppIcon from '@/components/common/AppIcon.vue'

export default {
  name: 'EventList',
  components: {
    EventCard,
    AppIcon
  },
  props: {
    events: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    emptyDesc: {
      type: String,
      default: '快来发布第一个活动吧！'
    }
  },
  
  methods: {
    // 处理活动点击
    handleEventClick(eventData) {
      this.$emit('item-click', eventData)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.event-list {
  &__content {
    padding: 0 $spacing-lg;
  }
  
  &__empty {
    @include center;
    flex-direction: column;
    padding: $spacing-xl 0;
    
    .empty-icon {
      margin-bottom: $spacing-md;
    }
    
    .empty-text {
      font-size: $font-size-lg;
      color: $text-secondary;
      margin-bottom: $spacing-xs;
    }
    
    .empty-desc {
      font-size: $font-size-sm;
      color: $text-tertiary;
    }
  }
  
  &__loading {
    padding: 0 $spacing-lg;
    
    .loading-item {
      @include card;
      margin-bottom: $spacing-md;
      border-radius: $radius-lg;
      overflow: hidden;
      
      .loading-cover {
        height: 300rpx;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      
      .loading-content {
        padding: $spacing-lg;
        
        .loading-title {
          height: 40rpx;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: $radius-sm;
          margin-bottom: $spacing-md;
          animation: loading 1.5s infinite;
        }
        
        .loading-meta {
          height: 24rpx;
          width: 60%;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: $radius-sm;
          margin-bottom: $spacing-md;
          animation: loading 1.5s infinite;
        }
        
        .loading-progress {
          height: 16rpx;
          width: 80%;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: $radius-sm;
          animation: loading 1.5s infinite;
        }
      }
    }
  }
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
