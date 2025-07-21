<template>
  <view class="my-events-page">
    <!-- 页面头部 -->
    <view class="page-header">
      <text class="page-title">我的活动</text>
    </view>
    
    <!-- 统计卡片 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-number">{{ stats.total || 0 }}</text>
        <text class="stat-label">总报名</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-number">{{ stats.upcoming || 0 }}</text>
        <text class="stat-label">即将参加</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-number">{{ stats.completed || 0 }}</text>
        <text class="stat-label">已完成</text>
      </view>
    </view>
    
    <!-- 状态标签 -->
    <view class="status-tabs">
      <view 
        class="status-tab" 
        :class="{ active: currentStatus === item.value }"
        v-for="item in statusTabs" 
        :key="item.value"
        @tap="switchStatus(item.value)"
      >
        {{ item.label }}
      </view>
    </view>
    
    <!-- 活动列表 -->
    <scroll-view 
      scroll-y 
      class="events-content"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @refresherrestore="onRefreshRestore"
    >
      <view class="events-list" v-if="events.length > 0">
        <view 
          class="event-item" 
          v-for="event in events" 
          :key="event.id"
          @tap="goToDetail(event)"
        >
          <!-- 活动封面 -->
          <view class="event-cover">
            <image 
              class="event-image" 
              :src="safeImageUrl(event.event.cover_image)" 
              mode="aspectFill"
            />
            <view class="event-status" :class="getStatusClass(event.event.status)">
              {{ getStatusText(event.event.status) }}
            </view>
          </view>
          
          <!-- 活动信息 -->
          <view class="event-info">
            <view class="event-title">{{ event.event.title }}</view>
            
            <view class="event-meta">
              <view class="meta-item">
                <app-icon name="time" size="xs" color="#AC92EC" />
                <text>{{ formatTime(event.event.start_time) }}</text>
              </view>
              
              <view class="meta-item" v-if="event.event.location">
                <app-icon name="location" size="xs" color="#AC92EC" />
                <text>{{ event.event.location }}</text>
              </view>
            </view>
            
            <view class="registration-info">
              <view class="registration-status" :class="getRegistrationStatusClass(event.status)">
                {{ getRegistrationStatusText(event.status) }}
              </view>
              
              <view class="registration-time">
                报名时间：{{ formatTime(event.registered_at) }}
              </view>
            </view>
          </view>
          
          <!-- 操作按钮 -->
          <view class="event-actions">
            <button 
              class="action-btn cancel-btn" 
              v-if="canCancel(event)"
              @tap.stop="cancelRegistration(event)"
            >
              取消报名
            </button>
            
            <button 
              class="action-btn detail-btn" 
              @tap.stop="goToDetail(event)"
            >
              查看详情
            </button>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-else-if="!loading">
        <view class="empty-icon">
          <app-icon name="calendar" size="xl" color="#CCCCCC" />
        </view>
        <text class="empty-text">{{ emptyText }}</text>
        <text class="empty-desc">{{ emptyDesc }}</text>
        
        <button class="explore-btn" @tap="goToEventList">
          去看看有什么活动
        </button>
      </view>
      
      <!-- 加载状态 -->
      <view class="loading-state" v-if="loading">
        <view class="loading-item" v-for="n in 3" :key="n">
          <view class="loading-cover"></view>
          <view class="loading-content">
            <view class="loading-title"></view>
            <view class="loading-meta"></view>
            <view class="loading-status"></view>
          </view>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view class="load-more" v-if="hasMore && events.length > 0">
        <view class="load-more__loading" v-if="loadingMore">
          <text>加载中...</text>
        </view>
        <view class="load-more__end" v-else-if="!hasMore">
          <text>没有更多了</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { eventApi } from '@/api'
import { UrlUtils } from '@/utils'

export default {
  name: 'MyEventsPage',
  
  data() {
    return {
      events: [],
      stats: {},
      loading: false,
      loadingMore: false,
      refreshing: false,
      hasMore: true,
      currentPage: 1,
      pageSize: 10,
      currentStatus: '', // 当前选中的状态
      
      // 状态标签
      statusTabs: [
        { label: '全部', value: '' },
        { label: '已报名', value: '1' },
        { label: '已参加', value: '2' },
        { label: '已取消', value: '0' }
      ]
    }
  },
  
  computed: {
    // 空状态文本
    emptyText() {
      const textMap = {
        '': '暂无活动报名',
        '1': '暂无已报名活动',
        '2': '暂无已参加活动',
        '0': '暂无已取消活动'
      }
      return textMap[this.currentStatus] || '暂无活动报名'
    },
    
    // 空状态描述
    emptyDesc() {
      const descMap = {
        '': '快去报名感兴趣的活动吧！',
        '1': '快去报名感兴趣的活动吧！',
        '2': '继续参加更多精彩活动！',
        '0': '重新考虑参加一些活动吧！'
      }
      return descMap[this.currentStatus] || '快去报名感兴趣的活动吧！'
    }
  },
  
  onLoad() {
    this.loadMyEvents()
    this.loadStats()
  },
  
  onShow() {
    // 页面显示时刷新数据
    this.onRefresh()
  },
  
  onPullDownRefresh() {
    this.onRefresh()
  },
  
  onReachBottom() {
    this.loadMore()
  },
  
  methods: {
    // 加载我的活动
    async loadMyEvents(isRefresh = false) {
      if (this.loading && !isRefresh) return
      
      try {
        if (isRefresh) {
          this.currentPage = 1
          this.hasMore = true
        }
        
        this.loading = !isRefresh
        
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize,
          status: this.currentStatus
        }
        
        const result = await eventApi.getMyRegistrations(params)
        
        if (result.code === 0 && result.data) {
          const newEvents = result.data.registrations || []
          
          if (isRefresh) {
            this.events = newEvents
          } else {
            this.events = [...this.events, ...newEvents]
          }
          
          // 判断是否还有更多数据
          this.hasMore = newEvents.length === this.pageSize
          
          if (this.hasMore) {
            this.currentPage++
          }
        } else {
          console.error('获取我的活动失败:', result.message)
          uni.showToast({
            title: result.message || '获取我的活动失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('加载我的活动失败:', error)
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
        this.loadingMore = false
        this.refreshing = false
        
        // 停止下拉刷新
        uni.stopPullDownRefresh()
      }
    },
    
    // 加载统计数据
    async loadStats() {
      try {
        // 这里可以调用统计API，暂时用本地计算
        const total = this.events.length
        const upcoming = this.events.filter(e => e.event.status === 1 && e.status === 1).length
        const completed = this.events.filter(e => e.status === 2).length

        this.stats = {
          total,
          upcoming,
          completed
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    },

    // 加载更多
    async loadMore() {
      if (this.loadingMore || !this.hasMore || this.loading) return

      this.loadingMore = true
      await this.loadMyEvents()
    },

    // 下拉刷新
    async onRefresh() {
      this.refreshing = true
      await this.loadMyEvents(true)
      await this.loadStats()
    },

    // 刷新恢复
    onRefreshRestore() {
      this.refreshing = false
    },

    // 切换状态
    switchStatus(status) {
      if (this.currentStatus === status) return

      this.currentStatus = status
      this.currentPage = 1
      this.events = []
      this.hasMore = true
      this.loadMyEvents()
    },

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

    // 获取活动状态样式类
    getStatusClass(status) {
      const statusMap = {
        1: 'status-registering',
        2: 'status-ongoing',
        3: 'status-ended',
        0: 'status-cancelled'
      }
      return statusMap[status] || 'status-registering'
    },

    // 获取活动状态文本
    getStatusText(status) {
      const statusMap = {
        1: '报名中',
        2: '进行中',
        3: '已结束',
        0: '已取消'
      }
      return statusMap[status] || '报名中'
    },

    // 获取报名状态样式类
    getRegistrationStatusClass(status) {
      const statusMap = {
        1: 'reg-status-registered',
        2: 'reg-status-attended',
        0: 'reg-status-cancelled'
      }
      return statusMap[status] || 'reg-status-registered'
    },

    // 获取报名状态文本
    getRegistrationStatusText(status) {
      const statusMap = {
        1: '已报名',
        2: '已参加',
        0: '已取消'
      }
      return statusMap[status] || '已报名'
    },

    // 是否可以取消报名
    canCancel(event) {
      // 只有已报名且活动还在报名中的才能取消
      return event.status === 1 && event.event.status === 1
    },

    // 取消报名
    async cancelRegistration(event) {
      try {
        uni.showModal({
          title: '确认取消',
          content: '确定要取消报名吗？',
          success: async (res) => {
            if (res.confirm) {
              const result = await eventApi.cancelRegistration(event.event.id)
              if (result.code === 0) {
                // 更新本地数据
                const index = this.events.findIndex(e => e.id === event.id)
                if (index !== -1) {
                  this.events[index].status = 0
                  this.events[index].canceled_at = new Date().toISOString()
                }

                uni.showToast({
                  title: '取消报名成功',
                  icon: 'success'
                })

                // 重新加载统计数据
                this.loadStats()
              } else {
                uni.showToast({
                  title: result.message || '取消报名失败',
                  icon: 'none'
                })
              }
            }
          }
        })
      } catch (error) {
        console.error('取消报名失败:', error)
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
      }
    },

    // 跳转到活动详情
    goToDetail(event) {
      uni.navigateTo({
        url: `/pages/event/detail?id=${event.event.id}`
      })
    },

    // 跳转到活动列表
    goToEventList() {
      uni.navigateTo({
        url: '/pages/event/list'
      })
    }
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '我的活动',
      path: '/pages/event/my-events'
    }
  },

  onShareTimeline() {
    return {
      title: '我的活动'
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.my-events-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: $bg-page;
}

// 页面头部
.page-header {
  @include center;
  padding: $spacing-lg;
  background-color: $bg-card;
  border-radius: 0 0 $radius-lg $radius-lg;
  box-shadow: $shadow-sm;

  .page-title {
    font-size: $font-size-xl;
    font-weight: bold;
    color: $text-primary;
  }
}

// 统计卡片
.stats-card {
  @include card;
  @include flex(row, space-around, center);
  margin: $spacing-lg;
  border-radius: $radius-lg;
  background: $gradient-purple;

  .stat-item {
    @include center;
    flex-direction: column;
    flex: 1;

    .stat-number {
      font-size: $font-size-xl;
      font-weight: bold;
      color: $accent-purple;
      margin-bottom: 8rpx;
    }

    .stat-label {
      font-size: $font-size-xs;
      color: $text-secondary;
    }
  }

  .stat-divider {
    width: 1rpx;
    height: 60rpx;
    background-color: rgba($accent-purple, 0.2);
  }
}

// 状态标签
.status-tabs {
  @include flex(row, space-around, center);
  background-color: $bg-card;
  padding: $spacing-md 0;
  margin-bottom: $spacing-md;
  border-radius: $radius-lg;
  margin-left: $spacing-lg;
  margin-right: $spacing-lg;
  box-shadow: $shadow-sm;

  .status-tab {
    padding: $spacing-sm $spacing-lg;
    font-size: $font-size-sm;
    color: $text-secondary;
    border-radius: $radius-lg;
    transition: all $transition-fast;
    position: relative;

    &.active {
      color: $accent-purple;
      font-weight: bold;
      background-color: $bg-light-purple;
    }
  }
}

// 活动内容
.events-content {
  flex: 1;
  padding: 0 $spacing-lg;
}

.events-list {
  .event-item {
    @include card;
    margin-bottom: $spacing-lg;
    border-radius: $radius-lg;
    overflow: hidden;
    transition: transform $transition-fast;

    &:active {
      transform: translateY(2rpx);
    }
  }
}

.event-cover {
  position: relative;
  height: 200rpx;

  .event-image {
    width: 100%;
    height: 100%;
  }

  .event-status {
    @include position-absolute(auto, $spacing-md, $spacing-md, auto);
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
}

.event-info {
  padding: $spacing-lg;

  .event-title {
    font-size: $font-size-lg;
    font-weight: bold;
    color: $text-primary;
    margin-bottom: $spacing-md;
    @include ellipsis(2);
  }

  .event-meta {
    margin-bottom: $spacing-md;

    .meta-item {
      @include flex(row, flex-start, center);
      margin-bottom: $spacing-xs;

      &:last-child {
        margin-bottom: 0;
      }

      text {
        font-size: $font-size-sm;
        color: $text-secondary;
        margin-left: $spacing-xs;
      }
    }
  }

  .registration-info {
    @include flex(row, space-between, center);
    padding-top: $spacing-md;
    border-top: 1rpx solid $border-light;

    .registration-status {
      padding: 8rpx 16rpx;
      border-radius: $radius-lg;
      font-size: $font-size-xs;
      font-weight: bold;

      &.reg-status-registered {
        background-color: $bg-light-blue;
        color: $primary-blue;
      }

      &.reg-status-attended {
        background-color: $bg-light-green;
        color: $success-green;
      }

      &.reg-status-cancelled {
        background-color: $bg-light-red;
        color: $error-red;
      }
    }

    .registration-time {
      font-size: $font-size-xs;
      color: $text-tertiary;
    }
  }
}

.event-actions {
  @include flex(row, flex-end, center);
  padding: 0 $spacing-lg $spacing-lg;

  .action-btn {
    padding: $spacing-sm $spacing-lg;
    border-radius: $radius-lg;
    font-size: $font-size-sm;
    border: none;
    margin-left: $spacing-sm;

    &.cancel-btn {
      background-color: $bg-light-red;
      color: $error-red;
    }

    &.detail-btn {
      background: $gradient-purple;
      color: $text-white;
    }
  }
}

// 空状态
.empty-state {
  @include center;
  flex-direction: column;
  padding: $spacing-xl 0;

  .empty-icon {
    margin-bottom: $spacing-lg;
  }

  .empty-text {
    font-size: $font-size-lg;
    color: $text-secondary;
    margin-bottom: $spacing-xs;
  }

  .empty-desc {
    font-size: $font-size-sm;
    color: $text-tertiary;
    margin-bottom: $spacing-xl;
  }

  .explore-btn {
    padding: $spacing-md $spacing-xl;
    background: $gradient-purple;
    color: $text-white;
    font-size: $font-size-sm;
    border-radius: $radius-xl;
    border: none;
  }
}

// 加载状态
.loading-state {
  .loading-item {
    @include card;
    margin-bottom: $spacing-lg;
    border-radius: $radius-lg;
    overflow: hidden;

    .loading-cover {
      height: 200rpx;
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

      .loading-status {
        height: 32rpx;
        width: 40%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        border-radius: $radius-sm;
        animation: loading 1.5s infinite;
      }
    }
  }
}

.load-more {
  @include center;
  padding: $spacing-lg;

  &__loading,
  &__end {
    font-size: $font-size-sm;
    color: $text-tertiary;
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
