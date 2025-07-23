<template>
  <view class="event-card" @click="handleClick">
    <!-- 活动封面 -->
    <view class="event-cover">
      <image 
        class="event-cover__image" 
        :src="safeImageUrl(event.cover_image)" 
        mode="aspectFill"
      />
      <view class="event-cover__overlay">
        <view class="event-status" :class="statusClass">
          {{ statusText }}
        </view>
        <view class="event-recommended" v-if="event.is_recommended">
          <text class="event-recommended__text">推荐</text>
        </view>
      </view>
    </view>
    
    <!-- 活动信息 -->
    <view class="event-info">
      <view class="event-title">{{ event.title }}</view>
      
      <view class="event-meta">
        <view class="event-time">
          <AppIcon name="time" size="xs" color="#666" />
          <text class="event-time__text">{{ formatTime(event.start_time) }}</text>
        </view>
        
        <view class="event-location" v-if="event.location">
          <AppIcon name="location" size="xs" color="#666" />
          <text class="event-location__text">{{ event.location }}</text>
        </view>
      </view>
      
      <view class="event-participants">
        <view class="participants-progress">
          <view class="progress-bar">
            <view 
              class="progress-fill" 
              :style="{ width: participantsPercentage + '%' }"
            ></view>
          </view>
          <text class="participants-text">
            {{ event.current_participants }}/{{ event.max_participants || '不限' }}人
          </text>
        </view>
        
        <view class="event-views" v-if="event.view_count">
          <AppIcon name="eye" size="xs" color="#999" />
          <text class="views-text">{{ event.view_count }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { UrlUtils } from '@/utils'
import AppIcon from '@/components/common/AppIcon.vue'

export default {
  name: 'EventCard',
  components: {
    AppIcon
  },
  props: {
    event: {
      type: Object,
      required: true
    }
  },
  
  computed: {
    // 活动状态样式类
    statusClass() {
      const statusMap = {
        'upcoming': 'status-upcoming',
        'ongoing': 'status-ongoing',
        'ended': 'status-ended',
        'canceled': 'status-cancelled',
        // 兼容旧的数字格式
        1: 'status-registering', // 报名中
        2: 'status-ongoing',     // 进行中
        3: 'status-ended',       // 已结束
        0: 'status-cancelled'    // 已取消
      }
      return statusMap[this.event.status] || 'status-registering'
    },

    // 活动状态文本
    statusText() {
      const statusMap = {
        'upcoming': '未开始',
        'ongoing': '进行中',
        'ended': '已结束',
        'canceled': '已取消',
        // 兼容旧的数字格式
        1: '报名中',
        2: '进行中',
        3: '已结束',
        0: '已取消'
      }
      return statusMap[this.event.status] || '报名中'
    },
    
    // 参与人数百分比
    participantsPercentage() {
      if (!this.event.max_participants) return 0
      return Math.min((this.event.current_participants / this.event.max_participants) * 100, 100)
    }
  },
  
  methods: {
    // 安全的图片URL处理
    safeImageUrl(url) {
      return UrlUtils.ensureImageUrl(url, 'event')
    },
    
    // 格式化时间
    formatTime(timeStr) {
      if (!timeStr) return ''
      
      const date = new Date(timeStr)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      
      const diffDays = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) {
        return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      } else if (diffDays === 1) {
        return `明天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      } else if (diffDays > 1 && diffDays <= 7) {
        return `${diffDays}天后`
      } else {
        return `${date.getMonth() + 1}月${date.getDate()}日`
      }
    },
    
    // 点击事件
    handleClick() {
      this.$emit('card-click', this.event)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.event-card {
  @include card;
  margin-bottom: $spacing-md;
  border-radius: $radius-lg;
  overflow: hidden;
  transition: transform $transition-fast, box-shadow $transition-fast;
  
  &:active {
    transform: translateY(2rpx);
    box-shadow: $shadow-sm;
  }
}

.event-cover {
  position: relative;
  height: 300rpx;
  overflow: hidden;
  
  &__image {
    width: 100%;
    height: 100%;
  }
  
  &__overlay {
    @include position-absolute(0, 0, 0, 0);
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 100%);
    @include flex(row, space-between, flex-end);
    padding: $spacing-md;
  }
}

.event-status {
  padding: 8rpx 16rpx;
  border-radius: $radius-lg;
  font-size: $font-size-xs;
  font-weight: bold;
  color: $text-white;
  
  &.status-registering {
    background: $gradient-blue;
  }
  
  &.status-ongoing {
    background: $gradient-green;
  }
  
  &.status-ended {
    background-color: $text-tertiary;
  }
  
  &.status-cancelled {
    background: $gradient-red;
  }
}

.event-recommended {
  padding: 8rpx 16rpx;
  background: $gradient-yellow;
  border-radius: $radius-lg;
  
  &__text {
    font-size: $font-size-xs;
    font-weight: bold;
    color: $text-white;
  }
}

.event-info {
  padding: $spacing-lg;
}

.event-title {
  font-size: $font-size-lg;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: $spacing-md;
  @include ellipsis(2);
}

.event-meta {
  margin-bottom: $spacing-md;
  
  .event-time,
  .event-location {
    @include flex(row, flex-start, center);
    margin-bottom: $spacing-xs;
    
    &__text {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-left: $spacing-xs;
    }
  }
}

.event-participants {
  @include flex(row, space-between, center);
  
  .participants-progress {
    flex: 1;
    margin-right: $spacing-md;
    
    .progress-bar {
      width: 100%;
      height: 8rpx;
      background-color: $bg-light;
      border-radius: $radius-sm;
      overflow: hidden;
      margin-bottom: $spacing-xs;
      
      .progress-fill {
        height: 100%;
        background: $gradient-blue;
        border-radius: $radius-sm;
        transition: width $transition-normal;
      }
    }
    
    .participants-text {
      font-size: $font-size-xs;
      color: $text-tertiary;
    }
  }
  
  .event-views {
    @include flex(row, center, center);
    
    .views-text {
      font-size: $font-size-xs;
      color: $text-tertiary;
      margin-left: 4rpx;
    }
  }
}
</style>
