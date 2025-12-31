<template>
  <view class="post-detail">
    <!-- 帖子内容 -->
    <view class="post">
      <view class="post-header">
        <view class="post-user">
          <!-- 用户信息区域，独立点击 -->
          <view class="post-user-info" @tap="handleUserClick">
            <image class="post-avatar" :src="processedAvatarUrl" mode="aspectFill"></image>
            <view class="post-info">
              <view class="post-name">{{ post.nickname || '未知用户' }}</view>
              <view class="post-meta">
                <text class="post-time">{{ formatTime }}</text>
                <text v-if="post.location" class="post-location">{{ post.location }}</text>
              </view>
            </view>
          </view>
          
          <!-- 右侧操作区域 -->
          <view class="post-user-actions">
            <!-- 关注按钮 - 只在非自己的帖子时显示 -->
            <follow-button
              v-if="shouldShowFollowButton"
              :user-id="post.user_id"
              :is-following="post.isFollowing"
              size="small"
              @success="onFollowSuccess"
              class="post-follow-btn"
              @tap.stop
            />
            <view class="post-more" @tap="handleMore">
              <app-icon name="more" color="#666"></app-icon>
            </view>
          </view>
        </view>
      </view>
      
      <view class="post-content">
        <view class="post-title" v-if="post.title">{{ post.title }}</view>
        <view class="post-text">{{ post.content || '暂无内容' }}</view>
        
        <!-- 图片展示区 -->
        <view class="post-images" v-if="post.images && post.images.length">
          <view class="post-image-container" :class="imageLayoutClass">
            <image 
              v-for="(image, index) in processedImages" 
              :key="index"
              :src="image" 
              mode="aspectFill" 
              class="post-image" 
              @tap="previewImage(index)"
            ></image>
          </view>
        </view>
        
        <!-- 话题标签 -->
        <view class="post-tags" v-if="post.tags && post.tags.length">
          <view class="post-tag" v-for="(tag, index) in post.tags" :key="index">
            #{{ tag }}
          </view>
        </view>
      </view>
      
      <view class="post-footer">
        <view class="post-action" @tap="handleLike">
          <app-icon 
            name="like" 
            :customClass="post.isLiked ? 'active' : ''"
            :color="post.isLiked ? '#FF6B6B' : '#666'"
          ></app-icon>
          <text :class="['post-count', post.isLiked ? 'active' : '']">{{ post.likeCount || 0 }}</text>
        </view>
        
        <view class="post-action" @tap="handleScrollToComments">
          <app-icon name="comment" color="#666"></app-icon>
          <text class="post-count">{{ post.commentCount || 0 }}</text>
        </view>
        
        <view class="post-action" @tap="handleFavorite">
          <app-icon 
            name="favorite" 
            :customClass="post.isFavorited ? 'active' : ''"
            :color="post.isFavorited ? '#FFCE54' : '#666'"
          ></app-icon>
          <text :class="['post-count', post.isFavorited ? 'active' : '']">{{ post.favoriteCount || 0 }}</text>
        </view>
        
        <view class="post-action" @tap="handleShare">
          <app-icon name="share" color="#666"></app-icon>
          <text class="post-count">分享</text>
        </view>
      </view>
    </view>
    
    <!-- 增强版评论区 -->
    <enhanced-comment-section
      v-if="post.id"
      ref="commentSection"
      :post-id="post.id"
      @scrollToComments="handleScrollToComments"
    ></enhanced-comment-section>
  </view>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue';
import FollowButton from '@/components/FollowButton.vue';
import EnhancedCommentSection from '@/components/comment/EnhancedCommentSection.vue';
import { formatTimeAgo } from '@/utils/date';
import { UrlUtils } from '@/utils';
import { useUserStore } from '@/store';

export default {
  components: {
    AppIcon,
    FollowButton,
    EnhancedCommentSection
  },
  data() {
    return {
      userStore: useUserStore(),
      // 帖子信息
      post: {
        id: '',
        title: '',
        content: '',
        images: [],
        tags: [],
        likeCount: 0,
        commentCount: 0,
        favoriteCount: 0,
        isLiked: false,
        isFavorited: false,
        isFollowing: false,
        isOwner: false,
        avatar: '',
        nickname: '',
        createTime: '',
        location: ''
      }
    };
  },
  computed: {
    // 格式化时间
    formatTime() {
      return formatTimeAgo(this.post.createTime || Date.now());
    },
    // 图片布局
    imageLayoutClass() {
      const count = this.post.images ? this.post.images.length : 0;
      if (count === 1) return 'single';
      if (count === 2) return 'double';
      if (count === 4) return 'four';
      if (count >= 3) return 'grid';
      return '';
    },
    // 处理后的头像URL
    processedAvatarUrl() {
      return this.post.avatar ? UrlUtils.ensureAbsoluteUrl(this.post.avatar) : '/static/images/common/default-avatar.png';
    },
    // 处理后的图片URL列表
    processedImages() {
      if (!this.post.images || !this.post.images.length) return [];
      return this.post.images.map(image => UrlUtils.ensureAbsoluteUrl(image));
    },
    // 判断是否显示关注按钮
    shouldShowFollowButton() {
      // 不显示关注按钮的情况：
      // 1. 没有用户ID
      // 2. 是自己的帖子
      // 3. 用户未登录
      if (!this.post.user_id) {
        return false;
      }
      
      // 检查用户是否已登录
      const currentUserId = this.userStore.userInfo?.id;
      if (!currentUserId) {
        return false;
      }
      
      // 检查是否是当前用户自己的帖子
      if (currentUserId === this.post.user_id) {
        return false;
      }
      
      return true;
    }
  },
  onLoad(options) {
    // 加载帖子详情
    this.loadPostDetail(options.id);
  },
  onReachBottom() {
    // 页面到底时的处理（已由评论组件内部处理）
  },
  methods: {
    // 处理用户头像/名称点击
    handleUserClick() {
      if (this.post && this.post.user_id) {
        uni.navigateTo({
          url: `/pages/user/user-profile?id=${this.post.user_id}`
        })
      }
    },

    // 关注操作成功回调
    onFollowSuccess(data) {
      // 更新帖子作者的关注状态
      this.post.isFollowing = data.isFollowing;
      
      console.log(`帖子详情页 - 关注状态更新: ${data.isFollowing}`);
    },
    
    // 加载帖子详情
    loadPostDetail(id) {
      uni.showLoading({
        title: '加载中'
      });
      
      this.$api.post.getDetail(id).then(res => {
        // 处理帖子数据
        const postData = res.data;
        this.post = {
          id: postData.id,
          title: postData.title,
          content: postData.content,
          images: postData.images ? postData.images.map(img => img.url) : [],
          tags: postData.topics ? postData.topics.map(topic => topic.name) : [],
          likeCount: postData.like_count || 0,
          commentCount: postData.comment_count || 0,
          favoriteCount: postData.favorite_count || 0,
          isLiked: postData.is_liked || false,
          isFavorited: postData.is_favorited || false,
          isFollowing: postData.author ? postData.author.isFollowing || false : false,
          isOwner: postData.user_id === this.userStore.userInfo?.id,
          user_id: postData.user_id,  // 添加用户ID
          avatar: postData.author ? postData.author.avatar : '',
          nickname: postData.author ? postData.author.nickname || postData.author.username : '未知用户',
          createTime: postData.created_at,
          location: postData.location
        };
        
        uni.hideLoading();
      }).catch(err => {
        console.error('加载帖子详情失败:', err);
        uni.hideLoading();
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      });
    },
    
    // 处理滚动到评论区域
    handleScrollToComments() {
      // 可以在这里添加滚动到评论区域的逻辑
      console.log('滚动到评论区域');
    },
    
    // 点赞帖子
    handleLike() {
      // 检查登录状态
      if (!this.userStore.isLoggedIn) {
        uni.navigateTo({
          url: '/pages/auth/login/index'
        });
        return;
      }
      
      const isLiked = !this.post.isLiked;
      
      // 乐观更新UI
      this.post.isLiked = isLiked;
      this.post.likeCount += isLiked ? 1 : -1;
      
      // 调用API
      if (isLiked) {
        this.$api.like.like('post', this.post.id).catch(err => {
          console.error('点赞失败:', err);
          // 回滚UI更新
          this.post.isLiked = !isLiked;
          this.post.likeCount -= 1;
          uni.showToast({
            title: '点赞失败',
            icon: 'none'
          });
        });
      } else {
        this.$api.like.unlike('post', this.post.id).catch(err => {
          console.error('取消点赞失败:', err);
          // 回滚UI更新
          this.post.isLiked = !isLiked;
          this.post.likeCount += 1;
          uni.showToast({
            title: '取消点赞失败',
            icon: 'none'
          });
        });
      }
    },
    
    // 收藏帖子
    handleFavorite() {
      // 检查登录状态
      if (!this.userStore.isLoggedIn) {
        uni.navigateTo({
          url: '/pages/auth/login/index'
        });
        return;
      }
      
      const isFavorited = !this.post.isFavorited;
      
      // 乐观更新UI
      this.post.isFavorited = isFavorited;
      this.post.favoriteCount += isFavorited ? 1 : -1;
      
      // 调用API
      if (isFavorited) {
        this.$api.favorite.favorite(this.post.id).catch(err => {
          console.error('收藏失败:', err);
          // 回滚UI更新
          this.post.isFavorited = !isFavorited;
          this.post.favoriteCount -= 1;
          uni.showToast({
            title: '收藏失败',
            icon: 'none'
          });
        });
      } else {
        this.$api.favorite.unfavorite(this.post.id).catch(err => {
          console.error('取消收藏失败:', err);
          // 回滚UI更新
          this.post.isFavorited = !isFavorited;
          this.post.favoriteCount += 1;
          uni.showToast({
            title: '取消收藏失败',
            icon: 'none'
          });
        });
      }
    },
    
    // 图片预览
    previewImage(index) {
      if (!this.post.images || !this.post.images.length) return;
      
      // 使用处理后的图片URL进行预览
      uni.previewImage({
        current: index,
        urls: this.processedImages
      });
    },
    
    // 分享
    handleShare() {
      uni.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    },
    
    // 更多操作
    handleMore() {
      // 获取用户信息
      const isOwner = this.post.isOwner || this.post.user_id === this.userStore.userInfo?.id;
      
      if (!isOwner) {
        uni.showActionSheet({
          itemList: ['举报'],
          success: (res) => {
            if (res.tapIndex === 0) {
              // 举报功能
              uni.showToast({
                title: '举报已提交',
                icon: 'none'
              });
            }
          }
        });
      } else {
        uni.showActionSheet({
          itemList: ['编辑', '删除'],
          success: (res) => {
            if (res.tapIndex === 0) {
              // 编辑
              uni.navigateTo({
                url: `/pages/publish/publish?id=${this.post.id}`
              });
            } else if (res.tapIndex === 1) {
              // 删除
              uni.showModal({
                title: '提示',
                content: '确定要删除这条帖子吗？',
                success: (res) => {
                  if (res.confirm) {
                    uni.showLoading({
                      title: '删除中'
                    });
                    
                    this.$api.post.delete(this.post.id).then(() => {
                      uni.hideLoading();
                      uni.showToast({
                        title: '删除成功',
                        icon: 'success'
                      });
                      
                      // 返回上一页
                      setTimeout(() => {
                        uni.navigateBack();
                      }, 1500);
                    }).catch(err => {
                      uni.hideLoading();
                      console.error('删除失败:', err);
                      uni.showToast({
                        title: '删除失败，请重试',
                        icon: 'none'
                      });
                    });
                  }
                }
              });
            }
          }
        });
      }
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.post-detail {
  background-color: $bg-page;
  min-height: 100vh;
}

/* 帖子 */
.post {
  background-color: $bg-card;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
}

.post-header {
  @include flex(row, space-between, flex-start);
  margin-bottom: $spacing-md;
}

.post-user {
  @include flex(row, space-between, center);
  flex: 1;
}

.post-user-info {
  @include flex(row, flex-start, center);
  flex: 1;
  padding: $spacing-xs;
  border-radius: $radius-md;
  transition: background-color $transition-fast;

  &:active {
    background-color: $bg-light;
  }
}

.post-user-actions {
  @include flex(row, center, center);
  margin-left: $spacing-sm;
}

.post-follow-btn {
  margin-right: $spacing-xs;
}

.post-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: $spacing-sm;
  background-color: $bg-disabled;
}

.post-info {
  flex: 1;
}

.post-name {
  font-size: $font-size-md;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: 4rpx;
}

.post-meta {
  @include flex(row, flex-start, center);
}

.post-time, .post-location {
  font-size: $font-size-xs;
  color: $text-tertiary;
}

.post-location {
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

.post-more {
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

.post-content {
  margin-bottom: $spacing-md;
}

.post-title {
  font-size: $font-size-lg;
  font-weight: bold;
  color: $text-primary;
  line-height: 1.4;
  margin-bottom: $spacing-xs;
}

.post-text {
  font-size: $font-size-md;
  color: $text-primary;
  line-height: 1.6;
  margin-bottom: $spacing-md;
  white-space: pre-wrap;
  word-break: break-all;
}

.post-images {
  margin: $spacing-sm 0 $spacing-md;
}

.post-image-container {
  display: flex;
  flex-wrap: wrap;
  
  &.single {
    .post-image {
      width: 100%;
      height: 400rpx;
      border-radius: $radius-sm;
    }
  }
  
  &.double {
    justify-content: space-between;
    
    .post-image {
      width: 49%;
      height: 300rpx;
      border-radius: $radius-sm;
    }
  }
  
  &.grid {
    justify-content: space-between;
    
    .post-image {
      width: 32%;
      height: 240rpx;
      margin-bottom: $spacing-xs;
      border-radius: $radius-sm;
    }
  }
  
  &.four {
    justify-content: space-between;
    flex-wrap: wrap;
    
    .post-image {
      width: 49%;
      height: 240rpx;
      margin-bottom: $spacing-xs;
      border-radius: $radius-sm;
    }
  }
}

.post-tags {
  @include flex(row, flex-start, center);
  flex-wrap: wrap;
  margin-top: $spacing-xs;
}

.post-tag {
  font-size: $font-size-xs;
  color: $primary-color;
  background-color: rgba($primary-color, 0.1);
  padding: 4rpx 16rpx;
  border-radius: 30rpx;
  margin-right: $spacing-sm;
  margin-bottom: $spacing-xs;
}

.post-footer {
  @include flex(row, space-around, center);
  border-top: 1rpx solid $border-light;
  padding-top: $spacing-md;
  margin-top: $spacing-md;
}

.post-action {
  @include flex(row, center, center);
}

.post-count {
  font-size: $font-size-sm;
  color: $text-tertiary;
  margin-left: $spacing-xs;
  
  &.active {
    color: $primary-color;
  }
}


</style> 