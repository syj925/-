<template>
  <div class="audit-logs-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>审核日志</span>
          <div class="header-actions">
            <el-button @click="fetchLogs" icon="Refresh" circle></el-button>
          </div>
        </div>
      </template>

      <!-- 筛选区域 -->
      <div class="filter-container">
        <el-select v-model="filter.targetType" placeholder="目标类型" clearable @change="handleFilter">
          <el-option label="帖子" value="post" />
          <el-option label="评论" value="comment" />
          <el-option label="用户" value="user" />
        </el-select>
        
        <el-select v-model="filter.action" placeholder="操作类型" clearable @change="handleFilter">
          <el-option label="通过" value="approve" />
          <el-option label="拒绝" value="reject" />
          <el-option label="封禁" value="ban" />
          <el-option label="删除" value="delete" />
        </el-select>
      </div>

      <!-- 表格区域 -->
      <el-table :data="logs" border stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="admin.nickname" label="操作管理员" width="120">
          <template #default="scope">
            {{ scope.row.admin?.nickname || scope.row.admin?.username || '未知' }}
          </template>
        </el-table-column>

        <el-table-column prop="target_type" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="getTypeTag(scope.row.target_type)">
              {{ getTypeLabel(scope.row.target_type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="action" label="动作" width="100">
          <template #default="scope">
            <el-tag :type="getActionTag(scope.row.action)">
              {{ getActionLabel(scope.row.action) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="reason" label="原因/备注" min-width="200" show-overflow-tooltip />
        
        <el-table-column label="目标ID" width="100">
          <template #default="scope">
            <el-tooltip :content="scope.row.target_id" placement="top">
              <span class="id-display">{{ formatId(scope.row.target_id) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import auditApi from '@/api/modules/audit'
import { formatDate, formatId } from '@/utils/format'

const loading = ref(false)
const logs = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const filter = reactive({
  targetType: '',
  action: ''
})

const getTypeLabel = (type) => {
  const map = { post: '帖子', comment: '评论', user: '用户' }
  return map[type] || type
}

const getTypeTag = (type) => {
  const map = { post: 'primary', comment: 'success', user: 'warning' }
  return map[type] || 'info'
}

const getActionLabel = (action) => {
  const map = { approve: '通过', reject: '拒绝', ban: '封禁', delete: '删除' }
  return map[action] || action
}

const getActionTag = (action) => {
  const map = { approve: 'success', reject: 'danger', ban: 'danger', delete: 'info' }
  return map[action] || ''
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      targetType: filter.targetType || undefined,
      action: filter.action || undefined
    }
    const res = await auditApi.getAuditLogs(params)
    if (res.code === 0) {
      logs.value = res.data.list
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取日志失败', error)
    ElMessage.error('获取日志失败')
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  page.value = 1
  fetchLogs()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchLogs()
}

const handleCurrentChange = (val) => {
  page.value = val
  fetchLogs()
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-container {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* ID显示样式 */
.id-display {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  background-color: #f5f5f5;
}

.id-display:hover {
  background-color: #e6f7ff;
  color: #1890ff;
}
</style>
