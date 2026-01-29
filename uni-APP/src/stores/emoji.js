/**
 * 表情状态管理Store
 * 管理表情包列表、表情映射、最近使用、收藏等
 */
import { defineStore } from 'pinia';
import api from '@/api';
import wsClient from '@/utils/websocket';

// 本地存储键名
const STORAGE_KEYS = {
  VERSION: 'emoji_version',
  PACKS: 'emoji_packs',
  MAP: 'emoji_map',
  RECENT: 'emoji_recent',
  FAVORITES: 'emoji_favorites'
};

// 配置
const CONFIG = {
  recentLimit: 30,
  cacheExpiry: 24 * 60 * 60 * 1000 // 24小时
};

export const useEmojiStore = defineStore('emoji', {
  state: () => ({
    // 版本号
    version: 0,
    
    // 表情包列表
    packs: [],
    
    // 表情映射表 { code: { id, url, type, width, height } }
    emojiMap: {},
    
    // 最近使用的表情
    recentEmojis: [],
    
    // 收藏的表情
    favoriteEmojis: [],
    
    // 用户拥有的表情包
    userPacks: [],
    
    // 加载状态
    loading: false,
    initialized: false,
    
    // 当前选中的表情包索引
    currentPackIndex: 0,
    
    // 搜索结果
    searchResults: [],
    searchKeyword: ''
  }),

  getters: {
    /**
     * 获取当前表情包的表情列表
     */
    currentPackEmojis(state) {
      if (state.currentPackIndex === -1) {
        // 最近使用
        return state.recentEmojis;
      }
      if (state.currentPackIndex === -2) {
        // 收藏
        return state.favoriteEmojis;
      }
      const pack = state.packs[state.currentPackIndex];
      return pack?.emojis || [];
    },

    /**
     * 获取所有可用表情包（包含最近使用和收藏）
     */
    allPacks(state) {
      const specialPacks = [
        { id: 'recent', name: '最近', icon: '🕐', type: 'special' },
        { id: 'favorite', name: '收藏', icon: '⭐', type: 'special' }
      ];
      return [...specialPacks, ...state.packs];
    },

    /**
     * 检查是否有表情数据
     */
    hasEmojis(state) {
      return state.packs.length > 0 || Object.keys(state.emojiMap).length > 0;
    },

    /**
     * 构建用于渲染的正则表达式
     */
    emojiRegex(state) {
      const codes = Object.keys(state.emojiMap);
      if (codes.length === 0) return null;
      // 转义特殊字符并构建正则
      const escapedCodes = codes.map(code => 
        code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      );
      return new RegExp(`(${escapedCodes.join('|')})`, 'g');
    }
  },

  actions: {
    /**
     * 初始化表情系统
     * 分两步：1. 获取全局数据（表情包）2. 获取用户数据（收藏、最近使用等）
     */
    async initialize() {
      if (this.initialized) return;
      
      this.loading = true;
      
      try {
        // 加载本地缓存
        this.loadFromStorage();
        
        // 初始化WebSocket监听器（只初始化一次）
        this.initWebSocketListeners();
        
        // 第一步：获取全局数据（表情包）
        await this.fetchGlobalData();
        
        // 第二步：获取用户数据（独立请求，不依赖版本号）
        await this.fetchUserData();
        
        this.initialized = true;
      } catch (error) {
        console.error('初始化表情系统失败:', error);
        // 使用本地缓存数据
      } finally {
        this.loading = false;
      }
    },

    /**
     * 获取全局数据（表情包）
     * 依赖版本号进行全量/增量更新
     */
    async fetchGlobalData() {
      console.log('发送版本号:', this.version);
      
      const res = await api.emoji.getInitData(this.version);
      
      console.log('表情API返回数据:', res);
      
      if (res.code === 0 && res.data) {
        const data = res.data;
        
        console.log('表情初始化数据:', {
          needUpdate: data.needUpdate,
          updateType: data.updateType,
          packsLength: data.packs?.length,
          version: data.version
        });
        
        if (data.needUpdate) {
          if (data.updateType === 'full') {
            // 全量更新
            console.log('执行全量更新, packs数据:', data.packs);
            this.handleFullUpdate(data);
          } else if (data.updateType === 'incremental') {
            // 增量更新
            this.handleIncrementalUpdate(data);
          }
        }
        
        // 更新版本号
        if (data.version) {
          this.version = data.version;
          this.saveToStorage(STORAGE_KEYS.VERSION, data.version);
        }
      }
    },

    /**
     * 获取用户数据（收藏、最近使用、自定义表情等）
     * 独立请求，不依赖全局版本号
     */
    async fetchUserData() {
      try {
        const res = await api.emoji.getUserData();
        
        if (res.code === 0 && res.data) {
          const data = res.data;
          
          console.log('用户表情数据:', {
            favoritesCount: data.favorites?.length,
            recentCount: data.recent?.length,
            customEmojisCount: data.customEmojis?.length,
            userPacksCount: data.userPacks?.length
          });
          
          // 更新收藏
          if (data.favorites) {
            this.favoriteEmojis = data.favorites;
            this.saveToStorage(STORAGE_KEYS.FAVORITES, data.favorites);
          }
          
          // 更新最近使用
          if (data.recent) {
            this.recentEmojis = data.recent;
            this.saveToStorage(STORAGE_KEYS.RECENT, data.recent);
          }
          
          // 更新自定义表情（添加到收藏中显示）
          if (data.customEmojis && data.customEmojis.length > 0) {
            // 将自定义表情合并到收藏列表
            const customIds = new Set(data.customEmojis.map(e => e.id));
            const existingFavorites = this.favoriteEmojis.filter(e => !customIds.has(e.id));
            this.favoriteEmojis = [...data.customEmojis, ...existingFavorites];
            this.saveToStorage(STORAGE_KEYS.FAVORITES, this.favoriteEmojis);
          }
          
          // 更新用户表情包
          if (data.userPacks) {
            this.userPacks = data.userPacks;
          }
        }
      } catch (error) {
        console.warn('获取用户表情数据失败:', error);
        // 用户数据获取失败不影响全局数据使用
      }
    },

    /**
     * 刷新用户数据（审核通过后调用）
     */
    async refreshUserData() {
      await this.fetchUserData();
    },

    /**
     * 初始化WebSocket监听器
     * 监听表情审核通知，自动刷新用户数据
     */
    initWebSocketListeners() {
      // 监听表情审核通过通知
      wsClient.on('emoji_approved', (data) => {
        console.log('收到表情审核通过通知:', data);
        
        // 显示通知
        uni.showToast({
          title: data.data?.message || '您的表情已审核通过',
          icon: 'success',
          duration: 3000
        });
        
        // 刷新用户数据
        this.refreshUserData();
      });

      // 监听表情审核拒绝通知
      wsClient.on('emoji_rejected', (data) => {
        console.log('收到表情审核拒绝通知:', data);
        
        // 显示通知
        uni.showModal({
          title: '表情审核未通过',
          content: data.data?.message || '您的表情未通过审核',
          showCancel: false
        });
      });

      console.log('表情系统WebSocket监听器已初始化');
    },

    /**
     * 处理全量更新
     */
    handleFullUpdate(data) {
      if (data.packs) {
        this.packs = data.packs;
        this.saveToStorage(STORAGE_KEYS.PACKS, data.packs);
      }
      
      if (data.emojiMap) {
        this.emojiMap = data.emojiMap;
        this.saveToStorage(STORAGE_KEYS.MAP, data.emojiMap);
      }
    },

    /**
     * 处理增量更新
     */
    handleIncrementalUpdate(data) {
      if (!data.changes) return;
      
      const { added, updated, deleted } = data.changes;
      
      // 处理删除
      if (deleted && deleted.length > 0) {
        const deletedSet = new Set(deleted);
        // 从映射表删除
        for (const code of Object.keys(this.emojiMap)) {
          if (deletedSet.has(this.emojiMap[code].id)) {
            delete this.emojiMap[code];
          }
        }
        // 从表情包删除
        this.packs.forEach(pack => {
          pack.emojis = pack.emojis?.filter(e => !deletedSet.has(e.id)) || [];
        });
      }
      
      // 处理添加和更新
      const toProcess = [...(added || []), ...(updated || [])];
      toProcess.forEach(emoji => {
        // 更新映射表
        this.emojiMap[emoji.code] = {
          id: emoji.id,
          url: emoji.url,
          thumbnailUrl: emoji.thumbnailUrl,
          type: emoji.type,
          width: emoji.width,
          height: emoji.height
        };
        
        // 更新表情包中的表情
        if (emoji.pack) {
          const packIndex = this.packs.findIndex(p => p.id === emoji.pack.id);
          if (packIndex !== -1) {
            const emojiIndex = this.packs[packIndex].emojis?.findIndex(e => e.id === emoji.id);
            if (emojiIndex !== -1) {
              this.packs[packIndex].emojis[emojiIndex] = emoji;
            } else {
              this.packs[packIndex].emojis = this.packs[packIndex].emojis || [];
              this.packs[packIndex].emojis.push(emoji);
            }
          }
        }
      });
      
      // 保存到本地
      this.saveToStorage(STORAGE_KEYS.PACKS, this.packs);
      this.saveToStorage(STORAGE_KEYS.MAP, this.emojiMap);
    },

    /**
     * 记录表情使用
     */
    async recordUsage(emoji) {
      // 立即更新本地最近使用列表
      const existingIndex = this.recentEmojis.findIndex(e => e.id === emoji.id);
      if (existingIndex !== -1) {
        this.recentEmojis.splice(existingIndex, 1);
      }
      this.recentEmojis.unshift(emoji);
      
      // 限制数量
      if (this.recentEmojis.length > CONFIG.recentLimit) {
        this.recentEmojis = this.recentEmojis.slice(0, CONFIG.recentLimit);
      }
      
      // 保存到本地
      this.saveToStorage(STORAGE_KEYS.RECENT, this.recentEmojis);
      
      // 异步上报服务器
      try {
        await api.emoji.recordUsage(emoji.id);
      } catch (error) {
        console.warn('记录表情使用失败:', error);
      }
    },

    /**
     * 收藏表情
     */
    async addFavorite(emoji) {
      // 检查是否已收藏
      if (this.favoriteEmojis.some(e => e.id === emoji.id)) {
        return;
      }
      
      // 立即更新本地
      this.favoriteEmojis.unshift(emoji);
      this.saveToStorage(STORAGE_KEYS.FAVORITES, this.favoriteEmojis);
      
      // 同步到服务器
      try {
        await api.emoji.addFavorite(emoji.id);
      } catch (error) {
        console.error('收藏表情失败:', error);
        // 回滚
        this.favoriteEmojis = this.favoriteEmojis.filter(e => e.id !== emoji.id);
        throw error;
      }
    },

    /**
     * 取消收藏
     */
    async removeFavorite(emojiId) {
      const index = this.favoriteEmojis.findIndex(e => e.id === emojiId);
      if (index === -1) return;
      
      const removed = this.favoriteEmojis[index];
      
      // 立即更新本地
      this.favoriteEmojis.splice(index, 1);
      this.saveToStorage(STORAGE_KEYS.FAVORITES, this.favoriteEmojis);
      
      // 同步到服务器
      try {
        await api.emoji.removeFavorite(emojiId);
      } catch (error) {
        console.error('取消收藏失败:', error);
        // 回滚
        this.favoriteEmojis.splice(index, 0, removed);
        throw error;
      }
    },

    /**
     * 检查是否已收藏
     */
    isFavorite(emojiId) {
      return this.favoriteEmojis.some(e => e.id === emojiId);
    },

    /**
     * 搜索表情
     */
    async searchEmojis(keyword) {
      if (!keyword || keyword.trim().length === 0) {
        this.searchResults = [];
        this.searchKeyword = '';
        return;
      }
      
      this.searchKeyword = keyword.trim();
      
      try {
        const res = await api.emoji.search(this.searchKeyword);
        if (res.code === 0) {
          this.searchResults = res.data || [];
        }
      } catch (error) {
        console.error('搜索表情失败:', error);
        this.searchResults = [];
      }
    },

    /**
     * 清除搜索
     */
    clearSearch() {
      this.searchResults = [];
      this.searchKeyword = '';
    },

    /**
     * 切换表情包
     */
    setCurrentPack(index) {
      this.currentPackIndex = index;
    },

    /**
     * 获取表情图片URL
     */
    getEmojiUrl(code) {
      const emoji = this.emojiMap[code];
      if (!emoji) return null;
      
      // 如果是相对路径，添加baseURL
      let url = emoji.thumbnailUrl || emoji.url;
      if (url && !url.startsWith('http')) {
        const baseUrl = api.http.baseURL || '';
        url = baseUrl + (url.startsWith('/') ? '' : '/') + url;
      }
      return url;
    },

    /**
     * 将文本中的表情代码替换为图片节点（用于rich-text）
     */
    parseEmojiToNodes(text) {
      if (!text || !this.emojiRegex) return [{ type: 'text', text }];
      
      const nodes = [];
      let lastIndex = 0;
      let match;
      
      const regex = new RegExp(this.emojiRegex.source, 'g');
      
      while ((match = regex.exec(text)) !== null) {
        // 添加匹配前的文本
        if (match.index > lastIndex) {
          nodes.push({
            type: 'text',
            text: text.slice(lastIndex, match.index)
          });
        }
        
        // 添加表情图片节点
        const code = match[0];
        const url = this.getEmojiUrl(code);
        if (url) {
          nodes.push({
            name: 'img',
            attrs: {
              src: url,
              style: 'width: 24px; height: 24px; vertical-align: middle; margin: 0 2px;',
              class: 'emoji-img'
            }
          });
        } else {
          // 未找到对应图片，保留原文本
          nodes.push({
            type: 'text',
            text: code
          });
        }
        
        lastIndex = regex.lastIndex;
      }
      
      // 添加剩余文本
      if (lastIndex < text.length) {
        nodes.push({
          type: 'text',
          text: text.slice(lastIndex)
        });
      }
      
      return nodes;
    },

    /**
     * 将文本中的表情代码替换为HTML（用于v-html）
     */
    parseEmojiToHtml(text) {
      if (!text || !this.emojiRegex) return text;
      
      return text.replace(this.emojiRegex, (match) => {
        const url = this.getEmojiUrl(match);
        if (url) {
          return `<img src="${url}" class="emoji-img" style="width: 24px; height: 24px; vertical-align: middle; margin: 0 2px;" alt="${match}" />`;
        }
        return match;
      });
    },

    /**
     * 从本地存储加载数据
     */
    loadFromStorage() {
      try {
        const version = uni.getStorageSync(STORAGE_KEYS.VERSION);
        const packs = uni.getStorageSync(STORAGE_KEYS.PACKS);
        const emojiMap = uni.getStorageSync(STORAGE_KEYS.MAP);
        
        // 如果有版本号但没有数据，说明数据不完整，重置版本号
        if (version && (!packs || packs.length === 0) && (!emojiMap || Object.keys(emojiMap).length === 0)) {
          console.warn('本地缓存不完整，重置版本号');
          this.version = 0;
          this.clearCache();
        } else {
          if (version) this.version = version;
          if (packs) this.packs = packs;
          if (emojiMap) this.emojiMap = emojiMap;
        }
        
        const recent = uni.getStorageSync(STORAGE_KEYS.RECENT);
        if (recent) this.recentEmojis = recent;
        
        const favorites = uni.getStorageSync(STORAGE_KEYS.FAVORITES);
        if (favorites) this.favoriteEmojis = favorites;
      } catch (error) {
        console.error('加载本地表情数据失败:', error);
      }
    },

    /**
     * 保存数据到本地存储
     */
    saveToStorage(key, data) {
      try {
        uni.setStorageSync(key, data);
      } catch (error) {
        console.error('保存表情数据失败:', error);
      }
    },

    /**
     * 清除所有本地缓存
     */
    clearCache() {
      Object.values(STORAGE_KEYS).forEach(key => {
        try {
          uni.removeStorageSync(key);
        } catch (e) {}
      });
      
      this.version = 0;
      this.packs = [];
      this.emojiMap = {};
      this.recentEmojis = [];
      this.favoriteEmojis = [];
      this.initialized = false;
    },

    /**
     * 刷新表情数据（强制全量更新）
     */
    async refresh() {
      this.version = 0;
      this.initialized = false;
      await this.initialize();
    }
  }
});
