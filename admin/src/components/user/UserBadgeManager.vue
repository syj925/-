<template>
  <el-dialog
    v-model="dialogVisible"
    title="管理用户徽章"
    width="600px"
    @closed="handleClosed"
  >
    <div class="badge-management" v-loading="badgeLoading">
      <div class="user-info">
        <strong>用户:</strong> {{ user?.nickname || user?.username }} (ID: {{ formatUserId(user?.id) }})
      </div>
      
      <!-- 未保存更改提示 -->
      <el-alert
        v-if="hasUnsavedChanges"
        title="有未保存的更改"
        type="warning"
        description="您对徽章的修改尚未保存，请点击保存更改按钮确认操作"
        show-icon
        :closable="false"
        style="margin: 10px 0;"
      />
      
      <div class="badge-section">
        <h4>已分配徽章</h4>
        <div class="badge-list">
          <template v-if="userBadges.length > 0">
            <el-tag
              v-for="userBadge in userBadges"
              :key="userBadge.id"
              :style="{backgroundColor: userBadge.badge?.color || '#4A90E2', color: '#fff'}"
              class="badge-item clickable"
              @click="removeUserBadge(userBadge)"
            >
              {{ userBadge.badge?.name || userBadge.name }}
              <el-icon class="delete-icon"><Delete /></el-icon>
            </el-tag>
          </template>
          <div v-else class="no-badges-msg">该用户暂无徽章</div>
        </div>
      </div>
      
      <div class="badge-section">
        <div class="section-header">
          <h4>可添加徽章</h4>
          <el-button type="primary" size="small" @click="openCreateBadgeForm">创建新徽章</el-button>
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
          <div v-else class="no-badges-msg">没有可添加的徽章</div>
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancelBadgeChanges">取消</el-button>
        <el-button 
          type="primary" 
          @click="saveBadgeChanges"
          :loading="badgeLoading"
          :disabled="!hasUnsavedChanges"
        >
          保存更改
        </el-button>
      </span>
    </template>

    <!-- 创建徽章对话框 -->
    <el-dialog
      v-model="createBadgeDialogVisible"
      title="创建新徽章"
      width="500px"
      append-to-body
    >
      <el-form 
        ref="badgeFormRef" 
        :model="badgeForm" 
        :rules="badgeFormRules" 
        label-width="80px"
        v-loading="createBadgeLoading"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="badgeForm.name" placeholder="请输入徽章名称"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="badgeForm.description" type="textarea" placeholder="请输入徽章描述"></el-input>
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="badgeForm.color"></el-color-picker>
          <span class="color-preview" :style="{backgroundColor: badgeForm.color}"></span>
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="badgeForm.icon" placeholder="请输入图标名称（如：StarFilled）"></el-input>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="badgeForm.type" style="width: 100%">
            <el-option label="成就徽章" value="achievement" />
            <el-option label="兴趣标签" value="interest" />
            <el-option label="系统标签" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="稀有度" prop="rarity">
          <el-select v-model="badgeForm.rarity" style="width: 100%">
            <el-option label="普通" value="common" />
            <el-option label="稀有" value="rare" />
            <el-option label="史诗" value="epic" />
            <el-option label="传说" value="legendary" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="badgeForm.status" style="width: 100%">
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createBadgeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreateBadge" :loading="createBadgeLoading">创建</el-button>
        </span>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete } from '@element-plus/icons-vue';
import api from '@/utils/api';
import { formatId as formatUserId } from '@/utils/format';

const props = defineProps({
  visible: Boolean,
  user: Object
});

const emit = defineEmits(['update:visible', 'refresh']);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
});

// State
const badgeLoading = ref(false);
const userBadges = ref([]);
const availableBadges = ref([]);
const allBadges = ref([]);
const originalUserBadges = ref([]);
const pendingChanges = ref({
  toAdd: [],
  toRemove: []
});
const hasUnsavedChanges = ref(false);
const badgeOperationLock = ref(false);
const currentAbortController = ref(null);

// Create Badge State
const createBadgeDialogVisible = ref(false);
const createBadgeLoading = ref(false);
const badgeFormRef = ref(null);
const badgeForm = ref({
  name: '',
  description: '',
  color: '#4A90E2',
  icon: 'StarFilled',
  type: 'achievement',
  rarity: 'common',
  status: 'enabled'
});
const badgeFormRules = {
  name: [
    { required: true, message: '请输入徽章名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }
  ],
  color: [
    { required: true, message: '请选择徽章颜色', trigger: 'change' }
  ],
  icon: [
    { required: true, message: '请输入徽章图标', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择徽章类型', trigger: 'change' }
  ],
  rarity: [
    { required: true, message: '请选择稀有度', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
};

// Watchers
watch(() => props.visible, (newVal) => {
  if (newVal && props.user) {
    loadData();
  }
});

const handleClosed = () => {
  // Release lock and abort controller
  badgeOperationLock.value = false;
  if (currentAbortController.value) {
    currentAbortController.value.abort();
    currentAbortController.value = null;
  }
};

const loadData = async () => {
  if (badgeOperationLock.value) return;
  
  if (currentAbortController.value) {
    currentAbortController.value.abort();
  }
  
  badgeOperationLock.value = true;
  currentAbortController.value = new AbortController();
  const signal = currentAbortController.value.signal;
  
  badgeLoading.value = true;
  
  try {
    if (signal.aborted) throw new Error('Request aborted');
    
    // Load all badges
    const badgesRes = await api.badge.getAdminList({ limit: 100 });
    if (signal.aborted) throw new Error('Request aborted');
    
    if (badgesRes.success) {
      allBadges.value = badgesRes.data.items || [];
    }
    
    // Load user badges
    const userBadgesRes = await api.badge.getUserBadges(props.user.id, false);
    if (signal.aborted) throw new Error('Request aborted');
    
    if (userBadgesRes.success) {
      const rawData = userBadgesRes.data?.items || userBadgesRes.data || [];
      userBadges.value = [...rawData];
      originalUserBadges.value = [...rawData];
      
      availableBadges.value = allBadges.value.filter(badge => 
        !userBadges.value.some(userBadge => 
          (userBadge.badge?.id === badge.id) || (userBadge.badge_id === badge.id)
        )
      );
    }
    
    pendingChanges.value = { toAdd: [], toRemove: [] };
    hasUnsavedChanges.value = false;
    
  } catch (error) {
    if (error.message !== 'Request aborted') {
      console.error('获取徽章数据失败:', error);
      ElMessage.error('获取徽章数据失败');
    }
  } finally {
    badgeLoading.value = false;
    badgeOperationLock.value = false;
    currentAbortController.value = null;
  }
};

const addUserBadge = (badge) => {
  const newUserBadge = {
    id: `temp-${Date.now()}`,
    user_id: props.user.id,
    badge_id: badge.id,
    badge: badge,
    is_visible: true,
    granted_at: new Date().toISOString(),
    isNew: true
  };
  
  userBadges.value.push(newUserBadge);
  availableBadges.value = availableBadges.value.filter(b => b.id !== badge.id);
  pendingChanges.value.toAdd.push(badge);
  
  const removeIndex = pendingChanges.value.toRemove.findIndex(b => b.id === badge.id);
  if (removeIndex > -1) {
    pendingChanges.value.toRemove.splice(removeIndex, 1);
  }
  
  hasUnsavedChanges.value = true;
};

const removeUserBadge = (userBadge) => {
  const badgeId = userBadge.badge?.id || userBadge.badge_id;
  const badgeName = userBadge.badge?.name || userBadge.name;
  
  const removedBadge = userBadge.badge || { id: badgeId, name: badgeName };
  availableBadges.value.push(removedBadge);
  userBadges.value = userBadges.value.filter(ub => ub.id !== userBadge.id);
  
  if (userBadge.isNew) {
    const addIndex = pendingChanges.value.toAdd.findIndex(b => b.id === badgeId);
    if (addIndex > -1) {
      pendingChanges.value.toAdd.splice(addIndex, 1);
    }
  } else {
    pendingChanges.value.toRemove.push(removedBadge);
  }
  
  hasUnsavedChanges.value = true;
};

const saveBadgeChanges = async () => {
  if (!hasUnsavedChanges.value) return;
  if (badgeLoading.value) return;
  
  badgeLoading.value = true;
  
  try {
    let successCount = 0;
    let errorCount = 0;
    const chunkSize = 3;
    
    // Add
    for (let i = 0; i < pendingChanges.value.toAdd.length; i += chunkSize) {
      const chunk = pendingChanges.value.toAdd.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(async (badge) => {
        try {
          const result = await api.badge.grantUserBadge(props.user.id, badge.id);
          return { success: result.success };
        } catch (error) {
          return { success: false };
        }
      });
      const results = await Promise.all(chunkPromises);
      results.forEach(r => r.success ? successCount++ : errorCount++);
    }
    
    // Remove
    for (let i = 0; i < pendingChanges.value.toRemove.length; i += chunkSize) {
      const chunk = pendingChanges.value.toRemove.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(async (badge) => {
        try {
          const result = await api.badge.revokeBadge({
            userId: props.user.id,
            badgeId: badge.id
          });
          return { success: result.success };
        } catch (error) {
          return { success: false };
        }
      });
      const results = await Promise.all(chunkPromises);
      results.forEach(r => r.success ? successCount++ : errorCount++);
    }
    
    if (errorCount === 0) {
      ElMessage.success(`徽章更改保存成功！`);
    } else {
      ElMessage.warning(`部分操作失败：成功 ${successCount} 项，失败 ${errorCount} 项`);
    }
    
    pendingChanges.value = { toAdd: [], toRemove: [] };
    hasUnsavedChanges.value = false;
    dialogVisible.value = false;
    emit('refresh');
    
  } catch (error) {
    console.error('保存徽章变更失败:', error);
    ElMessage.error('保存徽章变更失败');
  } finally {
    badgeLoading.value = false;
  }
};

const cancelBadgeChanges = () => {
  if (hasUnsavedChanges.value) {
    ElMessageBox.confirm('您有未保存的更改，确定要取消吗？', '确认取消', {
      confirmButtonText: '确定',
      cancelButtonText: '继续编辑',
      type: 'warning'
    }).then(() => {
      userBadges.value = [...originalUserBadges.value];
      availableBadges.value = allBadges.value.filter(badge => 
        !userBadges.value.some(userBadge => 
          (userBadge.badge?.id === badge.id) || (userBadge.badge_id === badge.id)
        )
      );
      pendingChanges.value = { toAdd: [], toRemove: [] };
      hasUnsavedChanges.value = false;
      dialogVisible.value = false;
    }).catch(() => {});
  } else {
    dialogVisible.value = false;
  }
};

const openCreateBadgeForm = () => {
  createBadgeDialogVisible.value = true;
  badgeForm.value = {
    name: '',
    description: '',
    color: '#4A90E2',
    icon: 'StarFilled',
    type: 'achievement',
    rarity: 'common',
    status: 'enabled'
  };
};

const submitCreateBadge = async () => {
  if (!badgeFormRef.value) return;
  await badgeFormRef.value.validate(async (valid) => {
    if (!valid) return;
    createBadgeLoading.value = true;
    try {
      const result = await api.badge.create(badgeForm.value);
      if (result.success) {
        const newBadge = result.data;
        availableBadges.value.push(newBadge);
        allBadges.value.push(newBadge);
        createBadgeDialogVisible.value = false;
        ElMessage.success(`徽章"${newBadge.name}"创建成功`);
      } else {
        ElMessage.error(result.message || '创建徽章失败');
      }
    } catch (error) {
      console.error('创建徽章出错:', error);
      ElMessage.error(error.message || '创建徽章失败');
    } finally {
      createBadgeLoading.value = false;
    }
  });
};
</script>

<style scoped>
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

.badge-item {
  margin-right: 4px;
  margin-bottom: 4px;
}

.clickable {
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
}

.clickable:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.delete-icon {
  margin-left: 5px;
  font-size: 12px;
  opacity: 0.5;
}

.clickable:hover .delete-icon {
  opacity: 1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-header h4 {
  margin: 0;
  border-bottom: none;
}

.color-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  margin-left: 10px;
  border: 1px solid #ddd;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
