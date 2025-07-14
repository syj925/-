<template>
  <div class="settings-container">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <h3>系统设置</h3>
          <div class="settings-status">
            <el-tag v-if="settingsStatus === 'success'" type="success">配置已保存</el-tag>
            <el-tag v-if="settingsStatus === 'error'" type="danger">保存失败</el-tag>
          </div>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础设置" name="basic">
          <el-form :model="basicSettings" label-width="120px">
            <el-form-item label="系统名称">
              <el-input v-model="basicSettings.systemName" />
            </el-form-item>
            <el-form-item label="系统LOGO">
              <el-upload
                class="avatar-uploader"
                action="#"
                :show-file-list="false"
                :before-upload="beforeLogoUpload"
              >
                <img v-if="basicSettings.logoUrl" :src="basicSettings.logoUrl" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item label="页脚文本">
              <el-input v-model="basicSettings.footerText" />
            </el-form-item>
            <el-form-item label="备案号">
              <el-input v-model="basicSettings.icp" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="内容设置" name="content">
          <el-form :model="contentSettings" label-width="180px">
            <el-form-item label="是否开启内容审核">
              <el-switch v-model="contentSettings.enableAudit" />
            </el-form-item>
            <el-form-item label="是否允许匿名发帖">
              <el-switch v-model="contentSettings.allowAnonymous" />
            </el-form-item>
            <el-form-item label="每日发帖限制">
              <el-input-number v-model="contentSettings.dailyPostLimit" :min="1" :max="100" />
            </el-form-item>
            <el-form-item label="内容敏感词过滤">
              <el-switch v-model="contentSettings.enableSensitiveFilter" />
            </el-form-item>
            <el-form-item label="敏感词列表" v-if="contentSettings.enableSensitiveFilter">
              <el-input
                v-model="contentSettings.sensitiveWords"
                type="textarea"
                :rows="4"
                placeholder="请输入敏感词，以逗号分隔"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="消息设置" name="message">
          <el-form :model="messageSettings" label-width="180px">
            <el-alert
              title="消息阅读延迟设置"
              type="info"
              description="设置用户在消息详情页面停留多少秒后系统自动将消息标记为已读"
              :closable="false"
              style="margin-bottom: 20px;"
            />
            <el-form-item label="消息已读延迟时间(秒)">
              <el-input-number 
                v-model="messageSettings.readDelaySeconds" 
                :min="0" 
                :max="60" 
                :step="1"
              />
              <span class="weight-hint">设置为0表示打开消息详情页立即标记为已读，建议设置3-10秒</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="搜索设置" name="search">
          <el-form :model="searchSettings" label-width="180px">
            <el-form-item label="热门搜索词">
              <el-alert
                title="热门搜索词设置"
                type="info"
                description="配置首页和搜索页展示的热门搜索词，每行一个关键词。不设置时系统会自动根据热度生成。"
                :closable="false"
                style="margin-bottom: 15px;"
              />
              <el-input
                v-model="searchSettings.hotSearchKeywords"
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
                  v-model="searchSettings.topicBaseWeight" 
                  :min="0" 
                  :max="1" 
                  :step="0.1" 
                  :precision="1"
                />
                <span class="weight-hint">总使用量在热度计算中的权重(0-1)</span>
              </el-form-item>

              <el-form-item label="最近使用权重">
                <el-input-number 
                  v-model="searchSettings.topicRecentWeight" 
                  :min="0" 
                  :max="1" 
                  :step="0.1" 
                  :precision="1"
                />
                <span class="weight-hint">最近使用量在热度计算中的权重(0-1)</span>
              </el-form-item>

              <el-form-item label="近期统计天数">
                <el-input-number 
                  v-model="searchSettings.topicRecentDays" 
                  :min="1" 
                  :max="30" 
                  :step="1" 
                />
                <span class="weight-hint">计算"近期使用"的天数范围</span>
              </el-form-item>
            </el-form-item>
            
            <el-form-item label="推荐话题设置">
              <el-alert
                title="推荐话题设置"
                type="info"
                description="选择的话题将优先显示在话题热榜的顶部，无论其实际热度如何。"
                :closable="false"
                style="margin-bottom: 15px;"
              />
              <el-transfer
                v-model="searchSettings.featuredTopicIds"
                :data="availableTopics"
                :titles="['可选话题', '推荐话题']"
                :button-texts="['取消推荐', '设为推荐']"
                :props="{
                  key: 'key',
                  label: 'label'
                }"
                filterable
              />
              <div class="featured-topics-hint">
                <span class="weight-hint">设置为推荐话题后，将在热门话题榜单中优先展示</span>
              </div>
            </el-form-item>
            
            <el-form-item label="热榜最大数量">
              <el-input-number 
                v-model="searchSettings.maxHotTopics" 
                :min="3" 
                :max="20" 
                :step="1" 
              />
              <span class="weight-hint">话题热榜显示的最大数量</span>
            </el-form-item>
            
            <el-form-item>
              <el-button type="warning" @click="initSearchSettings" :loading="searchInitLoading">初始化搜索设置</el-button>
              <span class="weight-hint">如果新安装或搜索设置出现问题，请点击此按钮初始化默认设置</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="推荐算法" name="recommendation">
          <el-form :model="recommendSettings" label-width="180px">
            <el-alert
              title="推荐算法权重设置"
              type="info"
              description="这些设置将影响系统如何计算内容的推荐排名。得分计算公式：点赞×点赞权重 + 评论×评论权重 + 收藏×收藏权重 + 浏览量×浏览权重，最后结合时间因素。"
              :closable="false"
              style="margin-bottom: 20px;"
            />

            <el-form-item label="点赞权重">
              <el-input-number 
                v-model="recommendSettings.likeWeight" 
                :min="0" 
                :max="10" 
                :step="0.1" 
                :precision="1"
              />
              <span class="weight-hint">较高的权重将使点赞数对推荐结果影响更大</span>
            </el-form-item>

            <el-form-item label="评论权重">
              <el-input-number 
                v-model="recommendSettings.commentWeight" 
                :min="0" 
                :max="10" 
                :step="0.1" 
                :precision="1"
              />
              <span class="weight-hint">较高的权重将使评论数对推荐结果影响更大</span>
            </el-form-item>

            <el-form-item label="收藏权重">
              <el-input-number 
                v-model="recommendSettings.collectionWeight" 
                :min="0" 
                :max="10" 
                :step="0.1" 
                :precision="1"
              />
              <span class="weight-hint">较高的权重将使收藏数对推荐结果影响更大</span>
            </el-form-item>

            <el-form-item label="浏览量权重">
              <el-input-number 
                v-model="recommendSettings.viewWeight" 
                :min="0" 
                :max="10" 
                :step="0.1" 
                :precision="1"
              />
              <span class="weight-hint">较高的权重将使浏览量对推荐结果影响更大</span>
            </el-form-item>

            <el-form-item label="时间衰减系数(天)">
              <el-input-number 
                v-model="recommendSettings.timeDecayDays" 
                :min="1" 
                :max="30"
                :step="1"
              />
              <span class="weight-hint">内容热度的半衰期，数值越小衰减越快，新内容更容易被推荐</span>
            </el-form-item>

            <el-form-item label="内容最大持续天数">
              <el-input-number 
                v-model="recommendSettings.maxAgeDays" 
                :min="7" 
                :max="90"
                :step="1"
              />
              <span class="weight-hint">超过此天数的内容将不会出现在推荐中</span>
            </el-form-item>

            <el-form-item label="管理员推荐最大数量">
              <el-input-number 
                v-model="recommendSettings.maxAdminRecommended" 
                :min="1" 
                :max="20"
                :step="1"
              />
              <span class="weight-hint">首页最多显示的管理员手动推荐内容数量</span>
            </el-form-item>
            
            <el-form-item>
              <el-button type="warning" @click="initRecommendSettings" :loading="initLoading">初始化推荐设置</el-button>
              <span class="weight-hint">如果新安装或推荐设置出现问题，请点击此按钮初始化默认设置</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="用户设置" name="user">
          <el-form :model="userSettings" label-width="180px">
            <el-form-item label="是否开启用户注册">
              <el-switch v-model="userSettings.enableRegister" />
              <div class="form-item-tip">
                <span v-if="userSettings.enableRegister" style="color: #67c23a;">✓ 允许新用户注册</span>
                <span v-else style="color: #f56c6c;">✗ 禁止新用户注册</span>
              </div>
            </el-form-item>

            <el-form-item
              label="新用户是否需要审核"
              :class="{ 'is-disabled': !userSettings.enableRegister }"
            >
              <el-switch
                v-model="userSettings.requireUserAudit"
                :disabled="!userSettings.enableRegister"
              />
              <div class="form-item-tip">
                <span v-if="!userSettings.enableRegister" style="color: #909399;">
                  注册已关闭，此设置无效
                </span>
                <span v-else-if="userSettings.requireUserAudit" style="color: #e6a23c;">
                  新用户注册后需要管理员审核才能使用
                </span>
                <span v-else style="color: #67c23a;">
                  新用户注册后直接激活，无需审核
                </span>
              </div>
            </el-form-item>

            <el-form-item label="默认用户角色">
              <el-select v-model="userSettings.defaultRole">
                <el-option label="普通用户" value="user" />
                <el-option label="VIP用户" value="vip" />
                <el-option label="管理员" value="admin" />
              </el-select>
            </el-form-item>
            <el-form-item label="用户头像上传大小限制">
              <el-input-number v-model="userSettings.avatarSizeLimit" :min="1" :max="10" />
              <span class="unit">MB</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      
      <div class="form-actions">
        <el-button type="primary" @click="saveSettings" :loading="saving">保存设置</el-button>
        <el-button @click="resetSettings" :disabled="saving">重置</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import api from '@/utils/api';

const activeTab = ref('basic');
const loading = ref(false);
const saving = ref(false);
const initLoading = ref(false);
const searchInitLoading = ref(false);
const availableTopics = ref([]);
const settingsStatus = ref('');

// 基础设置
const basicSettings = ref({
  systemName: '校园墙管理系统',
  logoUrl: 'https://img01.yzcdn.cn/vant/cat.jpeg',
  footerText: '© 2023 校园墙管理系统',
  icp: '京ICP备12345678号'
});

// 内容设置
const contentSettings = ref({
  enableAudit: true,
  allowAnonymous: false,
  dailyPostLimit: 10,
  enableSensitiveFilter: true,
  sensitiveWords: '赌博,色情,政治,暴力,诈骗'
});

// 搜索设置
const searchSettings = ref({
  hotSearchKeywords: '',
  topicBaseWeight: 0.5,
  topicRecentWeight: 0.5,
  topicRecentDays: 7,
  featuredTopicIds: [],
  maxHotTopics: 10
});

// 推荐算法设置
const recommendSettings = ref({
  likeWeight: 2.0,
  commentWeight: 3.0,
  collectionWeight: 4.0,
  viewWeight: 0.5,
  timeDecayDays: 10,
  maxAgeDays: 30,
  maxAdminRecommended: 5
});

// 用户设置
const userSettings = ref({
  enableRegister: true,
  requireUserAudit: true,
  defaultRole: 'user',
  avatarSizeLimit: 2
});

// 消息设置
const messageSettings = ref({
  readDelaySeconds: 5
});

// 初始化 - 从服务器获取设置
onMounted(async () => {
  await fetchSettings();
  await fetchTopics();
});

// 获取服务器设置
const fetchSettings = async () => {
  loading.value = true;
  settingsStatus.value = '';
  try {
    const res = await api.settings.get();
    if (res.success) {
      // 解析基础设置
      if (res.data.systemName) basicSettings.value.systemName = res.data.systemName;
      if (res.data.logoUrl) basicSettings.value.logoUrl = res.data.logoUrl;
      if (res.data.footerText) basicSettings.value.footerText = res.data.footerText;
      if (res.data.icp) basicSettings.value.icp = res.data.icp;
      
      // 解析内容设置
      if (res.data.enableAudit !== undefined) contentSettings.value.enableAudit = res.data.enableAudit === 'true';
      if (res.data.allowAnonymous !== undefined) contentSettings.value.allowAnonymous = res.data.allowAnonymous === 'true';
      if (res.data.dailyPostLimit) contentSettings.value.dailyPostLimit = parseInt(res.data.dailyPostLimit);
      if (res.data.enableSensitiveFilter !== undefined) contentSettings.value.enableSensitiveFilter = res.data.enableSensitiveFilter === 'true';
      if (res.data.sensitiveWords) contentSettings.value.sensitiveWords = res.data.sensitiveWords;
      
      // 解析搜索设置
      if (res.data.hotSearchKeywords) searchSettings.value.hotSearchKeywords = res.data.hotSearchKeywords;
      if (res.data.topicBaseWeight) searchSettings.value.topicBaseWeight = parseFloat(res.data.topicBaseWeight);
      if (res.data.topicRecentWeight) searchSettings.value.topicRecentWeight = parseFloat(res.data.topicRecentWeight);
      if (res.data.topicRecentDays) searchSettings.value.topicRecentDays = parseInt(res.data.topicRecentDays);
      
      // 解析推荐话题ID
      if (res.data.featuredTopicIds) {
        try {
          const topicIds = JSON.parse(res.data.featuredTopicIds);
          if (Array.isArray(topicIds)) {
            searchSettings.value.featuredTopicIds = topicIds;
          }
        } catch (e) {
          console.error('解析推荐话题ID失败:', e);
          searchSettings.value.featuredTopicIds = [];
        }
      }
      
      if (res.data.maxHotTopics) searchSettings.value.maxHotTopics = parseInt(res.data.maxHotTopics);
      
      // 解析推荐算法设置
      if (res.data.likeWeight) recommendSettings.value.likeWeight = parseFloat(res.data.likeWeight);
      if (res.data.commentWeight) recommendSettings.value.commentWeight = parseFloat(res.data.commentWeight);
      if (res.data.collectionWeight) recommendSettings.value.collectionWeight = parseFloat(res.data.collectionWeight);
      if (res.data.viewWeight) recommendSettings.value.viewWeight = parseFloat(res.data.viewWeight);
      if (res.data.timeDecayDays) recommendSettings.value.timeDecayDays = parseInt(res.data.timeDecayDays);
      if (res.data.maxAgeDays) recommendSettings.value.maxAgeDays = parseInt(res.data.maxAgeDays);
      if (res.data.maxAdminRecommended) recommendSettings.value.maxAdminRecommended = parseInt(res.data.maxAdminRecommended);
      
      // 解析用户设置
      if (res.data.enableRegister !== undefined) userSettings.value.enableRegister = res.data.enableRegister === 'true';
      if (res.data.requireUserAudit !== undefined) userSettings.value.requireUserAudit = res.data.requireUserAudit === 'true';
      if (res.data.defaultRole) userSettings.value.defaultRole = res.data.defaultRole;
      if (res.data.avatarSizeLimit) userSettings.value.avatarSizeLimit = parseInt(res.data.avatarSizeLimit);
      
      // 解析消息设置
      if (res.data.readDelaySeconds) messageSettings.value.readDelaySeconds = parseInt(res.data.readDelaySeconds);
    }
  } catch (error) {
    console.error('获取设置错误:', error);
    ElMessage.error('获取系统设置失败，使用默认值');
  } finally {
    loading.value = false;
  }
};

// 获取话题列表
const fetchTopics = async () => {
  try {
    const res = await api.topics.getList({ limit: 100 }); // 获取足够多的话题
    if (res.success) {
      // 映射成 transfer 组件可用的格式
      availableTopics.value = res.data.topics.map(topic => ({
        key: topic.id,
        label: topic.name,
        description: topic.description,
        usageCount: topic.usageCount
      }));
    } else {
      ElMessage.error(res.message || '获取话题列表失败');
    }
  } catch (error) {
    console.error('获取话题列表错误:', error);
    ElMessage.error('获取话题列表失败，请稍后再试');
  }
};

// 上传LOGO前的验证
const beforeLogoUpload = (file) => {
  const isJPG = file.type === 'image/jpeg';
  const isPNG = file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPG && !isPNG) {
    ElMessage.error('上传头像图片只能是 JPG 或 PNG 格式!');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('上传头像图片大小不能超过 2MB!');
    return false;
  }
  
  // 模拟上传
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    basicSettings.value.logoUrl = reader.result;
  };
  
  return false; // 阻止默认上传行为
};

// 保存设置
const saveSettings = async () => {
  saving.value = true;
  settingsStatus.value = '';
  try {
    // 将所有设置合并为一个对象
    const allSettings = {
      // 基础设置
      systemName: basicSettings.value.systemName,
      logoUrl: basicSettings.value.logoUrl,
      footerText: basicSettings.value.footerText,
      icp: basicSettings.value.icp,
      
      // 内容设置
      enableAudit: String(contentSettings.value.enableAudit),
      allowAnonymous: String(contentSettings.value.allowAnonymous),
      dailyPostLimit: String(contentSettings.value.dailyPostLimit),
      enableSensitiveFilter: String(contentSettings.value.enableSensitiveFilter),
      sensitiveWords: contentSettings.value.sensitiveWords,
      
      // 搜索设置
      hotSearchKeywords: searchSettings.value.hotSearchKeywords,
      topicBaseWeight: String(searchSettings.value.topicBaseWeight),
      topicRecentWeight: String(searchSettings.value.topicRecentWeight),
      topicRecentDays: String(searchSettings.value.topicRecentDays),
      featuredTopicIds: searchSettings.value.featuredTopicIds,
      maxHotTopics: String(searchSettings.value.maxHotTopics),
      
      // 推荐算法设置
      likeWeight: String(recommendSettings.value.likeWeight),
      commentWeight: String(recommendSettings.value.commentWeight),
      collectionWeight: String(recommendSettings.value.collectionWeight),
      viewWeight: String(recommendSettings.value.viewWeight),
      timeDecayDays: String(recommendSettings.value.timeDecayDays),
      maxAgeDays: String(recommendSettings.value.maxAgeDays),
      maxAdminRecommended: String(recommendSettings.value.maxAdminRecommended),
      
      // 用户设置
      enableRegister: String(userSettings.value.enableRegister),
      requireUserAudit: String(userSettings.value.requireUserAudit),
      defaultRole: userSettings.value.defaultRole,
      avatarSizeLimit: String(userSettings.value.avatarSizeLimit),
      
      // 消息设置
      readDelaySeconds: String(messageSettings.value.readDelaySeconds)
    };
    
    const res = await api.settings.update(allSettings);
    
    if (res.success) {
      settingsStatus.value = 'success';
      ElMessage.success('设置保存成功');
    } else {
      settingsStatus.value = 'error';
      ElMessage.error(res.message || '保存设置失败');
    }
  } catch (error) {
    settingsStatus.value = 'error';
    console.error('保存设置错误:', error);
    ElMessage.error(error.message || '保存设置失败，请稍后再试');
  } finally {
    saving.value = false;
  }
};

// 重置设置
const resetSettings = () => {
  ElMessageBox.confirm('确定要将所有设置重置为默认值吗？此操作不会立即保存到服务器。', '重置确认', {
    confirmButtonText: '确定重置',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // 重置为默认值
    basicSettings.value = {
      systemName: '校园墙管理系统',
      logoUrl: 'https://img01.yzcdn.cn/vant/cat.jpeg',
      footerText: '© 2023 校园墙管理系统',
      icp: '京ICP备12345678号'
    };
    
    contentSettings.value = {
      enableAudit: true,
      allowAnonymous: false,
      dailyPostLimit: 10,
      enableSensitiveFilter: true,
      sensitiveWords: '赌博,色情,政治,暴力,诈骗'
    };
    
    searchSettings.value = {
      hotSearchKeywords: '',
      topicBaseWeight: 0.5,
      topicRecentWeight: 0.5,
      topicRecentDays: 7,
      featuredTopicIds: [],
      maxHotTopics: 10
    };
    
    recommendSettings.value = {
      likeWeight: 2.0,
      commentWeight: 3.0,
      collectionWeight: 4.0,
      viewWeight: 0.5,
      timeDecayDays: 10,
      maxAgeDays: 30,
      maxAdminRecommended: 5
    };
    
    userSettings.value = {
      enableRegister: true,
      requireUserAudit: true,
      defaultRole: 'user',
      avatarSizeLimit: 2
    };
    
    messageSettings.value = {
      readDelaySeconds: 5
    };
    
    ElMessage.info('设置已重置为默认值');
  }).catch(() => {
    // 用户取消操作
  });
};

// 初始化推荐设置
const initRecommendSettings = async () => {
  initLoading.value = true;
  try {
    const res = await api.settings.initRecommendSettings();
    if (res.success) {
      ElMessage.success('推荐设置已初始化');
    } else {
      ElMessage.error(res.message || '初始化推荐设置失败');
    }
  } catch (error) {
    console.error('初始化推荐设置错误:', error);
    ElMessage.error(error.message || '初始化推荐设置失败，请稍后再试');
  } finally {
    initLoading.value = false;
  }
};

// 初始化搜索设置
const initSearchSettings = async () => {
  searchInitLoading.value = true;
  try {
    const res = await api.settings.initSearchSettings();
    if (res.success) {
      ElMessage.success('搜索设置已初始化');
    } else {
      ElMessage.error(res.message || '初始化搜索设置失败');
    }
  } catch (error) {
    console.error('初始化搜索设置错误:', error);
    ElMessage.error(error.message || '初始化搜索设置失败，请稍后再试');
  } finally {
    searchInitLoading.value = false;
  }
};
</script>

<style scoped>
.settings-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-status {
  display: flex;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
}

.avatar-uploader {
  width: 120px;
  height: 120px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.avatar {
  width: 120px;
  height: 120px;
  display: block;
}

.form-actions {
  margin-top: 20px;
  text-align: center;
}

.unit {
  margin-left: 10px;
}

.weight-hint {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.form-item-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.4;
}

.el-form-item.is-disabled {
  opacity: 0.6;
}

.el-form-item.is-disabled .el-form-item__label {
  color: #c0c4cc;
}
</style> 