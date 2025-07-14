<template>
  <view class="network-test">
    <view class="header">
      <text class="title">网络连接测试</text>
    </view>
    
    <view class="section">
      <button type="primary" @click="testApiConnection">测试API连接</button>
      <text v-if="apiResult" class="result">{{apiResult}}</text>
    </view>
    
    <view class="section">
      <button type="primary" @click="testDirectConnection">测试直接连接</button>
      <text v-if="directResult" class="result">{{directResult}}</text>
    </view>
    
    <view class="section">
      <button type="primary" @click="testWebSocketConnection">测试WebSocket连接</button>
      <text v-if="wsResult" class="result">{{wsResult}}</text>
    </view>
    
    <view class="section logs">
      <text class="section-title">日志输出:</text>
      <scroll-view scroll-y class="log-container">
        <text v-for="(log, index) in logs" :key="index" class="log-item">{{log}}</text>
      </scroll-view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      apiResult: '',
      directResult: '',
      wsResult: '',
      logs: []
    }
  },
  
  methods: {
    // 添加日志
    addLog(message) {
      const timestamp = new Date().toLocaleTimeString();
      this.logs.unshift(`${timestamp}: ${message}`);
    },
    
    // 测试API连接
    async testApiConnection() {
      this.apiResult = '测试中...';
      this.addLog('开始API连接测试');
      
      try {
        const result = await this.$api.user.getInfo();
        this.apiResult = '连接成功: ' + JSON.stringify(result);
        this.addLog('API连接成功: ' + JSON.stringify(result));
      } catch (error) {
        this.apiResult = '连接失败: ' + JSON.stringify(error);
        this.addLog('API连接失败: ' + JSON.stringify(error));
      }
    },
    
    // 测试直接网络连接
    testDirectConnection() {
      this.directResult = '测试中...';
      this.addLog('开始直接连接测试');
      
      // 直接使用uni.request进行测试
      uni.request({
        url: 'http://172.168.3.171:3000/health',
        method: 'GET',
        success: (res) => {
          this.directResult = '连接成功: ' + JSON.stringify(res.data);
          this.addLog('直接连接成功: ' + JSON.stringify(res.data));
        },
        fail: (err) => {
          this.directResult = '连接失败: ' + JSON.stringify(err);
          this.addLog('直接连接失败: ' + JSON.stringify(err));
          
          // 尝试检查错误原因
          if (err.errMsg && err.errMsg.includes('scheme')) {
            this.addLog('检测到URL协议问题，尝试修复...');
            
            // 确保正确的URL格式
            const url = 'http://172.168.3.171:3000/health';
            
            // 再次尝试
            uni.request({
              url: url,
              method: 'GET',
              success: (res) => {
                this.directResult = '重试连接成功: ' + JSON.stringify(res.data);
                this.addLog('重试连接成功: ' + JSON.stringify(res.data));
              },
              fail: (retryErr) => {
                this.directResult = '重试连接失败: ' + JSON.stringify(retryErr);
                this.addLog('重试连接失败: ' + JSON.stringify(retryErr));
              }
            });
          }
        }
      });
    },
    
    // 测试WebSocket连接
    testWebSocketConnection() {
      this.wsResult = '测试中...';
      this.addLog('开始WebSocket连接测试');
      
      const token = uni.getStorageSync('token');
      if (!token) {
        this.wsResult = '未登录，无法测试WebSocket连接';
        this.addLog('未登录，无法测试WebSocket连接');
        return;
      }
      
      // 使用WebSocket客户端进行测试
      this.$ws.connect(token)
        .then(() => {
          this.wsResult = 'WebSocket连接成功';
          this.addLog('WebSocket连接成功');
        })
        .catch(err => {
          this.wsResult = 'WebSocket连接失败: ' + JSON.stringify(err);
          this.addLog('WebSocket连接失败: ' + JSON.stringify(err));
        });
    }
  }
}
</script>

<style lang="scss" scoped>
.network-test {
  padding: 20px;
  
  .header {
    margin-bottom: 30px;
    text-align: center;
    
    .title {
      font-size: 20px;
      font-weight: bold;
    }
  }
  
  .section {
    margin-bottom: 20px;
    
    button {
      margin-bottom: 10px;
    }
    
    .result {
      display: block;
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
      font-size: 14px;
      word-break: break-all;
    }
  }
  
  .logs {
    .section-title {
      display: block;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .log-container {
      height: 200px;
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
      
      .log-item {
        display: block;
        font-size: 12px;
        margin-bottom: 5px;
        word-break: break-all;
      }
    }
  }
}
</style> 