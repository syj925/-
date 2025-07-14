<template>
  <div class="topic-merge-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>话题合并</h3>
        </div>
      </template>
      
      <el-alert
        type="warning"
        :closable="false"
        show-icon
      >
        <p><strong>警告：</strong>合并操作不可逆，将会把源话题的所有内容移至目标话题，并删除源话题。</p>
        <p>请确保您了解此操作的影响并且有足够的权限执行此操作。</p>
      </el-alert>
      
      <div class="merge-form-container">
        <el-form :model="mergeForm" :rules="rules" ref="mergeFormRef" label-position="top">
          <el-row :gutter="20">
            <el-col :span="11">
              <el-form-item label="源话题 (将被合并)" prop="sourceId">
                <el-select
                  v-model="mergeForm.sourceId"
                  filterable
                  placeholder="选择源话题"
                  style="width: 100%"
                  @change="handleSourceChange"
                >
                  <el-option
                    v-for="topic in topicOptions"
                    :key="topic.id"
                    :label="topic.name"
                    :value="topic.id"
                  >
                    <div class="topic-option">
                      <span>{{ topic.name }}</span>
                      <span class="topic-usage">使用量: {{ topic.usageCount }}</span>
                    </div>
                  </el-option>
                </el-select>
                
                <div v-if="sourceTopic" class="topic-preview">
                  <h4>源话题信息</h4>
                  <p><strong>名称：</strong>{{ sourceTopic.name }}</p>
                  <p><strong>描述：</strong>{{ sourceTopic.description || '无' }}</p>
                  <p><strong>使用次数：</strong>{{ sourceTopic.usageCount }}</p>
                  <p><strong>状态：</strong>{{ getStatusText(sourceTopic.status) }}</p>
                </div>
              </el-form-item>
            </el-col>
            
            <el-col :span="2" class="merge-arrow">
              <el-icon size="32" color="#909399"><ArrowRight /></el-icon>
            </el-col>
            
            <el-col :span="11">
              <el-form-item label="目标话题 (保留)" prop="targetId">
                <el-select
                  v-model="mergeForm.targetId"
                  filterable
                  placeholder="选择目标话题"
                  style="width: 100%"
                  @change="handleTargetChange"
                  :disabled="!mergeForm.sourceId"
                >
                  <el-option
                    v-for="topic in filteredTopicOptions"
                    :key="topic.id"
                    :label="topic.name"
                    :value="topic.id"
                    :disabled="topic.id === mergeForm.sourceId"
                  >
                    <div class="topic-option">
                      <span>{{ topic.name }}</span>
                      <span class="topic-usage">使用量: {{ topic.usageCount }}</span>
                    </div>
                  </el-option>
                </el-select>
                
                <div v-if="targetTopic" class="topic-preview">
                  <h4>目标话题信息</h4>
                  <p><strong>名称：</strong>{{ targetTopic.name }}</p>
                  <p><strong>描述：</strong>{{ targetTopic.description || '无' }}</p>
                  <p><strong>使用次数：</strong>{{ targetTopic.usageCount }}</p>
                  <p><strong>状态：</strong>{{ getStatusText(targetTopic.status) }}</p>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          
          <div class="merge-result" v-if="mergeForm.sourceId && mergeForm.targetId">
            <h4>合并后结果预览</h4>
            <p>
              <strong>合并后话题名称：</strong> {{ targetTopic?.name || '' }}
            </p>
            <p>
              <strong>合并后描述：</strong> {{ targetTopic?.description || '' }}
            </p>
            <p>
              <strong>合并后使用次数：</strong> {{ getMergedUsageCount() }}
            </p>
          </div>
          
          <div class="form-actions">
            <el-button @click="resetForm">取消</el-button>
            <el-button
              type="primary"
              :loading="merging"
              @click="submitMerge"
              :disabled="!mergeForm.sourceId || !mergeForm.targetId || mergeForm.sourceId === mergeForm.targetId"
            >
              合并话题
            </el-button>
          </div>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowRight } from '@element-plus/icons-vue';
import api from '../../utils/api';

// 表单数据
const mergeForm = reactive({
  sourceId: null,
  targetId: null
});

// 表单校验规则
const rules = {
  sourceId: [
    { required: true, message: '请选择源话题', trigger: 'change' }
  ],
  targetId: [
    { required: true, message: '请选择目标话题', trigger: 'change' }
  ]
};

// 引用
const mergeFormRef = ref(null);
const loading = ref(false);
const merging = ref(false);

// 数据
const topicList = ref([]);
const sourceTopic = ref(null);
const targetTopic = ref(null);

// 计算属性：过滤已选源话题的选项
const topicOptions = computed(() => {
  return topicList.value.filter(topic => topic.status === 'active');
});

// 计算属性：过滤已选源话题的选项
const filteredTopicOptions = computed(() => {
  return topicOptions.value.filter(topic => topic.id !== mergeForm.sourceId);
});

// 获取话题列表
const fetchTopics = async () => {
  loading.value = true;
  try {
    const res = await api.topics.getList({ limit: 1000 });
    if (res && Array.isArray(res.data)) {
      topicList.value = res.data;
    } else if (res && res.data && Array.isArray(res.data.topics)) {
      topicList.value = res.data.topics;
    } else if (res && res.data && res.data.data && Array.isArray(res.data.data)) {
      topicList.value = res.data.data;
    } else {
      topicList.value = [];
    }
  } catch (error) {
    console.error('获取话题列表失败:', error);
    ElMessage.error('获取话题列表失败');
  } finally {
    loading.value = false;
  }
};

// 处理源话题变更
const handleSourceChange = (value) => {
  sourceTopic.value = topicList.value.find(t => t.id === value) || null;
  
  // 如果目标话题与源话题相同，清空目标话题
  if (mergeForm.targetId === value) {
    mergeForm.targetId = null;
    targetTopic.value = null;
  }
};

// 处理目标话题变更
const handleTargetChange = (value) => {
  targetTopic.value = topicList.value.find(t => t.id === value) || null;
};

// 获取合并后的使用次数
const getMergedUsageCount = () => {
  if (!sourceTopic.value || !targetTopic.value) return 0;
  return (sourceTopic.value.usageCount || 0) + (targetTopic.value.usageCount || 0);
};

// 状态文本
const getStatusText = (status) => {
  const map = {
    'active': '正常',
    'hidden': '已隐藏',
    'deleted': '已删除'
  };
  return map[status] || status;
};

// 提交合并
const submitMerge = async () => {
  if (!mergeForm.sourceId || !mergeForm.targetId) {
    ElMessage.warning('请选择源话题和目标话题');
    return;
  }
  
  if (mergeForm.sourceId === mergeForm.targetId) {
    ElMessage.warning('源话题和目标话题不能相同');
    return;
  }
  
  try {
    await mergeFormRef.value.validate();
    
    // 确认提示
    await ElMessageBox.confirm(
      `确定要将话题 "${sourceTopic.value?.name}" 合并到话题 "${targetTopic.value?.name}" 吗？此操作不可逆！`,
      '确认合并',
      {
        confirmButtonText: '确认合并',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    merging.value = true;
    
    // 提交合并请求
    const res = await api.topics.merge({
      sourceId: mergeForm.sourceId,
      targetId: mergeForm.targetId
    });
    
    ElMessage.success('话题合并成功');
    resetForm();
    
    // 刷新话题列表
    await fetchTopics();
  } catch (error) {
    if (error === 'cancel') return;
    console.error('合并话题失败:', error);
    ElMessage.error(error.message || '合并话题失败');
  } finally {
    merging.value = false;
  }
};

// 重置表单
const resetForm = () => {
  mergeFormRef.value?.resetFields();
  mergeForm.sourceId = null;
  mergeForm.targetId = null;
  sourceTopic.value = null;
  targetTopic.value = null;
};

onMounted(() => {
  fetchTopics();
});
</script>

<style scoped>
.topic-merge-container {
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

.merge-form-container {
  margin-top: 20px;
}

.topic-preview {
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #409EFF;
}

.topic-preview h4 {
  margin-top: 0;
  margin-bottom: 10px;
}

.topic-preview p {
  margin: 5px 0;
}

.merge-arrow {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
}

.topic-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.topic-usage {
  color: #909399;
  font-size: 12px;
}

.merge-result {
  margin: 20px 0;
  padding: 15px;
  background-color: #f0f9eb;
  border-radius: 4px;
  border-left: 3px solid #67C23A;
}

.merge-result h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #67C23A;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 