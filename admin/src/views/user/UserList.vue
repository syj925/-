<template>
  <div class="user-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>用户列表</h3>
          <div class="search-container">
            <el-input
              v-model="searchQuery"
              placeholder="搜索用户名/昵称/邮箱"
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
      <el-table :data="userList" style="width: 100%" v-loading="loading">
        <el-table-column label="ID" width="100">
          <template #default="scope">
            <el-tooltip :content="scope.row.id" placement="top">
              <span class="user-id-display">{{ formatUserId(scope.row.id) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
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
        <el-table-column label="标签" width="180">
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
              <span v-if="!scope.row.badges || scope.row.badges.length === 0" class="no-badges">无标签</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="scope">
            <el-button size="small" @click="handleDetail(scope.row)" type="primary" plain>详情</el-button>
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="info" @click="handleManageBadges(scope.row)">标签</el-button>
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

    <!-- 用户编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑用户"
      width="500px"
    >
      <el-form :model="editForm" label-width="120px" v-loading="saveLoading">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="editForm.gender" placeholder="请选择性别" style="width: 100%">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="学校">
          <el-input v-model="editForm.school" placeholder="请输入学校名称" />
        </el-form-item>
        <el-form-item label="院系">
          <el-input v-model="editForm.department" placeholder="请输入院系名称" />
        </el-form-item>
        <el-form-item label="个人简介">
          <el-input v-model="editForm.bio" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="editForm.password" type="password" placeholder="不修改请留空" show-password />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role" style="width: 100%">
            <el-option label="学生" value="student" />
            <el-option label="教师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.is_disabled" style="width: 100%">
            <el-option label="正常" :value="false" />
            <el-option label="禁用" :value="true" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveUser" :loading="saveLoading">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="用户详情"
      width="600px"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="ID">
          <div class="user-id-detail">
            <span class="id-text">{{ currentUser.id }}</span>
            <el-button
              type="text"
              size="small"
              @click="copyToClipboard(currentUser.id)"
              class="copy-btn"
            >
              <el-icon><DocumentCopy /></el-icon>
            </el-button>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ currentUser.nickname || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentUser.phone || '未绑定' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentUser.email || '未绑定' }}</el-descriptions-item>
        <el-descriptions-item label="性别">
          <el-tag :type="getGenderTagType(currentUser.gender)">
            {{ formatGender(currentUser.gender) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="学校">{{ currentUser.school || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="院系">{{ currentUser.department || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="头像">
          <div v-if="getAvatarUrl(currentUser.avatar)" class="avatar-container">
            <el-image
              :src="getAvatarUrl(currentUser.avatar)"
              style="width: 100px; height: 100px; border-radius: 8px;"
              fit="cover"
              :preview-src-list="[getAvatarUrl(currentUser.avatar)]"
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
        <el-descriptions-item label="个人简介">{{ currentUser.bio || '暂无简介' }}</el-descriptions-item>
        <el-descriptions-item label="背景图片" v-if="currentUser.backgroundImage">
          <el-image
            :src="getAvatarUrl(currentUser.backgroundImage)"
            style="width: 200px; height: 100px; border-radius: 8px;"
            fit="cover"
            :preview-src-list="[getAvatarUrl(currentUser.backgroundImage)]"
          >
            <template #error>
              <div style="width: 200px; height: 100px; display: flex; align-items: center; justify-content: center; background: #f5f7fa; color: #909399; border-radius: 8px;">
                <span>加载失败</span>
              </div>
            </template>
          </el-image>
        </el-descriptions-item>
        <el-descriptions-item label="统计数据" v-if="currentUser.stats">
          <div class="stats-container">
            <el-tag type="success" class="stat-tag">帖子: {{ currentUser.stats.postCount || 0 }}</el-tag>
            <el-tag type="" class="stat-tag">评论: {{ currentUser.stats.commentCount || 0 }}</el-tag>
            <el-tag type="info" class="stat-tag">点赞: {{ currentUser.stats.likeCount || 0 }}</el-tag>
            <el-tag type="warning" class="stat-tag">收藏: {{ currentUser.stats.favoriteCount || 0 }}</el-tag>
            <el-tag type="primary" class="stat-tag">关注: {{ currentUser.stats.followCount || 0 }}</el-tag>
            <el-tag type="danger" class="stat-tag">粉丝: {{ currentUser.stats.fansCount || 0 }}</el-tag>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag :type="currentUser.role === 'admin' ? 'danger' : 'info'">
            {{ formatRole(currentUser.role) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="!currentUser.is_disabled ? 'success' : 'danger'">
            {{ !currentUser.is_disabled ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最后登录时间">{{ formatDate(currentUser.last_login_at) || '从未登录' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatDate(currentUser.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="最后更新时间">{{ formatDate(currentUser.updatedAt) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleEdit(currentUser)">编辑</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 用户标签管理对话框 -->
    <el-dialog
      v-model="badgeDialogVisible"
      title="管理用户标签"
      width="600px"
    >
      <div class="badge-management" v-loading="badgeLoading">
        <div class="user-info">
          <strong>用户:</strong> {{ currentUser.nickname || currentUser.username }} (ID: {{ currentUser.id }})
        </div>
        
        <div class="badge-section">
          <h4>已分配标签</h4>
          <div class="badge-list">
            <template v-if="userBadges.length > 0">
              <el-tag
                v-for="badge in userBadges"
                :key="badge.id"
                :style="{backgroundColor: badge.color, color: '#fff'}"
                class="badge-item clickable"
                @click="removeUserBadge(badge)"
              >
                {{ badge.name }}
                <el-icon class="delete-icon"><Delete /></el-icon>
              </el-tag>
            </template>
            <div v-else class="no-badges-msg">该用户暂无标签</div>
          </div>
        </div>
        
        <div class="badge-section">
          <div class="section-header">
            <h4>可添加标签</h4>
            <el-button type="primary" size="small" @click="openCreateBadgeForm">创建新标签</el-button>
          </div>
          <div class="badge-list">
            <template v-if="availableBadges.length > 0">
              <el-tag
                v-for="badge in availableBadges"
                :key="badge.id"
                :style="{backgroundColor: badge.color, color: '#fff'}"
                class="badge-item clickable"
                @click="addUserBadge(badge)"
              >
                {{ badge.name }}
              </el-tag>
            </template>
            <div v-else class="no-badges-msg">没有可添加的标签</div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="badgeDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 创建标签对话框 -->
    <el-dialog
      v-model="createBadgeDialogVisible"
      title="创建新标签"
      width="500px"
    >
      <el-form 
        ref="badgeFormRef" 
        :model="badgeForm" 
        :rules="badgeFormRules" 
        label-width="80px"
        v-loading="createBadgeLoading"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="badgeForm.name" placeholder="请输入标签名称"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="badgeForm.description" type="textarea" placeholder="请输入标签描述"></el-input>
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="badgeForm.color"></el-color-picker>
          <span class="color-preview" :style="{backgroundColor: badgeForm.color}"></span>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="badgeForm.status" :active-value="true" :inactive-value="false"></el-switch>
          <span class="status-text">{{ badgeForm.status ? '启用' : '禁用' }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createBadgeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreateBadge" :loading="createBadgeLoading">创建</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Search, Delete, DocumentCopy } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/utils/api';
import { formatRole as utilFormatRole, formatId } from '@/utils/format';
import { SERVER_BASE_URL } from '@/config';

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

// 用户详情对话框
const detailDialogVisible = ref(false);
const currentUser = ref(null);

// 标签管理相关
const badgeDialogVisible = ref(false);
const badgeLoading = ref(false);
const userBadges = ref([]);
const availableBadges = ref([]);
const allBadges = ref([]);

// 创建标签相关
const createBadgeDialogVisible = ref(false);
const createBadgeLoading = ref(false);
const badgeFormRef = ref(null);
const badgeForm = ref({
  name: '',
  description: '',
  color: '#4A90E2',
  status: true
});
const badgeFormRules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }
  ],
  color: [
    { required: true, message: '请选择标签颜色', trigger: 'change' }
  ]
};

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

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleString();
};



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
  // 复制用户数据到编辑表单
  editForm.value = {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    phone: row.phone || '',
    email: row.email || '',
    gender: row.gender || '',
    school: row.school || '',
    department: row.department || '',
    bio: row.bio || '',
    password: '',
    role: row.role || 'student',
    is_disabled: row.is_disabled || false
  };

  dialogVisible.value = true;
};

// 保存用户信息
const saveUser = async () => {
  saveLoading.value = true;
  try {
    const res = await api.users.update(editForm.value.id, {
      nickname: editForm.value.nickname,
      phone: editForm.value.phone,
      email: editForm.value.email,
      gender: editForm.value.gender,
      school: editForm.value.school,
      department: editForm.value.department,
      bio: editForm.value.bio,
      password: editForm.value.password,
      role: editForm.value.role,
      is_disabled: editForm.value.is_disabled
    });
    
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

// 格式化角色
const formatRole = utilFormatRole;

// 格式化用户ID显示
const formatUserId = formatId;

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

// 处理管理用户标签
const handleManageBadges = async (user) => {
  currentUser.value = user;
  badgeDialogVisible.value = true;
  badgeLoading.value = true;
  
  try {
    // 加载所有标签
    const badgesRes = await api.badge.getList({ limit: 100 });
    if (badgesRes.success) {
      allBadges.value = badgesRes.data.items || [];
    }
    
    // 加载用户标签
    const userBadgesRes = await api.badge.getUserBadges(user.id);
    if (userBadgesRes.success) {
      userBadges.value = userBadgesRes.data || [];
      
      // 计算可添加的标签
      availableBadges.value = allBadges.value.filter(badge => 
        !userBadges.value.some(userBadge => userBadge.id === badge.id)
      );
    }
  } catch (error) {
    console.error('获取标签数据失败:', error);
    ElMessage.error('获取标签数据失败');
  } finally {
    badgeLoading.value = false;
  }
};

// 添加标签给用户
const addUserBadge = async (badge) => {
  try {
    const result = await api.badge.addUserBadge(currentUser.value.id, badge.id);
    if (result.success) {
      // 将标签从可添加列表移到已添加列表
      userBadges.value.push(badge);
      availableBadges.value = availableBadges.value.filter(b => b.id !== badge.id);
      
      // 更新用户列表中的数据
      const userIndex = userList.value.findIndex(u => u.id === currentUser.value.id);
      if (userIndex !== -1) {
        if (!userList.value[userIndex].badges) {
          userList.value[userIndex].badges = [];
        }
        userList.value[userIndex].badges.push(badge);
      }
      
      ElMessage.success(`已为用户添加标签: ${badge.name}`);
    } else {
      ElMessage.error(result.message || '添加标签失败');
    }
  } catch (error) {
    console.error('添加标签出错:', error);
    ElMessage.error('添加标签失败');
  }
};

// 移除用户标签
const removeUserBadge = async (badge) => {
  try {
    const result = await api.badge.removeUserBadge(currentUser.value.id, badge.id);
    if (result.success) {
      // 将标签从已添加列表移到可添加列表
      availableBadges.value.push(badge);
      userBadges.value = userBadges.value.filter(b => b.id !== badge.id);
      
      // 更新用户列表中的数据
      const userIndex = userList.value.findIndex(u => u.id === currentUser.value.id);
      if (userIndex !== -1 && userList.value[userIndex].badges) {
        userList.value[userIndex].badges = userList.value[userIndex].badges.filter(b => b.id !== badge.id);
      }
      
      ElMessage.success(`已从用户移除标签: ${badge.name}`);
    } else {
      ElMessage.error(result.message || '移除标签失败');
    }
  } catch (error) {
    console.error('移除标签出错:', error);
    ElMessage.error('移除标签失败');
  }
};

// 打开创建标签表单
const openCreateBadgeForm = () => {
  createBadgeDialogVisible.value = true;
  badgeForm.value = {
    name: '',
    description: '',
    color: '#4A90E2',
    status: true
  };
};

// 提交创建标签
const submitCreateBadge = async () => {
  if (!badgeFormRef.value) return;
  
  await badgeFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    createBadgeLoading.value = true;
    try {
      const result = await api.badge.create(badgeForm.value);
      if (result.success) {
        // 创建成功，添加到可用标签列表
        const newBadge = result.data;
        availableBadges.value.push(newBadge);
        allBadges.value.push(newBadge);
        
        // 关闭创建对话框
        createBadgeDialogVisible.value = false;
        ElMessage.success(`标签"${newBadge.name}"创建成功`);
      } else {
        ElMessage.error(result.message || '创建标签失败');
      }
    } catch (error) {
      console.error('创建标签出错:', error);
      ElMessage.error(error.message || '创建标签失败');
    } finally {
      createBadgeLoading.value = false;
    }
  });
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
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

.clickable {
  cursor: pointer;
}

.clickable:hover {
  opacity: 0.8;
}

.no-badges {
  color: #909399;
  font-size: 13px;
}

.badge-management {
  padding: 10px 0;
}

/* 恢复被删除的样式 */
.user-info {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.badge-section {
  margin-top: 20px;
}

.badge-section h4 {
  margin: 10px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #EBEEF5;
  font-weight: 500;
}

.badge-list {
  min-height: 50px;
  padding: 10px;
  background-color: #f8f9fb;
  border-radius: 4px;
}

.no-badges-msg {
  color: #909399;
  text-align: center;
  padding: 10px 0;
}

/* 新增样式 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-header h4 {
  margin: 0;
}

.color-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  margin-left: 10px;
  border: 1px solid #ddd;
}

.status-text {
  margin-left: 10px;
  font-size: 14px;
}

/* 删除图标样式 */
.delete-icon {
  margin-left: 5px;
  font-size: 12px;
  opacity: 0.5;
}

.clickable:hover .delete-icon {
  opacity: 1;
  color: #fff;
}

.badge-item.clickable {
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
}

.badge-item.clickable:hover {
  opacity: 0.8;
  transform: scale(1.05);
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