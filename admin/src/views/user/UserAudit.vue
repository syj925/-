<template>
  <div class="user-audit-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>用户审核</h3>
        </div>
      </template>
      <el-table :data="auditList" style="width: 100%" v-loading="loading">
        <el-table-column label="ID" width="100">
          <template #default="scope">
            <el-tooltip :content="scope.row.id" placement="top">
              <span class="user-id-display">{{ formatUserId(scope.row.id) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="账号" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column label="注册时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag
              :type="getStatusTagType(scope.row.status)"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" type="success" @click="handleApprove(scope.row)" :loading="approving === scope.row.id">通过</el-button>
            <el-button size="small" type="danger" @click="handleReject(scope.row)" :loading="rejecting === scope.row.id">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页控件 -->
      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
      
      <!-- 没有结果时显示 -->
      <el-empty v-if="auditList.length === 0 && !loading" description="没有待审核的用户" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/utils/api';
import { formatId } from '@/utils/format';

// 加载状态
const loading = ref(false);
const approving = ref(null);
const rejecting = ref(null);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 待审核用户列表
const auditList = ref([]);

// 初始化
onMounted(() => {
  fetchPendingUsers();
});

// 获取待审核用户列表
const fetchPendingUsers = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    };

    const res = await api.users.getPendingUsers(params);
    
    if (res.success) {
      auditList.value = res.data.users;
      total.value = res.data.pagination.total;
    } else {
      ElMessage.error(res.message || '获取待审核用户列表失败');
    }
  } catch (error) {
    console.error('获取待审核用户列表错误:', error);
    ElMessage.error(error.message || '获取待审核用户列表失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 分页处理函数
const handleSizeChange = (size) => {
  pageSize.value = size;
  fetchPendingUsers();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  fetchPendingUsers();
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleString();
};

// 通过审核
const handleApprove = async (row) => {
  ElMessageBox.confirm(
    `确定要通过用户"${row.nickname || row.username}"的审核吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(async () => {
    approving.value = row.id;
    try {
      const res = await api.users.auditUser(row.id, 'approve');
      
      if (res.success) {
        ElMessage.success('已通过用户审核');
        // 重新获取列表
        fetchPendingUsers();
      } else {
        ElMessage.error(res.message || '操作失败');
      }
    } catch (error) {
      console.error('审核用户错误:', error);
      ElMessage.error(error.message || '操作失败，请稍后再试');
    } finally {
      approving.value = null;
    }
  }).catch(() => {
    // 用户取消操作
  });
};

// 拒绝审核
const handleReject = async (row) => {
  ElMessageBox.prompt(
    `请输入拒绝用户"${row.nickname || row.username}"的原因：`,
    '拒绝审核',
    {
      confirmButtonText: '确定拒绝',
      cancelButtonText: '取消',
      type: 'warning',
      inputPlaceholder: '请输入拒绝原因，如：信息不完整、违反规定等',
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return '请输入拒绝原因';
        }
        if (value.trim().length < 5) {
          return '拒绝原因至少需要5个字符';
        }
        if (value.trim().length > 200) {
          return '拒绝原因不能超过200个字符';
        }
        return true;
      },
      inputErrorMessage: '请输入有效的拒绝原因'
    }
  ).then(async ({ value: reason }) => {
    rejecting.value = row.id;
    try {
      const res = await api.users.auditUser(row.id, 'reject', reason.trim());

      if (res.success) {
        ElMessage.warning('已拒绝用户审核，用户数据已删除');
        // 重新获取列表
        fetchPendingUsers();
      } else {
        ElMessage.error(res.message || '操作失败');
      }
    } catch (error) {
      console.error('审核用户错误:', error);
      ElMessage.error(error.message || '操作失败，请稍后再试');
    } finally {
      rejecting.value = null;
    }
  }).catch(() => {
    // 用户取消操作
  });
};

// 格式化用户ID显示
const formatUserId = formatId;

// 获取状态标签类型
const getStatusTagType = (status) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'warning';
    case 'banned':
      return 'danger';
    default:
      return 'info';
  }
};

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'active':
      return '已激活';
    case 'inactive':
      return '待审核';
    case 'banned':
      return '已封禁';
    default:
      return '未知';
  }
};
</script>

<style scoped>
.user-audit-container {
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

/* 用户ID显示样式 */
.user-id-display {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  background-color: #f5f5f5;
}

.user-id-display:hover {
  background-color: #e6f7ff;
  color: #1890ff;
}
</style> 