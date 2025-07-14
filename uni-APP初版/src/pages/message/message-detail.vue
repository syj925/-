<template>
  <view class="detail-container">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">消息详情</text>
      <view class="nav-action" @tap="showOptions">
        <text class="action-icon">⋮</text>
      </view>
    </view>
    
    <!-- 消息内容区域 -->
    <scroll-view 
      scroll-y="true" 
      class="detail-scroll"
    >
      <!-- 消息加载失败或已删除的提示 -->
      <view class="message-not-found" v-if="messageNotFound">
        <image class="not-found-icon" :src="getImage('/static/images/empty-message.png')" mode="aspectFit"></image>
        <text class="not-found-title">消息不存在或已被删除</text>
        <text class="not-found-desc">该消息可能已被管理员删除或暂时无法访问</text>
        <button class="back-button" @tap="goBack">返回消息列表</button>
      </view>
      
      <view class="message-card" v-else>
        <!-- 消息头部 -->
        <view class="message-header">
          <image class="sender-avatar" :src="message.senderAvatar || getImage('/static/icons/xttz.png')" mode="aspectFill"></image>
          <view class="sender-info">
            <text class="sender-name">{{ message.sender }}</text>
            <text class="message-time">{{ message.formattedTime }}</text>
          </view>
        </view>
        
        <!-- 消息标题 -->
        <view class="message-title" v-if="message.title">
          {{ message.title }}
        </view>
        
        <!-- 消息内容 -->
        <view class="message-content">
          <rich-text :nodes="messageContent"></rich-text>
        </view>
        
        <!-- 图片附件 -->
        <view class="image-gallery" v-if="message.images && message.images.length">
          <image 
            v-for="(img, index) in message.images" 
            :key="index"
            :src="img"
            mode="widthFix"
            class="content-image"
            @tap="previewImage(message.images, index)"
          ></image>
        </view>
        
        <!-- 链接卡片 -->
        <view class="link-card" v-if="message.link" @tap="openLink(message.link)">
          <view class="link-title">{{ message.linkTitle || '查看详情' }}</view>
          <text class="link-icon">→</text>
        </view>
      </view>
      
      <!-- 相关消息 -->
      <view class="related-messages" v-if="relatedMessages.length > 0">
        <view class="related-title">相关消息</view>
        <view 
          class="related-item" 
          v-for="(item, index) in relatedMessages" 
          :key="index"
          @tap="viewRelatedMessage(item.id)"
        >
          <text class="related-dot"></text>
          <text class="related-text">{{ item.title || item.content }}</text>
          <text class="related-time">{{ item.time }}</text>
        </view>
      </view>
    </scroll-view>
    
    <!-- 底部操作按钮 -->
    <view class="action-bar" v-if="message.actionButtons && message.actionButtons.length">
      <button 
        v-for="(btn, index) in message.actionButtons" 
        :key="index"
        class="action-button"
        :class="{ 'primary-btn': btn.primary }"
        @tap="handleAction(btn)"
      >
        {{ btn.text }}
      </button>
    </view>
  </view>
</template>

<script>
import api from '../../utils/api.js';
import { getImage } from '@/utils/imagePathHelper';

export default {
  data() {
    return {
      messageId: null,
      message: {
        id: null,
        type: 'system',
        senderName: '',
        senderAvatar: '',
        title: '',
        content: '',
        time: '',
        images: [],
        link: '',
        linkTitle: '',
        actionButtons: []
      },
      relatedMessages: [],
      loading: false,
      readDelaySeconds: 5,  // 默认等待5秒
      readTimer: null,      // 标记已读的计时器
      hasMarkedAsRead: false, // 是否已经标记为已读
      messageNotFound: false  // 消息是否找不到或已删除
    }
  },
  computed: {
    messageContent() {
      // 将消息内容解析为富文本
      if (!this.message.content) return '';
      
      // 基本的HTML过滤与格式化
      let content = this.message.content
        .replace(/\n/g, '<br>')
        .replace(/(https?:\/\/[^\s]+)/g, '<a style="color: #007AFF; text-decoration: underline;" href="$1">$1</a>');
      
      return content;
    },
    isSystemNotification() {
      return this.message.type === 'system' || this.message.type === 'announcement';
    }
  },
  onLoad(options) {
    if (options.id) {
      this.messageId = options.id;
      
      // 先获取消息设置
      this.getMessageSettings().then(() => {
        // 加载消息详情
        this.loadMessageDetail(options.id);
      });
    } else {
      uni.showToast({
        title: '消息ID不存在',
        icon: 'none'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  },
  onUnload() {
    // 页面卸载时，如果定时器存在，则清除
    if (this.readTimer) {
      clearTimeout(this.readTimer);
      this.readTimer = null;
    }
    
    // 如果页面离开时尚未标记已读，则立即标记
    if (!this.hasMarkedAsRead && this.messageId) {
      this.markAsRead(this.messageId);
    }
  },
  methods: {
    getImage,
    // 获取消息设置
    getMessageSettings() {
      return api.settings.getMessageSettings()
        .then(res => {
          if (res.success && res.data) {
            this.readDelaySeconds = res.data.readDelaySeconds;
            console.log('消息已读延迟设置:', this.readDelaySeconds, '秒');
          }
        })
        .catch(err => {
          console.error('获取消息设置失败，使用默认值:', err);
          // 使用默认值
          this.readDelaySeconds = 5;
        });
    },
    
    // 加载消息详情
    loadMessageDetail(id) {
      this.loading = true;
      
      api.messages.getDetail(id)
        .then(res => {
          if (res.success) {
            this.message = res.data.message;
            
            // 如果有相关消息数据
            if (res.data.relatedMessages) {
              this.relatedMessages = res.data.relatedMessages;
            }
            
            // 延迟标记为已读
            this.startReadTimer(id);
          } else {
            this.messageNotFound = true;
            uni.showToast({
              title: res.message || '消息不存在或已被删除',
              icon: 'none'
            });
          }
        })
        .catch(err => {
          console.error('获取消息详情失败:', err);
          this.messageNotFound = true;
          
          // 检查是否是404错误（消息不存在或已删除）
          if (err.statusCode === 404) {
            uni.showToast({
              title: '消息不存在或已被删除',
              icon: 'none'
            });
          } else {
            uni.showToast({
              title: '获取消息详情失败，请稍后再试',
              icon: 'none'
            });
          }
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    // 开始计时，延迟标记为已读
    startReadTimer(id) {
      // 清除可能存在的旧定时器
      if (this.readTimer) {
        clearTimeout(this.readTimer);
        this.readTimer = null;
      }
      
      // 设置新定时器，延迟指定秒数后标记为已读
      console.log(`将在 ${this.readDelaySeconds} 秒后标记消息为已读`);
      this.readTimer = setTimeout(() => {
        if (!this.hasMarkedAsRead) {
          this.markAsRead(id);
        }
      }, this.readDelaySeconds * 1000);
    },
    
    // 标记消息为已读
    markAsRead(id) {
      // 防止重复标记
      if (this.hasMarkedAsRead) return;
      
      // 如果消息不存在，不执行标记
      if (this.messageNotFound) return;
      
      console.log('标记消息为已读:', id);
      this.hasMarkedAsRead = true;
      
      api.messages.markAsRead(id)
        .then(res => {
          if (!res.success) {
            console.error('标记消息已读失败:', res.message);
            // 如果失败，重置标记状态
            this.hasMarkedAsRead = false;
          }
        })
        .catch(err => {
          console.error('标记消息已读失败:', err);
          // 如果失败，重置标记状态
          this.hasMarkedAsRead = false;
          
          // 如果是404错误（消息已删除），显示提示
          if (err.statusCode === 404) {
            this.messageNotFound = true;
            uni.showToast({
              title: '消息不存在或已被删除',
              icon: 'none'
            });
          }
        });
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 显示更多选项
    showOptions() {
      uni.showActionSheet({
        itemList: ['标记为未读', '删除消息', '屏蔽此类消息'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.markAsUnread();
          } else if (res.tapIndex === 1) {
            this.deleteMessage();
          } else if (res.tapIndex === 2) {
            this.blockMessageType();
          }
        }
      });
    },
    
    // 标记为未读
    markAsUnread() {
      // 实际应用中应该调用API
      uni.showToast({
        title: '标记为未读功能开发中',
        icon: 'none'
      });
    },
    
    // 删除当前消息
    deleteMessage() {
      uni.showModal({
        title: '删除消息',
        content: '确定要删除此消息吗？',
        success: (res) => {
          if (res.confirm) {
            api.messages.delete(this.messageId)
              .then(res => {
                if (res.success) {
                  uni.showToast({
                    title: '删除成功',
                    icon: 'success'
                  });
                  
                  // 返回上一页
                  setTimeout(() => {
                    uni.navigateBack();
                  }, 1000);
                } else {
                  uni.showToast({
                    title: res.message || '删除失败',
                    icon: 'none'
                  });
                }
              })
              .catch(err => {
                console.error('删除消息失败:', err);
                uni.showToast({
                  title: '删除失败，请稍后再试',
                  icon: 'none'
                });
              });
          }
        }
      });
    },
    
    // 屏蔽此类消息
    blockMessageType() {
      // 实际应用中应该调用API
      uni.showToast({
        title: '屏蔽功能开发中',
        icon: 'none'
      });
    },
    
    // 预览图片
    previewImage(images, index) {
      uni.previewImage({
        urls: images,
        current: index
      });
    },
    
    // 打开链接
    openLink(link) {
      if (link.startsWith('/')) {
        // 内部链接
        uni.navigateTo({
          url: link
        });
      } else {
        // 外部链接
        uni.showToast({
          title: '暂不支持外部链接',
          icon: 'none'
        });
      }
    },
    
    // 查看相关消息
    viewRelatedMessage(id) {
      if (id === this.messageId) {
        return;
      }
      
      uni.redirectTo({
        url: `/pages/message/message-detail?id=${id}`
      });
    },
    
    // 处理操作按钮事件
    handleAction(btn) {
      if (!btn || !btn.action) return;
      
      switch (btn.action) {
        case 'close':
          uni.navigateBack();
          break;
        case 'help':
          uni.navigateTo({
            url: '/pages/help/index'
          });
          break;
        case 'link':
          if (btn.link) {
            this.openLink(btn.link);
          }
          break;
        default:
          console.log('未处理的按钮操作:', btn.action);
      }
    }
  }
}
</script>

<style>
.detail-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fc;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: linear-gradient(135deg, #619cf7, #78A5F3);
  color: #FFFFFF;
  height: 44px; /* 固定高度 */
  box-shadow: 0 3px 12px rgba(74, 144, 226, 0.15);
  position: relative;
  z-index: 10;
}

.nav-bar::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  right: 0;
  height: 15px;
  background: linear-gradient(to bottom, rgba(97, 156, 247, 0.1), transparent);
  z-index: -1;
}

.nav-back, .nav-action {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.25s ease;
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
}

.nav-back:active, .nav-action:active {
  transform: scale(0.92);
  background-color: rgba(255, 255, 255, 0.25);
}

.back-icon, .action-icon {
  font-size: 18px;
  color: #FFFFFF;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 内容区域 */
.detail-scroll {
  flex: 1;
  padding: 15px;
  height: calc(100vh - 44px - 50px); /* 减去顶部导航栏和底部安全区域的高度 */
}

.message-card {
  background-color: #FFFFFF;
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 18px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.02);
  position: relative;
  overflow: hidden;
}

.message-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  pointer-events: none;
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.sender-avatar {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  margin-right: 12px;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  object-fit: cover;
}

.sender-info {
  flex: 1;
}

.sender-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  display: block;
}

.message-time {
  font-size: 12px;
  color: #a0a8b3;
  background-color: rgba(0, 0, 0, 0.02);
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
}

.message-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
  line-height: 1.4;
  position: relative;
  padding-bottom: 10px;
}

.message-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background-color: #619cf7;
  border-radius: 3px;
}

.message-content {
  font-size: 14px;
  line-height: 1.6;
  color: #444;
  margin-bottom: 18px;
}

.message-content p {
  margin-bottom: 12px;
}

.message-content ul, .message-content ol {
  padding-left: 18px;
  margin-bottom: 12px;
}

.message-content li {
  margin-bottom: 6px;
}

.image-gallery {
  margin-bottom: 18px;
}

.content-image {
  width: 100%;
  border-radius: 12px;
  margin-bottom: 10px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.25s ease;
}

.content-image:active {
  transform: scale(0.98);
}

.link-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background-color: rgba(97, 156, 247, 0.08);
  border-radius: 12px;
  border-left: 3px solid #619cf7;
  transition: all 0.25s ease;
}

.link-card:active {
  transform: scale(0.98);
  background-color: rgba(97, 156, 247, 0.12);
}

.link-title {
  font-size: 14px;
  color: #619cf7;
  font-weight: 500;
}

.link-icon {
  font-size: 16px;
  color: #619cf7;
  margin-left: 5px;
  transition: transform 0.3s ease;
}

.link-card:active .link-icon {
  transform: translateX(3px);
}

/* 相关消息 */
.related-messages {
  background-color: #FFFFFF;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.02);
  position: relative;
  overflow: hidden;
}

.related-messages::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  pointer-events: none;
}

.related-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  position: relative;
  padding-left: 12px;
}

.related-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  width: 3px;
  height: 16px;
  background-color: #619cf7;
  border-radius: 3px;
}

.related-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.25s ease;
}

.related-item:active {
  background-color: rgba(97, 156, 247, 0.05);
  border-radius: 8px;
  padding-left: 5px;
}

.related-item:last-child {
  border-bottom: none;
}

.related-dot {
  width: 6px;
  height: 6px;
  background-color: #619cf7;
  border-radius: 3px;
  margin-right: 10px;
  box-shadow: 0 0 0 3px rgba(97, 156, 247, 0.1);
}

.related-text {
  flex: 1;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.related-time {
  font-size: 12px;
  color: #a0a8b3;
  background-color: rgba(0, 0, 0, 0.02);
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 10px;
}

/* 底部操作栏 */
.action-bar {
  display: flex;
  padding: 12px 15px;
  background-color: #FFFFFF;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.action-button {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  margin: 0 6px;
  border-radius: 22px;
  background-color: rgba(0, 0, 0, 0.03);
  color: #333;
  border: none;
  transition: all 0.25s ease;
}

.action-button:active {
  transform: scale(0.98);
}

.primary-btn {
  background-color: #619cf7;
  background: linear-gradient(135deg, #619cf7, #78A5F3);
  color: #FFFFFF;
  box-shadow: 0 3px 10px rgba(97, 156, 247, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.primary-btn:active {
  box-shadow: 0 1px 5px rgba(97, 156, 247, 0.2);
}

/* 消息不存在或已删除样式 */
.message-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background-color: #fff;
  border-radius: 16px;
  margin: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
}

.not-found-icon {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
}

.not-found-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.not-found-desc {
  font-size: 14px;
  color: #999;
  text-align: center;
  margin-bottom: 20px;
}

.back-button {
  background: linear-gradient(135deg, #619cf7, #78A5F3);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
}
</style> 