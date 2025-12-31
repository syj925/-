<template>
  <view class="post-list">
    <!-- 自定义下拉刷新 -->
    <view class="post-list__refresh" :class="{ 'show': refreshing && list.length > 0 }">
      <image
        class="post-list__refresh-icon"
        src="/static/images/common/loading.png"
        :class="{ 'rotate': refreshing }"
      ></image>
      <text class="post-list__refresh-text">{{ refreshText }}</text>
    </view>
    
    <!-- 列表内容 -->
    <template v-if="list.length > 0">
      <post-card
        v-for="(item, index) in list"
        :key="item.id || index"
        :post="item"
        :show-anonymous-badge="showAnonymousBadge"
        @like="handleLike"
        @comment="handleComment"
        @favorite="handleFavorite"
        @share="handleShare"
        @edit="handleEdit"
        @delete="handleDelete"
        @commentLike="handleCommentLike"
        @userClick="handleUserClick"
        @followStatusChange="handleFollowStatusChange"
      ></post-card>
      
      <!-- 加载更多 -->
      <view class="post-list__loading" v-if="loading && !refreshing">
        <image
          class="post-list__loading-icon rotate"
          src="/static/images/common/loading.png"
        ></image>
        <text class="post-list__loading-text">加载中...</text>
      </view>
      
      <!-- 没有更多了 -->
      <view class="post-list__no-more" v-if="finished && !loading">
        <text class="post-list__no-more-text">{{ list.length > 10 ? '没有更多了' : '' }}</text>
      </view>
    </template>
    
    <!-- 空状态 -->
    <view v-else-if="!loading" class="post-list__empty">
      <image class="post-list__empty-icon" src="/static/images/common/empty.png"></image>
      <text class="post-list__empty-text">{{ emptyText }}</text>
      <view class="post-list__empty-action" v-if="showEmptyAction" @tap="handleEmptyAction">
        {{ emptyActionText }}
      </view>
    </view>
  </view>
</template>

<script>
import PostCard from './PostCard.vue';

export default {
  name: 'PostList',
  components: {
    PostCard
  },
  props: {
    // 帖子列表数据
    list: {
      type: Array,
      default: () => []
    },
    // 是否正在加载
    loading: {
      type: Boolean,
      default: false
    },
    // 是否正在刷新
    refreshing: {
      type: Boolean,
      default: false
    },
    // 是否已加载全部
    finished: {
      type: Boolean,
      default: false
    },
    // 空状态文字
    emptyText: {
      type: String,
      default: '暂无内容'
    },
    // 是否显示空状态操作按钮
    showEmptyAction: {
      type: Boolean,
      default: false
    },
    // 空状态操作按钮文字
    emptyActionText: {
      type: String,
      default: '去发布'
    },
    // 是否显示匿名标签（仅在个人主页显示）
    showAnonymousBadge: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isRefreshShown: false
    };
  },
  mounted() {
    // 组件挂载时确保下拉刷新状态正确
    if (this.refreshing) {
      uni.stopPullDownRefresh();
    }
  },
  watch: {
    refreshing(newVal) {
      // 监听刷新状态变化，当refreshing设为false时确保停止下拉刷新
      if (!newVal) {
        uni.stopPullDownRefresh();
      }
    }
  },
  computed: {
    // 根据刷新状态显示不同的文字
    refreshText() {
      return this.refreshing ? '正在刷新...' : '下拉刷新';
    }
  },
  methods: {
    // 点赞
    handleLike(post) {
      this.$emit('like', post);
    },
    
    // 评论
    handleComment(post) {
      this.$emit('comment', post);
    },
    
    // 收藏
    handleFavorite(post) {
      this.$emit('favorite', post);
    },
    
    // 分享
    handleShare(post) {
      this.$emit('share', post);
    },
    
    // 编辑
    handleEdit(post) {
      this.$emit('edit', post);
    },
    
    // 删除
    handleDelete(post) {
      uni.showModal({
        title: '提示',
        content: '确定要删除这条帖子吗？',
        success: res => {
          if (res.confirm) {
            this.$emit('delete', post);
          }
        }
      });
    },
    
    // 空状态操作
    handleEmptyAction() {
      this.$emit('emptyAction');
    },

    // 评论点赞
    handleCommentLike(comment) {
      this.$emit('commentLike', comment);
    },

    // 用户点击
    handleUserClick(user) {
      this.$emit('userClick', user);
    },

    // 关注状态变化（由 PostCard 触发）
    handleFollowStatusChange(payload) {
      this.$emit('followStatusChange', payload);
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.post-list {
  position: relative;
  padding-bottom: $spacing-xl;
  
  &__refresh {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    padding: $spacing-md;
    background-color: $bg-page;
    @include flex(row, center, center);
    opacity: 0; /* 初始不可见 */
    transition: opacity 0.3s, transform 0.3s;
    transform: translateY(-100%);
    
    &.show {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  &__refresh-icon {
    width: 32rpx;
    height: 32rpx;
    margin-right: $spacing-xs;
    
    &.rotate {
      animation: rotate 1s linear infinite;
    }
  }
  
  &__refresh-text {
    font-size: $font-size-sm;
    color: $text-secondary;
  }
  
  &__loading {
    padding: $spacing-lg;
    @include flex(row, center, center);
  }
  
  &__loading-icon {
    width: 32rpx;
    height: 32rpx;
    margin-right: $spacing-xs;
    animation: rotate 1s linear infinite;
  }
  
  &__loading-text {
    font-size: $font-size-sm;
    color: $text-secondary;
  }
  
  &__no-more {
    padding: $spacing-lg;
    @include flex(row, center, center);
  }
  
  &__no-more-text {
    font-size: $font-size-sm;
    color: $text-tertiary;
  }
  
  &__empty {
    padding: 120rpx 0;
    @include flex(column, center, center);
  }
  
  &__empty-icon {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: $spacing-md;
  }
  
  &__empty-text {
    font-size: $font-size-md;
    color: $text-tertiary;
    margin-bottom: $spacing-lg;
  }
  
  &__empty-action {
    padding: $spacing-sm $spacing-lg;
    background: linear-gradient(135deg, $primary-color, $primary-light);
    color: $text-white;
    font-size: $font-size-md;
    border-radius: $radius-md;
    box-shadow: 0 4rpx 16rpx rgba($primary-color, 0.3);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 