<template>
  <view class="register-container">
    <!-- 背景装饰元素 -->
    <view class="bg-decoration">
      <view class="circle-1"></view>
      <view class="circle-2"></view>
    </view>
    
    <!-- 自定义导航栏 -->
    <view class="custom-nav animate-fadeIn">
      <view class="nav-left ripple-effect" @tap="goBack">
        <image class="icon-image" src="../../static/icons/icon_ztc.png" mode="aspectFit"></image>
      </view>
      <view class="nav-title">注册</view>
      <view class="nav-right"></view>
    </view>
    
    <!-- 注册表单 -->
    <view class="register-content">
      <view class="form-header animate-fadeIn">
        <text class="form-title">创建账号</text>
        <text class="form-subtitle">欢迎加入校园墙大家庭</text>
      </view>
      
      <view class="register-form animate-slideUp delay-1">
        <view class="card form-card">
          <view class="card-content">
            <!-- 昵称 -->
            <view class="form-item">
              <view class="input-label">昵称</view>
              <view class="input-container" style="background-color: #FFFFFF !important;">
                <input 
                  class="input-field" 
                  v-model="registerForm.nickname" 
                  placeholder="请输入昵称" 
                  type="text"
                  placeholder-style="color: #BBBBBB;"
                />
              </view>
            </view>
            
            <!-- 账号 -->
            <view class="form-item">
              <view class="input-label">账号</view>
              <view class="input-container" style="background-color: #FFFFFF !important;">
                <input 
                  class="input-field" 
                  v-model="registerForm.username" 
                  placeholder="请输入账号" 
                  type="text"
                  placeholder-style="color: #BBBBBB;"
                />
              </view>
            </view>
            
            <!-- 密码 -->
            <view class="form-item">
              <view class="input-label">密码</view>
              <view class="input-container" style="background-color: #FFFFFF !important;">
                <input 
                  class="input-field" 
                  v-model="registerForm.password" 
                  placeholder="请设置6-20位密码" 
                  type="password"
                  password
                  placeholder-style="color: #BBBBBB;"
                />
              </view>
            </view>
            
            <!-- 确认密码 -->
            <view class="form-item">
              <view class="input-label">确认密码</view>
              <view class="input-container" style="background-color: #FFFFFF !important;">
                <input 
                  class="input-field" 
                  v-model="registerForm.confirmPassword" 
                  placeholder="请再次输入密码" 
                  type="password"
                  password
                  placeholder-style="color: #BBBBBB;"
                />
              </view>
            </view>
            
            <!-- 用户协议 -->
            <view class="agreement">
              <checkbox 
                :checked="agreement" 
                @tap="agreement = !agreement" 
                color="#4A90E2"
                style="transform: scale(0.8);"
              />
              <text class="agreement-text">
                我已阅读并同意
                <text class="link ripple-effect" @tap="openAgreement('user')">《用户协议》</text>
                和
                <text class="link ripple-effect" @tap="openAgreement('privacy')">《隐私政策》</text>
              </text>
            </view>
            
            <!-- 注册按钮 -->
            <button class="register-btn" @tap="register" :disabled="isSubmitting">
              <text class="btn-text">{{ isSubmitting ? '注册中...' : '注册' }}</text>
              <view class="btn-overlay"></view>
            </button>
          </view>
        </view>
      </view>
      
      <!-- 登录入口 -->
      <view class="login-entry animate-fadeIn delay-2">
        <text>已有账号?</text>
        <text class="login-btn ripple-effect" @tap="goToLogin">立即登录</text>
      </view>
    </view>
  </view>
</template>

<script>
import api from '../../utils/api.js';
import validator from '../../utils/validator.js';
import store from '../../utils/store.js';

export default {
  data() {
    return {
      registerForm: {
        nickname: '',
        username: '',
        password: '',
        confirmPassword: ''
      },
      agreement: false,
      isSubmitting: false
    }
  },
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 注册操作
    register() {
      // 表单验证
      const nicknameCheck = validator.required(this.registerForm.nickname, '昵称');
      if (!nicknameCheck.valid) {
        this.showToast(nicknameCheck.message);
        return;
      }
      
      const usernameCheck = validator.required(this.registerForm.username, '账号');
      if (!usernameCheck.valid) {
        this.showToast(usernameCheck.message);
        return;
      }
      
      const passwordCheck = validator.required(this.registerForm.password, '密码');
      if (!passwordCheck.valid) {
        this.showToast(passwordCheck.message);
        return;
      }
      
      const passwordLengthCheck = validator.length(this.registerForm.password, 6, 20, '密码');
      if (!passwordLengthCheck.valid) {
        this.showToast(passwordLengthCheck.message);
        return;
      }
      
      const passwordConfirmCheck = validator.same(
        this.registerForm.password, 
        this.registerForm.confirmPassword, 
        '两次密码'
      );
      if (!passwordConfirmCheck.valid) {
        this.showToast(passwordConfirmCheck.message);
        return;
      }
      
      if (!this.agreement) {
        this.showToast('请先阅读并同意用户协议和隐私政策');
        return;
      }
      
      // 设置提交状态
      this.isSubmitting = true;
      
      // 显示加载中
      uni.showLoading({
        title: '注册中...',
        mask: true
      });
      
      // 构建注册请求数据（只包含API需要的字段）
      const registerData = {
        nickname: this.registerForm.nickname,
        username: this.registerForm.username,
        password: this.registerForm.password
      };
      
      // 调用注册API
      api.auth.register(registerData)
        .then(res => {
          // 检查是否需要审核
          if (res.data.needAudit) {
            // 需要审核的情况
            uni.showModal({
              title: '注册成功',
              content: res.message || '注册成功，请等待管理员审核后再登录',
              showCancel: false,
              confirmText: '知道了',
              success: () => {
                // 跳转到登录页面
                uni.redirectTo({
                  url: '/pages/login/login'
                });
              }
            });
          } else {
            // 直接激活的情况
            // 保存token和用户信息
            store.mutations.setToken(res.data.token);

            // 显示注册成功
            uni.showToast({
              title: res.message || '注册成功',
              icon: 'success',
              duration: 2000
            });

            // 获取用户详细信息
            this.getUserInfo();

            // 跳转到首页
            setTimeout(() => {
              uni.switchTab({
                url: '/pages/index/index'
              });
            }, 1500);
          }
        })
        .catch(err => {
          // 注册失败
          console.error('注册失败:', err);
          
          // 显示具体错误信息
          let errorMsg = '注册失败，请稍后再试';
          if (err && err.message) {
            errorMsg = err.message;
          } else if (err && err.statusCode === 500) {
            errorMsg = '服务器内部错误，请联系管理员';
          }
          
          uni.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 3000
          });
        })
        .finally(() => {
          // 确保在所有情况下都关闭loading
          uni.hideLoading();
          this.isSubmitting = false;
        });
    },
    
    // 获取用户详细信息
    getUserInfo() {
      api.auth.getInfo()
        .then(res => {
          // 更新用户详细信息
          store.mutations.setUser(res.data);
        })
        .catch(err => {
          console.error('获取用户信息失败', err);
        });
    },
    
    // 前往登录页面
    goToLogin() {
      uni.navigateBack();
    },
    
    // 查看协议
    openAgreement(type) {
      const title = type === 'user' ? '用户协议' : '隐私政策';
      this.showToast(`${title}功能开发中`);
    },
    
    // 显示提示
    showToast(title) {
      uni.showToast({
        title,
        icon: 'none'
      });
    }
  }
}
</script>

<style>
.register-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  overflow: hidden;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.circle-1 {
  position: absolute;
  top: -150rpx;
  right: -150rpx;
  width: 500rpx;
  height: 500rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(106, 182, 247, 0.15));
  animation: floatUp 12s infinite alternate ease-in-out;
}

.circle-2 {
  position: absolute;
  bottom: -200rpx;
  left: -100rpx;
  width: 400rpx;
  height: 400rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(106, 182, 247, 0.15));
  animation: floatUp 15s infinite alternate-reverse ease-in-out;
}

/* 自定义导航栏 */
.custom-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
  padding: 0 20px;
  position: relative;
  padding-top: var(--status-bar-height);
  z-index: 10;
}

.nav-left, .nav-right {
  width: 40px;
  display: flex;
  align-items: center;
}

.nav-left {
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.nav-left:active {
  transform: scale(0.92);
  background-color: rgba(255, 255, 255, 0.9);
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  text-align: center;
  color: #333;
  letter-spacing: 1px;
}

.icon-image {
  width: 22px;
  height: 22px;
  opacity: 0.7;
  transition: all 0.3s;
}

.icon-image-small {
  width: 14px;
  height: 14px;
  opacity: 0.7;
  transition: all 0.3s;
}

.register-content {
  flex: 1;
  padding: 20px 40px;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
}

.form-header {
  margin-bottom: 30px;
  text-align: center;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.form-subtitle {
  font-size: 16px;
  color: #666;
}

/* 注册表单 */
.register-form {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-card {
  border-radius: 24px;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 15px 35px rgba(74, 144, 226, 0.12);
  overflow: hidden;
  transition: all 0.3s;
}

.card-content {
  padding: 30px;
}

.form-item {
  margin-bottom: 25px;
}

.input-label {
  font-size: 15px;
  color: #333333;
  margin-bottom: 10px;
  font-weight: 500;
}

.input-container {
  position: relative;
  height: 56px;
  display: flex;
  align-items: center;
  border-radius: 16px;
  background-color: #FFFFFF !important;
  background: none !important;
  background-image: none !important;
  padding: 0 20px;
  transition: all 0.3s;
  border: 1px solid rgba(74, 144, 226, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.input-container:focus-within {
  background-color: white !important;
  background: none !important;
  background-image: none !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  border-color: rgba(74, 144, 226, 0.3);
  transform: none;
}

.input-field {
  flex: 1;
  height: 56px;
  font-size: 16px;
  color: #333333;
}

/* 用户协议 */
.agreement {
  display: flex;
  align-items: flex-start;
  margin: 30px 0;
}

.agreement-text {
  font-size: 14px;
  color: #666666;
  line-height: 1.5;
}

.link {
  color: #4A90E2;
  position: relative;
}

.link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background-color: #4A90E2;
  transition: width 0.3s;
}

.link:active::after {
  width: 100%;
}

/* 注册按钮 */
.register-btn {
  width: 100%;
  height: 56px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #4A90E2, #6AB6F7);
  color: #FFFFFF;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
  border: none;
  box-shadow: 0 8px 20px rgba(74, 144, 226, 0.25);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s;
}

.register-btn:active {
  transform: translateY(3px);
  box-shadow: 0 4px 10px rgba(74, 144, 226, 0.2);
}

.btn-text {
  position: relative;
  z-index: 2;
}

.btn-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #6AB6F7, #4A90E2);
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 1;
}

.register-btn:active .btn-overlay {
  opacity: 1;
}

/* 登录入口 */
.login-entry {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  margin-bottom: 40px;
  font-size: 16px;
  color: #666666;
  position: relative;
  z-index: 3;
}

.login-btn {
  color: #4A90E2;
  margin-left: 5px;
  font-weight: 500;
  position: relative;
}

.login-btn::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background-color: #4A90E2;
  transition: width 0.3s;
}

.login-btn:active::after {
  width: 100%;
}

/* 水波纹效果 */
.ripple-effect {
  position: relative;
  overflow: hidden;
}

.ripple-effect:active::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(74, 144, 226, 0.3);
  border-radius: 100%;
  transform: translate(-50%, -50%);
  animation: ripple 0.6s linear;
}

@keyframes ripple {
  0% {
    width: 0;
    height: 0;
    opacity: 0.5;
  }
  100% {
    width: 150px;
    height: 150px;
    opacity: 0;
  }
}

/* 动画类 */
.animate-fadeIn {
  animation: fadeIn 0.8s ease-out forwards;
}

.animate-slideUp {
  animation: slideUp 0.8s ease-out forwards;
}

.delay-1 {
  animation-delay: 0.2s;
}

.delay-2 {
  animation-delay: 0.4s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes floatUp {
  0% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
  100% { transform: translateY(0) rotate(0deg); }
}
</style> 