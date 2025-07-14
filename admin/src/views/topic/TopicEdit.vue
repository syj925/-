<template>
  <div class="topic-edit-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>编辑话题</h3>
          <el-button @click="goBack">返回列表</el-button>
        </div>
      </template>
      
      <el-form 
        :model="topicForm" 
        :rules="rules" 
        ref="topicFormRef" 
        label-width="100px"
        v-loading="loading"
      >
        <el-form-item label="话题名称" prop="name">
          <el-input v-model="topicForm.name" placeholder="请输入话题名称" />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="topicForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入话题描述"
          />
        </el-form-item>
        
        <el-form-item label="封面图" prop="coverImage">
          <el-upload
            class="avatar-uploader"
            action="http://localhost:12349/api/upload"
            :headers="uploadHeaders"
            name="file"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
          >
            <img v-if="topicForm.coverImage" :src="topicForm.coverImage" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">建议尺寸: 800x450px，大小不超过2MB</div>
        </el-form-item>
        
        <el-form-item label="话题状态" prop="status">
          <el-select v-model="topicForm.status" placeholder="请选择话题状态">
            <el-option label="正常" value="active" />
            <el-option label="隐藏" value="hidden" />
          </el-select>
        </el-form-item>
        
        <el-form-item v-if="topicForm.imageStatus === 'pending'" label="待审核图片">
          <div class="pending-image-container">
            <el-image 
              :src="topicForm.pendingImage" 
              fit="cover" 
              class="pending-image"
              :preview-src-list="[topicForm.pendingImage]"
            />
            <div class="image-actions">
              <el-button type="success" @click="handleImageAction('approve')">批准</el-button>
              <el-button type="danger" @click="handleImageAction('reject')">拒绝</el-button>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">保存</el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import api from '@/utils/api';

export default {
  name: 'TopicEdit',
  components: {
    Plus
  },
  setup() {
    const topicFormRef = ref(null);
    const loading = ref(false);
    const route = useRoute();
    const router = useRouter();
    const topicId = route.params.id;
    
    const topicForm = reactive({
      id: null,
      name: '',
      description: '',
      coverImage: '',
      pendingImage: '',
      imageStatus: '',
      status: 'active'
    });
    
    const rules = {
      name: [
        { required: true, message: '请输入话题名称', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
      ],
      description: [
        { max: 200, message: '描述最多200个字符', trigger: 'blur' }
      ],
      status: [
        { required: true, message: '请选择话题状态', trigger: 'change' }
      ]
    };
    
    const uploadHeaders = {
      Authorization: `Bearer ${localStorage.getItem('admin_token')}`
    };
    
    // 获取话题详情
    const fetchTopicDetail = async () => {
      loading.value = true;
      try {
        const response = await api.topics.getDetail(topicId);
        if (response.success && response.data) {
          const topic = response.data;
          Object.assign(topicForm, {
            id: topic.id,
            name: topic.name,
            description: topic.description || '',
            coverImage: topic.coverImage || '',
            pendingImage: topic.pendingImage || '',
            imageStatus: topic.imageStatus || 'default',
            status: topic.status || 'active'
          });
        } else {
          ElMessage.error('获取话题详情失败');
          goBack();
        }
      } catch (error) {
        console.error('获取话题详情错误:', error);
        ElMessage.error('获取话题详情失败: ' + (error.message || '未知错误'));
        goBack();
      } finally {
        loading.value = false;
      }
    };
    
    // 提交表单
    const submitForm = () => {
      topicFormRef.value.validate(async (valid) => {
        if (valid) {
          loading.value = true;
          try {
            const response = await api.topics.update(topicId, topicForm);
            if (response.success) {
              ElMessage.success('话题更新成功');
              goBack();
            } else {
              ElMessage.error(response.message || '更新失败');
            }
          } catch (error) {
            console.error('更新话题错误:', error);
            ElMessage.error('更新失败: ' + (error.message || '未知错误'));
          } finally {
            loading.value = false;
          }
        } else {
          return false;
        }
      });
    };
    
    // 审核图片
    const handleImageAction = async (action) => {
      try {
        loading.value = true;
        const response = await api.topics.reviewTopicImage(topicId, { action });
        if (response.success) {
          ElMessage.success(action === 'approve' ? '图片已批准' : '图片已拒绝');
          await fetchTopicDetail();
        } else {
          ElMessage.error(response.message || '操作失败');
        }
      } catch (error) {
        console.error('审核图片错误:', error);
        ElMessage.error('操作失败: ' + (error.message || '未知错误'));
      } finally {
        loading.value = false;
      }
    };
    
    // 上传成功处理
    const handleUploadSuccess = (response) => {
      if (response.success && response.data && response.data.url) {
        topicForm.coverImage = response.data.url;
        ElMessage.success('上传成功');
      } else {
        ElMessage.error('上传失败: ' + (response.message || '未知错误'));
      }
    };
    
    // 上传失败处理
    const handleUploadError = (error) => {
      console.error('上传失败:', error);
      ElMessage.error('上传失败，请重试');
    };
    
    // 上传前检查
    const beforeUpload = (file) => {
      const isImage = file.type.startsWith('image/');
      const isLt2M = file.size / 1024 / 1024 < 2;
      
      if (!isImage) {
        ElMessage.error('上传文件必须是图片格式!');
        return false;
      }
      if (!isLt2M) {
        ElMessage.error('上传图片大小不能超过 2MB!');
        return false;
      }
      return true;
    };
    
    // 返回列表
    const goBack = () => {
      router.push('/topics/list');
    };
    
    onMounted(() => {
      fetchTopicDetail();
    });
    
    return {
      topicFormRef,
      topicForm,
      rules,
      loading,
      uploadHeaders,
      submitForm,
      handleUploadSuccess,
      handleUploadError,
      beforeUpload,
      handleImageAction,
      goBack
    };
  }
};
</script>

<style scoped>
.topic-edit-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-uploader {
  width: 178px;
  height: 178px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
  margin-bottom: 5px;
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

.upload-tip {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
}

.pending-image-container {
  display: flex;
  flex-direction: column;
}

.pending-image {
  width: 300px;
  height: 169px;
  object-fit: cover;
  margin-bottom: 10px;
}

.image-actions {
  display: flex;
  gap: 10px;
}
</style> 