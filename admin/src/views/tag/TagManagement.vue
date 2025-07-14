<template>
  <div class="tag-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>标签管理</h3>
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon> 创建标签
          </el-button>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="filter-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索标签名称"
          clearable
          class="filter-item search-input"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="tagCategory"
          placeholder="标签分类"
          clearable
          class="filter-item"
        >
          <el-option label="全部" value="" />
          <el-option label="兴趣爱好" value="interest" />
          <el-option label="专业技能" value="skill" />
          <el-option label="学院专业" value="major" />
          <el-option label="年级" value="grade" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-select
          v-model="tagStatus"
          placeholder="标签状态"
          clearable
          class="filter-item"
        >
          <el-option label="全部" value="" />
          <el-option label="热门" value="hot" />
          <el-option label="普通" value="normal" />
          <el-option label="已禁用" value="disabled" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetFilter">重置</el-button>
      </div>
      
      <!-- 标签列表 -->
      <el-table :data="tagList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="标签名称" width="120">
          <template #default="scope">
            <div class="tag-name">
              <span class="tag-color" :style="{ backgroundColor: scope.row.color }"></span>
              {{ scope.row.name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100">
          <template #default="scope">
            <el-tag :type="getCategoryType(scope.row.category)">
              {{ getCategoryText(scope.row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="usageCount" label="使用次数" width="100" sortable />
        <el-table-column prop="createdAt" label="创建时间" width="180" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 'hot' ? 'info' : 'success'" 
              @click="handleToggleHot(scope.row)"
            >
              {{ scope.row.status === 'hot' ? '取消热门' : '设为热门' }}
            </el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 'disabled' ? 'success' : 'danger'" 
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status === 'disabled' ? '启用' : '禁用' }}
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
    
    <!-- 创建/编辑标签对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingTag.id ? '编辑标签' : '创建标签'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="editingTag" :rules="rules" ref="tagForm" label-width="80px">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="editingTag.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="标签分类" prop="category">
          <el-select v-model="editingTag.category" placeholder="请选择标签分类" style="width: 100%">
            <el-option label="兴趣爱好" value="interest" />
            <el-option label="专业技能" value="skill" />
            <el-option label="学院专业" value="major" />
            <el-option label="年级" value="grade" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="editingTag.description"
            type="textarea"
            :rows="3"
            placeholder="请输入标签描述"
          />
        </el-form-item>
        <el-form-item label="标签颜色" prop="color">
          <el-color-picker v-model="editingTag.color" show-alpha />
          <span class="color-preview" :style="{ backgroundColor: editingTag.color }"></span>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="editingTag.status" placeholder="请选择标签状态">
            <el-option label="普通" value="normal" />
            <el-option label="热门" value="hot" />
            <el-option label="已禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import api from '@/utils/api';

// 列表数据
const loading = ref(false);
const tagList = ref([]);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 搜索和筛选
const searchQuery = ref('');
const tagCategory = ref('');
const tagStatus = ref('');

// 对话框和表单
const dialogVisible = ref(false);
const editingTag = reactive({
  id: null,
  name: '',
  category: 'interest',
  description: '',
  color: '#409EFF',
  status: 'normal'
});
const tagForm = ref(null);
const rules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择标签分类', trigger: 'change' }
  ],
  description: [
    { max: 200, message: '长度不能超过 200 个字符', trigger: 'blur' }
  ],
  color: [
    { required: true, message: '请选择标签颜色', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择标签状态', trigger: 'change' }
  ]
};

// 生命周期
onMounted(() => {
  fetchTags();
});

// 方法
const fetchTags = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      category: tagCategory.value || undefined,
      status: tagStatus.value || undefined
    };
    
    const res = await api.tags.getList(params);
    
    if (res.success) {
      tagList.value = res.data.tags || [];
      total.value = res.data.pagination?.total || 0;
    } else {
      ElMessage.error(res.message || '获取标签列表失败');
    }
  } catch (error) {
    console.error('获取标签列表出错:', error);
    ElMessage.error('获取标签列表失败，请重试');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchTags();
};

const resetFilter = () => {
  searchQuery.value = '';
  tagCategory.value = '';
  tagStatus.value = '';
  handleSearch();
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchTags();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchTags();
};

const openCreateDialog = () => {
  Object.assign(editingTag, {
    id: null,
    name: '',
    category: 'interest',
    description: '',
    color: '#409EFF',
    status: 'normal'
  });
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  Object.assign(editingTag, { ...row });
  dialogVisible.value = true;
};

const handleToggleHot = async (row) => {
  const action = row.status === 'hot' ? '取消热门' : '设为热门';
  
  try {
    await ElMessageBox.confirm(`确定要${action}该标签吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    const res = await api.tags.toggleHot(row.id);
    
    if (res.success) {
      ElMessage.success(`已${action}标签: ${row.name}`);
      // 更新标签状态
      row.status = res.data.status;
    } else {
      ElMessage.error(res.message || `${action}标签失败`);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`${action}标签出错:`, error);
      ElMessage.error(`${action}标签失败，请重试`);
    }
  }
};

const handleToggleStatus = async (row) => {
  const action = row.status === 'disabled' ? '启用' : '禁用';
  
  try {
    await ElMessageBox.confirm(`确定要${action}该标签吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    const res = await api.tags.toggleStatus(row.id);
    
    if (res.success) {
      ElMessage.success(`已${action}标签: ${row.name}`);
      // 更新标签状态
      row.status = res.data.status;
    } else {
      ElMessage.error(res.message || `${action}标签失败`);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`${action}标签出错:`, error);
      ElMessage.error(`${action}标签失败，请重试`);
    }
  }
};

const getCategoryType = (category) => {
  const map = {
    'interest': 'success',
    'skill': 'primary',
    'major': 'warning',
    'grade': 'info',
    'other': ''
  };
  return map[category] || '';
};

const getCategoryText = (category) => {
  const map = {
    'interest': '兴趣爱好',
    'skill': '专业技能',
    'major': '学院专业',
    'grade': '年级',
    'other': '其他'
  };
  return map[category] || '未知';
};

const getStatusType = (status) => {
  const map = {
    'normal': 'success',
    'hot': 'danger',
    'disabled': 'info'
  };
  return map[status] || 'info';
};

const getStatusText = (status) => {
  const map = {
    'normal': '普通',
    'hot': '热门',
    'disabled': '已禁用'
  };
  return map[status] || '未知';
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString();
};

const handleSubmit = async () => {
  if (!tagForm.value) return;
  
  try {
    await tagForm.value.validate();
    
    let res;
    if (editingTag.id) {
      // 更新标签
      res = await api.tags.update(editingTag.id, {
        name: editingTag.name,
        category: editingTag.category,
        description: editingTag.description,
        color: editingTag.color,
        status: editingTag.status
      });
    } else {
      // 创建标签
      res = await api.tags.create({
        name: editingTag.name,
        category: editingTag.category,
        description: editingTag.description,
        color: editingTag.color,
        status: editingTag.status
      });
    }
    
    if (res.success) {
      ElMessage.success(editingTag.id ? '标签更新成功！' : '标签创建成功！');
      dialogVisible.value = false;
      fetchTags(); // 刷新标签列表
    } else {
      ElMessage.error(res.message || (editingTag.id ? '更新标签失败' : '创建标签失败'));
    }
  } catch (error) {
    console.error('表单验证或提交出错:', error);
    if (error?.fields) {
      // 表单验证错误
      return;
    }
    ElMessage.error(editingTag.id ? '更新标签失败，请重试' : '创建标签失败，请重试');
  }
};
</script>

<style scoped>
.tag-management-container {
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

.color-preview {
  display: inline-block;
  width: 30px;
  height: 30px;
  margin-left: 10px;
  border-radius: 4px;
  vertical-align: middle;
  border: 1px solid #dcdfe6;
}

.tag-name {
  display: flex;
  align-items: center;
}

.tag-color {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 6px;
}
</style> 