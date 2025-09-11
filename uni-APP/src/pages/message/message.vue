<template>
  <view class="message-page">
    <!-- 自定义标题栏 -->
    <view class="custom-header">
      <text class="header-title">消息</text>
    </view>
    
    <view class="message-tabs">
      <view 
        class="message-tab" 
        :class="{ active: activeTab === 'notify' }"
        @tap="switchTab('notify')"
      >
        通知
        <view v-if="notifyUnreadCount > 0" class="message-tab-badge">{{ notifyUnreadCount > 99 ? '99+' : notifyUnreadCount }}</view>
      </view>
      <view 
        class="message-tab" 
        :class="{ active: activeTab === 'chat' }"
        @tap="switchTab('chat')"
      >
        私信
        <view v-if="chatUnreadCount > 0" class="message-tab-badge">{{ chatUnreadCount > 99 ? '99+' : chatUnreadCount }}</view>
      </view>
    </view>
    
    <swiper 
      class="message-swiper" 
      :current="activeTab === 'notify' ? 0 : 1" 
      @change="handleSwiperChange"
    >
      <!-- 通知列表 -->
      <swiper-item>
        <scroll-view 
          scroll-y 
          class="message-scroll"
        >
          <view class="message-categories">
            <!-- 通知类型列表 -->
            <view 
              v-for="category in messageCategories" 
              :key="category.type"
              class="category-item"
              :class="{ 'has-new-message': isCategoryJustUpdated(category.type) }"
              @tap="handleCategoryClick(category)"
            >
              <view class="category-left">
                <!-- 类型图标 -->
                <view class="category-icon">
                  <image class="category-icon-image" :src="category.icon" mode="aspectFit"></image>
                  <view 
                    v-if="category.unreadCount > 0" 
                    class="category-badge"
                    :class="{ 'badge-updated': isCategoryJustUpdated(category.type) }"
                  >
                    {{ category.unreadCount > 99 ? '99+' : category.unreadCount }}
                  </view>
                </view>
              </view>
              
              <view class="category-content">
                <view class="category-header">
                  <text class="category-title">{{ category.name }}</text>
                  <text class="category-time" v-if="category.latestTime">{{ category.latestTime }}</text>
              </view>
              
                <view class="category-preview" v-if="category.preview">
                  <rich-text class="category-preview-text" :nodes="category.preview"></rich-text>
              </view>
                <view class="category-empty" v-else>
                  <text class="category-empty-text">暂无{{ category.name }}</text>
            </view>
          </view>
          
              <view class="category-right">
                <view class="category-arrow">›</view>
          </view>
            </view>
          </view>
        </scroll-view>
      </swiper-item>
      
      <!-- 私信列表 -->
      <swiper-item>
        <scroll-view 
          scroll-y 
          class="message-scroll"
        >
          <view class="message-list">
            <view 
              v-for="(item, index) in chatList" 
              :key="index"
              class="message-item"
              @tap="handleChatClick(item)"
            >
              <view class="message-avatar-container">
                <image class="message-avatar" :src="item.avatar" mode="aspectFill"></image>
                <view 
                  v-if="item.unreadCount > 0" 
                  class="message-count-badge"
                >
                  {{ item.unreadCount > 99 ? '99+' : item.unreadCount }}
                </view>
              </view>
              
              <view class="message-content">
                <view class="message-title">{{ item.nickname }}</view>
                <view class="message-desc">{{ item.lastMessage }}</view>
              </view>
              
              <view class="message-right">
                <text class="message-time">{{ formatTime(item.lastMessageTime) }}</text>
              </view>
            </view>
          </view>
          
          <!-- 加载状态 -->
          <view class="message-loading" v-if="chatLoading">
            <text class="message-loading-text">加载中...</text>
          </view>
          
          <!-- 空状态 -->
          <view class="message-empty" v-if="!chatList.length && !chatLoading">
            <image class="message-empty-icon" src="/static/images/common/empty.png"></image>
            <text class="message-empty-text">暂无私信</text>
          </view>
        </scroll-view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script>
import { useMessageStore } from '@/store';
import { getBestServer } from '@/config/index.js';

export default {
  data() {
    return {
      activeTab: 'notify',
      notifyList: [],
      chatList: [],
      notifyLoading: false,
      chatLoading: false,
      // 通知分页参数
      currentPage: 1,
      pageSize: 20,
      hasMore: true,
      // 私信分页参数
      chatCurrentPage: 1,
      chatPageSize: 20,
      chatHasMore: true,
      updatedCategories: new Set(), // 记录刚更新的分类（用于动画）
      lastUpdateTime: Date.now(), // 最后更新时间（用于动画控制）
      messageReceivedHandler: null, // 事件处理器引用
      conversationReadHandler: null // 对话已读事件处理器引用
    };
  },
  
  computed: {
    unreadCount() {
      return this.messageStore.unreadCount;
    },

    // 通知类型的未读数量（不包括私信）
    notifyUnreadCount() {
      if (!this.notifyList || this.notifyList.length === 0) {
        return 0;
      }
      return this.notifyList.filter(msg => !msg.is_read).length;
    },

    // 私信类型的未读数量
    chatUnreadCount() {
      if (!this.chatList || this.chatList.length === 0) {
        return 0;
      }
      return this.chatList.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
    },


    // 消息类型汇总
    messageCategories() {
      const categories = [
        { type: 'follow', name: '关注通知', icon: '/static/images/message/follow.svg' },
        { type: 'like', name: '点赞通知', icon: '/static/images/message/like.svg' },
        { type: 'comment', name: '评论通知', icon: '/static/images/message/comment.svg' },
        { type: 'reply', name: '回复通知', icon: '/static/images/message/reply.svg' },
        { type: 'favorite', name: '收藏通知', icon: '/static/images/message/favorite.svg' },
        { type: 'mention', name: '提及通知', icon: '/static/images/message/mention.svg' },
        { type: 'system', name: '系统通知', icon: '/static/images/message/system.svg' }
      ];

      if (!this.notifyList || this.notifyList.length === 0) {
        return categories.map(cat => ({
          ...cat,
          unreadCount: 0,
          totalCount: 0,
          preview: null,
          latestTime: null
        }));
      }

      // 统计各类型的消息
      const typeStats = this.groupMessagesByType(this.notifyList);

      return categories.map(cat => {
        const stats = typeStats[cat.type] || { messages: [], unreadCount: 0 };
        const latestMessage = stats.messages[0]; // 最新的消息
        
        return {
          ...cat,
          unreadCount: stats.unreadCount,
          totalCount: stats.messages.length,
          preview: latestMessage ? this.generatePreview(latestMessage, stats.messages.length) : null,
          latestTime: latestMessage ? this.formatTime(latestMessage.createdAt || latestMessage.created_at) : null
        };
      }); // 所有通知类型常驻显示
    }
  },
  
  created() {
    this.messageStore = useMessageStore();
  },
  

  // 页面显示时刷新数据
  onShow() {
    console.log('📱 [消息页面] onShow - 刷新数据');
    // 从详情页返回时，重新加载数据以显示最新状态
    this.loadNotifyData();
    // 同时刷新私信数据（如果在私信标签）
    if (this.activeTab === 'chat') {
      this.loadChatData();
    }
    // 确保 TabBar 计数是最新的（包含系统通知）
    this.messageStore.fetchUnreadCount();
  },

  // uni-app全局事件监听
  onLoad() {
    // 确保正确绑定this上下文
    this.messageReceivedHandler = (eventData) => {
      this.handleNewMessage(eventData);
    };
    
    // 监听全局消息事件
    uni.$on('messageReceived', this.messageReceivedHandler);
    
    // 监听对话标记已读事件
    this.conversationReadHandler = (eventData) => {
      this.handleConversationMarkedAsRead(eventData);
    };
    uni.$on('conversationMarkedAsRead', this.conversationReadHandler);
    
    // 加载通知和私信数据
    this.loadNotifyData();
    this.loadChatData();
    
    // 获取未读消息数量（使用store）
    this.messageStore.fetchUnreadCount();
  },

  onUnload() {
    // 移除事件监听
    if (this.messageReceivedHandler) {
      uni.$off('messageReceived', this.messageReceivedHandler);
    }
    if (this.conversationReadHandler) {
      uni.$off('conversationMarkedAsRead', this.conversationReadHandler);
    }
  },

  // 页面级下拉刷新已移除，使用scroll-view的下拉刷新
  methods: {
    // 标准化图片URL（使用配置的服务器地址）
    normalizeImageUrl(imageUrl) {
      if (!imageUrl || imageUrl.startsWith('/static/') || imageUrl.startsWith('data:')) {
        return imageUrl;
      }
      
      // 获取当前配置的服务器地址
      const currentServer = getBestServer();
      
      // 如果图片URL已经是完整的HTTP URL，替换为当前服务器
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        // 提取路径部分（从/uploads开始）
        const pathMatch = imageUrl.match(/(\/uploads\/.+)$/);
        if (pathMatch) {
          return `${currentServer}${pathMatch[1]}`;
        }
      }
      
      // 如果只是路径，直接拼接当前服务器
      if (imageUrl.startsWith('/')) {
        return `${currentServer}${imageUrl}`;
      }
      
      // 其他情况直接返回
      return imageUrl;
    },
    
    // 处理全局新消息事件
    handleNewMessage(eventData) {
      console.log('📱 消息页面收到全局事件:', eventData);
      const message = eventData.message;
      
      if (message) {
        if (message.type === 'private') {
          console.log('🔄 刷新私信列表');
          this.loadChatData();
        } else {
          console.log('🚀 智能增量更新通知列表');
          this.smartUpdateNotifyList(message);
          
          // 特别处理系统通知：确保 TabBar 计数更新
          if (message.type === 'system') {
            console.log('🔔 收到系统通知，刷新全局未读计数');
            this.messageStore.fetchUnreadCount();
          }
        }
      }
    },
    
    // 处理对话标记为已读事件
    handleConversationMarkedAsRead(eventData) {
      console.log('📖 [消息页面] 对话标记为已读:', eventData);
      const { userId, updatedCount } = eventData;
      
      if (updatedCount > 0) {
        // 找到对应的对话并更新未读计数
        const conversationIndex = this.chatList.findIndex(chat => chat.id === userId);
        if (conversationIndex >= 0) {
          // 减少该对话的未读计数
          const conversation = this.chatList[conversationIndex];
          const newUnreadCount = Math.max(0, (conversation.unreadCount || 0) - updatedCount);
          
          // 更新未读计数
          this.$set(this.chatList, conversationIndex, {
            ...conversation,
            unreadCount: newUnreadCount
          });
          
          console.log(`✅ [消息页面] 对话 ${userId} 未读计数从 ${conversation.unreadCount || 0} 减少到 ${newUnreadCount}`);
          
          // 触发全局未读计数更新
          this.messageStore.fetchUnreadCount();
        }
      }
    },

    // 智能增量更新通知列表（避免跳动）
    async smartUpdateNotifyList(newMessage) {
      try {
        console.log('🎯 开始智能增量更新:', newMessage);
        
        // 检查是否已经存在该消息（避免重复）
        const existingIndex = this.notifyList.findIndex(item => 
          item.id === newMessage.id || 
          (item.sender_id === newMessage.sender_id && 
           item.type === newMessage.type && 
           Math.abs(new Date(item.created_at) - new Date(newMessage.created_at)) < 1000)
        );
        
        if (existingIndex >= 0) {
          console.log('💡 消息已存在，跳过添加');
          return;
        }
        
        // 格式化新消息
        const formattedMessage = this.formatMessage(newMessage);
        
        // 平滑插入到列表顶部
        this.notifyList.unshift(formattedMessage);
        
        // 🎨 触发分类卡片动画效果
        this.triggerCategoryAnimation(newMessage.type);
        
        console.log('✨ 新消息已平滑添加，分类动画已触发');
        
        // 特别处理系统通知：强制更新页面显示
        if (newMessage.type === 'system') {
          console.log('🔔 系统通知已添加，强制刷新页面显示');
          // 触发响应式更新
          this.$forceUpdate();
        }
        
      } catch (error) {
        console.error('❌ 智能更新失败，回退到全量刷新:', error);
        // 回退到传统刷新方式
        this.loadNotifyData(true);
      }
    },

    // 🎨 触发分类卡片动画
    triggerCategoryAnimation(messageType) {
      // 记录更新的分类
      this.updatedCategories.add(messageType);
      this.lastUpdateTime = Date.now();
      
      // 短暂延迟后清除动画标记
      setTimeout(() => {
        this.updatedCategories.delete(messageType);
      }, 600); // 与CSS动画时长保持一致
    },

    // 检查分类是否刚刚更新（用于应用动画类）
    isCategoryJustUpdated(categoryType) {
      return this.updatedCategories.has(categoryType);
    },

    // 格式化单个消息
    formatMessage(message) {
      // 使用后端返回的头像，如果没有则使用系统默认头像（数据URI）
      const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGNUY1RjUiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzlFOUU5RSIvPgo8cGF0aCBkPSJNOCAzMi41QzggMjguOTE0NiAxMS40MTQ2IDI2IDE1IDI2SDI1QzI4LjU4NTQgMjYgMzIgMjguOTE0NiAzMiAzMi41VjQwSDhWMzIuNVoiIGZpbGw9IiM5RTlFOUUiLz4KPC9zdmc+';
      
      return {
        ...message,
        avatar: message.sender?.avatar ? this.normalizeImageUrl(message.sender.avatar) : defaultAvatar,
        time: this.formatTime(message.createdAt || message.created_at),
        content: this.removeHtmlTags(message.content || ''),
      };
    },

    // 切换标签
    switchTab(tab) {
      if (this.activeTab === tab) return;
      this.activeTab = tab;
    },
    
    // 处理滑动切换
    handleSwiperChange(e) {
      const index = e.detail.current;
      this.activeTab = index === 0 ? 'notify' : 'chat';
    },
    
    // 加载通知数据
    async loadNotifyData(reset = true) {
      if (this.notifyLoading) return;
      
      try {
      this.notifyLoading = true;
      
        if (reset) {
          this.currentPage = 1;
          this.notifyList = [];
        }
        
        const result = await this.$api.message.getList({
          page: this.currentPage,
          pageSize: this.pageSize
        });
        
        if (result.success || result.code === 0) {
          const allMessages = result.data.list || [];
          // 过滤掉私信类型的消息，只保留通知类型
          const notifyMessages = allMessages.filter(msg => msg.type !== 'private');
          const messages = this.formatMessages(notifyMessages);
          
          if (reset) {
            this.notifyList = messages;
          } else {
            this.notifyList = [...this.notifyList, ...messages];
          }
          
          // 计算是否还有更多数据
          const pagination = result.data.pagination;
          if (pagination) {
            // 正确的分页逻辑：检查已加载的总数是否小于总数
            const loadedCount = pagination.page * pagination.pageSize;
            this.hasMore = loadedCount < pagination.total;
            this.currentPage = pagination.page + 1; // 设置下一页页码
            
            console.log(`📊 [通知页面] 分页信息: 当前页=${pagination.page}, 每页=${pagination.pageSize}, 总数=${pagination.total}, 已加载=${loadedCount}, 还有更多=${this.hasMore}`);
          } else {
            this.hasMore = false;
            console.log('⚠️ [通知页面] 后端未返回分页信息，停止加载更多');
          }
        } else {
          this.showError(result.msg || '获取消息失败');
        }
        
      } catch (error) {
        console.error('加载通知失败:', error);
        this.showError('网络连接失败，请稍后重试');
      } finally {
        this.notifyLoading = false;
      }
    },
    
    // 加载私信数据
    async loadChatData(reset = true) {
      if (this.chatLoading) return;
      
      try {
      this.chatLoading = true;
      
        if (reset) {
          this.chatCurrentPage = 1;
          this.chatHasMore = true;
        }
        
        console.log(`🔄 [消息页面] 加载私信对话列表 - 页码:${this.chatCurrentPage}`);
        
        const response = await this.$api.privateMessage.getConversations({
          page: this.chatCurrentPage,
          pageSize: this.chatPageSize
        });
        
        if (response.success && response.data) {
          const conversations = response.data.list || response.data.conversations || response.data || [];
          
          // 转换数据格式适配现有UI
          const formattedConversations = conversations.map(conversation => {
            
            // 处理头像 URL - 使用配置的服务器地址
            let avatarUrl = this.normalizeImageUrl(conversation.user?.avatar || '/static/images/common/avatar.png');
            
            return {
              id: conversation.user?.id || conversation.conversationUserId,
              nickname: conversation.user?.nickname || conversation.user?.username || '未知用户',
              username: conversation.user?.username || '',
              avatar: avatarUrl,
              lastMessage: conversation.lastMessage?.content || '暂无消息',
              lastMessageTime: conversation.lastMessage?.created_at || conversation.lastMessage?.createdAt || new Date().toISOString(),
              unreadCount: conversation.unreadCount || 0
            };
          });
          
          if (reset) {
            this.chatList = formattedConversations;
          } else {
            this.chatList = [...this.chatList, ...formattedConversations];
          }
          
          this.chatHasMore = conversations.length >= this.chatPageSize;
          
          if (conversations.length > 0) {
            this.chatCurrentPage++;
          }
          
          console.log(`✅ [消息页面] 加载了 ${formattedConversations.length} 个私信对话，总共 ${this.chatList.length} 个`);
        }
        
      } catch (error) {
        console.error('❌ [消息页面] 加载私信失败:', error);
        
        // 检查是否是权限相关错误
        if (error.code === 'PRIVATE_MESSAGE_DISABLED') {
          console.log('📝 [消息页面] 私信功能已关闭，显示空列表');
          this.chatList = [];
        } else {
          this.showError('加载私信失败');
        }
      } finally {
        this.chatLoading = false;
      }
    },
    
    // 加载更多通知
    loadMoreNotify() {
      if (this.notifyLoading || !this.hasMore) return;
      
      // 加载下一页
      this.loadNotifyData(false);
    },
    
    // 加载更多私信
    loadMoreChat() {
      if (this.chatLoading || !this.chatHasMore) return;
      
      console.log('🔄 [消息页面] 加载更多私信对话');
      this.loadChatData(false);
    },
    
    // 处理通知点击（在详情页面中使用）
    async handleNotifyClick(item) {
      try {
        // 标记为已读
        if (!item.is_read) {
          await this.markAsRead(item.id);
          item.is_read = true;
          this.messageStore.updateUnreadCount(-1);
        }
      
      // 根据通知类型不同处理
      switch(item.type) {
        case 'like':
        case 'comment':
          case 'reply':
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

    
    // 处理私信点击
    handleChatClick(item) {
      console.log('💬 [消息页面] 打开私信对话:', item);
      
      uni.navigateTo({
        url: `/pages/message/chat?userId=${item.id}&nickname=${encodeURIComponent(item.nickname || '')}&username=${encodeURIComponent(item.username || '')}&avatar=${encodeURIComponent(item.avatar || '')}`
      });
    },



    // 标记消息已读
    async markAsRead(messageId) {
      try {
        const result = await this.$api.message.markAsRead(messageId);
        if (result.success || result.code === 0) {
          return true;
        }
      } catch (error) {
        console.error('标记已读失败:', error);
        throw error;
      }
    },


    // 格式化消息数据
    formatMessages(messages) {
      // 系统默认头像（数据URI）
      const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGNUY1RjUiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzlFOUU5RSIvPgo8cGF0aCBkPSJNOCAzMi41QzggMjguOTE0NiAxMS40MTQ2IDI2IDE1IDI2SDI1QzI4LjU4NTQgMjYgMzIgMjguOTE0NiAzMiAzMi41VjQwSDhWMzIuNVoiIGZpbGw9IiM5RTlFOUUiLz4KPC9zdmc+';
      
      return messages.map(msg => {
        // 格式化时间
        const timeFormatted = this.formatTime(msg.createdAt || msg.created_at);
        
        // 使用后端返回的头像，如果没有则使用默认头像
        const senderAvatar = msg.sender?.avatar ? this.normalizeImageUrl(msg.sender.avatar) : defaultAvatar;
        
        return {
          id: msg.id,
          type: msg.type,
          title: msg.title,
          content: msg.content,
          time: timeFormatted,
          avatar: senderAvatar,
          is_read: !!msg.is_read,
          badge: !msg.is_read,
          post_id: msg.post_id,
          comment_id: msg.comment_id,
          sender: msg.sender,
          sub_type: msg.sub_type, // 添加子类型字段
          created_at: msg.created_at, // 保留原始创建时间用于分组
          receiver_id: msg.receiver_id
        };
      });
    },

    // 格式化时间显示
    formatTime(dateString) {
      if (!dateString) return '';
      
      const now = new Date();
      const date = new Date(dateString);
      const diff = now - date;
      
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (minutes < 1) {
        return '刚刚';
      } else if (minutes < 60) {
        return `${minutes}分钟前`;
      } else if (hours < 24) {
        return `${hours}小时前`;
      } else if (days < 3) {
        return `${days}天前`;
      } else {
        return date.toLocaleDateString('zh-CN', {
          month: 'numeric',
          day: 'numeric'
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

    // 显示错误信息
    showError(message) {
        uni.showToast({
        title: message,
          icon: 'none',
        duration: 2000
      });
    },

    // 按类型分组消息
    groupMessagesByType(messages) {
      const groups = {};
      
      messages.forEach(msg => {
        if (!groups[msg.type]) {
          groups[msg.type] = {
            messages: [],
            unreadCount: 0
          };
        }
        
        groups[msg.type].messages.push(msg);
        if (!msg.is_read) {
          groups[msg.type].unreadCount++;
        }
      });
      
      // 按时间排序每个类型的消息（最新的在前）
      Object.keys(groups).forEach(type => {
        groups[type].messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      });
      
      return groups;
    },

    // 生成消息预览文本
    generatePreview(latestMessage, totalCount) {
      const { type, sender, content } = latestMessage;
      const senderName = this.getSenderName(sender);
      
      // 创建加粗的用户名节点
      const boldUserNode = {
        name: 'span',
        attrs: {
          style: 'font-weight: bold; color: #333;'
        },
        children: [{
          type: 'text',
          text: senderName
        }]
      };
      
      let nodes = [];
      
      switch (type) {
        case 'follow':
          if (totalCount === 1) {
            nodes = [boldUserNode, { type: 'text', text: ' 关注了你' }];
          } else {
            nodes = [boldUserNode, { type: 'text', text: ` 等 ${totalCount} 人关注了你` }];
          }
          break;
        case 'like':
          if (totalCount === 1) {
            nodes = [boldUserNode, { type: 'text', text: ' 点赞了你的帖子' }];
          } else {
            nodes = [boldUserNode, { type: 'text', text: ` 等 ${totalCount} 人点赞了你` }];
          }
          break;
        case 'comment':
          if (totalCount === 1) {
            const previewContent = content && content.length > 15 ? content.substring(0, 15) + '...' : content;
            nodes = [boldUserNode, { type: 'text', text: `：${previewContent}` }];
          } else {
            nodes = [boldUserNode, { type: 'text', text: ` 等 ${totalCount} 人评论了你` }];
          }
          break;
        case 'reply':
          if (totalCount === 1) {
            const previewContent = content && content.length > 10 ? content.substring(0, 10) + '...' : content;
            nodes = [boldUserNode, { type: 'text', text: ` 回复了你：${previewContent}` }];
          } else {
            nodes = [boldUserNode, { type: 'text', text: ` 等 ${totalCount} 人回复了你` }];
          }
          break;
        case 'mention':
          nodes = [boldUserNode, { type: 'text', text: ' 在帖子中提到了你' }];
          break;
        case 'system':
          // 显示系统通知的子类型标签在标题尾部
          const systemTypeText = this.getSystemMessageTypeText(latestMessage);
          
          
          // 只有当类型不是默认的"系统"时，才显示类型标签
          if (systemTypeText !== '系统') {
            const typeStyle = this.getSystemMessageTypeStyle(latestMessage);
            const typeTag = {
              name: 'span',
              attrs: {
                style: `background-color: ${typeStyle.bgColor}; color: ${typeStyle.textColor}; padding: 2rpx 8rpx; border-radius: 8rpx; font-size: 20rpx; margin-left: 8rpx; font-weight: 500;`
              },
              children: [{
                type: 'text',
                text: systemTypeText
              }]
            };
            // 标题在前，类型标签在后
            nodes = [
              { type: 'text', text: latestMessage.title || '系统消息' },
              typeTag
            ];
          } else {
            // 如果是默认的"系统"类型，直接显示标题，不显示类型标签
            nodes = [{ type: 'text', text: latestMessage.title || '系统消息' }];
          }
          break;
        default:
          nodes = [{ type: 'text', text: content || '新消息' }];
      }
      
      return nodes;
    },

    // 处理分类点击
    handleCategoryClick(category) {
      // 跳转到消息详情页面，传递分类类型
      uni.navigateTo({
        url: `/pages/message/detail?type=${category.type}&name=${encodeURIComponent(category.name)}`
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

  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

/* 全局解决 passive event listener 问题 */
* {
  touch-action: manipulation;
}

.message-page {
  height: 100vh;
  background-color: $bg-page;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 禁止页面滚动 */
  touch-action: pan-y; /* 允许垂直滚动，禁止其他触摸操作 */
}

/* 自定义标题栏 */
.custom-header {
  @include flex(row, center, center);
  min-height: 88rpx;
  background-color: $bg-card;
  border-bottom: 1rpx solid rgba($border-color, 0.1);
  flex-shrink: 0; /* 不允许压缩 */
  touch-action: none; /* 禁止所有触摸操作 */
  
  // APP端状态栏和摄像头适配
  /* #ifdef APP-PLUS */
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-top: calc(env(safe-area-inset-top) + 60rpx);
  /* #endif */
}

.header-title {
  font-size: $font-size-xl;
  font-weight: 600;
  color: $text-primary;
}

.message-tabs {
  @include flex(row, center, center);
  background-color: $bg-card;
  padding: $spacing-md 0;
  border-bottom: 1rpx solid rgba($border-color, 0.1);
  flex-shrink: 0; /* 不允许压缩 */
  touch-action: manipulation; /* 允许点击，但禁用双击缩放和其他手势 */
}

.message-tab {
  position: relative;
  font-size: $font-size-md;
  color: $text-tertiary;
  padding: 0 $spacing-xl;
  
  &.active {
    color: $text-primary;
    font-weight: bold;
    
    &::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: -$spacing-md;
      transform: translateX(-50%);
      width: 40rpx;
      height: 4rpx;
      background-color: $primary-color;
      border-radius: $radius-xs;
    }
  }
}

.message-tab-badge {
  position: absolute;
  top: -8rpx;
  right: -10rpx;
  background-color: $accent-red;
  color: white;
  border-radius: 20rpx;
  font-size: 20rpx;
  line-height: 32rpx;
  min-width: 32rpx;
  height: 32rpx;
  text-align: center;
  z-index: 1;
}

.message-swiper {
  flex: 1;
  min-height: 0; /* 配合flex:1使用，确保高度计算正确 */
  touch-action: pan-x pan-y; /* 允许水平和垂直滚动 */
}

.message-scroll {
  height: 100%;
  touch-action: pan-y; /* 允许垂直滚动，阻止浏览器默认触摸行为 */
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
}


.message-categories {
  padding: $spacing-sm 0;
}

.category-item {
  @include flex(row, center, center);
  background-color: $bg-card;
  margin: $spacing-xs $spacing-md;
  padding: $spacing-md;
  border-radius: $radius-lg;
  
  &:active {
    background-color: rgba($primary-color, 0.05);
    transform: scale(0.98);
    transition: all 0.15s ease;
  }
}

.category-left {
  margin-right: $spacing-md;
}

.category-icon {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  @include flex(row, center, center);
  background-color: rgba($text-tertiary, 0.05);
  border-radius: $radius-md;
}

.category-icon-image {
  width: 60rpx;
  height: 60rpx;
}

.category-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  background-color: $accent-red;
  color: white;
  font-size: 20rpx;
  line-height: 32rpx;
  min-width: 32rpx;
  height: 32rpx;
  text-align: center;
  border-radius: 16rpx;
  border: 3rpx solid #fff;
  font-weight: bold;
}

.category-content {
  flex: 1;
  @include flex(column, flex-start, flex-start);
}

.category-header {
  @include flex(row, space-between, center);
  width: 100%;
  margin-bottom: $spacing-xs;
}

.category-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
}

.category-time {
  font-size: $font-size-xs;
  color: $text-tertiary;
}

.category-preview {
  width: 100%;
}

.category-preview-text {
  font-size: $font-size-sm;
  color: $text-secondary;
  line-height: 1.4;
}

.category-empty {
  width: 100%;
}

.category-empty-text {
  font-size: $font-size-sm;
  color: $text-tertiary;
  font-style: italic;
}

.category-right {
  margin-left: $spacing-md;
}

.category-arrow {
  font-size: 32rpx;
  color: $text-tertiary;
  font-weight: 300;
}

.message-content {
  flex: 1;
  @include flex(column, center, flex-start);
}

.message-title {
  font-size: $font-size-md;
  color: $text-primary;
  font-weight: bold;
  margin-bottom: $spacing-xs;
}

.message-desc {
  font-size: $font-size-sm;
  color: $text-tertiary;
  @include text-ellipsis-multi(1);
}

.message-right {
  margin-left: $spacing-md;
  @include flex(column, flex-end, center);
}

.message-time {
  font-size: $font-size-xs;
  color: $text-tertiary;
}

.message-loading {
  @include flex(row, center, center);
  padding: $spacing-lg 0;
}

.message-loading-text {
  font-size: $font-size-sm;
  color: $text-tertiary;
}

.message-empty {
  @include flex(column, center, center);
  padding: $spacing-xl 0;
}

.message-empty-icon {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: $spacing-md;
}

.message-empty-text {
  font-size: $font-size-md;
  color: $text-tertiary;
}


/* 🎨 平滑动画效果 - 解决刷新跳动问题 */
.category-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.category-badge {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}

.category-badge.badge-updated {
  animation: badgeUpdate 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes badgeUpdate {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
    background-color: #ff6b6b;
  }
  100% {
    transform: scale(1);
  }
}

.category-preview-text {
  transition: opacity 0.2s ease-in-out;
}

.category-time {
  transition: opacity 0.2s ease-in-out;
}

/* 新消息闪烁提示 */
.category-item.has-new-message {
  animation: newMessageHighlight 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes newMessageHighlight {
  0% {
    background-color: $bg-card;
  }
  30% {
    background-color: rgba($primary-color, 0.08);
  }
  100% {
    background-color: $bg-card;
  }
}

/* 内容平滑过渡 */
.category-content {
  transition: all 0.2s ease-in-out;
}

/* 防止layout shift */
.category-preview {
  min-height: 40rpx;
  transition: min-height 0.2s ease-in-out;
}

.category-empty {
  min-height: 40rpx;
  transition: min-height 0.2s ease-in-out;
}

/* 私信列表样式 */
.message-item {
  @include flex(row, center, center);
  padding: $spacing-md $spacing-lg;
  background: $bg-card;
  border-radius: $radius-md;
  margin-bottom: $spacing-sm;
  transition: background-color 0.2s ease-in-out;
  
  &:active {
    background-color: rgba($primary-color, 0.05);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
}

.message-avatar-container {
  position: relative;
  margin-right: $spacing-md;
  flex-shrink: 0;
}

.message-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: $bg-secondary;
}

.message-badge {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  width: 16rpx;
  height: 16rpx;
  background-color: $danger-color;
  border-radius: 50%;
  border: 2rpx solid #fff;
}

.message-count-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  background-color: $accent-red;
  color: white;
  font-size: 20rpx;
  font-weight: 500;
  padding: 4rpx 8rpx;
  border-radius: $radius-circle;
  min-width: 32rpx;
  height: 32rpx;
  @include flex(row, center, center);
  line-height: 1;
  transform: scale(0.9);
  box-shadow: 0 2rpx 8rpx rgba(255, 87, 87, 0.3);
}
</style> 