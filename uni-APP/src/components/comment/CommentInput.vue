<template>
  <view class="comment-input">
    <view class="input-header" v-if="replyTo">
      <text class="reply-label">回复 {{ replyTo.author?.nickname || replyTo.author?.username }}:</text>
      <view class="cancel-reply" @tap="cancelReply">
        <app-icon name="close" size="sm" color="#999"></app-icon>
      </view>
    </view>
    
    <view class="input-container">
      <mention-input
        ref="mentionInput"
        v-model="content"
        :placeholder="placeholder"
        :max-length="500"
        :auto-height="true"
        :show-char-count="true"
        @mention="handleMention"
        @focus="handleFocus"
        @blur="handleBlur"
      ></mention-input>
      
      <view class="input-actions">
        <view class="action-left">
          <view class="action-item" @tap="showEmojiPanel">
            <app-icon name="smile" size="md" color="#999"></app-icon>
          </view>
          <view class="action-item" @tap="showAtPanel">
            <text class="at-symbol">@</text>
          </view>
        </view>
        
        <view class="action-right">
          <button 
            class="submit-btn"
            :disabled="!canSubmit"
            @tap="submitComment"
            :loading="submitting"
          >
            {{ submitting ? '发送中...' : '发送' }}
          </button>
        </view>
      </view>
    </view>
    
    <!-- @用户面板 -->
    <view class="at-panel" v-if="showAtUserPanel">
      <view class="panel-header">
        <text class="panel-title">@用户</text>
        <view class="panel-close" @tap="hideAtPanel">
          <app-icon name="close" size="sm" color="#999"></app-icon>
        </view>
      </view>
      
      <view class="search-container">
        <input 
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索用户..."
          @input="searchUsers"
        />
      </view>
      
      <scroll-view class="user-list" scroll-y v-if="searchResults.length > 0">
        <view 
          class="user-item"
          v-for="user in searchResults"
          :key="user.id"
          @tap="selectUser(user)"
        >
          <image 
            class="user-avatar" 
            :src="safeAvatar(user)" 
            mode="aspectFill"
          ></image>
          <view class="user-info">
            <text class="user-name">{{ user.nickname || user.username }}</text>
            <text class="user-username" v-if="user.nickname">@{{ user.username }}</text>
          </view>
        </view>
      </scroll-view>
      
      <view class="empty-state" v-else-if="searchKeyword">
        <text class="empty-text">未找到相关用户</text>
      </view>
    </view>
    
    <!-- 表情面板 -->
    <view class="emoji-panel" v-if="showEmojiPicker">
      <view class="panel-header">
        <text class="panel-title">表情</text>
        <view class="panel-close" @tap="hideEmojiPanel">
          <app-icon name="close" size="sm" color="#999"></app-icon>
        </view>
      </view>
      
      <view class="emoji-grid">
        <view 
          class="emoji-item"
          v-for="emoji in commonEmojis"
          :key="emoji"
          @tap="insertEmoji(emoji)"
        >
          <text class="emoji-text">{{ emoji }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue';
import MentionInput from './MentionInput.vue';
import { ensureAbsoluteUrl } from '@/utils/url';

export default {
  name: 'CommentInput',
  components: {
    AppIcon,
    MentionInput
  },
  props: {
    postId: {
      type: String,
      required: true
    },
    replyTo: {
      type: Object,
      default: null
    },
    placeholder: {
      type: String,
      default: '写下你的评论...'
    }
  },
  data() {
    return {
      content: '',
      submitting: false,
      showAtUserPanel: false,
      showEmojiPicker: false,
      searchKeyword: '',
      searchResults: [],
      searchTimer: null,
      mentionedUsers: [],
      commonEmojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
        '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
        '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
        '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
        '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
        '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
        '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
        '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
        '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
        '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐'
      ]
    };
  },
  computed: {
    canSubmit() {
      return this.content.trim().length > 0 && !this.submitting;
    }
  },
  watch: {
    replyTo(newVal) {
      if (newVal) {
        this.content = `@${newVal.author?.username || ''} `;
        this.$nextTick(() => {
          this.$refs.mentionInput && this.$refs.mentionInput.focus();
        });
      }
    }
  },
  methods: {
    // 安全获取头像
    safeAvatar(user) {
      if (!user || !user.avatar) {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGNUY1RjUiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzk5OTk5OSIvPgo8cGF0aCBkPSJNMzAgMzJDMzAgMjYuNDc3MSAyNS41MjI5IDIyIDIwIDIyQzE0LjQ3NzEgMjIgMTAgMjYuNDc3MSAxMCAzMkgzMFoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+';
      }
      return ensureAbsoluteUrl(user.avatar);
    },
    
    // 处理@提及
    handleMention(mentionData) {
      this.mentionedUsers.push(mentionData);
    },
    
    // 处理焦点
    handleFocus() {
      this.$emit('focus');
    },
    
    // 处理失焦
    handleBlur() {
      this.$emit('blur');
    },
    
    // 显示@用户面板
    showAtPanel() {
      this.showAtUserPanel = true;
      this.searchKeyword = '';
      this.searchResults = [];
    },
    
    // 隐藏@用户面板
    hideAtPanel() {
      this.showAtUserPanel = false;
      this.searchKeyword = '';
      this.searchResults = [];
    },
    
    // 显示表情面板
    showEmojiPanel() {
      this.showEmojiPicker = true;
    },
    
    // 隐藏表情面板
    hideEmojiPanel() {
      this.showEmojiPicker = false;
    },
    
    // 搜索用户
    async searchUsers() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      
      this.searchTimer = setTimeout(async () => {
        if (!this.searchKeyword.trim()) {
          this.searchResults = [];
          return;
        }
        
        try {
          const response = await this.$api.user.searchUsers({
            keyword: this.searchKeyword,
            limit: 10
          });
          
          if (response.code === 0) {
            this.searchResults = response.data;
          }
        } catch (error) {
          console.error('搜索用户失败:', error);
          this.searchResults = [];
        }
      }, 300);
    },
    
    // 选择用户
    selectUser(user) {
      this.content += `@${user.username} `;
      this.hideAtPanel();
      
      // 记录@用户
      this.mentionedUsers.push({
        user,
        position: this.content.length - user.username.length - 2
      });
    },
    
    // 插入表情
    insertEmoji(emoji) {
      this.content += emoji;
      this.hideEmojiPanel();
    },
    
    // 取消回复
    cancelReply() {
      this.$emit('cancelReply');
      this.content = '';
    },
    
    // 提交评论
    async submitComment() {
      if (!this.canSubmit) return;

      this.submitting = true;

      try {
        // 后端会根据用户设置自动决定是否匿名，前端不需要传递匿名参数
        const commentData = {
          post_id: this.postId,
          content: this.content.trim(),
          reply_to: this.replyTo?.id || null
        };

        const response = await this.$api.comment.create(commentData);

        if (response.code === 0) {
          this.$emit('success', response.data);
          this.clear();

          // 根据审核状态显示不同提示
          if (response.data && response.data.needsAudit) {
            // 需要审核的情况
            uni.showModal({
              title: '提交成功',
              content: response.data.auditMessage || '您的评论正在审核中，审核通过后将会显示',
              showCancel: false,
              confirmText: '我知道了'
            });
          } else {
            // 直接发布成功的情况
            uni.showToast({
              title: response.message || '评论成功',
              icon: 'success'
            });
          }
        } else {
          throw new Error(response.msg || '评论失败');
        }
      } catch (error) {
        console.error('提交评论失败:', error);
        uni.showToast({
          title: error.message || '评论失败',
          icon: 'none'
        });
      } finally {
        this.submitting = false;
      }
    },
    
    // 清空输入
    clear() {
      this.content = '';
      this.mentionedUsers = [];
      this.hideAtPanel();
      this.hideEmojiPanel();
    },
    
    // 聚焦输入框
    focus() {
      this.$refs.mentionInput && this.$refs.mentionInput.focus();
    }
  }
};
</script>

<style scoped>

.comment-input {
  background-color: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #F8F9FA;
  border-bottom: 1rpx solid #EFF2F7;
}

.reply-label {
  font-size: 24rpx;
  color: #666666;
}

.cancel-reply {
  padding: 8rpx;
  border-radius: 8rpx;
  transition: background-color 0.3s ease;
}

.cancel-reply:active {
  background-color: #F0F2F5;
}

.input-container {
  padding: 20rpx;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #EFF2F7;
}

.action-left {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.action-item {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12rpx;
  margin-right: 20rpx;
  border-radius: 8rpx;
  transition: background-color 0.3s ease;
}

.action-item:active {
  background-color: #F0F2F5;
}

.at-symbol {
  font-size: 32rpx;
  font-weight: bold;
  color: #999;
}

.submit-btn {
  background-color: #5B8EF9;
  color: #ffffff;
  border: none;
  border-radius: 12rpx;
  padding: 12rpx 24rpx;
  font-size: 28rpx;
}

.submit-btn:disabled {
  background-color: #F5F7FA;
  color: #CCCCCC;
}

.at-panel, .emoji-panel {
  border-top: 1rpx solid #EFF2F7;
  background-color: #ffffff;
  max-height: 400rpx;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #EFF2F7;
  background-color: #F8F9FA;
}

.panel-title {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.panel-close {
  padding: 8rpx;
  border-radius: 8rpx;
  transition: background-color 0.3s ease;
}

.panel-close:active {
  background-color: #F0F2F5;
}

.search-container {
  padding: 20rpx;
}

.search-input {
  width: 100%;
  padding: 12rpx 16rpx;
  border: 2rpx solid #EFF2F7;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333333;
}

.user-list {
  max-height: 240rpx;
}

.user-item {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #EFF2F7;
  transition: background-color 0.3s ease;
}

.user-item:active {
  background-color: #F0F2F5;
}

.user-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
  display: block;
  margin-bottom: 4rpx;
}

.user-username {
  font-size: 24rpx;
  color: #999999;
}

.empty-state {
  padding: 60rpx;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8rpx;
  padding: 20rpx;
}

.emoji-item {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60rpx;
  height: 60rpx;
  border-radius: 8rpx;
  transition: background-color 0.3s ease;
}

.emoji-item:active {
  background-color: #F0F2F5;
}

.emoji-text {
  font-size: 32rpx;
}
</style>
