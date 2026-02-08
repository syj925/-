<template>
  <div class="user-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>用户列表</h3>
          <div class="search-container">
            <el-input
              v-model="searchQuery"
              placeholder="搜索账号/昵称/邮箱"
              class="search-input"
              clearable
              @clear="fetchUsers"
            >
              <template #append>
                <el-button :icon="Search" @click="handleSearch"></el-button>
              </template>
            </el-input>
          </div>
        </div>
      </template>
      <el-table :data="userList" style="width: 100%" v-loading="loading" table-layout="auto">
        <el-table-column label="ID" width="100">
          <template #default="scope">
            <el-tooltip :content="scope.row.id" placement="top">
              <span class="user-id-display">{{ formatUserId(scope.row.id) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="账号" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="bio" label="简介" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.bio || '暂无简介' }}
          </template>
        </el-table-column>
        <el-table-column label="在线状态" width="120">
          <template #default="scope">
            <div class="online-status">
              <span v-if="scope.row.lastActiveTime && isUserActive(scope.row.lastActiveTime)" class="status-indicator online">
                <span class="status-dot"></span>在线
              </span>
              <span v-else class="status-indicator offline">
                <span class="status-dot"></span>{{ formatLastActive(scope.row.lastActiveTime) || '未知' }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'info'">
              {{ formatRole(scope.row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="!scope.row.is_disabled ? 'success' : 'danger'">
              {{ !scope.row.is_disabled ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="私信权限" width="120" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.allowMessage"
              :loading="scope.row.messageSettingLoading"
              @change="handleToggleMessagePermission(scope.row)"
              active-text="允许"
              inactive-text="禁止"
              active-color="#13ce66"
              inactive-color="#ff4949"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="徽章" width="180">
          <template #default="scope">
            <div class="badge-tags">
              <el-tag
                v-for="badge in scope.row.badges"
                :key="badge.id"
                :style="{backgroundColor: badge.color, color: '#fff'}"
                class="badge-item"
                size="small"
              >
                {{ badge.name }}
              </el-tag>
              <span v-if="!scope.row.badges || scope.row.badges.length === 0" class="no-badges">无徽章</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="scope">
            <el-button size="small" @click="handleDetail(scope.row)" type="primary" plain>详情</el-button>
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="info" @click="handleManageBadges(scope.row)">徽章</el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页控件 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
      
      <!-- 没有结果时显示 -->
      <el-empty v-if="userList.length === 0 && !loading" description="没有找到匹配的用户" />
    </el-card>

    <!-- 子组件 -->
    <UserEditDialog
      v-model:visible="dialogVisible"
      :form="editForm"
      :rules="editFormRules"
      :loading="saveLoading"
      @submit="saveUser"
    />

    <UserDetailDialog
      v-model:visible="detailDialogVisible"
      :user="currentUser"
      @edit="handleEdit"
    />

    <UserBadgeManager
      v-model:visible="badgeDialogVisible"
      :user="currentUser"
      @refresh="fetchUsers"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/utils/api';
import { formatRole as utilFormatRole, formatId } from '@/utils/format';
import { SERVER_BASE_URL } from '@/config';

// Components
import UserEditDialog from '@/components/user/UserEditDialog.vue';
import UserDetailDialog from '@/components/user/UserDetailDialog.vue';
import UserBadgeManager from '@/components/user/UserBadgeManager.vue';

// 加载状态
const loading = ref(false);
const saveLoading = ref(false);

// 搜索相关
const searchQuery = ref('');

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 用户列表数据
const userList = ref([]);

// 编辑对话框
const dialogVisible = ref(false);
const editForm = ref({
  id: null,
  username: '',
  nickname: '',
  phone: '',
  email: '',
  gender: '',
  school: '',
  department: '',
  bio: '',
  password: '',
  role: 'student',
  is_disabled: false
});

// 编辑表单验证规则
const editFormRules = {
  nickname: [
    { max: 50, message: '昵称长度不能超过50个字符', trigger: 'blur' }
  ],
  phone: [
    {
      validator: (rule, value, callback) => {
        if (!value || value.trim() === '') {
          // 允许为空
          callback();
        } else if (!/^1[3-9]\d{9}$/.test(value)) {
          callback(new Error('请输入正确的手机号格式（11位数字，1开头）'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  email: [
    {
      validator: (rule, value, callback) => {
        if (!value || value.trim() === '') {
          // 允许为空
          callback();
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          callback(new Error('请输入正确的邮箱格式'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 详情和徽章管理
const detailDialogVisible = ref(false);
const badgeDialogVisible = ref(false);
const currentUser = ref(null);

// 初始化
onMounted(() => {
  fetchUsers();
});

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await api.users.getList({
      page: currentPage.value,
      limit: pageSize.value,
      query: searchQuery.value,
      status: 'active',  // 只显示已激活的用户，过滤掉待审核用户
      includeBadges: true  // 添加参数，表示需要包含用户标签信息
    });

    if (response.success) {
      userList.value = response.data.items || [];
      total.value = response.data.total || 0;

      // 确保每个用户对象都有badges属性，即使为空数组
      userList.value.forEach(user => {
        if (!user.badges) {
          user.badges = [];
        }
        // 初始化私信权限字段
        const allowMessage = user.settings?.privacy?.allowMessage;
        user.allowMessage = allowMessage !== undefined ? allowMessage : true;
        // 初始化加载状态
        user.messageSettingLoading = false;
      });
    } else {
      ElMessage.error(response.message || '获取用户列表失败');
    }
  } catch (error) {
    console.error('获取用户列表出错:', error);
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索处理函数
const handleSearch = () => {
  currentPage.value = 1; // 重置到第一页
  fetchUsers();
};

// 分页处理函数
const handleSizeChange = (size) => {
  pageSize.value = size;
  fetchUsers();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  fetchUsers();
};

// 格式化角色
const formatRole = utilFormatRole;

// 格式化用户ID显示
const formatUserId = formatId;

// 判断用户是否在线
const isUserActive = (lastActiveTime) => {
  if (!lastActiveTime) return false;
  
  const now = new Date();
  const lastActive = new Date(lastActiveTime);
  // 30分钟内有活动的用户视为在线
  return (now - lastActive) < 30 * 60 * 1000;
};

// 格式化最后活跃时间
const formatLastActive = (lastActiveTime) => {
  if (!lastActiveTime) return '未知';
  
  const now = new Date();
  const lastActive = new Date(lastActiveTime);
  const diffMs = now - lastActive;
  
  // 计算时间差（分钟、小时、天、月）
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  
  // 根据时间差返回不同的显示文本
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 30) {
    return `${diffDays}天前`;
  } else {
    return `${diffMonths}月前`;
  }
};

// 编辑用户
const handleEdit = (row) => {
  // 复制用户数据到编辑表单，null 值转为空字符串以便编辑
  editForm.value = {
    id: row.id,
    username: row.username,
    nickname: row.nickname || '',        // null 转为空字符串
    phone: row.phone || '',              // null 转为空字符串  
    email: row.email || '',              // null 转为空字符串
    gender: row.gender || '',            // null 转为空字符串
    school: row.school || '',            // null 转为空字符串
    department: row.department || '',    // null 转为空字符串
    bio: row.bio || '',                  // null 转为空字符串
    password: '',                        // 密码总是空，需要用户主动填写
    role: row.role || 'student',
    is_disabled: row.is_disabled || false
  };

  dialogVisible.value = true;
};

// 保存用户信息
const saveUser = async () => {
  saveLoading.value = true;
  try {
    // 准备提交数据，对空字符串进行处理
    const updateData = {
      nickname: editForm.value.nickname?.trim() || null,
      phone: editForm.value.phone?.trim() || null, // 空值转为 null
      email: editForm.value.email?.trim() || null, // 空值转为 null
      gender: editForm.value.gender || null,
      school: editForm.value.school?.trim() || null,
      department: editForm.value.department?.trim() || null,
      bio: editForm.value.bio?.trim() || null,
      role: editForm.value.role,
      is_disabled: editForm.value.is_disabled
    };
    
    // 只有非空密码才发送
    if (editForm.value.password?.trim()) {
      updateData.password = editForm.value.password.trim();
    }
    
    console.log('提交的更新数据:', updateData);
    
    const res = await api.users.update(editForm.value.id, updateData);
    
    if (res.success) {
      ElMessage.success('用户信息更新成功');
      dialogVisible.value = false;
      fetchUsers(); // 刷新列表
    } else {
      ElMessage.error(res.message || '更新用户信息失败');
    }
  } catch (error) {
    console.error('更新用户信息错误:', error);
    ElMessage.error(error.message || '更新用户信息失败，请稍后再试');
  } finally {
    saveLoading.value = false;
  }
};

// 删除用户
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除用户"${row.nickname || row.username}"吗？此操作不可恢复！`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await api.users.delete(row.id);
      
      if (res.success) {
        ElMessage.success('用户删除成功');
        fetchUsers(); // 刷新列表
      } else {
        ElMessage.error(res.message || '删除用户失败');
      }
    } catch (error) {
      console.error('删除用户错误:', error);
      ElMessage.error(error.message || '删除用户失败，请稍后再试');
    }
  }).catch(() => {
    // 用户取消删除
  });
};

// 查看用户详情
const handleDetail = async (row) => {
  try {
    // 先设置基本信息，让对话框快速显示
    currentUser.value = { ...row };
    detailDialogVisible.value = true;
    
    // 然后异步获取完整的用户信息
    const res = await api.users.getOne(row.id);
    if (res.success) {
      currentUser.value = res.data;
    } else {
      ElMessage.error(res.message || '获取用户详情失败');
    }
  } catch (error) {
    console.error('获取用户详情错误:', error);
    ElMessage.error(error.message || '获取用户详情失败，请稍后再试');
  }
};

// 处理管理用户徽章
const handleManageBadges = (row) => {
  currentUser.value = row;
  badgeDialogVisible.value = true;
};

// 处理私信权限切换
const handleToggleMessagePermission = async (user) => {
  try {
    // 设置加载状态
    user.messageSettingLoading = true;
    
    // 准备更新数据
    const settings = {
      privacy: {
        ...(user.settings?.privacy || {}),
        allowMessage: user.allowMessage
      }
    };
    
    // 调用API更新用户设置
    const response = await api.users.update(user.id, { settings });
    
    if (response.success) {
      ElMessage.success(`已${user.allowMessage ? '允许' : '禁止'}用户接收私信`);
      // 更新本地数据
      if (!user.settings) {
        user.settings = {};
      }
      if (!user.settings.privacy) {
        user.settings.privacy = {};
      }
      user.settings.privacy.allowMessage = user.allowMessage;
    } else {
      // 失败时恢复开关状态
      user.allowMessage = !user.allowMessage;
      ElMessage.error(response.message || '更新私信权限失败');
    }
  } catch (error) {
    console.error('更新私信权限错误:', error);
    // 失败时恢复开关状态
    user.allowMessage = !user.allowMessage;
    ElMessage.error('更新私信权限失败，请稍后再试');
  } finally {
    // 清除加载状态
    user.messageSettingLoading = false;
  }
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

.search-container {
  display: flex;
  align-items: center;
}

.search-input {
  width: 300px;
}

/* 用户ID显示样式 */
.user-id-display {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  background-color: #f5f5f5;
}

.user-id-display:hover {
  background-color: #e6f7ff;
  color: #1890ff;
}

.online-status {
  display: flex;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.online .status-dot {
  background-color: var(--online-color, #00dc82);
  box-shadow: 0 0 5px var(--online-color, #00dc82);
}

.offline .status-dot {
  background-color: #909399;
}

.online {
  color: var(--online-color, #00dc82);
}

.offline {
  color: var(--text-secondary, #909399);
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.badge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.badge-item {
  margin-right: 4px;
  margin-bottom: 4px;
}

.no-badges {
  color: #909399;
  font-size: 13px;
}

/* 表格自适应优化 */
:deep(.el-table) {
  table-layout: auto;
}

:deep(.el-table .el-table__cell) {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
</style>
