<template>
  <view class="search-user-card" @click="handleClick">
    <!-- 用户头像 -->
    <view class="user-avatar">
      <image 
        :src="safeAvatar" 
        mode="aspectFill"
        class="avatar-image"
        @error="onAvatarError"
      />
      <!-- 角色徽章 -->
      <view v-if="user.role && user.role !== 'student'" class="role-badge" :class="getRoleBadgeClass(user.role)">
        <text class="role-text">{{ getRoleText(user.role) }}</text>
      </view>
    </view>
    
    <!-- 用户信息 -->
    <view class="user-info">
      <view class="user-name-row">
        <text class="user-name">{{ user.nickname || user.username }}</text>
        <!-- 认证标识 -->
        <view v-if="user.verified" class="verified-badge">
          <text class="verified-icon">✓</text>
        </view>
      </view>
      
      <!-- 用户描述 -->
      <view class="user-bio">{{ user.bio || '这个人很懒，什么都没写~' }}</view>
      
      <!-- 系部信息 -->
      <view v-if="user.department && user.department !== '未填写院系'" class="user-department">
        <text class="department-icon">🎓</text>
        <text class="department-text">{{ user.department }}</text>
      </view>
    </view>
    
    <!-- 关注按钮 -->
    <view class="user-action">
      <view
        v-if="!isCurrentUser"
        class="follow-btn"
        :class="{ 
          followed: user.isFollowed,
          loading: followLoading 
        }"
        @click.stop="handleFollow"
      >
        <text class="follow-text">
          {{ followLoading ? '...' : (user.isFollowed ? '已关注' : '关注') }}
        </text>
      </view>
    </view>
  </view>
</template>

<script>
import { ensureAbsoluteUrl } from '@/utils/url'
import api from '@/api'

import { useUserStore } from '@/store';

export default {
  name: 'SearchUserCard',
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
      if (!this.user.avatar) return this.defaultAvatar
      return ensureAbsoluteUrl(this.user.avatar)
    },
    isCurrentUser() {
      const userInfo = this.userStore.userInfo
      return userInfo && userInfo.id === this.user.id
    }
  },
  methods: {
    handleClick() {
      // 跳转到用户主页
      uni.navigateTo({
        url: `/pages/user/user-profile?id=${this.user.id}`
      })
    },
    
    onAvatarError() {
      console.log('头像加载失败，使用默认头像')
    },
    
    // 获取角色徽章样式类
    getRoleBadgeClass(role) {
      const roleClasses = {
        'teacher': 'role-teacher',
        'admin': 'role-admin'
      }
      return roleClasses[role] || ''
    },
    
    // 获取角色文本
    getRoleText(role) {
      const roleTexts = {
        'teacher': '老师',
        'admin': '管理'
      }
      return roleTexts[role] || role
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
          title: error.message || '操作失败',
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
.search-user-card {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background-color: #fff;
  border-radius: 20rpx;
  margin-bottom: 2rpx;
  border-left: 6rpx solid transparent;
  transition: all 0.3s ease;
  
  &:active {
    background-color: #f8f9fa;
    border-left-color: #5B8EF9;
  }
  
  .user-avatar {
    position: relative;
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 30rpx;
    flex-shrink: 0;
    
    .avatar-image {
      width: 100%;
      height: 100%;
      border-radius: 50%;
    }
    
    .role-badge {
      position: absolute;
      bottom: -4rpx;
      right: -4rpx;
      min-width: 40rpx;
      height: 28rpx;
      border-radius: 14rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2rpx solid #fff;
      
      .role-text {
        font-size: 20rpx;
        font-weight: 500;
        color: #fff;
        line-height: 1;
      }
      
      &.role-teacher {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      &.role-admin {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }
    }
  }
  
  .user-info {
    flex: 1;
    
    .user-name-row {
      display: flex;
      align-items: center;
      margin-bottom: 8rpx;
      
      .user-name {
        font-size: 32rpx;
        font-weight: 600;
        color: #1a1a1a;
        margin-right: 12rpx;
      }
      
      .verified-badge {
        width: 32rpx;
        height: 32rpx;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .verified-icon {
          font-size: 18rpx;
          color: #fff;
          font-weight: bold;
        }
      }
    }
    
    .user-bio {
      font-size: 26rpx;
      color: #666;
      line-height: 1.4;
      margin-bottom: 12rpx;
      max-height: 1.4em;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      line-clamp: 1;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
    }
    
    .user-department {
      display: flex;
      align-items: center;
      margin-bottom: 12rpx;
      
      .department-icon {
        font-size: 24rpx;
        margin-right: 8rpx;
      }
      
      .department-text {
        font-size: 24rpx;
        color: #5B8EF9;
        font-weight: 500;
      }
    }
  }
  
  .user-action {
    flex-shrink: 0;
    margin-left: 20rpx;
    align-self: center;
    
    .follow-btn {
      min-width: 100rpx;
      height: 56rpx;
      border-radius: 28rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #5B8EF9 0%, #4facfe 100%);
      transition: all 0.3s ease;
      
      .follow-text {
        font-size: 24rpx;
        color: #fff;
        font-weight: 500;
      }
      
      &.followed {
        background: #f5f5f5;
        
        .follow-text {
          color: #666;
        }
      }
      
      &.loading {
        opacity: 0.6;
      }
      
      &:active {
        transform: scale(0.95);
      }
    }
  }
}
</style>
