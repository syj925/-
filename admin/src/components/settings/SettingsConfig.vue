<template>
  <div class="config-management">
    <!-- 当前版本信息 -->
    <el-card class="version-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>当前配置版本</span>
          <el-button
            type="primary"
            size="small"
            :loading="publishingConfig"
            @click="publishNewVersion"
          >
            发布新版本
          </el-button>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="版本号">
          {{ configVersion.version }}
        </el-descriptions-item>
        <el-descriptions-item label="发布时间">
          {{ formatTime(configVersion.updateTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新说明" :span="2">
          {{ configVersion.description || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="强制更新">
          <el-tag :type="configVersion.forceUpdate ? 'danger' : 'success'">
            {{ configVersion.forceUpdate ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="下载次数">
          {{ configVersion.downloadCount || 0 }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 发布新版本对话框 -->
    <el-dialog
      v-model="showPublishDialog"
      title="发布新配置版本"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="newVersionForm" label-width="100px" ref="versionFormRef">
        <el-form-item label="版本号" required>
          <el-input
            v-model="newVersionForm.version"
            placeholder="例如: 1.2.0"
          />
          <div class="form-item-tip">建议使用语义化版本号</div>
        </el-form-item>

        <el-form-item label="更新说明" required>
          <el-input
            v-model="newVersionForm.description"
            type="textarea"
            :rows="3"
            placeholder="描述本次更新的内容..."
          />
        </el-form-item>

        <el-form-item label="强制更新">
          <el-switch v-model="newVersionForm.forceUpdate" />
          <div class="form-item-tip">开启后，所有客户端将强制更新到此版本</div>
        </el-form-item>

        <el-form-item label="配置预览">
          <el-card class="config-preview-card" shadow="never">
            <div class="config-item">
              <span class="config-label">最小帖子长度：</span>
              <span class="config-value">{{ contentSettings.minPostLength }}字符</span>
            </div>
            <div class="config-item">
              <span class="config-label">最大帖子长度：</span>
              <span class="config-value">{{ contentSettings.maxPostLength }}字符</span>
            </div>
            <div class="config-item">
              <span class="config-label">敏感词过滤：</span>
              <span class="config-value">{{ contentSettings.enableSensitiveFilter ? '开启' : '关闭' }}</span>
            </div>
            <div class="config-item">
              <span class="config-label">每日发帖限制：</span>
              <span class="config-value">{{ contentSettings.dailyPostLimit }}条</span>
            </div>
            <div class="config-item">
              <span class="config-label">敏感词数量：</span>
              <span class="config-value">{{ getSensitiveWordsCount() }}个</span>
            </div>
          </el-card>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showPublishDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="publishingConfig"
          @click="confirmPublishVersion"
        >
          确认发布
        </el-button>
      </template>
    </el-dialog>

    <!-- 版本历史 -->
    <el-card class="history-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>版本历史</span>
          <el-button
            size="small"
            @click="loadVersionHistory"
            :loading="loadingHistory"
          >
            刷新
          </el-button>
        </div>
      </template>

      <el-table
        :data="versionHistory"
        v-loading="loadingHistory"
        empty-text="暂无版本历史"
      >
        <el-table-column prop="version" label="版本号" width="120" />
        <el-table-column prop="description" label="更新说明" />
        <el-table-column prop="updateTime" label="发布时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="forceUpdate" label="强制更新" width="100">
          <template #default="{ row }">
            <el-tag :type="row.forceUpdate ? 'danger' : 'success'" size="small">
              {{ row.forceUpdate ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="downloadCount" label="下载次数" width="100" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              link
              @click="rollbackToVersion(row)"
              :disabled="row.version === configVersion.version"
            >
              回滚
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/utils/api';

const props = defineProps({
  contentSettings: {
    type: Object,
    required: true
  }
});

const publishingConfig = ref(false);
const loadingHistory = ref(false);
const showPublishDialog = ref(false);
const versionFormRef = ref(null);

const configVersion = ref({
  version: '1.0.0',
  updateTime: new Date().toISOString(),
  description: '初始版本',
  forceUpdate: false,
  downloadCount: 0
});

const newVersionForm = ref({
  version: '',
  description: '',
  forceUpdate: false
});

const versionHistory = ref([]);

const loadConfigVersion = async () => {
  try {
    const res = await api.config.getCurrentVersion();
    if (res.success && res.data) {
      configVersion.value = res.data;
    } else {
      console.warn('获取配置版本信息失败:', res.message);
    }
  } catch (error) {
    console.error('加载配置版本信息失败:', error);
  }
};

const loadVersionHistory = async () => {
  loadingHistory.value = true;
  try {
    const res = await api.config.getVersionHistory();
    if (res.success && res.data) {
      versionHistory.value = res.data;
    } else {
      console.warn('获取版本历史失败:', res.message);
      versionHistory.value = [];
    }
  } catch (error) {
    console.error('加载版本历史失败:', error);
    versionHistory.value = [];
  } finally {
    loadingHistory.value = false;
  }
};

const publishNewVersion = () => {
  const currentVersion = configVersion.value.version;
  const versionParts = currentVersion.split('.').map(Number);
  if (versionParts.length === 3) {
    versionParts[2] += 1;
  }
  
  newVersionForm.value = {
    version: versionParts.join('.'),
    description: '',
    forceUpdate: false
  };

  showPublishDialog.value = true;
};

const getSensitiveWordsCount = () => {
  if (!props.contentSettings.sensitiveWords) return 0;
  return props.contentSettings.sensitiveWords.split(',').filter(w => w.trim()).length;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '未知';
  const date = new Date(timeStr);
  return date.toLocaleString();
};

const confirmPublishVersion = async () => {
  if (!newVersionForm.value.version || !newVersionForm.value.description) {
    ElMessage.warning('请填写版本号和更新说明');
    return;
  }

  publishingConfig.value = true;

  try {
    const configData = {
      version: newVersionForm.value.version,
      description: newVersionForm.value.description,
      forceUpdate: newVersionForm.value.forceUpdate,
      config: {
        minPostLength: props.contentSettings.minPostLength,
        maxPostLength: props.contentSettings.maxPostLength,
        enableSensitiveFilter: props.contentSettings.enableSensitiveFilter,
        sensitiveWords: typeof props.contentSettings.sensitiveWords === 'string'
          ? props.contentSettings.sensitiveWords.split(',').map(w => w.trim()).filter(w => w)
          : props.contentSettings.sensitiveWords || [],
        sensitiveWordAction: props.contentSettings.sensitiveWordAction,
        dailyPostLimit: props.contentSettings.dailyPostLimit,
        dailyCommentLimit: props.contentSettings.dailyCommentLimit,
        allowAnonymous: props.contentSettings.allowAnonymous,
        maxImagesPerPost: props.contentSettings.maxImagesPerPost,
        maxImageSize: props.contentSettings.maxImageSize,
        allowedImageTypes: Array.isArray(props.contentSettings.allowedImageTypes)
          ? props.contentSettings.allowedImageTypes
          : (typeof props.contentSettings.allowedImageTypes === 'string'
             ? props.contentSettings.allowedImageTypes.split(',').map(t => t.trim()).filter(t => t)
             : ['jpg', 'jpeg', 'png', 'gif', 'webp']),
        maxReplyLevel: props.contentSettings.maxReplyLevel,
        configUpdateInterval: props.contentSettings.configUpdateInterval
      }
    };

    const res = await api.config.publishVersion(configData);

    if (res.success) {
      ElMessage.success('配置版本发布成功');
      showPublishDialog.value = false;
      await loadConfigVersion();
      await loadVersionHistory();
    } else {
      ElMessage.error(res.message || '发布配置版本失败');
    }
  } catch (error) {
    console.error('发布配置版本失败:', error);
    ElMessage.error('发布配置版本失败');
  } finally {
    publishingConfig.value = false;
  }
};

const rollbackToVersion = async (version) => {
  try {
    await ElMessageBox.confirm(
      `确定要回滚到版本 ${version.version} 吗？这将会影响所有客户端的配置。`,
      '确认回滚',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    const res = await api.config.rollbackToVersion({
      targetVersion: version.version
    });

    if (res.success) {
      ElMessage.success('配置已回滚');
      await loadConfigVersion();
      await loadVersionHistory();
    } else {
      ElMessage.error(res.message || '回滚失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('回滚配置失败:', error);
      ElMessage.error('回滚配置失败');
    }
  }
};

onMounted(() => {
  loadConfigVersion();
  loadVersionHistory();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-management .version-card, 
.config-management .history-card {
  margin-bottom: 20px;
}

.config-preview-card {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.config-preview-card .config-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.config-preview-card .config-item:last-child {
  margin-bottom: 0;
}

.config-preview-card .config-item .config-label {
  color: #666;
  font-size: 14px;
}

.config-preview-card .config-item .config-value {
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-item-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
