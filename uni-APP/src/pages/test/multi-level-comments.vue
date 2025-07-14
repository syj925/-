<template>
  <view class="test-page">
    <view class="header">
      <text class="title">多级回复和@用户功能测试</text>
    </view>
    
    <view class="content">
      <!-- 测试帖子 -->
      <view class="test-post">
        <view class="post-header">
          <text class="post-title">测试帖子</text>
        </view>
        <view class="post-content">
          <text class="post-text">这是一个用于测试多级回复和@用户功能的帖子。请在下方评论区测试以下功能：</text>
          <view class="feature-list">
            <text class="feature-item">1. 发表顶级评论</text>
            <text class="feature-item">2. 回复其他用户的评论</text>
            <text class="feature-item">3. 使用@功能提及其他用户</text>
            <text class="feature-item">4. 查看多级回复展示</text>
            <text class="feature-item">5. 测试评论点赞功能</text>
          </view>
        </view>
      </view>
      
      <!-- 评论区 -->
      <view class="comment-wrapper">
        <comment-section
          ref="commentSection"
          :post-id="testPostId"
          :max-level="3"
          @scrollToComments="scrollToComments"
        ></comment-section>
      </view>
      
      <!-- 功能测试按钮 -->
      <view class="test-actions">
        <button @tap="createTestPost" class="test-btn">创建测试帖子</button>
        <button @tap="addTestComments" class="test-btn">添加测试评论</button>
        <button @tap="refreshComments" class="test-btn">刷新评论</button>
        <button @tap="testUserSearch" class="test-btn">测试用户搜索</button>
      </view>
      
      <!-- 测试结果 -->
      <view class="test-results" v-if="testResults.length > 0">
        <view class="results-header">
          <text class="results-title">测试结果</text>
        </view>
        <view class="results-list">
          <view 
            class="result-item"
            v-for="(result, index) in testResults"
            :key="index"
            :class="{ success: result.success, error: !result.success }"
          >
            <text class="result-text">{{ result.message }}</text>
            <text class="result-time">{{ result.time }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import CommentSection from '@/components/comment/CommentSection.vue';

export default {
  name: 'MultiLevelCommentsTest',
  components: {
    CommentSection
  },
  data() {
    return {
      testPostId: '4c259eaf-4fce-4c4e-98b7-dfa2a55ebce6', // 使用现有的测试帖子ID
      testResults: []
    };
  },
  onLoad() {
    this.addTestResult('页面加载完成', true);
  },
  methods: {
    // 添加测试结果
    addTestResult(message, success = true) {
      this.testResults.unshift({
        message,
        success,
        time: new Date().toLocaleTimeString()
      });
      
      // 限制结果数量
      if (this.testResults.length > 10) {
        this.testResults = this.testResults.slice(0, 10);
      }
    },
    
    // 创建测试帖子
    async createTestPost() {
      try {
        const response = await this.$api.post.create({
          title: '多级回复测试帖子',
          content: '这是一个专门用于测试多级回复和@用户功能的帖子。',
          category_id: 1
        });
        
        if (response.code === 0) {
          this.testPostId = response.data.id;
          this.addTestResult(`创建测试帖子成功: ${response.data.id}`, true);
          
          // 刷新评论区
          this.$refs.commentSection.refresh();
        } else {
          throw new Error(response.msg);
        }
      } catch (error) {
        console.error('创建测试帖子失败:', error);
        this.addTestResult(`创建测试帖子失败: ${error.message}`, false);
      }
    },
    
    // 添加测试评论
    async addTestComments() {
      const testComments = [
        '这是第一条测试评论',
        '这是第二条测试评论，@testuser 你好',
        '这是第三条测试评论，测试多级回复功能'
      ];
      
      try {
        for (let i = 0; i < testComments.length; i++) {
          const response = await this.$api.comment.create({
            post_id: this.testPostId,
            content: testComments[i]
          });
          
          if (response.code === 0) {
            this.addTestResult(`创建测试评论 ${i + 1} 成功`, true);
          } else {
            throw new Error(`评论 ${i + 1}: ${response.msg}`);
          }
          
          // 延迟一下，避免请求过快
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // 刷新评论列表
        this.$refs.commentSection.refresh();
        
      } catch (error) {
        console.error('添加测试评论失败:', error);
        this.addTestResult(`添加测试评论失败: ${error.message}`, false);
      }
    },
    
    // 刷新评论
    refreshComments() {
      this.$refs.commentSection.refresh();
      this.addTestResult('刷新评论列表', true);
    },
    
    // 测试用户搜索
    async testUserSearch() {
      try {
        const response = await this.$api.user.searchUsers({
          keyword: 'test',
          limit: 5
        });
        
        if (response.code === 0) {
          this.addTestResult(`用户搜索成功，找到 ${response.data.length} 个用户`, true);
          
          // 显示搜索结果
          response.data.forEach(user => {
            this.addTestResult(`用户: ${user.nickname || user.username} (@${user.username})`, true);
          });
        } else {
          throw new Error(response.msg);
        }
      } catch (error) {
        console.error('用户搜索失败:', error);
        this.addTestResult(`用户搜索失败: ${error.message}`, false);
      }
    },
    
    // 滚动到评论区
    scrollToComments() {
      // 实现滚动逻辑
      uni.pageScrollTo({
        selector: '.comment-wrapper',
        duration: 300
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.test-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  background-color: #fff;
  padding: 40rpx 30rpx 30rpx;
  border-bottom: 1px solid #eee;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.content {
  padding: 30rpx;
}

.test-post {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.post-header {
  margin-bottom: 20rpx;
}

.post-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.post-content {
  // 帖子内容样式
}

.post-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.feature-list {
  background-color: #f8f9fa;
  border-radius: 12rpx;
  padding: 20rpx;
}

.feature-item {
  display: block;
  font-size: 26rpx;
  color: #555;
  margin-bottom: 8rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.comment-wrapper {
  margin-bottom: 30rpx;
}

.test-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.test-btn {
  background-color: #007aff;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
}

.test-results {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.results-header {
  background-color: #f8f9fa;
  padding: 20rpx 30rpx;
  border-bottom: 1px solid #eee;
}

.results-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.results-list {
  max-height: 600rpx;
  overflow-y: auto;
}

.result-item {
  padding: 20rpx 30rpx;
  border-bottom: 1px solid #f0f0f0;
  
  &.success {
    border-left: 6rpx solid #28a745;
  }
  
  &.error {
    border-left: 6rpx solid #dc3545;
  }
  
  &:last-child {
    border-bottom: none;
  }
}

.result-text {
  font-size: 26rpx;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.result-time {
  font-size: 22rpx;
  color: #999;
}
</style>
