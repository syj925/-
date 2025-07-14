<template>
  <view class="event-list-container">
    <!-- 顶部导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-left" @tap="goBack">
        <image class="back-icon" src="/static/icons/icon_左退出.png" mode="aspectFit"></image>
      </view>
      <view class="navbar-title">校园活动</view>
      <view class="navbar-right"></view>
    </view>
    
    <!-- 筛选选项卡 -->
    <view class="filter-tabs">
      <view class="tab-item" :class="{ active: activeTab === 'all' }" @tap="changeTab('all')">
        <text>全部活动</text>
        <view class="tab-line" v-if="activeTab === 'all'"></view>
      </view>
      <view class="tab-item" :class="{ active: activeTab === 'upcoming' }" @tap="changeTab('upcoming')">
        <text>即将开始</text>
        <view class="tab-line" v-if="activeTab === 'upcoming'"></view>
      </view>
      <view class="tab-item" :class="{ active: activeTab === 'popular' }" @tap="changeTab('popular')">
        <text>热门活动</text>
        <view class="tab-line" v-if="activeTab === 'popular'"></view>
      </view>
    </view>
    
    <!-- 活动列表 -->
    <scroll-view
      scroll-y
      class="events-scroll"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="refreshData"
    >
      <view class="event-list">
        <view class="event-item" v-for="(item, index) in events" :key="index" @tap="navigateToEvent(item.id)" :style="{'animation-delay': index * 0.05 + 's'}">
          <image :src="item.coverImage || '/static/images/event-default.png'" mode="aspectFill" class="event-cover"></image>
          <view class="event-content">
            <text class="event-title">{{ item.title }}</text>
            <view class="event-meta">
              <text class="event-time">{{ formatTime(item.time || item.startTime) }}</text>
              <text class="event-location">{{ item.location }}</text>
            </view>
            <view class="event-participants">
              <text class="event-participant-count">{{ item.participants || item.currentParticipants || 0 }} / {{ item.maxParticipants || '不限' }}</text>
              <text class="event-participant-label">参与人数</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view class="loading-state" v-if="loading">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
      <view class="empty-state" v-if="!loading && events.length === 0">
        <image src="/static/icons/empty.png" mode="aspectFit" class="empty-icon"></image>
        <text class="empty-text">暂无活动</text>
      </view>
      <view class="no-more" v-if="!loading && events.length > 0 && noMore">
        <text>没有更多活动了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import api from '../../utils/api.js';

export default {
  data() {
    return {
      activeTab: 'all',
      events: [],
      page: 1,
      limit: 10,
      loading: false,
      refreshing: false,
      noMore: false
    }
  },
  onLoad() {
    this.loadEvents();
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    
    changeTab(tab) {
      if (this.activeTab !== tab) {
        this.activeTab = tab;
        this.page = 1;
        this.events = [];
        this.noMore = false;
        this.loadEvents();
      }
    },
    
    navigateToEvent(id) {
      uni.navigateTo({
        url: `/pages/event-detail/event-detail?id=${id}`
      });
    },
    
    // 格式化时间
    formatTime(timeString) {
      if (!timeString) return '';
      
      // 处理字符串格式的时间
      if (typeof timeString === 'string') {
        if (timeString.includes('至')) {
          return timeString;
        }
        
        // 处理ISO日期字符串
        if (timeString.includes('T') || timeString.includes('-')) {
          const date = new Date(timeString);
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          return `${month}-${day}`;
        }
        
        return timeString;
      }
      
      // 处理Date对象
      if (timeString instanceof Date) {
        const month = (timeString.getMonth() + 1).toString().padStart(2, '0');
        const day = timeString.getDate().toString().padStart(2, '0');
        return `${month}-${day}`;
      }
      
      return '';
    },
    
    // 加载活动数据
    loadEvents() {
      if (this.loading) return;
      
      this.loading = true;
      
      // 构建请求参数
      const params = {
        page: this.page,
        limit: this.limit,
        _t: new Date().getTime() // 添加时间戳，避免缓存
      };
      
      // 根据当前tab添加筛选参数
      if (this.activeTab === 'upcoming') {
        params.status = 'upcoming'; // 未开始的活动
      } else if (this.activeTab === 'popular') {
        params.isRecommended = 'true'; // 被推荐的热门活动，确保值是字符串
      } else if (this.activeTab === 'all') {
        // 全部活动不需要额外参数
      }
      
      console.log('当前标签:', this.activeTab, '请求参数:', params);
      
      // 使用API加载活动数据
      api.events.getList(params).then(res => {
        console.log('活动列表数据:', res);
        
        if (res.success && res.data) {
          let eventsData = [];
          
          // 处理不同的数据结构
          if (Array.isArray(res.data)) {
            eventsData = res.data;
          } else if (res.data.events && Array.isArray(res.data.events)) {
            eventsData = res.data.events;
          } else if (typeof res.data === 'object') {
            // 可能是分页数据
            if (res.data.list && Array.isArray(res.data.list)) {
              eventsData = res.data.list;
            } else {
              eventsData = [res.data];
            }
          }
          
          // 追加调试信息
          console.log(`获取到${this.activeTab}活动数量:`, eventsData.length);
          
          // 确保图片URL格式正确
          eventsData = eventsData.map(event => {
            if (event.coverImage) {
              // 如果图片URL不是http开头，添加服务器地址前缀
              if (!event.coverImage.startsWith('http') && !event.coverImage.startsWith('/static')) {
                event.coverImage = 'http://localhost:12349' + (event.coverImage.startsWith('/') ? '' : '/') + event.coverImage;
              }
            } else {
              // 使用默认图片
              event.coverImage = '/static/images/event-default.png';
            }
            return event;
          });
          
          // 追加或替换数据
          if (this.page === 1) {
            this.events = eventsData;
          } else {
            this.events = [...this.events, ...eventsData];
          }
          
          // 检查是否还有更多数据
          if (res.data.pagination) {
            this.noMore = this.page >= res.data.pagination.pages;
          } else {
            this.noMore = eventsData.length < this.limit;
          }
        } else {
          // 如果没有真实API数据，使用静态数据代替
          if (this.page === 1) {
            this.events = this.getStaticEvents();
          } else {
            this.noMore = true;
          }
        }
        
        this.loading = false;
        if (this.refreshing) {
          this.refreshing = false;
          uni.stopPullDownRefresh();
        }
      }).catch(err => {
        console.error('获取活动列表失败:', err);
        
        // 加载失败时，使用静态数据
        if (this.page === 1) {
          this.events = this.getStaticEvents();
        } else {
          this.noMore = true;
        }
        
        this.loading = false;
        if (this.refreshing) {
          this.refreshing = false;
          uni.stopPullDownRefresh();
        }
        
        uni.showToast({
          title: '获取活动列表失败',
          icon: 'none'
        });
      });
    },
    
    // 获取静态活动数据
    getStaticEvents() {
      return [
        { 
          id: 301, 
          title: '校园歌手大赛', 
          time: '05-25 14:00', 
          location: '大学生活动中心',
          description: '展示你的音乐才华，赢取丰厚奖品！欢迎全校学生参加。',
          coverImage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
          participants: 120,
          maxParticipants: 200
        },
        { 
          id: 302, 
          title: '毕业季摄影展', 
          time: '06-10 至 06-20', 
          location: '图书馆展览厅',
          description: '记录美好大学时光，展示毕业生的校园记忆。',
          coverImage: 'https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80',
          participants: 75,
          maxParticipants: 150
        },
        { 
          id: 303, 
          title: '创新创业大赛', 
          time: '06-15 9:00', 
          location: '科技楼报告厅',
          description: '寻找下一个创业明星，提供创业指导和资金支持。',
          coverImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
          participants: 60,
          maxParticipants: 100
        },
        { 
          id: 304, 
          title: '学术讲座：人工智能的未来', 
          time: '05-28 15:30', 
          location: '信息楼201',
          description: '邀请行业专家分享AI技术的最新发展和应用前景。',
          coverImage: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1169&q=80',
          participants: 45,
          maxParticipants: 80
        },
        { 
          id: 305, 
          title: '校园文化节', 
          time: '06-01 至 06-03', 
          location: '校园广场',
          description: '丰富多彩的文化活动，包括舞台表演、美食节和手工艺展等。',
          coverImage: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
          participants: 230,
          maxParticipants: 500
        }
      ];
    },
    
    // 刷新数据
    refreshData() {
      this.refreshing = true;
      this.page = 1;
      this.noMore = false;
      this.loadEvents();
    },
    
    // 加载更多
    loadMore() {
      if (this.loading || this.noMore) return;
      
      this.page++;
      this.loadEvents();
    }
  }
}
</script>

<style>
.event-list-container {
  min-height: 100vh;
  background-color: #F5F9FF;
  padding-bottom: var(--window-bottom);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 顶部导航栏 */
.custom-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  background: linear-gradient(to right, #4A90E2, #75B5FF);
  padding: 0 15px;
  padding-top: var(--status-bar-height);
  box-shadow: 0 2px 10px rgba(74, 144, 226, 0.2);
  position: relative;
  z-index: 10;
}

.navbar-left, .navbar-right {
  width: 40px;
  display: flex;
  align-items: center;
}

.back-icon {
  width: 24px;
  height: 24px;
  transform: translateZ(0);
}

.navbar-title {
  flex: 1;
  text-align: center;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: bold;
}

/* 筛选选项卡 */
.filter-tabs {
  display: flex;
  background-color: #FFFFFF;
  margin: 15px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #666;
  font-size: 14px;
  transition: all 0.3s ease;
}

.tab-item.active {
  color: #4A90E2;
  font-weight: 600;
}

.tab-line {
  position: absolute;
  bottom: 0;
  width: 20px;
  height: 3px;
  background-color: #4A90E2;
  border-radius: 3px;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 活动列表滚动区域 */
.events-scroll {
  height: calc(100vh - 44px - var(--status-bar-height) - 70px);
}

.event-list {
  padding: 15px;
}

.event-item {
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  border-radius: 12px;
  margin-bottom: 15px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  animation-fill-mode: both;
  transition: all 0.3s ease;
}

.event-item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.03);
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.event-cover {
  width: 100%;
  height: 140px;
  object-fit: cover;
  background-color: #f0f0f0;
  transition: all 0.3s ease;
}

.event-content {
  padding: 15px;
}

.event-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  display: block;
  line-height: 1.4;
}

.event-meta {
  display: flex;
  margin-bottom: 10px;
}

.event-time {
  font-size: 13px;
  color: #4A90E2;
  margin-right: 15px;
  display: flex;
  align-items: center;
}

.event-time:before {
  content: '';
  display: inline-block;
  width: 14px;
  height: 14px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234A90E2'%3E%3Cpath d='M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm-1-13h2v5.2l4.5 2.7-.7 1.1-5.3-3.3V7z'/%3E%3C/svg%3E");
  background-size: contain;
  margin-right: 4px;
}

.event-location {
  font-size: 13px;
  color: #888;
  display: flex;
  align-items: center;
}

.event-location:before {
  content: '';
  display: inline-block;
  width: 14px;
  height: 14px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23888'%3E%3Cpath d='M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z'/%3E%3C/svg%3E");
  background-size: contain;
  margin-right: 4px;
}

.event-participants {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.event-participant-count {
  font-weight: 600;
  color: #4A90E2;
  margin-right: 4px;
}

.event-participant-label {
  color: #999;
}

/* 加载状态 */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.loading-spinner {
  width: 20px;
  height: 20px;
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

.loading-text {
  color: #999;
  font-size: 14px;
}

.empty-state, .no-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 15px;
  opacity: 0.6;
}
</style> 