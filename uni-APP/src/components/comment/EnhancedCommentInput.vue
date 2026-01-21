<template>
  <view class="comment-input-mask" v-if="visible" @tap="handleMaskClick" :class="{ 'visible': visible }">
    <view class="enhanced-comment-input" @tap.stop :class="{ 'slide-up': visible }">
      <!-- 顶部拖拽条/装饰 -->
      <view class="input-handle"></view>

      <!-- 输入区域头部 -->
      <view class="input-header">
        <view class="header-content">
          <text class="input-title">
            {{ replyTo ? '回复评论' : '发表评论' }}
          </text>
          <view class="header-actions">
            <view class="close-btn" @tap="handleClose">
              <app-icon name="close" size="sm" color="#999"></app-icon>
            </view>
          </view>
        </view>
        
        <!-- 回复预览 (优化样式) -->
        <view class="reply-preview" v-if="replyTo">
          <view class="reply-bar"></view>
          <view class="preview-content">
            <text class="preview-author">回复 @{{ replyTo.author?.nickname || '用户' }}:</text>
            <text class="preview-text">{{ replyTo.content }}</text>
          </view>
          <view class="cancel-reply" @tap="cancelReply">
            <app-icon name="close" size="xs" color="#999"></app-icon>
          </view>
        </view>
      </view>
      
      <!-- 主输入区域 -->
      <view class="main-input-area">
        <view class="input-wrapper">
          <!-- 文本输入框 -->
          <textarea
            ref="textInput"
            class="comment-textarea"
            v-model="content"
            :placeholder="placeholder"
            :maxlength="maxLength"
            :focus="inputFocus"
            :show-confirm-bar="false"
            :adjust-position="true"
            :cursor-spacing="20"
            :auto-height="true"
            @input="handleInput"
            @focus="handleFocus"
            @blur="handleBlur"
          ></textarea>
          
          <!-- 字数统计 -->
          <view class="char-count" :class="{ 'warning': content.length > maxLength * 0.9 }">
            <text class="count-text">{{ content.length }}/{{ maxLength }}</text>
          </view>
        </view>
        
        <!-- 图片预览区域 (移到输入框下方) -->
        <scroll-view scroll-x class="image-preview-scroll" v-if="selectedImages.length > 0">
          <view class="image-list">
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
              <view class="remove-image" @tap.stop="removeImage(index)">
                <app-icon name="close" size="xs" color="#fff"></app-icon>
              </view>
            </view>
            <view class="add-image-btn" v-if="selectedImages.length < maxImages" @tap="chooseImage">
              <app-icon name="plus" size="md" color="#999"></app-icon>
            </view>
          </view>
        </scroll-view>

        <!-- 功能工具栏 -->
        <view class="toolbar">
          <view class="toolbar-left">
            <!-- 表情按钮 -->
            <view class="tool-item" @tap="toggleEmojiPanel" :class="{ 'active': showEmojiPanel }">
              <image class="tool-icon" src="/static/images/common/emoji.png" mode="aspectFit" v-if="!showEmojiPanel"></image>
              <image class="tool-icon" src="/static/images/common/emoji-active.png" mode="aspectFit" v-else></image>
            </view>
            
            <!-- @用户按钮 -->
            <view class="tool-item" @tap="toggleMentionPanel" :class="{ 'active': showMentionPanel }">
              <text class="tool-text-icon" :class="{ 'active': showMentionPanel }">@</text>
            </view>
            
            <!-- 图片上传按钮 -->
            <view class="tool-item" @tap="chooseImage">
              <image class="tool-icon" src="/static/images/common/image.png" mode="aspectFit"></image>
            </view>
            
            <!-- 匿名开关 -->
            <view class="anonymous-switch" @tap="toggleAnonymous" :class="{ 'active': isAnonymous }">
              <view class="switch-icon-wrapper">
                 <image class="switch-icon" :src="isAnonymous ? '/static/images/common/incognito-active.png' : '/static/images/common/incognito.png'" mode="aspectFit"></image>
              </view>
              <text class="switch-text">{{ isAnonymous ? '匿名' : '公开' }}</text>
            </view>
          </view>
          
          <view class="toolbar-right">
            <!-- 发送按钮 -->
            <button 
              class="submit-btn"
              :class="{ 'can-submit': canSend }"
              :disabled="!canSend || sending"
              @tap="submitComment"
            >
              <view class="btn-content">
                 <app-icon 
                v-if="sending" 
                name="loading" 
                size="sm" 
                color="#fff" 
                :spin="true"
              ></app-icon>
              <text v-else>发布</text>
              </view>
            </button>
          </view>
        </view>
      </view>
      
      <!-- 扩展面板区域 -->
      <view class="extension-panel" v-if="showEmojiPanel || showMentionPanel">
        <!-- 表情面板 -->
        <view class="emoji-container" v-if="showEmojiPanel">
          <scroll-view scroll-y class="emoji-scroll">
            <view class="emoji-grid">
              <view 
                class="emoji-cell"
                v-for="(emoji, index) in allEmojis"
                :key="index"
                @tap="insertEmoji(emoji)"
              >
                <text class="emoji-char">{{ emoji }}</text>
              </view>
            </view>
          </scroll-view>
          <view class="emoji-categories">
            <view 
              class="category-item" 
              v-for="(cat, idx) in emojiCategories" 
              :key="idx"
              :class="{ 'active': currentEmojiCategory === idx }"
              @tap="switchEmojiCategory(idx)"
            >
              {{ cat.icon }}
            </view>
          </view>
        </view>
        
        <!-- @用户面板 -->
        <view class="mention-container" v-if="showMentionPanel">
          <view class="mention-search">
            <app-icon name="search" size="sm" color="#999"></app-icon>
            <input 
              class="mention-input"
              v-model="mentionKeyword"
              placeholder="搜索用户..."
              :focus="true"
              @input="searchMentionUsers"
            />
          </view>
          
          <scroll-view scroll-y class="mention-list-scroll">
            <view v-if="mentionResults.length > 0">
              <view 
                class="user-item"
                v-for="user in mentionResults"
                :key="user.id"
                @tap="selectMentionUser(user)"
              >
                <image 
                  class="user-avatar" 
                  :src="user.avatar || '/static/images/common/default-avatar.png'" 
                  mode="aspectFill"
                ></image>
                <view class="user-info">
                  <text class="user-nickname">{{ user.nickname || user.username }}</text>
                  <text class="user-username">@{{ user.username }}</text>
                </view>
              </view>
            </view>
            <view class="empty-state" v-else>
              <text class="empty-text">{{ searchingMention ? '搜索中...' : '未找到用户' }}</text>
            </view>
          </scroll-view>
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
      
      // 面板状态
      showEmojiPanel: false,
      showMentionPanel: false,
      
      // 表情数据
      currentEmojiCategory: 0,
      emojiCategories: [
        { icon: '😀', name: '常用', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '🥰', '😍', '🤩', '😘', '😗', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠'] },
        { icon: '❤️', name: '爱心', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️'] },
        { icon: '👋', name: '手势', emojis: ['👋', '🤚', 'Bk', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'] }
      ],
      
      // @搜索
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
    allEmojis() {
      return this.emojiCategories[this.currentEmojiCategory]?.emojis || [];
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.show();
      } else {
        this.reset();
      }
    },
    replyTo(newVal) {
      // 切换回复对象时，自动添加@前缀（可选，这里我选择不直接加在内容里，而是显示在预览区，更干净）
    }
  },
  methods: {
    show() {
      // 延时聚焦，确保UI渲染完成
      setTimeout(() => {
        this.inputFocus = true;
      }, 300);
    },
    
    handleClose() {
      this.$emit('close');
    },
    
    handleMaskClick(e) {
      if (e.target.classList.contains('comment-input-mask')) {
        this.handleClose();
      }
    },
    
    reset() {
      this.content = '';
      this.selectedImages = [];
      this.isAnonymous = false;
      this.showEmojiPanel = false;
      this.showMentionPanel = false;
      this.inputFocus = false;
      this.mentionKeyword = '';
      this.mentionResults = [];
    },
    
    // 输入框事件
    handleInput(e) {
      this.content = e.detail.value;
    },
    
    handleFocus() {
      this.inputFocus = true;
      // 键盘弹出时，隐藏面板
      if (this.showEmojiPanel || this.showMentionPanel) {
        this.showEmojiPanel = false;
        this.showMentionPanel = false;
      }
    },
    
    handleBlur() {
      // 延时失焦，避免点击表情按钮时因失焦导致面板闪烁或无法打开
      // 但如果点击的是面板内的元素，需要保持 inputFocus 为 false (收起键盘) 但面板显示
      // 实际上，点击表情按钮会触发 toggleEmojiPanel
      
      // 注意：这里不需要立即设为 false，因为点击按钮会抢占焦点
      // 或者我们可以不处理 blur，完全由按钮事件控制
      this.inputFocus = false;
    },
    
    // 功能切换
    toggleEmojiPanel() {
      if (this.showEmojiPanel) {
        // 如果表情面板已打开，则关闭面板，切回键盘
        this.showEmojiPanel = false;
        this.inputFocus = true; 
      } else {
        // 如果表情面板未打开，则打开面板
        this.showEmojiPanel = true;
        this.showMentionPanel = false;
        
        // 关键点：收起键盘。
        // 在 uni-app 中，设置 focus 为 false 即可收起键盘。
        // 但为了防止键盘收起瞬间页面跳动，可以延时一点
        this.inputFocus = false;
        uni.hideKeyboard(); // 强制收起键盘
      }
    },
    
    toggleMentionPanel() {
      if (this.showMentionPanel) {
        this.showMentionPanel = false;
        this.inputFocus = true;
      } else {
        this.showMentionPanel = true;
        this.showEmojiPanel = false;
        this.inputFocus = false;
        // 重置搜索
        this.mentionKeyword = '';
        this.mentionResults = [];
        this.searchMentionUsers(); // 加载默认列表
      }
    },
    
    toggleAnonymous() {
      this.isAnonymous = !this.isAnonymous;
    },
    
    // 图片处理
    chooseImage() {
      const remaining = this.maxImages - this.selectedImages.length;
      if (remaining <= 0) return;
      
      uni.chooseImage({
        count: remaining,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const newImages = res.tempFilePaths.map(path => ({ path }));
          this.selectedImages = [...this.selectedImages, ...newImages];
        }
      });
    },
    
    previewSelectedImage(index) {
      uni.previewImage({
        current: index,
        urls: this.selectedImages.map(img => img.path)
      });
    },
    
    removeImage(index) {
      this.selectedImages.splice(index, 1);
    },
    
    // 表情处理
    switchEmojiCategory(index) {
      this.currentEmojiCategory = index;
    },
    
    insertEmoji(emoji) {
      this.content += emoji;
    },
    
    // @用户处理
    searchMentionUsers() {
      if (this.mentionTimer) clearTimeout(this.mentionTimer);
      
      this.searchingMention = true;
      this.mentionTimer = setTimeout(async () => {
        try {
          // 这里调用API，假设API结构
          const res = await this.$api.user.searchUsers({
            keyword: this.mentionKeyword,
            limit: 20
          });
          if (res.code === 0) {
            this.mentionResults = res.data || [];
          }
        } catch (e) {
          console.error(e);
        } finally {
          this.searchingMention = false;
        }
      }, 500);
    },
    
    selectMentionUser(user) {
      this.content += ` @${user.nickname || user.username} `;
      this.showMentionPanel = false;
      this.inputFocus = true;
    },
    
    cancelReply() {
      this.$emit('cancel-reply');
    },
    
    // 提交
    async submitComment() {
      if (!this.canSend || this.sending) return;
      
      this.sending = true;
      try {
        // 1. 上传图片
        let imageUrls = [];
        if (this.selectedImages.length > 0) {
          imageUrls = await this.uploadImages();
        }
        
        // 2. 构造数据
        const payload = {
          post_id: this.postId,
          content: this.content,
          reply_to: this.replyTo?.id || null,
          images: imageUrls,
          is_anonymous: this.isAnonymous,
          // 提取@用户
          mentioned_users: this.extractMentions()
        };
        
        // 3. 调用接口
        const res = await this.$api.comment.create(payload);
        
        if (res.code === 0) {
          this.$emit('success', res.data);
          this.handleClose();
          uni.showToast({ title: '发布成功', icon: 'success' });
        } else {
          uni.showToast({ title: res.msg || '发布失败', icon: 'none' });
        }
      } catch (e) {
        console.error(e);
        uni.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        this.sending = false;
      }
    },
    
    async uploadImages() {
      // 简单的并行上传实现
      const promises = this.selectedImages.map(img => {
        return new Promise((resolve, reject) => {
          uni.uploadFile({
            url: `${this.$api.baseURL}/api/upload/image`,
            filePath: img.path,
            name: 'file',
            header: { 'Authorization': `Bearer ${uni.getStorageSync('token')}` },
            success: (uploadRes) => {
              const data = JSON.parse(uploadRes.data);
              if (data.code === 0) resolve(data.data.url);
              else reject(data.msg);
            },
            fail: reject
          });
        });
      });
      return Promise.all(promises);
    },
    
    extractMentions() {
      // 简单正则提取
      const regex = /@([^\s@]+)/g;
      const matches = this.content.match(regex);
      if (!matches) return [];
      return matches.map(m => m.substring(1)); // 去掉@
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.comment-input-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  
  &.visible {
    opacity: 1;
    visibility: visible;
  }
}

.enhanced-comment-input {
  background-color: #fff;
  border-radius: 32rpx 32rpx 0 0;
  width: 100%;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  
  &.slide-up {
    transform: translateY(0);
  }
}

.input-handle {
  width: 72rpx;
  height: 8rpx;
  background-color: #e0e0e0;
  border-radius: 4rpx;
  margin: 16rpx auto 8rpx;
}

.input-header {
  padding: 16rpx 32rpx;
  border-bottom: 1px solid #f5f5f5;
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12rpx;
    
    .input-title {
      font-size: 30rpx;
      font-weight: 600;
      color: #333;
    }
    
    .close-btn {
      padding: 8rpx;
    }
  }
  
  .reply-preview {
    display: flex;
    align-items: center;
    background-color: #f7f8fa;
    padding: 12rpx 16rpx;
    border-radius: 12rpx;
    
    .reply-bar {
      width: 6rpx;
      height: 24rpx;
      background-color: #4a90e2;
      border-radius: 3rpx;
      margin-right: 12rpx;
    }
    
    .preview-content {
      flex: 1;
      font-size: 24rpx;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      
      .preview-author {
        color: #333;
        font-weight: 500;
        margin-right: 8rpx;
      }
    }
    
    .cancel-reply {
      padding: 8rpx;
    }
  }
}

.main-input-area {
  padding: 24rpx 32rpx;
}

.input-wrapper {
  background-color: #f5f7fa;
  border-radius: 16rpx;
  padding: 20rpx;
  position: relative;
  margin-bottom: 20rpx;
  
  .comment-textarea {
    width: 100%;
    min-height: 120rpx;
    max-height: 300rpx;
    font-size: 28rpx;
    color: #333;
    line-height: 1.5;
  }
  
  .char-count {
    text-align: right;
    font-size: 22rpx;
    color: #bbb;
    margin-top: 8rpx;
    
    &.warning {
      color: #ff4d4f;
    }
  }
}

.image-preview-scroll {
  white-space: nowrap;
  margin-bottom: 20rpx;
  
  .image-list {
    display: flex;
    align-items: center;
    
    .image-item {
      position: relative;
      margin-right: 16rpx;
      width: 120rpx;
      height: 120rpx;
      
      .preview-image {
        width: 100%;
        height: 100%;
        border-radius: 12rpx;
      }
      
      .remove-image {
        position: absolute;
        top: -10rpx;
        right: -10rpx;
        width: 36rpx;
        height: 36rpx;
        background-color: rgba(0,0,0,0.5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    
    .add-image-btn {
      width: 120rpx;
      height: 120rpx;
      background-color: #f5f7fa;
      border-radius: 12rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px dashed #ddd;
    }
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 32rpx;
    
    .tool-item {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60rpx;
      height: 60rpx;
      
      &.active {
        opacity: 0.8;
      }
      
      .tool-icon {
        width: 48rpx;
        height: 48rpx;
      }
      
      .tool-text-icon {
        font-size: 36rpx;
        font-weight: 600;
        color: #666;
        line-height: 1;
        
        &.active {
          color: #4a90e2;
        }
      }
    }
    
    .anonymous-switch {
      display: flex;
      align-items: center;
      background-color: #f0f0f0;
      padding: 6rpx 16rpx;
      border-radius: 24rpx;
      transition: all 0.3s;
      height: 50rpx;
      
      &.active {
        background-color: rgba(74, 144, 226, 0.1);
      }
      
      .switch-icon-wrapper {
        width: 32rpx;
        height: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .switch-icon {
        width: 100%;
        height: 100%;
      }
      
      .switch-text {
        font-size: 24rpx;
        color: #666;
        margin-left: 8rpx;
        line-height: 1;
        position: relative;
        top: 2rpx; /* 微调垂直居中 */
      }
    }
  }
  
  .toolbar-right {
    .submit-btn {
      margin: 0;
      padding: 0;
      width: 120rpx;
      height: 60rpx;
      background-color: #e0e0e0;
      color: #999;
      font-size: 26rpx;
      border-radius: 30rpx;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .btn-content {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }
      
      &.can-submit {
        background-color: #4a90e2;
        color: #fff;
        box-shadow: 0 4rpx 12rpx rgba(74, 144, 226, 0.3);
      }
      
      &::after {
        border: none;
      }
    }
  }
}

.extension-panel {
  height: 400rpx;
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.emoji-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .emoji-scroll {
    flex: 1;
    padding: 20rpx;
    
    .emoji-grid {
      display: flex;
      flex-wrap: wrap;
      
      .emoji-cell {
        width: 12.5%;
        height: 80rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40rpx;
      }
    }
  }
  
  .emoji-categories {
    height: 80rpx;
    display: flex;
    background-color: #fff;
    border-top: 1px solid #f0f0f0;
    
    .category-item {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32rpx;
      
      &.active {
        background-color: #f0f5ff;
      }
    }
  }
}

.mention-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .mention-search {
    padding: 16rpx 24rpx;
    background-color: #fff;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    
    .mention-input {
      flex: 1;
      margin-left: 16rpx;
      font-size: 26rpx;
    }
  }
  
  .mention-list-scroll {
    flex: 1;
    
    .user-item {
      display: flex;
      align-items: center;
      padding: 20rpx 32rpx;
      background-color: #fff;
      border-bottom: 1px solid #f5f5f5;
      
      .user-avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        margin-right: 20rpx;
      }
      
      .user-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        
        .user-nickname {
          font-size: 28rpx;
          color: #333;
          font-weight: 500;
        }
        
        .user-username {
          font-size: 24rpx;
          color: #999;
          margin-top: 4rpx;
        }
      }
    }
    
    .empty-state {
      padding: 60rpx;
      text-align: center;
      color: #999;
      font-size: 26rpx;
    }
  }
}
</style>