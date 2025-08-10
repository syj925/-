<template>
  <view
    class="banner-container"
    :class="[`banner-${scene}`, customClass]"
    :style="containerStyle"
  >
    <!-- 加载状态 -->
    <view v-if="loading" class="banner-loading">
      <text>轮播图加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="banner-error">
      <text>{{ error }}</text>
      <button @tap="refresh" class="retry-btn">重试</button>
    </view>

    <!-- 轮播图内容 -->
    <view v-else-if="banners.length > 0" class="banner-content">
    <swiper
      :key="`swiper-${scene}-${banners.length}`"
      class="banner-swiper"
      :indicator-dots="finalConfig.showIndicators"
      :autoplay="finalConfig.autoplay"
      :circular="finalConfig.circular"
      :interval="finalConfig.interval"
      :duration="finalConfig.duration"
      :indicator-color="finalConfig.indicatorColor"
      :indicator-active-color="finalConfig.indicatorActiveColor"
      @change="onSwiperChange"
    >
      <swiper-item 
        v-for="(banner, index) in banners" 
        :key="banner.id"
        @tap="handleBannerClick(banner)"
      >
        <view class="banner-item" :class="`banner-item-${scene}`">
          <image
            :src="getBannerImage(banner.image)"
            mode="aspectFill"
            class="banner-image"
            :lazy-load="true"
            @error="onImageError"
            @load="onImageLoad"
          />
          
          <view class="banner-overlay" :class="`overlay-${scene}`">
            <view v-if="config.showTitle" class="banner-content">
              <text class="banner-title" :style="config.titleStyle">
                {{ banner.title }}
              </text>
              <text 
                v-if="config.showSubtitle && banner.subtitle" 
                class="banner-subtitle"
                :style="config.subtitleStyle"
              >
                {{ banner.subtitle }}
              </text>
            </view>
            
            <view v-if="getBannerTag(banner)" class="banner-tag">
              <text class="tag-text">{{ getBannerTag(banner) }}</text>
            </view>
          </view>
        </view>
      </swiper-item>
    </swiper>
    
    <view 
      v-if="config.customIndicators" 
      class="custom-indicators"
      :class="`indicators-${scene}`"
    >
      <view 
        v-for="(banner, index) in banners"
        :key="index"
        class="indicator-dot"
        :class="{ active: currentIndex === index }"
      ></view>
    </view>
    </view>

    <!-- 无数据状态 -->
    <view v-else class="banner-empty">
      <text>暂无轮播图</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import bannerService from '@/services/bannerService'
import { ensureAbsoluteUrl } from '@/utils/url'

const props = defineProps({
  scene: {
    type: String,
    default: 'home',
    validator: (value) => ['home', 'discover', 'search-main', 'search-topic'].includes(value)
  },
  config: {
    type: Object,
    default: () => ({})
  },
  customClass: {
    type: String,
    default: ''
  },
  autoRefresh: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['banner-click', 'banner-change', 'banners-loaded', 'banners-error'])

// 状态管理
const banners = ref([])
const currentIndex = ref(0)
const loading = ref(false)
const error = ref(null)

// 场景配置
const sceneConfigs = {
  home: {
    height: '400rpx',
    showIndicators: true,
    showTitle: true,
    autoplay: true,
    circular: true,
    interval: 4000,
    duration: 500,
    borderRadius: '20rpx',
    indicatorColor: 'rgba(255,255,255,0.5)',
    indicatorActiveColor: '#4A90E2',
    titleStyle: { fontSize: '32rpx', fontWeight: '600', color: '#ffffff' }
  },
  discover: {
    height: '320rpx',
    showIndicators: true,
    showTitle: true,
    autoplay: true,
    circular: true,
    interval: 5000,
    duration: 500,
    borderRadius: '16rpx',
    indicatorColor: 'rgba(255,255,255,0.5)',
    indicatorActiveColor: '#4A90E2',
    titleStyle: { fontSize: '28rpx', fontWeight: 'bold', color: '#ffffff' }
  },
  'search-main': {
    height: '280rpx',
    showIndicators: false,
    showTitle: true,
    autoplay: true,
    circular: true,
    interval: 6000,
    duration: 500,
    customIndicators: true,
    borderRadius: '12rpx',
    titleStyle: { fontSize: '26rpx', fontWeight: '500', color: '#ffffff' }
  },
  'search-topic': {
    height: '200rpx',
    showIndicators: false,
    showTitle: false,
    autoplay: true,
    circular: true,
    interval: 4000,
    duration: 500,
    borderRadius: '8rpx'
  }
}

// 合并配置
const finalConfig = computed(() => ({
  ...sceneConfigs[props.scene],
  ...props.config
}))

// 容器样式
const containerStyle = computed(() => {
  const style = {
    height: finalConfig.value.height,
    borderRadius: finalConfig.value.borderRadius
  }
  console.log(`[Banner] 容器样式 - scene: ${props.scene}`, style)
  console.log(`[Banner] 最终配置:`, finalConfig.value)
  return style
})

// 获取轮播图数据
const fetchBanners = async (force = false) => {
  console.log(`[Banner] 开始获取轮播图数据 - scene: ${props.scene}, force: ${force}`)

  if (loading.value && !force) {
    console.log('[Banner] 正在加载中，跳过重复请求')
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('[Banner] 调用 bannerService.getBanners')
    const data = await bannerService.getBanners(props.scene, {
      force,
      platform: 'app',
      status: 'active',
      limit: finalConfig.value.limit || 5
    })

    console.log('[Banner] 获取到轮播图数据:', data)
    console.log('[Banner] 轮播图数据详情:', JSON.stringify(data, null, 2))

    banners.value = data || []

    // 详细记录每个轮播图的图片URL
    banners.value.forEach((banner, index) => {
      console.log(`[Banner] 轮播图 ${index + 1} 图片处理:`, {
        原始URL: banner.image,
        处理后URL: getBannerImage(banner.image),
        标题: banner.title
      })
    })

    emit('banners-loaded', { scene: props.scene, data: banners.value })
  } catch (err) {
    console.error('[Banner] 获取轮播图失败:', err)
    error.value = err.message
    banners.value = []
    emit('banners-error', { scene: props.scene, error: err })
  } finally {
    loading.value = false
    console.log(`[Banner] 轮播图加载完成 - 数据量: ${banners.value.length}`)
  }
}

// 强制刷新轮播图数据
const forceRefresh = async () => {
  console.log(`[Banner] 强制刷新轮播图数据 - scene: ${props.scene}`)

  // 清除缓存
  bannerService.clearCache(props.scene)

  // 重新加载数据
  await fetchBanners(true)
}

// 处理轮播图点击
const handleBannerClick = async (banner) => {
  try {
    // 记录点击统计
    await bannerService.recordClick(banner.id, props.scene, 'app')

    // 触发父组件事件
    emit('banner-click', banner)

    // 执行跳转逻辑
    await handleNavigation(banner)
  } catch (error) {
    console.error('轮播图点击处理失败:', error)
  }
}

// 跳转处理
const handleNavigation = async (banner) => {
  // 获取跳转ID，优先使用targetId，如果为空则使用linkValue
  const getNavigationId = (banner) => {
    return banner.targetId || banner.linkValue
  }

  switch (banner.linkType) {
    case 'post':
      const postId = getNavigationId(banner)
      if (!postId) {
        uni.showToast({
          title: '帖子ID不存在',
          icon: 'none'
        })
        return
      }
      uni.navigateTo({
        url: `/pages/post/detail?id=${postId}`
      })
      break
    case 'topic':
      const topicId = getNavigationId(banner)
      if (!topicId) {
        uni.showToast({
          title: '话题ID不存在',
          icon: 'none'
        })
        return
      }
      uni.navigateTo({
        url: `/pages/topic/detail?id=${topicId}`
      })
      break
    case 'event':
      const eventId = getNavigationId(banner)
      if (!eventId) {
        uni.showToast({
          title: '活动ID不存在',
          icon: 'none'
        })
        return
      }
      uni.navigateTo({
        url: `/pages/event/detail?id=${eventId}`
      })
      break
    case 'page':
      if (!banner.linkValue) {
        uni.showToast({
          title: '页面路径不存在',
          icon: 'none'
        })
        return
      }
      uni.navigateTo({
        url: banner.linkValue
      })
      break
    case 'url':
      if (!banner.linkValue) {
        uni.showToast({
          title: '链接地址不存在',
          icon: 'none'
        })
        return
      }
      handleExternalLink(banner.linkValue)
      break
    default:
      uni.showToast({
        title: banner.title,
        icon: 'none'
      })
  }
}

// 外部链接处理
const handleExternalLink = (url) => {
  // 确保URL有正确的协议前缀
  const normalizedUrl = normalizeUrl(url)

  // #ifdef H5
  window.open(normalizedUrl)
  // #endif

  // #ifndef H5
  uni.showModal({
    title: '提示',
    content: '即将跳转到外部链接',
    success: (res) => {
      if (res.confirm) {
        plus.runtime.openURL(normalizedUrl)
      }
    }
  })
  // #endif
}

// URL标准化处理
const normalizeUrl = (url) => {
  if (!url) return ''

  // 如果已经有协议前缀，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // 如果是相对协议（//开头），添加https
  if (url.startsWith('//')) {
    return 'https:' + url
  }

  // 其他情况默认添加https://前缀
  return 'https://' + url
}

// 轮播切换事件
const onSwiperChange = (e) => {
  currentIndex.value = e.detail.current
  emit('banner-change', {
    current: e.detail.current,
    banner: banners.value[e.detail.current]
  })
}

// 刷新轮播图
const refresh = async () => {
  console.log(`[Banner] 开始刷新轮播图 - scene: ${props.scene}`)

  // 简单直接：清除数据，重新加载
  banners.value = []
  error.value = null

  // 重新获取数据
  await fetchBanners(true)
  console.log(`[Banner] 轮播图刷新完成 - scene: ${props.scene}`)
}

// 事件监听器
const eventListeners = []

// 监听服务层事件
const setupEventListeners = () => {
  const onBannersLoaded = (data) => {
    if (data.scene === props.scene) {
      banners.value = data.data
      loading.value = false
    }
  }

  const onBannersError = (data) => {
    if (data.scene === props.scene) {
      error.value = data.error.message
      loading.value = false
    }
  }

  bannerService.on('banners-loaded', onBannersLoaded)
  bannerService.on('banners-error', onBannersError)

  eventListeners.push(
    () => bannerService.off('banners-loaded', onBannersLoaded),
    () => bannerService.off('banners-error', onBannersError)
  )
}

// 获取轮播图标签
const getBannerTag = (banner) => {
  switch (props.scene) {
    case 'search-main':
      return banner.linkType === 'topic' ? '话题' : 
             banner.linkType === 'event' ? '活动' : 
             banner.linkType === 'post' ? '热帖' : null
    case 'search-topic':
      return '推荐话题'
    default:
      return null
  }
}

// 图片URL处理
const getBannerImage = (imageUrl) => {
  if (!imageUrl) return '/static/images/default-banner.jpg'

  // 使用统一的URL处理函数
  return ensureAbsoluteUrl(imageUrl)
}

// 图片加载错误处理
const onImageError = (e) => {
  console.error('轮播图图片加载失败:', e)
  console.error('错误详情:', {
    错误类型: e.type,
    错误信息: e.detail?.errMsg,
    目标元素: e.target,
    当前轮播图数据: banners.value
  })
}

// 图片加载成功处理
const onImageLoad = (e) => {
  console.log('轮播图图片加载成功')
}

onMounted(() => {
  setupEventListeners()
  fetchBanners()
})

onUnmounted(() => {
  // 清理事件监听器
  eventListeners.forEach(cleanup => cleanup())
})

// 暴露方法给父组件
defineExpose({
  refresh,
  forceRefresh,
  getBanners: () => banners.value,
  getLoading: () => loading.value,
  getError: () => error.value,
  clearCache: () => bannerService.clearCache(props.scene)
})
</script>

<style lang="scss" scoped>
.banner-container {
  width: 100%;
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.banner-swiper {
  width: 100%;
  height: 100%;
}

.banner-item {
  position: relative;
  width: 100%;
  height: 100%;
}

.banner-image {
  width: 100%;
  height: 100%;
}

.banner-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  padding: 40rpx 30rpx 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.banner-content {
  flex: 1;
  height: 100%;
  width: 100%;
}

.banner-title {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 600;
  text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.3);
  display: block;
  margin-bottom: 8rpx;
}

.banner-subtitle {
  color: rgba(255,255,255,0.8);
  font-size: 24rpx;
  display: block;
}

.banner-tag {
  background: rgba(255,255,255,0.9);
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  
  .tag-text {
    font-size: 20rpx;
    color: #4A90E2;
    font-weight: 500;
  }
}

.custom-indicators {
  position: absolute;
  bottom: 20rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12rpx;
  
  .indicator-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    background: rgba(255,255,255,0.5);
    transition: all 0.3s ease;
    
    &.active {
      background: #4A90E2;
      transform: scale(1.2);
    }
  }
}

// 场景特定样式
.banner-home {
  box-shadow: 0 8rpx 24rpx rgba(74, 144, 226, 0.15);
}

.banner-discover {
  box-shadow: 0 6rpx 20rpx rgba(74, 144, 226, 0.12);
}

.banner-search-main {
  box-shadow: 0 4rpx 16rpx rgba(74, 144, 226, 0.1);
}

.banner-search-topic {
  box-shadow: 0 2rpx 12rpx rgba(74, 144, 226, 0.08);
}

// 状态样式
.banner-loading,
.banner-error,
.banner-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200rpx;
  background: #f8f9fa;
  border-radius: 12rpx;

  text {
    color: #666;
    font-size: 28rpx;
  }
}

.banner-error {
  flex-direction: column;
  gap: 20rpx;

  .retry-btn {
    padding: 16rpx 32rpx;
    background: #4A90E2;
    color: white;
    border-radius: 8rpx;
    font-size: 24rpx;
    border: none;
  }
}

.banner-loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
