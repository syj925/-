<template>
  <div class="message-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>系统通知管理</h3>
          <el-button type="primary" @click="handleCreateSystemMessage">
            <el-icon><Plus /></el-icon> 发送系统通知
          </el-button>
        </div>
      </template>
          
          <!-- 搜索和筛选 -->
          <div class="filter-container">
            <el-input
              v-model="systemSearchQuery"
              placeholder="搜索通知标题"
              clearable
              class="filter-item search-input"
              @keyup.enter="handleSystemSearch"
            />
            <el-select
              v-model="systemMessageType"
              placeholder="通知类型"
              clearable
              class="filter-item"
            >
              <el-option label="全部" value="" />
              <el-option label="公告" value="announcement" />
              <el-option label="活动" value="event" />
              <el-option label="提醒" value="reminder" />
              <el-option label="警告" value="warning" />
              <el-option label="其他" value="other" />
            </el-select>
            <el-date-picker
              v-model="systemDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              class="filter-item date-picker"
            />
            <el-button type="primary" @click="handleSystemSearch">搜索</el-button>
            <el-button @click="resetSystemFilter">重置</el-button>
          </div>
          
          <!-- 系统通知列表 -->
          <el-table :data="systemMessageList" style="width: 100%" v-loading="systemLoading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="通知标题" min-width="180" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="scope">
                <el-tag :type="getMessageTypeTag(scope.row.type)">
                  {{ getMessageTypeText(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sender" label="发送者" width="120" />
            <el-table-column prop="targetGroup" label="目标用户" width="120" />
            <el-table-column prop="sendTime" label="发送时间" width="180" sortable />
            <el-table-column prop="readCount" label="已读人数" width="100" sortable />
            <el-table-column prop="totalCount" label="总接收人数" width="120" sortable />
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="scope">
                <el-button size="small" @click="handleViewSystemMessage(scope.row)">查看详情</el-button>
                <el-button size="small" type="primary" @click="handleViewRecipients(scope.row)">查看接收者</el-button>
                <el-popconfirm
                  :title="`确定要删除通知 '${scope.row.title}' 吗?`"
                  @confirm="handleDeleteSystemMessage(scope.row)"
                >
                  <template #reference>
                    <el-button size="small" type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="systemCurrentPage"
              v-model:page-size="systemPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="systemTotal"
              @size-change="handleSystemSizeChange"
              @current-change="handleSystemCurrentChange"
            />
          </div>
    </el-card>
    
    <!-- 系统通知详情对话框 -->
    <el-dialog
      v-model="systemDetailVisible"
      :title="currentSystemMessage.title"
      width="600px"
    >
      <div class="message-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="类型">
            <el-tag :type="getMessageTypeTag(currentSystemMessage.type)">
              {{ getMessageTypeText(currentSystemMessage.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发送者">{{ currentSystemMessage.sender }}</el-descriptions-item>
          <el-descriptions-item label="目标用户">{{ currentSystemMessage.targetGroup }}</el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ currentSystemMessage.sendTime }}</el-descriptions-item>
          <el-descriptions-item label="阅读统计">
            已读: {{ currentSystemMessage.readCount }} / 总接收: {{ currentSystemMessage.totalCount }}
            ({{ calculateReadRate(currentSystemMessage.readCount, currentSystemMessage.totalCount) }}%)
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="message-content">
          <h4>通知内容</h4>
          <div class="content-box" v-html="safeMessageContent"></div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 发送系统通知对话框 -->
    <el-dialog
      v-model="createSystemVisible"
      title="发送系统通知"
      width="700px"
    >
      <el-form :model="newSystemMessage" :rules="systemMessageRules" ref="systemMessageForm" label-width="100px">
        <el-form-item label="通知标题" prop="title">
          <el-input v-model="newSystemMessage.title" placeholder="请输入通知标题" />
        </el-form-item>
        <el-form-item label="通知类型" prop="type">
          <el-select v-model="newSystemMessage.type" placeholder="请选择通知类型" style="width: 100%">
            <el-option label="公告" value="announcement" />
            <el-option label="活动" value="event" />
            <el-option label="提醒" value="reminder" />
            <el-option label="警告" value="warning" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标用户" prop="targetGroup">
          <el-select v-model="newSystemMessage.targetGroup" placeholder="请选择目标用户" style="width: 100%">
            <el-option label="所有用户" value="all" />
            <el-option label="新注册用户" value="new" />
            <el-option label="活跃用户" value="active" />
            <el-option label="指定用户组" value="specific" />
          </el-select>
        </el-form-item>
        <el-form-item 
          label="指定用户" 
          prop="specificUsers" 
          v-if="newSystemMessage.targetGroup === 'specific'"
        >
          <el-select
            v-model="newSystemMessage.specificUsers"
            multiple
            filterable
            remote
            reserve-keyword
            placeholder="请输入用户名搜索"
            :remote-method="remoteUserSearch"
            :loading="userSearchLoading"
            style="width: 100%"
          >
            <el-option
              v-for="item in userOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="通知内容" prop="content">
          <el-input
            v-model="newSystemMessage.content"
            type="textarea"
            :rows="6"
            placeholder="请输入通知内容"
          />
        </el-form-item>
        <el-form-item label="立即发送" prop="sendNow">
          <el-switch v-model="newSystemMessage.sendNow" />
        </el-form-item>
        <el-form-item 
          label="发送时间" 
          prop="scheduledTime" 
          v-if="!newSystemMessage.sendNow"
        >
          <el-date-picker
            v-model="newSystemMessage.scheduledTime"
            type="datetime"
            placeholder="选择发送时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createSystemVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitSystemMessage">发送</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加接收者详情对话框 -->
    <el-dialog
      v-model="recipientsVisible"
      :title="`通知接收者 - ${currentSystemMessage.title}`"
      width="800px"
    >
      <div class="recipients-container">
        <!-- 筛选器 -->
        <div class="filter-container">
          <el-select
            v-model="recipientReadStatus"
            placeholder="阅读状态"
            clearable
            class="filter-item"
          >
            <el-option label="全部" value="" />
            <el-option label="已读" value="true" />
            <el-option label="未读" value="false" />
          </el-select>
          <el-button type="primary" @click="handleRecipientSearch">搜索</el-button>
          <el-button @click="resetRecipientFilter">重置</el-button>
        </div>
        
        <!-- 接收者列表 -->
        <el-table :data="recipientsList" style="width: 100%" v-loading="recipientsLoading">
          <el-table-column prop="userId" label="用户ID" width="80" />
          <el-table-column label="用户信息" min-width="200">
            <template #default="scope">
              <div class="user-info">
                <el-avatar :size="40" :src="scope.row.avatar" />
                <div class="user-name">
                  <div>{{ scope.row.nickname }}</div>
                  <div class="username">@{{ scope.row.username }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="isRead" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.isRead ? 'success' : 'info'">
                {{ scope.row.isRead ? '已读' : '未读' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="readAt" label="阅读时间" width="180" />
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="recipientsCurrentPage"
            v-model:page-size="recipientsPageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="recipientsTotal"
            @size-change="handleRecipientsPageSizeChange"
            @current-change="handleRecipientsPageChange"
          />
        </div>
        
        <!-- 统计信息 -->
        <div class="recipients-stats">
          <div class="stats-item">
            <span class="label">总接收人数:</span>
            <span class="value">{{ currentSystemMessage.totalCount }}</span>
          </div>
          <div class="stats-item">
            <span class="label">已读人数:</span>
            <span class="value">{{ currentSystemMessage.readCount }}</span>
          </div>
          <div class="stats-item">
            <span class="label">已读比例:</span>
            <span class="value">{{ calculateReadRate(currentSystemMessage.readCount, currentSystemMessage.totalCount) }}%</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import api from '@/utils/api';

// 简单的HTML清理函数，移除危险标签和属性
const sanitizeHtml = (html) => {
  if (!html) return '';
  // 移除script标签及其内容
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // 移除事件处理属性
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  clean = clean.replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '');
  // 移除javascript:链接
  clean = clean.replace(/href\s*=\s*["']?javascript:[^"'\s>]*/gi, 'href="#"');
  // 移除data:链接(可能包含恶意内容)
  clean = clean.replace(/src\s*=\s*["']?data:[^"'\s>]*/gi, 'src=""');
  return clean;
};

// 计算属性：安全的消息内容
const safeMessageContent = computed(() => {
  return sanitizeHtml(currentSystemMessage.content);
});


// 系统通知相关
const systemLoading = ref(false);
const systemMessageList = ref([]);
const systemCurrentPage = ref(1);
const systemPageSize = ref(10);
const systemTotal = ref(100);
const systemSearchQuery = ref('');
const systemMessageType = ref('');
const systemDateRange = ref([]);
const systemDetailVisible = ref(false);
const createSystemVisible = ref(false);
const currentSystemMessage = reactive({
  id: 0,
  title: '',
  type: '',
  sender: '',
  targetGroup: '',
  sendTime: '',
  readCount: 0,
  totalCount: 0,
  content: ''
});
const newSystemMessage = reactive({
  title: '',
  type: 'announcement',
  targetGroup: 'all',
  specificUsers: [],
  content: '',
  sendNow: true,
  scheduledTime: ''
});
const systemMessageRules = {
  title: [
    { required: true, message: '请输入通知标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择通知类型', trigger: 'change' }
  ],
  targetGroup: [
    { required: true, message: '请选择目标用户', trigger: 'change' }
  ],
  specificUsers: [
    { required: true, message: '请选择指定用户', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入通知内容', trigger: 'blur' }
  ],
  scheduledTime: [
    { required: true, message: '请选择发送时间', trigger: 'change' }
  ]
};
const userSearchLoading = ref(false);
const userOptions = ref([]);
const systemMessageForm = ref(null);


// 接收者相关状态
const recipientsVisible = ref(false);
const recipientsList = ref([]);
const recipientsLoading = ref(false);
const recipientsCurrentPage = ref(1);
const recipientsPageSize = ref(10);
const recipientsTotal = ref(0);
const recipientReadStatus = ref('');

// 生命周期
onMounted(() => {
  fetchSystemMessages();
});

// 系统通知相关方法
const fetchSystemMessages = async () => {
  systemLoading.value = true;
  try {
    // 构建查询参数
    const params = {
      page: systemCurrentPage.value,
      limit: systemPageSize.value,
      type: systemMessageType.value,
      searchQuery: systemSearchQuery.value
    };
    
    // 如果有日期范围筛选
    if (systemDateRange.value && systemDateRange.value.length === 2) {
      params.startDate = systemDateRange.value[0];
      params.endDate = systemDateRange.value[1];
    }
    
    // 调用API获取系统通知列表
    const response = await api.content.messages.getSystemMessages(params);
    
    console.log('系统通知API响应:', response);
    
    if (response.success) {
      // 确保数据格式正确
      const formattedMessages = response.data.rows.map(msg => ({
        ...msg,
        readCount: msg.readCount || 0, // 确保有默认值0
        totalCount: msg.totalCount || 0 // 确保有默认值0
      }));
      
      console.log('格式化后的系统通知列表:', formattedMessages);
      
      systemMessageList.value = formattedMessages;
      systemTotal.value = response.data.total;
    } else {
      ElMessage.error(response.message || '获取系统通知失败');
    }
  } catch (error) {
    console.error('获取系统通知错误:', error);
    ElMessage.error(error.message || '网络错误，请检查网络连接');
  } finally {
    systemLoading.value = false;
  }
};

const handleSystemSearch = () => {
  systemCurrentPage.value = 1;
  fetchSystemMessages();
};

const resetSystemFilter = () => {
  systemSearchQuery.value = '';
  systemMessageType.value = '';
  systemDateRange.value = [];
  handleSystemSearch();
};

const handleSystemSizeChange = (val) => {
  systemPageSize.value = val;
  fetchSystemMessages();
};

const handleSystemCurrentChange = (val) => {
  systemCurrentPage.value = val;
  fetchSystemMessages();
};

const handleViewSystemMessage = (row) => {
  Object.assign(currentSystemMessage, row);
  systemDetailVisible.value = true;
};

const handleDeleteSystemMessage = async (row) => {
  try {
    // 调用API删除系统通知
    const response = await api.content.messages.deleteSystemMessage(row.id);
    
    if (response.success) {
      ElMessage.success(`系统通知 "${row.title}" 已删除`);
      // 从列表中移除
      systemMessageList.value = systemMessageList.value.filter(item => item.id !== row.id);
    } else {
      ElMessage.error(response.message || '删除系统通知失败');
    }
  } catch (error) {
    console.error('删除系统通知错误:', error);
    ElMessage.error(error.message || '网络错误，请检查网络连接');
  }
};

const handleCreateSystemMessage = () => {
  Object.assign(newSystemMessage, {
    title: '',
    type: 'announcement',
    targetGroup: 'all',
    specificUsers: [],
    content: '',
    sendNow: true,
    scheduledTime: ''
  });
  createSystemVisible.value = true;
};

const handleSubmitSystemMessage = async () => {
  systemMessageForm.value.validate(async (valid) => {
    if (valid) {
      try {
        // 准备提交的数据
        const messageData = {
          title: newSystemMessage.title,
          content: newSystemMessage.content,
          type: newSystemMessage.type,
          targetGroup: newSystemMessage.targetGroup,
          sendNow: newSystemMessage.sendNow
        };
        
        // 如果是指定用户组，添加用户列表
        if (newSystemMessage.targetGroup === 'specific') {
          messageData.specificUsers = newSystemMessage.specificUsers;
        }
        
        // 如果是定时发送，添加定时时间
        if (!newSystemMessage.sendNow) {
          messageData.scheduledTime = newSystemMessage.scheduledTime;
        }
        
        // 调用API发送系统通知
        const response = await api.content.messages.createSystemMessage(messageData);
        
        if (response.success) {
          const sendTimeText = newSystemMessage.sendNow ? '立即发送' : `定时发送(${newSystemMessage.scheduledTime})`;
          ElMessage.success(`系统通知 "${newSystemMessage.title}" 已${sendTimeText}`);
          createSystemVisible.value = false;
          
          // 刷新列表
          fetchSystemMessages();
        } else {
          ElMessage.error(response.message || '发送系统通知失败');
        }
      } catch (error) {
        console.error('发送系统通知错误:', error);
        ElMessage.error(error.message || '网络错误，请检查网络连接');
      }
    }
  });
};

const remoteUserSearch = async (query) => {
  if (query) {
    userSearchLoading.value = true;
    try {
      // 调用API搜索用户
      const response = await api.content.messages.searchUsers(query);
      
      if (response.success) {
        userOptions.value = response.data;
      } else {
        ElMessage.error(response.message || '搜索用户失败');
      }
    } catch (error) {
      console.error('搜索用户错误:', error);
    } finally {
      userSearchLoading.value = false;
    }
  }
};


// 辅助方法
const getMessageTypeTag = (type) => {
  const map = {
    'announcement': 'primary',
    'event': 'success',
    'reminder': 'warning',
    'warning': 'danger',
    'other': 'info'
  };
  return map[type] || 'info';
};

const getMessageTypeText = (type) => {
  const map = {
    'announcement': '公告',
    'event': '活动',
    'reminder': '提醒',
    'warning': '警告',
    'other': '其他'
  };
  return map[type] || '未知';
};


const calculateReadRate = (readCount, totalCount) => {
  if (totalCount === 0) return 0;
  return Math.round((readCount / totalCount) * 100);
};

// 查看消息接收者
const handleViewRecipients = async (row) => {
  // 设置当前选中的通知
  Object.assign(currentSystemMessage, row);
  recipientsVisible.value = true;
  
  // 重置分页和筛选条件
  recipientsCurrentPage.value = 1;
  recipientReadStatus.value = '';
  
  // 加载接收者数据
  await fetchMessageRecipients();
};

// 获取消息接收者列表
const fetchMessageRecipients = async () => {
  recipientsLoading.value = true;
  try {
    // 构建查询参数
    const params = {
      page: recipientsCurrentPage.value,
      limit: recipientsPageSize.value
    };
    
    // 如果有状态筛选
    if (recipientReadStatus.value !== '') {
      params.isRead = recipientReadStatus.value;
    }
    
    // 调用API获取接收者列表
    const response = await api.content.messages.getSystemMessageRecipients(currentSystemMessage.id, params);
    
    if (response.success) {
      recipientsList.value = response.data.rows;
      recipientsTotal.value = response.data.total;
    } else {
      ElMessage.error(response.message || '获取接收者列表失败');
    }
  } catch (error) {
    console.error('获取接收者列表错误:', error);
    ElMessage.error(error.message || '网络错误，请检查网络连接');
  } finally {
    recipientsLoading.value = false;
  }
};

// 接收者列表分页和筛选
const handleRecipientSearch = () => {
  recipientsCurrentPage.value = 1;
  fetchMessageRecipients();
};

const resetRecipientFilter = () => {
  recipientReadStatus.value = '';
  handleRecipientSearch();
};

const handleRecipientsPageSizeChange = (val) => {
  recipientsPageSize.value = val;
  fetchMessageRecipients();
};

const handleRecipientsPageChange = (val) => {
  recipientsCurrentPage.value = val;
  fetchMessageRecipients();
};
</script>

<style scoped>
.message-management-container {
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.message-detail {
  padding: 10px;
}

.message-content {
  margin-top: 20px;
}

.message-content h4 {
  margin-bottom: 15px;
  font-weight: 600;
}

.content-box {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  min-height: 100px;
}

/* 添加接收者列表相关样式 */
.recipients-container {
  padding: 10px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-name {
  margin-left: 10px;
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 12px;
  color: #909399;
}

.recipients-stats {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  display: flex;
  justify-content: space-around;
}

.stats-item {
  text-align: center;
}

.stats-item .label {
  font-weight: 600;
  margin-right: 5px;
}

.stats-item .value {
  color: #409EFF;
  font-weight: 600;
}
</style> 