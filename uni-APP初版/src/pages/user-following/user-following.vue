<template>
  <view class="user-following-container">
    <!-- 顶部标题栏 -->
    <view class="header">
      <view class="back-btn" @tap="goBack">
        <image class="back-icon-img" src="../../static/icons/icon_ztc.png" mode="aspectFit"></image>
      </view>
      <text class="title">{{ title }}</text>
      <view class="right-space"></view>
    </view>
    
    <!-- 用户分类选项 -->
    <view class="category-tabs">
      <view 
        class="tab-item" 
        :class="{ active: activeTabIndex === 0 }"
        @tap="switchTab(0)"
      >
        <text>全部</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTabIndex === 1 }"
        @tap="switchTab(1)"
      >
        <text>好友</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTabIndex === 2 }"
        @tap="switchTab(2)"
      >
        <text>官方</text>
      </view>
    </view>
    
    <!-- 添加swiper实现左右滑动 -->
    <swiper 
      class="tab-content-swiper" 
      :current="activeTabIndex"
      @change="handleSwiperChange"
      :duration="300"
    >
      <!-- 全部 -->
      <swiper-item>
        <scroll-view 
          scroll-y 
          class="following-list"
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
          <view class="empty-state" v-if="following.length === 0 && !loading">
            <image class="empty-icon" src="/static/images/empty-data.png" mode="aspectFit"></image>
            <text class="empty-text">暂无关注</text>
            <text class="empty-tip">用户还没有关注其他人</text>
          </view>
          
          <!-- 关注列表 -->
          <view class="user-list">
            <view 
              class="user-card" 
              v-for="(user, index) in filteredFollowing" 
              :key="user.id"
              :style="{ animationDelay: index * 0.05 + 's' }"
              @tap="goUserProfile(user.id)"
            >
              <!-- 用户头像和徽章 -->
              <view class="avatar-column">
                <view class="avatar-wrapper">
                  <image class="avatar" :src="user.avatar" mode="aspectFill"></image>
                </view>
                <view class="user-badge" v-if="user.badge">{{user.badge}}</view>
              </view>
              
              <!-- 用户资料 -->
              <view class="user-detail">
                <text class="username">{{ user.nickname }}</text>
                <view class="user-bio">{{ user.bio || '这个人很懒，什么都没写~' }}</view>
                <view class="user-tag" v-if="isMutualFollow(user.id)">互相关注</view>
              </view>
            </view>
          </view>
          
          <!-- 加载更多提示 -->
          <view class="no-more" v-if="noMore && filteredFollowing.length > 0">
            <text>~ 没有更多内容了 ~</text>
          </view>
        </scroll-view>
      </swiper-item>
      
      <!-- 好友 -->
      <swiper-item>
        <scroll-view 
          scroll-y 
          class="following-list"
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
          <view class="empty-state" v-if="friendsFollowing.length === 0 && !loading">
            <image class="empty-icon" src="/static/images/empty-data.png" mode="aspectFit"></image>
            <text class="empty-text">暂无好友关注</text>
            <text class="empty-tip">互相关注的用户会在这里显示</text>
          </view>
          
          <!-- 关注列表 -->
          <view class="user-list">
            <view 
              class="user-card" 
              v-for="(user, index) in friendsFollowing" 
              :key="user.id"
              :style="{ animationDelay: index * 0.05 + 's' }"
              @tap="goUserProfile(user.id)"
            >
              <!-- 用户头像和徽章 -->
              <view class="avatar-column">
                <view class="avatar-wrapper">
                  <image class="avatar" :src="user.avatar" mode="aspectFill"></image>
                </view>
                <view class="user-badge" v-if="user.badge">{{user.badge}}</view>
              </view>
              
              <!-- 用户资料 -->
              <view class="user-detail">
                <text class="username">{{ user.nickname }}</text>
                <view class="user-bio">{{ user.bio || '这个人很懒，什么都没写~' }}</view>
                <view class="user-tag" v-if="user.type === 'friends'">互相关注</view>
              </view>
            </view>
          </view>
          
          <!-- 加载更多提示 -->
          <view class="no-more" v-if="noMore && friendsFollowing.length > 0">
            <text>~ 没有更多内容了 ~</text>
          </view>
        </scroll-view>
      </swiper-item>
      
      <!-- 官方 -->
      <swiper-item>
        <scroll-view 
          scroll-y 
          class="following-list"
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
          <view class="empty-state" v-if="officialFollowing.length === 0 && !loading">
            <image class="empty-icon" src="/static/images/empty-data.png" mode="aspectFit"></image>
            <text class="empty-text">暂无官方关注</text>
            <text class="empty-tip">关注官方账号，获取更多校园资讯</text>
          </view>
          
          <!-- 关注列表 -->
          <view class="user-list">
            <view 
              class="user-card" 
              v-for="(user, index) in officialFollowing" 
              :key="user.id"
              :style="{ animationDelay: index * 0.05 + 's' }"
              @tap="goUserProfile(user.id)"
            >
              <!-- 用户头像和徽章 -->
              <view class="avatar-column">
                <view class="avatar-wrapper">
                  <image class="avatar" :src="user.avatar" mode="aspectFill"></image>
                </view>
                <view class="user-badge" v-if="user.badge">{{user.badge}}</view>
              </view>
              
              <!-- 用户资料 -->
              <view class="user-detail">
                <text class="username">{{ user.nickname }}</text>
                <view class="user-bio">{{ user.bio || '这个人很懒，什么都没写~' }}</view>
                <view class="user-tag" v-if="user.type === 'friends'">互相关注</view>
              </view>
            </view>
          </view>
          
          <!-- 加载更多提示 -->
          <view class="no-more" v-if="noMore && officialFollowing.length > 0">
            <text>~ 没有更多内容了 ~</text>
          </view>
        </scroll-view>
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
      title: '关注列表',
      refreshing: false,
      loading: true,
      noMore: false,
      following: [],
      mutualFollows: [], // 互相关注的用户ID列表
      activeTabIndex: 0,
      pageNum: 1,
      pageSize: 20
    }
  },
  computed: {
    // 筛选好友（互相关注）
    friendsFollowing() {
      return this.following.filter(user => this.isMutualFollow(user.id));
    },
    
    // 筛选官方账号
    officialFollowing() {
      return this.following.filter(user => user.badge === '官方');
    },
    
    // 根据当前tab筛选显示的关注用户
    filteredFollowing() {
      return this.following;
    }
  },
  onLoad(options) {
    // 获取用户ID
    if (options.id) {
      this.userId = options.id;
      // 如果是查看自己的关注
      if (this.userId === 'self') {
        this.title = '我的关注';
        // 这里可以获取自己的用户ID
        uni.getStorage({
          key: 'userInfo',
          success: (res) => {
            if (res.data && res.data.uid) {
              this.userId = res.data.uid;
            }
            this.loadFollowing();
          },
          fail: () => {
            // 没有找到用户信息，仍然使用self作为标识
            this.loadFollowing();
          }
        });
      } else {
        this.loadFollowing();
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
    
    // 处理swiper切换
    handleSwiperChange(e) {
      this.activeTabIndex = e.detail.current;
    },
    
    // 点击切换选项卡
    switchTab(index) {
      this.activeTabIndex = index;
    },
    
    // 加载关注列表
    loadFollowing() {
      // 显示加载状态
      this.loading = true;
      
      const params = {
        page: this.pageNum,
        limit: this.pageSize
      };
      
      api.users.getFollowing(this.userId, params)
        .then(res => {
          if (res.success) {
            const newFollowing = res.data.following || [];
            
            if (this.pageNum === 1) {
              this.following = newFollowing;
              // 加载互相关注的用户列表
              this.loadMutualFollows();
            } else {
              this.following = [...this.following, ...newFollowing];
            }
            
            // 判断是否还有更多数据
            this.noMore = newFollowing.length < this.pageSize;
          } else {
            uni.showToast({
              title: res.message || '加载关注列表失败',
              icon: 'none'
            });
          }
        })
        .catch(err => {
          console.error('加载关注列表失败:', err);
          uni.showToast({
            title: '加载关注列表失败，请稍后再试',
            icon: 'none'
          });
        })
        .finally(() => {
          this.loading = false;
          this.refreshing = false;
        });
    },
    
    // 加载互相关注的用户
    loadMutualFollows() {
      // 只有已登录用户才需要加载互相关注信息
      if (store.getters.isLogin()) {
        const currentUser = store.getters.getUser();
        const currentUserId = currentUser ? currentUser.id : null;
        
        // 如果是查看自己的关注列表
        if (this.userId === currentUserId || this.userId === 'self') {
          // 获取互相关注的用户列表
          api.users.getMutualFollows()
            .then(res => {
              if (res.success) {
                this.mutualFollows = res.data.userIds || [];
              }
            })
            .catch(err => {
              console.error('获取互相关注失败:', err);
            });
        }
      }
    },
    
    // 判断是否互相关注
    isMutualFollow(userId) {
      return this.mutualFollows.includes(userId);
    },
    
    // 跳转到用户资料页
    goUserProfile(userId) {
      uni.navigateTo({
        url: `/pages/user-profile/user-profile?id=${userId}`
      });
    },
    
    // 刷新列表
    onRefresh() {
      this.refreshing = true;
      this.pageNum = 1;
      this.noMore = false;
      this.loadFollowing();
    },
    
    // 加载更多
    loadMore() {
      if (this.loading || this.noMore) return;
      
      this.pageNum++;
      this.loadFollowing();
    }
  }
}
</script>

<style>
.user-following-container {
  min-height: 100vh;
  background-color: #f6f7fb;
  background-image: linear-gradient(to bottom, #f1f5fd, #f6f7fb);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow-x: hidden;
}

/* 顶部标题栏 */
.user-following-container .header {
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

.user-following-container .back-btn {
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

.user-following-container .title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 1);
}

.user-following-container .right-space {
  width: 30px;
}

/* 用户列表 */
.user-following-container .following-list {
  height: calc(100vh - 44px - 50px); /* 减去标题栏和分类选项的高度 */
  padding: 8px 0;
  box-sizing: border-box;
  width: 100%;
}

/* 分类选项卡 */
.user-following-container .category-tabs {
  display: flex;
  background-color: #ffffff;
  border-radius: 12px;
  margin: 0 8px 10px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  position: relative;
  z-index: 10;
}

.user-following-container .tab-item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  color: #666;
  position: relative;
  border-radius: 8px;
  transition: all 0.3s;
}

.user-following-container .tab-item.active {
  color: #fff;
  background: linear-gradient(45deg, #3270c5, #4165db);
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(74, 144, 226, 0.2);
}

/* 用户卡片 */
.user-following-container .user-list {
  padding: 0 8px 20px;
  box-sizing: border-box;
  width: 100%;
}

.user-following-container .user-card {
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

.user-following-container .user-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.user-following-container .avatar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 8px;
  width: 48px;
  flex-shrink: 0;
  position: relative;
}

.user-following-container .avatar-wrapper {
  position: relative;
  margin-bottom: 6px;
}

.user-following-container .avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background-color: #f1f1f1;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  border: 1px solid #fff;
}

.user-following-container .user-badge {
  position: absolute;
  bottom: -5px;
  right: 0;
  font-size: 9px;
  background-color: #3270c5;
  color: white;
  padding: 1px 5px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(74, 144, 226, 0.2);
  white-space: nowrap;
}

.user-following-container .user-detail {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-right: 5px;
}

.user-following-container .username {
  font-size: 15px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 3px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-following-container .user-bio {
  font-size: 12px;
  color: #888888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 3px;
}

.user-following-container .user-tag {
  font-size: 10px;
  color: #4caf50;
  background-color: rgba(76, 175, 80, 0.08);
  padding: 2px 5px;
  border-radius: 8px;
  width: fit-content;
  border: 1px solid rgba(76, 175, 80, 0.15);
}

/* 加载中动画 */
.user-following-container .loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #888;
  font-size: 14px;
}

.user-following-container .loading-spinner {
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
.user-following-container .empty-state {
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

.user-following-container .empty-icon {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  opacity: 0.8;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.user-following-container .empty-text {
  font-size: 18px;
  font-weight: 600;
  color: #444;
  margin-bottom: 10px;
}

.user-following-container .empty-tip {
  font-size: 14px;
  color: #888;
  margin-bottom: 25px;
  line-height: 1.6;
}

/* 加载更多提示 */
.user-following-container .no-more {
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

/* Swiper样式 */
.user-following-container .tab-content-swiper {
  height: calc(100vh - 44px - 50px); /* 减去标题栏和分类选项的高度 */
  width: 100%;
}

/* 图标 */
.user-following-container .iconfont {
  font-family: "iconfont" !important;
}

.user-following-container .icon-back:before {
  content: "\e679";
}
</style> 