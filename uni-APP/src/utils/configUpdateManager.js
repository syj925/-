/**
 * 配置更新管理器
 * 负责在应用启动时检查并下载最新的配置文件
 */
import { http } from '@/api/request'
import { rulesVersion, cacheConfig } from '@/config/validation-rules'

class ConfigUpdateManager {
  constructor() {
    this.isChecking = false
    this.lastCheckTime = 0
    this.checkInterval = this.getStoredInterval() // 从本地存储获取间隔，默认5分钟
  }

  /**
   * 获取存储的检查间隔
   * @returns {number} 间隔时间（毫秒）
   */
  getStoredInterval() {
    try {
      const storedInterval = uni.getStorageSync('config_check_interval')
      if (storedInterval && storedInterval > 0) {
        console.log(`📅 使用存储的检查间隔: ${storedInterval / 60000} 分钟`)
        return storedInterval
      }
    } catch (error) {
      console.warn('获取存储的检查间隔失败:', error)
    }

    // 默认5分钟
    const defaultInterval = 5 * 60 * 1000
    console.log(`📅 使用默认检查间隔: 5 分钟`)
    return defaultInterval
  }

  /**
   * 应用启动时检查配置更新
   * @param {boolean} forceCheck 是否强制检查（忽略时间间隔）
   * @returns {Promise<boolean>} 是否有更新
   */
  async checkForUpdates(forceCheck = false) {
    if (this.isChecking) {
      console.log('⏳ 配置更新检查正在进行中...')
      return false
    }

    try {
      this.isChecking = true
      console.log('🔍 开始检查配置文件更新...')

      // 检查是否需要检查更新（避免频繁检查）
      if (!this.shouldCheckForUpdates(forceCheck)) {
        console.log('⏭️ 跳过配置更新检查（距离上次检查时间太短）')
        // 即使跳过检查，也要检查间隔设置是否有变化
        await this.checkAndUpdateInterval()
        return false
      }

      // 获取本地配置版本信息
      const localVersion = this.getLocalConfigVersion()
      console.log('📱 本地配置版本:', localVersion)

      // 检查远程版本信息
      const remoteVersionInfo = await this.getRemoteVersionInfo()
      if (!remoteVersionInfo) {
        console.log('❌ 无法获取远程版本信息')
        return false
      }

      console.log('☁️ 远程配置版本:', remoteVersionInfo.version)
      console.log('🔄 强制更新标志:', remoteVersionInfo.forceUpdate)
      console.log('📊 版本比较详情:', {
        local: localVersion,
        remote: remoteVersionInfo.version,
        forceUpdate: remoteVersionInfo.forceUpdate
      })

      // 比较版本，决定是否需要更新
      if (this.needsUpdate(localVersion, remoteVersionInfo)) {
        console.log('🆕 发现新版本配置，开始下载...')

        // 如果是强制更新，记录日志（静默处理）
        if (remoteVersionInfo.forceUpdate) {
          console.log('🔄 检测到强制更新，静默执行...')
        }

        const success = await this.downloadAndApplyConfig(remoteVersionInfo)

        if (success) {
          console.log('✅ 配置更新成功')
          this.updateLastCheckTime()
          return true
        } else {
          console.log('❌ 配置更新失败')
          return false
        }
      } else {
        console.log('✅ 配置已是最新版本')

        // 即使版本相同，也要检查间隔设置是否有变化
        await this.checkAndUpdateInterval()

        this.updateLastCheckTime()
        return false
      }

    } catch (error) {
      console.error('❌ 检查配置更新时发生错误:', error)
      return false
    } finally {
      this.isChecking = false
    }
  }

  /**
   * 判断是否需要检查更新
   * @param {boolean} forceCheck 是否强制检查
   * @returns {boolean}
   */
  shouldCheckForUpdates(forceCheck = false) {
    // 如果是强制检查，直接返回true
    if (forceCheck) {
      console.log('🔄 强制检查配置更新')
      return true
    }

    const now = Date.now()
    const lastCheck = uni.getStorageSync('last_config_check_time') || 0

    // 如果是首次检查，直接返回true
    if (lastCheck === 0) {
      console.log('🆕 首次检查配置更新')
      return true
    }

    // 如果距离上次检查超过指定间隔
    const timeSinceLastCheck = now - lastCheck
    const shouldCheck = timeSinceLastCheck > this.checkInterval

    if (shouldCheck) {
      console.log(`⏰ 距离上次检查已过 ${Math.round(timeSinceLastCheck / 60000)} 分钟，需要检查更新`)
    } else {
      const remainingTime = Math.round((this.checkInterval - timeSinceLastCheck) / 60000)
      console.log(`⏰ 距离下次检查还有 ${remainingTime} 分钟`)
    }

    return shouldCheck
  }

  /**
   * 获取本地配置版本
   * @returns {string}
   */
  getLocalConfigVersion() {
    try {
      // 先检查缓存中的版本
      const cached = uni.getStorageSync(cacheConfig.storageKey)
      if (cached && cached.version) {
        return cached.version
      }

      // H5模式特殊处理：检查localStorage
      // #ifdef H5
      try {
        const h5Version = localStorage.getItem('campus_wall_config_version')
        if (h5Version) {
          console.log('🌐 从H5 localStorage获取版本:', h5Version)
          return h5Version
        }
      } catch (e) {
        console.warn('H5 localStorage访问失败:', e)
      }
      // #endif

      // 如果没有缓存版本，返回默认版本
      return rulesVersion
    } catch (error) {
      console.warn('获取本地配置版本失败:', error)
      return rulesVersion
    }
  }

  /**
   * 获取远程版本信息
   * @returns {Promise<Object|null>}
   */
  async getRemoteVersionInfo() {
    try {
      const response = await http.get('/api/config-version', {}, {
        timeout: 10000 // 10秒超时
      })
      
      if (response.code === 0 && response.data) {
        return {
          version: response.data.version,
          updateTime: response.data.updateTime,
          description: response.data.description,
          forceUpdate: response.data.forceUpdate || false,
          downloadUrl: response.data.downloadUrl || '/api/content-rules'
        }
      }
      
      return null
    } catch (error) {
      console.warn('获取远程版本信息失败:', error)
      return null
    }
  }

  /**
   * 判断是否需要更新
   * @param {string} localVersion 本地版本
   * @param {Object} remoteInfo 远程版本信息
   * @returns {boolean}
   */
  needsUpdate(localVersion, remoteInfo) {
    const remoteVersion = remoteInfo.version

    // 如果没有本地版本，需要下载
    if (!localVersion) {
      console.log('📥 没有本地版本，需要下载配置')
      return true
    }

    // 首先进行版本比较
    const versionComparison = this.compareVersions(localVersion, remoteVersion)

    // 如果远程版本更新，需要更新
    if (versionComparison < 0) {
      console.log(`🆕 发现新版本: ${localVersion} -> ${remoteVersion}`)
      return true
    }

    // 如果版本相同，检查是否需要强制更新
    if (versionComparison === 0) {
      if (remoteInfo.forceUpdate) {
        // 检查是否已经下载过这个强制更新版本
        let lastForceUpdateVersion = uni.getStorageSync('last_force_update_version')

        // H5模式额外检查localStorage
        // #ifdef H5
        if (!lastForceUpdateVersion) {
          try {
            lastForceUpdateVersion = localStorage.getItem('campus_wall_last_force_update')
            console.log('🌐 从H5 localStorage获取强制更新记录:', lastForceUpdateVersion)
          } catch (e) {
            console.warn('H5 localStorage读取失败:', e)
          }
        }
        // #endif

        if (lastForceUpdateVersion !== remoteVersion) {
          console.log(`🔄 强制更新版本 ${remoteVersion}（首次检测到）`)
          return true
        } else {
          console.log(`✅ 强制更新版本 ${remoteVersion} 已处理过，跳过`)
          return false
        }
      } else {
        console.log(`✅ 版本 ${remoteVersion} 已是最新且无强制更新`)
        return false
      }
    }

    // 如果本地版本更新（理论上不应该发生）
    console.log(`⚠️ 本地版本 ${localVersion} 比远程版本 ${remoteVersion} 更新`)
    return false
  }

  /**
   * 版本比较
   * @param {string} version1 
   * @param {string} version2 
   * @returns {number} -1: version1 < version2, 0: 相等, 1: version1 > version2
   */
  compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length)
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0
      
      if (v1Part < v2Part) return -1
      if (v1Part > v2Part) return 1
    }
    
    return 0
  }

  /**
   * 下载并应用新配置
   * @param {Object} remoteInfo 远程版本信息
   * @returns {Promise<boolean>}
   */
  async downloadAndApplyConfig(remoteInfo) {
    try {
      console.log('📥 正在下载配置文件...')
      
      const response = await http.get(remoteInfo.downloadUrl, {}, {
        timeout: 30000 // 30秒超时
      })
      
      if (response.code === 0 && response.data) {
        // 验证下载的配置文件
        if (this.validateConfig(response.data)) {
          // 保存新配置到本地缓存
          uni.setStorageSync(cacheConfig.storageKey, {
            rules: response.data,
            timestamp: Date.now(),
            version: remoteInfo.version,
            updateTime: remoteInfo.updateTime,
            description: remoteInfo.description
          })

          // H5模式额外保存到localStorage（增强持久性）
          // #ifdef H5
          try {
            localStorage.setItem('campus_wall_config_version', remoteInfo.version)
            localStorage.setItem('campus_wall_config_data', JSON.stringify({
              rules: response.data,
              timestamp: Date.now(),
              version: remoteInfo.version,
              updateTime: remoteInfo.updateTime,
              description: remoteInfo.description
            }))
            console.log('🌐 H5模式额外保存到localStorage')
          } catch (e) {
            console.warn('H5 localStorage保存失败:', e)
          }
          // #endif

          // 如果是强制更新，记录已处理的版本
          if (remoteInfo.forceUpdate) {
            uni.setStorageSync('last_force_update_version', remoteInfo.version)

            // H5模式额外保存到localStorage
            // #ifdef H5
            try {
              localStorage.setItem('campus_wall_last_force_update', remoteInfo.version)
              console.log(`🌐 H5模式额外记录强制更新版本: ${remoteInfo.version}`)
            } catch (e) {
              console.warn('H5 localStorage保存强制更新记录失败:', e)
            }
            // #endif

            console.log(`🔄 已记录强制更新版本: ${remoteInfo.version}`)
          }

          // 更新检查间隔（如果配置中有设置）
          if (response.data.configUpdateInterval) {
            const newInterval = response.data.configUpdateInterval * 60 * 1000 // 转换为毫秒
            if (newInterval !== this.checkInterval) {
              this.checkInterval = newInterval
              uni.setStorageSync('config_check_interval', newInterval)
              console.log(`⏰ 更新检查间隔: ${response.data.configUpdateInterval} 分钟`)
            }
          }

          console.log('💾 新配置已保存到本地')

          // 触发配置更新事件
          this.notifyConfigUpdated(remoteInfo)

          return true
        } else {
          console.error('❌ 下载的配置文件验证失败')
          return false
        }
      } else {
        console.error('❌ 下载配置文件失败:', response.msg)
        return false
      }
    } catch (error) {
      console.error('❌ 下载配置文件时发生错误:', error)
      return false
    }
  }

  /**
   * 验证配置文件格式
   * @param {Object} config 配置对象
   * @returns {boolean}
   */
  validateConfig(config) {
    if (!config || typeof config !== 'object') {
      console.error('配置文件格式不正确')
      return false
    }

    // 检查必要的字段
    const requiredFields = [
      'minPostLength',
      'maxPostLength',
      'enableSensitiveFilter',
      'sensitiveWords',
      'dailyPostLimit',
      'dailyCommentLimit'
    ]

    for (const field of requiredFields) {
      if (!(field in config)) {
        console.error(`配置文件缺少必要字段: ${field}`)
        return false
      }
    }

    // 检查数据类型
    if (typeof config.minPostLength !== 'number' ||
        typeof config.maxPostLength !== 'number' ||
        typeof config.enableSensitiveFilter !== 'boolean' ||
        !Array.isArray(config.sensitiveWords)) {
      console.error('配置文件数据类型不正确')
      return false
    }

    // 检查数值范围
    if (config.minPostLength < 1 || config.minPostLength > config.maxPostLength) {
      console.error('帖子长度配置不合理')
      return false
    }

    if (config.maxPostLength > 10000) {
      console.error('帖子最大长度超出限制')
      return false
    }

    return true
  }

  /**
   * 通知配置已更新
   * @param {Object} remoteInfo 远程版本信息
   */
  notifyConfigUpdated(remoteInfo) {
    // 发送全局事件
    uni.$emit('configUpdated', {
      version: remoteInfo.version,
      description: remoteInfo.description,
      updateTime: remoteInfo.updateTime
    })
    
    // 静默更新，只记录日志
    if (remoteInfo.description) {
      console.log(`✅ 配置已静默更新: ${remoteInfo.description}`)
    }
  }

  /**
   * 检查并更新间隔设置
   */
  async checkAndUpdateInterval() {
    try {
      const response = await http.get('/api/content-rules', {}, {
        timeout: 10000
      })

      if (response.code === 0 && response.data && response.data.configUpdateInterval) {
        const serverInterval = response.data.configUpdateInterval * 60 * 1000 // 转换为毫秒

        if (serverInterval !== this.checkInterval) {
          this.checkInterval = serverInterval
          uni.setStorageSync('config_check_interval', serverInterval)
          console.log(`⏰ 更新检查间隔: ${response.data.configUpdateInterval} 分钟`)
        }
      }
    } catch (error) {
      console.warn('检查间隔设置失败:', error.message)
    }
  }

  /**
   * 更新最后检查时间
   */
  updateLastCheckTime() {
    uni.setStorageSync('last_config_check_time', Date.now())
  }

  /**
   * 手动触发配置检查（忽略间隔限制）
   */
  async forceCheckForUpdates() {
    console.log('🔄 手动触发配置检查')
    return await this.checkForUpdates(true)
  }

  /**
   * 显示强制更新对话框（已禁用，改为静默更新）
   * @param {Object} versionInfo 版本信息
   */
  showForceUpdateDialog(versionInfo) {
    // 静默更新，不再显示对话框
    console.log(`🔄 强制更新版本 ${versionInfo.version}，静默执行`)
    console.log(`📝 更新内容: ${versionInfo.description}`)

    // 原对话框代码已注释
    /*
    uni.showModal({
      title: '配置强制更新',
      content: `检测到重要配置更新（版本 ${versionInfo.version}），需要立即更新以确保应用正常使用。\n\n更新内容：${versionInfo.description}`,
      showCancel: false,
      confirmText: '立即更新',
      success: (res) => {
        if (res.confirm) {
          console.log('用户确认强制更新')
        }
      }
    })
    */
  }

  /**
   * 强制检查更新（忽略时间间隔）
   * @returns {Promise<boolean>}
   */
  async forceCheckForUpdates() {
    console.log('🔄 执行强制配置更新检查')
    return await this.checkForUpdates(true)
  }

  /**
   * 检查是否有强制更新（用于定期检查）
   * @returns {Promise<boolean>}
   */
  async checkForForceUpdate() {
    try {
      console.log('🔍 检查是否有强制更新...')

      // 获取远程版本信息
      const response = await http.get('/api/config-version', {}, {
        timeout: 10000
      })

      if (response.code === 0 && response.data) {
        const remoteInfo = response.data
        const localVersion = this.getLocalConfigVersion()

        // 如果是强制更新且版本相同，但还没处理过
        if (remoteInfo.forceUpdate && remoteInfo.version === localVersion) {
          const lastForceUpdateVersion = uni.getStorageSync('last_force_update_version')
          if (lastForceUpdateVersion !== remoteInfo.version) {
            console.log(`🚨 检测到强制更新: ${remoteInfo.version}`)
            // 执行强制更新
            return await this.forceCheckForUpdates()
          }
        }
      }

      return false
    } catch (error) {
      console.error('检查强制更新失败:', error)
      return false
    }
  }

  /**
   * 获取配置更新历史
   * @returns {Array}
   */
  getUpdateHistory() {
    try {
      return uni.getStorageSync('config_update_history') || []
    } catch (error) {
      return []
    }
  }

  /**
   * 记录更新历史
   * @param {Object} updateInfo 更新信息
   */
  recordUpdateHistory(updateInfo) {
    try {
      const history = this.getUpdateHistory()
      history.unshift({
        ...updateInfo,
        timestamp: Date.now()
      })
      
      // 只保留最近10次更新记录
      if (history.length > 10) {
        history.splice(10)
      }
      
      uni.setStorageSync('config_update_history', history)
    } catch (error) {
      console.warn('记录更新历史失败:', error)
    }
  }
}

// 创建单例
const configUpdateManager = new ConfigUpdateManager()

export default configUpdateManager
