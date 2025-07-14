<template>
  <div class="rejection-logs">
    <div class="header">
      <h2>用户注册拒绝记录</h2>
      <p class="description">查看被拒绝的用户注册申请记录</p>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filters">
      <el-form :model="searchForm" inline>
        <el-form-item label="用户名">
          <el-input 
            v-model="searchForm.username" 
            placeholder="请输入用户名"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <el-table 
      :data="tableData" 
      v-loading="loading"
      stripe
      border
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="email" label="邮箱" width="180" />
      <el-table-column prop="rejection_reason" label="拒绝原因" min-width="200">
        <template #default="{ row }">
          <el-tooltip :content="row.rejection_reason" placement="top">
            <span class="reason-text">{{ row.rejection_reason }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="rejected_at" label="拒绝时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.rejected_at) }}
        </template>
      </el-table-column>
      <el-table-column prop="ip_address" label="IP地址" width="140" />
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/utils/api';

// 响应式数据
const loading = ref(false);
const tableData = ref([]);

// 搜索表单
const searchForm = reactive({
  username: '',
  dateRange: []
});

// 分页数据
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
});

// 获取拒绝记录列表
const fetchRejectionLogs = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      username: searchForm.username || undefined,
      startTime: searchForm.dateRange?.[0] || undefined,
      endTime: searchForm.dateRange?.[1] || undefined
    };

    const res = await api.users.getRejectionLogs(params);
    
    if (res.success) {
      tableData.value = res.data.list || [];
      pagination.total = res.data.total || 0;
    } else {
      ElMessage.error(res.message || '获取数据失败');
    }
  } catch (error) {
    console.error('获取拒绝记录错误:', error);
    ElMessage.error(error.message || '获取数据失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  fetchRejectionLogs();
};

// 重置搜索
const handleReset = () => {
  searchForm.username = '';
  searchForm.dateRange = [];
  pagination.page = 1;
  fetchRejectionLogs();
};

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.limit = size;
  pagination.page = 1;
  fetchRejectionLogs();
};

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.page = page;
  fetchRejectionLogs();
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleString();
};

// 组件挂载时获取数据
onMounted(() => {
  fetchRejectionLogs();
});
</script>

<style scoped>
.rejection-logs {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.filters {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.reason-text {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
