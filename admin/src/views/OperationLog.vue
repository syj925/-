<template>
  <div class="operation-log-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>操作日志</h3>
          <div class="filter-container">
            <el-select v-model="filter.type" placeholder="操作类型" clearable>
              <el-option v-for="item in logTypes" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-select v-model="filter.user" placeholder="操作人" clearable>
              <el-option v-for="item in userOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-date-picker
              v-model="filter.timeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
            <el-button type="primary" @click="searchLogs">搜索</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </div>
        </div>
      </template>
      
      <!-- 日志列表 -->
      <el-table :data="logList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="操作类型" width="120">
          <template #default="scope">
            <el-tag :type="getTypeTagType(scope.row.type)">{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="操作内容" show-overflow-tooltip />
        <el-table-column prop="user" label="操作人" width="120" />
        <el-table-column prop="ip" label="IP地址" width="130" />
        <el-table-column prop="time" label="操作时间" width="180" />
        <el-table-column label="操作" width="80">
          <template #default="scope">
            <el-button size="small" @click="viewLogDetail(scope.row)">详情</el-button>
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
      
      <!-- 日志详情对话框 -->
      <el-dialog title="日志详情" v-model="detailDialogVisible" width="600px">
        <div class="log-detail" v-if="currentLog">
          <div class="detail-item">
            <span class="item-label">操作类型:</span>
            <el-tag :type="getTypeTagType(currentLog.type)">{{ currentLog.type }}</el-tag>
          </div>
          <div class="detail-item">
            <span class="item-label">操作人:</span>
            <span>{{ currentLog.user }}</span>
          </div>
          <div class="detail-item">
            <span class="item-label">操作时间:</span>
            <span>{{ currentLog.time }}</span>
          </div>
          <div class="detail-item">
            <span class="item-label">IP地址:</span>
            <span>{{ currentLog.ip }}</span>
          </div>
          <div class="detail-item">
            <span class="item-label">操作内容:</span>
            <span>{{ currentLog.content }}</span>
          </div>
          <div class="detail-item" v-if="currentLog.data">
            <span class="item-label">详细数据:</span>
            <pre>{{ JSON.stringify(currentLog.data, null, 2) }}</pre>
          </div>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

// 操作类型选项
const logTypes = [
  { value: '登录', label: '登录' },
  { value: '退出', label: '退出' },
  { value: '添加', label: '添加' },
  { value: '删除', label: '删除' },
  { value: '修改', label: '修改' },
  { value: '查询', label: '查询' },
  { value: '审核', label: '审核' },
];

// 用户选项
const userOptions = [
  { value: 'admin', label: '管理员' },
  { value: 'moderator', label: '内容审核员' },
  { value: 'editor', label: '编辑' }
];

// 筛选条件
const filter = reactive({
  type: '',
  user: '',
  timeRange: []
});

// 日志列表数据
const logList = ref([
  {
    id: 1,
    type: '登录',
    content: '管理员登录系统',
    user: 'admin',
    ip: '192.168.1.100',
    time: '2023-05-15 08:30:15',
    data: { userId: 1, loginType: 'account' }
  },
  {
    id: 2,
    type: '添加',
    content: '添加分类"校园活动"',
    user: 'admin',
    ip: '192.168.1.100',
    time: '2023-05-15 09:15:22',
    data: { categoryId: 6, name: '校园活动', description: '校园内各类活动信息' }
  },
  {
    id: 3,
    type: '修改',
    content: '修改系统设置',
    user: 'admin',
    ip: '192.168.1.100',
    time: '2023-05-15 10:05:36',
    data: { settingsChanged: ['siteName', 'logoUrl'] }
  },
  {
    id: 4,
    type: '审核',
    content: '审核通过帖子"校园文化节活动招募"',
    user: 'moderator',
    ip: '192.168.1.101',
    time: '2023-05-15 11:20:48',
    data: { postId: 45, postTitle: '校园文化节活动招募' }
  },
  {
    id: 5,
    type: '删除',
    content: '删除帖子"不符合社区规范的内容"',
    user: 'moderator',
    ip: '192.168.1.101',
    time: '2023-05-15 13:40:10',
    data: { postId: 46, postTitle: '不符合社区规范的内容' }
  }
]);

// 分页相关
const total = ref(100);
const pageSize = ref(10);
const currentPage = ref(1);

// 加载状态
const loading = ref(false);

// 详情对话框
const detailDialogVisible = ref(false);
const currentLog = ref(null);

// 获取操作类型的标签类型
const getTypeTagType = (type) => {
  const map = {
    '登录': 'success',
    '退出': 'info',
    '添加': 'primary',
    '删除': 'danger',
    '修改': 'warning',
    '查询': 'info',
    '审核': 'success'
  };
  return map[type] || 'info';
};

// 查看日志详情
const viewLogDetail = (log) => {
  currentLog.value = log;
  detailDialogVisible.value = true;
};

// 搜索日志
const searchLogs = () => {
  loading.value = true;
  
  // 这里应该调用API搜索日志
  console.log('搜索条件:', filter);
  
  // 模拟API调用
  setTimeout(() => {
    // 返回筛选后的数据
    loading.value = false;
  }, 500);
};

// 重置筛选条件
const resetFilter = () => {
  filter.type = '';
  filter.user = '';
  filter.timeRange = [];
  searchLogs();
};

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  loadLogs();
};

// 处理分页当前页变化
const handleCurrentChange = (page) => {
  currentPage.value = page;
  loadLogs();
};

// 加载日志数据
const loadLogs = () => {
  loading.value = true;
  
  // 这里应该调用API获取日志列表
  setTimeout(() => {
    // 模拟获取数据
    loading.value = false;
  }, 500);
};

onMounted(() => {
  loadLogs();
});
</script>

<style scoped>
.operation-log-container {
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
  display: flex;
  gap: 10px;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.log-detail {
  padding: 10px;
}

.detail-item {
  margin-bottom: 15px;
  line-height: 1.5;
}

.item-label {
  font-weight: bold;
  margin-right: 10px;
  display: inline-block;
  width: 80px;
  text-align: right;
}

pre {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  overflow: auto;
  max-height: 300px;
  margin-top: 10px;
}
</style> 