<template>
  <view class="user-list">
    <user-card 
      v-for="user in users" 
      :key="user.id"
      :user="user"
      @click="handleUserClick"
      @follow-change="handleFollowChange"
    ></user-card>
    
    <!-- 加载更多 -->
    <view v-if="hasMore || loading" class="load-more">
      <view class="load-more-content" @click="handleLoadMore">
        <text v-if="loading" class="load-more-icon">⏳</text>
        <text v-else class="load-more-icon">⬇️</text>
        <text class="load-more-text">{{ loading ? '加载中...' : '点击加载更多' }}</text>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view v-if="!loading && users.length === 0" class="empty-state">
      <view class="empty-icon">👥</view>
      <text class="empty-text">暂无用户</text>
    </view>
  </view>
</template>

<script>
import UserCard from './UserCard.vue'

export default {
  name: 'UserList',
  components: {
    UserCard
  },
  props: {
    users: {
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
    handleUserClick(user) {
      this.$emit('user-click', user)
      
      // 默认跳转到用户详情页
      uni.navigateTo({
        url: `/pages/profile/profile?userId=${user.id}`
      })
    },
    
    handleFollowChange(data) {
      this.$emit('follow-change', data)
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
.user-list {
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
