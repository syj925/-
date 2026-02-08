<template>
  <el-form :model="form" label-width="180px">
    <el-form-item label="是否开启用户注册">
      <el-switch v-model="form.enableRegister" />
      <div class="form-item-tip">
        <span v-if="form.enableRegister" style="color: #67c23a;">✓ 允许新用户注册</span>
        <span v-else style="color: #f56c6c;">✗ 禁止新用户注册</span>
      </div>
    </el-form-item>

    <el-form-item
      label="新用户是否需要审核"
      :class="{ 'is-disabled': !form.enableRegister }"
    >
      <el-switch
        v-model="form.requireUserAudit"
        :disabled="!form.enableRegister"
      />
      <div class="form-item-tip">
        <span v-if="!form.enableRegister" style="color: #909399;">
          注册已关闭，此设置无效
        </span>
        <span v-else-if="form.requireUserAudit" style="color: #e6a23c;">
          新用户注册后需要管理员审核才能使用
        </span>
        <span v-else style="color: #67c23a;">
          新用户注册后直接激活，无需审核
        </span>
      </div>
    </el-form-item>

    <el-form-item label="默认用户角色">
      <el-select v-model="form.defaultRole">
        <el-option label="普通用户" value="user" />
        <el-option label="VIP用户" value="vip" />
        <el-option label="管理员" value="admin" />
      </el-select>
    </el-form-item>
    <el-form-item label="用户头像上传大小限制">
      <el-input-number v-model="form.avatarSizeLimit" :min="1" :max="10" />
      <span class="unit">MB</span>
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
.form-item-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.unit {
  margin-left: 10px;
}
.el-form-item.is-disabled {
  opacity: 0.6;
}
</style>
