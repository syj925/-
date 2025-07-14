<template>
  <view class="search-container page-container">
    <!-- 顶部搜索栏 -->
    <view class="search-header">
      <view class="search-input-wrapper animate-slideRight">
        <view class="search-input-box input-box">
          <text class="iconfont icon-search icon"></text>
          <input 
            class="search-input" 
            type="text" 
            v-model="searchKeyword" 
            placeholder="搜索帖子、话题或用户" 
            confirm-type="search"
            @confirm="doSearch"
            @input="onInputChange"
            focus
          />
          <text class="clear-icon" v-if="searchKeyword" @tap="clearSearch">×</text>
        </view>
      </view>
      <text class="cancel-btn animate-fadeIn" @tap="goBack">取消</text>
    </view>

    <view class="search-content">
      <!-- 搜索历史 -->
      <view class="search-history animate-fadeIn" v-if="!searchKeyword && searchHistory.length > 0 && !searching">
        <view class="section-header">
          <text class="section-title">搜索历史</text>
          <text class="clear-history" @tap="clearHistory">清空</text>
        </view>
        <view class="history-list">
          <view 
            class="history-item animate-slideRight" 
            v-for="(item, index) in searchHistory" 
            :key="index"
            :style="{ 'animation-delay': index * 0.05 + 's' }"
            @tap="useHistoryItem(item)"
          >
            <text class="iconfont icon-time"></text>
            <text class="history-text">{{ item }}</text>
          </view>
        </view>
      </view>

      <!-- 热门搜索 -->
      <view class="hot-search animate-fadeIn delay-1" v-if="!searchKeyword && hotSearches.length > 0 && !searching">
        <view class="section-header">
          <text class="section-title">热门搜索</text>
        </view>
        <view class="hot-tags">
          <text 
            class="hot-tag tag animate-scaleIn" 
            v-for="(tag, index) in hotSearches" 
            :key="index"
            :style="{ 'animation-delay': (index * 0.05 + 0.2) + 's' }"
            @tap="useHistoryItem(tag)"
          >{{ tag }}</text>
        </view>
      </view>
      
      <!-- 话题热榜 -->
      <view class="trending-topics animate-fadeIn delay-2" v-if="!searchKeyword && trendingTopics.length > 0 && !searching">
        <view class="section-header">
          <text class="section-title">话题热榜</text>
          <text class="view-all" @tap="viewAllTopics">查看更多</text>
        </view>
        <view class="topic-list">
          <view 
            class="trending-topic-item animate-slideRight" 
            v-for="(topic, index) in trendingTopics" 
            :key="index"
            :style="{ 'animation-delay': (index * 0.05 + 0.4) + 's' }"
            @tap="viewTopic(topic.id)"
          >
            <view class="topic-rank">{{ index + 1 }}</view>
            <view class="topic-content">
              <text class="topic-name">#{{ topic.name }}</text>
              <text class="topic-desc" v-if="topic.description">{{ topic.description }}</text>
            </view>
            <view class="topic-stats">
              <text class="topic-count">{{ topic.postCount }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 搜索建议 -->
      <view class="search-suggestions" v-if="searchKeyword && !searching && suggestions.length > 0">
        <view 
          class="suggestion-item animate-slideRight" 
          v-for="(item, index) in suggestions" 
          :key="index"
          :style="{ 'animation-delay': index * 0.05 + 's' }"
          @tap="useSuggestion(item)"
        >
          <text class="iconfont icon-search"></text>
          <text class="suggestion-text">{{ item }}</text>
        </view>
      </view>

      <!-- 搜索结果 -->
      <view class="search-results animate-fadeIn" v-if="searching">
        <!-- 搜索结果标签页 -->
        <view class="result-tabs tabs">
          <view 
            class="tab-item" 
            v-for="(tab, index) in resultTabs" 
            :key="index"
            :class="{ active: currentTab === index }"
            @tap="switchTab(index)"
          >
            {{ tab.name }}
          </view>
        </view>

        <!-- 搜索结果内容 -->
        <scroll-view 
          scroll-y 
          class="result-list"
          @scrolltolower="loadMoreResults"
          refresher-enabled
          :refresher-triggered="refreshing"
          @refresherrefresh="refreshResults"
        >
          <!-- 帖子搜索结果 -->
          <block v-if="currentTab === 0">
            <view 
              class="post-item card animate-scaleIn" 
              v-for="(post, index) in postResults" 
              :key="index" 
              :style="{ 'animation-delay': index * 0.05 + 's' }"
              @tap="viewPostDetail(post.id)"
            >
              <view class="post-info">
                <text class="post-title">{{ post.title || post.content.substr(0, 20) }}</text>
                <text class="post-excerpt">{{ post.content }}</text>
                <view class="post-meta">
                  <text class="post-author">{{ post.username }}</text>
                  <text class="post-stats">{{ post.likes }}赞 · {{ post.comments }}评论</text>
                </view>
              </view>
              <image class="post-image" v-if="post.images && post.images.length" :src="post.images[0]" mode="aspectFill"></image>
            </view>
            <view class="empty-result empty-state" v-if="postResults.length === 0 && !loading">
              <image class="empty-icon animate-float" src="/static/icons/empty-search.png"></image>
              <text class="empty-text">没有找到相关帖子</text>
            </view>
          </block>

          <!-- 用户搜索结果 -->
          <block v-if="currentTab === 1">
            <view 
              class="user-item card animate-slideRight" 
              v-for="(user, index) in userResults" 
              :key="index" 
              :style="{ 'animation-delay': index * 0.05 + 's' }"
              @tap="viewUserProfile(user.id)"
            >
              <image class="user-avatar avatar" :src="user.avatar" mode="aspectFill"></image>
              <view class="user-info">
                <text class="user-name">{{ user.nickname }}</text>
                <text class="user-bio">{{ user.bio }}</text>
              </view>
              <view class="follow-btn" :class="{ followed: user.isFollowed }" @tap.stop="toggleFollow(index)">
                {{ user.isFollowed ? '已关注' : '关注' }}
              </view>
            </view>
            <view class="empty-result empty-state" v-if="userResults.length === 0 && !loading">
              <image class="empty-icon animate-float" src="/static/icons/empty-search.png"></image>
              <text class="empty-text">没有找到相关用户</text>
            </view>
          </block>

          <!-- 话题搜索结果 -->
          <block v-if="currentTab === 2">
            <view 
              class="topic-item card animate-slideLeft" 
              v-for="(topic, index) in topicResults" 
              :key="index" 
              :style="{ 'animation-delay': index * 0.05 + 's' }"
              @tap="viewTopic(topic.id)"
            >
              <view class="topic-header">
                <text class="topic-name">#{{ topic.name }}</text>
                <text class="topic-count">{{ topic.postCount }}个帖子</text>
              </view>
              <text class="topic-desc">{{ topic.description }}</text>
            </view>
            <view class="empty-result empty-state" v-if="topicResults.length === 0 && !loading">
              <image class="empty-icon animate-float" src="/static/icons/empty-search.png"></image>
              <text class="empty-text">没有找到相关话题</text>
            </view>
          </block>

          <!-- 加载更多状态 -->
          <view class="loading-more" v-if="loading">
            <view class="loading-spinner"></view>
            <text>正在加载...</text>
          </view>
          <view class="no-more" v-if="noMore && !(currentTab === 0 && postResults.length === 0) && !(currentTab === 1 && userResults.length === 0) && !(currentTab === 2 && topicResults.length === 0)">
            <text>没有更多内容了</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '../../utils/api.js';
import store from '../../utils/store.js';

export default {
  data() {
    return {
      searchKeyword: '',
      searchHistory: [],
      hotSearches: [],
      suggestions: [],
      searching: false,
      refreshing: false,
      loading: false,
      noMore: false,
      currentTab: 0,
      resultTabs: [
        { name: '帖子' },
        { name: '用户' },
        { name: '话题' }
      ],
      postResults: [],
      userResults: [],
      topicResults: [],
      page: 1,
      limit: 10,
      inputTimer: null,
      trendingTopics: []
    }
  },
  onLoad() {
    this.loadSearchHistory();
    this.loadHotSearches();
    this.loadTrendingTopics();
  },
  methods: {
    // 获取搜索历史
    loadSearchHistory() {
      try {
        const history = uni.getStorageSync('searchHistory');
        if (history) {
          this.searchHistory = JSON.parse(history);
        }
      } catch (e) {
        console.error('获取搜索历史失败:', e);
        this.searchHistory = [];
      }
    },
    
    // 保存搜索历史
    saveSearchHistory(keyword) {
      if (!keyword) return;
      
      // 去重，将新关键词放在最前面
      let history = this.searchHistory.filter(item => item !== keyword);
      history.unshift(keyword);
      
      // 最多保存10条历史记录
      if (history.length > 10) {
        history = history.slice(0, 10);
      }
      
      this.searchHistory = history;
      
      try {
        uni.setStorageSync('searchHistory', JSON.stringify(history));
      } catch (e) {
        console.error('保存搜索历史失败:', e);
      }
    },
    
    // 清空搜索历史
    clearHistory() {
      uni.showModal({
        title: '清空搜索历史',
        content: '确定要清空所有搜索历史吗？',
        success: (res) => {
          if (res.confirm) {
            this.searchHistory = [];
            try {
              uni.removeStorageSync('searchHistory');
              uni.showToast({
                title: '已清空搜索历史',
                icon: 'success'
              });
            } catch (e) {
              console.error('清空搜索历史失败:', e);
            }
          }
        }
      });
    },
    
    // 加载热门搜索
    loadHotSearches() {
      api.search.getHotSearches()
        .then(res => {
          if (res.success) {
            this.hotSearches = res.data.keywords || [];
          } else {
            throw new Error(res.message || '获取热门搜索失败');
          }
        })
        .catch(err => {
          console.error('获取热门搜索失败:', err);
          // 使用默认热门搜索词
          this.hotSearches = ['期末考试', '校园活动', '寻物启事', '二手交易', '实习招聘', '美食推荐', '考研资料'];
          // 不显示错误提示给用户，静默使用默认值
        });
    },
    
    // 加载话题热榜
    loadTrendingTopics() {
      api.search.getTrendingTopics()
        .then(res => {
          if (res.success) {
            this.trendingTopics = res.data.topics || [];
          } else {
            throw new Error(res.message || '获取话题热榜失败');
          }
        })
        .catch(err => {
          console.error('获取话题热榜失败:', err);
          // 使用默认话题热榜
          this.trendingTopics = [
            { name: '校园活动', postCount: 120 },
            { name: '期末考试', postCount: 100 },
            { name: '美食推荐', postCount: 80 },
            { name: '校园美食', postCount: 70 },
            { name: '校园生活', postCount: 60 },
            { name: '校园风景', postCount: 50 },
            { name: '校园美食', postCount: 40 },
            { name: '校园生活', postCount: 30 },
            { name: '校园风景', postCount: 20 },
            { name: '校园美食', postCount: 10 }
          ];
          // 不显示错误提示给用户，静默使用默认值
        });
    },
    
    // 输入变化时获取搜索建议
    onInputChange() {
      // 清除之前的定时器
      if (this.inputTimer) {
        clearTimeout(this.inputTimer);
      }
      
      if (!this.searchKeyword) {
        this.suggestions = [];
        this.searching = false;
        return;
      }
      
      // 设置新的定时器，防抖处理
      this.inputTimer = setTimeout(() => {
        this.getSuggestions();
      }, 300);
    },
    
    // 获取搜索建议
    getSuggestions() {
      if (!this.searchKeyword) return;
      
      api.search.getSuggestions(this.searchKeyword)
        .then(res => {
          if (res.success) {
            this.suggestions = res.data.suggestions || [];
          } else {
            throw new Error(res.message || '获取搜索建议失败');
          }
        })
        .catch(err => {
          console.error('获取搜索建议失败:', err);
          // 作为备用，用当前关键词生成简单的建议（静默失败）
          if (this.searchKeyword.length > 1) {
            this.suggestions = [
              this.searchKeyword,
              `${this.searchKeyword} 相关`,
              `查找 ${this.searchKeyword}`
            ];
          } else {
            this.suggestions = [];
          }
        });
    },
    
    // 清空搜索框
    clearSearch() {
      this.searchKeyword = '';
      this.suggestions = [];
      this.searching = false;
    },
    
    // 使用历史或热门搜索项
    useHistoryItem(keyword) {
      this.searchKeyword = keyword;
      this.doSearch();
    },
    
    // 使用搜索建议
    useSuggestion(suggestion) {
      this.searchKeyword = suggestion;
      this.doSearch();
    },
    
    // 执行搜索
    doSearch() {
      const keyword = this.searchKeyword.trim();
      
      if (!keyword) {
        uni.showToast({
          title: '请输入搜索关键词',
          icon: 'none'
        });
        return;
      }
      
      // 关闭软键盘
      uni.hideKeyboard && uni.hideKeyboard();
      
      // 保存搜索历史
      this.saveSearchHistory(keyword);
      
      // 重置搜索状态
      this.searching = true;
      this.refreshing = false;
      this.loading = false;
      this.noMore = false;
      this.page = 1;
      
      // 清空之前的搜索结果
      this.postResults = [];
      this.userResults = [];
      this.topicResults = [];
      
      // 显示搜索中提示
      uni.showLoading({
        title: '搜索中...',
        mask: true
      });
      
      // 根据当前标签页执行对应搜索
      this.search();
      
      // 定时关闭搜索提示，避免长时间显示
      setTimeout(() => {
        uni.hideLoading();
      }, 1500);
    },
    
    // 根据当前标签执行搜索
    search() {
      switch (this.currentTab) {
        case 0:
          this.searchPosts();
          break;
        case 1:
          this.searchUsers();
          break;
        case 2:
          this.searchTopics();
          break;
      }
    },
    
    // 搜索帖子
    searchPosts() {
      if (this.loading) return;
      
      this.loading = true;
      
      const params = {
        keyword: this.searchKeyword.trim(),
        page: this.page,
        limit: this.limit
      };
      
      api.search.searchPosts(params)
        .then(res => {
          if (res.success) {
            const newPosts = res.data.posts || [];
            
            // 根据页码处理数据
            if (this.page === 1) {
              this.postResults = newPosts;
            } else {
              this.postResults = [...this.postResults, ...newPosts];
            }
            
            // 判断是否还有更多数据
            this.noMore = !res.data.pagination?.hasNextPage || newPosts.length < this.limit;
          } else {
            uni.showToast({
              title: res.message || '搜索失败',
              icon: 'none'
            });
          }
        })
        .catch(err => {
          console.error('搜索帖子失败:', err);
          uni.showToast({
            title: '搜索失败，请稍后再试',
            icon: 'none'
          });
        })
        .finally(() => {
          this.loading = false;
          if (this.refreshing) {
            this.refreshing = false;
          }
        });
    },
    
    // 搜索用户
    searchUsers() {
      if (this.loading) return;
      
      this.loading = true;
      
      const params = {
        keyword: this.searchKeyword.trim(),
        page: this.page,
        limit: this.limit
      };
      
      api.search.searchUsers(params)
        .then(res => {
          if (res.success) {
            const newUsers = res.data.users || [];
            
            // 根据页码处理数据
            if (this.page === 1) {
              this.userResults = newUsers;
            } else {
              this.userResults = [...this.userResults, ...newUsers];
            }
            
            // 判断是否还有更多数据
            this.noMore = !res.data.pagination?.hasNextPage || newUsers.length < this.limit;
          } else {
            uni.showToast({
              title: res.message || '搜索失败',
              icon: 'none'
            });
          }
        })
        .catch(err => {
          console.error('搜索用户失败:', err);
          uni.showToast({
            title: '搜索失败，请稍后再试',
            icon: 'none'
          });
        })
        .finally(() => {
          this.loading = false;
          if (this.refreshing) {
            this.refreshing = false;
          }
        });
    },
    
    // 搜索话题
    searchTopics() {
      if (this.loading) return;
      
      this.loading = true;
      
      const params = {
        keyword: this.searchKeyword.trim(),
        page: this.page,
        limit: this.limit
      };
      
      api.search.searchTopics(params)
        .then(res => {
          if (res.success) {
            const newTopics = res.data.topics || [];
            
            // 根据页码处理数据
            if (this.page === 1) {
              this.topicResults = newTopics;
            } else {
              this.topicResults = [...this.topicResults, ...newTopics];
            }
            
            // 判断是否还有更多数据
            this.noMore = !res.data.pagination?.hasNextPage || newTopics.length < this.limit;
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
            title: '搜索失败，请稍后再试',
            icon: 'none'
          });
        })
        .finally(() => {
          this.loading = false;
          if (this.refreshing) {
            this.refreshing = false;
          }
        });
    },
    
    // 切换标签页
    switchTab(index) {
      if (this.currentTab === index) return;
      
      this.currentTab = index;
      
      // 如果已经在搜索状态，且当前标签页没有数据，则执行搜索
      if (this.searching) {
        if ((index === 0 && this.postResults.length === 0) ||
            (index === 1 && this.userResults.length === 0) ||
            (index === 2 && this.topicResults.length === 0)) {
          this.page = 1;
          this.noMore = false;
          this.search();
        }
      }
    },
    
    // 加载更多结果
    loadMoreResults() {
      if (this.loading || this.noMore || !this.searching) return;
      
      this.page++;
      this.search();
    },
    
    // 刷新结果
    refreshResults() {
      if (this.loading || !this.searching) return;
      
      this.refreshing = true;
      this.page = 1;
      this.noMore = false;
      this.search();
    },
    
    // 查看帖子详情
    viewPostDetail(postId) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${postId}`
      });
    },
    
    // 查看用户主页
    viewUserProfile(userId) {
      uni.navigateTo({
        url: `/pages/user-profile/user-profile?id=${userId}`
      });
    },
    
    // 查看话题详情
    viewTopic(topicId) {
      uni.navigateTo({
        url: `/pages/topic/topic-detail?id=${topicId}`
      });
    },
    
    // 查看所有话题
    viewAllTopics() {
      uni.navigateTo({
        url: '/pages/topic/topic-list'
      });
    },
    
    // 关注/取消关注用户
    toggleFollow(index) {
      // 检查是否已登录
      if (!store.getters.isLogin()) {
        uni.navigateTo({
          url: '/pages/login/login'
        });
        return;
      }
      
      const user = this.userResults[index];
      if (!user || !user.id) return;
      
      uni.showLoading({
        title: user.isFollowed ? '取消关注中...' : '关注中...',
        mask: true
      });
      
      const action = user.isFollowed ? 
        api.users.unfollow(user.id) : 
        api.users.follow(user.id);
      
      action.then(res => {
        if (res.success) {
          user.isFollowed = !user.isFollowed;
          
          uni.showToast({
            title: user.isFollowed ? '关注成功' : '已取消关注',
            icon: 'success'
          });
        } else {
          uni.showToast({
            title: res.message || (user.isFollowed ? '取消关注失败' : '关注失败'),
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error(user.isFollowed ? '取消关注失败:' : '关注失败:', err);
        uni.showToast({
          title: (user.isFollowed ? '取消关注' : '关注') + '失败，请稍后再试',
          icon: 'none'
        });
      })
      .finally(() => {
        uni.hideLoading();
      });
    },
    
    // 返回
    goBack() {
      uni.navigateBack();
    }
  }
}
</script>

<style scoped>
.search-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--secondary-color);
}

.search-header {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background-color: #FFFFFF;
  box-shadow: var(--input-shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.search-input-wrapper {
  flex: 1;
}

.search-input-box {
  height: 40px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  background-color: rgba(74, 144, 226, 0.05);
  border-radius: 20px;
}

.search-input {
  flex: 1;
  height: 40px;
  font-size: 15px;
  padding-left: 8px;
}

.clear-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 18px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.clear-icon:active {
  background-color: rgba(153, 153, 153, 0.1);
}

.cancel-btn {
  padding: 0 15px;
  font-size: 15px;
  color: var(--primary-color);
  transition: opacity var(--transition-fast);
}

.cancel-btn:active {
  opacity: 0.7;
}

.search-content {
  flex: 1;
  padding: 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
}

.clear-history {
  font-size: 14px;
  color: var(--primary-color);
  transition: opacity var(--transition-fast);
}

.clear-history:active {
  opacity: 0.7;
}

.history-list {
  margin-bottom: 25px;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background-color: #FFFFFF;
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  transition: transform var(--transition-fast);
}

.history-item:active {
  transform: translateX(3px);
  background-color: rgba(74, 144, 226, 0.05);
}

.history-item .iconfont {
  font-size: 16px;
  color: var(--text-color-secondary);
  margin-right: 10px;
}

.history-text {
  font-size: 14px;
  color: var(--text-color);
}

.hot-search {
  margin-bottom: 30px;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
}

.hot-tag {
  margin-bottom: 10px;
  font-size: 14px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 8px;
  background-color: #FFFFFF;
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  transition: transform var(--transition-fast);
}

.suggestion-item:active {
  transform: translateX(3px);
  background-color: rgba(74, 144, 226, 0.05);
}

.suggestion-item .iconfont {
  font-size: 16px;
  color: var(--primary-color);
  margin-right: 10px;
}

.suggestion-text {
  font-size: 14px;
  color: var(--text-color);
}

.search-results {
  margin-top: 10px;
}

.result-list {
  height: calc(100vh - 140px);
}

.post-item {
  display: flex;
  margin-bottom: 15px;
  padding: 15px;
}

.post-info {
  flex: 1;
  margin-right: 10px;
}

.post-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 5px;
  display: block;
}

.post-excerpt {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin-bottom: 8px;
  display: block;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-color-secondary);
}

.post-image {
  width: 80px;
  height: 80px;
  border-radius: var(--border-radius-sm);
  object-fit: cover;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 15px;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  margin-right: 15px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 5px;
  display: block;
}

.user-bio {
  font-size: 13px;
  color: var(--text-color-secondary);
  display: block;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
}

.follow-btn {
  padding: 5px 15px;
  border-radius: 15px;
  background: var(--primary-gradient);
  color: #FFFFFF;
  font-size: 14px;
  box-shadow: var(--button-shadow);
  transition: all var(--transition-normal);
}

.follow-btn:active {
  transform: scale(0.95);
  box-shadow: var(--button-shadow-active);
}

.follow-btn.followed {
  background: rgba(74, 144, 226, 0.1);
  color: var(--primary-color);
  box-shadow: none;
}

.topic-item {
  padding: 15px;
  margin-bottom: 15px;
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.topic-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--primary-color);
}

.topic-count {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.topic-desc {
  font-size: 14px;
  color: var(--text-color-secondary);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.empty-result {
  margin-top: 50px;
}

.no-more {
  text-align: center;
  padding: 20px 0;
  font-size: 14px;
  color: var(--text-color-secondary);
  opacity: 0.7;
}

.trending-topics {
  margin-bottom: 30px;
}

.topic-list {
  margin-bottom: 25px;
}

.trending-topic-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background-color: #FFFFFF;
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  transition: transform var(--transition-fast);
}

.trending-topic-item:active {
  transform: translateX(3px);
  background-color: rgba(74, 144, 226, 0.05);
}

.topic-rank {
  font-size: 16px;
  font-weight: 500;
  color: var(--primary-color);
  margin-right: 10px;
}

.topic-content {
  flex: 1;
}

.topic-stats {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.view-all {
  font-size: 14px;
  color: var(--primary-color);
  transition: opacity var(--transition-fast);
}

.view-all:active {
  opacity: 0.7;
}
</style> 