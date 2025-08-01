<template>
  <view class="index">
    <!-- 顶部分类栏 -->
    <view class="category">
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
    
    <!-- 测试按钮 -->
    <view class="test-buttons" style="padding: 20rpx; background: #fff; margin-bottom: 20rpx;">
      <button @tap="goToFollowTest" style="background: #007aff; color: #fff; margin-bottom: 10rpx;">测试关注功能</button>
      <button @tap="goToFollowPage" style="background: #28a745; color: #fff; margin-bottom: 10rpx;">关注列表页面</button>
      <button @tap="goToHotCommentsTest" style="background: #ff6b6b; color: #fff; margin-bottom: 10rpx;">热门评论测试</button>
      <button @tap="goToMultiLevelTest" style="background: #6f42c1; color: #fff; margin-bottom: 10rpx;">多级回复测试</button>
      <button @tap="goToEventTest" style="background: #AC92EC; color: #fff; margin-bottom: 10rpx;">活动API测试</button>
      <button @tap="goToConfigTest" style="background: #fd7e14; color: #fff; margin-bottom: 10rpx;">⚙️ 配置更新测试</button>
      <button @tap="goToSimpleTest" style="background: #17a2b8; color: #fff;">简单API测试</button>
    </view>

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
    ></post-list>
    
    <!-- 底部安全区占位 -->
    <view class="safe-area"></view>
  </view>
</template>

<script>
import PostList from '@/components/post/PostList.vue';

export default {
  components: {
    PostList
  },
  data() {
    return {
      // 分类数据
      categories: [
        { id: 'recommend', name: '推荐' },
        { id: 'all', name: '全部' },
        { id: 'activity', name: '活动' },
        { id: 'help', name: '求助' },
        { id: 'lost', name: '失物招领' },
        { id: 'market', name: '二手市场' },
        { id: 'recruit', name: '招聘兼职' },
        { id: 'emotion', name: '情感' }
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
      hotMockData: []
    };
  },
  onLoad() {
    // 加载帖子数据
    this.loadPosts();
  },

  // 处理导航栏按钮点击
  onNavigationBarButtonTap(e) {
    const index = e.index;
    if (index === 0) {
      // 搜索按钮
      this.goToSearch();
    }
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
  onPullDownRefresh() {
    this.refreshing = true;
    this.page = 1;
    this.finished = false;
    this.loadPosts();
  },
  onReachBottom() {
    this.loadMorePosts();
  },
  methods: {
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
          category: this.activeCategory !== 'all' ? this.activeCategory : undefined,
          sort: 'latest' // 全部标签显示最新内容
        };
      }

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
                const currentUser = uni.getStorageSync('userInfo');
                const currentUserId = currentUser?.id;
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
      // 调用点赞API
      const isLiked = !post.isLiked;
      
      // 正确调用API
      const apiPromise = isLiked 
        ? this.$api.like.like('post', post.id)
        : this.$api.like.unlike('post', post.id);
      
      apiPromise
        .then(res => {
          // 找到对应的帖子并更新点赞状态
          const index = this.postList.findIndex(item => item.id === post.id);
          if (index !== -1) {
            this.postList[index].isLiked = isLiked;
            this.postList[index].likeCount += isLiked ? 1 : -1;
            
            // 提示
            uni.showToast({
              title: isLiked ? '点赞成功' : '取消点赞',
              icon: 'none'
            });
          }
        })
        .catch(err => {
          console.error('点赞操作失败:', err);
          uni.showToast({
            title: '操作失败，请稍后重试',
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
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        uni.navigateTo({
          url: '/pages/auth/login/index'
        });
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
        url: `/pages/user/profile?id=${user.id}`
      });
    },

    // 去发布
    goPublish() {
      uni.navigateTo({
        url: '/pages/publish/publish'
      });
    },

    // 测试关注功能
    goToFollowTest() {
      uni.navigateTo({
        url: '/pages/test/follow-test'
      });
    },

    // 关注列表页面
    goToFollowPage() {
      uni.navigateTo({
        url: '/pages/profile/follow-simple'
      });
    },

    // 跳转到热门评论测试页面
    goToHotCommentsTest() {
      uni.navigateTo({
        url: '/pages/test/hot-comments'
      });
    },

    // 跳转到多级回复测试页面
    goToMultiLevelTest() {
      uni.navigateTo({
        url: '/pages/test/multi-level-comments'
      });
    },

    // 跳转到配置更新测试页面
    goToConfigTest() {
      uni.navigateTo({
        url: '/pages/test/config-test'
      });
    },

    // 跳转到简单API测试页面
    goToSimpleTest() {
      uni.navigateTo({
        url: '/pages/test/simple-test'
      });
    },

    // 跳转到活动API测试页面
    goToEventTest() {
      uni.navigateTo({
        url: '/pages/test/event-test'
      });
    },

    // 跳转到搜索页面
    goToSearch() {
      uni.navigateTo({
        url: '/pages/search/index'
      });
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

.category {
  background-color: $bg-card;
  padding: $spacing-sm 0;
  border-radius: 0 0 $radius-lg $radius-lg;
  box-shadow: $shadow-sm;
  position: relative;
  z-index: 1;
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
    color: $text-white;
    background: $gradient-blue;
    box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.3);
    transform: translateY(-2rpx);
  }
  
  &:last-child {
    margin-right: 0;
  }
}

.safe-area {
  height: 34rpx;
}
</style> 