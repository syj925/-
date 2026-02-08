<template>
  <el-card class="data-card" shadow="hover" :body-style="{ padding: '20px' }">
    <div class="card-content">
      <div class="card-icon" :style="{ backgroundColor: color }">
        <el-icon><component :is="icon" /></el-icon>
      </div>
      <div class="card-info">
        <div class="card-title">{{ title }}</div>
        <div class="card-value">{{ value }}</div>
        <div class="card-today" v-if="today">今日 {{ today }}</div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  title: String,
  value: [String, Number],
  today: [String, Number],
  icon: Object,
  color: {
    type: String,
    default: '#409EFF'
  }
});
</script>

<style scoped>
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
</style>
