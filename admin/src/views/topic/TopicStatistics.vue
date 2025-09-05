<template>
  <div class="topic-statistics-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>话题数据统计</h3>
          <el-radio-group v-model="periodType" size="small" @change="fetchData">
            <el-radio-button value="day">今日</el-radio-button>
            <el-radio-button value="week">本周</el-radio-button>
            <el-radio-button value="month">本月</el-radio-button>
            <el-radio-button value="year">本年</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      
      <!-- 统计概览 -->
      <div class="statistics-overview" v-loading="loading">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-item">
                <div class="stat-icon blue">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-title">话题总数</div>
                  <div class="stat-value">{{ stats.totalTopics }}</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-item">
                <div class="stat-icon green">
                  <el-icon><Check /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-title">活跃话题</div>
                  <div class="stat-value">{{ stats.activeTopics }}</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-item">
                <div class="stat-icon orange">
                  <el-icon><Hide /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-title">隐藏话题</div>
                  <div class="stat-value">{{ stats.hiddenTopics }}</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-item">
                <div class="stat-icon red">
                  <el-icon><DeleteFilled /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-title">已删除</div>
                  <div class="stat-value">{{ stats.deletedTopics }}</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-item">
                <div class="stat-icon purple">
                  <el-icon><Plus /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-title">新增话题</div>
                  <div class="stat-value">{{ stats.newTopics }}</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 热门话题排行 -->
      <div class="topic-ranking" v-loading="loading">
        <h3>热门话题排行</h3>
        <el-table :data="stats.topUsedTopics" style="width: 100%">
          <el-table-column prop="name" label="话题名称" />
          <el-table-column prop="usageCount" label="使用次数" sortable />
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getTagType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" type="primary" @click="goToDetail(scope.row.id)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 最新创建话题 -->
      <div class="recent-topics" v-loading="loading">
        <h3>最近创建话题</h3>
        <el-table :data="stats.recentTopics" style="width: 100%">
          <el-table-column prop="name" label="话题名称" />
          <el-table-column prop="createdAt" label="创建时间" sortable />
          <el-table-column prop="usageCount" label="使用次数" sortable />
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getTagType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" type="primary" @click="goToDetail(scope.row.id)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Document, Check, Hide, DeleteFilled, Plus } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import api from '../../utils/api';

const router = useRouter();
const loading = ref(false);
const periodType = ref('week');

// 统计数据
const stats = reactive({
  totalTopics: 0,
  activeTopics: 0,
  hiddenTopics: 0,
  deletedTopics: 0,
  newTopics: 0,
  topUsedTopics: [],
  recentTopics: []
});

// 获取话题统计数据
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.topics.getStatistics({ period: periodType.value });
    
    if (res && res.data) {
      stats.totalTopics = res.data.totalTopics || 0;
      stats.activeTopics = res.data.activeTopics || 0;
      stats.hiddenTopics = res.data.hiddenTopics || 0;
      stats.deletedTopics = res.data.deletedTopics || 0;
      stats.newTopics = res.data.newTopics || 0;
      stats.topUsedTopics = res.data.topUsedTopics || [];
      stats.recentTopics = res.data.recentTopics || [];
    }
  } catch (error) {
    console.error('获取话题统计数据失败:', error);
    ElMessage.error('获取话题统计数据失败');
  } finally {
    loading.value = false;
  }
};

// 状态标签类型
const getTagType = (status) => {
  const map = {
    'active': 'success',
    'hidden': 'info',
    'deleted': 'danger'
  };
  return map[status] || 'info';
};

// 状态文本
const getStatusText = (status) => {
  const map = {
    'active': '正常',
    'hidden': '已隐藏',
    'deleted': '已删除'
  };
  return map[status] || status;
};

// 跳转到话题详情页
const goToDetail = (id) => {
  router.push({ path: '/topic/list', query: { id } });
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.topic-statistics-container {
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

.statistics-overview {
  margin-bottom: 30px;
}

.stat-card {
  height: 100px;
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 16px;
  color: white;
}

.stat-icon.blue {
  background-color: #409EFF;
}

.stat-icon.green {
  background-color: #67C23A;
}

.stat-icon.orange {
  background-color: #E6A23C;
}

.stat-icon.red {
  background-color: #F56C6C;
}

.stat-icon.purple {
  background-color: #8e44ad;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 26px;
  font-weight: bold;
  color: #303133;
}

.topic-ranking,
.recent-topics {
  margin-top: 30px;
}

.topic-ranking h3,
.recent-topics h3 {
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: bold;
}
</style> 