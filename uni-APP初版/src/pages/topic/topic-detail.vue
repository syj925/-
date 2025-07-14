<template>
  <view class="topic-container">
    <!-- 话题头部信息 -->
    <view class="topic-header" :style="{ background: `linear-gradient(135deg, ${getTopicColor(topicInfo.title)}, ${getTopicColorSecondary(topicInfo.title)})` }">
      <view class="header-back ripple-effect" @tap="goBack">
        <image class="back-icon" src="../../static/icons/icon_ztc.png" mode="aspectFit"></image>
      </view>
      
      <view class="topic-info">
        <view class="topic-title-wrapper">
          <text class="topic-name"># {{topicInfo.title}}</text>
        </view>
        <text class="topic-desc">{{topicInfo.description}}</text>
        <view class="topic-tags">
          <text class="topic-tag" v-for="(tag, index) in topicInfo.tags" :key="index">{{tag}}</text>
        </view>
      </view>
      
      <view class="topic-stats">
        <view class="stat-item">
          <text class="stat-value">{{topicInfo.count}}</text>
          <text class="stat-label">参与人数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{topicInfo.views}}</text>
          <text class="stat-label">浏览次数</text>
        </view>
      </view>
    </view>
    
    <!-- 参与按钮 -->
    <view class="participate-section">
      <button class="participate-btn ripple" @tap="participateTopic">
        <image src="/static/icons/edit.png" mode="aspectFit" class="participate-icon"></image>
        <text>参与话题</text>
      </button>
    </view>
    
    <!-- 内容列表 -->
    <scroll-view 
      scroll-y 
      class="post-list"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="refreshData"
      @scroll="onScroll"
    >
      <view class="content-header">
        <text class="content-title">最新内容</text>
      </view>
      
      <view 
        class="post-item card hover-effect" 
        v-for="(item, index) in postList" 
        :key="index" 
        @tap="viewPostDetail(item.id)"
      >
        <!-- 用户信息 -->
        <view class="post-header">
          <image class="avatar enhanced" :src="item.author.avatar || '/static/images/default-avatar.png'" mode="aspectFill"></image>
          <view class="user-info">
            <view class="username">{{item.author.name || '匿名用户'}}</view>
            <view class="post-time">{{item.time}}</view>
          </view>
        </view>

        <!-- 帖子内容 -->
        <view class="post-content">
          <text class="post-text">{{item.content}}</text>
        </view>
          
        <!-- 帖子图片 -->
        <view class="image-grid" v-if="item.images && item.images.length > 0">
          <image 
            v-for="(img, imgIndex) in item.images.slice(0, 3)" 
            :key="imgIndex" 
            :src="img" 
            mode="aspectFill" 
            class="post-image"
            @tap.stop="previewImage(item.images, imgIndex)"
          ></image>
          <view class="image-count" v-if="item.images.length > 3">+{{ item.images.length - 3 }}</view>
        </view>
        
        <!-- 帖子操作栏 -->
        <view class="action-bar">
          <view class="action-item ripple" @tap.stop="toggleLike(index)">
            <view class="action-icon-container">
              <view :class="['css-icon', 'heart-icon', item.isLiked ? 'active' : '']"></view>
            </view>
            <view class="action-text" :class="{'active-text': item.isLiked}">
              {{ item.isLiked ? '已点赞' : item.likes || 0 }}
            </view>
          </view>
          <view class="action-item ripple" @tap.stop="goComment(item.id)">
            <view class="action-icon-container">
              <image src="/static/icons/pl.png" class="icon-image"></image>
            </view>
            <view class="action-text">
              {{ item.comments || 0 }}
            </view>
          </view>
          <view class="action-item ripple" @tap.stop="sharePost(index)">
            <view class="action-icon-container">
              <image src="/static/icons/fx.png" class="icon-image"></image>
            </view>
            <view class="action-text">
              分享
            </view>
          </view>
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view class="loading-more" v-if="loading">
        <view class="spinner"></view>
        <text>加载中...</text>
      </view>
      <view class="no-more" v-if="noMore && postList.length > 0">
        <text>没有更多内容了</text>
      </view>
      <view class="empty-state" v-if="!loading && postList.length === 0">
        <image class="empty-icon" src="/static/icons/empty.png" mode="aspectFit"></image>
        <text class="empty-text">暂无内容</text>
        <text class="empty-tip">成为第一个参与者</text>
      </view>
    </scroll-view>
    
    <!-- 返回顶部按钮 -->
    <view class="back-to-top" @tap="scrollToTop" v-if="showBackToTop">
      <image src="/static/icons/top.png" mode="aspectFit" class="top-icon"></image>
    </view>
  </view>
</template>

<script>
import api from '../../utils/api.js';
import store from '../../utils/store.js';
import postActions from '../../utils/postActions.js';
import interactionActions from '../../utils/interactionActions.js';

export default {
  data() {
    return {
      topicId: '',
      topicName: '',
      refreshing: false,
      loading: false,
      noMore: false,
      showBackToTop: false,
      scrollTop: 0,
      page: 1,
      limit: 10,
      postStatusLoading: false,  // 新增：帖子状态加载标记
      postStatusLoaded: false,   // 新增：帖子状态是否已加载
      topicInfo: {
        title: '',
        description: '',
        count: 0,
        views: 0,
        tags: [],
        coverImage: null
      },
      postList: []
    }
  },
  onLoad(options) {
    console.log('话题详情页面加载，参数:', options);
    
    if (options.id) {
      this.topicId = options.id;
      console.log('通过ID加载话题:', this.topicId);
      this.loadTopicInfo();
      this.loadPosts();
      
      // 使用统一的交互动作管理，记录话题浏览量
      this.recordTopicView();
    } else if (options.name) {
      this.topicName = decodeURIComponent(options.name);
      console.log('通过名称加载话题:', this.topicName);
      // 根据名称加载话题信息，成功后在回调中再加载帖子
      this.loadTopicInfoByName();
    } else {
      console.error('缺少必要参数：id或name');
      uni.showToast({
        title: '参数错误',
        icon: 'none'
      });
    }
    
    // 使用统一的postActions初始化帖子状态
    this.$nextTick(() => {
      if (store.getters.isLogin() && this.postList.length > 0) {
        console.log('使用统一的postActions初始化帖子状态');
        this.initializePostStatuses();
      }
    });
    
    // 设置当前活动页面
    postActions.setActivePage(postActions.ACTIVE_PAGES.TOPIC, { 
      topicId: this.topicId,
      topicName: this.topicName
    });
  },
  
  onUnload() {
    // 页面卸载时保存状态
    console.log('话题详情页面卸载');
    
    // 确保帖子状态已同步到全局
    if (this.postList && this.postList.length > 0) {
      console.log('保存帖子状态到全局');
      // 将相关的帖子状态强制广播到全局
      postActions.broadcastStateChanges();
    }
  },
  
  onShow() {
    console.log('话题详情页面显示');
    
    // 重新设置活动页面
    postActions.setActivePage(postActions.ACTIVE_PAGES.TOPIC, { 
      topicId: this.topicId,
      topicName: this.topicInfo.title
    });
    
    // 如果已登录且已有帖子数据，检查状态
    if (store.getters.isLogin() && this.postList.length > 0) {
      console.log('页面显示时强制刷新帖子状态');
      // 延时确保UI准备就绪
      setTimeout(() => {
        this.batchCheckPostsStatus(true); // 强制刷新
      }, 300);
    }
  },
  methods: {
    getTopicColor(title, opacity = 1) {
      // 根据话题名称返回不同的颜色
      const colorMap = {
        '期末考试攻略': `rgba(74, 144, 226, ${opacity})`,
        '校园招聘会': `rgba(252, 132, 45, ${opacity})`,
        '食堂新菜推荐': `rgba(82, 196, 26, ${opacity})`,
        '宿舍生活日记': `rgba(157, 80, 245, ${opacity})`,
        '校园歌手大赛': `rgba(240, 85, 131, ${opacity})`
      };
      
      // 使用标题的哈希值来生成颜色，确保相同话题有相同颜色
      if (!colorMap[title]) {
        let hash = 0;
        for (let i = 0; i < title.length; i++) {
          hash = title.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const r = (hash & 0xFF) % 200 + 55;  // 55-255, 避免太暗的颜色
        const g = ((hash >> 8) & 0xFF) % 200 + 55;
        const b = ((hash >> 16) & 0xFF) % 200 + 55;
        
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
      
      return colorMap[title];
    },
    
    getTopicColorSecondary(title, opacity = 1) {
      // 根据话题名称返回不同的渐变色
      const colorMap = {
        '期末考试攻略': `rgba(100, 180, 255, ${opacity})`,
        '校园招聘会': `rgba(255, 160, 70, ${opacity})`,
        '食堂新菜推荐': `rgba(140, 230, 80, ${opacity})`,
        '宿舍生活日记': `rgba(190, 120, 255, ${opacity})`,
        '校园歌手大赛': `rgba(255, 120, 150, ${opacity})`
      };
      
      // 为没有预设的话题生成次要颜色
      if (!colorMap[title]) {
        const primary = this.getTopicColor(title, opacity);
        // 基于主色调稍微调亮创建次要颜色
        const matches = primary.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
        if (matches) {
          const r = Math.min(255, parseInt(matches[1]) + 40);
          const g = Math.min(255, parseInt(matches[2]) + 40);
          const b = Math.min(255, parseInt(matches[3]) + 40);
          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
      }
      
      return colorMap[title] || `rgba(100, 180, 255, ${opacity})`;
    },
    
    goBack() {
      uni.navigateBack();
    },
    
    onScroll(e) {
      this.scrollTop = e.detail.scrollTop;
      this.showBackToTop = this.scrollTop > 300;
    },
    
    scrollToTop() {
      uni.pageScrollTo({
        scrollTop: 0,
        duration: 300
      });
      this.showBackToTop = false;
    },
    
    // 根据ID加载话题信息
    loadTopicInfo() {
      // 获取话题详情
      api.topics.getDetail(this.topicId).then(res => {
        if (res.success && res.data) {
          // 从API响应中获取views值，如果没有则默认为0
          const views = res.data.views || 0;
          
          this.topicInfo = {
            title: res.data.name,
            description: res.data.description || '暂无描述',
            count: res.data.usageCount || 0,
            views: views, // 使用API返回的views值
            tags: [], // API中没有提供标签，可以后续扩展
            coverImage: res.data.coverImage || null
          };
        } else {
          uni.showToast({
            title: '获取话题详情失败',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('获取话题详情失败:', err);
        uni.showToast({
          title: '获取话题详情失败',
          icon: 'none'
        });
      });
    },
    
    // 根据名称加载话题信息
    loadTopicInfoByName() {
      console.log('开始根据名称加载话题信息:', this.topicName);
      
      // 如果没有ID但有名称，先搜索获取ID
      api.topics.getList({
        search: this.topicName,
        limit: 1
      }).then(res => {
        console.log('搜索话题响应:', res);
        if (res.success && res.data && res.data.topics && res.data.topics.length > 0) {
          // 先设置话题ID，然后加载话题详情和帖子
          this.topicId = res.data.topics[0].id;
          console.log('获取到话题ID:', this.topicId);
          
          // 确保topicId不为空字符串
          if (this.topicId) {
            this.loadTopicInfo();
            this.loadPosts();
            
            // 记录话题浏览量
            this.recordTopicView();
          } else {
            console.error('话题ID无效');
            uni.showToast({
              title: '话题ID无效',
              icon: 'none'
            });
          }
        } else {
          console.error('未找到该话题:', this.topicName);
          uni.showToast({
            title: '未找到该话题',
            icon: 'none'
          });
        }
      }).catch(err => {
        console.error('搜索话题失败:', err);
        uni.showToast({
          title: '搜索话题失败',
          icon: 'none'
        });
      });
    },
    
    // 加载话题相关的帖子
    loadPosts() {
      if (this.loading) return;
      
      this.loading = true;
      console.log('开始加载帖子，话题ID:', this.topicId, '页码:', this.page);
      
      api.topics.getPosts(this.topicId, { page: this.page, limit: this.limit })
        .then(res => {
          if (res.success) {
            const { posts, pagination } = res.data;
            console.log('获取帖子成功, 数量:', posts.length);
            
            // 记录原始状态，以便后续比较
            const oldPosts = [...this.postList];
            
            if (this.page === 1) {
              this.postList = posts;
            } else {
              this.postList = [...this.postList, ...posts];
            }
            
            this.noMore = pagination.page >= pagination.pages;
            
            // 更加强制地进行状态检查 - 始终强制刷新
            if (store.getters.isLogin() && posts.length > 0) {
              // 使用setTimeout确保数据已经渲染
              setTimeout(() => {
                console.log('延时检查帖子状态 - 强制刷新');
                this.batchCheckPostsStatus(true)  // 强制刷新
                  .then(stats => {
                    console.log('批量状态检查完成，状态已更新:', stats);
                  })
                  .catch(error => {
                    console.error('批量状态检查失败:', error);
                  });
              }, 300);
            }
          } else {
            uni.showToast({
              title: res.message || '获取帖子失败',
              icon: 'none'
            });
          }
        })
        .catch(err => {
          console.error('获取帖子列表错误:', err);
          uni.showToast({
            title: '加载失败，请重试',
            icon: 'none'
          });
        })
        .finally(() => {
          this.loading = false;
          if (this.refreshing) {
            uni.stopPullDownRefresh();
            this.refreshing = false;
          }
        });
    },
    
    // 刷新数据
    refreshData() {
      this.refreshing = true;
      this.page = 1;
      this.noMore = false;
      this.loadPosts();
      
      setTimeout(() => {
        this.refreshing = false;
        uni.stopPullDownRefresh();
      }, 1000);
    },
    
    // 加载更多
    loadMore() {
      if (this.loading || this.noMore) return;
      
      this.page++;
      this.loadPosts();
    },
    
    // 点赞切换
    async toggleLike(index) {
      try {
        // 检查是否已登录
        if (!store.getters.isLogin()) {
          uni.navigateTo({
            url: '/pages/login/login'
          });
          return;
        }
        
        const post = this.postList[index];
        if (!post || !post.id) return;
        
        console.log('点赞操作开始，帖子ID:', post.id, '当前状态:', post.isLiked ? '已点赞' : '未点赞');
        
        // 强制从服务器刷新帖子状态，确保前端状态与后端一致
        try {
          const status = await postActions.forceRefreshPostStatus(post.id);
          if (status) {
            // 更新帖子状态
            if (status.isLiked !== undefined) {
              const oldLiked = post.isLiked;
              post.isLiked = status.isLiked;
              
              if (oldLiked !== post.isLiked) {
                console.log(`强制刷新：帖子${post.id}点赞状态从${oldLiked}更新为${post.isLiked}`);
                // 如果服务器显示已经点赞，但UI显示未点赞，刷新UI
                if (post.isLiked) {
                  uni.showToast({
                    title: '已经点过赞了',
                    icon: 'none',
                    duration: 1500
                  });
                  return;
                }
              }
            }
          }
        } catch (err) {
          console.error('强制刷新帖子状态失败:', err);
        }
        
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
    
    // 查看帖子详情
    viewPostDetail(postId) {
      uni.navigateTo({
        url: `/pages/post-detail/post-detail?id=${postId}`
      });
    },
    
    // 前往评论
    goComment(postId) {
      uni.navigateTo({
        url: `/pages/post-detail/post-detail?id=${postId}&focus=comment`
      });
    },
    
    // 分享帖子
    sharePost(index) {
      const post = this.postList[index];
      
      uni.showActionSheet({
        itemList: ['分享给好友', '分享到朋友圈', '复制链接'],
        success: (res) => {
          if (res.tapIndex === 2) {
            // 复制链接
            const link = `https://campus-wall.example.com/post/${post.id}`;
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
              title: '分享功能开发中',
              icon: 'none'
            });
          }
        }
      });
    },
    
    // 图片预览
    previewImage(images, index) {
      uni.previewImage({
        urls: images,
        current: images[index]
      });
    },
    
    // 参与话题
    participateTopic() {
      // 检查是否已登录
      if (!store.getters.isLogin()) {
        uni.navigateTo({
          url: '/pages/login/login'
        });
        return;
      }
      
      uni.navigateTo({
        url: `/pages/publish/publish?topicId=${this.topicId}&topicName=${encodeURIComponent(this.topicInfo.title)}`
      });
    },
    
    formatTime(timestamp) {
      if (!timestamp) return '';
      
      const now = new Date();
      const date = new Date(timestamp);
      const diff = Math.floor((now - date) / 1000); // 秒数差
      
      if (diff < 60) {
        return '刚刚';
      } else if (diff < 3600) {
        return Math.floor(diff / 60) + '分钟前';
      } else if (diff < 86400) {
        return Math.floor(diff / 3600) + '小时前';
      } else if (diff < 2592000) {
        return Math.floor(diff / 86400) + '天前';
      } else {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      }
    },
    
    // 记录话题浏览 - 使用新的统一交互动作
    recordTopicView() {
      if (!this.topicId) {
        console.log('没有话题ID，无法记录浏览量');
        return;
      }
      
      console.log('准备记录话题浏览量，话题ID:', this.topicId);
      
      // 使用统一的交互动作管理
      interactionActions.handleTopicView(this.topicId)
        .then(result => {
          if (result.success) {
            console.log('记录话题浏览成功，当前浏览量:', result.views);
            if (result.views !== undefined) {
              this.topicInfo.views = result.views;
            }
          } else {
            console.error('记录话题浏览失败:', result.error);
          }
        })
        .catch(err => {
          console.error('记录话题浏览出错:', err);
        });
    },
    
    // 初始化帖子状态 - 使用统一的postActions
    async initializePostStatuses() {
      if (this.postStatusLoading || !this.postList.length) return;
      
      console.log('初始化帖子状态，共', this.postList.length, '个帖子');
      this.postStatusLoading = true;
      
      try {
        // 使用postActions统一管理
        const result = await postActions.initializePostStatus(this.postList, false);
        
        console.log('帖子状态初始化结果:', result);
        this.postStatusLoaded = true;
        
        return result;
      } catch (err) {
        console.error('初始化帖子状态失败:', err);
      } finally {
        this.postStatusLoading = false;
      }
    },
    
    // 检查帖子状态的方法
    async checkPostStatus(postId, forceCheck = false) {
      console.log('检查帖子状态:', postId, forceCheck ? '(强制刷新)' : '');
      
      try {
        // 如果不是强制刷新，尝试从缓存获取
        if (!forceCheck) {
          const cachedStatus = uni.getStorageSync(`post_status_${postId}`);
          if (cachedStatus) {
            const parsedStatus = JSON.parse(cachedStatus);
            const cacheTime = parsedStatus._timestamp || 0;
            const now = Date.now();
            
            // 如果缓存不超过5分钟，先使用缓存值
            if (now - cacheTime < 300000) { // 5分钟
              console.log(`使用缓存的状态数据(${Math.floor((now-cacheTime)/1000)}秒前)`, postId, parsedStatus);
              return parsedStatus;
            }
          }
        } else {
          console.log(`强制刷新帖子${postId}状态，跳过缓存`);
        }
        
        // 调用API检查帖子状态
        const result = await api.batch.getPostStatus(postId);
        
        if (result.success) {
          console.log('获取帖子状态成功:', postId, result.data);
          
          // 缓存状态
          const statusToCache = {
            ...result.data,
            _timestamp: Date.now()
          };
          
          try {
            uni.setStorageSync(`post_status_${postId}`, JSON.stringify(statusToCache));
          } catch (err) {
            console.error(`缓存帖子${postId}状态失败:`, err);
          }
          
          return result.data;
        } else {
          console.error('检查帖子状态失败:', result.message);
          return null;
        }
      } catch (err) {
        console.error('检查帖子状态请求失败:', err);
        return null;
      }
    },
    
    // 批量检查帖子状态的方法
    async batchCheckPostsStatus(forceCheck = false) {
      if (!this.postList.length) return;
      
      console.log('开始批量检查帖子状态，共', this.postList.length, '个帖子', forceCheck ? '(强制刷新)' : '');
      this.postStatusLoading = true;
      
      try {
        // 创建一个统计对象
        const stats = {
          total: this.postList.length,
          processed: 0,
          updated: {
            like: 0,
            collect: 0
          },
          errors: 0
        };
        
        // 每次检查5个帖子，避免同时发送太多请求
        const batchSize = 5;
        for (let i = 0; i < this.postList.length; i += batchSize) {
          const batch = this.postList.slice(i, i + batchSize);
          
          console.log(`处理批次 ${Math.floor(i/batchSize) + 1}/${Math.ceil(this.postList.length/batchSize)}，包含 ${batch.length} 个帖子`);
          
          // 使用 Promise.all 并行处理一批帖子
          await Promise.all(batch.map(async post => {
            try {
              const status = await this.checkPostStatus(post.id, forceCheck);
              stats.processed++;
              
              if (status) {
                // 记录原始状态
                const oldLiked = post.isLiked;
                const oldCollected = post.isCollected;
                
                // 更新点赞状态
                if (status.isLiked !== undefined) {
                  post.isLiked = status.isLiked;
                  if (oldLiked !== post.isLiked) {
                    console.log(`帖子${post.id}点赞状态从${oldLiked}更新为${post.isLiked}`);
                    stats.updated.like++;
                  }
                }
                
                // 更新收藏状态
                if (status.isCollected !== undefined) {
                  post.isCollected = status.isCollected;
                  if (oldCollected !== post.isCollected) {
                    console.log(`帖子${post.id}收藏状态从${oldCollected}更新为${post.isCollected}`);
                    stats.updated.collect++;
                  }
                }
                
                // 如果任一状态发生变化，强制刷新UI
                if (oldLiked !== post.isLiked || oldCollected !== post.isCollected) {
                  this.$forceUpdate();
                }
                
                // 更新全局状态
                store.mutations.updatePost(post.id, {
                  isLiked: post.isLiked,
                  isCollected: post.isCollected,
                  likes: status.likes !== undefined ? status.likes : post.likes,
                  collections: status.collections !== undefined ? status.collections : post.collections
                });
              }
            } catch (error) {
              console.error(`检查帖子${post.id}状态异常:`, error);
              stats.errors++;
            }
          }));
        }
        
        this.postStatusLoaded = true;
        return stats;
      } catch (err) {
        console.error('批量检查帖子状态异常:', err);
        return null;
      } finally {
        this.postStatusLoading = false;
      }
    },
    
    // 测试现代帖子卡片样式
    testModernCard() {
      console.log('测试现代卡片样式');
      
      // 选择所有帖子卡片元素
      const postItems = document.querySelectorAll('.post-item');
      
      // 添加现代风格类
      postItems.forEach(item => {
        item.classList.add('card', 'hover-effect');
        
        // 修改内部结构
        const avatar = item.querySelector('.avatar');
        if (avatar) {
          avatar.classList.add('enhanced');
        }
        
        const postUser = item.querySelector('.post-user');
        if (postUser) {
          postUser.className = 'user-info';
        }
        
        const postFooter = item.querySelector('.post-footer');
        if (postFooter) {
          postFooter.className = 'action-bar';
        }
        
        // 处理图片容器
        const postImages = item.querySelector('.post-images');
        if (postImages) {
          postImages.className = 'image-grid';
        }
      });
    }
  }
}
</script>

<style>
.topic-container {
  min-height: 100vh;
  background-color: #f8f9fc;
  position: relative;
  padding-top: var(--status-bar-height);
}

/* 话题头部信息 */
.topic-header {
  padding: 30px 20px 35px;
  position: relative;
  background: linear-gradient(135deg, #4A90E2, #5E81F4);
  border-radius: 0 0 30px 30px;
  color: #FFFFFF;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  z-index: 1;
  overflow: hidden;
}

.topic-header:before {
  content: '';
  position: absolute;
  width: 150%;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  bottom: -50px;
  left: -25%;
  border-radius: 50%;
  z-index: -1;
}

.header-back {
  position: absolute;
  left: 15px;
  top: 15px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: all 0.3s;
}

.header-back:active {
  transform: scale(0.9);
  background-color: rgba(255, 255, 255, 0.3);
}

.back-icon {
  width: 24px;
  height: 24px;
}

.topic-info {
  margin-top: 20px;
  padding: 0 5px;
}

.topic-title-wrapper {
  margin-bottom: 10px;
}

.topic-name {
  font-size: 26px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.topic-desc {
  font-size: 15px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 15px;
}

.topic-tags {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;
}

.topic-tag {
  font-size: 12px;
  background-color: rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
  padding: 4px 12px;
  border-radius: 15px;
  margin-right: 8px;
  margin-bottom: 8px;
}

.topic-stats {
  display: flex;
  margin-top: 20px;
}

.stat-item {
  background-color: rgba(255, 255, 255, 0.15);
  padding: 8px 15px;
  border-radius: 15px;
  margin-right: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 3px;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

/* 参与按钮 */
.participate-section {
  margin: -25px 20px 15px;
  position: relative;
  z-index: 2;
}

.participate-btn {
  background: linear-gradient(135deg, #4A90E2, #5E81F4);
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
  height: 50px;
  line-height: 50px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 5px 15px rgba(74, 144, 226, 0.3);
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.participate-btn:active {
  transform: scale(0.97);
  box-shadow: 0 3px 10px rgba(74, 144, 226, 0.2);
}

.participate-icon {
  width: 20px;
  height: 20px;
  margin-right: 5px;
}

/* 内容列表样式 */
.content-header {
  padding: 15px 20px;
  background-color: #FFFFFF;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  margin-top: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.content-title {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  position: relative;
  padding-left: 15px;
}

.content-title:before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background: linear-gradient(180deg, #4A90E2, #5E81F4);
  border-radius: 2px;
}

.post-list {
  background-color: #f8f9fc;
  height: calc(100vh - 320px);
}

/* 帖子列表项 */
.post-item {
  margin: 10px 15px;
  padding: 15px;
  background-color: #FFFFFF;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  animation: fadeInUp 0.5s;
}

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

.post-item:active {
  transform: scale(0.98);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  margin-right: 10px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.post-user {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 16px;
  font-weight: 500;
  color: #333333;
  margin-bottom: 3px;
}

.post-time {
  font-size: 12px;
  color: #999999;
}

.post-content {
  margin-bottom: 15px;
}

.post-text {
  font-size: 15px;
  line-height: 1.6;
  color: #333333;
  margin-bottom: 10px;
}

/* 图片样式 */
.post-images {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;
}

.single-image .post-image {
  width: 70%;
  height: 200px;
  border-radius: 10px;
}

.double-image .post-image {
  width: calc(50% - 5px);
  height: 150px;
  margin-right: 10px;
  border-radius: 10px;
}

/* 加载动画 */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px 0;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-top-color: #4A90E2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-more text {
  font-size: 14px;
  color: #999999;
}

.no-more {
  text-align: center;
  padding: 15px 0;
  font-size: 14px;
  color: #999999;
}

/* 返回顶部按钮 */
.back-to-top {
  position: fixed;
  right: 20px;
  bottom: 30px;
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #4A90E2, #5E81F4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
  z-index: 10;
  animation: fadeIn 0.3s;
}

.back-to-top:active {
  transform: scale(0.9);
}

.top-icon {
  width: 24px;
  height: 24px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

.empty-icon {
  width: 100px;
  height: 100px;
  margin-bottom: 15px;
  opacity: 0.7;
}

.empty-text {
  font-size: 16px;
  color: #666666;
  margin-bottom: 8px;
}

.empty-tip {
  font-size: 14px;
  color: #999999;
}

/* 涟漪效果 */
.ripple-effect {
  position: relative;
  overflow: hidden;
}

.ripple-effect:after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: width 0.3s ease-out, height 0.3s ease-out, opacity 0.3s ease-out;
}

.ripple-effect:active:after {
  width: 200%;
  height: 200%;
  opacity: 1;
}

/* CSS图标样式 */
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
  transform: rotate(45deg) scale(1.05);
  animation: heartbeat 0.6s ease-out 1;
}

.heart-icon.active:before,
.heart-icon.active:after {
  background-color: #FF4757;
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

/* 现代卡片样式 */
.card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin: 20rpx 15rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}

/* 卡片悬停效果 */
.hover-effect {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-effect:active {
  transform: translateY(2rpx) scale(0.995);
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

/* 增强版用户头像 */
.avatar.enhanced {
  transition: transform 0.3s ease;
  border: 2rpx solid #fff;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.1);
}

.avatar.enhanced:active {
  transform: scale(0.95);
}

/* 用户信息区域 */
.user-info {
  flex: 1;
}

/* 图片网格布局 */
.image-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 20rpx 0;
  gap: 10rpx;
  position: relative;
}

.action-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1px solid rgba(0,0,0,0.05);
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

.action-item.ripple:active {
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

.icon-image {
  width: 32rpx;
  height: 32rpx;
  object-fit: contain;
}

.action-text {
  margin-left: 4rpx;
  font-size: 24rpx;
  line-height: 1;
}

.action-text.active-text {
  color: #FF4757;
  font-weight: bold;
}
</style> 