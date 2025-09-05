<template>
  <view class="enhanced-comment-section">
    <!-- 评论区标题栏 -->
    <view class="comment-header">
      <view class="header-content">
        <view class="title-area">
          <view class="title-main">
            <app-icon name="comment-fill" size="md" color="#4a90e2"></app-icon>
            <text class="title-text">评论区</text>
            <view class="comment-count-badge">
              <text class="count-text">{{ totalComments }}</text>
            </view>
          </view>
          <text class="subtitle-text" v-if="totalComments > 0">
            {{ totalComments > 999 ? '999+' : totalComments }}条精彩评论
          </text>
        </view>
        
        <!-- 排序和筛选 -->
        <view class="sort-controls">
          <view class="sort-tabs">
            <view 
              class="sort-tab" 
              :class="{ 'active': sortType === 'latest' }"
              @tap="changeSortType('latest')"
            >
              <app-icon name="time" size="sm" :color="sortType === 'latest' ? '#ffffff' : '#999'"></app-icon>
              <text class="sort-text">最新</text>
            </view>
            <view 
              class="sort-tab" 
              :class="{ 'active': sortType === 'hot' }"
              @tap="changeSortType('hot')"
            >
              <app-icon name="fire" size="sm" :color="sortType === 'hot' ? '#ffffff' : '#999'"></app-icon>
              <text class="sort-text">热门</text>
            </view>
            <view 
              class="sort-tab" 
              :class="{ 'active': sortType === 'most_liked' }"
              @tap="changeSortType('most_liked')"
            >
              <app-icon name="like" size="sm" :color="sortType === 'most_liked' ? '#ffffff' : '#999'"></app-icon>
              <text class="sort-text">点赞</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 快速评论栏 -->
    <view class="quick-comment-bar">
      <image 
        class="user-avatar" 
        :src="currentUserAvatar" 
        mode="aspectFill"
      ></image>
      <view class="quick-input-area" @tap="showCommentInput">
        <view class="quick-input-placeholder">
          <text class="placeholder-text">说点什么...</text>
          <view class="input-actions">
            <app-icon name="smile" size="sm" color="#999"></app-icon>
            <app-icon name="at" size="sm" color="#999"></app-icon>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 评论统计栏 -->
    <view class="comment-stats" v-if="commentStats && totalComments > 0 && (commentStats.participantCount > 0 || commentStats.totalLikes > 0)">
      <view class="stat-item">
        <app-icon name="user-group" size="sm" color="#4a90e2"></app-icon>
        <text class="stat-text">{{ commentStats.participantCount }}人参与讨论</text>
      </view>
      <view class="stat-item">
        <app-icon name="heart" size="sm" color="#ff6b6b"></app-icon>
        <text class="stat-text">获得{{ commentStats.totalLikes }}个赞</text>
      </view>
      <view class="stat-item" v-if="commentStats.hotCommentCount > 0">
        <app-icon name="fire" size="sm" color="#ff8c00"></app-icon>
        <text class="stat-text">{{ commentStats.hotCommentCount }}条热门评论</text>
      </view>
    </view>
    
    <!-- 评论列表 -->
    <view class="comment-list-container">
      <!-- 加载状态 -->
      <view class="loading-state" v-if="loading && comments.length === 0">
        <view class="loading-spinner"></view>
        <text class="loading-text">正在加载评论...</text>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-else-if="comments.length === 0 && !loading">
        <view class="empty-illustration">
          <app-icon name="comment-empty" size="xl" color="#ddd"></app-icon>
        </view>
        <text class="empty-title">还没有评论</text>
        <text class="empty-subtitle">快来发表第一条评论吧~</text>
        <button class="first-comment-btn" @tap="showCommentInput">
          <app-icon name="edit" size="sm" color="#333333"></app-icon>
          <text class="btn-text">写评论</text>
        </button>
      </view>
      
      <!-- 评论列表 -->
      <view class="comment-list" v-else>
        <view v-for="(comment, index) in comments" :key="comment.id" class="comment-item-wrapper">
          <!-- 主评论 -->
          <view class="main-comment">
            <view class="comment-header">
              <image 
                class="user-avatar" 
                :src="comment.author?.avatar || '/static/images/common/default-avatar.png'" 
                mode="aspectFill"
                @tap="handleUserClick(comment.author)"
              ></image>
              <view class="comment-meta">
                <view class="user-info">
                  <text class="username">{{ comment.author?.nickname || comment.author?.username || '用户' }}</text>
                  <text class="comment-time">{{ formatTimeAgo(comment.createTime) }}</text>
                </view>
              </view>
            </view>
            
            <view class="comment-content">
              <text class="comment-text">{{ comment.content }}</text>
              
              <!-- 评论图片 -->
              <view class="comment-images" v-if="comment.images && comment.images.length">
                <image 
                  v-for="(image, imgIndex) in comment.images"
                  :key="imgIndex"
                  class="comment-image"
                  :src="image"
                  mode="aspectFill"
                  @tap="previewCommentImage(imgIndex, comment.images)"
                ></image>
              </view>
            </view>
            
            <!-- 主评论操作栏 -->
            <view class="comment-actions">
              <view class="action-item" @tap="handleCommentLike(comment)">
                <app-icon 
                  name="like" 
                  size="sm"
                  :color="comment.isLiked ? '#ff6b6b' : '#999'"
                ></app-icon>
                <text class="action-text" :class="{ 'liked': comment.isLiked }" v-if="comment.likeCount > 0">
                  {{ comment.likeCount }}
                </text>
              </view>
              
              <view class="action-item" @tap="handleCommentReply(comment)">
                <app-icon name="comment" size="sm" color="#999"></app-icon>
                <text class="action-text">回复</text>
              </view>
              
              <view class="action-item">
                <text class="action-text">分享</text>
              </view>
            </view>
          </view>
          
          <!-- 回复列表 -->
          <view class="replies-container" v-if="comment.children && comment.children.length > 0">
            <view 
              v-for="(reply, replyIndex) in comment.children" 
              :key="reply.id"
              class="reply-item"
            >
              <view class="reply-content">
                <text class="reply-username">{{ reply.author?.nickname || reply.author?.username || '用户' }}</text>
                <text class="reply-text">: {{ reply.content }}</text>
              </view>
              
              <view class="reply-meta">
                <view class="reply-actions">
                  <view class="reply-action" @tap="handleReplyLike(reply)">
                    <app-icon 
                      name="like" 
                      size="xs"
                      :color="reply.isLiked ? '#ff6b6b' : '#ccc'"
                    ></app-icon>
                    <text class="reply-action-text" v-if="reply.likeCount > 0">{{ reply.likeCount }}</text>
                  </view>
                  <text class="reply-time">{{ formatTimeAgo(reply.createTime) }}</text>
                  <text class="reply-btn" @tap="handleReplyToReply(reply, comment)">回复</text>
                </view>
              </view>
            </view>
            
            <!-- 查看更多回复 -->
            <view 
              v-if="comment.replyCount > comment.children.length" 
              class="more-replies"
              @tap="loadMoreReplies(comment)"
            >
              <text class="more-text">查看更多回复({{ comment.replyCount - comment.children.length }})</text>
            </view>
          </view>
        </view>
        
        <!-- 加载更多 -->
        <view class="load-more-container" v-if="hasMore || loading">
          <view class="load-more-btn" v-if="hasMore && !loading" @tap="loadMoreComments">
            <app-icon name="arrow-down" size="sm" color="#999"></app-icon>
            <text class="load-more-text">查看更多评论</text>
          </view>
          <view class="loading-more" v-if="loading && comments.length > 0">
            <view class="mini-spinner"></view>
            <text class="loading-more-text">加载中...</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 评论输入组件 -->
    <enhanced-comment-input
      v-if="showInput"
      ref="commentInput"
      :post-id="postId"
      :reply-to="currentReplyTo"
      :visible="showInput"
      @success="handleCommentSuccess"
      @close="hideCommentInput"
      @cancel-reply="cancelReply"
    ></enhanced-comment-input>
  </view>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue';
import EnhancedCommentInput from './EnhancedCommentInput.vue';

export default {
  name: 'EnhancedCommentSection',
  components: {
    AppIcon,
    EnhancedCommentInput
  },
  props: {
    postId: {
      type: String,
      required: true
    },
    autoLoad: {
      type: Boolean,
      default: true
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
      sortType: 'latest', // latest, hot, most_liked
      currentReplyTo: null,
      showInput: false,
      commentStats: null,
      hotThreshold: 10 // 热门评论点赞阈值
    };
  },
  computed: {
    currentUserAvatar() {
      const userInfo = uni.getStorageSync('userInfo');
      return userInfo?.avatar || '/static/images/common/default-avatar.png';
    }
  },
  watch: {
    // 监听postId变化，当从空变为有值时自动加载
    postId(newVal, oldVal) {
      if (newVal && newVal !== oldVal && this.autoLoad) {
        this.loadComments(true);
        this.loadCommentStats();
      }
    }
  },
  mounted() {
    if (this.autoLoad && this.postId) {
      this.loadComments();
      this.loadCommentStats();
    }
  },
  methods: {
    // 加载评论列表
    async loadComments(refresh = false) {
      if (this.loading) return;
      
      // 检查postId是否有效
      if (!this.postId) {
        console.warn('postId为空，无法加载评论');
        return;
      }
      
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
          const newComments = response.data.list || [];
          console.log('📥 收到评论数据:', newComments.length, '条');
          
          // 处理评论数据
          const processedComments = newComments.map(comment => {
            console.log(`处理评论 ${comment.id}:`, {
              hasReplies: !!(comment.replies && comment.replies.length > 0),
              hasChildren: !!(comment.children && comment.children.length > 0),
              replyCount: comment.reply_count || comment.replyCount || 0,
              repliesLength: comment.replies ? comment.replies.length : 0,
              childrenLength: comment.children ? comment.children.length : 0
            });
            
            return {
              ...comment,
              // 统一字段格式
              likeCount: comment.like_count || comment.likeCount || 0,
              replyCount: comment.reply_count || comment.replyCount || 0,
              isLiked: comment.is_liked || comment.isLiked || false,
              isHot: comment.is_hot || this.calculateHotStatus(comment),
              createTime: comment.created_at || comment.createTime,
              // 处理作者信息
              author: {
                ...comment.author,
                nickname: comment.author?.nickname || comment.author?.username || '未知用户',
                avatar: comment.author?.avatar || '/static/images/common/default-avatar.png'
              },
              // 处理回复列表数据 - 统一使用 children 字段
              children: (comment.replies || comment.children || []).map(reply => ({
                ...reply,
                likeCount: reply.like_count || reply.likeCount || 0,
                isLiked: reply.is_liked || reply.isLiked || false,
                createTime: reply.created_at || reply.createTime,
                author: {
                  ...reply.author,
                  nickname: reply.author?.nickname || reply.author?.username || '未知用户',
                  avatar: reply.author?.avatar || '/static/images/common/default-avatar.png'
                }
              })),
              // 保留 replies 字段以兼容其他组件
              replies: (comment.replies || comment.children || []).map(reply => ({
                ...reply,
                likeCount: reply.like_count || reply.likeCount || 0,
                isLiked: reply.is_liked || reply.isLiked || false,
                createTime: reply.created_at || reply.createTime,
                author: {
                  ...reply.author,
                  nickname: reply.author?.nickname || reply.author?.username || '未知用户',
                  avatar: reply.author?.avatar || '/static/images/common/default-avatar.png'
                }
              }))
            };
          });
          
          console.log('✅ 处理后的评论数据:', processedComments.map(c => ({
            id: c.id,
            content: c.content.substring(0, 30),
            childrenCount: c.children ? c.children.length : 0,
            repliesCount: c.replies ? c.replies.length : 0
          })));
          
          if (refresh) {
            this.comments = processedComments;
          } else {
            this.comments.push(...processedComments);
          }
          
          this.totalComments = response.data.pagination?.total || this.totalComments;
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
    
    // 加载评论统计信息
    async loadCommentStats() {
      // 检查postId是否有效
      if (!this.postId) {
        return;
      }
      
      try {
        const response = await this.$api.comment.getStats(this.postId);
        if (response.code === 0) {
          this.commentStats = response.data;
        }
      } catch (error) {
        console.error('加载评论统计失败:', error);
        // 只有在有评论时才设置兜底数据
        if (this.totalComments > 0) {
          this.commentStats = {
            totalComments: this.totalComments,
            participantCount: Math.min(this.totalComments, 10),
            totalLikes: Math.floor(this.totalComments * 1.5),
            hotCommentCount: Math.floor(this.totalComments * 0.1)
          };
        }
      }
    },
    
    // 计算热门状态
    calculateHotStatus(comment) {
      return (comment.like_count || comment.likeCount || 0) >= this.hotThreshold;
    },
    
    // 判断是否为热门评论
    isHotComment(comment) {
      return comment.isHot || this.calculateHotStatus(comment);
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
      
      // 显示切换提示
      const sortNames = {
        latest: '最新',
        hot: '热门', 
        most_liked: '最多点赞'
      };
      
      uni.showToast({
        title: `切换到${sortNames[type]}排序`,
        icon: 'none',
        duration: 1000
      });
    },
    
    // 显示评论输入
    showCommentInput() {
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showModal({
          title: '请先登录',
          content: '登录后即可参与评论讨论',
          confirmText: '去登录',
          cancelText: '稍后再说',
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
      
      this.showInput = true;
      this.$nextTick(() => {
        this.$refs.commentInput && this.$refs.commentInput.focus();
      });
    },
    
    // 隐藏评论输入
    hideCommentInput() {
      this.showInput = false;
      this.currentReplyTo = null;
    },
    
    // 处理评论成功
    handleCommentSuccess(commentData) {
      console.log('📝 收到新评论:', {
        id: commentData.id,
        content: commentData.content?.substring(0, 30),
        reply_to: commentData.reply_to,
        currentReplyTo: this.currentReplyTo?.id
      });
      
      // 如果是回复，添加到对应评论的回复列表
      if (this.currentReplyTo && commentData.reply_to) {
        const parentIndex = this.comments.findIndex(c => c.id === this.currentReplyTo.id);
        if (parentIndex !== -1) {
          console.log(`💬 添加回复到评论 ${this.currentReplyTo.id}`);
          
          // 确保有 replies 和 children 数组
          if (!this.comments[parentIndex].replies) {
            this.comments[parentIndex].replies = [];
          }
          if (!this.comments[parentIndex].children) {
            this.comments[parentIndex].children = [];
          }
          
          // 处理新回复的数据格式
          const processedReply = {
            ...commentData,
            likeCount: commentData.like_count || commentData.likeCount || 0,
            isLiked: commentData.is_liked || commentData.isLiked || false,
            createTime: commentData.created_at || commentData.createTime,
            author: commentData.author || {
              nickname: uni.getStorageSync('userInfo')?.nickname || '我',
              avatar: uni.getStorageSync('userInfo')?.avatar || '/static/images/common/default-avatar.png'
            }
          };
          
          // 添加新回复到开头（同时添加到 replies 和 children）
          this.comments[parentIndex].replies.unshift(processedReply);
          this.comments[parentIndex].children.unshift(processedReply);
          this.comments[parentIndex].replyCount++;
          
          console.log(`✅ 回复添加成功，父评论现在有 ${this.comments[parentIndex].replies.length} 条回复`);
        } else {
          console.warn('❌ 找不到父评论:', this.currentReplyTo.id);
        }
      } else {
        // 新评论添加到列表开头
        console.log('📄 添加顶级评论');
        const newComment = {
          ...commentData,
          likeCount: commentData.like_count || commentData.likeCount || 0,
          replyCount: commentData.reply_count || commentData.replyCount || 0,
          isLiked: commentData.is_liked || commentData.isLiked || false,
          isHot: false,
          children: [],
          replies: [],
          author: commentData.author || {
            nickname: uni.getStorageSync('userInfo')?.nickname || '我',
            avatar: uni.getStorageSync('userInfo')?.avatar || '/static/images/common/default-avatar.png'
          }
        };
        this.comments.unshift(newComment);
        this.totalComments++;
      }
      
      this.hideCommentInput();
      this.loadCommentStats(); // 重新加载统计信息
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
      
      const index = this.comments.findIndex(c => c.id === comment.id);
      if (index === -1) return;
      
      const isLiked = !this.comments[index].isLiked;
      
      // 乐观更新UI
      this.comments[index].isLiked = isLiked;
      this.comments[index].likeCount += isLiked ? 1 : -1;
      
      // 检查是否变成热门评论
      this.comments[index].isHot = this.calculateHotStatus(this.comments[index]);
      
      try {
        if (isLiked) {
          await this.$api.like.like('comment', comment.id);
        } else {
          await this.$api.like.unlike('comment', comment.id);
        }
        
        // 重新加载统计信息
        this.loadCommentStats();
      } catch (error) {
        console.error('评论点赞操作失败:', error);
        
        // 回滚UI更新
        this.comments[index].isLiked = !isLiked;
        this.comments[index].likeCount += isLiked ? -1 : 1;
        this.comments[index].isHot = this.calculateHotStatus(this.comments[index]);
        
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    },
    
    // 处理评论回复
    handleCommentReply(comment) {
      this.currentReplyTo = comment;
      this.showCommentInput();
    },
    
    // 取消回复
    cancelReply() {
      this.currentReplyTo = null;
    },
    
    // 处理用户点击
    handleUserClick(user) {
      if (!user || !user.id) return;
      
      uni.navigateTo({
        url: `/pages/user/user-profile?id=${user.id}`
      });
    },
    
    // 处理展开回复
    handleExpandReplies(comment) {
      // 这里可以导航到专门的回复页面或展开回复列表
      uni.navigateTo({
        url: `/pages/comment/replies?commentId=${comment.id}&postId=${this.postId}`
      });
    },
    
    // 处理举报
    handleReport(comment) {
      uni.showActionSheet({
        itemList: ['举报不当内容', '举报垃圾信息', '举报恶意言论'],
        success: (res) => {
          const reasons = ['不当内容', '垃圾信息', '恶意言论'];
          const reason = reasons[res.tapIndex];
          
          uni.showModal({
            title: '确认举报',
            content: `确定要举报这条评论为"${reason}"吗？`,
            success: (modalRes) => {
              if (modalRes.confirm) {
                this.submitReport(comment.id, reason);
              }
            }
          });
        }
      });
    },
    
    // 提交举报
    async submitReport(commentId, reason) {
      try {
        await this.$api.report.create({
          type: 'comment',
          target_id: commentId,
          reason: reason
        });
        
        uni.showToast({
          title: '举报已提交',
          icon: 'success'
        });
      } catch (error) {
        console.error('举报失败:', error);
        uni.showToast({
          title: '举报失败',
          icon: 'none'
        });
      }
    },
    
    // 刷新评论列表
    refresh() {
      this.loadComments(true);
      this.loadCommentStats();
    },
    
    // 滚动到评论区
    scrollToComments() {
      this.$emit('scrollToComments');
    },
    
    // 加载更多回复
    async handleLoadMoreReplies(comment) {
      try {
        const response = await this.$api.comment.getReplies(comment.id, {
          page: 1,
          pageSize: 20
        });
        
        if (response.code === 0) {
          // 找到对应的评论并更新其回复列表
          const commentIndex = this.comments.findIndex(c => c.id === comment.id);
          if (commentIndex !== -1) {
            this.comments[commentIndex].replies = response.data.list || [];
            // 触发子组件的展开状态更新
            this.$set(this.comments[commentIndex], 'repliesExpanded', true);
          }
        }
      } catch (error) {
        console.error('加载更多回复失败:', error);
        uni.showToast({
          title: '加载回复失败',
          icon: 'none'
        });
      }
    },
    
    // 处理回复点赞
    async handleReplyLike(reply) {
      try {
        const isLiked = !reply.isLiked;
        
        // 乐观更新UI
        reply.isLiked = isLiked;
        reply.likeCount += isLiked ? 1 : -1;
        
        if (isLiked) {
          await this.$api.like.like('comment', reply.id);
        } else {
          await this.$api.like.unlike('comment', reply.id);
        }
      } catch (error) {
        console.error('回复点赞操作失败:', error);
        
        // 回滚UI更新
        reply.isLiked = !reply.isLiked;
        reply.likeCount += reply.isLiked ? 1 : -1;
        
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    },
    
    // 回复的回复
    handleReplyToReply(reply, parentComment) {
      this.currentReplyTo = parentComment; // 回复时使用父评论，这样新回复会显示在父评论下
      this.showCommentInput();
    },
    
    // 预览评论图片
    previewCommentImage(index, images) {
      uni.previewImage({
        current: index,
        urls: images
      });
    },
    
    // 加载更多回复
    loadMoreReplies(comment) {
      // 加载更多回复的逻辑
      console.log('加载更多回复:', comment.id);
    },
    
    // 格式化时间
    formatTimeAgo(time) {
      if (!time) return '';
      const now = new Date();
      const commentTime = new Date(time);
      const diff = Math.floor((now - commentTime) / 1000);
      
      if (diff < 60) return '刚刚';
      if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
      if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
      
      return commentTime.toLocaleDateString();
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.enhanced-comment-section {
  background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
  border-radius: 32rpx 32rpx 0 0;
  overflow: hidden;
}

.comment-header {
  background: #ffffff;
  border-bottom: 2rpx solid #f0f2f5;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  padding: 32rpx 24rpx;
}

.title-area {
  margin-bottom: 20rpx;
}

.title-main {
  @include flex(row, flex-start, center);
  margin-bottom: 8rpx;
  
  .title-text {
    font-size: 36rpx;
    font-weight: 700;
    color: $text-primary;
    margin-left: 12rpx;
  }
}

.comment-count-badge {
  display: none;
}

.subtitle-text {
  font-size: 24rpx;
  color: $text-secondary;
  margin-left: 48rpx;
}

.sort-controls {
  @include flex(row, space-between, center);
}

.sort-tabs {
  @include flex(row, flex-start, center);
  background: #f5f7fa;
  border-radius: 28rpx;
  padding: 6rpx;
  gap: 4rpx;
}

.sort-tab {
  @include flex(row, center, center);
  padding: 12rpx 20rpx;
  border-radius: 22rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 8rpx;
  
  .sort-text {
    font-size: 26rpx;
    color: #999;
    font-weight: 500;
    transition: color 0.3s ease;
  }
  
  &.active {
    background: transparent;
    box-shadow: none;
    transform: none;
    
    .sort-text {
      color: #333333;
      font-weight: bold;
    }
  }
  
  &:not(.active):active {
    background: #eeeff3;
    transform: scale(0.95);
  }
}

.quick-comment-bar {
  @include flex(row, flex-start, center);
  padding: 24rpx;
  background: #ffffff;
  border-bottom: 2rpx solid #f0f2f5;
  margin-bottom: 8rpx;
}

.user-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  border: 3rpx solid #f0f2f5;
}

.quick-input-area {
  flex: 1;
  background: #f8f9fa;
  border-radius: 36rpx;
  padding: 16rpx 20rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
  
  &:active {
    border-color: #4a90e2;
    background: #f0f6ff;
  }
}

.quick-input-placeholder {
  @include flex(row, space-between, center);
  
  .placeholder-text {
    font-size: 28rpx;
    color: #999;
  }
}

.input-actions {
  @include flex(row, flex-end, center);
  gap: 16rpx;
}

.comment-stats {
  @include flex(row, space-around, center);
  padding: 20rpx 24rpx;
  background: rgba(74, 144, 226, 0.05);
  margin: 8rpx 24rpx;
  border-radius: 20rpx;
}

.stat-item {
  @include flex(row, center, center);
  gap: 8rpx;
  
  .stat-text {
    font-size: 24rpx;
    color: $text-secondary;
    font-weight: 500;
  }
}

.comment-list-container {
  padding: 0 24rpx;
}

.loading-state {
  @include flex(column, center, center);
  padding: 80rpx;
  
  .loading-spinner {
    width: 60rpx;
    height: 60rpx;
    border: 4rpx solid #f0f2f5;
    border-top: 4rpx solid #4a90e2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 24rpx;
  }
  
  .loading-text {
    font-size: 28rpx;
    color: $text-secondary;
  }
}

.empty-state {
  @include flex(column, center, center);
  padding: 80rpx 40rpx;
  
  .empty-illustration {
    margin-bottom: 24rpx;
    opacity: 0.6;
  }
  
  .empty-title {
    font-size: 32rpx;
    color: $text-primary;
    font-weight: 600;
    margin-bottom: 12rpx;
  }
  
  .empty-subtitle {
    font-size: 26rpx;
    color: $text-secondary;
    margin-bottom: 32rpx;
  }
}

.first-comment-btn {
  @include flex(row, center, center);
  background: #f5f5f5;
  border: none;
  border-radius: 28rpx;
  padding: 16rpx 32rpx;
  gap: 8rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  margin: 0 auto;
  display: flex;
  
  .btn-text {
    font-size: 28rpx;
    color: #333333;
    font-weight: 600;
  }
  
  &:active {
    transform: scale(0.95);
    background: #e8e8e8;
  }
}

// 简洁评论列表样式
.comment-list {
  .comment-item-wrapper {
    margin-bottom: 32rpx;
    background: #fff;
    border-radius: 12rpx;
    padding: 24rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.main-comment {
  .comment-header {
    @include flex(row, flex-start, center);
    margin-bottom: 16rpx;
    
    .user-avatar {
      width: 72rpx;
      height: 72rpx;
      border-radius: 50%;
      margin-right: 16rpx;
    }
    
    .comment-meta {
      flex: 1;
      @include flex(row, space-between, center);
      
      .user-info {
        @include flex(column, flex-start, flex-start);
        
        .username {
          font-size: 28rpx;
          color: #333;
          font-weight: 500;
          margin-bottom: 4rpx;
        }
        
        .comment-time {
          font-size: 24rpx;
          color: #999;
        }
      }
      
    }
  }
  
  .comment-content {
    margin-bottom: 16rpx;
    
    .comment-text {
      font-size: 30rpx;
      color: #333;
      line-height: 1.6;
    }
    
    .comment-images {
      margin-top: 16rpx;
      @include flex(row, flex-start, flex-start);
      flex-wrap: wrap;
      gap: 8rpx;
      
      .comment-image {
        width: 120rpx;
        height: 120rpx;
        border-radius: 8rpx;
      }
    }
  }
  
  .comment-actions {
    @include flex(row, flex-start, center);
    gap: 32rpx;
    
    .action-item {
      @include flex(row, center, center);
      gap: 8rpx;
      padding: 8rpx;
      border-radius: 6rpx;
      
      &:active {
        background: rgba(0, 0, 0, 0.05);
      }
      
      .action-text {
        font-size: 26rpx;
        color: #666;
        
        &.liked {
          color: #ff6b6b;
        }
      }
    }
  }
}

.replies-container {
  margin-top: 24rpx;
  padding-left: 32rpx;
  border-left: 2rpx solid #f0f0f0;
  
  .reply-item {
    margin-bottom: 16rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .reply-content {
      @include flex(row, flex-start, flex-start);
      margin-bottom: 8rpx;
      
      .reply-username {
        font-size: 26rpx;
        color: #4a90e2;
        font-weight: 500;
        margin-right: 8rpx;
        flex-shrink: 0;

      }
      
      .reply-text {
        font-size: 26rpx;
        color: #333;
        line-height: 1.5;
        flex: 1;
      }
    }
    
    .reply-meta {
      .reply-actions {
        @include flex(row, flex-start, center);
        gap: 24rpx;
        
        .reply-action {
          @include flex(row, center, center);
          gap: 4rpx;
          
          .reply-action-text {
            font-size: 22rpx;
            color: #999;
          }
        }
        
        .reply-time {
          font-size: 22rpx;
          color: #ccc;
        }
        
        .reply-btn {
          font-size: 22rpx;
          color: #666;
          padding: 4rpx 8rpx;
          border-radius: 4rpx;
          
          &:active {
            background: rgba(0, 0, 0, 0.05);
          }
        }
      }
    }
  }
  
  .more-replies {
    padding: 16rpx 0;
    text-align: center;
    
    .more-text {
      font-size: 26rpx;
      color: #4a90e2;
    }
  }
}

.load-more-container {
  padding: 32rpx 0;
  @include flex(column, center, center);
}

.load-more-btn {
  @include flex(row, center, center);
  padding: 16rpx 32rpx;
  background: #f8f9fa;
  border-radius: 28rpx;
  gap: 8rpx;
  transition: all 0.3s ease;
  
  .load-more-text {
    font-size: 26rpx;
    color: #666;
  }
  
  &:active {
    background: #eeeff3;
    transform: scale(0.95);
  }
}

.loading-more {
  @include flex(row, center, center);
  gap: 12rpx;
  
  .mini-spinner {
    width: 32rpx;
    height: 32rpx;
    border: 3rpx solid #f0f2f5;
    border-top: 3rpx solid #4a90e2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .loading-more-text {
    font-size: 24rpx;
    color: $text-secondary;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

