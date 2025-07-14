<template>
  <div class="review-config">
    <el-form :model="configData" :rules="rules" ref="configFormRef" label-position="top">
      <el-form-item label="敏感词过滤级别" prop="sensitiveWordsLevel">
        <el-radio-group v-model="configData.sensitiveWordsLevel">
          <el-radio-button label="low">低级过滤</el-radio-button>
          <el-radio-button label="medium">中级过滤</el-radio-button>
          <el-radio-button label="high">高级过滤</el-radio-button>
        </el-radio-group>
        <div class="tip">过滤级别越高，过滤的敏感词范围越广</div>
      </el-form-item>
      
      <el-form-item label="自动审核" prop="autoReview">
        <el-switch 
          v-model="configData.autoReview" 
          active-text="启用" 
          inactive-text="禁用"
        ></el-switch>
        <div class="tip">开启后，系统将自动审核相关话题下的内容</div>
      </el-form-item>
      
      <el-form-item label="自定义敏感词 (逗号分隔)" prop="customSensitiveWords">
        <el-input 
          v-model="configData.customSensitiveWords" 
          type="textarea" 
          :rows="3" 
          placeholder="请输入自定义敏感词，多个敏感词用英文逗号分隔"
        ></el-input>
        <div class="tip">这些词将被系统识别为敏感词，多个敏感词用逗号分隔</div>
      </el-form-item>
      
      <el-form-item label="禁止发布词语 (逗号分隔)" prop="bannedWords">
        <el-input 
          v-model="configData.bannedWords" 
          type="textarea" 
          :rows="3" 
          placeholder="请输入禁止发布的词语，多个词语用英文逗号分隔"
        ></el-input>
        <div class="tip">含有这些词语的内容将被直接拒绝发布，多个词语用逗号分隔</div>
      </el-form-item>
      
      <div class="form-actions" v-if="isEditable">
        <el-button @click="resetForm">重置</el-button>
        <el-button type="primary" @click="submitForm" :loading="loading">保存</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, defineProps, defineEmits, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  topicId: {
    type: [Number, String],
    required: true
  },
  initialData: {
    type: Object,
    default: () => ({})
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit', 'reset']);

const configFormRef = ref(null);
const configData = reactive({
  sensitiveWordsLevel: 'medium',
  autoReview: false,
  customSensitiveWords: '',
  bannedWords: ''
});

const rules = {
  sensitiveWordsLevel: [
    { required: true, message: '请选择敏感词过滤级别', trigger: 'change' }
  ]
};

// 初始化表单数据
const initFormData = () => {
  if (props.initialData) {
    configData.sensitiveWordsLevel = props.initialData.sensitiveWordsLevel || 'medium';
    configData.autoReview = !!props.initialData.autoReview;
    configData.customSensitiveWords = props.initialData.customSensitiveWords || '';
    configData.bannedWords = props.initialData.bannedWords || '';
  }
};

// 提交表单
const submitForm = () => {
  configFormRef.value.validate((valid) => {
    if (valid) {
      emit('submit', {
        id: props.topicId,
        ...configData
      });
    } else {
      return false;
    }
  });
};

// 重置表单
const resetForm = () => {
  configFormRef.value.resetFields();
  initFormData(); // 重置为初始值
  emit('reset');
};

// 重置为默认值
const resetToDefaults = () => {
  configData.sensitiveWordsLevel = 'medium';
  configData.autoReview = false;
  configData.customSensitiveWords = '';
  configData.bannedWords = '';
};

// 获取表单数据方法，供父组件调用
const getFormData = () => {
  return { ...configData };
};

// 验证表单方法，供父组件调用
const validate = () => {
  return new Promise((resolve, reject) => {
    configFormRef.value.validate((valid) => {
      if (valid) {
        resolve({ ...configData });
      } else {
        reject('审核配置表单验证失败');
      }
    });
  });
};

// 暴露方法给父组件
defineExpose({
  getFormData,
  validate,
  resetForm,
  resetToDefaults
});

onMounted(() => {
  initFormData();
});
</script>

<style scoped>
.review-config {
  padding: 10px 0;
}

.tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 