<template>
  <view class="edit-tags-container">
    <!-- 自定义导航栏 -->
    <view class="custom-nav">
      <view class="nav-left" @tap="goBack">
        <text class="iconfont icon-back"></text>
      </view>
      <view class="nav-title">兴趣标签</view>
      <view class="nav-right">
        <text class="save-btn" @tap="saveTags">保存</text>
      </view>
    </view>
    
    <!-- 标签说明 -->
    <view class="tags-header">
      <text class="tags-title">选择您感兴趣的标签</text>
      <text class="tags-subtitle">已选择 {{ selectedTags.length }}/10</text>
    </view>
    
    <!-- 已选标签区域 -->
    <view class="selected-tags-wrap" v-if="selectedTags.length > 0">
      <view class="section-title">已选标签</view>
      <view class="tags-group">
        <view 
          class="tag-item selected" 
          v-for="(tag, index) in selectedTags" 
          :key="index"
          @tap="removeTag(tag)"
        >
          {{ tag.name }}
          <text class="iconfont icon-close"></text>
        </view>
      </view>
    </view>
    
    <!-- 推荐标签区域 -->
    <view class="recommend-tags-wrap">
      <view class="section-title">推荐标签</view>
      
      <!-- 学习分类 -->
      <view class="tag-category">
        <view class="category-title">学习</view>
        <view class="tags-group">
          <view 
            class="tag-item" 
            :class="{ selected: isSelected(tag) }"
            v-for="(tag, index) in tagCategories.interest" 
            :key="index"
            @tap="toggleTag(tag)"
          >
            {{ tag.name }}
          </view>
        </view>
      </view>
      
      <!-- 运动分类 -->
      <view class="tag-category">
        <view class="category-title">运动</view>
        <view class="tags-group">
          <view 
            class="tag-item" 
            :class="{ selected: isSelected(tag) }"
            v-for="(tag, index) in tagCategories.skill" 
            :key="index"
            @tap="toggleTag(tag)"
          >
            {{ tag.name }}
          </view>
        </view>
      </view>
      
      <!-- 娱乐分类 -->
      <view class="tag-category">
        <view class="category-title">娱乐</view>
        <view class="tags-group">
          <view 
            class="tag-item" 
            :class="{ selected: isSelected(tag) }"
            v-for="(tag, index) in tagCategories.major" 
            :key="index"
            @tap="toggleTag(tag)"
          >
            {{ tag.name }}
          </view>
        </view>
      </view>
      
      <!-- 生活分类 -->
      <view class="tag-category">
        <view class="category-title">生活</view>
        <view class="tags-group">
          <view 
            class="tag-item" 
            :class="{ selected: isSelected(tag) }"
            v-for="(tag, index) in tagCategories.grade" 
            :key="index"
            @tap="toggleTag(tag)"
          >
            {{ tag.name }}
          </view>
        </view>
      </view>
    </view>
    
    <!-- 自定义标签输入 -->
    <view class="custom-tag-wrap">
      <view class="section-title">自定义标签</view>
      <view class="custom-tag-input">
        <input 
          class="input-field" 
          v-model="customTag" 
          placeholder="输入自定义标签，最多6个字" 
          maxlength="6"
        />
        <button 
          class="add-btn" 
          :class="{ disabled: !customTag.trim() || selectedTags.length >= 10 }"
          :disabled="!customTag.trim() || selectedTags.length >= 10"
          @tap="addCustomTag"
        >
          添加
        </button>
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
      selectedTags: [],
      customTag: '',
      tagCategories: {
        interest: [],
        skill: [],
        major: [],
        grade: []
      },
      loading: false,
      saving: false
    }
  },
  onLoad() {
    this.loadTags();
    this.loadUserTags();
  },
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 加载标签数据
    async loadTags() {
      this.loading = true;
      
      try {
        // 获取各个分类的标签
        const categories = ['interest', 'skill', 'major', 'grade'];
        
        for (const category of categories) {
          const response = await api.tags.getByCategory(category);
          
          if (response.success) {
            this.tagCategories[category] = response.data.map(tag => ({ 
              id: tag.id, 
              name: tag.name,
              color: tag.color
            }));
          }
        }
      } catch (error) {
        console.error('加载标签失败:', error);
        uni.showToast({
          title: '加载标签失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 加载用户标签
    async loadUserTags() {
      console.log('开始加载用户标签');
      
      // 首先尝试从storage中获取当前正在编辑的标签（来自edit-profile）
      try {
        const editingTags = uni.getStorageSync('editingTags');
        if (editingTags && Array.isArray(editingTags) && editingTags.length > 0) {
          console.log('从storage中获取到正在编辑的标签:', editingTags);
          // 确保每个标签都是对象格式 {id, name, color}
          this.selectedTags = editingTags.map(tag => {
            if (typeof tag === 'object' && tag !== null) {
              return {
                id: tag.id,
                name: tag.name || '未命名',
                color: tag.color || '#409EFF'
              };
            } else {
              return {
                id: tag,
                name: String(tag),
                color: '#409EFF'
              };
            }
          });
          return; // 已找到编辑中的标签，不需要继续加载
        }
      } catch (e) {
        console.error('读取storage中的标签失败:', e);
      }
      
      // 如果没有从storage中获取到，尝试从store中获取用户信息
      const currentUser = store.getters.getUser();
      console.log('从store中获取的当前用户:', currentUser);
      
      if (currentUser && currentUser.tags) {
        try {
          let tags = currentUser.tags;
          if (typeof tags === 'string') {
            tags = JSON.parse(tags);
          }
          
          if (Array.isArray(tags) && tags.length > 0) {
            console.log('从store的用户信息中获取到标签:', tags);
            this.selectedTags = tags.map(tag => 
              typeof tag === 'object' ? tag : { id: tag, name: tag }
            );
            return;
          }
        } catch (e) {
          console.error('解析store中的用户标签失败:', e);
        }
      }
      
      // 如果前两种方式都失败了，再从API获取
      try {
        // 使用当前登录用户的ID
        const userInfo = uni.getStorageSync('userInfo');
        const currentUser = uni.getStorageSync('token') ? store.getters.getUser() : null;
        const userId = currentUser ? currentUser.id : (userInfo && userInfo.id ? userInfo.id : null);
        
        if (!userId) {
          console.warn('没有找到用户ID，无法加载标签');
          return;
        }
        
        console.log(`尝试从API加载用户(ID:${userId})的标签`);
        const response = await api.tags.getUserTags(userId);
        
        if (response.success && response.data) {
          console.log('从API加载到的用户标签:', response.data);
          this.selectedTags = response.data.map(tag => ({
            id: tag.id,
            name: tag.name,
            color: tag.color
          }));
        }
      } catch (error) {
        console.error('加载用户标签失败:', error);
      }
    },
    
    // 检查标签是否已选择
    isSelected(tag) {
      return this.selectedTags.some(item => item.id === tag.id);
    },
    
    // 切换标签选择状态
    toggleTag(tag) {
      if (this.isSelected(tag)) {
        this.removeTag(tag);
      } else {
        this.addTag(tag);
      }
    },
    
    // 添加标签
    addTag(tag) {
      if (this.selectedTags.length >= 10) {
        uni.showToast({
          title: '最多可选10个标签',
          icon: 'none'
        });
        return;
      }
      
      if (!this.selectedTags.some(item => item.id === tag.id)) {
        this.selectedTags.push(tag);
      }
    },
    
    // 移除标签
    removeTag(tag) {
      const index = this.selectedTags.findIndex(item => item.id === tag.id);
      if (index !== -1) {
        this.selectedTags.splice(index, 1);
      }
    },
    
    // 添加自定义标签
    async addCustomTag() {
      if (!this.customTag.trim()) return;
      
      if (this.selectedTags.length >= 10) {
        uni.showToast({
          title: '最多可选10个标签',
          icon: 'none'
        });
        return;
      }
      
      const newTagName = this.customTag.trim();
      
      // 检查是否已有相同名称的标签
      for (const category in this.tagCategories) {
        const existingTag = this.tagCategories[category].find(tag => 
          tag.name === newTagName
        );
        
        if (existingTag) {
          // 如果已经选择了这个标签，提示已存在
          if (this.isSelected(existingTag)) {
            uni.showToast({
              title: '标签已存在',
              icon: 'none'
            });
            return;
          }
          
          // 如果标签存在但未选择，直接添加到已选列表
          this.addTag(existingTag);
          this.customTag = '';
          return;
        }
      }
      
      // 如果是新标签，提示暂不支持自定义
      uni.showToast({
        title: '暂不支持自定义标签',
        icon: 'none'
      });
      this.customTag = '';
    },
    
    // 保存标签
    async saveTags() {
      if (this.saving) return;
      
      this.saving = true;
      
      try {
        // 获取选中标签的ID列表
        const tagIds = this.selectedTags.map(tag => tag.id);
        console.log('准备保存的标签IDs:', tagIds);
        
        // 调用API保存用户标签
        const response = await api.tags.setUserTags(tagIds);
        
        if (response.success) {
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          console.log('标签保存成功，API返回:', response);
          
          // 将选中的标签传回编辑资料页面
          const selectedTagsData = this.selectedTags.map(tag => ({
            id: tag.id,
            name: tag.name,
            color: tag.color || '#2196f3'
          }));
          
          // 保存到本地存储，以便在页面返回时使用
          uni.setStorageSync('editingTags', selectedTagsData);
          
          // 获取页面栈，以便获取来源页面实例
          const pages = getCurrentPages();
          const prevPage = pages[pages.length - 2]; // 上一个页面
          
          // 如果有上一个页面，并且有updateTags方法
          if (prevPage && prevPage.$vm && prevPage.$vm.$emit) {
            console.log('将选择的标签传回上一个页面:', selectedTagsData);
            prevPage.$vm.$emit('updateTags', selectedTagsData);
          } else {
            console.log('无法获取上一个页面实例，使用storage中转');
          }
          
          // 返回上一页
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({
            title: response.message || '保存失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('保存标签失败:', error);
        uni.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        });
      } finally {
        this.saving = false;
      }
    }
  }
}
</script>

<style>
.edit-tags-container {
  min-height: 100vh;
  background-color: #F5F5F5;
  padding-bottom: 30px;
}

/* 自定义导航栏 */
.custom-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
  padding: 0 15px;
  background-color: #FFFFFF;
  border-bottom: 1px solid #EEEEEE;
  position: relative;
  padding-top: var(--status-bar-height);
}

.nav-left, .nav-right {
  width: 60px;
  display: flex;
  align-items: center;
}

.nav-right {
  justify-content: flex-end;
}

.nav-title {
  font-size: 17px;
  font-weight: 500;
  flex: 1;
  text-align: center;
}

.icon-back {
  font-size: 22px;
  color: #333333;
}

.save-btn {
  font-size: 16px;
  color: #4A90E2;
  font-weight: 500;
}

/* 标签说明 */
.tags-header {
  padding: 15px;
  background-color: #FFFFFF;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.tags-title {
  font-size: 16px;
  font-weight: 500;
}

.tags-subtitle {
  font-size: 14px;
  color: #999999;
}

/* 标签内容 */
.section-title {
  padding: 15px 15px 10px;
  font-size: 14px;
  color: #666666;
}

.tags-group {
  display: flex;
  flex-wrap: wrap;
  padding: 0 15px 15px;
}

.tag-item {
  background-color: #F5F5F5;
  padding: 8px 15px;
  border-radius: 18px;
  margin-right: 10px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666666;
  display: flex;
  align-items: center;
}

.tag-item.selected {
  background-color: #4A90E2;
  color: #FFFFFF;
}

.icon-close {
  font-size: 12px;
  margin-left: 5px;
}

/* 已选标签区域 */
.selected-tags-wrap {
  background-color: #FFFFFF;
  margin-top: 10px;
}

/* 推荐标签区域 */
.recommend-tags-wrap {
  background-color: #FFFFFF;
  margin-top: 10px;
}

.tag-category {
  margin-bottom: 10px;
}

.category-title {
  font-size: 14px;
  color: #999999;
  padding: 0 15px 5px;
}

/* 自定义标签输入 */
.custom-tag-wrap {
  background-color: #FFFFFF;
  margin-top: 10px;
  padding-bottom: 15px;
}

.custom-tag-input {
  display: flex;
  padding: 0 15px;
  margin-top: 5px;
}

.input-field {
  flex: 1;
  height: 40px;
  background-color: #F5F5F5;
  border-radius: 20px;
  padding: 0 15px;
  font-size: 14px;
  margin-right: 10px;
}

.add-btn {
  width: 80px;
  height: 40px;
  line-height: 40px;
  background-color: #4A90E2;
  color: #FFFFFF;
  font-size: 14px;
  border-radius: 20px;
  border: none;
  padding: 0;
}

.add-btn.disabled {
  background-color: #CCCCCC;
}

/* 图标 */
.iconfont {
  font-family: "iconfont" !important;
}

.icon-back:before {
  content: "\e679";
}

.icon-close:before {
  content: "\e646";
}
</style> 