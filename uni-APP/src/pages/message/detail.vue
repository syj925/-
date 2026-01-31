<template>
  <view class="message-detail">
    <!-- 头部导航 -->
    <view class="detail-header">
      <view class="header-left" @tap="goBack">
        <text class="back-icon">‹</text>
      </view>
      <view class="header-center">
        <text class="header-title">{{ categoryName }}</text>
      </view>
      <view class="header-right">
        <text class="mark-all-read" @tap="markAllAsRead" v-if="unreadCount > 0">全部已读</text>
      </view>
    </view>
    
    <!-- 消息列表 -->
    <scroll-view 
      :scroll-y="true"
      class="detail-scroll"
      @scrolltolower="loadMore"
      refresher-enabled="true"
      :refresher-threshold="100"
      refresher-default-style="black"
      refresher-background="#f8f9fa"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="refreshData"
      :lower-threshold="100"
    >
      <view class="detail-list">
        <!-- 空状态 -->
        <view class="detail-empty" v-if="!messageList.length && !loading">
          <image class="empty-icon" src="/static/images/common/empty.png"></image>
          <text class="empty-text">暂无{{ categoryName }}</text>
        </view>
        
        <!-- 消息项 -->
                  <view 
            v-for="(item, index) in messageList" 
            :key="item.id"
            class="detail-item"
            :class="{ 'unread': !item.is_read }"
            @tap="handleItemClick(item)"
          >
            <view class="item-left">
              <view class="item-avatar-container">
                <image class="item-avatar" :src="item.senderAvatar" mode="aspectFill"></image>
                <view v-if="!item.is_read" class="item-badge"></view>
              </view>
            </view>
            
            <view class="item-content">
              <view class="content-header">
                <view class="content-left">
                  <text class="content-username">{{ item.senderName }}</text>
                  <!-- 系统通知类型标签 -->
                  <view v-if="item.type === 'system'" class="system-type-tag" :style="getSystemMessageTypeStyleString(item)">
                    <text class="system-type-text">{{ getSystemMessageTypeText(item) }}</text>
                  </view>
                </view>
                <text class="content-time">{{ item.time }}</text>
              </view>
              
              <!-- 消息标题 -->
              <view class="content-title" v-if="item.title">
                <text class="content-title-text">{{ item.title }}</text>
              </view>
              
              <view class="content-body" v-if="item.content">
                <text class="content-text">{{ item.content }}</text>
              </view>
              
              <!-- 相关帖子预览 -->
              <view class="content-post" v-if="item.postPreview" @tap.stop="goToPost(item)">
                <text class="post-preview-text">{{ item.postPreview }}</text>
              </view>
            </view>
          </view>
      </view>
      
          <!-- 加载状态 -->
          <view class="detail-loading" v-if="loading">
            <text class="loading-text">加载中...</text>
          </view>
          
          <!-- 没有更多 -->
          <view class="detail-no-more" v-if="!hasMore && messageList.length > 0">
            <text class="no-more-text">没有更多了</text>
          </view>
          
    </scroll-view>
  </view>
</template>

<script>
import { useMessageStore } from '@/stores';
import { ensureImageUrl } from '@/utils/url';

export default {
  name: 'MessageDetail',
  
  data() {
    return {
      messageType: '',
      categoryName: '',
      messageList: [],
      currentPage: 1,
      pageSize: 20,
      hasMore: true,
      loading: false,
      unreadCount: 0,
      hasAutoMarkedRead: false, // 标记是否已自动批量已读
      isRefreshing: false, // 下拉刷新状态
      messageReceivedHandler: null // 事件处理器引用
    };
  },

  
  created() {
    this.messageStore = useMessageStore();
  },
  
  // uni-app全局事件监听
  onLoad(options) {
    this.messageType = options.type || '';
    this.categoryName = decodeURIComponent(options.name || '消息详情');
    
    // 确保正确绑定this上下文
    this.messageReceivedHandler = (eventData) => {
      this.handleNewMessage(eventData);
    };
    
    // 监听全局消息事件
    uni.$on('messageReceived', this.messageReceivedHandler);
    
    // 设置导航栏标题
    uni.setNavigationBarTitle({
      title: this.categoryName
    });
    
    this.loadMessages(true);
  },


  onUnload() {
    // 移除事件监听
    if (this.messageReceivedHandler) {
      uni.$off('messageReceived', this.messageReceivedHandler);
    }
  },
  
  methods: {
    // 处理全局新消息事件
    handleNewMessage(eventData) {
      const message = eventData.message;
      
      // 只有当新消息类型与当前页面类型匹配时才更新
      if (message && message.type === this.messageType) {

        this.smartAddNewMessage(message);
      }
    },

    // 🚀 智能添加新消息（避免跳动）
    smartAddNewMessage(newMessage) {
      try {
        // 检查是否已经存在该消息
        const existingIndex = this.messages.findIndex(item => 
          item.id === newMessage.id || 
          (item.sender_id === newMessage.sender_id && 
           Math.abs(new Date(item.created_at) - new Date(newMessage.created_at)) < 1000)
        );
        
        if (existingIndex >= 0) {

          return;
        }
        
        // 格式化新消息并添加到列表顶部
        const formattedMessage = {
          ...newMessage,
          avatar: ensureImageUrl(newMessage.sender?.avatar, 'avatar'),
          time: this.formatTime(newMessage.created_at),
          content: this.removeHtmlTags(newMessage.content || ''),
          isNew: true // 新消息标记
        };
        
        // 平滑插入到列表顶部
        this.messages.unshift(formattedMessage);
        
        // 短暂延迟后移除新消息标记
        setTimeout(() => {
          const messageInList = this.messages.find(item => item.id === formattedMessage.id);
          if (messageInList) {
            messageInList.isNew = false;
          }
        }, 100);

      } catch (error) {
        console.error('❌ 详情页智能更新失败，回退到全量刷新:', error);
        this.loadMessages(true);
      }
    },

    // 加载消息列表
    async loadMessages(reset = false) {
      if (this.loading) return;
      
      try {
        this.loading = true;
        
        if (reset) {
          this.currentPage = 1;
          this.messageList = [];
          this.hasMore = true;
        }
        
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize,
          type: this.messageType
        };
        
        const result = await this.$api.message.getList(params);
        
        if (result.success || result.code === 0) {
          const { list, pagination } = result.data;
          const formattedMessages = this.formatMessages(list);
          
          if (reset) {
            this.messageList = formattedMessages;
          } else {
            this.messageList.push(...formattedMessages);
          }
          
          // 更新分页信息
          if (pagination) {
            // 正确的分页逻辑：检查已加载的总数是否小于总数
            const loadedCount = pagination.page * pagination.pageSize;
            this.hasMore = loadedCount < pagination.total;
            this.currentPage = pagination.page + 1; // 设置下一页页码

          } else {
            this.hasMore = false;
          }
          
          // 统计未读数量（用于UI显示，不影响后台已读状态）
          this.unreadCount = this.messageList.filter(msg => !msg.is_read).length;
          
          // 首次加载时自动批量已读（后台处理）
          if (reset && !this.hasAutoMarkedRead && this.unreadCount > 0) {
            this.autoMarkTypeAsRead();
          }
        } else {
          this.showError(result.msg || '加载消息失败');
        }
      } catch (error) {
        console.error('加载消息失败:', error);
        this.showError('网络异常，请重试');
      } finally {
        this.loading = false;
      }
    },
    
    // 格式化消息数据
    formatMessages(messages) {
      return messages.map(msg => {
        const senderName = this.getSenderName(msg.sender);
        const senderAvatar = ensureImageUrl(msg.sender?.avatar, 'avatar');
        // 修复：后端返回的是createdAt，不是created_at
        const timeFormatted = this.formatTime(msg.createdAt || msg.created_at);
        
        return {
          id: msg.id,
          type: msg.type,
          title: msg.title,
          content: msg.content,
          time: timeFormatted,
          senderName,
          senderAvatar,
          is_read: !!msg.is_read,
          post_id: msg.post_id,
          comment_id: msg.comment_id,
          sender: msg.sender,
          sub_type: msg.sub_type, // 添加子类型字段用于标签显示
          postPreview: this.generatePostPreview(msg)
        };
      });
    },
    
    // 生成帖子预览
    generatePostPreview(msg) {
      if (msg.type === 'like' || msg.type === 'comment' || msg.type === 'reply') {
        // 这里可以从消息中提取帖子信息，或者显示固定文本
        return '查看相关帖子 ›';
      }
      return null;
    },
    
    // 格式化时间显示
    formatTime(dateString) {
      if (!dateString) {
        return '';
      }
      
      const now = new Date();
      const msgTime = new Date(dateString);
      
      // 检查时间是否有效
      if (isNaN(msgTime.getTime())) {
        return dateString; // 返回原始字符串
      }
      
      const diffMs = now.getTime() - msgTime.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) {
        return '刚刚';
      } else if (diffMins < 60) {
        return `${diffMins}分钟前`;
      } else if (diffHours < 24) {
        return `${diffHours}小时前`;
      } else if (diffDays === 1) {
        return `昨天 ${msgTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else {
        return msgTime.toLocaleDateString('zh-CN', {
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },

    // 移除HTML标签，返回纯文本
    removeHtmlTags(html) {
      if (!html) return '';
      
      // 简单的HTML标签移除
      return html
        .replace(/<[^>]*>/g, '') // 移除HTML标签
        .replace(/&nbsp;/g, ' ') // 替换空格实体
        .replace(/&lt;/g, '<') // 替换小于号实体
        .replace(/&gt;/g, '>') // 替换大于号实体
        .replace(/&amp;/g, '&') // 替换&实体
        .replace(/&quot;/g, '"') // 替换引号实体
        .trim(); // 去除首尾空白
    },
    
    // 处理消息项点击
    handleItemClick(item) {
      try {
        // 只在UI上标记为已读，不调用API（因为进入页面时已经批量已读了）
        if (!item.is_read) {
          item.is_read = true;
          this.unreadCount--;
        }
        
        // 根据消息类型跳转
        switch(item.type) {
          case 'like':
          case 'comment':
          case 'reply':
          case 'favorite':
            if (item.post_id) {
              uni.navigateTo({
                url: `/pages/post/detail?id=${item.post_id}`
              });
            }
            break;
          case 'follow':
            if (item.sender && item.sender.id) {
              uni.navigateTo({
                url: `/pages/user/user-profile?id=${item.sender.id}`
              });
            }
            break;
          case 'system':
          case 'mention':
            uni.showModal({
              title: item.title,
              content: item.content,
              showCancel: false
            });
            break;
        }
      } catch (error) {
        console.error('处理消息点击失败:', error);
      }
    },
    
    // 跳转到帖子详情
    goToPost(item) {
      if (item.post_id) {
        uni.navigateTo({
          url: `/pages/post/detail?id=${item.post_id}`
        });
      }
    },
    
    // 自动批量标记该类型消息为已读（后台处理 + 乐观更新）
    async autoMarkTypeAsRead() {
      if (this.hasAutoMarkedRead || !this.messageType) return;
      
      const currentUnread = this.unreadCount;
      
      try {

        // 🎯 乐观更新：立即更新全局未读计数
        if (currentUnread > 0) {
          this.messageStore.updateUnreadCount(-currentUnread);

        }
        
        const result = await this.$api.message.readAll(this.messageType);
        
        if (result.success || result.code === 0) {
          this.hasAutoMarkedRead = true;

          // 确保全局计数正确（防止乐观更新不准确）
          setTimeout(() => {
            this.messageStore.fetchUnreadCount();
          }, 500);
        } else {
          // 如果API调用失败，回滚乐观更新
          if (currentUnread > 0) {
            this.messageStore.updateUnreadCount(currentUnread);

          }
        }
      } catch (error) {
        console.error('自动批量已读失败:', error);
        // API调用失败，回滚乐观更新
        if (currentUnread > 0) {
          this.messageStore.updateUnreadCount(currentUnread);

        }
      }
    },

    // 标记消息已读
    async markAsRead(messageId) {
      try {
        const result = await this.$api.message.markAsRead(messageId);
        if (!result.success && result.code !== 0) {
          console.error('标记已读失败:', result.msg);
        }
      } catch (error) {
        console.error('标记已读失败:', error);
      }
    },
    
    // 全部标记为已读
    async markAllAsRead() {
      if (this.unreadCount === 0) return;
      
      try {
        uni.showLoading({ title: '处理中...' });
        
        const result = await this.$api.message.readAll(this.messageType);
        
        if (result.success || result.code === 0) {
          // 更新本地状态
          this.messageList.forEach(msg => {
            if (!msg.is_read) {
              msg.is_read = true;
            }
          });
          
          // 更新全局未读数量
          this.messageStore.updateUnreadCount(-this.unreadCount);
          this.unreadCount = 0;
          
          uni.showToast({
            title: '已全部标记为已读',
            icon: 'success'
          });
        } else {
          this.showError(result.msg || '操作失败');
        }
      } catch (error) {
        console.error('全部标记已读失败:', error);
        this.showError('网络异常，请重试');
      } finally {
        uni.hideLoading();
      }
    },
    
    // 加载更多
    loadMore() {
      if (!this.hasMore || this.loading) {
        return;
      }
      this.loadMessages(false);
    },
    
    // 下拉刷新
    async refreshData() {
      if (this.isRefreshing) return;
      
      this.isRefreshing = true;
      
      try {
        await this.loadMessages(true);
        uni.showToast({
          title: '刷新成功',
          icon: 'success',
          duration: 1000
        });
      } catch (error) {
        console.error('刷新失败:', error);
        uni.showToast({
          title: '刷新失败',
          icon: 'none',
          duration: 1500
        });
      } finally {
        setTimeout(() => {
          this.isRefreshing = false;
        }, 300);
      }
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 显示错误信息
    showError(message) {
      uni.showToast({
        title: message,
        icon: 'none',
        duration: 2000
      });
    },

    // 获取发送者名称
    getSenderName(sender) {
      if (!sender) return '用户';
      return sender.nickname || sender.username || '用户';
    },

    // 获取系统消息类型文本
    getSystemMessageTypeText(message) {
      if (!message) return '系统';
      
      // 如果消息有 sub_type 字段，优先使用
      if (message.sub_type) {
        const typeMap = {
          'announcement': '公告',
          'event': '活动', 
          'reminder': '提醒',
          'warning': '警告',
          'maintenance': '维护',
          'update': '更新'
        };
        return typeMap[message.sub_type] || '系统';
      }
      
      // 如果没有 sub_type，通过标题关键词判断
      const title = message.title || '';
      if (title.includes('公告') || title.includes('【公告】')) return '公告';
      if (title.includes('活动') || title.includes('【活动】')) return '活动';
      if (title.includes('提醒') || title.includes('【提醒】')) return '提醒';
      if (title.includes('警告') || title.includes('【警告】')) return '警告';
      if (title.includes('维护') || title.includes('【维护】')) return '维护';
      if (title.includes('更新') || title.includes('【更新】')) return '更新';
      
      return '系统';
    },

    // 获取系统消息类型样式
    getSystemMessageTypeStyle(message) {
      if (!message) return { bgColor: '#f5f5f5', textColor: '#757575' };
      
      // 获取消息类型
      let messageType = 'system';
      if (message.sub_type) {
        messageType = message.sub_type;
      } else {
        const title = message.title || '';
        if (title.includes('公告') || title.includes('【公告】')) messageType = 'announcement';
        else if (title.includes('活动') || title.includes('【活动】')) messageType = 'event';
        else if (title.includes('提醒') || title.includes('【提醒】')) messageType = 'reminder';
        else if (title.includes('警告') || title.includes('【警告】')) messageType = 'warning';
        else if (title.includes('维护') || title.includes('【维护】')) messageType = 'maintenance';
        else if (title.includes('更新') || title.includes('【更新】')) messageType = 'update';
      }
      
      // 返回不同类型的颜色配置
      const styleMap = {
        'announcement': { bgColor: '#e3f2fd', textColor: '#1976d2' }, // 蓝色 - 公告
        'event': { bgColor: '#e8f5e8', textColor: '#2e7d32' },        // 绿色 - 活动
        'reminder': { bgColor: '#fff3e0', textColor: '#f57c00' },     // 橙色 - 提醒
        'warning': { bgColor: '#ffebee', textColor: '#d32f2f' },      // 红色 - 警告
        'maintenance': { bgColor: '#fce4ec', textColor: '#c2185b' },  // 粉色 - 维护
        'update': { bgColor: '#f3e5f5', textColor: '#7b1fa2' },       // 紫色 - 更新
        'system': { bgColor: '#f5f5f5', textColor: '#757575' }        // 灰色 - 默认系统
      };
      
      return styleMap[messageType] || styleMap['system'];
    },

    // 获取系统消息类型样式字符串（用于内联样式）
    getSystemMessageTypeStyleString(message) {
      const style = this.getSystemMessageTypeStyle(message);
      return `background-color: ${style.bgColor}; color: ${style.textColor};`;
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/mixins.scss';

.message-detail {
  height: 100vh;
  background-color: $bg-page;
  @include flex(column, flex-start, stretch);
}

.detail-header {
  @include flex(row, space-between, center);
  height: 88rpx;
  padding: 0 $spacing-md;
  background-color: $bg-card;
  border-bottom: 1rpx solid rgba($border-color, 0.1);
  backdrop-filter: blur(20rpx);
}

.header-left {
  width: 120rpx;
  @include flex(row, flex-start, center);
}

.back-icon {
  font-size: 40rpx;
  color: $text-primary;
  font-weight: 400;
  padding: $spacing-xs;
  border-radius: $radius-sm;
  
  &:active {
    background-color: rgba($text-tertiary, 0.1);
  }
}

.header-center {
  flex: 1;
  @include flex(row, center, center);
}

.header-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
}

.header-right {
  width: 120rpx;
  @include flex(row, flex-end, center);
}

.mark-all-read {
  font-size: $font-size-sm;
  color: $primary-color;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-md;
  
  &:active {
    background-color: rgba($primary-color, 0.1);
  }
}

.detail-scroll {
  flex: 1;
  height: 0; /* 明确高度，配合 flex:1 使用 */
  width: 100%;
  box-sizing: border-box;
}

.detail-list {
  padding: $spacing-xs 0;
}

.detail-empty {
  @include flex(column, center, center);
  padding: 100rpx $spacing-md 80rpx;
}

.empty-icon {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: $spacing-md;
  opacity: 0.2;
}

.empty-text {
  font-size: $font-size-md;
  color: $text-tertiary;
}

.detail-item {
  @include flex(row, flex-start, center);
  background-color: $bg-card;
  margin: $spacing-xs $spacing-md;
  padding: $spacing-md;
  border-radius: $radius-lg;
  
  &.unread {
    border-left: 4rpx solid $primary-color;
    background: linear-gradient(90deg, rgba($primary-color, 0.03) 0%, $bg-card 100%);
  }
  
  &:active {
    background-color: rgba($primary-color, 0.05);
    transform: scale(0.98);
    transition: all 0.15s ease;
  }
}

.item-left {
  margin-right: $spacing-md;
}

.item-avatar-container {
  position: relative;
}

.item-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
}

.item-badge {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background-color: $accent-red;
  border: 3rpx solid #fff;
}

.item-content {
  flex: 1;
  min-height: 80rpx;
  @include flex(column, center, flex-start);
}

.content-header {
  @include flex(row, space-between, center);
  width: 100%;
  margin-bottom: $spacing-xs;
}

.content-left {
  @include flex(row, flex-start, center);
  flex: 1;
  gap: $spacing-xs;
}

.content-username {
  font-size: $font-size-md;
  font-weight: bold;
  color: $text-primary;
}

.system-type-tag {
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  margin-left: $spacing-xs;
  /* 背景色和文字颜色通过内联样式动态设置 */
}

.system-type-text {
  font-size: 20rpx;
  font-weight: 500;
  line-height: 1;
  /* 文字颜色通过内联样式动态设置 */
}

.content-time {
  font-size: $font-size-sm;
  color: $primary-color;
  white-space: nowrap;
  background-color: rgba($primary-color, 0.1);
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  font-weight: 500;
}

.content-title {
  width: 100%;
  margin-bottom: $spacing-xs;
}

.content-title-text {
  font-size: $font-size-md;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.4;
}

.content-body {
  width: 100%;
  margin-bottom: $spacing-xs;
}

.content-text {
  font-size: $font-size-sm;
  color: $text-secondary;
  line-height: 1.5;
}

.content-post {
  width: 100%;
  padding: $spacing-sm;
  background-color: rgba($primary-color, 0.05);
  border-radius: $radius-md;
  border: 2rpx solid rgba($primary-color, 0.1);
  
  &:active {
    background-color: rgba($primary-color, 0.08);
    border-color: rgba($primary-color, 0.2);
  }
}

.post-preview-text {
  font-size: $font-size-sm;
  color: $primary-color;
  font-weight: 500;
}

.detail-loading {
  @include flex(row, center, center);
  padding: $spacing-md;
}

.loading-text {
  font-size: $font-size-sm;
  color: $text-tertiary;
}

.detail-no-more {
  @include flex(row, center, center);
  padding: $spacing-md;
}

.no-more-text {
  font-size: $font-size-sm;
  color: $text-tertiary;
  opacity: 0.6;
}

</style>
                  
