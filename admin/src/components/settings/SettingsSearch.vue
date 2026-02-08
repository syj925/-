<template>
  <el-form :model="form" label-width="180px">
    <el-form-item label="热门搜索词">
      <el-alert
        title="热门搜索词设置"
        type="info"
        description="配置首页和搜索页展示的热门搜索词，每行一个关键词。不设置时系统会自动根据热度生成。"
        :closable="false"
        style="margin-bottom: 15px;"
      />
      <el-input
        v-model="form.hotSearchKeywords"
        type="textarea"
        :rows="5"
        placeholder="请输入热门搜索词，每行一个"
      />
    </el-form-item>
    
    <el-form-item label="热门话题权重设置">
      <el-alert
        title="热门话题权重设置"
        type="info"
        description="这些设置将影响系统如何计算话题的热度排名。热度计算公式：话题使用量×基础权重 + 最近新增×时效权重"
        :closable="false"
        style="margin-bottom: 15px;"
      />
      
      <el-form-item label="基础使用量权重">
        <el-input-number 
          v-model="form.topicBaseWeight" 
          :min="0" 
          :max="1" 
          :step="0.1" 
          :precision="1"
        />
        <span class="weight-hint">总使用量在热度计算中的权重(0-1)</span>
      </el-form-item>

      <el-form-item label="最近使用权重">
        <el-input-number 
          v-model="form.topicRecentWeight" 
          :min="0" 
          :max="1" 
          :step="0.1" 
          :precision="1"
        />
        <span class="weight-hint">最近使用量在热度计算中的权重(0-1)</span>
      </el-form-item>

      <el-form-item label="近期统计天数">
        <el-input-number 
          v-model="form.topicRecentDays" 
          :min="1" 
          :max="30" 
          :step="1" 
        />
        <span class="weight-hint">计算"近期使用"的天数范围</span>
      </el-form-item>
    </el-form-item>
    
    <el-form-item label="推荐话题管理">
      <div class="featured-topics-section">
        <!-- 头部信息 -->
        <div class="section-header">
          <div class="header-info">
            <h4 class="section-title">
              <el-icon><Star /></el-icon>
              推荐话题设置
            </h4>
            <p class="section-desc">选择在搜索页面优先展示的热门话题，提升用户发现内容的效率</p>
          </div>
          <div class="header-stats">
            <el-tag type="primary" size="large">
              已选择 {{ selectedTopicIds.length }} 个话题
            </el-tag>
          </div>
        </div>

        <!-- 快速操作栏 -->
        <div class="quick-actions">
          <el-button-group>
            <el-button
              size="small"
              @click="selectHotTopics"
              :disabled="!availableTopics.length"
            >
              <el-icon><TrendCharts /></el-icon>
              选择热门话题
            </el-button>
            <el-button
              size="small"
              @click="clearAllTopics"
              :disabled="!selectedTopicIds.length"
            >
              <el-icon><Delete /></el-icon>
              清空选择
            </el-button>
          </el-button-group>

          <div class="topic-summary">
            <span class="summary-text">
              共 {{ availableTopics.length }} 个话题可选
            </span>
          </div>
        </div>

        <!-- Transfer组件 -->
        <div class="transfer-container">
          <el-transfer
            v-model="selectedTopicIds"
            :data="availableTopics"
            :titles="['📋 可选话题', '⭐ 推荐话题']"
            :button-texts="['移除', '添加']"
            :format="{
              noChecked: '共 ${total} 个',
              hasChecked: '已选 ${checked}/${total}'
            }"
            filterable
            filter-placeholder="🔍 搜索话题名称..."
            class="topic-transfer"
          >
            <template #default="{ option }">
              <div class="topic-card">
                <div class="topic-header">
                  <span class="topic-name">{{ option.label }}</span>
                  <el-tag
                    v-if="option.is_hot"
                    type="danger"
                    size="small"
                    effect="plain"
                  >
                    🔥 热门
                  </el-tag>
                </div>
                <div class="topic-metrics">
                  <span class="metric">
                    <el-icon><Document /></el-icon>
                    {{ option.post_count || 0 }} 内容
                  </span>
                  <span class="metric">
                    <el-icon><View /></el-icon>
                    {{ option.view_count || 0 }} 浏览
                  </span>
                </div>
              </div>
            </template>
          </el-transfer>
        </div>

        <!-- 底部提示 -->
        <div class="section-footer">
          <el-alert
            type="info"
            :closable="false"
            show-icon
          >
            <template #title>
              <span>💡 使用提示</span>
            </template>
            <div class="tips-content">
              <p>• 推荐话题将在搜索页面的"热门话题"区域优先显示</p>
              <p>• 建议选择 3-8 个活跃度较高的话题以获得最佳效果</p>
              <p>• 可以随时调整推荐话题列表，更改会立即生效</p>
            </div>
          </el-alert>
        </div>
      </div>
    </el-form-item>
    
    <el-form-item label="热榜最大数量">
      <el-input-number
        v-model="form.maxHotTopics"
        :min="3"
        :max="20"
        :step="1"
      />
      <span class="weight-hint">话题热榜显示的最大数量</span>
    </el-form-item>

    <el-divider content-position="left">
      <el-icon><TrendCharts /></el-icon>
      热门搜索设置
    </el-divider>

    <el-form-item label="热门搜索显示数量">
      <el-input-number
        v-model="form.hotSearchCount"
        :min="3"
        :max="15"
        :step="1"
      />
      <span class="weight-hint">搜索发现页面显示的热门搜索标签数量</span>
    </el-form-item>

    <el-form-item label="启用热门搜索">
      <el-switch
        v-model="form.enableHotSearch"
        active-text="启用"
        inactive-text="禁用"
      />
      <span class="weight-hint">是否在搜索发现页面显示热门搜索区域</span>
    </el-form-item>

    <el-form-item label="热门搜索数据源">
      <el-radio-group v-model="form.hotSearchSource">
        <el-radio value="manual">手动配置</el-radio>
        <el-radio value="auto">自动统计</el-radio>
        <el-radio value="mixed">混合模式</el-radio>
      </el-radio-group>
      <div class="weight-hint">
        <p>• 手动配置：仅使用上方配置的热门搜索词</p>
        <p>• 自动统计：根据用户搜索频率自动生成</p>
        <p>• 混合模式：优先显示手动配置，不足时用自动统计补充</p>
      </div>
    </el-form-item>

    <el-divider content-position="left">
      <el-icon><Star /></el-icon>
      推荐内容设置
    </el-divider>

    <el-form-item label="推荐内容显示数量">
      <el-input-number
        v-model="form.recommendContentCount"
        :min="3"
        :max="20"
        :step="1"
      />
      <span class="weight-hint">搜索发现页面"推荐内容"区域显示的内容数量</span>
    </el-form-item>

    <el-form-item label="启用推荐内容">
      <el-switch
        v-model="form.enableRecommendContent"
        active-text="启用"
        inactive-text="禁用"
      />
      <span class="weight-hint">是否在搜索发现页面显示推荐内容区域</span>
    </el-form-item>

    <el-form-item label="推荐内容类型">
      <el-checkbox-group v-model="form.recommendContentTypes">
        <el-checkbox label="post">帖子</el-checkbox>
        <el-checkbox label="topic">话题</el-checkbox>
        <el-checkbox label="user">用户</el-checkbox>
      </el-checkbox-group>
      <span class="weight-hint">推荐内容可以包含的类型</span>
    </el-form-item>

    <el-form-item label="推荐算法策略">
      <el-radio-group v-model="form.recommendStrategy">
        <el-radio value="hot">热门优先</el-radio>
        <el-radio value="latest">最新优先</el-radio>
        <el-radio value="mixed">智能推荐</el-radio>
      </el-radio-group>
      <div class="weight-hint">
        <p>• 热门优先：按点赞、评论等互动数据排序</p>
        <p>• 最新优先：按发布时间排序</p>
        <p>• 智能推荐：使用推荐算法综合计算</p>
      </div>
    </el-form-item>

    <el-form-item>
      <el-button type="warning" @click="$emit('init')" :loading="initLoading">初始化搜索设置</el-button>
      <span class="weight-hint">如果新安装或搜索设置出现问题，请点击此按钮初始化默认设置</span>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Star, TrendCharts, Delete, Document, View } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  availableTopics: {
    type: Array,
    default: () => []
  },
  initLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'init']);

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// 计算属性
const selectedTopicIds = computed({
  get() {
    if (!form.value.featuredTopicIds) return []
    return form.value.featuredTopicIds
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id))
  },
  set(value) {
    form.value.featuredTopicIds = value.join(',')
  }
});

// 选择热门话题
const selectHotTopics = () => {
  const hotTopics = props.availableTopics
    .filter(topic => topic.is_hot || topic.post_count > 5)
    .slice(0, 6) // 最多选择6个热门话题
    .map(topic => topic.key);

  selectedTopicIds.value = [...new Set([...selectedTopicIds.value, ...hotTopics])];
  ElMessage.success(`已添加 ${hotTopics.length} 个热门话题到推荐列表`);
};

// 清空所有选择
const clearAllTopics = () => {
  ElMessageBox.confirm(
    '确定要清空所有已选择的推荐话题吗？',
    '确认操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    selectedTopicIds.value = [];
    ElMessage.success('已清空推荐话题列表');
  }).catch(() => {
    // 用户取消操作
  });
};
</script>

<style scoped>
.weight-hint {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.featured-topics-section {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 20px;
  background-color: #fcfcfc;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-info .section-title {
  margin: 0 0 5px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #303133;
}

.section-desc {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.quick-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.topic-summary {
  color: #606266;
  font-size: 13px;
}

.transfer-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.topic-transfer {
  --el-transfer-panel-width: 300px;
  --el-transfer-panel-header-height: 45px;
}

.topic-card {
  padding: 5px 0;
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.topic-name {
  font-weight: 500;
  color: #303133;
}

.topic-metrics {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #909399;
}

.metric {
  display: flex;
  align-items: center;
  gap: 3px;
}

.tips-content {
  margin-top: 5px;
  line-height: 1.6;
  font-size: 13px;
}

.tips-content p {
  margin: 0;
}
</style>
