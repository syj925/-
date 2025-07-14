<template>
  <view class="category-container">
    <!-- 分类头部信息 -->
    <view class="category-header" :style="{ background: `linear-gradient(to right, ${categoryInfo.bgColor}, ${categoryInfo.bgColor.replace('0.1', '0.15')})` }">
      <view class="header-back" @tap="goBack">
        <image class="back-icon" src="../../static/icons/icon_ztc.png" mode="aspectFit"></image>
      </view>
      <image class="category-icon" :src="categoryInfo.icon" mode="aspectFit"></image>
      <view class="category-info">
        <text class="category-name">{{categoryInfo.name}}</text>
        <text class="category-desc">{{categoryInfo.desc}}</text>
      </view>
      <view class="category-stats">
        <text class="category-count">{{categoryInfo.count}}+ 内容</text>
      </view>
    </view>
    
    <!-- 选项卡 -->
    <view class="tabs">
      <view class="tab-item active">
        <text>最新</text>
        <view class="tab-line"></view>
      </view>
    </view>
    
    <!-- 内容列表 -->
    <scroll-view 
      scroll-y 
      class="content-list"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="refreshData"
    >
      <view class="post-grid">
        <view class="post-item" v-for="(item, index) in contentList" :key="index" @tap="viewDetail(item)">
          <image class="post-image" :src="item.image" mode="aspectFill"></image>
          <view class="post-info">
            <text class="post-title">{{item.title}}</text>
            <view class="post-meta">
              <view class="author-info">
                <image class="author-avatar" :src="item.author.avatar" mode="aspectFill"></image>
                <text class="author-name">{{item.author.name}}</text>
              </view>
              <view class="post-stats">
                <text class="post-views">{{item.views}}</text>
                <text class="post-likes">{{item.likes}}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view class="loading-more" v-if="loading">
        <view class="spinner"></view>
        <text>加载中...</text>
      </view>
      <view class="no-more" v-if="noMore && contentList.length > 0">
        <text>没有更多内容了</text>
      </view>
      <view class="empty-state" v-if="!loading && contentList.length === 0">
        <image class="empty-icon" src="/static/icons/empty.png" mode="aspectFit"></image>
        <text class="empty-text">暂无内容</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import api from '../../utils/api.js';

export default {
  data() {
    return {
      categoryId: '',
      refreshing: false,
      loading: false,
      noMore: false,
      currentTab: 0,
      page: 1,
      limit: 10,
      tabs: [
        { name: '最新' }
      ],
      categoryInfo: {
        name: '加载中...',
        icon: '/static/icons/activity.png',
        bgColor: 'rgba(74, 144, 226, 0.1)',
        desc: '查看分类内容',
        count: 0
      },
      contentList: []
    }
  },
  onLoad(options) {
    if (options.id) {
      this.categoryId = options.id;
      this.loadCategoryInfo();
      this.refreshData();
    }
  },
  methods: {
    loadCategoryInfo() {
      // 根据分类ID加载对应信息
      const categoryMap = {
        '1': {
          name: '校园活动',
          icon: '/static/icons/xyhd.png',
          bgColor: 'rgba(74, 144, 226, 0.1)',
          desc: '校园内各类活动信息与精彩瞬间',
          type: 'event', // 这个类型用于确定加载什么样的内容
          categoryId: 1  // 添加对应的数字ID
        },
        '2': {
          name: '学习交流',
          icon: '/static/icons/xxjl.png',
          bgColor: 'rgba(252, 132, 45, 0.1)',
          desc: '学习资料与经验分享，一起进步',
          type: 'study',
          categoryId: 2  // 对应学习交流的分类ID
        },
        '3': {
          name: '招聘信息',
          icon: '/static/icons/zpxx.png',
          bgColor: 'rgba(82, 196, 26, 0.1)',
          desc: '实习、招聘与职业发展交流平台',
          type: 'job',
          categoryId: 3  // 对应招聘信息的分类ID
        },
        '4': {
          name: '失物招领',
          icon: '/static/icons/swzl.png',
          bgColor: 'rgba(157, 80, 245, 0.1)',
          desc: '丢失与拾获物品信息发布专区',
          type: 'lost',
          categoryId: 4  // 对应失物招领的分类ID
        }
      };
      
      if (categoryMap[this.categoryId]) {
        this.categoryInfo = categoryMap[this.categoryId];
        // 加载该分类下的数据总数
        this.loadCategoryCount();
      }
    },
    
    loadCategoryCount() {
      // 根据分类类型加载不同的数据
      if (this.categoryInfo.type === 'event') {
        // 获取活动数量
        api.events.getList({ limit: 1 }).then(res => {
          if (res.success && res.data && res.data.pagination) {
            this.categoryInfo.count = res.data.pagination.total || 0;
          }
        }).catch(err => {
          console.error('获取活动数量失败:', err);
        });
      } else {
        // 获取帖子数量，根据分类过滤 - 使用categoryId而非type
        const params = { categoryId: this.categoryInfo.categoryId, limit: 1 };
        api.posts.getList(params).then(res => {
          if (res.success && res.data && res.data.pagination) {
            this.categoryInfo.count = res.data.pagination.total || 0;
          }
        }).catch(err => {
          console.error('获取内容数量失败:', err);
        });
      }
    },
    
    loadCategoryContent() {
      this.loading = true;
      
      // 根据分类类型加载不同的内容
      if (this.categoryInfo.type === 'event') {
        this.loadEvents();
      } else {
        this.loadPosts();
      }
    },
    
    loadPosts() {
      api.posts.getList({
        page: this.page,
        limit: this.limit,
        categoryId: this.categoryInfo.categoryId  // 使用categoryId来替代category
      }).then(res => {
        if (res.success && res.data && res.data.posts) {
          // 转换数据格式
          const posts = res.data.posts.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content,
            image: post.coverImage || (post.images ? (typeof post.images === 'string' ? JSON.parse(post.images)[0] : (Array.isArray(post.images) ? post.images[0] : 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80')) : 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'),
            type: 'post',
            author: {
              id: post.author.id,
              name: post.author.nickname || post.author.username,
              avatar: post.author.avatar || 'https://randomuser.me/api/portraits/men/32.jpg'
            },
            views: post.viewCount || 0,
            likes: post.likesCount || 0
          }));
          
          if (this.page === 1) {
            this.contentList = posts;
          } else {
            this.contentList = [...this.contentList, ...posts];
          }
          
          // 检查是否还有更多数据
          if (res.data.pagination && this.page >= res.data.pagination.pages) {
            this.noMore = true;
          }
        } else {
          console.error('获取内容列表失败:', res);
          uni.showToast({
            title: '获取内容列表失败',
            icon: 'none'
          });
        }
        this.loading = false;
        if (this.refreshing) {
          this.refreshing = false;
        uni.stopPullDownRefresh();
        }
      }).catch(err => {
        console.error('获取内容列表失败:', err);
        
        // 使用低级API重新请求原始数据查看返回内容
        uni.request({
          url: `http://localhost:12349/api/posts?page=${this.page}&limit=${this.limit}&categoryId=${this.categoryInfo.categoryId}`,  // 这里也改为categoryId
          method: 'GET',
          success: (rawRes) => {
            console.log('原始响应状态码:', rawRes.statusCode);
            console.log('原始响应头:', rawRes.header);
            console.log('原始响应类型:', typeof rawRes.data);
            try {
              // 直接打印原始返回内容，不处理
              console.log('原始响应内容:', rawRes.data);
              
              if (typeof rawRes.data === 'string') {
                // 如果是字符串，尝试安全打印前100个字符
                console.log('响应字符串前100个字符:', rawRes.data.substring(0, 100));
                
                // 打印字符串长度
                console.log('响应字符串长度:', rawRes.data.length);
                
                // 检查是否是HTML
                if (rawRes.data.trim().startsWith('<!DOCTYPE html>') || rawRes.data.trim().startsWith('<html>')) {
                  console.log('响应是HTML而不是JSON');
                }
              }
            } catch (e) {
              console.error('打印原始响应时出错:', e);
            }
          },
          fail: (failRes) => {
            console.error('重试请求也失败:', failRes);
          }
        });
        
        uni.showToast({
          title: '获取内容列表失败',
          icon: 'none'
        });
        this.loading = false;
        if (this.refreshing) {
          this.refreshing = false;
          uni.stopPullDownRefresh();
        }
      });
    },
    
    loadEvents() {
      api.events.getList({
        page: this.page,
        limit: this.limit
      }).then(res => {
        if (res.success && res.data) {
          // 转换数据格式
          let eventsData = [];
          
          // 解析API响应数据
          if (Array.isArray(res.data)) {
            eventsData = res.data;
          } else if (res.data.events && Array.isArray(res.data.events)) {
            eventsData = res.data.events;
          } else if (typeof res.data === 'object') {
            eventsData = [res.data];
          }
          
          // 确保图片URL是完整路径
          const events = eventsData.map(event => {
            let imageUrl = event.coverImage;
            // 如果图片URL不是http开头，添加服务器地址前缀
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/static')) {
              imageUrl = 'http://localhost:12349' + (imageUrl.startsWith('/') ? '' : '/') + imageUrl;
            } else if (!imageUrl) {
              // 使用默认图片
              imageUrl = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80';
            }
            
            return {
              id: event.id,
              title: event.title,
              content: event.description,
              image: imageUrl,
              type: 'event',
              author: {
                name: event.creator ? (event.creator.nickname || event.creator.username) : '校园活动组织者',
                avatar: event.creator?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg'
              },
              startTime: event.startTime,
              location: event.location,
              views: event.currentParticipants || 0,
              likes: event.maxParticipants || 0
            };
          });
          
          if (this.page === 1) {
            this.contentList = events;
          } else {
            this.contentList = [...this.contentList, ...events];
          }
          
          // 检查是否还有更多数据
          if (res.data.pagination && this.page >= res.data.pagination.pages) {
            this.noMore = true;
          }
        } else {
          console.log('原始events响应:', res);
          uni.showToast({
            title: '获取活动列表失败',
            icon: 'none'
          });
        }
        this.loading = false;
        if (this.refreshing) {
          this.refreshing = false;
          uni.stopPullDownRefresh();
        }
      }).catch(err => {
        console.error('获取活动列表失败:', err);
        
        // 使用低级API重新请求原始数据查看返回内容
        uni.request({
          url: `http://localhost:12349/api/events?page=${this.page}&limit=${this.limit}`,
          method: 'GET',
          success: (rawRes) => {
            console.log('原始events响应状态码:', rawRes.statusCode);
            console.log('原始events响应头:', rawRes.header);
            console.log('原始events响应类型:', typeof rawRes.data);
            console.log('原始events响应内容:', rawRes.data);
          },
          fail: (failRes) => {
            console.error('重试events请求也失败:', failRes);
          }
        });
        
        uni.showToast({
          title: '获取活动列表失败',
          icon: 'none'
        });
        this.loading = false;
        if (this.refreshing) {
          this.refreshing = false;
          uni.stopPullDownRefresh();
        }
      });
    },
    
    refreshData() {
      this.refreshing = true;
      this.page = 1;
      this.noMore = false;
      this.loadCategoryContent();
    },
    
    loadMore() {
      if (this.loading || this.noMore) return;
      
      this.page++;
      this.loadCategoryContent();
    },
    
    viewDetail(item) {
      // 根据不同类型的内容跳转到不同的详情页
      if (item.type === 'event') {
        uni.navigateTo({
          url: `/pages/event/event-detail?id=${item.id}`
        });
      } else {
      uni.navigateTo({
        url: `/pages/post-detail/post-detail?id=${item.id}`
      });
      }
    },
    
    goBack() {
      uni.navigateBack();
    }
  }
}
</script>

<style>
.category-container {
  min-height: 100vh;
  background-color: #F5F9FF;
  animation: fadeIn 0.3s ease;
  padding-top: var(--status-bar-height);
  position: relative;
  z-index: 1;
}

/* 分类头部 */
.category-header {
  display: flex;
  padding: 25px 20px 25px 60px;
  align-items: center;
  background: linear-gradient(to right, rgba(74, 144, 226, 0.1), rgba(74, 144, 226, 0.15));
  border-radius: 0 0 16px 16px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  position: relative;
}

.category-header:active {
  transform: translateY(2px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.header-back {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.back-icon {
  width: 20px;
  height: 20px;
  transition: transform 0.2s;
}

/* 修复分类图标 */
.category-icon {
  width: 48px;
  height: 48px;
  margin-right: 15px;
  padding: 6px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  object-fit: contain;
}

/* 修复返回按钮点击效果 */
.header-back:active {
  background-color: rgba(255, 255, 255, 0.9);
}

.header-back:active .back-icon {
  transform: translateX(-2px);
}

.category-info {
  flex: 1;
}

.category-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  display: block;
}

.category-desc {
  font-size: 14px;
  color: #666;
  display: block;
}

.category-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.category-count {
  font-size: 14px;
  color: #4A90E2;
  font-weight: 600;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 4px 10px;
  border-radius: 12px;
}

/* 选项卡 */
.tabs {
  display: flex;
  height: 44px;
  background-color: #FFFFFF;
  margin: 0 15px 15px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}

.tab-item.active {
  font-weight: 600;
  color: #4A90E2;
}

.tab-line {
  position: absolute;
  bottom: 0;
  width: 24px;
  height: 3px;
  background-color: #4A90E2;
  border-radius: 3px;
  transform: translateY(-3px);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.tab-item.active .tab-line {
  transform: translateY(0);
}

/* 内容列表 */
.content-list {
  padding: 0 15px 15px;
  height: calc(100vh - 150px);
  box-sizing: border-box;
  width: 100%;
  overflow-x: hidden;
}

/* 修改为单列布局容器 */
.post-grid {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* 调整卡片外边距和阴影 */
.post-item {
  margin: 0 0 16px;
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  animation: slideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  animation-fill-mode: both;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  max-width: 100%;
}

/* 修改图片样式为更大尺寸 */
.post-image {
  width: 100%;
  height: 180px;
  transition: all 0.3s ease;
  object-fit: cover;
  background-color: #f0f0f0;
}

/* 调整内容区域样式 */
.post-info {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* 调整标题样式 */
.post-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
  /* 限制标题行数 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #888;
  margin-top: 6px;
}

.author-info {
  display: flex;
  align-items: center;
}

.author-avatar {
  width: 26px;
  height: 26px;
  border-radius: 13px;
  margin-right: 8px;
  border: 1px solid rgba(74, 144, 226, 0.2);
}

.author-name {
  font-size: 13px;
  color: #666;
}

.post-stats {
  display: flex;
}

.post-views, .post-likes {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
}

.post-views::before {
  content: '';
  display: inline-block;
  width: 13px;
  height: 13px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z'/%3E%3C/svg%3E");
  background-size: contain;
  margin-right: 3px;
}

.post-views {
  margin-right: 12px;
}

.post-likes::before {
  content: '';
  display: inline-block;
  width: 13px;
  height: 13px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E");
  background-size: contain;
  margin-right: 3px;
}

/* 加载状态 */
.loading-more, .no-more, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  transition: all 0.3s ease;
}

.loading-more {
  flex-direction: row;
  text-align: center;
  color: #888;
  font-size: 14px;
  padding: 15px 0;
}

.spinner {
  width: 22px;
  height: 22px;
  border: 2px solid rgba(74, 144, 226, 0.2);
  border-top-color: #4A90E2;
  border-radius: 50%;
  margin-right: 10px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-more text, .no-more text {
  color: #999;
  font-size: 14px;
}

.no-more {
  color: #999;
  font-size: 14px;
  opacity: 0.8;
}

.empty-state {
  padding-top: 80px;
  opacity: 0.9;
}

.empty-icon {
  width: 90px;
  height: 90px;
  margin-bottom: 15px;
  opacity: 0.6;
}

.empty-text {
  color: #999;
  font-size: 15px;
}

/* 添加页面进入动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 为列表项添加渐进动画 */
.post-item:nth-child(1) { animation-delay: 0.1s; }
.post-item:nth-child(2) { animation-delay: 0.2s; }
.post-item:nth-child(3) { animation-delay: 0.3s; }

@keyframes slideIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 添加卡片悬停效果 */
.post-item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.03);
}
</style> 