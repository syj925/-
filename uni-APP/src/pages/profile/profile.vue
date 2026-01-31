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
        <!-- 模糊效果已移除 -->
          
        <!-- 用户信息（覆盖在背景上） -->
        <view class="profile-info">
          <!-- 头像区域 -->
          <view class="profile-avatar-container" @tap="handleAvatarClick">
            <view class="profile-avatar-wrap">
              <image class="profile-avatar" :src="userInfo.avatar || '/static/images/common/default-avatar.png'" mode="aspectFill"></image>
              <view class="profile-avatar-glow"></view>
            </view>
          </view>
          
          <!-- 用户信息区域 -->
          <view class="profile-user-container">
            <!-- 用户昵称 -->
            <view class="profile-nickname">{{ userInfo.nickname || '游客' }}</view>
            
            <!-- 认证徽章标识 -->
            <view class="profile-badges-row" v-if="displayBadges.length > 0">
              <view 
                v-for="badge in displayBadges" 
                :key="badge.id"
                class="certification-badge"
                @longpress="showBadgeDetails(badge)"
                @touchstart="onBadgeTouchStart"
                @touchend="onBadgeTouchEnd"
              >
                <view class="cert-icon" :style="{backgroundColor: badge.color}">
                  <image class="cert-icon-svg" src="/static/images/badge-icon.svg" mode="aspectFit"></image>
                </view>
                <text class="cert-name">{{ badge.name }}</text>
              </view>
            </view>

            <!-- 用户ID和统计信息 -->
            <view class="profile-userid-stats-row">
              <view class="profile-userid-container" @tap="copyUserId">
                <text class="profile-userid-text">ID: {{ shortUserId }}</text>
              </view>
              <view class="profile-stats-text">
                <text class="stat-item" @tap="goToFollowList('following')">{{ formatNumber(userInfo.followingCount || 0) }} 关注</text>
                <text class="stat-item" @tap="goToFollowList('followers')">{{ formatNumber(userInfo.followersCount || 0) }} 粉丝</text>
                <text class="stat-item">{{ formatNumber(userInfo.likeCount || 0) }} 获赞</text>
              </view>
            </view>

            <!-- 用户简介 -->
            <view class="profile-bio" v-if="userInfo.bio">{{ userInfo.bio }}</view>
            
            <!-- 学校信息（文字形式） -->
            <view class="profile-school-text" v-if="userInfo.isLogin && (userInfo.school || userInfo.department)">
              {{ formatSchoolInfo(userInfo.school, userInfo.department) }}
            </view>
            
            <!-- 个人标签（融入用户信息区） -->
            <view class="profile-user-tags" v-if="userInfo.isLogin && userInfo.tags && userInfo.tags.length > 0">
              <view class="tags-container-inline">
                <view 
                  v-for="(tag, index) in displayedTags" 
                  :key="index" 
                  class="user-info-tag"
                  :class="{ 'tag-fade-in': true }"
                  :style="{
                    animationDelay: index * 0.05 + 's',
                    backgroundColor: getTagBackgroundColor(tag),
                    borderColor: getTagBorderColor(tag),
                    color: getTagTextColor(tag)
                  }"
                  @tap="openAllTagsPopup"
                >
                  <text class="tag-text">{{ getTagName(tag) }}</text>
                </view>
                
                <!-- 更多标签提示 -->
                <view 
                  v-if="userInfo.tags.length > maxDisplayTags"
                  class="user-info-tag more-tags-hint"
                  @tap="openAllTagsPopup"
                >
                  <text class="more-text">+{{ userInfo.tags.length - maxDisplayTags }}</text>
                </view>
              </view>
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
          <text class="tab-text">{{ tab.name }} {{ getTabCount(tab.key) }}</text>
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
          >
            <!-- 帖子统计信息 -->
            <view class="content-stats-header">
              <text class="stats-text">{{ userInfo.postCount || 0 }}个帖子</text>
            </view>
            
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
          >
            <!-- 收藏统计信息 -->
            <view class="content-stats-header">
              <text class="stats-text">{{ userInfo.favoriteCount || 0 }}个收藏</text>
            </view>
            
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
        
        <!-- 更多页 -->
        <swiper-item class="profile-swiper-item">
          <scroll-view 
            scroll-y 
            class="profile-scroll"
            refresher-enabled
            :refresher-triggered="false"
          >
            <view class="more-content">
              <view class="more-title">更多功能</view>
              
              <view class="more-options">
                <view class="more-option" @tap="goToMyEvents">
                  <view class="option-icon">
                    <app-icon name="calendar" size="lg" color="#AC92EC" />
                  </view>
                  <view class="option-info">
                    <view class="option-title">我的活动</view>
                    <view class="option-desc">查看活动报名记录</view>
                  </view>
                  <view class="option-arrow">
                    <app-icon name="arrow-right" size="sm" color="#999" />
                  </view>
                </view>
                
                <view class="more-option" @tap="goToAuditHistory">
                  <view class="option-icon">
                    <app-icon name="list" size="lg" color="#AC92EC" />
                  </view>
                  <view class="option-info">
                    <view class="option-title">审核记录</view>
                    <view class="option-desc">查看内容审核状态</view>
                  </view>
                  <view class="option-arrow">
                    <app-icon name="arrow-right" size="sm" color="#999" />
                  </view>
                </view>
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
    
    <!-- 徽章详情弹窗遮罩层 -->
    <view class="badge-modal-mask" v-if="showBadgeDetail" @tap="closeBadgeDetail">
      <view class="badge-detail-modal" @tap.stop>
        <view class="badge-detail-header">
          <view class="badge-large-icon" :style="{backgroundColor: selectedBadge?.color}">
            <image class="badge-large-icon-svg" src="/static/images/badge-icon.svg" mode="aspectFit"></image>
          </view>
          <text class="badge-large-name">{{ selectedBadge?.name }}</text>
          <view class="badge-rarity-tag" :class="selectedBadge?.rarity">
            {{ getRarityName(selectedBadge?.rarity) }}
          </view>
        </view>
        <view class="badge-detail-content">
          <text class="badge-description">{{ selectedBadge?.description || '暂无描述' }}</text>
          <view class="badge-grant-info" v-if="selectedBadge?.grantedAt">
            <text class="grant-time">获得时间：{{ formatTime(selectedBadge.grantedAt) }}</text>
          </view>
        </view>
        <view class="badge-detail-footer">
          <button class="close-btn" @tap="closeBadgeDetail">确定</button>
        </view>
      </view>
    </view>
    
    <!-- 完整标签列表弹窗 -->
    <view class="all-tags-modal-mask" v-if="showAllTagsPopup" @tap="closeAllTagsPopup">
      <view class="all-tags-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">个人标签</text>
          <text class="tag-count">{{ userInfo.tags?.length || 0 }}/8</text>
        </view>
        <view class="modal-content">
          <view class="all-tags-grid">
            <view 
              v-for="(tag, index) in userInfo.tags" 
              :key="index" 
              class="modal-tag"
              :style="{
                backgroundColor: getTagBackgroundColor(tag),
                borderColor: getTagBorderColor(tag),
                color: getTagTextColor(tag)
              }"
            >
              <text class="modal-tag-text">{{ getTagName(tag) }}</text>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="close-btn" @tap="closeAllTagsPopup">关闭</button>
        </view>
      </view>
    </view>
    
    <!-- 标签详情弹窗遮罩层 -->
    <view class="tag-modal-mask" v-if="showTagPopup" @tap="closeTagDetail">
      <view class="tag-detail-modal" :style="tagModalStyle" @tap.stop>
        <view class="tag-detail-header">
          <view class="tag-large-icon">
            <text class="tag-icon-text">#</text>
          </view>
          <text class="tag-large-name">{{ selectedTag }}</text>
          <view class="tag-type-badge">兴趣标签</view>
        </view>
        <view class="tag-detail-content">
          <text class="tag-description">这是我的个人兴趣标签，代表了我的爱好和特长。</text>
          <view class="tag-stats">
            <view class="tag-stat-item">
              <text class="tag-stat-label">我的标签</text>
              <text class="tag-stat-value">{{ userInfo.tags?.length || 0 }}/8</text>
            </view>
          </view>
        </view>
        <view class="tag-detail-footer">
          <button class="tag-close-btn" @tap="closeTagDetail">确定</button>
        </view>
      </view>
    </view>
    
    <!-- 底部安全区占位 -->
    <view class="safe-area"></view>
  </view>
</template>

<script>
import { useUserStore } from '@/stores';
import PostList from '@/components/post/PostList.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { UrlUtils } from '@/utils';
import PostCard from '@/components/post/PostCard.vue';
// 移除组件导入
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
      userAchievements: [], // 保持兼容性
      userBadges: [], // 用户徽章数据
      selectedBadge: null, // 当前选中的徽章（用于详情弹窗）
      showBadgeDetail: false, // 是否显示徽章详情弹窗
      selectedTag: null, // 当前选中的标签
      showTagPopup: false, // 是否显示标签详情弹窗
      tagModalStyle: {}, // 标签弹窗样式（用于动画）
      showFullUserId: false, // 是否显示完整用户ID
      showAllTagsPopup: false, // 是否显示完整标签列表弹窗
      maxDisplayTags: 2, // 默认显示的标签数量
      tabs: [
        { key: 'post', name: '帖子' },
        { key: 'favorite', name: '收藏' },
        { key: 'more', name: '更多' }
      ],
      currentTab: 'post',
      tabIndex: 0,
      
      // 帖子数据
      posts: [],
      postPage: 1,
      postPageSize: 100, // 增加到100，覆盖更多用户
      postHasMore: true,
      postLoading: false,
      
      // 收藏数据
      likes: [],
      likePage: 1,
      likePageSize: 100, // 增加到100，覆盖更多用户
      likeHasMore: true,
      likeLoading: false,

      // 活动和审核记录数据已移动到各自的组件中
      
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
    },
    
    // 显示的徽章（最多3个）
    displayBadges() {
      if (!this.userInfo.isLogin || !this.userBadges.length) {
        return [];
      }
      return this.userBadges.slice(0, 3); // 最多显示3个认证徽章
    },
    
    // 显示的标签（固定显示2个）
    displayedTags() {
      if (!this.userInfo.tags || !this.userInfo.tags.length) {
        return [];
      }
      
      return this.userInfo.tags.slice(0, this.maxDisplayTags); // 固定显示前2个
    },
    
    // 缩短的用户ID
    shortUserId() {
      const id = this.userInfo.userId || '';
      if (id.length <= 12) return id;
      return id.substring(0, 8) + '...';
    }
  },
  onLoad() {
    // 初始化 Pinia 用户状态
    this.userStore = useUserStore();

    // 1) 先用本地持久化的 userStore 数据渲染（离线也能显示）
    this.syncFromUserStore();

    // 2) 再尝试静默刷新最新用户资料（网络失败不应清空本地资料）
    this.userStore.fetchUserProfile().finally(() => {
      this.syncFromUserStore();
      if (this.userInfo.isLogin) {
        this.refreshCurrentTab();
      }
    });
  },
  onShow() {
    // 页面显示时：先从 userStore 恢复显示
    if (!this.userStore) {
      this.userStore = useUserStore();
    }
    this.syncFromUserStore();

    // 若有网络则刷新一次用户资料（失败不降级为游客）
    this.userStore.fetchUserProfile().finally(() => {
      this.syncFromUserStore();
      if (this.userInfo.isLogin) {
        this.refreshCurrentTab();
      }
    });

    // 检查全局强制刷新标记
    const app = getApp();
    if (app.globalData && app.globalData.forceRefresh) {

      this.userStore.fetchUserProfile().finally(() => {
        this.syncFromUserStore();
      });
      app.globalData.forceRefresh = false;
    }
  },
  onPullDownRefresh() {
    // 只有登录后才刷新内容
    if (this.userInfo.isLogin) {
      this.refreshCurrentTab();
    }
    setTimeout(() => {
      uni.stopPullDownRefresh();
    }, 1000);
  },
  onReachBottom() {
    // 未登录时不加载更多
    if (!this.userInfo.isLogin) {
      return;
    }
    
    // 根据当前选中的标签页触发对应的加载更多
    if (this.tabIndex === 0) {
      // 我的帖子
      this.loadMorePosts();
    } else if (this.tabIndex === 1) {
      // 我的收藏
      this.loadMoreLikes();
    }
    // 注意：活动和审核记录页面不需要加载更多功能
  },
  methods: {
    // 从 userStore 同步渲染数据到本页面（页面内仍使用 userInfo 作为展示模型，避免大范围改模板）
    syncFromUserStore() {
      const token = this.userStore?.token;
      const storeUser = this.userStore?.userInfo;

      // 未登录：游客模式
      if (!token) {
        this.userInfo = {
          isLogin: false,
          avatar: '/static/images/common/default-avatar.png',
          nickname: '游客',
          userId: '',
          bio: '点击登录，开启精彩校园生活',
          school: '',
          department: '',
          backgroundImage: 'linear-gradient(135deg, #2b85e4 0%, #6ba7f0 100%)',
          postCount: 0,
          likeCount: 0,
          favoriteCount: 0,
          followingCount: 0,
          followersCount: 0,
          tags: []
        };
        return;
      }

      // 已登录：优先使用 store 的用户信息（离线也可显示）
      const userData = storeUser || {};
      const stats = userData.stats || {};

      this.userInfo = {
        isLogin: true,
        avatar: UrlUtils.ensureImageUrl(userData.avatar),
        nickname: userData.nickname || userData.username,
        userId: userData.id,
        bio: userData.bio || '这个人很懒，还没有填写个人简介',
        school: userData.school || '',
        department: userData.department || '',
        backgroundImage: userData.backgroundImage
          ? UrlUtils.ensureAbsoluteUrl(userData.backgroundImage)
          : 'linear-gradient(135deg, #2b85e4 0%, #6ba7f0 100%)',
        postCount: stats.postCount || 0,
        likeCount: stats.likeCount || 0,
        favoriteCount: stats.favoriteCount || 0,
        followingCount: stats.followCount || 0,
        followersCount: stats.fansCount || 0,
        tags: userData.tags || []
      };

      // 额外同步：如果 userStore 暂无完整信息，避免 avatar 为空导致 UI 闪烁
      if (!this.userInfo.avatar) {
        this.userInfo.avatar = '/static/images/common/default-avatar.png';
      }

      // 登录态下才加载徽章
      this.loadUserBadges();
    },
    
    // 加载用户徽章
    loadUserBadges() {
      if (!this.userInfo.isLogin || !this.userInfo.userId) {
        return;
      }
      
      api.badge.getUserBadges(this.userInfo.userId, {
        includeHidden: false, // 只显示可见的徽章
        type: 'achievement' // 只显示成就类型的徽章
      }).then(res => {

        if (res.success && res.data) {
          this.userBadges = res.data.map(userBadge => {
            return {
              id: userBadge.id,
              name: userBadge.badge.name,
              description: userBadge.badge.description,
              color: userBadge.badge.color,
              rarity: userBadge.badge.rarity,
              type: userBadge.badge.type,
              grantedAt: userBadge.granted_at,
              displayOrder: userBadge.display_order,
              badge: userBadge.badge
            };
          });
          
          // 更新现有的userAchievements以保持兼容性
          this.userAchievements = this.userBadges.map(badge => ({
            name: badge.name,
            description: badge.description
          }));

        }
      }).catch(err => {
        console.error('获取用户徽章失败:', err);
      });
    },
    
    // 显示徽章详情
    showBadgeDetails(badge) {

      this.selectedBadge = badge;
      this.showBadgeDetail = true;
    },
    
    // 关闭徽章详情弹窗
    closeBadgeDetail() {
      this.showBadgeDetail = false;
      this.selectedBadge = null;
    },
    
    // 徽章触摸开始
    onBadgeTouchStart() {
      // 这里可以添加触摸反馈，比如轻微的动画
    },
    
    // 徽章触摸结束
    onBadgeTouchEnd() {
      // 这里可以添加触摸结束的处理
    },
    
    // 切换用户ID显示
    toggleUserId() {
      this.showFullUserId = !this.showFullUserId;
    },
    
    // 复制用户ID
    copyUserId() {
      const userId = this.userInfo.userId;
      if (!userId) return;
      
      uni.setClipboardData({
        data: userId,
        success: () => {
          uni.showToast({
            title: 'ID已复制',
            icon: 'success',
            duration: 1500
          });
        },
        fail: () => {
          uni.showToast({
            title: '复制失败',
            icon: 'none'
          });
        }
      });
    },

    // 获取标签页数量（已移除所有计数显示）
    getTabCount(tabKey) {
      return '';
    },
    
    // 显示标签详情（带放大动画）
    showTagDetail(tag, event) {
      this.selectedTag = tag;
      
      // 获取点击元素的位置信息
      const query = uni.createSelectorQuery().in(this);
      query.selectAll('.profile-tag').boundingClientRect((rects) => {
        if (rects && rects.length > 0) {
          // 找到被点击的标签元素
          const tagIndex = this.userInfo.tags.indexOf(tag);
          const rect = rects[tagIndex];
          
          if (rect) {
            // 计算弹窗初始位置（从点击位置开始）
            this.tagModalStyle = {
              transformOrigin: `${rect.left + rect.width/2}px ${rect.top + rect.height/2}px`,
              opacity: 0,
              transform: 'scale(0.3)'
            };
            
            this.showTagPopup = true;
            
            // 延迟执行动画
            this.$nextTick(() => {
              setTimeout(() => {
                this.tagModalStyle = {
                  transformOrigin: `${rect.left + rect.width/2}px ${rect.top + rect.height/2}px`,
                  opacity: 1,
                  transform: 'scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                };
              }, 50);
            });
          }
        }
      }).exec();
    },
    
    // 关闭标签详情弹窗
    closeTagDetail() {
      // 先执行缩小动画
      this.tagModalStyle = {
        ...this.tagModalStyle,
        opacity: 0,
        transform: 'scale(0.3)',
        transition: 'all 0.2s ease-in'
      };
      
      // 动画结束后隐藏弹窗
      setTimeout(() => {
        this.showTagPopup = false;
        this.selectedTag = null;
        this.tagModalStyle = {};
      }, 200);
    },
    
    // 显示完整标签列表弹窗
    openAllTagsPopup() {
      this.showAllTagsPopup = true;
    },
    
    // 关闭完整标签列表弹窗
    closeAllTagsPopup() {
      this.showAllTagsPopup = false;
    },
    
    // 获取标签名称（处理对象和字符串）
    getTagName(tag) {
      return typeof tag === 'object' ? tag.name : tag;
    },
    
    // 获取标签背景颜色（半透明）
    getTagBackgroundColor(tag) {
      if (typeof tag === 'object' && tag.color) {
        // 处理rgba格式
        if (tag.color.includes('rgba(')) {
          const values = tag.color.match(/\d+/g);
          if (values && values.length >= 3) {
            return `rgba(${values[0]}, ${values[1]}, ${values[2]}, 0.2)`;
          }
        }
        // 处理rgb格式
        if (tag.color.includes('rgb(')) {
          const values = tag.color.match(/\d+/g);
          if (values && values.length >= 3) {
            return `rgba(${values[0]}, ${values[1]}, ${values[2]}, 0.2)`;
          }
        }
        // 处理十六进制颜色
        if (tag.color.startsWith('#')) {
          const r = parseInt(tag.color.slice(1, 3), 16);
          const g = parseInt(tag.color.slice(3, 5), 16);
          const b = parseInt(tag.color.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, 0.2)`;
        }
      }
      
      // 默认半透明白色背景
      return 'rgba(255, 255, 255, 0.25)';
    },
    
    // 获取标签边框颜色
    getTagBorderColor(tag) {
      if (typeof tag === 'object' && tag.color) {
        // 处理rgba格式
        if (tag.color.includes('rgba(')) {
          const values = tag.color.match(/\d+/g);
          if (values && values.length >= 3) {
            return `rgba(${values[0]}, ${values[1]}, ${values[2]}, 0.4)`;
          }
        }
        // 处理rgb格式
        if (tag.color.includes('rgb(')) {
          const values = tag.color.match(/\d+/g);
          if (values && values.length >= 3) {
            return `rgba(${values[0]}, ${values[1]}, ${values[2]}, 0.4)`;
          }
        }
        // 处理十六进制颜色
        if (tag.color.startsWith('#')) {
          const r = parseInt(tag.color.slice(1, 3), 16);
          const g = parseInt(tag.color.slice(3, 5), 16);
          const b = parseInt(tag.color.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, 0.4)`;
        }
      }
      
      // 默认边框颜色
      return 'rgba(255, 255, 255, 0.3)';
    },
    
    // 获取标签文字颜色
    getTagTextColor(tag) {
      if (typeof tag === 'object' && tag.color) {
        // 直接返回原始颜色作为文字颜色
        return tag.color;
      }
      // 默认白色文字（适配深色背景）
      return 'rgba(255, 255, 255, 0.95)';
    },
    
    
    // 获取稀有度样式类
    getRarityClass(rarity) {
      return `rarity-${rarity}`;
    },
    
    // 获取稀有度名称
    getRarityName(rarity) {
      const names = {
        common: '普通',
        rare: '稀有',
        epic: '史诗',
        legendary: '传奇'
      };
      return names[rarity] || '未知';
    },
    
    // 点击头像处理
    handleAvatarClick() {
      if (!this.userInfo.isLogin) {
        // 未登录，引导登录
        uni.showModal({
          title: '提示',
          content: '登录后查看更多精彩内容',
          confirmText: '去登录',
          cancelText: '暂不登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/auth/login/index'
              });
            }
          }
        });
        return;
      }
      
      // 已登录，编辑资料
      this.editProfile();
    },
    
    // 编辑个人资料
    editProfile() {
      if (!this.userInfo.isLogin) {
        uni.navigateTo({
          url: '/pages/auth/login/index'
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
      if (tab === 'post' || tab === 'favorite') {
        this.activeTab = tab === 'post' ? 'post' : 'favorite';
        this.changeTab(this.activeTab);
      }
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
        case 'more':
          // 更多页面无需刷新
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
      this.postPage = 1;
      this.loadPosts();

      // 兼容原始功能
      this.refreshing = true;
      this.page = 1;
    },
    
    loadPosts() {
      if (this.postLoading) return;
      
      // 未登录时不加载帖子
      if (!this.userInfo.isLogin) {

        return;
      }
      
      this.postLoading = true;
      
      // 调用API获取用户发布的帖子
      api.user.getPosts(this.postPage, this.postPageSize, 'published').then(res => {

        if (res.code === 0 || res.code === 200) {
          const postsData = res.data.list || res.data.items || res.data.posts || [];
          const total = res.data.total || 0;

          // 🔧 修复：对个人主页的帖子数据进行字段映射（旧版本API兼容）
          const processedPosts = postsData.map(post => {

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
        
        // 兼容原始功能
        this.loading = false;
        this.refreshing = false;
        this.finished = !this.postHasMore;
      }).catch(err => {
        console.error('获取用户帖子失败:', err);
        this.postLoading = false;
        
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
      this.likePage = 1;
      this.loadLikes();
    },
    
    loadLikes() {
      if (this.likeLoading) return;
      
      // 未登录时不加载收藏
      if (!this.userInfo.isLogin) {

        return;
      }
      
      this.likeLoading = true;
      
      // 调用API获取用户收藏
      api.user.getFavorites(this.likePage, this.likePageSize).then(res => {

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
        
        // 兼容原始功能
        this.loadingFav = false;
        this.finishedFav = !this.likeHasMore;
      }).catch(err => {
        console.error('获取用户收藏失败:', err);
        this.likeLoading = false;
        
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

      if (!num || num === 0) return '0';

      if (num >= 10000) {
        return (num / 10000).toFixed(1).replace(/\.0$/, '') + 'w';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
      }

      return num.toString();
    },
    
    // 格式化学校信息
    formatSchoolInfo(school, department) {
      if (school && department) {
        return `${school}${department}`;
      } else if (school) {
        return school;
      } else if (department) {
        return department;
      }
      return '';
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
          url: '/pages/auth/login/index'
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
      
      // 未登录时不加载内容
      if (!this.userInfo.isLogin) {
        return;
      }
      
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
      // 未登录时不刷新
      if (!this.userInfo.isLogin) {
        return;
      }
      
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
        url: '/pages/auth/login/index'
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

    // 跳转到我的活动页面
    goToMyEvents() {
      uni.navigateTo({
        url: '/pages/event/my-events'
      });
    },

    // 跳转到审核记录页面
    goToAuditHistory() {
      uni.navigateTo({
        url: '/pages/profile/audit-history'
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
  margin-bottom: 0;
  padding-bottom: 0;
}

/* 封面背景 */
.profile-cover {
  position: relative;
  height: 690rpx; /* 增加高度以适应标签内容 */
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
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.05) 100%);
  z-index: 1;
}

.profile-bottom-blur {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 220rpx;
  background: linear-gradient(to top,
    rgba(255, 255, 255, 0.75) 0%,
    rgba(255, 255, 255, 0.68) 15%,
    rgba(255, 255, 255, 0.58) 30%,
    rgba(255, 255, 255, 0.45) 45%,
    rgba(255, 255, 255, 0.32) 60%,
    rgba(255, 255, 255, 0.20) 75%,
    rgba(255, 255, 255, 0.10) 88%,
    transparent 100%);
  pointer-events: none;
  z-index: 2;
}

/* 用户信息 */
.profile-info {
  position: absolute;
  bottom: 40rpx; /* 进一步减少底部距离，整体向下移动 */
  left: 0;
  right: 0;
  @include flex(column, flex-start, flex-start);
  padding: 0 30rpx;
  z-index: 10;
  background: transparent;
  text-align: left;
}

.profile-avatar-container {
  position: relative;
  margin-bottom: 16rpx; /* 头像下方间距 */
  width: 150rpx; /* 适度放大头像 */
  height: 150rpx; /* 适度放大头像 */
  align-self: flex-start; /* 头像左对齐 */
}

.profile-avatar-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 15rpx 35rpx rgba(0, 0, 0, 0.2), 0 5rpx 15rpx rgba(0, 0, 0, 0.1);
}

.profile-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  @include flex(column, flex-start, flex-start);
  width: 100%;
  text-align: left;
}

.profile-nickname {
  font-size: 40rpx; /* 稍微缩小字体 */
  color: #ffffff;
  font-weight: 700;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.8), 0 0 20rpx rgba(0, 0, 0, 0.5);
  letter-spacing: 1rpx;
  margin-bottom: 8rpx;
  margin-left: 30rpx; /* 只有名字往右移动 */
  /* 处理溢出 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 30rpx); /* 调整最大宽度以适应左边距 */
}

/* 徽章行样式 */
.profile-badges-row {
  @include flex(row, flex-start, center);
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

/* 认证徽章样式 */
.certification-badge {
  @include flex(row, flex-start, center);
  background: rgba(255, 255, 255, 0.15);
  /* backdrop-filter: blur(10rpx); 模糊效果已移除 */
  border-radius: 20rpx;
  padding: 6rpx 12rpx;
  margin-right: 12rpx;
  margin-bottom: 8rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.25);
  }
}

.cert-icon {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  @include flex(row, center, center);
  margin-right: 8rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.2);
}

.cert-icon-svg {
  width: 24rpx;
  height: 24rpx;
}

.cert-name {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
  text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.5);
  max-width: 120rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 用户ID和统计信息行 */
.profile-userid-stats-row {
  margin-bottom: 12rpx;
  @include flex(row, space-between, center);
  align-items: center;
  width: 100%;
}

.profile-userid-container {
  @include flex(row, flex-start, center);
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.profile-userid-text {
  font-size: 24rpx;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.4);
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
  text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.6);
  transition: all 0.3s ease;
  
  &:active {
    background: rgba(0, 0, 0, 0.6);
  }
}

.profile-stats-text {
  @include flex(row, flex-end, center);
  gap: 20rpx;
  flex-shrink: 0;
}

.stat-item {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.6);
  transition: all 0.3s ease;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.3);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  
  &:active {
    color: rgba(255, 255, 255, 1);
    background: rgba(0, 0, 0, 0.5);
    transform: scale(0.95);
  }
}

.copy-hint {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.3);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  animation: fadeInUp 0.3s ease;
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

/* 学校信息文字样式 */
.profile-school-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 8rpx;
  line-height: 1.4;
  max-width: 100%;
  background: rgba(0, 0, 0, 0.3);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.6);
  display: inline-block;
}





/* 学校信息 */
  /* 删除了独立的学校信息显示区域样式 */

/* 统计信息 */
.profile-stats {
  position: relative;
  padding: 30rpx 30rpx 20rpx 30rpx; /* 底部padding减少 */
  background: rgba(255, 255, 255, 1); /* 白色背景 */
  border-radius: 50rpx 50rpx 0 0; /* 顶部圆角 */
  z-index: 1;
  @include flex(row, space-around, center);
  /* backdrop-filter: blur(20rpx); 模糊效果已移除 */
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
  position: relative;
  padding: 0 30rpx 30rpx 30rpx; /* 底部padding增加 */
  background: rgba(255, 255, 255, 1); /* 白色背景 */
  border-radius: 0 0 50rpx 50rpx; /* 底部圆角 */
  margin-bottom: 30rpx;
  z-index: 1;
}

.profile-menu {
  background: transparent; /* 透明背景，使用父容器的白色背景 */
  /* backdrop-filter: blur(20rpx); 模糊效果已移除 */
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

/* 旧徽章样式已删除，使用认证标识样式 */

/* 删除section相关样式 */

/* 删除achievements相关样式 */

.achievement-item {
  @include flex(column, center, center);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  border-radius: 25rpx;
  padding: 20rpx;
  margin-right: 25rpx;
  width: 130rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  /* backdrop-filter: blur(10rpx); 模糊效果已移除 */
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  animation: achievementFadeIn 0.6s ease-out;
  animation-fill-mode: both;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &:active {
    transform: scale(0.95);
  }
  
  /* 稀有度发光效果 */
  &.rarity-rare {
    box-shadow: 0 10rpx 30rpx rgba(70, 130, 180, 0.3);
  }
  
  &.rarity-epic {
    box-shadow: 0 10rpx 30rpx rgba(138, 43, 226, 0.3);
  }
  
  &.rarity-legendary {
    box-shadow: 0 10rpx 30rpx rgba(255, 215, 0, 0.4);
    animation: achievementFadeIn 0.6s ease-out, legendaryGlow 2s ease-in-out infinite alternate;
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

@keyframes legendaryGlow {
  from {
    box-shadow: 0 10rpx 30rpx rgba(255, 215, 0, 0.4);
  }
  to {
    box-shadow: 0 15rpx 40rpx rgba(255, 215, 0, 0.6);
  }
}

.badge-icon-container {
  position: relative;
  margin-bottom: 12rpx;
}

.badge-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  @include flex(row, center, center);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.badge-icon-text {
  font-size: 36rpx;
  color: white;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
}

.rarity-indicator {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  border: 2rpx solid white;
  
  &.common {
    background: #95a5a6;
  }
  
  &.rare {
    background: #3498db;
  }
  
  &.epic {
    background: #9b59b6;
  }
  
  &.legendary {
    background: linear-gradient(45deg, #f1c40f, #f39c12);
    animation: legendaryPulse 1.5s ease-in-out infinite;
  }
}

@keyframes legendaryPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
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

/* 用户信息区域的标签 */
.profile-user-tags {
  margin-top: 10rpx;
  width: 100%;
}

.tags-container-inline {
  display: flex;
  flex-wrap: nowrap; /* 不换行，保证在一行内显示 */
  gap: 12rpx;
  align-items: center;
  max-width: 400rpx; /* 限制最大宽度，保留右边空间 */
  overflow: hidden; /* 超出部分隐藏 */
}

.user-info-tag {
  background: rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.95);
  font-size: 22rpx;
  border-radius: 16rpx;
  padding: 8rpx 16rpx;
  white-space: nowrap;
  animation: tagFadeIn 0.5s ease-out;
  animation-fill-mode: both;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10rpx);
  -webkit-backdrop-filter: blur(10rpx);
  
  .tag-text {
    display: inline-block;
    text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
  }
  
  &.more-tags-hint {
    background: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.8);
    border-color: rgba(255, 255, 255, 0.2);
    cursor: pointer;
    flex-shrink: 0; /* 不被压缩 */
    
    .more-text {
      font-size: 20rpx;
      opacity: 0.8;
    }
    
    &:active {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(0.95);
    }
  }

  &:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.35);
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

.tag-fade-in {
  animation: tagFadeIn 0.5s ease-out;
  animation-fill-mode: both;
}

/* 完整标签列表弹窗 */
.all-tags-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 9999;
  @include flex(row, center, center);
}

.all-tags-modal {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  width: 600rpx;
  max-height: 80vh;
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: modalFadeIn 0.3s ease-out;
}

.modal-header {
  padding: 30rpx 40rpx 20rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.1);
  @include flex(row, space-between, center);
  
  .modal-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
  }
  
  .tag-count {
    font-size: 24rpx;
    color: #666;
    background: rgba(74, 144, 226, 0.1);
    padding: 8rpx 16rpx;
    border-radius: 12rpx;
    border: 1rpx solid rgba(74, 144, 226, 0.2);
  }
}

.modal-content {
  padding: 30rpx 40rpx;
  max-height: 400rpx;
  overflow-y: auto;
}

.all-tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.modal-tag {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  font-size: 26rpx;
  border-radius: 20rpx;
  padding: 12rpx 20rpx;
  border: 1rpx solid rgba(102, 126, 234, 0.2);
  font-weight: 500;
  
  .modal-tag-text {
    display: inline-block;
  }
}

.modal-footer {
  padding: 20rpx 40rpx 30rpx;
  border-top: 1rpx solid rgba(0, 0, 0, 0.1);
  @include flex(row, center, center);
  
  .close-btn {
    background: none;
    color: #666;
    border: 1rpx solid #ddd;
    border-radius: 20rpx;
    padding: 16rpx 40rpx;
    font-size: 28rpx;
    font-weight: normal;
    @include flex(row, center, center);
    text-align: center;
    min-width: 120rpx;
    
    &:active {
      background: #f5f5f5;
      transform: scale(0.95);
    }
  }
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 内容区 */
.profile-content {
  flex: 1;
  background: rgba(255, 255, 255, 1);
  border-radius: 0;
  overflow: hidden;
  margin-top: 0;
}

/* 标签页 */
.profile-tabs {
  @include flex(row, space-around, center);
  background: rgba(255, 255, 255, 1);
  position: relative;
  z-index: 10;
  padding: 0 0 20rpx 0;
}

.profile-tab {
  @include flex(column, center, center);
  position: relative;
  padding: 28rpx 0;
  flex: 1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.active {
    color: #333333;
    font-weight: bold;

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
  background: #333333;
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
  position: relative;
  height: calc(100vh - 640rpx);
  width: 100%;
  z-index: 1;
}

.profile-swiper-item {
  height: 100%;
  overflow: hidden;
}

.profile-scroll {
  height: 100%;
}

/* 内容统计信息头部 */
.content-stats-header {
  padding: 20rpx 30rpx 10rpx 30rpx;
  background: rgba(255, 255, 255, 1);
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);
}

.stats-text {
  font-size: 24rpx;
  color: #999999;
  font-weight: 400;
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
  color: rgba(255, 255, 255, 0.8);
}

.no-more {
  @include flex(row, center, center);
  padding: 20rpx 0;
}

.no-more-text {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.8);
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
  color: rgba(255, 255, 255, 0.8);
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
  /* backdrop-filter: blur(20rpx); 模糊效果已移除 */
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
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 40rpx;
}

/* 徽章详情弹窗 */
.badge-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  @include flex(row, center, center);
  z-index: 9999;
  animation: fadeIn 0.3s ease-out;
}

.badge-detail-modal {
  width: 600rpx;
  background: white;
  border-radius: 30rpx;
  padding: 40rpx;
  text-align: center;
  animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
  /* backdrop-filter: blur(20rpx); 模糊效果已移除 */
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(50rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.badge-detail-header {
  margin-bottom: 30rpx;
}

.badge-large-icon {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  @include flex(row, center, center);
  margin: 0 auto 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
}

.badge-large-icon-svg {
  width: 80rpx;
  height: 80rpx;
}

.badge-large-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.badge-rarity-tag {
  display: inline-block;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  color: white;
  font-weight: 500;
  
  &.common {
    background: #95a5a6;
  }
  
  &.rare {
    background: #3498db;
  }
  
  &.epic {
    background: #9b59b6;
  }
  
  &.legendary {
    background: linear-gradient(45deg, #f1c40f, #f39c12);
  }
}

.badge-detail-content {
  margin: 30rpx 0;
}

.badge-description {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.badge-grant-info {
  margin-top: 20rpx;
}

.grant-time {
  font-size: 24rpx;
  color: #999;
}

.badge-detail-footer {
  margin-top: 30rpx;
}

.close-btn {
  width: 200rpx;
  height: 70rpx;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 35rpx;
  font-size: 28rpx;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.95);
    background: #0056cc;
  }
}

/* 标签详情弹窗 */
.tag-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  @include flex(row, center, center);
  z-index: 9998;
}

.tag-detail-modal {
  width: 600rpx;
  background: white;
  border-radius: 30rpx;
  padding: 40rpx;
  text-align: center;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
  /* backdrop-filter: blur(20rpx); 模糊效果已移除 */
}

.tag-detail-header {
  margin-bottom: 30rpx;
}

.tag-large-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  @include flex(row, center, center);
  margin: 0 auto 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.3);
}

.tag-icon-text {
  font-size: 48rpx;
  color: white;
  font-weight: bold;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
}

.tag-large-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.tag-type-badge {
  display: inline-block;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  color: white;
  font-weight: 500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.tag-detail-content {
  margin: 30rpx 0;
}

.tag-description {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.tag-stats {
  margin-top: 20rpx;
}

.tag-stat-item {
  @include flex(row, space-between, center);
  padding: 12rpx 0;
}

.tag-stat-label {
  font-size: 24rpx;
  color: #999;
}

.tag-stat-value {
  font-size: 24rpx;
  color: #667eea;
  font-weight: 600;
}

.tag-detail-footer {
  margin-top: 30rpx;
}

.tag-close-btn {
  width: 200rpx;
  height: 70rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 35rpx;
  font-size: 28rpx;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.95);
    opacity: 0.8;
  }
}

/* 安全区域 */
.safe-area {
  height: env(safe-area-inset-bottom);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

/* 更多页面样式 */
.more-content {
  padding: 40rpx 30rpx;
}

.more-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 40rpx;
  text-align: center;
}

.more-options {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.more-option {
  @include flex(row, flex-start, center);
  padding: 30rpx;
  position: relative;
  transition: background-color 0.3s ease;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 100rpx;
    right: 30rpx;
    height: 1rpx;
    background-color: rgba(0, 0, 0, 0.06);
  }

  &:active {
    background-color: rgba(172, 146, 236, 0.1);
  }
}

.option-icon {
  width: 60rpx;
  height: 60rpx;
  @include center;
  background: rgba(172, 146, 236, 0.1);
  border-radius: 16rpx;
  margin-right: 20rpx;
}

.option-info {
  flex: 1;
}

.option-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 6rpx;
}

.option-desc {
  font-size: 24rpx;
  color: #999;
}

.option-arrow {
  margin-left: 20rpx;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 
