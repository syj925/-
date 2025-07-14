<template>
  <div class="topic-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>话题管理</h3>
          <el-button type="primary" @click="dialogVisible = true">
            <el-icon><Plus /></el-icon> 创建话题
          </el-button>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="filter-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索话题名称"
          clearable
          class="filter-item search-input"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="topicStatus"
          placeholder="话题状态"
          clearable
          class="filter-item"
        >
          <el-option label="全部" value="" />
          <el-option label="正常" value="active" />
          <el-option label="隐藏" value="hidden" />
          <el-option label="已删除" value="deleted" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetFilter">重置</el-button>
        
        <!-- 批量操作 -->
        <el-dropdown 
          split-button 
          type="primary" 
          @click="handleBatchAction('activate')"
          :disabled="!hasSelectedItems"
          style="margin-left: 10px;"
        >
          批量操作
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleBatchAction('activate')">批量激活</el-dropdown-item>
              <el-dropdown-item @click="handleBatchAction('hide')">批量隐藏</el-dropdown-item>
              <el-dropdown-item divided @click="handleBatchAction('delete')">批量删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      
      <!-- 话题列表 -->
      <el-table 
        :data="topicList" 
        style="width: 100%" 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="ID" width="80">
          <template #default="scope">
            {{ scope.row.id }}
          </template>
        </el-table-column>
        <el-table-column label="话题名称">
          <template #default="scope">
            {{ scope.row.name }}
          </template>
        </el-table-column>
        <el-table-column label="描述" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.description }}
          </template>
        </el-table-column>
        <el-table-column label="浏览次数" width="100" sortable>
          <template #default="scope">
            {{ scope.row.views || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="帖子数量" width="100" sortable>
          <template #default="scope">
            {{ scope.row.usageCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="封面图" width="120">
          <template #default="scope">
            <el-image 
              style="width: 80px; height: 45px" 
              :src="scope.row.coverImage || ''" 
              fit="cover"
              :preview-src-list="scope.row.coverImage ? [scope.row.coverImage] : []"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="图片状态" width="100">
          <template #default="scope">
            <div class="topic-status" v-if="scope.row.imageStatus && scope.row.imageStatus !== 'default'">
              <el-tag 
                v-if="scope.row.imageStatus === 'pending'" 
                effect="plain" 
                type="warning"
                size="small"
              >图片待审核</el-tag>
              <el-tag 
                v-else-if="scope.row.imageStatus === 'approved'" 
                effect="plain" 
                type="success"
                size="small"
              >图片已通过</el-tag>
              <el-tag 
                v-else-if="scope.row.imageStatus === 'rejected'" 
                effect="plain" 
                type="danger"
                size="small"
              >图片已拒绝</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="330" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="info" @click="handleSeoSettings(scope.row)">SEO设置</el-button>
            <el-button size="small" type="warning" @click="handleReviewConfig(scope.row)">审核配置</el-button>
            <el-button 
              size="small" 
              :type="isDisabledTopic(scope.row.status) ? 'success' : 'danger'" 
              @click="handleToggleStatus(scope.row)"
            >
              {{ isDisabledTopic(scope.row.status) ? '激活' : '隐藏' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 创建/编辑话题对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingTopic.id ? '编辑话题' : '创建话题'"
      width="600px"
      destroy-on-close
      @closed="handleDialogClosed"
    >
      <el-form :model="editingTopic" :rules="rules" ref="topicForm" label-width="100px">
        <el-form-item label="话题名称" prop="name">
          <el-input v-model="editingTopic.name" placeholder="请输入话题名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="editingTopic.description"
            type="textarea"
            :rows="3"
            placeholder="请输入话题描述"
          />
        </el-form-item>
        <el-form-item label="封面图" prop="coverImage">
          <el-upload
            class="avatar-uploader"
            action="http://localhost:12349/api/upload"
            :headers="uploadHeaders"
            name="file"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
          >
            <img v-if="editingTopic.coverImage" :src="editingTopic.coverImage" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">建议尺寸: 800x450px，大小不超过2MB</div>
        </el-form-item>
        <el-form-item label="话题状态" prop="status">
          <el-select v-model="editingTopic.status" placeholder="请选择话题状态">
            <el-option label="正常" value="active" />
            <el-option label="隐藏" value="hidden" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确认</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- SEO设置对话框 -->
    <el-dialog
      v-model="seoDialogVisible"
      title="SEO设置"
      width="600px"
      destroy-on-close
    >
      <seo-settings 
        v-if="currentTopic" 
        :topic-id="currentTopic.id" 
        :initial-data="currentTopic" 
        :loading="submittingSeo"
        ref="seoSettingsRef"
        @submit="handleSeoSubmit"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="seoDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitSeoSettings" :loading="submittingSeo">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 审核配置对话框 -->
    <el-dialog
      v-model="reviewDialogVisible"
      title="内容审核配置"
      width="600px"
      destroy-on-close
    >
      <review-config 
        v-if="currentTopic" 
        :topic-id="currentTopic.id" 
        :initial-data="currentTopic" 
        :loading="submittingReview"
        ref="reviewConfigRef"
        @submit="handleReviewSubmit"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reviewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitReviewConfig" :loading="submittingReview">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 图片审核对话框 -->
    <el-dialog
      title="话题图片审核"
      :visible.sync="imageReviewDialogVisible"
      width="600px"
      @close="closeImageReviewDialog"
    >
      <div v-if="currentTopic" class="image-review-container">
        <div class="topic-info-preview">
          <h3>{{ currentTopic.name }}</h3>
          <p>{{ currentTopic.description || '暂无描述' }}</p>
        </div>
        
        <div class="image-preview-container">
          <div class="image-preview-item">
            <h4>待审核图片</h4>
            <div class="image-wrapper">
              <el-image 
                v-if="currentTopic.pendingImage" 
                :src="currentTopic.pendingImage" 
                fit="cover"
              ></el-image>
              <div v-else class="no-image">无图片</div>
            </div>
          </div>
          
          <div class="image-preview-item">
            <h4>当前图片</h4>
            <div class="image-wrapper">
              <el-image 
                v-if="currentTopic.coverImage" 
                :src="currentTopic.coverImage" 
                fit="cover"
              ></el-image>
              <div v-else class="no-image">无图片</div>
            </div>
          </div>
        </div>
        
        <div class="review-actions">
          <el-button 
            type="success" 
            :loading="reviewLoading" 
            @click="reviewImage('approve')"
          >通过</el-button>
          <el-button 
            type="danger" 
            :loading="reviewLoading" 
            @click="reviewImage('reject')"
          >拒绝</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import api from '../../utils/api';
import SeoSettings from '../../components/SeoSettings.vue';
import ReviewConfig from '../../components/ReviewConfig.vue';

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

// 列表数据
const loading = ref(false);
const topicList = ref([]);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 搜索和筛选
const searchQuery = ref('');
const topicStatus = ref('');

// 对话框和表单
const dialogVisible = ref(false);
const editingTopic = reactive({
  id: null,
  name: '',
  description: '',
  coverImage: '',
  status: 'active'
});
const topicForm = ref(null);
const rules = {
  name: [
    { required: true, message: '请输入话题名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入话题描述', trigger: 'blur' },
    { max: 200, message: '长度不能超过 200 个字符', trigger: 'blur' }
  ],
  coverImage: [
    { required: true, message: '请上传话题封面图', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择话题状态', trigger: 'change' }
  ]
};

// 上传配置
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('admin_token');
  return {
    Authorization: token ? `Bearer ${token}` : ''
  };
});

// 生命周期
onMounted(() => {
  fetchTopics();
});

// 方法
const fetchTopics = () => {
  loading.value = true;
  const params = {
    page: currentPage.value,
    limit: pageSize.value,
    status: topicStatus.value || undefined,
    search: searchQuery.value || undefined
  };
  
  console.log('请求参数:', params);
  
  api.topics.getList(params)
    .then(res => {
      console.log('获取话题列表原始响应:', res);
      console.log('响应类型:', typeof res);
      if (res.data) console.log('data类型:', typeof res.data);
      
      // 增强数据处理逻辑 - 进一步简化和优化
      if (Array.isArray(res)) {
        console.log('处理情况1: 响应是数组');
        topicList.value = res;
        total.value = res.length;
      } else if (res.data) {
        // 处理常见的响应结构
        if (Array.isArray(res.data)) {
          console.log('处理情况2: res.data是数组');
          topicList.value = res.data;
          total.value = res.total || res.data.length;
        } else if (res.data.topics && Array.isArray(res.data.topics)) {
          console.log('处理情况3: res.data.topics是数组');
          // 处理嵌套结构：{ data: { topics: [...] } }
          topicList.value = res.data.topics;
          total.value = res.data.pagination?.total || res.data.topics.length;
        } else if (typeof res.data === 'object') {
          console.log('处理情况4: res.data是对象', res.data);
          // 最后尝试将对象转为数组
          topicList.value = [res.data];
          total.value = 1;
        } else {
          console.error('处理情况5: 无法解析响应数据', res);
          topicList.value = [];
          total.value = 0;
        }
      } else {
        console.error('处理情况6: 无法识别的API响应结构:', res);
        topicList.value = [];
        total.value = 0;
      }
      
      console.log('处理后话题列表:', topicList.value);
    })
    .catch(error => {
      console.error('获取话题列表错误:', error);
      ElMessage.error(error.message || '获取话题列表失败');
    })
    .finally(() => {
    loading.value = false;
    });
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchTopics();
};

const resetFilter = () => {
  searchQuery.value = '';
  topicStatus.value = '';
  handleSearch();
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchTopics();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchTopics();
};

const handleEdit = (row) => {
  // 深拷贝避免直接修改表格数据
  const rowData = JSON.parse(JSON.stringify(row));
  Object.assign(editingTopic, rowData);
  dialogVisible.value = true;
};

const handleToggleStatus = (row) => {
  const action = row.status === 'hidden' ? '启用' : '禁用';
  const newStatus = row.status === 'hidden' ? 'active' : 'hidden';
  
  ElMessageBox.confirm(`确定要${action}该话题吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    api.topics.update(row.id, { status: newStatus })
      .then(() => {
    row.status = newStatus;
    ElMessage.success(`已${action}话题: ${row.name}`);
      })
      .catch(error => {
        ElMessage.error(error.message || `${action}失败`);
      });
  }).catch(() => {
    // 取消操作
  });
};

const getTagType = (status) => {
  const map = {
    'active': 'success',
    'hidden': 'info',
    'deleted': 'danger'
  };
  return map[status] || 'info';
};

const getStatusText = (status) => {
  const map = {
    'active': '活跃',
    'hidden': '已隐藏',
    'deleted': '已删除'
  };
  return map[status] || status || '未知';
};

const handleSubmit = () => {
  topicForm.value.validate((valid) => {
    if (valid) {
      // 准备提交的数据
      const topicData = {
        name: editingTopic.name,
        description: editingTopic.description,
        coverImage: editingTopic.coverImage,
        status: editingTopic.status
      };
      
      if (editingTopic.id) {
        // 更新现有话题
        api.topics.update(editingTopic.id, topicData)
          .then((res) => {
            console.log('更新话题成功:', res);
        ElMessage.success('话题更新成功!');
            dialogVisible.value = false;
            // 延迟一下刷新，确保后端数据更新完毕
            setTimeout(fetchTopics, 300);
          })
          .catch(error => {
            console.error('更新话题失败:', error);
            ElMessage.error(error.message || '更新话题失败');
          });
      } else {
        // 添加新话题
        api.topics.create(topicData)
          .then((res) => {
            console.log('创建话题成功:', res);
        ElMessage.success('话题创建成功!');
      dialogVisible.value = false;
            // 延迟一下刷新，确保后端数据更新完毕
            setTimeout(fetchTopics, 300);
          })
          .catch(error => {
            console.error('创建话题失败:', error);
            ElMessage.error(error.message || '创建话题失败');
          });
      }
    } else {
      console.warn('表单验证失败');
      return false;
    }
  });
};

const handleUploadSuccess = (res) => {
  console.log('上传成功:', res);
  // 检查响应结构
  if (res.success && res.data && res.data.url) {
    editingTopic.coverImage = res.data.url;
  } else {
    ElMessage.warning('上传成功，但未获取到图片URL');
    console.error('无效的上传响应:', res);
  }
};

const handleUploadError = (error) => {
  console.error('上传错误:', error);
  ElMessage.error(`上传失败: ${error.message || '服务器错误'}`);
};

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('只能上传图片文件!');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!');
    return false;
  }
  return true;
};

// 重置表单
const resetForm = () => {
  // 重置编辑对象
  Object.assign(editingTopic, {
    id: null,
    name: '',
    description: '',
    coverImage: '',
    status: 'active'
  });
  
  // 如果表单引用存在，重置验证状态
  if (topicForm.value) {
    topicForm.value.resetFields();
  }
};

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false;
};

// 对话框关闭后处理
const handleDialogClosed = () => {
  resetForm();
};

// SEO和审核配置相关
const seoDialogVisible = ref(false);
const reviewDialogVisible = ref(false);
const seoSettingsRef = ref(null);
const reviewConfigRef = ref(null);
const currentTopic = ref(null);
const submittingSeo = ref(false);
const submittingReview = ref(false);

// 批量操作相关
const selectedTopics = ref([]);
const hasSelectedItems = computed(() => selectedTopics.value.length > 0);

// 处理SEO设置
const handleSeoSettings = (row) => {
  currentTopic.value = row;
  seoDialogVisible.value = true;
};

// 提交SEO设置
const submitSeoSettings = async () => {
  try {
    const formData = await seoSettingsRef.value.validate();
    submittingSeo.value = true;
    
    await api.topics.updateSeo(formData.id, formData);
    
    ElMessage.success('SEO设置保存成功');
    seoDialogVisible.value = false;
    fetchTopics(); // 刷新数据
  } catch (error) {
    console.error('保存SEO设置失败:', error);
    ElMessage.error(error.message || '保存SEO设置失败');
  } finally {
    submittingSeo.value = false;
  }
};

// 处理SEO提交
const handleSeoSubmit = (data) => {
  submitSeoSettings();
};

// 处理审核配置
const handleReviewConfig = (row) => {
  currentTopic.value = row;
  reviewDialogVisible.value = true;
};

// 提交审核配置
const submitReviewConfig = async () => {
  try {
    const formData = await reviewConfigRef.value.validate();
    submittingReview.value = true;
    
    await api.topics.updateReviewConfig(formData.id, formData);
    
    ElMessage.success('审核配置保存成功');
    reviewDialogVisible.value = false;
    fetchTopics(); // 刷新数据
  } catch (error) {
    console.error('保存审核配置失败:', error);
    ElMessage.error(error.message || '保存审核配置失败');
  } finally {
    submittingReview.value = false;
  }
};

// 处理审核配置提交
const handleReviewSubmit = (data) => {
  submitReviewConfig();
};

// 处理选择变更
const handleSelectionChange = (selection) => {
  selectedTopics.value = selection;
};

// 批量操作
const handleBatchAction = (action) => {
  if (selectedTopics.value.length === 0) {
    ElMessage.warning('请至少选择一个话题');
    return;
  }
  
  const actionText = {
    'activate': '激活',
    'hide': '隐藏',
    'delete': '删除'
  }[action];
  
  const ids = selectedTopics.value.map(item => item.id);
  
  ElMessageBox.confirm(`确定要批量${actionText}选中的 ${ids.length} 个话题吗？`, '确认操作', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: action === 'delete' ? 'warning' : 'info'
  }).then(async () => {
    try {
      const res = await api.topics.batchOperate({
        ids,
        action
      });
      
      ElMessage.success(res.message || `批量${actionText}成功`);
      fetchTopics();
    } catch (error) {
      console.error(`批量${actionText}失败:`, error);
      ElMessage.error(error.message || `批量${actionText}失败`);
    }
  }).catch(() => {});
};

// 判断话题是否被禁用
const isDisabledTopic = (status) => {
  return status === 'hidden' || status === 'deleted';
};

// 图片审核相关
const imageReviewDialogVisible = ref(false);
const reviewLoading = ref(false);

// 打开图片审核对话框
const openImageReviewDialog = (topic) => {
  currentTopic.value = JSON.parse(JSON.stringify(topic));
  imageReviewDialogVisible.value = true;
};

// 关闭图片审核对话框
const closeImageReviewDialog = () => {
  currentTopic.value = null;
  imageReviewDialogVisible.value = false;
};

// 审核图片
const reviewImage = async (action) => {
  if (!currentTopic.value) return;
  
  reviewLoading.value = true;
  try {
    const res = await api.topics.reviewTopicImage(currentTopic.value.id, { action });
    
    if (res.data.success) {
      ElMessage.success(action === 'approve' ? '已通过图片审核' : '已拒绝图片');
      closeImageReviewDialog();
      fetchTopics(); // 刷新列表
    } else {
      ElMessage.error(res.data.message || '操作失败');
    }
  } catch (error) {
    console.error('审核话题图片失败:', error);
    ElMessage.error('操作失败，请重试');
  } finally {
    reviewLoading.value = false;
  }
};
</script>

<style scoped>
.topic-list-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
}

.filter-container {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.filter-item {
  margin-right: 10px;
  margin-bottom: 10px;
}

.search-input {
  width: 200px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.avatar-uploader {
  text-align: center;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 100px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 100px;
  display: block;
}

.upload-tip {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
}

.topic-status {
  margin-top: 8px;
}

.image-review-container {
  padding: 10px 0;
}

.topic-info-preview {
  margin-bottom: 20px;
}

.topic-info-preview h3 {
  margin: 0 0 10px;
  font-size: 18px;
}

.topic-info-preview p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.image-preview-container {
  display: flex;
  margin-bottom: 20px;
  gap: 20px;
}

.image-preview-item {
  flex: 1;
}

.image-preview-item h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #606266;
}

.image-wrapper {
  width: 100%;
  height: 250px;
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.el-image {
  width: 100%;
  height: 100%;
}

.no-image {
  color: #909399;
  font-size: 14px;
}

.review-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}
</style> 