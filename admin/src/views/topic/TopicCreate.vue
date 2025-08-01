<template>
  <div class="topic-create-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>创建话题</h3>
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
        
        <el-form-item label="封面图" prop="cover_image">
          <el-upload
            class="avatar-uploader"
            action="http://localhost:3000/api/upload"
            :headers="uploadHeaders"
            name="file"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
          >
            <img v-if="topicForm.cover_image" :src="topicForm.cover_image" class="avatar" />
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
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">保存</el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import api from '@/utils/api';

export default {
  name: 'TopicCreate',
  components: {
    Plus
  },
  setup() {
    const topicFormRef = ref(null);
    const loading = ref(false);
    const router = useRouter();
    
    const topicForm = reactive({
      name: '',
      description: '',
      cover_image: '',
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
    
    // 提交表单
    const submitForm = () => {
      topicFormRef.value.validate(async (valid) => {
        if (valid) {
          loading.value = true;
          try {
            const response = await api.topics.create(topicForm);
            if (response.success) {
              ElMessage.success('话题创建成功');
              goBack();
            } else {
              ElMessage.error(response.message || '创建失败');
            }
          } catch (error) {
            console.error('创建话题错误:', error);
            ElMessage.error('创建失败: ' + (error.message || '未知错误'));
          } finally {
            loading.value = false;
          }
        } else {
          return false;
        }
      });
    };
    
    // 上传成功处理
    const handleUploadSuccess = (response) => {
      if (response.success && response.data && response.data.url) {
        topicForm.cover_image = response.data.url;
      } else {
        ElMessage.error('图片上传失败');
      }
    };
    
    // 上传失败处理
    const handleUploadError = () => {
      ElMessage.error('图片上传失败');
    };
    
    // 上传前验证
    const beforeUpload = (file) => {
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG) {
        ElMessage.error('上传头像图片只能是JPG/PNG/GIF格式!');
      }
      if (!isLt2M) {
        ElMessage.error('上传头像图片大小不能超过2MB!');
      }
      return isJPG && isLt2M;
    };
    
    // 返回列表
    const goBack = () => {
      router.push('/topics/list');
    };

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
      goBack
    };
  }
};
</script>

<style scoped>
.topic-create-container {
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
}

.avatar-uploader:hover {
  border-color: #409EFF;
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
  margin-top: 5px;
  font-size: 12px;
  color: #606266;
}
</style> 