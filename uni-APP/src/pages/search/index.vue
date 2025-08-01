<template>
  <view class="search-page">
    <!-- 搜索头部 -->
    <view class="search-header">
      <view class="search-container">
        <view class="search-box">
          <view class="search-icon-wrapper">
            <text class="search-icon">🔍</text>
          </view>
          <input
            class="search-input"
            type="text"
            v-model="searchKeyword"
            placeholder="搜索帖子、用户、话题..."
            @input="onSearchInput"
            @confirm="onSearchConfirm"
            confirm-type="search"
            focus
          />
          <view v-if="searchKeyword" class="clear-btn" @click="clearSearch">
            <text class="clear-icon">✕</text>
          </view>
        </view>
        <view class="cancel-btn" @click="goBack">
          <text>取消</text>
        </view>
      </view>
    </view>

    <!-- 搜索建议 -->
    <view v-if="searchSuggestions.length > 0" class="search-suggestions">
      <view class="suggestions-header">
        <view class="header-icon">
          <text>💡</text>
        </view>
        <text class="header-text">搜索建议</text>
        <view class="header-line"></view>
      </view>
      <view class="suggestions-list">
        <view
          v-for="(suggestion, index) in searchSuggestions"
          :key="index"
          class="suggestion-item"
          :class="{ 'suggestion-highlight': index === 0 }"
          @click="selectSuggestion(suggestion)"
        >
          <view class="suggestion-left">
            <view class="suggestion-icon" :class="getSuggestionIconClass(suggestion)">
              <text>{{ getSuggestionIcon(suggestion) }}</text>
            </view>
            <view class="suggestion-content">
              <text class="suggestion-text">{{ getSuggestionText(suggestion) }}</text>
              <text class="suggestion-type">{{ getSuggestionTypeText(suggestion) }}</text>
            </view>
          </view>
          <view class="suggestion-right">
            <view class="suggestion-action">
              <text class="action-text">搜索</text>
              <text class="action-arrow">→</text>
            </view>
          </view>
        </view>
      </view>
      <view class="suggestions-footer">
        <view class="footer-tip">
          <text>按回车键直接搜索 "{{ searchKeyword }}"</text>
        </view>
      </view>
    </view>

    <!-- 发现内容区域 -->
    <scroll-view v-if="!searchKeyword" class="discover-content" scroll-y>


      <!-- 搜索历史 -->
      <view v-if="searchHistory.length > 0" class="discover-section">
        <view class="section-header">
          <view class="section-title">
            <view class="title-icon history-icon">
              <text>🕒</text>
            </view>
            <text class="title-text">搜索历史</text>
          </view>
          <view class="section-more" @click="clearHistory">
            <text class="more-text">清空</text>
          </view>
        </view>
        <view class="history-tags">
          <view
            v-for="(item, index) in searchHistory.slice(0, historyExpanded ? searchHistory.length : 6)"
            :key="index"
            class="history-tag"
            @click="selectHistoryItem(item)"
          >
            <text class="tag-text">{{ item.keyword || item }}</text>
            <view class="tag-close" @click.stop="removeHistoryItem(index)">
              <text>×</text>
            </view>
          </view>
        </view>
        <view v-if="searchHistory.length > 6" class="show-more" @click="toggleHistoryExpanded">
          <text class="more-text">{{ historyExpanded ? '收起更多搜索历史' : '展开更多搜索历史' }}</text>
          <text class="more-icon">{{ historyExpanded ? '▲' : '▼' }}</text>
        </view>
      </view>

      <!-- 热门搜索 -->
      <view v-if="searchPageSettings.enableHotSearch && hotSearches.length > 0" class="discover-section">
        <view class="section-header">
          <view class="section-title">
            <view class="title-icon hot-icon">
              <text>🔥</text>
            </view>
            <text class="title-text">热门搜索</text>
          </view>
          <view class="section-more" @click="refreshHotSearches">
            <text class="more-text">刷新</text>
          </view>
        </view>
        <view class="hot-search-tags">
          <view
            v-for="(item, index) in hotSearches.slice(0, searchPageSettings.hotSearchCount)"
            :key="index"
            class="hot-search-tag"
            :class="{ 'top-rank': index < 3 }"
            @click="selectHotSearch(item)"
          >
            <view v-if="index < 3" class="rank-badge">
              <text>{{ index + 1 }}</text>
            </view>
            <text class="tag-text">{{ getSearchKeyword(item) }}</text>
            <view v-if="getSearchCount(item)" class="search-count">
              <text>{{ formatCount(getSearchCount(item)) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 热门话题 -->
      <view v-if="hotTopics.length > 0" class="discover-section">
        <view class="section-header">
          <view class="section-title">
            <view class="title-icon topic-icon">
              <text>💬</text>
            </view>
            <text class="title-text">热门话题</text>
          </view>
          <view class="section-more" @click="goToTopicList">
            <text class="more-text">更多</text>
            <text class="more-arrow">→</text>
          </view>
        </view>
        <scroll-view class="topics-scroll" scroll-x>
          <view class="topics-container">
            <view
              v-for="topic in hotTopics"
              :key="topic.id"
              class="topic-card"
              @click="goToTopicDetail(topic.id)"
            >
              <view class="topic-avatar">
                <image
                  v-if="topic.cover_image"
                  :src="getImageUrl(topic.cover_image)"
                  class="avatar-image"
                  mode="aspectFill"
                />
                <view v-else class="default-avatar">
                  <text class="avatar-text">{{ topic.name.charAt(0) }}</text>
                </view>
              </view>
              <view class="topic-info">
                <text class="topic-name">{{ topic.name }}</text>
                <text class="topic-stats">{{ topic.post_count }}个帖子</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 推荐内容 -->
      <view v-if="searchPageSettings.enableRecommendContent && recommendedContent.length > 0" class="discover-section">
        <view class="section-header">
          <view class="section-title">
            <view class="title-icon recommend-icon">
              <text>✨</text>
            </view>
            <text class="title-text">推荐内容</text>
          </view>
          <view class="section-more" @click="refreshRecommended">
            <text class="more-text">刷新</text>
          </view>
        </view>
        <view class="recommend-list">
          <view
            v-for="item in recommendedContent"
            :key="item.id"
            class="recommend-item"
            @click="goToContentDetail(item)"
          >
            <view class="recommend-content">
              <text class="recommend-title">{{ item.title || item.content }}</text>
              <view class="recommend-meta">
                <view class="meta-tag" :class="getContentTypeClass(item.type)">
                  <text>{{ getContentTypeText(item.type) }}</text>
                </view>
                <text class="meta-stats">{{ item.like_count }}赞 · {{ item.view_count }}浏览</text>
              </view>
            </view>
            <view v-if="item.cover_image || getFirstImage(item.images)" class="recommend-thumb">
              <image
                :src="getImageUrl(item.cover_image || getFirstImage(item.images))"
                class="thumb-image"
                mode="aspectFill"
              />
            </view>
          </view>
        </view>
      </view>


    </scroll-view>
  </view>
</template>

<script>
import api from '@/api'

export default {
  name: 'SearchPage',
  data() {
    return {
      searchKeyword: '',
      searchSuggestions: [],
      hotSearches: [],
      hotTopics: [],
      recommendedContent: [],
      searchHistory: [],
      debounceTimer: null,
      navigating: false,
      historyExpanded: false,
      // 搜索页面设置
      searchPageSettings: {
        enableHotSearch: true,
        hotSearchCount: 10,
        hotSearchSource: 'mixed',
        enableRecommendContent: true,
        recommendContentCount: 6,
        recommendContentTypes: ['post', 'topic'],
        recommendStrategy: 'mixed'
      }
    }
  },

  onLoad() {
    this.loadInitialData()
  },
  methods: {
    async loadInitialData() {
      try {
        console.log('开始加载搜索页面初始数据...')

        // 加载搜索页面设置
        await this.loadSearchPageSettings()

        // 先加载热门话题（最重要的数据）
        try {
          const hotTopicsRes = await api.topic.getHot(8)
          console.log('热门话题API响应:', hotTopicsRes)
          this.hotTopics = hotTopicsRes.data || []
          console.log('热门话题数据:', this.hotTopics)
        } catch (error) {
          console.error('获取热门话题失败:', error)
          this.hotTopics = []
        }

        // 加载推荐内容
        try {
          const recommendedRes = await this.getRecommendedContent()
          this.recommendedContent = recommendedRes || []
          console.log('推荐内容数据:', this.recommendedContent)
        } catch (error) {
          console.error('获取推荐内容失败:', error)
          this.recommendedContent = []
        }

        // 加载热门搜索（可选）
        try {
          const hotSearchesRes = await api.search.getHotSearches({
            limit: this.searchPageSettings.hotSearchCount
          })
          console.log('热门搜索API响应:', hotSearchesRes)

          // 处理不同的响应格式
          let hotSearches = []
          if (hotSearchesRes.data && hotSearchesRes.data.hotSearches) {
            hotSearches = hotSearchesRes.data.hotSearches
          } else if (hotSearchesRes.data && hotSearchesRes.data.keywords) {
            // 兼容旧格式，转换为新格式
            hotSearches = hotSearchesRes.data.keywords.map((keyword, index) => ({
              keyword: keyword,
              searchCount: Math.max(10 - index, 1) // 模拟搜索次数
            }))
          } else if (Array.isArray(hotSearchesRes.data)) {
            hotSearches = hotSearchesRes.data
          }

          this.hotSearches = hotSearches
          console.log('处理后的热门搜索数据:', this.hotSearches)
        } catch (error) {
          console.warn('获取热门搜索失败:', error)
          // 提供默认的热门搜索数据
          this.hotSearches = [
            { keyword: '校园活动', searchCount: 156 },
            { keyword: '期末考试', searchCount: 134 },
            { keyword: '寻物启事', searchCount: 98 },
            { keyword: '二手交易', searchCount: 87 },
            { keyword: '实习招聘', searchCount: 76 }
          ]
        }

        // 加载搜索历史（需要登录，可选）
        try {
          const historyRes = await api.search.getSearchHistory({ limit: 20 })
          this.searchHistory = historyRes.data.history || []
        } catch (error) {
          console.warn('获取搜索历史失败（可能未登录）:', error)
          this.searchHistory = []
        }

        console.log('搜索页面初始数据加载完成')
      } catch (error) {
        console.error('加载初始数据失败:', error)
      }
    },

    async getRecommendedContent() {
      try {
        // 优先尝试获取推荐内容API
        try {
          const recommendRes = await api.post.getRecommended({
            page: 1,
            pageSize: this.searchPageSettings.recommendContentCount
          })
          console.log('推荐内容API响应:', recommendRes)

          if (recommendRes.data && recommendRes.data.list) {
            return recommendRes.data.list.map(item => ({
              ...item,
              type: 'post' // 确保有类型标识
            }))
          }
        } catch (recommendError) {
          console.warn('推荐内容API失败，使用备用方案:', recommendError)
        }

        // 备用方案1：按点赞数排序
        try {
          const res = await api.post.getList({
            page: 1,
            pageSize: 6,
            orderBy: 'like_count',
            orderDirection: 'DESC'
          })
          return (res.data.list || []).map(item => ({
            ...item,
            type: 'post'
          }))
        } catch (error) {
          console.warn('按点赞数获取失败，尝试最新内容:', error)
        }

        // 备用方案2：最新内容
        const fallbackRes = await api.post.getList({
          page: 1,
          pageSize: 6,
          orderBy: 'createdAt',
          orderDirection: 'DESC'
        })
        return (fallbackRes.data.list || []).map(item => ({
          ...item,
          type: 'post'
        }))
      } catch (error) {
        console.error('获取推荐内容完全失败:', error)
        return []
      }
    },

    onSearchInput() {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }

      this.debounceTimer = setTimeout(() => {
        if (this.searchKeyword.trim()) {
          this.getSuggestions()
        } else {
          this.searchSuggestions = []
        }
      }, 300)
    },

    async getSuggestions() {
      try {
        const res = await api.search.getSuggestions({
          keyword: this.searchKeyword,
          limit: 5
        })
        console.log('搜索建议API响应:', res)

        // 处理不同的响应格式
        let suggestions = []
        if (res.data && res.data.suggestions) {
          // 新版API格式：{code: 0, data: {suggestions: [...]}}
          suggestions = res.data.suggestions
        } else if (res.data && Array.isArray(res.data)) {
          // 直接数组格式
          suggestions = res.data
        } else if (Array.isArray(res)) {
          // 直接返回数组
          suggestions = res
        }

        // 保持原始数据结构，不要只提取text
        this.searchSuggestions = suggestions.filter(Boolean)

        console.log('处理后的搜索建议:', this.searchSuggestions)
      } catch (error) {
        console.error('获取搜索建议失败:', error)
        this.searchSuggestions = []
      }
    },

    onSearchConfirm() {
      if (this.searchKeyword.trim()) {
        this.searchSuggestions = [] // 清空建议列表
        this.goToSearchResults()
      }
    },



    clearSearch() {
      this.searchKeyword = ''
      this.searchResults = null
      this.searchSuggestions = []
      // 清除防抖定时器
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
        this.debounceTimer = null
      }
    },

    goBack() {
      uni.navigateBack()
    },

    selectSuggestion(suggestion) {
      // 正确提取建议文本
      const keyword = this.getSuggestionText(suggestion)
      this.searchKeyword = keyword
      this.searchSuggestions = [] // 清空建议列表
      this.goToSearchResults()
    },

    selectHotSearch(keyword) {
      this.searchKeyword = keyword
      this.goToSearchResults()
    },

    selectHistoryItem(item) {
      this.searchKeyword = item.keyword || item
      this.goToSearchResults()
    },

    // 跳转到搜索结果页面
    goToSearchResults() {
      if (!this.searchKeyword.trim()) return

      uni.navigateTo({
        url: `/pages/search/results?keyword=${encodeURIComponent(this.searchKeyword)}`
      })
    },



    formatCount(count) {
      if (count >= 10000) {
        return Math.floor(count / 1000) / 10 + 'w'
      } else if (count >= 1000) {
        return Math.floor(count / 100) / 10 + 'k'
      }
      return count.toString()
    },

    getImageUrl(imagePath) {
      if (!imagePath) return ''
      const pathStr = String(imagePath)
      if (pathStr.startsWith('http')) return pathStr
      return `http://localhost:3000${pathStr}`
    },

    getFirstImage(images) {
      if (!images || !Array.isArray(images) || images.length === 0) {
        return null
      }

      const firstImage = images[0]
      if (typeof firstImage === 'object' && firstImage !== null) {
        return firstImage.url || firstImage.path || firstImage.src || null
      }

      return typeof firstImage === 'string' ? firstImage : null
    },

    getContentTypeText(type) {
      const typeMap = {
        'post': '帖子',
        'topic': '话题',
        'user': '用户'
      }
      return typeMap[type] || '内容'
    },

    getContentTypeClass(type) {
      return `type-${type}`
    },

    // 跳转到内容详情页面
    goToContentDetail(item) {
      if (!item || !item.id) {
        console.warn('内容项缺少ID，无法跳转')
        return
      }

      // 根据内容类型跳转到不同页面
      switch (item.type) {
        case 'post':
          this.goToPostDetail(item.id)
          break
        case 'topic':
          this.goToTopicDetail(item.id)
          break
        case 'user':
          this.goToUserProfile(item.id)
          break
        default:
          // 默认当作帖子处理
          this.goToPostDetail(item.id)
          break
      }
    },

    goToPostDetail(id) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${id}`
      })
    },

    goToUserProfile(id) {
      uni.navigateTo({
        url: `/pages/user-profile/user-profile?id=${id}`
      })
    },

    goToTopicDetail(topicId) {
      if (!topicId) {
        uni.showToast({
          title: '话题ID无效',
          icon: 'none'
        })
        return
      }

      if (this.navigating) return
      this.navigating = true

      uni.navigateTo({
        url: `/pages/topic/detail?id=${topicId}`,
        success: () => {
          setTimeout(() => {
            this.navigating = false
          }, 1000)
        },
        fail: (err) => {
          console.error('导航失败:', err)
          this.navigating = false
        }
      })
    },

    goToTopicList() {
      uni.navigateTo({
        url: '/pages/topic/list'
      })
    },



    async clearHistory() {
      try {
        await api.search.clearSearchHistory()
        this.searchHistory = []
        uni.showToast({
          title: '已清空搜索历史',
          icon: 'success'
        })
      } catch (error) {
        console.error('清空搜索历史失败:', error)
        uni.showToast({
          title: '清空失败',
          icon: 'none'
        })
      }
    },

    async removeHistoryItem(index) {
      try {
        const item = this.searchHistory[index]
        await api.search.removeSearchHistory({
          keyword: item.keyword || item
        })
        this.searchHistory.splice(index, 1)
      } catch (error) {
        console.error('删除搜索历史失败:', error)
      }
    },

    // 搜索建议辅助方法
    getSuggestionIcon(suggestion) {
      if (typeof suggestion === 'object' && suggestion.type) {
        switch (suggestion.type) {
          case 'topic':
            return '💬'
          case 'user':
            return '👤'
          case 'post':
            return '📝'
          default:
            return '🔍'
        }
      }
      return '🔍'
    },

    getSuggestionIconClass(suggestion) {
      if (typeof suggestion === 'object' && suggestion.type) {
        return `icon-${suggestion.type}`
      }
      return 'icon-default'
    },

    getSuggestionText(suggestion) {
      if (typeof suggestion === 'string') {
        return suggestion
      } else if (suggestion && suggestion.text) {
        return suggestion.text
      } else if (suggestion && suggestion.name) {
        return suggestion.name
      }
      return String(suggestion)
    },

    getSuggestionTypeText(suggestion) {
      if (typeof suggestion === 'object' && suggestion.type) {
        switch (suggestion.type) {
          case 'topic':
            return '话题'
          case 'user':
            return '用户'
          case 'post':
            return '帖子'
          default:
            return '搜索'
        }
      }
      return '搜索'
    },

    // 切换搜索历史展开状态
    toggleHistoryExpanded() {
      this.historyExpanded = !this.historyExpanded
    },

    // 刷新热门搜索
    async refreshHotSearches() {
      try {
        const hotSearchesRes = await api.search.getHotSearches({ limit: 10 })
        this.hotSearches = hotSearchesRes.data.hotSearches || []
      } catch (error) {
        console.warn('刷新热门搜索失败:', error)
      }
    },

    // 选择热门搜索
    selectHotSearch(keyword) {
      // 处理不同的数据格式
      const searchKeyword = typeof keyword === 'string' ? keyword : (keyword.keyword || keyword)
      this.searchKeyword = searchKeyword
      this.goToSearchResults()
    },

    // 刷新推荐内容
    async refreshRecommended() {
      try {
        const recommendedRes = await this.getRecommendedContent()
        this.recommendedContent = recommendedRes || []
      } catch (error) {
        console.error('刷新推荐内容失败:', error)
      }
    },

    // 获取搜索关键词（处理不同数据格式）
    getSearchKeyword(item) {
      if (typeof item === 'string') {
        return item
      }
      if (typeof item === 'object' && item !== null) {
        return item.keyword || item.name || String(item)
      }
      return String(item)
    },

    // 获取搜索次数（处理不同数据格式）
    getSearchCount(item) {
      if (typeof item === 'object' && item !== null) {
        return item.searchCount || item.count || 0
      }
      return 0
    },

    // 加载搜索页面设置
    async loadSearchPageSettings() {
      try {
        // 这里可以调用API获取后台设置，暂时使用默认值
        // const settingsRes = await api.settings.getSearchPageSettings()
        // this.searchPageSettings = { ...this.searchPageSettings, ...settingsRes.data }

        console.log('搜索页面设置:', this.searchPageSettings)
      } catch (error) {
        console.warn('获取搜索页面设置失败，使用默认设置:', error)
      }
    }

  }
}
</script>

<style lang="scss" scoped>
.search-page {
  min-height: 100vh;
  background: linear-gradient(180deg, rgba(0, 122, 255, 0.02) 0%, #f8f9fa 20%);
  display: flex;
  flex-direction: column;
}

/* 搜索头部 */
.search-header {
  background: #fff;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #eee;

  .search-container {
    display: flex;
    align-items: center;
    gap: 20rpx;
  }

  .search-box {
    flex: 1;
    display: flex;
    align-items: center;
    background: #f5f7fa;
    border-radius: 50rpx;
    padding: 20rpx 30rpx;
    border: 2rpx solid transparent;
    position: relative;
    transition: all 0.3s ease;

    &:focus-within {
      background: #fff;
      box-shadow: 0 4rpx 20rpx rgba(0, 122, 255, 0.1);
      border: 2rpx solid rgba(0, 122, 255, 0.2);
    }

    .search-icon-wrapper {
      margin-right: 20rpx;

      .search-icon {
        font-size: 32rpx;
        color: #999;
      }
    }

    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: #333;
      background: transparent;
      border: none;
      outline: none;

      &::placeholder {
        color: #999;
      }
    }

    .clear-btn {
      width: 40rpx;
      height: 40rpx;
      border-radius: 50%;
      background: rgba(153, 153, 153, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 20rpx;
      transition: all 0.2s ease;

      &:active {
        transform: scale(0.9);
        background: rgba(153, 153, 153, 0.2);
      }

      .clear-icon {
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  .cancel-btn {
    padding: 20rpx 30rpx;
    border-radius: 50rpx;
    background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 122, 255, 0.05));
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.95);
    }

    text {
      font-size: 28rpx;
      color: #007aff;
      font-weight: 500;
    }
  }
}

/* 搜索建议 */
.search-suggestions {
  background: #fff;
  border-radius: 0 0 24rpx 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  margin: 0 20rpx;
  overflow: hidden;

  .suggestions-header {
    display: flex;
    align-items: center;
    padding: 30rpx 30rpx 20rpx;
    background: linear-gradient(135deg, rgba(0, 122, 255, 0.05), rgba(77, 171, 247, 0.02));

    .header-icon {
      width: 50rpx;
      height: 50rpx;
      border-radius: 50%;
      background: linear-gradient(135deg, #ffd43b, #fab005);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;

      text {
        font-size: 24rpx;
      }
    }

    .header-text {
      font-size: 26rpx;
      color: #666;
      font-weight: 500;
      margin-right: 20rpx;
    }

    .header-line {
      flex: 1;
      height: 2rpx;
      background: linear-gradient(90deg, rgba(0, 122, 255, 0.2), transparent);
    }
  }

  .suggestions-list {
    padding: 0 20rpx;
  }

  .suggestion-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 25rpx 20rpx;
    margin-bottom: 8rpx;
    border-radius: 20rpx;
    background: #fff;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 6rpx;
      height: 100%;
      background: linear-gradient(135deg, #007aff, #4dabf7);
      transform: scaleY(0);
      transition: transform 0.3s ease;
    }

    &:active {
      transform: scale(0.98);
      background: linear-gradient(135deg, rgba(0, 122, 255, 0.05), rgba(77, 171, 247, 0.02));

      &::before {
        transform: scaleY(1);
      }
    }

    &.suggestion-highlight {
      background: linear-gradient(135deg, rgba(0, 122, 255, 0.08), rgba(77, 171, 247, 0.03));
      border: 2rpx solid rgba(0, 122, 255, 0.15);

      &::before {
        transform: scaleY(1);
      }
    }

    .suggestion-left {
      display: flex;
      align-items: center;
      flex: 1;
    }

    .suggestion-icon {
      width: 70rpx;
      height: 70rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 25rpx;

      &.icon-topic {
        background: linear-gradient(135deg, #845ef7, #9775fa);
      }

      &.icon-user {
        background: linear-gradient(135deg, #51cf66, #69db7c);
      }

      &.icon-post {
        background: linear-gradient(135deg, #ff8cc8, #ff6b9d);
      }

      &.icon-default {
        background: linear-gradient(135deg, #74c0fc, #339af0);
      }

      text {
        font-size: 30rpx;
        filter: brightness(1.1);
      }
    }

    .suggestion-content {
      flex: 1;

      .suggestion-text {
        font-size: 30rpx;
        color: #333;
        font-weight: 500;
        margin-bottom: 6rpx;
        line-height: 1.3;
      }

      .suggestion-type {
        font-size: 22rpx;
        color: #999;
        background: rgba(0, 122, 255, 0.08);
        padding: 4rpx 12rpx;
        border-radius: 12rpx;
        display: inline-block;
      }
    }

    .suggestion-right {
      margin-left: 20rpx;
    }

    .suggestion-action {
      display: flex;
      align-items: center;
      padding: 12rpx 20rpx;
      border-radius: 50rpx;
      background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(77, 171, 247, 0.05));
      border: 2rpx solid rgba(0, 122, 255, 0.15);

      .action-text {
        font-size: 24rpx;
        color: #007aff;
        font-weight: 500;
        margin-right: 8rpx;
      }

      .action-arrow {
        font-size: 24rpx;
        color: #007aff;
        transform: translateX(0);
        transition: transform 0.3s ease;
      }
    }

    &:active .suggestion-action .action-arrow {
      transform: translateX(6rpx);
    }
  }

  .suggestions-footer {
    padding: 20rpx 30rpx 30rpx;
    background: linear-gradient(135deg, rgba(0, 122, 255, 0.02), rgba(77, 171, 247, 0.01));
    border-top: 1rpx solid rgba(0, 122, 255, 0.08);

    .footer-tip {
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        font-size: 22rpx;
        color: #999;
        background: rgba(0, 122, 255, 0.05);
        padding: 8rpx 16rpx;
        border-radius: 20rpx;
        border: 1rpx solid rgba(0, 122, 255, 0.1);
      }
    }
  }
}

/* 发现内容区域 */
.discover-content {
  flex: 1;
  background: #f8f9fa;
}

.discover-section {
  margin-bottom: 60rpx;

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 40rpx 30rpx 30rpx;

    .section-title {
      display: flex;
      align-items: center;

      .title-icon {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20rpx;

        &.hot-icon {
          background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
        }

        &.topic-icon {
          background: linear-gradient(135deg, #845ef7, #9775fa);
        }

        &.recommend-icon {
          background: linear-gradient(135deg, #ffd43b, #fab005);
        }

        &.history-icon {
          background: linear-gradient(135deg, #74c0fc, #339af0);
        }

        text {
          font-size: 28rpx;
        }
      }

      .title-text {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
      }
    }

    .section-more {
      display: flex;
      align-items: center;
      padding: 16rpx 24rpx;
      border-radius: 50rpx;
      background: rgba(0, 122, 255, 0.1);
      transition: all 0.3s ease;

      &:active {
        transform: scale(0.95);
        background: rgba(0, 122, 255, 0.15);
      }

      .more-text {
        font-size: 24rpx;
        color: #007aff;
        margin-right: 8rpx;
      }

      .more-arrow {
        font-size: 24rpx;
        color: #007aff;
      }
    }
  }
}



/* 热门话题 */
.topics-scroll {
  white-space: nowrap;
}

.topics-container {
  display: flex;
  padding: 0 30rpx;
  gap: 20rpx;
}

.topic-card {
  min-width: 200rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.95);
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  }

  .topic-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 auto 20rpx;

    .avatar-image {
      width: 100%;
      height: 100%;
    }

    .default-avatar {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #007aff, #4dabf7);
      display: flex;
      align-items: center;
      justify-content: center;

      .avatar-text {
        font-size: 32rpx;
        color: #fff;
        font-weight: 600;
      }
    }
  }

  .topic-info {
    text-align: center;

    .topic-name {
      font-size: 26rpx;
      color: #333;
      font-weight: 500;
      margin-bottom: 8rpx;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .topic-stats {
      font-size: 22rpx;
      color: #999;
    }
  }
}

/* 推荐内容 */
.recommend-list {
  padding: 0 30rpx;
}

.recommend-item {
  display: flex;
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  }

  .recommend-content {
    flex: 1;
    margin-right: 30rpx;

    .recommend-title {
      font-size: 28rpx;
      color: #333;
      line-height: 1.5;
      margin-bottom: 20rpx;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .recommend-meta {
      display: flex;
      align-items: center;
      gap: 20rpx;

      .meta-tag {
        padding: 8rpx 16rpx;
        border-radius: 20rpx;
        font-size: 22rpx;

        &.type-post {
          background: rgba(0, 122, 255, 0.1);
          color: #007aff;
        }

        &.type-topic {
          background: rgba(132, 94, 247, 0.1);
          color: #845ef7;
        }

        &.type-user {
          background: rgba(81, 207, 102, 0.1);
          color: #51cf66;
        }
      }

      .meta-stats {
        font-size: 22rpx;
        color: #999;
      }
    }
  }

  .recommend-thumb {
    width: 120rpx;
    height: 120rpx;
    border-radius: 16rpx;
    overflow: hidden;
    background: #f5f7fa;

    .thumb-image {
      width: 100%;
      height: 100%;
    }
  }
}

/* 搜索历史 - 标签式布局 */
.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding: 0 30rpx 20rpx;

  .history-tag {
    display: flex;
    align-items: center;
    background: #f5f7fa;
    border-radius: 50rpx;
    padding: 16rpx 20rpx;
    border: 2rpx solid transparent;
    transition: all 0.3s ease;
    max-width: 200rpx;

    &:active {
      transform: scale(0.95);
      background: rgba(0, 122, 255, 0.1);
      border-color: rgba(0, 122, 255, 0.2);
    }

    .tag-text {
      font-size: 26rpx;
      color: #333;
      margin-right: 12rpx;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120rpx;
    }

    .tag-close {
      width: 32rpx;
      height: 32rpx;
      border-radius: 50%;
      background: rgba(153, 153, 153, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:active {
        transform: scale(0.9);
        background: rgba(255, 59, 48, 0.2);
      }

      text {
        font-size: 20rpx;
        color: #999;
        line-height: 1;
      }
    }
  }
}

.show-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
  margin: 0 30rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
    background: #f0f0f0;
  }

  .more-text {
    font-size: 26rpx;
    color: #666;
    margin-right: 8rpx;
  }

  .more-icon {
    font-size: 20rpx;
    color: #666;
  }
}

/* 热门搜索 - 标签式布局 */
.hot-search-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding: 0 30rpx 20rpx;

  .hot-search-tag {
    display: flex;
    align-items: center;
    background: #f5f7fa;
    border-radius: 50rpx;
    padding: 16rpx 20rpx;
    border: 2rpx solid transparent;
    transition: all 0.3s ease;
    position: relative;

    &:active {
      transform: scale(0.95);
      background: rgba(0, 122, 255, 0.1);
      border-color: rgba(0, 122, 255, 0.2);
    }

    &.top-rank {
      background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 142, 142, 0.05));
      border-color: rgba(255, 107, 107, 0.2);

      .rank-badge {
        background: linear-gradient(135deg, #ff6b6b, #ff8e8e);

        text {
          color: #fff;
          font-weight: 600;
        }
      }

      .tag-text {
        color: #ff6b6b;
        font-weight: 500;
      }
    }

    .rank-badge {
      width: 28rpx;
      height: 28rpx;
      border-radius: 50%;
      background: #ddd;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12rpx;

      text {
        font-size: 20rpx;
        color: #666;
        font-weight: 500;
        line-height: 1;
      }
    }

    .tag-text {
      font-size: 26rpx;
      color: #333;
      margin-right: 8rpx;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120rpx;
    }

    .search-count {
      background: rgba(153, 153, 153, 0.1);
      border-radius: 20rpx;
      padding: 4rpx 12rpx;

      text {
        font-size: 20rpx;
        color: #999;
        line-height: 1;
      }
    }
  }
}


</style>