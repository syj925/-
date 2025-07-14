<template>
  <div class="event-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>活动管理</h3>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon> 创建活动
          </el-button>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="filter-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索活动名称"
          clearable
          class="filter-item search-input"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="eventStatus"
          placeholder="活动状态"
          clearable
          class="filter-item"
        >
          <el-option label="全部" value="" />
          <el-option label="未开始" value="upcoming" />
          <el-option label="进行中" value="ongoing" />
          <el-option label="已结束" value="ended" />
          <el-option label="已取消" value="canceled" />
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
      
      <!-- 活动列表 -->
      <el-table :data="eventList" style="width: 100%" v-loading="loading">
        <el-table-column label="ID" width="100">
          <template #default="scope">
            <el-tooltip :content="scope.row.id" placement="top">
              <span class="id-display">{{ formatId(scope.row.id) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="活动名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="location" label="活动地点" width="150" show-overflow-tooltip />
        <el-table-column label="活动时间" width="300">
          <template #default="scope">
            {{ formatDateTime(scope.row.startTime) }} 至 {{ formatDateTime(scope.row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="organizer" label="组织者" width="120" />
        <el-table-column prop="currentParticipants" label="报名人数" width="100" sortable>
          <template #default="scope">
            {{ scope.row.currentParticipants || 0 }}
            <span v-if="scope.row.maxParticipants > 0">/ {{ scope.row.maxParticipants }}</span>
          </template>
        </el-table-column>
        <el-table-column label="封面图" width="120">
          <template #default="scope">
            <el-image 
              style="width: 80px; height: 45px" 
              :src="scope.row.coverImage || '/placeholder-image.png'" 
              fit="cover"
              :preview-src-list="scope.row.coverImage ? [scope.row.coverImage] : []"
            >
              <template #error>
                <div class="image-placeholder">暂无图片</div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="420" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="scope.row.isRecommended ? 'info' : 'success'" 
              @click="handleToggleRecommend(scope.row)"
            >
              {{ scope.row.isRecommended ? '取消推荐' : '推荐' }}
            </el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 'canceled' ? 'success' : 'danger'" 
              @click="handleToggleStatus(scope.row)"
              :disabled="scope.row.status === 'ended'"
            >
              {{ scope.row.status === 'canceled' ? '恢复' : '取消' }}
            </el-button>
            <el-button 
              size="small"
              type="primary"
              @click="handleManageRegistrations(scope.row)"
            >
              报名管理
            </el-button>
            <el-button 
              size="small"
              type="danger"
              @click="handleDeleteEvent(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空数据状态 -->
      <el-empty v-if="!loading && eventList.length === 0" description="暂无活动数据"></el-empty>
      
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
    
    <!-- 创建/编辑活动对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingEvent.id ? '编辑活动' : '创建活动'"
      width="700px"
      destroy-on-close
    >
      <el-form :model="editingEvent" :rules="rules" ref="eventForm" label-width="100px">
        <el-form-item label="活动名称" prop="title">
          <el-input v-model="editingEvent.title" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="editingEvent.location" placeholder="请输入活动地点" />
        </el-form-item>
        <el-form-item label="活动时间" prop="timeRange">
          <el-date-picker
            v-model="editingEvent.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="组织者" prop="organizer">
          <el-input v-model="editingEvent.organizer" placeholder="请输入组织者" />
        </el-form-item>
        <el-form-item label="活动描述" prop="description">
          <el-input
            v-model="editingEvent.description"
            type="textarea"
            :rows="4"
            placeholder="请输入活动描述"
          />
        </el-form-item>
        <el-form-item label="封面图" prop="coverImage">
          <el-upload
            class="avatar-uploader"
            action="/api/upload"
            :headers="getUploadHeaders()"
            :data="{type: 'event'}"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
          >
            <img v-if="editingEvent.coverImage" :src="editingEvent.coverImage" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">建议尺寸: 800x450px，大小不超过2MB</div>
        </el-form-item>
        
        <!-- 活动详情图片 -->
        <el-form-item label="详情图片">
          <el-upload
            class="detail-images-uploader"
            action="/api/upload"
            :headers="getUploadHeaders()"
            :data="{type: 'event'}"
            list-type="picture-card"
            :file-list="detailImagesList"
            :on-success="handleDetailImageSuccess"
            :on-remove="handleDetailImageRemove"
            :before-upload="beforeUpload"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">可上传多张活动详情图片，将在活动详情页展示</div>
        </el-form-item>
        
        <!-- 活动须知 -->
        <el-form-item label="活动须知">
          <div class="notices-container">
            <div v-for="(notice, index) in editingEvent.notices" :key="index" class="notice-item">
              <el-input v-model="editingEvent.notices[index]" placeholder="请输入活动须知项" />
              <el-button type="danger" circle @click="removeNotice(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" @click="addNotice">
              <el-icon><Plus /></el-icon> 添加活动须知
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="报名上限" prop="maxParticipants">
          <el-input-number v-model="editingEvent.maxParticipants" :min="0" :max="10000" />
          <span class="form-tip">0表示不限制人数</span>
        </el-form-item>
        <el-form-item label="是否推荐" prop="isRecommended">
          <el-switch v-model="editingEvent.isRecommended" />
        </el-form-item>
        <el-form-item label="活动状态" prop="status">
          <el-select v-model="editingEvent.status" placeholder="请选择活动状态">
            <el-option label="未开始" value="upcoming" />
            <el-option label="进行中" value="ongoing" />
            <el-option label="已结束" value="ended" />
            <el-option label="已取消" value="canceled" />
          </el-select>
        </el-form-item>
        
        <!-- 报名截止日期 -->
        <el-form-item label="报名截止日期" prop="registrationDeadline">
          <el-date-picker
            v-model="editingEvent.registrationDeadline"
            type="datetime"
            placeholder="选择报名截止日期"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
          <div class="form-tip">不设置则默认截止时间为活动开始时间</div>
        </el-form-item>
        
        <!-- 允许取消报名 -->
        <el-form-item label="允许取消报名" prop="allowCancelRegistration">
          <el-switch v-model="editingEvent.allowCancelRegistration" />
        </el-form-item>
        
        <!-- 报名表单字段 -->
        <el-form-item label="报名表单字段">
          <div class="form-fields-container">
            <div v-for="(field, index) in editingEvent.registrationFields" :key="index" class="field-card">
              <div class="field-header">
                <h4>字段 #{{ index + 1 }}</h4>
                <el-button type="danger" size="small" @click="removeFormField(index)">
                  <el-icon><Delete /></el-icon> 删除
                </el-button>
              </div>
              
              <el-form-item label="字段名称">
                <el-input v-model="field.name" placeholder="字段名称（英文，如name）" />
              </el-form-item>
              
              <el-form-item label="显示标签">
                <el-input v-model="field.label" placeholder="显示名称（如姓名）" />
              </el-form-item>
              
              <el-form-item label="字段类型">
                <el-select v-model="field.type" placeholder="选择字段类型">
                  <el-option label="文本" value="text" />
                  <el-option label="数字" value="number" />
                  <el-option label="电话" value="tel" />
                  <el-option label="邮箱" value="email" />
                  <el-option label="选择" value="select" />
                  <el-option label="文本域" value="textarea" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="是否必填">
                <el-switch v-model="field.required" />
              </el-form-item>
              
              <!-- 选择类型的选项 -->
              <template v-if="field.type === 'select'">
                <el-divider content-position="left">选项列表</el-divider>
                <div v-for="(option, optIndex) in field.options || []" :key="optIndex" class="option-item">
                  <el-input v-model="field.options[optIndex]" placeholder="选项值" />
                  <el-button type="danger" circle @click="removeOption(index, optIndex)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                <el-button type="primary" plain size="small" @click="addOption(index)">
                  <el-icon><Plus /></el-icon> 添加选项
                </el-button>
              </template>
              
              <el-divider />
            </div>
            
            <el-button type="primary" @click="addFormField">
              <el-icon><Plus /></el-icon> 添加表单字段
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import api from '../../utils/api.js';
import { useRouter } from 'vue-router';

// 获取router实例
const router = useRouter();

// 列表数据
const loading = ref(false);
const eventList = ref([]);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 搜索和筛选
const searchQuery = ref('');
const eventStatus = ref('');
const dateRange = ref([]);

// 对话框和表单
const dialogVisible = ref(false);
const editingEvent = reactive({
  id: null,
  title: '',
  location: '',
  timeRange: [],
  organizer: '',
  description: '',
  coverImage: '',
  detailImages: [],
  notices: [],
  maxParticipants: 0,
  isRecommended: false,
  status: 'upcoming',
  registrationDeadline: '',
  allowCancelRegistration: true,
  registrationFields: []
});
const detailImagesList = ref([]);
const eventForm = ref(null);
const rules = {
  title: [
    { required: true, message: '请输入活动名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  location: [
    { required: true, message: '请输入活动地点', trigger: 'blur' }
  ],
  timeRange: [
    { required: true, message: '请选择活动时间', trigger: 'change' }
  ],
  organizer: [
    { required: true, message: '请输入组织者', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入活动描述', trigger: 'blur' }
  ],
  coverImage: [
    { required: true, message: '请上传活动封面图', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择活动状态', trigger: 'change' }
  ]
};

// 生命周期
onMounted(() => {
  fetchEvents();
});

// 自动设置活动状态
watch(() => editingEvent.timeRange, (newValue) => {
  if (newValue && newValue.length === 2) {
    const now = new Date();
    const startTime = new Date(newValue[0]);
    const endTime = new Date(newValue[1]);
    
    if (startTime > now) {
      editingEvent.status = 'upcoming';
    } else if (endTime < now) {
      editingEvent.status = 'ended';
    } else {
      editingEvent.status = 'ongoing';
    }
  }
});

// 方法
const fetchEvents = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      title: searchQuery.value || undefined,
      status: eventStatus.value || undefined,
      startDate: dateRange.value && dateRange.value[0] ? dateRange.value[0] : undefined,
      endDate: dateRange.value && dateRange.value[1] ? dateRange.value[1] : undefined
    };
    
    const res = await api.events.getList(params);
    if (res.success) {
      eventList.value = res.data.events || [];
      total.value = res.data.pagination?.total || 0;
    } else {
      ElMessage.error(res.message || '获取活动列表失败');
    }
  } catch (error) {
    console.error('获取活动列表错误:', error);
    ElMessage.error(error.message || '加载活动列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchEvents();
};

const resetFilter = () => {
  searchQuery.value = '';
  eventStatus.value = '';
  dateRange.value = [];
  handleSearch();
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchEvents();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchEvents();
};

const handleCreate = () => {
  Object.assign(editingEvent, {
    id: null,
    title: '',
    location: '',
    timeRange: [],
    organizer: '',
    description: '',
    coverImage: '',
    detailImages: [],
    notices: [],
    maxParticipants: 0,
    isRecommended: false,
    status: 'upcoming',
    registrationDeadline: '',
    allowCancelRegistration: true,
    registrationFields: []
  });
  detailImagesList.value = [];
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  Object.assign(editingEvent, {
    ...row,
    timeRange: [row.startTime, row.endTime],
    detailImages: Array.isArray(row.detailImages) ? row.detailImages : [],
    notices: Array.isArray(row.notices) ? row.notices : [],
    registrationFields: Array.isArray(row.registrationFields) ? row.registrationFields : [],
    allowCancelRegistration: row.allowCancelRegistration !== undefined ? row.allowCancelRegistration : true
  });
  
  detailImagesList.value = formatDetailImages(Array.isArray(row.detailImages) ? row.detailImages : []);
  dialogVisible.value = true;
};

const handleToggleRecommend = async (row) => {
  const action = row.isRecommended ? '取消推荐' : '推荐';
  
  try {
    await ElMessageBox.confirm(`确定要${action}该活动吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    loading.value = true;
    const res = await api.events.update(row.id, { 
      isRecommended: !row.isRecommended 
    });
    
    if (res.success) {
      row.isRecommended = !row.isRecommended;
      ElMessage.success(`已${action}活动: ${row.title}`);
    } else {
      ElMessage.error(res.message || `${action}失败`);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`${action}活动失败:`, error);
      ElMessage.error(error.message || `${action}失败`);
    }
  } finally {
    loading.value = false;
  }
};

const handleToggleStatus = async (row) => {
  if (row.status === 'ended') return;
  
  const action = row.status === 'canceled' ? '恢复' : '取消';
  const newStatus = row.status === 'canceled' ? 'upcoming' : 'canceled';
  
  try {
    await ElMessageBox.confirm(`确定要${action}该活动吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    loading.value = true;
    const res = await api.events.update(row.id, { status: newStatus });
    
    if (res.success) {
      row.status = newStatus;
      ElMessage.success(`已${action}活动: ${row.title}`);
    } else {
      ElMessage.error(res.message || `${action}失败`);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`${action}活动失败:`, error);
      ElMessage.error(error.message || `${action}失败`);
    }
  } finally {
    loading.value = false;
  }
};

const getTagType = (status) => {
  const map = {
    'upcoming': 'info',
    'ongoing': 'success',
    'ended': '',
    'canceled': 'danger'
  };
  return map[status] || '';
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

const handleSubmit = async () => {
  if (!eventForm.value) return;
  
  eventForm.value.validate(async (valid) => {
    if (valid) {
      if (!editingEvent.timeRange || editingEvent.timeRange.length !== 2) {
        ElMessage.error('请选择活动时间');
        return false;
      }
      
      loading.value = true;
      
      try {
        // 将时间范围转换为起止时间
        const startTime = editingEvent.timeRange[0];
        const endTime = editingEvent.timeRange[1];
        
        // 准备提交的数据
        const eventData = {
          title: editingEvent.title,
          location: editingEvent.location,
          organizer: editingEvent.organizer,
          description: editingEvent.description,
          coverImage: editingEvent.coverImage,
          detailImages: editingEvent.detailImages,
          notices: editingEvent.notices.filter(notice => notice.trim() !== ''),
          maxParticipants: editingEvent.maxParticipants,
          isRecommended: editingEvent.isRecommended,
          status: editingEvent.status,
          startTime: startTime,
          endTime: endTime,
          allowCancelRegistration: editingEvent.allowCancelRegistration,
          registrationFields: editingEvent.registrationFields.filter(field => 
            field.name && field.name.trim() !== '' && 
            field.label && field.label.trim() !== '' && 
            field.type
          )
        };

        // 只有当报名截止日期是有效日期时才添加到请求数据中
        if (editingEvent.registrationDeadline && 
            editingEvent.registrationDeadline !== 'Invalid date' && 
            !isNaN(new Date(editingEvent.registrationDeadline).getTime())) {
          eventData.registrationDeadline = editingEvent.registrationDeadline;
        }
        
        // 处理select类型的选项，确保每个选择类型字段都有options数组
        eventData.registrationFields.forEach(field => {
          if (field.type === 'select' && (!field.options || !Array.isArray(field.options))) {
            field.options = [];
          }
        });
        
        let res;
        if (editingEvent.id) {
          // 更新现有活动
          res = await api.events.update(editingEvent.id, eventData);
        } else {
          // 创建新活动
          res = await api.events.create(eventData);
        }
        
        if (res.success) {
          ElMessage.success(editingEvent.id ? '活动更新成功!' : '活动创建成功!');
          dialogVisible.value = false;
          fetchEvents(); // 重新加载列表
        } else {
          ElMessage.error(res.message || '操作失败');
        }
      } catch (error) {
        console.error('保存活动失败:', error);
        ElMessage.error(error.message || '保存失败，请稍后再试');
      } finally {
        loading.value = false;
      }
    } else {
      return false;
    }
  });
};

const handleUploadSuccess = (response) => {
  console.log('上传成功响应:', response);
  if (response.success) {
    editingEvent.coverImage = response.data.url;
    ElMessage.success('图片上传成功');
  } else {
    ElMessage.error(response.message || '图片上传失败');
  }
};

const handleUploadError = (err) => {
  console.error('上传图片失败:', err);
  ElMessage.error('图片上传失败，请检查服务器连接或稍后重试');
};

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('只能上传图片文件!');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!');
    return false;
  }
  return true;
};

// 获取上传请求头
const getUploadHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// 格式化日期时间
const formatDateTime = (timestamp) => {
  if (!timestamp) return '暂未设置';
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

// 添加活动须知
const addNotice = () => {
  editingEvent.notices.push('');
};

// 删除活动须知
const removeNotice = (index) => {
  editingEvent.notices.splice(index, 1);
};

// 处理详情图片上传成功
const handleDetailImageSuccess = (response, uploadFile) => {
  if (response.success) {
    editingEvent.detailImages.push(response.data.url);
    ElMessage.success('详情图片上传成功');
  } else {
    ElMessage.error(response.message || '图片上传失败');
  }
};

// 处理详情图片删除
const handleDetailImageRemove = (uploadFile) => {
  const index = detailImagesList.value.indexOf(uploadFile);
  if (index !== -1) {
    editingEvent.detailImages.splice(index, 1);
  }
};

// 转换详情图片为上传组件所需格式
const formatDetailImages = (images) => {
  if (!images || !Array.isArray(images)) return [];
  return images.map((url, index) => ({
    name: `图片${index + 1}`,
    url: url
  }));
};

// 添加表单字段
const addFormField = () => {
  if (!editingEvent.registrationFields) {
    editingEvent.registrationFields = [];
  }
  editingEvent.registrationFields.push({
    name: '',
    label: '',
    type: 'text',
    required: false
  });
};

// 删除表单字段
const removeFormField = (index) => {
  editingEvent.registrationFields.splice(index, 1);
};

// 添加选项
const addOption = (fieldIndex) => {
  const field = editingEvent.registrationFields[fieldIndex];
  if (!field.options) {
    field.options = [];
  }
  field.options.push('');
};

// 删除选项
const removeOption = (fieldIndex, optionIndex) => {
  editingEvent.registrationFields[fieldIndex].options.splice(optionIndex, 1);
};

const handleManageRegistrations = (row) => {
  // 跳转到报名管理页面
  router.push({
    path: `/event/registrations/${row.id}`,
    query: { title: row.title }
  });
};

// 添加删除活动的方法
const handleDeleteEvent = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除活动 "${row.title}" 吗？此操作不可恢复!`, '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      distinguishCancelAndClose: true
    });
    
    loading.value = true;
    const res = await api.events.delete(row.id);
    
    if (res.success) {
      ElMessage.success(`活动 "${row.title}" 已成功删除`);
      fetchEvents(); // 重新加载活动列表
    } else {
      ElMessage.error(res.message || '删除活动失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除活动失败:', error);
      ElMessage.error(error.message || '删除活动失败');
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.event-list-container {
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

.avatar-uploader {
  text-align: center;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 100px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 100px;
  display: block;
}

.upload-tip, .form-tip {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
  margin-left: 10px;
}

.image-placeholder {
  width: 80px;
  height: 45px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

/* 详情图片上传样式 */
.detail-images-uploader .el-upload {
  margin-right: 10px;
  margin-bottom: 10px;
}

.detail-images-uploader .el-upload-list__item {
  width: 150px;
  height: 150px;
}

/* 活动须知样式 */
.notices-container {
  margin-top: 5px;
}

.notice-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.notice-item .el-input {
  flex: 1;
  margin-right: 10px;
}

/* 表单字段样式 */
.form-fields-container {
  margin-top: 10px;
}

.field-card {
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #f9f9f9;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.field-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.option-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.option-item .el-input {
  flex: 1;
  margin-right: 10px;
}
</style> 