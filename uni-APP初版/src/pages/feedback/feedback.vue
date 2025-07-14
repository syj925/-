<template>
  <view class="feedback-container">
    <view class="header">
      <view class="back-icon ripple" @click="goBack">
        <image class="back-icon-img" src="../../static/icons/icon_ztc.png" mode="aspectFit"></image>
      </view>
      <text class="header-title">意见反馈</text>
    </view>
    
    <view class="content">
      <view class="form-item" :style="{ animation: 'slide-in-up 0.4s forwards' }">
        <text class="form-label">反馈类型</text>
        <view class="type-selector">
          <view 
            v-for="(type, index) in feedbackTypes" 
            :key="index"
            class="type-item tap-feedback"
            :class="{ active: selectedType === index }"
            @tap="selectType(index)"
          >{{ type }}</view>
        </view>
      </view>
      
      <view class="form-item" :style="{ animation: 'slide-in-up 0.4s 0.1s forwards', opacity: 0 }">
        <text class="form-label">反馈内容</text>
        <textarea 
          class="form-textarea" 
          v-model="content" 
          placeholder="请详细描述您遇到的问题或建议..."
          maxlength="500"
        ></textarea>
        <text class="char-count">{{ content.length }}/500</text>
      </view>
      
      <view class="form-item" :style="{ animation: 'slide-in-up 0.4s 0.2s forwards', opacity: 0 }">
        <text class="form-label">联系方式 (选填)</text>
        <input 
          class="form-input" 
          v-model="contact" 
          placeholder="邮箱/手机号，方便我们联系您"
        />
      </view>
      
      <view class="form-item" :style="{ animation: 'slide-in-up 0.4s 0.3s forwards', opacity: 0 }">
        <text class="form-label">上传截图 (选填)</text>
        <view class="upload-area">
          <view class="image-preview" v-for="(image, index) in images" :key="index">
            <image :src="image" mode="aspectFill"></image>
            <view class="delete-icon tap-feedback" @tap="deleteImage(index)">×</view>
          </view>
          <view class="upload-button tap-feedback" @tap="chooseImage" v-if="images.length < 3">
            <text class="plus-icon">+</text>
            <text class="upload-text">上传图片</text>
          </view>
        </view>
        <text class="tip-text">最多上传3张截图</text>
      </view>
      
      <button 
        class="submit-button ripple" 
        :class="{ disabled: !isValid }"
        @tap="submitFeedback" 
        :disabled="!isValid"
        :style="{ animation: 'fade-in 0.6s 0.4s forwards', opacity: 0 }"
      >提交反馈</button>
    </view>
  </view>
</template>

<script>
export default {
  name: 'FeedbackPage',
  data() {
    return {
      feedbackTypes: ['功能建议', '内容问题', '产品Bug', '其他问题'],
      selectedType: 0,
      content: '',
      contact: '',
      images: []
    }
  },
  computed: {
    isValid() {
      return this.content.trim().length > 0;
    }
  },
  methods: {
    goBack() {
      uni.navigateBack({
        delta: 1,
        animationType: 'slide-out-right',
        animationDuration: 300
      });
    },
    selectType(index) {
      this.selectedType = index;
      // 添加震动反馈
      uni.vibrateShort();
    },
    chooseImage() {
      uni.chooseImage({
        count: 3 - this.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.images = [...this.images, ...res.tempFilePaths];
        }
      });
    },
    deleteImage(index) {
      this.images.splice(index, 1);
      // 添加震动反馈
      uni.vibrateShort();
    },
    submitFeedback() {
      if (!this.isValid) return;
      
      uni.showLoading({
        title: '提交中...'
      });
      
      // 模拟提交操作
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({
          title: '反馈提交成功',
          icon: 'success',
          duration: 2000,
          success: () => {
            setTimeout(() => {
              this.goBack();
            }, 2000);
          }
        });
      }, 1500);
    }
  }
}
</script>

<style>
.feedback-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #F5F9FF;
}

.header {
  position: relative;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4A90E2;
  color: #FFFFFF;
  padding-top: var(--status-bar-height);
  box-shadow: 0 2px 10px rgba(74, 144, 226, 0.2);
  z-index: 10;
}

.back-icon {
  position: absolute;
  left: 15px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.back-icon-img {
  width: 24px;
  height: 24px;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
}

.content {
  flex: 1;
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
  display: block;
}

.type-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.type-item {
  padding: 8px 16px;
  background-color: #EEF4FF;
  border-radius: 20px;
  font-size: 14px;
  color: #4A90E2;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.type-item.active {
  background-color: #E1EDFF;
  border: 1px solid #4A90E2;
  font-weight: 500;
}

.form-textarea {
  width: 100%;
  height: 150px;
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  box-sizing: border-box;
  border: 1px solid #E0E0E0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.char-count {
  font-size: 12px;
  color: #999;
  text-align: right;
  margin-top: 5px;
  display: block;
}

.form-input {
  width: 100%;
  height: 45px;
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 0 12px;
  font-size: 14px;
  box-sizing: border-box;
  border: 1px solid #E0E0E0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
}

.image-preview {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.image-preview image {
  width: 100%;
  height: 100%;
}

.delete-icon {
  position: absolute;
  top: 0;
  right: 0;
  width: 22px;
  height: 22px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.upload-button {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  border: 1px dashed #CCCCCC;
  background-color: #FAFAFA;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.plus-icon {
  font-size: 24px;
  color: #999;
  margin-bottom: 5px;
}

.upload-text {
  font-size: 12px;
  color: #999;
}

.tip-text {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.submit-button {
  width: 100%;
  height: 45px;
  background-color: #4A90E2;
  color: #FFFFFF;
  border-radius: 22.5px;
  font-size: 16px;
  font-weight: 500;
  margin-top: 20px;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 4px 10px rgba(74, 144, 226, 0.2);
}

.submit-button:active {
  transform: scale(0.98);
  box-shadow: 0 2px 6px rgba(74, 144, 226, 0.2);
}

.submit-button.disabled {
  background-color: #B8D4F5;
  color: #FFFFFF;
  box-shadow: none;
}
</style> 