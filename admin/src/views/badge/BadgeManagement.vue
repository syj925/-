<template>
  <div class="badge-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>用户标签管理</h3>
          <el-button type="primary" @click="showAddDialog">添加标签</el-button>
        </div>
      </template>
      
      <!-- 标签列表 -->
      <el-table :data="badgeList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="标签名称" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="颜色" width="100">
          <template #default="scope">
            <div class="color-preview" :style="{backgroundColor: scope.row.color}"></div>
            <span>{{ scope.row.color }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status ? 'success' : 'danger'">
              {{ scope.row.status ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status ? 'warning' : 'success'" 
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
      
      <!-- 标签对话框 -->
      <el-dialog 
        :title="dialogType === 'add' ? '添加标签' : '编辑标签'" 
        v-model="dialogVisible"
        width="500px"
      >
        <el-form :model="badgeForm" :rules="badgeRules" ref="badgeFormRef" label-width="100px">
          <el-form-item label="标签名称" prop="name">
            <el-input v-model="badgeForm.name" placeholder="请输入标签名称" />
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input 
              v-model="badgeForm.description" 
              type="textarea" 
              :rows="3" 
              placeholder="请输入标签描述" 
            />
          </el-form-item>
          <el-form-item label="标签颜色" prop="color">
            <el-color-picker v-model="badgeForm.color" />
            <span class="color-value">{{ badgeForm.color }}</span>
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="badgeForm.status" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitBadgeForm" :loading="submitLoading">确定</el-button>
          </span>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/utils/api';

// 标签列表数据
const badgeList = ref([]);

// 分页相关
const total = ref(0);
const pageSize = ref(10);
const currentPage = ref(1);

// 加载状态
const loading = ref(false);
const submitLoading = ref(false);

// 对话框相关
const dialogVisible = ref(false);
const dialogType = ref('add'); // 'add' 或 'edit'
const badgeFormRef = ref(null);

// 标签表单数据
const badgeForm = reactive({
  id: null,
  name: '',
  description: '',
  color: '#4A90E2',
  status: true
});

// 表单验证规则
const badgeRules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
  ],
  color: [
    { required: true, message: '请选择颜色', trigger: 'change' }
  ]
};

// 显示添加对话框
const showAddDialog = () => {
  dialogType.value = 'add';
  resetForm();
  dialogVisible.value = true;
};

// 编辑标签
const handleEdit = (row) => {
  dialogType.value = 'edit';
  
  // 复制数据到表单
  Object.keys(badgeForm).forEach(key => {
    if (key in row) {
      badgeForm[key] = row[key];
    }
  });
  
  dialogVisible.value = true;
};

// 处理开启/关闭标签状态
const handleToggleStatus = (row) => {
  const statusText = row.status ? '禁用' : '启用';
  
  ElMessageBox.confirm(`确定要${statusText}标签"${row.name}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const result = await api.badge.updateStatus(row.id, {
        status: !row.status
      });
      
      if (result.success) {
        row.status = !row.status;
        ElMessage.success(`已${statusText}标签: ${row.name}`);
      } else {
        ElMessage.error(result.message || '操作失败');
      }
    } catch (error) {
      console.error('操作标签状态失败:', error);
      ElMessage.error('操作失败，请稍后再试');
    }
  }).catch(() => {});
};

// 删除标签
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除标签"${row.name}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const result = await api.badge.delete(row.id);
      
      if (result.success) {
        ElMessage.success(`已删除标签: ${row.name}`);
        loadBadgeList();
      } else {
        ElMessage.error(result.message || '删除标签失败');
      }
    } catch (error) {
      console.error('删除标签出错:', error);
      ElMessage.error('删除标签失败，请稍后再试');
    }
  }).catch(() => {});
};

// 提交标签表单
const submitBadgeForm = () => {
  if (!badgeFormRef.value) return;
  
  badgeFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      
      try {
        let result;
        
        if (dialogType.value === 'add') {
          result = await api.badge.create(badgeForm);
        } else {
          result = await api.badge.update(badgeForm.id, badgeForm);
        }
        
        if (result.success) {
          dialogVisible.value = false;
          ElMessage.success(dialogType.value === 'add' ? '添加标签成功' : '更新标签成功');
          loadBadgeList();
        } else {
          ElMessage.error(result.message || `${dialogType.value === 'add' ? '添加' : '更新'}标签失败`);
        }
      } catch (error) {
        console.error(`${dialogType.value === 'add' ? '添加' : '更新'}标签出错:`, error);
        ElMessage.error(`${dialogType.value === 'add' ? '添加' : '更新'}标签失败，请稍后再试`);
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// 重置表单
const resetForm = () => {
  if (badgeFormRef.value) {
    badgeFormRef.value.resetFields();
  }
  
  badgeForm.id = null;
  badgeForm.name = '';
  badgeForm.description = '';
  badgeForm.color = '#4A90E2';
  badgeForm.status = true;
};

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  loadBadgeList();
};

// 处理分页当前页变化
const handleCurrentChange = (page) => {
  currentPage.value = page;
  loadBadgeList();
};

// 加载标签列表
const loadBadgeList = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    };
    
    const response = await api.badge.getList(params);
    
    if (response.success) {
      badgeList.value = response.data.items || [];
      total.value = response.data.total || 0;
    } else {
      ElMessage.error('获取标签列表失败');
    }
  } catch (error) {
    console.error('加载标签列表出错:', error);
    ElMessage.error('加载标签列表失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 在组件挂载时加载数据
onMounted(() => {
  loadBadgeList();
});
</script>

<style scoped>
.badge-management-container {
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
  font-weight: 600;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.color-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  margin-right: 8px;
  vertical-align: middle;
  border: 1px solid #ddd;
}

.color-value {
  margin-left: 10px;
  font-size: 14px;
  color: #606266;
}
</style> 