<template>
  <div class="statistics-container">
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <h3>用户增长趋势</h3>
          <el-radio-group v-model="userTimeRange" size="small">
            <el-radio-button label="week">本周</el-radio-button>
            <el-radio-button label="month">本月</el-radio-button>
            <el-radio-button label="year">全年</el-radio-button>
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
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="views" label="浏览量" width="100" />
        <el-table-column prop="comments" label="评论数" width="100" />
        <el-table-column prop="likes" label="点赞数" width="100" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
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

const userTimeRange = ref('month');
const userChartRef = ref(null);
const contentChartRef = ref(null);
const activityChartRef = ref(null);

// 模拟热门帖子数据
const hotPosts = ref([
  {
    title: '期末复习资料分享',
    author: '李四',
    views: 1267,
    comments: 45,
    likes: 189
  },
  {
    title: '校园文化节活动招募',
    author: '张三',
    views: 982,
    comments: 32,
    likes: 142
  },
  {
    title: '学生会换届选举公告',
    author: '王五',
    views: 876,
    comments: 28,
    likes: 112
  },
  {
    title: '校园歌手大赛初赛结果公布',
    author: '赵同学',
    views: 754,
    comments: 25,
    likes: 98
  },
  {
    title: '关于学校新图书馆开放时间的通知',
    author: '李同学',
    views: 632,
    comments: 15,
    likes: 67
  }
]);

onMounted(() => {
  // 初始化用户增长图表
  const userChart = echarts.init(userChartRef.value);
  userChart.setOption({
    title: {
      text: '用户增长趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新增用户',
        type: 'line',
        data: [120, 132, 101, 134, 90, 230, 210],
        smooth: true
      },
      {
        name: '活跃用户',
        type: 'line',
        data: [220, 182, 191, 234, 290, 330, 310],
        smooth: true
      }
    ]
  });
  
  // 初始化内容发布统计图表
  const contentChart = echarts.init(contentChartRef.value);
  contentChart.setOption({
    title: {
      text: '内容分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '内容类型',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 1048, name: '校园动态' },
          { value: 735, name: '学习资料' },
          { value: 580, name: '社团活动' },
          { value: 484, name: '失物招领' },
          { value: 300, name: '其他' }
        ],
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
  
  // 初始化活跃度分析图表
  const activityChart = echarts.init(activityChartRef.value);
  activityChart.setOption({
    title: {
      text: '一周活跃度',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '活跃度',
        type: 'bar',
        data: [10, 52, 200, 334, 390, 330, 220]
      }
    ]
  });
  
  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    userChart.resize();
    contentChart.resize();
    activityChart.resize();
  });
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