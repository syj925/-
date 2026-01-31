<template>
  <view class="user-profile">


    <!-- 页面内容 -->
    <scroll-view 
      class="content-scroll" 
      scroll-y 
      :style="{ height: scrollViewHeight + 'px' }"
      @scrolltolower="loadMorePosts"
    >
      <!-- 用户信息卡片（参考 profile.vue 的头部视觉） -->
      <view class="user-profile-header" v-if="!loading">
        <!-- 顶部背景区域 -->
        <view class="header-background">
          <!-- 背景图片或渐变 -->
          <image
            v-if="userInfo.background_image && !safeBackgroundUrl.includes('gradient')"
            class="profile-bg"
            :src="safeBackgroundUrl"
            mode="aspectFill"
          ></image>
          <view
            v-else
            class="bg-primary gradient-bg"
            :style="{ background: safeBackgroundUrl }"
          ></view>
          <view class="profile-overlay"></view>

          <!-- 半透明操作按钮（在背景图上） -->
          <view class="background-action-bar" :style="{ paddingTop: statusBarHeight + 9 + 'px' }">
            <view class="bg-action-btn" @click="goBack">
              <app-icon name="arrow-left" size="sm" color="#fff" />
            </view>
            <view class="bg-action-btn" @click="showMoreActions">
              <app-icon name="more" size="sm" color="#fff" />
            </view>
          </view>
          <view class="bg-decoration">
            <view class="decoration-circle circle-1"></view>
            <view class="decoration-circle circle-2"></view>
            <view class="decoration-circle circle-3"></view>
          </view>
          <!-- 背景与内容边界模糊过渡 -->
          <!-- 模糊效果已移除 -->

          <!-- 信息行：头像 + 基本信息（覆盖在背景图上） -->
        <view class="header-info-row">
          <!-- 用户头像区域 -->
          <view class="avatar-section">
                <image
                  :src="safeAvatarUrl"
                  class="user-avatar"
                  mode="aspectFill"
                />
              <view class="avatar-status" v-if="userInfo.isOnline">
                <view class="status-dot"></view>
            </view>
          </view>

          <!-- 用户信息区域 -->
          <view class="user-info-section">
              <!-- 用户昵称和操作按钮行 -->
              <view class="nickname-action-row">
                <view class="profile-nickname">{{ userInfo.nickname || userInfo.username }}</view>
                <!-- 操作按钮 -->
                <view class="inline-action-buttons" v-if="!userInfo.followStatus?.isCurrentUser">
                  <button
                    class="inline-follow-btn"
                    :class="{ 'followed': currentFollowStatus }"
                    @click="toggleFollow"
                    :disabled="followLoading"
                  >
                    <text class="inline-btn-text">{{ followButtonText }}</text>
                  </button>

                  <button class="inline-message-btn" @click="sendMessage">
                    <text class="inline-btn-text">私信</text>
                  </button>
                </view>
            </view>

              <!-- 徽章和标签水平排列 -->
              <view class="badges-tags-row" v-if="displayBadges.length > 0 || (userInfo.tags && userInfo.tags.length > 0)">
                <!-- 认证徽章部分 -->
                <view class="badges-section" v-if="displayBadges.length > 0">
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

                <!-- 占位符（如果没有徽章但有标签） -->
                <view class="badges-section" v-else-if="userInfo.tags && userInfo.tags.length > 0">
                  <!-- 空的徽章占位 -->
                </view>

                <!-- 个人标签部分 -->
                <view class="tags-section" v-if="userInfo.tags && userInfo.tags.length > 0">
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
                  </view>
                </view>
              </view>

              <!-- 用户ID和统计信息 -->
              <view class="profile-userid-stats-row">
                <view class="profile-userid-container" @tap="copyUserId" v-if="userInfo.id">
                  <text class="profile-userid-text">ID: {{ shortUserId }}</text>
            </view>
                <view class="profile-stats-text">
                  <text class="stat-item" @tap="goToFollowList('following')">{{ formatNumber(userInfo.stats?.followingCount || userInfo.stats?.followCount || userInfo.followingCount || 0) }} 关注</text>
                  <text class="stat-item" @tap="goToFollowList('followers')">{{ formatNumber(userInfo.stats?.fansCount || userInfo.stats?.followersCount || userInfo.followersCount || 0) }} 粉丝</text>
                  <text class="stat-item">{{ formatNumber(userInfo.stats?.likeCount || userInfo.likeCount || 0) }} 获赞</text>
          </view>
        </view>

              <!-- 用户简介 -->
              <view class="profile-bio" v-if="userInfo.bio">{{ userInfo.bio }}</view>

              <!-- 学校信息和加入时间（水平显示） -->
              <view class="user-info-row" v-if="(userInfo.school || userInfo.department) || userInfo.createdAt">
                <view class="profile-school-text" v-if="userInfo.school || userInfo.department">
                  {{ formatSchoolInfo(userInfo.school, userInfo.department) }}
              </view>
                <view class="user-join-text" v-if="userInfo.createdAt">
                  {{ formatJoinDate(userInfo.createdAt) }}
            </view>
              </view>
            </view>
          </view>
        </view>


        


        <!-- 徽章已改为认证标识方式显示在用户名后 -->
      

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
              @scrolltolower="loadMorePosts"
            >
              <!-- 帖子统计信息 -->
              <view class="content-stats-header">
                <text class="stats-text">{{ userInfo.stats?.postCount || 0 }}个帖子</text>
            </view>
      
      
              <view class="profile-posts" v-if="postList.length > 0">
                <view class="post-list">
        <post-card
          v-for="post in postList"
          :key="post.id"
          :post="post"
          @like="handleLike"
          @comment="handleComment"
          @favorite="handleFavorite"
        />
          </view>
        
        <!-- 加载更多 -->
        <view class="load-more" v-if="postList.length > 0">
          <text v-if="loadingMore">加载中...</text>
                  <text v-else-if="noMorePosts" style="color: #ffffff;">没有更多了</text>
                  <text v-else @click="loadMorePosts" style="color: #ffffff;">点击加载更多</text>
        </view>
      </view>
      
        <!-- 空状态 -->
        <view class="empty-state" v-if="!loading && postList.length === 0">
                <image class="empty-image" src="/static/images/empty-posts.png" mode="aspectFit"></image>
                <text class="empty-text" style="color: #ffffff;">这个人很神秘，还没有发布帖子</text>
        </view>
            </scroll-view>
          </swiper-item>
          
          <!-- 热门页 -->
          <swiper-item class="profile-swiper-item">
            <scroll-view 
              scroll-y 
              class="profile-scroll" 
              @scrolltolower="loadMorePosts"
            >
              <!-- 热门帖子统计信息 -->
              <view class="content-stats-header">
                <text class="stats-text">热门帖子</text>
              </view>
              
              <view class="profile-posts" v-if="postList.length > 0">
                <view class="post-list">
        <post-card
          v-for="post in postList"
          :key="post.id"
          :post="post"
          @like="handleLike"
          @comment="handleComment"
          @favorite="handleFavorite"
        />
                </view>
        
        <!-- 加载更多 -->
        <view class="load-more" v-if="postList.length > 0">
          <text v-if="loadingMore">加载中...</text>
                  <text v-else-if="noMorePosts" style="color: #ffffff;">没有更多了</text>
                  <text v-else @click="loadMorePosts" style="color: #ffffff;">点击加载更多</text>
                </view>
        </view>
        
        <!-- 空状态 -->
        <view class="empty-state" v-if="!loading && postList.length === 0">
                <image class="empty-image" src="/static/images/empty-posts.png" mode="aspectFit"></image>
                <text class="empty-text" style="color: #ffffff;">暂无热门帖子</text>
        </view>
            </scroll-view>
          </swiper-item>
          
        </swiper>
      </view>
    </scroll-view>
    
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
          <text class="tag-description">这是该用户的兴趣标签，代表了他们的爱好和特长。</text>
          <view class="tag-stats">
            <view class="tag-stat-item">
              <text class="tag-stat-label">用户标签</text>
              <text class="tag-stat-value">{{ userInfo.tags?.length || 0 }}/8</text>
            </view>
          </view>
        </view>
        <view class="tag-detail-footer">
          <button class="tag-close-btn" @tap="closeTagDetail">确定</button>
        </view>
      </view>
    </view>

    <!-- 完整标签列表弹窗 -->
    <view class="all-tags-modal-mask" v-if="showAllTagsPopup" @tap="closeAllTagsPopup">
      <view class="all-tags-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">个人标签</text>
          <text class="tag-count">{{ userInfo.tags ? userInfo.tags.length : 0 }}/8</text>
        </view>
        <view class="modal-content">
          <view class="all-tags-grid">
            <view 
              v-for="(tag, index) in userInfo.tags"
              :key="index"
              class="modal-tag"
              :style="{
                backgroundColor: getTagBackgroundColor(tag),
                borderColor: getTagBorderColor(tag)
              }"
            >
              <text 
                class="modal-tag-text"
                :style="{
                  color: getTagTextColor(tag)
                }"
              >{{ getTagName(tag) }}</text>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="close-btn" @tap="closeAllTagsPopup">关闭</button>
        </view>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view class="loading-container" v-if="loading">
      <view class="loading-skeleton">
        <!-- 骨架屏主卡片 -->
        <view class="skeleton-card">
          <view class="skeleton-content">
            <view class="skeleton-avatar"></view>
            <view class="skeleton-info">
              <view class="skeleton-line name"></view>
              <view class="skeleton-line username"></view>
              <view class="skeleton-line bio"></view>
            </view>
            <view class="skeleton-meta">
              <view class="skeleton-tag" v-for="i in 3" :key="i"></view>
            </view>
          </view>
        </view>

        <!-- 骨架屏统计卡片 -->
        <view class="skeleton-stats">
          <view class="skeleton-stat" v-for="i in 4" :key="i">
            <view class="skeleton-icon"></view>
            <view class="skeleton-number"></view>
            <view class="skeleton-label"></view>
          </view>
        </view>

        <!-- 骨架屏按钮 -->
        <view class="skeleton-buttons">
          <view class="skeleton-button"></view>
          <view class="skeleton-button"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import PostCard from '@/components/post/PostCard.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import api from '@/api'
import { ensureAbsoluteUrl } from '@/utils/url'
import { useFollowStore } from '@/stores/followStore'

export default {
  name: 'UserProfile',
  components: {
    PostCard,
    AppIcon
  },
  data() {
    return {
      statusBarHeight: 0,
      scrollViewHeight: 0,
      userId: '',
      userInfo: {},
      followStore: null, // Pinia store引用
      userBadges: [], // 用户徽章数据
      selectedBadge: null, // 当前选中的徽章（用于详情弹窗）
      showBadgeDetail: false, // 是否显示徽章详情弹窗
      selectedTag: null, // 当前选中的标签
      showTagPopup: false, // 是否显示标签详情弹窗
      tagModalStyle: {}, // 标签弹窗样式（用于动画）
      showAllTagsPopup: false, // 是否显示完整标签列表弹窗
      maxDisplayTags: 2, // 最大显示标签数量
      
      // 标签页数据
      tabs: [
        { key: 'post', name: '帖子' },
        { key: 'hot', name: '热门' }
      ],
      currentTab: 'post',
      tabIndex: 0,
      
      // 帖子数据 - 分标签存储
      postData: {
        post: { list: [], currentPage: 1, hasMore: true, loading: false },
        hot: { list: [], currentPage: 1, hasMore: true, loading: false }
      },
      loadedTabs: new Set(['post']), // 记录已加载的标签，默认加载帖子标签
      loading: true,
      loadingMore: false,
      followLoading: false,
      pageSize: 10,
      // 触摸滑动相关
      touchStartX: 0,
      touchStartY: 0,
      touchStartTime: 0,
      minSwipeDistance: 50, // 最小滑动距离
      maxSwipeTime: 300, // 最大滑动时间
      isTouching: false // 触摸状态
    }
  },
  computed: {
    followButtonIcon() {
      // 完全使用 API 返回的状态
      const isFollowing = this.userInfo.followStatus?.isFollowed || false
      const isMutualFollow = this.userInfo.followStatus?.isMutualFollow
      
      if (isFollowing) {
        // 检查是否互相关注（从 userInfo 获取）
        return isMutualFollow ? 'icon-heart-fill' : 'icon-user-minus'
      }
      return 'icon-user-plus'
    },
    followButtonText() {
      // 完全使用 API 返回的状态
      const isFollowing = this.userInfo.followStatus?.isFollowed || false
      const isMutualFollow = this.userInfo.followStatus?.isMutualFollow
      
      if (isFollowing) {
        // 检查是否互相关注（从 userInfo 获取）
        return isMutualFollow ? '互相关注' : '已关注'
      }
      return '关注'
    },
    
    // 获取当前关注状态（用于样式绑定）
    currentFollowStatus() {
      // 完全使用 API 返回的状态
      return this.userInfo.followStatus?.isFollowed || false
    },
    
    // 显示的徽章（最多3个）
    displayBadges() {
      if (!this.userBadges.length) {
        return [];
      }
      return this.userBadges.slice(0, 3); // 最多显示3个认证徽章
    },
    
    safeAvatarUrl() {
      if (!this.userInfo.avatar) {
        return '/static/images/common/default-avatar.png'
      }
      return ensureAbsoluteUrl(this.userInfo.avatar)
    },
    safeBackgroundUrl() {
      if (!this.userInfo.background_image) {
        return 'linear-gradient(135deg, #2b85e4 0%, #6ba7f0 100%)'
      }
      return ensureAbsoluteUrl(this.userInfo.background_image)
    },
    
    // 缩短的用户ID
    shortUserId() {
      const id = this.userInfo.id || '';
      if (id.length <= 12) return id;
      return id.substring(0, 8) + '...';
    },
    
    // 当前标签的帖子列表
    postList() {
      return this.postData[this.currentTab]?.list || [];
    },
    
    // 当前标签是否还有更多数据
    noMorePosts() {
      return !this.postData[this.currentTab]?.hasMore;
    },
    
    // 当前标签的页码
    currentPage() {
      return this.postData[this.currentTab]?.currentPage || 1;
    },

    // 显示的标签（限制数量）
    displayedTags() {
      if (!this.userInfo.tags || this.userInfo.tags.length === 0) {
        return [];
      }
      return this.userInfo.tags.slice(0, this.maxDisplayTags);
    }
  },
  onLoad(options) {
    this.userId = options.id
    // 初始化Pinia store
    this.followStore = useFollowStore()
    this.initPage()
  },
  onReady() {
    this.calculateScrollViewHeight()
  },
  methods: {
    initPage() {
      // 获取状态栏高度
      const systemInfo = uni.getSystemInfoSync()
      this.statusBarHeight = systemInfo.statusBarHeight || 0
      
      // 加载用户信息和默认标签(post)的帖子
      this.loadUserProfile()
      this.loadUserPosts(false, 'post')
    },
    
    calculateScrollViewHeight() {
      const systemInfo = uni.getSystemInfoSync()
      // 移除横幅后，使用全屏高度
      this.scrollViewHeight = systemInfo.windowHeight
    },
    
    async loadUserProfile() {
      try {
        const response = await api.user.getUserProfile(this.userId)
        
        if (response.code === 0) {
          this.userInfo = response.data
          
          // 加载用户徽章
          this.loadUserBadges()
        } else {
          uni.showToast({
            title: response.msg || '获取用户信息失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        uni.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
      }
    },
    
    // 加载用户徽章
    async loadUserBadges() {
      if (!this.userId) {
        return
      }
      
      try {
        const response = await api.badge.getUserBadges(this.userId, {
          includeHidden: false, // 只显示可见的徽章
          type: 'achievement' // 只显示成就类型的徽章
        })

        if (response.success && response.data) {
          this.userBadges = response.data.map(userBadge => {
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
            }
          })


        }
      } catch (error) {
        console.error('获取用户徽章失败:', error)
      }
    },
    
    // 显示徽章详情
    showBadgeDetails(badge) {

      this.selectedBadge = badge
      this.showBadgeDetail = true
    },
    
    // 关闭徽章详情弹窗
    closeBadgeDetail() {
      this.showBadgeDetail = false
      this.selectedBadge = null
    },

    // 徽章触摸开始
    onBadgeTouchStart() {
      // 这里可以添加触摸反馈，比如轻微的动画
    },
    
    // 徽章触摸结束
    onBadgeTouchEnd() {
      // 这里可以添加触摸结束的处理
    },
    
    // 显示标签详情（带放大动画）
    showTagDetail(tag, event) {
      this.selectedTag = tag
      
      // 获取点击元素的位置信息
      const query = uni.createSelectorQuery().in(this)
      query.selectAll('.tag-item').boundingClientRect((rects) => {
        if (rects && rects.length > 0) {
          // 找到被点击的标签元素
          const tagIndex = this.userInfo.tags.indexOf(tag)
          const rect = rects[tagIndex]
          
          if (rect) {
            // 计算弹窗初始位置（从点击位置开始）
            this.tagModalStyle = {
              transformOrigin: `${rect.left + rect.width/2}px ${rect.top + rect.height/2}px`,
              opacity: 0,
              transform: 'scale(0.3)'
            }
            
            this.showTagPopup = true
            
            // 延迟执行动画
            this.$nextTick(() => {
              setTimeout(() => {
                this.tagModalStyle = {
                  transformOrigin: `${rect.left + rect.width/2}px ${rect.top + rect.height/2}px`,
                  opacity: 1,
                  transform: 'scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }
              }, 50)
            })
          }
        }
      }).exec()
    },
    
    // 关闭标签详情弹窗
    closeTagDetail() {
      // 先执行缩小动画
      this.tagModalStyle = {
        ...this.tagModalStyle,
        opacity: 0,
        transform: 'scale(0.3)',
        transition: 'all 0.2s ease-in'
      }
      
      // 动画结束后隐藏弹窗
      setTimeout(() => {
        this.showTagPopup = false
        this.selectedTag = null
        this.tagModalStyle = {}
      }, 200)
    },

    // 打开完整标签列表弹窗
    openAllTagsPopup() {
      this.showAllTagsPopup = true
    },

    // 关闭完整标签列表弹窗
    closeAllTagsPopup() {
      this.showAllTagsPopup = false
    },

    // 获取标签名称
    getTagName(tag) {
      if (typeof tag === 'string') {
        return tag;
      } else if (tag && tag.name) {
        return tag.name;
      }
      return '';
    },

    // 获取标签背景颜色
    getTagBackgroundColor(tag) {
      if (tag && tag.color) {
        return this.parseTagColor(tag.color, 0.15);
      }
      return 'rgba(102, 126, 234, 0.15)';
    },

    // 获取标签边框颜色
    getTagBorderColor(tag) {
      if (tag && tag.color) {
        return this.parseTagColor(tag.color, 0.4);
      }
      return 'rgba(102, 126, 234, 0.4)';
    },

    // 获取标签文字颜色
    getTagTextColor(tag) {
      // 统一使用白色文字，确保在彩色半透明背景上有良好的对比度
      return '#ffffff';
    },

    // 解析标签颜色并应用透明度
    parseTagColor(color, opacity = 1) {
      if (!color) {
        return opacity === 1 ? '#667eea' : `rgba(102, 126, 234, ${opacity})`;
      }

      // 处理 hex 颜色
      if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
      
      // 处理 rgb 颜色
      if (color.startsWith('rgb(')) {
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity})`;
        }
      }
      
      // 处理 rgba 颜色 - 替换透明度
      if (color.startsWith('rgba(')) {
        const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
        if (rgbaMatch) {
          return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${opacity})`;
        }
      }
      
      // 如果无法解析，返回默认颜色
      return opacity === 1 ? '#667eea' : `rgba(102, 126, 234, ${opacity})`;
    },
    
    // 获取稀有度样式类
    getRarityClass(rarity) {
      return `rarity-${rarity}`
    },
    
    // 获取稀有度名称
    getRarityName(rarity) {
      const names = {
        common: '普通',
        rare: '稀有',
        epic: '史诗',
        legendary: '传奇'
      }
      return names[rarity] || '未知'
    },
    
    // 格式化时间
    formatTime(time) {
      if (!time) return ''
      
      const now = new Date().getTime()
      const diff = now - new Date(time).getTime()
      
      if (diff < 60 * 1000) {
        return '刚刚'
      } else if (diff < 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 1000)) + '分钟前'
      } else if (diff < 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 60 * 1000)) + '小时前'
      } else if (diff < 30 * 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前'
      } else {
        const date = new Date(time)
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
      }
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

    // 复制用户ID
    copyUserId() {
      const userId = this.userInfo.id;
      if (!userId) return;
      
      uni.setClipboardData({
        data: userId,
        success: () => {
          uni.showToast({
            title: 'ID已复制',
            icon: 'success',
            duration: 1500
          });
        }
      });
    },
    
    async loadUserPosts(refresh = false, tab = null) {
      const targetTab = tab || this.currentTab;
      const tabData = this.postData[targetTab];
      
      if (refresh) {
        tabData.currentPage = 1;
        tabData.hasMore = true;
      }
      
      try {
        this.loading = refresh ? false : tabData.currentPage === 1;
        this.loadingMore = !refresh && tabData.currentPage > 1;
        
        const response = await api.user.getUserPosts(this.userId, {
          page: tabData.currentPage,
          pageSize: this.pageSize,
          sort: targetTab
        })
        
        if (response.code === 0) {
          const newPosts = response.data.list || []
          
          // 🔧 处理帖子数据，确保字段格式正确
          const processedPosts = newPosts.map(post => {
            return {
              ...post,
              // 确保关键字段存在
              id: post.id,
              title: post.title || '',
              content: post.content || '',
              createTime: post.created_at || post.createdAt || post.create_time,
              // 确保作者信息结构正确
              author: post.author || {},
              // 位置信息
              location: post.location_name || post.locationName || '',
              // 计数信息 - 支持多种格式
              likeCount: post.like_count || post.likeCount || 0,
              commentCount: post.comment_count || post.commentCount || 0,
              favoriteCount: post.favorite_count || post.favoriteCount || 0,
              // 🎯 交互状态 - 关键修复点
              isLiked: post.isLiked || post.is_liked || false,
              isFavorited: post.isFavorited || post.is_favorited || false,
              // 图片处理
              images: post.images || [],
              // 标签处理
              tags: post.tags || []
            };
          });
          
          if (refresh || tabData.currentPage === 1) {
            tabData.list = processedPosts;
          } else {
            tabData.list.push(...processedPosts);
          }
          
          // 检查是否还有更多数据
          if (newPosts.length < this.pageSize) {
            tabData.hasMore = false;
          }
        } else {
          uni.showToast({
            title: response.msg || '获取帖子失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('获取帖子失败:', error)
        uni.showToast({
          title: '获取帖子失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
        this.loadingMore = false
        tabData.loading = false;
      }
    },
    
    // 页面交互方法
    goBack() {
      uni.navigateBack()
    },
    
    showMoreActions() {
      uni.showActionSheet({
        itemList: ['举报用户', '拉黑用户'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.reportUser()
          } else if (res.tapIndex === 1) {
            this.blockUser()
          }
        }
      })
    },
    
    async toggleFollow() {
      if (this.followLoading) return
      
      // 保存原始状态，供回滚使用
      const originalIsFollowed = this.userInfo.followStatus?.isFollowed || false
      const originalIsMutual = this.userInfo.followStatus?.isMutualFollow || false
      
      try {
        this.followLoading = true
        
        // 乐观更新：立即更新前端状态
        if (!this.userInfo.followStatus) {
          this.userInfo.followStatus = {}
        }
        
        this.userInfo.followStatus.isFollowed = !originalIsFollowed
        
        // 更新互相关注状态：只有在取消关注时才需要更新
        if (originalIsFollowed && originalIsMutual) {
          // 如果当前是互相关注，取消关注后就不再是互相关注
          this.userInfo.followStatus.isMutualFollow = false
        }
        
        // 更新粉丝数
        if (!this.userInfo.stats) {
          this.userInfo.stats = {}
        }
        if (originalIsFollowed) {
          this.userInfo.stats.fansCount = Math.max(0, (this.userInfo.stats.fansCount || 0) - 1)
        } else {
          this.userInfo.stats.fansCount = (this.userInfo.stats.fansCount || 0) + 1
        }
        
        // 调用API进行关注操作
        let response
        if (originalIsFollowed) {
          response = await api.follow.unfollow(this.userId)
        } else {
          response = await api.follow.follow(this.userId)
        }
        
        if (response && (response.success || response.code === 0)) {
          uni.showToast({
            title: originalIsFollowed ? '取消关注成功' : '关注成功',
            icon: 'success'
          })
          
          // 延迟1秒后重新获取用户信息，确保后端数据已写入
          setTimeout(async () => {
            await this.loadUserProfile()
          }, 1000)
        } else {
          // API失败，回滚乐观更新
          this.userInfo.followStatus.isFollowed = originalIsFollowed
          // 回滚互相关注状态
          if (originalIsFollowed && originalIsMutual) {
            this.userInfo.followStatus.isMutualFollow = true
          }
          
          if (originalIsFollowed) {
            this.userInfo.stats.fansCount = (this.userInfo.stats.fansCount || 0) + 1
          } else {
            this.userInfo.stats.fansCount = Math.max(0, (this.userInfo.stats.fansCount || 0) - 1)
          }
          
          uni.showToast({
            title: response?.message || response?.msg || '操作失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('关注操作失败:', error)
        
        // 发生异常，回滚乐观更新到原始状态
        this.userInfo.followStatus.isFollowed = originalIsFollowed
        
        // 回滚互相关注状态
        if (originalIsFollowed && originalIsMutual) {
          this.userInfo.followStatus.isMutualFollow = true
        }
        
        // 回滚粉丝数
        if (originalIsFollowed) {
          this.userInfo.stats.fansCount = (this.userInfo.stats.fansCount || 0) + 1
        } else {
          this.userInfo.stats.fansCount = Math.max(0, (this.userInfo.stats.fansCount || 0) - 1)
        }
        
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        })
      } finally {
        this.followLoading = false
      }
    },
    
    sendMessage() {

      uni.navigateTo({
        url: `/pages/message/chat?userId=${this.userId}&nickname=${encodeURIComponent(this.userInfo.nickname || '')}&username=${encodeURIComponent(this.userInfo.username || '')}&avatar=${encodeURIComponent(this.userInfo.avatar || '')}`
      });
    },
    
    switchTab(tab) {
      if (this.currentTab === tab) return
      
      this.currentTab = tab
      this.currentPage = 1
      this.loadUserPosts(true)
    },
    
    onRefresh() {
      Promise.all([
        this.loadUserProfile(),
        this.loadUserPosts(true, this.currentTab)
      ])
    },
    
    loadMorePosts() {
      const tabData = this.postData[this.currentTab];
      if (this.loadingMore || !tabData.hasMore) return
      
      tabData.currentPage++;
      this.loadUserPosts(false, this.currentTab);
    },
    
    // 帖子交互方法
    handleLike(post) {
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        uni.navigateTo({ url: '/pages/auth/login/index' });
        return;
      }

      // 乐观更新UI
      const originalState = post.isLiked;
      const originalCount = post.likeCount || post.like_count || 0;
      const newState = !post.isLiked;
      
      post.isLiked = newState;
      // 更新实际存在的字段
      if (post.like_count !== undefined) {
        post.like_count += newState ? 1 : -1;
      }
      if (post.likeCount !== undefined) {
        post.likeCount += newState ? 1 : -1;
      }



      // 调用API
      const apiPromise = newState
        ? this.$api.like.like('post', post.id)
        : this.$api.like.unlike('post', post.id);

      apiPromise
        .then(res => {
          uni.showToast({ 
            title: newState ? '点赞成功' : '取消点赞', 
            icon: 'success' 
          });
        })
        .catch(err => {
          console.error('点赞操作失败:', err);
          // 恢复原始状态
          post.isLiked = originalState;
          // 恢复实际存在的字段
          if (post.like_count !== undefined) {
            post.like_count = originalCount;
          }
          if (post.likeCount !== undefined) {
            post.likeCount = originalCount;
          }
          uni.showToast({ 
            title: '操作失败，请稍后重试', 
            icon: 'none' 
          });
        });
    },
    
    handleComment(post) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${post.id}&focusComment=true`
      })
    },
    
    handleFavorite(post) {
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        uni.navigateTo({ url: '/pages/auth/login/index' });
        return;
      }

      // 乐观更新UI
      const originalState = post.isFavorited;
      const originalCount = post.favoriteCount || post.favorite_count || 0;
      const newState = !post.isFavorited;
      
      post.isFavorited = newState;
      // 更新实际存在的字段
      if (post.favorite_count !== undefined) {
        post.favorite_count += newState ? 1 : -1;
      }
      if (post.favoriteCount !== undefined) {
        post.favoriteCount += newState ? 1 : -1;
      }



      // 调用API
      const apiPromise = newState
        ? this.$api.favorite.favorite(post.id)
        : this.$api.favorite.unfavorite(post.id);

      apiPromise
        .then(res => {
          uni.showToast({ 
            title: newState ? '收藏成功' : '取消收藏', 
            icon: 'success' 
          });
        })
        .catch(err => {
          console.error('收藏操作失败:', err);
          // 恢复原始状态
          post.isFavorited = originalState;
          // 恢复实际存在的字段
          if (post.favorite_count !== undefined) {
            post.favorite_count = originalCount;
          }
          if (post.favoriteCount !== undefined) {
            post.favoriteCount = originalCount;
          }
          
          // 处理特定错误
          if (err.code === 100 && err.data && err.data.details) {
            const detail = err.data.details[0];
            if (detail && detail.field === 'favorites_user_id_post_id') {
              post.isFavorited = true;
              uni.showToast({ title: '已收藏', icon: 'none' });
              return;
            }
          }
          
          uni.showToast({ 
            title: err.msg || '操作失败，请稍后重试', 
            icon: 'none' 
          });
        });
    },
    
    showFollowList(type) {
      // 使用共用的follow页面处理关注/粉丝列表
      if (type === 'following' || type === 'followers') {
        uni.navigateTo({
          url: `/pages/profile/follow?type=${type}&userId=${this.userId}`
        });
      }
    },
    
    formatJoinDate(dateString) {
      if (!dateString) return ''
      
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      
      return `${year}年${month}月加入`
    },

    formatNumber(num) {
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + 'w'
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k'
      }
      return num.toString()
    },

    goToFollowList(type) {
      // 根据类型跳转到关注/粉丝列表页
      uni.navigateTo({
        url: `/pages/profile/follow?type=${type}&userId=${this.userId}`
      });
    },
    
    // 标签页点击切换处理
    handleTabClick(tab) {
      this.currentTab = tab;
      this.tabIndex = this.tabs.findIndex(t => t.key === tab);
      this.refreshCurrentTab();
    },
    
    // 滑动切换处理
    handleSwiperChange(e) {
      const index = e.detail.current;
      this.tabIndex = index;
      this.currentTab = this.tabs[index].key;
      this.refreshCurrentTab();
    },
    
    // 刷新当前标签页数据
    refreshCurrentTab() {
      // 只在标签未加载过时才加载数据
      if (!this.loadedTabs.has(this.currentTab)) {
        this.loadTabData(this.currentTab);
        this.loadedTabs.add(this.currentTab);
      }
    },
    
    // 加载指定标签的数据
    loadTabData(tab) {
      this.postData[tab].loading = true;
      this.postData[tab].currentPage = 1;
      this.postData[tab].hasMore = true;
      this.postData[tab].list = [];
      this.loadUserPosts(false, tab);
    },
    
    // 刷新帖子数据
    refreshPosts() {
      this.loadTabData(this.currentTab);
    },
    
    reportUser() {
      uni.showToast({
        title: '举报功能开发中',
        icon: 'none'
      })
    },
    
    blockUser() {
      uni.showToast({
        title: '拉黑功能开发中',
        icon: 'none'
      })
    },

    // 触摸滑动切换标签页
    onTouchStart(e) {
      this.touchStartX = e.touches[0].clientX
      this.touchStartY = e.touches[0].clientY
      this.touchStartTime = Date.now()
      this.isTouching = true
      
      // 添加触摸反馈（仅在移动端）
      this.safeVibrate('light')
    },

    onTouchMove(e) {
      if (!this.isTouching) return
      
      const currentX = e.touches[0].clientX
      const deltaX = currentX - this.touchStartX
      
      // 只在水平滑动时阻止默认行为
      if (Math.abs(deltaX) > 10) {
        e.preventDefault()
      }
    },

    onTouchEnd(e) {
      if (!this.isTouching) return
      
      this.isTouching = false
      
      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY
      const touchEndTime = Date.now()
      
      const deltaX = touchEndX - this.touchStartX
      const deltaY = touchEndY - this.touchStartY
      const deltaTime = touchEndTime - this.touchStartTime
      
      // 检查是否符合滑动条件
      if (deltaTime <= this.maxSwipeTime && Math.abs(deltaX) >= this.minSwipeDistance) {
        // 确保是水平滑动（水平距离大于垂直距离）
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // 添加滑动成功的反馈
          this.safeVibrate('medium')
          
          if (deltaX > 0) {
            // 向右滑动
            this.switchToTab('right')
          } else {
            // 向左滑动
            this.switchToTab('left')
          }
        }
      }
    },

    // 安全震动函数 - 只在支持的平台上震动
    safeVibrate(type = 'light') {
      // 检测是否为移动端应用环境
      // #ifdef APP-PLUS || MP
      try {
        if (type === 'light') {
          uni.vibrateShort({
            type: 'light',
            fail: () => {
              // 静默失败，不影响功能
            }
          })
        } else if (type === 'medium') {
          uni.vibrateShort({
            type: 'medium', 
            fail: () => {
              // 静默失败，不影响功能
            }
          })
        }
      } catch (error) {
        // 静默捕获错误，不影响主要功能
        console.debug('震动功能不可用:', error)
      }
      // #endif
      
      // H5环境下不执行震动，避免控制台错误
      // #ifdef H5
      // 可以在这里添加其他反馈方式，比如CSS动画
      // #endif
    },

    // 根据滑动方向切换标签
    switchToTab(direction) {
      const oldTab = this.currentTab
      let newTab = null
      
      if (direction === 'left') {
        // 向左滑动：热门 → 最新
        if (this.currentTab === 'hot') {
          newTab = 'latest'
          this.switchTab('latest')
        }
      } else if (direction === 'right') {
        // 向右滑动：最新 → 热门
        if (this.currentTab === 'latest') {
          newTab = 'hot'
          this.switchTab('hot')
        }
      }
      
      // 如果成功切换，显示提示
      if (newTab && newTab !== oldTab) {
        const tabName = newTab === 'hot' ? '热门' : '最新'
        uni.showToast({
          title: `切换到${tabName}`,
          icon: 'none',
          duration: 1000
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.user-profile {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
}

/* 顶部悬浮操作栏样式已移除，改为背景图上的半透明按钮 */

/* 内容滚动区域 - 横幅已移除，无需额外样式 */

/* 用户主页头部 */
.user-profile-header {
  position: relative;
  margin: 0;
  background: transparent;
  border-radius: 0;
  overflow: visible;
  box-shadow: none;

  /* 顶部背景区域 */
  .header-background {
    position: relative;
    height: 715rpx;
    overflow: hidden;
    border-radius: 0 0 50rpx 50rpx;

    .profile-bg {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: brightness(0.8);
    }

    /* 半透明操作按钮栏 */
    .background-action-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 16rpx 20rpx;
      z-index: 10;
    }

    .bg-action-btn {
      width: 72rpx;
      height: 72rpx;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10rpx);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      border: 1rpx solid rgba(255, 255, 255, 0.2);

      &:active {
        background: rgba(0, 0, 0, 0.5);
        transform: scale(0.95);
      }
    }

    .bg-primary {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #2b85e4 0%, #6ba7f0 100%);
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

    .bg-decoration {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;

      .decoration-circle {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);

        &.circle-1 {
          width: 200rpx;
          height: 200rpx;
          top: -100rpx;
          right: -50rpx;
        }

        &.circle-2 {
          width: 120rpx;
          height: 120rpx;
          top: 60rpx;
          right: 80rpx;
          background: rgba(255, 255, 255, 0.05);
        }

        &.circle-3 {
          width: 80rpx;
          height: 80rpx;
          top: -40rpx;
          left: 60rpx;
          background: rgba(255, 255, 255, 0.08);
        }
      }
    }

    .bg-bottom-blur {
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
    }
  }

  /* 顶部信息行：参照 profile.vue 布局（flex 对齐） */
  .header-info-row {
    position: absolute;
    bottom: 45rpx; /* 距离背景图底部40rpx，整体再往下移 */
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start; /* 左对齐 */
    padding: 0 30rpx;
    z-index: 2;
    text-align: left;
  }

  /* 头像区域 */
  .avatar-section {
    position: relative;
    display: flex;
    justify-content: flex-start;
    width: 150rpx; /* 适度放大头像 */
    margin-bottom: 16rpx; /* 头像下方间距 */
    flex-shrink: 0;
    padding: 0;

        .user-avatar {
      width: 150rpx;
      height: 150rpx;
      border-radius: 75rpx;
      object-fit: cover;
      }

      .avatar-status {
        position: absolute;
        bottom: 12rpx;
        right: 12rpx;
        width: 32rpx;
        height: 32rpx;
        border-radius: 16rpx;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;

        .status-dot {
          width: 20rpx;
          height: 20rpx;
          border-radius: 10rpx;
          background: #4ade80;
      }
    }
  }



  /* 用户信息区域 */
  .user-info-section {
    /* 垂直左对齐排列 */
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0;
    text-align: left;
    width: 100%;
    box-sizing: border-box;
  }

  /* 昵称和操作按钮行 */
  .nickname-action-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 8rpx;
  }

  .profile-nickname {
    font-size: 40rpx;
    color: #ffffff;
        font-weight: 700;
    text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.8), 0 0 20rpx rgba(0, 0, 0, 0.5);
    letter-spacing: 1rpx;
    flex: 1;
    margin-left: 30rpx;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    max-width: calc(100% - 150rpx); /* 为右侧按钮留出空间 */
  }

  /* 行内操作按钮 */
  .inline-action-buttons {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12rpx;
    flex-shrink: 0;
    margin-right: 16rpx; /* 更靠近右边 */
    /* 整体抗锯齿优化 */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transform: translateZ(0);
  }

  .inline-follow-btn,
  .inline-message-btn {
    height: 60rpx;
    border-radius: 30rpx;
    border: none;
    padding: 0 24rpx;
    font-size: 24rpx;
      display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    /* 基础抗锯齿优化 */
    box-sizing: border-box;
    outline: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    
    .inline-btn-text {
      color: #ffffff;
      font-weight: 500;
      text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.3);
      line-height: 1;
        display: flex;
        align-items: center;
      height: 100%;
      /* 文字抗锯齿 */
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    &:active {
      transform: scale(0.95) translateZ(0);
    }
  }

  .inline-follow-btn {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10rpx);
    border: 1rpx solid rgba(255, 255, 255, 0.4);
    /* 按钮宽度变化时的平滑过渡 */
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    /* 抗锯齿优化 */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transform: translateZ(0);
    will-change: transform;
  }

  .inline-message-btn {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10rpx);
    border: 1rpx solid rgba(255, 255, 255, 0.4);
    /* 抗锯齿优化 */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transform: translateZ(0);
    will-change: transform;
  }

  /* 徽章和标签水平排列行 */
  .badges-tags-row {
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: center !important;
    margin-bottom: 20rpx !important;
    flex-wrap: nowrap !important;
    width: 100% !important;
  }

  /* 徽章部分 */
  .badges-section {
    display: flex !important;
    flex-direction: row !important;
    justify-content: flex-start !important;
    align-items: center !important;
    flex-wrap: wrap !important;
    gap: 12rpx !important;
    flex-shrink: 0 !important;
  }

  /* 标签部分 */
  .tags-section {
    display: flex !important;
    flex-direction: row !important;
    justify-content: flex-end !important;
    align-items: center !important;
    flex-shrink: 0 !important;
  }

  /* 认证徽章样式 */
  .certification-badge {
    @include flex(row, flex-start, center);
    background: rgba(255, 255, 255, 0.15);
    border-radius: 20rpx;
    padding: 6rpx 12rpx;
    margin-right: 12rpx;
    margin-bottom: 8rpx;
    backdrop-filter: blur(10rpx);
    border: 1rpx solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;

        &:active {
      transform: scale(0.95);
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
    }
  }

  .cert-icon {
    width: 32rpx;
    height: 32rpx;
    border-radius: 50%;
    @include flex(row, center, center);
    margin-right: 8rpx;
    /* 背景色通过内联样式动态设置，移除硬编码 */
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
  }

  .cert-icon-svg {
    width: 18rpx;
    height: 18rpx;
    flex-shrink: 0; /* 防止压缩 */
    /* 确保SVG在所有设备上正常显示 */
    opacity: 1;
    visibility: visible;
            display: block;
  }

  .cert-name {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.95);
    font-weight: 500;
    letter-spacing: 0.5rpx;
    text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.6);
  }

  /* 个人标签样式（融入用户信息区） */
  .profile-user-tags {
    margin-top: 10rpx;
    margin-bottom: 12rpx;
    @include flex(row, flex-start, center);
    max-width: 400rpx;
    overflow: hidden;
  }

  .tags-container-inline {
    @include flex(row, flex-start, center);
    flex-wrap: nowrap;
    gap: 8rpx;
    flex: 1; /* 使用可用的空间 */
  }

  .user-info-tag {
    @include flex(row, center, center);
    padding: 6rpx 16rpx;
    border-radius: 20rpx;
    border: 1rpx solid rgba(102, 126, 234, 0.4);
    background: rgba(102, 126, 234, 0.15);
    backdrop-filter: blur(10rpx);
    -webkit-backdrop-filter: blur(10rpx);
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    flex-shrink: 0;
    
    .tag-text {
      font-size: 22rpx;
      font-weight: 500;
      color: #ffffff !important;
      text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
      white-space: nowrap;
    }

    .more-text {
      font-size: 22rpx;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
      text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
    }

    &:active {
      transform: scale(0.95);
      box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.2);
    }
  }

  .more-tags-hint {
    background: rgba(255, 255, 255, 0.2) !important;
    border-color: rgba(255, 255, 255, 0.4) !important;
    color: rgba(255, 255, 255, 0.9) !important;
  }


  /* 用户ID和统计信息行 */
  .profile-userid-stats-row {
    margin-bottom: 12rpx;
    @include flex(row, space-between, center);
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

  /* 用户信息行（学校和加入时间水平显示） */
  .user-info-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16rpx;
    margin-top: 8rpx;
    margin-bottom: 12rpx;
    flex-wrap: wrap; /* 允许换行以防内容过长 */
  }

  /* 学校信息文字样式 */
  .profile-school-text {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.4;
    background: rgba(0, 0, 0, 0.3);
    padding: 4rpx 12rpx;
    border-radius: 12rpx;
    text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.6);
    display: inline-block;
    white-space: nowrap;
  }

  /* 加入时间文字样式 */
  .user-join-text {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.4;
    background: rgba(0, 0, 0, 0.3);
    padding: 4rpx 12rpx;
    border-radius: 12rpx;
    text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.6);
    display: inline-block;
    white-space: nowrap;
  }
}

/* 标签页 */
.profile-content {
    background: rgba(255, 255, 255, 1);
    border-radius: 50rpx 50rpx 0 0;
      position: relative;
    z-index: 10;
    overflow: hidden;
    margin-top: 0;
  }

/* 标签页样式 */
.profile-tabs {
      display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  background: rgba(255, 255, 255, 1);
      position: relative;
  z-index: 10;
  padding: 0 0 20rpx 0;
}

.profile-tab {
        display: flex;
  flex-direction: column;
        justify-content: center;
  align-items: center;
  position: relative;
  padding: 24rpx 0 16rpx;
  min-width: 120rpx;
  cursor: pointer;
  transition: all 0.3s ease;

        .tab-text {
          font-size: 28rpx;
    color: #999999;
          font-weight: 500;
    transition: all 0.3s ease;
        }

        .tab-indicator {
          position: absolute;
    bottom: 0;
          left: 50%;
    width: 60rpx;
    height: 6rpx;
    background: #333333;
    border-radius: 3rpx;
    transform: translateX(-50%) scaleX(0);
    transition: all 0.3s ease;
        }

        &.active {
          .tab-text {
            color: #333333;
      font-weight: bold;
          }
          
          .tab-indicator {
      transform: translateX(-50%) scaleX(1);
    }
  }
}

/* 滑动区域 */
.profile-swiper {
  position: relative;
  height: calc(100vh - 400rpx);
  min-height: 800rpx;
  width: 100%;
        z-index: 1;
}

.profile-swiper-item {
  height: calc(100vh - 400rpx);
  min-height: 800rpx;
  overflow: hidden;
}

.profile-scroll {
  height: calc(100vh - 400rpx);
  min-height: 800rpx;
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



  /* 帖子样式 */
  .profile-posts {
    padding: 0;
    background: transparent;
  }

  .post-list {
    background: transparent;
  }

  .load-more {
    text-align: center;
    padding: 20rpx 0 40rpx;
    font-size: 28rpx;
    color: #999999;
    background: transparent;
  }



/* 帖子容器 */
.posts-container {
  padding: 20rpx 24rpx 0;
  background: rgba(255, 255, 255, 1); /* 白色背景 */

  .load-more {
    text-align: center;
    padding: 40rpx 0 60rpx;
    font-size: 28rpx;
    color: $text-secondary;
    background: rgba(255, 255, 255, 1); /* 完全不透明的白色 */
    border-radius: 0 0 50rpx 50rpx; /* 底部圆角 */
    margin: 0; /* 去掉间距让区域连接 */
  }

  .empty-state {
    background: #ffffff;
    border-radius: 32rpx;
    padding: 80rpx 40rpx;
    text-align: center;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);

    .empty-image {
      width: 240rpx;
      height: 240rpx;
      margin: 0 auto 32rpx;
      opacity: 0.6;
      filter: grayscale(20%);
    }

    .empty-text {
      font-size: 32rpx;
      color: $text-secondary;
      font-weight: 500;
      margin-bottom: 16rpx;
    }

    &::before {
      content: '🌟';
      display: block;
      font-size: 80rpx;
      margin-bottom: 24rpx;
      opacity: 0.3;
    }
  }
}

/* 加载状态 */
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
  z-index: 999;

  .loading-skeleton {
    padding: 128rpx 24rpx 40rpx;

    .skeleton-card {
      background: #ffffff;
      border-radius: 40rpx;
      overflow: hidden;
      margin-bottom: 32rpx;
      box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.08);

      /* 骨架屏头部背景 */
      &::before {
        content: '';
        display: block;
        height: 240rpx;
        background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
        animation: skeleton-shimmer 1.5s infinite;
      }

      .skeleton-content {
        padding: 40rpx;
        position: relative;
        margin-top: -80rpx;

        .skeleton-avatar {
          width: 160rpx;
          height: 160rpx;
          border-radius: 80rpx;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          margin: 0 auto 32rpx;
          border: 6rpx solid #ffffff;
        }

        .skeleton-info {
          text-align: center;
          margin-bottom: 32rpx;

          .skeleton-line {
            height: 32rpx;
            border-radius: 16rpx;
            background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
            background-size: 200% 100%;
            animation: skeleton-loading 1.5s infinite;
            margin: 0 auto 16rpx;

            &.name {
              width: 200rpx;
              height: 40rpx;
            }

            &.username {
              width: 160rpx;
              height: 28rpx;
            }

            &.bio {
              width: 280rpx;
              height: 24rpx;
            }
          }
        }

        .skeleton-meta {
          display: flex;
          justify-content: center;
          gap: 16rpx;
          margin-bottom: 32rpx;

          .skeleton-tag {
            width: 80rpx;
            height: 32rpx;
            border-radius: 16rpx;
            background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
            background-size: 200% 100%;
            animation: skeleton-loading 1.5s infinite;
          }
        }
      }
    }

    .skeleton-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16rpx;
      margin-bottom: 32rpx;

      .skeleton-stat {
        background: #ffffff;
        border-radius: 24rpx;
        padding: 24rpx 16rpx;
        text-align: center;
        box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);

        .skeleton-icon {
          width: 32rpx;
          height: 32rpx;
          border-radius: 16rpx;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          margin: 0 auto 12rpx;
        }

        .skeleton-number,
        .skeleton-label {
          height: 24rpx;
          border-radius: 12rpx;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          margin: 0 auto 8rpx;
        }

        .skeleton-number {
          height: 32rpx;
          width: 60rpx;
        }

        .skeleton-label {
          width: 40rpx;
        }
      }
    }

    .skeleton-buttons {
      display: flex;
      gap: 20rpx;
      padding: 0 40rpx;

      .skeleton-button {
        flex: 1;
        height: 88rpx;
        border-radius: 44rpx;
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
      }
    }
  }
}

/* 动画效果 */
@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 页面进入动画 */
.user-profile-header {
  animation: fadeInUp 0.6s ease-out;
}

.posts-section {
  animation: fadeInUp 0.6s ease-out 0.1s both;
}

.posts-container {
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

/* 响应式适配 */
@media screen and (max-width: 750rpx) {
  .user-profile-header {
    margin: 32rpx 16rpx 24rpx;
    border-radius: 32rpx;

    .header-background {
      height: 240rpx;
      
      /* 小屏幕按钮样式调整 */
      .background-action-bar {
        padding: 0 15rpx 15rpx;
      }
      
      .bg-action-btn {
        width: 64rpx;
        height: 64rpx;
      }
    }

      .header-info-row {
        position: absolute;
        bottom: 60rpx;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        padding: 0 24rpx;
      }

      .avatar-section {
        margin: 0 0 12rpx 0; /* 小屏头像间距 */
        padding: 0;
        width: 120rpx; /* 小屏头像适当放大 */

        .user-avatar {
          width: 120rpx;
          height: 120rpx;
          border-radius: 60rpx;
      }
    }

    .user-info-section {
      padding: 0 0 24rpx; /* 左侧与头像对齐 */
      margin-top: 12rpx; /* 小屏同样整体下移 */



      .nickname-action-row {
        .profile-nickname {
        font-size: 36rpx;
          max-width: calc(100% - 120rpx); /* 小屏幕为按钮留更少空间 */
        }

        .inline-action-buttons {
          gap: 8rpx;
          margin-right: 12rpx; /* 小屏幕也更靠近右边 */
          /* 小屏幕整体抗锯齿优化 */
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          transform: translateZ(0);

          .inline-follow-btn,
          .inline-message-btn {
            height: 50rpx;
            padding: 0 18rpx;
          font-size: 22rpx;
            border-radius: 25rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            /* 小屏幕基础抗锯齿优化 */
            box-sizing: border-box;
            outline: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            
            .inline-btn-text {
              line-height: 1;
              display: flex;
              align-items: center;
              height: 100%;
              /* 小屏幕文字抗锯齿 */
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
          }
          
          .inline-follow-btn {
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            /* 小屏幕抗锯齿优化 */
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            transform: translateZ(0);
            will-change: transform;
          }
          
          .inline-message-btn {
            /* 小屏幕抗锯齿优化 */
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            transform: translateZ(0);
            will-change: transform;
          }
        }
      }

      .user-bio-area .bio-text {
        font-size: 26rpx;
      }


    }




  }

  .posts-section {
    margin: 0 16rpx 24rpx;

    .section-header {
      padding: 24rpx 32rpx;

      .section-title .title-text {
        font-size: 32rpx;
      }

      .filter-tabs .filter-tab {
        height: 64rpx;

        .tab-text {
          font-size: 26rpx;
        }
      }
    }
  }

  .posts-container {
    padding: 0 16rpx;
  }

  .loading-container .loading-skeleton {
    padding: 128rpx 16rpx 40rpx;

    .skeleton-card .skeleton-content {
      padding: 32rpx;

      .skeleton-avatar {
        width: 120rpx;
        height: 120rpx;
        border-radius: 60rpx;
      }
    }

    .skeleton-stats {
      gap: 12rpx;

      .skeleton-stat {
        padding: 20rpx 12rpx;
      }
    }

    .skeleton-buttons {
      padding: 0 32rpx;
      gap: 16rpx;

      .skeleton-button {
        height: 76rpx;
        border-radius: 38rpx;
      }
    }
  }
}

/* 超小屏幕适配 */
@media screen and (max-width: 600rpx) {
  .user-profile-header {
    .header-background {
      height: 200rpx; /* 超小屏幕背景高度调整 */
    }
  }
}

/* 认证徽章样式 - 与个人页面完全一致 */
.certification-badge {
  @include flex(row, flex-start, center);
  background: rgba(255, 255, 255, 0.15);
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
  flex-shrink: 0; /* 防止压缩 */
  /* 确保SVG在所有设备上正常显示 */
  opacity: 1;
  visibility: visible;
  display: block;
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

/* 完整标签列表弹窗样式 */
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
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.tag-count {
  font-size: 24rpx;
  color: #666;
  background: rgba(102, 126, 234, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.modal-content {
  padding: 30rpx;
  max-height: 400rpx;
  overflow-y: auto;
}

.all-tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120rpx, 1fr));
  gap: 16rpx;
}

.modal-tag {
  @include flex(row, center, center);
  padding: 16rpx 20rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(102, 126, 234, 0.4);
  background: rgba(102, 126, 234, 0.15);
  transition: all 0.3s ease;
  text-align: center;

  &:active {
    transform: scale(0.95);
  }
}

.modal-tag-text {
  font-size: 24rpx;
  font-weight: 500;
  color: #ffffff !important;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.modal-footer {
  padding: 20rpx 40rpx 30rpx;
  @include flex(row, center, center);
  border-top: 1rpx solid rgba(0, 0, 0, 0.1);
}

.modal-footer .close-btn {
  width: 160rpx;
  height: 60rpx;
  background: none;
  color: #666;
  border: 1rpx solid #ddd;
  border-radius: 30rpx;
  font-size: 26rpx;
  font-weight: normal;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.95);
    background: rgba(0, 0, 0, 0.05);
  }
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 标签动画 */
@keyframes tagFadeIn {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tag-fade-in {
  animation: tagFadeIn 0.5s ease-out;
  animation-fill-mode: both;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .user-profile {
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  }

  .user-profile-header {
    background: #2d3748;
    box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);

    .header-background {
      .bg-primary {
        background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
      }
    }
  }

  .posts-section .section-header {
    background: #2d3748;
  }

  .posts-container .empty-state {
    background: #2d3748;
  }
}
</style>
