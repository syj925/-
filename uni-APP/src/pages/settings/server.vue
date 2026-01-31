<template>
  <view class="server-settings-page">
    <!-- 顶部导航栏 -->
    <view class="page-header">
      <view class="header-left" @tap="goBack">
        <text class="iconfont icon-back"></text>
      </view>
      <view class="header-title">服务器设置</view>
      <view class="header-right" @tap="saveSettings">
        <text class="save-btn">保存</text>
      </view>
    </view>
    
    <!-- 设置内容 -->
    <scroll-view scroll-y class="settings-content">
      <!-- 当前服务器信息 -->
      <view class="info-section">
        <view class="section-title">当前服务器</view>
        <view class="server-info">
          <view class="server-item">
            <text class="item-label">地址：</text>
            <text class="item-value">{{ currentServer }}</text>
          </view>
          <view class="server-item">
            <text class="item-label">状态：</text>
            <text :class="['item-value', 'status-' + (serverStatus.online ? 'online' : 'offline')]">
              {{ serverStatus.online ? '在线' : '离线' }}
            </text>
          </view>
          <view class="server-item" v-if="serverStatus.online">
            <text class="item-label">延迟：</text>
            <text class="item-value">{{ serverStatus.latency }}ms</text>
          </view>
        </view>
      </view>
      
      <!-- 自定义服务器设置 -->
      <view class="custom-section">
        <view class="section-title">自定义服务器</view>
        
        <view class="form-item">
          <text class="form-label">服务器地址</text>
          <input 
            type="text" 
            class="form-input" 
            v-model="serverUrl"
            placeholder="例如：http://172.168.2.101:3000"
          />
          <text class="form-tip">服务器地址必须包含协议(http/https)和端口号</text>
        </view>
        
        <button class="test-btn" @tap="testConnection">测试连接</button>
        
        <!-- 服务器预设列表 -->
        <view class="presets-container">
          <view class="section-title">快速选择</view>
          <view 
            v-for="(server, index) in presetServers" 
            :key="index"
            class="preset-item"
            @tap="selectPreset(server)"
          >
            <text class="preset-name">{{ server.name }}</text>
            <text class="preset-url">{{ server.url }}</text>
          </view>
        </view>
      </view>
      
      <!-- 重置按钮 -->
      <button class="reset-btn" @tap="resetSettings">重置为默认服务器</button>
    </scroll-view>
    
    <!-- 加载中蒙层 -->
    <view class="loading-mask" v-if="isLoading">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text>{{ loadingText }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import appConfig from '@/config';

export default {
  data() {
    return {
      currentServer: '',
      serverUrl: '',
      isLoading: false,
      loadingText: '加载中...',
      serverStatus: {
        online: false,
        latency: 0,
        lastCheck: null
      },
      presetServers: [
        {
          name: '主开发服务器',
          url: 'http://172.168.2.101:3000'
        },
        {
          name: '备用服务器1',
          url: 'http://172.168.7.62:3000'
        },
        {
          name: '备用服务器2',
          url: 'http://172.168.9.236:3000'
        },
        {
          name: 'Android模拟器',
          url: 'http://10.0.2.2:3000'
        }
      ]
    };
  },
  
  onLoad() {
    this.loadCurrentSettings();
    this.checkServerStatus();
  },
  
  methods: {
    // 加载当前设置
    loadCurrentSettings() {
      // 获取当前服务器地址
      this.currentServer = this.$api.http.config.baseURL || appConfig.getBestServer();
      
      // 获取用户自定义服务器
      const userServer = appConfig.getUserServer();
      if (userServer) {
        this.serverUrl = userServer;
      }
    },
    
    // 检查服务器状态
    checkServerStatus() {
      this.isLoading = true;
      this.loadingText = '检查服务器状态...';
      
      const startTime = new Date().getTime();
      
      uni.request({
        url: `${this.currentServer}${appConfig.getHealthCheckPath()}`,
        method: 'GET',
        timeout: 5000,
        success: (res) => {
          const endTime = new Date().getTime();
          const latency = endTime - startTime;
          
          this.serverStatus = {
            online: res.statusCode >= 200 && res.statusCode < 300,
            latency: latency,
            lastCheck: new Date()
          };
        },
        fail: (err) => {
          console.error('服务器状态检查失败:', err);
          
          this.serverStatus = {
            online: false,
            latency: 0,
            lastCheck: new Date()
          };
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    },
    
    // 测试服务器连接
    testConnection() {
      if (!this.serverUrl) {
        uni.showToast({
          title: '请输入服务器地址',
          icon: 'none'
        });
        return;
      }
      
      // 验证URL格式
      if (!this.validateUrl(this.serverUrl)) {
        uni.showToast({
          title: '服务器地址格式不正确',
          icon: 'none'
        });
        return;
      }
      
      this.isLoading = true;
      this.loadingText = '测试连接中...';
      
      const startTime = new Date().getTime();
      
      uni.request({
        url: `${this.serverUrl}${appConfig.getHealthCheckPath()}`,
        method: 'GET',
        timeout: 5000,
        success: (res) => {
          const endTime = new Date().getTime();
          const latency = endTime - startTime;
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            uni.showToast({
              title: `连接成功，延迟: ${latency}ms`,
              icon: 'success'
            });
          } else {
            uni.showToast({
              title: `服务器返回错误: ${res.statusCode}`,
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          console.error('连接测试失败:', err);
          
          let errorMsg = '连接失败';
          if (err.errMsg.includes('timeout')) {
            errorMsg = '连接超时';
          } else if (err.errMsg.includes('fail')) {
            errorMsg = '无法连接到服务器';
          }
          
          uni.showToast({
            title: errorMsg,
            icon: 'none'
          });
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    },
    
    // 选择预设服务器
    selectPreset(server) {
      this.serverUrl = server.url;
      
      // 自动测试连接
      this.testConnection();
    },
    
    // 保存设置
    saveSettings() {
      if (!this.serverUrl) {
        uni.showToast({
          title: '请输入服务器地址',
          icon: 'none'
        });
        return;
      }
      
      // 验证URL格式
      if (!this.validateUrl(this.serverUrl)) {
        uni.showToast({
          title: '服务器地址格式不正确',
          icon: 'none'
        });
        return;
      }
      
      this.isLoading = true;
      this.loadingText = '保存设置中...';
      
      // 更新服务器地址
      const success = this.$api.http.updateBaseUrl(this.serverUrl);
      
      if (success) {
        // 更新当前服务器显示
        this.currentServer = this.serverUrl;
        
        // 重新检查服务器状态
        this.checkServerStatus();
        
        uni.showToast({
          title: '设置已保存',
          icon: 'success'
        });
      } else {
        uni.showToast({
          title: '保存设置失败',
          icon: 'none'
        });
      }
      
      this.isLoading = false;
    },
    
    // 重置设置
    resetSettings() {
      uni.showModal({
        title: '确认重置',
        content: '确定要重置服务器设置吗？这将恢复为默认服务器。',
        success: (res) => {
          if (res.confirm) {
            this.isLoading = true;
            this.loadingText = '重置设置中...';
            
            // 重置服务器地址
            const success = this.$api.http.resetBaseUrl();
            
            if (success) {
              // 更新输入框
              this.serverUrl = '';
              
              // 更新当前服务器显示
              this.loadCurrentSettings();
              
              // 重新检查服务器状态
              this.checkServerStatus();
            } else {
              uni.showToast({
                title: '重置设置失败',
                icon: 'none'
              });
            }
            
            this.isLoading = false;
          }
        }
      });
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 验证URL格式
    validateUrl(url) {
      // 简单的URL验证
      return /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(url);
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.server-settings-page {
  min-height: 100vh;
  background-color: $bg-page;
  position: relative;
}

.page-header {
  @include flex(row, space-between, center);
  height: 90rpx;
  background-color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
  
  .header-left {
    padding: 15rpx;
    margin: -15rpx;
    
    .iconfont {
      font-size: 40rpx;
      color: $text-primary;
    }
  }
  
  .header-title {
    font-size: 32rpx;
    font-weight: bold;
    color: $text-primary;
  }
  
  .header-right {
    .save-btn {
      color: $primary-color;
      font-size: 28rpx;
      font-weight: 500;
    }
  }
}

.settings-content {
  padding: 90rpx 0 50rpx;
  height: calc(100vh - 90rpx);
}

.info-section, .custom-section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
  
  .section-title {
    font-size: 28rpx;
    font-weight: bold;
    color: $text-primary;
    margin-bottom: 30rpx;
    border-left: 6rpx solid $primary-color;
    padding-left: 15rpx;
  }
}

.server-info {
  .server-item {
    @include flex(row, flex-start, center);
    margin-bottom: 20rpx;
    
    .item-label {
      font-size: 26rpx;
      color: $text-secondary;
      width: 120rpx;
    }
    
    .item-value {
      font-size: 26rpx;
      color: $text-primary;
      word-break: break-all;
      
      &.status-online {
        color: $success-color;
      }
      
      &.status-offline {
        color: $danger-color;
      }
    }
  }
}

.form-item {
  margin-bottom: 30rpx;
  
  .form-label {
    font-size: 26rpx;
    color: $text-secondary;
    margin-bottom: 15rpx;
    display: block;
  }
  
  .form-input {
    width: 100%;
    height: 80rpx;
    background-color: $bg-light;
    border-radius: $radius-md;
    padding: 0 20rpx;
    font-size: 28rpx;
    color: $text-primary;
  }
  
  .form-tip {
    font-size: 24rpx;
    color: $text-tertiary;
    margin-top: 10rpx;
    display: block;
  }
}

.test-btn {
  width: 100%;
  height: 80rpx;
  background-color: $primary-color;
  color: #fff;
  border-radius: $radius-md;
  font-size: 28rpx;
  @include center;
  margin-bottom: 30rpx;
}

.presets-container {
  margin-top: 30rpx;
  
  .preset-item {
    background-color: $bg-light;
    padding: 20rpx;
    border-radius: $radius-md;
    margin-bottom: 20rpx;
    
    .preset-name {
      font-size: 28rpx;
      color: $text-primary;
      margin-bottom: 10rpx;
      display: block;
    }
    
    .preset-url {
      font-size: 24rpx;
      color: $text-tertiary;
      display: block;
    }
  }
}

.reset-btn {
  width: 90%;
  height: 90rpx;
  background-color: $danger-color;
  color: #fff;
  border-radius: $radius-lg;
  font-size: 32rpx;
  @include center;
  margin: 60rpx auto;
}

.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.3);
  z-index: 999;
  @include center;
  
  .loading-content {
    width: 200rpx;
    height: 200rpx;
    background-color: rgba(0,0,0,0.7);
    border-radius: $radius-lg;
    @include flex(column, center, center);
    
    .loading-spinner {
      width: 60rpx;
      height: 60rpx;
      border: 3rpx solid transparent;
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20rpx;
    }
    
    text {
      font-size: 26rpx;
      color: #fff;
      text-align: center;
      padding: 0 20rpx;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 