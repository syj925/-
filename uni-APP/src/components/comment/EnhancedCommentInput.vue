<template>
  <view class="comment-input-mask" v-if="visible" @tap="handleMaskClick" :class="{ 'visible': visible }">
    <view class="enhanced-comment-input" @tap.stop :class="{ 'slide-up': visible }">
      <!-- 顶部拖拽条 -->
      <view class="input-handle"></view>
      
      <!-- 头部标题和关闭 -->
      <view class="input-header">
        <text class="input-title">{{ replyTo ? '回复评论' : '发表评论' }}</text>
        <view class="close-btn" @tap="handleClose">
          <app-icon name="close" size="sm" color="#999"></app-icon>
        </view>
      </view>

      <!-- 回复预览 -->
      <view class="reply-preview" v-if="replyTo">
        <view class="reply-bar"></view>
        <text class="preview-text">回复 @{{ replyTo.author?.nickname || '用户' }}: {{ replyTo.content }}</text>
        <view class="cancel-reply" @tap="cancelReply">
          <app-icon name="close" size="xs" color="#999"></app-icon>
        </view>
      </view>

      <!-- 输入区域 -->
      <view class="input-area">
        <textarea
          ref="textInput"
          class="comment-textarea"
          v-model="content"
          :placeholder="placeholder"
          :maxlength="maxLength"
          :focus="inputFocus"
          :show-confirm-bar="false"
          :adjust-position="false"
          :cursor-spacing="120"
          :auto-height="true"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
        ></textarea>
        
        <!-- 字数统计 -->
        <view class="char-count" :class="{ 'warning': content.length > maxLength * 0.9 }">
          <text>{{ content.length }}/{{ maxLength }}</text>
        </view>
      </view>

      <!-- 图片预览区域 -->
      <view class="media-preview" v-if="selectedImages.length > 0 || selectedImageEmoji">
        <!-- 图片表情 -->
        <view class="emoji-image-item" v-if="selectedImageEmoji">
          <image class="preview-img" :src="processImageUrl(selectedImageEmoji.url)" mode="aspectFill"></image>
          <view class="remove-btn" @tap="removeImageEmoji">
            <app-icon name="close" size="xs" color="#fff"></app-icon>
          </view>
        </view>
        
        <!-- 普通图片 -->
        <view class="image-item" v-for="(img, idx) in selectedImages" :key="idx" v-else>
          <image class="preview-img" :src="img.path" mode="aspectFill" @tap="previewSelectedImage(idx)"></image>
          <view class="remove-btn" @tap="removeImage(idx)">
            <app-icon name="close" size="xs" color="#fff"></app-icon>
          </view>
        </view>
      </view>

      <!-- 工具栏：图片、@、表情、匿名、发送 -->
      <view class="toolbar">
        <view class="tool-btn" @tap="chooseImage">
          <image class="tool-icon-img" src="/static/images/common/image.png" mode="aspectFit"></image>
        </view>
        <view class="tool-btn" @tap="toggleMentionPanel" :class="{ active: showMentionPanel }">
          <text class="tool-icon">@</text>
        </view>
        <view class="tool-btn" @tap="toggleEmojiPanel" :class="{ active: showEmojiPanel }">
          <image class="tool-icon-img" src="/static/images/common/emoji.png" mode="aspectFit"></image>
        </view>
        <view class="anonymous-toggle" @tap="toggleAnonymous">
          <text class="toggle-text">{{ isAnonymous ? '匿名' : '公开' }}</text>
        </view>
        <view class="toolbar-spacer"></view>
        <button class="send-btn" :class="{ active: canSend }" :disabled="!canSend || sending" @tap="submitComment">
          <text>发送</text>
        </button>
      </view>

      <!-- 最近使用emoji栏（常驻显示） -->
      <scroll-view scroll-x class="recent-emoji-bar" v-if="!showEmojiPanel && !showMentionPanel">
        <view class="recent-emoji-list">
          <view 
            class="recent-emoji-item" 
            v-for="(item, idx) in recentEmojis" 
            :key="idx"
            @tap="insertRecentEmoji(item)"
          >
            <text class="emoji-char">{{ item.emoji }}</text>
          </view>
          <view class="more-emoji" @tap="toggleEmojiPanel">
            <text>...</text>
          </view>
        </view>
      </scroll-view>

      <!-- 表情面板（点击表情按钮后显示） -->
      <view class="emoji-panel-wrapper" v-if="showEmojiPanel">
        <!-- Tab栏 -->
        <scroll-view scroll-x class="emoji-tabs">
          <view class="tab-list">
            <view 
              class="tab-item" 
              :class="{ active: emojiTab === 'store' }"
              @tap="emojiTab = 'store'"
            >
              <text>🏪</text>
            </view>
            <view 
              class="tab-item" 
              :class="{ active: emojiTab === 'unicode' }"
              @tap="emojiTab = 'unicode'"
            >
              <text>😊</text>
            </view>
            <view 
              class="tab-item" 
              :class="{ active: emojiTab === 'favorite' }"
              @tap="emojiTab = 'favorite'"
            >
              <text>❤️</text>
            </view>
            <view 
              class="tab-item" 
              :class="{ active: emojiTab === 'gif' }"
              @tap="emojiTab = 'gif'"
            >
              <text>GIF</text>
            </view>
            <!-- 官方表情包 -->
            <view 
              class="tab-item pack-tab" 
              v-for="pack in emojiPacks" 
              :key="pack.id"
              :class="{ active: emojiTab === 'pack_' + pack.id }"
              @tap="emojiTab = 'pack_' + pack.id"
            >
              <image class="pack-icon" :src="pack.icon" mode="aspectFit" v-if="pack.icon"></image>
              <text v-else>{{ pack.name ? pack.name.slice(0, 2) : '包' }}</text>
            </view>
          </view>
        </scroll-view>

        <!-- 表情内容区 -->
        <scroll-view scroll-y class="emoji-content">
          <!-- 商店 -->
          <view class="emoji-store" v-if="emojiTab === 'store'">
            <text class="section-title">表情商店</text>
            <text class="coming-soon">敬请期待...</text>
          </view>

          <!-- Unicode表情 -->
          <view class="unicode-emoji-grid" v-if="emojiTab === 'unicode'">
            <view class="section-title">最常使用</view>
            <view class="emoji-grid">
              <view 
                class="emoji-item" 
                v-for="(item, idx) in recentEmojis.slice(0, 8)" 
                :key="'recent_' + idx"
                @tap="handleEmojiSelect(item)"
              >
                <text class="emoji-char">{{ item.emoji }}</text>
              </view>
            </view>
            
            <view class="section-title">全部表情</view>
            <view class="emoji-grid">
              <view 
                class="emoji-item" 
                v-for="(item, idx) in unicodeEmojis" 
                :key="idx"
                @tap="handleEmojiSelect(item)"
              >
                <text class="emoji-char">{{ item.emoji }}</text>
              </view>
            </view>
          </view>

          <!-- 收藏 -->
          <view class="favorite-emoji" v-if="emojiTab === 'favorite'">
            <!-- 我的自定义表情 -->
            <view class="section-title">我的自定义</view>
            <view class="emoji-grid">
              <!-- 上传加号图标（固定第一个） -->
              <view class="emoji-item image-emoji upload-btn" @tap="uploadCustomEmoji">
                <text class="upload-icon">+</text>
              </view>
              <!-- 用户自定义表情 -->
              <view 
                class="emoji-item image-emoji" 
                v-for="(item, idx) in customEmojis" 
                :key="'custom_' + idx"
                @tap="handleImageEmojiSelect(item)"
              >
                <image :src="processImageUrl(item.url)" mode="aspectFit" class="emoji-img"></image>
              </view>
            </view>
            
            <!-- 收藏的表情 -->
            <view class="section-title">收藏的表情</view>
            <view class="emoji-grid" v-if="favoriteEmojis.length > 0">
              <view 
                class="emoji-item image-emoji" 
                v-for="(item, idx) in favoriteEmojis" 
                :key="'fav_' + idx"
                @tap="handleImageEmojiSelect(item)"
              >
                <image :src="processImageUrl(item.url)" mode="aspectFit" class="emoji-img"></image>
              </view>
            </view>
            <view class="empty-state" v-else>
              <text>暂无收藏的表情</text>
            </view>
          </view>

          <!-- GIF -->
          <view class="gif-section" v-if="emojiTab === 'gif'">
            <text class="section-title">GIF表情</text>
            <text class="coming-soon">敬请期待...</text>
          </view>

          <!-- 官方表情包内容 -->
          <view class="pack-emoji" v-if="emojiTab.startsWith('pack_')">
            <view class="emoji-grid">
              <view 
                class="emoji-item image-emoji" 
                v-for="(item, idx) in currentPackEmojis" 
                :key="idx"
                @tap="handleImageEmojiSelect(item)"
              >
                <image :src="processImageUrl(item.url)" mode="aspectFit" class="emoji-img"></image>
              </view>
            </view>
          </view>
        </scroll-view>

      </view>

      <!-- @用户面板 -->
      <view class="mention-panel" v-if="showMentionPanel">
        <view class="mention-search">
          <input 
            class="search-input"
            v-model="mentionKeyword"
            placeholder="搜索用户..."
            :focus="true"
            @input="searchMentionUsers"
          />
        </view>
        <scroll-view scroll-y class="mention-list">
          <view 
            class="user-item"
            v-for="user in mentionResults"
            :key="user.id"
            @tap="selectMentionUser(user)"
          >
            <image class="user-avatar" :src="user.avatar || '/static/images/common/default-avatar.png'" mode="aspectFill"></image>
            <view class="user-info">
              <text class="nickname">{{ user.nickname || user.username }}</text>
              <text class="username">@{{ user.username }}</text>
            </view>
          </view>
          <view class="empty-state" v-if="mentionResults.length === 0">
            <text>{{ searchingMention ? '搜索中...' : '未找到用户' }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue';
import { getEmojiList, emojiToCode } from '@/config/emoji-map';
import { ensureAbsoluteUrl } from '@/utils/url';

export default {
  name: 'EnhancedCommentInput',
  components: {
    AppIcon
  },
  props: {
    postId: {
      type: String,
      required: true
    },
    replyTo: {
      type: Object,
      default: null
    },
    visible: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: '说点什么...'
    },
    maxLength: {
      type: Number,
      default: 500
    },
    maxImages: {
      type: Number,
      default: 3
    }
  },
  data() {
    return {
      content: '',
      inputFocus: false,
      sending: false,
      isAnonymous: false,
      // 图片
      selectedImages: [],
      // 图片表情（选择后作为图片发送）
      selectedImageEmoji: null,
      
      // 面板状态
      showEmojiPanel: false,
      showMentionPanel: false,
      emojiTab: 'unicode', // 当前表情Tab: store/unicode/favorite/gif/pack_xxx
      
      // 表情数据
      unicodeEmojis: [],
      recentEmojis: [],
      favoriteEmojis: [],
      customEmojis: [], // 用户自定义表情
      emojiPacks: [],
      
      // @搜索
      mentionKeyword: '',
      mentionResults: [],
      searchingMention: false,
      mentionTimer: null
    };
  },
  computed: {
    canSend() {
      const hasContent = this.content.trim().length > 0;
      const hasImageEmoji = !!this.selectedImageEmoji;
      const hasImages = this.selectedImages.length > 0;
      return (hasContent || hasImageEmoji || hasImages) && this.content.length <= this.maxLength;
    },
    // 当前选中表情包的表情
    currentPackEmojis() {
      if (!this.emojiTab.startsWith('pack_')) return [];
      const packId = this.emojiTab.replace('pack_', '');
      const pack = this.emojiPacks.find(p => p.id === packId);
      return pack?.emojis || [];
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.show();
      } else {
        this.reset();
      }
    },
    replyTo(newVal) {
      // 切换回复对象时
    }
  },
  mounted() {
    this.loadEmojiData();
  },
  methods: {
    // 加载表情数据
    loadEmojiData() {
      // 加载Unicode表情配置
      this.unicodeEmojis = getEmojiList();
      
      // 加载最近使用（从本地存储）
      try {
        const recent = uni.getStorageSync('recent_emojis') || [];
        this.recentEmojis = recent.slice(0, 20);
      } catch (e) {
        this.recentEmojis = this.unicodeEmojis.slice(0, 8);
      }
      
      // 如果没有最近使用，用默认的
      if (this.recentEmojis.length === 0) {
        this.recentEmojis = this.unicodeEmojis.slice(0, 8);
      }
      
      // 加载收藏的图片表情（从API）
      this.loadFavoriteEmojis();
      
        // 加载用户自定义表情（从API）
      this.loadCustomEmojis();
      
      // 加载官方表情包（从API）
      this.loadEmojiPacks();
    },
    
    async loadCustomEmojis() {
      try {
        const res = await this.$api.emoji?.getCustomEmojis?.('approved');
        if (res?.code === 0) {
          this.customEmojis = res.data?.list || res.data || [];
        }
      } catch (e) {

      }
    },
    
    async loadFavoriteEmojis() {
      try {
        const res = await this.$api.emoji?.getFavorites?.();
        if (res?.code === 0) {
          this.favoriteEmojis = res.data?.list || res.data || [];
        }
      } catch (e) {

      }
    },
    
    async loadEmojiPacks() {
      try {
        const res = await this.$api.emoji?.getPacks?.();
        if (res?.code === 0) {
          this.emojiPacks = res.data?.list || res.data || [];
        }
      } catch (e) {

      }
    },
    
    // 保存最近使用
    saveRecentEmoji(emoji) {
      const recent = this.recentEmojis.filter(e => e.emoji !== emoji.emoji);
      recent.unshift(emoji);
      this.recentEmojis = recent.slice(0, 20);
      try {
        uni.setStorageSync('recent_emojis', this.recentEmojis);
      } catch (e) {}
    },
    
    // 插入最近使用的emoji
    insertRecentEmoji(item) {
      this.content += item.emoji;
      this.saveRecentEmoji(item);
    },
    
    // 删除最后一个字符
    deleteLastChar() {
      if (this.content.length > 0) {
        // 检查是否是emoji代码格式 [xxx]
        const match = this.content.match(/\[[^\]]+\]$/);
        if (match) {
          this.content = this.content.slice(0, -match[0].length);
        } else {
          this.content = this.content.slice(0, -1);
        }
      }
    },
    
    show() {
      // 延时聚焦，确保UI渲染完成
      setTimeout(() => {
        this.inputFocus = true;
      }, 300);
    },
    
    handleClose() {
      this.$emit('close');
    },
    
    handleMaskClick(e) {
      // uni-app中事件对象结构不同，直接关闭即可（因为内部已有@tap.stop）
      this.handleClose();
    },
    
    reset() {
      this.content = '';
      this.selectedImages = [];
      this.selectedImageEmoji = null;
      this.isAnonymous = false;
      this.showEmojiPanel = false;
      this.showMentionPanel = false;
      this.inputFocus = false;
      this.mentionKeyword = '';
      this.mentionResults = [];
    },
    
    // 输入框事件
    handleInput(e) {
      this.content = e.detail.value;
    },
    
    handleFocus() {
      this.inputFocus = true;
      // 键盘弹出时，隐藏面板
      if (this.showEmojiPanel || this.showMentionPanel) {
        this.showEmojiPanel = false;
        this.showMentionPanel = false;
      }
    },
    
    handleBlur() {
      // 延时失焦，避免点击表情按钮时因失焦导致面板闪烁或无法打开
      // 但如果点击的是面板内的元素，需要保持 inputFocus 为 false (收起键盘) 但面板显示
      // 实际上，点击表情按钮会触发 toggleEmojiPanel
      
      // 注意：这里不需要立即设为 false，因为点击按钮会抢占焦点
      // 或者我们可以不处理 blur，完全由按钮事件控制
      this.inputFocus = false;
    },
    
    // 功能切换
    toggleEmojiPanel() {
      if (this.showEmojiPanel) {
        // 如果表情面板已打开，则关闭面板，切回键盘
        this.showEmojiPanel = false;
        this.inputFocus = true; 
      } else {
        // 如果表情面板未打开，则打开面板
        this.showEmojiPanel = true;
        this.showMentionPanel = false;
        
        // 关键点：收起键盘。
        // 在 uni-app 中，设置 focus 为 false 即可收起键盘。
        // 但为了防止键盘收起瞬间页面跳动，可以延时一点
        this.inputFocus = false;
        uni.hideKeyboard(); // 强制收起键盘
      }
    },
    
    toggleMentionPanel() {
      if (this.showMentionPanel) {
        this.showMentionPanel = false;
        this.inputFocus = true;
      } else {
        this.showMentionPanel = true;
        this.showEmojiPanel = false;
        this.inputFocus = false;
        // 重置搜索
        this.mentionKeyword = '';
        this.mentionResults = [];
        this.searchMentionUsers(); // 加载默认列表
      }
    },
    
    toggleAnonymous() {
      this.isAnonymous = !this.isAnonymous;
    },
    
    // 图片处理（与图片表情互斥）
    chooseImage() {
      // 如果已选择图片表情，提示互斥
      if (this.selectedImageEmoji) {
        uni.showModal({
          title: '提示',
          content: '已选择图片表情，是否清除并选择普通图片？',
          success: (res) => {
            if (res.confirm) {
              this.selectedImageEmoji = null;
              this.doChooseImage();
            }
          }
        });
        return;
      }
      this.doChooseImage();
    },
    
    doChooseImage() {
      const remaining = this.maxImages - this.selectedImages.length;
      if (remaining <= 0) return;
      
      uni.chooseImage({
        count: remaining,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const newImages = res.tempFilePaths.map(path => ({ path }));
          this.selectedImages = [...this.selectedImages, ...newImages];
        }
      });
    },
    
    previewSelectedImage(index) {
      uni.previewImage({
        current: index,
        urls: this.selectedImages.map(img => img.path)
      });
    },
    
    removeImage(index) {
      this.selectedImages.splice(index, 1);
    },
    
    // Unicode表情处理 - 插入emoji代码到内容
    handleEmojiSelect(emoji) {
      // 直接插入emoji字符（而非代码），这样输入框直接显示真实的emoji
      if (emoji.emoji) {
        this.content += emoji.emoji;
        this.saveRecentEmoji(emoji);
        // 不关闭面板，方便连续输入
      }
    },
    
    // 图片表情处理 - 作为图片发送
    handleImageEmojiSelect(emoji) {
      // 图片表情与普通图片互斥
      if (this.selectedImages.length > 0) {
        uni.showModal({
          title: '提示',
          content: '已选择普通图片，是否清除并使用图片表情？',
          success: (res) => {
            if (res.confirm) {
              this.selectedImages = [];
              this.setImageEmoji(emoji);
            }
          }
        });
        return;
      }
      this.setImageEmoji(emoji);
    },
    
    setImageEmoji(emoji) {
      this.selectedImageEmoji = {
        id: emoji.id,
        url: emoji.url,
        name: emoji.name
      };
      this.showEmojiPanel = false;
    },
    
    removeImageEmoji() {
      this.selectedImageEmoji = null;
    },
    
    // 处理图片URL（将相对路径转为绝对路径）
    processImageUrl(url) {
      if (!url) {
        return '';
      }
      return ensureAbsoluteUrl(url);
    },
    
    // 上传自定义表情
    async uploadCustomEmoji() {
      try {
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

        // 让用户输入表情名称
        const nameRes = await new Promise((resolve) => {
          uni.showModal({
            title: '设置表情名称',
            editable: true,
            placeholderText: '请输入表情名称',
            success: resolve
          });
        });
        
        if (!nameRes.confirm || !nameRes.content?.trim()) {
          return;
        }

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
          name: nameRes.content.trim(),
          url: uploadData.data.url,
          type: uploadData.data.url.match(/\.(gif|webp)$/i) ? 'animated' : 'static',
          file_size: fileInfo.size
        };

        const result = await this.$api.emoji.uploadCustom(emojiData);
        uni.hideLoading();
        
        uni.showModal({
          title: '上传成功',
          content: '表情已提交审核，审核通过后将自动添加到您的自定义表情中',
          showCancel: false
        });
      } catch (error) {
        uni.hideLoading();
        console.error('上传表情失败:', error);
        uni.showToast({ title: error.message || '上传失败', icon: 'none' });
      }
    },
    
    // @用户处理
    searchMentionUsers() {
      if (this.mentionTimer) clearTimeout(this.mentionTimer);
      
      // 如果关键字为空，直接不搜索，或者加载热门用户/最近联系人
      // 但现在后端报错400是因为 keyword 为空字符串
      // 我们至少应该让它可以搜空字符串（返回默认列表）或者避免发请求
      
      this.searchingMention = true;
      this.mentionTimer = setTimeout(async () => {
        try {
          // 构造参数对象
          const params = {
            limit: 20
          };
          // 只有当 keyword 不为空时才添加到参数中
          if (this.mentionKeyword && this.mentionKeyword.trim()) {
            params.keyword = this.mentionKeyword.trim();
          }
          
          // 调用API
          const res = await this.$api.user.searchUsers(params);
          if (res.code === 0) {
            this.mentionResults = res.data || [];
          }
        } catch (e) {
          console.error(e);
          // 如果搜索失败（比如空字符串后端还是报错），清空列表
          this.mentionResults = [];
        } finally {
          this.searchingMention = false;
        }
      }, 500);
    },
    
    selectMentionUser(user) {
      this.content += ` @${user.nickname || user.username} `;
      this.showMentionPanel = false;
      this.inputFocus = true;
    },
    
    cancelReply() {
      this.$emit('cancel-reply');
    },
    
    // 提交
    async submitComment() {
      if (!this.canSend || this.sending) return;
      
      this.sending = true;
      try {
        // 1. 处理图片（普通图片或图片表情）
        let imageUrls = [];
        let emojiImageUrl = null;
        
        if (this.selectedImageEmoji) {
          // 图片表情直接使用URL（已是服务器地址）
          emojiImageUrl = this.selectedImageEmoji.url;
        } else if (this.selectedImages.length > 0) {
          // 上传普通图片
          imageUrls = await this.uploadImages();
        }
        
        // 2. 构造数据（将emoji字符转换回[code]格式存储）
        // 注意：图片表情(emoji_image)和普通图片(images)互斥，分开发送
        const payload = {
          post_id: this.postId,
          content: emojiToCode(this.content) || '', // 容错：确保content不为null
          reply_to: this.replyTo?.id || null,
          is_anonymous: this.isAnonymous,
          mentioned_users: this.extractMentions()
        };
        
        // 图片表情和普通图片互斥处理
        if (this.selectedImageEmoji && this.selectedImageEmoji.url) {
          // 使用图片表情
          payload.emoji_image = {
            id: this.selectedImageEmoji.id || null,
            url: this.selectedImageEmoji.url,
            name: this.selectedImageEmoji.name || '表情'
          };
          payload.images = null; // 明确置空
        } else if (imageUrls && imageUrls.length > 0) {
          // 使用普通图片
          payload.images = imageUrls;
          payload.emoji_image = null; // 明确置空
        }
        
        // 3. 调用接口
        const res = await this.$api.comment.create(payload);
        
        if (res.code === 0) {
          this.$emit('success', res.data);
          this.handleClose();
          uni.showToast({ title: '发布成功', icon: 'success' });
        } else {
          uni.showToast({ title: res.msg || '发布失败', icon: 'none' });
        }
      } catch (e) {
        console.error(e);
        uni.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        this.sending = false;
      }
    },
    
    async uploadImages() {
      // 简单的并行上传实现
      const promises = this.selectedImages.map(img => {
        return new Promise((resolve, reject) => {
          uni.uploadFile({
            url: `${this.$api.baseURL}/api/upload/image`,
            filePath: img.path,
            name: 'file',
            header: { 'Authorization': `Bearer ${uni.getStorageSync('token')}` },
            success: (uploadRes) => {
              const data = JSON.parse(uploadRes.data);
              if (data.code === 0) resolve(data.data.url);
              else reject(data.msg);
            },
            fail: reject
          });
        });
      });
      return Promise.all(promises);
    },
    
    extractMentions() {
      // 简单正则提取
      const regex = /@([^\s@]+)/g;
      const matches = this.content.match(regex);
      if (!matches) return [];
      return matches.map(m => m.substring(1)); // 去掉@
    }
  }
};
</script>

<style lang="scss" scoped>
.comment-input-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  
  &.visible {
    opacity: 1;
    visibility: visible;
  }
}

.enhanced-comment-input {
  background-color: #fff;
  border-radius: 24rpx 24rpx 0 0;
  width: 100%;
  max-height: 90vh;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  
  &.slide-up {
    transform: translateY(0);
  }
}

.input-handle {
  width: 60rpx;
  height: 8rpx;
  background-color: #e0e0e0;
  border-radius: 4rpx;
  margin: 16rpx auto 8rpx;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 24rpx;
  
  .input-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
  }
  
  .close-btn {
    padding: 8rpx;
  }
}

.reply-preview {
  display: flex;
  align-items: center;
  margin: 0 24rpx 16rpx;
  padding: 12rpx 16rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  
  .reply-bar {
    width: 4rpx;
    height: 24rpx;
    background-color: #fa5151;
    border-radius: 2rpx;
    margin-right: 12rpx;
  }
  
  .preview-text {
    flex: 1;
    font-size: 24rpx;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .cancel-reply {
    padding: 8rpx;
  }
}

.input-area {
  padding: 0 24rpx 16rpx;
  
  .comment-textarea {
    width: 100%;
    min-height: 80rpx;
    max-height: 200rpx;
    font-size: 32rpx;
    color: #333;
    line-height: 1.6;
  }
  
  .char-count {
    text-align: right;
    font-size: 22rpx;
    color: #bbb;
    margin-top: 8rpx;
    
    &.warning {
      color: #fa5151;
    }
  }
}

.media-preview {
  display: flex;
  flex-wrap: wrap;
  padding: 0 24rpx 16rpx;
  gap: 16rpx;
  
  .emoji-image-item,
  .image-item {
    position: relative;
    width: 160rpx;
    height: 160rpx;
    
    .preview-img {
      width: 100%;
      height: 100%;
      border-radius: 12rpx;
    }
    
    .remove-btn {
      position: absolute;
      top: -12rpx;
      right: -12rpx;
      width: 40rpx;
      height: 40rpx;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 16rpx 24rpx;
  border-top: 1rpx solid #f0f0f0;
  gap: 24rpx;
  
  .tool-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    
    &.active {
      background: #f0f0f0;
    }
    
    .tool-icon {
      font-size: 40rpx;
    }
    
    .tool-icon-img {
      width: 48rpx;
      height: 48rpx;
    }
  }
  
  .anonymous-toggle {
    padding: 8rpx 20rpx;
    background: #f5f5f5;
    border-radius: 24rpx;
    
    .toggle-text {
      font-size: 24rpx;
      color: #666;
    }
  }
  
  .toolbar-spacer {
    flex: 1;
  }
  
  .send-btn {
    flex: none;
    padding: 0 32rpx;
    height: 64rpx;
    background: #e0e0e0;
    color: #999;
    font-size: 28rpx;
    border-radius: 32rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.active {
      background: #fa5151;
      color: #fff;
    }
    
    &::after {
      border: none;
    }
  }
}

.recent-emoji-bar {
  padding: 16rpx 24rpx;
  background: #fafafa;
  white-space: nowrap;
  
  .recent-emoji-list {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }
  
  .recent-emoji-item {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border-radius: 12rpx;
    
    .emoji-char {
      font-size: 40rpx;
    }
  }
  
  .more-emoji {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border-radius: 12rpx;
    color: #999;
  }
}

.emoji-panel-wrapper {
  background: #f5f5f5;
  
  .emoji-tabs {
    background: #fff;
    border-bottom: 1rpx solid #eee;
    
    .tab-list {
      display: flex;
      padding: 0 16rpx;
    }
    
    .tab-item {
      padding: 16rpx 24rpx;
      font-size: 36rpx;
      position: relative;
      
      &.active::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 4rpx;
        background: #fa5151;
        border-radius: 2rpx;
      }
      
      .pack-icon {
        width: 48rpx;
        height: 48rpx;
        border-radius: 8rpx;
      }
    }
  }
  
  .emoji-content {
    height: 500rpx;
    padding: 16rpx;
    
    .section-title {
      font-size: 24rpx;
      color: #999;
      margin: 16rpx 0 12rpx;
      display: block;
    }
    
    .coming-soon {
      display: block;
      text-align: center;
      padding: 60rpx;
      color: #ccc;
      font-size: 28rpx;
    }
    
    .emoji-grid {
      display: flex;
      flex-wrap: wrap;
    }
    
    .emoji-item {
      width: 12.5%;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:active {
        background: #e8e8e8;
        border-radius: 8rpx;
      }
      
      .emoji-char {
        font-size: 44rpx;
      }
      
      &.image-emoji {
        width: 25%;
        height: 120rpx;
        padding: 8rpx;
        
        .emoji-img {
          width: 100%;
          height: 100%;
          border-radius: 8rpx;
        }
        
        &.upload-btn {
          background: #f5f5f5;
          border: 2rpx dashed #ccc;
          border-radius: 12rpx;
          margin: 8rpx;
          width: calc(25% - 16rpx);
          
          .upload-icon {
            font-size: 56rpx;
            color: #999;
            font-weight: 300;
          }
        }
      }
    }
    
    .empty-state {
      text-align: center;
      padding: 60rpx;
      color: #999;
      font-size: 26rpx;
    }
  }
  
  .emoji-bottom-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 16rpx 24rpx;
    background: #fff;
    border-top: 1rpx solid #eee;
    gap: 24rpx;
    
    .delete-btn {
      width: 80rpx;
      height: 64rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      border-radius: 12rpx;
      font-size: 36rpx;
    }
    
    .send-emoji-btn {
      padding: 0 40rpx;
      height: 64rpx;
      background: #e0e0e0;
      color: #999;
      font-size: 28rpx;
      border-radius: 32rpx;
      border: none;
      
      &.active {
        background: #fa5151;
        color: #fff;
      }
      
      &::after {
        border: none;
      }
    }
  }
}

.mention-panel {
  background: #fff;
  
  .mention-search {
    padding: 16rpx 24rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    .search-input {
      width: 100%;
      height: 64rpx;
      padding: 0 24rpx;
      background: #f5f5f5;
      border-radius: 32rpx;
      font-size: 28rpx;
    }
  }
  
  .mention-list {
    height: 400rpx;
    
    .user-item {
      display: flex;
      align-items: center;
      padding: 20rpx 24rpx;
      border-bottom: 1rpx solid #f5f5f5;
      
      .user-avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        margin-right: 20rpx;
      }
      
      .user-info {
        flex: 1;
        
        .nickname {
          font-size: 28rpx;
          color: #333;
          font-weight: 500;
        }
        
        .username {
          font-size: 24rpx;
          color: #999;
          margin-top: 4rpx;
        }
      }
    }
    
    .empty-state {
      padding: 60rpx;
      text-align: center;
      color: #999;
      font-size: 26rpx;
    }
  }
}
</style>