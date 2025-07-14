<template>
  <view class="discover-container">
    <!-- 顶部搜索栏 -->
    <view class="search-bar">
      <view class="search-input">
        <image class="search-icon" src="/static/icons/search.png" mode="aspectFit"></image>
        <input type="text" placeholder="搜索校园内容" confirm-type="search" @confirm="onSearch" />
      </view>
    </view>

    <!-- 轮播图 -->
    <swiper class="banner" indicator-dots autoplay circular :interval="3000" :duration="500">
      <swiper-item v-for="(item, index) in banners" :key="index">
        <image :src="item.image" mode="aspectFill" class="banner-image" @tap="navigateToBanner(item)"></image>
      </swiper-item>
    </swiper>

    <!-- 内容分类 -->
    <view class="category-section">
      <view class="category-title">内容分类</view>
      <view class="category-grid">
        <view class="category-item" v-for="(item, index) in categories" :key="index" @tap="navigateToCategory(item.id)">
          <view class="category-icon-box" :style="{ backgroundColor: item.bgColor }">
            <image class="category-icon" :src="getImage(item.icon)" mode="aspectFit"></image>
          </view>
          <text class="category-name">{{ item.name }}</text>
        </view>
      </view>
    </view>
    
    <!-- 热门话题 -->
    <view class="topic-section">
      <view class="section-header">
        <text class="section-title">热门话题</text>
        <view class="section-more" @tap="navigateToMore('topics')">
          <text>查看全部</text>
          <text class="arrow-right">></text>
        </view>
      </view>
      
      <scroll-view scroll-x class="topic-scroll">
        <view class="topic-item" v-for="(item, index) in hotTopics" :key="index" @tap="navigateToTopic(item.id)">
          <view class="topic-content">
            <text class="topic-title">#{{ item.name }}#</text>
            <text class="topic-stats">{{ item.usageCount || 0 }}人参与</text>
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 校园活动 -->
    <view class="event-section">
      <view class="section-header">
        <text class="section-title">推荐活动</text>
        <view class="section-more">
          <text @tap="refreshCampusEvents" class="refresh-button">刷新</text>
          <text> | </text>
          <text @tap="navigateToMore('events')">查看更多</text>
          <text class="arrow-right">></text>
        </view>
      </view>
      
      <view class="event-list">
        <!-- 显示来自API的活动 -->
        <view class="event-item" v-for="(item, index) in campusEvents" :key="'api-'+index" @tap="navigateToEvent(item.id)">
          <image :src="item.coverImage" mode="aspectFill" class="event-cover"></image>
          <view class="event-info">
            <text class="event-title">{{ item.title }}</text>
            <view class="event-meta">
              <text class="event-time">{{ formatEventTime(item.startTime) }}</text>
              <text class="event-location">{{ item.location }}</text>
            </view>
          </view>
        </view>
        
        <!-- 如果API数据为空则显示测试数据 -->
        <view v-if="campusEvents.length === 0">
          <view class="event-item" v-for="(item, index) in testEvents" :key="'test-'+index" @tap="navigateToEvent(item.id)">
            <image :src="item.coverImage" mode="aspectFill" class="event-cover"></image>
            <view class="event-info">
              <text class="event-title">{{ item.title }}</text>
              <view class="event-meta">
                <text class="event-time">{{ formatEventTime(item.startTime) }}</text>
                <text class="event-location">{{ item.location }}</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 显示调试信息 -->
        <view v-if="campusEvents.length === 0 && testEvents.length === 0" class="debug-info">
          <text>没有找到活动数据</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '../../utils/api.js';
import { getImage } from '../../utils/imagePathHelper';

export default {
  data() {
    return {
      isRefreshing: false,
      banners: [],
      categories: [
        { id: 1, name: '校园活动', icon: '/static/icons/xwhd.png', bgColor: 'rgba(74, 144, 226, 0.1)' },
        { id: 2, name: '学习交流', icon: '/static/icons/xxjl.png', bgColor: 'rgba(252, 132, 45, 0.1)' },
        { id: 3, name: '招聘信息', icon: '/static/icons/zpxx.png', bgColor: 'rgba(82, 196, 26, 0.1)' },
        { id: 4, name: '失物招领', icon: '/static/icons/swzl.png', bgColor: 'rgba(157, 80, 245, 0.1)' }
      ],
      hotTopics: [],
      campusEvents: [],
      // 添加备用测试数据，确保UI可以正常渲染
      defaultBanners: [
        { id: 1, title: '校园图书馆新书推荐', image: '/static/images/banner-library.jpg', url: '' },
        { id: 2, title: '校园学习环境展示', image: '/static/images/banner-campus.jpg', url: '' },
        { id: 3, title: '校园活动中心', image: '/static/images/banner-activity.jpg', url: '' }
      ],
      testEvents: []
    }
  },
  onLoad() {
    uni.$emit('tabChange', 1); // 通知tabBar更新当前选中标签
    this.loadData();
  },
  onPullDownRefresh() {
    this.refreshData();
  },
  methods: {
    getImage,
    
    loadData() {
      this.fetchBanners();
      this.fetchHotTopics();
      this.fetchCampusEvents();
    },
    
    // 获取轮播图数据
    fetchBanners() {
      api.content.getBanners().then(res => {
        console.log('获取轮播图数据返回:', res);
        // 修改数据检查逻辑，适配后端返回的格式
        if (res && res.success !== false) {
          // 处理不同格式的数据
          let bannersData = [];
          
          // 处理不同的数据结构可能性
          if (res.items && Array.isArray(res.items)) {
            bannersData = res.items;
          } else if (res.data && Array.isArray(res.data.banners)) {
            bannersData = res.data.banners;
          } else if (res.data && Array.isArray(res.data.items)) {
            bannersData = res.data.items;
          } else if (res.data && res.data.list && Array.isArray(res.data.list)) {
            bannersData = res.data.list;
          } else if (Array.isArray(res)) {
            bannersData = res;
          } else {
            console.warn('轮播图数据格式不支持:', res);
            this.banners = this.defaultBanners;
            return;
          }
          
          // 确保图片URL是完整的
          bannersData = bannersData.map(item => {
            if (item.image && !item.image.startsWith('http') && !item.image.startsWith('/static')) {
              item.image = 'http://localhost:12349' + (item.image.startsWith('/') ? '' : '/') + item.image;
            }
            return item;
          });
          
          if (bannersData.length > 0) {
            this.banners = bannersData;
          } else {
            console.warn('轮播图数据为空，使用默认数据');
            this.banners = this.defaultBanners;
          }
        } else {
          console.warn('轮播图数据格式不正确或为空，使用默认数据');
          this.banners = this.defaultBanners; 
        }
      }).catch(err => {
        console.error('获取轮播图数据失败:', err);
        this.banners = this.defaultBanners;
      });
    },
    
    // 获取热门话题
    fetchHotTopics() {
      api.topics.getHot(5).then(res => {
        if (res && res.success && res.data) {
          this.hotTopics = res.data;
        } else {
          console.error('获取热门话题失败:', res);
        }
      }).catch(err => {
        console.error('获取热门话题请求失败:', err);
      });
    },
    
    // 获取校园活动
    fetchCampusEvents() {
      // 检查是否已经有活动相关API
      if (api.events && typeof api.events.getList === 'function') {
        // 如果已存在events相关API，直接调用
        api.events.getList({ limit: 3, isRecommended: 'true' }).then(res => {
          console.log('活动API返回数据:', JSON.stringify(res));
          if (res && res.success) {
            // 处理不同的数据结构
            let eventsData = [];
            
            if (Array.isArray(res.data)) {
              // 直接是数组
              eventsData = res.data;
            } else if (res.data && Array.isArray(res.data.events)) {
              // 包含events数组字段
              eventsData = res.data.events;
            } else if (res.data && Array.isArray(res.data.list)) {
              // 包含list数组字段
              eventsData = res.data.list;
            } else if (res.data && typeof res.data === 'object') {
              // 可能是单个活动对象
              eventsData = [res.data];
            } else {
              // 数据结构不符合预期
              console.error('活动数据结构不符合预期:', res.data);
              // 使用测试数据
              this.campusEvents = this.testEvents;
              return;
            }
            
            // 确保封面图片URL是完整的
            eventsData = eventsData.map(item => {
              if (item.coverImage) {
                // 如果封面图片URL不是完整URL(没有http或https开头)，则添加服务器前缀
                if (!item.coverImage.startsWith('http') && !item.coverImage.startsWith('/static')) {
                  item.coverImage = 'http://localhost:12349' + (item.coverImage.startsWith('/') ? '' : '/') + item.coverImage;
                }
              } else {
                // 如果没有封面图片，设置默认图片
                item.coverImage = '/static/images/event-default.png';
              }
              return item;
            });
            
            this.campusEvents = eventsData;
            console.log('设置校园活动数据(处理后):', this.campusEvents);
            
            // 如果没有数据，使用测试数据
            if (this.campusEvents.length === 0) {
              console.log('API返回数据为空，使用测试数据');
              this.campusEvents = this.testEvents;
            }
          } else {
            console.error('获取校园活动失败:', res);
            // 使用测试数据
            this.campusEvents = this.testEvents;
          }
        }).catch(err => {
          console.error('获取校园活动请求失败:', err);
          // 使用测试数据
          this.campusEvents = this.testEvents;
        });
      } else {
        // 使用请求获取
        uni.request({
          url: 'http://localhost:12349/api/events?limit=3&isRecommended=true',
          method: 'GET',
          success: (res) => {
            console.log('直接请求活动API返回数据:', JSON.stringify(res.data));
            if (res.data && res.data.success) {
              // 处理不同的数据结构
              let eventsData = null;
              
              if (res.data.data && Array.isArray(res.data.data)) {
                // data字段是数组
                eventsData = res.data.data;
              } else if (res.data.data && Array.isArray(res.data.data.events)) {
                // data.events字段是数组
                eventsData = res.data.data.events;
              } else if (res.data.data && Array.isArray(res.data.data.list)) {
                // data.list字段是数组
                eventsData = res.data.data.list;
              } else if (res.data.data && typeof res.data.data === 'object') {
                // data字段是单个对象
                eventsData = [res.data.data];
              } else if (Array.isArray(res.data.events)) {
                // 直接events字段
                eventsData = res.data.events;
              } else if (Array.isArray(res.data.list)) {
                // 直接list字段
                eventsData = res.data.list;
              }
              
              if (eventsData && eventsData.length > 0) {
                // 确保封面图片URL是完整的
                eventsData = eventsData.map(item => {
                  if (item.coverImage) {
                    // 如果封面图片URL不是完整URL(没有http或https开头)，则添加服务器前缀
                    if (!item.coverImage.startsWith('http') && !item.coverImage.startsWith('/static')) {
                      item.coverImage = 'http://localhost:12349' + (item.coverImage.startsWith('/') ? '' : '/') + item.coverImage;
                    }
                  } else {
                    // 如果没有封面图片，设置默认图片
                    item.coverImage = '/static/images/event-default.png';
                  }
                  return item;
                });
                
                this.campusEvents = eventsData;
                console.log('设置校园活动数据(直接请求/处理后):', this.campusEvents);
              } else {
                console.log('直接请求没有获取到活动数据，使用测试数据');
                this.campusEvents = this.testEvents;
              }
            } else {
              console.error('获取校园活动失败(直接请求):', res.data);
              // 使用测试数据
              this.campusEvents = this.testEvents;
            }
          },
          fail: (err) => {
            console.error('获取校园活动请求失败(直接请求):', err);
            // 使用测试数据
            this.campusEvents = this.testEvents;
          }
        });
      }
    },
    
    // 格式化活动时间
    formatEventTime(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      return `${month}-${day}`;
    },
    
    refreshData() {
      this.isRefreshing = true;
      
      // 刷新所有数据
      Promise.all([
        this.fetchBanners(),
        this.fetchHotTopics(),
        this.fetchCampusEvents()
      ]).finally(() => {
        this.isRefreshing = false;
        uni.stopPullDownRefresh();
        
        uni.showToast({
          title: '刷新成功',
          icon: 'success'
        });
      });
    },
    
    navigateToSearch() {
      uni.navigateTo({
        url: '/pages/search/search'
      });
    },
    onSearch(e) {
      uni.navigateTo({
        url: `/pages/search/search?keyword=${e.detail.value}`
      });
    },
    navigateToBanner(item) {
      if (item.url) {
        // 检查URL是否为外部链接
        if (item.url.startsWith('http://') || item.url.startsWith('https://')) {
          // 外部链接，使用系统浏览器打开
          // #ifdef H5
          window.open(item.url, '_blank');
          // #endif
          
          // #ifdef APP-PLUS
          plus.runtime.openURL(item.url);
          // #endif
          
          // #ifdef MP
          uni.setClipboardData({
            data: item.url,
            success: () => {
              uni.showToast({
                title: '链接已复制，请在浏览器中打开',
                icon: 'none'
              });
            }
          });
          // #endif
        } else {
          // 内部页面链接
          uni.navigateTo({
            url: item.url,
            fail: (err) => {
              console.error('页面跳转失败:', err);
              uni.showToast({
                title: '页面跳转失败',
                icon: 'none'
              });
            }
          });
        }
      } else if (item.type && item.targetId) {
        // 处理不同类型的banner，例如post、topic或event
        switch(item.type) {
          case 'post':
            // 尝试使用主路径，如果失败则尝试备用路径
            uni.navigateTo({ 
              url: `/pages/post/detail?id=${item.targetId}`,
              fail: (err) => {
                console.warn('使用主路径跳转失败，尝试备用路径:', err);
                // 尝试备用路径 - post-detail/post-detail
                uni.navigateTo({ 
                  url: `/pages/post-detail/post-detail?id=${item.targetId}`,
                  fail: (backupErr) => {
                    console.error('所有路径跳转失败:', backupErr);
                    uni.showToast({
                      title: '页面不存在',
                      icon: 'none'
                    });
                  }
                });
              }
            });
            break;
          case 'topic':
            uni.navigateTo({ 
              url: `/pages/topic/topic-detail?id=${item.targetId}`,
              fail: (err) => {
                console.error('话题页面跳转失败:', err);
                uni.showToast({
                  title: '话题页面不存在',
                  icon: 'none'
                });
              }
            });
            break;
          case 'event':
            uni.navigateTo({ 
              url: `/pages/event-detail/event-detail?id=${item.targetId}`,
              fail: (err) => {
                console.error('活动页面跳转失败:', err);
                uni.showToast({
                  title: '活动页面不存在',
                  icon: 'none'
                });
              }
            });
            break;
          default:
            uni.showToast({
              title: `查看banner: ${item.title}`,
              icon: 'none'
            });
        }
      } else {
        uni.showToast({
          title: `查看banner: ${item.title}`,
          icon: 'none'
        });
      }
    },
    navigateToCategory(categoryId) {
      // 如果是校园活动分类（ID为1），直接跳转到活动列表页
      if (categoryId === 1) {
        uni.navigateTo({
          url: '/pages/event/event-list'
        });
      } else {
        // 其他分类正常跳转到分类页面
        uni.navigateTo({
          url: `/pages/category/category?id=${categoryId}`
        });
      }
    },
    navigateToTopic(topicId) {
      // 直接跳转到话题详情页
      uni.navigateTo({
        url: `/pages/topic/topic-detail?id=${topicId}`
      });
    },
    navigateToMore(type) {
      // 实现真正的页面跳转
      switch(type) {
        case 'topics':
          // 跳转到话题列表页
          uni.navigateTo({
            url: '/pages/topic/topic-list'
          });
          break;
        case 'events':
          // 跳转到活动列表页 - 修改为直接跳转到专用活动列表页面，并传递推荐参数
          uni.navigateTo({
            url: '/pages/event/event-list?isRecommended=true'
          });
          break;
        default:
          uni.showToast({
            title: `查看更多: ${type}`,
            icon: 'none'
          });
      }
    },
    navigateToEvent(id) {
      // 直接跳转到活动详情页
      uni.navigateTo({
        url: `/pages/event-detail/event-detail?id=${id}`
      });
    },
    refreshCampusEvents() {
      uni.showLoading({
        title: '刷新中...'
      });
      
      this.fetchCampusEvents();
      
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({
          title: '刷新成功',
          icon: 'success'
        });
      }, 800);
    }
  }
}
</script>

<style>
.discover-container {
  min-height: 100vh;
  background-color: #F5F9FF;
  animation: fadeIn 0.3s ease;
  padding-top: var(--status-bar-height);
  padding-bottom: 100px;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background-color: #FFFFFF;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.search-input {
  flex: 1;
  margin-right: 10px;
  background-color: #F5F7FA;
  border-radius: 20px;
  height: 36px;
  padding: 0 12px;
  display: flex;
  align-items: center;
}

.search-icon {
  width: 18px;
  height: 18px;
  margin-right: 6px;
  opacity: 0.6;
}

.search-input input {
  flex: 1;
  height: 36px;
  font-size: 14px;
  color: #333;
}

/* 轮播图 */
.banner {
  height: 180px;
  margin: 15px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.banner-image {
  width: 100%;
  height: 100%;
  border-radius: 12px;
}

/* 分类部分 */
.category-section {
  margin: 20px 15px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  position: relative;
  z-index: 1;
}

.category-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.category-item {
  width: 22%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
  position: relative;
  z-index: 2;
}

.category-icon-box {
  width: 45px;
  height: 45px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  z-index: 1;
  position: relative;
  overflow: hidden;
  transform: translateZ(0);
}

.category-icon {
  width: 24px;
  height: 24px;
  z-index: 2;
  position: relative;
  object-fit: contain;
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.category-name {
  font-size: 12px;
  color: #666;
  text-align: center;
  width: 100%;
}

/* 共用部分样式 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.section-more {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
}

.arrow-right {
  margin-left: 3px;
  font-size: 12px;
}

/* 热门话题部分 */
.topic-section {
  margin: 0 15px 20px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.topic-scroll {
  white-space: nowrap;
  margin: 0 -5px;
}

.topic-item {
  display: inline-block;
  margin: 5px;
  padding: 12px 15px;
  background-color: rgba(74, 144, 226, 0.08);
  border-radius: 8px;
  min-width: 60%;
}

.topic-content {
  display: flex;
  flex-direction: column;
}

.topic-title {
  font-size: 15px;
  font-weight: 500;
  color: #4A90E2;
  margin-bottom: 6px;
}

.topic-stats {
  font-size: 12px;
  color: #666;
}

/* 校园活动部分 */
.event-section {
  margin: 0 15px 20px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  position: relative;
  z-index: 1;
}

.event-list {
  margin: 0 -5px;
}

.event-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
  background: #FFFFFF;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.event-item:last-child {
  margin-bottom: 0;
}

.event-item:active {
  transform: scale(0.98);
}

.event-cover {
  width: 100%;
  height: 120px;
  object-fit: cover;
  background-color: #f0f0f0;
  transition: all 0.3s ease;
}

.event-info {
  padding: 12px;
}

.event-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  display: block;
  /* 限制标题为单行，超出部分显示省略号 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-meta {
  display: flex;
  font-size: 12px;
  color: #999;
}

.event-time {
  margin-right: 15px;
}

.debug-info {
  text-align: center;
  padding: 10px;
  color: #999;
}

.refresh-button {
  color: #4A90E2;
  font-size: 12px;
  margin-right: 5px;
}
</style> 