<template>
  <div class="posts-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>帖子管理</h3>
          <div class="search-container">
            <el-input
              v-model="searchQuery"
              placeholder="搜索标题/作者"
              class="search-input"
              clearable
              @clear="handleSearch"
            >
              <template #append>
                <el-button :icon="Search" @click="handleSearch"></el-button>
              </template>
            </el-input>
            
            <el-select
              v-model="statusFilter"
              placeholder="状态筛选"
              clearable
              class="status-filter"
              @change="handleSearch"
            >
              <el-option
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
        </div>
      </template>
      <el-table :data="postsList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="内容" min-width="180" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.content }}
          </template>
        </el-table-column>
        <el-table-column label="作者" width="120">
          <template #default="scope">
            {{ scope.row.author ? scope.row.author.nickname || scope.row.author.username : '未知' }}
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at || scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="views" label="浏览量" width="100" />
        <el-table-column prop="likes" label="点赞数" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="推荐" width="100">
          <template #default="scope">
            <div style="display: flex; flex-direction: column; align-items: center;">
              <el-tag :type="scope.row.isRecommended ? 'success' : 'info'" style="margin-bottom: 5px;">
                {{ scope.row.isRecommended ? '已推荐' : '未推荐' }}
              </el-tag>
            <el-switch
              v-model="scope.row.isRecommended"
              :loading="scope.row.recommendLoading"
              @change="(val) => handleRecommend(scope.row, val)"
            />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="handleTopPost(scope.row)"
              :loading="scope.row.topLoading"
            >
              {{ scope.row.status === 'pinned' ? '取消置顶' : '置顶' }}
            </el-button>
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
      <el-empty v-if="postsList.length === 0 && !loading" description="没有找到匹配的帖子" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import api from '@/utils/api';

// 加载状态
const loading = ref(false);

// 搜索相关
const searchQuery = ref('');
const statusFilter = ref('');

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 状态选项
const statusOptions = [
  { value: 'active', label: '正常' },
  { value: 'pending', label: '待审核' },
  { value: 'pinned', label: '置顶' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'deleted', label: '已删除' }
];

// 帖子列表数据
const postsList = ref([]);

// 初始化
onMounted(() => {
  fetchPosts();
});

// 获取帖子列表
const fetchPosts = async () => {
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

    // 添加状态筛选
    if (statusFilter.value) {
      params.status = statusFilter.value;
    }

    const res = await api.posts.getList(params);
    
    if (res.success) {
      // 日志：输出后端返回的原始数据
      console.log('后端返回的帖子数据:', res.data.posts);
      // 为每行数据添加loading状态，并确保字段名称一致性
      postsList.value = res.data.posts.map(post => ({
        ...post,
        // 确保字段名称兼容性
        createdAt: post.createdAt || post.created_at,
        created_at: post.created_at || post.createdAt,
        isRecommended: post.isRecommended === undefined 
          ? (post.is_recommended === undefined ? false : post.is_recommended) 
          : post.isRecommended,
        // 添加loading状态
        topLoading: false,
        deleteLoading: false,
        recommendLoading: false
      }));
      // 日志：输出前端处理后的数据
      console.log('前端处理后的postsList:', postsList.value);
      total.value = res.data.pagination.total;
    } else {
      ElMessage.error(res.message || '获取帖子列表失败');
    }
  } catch (error) {
    console.error('获取帖子列表错误:', error);
    ElMessage.error(error.message || '获取帖子列表失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 搜索处理函数
const handleSearch = () => {
  currentPage.value = 1; // 重置到第一页
  fetchPosts();
};

// 分页处理函数
const handleSizeChange = (size) => {
  pageSize.value = size;
  fetchPosts();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  fetchPosts();
};

// 获取状态标签样式
const getTagType = (status) => {
  const map = {
    'deleted': 'danger',  // 已删除
    'active': 'success',  // 正常
    'pinned': 'warning',  // 置顶
    'pending': 'info',    // 待审核
    'rejected': 'danger', // 已拒绝
    'published': 'success' // 已发布
  };
  return map[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    'deleted': '已删除',
    'active': '正常',
    'pinned': '置顶',
    'pending': '待审核',
    'rejected': '已拒绝',
    'published': '已发布'
  };
  return map[status] || '未知';
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleString();
};

// 查看帖子
const handleView = (row) => {
  ElMessage.info(`查看帖子ID: ${row.id}`);
  // 这里可以跳转到帖子详情页或打开详情对话框
};

// 置顶/取消置顶帖子
const handleTopPost = async (row) => {
  // 设置行的loading状态
  row.topLoading = true;
  
  try {
    // 根据当前状态决定是置顶还是取消置顶
    const newStatus = row.status === 'pinned' ? 'active' : 'pinned';
    
    const res = await api.posts.update(row.id, { status: newStatus });
    
    if (res.success) {
      ElMessage.success(
        newStatus === 'pinned' 
          ? `已将帖子ID:${row.id}设为置顶` 
          : `已取消帖子ID:${row.id}的置顶状态`
      );
      
      // 更新本地状态
      row.status = newStatus;
    } else {
      ElMessage.error(res.message || '操作失败');
    }
  } catch (error) {
    console.error('置顶/取消置顶帖子错误:', error);
    ElMessage.error(error.message || '操作失败，请稍后再试');
  } finally {
    row.topLoading = false;
  }
};

// 删除帖子
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除ID为${row.id}的帖子吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    row.deleteLoading = true;
    try {
      const res = await api.posts.delete(row.id);
      
      if (res.success) {
        ElMessage.success('帖子删除成功');
        fetchPosts(); // 重新获取列表
      } else {
        ElMessage.error(res.message || '删除帖子失败');
      }
    } catch (error) {
      console.error('删除帖子错误:', error);
      ElMessage.error(error.message || '删除帖子失败，请稍后再试');
    } finally {
      row.deleteLoading = false;
    }
  }).catch(() => {
    // 用户取消删除
  });
};

// 设置/取消推荐帖子
const handleRecommend = async (row, isRecommended) => {
  // 设置行的loading状态
  row.recommendLoading = true;
  
  try {
    const res = await api.posts.recommend(row.id, { isRecommended });

    // 兼容两种响应格式：{success: true} 和 {code: 0}
    if (res.success === true || res.code === 0) {
      ElMessage.success(
        isRecommended
          ? `已将帖子ID:${row.id}设为推荐`
          : `已取消帖子ID:${row.id}的推荐状态`
      );

      // 更新本地状态
      row.isRecommended = isRecommended;
    } else {
      // 操作失败，恢复原状态
      row.isRecommended = !isRecommended;
      ElMessage.error(res.message || res.msg || '操作失败');
    }
  } catch (error) {
    console.error('设置/取消推荐帖子错误:', error);
    // 操作失败，恢复原状态
    row.isRecommended = !isRecommended;
    ElMessage.error(error.message || '操作失败，请稍后再试');
  } finally {
    row.recommendLoading = false;
  }
};
</script>

<style scoped>
.posts-list-container {
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
  gap: 10px;
}

.search-input {
  width: 280px;
}

.status-filter {
  width: 140px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style> 