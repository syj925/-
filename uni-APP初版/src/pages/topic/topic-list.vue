<template>
  <view class="topic-list-container">
    <!-- 话题头部 -->
    <view class="topic-header" style="background: linear-gradient(to right, rgba(74, 144, 226, 0.1), rgba(74, 144, 226, 0.15));">
      <view class="header-content">
        <view class="header-left">
          <image class="topic-icon" src="/static/icons/topic.png" mode="aspectFit"></image>
          <view class="topic-info">
            <text class="topic-name">热门话题</text>
            <text class="topic-desc">发现感兴趣的校园话题</text>
          </view>
        </view>
        <view class="topic-stats">
          <text class="topic-count">{{topics.length}}+ 话题</text>
        </view>
      </view>
    </view>
    
    <!-- 搜索框 -->
    <view class="search-box">
      <view class="search-input">
        <text class="iconfont icon-search"></text>
        <input 
          type="text" 
          placeholder="搜索话题" 
          v-model="searchKeyword" 
          confirm-type="search"
          @confirm="searchTopics"
        />
      </view>
    </view>
    
    <!-- 话题列表 -->
    <view class="topic-list">
      <template v-if="!loading && topics.length > 0">
        <view 
          class="topic-item" 
          v-for="(item, index) in topics" 
          :key="index" 
          @tap="navigateToTopic(item.id)"
        >
          <view class="topic-left">
            <view class="topic-tag">#</view>
          </view>
          <view class="topic-content">
            <text class="topic-title">{{item.title || item.name}}</text>
            <view class="topic-meta">
              <text class="topic-participants">{{item.participants || item.usageCount || 0}}人参与</text>
              <text class="topic-posts">{{item.posts || item.postCount || 0}}条内容</text>
            </view>
          </view>
        </view>
      </template>
      
      <view class="empty-list" v-if="!loading && topics.length === 0">
        <image src="/static/images/empty-data.png" mode="aspectFit"></image>
        <text>暂无话题</text>
      </view>
      
      <view class="loading" v-if="loading">
        <text>加载中...</text>
      </view>
      
      <view class="no-more" v-if="!loading && topics.length > 0">
        <text>没有更多话题了</text>
      </view>
    </view>
  </view>
</template>

<script>
import api from '../../utils/api.js';

export default {
  data() {
    return {
      topics: [],
      loading: false,
      searchKeyword: ''
    }
  },
  onLoad() {
    this.loadTopics();
  },
  methods: {
    // 加载话题列表
    async loadTopics() {
      this.loading = true;
      try {
        const res = await api.topics.getList();
        if (res.success) {
          this.topics = res.data.topics || [];
        } else {
          uni.showToast({
            title: res.message || '加载失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('加载话题失败:', error);
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 搜索话题
    searchTopics() {
      if (!this.searchKeyword.trim()) {
        this.loadTopics();
        return;
      }
      
      this.loading = true;
      api.topics.search(this.searchKeyword)
        .then(res => {
          if (res.success) {
            this.topics = res.data.topics || [];
          } else {
            uni.showToast({
              title: res.message || '搜索失败',
              icon: 'none'
            });
          }
        })
        .catch(err => {
          console.error('搜索话题失败:', err);
          uni.showToast({
            title: '搜索失败，请重试',
            icon: 'none'
          });
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    // 跳转到话题详情
    navigateToTopic(id) {
      uni.navigateTo({
        url: `/pages/topic/topic-detail?id=${id}`
      });
    }
  }
}
</script>

<style>
.topic-list-container {
  padding: 0 30rpx 40rpx;
  background-color: #f7f8fa;
  min-height: 100vh;
}

.topic-header {
  margin: 30rpx 0;
  padding: 30rpx;
  border-radius: 20rpx;
  position: relative;
  overflow: hidden;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.topic-icon {
  width: 80rpx;
  height: 80rpx;
  margin-right: 20rpx;
}

.topic-info {
  display: flex;
  flex-direction: column;
}

.topic-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 10rpx;
}

.topic-desc {
  font-size: 26rpx;
  color: #666666;
}

.topic-stats {
  background-color: rgba(74, 144, 226, 0.1);
  padding: 6rpx 16rpx;
  border-radius: 30rpx;
}

.topic-count {
  font-size: 24rpx;
  color: #4A90E2;
  font-weight: 600;
}

.search-box {
  margin-bottom: 30rpx;
}

.search-input {
  display: flex;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 40rpx;
  padding: 0 30rpx;
  height: 80rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.search-input .iconfont {
  color: #999999;
  margin-right: 20rpx;
  font-size: 32rpx;
}

.search-input input {
  flex: 1;
  height: 80rpx;
  font-size: 28rpx;
}

.topic-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  animation: fadeInUp 0.3s ease-out forwards;
}

.topic-item:active {
  background-color: #F5F7FA;
}

.topic-item:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  border-radius: 20rpx;
  box-shadow: 0 10rpx 30rpx rgba(74, 144, 226, 0.1);
  opacity: 0;
  transition: all 0.3s ease;
}

.topic-left {
  margin-right: 30rpx;
}

.topic-tag {
  width: 80rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  background-color: rgba(74, 144, 226, 0.1);
  color: #4A90E2;
  font-size: 40rpx;
  border-radius: 16rpx;
  font-weight: bold;
}

.topic-content {
  flex: 1;
}

.topic-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 10rpx;
  line-height: 1.4;
}

.topic-meta {
  display: flex;
  font-size: 24rpx;
  color: #999999;
}

.topic-participants {
  margin-right: 20rpx;
  position: relative;
  padding-left: 36rpx;
}

.topic-participants:before {
  content: "\e7f8"; /* 参与者图标代码 */
  font-family: "iconfont";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  color: #4A90E2;
  font-size: 26rpx;
}

.topic-posts {
  position: relative;
  padding-left: 36rpx;
}

.topic-posts:before {
  content: "\e637"; /* 帖子图标代码 */
  font-family: "iconfont";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  color: #4A90E2;
  font-size: 26rpx;
}

.empty-list {
  padding: 100rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999999;
}

.empty-list image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 20rpx;
}

.loading {
  padding: 30rpx 0;
  text-align: center;
  color: #999999;
}

.no-more {
  padding: 30rpx 0;
  text-align: center;
  color: #999999;
  font-size: 24rpx;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.topic-item:nth-child(1) { animation-delay: 0.1s; }
.topic-item:nth-child(2) { animation-delay: 0.2s; }
.topic-item:nth-child(3) { animation-delay: 0.3s; }
.topic-item:nth-child(4) { animation-delay: 0.4s; }
.topic-item:nth-child(5) { animation-delay: 0.5s; }

@media screen and (min-width: 768px) {
  .topic-item {
    width: calc(50% - 10rpx);
    float: left;
  }
  
  .topic-item:nth-child(odd) {
    margin-right: 20rpx;
  }
  
  .topic-left {
    margin-right: 20rpx;
  }
  
  .topic-tag {
    width: 60rpx;
    height: 60rpx;
    line-height: 60rpx;
    font-size: 32rpx;
  }
  
  .topic-title {
    font-size: 28rpx;
  }
  
  .topic-list-container {
    overflow: hidden;
  }
}
</style> 