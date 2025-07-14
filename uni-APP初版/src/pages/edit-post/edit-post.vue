<template>
  <view class="edit-post-container">
    <!-- 顶部标题栏 -->
    <view class="header">
      <view class="back-btn" @tap="goBack">
        <image class="back-icon-img" src="/static/images/icon-back-white.png"></image>
      </view>
      <view class="title">编辑动态</view>
      <view class="right-space"></view>
    </view>

    <!-- 内容区域 -->
    <view class="content-wrapper">
      <!-- 编辑次数提示 -->
      <view class="edit-count-tip" v-if="editCount > 0">
        <view class="edit-count-text">
          <text>这是您第 </text>
          <text :class="{'edit-count-warning': editCount >= 1}">{{editCount + 1}}</text>
          <text> 次编辑此动态</text>
        </view>
        <view class="edit-count-badge" v-if="editCount >= 1">
          <text class="edit-count-badge-text">仅限两次编辑</text>
        </view>
      </view>

      <!-- 无法编辑提示 -->
      <view class="edit-count-tip edit-count-limit" v-if="editCount >= 2">
        <view class="edit-count-text">
          <text class="edit-count-warning">您已用完所有编辑机会</text>
        </view>
        <view class="edit-count-badge edit-count-badge-error">
          <text class="edit-count-badge-text">不可再编辑</text>
        </view>
      </view>

      <!-- 内容输入区域 -->
      <view class="content-card">
        <view class="input-area">
          <textarea 
            class="content-textarea" 
            v-model="postContent" 
            placeholder="分享你的想法..."
            maxlength="1000"
            :adjust-position="false"
            show-confirm-bar="false"
          ></textarea>
          <view class="word-count" :class="{'word-warning': postContent.length > 800}">
            {{postContent.length}}/1000
          </view>
        </view>
      </view>

      <!-- 图片上传区域 -->
      <view class="content-card">
        <view class="image-section">
          <view class="section-header">
            <view class="section-title">添加图片</view>
            <view class="toggle-btn" @tap="clearImages" v-if="postImages.length > 0">清空</view>
          </view>
          <view class="image-list">
            <view 
              class="image-item" 
              v-for="(image, index) in postImages" 
              :key="index"
              @tap="previewImage(index)"
            >
              <image class="preview-image" :src="image.url" mode="aspectFill"></image>
              <view class="delete-btn" @tap.stop="removeImage(index)">×</view>
              <view class="image-mask"></view>
            </view>
            <view class="add-image" @tap="chooseImage" v-if="postImages.length < 9">
              <view class="add-icon iconfont icon-add"></view>
              <view class="add-text">添加</view>
              <view class="add-hint">{{postImages.length}}/9</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 分类选择区域 -->
      <view class="content-card">
        <view class="category-section">
          <view class="section-header">
            <view class="section-title">选择分类</view>
          </view>
          <scroll-view class="category-scroll" scroll-x="true" show-scrollbar="false">
            <view 
              class="category-item" 
              :class="{'active': selectedCategory === category.id}"
              v-for="category in categories" 
              :key="category.id"
              @tap="selectCategory(category.id)"
            >
              <text class="category-icon iconfont" :class="category.icon"></text>
              <text class="category-name">{{category.name}}</text>
            </view>
          </scroll-view>
        </view>
      </view>

      <!-- 其他选项区域 -->
      <view class="content-card">
        <view class="options-section">
          <view class="section-header">
            <view class="section-title">更多选项</view>
          </view>
          
          <!-- 位置信息 -->
          <view class="option-item" @tap="chooseLocation">
            <view class="option-left">
              <text class="option-icon iconfont icon-location"></text>
              <text>位置信息</text>
            </view>
            <view class="option-right">
              <text class="location-text">{{location.name || '添加位置'}}</text>
              <text class="iconfont icon-arrow-right"></text>
            </view>
          </view>
          
          <!-- 可见范围 -->
          <view class="option-item" @tap="toggleVisibility">
            <view class="option-left">
              <text class="option-icon iconfont icon-visibility"></text>
              <text>谁可以看</text>
            </view>
            <view class="option-right">
              <text>{{visibilityText}}</text>
              <text class="iconfont icon-arrow-right"></text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部保存按钮 -->
      <view class="publish-btn-wrap">
        <view class="publish-btn" @tap="savePost">
          <text class="btn-text">保存修改</text>
          <text class="iconfont icon-check" v-if="!isSubmitting"></text>
          <text class="iconfont icon-loading animation-rotate" v-else></text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '../../utils/api.js';
import store from '../../utils/store.js';

export default {
  data() {
    return {
      postId: null,
      originalPost: null,
      postContent: '',
      postImages: [],
      location: {
        name: '',
        address: '',
        latitude: 0,
        longitude: 0
      },
      categories: [
        { id: 1, name: '日常', icon: 'icon-daily' },
        { id: 2, name: '美食', icon: 'icon-food' },
        { id: 3, name: '旅行', icon: 'icon-travel' },
        { id: 4, name: '时尚', icon: 'icon-fashion' },
        { id: 5, name: '科技', icon: 'icon-tech' },
        { id: 6, name: '学习', icon: 'icon-study' },
        { id: 7, name: '健康', icon: 'icon-health' },
        { id: 8, name: '运动', icon: 'icon-sports' },
        { id: 9, name: '其他', icon: 'icon-other' }
      ],
      selectedCategory: 1,
      visibility: 0, // 0-所有人可见, 1-仅关注者可见, 2-仅自己可见
      editCount: 0,
      maxEditCount: 2, // 最大编辑次数
      isLoading: false,
      isSubmitting: false,
      uploadingImages: false
    };
  },
  
  computed: {
    user() {
      return store.getters.getUser();
    },
    
    canPublish() {
      if (this.isSubmitting || this.uploadingImages) {
        return false;
      }
      return this.postContent.trim().length > 0;
    },
    
    canEdit() {
      return this.editCount < this.maxEditCount;
    },
    
    visibilityText() {
      const visibilityMap = ['所有人可见', '仅关注者可见', '仅自己可见'];
      return visibilityMap[this.visibility];
    }
  },
  
  onLoad(options) {
    // 检查是否登录
    if (!this.user || !this.user.id) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
      return;
    }
    
    // 获取帖子ID
    if (options.id) {
      this.postId = options.id;
      // 加载帖子详情
      this.getPostDetail();
    } else {
      uni.showToast({
        title: '帖子ID不存在',
        icon: 'none'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  },
  
  methods: {
    // 获取帖子详情
    async getPostDetail() {
      try {
        this.isLoading = true;
        uni.showLoading({
          title: '加载中...',
          mask: true
        });
        
        const response = await api.posts.get(this.postId);
        
        // 检查响应数据
        if (!response || !response.success) {
          throw new Error(response ? response.message : '获取帖子详情失败');
        }
        
        const post = response.data.post || response.data;
        
        // 检查权限 - 只能编辑自己的帖子
        if (post.userId !== this.user.id) {
          uni.showToast({
            title: '无权编辑该帖子',
            icon: 'none'
          });
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
          return;
        }
        
        // 保存原始帖子数据，用于对比变更
        this.originalPost = post;
        
        // 填充表单数据
        this.postContent = post.content || '';
        
        // 处理图片数据
        this.postImages = post.images && post.images.length > 0 
          ? post.images.map(img => ({ url: img, isNetworkImage: true })) 
          : [];
        
        // 处理位置信息
        if (post.location) {
          if (typeof post.location === 'string') {
            this.location.name = post.location;
          } else {
            this.location = { ...post.location };
          }
        }
        
        // 设置分类
        this.selectedCategory = post.categoryId || 1;
        
        // 设置可见性
        this.visibility = post.visibility || 0;
        
        // 获取编辑次数
        this.editCount = post.editCount || 0;
        
        // 检查是否可编辑
        if (this.editCount >= this.maxEditCount) {
          uni.showModal({
            title: '提示',
            content: '您已达到最大编辑次数限制',
            showCancel: false,
            success: () => {
              uni.navigateBack();
            }
          });
        }
      } catch (error) {
        console.error('获取帖子详情失败:', error);
        uni.showToast({
          title: '获取帖子详情失败: ' + (error.message || '未知错误'),
          icon: 'none'
        });
      } finally {
        this.isLoading = false;
        uni.hideLoading();
      }
    },
    
    // 选择图片
    chooseImage() {
      if (this.postImages.length >= 9) {
        uni.showToast({
          title: '最多只能上传9张图片',
          icon: 'none'
        });
        return;
      }
      
      uni.chooseImage({
        count: 9 - this.postImages.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          // 添加新选择的图片
          const newImages = res.tempFilePaths.map(path => ({ 
            url: path, 
            isNetworkImage: false 
          }));
          this.postImages = [...this.postImages, ...newImages];
        }
      });
    },
    
    // 预览图片
    previewImage(index) {
      const urls = this.postImages.map(img => img.url);
      uni.previewImage({
        current: urls[index],
        urls: urls
      });
    },
    
    // 移除图片
    removeImage(index) {
      this.postImages.splice(index, 1);
    },
    
    // 清空所有图片
    clearImages() {
      uni.showModal({
        title: '提示',
        content: '确定要清空所有图片吗？',
        success: (res) => {
          if (res.confirm) {
            this.postImages = [];
          }
        }
      });
    },
    
    // 选择分类
    selectCategory(categoryId) {
      this.selectedCategory = categoryId;
    },
    
    // 选择位置
    chooseLocation() {
      uni.chooseLocation({
        success: (res) => {
          this.location = {
            name: res.name,
            address: res.address,
            latitude: res.latitude,
            longitude: res.longitude
          };
        }
      });
    },
    
    // 切换可见性
    toggleVisibility() {
      // 循环切换三种可见性状态
      this.visibility = (this.visibility + 1) % 3;
    },
    
    // 上传图片
    async uploadImages() {
      return new Promise((resolve, reject) => {
        // 显示上传状态
        uni.showLoading({
          title: `上传图片 (0/${this.postImages.length})`,
          mask: true
        });
        
        // 过滤出需要上传的本地图片和已上传的网络图片
        const localImages = this.postImages.filter(img => !img.isNetworkImage);
        const networkImages = this.postImages.filter(img => img.isNetworkImage);
        
        // 如果没有本地图片需要上传，直接返回所有网络图片URL
        if (localImages.length === 0) {
          uni.hideLoading();
          resolve(networkImages.map(img => img.url));
          return;
        }
        
        let uploadedCount = 0;
        let uploadedUrls = [];
        
        // 上传每一张本地图片
        localImages.forEach((img, index) => {
          uni.uploadFile({
            url: api.UPLOAD_URL || `${api.baseUrl}/api/upload/image`,
            filePath: img.url,
            name: 'file',
            header: {
              Authorization: `Bearer ${uni.getStorageSync('token')}`
            },
            success: (uploadRes) => {
              uploadedCount++;
              uni.showLoading({
                title: `上传图片 (${uploadedCount}/${localImages.length})`,
                mask: true
              });
              
              try {
                // 解析上传结果
                const data = JSON.parse(uploadRes.data);
                if (data.success && data.data && data.data.url) {
                  // 保存上传后的图片URL
                  uploadedUrls.push(data.data.url);
                } else {
                  throw new Error(data.message || '上传失败');
                }
              } catch (err) {
                console.error('图片上传解析失败:', err);
                reject(err);
                return;
              }
              
              // 全部上传完成
              if (uploadedCount === localImages.length) {
                uni.hideLoading();
                // 合并已上传图片和网络图片
                const allImageUrls = [...uploadedUrls, ...networkImages.map(img => img.url)];
                resolve(allImageUrls);
              }
            },
            fail: (err) => {
              console.error('图片上传失败:', err);
              uni.hideLoading();
              reject(err);
            }
          });
        });
      });
    },
    
    // 保存修改后的帖子
    async savePost() {
      // 检查输入内容是否为空
      if (!this.postContent.trim()) {
        uni.showToast({
          title: '请输入内容',
          icon: 'none'
        });
        return;
      }
      
      // 检查是否超过编辑次数限制
      if (this.editCount >= this.maxEditCount) {
        uni.showToast({
          title: '您已达到最大编辑次数限制',
          icon: 'none'
        });
        return;
      }
      
      try {
        this.isSubmitting = true;
        
        // 上传图片（如果有的话）
        let uploadedImageUrls = [];
        if (this.postImages.length > 0) {
          try {
            uploadedImageUrls = await this.uploadImages();
          } catch (uploadError) {
            uni.showToast({
              title: '图片上传失败: ' + (uploadError.message || '未知错误'),
              icon: 'none'
            });
            this.isSubmitting = false;
            return;
          }
        }
        
        // 提取话题标签
        const topicsRegex = /#([^#\s]+)/g;
        const topics = [];
        let match;
        while ((match = topicsRegex.exec(this.postContent)) !== null) {
          topics.push(match[1]);
        }
        
        // 构建更新数据
        const postData = {
          content: this.postContent,
          images: uploadedImageUrls,
          topics: topics,
          categoryId: this.selectedCategory,
          visibility: this.visibility,
          location: this.location.name ? this.location : null,
          editCount: this.editCount + 1
        };
        
        // 显示保存中提示
        uni.showLoading({
          title: '保存中...',
          mask: true
        });
        
        // 调用API更新帖子
        const response = await api.posts.update(this.postId, postData);
        
        if (response && response.success) {
          uni.hideLoading();
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          // 标记需要刷新上一页
          getApp().globalData.needRefreshPostList = true;
          
          // 跳转回详情页
          setTimeout(() => {
            uni.navigateBack({
              delta: 1,
              complete: () => {
                console.log('保存成功，返回上一页');
              }
            });
          }, 1500);
        } else {
          throw new Error(response ? response.message : '保存失败');
        }
      } catch (error) {
        console.error('保存帖子失败:', error);
        uni.hideLoading();
        uni.showToast({
          title: '保存失败: ' + (error.message || '未知错误'),
          icon: 'none'
        });
      } finally {
        this.isSubmitting = false;
      }
    },
    
    // 返回
    goBack() {
      // 确保在返回前重置所有状态
      uni.navigateBack({
        delta: 1,
        complete: () => {
          // 在完成回调中执行额外操作
          console.log('返回完成，页面应重新刷新');
        }
      });
    }
  }
};
</script>

<style>
.edit-post-container {
  min-height: 100vh;
  background-color: #F7F9FC;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 顶部标题栏 */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 10px 15px;
  background: linear-gradient(135deg, #3270c5, #4165db);
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.2);
  border-radius: 0 0 16px 16px;
}

.back-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transition: all 0.2s;
}

.back-btn:active {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(0.95);
}

.back-icon-img {
  width: 24px;
  height: 24px;
}

.title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 1);
}

.right-space {
  width: 30px;
}

/* 内容容器 */
.content-wrapper {
  flex: 1;
  padding: 0 30rpx;
  margin-top: 10px;
  position: relative;
  z-index: 2;
}

.content-card {
  background: #FFFFFF;
  border-radius: 30rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.08);
  margin-bottom: 30rpx;
  border: none;
}

.input-area {
  position: relative;
  margin-bottom: 30rpx;
}

.content-textarea {
  width: 100%;
  min-height: 200rpx;
  font-size: 28rpx;
  line-height: 1.6;
  padding: 25rpx;
  background-color: rgba(74, 144, 226, 0.03);
  border-radius: 24rpx;
  box-sizing: border-box;
  border: 1rpx solid rgba(74, 144, 226, 0.1);
  transition: all 0.3s;
}

.content-textarea:focus {
  background-color: rgba(74, 144, 226, 0.05);
  border-color: rgba(74, 144, 226, 0.2);
  box-shadow: 0 4rpx 10rpx rgba(74, 144, 226, 0.1);
}

.word-count {
  position: absolute;
  bottom: 15rpx;
  right: 20rpx;
  font-size: 22rpx;
  color: #909399;
  opacity: 0.7;
}

.word-warning {
  color: #FF2B2B;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  position: relative;
  padding-left: 16rpx;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6rpx;
  height: 24rpx;
  background: linear-gradient(to bottom, #4A90E2, #6AB6F7);
  border-radius: 3rpx;
}

.toggle-btn {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #4A90E2;
  background-color: rgba(74, 144, 226, 0.08);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  transition: all 0.3s;
}

.toggle-btn:active {
  background-color: rgba(74, 144, 226, 0.15);
  transform: scale(0.95);
}

.image-section,
.category-section,
.options-section {
  margin-bottom: 40rpx;
  border-bottom: 1px solid rgba(74, 144, 226, 0.08);
  padding-bottom: 40rpx;
}

.options-section {
  border-bottom: none;
  margin-bottom: 20rpx;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10rpx;
}

.image-item {
  width: 180rpx;
  height: 180rpx;
  margin: 10rpx;
  position: relative;
  overflow: hidden;
  border-radius: 20rpx;
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.08);
}

.image-item:active {
  transform: scale(0.97);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 20rpx;
}

.delete-btn {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 40rpx;
  height: 40rpx;
  background-color: rgba(255, 0, 0, 0.7);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 22rpx;
  z-index: 2;
  backdrop-filter: blur(2px);
}

.image-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(transparent 60%, rgba(0, 0, 0, 0.3));
  pointer-events: none;
}

.add-image {
  width: 180rpx;
  height: 180rpx;
  margin: 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(74, 144, 226, 0.05);
  border: 1px dashed rgba(74, 144, 226, 0.3);
  border-radius: 20rpx;
  color: #4A90E2;
  font-size: 24rpx;
  transition: all 0.3s;
}

.add-image:active {
  background-color: rgba(74, 144, 226, 0.1);
  transform: scale(0.97);
}

.add-text {
  margin: 10rpx 0;
}

.add-hint {
  font-size: 22rpx;
  opacity: 0.6;
}

.category-scroll {
  white-space: nowrap;
  padding: 10rpx 0;
}

.category-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 16rpx;
  margin: 0 12rpx;
  width: 140rpx;
  background-color: rgba(74, 144, 226, 0.05);
  border-radius: 24rpx;
  transition: all 0.3s;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
}

.category-item:first-child {
  margin-left: 0;
}

.category-item:active {
  transform: translateY(-2rpx);
  background-color: rgba(74, 144, 226, 0.08);
}

.category-item.active {
  background: linear-gradient(135deg, #4A90E2, #6AB6F7);
  transform: translateY(-4rpx);
  box-shadow: 0 8rpx 20rpx rgba(74, 144, 226, 0.25);
}

.category-item.active .category-name,
.category-item.active .category-icon {
  color: #FFFFFF;
}

.category-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
  color: #4A90E2;
}

.category-name {
  font-size: 24rpx;
  color: #333333;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 1px solid rgba(74, 144, 226, 0.08);
}

.option-item:last-child {
  border-bottom: none;
}

.option-left {
  display: flex;
  align-items: center;
}

.option-icon {
  margin-right: 20rpx;
  color: #4A90E2;
  font-size: 36rpx;
}

.option-right {
  display: flex;
  align-items: center;
  color: #909399;
  font-size: 26rpx;
}

.location-text {
  max-width: 300rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 10rpx;
}

.publish-btn-wrap {
  padding: 20rpx 0 50rpx;
}

.publish-btn {
  width: 100%;
  height: 90rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4A90E2, #6AB6F7);
  color: #FFFFFF;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 20rpx rgba(74, 144, 226, 0.25);
  border: none;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.publish-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0));
  transform: translateX(-100%);
  transition: transform 0.6s;
  z-index: -1;
}

.publish-btn:active {
  transform: translateY(3rpx);
  box-shadow: 0 4rpx 10rpx rgba(74, 144, 226, 0.2);
}

.publish-btn:active::before {
  transform: translateX(0);
}

.btn-text {
  margin-right: 20rpx;
}

/* 编辑次数提示样式 */
.edit-count-tip {
  padding: 20rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.05);
}

.edit-count-text {
  font-size: 28rpx;
  color: #666666;
}

.edit-count-warning {
  color: #FF5722;
  font-weight: bold;
}

.edit-count-badge {
  background-color: #FF9900;
  border-radius: 30rpx;
  padding: 6rpx 20rpx;
  margin-left: 20rpx;
}

.edit-count-badge-text {
  font-size: 24rpx;
  color: #FFFFFF;
  font-weight: 500;
}

.edit-count-limit {
  border-left: 4px solid #FF5722;
  background-color: #FFF7F5;
}

.edit-count-badge-error {
  background-color: #FF5722;
}
</style> 