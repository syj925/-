<template>
  <view class="discover-page">
    <view class="discover-header">
      <view class="search-bar">
        <text class="iconfont icon-search"></text>
        <input type="text" placeholder="搜索你感兴趣的内容" />
      </view>
    </view>
    
    <scroll-view scroll-y class="discover-content">
      <view class="section">
        <view class="section-header">
          <text class="title">热门话题</text>
          <text class="more" @tap="goToTopicList">更多</text>
        </view>
        <view class="topic-list">
          <view class="topic-item" v-for="(item, index) in topics" :key="index" @tap="goToTopic(item.id)">
            <view class="topic-info">
              <text class="topic-title">#{{item.name}}#</text>
              <text class="topic-count">{{item.post_count}}个内容</text>
            </view>
            <view class="topic-stats">
              <text class="view-count">{{item.view_count}}浏览</text>
              <text class="hot-badge" v-if="item.is_hot">🔥</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="section">
        <view class="section-header">
          <text class="title">推荐内容</text>
        </view>
        <view class="recommend-list">
          <view class="post-card" v-for="(item, index) in recommendations" :key="index" @click="goToDetail(item.id)">
            <view class="post-header">
              <image class="avatar" :src="item.avatar" mode="aspectFill"></image>
              <view class="user-info">
                <text class="username">{{item.username}}</text>
                <text class="time">{{item.time}}</text>
              </view>
            </view>
            <view class="post-content">
              <text class="post-text">{{item.content}}</text>
              <view class="post-images" v-if="item.images && item.images.length">
                <image 
                  v-for="(img, imgIndex) in item.images.slice(0, 3)" 
                  :key="imgIndex" 
                  :src="img" 
                  mode="aspectFill"
                  class="post-image"
                ></image>
              </view>
            </view>
            <view class="post-footer">
              <view class="action-item">
                <text class="iconfont icon-like"></text>
                <text class="count">{{item.likes}}</text>
              </view>
              <view class="action-item">
                <text class="iconfont icon-comment"></text>
                <text class="count">{{item.comments}}</text>
              </view>
              <view class="action-item">
                <text class="iconfont icon-share"></text>
                <text class="count">{{item.shares}}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { topicApi } from '@/api'

export default {
  data() {
    return {
      topics: [],
      loading: false,
      recommendations: [
        {
          id: 1,
          username: '校园生活家',
          avatar: '/static/images/common/avatar1.jpg',
          time: '10分钟前',
          content: '今天下午在图书馆学习的时候遇到一只小猫咪，太可爱了！',
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
          content: '分享一个学习方法，希望对大家有用！',
          images: [
            '/static/images/common/post2.jpg',
            '/static/images/common/post3.jpg'
          ],
          likes: 45,
          comments: 18,
          shares: 7
        }
      ]
    }
  },

  onLoad() {
    this.loadHotTopics()
  },

  methods: {
    // 加载热门话题
    async loadHotTopics() {
      try {
        this.loading = true
        const result = await topicApi.getHot(6) // 获取6个热门话题

        if (result.code === 0 && result.data) {
          this.topics = result.data
        } else {
          console.error('获取热门话题失败:', result.message)
          // 如果API失败，使用默认数据
          this.topics = [
            { id: 1, name: '校园生活', post_count: 156, view_count: 2340, is_hot: true },
            { id: 2, name: '学习交流', post_count: 89, view_count: 1567, is_hot: true },
            { id: 3, name: '美食推荐', post_count: 123, view_count: 2890, is_hot: true }
          ]
        }
      } catch (error) {
        console.error('加载热门话题失败:', error)
        // 使用默认数据
        this.topics = [
          { id: 1, name: '校园生活', post_count: 156, view_count: 2340, is_hot: true },
          { id: 2, name: '学习交流', post_count: 89, view_count: 1567, is_hot: true },
          { id: 3, name: '美食推荐', post_count: 123, view_count: 2890, is_hot: true }
        ]
      } finally {
        this.loading = false
      }
    },

    // 跳转到话题详情
    goToTopic(topicId) {
      uni.navigateTo({
        url: `/pages/topic/detail?id=${topicId}`
      })
    },

    // 跳转到话题列表
    goToTopicList() {
      uni.navigateTo({
        url: '/pages/topic/list'
      })
    },

    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${id}`
      });
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.discover-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: $bg-page;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 200rpx;
    background: linear-gradient(180deg, rgba($accent-purple, 0.08), rgba($accent-purple, 0) 90%);
    z-index: 0;
    pointer-events: none;
  }
}

.discover-header {
  padding: $spacing-md $spacing-lg;
  background-color: $bg-card;
  border-radius: 0 0 $radius-lg $radius-lg;
  box-shadow: $shadow-sm;
  position: relative;
  z-index: 1;
  
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
    
    .iconfont {
      margin-right: $spacing-xs;
      color: $accent-purple;
    }
    
    input {
      flex: 1;
      font-size: $font-size-sm;
      color: $text-primary;
      
      &::placeholder {
        color: $text-tertiary;
      }
    }
  }
}

.discover-content {
  flex: 1;
  padding: $spacing-md $spacing-lg;
  
  .section {
    margin-bottom: $spacing-lg;
    
    .section-header {
      @include flex(row, space-between, center);
      margin-bottom: $spacing-md;
      
      .title {
        font-size: $font-size-lg;
        font-weight: bold;
        color: $text-primary;
        position: relative;
        padding-left: $spacing-md;
        
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 8rpx;
          height: 32rpx;
          background: $gradient-purple;
          border-radius: $radius-sm;
        }
      }
      
      .more {
        font-size: $font-size-sm;
        color: $accent-purple;
        padding: $spacing-xs $spacing-sm;
        border-radius: $radius-lg;
        background-color: $bg-light-purple;
      }
    }
  }
  
  .topic-list {
    .topic-item {
      @include flex(row, space-between, center);
      background-color: $bg-card;
      border-radius: $radius-lg;
      padding: $spacing-md $spacing-lg;
      margin-bottom: $spacing-md;
      box-shadow: $shadow-sm;
      transition: transform $transition-fast, box-shadow $transition-fast;
      overflow: hidden;
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        right: 0;
        top: 0;
        width: 20rpx;
        height: 100%;
        background: $gradient-purple;
        opacity: 0.5;
      }
      
      &:active {
        transform: translateX(4rpx);
        box-shadow: $shadow-sm;
      }
      
      .topic-info {
        @include flex(column, center, flex-start);
        flex: 1;

        .topic-title {
          font-size: $font-size-md;
          font-weight: bold;
          color: $text-primary;
          margin-bottom: $spacing-xs;
        }

        .topic-count {
          font-size: $font-size-xs;
          color: $accent-purple;
          background-color: $bg-light-purple;
          padding: 4rpx 12rpx;
          border-radius: 20rpx;
        }
      }

      .topic-stats {
        @include flex(column, center, flex-end);

        .view-count {
          font-size: $font-size-xs;
          color: $text-secondary;
          margin-bottom: 4rpx;
        }

        .hot-badge {
          font-size: $font-size-sm;
          animation: pulse 2s infinite;
        }
      }
      
      .topic-image {
        width: 120rpx;
        height: 120rpx;
        border-radius: $radius-md;
        box-shadow: $shadow-sm;
      }
    }
  }
  
  .recommend-list {
    .post-card {
      @include card;
      margin-bottom: $spacing-lg;
      border-radius: $radius-lg;
      transition: transform $transition-fast, box-shadow $transition-fast;
      
      &:active {
        transform: translateY(2rpx);
        box-shadow: $shadow-sm;
      }
      
      .post-header {
        @include flex(row, flex-start, center);
        margin-bottom: $spacing-md;
        
        .avatar {
          width: 80rpx;
          height: 80rpx;
          border-radius: $radius-circle;
          margin-right: $spacing-md;
          border: 3rpx solid $bg-light-purple;
          box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
        }
        
        .user-info {
          @include flex(column, center, flex-start);
          
          .username {
            font-size: $font-size-md;
            color: $text-primary;
            font-weight: bold;
          }
          
          .time {
            font-size: $font-size-xs;
            color: $text-tertiary;
          }
        }
      }
      
      .post-content {
        margin-bottom: $spacing-md;
        
        .post-text {
          font-size: $font-size-md;
          color: $text-primary;
          line-height: 1.5;
          margin-bottom: $spacing-sm;
        }
        
        .post-images {
          display: flex;
          flex-wrap: wrap;
          
          .post-image {
            width: 200rpx;
            height: 200rpx;
            border-radius: $radius-md;
            margin-right: $spacing-sm;
            margin-bottom: $spacing-sm;
            box-shadow: $shadow-sm;
          }
        }
      }
      
      .post-footer {
        @include flex(row, flex-start, center);
        border-top: 1rpx solid $border-light;
        padding-top: $spacing-md;
        
        .action-item {
          @include flex(row, center, center);
          margin-right: $spacing-lg;
          padding: $spacing-xs $spacing-sm;
          border-radius: $radius-lg;
          transition: background-color $transition-fast;
          
          &:active {
            background-color: $bg-light-purple;
          }
          
          .iconfont {
            font-size: $font-size-md;
            color: $text-tertiary;
            margin-right: $spacing-xs;
          }
          
          .count {
            font-size: $font-size-sm;
            color: $text-tertiary;
          }
        }
      }
    }
  }
}

// 动画效果
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
</style>