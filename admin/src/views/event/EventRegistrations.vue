<template>
  <div class="registrations-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h3>{{ eventTitle }} - 报名管理</h3>
            <el-tag v-if="eventData.status">{{ getStatusText(eventData.status) }}</el-tag>
          </div>
          <div class="header-right">
            <el-button type="success" @click="showExportOptions">
              <el-icon><Download /></el-icon> 导出Excel
            </el-button>
            <el-button @click="goBack">返回活动列表</el-button>
          </div>
        </div>
      </template>
      
      <!-- 活动基本信息 -->
      <div class="event-info" v-if="eventData.id">
        <div class="info-row">
          <div class="info-item">
            <span class="info-label">活动ID:</span>
            <span class="info-value">{{ eventData.id }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">报名人数:</span>
            <span class="info-value">{{ registrations.length }}/{{ eventData.maxParticipants || '不限' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">报名时段:</span>
            <span class="info-value">{{ formatDateTime(eventData.registrationStartTime) || '不限' }} - {{ formatDateTime(eventData.registrationDeadline) || '不限' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">活动时间:</span>
            <span class="info-value">{{ formatDateTime(eventData.startTime) }} - {{ formatDateTime(eventData.endTime) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 筛选和搜索 -->
      <div class="filter-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户名/手机/邮箱"
          clearable
          class="filter-item search-input"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="statusFilter"
          placeholder="报名状态"
          clearable
          class="filter-item"
        >
          <el-option label="全部" value="" />
          <el-option label="已取消" :value="0" />
          <el-option label="已报名" :value="1" />
          <el-option label="已参加" :value="2" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          class="filter-item date-picker"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetFilter">重置</el-button>
      </div>
      
      <!-- 批量操作 -->
      <div class="batch-actions">
        <el-button
          type="primary"
          :disabled="!selectedRegistrations.length"
          @click="batchUpdateStatus(1)"
        >
          批量标记已报名
        </el-button>
        <el-button
          type="success"
          :disabled="!selectedRegistrations.length"
          @click="batchUpdateStatus(2)"
        >
          批量标记已参加
        </el-button>
        <el-button
          type="danger"
          :disabled="!selectedRegistrations.length"
          @click="batchUpdateStatus(0)"
        >
          批量取消报名
        </el-button>
        <span v-if="selectedRegistrations.length" class="selected-count">
          已选择 {{ selectedRegistrations.length }} 条记录
        </span>
      </div>
      
      <!-- 报名列表 -->
      <el-table 
        :data="filteredRegistrations" 
        style="width: 100%" 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="ID" width="100">
          <template #default="scope">
            <el-tooltip :content="scope.row.id" placement="top">
              <span class="registration-id-display">{{ formatId(scope.row.id) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="昵称" width="120">
          <template #default="scope">
            {{ scope.row.user?.nickname || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="账号" width="120">
          <template #default="scope">
            {{ scope.row.user?.username || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getRegistrationTagType(scope.row.status)">
              {{ getRegistrationStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="registrationTime" label="报名时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.registered_at || scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="showFormDetails(scope.row)"
            >
              查看详情
            </el-button>
            <el-dropdown @command="(command) => handleStatusChange(scope.row, command)" trigger="click">
              <el-button size="small">
                更改状态 <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    :disabled="scope.row.status === 1"
                    :command="1"
                  >
                    已报名
                  </el-dropdown-item>
                  <el-dropdown-item
                    :disabled="scope.row.status === 2"
                    :command="2"
                  >
                    已参加
                  </el-dropdown-item>
                  <el-dropdown-item
                    :disabled="scope.row.status === 0"
                    :command="0"
                  >
                    取消报名
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 表单详情对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      title="报名表单详情"
      width="600px"
      destroy-on-close
    >
      <div class="form-details" v-if="currentRegistration">
        <div class="detail-header">
          <h3>{{ currentRegistration.user?.nickname || currentRegistration.user?.username || '未知用户' }} 的报名信息</h3>
          <el-tag :type="getRegistrationTagType(currentRegistration.status)">
            {{ getRegistrationStatusText(currentRegistration.status) }}
          </el-tag>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">用户ID:</span>
          <div class="user-id-detail">
            <span class="id-text">{{ currentRegistration.user?.id || '-' }}</span>
            <el-button
              v-if="currentRegistration.user?.id"
              type="text"
              size="small"
              @click="copyToClipboard(currentRegistration.user.id)"
              class="copy-btn"
            >
              <el-icon><DocumentCopy /></el-icon>
            </el-button>
          </div>
        </div>

        <div class="detail-item">
          <span class="detail-label">用户名:</span>
          <span class="detail-value">{{ currentRegistration.user?.username || '-' }}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">昵称:</span>
          <span class="detail-value">{{ currentRegistration.user?.nickname || '-' }}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">报名时间:</span>
          <span class="detail-value">{{ formatDateTime(currentRegistration.registered_at || currentRegistration.created_at) }}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">报名状态:</span>
          <span class="detail-value">{{ getRegistrationStatusText(currentRegistration.status) }}</span>
        </div>

        <el-divider>报名表单内容</el-divider>

        <!-- 只有当用户真正填写了表单数据时才显示 -->
        <template v-if="hasFormData(currentRegistration.form_data)">
          <!-- 显示用户填写的表单数据 -->
          <div class="user-form-data">
            <div class="form-item" v-for="(value, key) in currentRegistration.form_data" :key="key">
              <span class="form-label">{{ getFormFieldLabel(key) }}:</span>
              <span class="form-value">{{ formatFormValue(value) }}</span>
            </div>
          </div>
        </template>

        <!-- 如果没有表单数据，显示说明 -->
        <template v-else>
          <div class="form-explanation">
            <el-alert
              title="表单说明"
              type="info"
              :closable="false"
              show-icon
            >
              <template v-if="!eventData?.form_config || eventData.form_config.length === 0">
                此活动未配置自定义报名表单，用户只需点击报名即可参与。
              </template>
              <template v-else>
                此活动配置了自定义报名表单，但该用户报名时未填写表单数据。
                <br>
                <strong>活动配置的表单字段：</strong>
                <div class="form-fields-info">
                  <div v-for="(field, index) in eventData.form_config" :key="field.name" class="field-info">
                    <el-tag size="small" type="warning">
                      {{ field.label || field.title || field.name }}
                      <span v-if="field.required" style="color: red;">*</span>
                    </el-tag>
                    <span class="field-type">{{ field.type || '文本' }}</span>
                    <span class="field-status">未填写</span>
                  </div>
                </div>
                <div class="form-note">
                  <el-text type="info" size="small">
                    注：以上为活动配置的表单字段，该用户报名时未提交这些信息。
                  </el-text>
                </div>
              </template>
            </el-alert>
          </div>
        </template>
        
        <el-divider>操作</el-divider>
        
        <div class="action-buttons">
          <el-button
            type="primary"
            :disabled="currentRegistration.status === 1"
            @click="handleStatusChange(currentRegistration, 1)"
          >
            标记为已报名
          </el-button>
          <el-button
            type="success"
            :disabled="currentRegistration.status === 2"
            @click="handleStatusChange(currentRegistration, 2)"
          >
            标记为已参加
          </el-button>
          <el-button
            type="danger"
            :disabled="currentRegistration.status === 0"
            @click="handleStatusChange(currentRegistration, 0)"
          >
            取消报名
          </el-button>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="formDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 导出选项对话框 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="选择导出字段"
      width="500px"
      destroy-on-close
    >
      <div class="export-options">
        <h4>基本信息 
          <span class="field-actions">
            <el-button type="primary" link @click="toggleAllBaseFields(true)">全选</el-button>
            <el-button type="danger" link @click="toggleAllBaseFields(false)">取消全选</el-button>
          </span>
        </h4>
        
        <div class="field-list">
          <el-checkbox 
            v-for="field in exportOptions.baseFields" 
            :key="field.key"
            v-model="field.selected"
          >
            {{ field.label }}
          </el-checkbox>
        </div>
        
        <el-divider v-if="exportOptions.formFields.length > 0"></el-divider>
        
        <template v-if="exportOptions.formFields.length > 0">
          <h4>表单字段
            <span class="field-actions">
              <el-button type="primary" link @click="toggleAllFormFields(true)">全选</el-button>
              <el-button type="danger" link @click="toggleAllFormFields(false)">取消全选</el-button>
            </span>
          </h4>
          
          <div class="field-list">
            <el-checkbox 
              v-for="field in exportOptions.formFields" 
              :key="field.key"
              v-model="field.selected"
            >
              {{ field.label }}
            </el-checkbox>
          </div>
        </template>
        
        <div class="export-notice" v-if="exportOptions.baseFields.filter(f => f.selected).length === 0 && exportOptions.formFields.filter(f => f.selected).length === 0">
          <el-alert
            title="请至少选择一个导出字段"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="exportToExcel"
            :disabled="exportOptions.baseFields.filter(f => f.selected).length === 0 && exportOptions.formFields.filter(f => f.selected).length === 0"
          >
            导出
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Download, ArrowDown, DocumentCopy } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx'; // 需要安装: npm install xlsx
import api from '../../utils/api.js';
import { formatId } from '../../utils/format.js';
import axios from 'axios';

// 路由信息
const route = useRoute();
const router = useRouter();
const eventId = ref('');
const eventTitle = ref('');

// 列表数据
const loading = ref(false);
const registrations = ref([]);
const eventData = ref({});
const currentRegistration = ref(null);
const selectedRegistrations = ref([]);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 搜索和筛选
const searchQuery = ref('');
const statusFilter = ref('');
const dateRange = ref([]);
const formDialogVisible = ref(false);

// 导出相关数据和方法
const exportDialogVisible = ref(false);
const exportOptions = ref({
  baseFields: [
    { label: 'ID', key: 'id', selected: true },
    { label: '账号', key: 'username', selected: true },
    { label: '昵称', key: 'nickname', selected: true },
    { label: '报名时间', key: 'registerTime', selected: true },
    { label: '状态', key: 'status', selected: true }
  ],
  formFields: []
});

// 生命周期
onMounted(() => {
  // 从路由参数获取活动ID和标题
  const id = route.params.id;
  const title = route.query.title;
  
  if (id) {
    eventId.value = id;
    eventTitle.value = title || `活动 #${id}`;
    fetchEventData();
    fetchRegistrations();
  } else {
    ElMessage.error('活动ID不能为空');
    goBack();
  }
});

// 计算属性：过滤后的报名列表
const filteredRegistrations = computed(() => {
  let result = [...registrations.value];
  
  // 按状态筛选
  if (statusFilter.value) {
    result = result.filter(item => item.status === statusFilter.value);
  }
  
  // 按搜索关键词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(item => {
      return (
        (item.username && item.username.toLowerCase().includes(query)) ||
        (item.userInfo?.name && item.userInfo.name.toLowerCase().includes(query)) ||
        (item.userInfo?.phone && item.userInfo.phone.includes(query)) ||
        (item.userInfo?.email && item.userInfo.email.toLowerCase().includes(query))
      );
    });
  }
  
  // 按日期范围筛选
  if (dateRange.value && dateRange.value.length === 2) {
    const startDate = new Date(dateRange.value[0]);
    const endDate = new Date(dateRange.value[1]);
    endDate.setHours(23, 59, 59, 999); // 设置为当天结束时间
    
    result = result.filter(item => {
      const registrationDate = new Date(item.created_at);
      return registrationDate >= startDate && registrationDate <= endDate;
    });
  }
  
  return result;
});

// 方法
const fetchEventData = async () => {
  loading.value = true;
  try {
    const res = await api.events.getDetail(eventId.value);
    if (res.success) {
      eventData.value = res.data.event; // 修复：活动数据在 data.event 中
      // 如果没有设置标题，使用API返回的标题
      if (!eventTitle.value || eventTitle.value === `活动 #${eventId.value}`) {
        eventTitle.value = res.data.title;
      }
    } else {
      ElMessage.error(res.message || '获取活动详情失败');
    }
  } catch (error) {
    console.error('获取活动详情错误:', error);
    ElMessage.error(error.message || '加载活动详情失败');
  } finally {
    loading.value = false;
  }
};

const fetchRegistrations = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      status: statusFilter.value || undefined,
      startDate: dateRange.value && dateRange.value[0] ? dateRange.value[0] : undefined,
      endDate: dateRange.value && dateRange.value[1] ? dateRange.value[1] : undefined,
      keyword: searchQuery.value || undefined
    };
    
    const res = await api.events.getRegistrations(eventId.value, params);
    if (res.success) {
      registrations.value = res.data.registrations || [];
      total.value = res.data.pagination?.total || registrations.value.length;
    } else {
      ElMessage.error(res.message || '获取报名列表失败');
    }
  } catch (error) {
    console.error('获取报名列表错误:', error);
    ElMessage.error(error.message || '加载报名列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchRegistrations();
};

const resetFilter = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  dateRange.value = [];
  handleSearch();
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchRegistrations();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchRegistrations();
};

const handleSelectionChange = (selection) => {
  selectedRegistrations.value = selection;
};

const batchUpdateStatus = async (status) => {
  if (!selectedRegistrations.value.length) {
    ElMessage.warning('请先选择要操作的报名记录');
    return;
  }
  
  const action = getRegistrationStatusText(status);
  
  try {
    await ElMessageBox.confirm(`确定要批量${action}所选的${selectedRegistrations.value.length}条报名记录吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    loading.value = true;
    
    const registrationIds = selectedRegistrations.value.map(item => item.id);
    const res = await api.events.batchUpdateRegistrationStatus(eventId.value, {
      registrationIds,
      status
    });
    
    if (res.success) {
      ElMessage.success(`批量${action}成功`);
      fetchRegistrations(); // 刷新列表
    } else {
      ElMessage.error(res.message || `批量${action}失败`);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`批量${action}失败:`, error);
      ElMessage.error(error.message || `批量${action}失败`);
    }
  } finally {
    loading.value = false;
  }
};

const handleStatusChange = async (registration, status) => {
  const action = getRegistrationStatusText(status);
  const originalStatus = registration.status;
  
  try {
    await ElMessageBox.confirm(`确定要${action}该用户的报名吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    loading.value = true;
    
    const res = await api.events.updateRegistrationStatus(eventId.value, registration.id, {
      status
    });
    
    if (res.success) {
      // 更新本地数据状态
      registration.status = status;
      
      if (currentRegistration.value && currentRegistration.value.id === registration.id) {
        currentRegistration.value.status = status;
      }
      
      ElMessage.success(`报名状态已更新为: ${action}`);
    } else {
      ElMessage.error(res.message || `更新状态失败`);
      // 恢复原始状态
      registration.status = originalStatus;
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`更新报名状态失败:`, error);
      ElMessage.error(error.message || `更新状态失败`);
    }
  } finally {
    loading.value = false;
  }
};

const showFormDetails = (registration) => {
  currentRegistration.value = registration;
  formDialogVisible.value = true;
};

const getFormFieldLabel = (fieldName) => {
  // 查找表单字段的标签
  if (eventData.value && eventData.value.form_config) {
    const field = eventData.value.form_config.find(f => f.name === fieldName);
    return field ? (field.label || field.title) : fieldName;
  }
  return fieldName;
};

// 检查是否有有效的表单数据
const hasFormData = (formData) => {
  if (!formData || typeof formData !== 'object') {
    return false;
  }

  const keys = Object.keys(formData);
  if (keys.length === 0) {
    return false;
  }

  // 检查是否有非空值
  return keys.some(key => {
    const value = formData[key];
    return value !== null && value !== undefined && value !== '';
  });
};

// 格式化表单值显示
const formatFormValue = (value) => {
  if (value === null || value === undefined) {
    return '未填写';
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
};

const getStatusText = (status) => {
  const map = {
    'upcoming': '未开始',
    'ongoing': '进行中',
    'ended': '已结束',
    'canceled': '已取消'
  };
  return map[status] || '未知';
};

const getRegistrationStatusText = (status) => {
  // 使用数字状态（与数据库一致）
  const map = {
    0: '已取消',
    1: '已报名',
    2: '已参加'
  };
  return map[status] || '未知';
};

const getRegistrationTagType = (status) => {
  const map = {
    0: 'warning',  // 已取消
    1: 'success',  // 已报名
    2: 'success'   // 已参加
  };
  return map[status] || '';
};

// 复制到剪贴板
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success('已复制到剪贴板');
  } catch (err) {
    console.error('复制失败:', err);
    ElMessage.error('复制失败');
  }
};

const formatDateTime = (timestamp) => {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error('日期格式化错误:', e);
    return timestamp;
  }
};

const goBack = () => {
  router.push('/event/list');
};

// 打开导出选项对话框
const showExportOptions = async () => {
  // 获取表单字段信息
  try {
  loading.value = true;
    const res = await api.events.getDetail(eventId.value);
    if (res.success && res.data && res.data.event) {
      // 如果有注册表单字段，添加到选项中
      if (res.data.event.form_config && Array.isArray(res.data.event.form_config)) {
        exportOptions.value.formFields = res.data.event.form_config.map(field => ({
          label: field.label || field.title || field.name,
          key: field.name,
          selected: true
        }));
      } else {
        exportOptions.value.formFields = [];
      }
      
      // 如果没有获取到注册表单字段，尝试从现有报名数据中提取
      if (exportOptions.value.formFields.length === 0 && registrations.value.length > 0) {
        const formFieldsSet = new Set();
        registrations.value.forEach(reg => {
          if (reg.form_data && typeof reg.form_data === 'object') {
            Object.keys(reg.form_data).forEach(key => formFieldsSet.add(key));
          }
        });
        
        exportOptions.value.formFields = Array.from(formFieldsSet).map(field => ({
          label: field,
          key: field,
          selected: true
        }));
      }
      
      exportDialogVisible.value = true;
      } else {
      ElMessage.error('获取活动表单字段失败');
      }
  } catch (error) {
    console.error('获取表单字段错误:', error);
    ElMessage.error('获取表单字段失败');
  } finally {
      loading.value = false;
  }
};

// 全选/取消全选基本字段
const toggleAllBaseFields = (selected) => {
  exportOptions.value.baseFields.forEach(field => {
    field.selected = selected;
    });
};

// 全选/取消全选表单字段
const toggleAllFormFields = (selected) => {
  exportOptions.value.formFields.forEach(field => {
    field.selected = selected;
  });
};

const exportToExcel = async () => {
  loading.value = true;
  console.log('开始请求导出数据，活动ID:', eventId.value);
  
  try {
    // 获取选中的字段
    const selectedBaseFields = exportOptions.value.baseFields
      .filter(field => field.selected)
      .map(field => field.key);
    
    const selectedFormFields = exportOptions.value.formFields
      .filter(field => field.selected)
      .map(field => field.key);
    
    // 获取Excel文件
    const token = localStorage.getItem('admin_token');
    const response = await axios({
      method: 'get',
      url: `http://localhost:3000/api/admin/events/${eventId.value}/registrations/export`,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      params: {
        _t: new Date().getTime(),
        baseFields: selectedBaseFields.join(','),
        formFields: selectedFormFields.join(',')
      },
      responseType: 'blob' // 接收二进制数据
    });
    
    // 创建Blob对象
    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
  const fileName = `${eventTitle.value || '活动'}_报名信息_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    // 创建下载链接并自动点击
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 释放URL对象
    window.URL.revokeObjectURL(url);
  
    ElMessage.success('导出Excel成功');
    exportDialogVisible.value = false;
  } catch (error) {
    console.error('导出Excel失败:', error);
    ElMessage.error('导出Excel失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.registrations-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-left h3 {
  margin: 0;
  font-size: 18px;
  margin-right: 10px;
}

.event-info {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  flex-wrap: wrap;
}

.info-item {
  margin-right: 30px;
  margin-bottom: 5px;
}

.info-label {
  font-weight: bold;
  margin-right: 5px;
  color: #606266;
}

.info-value {
  color: #333;
}

.filter-container {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.filter-item {
  margin-right: 10px;
  margin-bottom: 10px;
}

.search-input {
  width: 200px;
}

.date-picker {
  width: 260px;
}

.batch-actions {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.selected-count {
  margin-left: 15px;
  color: #606266;
  font-size: 14px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.form-details {
  padding: 10px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.detail-header h3 {
  margin: 0;
  font-size: 16px;
}

.detail-item {
  margin-bottom: 10px;
}

.detail-label {
  font-weight: bold;
  margin-right: 5px;
  color: #606266;
}

.detail-value {
  color: #333;
}

.form-item {
  margin-bottom: 10px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.form-label {
  font-weight: bold;
  margin-right: 5px;
  color: #606266;
  display: inline-block;
  min-width: 80px;
}

.form-value {
  color: #333;
}

.empty-form {
  padding: 20px 0;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

.export-options {
  padding: 10px;
}

.field-actions {
  float: right;
}

.field-list {
  margin-top: 10px;
  margin-left: 20px;
}

.export-notice {
  margin-top: 10px;
}

/* 报名ID显示样式 */
.registration-id-display {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  background-color: #f5f5f5;
}

.registration-id-display:hover {
  background-color: #e6f7ff;
  color: #1890ff;
}

/* 用户ID详情样式 */
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

/* 表单字段信息样式 */
.form-fields-info {
  margin-top: 8px;
}

.field-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.field-type {
  font-size: 12px;
  color: #999;
}

.field-status {
  font-size: 12px;
  color: #f56c6c;
  font-weight: 500;
}

.form-explanation {
  padding: 10px 0;
}

.form-note {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}
</style> 