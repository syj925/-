<template>
  <div class="category-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>分类管理</h3>
          <el-button type="primary" @click="showAddDialog">添加分类</el-button>
        </div>
      </template>
      
      <!-- 分类列表 -->
      <el-table :data="categoryList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="分类名称" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="postCount" label="帖子数量" width="100" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 'active' ? 'warning' : 'success'" 
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status === 'active' ? '禁用' : '启用' }}
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
      
      <!-- 分类对话框 -->
      <el-dialog 
        :title="dialogType === 'add' ? '添加分类' : '编辑分类'" 
        v-model="dialogVisible"
        width="500px"
      >
        <el-form :model="categoryForm" :rules="categoryRules" ref="categoryFormRef" label-width="100px">
          <el-form-item label="分类名称" prop="name">
            <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input 
              v-model="categoryForm.description" 
              type="textarea" 
              :rows="3" 
              placeholder="请输入分类描述" 
            />
          </el-form-item>
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="categoryForm.sort" :min="0" :max="999" />
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="categoryForm.status" :active-value="'active'" :inactive-value="'inactive'" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitCategoryForm" :loading="submitLoading">确定</el-button>
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

// 分类列表数据
const categoryList = ref([]);

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
const categoryFormRef = ref(null);

// 分类表单数据
const categoryForm = reactive({
  id: null,
  name: '',
  description: '',
  sort: 0,
  status: 'active',
  type: 'post' // 添加type字段，默认为post类型
});

// 表单验证规则
const categoryRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'blur' }
  ]
};

// 显示添加对话框
const showAddDialog = () => {
  dialogType.value = 'add';
  resetForm();
  dialogVisible.value = true;
};

// 编辑分类
const handleEdit = (row) => {
  dialogType.value = 'edit';
  
  // 复制数据到表单
  Object.keys(categoryForm).forEach(key => {
    if (key in row) {
      categoryForm[key] = row[key];
    }
  });
  
  dialogVisible.value = true;
};

// 处理开启/关闭分类状态
const handleToggleStatus = (row) => {
  const statusText = row.status === 'active' ? '禁用' : '启用';
  const newStatus = row.status === 'active' ? 'inactive' : 'active';
  // 显式转换为后端验证器需要的数值: 1=启用, 0=禁用
  const statusValue = row.status === 'active' ? 0 : 1;
  
  ElMessageBox.confirm(`确定要${statusText}该分类吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      console.log(`切换分类状态：ID=${row.id}, 当前状态=${row.status}, 新状态=${newStatus}, statusValue=${statusValue}`);
      
      // 发送数值类型，满足后端验证器要求
      const updateData = {
        status: statusValue // 数值类型: 1=启用, 0=禁用
      };
      
      console.log('发送请求数据:', updateData);
      
      // 使用API方法
      const response = await api.content.updateCategory(row.id, updateData);
      
      console.log('更新结果:', response);
      
      if (response && response.message && !response.message.includes('错误')) {
        // 更新本地状态
        row.status = newStatus;
        
        ElMessage({
          type: 'success',
          message: `分类${row.name}已${statusText}`
        });
        
        // 强制刷新列表，确保显示最新状态
        setTimeout(async () => {
          await loadCategoryList();
        }, 500);
      } else {
        throw new Error(response?.message || '更新失败');
      }
    } catch (error) {
      console.error('切换状态失败:', error);
      ElMessage({
        type: 'error',
        message: `操作失败: ${error.message || '未知错误'}`
      });
    }
  }).catch(() => {
    // 用户取消操作
  });
};

// 删除分类
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除分类"${row.name}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // 调用API删除分类
      const result = await api.content.deleteCategory(row.id);
      
      if (result.success) {
        ElMessage.success(`已删除分类: ${row.name}`);
        // 重新加载分类列表
        loadCategoryList();
      } else {
        ElMessage.error(result.message || '删除分类失败');
      }
    } catch (error) {
      console.error('删除分类出错:', error);
      ElMessage.error('删除分类失败，请稍后再试');
    }
  }).catch(() => {
    // 取消操作
  });
};

// 提交分类表单
const submitCategoryForm = () => {
  if (!categoryFormRef.value) return;
  
  categoryFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      
      try {
        let result;
        
        // 创建一个新对象来提交，避免修改原始表单数据
        const submitData = {
          ...categoryForm,
          // 转换status值为数字格式
          status: categoryForm.status === 'active' ? 1 : 0
        };
        
        console.log('提交分类表单数据:', submitData);
        
        if (dialogType.value === 'add') {
          // 添加分类
          result = await api.content.createCategory(submitData);
        } else {
          // 编辑分类
          result = await api.content.updateCategory(submitData.id, submitData);
        }
        
        if (result && result.message && !result.message.includes('错误')) {
          dialogVisible.value = false;
          ElMessage.success(dialogType.value === 'add' ? '添加分类成功' : '更新分类成功');
          
          // 重新加载分类列表
          loadCategoryList();
        } else {
          ElMessage.error(result?.message || `${dialogType.value === 'add' ? '添加' : '更新'}分类失败`);
        }
      } catch (error) {
        console.error(`${dialogType.value === 'add' ? '添加' : '更新'}分类出错:`, error);
        ElMessage.error(`${dialogType.value === 'add' ? '添加' : '更新'}分类失败，请稍后再试`);
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// 重置表单
const resetForm = () => {
  if (categoryFormRef.value) {
    categoryFormRef.value.resetFields();
  }
  
  categoryForm.id = null;
  categoryForm.name = '';
  categoryForm.description = '';
  categoryForm.sort = 0;
  categoryForm.status = 'active';
  categoryForm.type = 'post';
};

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  loadCategoryList();
};

// 处理分页当前页变化
const handleCurrentChange = (page) => {
  currentPage.value = page;
  loadCategoryList();
};

// 加载分类列表
const loadCategoryList = async () => {
  loading.value = true;
  try {
    // 构建请求参数
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      _t: new Date().getTime(), // 添加时间戳防止缓存
      includeInactive: true // 这个参数在后端接口中已定义，用于包含禁用状态的分类
    };
    
    // 调用API获取分类列表
    const response = await api.content.getCategories(params);
    
    console.log('分类返回数据:', response);
    
    // 添加详细日志检查
    let items = [];
    if (response && response.items) {
      console.log('原始数据结构 - 直接数组格式:');
      items = response.items;
    } else if (response && response.data && response.data.items) {
      console.log('原始数据结构 - 嵌套格式 (data.items):');
      items = response.data.items;
    } else if (response && response.data) {
      console.log('原始数据结构 - 标准格式:');
      items = response.data.rows || response.data;
    }

    if (items && Array.isArray(items)) {
      items.forEach((item, index) => {
        console.log(`分类[${index}] id=${item.id}, name=${item.name}, status=${item.status}, enabled=${item.enabled}, status类型=${typeof item.status}`);
      });
    } else {
      console.error('无法找到有效的分类数据数组:', response);
    }
    
    // 适配后端返回的结构
    if (items && Array.isArray(items)) {
      // 使用统一的items数组处理数据
      categoryList.value = items.map(item => {
        // 更全面的状态值转换逻辑
        let statusStr = 'active'; // 默认值
        
        // 首先检查enabled字段，这是我们设置的字段
        if (typeof item.enabled !== 'undefined') {
          statusStr = item.enabled ? 'active' : 'inactive';
        }
        // 然后检查status字段
        else if (typeof item.status === 'number') {
          // 数字类型: 1=active, 0=inactive
          statusStr = item.status === 1 ? 'active' : 'inactive';
        } else if (typeof item.status === 'string') {
          // 字符串类型: 处理各种可能的状态值
          const statusLower = item.status.toLowerCase();
          if (statusLower === 'enabled' || statusLower === 'active' || item.status === '1') {
            statusStr = 'active';
          } else if (statusLower === 'disabled' || statusLower === 'inactive' || item.status === '0') {
            statusStr = 'inactive';
          } else {
            statusStr = 'inactive'; // 默认为禁用
          }
        } else if (typeof item.status === 'boolean') {
          // 布尔类型
          statusStr = item.status ? 'active' : 'inactive';
        }
        
        console.log(`分类 ${item.id} 状态转换: status=${item.status}, enabled=${item.enabled} -> ${statusStr}`);
        
        return {
          ...item,
          status: statusStr
        };
      });

      // 处理总数
      if (response && response.totalItems) {
        total.value = response.totalItems;
      } else if (response && response.data && response.data.totalItems) {
        total.value = response.data.totalItems;
      } else if (response && response.data && response.data.total) {
        total.value = response.data.total;
      } else {
        total.value = items.length;
      }
    } else {
      ElMessage.error('获取分类列表失败: 返回数据格式异常');
    }
  } catch (error) {
    console.error('加载分类列表出错:', error);
    ElMessage.error('加载分类列表失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 在组件挂载时加载数据
onMounted(() => {
  // 先加载分类列表
  loadCategoryList();
});
</script>

<style scoped>
.category-management-container {
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style> 