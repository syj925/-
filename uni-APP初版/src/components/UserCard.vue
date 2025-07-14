<template>
  <view class="user-card" :class="[mode, {'interactive': interactive}]" @tap="handleCardClick">
    <image class="avatar" :src="user.avatar || defaultAvatar" mode="aspectFill"></image>
    
    <view class="user-info">
      <view class="primary-info">
        <text class="username">{{ user.nickname || '匿名用户' }}</text>
        <view class="user-badges" v-if="user.badges && user.badges.length">
          <view 
            class="user-badge-item" 
            v-for="badge in user.badges" 
            :key="badge.id"
            :style="{'background-color': badge.color || '#4A90E2'}"
          >
            {{ badge.name }}
          </view>
        </view>
      </view>
      
      <view class="secondary-info" v-if="mode !== 'minimal'">
        <!-- 不同模式下展示不同信息 -->
        <text class="bio" v-if="mode === 'detailed' && user.bio">{{ user.bio }}</text>
        <text class="stats" v-else-if="mode === 'stats'">
          文章 {{ formatNumber(user.postCount || 0) }} · 关注 {{ formatNumber(user.followingCount || 0) }} · 粉丝 {{ formatNumber(user.followerCount || 0) }}
        </text>
        <text class="time" v-else-if="time">{{ formatTime(time) }}</text>
      </view>
    </view>
    
    <view class="action-area" v-if="showAction && user.id !== currentUserId" @tap.stop>
      <button 
        class="follow-btn" 
        :class="{'following': isFollowing}"
        @tap="handleFollow"
      >
        {{ isFollowing ? '已关注' : '关注' }}
      </button>
    </view>
  </view>
</template>

<script>
import { formatTime } from '@/utils/time';

export default {
  name: 'UserCard',
  props: {
    // 用户数据
    user: {
      type: Object,
      default: () => ({})
    },
    // 卡片模式: 'normal'(默认), 'minimal'(简洁), 'detailed'(详细), 'stats'(带统计)
    mode: {
      type: String,
      default: 'normal'
    },
    // 是否可交互
    interactive: {
      type: Boolean,
      default: true
    },
    // 是否显示操作区域（关注按钮等）
    showAction: {
      type: Boolean,
      default: false
    },
    // 是否已关注
    isFollowing: {
      type: Boolean,
      default: false
    },
    // 时间戳展示（发布时间等）
    time: {
      type: [String, Number, Date],
      default: null
    },
    // 当前用户ID
    currentUserId: {
      type: [String, Number],
      default: null
    }
  },
  data() {
    return {
      defaultAvatar: '/static/images/default-avatar.png'
    }
  },
  methods: {
    formatTime,
    // 格式化数字，超过1000显示为1k
    formatNumber(num) {
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + 'w';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
      }
      return num;
    },
    // 点击卡片
    handleCardClick() {
      if (!this.interactive) return;
      this.$emit('click', this.user);
    },
    // 点击关注按钮
    handleFollow() {
      this.$emit('follow', this.user, !this.isFollowing);
    }
  }
}
</script>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  padding: 20rpx;
  transition: all 0.3s ease;
  position: relative;
}

.user-card.interactive:active {
  background-color: rgba(0, 0, 0, 0.03);
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.user-card.detailed .avatar {
  width: 100rpx;
  height: 100rpx;
}

.user-card.minimal .avatar {
  width: 60rpx;
  height: 60rpx;
  margin-right: 12rpx;
}

.user-info {
  flex: 1;
  overflow: hidden;
}

.primary-info {
  display: flex;
  align-items: center;
  margin-bottom: 4rpx;
  flex-wrap: wrap;
}

.username {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-right: 10rpx;
}

.user-card.detailed .username {
  font-size: 32rpx;
}

.user-card.minimal .username {
  font-size: 26rpx;
}

.user-badges {
  display: flex;
  flex-wrap: wrap;
}

.user-badge-item {
  font-size: 10px;
  padding: 2px 10px;
  color: white;
  border-radius: 10px;
  margin: 0 2px;
  background-color: rgba(74, 144, 226, 0.45);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
  font-weight: 500;
  height: 20px;
  backdrop-filter: blur(2px);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.secondary-info {
  font-size: 24rpx;
  color: #999999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-card.detailed .secondary-info {
  white-space: normal;
  line-height: 1.5;
  margin-top: 8rpx;
}

.bio {
  color: #666666;
}

.stats {
  color: #8E9AAA;
}

.time {
  color: #B0BBC6;
}

.action-area {
  margin-left: 20rpx;
}

.follow-btn {
  padding: 6rpx 24rpx;
  background: var(--primary-gradient);
  color: #ffffff;
  font-size: 24rpx;
  border-radius: 30rpx;
  min-width: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(74, 144, 226, 0.3);
}

.follow-btn.following {
  background: rgba(74, 144, 226, 0.1);
  color: #4A90E2;
  box-shadow: none;
}

.follow-btn:active {
  transform: scale(0.95);
}
</style> 