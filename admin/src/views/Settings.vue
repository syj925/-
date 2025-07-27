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
              <el-switch v-model="contentSettings.forceManualAudit" />
              <div class="form-item-tip">
                <span v-if="contentSettings.forceManualAudit" style="color: #f56c6c;">⚠️ 所有帖子和评论都必须经过人工审核才能显示（忽略所有自动审核关键词设置）</span>
                <span v-else style="color: #67c23a;">✓ 根据下方关键词设置进行智能审核处理</span>
              </div>
            </el-form-item>

            <template v-if="!contentSettings.forceManualAudit">
              <el-form-item label="敏感关键词处理">
                <el-input
                  v-model="contentSettings.autoRejectKeywords"
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
                  v-model="contentSettings.autoApproveKeywords"
                  type="textarea"
                  :rows="2"
                  placeholder="包含这些关键词的内容将自动通过审核，以逗号分隔"
                />
                <div class="form-item-tip">
                  <span style="color: #67c23a;">✓ 匹配这些关键词的内容将直接发布（优先级高于敏感关键词）</span>
                </div>
              </el-form-item>

              <el-form-item label="智能审核模式">
                <el-switch v-model="contentSettings.enableSmartAudit" />
                <div class="form-item-tip">
                  <span v-if="contentSettings.enableSmartAudit" style="color: #e6a23c;">开启后，未匹配任何关键词的内容将进入人工审核队列</span>
                  <span v-else style="color: #67c23a;">关闭后，未匹配任何关键词的内容将直接发布</span>
                </div>
              </el-form-item>
            </template>

            <!-- 发布限制 -->
            <el-divider content-position="left">发布限制</el-divider>
            <el-form-item label="是否允许匿名发帖">
              <el-switch v-model="contentSettings.allowAnonymous" />
              <div class="form-item-tip">允许用户匿名发布帖子和评论</div>
            </el-form-item>
            <el-form-item label="每日发帖限制">
              <el-input-number v-model="contentSettings.dailyPostLimit" :min="1" :max="100" />
              <div class="form-item-tip">每个用户每天最多可发布的帖子数量</div>
            </el-form-item>
            <el-form-item label="每日评论限制">
              <el-input-number v-model="contentSettings.dailyCommentLimit" :min="1" :max="500" />
              <div class="form-item-tip">每个用户每天最多可发布的评论数量</div>
            </el-form-item>
            <el-form-item label="帖子最小字数">
              <el-input-number v-model="contentSettings.minPostLength" :min="1" :max="50" />
              <div class="form-item-tip">发布帖子的最少字符数要求</div>
            </el-form-item>
            <el-form-item label="帖子最大字数">
              <el-input-number v-model="contentSettings.maxPostLength" :min="100" :max="5000" />
              <div class="form-item-tip">发布帖子的最多字符数限制</div>
            </el-form-item>

            <!-- 敏感词过滤 -->
            <el-divider content-position="left">敏感词过滤</el-divider>
            <el-form-item label="内容敏感词过滤">
              <el-switch v-model="contentSettings.enableSensitiveFilter" />
              <div class="form-item-tip">自动检测并过滤敏感词汇</div>
            </el-form-item>
            <el-form-item label="敏感词处理方式" v-if="contentSettings.enableSensitiveFilter">
              <el-radio-group v-model="contentSettings.sensitiveWordAction">
                <el-radio label="replace">替换为***</el-radio>
                <el-radio label="reject">直接拒绝发布</el-radio>
                <el-radio label="audit">提交审核</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="敏感词列表" v-if="contentSettings.enableSensitiveFilter">
              <el-input
                v-model="contentSettings.sensitiveWords"
                type="textarea"
                :rows="4"
                placeholder="请输入敏感词，以逗号分隔"
              />
            </el-form-item>

            <!-- 图片设置 -->
            <el-divider content-position="left">图片设置</el-divider>
            <el-form-item label="允许上传图片">
              <el-switch v-model="contentSettings.allowImageUpload" />
            </el-form-item>
            <el-form-item label="单张图片大小限制(MB)" v-if="contentSettings.allowImageUpload">
              <el-input-number v-model="contentSettings.maxImageSize" :min="1" :max="20" />
            </el-form-item>
            <el-form-item label="每个帖子最多图片数" v-if="contentSettings.allowImageUpload">
              <el-input-number v-model="contentSettings.maxImagesPerPost" :min="1" :max="9" />
            </el-form-item>
            <el-form-item label="允许的图片格式" v-if="contentSettings.allowImageUpload">
              <el-checkbox-group v-model="contentSettings.allowedImageTypes">
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
              <el-input-number v-model="contentSettings.maxReplyLevel" :min="1" :max="10" />
              <div class="form-item-tip">评论回复的最大嵌套层级</div>
            </el-form-item>

            <!-- 配置更新设置 -->
            <el-divider content-position="left">配置更新设置</el-divider>
            <el-form-item label="更新检查间隔">
              <el-input-number
                v-model="contentSettings.configUpdateInterval"
                :min="1"
                :max="60"
                :step="1"
                style="width: 200px"
              />
              <span style="margin-left: 8px;">分钟</span>
              <div class="form-item-tip">前端App检查配置更新的时间间隔，建议1-60分钟之间</div>
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
                type="warning"
                description="话题管理功能正在开发中，暂时无法配置推荐话题。"
                :closable="false"
                style="margin-bottom: 15px;"
              />
              <el-input
                v-model="searchSettings.featuredTopicIds"
                type="textarea"
                :rows="3"
                placeholder="推荐话题ID列表（以逗号分隔，如：1,2,3）"
                disabled
              />
              <div class="featured-topics-hint">
                <span class="weight-hint">功能开发完成后，将支持可视化选择推荐话题</span>
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
        
        <el-tab-pane label="配置管理" name="config">
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
// const availableTopics = ref([]); // 暂时禁用，等话题管理API完成后再启用
const settingsStatus = ref('');

// 配置管理相关
const publishingConfig = ref(false);
const loadingHistory = ref(false);
const showPublishDialog = ref(false);
const versionFormRef = ref(null);

// 当前配置版本信息
const configVersion = ref({
  version: '1.0.0',
  updateTime: new Date().toISOString(),
  description: '初始版本',
  forceUpdate: false,
  downloadCount: 0
});

// 新版本表单
const newVersionForm = ref({
  version: '',
  description: '',
  forceUpdate: false
});

// 版本历史
const versionHistory = ref([]);

// 基础设置
const basicSettings = ref({
  systemName: '校园墙管理系统',
  logoUrl: 'https://img01.yzcdn.cn/vant/cat.jpeg',
  footerText: '© 2023 校园墙管理系统',
  icp: '京ICP备12345678号'
});

// 内容设置
const contentSettings = ref({
  // 审核设置
  forceManualAudit: false,        // 强制人工审核总开关
  enableSmartAudit: false,        // 智能审核模式
  enableAudit: true,              // 保留原有字段（兼容性）
  autoApproveKeywords: '学习,教育,知识,分享',
  autoRejectKeywords: '广告,推广,微信,QQ,赌博,色情',

  // 发布限制
  allowAnonymous: false,
  dailyPostLimit: 10,
  dailyCommentLimit: 50,
  minPostLength: 5,
  maxPostLength: 1000,

  // 敏感词过滤
  enableSensitiveFilter: true,
  sensitiveWordAction: 'replace',
  sensitiveWords: '赌博,色情,政治,暴力,诈骗',

  // 图片设置
  allowImageUpload: true,
  maxImageSize: 5,
  maxImagesPerPost: 6,
  allowedImageTypes: ['jpg', 'jpeg', 'png'],

  // 互动设置
  maxReplyLevel: 3,

  // 配置更新设置
  configUpdateInterval: 5  // 配置更新检查间隔（分钟）
});

// 搜索设置
const searchSettings = ref({
  hotSearchKeywords: '',
  topicBaseWeight: 0.5,
  topicRecentWeight: 0.5,
  topicRecentDays: 7,
  featuredTopicIds: '',
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
  await loadConfigVersion();
  await loadVersionHistory();
  // TODO: 等话题管理API完成后再启用
  // await fetchTopics();
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
      if (res.data.forceManualAudit !== undefined) contentSettings.value.forceManualAudit = res.data.forceManualAudit === 'true';
      if (res.data.enableSmartAudit !== undefined) contentSettings.value.enableSmartAudit = res.data.enableSmartAudit === 'true';
      if (res.data.enableAudit !== undefined) contentSettings.value.enableAudit = res.data.enableAudit === 'true';
      if (res.data.autoApproveKeywords) contentSettings.value.autoApproveKeywords = res.data.autoApproveKeywords;
      if (res.data.autoRejectKeywords) contentSettings.value.autoRejectKeywords = res.data.autoRejectKeywords;
      if (res.data.allowAnonymous !== undefined) contentSettings.value.allowAnonymous = res.data.allowAnonymous === 'true';
      if (res.data.dailyPostLimit) contentSettings.value.dailyPostLimit = parseInt(res.data.dailyPostLimit);
      if (res.data.dailyCommentLimit) contentSettings.value.dailyCommentLimit = parseInt(res.data.dailyCommentLimit);
      if (res.data.minPostLength) contentSettings.value.minPostLength = parseInt(res.data.minPostLength);
      if (res.data.maxPostLength) contentSettings.value.maxPostLength = parseInt(res.data.maxPostLength);
      if (res.data.enableSensitiveFilter !== undefined) contentSettings.value.enableSensitiveFilter = res.data.enableSensitiveFilter === 'true';
      if (res.data.sensitiveWordAction) contentSettings.value.sensitiveWordAction = res.data.sensitiveWordAction;
      if (res.data.sensitiveWords) contentSettings.value.sensitiveWords = res.data.sensitiveWords;
      if (res.data.allowImageUpload !== undefined) contentSettings.value.allowImageUpload = res.data.allowImageUpload === 'true';
      if (res.data.maxImageSize) contentSettings.value.maxImageSize = parseInt(res.data.maxImageSize);
      if (res.data.maxImagesPerPost) contentSettings.value.maxImagesPerPost = parseInt(res.data.maxImagesPerPost);
      if (res.data.allowedImageTypes) {
        try {
          contentSettings.value.allowedImageTypes = JSON.parse(res.data.allowedImageTypes);
        } catch (e) {
          console.error('解析图片格式失败:', e);
        }
      }
      if (res.data.maxReplyLevel) contentSettings.value.maxReplyLevel = parseInt(res.data.maxReplyLevel);
      if (res.data.configUpdateInterval) contentSettings.value.configUpdateInterval = parseInt(res.data.configUpdateInterval);

      // 解析搜索设置
      if (res.data.hotSearchKeywords) searchSettings.value.hotSearchKeywords = res.data.hotSearchKeywords;
      if (res.data.topicBaseWeight) searchSettings.value.topicBaseWeight = parseFloat(res.data.topicBaseWeight);
      if (res.data.topicRecentWeight) searchSettings.value.topicRecentWeight = parseFloat(res.data.topicRecentWeight);
      if (res.data.topicRecentDays) searchSettings.value.topicRecentDays = parseInt(res.data.topicRecentDays);
      
      // 解析推荐话题ID - 暂时作为字符串处理
      if (res.data.featuredTopicIds) {
        if (typeof res.data.featuredTopicIds === 'string') {
          searchSettings.value.featuredTopicIds = res.data.featuredTopicIds;
        } else {
          // 如果是数组，转换为逗号分隔的字符串
          searchSettings.value.featuredTopicIds = Array.isArray(res.data.featuredTopicIds)
            ? res.data.featuredTopicIds.join(',')
            : '';
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

// 获取话题列表 - 暂时禁用，等话题管理API完成后再启用
// const fetchTopics = async () => {
//   try {
//     const res = await api.topics.getList({ limit: 100 }); // 获取足够多的话题
//     if (res.success) {
//       // 映射成 transfer 组件可用的格式
//       availableTopics.value = res.data.topics.map(topic => ({
//         key: topic.id,
//         label: topic.name,
//         description: topic.description,
//         usageCount: topic.usageCount
//       }));
//     } else {
//       ElMessage.error(res.message || '获取话题列表失败');
//     }
//   } catch (error) {
//     console.error('获取话题列表错误:', error);
//     ElMessage.error('获取话题列表失败，请稍后再试');
//   }
// };

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
      forceManualAudit: String(contentSettings.value.forceManualAudit),
      enableSmartAudit: String(contentSettings.value.enableSmartAudit),
      enableAudit: String(contentSettings.value.enableAudit),
      autoApproveKeywords: contentSettings.value.autoApproveKeywords,
      autoRejectKeywords: contentSettings.value.autoRejectKeywords,
      allowAnonymous: String(contentSettings.value.allowAnonymous),
      dailyPostLimit: String(contentSettings.value.dailyPostLimit),
      dailyCommentLimit: String(contentSettings.value.dailyCommentLimit),
      minPostLength: String(contentSettings.value.minPostLength),
      maxPostLength: String(contentSettings.value.maxPostLength),
      enableSensitiveFilter: String(contentSettings.value.enableSensitiveFilter),
      sensitiveWordAction: contentSettings.value.sensitiveWordAction,
      sensitiveWords: contentSettings.value.sensitiveWords,
      allowImageUpload: String(contentSettings.value.allowImageUpload),
      maxImageSize: String(contentSettings.value.maxImageSize),
      maxImagesPerPost: String(contentSettings.value.maxImagesPerPost),
      allowedImageTypes: JSON.stringify(contentSettings.value.allowedImageTypes),
      maxReplyLevel: String(contentSettings.value.maxReplyLevel),
      configUpdateInterval: String(contentSettings.value.configUpdateInterval),

      // 搜索设置
      hotSearchKeywords: searchSettings.value.hotSearchKeywords,
      topicBaseWeight: String(searchSettings.value.topicBaseWeight),
      topicRecentWeight: String(searchSettings.value.topicRecentWeight),
      topicRecentDays: String(searchSettings.value.topicRecentDays),
      featuredTopicIds: searchSettings.value.featuredTopicIds || '',
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
      // 审核设置
      forceManualAudit: false,
      enableSmartAudit: false,
      enableAudit: true,
      autoApproveKeywords: '学习,教育,知识,分享',
      autoRejectKeywords: '广告,推广,微信,QQ,赌博,色情',

      // 发布限制
      allowAnonymous: false,
      dailyPostLimit: 10,
      dailyCommentLimit: 50,
      minPostLength: 5,
      maxPostLength: 1000,

      // 敏感词过滤
      enableSensitiveFilter: true,
      sensitiveWordAction: 'replace',
      sensitiveWords: '赌博,色情,政治,暴力,诈骗',

      // 图片设置
      allowImageUpload: true,
      maxImageSize: 5,
      maxImagesPerPost: 6,
      allowedImageTypes: ['jpg', 'jpeg', 'png'],

      // 互动设置
      maxReplyLevel: 3,

      // 配置更新设置
      configUpdateInterval: 5
    };
    
    searchSettings.value = {
      hotSearchKeywords: '',
      topicBaseWeight: 0.5,
      topicRecentWeight: 0.5,
      topicRecentDays: 7,
      featuredTopicIds: '',
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

// ==================== 配置管理相关方法 ====================

// 加载当前配置版本信息
const loadConfigVersion = async () => {
  try {
    const res = await api.config.getCurrentVersion();
    if (res.success && res.data) {
      configVersion.value = res.data;
    } else {
      console.warn('获取配置版本信息失败:', res.message);
      // 使用默认值
      configVersion.value = {
        version: '1.0.0',
        updateTime: new Date().toISOString(),
        description: '初始版本',
        forceUpdate: false,
        downloadCount: 0
      };
    }
  } catch (error) {
    console.error('加载配置版本信息失败:', error);
    // 使用默认值
    configVersion.value = {
      version: '1.0.0',
      updateTime: new Date().toISOString(),
      description: '初始版本',
      forceUpdate: false,
      downloadCount: 0
    };
  }
};

// 加载版本历史
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
    // 不显示错误提示，避免影响页面加载
  } finally {
    loadingHistory.value = false;
  }
};

// 发布新版本
const publishNewVersion = () => {
  // 自动生成下一个版本号
  const currentVersion = configVersion.value.version;
  const versionParts = currentVersion.split('.').map(Number);
  versionParts[2] += 1; // 增加修订版本号

  newVersionForm.value = {
    version: versionParts.join('.'),
    description: '',
    forceUpdate: false
  };

  showPublishDialog.value = true;
};

// 获取敏感词数量
const getSensitiveWordsCount = () => {
  if (!contentSettings.value.sensitiveWords) return 0;
  return contentSettings.value.sensitiveWords.split(',').filter(w => w.trim()).length;
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '未知';

  const date = new Date(timeStr);
  const now = new Date();
  const diff = now - date;

  // 如果是今天
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 如果是今年
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 其他情况显示完整日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 确认发布版本
const confirmPublishVersion = async () => {
  if (!newVersionForm.value.version || !newVersionForm.value.description) {
    ElMessage.warning('请填写版本号和更新说明');
    return;
  }

  publishingConfig.value = true;

  try {
    // 构建配置数据
    const configData = {
      version: newVersionForm.value.version,
      description: newVersionForm.value.description,
      forceUpdate: newVersionForm.value.forceUpdate,
      config: {
        minPostLength: contentSettings.value.minPostLength,
        maxPostLength: contentSettings.value.maxPostLength,
        enableSensitiveFilter: contentSettings.value.enableSensitiveFilter,
        sensitiveWords: typeof contentSettings.value.sensitiveWords === 'string'
          ? contentSettings.value.sensitiveWords.split(',').map(w => w.trim()).filter(w => w)
          : contentSettings.value.sensitiveWords || [],
        sensitiveWordAction: contentSettings.value.sensitiveWordAction,
        dailyPostLimit: contentSettings.value.dailyPostLimit,
        dailyCommentLimit: contentSettings.value.dailyCommentLimit,
        allowAnonymous: contentSettings.value.allowAnonymous,
        maxImagesPerPost: contentSettings.value.maxImagesPerPost,
        maxImageSize: contentSettings.value.maxImageSize,
        allowedImageTypes: Array.isArray(contentSettings.value.allowedImageTypes)
          ? contentSettings.value.allowedImageTypes
          : (typeof contentSettings.value.allowedImageTypes === 'string'
             ? contentSettings.value.allowedImageTypes.split(',').map(t => t.trim()).filter(t => t)
             : ['jpg', 'jpeg', 'png', 'gif', 'webp']),
        maxReplyLevel: contentSettings.value.maxReplyLevel,
        configUpdateInterval: contentSettings.value.configUpdateInterval
      }
    };

    const res = await api.config.publishVersion(configData);

    if (res.success) {
      ElMessage.success('配置版本发布成功');
      showPublishDialog.value = false;

      // 重新加载数据
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

// 回滚到指定版本
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

.form-item-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.el-divider {
  margin: 30px 0 20px 0;
}

.el-divider__text {
  font-weight: 600;
  color: #303133;
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

/* 配置管理样式 */
.config-management {
  .version-card, .history-card {
    margin-bottom: 20px;
  }

  .config-preview-card {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;

    .config-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .config-label {
        color: #666;
        font-size: 14px;
      }

      .config-value {
        color: #333;
        font-weight: 500;
        font-size: 14px;
      }
    }
  }
}
</style> 