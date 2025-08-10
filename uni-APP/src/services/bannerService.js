/**
 * 轮播图服务层
 * 设计目标：
 * 1. 封装业务逻辑，提供统一的API接口
 * 2. 集成缓存管理，优化性能
 * 3. 预留扩展接口，便于未来升级到状态管理库
 */

import api from '@/api'
import bannerCache from '@/utils/cache/bannerCache'

/**
 * 轮播图服务类
 * 采用单例模式，确保全局唯一实例
 */
class BannerService {
  constructor() {
    this.cache = bannerCache
    this.api = api.banner
    
    // 配置信息
    this.config = {
      // 默认场景配置
      defaultScenes: ['home', 'discover', 'search-main', 'search-topic'],
      
      // 预加载配置
      preloadScenes: ['home'], // 应用启动时预加载的场景
      
      // 重试配置
      maxRetries: 3,
      retryDelay: 1000,
      
      // 统计配置
      enableStats: true
    }
    
    // 事件监听器
    this.listeners = new Map()
    
    // 初始化
    this.init()
  }

  /**
   * 初始化服务
   */
  async init() {
    try {
      // 预加载首页轮播图
      if (this.config.preloadScenes.length > 0) {
        await this.preloadBanners(this.config.preloadScenes)
      }
    } catch (error) {
      console.error('BannerService初始化失败:', error)
    }
  }

  /**
   * 获取轮播图数据（主要接口）
   * @param {string} scene - 场景标识
   * @param {Object} options - 选项
   * @returns {Promise<Array>} 轮播图数据
   */
  async getBanners(scene, options = {}) {
    const {
      force = false,        // 是否强制刷新
      platform = 'app',     // 平台类型
      status = 'active',    // 状态筛选
      limit = 5,           // 数量限制
      enableCache = true   // 是否启用缓存
    } = options

    console.log(`[BannerService] 获取轮播图 - scene: ${scene}, options:`, options)

    try {
      // 1. 检查缓存（如果启用且非强制刷新）
      if (enableCache && !force) {
        console.log(`[BannerService] 检查缓存 - scene: ${scene}`)
        const cached = this.cache.get(scene)
        if (cached) {
          console.log(`[BannerService] 缓存命中 - scene: ${scene}, data:`, cached)
          this.emit('banners-loaded', { scene, data: cached, fromCache: true })
          return cached
        }
        console.log(`[BannerService] 缓存未命中 - scene: ${scene}`)
      }

      // 2. 检查是否正在加载中
      if (this.cache.isLoading(scene)) {
        // 等待当前请求完成
        return await this.waitForLoading(scene)
      }

      // 3. 发起API请求
      console.log(`[BannerService] 发起API请求 - scene: ${scene}`)
      this.cache.setLoading(scene, true)
      this.cache.setError(scene, null)

      const response = await this.fetchWithRetry(scene, {
        platform,
        status,
        limit
      })

      console.log(`[BannerService] API响应 - scene: ${scene}, response:`, response)
      console.log(`[BannerService] API响应详细数据:`, JSON.stringify(response, null, 2))

      if (response.code === 0 && Array.isArray(response.data)) {
        const banners = response.data

        // 详细记录每个轮播图的信息
        console.log(`[BannerService] 获取到 ${banners.length} 个轮播图:`)
        banners.forEach((banner, index) => {
          console.log(`[BannerService] 轮播图 ${index + 1}:`, {
            id: banner.id,
            title: banner.title,
            image: banner.image,
            scene: banner.scene,
            status: banner.status
          })
        })
        
        // 4. 更新缓存
        if (enableCache) {
          this.cache.set(scene, banners)
        }
        
        // 5. 记录展示统计
        if (banners.length > 0) {
          this.recordView(banners.map(item => item.id), scene, platform)
        }
        
        // 6. 触发事件
        this.emit('banners-loaded', { scene, data: banners, fromCache: false })
        
        return banners
      } else {
        throw new Error(response.msg || '获取轮播图失败')
      }
    } catch (error) {
      // 错误处理
      this.cache.setError(scene, error.message)
      this.emit('banners-error', { scene, error })
      
      // 尝试返回缓存数据作为降级方案
      const fallbackData = this.cache.get(scene)
      if (fallbackData) {
        console.warn(`轮播图请求失败，使用缓存数据: ${scene}`, error)
        return fallbackData
      }
      
      throw error
    } finally {
      this.cache.setLoading(scene, false)
    }
  }

  /**
   * 带重试的请求方法
   */
  async fetchWithRetry(scene, params, retryCount = 0) {
    try {
      console.log(`[BannerService] 调用API - scene: ${scene}, params:`, params)
      console.log(`[BannerService] API实例:`, this.api)
      return await this.api.getBannersByScene(scene, params)
    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        console.warn(`轮播图请求失败，${this.config.retryDelay}ms后重试 (${retryCount + 1}/${this.config.maxRetries}):`, error)
        
        // 延迟重试
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
        return await this.fetchWithRetry(scene, params, retryCount + 1)
      }
      
      throw error
    }
  }

  /**
   * 等待加载完成
   */
  async waitForLoading(scene, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      
      const checkLoading = () => {
        if (!this.cache.isLoading(scene)) {
          const data = this.cache.get(scene)
          const error = this.cache.getError(scene)
          
          if (error) {
            reject(new Error(error))
          } else {
            resolve(data || [])
          }
          return
        }
        
        // 检查超时
        if (Date.now() - startTime > timeout) {
          reject(new Error('等待轮播图加载超时'))
          return
        }
        
        // 继续等待
        setTimeout(checkLoading, 100)
      }
      
      checkLoading()
    })
  }

  /**
   * 刷新轮播图
   * @param {string|Array} scenes - 场景标识或场景数组
   */
  async refresh(scenes) {
    const sceneList = Array.isArray(scenes) ? scenes : [scenes]
    const promises = sceneList.map(scene => this.getBanners(scene, { force: true }))
    
    try {
      const results = await Promise.allSettled(promises)
      return results.map((result, index) => ({
        scene: sceneList[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    } catch (error) {
      console.error('批量刷新轮播图失败:', error)
      throw error
    }
  }

  /**
   * 预加载轮播图
   * @param {Array} scenes - 需要预加载的场景列表
   */
  async preloadBanners(scenes) {
    const promises = scenes.map(async (scene) => {
      try {
        if (!this.cache.get(scene) && !this.cache.isLoading(scene)) {
          await this.getBanners(scene, { enableCache: true })
        }
      } catch (error) {
        console.warn(`预加载轮播图失败 ${scene}:`, error)
      }
    })
    
    await Promise.allSettled(promises)
    console.log(`轮播图预加载完成: ${scenes.join(', ')}`)
  }

  /**
   * 记录轮播图点击
   * @param {string} bannerId - 轮播图ID
   * @param {string} scene - 场景
   * @param {string} platform - 平台
   */
  async recordClick(bannerId, scene = 'home', platform = 'app') {
    try {
      await this.api.recordClick(bannerId, scene, platform)
      this.emit('banner-clicked', { bannerId, scene, platform })
    } catch (error) {
      console.error('记录轮播图点击失败:', error)
    }
  }

  /**
   * 记录轮播图展示
   * @param {Array} bannerIds - 轮播图ID数组
   * @param {string} scene - 场景
   * @param {string} platform - 平台
   */
  async recordView(bannerIds, scene = 'home', platform = 'app') {
    try {
      await this.api.recordView(bannerIds, scene, platform)
      this.emit('banners-viewed', { bannerIds, scene, platform })
    } catch (error) {
      console.error('记录轮播图展示失败:', error)
    }
  }

  /**
   * 清除缓存
   * @param {string|null} scene - 场景标识，null表示清除所有
   */
  clearCache(scene = null) {
    this.cache.clear(scene)
    this.emit('cache-cleared', { scene })
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return this.cache.getStats()
  }

  /**
   * 事件监听
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * 移除事件监听
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {Object} data - 事件数据
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`事件回调执行失败 ${event}:`, error)
        }
      })
    }
  }

  /**
   * 销毁服务（清理资源）
   */
  destroy() {
    this.listeners.clear()
    this.cache.clear()
  }
}

// 创建单例实例
const bannerService = new BannerService()

// 导出服务实例和类（便于测试和扩展）
export { BannerService, bannerService }
export default bannerService
