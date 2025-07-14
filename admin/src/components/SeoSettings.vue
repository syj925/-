<template>
  <div class="seo-settings">
    <el-form :model="seoData" :rules="rules" ref="seoFormRef" label-position="top">
      <el-form-item label="Meta标题 (SEO标题)" prop="metaTitle">
        <el-input 
          v-model="seoData.metaTitle" 
          placeholder="请输入Meta标题" 
          :maxlength="100"
          show-word-limit
        ></el-input>
        <div class="tip">SEO标题是搜索引擎结果中显示的标题，建议控制在60个字符以内</div>
      </el-form-item>
      
      <el-form-item label="Meta描述" prop="metaDescription">
        <el-input 
          v-model="seoData.metaDescription" 
          type="textarea" 
          :rows="3" 
          placeholder="请输入Meta描述"
          :maxlength="200"
          show-word-limit
        ></el-input>
        <div class="tip">Meta描述是搜索结果中显示的简短描述，建议控制在160个字符以内</div>
      </el-form-item>
      
      <el-form-item label="Meta关键词" prop="metaKeywords">
        <el-input 
          v-model="seoData.metaKeywords" 
          placeholder="请输入Meta关键词，多个关键词用英文逗号分隔" 
          :maxlength="100"
          show-word-limit
        ></el-input>
        <div class="tip">关键词有助于搜索引擎理解内容，建议5-8个关键词，用逗号分隔</div>
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

const seoFormRef = ref(null);
const seoData = reactive({
  metaTitle: '',
  metaDescription: '',
  metaKeywords: ''
});

const rules = {
  metaTitle: [
    { max: 100, message: 'Meta标题不能超过100个字符', trigger: 'blur' }
  ],
  metaDescription: [
    { max: 200, message: 'Meta描述不能超过200个字符', trigger: 'blur' }
  ],
  metaKeywords: [
    { max: 100, message: 'Meta关键词不能超过100个字符', trigger: 'blur' }
  ]
};

// 初始化表单数据
const initFormData = () => {
  if (props.initialData) {
    seoData.metaTitle = props.initialData.metaTitle || '';
    seoData.metaDescription = props.initialData.metaDescription || '';
    seoData.metaKeywords = props.initialData.metaKeywords || '';
  }
};

// 提交表单
const submitForm = () => {
  seoFormRef.value.validate((valid) => {
    if (valid) {
      emit('submit', {
        id: props.topicId,
        ...seoData
      });
    } else {
      return false;
    }
  });
};

// 重置表单
const resetForm = () => {
  seoFormRef.value.resetFields();
  initFormData(); // 重置为初始值
  emit('reset');
};

// 重置为默认值
const resetToDefaults = () => {
  seoData.metaTitle = '';
  seoData.metaDescription = '';
  seoData.metaKeywords = '';
};

// 获取表单数据方法，供父组件调用
const getFormData = () => {
  return { ...seoData };
};

// 验证表单方法，供父组件调用
const validate = () => {
  return new Promise((resolve, reject) => {
    seoFormRef.value.validate((valid) => {
      if (valid) {
        resolve({ ...seoData });
      } else {
        reject('SEO表单验证失败');
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
.seo-settings {
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