<template>
  <div class="content-audit-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>内容审核</h3>
          <el-radio-group v-model="auditType" size="small" @change="handleTypeChange">
            <el-radio-button value="posts">帖子</el-radio-button>
            <el-radio-button value="comments">评论</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      
      <!-- 帖子审核表格 -->
      <el-table v-if="auditType === 'posts'" :data="postsAuditList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="content" label="内容" show-overflow-tooltip />
        <el-table-column label="作者" width="120">
          <template #default="scope">
            {{ scope.row.author ? scope.row.author.nickname || scope.row.author.username : (scope.row.user ? scope.row.user.nickname || scope.row.user.username : '未知') }}
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="handleApprove(scope.row, 'post')"
              :loading="scope.row.approveLoading"
            >
              通过
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleReject(scope.row, 'post')"
              :loading="scope.row.rejectLoading"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 评论审核表格 -->
      <el-table v-else :data="commentsAuditList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="content" label="评论内容" show-overflow-tooltip />
        <el-table-column label="所属帖子" width="180" show-overflow-tooltip>
          <template #default="scope">
            <span v-if="scope.row.post">{{ scope.row.post.content }}</span>
            <span v-else>未知帖子</span>
          </template>
        </el-table-column>
        <el-table-column label="评论者" width="120">
          <template #default="scope">
            {{ scope.row.user ? scope.row.user.nickname || scope.row.user.username : '未知' }}
          </template>
        </el-table-column>
        <el-table-column label="评论时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="handleApprove(scope.row, 'comment')"
              :loading="scope.row.approveLoading"
            >
              通过
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleReject(scope.row, 'comment')"
              :loading="scope.row.rejectLoading"
            >
              拒绝
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
      <el-empty
        v-if="(auditType === 'posts' ? postsAuditList.length === 0 : commentsAuditList.length === 0) && !loading"
        :description="`没有待审核的${auditType === 'posts' ? '帖子' : '评论'}`"
      />
    </el-card>

    <!-- 查看内容详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      :title="`${auditType === 'posts' ? '帖子' : '评论'}详情`"
      width="60%"
      :before-close="() => viewDialogVisible = false"
    >
      <div v-if="currentViewItem" class="content-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="`${auditType === 'posts' ? '帖子' : '评论'}ID`">
            {{ currentViewItem.id }}
          </el-descriptions-item>
          <el-descriptions-item label="作者">
            {{ currentViewItem.author ? currentViewItem.author.nickname || currentViewItem.author.username : '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="发布时间">
            {{ formatDate(currentViewItem.createdAt || currentViewItem.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag type="warning">待审核</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="auditType === 'posts'" label="浏览量">
            {{ currentViewItem.viewCount || 0 }}
          </el-descriptions-item>
          <el-descriptions-item v-if="auditType === 'posts'" label="点赞数">
            {{ currentViewItem.likeCount || 0 }}
          </el-descriptions-item>
          <el-descriptions-item v-if="auditType === 'comments'" label="所属帖子">
            {{ currentViewItem.postId || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="auditType === 'comments'" label="回复对象">
            {{ currentViewItem.parentId ? `评论ID: ${currentViewItem.parentId}` : '直接评论' }}
          </el-descriptions-item>
          <el-descriptions-item label="内容" :span="2">
            <div class="content-text">
              {{ currentViewItem.content }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item v-if="auditType === 'posts' && currentViewItem.images && currentViewItem.images.length > 0" label="图片" :span="2">
            <div class="content-images">
              <el-image
                v-for="(image, index) in currentViewItem.images"
                :key="index"
                :src="image.startsWith('http') ? image : `http://localhost:3000${image}`"
                :preview-src-list="currentViewItem.images.map(img => img.startsWith('http') ? img : `http://localhost:3000${img}`)"
                :initial-index="index"
                fit="cover"
                style="width: 100px; height: 100px; margin-right: 10px; margin-bottom: 10px;"
              />
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewDialogVisible = false">关闭</el-button>
          <el-button
            type="success"
            @click="handleApprove(currentViewItem, auditType === 'posts' ? 'post' : 'comment')"
          >
            通过审核
          </el-button>
          <el-button
            type="danger"
            @click="handleReject(currentViewItem, auditType === 'posts' ? 'post' : 'comment')"
          >
            拒绝审核
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/utils/api';

// 审核类型：帖子或评论
const auditType = ref('posts');

// 加载状态
const loading = ref(false);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 待审核列表数据
const postsAuditList = ref([]);
const commentsAuditList = ref([]);

// 初始化
onMounted(() => {
  fetchPendingContent();
});

// 处理类型变化
const handleTypeChange = () => {
  currentPage.value = 1;
  fetchPendingContent();
};

// 获取待审核内容
const fetchPendingContent = async () => {
  loading.value = true;
  
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    };
    
    let res;
    
    if (auditType.value === 'posts') {
      res = await api.posts.getPendingPosts(params);
      
      if (res.success) {
        postsAuditList.value = res.data.posts.map(post => ({
          ...post,
          approveLoading: false,
          rejectLoading: false
        }));
        total.value = res.data.pagination.total;
      } else {
        ElMessage.error(res.message || '获取待审核帖子失败');
      }
    } else {
      res = await api.comments.getPendingComments(params);
      
      if (res.success) {
        commentsAuditList.value = res.data.comments.map(comment => ({
          ...comment,
          approveLoading: false,
          rejectLoading: false
        }));
        total.value = res.data.pagination.total;
      } else {
        ElMessage.error(res.message || '获取待审核评论失败');
      }
    }
  } catch (error) {
    console.error(`获取待审核${auditType.value === 'posts' ? '帖子' : '评论'}错误:`, error);
    ElMessage.error(error.message || `获取待审核${auditType.value === 'posts' ? '帖子' : '评论'}失败，请稍后再试`);
  } finally {
    loading.value = false;
  }
};

// 分页处理函数
const handleSizeChange = (size) => {
  pageSize.value = size;
  fetchPendingContent();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  fetchPendingContent();
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleString();
};

// 查看内容详情对话框相关
const viewDialogVisible = ref(false);
const currentViewItem = ref(null);

// 查看内容
const handleView = (row) => {
  currentViewItem.value = row;
  viewDialogVisible.value = true;
};

// 通过审核
const handleApprove = async (row, type) => {
  // 根据类型确定操作
  const confirmMessage = `确定要通过该${type === 'post' ? '帖子' : '评论'}吗？`;
  
  ElMessageBox.confirm(
    confirmMessage,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(async () => {
    // 设置loading状态
    row.approveLoading = true;
    
    try {
      let res;
      
      if (type === 'post') {
        res = await api.posts.auditPost(row.id, 'approve');
      } else {
        res = await api.comments.auditComment(row.id, 'approve');
      }
      
      if (res.success) {
        ElMessage.success(`已通过${type === 'post' ? '帖子' : '评论'}审核`);
        fetchPendingContent(); // 刷新列表
      } else {
        ElMessage.error(res.message || '操作失败');
      }
    } catch (error) {
      console.error(`审核${type === 'post' ? '帖子' : '评论'}错误:`, error);
      ElMessage.error(error.message || '操作失败，请稍后再试');
    } finally {
      row.approveLoading = false;
    }
  }).catch(() => {
    // 用户取消操作
  });
};

// 拒绝审核
const handleReject = async (row, type) => {
  // 根据类型确定操作
  const confirmMessage = `确定要拒绝该${type === 'post' ? '帖子' : '评论'}吗？`;
  
  ElMessageBox.confirm(
    confirmMessage,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    // 设置loading状态
    row.rejectLoading = true;
    
    try {
      let res;
      
      if (type === 'post') {
        res = await api.posts.auditPost(row.id, 'reject');
      } else {
        res = await api.comments.auditComment(row.id, 'reject');
      }
      
      if (res.success) {
        ElMessage.warning(`已拒绝${type === 'post' ? '帖子' : '评论'}审核`);
        fetchPendingContent(); // 刷新列表
      } else {
        ElMessage.error(res.message || '操作失败');
      }
    } catch (error) {
      console.error(`审核${type === 'post' ? '帖子' : '评论'}错误:`, error);
      ElMessage.error(error.message || '操作失败，请稍后再试');
    } finally {
      row.rejectLoading = false;
    }
  }).catch(() => {
    // 用户取消操作
  });
};
</script>

<style scoped>
.content-audit-container {
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

.content-detail .content-text {
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

.content-detail .content-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style> 