<template>
  <view class="event-list-page">
    <!-- 搜索栏 -->
    <view class="event-header">
      <view class="search-bar" @tap="goToSearch">
        <AppIcon name="search" size="sm" color="#AC92EC" />
        <input 
          type="text" 
          placeholder="搜索活动" 
          v-model="searchKeyword"
          @input="onSearchInput"
          @confirm="onSearchConfirm"
        />
      </view>
    </view>
    
    <!-- 分类标签 -->
    <view class="category-tabs">
      <scroll-view scroll-x class="category-scroll">
        <view class="category-tabs__content">
          <view 
            class="category-tab" 
            :class="{ active: currentStatus === item.value }"
            v-for="item in statusTabs" 
            :key="item.value"
            @tap="switchStatus(item.value)"
          >
            {{ item.label }}
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 活动列表 -->
    <scroll-view 
      scroll-y 
      class="event-content"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @refresherrestore="onRefreshRestore"
    >
      <event-list 
        :events="events" 
        :loading="loading"
        :empty-desc="emptyDesc"
        @item-click="goToDetail" 
      />
      
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
import EventList from '@/components/event/EventList.vue'
import AppIcon from '@/components/common/AppIcon.vue'

export default {
  name: 'EventListPage',
  components: {
    EventList,
    AppIcon
  },
  
  data() {
    return {
      events: [],
      loading: false,
      loadingMore: false,
      refreshing: false,
      hasMore: true,
      currentPage: 1,
      pageSize: 10,
      searchKeyword: '',
      searchTimer: null,
      currentStatus: '', // 当前选中的状态
      
      // 状态标签
      statusTabs: [
        { label: '全部', value: '' },
        { label: '报名中', value: '1' },
        { label: '进行中', value: '2' },
        { label: '已结束', value: '3' }
      ]
    }
  },
  
  computed: {
    // 空状态描述
    emptyDesc() {
      if (this.searchKeyword) {
        return '没有找到相关活动'
      }
      if (this.currentStatus === '1') {
        return '暂无报名中的活动'
      }
      if (this.currentStatus === '2') {
        return '暂无进行中的活动'
      }
      if (this.currentStatus === '3') {
        return '暂无已结束的活动'
      }
      return '暂无活动，快来发布第一个活动吧！'
    }
  },
  
  onLoad() {
    this.loadEvents()
  },
  
  onPullDownRefresh() {
    this.onRefresh()
  },
  
  onReachBottom() {
    this.loadMore()
  },
  
  methods: {
    // 加载活动列表
    async loadEvents(isRefresh = false) {
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
          status: this.currentStatus,
          keyword: this.searchKeyword
        }
        
        const result = await eventApi.getList(params)

        if (result.code === 0 && result.data) {
          const newEvents = result.data.events || []
          
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
          console.error('获取活动列表失败:', result.message)
          uni.showToast({
            title: result.message || '获取活动列表失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('加载活动列表失败:', error)
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
    
    // 加载更多
    async loadMore() {
      if (this.loadingMore || !this.hasMore || this.loading) return
      
      this.loadingMore = true
      await this.loadEvents()
    },
    
    // 下拉刷新
    async onRefresh() {
      this.refreshing = true
      await this.loadEvents(true)
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
      this.loadEvents()
    },
    
    // 搜索输入
    onSearchInput() {
      // 防抖处理
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      
      this.searchTimer = setTimeout(() => {
        this.performSearch()
      }, 500)
    },
    
    // 搜索确认
    onSearchConfirm() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      this.performSearch()
    },
    
    // 执行搜索
    performSearch() {
      this.currentPage = 1
      this.events = []
      this.hasMore = true
      this.loadEvents()
    },
    
    // 跳转到搜索页面
    goToSearch() {
      uni.navigateTo({
        url: '/pages/search/index?type=event'
      })
    },
    
    // 跳转到活动详情
    goToDetail(event) {
      if (event && event.id) {
        uni.navigateTo({
          url: `/pages/event/detail?id=${event.id}`
        })
      } else {
        console.error('活动ID不存在:', event)
        uni.showToast({
          title: '活动ID不存在',
          icon: 'error'
        })
      }
    }
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '校园活动',
      path: '/pages/event/list'
    }
  },

  onShareTimeline() {
    return {
      title: '校园活动'
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.event-list-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: $bg-page;
}

.event-header {
  padding: $spacing-md $spacing-lg;
  background-color: $bg-card;
  border-radius: 0 0 $radius-lg $radius-lg;
  box-shadow: $shadow-sm;
  
  .search-bar {
    @include flex(row, flex-start, center);
    background-color: $bg-light-purple;
    border-radius: $radius-xl;
    padding: $spacing-sm $spacing-md;
    transition: all $transition-fast;
    
    &:active {
      transform: scale(0.98);
      background-color: rgba($accent-purple, 0.12);
    }
    
    input {
      flex: 1;
      font-size: $font-size-sm;
      color: $text-primary;
      margin-left: $spacing-xs;
      
      &::placeholder {
        color: $text-tertiary;
      }
    }
  }
}

.category-tabs {
  background-color: $bg-card;
  border-bottom: 1rpx solid $border-light;
  
  .category-scroll {
    white-space: nowrap;
  }
  
  &__content {
    @include flex(row, flex-start, center);
    padding: 0 $spacing-lg;
  }
  
  .category-tab {
    padding: $spacing-md $spacing-lg;
    font-size: $font-size-sm;
    color: $text-secondary;
    white-space: nowrap;
    position: relative;
    transition: color $transition-fast;
    
    &.active {
      color: $accent-purple;
      font-weight: bold;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 6rpx;
        background: $gradient-purple;
        border-radius: $radius-sm;
      }
    }
  }
}

.event-content {
  flex: 1;
  padding-top: $spacing-md;
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
</style>
