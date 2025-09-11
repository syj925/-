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
                <el-radio value="replace">替换为***</el-radio>
                <el-radio value="reject">直接拒绝发布</el-radio>
                <el-radio value="audit">提交审核</el-radio>
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
              title="私信功能全局控制"
              type="warning"
              description="控制整个应用的私信功能是否开启。关闭后，所有用户都无法发送和接收私信。"
              :closable="false"
              style="margin-bottom: 20px;"
            />
            <el-form-item label="全局私信功能">
              <el-switch
                v-model="messageSettings.enablePrivateMessage"
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
                v-model="searchSettings.maxHotTopics"
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
                v-model="searchSettings.hotSearchCount"
                :min="3"
                :max="15"
                :step="1"
              />
              <span class="weight-hint">搜索发现页面显示的热门搜索标签数量</span>
            </el-form-item>

            <el-form-item label="启用热门搜索">
              <el-switch
                v-model="searchSettings.enableHotSearch"
                active-text="启用"
                inactive-text="禁用"
              />
              <span class="weight-hint">是否在搜索发现页面显示热门搜索区域</span>
            </el-form-item>

            <el-form-item label="热门搜索数据源">
              <el-radio-group v-model="searchSettings.hotSearchSource">
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
                v-model="searchSettings.recommendContentCount"
                :min="3"
                :max="20"
                :step="1"
              />
              <span class="weight-hint">搜索发现页面"推荐内容"区域显示的内容数量</span>
            </el-form-item>

            <el-form-item label="启用推荐内容">
              <el-switch
                v-model="searchSettings.enableRecommendContent"
                active-text="启用"
                inactive-text="禁用"
              />
              <span class="weight-hint">是否在搜索发现页面显示推荐内容区域</span>
            </el-form-item>

            <el-form-item label="推荐内容类型">
              <el-checkbox-group v-model="searchSettings.recommendContentTypes">
                <el-checkbox label="post">帖子</el-checkbox>
                <el-checkbox label="topic">话题</el-checkbox>
                <el-checkbox label="user">用户</el-checkbox>
              </el-checkbox-group>
              <span class="weight-hint">推荐内容可以包含的类型</span>
            </el-form-item>

            <el-form-item label="推荐算法策略">
              <el-radio-group v-model="searchSettings.recommendStrategy">
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
              <el-button type="warning" @click="initSearchSettings" :loading="searchInitLoading">初始化搜索设置</el-button>
              <span class="weight-hint">如果新安装或搜索设置出现问题，请点击此按钮初始化默认设置</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="推荐算法" name="recommendation">
          <!-- 头部说明 -->
          <div class="recommendation-header">
            <el-alert
              title="推荐算法权重设置"
              type="info"
              description="这些设置将影响系统如何计算内容的推荐排名。得分计算公式：点赞×点赞权重 + 评论×评论权重 + 收藏×收藏权重 + 浏览量×浏览权重，最后结合时间因素。"
              :closable="false"
              style="margin-bottom: 20px;"
            />
            <div class="header-actions">
              <el-button
                type="primary"
                :icon="Document"
                @click="showRecommendationGuide = true"
                style="margin-bottom: 20px;"
              >
                📖 使用说明
              </el-button>
            </div>
          </div>

          <!-- 左右两栏布局 -->
          <div class="recommendation-layout">
            <!-- 左栏：配置参数 + 统计 -->
            <div class="config-column">
              <el-form :model="recommendSettings" label-width="180px">

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

            <el-form-item label="最低互动分数阈值">
              <el-input-number
                v-model="recommendSettings.minInteractionScore"
                :min="0"
                :max="20"
                :step="0.5"
                :precision="1"
              />
              <span class="weight-hint">只有互动分数达到此阈值的内容才会被算法推荐（点赞×1 + 评论×2 + 收藏×3 + 浏览×0.1）</span>
            </el-form-item>

            <el-form-item label="推荐分数阈值">
              <el-input-number
                v-model="recommendSettings.scoreThreshold"
                :min="1"
                :max="50"
                :step="1"
                :precision="1"
              />
              <span class="weight-hint">只有达到此分数的内容才会被自动推荐</span>
            </el-form-item>

            <el-divider content-position="left">
              <el-icon><Star /></el-icon>
              质量评估设置 (v2.0新增)
            </el-divider>

            <el-form-item label="新帖保护加分">
              <el-input-number
                v-model="recommendSettings.newPostBonus"
                :min="0"
                :max="20"
                :step="0.5"
                :precision="1"
              />
              <span class="weight-hint">24小时内的新帖子额外加分，避免被埋没</span>
            </el-form-item>

            <el-form-item label="图片内容加分">
              <el-input-number
                v-model="recommendSettings.imageBonus"
                :min="0"
                :max="10"
                :step="0.5"
                :precision="1"
              />
              <span class="weight-hint">包含图片的帖子额外加分</span>
            </el-form-item>

            <el-form-item label="长文内容加分">
              <el-input-number
                v-model="recommendSettings.contentBonus"
                :min="0"
                :max="10"
                :step="0.5"
                :precision="1"
              />
              <span class="weight-hint">长文内容（>100字）额外加分</span>
            </el-form-item>

            <el-form-item label="话题标签加分">
              <el-input-number
                v-model="recommendSettings.topicBonus"
                :min="0"
                :max="5"
                :step="0.1"
                :precision="1"
              />
              <span class="weight-hint">包含话题标签的帖子额外加分</span>
            </el-form-item>

            <el-form-item label="互动质量因子">
              <el-input-number
                v-model="recommendSettings.engagementFactor"
                :min="0"
                :max="1"
                :step="0.1"
                :precision="2"
              />
              <span class="weight-hint">评论/点赞比例的权重，提升深度互动内容的推荐</span>
            </el-form-item>

            <el-divider content-position="left">
              <el-icon><Refresh /></el-icon>
              多样性控制设置 (v2.0新增)
            </el-divider>

            <el-form-item label="同一作者最大占比">
              <el-input-number
                v-model="recommendSettings.maxSameAuthorRatio"
                :min="0.1"
                :max="1"
                :step="0.1"
                :precision="2"
              />
              <span class="weight-hint">防止同一作者霸榜，值越小多样性越高</span>
            </el-form-item>

            <el-form-item label="多样性检查周期(小时)">
              <el-input-number
                v-model="recommendSettings.diversityPeriodHours"
                :min="1"
                :max="72"
                :step="1"
              />
              <span class="weight-hint">多样性统计的时间窗口</span>
            </el-form-item>

            <el-form-item label="分数更新间隔(小时)">
              <el-input-number
                v-model="recommendSettings.updateIntervalHours"
                :min="1"
                :max="24"
                :step="1"
              />
              <span class="weight-hint">推荐分数的定时更新间隔</span>
            </el-form-item>

            <el-divider content-position="left">
              <el-icon><Timer /></el-icon>
              自动更新控制 (v2.0新增)
            </el-divider>

            <el-form-item label="启用自动更新">
              <el-switch
                v-model="autoUpdateConfig.enabled"
                active-text="启用"
                inactive-text="禁用"
                @change="handleAutoUpdateToggle"
              />
              <span class="weight-hint">是否启用推荐内容的定时自动更新</span>
            </el-form-item>

            <el-form-item label="更新策略" v-if="autoUpdateConfig.enabled">
              <el-radio-group v-model="autoUpdateConfig.strategy" @change="onStrategyChange">
                <el-radio value="incremental">增量更新</el-radio>
                <el-radio value="full">全量更新</el-radio>
                <el-radio value="smart">智能更新</el-radio>
              </el-radio-group>
              <div class="weight-hint">
                <p>• 增量更新：只更新最近变动的内容，速度快</p>
                <p>• 全量更新：重新计算所有内容分数，准确度高</p>
                <p>• 智能更新：根据系统负载自动选择策略</p>
              </div>
            </el-form-item>

            <el-form-item label="更新频率" v-if="autoUpdateConfig.enabled">
              <el-select v-model="autoUpdateConfig.frequency" placeholder="选择更新频率" @change="onFrequencyChange">
                <el-option label="🧪 每10秒 (开发测试)" value="10sec" />
                <el-option label="每30分钟" value="30min" />
                <el-option label="每1小时" value="1hour" />
                <el-option label="每2小时" value="2hour" />
                <el-option label="每6小时" value="6hour" />
                <el-option label="每12小时" value="12hour" />
                <el-option label="每24小时" value="24hour" />
              </el-select>
              <span class="weight-hint">推荐内容的自动更新频率（10秒选项仅用于开发测试）</span>
            </el-form-item>

            <el-form-item label="下次更新时间" v-if="autoUpdateConfig.enabled">
              <el-tag :type="getNextUpdateStatus()">
                {{ formatNextUpdateTime() }}
              </el-tag>
              <el-button 
                type="text" 
                size="small" 
                @click="loadAutoUpdateStatus"
                style="margin-left: 10px;"
              >
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </el-form-item>

            <el-form-item label="自动更新状态" v-if="autoUpdateConfig.enabled">
              <div class="auto-update-status">
                <el-tag :type="autoUpdateStatus.running ? 'success' : 'info'" style="margin-right: 10px;">
                  {{ autoUpdateStatus.running ? '运行中' : '已停止' }}
                </el-tag>
                <el-tag type="info" v-if="autoUpdateStatus.lastRun">
                  上次运行: {{ formatTime(autoUpdateStatus.lastRun) }}
                </el-tag>
                <el-tag type="warning" v-if="autoUpdateStatus.lastError">
                  错误: {{ autoUpdateStatus.lastError }}
                </el-tag>
              </div>
            </el-form-item>

            <el-divider content-position="left">
              <el-icon><Search /></el-icon>
              搜索发现页面设置
            </el-divider>

            <el-form-item label="搜索页推荐内容数量">
              <el-input-number
                v-model="recommendSettings.searchPageRecommendCount"
                :min="3"
                :max="20"
                :step="1"
              />
              <span class="weight-hint">搜索发现页面"推荐内容"区域显示的内容数量</span>
            </el-form-item>

            <el-form-item label="启用搜索页推荐">
              <el-switch
                v-model="recommendSettings.enableSearchPageRecommend"
                active-text="启用"
                inactive-text="禁用"
              />
              <span class="weight-hint">是否在搜索发现页面显示推荐内容区域</span>
            </el-form-item>

            <el-form-item label="推荐内容类型">
              <el-checkbox-group v-model="recommendSettings.searchRecommendTypes">
                <el-checkbox label="post">帖子</el-checkbox>
                <el-checkbox label="topic">话题</el-checkbox>
                <el-checkbox label="user">用户</el-checkbox>
              </el-checkbox-group>
              <span class="weight-hint">搜索页推荐内容可以包含的类型</span>
            </el-form-item>

            <el-form-item>
              <el-button type="warning" @click="initRecommendSettings" :loading="initLoading">初始化推荐设置</el-button>
              <el-button type="info" @click="clearRecommendCache" :loading="clearCacheLoading" style="margin-left: 10px;">清除推荐缓存</el-button>
              <el-button type="success" @click="testRecommendAlgorithm" :loading="testLoading" style="margin-left: 10px;">测试算法</el-button>
              <el-button type="primary" @click="recalculateScores" :loading="recalcLoading" style="margin-left: 10px;">🔄 重新计算分数</el-button>
              <span class="weight-hint">如果新安装或推荐设置出现问题，请点击此按钮初始化默认设置</span>
            </el-form-item>

            <!-- 🆕 预设配置管理 -->
            <el-divider content-position="left">
              <el-icon><Setting /></el-icon>
              配置管理 (v2.0新增)
            </el-divider>

            <el-form-item label="预设配置">
              <div class="preset-config-controls">
                <el-select v-model="selectedPreset" placeholder="选择预设配置" style="width: 200px;">
                  <el-option
                    v-for="preset in presetConfigurations"
                    :key="preset.id"
                    :label="preset.name"
                    :value="preset.id">
                    <span style="float: left">{{ preset.name }}</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">{{ preset.description }}</span>
                  </el-option>
                </el-select>
                <el-button type="primary" @click="applyPresetConfig" :disabled="!selectedPreset" :loading="presetLoading" style="margin-left: 10px;">
                  <el-icon><Check /></el-icon>
                  应用预设
                </el-button>
                <el-button @click="loadPresetConfigurations" :loading="presetsLoading" style="margin-left: 10px;">
                  <el-icon><Refresh /></el-icon>
                  刷新预设
                </el-button>
              </div>
              <div class="preset-description" v-if="selectedPresetInfo">
                <el-alert :title="selectedPresetInfo.name" :description="selectedPresetInfo.description" type="info" :closable="false" />
              </div>
              <span class="weight-hint">选择适合您场景的预设配置：开发模式、生产模式、高质量模式、活跃模式</span>
            </el-form-item>

            <el-form-item label="配置导入导出">
              <div class="config-import-export">
                <el-button type="success" @click="exportConfiguration" :loading="exportLoading">
                  <el-icon><Download /></el-icon>
                  导出当前配置
                </el-button>
                <el-upload
                  ref="configUpload"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept=".json"
                  :on-change="handleConfigFileChange"
                  style="display: inline-block; margin-left: 10px;">
                  <el-button type="warning" :loading="importLoading">
                    <el-icon><Upload /></el-icon>
                    导入配置
                  </el-button>
                </el-upload>
                <el-button @click="showConfigPreview = true" :disabled="!configToImport" style="margin-left: 10px;">
                  <el-icon><View /></el-icon>
                  预览配置
                </el-button>
              </div>
              <span class="weight-hint">可以导出当前配置或导入之前保存的配置文件</span>
            </el-form-item>

            <el-divider content-position="left">
              <el-icon><DataAnalysis /></el-icon>
              推荐算法统计
            </el-divider>

            <el-form-item label="">
              <div class="recommendation-dashboard">
                <!-- 核心指标卡片 -->
                <div class="dashboard-row">
                  <div class="metric-card primary">
                    <div class="metric-icon">
                      <el-icon><Document /></el-icon>
                    </div>
                    <div class="metric-content">
                      <div class="metric-value">{{ Number(recommendStats.totalPosts) || 0 }}</div>
                      <div class="metric-label">总帖子数</div>
                    </div>
                  </div>

                  <div class="metric-card success">
                    <div class="metric-icon">
                      <el-icon><Star /></el-icon>
                    </div>
                    <div class="metric-content">
                      <div class="metric-value">{{ Number(recommendStats.totalRecommended) || 0 }}</div>
                      <div class="metric-label">总推荐数</div>
                      <div class="metric-progress">
                        <el-progress 
                          :percentage="getRecommendationPercentage()" 
                          :show-text="false" 
                          :stroke-width="4"
                          color="#67c23a"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="metric-card warning">
                    <div class="metric-icon">
                      <el-icon><TrendCharts /></el-icon>
                    </div>
                    <div class="metric-content">
                      <div class="metric-value">{{ Number(recommendStats.recommendationCoverage) || 0 }}%</div>
                      <div class="metric-label">推荐覆盖率</div>
                      <div class="metric-trend" :class="getCoverageClass()">
                        {{ getCoverageTrend() }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 详细统计卡片 -->
                <div class="dashboard-row secondary">
                  <div class="detail-card">
                    <div class="detail-header">
                      <el-icon><View /></el-icon>
                      <span>管理员推荐</span>
                    </div>
                    <div class="detail-value">{{ Number(recommendStats.manualRecommended) || 0 }}</div>
                    <div class="detail-desc">人工筛选优质内容</div>
                  </div>

                  <div class="detail-card">
                    <div class="detail-header">
                      <el-icon><DataAnalysis /></el-icon>
                      <span>算法推荐</span>
                    </div>
                    <div class="detail-value">{{ Number(recommendStats.autoRecommended) || 0 }}</div>
                    <div class="detail-desc">AI智能推荐内容</div>
                  </div>

                  <div class="detail-card">
                    <div class="detail-header">
                      <el-icon><TrendCharts /></el-icon>
                      <span>平均分数</span>
                    </div>
                    <div class="detail-value">{{ (Number(recommendStats.avgScore) || 0).toFixed(2) }}</div>
                    <div class="detail-desc">推荐质量评分</div>
                  </div>

                  <div class="detail-card">
                    <div class="detail-header">
                      <el-icon><Star /></el-icon>
                      <span>最高分数</span>
                    </div>
                    <div class="detail-value">{{ (Number(recommendStats.maxScore) || 0).toFixed(2) }}</div>
                    <div class="detail-desc">单个内容最高分</div>
                  </div>
                </div>

                <!-- 状态信息栏 -->
                <div class="status-bar">
                  <div class="status-item">
                    <el-icon><Timer /></el-icon>
                    <span class="status-label">最后更新:</span>
                    <span class="status-value">{{ formatUpdateTime(recommendStats.lastUpdateTime) }}</span>
                  </div>
                  <div class="status-actions">
                    <el-button 
                      type="primary" 
                      size="small"
                      @click="loadRecommendStats"
                      :loading="statsLoading"
                      :icon="Refresh"
                    >
                      刷新统计
                    </el-button>
                  </div>
                </div>
              </div>
            </el-form-item>
              </el-form>
            </div>

            <!-- 右栏：帖子分数分析 -->
            <div class="analysis-column">
              <el-card class="analysis-card" shadow="never">
                <template #header>
                  <div class="card-header">
                    <el-icon><Search /></el-icon>
                    <span>帖子分数分析</span>
                  </div>
                </template>


              <div class="post-analysis-section">
                <!-- 查询区域 -->
                <div class="analysis-query">
                  <el-input
                    v-model="analysisPostId"
                    placeholder="输入完整的帖子ID (如: b294f2bf-f380-47db...)"
                    type="text"
                    style="width: 280px; margin-right: 10px;"
                    @keyup.enter="analyzePost"
                  >
                    <template #prepend>
                      <el-icon><Document /></el-icon>
                    </template>
                  </el-input>
                  <el-button 
                    type="primary" 
                    @click="analyzePost"
                    :loading="analysisLoading"
                    :disabled="!analysisPostId"
                  >
                    <el-icon><Search /></el-icon>
                    分析分数
                  </el-button>
                  <el-button 
                    type="info" 
                    @click="clearAnalysis"
                    :disabled="!analysisResult"
                  >
                    <el-icon><RefreshRight /></el-icon>
                    清空结果
                  </el-button>
                </div>
                
                <!-- 测试提示 -->
                <div class="test-hint">
                  <el-alert
                    title="💡 测试提示"
                    type="info"
                    :closable="false"
                    style="margin-bottom: 16px;"
                  >
                    <template #default>
                      <p style="margin: 0;">可以使用以下帖子ID进行测试：</p>
                      <el-link 
                        type="primary" 
                        style="margin-top: 4px; font-family: monospace; font-size: 12px;"
                        @click="analysisPostId = 'b294f2bf-f380-47db-a204-95430d390679'"
                      >
                        b294f2bf-f380-47db-a204-95430d390679
                      </el-link>
                    </template>
                  </el-alert>
                </div>

                <!-- 分析结果 -->
                <div v-if="analysisResult" class="analysis-result">
                  <!-- 帖子基本信息 -->
                  <el-card class="post-info-card" shadow="never">
                    <template #header>
                      <div class="card-header">
                        <el-icon><Document /></el-icon>
                        <span>帖子信息</span>
                        <el-tag 
                          :type="analysisResult.analysis.result.isRecommended ? 'success' : 'info'"
                          style="margin-left: 10px;"
                        >
                          {{ analysisResult.analysis.result.isRecommended ? '已推荐' : '未推荐' }}
                        </el-tag>
                      </div>
                    </template>
                    <div class="post-basic-info">
                      <div class="info-row">
                        <span class="info-label">标题:</span>
                        <span class="info-value">{{ analysisResult.post.title }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">作者:</span>
                        <span class="info-value">{{ analysisResult.post.author?.nickname || analysisResult.post.author?.username }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">发布时间:</span>
                        <span class="info-value">{{ formatDateTime(analysisResult.post.createdAt) }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">互动数据:</span>
                        <span class="info-value">
                          👍 {{ analysisResult.post.like_count }} 
                          💬 {{ analysisResult.post.comment_count }} 
                          ⭐ {{ analysisResult.post.favorite_count }} 
                          👁 {{ analysisResult.post.view_count }}
                        </span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">内容特征:</span>
                        <span class="info-value">
                          <el-tag v-if="analysisResult.post.hasImages" size="small" type="success">有图片({{ analysisResult.post.imageCount }})</el-tag>
                          <el-tag v-if="analysisResult.post.hasTopics" size="small" type="primary">有话题({{ analysisResult.post.topicCount }})</el-tag>
                          <el-tag v-if="analysisResult.post.contentLength > 100" size="small" type="warning">长文({{ analysisResult.post.contentLength }}字)</el-tag>
                        </span>
                      </div>
                    </div>
                  </el-card>

                  <!-- 分数组成分析 -->
                  <el-card class="score-breakdown-card" shadow="never">
                    <template #header>
                      <div class="card-header">
                        <el-icon><DataAnalysis /></el-icon>
                        <span>分数组成分析</span>
                        <el-tag type="primary" style="margin-left: 10px;">
                          最终分数: {{ analysisResult.analysis.result.finalScore }}
                        </el-tag>
                      </div>
                    </template>
                    
                    <!-- 基础分数 -->
                    <div class="score-section">
                      <h4>1. 基础互动分数</h4>
                      <div class="score-breakdown">
                        <div class="score-item">
                          <span>点赞分数:</span>
                          <span>{{ analysisResult.post.like_count }} × {{ analysisResult.settings.likeWeight }} = {{ analysisResult.analysis.baseScoreBreakdown.likeScore }}</span>
                        </div>
                        <div class="score-item">
                          <span>评论分数:</span>
                          <span>{{ analysisResult.post.comment_count }} × {{ analysisResult.settings.commentWeight }} = {{ analysisResult.analysis.baseScoreBreakdown.commentScore }}</span>
                        </div>
                        <div class="score-item">
                          <span>收藏分数:</span>
                          <span>{{ analysisResult.post.favorite_count }} × {{ analysisResult.settings.collectionWeight }} = {{ analysisResult.analysis.baseScoreBreakdown.favoriteScore }}</span>
                        </div>
                        <div class="score-item">
                          <span>浏览分数:</span>
                          <span>{{ analysisResult.post.view_count }} × {{ analysisResult.settings.viewWeight }} = {{ analysisResult.analysis.baseScoreBreakdown.viewScore }}</span>
                        </div>
                        <div class="score-item total">
                          <span><strong>基础总分:</strong></span>
                          <span><strong>{{ analysisResult.analysis.baseScoreBreakdown.total }}</strong></span>
                        </div>
                      </div>
                    </div>

                    <!-- 时间衰减 -->
                    <div class="score-section">
                      <h4>2. 时间衰减因子</h4>
                      <div class="score-breakdown">
                        <div class="score-item">
                          <span>帖子年龄:</span>
                          <span>{{ analysisResult.analysis.timeFactor.ageInDays }} 天</span>
                        </div>
                        <div class="score-item">
                          <span>衰减因子:</span>
                          <span>{{ analysisResult.analysis.timeFactor.factor }}</span>
                        </div>
                        <div class="score-item total">
                          <span><strong>时间加权后:</strong></span>
                          <span><strong>{{ analysisResult.analysis.timeFactor.baseWithTime }}</strong></span>
                        </div>
                      </div>
                    </div>

                    <!-- 质量加分 -->
                    <div class="score-section">
                      <h4>3. 内容质量加分</h4>
                      <div class="score-breakdown">
                        <div class="score-item">
                          <span>新帖保护:</span>
                          <span>{{ analysisResult.analysis.newPostProtection.bonus }} ({{ analysisResult.analysis.newPostProtection.activated ? '已激活' : '未激活' }})</span>
                        </div>
                        <div class="score-item">
                          <span>图片加分:</span>
                          <span>{{ analysisResult.analysis.qualityBonus.imageBonus }}</span>
                        </div>
                        <div class="score-item">
                          <span>长文加分:</span>
                          <span>{{ analysisResult.analysis.qualityBonus.contentBonus }}</span>
                        </div>
                        <div class="score-item">
                          <span>话题加分:</span>
                          <span>{{ analysisResult.analysis.qualityBonus.topicBonus }}</span>
                        </div>
                        <div class="score-item total">
                          <span><strong>质量总加分:</strong></span>
                          <span><strong>{{ analysisResult.analysis.qualityBonus.total + analysisResult.analysis.newPostProtection.bonus }}</strong></span>
                        </div>
                      </div>
                    </div>

                    <!-- 互动质量加权 -->
                    <div class="score-section">
                      <h4>4. 互动质量加权</h4>
                      <div class="score-breakdown">
                        <div class="score-item">
                          <span>评论/点赞比:</span>
                          <span>{{ analysisResult.analysis.engagementQuality.commentLikeRatio }}</span>
                        </div>
                        <div class="score-item">
                          <span>质量乘数:</span>
                          <span>{{ analysisResult.analysis.engagementQuality.multiplier }}</span>
                        </div>
                        <div class="score-item">
                          <span>提升幅度:</span>
                          <span>{{ analysisResult.analysis.engagementQuality.impact }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- 多样性惩罚 -->
                    <div class="score-section">
                      <h4>5. 作者多样性</h4>
                      <div class="score-breakdown">
                        <div class="score-item">
                          <span>惩罚分数:</span>
                          <span>{{ analysisResult.analysis.authorDiversity.penalty }}</span>
                        </div>
                        <div class="score-item">
                          <span>说明:</span>
                          <span>{{ analysisResult.analysis.authorDiversity.explanation }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- 计算步骤 -->
                    <div class="score-section">
                      <h4>6. 计算步骤</h4>
                      <div class="calculation-steps">
                        <div class="step-item">① 基础分数: {{ analysisResult.analysis.calculationSteps.step1_baseScore }}</div>
                        <div class="step-item">② 时间衰减: {{ analysisResult.analysis.calculationSteps.step2_withTimeFactor }}</div>
                        <div class="step-item">③ 质量加分: {{ analysisResult.analysis.calculationSteps.step3_withBonus }}</div>
                        <div class="step-item">④ 质量加权: {{ analysisResult.analysis.calculationSteps.step4_withMultiplier }}</div>
                        <div class="step-item">⑤ 多样性惩罚: {{ analysisResult.analysis.calculationSteps.step5_withPenalty }}</div>
                        <div class="step-item final">⑥ 最终分数: {{ analysisResult.analysis.calculationSteps.step6_final }}</div>
                      </div>
                    </div>

                    <!-- 推荐结果 -->
                    <div class="score-section">
                      <h4>7. 推荐结果</h4>
                      <div class="result-summary">
                        <div class="result-item">
                          <span>推荐阈值:</span>
                          <span>{{ analysisResult.analysis.result.threshold }}</span>
                        </div>
                        <div class="result-item">
                          <span>最终分数:</span>
                          <span>{{ analysisResult.analysis.result.finalScore }}</span>
                        </div>
                        <div class="result-item">
                          <span>推荐状态:</span>
                          <el-tag :type="analysisResult.analysis.result.isRecommended ? 'success' : 'info'">
                            {{ analysisResult.analysis.result.isRecommended ? '✅ 推荐' : '❌ 不推荐' }}
                          </el-tag>
                        </div>
                      </div>
                    </div>
                  </el-card>
                </div>

                <!-- 无结果提示 -->
                <div v-if="!analysisResult && !analysisLoading" class="no-result">
                  <el-empty description="输入帖子ID并点击「分析分数」查看详细的推荐算法计算过程" />
                </div>
              </div>
              </el-card>
            </div>
          </div>
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

  <!-- 🆕 推荐算法使用说明对话框 -->
  <el-dialog
    v-model="showRecommendationGuide"
    title="📖 推荐算法配置使用说明"
    width="70%"
    :close-on-click-modal="false"
  >
    <div class="recommendation-guide">
      <el-tabs type="border-card">
        <el-tab-pane label="📊 基础权重配置" name="weights">
          <div class="guide-section">
            <h4>互动权重设置</h4>
            <el-alert
              title="权重越高，该互动类型对推荐分数的影响越大"
              type="info"
              :closable="false"
              style="margin-bottom: 15px;"
            />
            <el-table :data="weightGuideData" border style="margin-bottom: 20px;">
              <el-table-column prop="param" label="参数" width="120" />
              <el-table-column prop="description" label="说明" />
              <el-table-column prop="recommended" label="推荐值" width="100" />
              <el-table-column prop="effect" label="影响" />
            </el-table>
            
            <h4>时间衰减配置</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="时间衰减系数">
                控制内容热度的半衰期，数值越小新内容越容易被推荐。建议：7-14天
              </el-descriptions-item>
              <el-descriptions-item label="内容最大持续天数">
                超过此天数的内容将不会出现在推荐中。建议：30-60天
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="🎯 推荐阈值配置" name="thresholds">
          <div class="guide-section">
            <h4>分数阈值设置</h4>
            <el-alert
              title="只有达到相应阈值的内容才会被推荐"
              type="warning"
              :closable="false"
              style="margin-bottom: 15px;"
            />
            <el-table :data="thresholdGuideData" border style="margin-bottom: 20px;">
              <el-table-column prop="param" label="参数" width="150" />
              <el-table-column prop="description" label="说明" />
              <el-table-column prop="formula" label="计算公式" />
              <el-table-column prop="recommended" label="推荐值" width="100" />
            </el-table>
            
            <h4>管理员推荐配置</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="管理员推荐最大数量">
                首页最多显示的管理员手动推荐内容数量。建议：3-8个
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="⭐ 质量评估配置" name="quality">
          <div class="guide-section">
            <h4>内容质量加分</h4>
            <el-alert
              title="这些加分项会提升符合条件内容的推荐分数"
              type="success"
              :closable="false"
              style="margin-bottom: 15px;"
            />
            <el-table :data="qualityGuideData" border style="margin-bottom: 20px;">
              <el-table-column prop="param" label="参数" width="120" />
              <el-table-column prop="description" label="说明" />
              <el-table-column prop="condition" label="触发条件" />
              <el-table-column prop="recommended" label="推荐值" width="100" />
            </el-table>
            
            <h4>互动质量评估</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="互动质量因子">
                评论/点赞比例的权重，提升深度互动内容的推荐。建议：0.1-0.3
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="🎨 多样性控制" name="diversity">
          <div class="guide-section">
            <h4>内容多样性设置</h4>
            <el-alert
              title="避免推荐内容过于单一，提升用户体验"
              type="info"
              :closable="false"
              style="margin-bottom: 15px;"
            />
            <el-descriptions :column="1" border>
              <el-descriptions-item label="同作者最大占比">
                推荐列表中同一作者内容的最大占比。建议：0.2-0.4（20%-40%）
              </el-descriptions-item>
              <el-descriptions-item label="多样性统计时间窗口">
                计算作者发布频率的时间范围。建议：12-48小时
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="🔧 最佳实践" name="practices">
          <div class="guide-section">
            <h4>配置建议</h4>
            <el-steps direction="vertical" :active="4">
              <el-step title="第一步：设置基础权重" description="根据社区特点调整点赞、评论、收藏权重比例" />
              <el-step title="第二步：调整时间因子" description="根据内容更新频率设置时间衰减参数" />
              <el-step title="第三步：设定推荐阈值" description="避免推荐质量过低的内容" />
              <el-step title="第四步：启用质量加分" description="鼓励高质量内容创作" />
              <el-step title="第五步：开启自动更新" description="定期重新计算推荐分数" />
            </el-steps>

            <el-divider />

            <h4>常见场景配置</h4>
            <el-collapse>
              <el-collapse-item title="💬 讨论型社区（重视评论互动）" name="discussion">
                <div>
                  <p><strong>推荐配置：</strong></p>
                  <ul>
                    <li>点赞权重：1.5，评论权重：4.0，收藏权重：3.0</li>
                    <li>互动质量因子：0.3</li>
                    <li>时间衰减：7天</li>
                  </ul>
                </div>
              </el-collapse-item>
              <el-collapse-item title="📸 内容分享型社区（重视点赞收藏）" name="sharing">
                <div>
                  <p><strong>推荐配置：</strong></p>
                  <ul>
                    <li>点赞权重：3.0，评论权重：2.0，收藏权重：4.0</li>
                    <li>图片加分：5.0</li>
                    <li>时间衰减：14天</li>
                  </ul>
                </div>
              </el-collapse-item>
              <el-collapse-item title="📚 知识型社区（重视内容质量）" name="knowledge">
                <div>
                  <p><strong>推荐配置：</strong></p>
                  <ul>
                    <li>评论权重：3.5，收藏权重：4.0</li>
                    <li>长内容加分：3.0，话题标签加分：2.0</li>
                    <li>时间衰减：21天</li>
                  </ul>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showRecommendationGuide = false">关闭</el-button>
        <el-button type="primary" @click="showRecommendationGuide = false">我知道了</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Star, TrendCharts, Delete, Document, View, DataAnalysis, Timer, Refresh, Setting, Check, Download, Upload, Search, RefreshRight } from '@element-plus/icons-vue';
import api from '@/utils/api';

const activeTab = ref('basic');
const loading = ref(false);
const saving = ref(false);
const initLoading = ref(false);
const searchInitLoading = ref(false);
const clearCacheLoading = ref(false);
const testLoading = ref(false);
const statsLoading = ref(false);
const recalcLoading = ref(false);
const availableTopics = ref([]); // 话题列表数据
const settingsStatus = ref('');

// 🆕 自动更新控制 (v2.0)
const autoUpdateConfig = ref({
  enabled: false,
  strategy: 'incremental', // incremental, full, smart
  frequency: '1hour',      // 30min, 1hour, 2hour, 6hour, 12hour, 24hour
  nextUpdateTime: null
});

const autoUpdateStatus = ref({
  running: false,
  lastRun: null,
  lastError: null,
  taskId: null
});

// 🔍 帖子分数分析相关状态 🆕 v2.0
const analysisPostId = ref('');
const analysisLoading = ref(false);
const analysisResult = ref(null);

// 🆕 预设配置管理 (v2.0)
const presetConfigurations = ref([]);
const selectedPreset = ref('');
const presetLoading = ref(false);
const presetsLoading = ref(false);
const exportLoading = ref(false);
const importLoading = ref(false);
const configToImport = ref(null);
const showConfigPreview = ref(false);

// 🆕 推荐算法使用说明对话框
const showRecommendationGuide = ref(false);

// 使用说明数据
const weightGuideData = ref([
  {
    param: '点赞权重',
    description: '用户点赞对推荐分数的影响程度',
    recommended: '2.0',
    effect: '权重越高，受欢迎的内容越容易被推荐'
  },
  {
    param: '评论权重',
    description: '用户评论对推荐分数的影响程度',
    recommended: '3.0',
    effect: '权重越高，讨论度高的内容越容易被推荐'
  },
  {
    param: '收藏权重',
    description: '用户收藏对推荐分数的影响程度',
    recommended: '4.0',
    effect: '权重越高，有价值的内容越容易被推荐'
  },
  {
    param: '浏览权重',
    description: '浏览量对推荐分数的影响程度',
    recommended: '0.5',
    effect: '权重较低，避免仅因展示机会而获得高分'
  }
]);

const thresholdGuideData = ref([
  {
    param: '最低互动分数阈值',
    description: '内容获得推荐的最低互动要求',
    formula: '点赞×1 + 评论×2 + 收藏×3 + 浏览×0.1',
    recommended: '2-5'
  },
  {
    param: '推荐分数阈值',
    description: '内容被自动推荐的最低分数',
    formula: '根据权重计算的综合分数',
    recommended: '10-20'
  }
]);

const qualityGuideData = ref([
  {
    param: '新帖保护加分',
    description: '新发布内容的额外加分',
    condition: '发布时间 ≤ 24小时',
    recommended: '5.0'
  },
  {
    param: '图片内容加分',
    description: '包含图片的内容额外加分',
    condition: '帖子包含至少1张图片',
    recommended: '3.0'
  },
  {
    param: '长内容加分',
    description: '内容丰富的帖子额外加分',
    condition: '文字内容 > 100字',
    recommended: '2.0'
  },
  {
    param: '话题标签加分',
    description: '带有话题标签的内容加分',
    condition: '帖子包含话题标签',
    recommended: '1.0'
  }
]);

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
  maxHotTopics: 10,
  // 热门搜索设置
  hotSearchCount: 10,
  enableHotSearch: true,
  hotSearchSource: 'mixed',
  // 推荐内容设置
  recommendContentCount: 6,
  enableRecommendContent: true,
  recommendContentTypes: ['post', 'topic'],
  recommendStrategy: 'mixed'
});

// 推荐算法设置 v2.0
const recommendSettings = ref({
  // 🎯 基础算法权重
  likeWeight: 2.0,
  commentWeight: 3.0,
  collectionWeight: 4.0,
  viewWeight: 0.5,
  timeDecayDays: 10,
  maxAgeDays: 30,
  
  // 🎛️ 推荐策略配置
  scoreThreshold: 15.0,      // 推荐分数阈值
  maxAdminRecommended: 5,
  enableScoreSort: true,     // 启用分数排序
  minInteractionScore: 2,
  strategy: 'mixed',
  enableCache: true,
  cacheExpireMinutes: 15,
  
  // ⏰ 更新频率配置
  updateIntervalHours: 1,    // 分数更新间隔（小时）
  
  // 🆕 v2.0新增：质量评估参数
  newPostBonus: 5.0,         // 新帖保护加分
  imageBonus: 3.0,           // 有图片加分
  contentBonus: 2.0,         // 长内容加分
  topicBonus: 1.0,           // 有话题加分
  engagementFactor: 0.2,     // 互动质量因子
  
  // 🔄 多样性控制
  maxSameAuthorRatio: 0.3,   // 同一作者最大占比
  diversityPeriodHours: 24,  // 多样性检查周期
  
  // 搜索发现页面设置
  searchPageRecommendCount: 6,
  enableSearchPageRecommend: true,
  searchRecommendTypes: ['post', 'topic']
});

// 推荐算法统计 v2.0
const recommendStats = ref({
  totalPosts: 0,
  manualRecommended: 0,      // 管理员推荐数量
  autoRecommended: 0,        // 算法推荐数量
  totalRecommended: 0,       // 总推荐数量
  recommendationCoverage: 0, // 推荐覆盖率
  avgScore: 0,              // 平均分数
  maxScore: 0,              // 最高分数
  lastUpdateTime: null      // 最后更新时间
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
  enablePrivateMessage: true,
  readDelaySeconds: 5
});

// 计算属性
const selectedTopicIds = computed({
  get() {
    if (!searchSettings.value.featuredTopicIds) return []
    return searchSettings.value.featuredTopicIds
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id))
  },
  set(value) {
    searchSettings.value.featuredTopicIds = value.join(',')
  }
});

// 🆕 选中预设配置的详细信息
const selectedPresetInfo = computed(() => {
  if (!selectedPreset.value) return null;
  return presetConfigurations.value.find(preset => preset.id === selectedPreset.value);
});

// 初始化 - 从服务器获取设置
onMounted(async () => {
  await fetchSettings();
  await loadConfigVersion();
  await loadVersionHistory();
  await fetchTopics(); // 启用话题列表获取
  await loadRecommendationSettings(); // 加载推荐设置
  await loadRecommendStats(); // 加载推荐统计
  await loadAutoUpdateStatus(); // 🆕 加载自动更新状态
  await loadPresetConfigurations(); // 🆕 加载预设配置
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
      if (res.data.minInteractionScore) recommendSettings.value.minInteractionScore = parseFloat(res.data.minInteractionScore);
      
      // 解析用户设置
      if (res.data.enableRegister !== undefined) userSettings.value.enableRegister = res.data.enableRegister === 'true';
      if (res.data.requireUserAudit !== undefined) userSettings.value.requireUserAudit = res.data.requireUserAudit === 'true';
      if (res.data.defaultRole) userSettings.value.defaultRole = res.data.defaultRole;
      if (res.data.avatarSizeLimit) userSettings.value.avatarSizeLimit = parseInt(res.data.avatarSizeLimit);
      
      // 解析消息设置
      if (res.data.enablePrivateMessage !== undefined) messageSettings.value.enablePrivateMessage = res.data.enablePrivateMessage === 'true' || res.data.enablePrivateMessage === true;
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
      availableTopics.value = res.data.list.map(topic => ({
        key: topic.id,
        label: topic.name,
        description: topic.description,
        post_count: topic.post_count,
        view_count: topic.view_count,
        is_hot: topic.is_hot,
        status: topic.status
      }));
      console.log('话题列表加载成功:', availableTopics.value.length, '个话题');
    } else {
      ElMessage.error(res.message || '获取话题列表失败');
    }
  } catch (error) {
    console.error('获取话题列表错误:', error);
    ElMessage.error('获取话题列表失败，请稍后再试');
  }
};

// 选择热门话题
const selectHotTopics = () => {
  const hotTopics = availableTopics.value
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
      // 热门搜索设置
      hotSearchCount: String(searchSettings.value.hotSearchCount),
      enableHotSearch: String(searchSettings.value.enableHotSearch),
      hotSearchSource: searchSettings.value.hotSearchSource,
      // 推荐内容设置
      recommendContentCount: String(searchSettings.value.recommendContentCount),
      enableRecommendContent: String(searchSettings.value.enableRecommendContent),
      recommendContentTypes: JSON.stringify(searchSettings.value.recommendContentTypes),
      recommendStrategy: searchSettings.value.recommendStrategy,
      
      // 推荐算法设置现在通过独立API保存，这里不再包含
      
      // 用户设置
      enableRegister: String(userSettings.value.enableRegister),
      requireUserAudit: String(userSettings.value.requireUserAudit),
      defaultRole: userSettings.value.defaultRole,
      avatarSizeLimit: String(userSettings.value.avatarSizeLimit),
      
      // 消息设置
      enablePrivateMessage: String(messageSettings.value.enablePrivateMessage),
      readDelaySeconds: String(messageSettings.value.readDelaySeconds)
    };
    
    // 保存基础设置
    const res = await api.settings.update(allSettings);

    // 保存推荐算法设置
    const recommendRes = await api.recommendation.updateSettings(recommendSettings.value);

    if (res.success && (recommendRes.success || recommendRes.code === 0)) {
      settingsStatus.value = 'success';
      ElMessage.success('设置保存成功');
    } else {
      settingsStatus.value = 'error';
      const errorMsg = res.message || recommendRes.message || '保存设置失败';
      ElMessage.error(errorMsg);
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
      maxHotTopics: 10,
      // 热门搜索设置
      hotSearchCount: 10,
      enableHotSearch: true,
      hotSearchSource: 'mixed',
      // 推荐内容设置
      recommendContentCount: 6,
      enableRecommendContent: true,
      recommendContentTypes: ['post', 'topic'],
      recommendStrategy: 'mixed'
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
      enablePrivateMessage: true,
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
    const res = await api.recommendation.initSettings();
    if (res.success || res.code === 0) {
      ElMessage.success('推荐设置已初始化');
      await loadRecommendationSettings(); // 重新加载推荐设置
      await loadRecommendStats(); // 加载统计信息
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

// 清除推荐缓存
const clearRecommendCache = async () => {
  clearCacheLoading.value = true;
  try {
    const res = await api.recommendation.clearCache();
    if (res.success || res.code === 0) {
      ElMessage.success('推荐缓存已清除');
    } else {
      ElMessage.error(res.message || '清除缓存失败');
    }
  } catch (error) {
    console.error('清除推荐缓存错误:', error);
    ElMessage.error('清除缓存失败，请稍后再试');
  } finally {
    clearCacheLoading.value = false;
  }
};

// 测试推荐算法
const testRecommendAlgorithm = async () => {
  testLoading.value = true;
  try {
    const res = await api.recommendation.test({
      strategy: recommendSettings.value.strategy,
      pageSize: 10
    });
    if (res.success || res.code === 0) {
      ElMessage.success('推荐算法测试完成，请查看控制台输出');
      console.log('推荐算法测试结果:', res.data);
    } else {
      ElMessage.error(res.message || '测试失败');
    }
  } catch (error) {
    console.error('测试推荐算法错误:', error);
    ElMessage.error('测试失败，请稍后再试');
  } finally {
    testLoading.value = false;
  }
};

// 加载推荐统计信息
const loadRecommendStats = async () => {
  statsLoading.value = true;
  try {
    const res = await api.recommendation.getStats();
    if (res.success || res.code === 0) {
      recommendStats.value = res.data;
    } else {
      ElMessage.error(res.message || '获取统计信息失败');
    }
  } catch (error) {
    console.error('获取推荐统计错误:', error);
    ElMessage.error('获取统计信息失败，请稍后再试');
  } finally {
    statsLoading.value = false;
  }
};

// 🆕 重新计算推荐分数
const recalculateScores = async () => {
  console.log('🎯 开始执行重新计算分数操作...');
  recalcLoading.value = true;
  
  try {
    console.log('📡 正在调用后端重新计算API...');
    const startTime = Date.now();
    
    const res = await api.recommendation.recalculate();
    const duration = Date.now() - startTime;
    
    console.log('📨 后端API响应:', {
      duration: `${duration}ms`,
      success: res.success,
      code: res.code,
      message: res.message,
      data: res.data
    });
    
    if (res.success || res.code === 0) {
      ElMessage.success(`推荐分数重新计算已触发 (${duration}ms)`);
      
      // 🔧 修复：增加延迟时间并添加多次检查
      const checkAndRefresh = async (attempt = 1) => {
        console.log(`🔍 开始第${attempt}次统计数据检查...`);
        
        if (attempt > 3) {
          console.log('⏰ 已完成3次检查，停止自动刷新');
          ElMessage.info('计算完成，请手动点击"刷新统计"查看最新结果');
          return;
        }
        
        setTimeout(async () => {
          try {
            console.log(`📊 第${attempt}次刷新统计数据...`);
            const statsStartTime = Date.now();
            
            await loadRecommendStats();
            
            const statsDuration = Date.now() - statsStartTime;
            console.log(`✅ 第${attempt}次统计刷新完成 (${statsDuration}ms)`);
            
            if (attempt === 1) {
              ElMessage.success('第一次刷新完成，如数据未更新将继续检查...');
            }
          } catch (error) {
            console.error(`❌ 第${attempt}次刷新失败:`, error);
          }
          
          // 继续下一次检查
          if (attempt < 3) {
            checkAndRefresh(attempt + 1);
          }
        }, attempt * 3000); // 3秒、6秒、9秒后分别检查
      };
      
      checkAndRefresh();
    } else {
      console.error('❌ 重新计算API返回失败:', res);
      ElMessage.error(res.message || '触发重新计算失败');
    }
  } catch (error) {
    console.error('❌ 重新计算推荐分数网络错误:', error);
    ElMessage.error(`操作失败: ${error.message || '网络异常'}`);
  } finally {
    recalcLoading.value = false;
    console.log('🏁 重新计算分数操作结束');
  }
};

// 🔍 帖子分数分析方法 🆕 v2.0
const analyzePost = async () => {
  if (!analysisPostId.value) {
    ElMessage.warning('请输入帖子ID');
    return;
  }

  analysisLoading.value = true;
  try {
    console.log('🔍 开始分析帖子分数:', analysisPostId.value);
    const res = await api.recommendation.analyzePost(analysisPostId.value);
    
    if (res.success || res.code === 0) {
      analysisResult.value = res.data || res;
      ElMessage.success('帖子分数分析完成');
      console.log('📊 分析结果:', analysisResult.value);
    } else {
      ElMessage.error(res.message || '分析失败');
      console.error('❌ 分析失败:', res);
    }
  } catch (error) {
    console.error('❌ 分析帖子分数失败:', error);
    ElMessage.error(`分析失败: ${error.message || '网络异常'}`);
  } finally {
    analysisLoading.value = false;
  }
};

const clearAnalysis = () => {
  analysisResult.value = null;
  analysisPostId.value = '';
  ElMessage.info('分析结果已清空');
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '未知';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 🆕 自动更新控制方法 (v2.0)
const handleAutoUpdateToggle = async (enabled) => {
  try {
    if (enabled) {
      await startAutoUpdate();
      ElMessage.success('自动更新已启用');
    } else {
      await stopAutoUpdate();
      ElMessage.success('自动更新已停用');
    }
    await loadAutoUpdateStatus();
  } catch (error) {
    console.error('切换自动更新状态失败:', error);
    ElMessage.error('操作失败，请稍后再试');
    // 回滚状态
    autoUpdateConfig.value.enabled = !enabled;
  }
};

const startAutoUpdate = async () => {
  const res = await api.recommendation.startAutoUpdate({
    strategy: autoUpdateConfig.value.strategy,
    frequency: autoUpdateConfig.value.frequency
  });
  if (!res.success && res.code !== 0) {
    throw new Error(res.message || '启动自动更新失败');
  }
  return res;
};

const stopAutoUpdate = async () => {
  const res = await api.recommendation.stopAutoUpdate();
  if (!res.success && res.code !== 0) {
    throw new Error(res.message || '停止自动更新失败');
  }
  return res;
};

// 🆕 处理策略变化
const onStrategyChange = async (newStrategy) => {
  if (!autoUpdateConfig.value.enabled) return;
  
  console.log('🔄 策略变化:', newStrategy);
  try {
    await updateAutoUpdateConfig();
    ElMessage.success(`更新策略已切换为: ${getStrategyDisplayName(newStrategy)}`);
  } catch (error) {
    console.error('更新策略失败:', error);
    ElMessage.error('策略更新失败，请稍后再试');
  }
};

// 🆕 处理频率变化  
const onFrequencyChange = async (newFrequency) => {
  if (!autoUpdateConfig.value.enabled) return;
  
  console.log('⏰ 频率变化:', newFrequency);
  try {
    await updateAutoUpdateConfig();
    ElMessage.success(`更新频率已切换为: ${getFrequencyDisplayName(newFrequency)}`);
  } catch (error) {
    console.error('更新频率失败:', error);
    ElMessage.error('频率更新失败，请稍后再试');
  }
};

// 🆕 更新自动更新配置
const updateAutoUpdateConfig = async () => {
  // 先停止再启动，确保使用新配置
  await stopAutoUpdate();
  await startAutoUpdate();
  await loadAutoUpdateStatus();
};

// 🆕 获取策略显示名称
const getStrategyDisplayName = (strategy) => {
  const map = {
    'incremental': '增量更新',
    'full': '全量更新', 
    'smart': '智能更新'
  };
  return map[strategy] || strategy;
};

// 🆕 获取频率显示名称
const getFrequencyDisplayName = (frequency) => {
  const map = {
    '10sec': '每10秒',
    '30min': '每30分钟',
    '1hour': '每1小时',
    '2hour': '每2小时', 
    '6hour': '每6小时',
    '12hour': '每12小时',
    '24hour': '每24小时'
  };
  return map[frequency] || frequency;
};

const loadAutoUpdateStatus = async () => {
  try {
    const res = await api.recommendation.getAutoUpdateStatus();
    if (res.success || res.code === 0) {
      const data = res.data || res;
      autoUpdateConfig.value.enabled = data.enabled || false;
      autoUpdateConfig.value.strategy = data.strategy || 'incremental';
      autoUpdateConfig.value.frequency = data.frequency || '1hour';
      autoUpdateConfig.value.nextUpdateTime = data.nextUpdateTime;
      
      autoUpdateStatus.value = {
        running: data.running || false,
        lastRun: data.lastRun,
        lastError: data.lastError,
        taskId: data.taskId
      };
    }
  } catch (error) {
    console.error('加载自动更新状态失败:', error);
  }
};

const getNextUpdateStatus = () => {
  if (!autoUpdateConfig.value.nextUpdateTime) return 'info';
  const nextTime = new Date(autoUpdateConfig.value.nextUpdateTime);
  const now = new Date();
  const diff = nextTime - now;
  
  if (diff < 0) return 'danger'; // 过期
  if (diff < 30 * 60 * 1000) return 'warning'; // 30分钟内
  return 'success'; // 正常
};

const formatNextUpdateTime = () => {
  if (!autoUpdateConfig.value.nextUpdateTime) return '未设置';
  
  const nextTime = new Date(autoUpdateConfig.value.nextUpdateTime);
  const now = new Date();
  const diff = nextTime - now;
  
  if (diff < 0) return '已过期，等待执行';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟后`;
  } else {
    return `${minutes}分钟后`;
  }
};

// 🆕 格式化更新时间
const formatUpdateTime = (timestamp) => {
  if (!timestamp) return '未知';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) { // 小于1分钟
    return '刚刚';
  } else if (diff < 3600000) { // 小于1小时
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) { // 小于1天
    return `${Math.floor(diff / 3600000)}小时前`;
  } else {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
};

// 加载推荐设置
const loadRecommendationSettings = async () => {
  try {
    const res = await api.recommendation.getSettings();
    if (res.success || res.code === 0) {
      Object.assign(recommendSettings.value, res.data);
    }
  } catch (error) {
    console.error('加载推荐设置错误:', error);
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

// 🆕 统计仪表盘计算方法
const getRecommendationPercentage = () => {
  const total = Number(recommendStats.value.totalPosts) || 0;
  const recommended = Number(recommendStats.value.totalRecommended) || 0;
  if (total === 0) return 0;
  return Math.min((recommended / total) * 100, 100);
};

const getCoverageClass = () => {
  const coverage = Number(recommendStats.value.recommendationCoverage) || 0;
  if (coverage >= 20) return 'trend-excellent';
  if (coverage >= 10) return 'trend-good';
  if (coverage >= 5) return 'trend-normal';
  return 'trend-low';
};

const getCoverageTrend = () => {
  const coverage = Number(recommendStats.value.recommendationCoverage) || 0;
  if (coverage >= 20) return '优秀 📈';
  if (coverage >= 10) return '良好 📊';
  if (coverage >= 5) return '正常 📉';
  return '偏低 📊';
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

// 🆕 预设配置管理方法 (v2.0)
// 加载预设配置列表
const loadPresetConfigurations = async () => {
  presetsLoading.value = true;
  try {
    const res = await api.recommendation.getPresets();
    if (res.success || res.code === 0) {
      presetConfigurations.value = res.data;
    }
  } catch (error) {
    console.error('加载预设配置失败:', error);
    ElMessage.error('加载预设配置失败');
  } finally {
    presetsLoading.value = false;
  }
};

// 应用预设配置
const applyPresetConfig = async () => {
  if (!selectedPreset.value) return;
  
  presetLoading.value = true;
  try {
    const preset = presetConfigurations.value.find(p => p.id === selectedPreset.value);
    
    // 确认对话框
    await ElMessageBox.confirm(
      `确定要应用"${preset.name}"配置吗？\n\n${preset.description}\n\n此操作会覆盖当前设置。`,
      '确认应用预设配置',
      {
        confirmButtonText: '确定应用',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const res = await api.recommendation.applyPreset(selectedPreset.value);
    if (res.success || res.code === 0) {
      ElMessage.success(`${preset.name}配置已应用`);
      // 重新加载推荐设置和统计
      await loadRecommendationSettings();
      await loadRecommendStats();
      selectedPreset.value = ''; // 清空选择
    } else {
      ElMessage.error(res.message || '应用预设配置失败');
    }
  } catch (error) {
    if (error === 'cancel') return; // 用户取消
    console.error('应用预设配置失败:', error);
    ElMessage.error('应用预设配置失败');
  } finally {
    presetLoading.value = false;
  }
};

// 导出当前配置
const exportConfiguration = async () => {
  exportLoading.value = true;
  try {
    const res = await api.recommendation.exportConfig();
    if (res.success || res.code === 0) {
      // 创建下载链接
      const configJson = JSON.stringify(res.data, null, 2);
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // 创建下载元素
      const a = document.createElement('a');
      a.href = url;
      a.download = `recommendation-config-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      ElMessage.success('配置导出成功');
    } else {
      ElMessage.error('导出配置失败');
    }
  } catch (error) {
    console.error('导出配置失败:', error);
    ElMessage.error('导出配置失败');
  } finally {
    exportLoading.value = false;
  }
};

// 处理配置文件上传
const handleConfigFileChange = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const configData = JSON.parse(e.target.result);
      
      // 基本验证
      if (!configData.settings) {
        ElMessage.error('无效的配置文件：缺少settings字段');
        return;
      }
      
      configToImport.value = configData;
      ElMessage.success('配置文件加载成功，可以预览或导入');
    } catch (error) {
      console.error('解析配置文件失败:', error);
      ElMessage.error('配置文件格式错误');
    }
  };
  reader.readAsText(file.raw);
};

// 导入配置
const importConfiguration = async () => {
  if (!configToImport.value) {
    ElMessage.warning('请先选择配置文件');
    return;
  }
  
  importLoading.value = true;
  try {
    // 确认对话框
    await ElMessageBox.confirm(
      `确定要导入"${configToImport.value.name}"配置吗？\n\n此操作会覆盖当前设置。`,
      '确认导入配置',
      {
        confirmButtonText: '确定导入',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const res = await api.recommendation.importConfig(configToImport.value);
    if (res.success || res.code === 0) {
      ElMessage.success('配置导入成功');
      // 重新加载推荐设置和统计
      await loadRecommendationSettings();
      await loadRecommendStats();
      configToImport.value = null; // 清空
    } else {
      ElMessage.error(res.message || '导入配置失败');
    }
  } catch (error) {
    if (error === 'cancel') return; // 用户取消
    console.error('导入配置失败:', error);
    ElMessage.error('导入配置失败');
  } finally {
    importLoading.value = false;
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

/* 推荐话题管理样式 */
.featured-topics-section {
  background: #fafbfc;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e4e7ed;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e4e7ed;
}

.header-info {
  flex: 1;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.section-desc {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.header-stats {
  flex-shrink: 0;
}

.quick-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.topic-summary {
  color: #909399;
  font-size: 13px;
}

.transfer-container {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  margin-bottom: 20px;
}

.topic-transfer {
  width: 100%;

  :deep(.el-transfer-panel) {
    width: 360px;
    height: 500px;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
  }

  :deep(.el-transfer-panel__header) {
    background: #f8f9fa;
    border-bottom: 1px solid #e4e7ed;
    padding: 12px 16px;
    font-weight: 600;
  }

  :deep(.el-transfer-panel__body) {
    height: 420px;
  }

  :deep(.el-transfer-panel__list) {
    height: 370px;
    overflow-y: auto;
  }

  :deep(.el-transfer-panel__item) {
    height: auto;
    min-height: 52px;
    padding: 0;
    border-bottom: 1px solid #f0f2f5;

    &:hover {
      background: #f8f9fa;
    }
  }

  :deep(.el-checkbox) {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 8px 16px;
    align-items: flex-start;
    display: flex;

    .el-checkbox__input {
      margin-top: 1px;
      flex-shrink: 0;
    }
  }

  :deep(.el-checkbox__label) {
    width: 100%;
    padding-left: 10px;
    line-height: 1.1;
    display: flex;
    flex-direction: column;
    min-height: 36px;
  }
}

.topic-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 36px;
  gap: 2px;

  .topic-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    flex-shrink: 0;
  }

  .topic-name {
    font-weight: 600;
    color: #303133;
    font-size: 14px;
    line-height: 1.2;
    flex: 1;
    word-break: break-word;
    margin: 0;
    padding: 0;
  }

  .topic-metrics {
    display: flex;
    gap: 14px;
    flex-shrink: 0;

    .metric {
      display: flex;
      align-items: center;
      gap: 3px;
      color: #909399;
      font-size: 11px;
      line-height: 1.1;
      white-space: nowrap;

      .el-icon {
        font-size: 11px;
        flex-shrink: 0;
      }
    }
  }
}

.section-footer {
  .tips-content {
    p {
      margin: 4px 0;
      color: #606266;
      font-size: 13px;
      line-height: 1.5;
    }
  }
}

.featured-topics-hint {
  margin-top: 15px;

  .weight-hint {
    margin-left: 0;
  }
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

/* 🆕 推荐算法仪表盘样式 */
.recommendation-dashboard {
  margin: 20px 0;
}

.dashboard-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.dashboard-row.secondary {
  margin-bottom: 15px;
}

/* 核心指标卡片 */
.metric-card {
  flex: 1;
  min-width: 200px;
  padding: 20px;
  border-radius: 12px;
  background: white;
  border: 2px solid #e4e7ed;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.metric-card.primary {
  border-color: #409eff;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
}

.metric-card.success {
  border-color: #67c23a;
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
}

.metric-card.warning {
  border-color: #e6a23c;
  background: linear-gradient(135deg, #e6a23c 0%, #f56c6c 100%);
  color: white;
}

.metric-icon {
  font-size: 36px;
  opacity: 0.9;
  flex-shrink: 0;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 32px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 5px;
}

.metric-label {
  font-size: 14px;
  opacity: 0.9;
  font-weight: 500;
}

.metric-progress {
  margin-top: 8px;
}

.metric-trend {
  font-size: 12px;
  margin-top: 5px;
  font-weight: 500;
}

.trend-excellent { color: #85ce61; }
.trend-good { color: #95d475; }
.trend-normal { color: #e6a23c; }
.trend-low { color: #f56c6c; }

/* 详细统计卡片 */
.detail-card {
  flex: 1;
  min-width: 160px;
  padding: 16px;
  border-radius: 8px;
  background: white;
  border: 1px solid #e4e7ed;
  text-align: center;
  transition: all 0.3s ease;
}

.detail-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.detail-header .el-icon {
  color: #409eff;
}

.detail-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.detail-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

/* 状态信息栏 */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.status-item .el-icon {
  color: #909399;
}

.status-label {
  font-weight: 500;
}

.status-value {
  color: #303133;
  font-weight: 600;
}

.status-actions {
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .metric-card {
    min-width: 160px;
  }
  
  .detail-card {
    min-width: 140px;
  }
}

@media (max-width: 768px) {
  .dashboard-row {
    flex-direction: column;
  }
  
  .metric-card {
    min-width: auto;
  }
  
  .detail-card {
    min-width: auto;
  }
  
  .status-bar {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}

/* 🆕 预设配置管理样式 */
.preset-config-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.preset-description {
  margin-top: 10px;
}

.config-import-export {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

/* 预设配置下拉选项样式 */
.el-select .el-option {
  padding: 12px 20px;
  line-height: 1.4;
}

.el-select .el-option span:first-child {
  font-weight: 600;
  color: #303133;
}

.el-select .el-option span:last-child {
  color: #8492a6;
  font-size: 12px;
  margin-top: 2px;
}

/* 配置预览对话框样式 */
.config-preview {
  max-height: 400px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
}

/* 🆕 推荐算法说明对话框样式 */
.recommendation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-actions {
  flex-shrink: 0;
  margin-left: 20px;
}

.recommendation-guide {
  .guide-section {
    padding: 0 20px 20px;
  }

  h4 {
    color: #303133;
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 15px 0;
  }

  .el-table {
    font-size: 13px;
  }

  .el-descriptions {
    .el-descriptions__label {
      font-weight: 600;
      color: #606266;
    }
  }

  .el-steps {
    margin: 20px 0;
  }

  .el-collapse {
    border-top: none;
    
    .el-collapse-item {
      border-bottom: 1px solid #ebeef5;
      
      &:last-child {
        border-bottom: none;
      }
    }
    
    .el-collapse-item__header {
      font-weight: 600;
      color: #303133;
    }
    
    .el-collapse-item__content {
      color: #606266;
      line-height: 1.6;
      
      ul {
        margin: 10px 0;
        padding-left: 20px;
        
        li {
          margin: 5px 0;
        }
      }
    }
  }
}

.dialog-footer {
  text-align: right;
}

.auto-update-status {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

/* 推荐算法页面左右两栏布局 */
.recommendation-layout {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.config-column {
  flex: 1;
  min-width: 0; /* 防止 flex 项目溢出 */
}

.analysis-column {
  flex: 0 0 500px; /* 固定宽度500px */
  min-width: 450px;
}

.analysis-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  height: fit-content;
  position: sticky;
  top: 20px; /* 粘性定位，滚动时保持可见 */
}

.analysis-card .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .analysis-column {
    flex: 0 0 450px;
    min-width: 400px;
  }
}

@media (max-width: 1200px) {
  .recommendation-layout {
    flex-direction: column;
  }
  
  .analysis-column {
    flex: 1;
    min-width: auto;
  }
  
  .analysis-card {
    position: static; /* 移除粘性定位 */
  }
}

/* 🔍 帖子分数分析样式 */
.post-analysis-section {
  margin-top: 0; /* 在卡片内部，不需要顶部margin */
  padding: 0; /* 移除内边距 */
}

.analysis-query {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.analysis-result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-info-card,
.score-breakdown-card {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.post-basic-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-label {
  font-weight: 600;
  color: #606266;
  min-width: 80px;
  flex-shrink: 0;
}

.info-value {
  color: #303133;
  flex: 1;
}

.score-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.score-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.score-section h4 {
  color: #303133;
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.score-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 13px;
}

.score-item.total {
  background: #e1f3f8;
  border-left: 3px solid #409eff;
  font-weight: 600;
}

.calculation-steps {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.step-item {
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
}

.step-item.final {
  background: #f0f9ff;
  border-left: 3px solid #67c23a;
  font-weight: 600;
  color: #67c23a;
}

.result-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.no-result {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 900px) {
  .analysis-query {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .analysis-query .el-input {
    width: 100% !important;
    margin-right: 0 !important;
    margin-bottom: 10px;
  }
}

@media (max-width: 768px) {
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .info-label {
    min-width: auto;
  }
  
  .score-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .result-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style> 