<template>
  <div class="emoji-pack-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>表情包管理</h2>
      <div class="header-actions">
        <el-button @click="handleClearCache" :loading="clearingCache">
          <el-icon><RefreshRight /></el-icon>
          清除缓存
        </el-button>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建表情包
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="名称">
          <el-input v-model="filterForm.name" placeholder="搜索表情包名称" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterForm.type" placeholder="全部类型" clearable>
            <el-option label="系统内置" value="system" />
            <el-option label="官方表情" value="official" />
            <el-option label="用户创建" value="user" />
            <el-option label="商店表情" value="store" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable>
            <el-option label="已启用" value="active" />
            <el-option label="已禁用" value="inactive" />
            <el-option label="待审核" value="pending" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表情包列表 -->
    <el-card shadow="never">
      <el-table :data="packList" v-loading="loading" style="width: 100%">
        <el-table-column label="封面" width="80">
          <template #default="{ row }">
            <el-image 
              v-if="row.coverUrl"
              :src="getImageUrl(row.coverUrl)" 
              :preview-src-list="[getImageUrl(row.coverUrl)]"
              fit="cover"
              style="width: 50px; height: 50px; border-radius: 8px;"
            />
            <div v-else class="no-cover">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="emojiCount" label="表情数" width="80" align="center" />
        <el-table-column prop="downloadCount" label="下载量" width="90" align="center" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : row.status === 'pending' ? 'warning' : 'info'">
              {{ row.status === 'active' ? '已启用' : row.status === 'pending' ? '待审核' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isFeatured" label="精选" width="70" align="center">
          <template #default="{ row }">
            <el-switch 
              v-model="row.isFeatured" 
              @change="handleFeaturedChange(row)"
              :loading="row.featuredLoading"
            />
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handleManageEmojis(row)">管理表情</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <!-- 新建/编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑表情包' : '新建表情包'"
      width="600px"
    >
      <el-form 
        ref="formRef" 
        :model="packForm" 
        :rules="formRules" 
        label-width="100px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="packForm.name" placeholder="请输入表情包名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="packForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入表情包描述" 
            maxlength="200" 
            show-word-limit 
          />
        </el-form-item>
        <el-form-item label="封面图" prop="coverUrl">
          <el-upload
            class="cover-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleCoverSuccess"
            :before-upload="beforeCoverUpload"
            accept="image/*"
          >
            <el-image 
              v-if="packForm.coverUrl" 
              :src="getImageUrl(packForm.coverUrl)" 
              fit="cover"
              class="cover-preview"
            />
            <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">建议尺寸 200x200，支持 JPG/PNG/GIF</div>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="packForm.type" placeholder="请选择类型">
            <el-option label="官方表情" value="official" />
            <el-option label="系统内置" value="system" />
            <el-option label="商店表情" value="store" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="packForm.sortOrder" :min="0" :max="9999" />
          <span class="form-tip">数字越小越靠前</span>
        </el-form-item>
        <el-form-item label="精选推荐">
          <el-switch v-model="packForm.isFeatured" />
        </el-form-item>
        <el-form-item label="状态" v-if="isEdit">
          <el-radio-group v-model="packForm.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Picture, RefreshRight } from '@element-plus/icons-vue';
import api from '@/utils/api';
import { API_BASE_URL } from '@/config';

// 状态
const loading = ref(false);
const packList = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref(null);
const clearingCache = ref(false);

// 筛选
const filterForm = reactive({
  name: '',
  type: '',
  status: ''
});

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
});

// 表单
const packForm = reactive({
  id: '',
  name: '',
  description: '',
  coverUrl: '',
  type: 'official',
  sortOrder: 0,
  isFeatured: false,
  status: 'active'
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入表情包名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择类型', trigger: 'change' }
  ]
};

// 上传配置
const uploadUrl = `${API_BASE_URL}/upload`;
const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem('admin_token')}`
};

// 获取类型名称
const getTypeName = (type) => {
  const typeMap = {
    system: '系统内置',
    official: '官方表情',
    user: '用户创建',
    store: '商店表情'
  };
  return typeMap[type] || type;
};

// 获取类型标签样式
const getTypeTagType = (type) => {
  const typeMap = {
    system: 'danger',
    official: 'primary',
    user: 'success',
    store: 'warning'
  };
  return typeMap[type] || 'info';
};

// 获取图片URL
const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

// 获取数据
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      includeEmojis: true
    };
    if (filterForm.name) params.name = filterForm.name;
    if (filterForm.type) params.type = filterForm.type;
    if (filterForm.status) params.status = filterForm.status;

    const res = await api.emoji.getPacks(params);
    if (res.success || res.code === 0) {
      packList.value = res.data?.data || res.data || [];
      pagination.total = res.data?.total || 0;
    }
  } catch (error) {
    ElMessage.error('获取表情包列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 重置筛选
const resetFilter = () => {
  filterForm.name = '';
  filterForm.type = '';
  filterForm.status = '';
  pagination.page = 1;
  fetchData();
};

// 新建
const handleCreate = () => {
  isEdit.value = false;
  Object.assign(packForm, {
    id: '',
    name: '',
    description: '',
    coverUrl: '',
    type: 'official',
    sortOrder: 0,
    isFeatured: false,
    status: 'active'
  });
  dialogVisible.value = true;
};

// 编辑
const handleEdit = (row) => {
  isEdit.value = true;
  Object.assign(packForm, {
    id: row.id,
    name: row.name,
    description: row.description || '',
    coverUrl: row.coverUrl || '',
    type: row.type,
    sortOrder: row.sortOrder || 0,
    isFeatured: row.isFeatured || false,
    status: row.status
  });
  dialogVisible.value = true;
};

// 管理表情
const handleManageEmojis = (row) => {
  // 跳转到表情管理页面
  window.location.href = `/emoji/list?packId=${row.id}&packName=${encodeURIComponent(row.name)}`;
};

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除表情包"${row.name}"吗？删除后将同时删除包内所有表情。`,
      '删除确认',
      { type: 'warning' }
    );

    await api.emoji.deletePack(row.id);
    ElMessage.success('删除成功');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
      console.error(error);
    }
  }
};

// 精选切换
const handleFeaturedChange = async (row) => {
  row.featuredLoading = true;
  try {
    await api.emoji.updatePack(row.id, { is_featured: row.isFeatured });
    ElMessage.success(row.isFeatured ? '已设为精选' : '已取消精选');
  } catch (error) {
    row.isFeatured = !row.isFeatured;
    ElMessage.error('操作失败');
    console.error(error);
  } finally {
    row.featuredLoading = false;
  }
};

// 封面上传成功
const handleCoverSuccess = (response) => {
  if (response.code === 0 && response.data) {
    packForm.coverUrl = response.data.url || response.data;
    ElMessage.success('封面上传成功');
  } else {
    ElMessage.error('封面上传失败');
  }
};

// 封面上传前校验
const beforeCoverUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('只能上传图片文件');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB');
    return false;
  }
  return true;
};

// 清除缓存
const handleClearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '清除缓存后，所有客户端将在下次请求时重新获取表情数据。确定要清除吗？',
      '清除缓存确认',
      { type: 'warning' }
    );

    clearingCache.value = true;
    const res = await api.emoji.clearCache();
    
    if (res.success || res.code === 0) {
      ElMessage.success('表情系统缓存已清除');
      // 刷新当前列表
      fetchData();
    } else {
      ElMessage.error(res.msg || res.message || '清除缓存失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清除缓存失败');
      console.error(error);
    }
  } finally {
    clearingCache.value = false;
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    submitting.value = true;

    const data = {
      name: packForm.name,
      description: packForm.description,
      cover_url: packForm.coverUrl,
      type: packForm.type,
      sort_order: packForm.sortOrder,
      is_featured: packForm.isFeatured
    };

    if (isEdit.value) {
      data.status = packForm.status;
      await api.emoji.updatePack(packForm.id, data);
      ElMessage.success('更新成功');
    } else {
      await api.emoji.createPack(data);
      ElMessage.success('创建成功');
    }

    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    if (error !== false) {
      ElMessage.error(isEdit.value ? '更新失败' : '创建失败');
      console.error(error);
    }
  } finally {
    submitting.value = false;
  }
};

// 初始化
onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
.emoji-pack-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.filter-card {
  margin-bottom: 20px;

  .filter-form {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.no-cover {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 24px;
}

.cover-uploader {
  .cover-preview {
    width: 100px;
    height: 100px;
    border-radius: 8px;
  }

  :deep(.el-upload) {
    width: 100px;
    height: 100px;
    border: 1px dashed #d9d9d9;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.3s;

    &:hover {
      border-color: #409eff;
    }
  }

  .cover-uploader-icon {
    font-size: 28px;
    color: #8c939d;
  }
}

.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #999;
}
</style>
