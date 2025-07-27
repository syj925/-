<template>
  <view class="profile-page">
    <!-- 顶部背景 -->
    <view class="profile-header">
      <view class="profile-cover">
        <image
          v-if="userInfo.backgroundImage && !userInfo.backgroundImage.includes('gradient')"
          class="profile-bg"
          :src="userInfo.backgroundImage"
          mode="aspectFill"
        ></image>
        <view
          v-else
          class="profile-bg gradient-bg"
          :style="{ background: userInfo.backgroundImage || 'linear-gradient(135deg, #2b85e4 0%, #6ba7f0 100%)' }"
        ></view>
        <!-- 背景遮罩层 -->
        <view class="profile-overlay"></view>
        <!-- 底部模糊过渡效果 -->
        <view class="profile-bottom-blur"></view>
      </view>
      
      <!-- 用户信息 -->
      <view class="profile-info">
        <view class="profile-avatar-container">
          <view class="profile-avatar-wrap">
            <image class="profile-avatar" :src="userInfo.avatar || '/static/images/common/default-avatar.png'" mode="aspectFill"></image>
            <view class="profile-avatar-border"></view>
            <view class="profile-avatar-glow"></view>
          </view>
        </view>
        
        <view class="profile-user-container">
          <view class="profile-user">
            <view class="profile-nickname">{{ userInfo.nickname || '游客' }}</view>
            <view class="profile-userid">ID: {{ userInfo.userId || '未登录' }}</view>
            <view class="profile-bio" v-if="userInfo.bio">{{ userInfo.bio }}</view>
          </view>
          

        </view>
      </view>
      
      <!-- 成就徽章 -->
      <view class="profile-achievements" v-if="userInfo.isLogin && userAchievements.length > 0">
        <view class="section-title">我的成就</view>
        <scroll-view scroll-x class="achievements-scroll" show-scrollbar="false">
          <view class="achievements-content">
            <view 
              v-for="(achievement, index) in userAchievements" 
              :key="index"
              class="achievement-item"
              :style="{animationDelay: index * 0.1 + 's'}"
            >
              <image class="achievement-icon" :src="achievement.icon"></image>
              <text class="achievement-name">{{ achievement.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
      
      <!-- 学校信息 -->
      <view class="profile-school" v-if="userInfo.isLogin && (userInfo.school || userInfo.department)">
        <view class="profile-school-content">
          <view class="profile-school-icon">
            <text class="iconfont icon-school"></text>
          </view>
          <view class="profile-school-info">
            <text class="profile-school-name" v-if="userInfo.school">{{ userInfo.school }}</text>
            <text class="profile-school-dept" v-if="userInfo.department">{{ userInfo.department }}</text>
          </view>
        </view>
      </view>
      
      <!-- 标签展示区 -->
      <view class="profile-tags" v-if="userInfo.isLogin && userInfo.tags && userInfo.tags.length > 0">
        <view class="section-title">个人标签</view>
        <scroll-view scroll-x class="tags-scroll" show-scrollbar="false">
          <view class="tags-container">
            <view 
              v-for="(tag, index) in userInfo.tags" 
              :key="index" 
              class="profile-tag"
              :style="{animationDelay: index * 0.05 + 's'}"
            >
              {{ tag }}
            </view>
          </view>
        </scroll-view>
      </view>
      
      <!-- 用户数据 -->
      <view class="profile-stats-container">
        <view class="profile-stats">
          <view class="profile-stat" @tap="handleTabClick('post')">
            <view class="profile-stat-number">{{ formatNumber(userInfo.postCount || 0) }}</view>
            <view class="profile-stat-label">帖子</view>
          </view>

          <view class="profile-stat" @tap="handleTabClick('favorite')">
            <view class="profile-stat-number">{{ formatNumber(userInfo.favoriteCount || 0) }}</view>
            <view class="profile-stat-label">收藏</view>
          </view>

          <view class="profile-stat" @tap="goToFollowList('following')">
            <view class="profile-stat-number">{{ formatNumber(userInfo.followingCount || 0) }}</view>
            <view class="profile-stat-label">关注</view>
          </view>

          <view class="profile-stat" @tap="goToFollowList('followers')">
            <view class="profile-stat-number">{{ formatNumber(userInfo.followersCount || 0) }}</view>
            <view class="profile-stat-label">粉丝</view>
          </view>

          <view class="profile-stat">
            <view class="profile-stat-number">{{ formatNumber(userInfo.likeCount || 0) }}</view>
            <view class="profile-stat-label">获赞</view>
          </view>
        </view>
      </view>

      <!-- 功能菜单 -->
      <view class="profile-menu-container">
        <view class="profile-menu">
          <view class="menu-item" @tap="goToMyEvents">
            <view class="menu-icon">
              <app-icon name="calendar" size="lg" color="#AC92EC" />
            </view>
            <view class="menu-content">
              <text class="menu-title">我的活动</text>
              <text class="menu-desc">查看我参与的活动</text>
            </view>
            <view class="menu-arrow">
              <app-icon name="arrow-right" size="sm" color="#C4C4C4" />
            </view>
          </view>

          <view class="menu-item" @tap="goToMyPosts">
            <view class="menu-icon">
              <app-icon name="edit" size="lg" color="#5B8EF9" />
            </view>
            <view class="menu-content">
              <text class="menu-title">我的帖子</text>
              <text class="menu-desc">管理我发布的内容</text>
            </view>
            <view class="menu-arrow">
              <app-icon name="arrow-right" size="sm" color="#C4C4C4" />
            </view>
          </view>

          <view class="menu-item" @tap="goToMyFavorites">
            <view class="menu-icon">
              <app-icon name="star" size="lg" color="#FFB800" />
            </view>
            <view class="menu-content">
              <text class="menu-title">我的收藏</text>
              <text class="menu-desc">查看收藏的内容</text>
            </view>
            <view class="menu-arrow">
              <app-icon name="arrow-right" size="sm" color="#C4C4C4" />
            </view>
          </view>

          <view class="menu-item" @tap="goToAuditHistory">
            <view class="menu-icon">
              <app-icon name="check-circle" size="lg" color="#34C759" />
            </view>
            <view class="menu-content">
              <text class="menu-title">审核记录</text>
              <text class="menu-desc">查看帖子审核状态</text>
            </view>
            <view class="menu-arrow">
              <app-icon name="arrow-right" size="sm" color="#C4C4C4" />
            </view>
          </view>

          <view class="menu-item" @tap="goToEventTest">
            <view class="menu-icon">
              <app-icon name="settings" size="lg" color="#FF6B6B" />
            </view>
            <view class="menu-content">
              <text class="menu-title">活动API测试</text>
              <text class="menu-desc">测试活动相关API接口</text>
            </view>
            <view class="menu-arrow">
              <app-icon name="arrow-right" size="sm" color="#C4C4C4" />
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 内容区 -->
    <view class="profile-content">
      <!-- 标签页 -->
      <view class="profile-tabs">
        <view 
          v-for="(tab, index) in tabs" 
          :key="index" 
          :class="['profile-tab', { 'active': currentTab === tab.key }]"
          @tap="handleTabClick(tab.key)"
        >
          <text class="tab-text">{{ tab.name }}</text>
          <view class="tab-indicator" v-if="currentTab === tab.key"></view>
        </view>
      </view>
      
      <!-- 内容区 -->
      <swiper 
        class="profile-swiper" 
        :current="tabIndex" 
        @change="handleSwiperChange"
        :duration="300"
      >
        <!-- 帖子页 -->
        <swiper-item class="profile-swiper-item">
          <scroll-view 
            scroll-y 
            class="profile-scroll" 
            @scrolltolower="loadMore('post')" 
            refresher-enabled 
            :refresher-triggered="postRefreshing" 
            @refresherrefresh="refreshPosts"
          >
            <view class="profile-posts" v-if="posts.length > 0">
              <view class="post-list">
                <post-card
                  v-for="(post, index) in posts"
                  :key="post.id"
                  :post="post"
                  :show-anonymous-badge="true"
                  :style="{ animationDelay: index * 0.1 + 's' }"
                  class="post-card-item"
                  @favorite="handleFavoriteClick"
                  @like="handleLikeClick"
                  @comment="handleCommentClick"
                ></post-card>
              </view>
              <view class="load-more" v-if="postHasMore">
                <text class="load-more-text">向下滑动加载更多...</text>
              </view>
              <view class="no-more" v-else-if="posts.length > 0">
                <text class="no-more-text">已显示全部 {{ posts.length }} 个帖子</text>
              </view>
            </view>
            <view class="empty-container" v-else>
              <view class="loading-skeleton" v-if="postLoading">
                <view class="skeleton-item" v-for="n in 3" :key="n">
                  <view class="skeleton-avatar"></view>
                  <view class="skeleton-content">
                    <view class="skeleton-line skeleton-line-title"></view>
                    <view class="skeleton-line skeleton-line-text"></view>
                    <view class="skeleton-line skeleton-line-short"></view>
                  </view>
                </view>
              </view>
              <view class="empty-state" v-else>
                <image class="empty-image" src="/static/images/common/empty-posts.png" mode="aspectFit"></image>
                <text class="empty-text">暂无帖子</text>
                <view class="create-post" @tap="createPost">
                  <text class="create-post-text">发布帖子</text>
                </view>
              </view>
            </view>
          </scroll-view>
        </swiper-item>
        
        <!-- 收藏页 -->
        <swiper-item class="profile-swiper-item">
          <scroll-view
            scroll-y
            class="profile-scroll"
            @scrolltolower="loadMore('favorite')"
            refresher-enabled
            :refresher-triggered="likeRefreshing"
            @refresherrefresh="refreshLikes"
          >
            <view class="profile-likes" v-if="likes.length > 0">
              <view class="post-list">
                <post-card
                  v-for="(like, index) in likes"
                  :key="like.id"
                  :post="like.post"
                  :style="{ animationDelay: index * 0.1 + 's' }"
                  class="post-card-item"
                  @favorite="handleFavoriteClick"
                  @like="handleLikeClick"
                  @comment="handleCommentClick"
                ></post-card>
              </view>
              <view class="load-more" v-if="likeHasMore">
                <text class="load-more-text">向下滑动加载更多...</text>
              </view>
              <view class="no-more" v-else-if="likes.length > 0">
                <text class="no-more-text">已显示全部 {{ likes.length }} 个收藏</text>
              </view>
            </view>
            <view class="empty-container" v-else>
              <view class="loading-skeleton" v-if="likeLoading">
                <view class="skeleton-item" v-for="n in 3" :key="n">
                  <view class="skeleton-avatar"></view>
                  <view class="skeleton-content">
                    <view class="skeleton-line skeleton-line-title"></view>
                    <view class="skeleton-line skeleton-line-text"></view>
                    <view class="skeleton-line skeleton-line-short"></view>
                  </view>
                </view>
              </view>
              <view class="empty-state" v-else>
                <image class="empty-image" src="/static/images/common/empty-likes.png" mode="aspectFit"></image>
                <text class="empty-text">暂无收藏内容</text>
              </view>
            </view>
          </scroll-view>
        </swiper-item>
      </swiper>
    </view>
    
    <!-- 设置入口 -->
    <view class="profile-settings-container">
      <view class="profile-settings" @tap="goSettings">
        <app-icon name="more" size="md" color="#fff"></app-icon>
      </view>
    </view>
    
    <!-- 底部安全区占位 -->
    <view class="safe-area"></view>
  </view>
</template>

<script>
import PostList from '@/components/post/PostList.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { UrlUtils } from '@/utils';
import PostCard from '@/components/post/PostCard.vue';
// 导入API
import api from '@/api';

export default {
  components: {
    PostList,
    AppIcon,
    PostCard
  },
  data() {
    return {
      userInfo: {
        isLogin: false,
        avatar: '',
        nickname: '',
        userId: '',
        bio: '',
        school: '',
        department: '',
        backgroundImage: '',
        postCount: 0,
        likeCount: 0,
        favoriteCount: 0,
        followingCount: 0,
        followersCount: 0,
        tags: []
      },
      userAchievements: [], // 改为空数组，从API获取
      tabs: [
        { key: 'post', name: '我的帖子' },
        { key: 'favorite', name: '我的收藏' }
      ],
      currentTab: 'post',
      tabIndex: 0,
      
      // 帖子数据
      posts: [],
      postPage: 1,
      postPageSize: 100, // 增加到100，覆盖更多用户
      postHasMore: true,
      postRefreshing: false,
      postLoading: false,
      
      // 收藏数据
      likes: [],
      likePage: 1,
      likePageSize: 100, // 增加到100，覆盖更多用户
      likeHasMore: true,
      likeRefreshing: false,
      likeLoading: false,
      
      // 原始数据（保持兼容性）
      activeTab: 'post',
      postList: [],
      favoriteList: [],
      draftList: [],
      loading: false,
      loadingFav: false,
      loadingDraft: false,
      refreshing: false,
      finished: false,
      finishedFav: false,
      finishedDraft: false,
      page: 1,
      pageSize: 10
    };
  },
  computed: {
    isLogin() {
      return this.userInfo.isLogin;
    },
    
    userId() {
      return this.userInfo?.userId || '';
    }
  },
  onLoad() {
    this.loadUserInfo();
    this.loadPosts();
  },
  onShow() {
    // 页面显示时刷新数据
    this.loadUserInfo();
    this.refreshCurrentTab();

    // 检查全局刷新标记
    const app = getApp();
    if (app.globalData && app.globalData.forceRefresh) {
      console.log('检测到全局刷新标记，强制刷新用户信息');
      this.loadUserInfo();
      app.globalData.forceRefresh = false; // 重置标记
    }
  },
  onPullDownRefresh() {
    this.refreshCurrentTab();
    setTimeout(() => {
      uni.stopPullDownRefresh();
    }, 1000);
  },
  onReachBottom() {
    // 根据当前选中的标签页触发对应的加载更多
    if (this.tabIndex === 0) {
      // 我的帖子
      this.loadMorePosts();
    } else if (this.tabIndex === 1) {
      // 我的收藏
      this.loadMoreLikes();
    }
  },
  methods: {
    // 加载用户信息
    loadUserInfo() {
      // 检查token是否存在
      const token = uni.getStorageSync('token');

      if (!token) {
        uni.navigateTo({
          url: '/pages/login/login'
        });
        return;
      }
      
      // API请求获取用户信息
      api.user.getInfo().then(res => {
        console.log('🔍 获取用户信息API响应:', res);

        if (res.code === 0 || res.code === 200) {
          const userData = res.data;

          // 根据API文档，统计数据在stats对象中
          const stats = userData.stats || {};

          console.log('🔍 用户数据:', userData);
          console.log('🔍 统计数据 stats:', stats);
          console.log('🔍 原始背景图片:', userData.backgroundImage);

          // 详细检查统计数据字段
          console.log('🔍 统计数据详细检查:', {
            'userData.stats': userData.stats,
            'stats.postCount': stats.postCount,
            'stats.likeCount': stats.likeCount,
            'stats.favoriteCount': stats.favoriteCount,
            'stats.followCount': stats.followCount,
            'stats.fansCount': stats.fansCount
          });

          this.userInfo = {
            isLogin: true,
            avatar: UrlUtils.ensureImageUrl(userData.avatar),
            nickname: userData.nickname || userData.username,
            userId: userData.id,
            bio: userData.bio || '这个人很懒，还没有填写个人简介',
            school: userData.school || '',
            department: userData.department || '',
            backgroundImage: userData.backgroundImage ? UrlUtils.ensureAbsoluteUrl(userData.backgroundImage) : 'linear-gradient(135deg, #2b85e4 0%, #6ba7f0 100%)',
            // 根据API文档映射字段名
            postCount: stats.postCount || 0,
            likeCount: stats.likeCount || 0,
            favoriteCount: stats.favoriteCount || 0,
            followingCount: stats.followCount || 0,  // API中是followCount
            followersCount: stats.fansCount || 0,    // API中是fansCount
            tags: userData.tags || []
          };

          // 调试：检查设置后的userInfo
          console.log('🔍 设置后的 userInfo:', this.userInfo);
          console.log('🔍 userInfo 统计数据:', {
            postCount: this.userInfo.postCount,
            likeCount: this.userInfo.likeCount,
            favoriteCount: this.userInfo.favoriteCount,
            followingCount: this.userInfo.followingCount,
            followersCount: this.userInfo.followersCount
          });
          
          // 获取用户成就
          if (userData.achievements) {
            this.userAchievements = userData.achievements;
          }
        } else {
          // 登录状态失效
          this.userInfo.isLogin = false;
          this.userInfo.nickname = '游客';
          uni.removeStorageSync('token');
        }
      }).catch(err => {
        console.error('获取用户信息失败:', err);
        this.userInfo.isLogin = false;
        this.userInfo.nickname = '游客';
      });
    },
    
    // 编辑个人资料
    editProfile() {
      if (!this.userInfo.isLogin) {
        uni.navigateTo({
          url: '/pages/auth/login'
        });
        return;
      }
      
      uni.navigateTo({
        url: '/pages/profile/edit'
      });
    },
    
    // Tab切换处理
    handleTabClick(tab) {
      // 如果点击的是统计数据，切换到对应的标签页
      if (tab === 'favorite') {
        this.currentTab = 'favorite';
        this.tabIndex = this.tabs.findIndex(t => t.key === 'favorite');
        this.refreshCurrentTab();
        return;
      }

      this.currentTab = tab;
      this.tabIndex = this.tabs.findIndex(t => t.key === tab);
      this.refreshCurrentTab();

      // 兼容原始功能
      this.activeTab = tab === 'post' ? 'post' : 'favorite';
      this.changeTab(this.activeTab);
    },

    // 跳转到关注/粉丝列表
    goToFollowList(type) {
      if (!this.userInfo.isLogin) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      uni.navigateTo({
        url: `/pages/profile/follow?type=${type}&userId=${this.userInfo.userId}`
      });
    },
    
    // 滑动切换处理
    handleSwiperChange(e) {
      const index = e.detail.current;
      this.tabIndex = index;
      this.currentTab = this.tabs[index].key;
      this.refreshCurrentTab();
      
      // 兼容原始功能
      this.activeTab = this.currentTab === 'post' ? 'post' : 'like';
    },
    
    // 刷新当前标签页数据
    refreshCurrentTab() {
      switch (this.currentTab) {
        case 'post':
          this.refreshPosts();
          break;
        case 'favorite':
          this.refreshLikes();
          break;
      }
    },
    
    // 加载更多
    loadMore(type) {
      if (type === 'post') {
        this.loadMorePosts();
      } else if (type === 'favorite') {
        this.loadMoreLikes();
      }
    },
    
    // 帖子相关方法
    refreshPosts() {
      this.postRefreshing = true;
      this.postPage = 1;
      this.loadPosts();

      // 兼容原始功能
      this.refreshing = true;
      this.page = 1;
    },
    
    loadPosts() {
      if (this.postLoading) return;
      
      this.postLoading = true;
      
      // 调用API获取用户发布的帖子
      api.user.getPosts(this.postPage, this.postPageSize, 'published').then(res => {
        console.log('获取用户帖子成功:', res);

        if (res.code === 0 || res.code === 200) {
          const postsData = res.data.list || res.data.items || res.data.posts || [];
          const total = res.data.total || 0;

          // 🔧 修复：对个人主页的帖子数据进行字段映射（旧版本API兼容）
          const processedPosts = postsData.map(post => {
            console.log('🔍 个人主页帖子原始数据:', post);

            return {
              ...post,
              // 确保关键字段存在
              id: post.id,
              title: post.title || '',
              content: post.content || '',
              createTime: post.created_at || post.createdAt || post.create_time || post.time,
              // 确保作者信息结构正确
              author: {
                id: post.author?.id || post.user_id || post.userId,
                username: post.author?.username || post.username,
                nickname: post.author?.nickname || post.author?.username || post.nickname || post.username || '未知用户',
                avatar: UrlUtils.ensureImageUrl(post.author?.avatar || post.avatar)
              },
              // 位置信息
              location: post.location_name || post.locationName || '',
              // 🎯 关键修复：字段映射（旧版本API兼容）
              likeCount: post.like_count || post.likeCount || post.likes || 0,
              commentCount: post.comment_count || post.commentCount || post.comments || 0,
              favoriteCount: post.favorite_count || post.favoriteCount || post.collections || 0,
              // 交互状态
              isLiked: post.is_liked || post.isLiked || false,
              isFavorited: post.is_favorited || post.isFavorited || post.isCollected || false,
              // 匿名状态
              is_anonymous: post.is_anonymous || post.isAnonymous || false,
              // 图片处理
              images: post.images || [],
              // 话题处理
              topics: post.topics || []
            };
          });

          console.log('🔧 个人主页帖子处理后数据:', processedPosts);

          if (this.postPage === 1) {
            this.posts = processedPosts;
          } else {
            this.posts = [...this.posts, ...processedPosts];
          }

          this.postHasMore = this.posts.length < total;

          // 兼容原始数据
          this.postList = this.posts;
        } else {
          uni.showToast({
            title: res.msg || '获取帖子失败',
            icon: 'none'
          });
        }
        
        this.postLoading = false;
        this.postRefreshing = false;
        
        // 兼容原始功能
        this.loading = false;
        this.refreshing = false;
        this.finished = !this.postHasMore;
      }).catch(err => {
        console.error('获取用户帖子失败:', err);
        this.postLoading = false;
        this.postRefreshing = false;
        
        // 兼容原始功能
        this.loading = false;
        this.refreshing = false;
        
        uni.showToast({
          title: '获取帖子失败',
          icon: 'none'
        });
      });
    },
    
    loadMorePosts() {
      if (this.postLoading || !this.postHasMore) return;

      this.postPage++;
      this.loadPosts();

      // 兼容原始功能
      this.page++;
    },
    
    // 收藏相关方法
    refreshLikes() {
      this.likeRefreshing = true;
      this.likePage = 1;
      this.loadLikes();
    },
    
    loadLikes() {
      if (this.likeLoading) return;
      
      this.likeLoading = true;
      
      // 调用API获取用户收藏
      api.user.getFavorites(this.likePage, this.likePageSize).then(res => {
        console.log('🔍 获取用户收藏API响应:', res);

        if (res.code === 0 || res.code === 200) {
          const favoritesData = res.data.list || res.data.items || [];
          const total = res.data.total || 0;

          // 🔧 修复：对收藏数据进行字段映射，保持原有的数据结构
          const processedFavorites = favoritesData.map(item => {
            // 收藏API返回的可能是包含post字段的对象，也可能直接是帖子数据
            const post = item.post || item;

            // 处理后的帖子数据
            const processedPost = {
              ...post,
              // 确保关键字段存在
              id: post.id,
              title: post.title || '',
              content: post.content || '',
              createTime: post.created_at || post.createdAt || post.create_time,
              // 🎯 关键修复：作者信息映射（优先显示昵称）
              author: {
                id: post.author?.id || post.user_id,
                username: post.author?.username || post.username,
                nickname: post.author?.nickname || post.author?.username || post.username || '未知用户', // 优先使用nickname
                avatar: UrlUtils.ensureImageUrl(post.author?.avatar || post.avatar)
              },
              // 位置信息
              location: post.location_name || post.locationName || '',
              // 🎯 关键修复：数值字段映射
              likeCount: post.like_count || post.likeCount || post.likes || 0,
              commentCount: post.comment_count || post.commentCount || post.comments || 0,
              favoriteCount: post.favorite_count || post.favoriteCount || post.collections || 0,
              viewCount: post.view_count || post.viewCount || post.views || 0,
              // 交互状态
              isLiked: post.is_liked || post.isLiked || false,
              isFavorited: post.is_favorited || post.isFavorited || true, // 收藏列表中的都是已收藏的
              // 图片处理
              images: post.images || [],
              // 话题处理
              topics: post.topics || [],
              // 分类信息
              category: post.category || {}
            };

            // 返回保持原有结构的数据
            return {
              ...item,
              post: processedPost,
              // 收藏相关信息
              collectionName: item.collectionName || item.name,
              collectedAt: item.collectedAt || item.created_at
            };
          });

          if (this.likePage === 1) {
            this.likes = processedFavorites;
          } else {
            this.likes = [...this.likes, ...processedFavorites];
          }

          this.likeHasMore = this.likes.length < total;

          // 兼容原始数据
          this.favoriteList = this.likes;
        } else {
          uni.showToast({
            title: res.msg || '获取收藏失败',
            icon: 'none'
          });
        }
        
        this.likeLoading = false;
        this.likeRefreshing = false;
        
        // 兼容原始功能
        this.loadingFav = false;
        this.finishedFav = !this.likeHasMore;
      }).catch(err => {
        console.error('获取用户收藏失败:', err);
        this.likeLoading = false;
        this.likeRefreshing = false;
        
        // 兼容原始功能
        this.loadingFav = false;
        
        uni.showToast({
          title: '获取收藏失败',
          icon: 'none'
        });
      });
    },
    
    loadMoreLikes() {
      if (this.likeLoading || !this.likeHasMore) return;

      this.likePage++;
      this.loadLikes();
    },

    // 工具方法
    formatTime(time) {
      // 将时间戳格式化为友好的时间显示
      if (!time) return '';

      const now = new Date().getTime();
      const diff = now - new Date(time).getTime();

      if (diff < 60 * 1000) {
        return '刚刚';
      } else if (diff < 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 1000)) + '分钟前';
      } else if (diff < 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
      } else if (diff < 30 * 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前';
      } else {
        const date = new Date(time);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      }
    },

    // 格式化数字显示
    formatNumber(num) {
      console.log('🔍 formatNumber 调用:', { input: num, type: typeof num });

      if (!num || num === 0) return '0';

      if (num >= 10000) {
        return (num / 10000).toFixed(1).replace(/\.0$/, '') + 'w';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
      }

      return num.toString();
    },
    
    // 跳转帖子详情页
    navigateToPost(postId) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${postId}`
      });
    },
    
    // 发布帖子
    createPost() {
      uni.navigateTo({
        url: '/pages/post/create'
      });
    },
    
    // 发现用户
    discoverUsers() {
      uni.navigateTo({
        url: '/pages/user/discover'
      });
    },

    // 处理收藏点击
    handleFavoriteClick(post) {
      if (!this.userInfo.isLogin) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      // 先保存原始状态
      const originalState = post.isFavorited;
      const originalCount = post.favoriteCount;
      const newState = !post.isFavorited;

      // 乐观更新UI
      post.isFavorited = newState;
      post.favoriteCount += newState ? 1 : -1;

      // 调用收藏API
      const action = newState ? 'favorite' : 'unfavorite';
      api.post[action](post.id).then(res => {
        if (res.code === 0 || res.code === 200) {
          // 如果是在收藏页面取消收藏，需要从列表中移除
          if (!newState && this.currentTab === 'favorite') {
            const index = this.likes.findIndex(like => like.post.id === post.id);
            if (index > -1) {
              this.likes.splice(index, 1);
            }
            // 更新用户收藏数
            this.userInfo.favoriteCount = Math.max(0, this.userInfo.favoriteCount - 1);
          } else if (newState) {
            // 更新用户收藏数
            this.userInfo.favoriteCount = this.userInfo.favoriteCount + 1;
          }

          uni.showToast({
            title: newState ? '收藏成功' : '取消收藏',
            icon: 'success'
          });
        } else {
          // 恢复原始状态
          post.isFavorited = originalState;
          post.favoriteCount = originalCount;

          uni.showToast({
            title: res.msg || '操作失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('收藏操作失败:', err);

        // 恢复原始状态
        post.isFavorited = originalState;
        post.favoriteCount = originalCount;

        // 处理特定错误
        if (err.code === 100 && err.data && err.data.details) {
          const detail = err.data.details[0];
          if (detail && detail.field === 'favorites_user_id_post_id') {
            // 已经收藏的情况，更新状态为已收藏
            post.isFavorited = true;
            uni.showToast({
              title: '已收藏',
              icon: 'none'
            });
            return;
          }
        }

        uni.showToast({
          title: err.msg || '操作失败',
          icon: 'none'
        });
      });
    },

    // 处理点赞点击
    handleLikeClick(post) {
      if (!this.userInfo.isLogin) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      // 调用点赞API
      const action = post.isLiked ? 'unlike' : 'like';
      api.post[action](post.id).then(res => {
        if (res.code === 0 || res.code === 200) {
          // 更新帖子状态
          post.isLiked = !post.isLiked;
          post.likeCount = post.likeCount + (post.isLiked ? 1 : -1);

          uni.showToast({
            title: post.isLiked ? '点赞成功' : '取消点赞',
            icon: 'success'
          });
        } else {
          uni.showToast({
            title: res.msg || '操作失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('点赞操作失败:', err);
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      });
    },

    // 处理评论点击
    handleCommentClick(post) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${post.id}&scrollToComments=true`
      });
    },
    
    // 关注/取消关注用户
    toggleFollow(user) {
      if (!this.isLogin) {
        uni.navigateTo({
          url: '/pages/auth/login'
        });
        return;
      }
      
      user.isFollowed = !user.isFollowed;
      
      // 模拟API请求
      uni.showToast({
        title: user.isFollowed ? '已关注' : '已取消关注',
        icon: 'none'
      });
    },
    
    // 保留原有方法以保持兼容性
    changeTab(tab) {
      this.activeTab = tab;
      
      if (tab === 'post' && this.postList.length === 0) {
        this.loadPosts();
      } else if (tab === 'like' && this.favoriteList.length === 0) {
        this.loadLikes();
      }
    },
    
    getSwiperIndex() {
      if (this.activeTab === 'post') return 0;
      if (this.activeTab === 'like') return 1;
      return 0;
    },
    
    handleScrollRefresh() {
      this.refreshing = true;
      this.page = 1;

      if (this.activeTab === 'post') {
        this.refreshPosts();
      } else if (this.activeTab === 'like') {
        this.refreshLikes();
      }
    },
    
    loadFavorites() {
      // 已在新代码中实现为loadLikes
      this.loadLikes();
    },
    
    loadMoreFavorites() {
      // 已在新代码中实现为loadMoreLikes
      this.loadMoreLikes();
    },
    
    handleLike() {
      uni.showToast({
        title: '点赞成功',
        icon: 'none'
      });
    },
    
    handleComment(post) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${post.id}&focus=comment`
      });
    },
    
    handleFavorite() {
      uni.showToast({
        title: '收藏成功',
        icon: 'none'
      });
    },
    
    handleShare() {
      uni.showShareMenu({
        withShareTicket: true
      });
    },
    
    handleEdit(post) {
      uni.navigateTo({
        url: `/pages/post/edit?id=${post.id}`
      });
    },
    
    handleDelete() {
      uni.showModal({
        title: '提示',
        content: '确定要删除这条帖子吗？',
        success: (res) => {
          if (res.confirm) {
            uni.showToast({
              title: '删除成功',
              icon: 'none'
            });
          }
        }
      });
    },
    
    goLogin() {
      uni.navigateTo({
        url: '/pages/auth/login'
      });
    },
    
    goSettings() {
      uni.showActionSheet({
        itemList: ['编辑资料', '账号与隐私设置', '版本管理', '关于我们'],
        success: (res) => {
          switch (res.tapIndex) {
            case 0:
              this.editProfile();
              break;
            case 1:
              uni.navigateTo({
                url: '/pages/profile/privacy'
              });
              break;
            case 2:
              uni.navigateTo({
                url: '/pages/settings/version'
              });
              break;
            case 3:
              uni.navigateTo({
                url: '/pages/settings/about'
              });
              break;
          }
        }
      });
    },

    // 跳转到我的活动
    goToMyEvents() {
      if (!this.userInfo.isLogin) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      uni.navigateTo({
        url: '/pages/event/my-events'
      });
    },

    // 跳转到我的帖子
    goToMyPosts() {
      if (!this.userInfo.isLogin) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      this.handleTabClick('post');
    },

    // 跳转到我的收藏
    goToMyFavorites() {
      if (!this.userInfo.isLogin) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      this.handleTabClick('favorite');
    },

    // 跳转到审核记录页面
    goToAuditHistory() {
      if (!this.userInfo.isLogin) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      uni.navigateTo({
        url: '/pages/profile/audit-history'
      });
    },

    // 跳转到活动API测试页面
    goToEventTest() {
      uni.navigateTo({
        url: '/pages/test/event-test'
      });
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

/* 页面容器 */
.profile-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  position: relative;
}

/* 顶部区域 */
.profile-header {
  position: relative;
  border-radius: 0 0 50rpx 50rpx;
  overflow: hidden;
  box-shadow: 0 20rpx 40rpx rgba(102, 126, 234, 0.15);
  margin-bottom: 30rpx;
  padding-bottom: 40rpx;
}

/* 封面背景 */
.profile-cover {
  position: relative;
  height: 400rpx;
  overflow: hidden;
}

.profile-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.8);
}

.gradient-bg {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.profile-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.1) 100%);
  z-index: 1;
}

.profile-bottom-blur {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80rpx;
  background: linear-gradient(to top,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.5) 40%,
    rgba(255, 255, 255, 0.2) 70%,
    transparent 100%);
  backdrop-filter: blur(12rpx);
  -webkit-backdrop-filter: blur(12rpx);
  z-index: 2;
}

/* 用户信息 */
.profile-info {
  @include flex(row, flex-start, center);
  padding: 40rpx 30rpx;
  margin-top: -100rpx;
  position: relative;
  z-index: 10;
  background: linear-gradient(to bottom,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 30%,
    rgba(255, 255, 255, 0.15) 70%,
    rgba(255, 255, 255, 0.25) 100%);
  backdrop-filter: blur(6rpx);
  -webkit-backdrop-filter: blur(6rpx);
}

.profile-avatar-container {
  position: relative;
  margin-right: 30rpx;
  width: 180rpx;
  height: 180rpx;
}

.profile-avatar-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 15rpx 35rpx rgba(0, 0, 0, 0.2), 0 5rpx 15rpx rgba(0, 0, 0, 0.1);
  border: 6rpx solid rgba(255, 255, 255, 0.9);
}

.profile-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar-border {
  position: absolute;
  top: -8rpx;
  left: -8rpx;
  right: -8rpx;
  bottom: -8rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(255, 255, 255, 0.6);
  z-index: 3;
  animation: avatarPulse 2s infinite ease-in-out;
}

@keyframes avatarPulse {
  0% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 0.6; }
}

.profile-avatar-glow {
  position: absolute;
  top: -10rpx;
  left: -10rpx;
  right: -10rpx;
  bottom: -10rpx;
  border-radius: 50%;
  background: linear-gradient(45deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1));
  opacity: 0.7;
  z-index: 2;
  animation: avatarGlow 3s infinite ease-in-out;
}

@keyframes avatarGlow {
  0% { opacity: 0.7; transform: rotate(0deg); }
  50% { opacity: 0.9; transform: rotate(180deg); }
  100% { opacity: 0.7; transform: rotate(360deg); }
}

.profile-user-container {
  flex: 1;
  @include flex(column, space-between, flex-start);
}

.profile-user {
  @include flex(column, center, flex-start);
}

.profile-nickname {
  font-size: 44rpx;
  color: #ffffff;
  font-weight: 700;
  margin-bottom: 10rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.8), 0 0 20rpx rgba(0, 0, 0, 0.5);
  letter-spacing: 1rpx;
}

.profile-userid {
  font-size: 26rpx;
  color: #ffffff;
  margin-bottom: 15rpx;
  background: rgba(0, 0, 0, 0.4);
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  backdrop-filter: blur(10rpx);
  text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.6);
}

.profile-bio {
  font-size: 28rpx;
  color: #ffffff;
  margin-top: 10rpx;
  line-height: 1.6;
  max-width: 100%;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.8);
}



/* 学校信息 */
.profile-school {
  padding: 0 30rpx;
  margin-top: 25rpx;
}

.profile-school-content {
  @include flex(row, flex-start, center);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  border-radius: 25rpx;
  padding: 20rpx 28rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.profile-school-icon {
  color: #667eea;
  font-size: 40rpx;
  margin-right: 20rpx;
}

.profile-school-info {
  @include flex(column, center, flex-start);
}

.profile-school-name {
  font-size: 32rpx;
  color: #2d3748;
  font-weight: 600;
  margin-bottom: 6rpx;
}

.profile-school-dept {
  font-size: 26rpx;
  color: #718096;
}

/* 统计信息 */
.profile-stats-container {
  padding: 0 30rpx;
  margin-top: 30rpx;
  margin-bottom: 30rpx;
}

.profile-stats {
  @include flex(row, space-around, center);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
  backdrop-filter: blur(20rpx);
  border-radius: 30rpx;
  padding: 40rpx 20rpx;
  box-shadow: 0 15rpx 40rpx rgba(0, 0, 0, 0.1), 0 5rpx 15rpx rgba(0, 0, 0, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2rpx;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  }
}

.profile-stat {
  @include flex(column, center, center);
  flex: 1;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 15rpx;
  border-radius: 20rpx;
  position: relative;

  &:active {
    transform: scale(0.95);
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  }

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0;
    top: 20%;
    bottom: 20%;
    width: 1rpx;
    background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.1) 50%, transparent 100%);
  }
}

.profile-stat-number {
  font-size: 48rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10rpx;
  line-height: 1;
}

.profile-stat-label {
  font-size: 26rpx;
  color: #718096;
  font-weight: 500;
}

/* 功能菜单 */
.profile-menu-container {
  padding: 0 30rpx;
  margin-bottom: 30rpx;
}

.profile-menu {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
  backdrop-filter: blur(20rpx);
  border-radius: 30rpx;
  box-shadow: 0 15rpx 40rpx rgba(0, 0, 0, 0.1), 0 5rpx 15rpx rgba(0, 0, 0, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  overflow: hidden;

  .menu-item {
    @include flex(row, space-between, center);
    padding: 32rpx 40rpx;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;

    &:not(:last-child)::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 88rpx;
      right: 40rpx;
      height: 1rpx;
      background: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.08) 20%, rgba(0, 0, 0, 0.08) 80%, transparent 100%);
    }

    &:active {
      background: linear-gradient(135deg, rgba(172, 146, 236, 0.08) 0%, rgba(91, 142, 249, 0.08) 100%);
      transform: scale(0.98);
    }
  }

  .menu-icon {
    width: 88rpx;
    height: 88rpx;
    @include center;
    border-radius: 22rpx;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%);
    box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.08);
    border: 1rpx solid rgba(255, 255, 255, 0.5);
  }

  .menu-content {
    flex: 1;
    margin-left: 32rpx;
    @include flex(column, center, flex-start);

    .menu-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #2D3748;
      margin-bottom: 6rpx;
      line-height: 1.2;
    }

    .menu-desc {
      font-size: 24rpx;
      color: #718096;
      line-height: 1.3;
    }
  }

  .menu-arrow {
    width: 40rpx;
    height: 40rpx;
    @include center;
    border-radius: 20rpx;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 100%);
    transition: all 0.3s ease;
  }

  .menu-item:active .menu-arrow {
    transform: translateX(4rpx);
    background: linear-gradient(135deg, rgba(172, 146, 236, 0.2) 0%, rgba(91, 142, 249, 0.2) 100%);
  }
}

/* 成就徽章 */
.profile-achievements {
  padding: 25rpx 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 20rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.8);
}

.achievements-scroll {
  overflow-x: auto;
  padding: 15rpx 0;
  width: 100%;
}

.achievements-content {
  @include flex(row, flex-start, center);
}

.achievement-item {
  @include flex(column, center, center);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  border-radius: 25rpx;
  padding: 20rpx;
  margin-right: 25rpx;
  width: 130rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  animation: achievementFadeIn 0.6s ease-out;
  animation-fill-mode: both;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: scale(0.95);
  }
}

@keyframes achievementFadeIn {
  from {
    opacity: 0;
    transform: translateY(30rpx) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.achievement-icon {
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 12rpx;
  border-radius: 50%;
}

.achievement-name {
  font-size: 24rpx;
  color: #2d3748;
  text-align: center;
  line-height: 1.4;
  height: 36rpx;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

/* 标签 */
.profile-tags {
  padding: 25rpx 30rpx;
}

.tags-scroll {
  overflow-x: auto;
  padding: 15rpx 0;
  width: 100%;
}

.tags-container {
  @include flex(row, flex-start, center);
  flex-wrap: nowrap;
}

.profile-tag {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  color: #667eea;
  font-size: 26rpx;
  border-radius: 20rpx;
  padding: 12rpx 24rpx;
  margin-right: 20rpx;
  white-space: nowrap;
  animation: tagFadeIn 0.5s ease-out;
  animation-fill-mode: both;
  border: 1rpx solid rgba(102, 126, 234, 0.2);
  backdrop-filter: blur(10rpx);
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: scale(0.95);
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%);
  }
}

@keyframes tagFadeIn {
  from {
    opacity: 0;
    transform: translateX(-20rpx) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* 内容区 */
.profile-content {
  flex: 1;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 50rpx 50rpx 0 0;
  overflow: hidden;
  margin-top: 30rpx;
  box-shadow: 0 -10rpx 30rpx rgba(0, 0, 0, 0.05);
}

/* 标签页 */
.profile-tabs {
  @include flex(row, space-around, center);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1rpx solid rgba(226, 232, 240, 0.8);
  position: relative;
  z-index: 10;
  padding: 10rpx 0;
}

.profile-tab {
  @include flex(column, center, center);
  position: relative;
  padding: 28rpx 0;
  flex: 1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.active {
    color: #667eea;
    font-weight: 600;

    .tab-text {
      transform: scale(1.05);
    }
  }

  &:active {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  }
}

.tab-text {
  font-size: 32rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #4a5568;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80rpx;
  height: 6rpx;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 3rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-50%) scaleX(0);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scaleX(1);
  }
}

/* 滑动区域 */
.profile-swiper {
  height: calc(100vh - 520rpx);
  width: 100%;
}

.profile-swiper-item {
  height: 100%;
  overflow: hidden;
}

.profile-scroll {
  height: 100%;
}

/* 帖子列表 */
.profile-posts {
  padding: 20rpx;
}

.post-list {
  @include flex(column, flex-start, stretch);
}

.post-card-item {
  margin-bottom: 30rpx;
  animation: slideInUp 0.6s ease-out forwards;
  animation-fill-mode: both;
  opacity: 0;
  transform: translateY(30rpx);
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: translateY(-2rpx);
    box-shadow: 0 6rpx 25rpx rgba(0, 0, 0, 0.1);
  }
}

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 收藏列表 */
.profile-likes {
  padding: 20rpx;
}

/* 加载更多 */
.load-more {
  @include flex(row, center, center);
  padding: 20rpx 0;
}

.load-more-text {
  font-size: $font-size-sm;
  color: $text-tertiary;
}

.no-more {
  @include flex(row, center, center);
  padding: 20rpx 0;
}

.no-more-text {
  font-size: $font-size-sm;
  color: $text-tertiary;
}

/* 空状态 */
.empty-container {
  @include flex(column, center, center);
  padding: 80rpx 0;
}

.empty-image {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: $font-size-md;
  color: $text-tertiary;
  margin-bottom: 30rpx;
}

.create-post, .discover-users {
  @include flex(row, center, center);
  background: linear-gradient(to right, $primary-color, $primary-light);
  border-radius: $radius-md;
  padding: 16rpx 40rpx;
  box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.2);
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.95);
    box-shadow: 0 2rpx 6rpx rgba($primary-color, 0.1);
  }
}

.create-post-text, .discover-users-text {
  font-size: $font-size-md;
  color: #fff;
  font-weight: 500;
}

/* 设置按钮容器 */
.profile-settings-container {
  position: fixed;
  top: 80rpx;
  right: 30rpx;
  z-index: 100;
}

/* 设置按钮 */
.profile-settings {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  @include flex(row, center, center);
  backdrop-filter: blur(20rpx);
  box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: scale(0.9);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.2) 100%);
  }
}

/* 加载骨架屏 */
.loading-skeleton {
  padding: 30rpx;
}

.skeleton-item {
  @include flex(row, flex-start, flex-start);
  margin-bottom: 40rpx;
  padding: 30rpx;
  background: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.skeleton-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
}

.skeleton-line {
  height: 24rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 12rpx;
  margin-bottom: 16rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.skeleton-line-title {
  width: 60%;
  height: 28rpx;
}

.skeleton-line-text {
  width: 100%;
}

.skeleton-line-short {
  width: 40%;
}

@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 空状态优化 */
.empty-state {
  @include flex(column, center, center);
  padding: 100rpx 30rpx;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  opacity: 0.6;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: $font-size-md;
  color: $text-tertiary;
  margin-bottom: 40rpx;
}

/* 安全区域 */
.safe-area {
  height: env(safe-area-inset-bottom);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}
</style> 