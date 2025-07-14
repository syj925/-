<template>
  <view class="follow-test-page">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @tap="goBack">
        <text class="iconfont icon-arrow-left"></text>
      </view>
      <view class="nav-title">关注功能测试</view>
      <view class="nav-right"></view>
    </view>
    
    <!-- 内容区 -->
    <view class="content">
      <scroll-view scroll-y class="scroll-view">
        <!-- 测试按钮组 -->
        <view class="test-section">
          <view class="section-title">API测试</view>
          
          <view class="test-buttons">
            <button class="test-btn" @tap="testGetMyFollowings">获取我的关注列表</button>
            <button class="test-btn" @tap="testGetMyFollowers">获取我的粉丝列表</button>
            <button class="test-btn" @tap="testBatchCheck">批量检查关注状态</button>
            <button class="test-btn" @tap="testMutualFollowings">获取互相关注列表</button>
            <button class="test-btn" @tap="testCheckMutual">检查互相关注状态</button>
          </view>
        </view>
        
        <!-- 组件测试 -->
        <view class="test-section">
          <view class="section-title">组件测试</view>
          
          <!-- 关注按钮测试 -->
          <view class="component-test">
            <text class="test-label">关注按钮组件：</text>
            <FollowButton
              :userId="testUserId"
              :isFollowing="testUserFollowing"
              @success="handleFollowSuccess"
              @error="handleFollowError"
            />
          </view>
          
          <!-- 用户卡片测试 -->
          <view class="component-test">
            <text class="test-label">用户卡片组件：</text>
            <UserCard
              :user="testUser"
              :showFollowTime="true"
              @follow-success="handleFollowSuccess"
              @follow-error="handleFollowError"
            />
          </view>
        </view>
        
        <!-- 测试结果 -->
        <view class="test-section">
          <view class="section-title">测试结果</view>
          <view class="result-container">
            <text class="result-text">{{ testResult }}</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import FollowButton from '@/components/FollowButton.vue';
import UserCard from '@/components/UserCard.vue';

export default {
  name: 'FollowTest',
  components: {
    FollowButton,
    UserCard
  },
  
  data() {
    return {
      testResult: '等待测试...',
      testUserId: 'a9cf04c5-ce73-4a37-b7a7-38cf6596b3fd',
      testUserFollowing: false,
      testUser: {
        id: 'a9cf04c5-ce73-4a37-b7a7-38cf6596b3fd',
        nickname: '测试用户',
        username: 'testuser',
        avatar: '',
        bio: '这是一个测试用户的简介',
        school: '测试大学',
        department: '计算机学院',
        postCount: 10,
        followersCount: 100,
        followingCount: 50,
        isFollowing: false,
        followTime: new Date().toISOString()
      }
    };
  },
  
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 测试获取我的关注列表
    async testGetMyFollowings() {
      try {
        this.testResult = '正在测试获取关注列表...';
        const response = await this.$api.follow.getMyFollowings(1, 10);
        this.testResult = `获取关注列表成功：\n${JSON.stringify(response, null, 2)}`;
      } catch (error) {
        this.testResult = `获取关注列表失败：${error.message}`;
      }
    },
    
    // 测试获取我的粉丝列表
    async testGetMyFollowers() {
      try {
        this.testResult = '正在测试获取粉丝列表...';
        const response = await this.$api.follow.getMyFollowers(1, 10);
        this.testResult = `获取粉丝列表成功：\n${JSON.stringify(response, null, 2)}`;
      } catch (error) {
        this.testResult = `获取粉丝列表失败：${error.message}`;
      }
    },
    
    // 测试批量检查关注状态
    async testBatchCheck() {
      try {
        this.testResult = '正在测试批量检查关注状态...';
        // 使用数据库中实际存在的用户ID
        const userIds = [
          '51d0ff31-82e1-4e6d-98f7-3aa8be2cd8ba',
          'a9cf04c5-ce73-4a37-b7a7-38cf6596b3fd',
          'ab36626e-e557-429c-a062-fe4a696af925'
        ];
        const response = await this.$api.follow.batchCheckFollow(userIds);
        this.testResult = `批量检查关注状态成功：\n${JSON.stringify(response, null, 2)}`;
      } catch (error) {
        this.testResult = `批量检查关注状态失败：${error.message}`;
      }
    },
    
    // 测试获取互相关注列表
    async testMutualFollowings() {
      try {
        this.testResult = '正在测试获取互相关注列表...';
        const response = await this.$api.follow.getMyMutualFollowings(1, 10);
        this.testResult = `获取互相关注列表成功：\n${JSON.stringify(response, null, 2)}`;
      } catch (error) {
        this.testResult = `获取互相关注列表失败：${error.message}`;
      }
    },
    
    // 测试检查互相关注状态
    async testCheckMutual() {
      try {
        this.testResult = '正在测试检查互相关注状态...';

        // 使用数据库中确实存在的用户ID进行测试
        const userId1 = 'ab36626e-e557-429c-a062-fe4a696af925';
        const userId2 = 'a9cf04c5-ce73-4a37-b7a7-38cf6596b3fd';

        this.testResult = `正在检查用户 ${userId1} 和 ${userId2} 的互相关注状态...`;
        const response = await this.$api.follow.checkMutualFollow(userId1, userId2);
        this.testResult = `检查互相关注状态成功：\n${JSON.stringify(response, null, 2)}`;
      } catch (error) {
        this.testResult = `检查互相关注状态失败：${error.message || error.msg || JSON.stringify(error)}`;
      }
    },
    
    // 处理关注成功
    handleFollowSuccess(data) {
      this.testResult = `关注操作成功：\n${JSON.stringify(data, null, 2)}`;
      
      // 更新测试用户状态
      if (data.userId === this.testUserId) {
        this.testUserFollowing = data.isFollowing;
        this.testUser.isFollowing = data.isFollowing;
      }
    },
    
    // 处理关注失败
    handleFollowError(data) {
      this.testResult = `关注操作失败：\n${JSON.stringify(data, null, 2)}`;
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.follow-test-page {
  height: 100vh;
  background-color: $bg-color;
}

/* 导航栏 */
.nav-bar {
  @include flex(row, space-between, center);
  height: 88rpx;
  padding: 0 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid $border-color;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.nav-left, .nav-right {
  width: 80rpx;
  height: 60rpx;
  @include center;
}

.nav-left {
  .iconfont {
    font-size: 36rpx;
    color: $text-primary;
  }
}

.nav-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
}

/* 内容区 */
.content {
  margin-top: 88rpx;
  height: calc(100vh - 88rpx);
}

.scroll-view {
  height: 100%;
  padding: 20rpx;
}

/* 测试区块 */
.test-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 20rpx;
  padding-bottom: 10rpx;
  border-bottom: 2rpx solid $border-color;
}

/* 测试按钮 */
.test-buttons {
  @include flex(column, flex-start, stretch);
  gap: 16rpx;
}

.test-btn {
  height: 80rpx;
  background: linear-gradient(135deg, $primary-color, $primary-light);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: $font-size-base;
  font-weight: 500;
  
  &:active {
    transform: scale(0.98);
  }
}

/* 组件测试 */
.component-test {
  margin-bottom: 30rpx;
  
  .test-label {
    display: block;
    font-size: $font-size-base;
    color: $text-secondary;
    margin-bottom: 16rpx;
  }
}

/* 测试结果 */
.result-container {
  background-color: #f8f9fa;
  border-radius: 12rpx;
  padding: 20rpx;
  min-height: 200rpx;
}

.result-text {
  font-size: $font-size-sm;
  color: $text-primary;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
