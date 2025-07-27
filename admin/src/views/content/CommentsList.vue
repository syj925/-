<template>
  <div class="comments-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>评论管理</h3>
          <div class="search-container">
            <el-input
              v-model="searchQuery"
              placeholder="搜索内容/用户"
              class="search-input"
              clearable
              @clear="fetchComments"
            >
              <template #append>
                <el-button :icon="Search" @click="handleSearch"></el-button>
              </template>
            </el-input>
          </div>
        </div>
      </template>
      <el-table :data="commentsList" style="width: 100%" v-loading="loading" row-key="id">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="评论内容" min-width="300">
          <template #default="scope">
            <div class="comment-content-wrapper">
              <!-- 层级缩进显示 -->
              <div class="comment-level-indicator" :style="{ paddingLeft: (scope.row.reply_level || 0) * 20 + 'px' }">
                <!-- 层级标识 -->
                <span v-if="scope.row.reply_level > 0" class="level-badge">
                  L{{ scope.row.reply_level }}
                </span>
                <!-- 回复标识 -->
                <span v-if="scope.row.reply_to" class="reply-indicator">
                  <el-icon><ChatLineRound /></el-icon>
                </span>
                <!-- 评论内容 -->
                <span class="comment-text" :title="scope.row.content">
                  {{ scope.row.content }}
                </span>
              </div>
              <!-- 回复信息 -->
              <div v-if="scope.row.reply_level > 0" class="reply-info">
                <el-tag size="small" type="info">
                  回复层级: {{ scope.row.reply_level }}
                </el-tag>
                <el-tag v-if="scope.row.reply_to" size="small" type="warning">
                  回复: {{ scope.row.reply_to.substring(0, 8) }}...
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="所属帖子" width="180" show-overflow-tooltip>
          <template #default="scope">
            <span v-if="scope.row.post">{{ scope.row.post.content }}</span>
            <span v-else>未知帖子</span>
          </template>
        </el-table-column>
        <el-table-column label="评论者" width="120">
          <template #default="scope">
            {{ scope.row.author ? scope.row.author.nickname || scope.row.author.username : (scope.row.user ? scope.row.user.nickname || scope.row.user.username : '未知') }}
          </template>
        </el-table-column>
        <el-table-column label="评论时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt || scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(scope.row)"
              :loading="scope.row.deleteLoading"
            >
              删除
            </el-button>
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
      <el-empty v-if="commentsList.length === 0 && !loading" description="没有找到匹配的评论" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, ChatLineRound } from '@element-plus/icons-vue';
import api from '@/utils/api';

// 加载状态
const loading = ref(false);

// 搜索相关
const searchQuery = ref('');

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 评论列表数据
const commentsList = ref([]);

// 初始化
onMounted(() => {
  fetchComments();
});

// 获取评论列表
const fetchComments = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    };

    // 添加搜索条件
    if (searchQuery.value) {
      params.search = searchQuery.value;
    }

    const res = await api.comments.getList(params);
    
    if (res.success) {
      // 为每行数据添加loading状态
      commentsList.value = res.data.comments.map(comment => ({
        ...comment,
        deleteLoading: false
      }));
      
      console.log('评论数据样例:', commentsList.value[0]);
      total.value = res.data.pagination.total;
    } else {
      ElMessage.error(res.message || '获取评论列表失败');
    }
  } catch (error) {
    console.error('获取评论列表错误:', error);
    ElMessage.error(error.message || '获取评论列表失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 搜索处理函数
const handleSearch = () => {
  currentPage.value = 1; // 重置到第一页
  fetchComments();
};

// 分页处理函数
const handleSizeChange = (size) => {
  pageSize.value = size;
  fetchComments();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  fetchComments();
};

// 获取状态标签样式
const getTagType = (status) => {
  const map = {
    'deleted': 'danger',  // 已删除
    'normal': 'success',  // 正常
    'active': 'success',  // 正常（兼容）
    'pending': 'info',    // 待审核
    'rejected': 'danger'  // 已拒绝
  };
  return map[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    'deleted': '已删除',
    'normal': '正常',
    'active': '正常',     // 兼容旧的状态值
    'pending': '待审核',
    'rejected': '已拒绝'
  };
  return map[status] || '未知';
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleString();
};

// 查看评论
const handleView = (row) => {
  ElMessage.info(`查看评论ID: ${row.id}`);
  // 这里可以跳转到评论所在帖子或打开详情对话框
};

// 删除评论
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除ID为${row.id}的评论吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    row.deleteLoading = true;
    try {
      const res = await api.comments.delete(row.id);
      
      if (res.success) {
        ElMessage.success('评论删除成功');
        fetchComments(); // 重新获取列表
      } else {
        ElMessage.error(res.message || '删除评论失败');
      }
    } catch (error) {
      console.error('删除评论错误:', error);
      ElMessage.error(error.message || '删除评论失败，请稍后再试');
    } finally {
      row.deleteLoading = false;
    }
  }).catch(() => {
    // 用户取消删除
  });
};
</script>

<style scoped>
.comments-list-container {
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

.search-container {
  display: flex;
  align-items: center;
}

.search-input {
  width: 280px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 评论层级显示样式 */
.comment-content-wrapper {
  width: 100%;
}

.comment-level-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.level-badge {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  min-width: 24px;
  text-align: center;
}

.reply-indicator {
  color: #52c41a;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.comment-text {
  flex: 1;
  word-break: break-word;
  line-height: 1.4;
}

.reply-info {
  display: flex;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.reply-info .el-tag {
  font-size: 11px;
  height: 20px;
  line-height: 18px;
}
</style> 