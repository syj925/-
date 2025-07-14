<template>
   <view class="publish-container">
    <!-- 顶部提示 -->
    <view class="publish-header">
      <text class="header-title">{{ pageTitle }}</text>
      <view class="header-subtitle">分享你的校园生活</view>
      
      <!-- 标题下方装饰元素 -->
      <view class="header-decoration">
        <view class="decoration-dot"></view>
        <view class="decoration-dot"></view>
        <view class="decoration-dot"></view>
      </view>
    </view>

    <view class="content-wrapper">
      <!-- 内容卡片 -->
      <view class="content-card">
        <!-- 文本输入区域 -->
        <view class="input-area">
          <textarea
            class="content-textarea"
            placeholder="分享你的想法..."
            maxlength="500"
            v-model="content"
            auto-height
            placeholder-style="color: #BBBBBB;"
            @input="handleContentInput"
          ></textarea>
          <view class="word-count" :class="{ 'word-warning': content.length > 400 }">
            {{ content.length }}/500
          </view>
          
          <!-- 话题推荐面板 -->
          <view v-if="showTopicSelector" class="topic-selector">
            <view class="topic-selector-header">
              <text class="topic-selector-title">话题推荐</text>
              <text class="topic-selector-close" @tap="closeTopicSelector">×</text>
            </view>
            <view class="topic-selector-body">
              <view class="topic-loading" v-if="loadingTopics">
                <text>正在搜索...</text>
              </view>
              <view v-else class="topic-list">
                <view 
                  v-for="(topic, index) in searchedTopics" 
                  :key="topic.id" 
                  class="topic-item"
                  @tap="selectTopic(topic)"
                >
                  <image 
                    v-if="topic.coverImage" 
                    :src="topic.coverImage" 
                    class="topic-image"
                    mode="aspectFill"
                  ></image>
                  <view v-else class="topic-icon">#</view>
                  <view class="topic-info">
                    <text class="topic-name">{{ topic.name }}</text>
                    <text class="topic-count">{{ topic.usageCount || 0 }}次讨论</text>
                  </view>
                </view>
                <view v-if="searchedTopics.length === 0 && topicKeyword" class="no-topics">
                  <text>没有找到相关话题</text>
                  <view class="create-topic-hint">
                    <text>创建新话题: </text>
                    <text class="create-topic-name" @tap="createAndSelectTopic">#{{ topicKeyword }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 图片选择预览区 -->
        <view class="image-section">
          <view class="section-header">
            <view class="section-title">添加图片</view>
            <view class="toggle-btn" @tap="toggleImagePicker">
              <text>{{ showImagePicker ? '收起' : '展开' }}</text>
              <text class="iconfont" :class="showImagePicker ? 'icon-up' : 'icon-down'"></text>
            </view>
          </view>
          
          <view class="image-picker" v-if="showImagePicker">
            <view class="image-list">
              <view 
                class="image-item" 
                v-for="(item, index) in images" 
                :key="index"
              >
                <image :src="item" mode="aspectFill" class="preview-image"></image>
                <view class="delete-btn" @tap.stop="removeImage(index)">
                  <text class="iconfont icon-delete"></text>
                </view>
                <view class="image-mask"></view>
              </view>
              
              <view class="add-image" @tap="chooseImage" v-if="images.length < 9">
                <text class="iconfont icon-camera"></text>
                <text class="add-text">添加图片</text>
                <text class="add-hint">{{ images.length }}/9</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 分类选择 -->
        <view class="category-section">
          <view class="section-header">
            <view class="section-title">选择分类</view>
          </view>
          <scroll-view scroll-x="true" class="category-scroll" show-scrollbar="false">
            <view 
              v-for="(item, index) in categories" 
              :key="index" 
              class="category-item"
              :class="{ active: currentCategory === index }"
              @tap="setCategory(index)"
            >
              <text class="category-icon iconfont" :class="getCategoryIcon(item.id)"></text>
              <text class="category-name">{{ item.name }}</text>
            </view>
          </scroll-view>
        </view>
        
        <!-- 附加选项 -->
        <view class="options-section">
          <!-- 位置信息 -->
          <view class="option-item" @tap="chooseLocation">
            <view class="option-left">
              <text class="option-icon iconfont icon-location"></text>
              <text>位置信息</text>
            </view>
            <view class="option-right">
              <text class="location-text ellipsis">{{ location || '添加位置' }}</text>
              <text class="iconfont icon-arrow-right"></text>
            </view>
          </view>
          
          <!-- 谁可以看 -->
          <view class="option-item" @tap="selectVisibility">
            <view class="option-left">
              <text class="option-icon iconfont icon-visibility"></text>
              <text>谁可以看</text>
            </view>
            <view class="option-right">
              <text>{{ getVisibilityText() }}</text>
              <text class="iconfont icon-arrow-right"></text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 编辑次数提示 -->
      <view class="edit-count-tip" v-if="isEditMode">
        <text class="edit-count-text" :class="{'edit-count-warning': remainingEdits <= 1}">
          {{ canEdit ? `你还有 ${remainingEdits} 次编辑机会` : '你已用完所有编辑机会' }}
        </text>
        <view class="edit-count-badge" v-if="canEdit">
          <text class="edit-count-badge-text">已编辑 {{ editCount }}/{{ maxEditCount }} 次</text>
        </view>
      </view>

      <!-- 发布按钮 -->
      <view class="publish-btn-wrap">
        <button class="publish-btn" @tap="publishPost" :disabled="!canPublish">
          <text class="btn-text">{{ submitButtonText }}</text>
          <text class="iconfont icon-send"></text>
        </button>
      </view>
    </view>
    
    <!-- 底部安全区域 -->
    <view class="safe-bottom"></view>
    
    <!-- 创建话题弹窗 -->
    <view class="create-topic-dialog" v-if="showCreateTopicDialog">
      <view class="dialog-mask" @tap="hideCreateTopicDialog"></view>
      <view class="dialog-content">
        <view class="dialog-header">
          <text class="dialog-title">创建话题</text>
          <text class="dialog-close" @tap="hideCreateTopicDialog">✕</text>
        </view>
        <view class="dialog-body">
          <view class="input-group">
            <text class="input-label">话题名称</text>
            <input 
              type="text" 
              v-model="newTopic.name" 
              placeholder="请输入话题名称（不含#号）" 
              maxlength="20"
            />
            <text class="input-hint">{{newTopic.name.length}}/20</text>
          </view>
          
          <view class="input-group">
            <text class="input-label">话题描述</text>
            <textarea 
              v-model="newTopic.description" 
              placeholder="请简要描述话题内容" 
              maxlength="100"
            ></textarea>
            <text class="input-hint">{{newTopic.description.length}}/100</text>
          </view>
          
          <view class="input-group">
            <text class="input-label">话题封面</text>
            <text class="image-hint">可选择默认图片或上传自定义图片（自定义图片需要审核）</text>
            
            <view class="image-tabs">
              <text 
                class="tab-item" 
                :class="{active: imageTab === 'default'}" 
                @tap="switchImageTab('default')"
              >默认图片</text>
              <text 
                class="tab-item" 
                :class="{active: imageTab === 'custom'}" 
                @tap="switchImageTab('custom')"
              >上传图片</text>
            </view>
            
            <view class="default-images" v-if="imageTab === 'default'">
              <view 
                class="default-image-item" 
                v-for="(img, index) in defaultImages" 
                :key="index"
                :class="{selected: newTopic.coverImage === img}"
                @tap="selectDefaultImage(img)"
              >
                <image :src="img" mode="aspectFill"></image>
              </view>
            </view>
            
            <view class="custom-image" v-if="imageTab === 'custom'">
              <view class="image-upload" @tap="chooseTopicImage" v-if="!newTopic.customImage">
                <text class="iconfont icon-camera"></text>
                <text>上传图片</text>
              </view>
              <view class="image-preview" v-else>
                <image :src="newTopic.customImage" mode="aspectFill"></image>
                <view class="delete-btn" @tap="removeCustomImage">
                  <text class="iconfont icon-delete"></text>
                </view>
              </view>
              <text class="upload-hint">*上传的图片需要审核后才会显示</text>
            </view>
          </view>
        </view>
        <view class="dialog-footer">
          <button class="cancel-btn" @tap="hideCreateTopicDialog">取消</button>
          <button 
            class="confirm-btn" 
            :disabled="!canCreateTopic" 
            @tap="createTopic"
          >创建</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '../../utils/api.js';
import config from '../../utils/config.js';

export default {
  data() {
    return {
      content: '',
      images: [],
      location: '',
      showImagePicker: true,
      currentCategory: 0,
      visibility: 0, // 0: 所有人, 1: 仅关注者, 2: 仅自己
      staticCategories: [
        { name: '全部', id: 0 }
      ],
      dynamicCategories: [],
      uploadingImages: false,
      publishingPost: false,
      showTopicSelector: false,
      loadingTopics: false,
      searchedTopics: [],
      topicKeyword: '',
      lastCursorPosition: 0,
      searchTimeout: null,
      selectedTopics: [],
      // 新增属性用于创建话题功能
      showCreateTopicDialog: false,
      imageTab: 'default',
      defaultImages: [
        '/static/images/topic-default-1.jpg',
        '/static/images/topic-default-2.jpg',
        '/static/images/topic-default-3.jpg',
        '/static/images/topic-default-4.jpg',
        '/static/images/topic-default-5.jpg'
      ],
      newTopic: {
        name: '',
        description: '',
        coverImage: '',
        customImage: '',
        imageStatus: 'default'
      },
      // 新增编辑模式相关字段
      isEditMode: false,
      postId: null,
      originalPost: null,
      loadingPost: false,
      editCount: 0,
      maxEditCount: 2,
      canEdit: true
    }
  },
  onLoad(options) {
    console.log('publish.vue onLoad 收到参数:', JSON.stringify(options));
    
    // 获取分类数据
    this.fetchCategories();
    
    if (options.id && options.type === 'edit') {
      // 进入编辑模式
      console.log('进入编辑模式, 帖子ID:', options.id);
      this.isEditMode = true;
      this.postId = options.id;
      
      // 显示加载动画
      uni.showLoading({
        title: '加载帖子内容...',
        mask: true
      });
      
      this.loadingPost = true;
      
      // 获取帖子详情
      this.getPostDetail(options.id);
    } else {
      console.log('进入创建模式');
    }
  },
  computed: {
    canPublish() {
      // 添加编辑次数限制
      if (this.isEditMode && !this.canEdit) {
        return false;
      }
      return this.content.trim().length > 0;
    },
    
    // 处理过的内容，包含已选中的话题
    parsedContent() {
      // 目前仅返回原始内容，实际发布时在handleSubmit中处理
      return this.content;
    },
    
    // 判断是否可以创建话题
    canCreateTopic() {
      return this.newTopic.name.trim().length > 0 && 
        (this.imageTab === 'default' ? !!this.newTopic.coverImage : true);
    },
    
    // 页面标题
    pageTitle() {
      return this.isEditMode ? '编辑帖子' : '创建新内容';
    },
    
    // 按钮文本
    submitButtonText() {
      return this.isEditMode ? '保存修改' : '立即发布';
    },
    
    // 剩余编辑次数
    remainingEdits() {
      return this.maxEditCount - this.editCount;
    },
    
    // 合并静态和动态分类
    categories() {
      return [...this.staticCategories, ...this.dynamicCategories];
    }
  },
  methods: {
    // 获取分类数据
    async fetchCategories() {
      try {
        console.log('开始获取分类数据...');
        const res = await api.content.getCategoriesByType('post');
        console.log('获取到的原始分类数据:', res);
        
        // 处理API直接返回数组的情况
        if (Array.isArray(res)) {
          this.dynamicCategories = res.map(category => ({
            name: category.name,
            id: category.id,
            icon: this.getCategoryIcon(category.id) // 使用现有的图标映射
          }));
          console.log('发布页面分类数据获取成功(直接数组):', this.dynamicCategories);
        } 
        // 处理标准响应格式的情况
        else if (res && res.success && Array.isArray(res.data)) {
          this.dynamicCategories = res.data.map(category => ({
            name: category.name,
            id: category.id,
            icon: this.getCategoryIcon(category.id) // 使用现有的图标映射
          }));
          console.log('发布页面分类数据获取成功(标准响应):', this.dynamicCategories);
        } else {
          console.error('获取分类数据失败或返回格式不正确:', res);
        }
      } catch (error) {
        console.error('获取分类数据异常:', error);
      }
    },
    
    // 获取分类图标
    getCategoryIcon(id) {
      const iconMap = {
        0: 'icon-all',
        1: 'icon-activity',
        2: 'icon-lost',
        3: 'icon-job',
        4: 'icon-secondhand',
        5: 'icon-heart'
      };
      return iconMap[id] || 'icon-tag';
    },
    
    // 处理内容输入
    handleContentInput(e) {
      const text = this.content;
      
      // 检测是否输入了#号
      if (text.endsWith('#')) {
        this.topicKeyword = '';
        this.showTopicSelector = true;
        return;
      }
      
      // 如果话题选择框已打开并且有#号，继续搜索
      if (this.showTopicSelector) {
        const lastHashIndex = text.lastIndexOf('#');
        if (lastHashIndex >= 0) {
          // 从#号后面提取搜索关键词
          this.topicKeyword = text.substring(lastHashIndex + 1).trim();
          
          // 设置搜索延迟，防止频繁请求
          if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
          }
          
          this.searchTimeout = setTimeout(() => {
            if (this.topicKeyword) {
              this.searchTopics(this.topicKeyword);
            }
          }, 300);
        } else {
          // 如果没有#号，关闭选择器
          this.closeTopicSelector();
        }
      }
    },
    
    // 搜索话题
    async searchTopics(keyword) {
      if (!keyword) return;
      
      this.loadingTopics = true;
      
      try {
        const result = await api.topics.search(keyword);
        if (result.success) {
          this.searchedTopics = result.data || [];
        } else {
          console.error('搜索话题失败:', result.message);
          this.searchedTopics = [];
        }
      } catch (error) {
        console.error('搜索话题异常:', error);
        this.searchedTopics = [];
      } finally {
        this.loadingTopics = false;
      }
    },
    
    // 关闭话题选择器
    closeTopicSelector() {
      this.showTopicSelector = false;
      this.searchedTopics = [];
      this.topicKeyword = '';
    },
    
    // 选择话题
    selectTopic(topic) {
      // 找到最后一个#号的位置
      const text = this.content;
      const lastHashIndex = text.lastIndexOf('#');
      
      if (lastHashIndex >= 0) {
        // 替换从#到当前位置的文本为话题
        const beforeHash = text.substring(0, lastHashIndex);
        const afterCurrentWord = text.substring(lastHashIndex + this.topicKeyword.length + 1);
        
        // 构建新内容，加入话题并添加一个空格
        this.content = beforeHash + `#${topic.name} ` + afterCurrentWord;
        
        // 记录已选择的话题
        this.selectedTopics.push(topic);
      }
      
      // 关闭选择器
      this.closeTopicSelector();
    },
    
    // 创建并选择新话题
    createAndSelectTopic() {
      if (!this.topicKeyword) return;
      
      // 设置新话题名称
      this.newTopic.name = this.topicKeyword;
      
      // 显示创建话题弹窗
      this.showCreateTopicDialog = true;
    },
    
    // 隐藏创建话题弹窗
    hideCreateTopicDialog() {
      this.showCreateTopicDialog = false;
      // 重置表单
      this.newTopic = {
        name: this.topicKeyword, // 保留话题名称，如果用户再次点击创建
        description: '',
        coverImage: '',
        customImage: '',
        imageStatus: 'default'
      };
      this.imageTab = 'default';
    },
    
    // 切换图片选项卡
    switchImageTab(tab) {
      this.imageTab = tab;
    },
    
    // 选择默认图片
    selectDefaultImage(img) {
      this.newTopic.coverImage = img;
      this.newTopic.imageStatus = 'default';
    },
    
    // 选择自定义图片
    chooseTopicImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.newTopic.customImage = res.tempFilePaths[0];
          this.newTopic.imageStatus = 'pending';
        }
      });
    },
    
    // 移除自定义图片
    removeCustomImage() {
      this.newTopic.customImage = '';
      this.newTopic.imageStatus = 'default';
    },
    
    // 创建话题
    async createTopic() {
      if (!this.canCreateTopic) return;
      
      uni.showLoading({
        title: '创建中...',
        mask: true
      });
      
      try {
        // 如果选择上传自定义图片
        if (this.imageTab === 'custom' && this.newTopic.customImage) {
          // 先上传图片
          const imageUrl = await this.uploadTopicImage(this.newTopic.customImage);
          
          // 创建话题数据
          const topicData = {
            name: this.newTopic.name,
            description: this.newTopic.description,
            pendingImage: imageUrl,
            imageStatus: 'pending'
          };
          
          // 调用API创建话题
          const res = await api.topics.create(topicData);
          
          uni.hideLoading();
          
          if (res.success) {
            uni.showToast({
              title: '创建成功，图片待审核',
              icon: 'success'
            });
            
            // 关闭弹窗并使用创建的话题
            this.hideCreateTopicDialog();
            
            // 使用创建的话题
            const newTopic = res.data.topic || {
              id: res.data.id || `new_${Date.now()}`,
              name: this.newTopic.name,
              usageCount: 0
            };
            
            this.selectTopic(newTopic);
          } else {
            uni.showToast({
              title: res.message || '创建失败',
              icon: 'none'
            });
          }
        } else {
          // 使用默认图片
          const topicData = {
            name: this.newTopic.name,
            description: this.newTopic.description,
            coverImage: this.newTopic.coverImage,
            imageStatus: 'default'
          };
          
          // 调用API创建话题
          const res = await api.topics.create(topicData);
          
          uni.hideLoading();
          
          if (res.success) {
            uni.showToast({
              title: '创建成功',
              icon: 'success'
            });
            
            // 关闭弹窗并使用创建的话题
            this.hideCreateTopicDialog();
            
            // 使用创建的话题
            const newTopic = res.data.topic || {
              id: res.data.id || `new_${Date.now()}`,
              name: this.newTopic.name,
              usageCount: 0
            };
            
            this.selectTopic(newTopic);
          } else {
            uni.showToast({
              title: res.message || '创建失败',
              icon: 'none'
            });
          }
        }
      } catch (error) {
        uni.hideLoading();
        console.error('创建话题失败:', error);
        uni.showToast({
          title: '创建失败，请重试',
          icon: 'none'
        });
      }
    },
    
    // 上传话题图片
    uploadTopicImage(filePath) {
      return new Promise((resolve, reject) => {
        uni.uploadFile({
          url: config.UPLOAD_URL, 
          filePath: filePath,
          name: 'file',
          header: {
            Authorization: `Bearer ${uni.getStorageSync('token')}`
          },
          success: (uploadRes) => {
            try {
              // 解析上传结果
              const data = JSON.parse(uploadRes.data);
              if (data.success && data.data && data.data.url) {
                resolve(data.data.url);
              } else {
                reject(new Error(data.message || '图片上传失败'));
              }
            } catch (e) {
              reject(new Error('解析上传结果失败'));
            }
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    },
    
    // 获取可见性文本
    getVisibilityText() {
      const visibilityMap = ['所有人可见', '仅关注者可见', '仅自己可见'];
      return visibilityMap[this.visibility];
    },
    
    // 选择可见性
    selectVisibility() {
      uni.showActionSheet({
        itemList: ['所有人可见', '仅关注者可见', '仅自己可见'],
        success: (res) => {
          this.visibility = res.tapIndex;
        }
      });
    },
    
    // 设置分类
    setCategory(index) {
      this.currentCategory = index;
    },
    
    // 切换图片选择器
    toggleImagePicker() {
      this.showImagePicker = !this.showImagePicker;
    },
    
    // 选择图片
    chooseImage() {
      if (this.images.length >= 9) {
        uni.showToast({
          title: '最多只能上传9张图片',
          icon: 'none'
        });
        return;
      }
      
      uni.chooseImage({
        count: 9 - this.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          // 预览图片
          this.images = [...this.images, ...res.tempFilePaths];
          this.showImagePicker = true;
        }
      });
    },
    
    // 移除图片
    removeImage(index) {
      this.images.splice(index, 1);
    },
    
    // 选择位置
    chooseLocation() {
      uni.chooseLocation({
        success: (res) => {
          this.location = res.name;
        }
      });
    },
    
    // 上传图片
    async uploadImages() {
      return new Promise((resolve, reject) => {
        const uploadedUrls = [];
        let failedCount = 0;
        let completedCount = 0;
        
        // 显示上传状态
        uni.showLoading({
          title: `上传图片 (0/${this.images.length})`,
          mask: true
        });
        
        // 过滤出需要上传的本地图片路径（非网络URL）
        const localImages = this.images.filter(path => path.startsWith('file://') || path.startsWith('/tmp') || path.startsWith('blob:'));
        const networkImages = this.images.filter(path => !localImages.includes(path));
        
        // 如果没有本地图片需要上传，直接返回所有图片
        if (localImages.length === 0) {
          uni.hideLoading();
          resolve(this.images);
          return;
        }
        
        // 逐个上传图片
        localImages.forEach((tempFilePath, index) => {
          uni.uploadFile({
            url: config.UPLOAD_URL,
            filePath: tempFilePath,
            name: 'file',
            header: {
              'Authorization': `Bearer ${uni.getStorageSync('token')}`
            },
            success: (res) => {
              completedCount++;
              
              // 更新加载提示
              uni.showLoading({
                title: `上传图片 (${completedCount}/${localImages.length})`,
                mask: true
              });
              
              if (res.statusCode === 200) {
                try {
                  // 解析响应数据
                  const data = JSON.parse(res.data);
                  if (data.success && data.data && data.data.url) {
                    uploadedUrls.push(data.data.url);
                  } else {
                    failedCount++;
                    console.error('图片上传失败:', data);
                  }
                } catch (error) {
                  failedCount++;
                  console.error('解析上传响应失败:', error);
                }
              } else {
                failedCount++;
                console.error('图片上传请求失败:', res);
              }
            },
            fail: (err) => {
              failedCount++;
              completedCount++;
              console.error('图片上传失败:', err);
              
              // 更新加载提示
              uni.showLoading({
                title: `上传图片 (${completedCount}/${localImages.length})`,
                mask: true
              });
            },
            complete: () => {
              // 所有图片都已处理完成
              if (completedCount >= localImages.length) {
                this.uploadingImages = false;
                uni.hideLoading();
                
                // 如果有上传失败的图片，提示用户
                if (failedCount > 0) {
                  uni.showToast({
                    title: `${failedCount}张图片上传失败`,
                    icon: 'none'
                  });
                }
                
                // 合并已上传的图片URL和原有的网络图片URL
                resolve([...networkImages, ...uploadedUrls]);
              }
            }
          });
        });
      });
    },

    // 发布帖子
    async publishPost() {
      if (!this.canPublish) return;
      
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      
      // 检查编辑次数限制
      if (this.isEditMode && !this.canEdit) {
        uni.showToast({
          title: '已达到最大编辑次数限制',
          icon: 'none'
        });
        return;
      }
      
      this.publishingPost = true;
      
      // 显示加载提示
      uni.showLoading({
        title: this.isEditMode ? '保存中...' : '发布中...',
        mask: true
      });
      
      try {
        // 上传图片（如果有的话）
        let uploadedImageUrls = [];
        if (this.images.length > 0) {
          this.uploadingImages = true;
          uploadedImageUrls = await this.uploadImages();
        }
        
        // 提取内容中的话题标签 (#话题)
        const topicsRegex = /#([^\s#]+)/g;
        const topics = [];
        let match;
        while ((match = topicsRegex.exec(this.content)) !== null) {
          topics.push(match[1]);
        }
        
        const postData = {
          content: this.content,
          images: uploadedImageUrls,
          topics: topics,
          categoryId: this.categories[this.currentCategory].id,
          visibility: this.visibility,
          location: this.location || ''
        };
        
        let result;
        
        if (this.isEditMode) {
          // 更新帖子
          postData.editCount = this.editCount + 1;
          result = await api.posts.update(this.postId, postData);
        } else {
          // 创建新帖子
          result = await api.posts.create(postData);
        }
        
        // 隐藏加载提示
        uni.hideLoading();
        
        if (result.success) {
          uni.showToast({
            title: this.isEditMode ? '修改成功' : '发布成功',
            icon: 'success'
          });
          
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({
            title: result.message || '操作失败',
            icon: 'none'
          });
        }
      } catch (error) {
        // 隐藏加载提示
        uni.hideLoading();
        
        console.error('发布失败:', error);
        uni.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
      } finally {
        this.publishingPost = false;
      }
    },
    
    // 获取帖子详情
    async getPostDetail(postId) {
      try {
        console.log('开始获取帖子详情, postId:', postId);
        
        uni.showLoading({
          title: '加载帖子内容...',
          mask: true
        });
        
        // 确认API正确调用
        console.log('调用API: api.posts.get, 参数:', postId);
        const result = await api.posts.get(postId);
        console.log('获取帖子详情结果:', JSON.stringify(result));
        
        if (result.success) {
          // 检查数据结构
          if (!result.data) {
            console.error('API返回成功但没有data字段');
            throw new Error('获取帖子数据格式错误');
          }
          
          // 确定正确的数据对象
          this.originalPost = result.data.post || result.data;
          console.log('解析后的帖子数据:', JSON.stringify(this.originalPost));
          
          // 设置表单字段
          this.content = this.originalPost.content || '';
          this.images = this.originalPost.images || [];
          this.location = this.originalPost.location || '';
          this.visibility = this.originalPost.visibility || 0;
          
          // 设置分类
          if (this.originalPost.categoryId) {
            const categoryIndex = this.categories.findIndex(c => c.id === this.originalPost.categoryId);
            this.currentCategory = categoryIndex >= 0 ? categoryIndex : 0;
          }
          
          // 设置编辑次数
          this.editCount = this.originalPost.editCount || 0;
          
          // 检查编辑次数限制
          this.canEdit = this.editCount < this.maxEditCount;
          
          console.log('编辑次数:', this.editCount);
          console.log('剩余编辑次数:', this.remainingEdits);
          console.log('是否可编辑:', this.canEdit);
          
          if (!this.canEdit) {
            uni.showToast({
              title: '该帖子已达到最大编辑次数限制',
              icon: 'none',
              duration: 2000
            });
          } else if (this.remainingEdits === 1) {
            // 最后一次编辑机会
            uni.showToast({
              title: '这是你的最后一次编辑机会',
              icon: 'none',
              duration: 2000
            });
          }
        } else {
          console.error('获取帖子详情失败, 错误信息:', result.message);
          uni.showToast({
            title: result.message || '获取帖子详情失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('获取帖子详情异常:', error);
        uni.showToast({
          title: '获取帖子详情异常: ' + (error.message || '未知错误'),
          icon: 'none'
        });
      } finally {
        this.loadingPost = false;
        uni.hideLoading();
        console.log('帖子详情加载完成');
      }
    }
  }
}
</script>

<style>
.publish-container {
  min-height: 100vh;
  background-color: #F7F9FC;
  position: relative;
  display: flex;
  flex-direction: column;
}

.publish-header {
  padding-top: calc(var(--status-bar-height) + 10rpx);
  height: 220rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 40rpx;
  padding-bottom: 40rpx;
  background: linear-gradient(135deg, #4A90E2, #6AB6F7);
  color: #FFFFFF;
  position: relative;
  z-index: 1;
  border-radius: 0 0 40rpx 40rpx;
  box-shadow: 0 6rpx 16rpx rgba(74, 144, 226, 0.2);
  overflow: hidden;
}

.header-decoration {
  position: absolute;
  bottom: 20rpx;
  right: 40rpx;
  display: flex;
}

.decoration-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.4);
  margin-right: 10rpx;
}

.decoration-dot:nth-child(2) {
  opacity: 0.6;
}

.decoration-dot:nth-child(3) {
  opacity: 0.3;
}

.header-title {
  font-size: 40rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.header-subtitle {
  font-size: 26rpx;
  opacity: 0.9;
}

/* 内容容器 */
.content-wrapper {
  flex: 1;
  padding: 0 30rpx;
  margin-top: -40rpx;
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
  padding: 30rpx 0 50rpx;
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

.safe-bottom {
  height: 60rpx;
}

.topic-selector {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 10rpx);
  background-color: #FFFFFF;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 100;
}

.topic-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid rgba(74, 144, 226, 0.1);
}

.topic-selector-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.topic-selector-close {
  font-size: 40rpx;
  color: #999999;
  padding: 0 20rpx;
}

.topic-selector-body {
  max-height: 500rpx;
  overflow-y: auto;
}

.topic-loading {
  padding: 40rpx 0;
  display: flex;
  justify-content: center;
  color: #999999;
  font-size: 28rpx;
}

.topic-list {
  padding: 10rpx 0;
}

.topic-item {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid rgba(74, 144, 226, 0.05);
}

.topic-item:active {
  background-color: rgba(74, 144, 226, 0.05);
}

.topic-image {
  width: 80rpx;
  height: 80rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
}

.topic-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
  background: linear-gradient(135deg, #4A90E2, #6AB6F7);
  color: #FFFFFF;
  font-size: 36rpx;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
}

.topic-info {
  flex: 1;
}

.topic-name {
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 6rpx;
  display: block;
}

.topic-count {
  font-size: 24rpx;
  color: #999999;
}

.no-topics {
  padding: 40rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999999;
  font-size: 28rpx;
}

.create-topic-hint {
  margin-top: 20rpx;
  display: flex;
  align-items: center;
}

.create-topic-name {
  color: #4A90E2;
  font-weight: 600;
  padding: 6rpx 12rpx;
  background-color: rgba(74, 144, 226, 0.1);
  border-radius: 6rpx;
  margin-left: 10rpx;
}

/* 话题标签样式 */
.topic-tag {
  color: #4A90E2;
  font-weight: 600;
  background-color: rgba(74, 144, 226, 0.1);
  border-radius: 6rpx;
  padding: 2rpx 0;
}

/* 创建话题弹窗样式 */
.create-topic-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.dialog-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.3s ease-out;
}

.dialog-content {
  position: absolute;
  left: 50rpx;
  right: 50rpx;
  top: 50%;
  transform: translateY(-50%);
  background-color: #FFFFFF;
  border-radius: 30rpx;
  overflow: hidden;
  animation: zoomIn 0.3s ease-out;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #F2F2F2;
}

.dialog-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333333;
}

.dialog-close {
  width: 60rpx;
  height: 60rpx;
  line-height: 60rpx;
  text-align: center;
  color: #999999;
  font-size: 38rpx;
}

.dialog-body {
  padding: 30rpx;
  max-height: 800rpx;
  overflow-y: auto;
}

.input-group {
  margin-bottom: 30rpx;
}

.input-label {
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 20rpx;
  display: block;
}

.input-group input {
  width: 100%;
  height: 80rpx;
  background-color: #F9F9F9;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.input-group textarea {
  width: 100%;
  height: 160rpx;
  background-color: #F9F9F9;
  border-radius: 10rpx;
  padding: 20rpx;
  font-size: 28rpx;
}

.input-hint {
  font-size: 24rpx;
  color: #999999;
  margin-top: 10rpx;
  text-align: right;
}

.image-hint {
  font-size: 24rpx;
  color: #666666;
  margin-bottom: 20rpx;
  display: block;
}

.image-tabs {
  display: flex;
  border-bottom: 1rpx solid #F2F2F2;
  margin-bottom: 20rpx;
}

.tab-item {
  padding: 20rpx 30rpx;
  font-size: 28rpx;
  color: #666666;
  position: relative;
}

.tab-item.active {
  color: #4A90E2;
  font-weight: bold;
}

.tab-item.active:after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 60rpx;
  height: 6rpx;
  background-color: #4A90E2;
  border-radius: 3rpx;
}

.default-images {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10rpx;
}

.default-image-item {
  width: calc(33.33% - 20rpx);
  margin: 10rpx;
  position: relative;
  border-radius: 10rpx;
  overflow: hidden;
  border: 2rpx solid transparent;
}

.default-image-item.selected {
  border-color: #4A90E2;
}

.default-image-item image {
  width: 100%;
  height: 160rpx;
  display: block;
}

.custom-image {
  margin-top: 20rpx;
}

.image-upload {
  width: 100%;
  height: 300rpx;
  background-color: #F9F9F9;
  border-radius: 10rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999999;
}

.image-upload .iconfont {
  font-size: 60rpx;
  margin-bottom: 20rpx;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 300rpx;
  border-radius: 10rpx;
  overflow: hidden;
}

.image-preview image {
  width: 100%;
  height: 100%;
  display: block;
}

.delete-btn {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  width: 60rpx;
  height: 60rpx;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 30rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #FFFFFF;
}

.upload-hint {
  font-size: 24rpx;
  color: #FF9900;
  margin-top: 10rpx;
  display: block;
}

.dialog-footer {
  display: flex;
  padding: 20rpx 30rpx 40rpx;
  border-top: 1rpx solid #F2F2F2;
}

.cancel-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  background-color: #F2F2F2;
  border-radius: 40rpx;
  font-size: 28rpx;
  color: #666666;
  margin-right: 20rpx;
}

.confirm-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  background: linear-gradient(to right, #4A90E2, #6AB6F7);
  border-radius: 40rpx;
  font-size: 28rpx;
  color: #FFFFFF;
  font-weight: bold;
}

.confirm-btn[disabled] {
  opacity: 0.6;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes zoomIn {
  from { 
    opacity: 0;
    transform: translateY(-50%) scale(0.9);
  }
  to { 
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}

/* 编辑次数提示样式 */
.edit-count-tip {
  padding: 20rpx;
  background-color: #FFFFFF;
  border-bottom: 1px solid rgba(74, 144, 226, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.edit-count-text {
  font-size: 24rpx;
  color: #999999;
}

.edit-count-warning {
  color: #FF5722;
}

.edit-count-badge {
  background-color: #FF9900;
  border-radius: 10rpx;
  padding: 2rpx 10rpx;
  margin-left: 10rpx;
}

.edit-count-badge-text {
  font-size: 22rpx;
  color: #FFFFFF;
}
</style> 