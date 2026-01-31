<template>
  <view class="privacy-page">
    <!-- 导航栏 -->
    <view class="navbar">
      <view class="navbar-left" @tap="goBack">
        <app-icon name="arrow-left" size="lg" color="#333"></app-icon>
      </view>
      <view class="navbar-title">账号与隐私设置</view>
      <view class="navbar-right"></view>
    </view>
    
    <!-- 内容区 -->
    <view class="privacy-content">
      <!-- 匿名与隐私 -->
      <view class="privacy-section">
        <view class="section-title">匿名与隐私</view>
        <view class="section-desc">保护您的身份和隐私信息</view>

        <view class="privacy-item highlight-item" :class="{ 'active-setting': privacySettings.anonymousMode }">
          <view class="item-info">
            <text class="item-title">匿名模式</text>
            <text class="item-desc">开启后您的发帖和评论将显示为匿名用户</text>
          </view>
          <switch
            :checked="privacySettings.anonymousMode"
            @change="handleSwitchChange('anonymousMode', $event)"
            color="#5B8EF9"
          />
        </view>

        <view class="privacy-item">
          <view class="item-info">
            <text class="item-title">允许被搜索</text>
            <text class="item-desc">允许其他用户通过搜索找到您</text>
          </view>
          <switch
            :checked="privacySettings.allowSearch"
            @change="handleSwitchChange('allowSearch', $event)"
            color="#5B8EF9"
          />
        </view>

        <view class="privacy-item">
          <view class="item-info">
            <text class="item-title">显示位置信息</text>
            <text class="item-desc">在动态中显示您的位置信息</text>
          </view>
          <switch
            :checked="privacySettings.showLocation"
            @change="handleSwitchChange('showLocation', $event)"
            color="#5B8EF9"
          />
        </view>
      </view>

      <!-- 互动权限 -->
      <view class="privacy-section">
        <view class="section-title">互动权限</view>
        <view class="section-desc">设置其他用户与您的互动权限</view>

        <view class="privacy-item">
          <view class="item-info">
            <text class="item-title">允许关注</text>
            <text class="item-desc">其他用户是否可以关注您</text>
          </view>
          <switch
            :checked="privacySettings.allowFollow"
            @change="handleSwitchChange('allowFollow', $event)"
            color="#5B8EF9"
          />
        </view>

        <view class="privacy-item">
          <view class="item-info">
            <text class="item-title">允许评论</text>
            <text class="item-desc">其他用户是否可以评论您的帖子</text>
          </view>
          <switch
            :checked="privacySettings.allowComment"
            @change="handleSwitchChange('allowComment', $event)"
            color="#5B8EF9"
          />
        </view>

        <view class="privacy-item">
          <view class="item-info">
            <text class="item-title">允许私信</text>
            <text class="item-desc">其他用户是否可以给您发送私信</text>
          </view>
          <switch
            :checked="privacySettings.allowMessage"
            @change="handleSwitchChange('allowMessage', $event)"
            color="#5B8EF9"
          />
        </view>
      </view>

      <!-- 内容可见性 -->
      <view class="privacy-section">
        <view class="section-title">内容可见性</view>
        <view class="section-desc">设置您的内容对其他用户的可见性</view>

        <view class="privacy-item">
          <view class="item-info">
            <text class="item-title">我的收藏</text>
            <text class="item-desc">其他用户是否可以看到您的收藏列表</text>
          </view>
          <switch
            :checked="privacySettings.favoriteVisible"
            @change="handleSwitchChange('favoriteVisible', $event)"
            color="#5B8EF9"
          />
        </view>

        <view class="privacy-item">
          <view class="item-info">
            <text class="item-title">关注列表</text>
            <text class="item-desc">其他用户是否可以看到您的关注列表</text>
          </view>
          <switch
            :checked="privacySettings.followListVisible"
            @change="handleSwitchChange('followListVisible', $event)"
            color="#5B8EF9"
          />
        </view>

        <view class="privacy-item">
          <view class="item-info">
            <text class="item-title">粉丝列表</text>
            <text class="item-desc">其他用户是否可以看到您的粉丝列表</text>
          </view>
          <switch
            :checked="privacySettings.fansListVisible"
            @change="handleSwitchChange('fansListVisible', $event)"
            color="#5B8EF9"
          />
        </view>
      </view>

      <!-- 账号管理 -->
      <view class="privacy-section">
        <view class="section-title">账号管理</view>
        <view class="section-desc">管理您的账号信息和安全设置</view>

        <view class="privacy-item clickable-item" @tap="changePassword">
          <view class="item-info">
            <text class="item-title">修改密码</text>
            <text class="item-desc">更改您的登录密码</text>
          </view>
          <app-icon name="arrow-right" size="sm" color="#999"></app-icon>
        </view>

        <view class="privacy-item clickable-item" @tap="changePhone">
          <view class="item-info">
            <text class="item-title">更换手机号</text>
            <text class="item-desc">更改绑定的手机号码</text>
          </view>
          <app-icon name="arrow-right" size="sm" color="#999"></app-icon>
        </view>

        <view class="privacy-item clickable-item" @tap="changeEmail">
          <view class="item-info">
            <text class="item-title">绑定邮箱</text>
            <text class="item-desc">绑定或更改邮箱地址</text>
          </view>
          <app-icon name="arrow-right" size="sm" color="#999"></app-icon>
        </view>
      </view>

      <!-- 危险操作 -->
      <view class="privacy-section danger-section">
        <view class="section-title danger-title">危险操作</view>
        <view class="section-desc">请谨慎操作，以下操作不可恢复</view>

        <view class="privacy-item clickable-item danger-item" @tap="logoutAccount">
          <view class="item-info">
            <text class="item-title danger-text">退出登录</text>
            <text class="item-desc">退出当前账号</text>
          </view>
          <app-icon name="arrow-right" size="sm" color="#ff4757"></app-icon>
        </view>

        <view class="privacy-item clickable-item danger-item" @tap="deleteAccount">
          <view class="item-info">
            <text class="item-title danger-text">注销账号</text>
            <text class="item-desc">永久删除账号及所有数据</text>
          </view>
          <app-icon name="arrow-right" size="sm" color="#ff4757"></app-icon>
        </view>
      </view>

      <!-- 隐私提示 -->
      <view class="privacy-tips">
        <text class="tip-icon">🔒</text>
        <text class="tip-text">我们重视您的隐私和账号安全，所有更改即时生效</text>
      </view>
    </view>
    

  </view>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue';
import api from '@/api';

export default {
  name: 'PrivacyPage',
  components: {
    AppIcon
  },
  data() {
    return {
      saving: false,
      privacySettings: {
        // 匿名与隐私
        anonymousMode: false,
        allowSearch: true,
        showLocation: false,
        // 互动权限
        allowFollow: true,
        allowComment: true,
        allowMessage: true,
        // 内容可见性
        favoriteVisible: false,
        followListVisible: true,
        fansListVisible: true
      }
    };
  },
  onLoad() {
    this.loadPrivacySettings();
  },
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },

    // 加载隐私设置
    async loadPrivacySettings() {
      try {
        // 从服务器获取隐私设置
        const response = await api.user.getPrivacySettings();
        if (response.code === 0 && response.data) {
          this.privacySettings = {
            ...this.privacySettings,
            ...response.data
          };
        }
      } catch (error) {
        console.error('获取隐私设置失败:', error);

        // 如果API失败，从本地存储加载匿名设置（保持兼容性）
        try {
          const anonymousMode = uni.getStorageSync('anonymousMode');
          if (anonymousMode !== '') {
            this.privacySettings.anonymousMode = anonymousMode === 'true';
          }
        } catch (e) {
          console.error('读取本地匿名设置失败', e);
        }

        // 显示错误提示
        uni.showToast({
          title: '加载设置失败',
          icon: 'none',
          duration: 2000
        });
      }
    },

    // 处理开关变化
    handleSwitchChange(key, event) {
      const newValue = event.detail.value;
      this.privacySettings[key] = newValue;

      // 特殊处理匿名模式，保存到本地存储（保持兼容性）
      if (key === 'anonymousMode') {
        uni.setStorage({
          key: 'anonymousMode',
          data: String(newValue)
        });

        // 添加震动反馈
        uni.vibrateShort({
          success: function () {

          }
        });
      }

      // 实时保存设置
      this.saveSettings();
    },

    // 保存设置
    async saveSettings() {
      if (this.saving) return; // 防止重复提交

      this.saving = true;

      try {
        // 调用API保存隐私设置到服务器
        const response = await api.user.updatePrivacySettings(this.privacySettings);

        if (response.code === 0) {
          uni.showToast({
            title: '设置已保存',
            icon: 'success',
            duration: 2000
          });
        } else {
          throw new Error(response.msg || '保存失败');
        }
      } catch (error) {
        console.error('保存隐私设置失败:', error);
        uni.showToast({
          title: error.message || '保存失败',
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.saving = false;
      }
    },

    // 账号管理方法
    changePassword() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none',
        duration: 2000
      });
    },

    changePhone() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none',
        duration: 2000
      });
    },

    changeEmail() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none',
        duration: 2000
      });
    },

    logoutAccount() {
      uni.showModal({
        title: '退出登录',
        content: '确定要退出当前账号吗？',
        success: (res) => {
          if (res.confirm) {
            // 清除登录状态
            uni.removeStorageSync('token');
            uni.removeStorageSync('userInfo');

            // 跳转到登录页
            uni.reLaunch({
              url: '/pages/auth/login/index'
            });

            uni.showToast({
              title: '已退出登录',
              icon: 'success',
              duration: 2000
            });
          }
        }
      });
    },

    deleteAccount() {
      uni.showModal({
        title: '注销账号',
        content: '注销后将永久删除您的账号及所有数据，此操作不可恢复，确定要继续吗？',
        confirmColor: '#ff4757',
        success: (res) => {
          if (res.confirm) {
            uni.showModal({
              title: '最后确认',
              content: '您真的要注销账号吗？这将永久删除所有数据！',
              confirmColor: '#ff4757',
              success: (res2) => {
                if (res2.confirm) {
                  uni.showToast({
                    title: '功能开发中',
                    icon: 'none',
                    duration: 2000
                  });
                }
              }
            });
          }
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.privacy-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

/* 导航栏 */
.navbar {
  @include flex(row, space-between, center);
  height: 88rpx;
  padding: 0 30rpx;
  background: #ffffff;
  border-bottom: 2rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-left, .navbar-right {
  width: 80rpx;
  @include flex(row, center, center);
}

.navbar-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
}

/* 内容区 */
.privacy-content {
  padding: 40rpx 30rpx;
}

.privacy-section {
  margin-bottom: 60rpx;
}

.section-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 16rpx;
}

.section-desc {
  font-size: $font-size-sm;
  color: $text-tertiary;
  margin-bottom: 40rpx;
}

.privacy-item {
  @include flex(row, space-between, center);
  padding: 32rpx 0;
  border-bottom: 2rpx solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
}

.item-info {
  flex: 1;
}

.item-title {
  font-size: $font-size-md;
  color: $text-primary;
  font-weight: 500;
  display: block;
  margin-bottom: 8rpx;
}

.item-desc {
  font-size: $font-size-sm;
  color: $text-tertiary;
}

.item-value {
  @include flex(row, center, center);
  gap: 16rpx;
}

.value-text {
  font-size: $font-size-md;
  color: $text-secondary;
}

/* 高亮项目 */
.highlight-item {
  background: linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%);
  border-radius: 16rpx;
  margin: 16rpx 0;
  padding: 24rpx 20rpx !important;
  border: 2rpx solid #e3f2fd;
}

.active-setting {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-color: #5B8EF9;
}

/* 隐私提示 */
.privacy-tips {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #f3e5f5 0%, #e8f5e8 100%);
  border-radius: 16rpx;
  padding: 24rpx 30rpx;
  margin: 60rpx 0 120rpx 0;
  border: 2rpx solid #e8f5e8;
}

.tip-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.tip-text {
  font-size: $font-size-sm;
  color: $text-tertiary;
  line-height: 1.5;
  flex: 1;
}

/* 可点击项目样式 */
.clickable-item {
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:active {
    background-color: #f8f9fa;
  }
}

/* 危险操作区域样式 */
.danger-section {
  .section-title.danger-title {
    color: #ff4757;
  }
}

.danger-item {
  border-left: 4rpx solid #ff4757;

  .danger-text {
    color: #ff4757 !important;
  }

  &:active {
    background-color: #fff5f5;
  }
}


</style>
