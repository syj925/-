<script>
import api from '../../utils/api.js';
import store from '../../utils/store.js';
import postActions from '../../utils/postActions.js';
import interactionActions from '../../utils/interactionActions.js';
import { formatDate, formatTime, formatDateTime } from '../../utils/dateUtil.js';
import uniIcons from '../../components/uni-icons/uni-icons.vue';

export default {
  components: {
    uniIcons
  },
  data() {
    return {
      registrationStatusLoading: false,  // 新增：注册状态加载标志
      eventId: '',
      eventInfo: {
        title: '',
        description: '',
        location: '',
        startTime: '',
        endTime: '',
        registrationDeadline: '',
        capacity: 0,
        registeredCount: 0,
        imageUrl: '',
        tags: [],
        isRegistered: false,
        organizerId: '',
        organizer: {
          username: '',
          avatar: ''
        },
        createdAt: ''
      },
      discussionList: [],
      page: 1,
      limit: 10,
      loading: false,
      noMore: false,
      refreshing: false,
      shareOptions: {
        title: '',
        summary: '',
        imageUrl: '',
        path: ''
      }
    };
  },
  
  computed: {
    formattedStartTime() {
      return this.eventInfo.startTime ? formatDateTime(this.eventInfo.startTime) : '';
    },
    formattedEndTime() {
      return this.eventInfo.endTime ? formatDateTime(this.eventInfo.endTime) : '';
    },
    formattedRegistrationDeadline() {
      return this.eventInfo.registrationDeadline ? formatDateTime(this.eventInfo.registrationDeadline) : '';
    },
    isRegistrationOver() {
      if (!this.eventInfo.registrationDeadline) return false;
      const now = new Date();
      const deadline = new Date(this.eventInfo.registrationDeadline);
      return now > deadline;
    },
    isCapacityReached() {
      return this.eventInfo.capacity > 0 && this.eventInfo.registeredCount >= this.eventInfo.capacity;
    },
    canRegister() {
      return !this.isRegistrationOver && !this.isCapacityReached && !this.eventInfo.isRegistered;
    },
    canUnregister() {
      return !this.isRegistrationOver && this.eventInfo.isRegistered;
    }
  },
  
  onLoad(options) {
    console.log('事件详情页加载，参数:', options);
    if (options.id) {
      this.eventId = options.id;
      this.loadEventInfo();
      this.loadDiscussions();
    } else {
      uni.showToast({
        title: '参数错误',
        icon: 'none'
      });
    }
    
    // 设置当前活动页面为事件详情页
    interactionActions.setActivePage(interactionActions.ACTIVE_PAGES.EVENT, { 
      eventId: this.eventId
    });
  },
  
  onShow() {
    console.log('事件详情页显示');
    
    // 重新设置活动页面
    interactionActions.setActivePage(interactionActions.ACTIVE_PAGES.EVENT, { 
      eventId: this.eventId,
      eventTitle: this.eventInfo.title
    });
    
    // 如果已登录且已有事件数据，检查注册状态
    if (store.getters.isLogin() && this.eventId) {
      console.log('页面显示时检查事件注册状态');
      // 使用延时确保UI准备就绪
      setTimeout(() => {
        this.checkRegistrationStatus();
      }, 300);
    }
  },
  
  onUnload() {
    // 页面卸载时保存状态
    console.log('事件详情页面卸载');
    
    // 将事件状态保存到全局缓存
    if (this.eventId) {
      console.log('保存事件状态到全局');
      interactionActions.broadcastStateChanges();
    }
  },
  
  methods: {
    async loadEventInfo() {
      console.log('加载事件信息，事件ID:', this.eventId);
      try {
        uni.showLoading({ title: '加载中...' });
        const result = await api.events.getById(this.eventId);
        uni.hideLoading();
        
        if (result.success && result.data) {
          console.log('获取事件信息成功:', result.data);
          this.eventInfo = result.data;
          
          // 设置分享信息
          this.shareOptions = {
            title: this.eventInfo.title,
            summary: this.eventInfo.description ? this.eventInfo.description.substring(0, 100) : '',
            imageUrl: this.eventInfo.imageUrl || '',
            path: `/pages/event/event-detail?id=${this.eventId}`
          };
          
          // 检查报名状态
          if (store.getters.isLogin()) {
            this.checkRegistrationStatus();
          }
        } else {
          console.error('获取事件信息失败:', result);
          uni.showToast({
            title: result.message || '获取事件详情失败',
            icon: 'none'
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('加载事件详情出错:', error);
        uni.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      }
    },
    
    async checkRegistrationStatus() {
      if (this.registrationStatusLoading || !this.eventId) return;
      
      console.log('检查事件注册状态，事件ID:', this.eventId);
      this.registrationStatusLoading = true;
      
      try {
        // 使用统一的交互管理模块检查注册状态
        const result = await interactionActions.checkEventRegistrationStatus(this.eventId);
        
        if (result.success) {
          console.log('获取注册状态成功:', result);
          // 更新状态
          this.eventInfo.isRegistered = result.isRegistered;
          
          // 如果有最新的注册人数，更新它
          if (result.registeredCount !== undefined) {
            this.eventInfo.registeredCount = result.registeredCount;
          }
        } else {
          console.error('获取注册状态失败:', result.error);
        }
      } catch (error) {
        console.error('检查注册状态出错:', error);
      } finally {
        this.registrationStatusLoading = false;
      }
    },
    
    async handleRegistration() {
      // 如果未登录，跳转到登录页
      if (!store.getters.isLogin()) {
        uni.navigateTo({
          url: '/pages/login/login'
        });
        return;
      }
      
      try {
        // 使用统一交互管理模块处理注册
        const result = await interactionActions.handleEventRegistration(this.eventId, this.eventInfo);
        
        if (result.success) {
          console.log('注册/取消注册操作成功:', result);
          
          // 更新状态
          this.eventInfo.isRegistered = result.isRegistered;
          if (result.registeredCount !== undefined) {
            this.eventInfo.registeredCount = result.registeredCount;
          }
          
          // 显示成功提示
          uni.showToast({
            title: result.isRegistered ? '报名成功' : '已取消报名',
            icon: 'success'
          });
          
          // 动画效果
          // 如果需要可以添加按钮动画效果
        } else {
          console.error('注册操作失败:', result.error);
          uni.showToast({
            title: result.error || '操作失败，请稍后再试',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('注册操作异常:', error);
        uni.showToast({
          title: '网络错误，请稍后再试',
          icon: 'none'
        });
      }
    },
    
    // 其他方法保持不变...
  }
}
</script> 