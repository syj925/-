<template>
  <view class="post-detail">
    <!-- 帖子内容 -->
    <view class="post">
      <view class="post-header">
        <view class="post-user" @tap="handleUserClick">
          <image class="post-avatar" :src="processedAvatarUrl" mode="aspectFill"></image>
          <view class="post-info">
            <view class="post-name">{{ post.nickname || '未知用户' }}</view>
            <view class="post-meta">
              <text class="post-time">{{ formatTime }}</text>
              <text v-if="post.location" class="post-location">{{ post.location }}</text>
            </view>
          </view>
        </view>
        <view class="post-more" @tap="handleMore">
          <app-icon name="more" color="#666"></app-icon>
        </view>
      </view>
      
      <view class="post-content">
        <view class="post-title" v-if="post.title">{{ post.title }}</view>
        <view class="post-text">{{ post.content || '暂无内容' }}</view>
        
        <!-- 图片展示区 -->
        <view class="post-images" v-if="post.images && post.images.length">
          <view class="post-image-container" :class="imageLayoutClass">
            <image 
              v-for="(image, index) in processedImages" 
              :key="index"
              :src="image" 
              mode="aspectFill" 
              class="post-image" 
              @tap="previewImage(index)"
            ></image>
          </view>
        </view>
        
        <!-- 话题标签 -->
        <view class="post-tags" v-if="post.tags && post.tags.length">
          <view class="post-tag" v-for="(tag, index) in post.tags" :key="index">
            #{{ tag }}
          </view>
        </view>
      </view>
      
      <view class="post-footer">
        <view class="post-action" @tap="handleLike">
          <app-icon 
            name="like" 
            :customClass="post.isLiked ? 'active' : ''"
            :color="post.isLiked ? '#FF6B6B' : '#666'"
          ></app-icon>
          <text :class="['post-count', post.isLiked ? 'active' : '']">{{ post.likeCount || 0 }}</text>
        </view>
        
        <view class="post-action" @tap="focusComment">
          <app-icon name="comment" color="#666"></app-icon>
          <text class="post-count">{{ post.commentCount || 0 }}</text>
        </view>
        
        <view class="post-action" @tap="handleFavorite">
          <app-icon 
            name="favorite" 
            :customClass="post.isFavorited ? 'active' : ''"
            :color="post.isFavorited ? '#FFCE54' : '#666'"
          ></app-icon>
          <text :class="['post-count', post.isFavorited ? 'active' : '']">{{ post.favoriteCount || 0 }}</text>
        </view>
        
        <view class="post-action" @tap="handleShare">
          <app-icon name="share" color="#666"></app-icon>
          <text class="post-count">分享</text>
        </view>
      </view>
    </view>
    
    <!-- 评论区 -->
    <view class="comments">
      <view class="comments-header">
        <text class="comments-title">评论 {{ post.commentCount || 0 }}</text>
        <view class="comments-sort">
          <view class="sort-buttons">
            <view
              class="sort-button"
              :class="{ active: sortType === 'latest' }"
              @tap="changeSortType('latest')"
            >
              <text class="sort-text">最新</text>
            </view>
            <view
              class="sort-button"
              :class="{ active: sortType === 'hot' }"
              @tap="changeSortType('hot')"
            >
              <text class="sort-text">🔥 热门</text>
            </view>
            <view
              class="sort-button"
              :class="{ active: sortType === 'most_liked' }"
              @tap="changeSortType('most_liked')"
            >
              <text class="sort-text">👍 点赞</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 评论列表 -->
      <view class="comments-list" v-if="commentList.length > 0">
        <view 
          class="comment-item" 
          v-for="(comment, index) in commentList" 
          :key="comment.id || index"
        >
          <view class="comment-user" @tap="handleCommentUserClick(comment)">
            <image class="comment-avatar" :src="getProcessedCommentAvatar(comment)" mode="aspectFill"></image>
          </view>
          <view class="comment-body">
            <view class="comment-header">
              <view class="comment-user-info">
                <text class="comment-nickname">{{ getCommentNickname(comment) }}</text>
                <!-- 热门评论标识 -->
                <view class="hot-comment-badge" v-if="comment.is_hot">
                  <text class="hot-icon">🔥</text>
                  <text class="hot-text">热门</text>
                </view>
              </view>
              <text class="comment-time">{{ formatCommentTime(comment.createTime) }}</text>
            </view>
            <view class="comment-content">{{ comment.content }}</view>
            
            <!-- 评论的回复 -->
            <view 
              class="comment-replies" 
              v-if="comment.replies && comment.replies.length"
            >
              <view 
                class="reply-item" 
                v-for="(reply, rIndex) in comment.replies" 
                :key="reply.id || rIndex"
              >
                <text class="reply-nickname">{{ reply.nickname }}</text>
                <text class="reply-content">: {{ reply.content }}</text>
              </view>
              <view 
                class="reply-more" 
                v-if="comment.replyCount > comment.replies.length"
                @tap="loadMoreReplies(comment.id)"
              >
                查看更多回复
              </view>
            </view>
            
            <view class="comment-actions">
              <view class="comment-action" @tap="handleCommentLike(comment)">
                <app-icon 
                  name="like" 
                  size="sm"
                  :customClass="comment.isLiked ? 'active' : ''"
                  :color="comment.isLiked ? '#FF6B6B' : '#999'"
                ></app-icon>
                <text :class="['comment-action-text', comment.isLiked ? 'active' : '']">{{ comment.likeCount || 0 }}</text>
              </view>
              <view class="comment-action" @tap="replyComment(comment)">
                <app-icon name="comment" size="sm" color="#999"></app-icon>
                <text class="comment-action-text">回复</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view class="comments-loading" v-if="loading">
        <text class="comments-loading-text">加载中...</text>
      </view>
      
      <!-- 没有评论 -->
      <view class="comments-empty" v-if="!commentList.length && !loading">
        <image class="comments-empty-icon" src="/static/images/common/empty.png"></image>
        <text class="comments-empty-text">暂无评论，快来抢沙发吧~</text>
      </view>
    </view>
    
    <!-- 底部评论框 -->
    <view class="comment-box">
      <view class="comment-input-wrap">
        <input 
          class="comment-input"
          type="text"
          confirm-type="send"
          placeholder="说点什么..."
          :value="commentText"
          :focus="commentFocus"
          @input="onCommentInput"
          @confirm="sendComment"
        />
      </view>
      <view 
        class="comment-send" 
        :class="{ active: commentText.trim() }"
        @tap="sendComment"
      >发送</view>
    </view>
  </view>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue';
import { formatTimeAgo } from '@/utils/date';
import { UrlUtils } from '@/utils';

export default {
  components: {
    AppIcon
  },
  data() {
    return {
      // 帖子信息
      post: {
        id: '',
        title: '',
        content: '',
        images: [],
        tags: [],
        likeCount: 0,
        commentCount: 0,
        favoriteCount: 0,
        isLiked: false,
        isFavorited: false,
        isOwner: false,
        avatar: '',
        nickname: '',
        createTime: '',
        location: ''
      },
      // 评论列表
      commentList: [],
      // 评论分页
      page: 1,
      // 排序方式：最新/最热
      sortType: 'latest',
      // 加载状态
      loading: false,
      finished: false,
      // 评论内容
      commentText: '',
      // 评论焦点
      commentFocus: false,
      // 回复的评论
      replyTo: null
    };
  },
  computed: {
    // 格式化时间
    formatTime() {
      return formatTimeAgo(this.post.createTime || Date.now());
    },
    // 图片布局
    imageLayoutClass() {
      const count = this.post.images ? this.post.images.length : 0;
      if (count === 1) return 'single';
      if (count === 2) return 'double';
      if (count === 4) return 'four';
      if (count >= 3) return 'grid';
      return '';
    },
    // 处理后的头像URL
    processedAvatarUrl() {
      return this.post.avatar ? UrlUtils.ensureAbsoluteUrl(this.post.avatar) : '/static/images/common/default-avatar.png';
    },
    // 处理后的图片URL列表
    processedImages() {
      if (!this.post.images || !this.post.images.length) return [];
      return this.post.images.map(image => UrlUtils.ensureAbsoluteUrl(image));
    }
  },
  onLoad(options) {
    // 加载帖子详情
    this.loadPostDetail(options.id);
    
    // 如果需要聚焦评论框
    if (options.focus === 'comment') {
      this.commentFocus = true;
    }
  },
  onReachBottom() {
    // 加载更多评论
    if (!this.loading && !this.finished) {
      this.loadMoreComments();
    }
  },
  methods: {
    // 处理用户头像/名称点击
    handleUserClick() {
      if (this.post && this.post.user_id) {
        uni.navigateTo({
          url: `/pages/user/user-profile?id=${this.post.user_id}`
        })
      }
    },
    
    // 处理评论用户点击
    handleCommentUserClick(comment) {
      // 检查是否匿名评论
      if (comment.is_anonymous) {
        uni.showToast({
          title: '匿名用户无法查看主页',
          icon: 'none'
        })
        return
      }
      
      // 获取用户ID
      const userId = comment.author?.id || comment.user_id
      if (userId) {
        uni.navigateTo({
          url: `/pages/user/user-profile?id=${userId}`
        })
      }
    },
    
    // 处理评论头像URL
    getProcessedCommentAvatar(comment) {
      // 检查是否匿名
      if (comment.is_anonymous) {
        return '/static/images/common/anonymous-avatar.png';
      }

      // 优先使用 author.avatar，然后是 avatar
      const avatarUrl = comment.author?.avatar || comment.avatar;

      if (avatarUrl) {
        return UrlUtils.ensureAbsoluteUrl(avatarUrl);
      }

      return '/static/images/common/default-avatar.png';
    },

    // 获取评论昵称
    getCommentNickname(comment) {
      // 检查是否匿名
      if (comment.is_anonymous) {
        return '匿名用户';
      }

      // 优先使用 author.nickname，然后是 nickname，最后是 author.username
      return comment.author?.nickname || comment.nickname || comment.author?.username || '未知用户';
    },
    
    // 加载帖子详情
    loadPostDetail(id) {
      uni.showLoading({
        title: '加载中'
      });
      
      this.$api.post.getDetail(id).then(res => {
        // 处理帖子数据
        const postData = res.data;
        this.post = {
          id: postData.id,
          title: postData.title,
          content: postData.content,
          images: postData.images ? postData.images.map(img => img.url) : [],
          tags: postData.topics ? postData.topics.map(topic => topic.name) : [],
          likeCount: postData.like_count || 0,
          commentCount: postData.comment_count || 0,
          favoriteCount: postData.favorite_count || 0,
          isLiked: postData.is_liked || false,
          isFavorited: postData.is_favorited || false,
          isOwner: postData.user_id === uni.getStorageSync('userInfo')?.id,
          user_id: postData.user_id,  // 添加用户ID
          avatar: postData.author ? postData.author.avatar : '',
          nickname: postData.author ? postData.author.nickname || postData.author.username : '未知用户',
          createTime: postData.created_at,
          location: postData.location
        };
        
        // 加载评论
        this.loadComments();
        
        uni.hideLoading();
      }).catch(err => {
        console.error('加载帖子详情失败:', err);
        uni.hideLoading();
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      });
    },
    
    // 加载评论
    loadComments() {
      if (this.loading || this.finished) return;

      // 确保帖子ID存在
      if (!this.post.id) {
        console.error('帖子ID不存在，无法加载评论');
        return;
      }

      this.loading = true;

      const params = {
        page: this.page,
        pageSize: 10,
        sort: this.sortType
      };

      this.$api.comment.getList(this.post.id, params).then(res => {
        const comments = res.data?.list || [];
        
        // 处理评论数据
        const formattedComments = comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          likeCount: comment.like_count || 0,
          isLiked: comment.is_liked || false,
          nickname: comment.author ? comment.author.nickname || comment.author.username : '未知用户',
          avatar: comment.author ? comment.author.avatar : '/static/images/common/default-avatar.png',
          createTime: comment.created_at,
          replyCount: comment.reply_count || 0,
          // 添加热门标识
          is_hot: Boolean(comment.is_hot),
          hot_score: comment.hot_score || 0,
          // 添加用户ID和匿名标识
          user_id: comment.user_id,
          is_anonymous: comment.is_anonymous || false,
          author: comment.author,
          replies: (comment.replies || []).map(reply => ({
            id: reply.id,
            content: reply.content,
            nickname: reply.author ? reply.author.nickname || reply.author.username : '未知用户',
            createTime: reply.created_at,
            // 添加回复用户信息
            user_id: reply.user_id,
            is_anonymous: reply.is_anonymous || false,
            author: reply.author
          }))
        }));
        
        if (this.page === 1) {
          this.commentList = formattedComments;
        } else {
          this.commentList = [...this.commentList, ...formattedComments];
        }
        
        this.loading = false;

        // 判断是否还有更多数据
        const pagination = res.data?.pagination;
        if (pagination) {
          this.finished = pagination.page * pagination.pageSize >= pagination.total;
        } else {
          // 兜底逻辑
          this.finished = !comments.length || comments.length < params.pageSize;
        }
      }).catch(err => {
        console.error('加载评论失败:', err);
        this.loading = false;
        uni.showToast({
          title: '加载评论失败',
          icon: 'none'
        });
      });
    },
    
    // 加载更多评论
    loadMoreComments() {
      // 确保帖子ID存在
      if (!this.post.id) {
        console.error('帖子ID不存在，无法加载更多评论');
        return;
      }
      this.page++;
      this.loadComments();
    },

    // 切换评论排序方式
    changeSortType(newSortType) {
      // 确保帖子ID存在
      if (!this.post.id) {
        console.error('帖子ID不存在，无法切换排序');
        return;
      }

      // 如果排序方式没有变化，直接返回
      if (this.sortType === newSortType) {
        return;
      }

      console.log('切换排序方式:', this.sortType, '->', newSortType);
      this.sortType = newSortType;
      this.page = 1;
      this.finished = false;
      this.loadComments();
    },
    
    // 格式化评论时间
    formatCommentTime(time) {
      return formatTimeAgo(time || Date.now());
    },
    
    // 加载更多回复
    loadMoreReplies(commentId) {
      const index = this.commentList.findIndex(item => item.id === commentId);
      if (index === -1) return;
      
      const comment = this.commentList[index];
      
      uni.showLoading({
        title: '加载中'
      });
      
      this.$api.comment.getReplies(commentId, { page: 1, pageSize: 20 }).then(res => {
        const replies = res.list || [];
        
        // 处理回复数据
        const formattedReplies = replies.map(reply => ({
          id: reply.id,
          content: reply.content,
          nickname: reply.author ? reply.author.nickname || reply.author.username : '未知用户',
          createTime: reply.created_at
        }));
        
        // 更新评论的回复列表
        this.commentList[index].replies = formattedReplies;
        
        uni.hideLoading();
      }).catch(err => {
        console.error('加载回复失败:', err);
        uni.hideLoading();
        uni.showToast({
          title: '加载回复失败',
          icon: 'none'
        });
      });
    },
    
    // 评论输入
    onCommentInput(e) {
      this.commentText = e.detail.value;
    },
    
    // 发送评论
    sendComment() {
      if (!this.commentText.trim()) return;
      
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.navigateTo({
          url: '/pages/auth/login/index'
        });
        return;
      }
      
      // 显示加载中
      uni.showLoading({
        title: '发送中'
      });
      
      // 如果是回复评论
      if (this.replyTo) {
        const params = {
          post_id: this.post.id,
          content: this.commentText,
          reply_to: this.replyTo.id
        };
        
        this.$api.comment.create(params).then(res => {
          uni.hideLoading();
          
          // 更新评论列表
          const index = this.commentList.findIndex(item => item.id === this.replyTo.id);
          if (index !== -1) {
            if (!this.commentList[index].replies) {
              this.commentList[index].replies = [];
            }
            
            // 添加新回复
            this.commentList[index].replies.unshift({
              id: res.id,
              content: this.commentText,
              nickname: uni.getStorageSync('userInfo')?.nickname || '我',
              createTime: new Date().toISOString()
            });
            
            // 更新回复数
            this.commentList[index].replyCount = (this.commentList[index].replyCount || 0) + 1;
          }
          
          // 清空输入框
          this.commentText = '';
          this.replyTo = null;
          
          // 显示成功提示
          uni.showToast({
            title: '回复成功',
            icon: 'success'
          });
        }).catch(err => {
          uni.hideLoading();
          console.error('回复失败:', err);
          uni.showToast({
            title: '回复失败，请重试',
            icon: 'none'
          });
        });
      } else {
        // 发表评论
        const params = {
          post_id: this.post.id,
          content: this.commentText
        };
        
        this.$api.comment.create(params).then(res => {
          uni.hideLoading();

          console.log('评论创建成功，后端返回数据:', res);
          console.log('commentData:', res.data);
          console.log('needsAudit:', res.data.needsAudit);

          // 使用后端返回的完整数据（包含匿名处理结果）
          const commentData = res.data;

          // 检查是否需要审核
          if (commentData.needsAudit) {
            // 需要审核的情况 - 不添加到评论列表，显示审核提示
            uni.showModal({
              title: '提交成功',
              content: commentData.auditMessage || '您的评论正在审核中，审核通过后将会显示',
              showCancel: false,
              confirmText: '我知道了'
            });
          } else {
            // 直接发布成功的情况 - 添加到评论列表
            const newComment = {
              id: commentData.id,
              content: commentData.content,
              user_id: commentData.user_id,
              post_id: commentData.post_id,
              reply_to: commentData.reply_to,
              root_comment_id: commentData.root_comment_id,
              reply_level: commentData.reply_level,
              reply_count: commentData.reply_count,
              mentioned_users: commentData.mentioned_users,
              like_count: commentData.like_count,
              status: commentData.status,
              is_anonymous: commentData.is_anonymous,
              created_at: commentData.createdAt,  // 修复：使用驼峰格式
              updated_at: commentData.updatedAt,  // 修复：使用驼峰格式
              author: commentData.author,
              replies: []
            };

            // 添加新评论到列表顶部
            this.commentList.unshift(newComment);

            // 更新评论数
            this.post.commentCount = (this.post.commentCount || 0) + 1;

            // 显示成功提示
            uni.showToast({
              title: '评论成功',
              icon: 'success'
            });
          }

          // 清空输入框
          this.commentText = '';
        }).catch(err => {
          uni.hideLoading();
          console.error('评论失败:', err);
          uni.showToast({
            title: '评论失败，请重试',
            icon: 'none'
          });
        });
      }
    },
    
    // 聚焦评论框
    focusComment() {
      this.commentFocus = true;
    },
    
    // 回复评论
    replyComment(comment) {
      this.replyTo = comment;
      this.commentFocus = true;
    },
    
    // 点赞评论
    handleCommentLike(comment) {
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.navigateTo({
          url: '/pages/auth/login/index'
        });
        return;
      }

      const index = this.commentList.findIndex(item => item.id === comment.id);
      if (index === -1) return;

      // 防止重复点击
      if (this.commentList[index].liking) return;
      this.commentList[index].liking = true;

      const isLiked = !this.commentList[index].isLiked;

      // 乐观更新UI
      this.commentList[index].isLiked = isLiked;
      this.commentList[index].likeCount += isLiked ? 1 : -1;

      // 调用API
      const apiCall = isLiked
        ? this.$api.like.like('comment', comment.id)
        : this.$api.like.unlike('comment', comment.id);

      apiCall.then(() => {
        // 成功后刷新评论列表以确保状态同步
        this.loadComments();
      }).catch(err => {
        console.error('点赞操作失败:', err);

        // 回滚UI更新
        this.commentList[index].isLiked = !isLiked;
        this.commentList[index].likeCount += isLiked ? -1 : 1;

        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }).finally(() => {
        this.commentList[index].liking = false;
      });
    },
    
    // 点赞帖子
    handleLike() {
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.navigateTo({
          url: '/pages/auth/login/index'
        });
        return;
      }
      
      const isLiked = !this.post.isLiked;
      
      // 乐观更新UI
      this.post.isLiked = isLiked;
      this.post.likeCount += isLiked ? 1 : -1;
      
      // 调用API
      if (isLiked) {
        this.$api.like.like('post', this.post.id).catch(err => {
          console.error('点赞失败:', err);
          // 回滚UI更新
          this.post.isLiked = !isLiked;
          this.post.likeCount -= 1;
          uni.showToast({
            title: '点赞失败',
            icon: 'none'
          });
        });
      } else {
        this.$api.like.unlike('post', this.post.id).catch(err => {
          console.error('取消点赞失败:', err);
          // 回滚UI更新
          this.post.isLiked = !isLiked;
          this.post.likeCount += 1;
          uni.showToast({
            title: '取消点赞失败',
            icon: 'none'
          });
        });
      }
    },
    
    // 收藏帖子
    handleFavorite() {
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.navigateTo({
          url: '/pages/auth/login/index'
        });
        return;
      }
      
      const isFavorited = !this.post.isFavorited;
      
      // 乐观更新UI
      this.post.isFavorited = isFavorited;
      this.post.favoriteCount += isFavorited ? 1 : -1;
      
      // 调用API
      if (isFavorited) {
        this.$api.favorite.favorite(this.post.id).catch(err => {
          console.error('收藏失败:', err);
          // 回滚UI更新
          this.post.isFavorited = !isFavorited;
          this.post.favoriteCount -= 1;
          uni.showToast({
            title: '收藏失败',
            icon: 'none'
          });
        });
      } else {
        this.$api.favorite.unfavorite(this.post.id).catch(err => {
          console.error('取消收藏失败:', err);
          // 回滚UI更新
          this.post.isFavorited = !isFavorited;
          this.post.favoriteCount += 1;
          uni.showToast({
            title: '取消收藏失败',
            icon: 'none'
          });
        });
      }
    },
    
    // 图片预览
    previewImage(index) {
      if (!this.post.images || !this.post.images.length) return;
      
      // 使用处理后的图片URL进行预览
      uni.previewImage({
        current: index,
        urls: this.processedImages
      });
    },
    
    // 分享
    handleShare() {
      uni.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    },
    
    // 更多操作
    handleMore() {
      // 获取用户信息
      const userInfo = uni.getStorageSync('userInfo') || {};
      const isOwner = this.post.isOwner || this.post.user_id === userInfo.id;
      
      if (!isOwner) {
        uni.showActionSheet({
          itemList: ['举报'],
          success: (res) => {
            if (res.tapIndex === 0) {
              // 举报功能
              uni.showToast({
                title: '举报已提交',
                icon: 'none'
              });
            }
          }
        });
      } else {
        uni.showActionSheet({
          itemList: ['编辑', '删除'],
          success: (res) => {
            if (res.tapIndex === 0) {
              // 编辑
              uni.navigateTo({
                url: `/pages/publish/publish?id=${this.post.id}`
              });
            } else if (res.tapIndex === 1) {
              // 删除
              uni.showModal({
                title: '提示',
                content: '确定要删除这条帖子吗？',
                success: (res) => {
                  if (res.confirm) {
                    uni.showLoading({
                      title: '删除中'
                    });
                    
                    this.$api.post.delete(this.post.id).then(() => {
                      uni.hideLoading();
                      uni.showToast({
                        title: '删除成功',
                        icon: 'success'
                      });
                      
                      // 返回上一页
                      setTimeout(() => {
                        uni.navigateBack();
                      }, 1500);
                    }).catch(err => {
                      uni.hideLoading();
                      console.error('删除失败:', err);
                      uni.showToast({
                        title: '删除失败，请重试',
                        icon: 'none'
                      });
                    });
                  }
                }
              });
            }
          }
        });
      }
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.post-detail {
  background-color: $bg-page;
  min-height: 100vh;
  padding-bottom: 120rpx; /* 为底部评论框预留空间 */
}

/* 帖子 */
.post {
  background-color: $bg-card;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
}

.post-header {
  @include flex(row, space-between, flex-start);
  margin-bottom: $spacing-md;
}

.post-user {
  @include flex(row, flex-start, center);
  flex: 1;
}

.post-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: $spacing-sm;
  background-color: $bg-disabled;
}

.post-info {
  flex: 1;
}

.post-name {
  font-size: $font-size-md;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: 4rpx;
}

.post-meta {
  @include flex(row, flex-start, center);
}

.post-time, .post-location {
  font-size: $font-size-xs;
  color: $text-tertiary;
}

.post-location {
  margin-left: $spacing-sm;
  position: relative;
  padding-left: $spacing-sm;
  
  &:before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 2rpx;
    height: 24rpx;
    background-color: $border-color;
  }
}

.post-more {
  padding: $spacing-sm;
}

.post-content {
  margin-bottom: $spacing-md;
}

.post-title {
  font-size: $font-size-lg;
  font-weight: bold;
  color: $text-primary;
  line-height: 1.4;
  margin-bottom: $spacing-xs;
}

.post-text {
  font-size: $font-size-md;
  color: $text-primary;
  line-height: 1.6;
  margin-bottom: $spacing-md;
  white-space: pre-wrap;
  word-break: break-all;
}

.post-images {
  margin: $spacing-sm 0 $spacing-md;
}

.post-image-container {
  display: flex;
  flex-wrap: wrap;
  
  &.single {
    .post-image {
      width: 100%;
      height: 400rpx;
      border-radius: $radius-sm;
    }
  }
  
  &.double {
    justify-content: space-between;
    
    .post-image {
      width: 49%;
      height: 300rpx;
      border-radius: $radius-sm;
    }
  }
  
  &.grid {
    justify-content: space-between;
    
    .post-image {
      width: 32%;
      height: 240rpx;
      margin-bottom: $spacing-xs;
      border-radius: $radius-sm;
    }
  }
  
  &.four {
    justify-content: space-between;
    flex-wrap: wrap;
    
    .post-image {
      width: 49%;
      height: 240rpx;
      margin-bottom: $spacing-xs;
      border-radius: $radius-sm;
    }
  }
}

.post-tags {
  @include flex(row, flex-start, center);
  flex-wrap: wrap;
  margin-top: $spacing-xs;
}

.post-tag {
  font-size: $font-size-xs;
  color: $primary-color;
  background-color: rgba($primary-color, 0.1);
  padding: 4rpx 16rpx;
  border-radius: 30rpx;
  margin-right: $spacing-sm;
  margin-bottom: $spacing-xs;
}

.post-footer {
  @include flex(row, space-around, center);
  border-top: 1rpx solid $border-light;
  padding-top: $spacing-md;
  margin-top: $spacing-md;
}

.post-action {
  @include flex(row, center, center);
}

.post-count {
  font-size: $font-size-sm;
  color: $text-tertiary;
  margin-left: $spacing-xs;
  
  &.active {
    color: $primary-color;
  }
}

/* 评论区 */
.comments {
  background-color: $bg-card;
  min-height: 200rpx;
}

.comments-header {
  @include flex(row, space-between, center);
  padding: $spacing-lg;
  border-bottom: 1rpx solid $border-light;
}

.comments-title {
  font-size: $font-size-md;
  font-weight: bold;
  color: $text-primary;
}

.comments-sort {
  @include flex(row, flex-end, center);
}

.sort-buttons {
  @include flex(row, flex-end, center);
  gap: 20rpx;
}

.sort-button {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  background-color: #f5f5f5;
  transition: all 0.3s ease;

  &.active {
    background-color: #4a90e2;

    .sort-text {
      color: #ffffff;
    }
  }

  &:active {
    transform: scale(0.95);
  }
}

.sort-text {
  font-size: 24rpx;
  color: #666666;
  transition: color 0.3s ease;
}

.comments-list {
  padding: 0 $spacing-lg;
}

.comment-item {
  @include flex(row, flex-start, flex-start);
  padding: $spacing-lg 0;
  border-bottom: 1rpx solid $border-light;
}

.comment-user {
  margin-right: $spacing-md;
}

.comment-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background-color: $bg-disabled;
}

.comment-body {
  flex: 1;
}

.comment-header {
  @include flex(row, space-between, center);
  margin-bottom: $spacing-xs;
}

.comment-user-info {
  @include flex(row, flex-start, center);
  gap: 12rpx;
}

.comment-nickname {
  font-size: $font-size-md;
  font-weight: bold;
  color: $text-primary;
}

.hot-comment-badge {
  @include flex(row, center, center);
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  border-radius: 12rpx;
  padding: 4rpx 8rpx;
  gap: 4rpx;
  box-shadow: 0 2rpx 8rpx rgba(255, 107, 107, 0.3);
}

.hot-icon {
  font-size: 20rpx;
  line-height: 1;
}

.hot-text {
  font-size: 18rpx;
  color: #ffffff;
  font-weight: bold;
  line-height: 1;
}

.comment-time {
  font-size: $font-size-xs;
  color: $text-tertiary;
}

.comment-content {
  font-size: $font-size-md;
  color: $text-primary;
  line-height: 1.5;
  margin-bottom: $spacing-sm;
}

.comment-replies {
  background-color: $bg-disabled;
  border-radius: $radius-sm;
  padding: $spacing-sm;
  margin-bottom: $spacing-sm;
}

.reply-item {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.reply-nickname {
  color: $primary-color;
  font-weight: bold;
}

.reply-more {
  font-size: $font-size-xs;
  color: $primary-color;
  text-align: center;
  margin-top: $spacing-xs;
}

.comment-actions {
  @include flex(row, flex-start, center);
}

.comment-action {
  @include flex(row, center, center);
  margin-right: $spacing-md;
}

.comment-action-text {
  font-size: $font-size-xs;
  color: $text-tertiary;
  margin-left: 4rpx;
  
  &.active {
    color: $accent-red;
  }
}

.comments-loading {
  padding: $spacing-lg;
  @include flex(row, center, center);
}

.comments-loading-text {
  font-size: $font-size-sm;
  color: $text-tertiary;
}

.comments-empty {
  padding: 60rpx 0;
  @include flex(column, center, center);
}

.comments-empty-icon {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: $spacing-md;
}

.comments-empty-text {
  font-size: $font-size-md;
  color: $text-tertiary;
}

/* 底部评论框 */
.comment-box {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  @include flex(row, space-between, center);
  padding: $spacing-sm $spacing-lg calc($spacing-sm + constant(safe-area-inset-bottom)) $spacing-lg;
  padding: $spacing-sm $spacing-lg calc($spacing-sm + env(safe-area-inset-bottom)) $spacing-lg;
  background-color: $bg-card;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.comment-input-wrap {
  flex: 1;
  margin-right: $spacing-md;
}

.comment-input {
  height: 72rpx;
  background-color: $bg-disabled;
  border-radius: 36rpx;
  padding: 0 $spacing-lg;
  font-size: $font-size-md;
}

.comment-send {
  font-size: $font-size-md;
  color: $text-tertiary;
  
  &.active {
    color: $primary-color;
    font-weight: bold;
  }
}
</style> 