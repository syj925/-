<template>
  <view class="user-card" @click="handleClick">
    <view class="user-avatar">
      <image 
        :src="safeAvatar" 
        mode="aspectFill"
        class="avatar-image"
        @error="onAvatarError"
      />
    </view>
    
    <view class="user-info">
      <view class="user-name">{{ user.nickname || user.username }}</view>
      <view class="user-meta">
        <text class="user-stats">{{ user.postsCount || 0 }} 帖子</text>
        <text class="user-stats">{{ user.followersCount || 0 }} 粉丝</text>
      </view>
      <view v-if="user.bio" class="user-bio">{{ user.bio }}</view>
    </view>
    
    <view class="user-action">
      <button 
        v-if="!isCurrentUser"
        class="follow-btn"
        :class="{ followed: user.isFollowed }"
        @click.stop="handleFollow"
        :loading="followLoading"
      >
        {{ user.isFollowed ? '已关注' : '关注' }}
      </button>
    </view>
  </view>
</template>

<script>
import { ensureAbsoluteUrl } from '@/utils/url'
import api from '@/api'

import { useUserStore } from '@/store';

export default {
  name: 'UserCard',
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      userStore: useUserStore(),
      followLoading: false,
      defaultAvatar: '/static/images/default-avatar.png'
    }
  },
  computed: {
    safeAvatar() {
      if (!this.user.avatar) {
        console.log('👤 UserCard: 用户没有头像，使用默认头像');
        return this.defaultAvatar;
      }
      
      const originalUrl = this.user.avatar;
      const processedUrl = ensureAbsoluteUrl(this.user.avatar);
      
      console.log('👤 UserCard头像处理:', {
        original: originalUrl,
        processed: processedUrl,
        userInfo: this.user
      });
      
      return processedUrl;
    },
    isCurrentUser() {
      const userInfo = this.userStore.userInfo
      return userInfo && userInfo.id === this.user.id
    }
  },
  methods: {
    handleClick() {
      this.$emit('click', this.user)
    },
    
    onAvatarError() {
      // 头像加载失败时的处理
      console.log('头像加载失败，使用默认头像')
    },
    
    async handleFollow() {
      if (this.followLoading) return
      
      this.followLoading = true
      
      try {
        if (this.user.isFollowed) {
          // 取消关注
          await api.follow.unfollow(this.user.id)
          this.user.isFollowed = false
          this.user.followersCount = Math.max(0, (this.user.followersCount || 0) - 1)
          
          uni.showToast({
            title: '已取消关注',
            icon: 'success'
          })
        } else {
          // 关注
          await api.follow.follow(this.user.id)
          this.user.isFollowed = true
          this.user.followersCount = (this.user.followersCount || 0) + 1
          
          uni.showToast({
            title: '关注成功',
            icon: 'success'
          })
        }
        
        // 触发关注状态变化事件
        this.$emit('follow-change', {
          userId: this.user.id,
          isFollowed: this.user.isFollowed
        })
        
      } catch (error) {
        console.error('关注操作失败:', error)
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        })
      } finally {
        this.followLoading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.user-card {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background-color: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  
  .user-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 30rpx;
    
    .avatar-image {
      width: 100%;
      height: 100%;
    }
  }
  
  .user-info {
    flex: 1;
    
    .user-name {
      font-size: 32rpx;
      font-weight: 500;
      color: #333;
      margin-bottom: 10rpx;
    }
    
    .user-meta {
      display: flex;
      gap: 30rpx;
      margin-bottom: 10rpx;
      
      .user-stats {
        font-size: 24rpx;
        color: #666;
      }
    }
    
    .user-bio {
      font-size: 26rpx;
      color: #999;
      line-height: 1.4;
      max-height: 1.4em;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      line-clamp: 1;
      -webkit-box-orient: vertical;
    }
  }
  
  .user-action {
    .follow-btn {
      background-color: #007aff;
      color: #fff;
      border: none;
      border-radius: 30rpx;
      padding: 16rpx 32rpx;
      font-size: 26rpx;
      
      &.followed {
        background-color: #f5f5f5;
        color: #666;
      }
      
      &::after {
        border: none;
      }
    }
  }
}
</style>
