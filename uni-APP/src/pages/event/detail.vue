<template>
  <view class="event-detail-container">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">
        <app-icon name="arrow-left" size="20" color="#333"></app-icon>
      </view>
      <text class="nav-title">活动详情</text>
      <view class="nav-action" @tap="handleShare">
        <app-icon name="share" size="20" color="#333"></app-icon>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 活动内容 -->
    <view v-else-if="event" class="event-content">
      <!-- 活动封面 -->
      <view class="event-cover">
        <image
          :src="getImageUrl(event.cover_image)"
          mode="aspectFill"
          class="cover-image"
        ></image>
        <view class="cover-overlay">
          <view class="event-status" :class="getStatusClass(event.status)">
            {{ getStatusText(event.status) }}
          </view>
        </view>
      </view>

      <!-- 活动信息卡片 -->
      <view class="event-card">
        <!-- 活动标题 -->
        <view class="event-title">{{ event.title }}</view>

        <!-- 活动基本信息 -->
        <view class="event-info">
          <view class="info-item">
            <app-icon name="time" size="16" color="#666"></app-icon>
            <text class="info-text">{{ formatEventTime }}</text>
          </view>
          <view class="info-item">
            <app-icon name="location" size="16" color="#666"></app-icon>
            <text class="info-text">{{ event.location }}</text>
          </view>
          <view class="info-item">
            <app-icon name="users" size="16" color="#666"></app-icon>
            <text class="info-text">{{ event.current_participants }}/{{ event.max_participants }}人</text>
          </view>
        </view>

        <!-- 组织者信息 -->
        <view class="organizer-info" @tap="viewOrganizerProfile">
          <image
            :src="getImageUrl(getOrganizerAvatar)"
            mode="aspectFill"
            class="organizer-avatar"
          ></image>
          <view class="organizer-details">
            <text class="organizer-name">{{ getOrganizerName }}</text>
            <text class="organizer-label">活动组织者</text>
          </view>
          <app-icon name="arrow-right" size="16" color="#ccc" v-if="event.organizer?.id"></app-icon>
        </view>
      </view>

      <!-- 活动描述 -->
      <view class="event-card">
        <view class="card-title">活动介绍</view>
        <view class="event-description">
          <text class="description-text">{{ event.description || '暂无活动介绍' }}</text>
        </view>

        <!-- 详情图片 -->
        <view v-if="event.detail_images && event.detail_images.length > 0" class="detail-images">
          <view class="images-title">活动图片</view>
          <view class="images-grid">
            <image
              v-for="(image, index) in event.detail_images"
              :key="index"
              :src="getImageUrl(image)"
              mode="aspectFill"
              class="detail-image"
              @tap="previewImage(index)"
            ></image>
          </view>
        </view>
      </view>

      <!-- 活动须知 -->
      <view v-if="event.notices && event.notices.length > 0" class="event-card">
        <view class="card-title">活动须知</view>
        <view class="notices-list">
          <view v-for="(notice, index) in event.notices" :key="index" class="notice-item">
            <text class="notice-dot">•</text>
            <text class="notice-text">{{ notice }}</text>
          </view>
        </view>
      </view>

      <!-- 统计信息 -->
      <view class="event-card">
        <view class="card-title">活动数据</view>
        <view class="event-stats">
          <view class="stat-item">
            <text class="stat-number">{{ event.view_count || 0 }}</text>
            <text class="stat-label">浏览量</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ event.current_participants || 0 }}</text>
            <text class="stat-label">已报名</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ getRemainingDays }}</text>
            <text class="stat-label">剩余天数</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-container">
      <app-icon name="alert-circle" size="48" color="#ccc"></app-icon>
      <text class="error-text">活动不存在或已删除</text>
      <view class="error-action" @tap="goBack">
        <text class="action-text">返回上一页</text>
      </view>
    </view>

    <!-- 报名表单弹窗 -->
    <view v-if="showRegistrationForm" class="registration-modal" @tap="closeRegistrationForm">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">报名参加活动</text>
          <view class="modal-close" @tap="closeRegistrationForm">
            <app-icon name="close" size="20" color="#666"></app-icon>
          </view>
        </view>

        <!-- 活动信息摘要 -->
        <view class="event-summary">
          <view class="summary-header">
            <text class="summary-title">确认报名活动</text>
          </view>
          <view class="event-info">
            <view class="info-row">
              <text class="info-label">活动名称</text>
              <text class="info-value">{{ event.title }}</text>
            </view>
            <view class="info-row" v-if="event.start_time">
              <text class="info-label">活动时间</text>
              <text class="info-value">{{ formatTime(event.start_time, 'YYYY-MM-DD HH:mm', true) }}</text>
            </view>
            <view class="info-row" v-if="event.location">
              <text class="info-label">活动地点</text>
              <text class="info-value">{{ event.location }}</text>
            </view>
          </view>
        </view>

        <scroll-view class="modal-body" scroll-y>
          <view class="form-section">
            <text class="section-title">请填写报名信息</text>

            <!-- 动态表单字段 -->
            <view v-for="(field, index) in formConfig" :key="index" class="form-field">
              <view class="field-label">
                <text class="label-text">{{ getFieldLabel(field) }}</text>
                <text v-if="field.required" class="required-mark">*</text>
              </view>

              <!-- 字段说明 -->
              <text v-if="field.description" class="field-hint">{{ field.description }}</text>

              <!-- 文本输入 -->
              <input
                v-if="field.type === 'text'"
                v-model="formData[field.name]"
                :placeholder="getFieldPlaceholder(field)"
                class="field-input"
                :class="{ 'error': formErrors[field.name] }"
                :maxlength="field.maxLength || 100"
              />

              <!-- 数字输入 -->
              <input
                v-else-if="field.type === 'number'"
                v-model="formData[field.name]"
                type="number"
                :placeholder="getFieldPlaceholder(field)"
                class="field-input"
                :class="{ 'error': formErrors[field.name] }"
                :min="field.min"
                :max="field.max"
              />

              <!-- 邮箱输入 -->
              <input
                v-else-if="field.type === 'email'"
                v-model="formData[field.name]"
                type="email"
                :placeholder="getFieldPlaceholder(field, '请输入邮箱地址，如：example@email.com')"
                class="field-input"
                :class="{ 'error': formErrors[field.name] }"
              />

              <!-- 电话输入 -->
              <input
                v-else-if="field.type === 'tel'"
                v-model="formData[field.name]"
                type="tel"
                :placeholder="getFieldPlaceholder(field, '请输入11位手机号码')"
                class="field-input"
                :class="{ 'error': formErrors[field.name] }"
                maxlength="11"
              />

              <!-- 多行文本 -->
              <textarea
                v-else-if="field.type === 'textarea'"
                v-model="formData[field.name]"
                :placeholder="getFieldPlaceholder(field)"
                class="field-textarea"
                :class="{ 'error': formErrors[field.name] }"
                :maxlength="field.maxLength || 500"
                show-confirm-bar
              />

              <!-- 选择器 -->
              <picker
                v-else-if="field.type === 'select'"
                :value="getSelectIndex(field.name, field.options)"
                :range="field.options"
                range-key="label"
                @change="handleSelectChange(field.name, field.options, $event)"
              >
                <view class="field-select" :class="{ 'error': formErrors[field.name] }">
                  <text class="select-text" :class="{ 'placeholder': !formData[field.name] }">
                    {{ getSelectedOptionLabel(field, formData[field.name]) || getFieldPlaceholder(field, `请选择${getFieldLabel(field)}`) }}
                  </text>
                  <app-icon name="arrow-down" size="16" color="#999"></app-icon>
                </view>
              </picker>

              <!-- 错误提示 -->
              <text v-if="formErrors[field.name]" class="field-error">{{ formErrors[field.name] }}</text>

              <!-- 字符计数 -->
              <view v-if="(field.type === 'text' || field.type === 'textarea') && field.maxLength" class="char-count">
                <text class="count-text">{{ (formData[field.name] || '').length }}/{{ field.maxLength }}</text>
              </view>
            </view>
          </view>
        </scroll-view>

        <view class="modal-footer">
          <view class="footer-buttons">
            <view class="cancel-button" @tap="closeRegistrationForm">
              <text class="button-text">取消</text>
            </view>
            <view class="submit-button" @tap="submitRegistration">
              <text class="button-text">确认报名</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view v-if="event" class="bottom-actions">
      <view class="action-left">
        <view class="action-item" @tap="handleLike">
          <app-icon :name="isLiked ? 'heart-fill' : 'heart'" size="20" :color="isLiked ? '#ff4757' : '#666'"></app-icon>
          <text class="action-text">{{ isLiked ? '已收藏' : '收藏' }}</text>
        </view>
      </view>
      <view class="action-right">
        <button
          class="register-btn"
          :class="getRegisterBtnClass()"
          :disabled="!canRegister"
          @tap="handleRegister"
        >
          {{ getRegisterBtnText() }}
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import { formatTime as utilFormatTime } from '@/utils/date'
import eventApi from '@/api/modules/event'
import AppIcon from '@/components/common/AppIcon.vue'
import UrlUtils from '@/utils/url'

export default {
  name: 'EventDetail',
  components: {
    AppIcon
  },
  data() {
    return {
      eventId: '',
      event: null,
      loading: true,
      isLiked: false,
      isRegistered: false,
      registrationStatus: null,
      // 报名表单相关
      showRegistrationForm: false,
      formConfig: [],
      formData: {},
      formErrors: {}
    }
  },
  computed: {
    formatEventTime() {
      if (!this.event) return ''

      // 使用UTC时间显示，与后台管理系统保持一致
      const startTime = utilFormatTime(this.event.start_time, 'YYYY-MM-DD HH:mm', true)
      const endTime = utilFormatTime(this.event.end_time, 'YYYY-MM-DD HH:mm', true)

      // 如果是同一天，只显示一次日期
      const startDate = utilFormatTime(this.event.start_time, 'YYYY-MM-DD', true)
      const endDate = utilFormatTime(this.event.end_time, 'YYYY-MM-DD', true)

      if (startDate === endDate) {
        const startTimeOnly = utilFormatTime(this.event.start_time, 'HH:mm', true)
        const endTimeOnly = utilFormatTime(this.event.end_time, 'HH:mm', true)
        return `${startDate} ${startTimeOnly} - ${endTimeOnly}`
      } else {
        return `${startTime} - ${endTime}`
      }
    },
    getRemainingDays() {
      if (!this.event) return 0
      const now = new Date()
      const startTime = new Date(this.event.start_time)
      const diffTime = startTime - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? diffDays : 0
    },
    canRegister() {
      if (!this.event) return false
      // 只有状态为'ongoing'（进行中）时才可以报名
      if (this.event.status !== 'ongoing') return false

      // 如果已报名，可以取消报名
      if (this.isRegistered) return true

      // 如果未报名，检查是否可以报名
      if (this.event.max_participants && this.event.current_participants >= this.event.max_participants) return false

      // 检查报名截止时间
      if (this.event.registration_deadline) {
        const now = new Date()
        const deadline = new Date(this.event.registration_deadline)
        return now < deadline
      }

      return true
    },

    getOrganizerName() {
      if (this.event?.organizer?.nickname) {
        return this.event.organizer.nickname
      }
      if (this.event?.organizer?.username) {
        return this.event.organizer.username
      }
      return '未知组织者'
    },

    getOrganizerAvatar() {
      if (this.event?.organizer?.avatar) {
        return this.event.organizer.avatar
      }
      return '/static/images/default-avatar.png'
    }
  },
  onLoad(options) {
    if (options.id) {
      this.eventId = options.id
      this.loadEventDetail()
    } else {
      this.showError('活动ID参数错误')
    }
  },
  methods: {
    async loadEventDetail() {
      try {
        this.loading = true
        console.log('开始加载活动详情，ID:', this.eventId)

        const result = await eventApi.getDetail(this.eventId)
        console.log('活动详情API响应:', result)

        if (result.code === 0 && result.data) {
          this.event = result.data

          // 处理详情图片数据
          if (typeof this.event.detail_images === 'string') {
            try {
              this.event.detail_images = JSON.parse(this.event.detail_images)
            } catch (e) {
              this.event.detail_images = []
            }
          }

          // 处理活动须知数据
          if (typeof this.event.notices === 'string') {
            try {
              this.event.notices = JSON.parse(this.event.notices)
            } catch (e) {
              this.event.notices = []
            }
          }

          // 检查报名状态
          this.checkRegistrationStatus()
        } else {
          this.showError(result.message || '获取活动详情失败')
        }
      } catch (error) {
        console.error('加载活动详情失败:', error)
        this.showError('网络错误，请重试')
      } finally {
        this.loading = false
      }
    },

    async checkRegistrationStatus() {
      const token = uni.getStorageSync('token')
      if (!token) return

      try {
        const result = await eventApi.getRegistrationStatus(this.eventId)
        if (result.code === 0) {
          this.isRegistered = result.data.is_registered
          this.registrationStatus = result.data
        }
      } catch (error) {
        console.error('检查报名状态失败:', error.message)

        // 检查是否是超时错误
        if (error.errMsg && error.errMsg.includes('timeout')) {
          uni.showToast({
            title: '网络请求超时，请重试',
            icon: 'none'
          })
        }
      }
    },



    getStatusClass(status) {
      const statusMap = {
        'upcoming': 'status-upcoming',
        'ongoing': 'status-ongoing',
        'ended': 'status-ended',
        'canceled': 'status-cancelled',
        // 兼容旧的数字格式
        0: 'status-draft',
        1: 'status-active',
        2: 'status-ended',
        3: 'status-cancelled'
      }
      return statusMap[status] || 'status-unknown'
    },

    getStatusText(status) {
      const statusMap = {
        'upcoming': '未开始',
        'ongoing': '进行中',
        'ended': '已结束',
        'canceled': '已取消',
        // 兼容旧的数字格式
        1: '未开始',
        2: '进行中',
        3: '已结束',
        4: '已取消'
      }
      return statusMap[status] || '未知状态'
    },

    getRegisterBtnClass() {
      if (this.isRegistered) return 'registered'
      if (!this.canRegister && !this.isRegistered) return 'disabled'
      return 'active'
    },

    getRegisterBtnText() {
      if (!this.event) return '加载中...'

      // 调试信息（可以移除）
      // console.log('按钮文本计算 - 活动状态:', this.event.status, '类型:', typeof this.event.status)

      // 根据管理员设置的状态判断 - 统一使用字符串格式
      if (this.event.status === 'canceled') return '活动已取消'
      if (this.event.status === 'ended') return '活动已结束'
      if (this.event.status === 'upcoming') return '活动未开始'

      // 状态为'ongoing'（进行中）时的逻辑 - 可以报名
      if (this.event.status === 'ongoing') {
        if (this.isRegistered) return '取消报名'

        // 检查人数限制
        if (this.event.max_participants && this.event.current_participants >= this.event.max_participants) {
          return '名额已满'
        }

        // 检查报名截止时间
        if (this.event.registration_deadline) {
          const now = new Date()
          const deadline = new Date(this.event.registration_deadline)
          if (now >= deadline) return '报名已截止'
        }

        return '立即报名'
      }

      return '暂不可报名'
    },

    showError(message) {
      uni.showToast({
        title: message,
        icon: 'none'
      })
    },

    goBack() {
      uni.navigateBack()
    },

    handleShare() {
      uni.showToast({
        title: '分享功能开发中',
        icon: 'none'
      })
    },

    viewOrganizerProfile() {
      if (this.event?.organizer?.id) {
        uni.navigateTo({
          url: `/pages/user/profile?id=${this.event.organizer.id}`
        })
      }
    },

    handleLike() {
      this.isLiked = !this.isLiked
      uni.showToast({
        title: this.isLiked ? '已收藏' : '已取消收藏',
        icon: 'none'
      })
    },

    async handleRegister() {
      if (!this.canRegister) return

      if (this.isRegistered) {
        // 取消报名逻辑
        await this.handleCancelRegistration()
      } else {
        // 报名逻辑
        await this.handleEventRegistration()
      }
    },

    async handleEventRegistration() {
      try {
        // 使用活动详情中的表单配置，不需要额外API调用
        this.formConfig = this.event.form_config || []

        // 如果有自定义表单字段，显示表单弹窗
        if (this.formConfig && this.formConfig.length > 0) {
          this.initFormData()
          this.showRegistrationForm = true
        } else {
          // 没有自定义表单，直接报名
          await this.submitDirectRegistration()
        }
      } catch (error) {
        console.error('处理报名失败:', error)
        uni.showToast({
          title: '处理报名失败',
          icon: 'none'
        })
      }
    },

    // 直接报名（无自定义表单）
    async submitDirectRegistration() {
      const result = await uni.showModal({
        title: '确认报名',
        content: `确定要报名参加"${this.event.title}"吗？`,
        confirmText: '确认报名',
        cancelText: '取消'
      })

      if (!result.confirm) return

      await this.doRegistration({})
    },

    // 执行实际的报名请求
    async doRegistration(formData) {
      uni.showLoading({
        title: '报名中...'
      })

      try {
        const requestData = {
          form_data: formData  // 使用正确的字段名 form_data
        }

        const response = await eventApi.register(this.eventId, requestData)

        uni.hideLoading()

        if (response.code === 0) {
          this.isRegistered = true
          this.event.current_participants = (this.event.current_participants || 0) + 1

          uni.showToast({
            title: '报名成功！',
            icon: 'success',
            duration: 2000
          })

          // 关闭表单弹窗
          this.showRegistrationForm = false

          // 重新检查报名状态 - 使用try-catch避免异步错误影响主流程
          setTimeout(async () => {
            try {
              await this.checkRegistrationStatus()
            } catch (error) {
              console.error('异步检查报名状态失败:', error)
              // 不显示错误提示，因为主要操作已经成功
            }
          }, 500)
        } else {
          throw new Error(response.message || '报名失败')
        }
      } catch (error) {
        uni.hideLoading()
        console.error('报名请求异常:', error)

        uni.showModal({
          title: '报名失败',
          content: error.message || '网络错误，请稍后重试',
          showCancel: false,
          confirmText: '确定'
        })
      }
    },

    async handleCancelRegistration() {
      // 显示确认对话框
      const result = await uni.showModal({
        title: '取消报名',
        content: `确定要取消报名"${this.event.title}"吗？`,
        confirmText: '确认取消',
        cancelText: '保留报名'
      })

      if (!result.confirm) return

      // 显示加载提示
      uni.showLoading({
        title: '取消中...'
      })

      try {
        const response = await eventApi.cancelRegistration(this.eventId)

        uni.hideLoading()

        if (response.code === 0) {
          // 取消报名成功，立即更新本地状态
          this.isRegistered = false
          this.event.current_participants = Math.max((this.event.current_participants || 1) - 1, 0)

          // 强制触发响应式更新
          this.$forceUpdate()

          console.log('取消报名成功，当前状态:', {
            isRegistered: this.isRegistered,
            btnText: this.getRegisterBtnText(),
            btnClass: this.getRegisterBtnClass()
          })

          uni.showToast({
            title: '已取消报名',
            icon: 'success',
            duration: 2000
          })

          // 立即触发界面更新
          this.$nextTick(() => {
            this.$forceUpdate()
          })

          // 延迟一点再检查状态，确保后端状态已更新
          setTimeout(async () => {
            try {
              await this.checkRegistrationStatus()
            } catch (error) {
              console.error('异步检查报名状态失败:', error)
              // 不显示错误提示，因为主要操作已经成功
            }
          }, 500)
        } else {
          throw new Error(response.message || '取消报名失败')
        }
      } catch (error) {
        uni.hideLoading()
        console.error('取消报名失败:', error)

        uni.showModal({
          title: '取消失败',
          content: error.message || '网络错误，请稍后重试',
          showCancel: false,
          confirmText: '确定'
        })
      }
    },

    // 获取完整的图片URL
    getImageUrl(imageUrl) {
      return UrlUtils.ensureImageUrl(imageUrl, 'event')
    },

    // 预览图片
    previewImage(index) {
      const urls = this.event.detail_images.map(img => this.getImageUrl(img))
      uni.previewImage({
        current: index,
        urls: urls
      })
    },



    // 初始化表单数据
    initFormData() {
      this.formData = {}
      this.formErrors = {}
      this.formConfig.forEach(field => {
        this.formData[field.name] = ''
      })
    },

    // 关闭报名表单
    closeRegistrationForm() {
      this.showRegistrationForm = false
      this.formData = {}
      this.formErrors = {}
    },

    // 处理选择器变化
    handleSelectChange(fieldName, options, event) {
      const index = event.detail.value
      this.formData[fieldName] = options[index]
      // 清除该字段的错误
      if (this.formErrors[fieldName]) {
        delete this.formErrors[fieldName]
      }
    },

    // 获取选择器当前索引
    getSelectIndex(fieldName, options) {
      const value = this.formData[fieldName]
      return options.findIndex(option =>
        typeof option === 'string' ? option === value : option.value === value
      )
    },

    // 获取字段标签
    getFieldLabel(field) {
      // 改进字段标签显示
      const labelMap = {
        'time': '可参与时间段',
        'method': '联系方式',
        'contact': '联系方式',
        'phone': '手机号码',
        'email': '邮箱地址',
        'name': '姓名',
        'age': '年龄',
        'gender': '性别',
        'school': '学校/单位',
        'major': '专业',
        'grade': '年级',
        'reason': '报名理由',
        'experience': '相关经验',
        'note': '备注信息'
      }
      return labelMap[field.name] || field.label || field.name
    },

    // 获取字段占位符
    getFieldPlaceholder(field, defaultPlaceholder = null) {
      if (field.placeholder) return field.placeholder
      if (defaultPlaceholder) return defaultPlaceholder

      const label = this.getFieldLabel(field)
      const placeholderMap = {
        '可参与时间段': '请输入您的可参与时间，如：周末全天、工作日晚上等',
        '联系方式': '请输入您的联系方式，如：微信号、QQ号等',
        '手机号码': '请输入11位手机号码',
        '邮箱地址': '请输入邮箱地址，如：example@email.com',
        '姓名': '请输入您的真实姓名',
        '年龄': '请输入您的年龄',
        '学校/单位': '请输入您的学校或工作单位',
        '专业': '请输入您的专业',
        '年级': '请选择您的年级',
        '报名理由': '请简要说明您的报名理由',
        '相关经验': '请描述您的相关经验（可选）',
        '备注信息': '其他需要说明的信息（可选）'
      }
      return placeholderMap[label] || `请输入${label}`
    },

    // 获取选中选项的标签
    getSelectedOptionLabel(field, value) {
      if (!value || !field.options) return ''
      const option = field.options.find(opt =>
        typeof opt === 'string' ? opt === value : opt.value === value
      )
      return option ? (typeof option === 'string' ? option : option.label) : value
    },

    // 格式化时间（包装导入的formatTime函数）
    formatTime(date, format = 'YYYY-MM-DD HH:mm', useUTC = false) {
      return utilFormatTime(date, format, useUTC)
    },



    // 验证表单
    validateForm() {
      this.formErrors = {}
      let isValid = true

      this.formConfig.forEach(field => {
        if (field.required && (!this.formData[field.name] || this.formData[field.name].trim() === '')) {
          this.formErrors[field.name] = `${field.label}不能为空`
          isValid = false
        }

        // 邮箱格式验证
        if (field.type === 'email' && this.formData[field.name]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(this.formData[field.name])) {
            this.formErrors[field.name] = '请输入正确的邮箱格式'
            isValid = false
          }
        }

        // 电话格式验证
        if (field.type === 'tel' && this.formData[field.name]) {
          const telRegex = /^1[3-9]\d{9}$/
          if (!telRegex.test(this.formData[field.name])) {
            this.formErrors[field.name] = '请输入正确的手机号码'
            isValid = false
          }
        }
      })

      return isValid
    },

    // 提交报名表单
    async submitRegistration() {
      if (!this.validateForm()) {
        uni.showToast({
          title: '请检查表单信息',
          icon: 'none'
        })
        return
      }

      await this.doRegistration(this.formData)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.event-detail-container {
  min-height: 100vh;
  background-color: $bg-page;
  padding-bottom: 120rpx;
}

/* 导航栏 */
.nav-bar {
  height: 90rpx;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.nav-back, .nav-action {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s;

  &:active {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.nav-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
}

/* 加载状态 */
.loading-container {
  @include center;
  height: 400rpx;
  flex-direction: column;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

.loading-text {
  font-size: 28rpx;
  color: $text-secondary;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 活动内容 */
.event-content {
  padding-bottom: 20rpx;
}

/* 活动封面 */
.event-cover {
  position: relative;
  height: 400rpx;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 30rpx;
}

.event-status {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
  color: #FFFFFF;

  &.status-active {
    background-color: $success-color;
  }

  &.status-ended {
    background-color: $text-secondary;
  }

  &.status-cancelled {
    background-color: $danger-color;
  }

  &.status-draft {
    background-color: $accent-yellow;
  }
}

/* 活动卡片 */
.event-card {
  background-color: #FFFFFF;
  margin: 20rpx 30rpx;
  padding: 30rpx;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.event-title {
  font-size: 36rpx;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.4;
  margin-bottom: 30rpx;
}

/* 活动信息 */
.event-info {
  margin-bottom: 30rpx;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-text {
  font-size: 28rpx;
  color: $text-primary;
  margin-left: 16rpx;
  flex: 1;
}

/* 组织者信息 */
.organizer-info {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: $bg-page;
  border-radius: 16rpx;
  transition: background-color 0.3s;

  &:active {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.organizer-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.organizer-details {
  flex: 1;
}

.organizer-name {
  font-size: 28rpx;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 4rpx;
}

.organizer-label {
  font-size: 24rpx;
  color: $text-secondary;
}

/* 卡片标题 */
.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 20rpx;
}

/* 活动描述 */
.event-description {
  line-height: 1.6;
}

.description-text {
  font-size: 28rpx;
  color: $text-primary;
}

/* 详情图片 */
.detail-images {
  margin-top: 30rpx;

  .images-title {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 20rpx;
  }

  .images-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
  }

  .detail-image {
    width: 100%;
    height: 200rpx;
    border-radius: 12rpx;
    background-color: $bg-secondary;
  }
}

/* 活动须知 */
.notices-list {
  margin-top: 20rpx;

  .notice-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 16rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .notice-dot {
      font-size: 24rpx;
      color: $primary-color;
      margin-right: 12rpx;
      margin-top: 4rpx;
      line-height: 1;
    }

    .notice-text {
      flex: 1;
      font-size: 26rpx;
      color: $text-primary;
      line-height: 1.5;
    }
  }
}

/* 详情图片 */
.detail-images {
  margin-top: 30rpx;
}

.images-title {
  font-size: 28rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 20rpx;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.detail-image {
  width: 100%;
  height: 200rpx;
  border-radius: 12rpx;
  background-color: $bg-secondary;
}

/* 活动须知 */
.notices-list {
  margin-top: 20rpx;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.notice-dot {
  font-size: 24rpx;
  color: $primary-color;
  margin-right: 12rpx;
  margin-top: 4rpx;
  line-height: 1;
}

.notice-text {
  flex: 1;
  font-size: 26rpx;
  color: $text-primary;
  line-height: 1.5;
}

/* 统计信息 */
.event-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 20rpx;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-number {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: $primary-color;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: $text-secondary;
}

/* 错误状态 */
.error-container {
  @include center;
  height: 400rpx;
  flex-direction: column;
  padding: 0 60rpx;
}

.error-text {
  font-size: 28rpx;
  color: $text-secondary;
  margin: 20rpx 0;
  text-align: center;
}

.error-action {
  padding: 16rpx 32rpx;
  background-color: $primary-color;
  border-radius: 40rpx;
  margin-top: 20rpx;
}

.action-text {
  font-size: 28rpx;
  color: #FFFFFF;
}

/* 底部操作栏 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #FFFFFF;
  padding: 20rpx 30rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
}

.action-left {
  display: flex;
  align-items: center;
}

.action-item {
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  border-radius: 40rpx;
  transition: background-color 0.3s;

  &:active {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.action-text {
  font-size: 24rpx;
  color: $text-secondary;
  margin-left: 8rpx;
}

.action-right {
  flex: 1;
  margin-left: 30rpx;
}

.register-btn {
  width: 100%;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  transition: all 0.3s;

  &.active {
    background-color: $primary-color;
    color: #FFFFFF;

    &:active {
      background-color: darken($primary-color, 10%);
    }
  }

  &.registered {
    background-color: #FF9500;
    color: #FFFFFF;
    border: 1px solid #E6850E;

    &:hover {
      background-color: #E6850E;
    }

    &:active {
      background-color: #CC7A0D;
    }
  }

  &.disabled {
    background-color: $bg-disabled;
    color: $text-disabled;
  }
}

/* 报名表单弹窗 */
.registration-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .modal-content {
    width: 90%;
    max-width: 600rpx;
    max-height: 80vh;
    background-color: #FFFFFF;
    border-radius: 20rpx;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    padding: 40rpx 30rpx 20rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid $border-light;

    .modal-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $text-primary;
    }

    .modal-close {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.3s;

      &:active {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }
  }

  // 活动信息摘要
  .event-summary {
    margin: 0 30rpx 20rpx;
    background-color: #FFFFFF;
    border-radius: 16rpx;
    border: 1px solid $border-light;
    overflow: hidden;

    .summary-header {
      padding: 24rpx 30rpx 16rpx;
      background-color: #F8F9FA;
      border-bottom: 1px solid $border-light;

      .summary-title {
        font-size: 28rpx;
        font-weight: 600;
        color: $text-primary;
      }
    }

    .event-info {
      padding: 20rpx 30rpx 30rpx;

      .info-row {
        display: flex;
        align-items: flex-start;
        margin-bottom: 16rpx;

        &:last-child {
          margin-bottom: 0;
        }

        .info-label {
          font-size: 26rpx;
          color: $text-secondary;
          width: 140rpx;
          flex-shrink: 0;
          line-height: 1.4;
        }

        .info-value {
          font-size: 26rpx;
          color: $text-primary;
          flex: 1;
          line-height: 1.4;
          word-break: break-all;
        }
      }
    }
  }

  .modal-body {
    flex: 1;
    padding: 0;
    overflow-y: auto;
  }

  // 表单区域
  .form-section {
    padding: 30rpx;

    .section-title {
      font-size: 30rpx;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 30rpx;
      padding-bottom: 15rpx;
      border-bottom: 2px solid $primary-color;
      display: inline-block;
    }
  }

  .form-field {
    margin-bottom: 40rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .field-label {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;

      .label-text {
        font-size: 28rpx;
        font-weight: 500;
        color: $text-primary;
      }

      .required-mark {
        color: #FF4757;
        margin-left: 4rpx;
        font-size: 30rpx;
      }
    }

    // 字段提示
    .field-hint {
      font-size: 24rpx;
      color: $text-secondary;
      margin-bottom: 12rpx;
      line-height: 1.4;
      padding: 12rpx 16rpx;
      background-color: #F8F9FA;
      border-radius: 8rpx;
      border-left: 3rpx solid $primary-color;
    }

    .field-input {
      width: 100%;
      height: 88rpx;
      padding: 0 24rpx;
      border: 2px solid $border-light;
      border-radius: 16rpx;
      font-size: 28rpx;
      color: $text-primary;
      background-color: #FFFFFF;
      transition: all 0.3s ease;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

      &::placeholder {
        color: $text-placeholder;
        font-size: 26rpx;
      }

      &.error {
        border-color: #FF4757;
        background-color: #FFF5F5;
      }

      &:focus {
        border-color: $primary-color;
        box-shadow: 0 0 0 4rpx rgba(102, 126, 234, 0.1);
        background-color: #FAFBFF;
      }
    }

    .field-textarea {
      width: 100%;
      min-height: 160rpx;
      padding: 20rpx 24rpx;
      border: 2px solid $border-light;
      border-radius: 16rpx;
      font-size: 28rpx;
      color: $text-primary;
      background-color: #FFFFFF;
      transition: all 0.3s ease;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
      resize: none;

      &::placeholder {
        color: $text-placeholder;
        font-size: 26rpx;
      }

      &.error {
        border-color: #FF4757;
        background-color: #FFF5F5;
      }

      &:focus {
        border-color: $primary-color;
        box-shadow: 0 0 0 4rpx rgba(102, 126, 234, 0.1);
        background-color: #FAFBFF;
      }
    }

    .field-select {
      width: 100%;
      height: 88rpx;
      padding: 0 24rpx;
      border: 2px solid $border-light;
      border-radius: 16rpx;
      background-color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.3s ease;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

      &.error {
        border-color: #FF4757;
        background-color: #FFF5F5;
      }

      &:active {
        border-color: $primary-color;
        box-shadow: 0 0 0 4rpx rgba(102, 126, 234, 0.1);
      }

      .select-text {
        font-size: 28rpx;
        color: $text-primary;

        &.placeholder {
          color: $text-placeholder;
          font-size: 26rpx;
        }
      }
    }

    .field-error {
      font-size: 24rpx;
      color: #FF4757;
      margin-top: 12rpx;
      padding-left: 8rpx;
      display: flex;
      align-items: center;
      gap: 8rpx;

      &::before {
        content: '⚠';
        font-size: 20rpx;
      }
    }

    // 字符计数
    .char-count {
      margin-top: 8rpx;
      text-align: right;

      .count-text {
        font-size: 22rpx;
        color: $text-secondary;
      }
    }
  }

  .modal-footer {
    padding: 30rpx;
    border-top: 1px solid $border-light;
    background-color: #FAFBFC;

    .footer-buttons {
      display: flex;
      gap: 24rpx;

      .cancel-button, .submit-button {
        flex: 1;
        height: 88rpx;
        border-radius: 44rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);

        .button-text {
          font-size: 30rpx;
          font-weight: 600;
        }
      }

      .cancel-button {
        background-color: #FFFFFF;
        border: 2px solid $border-light;

        .button-text {
          color: $text-secondary;
        }

        &:active {
          background-color: #F8F9FA;
          transform: scale(0.98);
        }
      }

      .submit-button {
        background: linear-gradient(135deg, $primary-color 0%, #5a67d8 100%);
        border: none;

        .button-text {
          color: #FFFFFF;
        }

        &:active {
          background: linear-gradient(135deg, darken($primary-color, 10%) 0%, darken(#5a67d8, 10%) 100%);
          transform: scale(0.98);
        }
      }
    }
  }
}
</style>