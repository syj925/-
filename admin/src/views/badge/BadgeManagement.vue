<template>
  <div class="badge-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>用户徽章管理</h3>
          <div class="header-actions">
            <el-button type="success" @click="showStatistics" icon="DataAnalysis">统计信息</el-button>
            <el-button type="primary" @click="showAddDialog" icon="Plus">添加徽章</el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="filter-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchForm.name"
              placeholder="搜索徽章名称"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-select v-model="searchForm.type" placeholder="徽章类型" clearable>
              <el-option label="成就徽章" value="achievement" />
              <el-option label="兴趣标签" value="interest" />
              <el-option label="系统标签" value="system" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="searchForm.rarity" placeholder="稀有度" clearable>
              <el-option label="普通" value="common" />
              <el-option label="稀有" value="rare" />
              <el-option label="史诗" value="epic" />
              <el-option label="传说" value="legendary" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="searchForm.status" placeholder="状态" clearable>
              <el-option label="激活" value="active" />
              <el-option label="禁用" value="inactive" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="handleSearch" icon="Search">搜索</el-button>
            <el-button @click="resetSearch" icon="Refresh">重置</el-button>
          </el-col>
        </el-row>
      </div>
      
      <!-- 徽章列表 -->
      <el-table :data="badgeList" style="width: 100%" v-loading="loading" stripe table-layout="auto">
        <el-table-column type="selection" width="55" />
        <el-table-column label="ID" width="120">
          <template #default="scope">
            <el-tooltip :content="scope.row.id" placement="top">
              <span class="badge-id-display">{{ formatId(scope.row.id) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="徽章预览" width="120">
          <template #default="scope">
            <div class="badge-preview">
              <div class="badge-icon" :style="{backgroundColor: scope.row.color}">
                <img src="@/assets/images/badge-icon.svg" alt="徽章图标" class="table-badge-icon" />
              </div>
              <span class="badge-name">{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="类型" min-width="100">
          <template #default="scope">
            <el-tag :type="getTypeTagType(scope.row.type)">
              {{ getTypeLabel(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="稀有度" min-width="100">
          <template #default="scope">
            <el-tag :type="getRarityTagType(scope.row.rarity)">
              {{ getRarityLabel(scope.row.rarity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="自动授予" width="100" align="center">
          <template #default="scope">
            <el-icon v-if="scope.row.autoGrant" color="#67C23A"><Check /></el-icon>
            <el-icon v-else color="#F56C6C"><Close /></el-icon>
          </template>
        </el-table-column>
        <el-table-column label="排序" width="80">
          <template #default="scope">
            {{ scope.row.sortOrder }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '激活' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 'active' ? 'warning' : 'success'" 
              @click="handleToggleStatus(scope.row)"
            >
              <el-icon><VideoPlay v-if="scope.row.status === 'active'" /><VideoPause v-else /></el-icon>
              {{ scope.row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="info" @click="handleViewGrants(scope.row)">
              <el-icon><View /></el-icon>查看授予
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 添加/编辑徽章对话框 -->
    <el-dialog
      :title="dialogType === 'add' ? '添加徽章' : '编辑徽章'"
      v-model="dialogVisible"
      width="700px"
      :close-on-click-modal="false"
      :destroy-on-close="true"
    >
      <el-form
        ref="badgeFormRef"
        :model="badgeForm"
        :rules="badgeFormRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="徽章名称" prop="name">
              <el-input v-model="badgeForm.name" placeholder="请输入徽章名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="徽章颜色" prop="color">
              <el-color-picker v-model="badgeForm.color" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="徽章描述" prop="description">
          <el-input
            v-model="badgeForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入徽章描述"
          />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="徽章类型" prop="type">
              <el-select v-model="badgeForm.type" placeholder="选择类型" style="width: 100%">
                <el-option label="成就徽章" value="achievement" />
                <el-option label="兴趣标签" value="interest" />
                <el-option label="系统标签" value="system" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="稀有度" prop="rarity">
              <el-select v-model="badgeForm.rarity" placeholder="选择稀有度" style="width: 100%">
                <el-option label="普通" value="common" />
                <el-option label="稀有" value="rare" />
                <el-option label="史诗" value="epic" />
                <el-option label="传说" value="legendary" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序权重" prop="sortOrder">
              <el-input-number
                v-model="badgeForm.sortOrder"
                :min="0"
                :max="9999"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
                  <el-form-item label="图标">
            <div class="icon-preview">
              <img src="@/assets/images/badge-icon.svg" alt="徽章图标" class="badge-icon" />
              <span class="icon-text">统一认证图标</span>
            </div>
            <div class="form-tip">
              所有徽章使用统一的官方认证图标
            </div>
          </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="badgeForm.status">
                <el-radio value="active">激活</el-radio>
                <el-radio value="inactive">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <!-- 预留空间用于未来扩展 -->
          </el-col>
        </el-row>
        
        <el-form-item label="自动授予">
          <el-switch v-model="badgeForm.autoGrant" />
          <span class="form-tip">开启后，系统将自动根据条件授予徽章</span>
        </el-form-item>
        
        <el-form-item v-if="badgeForm.autoGrant" label="授予条件" prop="grantCondition">
          <el-input
            v-model="badgeForm.grantCondition"
            type="textarea"
            :rows="3"
            placeholder="请输入JSON格式的授予条件，例如：{'postCount': 10, 'likeCount': 50}"
          />
          <div class="form-tip">
            支持条件：postCount(发帖数)、likeCount(点赞数)、commentCount(评论数)、loginDays(登录天数)等
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitBadgeForm" :loading="submitLoading">
            {{ dialogType === 'add' ? '添加' : '更新' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 徽章统计对话框 -->
    <el-dialog title="徽章统计信息" v-model="statisticsVisible" width="500px">
      <div v-loading="statisticsLoading">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="总徽章数">{{ statistics.total || 0 }}</el-descriptions-item>
          <el-descriptions-item label="激活徽章">{{ statistics.active || 0 }}</el-descriptions-item>
          <el-descriptions-item label="成就徽章">{{ statistics.achievement || 0 }}</el-descriptions-item>
          <el-descriptions-item label="兴趣标签">{{ statistics.interest || 0 }}</el-descriptions-item>
          <el-descriptions-item label="系统标签">{{ statistics.system || 0 }}</el-descriptions-item>
          <el-descriptions-item label="自动徽章">{{ statistics.autoGrant || 0 }}</el-descriptions-item>
        </el-descriptions>
        
        <div style="margin-top: 20px">
          <h4>稀有度分布</h4>
          <el-progress :percentage="(statistics.common / statistics.total * 100) || 0" :format="() => `普通: ${statistics.common || 0}`" />
          <el-progress :percentage="(statistics.rare / statistics.total * 100) || 0" :format="() => `稀有: ${statistics.rare || 0}`" status="success" />
          <el-progress :percentage="(statistics.epic / statistics.total * 100) || 0" :format="() => `史诗: ${statistics.epic || 0}`" status="warning" />
          <el-progress :percentage="(statistics.legendary / statistics.total * 100) || 0" :format="() => `传说: ${statistics.legendary || 0}`" status="exception" />
        </div>
      </div>
    </el-dialog>

    <!-- 徽章授予记录对话框 -->
    <el-dialog title="徽章授予记录" v-model="grantsVisible" width="800px">
      <!-- 徽章信息 -->
      <div v-if="currentBadge.id" class="badge-info" style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 6px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="badge-icon" :style="{backgroundColor: currentBadge.color}" style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; padding: 8px;">
            <img src="@/assets/images/badge-icon.svg" alt="徽章图标" style="width: 24px; height: 24px; filter: brightness(0) invert(1);" />
          </div>
          <div>
            <h4 style="margin: 0; color: #333;">{{ currentBadge.name }}</h4>
            <p style="margin: 4px 0 0; color: #666; font-size: 14px;">{{ currentBadge.description }}</p>
          </div>
        </div>
      </div>

      <!-- 授予记录表格 -->
      <el-table :data="grantsList" v-loading="grantsLoading">
        <el-table-column prop="user.username" label="用户名" width="120" />
        <el-table-column prop="user.nickname" label="昵称" width="120" />
        <el-table-column label="授予时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.grantedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="授予方式" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.grantedBy ? 'warning' : 'success'" size="small">
              {{ scope.row.grantedBy ? '手动授予' : '自动授予' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="可见性" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.isVisible ? 'success' : 'info'" size="small">
              {{ scope.row.isVisible ? '可见' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="管理操作" width="200">
          <template #default="scope">
            <el-button
              :type="scope.row.isVisible ? 'warning' : 'success'"
              size="small"
              @click="handleToggleVisibility(scope.row)"
              :loading="scope.row.toggleLoading"
            >
              <el-icon><component :is="scope.row.isVisible ? 'Hide' : 'View'" /></el-icon>
              {{ scope.row.isVisible ? '隐藏' : '显示' }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleRevokeBadge(scope.row)"
              :loading="scope.row.revokeLoading"
              style="margin-left: 8px;"
            >
              <el-icon><Delete /></el-icon>
              撤销
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无授予记录" :image-size="80" />
        </template>
      </el-table>

      <!-- 分页 -->
      <div v-if="grantsTotal > 0" style="margin-top: 16px; text-align: center;">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="grantsTotal"
          v-model:current-page="grantsCurrentPage"
          v-model:page-size="grantsPageSize"
          @current-change="handleGrantsPageChange"
        />
      </div>

      <!-- 对话框底部操作 -->
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="grantsVisible = false">关闭</el-button>
          <el-button type="primary" @click="goToUserManagement">
            <el-icon><User /></el-icon>
            用户管理
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 授予徽章功能已移至用户管理页面 -->
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Search, Plus, Edit, Delete, Check, Close, 
  VideoPlay, VideoPause, User, DataAnalysis,
  Hide, View 
} from '@element-plus/icons-vue';
import api from '@/utils/api';
import { formatDate } from '@/utils/date';
import { formatId } from '@/utils/format';


// 响应式数据
const loading = ref(false);
const badgeList = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);

const dialogVisible = ref(false);
const dialogType = ref('add');
const submitLoading = ref(false);
const badgeFormRef = ref();

const statisticsVisible = ref(false);
const statisticsLoading = ref(false);
const statistics = ref({});

const grantsVisible = ref(false);
const grantsLoading = ref(false);
const grantsList = ref([]);
const grantsTotal = ref(0);
const currentBadge = ref({});
const grantsCurrentPage = ref(1);
const grantsPageSize = ref(20);

// 授予徽章功能已移至用户管理页面

// 搜索表单
const searchForm = reactive({
  name: '',
  type: '',
  rarity: '',
  status: ''
});

// 徽章表单
const badgeForm = reactive({
  id: null,
  name: '',
  description: '',
  color: '#3498db',
  type: 'achievement',
  rarity: 'common',
  autoGrant: false,
  grantCondition: '',
  sortOrder: 0,
  status: 'active'
});

// 表单验证规则
const badgeFormRules = {
  name: [
    { required: true, message: '请输入徽章名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入徽章描述', trigger: 'blur' },
    { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择徽章类型', trigger: 'change' }
  ],
  rarity: [
    { required: true, message: '请选择稀有度', trigger: 'change' }
  ],

  grantCondition: [
    {
      validator: (rule, value, callback) => {
        if (badgeForm.autoGrant && value) {
          try {
            JSON.parse(value);
            callback();
          } catch (e) {
            callback(new Error('授予条件必须是有效的JSON格式'));
          }
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 工具方法
const getTypeLabel = (type) => {
  const map = {
    achievement: '成就',
    interest: '兴趣',
    system: '系统'
  };
  return map[type] || type;
};

const getTypeTagType = (type) => {
  const map = {
    achievement: 'success',
    interest: 'primary',
    system: 'warning'
  };
  return map[type] || '';
};

const getRarityLabel = (rarity) => {
  const map = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  };
  return map[rarity] || rarity;
};

const getRarityTagType = (rarity) => {
  const map = {
    common: '',
    rare: 'success',
    epic: 'warning',
    legendary: 'danger'
  };
  return map[rarity] || '';
};

// 验证图标名称是否为有效的Vue组件名


// 事件处理方法
const showAddDialog = () => {
  dialogType.value = 'add';
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  dialogType.value = 'edit';
  
  Object.keys(badgeForm).forEach(key => {
    if (key in row) {
      badgeForm[key] = row[key];
    }
  });
  
  dialogVisible.value = true;
};

const handleToggleStatus = (row) => {
  const statusText = row.status === 'active' ? '禁用' : '启用';
  
  ElMessageBox.confirm(`确定要${statusText}徽章"${row.name}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const newStatus = row.status === 'active' ? 'inactive' : 'active';
      const result = await api.badge.updateStatus(row.id, { status: newStatus });
      
      if (result.success) {
        row.status = newStatus;
        ElMessage.success(`已${statusText}徽章: ${row.name}`);
      } else {
        ElMessage.error(result.message || '操作失败');
      }
    } catch (error) {
      console.error('操作徽章状态失败:', error);
      ElMessage.error('操作失败，请稍后再试');
    }
  }).catch(() => {});
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除徽章"${row.name}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const result = await api.badge.delete(row.id);
      
      if (result.success) {
        ElMessage.success(`已删除徽章: ${row.name}`);
        loadBadgeList();
      } else {
        ElMessage.error(result.message || '删除徽章失败');
      }
    } catch (error) {
      console.error('删除徽章出错:', error);
      ElMessage.error('删除徽章失败，请稍后再试');
    }
  }).catch(() => {});
};

const handleViewGrants = async (row) => {
  grantsVisible.value = true;
  grantsCurrentPage.value = 1; // 重置分页
  currentBadge.value = row; // 设置当前徽章信息
  await loadGrantsData();
};

// 处理授予记录分页
const handleGrantsPageChange = async (page) => {
  grantsCurrentPage.value = page;
  await loadGrantsData();
};

// 加载授予记录数据（支持分页）
const loadGrantsData = async () => {
  if (!currentBadge.value?.id) return;
  
  grantsLoading.value = true;
  try {
    const result = await api.badge.getGrants(currentBadge.value.id, {
      page: grantsCurrentPage.value,
      limit: grantsPageSize.value
    });
    
    if (result.success) {
      grantsList.value = result.data?.items || [];
      grantsTotal.value = result.data?.total || 0;
      // 如果API返回了徽章信息，更新当前徽章信息
      if (result.data?.badge) {
        currentBadge.value = { ...currentBadge.value, ...result.data.badge };
      }
    } else {
      ElMessage.error('获取授予记录失败');
    }
  } catch (error) {
    console.error('获取授予记录失败:', error);
    ElMessage.error('获取授予记录失败');
  } finally {
    grantsLoading.value = false;
  }
};

const showStatistics = async () => {
  statisticsVisible.value = true;
  statisticsLoading.value = true;
  
  try {
    const result = await api.badge.getStatistics();
    if (result.success) {
      statistics.value = result.data || {};
    } else {
      ElMessage.error('获取统计信息失败');
    }
  } catch (error) {
    console.error('获取统计信息失败:', error);
    ElMessage.error('获取统计信息失败');
  } finally {
    statisticsLoading.value = false;
  }
};

// 跳转到用户管理页面
const goToUserManagement = () => {
  grantsVisible.value = false;
  // 使用 Vue Router 跳转到用户管理页面
  window.location.href = '/admin/user';
};

// 授予徽章相关函数已移至用户管理页面

// 切换徽章可见性
const handleToggleVisibility = async (grant) => {
  try {
    // 添加loading状态
    grant.toggleLoading = true;
    
    const newVisibility = !grant.isVisible;
    const result = await api.badge.updateVisibility({
      userId: grant.userId,
      badgeId: currentBadge.value.id,
      isVisible: newVisibility
    });
    
    if (result.success) {
      ElMessage.success(result.message || `徽章已${newVisibility ? '显示' : '隐藏'}`);
      
      // 更新本地状态
      grant.isVisible = newVisibility;
      
      // 刷新授予记录以保持数据同步
      await loadGrantsData();
    } else {
      ElMessage.error(result.message || '更新可见性失败');
    }
  } catch (error) {
    console.error('更新徽章可见性失败:', error);
    ElMessage.error('更新徽章可见性失败');
  } finally {
    grant.toggleLoading = false;
  }
};

// 撤销徽章
const handleRevokeBadge = async (grant) => {
  try {
    await ElMessageBox.confirm(
      `确定要撤销用户 "${grant.user?.nickname || grant.user?.username}" 的徽章 "${currentBadge.value.name}" 吗？`,
      '撤销徽章确认',
      {
        confirmButtonText: '确定撤销',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    );
    
    // 添加loading状态
    grant.revokeLoading = true;
    
    const result = await api.badge.revokeBadge({
      userId: grant.userId,
      badgeId: currentBadge.value.id
    });
    
    if (result.success) {
      ElMessage.success(result.message || '徽章撤销成功');
      
      // 刷新授予记录
      await loadGrantsData();
    } else {
      ElMessage.error(result.message || '撤销徽章失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('撤销徽章失败:', error);
      ElMessage.error('撤销徽章失败');
    }
  } finally {
    grant.revokeLoading = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadBadgeList();
};

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = '';
  });
  handleSearch();
};

const submitBadgeForm = () => {
  if (!badgeFormRef.value) return;
  
  badgeFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      
      try {
        let result;
        const formData = { ...badgeForm };
        
        // 移除icon字段，使用统一认证图标
        delete formData.icon;
        
        // 确保sortOrder是数字类型
        if (formData.sortOrder !== undefined) {
          formData.sortOrder = parseInt(formData.sortOrder) || 0;
        }
        
        // 移除id字段，因为ID在URL路径中传递
        const badgeId = formData.id;
        delete formData.id;
        
        // 处理授予条件
        if (formData.autoGrant && formData.grantCondition) {
          try {
            formData.grantCondition = JSON.parse(formData.grantCondition);
          } catch (e) {
            ElMessage.error('授予条件JSON格式错误');
            submitLoading.value = false;
            return;
          }
        } else {
          formData.grantCondition = null;
        }
        


        if (dialogType.value === 'add') {
          result = await api.badge.create(formData);
        } else {
          result = await api.badge.update(badgeId, formData);
        }
        
        if (result.success) {
          dialogVisible.value = false;
          ElMessage.success(dialogType.value === 'add' ? '添加徽章成功' : '更新徽章成功');
          
          // 刷新列表
          await loadBadgeList();
        } else {
          ElMessage.error(result.message || `${dialogType.value === 'add' ? '添加' : '更新'}徽章失败`);
        }
              } catch (error) {
          console.error(`${dialogType.value === 'add' ? '添加' : '更新'}徽章出错:`, error);
          

          // 显示详细错误信息
          let errorMessage = `${dialogType.value === 'add' ? '添加' : '更新'}徽章失败，请稍后再试`;
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.data?.errors) {
            const errors = error.response.data.errors;
            errorMessage = errors.map(err => `${err.field}: ${err.message}`).join('; ');
          }
          
          ElMessage.error(errorMessage);
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

const resetForm = () => {
  if (badgeFormRef.value) {
    badgeFormRef.value.resetFields();
  }
  
  badgeForm.id = null;
  badgeForm.name = '';
  badgeForm.description = '';
  badgeForm.color = '#3498db';

  badgeForm.type = 'achievement';
  badgeForm.rarity = 'common';
  badgeForm.autoGrant = false;
  badgeForm.grantCondition = '';
  badgeForm.sortOrder = 0;
  badgeForm.status = 'active';
};

const handleSizeChange = (size) => {
  pageSize.value = size;
  loadBadgeList();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  loadBadgeList();
};

const loadBadgeList = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...searchForm,
      // 添加时间戳避免缓存
      _t: Date.now()
    };
    
    // 过滤空值（但保留时间戳）
    Object.keys(params).forEach(key => {
      if (key !== '_t' && (params[key] === '' || params[key] === null)) {
        delete params[key];
      }
    });
    
    console.log('📋 加载徽章列表，参数:', params);
    const response = await api.badge.getAdminList(params);
    
    if (response.success) {
      const newBadges = response.data.items || [];
      const newTotal = response.data.total || 0;
      
      console.log('📊 获取到徽章数据:', {
        itemsCount: newBadges.length,
        total: newTotal,
        badges: newBadges.map(badge => ({ id: badge.id, name: badge.name }))
      });
      
      badgeList.value = newBadges;
      total.value = newTotal;
    } else {
      ElMessage.error('获取徽章列表失败');
    }
  } catch (error) {
    console.error('加载徽章列表出错:', error);
    ElMessage.error('加载徽章列表失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 在组件挂载时加载数据
onMounted(() => {
  loadBadgeList();
});
</script>

<style scoped>
.badge-management-container {
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
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-container {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.badge-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 12px;
}

.badge-name {
  font-size: 14px;
  font-weight: 500;
}

.table-badge-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1); /* 将图标变为白色 */
}

/* 图标预览样式 */
.icon-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  background-color: #fafafa;
}

.icon-preview .badge-icon {
  width: 32px;
  height: 32px;
  filter: opacity(0.8);
  background-color: #409EFF !important;
  border-radius: 6px;
}

.icon-text {
  color: #606266;
  font-size: 14px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.dialog-footer {
  text-align: right;
}

/* 徽章ID显示样式 */
.badge-id-display {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  background-color: #f5f5f5;
}

.badge-id-display:hover {
  background-color: #e6f7ff;
  color: #1890ff;
}

/* 操作按钮样式优化 */
:deep(.el-table__body .el-button + .el-button) {
  margin-left: 4px;
}

:deep(.el-table__body .el-button) {
  padding: 5px 8px;
  font-size: 12px;
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