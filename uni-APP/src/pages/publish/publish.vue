<template>
  <view class="publish-page">
    <!-- 自定义导航栏 -->
    <view class="custom-nav" :style="{ height: statusBarHeight + 44 + 'px', paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <view class="nav-left" @tap="goBack">
          <view class="nav-back"></view>
        </view>
        <view class="nav-title">发布帖子</view>
        <view class="nav-right">
          <text class="nav-publish" :class="{ active: canPublish }" @tap="submitPost">发布</text>
        </view>
      </view>
    </view>
    
    <!-- 内容区 -->
    <scroll-view class="publish-scroll" scroll-y :style="{ paddingTop: statusBarHeight + 44 + 'px' }">
      <view class="publish-content">
        <!-- 主要编辑区卡片 -->
        <view class="edit-card">
          <!-- 标题 -->
          <view class="publish-title">
            <input 
              class="title-input" 
              type="text" 
              maxlength="30" 
              placeholder="请输入标题（选填）" 
              v-model="form.title"
              @input="onTitleInput"
            />
            <text class="title-count">{{ form.title.length }}/30</text>
          </view>
          
          <view class="divider"></view>
          
          <!-- 内容 -->
          <view class="publish-textarea-wrap">
            <textarea 
              class="publish-textarea" 
              placeholder="分享你的校园生活..." 
              maxlength="1000"
              v-model="form.content"
              @input="onContentInput"
              :auto-height="true"
              :show-confirm-bar="false"
              :cursor-spacing="80"
            ></textarea>
          </view>
          
          <!-- 图片上传 -->
          <view class="publish-images" v-if="form.images.length > 0 || form.images.length < maxImages">
            <view 
              class="image-item" 
              v-for="(image, index) in form.images" 
              :key="index"
            >
              <image class="preview-image" :src="image" mode="aspectFill"></image>
              <view class="image-delete" @tap="deleteImage(index)">×</view>
            </view>
            
            <!-- 上传按钮 -->
            <view 
              class="image-upload" 
              @tap="chooseImage" 
              v-if="form.images.length < maxImages"
            >
              <view class="upload-icon">+</view>
              <text class="upload-text">{{ form.images.length }}/{{ maxImages }}</text>
            </view>
          </view>
        </view>
        
        <!-- 属性设置卡片 -->
        <view class="options-card">
          <view class="option-item" @tap="chooseLocation">
            <view class="option-left">
              <view class="option-icon location-icon"></view>
              <text class="option-label">所在位置</text>
            </view>
            <view class="option-right">
              <text class="option-value">{{ form.location || '未选择' }}</text>
              <view class="option-arrow"></view>
            </view>
          </view>
          
          <view class="option-item" @tap="showCategoryPicker">
            <view class="option-left">
              <view class="option-icon category-icon"></view>
              <text class="option-label">分类</text>
            </view>
            <view class="option-right">
              <text class="option-value">{{ getCategoryName() }}</text>
              <view class="option-arrow"></view>
            </view>
          </view>
        </view>
        
        <!-- 话题卡片 -->
        <view class="topics-card">
          <view class="topics-header">
            <text class="topics-title">添加话题</text>
            <text class="topics-count">{{ form.tags.length }}/{{ maxTags }}</text>
          </view>

          <!-- 已选择的话题 -->
          <view class="topics-content" v-if="form.tags.length > 0">
            <view class="tag-list">
              <view
                class="tag-item"
                v-for="(tag, index) in form.tags"
                :key="index"
              >
                <text class="tag-text">#{{ tag }}</text>
                <view class="tag-delete" @tap="deleteTag(index)">×</view>
              </view>
            </view>
          </view>

          <!-- 添加话题按钮 -->
          <view class="add-topic-section" v-if="form.tags.length < maxTags">
            <view class="tag-add" @tap="showTagInput">
              <text class="tag-add-icon">+</text>
              <text class="tag-add-text">添加话题</text>
            </view>
          </view>

          <!-- 话题输入和搜索 -->
          <view class="tag-input-section" v-if="showingTagInput">
            <view class="tag-input-wrap">
              <input
                class="tag-input"
                type="text"
                maxlength="20"
                placeholder="搜索或创建话题"
                v-model="tagInput"
                :focus="showingTagInput"
                @input="onTagInputChange"
                @blur="onTagInputBlur"
                @confirm="addTag"
              />
              <text class="tag-input-btn" @tap="addTag" v-if="tagInput.trim()">确定</text>
              <text class="tag-cancel-btn" @tap="hideTagInput">取消</text>
            </view>

            <!-- 搜索结果 -->
            <view class="tag-search-results" v-if="searchResults.length > 0">
              <view class="search-results-header">
                <text class="results-title">搜索结果</text>
              </view>
              <view
                class="search-result-item"
                v-for="(topic, index) in searchResults"
                :key="topic.id"
                @tap="selectSearchResult(topic)"
              >
                <text class="result-name">#{{ topic.name }}</text>
                <text class="result-count">{{ topic.post_count || 0 }}个内容</text>
              </view>
            </view>

            <!-- 热门话题推荐 -->
            <view class="hot-topics-section" v-if="!tagInput.trim() && hotTopics.length > 0">
              <view class="hot-topics-header">
                <text class="hot-title">热门话题</text>
              </view>
              <view class="hot-topics-list">
                <view
                  class="hot-topic-item"
                  v-for="(topic, index) in hotTopics"
                  :key="topic.id"
                  @tap="selectHotTopic(topic)"
                >
                  <text class="hot-topic-name">#{{ topic.name }}</text>
                  <text class="hot-topic-count">{{ formatNumber(topic.post_count || 0) }}</text>
                </view>
              </view>
            </view>

            <!-- 创建新话题提示 -->
            <view class="create-topic-hint" v-if="tagInput.trim() && searchResults.length === 0 && !searchLoading" @tap="showCreateTopicModal">
              <text class="hint-text">创建新话题 "#{{ tagInput.trim() }}"</text>
              <text class="hint-action">点击创建</text>
            </view>

            <!-- 搜索加载状态 -->
            <view class="search-loading" v-if="searchLoading">
              <text class="loading-text">搜索中...</text>
            </view>
          </view>
        </view>
        
        <!-- 底部安全区域 -->
        <view class="safe-area-bottom"></view>
      </view>
    </scroll-view>

    <!-- 话题创建弹窗 -->
    <TopicCreateModal
      ref="topicCreateModal"
      :visible="showingCreateModal"
      :initialName="pendingTopicName"
      @close="hideCreateTopicModal"
      @submit="handleCreateTopic"
    />
  </view>
</template>

<script>
import TopicCreateModal from '@/components/TopicCreateModal.vue';

export default {
  components: {
    TopicCreateModal
  },
  data() {
    return {
      // 状态栏高度
      statusBarHeight: 20,
      // 表单数据
      form: {
        title: '',
        content: '',
        images: [],
        location: '',
        tags: [],
        category_id: 1 // 默认使用ID为1的分类
      },
      // 最大图片数
      maxImages: 9,
      // 最大标签数
      maxTags: 3,
      // 是否显示标签输入框
      showingTagInput: false,
      // 标签输入内容
      tagInput: '',
      // 话题搜索结果
      searchResults: [],
      // 热门话题列表
      hotTopics: [],
      // 搜索加载状态
      searchLoading: false,
      // 搜索防抖定时器
      searchTimer: null,
      // 显示话题创建弹窗
      showingCreateModal: false,
      // 待创建的话题名称
      pendingTopicName: '',
      // 编辑模式
      isEdit: false,
      // 帖子ID
      postId: '',
      // 分类列表
      categories: [
        { id: 1, name: '全部', icon: 'all' } // 默认分类，会被API加载的数据替换
      ],
      // 是否显示分类选择器
      showingCategoryPicker: false
    };
  },
  computed: {
    // 是否可以发布
    canPublish() {
      // 只检查内容是否为空
      return this.form.content.trim().length > 0;
    }
  },
  onLoad(options) {
    // 获取状态栏高度
    const statusBarHeight = uni.getStorageSync('statusBarHeight') || 20;
    this.statusBarHeight = statusBarHeight;
    
    // 加载分类列表
    this.loadCategories();
    
    // 如果是编辑模式
    if (options.id) {
      this.isEdit = true;
      this.postId = options.id;
      this.loadPostDetail(options.id);
    }
  },
  methods: {
    // 加载帖子详情
    loadPostDetail(id) {
      // 实际项目中，这里需要调用API获取帖子详情
      // 模拟数据
      setTimeout(() => {
        this.form = {
          title: '分享一个自习室预约技巧',
          content: '发现图书馆自习室可以提前一周预约，只需要在图书馆小程序上操作，分享给大家！附上操作步骤：...',
          images: [
            'https://picsum.photos/id/20/500/300',
          ],
          location: '图书馆',
          tags: ['学习', '技巧']
        };
      }, 500);
    },
    
    // 返回
    goBack() {
      if (this.form.title || this.form.content || this.form.images.length > 0 || this.form.tags.length > 0) {
        uni.showModal({
          title: '提示',
          content: this.isEdit ? '是否保存编辑内容？' : '是否保存草稿？',
          cancelText: '不保存',
          confirmText: '保存',
          success: (res) => {
            if (res.confirm) {
              // 保存草稿
              uni.showToast({
                title: this.isEdit ? '修改已保存' : '已保存到草稿箱',
                icon: 'success'
              });
              setTimeout(() => {
                uni.navigateBack();
              }, 1500);
            } else {
              uni.navigateBack();
            }
          }
        });
      } else {
        uni.navigateBack();
      }
    },
    
    // 提交帖子
    async submitPost() {
      // 检查内容是否可发布
      if (!this.canPublish) {
        // 只判断内容是否为空
        if (this.form.content.trim().length === 0) {
          uni.showToast({
            title: '请输入内容',
            icon: 'none',
            duration: 2000
          });
          return;
        }
        return;
      }
      
      // 检查标题长度（如果提供了标题）
      if (this.form.title.trim().length > 0 && this.form.title.trim().length < 2) {
        uni.showToast({
          title: '标题至少需要2个字符',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.navigateTo({
          url: '/pages/auth/login/index'
        });
        return;
      }
      
      // 显示加载
      uni.showLoading({
        title: this.isEdit ? '更新中...' : '发布中...'
      });
      
      // 获取用户匿名设置
      let isAnonymous = false;
      try {
        // 从隐私设置API获取最新设置
        const privacyRes = await this.$api.user.getPrivacySettings();
        if (privacyRes.code === 0) {
          isAnonymous = privacyRes.data.anonymousMode || false;
        }
      } catch (err) {
        console.error('获取隐私设置失败:', err);
        // 如果API失败，尝试从本地存储获取
        try {
          const userSettings = uni.getStorageSync('userSettings');
          if (userSettings) {
            const settings = JSON.parse(userSettings);
            isAnonymous = settings?.privacy?.anonymousMode || false;
          }
        } catch (localErr) {
          console.error('获取本地隐私设置失败:', localErr);
        }
      }

      // 准备提交的数据
      const postData = {
        title: this.form.title,
        content: this.form.content,
        category_id: Number(this.form.category_id),
        status: 'published', // 直接发布，不是草稿
        is_anonymous: isAnonymous, // 添加匿名模式设置
      };
      
      // 处理位置信息
      if (this.form.location) {
        postData.location = {
          name: this.form.location,
          latitude: this.form.latitude || null,
          longitude: this.form.longitude || null
        };
      }
      
      // 处理图片上传
      const uploadPromises = [];
      const imageUrls = [];
      
      // 如果有图片，先上传图片
      if (this.form.images && this.form.images.length > 0) {
        for (const image of this.form.images) {
          // 排除已经是URL的图片（编辑模式下可能存在）
          if (!image.startsWith('http')) {
            uploadPromises.push(this.$api.post.uploadImage(image));
          } else {
            imageUrls.push({
              url: image,
              thumbnail_url: image,
              width: 800,
              height: 600
            });
          }
        }
      }
      
      // 等待所有图片上传完成
      Promise.all(uploadPromises)
        .then(uploadedImages => {
          // 处理上传结果：每个uploadImage返回的是数组，需要展平并取第一个元素
          const flattenedImages = [];
          uploadedImages.forEach(imageArray => {
            if (imageArray && imageArray.length > 0) {
              flattenedImages.push(imageArray[0]); // 取数组的第一个元素
            }
          });

          // 将上传的图片添加到图片数组
          if (flattenedImages.length > 0) {
            postData.images = [...imageUrls, ...flattenedImages];
          } else if (imageUrls.length > 0) {
            postData.images = imageUrls;
          }

          // 处理话题：直接发送话题名称，后端会处理查找或创建
          if (this.form.tags && this.form.tags.length > 0) {
            postData.topics = this.form.tags; // 直接发送话题名称数组
          }

          return postData;
        })
        .then(finalPostData => {
          console.log('准备发送请求:', 'POST', 'http://localhost:3000/api/posts', finalPostData);

          // 创建或更新帖子
          const apiMethod = this.isEdit
            ? this.$api.post.update(this.postId, finalPostData)
            : this.$api.post.create(finalPostData);

          return apiMethod;
        })
        .then(res => {
          // 隐藏加载提示
          uni.hideLoading();
          
          // 显示成功提示
          uni.showToast({
            title: this.isEdit ? '更新成功' : '发布成功',
            icon: 'success',
            duration: 2000
          });
          
          // 设置新帖子标志
          uni.setStorageSync('hasNewPost', true);
          console.log('设置hasNewPost = true');

          // 触发强制刷新
          getApp().globalData.forceRefresh = true;

          // 返回上一页
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        })
        .catch(err => {
          console.error('发布失败:', err);
          
          // 隐藏加载提示
          uni.hideLoading();
          
          // 显示错误提示
          uni.showToast({
            title: err.msg || '发布失败，请重试',
            icon: 'none',
            duration: 2000
          });
        });
    },
    
    // 标题输入
    onTitleInput() {
      // 实时验证标题长度
      if (this.form.title.length > 30) {
        this.form.title = this.form.title.slice(0, 30);
      }
    },
    
    // 内容输入
    onContentInput() {
      // 实时验证内容长度
      if (this.form.content.length > 1000) {
        this.form.content = this.form.content.slice(0, 1000);
      }
    },
    
    // 选择图片
    chooseImage() {
      const count = this.maxImages - this.form.images.length;
      if (count <= 0) return;
      
      uni.chooseImage({
        count,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          // 更新图片列表
          this.form.images = [...this.form.images, ...res.tempFilePaths];
        }
      });
    },
    
    // 删除图片
    deleteImage(index) {
      this.form.images.splice(index, 1);
    },
    
    // 选择位置
    chooseLocation() {
      uni.chooseLocation({
        success: (res) => {
          this.form.location = res.name;
        }
      });
    },
    
    // 显示标签输入框
    showTagInput() {
      if (this.form.tags.length >= this.maxTags) return;
      this.showingTagInput = true;
      this.tagInput = '';
      this.searchResults = [];
      this.loadHotTopics();
    },

    // 隐藏标签输入框
    hideTagInput() {
      this.showingTagInput = false;
      this.tagInput = '';
      this.searchResults = [];
      this.searchLoading = false;
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
        this.searchTimer = null;
      }
    },

    // 话题输入变化
    onTagInputChange() {
      // 清除之前的定时器
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }

      const keyword = this.tagInput.trim();
      if (!keyword) {
        this.searchResults = [];
        this.searchLoading = false;
        return;
      }

      // 设置防抖搜索
      this.searchTimer = setTimeout(() => {
        this.searchTopics(keyword);
      }, 300);
    },

    // 话题输入失焦
    onTagInputBlur() {
      // 延迟隐藏，允许用户点击搜索结果
      setTimeout(() => {
        if (!this.tagInput.trim() && this.searchResults.length === 0) {
          // 如果没有输入内容且没有搜索结果，不自动隐藏
        }
      }, 200);
    },

    // 搜索话题
    async searchTopics(keyword) {
      if (!keyword) return;

      this.searchLoading = true;
      try {
        const res = await this.$api.topic.search(keyword, 10);
        console.log('搜索话题响应:', res);

        // 处理API返回的数据格式 {code: 0, msg: '成功', data: []}
        let topics = [];
        if (res && res.code === 0 && res.data) {
          topics = Array.isArray(res.data) ? res.data : [];
        } else if (res && Array.isArray(res)) {
          // 兼容直接返回数组的情况
          topics = res;
        }

        // 过滤掉已经添加的话题
        this.searchResults = topics.filter(topic =>
          !this.form.tags.includes(topic.name)
        );

        console.log('搜索结果:', this.searchResults);
      } catch (error) {
        console.error('搜索话题失败:', error);
        this.searchResults = [];
      } finally {
        this.searchLoading = false;
      }
    },

    // 加载热门话题
    async loadHotTopics() {
      try {
        const res = await this.$api.topic.getHot(8);
        console.log('热门话题响应:', res);

        // 处理API返回的数据格式 {code: 0, msg: '成功', data: []}
        let topics = [];
        if (res && res.code === 0 && res.data) {
          topics = Array.isArray(res.data) ? res.data : [];
        } else if (res && Array.isArray(res)) {
          // 兼容直接返回数组的情况
          topics = res;
        }

        // 过滤掉已经添加的话题
        this.hotTopics = topics.filter(topic =>
          !this.form.tags.includes(topic.name)
        );

        console.log('热门话题:', this.hotTopics);
      } catch (error) {
        console.error('获取热门话题失败:', error);
        this.hotTopics = [];
      }
    },

    // 选择搜索结果
    selectSearchResult(topic) {
      this.addTopicByName(topic.name);
    },

    // 选择热门话题
    selectHotTopic(topic) {
      this.addTopicByName(topic.name);
    },

    // 通过名称添加话题
    addTopicByName(name) {
      if (!name || this.form.tags.includes(name)) return;

      if (this.form.tags.length < this.maxTags) {
        this.form.tags.push(name);
        this.hideTagInput();

        uni.showToast({
          title: '话题已添加',
          icon: 'success',
          duration: 1000
        });
      } else {
        uni.showToast({
          title: `最多只能添加${this.maxTags}个话题`,
          icon: 'none'
        });
      }
    },



    // 添加标签（手动输入）
    addTag() {
      const tag = this.tagInput.trim();
      if (!tag) return;

      // 检查长度
      if (tag.length > 20) {
        uni.showToast({
          title: '话题名称不能超过20个字符',
          icon: 'none'
        });
        return;
      }

      // 检查重复
      if (this.form.tags.includes(tag)) {
        uni.showToast({
          title: '该话题已添加',
          icon: 'none'
        });
        return;
      }

      // 添加标签
      if (this.form.tags.length < this.maxTags) {
        this.form.tags.push(tag);
        this.hideTagInput();

        uni.showToast({
          title: '话题已添加',
          icon: 'success',
          duration: 1000
        });
      } else {
        uni.showToast({
          title: `最多只能添加${this.maxTags}个话题`,
          icon: 'none'
        });
      }
    },

    // 删除标签
    deleteTag(index) {
      this.form.tags.splice(index, 1);
    },

    // 格式化数字
    formatNumber(num) {
      if (num < 1000) return num.toString();
      if (num < 10000) return (num / 1000).toFixed(1) + 'k';
      return (num / 10000).toFixed(1) + 'w';
    },

    // 显示话题创建弹窗
    showCreateTopicModal() {
      // 保存当前输入的话题名称
      this.pendingTopicName = this.tagInput.trim();
      console.log('showCreateTopicModal - tagInput:', this.tagInput);
      console.log('showCreateTopicModal - pendingTopicName:', this.pendingTopicName);

      // 使用nextTick确保数据更新后再显示弹窗
      this.$nextTick(() => {
        this.showingCreateModal = true;
        console.log('showingCreateModal set to true, pendingTopicName:', this.pendingTopicName);

        // 直接调用子组件方法设置初始名称
        if (this.$refs.topicCreateModal && this.pendingTopicName) {
          this.$refs.topicCreateModal.setInitialName(this.pendingTopicName);
        }
      });
    },

    // 隐藏话题创建弹窗
    hideCreateTopicModal() {
      this.showingCreateModal = false;
      this.pendingTopicName = '';
    },

    // 处理话题创建
    async handleCreateTopic(topicData) {
      try {
        // 调用创建话题API（普通用户）
        const res = await this.$api.topic.createByUser(topicData);

        if (res && res.code === 0 && res.data) {
          // 创建成功，添加到话题列表
          const newTopic = res.data;
          this.addTopicByName(newTopic.name);

          // 关闭弹窗
          this.hideCreateTopicModal();

          uni.showToast({
            title: '话题创建成功',
            icon: 'success'
          });
        } else {
          throw new Error(res?.msg || '创建失败');
        }
      } catch (error) {
        console.error('创建话题失败:', error);
        uni.showToast({
          title: error.message || '创建失败，请重试',
          icon: 'none'
        });
      }
    },

    // 获取分类名称
    getCategoryName() {
      const category = this.categories.find(item => item.id === this.form.category_id);
      return category ? category.name : '全部';
    },

    // 显示分类选择器
    showCategoryPicker() {
      uni.showActionSheet({
        itemList: this.categories.map(item => item.name),
        success: res => {
          // 用户选择了分类
          const selectedCategory = this.categories[res.tapIndex];
          if (selectedCategory) {
            this.form.category_id = selectedCategory.id;
          }
        }
      });
    },

    // 加载分类列表
    loadCategories() {
      // 调用API获取分类列表
      this.$api.category.getList()
        .then(res => {
          if (res && Array.isArray(res)) {
            this.categories = res;
            // 确保分类ID是数字
            this.categories.forEach(category => {
              category.id = Number(category.id);
            });
          }
        })
        .catch(err => {
          console.error('获取分类列表失败:', err);
          // 使用本地备份数据
          this.categories = [
            { id: 1, name: '全部', icon: 'all' },
            { id: 2, name: '活动', icon: 'activity' },
            { id: 3, name: '求助', icon: 'help' },
            { id: 4, name: '失物招领', icon: 'lost' },
            { id: 5, name: '二手市场', icon: 'market' },
            { id: 6, name: '招聘兼职', icon: 'recruit' },
            { id: 7, name: '情感', icon: 'emotion' }
          ];
        });
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.publish-page {
  position: relative;
  height: 100vh;
  background-color: $bg-page;
}

.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: $bg-card;
  z-index: 100;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.nav-content {
  height: 44px;
  @include flex(row, space-between, center);
  padding: 0 $spacing-md;
}

.nav-left {
  width: 60px;
  height: 100%;
  @include flex(row, flex-start, center);
}

.nav-back {
  width: 12px;
  height: 12px;
  border-left: 2px solid $text-primary;
  border-bottom: 2px solid $text-primary;
  transform: rotate(45deg);
}

.nav-title {
  font-size: $font-size-lg;
  font-weight: bold;
  color: $text-primary;
}

.nav-right {
  width: 60px;
  height: 100%;
  @include flex(row, flex-end, center);
}

.nav-publish {
  font-size: $font-size-md;
  color: $text-tertiary;
  padding: 4px 10px;
  border-radius: 16px;
  
  &.active {
    color: #fff;
    background-color: $primary-color;
    font-weight: bold;
  }
}

.publish-scroll {
  height: 100vh;
  box-sizing: border-box;
}

.publish-content {
  padding: $spacing-md;
}

/* 卡片通用样式 */
.edit-card,
.options-card,
.topics-card {
  background-color: $bg-card;
  border-radius: $radius-lg;
  margin-bottom: $spacing-md;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

/* 主编辑区样式 */
.edit-card {
  padding: $spacing-md;
}

.publish-title {
  @include flex(row, space-between, center);
  margin-bottom: $spacing-sm;
}

.title-input {
  flex: 1;
  font-size: $font-size-lg;
  font-weight: bold;
  color: $text-primary;
  padding: $spacing-sm 0;
}

.title-count {
  font-size: $font-size-xs;
  color: $text-tertiary;
}

.divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.05);
  margin: $spacing-xs 0 $spacing-sm;
}

.publish-textarea-wrap {
  margin-bottom: $spacing-md;
}

.publish-textarea {
  width: 100%;
  font-size: $font-size-md;
  color: $text-primary;
  min-height: 180rpx;
  max-height: 400rpx;
  padding: 0;
  line-height: 1.6;
}

.publish-images {
  @include flex(row, flex-start, center);
  flex-wrap: wrap;
}

.image-item {
  position: relative;
  width: 220rpx;
  height: 220rpx;
  margin-right: 15rpx;
  margin-bottom: 15rpx;
  
  &:nth-child(3n) {
    margin-right: 0;
  }
}

.preview-image {
  width: 100%;
  height: 100%;
  border-radius: $radius-sm;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.image-delete {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 28rpx;
  line-height: 36rpx;
  text-align: center;
}

.image-upload {
  width: 220rpx;
  height: 220rpx;
  margin-right: 15rpx;
  margin-bottom: 15rpx;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: $radius-sm;
  @include flex(column, center, center);
  border: 1px dashed rgba(0, 0, 0, 0.1);
  
  &:nth-child(3n) {
    margin-right: 0;
  }
}

.upload-icon {
  font-size: 40rpx;
  color: $text-tertiary;
  line-height: 40rpx;
  margin-bottom: $spacing-xs;
}

.upload-text {
  font-size: $font-size-xs;
  color: $text-tertiary;
}

/* 选项卡片样式 */
.options-card {
  overflow: hidden;
}

.option-item {
  @include flex(row, space-between, center);
  padding: $spacing-md;
  
  &:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  }
}

.option-left {
  @include flex(row, flex-start, center);
}

.option-icon {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  margin-right: $spacing-md;
}

.location-icon {
  background-color: #FF9500;
}

.category-icon {
  background-color: #5856D6;
}

.option-label {
  font-size: $font-size-md;
  color: $text-primary;
}

.option-right {
  @include flex(row, flex-end, center);
}

.option-value {
  font-size: $font-size-sm;
  color: $text-tertiary;
  margin-right: $spacing-xs;
  max-width: 400rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.option-arrow {
  width: 12rpx;
  height: 12rpx;
  border-right: 2px solid $text-tertiary;
  border-top: 2px solid $text-tertiary;
  transform: rotate(45deg);
}

/* 话题卡片样式 */
.topics-card {
  padding: $spacing-md;
}

.topics-header {
  @include flex(row, space-between, center);
  margin-bottom: $spacing-md;
}

.topics-title {
  font-size: $font-size-md;
  font-weight: bold;
  color: $text-primary;
}

.topics-count {
  font-size: $font-size-xs;
  color: $text-tertiary;
  background-color: rgba(0, 0, 0, 0.03);
  padding: 2px 8px;
  border-radius: 10px;
}

.topics-content {
  margin-bottom: $spacing-md;
}

.tag-list {
  @include flex(row, flex-start, center);
  flex-wrap: wrap;
}

.tag-item {
  @include flex(row, flex-start, center);
  background-color: rgba($primary-color, 0.08);
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-md;
  margin-right: $spacing-md;
  margin-bottom: $spacing-md;
}

.tag-text {
  font-size: $font-size-sm;
  color: $primary-color;
  margin-right: $spacing-xs;
  font-weight: 500;
}

.tag-delete {
  font-size: 24rpx;
  color: $primary-color;
  margin-left: -$spacing-xs;
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  @include flex(row, center, center);
  background-color: rgba($primary-color, 0.1);
}

.add-topic-section {
  margin-bottom: $spacing-md;
}

.tag-add {
  @include flex(row, center, center);
  background-color: rgba(0, 0, 0, 0.03);
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-md;
  border: 1px dashed rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:active {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.tag-add-icon {
  font-size: $font-size-md;
  color: $text-tertiary;
  margin-right: $spacing-xs;
}

.tag-add-text {
  font-size: $font-size-sm;
  color: $text-tertiary;
}

.tag-input-section {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding-top: $spacing-md;
  margin-top: $spacing-md;
}

.tag-input-wrap {
  @include flex(row, space-between, center);
  background-color: rgba(0, 0, 0, 0.02);
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-md;
  border: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: $spacing-md;
}

.tag-input {
  flex: 1;
  font-size: $font-size-md;
  color: $text-primary;
  height: 36px;
}

.tag-input-btn {
  font-size: $font-size-sm;
  color: $primary-color;
  margin-left: $spacing-md;
  padding: 4px 12px;
  background-color: rgba($primary-color, 0.1);
  border-radius: $radius-sm;
  font-weight: 500;
}

.tag-cancel-btn {
  font-size: $font-size-sm;
  color: $text-tertiary;
  margin-left: $spacing-sm;
  padding: 4px 12px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: $radius-sm;
}

/* 搜索结果样式 */
.tag-search-results {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: $radius-md;
  margin-bottom: $spacing-md;
  overflow: hidden;
}

.search-results-header {
  padding: $spacing-sm $spacing-md;
  background-color: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.results-title {
  font-size: $font-size-xs;
  color: $text-tertiary;
  font-weight: 500;
}

.search-result-item {
  @include flex(row, space-between, center);
  padding: $spacing-md;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.result-name {
  font-size: $font-size-sm;
  color: $text-primary;
  font-weight: 500;
}

.result-count {
  font-size: $font-size-xs;
  color: $text-tertiary;
}

/* 热门话题样式 */
.hot-topics-section {
  background-color: rgba($primary-color, 0.02);
  border-radius: $radius-md;
  margin-bottom: $spacing-md;
  overflow: hidden;
}

.hot-topics-header {
  padding: $spacing-sm $spacing-md;
  background-color: rgba($primary-color, 0.05);
  border-bottom: 1px solid rgba($primary-color, 0.1);
}

.hot-title {
  font-size: $font-size-xs;
  color: $primary-color;
  font-weight: 600;
}

.hot-topics-list {
  padding: $spacing-sm;
}

.hot-topic-item {
  @include flex(row, space-between, center);
  padding: $spacing-sm $spacing-md;
  margin-bottom: $spacing-xs;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: $radius-sm;
  transition: all 0.2s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &:active {
    background-color: rgba($primary-color, 0.1);
    transform: scale(0.98);
  }
}

.hot-topic-name {
  font-size: $font-size-sm;
  color: $text-primary;
  font-weight: 500;
}

.hot-topic-count {
  font-size: $font-size-xs;
  color: $text-tertiary;
}

/* 创建话题提示 */
.create-topic-hint {
  @include flex(row, space-between, center);
  padding: $spacing-md;
  background-color: rgba($primary-color, 0.05);
  border-radius: $radius-md;
  border: 1px dashed rgba($primary-color, 0.2);
  margin-bottom: $spacing-md;
  transition: all 0.2s ease;

  &:active {
    background-color: rgba($primary-color, 0.1);
    transform: scale(0.98);
  }
}

.hint-text {
  font-size: $font-size-sm;
  color: $primary-color;
  font-weight: 500;
}

.hint-action {
  font-size: $font-size-xs;
  color: $primary-color;
  background-color: rgba($primary-color, 0.1);
  padding: 2px 8px;
  border-radius: $radius-sm;
}

/* 搜索加载状态 */
.search-loading {
  @include flex(row, center, center);
  padding: $spacing-md;
}

.loading-text {
  font-size: $font-size-sm;
  color: $text-tertiary;
}

.safe-area-bottom {
  height: 34px;
}
</style> 