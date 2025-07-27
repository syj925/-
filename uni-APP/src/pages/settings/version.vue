<template>
  <view class="version-page">
    <!-- 导航栏 -->
    <view class="navbar">
      <view class="navbar-left" @tap="goBack">
        <app-icon name="arrow-left" size="lg" color="#333"></app-icon>
      </view>
      <view class="navbar-title">版本管理</view>
      <view class="navbar-right"></view>
    </view>
    
    <!-- 内容区 -->
    <view class="version-content">
      <!-- 当前版本信息 -->
      <view class="version-section">
        <view class="section-header">
          <view class="section-icon">📱</view>
          <view class="section-title">当前版本</view>
        </view>
        
        <view class="current-version-card">
          <view class="version-info">
            <view class="version-number">{{ localVersion || '未知版本' }}</view>
            <view class="version-status" :class="versionStatusClass">
              {{ versionStatusText }}
            </view>
          </view>
          <view class="version-time" v-if="localUpdateTime">
            更新时间：{{ formatTime(localUpdateTime) }}
          </view>
        </view>
      </view>

      <!-- 远程版本信息 -->
      <view class="version-section" v-if="remoteVersionInfo">
        <view class="section-header">
          <view class="section-icon">☁️</view>
          <view class="section-title">最新版本</view>
        </view>
        
        <view class="remote-version-card">
          <view class="version-info">
            <view class="version-number">{{ remoteVersionInfo.version }}</view>
            <view class="force-update-badge" v-if="remoteVersionInfo.forceUpdate">
              强制更新
            </view>
          </view>
          <view class="version-time">
            发布时间：{{ formatTime(remoteVersionInfo.updateTime) }}
          </view>
          <view class="version-description" v-if="remoteVersionInfo.description">
            <view class="desc-title">更新内容：</view>
            <view class="desc-content">{{ remoteVersionInfo.description }}</view>
          </view>
        </view>
      </view>

      <!-- 更新历史 -->
      <view class="version-section" v-if="updateHistory.length > 0">
        <view class="section-header">
          <view class="section-icon">📋</view>
          <view class="section-title">更新历史</view>
        </view>
        
        <view class="history-list">
          <view 
            class="history-item" 
            v-for="(item, index) in updateHistory" 
            :key="index"
          >
            <view class="history-version">{{ item.version }}</view>
            <view class="history-time">{{ formatTime(item.updateTime) }}</view>
            <view class="history-desc" v-if="item.description">
              {{ item.description }}
            </view>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-section">
        <button 
          class="check-update-btn" 
          @tap="checkForUpdates"
          :disabled="checking"
        >
          <view class="btn-content">
            <view class="btn-icon" v-if="checking">🔄</view>
            <view class="btn-icon" v-else>🔍</view>
            <view class="btn-text">
              {{ checking ? '检查中...' : '检查更新' }}
            </view>
          </view>
        </button>

        <button 
          class="manual-update-btn" 
          @tap="manualUpdate"
          :disabled="updating || !hasUpdate"
          v-if="hasUpdate"
        >
          <view class="btn-content">
            <view class="btn-icon" v-if="updating">⏳</view>
            <view class="btn-icon" v-else>⬇️</view>
            <view class="btn-text">
              {{ updating ? '更新中...' : '立即更新' }}
            </view>
          </view>
        </button>
      </view>

      <!-- 配置信息 -->
      <view class="config-section">
        <view class="config-item">
          <view class="config-label">检查间隔</view>
          <view class="config-value">{{ checkInterval }} 分钟</view>
        </view>
        <view class="config-item">
          <view class="config-label">下载次数</view>
          <view class="config-value">{{ downloadCount }} 次</view>
        </view>
        <view class="config-item">
          <view class="config-label">最后检查</view>
          <view class="config-value">{{ lastCheckTime || '从未检查' }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue';
import configUpdateManager from '@/utils/configUpdateManager';

export default {
  name: 'VersionPage',
  components: {
    AppIcon
  },
  data() {
    return {
      localVersion: '',
      localUpdateTime: '',
      remoteVersionInfo: null,
      updateHistory: [],
      checking: false,
      updating: false,
      hasUpdate: false,
      checkInterval: 5,
      downloadCount: 0,
      lastCheckTime: ''
    };
  },
  computed: {
    versionStatusClass() {
      if (this.hasUpdate) {
        return 'status-outdated';
      } else if (this.remoteVersionInfo) {
        return 'status-latest';
      }
      return 'status-unknown';
    },
    versionStatusText() {
      if (this.hasUpdate) {
        return '有新版本';
      } else if (this.remoteVersionInfo) {
        return '已是最新';
      }
      return '未知状态';
    }
  },
  onLoad() {
    this.loadVersionInfo();
  },
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },

    // 加载版本信息
    async loadVersionInfo() {
      try {
        // 获取本地版本
        this.localVersion = configUpdateManager.getLocalConfigVersion();
        
        // 获取本地缓存的版本信息
        const cached = uni.getStorageSync('cached_config_version');
        if (cached) {
          try {
            const cachedInfo = JSON.parse(cached);
            this.localUpdateTime = cachedInfo.updateTime;
          } catch (e) {
            console.warn('解析缓存版本信息失败:', e);
          }
        }

        // 获取配置信息
        this.loadConfigInfo();
        
        // 获取远程版本信息
        await this.loadRemoteVersion();
        
      } catch (error) {
        console.error('加载版本信息失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none',
          duration: 2000
        });
      }
    },

    // 加载配置信息
    loadConfigInfo() {
      // 检查间隔
      const interval = uni.getStorageSync('config_check_interval');
      if (interval) {
        this.checkInterval = Math.round(interval / 60000);
      }

      // 最后检查时间
      const lastCheck = uni.getStorageSync('last_config_check_time');
      if (lastCheck) {
        this.lastCheckTime = this.formatTime(new Date(lastCheck).toISOString());
      }
    },

    // 加载远程版本信息
    async loadRemoteVersion() {
      try {
        this.remoteVersionInfo = await configUpdateManager.getRemoteVersionInfo();
        
        if (this.remoteVersionInfo) {
          this.downloadCount = this.remoteVersionInfo.downloadCount || 0;
          
          // 检查是否有更新
          this.hasUpdate = configUpdateManager.needsUpdate(
            this.localVersion, 
            this.remoteVersionInfo
          );
        }
      } catch (error) {
        console.error('获取远程版本失败:', error);
      }
    },

    // 检查更新
    async checkForUpdates() {
      if (this.checking) return;
      
      this.checking = true;
      
      try {
        console.log('🔍 手动检查配置更新...');
        
        // 重新获取远程版本
        await this.loadRemoteVersion();
        
        // 更新最后检查时间
        this.lastCheckTime = this.formatTime(new Date().toISOString());
        
        if (this.hasUpdate) {
          uni.showToast({
            title: '发现新版本',
            icon: 'success',
            duration: 2000
          });
        } else {
          uni.showToast({
            title: '已是最新版本',
            icon: 'success',
            duration: 2000
          });
        }
        
      } catch (error) {
        console.error('检查更新失败:', error);
        uni.showToast({
          title: '检查失败',
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.checking = false;
      }
    },

    // 手动更新
    async manualUpdate() {
      if (this.updating || !this.hasUpdate) return;
      
      this.updating = true;
      
      try {
        console.log('⬇️ 手动执行配置更新...');
        
        const success = await configUpdateManager.downloadAndApplyConfig(this.remoteVersionInfo);
        
        if (success) {
          // 更新本地版本信息
          this.localVersion = this.remoteVersionInfo.version;
          this.localUpdateTime = this.remoteVersionInfo.updateTime;
          this.hasUpdate = false;
          
          // 添加到更新历史
          this.updateHistory.unshift({
            version: this.remoteVersionInfo.version,
            updateTime: this.remoteVersionInfo.updateTime,
            description: this.remoteVersionInfo.description
          });
          
          uni.showToast({
            title: '更新成功',
            icon: 'success',
            duration: 2000
          });
          
          // 通知其他页面配置已更新
          uni.$emit('validationRulesUpdated');
          
        } else {
          throw new Error('更新失败');
        }
        
      } catch (error) {
        console.error('手动更新失败:', error);
        uni.showToast({
          title: '更新失败',
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.updating = false;
      }
    },

    // 格式化时间
    formatTime(timeStr) {
      if (!timeStr) return '';
      
      try {
        const date = new Date(timeStr);
        const now = new Date();
        const diff = now - date;
        
        // 小于1分钟
        if (diff < 60000) {
          return '刚刚';
        }
        
        // 小于1小时
        if (diff < 3600000) {
          return `${Math.floor(diff / 60000)}分钟前`;
        }
        
        // 小于1天
        if (diff < 86400000) {
          return `${Math.floor(diff / 3600000)}小时前`;
        }
        
        // 超过1天，显示具体日期
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
      } catch (e) {
        return timeStr;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.version-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

/* 导航栏 */
.navbar {
  @include flex(row, space-between, center);
  height: 88rpx;
  padding: 0 30rpx;
  background: #ffffff;
  border-bottom: 2rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-left, .navbar-right {
  width: 80rpx;
  @include flex(row, center, center);
}

.navbar-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
}

/* 内容区 */
.version-content {
  padding: 40rpx 30rpx;
}

.version-section {
  margin-bottom: 60rpx;
}

.section-header {
  @include flex(row, flex-start, center);
  margin-bottom: 30rpx;
}

.section-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.section-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
}

/* 当前版本卡片 */
.current-version-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  padding: 40rpx;
  color: #ffffff;
  box-shadow: 0 20rpx 40rpx rgba(102, 126, 234, 0.3);
}

.version-info {
  @include flex(row, space-between, center);
  margin-bottom: 20rpx;
}

.version-number {
  font-size: 48rpx;
  font-weight: 700;
}

.version-status {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: $font-size-sm;
  font-weight: 500;
  
  &.status-latest {
    background: rgba(76, 217, 100, 0.2);
    color: #4cd964;
    border: 2rpx solid rgba(76, 217, 100, 0.3);
  }
  
  &.status-outdated {
    background: rgba(255, 149, 0, 0.2);
    color: #ff9500;
    border: 2rpx solid rgba(255, 149, 0, 0.3);
  }
  
  &.status-unknown {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    border: 2rpx solid rgba(255, 255, 255, 0.3);
  }
}

.version-time {
  font-size: $font-size-sm;
  opacity: 0.8;
}

/* 远程版本卡片 */
.remote-version-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  border: 2rpx solid #f0f0f0;
  box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.05);
}

.force-update-badge {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: #ffffff;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: $font-size-sm;
  font-weight: 500;
}

.version-description {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 2rpx solid #f0f0f0;
}

.desc-title {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: 10rpx;
}

.desc-content {
  font-size: $font-size-base;
  color: $text-primary;
  line-height: 1.6;
}

/* 更新历史 */
.history-list {
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  border: 2rpx solid #f0f0f0;
}

.history-item {
  padding: 30rpx;
  border-bottom: 2rpx solid #f8f9fa;
  
  &:last-child {
    border-bottom: none;
  }
}

.history-version {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 10rpx;
}

.history-time {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: 10rpx;
}

.history-desc {
  font-size: $font-size-base;
  color: $text-primary;
  line-height: 1.5;
}

/* 操作按钮 */
.action-section {
  margin-bottom: 60rpx;
}

.check-update-btn, .manual-update-btn {
  width: 100%;
  height: 100rpx;
  border-radius: 50rpx;
  border: none;
  font-size: $font-size-base;
  font-weight: 600;
  margin-bottom: 20rpx;
  transition: all 0.3s ease;
  
  &:disabled {
    opacity: 0.6;
  }
}

.check-update-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  box-shadow: 0 8rpx 25rpx rgba(102, 126, 234, 0.3);
  
  &:active:not(:disabled) {
    transform: translateY(2rpx);
    box-shadow: 0 4rpx 15rpx rgba(102, 126, 234, 0.4);
  }
}

.manual-update-btn {
  background: linear-gradient(135deg, #4cd964 0%, #5ac8fa 100%);
  color: #ffffff;
  box-shadow: 0 8rpx 25rpx rgba(76, 217, 100, 0.3);
  
  &:active:not(:disabled) {
    transform: translateY(2rpx);
    box-shadow: 0 4rpx 15rpx rgba(76, 217, 100, 0.4);
  }
}

.btn-content {
  @include flex(row, center, center);
}

.btn-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.btn-text {
  font-size: $font-size-base;
}

/* 配置信息 */
.config-section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  border: 2rpx solid #f0f0f0;
}

.config-item {
  @include flex(row, space-between, center);
  padding: 20rpx 0;
  border-bottom: 2rpx solid #f8f9fa;
  
  &:last-child {
    border-bottom: none;
  }
}

.config-label {
  font-size: $font-size-base;
  color: $text-secondary;
}

.config-value {
  font-size: $font-size-base;
  color: $text-primary;
  font-weight: 500;
}
</style>
