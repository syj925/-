/**
 * 轮播图缓存管理器
 * 设计目标：
 * 1. 当前：简单的内存缓存 + localStorage持久化
 * 2. 未来：可无缝升级到Pinia/Vuex状态管理
 */

// 缓存配置
const CACHE_CONFIG = {
  // 缓存时间配置（毫秒）
  MEMORY_CACHE_TIME: 2 * 60 * 1000,      // 内存缓存：2分钟（提高实时性）
  STORAGE_CACHE_TIME: 10 * 60 * 1000,    // 本地存储缓存：10分钟（提高实时性）
  
  // 缓存键前缀
  STORAGE_PREFIX: 'banner_cache_',
  
  // 最大缓存数量
  MAX_CACHE_SIZE: 20,
  
  // 是否启用本地存储
  ENABLE_STORAGE: true,

  // 是否启用调试日志
  DEBUG: false,

  // 缓存版本，用于清除旧缓存
  CACHE_VERSION: '1.1'
}

/**
 * 轮播图缓存管理类
 * 采用适配器模式，便于未来切换到不同的状态管理方案
 */
class BannerCacheManager {
  constructor(config = {}) {
    this.config = { ...CACHE_CONFIG, ...config }

    // 内存缓存
    this.memoryCache = new Map()
    this.timestamps = new Map()
    this.loadingStates = new Map()
    this.errorStates = new Map()

    // 统计信息
    this.stats = {
      hits: 0,
      misses: 0,
      requests: 0,
      errors: 0
    }

    // 检查并清除旧版本缓存
    this.checkAndClearOldCache()

    this.log('BannerCacheManager initialized', this.config)
  }

  /**
   * 检查并清除旧版本缓存
   */
  checkAndClearOldCache() {
    try {
      const versionKey = 'banner_cache_version'
      const currentVersion = uni.getStorageSync(versionKey)

      if (currentVersion !== this.config.CACHE_VERSION) {
        console.log(`[BannerCache] 检测到缓存版本变更: ${currentVersion} -> ${this.config.CACHE_VERSION}，清除旧缓存`)

        // 清除所有轮播图相关的本地存储
        const { keys } = uni.getStorageInfoSync()
        keys.forEach(key => {
          if (key.startsWith(this.config.STORAGE_PREFIX)) {
            uni.removeStorageSync(key)
            console.log(`[BannerCache] 已清除旧缓存: ${key}`)
          }
        })

        // 更新版本号
        uni.setStorageSync(versionKey, this.config.CACHE_VERSION)
        console.log(`[BannerCache] 缓存版本已更新为: ${this.config.CACHE_VERSION}`)
      }
    } catch (error) {
      console.warn('[BannerCache] 检查缓存版本失败:', error)
    }
  }

  /**
   * 获取缓存数据
   * @param {string} scene - 场景标识
   * @returns {Object|null} 缓存的轮播图数据
   */
  get(scene) {
    this.stats.requests++
    
    // 1. 先检查内存缓存
    const memoryData = this.getFromMemory(scene)
    if (memoryData) {
      this.stats.hits++
      this.log(`Memory cache hit for scene: ${scene}`)
      console.log(`[BannerCache] 内存缓存命中 - scene: ${scene}, 数据:`, memoryData)
      return memoryData
    }

    // 2. 检查本地存储缓存
    if (this.config.ENABLE_STORAGE) {
      const storageData = this.getFromStorage(scene)
      if (storageData) {
        // 将本地存储数据加载到内存缓存
        this.setToMemory(scene, storageData)
        this.stats.hits++
        this.log(`Storage cache hit for scene: ${scene}`)
        console.log(`[BannerCache] 存储缓存命中 - scene: ${scene}, 数据:`, storageData)
        return storageData
      }
    }
    
    this.stats.misses++
    this.log(`Cache miss for scene: ${scene}`)
    return null
  }

  /**
   * 设置缓存数据
   * @param {string} scene - 场景标识
   * @param {Array} data - 轮播图数据
   * @param {Object} options - 选项
   */
  set(scene, data, options = {}) {
    const timestamp = Date.now()
    
    // 数据验证
    if (!Array.isArray(data)) {
      this.log(`Invalid data type for scene ${scene}, expected Array`, 'error')
      return false
    }
    
    // 设置到内存缓存
    this.setToMemory(scene, data, timestamp)
    
    // 设置到本地存储
    if (this.config.ENABLE_STORAGE) {
      this.setToStorage(scene, data, timestamp)
    }
    
    // 清除错误状态
    this.errorStates.delete(scene)
    
    this.log(`Cache set for scene: ${scene}, data length: ${data.length}`)
    return true
  }

  /**
   * 从内存获取数据
   */
  getFromMemory(scene) {
    const data = this.memoryCache.get(scene)
    const timestamp = this.timestamps.get(scene)
    
    if (!data || !timestamp) return null
    
    const now = Date.now()
    if (now - timestamp > this.config.MEMORY_CACHE_TIME) {
      this.memoryCache.delete(scene)
      this.timestamps.delete(scene)
      return null
    }
    
    return data
  }

  /**
   * 设置到内存缓存
   */
  setToMemory(scene, data, timestamp = Date.now()) {
    // 检查缓存大小限制
    if (this.memoryCache.size >= this.config.MAX_CACHE_SIZE) {
      this.clearOldestMemoryCache()
    }
    
    this.memoryCache.set(scene, data)
    this.timestamps.set(scene, timestamp)
  }

  /**
   * 从本地存储获取数据
   */
  getFromStorage(scene) {
    try {
      const key = this.config.STORAGE_PREFIX + scene
      const stored = uni.getStorageSync(key)
      
      if (!stored) return null
      
      const { data, timestamp, version } = JSON.parse(stored)
      
      // 检查版本兼容性
      if (version !== '1.0') {
        this.log(`Version mismatch for scene ${scene}, clearing cache`)
        uni.removeStorageSync(key)
        return null
      }
      
      // 检查是否过期
      const now = Date.now()
      if (now - timestamp > this.config.STORAGE_CACHE_TIME) {
        uni.removeStorageSync(key)
        return null
      }
      
      return data
    } catch (error) {
      this.log(`Error reading storage for scene ${scene}:`, error, 'error')
      return null
    }
  }

  /**
   * 设置到本地存储
   */
  setToStorage(scene, data, timestamp = Date.now()) {
    try {
      const key = this.config.STORAGE_PREFIX + scene
      const cacheData = {
        data,
        timestamp,
        version: '1.0',
        scene
      }
      
      uni.setStorageSync(key, JSON.stringify(cacheData))
    } catch (error) {
      this.log(`Error writing storage for scene ${scene}:`, error, 'error')
    }
  }

  /**
   * 清除最旧的内存缓存
   */
  clearOldestMemoryCache() {
    let oldestScene = null
    let oldestTime = Date.now()
    
    for (const [scene, timestamp] of this.timestamps.entries()) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp
        oldestScene = scene
      }
    }
    
    if (oldestScene) {
      this.memoryCache.delete(oldestScene)
      this.timestamps.delete(oldestScene)
      this.log(`Cleared oldest cache for scene: ${oldestScene}`)
    }
  }

  /**
   * 清除缓存
   * @param {string|null} scene - 场景标识，null表示清除所有
   */
  clear(scene = null) {
    if (scene) {
      // 清除指定场景
      this.memoryCache.delete(scene)
      this.timestamps.delete(scene)
      this.loadingStates.delete(scene)
      this.errorStates.delete(scene)
      
      if (this.config.ENABLE_STORAGE) {
        const key = this.config.STORAGE_PREFIX + scene
        uni.removeStorageSync(key)
      }
      
      this.log(`Cache cleared for scene: ${scene}`)
    } else {
      // 清除所有缓存
      this.memoryCache.clear()
      this.timestamps.clear()
      this.loadingStates.clear()
      this.errorStates.clear()
      
      if (this.config.ENABLE_STORAGE) {
        // 清除所有相关的本地存储
        try {
          const { keys } = uni.getStorageInfoSync()
          keys.forEach(key => {
            if (key.startsWith(this.config.STORAGE_PREFIX)) {
              uni.removeStorageSync(key)
            }
          })
        } catch (error) {
          this.log('Error clearing storage:', error, 'error')
        }
      }
      
      this.log('All cache cleared')
    }
  }

  /**
   * 获取/设置加载状态
   */
  isLoading(scene) {
    return this.loadingStates.get(scene) || false
  }

  setLoading(scene, loading) {
    if (loading) {
      this.loadingStates.set(scene, true)
    } else {
      this.loadingStates.delete(scene)
    }
  }

  /**
   * 获取/设置错误状态
   */
  getError(scene) {
    return this.errorStates.get(scene) || null
  }

  setError(scene, error) {
    if (error) {
      this.errorStates.set(scene, error)
      this.stats.errors++
    } else {
      this.errorStates.delete(scene)
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.memoryCache.size,
      hitRate: this.stats.requests > 0 ? (this.stats.hits / this.stats.requests * 100).toFixed(2) + '%' : '0%'
    }
  }

  /**
   * 预热缓存
   * @param {Array} scenes - 需要预热的场景列表
   */
  async preload(scenes, fetchFunction) {
    const promises = scenes.map(async (scene) => {
      if (!this.get(scene) && !this.isLoading(scene)) {
        try {
          this.setLoading(scene, true)
          const data = await fetchFunction(scene)
          this.set(scene, data)
        } catch (error) {
          this.setError(scene, error.message)
        } finally {
          this.setLoading(scene, false)
        }
      }
    })
    
    await Promise.allSettled(promises)
    this.log(`Preload completed for scenes: ${scenes.join(', ')}`)
  }

  /**
   * 日志输出
   */
  log(message, data = null, level = 'info') {
    if (!this.config.DEBUG) return
    
    const timestamp = new Date().toLocaleTimeString()
    const prefix = `[BannerCache ${timestamp}]`
    
    switch (level) {
      case 'error':
        console.error(prefix, message, data)
        break
      case 'warn':
        console.warn(prefix, message, data)
        break
      default:
        console.log(prefix, message, data)
    }
  }
}

// 创建全局实例
const bannerCache = new BannerCacheManager({
  DEBUG: process.env.NODE_ENV === 'development'
})

// 导出实例和类（便于未来扩展）
export { BannerCacheManager, bannerCache }
export default bannerCache
