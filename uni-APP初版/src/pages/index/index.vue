<template>
  <view class="index-container">
    <!-- 顶部标题和图标 -->
    <view class="header" :class="{ 'header-hidden': isHeaderHidden }">
      <text class="header-title">校园墙</text>
      <view class="header-icons">
        <text class="icon-text" @tap="goSearch" v-if="!iconLoaded.search">搜索</text>
        <image 
          class="header-icon" 
          src="/static/icons/search.png" 
          mode="aspectFit" 
          @tap="goSearch"
          @error="handleIconError('search')"
          v-else
        ></image>
        <text class="icon-text" @tap="goNotification" v-if="!iconLoaded.notification">通知</text>
        <image 
          class="header-icon" 
          src="/static/icons/notification.png" 
          mode="aspectFit" 
          @tap="goNotification"
          @error="handleIconError('notification')"
          v-else
        ></image>
      </view>
    </view>

    <!-- 顶部分类筛选栏 -->
    <view class="filter-bar" :class="{ 'filter-bar-fixed': isHeaderHidden }">
      <scroll-view scroll-x="true" class="filter-scroll" :show-scrollbar="false" enhanced>
        <view 
          v-for="(item, index) in allCategories" 
          :key="index" 
          class="filter-item"
          :class="{ active: currentCategory === index }"
          @tap="setCategory(index)"
        >
          {{ item.name }}
        </view>
      </scroll-view>
    </view>
    
    <!-- 内容列表 -->
    <scroll-view 
      scroll-y="true" 
      class="post-scroll"
      :class="{ 'header-hidden-adjust': isHeaderHidden }"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scroll="handleScroll"
      show-scrollbar="false"
      enable-back-to-top="true"
      bounces="true"
      fast="true"
      :enhanced="true"
      :enable-flex="true"
      :throttle="false"
    >
      <view class="posts-container">
        <!-- 加载状态放在顶部，避免底部加载引起的跳动 -->
        <view class="loading-more" v-if="loading && page > 1">
          <text>加载中...</text>
        </view>
        
        <!-- 帖子列表 -->
        <view class="post-list">
          <view 
            v-for="(post, index) in posts" 
            :key="post.id"
            class="post-item card hover-effect"
            @tap="navigateToPost(post.id)"
          >
            <!-- 用户信息 -->
            <view class="post-header">
              <user-card 
                :user="post.author || {}" 
                :time="post.createdAt"
                :current-user-id="currentUser?.id"
                mode="normal"
                :interactive="true"
                @click="viewUserProfile($event)"
              />
            </view>

            <!-- 帖子内容 -->
            <view class="post-content">
              <!-- 使用话题文本组件显示内容 -->
              <topic-text :content="post.content" @topic-click="handleTopicClick"></topic-text>
              </view>
              
            <!-- 帖子图片 -->
            <view class="image-grid" v-if="post.images && post.images.length > 0">
                <image 
                v-for="(image, imgIndex) in post.images.slice(0, 3)" 
                  :key="imgIndex" 
                :src="image" 
                  mode="aspectFill" 
                  class="post-image"
                @tap.stop="previewImages(post.images, imgIndex)"
                ></image>
              <view class="image-count" v-if="post.images.length > 3" @tap.stop="previewImages(post.images, 3)">+{{ post.images.length - 3 }}</view>
              </view>
            
            <!-- 话题标签和分类 -->
            <view class="tags-container" v-if="post.topics && post.topics.length > 0">
              <view 
                v-for="(topic, topicIndex) in post.topics" 
                :key="topicIndex"
                class="topic-tag"
                @tap.stop="navigateToTopic(topic)"
              >
                #{{ topic }}
              </view>
              <view class="category-tag" v-if="post.category">{{ post.category.name }}</view>
            </view>
            
            <!-- 帖子操作栏 -->
            <view class="action-bar">
              <view class="action-item ripple" @tap.stop="handleLike(post)">
                <view class="action-icon-container">
                  <view class="css-icon heart-icon" :class="{'active': post.isLiked}"></view>
                </view>
                <view class="action-text" :class="{'active-text': post.isLiked}">
                  {{ post.likes || 0 }}
              </view>
                </view>
              <view class="action-item ripple">
                <view class="action-icon-container">
                  <image :src="getImage('/static/icons/pl.png')" class="icon-image"></image>
              </view>
                <view class="action-text">
                  {{ post.comments || 0 }}
                </view>
              </view>
              <view class="action-item ripple" @tap.stop="handleCollect(post)">
                <view class="action-icon-container">
                  <view class="css-icon star-icon" :class="{'active': post.isCollected}"></view>
                </view>
                <view class="action-text" :class="{'active-text': post.isCollected}">
                  {{ post.collections || 0 }}
                </view>
              </view>
              <view class="action-item ripple" @tap.stop="handleShare(post)">
                <view class="action-icon-container">
                  <image :src="getImage('/static/icons/fx.png')" class="icon-image"></image>
              </view>
                <view class="action-text">
                  分享
              </view>
            </view>
          </view>
            
            <!-- 热门评论 - 只在有足够评论时显示 -->
            <view class="hot-comments" v-if="post && post.topComments && post.topComments.length > 0" @tap.stop="navigateToPostComments(post.id)">
              <!-- 评论列表 -->
              <view class="comment" v-for="(comment, idx) in post.topComments" :key="idx">
                <view class="comment-user">
                  <image class="comment-avatar" :src="comment.isAnonymous ? getImage('/static/images/default-avatar.png') : (comment.author && comment.author.avatar ? comment.author.avatar : getImage('/static/images/default-avatar.png'))" mode="aspectFill"></image>
                  <text class="username">{{ comment.isAnonymous ? '匿名用户' : (comment.author && comment.author.nickname ? comment.author.nickname : '未知用户') }}</text>
                </view>
                <text class="content">{{ comment.content }}</text>
              </view>
              <view class="view-all-comments">
                <text>查看全部{{ post.commentCount || post.comments || 0 }}条评论</text>
                <view class="right-arrow"></view>
              </view>
            </view>
        </view>
        
          <!-- 加载更多 -->
          <view class="load-more" v-if="hasMorePosts" @tap="loadMorePosts">
            <text>加载更多</text>
          </view>
          <view class="no-more" v-else-if="posts.length > 0">
            <text>没有更多了</text>
          </view>
          <view class="empty-list" v-if="posts.length === 0 && !loading">
            <text>暂无内容</text>
          </view>
        </view>
      </view>
    </scroll-view>
    
    <!-- 评论弹窗 -->
    <view class="comment-popup" v-if="showCommentPopup">
      <!-- 弹窗内容 -->
      <view class="comment-mask" @tap="closeCommentPopup" :style="{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }"></view>
      <view class="comment-panel">
        <view class="comment-header">
          <text class="panel-title">评论</text>
          <text class="close-icon" @tap="closeCommentPopup">×</text>
        </view>
        <view class="comment-input-area">
          <textarea 
            class="comment-textarea" 
            v-model="commentContent" 
            placeholder="说点什么..." 
            auto-height 
            focus
            :maxlength="200"
          ></textarea>
          </view>
          <view class="comment-footer">
            <button class="submit-btn" :disabled="!commentContent.trim()" @tap="submitComment">发送</button>
        </view>
      </view>
    </view>
    
    <!-- 分享弹窗 -->
    <view class="share-popup" v-if="showSharePopup" @tap="closeSharePopup">
      <!-- 弹窗内容 -->
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
import api from '@/utils/api.js';
import store from '@/utils/store.js';
import { formatTime } from '@/utils/time.js';
import postActions from '@/utils/postActions.js';
import interactionActions from '../../utils/interactionActions.js';
import config from '@/utils/config.js';
import TopicText from '@/components/TopicText.vue';
import UserCard from '@/components/UserCard.vue';
import { getImage } from '../../utils/imagePathHelper';

export default {
  components: {
    TopicText,
    UserCard
  },
  data() {
    return {
      posts: [],
      categories: [
        { id: 'recommended', name: '推荐' },
        { id: 'latest', name: '最新' },
        { id: 1, name: '学习' },
        { id: 2, name: '生活' },
        { id: 3, name: '情感' },
        { id: 4, name: '求助' },
        { id: 5, name: '吐槽' },
        { id: 6, name: '闲置' }
      ],
      staticCategories: [],
      dynamicCategories: [],
      currentCategory: 0,
      page: 1,
      limit: 10,
      loading: false,
      hasMorePosts: true,
      refreshing: false,
      isHeaderHidden: false,
      lastScrollTop: 0,
      scrollThreshold: 50,
      loadMoreLock: false,
      lastLoadTime: 0,
      statesLoading: false,
      statesLoaded: false,
      iconLoaded: {
        search: true,
        notification: true
      },
      currentUser: null
    }
  },
  computed: {
    allCategories() {
      // 合并静态和动态分类
      return [...this.staticCategories, ...this.dynamicCategories];
    },
  },
  onLoad() {
    console.log('首页加载');
    
    // 获取当前用户信息
    this.getCurrentUser();
    
    // 初始化页面
    this.init();
  },
  // 添加onShow生命周期函数，在页面显示时检查是否需要重新加载数据
  onShow() {
    console.log('index页面显示');
    
    // 检查上次加载时间，如果超过一定时间(5秒)或没有数据则重新加载
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastLoadTime;
    
    if (timeDiff > 5000 || this.posts.length === 0) {
      console.log('从其他页面返回或超时，重新加载帖子');
      // 重置页码
      this.page = 1;
      this.noMore = false;
      this.statesLoaded = false;
      // 重新加载数据
      this.loadPosts();
    } 
    // 如果已登录，总是检查点赞和收藏状态
    else if (store.getters.isLogin() && this.posts.length > 0) {
      console.log('用户已登录，开始检查所有帖子状态');
      // 标记状态加载中
      this.statesLoading = true;
      this.statesLoaded = false;
      
      // 批量检查帖子状态，避免发送太多请求
      this.batchCheckPostsStatus()
        .then(stats => {
          console.log('批量状态检查完成，状态已更新:', stats);
        })
        .catch(error => {
          console.error('批量状态检查失败:', error);
        })
        .finally(() => {
          this.statesLoading = false;
          this.statesLoaded = true;
          console.log('批量状态检查完成，状态已更新');
                });
              } else {
      console.log('无需重新加载，状态加载状态:', this.statesLoading ? '加载中' : (this.statesLoaded ? '已加载' : '未加载'));
    }
    
    // 当从其他页面返回时，刷新状态
    this.initializePostStatus();
    
    // 恢复当前活动页面状态
    postActions.setActivePage('index');
    
    // 如果有帖子数据，刷新状态
    if (this.posts && this.posts.length > 0) {
      // 使用延迟确保UI已准备好
      setTimeout(() => {
        this.initializePostStatuses();
      }, 300);
    }
  },
  onHide() {
    // ... 现有代码 ...
    
    // 广播状态变化
    this.savePageState();
  },
  onUnload() {
    // ... 现有代码 ...
    
    // 停止状态同步
    this.stopStatusSync();
    
    // 广播状态变化
    this.savePageState();
  },
  methods: {
    formatTime,
    // 处理滚动事件 - 更轻量级实现
    handleScroll(e) {
      const scrollTop = e.detail.scrollTop;
      
      // 清除之前的定时器，防止过多触发
      if (this.scrollTimer) clearTimeout(this.scrollTimer);
      
      // 设置新的定时器，实现防抖效果
      this.scrollTimer = setTimeout(() => {
        // 简化标题栏逻辑，减少DOM操作
        this.isHeaderHidden = scrollTop > 100;
        
        // 保存滚动位置
        this.lastScrollTop = scrollTop;
      }, 100); // 增加延迟，降低处理频率
    },
    
    // 设置当前分类
    setCategory(index) {
      if (this.currentCategory === index) return;
      
      this.currentCategory = index;
      
      // 重置页码
      this.page = 1;
      this.noMore = false;
      
      // 手动滚动到顶部，不使用scroll-top动态绑定
      const scrollView = uni.createSelectorQuery().select('.post-scroll');
      scrollView.boundingClientRect(res => {
        if (res) {
          uni.pageScrollTo({
            scrollTop: 0,
            duration: 0 // 设置为0，立即滚到顶部，不使用动画
          });
        }
      }).exec();
      
      // 根据分类加载不同的内容
      this.loadPosts();
    },
    
    // 下拉刷新
    onRefresh() {
      if (this.refreshing) return;
      
      this.refreshing = true;
      this.page = 1;
      this.noMore = false;
      
      this.loadPosts();
      
      // 使用setTimeout替代Promise.finally
        setTimeout(() => {
          this.refreshing = false;
      }, 1000); // 稍微延长时间确保加载完成
    },
    
    // 加载帖子列表 - 优化版，预防DOM频繁更新
    loadPosts() {
      if (this.loading) return;
      
      this.loading = true;
      this.statesLoaded = false;
      
      // 构建API请求参数
      const params = {
        page: this.page,
        limit: this.limit,
        sort: this.currentCategory === 0 ? 'popular' : 'latest'
      };
      
      // 根据分类设置额外参数
      if (this.currentCategory > 1) {
        params.category = this.allCategories[this.currentCategory].id;
      }
      
      // 选择API方法
      let apiMethod;
      if (this.currentCategory === 0) {
        // 推荐分类使用专门的推荐API
        apiMethod = api.posts.getRecommended;
      } else {
        // 其他分类使用常规列表API
        apiMethod = api.posts.getList;
      }
      
      // 调用API获取帖子
      apiMethod(params)
        .then(res => {
          if (res.success) {
            const newPosts = res.data.posts;
            
            // 处理帖子数据，添加动画状态属性
            newPosts.forEach(post => {
              post.animatingLike = false;
              post.animatingCollect = false;
              // 初始化点赞和收藏状态为false，等待实际状态检查
              post.isLiked = false;
              post.isCollected = false;
            });
            
            // 使用setTimeout延迟DOM更新，避免频繁重绘
            setTimeout(() => {
              // 根据页码处理数据
              if (this.page === 1) {
                this.posts = newPosts;
              } else {
                // 使用不改变引用的方式更新数组，减少整体重绘
                const combinedPosts = [...this.posts];
                newPosts.forEach(post => combinedPosts.push(post));
                this.posts = combinedPosts;
              }
              
              // 判断是否还有更多数据
              if (newPosts.length < this.limit) {
                this.hasMorePosts = false;
              } else {
                this.hasMorePosts = true;
              }
              
              // 缓存帖子数据到全局状态
              store.mutations.setPosts(this.posts);
              
              // 获取每个帖子的热门评论
              this.fetchTopCommentsForPosts();
              
              // 获取帖子作者的徽章信息
              this.fetchAuthorBadges();
              
              // 如果用户已登录，检查每个帖子的点赞和收藏状态
              if (store.getters.isLogin() && this.posts.length > 0) {
                console.log('用户已登录，检查帖子状态');
                // 标记状态加载中
                this.statesLoading = true;
                
                // 批量检查帖子状态
                this.batchCheckPostsStatus()
                  .then(stats => {
                    console.log('批量状态检查完成，状态已更新:', stats);
                  })
                  .catch(error => {
                    console.error('批量状态检查失败:', error);
                  })
                  .finally(() => {
                    this.statesLoading = false;
                    this.statesLoaded = true;
                });
              }
            }, 50);
          } else {
            uni.showToast({
              title: res.message || '加载帖子失败',
              icon: 'none'
            });
          }
        })
        .catch(err => {
          console.error('加载帖子失败:', err);
          uni.showToast({
            title: '加载帖子失败，请稍后再试',
            icon: 'none'
          });
        })
        .finally(() => {
          this.loading = false;
          this.lastLoadTime = Date.now();
        });
    },
    
    // 加载更多 - 防抖优化版
    loadMore() {
      // 检查锁和基本条件
      if (this.loadMoreLock || this.loading || this.noMore) return;
      
      // 加锁，防止多次触发
      this.loadMoreLock = true;
      
      // 简单节流，防止短时间内重复触发
      const now = Date.now();
      if (now - this.lastLoadTime < 800) {
        setTimeout(() => {
          this.loadMoreLock = false;
        }, 800);
        return;
      }
      
      // 设置加载状态
      this.loading = true;
      this.lastLoadTime = now;
      
      // 页码增加
      this.page++;
      
      // 加载更多数据
      this.loadPosts();
      
        // 延迟重置状态，让加载动画显示足够长
        setTimeout(() => {
          this.loading = false;
          
          // 延迟解锁，防止快速连续加载
          setTimeout(() => {
            this.loadMoreLock = false;
          }, 500);
        }, 600);
    },
    
    // 处理点赞
    async handleLike(post) {
      console.log('点赞操作:', post.id);
      const success = await postActions.handlePostLike(post);
      if (success) {
        // 添加动画效果
        this.$refs[`likeBtn${post.id}`]?.[0]?.startAnimation();
      }
    },
    
    // 处理收藏
    async handleCollect(post) {
      console.log('收藏操作:', post.id);
      const success = await postActions.handlePostCollect(post);
      if (success) {
        // 添加动画效果
        this.$refs[`collectBtn${post.id}`]?.[0]?.startAnimation();
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
    
    // 打开评论弹窗
    commentPost(index) {
      // 检查是否已登录
      if (!store.getters.isLogin()) {
        uni.navigateTo({
          url: '/pages/login/login'
        });
        return;
      }
      
      this.currentPostIndex = index;
      this.commentContent = '';
      this.showCommentPopup = true;
    },
    
    // 关闭评论弹窗
    closeCommentPopup() {
      this.showCommentPopup = false;
    },
    
    // 提交评论
    submitComment() {
      if (!this.commentContent.trim()) return;
      
      const postId = this.posts[this.currentPostIndex].id;
      const commentData = {
        content: this.commentContent.trim()
      };
      
      // 显示加载中
      uni.showLoading({
        title: '发送中...',
        mask: true
      });
      
      // 调用评论API
      api.comments.add(postId, commentData)
        .then(res => {
          if (res.success) {
            // 关闭弹窗
            this.showCommentPopup = false;

            // 更新评论数量
            this.posts[this.currentPostIndex].comments++;

            // 添加评论到帖子评论预览
            if (!this.posts[this.currentPostIndex].latestComments) {
              this.posts[this.currentPostIndex].latestComments = [];
            }

            // 将新评论添加到最前面
            this.posts[this.currentPostIndex].latestComments.unshift({
              username: uni.getStorageSync('userInfo').nickname || '用户',
              content: this.commentContent.trim()
            });

            // 最多显示3条评论
            if (this.posts[this.currentPostIndex].latestComments.length > 3) {
              this.posts[this.currentPostIndex].latestComments.length = 3;
            }

            uni.showToast({
              title: '评论成功',
              icon: 'success'
            });
            
            this.commentContent = '';
          } else {
            uni.showToast({
              title: res.message || '评论失败',
              icon: 'none'
            });
          }
        })
        .catch(err => {
          console.error('评论失败:', err);
          uni.showToast({
            title: '评论失败，请稍后再试',
            icon: 'none'
          });
        })
        .finally(() => {
          uni.hideLoading();
        });
    },
    
    // 分享帖子
    handleShare(post) {
      console.log('分享帖子:', post.id);
      uni.share({
        provider: "weixin",
        scene: "WXSceneSession",
        type: 0,
        title: "校园墙分享",
        summary: post.content,
        imageUrl: post.images && post.images[0],
        href: `${config.APP_URL}/post/${post.id}`,
        success: function (res) {
          console.log("分享成功:", res);
        },
        fail: function (err) {
          console.log("分享失败:", err);
        }
      });
    },
    
    // 查看帖子详情
    viewPostDetail(postId) {
      // 记录浏览量
      api.posts.recordView(postId).catch(err => {
        console.error('记录浏览量失败:', err);
      });
      
      // 跳转到详情页
      uni.navigateTo({
        url: `/pages/post-detail/post-detail?id=${postId}`
      });
    },
    
    // 查看用户主页
    goUserProfile(userId) {
      uni.navigateTo({
        url: `/pages/user-profile/user-profile?id=${userId}`
      });
    },
    
    // 跳转到话题页
    goTopic(topic) {
      uni.navigateTo({
        url: `/pages/topic/topic?name=${encodeURIComponent(topic.name)}`
      });
    },
    
    // 跳转到搜索页
    goSearch() {
      uni.navigateTo({
        url: '/pages/search/search'
      });
    },
    
    // 跳转到通知页
    goNotification() {
      uni.switchTab({
        url: '/pages/message/message'
      });
    },
    
    // 图片预览
    previewImage(images, index) {
      uni.previewImage({
        urls: images,
        current: images[index]
      });
    },
    
    // 显示帖子操作菜单
    showPostOptions(index) {
      const post = this.posts[index];
      const isMyPost = store.getters.getUser() && post.userId === store.getters.getUser().id;
      
      let itemList = ['举报'];
      if (isMyPost) {
        itemList = ['编辑', '删除', ...itemList];
      }
      
      uni.showActionSheet({
        itemList,
        success: (res) => {
          if (isMyPost) {
            if (res.tapIndex === 0) {
              // 编辑帖子
              uni.navigateTo({
                url: `/pages/publish/publish?id=${post.id}&edit=true`
              });
            } else if (res.tapIndex === 1) {
              // 删除帖子
              this.deletePost(index);
            }
          } else {
            if (res.tapIndex === 0) {
              // 举报帖子
              uni.showToast({
                title: '举报功能开发中',
                icon: 'none'
              });
            }
          }
        }
      });
    },
    
    // 删除帖子
    deletePost(index) {
      const post = this.posts[index];
      
      uni.showModal({
        title: '删除帖子',
        content: '确定要删除这条帖子吗？',
        success: (res) => {
          if (res.confirm) {
            uni.showLoading({
              title: '删除中...',
              mask: true
            });
            
            // 调用删除API
            api.posts.delete(post.id)
              .then(res => {
                if (res.success) {
                  // 从列表中移除
                  this.posts.splice(index, 1);
                  
                  uni.showToast({
                    title: '删除成功',
                    icon: 'success'
                  });
                } else {
                  uni.showToast({
                    title: res.message || '删除失败',
                    icon: 'none'
                  });
                }
              })
              .catch(err => {
                console.error('删除帖子失败:', err);
                uni.showToast({
                  title: '删除失败，请稍后再试',
                  icon: 'none'
                });
              })
              .finally(() => {
                uni.hideLoading();
              });
          }
        }
      });
    },
    
    // 检查帖子状态 - 改进版本
    async checkPostStatus(postId) {
      console.log('检查帖子状态:', postId);
      
      try {
      // 调用API检查帖子状态
        const result = await api.batch.getPostStatus(postId);
        
        if (result && result.success) {
          console.log('获取帖子状态成功:', postId, result.data);
          
          // 直接使用API返回的状态数据
          const statusData = result.data;
          
          // 更新帖子状态，保留之前的实现，但添加更详细的日志
          let updated = false;
          
              this.posts.forEach(post => {
            if (post.id === parseInt(postId)) {
              // 记录原始状态
              const oldLiked = post.isLiked;
              const oldCollected = post.isCollected;
              
              // 更新状态
              if (statusData.isLiked !== undefined) {
                post.isLiked = statusData.isLiked;
                if (oldLiked !== post.isLiked) {
                  console.log(`帖子${post.id}点赞状态从${oldLiked}更新为${post.isLiked}`);
                  updated = true;
                  
                  // 使用postActions保存状态
                  if (post.isLiked) {
                    postActions.savePostLikeStatus(post.id, true);
                    console.log(`已保存帖子${post.id}点赞状态=true`);
                  }
                }
              }
              
              if (statusData.isCollected !== undefined) {
                post.isCollected = statusData.isCollected;
                if (oldCollected !== post.isCollected) {
                  console.log(`帖子${post.id}收藏状态从${oldCollected}更新为${post.isCollected}`);
                  updated = true;
                  
                  // 使用postActions保存状态
                  if (post.isCollected) {
                    postActions.savePostCollectStatus(post.id, true);
                    console.log(`已保存帖子${post.id}收藏状态=true`);
                  }
                }
              }
              
              if (updated) {
                // 更新全局状态
                  store.mutations.updatePost(post.id, {
                    isLiked: post.isLiked,
                    isCollected: post.isCollected
                  });
                
                // 强制视图更新
                this.$forceUpdate();
                }
            }
          });
          
          return statusData; // 返回状态数据，方便调用者使用
          } else {
          console.error('检查帖子状态失败:', result.message);
          return null;
          }
      } catch (err) {
          console.error('检查帖子状态请求失败:', err);
        return null;
      }
    },
    
    // 获取帖子列表
    async fetchPosts() {
      this.loading = true;
      try {
        const params = {
          page: this.page,
          limit: this.limit
        };
        
        const result = await api.posts.getList(params);
        if (result.success) {
          const { posts, pagination } = result.data;
          
          if (this.page === 1) {
            this.posts = posts;
          } else {
            this.posts = [...this.posts, ...posts];
          }
          
          this.hasMorePosts = pagination.page < pagination.pages;
        } else {
          uni.showToast({
            title: result.message || '获取帖子失败',
            icon: 'none'
          });
        }
      } catch (error) {
        uni.showToast({
          title: '获取帖子失败，请重试',
          icon: 'none'
        });
        console.error('获取帖子列表错误:', error);
      } finally {
        this.loading = false;
        uni.stopPullDownRefresh();
      }
    },
    
    // 刷新帖子
    refreshPosts() {
      this.page = 1;
      this.fetchPosts();
    },
    
    // 加载更多帖子
    loadMorePosts() {
      if (this.loading || !this.hasMorePosts) return;
      this.page++;
      this.fetchPosts();
    },
    
    // 导航到帖子详情
    navigateToPost(postId) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${postId}`
      });
    },
    
    // 导航到帖子评论页面
    navigateToPostComments(postId) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${postId}&showComments=true`
      });
    },
    
    // 处理话题点击
    handleTopicClick(topicName) {
      this.navigateToTopic(topicName);
    },
    
    // 导航到话题页面
    navigateToTopic(topicName) {
      uni.navigateTo({
        url: `/pages/topic/topic-detail?name=${encodeURIComponent(topicName)}`
      });
    },
    
    // 处理分享
    handleShare(post) {
      this.currentPostIndex = this.posts.findIndex(p => p.id === post.id);
      this.showSharePopup = true;
    },
    
    // 关闭分享弹窗
    closeSharePopup() {
      this.showSharePopup = false;
    },
    
    // 获取当前选中的帖子
    getCurrentPost() {
      return this.currentPostIndex >= 0 ? this.posts[this.currentPostIndex] : null;
    },
    
    // 分享到微信
    shareToWechat() {
      const post = this.getCurrentPost();
      if (!post) return;
      
      // 微信分享功能，实际实现需要微信SDK
      uni.showToast({
        title: '已分享到微信',
        icon: 'success'
      });
      this.closeSharePopup();
    },
    
    // 分享到朋友圈
    shareToTimeline() {
      const post = this.getCurrentPost();
      if (!post) return;
      
      // 朋友圈分享功能，实际实现需要微信SDK
      uni.showToast({
        title: '已分享到朋友圈',
        icon: 'success'
      });
      this.closeSharePopup();
    },
    
    // 分享到QQ
    shareToQQ() {
      const post = this.getCurrentPost();
      if (!post) return;
      
      // QQ分享功能，实际实现需要QQ SDK
      uni.showToast({
        title: '已分享到QQ',
        icon: 'success'
      });
      this.closeSharePopup();
    },
    
    // 分享到微博
    shareToWeibo() {
      const post = this.getCurrentPost();
      if (!post) return;
      
      // 微博分享功能，实际实现需要微博SDK
      uni.showToast({
        title: '已分享到微博',
        icon: 'success'
      });
      this.closeSharePopup();
    },
    
    // 复制链接
    copyLink() {
      const post = this.getCurrentPost();
      if (!post) return;
      
      const link = `https://campus-wall.com/post/${post.id}`;
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
    
    // 批量检查帖子状态
    async batchCheckPostsStatus() {
      if (!this.posts.length) return;
      
      console.log('开始批量检查帖子状态，共', this.posts.length, '个帖子');
      
      try {
        // 创建一个统计对象
        const stats = {
          total: this.posts.length,
          processed: 0,
          updated: {
            like: 0,
            collect: 0
          },
          errors: 0,
          retries: 0
        };
        
        // 每次检查5个帖子，避免同时发送太多请求
        const batchSize = 5;
        for (let i = 0; i < this.posts.length; i += batchSize) {
          const batch = this.posts.slice(i, i + batchSize);
          
          console.log(`处理批次 ${Math.floor(i/batchSize) + 1}/${Math.ceil(this.posts.length/batchSize)}，包含 ${batch.length} 个帖子`);
          
          // 使用 Promise.all 并行处理一批帖子
          await Promise.all(batch.map(async post => {
            try {
              console.log(`检查帖子 ${post.id} 状态`);
              
              // 获取存储的状态（如果有）
              const cachedStatus = uni.getStorageSync(`post_status_${post.id}`);
              if (cachedStatus) {
                const parsedStatus = JSON.parse(cachedStatus);
                const cacheTime = parsedStatus._timestamp || 0;
                const now = Date.now();
                
                // 如果缓存不超过5分钟，先使用缓存值
                if (now - cacheTime < 300000) { // 5分钟
                  console.log(`使用缓存的状态数据(${Math.floor((now-cacheTime)/1000)}秒前)`, post.id, parsedStatus);
                  
                  // 记录原始状态
                  const oldLiked = post.isLiked;
                  const oldCollected = post.isCollected;
                  
                  // 更新状态 - 确保即使缓存中为undefined也使用默认值false
                  post.isLiked = parsedStatus.isLiked !== undefined ? parsedStatus.isLiked : false;
                  post.isCollected = parsedStatus.isCollected !== undefined ? parsedStatus.isCollected : false;
                  
                  // 记录变化
                  if (oldLiked !== post.isLiked) {
                    console.log(`帖子${post.id}点赞状态从${oldLiked}更新为${post.isLiked} (缓存)`);
                    stats.updated.like++;
                  }
                  if (oldCollected !== post.isCollected) {
                    console.log(`帖子${post.id}收藏状态从${oldCollected}更新为${post.isCollected} (缓存)`);
                    stats.updated.collect++;
                  }
                  
                  // 更新全局状态 - 确保使用定义好的布尔值
                store.mutations.updatePost(post.id, {
                    isLiked: post.isLiked,
                  isCollected: post.isCollected
                });
                  
                  stats.processed++;
                  return; // 跳过API请求
                }
              }
              
              // 调用API检查帖子状态
              let result;
              let retryCount = 0;
              const maxRetries = 2;
              
              while (retryCount <= maxRetries) {
                try {
                  result = await api.batch.getPostStatus(post.id);
                  break; // 成功获取数据，跳出重试循环
                } catch (err) {
                  retryCount++;
                  stats.retries++;
                  
                  console.error(`检查帖子${post.id}状态失败(尝试${retryCount}/${maxRetries}):`, err);
                  
                  if (retryCount <= maxRetries) {
                    // 等待一段时间再重试
                    await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
                  } else {
                    throw err; // 重试次数用完，抛出错误
                  }
                }
              }
              
              stats.processed++;
              
              if (result && result.success) {
                // 记录原始状态
                const oldLiked = post.isLiked;
                const oldCollected = post.isCollected;
                
                // 确保数据结构正确
                const responseData = result.data;
                
                if (!responseData) {
                  console.error(`帖子${post.id}状态数据为空`);
                  stats.errors++;
                  return;
                }
                
                // 更新状态
                if (responseData.isLiked !== undefined) {
                  post.isLiked = responseData.isLiked === true; // 强制布尔值
                  if (oldLiked !== post.isLiked) {
                    console.log(`帖子${post.id}点赞状态从${oldLiked}更新为${post.isLiked}`);
                    stats.updated.like++;
                  }
                }
                
                if (responseData.isCollected !== undefined) {
                  post.isCollected = responseData.isCollected === true; // 强制布尔值
                  if (oldCollected !== post.isCollected) {
                    console.log(`帖子${post.id}收藏状态从${oldCollected}更新为${post.isCollected}`);
                    stats.updated.collect++;
                  }
                }
                
                // 更新全局状态
                store.mutations.updatePost(post.id, {
                  isLiked: post.isLiked === true, // 强制布尔值
                  isCollected: post.isCollected === true // 强制布尔值
                });
                
                // 缓存状态到本地存储
                const statusToCache = {
                  ...responseData,
                  isLiked: responseData.isLiked !== undefined ? responseData.isLiked : false,
                  isCollected: responseData.isCollected !== undefined ? responseData.isCollected : false,
                  _timestamp: Date.now() // 添加时间戳
                };
                
                try {
                  uni.setStorageSync(`post_status_${post.id}`, JSON.stringify(statusToCache));
                } catch (err) {
                  console.error(`缓存帖子${post.id}状态失败:`, err);
                }
              } else {
                console.error(`检查帖子${post.id}状态失败:`, result.message);
                stats.errors++;
              }
            } catch (err) {
              console.error(`检查帖子${post.id}状态异常:`, err);
              stats.errors++;
            }
          }));
        }
        
        return stats;
      } catch (err) {
        console.error('批量检查帖子状态异常:', err);
        return null;
      }
    },
    handleIconError(iconType) {
      console.error(`${iconType}图标加载失败`);
      this.iconLoaded[iconType] = false;
    },
    // 获取热门评论
    async fetchTopComments(post) {
      try {
        if (!post || !post.id) {
          console.error('获取热门评论失败: 无效的帖子对象');
          return;
        }
        
        console.log(`开始获取帖子${post.id}的热门评论`);
        const result = await api.comments.getTopComments(post.id);
        console.log('获取热门评论原始结果:', post.id, result);
        
        // 分析返回数据，确保能正确解析
        if (result && result.success) {
          // 直接从数据中获取comments数组
          let comments = [];
          
          // 处理可能的数据结构差异
          if (result.data && Array.isArray(result.data)) {
            // 如果data直接是数组
            comments = result.data;
            console.log(`帖子${post.id}评论直接为数组`);
          } else if (result.data && Array.isArray(result.data.comments)) {
            // 如果data中有comments数组
            comments = result.data.comments;
            console.log(`帖子${post.id}评论在data.comments中`);
          } else if (result.data && result.data.rows && Array.isArray(result.data.rows)) {
            // 如果数据在data.rows中
            comments = result.data.rows;
            console.log(`帖子${post.id}评论在data.rows中`);
          } else if (result.data && Object.keys(result.data).length > 0) {
            // 尝试其他可能的格式
            console.log(`帖子${post.id}尝试从其他格式获取评论`, result.data);
            const possibleCommentsArray = Object.values(result.data).find(value => Array.isArray(value));
            if (possibleCommentsArray) {
              comments = possibleCommentsArray;
              console.log(`帖子${post.id}从其他格式找到评论数组`);
            }
          }
          
          console.log(`帖子${post.id}解析后的评论`, comments);
          
          // 只有当确实有评论时才处理
          if (comments && comments.length > 0) {
            console.log('找到热门评论:', post.id, comments.length, '条');
            
            // 安全地分配到post.topComments
            post.topComments = comments.slice(0, 2).map(comment => {
              // 处理可能的不同数据结构
              const author = comment.author || {};
              const username = author.nickname || comment.username || comment.userName || '匿名用户';
              const avatar = author.avatar || comment.avatar || comment.userAvatar || '/static/images/default-avatar.png';
              const content = comment.content || '';
              const likes = comment.likes || 0;
              
              console.log('处理评论:', comment.id, username, content.substring(0, 10));
              
              return {
                id: comment.id || 0,
                content: content,
                likes: likes,
                username: username,
                avatar: avatar
              };
            });
            
            console.log(`帖子${post.id}设置了topComments:`, post.topComments);
          } else {
            // 没有找到评论，设置为空数组
            console.log('未找到热门评论:', post.id);
            post.topComments = [];
          }
        } else {
          // API调用失败或返回错误
          console.error('获取热门评论API调用失败:', result ? result.message : '未知错误');
          post.topComments = [];
        }
      } catch (error) {
        // 出错时也确保有一个空数组
        post.topComments = [];
        console.error('获取热门评论异常:', error);
      }
      
      // 确保topComments属性存在于post对象中
      if (!post.topComments) {
        console.log(`为帖子${post.id}设置空的topComments数组`);
        post.topComments = [];
      }
    },
    
    // 批量获取所有帖子的热门评论
    async fetchTopCommentsForPosts() {
      console.log('开始获取热门评论');
      const postsToProcess = [...this.posts];
      
      try {
        for (const post of postsToProcess) {
          console.log(`开始获取帖子ID:${post.id}的热门评论`);
          try {
            const res = await api.comments.getTopComments(post.id, 2);
            console.log(`帖子${post.id}的热门评论原始结果:`, res);
            
            // 初始化topComments数组，确保它总是存在
            post.topComments = [];
            
            if (res && res.success) {
              // 尝试不同的数据结构路径
              let comments = null;
              
              if (res.data && Array.isArray(res.data)) {
                console.log(`帖子${post.id}使用res.data数组`);
                comments = res.data;
              } else if (res.data && res.data.comments && Array.isArray(res.data.comments)) {
                console.log(`帖子${post.id}使用res.data.comments数组`);
                comments = res.data.comments;
              } else if (res.data && res.data.list && Array.isArray(res.data.list)) {
                console.log(`帖子${post.id}使用res.data.list数组`);
                comments = res.data.list;
              } else if (res.list && Array.isArray(res.list)) {
                console.log(`帖子${post.id}使用res.list数组`);
                comments = res.list;
              } else if (res.data && res.data.rows && Array.isArray(res.data.rows)) {
                console.log(`帖子${post.id}使用res.data.rows数组`);
                comments = res.data.rows;
              }
              
              if (comments && comments.length > 0) {
                console.log(`帖子${post.id}找到${comments.length}条热门评论，数据:`, comments);
                
                // 转换评论数据结构，确保格式一致
                post.topComments = comments.map(comment => {
                  console.log('处理评论数据:', comment);
                  
                  // 检查是否匿名
                  const isAnonymous = comment.isAnonymous === true || 
                                     comment.isAnonymous === 1 || 
                                     comment.isAnonymous === '1';
                  
                  // 处理评论作者信息，兼容多种格式
                  let author = {};
                  
                  // 处理点号形式字段，创建嵌套对象
                  if (comment['author.id'] !== undefined) {
                    author = {
                      id: comment['author.id'],
                      nickname: comment['author.nickname'] || comment['author.username'] || '用户',
                      username: comment['author.username'],
                      avatar: comment['author.avatar']
                    };
                    console.log('从点号格式创建作者对象:', author);
                  } 
                  // 处理已有的作者对象
                  else if (comment.author && typeof comment.author === 'object') {
                    author = comment.author;
                    console.log('使用已有作者对象:', author);
                  } 
                  // 处理user对象
                  else if (comment.user && typeof comment.user === 'object') {
                    author = comment.user;
                    console.log('使用user对象作为作者:', author);
                  }
                  // 处理扁平结构
                  else if (comment.username) {
                    author = {
                      id: comment.userId,
                      nickname: comment.username || '用户',
                      username: comment.username,
                      avatar: comment.avatar
                    };
                    console.log('从扁平结构创建作者对象:', author);
                  }
                  
                  return {
                    id: comment.id,
                    content: comment.content,
                    isAnonymous: isAnonymous,
                    author: author,
                    createdAt: comment.createdAt
                  };
                });
                
                console.log(`帖子${post.id}处理后的评论:`, post.topComments);
              } else {
                console.log(`帖子${post.id}没有热门评论`);
              }
            } else {
              console.log(`帖子${post.id}获取热门评论失败:`, res);
            }
          } catch (err) {
            console.error(`获取帖子${post.id}热门评论出错:`, err);
          }
        }
        
        // 更新视图
        console.log('所有帖子的热门评论获取完成，正在更新视图');
        this.posts = [...postsToProcess];
      } catch (error) {
        console.error('获取热门评论过程中发生错误:', error);
      }
    },
    previewImages(images, index) {
      if (!images || images.length === 0) {
        console.error('没有可预览的图片');
        return;
      }

      // 显示轻微加载提示
      uni.showLoading({
        title: '加载中...',
        mask: false
      });

      setTimeout(() => {
        uni.hideLoading();
        
        uni.previewImage({
          urls: images,
          current: images[index],
          success: () => {
            console.log('图片预览成功');
          },
          fail: (err) => {
            console.error('图片预览失败:', err);
            uni.showToast({
              title: '预览失败，请重试',
              icon: 'none'
            });
          }
        });
      }, 100);
    },
    /**
     * 初始化帖子状态
     */
    async initializePostStatus() {
      if (!this.posts || this.posts.length === 0) return;
      
      console.log('首页初始化帖子状态');
      
      // 使用统一状态管理函数
      const result = await postActions.initializePostStatus(this.posts);
      console.log('首页初始化帖子状态结果:', result);
      
      // 如果是从本地加载的缓存，强制更新数据绑定
      if (result.fromCache) {
        this.$forceUpdate();
      }
    },
    
    /**
     * 帖子列表加载完成后处理
     */
    async onPostsLoaded(posts) {
      // ... 保持其他代码不变 ...
      
      // 初始化帖子状态
      if (posts && posts.length > 0) {
        await this.initializePostStatus();
      }
      
      // ... 保持其他代码不变 ...
    },
    
    // 初始化帖子状态
    async initializePostStatuses() {
      if (this.postStatusLoading || !this.posts.length) return;
      
      console.log('初始化首页帖子状态，共', this.posts.length, '个帖子');
      this.postStatusLoading = true;
      
      try {
        // 使用postActions统一管理
        const result = await postActions.initializePostStatus(this.posts, false);
        
        console.log('帖子状态初始化结果:', result);
        this.postStatusLoaded = true;
        
        return result;
      } catch (err) {
        console.error('初始化帖子状态失败:', err);
      } finally {
        this.postStatusLoading = false;
      }
    },
    
    // 更新推荐话题状态
    async updateRecommendTopicsStatus() {
      if (!this.recommendTopics || this.recommendTopics.length === 0) return;
      
      try {
        // 收集所有话题ID
        const topicIds = this.recommendTopics.map(topic => topic.id).filter(id => id);
        
        if (topicIds.length > 0) {
          // 使用统一的互动管理模块批量检查状态
          await interactionActions.refreshTopicStatuses(topicIds);
        }
      } catch (error) {
        console.error('更新推荐话题状态失败:', error);
      }
    },
    
    // 更新热门活动状态
    async updateHotEventsStatus() {
      if (!this.hotEvents || this.hotEvents.length === 0) return;
      
      try {
        // 收集所有活动ID
        const eventIds = this.hotEvents.map(event => event.id).filter(id => id);
        
        if (eventIds.length > 0) {
          // 使用统一的互动管理模块批量检查状态
          await interactionActions.refreshEventStatuses(eventIds);
        }
      } catch (error) {
        console.error('更新热门活动状态失败:', error);
      }
    },
    
    // 点赞处理 - 使用统一的postActions
    async toggleLike(index) {
      try {
        // 检查是否已登录
        if (!store.getters.isLogin()) {
          uni.navigateTo({
            url: '/pages/login/login'
          });
          return;
        }
        
        const post = this.posts[index];
        if (!post || !post.id) return;
        
        console.log('点赞操作开始，帖子ID:', post.id, '当前状态:', post.isLiked ? '已点赞' : '未点赞');
        
        // 使用统一的帖子操作处理点赞
        const result = await postActions.handlePostLike(post);
        
        if (result) {
          // 动画效果
          post.animatingLike = true;
          setTimeout(() => {
            post.animatingLike = false;
            this.$forceUpdate();
          }, 600);
        }
      } catch (error) {
        console.error('点赞操作异常:', error);
      }
    },
    
    // 收藏处理 - 使用统一的postActions
    async toggleCollect(index) {
      try {
        // 检查是否已登录
        if (!store.getters.isLogin()) {
          uni.navigateTo({
            url: '/pages/login/login'
          });
          return;
        }
        
        const post = this.posts[index];
        if (!post || !post.id) return;
        
        console.log('收藏操作开始，帖子ID:', post.id, '当前状态:', post.isCollected ? '已收藏' : '未收藏');
        
        // 使用统一的帖子操作处理收藏
        const result = await postActions.handlePostCollect(post);
        
        if (result) {
          // 动画效果
          post.animatingCollect = true;
          setTimeout(() => {
            post.animatingCollect = false;
            this.$forceUpdate();
          }, 600);
        }
      } catch (error) {
        console.error('收藏操作异常:', error);
      }
    },
    
    // 话题浏览处理
    async handleTopicClick(topic) {
      if (!topic || !topic.id) return;
      
      // 记录话题浏览
      try {
        interactionActions.handleTopicView(topic.id);
      } catch (error) {
        console.error('记录话题浏览失败:', error);
      }
      
      // 导航到话题详情页
      uni.navigateTo({
        url: `/pages/topic/topic-detail?id=${topic.id}`
      });
    },
    
    // 活动报名处理
    async handleEventRegistration(event, index) {
      if (!event || !event.id) return;
      
      try {
        // 使用统一的活动注册处理逻辑
        const result = await interactionActions.handleEventRegistration(event.id, event);
        
        if (result.success) {
          // 更新注册状态
          event.isRegistered = result.isRegistered;
          if (result.registeredCount !== undefined) {
            event.registeredCount = result.registeredCount;
          }
          
          // 添加动画效果
          event.animatingRegistration = true;
          setTimeout(() => {
            event.animatingRegistration = false;
            this.$forceUpdate();
          }, 600);
        } else if (!result.cancelled) {
          // 如果不是用户取消操作导致的失败，显示提示
          uni.showToast({
            title: result.error || '操作失败，请稍后再试',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('活动注册操作失败:', error);
        uni.showToast({
          title: '操作失败，请稍后再试',
          icon: 'none'
        });
      }
    },
    
    // 启动状态同步定时器
    startStatusSync() {
      console.log('启动首页状态同步定时器');
      
      // 清除可能存在的旧定时器
      this.stopStatusSync();
      
      // 设置新定时器，每30秒同步一次状态
      this.statusSyncTimer = setInterval(() => {
        this.syncPageStatus();
      }, 30000); // 30秒
    },
    
    // 停止状态同步
    stopStatusSync() {
      if (this.statusSyncTimer) {
        console.log('停止首页状态同步定时器');
        clearInterval(this.statusSyncTimer);
        this.statusSyncTimer = null;
      }
    },
    
    // 同步页面状态
    syncPageStatus() {
      // 避免频繁同步，设置最小间隔5秒
      const now = Date.now();
      if (now - this.lastSyncTime < 5000) return;
      
      console.log('同步首页状态');
      
      try {
        // 同步帖子状态
        if (this.posts && this.posts.length > 0) {
          this.initializePostStatuses();
        }
        
        // 同步推荐话题状态
        if (this.recommendTopics && this.recommendTopics.length > 0) {
          this.updateRecommendTopicsStatus();
        }
        
        // 同步热门活动状态
        if (this.hotEvents && this.hotEvents.length > 0) {
          this.updateHotEventsStatus();
        }
        
        this.lastSyncTime = now;
      } catch (error) {
        console.error('同步首页状态失败:', error);
      }
    },
    
    // 保存页面状态
    savePageState() {
      try {
        // 广播帖子状态变化
        if (postActions && postActions.broadcastStateChanges) {
          postActions.broadcastStateChanges();
        }
        
        // 广播交互状态变化，使用try-catch预防错误
        if (interactionActions && interactionActions.broadcastStateChanges) {
          interactionActions.broadcastStateChanges();
        }
      } catch (error) {
        console.error('广播状态变化失败:', error);
        // 错误处理，防止白屏崩溃
      }
    },
    // 获取分类数据
    async fetchCategories() {
      try {
        console.log('开始获取分类数据...');
        const res = await api.content.getCategoriesByType('post');
        console.log('获取到的原始分类数据:', res);
        
        // 处理API直接返回数组的情况
        if (Array.isArray(res)) {
          this.dynamicCategories = res.map(category => ({
            name: category.name,
            id: category.id
          }));
          console.log('分类数据获取成功(直接数组):', this.dynamicCategories);
        } 
        // 处理标准响应格式的情况
        else if (res && res.success && Array.isArray(res.data)) {
          this.dynamicCategories = res.data.map(category => ({
            name: category.name,
            id: category.id
          }));
          console.log('分类数据获取成功(标准响应):', this.dynamicCategories);
        } else {
          console.error('获取分类数据失败或返回格式不正确:', res);
        }
      } catch (error) {
        console.error('获取分类数据异常:', error);
      }
    },
    // 获取帖子作者的徽章信息
    async fetchAuthorBadges() {
      if (!this.posts || this.posts.length === 0) return;
      
      const authorsMap = new Map(); // 使用Map存储作者ID，避免重复请求
      
      // 收集所有不同的作者ID
      this.posts.forEach(post => {
        if (post.author && post.author.id && !authorsMap.has(post.author.id)) {
          authorsMap.set(post.author.id, post.author);
        }
      });
      
      if (authorsMap.size === 0) return;
      
      console.log('开始获取帖子作者徽章，总计作者数:', authorsMap.size);
      
      // 限制并发请求数量
      const batchSize = 3;
      const authorIds = Array.from(authorsMap.keys());
      
      for (let i = 0; i < authorIds.length; i += batchSize) {
        const batchAuthorIds = authorIds.slice(i, i + batchSize);
        
        // 并行请求每批作者的徽章
        await Promise.all(batchAuthorIds.map(async (authorId) => {
          try {
            const badgesResult = await api.users.getBadges(authorId);
            if (badgesResult.success && badgesResult.data) {
              console.log(`获取作者${authorId}徽章成功:`, badgesResult.data);
              
              // 更新所有包含该作者的帖子
              this.posts.forEach(post => {
                if (post.author && post.author.id === authorId) {
                  post.author.badges = badgesResult.data;
                }
              });
            }
          } catch (error) {
            console.error(`获取作者${authorId}徽章失败:`, error);
          }
        }));
      }
      
      console.log('所有作者徽章获取完成');
    },
    // 查看用户资料
    viewUserProfile(user) {
      console.log('查看用户资料:', user);
      if (!user || !user.id) return;
      
      uni.navigateTo({
        url: `/pages/user-profile/user-profile?id=${user.id}`
      });
    },
    // 获取当前用户信息
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
    
    // 初始化页面
    init() {
      // 设置最后加载时间
      this.lastLoadTime = Date.now();
      
      // 初始化分类数据
      this.staticCategories = [
        { id: 'recommended', name: '推荐' },
        { id: 'latest', name: '最新' },
        { id: 1, name: '学习' },
        { id: 2, name: '生活' },
        { id: 3, name: '情感' },
        { id: 4, name: '求助' },
        { id: 5, name: '吐槽' },
        { id: 6, name: '闲置' }
      ];
      this.dynamicCategories = [];
      
      // 加载数据
      this.loadPosts();
      
      // 设置当前活动页面
      postActions.setActivePage('index');
    },
    // 添加getImage方法
    getImage,
  }
}
</script>

<style>
:root {
  /* 主色系 */
  --primary-color: #4A90E2;
  --primary-color-light: #75B5FF;
  --primary-color-dark: #3A7BC8;
  --primary-gradient: linear-gradient(120deg, #4A90E2, #6AB6F7);

  /* 功能色 */
  --success-color: #09BE4F;
  --warning-color: #FFB703;
  --error-color: #FF2B2B;
  --info-color: #909399;

  /* 文本颜色 */
  --text-color: #181818;
  --text-color-secondary: #909399;
  --text-color-disabled: #C0C0C0;

  /* 背景颜色 */
  --background-color: #FFFFFF;
  --secondary-color: #F7F8FC;

  /* 边框颜色 */
  --border-color: #EBEEF5;
  --border-color-light: #F2F2F2;

  /* 阴影效果 */
  --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  --header-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  
  /* 过渡效果 */
  --transition-fast: 0.2s;
  --transition-normal: 0.3s;
  --ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.index-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F8F8F8;
  position: relative;
  overflow: hidden; /* 防止整体页面出现滚动条 */
}

/* 顶部标题栏 */
.header {
  padding: 10px 15px; /* 减少顶部内边距 */
  background: var(--primary-gradient);
  background-size: 200% 200%;
  animation: gradientFlow 8s infinite linear;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #FFFFFF;
  transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  position: relative;
  z-index: 10;
  border-radius: 0 0 30px 30px; 
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.15); 
}

.header-title {
  font-size: 18px; /* 从20px减小到18px */
  font-weight: 700;
  color: #FFFFFF;
  animation: fadeIn 0.5s;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-icons {
  display: flex;
  align-items: center;
}

.header-icon {
  width: 20px; /* 从24px减小到20px */
  height: 20px;
  margin-left: 15px;
  transition: transform var(--transition-fast);
}

.header-icon:active {
  transform: scale(0.9);
}

.icon-text {
  font-size: 28rpx;
  color: #FFFFFF;
  margin-left: 15px;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
}

.icon-text:active {
  opacity: 0.8;
}

.header-hidden {
  transform: translateY(-100%);
  opacity: 0;
}

/* 分类筛选栏 */
.filter-bar {
  padding: 12px 15px;
  background-color: rgba(255, 255, 255, 0.98);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.03);
  z-index: 20;
  position: relative;
  border-bottom: none;
  margin-top: -5px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 0 0 20px 20px;
}

.filter-bar-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  animation: fadeSlideDown 0.3s ease-out;
  z-index: 100;
}

.filter-scroll {
  white-space: nowrap;
  overflow: visible;
}

.filter-item {
  display: inline-block;
  padding: 8px 17px;
  margin: 0 6px;
  font-size: 14px;
  font-weight: 500;
  color: #8E9AAA;
  background-color: transparent;
  border-radius: 24px;
  transition: all 0.3s ease;
  position: relative;
}

.filter-item:first-child {
  margin-left: 0;
}

.filter-item:last-child {
  margin-right: 0;
}

.filter-item:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 3px;
  background: var(--primary-gradient);
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateX(-50%);
  border-radius: 3px;
}

.filter-item.active {
  color: var(--primary-color);
  background: rgba(74, 144, 226, 0.08);
  transform: none;
  font-weight: 600;
  box-shadow: none;
}

.filter-item.active:after {
  width: 24px;
  opacity: 1;
}

/* 帖子列表 */
.post-scroll {
  flex: 1;
  height: calc(100vh - 110px);
  overflow: hidden;
  -webkit-overflow-scrolling: touch;
  padding-top: 5px;
  /* 修复屏幕闪烁 */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  /* 关闭子元素动画，避免底部跳动 */
  contain: strict;
}

.header-hidden-adjust {
  height: calc(100vh - 65px);
}

.posts-container {
  padding: 10px 15px 30px;
  /* 关键：保持底部高度稳定，避免加载时抽搐 */
  min-height: calc(100vh - 50px);
  /* 避免浮动元素溢出 */
  overflow: hidden;
  /* 增加稳定性 */
  position: relative;
}

.post-list {
  padding: 20rpx;
}

/* 增强版帖子卡片样式 */
.post-item {
  background: #FFFFFF;
  border-radius: 28rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s var(--ease-out);
  position: relative;
  overflow: hidden;
}

.post-item:active {
  transform: translateY(2rpx) scale(0.995);
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.post-header {
  display: flex;
  align-items: center;
  padding: 10rpx 0;
  margin-bottom: 10rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  border: 2rpx solid #fff;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.1);
}

.avatar.enhanced {
  transition: transform 0.3s ease;
}

.avatar.enhanced:active {
  transform: scale(0.95);
}

.user-info {
  flex: 1;
}

.username {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 6rpx;
}

.post-time {
  font-size: 24rpx;
  color: #8E9AAA;
}

.post-content {
  margin: 16rpx 0;
  font-size: 30rpx;
  line-height: 1.6;
  color: #333333;
}

/* 增强版图片网格 */
.image-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 20rpx 0;
  gap: 10rpx;
  position: relative;
}

.post-image {
  width: 220rpx;
  height: 220rpx;
  border-radius: 18rpx;
  background-color: #F7F9FC;
  object-fit: cover;
  transition: all 0.2s ease;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
  position: relative;
  overflow: hidden;
}

.post-image:active {
  transform: scale(0.96);
  opacity: 0.85;
}

.image-count {
  position: absolute;
  right: 10rpx;
  bottom: 10rpx;
  background: rgba(0,0,0,0.6);
  color: #FFFFFF;
  font-size: 24rpx;
  padding: 6rpx 14rpx;
  border-radius: 20rpx;
  font-weight: 500;
  transition: all 0.2s ease;
}

.image-count:active {
  transform: scale(0.95);
  background: rgba(0,0,0,0.8);
}

/* 优化的话题标签 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  margin: 20rpx 0 10rpx;
}

.topic-tag {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.08), rgba(106, 182, 247, 0.15));
  color: #4A90E2;
  font-size: 24rpx;
  font-weight: 500;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  margin-right: 12rpx;
  margin-bottom: 12rpx;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 6rpx rgba(74, 144, 226, 0.1);
}

.topic-tag:active {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.15), rgba(106, 182, 247, 0.25));
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 10rpx rgba(74, 144, 226, 0.15);
}

.category-tag {
  background: #F4F7F9;
  color: #666666;
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  margin-bottom: 12rpx;
  font-weight: 500;
}

/* 增强版操作栏 */
.action-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1px solid rgba(0,0,0,0.05);
  border-radius: 0 0 24rpx 24rpx;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #666666;
  padding: 8rpx 16rpx;
  border-radius: 30rpx;
  transition: all 0.3s ease;
}

.action-item:active {
  background-color: rgba(74, 144, 226, 0.08);
  transform: scale(0.95);
}

.action-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  margin-right: 6rpx;
}

/* 操作栏图标通用样式 */
.icon-image {
  width: 32rpx;
  height: 32rpx;
  object-fit: contain;
}

.action-item .css-icon {
  font-size: 36rpx;
  transition: all 0.3s ease;
}

.action-text {
  margin-left: 4rpx;
  font-size: 24rpx;
  line-height: 1;
}

.action-item .active {
  color: #FF4757;
  font-weight: bold;
  transform: scale(1.05);
  text-shadow: 0 0 6rpx rgba(255, 71, 87, 0.2);
  animation: heartbeat 0.6s ease-out 1;
}

@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  35% {
    transform: scale(1.1);
  }
  70% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1.05);
  }
}

/* 点赞激活状态 */
.heart-icon.active {
  background-color: #FF4757;
  transform: rotate(45deg) scale(1.05);
  animation: heartbeat 0.6s ease-out 1;
}

.heart-icon.active:before,
.heart-icon.active:after {
  background-color: #FF4757;
}

/* 收藏书签图标 */
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
  animation: pulse 0.6s ease-out 1;
}

.star-icon.active:before {
  border-left-color: #FFB700;
  border-right-color: #FFB700;
}

/* 点赞和收藏文本样式 */
.action-text.active-text {
  color: #FF4757;
  font-weight: bold;
  animation: none;
}

/* 收藏文本激活样式 - 与星星图标颜色一致 */
.star-icon.active + .action-text.active-text {
  color: #FFB700;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1.05);
  }
}

.load-more, .no-more, .empty-list {
  text-align: center;
  padding: 30rpx 0;
  color: #999999;
  font-size: 26rpx;
  margin-top: 20rpx;
  background: rgba(255,255,255,0.6);
  border-radius: 20rpx;
  backdrop-filter: blur(5px);
}

/* 评论弹窗 */
.comment-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
  animation: fadeIn var(--transition-fast);
}

.comment-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.comment-panel {
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 20px 20px 0 0;
  padding: 20px;
  animation: slideUp var(--transition-normal) var(--ease-out);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.close-icon {
  font-size: 24px;
  color: var(--text-color-secondary);
  padding: 5px;
}

.comment-input-area {
  margin-bottom: 20px;
}

.comment-textarea {
  width: 100%;
  min-height: 80px;
  padding: 10px;
  font-size: 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  margin-bottom: 10px;
}

.comment-footer {
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  padding: 8px 20px;
  background: var(--primary-gradient);
  color: #FFFFFF;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.submit-btn:disabled {
  opacity: 0.5;
  background: #CCCCCC;
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
  animation: fadeIn var(--transition-fast);
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

/* 加载指示器 */
.loading-more {
  text-align: center;
  padding: 20rpx 0;
  color: #999;
  font-size: 24rpx;
}

/* 卡片悬停效果 */
.card.hover-effect {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card.hover-effect:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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

/* 点赞心形图标 - 与detail.vue保持一致 */
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

/* 校园活动区域样式删除 */

/* 热门评论样式 */
.hot-comments {
  margin-top: 16rpx;
  padding: 20rpx;
  background-color: #f9f9f9;
  border-radius: 24rpx;
  box-shadow: 0 1rpx 6rpx rgba(0,0,0,0.05);
}

.comment {
  display: flex;
  flex-direction: column;
  margin-bottom: 16rpx;
  padding-bottom: 16rpx;
  border-bottom: 1px solid #f0f0f0;
}

.comment:last-child {
  border-bottom: none;
  margin-bottom: 8rpx;
}

.comment-user {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.comment-avatar {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  margin-right: 12rpx;
  object-fit: cover;
  border: 1px solid rgba(0,0,0,0.05);
}

.username {
  font-size: 26rpx;
  color: #666;
  font-weight: 500;
}

.content {
  font-size: 28rpx;
  color: #333;
  word-break: break-all;
  line-height: 1.5;
  padding-left: 48rpx;
  position: relative;
}

.view-all-comments {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
  padding: 12rpx 16rpx;
  border-top: 1px solid #eaeaea;
  font-size: 24rpx;
  color: #8a8a8a;
  background-color: rgba(255,255,255,0.5);
  border-radius: 16rpx;
}

.view-all-comments:active {
  opacity: 0.7;
  background-color: rgba(0,0,0,0.02);
}

.debug-info {
  padding: 8rpx;
  background-color: #FFF9C4;
  border-radius: 4rpx;
  margin-bottom: 10rpx;
  font-size: 24rpx;
  color: #333;
}

.heart-icon.mini {
  width: 16rpx;
  height: 16rpx;
  transform: rotate(45deg) scale(0.8);
  margin: 0 6rpx 0 0;
}

.heart-icon.mini:before,
.heart-icon.mini:after {
  width: 16rpx;
  height: 16rpx;
}

.heart-icon.mini:before {
  top: -8rpx;
  left: 0;
}

.heart-icon.mini:after {
  top: 0;
  left: -8rpx;
}

.right-arrow {
  width: 16rpx;
  height: 16rpx;
  border-left: 2rpx solid #8a8a8a;
  border-bottom: 2rpx solid #8a8a8a;
  transform: rotate(45deg);
  margin-left: 8rpx;
}
</style>
