<template>
  <view class="emoji-panel">
    <!-- 搜索栏 -->
    <view class="search-bar" v-if="showSearch">
      <input 
        class="search-input"
        type="text"
        v-model="searchKeyword"
        placeholder="搜索表情"
        @input="handleSearch"
        @confirm="handleSearch"
      />
      <view class="search-clear" v-if="searchKeyword" @tap="clearSearch">
        <text class="clear-icon">×</text>
      </view>
    </view>

    <!-- 表情内容区域 -->
    <scroll-view 
      class="emoji-content" 
      scroll-y 
      :scroll-top="scrollTop"
      @scroll="handleScroll"
    >
      <!-- 搜索结果 -->
      <view v-if="searchKeyword && emojiStore.searchResults.length > 0" class="emoji-section">
        <view class="section-title">搜索结果</view>
        <view class="emoji-grid">
          <view 
            class="emoji-item"
            v-for="emoji in emojiStore.searchResults"
            :key="emoji.id"
            @tap="selectEmoji(emoji)"
            @longpress="showEmojiMenu(emoji)"
          >
            <image 
              class="emoji-image" 
              :src="getEmojiUrl(emoji)" 
              mode="aspectFit"
              :lazy-load="true"
            />
          </view>
        </view>
      </view>

      <!-- 无搜索结果 -->
      <view v-else-if="searchKeyword && emojiStore.searchResults.length === 0" class="empty-result">
        <text class="empty-text">未找到相关表情</text>
      </view>

      <!-- 正常表情列表 -->
      <view v-else class="emoji-section">
        <!-- 最近使用 -->
        <view v-if="currentTabIndex === 0 && emojiStore.recentEmojis.length > 0">
          <view class="emoji-grid">
            <view 
              class="emoji-item"
              v-for="emoji in emojiStore.recentEmojis"
              :key="emoji.id"
              @tap="selectEmoji(emoji)"
              @longpress="showEmojiMenu(emoji)"
            >
              <image 
                class="emoji-image" 
                :src="getEmojiUrl(emoji)" 
                mode="aspectFit"
                :lazy-load="true"
              />
            </view>
          </view>
        </view>

        <!-- 空状态 - 最近使用 -->
        <view v-else-if="currentTabIndex === 0 && emojiStore.recentEmojis.length === 0" class="empty-result">
          <text class="empty-text">暂无最近使用的表情</text>
        </view>

        <!-- 收藏 -->
        <view v-else-if="currentTabIndex === 1">
          <view class="emoji-grid">
            <!-- 上传按钮 - 永远第一个 -->
            <view 
              class="emoji-item upload-item"
              @tap="handleUploadEmoji"
            >
              <view class="upload-btn">
                <text class="upload-icon">➕</text>
              </view>
            </view>

            <!-- 收藏的表情列表 -->
            <view 
              class="emoji-item"
              v-for="emoji in emojiStore.favoriteEmojis"
              :key="emoji.id"
              @tap="selectEmoji(emoji)"
              @longpress="showEmojiMenu(emoji)"
            >
              <image 
                class="emoji-image" 
                :src="getEmojiUrl(emoji)" 
                mode="aspectFit"
                :lazy-load="true"
              />
              <view class="favorite-badge">
                <text class="favorite-icon">⭐</text>
              </view>
            </view>
          </view>

          <!-- 提示文本 -->
          <view v-if="emojiStore.favoriteEmojis.length === 0" class="empty-hint" style="margin-top: 20rpx; text-align: center;">
            <text>长按表情可添加收藏</text>
          </view>
        </view>

        <!-- 表情包列表 -->
        <view v-else-if="currentPack && currentPack.emojis">
          <view class="emoji-grid">
            <view 
              class="emoji-item"
              v-for="emoji in currentPack.emojis"
              :key="emoji.id"
              @tap="selectEmoji(emoji)"
              @longpress="showEmojiMenu(emoji)"
            >
              <image 
                class="emoji-image" 
                :src="getEmojiUrl(emoji)" 
                mode="aspectFit"
                :lazy-load="true"
              />
            </view>
          </view>
        </view>

        <!-- 空状态 - 表情包 -->
        <view v-else class="empty-result">
          <text class="empty-text">该表情包暂无表情</text>
        </view>
      </view>
    </scroll-view>

    <!-- 表情包Tab栏 -->
    <scroll-view class="pack-tabs" scroll-x :show-scrollbar="false">
      <view class="pack-tab-list">
        <!-- 最近使用 -->
        <view 
          class="pack-tab"
          :class="{ active: currentTabIndex === 0 }"
          @tap="switchTab(0)"
        >
          <text class="tab-icon">🕐</text>
        </view>

        <!-- 收藏 -->
        <view 
          class="pack-tab"
          :class="{ active: currentTabIndex === 1 }"
          @tap="switchTab(1)"
        >
          <text class="tab-icon">⭐</text>
        </view>

        <!-- 分隔线 -->
        <view class="tab-divider"></view>

        <!-- 表情包列表 -->
        <view 
          class="pack-tab"
          v-for="(pack, index) in emojiStore.packs"
          :key="pack.id"
          :class="{ active: currentTabIndex === index + 2 }"
          @tap="switchTab(index + 2)"
        >
          <image 
            v-if="pack.coverUrl" 
            class="tab-cover" 
            :src="getPackCoverUrl(pack)"
            mode="aspectFit"
          />
          <text v-else class="tab-icon">📦</text>
        </view>
      </view>
    </scroll-view>

    <!-- 表情操作菜单 -->
    <view class="emoji-menu" v-if="showMenu" @tap="hideEmojiMenu">
      <view class="menu-content" @tap.stop>
        <view class="menu-emoji">
          <image class="menu-emoji-image" :src="getEmojiUrl(menuEmoji)" mode="aspectFit" />
          <text class="menu-emoji-name">{{ menuEmoji?.name || menuEmoji?.code }}</text>
        </view>
        <view class="menu-actions">
          <view 
            class="menu-action" 
            @tap="toggleFavorite"
          >
            <text class="action-icon">{{ isFavorite ? '💔' : '❤️' }}</text>
            <text class="action-text">{{ isFavorite ? '取消收藏' : '收藏' }}</text>
          </view>
          <view class="menu-action" @tap="insertEmoji">
            <text class="action-icon">✏️</text>
            <text class="action-text">使用</text>
          </view>
          <view class="menu-action" @tap="selectAsImage">
            <text class="action-icon">🖼️</text>
            <text class="action-text">图片表情</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { useEmojiStore } from '@/stores/emoji';

export default {
  name: 'EmojiPanel',
  props: {
    showSearch: {
      type: Boolean,
      default: true
    },
    height: {
      type: String,
      default: '280px'
    }
  },
  emits: ['select', 'close', 'select-as-image'],
  data() {
    return {
      currentTabIndex: 0,
      scrollTop: 0,
      searchKeyword: '',
      searchTimer: null,
      showMenu: false,
      menuEmoji: null
    };
  },
  setup() {
    const emojiStore = useEmojiStore();
    return { emojiStore };
  },
  computed: {
    currentPack() {
      if (this.currentTabIndex < 2) return null;
      return this.emojiStore.packs[this.currentTabIndex - 2];
    },
    isFavorite() {
      return this.menuEmoji ? this.emojiStore.isFavorite(this.menuEmoji.id) : false;
    }
  },
  mounted() {
    this.initEmojis();
  },
  methods: {
    async initEmojis() {
      if (!this.emojiStore.initialized) {
        await this.emojiStore.initialize();
      }
      
      console.log('表情系统初始化完成:', {
        initialized: this.emojiStore.initialized,
        packsCount: this.emojiStore.packs.length,
        recentCount: this.emojiStore.recentEmojis.length,
        packs: this.emojiStore.packs
      });
      
      // 默认显示最近使用或第一个表情包
      if (this.emojiStore.recentEmojis.length === 0 && this.emojiStore.packs.length > 0) {
        this.currentTabIndex = 2;
        console.log('切换到第一个表情包, index:', this.currentTabIndex);
      }
    },

    switchTab(index) {
      this.currentTabIndex = index;
      this.scrollTop = 0;
    },

    async handleUploadEmoji() {
      try {
        // 1. 选择图片
        const res = await uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        });

        const tempFilePath = res.tempFilePaths[0];
        
        // 检查文件大小
        const fileInfo = await uni.getFileInfo({ filePath: tempFilePath });
        if (fileInfo.size > 2 * 1024 * 1024) {
          uni.showToast({ title: '图片大小不能超过2MB', icon: 'none' });
          return;
        }

        uni.showLoading({ title: '上传中...' });

        // 2. 上传图片到服务器
        const uploadRes = await uni.uploadFile({
          url: this.$api.http.config.baseURL + '/api/upload',
          filePath: tempFilePath,
          name: 'file',
          header: {
            'Authorization': 'Bearer ' + uni.getStorageSync('token')
          }
        });

        const uploadData = JSON.parse(uploadRes.data);
        if (uploadData.code !== 0) {
          throw new Error(uploadData.msg || '上传失败');
        }

        uni.hideLoading();

        // 3. 让用户输入表情名称
        const inputRes = await new Promise((resolve) => {
          uni.showModal({
            title: '给表情起个名字',
            editable: true,
            placeholderText: '如：开心、加油、比心',
            success: (res) => resolve(res),
            fail: () => resolve({ confirm: false })
          });
        });

        if (!inputRes.confirm || !inputRes.content?.trim()) {
          uni.showToast({ title: '已取消', icon: 'none' });
          return;
        }

        const emojiName = inputRes.content.trim().replace(/[\[\]]/g, ''); // 移除方括号
        if (emojiName.length > 10) {
          uni.showToast({ title: '名称最多10个字符', icon: 'none' });
          return;
        }

        uni.showLoading({ title: '提交中...' });

        // 4. 调用自定义表情API
        const emojiData = {
          name: emojiName,
          url: uploadData.data.url,
          type: uploadData.data.url.match(/\.(gif|webp)$/i) ? 'animated' : 'static',
          file_size: fileInfo.size
        };

        const uploadResult = await this.$api.emoji.uploadCustom(emojiData);

        uni.hideLoading();
        
        // 显示详细的上传成功提示
        uni.showModal({
          title: '上传成功',
          content: `表情"${emojiName}"已提交审核，审核通过后将自动添加到您的收藏中。\n今日已上传 ${uploadResult.data?.todayCount || 1}/${uploadResult.data?.dailyLimit || 10} 张`,
          showCancel: false,
          confirmText: '知道了'
        });
      } catch (error) {
        uni.hideLoading();
        console.error('上传表情失败:', error);
        uni.showToast({ 
          title: error.errMsg || error.message || '上传失败', 
          icon: 'none' 
        });
      }
    },

    selectEmoji(emoji) {
      // 记录使用
      this.emojiStore.recordUsage(emoji);
      // 发送事件
      this.$emit('select', emoji);
    },

    getEmojiUrl(emoji) {
      if (!emoji) return '';
      let url = emoji.thumbnailUrl || emoji.url;
      if (url && !url.startsWith('http')) {
        const baseUrl = this.$api?.http?.baseURL || '';
        url = baseUrl + (url.startsWith('/') ? '' : '/') + url;
      }
      return url;
    },

    getPackCoverUrl(pack) {
      if (!pack || !pack.coverUrl) return '';
      let url = pack.coverUrl;
      if (url && !url.startsWith('http')) {
        const baseUrl = this.$api?.http?.baseURL || '';
        url = baseUrl + (url.startsWith('/') ? '' : '/') + url;
      }
      return url;
    },

    handleSearch() {
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.emojiStore.searchEmojis(this.searchKeyword);
      }, 300);
    },

    clearSearch() {
      this.searchKeyword = '';
      this.emojiStore.clearSearch();
    },

    handleScroll(e) {
      // 可以在这里处理滚动事件
    },

    showEmojiMenu(emoji) {
      this.menuEmoji = emoji;
      this.showMenu = true;
      // 震动反馈
      uni.vibrateShort({ type: 'light' });
    },

    hideEmojiMenu() {
      this.showMenu = false;
      this.menuEmoji = null;
    },

    async toggleFavorite() {
      if (!this.menuEmoji) return;
      
      try {
        if (this.isFavorite) {
          await this.emojiStore.removeFavorite(this.menuEmoji.id);
          uni.showToast({ title: '已取消收藏', icon: 'none' });
        } else {
          await this.emojiStore.addFavorite(this.menuEmoji);
          uni.showToast({ title: '已收藏', icon: 'success' });
        }
      } catch (error) {
        uni.showToast({ title: '操作失败', icon: 'none' });
      }
      
      this.hideEmojiMenu();
    },

    insertEmoji() {
      if (this.menuEmoji) {
        this.selectEmoji(this.menuEmoji);
      }
      this.hideEmojiMenu();
    },

    // 选为图片表情（单独一张图片占位）
    selectAsImage() {
      if (this.menuEmoji) {
        this.$emit('select-as-image', this.menuEmoji);
      }
      this.hideEmojiMenu();
    }
  }
};
</script>

<style lang="scss" scoped>
.emoji-panel {
  display: flex;
  flex-direction: column;
  height: v-bind(height);
  background: #fff;
  border-radius: 16rpx 16rpx 0 0;
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;

  .search-input {
    flex: 1;
    height: 64rpx;
    padding: 0 24rpx;
    background: #f5f5f5;
    border-radius: 32rpx;
    font-size: 28rpx;
  }

  .search-clear {
    margin-left: 16rpx;
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .clear-icon {
      font-size: 32rpx;
      color: #999;
    }
  }
}

.emoji-content {
  flex: 1;
  padding: 16rpx;
}

.emoji-section {
  .section-title {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 16rpx;
  }
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
}

.emoji-item {
  width: 12.5%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &:active {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 12rpx;
  }

  .emoji-image {
    width: 56rpx;
    height: 56rpx;
  }

  .favorite-badge {
    position: absolute;
    top: 4rpx;
    right: 4rpx;
    font-size: 16rpx;
  }

  &.upload-item {
    .upload-btn {
      width: 56rpx;
      height: 56rpx;
      border: 2rpx dashed #d9d9d9;
      border-radius: 8rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fafafa;

      .upload-icon {
        font-size: 32rpx;
        color: #999;
      }
    }

    &:active .upload-btn {
      background: #f0f0f0;
      border-color: #bbb;
    }
  }
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;

  .empty-text {
    font-size: 28rpx;
    color: #999;
  }

  .empty-hint {
    font-size: 24rpx;
    color: #ccc;
    margin-top: 12rpx;
  }
}

.pack-tabs {
  border-top: 1rpx solid #f0f0f0;
  height: 88rpx;
  white-space: nowrap;

  .pack-tab-list {
    display: inline-flex;
    align-items: center;
    height: 100%;
    padding: 0 8rpx;
  }

  .pack-tab {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 4rpx;
    border-radius: 12rpx;
    transition: all 0.2s;

    &.active {
      background: #e8f4ff;
    }

    &:active {
      opacity: 0.7;
    }

    .tab-icon {
      font-size: 36rpx;
    }

    .tab-cover {
      width: 48rpx;
      height: 48rpx;
      border-radius: 8rpx;
    }
  }

  .tab-divider {
    width: 1rpx;
    height: 40rpx;
    background: #e0e0e0;
    margin: 0 12rpx;
  }
}

.emoji-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .menu-content {
    background: #fff;
    border-radius: 24rpx;
    padding: 32rpx;
    width: 500rpx;
  }

  .menu-emoji {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 24rpx;
    border-bottom: 1rpx solid #f0f0f0;

    .menu-emoji-image {
      width: 120rpx;
      height: 120rpx;
    }

    .menu-emoji-name {
      font-size: 28rpx;
      color: #666;
      margin-top: 12rpx;
    }
  }

  .menu-actions {
    display: flex;
    justify-content: space-around;
    padding-top: 24rpx;

    .menu-action {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16rpx 32rpx;

      &:active {
        opacity: 0.7;
      }

      .action-icon {
        font-size: 48rpx;
      }

      .action-text {
        font-size: 24rpx;
        color: #666;
        margin-top: 8rpx;
      }
    }
  }
}
</style>
