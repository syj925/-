<template>
  <view class="test-page">
    <view class="header">
      <text class="title">热门评论预览测试</text>
    </view>
    
    <view class="content">
      <button @tap="loadPosts" :disabled="loading" class="load-btn">
        {{ loading ? '加载中...' : '加载帖子列表' }}
      </button>
      
      <view class="post-list" v-if="posts.length > 0">
        <post-card
          v-for="(post, index) in posts"
          :key="post.id"
          :post="post"
          @commentLike="handleCommentLike"
          @userClick="handleUserClick"
        ></post-card>
      </view>
      
      <view class="empty" v-else-if="!loading">
        <text>暂无数据</text>
      </view>
    </view>
  </view>
</template>

<script>
import PostCard from '@/components/post/PostCard.vue';

export default {
  name: 'HotCommentsTest',
  components: {
    PostCard
  },
  data() {
    return {
      posts: [],
      loading: false
    };
  },
  onLoad() {
    this.loadPosts();
  },
  methods: {
    async loadPosts() {
      this.loading = true;
      
      try {
        const response = await this.$api.post.getList({
          page: 1,
          pageSize: 5
        });
        
        if (response.code === 0) {
          this.posts = response.data.list;

        } else {
          uni.showToast({
            title: response.msg || '加载失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('加载帖子失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
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
    
    handleUserClick(user) {

      uni.showToast({
        title: `点击了用户: ${user.nickname || user.username}`,
        icon: 'none'
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.test-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  background-color: #fff;
  padding: 40rpx 30rpx 30rpx;
  border-bottom: 1px solid #eee;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.content {
  padding: 30rpx;
}

.load-btn {
  width: 100%;
  background-color: #007aff;
  color: #fff;
  border: none;
  border-radius: 10rpx;
  padding: 20rpx;
  font-size: 32rpx;
  margin-bottom: 30rpx;
}

.load-btn[disabled] {
  background-color: #ccc;
}

.post-list {
  // 帖子列表样式
}

.empty {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
}
</style>
