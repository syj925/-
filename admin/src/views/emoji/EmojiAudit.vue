<template>
  <div class="emoji-audit">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>表情审核</h2>
      <div class="header-stats">
        <el-tag type="warning" size="large">
          待审核: {{ pendingCount }}
        </el-tag>
      </div>
    </div>

    <!-- 筛选 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 审核列表 -->
    <el-card shadow="never">
      <el-table :data="emojiList" v-loading="loading" style="width: 100%">
        <el-table-column label="表情预览" width="100">
          <template #default="{ row }">
            <el-image 
              :src="getImageUrl(row.url)" 
              :preview-src-list="[getImageUrl(row.url)]"
              fit="contain"
              style="width: 60px; height: 60px;"
            />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'animated' ? 'warning' : 'info'" size="small">
              {{ row.type === 'animated' ? 'GIF' : '静态' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="文件信息" width="120">
          <template #default="{ row }">
            <div class="file-info">
              <span>{{ formatFileSize(row.fileSize) }}</span>
              <span v-if="row.width && row.height">{{ row.width }}x{{ row.height }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="上传者" width="180">
          <template #default="{ row }">
            <div class="uploader-info" v-if="row.uploader">
              <el-avatar :src="row.uploader.avatar" :size="32" />
              <div class="uploader-text">
                <span class="nickname">{{ row.uploader.nickname }}</span>
                <span class="username">@{{ row.uploader.username }}</span>
              </div>
            </div>
            <span v-else class="text-muted">未知用户</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="上传时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="success" link @click="handleApprove(row)">通过</el-button>
              <el-button type="danger" link @click="handleReject(row)">拒绝</el-button>
            </template>
            <template v-else>
              <el-button type="info" link @click="handleViewDetail(row)">查看详情</el-button>
            </template>
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

    <!-- 审核对话框 -->
    <el-dialog v-model="reviewDialogVisible" title="审核表情" width="500px">
      <div class="review-preview">
        <el-image 
          :src="getImageUrl(currentEmoji?.url)" 
          fit="contain"
          style="max-width: 200px; max-height: 200px;"
        />
        <div class="preview-info">
          <p><strong>名称:</strong> {{ currentEmoji?.name }}</p>
          <p><strong>上传者:</strong> {{ currentEmoji?.uploader?.nickname }}</p>
        </div>
      </div>

      <el-form 
        ref="reviewFormRef" 
        :model="reviewForm" 
        :rules="reviewRules" 
        label-width="100px"
        v-if="reviewAction === 'approve'"
      >
        <el-form-item label="分配表情包">
          <el-select v-model="reviewForm.packId" placeholder="选择表情包（可选）" clearable filterable>
            <el-option 
              v-for="pack in packList" 
              :key="pack.id" 
              :label="pack.name" 
              :value="pack.id" 
            />
          </el-select>
          <div class="form-tip">不选择则创建用户个人表情包</div>
        </el-form-item>
      </el-form>

      <el-form 
        ref="reviewFormRef" 
        :model="reviewForm" 
        :rules="rejectRules" 
        label-width="100px"
        v-else
      >
        <el-form-item label="拒绝原因" prop="rejectReason">
          <el-input 
            v-model="reviewForm.rejectReason" 
            type="textarea" 
            :rows="3"
            placeholder="请输入拒绝原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button 
          :type="reviewAction === 'approve' ? 'success' : 'danger'" 
          @click="submitReview"
          :loading="submitting"
        >
          {{ reviewAction === 'approve' ? '确认通过' : '确认拒绝' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="表情详情" width="500px">
      <el-descriptions :column="1" border v-if="currentEmoji">
        <el-descriptions-item label="表情预览">
          <el-image 
            :src="getImageUrl(currentEmoji.url)" 
            fit="contain"
            style="max-width: 100px; max-height: 100px;"
          />
        </el-descriptions-item>
        <el-descriptions-item label="名称">{{ currentEmoji.name }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          {{ currentEmoji.type === 'animated' ? 'GIF动图' : '静态图片' }}
        </el-descriptions-item>
        <el-descriptions-item label="文件大小">{{ formatFileSize(currentEmoji.fileSize) }}</el-descriptions-item>
        <el-descriptions-item label="尺寸" v-if="currentEmoji.width && currentEmoji.height">
          {{ currentEmoji.width }} x {{ currentEmoji.height }}
        </el-descriptions-item>
        <el-descriptions-item label="上传者">
          {{ currentEmoji.uploader?.nickname }} (@{{ currentEmoji.uploader?.username }})
        </el-descriptions-item>
        <el-descriptions-item label="上传时间">{{ formatTime(currentEmoji.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentEmoji.status)">
            {{ getStatusName(currentEmoji.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="拒绝原因" v-if="currentEmoji.status === 'rejected'">
          {{ currentEmoji.rejectReason || '无' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/utils/api';
import { API_BASE_URL } from '@/config';

// 状态
const loading = ref(false);
const emojiList = ref([]);
const packList = ref([]);
const reviewDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const submitting = ref(false);
const currentEmoji = ref(null);
const reviewAction = ref('approve');
const reviewFormRef = ref(null);

// 筛选
const filterForm = reactive({
  status: 'pending'
});

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
});

// 审核表单
const reviewForm = reactive({
  packId: '',
  rejectReason: ''
});

// 表单验证
const reviewRules = {};
const rejectRules = {
  rejectReason: [
    { required: true, message: '请输入拒绝原因', trigger: 'blur' }
  ]
};

// 待审核数量
const pendingCount = computed(() => {
  if (filterForm.status === 'pending') {
    return pagination.total;
  }
  return 0;
});

// 获取图片URL
const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 获取状态名称
const getStatusName = (status) => {
  const statusMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  };
  return statusMap[status] || status;
};

// 获取状态标签类型
const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  };
  return typeMap[status] || 'info';
};

// 获取数据
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit
    };
    if (filterForm.status) params.status = filterForm.status;

    const res = await api.emoji.getPendingEmojis(params);
    if (res.success || res.code === 0) {
      emojiList.value = res.data?.data || res.data || [];
      pagination.total = res.data?.total || 0;
    }
  } catch (error) {
    ElMessage.error('获取待审核列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 获取表情包列表
const fetchPacks = async () => {
  try {
    const res = await api.emoji.getPacks({ limit: 100, status: 'active' });
    if (res.success || res.code === 0) {
      packList.value = res.data?.data || res.data || [];
    }
  } catch (error) {
    console.error('获取表情包列表失败:', error);
  }
};

// 重置筛选
const resetFilter = () => {
  filterForm.status = 'pending';
  pagination.page = 1;
  fetchData();
};

// 审核通过
const handleApprove = (row) => {
  currentEmoji.value = row;
  reviewAction.value = 'approve';
  reviewForm.packId = '';
  reviewForm.rejectReason = '';
  reviewDialogVisible.value = true;
};

// 审核拒绝
const handleReject = (row) => {
  currentEmoji.value = row;
  reviewAction.value = 'reject';
  reviewForm.packId = '';
  reviewForm.rejectReason = '';
  reviewDialogVisible.value = true;
};

// 查看详情
const handleViewDetail = (row) => {
  currentEmoji.value = row;
  detailDialogVisible.value = true;
};

// 提交审核
const submitReview = async () => {
  if (reviewAction.value === 'reject') {
    try {
      await reviewFormRef.value.validate();
    } catch {
      return;
    }
  }

  submitting.value = true;
  try {
    const data = {
      approved: reviewAction.value === 'approve'
    };

    if (reviewAction.value === 'approve' && reviewForm.packId) {
      data.pack_id = reviewForm.packId;
    }

    if (reviewAction.value === 'reject') {
      data.reject_reason = reviewForm.rejectReason;
    }

    await api.emoji.reviewEmoji(currentEmoji.value.id, data);
    ElMessage.success(reviewAction.value === 'approve' ? '已通过审核' : '已拒绝');
    reviewDialogVisible.value = false;
    fetchData();
  } catch (error) {
    ElMessage.error('审核操作失败');
    console.error(error);
  } finally {
    submitting.value = false;
  }
};

// 初始化
onMounted(() => {
  fetchData();
  fetchPacks();
});
</script>

<style lang="scss" scoped>
.emoji-audit {
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

.file-info {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #666;
}

.uploader-info {
  display: flex;
  align-items: center;
  gap: 8px;

  .uploader-text {
    display: flex;
    flex-direction: column;

    .nickname {
      font-weight: 500;
    }

    .username {
      font-size: 12px;
      color: #999;
    }
  }
}

.text-muted {
  color: #999;
}

.review-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;

  .preview-info {
    margin-top: 16px;
    text-align: center;

    p {
      margin: 4px 0;
    }
  }
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
