<template>
  <el-form :model="form" label-width="180px">
    <!-- 审核设置 -->
    <el-divider content-position="left">审核设置</el-divider>

    <!-- 审核流程说明 -->
    <el-alert
      title="审核流程说明"
      type="info"
      :closable="false"
      style="margin-bottom: 20px;"
    >
      <template #default>
        <div style="font-size: 13px; line-height: 1.6;">
          <p><strong>审核优先级：</strong></p>
          <p>1. <span style="color: #f56c6c;">强制人工审核</span> → 所有内容进入待审核队列</p>
          <p>2. <span style="color: #e6a23c;">敏感关键词</span> → 匹配内容进入待审核队列</p>
          <p>3. <span style="color: #67c23a;">自动通过关键词</span> → 匹配内容直接发布</p>
          <p>4. <span style="color: #409eff;">智能审核模式</span> → 未匹配关键词的内容处理方式</p>
        </div>
      </template>
    </el-alert>
    <el-form-item label="强制人工审核">
      <el-switch v-model="form.forceManualAudit" />
      <div class="form-item-tip">
        <span v-if="form.forceManualAudit" style="color: #f56c6c;">⚠️ 所有帖子和评论都必须经过人工审核才能显示（忽略所有自动审核关键词设置）</span>
        <span v-else style="color: #67c23a;">✓ 根据下方关键词设置进行智能审核处理</span>
      </div>
    </el-form-item>

    <template v-if="!form.forceManualAudit">
      <el-form-item label="敏感关键词处理">
        <el-input
          v-model="form.autoRejectKeywords"
          type="textarea"
          :rows="2"
          placeholder="包含这些关键词的内容将进入人工审核队列，以逗号分隔"
        />
        <div class="form-item-tip">
          <span style="color: #e6a23c;">⚠️ 匹配这些关键词的内容将进入待审核队列，由管理员人工判断是否通过</span>
        </div>
      </el-form-item>

      <el-form-item label="自动通过关键词">
        <el-input
          v-model="form.autoApproveKeywords"
          type="textarea"
          :rows="2"
          placeholder="包含这些关键词的内容将自动通过审核，以逗号分隔"
        />
        <div class="form-item-tip">
          <span style="color: #67c23a;">✓ 匹配这些关键词的内容将直接发布（优先级高于敏感关键词）</span>
        </div>
      </el-form-item>

      <el-form-item label="智能审核模式">
        <el-switch v-model="form.enableSmartAudit" />
        <div class="form-item-tip">
          <span v-if="form.enableSmartAudit" style="color: #e6a23c;">开启后，未匹配任何关键词的内容将进入人工审核队列</span>
          <span v-else style="color: #67c23a;">关闭后，未匹配任何关键词的内容将直接发布</span>
        </div>
      </el-form-item>
    </template>

    <!-- 发布限制 -->
    <el-divider content-position="left">发布限制</el-divider>
    <el-form-item label="是否允许匿名发帖">
      <el-switch v-model="form.allowAnonymous" />
      <div class="form-item-tip">允许用户匿名发布帖子和评论</div>
    </el-form-item>
    <el-form-item label="每日发帖限制">
      <el-input-number v-model="form.dailyPostLimit" :min="1" :max="100" />
      <div class="form-item-tip">每个用户每天最多可发布的帖子数量</div>
    </el-form-item>
    <el-form-item label="每日评论限制">
      <el-input-number v-model="form.dailyCommentLimit" :min="1" :max="500" />
      <div class="form-item-tip">每个用户每天最多可发布的评论数量</div>
    </el-form-item>
    <el-form-item label="帖子最小字数">
      <el-input-number v-model="form.minPostLength" :min="1" :max="50" />
      <div class="form-item-tip">发布帖子的最少字符数要求</div>
    </el-form-item>
    <el-form-item label="帖子最大字数">
      <el-input-number v-model="form.maxPostLength" :min="100" :max="5000" />
      <div class="form-item-tip">发布帖子的最多字符数限制</div>
    </el-form-item>

    <!-- 敏感词过滤 -->
    <el-divider content-position="left">敏感词过滤</el-divider>
    <el-form-item label="内容敏感词过滤">
      <el-switch v-model="form.enableSensitiveFilter" />
      <div class="form-item-tip">自动检测并过滤敏感词汇</div>
    </el-form-item>
    <el-form-item label="敏感词处理方式" v-if="form.enableSensitiveFilter">
      <el-radio-group v-model="form.sensitiveWordAction">
        <el-radio value="replace">替换为***</el-radio>
        <el-radio value="reject">直接拒绝发布</el-radio>
        <el-radio value="audit">提交审核</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="敏感词列表" v-if="form.enableSensitiveFilter">
      <el-input
        v-model="form.sensitiveWords"
        type="textarea"
        :rows="4"
        placeholder="请输入敏感词，以逗号分隔"
      />
    </el-form-item>

    <!-- 图片设置 -->
    <el-divider content-position="left">图片设置</el-divider>
    <el-form-item label="允许上传图片">
      <el-switch v-model="form.allowImageUpload" />
    </el-form-item>
    <el-form-item label="单张图片大小限制(MB)" v-if="form.allowImageUpload">
      <el-input-number v-model="form.maxImageSize" :min="1" :max="20" />
    </el-form-item>
    <el-form-item label="每个帖子最多图片数" v-if="form.allowImageUpload">
      <el-input-number v-model="form.maxImagesPerPost" :min="1" :max="9" />
    </el-form-item>
    <el-form-item label="允许的图片格式" v-if="form.allowImageUpload">
      <el-checkbox-group v-model="form.allowedImageTypes">
        <el-checkbox label="jpg">JPG</el-checkbox>
        <el-checkbox label="jpeg">JPEG</el-checkbox>
        <el-checkbox label="png">PNG</el-checkbox>
        <el-checkbox label="gif">GIF</el-checkbox>
        <el-checkbox label="webp">WebP</el-checkbox>
      </el-checkbox-group>
    </el-form-item>

    <!-- 互动设置 -->
    <el-divider content-position="left">互动设置</el-divider>
    <el-form-item label="评论最大层级">
      <el-input-number v-model="form.maxReplyLevel" :min="1" :max="10" />
      <div class="form-item-tip">评论回复的最大嵌套层级</div>
    </el-form-item>

    <!-- 配置更新设置 -->
    <el-divider content-position="left">配置更新设置</el-divider>
    <el-form-item label="更新检查间隔">
      <el-input-number
        v-model="form.configUpdateInterval"
        :min="1"
        :max="60"
        :step="1"
        style="width: 200px"
      />
      <span style="margin-left: 8px;">分钟</span>
      <div class="form-item-tip">前端App检查配置更新的时间间隔，建议1-60分钟之间</div>
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
  line-height: 1.5;
  margin-top: 5px;
}
</style>
