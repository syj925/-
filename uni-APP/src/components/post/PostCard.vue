<template>
  <view class="post-card" @tap="goDetail">
    <view class="post-card__header">
      <view class="post-card__user" @tap.stop="onUserClick">
        <image class="post-card__avatar" :src="safeAvatar(post.author)" mode="aspectFill"></image>
        <view class="post-card__info">
          <view class="post-card__name-row">
            <text class="post-card__name">{{ getDisplayName() }}</text>
            <!-- 匿名提示 - 只在个人主页显示 -->
            <view class="post-card__anonymous-badge" v-if="showAnonymousBadge && isAnonymousPost()">
              <text class="post-card__anonymous-text">匿名</text>
            </view>
          </view>
          <view class="post-card__meta">
            <text class="post-card__time">{{ formatTime }}</text>
            <text v-if="post.location" class="post-card__location">{{ post.location }}</text>
          </view>
        </view>
      </view>
      <view class="post-card__more" @tap.stop="onMoreClick">
        <app-icon name="more" color="#666"></app-icon>
      </view>
    </view>
    
    <view class="post-card__content">
      <view class="post-card__title" v-if="post.title">{{ post.title }}</view>
      <view class="post-card__text">{{ post.content }}</view>
      
      <!-- 图片展示区 -->
      <view class="post-card__images" v-if="post.images && post.images.length">
        <view class="post-card__image-container" :class="imageLayoutClass">
          <image 
            v-for="(image, index) in processedImages" 
            :key="index"
            :src="safeImageUrl(image)" 
            mode="aspectFill" 
            class="post-card__image" 
            @tap.stop="previewImage(index)"
          ></image>
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
        <view
          class="post-card__comment-item"
          v-for="(comment, index) in post.hot_comments"
          :key="comment.id"
          @tap.stop="handleCommentLike(comment)"
        >
          <view class="post-card__comment-header">
            <image
              class="post-card__comment-avatar"
              :src="safeCommentAvatar(comment)"
              mode="aspectFill"
              @tap.stop="handleUserClick(comment.author)"
            ></image>
            <view class="post-card__comment-info">
              <text
                class="post-card__comment-name"
                @tap.stop="handleUserClick(comment.author)"
              >{{ safeCommentName(comment) }}</text>
              <text class="post-card__comment-time">{{ formatCommentTime(comment.created_at) }}</text>
            </view>
            <view class="post-card__comment-like" v-if="comment.like_count > 0">
              <app-icon
                name="like"
                size="xs"
                :color="comment.is_liked ? '#FF6B6B' : '#999'"
              ></app-icon>
              <text :class="['post-card__comment-like-count', comment.is_liked ? 'active' : '']">
                {{ comment.like_count }}
              </text>
            </view>
          </view>
          <view class="post-card__comment-content">
            <text class="post-card__comment-text">{{ truncateComment(comment.content) }}</text>
          </view>
        </view>
      </view>

      <!-- 查看更多评论按钮 -->
      <view
        class="post-card__more-comments"
        v-if="post.total_comments > 3"
        @tap.stop="goToComments"
      >
        <text class="post-card__more-comments-text">查看全部 {{ post.total_comments }} 条评论</text>
        <app-icon name="arrow-right" size="xs" color="#999"></app-icon>
      </view>
    </view>

    <view class="post-card__footer">
      <view class="post-card__action" @tap.stop="onLikeClick">
        <app-icon 
          name="like" 
          :customClass="post.isLiked ? 'active' : ''"
          :color="post.isLiked ? '#FF6B6B' : '#666'"
        ></app-icon>
        <text :class="['post-card__count', post.isLiked ? 'active' : '']">{{ post.likeCount || 0 }}</text>
      </view>
      
      <view class="post-card__action" @tap.stop="onCommentClick">
        <app-icon name="comment" color="#666"></app-icon>
        <text class="post-card__count">{{ post.commentCount || 0 }}</text>
      </view>
      
      <view class="post-card__action" @tap.stop="onFavoriteClick">
        <app-icon 
          name="favorite" 
          :customClass="post.isFavorited ? 'active' : ''"
          :color="post.isFavorited ? '#FFCE54' : '#666'"
        ></app-icon>
        <text :class="['post-card__count', post.isFavorited ? 'active' : '']">{{ post.favoriteCount || 0 }}</text>
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
import { formatTimeAgo } from '@/utils/date';
import { ensureAbsoluteUrl } from '@/utils/url';

export default {
  name: 'PostCard',
  components: {
    AppIcon
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
    }
  },
  computed: {
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
    truncateComment(content, maxLength = 50) {
      if (!content) return '';
      if (content.length <= maxLength) return content;
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
  padding: $spacing-lg;
  box-shadow: $shadow-card;
  transition: transform $transition-normal, box-shadow $transition-normal;
  overflow: hidden;
  position: relative;
  
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
    @include flex(row, flex-start, center);
    flex: 1;
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
  
  &__meta {
    @include flex(row, flex-start, center);
  }
  
  &__time, &__location {
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
  
  &__more {
    padding: $spacing-sm;
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
    margin-top: $spacing-md;
    padding-top: $spacing-md;
    border-top: 1px solid $border-light;
  }

  &__comments-title {
    margin-bottom: $spacing-sm;
  }

  &__comments-label {
    font-size: $font-size-sm;
    color: $text-secondary;
    font-weight: 500;
  }

  &__comment-list {
    margin-top: $spacing-xs;
  }

  &__comment-item {
    margin-bottom: $spacing-sm;
    padding: $spacing-sm;
    background-color: $bg-light;
    border-radius: $radius-md;
    transition: background-color $transition-fast;

    &:active {
      background-color: $bg-hover;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__comment-header {
    @include flex(row, space-between, center);
    margin-bottom: $spacing-xs;
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
    margin-left: 72rpx; // 头像宽度 + 间距
  }

  &__comment-text {
    font-size: $font-size-sm;
    color: $text-secondary;
    line-height: 1.4;
  }

  &__more-comments {
    @include flex(row, center, center);
    margin-top: $spacing-sm;
    padding: $spacing-sm;
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
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-lg;
    transition: background-color $transition-fast;
    
    &:active {
      background-color: $bg-light-blue;
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