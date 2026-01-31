<template>
  <div class="statistics-container">
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <h3>用户增长趋势</h3>
          <el-radio-group v-model="userTimeRange" size="small">
            <el-radio-button value="week">本周</el-radio-button>
            <el-radio-button value="month">本月</el-radio-button>
            <el-radio-button value="year">全年</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div class="chart-container">
        <div ref="userChartRef" class="chart"></div>
      </div>
    </el-card>
    
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <h3>内容发布统计</h3>
            </div>
          </template>
          <div class="chart-container">
            <div ref="contentChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <h3>活跃度分析</h3>
            </div>
          </template>
          <div class="chart-container">
            <div ref="activityChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>热门帖子Top5</h3>
        </div>
      </template>
      <el-table :data="hotPosts" style="width: 100%">
        <el-table-column prop="content" label="内容" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.content ? row.content.substring(0, 30) + '...' : '' }}
          </template>
        </el-table-column>
        <el-table-column label="作者" width="120">
          <template #default="{ row }">
            {{ row.user ? (row.user.nickname || row.user.username) : '未知' }}
          </template>
        </el-table-column>
        <el-table-column prop="views" label="浏览量" width="100">
          <template #default>0</template> 
        </el-table-column>
        <el-table-column prop="comment_count" label="评论数" width="100">
          <template #default>0</template>
        </el-table-column>
        <el-table-column prop="likes" label="点赞数" width="100" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import api from '@/utils/api';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 注册必须的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  BarChart,
  LineChart,
  PieChart,
  CanvasRenderer
]);

const userTimeRange = ref('week'); // 'week' -> 7 days, 'month' -> 30 days
const userChartRef = ref(null);
const contentChartRef = ref(null);
const activityChartRef = ref(null);

// 热门帖子数据
const hotPosts = ref([]);

let userChart = null;
let contentChart = null;
let activityChart = null;

const fetchData = async () => {
  try {
    // 1. 获取统计图表数据
    const days = userTimeRange.value === 'month' ? 30 : (userTimeRange.value === 'year' ? 365 : 7);
    const statsRes = await api.statistics.getAll({ days });
    
    if (statsRes.success) {
      updateUserChart(statsRes.data.growth);
      updateContentChart(statsRes.data.contentDist);
      updateActivityChart(statsRes.data.activity);
    }

    // 2. 获取热门帖子 (复用 Dashboard API)
    const dashboardRes = await api.dashboard.getData();
    if (dashboardRes.success) {
      hotPosts.value = dashboardRes.data.hotPosts || [];
    }
  } catch (error) {
    console.error('获取统计数据失败:', error);
    ElMessage.error('获取统计数据失败');
  }
};

const updateUserChart = (data) => {
  if (!userChart) return;
  
  userChart.setOption({
    title: { text: '增长趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增用户', '新增帖子'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: data.dates
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '新增用户',
        type: 'line',
        data: data.users,
        smooth: true,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '新增帖子',
        type: 'line',
        data: data.posts,
        smooth: true,
        itemStyle: { color: '#67C23A' }
      }
    ]
  });
};

const updateContentChart = (data) => {
  if (!contentChart) return;
  
  contentChart.setOption({
    title: { text: '内容分类分布', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '话题',
        type: 'pie',
        radius: '50%',
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  });
};

const updateActivityChart = (data) => {
  if (!activityChart) return;
  
  activityChart.setOption({
    title: { text: '活跃时段分析 (24小时)', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['发帖', '评论'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: data.hours
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '发帖',
        type: 'bar',
        data: data.posts,
        itemStyle: { color: '#E6A23C' }
      },
      {
        name: '评论',
        type: 'bar',
        data: data.comments,
        itemStyle: { color: '#F56C6C' }
      }
    ]
  });
};

onMounted(() => {
  userChart = echarts.init(userChartRef.value);
  contentChart = echarts.init(contentChartRef.value);
  activityChart = echarts.init(activityChartRef.value);
  
  fetchData();
  
  window.addEventListener('resize', () => {
    userChart?.resize();
    contentChart?.resize();
    activityChart?.resize();
  });
});

watch(userTimeRange, () => {
  fetchData();
});
</script>

<style scoped>
.statistics-container {
  padding: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-row {
  margin-bottom: 20px;
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

.chart-container {
  display: flex;
  justify-content: center;
}

.chart {
  height: 300px;
  width: 100%;
}
</style> 