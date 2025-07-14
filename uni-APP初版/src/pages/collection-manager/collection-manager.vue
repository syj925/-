<template>
  <view class="collection-manager-container">
    <!-- 自定义导航栏 -->
    <view class="custom-nav">
      <view class="nav-left" @tap="goBack">
        <text class="iconfont icon-back"></text>
      </view>
      <view class="nav-title">收藏夹管理</view>
      <view class="nav-right"></view>
    </view>
    
    <!-- 收藏夹列表 -->
    <view class="collections-list">
      <view class="collection-item" v-for="(collection, index) in collections" :key="collection.id">
        <view class="collection-info" @tap="viewCollection(collection)">
          <view class="collection-icon">
            <text class="iconfont icon-collection"></text>
          </view>
          <view class="collection-details">
            <view class="collection-name">{{ collection.name }}</view>
            <view class="collection-count">{{ collection.count }}个内容</view>
          </view>
        </view>
        <view class="collection-actions">
          <view class="action-edit" @tap="editCollection(index)">
            <text class="iconfont icon-edit"></text>
          </view>
          <view class="action-delete" @tap="deleteCollection(index)" v-if="collection.id !== 1">
            <text class="iconfont icon-delete"></text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 添加收藏夹按钮 -->
    <view class="add-collection" @tap="showAddPopup">
      <text class="iconfont icon-add"></text>
      <text>添加收藏夹</text>
    </view>
    
    <!-- 新建/编辑收藏夹弹出层 -->
    <view class="popup-mask" v-if="showPopup" @tap="hidePopup"></view>
    <view class="popup-content" v-if="showPopup">
      <view class="popup-header">
        <text>{{ isEditing ? '编辑收藏夹' : '新建收藏夹' }}</text>
      </view>
      <view class="popup-body">
        <input 
          class="collection-input" 
          v-model="collectionName" 
          placeholder="请输入收藏夹名称" 
          maxlength="20"
          focus
        />
        <view class="input-count">{{ collectionName.length }}/20</view>
      </view>
      <view class="popup-footer">
        <view class="popup-btn cancel" @tap="hidePopup">取消</view>
        <view class="popup-btn confirm" @tap="confirmCollection">确认</view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      collections: [
        { id: 1, name: '默认收藏夹', count: 12 },
        { id: 2, name: '学习资料', count: 5 },
        { id: 3, name: '校园活动', count: 3 }
      ],
      showPopup: false,
      collectionName: '',
      isEditing: false,
      editIndex: -1
    }
  },
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 查看收藏夹内容
    viewCollection(collection) {
      uni.navigateTo({
        url: `/pages/favorites/favorites?collectionId=${collection.id}&title=${encodeURIComponent(collection.name)}`
      });
    },
    
    // 显示添加收藏夹弹窗
    showAddPopup() {
      this.isEditing = false;
      this.collectionName = '';
      this.showPopup = true;
    },
    
    // 编辑收藏夹
    editCollection(index) {
      this.isEditing = true;
      this.editIndex = index;
      this.collectionName = this.collections[index].name;
      this.showPopup = true;
    },
    
    // 删除收藏夹
    deleteCollection(index) {
      uni.showModal({
        title: '删除收藏夹',
        content: '确定要删除该收藏夹吗？收藏夹内的内容将会被移至默认收藏夹',
        success: (res) => {
          if (res.confirm) {
            // 将删除的收藏夹内容数添加到默认收藏夹
            const deletedCount = this.collections[index].count;
            const defaultCollection = this.collections.find(c => c.id === 1);
            if (defaultCollection) {
              defaultCollection.count += deletedCount;
            }
            
            // 删除收藏夹
            this.collections.splice(index, 1);
            
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            });
          }
        }
      });
    },
    
    // 隐藏弹窗
    hidePopup() {
      this.showPopup = false;
    },
    
    // 确认新建/编辑收藏夹
    confirmCollection() {
      if (!this.collectionName.trim()) {
        uni.showToast({
          title: '请输入收藏夹名称',
          icon: 'none'
        });
        return;
      }
      
      if (this.isEditing) {
        // 编辑现有收藏夹
        this.collections[this.editIndex].name = this.collectionName;
        uni.showToast({
          title: '修改成功',
          icon: 'success'
        });
      } else {
        // 新建收藏夹
        const newId = Math.max(...this.collections.map(c => c.id)) + 1;
        this.collections.push({
          id: newId,
          name: this.collectionName,
          count: 0
        });
        uni.showToast({
          title: '创建成功',
          icon: 'success'
        });
      }
      
      this.hidePopup();
    }
  }
}
</script>

<style>
.collection-manager-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #F8F8F8;
}

/* 自定义导航栏 */
.custom-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
  padding: 0 15px;
  background-color: #FFFFFF;
  border-bottom: 1px solid #F0F2F5;
  position: relative;
  padding-top: var(--status-bar-height);
}

.nav-left, .nav-right {
  width: 40px;
  display: flex;
  align-items: center;
}

.nav-title {
  font-size: 17px;
  font-weight: 500;
  flex: 1;
  text-align: center;
}

.icon-back {
  font-size: 22px;
  color: #333;
}

/* 收藏夹列表 */
.collections-list {
  padding: 15px;
}

.collection-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #FFFFFF;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.collection-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.collection-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #E6F0FF;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
}

.collection-icon .iconfont {
  font-size: 22px;
  color: #4A90E2;
}

.collection-details {
  display: flex;
  flex-direction: column;
}

.collection-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
  font-weight: 500;
}

.collection-count {
  font-size: 13px;
  color: #999;
}

.collection-actions {
  display: flex;
}

.action-edit, .action-delete {
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.action-edit .iconfont {
  font-size: 18px;
  color: #666;
}

.action-delete .iconfont {
  font-size: 18px;
  color: #FF5151;
}

/* 添加收藏夹按钮 */
.add-collection {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #FFFFFF;
  margin: 20px 15px;
  padding: 15px;
  border-radius: 8px;
  border: 1px dashed #CCCCCC;
  color: #4A90E2;
}

.add-collection .iconfont {
  font-size: 18px;
  margin-right: 8px;
}

/* 弹出层 */
.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.popup-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  background-color: #FFFFFF;
  border-radius: 12px;
  z-index: 101;
  overflow: hidden;
}

.popup-header {
  padding: 20px;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #F0F2F5;
}

.popup-body {
  padding: 20px;
  position: relative;
}

.collection-input {
  height: 44px;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  padding: 0 15px;
  font-size: 15px;
  width: 100%;
  box-sizing: border-box;
}

.input-count {
  position: absolute;
  right: 25px;
  bottom: 30px;
  font-size: 12px;
  color: #999;
}

.popup-footer {
  display: flex;
  border-top: 1px solid #F0F2F5;
}

.popup-btn {
  flex: 1;
  text-align: center;
  padding: 15px 0;
  font-size: 16px;
}

.popup-btn.cancel {
  color: #666;
  border-right: 1px solid #F0F2F5;
}

.popup-btn.confirm {
  color: #4A90E2;
}

/* 图标 */
.iconfont {
  font-family: "iconfont" !important;
}

.icon-back:before {
  content: "\e679";
}

.icon-collection:before {
  content: "\e64f";
}

.icon-add:before {
  content: "\e613";
}

.icon-edit:before {
  content: "\e633";
}

.icon-delete:before {
  content: "\e68e";
}
</style> 