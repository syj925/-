<template>
  <div class="content-audit-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>内容审核</h3>
          <el-radio-group v-model="auditType" size="small">
            <el-radio-button label="posts">帖子</el-radio-button>
            <el-radio-button label="comments">评论</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      
      <!-- 帖子审核表格 -->
      <el-table v-if="auditType === 'posts'" :data="postsAuditList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="createTime" label="发布时间" width="180" />
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" type="success" @click="handleApprove(scope.row, 'post')">通过</el-button>
            <el-button size="small" type="danger" @click="handleReject(scope.row, 'post')">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 评论审核表格 -->
      <el-table v-else :data="commentsAuditList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="content" label="评论内容" show-overflow-tooltip />
        <el-table-column prop="postTitle" label="所属帖子" width="180" show-overflow-tooltip />
        <el-table-column prop="author" label="评论者" width="120" />
        <el-table-column prop="createTime" label="评论时间" width="180" />
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" type="success" @click="handleApprove(scope.row, 'comment')">通过</el-button>
            <el-button size="small" type="danger" @click="handleReject(scope.row, 'comment')">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

// 审核类型：帖子或评论
const auditType = ref('posts');

// 模拟待审核帖子数据
const postsAuditList = ref([
  {
    id: 4,
    title: '关于学校新图书馆开放时间的通知',
    author: '李同学',
    createTime: '2023-05-14 09:30:00',
  },
  {
    id: 5,
    title: '校园歌手大赛初赛结果公布',
    author: '赵同学',
    createTime: '2023-05-14 10:20:00',
  }
]);

// 模拟待审核评论数据
const commentsAuditList = ref([
  {
    id: 4,
    content: '这个通知太晚了，我们都已经做了其他安排',
    postTitle: '关于本周日活动延期的通知',
    author: '刘同学',
    createTime: '2023-05-14 11:30:00',
  },
  {
    id: 5,
    content: '希望下次能提前通知，避免时间冲突',
    postTitle: '关于本周日活动延期的通知',
    author: '陈同学',
    createTime: '2023-05-14 12:20:00',
  }
]);

// 查看内容
const handleView = (row) => {
  console.log('查看内容:', row);
  // 这里可以打开详情对话框
};

// 通过审核
const handleApprove = (row, type) => {
  ElMessage.success(`已通过${type === 'post' ? '帖子' : '评论'}审核`);
  
  // 从列表中移除
  if (type === 'post') {
    postsAuditList.value = postsAuditList.value.filter(item => item.id !== row.id);
  } else {
    commentsAuditList.value = commentsAuditList.value.filter(item => item.id !== row.id);
  }
};

// 拒绝审核
const handleReject = (row, type) => {
  ElMessage.warning(`已拒绝${type === 'post' ? '帖子' : '评论'}审核`);
  
  // 从列表中移除
  if (type === 'post') {
    postsAuditList.value = postsAuditList.value.filter(item => item.id !== row.id);
  } else {
    commentsAuditList.value = commentsAuditList.value.filter(item => item.id !== row.id);
  }
};
</script>

<style scoped>
.content-audit-container {
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