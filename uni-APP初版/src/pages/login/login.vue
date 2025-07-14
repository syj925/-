<template>
  <view class="login-container">
    <!-- 背景装饰元素 -->
    <view class="bg-decoration">
      <view class="circle-1"></view>
      <view class="circle-2"></view>
      <view class="circle-3"></view>
    </view>
    
    <!-- 顶部背景 -->
    <view class="top-bg">
      <image class="logo animate-float" src="/static/images/logo.png" mode="aspectFit"></image>
      <text class="app-name animate-fadeIn">校园墙</text>
      <text class="app-slogan animate-fadeIn delay-1">校园生活, 尽在掌握</text>
    </view>
    
    <!-- 登录表单 -->
    <view class="login-form animate-slideUp delay-2">
      <view class="card form-card">
        <view class="card-content">
          <view class="form-header">
            <text class="form-title">用户登录</text>
          </view>
          
          <view class="form-item">
            <view class="input-container" style="background-color: #FFFFFF !important;">
              <view class="input-icon">
                <image class="icon-image" src="../../static/icons/zh.png" mode="aspectFit"></image>
              </view>
              <input 
                class="input-field" 
                v-model="loginForm.username" 
                placeholder="请输入账号" 
                type="text"
                placeholder-style="color: #BBBBBB;"
              />
            </view>
          </view>
          
          <view class="form-item">
            <view class="input-container" style="background-color: #FFFFFF !important;">
              <view class="input-icon">
                <image class="icon-image" src="../../static/icons/mm.png" mode="aspectFit"></image>
              </view>
              <input 
                class="input-field" 
                v-model="loginForm.password" 
                placeholder="密码" 
                type="password"
                password
                placeholder-style="color: #BBBBBB;"
              />
            </view>
          </view>
          
          <view class="form-extra">
            <view class="remember-me">
              <checkbox 
                :checked="rememberMe" 
                @tap="rememberMe = !rememberMe"
                color="#4A90E2"
                style="transform: scale(0.8);"
              />
              <text>记住我</text>
            </view>
            <text class="forget-password ripple-effect" @tap="goToForgetPassword">忘记密码?</text>
          </view>
          
          <button class="login-btn" @tap="login" :disabled="isSubmitting">
            <text class="btn-text">{{ isSubmitting ? '登录中...' : '登录' }}</text>
            <view class="btn-overlay"></view>
          </button>
        </view>
      </view>
    </view>
    
    <!-- 注册入口 -->
    <view class="register-entry animate-fadeIn delay-3">
      <text>还没有账号?</text>
      <text class="register-btn ripple-effect" @tap="goToRegister">立即注册</text>
    </view>
    
    <!-- 底部说明 -->
    <view class="bottom-tips animate-fadeIn delay-4">
      <text>登录即表示同意</text>
      <text class="link ripple-effect" @tap="openAgreement('user')">《用户协议》</text>
      <text>和</text>
      <text class="link ripple-effect" @tap="openAgreement('privacy')">《隐私政策》</text>
    </view>
  </view>
</template>

<script>
import api from '../../utils/api.js';
import validator from '../../utils/validator.js';
import store from '../../utils/store.js';
import postActions from '../../utils/postActions.js';
import interactionActions from '../../utils/interactionActions.js';

export default {
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      rememberMe: false,
      isSubmitting: false
    }
  },
  onLoad() {
    // 检查是否有存储的登录信息
    this.checkSavedLogin();
  },
  methods: {
    // 检查是否有存储的登录信息
    checkSavedLogin() {
      uni.getStorage({
        key: 'savedLogin',
        success: (res) => {
          if (res.data) {
            this.loginForm.username = res.data.username || '';
            this.loginForm.password = res.data.password || '';
            this.rememberMe = true;
          }
        }
      });
    },
    
    // 登录操作
    async login() {
      // 表单验证
      const usernameCheck = validator.required(this.loginForm.username, '账号');
      if (!usernameCheck.valid) {
        this.showToast(usernameCheck.message);
        return;
      }
      
      const passwordCheck = validator.required(this.loginForm.password, '密码');
      if (!passwordCheck.valid) {
        this.showToast(passwordCheck.message);
        return;
      }
      
      // 设置提交状态
      this.isSubmitting = true;
      
      // 显示加载中
      uni.showLoading({
        title: '登录中...',
        mask: true
      });
      
      // 调用登录API
      const result = await api.auth.login(this.loginForm);
      
      if (result.success && result.data && result.data.token) {
        console.log('登录成功，保存用户信息');
        // 保存登录信息（如果记住我勾选）
        if (this.rememberMe) {
          uni.setStorage({
            key: 'savedLogin',
            data: {
              username: this.loginForm.username,
              password: this.loginForm.password
            }
          });
        } else {
          uni.removeStorage({
            key: 'savedLogin'
          });
        }
        
        // 保存token和用户信息到store
        store.mutations.setToken(result.data.token);
        store.mutations.setUser(result.data.user);
        
        // 新增：登录成功后同步用户状态
        try {
          console.log('同步数据详情:');
          // 检查数据字段是否存在
          const likes = result.data.likes || [];
          const collections = result.data.collections || [];
          const topicViews = result.data.topicViews || [];
          const eventRegistrations = result.data.eventRegistrations || [];
          
          console.log('- 点赞数量:', likes.length);
          console.log('- 点赞数据示例:', likes.slice(0, 2));
          console.log('- 收藏数量:', collections.length);
          console.log('- 收藏数据示例:', collections.slice(0, 2));
          console.log('- 话题浏览数量:', topicViews.length);
          console.log('- 活动注册数量:', eventRegistrations.length);
            
              console.log('开始处理同步数据并更新状态...');
          
          // 构建符合期望的数据格式
          const syncData = {
            likes: likes,
            collections: collections,
            topicViews: topicViews,
            eventRegistrations: eventRegistrations,
            lastSynced: Date.now()
                            };
          
          // 调用专门的状态同步函数处理登录状态
          const syncResult = postActions.syncUserStatusFromLogin(syncData);
          console.log('同步用户状态结果:', syncResult);
              
              // 登录成功提示
              uni.showToast({
                title: '登录成功',
                icon: 'success',
                duration: 1500,
                success: () => {
                  setTimeout(() => {
                    if (this.redirect) {
                      uni.redirectTo({ url: decodeURIComponent(this.redirect) });
                    } else {
                      uni.switchTab({ url: '/pages/index/index' });
                    }
                  }, 500);
                }
              });
            } catch (error) {
              console.error('处理同步状态数据失败:', error);
        }
      } else {
        // 登录失败
        console.error('登录失败:', result);
        
        // 显示具体错误信息
        let errorMsg = '登录失败，请检查账号密码';
        if (result && result.message) {
          errorMsg = result.message;
        } else if (result && result.statusCode === 500) {
          errorMsg = '服务器内部错误，请联系管理员';
        }
        
        uni.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 3000
        });
      }
      
      // 确保在所有情况下都关闭loading
      this.isSubmitting = false;
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
    
    // 前往注册页面
    goToRegister() {
      uni.navigateTo({
        url: '/pages/register/register'
      });
    },
    
    // 前往忘记密码页面
    goToForgetPassword() {
      this.showToast('忘记密码功能开发中');
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
.login-container {
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

.circle-3 {
  position: absolute;
  top: 30%;
  left: 50%;
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.05), rgba(106, 182, 247, 0.1));
  animation: floatUp 8s infinite alternate ease-in-out;
}

/* 顶部背景 */
.top-bg {
  height: 280px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: var(--status-bar-height);
  position: relative;
  z-index: 1;
}

.logo {
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
  filter: drop-shadow(0 6px 16px rgba(74, 144, 226, 0.25));
}

.app-name {
  font-size: 36px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 15px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  letter-spacing: 2px;
}

.app-slogan {
  font-size: 18px;
  color: #666666;
  letter-spacing: 1px;
}

/* 登录表单 */
.login-form {
  flex: 1;
  padding: 0 40px;
  position: relative;
  z-index: 2;
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

.form-header {
  margin-bottom: 30px;
  text-align: center;
}

.form-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.form-item {
  margin-bottom: 25px;
}

.input-container {
  display: flex;
  align-items: center;
  height: 56px;
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

.input-icon {
  width: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon-image {
  width: 22px;
  height: 22px;
  opacity: 0.7;
  transition: all 0.3s;
}

.input-container:focus-within .icon-image {
  opacity: 1;
}

.input-field {
  flex: 1;
  height: 56px;
  font-size: 16px;
  color: #333333;
  margin-left: 10px;
}

.form-extra {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  font-size: 14px;
}

.remember-me {
  display: flex;
  align-items: center;
  color: #666666;
}

.forget-password {
  color: #4A90E2;
  position: relative;
  padding: 4px 0;
}

.forget-password::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background-color: #4A90E2;
  transition: width 0.3s;
}

.forget-password:active::after {
  width: 100%;
}

.login-btn {
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

.login-btn:active {
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

.login-btn:active .btn-overlay {
  opacity: 1;
}

/* 注册入口 */
.register-entry {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  font-size: 16px;
  color: #666666;
  position: relative;
  z-index: 3;
}

.register-btn {
  color: #4A90E2;
  margin-left: 5px;
  font-weight: 500;
  position: relative;
}

.register-btn::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background-color: #4A90E2;
  transition: width 0.3s;
}

.register-btn:active::after {
  width: 100%;
}

/* 底部说明 */
.bottom-tips {
  text-align: center;
  margin: 24px 0 40px;
  font-size: 13px;
  color: #999999;
  position: relative;
  z-index: 3;
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

.animate-float {
  animation: float 4s infinite ease-in-out;
}

.delay-1 {
  animation-delay: 0.2s;
}

.delay-2 {
  animation-delay: 0.3s;
}

.delay-3 {
  animation-delay: 0.5s;
}

.delay-4 {
  animation-delay: 0.7s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0); }
}

@keyframes floatUp {
  0% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
  100% { transform: translateY(0) rotate(0deg); }
}
</style> 