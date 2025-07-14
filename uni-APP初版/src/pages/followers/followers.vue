<template>
  <view class="followers-container">
    <!-- 顶部标题栏 -->
    <view class="header">
      <view class="back-btn" @tap="goBack">
        <image class="back-icon-img" src="../../static/icons/icon_ztc.png" mode="aspectFit"></image>
      </view>
      <text class="title">{{ title }}</text>
      <view class="right-space"></view>
    </view>
    
    <!-- 控制面板 -->
    <view class="control-panel">
      <view class="switch-container">
        <text class="switch-label">显示历史粉丝</text>
        <switch 
          :checked="includeDeleted" 
          @change="toggleIncludeDeleted" 
          color="#3270c5"
          class="custom-switch"
        />
      </view>
    </view>
    
    <!-- 状态提示 -->
    <view class="status-tip" v-if="statusTipVisible">
      <text class="status-tip-text">{{ statusTipText }}</text>
    </view>
    
    <!-- 用户列表 -->
    <scroll-view 
      scroll-y 
      class="followers-list"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <!-- 加载中状态 -->
      <view class="loading-state" v-if="loading && !refreshing">
        <view class="loading-spinner"></view>
        <text>加载中...</text>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-if="followers.length === 0 && !loading">
        <image class="empty-icon" src="/static/images/empty-data.png" mode="aspectFit"></image>
        <text class="empty-text">暂无粉丝</text>
        <text class="empty-tip">多发帖子互动，增加曝光度吧</text>
      </view>
      
      <!-- 粉丝列表 -->
      <view class="user-list">
        <view 
          class="user-card" 
          v-for="(user, index) in followers" 
          :key="user.id"
          :style="{animationDelay: index * 0.05 + 's'}"
          :class="{'deleted-follower': user.isDeleted}"
          @tap="goUserProfile(user.id)"
        >
          <!-- 用户头像和新粉丝标记 -->
          <view class="avatar-column">
            <view class="avatar-wrapper">
              <image class="avatar" :src="user.avatar" mode="aspectFill"></image>
            </view>
            <view class="new-follower" v-if="user.isNew">新粉丝</view>
            <view class="unfollowed-badge" v-if="user.isDeleted">已取关</view>
          </view>
          
          <!-- 用户资料 -->
          <view class="user-detail">
            <text class="username">{{ user.nickname }}</text>
            <view class="user-bio">{{ user.bio || '这个人很懒，什么都没写~' }}</view>
            <view class="follow-date" v-if="user.isDeleted">
              <text>关注于: {{ formatDate(user.followedAt) }}</text>
              <text>取关于: {{ formatDate(user.unfollowedAt) }}</text>
          </view>
          </view>
        </view>
      </view>
      
      <!-- 加载更多提示 -->
      <view class="no-more" v-if="noMore && followers.length > 0">
        <text>~ 没有更多内容了 ~</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import api from '../../utils/api.js';
import store from '../../utils/store.js';

export default {
  data() {
    return {
      userId: '',
      title: '粉丝列表',
      refreshing: false,
      loading: true,
      noMore: false,
      followers: [],
      pageNum: 1,
      pageSize: 20,
      includeDeleted: false,
      statusTipVisible: false,
      statusTipText: '',
      statusTipTimer: null
    }
  },
  onLoad(options) {
    // 获取用户ID
    if (options.id) {
      this.userId = options.id;
      // 如果是查看自己的粉丝
      if (this.userId === 'self') {
        this.title = '我的粉丝';
        // 这里可以获取自己的用户ID
        const currentUser = store.getters.getUser();
        if (currentUser && currentUser.id) {
          this.userId = currentUser.id;
        }
      }
    } else {
      this.userId = store.getters.getUser()?.id || 'self';
      this.title = '我的粉丝';
    }
    
    this.loadFollowers();
  },
  methods: {
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '未知';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 显示状态提示
    showStatusTip(text, duration = 2000) {
      // 清除之前的定时器
      if (this.statusTipTimer) {
        clearTimeout(this.statusTipTimer);
      }
      
      // 显示新的提示
      this.statusTipText = text;
      this.statusTipVisible = true;
      
      // 设置定时器自动隐藏提示
      this.statusTipTimer = setTimeout(() => {
        this.statusTipVisible = false;
      }, duration);
    },
    
    // 加载粉丝列表
    loadFollowers() {
      // 显示加载状态
      this.loading = true;
      
      // 构建API请求参数
      const params = {
        page: this.pageNum,
        limit: this.pageSize,
        includeDeleted: this.includeDeleted
      };
      
      console.log(`🔍 请求粉丝列表 - 用户ID: ${this.userId}, 页码: ${this.pageNum}, 包含已取消关注: ${this.includeDeleted}`);
      
      // 调用获取粉丝列表的API
      api.users.getFollowers(this.userId, params)
        .then(res => {
          if (res.success) {
            const newFollowers = res.data.followers || [];
            const totalCount = res.data.pagination?.total || 0;
            
            // 添加调试日志，查看每个粉丝的信息
            console.log(`🔍 获取到${newFollowers.length}位粉丝`);
            console.log('🔑 当前用户ID:', store.getters.getUser()?.id);
            
            // 根据当前页数决定是替换还是追加数据
            if (this.pageNum === 1) {
              this.followers = newFollowers;
              if (newFollowers.length === 0) {
                if (!this.includeDeleted) {
                  console.log('⚠️ 当前粉丝列表为空');
                  this.showStatusTip('暂无粉丝关注你');
                } else {
                  console.log('⚠️ 当前包括历史粉丝的列表为空');
                  this.showStatusTip('暂无粉丝记录');
                }
              } else {
                // 显示粉丝数量提示
                const tipText = this.includeDeleted 
                  ? `共找到${totalCount}位粉丝(包含已取关)` 
                  : `你有${totalCount}位粉丝`;
                this.showStatusTip(tipText, 2000);
              }
            } else {
              // 如果是加载更多，追加数据
              this.followers = [...this.followers, ...newFollowers];
              
              if (newFollowers.length > 0) {
                this.showStatusTip(`加载了${newFollowers.length}位粉丝`, 1500);
              }
            }
            
            // 判断是否还有更多数据
            this.noMore = newFollowers.length < this.pageSize;
            console.log(`📊 当前页粉丝: ${newFollowers.length}, 总粉丝: ${this.followers.length}, 是否还有更多: ${!this.noMore}`);
            
            // 如果加载完毕但没有更多数据
            if (this.noMore && this.pageNum > 1) {
              this.showStatusTip('已加载全部粉丝', 1500);
            }
          } else {
            console.error('❌ 获取粉丝列表失败:', res.message);
            uni.showToast({
              title: res.message || '加载粉丝列表失败',
              icon: 'none'
            });
            
            this.showStatusTip('加载失败，请重试', 2000);
          }
        })
        .catch(err => {
          console.error('❌ 加载粉丝列表失败:', err);
          // 记录更详细的错误信息
          if (err.response) {
            console.error('- 响应状态:', err.response.status);
            console.error('- 响应数据:', err.response.data);
          }
          
          uni.showToast({
            title: '加载粉丝列表失败，请检查网络',
            icon: 'none',
            duration: 3000
          });
          
          this.showStatusTip('网络错误，加载失败', 3000);
        })
        .finally(() => {
          this.loading = false;
          this.refreshing = false;
          console.log('🏁 粉丝列表加载完成');
        });
    },
    
    // 刷新列表
    onRefresh() {
      this.refreshing = true;
      this.pageNum = 1;
      this.noMore = false;
      this.loadFollowers();
    },
    
    // 加载更多
    loadMore() {
      if (this.loading || this.noMore) return;
      
      this.pageNum++;
      this.loadFollowers();
    },
    
    // 跳转到用户主页
    goUserProfile(userId) {
      uni.navigateTo({
        url: `/pages/user-profile/user-profile?id=${userId}`
      });
    },
    
    // 切换包括已取消关注的粉丝
    toggleIncludeDeleted() {
      this.includeDeleted = !this.includeDeleted;
      this.pageNum = 1;
      this.loadFollowers();
    }
  }
}
</script>

<style>
.followers-container {
  min-height: 100vh;
  background-color: #f6f7fb;
  background-image: linear-gradient(to bottom, #f1f5fd, #f6f7fb);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow-x: hidden;
}

/* 顶部标题栏 */
.followers-container .header {
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

.followers-container .back-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transition: all 0.2s;
}

.followers-container .back-btn:active {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(0.95);
}

.followers-container .title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 1);
}

.followers-container .right-space {
  width: 30px;
}

/* 控制面板 */
.followers-container .control-panel {
  padding: var(--padding-sm) var(--padding-lg);
  background-color: #ffffff;
  border-bottom: 1px solid rgba(230, 235, 245, 0.8);
}

.followers-container .switch-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.followers-container .switch-label {
  font-size: 14px;
  color: #888;
}

.followers-container .custom-switch {
  transform: scale(0.8);
}

/* 用户列表 */
.followers-container .followers-list {
  height: calc(100vh - 44px - 44px);
  padding: 8px 0;
  box-sizing: border-box;
  width: 100%;
}

/* 用户卡片 */
.followers-container .user-list {
  padding: 0 8px 20px;
  box-sizing: border-box;
  width: 100%;
}

.followers-container .user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 12px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  animation: fadeInUp 0.5s both;
  border: 1px solid rgba(230, 235, 245, 0.8);
  width: 100%;
  box-sizing: border-box;
  will-change: transform, opacity;
}

.followers-container .user-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.followers-container .avatar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 12px;
  width: 48px;
  flex-shrink: 0;
}

.followers-container .avatar-wrapper {
  position: relative;
  margin-bottom: 6px;
}

.followers-container .avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background-color: #f1f1f1;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  border: 1px solid #fff;
}

.followers-container .new-follower {
  font-size: 10px;
  color: #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
  box-shadow: 0 2px 5px rgba(255, 107, 107, 0.15);
  border: 1px solid rgba(255, 107, 107, 0.2);
  text-align: center;
  white-space: nowrap;
}

.followers-container .user-detail {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.followers-container .username {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 5px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.followers-container .user-bio {
  font-size: 13px;
  color: #888888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 已取消关注的样式 */
.followers-container .deleted-follower {
  background-color: rgba(249, 249, 249, 0.9);
  border: 1px dashed rgba(200, 200, 200, 0.6);
  opacity: 0.8;
}

.followers-container .unfollowed-badge {
  font-size: 10px;
  color: #888;
  background-color: rgba(200, 200, 200, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
  border: 1px solid rgba(200, 200, 200, 0.4);
  text-align: center;
  white-space: nowrap;
  margin-top: 4px;
}

.followers-container .follow-date {
  font-size: 10px;
  color: #999;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 状态提示 */
.followers-container .status-tip {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 999;
  animation: fadeInOut 0.3s ease-in-out;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  max-width: 80%;
}

.followers-container .status-tip-text {
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translate(-50%, -10px); }
  100% { opacity: 1; transform: translate(-50%, 0); }
}

/* 加载中动画 */
.followers-container .loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #888;
  font-size: 14px;
}

.followers-container .loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(224, 224, 224, 0.5);
  border-top: 2px solid #3270c5;
  border-radius: 50%;
  margin-bottom: 10px;
  animation: spin 1s infinite ease-out;
  will-change: transform;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 空状态 */
.followers-container .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  animation: fadeIn 0.5s both;
  will-change: opacity;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.followers-container .empty-icon {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  opacity: 0.8;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.followers-container .empty-text {
  font-size: 18px;
  font-weight: 600;
  color: #444;
  margin-bottom: 10px;
}

.followers-container .empty-tip {
  font-size: 14px;
  color: #888;
  margin-bottom: 30px;
  line-height: 1.6;
}

/* 加载更多提示 */
.followers-container .no-more {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 15px 0 25px;
}

/* 动画效果 */
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

/* 图标 */
.followers-container .iconfont {
  font-family: "iconfont" !important;
}

.followers-container .icon-back:before {
  content: "\e679";
}

.back-icon-img {
  width: 24px;
  height: 24px;
}
</style> 