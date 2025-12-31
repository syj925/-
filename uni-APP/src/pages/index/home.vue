<template>
  <view class="index">
    <!-- 自定义状态栏 + 搜索框 -->
    <view class="custom-header" :class="{ 'header-hidden': !searchHeaderVisible }">
      <!-- 状态栏占位 -->
      <view class="status-bar"></view>
      
      <!-- 搜索区域 -->
      <view class="search-header">
        <view class="search-container" @click="goToSearch">
          <view class="search-box">
            <view class="search-icon">
              <image src="/static/images/ss.svg" mode="aspectFit"></image>
            </view>
            <text class="search-placeholder">搜索帖子、用户、话题...</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 顶部分类栏 -->
    <view class="category" :class="{ 'category-sticky': !searchHeaderVisible }">
      <scroll-view
        class="category-scroll"
        scroll-x
        scroll-with-animation
        :scroll-into-view="'cate-' + activeCategory"
      >
        <view class="category-list">
          <view
            v-for="(item, index) in categories"
            :key="index"
            :id="'cate-' + item.id"
            class="category-item"
            :class="{ active: activeCategory === item.id }"
            @tap="changeCategory(item.id)"
          >
            {{ item.name }}
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 分类栏占位 (当分类栏固定时) -->
    <view v-if="!searchHeaderVisible" class="category-placeholder"></view>
    
    <!-- 轮播图 -->
    <Banner
      ref="banner"
      scene="home"
      :height="300"
      class="home-banner"
    />

    <!-- 帖子列表 -->
    <post-list
      :list="postList"
      :loading="loading"
      :refreshing="refreshing"
      :finished="finished"
      :show-empty-action="true"
      @like="handleLike"
      @comment="handleComment"
      @favorite="handleFavorite"
      @share="handleShare"
      @edit="handleEdit"
      @delete="handleDelete"
      @commentLike="handleCommentLike"
      @userClick="handleUserClick"
      @emptyAction="goPublish"
      @followStatusChange="handleFollowStatusChange"
    ></post-list>
    
    <!-- 底部安全区占位 -->
    <view class="safe-area"></view>
    
    <!-- 登录提示弹窗 -->
    <view v-if="showLoginModal" class="login-modal-mask" @tap="closeLoginModal">
      <view class="login-modal" @tap.stop>
        <view class="login-modal-icon">
          <text class="icon-emoji">🔐</text>
        </view>
        <view class="login-modal-title">登录后体验更多功能</view>
        <view class="login-modal-desc">登录后可以点赞、评论、收藏帖子，与更多校友互动</view>
        <view class="login-modal-buttons">
          <button class="login-modal-btn cancel-btn" @tap="closeLoginModal">继续浏览</button>
          <button class="login-modal-btn confirm-btn" @tap="goToLogin">去登录</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import PostList from '@/components/post/PostList.vue';
import Banner from '@/components/common/Banner.vue';
import { useUserStore } from '@/store';

export default {
  components: {
    PostList,
    Banner
  },
  data() {
    return {
      userStore: useUserStore(),
      // 分类数据 - 动态获取
      categories: [
        { id: 'recommend', name: '推荐' },
        { id: 'all', name: '全部' }
      ],
      // 当前选中的分类
      activeCategory: 'recommend',
      // 帖子列表数据
      postList: [],
      // 分页参数
      page: 1,
      pageSize: 10,
      // 加载状态
      loading: false,
      refreshing: false,
      finished: false,
      // 模拟数据 - 移除所有模拟数据
      mockData: [],
      // 推荐模拟数据 - 移除所有模拟数据
      recommendMockData: [],
      // 热门模拟数据 - 移除所有模拟数据
      hotMockData: [],
      // 滚动控制相关
      lastScrollTop: 0,
      searchHeaderVisible: true,
      scrollDirection: 'down',
      // 登录提示弹窗
      showLoginModal: false
    };
  },
  onLoad() {
    console.log('🚀 首页 onLoad 开始');
    // 先加载分类数据，再加载帖子数据
    console.log('🏷️ 准备加载分类数据');
    this.loadCategories();
    console.log('📝 准备加载帖子数据');
    this.loadPosts();
  },

  onShow() {
    // 检查是否从发布页面返回，如果是则刷新数据
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    // 获取上一个页面路径
    let prevPage = null;
    if (pages.length >= 2) {
      prevPage = pages[pages.length - 2];
    }
    
    // 从本地存储获取发布状态标记
    const hasNewPost = uni.getStorageSync('hasNewPost');
    
    // 检查全局强制刷新标记
    const app = getApp();
    const forceRefresh = app.globalData && app.globalData.forceRefresh;
    
    console.log('首页 onShow 检测: ', { 
      fromPublish: prevPage && prevPage.route && prevPage.route.includes('publish'),
      hasNewPost,
      forceRefresh
    });
    
    // 如果从发布页面返回或有新帖子标记或需要强制刷新，则刷新数据
    if ((prevPage && prevPage.route && prevPage.route.includes('publish')) || 
        hasNewPost || 
        forceRefresh) {
      console.log('需要刷新数据');
      
      // 重置页码和状态
      this.page = 1;
      this.finished = false;
      
      // 重新加载数据
      this.loadPosts();
      
      // 清除发布标记和强制刷新标记
      uni.removeStorageSync('hasNewPost');
      if (app.globalData) {
        app.globalData.forceRefresh = false;
      }
    }
  },

  // 监听页面滚动
  onPageScroll(e) {
    const scrollTop = e.scrollTop;
    const deltaY = scrollTop - this.lastScrollTop;
    
    // 滚动距离小于10px时不处理，避免频繁触发
    if (Math.abs(deltaY) < 10) return;
    
    // 判断滚动方向
    const isScrollingDown = deltaY > 0;
    const isScrollingUp = deltaY < 0;
    
    // 在顶部附近时总是显示搜索栏
    if (scrollTop < 50) {
      this.searchHeaderVisible = true;
    } else {
      // 向下滚动时隐藏搜索栏
      if (isScrollingDown && this.searchHeaderVisible) {
        this.searchHeaderVisible = false;
        this.scrollDirection = 'down';
      }
      // 向上滚动时显示搜索栏
      else if (isScrollingUp && !this.searchHeaderVisible) {
        this.searchHeaderVisible = true;
        this.scrollDirection = 'up';
      }
    }
    
    this.lastScrollTop = scrollTop;
  },

  async onPullDownRefresh() {
    this.refreshing = true;
    this.page = 1;
    this.finished = false;

    try {
      // 刷新轮播图
      console.log('🔄 首页开始刷新数据')
      if (this.$refs.banner) {
        console.log('🎯 调用轮播图refresh方法')
        await this.$refs.banner.refresh()
        console.log('✅ 轮播图refresh完成')
      } else {
        console.log('❌ 未找到轮播图ref')
      }

      // 刷新帖子数据
      await this.loadPosts();
    } catch (error) {
      console.error('首页刷新失败:', error)
    }
  },
  onReachBottom() {
    this.loadMorePosts();
  },
  methods: {
    // 加载分类数据
    async loadCategories() {
      try {
        console.log('🏷️ 开始获取分类数据...');
        const res = await this.$api.category.getList();
        console.log('🏷️ 获取到的原始分类数据:', res);
        console.log('🏷️ 响应数据类型:', typeof res);
        console.log('🏷️ 响应数据结构:', Object.keys(res || {}));

        // 处理不同的响应格式
        let dynamicCategories = [];
        if (res && Array.isArray(res)) {
          // 直接数组格式
          dynamicCategories = res;
        } else if (res && res.data && Array.isArray(res.data)) {
          // 标准响应格式
          dynamicCategories = res.data;
        } else if (res && res.code === 0 && Array.isArray(res.data)) {
          // 另一种标准响应格式
          dynamicCategories = res.data;
        }

        if (dynamicCategories.length > 0) {
          // 合并固定分类和动态分类
          this.categories = [
            { id: 'recommend', name: '推荐' },
            { id: 'all', name: '全部' },
            ...dynamicCategories.map(category => ({
              id: category.id, // 使用数字ID
              name: category.name
            }))
          ];
          console.log('分类数据加载成功:', this.categories);
        } else {
          console.warn('🏷️ 未获取到有效的分类数据，使用默认分类');
        }
      } catch (error) {
        console.error('🏷️ 获取分类数据失败:', error);
        console.error('🏷️ 错误详情:', error.response || error.message);
        // 保持默认的硬编码分类
      }
    },

    // 加载帖子数据
    loadPosts() {
      if (this.loading || this.finished) return;
      
      this.loading = true;
      
      // 调用真实API获取帖子列表
      let apiCall;
      let params;

      if (this.activeCategory === 'recommend') {
        // 推荐标签：调用推荐内容API
        apiCall = this.$api.post.getRecommended;
        params = {
          page: this.page,
          pageSize: this.pageSize
        };
      } else {
        // 全部和其他分类：调用普通帖子列表API
        apiCall = this.$api.post.getList;
        params = {
          page: this.page,
          pageSize: this.pageSize,
          categoryId: this.activeCategory !== 'all' ? this.activeCategory : undefined,
          sort: 'latest' // 全部标签显示最新内容
        };
      }

      console.log('🔍 API调用参数:', params);
      console.log('🏷️ 当前分类:', this.activeCategory);

      apiCall(params)
        .then(res => {
          console.log('获取帖子列表成功:', res);
          
          // 确认响应格式，提取list数组
          // API可能返回多种格式：
          // 1. {data: {list: [...], total: 10}}
          // 2. {data: {items: [...], total: 10}}
          // 3. {data: [...]}
          
          // 确保有响应数据
          const postData = res && res.data ? res.data : res;
          
          // 尝试提取帖子数据 - 支持多种格式
          let posts = [];
          let total = 0;
          
          if (Array.isArray(postData)) {
            // 格式3: 直接是数组
            posts = postData;
            total = postData.length;
          } else if (postData && typeof postData === 'object') {
            // 格式1和2: 对象中包含列表
            if (postData.list && Array.isArray(postData.list)) {
              posts = postData.list;
              total = postData.total || posts.length;
            } else if (postData.items && Array.isArray(postData.items)) {
              posts = postData.items;
              total = postData.total || posts.length;
            } else {
              // 尝试直接使用数据
              console.warn('无法识别的响应格式，尝试直接使用响应数据');
              posts = [];
            }
          }
          
          console.log('提取的帖子数据:', posts, '总数:', total);

          // 后处理帖子数据，确保必要字段
          const processedPosts = posts.map(post => {
            // 处理收藏数 - 优先使用 favorite_count
            const favoriteCount = post.favorite_count !== undefined ? post.favorite_count :
                                 (post.favoriteCount !== undefined ? post.favoriteCount :
                                 (post.collections !== undefined ? post.collections : 0));

            return {
              ...post,
              // 确保关键字段存在
              id: post.id,
              title: post.title || '',
              content: post.content || '',
              createTime: post.created_at || post.createdAt || post.create_time,
              // 确保作者信息结构正确 - 处理匿名逻辑
              author: (() => {
                // 获取当前用户信息
                const currentUserId = this.userStore.userInfo?.id;
                const postUserId = post.author?.id || post.user_id;

                // 如果是匿名帖子且不是作者本人查看，显示匿名信息
                if (post.is_anonymous && currentUserId !== postUserId) {
                  return {
                    id: 'anonymous',
                    username: 'anonymous',
                    nickname: '匿名用户',
                    avatar: '' // 匿名用户无头像
                  };
                }

                // 非匿名帖子或作者本人查看，显示真实信息
                return {
                  id: post.author?.id || post.user_id,
                  username: post.author?.username || post.username,
                  nickname: post.author?.nickname || post.author?.username || post.nickname || post.username || '未知用户',
                  avatar: post.author?.avatar || post.avatar
                };
              })(),
              // 位置信息
              location: post.location_name || post.locationName || '',
              // 计数信息
              likeCount: post.like_count || post.likeCount || 0,
              commentCount: post.comment_count || post.commentCount || 0,
              favoriteCount: favoriteCount,
              // 交互状态
              isLiked: post.is_liked || post.isLiked || false,
              isFavorited: post.is_favorited || post.isFavorited || false,
              // 图片处理 - 支持多种格式
              images: (() => {
                if (post.images && Array.isArray(post.images)) {
                  return post.images.map(img => {
                    if (typeof img === 'string') return img;
                    return img.url || img.src || img.path || '';
                  }).filter(Boolean);
                }
                return [];
              })(),
              // 标签处理
              tags: (() => {
                if (post.topics && Array.isArray(post.topics)) {
                  return post.topics.map(topic => {
                    if (typeof topic === 'string') return topic;
                    return topic.name || '';
                  }).filter(Boolean);
                }
                if (post.tags && Array.isArray(post.tags)) {
                  return post.tags.filter(Boolean);
                }
                return [];
              })()
            };
          });
          
          if (this.page === 1) {
            // 第一页，直接替换列表
            this.postList = processedPosts;
          } else {
            // 追加到现有列表，并去重
            const existingIds = this.postList.map(post => post.id);
            const newPosts = processedPosts.filter(post => !existingIds.includes(post.id));
            this.postList = [...this.postList, ...newPosts];
          }
          
          // 批量获取关注状态
          this.loadFollowStatus(processedPosts);
          
          // 判断是否加载完毕
          this.finished = posts.length < this.pageSize;
          
          this.page++;
        })
        .catch(err => {
          console.error('加载帖子失败:', err);
          uni.showToast({
            title: '加载失败，请重试',
            icon: 'none'
          });
        })
        .finally(() => {
          this.loading = false;
          this.refreshing = false;
          
          // 停止下拉刷新
          uni.stopPullDownRefresh();
        });
    },
    
    // 加载更多帖子
    loadMorePosts() {
      if (!this.loading && !this.finished) {
        this.loadPosts();
      }
    },
    
    // 切换分类
    changeCategory(categoryId) {
      if (this.activeCategory === categoryId) return;

      this.activeCategory = categoryId;
      this.page = 1;
      this.finished = false;
      this.postList = []; // 清空现有列表，避免重复内容

      // 重新加载帖子
      this.loadPosts();
    },
    
    // 处理点赞
    handleLike(post) {
      // 检查登录状态
      if (!this.userStore.isLoggedIn) {
        this.showLoginModal = true;
        return;
      }

      // 使用乐观更新：先立即更新UI
      const originalState = post.isLiked;
      const originalCount = post.likeCount;
      const newState = !post.isLiked;

      // 立即更新UI
      post.isLiked = newState;
      post.likeCount += newState ? 1 : -1;

      // 调用API
      const apiPromise = newState 
        ? this.$api.like.like('post', post.id)
        : this.$api.like.unlike('post', post.id);
      
      apiPromise
        .then(res => {
          console.log('点赞操作成功:', res);
          // 提示
          uni.showToast({
            title: newState ? '点赞成功' : '取消点赞',
            icon: 'success'
          });
        })
        .catch(err => {
          console.error('点赞操作失败:', err);

          // 恢复原始状态
          post.isLiked = originalState;
          post.likeCount = originalCount;

          uni.showToast({
            title: err.msg || '操作失败，请稍后重试',
            icon: 'none'
          });
        });
    },
    
    // 处理评论
    handleComment(post) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${post.id}`
      });
    },
    
    // 处理收藏
    handleFavorite(post) {
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        this.showLoginModal = true;
        return;
      }



      // 先乐观更新UI
      const originalState = post.isFavorited;
      const originalCount = post.favoriteCount;
      const newState = !post.isFavorited;

      // 立即更新UI
      post.isFavorited = newState;
      post.favoriteCount += newState ? 1 : -1;

      // 调用API
      const apiPromise = newState
        ? this.$api.favorite.favorite(post.id)
        : this.$api.favorite.unfavorite(post.id);

      apiPromise
        .then(res => {
          console.log('收藏操作成功:', res);
          // 提示
          uni.showToast({
            title: newState ? '收藏成功' : '取消收藏',
            icon: 'success'
          });
        })
        .catch(err => {
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
            title: err.msg || '操作失败，请稍后重试',
            icon: 'none'
          });
        });
    },
    
    // 处理分享
    handleShare(post) {
      uni.showActionSheet({
        itemList: ['分享给朋友', '分享到朋友圈', '复制链接'],
        success: (res) => {
          switch(res.tapIndex) {
            case 0:
              // 分享给朋友
              uni.showToast({
                title: '已发送给朋友',
                icon: 'none'
              });
              break;
            case 1:
              // 分享到朋友圈
              uni.showToast({
                title: '已分享到朋友圈',
                icon: 'none'
              });
              break;
            case 2:
              // 复制链接
              uni.setClipboardData({
                data: `https://campus-wall.example.com/post/${post.id}`,
                success: () => {
                  uni.showToast({
                    title: '链接已复制',
                    icon: 'none'
                  });
                }
              });
              break;
          }
        }
      });
    },
    
    // 处理编辑
    handleEdit(post) {
      uni.navigateTo({
        url: `/pages/publish/publish?id=${post.id}`
      });
    },
    
    // 处理删除
    handleDelete(post) {
      uni.showModal({
        title: '提示',
        content: '确认删除该帖子吗？',
        success: (res) => {
          if (res.confirm) {
            // 调用删除API
            this.$api.post.delete(post.id)
              .then(() => {
                // 从列表中移除
                const index = this.postList.findIndex(item => item.id === post.id);
                if (index !== -1) {
                  this.postList.splice(index, 1);
                }
                
                // 提示
                uni.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
              })
              .catch(err => {
                console.error('删除帖子失败:', err);
                uni.showToast({
                  title: '删除失败，请稍后重试',
                  icon: 'none'
                });
              });
          }
        }
      });
    },

    // 处理评论点赞
    handleCommentLike(comment) {
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.navigateTo({
          url: '/pages/auth/login/index'
        });
        return;
      }

      // 调用点赞API
      const isLiked = !comment.is_liked;

      // 乐观更新UI
      comment.is_liked = isLiked;
      comment.like_count += isLiked ? 1 : -1;

      const apiCall = isLiked
        ? this.$api.like.like('comment', comment.id)
        : this.$api.like.unlike('comment', comment.id);

      apiCall.catch(err => {
        console.error('评论点赞操作失败:', err);

        // 回滚UI更新
        comment.is_liked = !isLiked;
        comment.like_count += isLiked ? -1 : 1;

        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      });
    },

    // 处理用户点击
    handleUserClick(user) {
      if (!user || !user.id) return;

      uni.navigateTo({
        url: `/pages/user/user-profile?id=${user.id}`
      });
    },

    // 去发布
    goPublish() {
      uni.navigateTo({
        url: '/pages/publish/publish'
      });
    },

    // 处理关注状态变化：同步更新列表里同一作者的所有帖子
    handleFollowStatusChange({ userId, isFollowing }) {
      if (!userId) return;

      this.postList.forEach(post => {
        if (post?.author?.id === userId) {
          post.author.isFollowing = !!isFollowing;
          if (!post.author.dataValues) post.author.dataValues = {};
          post.author.dataValues.isFollowing = !!isFollowing;
        }
      });

      // 触发视图更新（某些平台对深层对象更新不敏感）
      this.$forceUpdate();
    },



    // 跳转到搜索页面
    goToSearch() {
      uni.navigateTo({
        url: '/pages/search/index'
      });
    },
    
    // 打开登录提示弹窗
    openLoginModal() {
      this.showLoginModal = true;
    },
    
    // 关闭登录提示弹窗
    closeLoginModal() {
      this.showLoginModal = false;
    },
    
    // 去登录
    goToLogin() {
      this.showLoginModal = false;
      uni.navigateTo({
        url: '/pages/auth/login/index'
      });
    },

    // 批量获取关注状态
    async loadFollowStatus(posts) {
      // 先检查是否有token
      const token = uni.getStorageSync('token');
      if (!token) {
        console.log('📋 未登录，跳过关注状态查询');
        return;
      }
      
      // 检查用户是否登录
      const currentUser = uni.getStorageSync('userInfo');
      const currentUserId = currentUser?.id || uni.getStorageSync('userId') || uni.getStorageSync('user_id');
      
      if (!currentUserId) {
        console.log('📋 无用户ID，跳过关注状态查询');
        return; // 用户未登录，无需获取关注状态
      }

      try {
        // 提取所有非匿名且非自己的帖子作者ID
        const authorIds = posts
          .filter(post => {
            return post.author && 
                   post.author.id && 
                   post.author.id !== 'anonymous' && 
                   post.author.id !== currentUserId;
          })
          .map(post => post.author.id);

        if (authorIds.length === 0) {
          return; // 没有需要查询关注状态的作者
        }

        console.log('📋 批量查询关注状态，作者IDs:', authorIds);

        // 使用批量查询API（更高效）
        const followStates = {};
        try {
          const result = await this.$api.follow.batchCheckFollow(authorIds);
          
          // 处理批量查询结果
          if (result && result.data) {
            Object.assign(followStates, result.data);
          }
          
          console.log('📋 批量查询结果:', followStates);
        } catch (error) {
          console.warn('批量查询关注状态失败，使用单个查询:', error);
          
          // 降级到单个查询
          for (const authorId of authorIds) {
            try {
              const result = await this.$api.follow.isFollowing(authorId);
              followStates[authorId] = result?.following || result?.isFollowing || false;
            } catch (err) {
              console.warn(`查询关注状态失败 ${authorId}:`, err);
              followStates[authorId] = false;
            }
          }
        }

        console.log('📋 获取到的关注状态:', followStates);

        // 更新postList中的关注状态
        this.postList.forEach(post => {
          if (post.author && post.author.id && followStates.hasOwnProperty(post.author.id)) {
            // 确保author有dataValues属性
            if (!post.author.dataValues) {
              post.author.dataValues = {};
            }
            post.author.dataValues.isFollowing = followStates[post.author.id];
            // 同时设置isFollowing属性（兼容不同的访问方式）
            post.author.isFollowing = followStates[post.author.id];
            
            console.log(`📋 更新帖子 ${post.id} 作者 ${post.author.id} 关注状态: ${followStates[post.author.id]}`);
          }
        });

        // 强制更新视图
        this.$forceUpdate();

      } catch (error) {
        console.error('批量获取关注状态失败:', error);
      }
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.index {
  min-height: 100vh;
  background-color: $bg-page;
  display: flex;
  flex-direction: column;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 280rpx;
    background: linear-gradient(180deg, rgba($primary-color, 0.08), rgba($primary-color, 0) 90%);
    z-index: 0;
    pointer-events: none;
  }
}

/* 自定义头部样式 */
.custom-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
  backdrop-filter: blur(10rpx);
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
  transform: translateY(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.header-hidden {
    transform: translateY(-100%);
  }
}

.status-bar {
  height: var(--status-bar-height);
  width: 100%;
}

.search-header {
  padding: 20rpx 30rpx;
}

.search-container {
  position: relative;
}

.search-box {
  @include flex(row, flex-start, center);
  background: rgba(247, 248, 250, 0.8);
  border-radius: 50rpx;
  padding: 20rpx 30rpx;
  border: 2rpx solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  
  &:active {
    background: rgba(240, 242, 245, 0.9);
    transform: scale(0.98);
  }
}

.search-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 20rpx;
  
  image {
    width: 100%;
    height: 100%;
  }
}

.search-placeholder {
  font-size: 28rpx;
  color: #999;
  flex: 1;
}

.category {
  margin-top: calc(var(--status-bar-height) + 120rpx); /* 为固定头部留出空间 */
  background-color: $bg-card;
  padding: $spacing-sm 0;
  border-radius: 0 0 $radius-lg $radius-lg;
  box-shadow: $shadow-sm;
  position: relative;
  z-index: 999;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.category-sticky {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    margin-top: var(--status-bar-height);
    border-radius: 0;
    box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10rpx);
    background: rgba(255, 255, 255, 0.95);
  }
}

/* 分类栏占位空间 */
.category-placeholder {
  height: calc(var(--status-bar-height) + 88rpx); /* 状态栏高度 + 分类栏高度 */
  width: 100%;
}

.category-scroll {
  white-space: nowrap;
  width: 100%;
}

.category-list {
  display: inline-block;
  padding: 0 $spacing-md;
}

.category-item {
  display: inline-block;
  font-size: $font-size-md;
  color: $text-tertiary;
  padding: $spacing-xs $spacing-md;
  margin-right: $spacing-md;
  border-radius: $radius-xl;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  
  &.active {
    color: #333333;
    font-weight: bold;
    background: transparent;
    box-shadow: none;
    transform: none;
  }
  
  &:last-child {
    margin-right: 0;
  }
}

.safe-area {
  height: 34rpx;
}

/* 登录提示弹窗 */
.login-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  @include flex(row, center, center);
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.login-modal {
  width: 600rpx;
  background: #fff;
  border-radius: 30rpx;
  padding: 60rpx 40rpx 40rpx;
  @include flex(column, flex-start, center);
  animation: slideUp 0.3s ease;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(100rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-modal-icon {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 30rpx;
  @include flex(row, center, center);
  
  .icon-emoji {
    font-size: 100rpx;
    line-height: 1;
  }
  
  image {
    width: 100%;
    height: 100%;
  }
}

.login-modal-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
  text-align: center;
}

.login-modal-desc {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  text-align: center;
  margin-bottom: 40rpx;
  padding: 0 20rpx;
}

.login-modal-buttons {
  @include flex(row, space-between, center);
  width: 100%;
  gap: 20rpx;
}

.login-modal-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
  border: none;
  @include flex(row, center, center);
  transition: all 0.3s ease;
  
  &.cancel-btn {
    background: #f5f5f5;
    color: #666;
    
    &:active {
      background: #e5e5e5;
      transform: scale(0.95);
    }
  }
  
  &.confirm-btn {
    background: linear-gradient(135deg, $primary-color 0%, lighten($primary-color, 10%) 100%);
    color: #fff;
    box-shadow: 0 8rpx 20rpx rgba($primary-color, 0.3);
    
    &:active {
      background: linear-gradient(135deg, darken($primary-color, 5%) 0%, $primary-color 100%);
      transform: scale(0.95);
      box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.2);
    }
  }
}
</style> 