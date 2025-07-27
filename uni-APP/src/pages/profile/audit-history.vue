<template>
  <view class="audit-history-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="navbar-left" @tap="goBack">
          <app-icon name="arrow-left" size="lg" color="#333" />
        </view>
        <view class="navbar-title">审核记录</view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 内容类型筛选 -->
    <view class="content-type-filter">
      <view class="filter-tabs">
        <view
          class="filter-tab"
          :class="{ active: contentType === 'all' }"
          @tap="filterByContentType('all')"
        >
          全部
        </view>
        <view
          class="filter-tab"
          :class="{ active: contentType === 'posts' }"
          @tap="filterByContentType('posts')"
        >
          帖子
        </view>
        <view
          class="filter-tab"
          :class="{ active: contentType === 'comments' }"
          @tap="filterByContentType('comments')"
        >
          评论
        </view>
      </view>
    </view>

    <!-- 审核状态筛选 -->
    <view class="audit-filter">
      <view class="filter-tabs">
        <view
          class="filter-tab"
          :class="{ active: statusFilter === '' }"
          @tap="filterByStatus('')"
        >
          全部
        </view>
        <view
          class="filter-tab"
          :class="{ active: statusFilter === 'pending' }"
          @tap="filterByStatus('pending')"
        >
          待审核
        </view>
        <view
          class="filter-tab"
          :class="{ active: statusFilter === 'rejected' }"
          @tap="filterByStatus('rejected')"
        >
          未通过
        </view>
      </view>
    </view>

    <!-- 审核记录列表 -->
    <scroll-view
      scroll-y
      class="audit-scroll"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="refresh"
    >
      <view class="audit-list" v-if="auditList.length > 0">
        <view
          v-for="(item, index) in auditList"
          :key="item.id"
          class="audit-item"
          :style="{ animationDelay: index * 0.1 + 's' }"
          @tap="viewItem(item)"
        >
          <view class="audit-content">
            <view class="audit-header">
              <view class="content-type-badge" :class="item.type || 'post'">
                <text class="type-text">{{ (item.type === 'comment') ? '评论' : '帖子' }}</text>
              </view>
              <text class="audit-title">{{ getItemTitle(item) }}</text>
              <view class="audit-status" :style="{ color: item.auditStatusColor }">
                <text class="audit-status-text">{{ item.auditStatusText }}</text>
              </view>
            </view>
            <view class="audit-body">
              <text class="audit-excerpt">{{ getExcerpt(item.content) }}</text>
              <!-- 如果是评论，显示所属帖子信息 -->
              <view v-if="item.type === 'comment' && item.post" class="comment-post-info">
                <text class="post-info-label">所属帖子：</text>
                <text class="post-info-title">{{ item.post.title || '无标题' }}</text>
              </view>
            </view>
            <view class="audit-footer">
              <text class="audit-time">{{ formatTime(item.created_at) }}</text>
              <view class="audit-stats">
                <text class="audit-stat">{{ item.like_count || 0 }} 赞</text>
                <text v-if="item.type !== 'comment'" class="audit-stat">{{ item.comment_count || 0 }} 评论</text>
              </view>
            </view>
          </view>
          <view class="audit-image" v-if="item.images && item.images.length > 0">
            <image
              :src="item.images[0].url"
              mode="aspectFill"
              class="audit-thumb"
            ></image>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="load-more" v-if="hasMore && auditList.length > 0">
        <text class="load-more-text">向下滑动加载更多...</text>
      </view>
      
      <!-- 没有更多 -->
      <view class="no-more" v-else-if="auditList.length > 0">
        <text class="no-more-text">已显示全部 {{ auditList.length }} 条记录</text>
      </view>

      <!-- 空状态 -->
      <view class="empty-container" v-if="auditList.length === 0 && !loading">
        <view class="empty-state">
          <image class="empty-image" src="/static/images/common/empty-audit.png" mode="aspectFit"></image>
          <text class="empty-text">暂无审核记录</text>
          <text class="empty-desc">您发布的帖子审核记录将在这里显示</text>
        </view>
      </view>

      <!-- 加载骨架屏 -->
      <view class="loading-skeleton" v-if="loading && auditList.length === 0">
        <view class="skeleton-item" v-for="n in 5" :key="n">
          <view class="skeleton-content">
            <view class="skeleton-line skeleton-line-title"></view>
            <view class="skeleton-line skeleton-line-text"></view>
            <view class="skeleton-line skeleton-line-short"></view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部安全区占位 -->
    <view class="safe-area"></view>
  </view>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue'
import api from '@/api'

export default {
  name: 'AuditHistory',
  components: {
    AppIcon
  },
  data() {
    return {
      auditList: [],
      page: 1,
      pageSize: 20,
      hasMore: true,
      loading: false,
      refreshing: false,
      statusFilter: '', // 状态筛选：'', 'pending', 'rejected'
      contentType: 'all' // 内容类型筛选：'all', 'posts', 'comments'
    }
  },
  onLoad() {
    this.loadAuditHistory()
  },
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack()
    },

    // 加载审核记录
    async loadAuditHistory() {
      if (this.loading) return

      this.loading = true

      try {
        let allData = []

        // 根据内容类型筛选决定加载哪些数据
        if (this.contentType === 'all' || this.contentType === 'posts') {
          // 加载帖子审核记录
          const postParams = {
            page: this.page,
            pageSize: this.pageSize
          }

          if (this.statusFilter) {
            postParams.status = this.statusFilter
          }

          try {
            const postRes = await api.post.getAuditHistory(postParams)
            if (postRes.code === 0 || postRes.code === 200) {
              const postData = (postRes.data.list || postRes.data.items || []).map(item => ({
                ...item,
                type: 'post' // 标记为帖子类型
              }))
              allData = [...allData, ...postData]
            }
          } catch (error) {
            console.warn('获取帖子审核记录失败:', error)
          }
        }

        if (this.contentType === 'all' || this.contentType === 'comments') {
          // 加载评论审核记录
          const commentParams = {
            page: this.page,
            pageSize: this.pageSize
          }

          if (this.statusFilter) {
            commentParams.status = this.statusFilter
          }

          try {
            const commentRes = await api.comment.getAuditHistory(commentParams)
            if (commentRes.code === 0 || commentRes.code === 200) {
              const commentData = (commentRes.data.list || commentRes.data.items || []).map(item => ({
                ...item,
                type: 'comment' // 标记为评论类型
              }))
              allData = [...allData, ...commentData]
            }
          } catch (error) {
            console.warn('获取评论审核记录失败:', error)
          }
        }

        // 按创建时间排序
        allData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

        if (this.page === 1) {
          this.auditList = allData
        } else {
          this.auditList = [...this.auditList, ...allData]
        }

        // 简单的分页控制（实际项目中可能需要更复杂的逻辑）
        this.hasMore = allData.length >= this.pageSize

      } catch (error) {
        console.error('获取审核记录失败:', error)
        uni.showToast({
          title: '获取审核记录失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },

    // 加载更多
    loadMore() {
      if (this.loading || !this.hasMore) return
      
      this.page++
      this.loadAuditHistory()
    },

    // 刷新
    refresh() {
      this.refreshing = true
      this.page = 1
      this.hasMore = true
      this.loadAuditHistory()
    },

    // 按内容类型筛选
    filterByContentType(type) {
      this.contentType = type
      this.page = 1
      this.auditList = []
      this.hasMore = true
      this.loadAuditHistory()
    },

    // 按状态筛选
    filterByStatus(status) {
      this.statusFilter = status
      this.page = 1
      this.auditList = []
      this.hasMore = true
      this.loadAuditHistory()
    },

    // 查看内容详情
    viewItem(item) {
      if (item.type === 'comment') {
        // 如果是评论，跳转到对应的帖子详情页
        if (item.post && item.post.id) {
          uni.navigateTo({
            url: `/pages/post/detail?id=${item.post.id}&commentId=${item.id}`
          })
        } else {
          uni.showToast({
            title: '无法查看评论详情',
            icon: 'none'
          })
        }
      } else {
        // 如果是帖子，直接跳转到帖子详情页
        uni.navigateTo({
          url: `/pages/post/detail?id=${item.id}`
        })
      }
    },

    // 查看帖子详情（保持向后兼容）
    viewPost(post) {
      this.viewItem(post)
    },

    // 获取内容标题
    getItemTitle(item) {
      if (item.type === 'comment') {
        // 评论显示内容摘要作为标题
        return item.content ? (item.content.length > 30 ? item.content.substring(0, 30) + '...' : item.content) : '无内容'
      } else {
        // 帖子显示标题
        return item.title || '无标题'
      }
    },

    // 获取内容摘要
    getExcerpt(content) {
      if (!content) return '无内容'
      return content.length > 100 ? content.substring(0, 100) + '...' : content
    },

    // 格式化时间
    formatTime(time) {
      if (!time) return ''

      const now = new Date().getTime()
      const diff = now - new Date(time).getTime()

      if (diff < 60 * 1000) {
        return '刚刚'
      } else if (diff < 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 1000)) + '分钟前'
      } else if (diff < 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 60 * 1000)) + '小时前'
      } else if (diff < 7 * 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前'
      } else {
        return new Date(time).toLocaleDateString()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.audit-history-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

/* 自定义导航栏 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
}

.navbar-content {
  @include flex(row, space-between, center);
  height: 88rpx;
  padding: 0 30rpx;
  padding-top: env(safe-area-inset-top);
}

.navbar-left, .navbar-right {
  width: 80rpx;
  height: 60rpx;
  @include flex(row, center, center);
}

.navbar-title {
  font-size: 36rpx;
  font-weight: 600;
  color: $text-primary;
}

/* 内容类型筛选 */
.content-type-filter {
  margin-top: calc(88rpx + env(safe-area-inset-top));
  padding: 20rpx 30rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
}

/* 审核状态筛选 */
.audit-filter {
  padding: 20rpx 30rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
}

.filter-tabs {
  @include flex(row, flex-start, center);
  gap: 20rpx;
}

.filter-tab {
  padding: 12rpx 24rpx;
  background: #f8f9fa;
  border-radius: 20rpx;
  font-size: 28rpx;
  color: #666666;
  transition: all 0.3s ease;

  &.active {
    background: linear-gradient(135deg, $primary-color 0%, lighten($primary-color, 10%) 100%);
    color: #ffffff;
    box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.3);
  }
}

/* 审核记录列表 */
.audit-scroll {
  height: calc(100vh - 88rpx - env(safe-area-inset-top) - 160rpx);
}

.audit-list {
  padding: 20rpx 30rpx;
}

.audit-item {
  @include flex(row, space-between, flex-start);
  padding: 30rpx;
  margin-bottom: 20rpx;
  background: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: slideInUp 0.6s ease-out both;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.12);
  }
}

.audit-content {
  flex: 1;
  margin-right: 20rpx;
}

.audit-header {
  @include flex(row, space-between, flex-start);
  margin-bottom: 16rpx;
}

.content-type-badge {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  font-weight: 500;
  margin-right: 12rpx;
  flex-shrink: 0;

  &.post {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
  }

  &.comment {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: #ffffff;
  }
}

.type-text {
  font-size: 20rpx;
}

.audit-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.4;
  flex: 1;
  margin-right: 20rpx;
}

.audit-status {
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 500;
  background-color: rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.audit-body {
  margin-bottom: 16rpx;
}

.audit-excerpt {
  font-size: 28rpx;
  color: $text-secondary;
  line-height: 1.5;
}

.comment-post-info {
  margin-top: 12rpx;
  padding: 12rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
  border-left: 4rpx solid $primary-color;
}

.post-info-label {
  font-size: 24rpx;
  color: $text-tertiary;
  margin-right: 8rpx;
}

.post-info-title {
  font-size: 24rpx;
  color: $text-secondary;
  font-weight: 500;
}

.audit-footer {
  @include flex(row, space-between, center);
}

.audit-time {
  font-size: 24rpx;
  color: $text-tertiary;
}

.audit-stats {
  @include flex(row, flex-end, center);
  gap: 20rpx;
}

.audit-stat {
  font-size: 24rpx;
  color: $text-tertiary;
}

.audit-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.audit-thumb {
  width: 100%;
  height: 100%;
}

/* 加载状态 */
.load-more, .no-more {
  @include flex(row, center, center);
  padding: 40rpx;
}

.load-more-text, .no-more-text {
  font-size: 28rpx;
  color: $text-tertiary;
}

/* 空状态 */
.empty-container {
  @include flex(column, center, center);
  padding: 100rpx 30rpx;
}

.empty-state {
  @include flex(column, center, center);
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  opacity: 0.6;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 32rpx;
  color: $text-secondary;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.empty-desc {
  font-size: 28rpx;
  color: $text-tertiary;
  text-align: center;
  line-height: 1.5;
}

/* 加载骨架屏 */
.loading-skeleton {
  padding: 20rpx 30rpx;
}

.skeleton-item {
  padding: 30rpx;
  margin-bottom: 20rpx;
  background: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.skeleton-content {
  flex: 1;
}

.skeleton-line {
  height: 24rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 12rpx;
  margin-bottom: 16rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.skeleton-line-title {
  width: 60%;
  height: 28rpx;
}

.skeleton-line-text {
  width: 100%;
}

.skeleton-line-short {
  width: 40%;
}

@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 安全区域 */
.safe-area {
  height: env(safe-area-inset-bottom);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}
</style>
