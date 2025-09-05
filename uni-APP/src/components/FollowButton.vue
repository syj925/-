<template>
  <view 
    :class="['follow-button', { 
      'following': isFollowing, 
      'loading': loading,
      'disabled': disabled,
      'small': size === 'small',
      'large': size === 'large'
    }]"
    @tap="handleClick"
  >
    <view class="button-content">
      <view class="loading-spinner" v-if="loading"></view>
      <text class="button-text" v-else>{{ buttonText }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'FollowButton',
  props: {
    // 用户ID
    userId: {
      type: [String, Number],
      required: true
    },
    // 是否已关注
    isFollowing: {
      type: Boolean,
      default: false
    },
    // 按钮大小
    size: {
      type: String,
      default: 'normal', // small, normal, large
      validator: (value) => ['small', 'normal', 'large'].includes(value)
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false
    },
    // 自定义文本
    followText: {
      type: String,
      default: '关注'
    },
    followingText: {
      type: String,
      default: '已关注'
    },
    // 外部控制的加载状态
    loading: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      internalFollowing: this.isFollowing
    };
  },
  
  computed: {
    buttonText() {
      return this.internalFollowing ? this.followingText : this.followText;
    }
  },
  
  watch: {
    isFollowing(newVal) {
      this.internalFollowing = newVal;
    }
  },
  
  methods: {
    handleClick() {
      if (this.loading || this.disabled) return;
      
      console.log('🔘 FollowButton点击 - userId:', this.userId, 'currentStatus:', this.internalFollowing);
      
      // 检查登录状态
      const userInfo = uni.getStorageSync('userInfo');
      const token = uni.getStorageSync('token');
      if (!userInfo || !token) {
        this.showLoginModal();
        return;
      }
      
      // 不能关注自己
      if (userInfo.id === this.userId) {
        uni.showToast({
          title: '不能关注自己',
          icon: 'none'
        });
        return;
      }
      
      // 验证userId
      if (!this.userId || this.userId === 'undefined') {
        console.error('❌ FollowButton: userId无效', this.userId);
        return;
      }
      
      const emitData = {
        userId: this.userId,
        currentStatus: this.internalFollowing,
        action: this.internalFollowing ? 'unfollow' : 'follow'
      };
      
      console.log('🔘 FollowButton发出事件:', emitData);
      
      // 触发点击事件，让父组件处理关注逻辑
      this.$emit('follow-action', emitData);
    },
    
    showLoginModal() {
      uni.showModal({
        title: '提示',
        content: '请先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({
              url: '/pages/auth/login'
            });
          }
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.follow-button {
  @include center;
  height: 64rpx;
  padding: 0 32rpx;
  border-radius: 32rpx;
  font-size: $font-size-sm;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;

  // 默认状态（未关注）- 使用更柔和的蓝灰色
  background: linear-gradient(135deg, #8B9DC3, #A5B4D0);
  color: #fff;
  border: 2rpx solid transparent;

  &:active {
    transform: scale(0.95);
  }

  // 已关注状态
  &.following {
    background: #fff;
    color: #8B9DC3;
    border: 2rpx solid #D1DAE6;
  }

  // 加载状态
  &.loading {
    pointer-events: none;
    opacity: 0.7;
  }

  // 禁用状态
  &.disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  // 小尺寸
  &.small {
    height: 48rpx;
    padding: 0 24rpx;
    font-size: $font-size-xs;
    border-radius: 24rpx;
  }

  // 大尺寸
  &.large {
    height: 80rpx;
    padding: 0 48rpx;
    font-size: $font-size-sm;
    border-radius: 40rpx;
  }
}

.button-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-spinner {
  width: 32rpx;
  height: 32rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.button-text {
  position: relative;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
