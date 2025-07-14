<template>
  <view class="comment-section">
    <!-- 评论统计 -->
    <view class="comment-header">
      <text class="comment-count">评论 {{ totalComments }}</text>
      <view class="sort-options">
        <view 
          class="sort-item"
          :class="{ active: sortType === 'latest' }"
          @tap="changeSortType('latest')"
        >
          <text class="sort-text">最新</text>
        </view>
        <view 
          class="sort-item"
          :class="{ active: sortType === 'most_liked' }"
          @tap="changeSortType('most_liked')"
        >
          <text class="sort-text">最热</text>
        </view>
      </view>
    </view>
    
    <!-- 评论输入框 -->
    <view class="comment-input-wrapper">
      <comment-input
        ref="commentInput"
        :post-id="postId"
        :reply-to="currentReplyTo"
        @success="handleCommentSuccess"
        @cancelReply="cancelReply"
      ></comment-input>
    </view>
    
    <!-- 评论列表 -->
    <view class="comment-list">
      <view v-if="loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>
      
      <view v-else-if="comments.length === 0" class="empty-state">
        <text class="empty-text">暂无评论，快来抢沙发吧~</text>
      </view>
      
      <view v-else>
        <multi-level-comment
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
          :level="0"
          :max-level="maxLevel"
          @like="handleCommentLike"
          @reply="handleCommentReply"
          @userClick="handleUserClick"
          @loadMoreReplies="loadMoreReplies"
        ></multi-level-comment>
      </view>
      
      <!-- 加载更多 -->
      <view 
        class="load-more"
        v-if="hasMore && !loading"
        @tap="loadMoreComments"
      >
        <text class="load-more-text">加载更多评论</text>
      </view>
    </view>
  </view>
</template>

<script>
import CommentInput from './CommentInput.vue';
import MultiLevelComment from './MultiLevelComment.vue';

export default {
  name: 'CommentSection',
  components: {
    CommentInput,
    MultiLevelComment
  },
  props: {
    postId: {
      type: String,
      required: true
    },
    maxLevel: {
      type: Number,
      default: 3
    }
  },
  data() {
    return {
      comments: [],
      totalComments: 0,
      loading: false,
      hasMore: true,
      page: 1,
      pageSize: 10,
      sortType: 'latest', // latest, most_liked
      currentReplyTo: null
    };
  },
  mounted() {
    this.loadComments();
  },
  methods: {
    // 加载评论列表
    async loadComments(refresh = false) {
      if (this.loading) return;
      
      this.loading = true;
      
      try {
        if (refresh) {
          this.page = 1;
          this.comments = [];
          this.hasMore = true;
        }
        
        const response = await this.$api.comment.getList(this.postId, {
          page: this.page,
          pageSize: this.pageSize,
          sort: this.sortType
        });
        
        if (response.code === 0) {
          const newComments = response.data.list;
          
          if (refresh) {
            this.comments = newComments;
          } else {
            this.comments.push(...newComments);
          }
          
          this.totalComments = response.data.pagination.total;
          this.hasMore = newComments.length === this.pageSize;
          this.page++;
        }
      } catch (error) {
        console.error('加载评论失败:', error);
        uni.showToast({
          title: '加载评论失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 加载更多评论
    loadMoreComments() {
      this.loadComments();
    },
    
    // 切换排序方式
    changeSortType(type) {
      if (this.sortType === type) return;
      
      this.sortType = type;
      this.loadComments(true);
    },
    
    // 处理评论成功
    handleCommentSuccess(comment) {
      // 如果是回复，需要更新对应的评论树
      if (this.currentReplyTo) {
        this.updateCommentTree(comment);
      } else {
        // 顶级评论，添加到列表开头
        this.comments.unshift(comment);
        this.totalComments++;
      }
      
      this.cancelReply();
    },
    
    // 更新评论树
    updateCommentTree(newComment) {
      const updateComment = (comments) => {
        for (let comment of comments) {
          if (comment.id === newComment.reply_to) {
            if (!comment.children) {
              comment.children = [];
            }
            comment.children.push(newComment);
            comment.reply_count = (comment.reply_count || 0) + 1;
            return true;
          }
          
          if (comment.children && updateComment(comment.children)) {
            return true;
          }
        }
        return false;
      };
      
      updateComment(this.comments);
      this.totalComments++;
    },
    
    // 处理评论点赞
    async handleCommentLike(comment) {
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.navigateTo({
          url: '/pages/auth/login/index'
        });
        return;
      }
      
      const isLiked = !comment.is_liked;
      
      // 乐观更新UI
      comment.is_liked = isLiked;
      comment.like_count += isLiked ? 1 : -1;
      
      try {
        if (isLiked) {
          await this.$api.like.like('comment', comment.id);
        } else {
          await this.$api.like.unlike('comment', comment.id);
        }
      } catch (error) {
        console.error('评论点赞操作失败:', error);
        
        // 回滚UI更新
        comment.is_liked = !isLiked;
        comment.like_count += isLiked ? -1 : 1;
        
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    },
    
    // 处理评论回复
    handleCommentReply(replyData) {
      this.currentReplyTo = replyData.parentComment;
      
      // 聚焦输入框
      this.$nextTick(() => {
        this.$refs.commentInput && this.$refs.commentInput.focus();
      });
    },
    
    // 取消回复
    cancelReply() {
      this.currentReplyTo = null;
    },
    
    // 处理用户点击
    handleUserClick(user) {
      if (!user || !user.id) return;
      
      uni.navigateTo({
        url: `/pages/user/profile?id=${user.id}`
      });
    },
    
    // 加载更多回复
    async loadMoreReplies(comment) {
      try {
        const response = await this.$api.comment.getRepliesTree(comment.id, this.maxLevel);
        
        if (response.code === 0) {
          // 更新评论的子回复
          comment.children = response.data;
        }
      } catch (error) {
        console.error('加载更多回复失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
    },
    
    // 刷新评论列表
    refresh() {
      this.loadComments(true);
    },
    
    // 滚动到评论区
    scrollToComments() {
      // 实现滚动到评论区的逻辑
      this.$emit('scrollToComments');
    }
  }
};
</script>

<style scoped>
.comment-section {
  background-color: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 20rpx;
  border-bottom: 1rpx solid #EFF2F7;
}

.comment-count {
  font-size: 32rpx;
  color: #333333;
  font-weight: 600;
}

.sort-options {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.sort-item {
  padding: 8rpx 16rpx;
  margin-left: 16rpx;
  border-radius: 12rpx;
  transition: all 0.3s ease;
}

.sort-item.active {
  background-color: #5B8EF9;
}

.sort-item.active .sort-text {
  color: #ffffff;
}

.sort-item:not(.active):active {
  background-color: #F0F2F5;
}

.sort-text {
  font-size: 24rpx;
  color: #666666;
  transition: color 0.3s ease;
}

.comment-input-wrapper {
  padding: 20rpx;
  border-bottom: 1rpx solid #EFF2F7;
}

.comment-list {
  padding: 20rpx;
}

.loading-state, .empty-state {
  padding: 80rpx;
  text-align: center;
}

.loading-text, .empty-text {
  font-size: 28rpx;
  color: #999999;
}

.load-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30rpx;
  margin-top: 20rpx;
  background-color: #F8F9FA;
  border-radius: 12rpx;
  transition: background-color 0.3s ease;
}

.load-more:active {
  background-color: #F0F2F5;
}

.load-more-text {
  font-size: 28rpx;
  color: #666666;
}
</style>
