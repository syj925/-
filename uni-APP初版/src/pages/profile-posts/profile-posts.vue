<template>
  <view class="profile-posts-container">
    <!-- 顶部标题栏 -->
    <view class="header">
      <view class="back-btn" @tap="goBack">
        <image class="back-icon-img" src="../../static/icons/icon_ztc.png" mode="aspectFit"></image>
      </view>
      <text class="title">我的帖子</text>
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
              <text class="empty-text">暂无帖子内容</text>
              <text class="empty-tip">您还没有发布任何{{ option.name }}帖子</text>
              <view class="create-btn" @tap="createPost">
                <text class="btn-text">发布新帖子</text>
                <text class="btn-icon">+</text>
              </view>
            </view>
            
            <!-- 帖子列表 -->
            <view class="post-list-container">
              <view 
                class="post-card" 
                v-for="(post, index) in posts" 
                :key="post.id + (forceRefresh ? '-refresh' : '')"
                :style="{ 'animation': forceRefresh ? 'none' : 'fadeInUp 0.5s both', 'animation-delay': index * 0.05 + 's' }"
              >
                <view class="post-header">
                  <text class="post-date">{{ post.time }}</text>
                </view>
                
                <!-- 将操作按钮移到post-header外面，作为独立容器 -->
                <view class="post-actions-container">
                  <view class="post-actions" @tap.stop>
                    <text class="action-btn edit-btn" @tap="editPost(post.id)">编辑</text>
                    <text class="action-btn delete-btn" @tap="deletePost(post.id)">删除</text>
                  </view>
                </view>
                
                <view class="post-content" @tap="viewPostDetail(post.id)">
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
      pageSize: 10,
      forceRefresh: false, // 添加强制刷新标记
      currentEditingPostId: null // 添加当前正在编辑的帖子ID
    }
  },
  computed: {
    currentSort() {
      return this.sortOptions[this.currentSwiperIndex];
    }
  },
  onLoad(options) {
    this.userId = store.getters.getUser()?.id || 'self';
    this.loadPosts();
  },
  onShow() {
    // 检查是否需要强制刷新
    const app = getApp();
    const needRefresh = app.globalData.needRefreshPostList;
    
    if (needRefresh) {
      console.log('检测到全局刷新标记，强制刷新帖子列表');
      // 重置刷新标记
      app.globalData.needRefreshPostList = false;
    }
    
    // 立即刷新数据和布局
    this.forceRefresh = true;
    this.pageNum = 1;
    this.noMore = false;
    this.loadPosts();
    
    // 延时移除强制刷新标记
    setTimeout(() => {
      this.forceRefresh = false;
    }, 300);
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
      this.loadPosts();
    },
    
    // 点击选项卡
    switchTab(index) {
      if (this.currentSwiperIndex === index) return;
      this.currentSwiperIndex = index;
      this.pageNum = 1;
      this.noMore = false;
      this.loadPosts();
    },
    
    // 加载帖子
    loadPosts() {
      // 显示加载状态
      this.loading = true;
      
      const params = {
        userId: this.userId === 'self' ? store.getters.getUser()?.id : this.userId,
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
      this.loadPosts();
    },
    
    // 加载更多
    loadMore() {
      if (this.loading || this.noMore) return;
      
      this.pageNum++;
      this.loadPosts();
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
    },
    
    // 编辑帖子
    editPost(postId) {
      console.log('编辑帖子:', postId);
      
      // 先确认帖子ID是否有效
      if (!postId) {
        uni.showToast({
          title: '帖子ID无效',
          icon: 'none'
        });
        return;
      }

      // 显示加载状态
      uni.showLoading({
        title: '正在准备编辑...'
      });

      // 先获取帖子详情，确认是否可编辑
      api.posts.get(postId)
        .then(res => {
          uni.hideLoading();
          
          console.log('获取帖子详情结果:', res);
          
          if (res.success) {
            // 修改跳转路径，不再跳转到tabbar页面
            const url = `/pages/edit-post/edit-post?id=${postId}`;
            console.log('跳转到编辑页面:', url);
            
            // 标记当前正在编辑
            this.currentEditingPostId = postId;
            
            uni.navigateTo({
              url: url,
              fail: (err) => {
                console.error('跳转失败:', err);
                uni.showToast({
                  title: '跳转编辑页面失败: ' + JSON.stringify(err),
                  icon: 'none'
                });
              },
              success: () => {
                console.log('跳转成功');
              }
            });
          } else {
            uni.showToast({
              title: res.message || '获取帖子详情失败',
              icon: 'none'
            });
          }
        })
        .catch(err => {
          uni.hideLoading();
          console.error('获取帖子详情失败:', err);
          uni.showToast({
            title: '加载帖子信息失败',
            icon: 'none'
          });
        });
    },
    
    // 删除帖子
    deletePost(postId) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条帖子吗？删除后将无法恢复。',
        success: (res) => {
          if (res.confirm) {
            api.posts.delete(postId)
              .then(res => {
                if (res.success) {
                  this.posts = this.posts.filter(post => post.id !== postId);
                  
                  uni.showToast({
                    title: '删除成功',
                    icon: 'success'
                  });
                } else {
                  uni.showToast({
                    title: res.message || '删除失败',
                    icon: 'none'
                  });
                }
              })
              .catch(err => {
                console.error('删除帖子失败:', err);
                uni.showToast({
                  title: '删除失败，请稍后再试',
                  icon: 'none'
                });
              });
          }
        }
      });
    },
    
    // 发布新帖子
    createPost() {
      uni.navigateTo({
        url: '/pages/publish/publish'
      });
    }
  }
}
</script>

<style>
.profile-posts-container {
  min-height: 100vh;
  background-color: #f6f7fb;
  background-image: linear-gradient(to bottom, #f1f5fd, #f6f7fb);
  padding-bottom: 20px;
  position: relative;
}

/* 顶部标题栏 */
.profile-posts-container .header {
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

.profile-posts-container .back-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transition: all 0.2s;
}

.profile-posts-container .back-btn:active {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(0.95);
}

.profile-posts-container .back-icon-img {
  width: 24px;
  height: 24px;
}

.profile-posts-container .title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 1);
}

.profile-posts-container .right-space {
  width: 30px;
}

/* Swiper样式 */
.profile-posts-container .tabs-swiper {
  height: calc(100vh - 44px - 41px); /* 减去标题栏和选项卡指示器的高度 */
  width: 100%;
}

.profile-posts-container .tab-content {
  height: 100%;
  width: 100%;
  position: relative;
}

/* 选项卡指示器 */
.profile-posts-container .tabs-indicator {
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

.profile-posts-container .tab-item {
  position: relative;
  font-size: 15px;
  color: #888;
  padding: 5px 15px;
  transition: all 0.3s;
  font-weight: 500;
}

.profile-posts-container .tab-item.active {
  color: #3270c5;
  font-weight: 600;
}

.profile-posts-container .tab-item.active:after {
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
.profile-posts-container .post-list {
  height: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
}

.profile-posts-container .post-list-container {
  padding: 15px 0;
}

.profile-posts-container .post-card {
  margin-bottom: 18px;
  padding: 16px;
  background-color: #FFFFFF;
  border-radius: 18px;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  /* 让动画通过内联样式控制，防止重新渲染时出现问题 */
  /* animation: fadeInUp 0.5s both; */
  border: 1px solid rgba(230, 235, 245, 0.8);
  position: relative !important;
  will-change: transform; /* 优化渲染性能 */
  animation: none !important;
}

.profile-posts-container .post-actions-container {
  position: absolute !important; /* 强制绝对定位 */
  top: 16px !important;
  right: 16px !important;
  z-index: 999 !important; /* 提高z-index确保在最顶层 */
  opacity: 1 !important; /* 确保始终可见 */
  pointer-events: auto !important; /* 确保可点击 */
}

.profile-posts-container .post-actions {
  display: flex;
  align-items: center;
}

.profile-posts-container .action-btn-wrapper {
  margin-left: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-posts-container .action-btn-wrapper:active {
  opacity: 0.8;
  transform: scale(0.95);
}

.profile-posts-container .action-btn {
  font-size: 14px;
  padding: 4px 12px;
  border-radius: 14px;
  margin-left: 10px;
  display: inline-block !important;
  min-width: 40px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  opacity: 1 !important;
  visibility: visible !important;
  transition: none !important;
}

.profile-posts-container .edit-btn {
  color: #4A90E2;
  background-color: rgba(74, 144, 226, 0.08);
}

.profile-posts-container .delete-btn {
  color: #FF3B30;
  background-color: rgba(255, 59, 48, 0.08);
}

.profile-posts-container .post-content {
  margin-bottom: 15px;
}

.profile-posts-container .post-title {
  font-size: 17px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 8px;
  position: relative;
  padding-bottom: 8px;
}

.profile-posts-container .post-summary {
  font-size: 15px;
  color: #666666;
  line-height: 1.5;
}

/* 帖子图片 */
.profile-posts-container .post-images {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 15px;
  gap: 6px;
}

.profile-posts-container .post-image {
  border-radius: 12px;
  object-fit: cover;
  transition: transform 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.profile-posts-container .post-image:active {
  transform: scale(0.98);
}

.profile-posts-container .single-image {
  width: 100%;
  height: 200px;
}

.profile-posts-container .double-image {
  width: calc(50% - 3px);
  height: 120px;
}

.profile-posts-container .multi-image {
  width: calc(33.33% - 4px);
  height: 100px;
}

.profile-posts-container .post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px dashed rgba(0, 0, 0, 0.06);
}

.profile-posts-container .post-stats {
  display: flex;
  align-items: center;
}

.profile-posts-container .stat-item {
  display: flex;
  align-items: center;
  margin-right: 15px;
  font-size: 13px;
  color: #999999;
}

.profile-posts-container .stats-icon {
  width: 18px;
  height: 18px;
  margin-right: 4px;
}

.profile-posts-container .post-tags {
  display: flex;
  flex-wrap: wrap;
}

.profile-posts-container .tag-item {
  font-size: 12px;
  color: #4A90E2;
  background-color: rgba(74, 144, 226, 0.08);
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 6px;
}

/* 加载状态 */
.profile-posts-container .loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 25px 0;
}

.profile-posts-container .loading-spinner {
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

.profile-posts-container .loading-state text {
  color: #999999;
  font-size: 14px;
}

.profile-posts-container .no-more {
  text-align: center;
  padding: 15px 0 25px;
  color: #999999;
  font-size: 13px;
  font-style: italic;
}

/* 空状态 */
.profile-posts-container .empty-state {
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

.profile-posts-container .empty-icon {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  opacity: 0.8;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.profile-posts-container .empty-text {
  font-size: 18px;
  font-weight: 600;
  color: #555555;
  margin-bottom: 10px;
}

.profile-posts-container .empty-tip {
  font-size: 14px;
  color: #999999;
  text-align: center;
  margin-bottom: 25px;
  line-height: 1.5;
}

.profile-posts-container .create-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #4A90E2, #5E7CE2);
  color: white;
  border-radius: 50px;
  padding: 0 20px;
  height: 44px;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.25);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.profile-posts-container .create-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 6px rgba(74, 144, 226, 0.15);
}

.profile-posts-container .create-btn:after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent);
  pointer-events: none;
}

.profile-posts-container .btn-text {
  margin-right: 5px;
  font-size: 15px;
}

.profile-posts-container .btn-icon {
  font-size: 18px;
}

/* 移除浮动按钮相关样式 */
.profile-posts-container .float-publish-btn,
.profile-posts-container .float-publish-btn:active,
.profile-posts-container .float-publish-btn .iconfont,
.profile-posts-container .float-publish-btn:after {
  display: none;
}

/* 图标 */
.profile-posts-container .iconfont {
  font-family: "iconfont" !important;
}

.profile-posts-container .icon-back:before {
  content: "\e679";
}

.profile-posts-container .icon-add:before {
  content: "\e65f";
}

.post-actions-fixed-right {
  position: fixed;
  right: 16px;
  z-index: 100;
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

.profile-posts-container .post-card:active {
  transform: translateY(2px) scale(0.99);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.profile-posts-container .post-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 12px;
  position: relative !important; /* 强制相对定位 */
  padding-right: 120px; /* 为操作按钮预留空间 */
  transform: translateZ(0); /* 强制开启硬件加速 */
  min-height: 24px;
}

.profile-posts-container .post-date {
  font-size: 14px;
  color: #999999;
  position: relative;
  padding-left: 8px;
}

.profile-posts-container .post-date:before {
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
</style> 