<template>
  <el-dialog
    v-model="dialogVisible"
    title="用户详情"
    width="600px"
  >
    <el-descriptions :column="1" border v-if="user">
      <el-descriptions-item label="ID">
        <div class="user-id-detail">
          <span class="id-text">{{ user.id }}</span>
          <el-button
            type="text"
            size="small"
            @click="copyToClipboard(user.id)"
            class="copy-btn"
          >
            <el-icon><DocumentCopy /></el-icon>
          </el-button>
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="账号">{{ user.username }}</el-descriptions-item>
      <el-descriptions-item label="昵称">{{ user.nickname || '未设置' }}</el-descriptions-item>
      <el-descriptions-item label="手机号">{{ user.phone || '未绑定' }}</el-descriptions-item>
      <el-descriptions-item label="邮箱">{{ user.email || '未绑定' }}</el-descriptions-item>
      <el-descriptions-item label="性别">
        <el-tag :type="getGenderTagType(user.gender)">
          {{ formatGender(user.gender) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="学校">{{ user.school || '未填写' }}</el-descriptions-item>
      <el-descriptions-item label="院系">{{ user.department || '未填写' }}</el-descriptions-item>
      <el-descriptions-item label="头像">
        <div v-if="getAvatarUrl(user.avatar)" class="avatar-container">
          <el-image
            :src="getAvatarUrl(user.avatar)"
            style="width: 100px; height: 100px; border-radius: 8px;"
            fit="cover"
            :preview-src-list="[getAvatarUrl(user.avatar)]"
          >
            <template #error>
              <div class="avatar-placeholder">
                <span>加载失败</span>
              </div>
            </template>
          </el-image>
        </div>
        <div v-else class="avatar-placeholder">
          <span>暂无头像</span>
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="个人简介">{{ user.bio || '暂无简介' }}</el-descriptions-item>
      <el-descriptions-item label="背景图片" v-if="user.backgroundImage">
        <el-image
          :src="getAvatarUrl(user.backgroundImage)"
          style="width: 200px; height: 100px; border-radius: 8px;"
          fit="cover"
          :preview-src-list="[getAvatarUrl(user.backgroundImage)]"
        >
          <template #error>
            <div style="width: 200px; height: 100px; display: flex; align-items: center; justify-content: center; background: #f5f7fa; color: #909399; border-radius: 8px;">
              <span>加载失败</span>
            </div>
          </template>
        </el-image>
      </el-descriptions-item>
      <el-descriptions-item label="统计数据" v-if="user.stats">
        <div class="stats-container">
          <el-tag type="success" class="stat-tag">帖子: {{ user.stats.postCount || 0 }}</el-tag>
          <el-tag type="" class="stat-tag">评论: {{ user.stats.commentCount || 0 }}</el-tag>
          <el-tag type="info" class="stat-tag">点赞: {{ user.stats.likeCount || 0 }}</el-tag>
          <el-tag type="warning" class="stat-tag">收藏: {{ user.stats.favoriteCount || 0 }}</el-tag>
          <el-tag type="primary" class="stat-tag">关注: {{ user.stats.followCount || 0 }}</el-tag>
          <el-tag type="danger" class="stat-tag">粉丝: {{ user.stats.fansCount || 0 }}</el-tag>
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="角色">
        <el-tag :type="user.role === 'admin' ? 'danger' : 'info'">
          {{ formatRole(user.role) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="!user.is_disabled ? 'success' : 'danger'">
          {{ !user.is_disabled ? '正常' : '禁用' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="最后登录时间">{{ formatDate(user.last_login_at) || '从未登录' }}</el-descriptions-item>
      <el-descriptions-item label="注册时间">{{ formatDate(user.createdAt) }}</el-descriptions-item>
      <el-descriptions-item label="最后更新时间">{{ formatDate(user.updatedAt) }}</el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="$emit('edit', user)">编辑</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';
import { ElMessage } from 'element-plus';
import { DocumentCopy } from '@element-plus/icons-vue';
import { formatRole as utilFormatRole } from '@/utils/format';
import { SERVER_BASE_URL } from '@/config';

const props = defineProps({
  visible: Boolean,
  user: Object
});

const emit = defineEmits(['update:visible', 'edit']);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
});

// 格式化角色
const formatRole = utilFormatRole;

// 处理头像URL
const getAvatarUrl = (avatar) => {
  if (!avatar || avatar.trim() === '') {
    return null;
  }

  // 如果是完整URL（http或https开头），直接返回
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }

  // 如果是相对路径，拼接服务器地址
  const path = avatar.startsWith('/') ? avatar : `/${avatar}`;

  return `${SERVER_BASE_URL}${path}`;
};

// 格式化性别
const formatGender = (gender) => {
  const genderMap = {
    'male': '男',
    'female': '女',
    'other': '其他'
  };
  return genderMap[gender] || '未设置';
};

// 获取性别标签类型
const getGenderTagType = (gender) => {
  const typeMap = {
    'male': 'primary',
    'female': 'danger',
    'other': 'warning'
  };
  return typeMap[gender] || 'info';
};

// 复制到剪贴板
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success('已复制到剪贴板');
  } catch (error) {
    console.error('复制失败:', error);
    ElMessage.error('复制失败');
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleString();
};
</script>

<style scoped>
.user-id-detail {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-id-detail .id-text {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #666;
  word-break: break-all;
  flex: 1;
}

.user-id-detail .copy-btn {
  padding: 4px;
  min-height: auto;
}

.user-id-detail .copy-btn:hover {
  color: #1890ff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

/* 头像相关样式 */
.avatar-container {
  display: flex;
  align-items: center;
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 14px;
}

/* 统计数据样式 */
.stats-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stat-tag {
  margin: 0;
}
</style>
