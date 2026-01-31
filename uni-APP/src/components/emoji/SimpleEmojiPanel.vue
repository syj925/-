<template>
  <view class="simple-emoji-panel">
    <!-- Tab切换 -->
    <view class="emoji-tabs">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'unicode' }"
        @tap="activeTab = 'unicode'"
      >
        <text>😊 表情</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'image' }"
        @tap="activeTab = 'image'"
      >
        <text>🖼️ 图片表情</text>
      </view>
    </view>
    
    <!-- Unicode表情面板 -->
    <scroll-view 
      v-if="activeTab === 'unicode'"
      class="emoji-scroll" 
      scroll-y 
      :show-scrollbar="false"
    >
      <view class="emoji-grid">
        <view 
          class="emoji-item"
          v-for="(item, index) in emojiList"
          :key="index"
          @tap="selectUnicodeEmoji(item)"
        >
          <text class="emoji-char">{{ item.emoji }}</text>
          <text class="emoji-name">{{ item.name }}</text>
        </view>
      </view>
    </scroll-view>
    
    <!-- 图片表情面板 -->
    <scroll-view 
      v-if="activeTab === 'image'"
      class="emoji-scroll" 
      scroll-y 
      :show-scrollbar="false"
    >
      <view class="image-emoji-section">
        <!-- 上传入口 -->
        <view class="upload-entry" @tap="uploadImageEmoji">
          <text class="upload-icon">➕</text>
          <text class="upload-text">上传表情</text>
        </view>
        
        <!-- 图片表情列表（从后端加载） -->
        <view class="image-emoji-grid" v-if="imageEmojis.length > 0">
          <view 
            class="image-emoji-item"
            v-for="(item, index) in imageEmojis"
            :key="item.id || index"
            @tap="selectImageEmoji(item)"
          >
            <image 
              class="image-emoji-img" 
              :src="item.url" 
              mode="aspectFit"
            ></image>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view class="empty-state" v-else>
          <text class="empty-text">暂无图片表情</text>
          <text class="empty-hint">点击上方"上传表情"添加</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { getEmojiList } from '@/config/emoji-map';

export default {
  name: 'SimpleEmojiPanel',
  emits: ['select', 'select-image'],
  data() {
    return {
      activeTab: 'unicode',
      emojiList: [],
      imageEmojis: []
    };
  },
  mounted() {
    this.loadEmojis();
    this.loadImageEmojis();
  },
  methods: {
    loadEmojis() {
      this.emojiList = getEmojiList();
    },
    
    async loadImageEmojis() {
      try {
        // 从后端加载用户的图片表情
        const res = await this.$api.emoji.getCustomEmojis();
        if (res.code === 0 && res.data) {
          this.imageEmojis = res.data.list || res.data || [];
        }
      } catch (e) {
      }
    },
    
    // Unicode表情：插入[code]到内容
    selectUnicodeEmoji(item) {
      this.$emit('select', {
        type: 'unicode',
        code: item.code,
        emoji: item.emoji,
        name: item.name
      });
    },
    
    // 图片表情：作为图片发送
    selectImageEmoji(item) {
      this.$emit('select-image', {
        type: 'image',
        id: item.id,
        url: item.url,
        name: item.name
      });
    },
    
    // 上传图片表情
    async uploadImageEmoji() {
      try {
        const res = await uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        });

        const tempFilePath = res.tempFilePaths[0];
        
        const fileInfo = await uni.getFileInfo({ filePath: tempFilePath });
        if (fileInfo.size > 2 * 1024 * 1024) {
          uni.showToast({ title: '图片不能超过2MB', icon: 'none' });
          return;
        }

        // 让用户输入表情名称
        const inputRes = await new Promise((resolve) => {
          uni.showModal({
            title: '给表情起个名字',
            editable: true,
            placeholderText: '如：开心、加油',
            success: (res) => resolve(res),
            fail: () => resolve({ confirm: false })
          });
        });

        if (!inputRes.confirm || !inputRes.content?.trim()) {
          return;
        }

        const emojiName = inputRes.content.trim();

        uni.showLoading({ title: '上传中...' });

        // 上传图片
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

        // 调用自定义表情API
        const emojiData = {
          name: emojiName,
          url: uploadData.data.url,
          type: uploadData.data.url.match(/\.(gif|webp)$/i) ? 'animated' : 'static',
          file_size: fileInfo.size
        };

        await this.$api.emoji.uploadCustom(emojiData);

        uni.hideLoading();
        uni.showToast({ title: '上传成功，待审核', icon: 'success' });
        
        // 刷新列表
        this.loadImageEmojis();
      } catch (error) {
        uni.hideLoading();
        console.error('上传表情失败:', error);
        uni.showToast({ title: error.message || '上传失败', icon: 'none' });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.simple-emoji-panel {
  background: #fff;
  border-radius: 16rpx 16rpx 0 0;
  
  .emoji-tabs {
    display: flex;
    border-bottom: 1rpx solid #eee;
    
    .tab-item {
      flex: 1;
      padding: 20rpx;
      text-align: center;
      font-size: 26rpx;
      color: #666;
      position: relative;
      
      &.active {
        color: #4a90e2;
        font-weight: 600;
        
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60rpx;
          height: 4rpx;
          background: #4a90e2;
          border-radius: 2rpx;
        }
      }
    }
  }
  
  .emoji-scroll {
    height: 450rpx;
    padding: 20rpx;
  }
  
  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 16rpx;
  }
  
  .emoji-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12rpx 4rpx;
    border-radius: 12rpx;
    background: #f8f9fa;
    transition: all 0.2s;
    
    &:active {
      background: #e9ecef;
      transform: scale(0.95);
    }
    
    .emoji-char {
      font-size: 44rpx;
      line-height: 1;
      margin-bottom: 6rpx;
    }
    
    .emoji-name {
      font-size: 18rpx;
      color: #999;
      text-align: center;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  
  // 图片表情部分
  .image-emoji-section {
    .upload-entry {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24rpx;
      margin-bottom: 20rpx;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2rpx dashed #7dd3fc;
      border-radius: 12rpx;
      
      .upload-icon {
        font-size: 32rpx;
        margin-right: 12rpx;
      }
      
      .upload-text {
        font-size: 26rpx;
        color: #0284c7;
      }
    }
    
    .image-emoji-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16rpx;
    }
    
    .image-emoji-item {
      aspect-ratio: 1;
      background: #f8f9fa;
      border-radius: 12rpx;
      overflow: hidden;
      
      &:active {
        transform: scale(0.95);
      }
      
      .image-emoji-img {
        width: 100%;
        height: 100%;
      }
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60rpx 0;
      
      .empty-text {
        font-size: 28rpx;
        color: #999;
        margin-bottom: 12rpx;
      }
      
      .empty-hint {
        font-size: 24rpx;
        color: #ccc;
      }
    }
  }
}
</style>
