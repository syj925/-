<template>
  <view v-if="visible" class="topic-create-modal" @click="handleMaskClick">
    <view class="modal-content" @click.stop>
      <!-- 头部 -->
      <view class="modal-header">
        <text class="header-title">创建话题</text>
        <view class="header-close" @click="handleClose">
          <text class="close-icon">✕</text>
        </view>
      </view>

      <!-- 内容区域 -->
      <view class="modal-body">
        <!-- 话题名称 -->
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">话题名称</text>
            <text class="label-required">*</text>
          </view>
          <view class="form-input-wrap">
            <input
              class="form-input"
              v-model="formData.name"
              placeholder="请输入话题名称（2-10字符）"
              maxlength="10"
              @input="validateForm"
              @focus="onInputFocus"
              @blur="onInputBlur"
              :auto-focus="false"
              :adjust-position="true"
            />
            <text class="input-count">{{ formData.name.length }}/10</text>
          </view>
          <text v-if="errors.name" class="form-tip error">{{ errors.name }}</text>
        </view>

        <!-- 话题描述 -->
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">话题描述</text>
          </view>
          <view class="form-textarea-wrap">
            <textarea
              class="form-textarea"
              v-model="formData.description"
              placeholder="请输入话题描述（可选，最多100字符）"
              maxlength="100"
              @input="validateForm"
              @focus="onTextareaFocus"
              @blur="onTextareaBlur"
              :auto-focus="false"
              :show-confirm-bar="true"
              :adjust-position="true"
            />
            <text class="textarea-count">{{ formData.description.length }}/100</text>
          </view>
        </view>

        <!-- 话题封面 -->
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">话题封面</text>
          </view>
          <view class="cover-upload">
            <view v-if="formData.cover_image" class="cover-preview">
              <image class="cover-image" :src="formData.cover_image" mode="aspectFill" />
              <view class="cover-delete" @click="removeCover">
                <text class="delete-icon">✕</text>
              </view>
            </view>
            <view v-else class="cover-upload-btn" @tap="selectCover">
              <text class="upload-icon">📷</text>
              <text class="upload-text">添加封面</text>
            </view>
          </view>
          <text class="form-tip">建议尺寸：16:9，支持jpg、png格式</text>
        </view>


      </view>

      <!-- 底部按钮 -->
      <view class="modal-footer">
        <view class="footer-btn cancel-btn" @click="handleClose">
          <text class="btn-text">取消</text>
        </view>
        <view 
          class="footer-btn confirm-btn" 
          :class="{ disabled: !isFormValid }"
          @click="handleConfirm"
        >
          <text class="btn-text">创建</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'TopicCreateModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    initialName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      formData: {
        name: '',
        description: '',
        cover_image: ''
      },
      errors: {}
    }
  },
  computed: {
    isFormValid() {
      return this.formData.name.trim().length >= 2 &&
             this.formData.name.trim().length <= 10 &&
             !this.errors.name
    }
  },
  watch: {
    initialName: {
      immediate: true,
      handler(newVal, oldVal) {
        console.log('initialName changed from:', oldVal, 'to:', newVal);
        if (newVal) {
          // 设置名称，无论弹窗是否可见
          this.formData.name = newVal.slice(0, 10)
          console.log('formData.name set to:', this.formData.name);
          // 强制更新
          this.$forceUpdate()
        }
      }
    },
    visible(newVal, oldVal) {
      console.log('visible changed from:', oldVal, 'to:', newVal, 'initialName:', this.initialName);
      if (newVal) {
        // 弹窗打开时，确保设置初始名称
        console.log('Modal opening, checking initialName:', this.initialName);
        if (this.initialName) {
          this.formData.name = this.initialName.slice(0, 10)
          console.log('formData.name set to (on visible):', this.formData.name);
        }
        // 重新验证表单
        this.$nextTick(() => {
          this.validateForm()
          console.log('After validation, formData.name:', this.formData.name);
        })
      } else {
        // 弹窗关闭时，重置表单
        this.resetForm()
      }
    }
  },
  mounted() {
    console.log('TopicCreateModal mounted, initialName:', this.initialName, 'visible:', this.visible);
  },
  methods: {
    // 设置初始名称的方法
    setInitialName(name) {
      console.log('setInitialName called with:', name);
      if (name) {
        const trimmedName = name.slice(0, 10);

        // 使用Vue.set确保响应式更新
        this.$set(this.formData, 'name', trimmedName);
        console.log('formData.name set to:', this.formData.name);

        // 强制更新UI
        this.$forceUpdate();

        // 使用nextTick确保DOM更新
        this.$nextTick(() => {
          console.log('After nextTick, formData.name:', this.formData.name);
          this.validateForm();
        });
      }
    },

    validateForm() {
      this.errors = {}
      
      if (!this.formData.name.trim()) {
        this.errors.name = '请输入话题名称'
      } else if (this.formData.name.trim().length < 2) {
        this.errors.name = '话题名称至少2个字符'
      } else if (this.formData.name.trim().length > 10) {
        this.errors.name = '话题名称最多10个字符'
      }
    },

    selectCover() {
      console.log('selectCover clicked')
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          console.log('Image selected:', res.tempFilePaths[0])
          // 选择图片后立即上传
          this.uploadCoverImage(res.tempFilePaths[0])
        },
        fail: (err) => {
          console.error('Choose image failed:', err)
          uni.showToast({
            title: '选择图片失败',
            icon: 'none'
          })
        }
      })
    },

    // 上传封面图片
    async uploadCoverImage(filePath) {
      console.log('开始上传封面图片:', filePath)

      // 显示上传进度
      uni.showLoading({
        title: '上传图片中...',
        mask: true
      })

      try {
        // 调用上传API
        const result = await this.$api.upload.uploadImage(filePath)
        console.log('图片上传成功:', result)

        // 设置上传后的URL
        this.formData.cover_image = result.url

        uni.hideLoading()
        uni.showToast({
          title: '图片上传成功',
          icon: 'success',
          duration: 1000
        })
      } catch (error) {
        console.error('图片上传失败:', error)
        uni.hideLoading()
        uni.showToast({
          title: '图片上传失败',
          icon: 'none'
        })
      }
    },

    removeCover() {
      this.formData.cover_image = ''
    },

    onInputFocus() {
      console.log('Input focused')
    },

    onInputBlur() {
      console.log('Input blurred')
    },

    onTextareaFocus() {
      console.log('Textarea focused')
    },

    onTextareaBlur() {
      console.log('Textarea blurred')
    },
    
    handleMaskClick() {
      this.handleClose()
    },
    
    handleClose() {
      this.$emit('close')
    },
    
    handleConfirm() {
      console.log('=== 话题创建弹窗 - 开始提交 ===');

      if (!this.isFormValid) {
        console.log('表单无效，停止提交');
        return;
      }

      this.validateForm();
      if (Object.keys(this.errors).length > 0) {
        console.log('存在验证错误，停止提交');
        return;
      }

      const submitData = { ...this.formData };
      console.log('提交数据:', JSON.stringify(submitData, null, 2));
      this.$emit('submit', submitData);
    },

    resetForm() {
      this.formData = {
        name: '',
        description: '',
        cover_image: '',
        type: 'general'
      }
      this.errors = {}
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.topic-create-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: $spacing-lg;

  .modal-content {
    background-color: #fff;
    border-radius: $radius-lg;
    width: 100%;
    max-width: 500px;
    max-height: 80vh;
    overflow: hidden;
    @include flex(column, flex-start, stretch);

    .modal-header {
      @include flex(row, space-between, center);
      padding: $spacing-lg $spacing-lg $spacing-md;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);

      .header-title {
        font-size: $font-size-lg;
        font-weight: 600;
        color: $text-primary;
      }

      .header-close {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.05);
        @include flex(row, center, center);

        .close-icon {
          font-size: 20px;
          color: $text-tertiary;
        }
      }
    }

    .modal-body {
      flex: 1;
      padding: $spacing-lg;
      overflow-y: auto;

      .form-item {
        margin-bottom: $spacing-lg;
        
        &:last-child {
          margin-bottom: 0;
        }

        .form-label {
          @include flex(row, flex-start, center);
          margin-bottom: $spacing-sm;

          .label-text {
            font-size: $font-size-md;
            color: $text-primary;
            font-weight: 500;
          }

          .label-required {
            color: $danger-color;
            margin-left: 2px;
          }
        }

        .form-input-wrap {
          position: relative;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: $radius-md;
          background-color: rgba(0, 0, 0, 0.02);

          .form-input {
            width: 100%;
            padding: $spacing-md;
            font-size: $font-size-md;
            color: $text-primary;
            background-color: transparent;
            border: none;
            outline: none;
            box-sizing: border-box;
            z-index: 1;
            height: 44px;
            line-height: 1.4;
          }

          .input-count {
            position: absolute;
            right: $spacing-md;
            top: 50%;
            transform: translateY(-50%);
            font-size: $font-size-xs;
            color: $text-tertiary;
            pointer-events: none;
            z-index: 2;
          }
        }

        .form-textarea-wrap {
          position: relative;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: $radius-md;
          background-color: rgba(0, 0, 0, 0.02);

          .form-textarea {
            width: 100%;
            padding: $spacing-md;
            font-size: $font-size-md;
            color: $text-primary;
            background-color: transparent;
            min-height: 80px;
            border: none;
            outline: none;
            resize: none;
            box-sizing: border-box;
            z-index: 1;
          }

          .textarea-count {
            position: absolute;
            right: $spacing-md;
            bottom: $spacing-md;
            font-size: $font-size-xs;
            color: $text-tertiary;
            pointer-events: none;
            z-index: 2;
          }
        }

        .form-tip {
          font-size: $font-size-xs;
          color: $text-tertiary;
          margin-top: $spacing-xs;

          &.error {
            color: $danger-color;
          }
        }

        .cover-upload {
          margin-bottom: $spacing-xs;

          .cover-preview {
            position: relative;
            width: 120px;
            height: 68px;
            border-radius: $radius-md;
            overflow: hidden;

            .cover-image {
              width: 100%;
              height: 100%;
            }

            .cover-delete {
              position: absolute;
              top: 4px;
              right: 4px;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background-color: rgba(0, 0, 0, 0.6);
              @include flex(row, center, center);

              .delete-icon {
                font-size: 12px;
                color: #fff;
              }
            }
          }

          .cover-upload-btn {
            width: 120px;
            height: 68px;
            border: 1px dashed rgba(0, 0, 0, 0.2);
            border-radius: $radius-md;
            @include flex(column, center, center);
            background-color: rgba(0, 0, 0, 0.02);
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
              border-color: $primary-color;
              background-color: rgba($primary-color, 0.05);
            }

            &:active {
              transform: scale(0.98);
            }

            .upload-icon {
              font-size: 24px;
              margin-bottom: 4px;
            }

            .upload-text {
              font-size: $font-size-xs;
              color: $text-tertiary;
            }
          }
        }


      }
    }

    .modal-footer {
      @include flex(row, space-between, center);
      padding: $spacing-md $spacing-lg $spacing-lg;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      gap: $spacing-md;

      .footer-btn {
        flex: 1;
        height: 44px;
        border-radius: $radius-md;
        @include flex(row, center, center);
        transition: all 0.2s ease;

        .btn-text {
          font-size: $font-size-md;
          font-weight: 500;
        }

        &.cancel-btn {
          background-color: rgba(0, 0, 0, 0.05);

          .btn-text {
            color: $text-secondary;
          }
        }

        &.confirm-btn {
          background-color: $primary-color;

          .btn-text {
            color: #fff;
          }

          &.disabled {
            background-color: rgba(0, 0, 0, 0.1);

            .btn-text {
              color: $text-tertiary;
            }
          }
        }
      }
    }
  }
}
</style>
