<template>
  <div class="posts-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>帖子管理</h3>
        </div>
      </template>
      <el-table :data="postsList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="createTime" label="发布时间" width="180" />
        <el-table-column prop="views" label="浏览量" width="100" />
        <el-table-column prop="likes" label="点赞数" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" type="warning" @click="handleTopPost(scope.row)">置顶</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

// 模拟帖子数据
const postsList = ref([
  {
    id: 1,
    title: '校园文化节活动招募',
    author: '张三',
    createTime: '2023-05-13 15:30:00',
    views: 328,
    likes: 42,
    status: 1
  },
  {
    id: 2,
    title: '期末复习资料分享',
    author: '李四',
    createTime: '2023-05-12 14:20:00',
    views: 567,
    likes: 89,
    status: 1
  },
  {
    id: 3,
    title: '学生会换届选举公告',
    author: '王五',
    createTime: '2023-05-10 09:15:00',
    views: 721,
    likes: 112,
    status: 2
  }
]);

// 获取状态标签样式
const getTagType = (status) => {
  const map = {
    0: 'danger',  // 已删除
    1: 'success', // 正常
    2: 'warning', // 置顶
    3: 'info'     // 待审核
  };
  return map[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    0: '已删除',
    1: '正常',
    2: '置顶',
    3: '待审核'
  };
  return map[status] || '未知';
};

// 查看帖子
const handleView = (row) => {
  console.log('查看帖子:', row);
  // 这里可以跳转到帖子详情页或打开详情对话框
};

// 置顶帖子
const handleTopPost = (row) => {
  ElMessage.success(`已将帖子《${row.title}》设为置顶`);
  // 更新帖子状态
  row.status = row.status === 2 ? 1 : 2;
};

// 删除帖子
const handleDelete = (row) => {
  ElMessage.warning(`已删除帖子《${row.title}》`);
  // 从列表中移除帖子
  postsList.value = postsList.value.filter(item => item.id !== row.id);
};
</script>

<style scoped>
.posts-list-container {
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
</style> 