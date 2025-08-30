<template>
  <view class="comment-input-mask" v-if="visible" @tap="handleMaskClick">
    <view class="enhanced-comment-input" @tap.stop>
      <!-- 输入区域头部 -->
      <view class="input-header">
        <view class="header-content">
          <text class="input-title">
            {{ replyTo ? `回复 @${replyTo.author?.nickname || '用户'}` : '发表评论' }}
          </text>
          <view class="header-actions">
            <view class="close-btn" @tap="handleClose">
              <app-icon name="close" size="sm" color="#999"></app-icon>
            </view>
          </view>
        </view>
        
        <!-- 回复预览 -->
        <view class="reply-preview" v-if="replyTo">
          <view class="preview-content">
            <text class="preview-text">{{ replyTo.content }}</text>
          </view>
          <view class="cancel-reply" @tap="cancelReply">
            <app-icon name="close" size="xs" color="#999"></app-icon>
          </view>
        </view>
      </view>
      
      <!-- 主输入区域 -->
      <view class="main-input-area">
        <view class="input-container">
          <!-- 文本输入框 -->
          <textarea
            ref="textInput"
            class="comment-textarea"
            v-model="content"
            :placeholder="placeholder"
            :auto-height="true"
            :max-length="maxLength"
            :focus="inputFocus"
            :show-confirm-bar="false"
            @input="handleInput"
            @focus="handleFocus"
            @blur="handleBlur"
            @linechange="handleLineChange"
          ></textarea>
          
          <!-- 字数统计 -->
          <view class="char-count" :class="{ 'warning': content.length > maxLength * 0.9 }">
            <text class="count-text">{{ content.length }}/{{ maxLength }}</text>
          </view>
        </view>
        
        <!-- 功能工具栏 -->
        <view class="toolbar">
          <view class="toolbar-left">
            <!-- 表情按钮 -->
            <view class="tool-btn" @tap="toggleEmojiPanel">
              <app-icon name="smile" size="md" :color="showEmojiPanel ? '#4a90e2' : '#999'"></app-icon>
            </view>
            
            <!-- @用户按钮 -->
            <view class="tool-btn" @tap="toggleMentionPanel">
              <text class="at-symbol" :class="{ 'active': showMentionPanel }">@</text>
            </view>
            
            <!-- 图片上传按钮 -->
            <view class="tool-btn" @tap="chooseImage">
              <app-icon name="image" size="md" color="#999"></app-icon>
            </view>
            
            <!-- 匿名开关 -->
            <view class="anonymous-toggle" @tap="toggleAnonymous">
              <app-icon 
                name="incognito" 
                size="md" 
                :color="isAnonymous ? '#4a90e2' : '#999'"
              ></app-icon>
              <text class="toggle-text" :class="{ 'active': isAnonymous }">匿名</text>
            </view>
          </view>
          
          <view class="toolbar-right">
            <!-- 发送按钮 -->
            <button 
              class="send-btn"
              :class="{ 'active': canSend }"
              :disabled="!canSend || sending"
              @tap="submitComment"
            >
              <app-icon 
                v-if="sending" 
                name="loading" 
                size="sm" 
                color="#fff" 
                :spin="true"
              ></app-icon>
              <text class="send-text" v-else>{{ sendButtonText }}</text>
            </button>
          </view>
        </view>
        
        <!-- 已选择的图片 -->
        <view class="selected-images" v-if="selectedImages.length > 0">
          <view 
            class="image-item"
            v-for="(image, index) in selectedImages"
            :key="index"
          >
            <image 
              class="preview-image" 
              :src="image.path" 
              mode="aspectFill"
              @tap="previewSelectedImage(index)"
            ></image>
            <view class="remove-image" @tap="removeImage(index)">
              <app-icon name="close" size="xs" color="#fff"></app-icon>
            </view>
          </view>
          <view class="add-more-image" v-if="selectedImages.length < maxImages" @tap="chooseImage">
            <app-icon name="plus" size="md" color="#999"></app-icon>
          </view>
        </view>
      </view>
      
      <!-- 表情面板 -->
      <view class="emoji-panel" v-if="showEmojiPanel">
        <view class="panel-header">
          <text class="panel-title">表情</text>
          <view class="panel-tabs">
            <view 
              class="tab-item"
              v-for="(category, index) in emojiCategories"
              :key="index"
              :class="{ 'active': currentEmojiCategory === index }"
              @tap="switchEmojiCategory(index)"
            >
              <text class="tab-emoji">{{ category.icon }}</text>
            </view>
          </view>
        </view>
        
        <scroll-view class="emoji-grid" scroll-y>
          <view 
            class="emoji-item"
            v-for="emoji in currentEmojis"
            :key="emoji"
            @tap="insertEmoji(emoji)"
          >
            <text class="emoji-text">{{ emoji }}</text>
          </view>
        </scroll-view>
      </view>
      
      <!-- @用户面板 -->
      <view class="mention-panel" v-if="showMentionPanel">
        <view class="panel-header">
          <text class="panel-title">@用户</text>
          <view class="search-container">
            <input 
              class="search-input"
              v-model="mentionKeyword"
              placeholder="搜索用户..."
              @input="searchMentionUsers"
              :focus="showMentionPanel"
            />
          </view>
        </view>
        
        <scroll-view class="mention-list" scroll-y v-if="mentionResults.length > 0">
          <view 
            class="mention-item"
            v-for="user in mentionResults"
            :key="user.id"
            @tap="selectMentionUser(user)"
          >
            <image 
              class="mention-avatar" 
              :src="user.avatar || '/static/images/common/default-avatar.png'" 
              mode="aspectFill"
            ></image>
            <view class="mention-info">
              <text class="mention-name">{{ user.nickname || user.username }}</text>
              <text class="mention-username" v-if="user.nickname">@{{ user.username }}</text>
            </view>
          </view>
        </scroll-view>
        
        <view class="mention-empty" v-else-if="mentionKeyword && !searchingMention">
          <text class="empty-text">未找到相关用户</text>
        </view>
        
        <view class="mention-loading" v-if="searchingMention">
          <view class="loading-spinner"></view>
          <text class="loading-text">搜索中...</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue';

export default {
  name: 'EnhancedCommentInput',
  components: {
    AppIcon
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
    visible: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: '说点什么...'
    },
    maxLength: {
      type: Number,
      default: 500
    },
    maxImages: {
      type: Number,
      default: 3
    }
  },
  data() {
    return {
      content: '',
      inputFocus: false,
      sending: false,
      isAnonymous: false,
      selectedImages: [],
      
      // 表情相关
      showEmojiPanel: false,
      currentEmojiCategory: 0,
      emojiCategories: [
        {
          icon: '😀',
          name: '人物',
          emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳']
        },
        {
          icon: '❤️',
          name: '爱心',
          emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟']
        },
        {
          icon: '🎉',
          name: '庆祝',
          emojis: ['🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁', '🎆', '🎇', '✨', '🎯', '🎪', '🎨', '🎭', '🎪', '🎸', '🎵', '🎶', '🎤']
        },
        {
          icon: '🌟',
          name: '其他',
          emojis: ['⭐', '🌟', '💫', '⚡', '🔥', '💥', '💢', '💦', '💨', '💤', '💯', '🆔', '🆕', '🆓', '🆒', '🆗', '🆙', '🔝', '✅', '❌']
        }
      ],
      
      // @用户相关
      showMentionPanel: false,
      mentionKeyword: '',
      mentionResults: [],
      searchingMention: false,
      mentionTimer: null
    };
  },
  computed: {
    canSend() {
      return this.content.trim().length > 0 && this.content.length <= this.maxLength;
    },
    
    sendButtonText() {
      if (this.replyTo) return '回复';
      return '发布';
    },
    
    currentEmojis() {
      return this.emojiCategories[this.currentEmojiCategory]?.emojis || [];
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.show();
      } else {
        this.hide();
      }
    },
    
    replyTo(newVal) {
      if (newVal && newVal.author) {
        this.content = `@${newVal.author.username || newVal.author.nickname} `;
      }
    }
  },
  methods: {
    // 显示输入框
    show() {
      this.$emit('show');
      this.$nextTick(() => {
        this.inputFocus = true;
      });
    },
    
    // 隐藏输入框
    hide() {
      this.$emit('close');
      this.reset();
    },
    
    // 处理蒙版点击
    handleMaskClick(e) {
      // 只有点击蒙版才关闭，点击内容区域不关闭
      if (e.target === e.currentTarget) {
        this.hide();
      }
    },
    
    // 重置状态
    reset() {
      this.content = '';
      this.selectedImages = [];
      this.isAnonymous = false;
      this.showEmojiPanel = false;
      this.showMentionPanel = false;
      this.inputFocus = false;
    },
    
    // 聚焦输入框
    focus() {
      this.inputFocus = true;
    },
    
    // 处理输入
    handleInput(e) {
      this.content = e.detail.value;
    },
    
    // 处理焦点
    handleFocus() {
      this.inputFocus = true;
    },
    
    // 处理失焦
    handleBlur() {
      // 延迟处理，避免点击表情等按钮时失焦
      setTimeout(() => {
        this.inputFocus = false;
      }, 100);
    },
    
    // 处理行变化
    handleLineChange(e) {
      console.log('行数变化:', e.detail.lineCount);
    },
    
    // 处理关闭
    handleClose() {
      this.$emit('close');
    },
    
    // 取消回复
    cancelReply() {
      this.$emit('cancel-reply');
      this.content = '';
    },
    
    // 切换表情面板
    toggleEmojiPanel() {
      this.showEmojiPanel = !this.showEmojiPanel;
      this.showMentionPanel = false;
    },
    
    // 切换@用户面板
    toggleMentionPanel() {
      this.showMentionPanel = !this.showMentionPanel;
      this.showEmojiPanel = false;
      
      if (this.showMentionPanel) {
        this.mentionKeyword = '';
        this.mentionResults = [];
      }
    },
    
    // 切换匿名状态
    toggleAnonymous() {
      this.isAnonymous = !this.isAnonymous;
      
      uni.showToast({
        title: this.isAnonymous ? '已开启匿名' : '已关闭匿名',
        icon: 'none',
        duration: 1000
      });
    },
    
    // 切换表情分类
    switchEmojiCategory(index) {
      this.currentEmojiCategory = index;
    },
    
    // 插入表情
    insertEmoji(emoji) {
      this.content += emoji;
      this.focus();
    },
    
    // 搜索@用户
    searchMentionUsers() {
      if (this.mentionTimer) {
        clearTimeout(this.mentionTimer);
      }
      
      this.mentionTimer = setTimeout(async () => {
        if (!this.mentionKeyword.trim()) {
          this.mentionResults = [];
          return;
        }
        
        this.searchingMention = true;
        
        try {
          const response = await this.$api.user.searchUsers({
            keyword: this.mentionKeyword,
            limit: 20
          });
          
          if (response.code === 0) {
            this.mentionResults = response.data || [];
          }
        } catch (error) {
          console.error('搜索用户失败:', error);
          this.mentionResults = [];
        } finally {
          this.searchingMention = false;
        }
      }, 300);
    },
    
    // 选择@用户
    selectMentionUser(user) {
      this.content += `@${user.username} `;
      this.showMentionPanel = false;
      this.focus();
    },
    
    // 选择图片
    chooseImage() {
      const remainingCount = this.maxImages - this.selectedImages.length;
      
      uni.chooseImage({
        count: remainingCount,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const newImages = res.tempFilePaths.map(path => ({
            path,
            size: 0 // 可以获取文件大小
          }));
          
          this.selectedImages.push(...newImages);
        },
        fail: (error) => {
          console.error('选择图片失败:', error);
          uni.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
        }
      });
    },
    
    // 预览选中的图片
    previewSelectedImage(index) {
      const urls = this.selectedImages.map(img => img.path);
      uni.previewImage({
        current: index,
        urls
      });
    },
    
    // 移除图片
    removeImage(index) {
      this.selectedImages.splice(index, 1);
    },
    
    // 提交评论
    async submitComment() {
      if (!this.canSend || this.sending) return;
      
      this.sending = true;
      
      try {
        // 上传图片（如果有）
        let imageUrls = [];
        if (this.selectedImages.length > 0) {
          imageUrls = await this.uploadImages();
        }
        
        // 构建评论数据
        const commentData = {
          post_id: this.postId,
          content: this.content.trim(),
          reply_to: this.replyTo?.id || null,
          images: imageUrls,
          is_anonymous: this.isAnonymous
        };
        
        // 提取@用户
        const mentionedUsers = this.extractMentionedUsers();
        if (mentionedUsers.length > 0) {
          commentData.mentioned_users = mentionedUsers;
        }
        
        // 提交评论
        const response = await this.$api.comment.create(commentData);
        
        if (response.code === 0) {
          this.$emit('success', response.data);
          
          // 显示成功提示
          if (response.data?.needsAudit) {
            uni.showModal({
              title: '提交成功',
              content: '您的评论正在审核中，审核通过后将会显示',
              showCancel: false,
              confirmText: '我知道了'
            });
          } else {
            uni.showToast({
              title: this.replyTo ? '回复成功' : '评论成功',
              icon: 'success'
            });
          }
          
          // 关闭输入框
          this.hide();
        } else {
          throw new Error(response.msg || '提交失败');
        }
      } catch (error) {
        console.error('提交评论失败:', error);
        uni.showToast({
          title: error.message || '提交失败，请重试',
          icon: 'none'
        });
      } finally {
        this.sending = false;
      }
    },
    
    // 上传图片
    async uploadImages() {
      const uploadPromises = this.selectedImages.map(image => {
        return new Promise((resolve, reject) => {
          uni.uploadFile({
            url: `${this.$api.baseURL}/api/upload/image`,
            filePath: image.path,
            name: 'file',
            header: {
              'Authorization': `Bearer ${uni.getStorageSync('token')}`
            },
            success: (res) => {
              try {
                const data = JSON.parse(res.data);
                if (data.code === 0) {
                  resolve(data.data.url);
                } else {
                  reject(new Error(data.msg || '上传失败'));
                }
              } catch (e) {
                reject(new Error('上传响应解析失败'));
              }
            },
            fail: reject
          });
        });
      });
      
      return Promise.all(uploadPromises);
    },
    
    // 提取@用户
    extractMentionedUsers() {
      const mentionRegex = /@([a-zA-Z0-9_]+)/g;
      const mentions = [];
      let match;
      
      while ((match = mentionRegex.exec(this.content)) !== null) {
        mentions.push(match[1]);
      }
      
      return [...new Set(mentions)]; // 去重
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

// 评论输入蒙版
.comment-input-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  @include flex(column, flex-end, center);
}

.enhanced-comment-input {
  background: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  animation: slideUpInput 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes slideUpInput {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.input-header {
  background: #f8f9fa;
  border-radius: 24rpx 24rpx 0 0;
  border-bottom: 2rpx solid #f0f2f5;
}

.header-content {
  @include flex(row, space-between, center);
  padding: 24rpx 32rpx;
}

.input-title {
  font-size: 32rpx;
  color: $text-primary;
  font-weight: 600;
}

.close-btn {
  padding: 8rpx;
  border-radius: 50%;
  transition: background 0.3s ease;
  
  &:active {
    background: #e8e9eb;
  }
}

.reply-preview {
  @include flex(row, space-between, center);
  padding: 16rpx 32rpx 24rpx;
  background: rgba(74, 144, 226, 0.05);
  margin: 0 24rpx 0 24rpx;
  border-radius: 16rpx;
}

.preview-content {
  flex: 1;
  
  .preview-text {
    font-size: 26rpx;
    color: $text-secondary;
    line-height: 1.4;
    @include ellipsis(2);
  }
}

.cancel-reply {
  padding: 8rpx;
  margin-left: 16rpx;
  border-radius: 50%;
  
  &:active {
    background: rgba(0, 0, 0, 0.1);
  }
}

.main-input-area {
  flex: 1;
  padding: 32rpx;
  overflow: hidden;
}

.input-container {
  position: relative;
  margin-bottom: 24rpx;
}

.comment-textarea {
  width: 100%;
  min-height: 200rpx;
  max-height: 400rpx;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 20rpx;
  border: 2rpx solid transparent;
  font-size: 30rpx;
  color: $text-primary;
  line-height: 1.6;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #4a90e2;
    background: #f0f6ff;
  }
}

.char-count {
  position: absolute;
  bottom: 12rpx;
  right: 20rpx;
  
  .count-text {
    font-size: 22rpx;
    color: #999;
    
    .warning & {
      color: #ff6b6b;
    }
  }
}

.toolbar {
  @include flex(row, space-between, center);
  padding: 20rpx 0;
}

.toolbar-left {
  @include flex(row, flex-start, center);
  gap: 24rpx;
}

.tool-btn {
  @include flex(row, center, center);
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: #f8f9fa;
  transition: all 0.3s ease;
  
  &:active {
    background: #e8e9eb;
    transform: scale(0.95);
  }
  
  .at-symbol {
    font-size: 36rpx;
    font-weight: 600;
    color: #999;
    
    &.active {
      color: #4a90e2;
    }
  }
}

.anonymous-toggle {
  @include flex(row, center, center);
  padding: 12rpx 20rpx;
  background: #f8f9fa;
  border-radius: 20rpx;
  gap: 8rpx;
  transition: all 0.3s ease;
  
  &:active {
    background: #e8e9eb;
  }
  
  .toggle-text {
    font-size: 24rpx;
    color: #999;
    font-weight: 500;
    
    &.active {
      color: #4a90e2;
    }
  }
}

.send-btn {
  background: #e8e9eb;
  color: #999;
  border: none;
  border-radius: 24rpx;
  padding: 16rpx 32rpx;
  font-size: 28rpx;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &.active {
    background: linear-gradient(135deg, #4a90e2 0%, #667eea 100%);
    color: #ffffff;
    box-shadow: 0 4rpx 16rpx rgba(74, 144, 226, 0.3);
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  &:disabled {
    background: #f0f2f5;
    color: #ccc;
  }
}

.selected-images {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 24rpx;
}

.image-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
}

.preview-image {
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 40rpx;
  height: 40rpx;
  background: #ff6b6b;
  border-radius: 50%;
  @include flex(row, center, center);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}

.add-more-image {
  width: 160rpx;
  height: 160rpx;
  border: 2rpx dashed #ddd;
  border-radius: 16rpx;
  @include flex(row, center, center);
  background: #f8f9fa;
  
  &:active {
    background: #f0f2f5;
  }
}

// 表情面板
.emoji-panel, .mention-panel {
  border-top: 2rpx solid #f0f2f5;
  background: #ffffff;
  max-height: 400rpx;
}

.panel-header {
  @include flex(row, space-between, center);
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f2f5;
  background: #f8f9fa;
}

.panel-title {
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 600;
}

.panel-tabs {
  @include flex(row, flex-end, center);
  gap: 16rpx;
}

.tab-item {
  padding: 8rpx 12rpx;
  border-radius: 12rpx;
  transition: background 0.3s ease;
  
  &.active {
    background: rgba(74, 144, 226, 0.1);
  }
  
  .tab-emoji {
    font-size: 32rpx;
  }
}

.emoji-grid {
  padding: 24rpx;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 16rpx;
  max-height: 320rpx;
}

.emoji-item {
  @include flex(row, center, center);
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  transition: background 0.3s ease;
  
  &:active {
    background: #f0f2f5;
  }
  
  .emoji-text {
    font-size: 40rpx;
  }
}

// @用户面板
.search-container {
  flex: 1;
  margin-left: 24rpx;
}

.search-input {
  width: 100%;
  height: 64rpx;
  padding: 0 20rpx;
  background: #ffffff;
  border: 2rpx solid #e8e9eb;
  border-radius: 16rpx;
  font-size: 26rpx;
  color: $text-primary;
  
  &:focus {
    border-color: #4a90e2;
  }
}

.mention-list {
  max-height: 320rpx;
}

.mention-item {
  @include flex(row, flex-start, center);
  padding: 20rpx 32rpx;
  border-bottom: 1rpx solid #f0f2f5;
  transition: background 0.3s ease;
  
  &:active {
    background: #f8f9fa;
  }
}

.mention-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.mention-info {
  flex: 1;
}

.mention-name {
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
  display: block;
  margin-bottom: 4rpx;
}

.mention-username {
  font-size: 24rpx;
  color: $text-secondary;
}

.mention-empty, .mention-loading {
  @include flex(column, center, center);
  padding: 60rpx;
  
  .empty-text, .loading-text {
    font-size: 26rpx;
    color: $text-secondary;
  }
}

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 3rpx solid #f0f2f5;
  border-top: 3rpx solid #4a90e2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
