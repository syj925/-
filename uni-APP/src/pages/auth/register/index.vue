<template>
  <view class="register-page">
    <view class="register-header">
      <image class="register-logo" src="/static/images/common/logo.png" mode="aspectFit"></image>
      <view class="register-title">注册账号</view>
      <view class="register-subtitle">成为校园墙的一员</view>
    </view>
    
    <view class="register-form">
      <view class="register-input-group">
        <view class="register-input-label">账号</view>
        <input 
          class="register-input" 
          type="text" 
          placeholder="请输入账号/手机号"
          v-model="form.username"
        />
      </view>
      
      <view class="register-input-group">
        <view class="register-input-label">昵称</view>
        <input 
          class="register-input" 
          type="text" 
          placeholder="请输入昵称"
          maxlength="12"
          v-model="form.nickname"
        />
      </view>
      
      <view class="register-input-group">
        <view class="register-input-label">密码</view>
        <input 
          class="register-input" 
          :type="showPassword ? 'text' : 'password'" 
          placeholder="请输入密码"
          v-model="form.password"
        />
        <view class="register-eye" @tap="showPassword = !showPassword">
          <view class="register-eye-icon" :class="{ open: showPassword }"></view>
        </view>
      </view>
      
      <view class="register-agreement">
        <checkbox 
          :checked="agreed" 
          @tap="agreed = !agreed" 
          color="#5B8EF9"
        ></checkbox>
        <text class="register-agreement-text">
          我已阅读并同意
          <text class="register-agreement-link" @tap.stop="showAgreement('user')">《用户协议》</text>
          和
          <text class="register-agreement-link" @tap.stop="showAgreement('privacy')">《隐私政策》</text>
        </text>
      </view>
      
      <button 
        class="register-btn" 
        :disabled="!canRegister" 
        :class="{ disabled: !canRegister }"
        @tap="register"
      >
        注册
      </button>
      
      <view class="register-login" @tap="goLogin">
        已有账号？立即登录
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      // 表单数据
      form: {
        username: '',
        nickname: '',
        password: ''
      },
      // 是否显示密码
      showPassword: false,
      // 是否同意协议
      agreed: false
    };
  },
  computed: {
    // 是否可以注册
    canRegister() {
      return this.form.username && this.form.username.length >= 3 &&
             this.form.nickname && this.form.nickname.length >= 2 &&
             this.form.password && this.form.password.length >= 6 &&
             this.agreed;
    }
  },
  methods: {
    // 注册
    register() {
      if (!this.canRegister) return;
      
      if (!this.agreed) {
        uni.showToast({
          title: '请先同意用户协议和隐私政策',
          icon: 'none'
        });
        return;
      }
      
      // 调用注册API
      uni.showLoading({
        title: '注册中...'
      });
      
      const registerData = {
        username: this.form.username,
        nickname: this.form.nickname,
        password: this.form.password
      };
      
      console.log('正在发送注册请求:', registerData);
      
      this.$api.user.register(registerData)
        .then(res => {
          console.log('注册成功，响应:', res);

          if (res && res.data) {
            // 检查是否需要审核
            if (res.data.needAudit) {
              // 需要审核的情况
              uni.showModal({
                title: '注册成功',
                content: res.data.message || res.msg || '注册成功，请等待管理员审核',
                showCancel: false,
                confirmText: '确定',
                success: () => {
                  // 跳转回登录页
                  uni.navigateBack();
                }
              });
            } else if (res.data.token) {
              // 直接注册成功，有token的情况
              console.log('保存token到本地存储');
              uni.setStorageSync('token', res.data.token);

              // 保存用户信息
              if (res.data.user) {
                console.log('保存用户信息到本地存储');
                uni.setStorageSync('userInfo', res.data.user);
              }

              // 提示
              uni.showToast({
                title: '注册成功',
                icon: 'success'
              });

              // 尝试连接WebSocket
              if (this.$ws) {
                console.log('尝试连接WebSocket服务...');
                this.$ws.connect(res.data.token)
                  .then(() => {
                    console.log('WebSocket连接成功');
                  })
                  .catch(err => {
                    console.error('WebSocket连接失败:', err);
                  });
              } else {
                console.error('WebSocket实例不存在');
              }

              // 跳转到首页
              setTimeout(() => {
                console.log('跳转到首页');
                uni.switchTab({
                  url: '/pages/index/home'
                });
              }, 1500);
            } else {
              // 其他成功情况，但没有token
              uni.showToast({
                title: res.data.message || res.msg || '注册成功',
                icon: 'success'
              });

              // 跳转回登录页
              setTimeout(() => {
                uni.navigateBack();
              }, 1500);
            }
          } else {
            console.error('注册响应格式错误:', res);
            uni.showToast({
              title: '注册失败，响应格式错误',
              icon: 'none'
            });
          }
        })
        .catch(err => {
          console.error('注册失败:', err);
          uni.showToast({
            title: err.message || '注册失败，请稍后重试',
            icon: 'none'
          });
        })
        .finally(() => {
          uni.hideLoading();
        });
    },
    
    // 跳转到登录页
    goLogin() {
      uni.navigateBack();
    },
    
    // 显示协议
    showAgreement(type) {
      uni.showModal({
        title: type === 'user' ? '用户协议' : '隐私政策',
        content: type === 'user' ? 
          '这是用户协议的内容，实际项目中需要完善...' : 
          '这是隐私政策的内容，实际项目中需要完善...',
        showCancel: false
      });
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.register-page {
  padding: 0 60rpx;
  min-height: 100vh;
  background-color: $bg-page;
}

.register-header {
  @include flex(column, center, center);
  padding: 120rpx 0 80rpx;
}

.register-logo {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: $spacing-md;
  background-color: $bg-disabled;
  border-radius: $radius-circle;
}

.register-title {
  font-size: 36px;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.register-subtitle {
  font-size: $font-size-md;
  color: $text-tertiary;
}

.register-form {
  padding: $spacing-xl 0;
}

.register-input-group {
  position: relative;
  margin-bottom: $spacing-xl;
}

.register-input-label {
  font-size: $font-size-md;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
}

.register-input {
  height: 90rpx;
  background-color: $bg-card;
  border-radius: $radius-md;
  padding: 0 $spacing-lg;
  font-size: $font-size-lg;
  color: $text-primary;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.register-eye {
  position: absolute;
  right: $spacing-lg;
  bottom: 25rpx;
  width: 40rpx;
  height: 40rpx;
  @include center;
}

.register-eye-icon {
  width: 32rpx;
  height: 20rpx;
  border: 2rpx solid $text-tertiary;
  border-radius: 10rpx;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    width: 10rpx;
    height: 10rpx;
    background-color: $text-tertiary;
    border-radius: 50%;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  
  &.open::after {
    display: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    width: 44rpx;
    height: 2rpx;
    background-color: $text-tertiary;
    transform: rotate(45deg);
    top: 9rpx;
    left: -6rpx;
  }
}

.register-agreement {
  @include flex(row, flex-start, center);
  margin-bottom: $spacing-xl;
  
  checkbox {
    transform: scale(0.8);
    margin-right: $spacing-xs;
  }
}

.register-agreement-text {
  font-size: $font-size-sm;
  color: $text-tertiary;
}

.register-agreement-link {
  color: $primary-color;
}

.register-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, $primary-color, $primary-light);
  color: $text-white;
  font-size: $font-size-lg;
  border-radius: $radius-md;
  line-height: 90rpx;
  text-align: center;
  box-shadow: 0 6rpx 20rpx rgba($primary-color, 0.3);
  margin-bottom: $spacing-lg;
  
  &.disabled {
    opacity: 0.6;
  }
}

.register-login {
  text-align: center;
  font-size: $font-size-sm;
  color: $primary-color;
}
</style> 