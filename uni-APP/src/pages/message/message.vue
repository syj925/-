<template>
  <view class="message-page">
    <view class="message-tabs">
      <view 
        class="message-tab" 
        :class="{ active: activeTab === 'notify' }"
        @tap="switchTab('notify')"
      >
        通知
      </view>
      <view 
        class="message-tab" 
        :class="{ active: activeTab === 'chat' }"
        @tap="switchTab('chat')"
      >
        私信
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
          @scrolltolower="loadMoreNotify"
        >
          <view class="message-list">
            <view 
              v-for="(item, index) in notifyList" 
              :key="index"
              class="message-item"
              @tap="handleNotifyClick(item)"
            >
              <view class="message-avatar-container">
                <image class="message-avatar" :src="item.avatar" mode="aspectFill"></image>
                <view v-if="item.badge" class="message-badge"></view>
              </view>
              
              <view class="message-content">
                <view class="message-title">{{ item.title }}</view>
                <view class="message-desc">{{ item.content }}</view>
              </view>
              
              <view class="message-right">
                <text class="message-time">{{ item.time }}</text>
              </view>
            </view>
          </view>
          
          <!-- 加载状态 -->
          <view class="message-loading" v-if="notifyLoading">
            <text class="message-loading-text">加载中...</text>
          </view>
          
          <!-- 空状态 -->
          <view class="message-empty" v-if="!notifyList.length && !notifyLoading">
            <image class="message-empty-icon" src="/static/images/common/empty.png"></image>
            <text class="message-empty-text">暂无通知</text>
          </view>
        </scroll-view>
      </swiper-item>
      
      <!-- 私信列表 -->
      <swiper-item>
        <scroll-view 
          scroll-y 
          class="message-scroll"
          @scrolltolower="loadMoreChat"
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
                <view v-if="item.badge" class="message-badge"></view>
              </view>
              
              <view class="message-content">
                <view class="message-title">{{ item.nickname }}</view>
                <view class="message-desc">{{ item.lastMessage }}</view>
              </view>
              
              <view class="message-right">
                <text class="message-time">{{ item.time }}</text>
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
export default {
  data() {
    return {
      activeTab: 'notify',
      notifyList: [],
      chatList: [],
      notifyLoading: false,
      chatLoading: false,
      // 模拟数据
      mockNotifyData: [
        {
          id: '1',
          type: 'like',
          title: '点赞通知',
          content: '张三赞了你的帖子「校园招聘会即将开始，提供各类实习岗位」',
          time: '10分钟前',
          avatar: 'https://picsum.photos/id/1005/200/200',
          badge: true,
          postId: '1'
        },
        {
          id: '2',
          type: 'comment',
          title: '评论通知',
          content: '李四评论了你的帖子「校园招聘会即将开始，提供各类实习岗位」：这个活动很不错！',
          time: '1小时前',
          avatar: 'https://picsum.photos/id/1012/200/200',
          badge: true,
          postId: '1'
        },
        {
          id: '3',
          type: 'system',
          title: '系统通知',
          content: '你的帖子因违反社区规定被删除，请查看详情',
          time: '1天前',
          avatar: 'https://picsum.photos/id/1000/200/200',
          badge: false
        }
      ],
      mockChatData: [
        {
          id: '1',
          nickname: '张三',
          lastMessage: '请问这个活动具体在哪个教室？',
          time: '10:30',
          avatar: 'https://picsum.photos/id/1005/200/200',
          badge: true
        },
        {
          id: '2',
          nickname: '李四',
          lastMessage: '好的，谢谢！',
          time: '昨天',
          avatar: 'https://picsum.photos/id/1012/200/200',
          badge: false
        }
      ]
    };
  },
  onLoad() {
    // 加载通知和私信数据
    this.loadNotifyData();
    this.loadChatData();
  },
  methods: {
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
    loadNotifyData() {
      this.notifyLoading = true;
      
      // 模拟请求
      setTimeout(() => {
        this.notifyList = [...this.mockNotifyData];
        this.notifyLoading = false;
      }, 1000);
    },
    
    // 加载私信数据
    loadChatData() {
      this.chatLoading = true;
      
      // 模拟请求
      setTimeout(() => {
        this.chatList = [...this.mockChatData];
        this.chatLoading = false;
      }, 1000);
    },
    
    // 加载更多通知
    loadMoreNotify() {
      if (this.notifyLoading) return;
      
      this.notifyLoading = true;
      
      // 模拟请求
      setTimeout(() => {
        // 随机添加1-2条新通知
        const newCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < newCount; i++) {
          const randIndex = Math.floor(Math.random() * this.mockNotifyData.length);
          const newItem = {
            ...this.mockNotifyData[randIndex],
            id: Date.now() + '_' + i
          };
          this.notifyList.push(newItem);
        }
        
        this.notifyLoading = false;
      }, 1000);
    },
    
    // 加载更多私信
    loadMoreChat() {
      if (this.chatLoading) return;
      
      this.chatLoading = true;
      
      // 模拟请求
      setTimeout(() => {
        // 随机添加1条新私信
        if (Math.random() > 0.5) {
          const randIndex = Math.floor(Math.random() * this.mockChatData.length);
          const newItem = {
            ...this.mockChatData[randIndex],
            id: Date.now() + '',
            lastMessage: '你好，请问你有空吗？',
            time: '刚刚',
          };
          this.chatList.push(newItem);
        }
        
        this.chatLoading = false;
      }, 1000);
    },
    
    // 处理通知点击
    handleNotifyClick(item) {
      console.log('点击通知:', item);
      
      // 根据通知类型不同处理
      switch(item.type) {
        case 'like':
        case 'comment':
          if (item.postId) {
            uni.navigateTo({
              url: `/pages/post/detail?id=${item.postId}`
            });
          }
          break;
        case 'system':
          uni.showModal({
            title: item.title,
            content: item.content,
            showCancel: false
          });
          break;
      }
    },
    
    // 处理私信点击
    handleChatClick(item) {
      console.log('点击私信:', item);
      uni.showToast({
        title: '私信功能开发中',
        icon: 'none'
      });
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.message-page {
  height: 100vh;
  background-color: $bg-page;
  display: flex;
  flex-direction: column;
}

.message-tabs {
  @include flex(row, center, center);
  background-color: $bg-card;
  padding: $spacing-md 0;
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

.message-swiper {
  flex: 1;
}

.message-scroll {
  height: 100%;
}

.message-list {
  padding: $spacing-md;
}

.message-item {
  @include flex(row, flex-start, center);
  background-color: $bg-card;
  border-radius: $radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
}

.message-avatar-container {
  position: relative;
  margin-right: $spacing-md;
}

.message-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
}

.message-badge {
  position: absolute;
  top: 0;
  right: 0;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background-color: $accent-red;
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
</style> 