<template>
  <view class="profile-container">
    <!-- 未登录状态 -->
    <view class="not-login-container" v-if="!isLogin">
      <view class="not-login-card">
        <image class="not-login-image" :src="getImage('/static/images/not-login.png')" mode="aspectFit"></image>
        <view class="not-login-text">登录后查看您的个人信息</view>
        <button class="login-now-btn" @tap="goToLogin">立即登录</button>
      </view>
    </view>

    <!-- 已登录状态 -->
    <block v-else>
      <!-- 用户信息卡片 -->
      <view class="user-card">
        <view class="card-bg-pattern"></view>
        
        <!-- 头像和用户名部分 -->
        <view class="user-info">
          <view class="avatar-frame">
            <image class="avatar" :src="avatarUrl" mode="aspectFill"></image>
          </view>
          <view class="info-details">
            <view class="user-header">
              <view class="username">{{ userInfo.nickname || '用户' }}</view>
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
              <view class="user-badge">{{ userInfo.role === 'admin' ? '管理员' : '用户' }}</view>
            </view>
            <view class="user-id">ID: {{ userInfo.id || '未知' }}</view>
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
            <view class="action-btn edit-profile" @tap="editProfile">
              <text>编辑资料</text>
            </view>
            <view class="action-btn share-profile" @tap="shareProfile">
              <text>分享主页</text>
            </view>
          </view>
        </view>
        
        <!-- 个人简介 -->
        <view class="user-bio">
          <text class="bio-text">{{ userInfo.bio || '这个人很懒，还没有填写个人简介~' }}</text>
        </view>
      </view>
      
      <!-- 用户数据统计 -->
      <view class="stats-container">
        <view class="stats-row">
          <view class="stat-item" @tap="navigateTo('posts')">
            <image class="stat-icon-img" :src="getImage('/static/icons/wdtz.png')" mode="aspectFit"></image>
            <view class="stat-num">{{ stats.posts || 0 }}</view>
            <view class="stat-label">帖子</view>
          </view>
          <view class="stat-item non-clickable">
            <image class="stat-icon-img" :src="getImage('/static/icons/hz.png')" mode="aspectFit"></image>
            <view class="stat-num">{{ stats.likes || 0 }}</view>
            <view class="stat-label">获赞</view>
          </view>
          <view class="stat-item" @tap="navigateTo('followers')">
            <image class="stat-icon-img" :src="getImage('/static/icons/fs.png')" mode="aspectFit"></image>
            <view class="stat-num">{{ stats.followers || 0 }}</view>
            <view class="stat-label">粉丝</view>
          </view>
          <view class="stat-item" @tap="navigateTo('following')">
            <image class="stat-icon-img" :src="getImage('/static/icons/gz.png')" mode="aspectFit"></image>
            <view class="stat-num">{{ stats.following || 0 }}</view>
            <view class="stat-label">关注</view>
          </view>
        </view>
      </view>
      
      <!-- 我的动态 -->
      <view class="dynamic-section">
        <view class="section-header">
          <text class="section-title">我的动态</text>
          <view class="section-more" @tap="navigateTo('allPosts')">
            <text>查看全部</text>
            <image class="arrow-icon" :src="getImage('/static/images/arrow-right.png')" mode="aspectFit"></image>
          </view>
        </view>
        <view class="dynamic-gallery">
          <view 
            class="dynamic-item" 
            v-for="post in userPosts" 
            :key="post.id"
            @tap="viewPostDetail(post.id)"
          >
            <!-- 图片容器，只在有图片时显示 -->
            <view class="dynamic-image-container" v-if="post.imageUrl">
              <image 
                class="dynamic-image" 
                :src="post.imageUrl" 
                mode="aspectFill"
              ></image>
            </view>
            
            <!-- 内容区域 -->
            <view class="dynamic-content" :class="{'no-image': !post.imageUrl}">
              <!-- 标题内容 -->
              <view class="dynamic-title ellipsis">{{ post.content }}</view>
              
              <!-- 统计信息，固定在底部 -->
              <view class="dynamic-footer">
                <view class="dynamic-stats">
                  <image class="stats-icon" :src="getImage('/static/icons/hz.png')" mode="aspectFit"></image>
                  <text>{{ post.likes }}</text>
                  <image class="stats-icon" :src="getImage('/static/icons/pl.png')" mode="aspectFit"></image>
                  <text>{{ post.comments }}</text>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 没有帖子时显示 -->
          <view class="no-data" v-if="userPosts.length === 0">
            <text>还没有发布任何帖子~</text>
          </view>
        </view>
      </view>
      
      <!-- 功能列表 -->
      <view class="menu-section">
        <view class="section-header">
          <text class="section-title">收藏</text>
        </view>
        <view class="menu-list">
          <view class="menu-item" @tap="navigateTo('favorites')">
            <view class="menu-item-left">
              <view class="menu-icon-box">
                <image class="menu-icon-img" :src="getImage('/static/images/wdsc.png')" mode="aspectFit"></image>
              </view>
              <text>我的收藏</text>
            </view>
            <view class="menu-item-right">
              <text class="menu-item-count">{{ stats.collections || 0 }}</text>
              <image class="arrow-icon" :src="getImage('/static/images/arrow-right.png')" mode="aspectFit"></image>
            </view>
          </view>
        </view>
      </view>
    </block>
    
    <!-- 登录/未登录状态都显示的内容 -->
    <view class="menu-section">
      <view class="section-header">
        <text class="section-title">设置与服务</text>
      </view>
      <view class="menu-list">
        <view class="menu-item" @tap="navigateTo('settings')">
          <view class="menu-item-left">
            <view class="menu-icon-box">
              <image class="menu-icon-img" :src="getImage('/static/images/sz.png')" mode="aspectFit"></image>
            </view>
            <text>设置</text>
          </view>
          <image class="arrow-icon" :src="getImage('/static/images/arrow-right.png')" mode="aspectFit"></image>
        </view>
      </view>
    </view>
    
    <!-- 版本信息 -->
    <view class="version-info">
      <text>校园墙 v1.0.0</text>
    </view>
  </view>
</template>

<script>
import api from '../../utils/api.js';
import store from '../../utils/store.js';
import config from '../../utils/config.js';
import { getImage } from '../../utils/imagePathHelper';

export default {
  data() {
    return {
      isLogin: false,
      userInfo: {},
      stats: {
        posts: 0,
        likes: 0,
        followers: 0,
        following: 0,
        collections: 0
      },
      userPosts: [],
      isLoading: false,
      config
    }
  },
  computed: {
    avatarUrl() {
      if (!this.userInfo.avatar) {
        // 使用默认头像
        return this.config.DEFAULT_AVATAR;
      }
      
      if (this.userInfo.avatar.startsWith('http')) {
        // 如果是完整URL，直接返回
        return this.userInfo.avatar;
      }
      
      // 添加基础URL
      return this.config.AVATAR_BASE_URL + this.userInfo.avatar;
    }
  },
  onShow() {
    console.log('profile页面显示');
    
    // 每次进入页面都检查登录状态
    this.checkLoginStatus();
    
    // 如果已登录，获取用户信息和统计数据
    if (this.isLogin) {
      // 设置短延迟，确保token和登录状态完全加载
      setTimeout(() => {
        console.log('延迟加载用户数据，当前登录状态:', this.isLogin);
        this.loadUserData();
      }, 500);
    } else {
      // 检查是否有token但未登录
      const token = uni.getStorageSync('token');
      if (token) {
        console.log('有token但store中未登录，尝试延迟检查');
        
        // 延迟执行，确保App.vue中的用户信息加载完成
        setTimeout(() => {
          console.log('延迟检查执行，重新检查登录状态');
          this.checkLoginStatus();
          if (this.isLogin) {
            console.log('延迟后确认已登录，加载用户数据');
            this.loadUserData();
          }
        }, 1500); // 更长的延迟时间确保token验证完成
      }
    }
  },
  methods: {
    // 添加getImage方法
    getImage,
    
    // 检查登录状态
    checkLoginStatus() {
      const token = uni.getStorageSync('token');
      console.log('检查登录状态, token是否存在:', !!token);
      
      if (token) {
        this.isLogin = true;
        // 从store获取已缓存的用户信息
        const userData = store.getters.getUser();
        if (userData) {
          console.log('从store获取到用户信息:', userData.id, userData.nickname);
          this.userInfo = userData;
        } else {
          console.log('store中无用户信息');
        }
      } else {
        this.isLogin = false;
        this.userInfo = {};
        console.log('未登录，清空用户信息');
      }
    },
    
    // 加载用户数据
    loadUserData() {
      console.log('开始加载用户数据');
      this.isLoading = true;
      
      // 获取用户信息
      api.auth.getInfo()
        .then(res => {
          console.log('获取用户信息成功:', res);
          if (res.success && res.data) {
            // 修改这里，确保同时支持res.data和res.data.user格式
            this.userInfo = res.data.user || res.data;
            console.log('用户信息已设置:', this.userInfo);
            
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
            
            // 更新store中的用户信息
            store.mutations.setUser(this.userInfo);
            
            // 使用当前登录用户ID获取统计信息和帖子
            const userId = this.userInfo.id;
            if (!userId) {
              console.error('获取用户信息失败: 用户ID不见');
              throw new Error('获取用户信息失败: 用户ID不见');
            }
            console.log('使用登录用户ID加载数据:', userId);
            
            // 获取用户标签
            return Promise.all([
              api.users.getBadges(userId).then(badgesRes => {
                if (badgesRes.success && badgesRes.data) {
                  console.log('获取用户标签成功:', badgesRes.data);
                  this.userInfo.badges = badgesRes.data;
                }
                return badgesRes;
              }).catch(err => {
                console.error('获取用户标签失败:', err);
                // 不阻止后续操作
                return null;
              }),
              // 获取用户帖子数据和统计信息
              this.loadUserStats(userId)
            ]);
          } else {
            throw new Error('获取用户信息失败');
          }
        })
        .then(() => {
          // 获取用户最近的帖子
          return this.loadUserPosts(this.userInfo.id);
        })
        .catch(err => {
          console.error('获取用户数据失败:', err);
          uni.showToast({
            title: '获取用户数据失败',
            icon: 'none'
          });
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    
    // 加载用户统计数据
    loadUserStats(userId) {
      if (!userId) return Promise.reject('用户ID无效');
      
      console.log('开始加载用户统计数据:', userId);
      
      // 这里假设后端有一个获取用户统计数据的接口
      // 如果没有这样的接口，可以分别调用各个接口获取数据
      return Promise.all([
        // 获取用户帖子数
        api.posts.getList({ userId, page: 1, limit: 1, countOnly: true })
          .then(res => {
            console.log('获取用户帖子数结果:', res);
            if (res.data && res.data.pagination) {
              this.stats.posts = res.data.pagination.total || 0;
            }
          })
          .catch(err => {
            console.error('获取用户帖子数失败:', err);
          }),
          
        // 获取粉丝数
        api.users.getFollowers(userId, { page: 1, limit: 1, countOnly: true })
          .then(res => {
            console.log('获取用户粉丝数结果:', res);
            if (res.data && res.data.pagination) {
              this.stats.followers = res.data.pagination.total || 0;
            } else if (res.total) {
              this.stats.followers = res.total;
            }
          })
          .catch(err => {
            console.error('获取用户粉丝数失败:', err);
          }),
          
        // 获取关注数
        api.users.getFollowing(userId, { page: 1, limit: 1, countOnly: true })
          .then(res => {
            console.log('获取用户关注数结果:', res);
            if (res.data && res.data.pagination) {
              this.stats.following = res.data.pagination.total || 0;
            } else if (res.total) {
              this.stats.following = res.total;
            }
          })
          .catch(err => {
            console.error('获取用户关注数失败:', err);
          }),
          
        // 获取收藏数
        api.users.getCollections(userId, { page: 1, limit: 1, countOnly: true })
          .then(res => {
            console.log('获取用户收藏数结果:', res);
            if (res.data && res.data.pagination) {
              this.stats.collections = res.data.pagination.total || 0;
            } else if (res.total) {
              this.stats.collections = res.total;
            }
          })
          .catch(err => {
            console.error('获取用户收藏数失败:', err);
          }),
          
        // 获取总获赞数 - 使用递归函数获取所有帖子的点赞数
        this.fetchAllUserLikes(userId)
          .then(totalLikes => {
            this.stats.likes = totalLikes;
            console.log('用户总获赞数计算完成:', totalLikes);
          })
          .catch(err => {
            console.error('获取用户帖子获赞数据失败:', err);
          })
      ]).catch(err => {
        console.error('获取统计数据失败:', err);
      });
    },
    
    // 新增方法：递归获取所有帖子的获赞数
    async fetchAllUserLikes(userId) {
      console.log('开始获取用户所有帖子的获赞数...');
      
      // 首先获取用户的总帖子数
      try {
        const countResult = await api.posts.getList({ 
          userId, 
          page: 1, 
          limit: 1, 
          countOnly: true 
        });
        
        if (!countResult.success || !countResult.data || !countResult.data.pagination) {
          console.error('获取用户帖子总数失败');
          return 0;
        }
        
        const totalPosts = countResult.data.pagination.total;
        console.log(`用户总共有 ${totalPosts} 篇帖子，开始计算总获赞数`);
        
        if (totalPosts === 0) {
          return 0;
        }
        
        // 计算需要的页数，每页获取最多50篇帖子
        const pageSize = 50;
        const totalPages = Math.ceil(totalPosts / pageSize);
        
        let allLikes = 0;
        
        // 使用循环代替递归，避免递归太深
        for (let page = 1; page <= totalPages; page++) {
          console.log(`获取第 ${page}/${totalPages} 页帖子的获赞数...`);
          
          const postsResult = await api.posts.getList({
            userId,
            page,
            limit: pageSize,
            sort: 'latest',
            stats: true
          });
          
          if (postsResult.success && postsResult.data && postsResult.data.posts) {
            // 如果服务器直接返回了总获赞数，使用它
            if (postsResult.data.totalLikes !== undefined && page === 1) {
              console.log('服务器直接返回了总获赞数:', postsResult.data.totalLikes);
              return postsResult.data.totalLikes;
            }
            
            // 计算这一页帖子的获赞数
            const pageLikes = postsResult.data.posts.reduce((sum, post) => {
              const postLikes = parseInt(post.likes || 0);
              return sum + (isNaN(postLikes) ? 0 : postLikes);
            }, 0);
            
            allLikes += pageLikes;
            console.log(`第 ${page} 页帖子获赞数: ${pageLikes}, 累计: ${allLikes}`);
          } else {
            console.error(`获取第 ${page} 页帖子失败`);
          }
        }
        
        console.log(`所有帖子获赞数计算完成，总计: ${allLikes}`);
        return allLikes;
      } catch (error) {
        console.error('获取用户所有帖子获赞数出错:', error);
        return 0;
      }
    },
    
    // 加载用户帖子
    loadUserPosts(userId) {
      if (!userId) return Promise.reject('用户ID无效');
      
      console.log('开始加载用户帖子:', userId);
      
      return api.posts.getList({ 
        userId, 
        page: 1, 
        limit: 2,
        sort: 'latest'
      })
        .then(res => {
          console.log('获取用户帖子结果:', res);
          if (res.success && res.data && res.data.posts) {
            this.userPosts = res.data.posts.map(post => {
              // 如果有图片，获取第一张作为预览
              let imageUrl = '';
              if (post.images && post.images.length > 0) {
                // 尝试解析图片数组
                try {
                  const images = typeof post.images === 'string' ? JSON.parse(post.images) : post.images;
                  if (Array.isArray(images) && images.length > 0) {
                    imageUrl = images[0];
                  }
                } catch (e) {
                  console.error('解析帖子图片失败:', e);
                  // 如果解析失败，尝试直接使用images，假设它可能是一个字符串URL
                  if (typeof post.images === 'string' && post.images.startsWith('http')) {
                    imageUrl = post.images;
                  }
                }
              }
              
              // 获取帖子点赞总数
              const likes = post.likes || 0;
              
              return {
                id: post.id,
                content: post.content,
                imageUrl,
                likes,
                comments: post.comments || 0
              };
            });
            
            console.log('处理后的用户帖子:', this.userPosts);
            
            // 注意：不再在这里更新获赞总数，已经在loadUserStats中处理
          } else {
            this.userPosts = [];
            console.log('未获取到用户帖子或格式不正确');
          }
        })
        .catch(err => {
          console.error('获取用户帖子失败:', err);
          this.userPosts = [];
        });
    },
    
    // 计算用户获赞总数
    calculateTotalLikes(posts) {
      if (!posts || !posts.length) {
        console.log('没有帖子数据，获赞数设为0');
        this.stats.likes = 0;
        return;
      }
      
      let totalLikes = 0;
      posts.forEach(post => {
        const postLikes = parseInt(post.likes || 0);
        if (!isNaN(postLikes)) {
          totalLikes += postLikes;
        }
      });
      
      console.log('计算用户总获赞数:', totalLikes, '来自', posts.length, '篇帖子');
      this.stats.likes = totalLikes;
    },

    // 跳转到登录页面
    goToLogin() {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    },
    
    // 编辑个人资料
    editProfile() {
      uni.navigateTo({
        url: '/pages/edit-profile/edit-profile'
      });
    },
    
    // 分享个人主页
    shareProfile() {
      uni.showShareMenu({
        withShareTicket: true
      });
    },
    
    // 页面导航
    navigateTo(page) {
      // 如果未登录且访问需要登录的页面，先跳转到登录页
      const needLoginPages = ['posts', 'followers', 'following', 'favorites', 'allPosts'];
      if (!this.isLogin && needLoginPages.includes(page)) {
        uni.showToast({
          title: '请先登录',
          icon: 'none',
          duration: 2000
        });
        setTimeout(() => {
          this.goToLogin();
        }, 1500);
        return;
      }
      
      const pageMap = {
        posts: '/pages/profile-posts/profile-posts',
        likes: '/pages/profile-posts/profile-posts?type=likes',
        followers: '/pages/followers/followers',
        following: '/pages/following/following',
        favorites: '/pages/favorites/favorites',
        settings: '/pages/settings/settings',
        feedback: '/pages/feedback/feedback',
        allPosts: '/pages/profile-posts/profile-posts'
      };
      
      if (pageMap[page]) {
        uni.navigateTo({
          url: pageMap[page]
        });
      } else {
        uni.showToast({
          title: `${page}功能开发中`,
          icon: 'none'
        });
      }
    },

    // 添加新的方法来处理帖子详情
    viewPostDetail(postId) {
      // 跳转到帖子详情页
      uni.navigateTo({
        url: `/pages/post-detail/post-detail?id=${postId}`
      });
    }
  }
}
</script>

<style>
.profile-container {
  min-height: 100vh;
  background-color: var(--secondary-color);
  padding-bottom: calc(30px + var(--window-bottom));
}

/* 未登录状态样式 */
.not-login-container {
  padding: 40px 20px;
}

.not-login-card {
  background-color: #FFFFFF;
  border-radius: var(--border-radius);
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: var(--card-shadow);
}

.not-login-image {
  width: 150px;
  height: 150px;
  margin-bottom: 20px;
}

.not-login-text {
  font-size: 16px;
  color: var(--text-color-secondary);
  margin-bottom: 30px;
  text-align: center;
}

.login-now-btn {
  width: 80%;
  height: 50px;
  line-height: 50px;
  background: linear-gradient(to right, #5BA2FF, #4A90E2);
  color: #FFFFFF;
  border-radius: 25px;
  font-size: 18px;
  border: none;
}

.login-now-btn:active {
  opacity: 0.8;
}

/* 用户信息卡片 */
.user-card {
  position: relative;
  background: linear-gradient(135deg, #4A90E2, #5476FF);
  padding: 12px 20px 12px;
  color: var(--text-color-light);
  border-radius: 0 0 30px 30px;
  margin-bottom: 20px;
  box-shadow: 0 10px 25px rgba(74, 144, 226, 0.25);
  overflow: hidden;
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

.user-signature {
  font-size: 11px;
  opacity: 0.8;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
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
  z-index: 1;
  position: relative;
  align-items: flex-end;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.18);
  padding: 4px 10px;
  border-radius: 16px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  transition: all 0.3s;
  font-size: 12px;
}

.action-btn text {
  display: block;
  text-align: center;
}

.action-btn:active {
  transform: translateY(2px);
  background-color: rgba(255, 255, 255, 0.25);
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

.dynamic-item {
  background-color: #FFFFFF;
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
  height: 190px; /* 固定高度确保一致性 */
  display: flex;
  flex-direction: column;
}

.dynamic-item:active {
  transform: translateY(2px);
  box-shadow: 0 2px 5px rgba(74, 144, 226, 0.05);
}

.dynamic-image-container {
  position: relative;
  width: 100%;
  height: 65%; /* 固定高度比例 */
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

.dynamic-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
}

.dynamic-content.no-image {
  padding: 15px;
  height: 100%;
}

.dynamic-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 10px;
  color: var(--text-color);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.dynamic-content.no-image .dynamic-title {
  -webkit-line-clamp: 3;
}

.dynamic-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: absolute;
  bottom: 12px;
  left: 15px;
  right: 15px;
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

/* 无数据状态 */
.no-data {
  grid-column: span 2;
  text-align: center;
  padding: 40px 20px;
  color: var(--text-color-secondary);
  font-size: 14px;
}

/* 功能菜单 */
.menu-section {
  margin: 0 15px 25px;
}

.menu-list {
  background-color: #FFFFFF;
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(74, 144, 226, 0.05);
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(74, 144, 226, 0.08);
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: rgba(74, 144, 226, 0.05);
}

.menu-item-left {
  display: flex;
  align-items: center;
}

.menu-icon-box {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F4F8FF, #E8F0FD);
  border-radius: 12px;
  margin-right: 12px;
  position: relative;
  overflow: hidden;
}

.menu-icon-img {
  width: 24px;
  height: 24px;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  background-color: #FF4949;
  color: white;
  border-radius: 9px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border: 2px solid white;
}

.menu-item-right {
  display: flex;
  align-items: center;
  color: var(--text-color-secondary);
}

.menu-item-count {
  font-size: 14px;
  margin-right: 5px;
  color: var(--text-color-secondary);
}

/* 版本信息 */
.version-info {
  text-align: center;
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-top: 20px;
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

.icon-posts:before {
  content: "\e645";
}

.icon-comments:before {
  content: "\e668";
}

.icon-favorites:before {
  content: "\e669";
}

.icon-notification:before {
  content: "\e729";
}

.icon-feedback:before {
  content: "\e738";
}

.icon-settings:before {
  content: "\e78e";
}

.icon-edit:before {
  content: "\e649";
}

.icon-share:before {
  content: "\e67e";
}

.icon-like:before {
  content: "\e669";
}

.icon-comment:before {
  content: "\e668";
}

.icon-followers:before {
  content: "\e681";
}

.icon-following:before {
  content: "\e681";
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

.user-tag:last-child {
  margin-right: 5px;
}

/* 新增用户标签相关样式 */
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
</style> 