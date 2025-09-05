<template>
  <view class="log-demo">
    <view class="header">
      <text class="title">校园墙日志工具</text>
    </view>
    
    <!-- 日志收集状态 -->
    <view class="status-section">
      <view class="status-card" :class="{ 'status-enabled': status.isEnabled, 'status-disabled': !status.isEnabled }">
        <view class="status-header">
          <text class="status-icon">{{ status.isEnabled ? '🟢' : '🔴' }}</text>
          <text class="status-text">{{ status.isEnabled ? '日志收集：已开启' : '日志收集：已关闭' }}</text>
        </view>
        <view class="status-info" v-if="status.isEnabled">
          <text class="status-detail">已收集 {{ status.totalLogs }} 条日志</text>
          <text class="status-detail" v-if="status.enableTime">
            开启时间：{{ formatTime(status.enableTime) }}
          </text>
        </view>
        <view class="status-info" v-else>
          <text class="status-detail">点击下方按钮开始收集日志</text>
        </view>
      </view>
    </view>
    
    <!-- 控制按钮 -->
    <view class="control-section">
      <button v-if="!status.isEnabled" @click="enableLogging" class="btn enable">
        🟢 开启日志收集
      </button>
      <button v-else @click="disableLogging" class="btn disable">
        🔴 关闭日志收集
      </button>
    </view>
    
    <view class="log-buttons">
      <button @click="testDebugLog" class="btn debug">调试日志</button>
      <button @click="testInfoLog" class="btn info">信息日志</button>
      <button @click="testWarnLog" class="btn warn">警告日志</button>
      <button @click="testErrorLog" class="btn error">错误日志</button>
      <button @click="testNetworkLog" class="btn network">网络日志</button>
      <button @click="testUserActionLog" class="btn action">用户行为</button>
    </view>
    
    <view class="log-actions">
      <button @click="exportLogs" class="btn export">导出日志</button>
      <button @click="clearLogs" class="btn clear">清除日志</button>
      <button @click="uploadLogs" class="btn upload">上传日志</button>
    </view>
    
    
    <view class="log-display">
      <text class="log-title">
        最近日志 (共{{ logs.length }}条)
        <text v-if="!status.isEnabled" class="log-subtitle"> - 未收集</text>
      </text>
      <scroll-view scroll-y class="log-list">
        <view v-for="(log, index) in recentLogs" :key="index" 
              :class="['log-item', `log-${log.level.toLowerCase()}`]">
          <text class="log-time">{{ log.timestamp }}</text>
          <text class="log-level">[{{ log.level }}]</text>
          <text class="log-message">{{ log.message }}</text>
          <text v-if="log.data" class="log-data">{{ JSON.stringify(log.data) }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'LogDemo',
  data() {
    return {
      logs: [],
      status: {
        isEnabled: false,
        enableTime: null,
        totalLogs: 0,
        maxLogs: 1000,
        collectionDuration: 0
      }
    }
  },
  
  computed: {
    recentLogs() {
      return this.logs.slice(-20).reverse(); // 显示最近20条，最新的在上面
    }
  },
  
  onLoad() {
    this.$logger.info('进入日志工具页面');
    this.refreshStatus();
    this.refreshLogs();
  },
  
  onUnload() {
    this.$logger.info('离开日志演示页面');
  },
  
  methods: {
    // 刷新日志显示
    refreshLogs() {
      this.logs = this.$logger.getAllLogs();
      this.refreshStatus(); // 同时刷新状态
    },

    // 刷新状态
    refreshStatus() {
      this.status = this.$logger.getStatus();
    },

    // 开启日志收集
    enableLogging() {
      const success = this.$logger.enableLogging();
      if (success) {
        this.refreshStatus();
        this.refreshLogs();
        uni.showToast({
          title: '🟢 日志收集已开启',
          icon: 'none',
          duration: 2000
        });
      }
    },

    // 关闭日志收集
    disableLogging() {
      uni.showModal({
        title: '确认关闭',
        content: '关闭后将停止收集新的日志，确定要关闭吗？',
        success: (res) => {
          if (res.confirm) {
            const success = this.$logger.disableLogging();
            if (success) {
              this.refreshStatus();
              this.refreshLogs();
              uni.showToast({
                title: '🔴 日志收集已关闭',
                icon: 'none',
                duration: 2000
              });
            }
          }
        }
      });
    },

    // 格式化时间
    formatTime(timeString) {
      if (!timeString) return '';
      const date = new Date(timeString);
      return date.toLocaleString();
    },
    
    // 测试调试日志
    testDebugLog() {
      this.$logger.debug('这是一条调试信息', { 
        component: 'LogDemo',
        action: 'testDebugLog',
        timestamp: Date.now()
      });
      this.refreshLogs();
    },
    
    // 测试信息日志
    testInfoLog() {
      this.$logger.info('用户查看了日志演示页面', {
        page: 'log-demo',
        userAgent: navigator.userAgent
      });
      this.refreshLogs();
    },
    
    // 测试警告日志
    testWarnLog() {
      this.$logger.warn('检测到潜在问题', {
        issue: '内存使用率较高',
        threshold: '80%',
        current: '85%'
      });
      this.refreshLogs();
    },
    
    // 测试错误日志
    testErrorLog() {
      try {
        // 故意创建一个错误
        const obj = null;
        obj.someProperty.doSomething();
      } catch (error) {
        this.$logger.error('模拟错误测试', error);
      }
      this.refreshLogs();
    },
    
    // 测试网络日志
    testNetworkLog() {
      const startTime = Date.now();
      
      // 模拟网络请求
      setTimeout(() => {
        const duration = Date.now() - startTime;
        this.$logger.network('GET', '/api/posts', 200, duration, {
          page: 1,
          pageSize: 10
        });
        this.refreshLogs();
      }, Math.random() * 1000 + 500); // 随机延迟500-1500ms
    },
    
    // 测试用户行为日志
    testUserActionLog() {
      this.$logger.userAction('点击', '测试按钮', {
        buttonType: 'userAction',
        coordinates: { x: 100, y: 200 }
      });
      this.refreshLogs();
    },
    
    // 导出日志
    exportLogs() {
      this.$logger.exportLogs();
      uni.showToast({
        title: '日志已导出',
        icon: 'success'
      });
    },
    
    // 清除日志
    clearLogs() {
      uni.showModal({
        title: '确认清除',
        content: '确定要清除所有日志吗？',
        success: (res) => {
          if (res.confirm) {
            this.$logger.clearLogs();
            this.refreshLogs();
            uni.showToast({
              title: '日志已清除',
              icon: 'success'
            });
          }
        }
      });
    },
    
    // 上传日志
    async uploadLogs() {
      try {
        await this.$logger.uploadLogs();
        uni.showToast({
          title: '上传成功',
          icon: 'success'
        });
        this.refreshLogs();
      } catch (error) {
        uni.showToast({
          title: '上传失败',
          icon: 'error'
        });
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.log-demo {
  padding: 20rpx;
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  text-align: center;
  margin-bottom: 40rpx;
  
  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

/* 状态卡片 */
.status-section {
  margin-bottom: 40rpx;
}

.status-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  border: 2rpx solid #f0f0f0;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  
  &.status-enabled {
    border-color: #52c41a;
    background: linear-gradient(135deg, #f6ffed 0%, #ffffff 100%);
  }
  
  &.status-disabled {
    border-color: #ff4d4f;
    background: linear-gradient(135deg, #fff2f0 0%, #ffffff 100%);
  }
}

.status-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.status-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.status-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.status-detail {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

/* 控制按钮 */
.control-section {
  margin-bottom: 40rpx;
  
  .btn {
    width: 100%;
    height: 88rpx;
    border-radius: 12rpx;
    font-size: 32rpx;
    font-weight: bold;
    border: none;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
    
    &.enable {
      background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
      color: white;
      
      &:active {
        background: linear-gradient(135deg, #389e0d 0%, #52c41a 100%);
      }
    }
    
    &.disable {
      background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
      color: white;
      
      &:active {
        background: linear-gradient(135deg, #cf1322 0%, #ff4d4f 100%);
      }
    }
  }
}

.log-buttons, .log-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 40rpx;
  
  .btn {
    flex: 1;
    min-width: 200rpx;
    height: 80rpx;
    border-radius: 8rpx;
    color: white;
    font-size: 28rpx;
    border: none;
    
    &.debug { background: #607D8B; }
    &.info { background: #2196F3; }
    &.warn { background: #FF9800; }
    &.error { background: #F44336; }
    &.network { background: #9C27B0; }
    &.action { background: #4CAF50; }
    &.export { background: #00BCD4; }
    &.clear { background: #795548; }
    &.upload { background: #FF5722; }
  }
}

.log-display {
  background: white;
  border-radius: 12rpx;
  padding: 20rpx;
  
  .log-title {
    display: block;
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
  }
  
  .log-subtitle {
    font-size: 26rpx;
    color: #999;
    font-weight: normal;
  }
  
  .log-list {
    height: 600rpx;
    
    .log-item {
      padding: 16rpx;
      margin-bottom: 12rpx;
      border-radius: 8rpx;
      border-left: 6rpx solid;
      
      &.log-debug {
        background: #f1f3f4;
        border-color: #607D8B;
      }
      
      &.log-info {
        background: #e3f2fd;
        border-color: #2196F3;
      }
      
      &.log-warn {
        background: #fff3e0;
        border-color: #FF9800;
      }
      
      &.log-error {
        background: #ffebee;
        border-color: #F44336;
      }
      
      &.log-network {
        background: #f3e5f5;
        border-color: #9C27B0;
      }
      
      &.log-action {
        background: #e8f5e8;
        border-color: #4CAF50;
      }
      
      .log-time {
        display: block;
        font-size: 24rpx;
        color: #666;
        margin-bottom: 8rpx;
      }
      
      .log-level {
        display: inline-block;
        font-size: 24rpx;
        font-weight: bold;
        color: #333;
        margin-right: 12rpx;
      }
      
      .log-message {
        font-size: 28rpx;
        color: #333;
        line-height: 1.4;
      }
      
      .log-data {
        display: block;
        font-size: 24rpx;
        color: #666;
        margin-top: 8rpx;
        background: rgba(0,0,0,0.05);
        padding: 8rpx;
        border-radius: 4rpx;
        word-break: break-all;
      }
    }
  }
}
</style>
