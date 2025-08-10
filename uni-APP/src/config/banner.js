/**
 * 轮播图配置文件
 * 设计目标：
 * 1. 集中管理轮播图相关配置
 * 2. 便于不同环境的配置切换
 * 3. 为未来功能扩展预留配置空间
 */

// 环境配置
const ENV = process.env.NODE_ENV || 'development'

// 基础配置
const BASE_CONFIG = {
  // 缓存配置
  cache: {
    // 内存缓存时间（毫秒）
    memoryTime: 5 * 60 * 1000,
    // 本地存储缓存时间（毫秒）
    storageTime: 30 * 60 * 1000,
    // 最大缓存数量
    maxSize: 20,
    // 是否启用本地存储
    enableStorage: true
  },

  // API配置
  api: {
    // 请求超时时间
    timeout: 10000,
    // 重试次数
    maxRetries: 3,
    // 重试延迟
    retryDelay: 1000
  },

  // 场景配置
  scenes: {
    home: {
      name: '首页',
      defaultLimit: 5,
      autoplay: true,
      interval: 4000,
      showIndicators: true,
      showTitle: true,
      height: '400rpx',
      borderRadius: '20rpx'
    },
    discover: {
      name: '发现页',
      defaultLimit: 4,
      autoplay: true,
      interval: 5000,
      showIndicators: true,
      showTitle: true,
      height: '320rpx',
      borderRadius: '16rpx'
    },
    'search-main': {
      name: '搜索主页',
      defaultLimit: 3,
      autoplay: true,
      interval: 6000,
      showIndicators: false,
      showTitle: true,
      customIndicators: true,
      height: '280rpx',
      borderRadius: '12rpx'
    },
    'search-topic': {
      name: '话题搜索',
      defaultLimit: 3,
      autoplay: true,
      interval: 4000,
      showIndicators: false,
      showTitle: false,
      height: '200rpx',
      borderRadius: '8rpx'
    }
  },

  // 预加载配置
  preload: {
    // 应用启动时预加载的场景
    scenes: ['home'],
    // 是否启用预加载
    enabled: true,
    // 预加载延迟（毫秒）
    delay: 1000
  },

  // 统计配置
  analytics: {
    // 是否启用点击统计
    enableClick: true,
    // 是否启用展示统计
    enableView: true,
    // 统计上报延迟（毫秒）
    reportDelay: 500
  },

  // 错误处理配置
  errorHandling: {
    // 是否显示错误提示
    showErrorToast: false,
    // 错误重试间隔（毫秒）
    retryInterval: 2000,
    // 是否启用降级策略
    enableFallback: true
  },

  // 调试配置
  debug: {
    // 是否启用调试日志
    enabled: ENV === 'development',
    // 日志级别
    level: 'info',
    // 是否显示性能统计
    showStats: ENV === 'development'
  }
}

// 开发环境配置
const DEVELOPMENT_CONFIG = {
  cache: {
    memoryTime: 2 * 60 * 1000, // 开发环境缓存时间短一些
    storageTime: 10 * 60 * 1000
  },
  debug: {
    enabled: true,
    level: 'debug',
    showStats: true
  },
  errorHandling: {
    showErrorToast: true
  }
}

// 生产环境配置
const PRODUCTION_CONFIG = {
  cache: {
    memoryTime: 10 * 60 * 1000, // 生产环境缓存时间长一些
    storageTime: 60 * 60 * 1000
  },
  debug: {
    enabled: false,
    level: 'error',
    showStats: false
  },
  api: {
    maxRetries: 5, // 生产环境多重试几次
    retryDelay: 2000
  }
}

// 测试环境配置
const TEST_CONFIG = {
  cache: {
    memoryTime: 1 * 60 * 1000,
    storageTime: 5 * 60 * 1000,
    enableStorage: false // 测试环境不使用本地存储
  },
  preload: {
    enabled: false // 测试环境不预加载
  },
  analytics: {
    enableClick: false,
    enableView: false
  }
}

// 环境配置映射
const ENV_CONFIGS = {
  development: DEVELOPMENT_CONFIG,
  production: PRODUCTION_CONFIG,
  test: TEST_CONFIG
}

/**
 * 深度合并配置对象
 */
function deepMerge(target, source) {
  const result = { ...target }
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  
  return result
}

/**
 * 获取当前环境的配置
 */
function getConfig() {
  const envConfig = ENV_CONFIGS[ENV] || {}
  return deepMerge(BASE_CONFIG, envConfig)
}

/**
 * 获取场景配置
 */
function getSceneConfig(scene) {
  const config = getConfig()
  return config.scenes[scene] || config.scenes.home
}

/**
 * 获取缓存配置
 */
function getCacheConfig() {
  return getConfig().cache
}

/**
 * 获取API配置
 */
function getApiConfig() {
  return getConfig().api
}

/**
 * 获取调试配置
 */
function getDebugConfig() {
  return getConfig().debug
}

/**
 * 更新配置（运行时动态配置）
 */
let runtimeConfig = {}

function updateConfig(newConfig) {
  runtimeConfig = deepMerge(runtimeConfig, newConfig)
}

function getRuntimeConfig() {
  const baseConfig = getConfig()
  return deepMerge(baseConfig, runtimeConfig)
}

// 导出配置
export {
  getConfig,
  getSceneConfig,
  getCacheConfig,
  getApiConfig,
  getDebugConfig,
  updateConfig,
  getRuntimeConfig
}

export default {
  get: getConfig,
  getScene: getSceneConfig,
  getCache: getCacheConfig,
  getApi: getApiConfig,
  getDebug: getDebugConfig,
  update: updateConfig,
  getRuntime: getRuntimeConfig,
  
  // 常量
  SCENES: Object.keys(BASE_CONFIG.scenes),
  ENV
}
