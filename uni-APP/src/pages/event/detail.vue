<template>
  <view class="event-detail-container">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">
        <app-icon name="arrow-left" size="20" color="#333"></app-icon>
      </view>
      <text class="nav-title">活动详情</text>
      <view class="nav-action" @tap="handleShare">
        <app-icon name="share" size="20" color="#333"></app-icon>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 活动内容 -->
    <view v-else-if="event" class="event-content">
      <!-- 活动封面 -->
      <view class="event-cover">
        <image
          :src="event.cover_image || '/static/images/event-default.png'"
          mode="aspectFill"
          class="cover-image"
        ></image>
        <view class="cover-overlay">
          <view class="event-status" :class="getStatusClass(event.status)">
            {{ getStatusText(event.status) }}
          </view>
        </view>
      </view>

      <!-- 活动信息卡片 -->
      <view class="event-card">
        <!-- 活动标题 -->
        <view class="event-title">{{ event.title }}</view>

        <!-- 活动基本信息 -->
        <view class="event-info">
          <view class="info-item">
            <app-icon name="time" size="16" color="#666"></app-icon>
            <text class="info-text">{{ formatEventTime }}</text>
          </view>
          <view class="info-item">
            <app-icon name="location" size="16" color="#666"></app-icon>
            <text class="info-text">{{ event.location }}</text>
          </view>
          <view class="info-item">
            <app-icon name="users" size="16" color="#666"></app-icon>
            <text class="info-text">{{ event.current_participants }}/{{ event.max_participants }}人</text>
          </view>
        </view>

        <!-- 组织者信息 -->
        <view class="organizer-info" @tap="viewOrganizerProfile">
          <image
            :src="event.organizer?.avatar || '/static/images/default-avatar.png'"
            mode="aspectFill"
            class="organizer-avatar"
          ></image>
          <view class="organizer-details">
            <text class="organizer-name">{{ event.organizer?.nickname || '未知组织者' }}</text>
            <text class="organizer-label">活动组织者</text>
          </view>
          <app-icon name="arrow-right" size="16" color="#ccc"></app-icon>
        </view>
      </view>

      <!-- 活动描述 -->
      <view class="event-card">
        <view class="card-title">活动介绍</view>
        <view class="event-description">
          <text class="description-text">{{ event.description || '暂无活动介绍' }}</text>
        </view>
      </view>

      <!-- 统计信息 -->
      <view class="event-card">
        <view class="card-title">活动数据</view>
        <view class="event-stats">
          <view class="stat-item">
            <text class="stat-number">{{ event.view_count || 0 }}</text>
            <text class="stat-label">浏览量</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ event.current_participants || 0 }}</text>
            <text class="stat-label">已报名</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ getRemainingDays }}</text>
            <text class="stat-label">剩余天数</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-container">
      <app-icon name="alert-circle" size="48" color="#ccc"></app-icon>
      <text class="error-text">活动不存在或已删除</text>
      <view class="error-action" @tap="goBack">
        <text class="action-text">返回上一页</text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view v-if="event" class="bottom-actions">
      <view class="action-left">
        <view class="action-item" @tap="handleLike">
          <app-icon :name="isLiked ? 'heart-fill' : 'heart'" size="20" :color="isLiked ? '#ff4757' : '#666'"></app-icon>
          <text class="action-text">{{ isLiked ? '已收藏' : '收藏' }}</text>
        </view>
      </view>
      <view class="action-right">
        <button
          class="register-btn"
          :class="getRegisterBtnClass()"
          :disabled="!canRegister"
          @tap="handleRegister"
        >
          {{ getRegisterBtnText() }}
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import { formatTime } from '@/utils/date'
import eventApi from '@/api/modules/event'
import AppIcon from '@/components/common/AppIcon.vue'

export default {
  name: 'EventDetail',
  components: {
    AppIcon
  },
  data() {
    return {
      eventId: '',
      event: null,
      loading: true,
      isLiked: false,
      isRegistered: false,
      registrationStatus: null
    }
  },
  computed: {
    formatEventTime() {
      if (!this.event) return ''
      const startTime = formatTime(this.event.start_time, 'YYYY-MM-DD HH:mm')
      const endTime = formatTime(this.event.end_time, 'HH:mm')
      return `${startTime} - ${endTime}`
    },
    getRemainingDays() {
      if (!this.event) return 0
      const now = new Date()
      const startTime = new Date(this.event.start_time)
      const diffTime = startTime - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? diffDays : 0
    },
    canRegister() {
      if (!this.event) return false
      if (this.event.status !== 1) return false

      // 如果已报名，可以取消报名
      if (this.isRegistered) return true

      // 如果未报名，检查是否可以报名
      if (this.event.current_participants >= this.event.max_participants) return false

      const now = new Date()
      const deadline = new Date(this.event.registration_deadline)
      return now < deadline
    }
  },
  onLoad(options) {
    if (options.id) {
      this.eventId = options.id
      this.loadEventDetail()
    } else {
      this.showError('活动ID参数错误')
    }
  },
  methods: {
    async loadEventDetail() {
      try {
        this.loading = true
        console.log('开始加载活动详情，ID:', this.eventId)

        const result = await eventApi.getDetail(this.eventId)
        console.log('活动详情API响应:', result)

        if (result.code === 0 && result.data) {
          this.event = result.data

          // 处理详情图片数据
          if (typeof this.event.detail_images === 'string') {
            try {
              this.event.detail_images = JSON.parse(this.event.detail_images)
            } catch (e) {
              this.event.detail_images = []
            }
          }

          // 处理活动须知数据
          if (typeof this.event.notices === 'string') {
            try {
              this.event.notices = JSON.parse(this.event.notices)
            } catch (e) {
              this.event.notices = []
            }
          }

          // 检查报名状态
          this.checkRegistrationStatus()
        } else {
          this.showError(result.message || '获取活动详情失败')
        }
      } catch (error) {
        console.error('加载活动详情失败:', error)
        this.showError('网络错误，请重试')
      } finally {
        this.loading = false
      }
    },

    async checkRegistrationStatus() {
      const token = uni.getStorageSync('token')
      if (!token) return

      try {
        const result = await eventApi.getRegistrationStatus(this.eventId)
        if (result.code === 0) {
          this.isRegistered = result.data.is_registered
          this.registrationStatus = result.data
        }
      } catch (error) {
        console.error('检查报名状态失败:', error.message)

        // 检查是否是超时错误
        if (error.errMsg && error.errMsg.includes('timeout')) {
          uni.showToast({
            title: '网络请求超时，请重试',
            icon: 'none'
          })
        }
      }
    },



    getStatusClass(status) {
      const statusMap = {
        0: 'status-draft',
        1: 'status-active',
        2: 'status-ended',
        3: 'status-cancelled'
      }
      return statusMap[status] || 'status-unknown'
    },

    getStatusText(status) {
      const statusMap = {
        0: '草稿',
        1: '报名中',
        2: '已结束',
        3: '已取消'
      }
      return statusMap[status] || '未知状态'
    },

    getRegisterBtnClass() {
      if (this.isRegistered) return 'registered'
      if (!this.canRegister && !this.isRegistered) return 'disabled'
      return 'active'
    },

    getRegisterBtnText() {
      if (this.isRegistered) return '取消报名'
      if (this.event?.status !== 1) return '活动未开始'
      if (this.event?.current_participants >= this.event?.max_participants) return '名额已满'

      const now = new Date()
      const deadline = new Date(this.event?.registration_deadline)
      if (now >= deadline) return '报名已截止'

      return '立即报名'
    },

    showError(message) {
      uni.showToast({
        title: message,
        icon: 'none'
      })
    },

    goBack() {
      uni.navigateBack()
    },

    handleShare() {
      uni.showToast({
        title: '分享功能开发中',
        icon: 'none'
      })
    },

    viewOrganizerProfile() {
      if (this.event?.organizer?.id) {
        uni.navigateTo({
          url: `/pages/user/profile?id=${this.event.organizer.id}`
        })
      }
    },

    handleLike() {
      this.isLiked = !this.isLiked
      uni.showToast({
        title: this.isLiked ? '已收藏' : '已取消收藏',
        icon: 'none'
      })
    },

    async handleRegister() {
      if (!this.canRegister) return

      if (this.isRegistered) {
        // 取消报名逻辑
        await this.handleCancelRegistration()
      } else {
        // 报名逻辑
        await this.handleEventRegistration()
      }
    },

    async handleEventRegistration() {
      // 显示确认对话框
      const result = await uni.showModal({
        title: '确认报名',
        content: `确定要报名参加"${this.event.title}"吗？`,
        confirmText: '确认报名',
        cancelText: '取消'
      })

      if (!result.confirm) return

      // 显示加载提示
      uni.showLoading({
        title: '报名中...'
      })

      try {
        const response = await eventApi.register(this.eventId, {
          // 这里可以添加报名表单数据，目前使用空对象
          formData: {}
        })

        uni.hideLoading()

        if (response.code === 0) {
          // 报名成功，立即更新本地状态
          this.isRegistered = true
          this.event.current_participants = (this.event.current_participants || 0) + 1

          // 强制触发响应式更新
          this.$forceUpdate()

          console.log('报名成功，当前状态:', {
            isRegistered: this.isRegistered,
            btnText: this.getRegisterBtnText(),
            btnClass: this.getRegisterBtnClass()
          })

          uni.showToast({
            title: '报名成功！',
            icon: 'success',
            duration: 2000
          })

          // 立即触发界面更新
          this.$nextTick(() => {
            this.$forceUpdate()
          })

          // 重新检查报名状态
          setTimeout(() => {
            this.checkRegistrationStatus()
          }, 500)
        } else {
          throw new Error(response.message || '报名失败')
        }
      } catch (error) {
        uni.hideLoading()
        console.error('报名失败:', error)

        uni.showModal({
          title: '报名失败',
          content: error.message || '网络错误，请稍后重试',
          showCancel: false,
          confirmText: '确定'
        })
      }
    },

    async handleCancelRegistration() {
      // 显示确认对话框
      const result = await uni.showModal({
        title: '取消报名',
        content: `确定要取消报名"${this.event.title}"吗？`,
        confirmText: '确认取消',
        cancelText: '保留报名'
      })

      if (!result.confirm) return

      // 显示加载提示
      uni.showLoading({
        title: '取消中...'
      })

      try {
        const response = await eventApi.cancelRegistration(this.eventId)

        uni.hideLoading()

        if (response.code === 0) {
          // 取消报名成功，立即更新本地状态
          this.isRegistered = false
          this.event.current_participants = Math.max((this.event.current_participants || 1) - 1, 0)

          // 强制触发响应式更新
          this.$forceUpdate()

          console.log('取消报名成功，当前状态:', {
            isRegistered: this.isRegistered,
            btnText: this.getRegisterBtnText(),
            btnClass: this.getRegisterBtnClass()
          })

          uni.showToast({
            title: '已取消报名',
            icon: 'success',
            duration: 2000
          })

          // 立即触发界面更新
          this.$nextTick(() => {
            this.$forceUpdate()
          })

          // 延迟一点再检查状态，确保后端状态已更新
          setTimeout(() => {
            this.checkRegistrationStatus()
          }, 500)
        } else {
          throw new Error(response.message || '取消报名失败')
        }
      } catch (error) {
        uni.hideLoading()
        console.error('取消报名失败:', error)

        uni.showModal({
          title: '取消失败',
          content: error.message || '网络错误，请稍后重试',
          showCancel: false,
          confirmText: '确定'
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.event-detail-container {
  min-height: 100vh;
  background-color: $bg-page;
  padding-bottom: 120rpx;
}

/* 导航栏 */
.nav-bar {
  height: 90rpx;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.nav-back, .nav-action {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s;

  &:active {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.nav-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
}

/* 加载状态 */
.loading-container {
  @include center;
  height: 400rpx;
  flex-direction: column;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

.loading-text {
  font-size: 28rpx;
  color: $text-secondary;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 活动内容 */
.event-content {
  padding-bottom: 20rpx;
}

/* 活动封面 */
.event-cover {
  position: relative;
  height: 400rpx;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 30rpx;
}

.event-status {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
  color: #FFFFFF;

  &.status-active {
    background-color: $success-color;
  }

  &.status-ended {
    background-color: $text-secondary;
  }

  &.status-cancelled {
    background-color: $danger-color;
  }

  &.status-draft {
    background-color: $accent-yellow;
  }
}

/* 活动卡片 */
.event-card {
  background-color: #FFFFFF;
  margin: 20rpx 30rpx;
  padding: 30rpx;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.event-title {
  font-size: 36rpx;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.4;
  margin-bottom: 30rpx;
}

/* 活动信息 */
.event-info {
  margin-bottom: 30rpx;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-text {
  font-size: 28rpx;
  color: $text-primary;
  margin-left: 16rpx;
  flex: 1;
}

/* 组织者信息 */
.organizer-info {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: $bg-page;
  border-radius: 16rpx;
  transition: background-color 0.3s;

  &:active {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.organizer-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.organizer-details {
  flex: 1;
}

.organizer-name {
  font-size: 28rpx;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 4rpx;
}

.organizer-label {
  font-size: 24rpx;
  color: $text-secondary;
}

/* 卡片标题 */
.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 20rpx;
}

/* 活动描述 */
.event-description {
  line-height: 1.6;
}

.description-text {
  font-size: 28rpx;
  color: $text-primary;
}

/* 统计信息 */
.event-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 20rpx;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-number {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: $primary-color;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: $text-secondary;
}

/* 错误状态 */
.error-container {
  @include center;
  height: 400rpx;
  flex-direction: column;
  padding: 0 60rpx;
}

.error-text {
  font-size: 28rpx;
  color: $text-secondary;
  margin: 20rpx 0;
  text-align: center;
}

.error-action {
  padding: 16rpx 32rpx;
  background-color: $primary-color;
  border-radius: 40rpx;
  margin-top: 20rpx;
}

.action-text {
  font-size: 28rpx;
  color: #FFFFFF;
}

/* 底部操作栏 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #FFFFFF;
  padding: 20rpx 30rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
}

.action-left {
  display: flex;
  align-items: center;
}

.action-item {
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  border-radius: 40rpx;
  transition: background-color 0.3s;

  &:active {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.action-text {
  font-size: 24rpx;
  color: $text-secondary;
  margin-left: 8rpx;
}

.action-right {
  flex: 1;
  margin-left: 30rpx;
}

.register-btn {
  width: 100%;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  transition: all 0.3s;

  &.active {
    background-color: $primary-color;
    color: #FFFFFF;

    &:active {
      background-color: darken($primary-color, 10%);
    }
  }

  &.registered {
    background-color: #FF9500;
    color: #FFFFFF;
    border: 1px solid #E6850E;

    &:hover {
      background-color: #E6850E;
    }

    &:active {
      background-color: #CC7A0D;
    }
  }

  &.disabled {
    background-color: $bg-disabled;
    color: $text-disabled;
  }
}
</style>