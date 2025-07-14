<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <!-- 数据卡片 -->
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6" v-for="card in dataCards" :key="card.title">
        <el-card class="data-card" shadow="hover" :body-style="{ padding: '20px' }">
          <div class="card-content">
            <div class="card-icon" :style="{ backgroundColor: card.color }">
              <el-icon><component :is="card.icon" /></el-icon>
        </div>
            <div class="card-info">
              <div class="card-title">{{ card.title }}</div>
              <div class="card-value">{{ card.value }}</div>
              <div class="card-today">今日 +{{ card.today }}</div>
        </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <!-- 数据趋势图 -->
      <el-col :span="16">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>数据趋势</span>
              <el-radio-group v-model="chartPeriod" size="small">
                <el-radio-button label="day">日</el-radio-button>
                <el-radio-button label="week">周</el-radio-button>
                <el-radio-button label="month">月</el-radio-button>
              </el-radio-group>
        </div>
          </template>
          <div class="chart-container">
            <div ref="mainChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 人员分布饼图 -->
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>用户分布</span>
        </div>
          </template>
          <div class="chart-container">
            <div ref="pieChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="table-row">
      <!-- 活跃用户列表 -->
      <el-col :span="12">
        <el-card class="table-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>活跃用户排行</span>
              <el-button link @click="refreshActiveUsers">刷新</el-button>
        </div>
          </template>
          <el-table :data="activeUsers" style="width: 100%" v-loading="loading.users">
            <el-table-column label="用户信息" min-width="200">
              <template #default="{ row }">
                <div class="user-info">
                  <el-avatar :size="40" :src="row.avatar"></el-avatar>
                  <div class="user-detail">
                    <div class="user-name">{{ row.nickname || row.username }}</div>
                    <div class="user-id">ID: {{ row.id }}</div>
          </div>
        </div>
              </template>
            </el-table-column>
            <el-table-column prop="posts" label="发帖数" width="80"></el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button link size="small" @click="viewUserDetail(row.id)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 热门帖子列表 -->
      <el-col :span="12">
        <el-card class="table-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>热门帖子</span>
              <el-button link @click="refreshHotPosts">刷新</el-button>
            </div>
          </template>
          <el-table :data="hotPosts" style="width: 100%" v-loading="loading.posts">
            <el-table-column label="内容" min-width="200">
              <template #default="{ row }">
                <div class="post-content">{{ truncateText(row.content, 50) }}</div>
                <div class="post-info">
                  <span>by {{ row.user ? (row.user.nickname || row.user.username) : '未知用户' }}</span>
                  <span>{{ formatDate(row.createdAt) }}</span>
          </div>
              </template>
            </el-table-column>
            <el-table-column prop="likes" label="点赞数" width="80"></el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button link size="small" @click="viewPostDetail(row.id)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import * as echarts from 'echarts';
import { useRouter } from 'vue-router';
import api from '@/utils/api';
import { ElMessage } from 'element-plus';
import { User, Document, ChatDotRound, Collection } from '@element-plus/icons-vue';

export default {
  name: 'Dashboard',
  components: {
    User, Document, ChatDotRound, Collection
  },
  setup() {
    const router = useRouter();
    const mainChart = ref(null);
    const pieChart = ref(null);
    let mainChartInstance = null;
    let pieChartInstance = null;

    // 仪表盘数据
    const dashboardData = reactive({
      userCount: 0,
      postCount: 0,
      commentCount: 0,
      topicCount: 0,
      newUserCount: 0,
      newPostCount: 0,
      newCommentCount: 0,
      newTopicCount: 0,
      activeUsers: [],
      hotPosts: []
    });

    // 加载状态
    const loading = reactive({
      dashboard: true,
      users: false,
      posts: false
    });

    // 图表时间周期
    const chartPeriod = ref('week');

    // 计算属性：数据卡片
    const dataCards = computed(() => [
      {
        title: '用户总数',
        value: dashboardData.userCount.toLocaleString(),
        today: dashboardData.newUserCount,
        icon: User,
        color: '#409EFF'
      },
      {
        title: '帖子总数',
        value: dashboardData.postCount.toLocaleString(),
        today: dashboardData.newPostCount,
        icon: Document,
        color: '#67C23A'
      },
      {
        title: '评论总数',
        value: dashboardData.commentCount.toLocaleString(),
        today: dashboardData.newCommentCount,
        icon: ChatDotRound,
        color: '#E6A23C'
      },
      {
        title: '话题数量',
        value: dashboardData.topicCount.toLocaleString(),
        today: dashboardData.newTopicCount,
        icon: Collection,
        color: '#F56C6C'
      }
    ]);

    // 获取活跃用户数据
    const activeUsers = computed(() => dashboardData.activeUsers);
    
    // 获取热门帖子数据
    const hotPosts = computed(() => dashboardData.hotPosts);

    // 初始化数据
    const initData = async () => {
      loading.dashboard = true;
      try {
        const res = await api.dashboard.getData();
        if (res.success) {
          Object.assign(dashboardData, res.data);
          return res.data; // 返回数据以便后续操作
        } else {
          ElMessage.error(res.message || '获取仪表盘数据失败');
          return null;
        }
      } catch (error) {
        console.error('获取仪表盘数据错误:', error);
        ElMessage.error(error.message || '获取仪表盘数据失败，请稍后再试');
        return null;
      } finally {
        loading.dashboard = false;
      }
    };
    
    // 获取趋势数据
    const getTrendData = async (period = 'week') => {
      try {
        // 尝试调用真实API端点
        try {
          const res = await api.dashboard.getTrendData(period);
          if (res.success) {
            return res.data;
          }
        } catch (error) {
          console.warn('趋势数据API未实现，使用模拟数据', error);
        }
        
        // 如果API未实现，返回模拟数据
        return {
          users: [10, 15, 12, 18, 25, 20, 30],
          posts: [22, 18, 30, 45, 40, 35, 50],
          comments: [35, 42, 60, 70, 55, 75, 90]
        };
      } catch (error) {
        console.error('获取趋势数据错误:', error);
        return null;
      }
    };

    // 刷新活跃用户数据
    const refreshActiveUsers = async () => {
      loading.users = true;
      try {
        const res = await api.dashboard.getData();
        if (res.success) {
          dashboardData.activeUsers = res.data.activeUsers;
        } else {
          ElMessage.error(res.message || '刷新活跃用户数据失败');
        }
      } catch (error) {
        ElMessage.error(error.message || '刷新活跃用户数据失败，请稍后再试');
      } finally {
        loading.users = false;
      }
    };

    // 刷新热门帖子数据
    const refreshHotPosts = async () => {
      loading.posts = true;
      try {
        const res = await api.dashboard.getData();
        if (res.success) {
          dashboardData.hotPosts = res.data.hotPosts;
        } else {
          ElMessage.error(res.message || '刷新热门帖子数据失败');
        }
      } catch (error) {
        ElMessage.error(error.message || '刷新热门帖子数据失败，请稍后再试');
      } finally {
        loading.posts = false;
      }
    };

    // 查看用户详情
    const viewUserDetail = (id) => {
      router.push(`/user/detail/${id}`);
    };

    // 查看帖子详情
    const viewPostDetail = (id) => {
      router.push(`/content/post/${id}`);
    };

    // 初始化趋势图
    const initMainChart = async () => {
      if (!mainChart.value) return;
      
      // 显示加载状态
      mainChartInstance = mainChartInstance || echarts.init(mainChart.value);
      mainChartInstance.showLoading();
      
      // 根据周期设置不同的日期数据
      const dateLabels = {
        day: ['0点', '3点', '6点', '9点', '12点', '15点', '18点', '21点'],
        week: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        month: ['1日', '5日', '10日', '15日', '20日', '25日', '30日']
      };
      
      // 获取趋势数据
      const trendData = await getTrendData(chartPeriod.value);
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['用户', '帖子', '评论']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dateLabels[chartPeriod.value]
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '用户',
            type: 'line',
            stack: 'Total',
            data: trendData ? trendData.users : [],
            areaStyle: {
              opacity: 0.1
            },
            smooth: true
          },
          {
            name: '帖子',
            type: 'line',
            stack: 'Total',
            data: trendData ? trendData.posts : [],
            areaStyle: {
              opacity: 0.1
            },
            smooth: true
          },
          {
            name: '评论',
            type: 'line',
            stack: 'Total',
            data: trendData ? trendData.comments : [],
            areaStyle: {
              opacity: 0.1
            },
            smooth: true
          }
        ]
      };
      
      // 隐藏加载状态并设置选项
      mainChartInstance.hideLoading();
      mainChartInstance.setOption(option);
    };

    // 初始化饼图
    const initPieChart = async () => {
      if (!pieChart.value) return;
      
      pieChartInstance = pieChartInstance || echarts.init(pieChart.value);
      pieChartInstance.showLoading();
      
      // 获取用户分布数据
      let userData = null;
      
      try {
        // 尝试调用真实API端点
        try {
          const res = await api.dashboard.getUserDistribution();
          if (res.success) {
            userData = res.data;
          }
        } catch (error) {
          console.warn('用户分布API未实现，使用模拟数据', error);
        }
        
        // 如果API未实现，使用模拟数据
        if (!userData) {
          userData = [
            { value: dashboardData.userCount * 0.8 || 100, name: '学生' },
            { value: dashboardData.userCount * 0.15 || 30, name: '教师' },
            { value: dashboardData.userCount * 0.01 || 5, name: '管理员' },
            { value: dashboardData.userCount * 0.04 || 10, name: '其他' }
          ];
        }
        
        const option = {
          tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            data: userData.map(item => item.name)
          },
          series: [
            {
              name: '用户分布',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: false,
                position: 'center'
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: '20',
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: false
              },
              data: userData
            }
          ]
        };
        
        pieChartInstance.hideLoading();
        pieChartInstance.setOption(option);
      } catch (error) {
        console.error('初始化饼图错误:', error);
        pieChartInstance.hideLoading();
      }
    };

    // 监听图表容器大小变化
    const handleResize = () => {
      mainChartInstance?.resize();
      pieChartInstance?.resize();
    };

    // 截断文本
    const truncateText = (text, maxLength) => {
      if (!text) return '';
      return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    };

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };

    // 挂载时执行
    onMounted(async () => {
      try {
        await initData();
        // 确保数据加载后再初始化图表
        await Promise.all([initMainChart(), initPieChart()]);
      } catch (error) {
        console.error('初始化仪表盘错误:', error);
      }
      
      // 监听窗口大小变化
      window.addEventListener('resize', handleResize);
    });
    
    // 监听图表周期变化
    watch(chartPeriod, () => {
      initMainChart();
    });

    return {
      mainChart,
      pieChart,
      dataCards,
      activeUsers,
      hotPosts,
      loading,
      chartPeriod,
      refreshActiveUsers,
      refreshHotPosts,
      viewUserDetail,
      viewPostDetail,
      truncateText,
      formatDate
    };
  }
};
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

/* 数据卡片样式 */
.data-card {
  margin-bottom: 20px;
  overflow: hidden;
}

.card-content {
  display: flex;
  align-items: center;
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 16px;
}

.card-icon :deep(svg) {
  font-size: 24px;
  color: white;
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.card-today {
  font-size: 13px;
  color: #67C23A;
}

/* 图表卡片样式 */
.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
  padding: 10px 0;
}

.chart {
  width: 100%;
  height: 100%;
}

/* 表格卡片样式 */
.table-card {
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-detail {
  margin-left: 12px;
}

.user-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.user-id {
  font-size: 12px;
  color: #909399;
}

.post-content {
  font-weight: 500;
  margin-bottom: 8px;
}

.post-info {
  font-size: 12px;
  color: #909399;
  display: flex;
  justify-content: space-between;
}
</style> 