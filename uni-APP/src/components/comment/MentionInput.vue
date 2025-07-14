<template>
  <view class="mention-input">
    <view class="input-container">
      <textarea
        class="mention-textarea"
        v-model="inputValue"
        :placeholder="placeholder"
        :maxlength="maxLength"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @confirm="handleConfirm"
        :auto-height="autoHeight"
        :cursor-spacing="cursorSpacing"
      ></textarea>
      
      <!-- 字数统计 -->
      <view class="char-count" v-if="showCharCount">
        <text :class="{ 'over-limit': inputValue.length > maxLength }">
          {{ inputValue.length }}/{{ maxLength }}
        </text>
      </view>
    </view>
    
    <!-- @用户搜索结果 -->
    <view class="mention-suggestions" v-if="showSuggestions && suggestions.length > 0">
      <view class="suggestions-header">
        <text class="suggestions-title">选择用户</text>
      </view>
      <scroll-view class="suggestions-list" scroll-y>
        <view 
          class="suggestion-item"
          v-for="user in suggestions"
          :key="user.id"
          @tap="selectUser(user)"
        >
          <image 
            class="suggestion-avatar" 
            :src="safeAvatar(user)" 
            mode="aspectFill"
          ></image>
          <view class="suggestion-info">
            <text class="suggestion-name">{{ user.nickname || user.username }}</text>
            <text class="suggestion-username" v-if="user.nickname">@{{ user.username }}</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { ensureAbsoluteUrl } from '@/utils/url';

export default {
  name: 'MentionInput',
  props: {
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '输入评论内容...'
    },
    maxLength: {
      type: Number,
      default: 500
    },
    autoHeight: {
      type: Boolean,
      default: true
    },
    cursorSpacing: {
      type: Number,
      default: 50
    },
    showCharCount: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      inputValue: this.value,
      showSuggestions: false,
      suggestions: [],
      currentMention: '',
      mentionStartIndex: -1,
      searchTimer: null,
      isComposing: false
    };
  },
  watch: {
    value(newVal) {
      this.inputValue = newVal;
    },
    inputValue(newVal) {
      this.$emit('input', newVal);
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
    
    // 处理输入
    handleInput(e) {
      this.inputValue = e.detail.value;
      this.detectMention();
    },
    
    // 处理焦点
    handleFocus() {
      this.$emit('focus');
    },
    
    // 处理失焦
    handleBlur() {
      // 延迟隐藏建议，以便用户可以点击建议项
      setTimeout(() => {
        this.hideSuggestions();
      }, 200);
      this.$emit('blur');
    },
    
    // 处理确认
    handleConfirm() {
      this.$emit('confirm', this.inputValue);
    },
    
    // 检测@提及
    detectMention() {
      const text = this.inputValue;
      const cursorPos = text.length; // 简化处理，假设光标在末尾
      
      // 查找最近的@符号
      let atIndex = -1;
      for (let i = cursorPos - 1; i >= 0; i--) {
        if (text[i] === '@') {
          atIndex = i;
          break;
        }
        if (text[i] === ' ' || text[i] === '\n') {
          break;
        }
      }
      
      if (atIndex !== -1) {
        const mentionText = text.substring(atIndex + 1, cursorPos);
        
        // 检查@后面是否有空格或换行
        if (mentionText.indexOf(' ') === -1 && mentionText.indexOf('\n') === -1) {
          this.currentMention = mentionText;
          this.mentionStartIndex = atIndex;
          this.searchUsers(mentionText);
          return;
        }
      }
      
      this.hideSuggestions();
    },
    
    // 搜索用户
    async searchUsers(keyword) {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      
      this.searchTimer = setTimeout(async () => {
        try {
          if (keyword.length === 0) {
            this.suggestions = [];
            this.showSuggestions = false;
            return;
          }
          
          const response = await this.$api.user.searchUsers({
            keyword,
            limit: 10
          });
          
          if (response.code === 0) {
            this.suggestions = response.data;
            this.showSuggestions = this.suggestions.length > 0;
          }
        } catch (error) {
          console.error('搜索用户失败:', error);
          this.suggestions = [];
          this.showSuggestions = false;
        }
      }, 300);
    },
    
    // 选择用户
    selectUser(user) {
      const beforeMention = this.inputValue.substring(0, this.mentionStartIndex);
      const afterMention = this.inputValue.substring(this.mentionStartIndex + 1 + this.currentMention.length);
      
      this.inputValue = beforeMention + `@${user.username} ` + afterMention;
      
      this.hideSuggestions();
      
      // 触发@用户事件
      this.$emit('mention', {
        user,
        position: this.mentionStartIndex
      });
    },
    
    // 隐藏建议
    hideSuggestions() {
      this.showSuggestions = false;
      this.suggestions = [];
      this.currentMention = '';
      this.mentionStartIndex = -1;
    },
    
    // 清空输入
    clear() {
      this.inputValue = '';
      this.hideSuggestions();
    },
    
    // 获取输入值
    getValue() {
      return this.inputValue;
    },
    
    // 设置输入值
    setValue(value) {
      this.inputValue = value;
    },
    
    // 在光标位置插入文本
    insertText(text) {
      // 简化处理，在末尾插入
      this.inputValue += text;
    }
  }
};
</script>

<style scoped>

.mention-input {
  position: relative;
}

.input-container {
  position: relative;
  background-color: #ffffff;
  border-radius: 12rpx;
  border: 2rpx solid #EFF2F7;
  transition: border-color 0.3s ease;
}

.input-container:focus-within {
  border-color: #5B8EF9;
}

.mention-textarea {
  width: 100%;
  min-height: 120rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #333333;
  line-height: 1.5;
  border: none;
  outline: none;
  resize: none;
  background-color: transparent;
}

.char-count {
  position: absolute;
  bottom: 8rpx;
  right: 12rpx;
  font-size: 22rpx;
  color: #999999;
}

.char-count .over-limit {
  color: #FF6B6B;
}

.mention-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: #ffffff;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  border: 2rpx solid #EFF2F7;
  margin-top: 8rpx;
  max-height: 400rpx;
  overflow: hidden;
}

.suggestions-header {
  padding: 16rpx 20rpx;
  border-bottom: 1rpx solid #EFF2F7;
  background-color: #F8F9FA;
}

.suggestions-title {
  font-size: 24rpx;
  color: #666666;
  font-weight: 500;
}

.suggestions-list {
  max-height: 320rpx;
}

.suggestion-item {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #EFF2F7;
  transition: background-color 0.3s ease;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:active {
  background-color: #F0F2F5;
}

.suggestion-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.suggestion-info {
  flex: 1;
}

.suggestion-name {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
  display: block;
  margin-bottom: 4rpx;
}

.suggestion-username {
  font-size: 24rpx;
  color: #999999;
}
</style>
