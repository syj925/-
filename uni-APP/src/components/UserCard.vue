<template>
  <view class="user-card" @tap="handleCardClick">
    <view class="user-avatar">
      <image 
        :src="user.avatar || '/static/images/common/default-avatar.png'" 
        mode="aspectFill"
        @error="handleAvatarError"
      ></image>
      
      <!-- 在线状态指示器 -->
      <view class="online-indicator" v-if="showOnlineStatus && user.isOnline"></view>
      
      <!-- 特殊标识 -->
      <view class="user-badge" v-if="user.badge">
        <text class="badge-text">{{ user.badge }}</text>
      </view>
      
      <!-- 互相关注标识 -->
      <view class="mutual-badge" v-if="showMutualBadge && user.isMutual">
        <text class="iconfont icon-heart"></text>
      </view>
    </view>
    
    <view class="user-info" @tap.stop>
      <view class="user-name-row">
        <text class="user-nickname">{{ user.nickname || user.username }}</text>
        
        <!-- 认证标识 -->
        <view class="verified-icon" v-if="user.isVerified">
          <text class="iconfont icon-verified"></text>
        </view>
        
        <!-- 性别标识 -->
        <view class="gender-icon" v-if="showGender && user.gender">
          <text class="iconfont" :class="user.gender === 'male' ? 'icon-male' : 'icon-female'"></text>
        </view>
      </view>
      
      <!-- 用户简介 -->
      <view class="user-bio" v-if="user.bio && showBio">{{ user.bio }}</view>
      
      <!-- 学校信息 -->
      <view class="user-school" v-if="user.school && showSchool">
        <text class="school-name">{{ user.school }}</text>
        <text class="department" v-if="user.department">{{ user.department }}</text>
      </view>
      
      <!-- 用户统计 -->
      <view class="user-stats" v-if="showStats">
        <text class="stat-item" v-if="user.postCount !== undefined">
          {{ user.postCount || 0 }} 帖子
        </text>
        <text class="stat-item" v-if="user.followersCount !== undefined">
          {{ user.followersCount || 0 }} 粉丝
        </text>
        <text class="stat-item" v-if="user.followingCount !== undefined">
          {{ user.followingCount || 0 }} 关注
        </text>
      </view>
      
      <!-- 关注时间 -->
      <view class="follow-time" v-if="user.followTime && showFollowTime">
        关注时间：{{ formatTime(user.followTime) }}
      </view>
      
      <!-- 最后活跃时间 -->
      <view class="last-active" v-if="user.lastActiveTime && showLastActive">
        最后活跃：{{ formatTime(user.lastActiveTime) }}
      </view>
    </view>
    
    <!-- 操作区域 -->
    <view class="user-action" @tap.stop v-if="showAction">
      <slot name="action">
        <!-- 默认关注按钮 -->
        <FollowButton
          v-if="showFollowButton && !isCurrentUser"
          :userId="user.id"
          :isFollowing="user.isFollowing"
          :size="actionButtonSize"
          @success="handleFollowSuccess"
          @error="handleFollowError"
        />
        
        <!-- 当前用户标识 -->
        <view class="current-user-badge" v-else-if="isCurrentUser">
          <text>我</text>
        </view>
      </slot>
    </view>
  </view>
</template>

<script>
import FollowButton from './FollowButton.vue';

export default {
  name: 'UserCard',
  components: {
    FollowButton
  },
  props: {
    // 用户信息
    user: {
      type: Object,
      required: true
    },
    // 显示配置
    showBio: {
      type: Boolean,
      default: true
    },
    showSchool: {
      type: Boolean,
      default: true
    },
    showStats: {
      type: Boolean,
      default: true
    },
    showFollowTime: {
      type: Boolean,
      default: false
    },
    showLastActive: {
      type: Boolean,
      default: false
    },
    showOnlineStatus: {
      type: Boolean,
      default: false
    },
    showGender: {
      type: Boolean,
      default: false
    },
    showMutualBadge: {
      type: Boolean,
      default: false
    },
    showAction: {
      type: Boolean,
      default: true
    },
    showFollowButton: {
      type: Boolean,
      default: true
    },
    // 按钮大小
    actionButtonSize: {
      type: String,
      default: 'small'
    },
    // 是否可点击
    clickable: {
      type: Boolean,
      default: true
    }
  },
  
  computed: {
    isCurrentUser() {
      const userInfo = uni.getStorageSync('userInfo');
      return userInfo && userInfo.id === this.user.id;
    }
  },
  
  methods: {
    // 处理卡片点击
    handleCardClick() {
      if (!this.clickable) return;
      
      this.$emit('click', this.user);
      
      // 默认跳转到用户资料页
      if (this.user.id) {
        uni.navigateTo({
          url: `/pages/profile/profile?userId=${this.user.id}`
        });
      }
    },
    
    // 处理头像加载错误
    handleAvatarError() {
      this.$emit('avatar-error', this.user);
    },
    
    // 处理关注成功
    handleFollowSuccess(data) {
      // 更新用户的关注状态
      this.$set(this.user, 'isFollowing', data.isFollowing);
      
      // 更新粉丝数
      if (data.action === 'follow') {
        this.$set(this.user, 'followersCount', (this.user.followersCount || 0) + 1);
      } else {
        this.$set(this.user, 'followersCount', Math.max(0, (this.user.followersCount || 0) - 1));
      }
      
      this.$emit('follow-success', data);
    },
    
    // 处理关注失败
    handleFollowError(data) {
      this.$emit('follow-error', data);
    },
    
    // 格式化时间
    formatTime(time) {
      if (!time) return '';
      
      const date = new Date(time);
      const now = new Date();
      const diff = now - date;
      
      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;
      const month = 30 * day;
      
      if (diff < minute) {
        return '刚刚';
      } else if (diff < hour) {
        return Math.floor(diff / minute) + '分钟前';
      } else if (diff < day) {
        return Math.floor(diff / hour) + '小时前';
      } else if (diff < month) {
        return Math.floor(diff / day) + '天前';
      } else {
        return date.toLocaleDateString();
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.user-card {
  @include flex(row, flex-start, center);
  padding: 24rpx 20rpx;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  }
}

.user-avatar {
  position: relative;
  margin-right: 24rpx;

  image {
    width: 88rpx;
    height: 88rpx;
    border-radius: 50%;
    border: 2rpx solid $border-color;
  }

  .online-indicator {
    position: absolute;
    bottom: 4rpx;
    right: 4rpx;
    width: 20rpx;
    height: 20rpx;
    background-color: #52c41a;
    border: 3rpx solid #fff;
    border-radius: 50%;
  }

  .user-badge {
    position: absolute;
    top: -8rpx;
    right: -8rpx;
    background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
    border-radius: 12rpx;
    padding: 4rpx 8rpx;
    border: 2rpx solid #fff;

    .badge-text {
      font-size: 20rpx;
      color: #fff;
      font-weight: 600;
    }
  }

  .mutual-badge {
    position: absolute;
    bottom: -8rpx;
    right: -8rpx;
    width: 32rpx;
    height: 32rpx;
    @include center;
    background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
    border-radius: 50%;
    border: 2rpx solid #fff;

    .iconfont {
      font-size: 20rpx;
      color: #fff;
    }
  }
}

.user-info {
  flex: 1;
  min-width: 0;

  .user-name-row {
    @include flex(row, flex-start, center);
    margin-bottom: 8rpx;

    .user-nickname {
      font-size: $font-size-lg;
      font-weight: 600;
      color: $text-primary;
      margin-right: 12rpx;
      @include ellipsis(1);
    }

    .verified-icon {
      margin-right: 8rpx;

      .iconfont {
        font-size: 28rpx;
        color: #1890ff;
      }
    }

    .gender-icon {
      .iconfont {
        font-size: 24rpx;

        &.icon-male {
          color: #1890ff;
        }

        &.icon-female {
          color: #ff6b6b;
        }
      }
    }
  }

  .user-bio {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin-bottom: 12rpx;
    @include ellipsis(2);
    line-height: 1.4;
  }

  .user-school {
    @include flex(row, flex-start, center);
    margin-bottom: 12rpx;

    .school-name {
      font-size: $font-size-xs;
      color: $text-tertiary;
      margin-right: 16rpx;
    }

    .department {
      font-size: $font-size-xs;
      color: $text-tertiary;
    }
  }

  .user-stats {
    @include flex(row, flex-start, center);
    margin-bottom: 8rpx;

    .stat-item {
      font-size: $font-size-xs;
      color: $text-tertiary;
      margin-right: 24rpx;
    }
  }

  .follow-time, .last-active {
    font-size: $font-size-xs;
    color: $text-tertiary;
    margin-bottom: 4rpx;
  }
}

.user-action {
  margin-left: 16rpx;

  .current-user-badge {
    @include center;
    width: 48rpx;
    height: 48rpx;
    background-color: $primary-color;
    color: #fff;
    border-radius: 50%;
    font-size: $font-size-xs;
    font-weight: 600;
  }
}
</style>
