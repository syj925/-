<template>
  <view class="post-detail-container">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">
        <text class="iconfont icon-back"></text>
      </view>
      <view class="nav-title">帖子详情</view>
      <view class="nav-right" @tap="refreshStatus">
        <text class="iconfont icon-refresh"></text>
      </view>
    </view>
    
    <!-- 帖子内容 -->
    <view class="post-detail-card">
      <!-- 用户信息 -->
      <user-card 
        :user="post.author || {}" 
        :time="post.createdAt"
        :show-action="true"
        :is-following="isFollowing"
        :current-user-id="currentUser?.id || ''"
        mode="normal"
        @click="viewUserProfile"
        @follow="handleFollow"
      />
      
      <!-- 帖子内容 -->
      <view class="post-content">
        <!-- 使用话题文本组件显示内容 -->
        <topic-text :content="post.content" @topic-click="handleTopicClick"></topic-text>
      </view>
      
      <!-- 帖子图片 -->
      <view class="image-grid" v-if="post.images && post.images.length > 0">
        <image 
          v-for="(image, index) in post.images" 
          :key="index" 
          :src="image" 
          mode="aspectFill"
          class="post-image"
          @tap="previewImage(index)"
        ></image>
      </view>
      
      <!-- 话题标签和分类 -->
      <view class="tags-container" v-if="post.topics && post.topics.length > 0">
        <view 
          v-for="(topic, index) in post.topics" 
          :key="index"
          class="topic-tag ripple"
          @tap="navigateToTopic(topic)"
        >
          #{{ topic }}
        </view>
        <view class="category-tag" v-if="post.category">{{ post.category.name }}</view>
      </view>
      
      <!-- 位置信息显示 -->
      <view class="location-info" v-if="post.location">
        <text class="iconfont icon-location"></text>
        <text class="location-text">{{ post.location }}</text>
      </view>
      
      <!-- 帖子操作栏 -->
      <view class="action-bar">
        <view class="action-item ripple" @tap="handleLike">
          <view class="action-content">
          <view class="css-icon heart-icon" :class="{'active': isLiked}"></view>
          <view class="action-text" :class="{'active-text': isLiked}">
              <text>{{ post.likes || 0 }}</text>
            </view>
          </view>
        </view>
        <view class="action-item ripple" @tap="scrollToComments">
          <view class="action-content">
          <image src="/static/icons/pl.png" class="icon-image"></image>
          <view class="action-text">
            <text>{{ post.comments || 0 }}</text>
            </view>
          </view>
        </view>
        <view class="action-item ripple" @tap="handleCollect">
          <view class="action-content">
          <view class="css-icon star-icon" :class="{'active': isCollected}"></view>
          <view class="action-text" :class="{'active-text': isCollected}">
              <text>{{ post.collections || 0 }}</text>
            </view>
          </view>
        </view>
        <view class="action-item ripple" @tap="showShareOptions">
          <view class="action-content">
          <image src="/static/icons/fx.png" class="icon-image"></image>
          <text>分享</text>
          </view>
        </view>
        <!-- 增加更多操作按钮 -->
        <view class="action-item ripple" @tap="showPostOptions">
          <view class="action-content">
          <image src="/static/icons/gd.png" class="icon-image"></image>
          <text>更多</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 评论区 -->
    <view class="comments-section" id="comments">
      <view class="section-header">
        <text class="section-title">评论 ({{ post.comments || 0 }})</text>
        <view class="section-actions">
          <view class="new-comment-btn ripple" @tap="showNewCommentInput" v-if="!showNewCommentForm">
            <text class="iconfont icon-add"></text>
            <text>写评论</text>
          </view>
        <text class="sort-text ripple" @tap="toggleSortOrder">{{ sortNewest ? '最新' : '最热' }}</text>
        </view>
      </view>
      
      <!-- 新增评论输入框 -->
      <view class="new-comment-container" v-if="showNewCommentForm">
        <view class="new-comment-header">
          <text class="new-comment-title">发表评论</text>
          <text class="new-comment-close ripple" @tap="hideNewCommentInput">×</text>
        </view>
        <textarea
          class="new-comment-input"
          v-model="newCommentContent"
          auto-height
          focus
          :adjust-position="true"
          placeholder="写下你的评论..."
          @blur="onNewCommentBlur"
        />
        <view class="new-comment-actions">
          <view class="new-comment-cancel" @tap="hideNewCommentInput">取消</view>
          <view class="new-comment-submit ripple" @tap="submitNewComment">发表</view>
        </view>
      </view>
      
      <!-- 评论排序切换 -->
      <view class="comment-sort-section" v-if="comments.length > 0">
        <view class="comment-sort-header">
          <text class="comment-count">共{{ totalComments }}条评论</text>
          <view class="sort-buttons">
            <view
              class="sort-button"
              :class="{ active: currentSort === 'latest' }"
              @tap="changeSortType('latest')"
            >
              <text class="sort-text">最新</text>
            </view>
            <view
              class="sort-button"
              :class="{ active: currentSort === 'hot' }"
              @tap="changeSortType('hot')"
            >
              <text class="sort-text">🔥 热门</text>
            </view>
            <view
              class="sort-button"
              :class="{ active: currentSort === 'most_liked' }"
              @tap="changeSortType('most_liked')"
            >
              <text class="sort-text">👍 点赞</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 评论列表 -->
      <view class="comment-list">
        <view class="no-comments" v-if="comments.length === 0">
          <text>暂无评论，快来抢沙发吧~</text>
        </view>
        
        <comment-item 
          v-for="(comment, index) in comments" 
          :key="comment.id"
          :comment="comment"
          @like="handleCommentLike"
          @reply="replyToComment"
          @reply-like="handleReplyLike"
          @reply-to-reply="replyToReply"
          @load-more-replies="loadMoreReplies"
          @view-profile="viewUserProfile"
          @submit-reply="handleSubmitReply"
          @submit-nested-reply="handleSubmitNestedReply"
        />
        
        <!-- 加载更多评论 -->
        <view class="load-more ripple" @tap="loadMoreComments" v-if="hasMoreComments">
          <text>查看更多评论</text>
        </view>
      </view>
    </view>
    
    <!-- 分享弹窗 -->
    <view class="share-popup" v-if="showSharePopup" @tap="closeSharePopup">
      <view class="share-container animate-slideUp" @tap.stop>
        <view class="share-header">
          <text class="share-title">分享到</text>
          <text class="close-icon" @tap="closeSharePopup">×</text>
        </view>
        <view class="share-options">
          <view class="share-option" @tap="shareToWechat">
            <view class="share-icon wechat">
              <text class="iconfont icon-wechat"></text>
            </view>
            <text class="share-name">微信</text>
          </view>
          <view class="share-option" @tap="shareToTimeline">
            <view class="share-icon timeline">
              <text class="iconfont icon-moments"></text>
            </view>
            <text class="share-name">朋友圈</text>
          </view>
          <view class="share-option" @tap="shareToQQ">
            <view class="share-icon qq">
              <text class="iconfont icon-qq"></text>
            </view>
            <text class="share-name">QQ</text>
          </view>
          <view class="share-option" @tap="shareToWeibo">
            <view class="share-icon weibo">
              <text class="iconfont icon-weibo"></text>
            </view>
            <text class="share-name">微博</text>
          </view>
          <view class="share-option" @tap="copyLink">
            <view class="share-icon link">
              <text class="iconfont icon-link"></text>
            </view>
            <text class="share-name">复制链接</text>
          </view>
        </view>
        <view class="share-cancel" @tap="closeSharePopup">
          取消
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api';
import TopicText from '@/components/TopicText.vue';
import UserCard from '@/components/UserCard.vue';
import CommentItem from '@/components/CommentItem.vue';
import { formatTime } from '@/utils/time';
import config from '@/utils/config.js';
import store from '@/utils/store.js';
import postActions from '@/utils/postActions.js';

export default {
  components: {
    TopicText,
    UserCard,
    CommentItem
  },
  data() {
    return {
      postId: null,
      post: {},
      comments: [],
      commentContent: '',
      isLiked: false,
      isCollected: false,
      isFollowing: false,
      currentUser: null,
      sortNewest: true,
      commentPage: 1,
      commentLimit: 20,
      hasMoreComments: false,
      activeReplyTo: null,
      showSharePopup: false,
      isInitializing: true,
      stateChecked: false,
      statesLoaded: false,
      showCommentBar: false,
      showNewCommentForm: false,
      newCommentContent: '',
      isLoadingComments: false,
      animatingLike: false,
      animatingCollect: false
    };
  },
  computed: {
    likeText() {
      return this.isLiked ? '已点赞' : '点赞';
    },
    collectText() {
      return this.isCollected ? '已收藏' : '收藏';
    },
    replyPlaceholder() {
      return this.activeReplyTo ? `回复 @${this.getReplyUserName(this.activeReplyTo)}` : '说点什么...';
    }
  },
  onLoad(options) {
    this.postId = options.id;
    this.isInitializing = true;
    this.stateChecked = false;
    this.statesLoaded = false;
    this.getCurrentUser();
    
    console.log('帖子详情页onLoad开始，postId:', this.postId);
    
    // 设置当前活动页面为DETAIL，并传递帖子ID作为上下文
    const postId = options.id ? parseInt(options.id) : null;
    if (postId) {
      postActions.setActivePage('detail', { postId });
    }
    
    // 确保按顺序加载数据：先加载帖子本身，然后是评论
    this.loadPost()
      .then(() => {
        console.log('帖子加载完成，开始加载评论');
        return this.loadComments(true); // 强制刷新评论
      })
      .then(() => {
        console.log('评论加载完成，开始检查帖子状态');
        return this.checkPostStatus();
      })
      .then(() => {
        this.stateChecked = true;
        this.statesLoaded = true;
        console.log('帖子状态初始化完成');
      })
      .catch((error) => {
        console.error('帖子初始化过程中发生错误:', error);
        this.stateChecked = false;
        console.log('帖子状态初始化失败，将使用默认状态');
      })
      .finally(() => {
        this.isInitializing = false;
        console.log('帖子详情页初始化完成');
      });
  },
  onShow() {
    if (this.postId && !this.isInitializing) {
      console.log('页面显示，重新检查状态');
      
      if (!this.statesLoaded) {
        uni.showLoading({
          title: '加载状态...',
          mask: false
        });
      }
      
      this.checkPostStatus().then(() => {
        this.statesLoaded = true;
      }).finally(() => {
        if (!this.statesLoaded) {
          uni.hideLoading();
        }
      });
    }
    
    // 当从其他页面返回时，刷新状态
    if (this.post && this.post.id) {
      this.initializePostStatus();
    }
  },
  onPullDownRefresh() {
    if (this.postId) {
      this.statesLoaded = false;
      Promise.all([
        this.loadPost(),
        this.loadComments(),
        this.checkPostStatus().then(() => {
          this.statesLoaded = true;
        })
      ]).then(() => {
        uni.stopPullDownRefresh();
      });
    } else {
      uni.stopPullDownRefresh();
    }
  },
  onUnload() {
    // 页面销毁时清理任何可能的全局影响
    console.log('帖子详情页销毁，清理效果');
    
    // 确保动画和过渡效果不会残留
    // 这里是页面销毁时的清理逻辑
  },
  onHide() {
    // 在页面隐藏前保存状态
    if (this.post && this.post.id) {
      this.savePostStatus();
    }
  },
  methods: {
    formatTime,
    
    async verifyLikeStatus() {
      try {
        const result = await api.batch.getPostStatus(this.postId);
        if (result.success) {
          this.isLiked = result.data.isLiked;
          console.log('验证点赞状态：', this.isLiked ? '已点赞' : '未点赞');
        }
      } catch (error) {
        console.error('验证点赞状态失败:', error);
      }
    },
    
    async verifyCollectStatus() {
      try {
        const result = await api.batch.getPostStatus(this.postId);
        if (result.success) {
          this.isCollected = result.data.isCollected;
          console.log('验证收藏状态：', this.isCollected ? '已收藏' : '未收藏');
        }
      } catch (error) {
        console.error('验证收藏状态失败:', error);
      }
    },
    
    async checkPostStatus() {
      try {
        console.log('开始检查帖子状态:', this.postId);
        
        // 首先检查本地直接存储的点赞记录
        const postLikeData = uni.getStorageSync(`post_like_${this.postId}`);
        if (postLikeData) {
          try {
            const likeStatus = JSON.parse(postLikeData);
            // 只有当用户ID匹配且时间不超过24小时时才使用
            if (likeStatus.userId === this.currentUser?.id && 
                Date.now() - likeStatus.timestamp < 86400000) {
              console.log('从本地存储获取直接点赞状态:', likeStatus.isLiked);
              this.isLiked = likeStatus.isLiked;
            }
          } catch (e) {
            console.error('解析本地点赞数据出错:', e);
          }
        }
        
        // 然后检查本地缓存状态
        const cachedStatus = uni.getStorageSync(`post_status_${this.postId}`);
        if (cachedStatus) {
          const parsedStatus = JSON.parse(cachedStatus);
          const cacheTime = parsedStatus._timestamp || 0;
          const now = Date.now();
          
          // 如果缓存不超过2分钟，使用缓存值
          if (now - cacheTime < 120000) { // 2分钟
            console.log(`使用缓存的状态数据(${Math.floor((now-cacheTime)/1000)}秒前)`, this.postId, parsedStatus);
            
            // 保存原始状态用于日志
            const originalLiked = this.isLiked;
            const originalCollected = this.isCollected;
            
            // 更新状态 (点赞状态优先使用直接存储的记录)
            if (postLikeData === '') { // 如果没有直接点赞记录才使用缓存的状态
            this.isLiked = parsedStatus.isLiked !== undefined ? parsedStatus.isLiked : this.isLiked;
            }
            this.isCollected = parsedStatus.isCollected !== undefined ? parsedStatus.isCollected : this.isCollected;
            this.isFollowing = parsedStatus.isFollowing !== undefined ? parsedStatus.isFollowing : this.isFollowing;
            
            // 记录状态变化
            if (originalLiked !== this.isLiked) {
              console.log(`点赞状态从${originalLiked}更新为${this.isLiked} (缓存)`);
            }
            if (originalCollected !== this.isCollected) {
              console.log(`收藏状态从${originalCollected}更新为${this.isCollected} (缓存)`);
            }
            
            // 使用缓存后仍然在后台请求新数据，但不阻塞UI
            this.updatePostStatusInBackground();
            
            // 这里可以返回缓存的数据
            return parsedStatus;
          }
        }
        
        // 尝试从API获取数据
        let retryCount = 0;
        const maxRetries = 2;
        let result = null;
        
        while (retryCount <= maxRetries) {
          try {
            // 添加随机参数，确保不使用缓存
            const randomParam = Math.random().toString(36).substring(2, 15);
            result = await api.batch.getPostStatus(this.postId);
            break; // 成功获取数据，跳出重试循环
          } catch (err) {
            retryCount++;
            console.error(`检查帖子状态失败(尝试${retryCount}/${maxRetries}):`, err);
            
            if (retryCount <= maxRetries) {
              // 等待一段时间再重试
              await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
            } else {
              // 重试次数用完，继续执行并使用回退逻辑
              console.error('检查帖子状态重试次数用完，尝试回退逻辑');
              return this.fallbackStatusCheck();
            }
          }
        }
        
        if (result && result.success) {
          // 保存原始状态用于日志
          const originalLiked = this.isLiked;
          const originalCollected = this.isCollected;
          
          // 确保数据存在
          if (!result.data) {
            console.error('获取帖子状态成功，但数据为空');
            return this.fallbackStatusCheck();
          }
          
          // 更新状态 (点赞状态优先使用直接存储的记录)
          if (postLikeData === '') { // 如果没有直接点赞记录才使用API返回的状态
          this.isLiked = result.data.isLiked !== undefined ? result.data.isLiked : this.isLiked;
          }
          this.isCollected = result.data.isCollected !== undefined ? result.data.isCollected : this.isCollected;
          this.isFollowing = result.data.isFollowing !== undefined ? result.data.isFollowing : this.isFollowing;
          
          // 记录状态变化
          if (originalLiked !== this.isLiked) {
            console.log(`点赞状态从${originalLiked}更新为${this.isLiked}`);
          }
          if (originalCollected !== this.isCollected) {
            console.log(`收藏状态从${originalCollected}更新为${this.isCollected}`);
          }
          
          // 缓存状态到本地存储
          const statusToCache = {
            ...result.data,
            _timestamp: Date.now() // 添加时间戳
          };
          
          try {
            uni.setStorageSync(`post_status_${this.postId}`, JSON.stringify(statusToCache));
            console.log('帖子状态已缓存:', this.postId);
          } catch (cacheErr) {
            console.error(`缓存帖子${this.postId}状态失败:`, cacheErr);
          }
          
          console.log('状态更新成功:', { 
            isLiked: this.isLiked, 
            isCollected: this.isCollected 
          });
          
          return result.data;
        } else {
          console.error('获取帖子状态失败:', result ? result.message : '未知错误');
          return this.fallbackStatusCheck();
        }
      } catch (error) {
        console.error('获取帖子状态请求异常:', error);
        return this.fallbackStatusCheck();
      }
    },
    
    /**
     * 当API获取状态失败时的回退处理策略
     */
    fallbackStatusCheck() {
      console.log('执行回退状态检查策略');
      
      // 创建默认状态对象
      const defaultStatus = {
        isLiked: this.isLiked,
        isCollected: this.isCollected,
        isFollowing: this.isFollowing
      };
      
      // 尝试从本地存储获取点赞直接状态
      try {
        const postLikeData = uni.getStorageSync(`post_like_${this.postId}`);
        if (postLikeData) {
          const likeStatus = JSON.parse(postLikeData);
          // 检查是否在有效期内(24小时)
          if (likeStatus.userId === this.currentUser?.id && 
              Date.now() - likeStatus.timestamp < 86400000) {
            console.log('回退策略: 使用本地存储的直接点赞状态');
            this.isLiked = likeStatus.isLiked;
            defaultStatus.isLiked = likeStatus.isLiked;
          }
        }
      } catch (e) {
        console.error('解析本地点赞数据出错(回退策略):', e);
      }
      
      // 记录使用回退策略
      console.log('使用回退策略的状态:', defaultStatus);
      
      return defaultStatus;
    },

    /**
     * 在后台更新状态，不会影响UI响应性
     */
    async updatePostStatusInBackground() {
        try {
        console.log('开始在后台更新帖子状态');
        // 直接传递postId，让API方法自己处理参数
          const result = await api.batch.getPostStatus(this.postId);
          
          if (result && result.success && result.data) {
          // 只更新非点赞状态 (点赞状态单独处理)
            this.isCollected = result.data.isCollected !== undefined ? result.data.isCollected : this.isCollected;
            this.isFollowing = result.data.isFollowing !== undefined ? result.data.isFollowing : this.isFollowing;
            
          // 缓存到本地
            const statusToCache = {
              ...result.data,
              _timestamp: Date.now()
            };
            
            uni.setStorageSync(`post_status_${this.postId}`, JSON.stringify(statusToCache));
          console.log('后台更新状态成功');
        }
      } catch (err) {
        console.error('后台更新帖子状态出错:', err);
        // 这里不需要处理错误，因为是后台静默更新
      }
    },
    
    async getCurrentUser() {
      try {
        // 首先检查是否有token
        const token = uni.getStorageSync('token');
        if (!token) {
          console.log('未找到token，用户未登录');
          this.currentUser = null;
          return;
        }
        
        const userInfo = await api.auth.getInfo();
        if (userInfo.success && userInfo.data) {
          console.log('获取用户信息成功:', userInfo.data);
          // 确保data.user存在，有些API返回data直接就是用户信息，有些是包含在user字段中
          this.currentUser = userInfo.data.user || userInfo.data;
          
          // 记录到控制台用于调试
          console.log('当前用户已设置:', this.currentUser);
        } else {
          console.warn('API返回成功但没有用户数据:', userInfo);
          this.currentUser = null;
        }
      } catch (error) {
        console.error('获取当前用户信息失败:', error);
        this.currentUser = null;
      }
    },
    
    async loadPost() {
      uni.showLoading({
        title: '加载中...',
        mask: true
      });
      
      try {
        const result = await api.posts.getDetail(this.postId);
        
        if (result.success) {
          this.post = result.data;
          
          // 如果帖子有作者信息，获取作者的徽章
          if (this.post.author && this.post.author.id) {
            try {
              const badgesResult = await api.users.getBadges(this.post.author.id);
              if (badgesResult.success && badgesResult.data) {
                console.log('获取作者徽章成功:', badgesResult.data);
                // 将徽章添加到作者信息中
                this.post.author.badges = badgesResult.data;
              }
            } catch (badgeError) {
              console.error('获取作者徽章失败:', badgeError);
            }
          }
          
          if (!this.stateChecked) {
            await this.checkPostStatus();
          }
          
          this.recordView();
        } else {
          uni.showToast({
            title: result.message || '获取帖子失败',
            icon: 'none'
          });
        }
        
        uni.hideLoading();
      } catch (error) {
        uni.hideLoading();
        console.error('获取帖子详情失败:', error);
        uni.showToast({
          title: '获取帖子失败，请稍后再试',
          icon: 'none'
        });
      }
    },
    
    async recordView() {
      try {
        await api.posts.recordView(this.postId);
      } catch (error) {
        console.error('记录浏览量失败:', error);
      }
    },
    
    /**
     * 从本地存储中获取评论的点赞状态
     */
    getCommentLikeStatus(commentId) {
      try {
        const storageKey = `comment_like_${commentId}`;
        const likeData = uni.getStorageSync(storageKey);
        
        if (likeData) {
          const parsedData = JSON.parse(likeData);
          // 检查是否在有效期内(24小时)和用户匹配
          if (parsedData.userId === this.currentUser?.id && 
              Date.now() - parsedData.timestamp < 86400000) {
            return parsedData.isLiked;
          }
        }
      } catch (e) {
        console.error('获取评论点赞状态出错:', e);
      }
      
      return undefined; // 未找到状态或已过期
    },
    
    /**
     * 加载帖子评论
     */
    async loadComments(refresh = false) {
      if (this.isLoadingComments && !refresh) {
        return;
      }
      
      try {
        console.log('开始加载评论，postId:', this.postId);
        this.isLoadingComments = true;
        
        // 如果是刷新，重置页码
        if (refresh) {
          this.commentPage = 1;
          this.comments = [];
          this.hasMoreComments = true;
        }
        
        if (!this.hasMoreComments) {
          console.log('没有更多评论了');
          this.isLoadingComments = false;
          return;
        }
        
        // 调用API获取评论
        console.log('准备请求评论API, 参数:', {
          postId: this.postId,
          page: this.commentPage,
          limit: this.commentLimit,
          sort: this.sortNewest ? 'latest' : 'popular'
        });
        
        if (!this.postId) {
          console.error('加载评论失败：没有帖子ID');
          this.isLoadingComments = false;
          return;
        }
        
        // 添加时间戳和随机参数，确保不使用缓存
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        
        const response = await api.comments.getList(this.postId, {
          page: this.commentPage,
          limit: this.commentLimit,
          sort: this.sortNewest ? 'latest' : 'popular',
          _t: timestamp,
          _r: random
        });
        
        console.log('评论API响应:', JSON.stringify(response));
        
        if (response.success && response.data) {
          // 处理并映射评论数据
          const commentsData = response.data.comments || [];
          console.log('原始评论数据完整示例:', JSON.stringify(commentsData[0] || {}));
          
          // 显示评论的完整属性列表
          if (commentsData.length > 0) {
            console.log('评论对象属性列表:', Object.keys(commentsData[0] || {}));
            console.log('示例评论的userId:', commentsData[0].userId);
            console.log('示例评论的isAnonymous:', commentsData[0].isAnonymous);
          }
          
          // 调试评论作者信息
          commentsData.forEach((comment, index) => {
            // 确保评论对象有效
            if (!comment || typeof comment !== 'object') {
              console.error('无效评论对象:', comment);
              return;
            }
            
            // 格式化isAnonymous字段，确保它是布尔值
            if (comment.isAnonymous !== undefined) {
              // 明确指定只有true、1或'1'才算作匿名，其他情况都是非匿名
              comment.isAnonymous = comment.isAnonymous === true || 
                                  comment.isAnonymous === 1 || 
                                  comment.isAnonymous === '1';
              console.log('最终处理后的评论匿名状态:', comment.id, comment.isAnonymous);
            }
            
            console.log(`评论${index+1} (ID:${comment.id}): isAnonymous=${comment.isAnonymous}, userId=${comment.userId}`);
            
            // 处理评论作者信息
            if (!comment.isAnonymous) {
              // 后端返回的是author.nickname格式，需要处理成user对象格式
              if (comment['author.nickname'] || comment['author.id']) {
                console.log('处理评论的author字段:', comment['author.nickname']);
                // 确保user对象存在
                comment.user = {
                  id: comment['author.id'],
                  nickname: comment['author.nickname'],
                  username: comment['author.username'],
                  avatar: comment['author.avatar'] || '/static/images/default-avatar.png'
                };
              } 
              // 后端返回的是author对象格式
              else if (comment.author) {
                console.log('处理评论的author对象:', comment.author);
                // 同步author信息到user字段
                comment.user = {
                  id: comment.author.id,
                  nickname: comment.author.nickname || comment.author.username,
                  username: comment.author.username,
                  avatar: comment.author.avatar || '/static/images/default-avatar.png'
                };
              }
            }
            
            // 处理评论的回复，同样处理匿名状态
            if (comment.replies && comment.replies.length > 0) {
              comment.replies.forEach((reply, replyIndex) => {
                if (!reply || typeof reply !== 'object') {
                  console.error('无效回复对象:', reply);
                  return;
                }
                
                // 格式化回复的isAnonymous字段
                if (reply.isAnonymous !== undefined) {
                  // 明确指定只有true、1或'1'才算作匿名，其他情况都是非匿名
                  reply.isAnonymous = reply.isAnonymous === true || 
                                     reply.isAnonymous === 1 || 
                                     reply.isAnonymous === '1';
                  console.log('最终处理后的回复匿名状态:', reply.id, reply.isAnonymous);
                }
                
                console.log(`-- 回复${replyIndex+1} (ID:${reply.id}): isAnonymous=${reply.isAnonymous}, userId=${reply.userId}`);
                
                // 处理回复的作者信息
                if (!reply.isAnonymous) {
                  // 处理点号格式的作者信息
                  if (reply['author.nickname'] || reply['author.id']) {
                    reply.user = {
                      id: reply['author.id'],
                      nickname: reply['author.nickname'],
                      username: reply['author.username'],
                      avatar: reply['author.avatar'] || '/static/images/default-avatar.png'
                    };
                  } 
                  // 处理对象格式的作者信息
                  else if (reply.author) {
                    reply.user = {
                      id: reply.author.id,
                      nickname: reply.author.nickname || reply.author.username,
                      username: reply.author.username,
                      avatar: reply.author.avatar || '/static/images/default-avatar.png'
                    };
                  }
                }
              });
            }
          });
          
          // 避免空评论数据导致错误
          if (!Array.isArray(commentsData)) {
            console.error('评论数据格式错误，期望数组但收到:', typeof commentsData);
            this.isLoadingComments = false;
                uni.showToast({
              title: '评论数据格式错误',
                  icon: 'none'
                });
            return;
          }
          
          // 为每个评论恢复点赞状态
          const processedComments = commentsData.map(comment => {
            // 确保评论对象有效
            if (!comment || typeof comment !== 'object') {
              console.error('无效评论对象:', comment);
              return null;
            }
            
            // 格式化isAnonymous字段，确保它是布尔值
            if (comment.isAnonymous !== undefined) {
              comment.isAnonymous = !!comment.isAnonymous && comment.isAnonymous !== '0' && comment.isAnonymous !== 'false';
            }
            
            // 从本地存储获取点赞状态
            const cachedLikeStatus = this.getCommentLikeStatus(comment.id);
            
            // 如果有缓存状态，优先使用缓存
            if (cachedLikeStatus !== undefined) {
              comment.isLiked = cachedLikeStatus;
            }
            
            // 处理评论的回复，为每个回复也恢复点赞状态
            if (comment.replies && comment.replies.length > 0) {
              comment.replies = comment.replies.map(reply => {
                if (!reply || typeof reply !== 'object') {
                  console.error('无效回复对象:', reply);
                  return null;
                }
                
                // 格式化回复的isAnonymous字段
                if (reply.isAnonymous !== undefined) {
                  reply.isAnonymous = !!reply.isAnonymous && reply.isAnonymous !== '0' && reply.isAnonymous !== 'false';
                }
                
                // 获取回复的点赞状态
                const replyLikeStatus = this.getReplyLikeStatus(reply.id);
                if (replyLikeStatus !== undefined) {
                  reply.isLiked = replyLikeStatus;
                }
                return reply;
              }).filter(reply => reply !== null); // 过滤掉无效回复
            }
            
            return comment;
          }).filter(comment => comment !== null); // 过滤掉无效评论
          
          if (refresh) {
            this.comments = processedComments;
            } else {
            this.comments = [...this.comments, ...processedComments];
          }
          
          // 检查是否还有更多页
          this.hasMoreComments = response.data.total > this.comments.length;
          this.commentPage++;
          
          console.log(`加载评论成功，当前共${this.comments.length}条, 总数: ${response.data.total}`);
              } else {
          console.error('加载评论失败:', response?.message || '未知错误', '详细响应:', response);
          
                uni.showToast({
            title: '加载评论失败',
                  icon: 'none'
                });
            }
          } catch (error) {
        console.error('加载评论异常:', error, '堆栈:', error.stack);
        
              uni.showToast({
          title: '加载评论出错，请重试',
                icon: 'none'
              });
      } finally {
        this.isLoadingComments = false;
      }
    },
    
    // 添加新方法处理内联评论提交
    async handleSubmitReply(data) {
      uni.showLoading({
        title: '发送中...',
        mask: true
      });
      
      try {
        // 获取用户匿名设置
        let isAnonymous = false;
        try {
          // 从本地存储获取
          const anonymousMode = uni.getStorageSync('anonymousMode');
          isAnonymous = anonymousMode === 'true';
          
          // 如果本地存储没有，尝试从用户设置获取
          if (anonymousMode === '') {
            const userSettings = uni.getStorageSync('userSettings');
            if (userSettings) {
              const settings = JSON.parse(userSettings);
              isAnonymous = settings?.privacy?.anonymousMode || false;
            }
          }
          
          console.log('评论匿名模式:', isAnonymous ? '开启' : '关闭');
        } catch (err) {
          console.error('获取匿名设置失败:', err);
        }
        
        const result = await api.comments.reply(data.commentId, {
          content: data.content,
          commentId: data.commentId,
          postId: this.postId,
          isAnonymous
        });
            
            if (result.success) {
          this.loadComments();
              
              uni.showToast({
            title: '回复成功',
                icon: 'success'
              });
        }
      } catch (error) {
        console.error('提交回复失败:', error);
                uni.showToast({
          title: '提交失败，请稍后再试',
                  icon: 'none'
                });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 添加处理嵌套回复提交的方法
    async handleSubmitNestedReply(data) {
      uni.showLoading({
        title: '发送中...',
        mask: true
      });
      
      try {
        // 获取用户匿名设置
        let isAnonymous = false;
        try {
          const anonymousMode = uni.getStorageSync('anonymousMode');
          isAnonymous = anonymousMode === 'true';
          
          if (anonymousMode === '') {
            const userSettings = uni.getStorageSync('userSettings');
            if (userSettings) {
              const settings = JSON.parse(userSettings);
              isAnonymous = settings?.privacy?.anonymousMode || false;
            }
          }
        } catch (err) {
          console.error('获取匿名设置失败:', err);
        }
        
        const result = await api.comments.replyToReply(data.commentId, data.replyId, {
          content: data.content,
          commentId: data.commentId,
          postId: this.postId,
          replyId: data.replyId,
          isAnonymous
        });
            
            if (result.success) {
          this.loadComments();
              
              uni.showToast({
            title: '回复成功',
                icon: 'success'
              });
        }
      } catch (error) {
        console.error('提交嵌套回复失败:', error);
                uni.showToast({
          title: '提交失败，请稍后再试',
                  icon: 'none'
                });
      } finally {
        uni.hideLoading();
      }
    },
    
    /**
     * 显示评论输入框
     */
    showNewCommentInput() {
      this.showNewCommentForm = true;
      this.newCommentContent = '';
    },
    
    /**
     * 隐藏评论输入框
     */
    hideNewCommentInput() {
      this.showNewCommentForm = false;
      this.newCommentContent = '';
    },
    
    /**
     * 评论输入框失焦处理
     */
    onNewCommentBlur() {
      // 失焦时处理，这里不做自动隐藏防止误触
    },
    
    async submitNewComment() {
      if (!this.newCommentContent.trim()) {
              uni.showToast({
          title: '评论内容不能为空',
                icon: 'none'
              });
        return;
      }
      
      uni.showLoading({
        title: '发送中...',
        mask: true
      });
      
      try {
        // 获取用户匿名设置
        let isAnonymous = false;
        try {
          const anonymousMode = uni.getStorageSync('anonymousMode');
          isAnonymous = anonymousMode === 'true';
          
          if (anonymousMode === '') {
            const userSettings = uni.getStorageSync('userSettings');
            if (userSettings) {
              const settings = JSON.parse(userSettings);
              isAnonymous = settings?.privacy?.anonymousMode || false;
            }
          }
          
          console.log('评论匿名模式:', isAnonymous ? '开启' : '关闭');
        } catch (err) {
          console.error('获取匿名设置失败:', err);
        }
        
        const result = await api.comments.add(this.postId, {
          content: this.newCommentContent.trim(),
          isAnonymous
        });

        if (result.success) {
          // 清空输入框
          this.newCommentContent = '';
          this.hideNewCommentInput();

          // 更新评论计数
          this.post.comments++;

          // 重置到第一页并重新加载评论
          this.commentPage = 1;
          this.comments = []; // 清空现有评论列表
          await this.loadComments();

          uni.showToast({
            title: '评论成功',
            icon: 'success'
          });
        }
      } catch (error) {
        console.error('提交评论失败:', error);
        uni.showToast({
          title: '提交失败，请稍后再试',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },

    /**
     * 保存回复点赞状态到本地存储
     */
    saveReplyLikeStatus(replyId, isLiked) {
      try {
        const likeData = {
          isLiked,
          replyId,
          userId: this.currentUser?.id,
          timestamp: Date.now()
        };
        uni.setStorageSync(`reply_like_${replyId}`, JSON.stringify(likeData));
        console.log(`保存回复${replyId}点赞状态: ${isLiked}`);
      } catch (e) {
        console.error('保存回复点赞状态出错:', e);
      }
    },

    /**
     * 从本地存储中获取回复的点赞状态
     */
    getReplyLikeStatus(replyId) {
      try {
        const storageKey = `reply_like_${replyId}`;
        const likeData = uni.getStorageSync(storageKey);
        
        if (likeData) {
          const parsedData = JSON.parse(likeData);
          // 检查是否在有效期内(24小时)和用户匹配
          if (parsedData.userId === this.currentUser?.id && 
              Date.now() - parsedData.timestamp < 86400000) {
            return parsedData.isLiked;
          }
        }
      } catch (e) {
        console.error('获取回复点赞状态出错:', e);
      }
      
      return undefined; // 未找到状态或已过期
    },

    /**
     * 保存评论点赞状态到本地存储
     */
    saveCommentLikeStatus(commentId, isLiked) {
      try {
        const likeData = {
          isLiked,
          commentId,
          userId: this.currentUser?.id,
          timestamp: Date.now()
        };
        uni.setStorageSync(`comment_like_${commentId}`, JSON.stringify(likeData));
        console.log(`保存评论${commentId}点赞状态: ${isLiked}`);
      } catch (e) {
        console.error('保存评论点赞状态出错:', e);
      }
    },

    /**
     * 处理评论点赞或取消点赞
     */
    async handleCommentLike(comment) {
      console.log('评论点赞操作:', comment.id);
      const success = await postActions.handleCommentLike(comment, this.post.id);
      if (success && this.$refs[`commentLikeBtn${comment.id}`]) {
        // 添加动画效果
        this.$refs[`commentLikeBtn${comment.id}`][0]?.startAnimation();
      }
    },

    /**
     * 处理回复点赞或取消点赞
     */
    async handleReplyLike(reply) {
      if (!this.currentUser) {
        this.showLoginTip();
        return;
      }

      try {
        // 先更新UI状态，提高响应性
        const originalLiked = reply.isLiked;
        reply.isLiked = !originalLiked;
        
        // 首先更新本地点赞数
        reply.likes = reply.likes + (reply.isLiked ? 1 : -1);
        
        // 保存到本地存储
        this.saveReplyLikeStatus(reply.id, reply.isLiked);
        
        // 记录操作开始
        console.log(`回复${reply.isLiked ? '点赞' : '取消点赞'}操作开始:`, reply.id);
        
        // 调用API
        const result = await (reply.isLiked 
          ? api.comments.likeReply(reply.id) 
          : api.comments.unlikeReply(reply.id)
        );
        
        console.log(`回复${reply.isLiked ? '点赞' : '取消点赞'}请求结果:`, result);
        
        // 操作成功，直接返回
        if (result && result.success) {
          return true;
        }
        
        // 如果请求失败，恢复到原始状态
        console.error(`回复${reply.isLiked ? '点赞' : '取消点赞'}失败:`, result?.message || '未知错误');
        reply.isLiked = originalLiked;
        reply.likes = reply.likes + (originalLiked ? 1 : -1);
        
        // 更新本地存储为原始状态
        this.saveReplyLikeStatus(reply.id, originalLiked);
        
        // 显示错误消息
        uni.showToast({
          title: `操作失败，请重试`,
          icon: 'none'
        });
        
        return false;
      } catch (error) {
        console.error(`回复${reply.isLiked ? '点赞' : '取消点赞'}异常:`, error);
        
        // 异常时，恢复原状态
        const originalLiked = !reply.isLiked;
        reply.isLiked = originalLiked;
        reply.likes = reply.likes + (originalLiked ? 1 : -1);
        
        // 更新本地存储
        this.saveReplyLikeStatus(reply.id, originalLiked);
        
        // 显示错误消息
        uni.showToast({
          title: `操作失败，请重试`,
          icon: 'none'
        });
        
        return false;
      }
    },
    
    /**
     * 加载更多回复
     */
    async loadMoreReplies(comment) {
      if (!comment || comment.loadingReplies) {
        return;
      }
      
      try {
        // 设置加载中状态
        comment.loadingReplies = true;
        
        // 获取当前页码
        const page = comment.repliesPage || 1;
        
        // 调用API获取回复
        const response = await api.comments.getReplies(comment.id, {
          page: page + 1,
          limit: 5
        });
        
        if (response.success && response.data) {
          // 获取回复数据
          const { replies, pagination } = response.data;
          
          // 处理回复数据，恢复点赞状态
          const processedReplies = replies.map(reply => {
            // 从本地存储获取点赞状态
            const cachedLikeStatus = this.getReplyLikeStatus(reply.id);
            
            // 如果有缓存状态，优先使用
            if (cachedLikeStatus !== undefined) {
              reply.isLiked = cachedLikeStatus;
            }
            
            return reply;
          });
          
          // 更新回复列表
          comment.replies = [...(comment.replies || []), ...processedReplies];
          
          // 更新分页信息
          comment.repliesPage = pagination.page;
          comment.hasMoreReplies = pagination.page < pagination.pages;
          
          // 打印日志
          console.log(`加载更多回复成功，评论${comment.id}现有${comment.replies.length}条回复`);
        } else {
          // 请求失败
          console.error('加载更多回复失败:', response?.message || '未知错误');
          
          uni.showToast({
            title: '加载回复失败',
            icon: 'none'
          });
        }
      } catch (error) {
        // 异常处理
        console.error('加载更多回复异常:', error);
        
        uni.showToast({
          title: '加载回复失败，请重试',
          icon: 'none'
        });
      } finally {
        // 重置加载中状态
        comment.loadingReplies = false;
        
        // 强制更新视图
        this.$forceUpdate();
      }
    },

    /**
     * 话题点击处理函数
     */
    handleTopicClick(topicName) {
      console.log('话题点击:', topicName);
      
      uni.navigateTo({
        url: `/pages/topic/topic-detail?name=${encodeURIComponent(topicName)}`
      });
    },

    /**
     * 处理关注/取消关注用户
     */
    async handleFollow(user, shouldFollow) {
      try {
        if (!this.currentUser) {
          this.showLoginTip();
          return;
        }
        
        if (shouldFollow) {
          await api.users.follow(user.id);
            uni.showToast({
            title: '关注成功',
              icon: 'success'
            });
        } else {
          await api.users.unfollow(user.id);
            uni.showToast({
            title: '已取消关注',
              icon: 'success'
            });
        }
        
        this.isFollowing = shouldFollow;
      } catch (error) {
        uni.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
        console.error('关注/取消关注错误:', error);
      }
    },

    /**
     * 显示登录提示
     */
    showLoginTip() {
      uni.showModal({
        title: '提示',
        content: '请先登录后再操作',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
    },

    /**
     * 回复评论
     */
    replyToComment(comment) {
      if (!this.currentUser) {
        this.showLoginTip();
        return;
      }
      console.log('回复评论', comment.id);
    },
    
    /**
     * 回复回复
     */
    replyToReply(reply, comment) {
      if (!this.currentUser) {
        this.showLoginTip();
        return;
      }
      console.log('回复回复', reply.id, '评论ID:', comment.id);
    },
    
    /**
     * 查看用户资料
     */
    viewUserProfile(user) {
      if (!user || !user.id) return;
      
      uni.navigateTo({
        url: `/pages/user-profile/user-profile?id=${user.id}`
      });
    },

    /**
     * 加载更多评论
     */
    loadMoreComments() {
      if (this.hasMoreComments && !this.isLoadingComments) {
        this.loadComments();
      }
    },

    /**
     * 切换评论排序方式
     */
    toggleSortOrder() {
      this.sortNewest = !this.sortNewest;
      this.commentPage = 1;
      this.comments = [];
      this.loadComments(true);
    },

    /**
     * 滚动到评论区
     */
    scrollToComments() {
      this.showNewCommentInput();
      
      setTimeout(() => {
      uni.createSelectorQuery().select('#comments').boundingClientRect(rect => {
        if (rect) {
          uni.pageScrollTo({
            scrollTop: rect.top,
            duration: 300
          });
        }
      }).exec();
      }, 300);
    },

    /**
     * 显示分享选项
     */
    showShareOptions() {
      this.showSharePopup = true;
    },
    
    /**
     * 关闭分享弹窗
     */
    closeSharePopup() {
      this.showSharePopup = false;
    },
    
    /**
     * 分享到微信
     */
    shareToWechat() {
      uni.showToast({
        title: '已分享到微信',
        icon: 'success'
      });
      this.closeSharePopup();
    },
    
    /**
     * 分享到朋友圈
     */
    shareToTimeline() {
      uni.showToast({
        title: '已分享到朋友圈',
        icon: 'success'
      });
      this.closeSharePopup();
    },
    
    /**
     * 分享到QQ
     */
    shareToQQ() {
      uni.showToast({
        title: '已分享到QQ',
        icon: 'success'
      });
      this.closeSharePopup();
    },
    
    /**
     * 分享到微博
     */
    shareToWeibo() {
      uni.showToast({
        title: '已分享到微博',
        icon: 'success'
      });
      this.closeSharePopup();
    },
    
    /**
     * 复制链接
     */
    copyLink() {
      const link = `https://campus-wall.com/post/${this.postId}`;
      uni.setClipboardData({
        data: link,
        success: () => {
          uni.showToast({
            title: '链接已复制',
            icon: 'success'
          });
        }
      });
      this.closeSharePopup();
    },

    /**
     * 显示帖子操作选项
     */
    showPostOptions() {
      const isMyPost = this.currentUser && this.post.author && this.currentUser.id === this.post.author.id;
      
      let itemList = ['举报'];
      if (isMyPost) {
        itemList = ['编辑', '删除', ...itemList];
      }
      
      uni.showActionSheet({
        itemList,
        success: res => {
          if (isMyPost) {
            if (res.tapIndex === 0) {
              uni.navigateTo({
                url: `/pages/publish/publish?id=${this.postId}&edit=true`
              });
            } else if (res.tapIndex === 1) {
              this.deletePost();
            }
          } else {
            if (res.tapIndex === 0) {
              uni.showToast({
                title: '举报功能开发中',
                icon: 'none'
              });
            }
          }
        }
      });
    },
    
    /**
     * 删除帖子
     */
    deletePost() {
      uni.showModal({
        title: '删除帖子',
        content: '确定要删除这篇帖子吗？',
        success: async res => {
          if (res.confirm) {
            uni.showLoading({
              title: '删除中...',
              mask: true
            });
            
            try {
              const result = await api.posts.delete(this.postId);
              
              if (result.success) {
                uni.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                
                setTimeout(() => {
                  uni.navigateBack();
                }, 1000);
              } else {
                uni.showToast({
                  title: result.message || '删除失败',
                  icon: 'none'
                });
              }
            } catch (error) {
              console.error('删除帖子失败:', error);
              uni.showToast({
                title: '删除失败，请稍后再试',
                icon: 'none'
              });
            } finally {
              uni.hideLoading();
            }
          }
        }
      });
    },
    
    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack();
    },
    
    /**
     * 预览图片
     */
    previewImage(index) {
      if (!this.post.images || this.post.images.length === 0) return;
      
      uni.previewImage({
        urls: this.post.images,
        current: this.post.images[index]
      });
    },
    
    /**
     * 导航栏按钮点击处理
     */
    onNavigationBarButtonTap() {
      if (this.postId) {
        this.checkPostStatus();
      }
    },
    
    /**
     * 刷新状态
     */
    async refreshStatus() {
      uni.showLoading({
        title: '刷新中...',
        mask: true
      });
      
      try {
        await this.checkPostStatus();
        
        uni.showToast({
          title: '状态刷新成功',
          icon: 'success'
        });
      } catch (error) {
        console.error('刷新状态失败:', error);
        uni.showToast({
          title: '刷新失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },

    /**
     * 处理收藏帖子操作
     */
    async handleCollect() {
      console.log('详情页收藏操作:', this.post.id);
      const success = await postActions.handlePostCollect(this.post);
      if (success) {
        // 添加动画效果
        this.$refs.collectBtn?.startAnimation();
      }
    },
    
    // 处理帖子点赞或取消点赞
    async handleLike() {
      console.log('详情页点赞操作:', this.post.id);
      const success = await postActions.handlePostLike(this.post);
      if (success) {
        // 添加动画效果
        this.$refs.likeBtn?.startAnimation();
      }
    },
    
    // 显示登录提示
    showLoginPrompt() {
      uni.showModal({
        title: '提示',
        content: '请先登录后再操作',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
    },
    
    /**
     * 初始化帖子状态
     */
    async initializePostStatus() {
      if (!this.post || !this.post.id) return;
      
      console.log('详情页初始化帖子状态:', this.post.id);
      
      // 使用统一状态管理函数
      const result = await postActions.initializePostStatus(this.post);
      console.log('详情页初始化帖子状态结果:', result);
      
      // 如果是从本地加载的缓存，强制更新数据绑定
      if (result.fromCache) {
        this.$forceUpdate();
      }
    },
    
    /**
     * 保存帖子状态到本地缓存
     */
    savePostStatus() {
      if (!this.post || !this.post.id) return;
      
      console.log('保存帖子状态到本地缓存:', this.post.id);
      
      // 更新全局状态
      store.mutations.updatePost(this.post.id, {
        isLiked: this.post.isLiked,
        isCollected: this.post.isCollected,
        likes: this.post.likes,
        collections: this.post.collections
      });
    },
    
    // 修改获取帖子详情的方法
    async fetchPostDetail() {
      // ... 保持其他代码不变 ...
      
      // 获取帖子后，初始化状态
      if (this.post && this.post.id) {
        await this.initializePostStatus();
      }
      
      // ... 保持其他代码不变 ...
    },
  }
};
</script>

<style scoped>
.post-detail-container {
  min-height: 100vh;
  background-color: #F5F7FA;
  padding-bottom: 150rpx;
  position: relative;
  will-change: auto;
  isolation: isolate;
}

/* 导航栏样式 */
.nav-bar {
  height: 90rpx;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.nav-back {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.nav-back:active {
  background-color: rgba(0, 0, 0, 0.05);
}

.nav-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.nav-right {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.nav-right:active {
  background-color: rgba(0, 0, 0, 0.05);
}

/* 帖子内容样式 */
.post-detail-card {
  background: #FFFFFF;
  margin-bottom: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.02);
}

.post-content {
  margin: 30rpx 0;
  font-size: 32rpx;
  line-height: 1.7;
  color: #333333;
  letter-spacing: 0.5rpx;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 20rpx -5rpx;
  gap: 10rpx;
}

.post-image {
  width: calc(33.33% - 10rpx);
  height: 240rpx;
  margin: 5rpx;
  border-radius: 16rpx;
  background-color: #F7F9FC;
  object-fit: cover;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.post-image:active {
  transform: scale(0.98);
  box-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.1);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  margin: 30rpx 0 20rpx;
}

.topic-tag {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.08), rgba(106, 182, 247, 0.15));
  color: #4A90E2;
  font-size: 24rpx;
  font-weight: 500;
  padding: 10rpx 24rpx;
  border-radius: 30rpx;
  margin-right: 16rpx;
  margin-bottom: 16rpx;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(74, 144, 226, 0.1);
}

.topic-tag:active {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 12rpx rgba(74, 144, 226, 0.15);
}

.category-tag {
  background: #F4F7F9;
  color: #666666;
  font-size: 24rpx;
  font-weight: 500;
  padding: 10rpx 24rpx;
  border-radius: 30rpx;
  margin-bottom: 16rpx;
}

/* 位置信息样式 */
.location-info {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #8E9AAA;
  margin-top: 20rpx;
}

.location-info .iconfont {
  margin-right: 8rpx;
  font-size: 28rpx;
}

.location-text {
  max-width: 600rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 帖子操作栏样式 */
.action-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-top: 30rpx;
  padding-top: 30rpx;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10rpx 20rpx;
  font-size: 24rpx;
  color: #666666;
  border-radius: 16rpx;
  transition: all 0.3s ease;
}

.action-item:active {
  background-color: rgba(74, 144, 226, 0.08);
  transform: scale(0.95);
}

.action-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;
}

.action-item .css-icon {
  font-size: 44rpx;
  transition: all 0.3s ease;
}

.action-item .icon-image {
  width: 44rpx;
  height: 44rpx;
  object-fit: contain;
  margin: 0;
}

.action-item .active {
  color: #FF4757;
  font-weight: bold;
  transform: scale(1.2);
  text-shadow: 0 0 8rpx rgba(255, 71, 87, 0.3);
  animation: post-detail-heartbeat 1.5s infinite;
}

@keyframes post-detail-heartbeat {
  0% {
    transform: scale(1.2);
  }
  15% {
    transform: scale(1.3);
  }
  30% {
    transform: scale(1.2);
  }
  45% {
    transform: scale(1.3);
  }
  60% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1.2);
  }
}

.action-text {
  font-size: 24rpx;
  color: #666666;
  transition: color 0.3s ease;
  margin-left: 4rpx;
}

.active-text {
  color: #FF4757;
  font-weight: bold;
  animation: post-detail-textPulse 1.5s infinite;
}

@keyframes post-detail-textPulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

/* 评论区样式 */
.comments-section {
  background: #FFFFFF;
  padding: 30rpx;
  margin-top: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.02);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333333;
}

.section-actions {
  display: flex;
  align-items: center;
}

.new-comment-btn {
  font-size: 28rpx;
  color: #4A90E2;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  margin-right: 16rpx;
}

.new-comment-btn:active {
  background-color: rgba(74, 144, 226, 0.08);
}

.sort-text {
  font-size: 24rpx;
  color: #4A90E2;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.sort-text:active {
  background-color: rgba(74, 144, 226, 0.08);
}

.comment-list {
  margin-bottom: 20rpx;
}

.no-comments {
  text-align: center;
  padding: 60rpx 0;
  color: #8E9AAA;
  font-size: 28rpx;
}

.load-more {
  text-align: center;
  color: #4A90E2;
  font-size: 28rpx;
  padding: 30rpx 0;
  margin-top: 10rpx;
  border-radius: 10rpx;
}

.load-more:active {
  background-color: rgba(74, 144, 226, 0.08);
}

/* 评论输入框 */
.comment-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  padding: 20rpx 30rpx;
  box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  z-index: 100;
}

.input-area {
  flex: 1;
  display: flex;
  align-items: center;
}

.comment-input {
  flex: 1;
  height: 80rpx;
  background: #F7F9FC;
  border-radius: 40rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  transition: all 0.3s ease;
}

.comment-input:focus {
  background: #EFF4FB;
  box-shadow: 0 2rpx 10rpx rgba(74, 144, 226, 0.1);
}

.send-btn {
  min-width: 120rpx;
  height: 80rpx;
  background: var(--primary-gradient);
  color: #FFFFFF;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 20rpx;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(74, 144, 226, 0.2);
}

.send-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 6rpx rgba(74, 144, 226, 0.1);
}

.send-btn:disabled {
  background: #CCCCCC;
  color: #FFFFFF;
  box-shadow: none;
}

/* 分享弹窗样式 */
.share-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
  animation: post-detail-fadeIn 0.3s ease-out;
}

.share-container {
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 24px 24px 0 0;
  overflow: hidden;
}

.share-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.share-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-icon {
  font-size: 24px;
  color: #8E9AAA;
  padding: 5px;
}

.share-options {
  display: flex;
  flex-wrap: wrap;
  padding: 20px;
  justify-content: space-around;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px;
  width: 20%;
}

.share-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.share-icon:active {
  transform: scale(0.9);
}

.share-icon.wechat {
  background: linear-gradient(135deg, #69C778, #3EB550);
  color: white;
}

.share-icon.timeline {
  background: linear-gradient(135deg, #3EB550, #2A8C3C);
  color: white;
}

.share-icon.qq {
  background: linear-gradient(135deg, #4EAAEA, #2080C3);
  color: white;
}

.share-icon.weibo {
  background: linear-gradient(135deg, #FF8D6B, #FF5341);
  color: white;
}

.share-icon.link {
  background: linear-gradient(135deg, #8A8DE8, #6266DF);
  color: white;
}

.share-icon .iconfont {
  font-size: 24px;
}

.share-name {
  font-size: 12px;
  color: #666;
}

.share-cancel {
  padding: 15px 0;
  text-align: center;
  font-size: 16px;
  color: #333;
  background: #F7F7F7;
  font-weight: 500;
}

.share-cancel:active {
  background: #EBEBEB;
}

/* 纯CSS图标基础样式 */
.css-icon {
  width: 44rpx;
  height: 44rpx;
  position: relative;
  margin-bottom: 8rpx;
  display: inline-block;
  transition: all 0.3s ease;
}

/* 点赞心形图标 */
.heart-icon {
  position: relative;
  width: 22rpx;
  height: 22rpx;
  transform: rotate(45deg);
  background-color: #666666;
  margin: 11rpx;
}

.heart-icon:before,
.heart-icon:after {
  content: "";
  width: 22rpx;
  height: 22rpx;
  position: absolute;
  border-radius: 50%;
  background-color: #666666;
}

.heart-icon:before {
  top: -11rpx;
  left: 0;
}

.heart-icon:after {
  top: 0;
  left: -11rpx;
}

/* 点赞激活状态 */
.heart-icon.active {
  background-color: #FF4757;
  transform: rotate(45deg) scale(1.2);
  animation: post-detail-heartbeat 1.5s infinite;
}

.heart-icon.active:before,
.heart-icon.active:after {
  background-color: #FF4757;
}

/* 收藏书签图标 - 新样式 */
.star-icon {
  position: relative;
  width: 24rpx;
  height: 32rpx;
  background-color: #666666;
  border-radius: 2rpx 2rpx 0 0;
  margin: 6rpx auto;
}

.star-icon:before {
  content: '';
  position: absolute;
  bottom: -10rpx;
  left: 0;
  width: 0;
  height: 0;
  border-left: 12rpx solid #666666;
  border-right: 12rpx solid #666666;
  border-bottom: 10rpx solid transparent;
}

/* 收藏激活状态 */
.star-icon.active {
  background-color: #FFB700;
  animation: post-detail-pulse 1.5s infinite;
}

.star-icon.active:before {
  border-left-color: #FFB700;
  border-right-color: #FFB700;
}

@keyframes post-detail-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* 评论图标 */
.comment-icon {
  width: 36rpx;
  height: 30rpx;
  border-radius: 6rpx;
  background: #666666;
  position: relative;
  margin: 0 auto 14rpx;
}

.comment-icon:after {
  content: '';
  position: absolute;
  bottom: -8rpx;
  left: 8rpx;
  width: 0;
  height: 0;
  border: 8rpx solid transparent;
  border-top-color: #666666;
  border-right: 0;
  transform: rotate(45deg);
}

/* 分享图标 */
.share-icon {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid #666666;
  margin: 4rpx auto;
  position: relative;
}

.share-icon:before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20rpx;
  height: 2rpx;
  background: #666666;
  transform: translate(-50%, -50%);
}

.share-icon:after {
  content: '';
  position: absolute;
  top: 30%;
  left: 50%;
  width: 8rpx;
  height: 8rpx;
  border-top: 2rpx solid #666666;
  border-right: 2rpx solid #666666;
  transform: translate(-50%, -50%) rotate(45deg);
}

/* 更多图标（三个点） */
.more-icon {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 36rpx;
  height: 36rpx;
  margin: 4rpx auto;
}

.more-icon:before {
  content: '';
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: #666666;
  box-shadow: -10rpx 0 0 #666666, 10rpx 0 0 #666666;
}

/* 波纹效果 */
.ripple {
  position: relative;
  overflow: hidden;
}

.ripple:after {
  content: "";
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, rgba(74, 144, 226, 0.2) 10%, transparent 10.01%);
  background-repeat: no-repeat;
  background-position: 50%;
  transform: scale(10, 10);
  opacity: 0;
  transition: transform 0.6s, opacity 1s;
}

.ripple:active:after {
  transform: scale(0, 0);
  opacity: 0.3;
  transition: 0s;
}

/* 动画 */
.animate-slideUp {
  animation: post-detail-slideUp 0.3s ease-out;
}

@keyframes post-detail-slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes post-detail-fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 图片图标样式 */
.icon-image {
  width: 44rpx;
  height: 44rpx;
}

.new-comment-container {
  background: #FFFFFF;
  border-radius: 12rpx;
  margin: 20rpx 0;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  animation: post-detail-fadeIn 0.3s ease-in-out;
}

@keyframes post-detail-fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.new-comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.new-comment-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}

.new-comment-close {
  font-size: 40rpx;
  color: #8E9AAA;
  padding: 4rpx 10rpx;
  border-radius: 50%;
  line-height: 1;
}

.new-comment-close:active {
  background-color: rgba(0, 0, 0, 0.05);
}

.new-comment-input {
  width: 100%;
  min-height: 120rpx;
  max-height: 400rpx;
  padding: 20rpx;
  background-color: #F8FAFC;
  border: 1px solid #E3F2FD;
  border-radius: 8rpx;
  font-size: 28rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
}

.new-comment-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.new-comment-cancel, .new-comment-submit {
  padding: 12rpx 30rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  transition: all 0.3s ease;
  margin-left: 20rpx;
}

.new-comment-cancel {
  color: #8E9AAA;
  background-color: #F0F2F5;
}

.new-comment-submit {
  background: linear-gradient(to right, #4A90E2, #5D9DEA);
  color: #FFFFFF;
  font-weight: 500;
  box-shadow: 0 4rpx 12rpx rgba(74, 144, 226, 0.2);
}

.new-comment-cancel:active {
  background-color: #E8EAED;
  transform: scale(0.98);
}

.new-comment-submit:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 6rpx rgba(74, 144, 226, 0.1);
}
</style> 