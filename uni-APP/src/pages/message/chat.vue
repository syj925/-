<template>
  <view class="chat-page">
    <!-- 聊天导航栏 -->
    <view class="chat-header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="header-content">
        <view class="header-left" @tap="goBack">
          <image class="back-icon" src="/static/images/icons/back.svg" mode="aspectFit"></image>
        </view>
        <view class="header-center">
          <view class="header-user-info">
            <image class="header-avatar" :src="normalizeImageUrl(userInfo.avatar) || '/static/images/common/avatar.png'" mode="aspectFill"></image>
            <text class="header-nickname">{{ userInfo.nickname || userInfo.username || '用户' }}</text>
          </view>
        </view>
        <view class="header-right">
          <!-- 视频通话按钮 -->
          <view class="header-action-btn" @tap="startVideoCall">
            <image class="action-icon" src="/static/images/icons/video-call.svg" mode="aspectFit"></image>
          </view>
          <!-- 更多操作按钮 -->
          <view class="header-action-btn" @tap="showMoreActions">
            <image class="action-icon" src="/static/images/icons/more.svg" mode="aspectFit"></image>
          </view>
        </view>
      </view>
    </view>

    <!-- 聊天消息容器 -->
    <view class="chat-content">
      <!-- 消息列表 -->
      <scroll-view 
        scroll-y 
        class="chat-messages"
        :scroll-into-view="scrollToView"
        :enable-back-to-top="false"
        :show-scrollbar="false"
        :enhanced="true"
        :bounces="false"
      >
        <!-- 消息列表 -->
        <view class="message-list">
          <!-- 日期分割线 -->
          <view v-for="(group, date) in groupedMessages" :key="date" class="message-date-group">
            <view class="date-divider">
              <text class="date-text">{{ formatDate(date) }}</text>
            </view>
            
            <view 
              v-for="(message, index) in group" 
              :key="message.id"
              :id="`msg-${message.id}`"
              class="message-item"
              :class="{
                'message-sent': message.sender_id === currentUserId,
                'message-received': message.sender_id !== currentUserId,
                'message-first': index === 0 || group[index-1]?.sender_id !== message.sender_id,
                'message-last': index === group.length - 1 || group[index+1]?.sender_id !== message.sender_id
              }"
            >
              <!-- 接收的消息 -->
              <view v-if="message.sender_id !== currentUserId" class="message-received-wrapper">
                <view class="message-avatar-container" v-show="showAvatar(message, index, group)">
                  <image 
                    class="message-avatar" 
                    :src="normalizeImageUrl(userInfo.avatar) || '/static/images/common/avatar.png'" 
                    mode="aspectFill"
                  ></image>
                </view>
                <view class="message-content-wrapper">
                  <view class="message-bubble message-bubble-received">
                    <!-- 文本消息 -->
                    <text class="message-text" v-if="message.type === 'text' || message.type === 'private' || !message.type">{{ message.content }}</text>
                    <!-- 图片消息 -->
                    <image v-else-if="message.type === 'image'" class="message-image" :src="message.content" mode="aspectFill" @tap="previewImage(message.content)"></image>
                    <!-- 表情消息 -->
                    <view v-else-if="message.type === 'emoji'" class="message-emoji">
                      <text class="emoji-content">{{ message.content }}</text>
                    </view>
                  </view>
                  <!-- 时间显示 -->
                  <view class="message-time-wrapper" v-if="showMessageTime(message, index, group)">
                    <text class="message-time">{{ formatMessageTime(message.created_at) }}</text>
                  </view>
                </view>
              </view>

              <!-- 发送的消息 -->
              <view v-else class="message-sent-wrapper">
                <view class="message-content-wrapper">
                  <!-- 时间显示 -->
                  <view class="message-time-wrapper" v-if="showMessageTime(message, index, group)">
                    <text class="message-time">{{ formatMessageTime(message.created_at) }}</text>
                  </view>
                  <!-- 发送状态 -->
                  <view class="message-status-wrapper" v-if="showMessageStatus(message, index, group)">
                    <text class="message-status" v-if="message.send_status === 'sending'">发送中</text>
                    <text class="message-status" v-else-if="message.send_status === 'failed'">发送失败</text>
                  </view>
                  <view class="message-bubble message-bubble-sent">
                    <!-- 文本消息 -->
                    <text class="message-text" v-if="message.type === 'text' || message.type === 'private' || !message.type">{{ message.content }}</text>
                    <!-- 图片消息 -->
                    <image v-else-if="message.type === 'image'" class="message-image" :src="message.content" mode="aspectFill" @tap="previewImage(message.content)"></image>
                    <!-- 表情消息 -->
                    <view v-else-if="message.type === 'emoji'" class="message-emoji">
                      <text class="emoji-content">{{ message.content }}</text>
                    </view>
                  </view>
                </view>
                <view class="message-avatar-container" v-show="showAvatar(message, index, group)">
                  <image 
                    class="message-avatar" 
                    :src="currentUserInfo.avatar || '/static/images/common/avatar.png'" 
                    mode="aspectFill"
                  ></image>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view v-if="!messageList.length && !isLoading" class="chat-empty">
          <view class="empty-container">
            <view class="empty-icon-wrapper">
              <view class="empty-icon-bg">
                <image class="empty-icon" src="/static/images/icons/message.svg" mode="aspectFit"></image>
              </view>
            </view>
            <view class="empty-content">
              <text class="empty-title">暂无聊天记录</text>
              <text class="empty-subtitle">发送第一条消息开始聊天吧~</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 快捷功能栏 -->
    <view class="quick-actions" v-if="showQuickActions">
      <view class="quick-actions-content">
        <view class="quick-action-item" @tap="sendGreeting">
          <view class="action-icon-wrapper">
            <text class="action-emoji">👋</text>
          </view>
          <text class="action-text">打招呼</text>
        </view>
        <view class="quick-action-item" @tap="sendHeart">
          <view class="action-icon-wrapper">
            <text class="action-emoji">❤️</text>
          </view>
          <text class="action-text">比心</text>
        </view>
        <view class="quick-action-item" @tap="openAIPhoto">
          <view class="action-icon-wrapper">
            <text class="action-emoji">🤖</text>
          </view>
          <text class="action-text">AI 合照</text>
        </view>
        <view class="quick-action-item" @tap="sendSparkle">
          <view class="action-icon-wrapper">
            <text class="action-emoji">🎆</text>
          </view>
          <text class="action-text">火花·精灵</text>
        </view>
      </view>
    </view>
    
    <!-- 输入框区域 -->
    <view class="chat-input-wrapper" :style="{ paddingBottom: safeAreaBottom + 'px' }">
      <view class="input-container">
        <!-- 相机按钮 -->
        <view class="input-btn" @tap="openCamera">
          <image class="camera-icon" src="/static/images/icons/camera.svg" mode="aspectFit"></image>
        </view>
        
        <!-- 输入框 -->
        <view class="input-wrapper">
          <textarea
            v-model="inputMessage"
            class="message-input"
            placeholder="说点什么..."
            :maxlength="2000"
            auto-height
            :show-confirm-bar="false"
            :cursor-spacing="10"
            @input="onInputChange"
            @focus="onInputFocus"
            @blur="onInputBlur"
            @confirm="sendMessage"
          />
        </view>
        
        <!-- 发送/功能按钮 -->
        <view v-if="inputMessage.trim()" class="send-btn" @tap="sendMessage">
          <text class="send-text">发送</text>
        </view>
        <view v-else class="function-btns">
          <view class="emoji-btn" @tap="openEmoji">
            <image class="emoji-icon" src="/static/images/icons/emoji.svg" mode="aspectFill"></image>
          </view>
          <view class="input-btn" @tap="openMore">
            <image class="plus-icon" src="/static/images/icons/plus.svg" mode="aspectFit"></image>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { useMessageStore } from '@/store'
import { getBestServer } from '@/config/index.js'

export default {
  name: 'PrivateMessageChat',
  
  data() {
    return {
      userId: '', // 对方用户ID
      userInfo: {}, // 对方用户信息
      messageList: [], // 消息列表
      inputMessage: '', // 输入内容
      isLoading: false,
      isSending: false,
      hasMore: true,
      currentPage: 1,
      pageSize: 50, // 分页大小
      isFirstLoad: true,
      scrollToView: '',
      canSendPrivateMessage: true, // 是否可以发送私信
      isInputFocused: false, // 输入框聚焦状态
      isOnline: false, // 对方在线状态
      statusBarHeight: 0, // 状态栏高度
      safeAreaBottom: 0, // 安全区域底部高度
      showQuickActions: false, // 显示快捷功能
      messageReceivedHandler: null, // WebSocket消息接收处理器
    }
  },
  
  onReady() {
    // 页面完全渲染后，再次确保滚动到底部
    if (this.messageList.length > 0) {
      setTimeout(() => {
        this.scrollToBottom();
      }, 300);
    }
    
    // 在页面完全准备好后绑定WebSocket监听器
    this.setupWebSocketListener();
  },
  
  
  onUnload() {
    // 移除WebSocket事件监听
    console.log('🚪 [私信聊天] 页面卸载，清理WebSocket监听器...');
    if (this.messageReceivedHandler) {
      uni.$off('messageReceived', this.messageReceivedHandler);
      this.messageReceivedHandler = null;
      console.log('✅ [私信聊天] WebSocket监听器已成功移除');
    } else {
      console.log('ℹ️ [私信聊天] 没有需要移除的监听器');
    }
  },
  
  computed: {
    messageStore() {
      return useMessageStore();
    },
    
    currentUserId() {
      const userInfo = uni.getStorageSync('userInfo');
      return userInfo?.id || '';
    },
    
    currentUserInfo() {
      const userInfo = uni.getStorageSync('userInfo') || {};
      // 规范化头像URL
      if (userInfo.avatar) {
        userInfo.avatar = this.normalizeImageUrl(userInfo.avatar);
      }
      return userInfo;
    },
    
    canSend() {
      return this.inputMessage.trim().length > 0 && 
             this.inputMessage.length <= 2000 && 
             !this.isSending &&
             this.canSendPrivateMessage;
    },
    
    // 按日期分组的消息
    groupedMessages() {
      const groups = {};
      this.messageList.forEach((message) => {
        // 健壮的时间处理
        let dateStr;
        try {
          const messageDate = message.created_at ? new Date(message.created_at) : new Date();
          if (isNaN(messageDate.getTime())) {
            dateStr = new Date().toDateString(); // 使用当前时间作为默认值
          } else {
            dateStr = messageDate.toDateString();
          }
        } catch (error) {
          console.error('时间解析错误:', error);
          dateStr = new Date().toDateString();
        }
        
        if (!groups[dateStr]) {
          groups[dateStr] = [];
        }
        groups[dateStr].push(message);
      });
      
      return groups;
    }
  },
  
  onLoad(options) {
    console.log('💬 [私信聊天] 页面加载，参数:', options);
    
    // 获取系统信息
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 0;
    this.safeAreaBottom = systemInfo.safeAreaInsets?.bottom || 0;
    
    if (options.userId) {
      this.userId = options.userId;
      this.userInfo = {
        id: options.userId,
        nickname: decodeURIComponent(options.nickname || ''),
        username: decodeURIComponent(options.username || ''),
        avatar: this.normalizeImageUrl(decodeURIComponent(options.avatar || ''))
      };
      
      
      this.initChat();
    } else {
      console.error('❌ [私信聊天] 缺少用户ID参数');
      uni.showToast({
        title: '参数错误',
        icon: 'error'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  },
  
  methods: {
    // 设置WebSocket监听器
    setupWebSocketListener() {
      try {
        console.log('🔧 [私信聊天] 开始设置WebSocket监听器...');
        
        // 如果已经有监听器，先移除
        if (this.messageReceivedHandler) {
          console.log('🧹 [私信聊天] 移除旧的监听器...');
          uni.$off('messageReceived', this.messageReceivedHandler);
          this.messageReceivedHandler = null;
        }
        
        // 确保方法存在后再绑定
        if (typeof this.handleNewMessage === 'function') {
          this.messageReceivedHandler = (eventData) => {
            console.log('🔄 [私信聊天] 收到WebSocket事件，消息类型:', eventData?.message?.type);
            this.handleNewMessage(eventData);
          };
          
          uni.$on('messageReceived', this.messageReceivedHandler);
          console.log('✅ [私信聊天] WebSocket监听器已成功绑定');
          
          // 验证绑定是否生效
          setTimeout(() => {
            if (this.messageReceivedHandler) {
              console.log('🔍 [私信聊天] 监听器绑定验证成功');
            } else {
              console.warn('⚠️ [私信聊天] 监听器绑定可能失败');
            }
          }, 100);
          
        } else {
          console.error('❌ [私信聊天] handleNewMessage方法不存在，当前方法类型:', typeof this.handleNewMessage);
        }
      } catch (error) {
        console.error('❌ [私信聊天] WebSocket监听器绑定失败:', error);
      }
    },
    
    // URL规范化处理
    normalizeImageUrl(imageUrl) {
      if (!imageUrl || imageUrl.startsWith('/static/') || imageUrl.startsWith('data:')) {
        return imageUrl;
      }
      const currentServer = getBestServer();
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        const pathMatch = imageUrl.match(/(\/uploads\/.+)$/);
        if (pathMatch) {
          return `${currentServer}${pathMatch[1]}`;
        }
      }
      if (imageUrl.startsWith('/')) {
        return `${currentServer}${imageUrl}`;
      }
      return imageUrl;
    },
    
    // 初始化聊天
    async initChat() {
      try {
        // 检查私信功能状态
        await this.checkPrivateMessageStatus();
        
        // 加载聊天记录
        await this.loadMessages(true);
        
        // 标记对话为已读
        await this.markConversationAsRead();
        
        // 确保滚动到底部 - 使用延时确保DOM完全渲染
        this.$nextTick(() => {
          setTimeout(() => {
            this.scrollToBottom();
          }, 100);
        });
      } catch (error) {
        console.error('❌ [私信聊天] 初始化失败:', error);
        this.showError('初始化聊天失败');
      }
    },
    
    // 检查私信功能状态
    async checkPrivateMessageStatus() {
      try {
        const response = await this.$api.privateMessage.getStatus();
        console.log('🔍 [私信聊天] 功能状态检查:', response);
        
        if (response.success && response.data) {
          this.canSendPrivateMessage = response.data.available;
          
          if (!this.canSendPrivateMessage) {
            let message = '私信功能不可用';
            if (!response.data.globalEnabled) {
              message = '私信功能暂未开放';
            } else if (!response.data.userEnabled) {
              message = '您已关闭私信功能';
            }
            
            uni.showToast({
              title: message,
              icon: 'none',
              duration: 2000
            });
          }
        }
      } catch (error) {
        console.error('❌ [私信聊天] 状态检查失败:', error);
        // 检查失败时允许发送，避免阻止正常使用
        this.canSendPrivateMessage = true;
      }
    },
    
    // 加载消息记录 - 采用大厂策略：初次加载足够多消息，支持向上滚动加载更多
    async loadMessages(reset = false) {
      if (this.isLoading) return;
      
      try {
        this.isLoading = true;
        
        if (reset) {
          this.currentPage = 1;
          this.hasMore = true;
          this.pageSize = 50;
        }
        
        
        const response = await this.$api.privateMessage.getConversation(this.userId, {
          page: this.currentPage,
          pageSize: this.pageSize
        });
        
        if (response.success && response.data) {
          const newMessages = response.data.list || [];
          
          
          
          // 先判断hasMore（在修改newMessages之前）
          this.hasMore = newMessages.length >= this.pageSize;
          
          // 后端按时间降序返回最新消息，前端需要反转为升序显示（最早在上，最新在下）
          if (reset) {
            this.messageList = newMessages.reverse(); // 反转为正序显示
            // 初次加载时滚动到底部 - 使用延时确保渲染完成
            this.$nextTick(() => {
              setTimeout(() => {
                this.scrollToBottom();
              }, 200);
            });
          } else {
            // 历史消息（后端降序返回，需要反转后插入到前面）
            this.messageList = [...newMessages.reverse(), ...this.messageList];
            // 加载历史消息时不滚动，保持当前位置
          }
          
          
          if (!reset && newMessages.length > 0) {
            this.currentPage++;
          } else if (reset) {
            this.currentPage = 2;
            this.isFirstLoad = false;
            
            // 如果初次加载还有更多消息，自动加载（测试分页功能）
            if (this.hasMore) {
              setTimeout(() => {
                this.loadMessages(false); // 自动加载更多
              }, 1000); // 延长到1秒，便于观察
            } else {
            }
          }
        }
      } catch (error) {
        console.error('❌ [私信聊天] 加载消息失败:', error);
        this.showError('加载消息失败');
      } finally {
        this.isLoading = false;
      }
    },
    
    
    // 发送消息
    async sendMessage() {
      if (!this.canSend) return;
      
      const content = this.inputMessage.trim();
      if (!content) return;
      
      // 创建临时消息（乐观更新）
      const tempMessage = {
        id: 'temp-' + Date.now(),
        content: content,
        sender_id: this.currentUserId,
        receiver_id: this.userId,
        type: 'private',
        created_at: new Date().toISOString(),
        send_status: 'sending'
      };
      
      
      // 立即添加到消息列表
      this.messageList.push(tempMessage);
      
      // 清空输入框
      const originalMessage = this.inputMessage;
      this.inputMessage = '';
      
      // 滚动到底部 - 延时确保新消息完全渲染
      this.$nextTick(() => {
        setTimeout(() => {
          this.scrollToBottom();
        }, 150);
      });
      
      try {
        this.isSending = true;
        
        console.log(`📤 [私信聊天] 发送消息给用户 ${this.userId}`);
        
        const response = await this.$api.privateMessage.send({
          receiverId: this.userId,
          content: content
        });
        
        if (response.success && response.data) {
          console.log('✅ [私信聊天] 消息发送成功:', response.data);
          
          // 替换临时消息
          const tempIndex = this.messageList.findIndex(msg => msg.id === tempMessage.id);
          if (tempIndex !== -1) {
            this.messageList.splice(tempIndex, 1, response.data);
          }
        }
      } catch (error) {
        console.error('❌ [私信聊天] 发送消息失败:', error);
        
        // 标记消息发送失败
        const tempIndex = this.messageList.findIndex(msg => msg.id === tempMessage.id);
        if (tempIndex !== -1) {
          this.messageList[tempIndex].send_status = 'failed';
        }
        
        // 恢复输入框内容
        this.inputMessage = originalMessage;
        
        // 根据错误类型显示不同提示
        let errorMessage = '发送失败，请重试';
        if (error.code === 'PRIVATE_MESSAGE_DISABLED') {
          errorMessage = '私信功能暂未开放';
        } else if (error.code === 'RECEIVER_DISABLED_PRIVATE_MESSAGE') {
          errorMessage = '对方已关闭私信功能';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        uni.showToast({
          title: errorMessage,
          icon: 'error'
        });
      } finally {
        this.isSending = false;
      }
    },
    
    // 输入变化处理
    onInputChange(e) {
      this.inputMessage = e.detail.value;
    },
    
    // 输入框聚焦
    onInputFocus() {
      this.isInputFocused = true;
    },
    
    // 输入框失焦
    onInputBlur() {
      this.isInputFocused = false;
    },
    
    // 打开相机
    openCamera() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album'],
        success: (res) => {
          // TODO: 上传图片并发送
          console.log('选择图片:', res.tempFilePaths[0]);
          uni.showToast({
            title: '图片功能开发中',
            icon: 'none'
          });
        }
      });
    },
    
    // 打开表情面板
    openEmoji() {
      uni.showToast({
        title: '表情功能开发中',
        icon: 'none'
      });
    },
    
    // 打开更多功能
    openMore() {
      this.showQuickActions = !this.showQuickActions;
    },
    
    // 预览图片
    previewImage(src) {
      uni.previewImage({
        urls: [src],
        current: src
      });
    },
    
    // 开始视频通话
    startVideoCall() {
      uni.showToast({
        title: '视频通话功能开发中',
        icon: 'none'
      });
    },
    
    // 显示更多操作
    showMoreActions() {
      uni.showActionSheet({
        itemList: ['清空聊天记录', '举报用户'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.clearChatHistory();
          } else if (res.tapIndex === 1) {
            this.reportUser();
          }
        }
      });
    },
    
    // 清空聊天记录
    clearChatHistory() {
      uni.showModal({
        title: '清空聊天记录',
        content: '确定要清空与该用户的所有聊天记录吗？',
        success: (res) => {
          if (res.confirm) {
            this.messageList = [];
            uni.showToast({
              title: '已清空',
              icon: 'success'
            });
          }
        }
      });
    },
    
    // 举报用户
    reportUser() {
      uni.showToast({
        title: '举报功能开发中',
        icon: 'none'
      });
    },
    
    // 是否显示头像 - 现在每条消息都显示头像
    showAvatar(message, index, group) {
      return true; // 总是显示头像
    },
    
    // 是否显示消息时间
    showMessageTime(message, index, group) {
      if (index === 0) {
        // 第一条消息，检查是否刚发送
        const messageTime = new Date(message.created_at);
        const now = new Date();
        const diffMins = Math.floor((now - messageTime) / 60000);
        
        // 如果是刚刚发送的消息（1分钟内），不显示时间
        if (diffMins < 1) return false;
        return true;
      }
      
      try {
        const currentTime = new Date(message.created_at || new Date());
        const prevTime = new Date(group[index - 1].created_at || new Date());
        
        if (isNaN(currentTime.getTime()) || isNaN(prevTime.getTime())) {
          return false; // 时间无效时不显示时间
        }
        
        // 检查当前消息是否是刚发送的
        const now = new Date();
        const currentDiffMins = Math.floor((now - currentTime) / 60000);
        if (currentDiffMins < 1) return false; // 刚发送的不显示时间
        
        const timeDiff = currentTime - prevTime;
        
        // 距离上一条消息超过5分钟显示时间
        return timeDiff > 5 * 60 * 1000;
      } catch (error) {
        console.error('时间比较错误:', error);
        return false;
      }
    },
    
    // 是否显示消息状态
    showMessageStatus(message, index, group) {
      return message.sender_id === this.currentUserId && (index === group.length - 1 || group[index + 1]?.sender_id !== message.sender_id);
    },
    
    // 格式化日期
    formatDate(dateString) {
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          console.warn('无效的日期字符串:', dateString);
          return '今天';
        }
        
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        
        if (date.toDateString() === today.toDateString()) {
          return '今天';
        } else if (date.toDateString() === yesterday.toDateString()) {
          return '昨天';
        } else {
          return date.toLocaleDateString('zh-CN', {
            month: 'long',
            day: 'numeric'
          });
        }
      } catch (error) {
        console.error('日期格式化错误:', error, dateString);
        return '今天';
      }
    },
    
    // 处理WebSocket接收到的新消息
    handleNewMessage(eventData) {
      try {
        const newMessage = eventData.message;
        
        console.log('📨 [私信聊天] 收到WebSocket消息:', newMessage);
        
        // 只处理私信类型的消息
        if (newMessage.type !== 'private') {
          console.log('⏭️ [私信聊天] 非私信消息，跳过处理');
          return;
        }
        
        // 只处理与当前对话相关的消息
        const currentUserId = uni.getStorageSync('userInfo')?.id;
        const isRelevantMessage = (
          (newMessage.sender_id === currentUserId && newMessage.receiver_id === this.userId) ||
          (newMessage.sender_id === this.userId && newMessage.receiver_id === currentUserId)
        );
        
        if (!isRelevantMessage) {
          console.log('⏭️ [私信聊天] 与当前对话无关的消息，跳过处理');
          return;
        }
        
        // 智能增量添加新消息
        this.smartAddNewMessage(newMessage);
        
      } catch (error) {
        console.error('❌ [私信聊天] 处理新消息失败:', error);
      }
    },
    
    // 智能增量添加新消息（避免重复）
    smartAddNewMessage(newMessage) {
      try {
        console.log('🎯 [私信聊天] 准备添加新消息:', {
          id: newMessage.id,
          content: newMessage.content?.substring(0, 20) + '...',
          sender_id: newMessage.sender_id,
          created_at: newMessage.created_at,
          currentListLength: this.messageList.length
        });
        
        // 检查是否已经存在该消息（避免重复）
        const existingIndex = this.messageList.findIndex(item => 
          item.id === newMessage.id || 
          (item.sender_id === newMessage.sender_id && 
           item.receiver_id === newMessage.receiver_id &&
           Math.abs(new Date(item.created_at) - new Date(newMessage.created_at)) < 1000)
        );
        
        if (existingIndex >= 0) {
          console.log('💡 [私信聊天] 消息已存在，跳过添加，索引:', existingIndex);
          return;
        }
        
        // 格式化新消息
        const formattedMessage = {
          id: newMessage.id,
          content: newMessage.content,
          sender_id: newMessage.sender_id,
          receiver_id: newMessage.receiver_id,
          type: newMessage.type,
          created_at: newMessage.created_at,
          isNew: true // 标记为新消息
        };
        
        // 添加到消息列表末尾（最新消息在底部）
        this.messageList.push(formattedMessage);
        
        console.log('✨ [私信聊天] 新消息已实时添加，列表长度:', this.messageList.length);
        
        // 滚动到底部显示新消息
        this.$nextTick(() => {
          setTimeout(() => {
            this.scrollToBottom();
          }, 100);
        });
        
      } catch (error) {
        console.error('❌ [私信聊天] 智能添加新消息失败:', error);
      }
    },
    
    // 快捷操作 - 打招呼
    sendGreeting() {
      this.inputMessage = '你好啊！👋';
      this.sendMessage();
    },
    
    // 快捷操作 - 比心
    sendHeart() {
      this.inputMessage = '❤️';
      this.sendMessage();
    },
    
    // AI合照
    openAIPhoto() {
      uni.showToast({
        title: 'AI合照功能开发中',
        icon: 'none'
      });
    },
    
    // 发送火花
    sendSparkle() {
      uni.showToast({
        title: '火花特效开发中',
        icon: 'none'
      });
    },
    
    // 滚动到底部
    scrollToBottom() {
      if (this.messageList.length > 0) {
        const lastMessage = this.messageList[this.messageList.length - 1];
        const scrollId = `msg-${lastMessage.id}`;
        console.log('📍 [私信聊天] 滚动到底部:', scrollId);
        
        // 重置scrollToView，然后设置新值
        this.scrollToView = '';
        this.$nextTick(() => {
          this.scrollToView = scrollId;
        });
      }
    },
    
    // 格式化消息时间
    formatMessageTime(timestamp) {
      if (!timestamp) return '';
      
      const now = new Date();
      const messageTime = new Date(timestamp);
      
      // 检查日期是否有效
      if (isNaN(messageTime.getTime())) {
        console.warn('无效的时间戳:', timestamp);
        return '';
      }
      
      const diffMs = now - messageTime;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) {
        return ''; // 不显示“刚刚”
      } else if (diffMins < 60) {
        return `${diffMins}分钟前`;
      } else if (diffHours < 24) {
        return `${diffHours}小时前`;
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else {
        return messageTime.toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 显示错误提示
    showError(message) {
      uni.showToast({
        title: message,
        icon: 'error'
      });
    },
    
    // 标记对话为已读
    async markConversationAsRead() {
      try {
        console.log('📖 [私信聊天] 标记对话为已读:', this.userInfo.id);
        
        const response = await this.$api.privateMessage.markConversationAsRead(this.userInfo.id);
        
        if (response.success || response.code === 0) {
          const updatedCount = response.data?.updatedCount || 0;
          console.log(`✅ [私信聊天] 成功标记 ${updatedCount} 条消息为已读`);
          
          // 触发全局消息更新事件，刷新消息列表的计数
          uni.$emit('conversationMarkedAsRead', {
            userId: this.userInfo.id,
            updatedCount
          });
        }
        
      } catch (error) {
        console.error('❌ [私信聊天] 标记对话已读失败:', error);
        // 标记已读失败不影响聊天功能，静默处理
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  overflow: hidden; /* 禁用页面级滚动 */
  
  * {
    box-sizing: border-box;
  }
}

.chat-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: $bg-card;
  border-bottom: 1px solid #ebedf0;
  z-index: 300; /* 确保在输入框之上 */
}

.header-content {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  min-height: 88rpx;
  padding-top: calc(env(safe-area-inset-top) + 20rpx); /* 适配安全区域 */
}

.header-left {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
}

.back-icon {
  width: 44rpx;
  height: 44rpx;
}

.header-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-left: 20rpx;
}

.header-user-info {
  display: flex;
  align-items: center;
  max-width: 400rpx;
}

.header-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.header-nickname {
  font-size: 32rpx;
  font-weight: 500;
  color: $text-primary;
  line-height: 1.2;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.header-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  
  &:active {
    background: #f0f2f5;
  }
}

.action-icon {
  width: 44rpx;
  height: 44rpx;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: calc(env(safe-area-inset-top) + 108rpx); /* 为固定头部预留空间，包含安全区域 */
  overflow: hidden; /* 确保不产生滚动 */
  min-height: 0; /* 防止flex子项最小高度问题 */
}

.chat-messages {
  flex: 1;
  padding: 0;
  padding-bottom: 160rpx; /* 为输入框预留空间 */
  background: transparent;
  overflow: hidden;
}

.message-list {
  padding: 0 30rpx;
}

.message-date-group {
  margin-bottom: 30rpx;
}

.date-divider {
  display: flex;
  justify-content: center;
  margin: 30rpx 0;
}

.date-text {
  background: rgba(#999999, 0.1);
  color: #999999;
  font-size: 24rpx;
  padding: 8rpx 24rpx;
  border-radius: 20rpx;
}

.message-item {
  margin-bottom: 12rpx;
  animation: fadeInUp 0.2s ease-out;
  width: 100%;
  min-height: 60rpx;
  
  &.message-first {
    margin-top: 16rpx;
  }
  
  &.message-last {
    margin-bottom: 30rpx;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-received-wrapper {
  display: flex;
  align-items: center; /* 居中对齐 */
  justify-content: flex-start;
  margin-bottom: 20rpx;
  width: 100%;
  padding-right: 80rpx;
  min-height: 100rpx; /* 确保有足够高度 */
}

.message-sent-wrapper {
  display: flex;
  align-items: center; /* 居中对齐 */
  justify-content: flex-end;
  margin-bottom: 20rpx;
  width: 100%;
  padding-left: 80rpx;
  min-height: 100rpx; /* 确保有足够高度 */
}

.message-avatar-container {
  width: 80rpx;
  display: flex;
  justify-content: center;
  align-items: center; /* 居中对齐 */
  flex-shrink: 0;
  min-height: 100rpx; /* 确保有足够的高度来居中 */
}

.message-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background-color: $bg-secondary;
}

.message-content-wrapper {
  max-width: 600rpx;
  min-width: 100rpx;
  margin: 0 16rpx;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: flex-start; /* 让消息内容从顶部开始 */
}

.message-received-wrapper .message-content-wrapper {
  align-items: flex-start;
}

.message-sent-wrapper .message-content-wrapper {
  align-items: flex-end;
}

.message-bubble {
  border-radius: 16rpx;
  position: relative;
  word-wrap: break-word;
  word-break: break-word;
  display: block;
  min-width: 60rpx;
  width: fit-content;
  max-width: 100%;
}

.message-bubble-received {
  background: $bg-card;
  border: 1px solid #ebedf0;
  border-bottom-left-radius: 6rpx;
  padding: 20rpx 24rpx;
  margin-top: 0; /* 保证与头像对齐 */
}

.message-bubble-sent {
  background: $primary-color;
  border-bottom-right-radius: 6rpx;
  padding: 20rpx 24rpx;
  margin-top: 0; /* 保证与头像对齐 */
}

.message-text {
  font-size: 30rpx;
  line-height: 1.4;
  color: $text-primary;
  margin: 0;
  white-space: pre-wrap;
  text-align: left;
  min-height: 30rpx;
  display: block;
  width: 100%;
}

.message-bubble-sent .message-text {
  color: $text-white;
}

.message-image {
  max-width: 400rpx;
  max-height: 300rpx;
  border-radius: 12rpx;
}

.message-emoji {
  padding: 8rpx;
}

.emoji-content {
  font-size: 60rpx;
}

.message-time-wrapper {
  margin: 8rpx 0 4rpx; /* 减小上下margin */
  text-align: center;
}

.message-time {
  font-size: 22rpx;
  color: #999999;
}

.message-status-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 4rpx; /* 减小下边距 */
  gap: 8rpx;
}

.message-status {
  font-size: 22rpx;
  color: #999999;
}

.message-read-status {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

// 已移除已读/未读样式

.chat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 60rpx;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400rpx;
}

.empty-icon-wrapper {
  margin-bottom: 30rpx;
}

.empty-icon-bg {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba($primary-color, 0.1);
}

.empty-icon {
  width: 90rpx;
  height: 90rpx;
}

.empty-content {
  text-align: center;
}

.empty-title {
  font-size: 32rpx;
  color: #666666;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.empty-subtitle {
  font-size: 26rpx;
  color: #999999;
  line-height: 1.6;
}

// 快捷功能栏
.quick-actions {
  background: #f8f9fa;
  border-top: 1px solid #ebedf0;
  padding: 20rpx 0;
}

.quick-actions-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 20rpx;
}

.quick-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 100rpx;
  
  &:active {
    opacity: 0.7;
  }
}

.action-icon-wrapper {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: $bg-card;
  border: 1px solid #ebedf0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.action-emoji {
  font-size: 40rpx;
}

.action-text {
  font-size: 22rpx;
  color: #666666;
  text-align: center;
}

// 输入区域
.chat-input-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $bg-card;
  border-top: 1px solid #ebedf0;
  padding: 16rpx 20rpx;
  z-index: 200;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 16rpx;
}

.input-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &:active {
    background: #f0f2f5;
  }
}

// 表情按钮专用容器（更大尺寸）
.emoji-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &:active {
    background: #f0f2f5;
  }
}

// 原通用样式（保留作为备用）
.btn-icon {
  width: 32rpx;
  height: 32rpx;
}

// 单独的图标样式
.camera-icon {
  width: 46rpx;
  height: 46rpx;
}

.emoji-icon {
  width: 51rpx;
  height: 51rpx;
}

.plus-icon {
  width: 50rpx;
  height: 50rpx;
}

.input-wrapper {
  flex: 1;
  background: #f8f9fa;
  border-radius: 36rpx;
  padding: 16rpx 24rpx;
  min-height: 72rpx;
  display: flex;
  align-items: center;
}

.message-input {
  width: 100%;
  min-height: 40rpx;
  max-height: 200rpx;
  font-size: 30rpx;
  line-height: 1.4;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: $text-primary;
}

.send-btn {
  background: $primary-color;
  border-radius: 36rpx;
  padding: 0 32rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:active {
    opacity: 0.8;
  }
}

.send-text {
  color: $text-white;
  font-size: 28rpx;
  font-weight: 500;
}

.function-btns {
  display: flex;
  gap: 16rpx;
}

</style>
    <!-- 聊天导航栏 -->
    <view class="chat-header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="header-content">
        <view class="header-left" @tap="goBack">
          <image class="back-icon" src="/static/images/icons/back.svg" mode="aspectFit"></image>
        </view>
        <view class="header-center">
          <view class="header-user-info">
            <image class="header-avatar" :src="normalizeImageUrl(userInfo.avatar) || '/static/images/common/avatar.png'" mode="aspectFill"></image>
            <text class="header-nickname">{{ userInfo.nickname || userInfo.username || '用户' }}</text>
          </view>
        </view>
        <view class="header-right">
          <!-- 视频通话按钮 -->
          <view class="header-action-btn" @tap="startVideoCall">
            <image class="action-icon" src="/static/images/icons/video-call.svg" mode="aspectFit"></image>
          </view>
          <!-- 更多操作按钮 -->
          <view class="header-action-btn" @tap="showMoreActions">
            <image class="action-icon" src="/static/images/icons/more.svg" mode="aspectFit"></image>
          </view>
        </view>
      </view>
    </view>

    <!-- 聊天消息容器 -->
    <view class="chat-content">
      <!-- 消息列表 -->
      <scroll-view 
        scroll-y 
        class="chat-messages"
        :scroll-into-view="scrollToView"
        :enable-back-to-top="false"
        :show-scrollbar="false"
        :enhanced="true"
        :bounces="false"
      >
        <!-- 消息列表 -->
        <view class="message-list">
          <!-- 日期分割线 -->
          <view v-for="(group, date) in groupedMessages" :key="date" class="message-date-group">
            <view class="date-divider">
              <text class="date-text">{{ formatDate(date) }}</text>
            </view>
            
            <view 
              v-for="(message, index) in group" 
              :key="message.id"
              :id="`msg-${message.id}`"
              class="message-item"
              :class="{
                'message-sent': message.sender_id === currentUserId,
                'message-received': message.sender_id !== currentUserId,
                'message-first': index === 0 || group[index-1]?.sender_id !== message.sender_id,
                'message-last': index === group.length - 1 || group[index+1]?.sender_id !== message.sender_id
              }"
            >
              <!-- 接收的消息 -->
              <view v-if="message.sender_id !== currentUserId" class="message-received-wrapper">
                <view class="message-avatar-container" v-show="showAvatar(message, index, group)">
                  <image 
                    class="message-avatar" 
                    :src="normalizeImageUrl(userInfo.avatar) || '/static/images/common/avatar.png'" 
                    mode="aspectFill"
                  ></image>
                </view>
                <view class="message-content-wrapper">
                  <view class="message-bubble message-bubble-received">
                    <!-- 文本消息 -->
                    <text class="message-text" v-if="message.type === 'text' || message.type === 'private' || !message.type">{{ message.content }}</text>
                    <!-- 图片消息 -->
                    <image v-else-if="message.type === 'image'" class="message-image" :src="message.content" mode="aspectFill" @tap="previewImage(message.content)"></image>
                    <!-- 表情消息 -->
                    <view v-else-if="message.type === 'emoji'" class="message-emoji">
                      <text class="emoji-content">{{ message.content }}</text>
                    </view>
                  </view>
                  <!-- 时间显示 -->
                  <view class="message-time-wrapper" v-if="showMessageTime(message, index, group)">
                    <text class="message-time">{{ formatMessageTime(message.created_at) }}</text>
                  </view>
                </view>
              </view>

              <!-- 发送的消息 -->
              <view v-else class="message-sent-wrapper">
                <view class="message-content-wrapper">
                  <!-- 时间显示 -->
                  <view class="message-time-wrapper" v-if="showMessageTime(message, index, group)">
                    <text class="message-time">{{ formatMessageTime(message.created_at) }}</text>
                  </view>
                  <!-- 发送状态 -->
                  <view class="message-status-wrapper" v-if="showMessageStatus(message, index, group)">
                    <text class="message-status" v-if="message.send_status === 'sending'">发送中</text>
                    <text class="message-status" v-else-if="message.send_status === 'failed'">发送失败</text>
                  </view>
                  <view class="message-bubble message-bubble-sent">
                    <!-- 文本消息 -->
                    <text class="message-text" v-if="message.type === 'text' || message.type === 'private' || !message.type">{{ message.content }}</text>
                    <!-- 图片消息 -->
                    <image v-else-if="message.type === 'image'" class="message-image" :src="message.content" mode="aspectFill" @tap="previewImage(message.content)"></image>
                    <!-- 表情消息 -->
                    <view v-else-if="message.type === 'emoji'" class="message-emoji">
                      <text class="emoji-content">{{ message.content }}</text>
                    </view>
                  </view>
                </view>
                <view class="message-avatar-container" v-show="showAvatar(message, index, group)">
                  <image 
                    class="message-avatar" 
                    :src="currentUserInfo.avatar || '/static/images/common/avatar.png'" 
                    mode="aspectFill"
                  ></image>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view v-if="!messageList.length && !isLoading" class="chat-empty">
          <view class="empty-container">
            <view class="empty-icon-wrapper">
              <view class="empty-icon-bg">
                <image class="empty-icon" src="/static/images/icons/message.svg" mode="aspectFit"></image>
              </view>
            </view>
            <view class="empty-content">
              <text class="empty-title">暂无聊天记录</text>
              <text class="empty-subtitle">发送第一条消息开始聊天吧~</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 快捷功能栏 -->
    <view class="quick-actions" v-if="showQuickActions">
      <view class="quick-actions-content">
        <view class="quick-action-item" @tap="sendGreeting">
          <view class="action-icon-wrapper">
            <text class="action-emoji">👋</text>
          </view>
          <text class="action-text">打招呼</text>
        </view>
        <view class="quick-action-item" @tap="sendHeart">
          <view class="action-icon-wrapper">
            <text class="action-emoji">❤️</text>
          </view>
          <text class="action-text">比心</text>
        </view>
        <view class="quick-action-item" @tap="openAIPhoto">
          <view class="action-icon-wrapper">
            <text class="action-emoji">🤖</text>
          </view>
          <text class="action-text">AI 合照</text>
        </view>
        <view class="quick-action-item" @tap="sendSparkle">
          <view class="action-icon-wrapper">
            <text class="action-emoji">🎆</text>
          </view>
          <text class="action-text">火花·精灵</text>
        </view>
      </view>
    </view>
    
    <!-- 输入框区域 -->
    <view class="chat-input-wrapper" :style="{ paddingBottom: safeAreaBottom + 'px' }">
      <view class="input-container">
        <!-- 相机按钮 -->
        <view class="input-btn" @tap="openCamera">
          <image class="camera-icon" src="/static/images/icons/camera.svg" mode="aspectFit"></image>
        </view>
        
        <!-- 输入框 -->
        <view class="input-wrapper">
          <textarea
            v-model="inputMessage"
            class="message-input"
            placeholder="说点什么..."
            :maxlength="2000"
            auto-height
            :show-confirm-bar="false"
            :cursor-spacing="10"
            @input="onInputChange"
            @focus="onInputFocus"
            @blur="onInputBlur"
            @confirm="sendMessage"
          />
        </view>
        
        <!-- 发送/功能按钮 -->
        <view v-if="inputMessage.trim()" class="send-btn" @tap="sendMessage">
          <text class="send-text">发送</text>
        </view>
        <view v-else class="function-btns">
          <view class="emoji-btn" @tap="openEmoji">
            <image class="emoji-icon" src="/static/images/icons/emoji.svg" mode="aspectFill"></image>
          </view>
          <view class="input-btn" @tap="openMore">
            <image class="plus-icon" src="/static/images/icons/plus.svg" mode="aspectFit"></image>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { useMessageStore } from '@/store'
import { getBestServer } from '@/config/index.js'

export default {
  name: 'PrivateMessageChat',
  
  data() {
    return {
      userId: '', // 对方用户ID
      userInfo: {}, // 对方用户信息
      messageList: [], // 消息列表
      inputMessage: '', // 输入内容
      isLoading: false,
      isSending: false,
      hasMore: true,
      currentPage: 1,
      pageSize: 50, // 分页大小
      isFirstLoad: true,
      scrollToView: '',
      canSendPrivateMessage: true, // 是否可以发送私信
      isInputFocused: false, // 输入框聚焦状态
      isOnline: false, // 对方在线状态
      statusBarHeight: 0, // 状态栏高度
      safeAreaBottom: 0, // 安全区域底部高度
      showQuickActions: false, // 显示快捷功能
      messageReceivedHandler: null, // WebSocket消息接收处理器
    }
  },
  
  onReady() {
    // 页面完全渲染后，再次确保滚动到底部
    if (this.messageList.length > 0) {
      setTimeout(() => {
        this.scrollToBottom();
      }, 300);
    }
    
    // 在页面完全准备好后绑定WebSocket监听器
    this.setupWebSocketListener();
  },
  
  
  onUnload() {
    // 移除WebSocket事件监听
    console.log('🚪 [私信聊天] 页面卸载，清理WebSocket监听器...');
    if (this.messageReceivedHandler) {
      uni.$off('messageReceived', this.messageReceivedHandler);
      this.messageReceivedHandler = null;
      console.log('✅ [私信聊天] WebSocket监听器已成功移除');
    } else {
      console.log('ℹ️ [私信聊天] 没有需要移除的监听器');
    }
  },
  
  computed: {
    messageStore() {
      return useMessageStore();
    },
    
    currentUserId() {
      const userInfo = uni.getStorageSync('userInfo');
      return userInfo?.id || '';
    },
    
    currentUserInfo() {
      const userInfo = uni.getStorageSync('userInfo') || {};
      // 规范化头像URL
      if (userInfo.avatar) {
        userInfo.avatar = this.normalizeImageUrl(userInfo.avatar);
      }
      return userInfo;
    },
    
    canSend() {
      return this.inputMessage.trim().length > 0 && 
             this.inputMessage.length <= 2000 && 
             !this.isSending &&
             this.canSendPrivateMessage;
    },
    
    // 按日期分组的消息
    groupedMessages() {
      const groups = {};
      this.messageList.forEach((message) => {
        // 健壮的时间处理
        let dateStr;
        try {
          const messageDate = message.created_at ? new Date(message.created_at) : new Date();
          if (isNaN(messageDate.getTime())) {
            dateStr = new Date().toDateString(); // 使用当前时间作为默认值
          } else {
            dateStr = messageDate.toDateString();
          }
        } catch (error) {
          console.error('时间解析错误:', error);
          dateStr = new Date().toDateString();
        }
        
        if (!groups[dateStr]) {
          groups[dateStr] = [];
        }
        groups[dateStr].push(message);
      });
      
      return groups;
    }
  },
  
  onLoad(options) {
    console.log('💬 [私信聊天] 页面加载，参数:', options);
    
    // 获取系统信息
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 0;
    this.safeAreaBottom = systemInfo.safeAreaInsets?.bottom || 0;
    
    if (options.userId) {
      this.userId = options.userId;
      this.userInfo = {
        id: options.userId,
        nickname: decodeURIComponent(options.nickname || ''),
        username: decodeURIComponent(options.username || ''),
        avatar: this.normalizeImageUrl(decodeURIComponent(options.avatar || ''))
      };
      
      
      this.initChat();
    } else {
      console.error('❌ [私信聊天] 缺少用户ID参数');
      uni.showToast({
        title: '参数错误',
        icon: 'error'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  },
  
  methods: {
    // 设置WebSocket监听器
    setupWebSocketListener() {
      try {
        console.log('🔧 [私信聊天] 开始设置WebSocket监听器...');
        
        // 如果已经有监听器，先移除
        if (this.messageReceivedHandler) {
          console.log('🧹 [私信聊天] 移除旧的监听器...');
          uni.$off('messageReceived', this.messageReceivedHandler);
          this.messageReceivedHandler = null;
        }
        
        // 确保方法存在后再绑定
        if (typeof this.handleNewMessage === 'function') {
          this.messageReceivedHandler = (eventData) => {
            console.log('🔄 [私信聊天] 收到WebSocket事件，消息类型:', eventData?.message?.type);
            this.handleNewMessage(eventData);
          };
          
          uni.$on('messageReceived', this.messageReceivedHandler);
          console.log('✅ [私信聊天] WebSocket监听器已成功绑定');
          
          // 验证绑定是否生效
          setTimeout(() => {
            if (this.messageReceivedHandler) {
              console.log('🔍 [私信聊天] 监听器绑定验证成功');
            } else {
              console.warn('⚠️ [私信聊天] 监听器绑定可能失败');
            }
          }, 100);
          
        } else {
          console.error('❌ [私信聊天] handleNewMessage方法不存在，当前方法类型:', typeof this.handleNewMessage);
        }
      } catch (error) {
        console.error('❌ [私信聊天] WebSocket监听器绑定失败:', error);
      }
    },
    
    // URL规范化处理
    normalizeImageUrl(imageUrl) {
      if (!imageUrl || imageUrl.startsWith('/static/') || imageUrl.startsWith('data:')) {
        return imageUrl;
      }
      const currentServer = getBestServer();
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        const pathMatch = imageUrl.match(/(\/uploads\/.+)$/);
        if (pathMatch) {
          return `${currentServer}${pathMatch[1]}`;
        }
      }
      if (imageUrl.startsWith('/')) {
        return `${currentServer}${imageUrl}`;
      }
      return imageUrl;
    },
    
    // 初始化聊天
    async initChat() {
      try {
        // 检查私信功能状态
        await this.checkPrivateMessageStatus();
        
        // 加载聊天记录
        await this.loadMessages(true);
        
        // 标记对话为已读
        await this.markConversationAsRead();
        
        // 确保滚动到底部 - 使用延时确保DOM完全渲染
        this.$nextTick(() => {
          setTimeout(() => {
            this.scrollToBottom();
          }, 100);
        });
      } catch (error) {
        console.error('❌ [私信聊天] 初始化失败:', error);
        this.showError('初始化聊天失败');
      }
    },
    
    // 检查私信功能状态
    async checkPrivateMessageStatus() {
      try {
        const response = await this.$api.privateMessage.getStatus();
        console.log('🔍 [私信聊天] 功能状态检查:', response);
        
        if (response.success && response.data) {
          this.canSendPrivateMessage = response.data.available;
          
          if (!this.canSendPrivateMessage) {
            let message = '私信功能不可用';
            if (!response.data.globalEnabled) {
              message = '私信功能暂未开放';
            } else if (!response.data.userEnabled) {
              message = '您已关闭私信功能';
            }
            
            uni.showToast({
              title: message,
              icon: 'none',
              duration: 2000
            });
          }
        }
      } catch (error) {
        console.error('❌ [私信聊天] 状态检查失败:', error);
        // 检查失败时允许发送，避免阻止正常使用
        this.canSendPrivateMessage = true;
      }
    },
    
    // 加载消息记录 - 采用大厂策略：初次加载足够多消息，支持向上滚动加载更多
    async loadMessages(reset = false) {
      if (this.isLoading) return;
      
      try {
        this.isLoading = true;
        
        if (reset) {
          this.currentPage = 1;
          this.hasMore = true;
          this.pageSize = 50;
        }
        
        
        const response = await this.$api.privateMessage.getConversation(this.userId, {
          page: this.currentPage,
          pageSize: this.pageSize
        });
        
        if (response.success && response.data) {
          const newMessages = response.data.list || [];
          
          
          
          // 先判断hasMore（在修改newMessages之前）
          this.hasMore = newMessages.length >= this.pageSize;
          
          // 后端按时间降序返回最新消息，前端需要反转为升序显示（最早在上，最新在下）
          if (reset) {
            this.messageList = newMessages.reverse(); // 反转为正序显示
            // 初次加载时滚动到底部 - 使用延时确保渲染完成
            this.$nextTick(() => {
              setTimeout(() => {
                this.scrollToBottom();
              }, 200);
            });
          } else {
            // 历史消息（后端降序返回，需要反转后插入到前面）
            this.messageList = [...newMessages.reverse(), ...this.messageList];
            // 加载历史消息时不滚动，保持当前位置
          }
          
          
          if (!reset && newMessages.length > 0) {
            this.currentPage++;
          } else if (reset) {
            this.currentPage = 2;
            this.isFirstLoad = false;
            
            // 如果初次加载还有更多消息，自动加载（测试分页功能）
            if (this.hasMore) {
              setTimeout(() => {
                this.loadMessages(false); // 自动加载更多
              }, 1000); // 延长到1秒，便于观察
            } else {
            }
          }
        }
      } catch (error) {
        console.error('❌ [私信聊天] 加载消息失败:', error);
        this.showError('加载消息失败');
      } finally {
        this.isLoading = false;
      }
    },
    
    
    // 发送消息
    async sendMessage() {
      if (!this.canSend) return;
      
      const content = this.inputMessage.trim();
      if (!content) return;
      
      // 创建临时消息（乐观更新）
      const tempMessage = {
        id: 'temp-' + Date.now(),
        content: content,
        sender_id: this.currentUserId,
        receiver_id: this.userId,
        type: 'private',
        created_at: new Date().toISOString(),
        send_status: 'sending'
      };
      
      
      // 立即添加到消息列表
      this.messageList.push(tempMessage);
      
      // 清空输入框
      const originalMessage = this.inputMessage;
      this.inputMessage = '';
      
      // 滚动到底部 - 延时确保新消息完全渲染
      this.$nextTick(() => {
        setTimeout(() => {
          this.scrollToBottom();
        }, 150);
      });
      
      try {
        this.isSending = true;
        
        console.log(`📤 [私信聊天] 发送消息给用户 ${this.userId}`);
        
        const response = await this.$api.privateMessage.send({
          receiverId: this.userId,
          content: content
        });
        
        if (response.success && response.data) {
          console.log('✅ [私信聊天] 消息发送成功:', response.data);
          
          // 替换临时消息
          const tempIndex = this.messageList.findIndex(msg => msg.id === tempMessage.id);
          if (tempIndex !== -1) {
            this.messageList.splice(tempIndex, 1, response.data);
          }
        }
      } catch (error) {
        console.error('❌ [私信聊天] 发送消息失败:', error);
        
        // 标记消息发送失败
        const tempIndex = this.messageList.findIndex(msg => msg.id === tempMessage.id);
        if (tempIndex !== -1) {
          this.messageList[tempIndex].send_status = 'failed';
        }
        
        // 恢复输入框内容
        this.inputMessage = originalMessage;
        
        // 根据错误类型显示不同提示
        let errorMessage = '发送失败，请重试';
        if (error.code === 'PRIVATE_MESSAGE_DISABLED') {
          errorMessage = '私信功能暂未开放';
        } else if (error.code === 'RECEIVER_DISABLED_PRIVATE_MESSAGE') {
          errorMessage = '对方已关闭私信功能';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        uni.showToast({
          title: errorMessage,
          icon: 'error'
        });
      } finally {
        this.isSending = false;
      }
    },
    
    // 输入变化处理
    onInputChange(e) {
      this.inputMessage = e.detail.value;
    },
    
    // 输入框聚焦
    onInputFocus() {
      this.isInputFocused = true;
    },
    
    // 输入框失焦
    onInputBlur() {
      this.isInputFocused = false;
    },
    
    // 打开相机
    openCamera() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album'],
        success: (res) => {
          // TODO: 上传图片并发送
          console.log('选择图片:', res.tempFilePaths[0]);
          uni.showToast({
            title: '图片功能开发中',
            icon: 'none'
          });
        }
      });
    },
    
    // 打开表情面板
    openEmoji() {
      uni.showToast({
        title: '表情功能开发中',
        icon: 'none'
      });
    },
    
    // 打开更多功能
    openMore() {
      this.showQuickActions = !this.showQuickActions;
    },
    
    // 预览图片
    previewImage(src) {
      uni.previewImage({
        urls: [src],
        current: src
      });
    },
    
    // 开始视频通话
    startVideoCall() {
      uni.showToast({
        title: '视频通话功能开发中',
        icon: 'none'
      });
    },
    
    // 显示更多操作
    showMoreActions() {
      uni.showActionSheet({
        itemList: ['清空聊天记录', '举报用户'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.clearChatHistory();
          } else if (res.tapIndex === 1) {
            this.reportUser();
          }
        }
      });
    },
    
    // 清空聊天记录
    clearChatHistory() {
      uni.showModal({
        title: '清空聊天记录',
        content: '确定要清空与该用户的所有聊天记录吗？',
        success: (res) => {
          if (res.confirm) {
            this.messageList = [];
            uni.showToast({
              title: '已清空',
              icon: 'success'
            });
          }
        }
      });
    },
    
    // 举报用户
    reportUser() {
      uni.showToast({
        title: '举报功能开发中',
        icon: 'none'
      });
    },
    
    // 是否显示头像 - 现在每条消息都显示头像
    showAvatar(message, index, group) {
      return true; // 总是显示头像
    },
    
    // 是否显示消息时间
    showMessageTime(message, index, group) {
      if (index === 0) {
        // 第一条消息，检查是否刚发送
        const messageTime = new Date(message.created_at);
        const now = new Date();
        const diffMins = Math.floor((now - messageTime) / 60000);
        
        // 如果是刚刚发送的消息（1分钟内），不显示时间
        if (diffMins < 1) return false;
        return true;
      }
      
      try {
        const currentTime = new Date(message.created_at || new Date());
        const prevTime = new Date(group[index - 1].created_at || new Date());
        
        if (isNaN(currentTime.getTime()) || isNaN(prevTime.getTime())) {
          return false; // 时间无效时不显示时间
        }
        
        // 检查当前消息是否是刚发送的
        const now = new Date();
        const currentDiffMins = Math.floor((now - currentTime) / 60000);
        if (currentDiffMins < 1) return false; // 刚发送的不显示时间
        
        const timeDiff = currentTime - prevTime;
        
        // 距离上一条消息超过5分钟显示时间
        return timeDiff > 5 * 60 * 1000;
      } catch (error) {
        console.error('时间比较错误:', error);
        return false;
      }
    },
    
    // 是否显示消息状态
    showMessageStatus(message, index, group) {
      return message.sender_id === this.currentUserId && (index === group.length - 1 || group[index + 1]?.sender_id !== message.sender_id);
    },
    
    // 格式化日期
    formatDate(dateString) {
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          console.warn('无效的日期字符串:', dateString);
          return '今天';
        }
        
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        
        if (date.toDateString() === today.toDateString()) {
          return '今天';
        } else if (date.toDateString() === yesterday.toDateString()) {
          return '昨天';
        } else {
          return date.toLocaleDateString('zh-CN', {
            month: 'long',
            day: 'numeric'
          });
        }
      } catch (error) {
        console.error('日期格式化错误:', error, dateString);
        return '今天';
      }
    },
    
    // 处理WebSocket接收到的新消息
    handleNewMessage(eventData) {
      try {
        const newMessage = eventData.message;
        
        console.log('📨 [私信聊天] 收到WebSocket消息:', newMessage);
        
        // 只处理私信类型的消息
        if (newMessage.type !== 'private') {
          console.log('⏭️ [私信聊天] 非私信消息，跳过处理');
          return;
        }
        
        // 只处理与当前对话相关的消息
        const currentUserId = uni.getStorageSync('userInfo')?.id;
        const isRelevantMessage = (
          (newMessage.sender_id === currentUserId && newMessage.receiver_id === this.userId) ||
          (newMessage.sender_id === this.userId && newMessage.receiver_id === currentUserId)
        );
        
        if (!isRelevantMessage) {
          console.log('⏭️ [私信聊天] 与当前对话无关的消息，跳过处理');
          return;
        }
        
        // 智能增量添加新消息
        this.smartAddNewMessage(newMessage);
        
      } catch (error) {
        console.error('❌ [私信聊天] 处理新消息失败:', error);
      }
    },
    
    // 智能增量添加新消息（避免重复）
    smartAddNewMessage(newMessage) {
      try {
        console.log('🎯 [私信聊天] 准备添加新消息:', {
          id: newMessage.id,
          content: newMessage.content?.substring(0, 20) + '...',
          sender_id: newMessage.sender_id,
          created_at: newMessage.created_at,
          currentListLength: this.messageList.length
        });
        
        // 检查是否已经存在该消息（避免重复）
        const existingIndex = this.messageList.findIndex(item => 
          item.id === newMessage.id || 
          (item.sender_id === newMessage.sender_id && 
           item.receiver_id === newMessage.receiver_id &&
           Math.abs(new Date(item.created_at) - new Date(newMessage.created_at)) < 1000)
        );
        
        if (existingIndex >= 0) {
          console.log('💡 [私信聊天] 消息已存在，跳过添加，索引:', existingIndex);
          return;
        }
        
        // 格式化新消息
        const formattedMessage = {
          id: newMessage.id,
          content: newMessage.content,
          sender_id: newMessage.sender_id,
          receiver_id: newMessage.receiver_id,
          type: newMessage.type,
          created_at: newMessage.created_at,
          isNew: true // 标记为新消息
        };
        
        // 添加到消息列表末尾（最新消息在底部）
        this.messageList.push(formattedMessage);
        
        console.log('✨ [私信聊天] 新消息已实时添加，列表长度:', this.messageList.length);
        
        // 滚动到底部显示新消息
        this.$nextTick(() => {
          setTimeout(() => {
            this.scrollToBottom();
          }, 100);
        });
        
      } catch (error) {
        console.error('❌ [私信聊天] 智能添加新消息失败:', error);
      }
    },
    
    // 快捷操作 - 打招呼
    sendGreeting() {
      this.inputMessage = '你好啊！👋';
      this.sendMessage();
    },
    
    // 快捷操作 - 比心
    sendHeart() {
      this.inputMessage = '❤️';
      this.sendMessage();
    },
    
    // AI合照
    openAIPhoto() {
      uni.showToast({
        title: 'AI合照功能开发中',
        icon: 'none'
      });
    },
    
    // 发送火花
    sendSparkle() {
      uni.showToast({
        title: '火花特效开发中',
        icon: 'none'
      });
    },
    
    // 滚动到底部
    scrollToBottom() {
      if (this.messageList.length > 0) {
        const lastMessage = this.messageList[this.messageList.length - 1];
        const scrollId = `msg-${lastMessage.id}`;
        console.log('📍 [私信聊天] 滚动到底部:', scrollId);
        
        // 重置scrollToView，然后设置新值
        this.scrollToView = '';
        this.$nextTick(() => {
          this.scrollToView = scrollId;
        });
      }
    },
    
    // 格式化消息时间
    formatMessageTime(timestamp) {
      if (!timestamp) return '';
      
      const now = new Date();
      const messageTime = new Date(timestamp);
      
      // 检查日期是否有效
      if (isNaN(messageTime.getTime())) {
        console.warn('无效的时间戳:', timestamp);
        return '';
      }
      
      const diffMs = now - messageTime;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) {
        return ''; // 不显示“刚刚”
      } else if (diffMins < 60) {
        return `${diffMins}分钟前`;
      } else if (diffHours < 24) {
        return `${diffHours}小时前`;
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else {
        return messageTime.toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 显示错误提示
    showError(message) {
      uni.showToast({
        title: message,
        icon: 'error'
      });
    },
    
    // 标记对话为已读
    async markConversationAsRead() {
      try {
        console.log('📖 [私信聊天] 标记对话为已读:', this.userInfo.id);
        
        const response = await this.$api.privateMessage.markConversationAsRead(this.userInfo.id);
        
        if (response.success || response.code === 0) {
          const updatedCount = response.data?.updatedCount || 0;
          console.log(`✅ [私信聊天] 成功标记 ${updatedCount} 条消息为已读`);
          
          // 触发全局消息更新事件，刷新消息列表的计数
          uni.$emit('conversationMarkedAsRead', {
            userId: this.userInfo.id,
            updatedCount
          });
        }
        
      } catch (error) {
        console.error('❌ [私信聊天] 标记对话已读失败:', error);
        // 标记已读失败不影响聊天功能，静默处理
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  overflow: hidden; /* 禁用页面级滚动 */
  
  * {
    box-sizing: border-box;
  }
}

.chat-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: $bg-card;
  border-bottom: 1px solid #ebedf0;
  z-index: 300; /* 确保在输入框之上 */
}

.header-content {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  min-height: 88rpx;
  padding-top: calc(env(safe-area-inset-top) + 20rpx); /* 适配安全区域 */
}

.header-left {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
}

.back-icon {
  width: 44rpx;
  height: 44rpx;
}

.header-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-left: 20rpx;
}

.header-user-info {
  display: flex;
  align-items: center;
  max-width: 400rpx;
}

.header-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.header-nickname {
  font-size: 32rpx;
  font-weight: 500;
  color: $text-primary;
  line-height: 1.2;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.header-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  
  &:active {
    background: #f0f2f5;
  }
}

.action-icon {
  width: 44rpx;
  height: 44rpx;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: calc(env(safe-area-inset-top) + 108rpx); /* 为固定头部预留空间，包含安全区域 */
  overflow: hidden; /* 确保不产生滚动 */
  min-height: 0; /* 防止flex子项最小高度问题 */
}

.chat-messages {
  flex: 1;
  padding: 0;
  padding-bottom: 160rpx; /* 为输入框预留空间 */
  background: transparent;
  overflow: hidden;
}

.message-list {
  padding: 0 30rpx;
}

.message-date-group {
  margin-bottom: 30rpx;
}

.date-divider {
  display: flex;
  justify-content: center;
  margin: 30rpx 0;
}

.date-text {
  background: rgba(#999999, 0.1);
  color: #999999;
  font-size: 24rpx;
  padding: 8rpx 24rpx;
  border-radius: 20rpx;
}

.message-item {
  margin-bottom: 12rpx;
  animation: fadeInUp 0.2s ease-out;
  width: 100%;
  min-height: 60rpx;
  
  &.message-first {
    margin-top: 16rpx;
  }
  
  &.message-last {
    margin-bottom: 30rpx;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-received-wrapper {
  display: flex;
  align-items: center; /* 居中对齐 */
  justify-content: flex-start;
  margin-bottom: 20rpx;
  width: 100%;
  padding-right: 80rpx;
  min-height: 100rpx; /* 确保有足够高度 */
}

.message-sent-wrapper {
  display: flex;
  align-items: center; /* 居中对齐 */
  justify-content: flex-end;
  margin-bottom: 20rpx;
  width: 100%;
  padding-left: 80rpx;
  min-height: 100rpx; /* 确保有足够高度 */
}

.message-avatar-container {
  width: 80rpx;
  display: flex;
  justify-content: center;
  align-items: center; /* 居中对齐 */
  flex-shrink: 0;
  min-height: 100rpx; /* 确保有足够的高度来居中 */
}

.message-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background-color: $bg-secondary;
}

.message-content-wrapper {
  max-width: 600rpx;
  min-width: 100rpx;
  margin: 0 16rpx;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: flex-start; /* 让消息内容从顶部开始 */
}

.message-received-wrapper .message-content-wrapper {
  align-items: flex-start;
}

.message-sent-wrapper .message-content-wrapper {
  align-items: flex-end;
}

.message-bubble {
  border-radius: 16rpx;
  position: relative;
  word-wrap: break-word;
  word-break: break-word;
  display: block;
  min-width: 60rpx;
  width: fit-content;
  max-width: 100%;
}

.message-bubble-received {
  background: $bg-card;
  border: 1px solid #ebedf0;
  border-bottom-left-radius: 6rpx;
  padding: 20rpx 24rpx;
  margin-top: 0; /* 保证与头像对齐 */
}

.message-bubble-sent {
  background: $primary-color;
  border-bottom-right-radius: 6rpx;
  padding: 20rpx 24rpx;
  margin-top: 0; /* 保证与头像对齐 */
}

.message-text {
  font-size: 30rpx;
  line-height: 1.4;
  color: $text-primary;
  margin: 0;
  white-space: pre-wrap;
  text-align: left;
  min-height: 30rpx;
  display: block;
  width: 100%;
}

.message-bubble-sent .message-text {
  color: $text-white;
}

.message-image {
  max-width: 400rpx;
  max-height: 300rpx;
  border-radius: 12rpx;
}

.message-emoji {
  padding: 8rpx;
}

.emoji-content {
  font-size: 60rpx;
}

.message-time-wrapper {
  margin: 8rpx 0 4rpx; /* 减小上下margin */
  text-align: center;
}

.message-time {
  font-size: 22rpx;
  color: #999999;
}

.message-status-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 4rpx; /* 减小下边距 */
  gap: 8rpx;
}

.message-status {
  font-size: 22rpx;
  color: #999999;
}

.message-read-status {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

// 已移除已读/未读样式

.chat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 60rpx;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400rpx;
}

.empty-icon-wrapper {
  margin-bottom: 30rpx;
}

.empty-icon-bg {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba($primary-color, 0.1);
}

.empty-icon {
  width: 90rpx;
  height: 90rpx;
}

.empty-content {
  text-align: center;
}

.empty-title {
  font-size: 32rpx;
  color: #666666;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.empty-subtitle {
  font-size: 26rpx;
  color: #999999;
  line-height: 1.6;
}

// 快捷功能栏
.quick-actions {
  background: #f8f9fa;
  border-top: 1px solid #ebedf0;
  padding: 20rpx 0;
}

.quick-actions-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 20rpx;
}

.quick-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 100rpx;
  
  &:active {
    opacity: 0.7;
  }
}

.action-icon-wrapper {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: $bg-card;
  border: 1px solid #ebedf0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.action-emoji {
  font-size: 40rpx;
}

.action-text {
  font-size: 22rpx;
  color: #666666;
  text-align: center;
}

// 输入区域
.chat-input-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $bg-card;
  border-top: 1px solid #ebedf0;
  padding: 16rpx 20rpx;
  z-index: 200;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 16rpx;
}

.input-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &:active {
    background: #f0f2f5;
  }
}

// 表情按钮专用容器（更大尺寸）
.emoji-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &:active {
    background: #f0f2f5;
  }
}

// 原通用样式（保留作为备用）
.btn-icon {
  width: 32rpx;
  height: 32rpx;
}

// 单独的图标样式
.camera-icon {
  width: 46rpx;
  height: 46rpx;
}

.emoji-icon {
  width: 51rpx;
  height: 51rpx;
}

.plus-icon {
  width: 50rpx;
  height: 50rpx;
}

.input-wrapper {
  flex: 1;
  background: #f8f9fa;
  border-radius: 36rpx;
  padding: 16rpx 24rpx;
  min-height: 72rpx;
  display: flex;
  align-items: center;
}

.message-input {
  width: 100%;
  min-height: 40rpx;
  max-height: 200rpx;
  font-size: 30rpx;
  line-height: 1.4;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: $text-primary;
}

.send-btn {
  background: $primary-color;
  border-radius: 36rpx;
  padding: 0 32rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:active {
    opacity: 0.8;
  }
}

.send-text {
  color: $text-white;
  font-size: 28rpx;
  font-weight: 500;
}

.function-btns {
  display: flex;
  gap: 16rpx;
}

</style>