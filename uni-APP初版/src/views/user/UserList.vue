<template>
  <div class="user-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>用户列表</h3>
        </div>
      </template>
      <el-table :data="userList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="createTime" label="注册时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 模拟用户数据
const userList = ref([
  {
    id: 1,
    username: 'zhangsan',
    nickname: '张三',
    email: 'zhangsan@example.com',
    createTime: '2023-01-15 10:30:00',
    status: 1
  },
  {
    id: 2,
    username: 'lisi',
    nickname: '李四',
    email: 'lisi@example.com',
    createTime: '2023-02-20 14:20:00',
    status: 1
  },
  {
    id: 3,
    username: 'wangwu',
    nickname: '王五',
    email: 'wangwu@example.com',
    createTime: '2023-03-10 09:15:00',
    status: 0
  }
]);

// 编辑用户
const handleEdit = (row) => {
  console.log('编辑用户:', row);
  // 这里可以打开编辑对话框
};

// 删除用户
const handleDelete = (row) => {
  console.log('删除用户:', row);
  // 这里可以显示确认对话框
};

</script>

<style scoped>
.user-list-container {
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