<template>
  <div class="not-found-container">
    <div class="error-content">
      <el-icon class="error-icon" :size="100"><WarningFilled /></el-icon>
      <h1>404</h1>
      <h2>页面未找到</h2>
      <p>您访问的页面不存在或已被删除</p>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { WarningFilled } from '@element-plus/icons-vue';
</script>

<style scoped>
.not-found-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.error-content {
  max-width: 500px;
}

.error-icon {
  color: #F56C6C;
  margin-bottom: 20px;
}

h1 {
  font-size: 72px;
  margin: 0;
  color: #606266;
}

h2 {
  margin: 10px 0;
  color: #606266;
  font-size: 28px;
}

p {
  color: #909399;
  margin-bottom: 30px;
}
</style> 