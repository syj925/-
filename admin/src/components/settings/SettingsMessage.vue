<template>
  <el-form :model="form" label-width="180px">
    <el-alert
      title="私信功能全局控制"
      type="warning"
      description="控制整个应用的私信功能是否开启。关闭后，所有用户都无法发送和接收私信。"
      :closable="false"
      style="margin-bottom: 20px;"
    />
    <el-form-item label="全局私信功能">
      <el-switch
        v-model="form.enablePrivateMessage"
        active-text="开启"
        inactive-text="关闭"
        active-color="#13ce66"
        inactive-color="#ff4949"
      />
      <span class="weight-hint">关闭后，所有用户的私信功能将被禁用</span>
    </el-form-item>
    
    <el-divider />
    
    <el-alert
      title="消息阅读延迟设置"
      type="info"
      description="设置用户在消息详情页面停留多少秒后系统自动将消息标记为已读"
      :closable="false"
      style="margin-bottom: 20px;"
    />
    <el-form-item label="消息已读延迟时间(秒)">
      <el-input-number 
        v-model="form.readDelaySeconds" 
        :min="0" 
        :max="60" 
        :step="1"
      />
      <span class="weight-hint">设置为0表示打开消息详情页立即标记为已读，建议设置3-10秒</span>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});
</script>

<style scoped>
.weight-hint {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}
</style>
