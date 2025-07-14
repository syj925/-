<template>
  <div class="comments-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>评论管理</h3>
        </div>
      </template>
      <el-table :data="commentsList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="content" label="评论内容" show-overflow-tooltip />
        <el-table-column prop="postTitle" label="所属帖子" width="180" show-overflow-tooltip />
        <el-table-column prop="author" label="评论者" width="120" />
        <el-table-column prop="createTime" label="评论时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '已删除' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
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

// 模拟评论数据
const commentsList = ref([
  {
    id: 1,
    content: '这个活动很有意义，我已经报名参加了！',
    postTitle: '校园文化节活动招募',
    author: '赵同学',
    createTime: '2023-05-13 16:30:00',
    status: 1
  },
  {
    id: 2,
    content: '资料很全面，非常感谢分享！',
    postTitle: '期末复习资料分享',
    author: '钱同学',
    createTime: '2023-05-12 15:20:00',
    status: 1
  },
  {
    id: 3,
    content: '请问具体什么时候开始投票？',
    postTitle: '学生会换届选举公告',
    author: '孙同学',
    createTime: '2023-05-10 10:15:00',
    status: 1
  }
]);

// 查看评论
const handleView = (row) => {
  console.log('查看评论:', row);
  // 这里可以跳转到评论所在帖子或打开详情对话框
};

// 删除评论
const handleDelete = (row) => {
  ElMessage.warning(`已删除评论`);
  // 从列表中移除评论
  commentsList.value = commentsList.value.filter(item => item.id !== row.id);
};
</script>

<style scoped>
.comments-list-container {
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