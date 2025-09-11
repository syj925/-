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
            {{ formatDateTime(scope.row.start_time) }} 至 {{ formatDateTime(scope.row.end_time) }}
          </template>
        </el-table-column>
        <el-table-column label="组织者" width="120">
          <template #default="scope">
            {{ getOrganizerName(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column prop="currentParticipants" label="报名人数" width="100" sortable>
          <template #default="scope">
            {{ scope.row.current_participants || 0 }}
            <span v-if="scope.row.max_participants > 0">/ {{ scope.row.max_participants }}</span>
          </template>
        </el-table-column>
        <el-table-column label="封面图" width="120">
          <template #default="scope">
            <el-image 
              style="width: 80px; height: 45px" 
              :src="getImageDisplayUrl(scope.row.cover_image) || '/placeholder-image.png'"
              fit="cover"
              :preview-src-list="scope.row.cover_image ? [getImageDisplayUrl(scope.row.cover_image)] : []"
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
              :type="scope.row.is_recommended ? 'info' : 'success'"
              @click="handleToggleRecommend(scope.row)"
            >
              {{ scope.row.is_recommended ? '取消推荐' : '推荐' }}
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
        <el-form-item label="组织者" prop="organizer_id">
          <el-input v-model="editingEvent.organizer_id" placeholder="请输入组织者ID" />
        </el-form-item>
        <el-form-item label="活动描述" prop="description">
          <el-input
            v-model="editingEvent.description"
            type="textarea"
            :rows="4"
            placeholder="请输入活动描述"
          />
        </el-form-item>
        <el-form-item label="封面图" prop="cover_image">
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
            <img v-if="editingEvent.cover_image" :src="getImageDisplayUrl(editingEvent.cover_image)" class="avatar" />
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
        
        <el-form-item label="报名上限" prop="max_participants">
          <el-input-number v-model="editingEvent.max_participants" :min="0" :max="10000" />
          <span class="form-tip">0表示不限制人数</span>
        </el-form-item>
        <el-form-item label="是否推荐" prop="is_recommended">
          <el-switch v-model="editingEvent.is_recommended" />
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
        <el-form-item label="报名截止日期" prop="registration_deadline">
          <el-date-picker
            v-model="editingEvent.registration_deadline"
            type="datetime"
            placeholder="选择报名截止日期"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
          <div class="form-tip">不设置则默认截止时间为活动开始时间</div>
        </el-form-item>
        
        <!-- 允许取消报名 -->
        <el-form-item label="允许取消报名" prop="allow_cancel_registration">
          <el-switch v-model="editingEvent.allow_cancel_registration" />
        </el-form-item>
        
        <!-- 报名表单字段 -->
        <el-form-item label="报名表单字段">
          <div class="form-fields-container">
            <div v-for="(field, index) in editingEvent.form_config" :key="index" class="field-card">
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
// 暂时注释掉API配置，先让基本功能工作
// import {
//   isApiSuccess,
//   getApiMessage,
//   getApiData,
//   transformToBackend,
//   transformToFrontend,
//   EVENT_STATUS,
//   EVENT_STATUS_LABELS
// } from '../../config/api-config.js';
// import { handleListApi, handleMutationApi, handleDeleteApi } from '../../utils/api-helper.js';

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
  organizer_id: '',
  description: '',
  cover_image: '',
  detail_images: [],
  notices: [],
  max_participants: 0,
  is_recommended: false,
  status: 'upcoming',
  registration_deadline: '',
  allow_cancel_registration: true,
  form_config: []
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
  organizer_id: [
    { required: true, message: '请输入组织者ID', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入活动描述', trigger: 'blur' }
  ],
  cover_image: [
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
    const start_time = new Date(newValue[0]);
    const end_time = new Date(newValue[1]);

    if (start_time > now) {
      editingEvent.status = 'upcoming';
    } else if (end_time < now) {
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
      endDate: dateRange.value && dateRange.value[1] ? dateRange.value[1] : undefined,
      _t: Date.now() // 添加时间戳避免缓存
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
    organizer_id: '',
    description: '',
    cover_image: '',
    detail_images: [],
    notices: [],
    max_participants: 0,
    is_recommended: false,
    status: 'upcoming',
    registration_deadline: '',
    allow_cancel_registration: true,
    form_config: []
  });
  detailImagesList.value = [];
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  Object.assign(editingEvent, {
    ...row,
    timeRange: [row.start_time, row.end_time],
    detail_images: Array.isArray(row.detail_images) ? row.detail_images : [],
    notices: Array.isArray(row.notices) ? row.notices : [],
    form_config: Array.isArray(row.form_config) ? row.form_config : [],
    allow_cancel_registration: row.allow_cancel_registration !== undefined ? row.allow_cancel_registration : true
  });

  detailImagesList.value = formatDetailImages(Array.isArray(row.detail_images) ? row.detail_images : []);
  dialogVisible.value = true;
};

const handleToggleRecommend = async (row) => {
  const action = row.is_recommended ? '取消推荐' : '推荐';
  
  try {
    await ElMessageBox.confirm(`确定要${action}该活动吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    loading.value = true;
    const res = await api.events.update(row.id, {
      is_recommended: !row.is_recommended
    });

    // 兼容两种响应格式：{success: true} 和 {code: 0}
    if (res.success === true || res.code === 0) {
      row.is_recommended = !row.is_recommended;
      ElMessage.success(`已${action}活动: ${row.title}`);
    } else {
      ElMessage.error(res.message || res.msg || `${action}失败`);
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

// 根据活动时间计算正确的状态
const calculateEventStatus = (startTime, endTime) => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) {
    return 'upcoming';  // 未开始
  } else if (now >= start && now <= end) {
    return 'ongoing';   // 进行中
  } else {
    return 'ended';     // 已结束
  }
};

const handleToggleStatus = async (row) => {
  if (row.status === 'ended') return;

  const action = row.status === 'canceled' ? '恢复' : '取消';
  let newStatus;

  if (row.status === 'canceled') {
    // 恢复活动时，根据时间计算正确的状态
    newStatus = calculateEventStatus(row.start_time, row.end_time);
  } else {
    // 取消活动
    newStatus = 'canceled';
  }

  try {
    await ElMessageBox.confirm(`确定要${action}该活动吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    loading.value = true;
    const res = await api.events.update(row.id, { status: newStatus });

    // 兼容两种响应格式：{success: true} 和 {code: 0}
    if (res.success === true || res.code === 0) {
      row.status = newStatus;
      ElMessage.success(`已${action}活动: ${row.title}`);
    } else {
      ElMessage.error(res.message || res.msg || `${action}失败`);
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

const formatId = (id) => {
  if (!id) return '';
  return id.substring(0, 8) + '...';
};

const getTagType = (status) => {
  const map = {
    'upcoming': 'info',
    'ongoing': 'success',
    'ended': 'warning',
    'canceled': 'danger'
  };
  return map[status] || 'info';
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
        const start_time = editingEvent.timeRange[0];
        const end_time = editingEvent.timeRange[1];
        
        // 准备提交的数据
        const eventData = {
          title: editingEvent.title,
          location: editingEvent.location,
          organizer_id: editingEvent.organizer_id,
          description: editingEvent.description,
          cover_image: editingEvent.cover_image,
          detail_images: editingEvent.detail_images,
          notices: editingEvent.notices.filter(notice => notice.trim() !== ''),
          max_participants: editingEvent.max_participants,
          is_recommended: editingEvent.is_recommended,
          status: editingEvent.status,
          start_time: start_time,
          end_time: end_time,
          allow_cancel_registration: editingEvent.allow_cancel_registration,
          form_config: editingEvent.form_config.filter(field =>
            field.name && field.name.trim() !== '' &&
            field.label && field.label.trim() !== '' &&
            field.type
          )
        };

        // 只有当报名截止日期是有效日期时才添加到请求数据中
        if (editingEvent.registration_deadline &&
            editingEvent.registration_deadline !== 'Invalid date' &&
            !isNaN(new Date(editingEvent.registration_deadline).getTime())) {
          eventData.registration_deadline = editingEvent.registration_deadline;
        }
        
        // 处理select类型的选项，确保每个选择类型字段都有options数组
        eventData.form_config.forEach(field => {
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

        console.log('API响应:', res);
        console.log('响应类型:', typeof res);
        console.log('响应code:', res.code);
        console.log('响应msg:', res.msg);
        console.log('响应success:', res.success);
        console.log('响应message:', res.message);

        // 兼容两种响应格式
        const isSuccess = res.code === 0 || res.success === true;
        const message = res.msg || res.message;

        if (isSuccess) {
          ElMessage.success(editingEvent.id ? '活动更新成功!' : '活动创建成功!');
          dialogVisible.value = false;
          fetchEvents(); // 重新加载列表
        } else {
          console.error('操作失败，响应:', res);
          ElMessage.error(message || '操作失败');
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
  if (response.code === 0) {
    // 保存相对路径到数据，用于提交到服务器
    editingEvent.cover_image = response.data.url;
    ElMessage.success('图片上传成功');
  } else {
    ElMessage.error(response.msg || '图片上传失败');
  }
};

// 获取完整的图片显示URL
const getImageDisplayUrl = (imageUrl) => {
  if (!imageUrl) return '';
  // 如果已经是完整URL，直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // 否则拼接服务器地址
  return `http://localhost:3000${imageUrl}`;
};

// 获取组织者名称
const getOrganizerName = (row) => {
  if (row.organizer) {
    // 如果有organizer对象，优先使用nickname，然后username，最后用id
    const name = row.organizer.nickname || row.organizer.username || row.organizer.id;
    // 如果是自定义组织者，添加标识
    return row.organizer.is_custom ? `${name} (自定义)` : name;
  }
  
  // 如果没有organizer对象但有organizer_id，直接显示（兼容旧数据）
  return row.organizer_id || '未知';
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
  if (response.code === 0) {
    // 保存相对路径到数据，用于提交到服务器
    editingEvent.detail_images.push(response.data.url);
    ElMessage.success('详情图片上传成功');
  } else {
    ElMessage.error(response.msg || '图片上传失败');
  }
};

// 处理详情图片删除
const handleDetailImageRemove = (uploadFile) => {
  const index = detailImagesList.value.indexOf(uploadFile);
  if (index !== -1) {
    editingEvent.detail_images.splice(index, 1);
  }
};

// 转换详情图片为上传组件所需格式
const formatDetailImages = (images) => {
  if (!images || !Array.isArray(images)) return [];
  return images.map((url, index) => ({
    name: `图片${index + 1}`,
    url: getImageDisplayUrl(url) // 显示时使用完整URL
  }));
};

// 添加表单字段
const addFormField = () => {
  if (!editingEvent.form_config) {
    editingEvent.form_config = [];
  }
  editingEvent.form_config.push({
    name: '',
    label: '',
    type: 'text',
    required: false
  });
};

// 删除表单字段
const removeFormField = (index) => {
  editingEvent.form_config.splice(index, 1);
};

// 添加选项
const addOption = (fieldIndex) => {
  const field = editingEvent.form_config[fieldIndex];
  if (!field.options) {
    field.options = [];
  }
  field.options.push('');
};

// 删除选项
const removeOption = (fieldIndex, optionIndex) => {
  editingEvent.form_config[fieldIndex].options.splice(optionIndex, 1);
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

    console.log('删除活动API响应:', res);
    console.log('响应类型:', typeof res);
    console.log('响应code:', res.code);
    console.log('响应success:', res.success);
    console.log('响应message:', res.message);
    console.log('响应msg:', res.msg);

    // 兼容两种响应格式
    const isSuccess = res.code === 0 || res.success === true;
    const message = res.msg || res.message;

    if (isSuccess) {
      ElMessage.success(`活动 "${row.title}" 已成功删除`);
      fetchEvents(); // 重新加载活动列表
    } else {
      console.error('删除失败，响应:', res);
      ElMessage.error(message || '删除活动失败');
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