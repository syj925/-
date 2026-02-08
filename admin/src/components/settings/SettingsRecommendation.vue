<template>
  <div class="recommendation-container">
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
        <el-form :model="form" label-width="180px">

      <el-form-item label="点赞权重">
        <el-input-number 
          v-model="form.likeWeight" 
          :min="0" 
          :max="10" 
          :step="0.1" 
          :precision="1"
        />
        <span class="weight-hint">较高的权重将使点赞数对推荐结果影响更大</span>
      </el-form-item>

      <el-form-item label="评论权重">
        <el-input-number 
          v-model="form.commentWeight" 
          :min="0" 
          :max="10" 
          :step="0.1" 
          :precision="1"
        />
        <span class="weight-hint">较高的权重将使评论数对推荐结果影响更大</span>
      </el-form-item>

      <el-form-item label="收藏权重">
        <el-input-number 
          v-model="form.collectionWeight" 
          :min="0" 
          :max="10" 
          :step="0.1" 
          :precision="1"
        />
        <span class="weight-hint">较高的权重将使收藏数对推荐结果影响更大</span>
      </el-form-item>

      <el-form-item label="浏览量权重">
        <el-input-number 
          v-model="form.viewWeight" 
          :min="0" 
          :max="10" 
          :step="0.1" 
          :precision="1"
        />
        <span class="weight-hint">较高的权重将使浏览量对推荐结果影响更大</span>
      </el-form-item>

      <el-form-item label="时间衰减系数(天)">
        <el-input-number 
          v-model="form.timeDecayDays" 
          :min="1" 
          :max="30"
          :step="1"
        />
        <span class="weight-hint">内容热度的半衰期，数值越小衰减越快，新内容更容易被推荐</span>
      </el-form-item>

      <el-form-item label="内容最大持续天数">
        <el-input-number 
          v-model="form.maxAgeDays" 
          :min="7" 
          :max="90"
          :step="1"
        />
        <span class="weight-hint">超过此天数的内容将不会出现在推荐中</span>
      </el-form-item>

      <el-form-item label="管理员推荐最大数量">
        <el-input-number
          v-model="form.maxAdminRecommended"
          :min="1"
          :max="20"
          :step="1"
        />
        <span class="weight-hint">首页最多显示的管理员手动推荐内容数量</span>
      </el-form-item>

      <el-form-item label="最低互动分数阈值">
        <el-input-number
          v-model="form.minInteractionScore"
          :min="0"
          :max="20"
          :step="0.5"
          :precision="1"
        />
        <span class="weight-hint">只有互动分数达到此阈值的内容才会被算法推荐（点赞×1 + 评论×2 + 收藏×3 + 浏览×0.1）</span>
      </el-form-item>

      <el-form-item label="推荐分数阈值">
        <el-input-number
          v-model="form.scoreThreshold"
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
          v-model="form.newPostBonus"
          :min="0"
          :max="20"
          :step="0.5"
          :precision="1"
        />
        <span class="weight-hint">24小时内的新帖子额外加分，避免被埋没</span>
      </el-form-item>

      <el-form-item label="图片内容加分">
        <el-input-number
          v-model="form.imageBonus"
          :min="0"
          :max="10"
          :step="0.5"
          :precision="1"
        />
        <span class="weight-hint">包含图片的帖子额外加分</span>
      </el-form-item>

      <el-form-item label="长文内容加分">
        <el-input-number
          v-model="form.contentBonus"
          :min="0"
          :max="10"
          :step="0.5"
          :precision="1"
        />
        <span class="weight-hint">长文内容（>100字）额外加分</span>
      </el-form-item>

      <el-form-item label="话题标签加分">
        <el-input-number
          v-model="form.topicBonus"
          :min="0"
          :max="5"
          :step="0.1"
          :precision="1"
        />
        <span class="weight-hint">包含话题标签的帖子额外加分</span>
      </el-form-item>

      <el-form-item label="互动质量因子">
        <el-input-number
          v-model="form.engagementFactor"
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
          v-model="form.maxSameAuthorRatio"
          :min="0.1"
          :max="1"
          :step="0.1"
          :precision="2"
        />
        <span class="weight-hint">防止同一作者霸榜，值越小多样性越高</span>
      </el-form-item>

      <el-form-item label="多样性检查周期(小时)">
        <el-input-number
          v-model="form.diversityPeriodHours"
          :min="1"
          :max="72"
          :step="1"
        />
        <span class="weight-hint">多样性统计的时间窗口</span>
      </el-form-item>

      <el-form-item label="分数更新间隔(小时)">
        <el-input-number
          v-model="form.updateIntervalHours"
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
          v-model="form.searchPageRecommendCount"
          :min="3"
          :max="20"
          :step="1"
        />
        <span class="weight-hint">搜索发现页面"推荐内容"区域显示的内容数量</span>
      </el-form-item>

      <el-form-item label="启用搜索页推荐">
        <el-switch
          v-model="form.enableSearchPageRecommend"
          active-text="启用"
          inactive-text="禁用"
        />
        <span class="weight-hint">是否在搜索发现页面显示推荐内容区域</span>
      </el-form-item>

      <el-form-item label="推荐内容类型">
        <el-checkbox-group v-model="form.searchRecommendTypes">
          <el-checkbox value="post">帖子</el-checkbox>
          <el-checkbox value="topic">话题</el-checkbox>
          <el-checkbox value="user">用户</el-checkbox>
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
              placeholder="输入完整的帖子ID"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Star, TrendCharts, Delete, Document, View, DataAnalysis, Timer, Refresh, Setting, Check, Download, Upload, Search, RefreshRight } from '@element-plus/icons-vue';
import api from '@/utils/api';

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

// Internal State
const initLoading = ref(false);
const clearCacheLoading = ref(false);
const testLoading = ref(false);
const statsLoading = ref(false);
const recalcLoading = ref(false);
const presetLoading = ref(false);
const presetsLoading = ref(false);
const exportLoading = ref(false);
const importLoading = ref(false);
const configToImport = ref(null);
const showConfigPreview = ref(false);
const showRecommendationGuide = ref(false);
const analysisPostId = ref('');
const analysisLoading = ref(false);
const analysisResult = ref(null);
const selectedPreset = ref('');
const presetConfigurations = ref([]);

const recommendStats = ref({
  totalPosts: 0,
  manualRecommended: 0,
  autoRecommended: 0,
  totalRecommended: 0,
  recommendationCoverage: 0,
  avgScore: 0,
  maxScore: 0,
  lastUpdateTime: null
});

const autoUpdateConfig = ref({
  enabled: false,
  strategy: 'incremental',
  frequency: '1hour',
  nextUpdateTime: null
});

const autoUpdateStatus = ref({
  running: false,
  lastRun: null,
  lastError: null,
  taskId: null
});

// Guide Data
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

// Computed
const selectedPresetInfo = computed(() => {
  if (!selectedPreset.value) return null;
  return presetConfigurations.value.find(preset => preset.id === selectedPreset.value);
});

// Methods
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

const initRecommendSettings = async () => {
  initLoading.value = true;
  try {
    const res = await api.recommendation.initSettings();
    if (res.success || res.code === 0) {
      ElMessage.success('推荐设置已初始化');
      emit('update:modelValue', { ...form.value, ...res.data }); // Update form
      await loadRecommendStats();
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

const testRecommendAlgorithm = async () => {
  testLoading.value = true;
  try {
    const res = await api.recommendation.test({
      strategy: form.value.strategy,
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

const recalculateScores = async () => {
  recalcLoading.value = true;
  try {
    const res = await api.recommendation.recalculate();
    if (res.success || res.code === 0) {
      ElMessage.success('推荐分数重新计算已触发');
      
      const checkAndRefresh = async (attempt = 1) => {
        if (attempt > 3) {
          ElMessage.info('计算完成，请手动点击"刷新统计"查看最新结果');
          return;
        }
        setTimeout(async () => {
          try {
            await loadRecommendStats();
            if (attempt === 1) {
              ElMessage.success('第一次刷新完成，如数据未更新将继续检查...');
            }
          } catch (error) {
            console.error(`第${attempt}次刷新失败:`, error);
          }
          if (attempt < 3) checkAndRefresh(attempt + 1);
        }, attempt * 3000);
      };
      
      checkAndRefresh();
    } else {
      ElMessage.error(res.message || '触发重新计算失败');
    }
  } catch (error) {
    console.error('重新计算推荐分数网络错误:', error);
    ElMessage.error(`操作失败: ${error.message || '网络异常'}`);
  } finally {
    recalcLoading.value = false;
  }
};

const analyzePost = async () => {
  if (!analysisPostId.value) {
    ElMessage.warning('请输入帖子ID');
    return;
  }
  analysisLoading.value = true;
  try {
    const res = await api.recommendation.analyzePost(analysisPostId.value);
    if (res.success || res.code === 0) {
      analysisResult.value = res.data || res;
      ElMessage.success('帖子分数分析完成');
    } else {
      ElMessage.error(res.message || '分析失败');
    }
  } catch (error) {
    console.error('分析帖子分数失败:', error);
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

const onStrategyChange = async (newStrategy) => {
  if (!autoUpdateConfig.value.enabled) return;
  try {
    await updateAutoUpdateConfig();
    ElMessage.success('更新策略已切换');
  } catch (error) {
    console.error('更新策略失败:', error);
    ElMessage.error('策略更新失败，请稍后再试');
  }
};

const onFrequencyChange = async (newFrequency) => {
  if (!autoUpdateConfig.value.enabled) return;
  try {
    await updateAutoUpdateConfig();
    ElMessage.success('更新频率已切换');
  } catch (error) {
    console.error('更新频率失败:', error);
    ElMessage.error('频率更新失败，请稍后再试');
  }
};

const updateAutoUpdateConfig = async () => {
  await stopAutoUpdate();
  await startAutoUpdate();
  await loadAutoUpdateStatus();
};

const applyPresetConfig = async () => {
  if (!selectedPreset.value) return;
  presetLoading.value = true;
  try {
    const preset = presetConfigurations.value.find(p => p.id === selectedPreset.value);
    await ElMessageBox.confirm(
      `确定要应用"${preset.name}"配置吗？\n\n${preset.description}\n\n此操作会覆盖当前设置。`,
      '确认应用预设配置',
      { confirmButtonText: '确定应用', cancelButtonText: '取消', type: 'warning' }
    );
    
    const res = await api.recommendation.applyPreset(selectedPreset.value);
    if (res.success || res.code === 0) {
      ElMessage.success(`${preset.name}配置已应用`);
      // Reload everything
      const settingsRes = await api.recommendation.getSettings();
      if (settingsRes.success || settingsRes.code === 0) {
        emit('update:modelValue', { ...form.value, ...settingsRes.data });
      }
      await loadRecommendStats();
      selectedPreset.value = '';
    } else {
      ElMessage.error(res.message || '应用预设配置失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('应用预设配置失败:', error);
      ElMessage.error('应用预设配置失败');
    }
  } finally {
    presetLoading.value = false;
  }
};

const exportConfiguration = async () => {
  exportLoading.value = true;
  try {
    const res = await api.recommendation.exportConfig();
    if (res.success || res.code === 0) {
      const configJson = JSON.stringify(res.data, null, 2);
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
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

const handleConfigFileChange = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const configData = JSON.parse(e.target.result);
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

// Utils
const formatDateTime = (dateStr) => {
  if (!dateStr) return '未知';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

const formatUpdateTime = (timeStr) => {
  if (!timeStr) return '未知';
  const date = new Date(timeStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '未知';
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

const formatNextUpdateTime = () => {
  if (!autoUpdateConfig.value.nextUpdateTime) return '未设置';
  const nextTime = new Date(autoUpdateConfig.value.nextUpdateTime);
  const now = new Date();
  const diff = nextTime - now;
  if (diff < 0) return '已过期，等待执行';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}小时${minutes}分钟后`;
  return `${minutes}分钟后`;
};

const getNextUpdateStatus = () => {
  if (!autoUpdateConfig.value.nextUpdateTime) return 'info';
  const nextTime = new Date(autoUpdateConfig.value.nextUpdateTime);
  const now = new Date();
  const diff = nextTime - now;
  if (diff < 0) return 'danger';
  if (diff < 30 * 60 * 1000) return 'warning';
  return 'success';
};

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

onMounted(() => {
  loadRecommendStats();
  loadAutoUpdateStatus();
  loadPresetConfigurations();
});
</script>

<style scoped>
/* Copied styles from Settings.vue */
.recommendation-container {
  padding: 0;
}
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
.weight-hint {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
.recommendation-layout {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}
.config-column {
  flex: 1;
  min-width: 0;
}
.analysis-column {
  flex: 0 0 500px;
  min-width: 450px;
}
.analysis-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  height: fit-content;
  position: sticky;
  top: 20px;
}
.analysis-card .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}
.post-analysis-section {
  padding: 0;
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
.post-info-card, .score-breakdown-card {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
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
.recommendation-dashboard {
  margin: 20px 0;
}
.dashboard-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
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
.auto-update-status {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
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
    position: static;
  }
}
</style>
