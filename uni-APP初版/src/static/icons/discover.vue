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
            <image class="category-icon" :src="item.icon" mode="aspectFit"></image>
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
            <text class="topic-title">#{{ item.title }}#</text>
            <text class="topic-stats">{{ item.participants }}人参与 · {{ item.posts }}条内容</text>
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 校园活动 -->
    <view class="event-section">
      <view class="section-header">
        <text class="section-title">校园活动</text>
        <view class="section-more" @tap="navigateToMore('events')">
          <text>查看更多</text>
          <text class="arrow-right">></text>
        </view>
      </view>
      
      <view class="event-list">
        <view class="event-item" v-for="(item, index) in campusEvents" :key="index" @tap="navigateToEvent(item.id)">
          <view class="event-info">
            <text class="event-title">{{ item.title }}</text>
            <view class="event-meta">
              <text class="event-time">{{ item.time }}</text>
              <text class="event-location">{{ item.location }}</text>
            </view>
          </view>
          <view class="event-arrow">
            <text class="arrow-right">></text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      isRefreshing: false,
      banners: [
        { id: 1, title: '校园图书馆新书推荐', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80', url: '' },
        { id: 2, title: '校园学习环境展示', image: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80', url: '' },
        { id: 3, title: '校园活动中心', image: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80', url: '' }
      ],
      categories: [
        { id: 'activity', name: '校园活动', icon: '/static/icons/xyhd.png', bgColor: 'rgba(74, 144, 226, 0.1)' },
        { id: 'study', name: '学习交流', icon: '/static/icons/xxjl.png', bgColor: 'rgba(74, 144, 226, 0.1)' },
        { id: 'job', name: '招聘信息', icon: '/static/icons/zpxx.png', bgColor: 'rgba(74, 144, 226, 0.1)' },
        { id: 'lost', name: '失物招领', icon: '/static/icons/swzl.png', bgColor: 'rgba(74, 144, 226, 0.1)' }
      ],
      hotTopics: [
        { id: 201, title: '期末考试攻略', participants: 2356, posts: 189 },
        { id: 202, title: '校园招聘会', participants: 1892, posts: 156 },
        { id: 203, title: '食堂新菜推荐', participants: 1654, posts: 122 },
        { id: 204, title: '宿舍生活日记', participants: 1432, posts: 120 },
        { id: 205, title: '校园歌手大赛', participants: 2300, posts: 200 }
      ],
      campusEvents: [
        { id: 301, title: '校园歌手大赛', time: '05-25 14:00', location: '大学生活动中心' },
        { id: 302, title: '毕业季摄影展', time: '06-10 至 06-20', location: '图书馆展览厅' },
        { id: 303, title: '创新创业大赛', time: '06-15 9:00', location: '科技楼报告厅' }
      ]
    }
  },
  onLoad() {
    uni.$emit('tabChange', 1); // 通知tabBar更新当前选中标签
  },
  methods: {
    refreshData() {
      this.isRefreshing = true;
      
      // 模拟数据刷新
      setTimeout(() => {
        // 随机更新一些数据
        
        this.isRefreshing = false;
        uni.stopPullDownRefresh();
        
        uni.showToast({
          title: '刷新成功',
          icon: 'success'
        });
      }, 1500);
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
        uni.navigateTo({
          url: item.url
        });
      } else {
        uni.showToast({
          title: `查看banner: ${item.title}`,
          icon: 'none'
        });
      }
    },
    navigateToCategory(categoryId) {
      // 直接跳转到分类页面
      uni.navigateTo({
        url: `/pages/category/category?id=${categoryId}`
      });
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
          // 跳转到活动列表页 - 修改为跳转到校园活动分类页面
          uni.navigateTo({
            url: '/pages/category/category?id=activity'
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
        url: `/pages/post-detail/post-detail?id=${id}&type=activity`
      });
    }
  }
}
</script>

<style>
.discover-container {
  min-height: 100vh;
  background-color: #F5F9FF;
  padding-bottom: 50px;
}

/* 搜索栏 */
.search-bar {
  padding: 15px;
  background: #FFFFFF;
}

.search-input {
  display: flex;
  align-items: center;
  background-color: #F0F2F5;
  border-radius: 20px;
  padding: 8px 15px;
}

.search-icon {
  width: 18px;
  height: 18px;
  margin-right: 8px;
}

.search-input input {
  flex: 1;
  font-size: 14px;
  height: 20px;
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
}

.category-icon-box {
  width: 45px;
  height: 45px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.category-icon {
  width: 24px;
  height: 24px;
}

.category-name {
  font-size: 12px;
  color: #666;
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
}

.event-list {
  margin: 0 -5px;
}

.event-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 5px;
  border-bottom: 1px solid #F0F2F5;
}

.event-item:last-child {
  border-bottom: none;
}

.event-info {
  flex: 1;
}

.event-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
  display: block;
}

.event-meta {
  display: flex;
  font-size: 12px;
  color: #999;
}

.event-time {
  margin-right: 15px;
}

.event-arrow {
  width: 20px;
  display: flex;
  justify-content: center;
  color: #CCC;
}
</style> 