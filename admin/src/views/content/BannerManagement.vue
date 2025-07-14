<template>
  <div class="banner-management">
    <div class="page-header">
      <h2>轮播图管理</h2>
      <el-button type="primary" @click="handleAdd">添加轮播图</el-button>
    </div>

    <!-- 自定义通知组件 - 调整位置和样式 -->
    <el-alert
      v-if="notification.show" 
      :title="notification.message"
      :type="notification.type"
      :closable="true"
      @close="closeNotification"
      show-icon
      style="margin-bottom: 15px; position: sticky; top: 0; z-index: 100;"
    />

    <!-- 搜索和筛选区域 -->
    <div class="filter-container">
      <el-form :inline="true" :model="listQuery" size="small">
        <el-form-item label="状态">
          <el-select v-model="listQuery.status" placeholder="选择状态" clearable @change="fetchBanners">
            <el-option label="启用" :value="'active'" />
            <el-option label="禁用" :value="'inactive'" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="listQuery.platform" placeholder="选择平台" clearable @change="fetchBanners">
            <el-option label="全部" :value="'all'" />
            <el-option label="移动端" :value="'app'" />
            <el-option label="网页端" :value="'web'" />
            <el-option label="后台" :value="'admin'" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchBanners">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 轮播图列表 -->
    <el-table
      v-loading="loading"
      :data="bannerList"
      stripe
      border
      style="width: 100%"
    >
      <el-table-column label="ID" prop="id" width="80" />
      <el-table-column label="标题" prop="title" min-width="120" />
      <el-table-column label="排序" prop="sort" width="80" />
      <el-table-column label="平台" width="100">
        <template #default="{ row }">
          <el-tag :type="getPlatformTagType(row.platform)">
            {{ getPlatformLabel(row.platform) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getTypeTagType(row.type)">
            {{ getTypeLabel(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="有效期" width="240">
        <template #default="{ row }">
          <div v-if="row.startTime || row.endTime">
            {{ row.startTime ? formatDate(row.startTime) : '无限制' }} 至 
            {{ row.endTime ? formatDate(row.endTime) : '无限制' }}
          </div>
          <span v-else>无限制</span>
        </template>
      </el-table-column>
      <el-table-column label="图片" width="150">
        <template #default="{ row }">
          <el-image 
            style="width: 120px; height: 60px" 
            :src="getImageUrl(row.image)" 
            fit="cover"
            :preview-src-list="[getImageUrl(row.image)]">
          </el-image>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="handleDelete(row)"
            :loading="deleteLoading === row.id"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next"
        :current-page="listQuery.page"
        :page-sizes="[10, 20, 30, 50]"
        :page-size="listQuery.limit"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 添加/编辑轮播图对话框 -->
    <el-dialog 
      :title="dialogStatus === 'create' ? '添加轮播图' : '编辑轮播图'" 
      v-model="dialogVisible"
      width="650px"
    >
      <el-form 
        ref="bannerFormRef" 
        :model="bannerForm" 
        :rules="bannerRules" 
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="bannerForm.title" placeholder="请输入轮播图标题" />
        </el-form-item>
        
        <el-form-item label="图片" prop="image">
          <el-upload
            class="avatar-uploader"
            :action="`${baseApiUrl}/upload`"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :before-upload="beforeImageUpload"
          >
            <img v-if="bannerForm.image" :src="getImageUrl(bannerForm.image)" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">建议尺寸：750px × 350px</div>
        </el-form-item>
        
        <el-form-item label="链接类型" prop="type">
          <el-select v-model="bannerForm.type" placeholder="请选择链接类型">
            <el-option label="外部链接" value="url" />
            <el-option label="帖子" value="post" />
            <el-option label="话题" value="topic" />
            <el-option label="活动" value="event" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="目标ID" prop="targetId" v-if="bannerForm.type !== 'url' && bannerForm.type !== 'none'">
          <el-input v-model.number="bannerForm.targetId" placeholder="请输入目标ID" type="number" />
        </el-form-item>
        
        <el-form-item label="跳转链接" prop="url" v-if="bannerForm.type === 'url'">
          <el-input v-model="bannerForm.url" placeholder="请输入跳转链接" />
        </el-form-item>
        
        <el-form-item label="展示平台" prop="platform">
          <el-select v-model="bannerForm.platform" placeholder="请选择展示平台">
            <el-option label="全部" value="all" />
            <el-option label="移动端" value="app" />
            <el-option label="网页端" value="web" />
            <el-option label="后台" value="admin" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="bannerForm.sort" :min="0" :max="999" />
          <span class="form-tip">数字越小越靠前</span>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="bannerForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="有效期">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            @change="handleDateRangeChange"
          />
          <div class="form-tip">不设置则表示永久有效</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">
            {{ dialogStatus === 'create' ? '创建' : '更新' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { reactive, ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { formatDate } from '@/utils/format';
import API from '@/utils/api';

export default {
  name: 'BannerManagement',
  components: {
    Plus
  },
  setup() {
    // 基础API URL
    const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:12349/api';
    
    // 自定义通知状态
    const notification = reactive({
      show: false,
      message: '',
      type: 'success', // success, warning, info, error
    });

    // 关闭通知
    const closeNotification = () => {
      notification.show = false;
    };

    // 显示通知
    const showNotification = (message, type = 'success') => {
      console.log('显示通知:', message, type); // 添加调试日志
      notification.message = message;
      notification.type = type;
      notification.show = true;
      
      // 延长显示时间
      setTimeout(() => {
        notification.show = false;
      }, 8000); // 增加到8秒
    };
    
    // 上传头部
    const uploadHeaders = {
      Authorization: `Bearer ${localStorage.getItem('admin_token')}`
    };
    
    // 列表查询参数
    const listQuery = reactive({
      page: 1,
      limit: 10,
      status: '',
      platform: ''
    });
    
    // 轮播图列表数据
    const bannerList = ref([]);
    const total = ref(0);
    const loading = ref(false);
    const deleteLoading = ref(null);
    
    // 对话框显示状态
    const dialogVisible = ref(false);
    const dialogStatus = ref('create'); // create或edit
    const submitLoading = ref(false);
    
    // 表单引用
    const bannerFormRef = ref(null);
    
    // 轮播图表单数据
    const bannerForm = reactive({
      id: undefined,
      title: '',
      image: '',
      url: '',
      type: 'url',
      targetId: null,
      platform: 'all',
      sort: 0,
      status: 'active',
      startTime: null,
      endTime: null
    });
    
    // 日期范围
    const dateRange = ref([]);
    
    // 处理日期范围变化
    const handleDateRangeChange = (val) => {
      if (val && val.length === 2) {
        bannerForm.startTime = val[0];
        bannerForm.endTime = val[1];
      } else {
        bannerForm.startTime = null;
        bannerForm.endTime = null;
      }
    };
    
    // 表单验证规则
    const bannerRules = {
      title: [
        { required: true, message: '请输入轮播图标题', trigger: 'blur' },
        { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
      ],
      image: [
        { required: true, message: '请上传轮播图图片', trigger: 'change' }
      ],
      url: [
        { required: false, message: '请输入跳转链接', trigger: 'blur' }
      ],
      type: [
        { required: true, message: '请选择链接类型', trigger: 'change' }
      ],
      targetId: [
        { required: false, type: 'number', message: '请输入有效的目标ID', trigger: 'blur' }
      ],
      platform: [
        { required: true, message: '请选择展示平台', trigger: 'change' }
      ],
      sort: [
        { required: true, type: 'number', message: '请输入排序值', trigger: 'blur' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ]
    };
    
    // 获取轮播图列表
    const fetchBanners = async () => {
      loading.value = true;
      try {
        const params = {
          page: listQuery.page,
          limit: listQuery.limit
        };
        
        if (listQuery.status) {
          params.status = listQuery.status; // 直接使用字符串格式
        }
        
        if (listQuery.platform) {
          params.platform = listQuery.platform;
        }
        
        console.log('📋 轮播图查询参数:', params);
        
        const res = await API.content.getBanners(params);
        console.log('📊 完整API响应:', res);
        
        // 检查res是否存在且有正确的格式
        if (res) {
          console.log('🔍 API响应结构:', JSON.stringify(res, null, 2));
          
          // 显式检查是否有数据返回
          if (res.data && res.data.items) {
            console.log('✅ 成功获取数据，项目数量:', res.data.items.length);
            bannerList.value = res.data.items;
            total.value = res.data.total || 0;
          } else if (res.success === false) {
            console.error('❌ 获取失败, 错误信息:', res.message);
            ElMessage.error(res.message || '获取轮播图列表失败');
          } else {
            // 可能是304响应，数据为空
            console.warn('⚠️ 响应成功但数据格式不完整:', res);
            // 尝试重新加载，绕过缓存
            console.log('尝试重新加载，绕过缓存...');
            bannerList.value = [];
            total.value = 0;
            ElMessage.info('数据为空或格式不正确，请尝试重新加载');
          }
        } else {
          console.error('❌ 获取失败，响应为空');
          ElMessage.error('获取轮播图列表失败，响应为空');
        }
      } catch (error) {
        console.error('❌ 获取轮播图列表错误:', error);
        console.error('详细错误信息:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          response: error.response
        });
        ElMessage.error(`获取轮播图列表失败: ${error.message || '未知错误'}`);
      } finally {
        loading.value = false;
      }
    };
    
    // 重置过滤条件
    const resetFilter = () => {
      listQuery.status = '';
      listQuery.platform = '';
      fetchBanners();
    };
    
    // 处理添加轮播图
    const handleAdd = () => {
      resetForm();
      dialogStatus.value = 'create';
      dialogVisible.value = true;
    };
    
    // 处理编辑轮播图
    const handleEdit = (row) => {
      resetForm();
      dialogStatus.value = 'edit';
      
      Object.keys(bannerForm).forEach(key => {
        if (key in row) {
          bannerForm[key] = row[key];
        }
      });
      
      // 设置日期范围
      if (bannerForm.startTime || bannerForm.endTime) {
        dateRange.value = [
          bannerForm.startTime ? new Date(bannerForm.startTime) : null,
          bannerForm.endTime ? new Date(bannerForm.endTime) : null
        ];
      } else {
        dateRange.value = [];
      }
      
      dialogVisible.value = true;
    };
    
    // 处理删除轮播图
    const handleDelete = (row) => {
      ElMessageBox.confirm('确定要删除这个轮播图吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        deleteLoading.value = row.id;
        try {
          const res = await API.content.deleteBanner(row.id);
          if (res.success) {
            // 先显示自定义通知，确保在UI更新前显示
            showNotification('Banner删除成功', 'success');
            
            // 立即从本地列表中移除该条目，确保UI立即更新
            const index = bannerList.value.findIndex(item => item.id === row.id);
            if (index !== -1) {
              bannerList.value.splice(index, 1);
              // 更新总数
              if (total.value > 0) {
                total.value -= 1;
              }
              
              // 使用成功样式显示提示，确保是绿色的成功提示而非红色
              ElMessage({
                message: '删除成功',
                type: 'success',
                duration: 2000
              });
            } else {
              console.warn('找不到要删除的Banner，ID:', row.id);
              
              ElMessage({
                message: '删除成功，请刷新查看最新数据',
                type: 'success',
                duration: 2000
              });
              
              // 找不到要删除的项，可能是数据不一致，刷新整个列表
              fetchBanners();
            }
          } else {
            console.error('删除失败，服务器返回:', res);
            ElMessage.error(res.message || '删除失败');
            // 删除失败，刷新列表确保数据一致性
            fetchBanners();
          }
        } catch (error) {
          console.error('删除轮播图错误:', error);
          ElMessage.error('删除失败');
          // 发生错误，刷新列表确保数据一致性
          fetchBanners();
        } finally {
          deleteLoading.value = null;
        }
      }).catch(() => {
        // 用户取消删除，不做任何操作
      });
    };
    
    // 重置表单
    const resetForm = () => {
      Object.assign(bannerForm, {
        id: undefined,
        title: '',
        image: '',
        url: '',
        type: 'url',
        targetId: null,
        platform: 'all',
        sort: 0,
        status: 'active',
        startTime: null,
        endTime: null
      });
      dateRange.value = [];
      if (bannerFormRef.value) {
        bannerFormRef.value.resetFields();
      }
    };
    
    // 提交表单
    const submitForm = async () => {
      if (!bannerFormRef.value) return;
      
      await bannerFormRef.value.validate(async (valid) => {
        if (!valid) return;
        
        submitLoading.value = true;
        
        try {
          const data = { ...bannerForm };
          
          // 根据类型处理字段
          if (data.type === 'url') {
            data.targetId = null;
            // 确保URL格式正确
            if (!data.url) {
              ElMessage.warning('外部链接类型必须填写链接URL');
              submitLoading.value = false;
              return;
            }
            
            if (!data.url.startsWith('http://') && !data.url.startsWith('https://')) {
              data.url = 'http://' + data.url;
            }
          } else {
            data.url = '';
            
            // 确保targetId存在
            if (!data.targetId) {
              ElMessage.warning(`${data.type}类型必须选择目标ID`);
              submitLoading.value = false;
              return;
            }
          }
          
          // status已经是字符串格式('active'或'inactive')，不需要转换
          
          const isEdit = dialogStatus.value === 'edit';
          let res;
          
          console.log('提交数据:', JSON.stringify(data, null, 2));
          
          try {
            if (isEdit) {
              res = await API.content.updateBanner(data.id, data);
            } else {
              res = await API.content.createBanner(data);
            }
            
            console.log('API响应:', JSON.stringify(res, null, 2));
            
            // 改进的响应检查
            const isSuccess = res && (res.success === true || res.status === 201 || res.status === 200);
            
            if (isSuccess) {
              // 先显示自定义通知
              showNotification(`Banner${isEdit ? '更新' : '创建'}成功`, 'success');
              
              // 使用弹窗通知
              ElMessage({
                message: isEdit ? '更新成功' : '创建成功',
                type: 'success',
                duration: 2000
              });
              
              // 确保关闭对话框
              setTimeout(() => {
                dialogVisible.value = false;
                console.log('对话框已关闭');
              }, 100);
              
              // 延迟一会儿再刷新列表，给通知显示的时间
              setTimeout(() => {
                fetchBanners();
              }, 500);
            } else {
              console.error('操作失败，响应:', res);
              // 显示错误通知
              showNotification(res?.message || (isEdit ? '更新失败' : '创建失败'), 'error');
              ElMessage.error(res?.message || (isEdit ? '更新失败' : '创建失败'));
            }
          } catch (apiError) {
            console.error('API调用错误:', apiError);
            showNotification(`API错误: ${apiError.message}`, 'error');
            ElMessage.error(`API错误: ${apiError.message}`);
          }
        } catch (error) {
          console.error('提交轮播图表单错误:', error);
          showNotification('表单提交错误', 'error');
          ElMessage.error(dialogStatus.value === 'edit' ? '更新失败' : '创建失败');
        } finally {
          submitLoading.value = false;
        }
      });
    };
    
    // 分页处理
    const handleSizeChange = (val) => {
      listQuery.limit = val;
      fetchBanners();
    };
    
    const handleCurrentChange = (val) => {
      listQuery.page = val;
      fetchBanners();
    };
    
    // 图片上传相关方法
    const beforeImageUpload = (file) => {
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
    
    const handleImageSuccess = (res) => {
      if (res.success && res.data && res.data.url) {
        // 直接使用完整URL，不做处理
        bannerForm.image = res.data.url;
      } else {
        ElMessage.error('上传失败');
      }
    };
    
    // 获取完整图片URL
    const getImageUrl = (path) => {
      if (!path) return '';
      if (path.startsWith('http')) {
        return path;
      }
      // 如果是相对路径，转换为绝对路径
      return `${baseApiUrl}/${path.startsWith('/') ? path.substring(1) : path}`;
    };
    
    // 获取平台标签类型
    const getPlatformTagType = (platform) => {
      const types = {
        all: '',
        app: 'success',
        web: 'warning',
        admin: 'danger'
      };
      return types[platform] || '';
    };
    
    // 获取平台标签文本
    const getPlatformLabel = (platform) => {
      const labels = {
        all: '全部',
        app: '移动端',
        web: '网页端',
        admin: '后台'
      };
      return labels[platform] || platform;
    };
    
    // 获取类型标签类型
    const getTypeTagType = (type) => {
      const types = {
        url: '',
        post: 'success',
        topic: 'warning',
        event: 'info',
        none: 'info'
      };
      return types[type] || '';
    };
    
    // 获取类型标签文本
    const getTypeLabel = (type) => {
      const labels = {
        url: '外部链接',
        post: '帖子',
        topic: '话题',
        event: '活动',
        none: '无链接'
      };
      return labels[type] || type;
    };
    
    // 初始化
    onMounted(() => {
      // 确保通知一开始是隐藏的
      notification.show = false;
      
      // 添加一个测试通知，确认通知系统正常工作
      setTimeout(() => {
        console.log('测试通知系统');
        showNotification('轮播图管理已加载完成', 'success');
      }, 1000);
      
      fetchBanners();
    });
    
    return {
      baseApiUrl,
      uploadHeaders,
      listQuery,
      bannerList,
      total,
      loading,
      deleteLoading,
      dialogVisible,
      dialogStatus,
      submitLoading,
      bannerFormRef,
      bannerForm,
      bannerRules,
      dateRange,
      fetchBanners,
      resetFilter,
      handleAdd,
      handleEdit,
      handleDelete,
      submitForm,
      handleSizeChange,
      handleCurrentChange,
      beforeImageUpload,
      handleImageSuccess,
      getImageUrl,
      handleDateRangeChange,
      getPlatformTagType,
      getPlatformLabel,
      getTypeTagType,
      getTypeLabel,
      formatDate,
      notification,
      closeNotification,
      showNotification
    };
  }
};
</script>

<style scoped>
.banner-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 添加通知样式 */
:deep(.el-alert) {
  margin-bottom: 15px !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 100 !important;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1) !important;
  border-radius: 4px !important;
  font-size: 16px !important;
  font-weight: bold !important;
}

:deep(.el-alert--success) {
  background-color: #f0f9eb !important;
  border: 1px solid #67c23a !important;
}

:deep(.el-alert--error) {
  background-color: #fef0f0 !important;
  border: 1px solid #f56c6c !important;
}

.filter-container {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 178px;
  height: 178px;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: cover;
}

.upload-tip, .form-tip {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
}
</style> 