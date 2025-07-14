<template>
  <view class="event-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-left" @tap="goBack">
        <image class="back-icon" src="/static/icons/icon_ztc.png" mode="aspectFit"></image>
      </view>
      <view class="navbar-title">活动详情</view>
      <view class="navbar-right">
        <image class="share-icon" src="/static/icons/share.png" mode="aspectFit" @tap="shareEvent"></image>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view class="loading-container" v-if="loading">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 活动内容 -->
    <view class="event-content" v-else>
      <!-- 活动封面 -->
      <view class="event-cover">
        <image class="cover-image" :src="eventInfo.coverImage" mode="aspectFill"></image>
        <view class="event-status" :class="eventInfo.statusClass">{{eventInfo.statusText}}</view>
      </view>
      
      <!-- 活动标题和基本信息 -->
      <view class="event-header">
        <text class="event-title">{{eventInfo.title}}</text>
        <view class="event-organizer">
          <image class="organizer-avatar" :src="eventInfo.creator.avatar" mode="aspectFill"></image>
          <text class="organizer-name">{{eventInfo.creator.name}}</text>
        </view>
      </view>
      
      <!-- 活动时间地点 -->
      <view class="event-info-card">
        <view class="info-item">
          <image class="info-icon" src="/static/icons/time.png" mode="aspectFit"></image>
          <view class="info-content">
            <text class="info-label">活动时间</text>
            <text class="info-value">{{eventInfo.startTime}}</text>
          </view>
        </view>
        <view class="divider"></view>
        <view class="info-item">
          <image class="info-icon" src="/static/icons/location.png" mode="aspectFit"></image>
          <view class="info-content">
            <text class="info-label">活动地点</text>
            <text class="info-value">{{eventInfo.location}}</text>
          </view>
          <view class="location-action" @tap="openMap">
            <text>导航</text>
          </view>
        </view>
      </view>
      
      <!-- 活动报名信息 -->
      <view class="event-info-card">
        <view class="info-item">
          <image class="info-icon" src="/static/icons/people.png" mode="aspectFit"></image>
          <view class="info-content">
            <text class="info-label">报名人数</text>
            <text class="info-value">{{eventInfo.currentParticipants}}/{{eventInfo.maxParticipants === 0 ? '不限' : eventInfo.maxParticipants}} 人</text>
          </view>
        </view>
        <view class="divider"></view>
        <view class="info-item">
          <image class="info-icon" src="/static/icons/calendar.png" mode="aspectFit"></image>
          <view class="info-content">
            <text class="info-label">报名截止</text>
            <text class="info-value">{{eventInfo.registrationDeadline}}</text>
          </view>
        </view>
      </view>
      
      <!-- 活动详情 -->
      <view class="event-detail-card">
        <text class="card-title">活动详情</text>
        <text class="event-description">{{eventInfo.description}}</text>
        
        <!-- 活动详情图片 -->
        <view class="event-images" v-if="eventInfo.images && eventInfo.images.length">
          <image 
            class="detail-image" 
            v-for="(img, index) in eventInfo.images" 
            :key="index" 
            :src="img" 
            mode="widthFix"
            @tap="previewImage(index)"
          ></image>
        </view>
      </view>
      
      <!-- 活动须知 -->
      <view class="event-notice-card">
        <text class="card-title">活动须知</text>
        <view class="notice-item" v-for="(item, index) in eventInfo.notices" :key="index">
          <text class="notice-dot">•</text>
          <text class="notice-text">{{item}}</text>
        </view>
      </view>
      
      <!-- 参与用户 -->
      <view class="participants-card" v-if="eventInfo.participants && eventInfo.participants.length">
        <view class="card-header">
          <text class="card-title">参与用户</text>
          <text class="view-all" @tap="viewAllParticipants">查看全部</text>
        </view>
        <view class="avatar-list">
          <image 
            class="participant-avatar" 
            v-for="(user, index) in eventInfo.participants.slice(0, 8)" 
            :key="index" 
            :src="user.avatar" 
            mode="aspectFill"
          ></image>
          <view class="more-avatar" v-if="eventInfo.participants.length > 8">
            <text>+{{eventInfo.participants.length - 8}}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部按钮 -->
    <view class="bottom-bar">
      <view v-if="eventInfo.status === 'registered' && eventInfo.allowCancelRegistration" 
            class="cancel-btn" 
            @click="cancelRegistration">取消报名</view>
      <view v-else 
            class="register-btn" 
            :class="{ disabled: !canRegister }" 
            @click="canRegister && showRegistrationForm()">
        {{ registerBtnText }}
      </view>
    </view>
    
    <!-- 表单弹窗 -->
    <view class="form-popup" v-if="showForm">
      <view class="form-container">
        <view class="form-header">
          <text class="form-title">填写报名信息</text>
          <text class="form-close" @click="closeForm">×</text>
        </view>
        <scroll-view class="form-body" scroll-y>
          <view class="form-item" v-for="(field, index) in formConfig" :key="index">
            <view class="form-label">
              {{ field.label }}
              <text class="required" v-if="field.required">*</text>
            </view>
            
            <!-- 文本输入 -->
            <input v-if="field.type === 'text'" 
                   class="form-input" 
                   v-model="formData[field.name]" 
                   :placeholder="'请输入' + field.label" />
            
            <!-- 数字输入 -->
            <input v-else-if="field.type === 'number'" 
                   class="form-input" 
                   type="number" 
                   v-model="formData[field.name]" 
                   :placeholder="'请输入' + field.label" />
            
            <!-- 电话输入 -->
            <input v-else-if="field.type === 'tel'" 
                   class="form-input" 
                   type="number" 
                   v-model="formData[field.name]" 
                   :placeholder="'请输入' + field.label" />
            
            <!-- 邮箱输入 -->
            <input v-else-if="field.type === 'email'" 
                   class="form-input" 
                   v-model="formData[field.name]" 
                   :placeholder="'请输入' + field.label" />
            
            <!-- 选择器 -->
            <picker v-else-if="field.type === 'select'" 
                    :range="field.options" 
                    @change="(e) => formData[field.name] = field.options[e.detail.value]" 
                    class="form-picker">
              <view class="picker-value">
                {{ formData[field.name] || '请选择' + field.label }}
              </view>
            </picker>
            
            <!-- 多行文本 -->
            <textarea v-else-if="field.type === 'textarea'" 
                      class="form-textarea" 
                      v-model="formData[field.name]" 
                      :placeholder="'请输入' + field.label" />
            
            <view class="error-message" v-if="formValidationErrors[field.name]">
              {{ formValidationErrors[field.name] }}
            </view>
          </view>
        </scroll-view>
        <view class="form-footer">
          <view class="submit-btn" @click="submitForm">确认提交</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '../../utils/api.js';
import store from '../../utils/store.js'; // 导入store
import request from '@/utils/request';

export default {
  data() {
    return {
      eventId: '',
      canRegister: false,
      registerBtnText: '报名',
      loading: false,
      formConfig: [],
      formData: {},
      showForm: false,
      formValidationErrors: {},
      eventInfo: {
        id: '',
        title: '',
        description: '',
        location: '',
        startTime: '',
        endTime: '',
        status: '',
        originalStatus: '',
        coverImage: '',
        maxParticipants: 0,
        currentParticipants: 0,
        creator: {
          id: '',
          name: '',
          avatar: ''
        },
        participants: [],
        allowCancelRegistration: true,
        registrationDeadline: null,
        registrationFields: []
      }
    };
  },
  onLoad(options) {
    console.log('页面加载参数:', options);
    
    if (options.id) {
      this.eventId = options.id;
      this.loadEventInfo();
    } else {
      uni.showToast({
        title: '活动ID无效',
        icon: 'none'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  },
  onUnload() {
    // 清理状态监控器
    this.stopStatusMonitor();
  },
  methods: {
    // 状态监控器
    startStatusMonitor() {
      this.statusMonitorId = setInterval(() => {
        const userInfo = store.getters.getUser();
        const isLogin = store.getters.isLogin();
        
        // 如果用户登录了但是状态不是registered，再次检查报名状态
        if (isLogin && userInfo && userInfo.id && 
            this.eventInfo.status !== 'registered' && 
            this.eventInfo.status !== 'full' && 
            this.eventInfo.status !== 'ended' && 
            this.eventInfo.status !== 'canceled') {
          
          // 每5次状态监控（约25秒），进行一次强制检查
          this.monitorCount = (this.monitorCount || 0) + 1;
          if (this.monitorCount % 5 === 0) {
            this.forceCheckRegistration(this.eventId);
          } else {
            // 普通检查
            this.checkUserRegistration(this.eventId);
          }
        }
      }, 5000); // 每5秒检查一次
    },
    stopStatusMonitor() {
      if (this.statusMonitorId) {
        clearInterval(this.statusMonitorId);
      }
    },
    goBack() {
      uni.navigateBack();
    },
    async loadEventInfo() {
      try {
        uni.showLoading({
          title: '加载中...'
        });
        
        console.log('开始请求活动详情:', this.eventId);
        
        const result = await request({
          url: `/events/${this.eventId}`,
          method: 'GET'
        });
        
        uni.hideLoading();
        
        console.log('活动详情API响应:', JSON.stringify(result));
        
        if ((result.code === 0 || result.success === true) && result.data) {
          // 格式化活动数据
          console.log('原始活动数据:', JSON.stringify(result.data));
          const formattedData = this.formatEventData(result.data);
          
          // 更新活动信息
          this.eventInfo = formattedData;
          
          // 更新按钮状态
          this.updateButtonStatus();
          
          // 加载表单配置
          this.loadFormConfig();
          
          // 启动状态监控
          this.startStatusMonitor();
          
          console.log('活动详情加载成功，格式化后数据:', JSON.stringify(formattedData));
        } else {
          uni.showToast({
            title: result.message || '加载活动详情失败',
            icon: 'none'
          });
          console.error('活动详情API响应异常:', result);
        }
      } catch (error) {
        uni.hideLoading();
        console.error('加载活动详情失败:', error);
        uni.showToast({
          title: '加载活动详情失败，请稍后重试',
          icon: 'none'
        });
      }
    },
    
    // 格式化API返回的活动数据
    formatEventData(eventData) {
      console.log('开始格式化活动数据:', eventData);
      
      // 处理封面图片
      console.log('原始封面图片:', eventData.coverImage, '类型:', typeof eventData.coverImage);
      let coverImage = eventData.coverImage || 'https://via.placeholder.com/400x200?text=活动封面';
      if (coverImage && !coverImage.startsWith('http')) {
        console.log('封面图片不是完整URL，添加baseUrl前缀');
        coverImage = this.$baseUrl + coverImage;
      }
      console.log('处理后的封面图片:', coverImage);
      
      // 处理创建者头像
      let creatorAvatar = eventData.creator?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg';
      if (creatorAvatar && !creatorAvatar.startsWith('http')) {
        creatorAvatar = this.$baseUrl + creatorAvatar;
      }
      
      // 处理详情图片
      let detailImages = [];
      if (eventData.detailImages && eventData.detailImages.length) {
        detailImages = eventData.detailImages.map(img => {
          if (img && !img.startsWith('http')) {
            return this.$baseUrl + img;
          }
          return img;
        });
        console.log('处理后的详情图片:', detailImages);
      }
      
      // 处理参与者列表
      let participantList = [];
      if (eventData.participants && eventData.participants.length) {
        participantList = eventData.participants.map(user => {
          let avatar = user.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg';
          if (avatar && !avatar.startsWith('http')) {
            avatar = this.$baseUrl + avatar;
          }
          return {
            ...user,
            avatar
          };
        });
        console.log('处理后的参与者列表:', participantList.length);
      }
      
      // 处理通知
      let notices = eventData.notices || [];
      console.log('处理后的通知:', notices);
      
      // 处理时间格式
      const formattedTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      };
      
      // 处理截止日期
      let deadline = eventData.registrationDeadline ? formattedTime(eventData.registrationDeadline) : '无限制';
      console.log('处理后的报名截止日期:', deadline);
      
      // 处理状态
      let status = eventData.status || 'upcoming';
      let statusText = '';
      let statusClass = '';
      
      // 保存原始状态
      const originalStatus = status;
      
      // 检查是否已注册
      const isRegistered = eventData.isRegistered || false;
      if (isRegistered) {
        status = 'registered';
      }
      
      // 检查是否已满
      if (eventData.maxParticipants > 0 && eventData.currentParticipants >= eventData.maxParticipants && status !== 'registered') {
        status = 'full';
      }
      
      // 设置状态文本和类名
      switch (status) {
        case 'upcoming':
          statusText = '即将开始';
          statusClass = 'status-upcoming';
          break;
        case 'ongoing':
          statusText = '进行中';
          statusClass = 'status-ongoing';
          break;
        case 'ended':
          statusText = '已结束';
          statusClass = 'status-ended';
          break;
        case 'cancelled':
          statusText = '已取消';
          statusClass = 'status-cancelled';
          break;
        case 'full':
          statusText = '名额已满';
          statusClass = 'status-full';
          break;
        case 'registered':
          statusText = '已报名';
          statusClass = 'status-registered';
          break;
        default:
          statusText = '未知状态';
          statusClass = '';
      }
      
      console.log('处理后的状态:', { originalStatus, status, statusText, statusClass });
      
      // 处理注册字段
      let registrationFields = [];
      if (eventData.registrationFields && Array.isArray(eventData.registrationFields)) {
        registrationFields = eventData.registrationFields;
        console.log('活动包含注册字段, 数量:', registrationFields.length, '内容:', JSON.stringify(registrationFields));
        
        // 如果有registrationFields，直接初始化表单配置
        this.formConfig = registrationFields;
        this.initFormData();
      } else {
        console.log('活动不包含注册字段或格式不正确:', eventData.registrationFields);
      }
      
      return {
        id: eventData.id,
        title: eventData.title || '活动标题',
        coverImage: coverImage,
        images: detailImages,
        status: status,
        statusText: statusText,
        statusClass: statusClass,
        originalStatus: originalStatus,
        location: eventData.location || '活动地点',
        startTime: formattedTime(eventData.startTime),
        endTime: formattedTime(eventData.endTime),
        creator: {
          id: eventData.creator?.id || '',
          name: eventData.creator?.name || '活动组织者',
          avatar: creatorAvatar
        },
        maxParticipants: eventData.maxParticipants || 0,
        currentParticipants: eventData.currentParticipants || 0,
        description: eventData.description || '暂无活动描述',
        notices: notices,
        registrationDeadline: deadline,
        participants: participantList || [],
        allowCancelRegistration: eventData.allowCancelRegistration !== false,
        registrationFields: registrationFields
      };
    },
    
    // 检查用户是否已报名
    checkUserRegistration(eventId) {
      const userInfo = store.getters.getUser();
      const isLogin = store.getters.isLogin();
      
      if (!isLogin || !userInfo || !userInfo.id) {
        return Promise.resolve(false);
      }
      
      // 首先检查本地缓存
      try {
        const registrationKey = `event_registered_${eventId}_${userInfo.id}`;
        const cachedStatus = uni.getStorageSync(registrationKey);
        
        if (cachedStatus === 'registered') {
          this.eventInfo.status = 'registered';
          this.updateButtonStatus();
          return Promise.resolve(true);
        }
      } catch (err) {
        console.error('读取本地缓存失败:', err);
      }
      
      return api.events.checkRegistrationStatus(eventId)
        .then(result => {
          if (result && result.success && result.data) {
            if (result.data.isRegistered) {
              this.eventInfo.status = 'registered';
              this.updateButtonStatus();
              
              // 保存报名状态到本地
              this.saveRegistrationStatus(eventId);
              
              return true;
            } else {
              return false;
            }
          } else {
            return false;
          }
        })
        .catch(err => {
          console.error('检查报名状态失败:', err);
          return false;
        });
    },
    
    // 获取报名截止文本
    getDeadlineText(startTime) {
      const deadline = new Date(startTime);
      deadline.setDate(deadline.getDate() - 1); // 假设截止日期为活动前一天
      return deadline.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' 23:59';
    },
    
    // 更新按钮状态
    updateButtonStatus() {
      const { status, maxParticipants, currentParticipants } = this.eventInfo;
      
      // 根据事件状态设置按钮文本和可点击状态
      switch (status) {
        case 'registered':
          this.registerBtnText = '已报名';
          this.canRegister = false;
          break;
        case 'full':
          this.registerBtnText = '名额已满';
          this.canRegister = false;
          break;
        case 'ended':
          this.registerBtnText = '活动已结束';
          this.canRegister = false;
          break;
        case 'canceled':
          this.registerBtnText = '活动已取消';
          this.canRegister = false;
          break;
        case 'upcoming':
          this.registerBtnText = '未开始';
            this.canRegister = false;
          break;
        case 'ongoing':
          // 检查是否已达到人数上限
          if (maxParticipants > 0 && currentParticipants >= maxParticipants) {
            this.registerBtnText = '名额已满';
            this.canRegister = false;
          } else {
            this.registerBtnText = '立即报名';
            this.canRegister = true;
          }
          break;
        default:
          this.registerBtnText = '立即报名';
          this.canRegister = true;
      }
      
      // 检查报名截止日期
      if (this.eventInfo.registrationDeadline) {
        const now = new Date();
        const deadline = new Date(this.eventInfo.registrationDeadline);
        
        if (now > deadline) {
          this.registerBtnText = '报名已截止';
          this.canRegister = false;
        }
      }
    },
    
    // 检查是否有静态数据
    hasStaticEventData() {
      const staticEvents = {
        '301': true,
        '302': true,
        '303': true
      };
      return staticEvents[this.eventId];
    },
    
    // 使用静态数据（用于开发和测试）
    useStaticEventData() {
      const events = {
        '301': {
          title: '校园歌手大赛',
          image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
          organizer: {
            name: '校学生会',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
          },
          time: '2023年5月25日 14:00-17:00',
          location: '大学生活动中心',
          participants: 145,
          maxParticipants: 200,
          deadline: '2023年5月20日 23:59',
          description: '第十届校园歌手大赛即将开始！本次比赛面向全校学生，不限专业年级，只要你热爱音乐、热爱唱歌，就可以来展示自己的才艺。比赛将分为初赛、复赛和决赛三个阶段，优胜者将获得丰厚奖品和参加市级歌手大赛的机会。',
          images: [
            'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
            'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
            'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
          ],
          notices: [
            '参赛者需提前准备一首歌曲，时长不超过5分钟',
            '可自带伴奏音乐或现场弹唱',
            '初赛将于5月25日在大学生活动中心举行',
            '复赛将于6月1日在学术报告厅举行',
            '决赛将于6月10日在大礼堂举行'
          ],
          participantList: [
            { avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/women/4.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/men/5.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/women/6.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/men/7.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/women/8.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/men/9.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/women/10.jpg' }
          ],
          status: 'upcoming',
          statusText: '即将开始',
          statusClass: 'status-upcoming'
        },
        '302': {
          title: '毕业季摄影展',
          image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
          organizer: {
            name: '摄影协会',
            avatar: 'https://randomuser.me/api/portraits/men/67.jpg'
          },
          time: '2023年6月10日 - 6月20日',
          location: '图书馆展览厅',
          participants: 75,
          maxParticipants: 100,
          deadline: '2023年6月5日 23:59',
          description: '为纪念即将毕业的2023届同学，摄影协会举办毕业季摄影展，展示校园美景和毕业生活动的精彩瞬间。欢迎同学们投稿参展，也欢迎大家前来参观。',
          images: [
            'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
            'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
          ],
          notices: [
            '投稿作品需为原创，不得侵犯他人肖像权',
            '每人最多投稿3幅作品',
            '投稿截止日期为6月5日',
            '入选作品将在图书馆展览厅展出'
          ],
          participantList: [
            { avatar: 'https://randomuser.me/api/portraits/women/22.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/men/23.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/women/24.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/men/25.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/women/26.jpg' }
          ],
          status: 'registration',
          statusText: '报名中',
          statusClass: 'status-registration'
        },
        '303': {
          title: '创新创业大赛',
          image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1632&q=80',
          organizer: {
            name: '创业学院',
            avatar: 'https://randomuser.me/api/portraits/men/42.jpg'
          },
          time: '2023年6月15日 9:00-17:00',
          location: '科技楼报告厅',
          participants: 50,
          maxParticipants: 50,
          deadline: '2023年6月1日 23:59',
          description: '第五届创新创业大赛旨在培养大学生的创新意识和创业能力，挖掘优秀创业项目。参赛者需组队参加，每队3-5人，提交商业计划书和项目展示PPT。',
          images: [
            'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1632&q=80',
            'https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
            'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
          ],
          notices: [
            '参赛者需组队参加，每队3-5人',
            '需提交商业计划书和项目展示PPT',
            '初赛提交材料审核，复赛现场路演',
            '优胜者将获得创业基金和孵化机会'
          ],
          participantList: [
            { avatar: 'https://randomuser.me/api/portraits/men/31.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/women/32.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/men/33.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/women/34.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/men/35.jpg' },
            { avatar: 'https://randomuser.me/api/portraits/women/36.jpg' }
          ],
          status: 'full',
          statusText: '名额已满',
          statusClass: 'status-full'
        }
      };
      
      if (events[this.eventId]) {
        this.eventInfo = events[this.eventId];
        this.updateButtonStatus();
      } else {
        this.useDefaultEventInfo();
      }
    },
    
    // 使用默认信息
    useDefaultEventInfo() {
      this.eventInfo = {
        title: '活动详情',
        image: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1632&q=80',
        organizer: {
          name: '未知组织者',
          avatar: 'https://randomuser.me/api/portraits/lego/1.jpg'
        },
        time: '暂无时间信息',
        location: '暂无地点信息',
        participants: 0,
        maxParticipants: 0,
        deadline: '暂无截止日期',
        description: '暂无活动描述',
        images: [],
        notices: ['暂无活动须知'],
        participantList: [],
        status: 'unknown',
        statusText: '未知状态',
        statusClass: '',
        originalStatus: '',
        allowCancelRegistration: false,
        registrationDeadline: null,
        registrationFields: []
      };
      
      this.canRegister = false;
      this.registerBtnText = '活动不存在';
    },
    // 保存报名状态到本地
    saveRegistrationStatus(eventId) {
      try {
        const userInfo = store.getters.getUser();
        if (userInfo && userInfo.id) {
          const registrationKey = `event_registered_${eventId}_${userInfo.id}`;
          uni.setStorageSync(registrationKey, 'registered');
        }
      } catch (err) {
        console.error('保存报名状态失败:', err);
      }
    },
    registerEvent() {
      console.log('旧的报名方法被调用，使用新的showRegistrationForm方法代替');
      this.showRegistrationForm();
    },
    
    // 提交表单
    submitForm() {
      // 验证表单
      if (!this.validateForm()) {
        return;
      }
      
      // 关闭表单弹窗
      this.showForm = false;
      
      // 确认报名
      this.confirmRegistration();
    },
    
    // 验证表单
    validateForm() {
      this.formValidationErrors = {};
      let isValid = true;
      
      if (this.formConfig && this.formConfig.length > 0) {
        this.formConfig.forEach(field => {
          const fieldName = field.name;
          const value = this.formData[fieldName] || '';
          
          if (field.required && (!value || value.trim() === '')) {
            this.formValidationErrors[fieldName] = `${field.label || field.name}不能为空`;
            isValid = false;
          } else if (field.type === 'tel' && value && !/^1\d{10}$/.test(value)) {
            this.formValidationErrors[fieldName] = '请输入正确的手机号';
            isValid = false;
          } else if (field.type === 'email' && value && !/^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(value)) {
            this.formValidationErrors[fieldName] = '请输入正确的邮箱';
            isValid = false;
          }
        });
      }
      
      if (!isValid) {
        uni.showToast({
          title: '请正确填写所有必填项',
          icon: 'none'
        });
      }
      
      return isValid;
    },
    
    // 确认报名
    confirmRegistration() {
      uni.showModal({
        title: '报名确认',
        content: `确定要报名参加"${this.eventInfo.title}"活动吗？`,
        success: (res) => {
          if (res.confirm) {
            uni.showLoading({
              title: '报名中...'
            });
            
            // 调用API报名参加活动，传递表单数据
            api.events.register(this.eventId, this.formData).then(res => {
              uni.hideLoading();
              
              if (res.success) {
                uni.showToast({
                  title: '报名成功',
                  icon: 'success'
                });
                
                // 立即更新状态为已报名
                this.eventInfo.status = 'registered';
                this.updateButtonStatus();
                
                // 保存报名状态到本地
                this.saveRegistrationStatus(this.eventId);
                
                // 更新报名人数
                this.eventInfo.currentParticipants++;
                
                // 模拟添加自己到参与者列表
                const userInfo = store.getters.getUser();
                const avatar = userInfo?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg';
                
                this.eventInfo.participants.unshift({
                  avatar: avatar
                });
              } else {
                // 处理"已参加"错误，将状态更新为registered
                if (res.message && (
                    res.message.includes('已经参加') || 
                    res.message.includes('已参加') || 
                    res.message.includes('已报名')
                  )) {
                  // 显示已报名提示
                  uni.showToast({
                    title: '您已经报名过此活动',
                    icon: 'none'
                  });
                  
                  // 更新状态
                  this.eventInfo.status = 'registered';
                  this.updateButtonStatus();
                  
                  // 保存报名状态到本地
                  this.saveRegistrationStatus(this.eventId);
                } else {
                  // 其他错误
                  uni.showToast({
                    title: res.message || '报名失败',
                    icon: 'none'
                  });
                }
              }
            }).catch(err => {
              uni.hideLoading();
              console.error('报名请求失败:', err);
              
              // 处理"已参加"错误，将状态更新为registered
              if (err.data && err.data.message && (
                  err.data.message.includes('已经参加') || 
                  err.data.message.includes('已参加') || 
                  err.data.message.includes('已报名')
                )) {
                // 显示已报名提示
                uni.showToast({
                  title: '您已经报名过此活动',
                  icon: 'none'
                });
                
                // 更新状态
                this.eventInfo.status = 'registered';
                this.updateButtonStatus();
                
                // 保存报名状态到本地
                this.saveRegistrationStatus(this.eventId);
              } else {
                uni.showToast({
                  title: '报名失败，请稍后再试',
                  icon: 'none'
                });
              }
            });
          }
        }
      });
    },
    shareEvent() {
      uni.showToast({
        title: '分享功能开发中',
        icon: 'none'
      });
    },
    openMap() {
      // 这里可以集成地图API，根据活动地点打开地图应用
      if (!this.eventInfo.location) {
        uni.showToast({
          title: '暂无地点信息',
          icon: 'none'
        });
        return;
      }
      
      uni.showModal({
        title: '打开地图',
        content: `是否导航到"${this.eventInfo.location}"？`,
        success: (res) => {
          if (res.confirm) {
            // 简单处理：在地图应用中搜索地点名称
            uni.openLocation({
              latitude: 0, // 这里需要真实的经纬度数据
              longitude: 0,
              name: this.eventInfo.title,
              address: this.eventInfo.location,
              success: function() {
                console.log('打开地图成功');
              },
              fail: function() {
                uni.showToast({
                  title: '打开地图失败',
                  icon: 'none'
                });
              }
            });
          }
        }
      });
    },
    viewAllParticipants() {
      uni.showToast({
        title: '查看全部参与用户',
        icon: 'none'
      });
    },
    previewImage(index) {
      uni.previewImage({
        urls: this.eventInfo.images,
        current: this.eventInfo.images[index]
      });
    },
    // 强制检查并同步用户报名状态
    forceCheckRegistration(eventId) {
      const userInfo = store.getters.getUser();
      const isLogin = store.getters.isLogin();
      
      if (!isLogin || !userInfo || !userInfo.id) {
        return Promise.resolve(false);
      }
      
      // 首先检查本地缓存
      try {
        const registrationKey = `event_registered_${eventId}_${userInfo.id}`;
        const cachedStatus = uni.getStorageSync(registrationKey);
        
        if (cachedStatus === 'registered') {
          this.eventInfo.status = 'registered';
          this.updateButtonStatus();
          return Promise.resolve(true);
        }
      } catch (err) {
        console.error('读取本地缓存失败:', err);
      }
      
      // 先检查用户是否已报名（通过正常API）
      return this.checkUserRegistration(eventId)
        .then(isRegistered => {
          if (isRegistered) {
            return true;
          }
          
          // 如果API返回未报名，不再自动尝试报名
          return false;
        });
    },
    // 加载表单配置
    loadFormConfig() {
      console.log('开始加载表单配置...');
      // 如果已经有表单配置，直接使用
      if (this.eventInfo.registrationFields && 
          Array.isArray(this.eventInfo.registrationFields) && 
          this.eventInfo.registrationFields.length > 0) {
        
        console.log('使用已有表单配置, 数量:', this.eventInfo.registrationFields.length);
        this.formConfig = this.eventInfo.registrationFields;
        this.initFormData();
        return Promise.resolve(this.formConfig);
      }
      
      // 否则请求表单配置
      console.log('没有已有表单配置，发起API请求获取...');
      return api.events.getFormConfig(this.eventId).then(res => {
        if (res.success && res.data) {
          console.log('API获取到表单配置:', res.data);
          // 保存表单配置
          this.formConfig = res.data.registrationFields || [];
          // 保存是否可取消报名
          this.canCancel = res.data.allowCancelRegistration || false;
          // 保存报名截止日期
          this.registrationDeadline = res.data.registrationDeadline;
          
          // 初始化表单数据
          this.initFormData();
          
          console.log('表单配置已设置，字段数:', this.formConfig.length);
          return this.formConfig;
        } else {
          console.error('获取表单配置失败:', res);
          return [];
        }
      }).catch(err => {
        console.error('获取表单配置请求异常:', err);
        return [];
      });
    },
    
    // 初始化表单数据
    initFormData() {
      const formData = {};
      
      // 根据配置初始化表单数据
      if (this.formConfig && this.formConfig.length > 0) {
        this.formConfig.forEach(field => {
          // 设置默认值
          formData[field.name] = field.defaultValue || '';
        });
        console.log('初始化表单数据完成:', formData);
      } else {
        console.log('没有表单配置，无法初始化表单数据');
      }
      
      this.formData = formData;
    },
    // 取消报名
    cancelRegistration() {
      if (this.eventInfo.status !== 'registered') {
        return;
      }
      
      uni.showModal({
        title: '确认取消',
        content: '确定要取消报名吗？',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({
              title: '取消中...'
            });
            
            try {
              const result = await request({
                url: `/events/${this.eventId}/cancel`,
                method: 'POST'
              });
              
              if (result.code === 0) {
                uni.showToast({
                  title: '取消报名成功',
                  icon: 'success'
                });
                
                // 重新加载事件信息
                this.loadEventInfo();
              } else {
                uni.showToast({
                  title: result.message || '取消报名失败',
                  icon: 'none'
                });
              }
            } catch (error) {
              console.error('取消报名失败:', error);
              uni.showToast({
                title: '取消报名失败，请稍后重试',
                icon: 'none'
              });
            } finally {
              uni.hideLoading();
            }
          }
        }
      });
    },
    // 显示报名表单
    showRegistrationForm() {
      console.log('尝试显示报名表单...');
      // 检查用户是否已登录
      const userInfo = store.getters.getUser();
      const isLogin = store.getters.isLogin();
      
      if (!isLogin || !userInfo || !userInfo.id) {
        console.log('用户未登录，显示登录提示');
        uni.showModal({
          title: '请先登录',
          content: '您需要先登录才能报名参加活动',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/login/login'
              });
            }
          }
        });
        return;
      }
      
      // 再次检查用户是否已经报名（避免缓存问题导致重复报名）
      this.checkUserRegistration(this.eventId).then(isRegistered => {
        if (isRegistered) {
          console.log('用户已报名，无需再次报名');
          this.saveRegistrationStatus(this.eventId); // 保存报名状态
          uni.showToast({
            title: '您已经报名过此活动',
            icon: 'none'
          });
          return;
        }
        
        // 检查是否配置了表单
        if (this.formConfig && this.formConfig.length > 0) {
          // 显示表单弹窗
          console.log('显示报名表单，表单字段数:', this.formConfig.length);
          this.showForm = true;
        } else {
          console.log('没有表单配置，直接确认报名');
          // 无表单配置，直接确认报名
          this.confirmRegistration();
        }
      });
    },
    
    // 关闭表单
    closeForm() {
      this.showForm = false;
      this.formValidationErrors = {};
    },
  }
}
</script>

<style>
.event-container {
  min-height: 100vh;
  background-color: #F5F9FF;
  padding-bottom: 70px; /* 底部按钮高度 */
}

/* 顶部导航栏 */
.navbar {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 15px;
  background-color: rgba(255, 255, 255, 0.9);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.navbar-left {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon, .share-icon {
  width: 20px;
  height: 20px;
}

.navbar-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.navbar-right {
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
  height: 300px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(74, 144, 226, 0.2);
  border-top-color: #4A90E2;
  border-radius: 50%;
  margin-bottom: 15px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #666;
  font-size: 14px;
}

/* 活动封面 */
.event-cover {
  position: relative;
  height: 250px;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.event-status {
  position: absolute;
  top: 54px; /* navbar height + 10px */
  right: 10px;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 500;
}

.status-upcoming {
  background-color: rgba(74, 144, 226, 0.8);
  color: #FFFFFF;
}

.status-registration {
  background-color: rgba(82, 196, 26, 0.8);
  color: #FFFFFF;
}

.status-full {
  background-color: rgba(245, 34, 45, 0.8);
  color: #FFFFFF;
}

/* 活动标题和基本信息 */
.event-header {
  padding: 15px;
  background-color: #FFFFFF;
  margin-bottom: 10px;
}

.event-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  display: block;
}

.event-organizer {
  display: flex;
  align-items: center;
}

.organizer-avatar {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  margin-right: 8px;
}

.organizer-name {
  font-size: 14px;
  color: #666;
}

/* 信息卡片通用样式 */
.event-info-card, .event-detail-card, .event-notice-card, .participants-card {
  background-color: #FFFFFF;
  border-radius: 8px;
  margin: 0 15px 15px;
  padding: 15px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

/* 活动信息项 */
.info-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.info-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
  display: block;
}

.info-value {
  font-size: 14px;
  color: #333;
  display: block;
}

.location-action {
  padding: 4px 10px;
  background-color: rgba(74, 144, 226, 0.1);
  border-radius: 15px;
  font-size: 12px;
  color: #4A90E2;
}

.divider {
  height: 1px;
  background-color: #F0F2F5;
  margin: 0 0 0 34px;
}

/* 卡片标题 */
.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
  display: block;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.view-all {
  font-size: 12px;
  color: #4A90E2;
}

/* 活动详情 */
.event-description {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 15px;
  display: block;
}

.event-images {
  margin: 0 -15px;
}

.detail-image {
  width: 100%;
  margin-bottom: 10px;
  display: block;
}

/* 活动须知 */
.notice-item {
  display: flex;
  margin-bottom: 8px;
}

.notice-dot {
  margin-right: 8px;
  color: #4A90E2;
}

.notice-text {
  flex: 1;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

/* 参与用户 */
.avatar-list {
  display: flex;
  flex-wrap: wrap;
}

.participant-avatar, .more-avatar {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  margin-right: 10px;
  margin-bottom: 10px;
}

.more-avatar {
  background-color: #F0F2F5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
}

/* 底部按钮 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 15px;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.05);
}

.register-btn {
  width: 100%;
  height: 40px;
  background-color: #4A90E2;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
}

.register-btn.disabled {
  background-color: #CCCCCC;
  color: #FFFFFF;
}

.cancel-btn {
  width: 100%;
  height: 40px;
  background-color: #FF6B6B;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
}

/* 状态样式 */
.status-ongoing {
  background-color: rgba(82, 196, 26, 0.8);
  color: #FFFFFF;
}

.status-ended {
  background-color: rgba(144, 147, 153, 0.8);
  color: #FFFFFF;
}

.status-canceled {
  background-color: rgba(245, 34, 45, 0.8);
  color: #FFFFFF;
}

/* 表单弹窗样式 */
.form-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.form-container {
  background-color: #FFFFFF;
  width: 90%;
  max-height: 80%;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.form-header {
  padding: 15px;
  border-bottom: 1px solid #EEEEEE;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-title {
  font-size: 18px;
  font-weight: 500;
  color: #333333;
}

.form-close {
  font-size: 24px;
  color: #999999;
  padding: 0 10px;
}

.form-body {
  padding: 15px;
  max-height: 400px;
}

.form-item {
  margin-bottom: 15px;
}

.form-label {
  font-size: 14px;
  color: #333333;
  margin-bottom: 5px;
}

.required {
  color: #FF0000;
  margin-left: 3px;
}

.form-input {
  width: 100%;
  height: 40px;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  padding: 0 10px;
  font-size: 14px;
}

.form-textarea {
  width: 100%;
  height: 80px;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  padding: 10px;
  font-size: 14px;
}

.form-picker {
  width: 100%;
  height: 40px;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  padding: 0 10px;
  display: flex;
  align-items: center;
}

.picker-value {
  font-size: 14px;
  color: #333333;
}

.error-message {
  font-size: 12px;
  color: #FF0000;
  margin-top: 3px;
}

.form-footer {
  padding: 15px;
  border-top: 1px solid #EEEEEE;
}

.submit-btn {
  width: 100%;
  height: 40px;
  background-color: #4A90E2;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
}

.event-cover-container {
  margin: 0 -15px;
  margin-bottom: 15px;
}

.detail-cover-image {
  width: 100%;
  display: block;
  border-radius: 4px;
  margin-bottom: 15px;
}
</style> 