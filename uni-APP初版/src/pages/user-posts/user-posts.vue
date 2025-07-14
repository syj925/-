<template>
  <view class="user-posts-container">
    <!-- 顶部标题栏 -->
    <view class="header">
      <view class="back-btn" @tap="goBack">
        <image class="back-icon-img" src="../../static/icons/icon_ztc.png" mode="aspectFit"></image>
      </view>
      <text class="title">{{ title }}</text>
      <view class="right-space"></view>
    </view>
    
    <!-- 选项卡指示器 - 移到swiper前面 -->
    <view class="tabs-indicator">
      <view 
        v-for="(option, index) in sortOptions" 
        :key="index"
        class="tab-item"
        :class="{ active: currentSwiperIndex === index }"
        @tap="switchTab(index)"
      >
        {{ option.name }}
      </view>
    </view>
    
    <!-- 排序方式 - 改为滑动切换 -->
    <swiper class="tabs-swiper" :current="currentSwiperIndex" @change="onSwiperChange">
      <swiper-item v-for="(option, index) in sortOptions" :key="index">
        <view class="tab-content">
          <!-- 显示内容块 -->
          <scroll-view 
            scroll-y 
            class="post-list"
            refresher-enabled
            :refresher-triggered="refreshing"
            @refresherrefresh="onRefresh"
            @scrolltolower="loadMore"
          >
            <!-- 加载中状态 -->
            <view class="loading-state" v-if="loading && !refreshing">
              <view class="loading-spinner"></view>
              <text>正在加载...</text>
            </view>
            
            <!-- 空状态 -->
            <view class="empty-state" v-if="posts.length === 0 && !loading">
              <image class="empty-icon" src="/static/images/empty-data.png" mode="aspectFit"></image>
              <text class="empty-text">暂无动态内容</text>
              <text class="empty-tip">该用户还没有发布任何{{ option.name }}动态</text>
            </view>
            
            <!-- 帖子列表 -->
            <view class="post-list-container">
              <view 
                class="post-card" 
                v-for="(post, index) in posts" 
                :key="post.id"
                :style="{ 'animation-delay': index * 0.05 + 's' }"
                @tap="viewPostDetail(post.id)"
              >
                <view class="post-header">
                  <text class="post-date">{{ post.time }}</text>
                  <view class="post-actions" @tap.stop>
                    <!-- 用户操作按钮，仅在查看自己的帖子时显示 -->
                  </view>
                </view>
                
                <view class="post-content">
                  <view class="post-title">{{ post.title }}</view>
                  <view class="post-summary">{{ post.content }}</view>
                </view>
                
                <!-- 帖子图片预览 -->
                <view class="post-images" v-if="post.images && post.images.length > 0">
                  <image 
                    v-for="(image, imgIndex) in post.images" 
                    :key="imgIndex"
                    :src="image" 
                    mode="aspectFill"
                    class="post-image"
                    :class="getImageClass(post.images.length)"
                    @tap.stop="previewImage(post.images, imgIndex)"
                  ></image>
                </view>
                
                <view class="post-footer">
                  <view class="post-stats">
                    <view class="stat-item">
                      <image class="stats-icon" src="/static/icons/hz.png" mode="aspectFit"></image>
                      <text class="stat-count">{{ post.likes }}</text>
                    </view>
                    <view class="stat-item">
                      <image class="stats-icon" src="/static/icons/pl.png" mode="aspectFit"></image>
                      <text class="stat-count">{{ post.comments }}</text>
                    </view>
                  </view>
                  
                  <view class="post-tags" v-if="post.topics && post.topics.length > 0">
                    <text class="tag-item" v-for="(tag, tagIndex) in post.topics" :key="tagIndex">{{ tag }}</text>
                  </view>
                </view>
              </view>
            </view>
            
            <!-- 加载更多提示 -->
            <view class="no-more" v-if="noMore && posts.length > 0">
              <text>~ 没有更多内容了 ~</text>
            </view>
          </scroll-view>
        </view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script>
import api from '../../utils/api.js';
import store from '../../utils/store.js';

export default {
  data() {
    return {
      userId: '',
      title: '用户动态',
      refreshing: false,
      loading: true,
      noMore: false,
      posts: [],
      currentSwiperIndex: 0, // 当前swiper索引
      sortOptions: [
        { name: '最新', value: 'latest' },
        { name: '热门', value: 'hot' }
      ],
      pageNum: 1,
      pageSize: 10
    }
  },
  computed: {
    currentSort() {
      return this.sortOptions[this.currentSwiperIndex];
    }
  },
  onLoad(options) {
    // 获取用户ID
    if (options.id) {
      this.userId = options.id;
      // 如果是查看自己的帖子
      if (this.userId === 'self') {
        this.title = '我的帖子';
        // 这里可以获取自己的用户ID
        uni.getStorage({
          key: 'userInfo',
          success: (res) => {
            if (res.data && res.data.uid) {
              this.userId = res.data.uid;
            }
            this.loadUserPosts();
          },
          fail: () => {
            // 没有找到用户信息，仍然使用self作为标识
            this.loadUserPosts();
          }
        });
      } else {
        this.loadUserPosts();
      }
    } else {
      uni.showToast({
        title: '用户ID不存在',
        icon: 'none'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  },
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 滑动切换事件
    onSwiperChange(e) {
      this.currentSwiperIndex = e.detail.current;
      this.pageNum = 1;
      this.noMore = false;
      this.loadUserPosts();
    },
    
    // 点击选项卡
    switchTab(index) {
      if (this.currentSwiperIndex === index) return;
      this.currentSwiperIndex = index;
      this.pageNum = 1;
      this.noMore = false;
      this.loadUserPosts();
    },
    
    // 加载用户帖子
    loadUserPosts() {
      // 显示加载状态
      this.loading = true;
      
      const params = {
        userId: this.userId,
        page: this.pageNum,
        limit: this.pageSize,
        sort: this.currentSort.value
      };
      
      api.users.getUserPosts(params)
        .then(res => {
          if (res.success) {
            const newPosts = res.data.posts || [];
            
            if (this.pageNum === 1) {
              this.posts = newPosts;
            } else {
              this.posts = [...this.posts, ...newPosts];
            }
            
            // 判断是否还有更多数据
            this.noMore = newPosts.length < this.pageSize;
          } else {
            uni.showToast({
              title: res.message || '加载帖子失败',
              icon: 'none'
            });
          }
        })
        .catch(err => {
          console.error('加载用户帖子失败:', err);
          uni.showToast({
            title: '加载用户帖子失败，请稍后再试',
            icon: 'none'
          });
        })
        .finally(() => {
          this.loading = false;
          this.refreshing = false;
        });
    },
    
    // 刷新列表
    onRefresh() {
      this.refreshing = true;
      this.pageNum = 1;
      this.noMore = false;
      this.loadUserPosts();
    },
    
    // 加载更多
    loadMore() {
      if (this.loading || this.noMore) return;
      
      this.pageNum++;
      this.loadUserPosts();
    },
    
    // 根据图片数量获取样式类
    getImageClass(count) {
      if (count === 1) return 'single-image';
      if (count === 2) return 'double-image';
      return 'multi-image';
    },
    
    // 预览图片
    previewImage(images, currentIndex) {
      uni.previewImage({
        urls: images,
        current: images[currentIndex]
      });
    },
    
    // 查看帖子详情
    viewPostDetail(postId) {
      uni.navigateTo({
        url: `/pages/post-detail/post-detail?id=${postId}`
      });
    }
  }
}
</script>

<style>
.user-posts-container {
  min-height: 100vh;
  background-color: #f6f7fb;
  background-image: linear-gradient(to bottom, #f1f5fd, #f6f7fb);
  padding-bottom: 20px;
  position: relative;
}

/* 顶部标题栏 */
.user-posts-container .header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: var(--padding-sm) var(--padding-lg);
  background: linear-gradient(135deg, #3270c5, #4165db);
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.2);
  border-radius: 0 0 16px 16px;
}

.user-posts-container .back-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transition: all 0.2s;
}

.user-posts-container .back-btn:active {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(0.95);
}

.user-posts-container .back-icon-img {
  width: 24px;
  height: 24px;
}

.user-posts-container .title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 1);
}

.user-posts-container .right-space {
  width: 30px;
}

/* Swiper样式 */
.user-posts-container .tabs-swiper {
  height: calc(100vh - 44px - 41px); /* 减去标题栏和选项卡指示器的高度 */
  width: 100%;
}

.user-posts-container .tab-content {
  height: 100%;
  width: 100%;
  position: relative;
}

/* 选项卡指示器 */
.user-posts-container .tabs-indicator {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 12px 0;
  background-color: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
  margin-bottom: 1px;
}

.user-posts-container .tab-item {
  position: relative;
  font-size: 15px;
  color: #888;
  padding: 5px 15px;
  transition: all 0.3s;
  font-weight: 500;
}

.user-posts-container .tab-item.active {
  color: #3270c5;
  font-weight: 600;
}

.user-posts-container .tab-item.active:after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background-color: #3270c5;
  border-radius: 3px;
}

/* 帖子列表 */
.user-posts-container .post-list {
  height: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
}

.user-posts-container .post-list-container {
  padding: 15px 0;
}

.user-posts-container .post-card {
  margin-bottom: 18px;
  padding: 16px;
  background-color: #FFFFFF;
  border-radius: 18px;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  animation: fadeInUp 0.5s both;
  border: 1px solid rgba(230, 235, 245, 0.8);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-posts-container .post-card:active {
  transform: translateY(2px) scale(0.99);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.user-posts-container .post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-posts-container .post-date {
  font-size: 14px;
  color: #999999;
  position: relative;
  padding-left: 8px;
}

.user-posts-container .post-date:before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 14px;
  background: linear-gradient(to bottom, #4A90E2, #5E7CE2);
  border-radius: 2px;
}

.user-posts-container .post-actions {
  display: flex;
}

.user-posts-container .action-btn {
  font-size: 14px;
  margin-left: 15px;
  padding: 3px 10px;
  border-radius: 12px;
  transition: all 0.2s;
}

.user-posts-container .action-btn:active {
  opacity: 0.8;
  transform: scale(0.95);
}

.user-posts-container .post-content {
  margin-bottom: 15px;
}

.user-posts-container .post-title {
  font-size: 17px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 8px;
  position: relative;
  padding-bottom: 8px;
}

.user-posts-container .post-summary {
  font-size: 15px;
  color: #666666;
  line-height: 1.5;
}

/* 帖子图片 */
.user-posts-container .post-images {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 15px;
  gap: 6px;
}

.user-posts-container .post-image {
  border-radius: 12px;
  object-fit: cover;
  transition: transform 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.user-posts-container .post-image:active {
  transform: scale(0.98);
}

.user-posts-container .single-image {
  width: 100%;
  height: 200px;
}

.user-posts-container .double-image {
  width: calc(50% - 3px);
  height: 120px;
}

.user-posts-container .multi-image {
  width: calc(33.33% - 4px);
  height: 100px;
}

.user-posts-container .post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px dashed rgba(0, 0, 0, 0.06);
}

.user-posts-container .post-stats {
  display: flex;
  align-items: center;
}

.user-posts-container .stat-item {
  display: flex;
  align-items: center;
  margin-right: 15px;
  font-size: 13px;
  color: #999999;
}

.user-posts-container .stats-icon {
  width: 18px;
  height: 18px;
  margin-right: 4px;
}

.user-posts-container .post-tags {
  display: flex;
  flex-wrap: wrap;
}

.user-posts-container .tag-item {
  font-size: 12px;
  color: #4A90E2;
  background-color: rgba(74, 144, 226, 0.08);
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 6px;
}

/* 加载状态 */
.user-posts-container .loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 25px 0;
}

.user-posts-container .loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(224, 224, 224, 0.5);
  border-top: 2px solid #4A90E2;
  border-radius: 50%;
  margin-bottom: 10px;
  animation: spin 1s infinite ease-out;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.user-posts-container .loading-state text {
  color: #999999;
  font-size: 14px;
}

.user-posts-container .no-more {
  text-align: center;
  padding: 15px 0 25px;
  color: #999999;
  font-size: 13px;
  font-style: italic;
}

/* 空状态 */
.user-posts-container .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 30px;
  animation: fadeIn 0.5s both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.user-posts-container .empty-icon {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  opacity: 0.8;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.user-posts-container .empty-text {
  font-size: 18px;
  font-weight: 600;
  color: #555555;
  margin-bottom: 10px;
}

.user-posts-container .empty-tip {
  font-size: 14px;
  color: #999999;
  text-align: center;
  margin-bottom: 25px;
  line-height: 1.5;
}

/* 图标 */
.user-posts-container .iconfont {
  font-family: "iconfont" !important;
}

.user-posts-container .icon-back:before {
  content: "\e679";
}
</style> 