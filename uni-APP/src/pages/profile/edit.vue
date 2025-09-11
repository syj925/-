<template>
  <view class="edit-profile-page">
    <!-- 顶部导航栏 -->
    <view class="page-header">
      <view class="header-left" @tap="goBack">
        <text class="iconfont icon-back"></text>
      </view>
      <view class="header-title">编辑资料</view>
      <view class="header-right" @tap="saveProfile">
        <text class="save-btn">保存</text>
      </view>
    </view>
    
    <!-- 编辑区域 -->
    <scroll-view scroll-y class="edit-content">
      <!-- 头像编辑 -->
      <view class="edit-item edit-avatar">
        <view class="avatar-preview" @tap="chooseAvatar">
          <image :src="getDisplayImageUrl(formData.avatar)" mode="aspectFill" class="avatar-img"></image>
          <view class="avatar-edit-icon">
            <text class="iconfont icon-camera"></text>
          </view>
        </view>
        <button class="upload-btn" @tap="chooseAvatar">选择头像</button>
      </view>
      
      <!-- 基本信息 -->
      <view class="edit-section">
        <view class="section-title">基本信息</view>
        
        <view class="form-item">
          <text class="form-label">昵称</text>
          <input 
            type="text" 
            class="form-input" 
            v-model="formData.nickname" 
            placeholder="请输入昵称" 
            maxlength="20"
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">个性签名</text>
          <textarea 
            class="form-textarea" 
            v-model="formData.bio" 
            placeholder="介绍一下自己吧" 
            maxlength="100"
          ></textarea>
          <text class="input-counter">{{ formData.bio.length }}/100</text>
        </view>
      </view>
      
      <!-- 校园信息 -->
      <view class="edit-section">
        <view class="section-title">校园信息</view>
        
        <view class="form-item">
          <text class="form-label">学校</text>
          <input 
            type="text" 
            class="form-input" 
            v-model="formData.school" 
            placeholder="请输入您的学校" 
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">院系</text>
          <input 
            type="text" 
            class="form-input" 
            v-model="formData.department" 
            placeholder="请输入您的院系" 
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">年级</text>
          <picker 
            mode="selector" 
            :range="gradeOptions" 
            @change="handleGradeChange"
            :value="gradeIndex"
          >
            <view class="picker-value">
              <text>{{ gradeOptions[gradeIndex] || '请选择年级' }}</text>
              <text class="iconfont icon-right"></text>
            </view>
          </picker>
        </view>
      </view>
      
      <!-- 兴趣标签 -->
      <view class="edit-section">
        <view class="section-title">兴趣标签</view>
        <view class="tags-container">
          <view 
            v-for="(tag, index) in formData.tags" 
            :key="index" 
            class="tag-item"
          >
            <text class="tag-text">{{ tag }}</text>
            <text class="tag-remove" @tap="removeTag(index)">×</text>
          </view>
          
          <view class="tag-add" @tap="showTagInput = true" v-if="!showTagInput && formData.tags.length < 8">
            <text class="iconfont icon-add"></text>
            <text>添加标签</text>
          </view>
        </view>
        
        <view class="tag-input-container" v-if="showTagInput">
          <input 
            type="text" 
            class="tag-input" 
            v-model="newTag" 
            placeholder="请输入标签名称" 
            focus 
            maxlength="10"
            @blur="handleTagInputBlur"
            @confirm="addTag"
          />
          <button class="tag-add-btn" @tap="addTag">添加</button>
        </view>
        
        <text class="tag-tip">最多可添加8个标签</text>
      </view>
      
      <!-- 个性化设置 -->
      <view class="edit-section">
        <view class="section-title">个性化设置</view>
        
        <view class="form-item background-item">
          <text class="form-label">背景图片</text>
          <view class="bg-selection-container">
            <view class="bg-options-grid">
              <view
                v-for="(bg, index) in backgroundOptions"
                :key="index"
                class="bg-option"
                :class="{ active: isBackgroundSelected(bg) }"
                @tap="selectBackground(bg)"
              >
                <view class="bg-preview">
                  <image
                    :src="bg"
                    mode="aspectFill"
                    @error="handleImageError"
                  ></image>
                </view>
                  <view class="bg-overlay" v-if="isBackgroundSelected(bg)">
                  <view class="bg-check">
                    <text class="iconfont icon-check"></text>
                  </view>
                </view>
                <view class="bg-hover-effect"></view>
              </view>
              <view class="bg-option upload-option" @tap="chooseBackground">
                <view class="upload-content">
                  <view class="upload-icon">
                    <text class="iconfont icon-upload"></text>
                  </view>
                  <text class="upload-text">传图</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 账户安全 -->
      <view class="edit-section">
        <view class="section-title">账户安全</view>
        
        <view class="form-item link-item" @tap="navigateTo('/pages/profile/change-password')">
          <text class="form-label">修改密码</text>
          <text class="iconfont icon-right"></text>
        </view>
        
        <view class="form-item link-item" @tap="navigateTo('/pages/profile/privacy-settings')">
          <text class="form-label">隐私设置</text>
          <text class="iconfont icon-right"></text>
        </view>
      </view>
      
      <button class="logout-btn" @tap="logout">退出登录</button>
    </scroll-view>
    
    <!-- 加载中蒙层 -->
    <view class="loading-mask" v-if="isLoading">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text>保存中...</text>
      </view>
    </view>
  </view>
</template>

<script>
// 导入URL工具函数
import { UrlUtils } from '@/utils';
import appConfig from '@/config';

export default {
  data() {
    return {
      formData: {
        avatar: '',
        nickname: '',
        bio: '',
        school: '',
        department: '',
        grade: '',
        tags: [],
        backgroundImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&q=80'
      },
      originalData: {}, // 保存初始数据，用于检测变更
      isLoading: false,
      showTagInput: false,
      newTag: '',
      gradeOptions: ['大一', '大二', '大三', '大四', '研一', '研二', '研三', '博士'],
      gradeIndex: 0,
      backgroundOptions: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=200&fit=crop&q=80',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=200&fit=crop&q=80',
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=200&fit=crop&q=80',
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=200&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=200&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517230878791-4d28214057c2?w=400&h=200&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400&h=200&fit=crop&q=80'
      ]
    };
  },
  
  onLoad() {
    this.getUserInfo();
  },
  
  computed: {
    hasChanges() {
      // 检查表单数据是否有变更
      return JSON.stringify(this.formData) !== JSON.stringify(this.originalData);
    }
  },
  
  // 监听页面返回
  onBackPress() {
    if (this.hasChanges) {
      uni.showModal({
        title: '提示',
        content: '您有未保存的修改，确定要离开吗？',
        success: (res) => {
          return !res.confirm;
        }
      });
      return true;
    }
  },
  
  methods: {
    // 获取用户信息
    getUserInfo() {
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.navigateTo({ url: '/pages/auth/login' });
        return;
      }
      
      this.isLoading = true;
      
      // 调用API获取用户信息
      this.$api.user.getInfo()
        .then(res => {
          console.log('获取用户信息返回数据:', JSON.stringify(res));
          
          // API可能返回多种格式：
          // 1. {code: 0, data: {user}}
          // 2. {code: 200, data: {user}}
          // 3. {data: {user}}
          // 4. {user}
          
          let userData = null;
          
          if (res.code === 0 || res.code === 200) {
            // 格式1和2
            userData = res.data;
          } else if (res.data) {
            // 格式3
            userData = res.data;
          } else {
            // 格式4或其他
            userData = res;
          }
          
          console.log('解析后的用户数据:', JSON.stringify(userData));
          
          if (userData) {
            // 统一使用相对路径存储，显示时由组件自动处理为绝对路径
            const avatar = userData.avatar || '';
            const backgroundImage = userData.backgroundImage || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&q=80';
            
            console.log('获取到的用户数据:');
            console.log('- 头像:', userData.avatar);
            console.log('- 背景图:', userData.backgroundImage);
            console.log('- 昵称:', userData.nickname);
            
            this.formData = {
              avatar: avatar,
              nickname: userData.nickname || '',
              bio: userData.bio || '',
              school: userData.school || '',
              department: userData.department || '',
              grade: userData.grade || '',
              tags: userData.tags || [],
              backgroundImage: backgroundImage
            };
            
            // 如果用户的背景图片不在预设选项中，添加到选项列表开头
            if (backgroundImage && backgroundImage.includes('/uploads/')) {
              // 为用户上传的图片生成完整的显示URL
              const fullImageUrl = this.getDisplayImageUrl(backgroundImage, 'background');
              
              // 检查是否已存在（避免重复）
              const exists = this.backgroundOptions.some(option => 
                this.extractRelativePath(option) === this.extractRelativePath(backgroundImage)
              );
              
              if (!exists) {
                this.backgroundOptions.unshift(fullImageUrl);
                // 保持合理的选项数量
                if (this.backgroundOptions.length > 12) {
                  this.backgroundOptions = this.backgroundOptions.slice(0, 12);
                }
                console.log('添加用户现有背景图片到选项:', fullImageUrl);
              }
            }
            
            // 设置年级索引
            if (userData.grade) {
              const index = this.gradeOptions.indexOf(userData.grade);
              this.gradeIndex = index > -1 ? index : 0;
            }
            
            // 保存原始数据副本
            this.originalData = JSON.parse(JSON.stringify(this.formData));
            
            console.log('表单数据已设置:', this.formData);
          } else {
            console.error('无法从响应中提取用户数据');
            uni.showToast({
              title: '获取用户数据失败',
              icon: 'none'
            });
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
    
    // 返回上一页
    goBack() {
      if (this.hasChanges) {
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
    
    // 保存个人资料
    saveProfile() {
      // 表单验证
      if (!this.formData.nickname || this.formData.nickname.length < 2) {
        uni.showToast({
          title: '昵称长度不能少于2个字符',
          icon: 'none'
        });
        return;
      }
      
      this.isLoading = true;
      
      // 更新用户年级
      this.formData.grade = this.gradeOptions[this.gradeIndex];
      
      // 调试打印完整表单数据
      console.log('准备提交的用户数据:', JSON.stringify(this.formData, null, 2));
      
      // 创建只包含有实际值的更新数据对象，避免覆盖现有数据
      const cleanData = {};
      
      // 只包含有值且不为空的字段
      if (this.formData.nickname && this.formData.nickname.trim()) {
        cleanData.nickname = this.formData.nickname.trim();
      }
      
      if (this.formData.avatar) {
        cleanData.avatar = this.extractRelativePath(this.formData.avatar);
      }
      
      if (this.formData.bio !== undefined) {
        cleanData.bio = this.formData.bio || ''; // 允许清空个人简介
      }
      
      if (this.formData.school !== undefined) {
        cleanData.school = this.formData.school || ''; // 允许清空学校
      }
      
      if (this.formData.department !== undefined) {
        cleanData.department = this.formData.department || ''; // 允许清空院系
      }
      
      if (this.formData.grade) {
        cleanData.grade = this.formData.grade;
      }
      
      if (this.formData.backgroundImage) {
        cleanData.backgroundImage = this.extractRelativePath(this.formData.backgroundImage);
      }
      
      if (this.formData.tags && Array.isArray(this.formData.tags)) {
        cleanData.tags = this.formData.tags;
      }
      
      console.log('过滤后的提交数据:', JSON.stringify(cleanData, null, 2));
      
      this.$api.user.updateInfo(cleanData)
        .then(res => {
          console.log('保存用户信息返回数据:', res);
          
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          // 更新本地缓存
          const userInfo = uni.getStorageSync('userInfo') || {};
          const updatedUserInfo = {
            ...userInfo,
            ...cleanData
          };
          
          console.log('更新后的本地用户信息:', updatedUserInfo);
          uni.setStorageSync('userInfo', updatedUserInfo);
          
          // 更新originalData，以避免hasChanges返回true
          this.originalData = JSON.parse(JSON.stringify(this.formData));
          
          // 设置全局强制刷新标记，使个人资料页面刷新数据
          const app = getApp();
          if (app.globalData) {
            app.globalData.forceRefresh = true;
          }
          
          // 保存成功后 1 秒返回
          setTimeout(() => {
            uni.navigateBack();
          }, 1000);
        })
        .catch(err => {
          console.error('保存用户信息失败:', err);
          uni.showToast({
            title: '保存失败，请重试',
            icon: 'none'
          });
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    
    // 选择头像
    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          console.log('选择头像成功:', res);
          const tempFilePath = res.tempFilePaths[0];
          
          // 设置loading状态
          this.isLoading = true;
          uni.showLoading({
            title: '头像上传中...'
          });
          
          // 获取服务器地址 - 使用配置中的最佳服务器
          const baseURL = this.$api.http.config.baseURL || appConfig.getBestServer();

          // 上传头像图片
          uni.uploadFile({
            url: baseURL + '/api/upload/image',
            filePath: tempFilePath,
            name: 'file',
            header: {
              'Authorization': 'Bearer ' + uni.getStorageSync('token')
            },
            formData: {
              type: 'avatar'
            },
            success: (uploadRes) => {
              console.log('头像上传结果:', uploadRes);
              
              try {
                const data = JSON.parse(uploadRes.data);
                console.log('解析后的上传响应:', data);
                
                if (data.code === 0 || data.code === 200) {
                  // 提取图片URL路径
                  let imgUrl = '';
                  if (data.data && data.data.url) {
                    imgUrl = data.data.url;
                  } else if (data.url) {
                    imgUrl = data.url;
                  }
                  
                  if (imgUrl) {
                    // 统一保存相对路径，由工具函数处理显示
                    const relativePath = this.extractRelativePath(imgUrl);
                    this.formData.avatar = relativePath;
                    console.log('头像上传成功 - 服务器返回:', imgUrl, '保存为:', relativePath);
                    uni.showToast({
                      title: '头像上传成功',
                      icon: 'success'
                    });
                  } else {
                    this.handleUploadError(new Error('上传响应中未找到图片URL'));
                  }
                } else {
                  this.handleUploadError(new Error(data.message || '头像上传失败'));
                }
              } catch (err) {
                this.handleUploadError(err, '解析上传响应失败');
              }
            },
            fail: (err) => {
              this.handleUploadError(err, '头像上传失败');
            },
            complete: () => {
              uni.hideLoading();
              this.isLoading = false;
            }
          });
        }
      });
    },
    
    // 选择背景图片
    chooseBackground() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          console.log('选择背景图片成功:', res);
          const tempFilePath = res.tempFilePaths[0];

          // 检查文件大小（5MB限制）
          uni.getFileInfo({
            filePath: tempFilePath,
            success: (fileInfo) => {
              console.log('文件信息:', fileInfo);

              // 检查文件大小（5MB = 5 * 1024 * 1024 bytes）
              const maxSize = 5 * 1024 * 1024;
              if (fileInfo.size > maxSize) {
                uni.showToast({
                  title: '图片过大，请选择小于5MB的图片',
                  icon: 'none',
                  duration: 3000
                });
                return;
              }

              // 开始上传
              this.uploadBackgroundImage(tempFilePath);
            },
            fail: (err) => {
              console.warn('获取文件信息失败:', err);
              // 如果获取文件信息失败，仍然尝试上传
              this.uploadBackgroundImage(tempFilePath);
            }
          });
        },
        fail: (err) => {
          console.error('选择图片失败:', err);
          uni.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
        }
      });
    },

    // 上传背景图片
    uploadBackgroundImage(filePath) {
      // 设置loading状态
      this.isLoading = true;
      uni.showLoading({
        title: '背景图上传中...',
        mask: true
      });

      // 获取服务器地址 - 使用配置中的最佳服务器
      const baseURL = this.$api.http.config.baseURL || appConfig.getBestServer();

      // 上传背景图片
      const uploadTask = uni.uploadFile({
        url: baseURL + '/api/upload/image',
        filePath: filePath,
        name: 'file',
        timeout: 30000, // 30秒超时
        header: {
          'Authorization': 'Bearer ' + uni.getStorageSync('token')
        },
        formData: {
          type: 'background'
        },
        success: (uploadRes) => {
          console.log('背景图上传结果:', uploadRes);

          try {
            const data = JSON.parse(uploadRes.data);
            console.log('解析后的上传响应:', data);

            if (data.code === 0 || data.code === 200) {
              // 提取图片URL路径
              let imgUrl = '';
              if (data.data && data.data.url) {
                imgUrl = data.data.url;
              } else if (data.url) {
                imgUrl = data.url;
              }

              if (imgUrl) {
                // 统一保存相对路径
                const relativePath = this.extractRelativePath(imgUrl);
                
                // 获取完整URL用于显示和选项管理
                const fullImgUrl = this.$api.http.config.baseURL ? 
                  this.$api.http.config.baseURL + relativePath : 
                  appConfig.getBestServer() + relativePath;
                
                // 将新上传的图片添加到背景选项的开头
                const existingIndex = this.backgroundOptions.findIndex(bg => 
                  bg === fullImgUrl || bg === relativePath
                );
                if (existingIndex > -1) {
                  this.backgroundOptions.splice(existingIndex, 1);
                }
                this.backgroundOptions.unshift(fullImgUrl);
                
                // 保持合理的选项数量（最多12个）
                if (this.backgroundOptions.length > 12) {
                  this.backgroundOptions = this.backgroundOptions.slice(0, 12);
                }
                
                // 统一保存相对路径到表单数据
                this.formData.backgroundImage = relativePath;
                console.log('背景图上传成功 - 服务器返回:', imgUrl, '保存为:', relativePath, '显示为:', fullImgUrl);
                
                uni.showToast({
                  title: '背景图上传成功',
                  icon: 'success'
                });
              } else {
                this.handleUploadError(new Error('上传响应中未找到图片URL'), '背景图上传失败');
              }
            } else {
              this.handleUploadError(new Error(data.message || data.msg || '背景图上传失败'), '背景图上传失败');
            }
          } catch (err) {
            console.error('解析上传响应失败:', err, '原始响应:', uploadRes.data);
            this.handleUploadError(err, '解析上传响应失败');
          }
        },
        fail: (err) => {
          console.error('背景图上传失败:', err);
          this.handleUploadError(err, '背景图上传失败');
        },
        complete: () => {
          uni.hideLoading();
          this.isLoading = false;
        }
      });

      // 监听上传进度
      uploadTask.onProgressUpdate((res) => {
        console.log('上传进度:', res.progress + '%');
        // 只在进度小于100%时显示加载，避免与complete回调时序冲突
        if (res.progress > 0 && res.progress < 100) {
          uni.showLoading({
            title: `上传中 ${res.progress}%`,
            mask: true
          });
        }
      });
    },
    
    // 处理上传错误
    handleUploadError(err, message = '上传失败') {
      console.error(`${message}:`, err);

      let errorMessage = message;

      // 根据错误类型提供更具体的错误信息
      if (err && err.errMsg) {
        if (err.errMsg.includes('timeout')) {
          errorMessage = '上传超时，请检查网络连接';
        } else if (err.errMsg.includes('fail')) {
          errorMessage = '上传失败，请重试';
        } else if (err.errMsg.includes('abort')) {
          errorMessage = '上传已取消';
        }
      }

      // 如果有HTTP状态码，提供更详细的错误信息
      if (err && err.statusCode) {
        switch (err.statusCode) {
          case 400:
            errorMessage = '文件格式不支持或文件过大';
            break;
          case 401:
            errorMessage = '登录已过期，请重新登录';
            break;
          case 413:
            errorMessage = '文件过大，请选择小于5MB的图片';
            break;
          case 500:
            errorMessage = '服务器错误，请稍后重试';
            break;
          default:
            errorMessage = `上传失败 (${err.statusCode})`;
        }
      }

      uni.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      });
    },
    
    // 添加标签
    addTag() {
      if (!this.newTag.trim()) {
        return;
      }
      
      if (this.formData.tags.length >= 8) {
        uni.showToast({
          title: '最多只能添加8个标签',
          icon: 'none'
        });
        return;
      }
      
      if (this.formData.tags.includes(this.newTag.trim())) {
        uni.showToast({
          title: '标签已存在',
          icon: 'none'
        });
        return;
      }
      
      this.formData.tags.push(this.newTag.trim());
      this.newTag = '';
      this.showTagInput = false;
    },
    
    // 移除标签
    removeTag(index) {
      this.formData.tags.splice(index, 1);
    },
    
    // 处理标签输入框失焦
    handleTagInputBlur() {
      if (this.newTag.trim()) {
        this.addTag();
      } else {
        this.showTagInput = false;
      }
    },
    
    // 处理年级变更
    handleGradeChange(e) {
      this.gradeIndex = e.detail.value;
    },

    // 处理图片加载错误
    handleImageError(e) {
      console.warn('背景图片加载失败:', e);
    },
    
    // 从完整URL中提取相对路径
    extractRelativePath(url) {
      if (!url) return url;
      
      // 如果已经是相对路径，直接返回
      if (!url.startsWith('http')) {
        return url;
      }
      
      // 提取路径部分（去掉协议和域名）
      try {
        const urlObj = new URL(url);
        return urlObj.pathname;
      } catch (error) {
        console.warn('解析URL失败，返回原值:', error);
        return url;
      }
    },
    
    // 获取用于显示的图片URL
    getDisplayImageUrl(imageUrl, type = 'avatar') {
      if (!imageUrl) {
        return type === 'avatar' ? 
          '/static/images/common/default-avatar.png' : 
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&q=80';
      }
      
      // 如果是相对路径，转为绝对路径
      if (!imageUrl.startsWith('http')) {
        const baseURL = this.$api.http.config.baseURL || appConfig.getBestServer();
        return baseURL + imageUrl;
      }
      
      return imageUrl;
    },
    
    // 判断背景图是否被选中
    isBackgroundSelected(bg) {
      if (!this.formData.backgroundImage || !bg) {
        return false;
      }
      
      // 比较相对路径和绝对路径
      const currentBgRelative = this.extractRelativePath(this.formData.backgroundImage);
      const optionBgRelative = this.extractRelativePath(bg);
      
      return currentBgRelative === optionBgRelative || 
             this.formData.backgroundImage === bg ||
             this.getDisplayImageUrl(this.formData.backgroundImage, 'background') === bg;
    },
    
    // 选择背景图
    selectBackground(bg) {
      // 统一保存为相对路径
      const relativePath = this.extractRelativePath(bg);
      this.formData.backgroundImage = relativePath;
      console.log('选择背景图:', bg, '保存为:', relativePath);
    },
    
    // 页面导航
    navigateTo(url) {
      uni.navigateTo({ url });
    },
    
    // 退出登录
    logout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 清除token和用户信息
            uni.removeStorageSync('token');
            uni.removeStorageSync('userInfo');
            
            // 返回登录页
            uni.reLaunch({
              url: '/pages/auth/login/index'
            });
          }
        }
      });
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.edit-profile-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  position: relative;
}

.page-header {
  @include flex(row, space-between, center);
  height: 90rpx;
  background: linear-gradient(to right, $primary-color, lighten($primary-color, 10%));
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.15);
  
  .header-left {
    padding: 15rpx;
    margin: -15rpx;
    
    .iconfont {
      font-size: 40rpx;
      color: #ffffff;
    }
  }
  
  .header-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #ffffff;
    text-shadow: 0 1rpx 2rpx rgba(0,0,0,0.1);
  }
  
  .header-right {
    .save-btn {
      color: #ffffff;
      font-size: 28rpx;
      font-weight: 500;
      background: rgba(255,255,255,0.2);
      padding: 6rpx 20rpx;
      border-radius: 30rpx;
      transition: all 0.2s ease;
      
      &:active {
        background: rgba(255,255,255,0.3);
        transform: scale(0.95);
      }
    }
  }
}

.edit-content {
  padding: 90rpx 0 50rpx;
  height: calc(100vh - 90rpx);
}

.edit-item {
  background: linear-gradient(to bottom, #ffffff, #fafbfc);
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.05);
}

.edit-avatar {
  @include flex(column, center, center);
  padding: 50rpx 30rpx;
  
  .avatar-preview {
    position: relative;
    width: 180rpx;
    height: 180rpx;
    margin-bottom: 30rpx;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s;
    overflow: hidden;
    box-shadow: 0 8rpx 20rpx rgba($primary-color, 0.2);
    
    &:active {
      transform: scale(0.95);
      box-shadow: 0 4rpx 10rpx rgba($primary-color, 0.15);
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at center, transparent 65%, rgba(0, 0, 0, 0.2) 100%);
      opacity: 0.7;
      transition: opacity 0.3s;
      z-index: 1;
    }
    
    .avatar-img {
      width: 180rpx;
      height: 180rpx;
      border-radius: 50%;
      border: 4rpx solid #fff;
      box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
      object-fit: cover;
      transition: all 0.3s ease;
    }
    
    .avatar-edit-icon {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 56rpx;
      height: 56rpx;
      background: linear-gradient(135deg, $primary-color, lighten($primary-color, 15%));
      border-radius: 50%;
      @include center;
      border: 3rpx solid #fff;
      z-index: 2;
      box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.2);
      
      .iconfont {
        font-size: 28rpx;
        color: #fff;
      }
    }
  }
}

.edit-section {
  background: #ffffff;
  padding: 30rpx;
  margin: 0 20rpx 20rpx;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  
  .section-title {
    font-size: 30rpx;
    font-weight: bold;
    color: $text-primary;
    margin-bottom: 30rpx;
    border-left: 6rpx solid $primary-color;
    padding-left: 15rpx;
    position: relative;
    display: inline-block;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -8rpx;
      left: 0;
      width: 40rpx;
      height: 3rpx;
      background: linear-gradient(to right, $primary-color, transparent);
    }
  }
}

.form-item {
  margin-bottom: 30rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .form-label {
    font-size: 26rpx;
    color: $text-secondary;
    margin-bottom: 15rpx;
    display: block;
    font-weight: 500;
  }
  
  .form-input {
    width: 100%;
    height: 90rpx;
    background-color: #f5f7fa;
    border-radius: $radius-md;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: $text-primary;
    border: 1rpx solid rgba(0,0,0,0.05);
    transition: all 0.3s ease;
    
    &:focus {
      border-color: rgba($primary-color, 0.3);
      background-color: #f0f5ff;
      box-shadow: 0 0 0 2rpx rgba($primary-color, 0.1);
    }
  }
  
  .form-textarea {
    width: 100%;
    height: 180rpx;
    background-color: #f5f7fa;
    border-radius: $radius-md;
    padding: 20rpx 24rpx;
    font-size: 28rpx;
    color: $text-primary;
    border: 1rpx solid rgba(0,0,0,0.05);
    transition: all 0.3s ease;
    
    &:focus {
      border-color: rgba($primary-color, 0.3);
      background-color: #f0f5ff;
      box-shadow: 0 0 0 2rpx rgba($primary-color, 0.1);
    }
  }
  
  .input-counter {
    font-size: 24rpx;
    color: $text-tertiary;
    text-align: right;
    margin-top: 10rpx;
    display: block;
  }
  
  .picker-value {
    width: 100%;
    height: 90rpx;
    background-color: #f5f7fa;
    border-radius: $radius-md;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: $text-primary;
    @include flex(row, space-between, center);
    border: 1rpx solid rgba(0,0,0,0.05);
    transition: all 0.3s ease;
    
    &:active {
      background-color: #eff1f5;
    }
    
    .iconfont {
      color: $text-tertiary;
      font-size: 24rpx;
    }
  }
  
  &.link-item {
    @include flex(row, space-between, center);
    padding: 24rpx 0;
    border-bottom: 1rpx solid rgba(0,0,0,0.05);
    transition: all 0.3s ease;
    
    &:active {
      background-color: rgba($primary-color, 0.05);
    }
    
    .form-label {
      margin-bottom: 0;
      font-size: 28rpx;
      color: $text-primary;
    }
    
    .iconfont {
      font-size: 24rpx;
      color: $text-tertiary;
    }
  }
}


.background-item {
  .bg-selection-container {
    margin-top: 20rpx;
    padding: 20rpx;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
    border-radius: 24rpx;
    backdrop-filter: blur(20rpx);
    -webkit-backdrop-filter: blur(20rpx);
    border: 1rpx solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  }

  .bg-options-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20rpx;
    padding: 10rpx 0;
  }

  .bg-option {
    width: 100%;
    height: 160rpx;
    border-radius: 20rpx;
    overflow: hidden;
    position: relative;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.05) 100%);
      z-index: 1;
      border-radius: 20rpx;
    }

    .bg-preview {
      width: 100%;
      height: 100%;
      border-radius: 20rpx;
      overflow: hidden;
      box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
      border: 2rpx solid rgba(255, 255, 255, 0.8);

      image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

    }

    .bg-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(43, 133, 228, 0.2) 0%, rgba(107, 167, 240, 0.3) 100%);
      backdrop-filter: blur(4rpx);
      -webkit-backdrop-filter: blur(4rpx);
      border-radius: 20rpx;
      z-index: 2;
      @include center;
    }

    .bg-check {
      width: 60rpx;
      height: 60rpx;
      background: linear-gradient(135deg, #2b85e4 0%, #6ba7f0 100%);
      border-radius: 50%;
      @include center;
      box-shadow: 0 4rpx 16rpx rgba(43, 133, 228, 0.4);
      border: 3rpx solid rgba(255, 255, 255, 0.9);

      .iconfont {
        color: #fff;
        font-size: 28rpx;
        font-weight: bold;
      }
    }

    .bg-hover-effect {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
      border-radius: 20rpx;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 1;
    }

    &.active {
      transform: scale(1.08);

      .bg-preview {
        box-shadow: 0 12rpx 40rpx rgba(43, 133, 228, 0.25);
        border-color: rgba(43, 133, 228, 0.6);
      }
    }

    &:active {
      transform: scale(0.95);

      .bg-hover-effect {
        opacity: 1;
      }
    }

    &.upload-option {
      background: linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.9) 100%);
      border: 2rpx dashed rgba(148, 163, 184, 0.6);
      backdrop-filter: blur(10rpx);
      -webkit-backdrop-filter: blur(10rpx);
      @include center;

      .upload-content {
        @include flex(column, center, center);

        .upload-icon {
          width: 60rpx;
          height: 60rpx;
          background: linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(148, 163, 184, 0.05) 100%);
          border-radius: 50%;
          @include center;
          margin-bottom: 12rpx;

          .iconfont {
            font-size: 32rpx;
            color: #64748b;
          }
        }

        .upload-text {
          font-size: 22rpx;
          color: #64748b;
          font-weight: 500;
        }
      }

      &:active {
        background: linear-gradient(135deg, rgba(241, 245, 249, 0.9) 0%, rgba(226, 232, 240, 0.9) 100%);
        border-color: rgba(148, 163, 184, 0.8);

        .upload-content .upload-icon {
          background: linear-gradient(135deg, rgba(148, 163, 184, 0.15) 0%, rgba(148, 163, 184, 0.1) 100%);
          transform: scale(0.95);
        }
      }
    }
  }
}

.tags-container {
  @include flex(row, flex-start, center);
  flex-wrap: wrap;
  margin-bottom: 20rpx;
  
  .tag-item {
    background: linear-gradient(to right, rgba($primary-color, 0.1), rgba($primary-color, 0.05));
    border-radius: 100rpx;
    padding: 12rpx 24rpx;
    margin-right: 20rpx;
    margin-bottom: 20rpx;
    @include flex(row, center, center);
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
    border: 1rpx solid rgba($primary-color, 0.1);
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.95);
    }
    
    .tag-text {
      font-size: 26rpx;
      color: $primary-color;
      margin-right: 10rpx;
    }
    
    .tag-remove {
      font-size: 26rpx;
      color: #fff;
      width: 34rpx;
      height: 34rpx;
      border-radius: 50%;
      background-color: rgba($primary-color, 0.8);
      @include center;
      transition: all 0.2s ease;
      
      &:active {
        background-color: $primary-color;
      }
    }
  }
  
  .tag-add {
    @include flex(row, center, center);
    padding: 12rpx 24rpx;
    background-color: #f5f7fa;
    border-radius: 100rpx;
    margin-bottom: 20rpx;
    border: 1rpx dashed rgba($primary-color, 0.3);
    transition: all 0.3s ease;
    
    &:active {
      background-color: rgba($primary-color, 0.05);
    }
    
    .iconfont {
      font-size: 24rpx;
      color: $primary-color;
      margin-right: 10rpx;
    }
    
    text {
      font-size: 26rpx;
      color: $primary-color;
    }
  }
}

.tag-input-container {
  @include flex(row, space-between, center);
  margin-bottom: 20rpx;
  
  .tag-input {
    flex: 1;
    height: 80rpx;
    background-color: #f5f7fa;
    border-radius: $radius-md;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: $text-primary;
    margin-right: 20rpx;
    border: 1rpx solid rgba(0,0,0,0.05);
    
    &:focus {
      border-color: rgba($primary-color, 0.3);
      background-color: #f0f5ff;
    }
  }
  
  .tag-add-btn {
    width: 140rpx;
    height: 80rpx;
    background: linear-gradient(to right, $primary-color, lighten($primary-color, 10%));
    color: #fff;
    border-radius: $radius-md;
    font-size: 28rpx;
    @include center;
    padding: 0;
    box-shadow: 0 4rpx 12rpx rgba($primary-color, 0.3);
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.95);
      box-shadow: 0 2rpx 6rpx rgba($primary-color, 0.2);
    }
  }
}

.tag-tip {
  font-size: 24rpx;
  color: $text-tertiary;
  display: block;
  margin-top: 10rpx;
}

.logout-btn {
  width: 90%;
  height: 90rpx;
  background: linear-gradient(to right, $danger-color, lighten($danger-color, 10%));
  color: #fff;
  border-radius: $radius-lg;
  font-size: 32rpx;
  @include center;
  margin: 60rpx auto;
  box-shadow: 0 6rpx 16rpx rgba($danger-color, 0.2);
  border: none;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(255,255,255,0.1), transparent);
  }
  
  &:active {
    transform: scale(0.97);
    box-shadow: 0 3rpx 8rpx rgba($danger-color, 0.15);
  }
}

.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  z-index: 999;
  @include center;
  backdrop-filter: blur(8rpx);
  
  .loading-content {
    width: 220rpx;
    height: 220rpx;
    background-color: rgba(0,0,0,0.7);
    border-radius: $radius-lg;
    @include flex(column, center, center);
    box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.2);
    
    .loading-spinner {
      width: 70rpx;
      height: 70rpx;
      border: 4rpx solid rgba(255,255,255,0.1);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20rpx;
    }
    
    text {
      font-size: 28rpx;
      color: #fff;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 添加上传按钮样式 */
.upload-btn {
  background: linear-gradient(to right, $primary-color, lighten($primary-color, 10%));
  color: white;
  font-size: 28rpx;
  padding: 12rpx 48rpx;
  border-radius: 50rpx;
  margin-top: 20rpx;
  border: none;
  outline: none;
  box-shadow: 0 4rpx 16rpx rgba($primary-color, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(255,255,255,0.2), transparent);
  }
  
  &:active {
    transform: scale(0.95);
    box-shadow: 0 2rpx 8rpx rgba($primary-color, 0.2);
  }
}
</style> 

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 添加上传按钮样式 */
.upload-btn {
  background: linear-gradient(to right, $primary-color, lighten($primary-color, 10%));
  color: white;
  font-size: 28rpx;
  padding: 12rpx 48rpx;
  border-radius: 50rpx;
  margin-top: 20rpx;
  border: none;
  outline: none;
  box-shadow: 0 4rpx 16rpx rgba($primary-color, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(255,255,255,0.2), transparent);
  }
  
  &:active {
    transform: scale(0.95);
    box-shadow: 0 2rpx 8rpx rgba($primary-color, 0.2);
  }
}
</style> 