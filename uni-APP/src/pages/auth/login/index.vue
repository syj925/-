<template>
  <view class="login-page">
    <view class="login-header">
      <image class="login-logo" src="/static/images/common/logo.png" mode="aspectFit"></image>
      <view class="login-title">校园墙</view>
      <view class="login-subtitle">校园生活，尽在掌握</view>
    </view>
    
    <view class="login-form">
      <view class="login-input-group">
        <view class="login-input-label">账号</view>
        <input 
          class="login-input" 
          type="text" 
          placeholder="请输入账号/手机号"
          v-model="form.username"
        />
      </view>
      
      <view class="login-input-group">
        <view class="login-input-label">密码</view>
        <input 
          class="login-input" 
          :type="showPassword ? 'text' : 'password'" 
          placeholder="请输入密码"
          v-model="form.password"
        />
        <view class="login-eye" @tap="showPassword = !showPassword">
          <view class="login-eye-icon" :class="{ open: showPassword }"></view>
        </view>
      </view>
      
      <view class="login-agreement">
        <checkbox 
          :checked="agreed" 
          @tap="agreed = !agreed" 
          color="#5B8EF9"
        ></checkbox>
        <text class="login-agreement-text">
          我已阅读并同意
          <text class="login-agreement-link" @tap.stop="showAgreement('user')">《用户协议》</text>
          和
          <text class="login-agreement-link" @tap.stop="showAgreement('privacy')">《隐私政策》</text>
        </text>
      </view>
      
      <button 
        class="login-btn" 
        :disabled="!canLogin" 
        :class="{ disabled: !canLogin }"
        @tap="login"
      >
        登录
      </button>
      
      <view class="login-register" @tap="goRegister">
        还没有账号？点击注册
      </view>
    </view>
    
    <view class="login-other-title">
      <text class="login-other-line"></text>
      <text class="login-other-text">其他登录方式</text>
      <text class="login-other-line"></text>
    </view>
    
    <view class="login-other-options">
      <view class="login-other-item" @tap="otherLogin('wechat')">
        <view class="login-other-icon wechat"></view>
        <text class="login-other-name">微信登录</text>
      </view>
      
      <view class="login-other-item" @tap="otherLogin('qq')">
        <view class="login-other-icon qq"></view>
        <text class="login-other-name">QQ登录</text>
      </view>
      
      <view class="login-other-item" @tap="otherLogin('apple')">
        <view class="login-other-icon apple"></view>
        <text class="login-other-name">Apple登录</text>
      </view>
    </view>
  </view>
</template>

<script>
import { useUserStore } from '@/store';

export default { 
  data() {
    return {
      // 表单数据
      form: {
        username: '',
        password: ''
      },
      // 是否显示密码
      showPassword: false,
      // 是否同意协议
      agreed: false
    };
  },
  computed: {
    // 是否可以登录
    canLogin() {
      return this.form.username && 
             this.form.password && this.form.password.length >= 6 &&
             this.agreed;
    }
  },
  created() {
    // Pinia store
    this.userStore = useUserStore();
  },
  methods: {
    // 登录
    login() {
      if (!this.canLogin) return;
      
      if (!this.agreed) {
        uni.showToast({
          title: '请先同意用户协议和隐私政策',
          icon: 'none'
        });
        return;
      }
      
      // 调用登录API
      uni.showLoading({
        title: '登录中...'
      });
      
      const loginData = {
        username: this.form.username,
        password: this.form.password
      };
      
      this.$api.user.login(loginData)
        .then(res => {
          console.log('登录成功，响应:', res);

          // 保存登录态到 Pinia（并由持久化插件写入本地）
          if (res && res.data && res.data.token) {
            this.userStore.loginSuccess({
              token: res.data.token,
              userInfo: res.data.user || null
            });

            // 提示
            uni.showToast({
              title: '登录成功',
              icon: 'success'
            });

            // 尝试连接WebSocket
            if (this.$ws) {
              this.$ws.connect(res.data.token)
                .then(() => {
                  console.log('WebSocket连接成功');
                })
                .catch(err => {
                  console.error('WebSocket连接失败:', err);
                });
            }

            // 返回上一页或跳转到首页
            setTimeout(() => {
              const pages = getCurrentPages();
              if (pages.length > 1) {
                uni.navigateBack();
              } else {
                uni.switchTab({
                  url: '/pages/index/home'
                });
              }
            }, 1500);
          } else {
            uni.showToast({
              title: '登录失败，响应格式错误',
              icon: 'none'
            });
          }
        })
        .catch(err => {
          console.error('登录失败:', err);
          uni.showToast({
            title: err.message || '登录失败，请稍后重试',
            icon: 'none'
          });
        })
        .finally(() => {
          uni.hideLoading();
        });
    },
    
    // 跳转到注册页
    goRegister() {
      uni.navigateTo({
        url: '/pages/auth/register/index'
      });
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
    },
    
    // 第三方登录
    otherLogin(type) {
      uni.showToast({
        title: `${type}登录功能开发中`,
        icon: 'none'
      });
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.login-page {
  padding: 0 60rpx;
  min-height: 100vh;
  background-color: $bg-page;
}

.login-header {
  @include flex(column, center, center);
  padding: 120rpx 0 80rpx;
}

.login-logo {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: $spacing-md;
  background-color: $bg-disabled;
  border-radius: $radius-circle;
}

.login-title {
  font-size: 36px;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.login-subtitle {
  font-size: $font-size-md;
  color: $text-tertiary;
}

.login-form {
  padding: $spacing-xl 0;
}

.login-input-group {
  position: relative;
  margin-bottom: $spacing-xl;
}

.login-input-label {
  font-size: $font-size-md;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
}

.login-input {
  height: 90rpx;
  background-color: $bg-card;
  border-radius: $radius-md;
  padding: 0 $spacing-lg;
  font-size: $font-size-lg;
  color: $text-primary;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.login-eye {
  position: absolute;
  right: $spacing-lg;
  bottom: 25rpx;
  width: 40rpx;
  height: 40rpx;
  @include center;
}

.login-eye-icon {
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

.login-agreement {
  @include flex(row, flex-start, center);
  margin-bottom: $spacing-xl;
  
  checkbox {
    transform: scale(0.8);
    margin-right: $spacing-xs;
  }
}

.login-agreement-text {
  font-size: $font-size-sm;
  color: $text-tertiary;
}

.login-agreement-link {
  color: $primary-color;
}

.login-btn {
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

.login-register {
  text-align: center;
  font-size: $font-size-sm;
  color: $primary-color;
}

.login-other-title {
  @include flex(row, center, center);
  margin: 80rpx 0 $spacing-xl;
}

.login-other-line {
  width: 100rpx;
  height: 1rpx;
  background-color: $border-color;
}

.login-other-text {
  font-size: $font-size-sm;
  color: $text-tertiary;
  margin: 0 $spacing-md;
}

.login-other-options {
  @include flex(row, space-around, center);
  padding: 0 80rpx;
}

.login-other-item {
  @include flex(column, center, center);
}

.login-other-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: $radius-circle;
  margin-bottom: $spacing-xs;
  
  &.wechat {
    background-color: #07C160;
  }
  
  &.qq {
    background-color: #12B7F5;
  }
  
  &.apple {
    background-color: #000000;
  }
}

.login-other-name {
  font-size: $font-size-xs;
  color: $text-tertiary;
}
</style> 