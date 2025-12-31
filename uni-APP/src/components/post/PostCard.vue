<template>
  <view class="post-card" :class="{ compact: compact }" @tap="goDetail">
    <view class="post-card__header">
      <view class="post-card__user">
        <!-- 用户头像和信息区域，独立点击 -->
        <view class="post-card__user-info" @tap.stop="onUserClick">
          <image class="post-card__avatar" :src="safeAvatar(post.author)" mode="aspectFill"></image>
          <view class="post-card__info">
            <view class="post-card__name-row">
              <text class="post-card__name">{{ getDisplayName() }}</text>
              <!-- 匿名提示 - 只在个人主页显示 -->
              <view class="post-card__anonymous-badge" v-if="showAnonymousBadge && isAnonymousPost()">
                <text class="post-card__anonymous-text">匿名</text>
              </view>
              <!-- 用户徽章显示 - 只在非匿名帖子时显示 -->
              <view class="post-card__badges" v-if="!isAnonymousPost() && authorBadges.length > 0">
                <view 
                  v-for="badge in authorBadges" 
                  :key="badge.id"
                  class="post-card__badge"
                  :class="`badge-rarity-${badge.rarity}`"
                  :style="{backgroundColor: badge.color}"
                >
                  <image class="post-card__badge-icon" src="/static/images/badge-icon.svg" mode="aspectFit"></image>
                </view>
              </view>
            </view>
            <view class="post-card__meta">
              <text class="post-card__time">{{ formatTime }}</text>
              <text v-if="post.location" class="post-card__location">{{ post.location }}</text>
            </view>
          </view>
        </view>
        
        <!-- 右侧操作区域 -->
        <view class="post-card__user-actions">
          <!-- 关注按钮 - 只在非匿名且非自己的帖子时显示 -->
          <follow-button
            v-if="shouldShowFollowButton"
            :user-id="post.author?.id"
            :is-following="post.author?.isFollowing"
            size="small"
            @follow-action="handleFollowAction"
            class="post-card__follow-btn"
            @tap.stop
          />
          <view class="post-card__more" @tap.stop="onMoreClick">
            <app-icon name="more" color="#666"></app-icon>
          </view>
        </view>
      </view>
    </view>

    <view class="post-card__content">
      <view class="post-card__title" v-if="post.title">{{ post.title }}</view>
      <view class="post-card__text">{{ post.content }}</view>

      <!-- 图片展示区 -->
      <view class="post-card__images" v-if="post.images && post.images.length">
        <view class="post-card__image-container" :class="imageLayoutClass">
          <image v-for="(image, index) in processedImages" :key="index" :src="safeImageUrl(image)" mode="aspectFill"
            class="post-card__image" @tap.stop="previewImage(index)"></image>
        </view>
      </view>

      <!-- 话题标签 -->
      <view class="post-card__tags" v-if="post.tags && post.tags.length">
        <view class="post-card__tag" v-for="(tag, index) in post.tags" :key="index">
          #{{ tag }}
        </view>
      </view>
    </view>

    <!-- 热门评论预览 -->
    <view class="post-card__comments" v-if="post.hot_comments && post.hot_comments.length > 0">
      <view class="post-card__comments-title">
        <text class="post-card__comments-label">热门评论</text>
      </view>

      <view class="post-card__comment-list">
        <view class="post-card__comment-item" v-for="(comment, index) in post.hot_comments" :key="comment.id">
          <view class="post-card__comment-header">
            <!-- 用户信息区域，点击跳转到用户页面 -->
            <view class="post-card__comment-user" @tap.stop="handleUserClick(comment.author)">
              <image class="post-card__comment-avatar" :src="safeCommentAvatar(comment)" mode="aspectFill"></image>
              <view class="post-card__comment-info">
                <text class="post-card__comment-name">{{ safeCommentName(comment) }}</text>
                <text class="post-card__comment-time">{{ formatCommentTime(comment.created_at) }}</text>
              </view>
            </view>
            
            <!-- 点赞区域，独立点击 -->
            <view class="post-card__comment-like" @tap.stop="handleCommentLike(comment)">
              <app-icon name="like" size="xs" :color="comment.is_liked ? '#FF6B6B' : '#999'"></app-icon>
              <text :class="['post-card__comment-like-count', comment.is_liked ? 'active' : '']">
                {{ comment.like_count || 0 }}
              </text>
            </view>
          </view>
          <!-- 评论内容区域，点击进入详情 -->
          <view class="post-card__comment-content" @tap.stop="goToComments">
            <text class="post-card__comment-text">{{ truncateComment(comment.content) }}</text>
          </view>
        </view>
      </view>

      <!-- 查看更多评论按钮 -->
      <view class="post-card__more-comments" v-if="post.total_comments > 2" @tap.stop="goToComments">
        <text class="post-card__more-comments-text">查看全部 {{ post.total_comments }} 条评论</text>
        <app-icon name="arrow-right" size="xs" color="#999"></app-icon>
      </view>
    </view>

    <view class="post-card__footer">
      <view class="post-card__action" @tap.stop="onLikeClick">
        <app-icon name="like" :customClass="post.isLiked ? 'active' : ''"
          :color="post.isLiked ? '#FF6B6B' : '#666'"></app-icon>
        <text :class="['post-card__count', post.isLiked ? 'active' : '']">{{ post.likeCount || post.like_count || 0 }}</text>
      </view>

      <view class="post-card__action" @tap.stop="onCommentClick">
        <app-icon name="comment" color="#666"></app-icon>
        <text class="post-card__count">{{ post.commentCount || post.comment_count || 0 }}</text>
      </view>

      <view class="post-card__action" @tap.stop="onFavoriteClick">
        <app-icon name="favorite" :customClass="post.isFavorited ? 'active' : ''"
          :color="post.isFavorited ? '#FFCE54' : '#666'"></app-icon>
        <text :class="['post-card__count', post.isFavorited ? 'active' : '']">{{ post.favoriteCount || post.favorite_count || 0 }}</text>
      </view>

      <view class="post-card__action" @tap.stop="onShareClick">
        <app-icon name="share" color="#666"></app-icon>
        <text class="post-card__count">分享</text>
      </view>
    </view>
  </view>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue';
import FollowButton from '@/components/FollowButton.vue';
import { formatTimeAgo } from '@/utils/date';
import { ensureAbsoluteUrl } from '@/utils/url';

export default {
  name: 'PostCard',
  components: {
    AppIcon,
    FollowButton
  },
  props: {
    post: {
      type: Object,
      required: true,
      default: () => ({})
    },
    // 是否显示匿名标签（仅在个人主页显示）
    showAnonymousBadge: {
      type: Boolean,
      default: false
    },
    // 是否使用紧凑布局（减少margin）
    compact: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
    };
  },

  computed: {
    // 从帖子数据中提取作者徽章
    authorBadges() {
      if (!this.post.author?.userBadges) {
        return [];
      }
      
      return this.post.author.userBadges
        .slice(0, 3) // 最多显示3个徽章
        .map(userBadge => ({
          id: userBadge.id,
          name: userBadge.badge.name,
          color: userBadge.badge.color,
          rarity: userBadge.badge.rarity
        }));
    },
    formatTime() {
      return formatTimeAgo(this.post.createTime || Date.now());
    },
    imageLayoutClass() {
      const count = this.post.images ? this.post.images.length : 0;
      if (count === 1) return 'single';
      if (count === 2) return 'double';
      if (count === 4) return 'four';
      if (count >= 3) return 'grid';
      return '';
    },
    // 处理后的图片URL列表
    processedImages() {
      if (!this.post.images || !this.post.images.length) return [];
      return this.post.images.map(image => {
        let imageUrl = '';
        if (typeof image === 'string') {
          imageUrl = image;
        } else if (image && image.url) {
          imageUrl = image.url;
        } else {
          imageUrl = '';
        }
        // 确保URL是绝对路径
        return ensureAbsoluteUrl(imageUrl);
      });
    },
    // 判断是否显示关注按钮
    shouldShowFollowButton() {
      // 不显示关注按钮的情况：
      // 1. 匿名帖子
      // 2. 没有作者信息
      // 3. 是自己的帖子
      // 4. 用户未登录
      if (this.isAnonymousPost() || !this.post.author || !this.post.author.id) {
        return false;
      }
      
      // 检查用户是否已登录
      const currentUserInfo = uni.getStorageSync('userInfo');
      const currentUserId = currentUserInfo?.id || uni.getStorageSync('userId') || uni.getStorageSync('user_id');
      if (!currentUserId) {
        return false;
      }
      
      // 检查是否是当前用户自己的帖子
      if (currentUserId === this.post.author.id) {
        return false;
      }
      
      return true;
    }
  },
  
  methods: {
    // 安全获取用户头像
    safeAvatar(user) {
      if (!user) {
        return '/static/logo.png'; // 临时使用logo测试
      }

      if (!user.avatar) {
        return '/static/logo.png'; // 临时使用logo测试
      }

      // 使用 ensureAbsoluteUrl 处理头像URL
      const processedUrl = ensureAbsoluteUrl(user.avatar);
      console.log('✅ 处理后的主帖作者头像URL:', user.avatar, '->', processedUrl);
      return processedUrl;
    },

    // 判断是否为匿名帖子
    isAnonymousPost() {
      // 支持多种匿名字段格式
      return this.post.is_anonymous === true ||
        this.post.is_anonymous === 1 ||
        this.post.is_anonymous === '1' ||
        this.post.isAnonymous === true ||
        this.post.isAnonymous === 1 ||
        this.post.isAnonymous === '1';
    },

    // 获取显示名称
    getDisplayName() {
      // 在个人主页，即使是匿名帖子也显示真实用户名
      if (this.showAnonymousBadge) {
        return this.post.author?.nickname || this.post.author?.username || '未知用户';
      }

      // 在其他页面，匿名帖子显示"匿名用户"
      if (this.isAnonymousPost()) {
        return '匿名用户';
      }
      return this.post.author?.nickname || this.post.author?.username || '未知用户';
    },

    // 跳转到详情页
    goDetail() {
      // 直接跳转到帖子详情页
      uni.navigateTo({
        url: `/pages/post/detail?id=${this.post.id}`
      });
    },

    // 用户头像点击事件
    onUserClick() {
      // 如果是匿名帖子且不在个人主页，不允许跳转
      if (this.isAnonymousPost() && !this.showAnonymousBadge) {
        return;
      }

      // 获取用户ID
      const userId = this.post.author?.id;
      if (!userId) {
        console.warn('用户ID不存在，无法跳转到用户主页');
        return;
      }

      // 跳转到用户主页
      uni.navigateTo({
        url: `/pages/user/user-profile?id=${userId}`
      });
    },

    // 图片预览
    previewImage(index) {
      if (!this.post.images || !this.post.images.length) return;

      // 确保所有图片URL都是绝对路径
      const absoluteUrls = this.processedImages;

      uni.previewImage({
        current: index,
        urls: absoluteUrls
      });
    },

    // 点赞操作
    onLikeClick() {
      this.$emit('like', this.post);
    },

    // 评论操作
    onCommentClick() {
      this.$emit('comment', this.post);
    },

    // 收藏操作
    onFavoriteClick() {
      this.$emit('favorite', this.post);
    },

    // 分享操作
    onShareClick() {
      uni.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
      this.$emit('share', this.post);
    },

    // 安全获取评论者头像
    safeCommentAvatar(comment) {
      console.log('🔍 调试评论头像:', {
        comment: comment?.id,
        author: comment?.author,
        avatar: comment?.author?.avatar
      });

      if (!comment || !comment.author) {
        console.log('❌ 评论或作者不存在，使用默认头像');
        return '/static/logo.png'; // 临时使用logo测试
      }

      if (!comment.author.avatar) {
        console.log('❌ 作者没有头像，使用默认头像');
        return '/static/logo.png'; // 临时使用logo测试
      }

      // 使用 ensureAbsoluteUrl 处理头像URL
      const processedUrl = ensureAbsoluteUrl(comment.author.avatar);
      console.log('✅ 处理后的评论头像URL:', comment.author.avatar, '->', processedUrl);
      return processedUrl;
    },

    // 安全获取评论者昵称
    safeCommentName(comment) {
      if (!comment || !comment.author) return '未知用户';
      return comment.author.nickname || comment.author.username || '未知用户';
    },

    // 格式化评论时间
    formatCommentTime(time) {
      return formatTimeAgo(time);
    },

    // 截断评论内容
    truncateComment(content, maxLength = 30) {
      if (!content) return '';
      if (content.length <= maxLength) return content;
      
      // 对于纯数字内容，进一步缩短截断长度
      if (/^\d+$/.test(content.trim())) {
        const numMaxLength = Math.min(maxLength, 20);
        if (content.length <= numMaxLength) return content;
        return content.substring(0, numMaxLength) + '...';
      }
      
      return content.substring(0, maxLength) + '...';
    },

    // 处理评论点赞
    handleCommentLike(comment) {
      this.$emit('commentLike', comment);
    },

    // 处理用户点击
    handleUserClick(user) {
      if (!user || !user.id) return;
      this.$emit('userClick', user);
    },

    // 跳转到评论区
    goToComments() {
      uni.navigateTo({
        url: `/pages/post/detail?id=${this.post.id}&scrollToComments=true`
      });
    },

    // 更多操作
    onMoreClick() {
      if (!this.post.isOwner) {
        uni.showActionSheet({
          itemList: ['举报'],
          success: () => {
            uni.showToast({
              title: '举报成功',
              icon: 'none'
            });
          }
        });
      } else {
        uni.showActionSheet({
          itemList: ['编辑', '删除'],
          success: (res) => {
            if (res.tapIndex === 0) {
              this.$emit('edit', this.post);
            } else if (res.tapIndex === 1) {
              this.$emit('delete', this.post);
            }
          }
        });
      }
    },

    // 安全处理图片URL
    safeImageUrl(url) {
      if (!url) return '';

      let imageUrl = '';
      if (typeof url === 'string') {
        imageUrl = url;
      } else if (url && url.url) {
        imageUrl = url.url;
      } else {
        imageUrl = String(url);
      }

      // 确保URL是绝对路径
      return ensureAbsoluteUrl(imageUrl);
    },

    // FollowButton 点击后会抛出 follow-action 事件，这里负责真正调用后端关注/取关接口
    async handleFollowAction(payload) {
      // payload: { userId, currentStatus, action: 'follow' | 'unfollow' }
      const { userId, currentStatus, action } = payload || {};

      // 基础校验
      if (!userId) {
        console.warn('handleFollowAction: userId为空', payload);
        return;
      }

      // 登录校验（FollowButton 已做一次，这里再兜底，避免外部直接调用）
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.navigateTo({ url: '/pages/auth/login/index' });
        return;
      }

      try {
        // 乐观更新：先改UI，失败再回滚
        if (this.post.author) {
          this.post.author.isFollowing = action === 'follow';
        }

        // 调用后端关注/取关接口
        if (action === 'follow') {
          await this.$api.follow.follow(userId);
        } else {
          await this.$api.follow.unfollow(userId);
        }

        // 通知父组件同步其它帖子卡片的关注状态
        this.$emit('followStatusChange', {
          userId,
          isFollowing: action === 'follow',
          action,
          previousStatus: !!currentStatus
        });
      } catch (err) {
        console.error('关注操作失败:', err);

        // 回滚UI
        if (this.post.author) {
          this.post.author.isFollowing = !!currentStatus;
        }

        uni.showToast({
          title: '操作失败，请稍后重试',
          icon: 'none'
        });
      }
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.post-card {
  background-color: $bg-card;
  border-radius: $radius-lg;
  margin: $spacing-md $spacing-md $spacing-lg $spacing-md;
  padding: 16rpx;
  box-shadow: $shadow-card;
  transition: transform $transition-normal, box-shadow $transition-normal;
  overflow: hidden;
  position: relative;

  // 紧凑布局样式
  &.compact {
    margin: 0 0 $spacing-sm 0; // 只保留底部间距
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 6rpx;
    height: 60rpx;
    background: $gradient-blue;
    border-radius: 0 0 $radius-sm $radius-sm;
  }

  &:active {
    transform: translateY(2rpx);
    box-shadow: $shadow-sm;
  }

  &__header {
    @include flex(row, space-between, center);
    margin-bottom: $spacing-md;
  }

  &__user {
    @include flex(row, space-between, center);
    flex: 1;
  }

  &__user-info {
    @include flex(row, flex-start, center);
    flex: 1;
    padding: $spacing-xs;
    border-radius: $radius-md;
    transition: background-color $transition-fast;

    &:active {
      background-color: $bg-light;
    }
  }

  &__user-actions {
    @include flex(row, center, center);
    margin-left: $spacing-sm;
  }

  &__avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: $radius-circle;
    margin-right: $spacing-sm;
    background-color: $bg-disabled;
    border: 3rpx solid $bg-light-blue;
    box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
  }

  &__info {
    flex: 1;
  }

  &__name-row {
    @include flex(row, flex-start, center);
    margin-bottom: 4rpx;
  }

  &__name {
    font-size: $font-size-md;
    font-weight: bold;
    color: $text-primary;
  }

  &__anonymous-badge {
    margin-left: $spacing-xs;
    background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
    border-radius: $radius-sm;
    padding: 2rpx 8rpx;
    box-shadow: 0 2rpx 4rpx rgba(255, 107, 107, 0.3);
  }

  &__anonymous-text {
    font-size: $font-size-xs;
    color: #FFFFFF;
    font-weight: 500;
  }

  // 用户徽章样式
  &__badges {
    @include flex(row, flex-start, center);
    margin-left: $spacing-xs;
    gap: 4rpx;
  }

  &__badge {
    width: 36rpx;
    height: 36rpx;
    border-radius: 50%;
    @include flex(row, center, center);
    box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
    border: 1rpx solid rgba(255, 255, 255, 0.8);
    
    // 稀有度发光效果
    &.badge-rarity-rare {
      box-shadow: 0 2rpx 8rpx rgba(70, 130, 180, 0.4);
    }
    
    &.badge-rarity-epic {
      box-shadow: 0 2rpx 8rpx rgba(138, 43, 226, 0.4);
    }
    
    &.badge-rarity-legendary {
      box-shadow: 0 2rpx 8rpx rgba(255, 215, 0, 0.5);
      animation: badgeGlow 2s ease-in-out infinite alternate;
    }
  }

  &__badge-icon {
    width: 26rpx;
    height: 26rpx;
  }

  @keyframes badgeGlow {
    from {
      box-shadow: 0 2rpx 8rpx rgba(255, 215, 0, 0.5);
    }
    to {
      box-shadow: 0 3rpx 12rpx rgba(255, 215, 0, 0.7);
    }
  }

  &__meta {
    @include flex(row, flex-start, center);
  }

  &__time,
  &__location {
    font-size: $font-size-xs;
    color: $text-tertiary;
  }

  &__location {
    margin-left: $spacing-sm;
    position: relative;
    padding-left: $spacing-sm;

    &:before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 2rpx;
      height: 24rpx;
      background-color: $border-color;
    }
  }

  &__follow-btn {
    margin-right: $spacing-xs;
  }

  &__more {
    padding: $spacing-sm;
    border-radius: $radius-sm;
    transition: background-color $transition-fast;
    min-width: 60rpx;
    min-height: 60rpx;
    @include flex(row, center, center);

    &:active {
      background-color: $bg-light;
    }
  }

  &__content {
    margin-bottom: $spacing-md;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: bold;
    color: $text-primary;
    line-height: 1.4;
    margin-bottom: $spacing-xs;
  }

  &__text {
    font-size: $font-size-md;
    color: $text-primary;
    line-height: 1.5;
    margin-bottom: $spacing-sm;
    word-break: break-all;
  }

  &__images {
    margin: $spacing-sm 0;
  }

  &__image-container {
    display: flex;
    flex-wrap: wrap;

    &.single {
      .post-card__image {
        width: 66%;
        height: 340rpx;
        border-radius: $radius-md;
        box-shadow: $shadow-sm;
      }
    }

    &.double {
      justify-content: space-between;

      .post-card__image {
        width: 48%;
        height: 240rpx;
        border-radius: $radius-md;
        box-shadow: $shadow-sm;
      }
    }

    &.grid {
      justify-content: space-between;

      .post-card__image {
        width: 32%;
        height: 200rpx;
        margin-bottom: $spacing-xs;
        border-radius: $radius-md;
        box-shadow: $shadow-sm;
      }
    }

    &.four {
      justify-content: space-between;

      .post-card__image {
        width: 48%;
        height: 200rpx;
        margin-bottom: $spacing-xs;
        border-radius: $radius-md;
        box-shadow: $shadow-sm;
      }
    }
  }

  &__tags {
    @include flex(row, flex-start, center);
    flex-wrap: wrap;
    margin-top: $spacing-xs;
  }

  &__tag {
    font-size: $font-size-xs;
    color: $primary-color;
    background-color: $bg-light-blue;
    padding: 6rpx 20rpx;
    border-radius: 30rpx;
    margin-right: $spacing-sm;
    margin-bottom: $spacing-xs;
    transition: background-color $transition-fast, transform $transition-fast;

    &:active {
      transform: scale(0.95);
      background-color: rgba($primary-color, 0.15);
    }
  }

  // 热门评论预览样式
  &__comments {
    margin-top: 24rpx;
    padding-top: 24rpx;
    border-top: 1px solid $border-light;
  }

  &__comments-title {
    margin-bottom: 20rpx;
  }

  &__comments-label {
    font-size: $font-size-sm;
    color: $text-secondary;
    font-weight: 500;
  }

  &__comment-list {
    margin-top: 16rpx;
  }

  &__comment-item {
    margin-bottom: 20rpx;
    padding: 3rpx;
    background-color: $bg-light;
    border-radius: $radius-md;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__comment-header {
    @include flex(row, space-between, center);
    margin-bottom: 4rpx;
  }

  &__comment-user {
    @include flex(row, flex-start, center);
    flex: 1;
    padding: 8rpx 12rpx;
    border-radius: $radius-sm;
    transition: background-color $transition-fast;

    &:active {
      background-color: rgba($primary-color, 0.1);
    }
  }

  &__comment-avatar {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    margin-right: $spacing-sm;
  }

  &__comment-info {
    flex: 1;
  }

  &__comment-name {
    font-size: $font-size-sm;
    color: $text-primary;
    font-weight: 500;
    margin-bottom: 4rpx;
  }

  &__comment-time {
    font-size: $font-size-xs;
    color: $text-tertiary;
  }

  &__comment-like {
    @include flex(row, center, center);
    padding: 8rpx 12rpx;
    border-radius: $radius-sm;
    transition: background-color $transition-fast;

    &:active {
      background-color: rgba($primary-color, 0.1);
    }
  }

  &__comment-like-count {
    font-size: $font-size-xs;
    color: $text-tertiary;
    margin-left: 6rpx;

    &.active {
      color: $danger-color;
    }
  }

  &__comment-content {
    margin-left: 30rpx; // 减少左边距，让内容更靠左，减少头像下方空白
    padding: 8rpx 12rpx;
    border-radius: $radius-sm;
    transition: background-color $transition-fast;

    &:active {
      background-color: rgba($primary-color, 0.05);
    }
  }

  &__comment-text {
    font-size: $font-size-sm;
    color: $text-secondary;
    line-height: 1.4;
    word-break: break-all;
    overflow-wrap: break-word;
    white-space: pre-wrap;
    max-width: 100%;
  }

  &__more-comments {
    @include flex(row, center, center);
    margin-top: 20rpx;
    padding: 20rpx;
    background-color: $bg-light;
    border-radius: $radius-md;
    transition: background-color $transition-fast;

    &:active {
      background-color: $bg-hover;
    }
  }

  &__more-comments-text {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin-right: $spacing-xs;
  }

  &__footer {
    @include flex(row, space-around, center);
    border-top: 1rpx solid $border-light;
    padding-top: $spacing-md;
    margin-top: $spacing-md;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: -1rpx;
      left: 10%;
      right: 10%;
      height: 1rpx;
      background: $border-light;
      border-radius: $radius-circle;
    }
  }

  &__action {
    @include flex(row, center, center);
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-lg;
    transition: all $transition-fast;
    min-width: 120rpx;
    min-height: 60rpx;

    &:active {
      background-color: $bg-light-blue;
      transform: scale(0.95);
    }
  }

  &__count {
    font-size: $font-size-sm;
    color: $text-tertiary;
    margin-left: $spacing-xs;

    &.active {
      color: $primary-color;
      font-weight: 500;
    }
  }
}
</style>