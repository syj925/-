<template>
  <el-card class="chart-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>{{ title }}</span>
        <slot name="header-action"></slot>
      </div>
    </template>
    <div class="chart-container">
      <div ref="chartRef" class="chart"></div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, defineProps, defineExpose } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  title: {
    type: String,
    default: '图表'
  },
  options: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const chartRef = ref(null);
let chartInstance = null;

const initChart = () => {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value);
  if (props.loading) {
    chartInstance.showLoading();
  }
  if (props.options && Object.keys(props.options).length > 0) {
    chartInstance.setOption(props.options);
  }
};

const resize = () => {
  chartInstance?.resize();
};

watch(() => props.options, (newOptions) => {
  if (chartInstance && newOptions) {
    chartInstance.setOption(newOptions);
  }
}, { deep: true });

watch(() => props.loading, (newLoading) => {
  if (!chartInstance) return;
  if (newLoading) {
    chartInstance.showLoading();
  } else {
    chartInstance.hideLoading();
  }
});

onMounted(() => {
  initChart();
  window.addEventListener('resize', resize);
});

onUnmounted(() => {
  window.removeEventListener('resize', resize);
  chartInstance?.dispose();
});

defineExpose({
  resize,
  getInstance: () => chartInstance
});
</script>

<style scoped>
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
</style>
