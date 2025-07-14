<template>
  <view class="favorites-container">
    <!-- 自定义导航栏 -->
    <view class="custom-nav">
      <view class="nav-left" @tap="goBack">
        <image class="back-icon-img" src="../../static/icons/icon_ztc.png" mode="aspectFit"></image>
      </view>
      <view class="nav-title">我的收藏</view>
      <view class="nav-right" @tap="showSearch">
        <image class="search-icon-img" src="../../../static/icons/search.png" mode="aspectFit"></image>
      </view>
    </view>
    
    <!-- 时间筛选 -->
    <view class="time-filter">
      <view class="filter-label">收藏时间:</view>
      <picker mode="selector" :range="timeRanges" @change="onTimeFilterChange">
        <view class="filter-value">
          <text>{{ timeRanges[timeFilter] }}</text>
        </view>
      </picker>
    </view>
    
    <!-- 内容列表 -->
    <scroll-view 
      scroll-y 
      class="favorites-list"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <!-- 收藏项目列表 -->
      <block v-if="favoritesList.length > 0">
        <view class="favorite-item" v-for="(item, index) in favoritesList" :key="item.id" @tap="viewDetail(item)">
          <view class="favorite-content">
            <view class="favorite-title">{{ item.title || item.content }}</view>
            <view class="favorite-excerpt" v-if="item.excerpt">{{ item.excerpt }}</view>
            
            <!-- 图片内容 -->
            <view 
              class="image-container" 
              v-if="item.images && item.images.length"
            >
              <image 
                v-for="(img, imgIndex) in item.images.slice(0, 3)" 
                :key="imgIndex" 
                :src="img" 
                mode="aspectFill" 
                class="favorite-image"
                @tap.stop="previewImage(item.images, imgIndex)"
              ></image>
              <view class="image-count" v-if="item.images.length > 3">+{{ item.images.length - 3 }}</view>
            </view>
            
            <!-- 来源信息 -->
            <view class="favorite-meta">
              <view class="meta-author">
                <image class="author-avatar" :src="item.avatar" mode="aspectFill"></image>
                <text>{{ item.author }}</text>
              </view>
              <text class="meta-separator">·</text>
              <text>{{ item.time }}</text>
              <text class="meta-separator">·</text>
              <text class="meta-category">{{ getCategoryName(item.category) }}</text>
            </view>
          </view>
          
          <!-- 右侧操作 -->
          <view class="favorite-actions">
            <view class="action-menu" @tap.stop="showActionMenu(index)">
              <image class="action-icon" src="../../static/icons/sc.png" mode="aspectFit"></image>
            </view>
            <view class="action-time">{{ item.favoriteTime }}</view>
          </view>
        </view>
      </block>
      
      <!-- 无内容提示 -->
      <view class="empty-list" v-if="favoritesList.length === 0">
        <image class="empty-icon" src="/static/icons/empty-box.png" mode="aspectFit"></image>
        <text>暂无收藏内容</text>
        <view class="empty-action" @tap="goExplore">
          <text>去发现好内容</text>
          <text class="iconfont icon-arrow-right"></text>
        </view>
      </view>
      
      <!-- 加载更多提示 -->
      <view class="loading-more" v-if="loading">
        <text>加载中...</text>
      </view>
      
      <!-- 没有更多数据提示 -->
      <view class="no-more" v-if="noMore">
        <text>— 没有更多内容了 —</text>
      </view>
    </scroll-view>
    
    <!-- 搜索框弹出层 -->
    <view class="search-popup" v-if="showSearchPopup">
      <view class="search-header">
        <view class="search-input-wrap">
          <image class="search-icon-mini" src="../../../static/icons/search.png" mode="aspectFit"></image>
          <input 
            class="search-input" 
            v-model="searchText" 
            placeholder="搜索收藏内容" 
            focus
            confirm-type="search"
            @confirm="doSearch"
          />
          <text class="iconfont icon-close" v-if="searchText" @tap="clearSearch"></text>
        </view>
        <view class="search-cancel" @tap="hideSearch">取消</view>
      </view>
      
      <view class="search-history" v-if="searchHistory.length > 0 && !searchText">
        <view class="history-header">
          <text>搜索历史</text>
          <text class="iconfont icon-delete" @tap="clearHistory"></text>
        </view>
        <view class="history-tags">
          <view 
            class="history-tag" 
            v-for="(tag, index) in searchHistory" 
            :key="index"
            @tap="useHistoryTag(tag)"
          >
            {{ tag }}
          </view>
        </view>
      </view>
    </view>
    
    <!-- 收藏夹选择弹出层 -->
    <view class="collection-popup" v-if="showCollectionPopup">
      <view class="collection-header">
        <text class="collection-title">选择收藏夹</text>
        <text class="collection-close iconfont icon-close" @tap="closeCollectionPopup"></text>
      </view>
      
      <scroll-view scroll-y class="collection-list">
        <view 
          class="collection-item" 
          v-for="collection in collections" 
          :key="collection.id"
          :class="{ active: selectedCollectionId === collection.id }"
          @tap="selectCollection(collection.id)"
        >
          <view class="collection-item-left">
            <view class="collection-icon">
              <image class="collection-icon-img" src="../../static/icons/sc.png" mode="aspectFit"></image>
            </view>
            <view class="collection-info">
              <text class="collection-name">{{ collection.name }}</text>
              <text class="collection-count">{{ collection.count }}个内容</text>
            </view>
          </view>
          <view class="collection-select" v-if="selectedCollectionId === collection.id">
            <text class="iconfont icon-selected"></text>
          </view>
        </view>
      </scroll-view>
      
      <view class="create-collection">
        <view class="create-collection-input">
          <text class="iconfont icon-add"></text>
          <input 
            class="input-field" 
            v-model="newCollectionName" 
            placeholder="创建新收藏夹" 
            maxlength="20"
          />
        </view>
        <button class="create-btn" @tap="createCollection">创建</button>
      </view>
      
      <view class="collection-actions">
        <button class="action-btn cancel" @tap="closeCollectionPopup">取消</button>
        <button class="action-btn confirm" @tap="confirmAddToCollection">确定</button>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js';
import store from '@/utils/store.js';
import { formatTime } from '@/utils/time';

export default {
  data() {
    return {
      currentCategory: 'all',
      timeFilter: 0,
      timeRanges: ['全部时间', '最近一周', '最近一个月', '最近三个月'],
      refreshing: false,
      loading: false,
      page: 1,
      limit: 10,
      noMore: false,
      favoritesList: [],
      showSearchPopup: false,
      searchText: '',
      searchHistory: [],
      collections: [],
      showCollectionPopup: false,
      newCollectionName: '',
      selectedCollectionId: null,
      selectedItem: null,
      totalItems: 0
    }
  },
  onLoad() {
    this.loadFavorites();
    // 加载收藏夹列表
    this.loadCollections();
    // 从本地存储加载搜索历史
    this.loadSearchHistory();
  },
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 时间筛选变更
    onTimeFilterChange(e) {
      this.timeFilter = e.detail.value;
      this.page = 1;
      this.favoritesList = [];
      this.noMore = false;
      this.loadFavorites();
    },
    
    // 获取时间过滤的日期范围
    getTimeFilterDates() {
      const now = new Date();
      let startDate = null;
      
      switch(this.timeFilter) {
        case 1: // 最近一周
          startDate = new Date();
          startDate.setDate(now.getDate() - 7);
          break;
        case 2: // 最近一个月
          startDate = new Date();
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 3: // 最近三个月
          startDate = new Date();
          startDate.setMonth(now.getMonth() - 3);
          break;
        default: // 全部时间
          startDate = null;
      }
      
      return startDate ? startDate.toISOString().split('T')[0] : null;
    },
    
    // 下拉刷新
    onRefresh() {
      this.refreshing = true;
      this.page = 1;
      this.favoritesList = [];
      this.noMore = false;
      this.loadFavorites(() => {
        this.refreshing = false;
      });
    },
    
    // 加载更多
    loadMore() {
      if (this.loading || this.noMore) return;
      
      this.page++;
      this.loadFavorites();
    },
    
    // 获取分类名称
    getCategoryName(category) {
      const categoryMap = {
        post: '帖子',
        article: '文章',
        video: '视频',
        image: '图片'
      };
      
      return categoryMap[category] || category;
    },
    
    // 查看详情
    viewDetail(item) {
      if (item.postId) {
        uni.navigateTo({
          url: `/pages/post/detail?id=${item.postId}`
        });
      } else {
        uni.showToast({
          title: '无法查看详情',
          icon: 'none'
        });
      }
    },
    
    // 预览图片
    previewImage(images, index) {
      uni.previewImage({
        urls: images,
        current: images[index]
      });
    },
    
    // 显示操作菜单
    showActionMenu(index) {
      const item = this.favoritesList[index];
      uni.showActionSheet({
        itemList: ['取消收藏', '分享', '加入收藏夹'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.unfavorite(index);
          } else if (res.tapIndex === 1) {
            this.shareFavorite(item);
          } else if (res.tapIndex === 2) {
            this.addToCollection(item);
          }
        }
      });
    },
    
    // 取消收藏
    unfavorite(index) {
      const item = this.favoritesList[index];
      if (!item || !item.id) {
        uni.showToast({
          title: '无效的收藏项',
          icon: 'none'
        });
        return;
      }
      
      uni.showModal({
        title: '取消收藏',
        content: '确定要取消收藏该内容吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({
                title: '处理中...',
                mask: true
              });
              
              // 调用取消收藏API
              const result = await api.posts.uncollect(item.postId);
              
              if (result.success) {
                // 从列表中移除
                this.favoritesList.splice(index, 1);
                this.totalItems--;
                
                uni.showToast({
                  title: '已取消收藏',
                  icon: 'success'
                });
              } else {
                uni.showToast({
                  title: result.message || '操作失败',
                  icon: 'none'
                });
              }
            } catch (error) {
              console.error('取消收藏失败:', error);
              uni.showToast({
                title: '取消收藏失败，请稍后再试',
                icon: 'none'
              });
            } finally {
              uni.hideLoading();
            }
          }
        }
      });
    },
    
    // 分享收藏
    shareFavorite(item) {
      uni.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    },
    
    // 加载收藏数据
    async loadFavorites(callback) {
      if (this.loading && this.page > 1) return;
      
      this.loading = true;
      
      try {
        // 获取当前登录用户ID
        const user = store.getters.getUser();
        if (!user || !user.id) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
            duration: 2000
          });
          
          setTimeout(() => {
            uni.navigateTo({
              url: '/pages/login/login'
            });
          }, 1500);
          
          this.loading = false;
          if (typeof callback === 'function') callback();
          return;
        }
        
        console.log('当前用户ID:', user.id);
        
        // 构建API参数
        const params = {
          page: this.page,
          limit: this.limit,
          // 重要：移除folderOnly参数，或设置为false，以获取收藏内容而不是收藏夹
          folderOnly: false
        };
        
        // 添加时间筛选
        const startDate = this.getTimeFilterDates();
        if (startDate) {
          params.startDate = startDate;
        }
        
        // 添加搜索关键字
        if (this.searchText) {
          params.keyword = this.searchText;
        }
        
        console.log('请求收藏列表参数:', params);
        
        // 调用API获取收藏列表
        const result = await api.users.getCollections(user.id, params);
        console.log('收藏列表API原始响应:', JSON.stringify(result, null, 2));
        
        if (result && (result.success || result.code === 0 || result.code === 200)) {
          let collections = [];
          let pagination = { page: 1, pages: 1, total: 0 };
          
          // 详细检查API响应结构
          console.log('API响应状态:', result.success ? '成功' : '失败');
          console.log('API响应结构:', Object.keys(result));
          console.log('数据类型:', result.data ? (Array.isArray(result.data) ? 'Array' : typeof result.data) : 'null');
          
          if (result.data && typeof result.data === 'object') {
            console.log('result.data的键:', Object.keys(result.data));
          }
          
          // 处理多种可能的数据结构
          if (result.data) {
            if (Array.isArray(result.data)) {
              console.log('返回数据是数组格式, 长度:', result.data.length);
              collections = result.data;
            } else if (result.data.collections) {
              console.log('返回数据包含collections字段, 长度:', result.data.collections.length);
              collections = result.data.collections;
              pagination = result.data.pagination || pagination;
            } else if (result.data.posts) {
              console.log('返回数据包含posts字段, 长度:', result.data.posts.length);
              collections = result.data.posts;
              pagination = result.data.pagination || pagination;
            } else if (result.data.items) {
              console.log('返回数据包含items字段, 长度:', result.data.items.length);
              collections = result.data.items;
              pagination = result.data.pagination || pagination;
            } else if (result.data.list) {
              console.log('返回数据包含list字段, 长度:', result.data.list.length);
              collections = result.data.list;
              pagination = result.data.pagination || pagination;
            } else if (result.data.data) {
              console.log('返回数据包含data字段, 长度:', Array.isArray(result.data.data) ? result.data.data.length : 'not an array');
              collections = result.data.data;
              pagination = result.data.pagination || pagination;
            } else if (result.data.post) {
              console.log('返回数据直接包含post数据');
              collections = [result.data];
            } else {
              console.log('返回数据结构未识别，尝试直接使用');
              collections = [result.data];
            }
          } else if (Array.isArray(result)) {
            console.log('直接返回数组, 长度:', result.length);
            collections = result;
          } else {
            console.error('无法解析收藏数据:', result);
            collections = [];
          }
          
          // 确保collections是数组
          if (!Array.isArray(collections)) {
            console.error('格式化后的收藏数据不是数组:', collections);
            collections = [];
          }
          
          console.log('处理前的收藏数据数量:', collections.length);
          if (collections.length > 0) {
            console.log('第一条收藏数据示例:', JSON.stringify(collections[0], null, 2));
          }
          
          // 处理收藏数据
          const formattedCollections = collections.map((item, index) => {
            console.log(`处理第${index+1}个收藏项:`, item?.id || 'unknown id');
            
            // 提取帖子数据，处理可能的不同结构
            let post = item;  // 直接使用item本身，因为数据已经是帖子
            if (typeof post !== 'object') {
              post = {};
            }
            
            console.log(`收藏项${index+1}的post数据类型:`, typeof post, post?.id ? `ID: ${post.id}` : 'no id');
            
            // 提取作者数据
            let author = post.author || post.userData || {};
            if (typeof author !== 'object') {
              author = {};
            }
            
            // 处理图片数据 - 支持字符串、数组和JSON字符串格式
            let images = [];
            if (post.images) {
              console.log(`收藏项${index+1}的images数据类型:`, typeof post.images);
              console.log(`收藏项${index+1}的images数据内容:`, post.images);
              
              try {
                if (typeof post.images === 'string') {
                  // 尝试作为JSON解析
                  if (post.images.startsWith('[') && post.images.endsWith(']')) {
                    const parsedImages = JSON.parse(post.images);
                    console.log('成功解析JSON格式图片');
                    if (Array.isArray(parsedImages)) {
                      images = parsedImages;
                    } else {
                      images = [post.images]; // 如果解析结果不是数组，则作为单个图片
                    }
                  } else if (post.images.includes(',')) {
                    // 可能是逗号分隔的URL
                    images = post.images.split(',').map(url => url.trim());
                    console.log('分割逗号分隔图片');
                  } else if (post.images.startsWith('http')) {
                    // 单个URL
                    images = [post.images];
                    console.log('单个URL图片');
                  }
                } else if (Array.isArray(post.images)) {
                  // 已经是数组
                  images = post.images;
                  console.log('数组格式图片');
                }
              } catch (e) {
                console.error(`解析图片数据失败: ${index+1}`, e.message, post.images);
                // 如果解析失败，尝试作为单个URL使用
                if (typeof post.images === 'string' && post.images.length > 0) {
                  images = [post.images];
                }
              }
            }
            
            console.log(`处理后的图片:`, images.length ? images.slice(0, 2) : 'no images');
            
            return {
              id: item.id || '',
              postId: post.id || item.postId || '',
              title: post.title || '',
              content: post.content || '',
              excerpt: post.excerpt || post.summary || '',
              author: author.nickname || author.username || '未知用户',
              avatar: author.avatar || '/static/images/default-avatar.png',
              time: formatTime(post.createdAt || post.created_at || item.createdAt || item.created_at || new Date()),
              favoriteTime: formatTime(item.collectedAt || item.createdAt || item.created_at || new Date()),
              category: post.category || 'post',
              images: images
            };
          });
          
          console.log('处理后的收藏列表数量:', formattedCollections.length);
          if (formattedCollections.length > 0) {
            console.log('第一条格式化后数据:', formattedCollections[0]);
          }
          
          if (this.page === 1) {
            this.favoritesList = formattedCollections;
          } else {
            this.favoritesList = [...this.favoritesList, ...formattedCollections];
          }
          
          // 更新分页信息
          this.totalItems = pagination.total || collections.length;
          this.noMore = pagination.page >= pagination.pages || collections.length < this.limit;
          
          console.log('最终收藏列表数量:', this.favoritesList.length);
          console.log('是否显示"没有更多":', this.noMore);
          
        } else {
          console.error('获取收藏失败:', result?.message || '未知错误');
          uni.showToast({
            title: result?.message || '获取收藏失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('加载收藏列表失败:', error);
        uni.showToast({
          title: '加载失败，请稍后再试',
          icon: 'none'
        });
      } finally {
        this.loading = false;
        if (typeof callback === 'function') callback();
      }
    },
    
    // 添加到收藏夹
    addToCollection(item) {
      this.selectedItem = item;
      this.showCollectionPopup = true;
    },
    
    // 选择收藏夹
    selectCollection(id) {
      this.selectedCollectionId = id;
    },
    
    // 确认添加到收藏夹
    async confirmAddToCollection() {
      if (!this.selectedCollectionId) {
        uni.showToast({
          title: '请选择收藏夹',
          icon: 'none'
        });
        return;
      }
      
      if (!this.selectedItem || !this.selectedItem.postId) {
        uni.showToast({
          title: '无效的收藏项',
          icon: 'none'
        });
        this.closeCollectionPopup();
        return;
      }
      
      try {
        uni.showLoading({
          title: '处理中...',
          mask: true
        });
        
        const collection = this.collections.find(c => c.id === this.selectedCollectionId);
        
        // 获取当前登录用户信息
        const user = store.getters.getUser();
        if (!user || !user.id) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          });
          uni.hideLoading();
          return;
        }
        
        console.log('添加到收藏夹请求参数:', {
          userId: user.id,
          postId: this.selectedItem.postId,
          collectionId: this.selectedCollectionId
        });
        
        // 使用正确的API调用添加到收藏夹
        const result = await api.users.addToCollection(user.id, {
          postId: this.selectedItem.postId,
          collectionId: this.selectedCollectionId
        });
        
        console.log('添加到收藏夹API响应:', result);
        
        if (result && (result.success || result.code === 0 || result.code === 200)) {
          uni.showToast({
            title: `已添加到"${collection.name}"`,
            icon: 'success'
          });
          
          // 更新收藏夹计数
          if (collection) {
            collection.count++;
          }
          
          this.closeCollectionPopup();
        } else {
          uni.showToast({
            title: result?.message || '操作失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('添加到收藏夹失败:', error);
        uni.showToast({
          title: '操作失败，请稍后再试',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 加载收藏夹列表
    async loadCollections() {
      try {
        const user = store.getters.getUser();
        if (!user || !user.id) {
          console.error('用户未登录，无法获取收藏夹');
          return;
        }
        
        console.log('开始加载收藏夹列表，用户ID:', user.id);
        
        // 调用API获取收藏夹列表
        const result = await api.users.getCollections(user.id, {
          page: 1,
          limit: 100,
          folderOnly: true
        });
        
        console.log('收藏夹列表API响应:', result);
        
        if (result && (result.success || result.code === 0 || result.code === 200)) {
          // 处理收藏夹数据
          let collections = [];
          
          // 检查不同的数据结构
          if (result.data) {
            if (result.data.collections) {
              collections = result.data.collections;
            } else if (Array.isArray(result.data)) {
              collections = result.data;
            } else if (result.data.items) {
              collections = result.data.items;
            } else if (result.data.list) {
              collections = result.data.list;
            } else if (result.data.folders) {
              collections = result.data.folders;
            } else {
              // 尝试直接使用data如果它看起来像收藏夹对象
              if (result.data.id && result.data.name) {
                collections = [result.data];
              }
            }
          } else if (Array.isArray(result)) {
            collections = result;
          }
          
          console.log('提取的收藏夹原始数据:', collections);
          
          if (Array.isArray(collections) && collections.length > 0) {
            this.collections = collections.map(item => ({
              id: item.id,
              name: item.name || '默认收藏夹',
              count: item.postCount || item.count || 0
            }));
            
            console.log("处理后的收藏夹列表:", this.collections);
          } else {
            console.log('未找到收藏夹或收藏夹为空');
            // 创建默认收藏夹
            this.collections = [
              { id: 'default', name: '默认收藏夹', count: 0 }
            ];
          }
        } else {
          console.error('获取收藏夹列表失败:', result?.message);
          // 创建默认收藏夹
          this.collections = [
            { id: 'default', name: '默认收藏夹', count: 0 }
          ];
        }
      } catch (error) {
        console.error('加载收藏夹列表失败:', error);
        // 发生错误时使用默认收藏夹
        this.collections = [
          { id: 'default', name: '默认收藏夹', count: 0 }
        ];
      }
    },
    
    // 创建新收藏夹
    async createCollection() {
      if (!this.newCollectionName.trim()) {
        uni.showToast({
          title: '请输入收藏夹名称',
          icon: 'none'
        });
        return;
      }
      
      try {
        uni.showLoading({
          title: '创建中...',
          mask: true
        });
        
        // 获取用户信息
        const user = store.getters.getUser();
        if (!user || !user.id) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          });
          uni.hideLoading();
          return;
        }
        
        console.log('创建收藏夹请求参数:', {
          userId: user.id,
          name: this.newCollectionName.trim(),
          type: 'folder'
        });
        
        // 调用API创建收藏夹
        const result = await api.users.createCollection(user.id, {
          name: this.newCollectionName.trim(),
          type: 'folder'
        });
        
        console.log('创建收藏夹API响应:', result);
        
        if (result && (result.success || result.code === 0 || result.code === 200)) {
          let newCollection = null;
          
          // 处理可能的不同数据结构
          if (result.data) {
            if (result.data.collection) {
              newCollection = result.data.collection;
            } else if (result.data.id) {
              newCollection = result.data;
            }
          } else if (result.collection) {
            newCollection = result.collection;
          } else if (result.id) {
            newCollection = result;
          }
          
          console.log('解析后的新收藏夹数据:', newCollection);
          
          if (newCollection && newCollection.id) {
            this.collections.push({
              id: newCollection.id,
              name: newCollection.name,
              count: 0
            });
            
            this.newCollectionName = '';
            this.selectedCollectionId = newCollection.id;
            
            uni.showToast({
              title: '创建成功',
              icon: 'success'
            });
          } else {
            console.error('创建收藏夹返回数据格式错误:', result);
            
            // 创建临时收藏夹用于UI显示
            const tempId = 'temp_' + Date.now();
            this.collections.push({
              id: tempId,
              name: this.newCollectionName.trim(),
              count: 0
            });
            
            this.newCollectionName = '';
            this.selectedCollectionId = tempId;
            
            uni.showToast({
              title: '创建成功',
              icon: 'success'
            });
          }
        } else {
          uni.showToast({
            title: result?.message || '创建失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('创建收藏夹失败:', error);
        uni.showToast({
          title: '创建失败，请稍后再试',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 关闭收藏夹弹窗
    closeCollectionPopup() {
      this.showCollectionPopup = false;
      this.selectedCollectionId = null;
      this.newCollectionName = '';
      this.selectedItem = null;
    },
    
    // 前往发现页
    goExplore() {
      uni.switchTab({
        url: '/pages/index/index'
      });
    },
    
    // 显示搜索
    showSearch() {
      this.loadSearchHistory();
      this.showSearchPopup = true;
    },
    
    // 隐藏搜索
    hideSearch() {
      this.showSearchPopup = false;
      this.searchText = '';
    },
    
    // 清空搜索内容
    clearSearch() {
      this.searchText = '';
    },
    
    // 加载搜索历史
    loadSearchHistory() {
      try {
        const history = uni.getStorageSync('favorites_search_history');
        if (history) {
          this.searchHistory = JSON.parse(history);
        }
      } catch (e) {
        console.error('加载搜索历史失败:', e);
      }
    },
    
    // 保存搜索历史
    saveSearchHistory() {
      try {
        uni.setStorageSync('favorites_search_history', JSON.stringify(this.searchHistory));
      } catch (e) {
        console.error('保存搜索历史失败:', e);
      }
    },
    
    // 执行搜索
    doSearch() {
      if (!this.searchText.trim()) return;
      
      // 添加到搜索历史
      if (!this.searchHistory.includes(this.searchText)) {
        this.searchHistory.unshift(this.searchText);
        if (this.searchHistory.length > 10) {
          this.searchHistory.pop();
        }
        this.saveSearchHistory();
      }
      
      // 重置页码并执行搜索
      this.page = 1;
      this.favoritesList = [];
      this.noMore = false;
      this.loadFavorites();
      
      this.hideSearch();
    },
    
    // 使用历史搜索标签
    useHistoryTag(tag) {
      this.searchText = tag;
      this.doSearch();
    },
    
    // 清空搜索历史
    clearHistory() {
      uni.showModal({
        title: '清空历史',
        content: '确定要清空所有搜索历史吗？',
        success: (res) => {
          if (res.confirm) {
            this.searchHistory = [];
            this.saveSearchHistory();
          }
        }
      });
    }
  }
}
</script>

<style>
.favorites-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #F8F8F8;
}

/* 自定义导航栏 */
.custom-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
  padding: 0 15px;
  background-color: #FFFFFF;
  border-bottom: 1px solid #F0F2F5;
  position: relative;
  padding-top: var(--status-bar-height);
}

.nav-left, .nav-right {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon-img, .search-icon-img {
  width: 24px;
  height: 24px;
}

.nav-title {
  font-size: 17px;
  font-weight: 500;
  flex: 1;
  text-align: center;
}

/* 时间筛选 */
.time-filter {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background-color: #FFFFFF;
  margin-bottom: 10px;
  border-bottom: 1px solid #F0F2F5;
  margin-top: 0; /* 确保没有上边距 */
}

.filter-label {
  font-size: 14px;
  color: #666;
  margin-right: 8px;
}

.filter-value {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #333;
}

.icon-arrow-down {
  font-size: 12px;
  margin-left: 5px;
  color: #999;
}

/* 收藏列表 */
.favorites-list {
  flex: 1;
  padding-bottom: 20px;
}

.favorite-item {
  display: flex;
  background-color: #FFFFFF;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.favorite-content {
  flex: 1;
  margin-right: 10px;
}

.favorite-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-excerpt {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-container {
  display: flex;
  margin-bottom: 10px;
  position: relative;
  flex-wrap: wrap;
}

.favorite-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  margin-right: 5px;
  margin-bottom: 5px;
}

.image-count {
  position: absolute;
  right: 5px;
  bottom: 5px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.favorite-meta {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.meta-author {
  display: flex;
  align-items: center;
  margin-right: 5px;
}

.author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 5px;
}

.meta-separator {
  margin: 0 5px;
}

.meta-category {
  color: #4A90E2;
}

.favorite-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
}

.action-menu {
  padding: 5px;
}

.action-icon {
  width: 20px;
  height: 20px;
}

.action-time {
  font-size: 12px;
  color: #999;
}

/* 空列表提示 */
.empty-list {
  padding: 100px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
  font-size: 14px;
}

.empty-icon {
  width: 100px;
  height: 100px;
  opacity: 0.5;
  margin-bottom: 15px;
}

.empty-action {
  margin-top: 15px;
  color: #4A90E2;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.empty-action .icon-arrow-right {
  font-size: 12px;
  margin-left: 5px;
}

/* 加载更多提示 */
.loading-more, .no-more {
  text-align: center;
  padding: 15px 0;
  color: #999999;
  font-size: 12px;
}

/* 搜索弹出层 */
.search-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #FFFFFF;
  z-index: 100;
  padding-top: var(--status-bar-height);
  display: flex;
  flex-direction: column;
}

.search-header {
  padding: 10px 15px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #F0F2F5;
}

.search-input-wrap {
  flex: 1;
  height: 36px;
  background-color: #F5F5F5;
  border-radius: 18px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  position: relative;
}

.search-input-wrap .icon-search {
  font-size: 16px;
  color: #999;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  height: 36px;
  font-size: 14px;
}

.search-input-wrap .icon-close {
  font-size: 16px;
  color: #999;
  padding: 5px;
}

.search-cancel {
  padding: 0 15px;
  font-size: 16px;
  color: #4A90E2;
}

.search-history {
  padding: 15px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
}

.history-header .icon-delete {
  font-size: 16px;
  color: #999;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
}

.history-tag {
  font-size: 13px;
  color: #666;
  background-color: #F5F5F5;
  padding: 6px 12px;
  border-radius: 15px;
  margin-right: 10px;
  margin-bottom: 10px;
}

/* 图标 */
.iconfont {
  font-family: "iconfont" !important;
}

.icon-back:before {
  content: "\e679";
}

.icon-search:before {
  content: "\e623";
}

.icon-close:before {
  content: "\e68e";
}

.icon-arrow-down:before {
  content: "\e665";
}

.icon-arrow-right:before {
  content: "\e665";
}

.icon-more-v:before {
  content: "\e683";
}

.icon-delete:before {
  content: "\e68e";
}

.icon-collection:before {
  content: "\e64f";
}

.icon-selected:before {
  content: "\e67c";
}

.icon-add:before {
  content: "\e613";
}

/* 收藏夹弹出层 */
.collection-popup {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #FFFFFF;
  border-radius: 12px 12px 0 0;
  z-index: 100;
  padding: 20px;
  display: flex;
  flex-direction: column;
  max-height: 70vh;
}

.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.collection-title {
  font-size: 16px;
  font-weight: 500;
}

.collection-close {
  padding: 5px;
  font-size: 18px;
  color: #999;
}

.collection-list {
  max-height: 300px;
}

.collection-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F0F2F5;
}

.collection-item.active {
  background-color: #F7F9FC;
}

.collection-item-left {
  display: flex;
  align-items: center;
}

.collection-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background-color: #E6F0FF;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
}

.collection-icon .iconfont {
  font-size: 20px;
  color: #4A90E2;
}

.collection-info {
  display: flex;
  flex-direction: column;
}

.collection-name {
  font-size: 15px;
  color: #333;
  margin-bottom: 4px;
}

.collection-count {
  font-size: 12px;
  color: #999;
}

.collection-select .iconfont {
  font-size: 18px;
  color: #4A90E2;
}

.create-collection {
  display: flex;
  align-items: center;
  margin-top: 15px;
  margin-bottom: 20px;
  padding-top: 15px;
  border-top: 1px solid #F0F2F5;
}

.create-collection-input {
  flex: 1;
  height: 40px;
  background-color: #F5F5F5;
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  margin-right: 10px;
}

.create-collection-input .iconfont {
  font-size: 16px;
  color: #4A90E2;
  margin-right: 8px;
}

.input-field {
  flex: 1;
  height: 40px;
  font-size: 14px;
}

.create-btn {
  height: 40px;
  padding: 0 15px;
  background-color: #4A90E2;
  color: white;
  font-size: 14px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collection-actions {
  display: flex;
  justify-content: space-between;
}

.action-btn {
  flex: 1;
  height: 44px;
  border-radius: 22px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.cancel {
  background-color: #F5F5F5;
  color: #666;
  margin-right: 15px;
}

.action-btn.confirm {
  background-color: #4A90E2;
  color: white;
}

.search-icon-mini {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.collection-icon-img {
  width: 20px;
  height: 20px;
}
</style> 