<template>
  <view class="test-page">
    <view class="header">
      <text class="title">多级回复和@用户功能测试</text>
    </view>
    
    <view class="content">
      <!-- 测试结果 -->
      <view class="test-results">
        <view class="results-header">
          <text class="results-title">API测试结果</text>
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
      
      <!-- 功能测试按钮 -->
      <view class="test-actions">
        <button @tap="testUserSearch" class="test-btn">测试用户搜索</button>
        <button @tap="testCreateComment" class="test-btn">测试创建评论</button>
        <button @tap="testCreateReply" class="test-btn">测试创建回复</button>
        <button @tap="testGetRepliesTree" class="test-btn">测试回复树</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'SimpleTest',
  data() {
    return {
      testPostId: '4c259eaf-4fce-4c4e-98b7-dfa2a55ebce6',
      testResults: [],
      lastCommentId: null
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
    
    // 测试用户搜索
    async testUserSearch() {
      try {
        const response = await this.$api.user.searchUsers({
          keyword: 'test',
          limit: 5
        });
        
        if (response.code === 0) {
          this.addTestResult(`用户搜索成功，找到 ${response.data.length} 个用户`, true);
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
    
    // 测试创建评论
    async testCreateComment() {
      try {
        const response = await this.$api.comment.create({
          post_id: this.testPostId,
          content: '这是一条测试评论，@testuser 你好！测试@用户功能。'
        });
        
        if (response.code === 0) {
          this.lastCommentId = response.data.id;
          this.addTestResult(`创建评论成功: ${response.data.id}`, true);
          this.addTestResult(`回复层级: L${response.data.reply_level}`, true);
          this.addTestResult(`@用户数量: ${response.data.mentioned_users ? response.data.mentioned_users.length : 0}`, true);
        } else {
          throw new Error(response.msg);
        }
      } catch (error) {
        console.error('创建评论失败:', error);
        this.addTestResult(`创建评论失败: ${error.message}`, false);
      }
    },
    
    // 测试创建回复
    async testCreateReply() {
      if (!this.lastCommentId) {
        this.addTestResult('请先创建一条评论', false);
        return;
      }
      
      try {
        const response = await this.$api.comment.create({
          post_id: this.testPostId,
          reply_to: this.lastCommentId,
          content: '这是一条回复，@testuser 测试多级回复功能。'
        });
        
        if (response.code === 0) {
          this.addTestResult(`创建回复成功: ${response.data.id}`, true);
          this.addTestResult(`回复层级: L${response.data.reply_level}`, true);
          this.addTestResult(`根评论ID: ${response.data.root_comment_id}`, true);
          this.addTestResult(`@用户数量: ${response.data.mentioned_users ? response.data.mentioned_users.length : 0}`, true);
        } else {
          throw new Error(response.msg);
        }
      } catch (error) {
        console.error('创建回复失败:', error);
        this.addTestResult(`创建回复失败: ${error.message}`, false);
      }
    },
    
    // 测试获取回复树
    async testGetRepliesTree() {
      if (!this.lastCommentId) {
        this.addTestResult('请先创建一条评论', false);
        return;
      }
      
      try {
        const response = await this.$api.comment.getRepliesTree(this.lastCommentId, 3);
        
        if (response.code === 0) {
          this.addTestResult(`获取回复树成功`, true);
          this.addTestResult(`回复树节点数: ${response.data.length}`, true);
          
          // 显示回复树结构
          this.displayTree(response.data, 0);
        } else {
          throw new Error(response.msg);
        }
      } catch (error) {
        console.error('获取回复树失败:', error);
        this.addTestResult(`获取回复树失败: ${error.message}`, false);
      }
    },
    
    // 显示回复树结构
    displayTree(comments, level) {
      comments.forEach(comment => {
        const indent = '  '.repeat(level);
        this.addTestResult(`${indent}├─ L${comment.reply_level}: ${comment.content.substring(0, 20)}...`, true);
        if (comment.children && comment.children.length > 0) {
          this.displayTree(comment.children, level + 1);
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.test-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
}

.header {
  background-color: #fff;
  padding: 40rpx 30rpx 30rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.content {
  // 内容样式
}

.test-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.test-btn {
  background-color: #5B8EF9;
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
  margin-bottom: 20rpx;
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
}

.result-item.success {
  border-left: 6rpx solid #28a745;
}

.result-item.error {
  border-left: 6rpx solid #dc3545;
}

.result-item:last-child {
  border-bottom: none;
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
