<template>
  <view class="multi-level-comment">
    <!-- 评论内容 -->
    <view class="comment-item" :class="{ 'is-reply': level > 0 }">
      <view class="comment-header">
        <image 
          class="comment-avatar" 
          :src="safeAvatar(comment.author)" 
          mode="aspectFill"
          @tap="handleUserClick(comment.author)"
        ></image>
        <view class="comment-info">
          <view class="comment-meta">
            <text 
              class="comment-name"
              @tap="handleUserClick(comment.author)"
            >{{ safeName(comment.author) }}</text>
            <text class="comment-time">{{ formatTime(comment.created_at) }}</text>
          </view>
          <view class="comment-level" v-if="level > 0">
            <text class="level-indicator">L{{ level }}</text>
          </view>
        </view>
        <view class="comment-actions">
          <view class="action-item" @tap="handleLike">
            <app-icon 
              name="like" 
              size="sm"
              :color="comment.is_liked ? '#FF6B6B' : '#999'"
            ></app-icon>
            <text class="action-count" v-if="comment.like_count > 0">
              {{ comment.like_count }}
            </text>
          </view>
          <view class="action-item" @tap="handleReply">
            <app-icon name="comment" size="sm" color="#999"></app-icon>
            <text class="action-text">回复</text>
          </view>
        </view>
      </view>
      
      <view class="comment-content">
        <rich-text 
          class="comment-text" 
          :nodes="parseCommentContent(comment.content)"
        ></rich-text>
      </view>
      
      <!-- 回复输入框 -->
      <view class="reply-input" v-if="showReplyInput">
        <view class="input-container">
          <input 
            class="reply-textarea"
            v-model="replyContent"
            :placeholder="`回复 ${safeName(comment.author)}...`"
            @input="handleInput"
            @confirm="submitReply"
          />
          <view class="input-actions">
            <button class="cancel-btn" @tap="cancelReply">取消</button>
            <button 
              class="submit-btn" 
              :disabled="!replyContent.trim()"
              @tap="submitReply"
            >发送</button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 子回复 -->
    <view class="comment-children" v-if="(comment.children && comment.children.length > 0) || (comment.replies && comment.replies.length > 0)">
      <multi-level-comment
        v-for="child in (comment.children || comment.replies || [])"
        :key="child.id"
        :comment="child"
        :level="level + 1"
        :max-level="maxLevel"
        @like="$emit('like', $event)"
        @reply="$emit('reply', $event)"
        @userClick="$emit('userClick', $event)"
      ></multi-level-comment>
    </view>
    
    <!-- 加载更多回复 -->
    <view 
      class="load-more-replies" 
      v-if="comment.reply_count > ((comment.children?.length || 0) + (comment.replies?.length || 0)) && level < maxLevel"
      @tap="loadMoreReplies"
    >
      <text class="load-more-text">
        查看更多 {{ comment.reply_count - ((comment.children?.length || 0) + (comment.replies?.length || 0)) }} 条回复
      </text>
      <app-icon name="arrow-down" size="xs" color="#999"></app-icon>
    </view>
  </view>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue';
import { formatTimeAgo } from '@/utils/date';
import { ensureAbsoluteUrl } from '@/utils/url';

export default {
  name: 'MultiLevelComment',
  components: {
    AppIcon
  },
  props: {
    comment: {
      type: Object,
      required: true
    },
    level: {
      type: Number,
      default: 0
    },
    maxLevel: {
      type: Number,
      default: 3
    }
  },
  data() {
    return {
      showReplyInput: false,
      replyContent: '',
      mentionUsers: []
    };
  },
  methods: {
    // 安全获取头像（处理匿名状态）
    safeAvatar(user) {
      // 检查评论是否匿名（支持多种字段格式）
      const isAnonymous = this.comment.is_anonymous === true ||
                         this.comment.is_anonymous === 1 ||
                         this.comment.is_anonymous === '1' ||
                         this.comment.isAnonymous === true ||
                         this.comment.isAnonymous === 1 ||
                         this.comment.isAnonymous === '1';

      if (isAnonymous) {
        // 返回匿名用户头像
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGRkY1RjUiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iI0ZGOTk5OSIvPgo8cGF0aCBkPSJNMzAgMzJDMzAgMjYuNDc3MSAyNS41MjI5IDIyIDIwIDIyQzE0LjQ3NzEgMjIgMTAgMjYuNDc3MSAxMCAzMkgzMFoiIGZpbGw9IiNGRjk5OTkiLz4KPC9zdmc+';
      }

      if (!user || !user.avatar) {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGNUY1RjUiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzk5OTk5OSIvPgo8cGF0aCBkPSJNMzAgMzJDMzAgMjYuNDc3MSAyNS41MjI5IDIyIDIwIDIyQzE0LjQ3NzEgMjIgMTAgMjYuNDc3MSAxMCAzMkgzMFoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+';
      }

      return ensureAbsoluteUrl(user.avatar);
    },
    
    // 安全获取用户名（处理匿名状态）
    safeName(user) {
      if (!user) return '未知用户';

      // 检查评论是否匿名（支持多种字段格式）
      const isAnonymous = this.comment.is_anonymous === true ||
                         this.comment.is_anonymous === 1 ||
                         this.comment.is_anonymous === '1' ||
                         this.comment.isAnonymous === true ||
                         this.comment.isAnonymous === 1 ||
                         this.comment.isAnonymous === '1';

      if (isAnonymous) {
        return '匿名用户';
      }

      return user.nickname || user.username || '未知用户';
    },
    
    // 格式化时间
    formatTime(time) {
      return formatTimeAgo(time);
    },
    
    // 解析评论内容（支持@用户）
    parseCommentContent(content) {
      if (!content) return [];
      
      // 简单的@用户解析
      const mentionRegex = /@([a-zA-Z0-9_\u4e00-\u9fa5]+)/g;
      let lastIndex = 0;
      const nodes = [];
      
      content.replace(mentionRegex, (match, username, index) => {
        // 添加@之前的文本
        if (index > lastIndex) {
          nodes.push({
            type: 'text',
            text: content.substring(lastIndex, index)
          });
        }
        
        // 添加@用户链接
        nodes.push({
          type: 'text',
          text: match,
          attrs: {
            style: 'color: #007aff; font-weight: 500;'
          }
        });
        
        lastIndex = index + match.length;
        return match;
      });
      
      // 添加剩余文本
      if (lastIndex < content.length) {
        nodes.push({
          type: 'text',
          text: content.substring(lastIndex)
        });
      }
      
      return nodes.length > 0 ? nodes : [{ type: 'text', text: content }];
    },
    
    // 处理点赞
    handleLike() {
      this.$emit('like', this.comment);
    },
    
    // 处理回复
    handleReply() {
      this.showReplyInput = !this.showReplyInput;
      if (this.showReplyInput) {
        this.replyContent = `@${this.safeName(this.comment.author)} `;
      }
    },
    
    // 处理用户点击
    handleUserClick(user) {
      this.$emit('userClick', user);
    },
    
    // 处理输入
    handleInput(e) {
      this.replyContent = e.detail.value;
    },
    
    // 取消回复
    cancelReply() {
      this.showReplyInput = false;
      this.replyContent = '';
    },
    
    // 提交回复
    submitReply() {
      if (!this.replyContent.trim()) return;
      
      this.$emit('reply', {
        parentComment: this.comment,
        content: this.replyContent.trim(),
        level: this.level + 1
      });
      
      this.cancelReply();
    },
    
    // 加载更多回复
    loadMoreReplies() {
      this.$emit('loadMoreReplies', this.comment);
    }
  }
};
</script>

<style lang="scss" scoped>

.multi-level-comment {
  margin-bottom: 20rpx;
}

.comment-item {
  padding: 20rpx;
  background-color: #ffffff;
  border-radius: 12rpx;
}

.comment-item.is-reply {
  margin-left: 40rpx;
  background-color: #F8F9FA;
  border-left: 4rpx solid #5B8EF9;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.comment-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.comment-info {
  flex: 1;
}

.comment-meta {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 4rpx;
}

.comment-name {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
  margin-right: 16rpx;
}

.comment-time {
  font-size: 22rpx;
  color: #999999;
}

.comment-level {
  margin-top: 4rpx;
}

.level-indicator {
  font-size: 22rpx;
  color: #5B8EF9;
  background-color: rgba(91, 142, 249, 0.1);
  padding: 2rpx 8rpx;
  border-radius: 8rpx;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.action-item {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 20rpx;
  padding: 8rpx;
  border-radius: 8rpx;
  transition: background-color 0.3s ease;
}

.action-item:active {
  background-color: #F0F2F5;
}

.action-count {
  font-size: 22rpx;
  color: #999999;
  margin-left: 4rpx;
}

.action-text {
  font-size: 22rpx;
  color: #999999;
  margin-left: 4rpx;
}

.comment-content {
  margin-left: 96rpx; // 头像宽度 + 间距
}

.comment-text {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.5;
}

.reply-input {
  margin-top: 20rpx;
  margin-left: 96rpx;
}

.input-container {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 16rpx;
  border: 2rpx solid #EFF2F7;
}

.reply-textarea {
  width: 100%;
  min-height: 80rpx;
  font-size: 28rpx;
  color: #333333;
  border: none;
  outline: none;
  resize: none;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #EFF2F7;
}

.cancel-btn, .submit-btn {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  border: none;
  margin-left: 16rpx;
}

.cancel-btn {
  background-color: #F8F9FA;
  color: #666666;
}

.submit-btn {
  background-color: #5B8EF9;
  color: #ffffff;
}

.submit-btn:disabled {
  background-color: #F5F7FA;
  color: #CCCCCC;
}

.comment-children {
  margin-top: 16rpx;
}

.load-more-replies {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 16rpx;
  margin-left: 40rpx;
  padding: 16rpx;
  background-color: #F8F9FA;
  border-radius: 12rpx;
  transition: background-color 0.3s ease;
}

.load-more-replies:active {
  background-color: #F0F2F5;
}

.load-more-text {
  font-size: 24rpx;
  color: #666666;
  margin-right: 12rpx;
}
</style>
