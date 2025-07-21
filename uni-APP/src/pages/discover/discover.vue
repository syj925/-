<template>
  <view class="discover-page">
    <!-- 头部区域 -->
    <view class="header">
      <view class="header-content">
        <view class="title-section">
          <text class="main-title">发现精彩</text>
          <text class="subtitle">探索校园生活的无限可能</text>
        </view>
        <view class="search-section">
          <view class="search-box" @tap="handleSearch">
            <app-icon name="search" size="sm" color="#3498db" />
            <text class="search-text">搜索你感兴趣的内容</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <scroll-view scroll-y class="content">
      <!-- 热门话题 -->
      <view class="section">
        <view class="section-header">
          <view class="section-title-wrapper">
            <view class="section-icon">
              <app-icon name="fire" size="md" color="#FF6B6B" />
            </view>
            <text class="section-title">热门话题</text>
          </view>
          <view class="more-button" @tap="goToTopics">
            <text class="more-text">更多</text>
            <app-icon name="chevron-right" size="sm" color="#6c757d" />
          </view>
        </view>
        
        <view class="topics-container">
          <view 
            class="topic-item" 
            v-for="(topic, index) in topics" 
            :key="index"
            @tap="goToTopic(topic.id)"
          >
            <view class="topic-content">
              <text class="topic-name">#{{topic.name}}</text>
              <view class="topic-stats">
                <view class="stat">
                  <app-icon name="message-circle" size="xs" color="#999" />
                  <text class="stat-number">{{topic.post_count}}</text>
                </view>
                <view class="stat">
                  <app-icon name="eye" size="xs" color="#999" />
                  <text class="stat-number">{{formatNumber(topic.view_count)}}</text>
                </view>
              </view>
            </view>
            <view class="hot-badge" v-if="topic.is_hot">
              <text class="hot-text">HOT</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 校园活动 -->
      <view class="section">
        <view class="section-header">
          <view class="section-title-wrapper">
            <view class="section-icon">
              <app-icon name="calendar" size="md" color="#4ECDC4" />
            </view>
            <text class="section-title">校园活动</text>
          </view>
          <view class="more-button" @tap="goToEvents">
            <text class="more-text">更多</text>
            <app-icon name="chevron-right" size="sm" color="#6c757d" />
          </view>
        </view>
        
        <view class="events-container">
          <view 
            class="event-item" 
            v-for="(event, index) in events" 
            :key="index"
            @tap="goToEvent(event.id)"
          >
            <view class="event-image">
              <image :src="event.image" mode="aspectFill" class="event-img" />
              <view class="event-date">
                <text class="date-day">{{formatDay(event.start_time)}}</text>
                <text class="date-month">{{formatMonth(event.start_time)}}</text>
              </view>
            </view>
            <view class="event-info">
              <text class="event-title">{{event.title}}</text>
              <text class="event-desc">{{event.description}}</text>
              <view class="event-meta">
                <view class="meta-item">
                  <app-icon name="map-pin" size="xs" color="#999" />
                  <text class="meta-text">{{event.location}}</text>
                </view>
                <view class="meta-item">
                  <app-icon name="users" size="xs" color="#999" />
                  <text class="meta-text">{{event.participant_count}}人参与</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 推荐内容 -->
      <view class="section">
        <view class="section-header">
          <view class="section-title-wrapper">
            <view class="section-icon">
              <app-icon name="star" size="md" color="#FFD93D" />
            </view>
            <text class="section-title">推荐内容</text>
          </view>
        </view>
        
        <view class="recommendations-container">
          <view 
            class="recommendation-item" 
            v-for="(item, index) in recommendations" 
            :key="index"
            @tap="goToPost(item.id)"
          >
            <view class="rec-header">
              <view class="user-info">
                <image :src="item.avatar" class="user-avatar" />
                <view class="user-details">
                  <text class="username">{{item.username}}</text>
                  <text class="post-time">{{item.time}}</text>
                </view>
              </view>
            </view>
            <view class="rec-content">
              <text class="content-text">{{item.content}}</text>
              <view class="content-images" v-if="item.images && item.images.length > 0">
                <image 
                  v-for="(img, imgIndex) in item.images.slice(0, 3)" 
                  :key="imgIndex"
                  :src="img" 
                  class="content-image"
                  mode="aspectFill"
                />
              </view>
            </view>
            <view class="rec-actions">
              <view class="action-item">
                <app-icon name="heart" size="sm" color="#FF6B6B" />
                <text class="action-count">{{item.likes}}</text>
              </view>
              <view class="action-item">
                <app-icon name="message-circle" size="sm" color="#4ECDC4" />
                <text class="action-count">{{item.comments}}</text>
              </view>
              <view class="action-item">
                <app-icon name="share" size="sm" color="#8B5CF6" />
                <text class="action-count">{{item.shares}}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部间距 -->
      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script>
import { topicApi, eventApi } from '@/api'
import AppIcon from '@/components/common/AppIcon.vue'

export default {
  components: {
    AppIcon
  },
  
  data() {
    return {
      topics: [],
      events: [],
      recommendations: [],
      loading: false
    }
  },

  onLoad() {
    this.loadData()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData()
  },

  methods: {
    async loadData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadTopics(),
          this.loadEvents(),
          this.loadRecommendations()
        ])
      } catch (error) {
        console.error('加载数据失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    async loadTopics() {
      try {
        const response = await topicApi.getHot(6)
        if (response.code === 0) {
          this.topics = response.data || []
        }
      } catch (error) {
        console.error('加载热门话题失败:', error)
      }
    },

    async loadEvents() {
      try {
        const response = await eventApi.getRecommended(4)
        if (response.code === 0) {
          this.events = response.data || []
        }
      } catch (error) {
        console.error('加载校园活动失败:', error)
      }
    },

    loadRecommendations() {
      // 模拟推荐内容数据
      this.recommendations = [
        {
          id: 1,
          username: '校园生活家',
          avatar: '/static/images/common/avatar1.jpg',
          time: '10分钟前',
          content: '今天下午在图书馆学习的时候遇到一只小猫咪，太可爱了！分享给大家看看～',
          images: ['/static/images/common/post1.jpg'],
          likes: 28,
          comments: 12,
          shares: 3
        },
        {
          id: 2,
          username: '学霸君',
          avatar: '/static/images/common/avatar2.jpg',
          time: '30分钟前',
          content: '分享一个超实用的学习方法，希望对大家的期末复习有帮助！',
          images: ['/static/images/common/post2.jpg', '/static/images/common/post3.jpg'],
          likes: 45,
          comments: 18,
          shares: 7
        }
      ]
    },

    handleSearch() {
      uni.navigateTo({
        url: '/pages/search/search'
      })
    },

    goToTopics() {
      uni.navigateTo({
        url: '/pages/topic/list'
      })
    },

    goToTopic(topicId) {
      uni.navigateTo({
        url: `/pages/topic/detail?id=${topicId}`
      })
    },

    goToEvents() {
      uni.navigateTo({
        url: '/pages/event/list'
      })
    },

    goToEvent(eventId) {
      uni.navigateTo({
        url: `/pages/event/detail?id=${eventId}`
      })
    },

    goToPost(postId) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${postId}`
      })
    },

    formatNumber(num) {
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + 'w'
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k'
      }
      return num.toString()
    },

    formatDay(dateStr) {
      const date = new Date(dateStr)
      return date.getDate().toString().padStart(2, '0')
    },

    formatMonth(dateStr) {
      const date = new Date(dateStr)
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
      return months[date.getMonth()]
    },

    // 下拉刷新数据
    async refreshData() {
      try {
        await Promise.all([
          this.loadTopics(),
          this.loadEvents(),
          this.loadRecommendations()
        ])

        uni.showToast({
          title: '刷新成功',
          icon: 'success',
          duration: 1500
        })
      } catch (error) {
        console.error('刷新数据失败:', error)
        uni.showToast({
          title: '刷新失败',
          icon: 'none',
          duration: 1500
        })
      } finally {
        // 停止下拉刷新动画
        uni.stopPullDownRefresh()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.discover-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f4fd 100%);
  position: relative;
}

// 头部区域
.header {
  background: #ffffff;
  padding: 20rpx 32rpx 32rpx;
  border-radius: 0 0 24rpx 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  margin-bottom: 32rpx;

  .header-content {
    .title-section {
      margin-bottom: 32rpx;

      .main-title {
        display: block;
        font-size: 48rpx;
        font-weight: 700;
        color: #2c3e50;
        margin-bottom: 8rpx;
      }

      .subtitle {
        display: block;
        font-size: 28rpx;
        color: #666;
        font-weight: 400;
      }
    }

    .search-section {
      .search-box {
        background: #f8f9fa;
        border-radius: 24rpx;
        padding: 24rpx 32rpx;
        display: flex;
        align-items: center;
        gap: 16rpx;
        border: 2rpx solid transparent;
        transition: all 0.3s ease;

        &:active {
          background: #f0f0f0;
          border-color: #3498db;
        }

        .search-text {
          font-size: 28rpx;
          color: #999;
          flex: 1;
        }
      }
    }
  }
}

// 主要内容区域
.content {
  flex: 1;
  padding: 0 32rpx;

  .section {
    margin-bottom: 48rpx;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32rpx;

      .section-title-wrapper {
        display: flex;
        align-items: center;
        gap: 16rpx;

        .section-icon {
          width: 64rpx;
          height: 64rpx;
          background: #ffffff;
          border-radius: 16rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
        }

        .section-title {
          font-size: 36rpx;
          font-weight: 600;
          color: #2c3e50;
        }
      }

      .more-button {
        display: flex;
        align-items: center;
        gap: 8rpx;
        padding: 16rpx 24rpx;
        background: #f8f9fa;
        border-radius: 20rpx;
        border: 1rpx solid #e9ecef;

        .more-text {
          font-size: 24rpx;
          color: #6c757d;
        }
      }
    }
  }
}

// 热门话题样式
.topics-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;

  .topic-item {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 32rpx;
    position: relative;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
    border: 1rpx solid #f0f0f0;
    transition: all 0.3s ease;

    &:active {
      transform: translateY(-2rpx);
      box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.12);
    }

    .topic-content {
      .topic-name {
        display: block;
        font-size: 32rpx;
        font-weight: 600;
        color: #1a1a1a;
        margin-bottom: 16rpx;
        line-height: 1.4;
      }

      .topic-stats {
        display: flex;
        gap: 24rpx;

        .stat {
          display: flex;
          align-items: center;
          gap: 8rpx;

          .stat-number {
            font-size: 24rpx;
            color: #666;
          }
        }
      }
    }

    .hot-badge {
      position: absolute;
      top: 16rpx;
      right: 16rpx;
      background: #e74c3c;
      border-radius: 12rpx;
      padding: 8rpx 16rpx;

      .hot-text {
        font-size: 20rpx;
        color: #fff;
        font-weight: 600;
      }
    }
  }
}

// 校园活动样式
.events-container {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  overflow-x: auto;
  padding-bottom: 16rpx;

  &::-webkit-scrollbar {
    display: none;
  }

  .event-item {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 32rpx;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
    border: 1rpx solid #f0f0f0;
    transition: all 0.3s ease;
    width: 450rpx;
    flex-shrink: 0;

    &:active {
      transform: translateY(-2rpx);
      box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.12);
    }

    .event-image {
      position: relative;
      width: 100%;
      height: 140rpx;
      border-radius: 16rpx;
      overflow: hidden;

      .event-img {
        width: 100%;
        height: 100%;
      }

      .event-date {
        position: absolute;
        top: 16rpx;
        right: 16rpx;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 12rpx;
        padding: 8rpx 12rpx;
        text-align: center;

        .date-day {
          display: block;
          font-size: 24rpx;
          font-weight: 600;
          color: #fff;
          line-height: 1;
        }

        .date-month {
          display: block;
          font-size: 20rpx;
          color: #fff;
          line-height: 1;
          margin-top: 4rpx;
        }
      }
    }

    .event-info {
      flex: 1;

      .event-title {
        display: block;
        font-size: 30rpx;
        font-weight: 600;
        color: #1a1a1a;
        margin-bottom: 12rpx;
        line-height: 1.3;
        @include text-ellipsis;
      }

      .event-desc {
        display: block;
        font-size: 26rpx;
        color: #666;
        line-height: 1.4;
        margin-bottom: 16rpx;
        @include text-ellipsis-multi(2);
      }

      .event-meta {
        display: flex;
        gap: 24rpx;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 10rpx;

          .meta-text {
            font-size: 24rpx;
            color: #999;
          }
        }
      }
    }
  }
}

// 推荐内容样式
.recommendations-container {
  display: flex;
  flex-direction: column;
  gap: 24rpx;

  .recommendation-item {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 32rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
    border: 1rpx solid #f0f0f0;
    transition: all 0.3s ease;

    &:active {
      transform: translateY(-2rpx);
      box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.12);
    }

    .rec-header {
      margin-bottom: 24rpx;

      .user-info {
        display: flex;
        align-items: center;
        gap: 16rpx;

        .user-avatar {
          width: 64rpx;
          height: 64rpx;
          border-radius: 50%;
          border: 3rpx solid #f0f0f0;
        }

        .user-details {
          flex: 1;

          .username {
            display: block;
            font-size: 28rpx;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 4rpx;
          }

          .post-time {
            display: block;
            font-size: 24rpx;
            color: #999;
          }
        }
      }
    }

    .rec-content {
      margin-bottom: 24rpx;

      .content-text {
        display: block;
        font-size: 28rpx;
        color: #333;
        line-height: 1.6;
        margin-bottom: 16rpx;
      }

      .content-images {
        display: flex;
        gap: 12rpx;
        flex-wrap: wrap;

        .content-image {
          width: 200rpx;
          height: 200rpx;
          border-radius: 16rpx;
          flex-shrink: 0;
        }
      }
    }

    .rec-actions {
      display: flex;
      justify-content: space-around;
      padding-top: 24rpx;
      border-top: 1rpx solid #f0f0f0;

      .action-item {
        display: flex;
        align-items: center;
        gap: 12rpx;
        padding: 16rpx 24rpx;
        border-radius: 20rpx;
        background: #f8f9fa;
        transition: all 0.3s ease;

        &:active {
          background: #e9ecef;
        }

        .action-count {
          font-size: 24rpx;
          color: #666;
          font-weight: 500;
        }
      }
    }
  }
}

// 底部间距
.bottom-space {
  height: 120rpx;
}

// 响应式适配
@media screen and (max-width: 750rpx) {
  .topics-container {
    grid-template-columns: 1fr;
  }

  .event-item {
    flex-direction: column;

    .event-image {
      width: 100%;
      height: 200rpx;
    }
  }
}
</style>
