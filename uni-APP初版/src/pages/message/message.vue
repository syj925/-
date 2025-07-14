<template>
  <view class="message-container">
    <!-- 顶部标题栏 -->
    <view class="message-header">
      <text class="message-title">消息中心</text>
      <view class="header-actions">
        <text class="action-btn" @tap="markAllAsRead">全部已读</text>
        <text class="action-btn" @tap="deleteAllMessages">清空消息</text>
      </view>
    </view>
    
    <!-- 分类标签栏 -->
    <view class="message-tabs">
      <view 
        v-for="(tab, index) in tabs" 
        :key="index" 
        class="tab-item" 
        :class="{ 'active-tab': currentTab === index }"
        @tap="switchTab(index)"
      >
        <text class="tab-text">{{ tab.name }}</text>
        <text class="badge" v-if="tab.unread > 0">{{ tab.unread }}</text>
      </view>
    </view>
    
    <!-- 消息列表区域 -->
    <scroll-view 
      scroll-y="true" 
      class="message-list-scroll"
      @scrolltolower="loadMoreMessages"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 消息为空的状态 -->
      <view class="empty-state" v-if="messages.length === 0">
        <image class="empty-icon" :src="getImage('/static/images/empty-message.png')" mode="aspectFit"></image>
        <text class="empty-text">{{ emptyText }}</text>
      </view>
      
      <!-- 消息列表 -->
      <view class="message-list" v-else>
        <view 
          class="message-item" 
          v-for="(item, index) in messages" 
          :key="index"
          :class="{ 'unread': !item.isRead }"
          @tap="viewMessageDetail(item)"
        >
          <!-- 头像和红点 -->
          <view class="avatar-container">
            <image class="avatar" :src="item.senderAvatar || getImage('/static/icons/xttz.png')" mode="aspectFill"></image>
            <view class="red-dot" v-if="!item.isRead"></view>
          </view>
          
          <!-- 消息内容区 -->
          <view class="content">
            <view class="message-top">
              <view class="sender-info">
                <text class="sender-name">{{ item.sender }}</text>
                <text class="message-time">{{ item.time }}</text>
              </view>
            </view>
            
            <!-- 消息标签和内容 -->
            <view class="message-body">
              <text class="message-tag" v-if="item.type !== 'system'">{{ getMessageTypeText(item.type) }}</text>
              <text class="message-system-tag" v-else>{{ getMessageTypeText(item.actualType || item.type) }}</text>
            </view>
            
            <text class="message-text" v-if="item.type === 'comment'">回复了你的帖子：</text>
            <text class="message-text" v-else-if="item.type === 'like'">赞了你的帖子</text>
            
            <!-- 引用原内容 -->
            <view class="quote-content" v-if="item.originalContent">
              {{ item.originalContent }}
            </view>
            
            <!-- 操作按钮 -->
            <view class="action-buttons">
              <view class="reply-btn" v-if="item.canReply" @tap.stop="replyMessage(item)">回复</view>
              <view class="delete-btn" @tap.stop="deleteMessage(index)">删除</view>
            </view>
          </view>
        </view>
        
        <!-- 加载更多状态 -->
        <view class="loading-more" v-if="loading">
          <text>加载中...</text>
        </view>
        
        <!-- 没有更多数据提示 -->
        <view class="no-more" v-if="noMoreData">
          <text>— 没有更多消息了 —</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import api from '../../utils/api.js';
import { getImage } from '@/utils/imagePathHelper'; // 导入图片路径辅助工具

export default {
  data() {
    return {
      refreshing: false,
      loading: false,
      noMoreData: false,
      currentTab: 0,
      tabs: [
        { name: '全部', unread: 0 },
        { name: '评论', unread: 0 },
        { name: '点赞', unread: 0 },
        { name: '系统', unread: 0 },
        { name: '@我', unread: 0 }
      ],
      messages: [],
      page: 1,
      pageSize: 10,
      hasMore: true,
      emptyTexts: {
        all: '暂无任何消息',
        system: '暂无系统消息',
        like: '暂无点赞消息',
        comment: '暂无评论消息',
        follow: '暂无关注消息'
      }
    }
  },
  computed: {
    emptyText() {
      const types = ['all', 'system', 'like', 'comment', 'follow'];
      return this.emptyTexts[types[this.currentTab]] || '暂无消息';
    }
  },
  onLoad() {
    uni.$emit('tabChange', 3); // 通知tabBar更新当前选中标签
    // 加载消息数据和未读消息数
    this.loadMessages();
    this.fetchUnreadCount();
  },
  methods: {
    // 提供getImage方法给模板使用
    getImage,
    
    // 切换消息标签
    switchTab(index) {
      if (this.currentTab === index) return;
      this.currentTab = index;
      this.messages = []; // 清空当前消息
      this.noMoreData = false; // 重置加载状态
      this.page = 1; // 重置页码
      this.loadMessages(); // 加载对应标签的消息
    },
    
    // 获取当前tab对应的消息类型
    getTabType() {
      const currentTab = this.tabs[this.currentTab];
      if (!currentTab) return 'all';
      
      const typeMap = {
        '全部': 'all',
        '系统': 'system',
        '@我': 'mention',
        '评论': 'comment',
        '点赞': 'like'
      };
      
      return typeMap[currentTab.name] || 'all';
    },
    
    // 加载消息列表
    loadMessages() {
      this.loading = true;
      
      const params = {
        page: this.page,
        limit: this.pageSize,
        type: this.getTabType()
      };
      
      // 如果是全部消息，不传type参数
      if (params.type === 'all') {
        delete params.type;
      }
      
      api.messages.getList(params)
        .then(res => {
          if (res.success) {
            // 转换消息数据格式
            const formattedMessages = res.data.messages.map(message => {
              // 格式化时间
              const messageTime = this.formatTime(message.created_at || message.createdAt);
              
              // 处理消息数据（解析JSON字符串）
              let messageData = {};
              try {
                messageData = message.data ? (typeof message.data === 'string' ? JSON.parse(message.data) : message.data) : {};
              } catch (e) {
                console.error('解析消息数据失败:', e);
                messageData = {};
              }
              
              // 过滤掉已删除的系统通知
              if (message.type === 'system' && messageData.notification_id) {
                // 检查是否有效的通知ID
                if (!messageData.notification_id) {
                  return null;
                }
              }

              // 基本消息结构
              return {
                id: message.id,
                type: message.type,
                sender: this.getSenderName(message),
                senderAvatar: this.getSenderAvatar(message),
                title: this.getMessageTitle(message, messageData),
                preview: this.getMessagePreview(message, messageData),
                time: messageTime,
                isRead: !!message.is_read,
                data: messageData,
                postId: messageData.post_id || null,
                canReply: message.type === 'comment' && message.postId,
                actualType: (messageData && messageData.notification_type) ? messageData.notification_type : message.type
              };
            }).filter(msg => msg !== null); // 过滤掉无效消息
            
            // 更新消息列表
            if (this.page === 1) {
              this.messages = formattedMessages;
            } else {
              this.messages = [...this.messages, ...formattedMessages];
            }
            
            // 检查是否有更多数据
            this.hasMore = formattedMessages.length === this.pageSize;
            
            // 更新未读消息数
            if (res.data.unreadCount) {
              this.updateTabsUnreadCount(res.data.unreadCount);
            }
            
            console.log('消息加载成功:', this.messages);
          } else {
            uni.showToast({
              title: res.message || '获取消息失败',
              icon: 'none'
            });
          }
        })
        .catch(err => {
          uni.showToast({
            title: '获取消息失败，请稍后再试',
            icon: 'none'
          });
          console.error('获取消息列表失败:', err);
        })
        .finally(() => {
          this.loading = false;
          this.refreshing = false;
        });
    },
    
    // 加载更多消息
    loadMoreMessages() {
      if (this.loading || this.noMoreData) return;
      
      this.page++;
      this.loadMessages();
    },
    
    // 下拉刷新
    onRefresh() {
      this.refreshing = true;
      this.page = 1;
      this.noMoreData = false;
      this.loadMessages();
      this.fetchUnreadCount();
    },
    
    // 获取未读消息数
    fetchUnreadCount() {
      api.messages.getUnreadCount()
        .then(res => {
          if (res.success) {
            this.updateTabsUnreadCount(res.data);
          }
        })
        .catch(err => {
          console.error('获取未读消息数失败:', err);
        });
    },
    
    // 更新标签未读数
    updateTabsUnreadCount(unreadCount) {
      if (!unreadCount) return;
      
      this.tabs[0].unread = unreadCount.total || 0;
      this.tabs[1].unread = unreadCount.comment || 0;
      this.tabs[2].unread = unreadCount.like || 0;
      this.tabs[3].unread = unreadCount.system || 0;
      this.tabs[4].unread = unreadCount.mention || 0;
    },
    
    // 根据消息类型获取显示文本
    getMessageTypeText(type) {
      // 先处理基础类型
      const baseTypeMap = {
        'system': '系统通知',
        'comment': '评论',
        'like': '点赞',
        'mention': '@提及'
      };
      
      // 处理管理后台创建的通知类型
      const adminTypeMap = {
        'announcement': '公告',
        'event': '活动',
        'reminder': '提醒',
        'warning': '警告',
        'other': '其他'
      };
      
      // 先尝试基础类型，再尝试管理后台类型
      return baseTypeMap[type] || adminTypeMap[type] || '通知';
    },
    
    // 获取发送者名称
    getSenderName(message) {
      if (message.type === 'system' || message.type === 'announcement') {
        return '系统通知';
      } else if (message.sender_name) {
        return message.sender_name;
      } else if (message.sender_id && message.sender_info) {
        const senderInfo = typeof message.sender_info === 'string' ? JSON.parse(message.sender_info) : message.sender_info;
        return senderInfo.nickname || senderInfo.username || `用户${message.sender_id}`;
      }
      return '未知用户';
    },
    
    // 获取发送者头像
    getSenderAvatar(message) {
      if (message.type === 'system' || message.type === 'announcement') {
        return getImage('/static/icons/xttz.png');
      } else if (message.sender_avatar) {
        return message.sender_avatar;
      } else if (message.sender_info) {
        const senderInfo = typeof message.sender_info === 'string' ? JSON.parse(message.sender_info) : message.sender_info;
        return senderInfo.avatar || '';
      }
      return '';
    },
    
    // 获取消息标题
    getMessageTitle(message, data) {
      if (message.title) {
        return message.title;
      }
      
      switch (message.type) {
        case 'like':
          return '收到新的点赞';
        case 'comment':
          return '收到新的评论';
        case 'follow':
          return '有新的关注者';
        case 'system':
          return data.title || '系统通知';
        default:
          return '新消息';
      }
    },
    
    // 获取消息预览
    getMessagePreview(message, data) {
      if (message.content) {
        return message.content;
      }
      
      switch (message.type) {
        case 'like':
          return data.content || '有人点赞了你的内容';
        case 'comment':
          return data.content || '有人评论了你的内容';
        case 'follow':
          return '有新用户关注了你';
        case 'system':
          return data.content || '';
        default:
          return '';
      }
    },
    
    // 查看消息详情
    viewMessageDetail(message) {
      console.log('查看消息详情:', message);
      
      // 标记为已读
      if (!message.isRead) {
        this.markMessageAsRead(message.id);
      }
      
      // 跳转到消息详情页或相关帖子
      if (message.postId) {
        uni.navigateTo({
          url: `/pages/post-detail/post-detail?id=${message.postId}`
        });
      } else if (message.type === 'system') {
        // 系统通知，需要检查通知是否存在
        if (message.data && message.data.notification_id) {
          uni.navigateTo({
            url: `/pages/message/message-detail?id=${message.id}`
          });
        } else {
          // 通知可能已被删除
          uni.showToast({
            title: '该通知不存在或已被删除',
            icon: 'none'
          });
        }
      } else {
        uni.navigateTo({
          url: `/pages/message/message-detail?id=${message.id}`
        });
      }
    },
    
    // 标记消息为已读
    markMessageAsRead(id) {
      api.messages.markAsRead(id)
        .then(res => {
          if (res.success) {
            // 更新本地消息状态
            const message = this.messages.find(msg => msg.id === id);
            if (message) {
              message.isRead = true;
            }
            
            // 重新获取未读消息数
            this.fetchUnreadCount();
          }
        })
        .catch(err => {
          console.error('标记消息已读失败:', err);
        });
    },
    
    // 回复消息
    replyMessage(message) {
      uni.navigateTo({
        url: `/pages/post-detail/post-detail?id=${message.postId}&reply=1`
      });
    },
    
    // 删除消息
    deleteMessage(index) {
      const message = this.messages[index];
      
      uni.showModal({
        title: '删除消息',
        content: '确定要删除这条消息吗？',
        success: (res) => {
          if (res.confirm) {
            api.messages.delete(message.id)
              .then(res => {
                if (res.success) {
                  // 从列表中移除
                  this.messages.splice(index, 1);
                  
                  // 如果消息未读，重新获取未读消息数
                  if (!message.isRead) {
                    this.fetchUnreadCount();
                  }
                  
                  uni.showToast({
                    title: '删除成功',
                    icon: 'success'
                  });
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
    
    // 标记所有消息为已读
    markAllAsRead() {
      if (this.messages.length === 0) {
        uni.showToast({
          title: '没有消息需要标记',
          icon: 'none'
        });
        return;
      }
      
      uni.showModal({
        title: '标记全部已读',
        content: '确定要将所有消息标记为已读吗？',
        success: (res) => {
          if (res.confirm) {
            // 获取当前分类
            const type = this.getTabType();
            const params = type !== 'all' ? { type } : {};
            
            api.messages.markAllAsRead(params)
              .then(res => {
                if (res.success) {
                  // 更新本地消息状态
                  this.messages.forEach(msg => {
                    msg.isRead = true;
                  });
                  
                  // 更新未读消息数
                  this.fetchUnreadCount();
                  
                  uni.showToast({
                    title: '已标记全部已读',
                    icon: 'success'
                  });
                } else {
                  uni.showToast({
                    title: res.message || '操作失败',
                    icon: 'none'
                  });
                }
              })
              .catch(err => {
                console.error('标记全部已读失败:', err);
                uni.showToast({
                  title: '操作失败，请稍后再试',
                  icon: 'none'
                });
              });
          }
        }
      });
    },
    
    // 清空所有消息
    deleteAllMessages() {
      if (this.messages.length === 0) {
        uni.showToast({
          title: '没有消息需要清空',
          icon: 'none'
        });
        return;
      }
      
      uni.showModal({
        title: '清空全部消息',
        content: '确定要清空全部消息吗？此操作不可恢复！',
        success: (res) => {
          if (res.confirm) {
            // 获取当前分类
            const type = this.getTabType();
            const params = type !== 'all' ? { type } : {};
            
            api.messages.deleteAll(params)
              .then(res => {
                if (res.success) {
                  // 清空本地消息
                  this.messages = [];
                  
                  // 更新未读消息数
                  this.fetchUnreadCount();
                  
                  uni.showToast({
                    title: '已清空消息',
                    icon: 'success'
                  });
                } else {
                  uni.showToast({
                    title: res.message || '操作失败',
                    icon: 'none'
                  });
                }
              })
              .catch(err => {
                console.error('清空消息失败:', err);
                uni.showToast({
                  title: '操作失败，请稍后再试',
                  icon: 'none'
                });
              });
          }
        }
      });
    },
    
    // 预览图片
    previewImage(image) {
      uni.previewImage({
        urls: [image],
        current: image
      });
    },
    
    // 格式化时间
    formatTime(timeStr) {
      if (!timeStr) return '';
      
      const date = new Date(timeStr);
      const now = new Date();
      const diff = now - date; // 时间差（毫秒）
      
      // 小于1分钟显示"刚刚"
      if (diff < 60 * 1000) {
        return '刚刚';
      }
      
      // 小于1小时显示"xx分钟前"
      if (diff < 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 1000)) + '分钟前';
      }
      
      // 小于24小时显示"xx小时前"
      if (diff < 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
      }
      
      // 小于7天显示"x天前"
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前';
      }
      
      // 其它显示年月日
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    }
  }
}
</script>

<style>
.message-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fc;
  padding-bottom: 50px;
}

/* 顶部标题栏 */
.message-header {
  padding: 15px 20px;
  background: linear-gradient(135deg, #619cf7, #78A5F3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #FFFFFF;
  box-shadow: 0 3px 12px rgba(74, 144, 226, 0.15);
  height: 44px;
  position: relative;
  z-index: 10;
}

.message-header::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  right: 0;
  height: 15px;
  background: linear-gradient(to bottom, rgba(97, 156, 247, 0.1), transparent);
  z-index: -1;
}

.message-title {
  font-size: 18px;
  font-weight: 600;
  color: #FFFFFF;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.header-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  padding: 6px 14px;
  color: #FFFFFF;
  font-size: 13px;
  margin-left: 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  transition: all 0.25s ease;
  backdrop-filter: blur(5px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.07);
}

.action-btn:active {
  transform: scale(0.95);
  background-color: rgba(255, 255, 255, 0.3);
}

/* 分类标签栏 */
.message-tabs {
  display: flex;
  background-color: #FFFFFF;
  padding: 3px 0;
  margin: 12px 15px 5px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 1;
  height: 44px;
}

.tab-item {
  flex: 1;
  padding: 0;
  height: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}

.tab-item::after {
  content: '';
  position: absolute;
  right: 0;
  top: 12px;
  height: 20px;
  width: 1px;
  background-color: #f0f0f0;
  opacity: 0.8;
}

.tab-item:last-child::after {
  display: none;
}

.tab-text {
  color: #8a96a8;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.25s ease;
}

.active-tab .tab-text {
  color: #619cf7;
  font-weight: 600;
}

.active-tab::before {
  content: '';
  position: absolute;
  bottom: 6px;
  width: 20px;
  height: 3px;
  background-color: #619cf7;
  border-radius: 3px;
  animation: slideIn 0.3s ease forwards;
  box-shadow: 0 2px 4px rgba(97, 156, 247, 0.2);
}

@keyframes slideIn {
  from { width: 0; opacity: 0; }
  to { width: 20px; opacity: 1; }
}

.badge {
  position: absolute;
  top: 3px;
  right: calc(50% - 22px);
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background-color: #FF4757;
  color: #FFFFFF;
  font-size: 10px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(255, 71, 87, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.4); }
  70% { box-shadow: 0 0 0 5px rgba(255, 71, 87, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0); }
}

/* 消息列表区域 */
.message-list-scroll {
  flex: 1;
  height: calc(100vh - 88px - 50px);
}

.message-list {
  padding: 5px 15px 15px;
}

/* 消息项样式 */
.message-item {
  background-color: #FFFFFF;
  padding: 14px 16px;
  margin-bottom: 12px;
  border-radius: 16px;
  display: flex;
  position: relative;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.message-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  pointer-events: none;
}

.message-item:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  background-color: #fafbff;
}

.message-item.unread {
  border-left: 3px solid #619cf7;
  background-color: #fcfdff;
}

.avatar-container {
  position: relative;
  margin-right: 12px;
  flex-shrink: 0;
  width: 46px;
}

.avatar {
  width: 46px;
  height: 46px;
  border-radius: 23px;
  flex-shrink: 0;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  object-fit: cover;
}

.red-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  background-color: #FF4757;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(255, 71, 87, 0.3);
}

.content {
  flex: 1;
  overflow: hidden;
}

.message-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
  align-items: flex-start;
}

.sender-info {
  display: flex;
  align-items: center;
}

.sender-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-right: 6px;
}

.message-time {
  font-size: 12px;
  color: #a0a8b3;
  background-color: rgba(0, 0, 0, 0.02);
  padding: 2px 8px;
  border-radius: 10px;
}

.message-body {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 5px;
}

.message-tag {
  background-color: rgba(97, 156, 247, 0.08);
  color: #619cf7;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 20px;
  margin-right: 5px;
  font-weight: 500;
  display: inline-block;
}

.message-system-tag {
  background-color: rgba(255, 191, 0, 0.08);
  color: #ffbf00;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 20px;
  margin-right: 5px;
  font-weight: 500;
  display: inline-block;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
  color: #444;
  margin: 4px 0;
}

.quote-content {
  background-color: #f8f9fc;
  padding: 8px 12px;
  border-radius: 10px;
  margin-top: 5px;
  font-size: 13px;
  color: #5f6b7c;
  border-left: 3px solid #e8eaed;
  position: relative;
  box-sizing: border-box;
}

.quote-content::before {
  content: '"';
  position: absolute;
  left: 7px;
  top: 0;
  font-size: 24px;
  color: #e8eaed;
  opacity: 0.6;
}

.action-buttons {
  display: flex;
  margin-top: 6px;
}

.reply-btn, .delete-btn {
  padding: 4px 12px;
  margin-right: 8px;
  border-radius: 20px;
  font-size: 12px;
  text-align: center;
  transition: all 0.2s ease;
  min-width: 36px;
}

.reply-btn {
  background-color: rgba(97, 156, 247, 0.08);
  color: #619cf7;
  border: 1px solid rgba(97, 156, 247, 0.15);
}

.reply-btn:active {
  transform: scale(0.95);
  background-color: rgba(97, 156, 247, 0.12);
}

.delete-btn {
  background-color: rgba(255, 71, 87, 0.08);
  color: #ff4757;
  border: 1px solid rgba(255, 71, 87, 0.15);
}

.delete-btn:active {
  transform: scale(0.95);
  background-color: rgba(255, 71, 87, 0.12);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.empty-icon {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  opacity: 0.7;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.empty-text {
  font-size: 15px;
  color: #8a96a8;
  background-color: rgba(0, 0, 0, 0.02);
  padding: 8px 20px;
  border-radius: 20px;
}

/* 加载状态 */
.loading-more, .no-more {
  text-align: center;
  padding: 15px 0;
  font-size: 12px;
  color: #8a96a8;
  position: relative;
}

.loading-more::before, .loading-more::after,
.no-more::before, .no-more::after {
  content: '';
  position: absolute;
  top: 50%;
  height: 1px;
  width: 30%;
  background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.05));
}

.loading-more::before, .no-more::before {
  left: 10%;
}

.loading-more::after, .no-more::after {
  right: 10%;
  background: linear-gradient(to left, transparent, rgba(0, 0, 0, 0.05));
}
</style> 