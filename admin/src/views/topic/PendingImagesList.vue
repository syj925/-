<template>
  <div class="pending-images-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <h3>话题图片审核</h3>
          <div class="header-right">
            <el-button 
              type="primary" 
              icon="el-icon-refresh" 
              size="small" 
              @click="loadPendingImages">
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 图片列表 -->
      <el-row :gutter="20" v-loading="loading">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="(item, index) in pendingImages" :key="index" class="image-item-col">
          <el-card class="image-card" shadow="hover">
            <div class="image-header">
              <h4 class="topic-name">{{ item.name }}</h4>
              <span class="topic-date">{{ formatDate(item.updatedAt) }}</span>
            </div>
            <div class="image-preview">
              <div class="image-compare">
                <div class="image-wrapper">
                  <h5>待审核</h5>
                  <el-image 
                    :src="item.pendingImage" 
                    fit="cover"
                    :preview-src-list="[item.pendingImage]">
                  </el-image>
                </div>
                <div class="image-wrapper" v-if="item.coverImage">
                  <h5>当前</h5>
                  <el-image 
                    :src="item.coverImage" 
                    fit="cover"
                    :preview-src-list="[item.coverImage]">
                  </el-image>
                </div>
                <div class="image-placeholder" v-else>
                  <span>无当前图片</span>
                </div>
              </div>
            </div>
            <div class="topic-description">
              {{ item.description || '无描述' }}
            </div>
            <div class="image-actions">
              <el-button 
                type="success" 
                size="small" 
                :loading="item.approveLoading" 
                @click="reviewImage(item, 'approve')">
                通过
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                :loading="item.rejectLoading" 
                @click="reviewImage(item, 'reject')">
                拒绝
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 分页器 -->
      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          background
          :current-page.sync="queryParams.page"
          :page-sizes="[12, 24, 36, 48]"
          :page-size.sync="queryParams.limit"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange">
        </el-pagination>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-if="!loading && pendingImages.length === 0">
        <el-empty description="暂无待审核图片"></el-empty>
      </div>
    </el-card>
  </div>
</template>

<script>
import api from '@/utils/api';
import { formatDate } from '@/utils/format';

export default {
  name: 'PendingImagesList',
  
  data() {
    return {
      loading: false,
      pendingImages: [],
      total: 0,
      queryParams: {
        page: 1,
        limit: 12
      }
    };
  },
  
  created() {
    this.loadPendingImages();
  },
  
  methods: {
    formatDate,
    
    // 加载待审核图片列表
    loadPendingImages() {
      this.loading = true;
      api.topics.getPendingTopicImages(this.queryParams)
        .then(res => {
          if (res.success) {
            this.pendingImages = res.data.topics.map(topic => ({
              ...topic,
              approveLoading: false,
              rejectLoading: false
            }));
            this.total = res.data.pagination.total;
          } else {
            this.$message.error(res.message || '获取数据失败');
          }
        })
        .catch(err => {
          console.error('获取待审核图片失败:', err);
          this.$message.error('获取数据失败，请重试');
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    // 审核图片
    reviewImage(topic, action) {
      // 设置加载状态
      if (action === 'approve') {
        topic.approveLoading = true;
      } else {
        topic.rejectLoading = true;
      }
      
      api.topics.reviewTopicImage(topic.id, { action })
        .then(res => {
          if (res.success) {
            this.$message.success(action === 'approve' ? '已通过图片审核' : '已拒绝图片');
            // 移除已审核的项
            this.pendingImages = this.pendingImages.filter(item => item.id !== topic.id);
            // 如果当前列表为空且不是第一页，则返回上一页
            if (this.pendingImages.length === 0 && this.queryParams.page > 1) {
              this.queryParams.page--;
              this.loadPendingImages();
            }
          } else {
            this.$message.error(res.message || '操作失败');
          }
        })
        .catch(err => {
          console.error('审核话题图片失败:', err);
          this.$message.error('操作失败，请重试');
        })
        .finally(() => {
          // 重置加载状态
          if (action === 'approve') {
            topic.approveLoading = false;
          } else {
            topic.rejectLoading = false;
          }
        });
    },
    
    // 处理每页数量变化
    handleSizeChange() {
      this.loadPendingImages();
    },
    
    // 处理页码变化
    handleCurrentChange() {
      this.loadPendingImages();
    }
  }
};
</script>

<style scoped>
.pending-images-container {
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

.image-item-col {
  margin-bottom: 20px;
}

.image-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.image-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.topic-name {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topic-date {
  font-size: 12px;
  color: #909399;
}

.image-preview {
  margin-bottom: 10px;
}

.image-compare {
  display: flex;
  gap: 10px;
}

.image-wrapper {
  flex: 1;
  overflow: hidden;
}

.image-wrapper h5 {
  margin: 0 0 5px;
  font-size: 13px;
  color: #606266;
}

.el-image {
  width: 100%;
  height: 120px;
  border-radius: 4px;
}

.image-placeholder {
  flex: 1;
  height: 120px;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 13px;
  border-radius: 4px;
}

.topic-description {
  margin: 10px 0;
  font-size: 13px;
  color: #606266;
  flex-grow: 1;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.image-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}

.empty-state {
  padding: 40px 0;
}
</style> 