<script>
import api from '../../utils/api.js';
import store from '../../utils/store.js';
import postActions from '../../utils/postActions.js';
import interactionActions from '../../utils/interactionActions.js';
import { formatDate } from '../../utils/dateUtil.js';

export default {
  data() {
    return {
      user: null,
      isMyProfile: false,
      currentTab: 0,
      tabs: ['发布', '收藏', '点赞', '活动'],
      myPosts: [],
      myCollections: [],
      myLikes: [],
      myEvents: [],
      page: {
        posts: 1,
        collections: 1,
        likes: 1,
        events: 1
      },
      loading: {
        posts: false,
        collections: false,
        likes: false,
        events: false
      },
      refreshing: {
        posts: false,
        collections: false,
        likes: false,
        events: false
      },
      noMore: {
        posts: false,
        collections: false,
        likes: false,
        events: false
      },
      limit: 10,
      userId: '',
      username: '',
      statusSyncTimer: null, // 状态同步定时器
      lastSyncTime: 0        // 最后同步时间
    };
  },
  
  onLoad(options) {
    this.userId = options.id || '';
    this.username = options.username || '';
    
    console.log('用户页面加载，参数:', options);
    
    // 加载用户信息
    this.loadUserInfo();
    
    // 设置当前活动页面
    postActions.setActivePage(postActions.ACTIVE_PAGES.PROFILE, { 
      userId: this.userId,
      username: this.username
    });
    
    // 启动状态同步
    this.startStatusSync();
  },
  
  onShow() {
    console.log('用户页面显示');
    
    // 恢复当前活动页面状态
    postActions.setActivePage(postActions.ACTIVE_PAGES.PROFILE, { 
      userId: this.userId,
      username: this.username
    });
    
    // 如果数据已加载，刷新状态
    if (this.user) {
      this.syncCurrentTabStatus();
    }
  },
  
  onUnload() {
    console.log('用户页面卸载');
    
    // 停止状态同步
    this.stopStatusSync();
    
    // 保存状态到全局
    this.saveUserPageState();
  },
  
  onHide() {
    console.log('用户页面隐藏');
    
    // 保存状态到全局
    this.saveUserPageState();
  },
  
  computed: {
    currentTabData() {
      switch(this.currentTab) {
        case 0: return this.myPosts;
        case 1: return this.myCollections;
        case 2: return this.myLikes;
        case 3: return this.myEvents;
        default: return [];
      }
    },
    
    currentTabLoading() {
      const keys = ['posts', 'collections', 'likes', 'events'];
      return this.loading[keys[this.currentTab]];
    },
    
    currentTabRefreshing() {
      const keys = ['posts', 'collections', 'likes', 'events'];
      return this.refreshing[keys[this.currentTab]];
    },
    
    currentTabNoMore() {
      const keys = ['posts', 'collections', 'likes', 'events'];
      return this.noMore[keys[this.currentTab]];
    }
  },
  
  methods: {
    // 加载用户信息
    async loadUserInfo() {
      try {
        uni.showLoading({ title: '加载中...' });
        
        let result;
        if (this.userId) {
          result = await api.users.getById(this.userId);
        } else if (this.username) {
          result = await api.users.getByUsername(this.username);
        } else {
          // 如果没有指定用户，默认加载当前登录用户
          const currentUser = store.getters.getUser();
          if (!currentUser || !currentUser.id) {
            uni.showToast({
              title: '请先登录',
              icon: 'none'
            });
            setTimeout(() => {
              uni.redirectTo({ url: '/pages/login/login' });
            }, 1500);
            return;
          }
          
          result = { success: true, data: currentUser };
        }
        
        uni.hideLoading();
        
        if (result.success && result.data) {
          this.user = result.data;
          this.userId = result.data.id;
          
          // 检查是否是自己的资料页
          const currentUser = store.getters.getUser();
          this.isMyProfile = currentUser && currentUser.id === this.user.id;
          
          // 加载默认标签页数据
          this.loadTabData();
        } else {
          uni.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('加载用户信息失败:', error);
        uni.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      }
    },
    
    // 切换标签页
    changeTab(index) {
      if (this.currentTab === index) return;
      
      this.currentTab = index;
      this.loadTabData();
    },
    
    // 加载当前标签页数据
    loadTabData() {
      switch(this.currentTab) {
        case 0:
          if (this.myPosts.length === 0) {
            this.loadUserPosts();
          }
          break;
        case 1:
          if (this.myCollections.length === 0) {
            this.loadUserCollections();
          }
          break;
        case 2:
          if (this.myLikes.length === 0) {
            this.loadUserLikes();
          }
          break;
        case 3:
          if (this.myEvents.length === 0) {
            this.loadUserEvents();
          }
          break;
      }
    },
    
    // 加载用户发布的帖子
    async loadUserPosts(refresh = false) {
      if (this.loading.posts && !refresh) return;
      
      console.log('加载用户发布的帖子');
      this.loading.posts = true;
      
      if (refresh) {
        this.refreshing.posts = true;
        this.page.posts = 1;
        this.noMore.posts = false;
      }
      
      try {
        const result = await api.posts.getByUser(this.userId, this.page.posts, this.limit);
        
        if (result.success && result.data) {
          if (refresh) {
            this.myPosts = result.data;
          } else {
            this.myPosts = [...this.myPosts, ...result.data];
          }
          
          // 检查是否还有更多数据
          this.noMore.posts = result.data.length < this.limit;
          
          // 如果有数据，递增页数
          if (result.data.length > 0) {
            this.page.posts++;
          }
          
          // 初始化帖子状态
          this.initializePostsStatus(this.myPosts);
        }
      } catch (error) {
        console.error('加载用户帖子失败:', error);
        uni.showToast({
          title: '加载失败，请稍后重试',
          icon: 'none'
        });
      } finally {
        this.loading.posts = false;
        this.refreshing.posts = false;
      }
    },
    
    // 加载用户收藏的帖子
    async loadUserCollections(refresh = false) {
      if (this.loading.collections && !refresh) return;
      
      console.log('加载用户收藏的帖子');
      this.loading.collections = true;
      
      if (refresh) {
        this.refreshing.collections = true;
        this.page.collections = 1;
        this.noMore.collections = false;
      }
      
      try {
        const result = await api.users.getCollections(this.userId, this.page.collections, this.limit);
        
        if (result.success && result.data) {
          if (refresh) {
            this.myCollections = result.data;
          } else {
            this.myCollections = [...this.myCollections, ...result.data];
          }
          
          // 检查是否还有更多数据
          this.noMore.collections = result.data.length < this.limit;
          
          // 如果有数据，递增页数
          if (result.data.length > 0) {
            this.page.collections++;
          }
          
          // 初始化帖子状态
          this.initializePostsStatus(this.myCollections);
        }
      } catch (error) {
        console.error('加载用户收藏失败:', error);
        uni.showToast({
          title: '加载失败，请稍后重试',
          icon: 'none'
        });
      } finally {
        this.loading.collections = false;
        this.refreshing.collections = false;
      }
    },
    
    // 加载用户点赞的帖子
    async loadUserLikes(refresh = false) {
      if (this.loading.likes && !refresh) return;
      
      console.log('加载用户点赞的帖子');
      this.loading.likes = true;
      
      if (refresh) {
        this.refreshing.likes = true;
        this.page.likes = 1;
        this.noMore.likes = false;
      }
      
      try {
        const result = await api.users.getLikes(this.userId, this.page.likes, this.limit);
        
        if (result.success && result.data) {
          if (refresh) {
            this.myLikes = result.data;
          } else {
            this.myLikes = [...this.myLikes, ...result.data];
          }
          
          // 检查是否还有更多数据
          this.noMore.likes = result.data.length < this.limit;
          
          // 如果有数据，递增页数
          if (result.data.length > 0) {
            this.page.likes++;
          }
          
          // 初始化帖子状态
          this.initializePostsStatus(this.myLikes);
        }
      } catch (error) {
        console.error('加载用户点赞失败:', error);
        uni.showToast({
          title: '加载失败，请稍后重试',
          icon: 'none'
        });
      } finally {
        this.loading.likes = false;
        this.refreshing.likes = false;
      }
    },
    
    // 加载用户参加的活动
    async loadUserEvents(refresh = false) {
      if (this.loading.events && !refresh) return;
      
      console.log('加载用户参加的活动');
      this.loading.events = true;
      
      if (refresh) {
        this.refreshing.events = true;
        this.page.events = 1;
        this.noMore.events = false;
      }
      
      try {
        const result = await api.users.getEvents(this.userId, this.page.events, this.limit);
        
        if (result.success && result.data) {
          if (refresh) {
            this.myEvents = result.data;
          } else {
            this.myEvents = [...this.myEvents, ...result.data];
          }
          
          // 检查是否还有更多数据
          this.noMore.events = result.data.length < this.limit;
          
          // 如果有数据，递增页数
          if (result.data.length > 0) {
            this.page.events++;
          }
          
          // 初始化活动状态
          this.initializeEventsStatus(this.myEvents);
        }
      } catch (error) {
        console.error('加载用户活动失败:', error);
        uni.showToast({
          title: '加载失败，请稍后重试',
          icon: 'none'
        });
      } finally {
        this.loading.events = false;
        this.refreshing.events = false;
      }
    },
    
    // 初始化帖子状态
    async initializePostsStatus(posts) {
      if (!posts || posts.length === 0) return;
      
      try {
        // 使用统一的postActions管理帖子状态
        await postActions.initializePostStatus(posts);
        
        // 更新界面
        this.$forceUpdate();
      } catch (error) {
        console.error('初始化帖子状态失败:', error);
      }
    },
    
    // 初始化活动状态
    async initializeEventsStatus(events) {
      if (!events || events.length === 0) return;
      
      try {
        // 收集所有活动ID
        const eventIds = events.map(event => event.id).filter(id => id);
        
        if (eventIds.length > 0) {
          // 使用统一的互动管理模块批量检查状态
          await interactionActions.refreshEventStatuses(eventIds);
        }
        
        // 更新界面
        this.$forceUpdate();
      } catch (error) {
        console.error('初始化活动状态失败:', error);
      }
    },
    
    // 刷新当前列表
    onRefresh() {
      switch(this.currentTab) {
        case 0:
          this.loadUserPosts(true);
          break;
        case 1:
          this.loadUserCollections(true);
          break;
        case 2:
          this.loadUserLikes(true);
          break;
        case 3:
          this.loadUserEvents(true);
          break;
      }
    },
    
    // 加载更多
    onLoadMore() {
      if (this.currentTabLoading || this.currentTabNoMore) return;
      
      switch(this.currentTab) {
        case 0:
          this.loadUserPosts();
          break;
        case 1:
          this.loadUserCollections();
          break;
        case 2:
          this.loadUserLikes();
          break;
        case 3:
          this.loadUserEvents();
          break;
      }
    },
    
    // 启动状态同步定时器
    startStatusSync() {
      console.log('启动用户页面状态同步定时器');
      
      // 清除可能存在的旧定时器
      this.stopStatusSync();
      
      // 设置新定时器，每30秒同步一次状态
      this.statusSyncTimer = setInterval(() => {
        this.syncCurrentTabStatus();
      }, 30000); // 30秒
    },
    
    // 停止状态同步
    stopStatusSync() {
      if (this.statusSyncTimer) {
        console.log('停止用户页面状态同步定时器');
        clearInterval(this.statusSyncTimer);
        this.statusSyncTimer = null;
      }
    },
    
    // 同步当前标签页状态
    syncCurrentTabStatus() {
      // 避免频繁同步，设置最小间隔5秒
      const now = Date.now();
      if (now - this.lastSyncTime < 5000) return;
      
      console.log('同步当前标签页状态:', this.tabs[this.currentTab]);
      
      try {
        switch(this.currentTab) {
          case 0: // 发布
          case 1: // 收藏
          case 2: // 点赞
            if (this.currentTabData.length > 0) {
              this.initializePostsStatus(this.currentTabData);
            }
            break;
          case 3: // 活动
            if (this.currentTabData.length > 0) {
              this.initializeEventsStatus(this.currentTabData);
            }
            break;
        }
        
        this.lastSyncTime = now;
      } catch (error) {
        console.error('同步状态失败:', error);
      }
    },
    
    // 保存用户页面状态
    saveUserPageState() {
      // 广播状态变化
      postActions.broadcastStateChanges();
      interactionActions.broadcastStateChanges();
    },
    
    // 处理帖子点击
    goToPost(post) {
      if (!post || !post.id) return;
      
      uni.navigateTo({
        url: `/pages/post/detail?id=${post.id}`
      });
    },
    
    // 处理活动点击
    goToEvent(event) {
      if (!event || !event.id) return;
      
      uni.navigateTo({
        url: `/pages/event/event-detail?id=${event.id}`
      });
    },
    
    // 处理点赞操作
    async handleLike(post, index) {
      if (!post || !post.id) return;
      
      try {
        // 使用统一的点赞处理逻辑
        const result = await postActions.handlePostLike(post);
        
        if (result) {
          // 添加动画效果
          post.animatingLike = true;
          setTimeout(() => {
            post.animatingLike = false;
            this.$forceUpdate();
          }, 600);
        }
      } catch (error) {
        console.error('点赞操作失败:', error);
        uni.showToast({
          title: '操作失败，请稍后再试',
          icon: 'none'
        });
      }
    },
    
    // 处理收藏操作
    async handleCollect(post, index) {
      if (!post || !post.id) return;
      
      try {
        // 使用统一的收藏处理逻辑
        const result = await postActions.handlePostCollect(post);
        
        if (result) {
          // 添加动画效果
          post.animatingCollect = true;
          setTimeout(() => {
            post.animatingCollect = false;
            this.$forceUpdate();
          }, 600);
          
          // 如果当前是在收藏标签页并且取消了收藏，需要从列表中移除
          if (this.currentTab === 1 && !post.isCollected) {
            this.myCollections = this.myCollections.filter(item => item.id !== post.id);
          }
        }
      } catch (error) {
        console.error('收藏操作失败:', error);
        uni.showToast({
          title: '操作失败，请稍后再试',
          icon: 'none'
        });
      }
    },
    
    // 处理活动注册操作
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
          
          // 如果当前是在活动标签页并且取消了注册，需要考虑是否从列表中移除
          if (this.currentTab === 3 && !event.isRegistered) {
            // 根据业务需要决定是否移除
            // this.myEvents = this.myEvents.filter(item => item.id !== event.id);
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
    }
  }
}
</script> 