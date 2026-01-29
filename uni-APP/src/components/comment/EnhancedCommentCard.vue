<template>
  <view class="enhanced-comment-card" :class="{ 'is-hot': isHot }">
    <!-- 热门标识 -->
    <view class="hot-badge" v-if="isHot">
      <app-icon name="fire" size="xs" color="#fff"></app-icon>
      <text class="hot-text">热门</text>
    </view>
    
    <!-- 评论主体 -->
    <view class="comment-main">
      <!-- 用户信息栏 -->
      <view class="user-section">
        <view class="user-info" @tap="handleUserClick">
          <image 
            class="user-avatar" 
            :src="safeAvatar" 
            mode="aspectFill"
          ></image>
          <view class="user-details">
            <view class="user-name-row">
              <text class="user-name">{{ safeName }}</text>
              <!-- 认证标识 -->
              <view class="verify-badge" v-if="comment.author?.isVerified">
                <app-icon name="verify" size="xs" color="#4a90e2"></app-icon>
              </view>
              <!-- 作者标识 -->
              <view class="author-badge" v-if="comment.isAuthor">
                <text class="author-text">作者</text>
              </view>
            </view>
            <view class="user-meta">
              <text class="comment-time">{{ formatTime }}</text>
              <view class="meta-divider"></view>
              <text class="floor-number">#{{ index + 1 }}</text>
              <!-- IP属地显示 -->
              <template v-if="comment.ipLocation">
                <view class="meta-divider"></view>
                <text class="ip-location">{{ comment.ipLocation }}</text>
              </template>
            </view>
          </view>
        </view>
        
        <!-- 右侧操作 -->
        <view class="comment-actions">
          <view class="more-actions" @tap="showMoreActions">
            <app-icon name="more" size="sm" color="#999"></app-icon>
          </view>
        </view>
      </view>
      
      <!-- 评论内容 -->
      <view class="content-section">
        <view class="comment-content">
          <!-- 回复引用 -->
          <view class="reply-quote" v-if="comment.replyTo">
            <text class="quote-text">回复 @{{ comment.replyTo.author?.nickname || '某用户' }}:</text>
          </view>
          
          <!-- 评论文本 -->
          <text class="comment-text">{{ renderEmoji(comment.content) }}</text>
          
          <!-- 评论图片 -->
          <view class="comment-images" v-if="comment.images && comment.images.length">
            <image 
              v-for="(image, imgIndex) in comment.images"
              :key="imgIndex"
              class="comment-image"
              :src="image"
              mode="aspectFill"
              @tap="previewImage(imgIndex)"
            ></image>
          </view>
        </view>
        
        <!-- 简洁的底部操作栏 -->
        <view class="comment-actions-bar">
          <view class="action-item" @tap="toggleLike">
            <app-icon 
              name="like" 
              size="sm"
              :color="comment.isLiked ? '#ff6b6b' : '#999'"
            ></app-icon>
            <text class="action-text" :class="{ 'liked': comment.isLiked }">
              {{ comment.likeCount > 0 ? comment.likeCount : '点赞' }}
            </text>
          </view>
          
          <view class="action-item" @tap="handleReply">
            <app-icon name="comment" size="sm" color="#999"></app-icon>
            <text class="action-text">回复</text>
          </view>
          
          <view class="action-item" @tap="shareComment">
            <text class="action-text">分享</text>
          </view>
          
          <view class="comment-time">
            <text class="time-text">{{ formatTimeAgo(comment.createTime) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 回复列表 -->
      <view class="replies-section" v-if="visibleReplies.length > 0">
        <view 
          class="reply-item" 
          v-for="(reply, index) in visibleReplies" 
          :key="reply.id || index"
        >
          <view class="reply-content">
            <text class="reply-author">{{ reply.author?.nickname || reply.author?.username || '用户' }}</text>
            <text class="reply-text">{{ reply.content }}</text>
          </view>
          <view class="reply-actions">
            <view class="reply-action" @tap="handleReplyLike(reply)">
              <app-icon 
                name="like" 
                size="xs" 
                :color="reply.isLiked ? '#ff6b6b' : '#999'"
              ></app-icon>
              <text 
                class="reply-like-count" 
                :class="{ 'active': reply.isLiked }"
                v-if="reply.likeCount > 0"
              >{{ reply.likeCount }}</text>
            </view>
            <view class="reply-action" @tap="handleReplyToReply(reply)">
              <app-icon name="comment" size="xs" color="#999"></app-icon>
              <text class="reply-action-text">回复</text>
            </view>
            <view class="reply-time">
              <text class="reply-time-text">{{ formatTimeAgo(reply.createTime || reply.created_at) }}</text>
            </view>
          </view>
        </view>
        
        <!-- 显示更多回复按钮 -->
        <view 
          class="show-more-replies" 
          v-if="hasMoreReplies"
          @tap="loadMoreReplies"
        >
          <view class="more-replies-btn" :class="{ 'loading': loadingReplies }">
            <app-icon 
              v-if="!loadingReplies" 
              name="arrow-down" 
              size="sm" 
              color="#4a90e2"
            ></app-icon>
            <view v-else class="loading-spinner"></view>
            <text class="more-replies-text">
              {{ loadingReplies ? '加载中...' : `查看更多回复 (还有${comment.replyCount - visibleReplies.length}条)` }}
            </text>
          </view>
        </view>
      </view>
      
      <!-- 评论统计栏 -->
      <view class="comment-stats" v-if="showStats">
        <view class="stat-item">
          <app-icon name="eye" size="xs" color="#999"></app-icon>
          <text class="stat-text">{{ formatCount(comment.viewCount || 0) }}</text>
        </view>
        <view class="stat-item" v-if="comment.shareCount > 0">
          <app-icon name="share" size="xs" color="#999"></app-icon>
          <text class="stat-text">{{ formatCount(comment.shareCount) }}</text>
        </view>
        <view class="time-ago">
          <text class="time-text">{{ formatTimeAgo(comment.createTime) }}</text>
        </view>
      </view>
    </view>
    
    <!-- 操作面板 -->
    <view class="action-popup-mask" v-if="showActionPanel" @tap="hideActionPanel">
      <view class="action-panel" @tap.stop>
        <view class="panel-header">
          <text class="panel-title">评论操作</text>
          <view class="close-btn" @tap="hideActionPanel">
            <app-icon name="close" size="sm" color="#999"></app-icon>
          </view>
        </view>
        <view class="action-list">
          <view class="action-item" @tap="copyComment">
            <app-icon name="copy" size="md" color="#666"></app-icon>
            <text class="action-label">复制评论</text>
          </view>
          <view class="action-item" @tap="shareComment">
            <app-icon name="share" size="md" color="#666"></app-icon>
            <text class="action-label">分享评论</text>
          </view>
          <view class="action-item danger" @tap="reportComment">
            <app-icon name="flag" size="md" color="#ff6b6b"></app-icon>
            <text class="action-label">举报</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 评论统计栏 -->
    <view class="comment-stats" v-if="showStats">
      <view class="stat-item">
        <app-icon name="eye" size="xs" color="#999"></app-icon>
        <text class="stat-text">{{ formatCount(comment.viewCount || 0) }}</text>
      </view>
      <view class="stat-item" v-if="comment.shareCount > 0">
        <app-icon name="share" size="xs" color="#999"></app-icon>
        <text class="stat-text">{{ formatCount(comment.shareCount) }}</text>
      </view>
      <view class="time-ago">
        <text class="time-text">{{ formatTimeAgo(comment.createTime) }}</text>
      </view>
    </view>
  </view>
  
  <!-- 操作面板 -->
  <view class="action-popup-mask" v-if="showActionPanel" @tap="hideActionPanel">
    <view class="action-panel" @tap.stop>
      <view class="panel-header">
        <text class="panel-title">评论操作</text>
        <view class="close-btn" @tap="hideActionPanel">
          <app-icon name="close" size="sm" color="#999"></app-icon>
        </view>
      </view>
      <view class="action-list">
        <view class="action-item" @tap="copyComment">
          <app-icon name="copy" size="md" color="#666"></app-icon>
          <text class="action-label">复制评论</text>
        </view>
        <view class="action-item" @tap="shareComment">
          <app-icon name="share" size="md" color="#666"></app-icon>
          <text class="action-label">分享评论</text>
        </view>
        <view class="action-item danger" @tap="reportComment">
          <app-icon name="flag" size="md" color="#ff6b6b"></app-icon>
          <text class="action-label">举报</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue';
import { formatTimeAgo } from '@/utils/format';
import UrlUtils from '@/utils/url';
import { EMOJI_MAP } from '@/config/emoji-map';

export default {
  name: 'EnhancedCommentCard',
  components: {
    AppIcon
  },
  props: {
    comment: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      default: 0
    },
    isHot: {
      type: Boolean,
      default: false
    },
    showReplyCount: {
      type: Boolean,
      default: true
    },
    showStats: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showActionPanel: false,
      loadingReplies: false,
      expandedReplies: false,
      maxVisibleReplies: 3  // 最多显示3条回复，超过的显示“查看更多”
    };
  },
  mounted() {
    // 使用静态EMOJI_MAP配置，无需初始化
  },
  computed: {
    // 安全获取头像
    safeAvatar() {
      // 检查匿名状态
      if (this.comment.is_anonymous) {
        return '/static/images/common/anonymous-avatar.png';
      }
      
      const avatar = this.comment.author?.avatar;
      if (!avatar) {
        return '/static/images/common/default-avatar.png';
      }
      
      return UrlUtils.ensureAbsoluteUrl(avatar);
    },
    
    // 安全获取用户名
    safeName() {
      if (this.comment.is_anonymous) {
        return '匿名用户';
      }
      
      return this.comment.author?.nickname || 
             this.comment.author?.username || 
             '未知用户';
    },
    
    // 格式化时间
    formatTime() {
      return formatTimeAgo(this.comment.createTime || this.comment.created_at);
    },
    
    // 可见的回复列表
    visibleReplies() {
      const replies = this.comment.replies || [];
      if (this.expandedReplies || replies.length <= this.maxVisibleReplies) {
        return replies;
      }
      return replies.slice(0, this.maxVisibleReplies);
    },
    
    // 是否有更多回复
    hasMoreReplies() {
      const replies = this.comment.replies || [];
      return !this.expandedReplies && replies.length > this.maxVisibleReplies;
    }
  },
  methods: {
    // 格式化数字显示
    formatCount(count) {
      if (count < 1000) return count.toString();
      if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
      return `${(count / 10000).toFixed(1)}w`;
    },
    
    // 格式化时间显示
    formatTimeAgo(time) {
      return formatTimeAgo(time);
    },
    
    // 将表情代码转换为emoji字符
    renderEmoji(content) {
      if (!content) return '';
      let result = content;
      for (const [code, emoji] of Object.entries(EMOJI_MAP)) {
        result = result.split(code).join(emoji);
      }
      return result;
    },
    
    // 解析评论内容（保留备用）
    parseContent(content) {
      if (!content) return [];
      
      // 合并正则：匹配表情code [xxx] 和 @用户
      const combinedRegex = /(\[[^\]]+\])|(@[a-zA-Z0-9_\u4e00-\u9fa5]+)/g;
      
      let lastIndex = 0;
      const nodes = [];
      let match;
      
      while ((match = combinedRegex.exec(content)) !== null) {
        // 添加匹配之前的文本
        if (match.index > lastIndex) {
          nodes.push({
            type: 'text',
            text: content.substring(lastIndex, match.index)
          });
        }
        
        const matchedText = match[0];
        
        if (matchedText.startsWith('[') && matchedText.endsWith(']')) {
          // 处理表情code - 从配置文件查找emoji字符
          const emojiChar = EMOJI_MAP[matchedText];
          
          if (emojiChar) {
            // 找到表情，渲染为emoji字符
            nodes.push({
              type: 'text',
              text: emojiChar,
              attrs: {
                style: 'font-size: 1.3em; line-height: 1;'
              }
            });
          } else {
            // 未找到表情，保留原文本
            nodes.push({
              type: 'text',
              text: matchedText
            });
          }
        } else if (matchedText.startsWith('@')) {
          // 处理@用户
          nodes.push({
            type: 'text',
            text: matchedText,
            attrs: {
              style: 'color: #4a90e2; font-weight: 600; background: rgba(74, 144, 226, 0.1); padding: 2rpx 8rpx; border-radius: 8rpx;'
            }
          });
        }
        
        lastIndex = match.index + matchedText.length;
      }
      
      // 添加剩余文本
      if (lastIndex < content.length) {
        nodes.push({
          type: 'text',
          text: content.substring(lastIndex)
        });
      }
      
      return nodes.length > 0 ? nodes : [{ type: 'text', text: content }];
    },
    
    // 切换点赞状态
    toggleLike() {
      this.$emit('like', this.comment);
    },
    
    // 处理回复
    handleReply() {
      this.$emit('reply', this.comment);
    },
    
    // 分享评论
    shareComment() {
      uni.showActionSheet({
        itemList: ['复制链接', '分享到微信', '分享到朋友圈'],
        success: (res) => {
          switch(res.tapIndex) {
            case 0:
              this.copyComment();
              break;
            case 1:
              this.shareToWeChat();
              break;
            case 2:
              this.shareToMoments();
              break;
          }
        }
      });
    },
    
    // 处理用户点击
    handleUserClick() {
      if (!this.comment.is_anonymous && this.comment.author?.id) {
        this.$emit('user-click', this.comment.author);
      } else {
        uni.showToast({
          title: '匿名用户无法查看',
          icon: 'none'
        });
      }
    },
    
    // 加载更多回复
    async loadMoreReplies() {
      this.loadingReplies = true;
      
      try {
        // 如果已经有完整的回复数据，直接展开
        if (this.comment.replies && this.comment.replies.length >= this.comment.replyCount) {
          this.expandedReplies = true;
        } else {
          // 否则从服务器获取完整的回复数据
          this.$emit('load-more-replies', this.comment);
        }
      } catch (error) {
        console.error('加载更多回复失败:', error);
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      } finally {
        this.loadingReplies = false;
      }
    },
    
    // 处理回复点赞
    handleReplyLike(reply) {
      this.$emit('reply-like', reply);
    },
    
    // 回复的回复
    handleReplyToReply(reply) {
      this.$emit('reply-to-reply', reply);
    },
    
    // 显示更多操作
    showMoreActions() {
      this.showActionPanel = true;
    },
    
    // 隐藏操作面板
    hideActionPanel() {
      this.showActionPanel = false;
    },
    
    // 复制评论
    copyComment() {
      uni.setClipboardData({
        data: this.comment.content,
        success: () => {
          uni.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          });
        }
      });
      this.hideActionPanel();
    },
    
    // 分享评论
    shareComment() {
      // 实现分享逻辑
      uni.showShareMenu({
        withShareTicket: true
      });
      this.hideActionPanel();
    },
    
    // 举报评论
    reportComment() {
      this.hideActionPanel();
      this.$emit('report', this.comment);
    },
    
    // 预览图片
    previewImage(index) {
      if (!this.comment.images || !this.comment.images.length) return;
      
      uni.previewImage({
        current: index,
        urls: this.comment.images
      });
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.enhanced-comment-card {
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover, &:active {
    transform: translateY(-2rpx);
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  }
  
  &.is-hot {
    border-color: rgba(255, 140, 0, 0.3);
    background: linear-gradient(135deg, #fff8f0 0%, #ffffff 100%);
    
    .hot-badge {
      position: absolute;
      top: 16rpx;
      right: 16rpx;
      background: linear-gradient(135deg, #ff8c00 0%, #ff6b47 100%);
      border-radius: 20rpx;
      padding: 6rpx 12rpx;
      @include flex(row, center, center);
      gap: 4rpx;
      box-shadow: 0 4rpx 12rpx rgba(255, 140, 0, 0.3);
      z-index: 10;
      
      .hot-text {
        font-size: 20rpx;
        color: #ffffff;
        font-weight: 600;
      }
    }
  }
}

.comment-main {
  padding: 24rpx;
}

.user-section {
  @include flex(row, space-between, flex-start);
  margin-bottom: 20rpx;
}

.user-info {
  @include flex(row, flex-start, center);
  flex: 1;
  cursor: pointer;
  
  &:active {
    opacity: 0.7;
  }
}

.user-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  border: 3rpx solid #f0f2f5;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.95);
  }
}

.user-details {
  flex: 1;
}

.user-name-row {
  @include flex(row, flex-start, center);
  margin-bottom: 8rpx;
  gap: 8rpx;
}

.user-name {
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 600;
  max-width: 300rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.verify-badge {
  background: rgba(74, 144, 226, 0.1);
  border-radius: 12rpx;
  padding: 2rpx 6rpx;
}

.author-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10rpx;
  padding: 2rpx 8rpx;
  
  .author-text {
    font-size: 18rpx;
    color: #ffffff;
    font-weight: 600;
  }
}

.user-meta {
  @include flex(row, flex-start, center);
  gap: 12rpx;
  
  .comment-time {
    font-size: 24rpx;
    color: $text-tertiary;
  }
  
  .meta-divider {
    width: 2rpx;
    height: 20rpx;
    background: #e8e9eb;
  }
  
  .floor-number {
    font-size: 22rpx;
    color: #4a90e2;
    font-weight: 500;
  }
  
  .ip-location {
    font-size: 22rpx;
    color: $text-tertiary;
  }
}

.comment-actions {
  @include flex(row, flex-end, center);
  gap: 20rpx;
}

.action-btn {
  @include flex(row, center, center);
  padding: 12rpx;
  border-radius: 20rpx;
  gap: 6rpx;
  transition: all 0.3s ease;
  
  &:active {
    background: #f0f2f5;
    transform: scale(0.95);
  }
  
  .action-count, .action-text {
    font-size: 24rpx;
    color: #999;
    font-weight: 500;
    transition: color 0.3s ease;
    
    &.liked {
      color: #ff6b6b;
      font-weight: 600;
    }
  }
}

.more-actions {
  padding: 12rpx;
  border-radius: 50%;
  transition: all 0.3s ease;
  
  &:active {
    background: #f0f2f5;
    transform: scale(0.9);
  }
}

.content-section {
  margin-bottom: 16rpx;
}

.reply-quote {
  margin-bottom: 12rpx;
  
  .quote-text {
    font-size: 26rpx;
    color: #4a90e2;
    font-weight: 500;
  }
}

.comment-content {
  line-height: 1.6;
}

.comment-text {
  font-size: 30rpx;
  color: $text-primary;
  line-height: 1.7;
  word-break: break-all;
}

// 简洁的评论操作栏
.comment-actions-bar {
  @include flex(row, space-between, center);
  padding: 16rpx 0;
  margin-top: 12rpx;
}

.action-item {
  @include flex(row, center, center);
  gap: 8rpx;
  padding: 8rpx 12rpx;
  border-radius: 8rpx;
  transition: background 0.2s ease;
  
  &:active {
    background: rgba(0, 0, 0, 0.05);
  }
  
  .action-text {
    font-size: 26rpx;
    color: #999;
    
    &.liked {
      color: #ff6b6b;
    }
  }
}

.comment-time {
  flex: 1;
  text-align: right;
  
  .time-text {
    font-size: 24rpx;
    color: #ccc;
  }
}

.comment-images {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8rpx;
}

.comment-image {
  width: 100%;
  height: 200rpx;
  border-radius: 12rpx;
  object-fit: cover;
}

// 回复列表区域
.replies-section {
  background: #f8f9fa;
  border-radius: 16rpx;
  padding: 16rpx;
  margin-top: 16rpx;
  border: 2rpx solid #f0f2f5;
}

.reply-item {
  background: #ffffff;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-bottom: 12rpx;
  border: 1rpx solid #e8e9eb;
  transition: all 0.3s ease;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:active {
    background: #fafbfc;
  }
}

.reply-content {
  margin-bottom: 12rpx;
  
  .reply-author {
    font-size: 26rpx;
    color: #4a90e2;
    font-weight: 600;
    margin-right: 8rpx;
  }
  
  .reply-text {
    font-size: 26rpx;
    color: $text-primary;
    line-height: 1.5;
    word-break: break-word;
  }
}

.reply-actions {
  @include flex(row, space-between, center);
  
  .reply-action {
    @include flex(row, center, center);
    gap: 4rpx;
    padding: 6rpx 12rpx;
    border-radius: 20rpx;
    transition: background 0.3s ease;
    
    &:active {
      background: #f0f2f5;
    }
    
    .reply-like-count {
      font-size: 22rpx;
      color: #999;
      font-weight: 500;
      
      &.active {
        color: #ff6b6b;
      }
    }
    
    .reply-action-text {
      font-size: 22rpx;
      color: #999;
    }
  }
  
  .reply-time {
    .reply-time-text {
      font-size: 20rpx;
      color: #999;
    }
  }
}

.show-more-replies {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #e8e9eb;
  
  .more-replies-btn {
    @include flex(row, center, center);
    gap: 8rpx;
    padding: 12rpx 16rpx;
    background: #ffffff;
    border-radius: 20rpx;
    border: 2rpx solid #4a90e2;
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.98);
      background: #f8f9fa;
    }
    
    &.loading {
      pointer-events: none;
      opacity: 0.7;
    }
    
    .more-replies-text {
      font-size: 26rpx;
      color: #4a90e2;
      font-weight: 600;
    }
    
    .loading-spinner {
      width: 28rpx;
      height: 28rpx;
      border: 4rpx solid #e8e9eb;
      border-top: 4rpx solid #4a90e2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.comment-stats {
  @include flex(row, space-between, center);
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f2f5;
  margin-top: 16rpx;
}

.stat-item {
  @include flex(row, center, center);
  gap: 6rpx;
  
  .stat-text {
    font-size: 22rpx;
    color: #999;
  }
}

.time-ago {
  .time-text {
    font-size: 22rpx;
    color: #999;
  }
}

// 操作面板样式
.action-panel {
  background: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx;
}

.panel-header {
  @include flex(row, space-between, center);
  margin-bottom: 32rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #f0f2f5;
}

// 操作面板弹窗
.action-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  @include flex(column, flex-end, center);
  
  .action-panel {
    background: #ffffff;
    border-radius: 32rpx 32rpx 0 0;
    width: 100%;
    max-height: 80vh;
    animation: slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    padding: 32rpx 32rpx calc(32rpx + constant(safe-area-inset-bottom));
    padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.panel-title {
  font-size: 32rpx;
  color: $text-primary;
  font-weight: 600;
}

.close-btn {
  padding: 8rpx;
  border-radius: 50%;
  
  &:active {
    background: #f0f2f5;
  }
}

.action-list {
  display: grid;
  gap: 4rpx;
}

.action-item {
  @include flex(row, flex-start, center);
  padding: 20rpx 16rpx;
  border-radius: 16rpx;
  gap: 16rpx;
  transition: background 0.3s ease;
  
  &:active {
    background: #f0f2f5;
  }
  
  &.danger {
    .action-label {
      color: #ff6b6b;
    }
  }
  
  .action-label {
    font-size: 30rpx;
    color: $text-primary;
    font-weight: 500;
  }
}
</style>
