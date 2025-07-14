<template>
  <view class="edit-profile-container">
    <!-- 动态背景 -->
    <view class="dynamic-bg">
      <view class="bg-circle bg-circle-1"></view>
      <view class="bg-circle bg-circle-2"></view>
    </view>
    
    <!-- 自定义导航栏 -->
    <view class="custom-nav">
      <view class="nav-left" @tap="goBack">
        <image class="nav-icon" src="../../static/icons/icon_ztc.png" mode="aspectFit"></image>
      </view>
      <view class="nav-title">编辑资料</view>
      <view class="nav-right">
        <text class="save-btn" @tap="saveProfile" :class="{'disabled': isSubmitting}">{{ isSubmitting ? '保存中...' : '保存' }}</text>
      </view>
    </view>
    
    <!-- 头像区域 -->
    <view class="avatar-section">
      <view class="avatar-wrapper" @tap="editAvatar">
        <image class="profile-avatar" :src="userInfo.avatar || config.DEFAULT_AVATAR" mode="aspectFill"></image>
        <view class="edit-avatar-btn">
          <text class="iconfont icon-edit"></text>
        </view>
      </view>
      <text class="avatar-tip">点击修改头像</text>
    </view>
    
    <!-- 编辑内容 -->
    <view class="edit-content">
      <!-- 基本信息卡片 -->
      <view class="edit-card">
        <!-- 昵称编辑 -->
        <view class="edit-item">
          <view class="item-icon-wrap">
            <text class="iconfont icon-user"></text>
          </view>
          <view class="item-main">
            <view class="item-label">昵称</view>
            <view class="item-content">
              <input class="item-input" v-model="userInfo.nickname" placeholder="请输入昵称" maxlength="20" />
            </view>
          </view>
        </view>
        
        <!-- 性别选择 -->
        <view class="edit-item">
          <view class="item-icon-wrap">
            <text class="iconfont icon-gender"></text>
          </view>
          <view class="item-main">
            <view class="item-label">性别</view>
            <view class="item-content gender-selector">
              <view 
                class="gender-option" 
                :class="{'gender-selected': userInfo.gender === '男'}" 
                @tap="selectGender('男')"
              >
                <text class="gender-icon">♂</text>
                <text>男</text>
              </view>
              <view 
                class="gender-option" 
                :class="{'gender-selected': userInfo.gender === '女'}" 
                @tap="selectGender('女')"
              >
                <text class="gender-icon">♀</text>
                <text>女</text>
              </view>
              <view 
                class="gender-option" 
                :class="{'gender-selected': userInfo.gender === '保密'}" 
                @tap="selectGender('保密')"
              >
                <text class="gender-icon">*</text>
                <text>保密</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 学院编辑 - 使用下拉菜单 -->
        <view class="edit-item">
          <view class="item-icon-wrap">
            <text class="iconfont icon-school"></text>
          </view>
          <view class="item-main">
            <view class="item-label">学院</view>
            <view class="item-content dropdown" @tap.stop="toggleSchoolDropdown">
              <text class="item-value">{{ userInfo.school || '请选择' }}</text>
              <text class="iconfont icon-arrow-down" :class="{'rotated': showSchoolDropdown}"></text>
            </view>
          </view>
        </view>
        
        <!-- 专业编辑 - 使用下拉菜单 -->
        <view class="edit-item">
          <view class="item-icon-wrap">
            <text class="iconfont icon-major"></text>
          </view>
          <view class="item-main">
            <view class="item-label">专业</view>
            <view class="item-content dropdown" @tap.stop="toggleMajorDropdown">
              <text class="item-value">{{ userInfo.major || '请选择' }}</text>
              <text class="iconfont icon-arrow-down" :class="{'rotated': showMajorDropdown}"></text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 个性化内容卡片 -->
      <view class="edit-card">
        <!-- 个性签名编辑 -->
        <view class="edit-item signature-item">
          <view class="item-icon-wrap">
            <text class="iconfont icon-signature"></text>
          </view>
          <view class="item-main signature-main">
            <view class="item-label">个性签名</view>
            <view class="item-content signature-content">
              <textarea 
                class="signature-textarea" 
                v-model="userInfo.bio" 
                placeholder="请输入个性签名" 
                maxlength="100"
              ></textarea>
              <view class="textarea-counter">{{ userInfo.bio ? userInfo.bio.length : 0 }}/100</view>
            </view>
          </view>
        </view>
        
        <!-- 兴趣标签编辑 -->
        <view class="edit-item" @tap="editTags">
          <view class="item-icon-wrap">
            <text class="iconfont icon-tag"></text>
          </view>
          <view class="item-main">
            <view class="item-label">兴趣标签</view>
            <view class="item-content">
              <view class="tags-preview" v-if="userInfo.tags && userInfo.tags.length > 0">
                <text 
                  class="tag-item" 
                  v-for="(tag, index) in userInfo.tags.slice(0, 3)" 
                  :key="index"
                  :style="{'background-color': tag.color || '#409EFF', 'color': '#FFFFFF'}"
                >{{ typeof tag === 'object' ? tag.name : tag }}</text>
                <text class="tag-more" v-if="userInfo.tags.length > 3">+{{ userInfo.tags.length - 3 }}</text>
              </view>
              <text class="item-value" v-else>请选择</text>
              <text class="iconfont icon-arrow-right"></text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 点击页面其他区域关闭下拉菜单 -->
    <view class="page-mask" v-if="showSchoolDropdown || showMajorDropdown" @tap="closeAllDropdowns"></view>
    
    <!-- 悬浮的下拉菜单 -->
    <view class="popup-dropdown" v-if="showSchoolDropdown" :style="schoolDropdownStyle">
      <view class="popup-dropdown-content">
        <view class="popup-dropdown-header">
          <text>选择学院</text>
          <text class="popup-dropdown-close" @tap="closeAllDropdowns">×</text>
        </view>
        <scroll-view scroll-y class="popup-dropdown-body">
          <view 
            class="popup-dropdown-item" 
            v-for="(item, index) in schoolOptions" 
            :key="index"
            :class="{'popup-dropdown-item-active': userInfo.school === item}"
            @tap.stop="selectSchool(item)"
          >
            {{ item }}
          </view>
        </scroll-view>
      </view>
    </view>
    
    <view class="popup-dropdown" v-if="showMajorDropdown" :style="majorDropdownStyle">
      <view class="popup-dropdown-content">
        <view class="popup-dropdown-header">
          <text>选择专业</text>
          <text class="popup-dropdown-close" @tap="closeAllDropdowns">×</text>
        </view>
        <scroll-view scroll-y class="popup-dropdown-body">
          <view 
            class="popup-dropdown-item" 
            v-for="(item, index) in majorOptions" 
            :key="index"
            :class="{'popup-dropdown-item-active': userInfo.major === item}"
            @tap.stop="selectMajor(item)"
          >
            {{ item }}
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '../../utils/api.js';
import store from '../../utils/store.js';
import config from '../../utils/config.js';

export default {
  data() {
    return {
      config,
      userInfo: {
        avatar: config.DEFAULT_AVATAR,
        nickname: '',
        gender: '保密',
        school: '',
        major: '',
        bio: '',
        tags: []
      },
      originalUserInfo: null, // 用于比较是否有修改
      // 学院选项
      schoolOptions: [
        '智能工程系',
        '生态工程系',
        '暂时不知道'
      ],
      // 专业选项
      majorOptions: [
        '智能软件开发',
        '人工智能',
        '大数据应用',
        '生态环境',
        '可持续发展',
        '环境工程',
        '尚未确定'
      ],
      showSchoolDropdown: false,
      showMajorDropdown: false,
      schoolDropdownStyle: {},
      majorDropdownStyle: {},
      isSubmitting: false,
      isLoading: true
    }
  },
  onLoad() {
    // 加载用户数据
    this.loadUserInfo();
  },
  onShow() {
    // 每次显示页面时都重新加载最新数据
    this.loadUserInfo(true);
  },
  mounted() {
    // 添加点击页面关闭下拉菜单的事件
    uni.$on('page-click', this.closeAllDropdowns);
  },
  
  beforeDestroy() {
    // 移除事件监听
    uni.$off('page-click', this.closeAllDropdowns);
  },
  methods: {
    // 加载用户信息
    loadUserInfo(forceRefresh = false) {
      this.isLoading = true;
      
      // 如果不是强制刷新，先尝试从store获取初始显示
      if (!forceRefresh) {
        const storeUser = store.getters.getUser();
        if (storeUser) {
          console.log('从store获取的用户数据:', JSON.stringify(storeUser));
          this.initUserInfo(storeUser);
        }
      }
      
      // 总是请求最新数据，不管有没有缓存
      api.auth.getInfo()
        .then(res => {
          console.log('API返回的原始数据:', JSON.stringify(res));
          if (res && res.data) {
            console.log('准备初始化的用户数据:', JSON.stringify(res.data));
            this.initUserInfo(res.data);
            // 更新store中的用户信息
            store.mutations.setUser(res.data);
          } else {
            console.error('API返回的数据结构异常:', res);
          }
        })
        .catch(err => {
          console.error('获取用户信息失败:', err);
          uni.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    
    // 初始化用户信息
    initUserInfo(userData) {
      console.log('正在初始化用户数据:', userData);
      
      // 处理tags字段
      let tags = [];
      if (userData.tags) {
        // 如果是字符串，尝试解析
        if (typeof userData.tags === 'string') {
          try {
            tags = JSON.parse(userData.tags);
            console.log('成功解析tags字符串:', tags);
          } catch (error) {
            console.error('解析tags字符串失败:', error);
            tags = [];
          }
        } 
        // 如果已经是数组，直接使用
        else if (Array.isArray(userData.tags)) {
          tags = userData.tags;
          console.log('tags已经是数组:', tags);
        }
      } else {
        console.log('用户数据中没有tags字段');
      }
      
      this.userInfo = {
        id: userData.id,
        avatar: userData.avatar || this.config.DEFAULT_AVATAR,
        nickname: userData.nickname || '',
        gender: userData.gender || '保密',
        school: userData.school || '',
        major: userData.major || '',
        bio: userData.bio || '',
        tags: tags
      };
      
      console.log('初始化后的用户信息:', this.userInfo);
      
      // 保存原始数据用于比较
      this.originalUserInfo = JSON.parse(JSON.stringify(this.userInfo));
    },
    
    // 选择性别
    selectGender(gender) {
      this.userInfo.gender = gender;
    },
    
    // 关闭所有下拉菜单
    closeAllDropdowns() {
      this.showSchoolDropdown = false;
      this.showMajorDropdown = false;
    },
    
    // 返回上一页
    goBack() {
      // 如果有未保存的修改，提示用户
      if (this.hasUnsavedChanges()) {
        uni.showModal({
          title: '提示',
          content: '您有未保存的修改，确定要离开吗？',
          success: (res) => {
            if (res.confirm) {
              uni.navigateBack();
            }
          }
        });
      } else {
        uni.navigateBack();
      }
    },
    
    // 检查是否有未保存的修改
    hasUnsavedChanges() {
      if (!this.originalUserInfo) return false;
      
      // 比较当前数据和原始数据
      return JSON.stringify(this.userInfo) !== JSON.stringify(this.originalUserInfo);
    },
    
    // 保存资料
    saveProfile() {
      // 防止重复提交
      if (this.isSubmitting) return;
      
      // 表单验证
      if (!this.userInfo.nickname) {
        uni.showToast({
          title: '昵称不能为空',
          icon: 'none'
        });
        return;
      }
      
      this.isSubmitting = true;
      
      uni.showLoading({
        title: '保存中'
      });
      
      // 构建更新数据
      const updateData = {
        nickname: this.userInfo.nickname,
        gender: this.userInfo.gender,
        school: this.userInfo.school,
        major: this.userInfo.major,
        bio: this.userInfo.bio
      };

      // 正确处理标签数据 - 只提交标签ID数组
      if (this.userInfo.tags && this.userInfo.tags.length > 0) {
        // 提取标签ID
        const tagIds = this.userInfo.tags.map(tag => 
          typeof tag === 'object' ? tag.id : tag
        );
        // 通过专门的API更新标签，而不是与用户资料一起更新
        api.tags.setUserTags(tagIds)
          .then(res => {
            console.log('标签更新成功:', res);
          })
          .catch(err => {
            console.error('标签更新失败:', err);
          });
      }
      
      // 调用API保存数据
      api.auth.updateInfo(updateData)
        .then(res => {
          uni.hideLoading();
          
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          // 更新store中的用户信息
          store.mutations.setUser({
            ...store.getters.getUser(),
            ...updateData
          });
          
          // 更新原始数据
          this.originalUserInfo = JSON.parse(JSON.stringify(this.userInfo));
          
          // 不再自动返回，留在当前页面显示保存结果
        })
        .catch(err => {
          uni.hideLoading();
          
          console.error('保存失败:', err);
          uni.showToast({
            title: err.message || '保存失败，请稍后再试',
            icon: 'none'
          });
        })
        .finally(() => {
          this.isSubmitting = false;
        });
    },
    
    // 编辑头像
    editAvatar() {
      uni.showActionSheet({
        itemList: ['拍照', '从相册选择'],
        success: (res) => {
          const sourceType = res.tapIndex === 0 ? ['camera'] : ['album'];
          
          uni.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: sourceType,
            success: (res) => {
              const tempFilePath = res.tempFilePaths[0];
              
              // 显示上传中提示
              uni.showLoading({
                title: '上传中'
              });
              
              // 上传文件到服务器
              uni.uploadFile({
                url: config.UPLOAD_URL,
                filePath: tempFilePath,
                name: 'file',
                header: {
                  'Authorization': `Bearer ${uni.getStorageSync('token')}`
                },
                formData: {
                  type: 'avatar'
                },
                success: (uploadRes) => {
                  let data;
                  try {
                    data = JSON.parse(uploadRes.data);
                  } catch (e) {
                    uni.hideLoading();
                    uni.showToast({
                      title: '上传失败，服务器返回异常',
                      icon: 'none'
                    });
                    return;
                  }
                  
                  if (uploadRes.statusCode === 200 && data.success) {
                    // 上传成功，更新头像URL
                    this.userInfo.avatar = data.data.url;
                    
                    // 调用API更新用户信息
                    api.auth.updateInfo({ avatar: data.data.url })
                      .then(() => {
                        // 更新store中的用户信息
                        const currentUser = store.getters.getUser();
                        if (currentUser) {
                          store.mutations.setUser({
                            ...currentUser,
                            avatar: data.data.url
                          });
                        }
                        
                        uni.hideLoading();
                        uni.showToast({
                          title: '头像已更新',
                          icon: 'success'
                        });
                      })
                      .catch(err => {
                        console.error('更新头像失败:', err);
                        uni.hideLoading();
                        uni.showToast({
                          title: '更新头像失败',
                          icon: 'none'
                        });
                      });
                  } else {
                    uni.hideLoading();
                    // 显示更详细的错误信息
                    if (uploadRes.statusCode === 400 && data.error === 'LIMIT_FILE_SIZE') {
                      uni.showToast({
                        title: '图片太大，请选择小于20MB的图片',
                        icon: 'none',
                        duration: 3000
                      });
                    } else {
                      uni.showToast({
                        title: data.message || '上传失败',
                        icon: 'none'
                      });
                    }
                  }
                },
                fail: (err) => {
                  console.error('上传请求失败:', err);
                  uni.hideLoading();
                  uni.showToast({
                    title: '上传失败，请检查网络',
                    icon: 'none'
                  });
                }
              });
            }
          });
        }
      });
    },
    
    // 切换学院下拉菜单
    toggleSchoolDropdown(event) {
      event.stopPropagation(); // 阻止冒泡
      this.showMajorDropdown = false; // 关闭其他下拉菜单
      
      // 获取当前元素在视口中的位置
      const query = uni.createSelectorQuery().in(this);
      query.select('.edit-item:nth-child(3)').boundingClientRect(data => {
        if (data) {
          // 设置下拉菜单的位置，固定在视口中的位置
          const windowHeight = uni.getSystemInfoSync().windowHeight;
          
          // 如果下拉菜单高度加上元素底部位置超过屏幕高度，则向上展示
          const menuHeight = Math.min(300, this.schoolOptions.length * 50 + 60); // 预估高度
          let top;
          
          if (data.bottom + menuHeight > windowHeight) {
            // 向上展示
            top = Math.max(60, data.top - menuHeight);
          } else {
            // 向下展示
            top = data.bottom;
          }
          
          this.schoolDropdownStyle = {
            top: top + 'px',
            left: data.left + 'px',
            width: (data.width || 320) + 'px'
          };
          
          this.showSchoolDropdown = true;
        }
      }).exec();
    },
    
    // 选择学院
    selectSchool(item) {
      this.userInfo.school = item;
      this.showSchoolDropdown = false;
    },
    
    // 切换专业下拉菜单
    toggleMajorDropdown(event) {
      event.stopPropagation(); // 阻止冒泡
      this.showSchoolDropdown = false; // 关闭其他下拉菜单
      
      // 获取当前元素在视口中的位置
      const query = uni.createSelectorQuery().in(this);
      query.select('.edit-item:nth-child(4)').boundingClientRect(data => {
        if (data) {
          // 设置下拉菜单的位置，固定在视口中的位置
          const windowHeight = uni.getSystemInfoSync().windowHeight;
          
          // 如果下拉菜单高度加上元素底部位置超过屏幕高度，则向上展示
          const menuHeight = Math.min(300, this.majorOptions.length * 50 + 60); // 预估高度
          let top;
          
          if (data.bottom + menuHeight > windowHeight) {
            // 向上展示
            top = Math.max(60, data.top - menuHeight);
          } else {
            // 向下展示
            top = data.bottom;
          }
          
          this.majorDropdownStyle = {
            top: top + 'px',
            left: data.left + 'px',
            width: (data.width || 320) + 'px'
          };
          
          this.showMajorDropdown = true;
        }
      }).exec();
    },
    
    // 选择专业
    selectMajor(item) {
      this.userInfo.major = item;
      this.showMajorDropdown = false;
    },
    
    // 编辑标签
    editTags() {
      // 在打开标签编辑页面前先保存当前标签到storage
      uni.setStorageSync('editingTags', this.userInfo.tags || []);
      
      uni.navigateTo({
        url: '/pages/edit-tags/edit-tags',
        events: {
          // 监听标签编辑页面传回的数据
          updateTags: (tags) => {
            this.userInfo.tags = tags;
          }
        },
        success: () => {
          // 传递当前标签到标签编辑页面
          // 由于navigateTo无法直接传递数组等复杂数据，所以使用storage中转
        }
      });
    }
  }
}
</script>

<style>
.edit-profile-container {
  min-height: 100vh;
  background-color: #f8f9fc;
  position: relative;
  padding-top: var(--status-bar-height);
}

/* 动态背景 */
.dynamic-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 220px;
  background: linear-gradient(120deg, #5a85fd, #8c6ff6);
  z-index: 0;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.bg-circle-1 {
  width: 150px;
  height: 150px;
  bottom: -50px;
  right: -20px;
}

.bg-circle-2 {
  width: 100px;
  height: 100px;
  top: 40px;
  left: -30px;
}

/* 自定义导航栏 */
.custom-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
  padding: 0 15px;
  position: relative;
  z-index: 1;
  margin-bottom: 10px;
}

.nav-left, .nav-right {
  width: 60px;
  display: flex;
  align-items: center;
}

.nav-icon {
  width: 24px;
  height: 24px;
}

.nav-right {
  justify-content: flex-end;
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  text-align: center;
  color: #FFFFFF;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.save-btn {
  font-size: 16px;
  color: #FFFFFF;
  font-weight: 500;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 6px 14px;
  border-radius: 20px;
  transition: all 0.3s;
}

.save-btn:active {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(0.96);
}

.save-btn.disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* 头像区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
  position: relative;
  z-index: 1;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 8px;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid #FFFFFF;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
  position: relative;
  transition: transform 0.3s;
}

.profile-avatar:active {
  transform: scale(0.97);
}

.edit-avatar-btn {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #5a85fd, #8c6ff6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #FFFFFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
}

.edit-avatar-btn:active {
  transform: scale(0.9);
}

.avatar-tip {
  font-size: 12px;
  color: #FFFFFF;
  margin-top: 4px;
}

.icon-edit:before {
  content: "\e6e1";
}

.icon-edit {
  font-size: 16px;
  color: #FFFFFF;
}

/* 编辑内容 */
.edit-content {
  margin-top: 30px;
  padding: 0 16px 30px;
  position: relative;
  z-index: 1;
}

.edit-card {
  background-color: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-bottom: 18px;
  transition: transform 0.3s, box-shadow 0.3s;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.edit-item {
  display: flex;
  align-items: center;
  padding: 16px;
  position: relative;
}

.edit-item:after {
  content: "";
  position: absolute;
  left: 16px;
  bottom: 0;
  right: 16px;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.05);
  transform: scaleY(0.5);
}

.edit-item:last-child:after {
  display: none;
}

.item-icon-wrap {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #f0f3f8, #e6eaf2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  transition: all 0.3s;
}

.edit-item:active .item-icon-wrap {
  transform: scale(0.9);
  background: linear-gradient(135deg, #e9edf2, #dfe4ec);
}

.item-main {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.signature-main {
  flex-direction: column;
  align-items: flex-start;
}

.item-label {
  font-size: 16px;
  color: #333333;
  font-weight: 500;
}

.item-content {
  display: flex;
  align-items: center;
}

.signature-content {
  width: 100%;
  margin-top: 12px;
}

.item-value {
  font-size: 15px;
  color: #888888;
  margin-right: 8px;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-input {
  height: 36px;
  font-size: 15px;
  color: #333333;
  text-align: right;
  width: 180px;
}

.signature-textarea {
  width: 100%;
  height: 80px;
  background-color: #f8f9fc;
  border-radius: 12px;
  padding: 12px;
  font-size: 15px;
  color: #333333;
  margin-bottom: 5px;
}

.textarea-counter {
  text-align: right;
  font-size: 12px;
  color: #999999;
  margin-top: 6px;
}

/* 性别选择器样式调整，适应三个选项 */
.gender-selector {
  display: flex;
  align-items: center;
}

.gender-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  margin-left: 8px;
  border-radius: 20px;
  background-color: #f0f3f8;
  transition: all 0.3s;
}

.gender-option:first-child {
  margin-left: 0;
}

.gender-selected {
  background: linear-gradient(135deg, #5a85fd, #8c6ff6);
  color: #FFFFFF;
}

.gender-icon {
  margin-right: 5px;
  font-weight: bold;
}

.icon-gender:before {
  content: "\e682";
}

.icon-arrow-down:before {
  content: "\e665";
}

.icon-arrow-right:before {
  content: "\e665";
}

.icon-arrow-down, .icon-arrow-right {
  font-size: 16px;
  color: #BBBBBB;
  transition: all 0.3s;
}

.rotated {
  transform: rotate(180deg);
}

/* 悬浮下拉菜单样式 */
.popup-dropdown {
  position: fixed;
  z-index: 1001;
  animation: dropdownFade 0.2s ease;
}

@keyframes dropdownFade {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.popup-dropdown-content {
  background-color: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.popup-dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: linear-gradient(120deg, #5a85fd, #8c6ff6);
  color: #FFFFFF;
}

.popup-dropdown-close {
  font-size: 22px;
  line-height: 22px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-dropdown-body {
  max-height: 250px;
}

.popup-dropdown-item {
  padding: 14px 16px;
  font-size: 15px;
  color: #333333;
  position: relative;
  transition: all 0.2s;
}

.popup-dropdown-item:active {
  background-color: #f8f9fc;
}

.popup-dropdown-item-active {
  color: #5a85fd;
  font-weight: 500;
  background-color: rgba(90, 133, 253, 0.08);
}

.popup-dropdown-item:after {
  content: "";
  position: absolute;
  left: 16px;
  bottom: 0;
  right: 16px;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.05);
  transform: scaleY(0.5);
}

.popup-dropdown-item:last-child:after {
  display: none;
}

/* 遮罩层 */
.page-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0);
  z-index: 50;
}

/* 图标 */
.iconfont {
  font-family: "iconfont" !important;
}

.icon-user:before {
  content: "\e682";
}

.icon-school:before {
  content: "\e682";
}

.icon-major:before {
  content: "\e682";
}

.icon-signature:before {
  content: "\e682";
}

.icon-tag:before {
  content: "\e682";
}

.dropdown {
  position: relative;
}

/* 标签预览 */
.tags-preview {
  display: flex;
  align-items: center;
  margin-right: 8px;
  flex-wrap: wrap;
}

.tag-item {
  font-size: 12px;
  color: #5a85fd;
  background-color: rgba(90, 133, 253, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  margin-right: 6px;
  margin-bottom: 4px;
}

.tag-more {
  font-size: 12px;
  color: #888888;
  margin-left: 2px;
}
</style> 