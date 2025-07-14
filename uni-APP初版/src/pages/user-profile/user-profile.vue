<template>
    <view class="profile-container">
      <!-- 加载状态指示器 -->
      <view class="loading-overlay" v-if="pageLoading">
        <view class="loading-spinner"></view>
      </view>
      
      <!-- 用户信息卡片 -->
      <view class="user-card">
        <view class="card-bg-pattern"></view>
        
        <!-- 添加返回按钮 -->
        <view class="back-btn" @tap="goBack">
          <image class="back-icon-img" src="../../static/icons/icon_ztc.png" mode="aspectFit"></image>
        </view>
        
        <!-- 头像和用户名部分 -->
        <view class="user-info">
          <view class="avatar-frame">
            <image class="avatar" :src="userInfo.avatar || 'https://img01.yzcdn.cn/vant/cat.jpeg'" mode="aspectFill"></image>
          </view>
          <view class="info-details">
            <view class="user-header">
              <view class="username">{{ userInfo.username || '加载中...' }}</view>
              <view class="user-badges" v-if="userInfo.badges && userInfo.badges.length">
                <view 
                  class="user-badge-item" 
                  v-for="badge in userInfo.badges" 
                  :key="badge.id"
                  :style="{'background-color': badge.color || '#4A90E2'}"
                >
                  {{ badge.name }}
                </view>
              </view>
              <view class="user-badge" v-if="userInfo.badge">{{ userInfo.badge }}</view>
            </view>
            <view class="user-id">ID: {{ userInfo.uid || '——' }}</view>
          </view>
        </view>
        
        <!-- 兴趣标签区域和操作按钮在同一行 -->
        <view class="tags-and-actions">
          <!-- 兴趣标签区域 -->
          <view class="user-tags-area" v-if="userInfo.tags && userInfo.tags.length > 0">
            <view class="tags-container">
              <view 
                class="user-tag" 
                v-for="(tag, index) in userInfo.tags" 
                :key="index"
                :style="{'background-color': tag.color || '#4A90E2'}"
              >
                {{ typeof tag === 'object' ? tag.name : tag }}
              </view>
            </view>
          </view>
          
          <!-- 操作按钮 - 与标签同行 -->
          <view class="user-actions">
            <view class="action-btn follow-btn" :class="{'followed-btn': userInfo.isFollowed}" @tap="toggleFollow">
              <text class="iconfont" :class="userInfo.isFollowed ? 'icon-check' : 'icon-add'"></text>
              <text>{{ userInfo.isFollowed ? '已关注' : '关注' }}</text>
            </view>
            <view class="action-btn share-profile" @tap="shareProfile">
              <text class="iconfont icon-share"></text>
              <text>分享主页</text>
            </view>
          </view>
        </view>
        
        <!-- 个人简介 -->
        <view class="user-bio">
          <text class="bio-text">{{ userInfo.bio || '这位用户很神秘，还没有填写个人简介~' }}</text>
        </view>
      </view>
      
      <!-- 用户数据统计 -->
      <view class="stats-container">
        <view class="stats-row">
          <view class="stat-item" @tap="navigateTo('posts')">
            <image class="stat-icon-img" src="/static/icons/wdtz.png" mode="aspectFit"></image>
            <view class="stat-num">{{ userInfo.postCount || 0 }}</view>
            <view class="stat-label">帖子</view>
          </view>
          <view class="stat-item non-clickable">
            <image class="stat-icon-img" src="/static/icons/hz.png" mode="aspectFit"></image>
            <view class="stat-num">{{ userInfo.likeCount || 0 }}</view>
            <view class="stat-label">获赞</view>
          </view>
          <view class="stat-item" @tap="navigateTo('followers')">
            <image class="stat-icon-img" src="/static/icons/fs.png" mode="aspectFit"></image>
            <view class="stat-num">{{ userInfo.followerCount || 0 }}</view>
            <view class="stat-label">粉丝</view>
          </view>
          <view class="stat-item" @tap="navigateTo('following')">
            <image class="stat-icon-img" src="/static/icons/gz.png" mode="aspectFit"></image>
            <view class="stat-num">{{ userInfo.followingCount || 0 }}</view>
            <view class="stat-label">关注</view>
          </view>
        </view>
      </view>
      
      <!-- 用户动态 -->
      <view class="dynamic-section">
        <view class="section-header">
          <text class="section-title">{{ userInfo.username || '用户' }}的动态</text>
          <view class="section-more" @tap="navigateTo('allPosts')">
            <text>查看全部</text>
            <image class="arrow-icon" src="/static/images/arrow-right.png" mode="aspectFit"></image>
          </view>
        </view>
        <view class="dynamic-gallery">
          <view class="empty-tip" v-if="userPosts.length === 0">
            <image class="empty-icon" src="/static/images/empty-data.png" mode="aspectFit"></image>
            <text>暂无动态内容</text>
          </view>
          <view 
            class="dynamic-item" 
            v-for="post in userPosts" 
            :key="post.id"
            @tap="viewPostDetail(post.id)"
          >
            <view class="dynamic-image-container">
              <image class="dynamic-image" :src="post.image" mode="aspectFill"></image>
            </view>
            <view class="dynamic-info">
              <view class="dynamic-title ellipsis">{{ post.title }}</view>
              <view class="dynamic-stats">
                <image class="stats-icon" src="/static/icons/hz.png" mode="aspectFit"></image>
                <text>{{ post.likes }}</text>
                <image class="stats-icon" src="/static/icons/pl.png" mode="aspectFit"></image>
                <text>{{ post.comments }}</text>
              </view>
            </view>
          </view>
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
        userId: '', // 要查看的用户ID
        userInfo: {
          uid: '',
          username: '',
          avatar: '',
          badge: '',
          bio: '',
          isFollowed: false,
          postCount: 0,
          likeCount: 0,
          followerCount: 0,
          followingCount: 0
        },
        userPosts: [],
        loading: false,
        isCurrentUser: false,
        pageLoading: false
      }
    },
    onLoad(options) {
      // 从路由参数获取用户ID
      if (options.id) {
        this.userId = options.id;
        // 检查是否是当前登录用户的个人主页
        const currentUser = store.getters.getUser();
        this.isCurrentUser = currentUser && currentUser.id === parseInt(this.userId);
        
        this.pageLoading = true;
        
        Promise.all([
          this.loadUserInfo(),
          this.loadUserPosts()
        ]).finally(() => {
          this.pageLoading = false;
        });
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
    onShow() {
      // 如果已经获取了用户ID，则每次显示页面时重新加载数据
      if (this.userId) {
        console.log('用户主页重新显示，刷新数据:', this.userId);
        
        // 显示加载状态
        this.pageLoading = true;
        
        // 重置部分状态，确保重新渲染
        this.userInfo = { 
          ...this.userInfo, 
          avatar: '',  // 清空头像URL强制重新加载
          postCount: 0, 
          likeCount: 0, 
          followerCount: 0, 
          followingCount: 0 
        };
        
        // 使用Promise.all确保所有数据都加载完毕
        Promise.all([
          this.loadUserInfo(),
          this.loadUserPosts()
        ]).finally(() => {
          this.pageLoading = false;
          
          // 强制DOM更新后再次触发渲染
          setTimeout(() => {
            this.$forceUpdate();
          }, 50);
          
          // 确保所有图片和样式都重新加载
          setTimeout(() => {
            this.$forceUpdate();
          }, 300);
        });
      }
    },
    methods: {
      // 返回上一页
      goBack() {
        uni.navigateBack();
      },
      
      // 加载用户信息
      loadUserInfo() {
        uni.showLoading({
          title: '加载中...',
          mask: true
        });
        
        return api.users.getProfile(this.userId)
          .then(res => {
            if (res.success) {
              this.userInfo = res.data;
              
              // 处理标签数据
              if (this.userInfo.tags) {
                // 如果是字符串，尝试解析
                if (typeof this.userInfo.tags === 'string') {
                  try {
                    this.userInfo.tags = JSON.parse(this.userInfo.tags);
                    console.log('成功解析tags字符串:', this.userInfo.tags);
                  } catch (error) {
                    console.error('解析tags字符串失败:', error);
                    this.userInfo.tags = [];
                  }
                } 
                // 如果已经是数组，确保每个元素都是对象
                else if (Array.isArray(this.userInfo.tags)) {
                  this.userInfo.tags = this.userInfo.tags.map(tag => {
                    if (typeof tag === 'string') {
                      return { id: tag, name: tag, color: '#4A90E2' };
                    }
                    return tag;
                  });
                  console.log('处理后的用户标签:', this.userInfo.tags);
                }
              } else {
                console.log('用户数据中没有tags字段');
                this.userInfo.tags = [];
              }
              
              // 获取用户标签
              return api.users.getBadges(this.userId).then(badgesRes => {
                if (badgesRes.success && badgesRes.data) {
                  console.log('获取用户标签成功:', badgesRes.data);
                  this.userInfo.badges = badgesRes.data;
                }
                return res.data;
              }).catch(err => {
                console.error('获取用户标签失败:', err);
                // 继续处理，不阻止后续操作
                return res.data;
              });
              
              // 如果是当前用户，更新缓存的用户信息
              if (this.isCurrentUser) {
                store.mutations.setUser(res.data);
              }
              
              // 如果不是当前用户，检查是否已关注
              if (!this.isCurrentUser && store.getters.isLogin()) {
                this.checkFollowStatus();
              }
              
              return res.data;
            } else {
              uni.showToast({
                title: res.message || '加载用户信息失败',
                icon: 'none'
              });
              return Promise.reject(new Error(res.message || '加载用户信息失败'));
            }
          })
          .catch(err => {
            console.error('加载用户信息失败:', err);
            uni.showToast({
              title: '加载用户信息失败，请稍后再试',
              icon: 'none'
            });
            return Promise.reject(err);
          })
          .finally(() => {
            uni.hideLoading();
          });
      },
      
      // 检查是否已关注该用户
      checkFollowStatus() {
        api.users.checkFollow(this.userId)
          .then(res => {
            if (res.success) {
              this.userInfo.isFollowed = res.data.isFollowing;
            }
          })
          .catch(err => {
            console.error('检查关注状态失败:', err);
          });
      },
      
      // 加载用户动态
      loadUserPosts() {
        if (this.loading) return Promise.resolve([]);
        
        this.loading = true;
        
        const params = {
          userId: this.userId,
          page: 1,
          limit: 4  // 只加载最新的4条动态
        };
        
        return api.users.getUserPosts(params)
          .then(res => {
            if (res.success) {
              this.userPosts = res.data.posts;
              return res.data.posts;
            } else {
              uni.showToast({
                title: res.message || '加载用户动态失败',
                icon: 'none'
              });
              return Promise.reject(new Error(res.message || '加载用户动态失败'));
            }
          })
          .catch(err => {
            console.error('加载用户动态失败:', err);
            uni.showToast({
              title: '加载用户动态失败，请稍后再试',
              icon: 'none'
            });
            return Promise.reject(err);
          })
          .finally(() => {
            this.loading = false;
          });
      },
      
      // 关注/取消关注
      toggleFollow() {
        // 检查是否已登录
        if (!store.getters.isLogin()) {
          uni.navigateTo({
            url: '/pages/login/login'
          });
          return;
        }
        
        // 不能关注自己
        if (this.isCurrentUser) {
          uni.showToast({
            title: '不能关注自己',
            icon: 'none'
          });
          return;
        }
        
        uni.showLoading({
          title: this.userInfo.isFollowed ? '取消关注中...' : '关注中...',
          mask: true
        });
        
        const action = this.userInfo.isFollowed ? 
          api.users.unfollow(this.userId) : 
          api.users.follow(this.userId);
        
        action.then(res => {
          if (res.success) {
            this.userInfo.isFollowed = !this.userInfo.isFollowed;
            
            // 更新粉丝数量
            if (this.userInfo.isFollowed) {
              this.userInfo.followerCount++;
            } else {
              this.userInfo.followerCount = Math.max(0, this.userInfo.followerCount - 1);
            }
            
            uni.showToast({
              title: this.userInfo.isFollowed ? '关注成功' : '已取消关注',
              icon: 'success'
            });
          } else {
            uni.showToast({
              title: res.message || (this.userInfo.isFollowed ? '取消关注失败' : '关注失败'),
              icon: 'none'
            });
          }
        })
        .catch(err => {
          console.error(this.userInfo.isFollowed ? '取消关注失败:' : '关注失败:', err);
          uni.showToast({
            title: (this.userInfo.isFollowed ? '取消关注' : '关注') + '失败，请稍后再试',
            icon: 'none'
          });
        })
        .finally(() => {
          uni.hideLoading();
        });
      },
      
      // 分享用户主页
      shareProfile() {
        uni.showActionSheet({
          itemList: ['分享给好友', '复制链接', '生成二维码'],
          success: (res) => {
            if (res.tapIndex === 1) {
              // 复制链接
              const link = `https://campus-wall.example.com/user/${this.userId}`;
              uni.setClipboardData({
                data: link,
                success: () => {
                  uni.showToast({
                    title: '链接已复制',
                    icon: 'success'
                  });
                }
              });
            } else {
              uni.showToast({
                title: '功能开发中',
                icon: 'none'
              });
            }
          }
        });
      },
      
      // 查看帖子详情
      viewPostDetail(postId) {
        uni.navigateTo({
          url: `/pages/post-detail/post-detail?id=${postId}`
        });
      },
      
      // 检查登录状态
      checkLoginStatus() {
        if (!store.getters.isLogin()) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          });
          setTimeout(() => {
            uni.navigateTo({
              url: '/pages/login/login'
            });
          }, 1500);
          return false;
        }
        return true;
      },
      
      // 导航到不同页面
      navigateTo(type) {
        switch (type) {
          case 'posts':
            uni.navigateTo({
              url: `/pages/user-posts/user-posts?id=${this.userId}`
            });
            break;
          case 'followers':
            uni.navigateTo({
              url: `/pages/user-followers/user-followers?id=${this.userId}`
            });
            break;
          case 'following':
            uni.navigateTo({
              url: `/pages/user-following/user-following?id=${this.userId}`
            });
            break;
          case 'allPosts':
            uni.navigateTo({
              url: `/pages/user-posts/user-posts?id=${this.userId}`
            });
            break;
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .profile-container {
    min-height: 100vh;
    background-color: #F7F9FC;
    padding-bottom: calc(30px + var(--window-bottom));
  }
  
  /* 用户信息卡片 */
  .user-card {
    position: relative;
    background: linear-gradient(135deg, #4A90E2, #5476FF);
    padding: 12px 20px 12px;
    color: #FFFFFF;
    border-radius: 0 0 30px 30px;
    margin-bottom: 20px;
    box-shadow: 0 10px 25px rgba(74, 144, 226, 0.25);
    overflow: hidden;
  }
  
  /* 返回按钮样式 */
  .back-btn {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 5;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.25);
    border-radius: 50%;
    transition: all 0.2s;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
  
  .back-btn:active {
    background-color: rgba(255, 255, 255, 0.3);
    transform: scale(0.95);
  }
  
  .back-btn .iconfont {
    font-size: 24px;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  
  .back-icon-img {
    width: 24px;
    height: 24px;
  }
  
  .card-bg-pattern {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 25%),
      radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 20%),
      linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%);
    background-size: auto, auto, 20px 20px, 20px 20px;
    opacity: 0.6;
    z-index: 0;
  }
  
  .user-info {
    position: relative;
    display: flex;
    align-items: center;
    z-index: 1;
    margin-bottom: 6px;
  }
  
  .avatar-frame {
    position: relative;
    width: 80px;
    height: 80px;
    margin-right: 15px;
  }
  
  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  }
  
  .info-details {
    flex: 1;
  }
  
  .user-header {
    display: flex;
    align-items: center;
    margin-bottom: 2px;
  }
  
  .username {
    font-size: 24px;
    font-weight: 600;
    margin-right: 10px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }
  
  .user-id {
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 3px;
  }
  
  .user-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-left: 8px;
    margin-right: 8px;
  }
  
  .user-badge-item {
    font-size: 10px;
    padding: 2px 10px;
    color: white;
    border-radius: 10px;
    margin: 0 2px;
    background-color: rgba(74, 144, 226, 0.45);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
    font-weight: 500;
    height: 20px;
    backdrop-filter: blur(2px);
    border: 1px solid rgba(255, 255, 255, 0.25);
  }
  
  .user-badge {
    display: inline-block;
    font-size: 12px;
    background-color: rgba(255, 255, 255, 0.25);
    padding: 3px 10px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.4);
  }
  
  /* 个人简介样式 */
  .user-bio {
    position: relative;
    margin: 5px 0 0;
    padding: 8px 12px;
    background-color: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 1;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .bio-text {
    font-size: 13px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.95);
    display: block;
    word-break: break-word;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* 限制最多显示2行 */
    -webkit-box-orient: vertical;
  }
  
  .tags-and-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 1;
    padding: 0 6px;
    margin-bottom: 8px;
  }
  
  .user-tags-area {
    flex: 1;
    padding: 4px 0 6px;
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: flex-start;
  }
  
  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: flex-start;
    max-width: 100%;
  }
  
  .user-actions {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    z-index: 10;
    position: relative;
    align-items: flex-end;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.25);
    padding: 4px 10px;
    border-radius: 20px;
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    transition: all 0.3s;
    font-size: 12px;
  }
  
  .action-btn:active {
    transform: translateY(2px);
    background-color: rgba(255, 255, 255, 0.3);
  }
  
  .follow-btn {
    background-color: rgba(255, 255, 255, 0.25);
    padding: 4px 15px;
  }
  
  .followed-btn {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.25);
  }
  
  .action-btn .iconfont {
    font-size: 12px;
    margin-right: 5px;
  }
  
  /* 数据统计区域 */
  .stats-container {
    margin: -25px 15px 25px;
    position: relative;
    z-index: 2;
  }
  
  .stats-row {
    background-color: #FFFFFF;
    border-radius: 18px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.06);
    padding: 18px 10px;
    display: flex;
  }
  
  .stat-item {
    flex: 1;
    text-align: center;
    position: relative;
    padding: 0 5px;
  }
  
  .stat-item:not(:last-child):after {
    content: '';
    position: absolute;
    right: 0;
    top: 15%;
    height: 70%;
    width: 1px;
    background: linear-gradient(to bottom, transparent, #E8EEF7, transparent);
  }
  
  .stat-icon-img {
    width: 24px;
    height: 24px;
    margin-bottom: 6px;
    display: inline-block;
  }
  
  .stat-num {
    font-size: 20px;
    font-weight: 600;
    color: #333333;
    margin-bottom: 3px;
  }
  
  .stat-label {
    font-size: 13px;
    color: #8E9AAA;
  }
  
  .non-clickable {
    pointer-events: none;
  }
  
  /* 动态部分 */
  .dynamic-section {
    margin: 0 15px 25px;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
    position: relative;
    padding-left: 12px;
  }
  
  .section-title:before {
    content: '';
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 4px;
    background: linear-gradient(to bottom, #4A90E2, #5476FF);
    border-radius: 2px;
  }
  
  .section-more {
    font-size: 14px;
    color: var(--text-color-secondary);
    display: flex;
    align-items: center;
  }
  
  .section-more .iconfont {
    font-size: 12px;
    margin-left: 2px;
  }
  
  .dynamic-gallery {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 5px 0;
  }
  
  .empty-tip {
    grid-column: span 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 0;
  }
  
  .empty-icon {
    width: 80px;
    height: 80px;
    margin-bottom: 15px;
    opacity: 0.6;
  }
  
  .empty-tip text {
    font-size: 14px;
    color: var(--text-color-secondary);
  }
  
  .dynamic-item {
    background-color: #FFFFFF;
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.04);
    transition: all 0.3s;
  }
  
  .dynamic-item:active {
    transform: translateY(2px);
    box-shadow: 0 2px 5px rgba(74, 144, 226, 0.05);
  }
  
  .dynamic-image-container {
    position: relative;
    width: 100%;
    padding-bottom: 65%;
    overflow: hidden;
  }
  
  .dynamic-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--border-radius) var(--border-radius) 0 0;
    transition: transform 0.3s;
  }
  
  .dynamic-item:active .dynamic-image {
    transform: scale(1.05);
  }
  
  .dynamic-info {
    padding: 12px;
  }
  
  .dynamic-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 10px;
    color: var(--text-color);
    line-height: 1.4;
  }
  
  .dynamic-stats {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: var(--text-color-secondary);
  }
  
  .stats-icon {
    width: 16px;
    height: 16px;
    margin-right: 3px;
  }
  
  .dynamic-stats text {
    margin-right: 8px;
  }
  
  /* 图标 */
  .iconfont {
    font-family: "iconfont" !important;
  }
  
  .arrow-icon {
    width: 16px;
    height: 16px;
    margin-left: 2px;
  }
  
  .icon-share:before {
    content: "\e67e";
  }
  
  .icon-add:before {
    content: "\e6df";
  }
  
  .icon-check:before {
    content: "\e645";
  }
  
  .icon-back:before {
    content: "\e679";
  }
  
  /* 加载状态指示器样式 */
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
  }
  
  .loading-spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-top: 4px solid #4A90E2;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .user-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 8px;
    margin: 1px 0;
    border-radius: 10px;
    font-size: 10px;
    color: #FFFFFF;
    background-color: rgba(255, 255, 255, 0.25);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    font-weight: 500;
    text-align: center;
    min-width: 0;
    height: 18px;
    max-width: fit-content;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
  }
  </style>