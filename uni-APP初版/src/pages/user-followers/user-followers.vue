<template>
  <view class="user-followers-container">
    <!-- 顶部标题栏 -->
    <view class="header">
      <view class="back-btn" @tap="goBack">
        <image class="back-icon-img" src="../../static/icons/icon_ztc.png" mode="aspectFit"></image>
      </view>
      <text class="title">{{ title }}</text>
      <view class="right-space"></view>
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
        <text class="empty-tip">该用户还没有粉丝关注</text>
      </view>
      
      <!-- 粉丝列表 -->
      <view class="user-list">
        <view 
          class="user-card" 
          v-for="(user, index) in followers" 
          :key="user.id"
          :style="{ animationDelay: index * 0.05 + 's' }"
        >
          <!-- 用户头像和新粉丝标记 -->
          <view class="avatar-column">
            <view class="avatar-wrapper">
              <image class="avatar" :src="user.avatar" mode="aspectFill"></image>
            </view>
            <view class="new-follower" v-if="user.isNew">新粉丝</view>
          </view>
          
          <!-- 用户资料 -->
          <view class="user-detail" @tap="goUserProfile(user.id)">
            <text class="username">{{ user.nickname }}</text>
            <view class="user-bio">{{ user.bio || '这个人很懒，什么都没写~' }}</view>
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
      title: '用户粉丝',
      refreshing: false,
      loading: true,
      noMore: false,
      followers: [],
      pageNum: 1,
      pageSize: 20
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
        uni.getStorage({
          key: 'userInfo',
          success: (res) => {
            if (res.data && res.data.uid) {
              this.userId = res.data.uid;
            }
            this.loadFollowers();
          },
          fail: () => {
            // 没有找到用户信息，仍然使用self作为标识
            this.loadFollowers();
          }
        });
      } else {
        this.loadFollowers();
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
    
    // 加载粉丝列表
    loadFollowers() {
      // 显示加载状态
      this.loading = true;
      
      const params = {
        page: this.pageNum,
        limit: this.pageSize
      };
      
      api.users.getFollowers(this.userId, params)
        .then(res => {
          if (res.success) {
            const newFollowers = res.data.followers || [];
            
            if (this.pageNum === 1) {
              this.followers = newFollowers;
            } else {
              this.followers = [...this.followers, ...newFollowers];
            }
            
            // 判断是否还有更多数据
            this.noMore = newFollowers.length < this.pageSize;
          } else {
            uni.showToast({
              title: res.message || '加载粉丝失败',
              icon: 'none'
            });
          }
        })
        .catch(err => {
          console.error('加载粉丝列表失败:', err);
          uni.showToast({
            title: '加载粉丝列表失败，请稍后再试',
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
      this.loadFollowers();
    },
    
    // 加载更多
    loadMore() {
      if (this.loading || this.noMore) return;
      
      this.pageNum++;
      this.loadFollowers();
    },
    
    // 跳转到用户资料页
    goUserProfile(userId) {
      uni.navigateTo({
        url: `/pages/user-profile/user-profile?id=${userId}`
      });
    }
  }
}
</script>

<style>
.user-followers-container {
  min-height: 100vh;
  background-color: #f6f7fb;
  background-image: linear-gradient(to bottom, #f1f5fd, #f6f7fb);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow-x: hidden;
}

/* 顶部标题栏 */
.user-followers-container .header {
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

.user-followers-container .back-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transition: all 0.2s;
}

.back-icon-img {
  width: 24px;
  height: 24px;
}

.user-followers-container .title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 1);
}

.user-followers-container .right-space {
  width: 30px;
}

/* 用户列表 */
.user-followers-container .followers-list {
  height: calc(100vh - 44px);
  padding: 8px 0;
  box-sizing: border-box;
  width: 100%;
}

/* 用户卡片 */
.user-followers-container .user-list {
  padding: 0 8px 20px;
  box-sizing: border-box;
  width: 100%;
}

.user-followers-container .user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 8px;
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

.user-followers-container .user-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.user-followers-container .avatar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 8px;
  width: 48px;
  flex-shrink: 0;
}

.user-followers-container .avatar-wrapper {
  position: relative;
  margin-bottom: 6px;
}

.user-followers-container .avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background-color: #f1f1f1;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  border: 1px solid #fff;
}

.user-followers-container .new-follower {
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

.user-followers-container .user-detail {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-right: 5px;
}

.user-followers-container .username {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 5px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-followers-container .user-bio {
  font-size: 13px;
  color: #888888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 加载中动画 */
.user-followers-container .loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #888;
  font-size: 14px;
}

.user-followers-container .loading-spinner {
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
.user-followers-container .empty-state {
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

.user-followers-container .empty-icon {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  opacity: 0.8;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.user-followers-container .empty-text {
  font-size: 18px;
  font-weight: 600;
  color: #444;
  margin-bottom: 10px;
}

.user-followers-container .empty-tip {
  font-size: 14px;
  color: #888;
  margin-bottom: 30px;
  line-height: 1.6;
}

/* 加载更多提示 */
.user-followers-container .no-more {
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
.user-followers-container .iconfont {
  font-family: "iconfont" !important;
}

.user-followers-container .icon-back:before {
  content: "\e679";
}
</style> 