<template>
  <view class="test-page">
    <!-- 标题栏 -->
    <view class="header">
      <view class="header-left" @tap="goBack">
        <app-icon name="arrow-left" color="#333"></app-icon>
      </view>
      <view class="header-title">评论点赞功能测试</view>
      <view class="header-right"></view>
    </view>

    <!-- 测试内容 -->
    <view class="content">
      <!-- 测试说明 -->
      <view class="test-section">
        <view class="section-title">测试说明</view>
        <view class="section-desc">
          测试评论点赞功能，包括点赞、取消点赞、检查点赞状态等API接口
        </view>
      </view>

      <!-- 测试按钮组 -->
      <view class="test-section">
        <view class="section-title">API测试</view>
        
        <view class="test-buttons">
          <button class="test-btn" @tap="testLikeComment">点赞评论</button>
          <button class="test-btn" @tap="testUnlikeComment">取消点赞评论</button>
          <button class="test-btn" @tap="testCheckLikeStatus">检查点赞状态</button>
          <button class="test-btn" @tap="testGetUserLikes">获取用户点赞列表</button>
        </view>
      </view>

      <!-- 测试用评论ID输入 -->
      <view class="test-section">
        <view class="section-title">测试数据</view>
        <view class="input-group">
          <text class="input-label">评论ID:</text>
          <input 
            class="test-input" 
            v-model="testCommentId" 
            placeholder="请输入要测试的评论ID"
          />
        </view>
      </view>

      <!-- 测试结果 -->
      <view class="test-section">
        <view class="section-title">测试结果</view>
        <view class="test-result">{{ testResult }}</view>
      </view>
    </view>
  </view>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue';

export default {
  components: {
    AppIcon
  },
  data() {
    return {
      testCommentId: '', // 测试用的评论ID
      testResult: '等待测试...'
    };
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    
    // 测试点赞评论
    async testLikeComment() {
      if (!this.testCommentId) {
        this.testResult = '请先输入评论ID';
        return;
      }
      
      try {
        this.testResult = '正在测试点赞评论...';
        const response = await this.$api.like.like('comment', this.testCommentId);
        this.testResult = `点赞评论成功：\n${JSON.stringify(response, null, 2)}`;
      } catch (error) {
        this.testResult = `点赞评论失败：${error.message || error.msg || JSON.stringify(error)}`;
      }
    },
    
    // 测试取消点赞评论
    async testUnlikeComment() {
      if (!this.testCommentId) {
        this.testResult = '请先输入评论ID';
        return;
      }
      
      try {
        this.testResult = '正在测试取消点赞评论...';
        const response = await this.$api.like.unlike('comment', this.testCommentId);
        this.testResult = `取消点赞评论成功：\n${JSON.stringify(response, null, 2)}`;
      } catch (error) {
        this.testResult = `取消点赞评论失败：${error.message || error.msg || JSON.stringify(error)}`;
      }
    },
    
    // 测试检查点赞状态
    async testCheckLikeStatus() {
      if (!this.testCommentId) {
        this.testResult = '请先输入评论ID';
        return;
      }
      
      try {
        this.testResult = '正在检查点赞状态...';
        const response = await this.$api.like.checkLike('comment', this.testCommentId);
        this.testResult = `检查点赞状态成功：\n${JSON.stringify(response, null, 2)}`;
      } catch (error) {
        this.testResult = `检查点赞状态失败：${error.message || error.msg || JSON.stringify(error)}`;
      }
    },
    
    // 测试获取用户点赞列表
    async testGetUserLikes() {
      try {
        this.testResult = '正在获取用户点赞列表...';
        const response = await this.$api.like.getUserLikes(1, 10);
        this.testResult = `获取用户点赞列表成功：\n${JSON.stringify(response, null, 2)}`;
      } catch (error) {
        this.testResult = `获取用户点赞列表失败：${error.message || error.msg || JSON.stringify(error)}`;
      }
    }
  }
};
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.test-page {
  background-color: $bg-page;
  min-height: 100vh;
}

.header {
  @include flex(row, space-between, center);
  height: 88rpx;
  padding: 0 $spacing-lg;
  background-color: $bg-card;
  border-bottom: 1rpx solid $border-light;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-title {
  font-size: $font-size-lg;
  font-weight: bold;
  color: $text-primary;
}

.content {
  padding: $spacing-lg;
}

.test-section {
  background-color: $bg-card;
  border-radius: $radius-md;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;
  box-shadow: $shadow-sm;
}

.section-title {
  font-size: $font-size-lg;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

.section-desc {
  font-size: $font-size-md;
  color: $text-secondary;
  line-height: 1.5;
}

.test-buttons {
  @include flex(column, flex-start, stretch);
  gap: $spacing-md;
}

.test-btn {
  height: 80rpx;
  background: $primary-gradient;
  color: $text-white;
  border: none;
  border-radius: $radius-md;
  font-size: $font-size-md;
  font-weight: bold;
}

.input-group {
  @include flex(row, flex-start, center);
  margin-bottom: $spacing-md;
}

.input-label {
  font-size: $font-size-md;
  color: $text-primary;
  margin-right: $spacing-md;
  min-width: 120rpx;
}

.test-input {
  flex: 1;
  height: 72rpx;
  background-color: $bg-disabled;
  border-radius: $radius-sm;
  padding: 0 $spacing-md;
  font-size: $font-size-md;
  border: 1rpx solid $border-light;
}

.test-result {
  background-color: $bg-disabled;
  border-radius: $radius-sm;
  padding: $spacing-lg;
  font-size: $font-size-sm;
  color: $text-secondary;
  white-space: pre-wrap;
  word-break: break-all;
  min-height: 200rpx;
  font-family: monospace;
}
</style>
