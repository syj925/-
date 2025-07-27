<template>
  <view class="config-test">
    <view class="header">
      <text class="title">配置更新测试</text>
    </view>
    
    <view class="info-section">
      <view class="info-item">
        <text class="label">当前间隔:</text>
        <text class="value">{{ currentInterval }} 分钟</text>
      </view>
      <view class="info-item">
        <text class="label">上次检查:</text>
        <text class="value">{{ lastCheckTime }}</text>
      </view>
      <view class="info-item">
        <text class="label">下次检查:</text>
        <text class="value">{{ nextCheckTime }}</text>
      </view>
      <view class="info-item">
        <text class="label">剩余时间:</text>
        <text class="value">{{ remainingTime }}</text>
      </view>
    </view>
    
    <view class="button-section">
      <button @click="forceCheck" class="btn primary">🔄 强制检查更新</button>
      <button @click="checkInterval" class="btn">⚙️ 检查间隔设置</button>
      <button @click="normalCheck" class="btn">📅 正常检查更新</button>
      <button @click="clearCache" class="btn warning">🗑️ 清除缓存</button>
      <button @click="refreshInfo" class="btn">🔄 刷新信息</button>
    </view>
    
    <view class="log-section">
      <text class="log-title">检查日志:</text>
      <scroll-view class="log-content" scroll-y>
        <view v-for="(log, index) in logs" :key="index" class="log-item">
          <text class="log-time">{{ log.time }}</text>
          <text class="log-message">{{ log.message }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import configUpdateManager from '@/utils/configUpdateManager'

export default {
  data() {
    return {
      currentInterval: 0,
      lastCheckTime: '',
      nextCheckTime: '',
      remainingTime: '',
      logs: [],
      timer: null
    }
  },
  
  onLoad() {
    this.refreshInfo()
    this.startTimer()
  },
  
  onUnload() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },
  
  methods: {
    // 检查间隔设置
    async checkInterval() {
      try {
        this.addLog('开始检查间隔设置...')
        await configUpdateManager.checkAndUpdateInterval()
        this.addLog('间隔设置检查完成')
        this.refreshInfo()
      } catch (error) {
        this.addLog(`间隔检查失败: ${error.message}`)
      }
    },
    
    // 强制检查更新
    async forceCheck() {
      try {
        this.addLog('开始强制检查更新...')
        const hasUpdate = await configUpdateManager.forceCheckForUpdates()
        this.addLog(`强制检查完成，有更新: ${hasUpdate}`)
        this.refreshInfo()
      } catch (error) {
        this.addLog(`强制检查失败: ${error.message}`)
      }
    },
    
    // 正常检查更新
    async normalCheck() {
      try {
        this.addLog('开始正常检查更新...')
        const hasUpdate = await configUpdateManager.checkForUpdates()
        this.addLog(`正常检查完成，有更新: ${hasUpdate}`)
        this.refreshInfo()
      } catch (error) {
        this.addLog(`正常检查失败: ${error.message}`)
      }
    },
    
    // 清除缓存
    clearCache() {
      try {
        uni.removeStorageSync('last_config_check_time')
        uni.removeStorageSync('config_check_interval')
        uni.removeStorageSync('last_force_update_version')
        uni.removeStorageSync('campus_wall_config_cache')

        // 重置间隔为默认值
        configUpdateManager.checkInterval = 5 * 60 * 1000

        this.addLog('缓存已清除，间隔重置为默认5分钟')
        this.refreshInfo()
      } catch (error) {
        this.addLog(`清除缓存失败: ${error.message}`)
      }
    },

    // 刷新信息
    refreshInfo() {
      // 获取当前间隔
      this.currentInterval = Math.round(configUpdateManager.checkInterval / 60000)

      // 获取上次检查时间
      const lastCheck = uni.getStorageSync('last_config_check_time') || 0
      this.lastCheckTime = lastCheck ? new Date(lastCheck).toLocaleString() : '从未检查'

      // 计算下次检查时间
      if (lastCheck) {
        const nextCheck = lastCheck + configUpdateManager.checkInterval
        this.nextCheckTime = new Date(nextCheck).toLocaleString()

        // 计算剩余时间
        const remaining = Math.max(0, nextCheck - Date.now())
        const minutes = Math.floor(remaining / 60000)
        const seconds = Math.floor((remaining % 60000) / 1000)
        this.remainingTime = `${minutes}分${seconds}秒`
      } else {
        this.nextCheckTime = '立即检查'
        this.remainingTime = '0分0秒'
      }
    },
    
    // 添加日志
    addLog(message) {
      const time = new Date().toLocaleTimeString()
      this.logs.unshift({ time, message })
      
      // 只保留最近20条日志
      if (this.logs.length > 20) {
        this.logs = this.logs.slice(0, 20)
      }
    },
    
    // 启动定时器
    startTimer() {
      this.timer = setInterval(() => {
        this.refreshInfo()
      }, 1000) // 每秒更新一次
    }
  }
}
</script>

<style scoped>
.config-test {
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.info-section {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.label {
  font-weight: bold;
}

.value {
  color: #666;
}

.button-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.btn {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
}

.btn.primary {
  background: #007aff;
  color: white;
  border-color: #007aff;
}

.btn.warning {
  background: #ff9500;
  color: white;
  border-color: #ff9500;
}

.log-section {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.log-title {
  display: block;
  padding: 10px;
  background: #f8f8f8;
  font-weight: bold;
  border-bottom: 1px solid #ddd;
}

.log-content {
  height: 200px;
  padding: 10px;
}

.log-item {
  margin-bottom: 8px;
  font-size: 12px;
}

.log-time {
  color: #999;
  margin-right: 10px;
}

.log-message {
  color: #333;
}
</style>
