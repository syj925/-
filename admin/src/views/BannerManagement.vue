<template>
  <div class="banner-management">
    <div class="page-header">
      <h1>轮播图管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新增轮播图
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filters" inline>
        <el-form-item label="场景">
          <el-select v-model="filters.scene" placeholder="选择场景" clearable>
            <el-option label="首页" value="home" />
            <el-option label="发现页" value="discover" />
            <el-option label="搜索主页" value="search-main" />
            <el-option label="话题搜索" value="search-topic" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="filters.platform" placeholder="选择平台" clearable>
            <el-option label="全部" value="all" />
            <el-option label="APP" value="app" />
            <el-option label="Web" value="web" />
            <el-option label="管理后台" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="选择状态" clearable>
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="搜索标题" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchBanners">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 轮播图列表 -->
    <div class="table-section">
      <el-table 
        :data="banners" 
        v-loading="loading"
        row-key="id"
        @sort-change="handleSortChange"
      >
        <el-table-column type="index" label="序号" width="60" />
        
        <el-table-column label="预览" width="120">
          <template #default="{ row }">
            <div class="banner-preview">
              <img :src="getFullImageUrl(row.image)" :alt="row.title" @error="handleImageError" />
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="title" label="标题" min-width="150" />
        
        <el-table-column label="场景" width="100">
          <template #default="{ row }">
            <el-tag :type="getSceneTagType(row.scene)">
              {{ getSceneName(row.scene) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="平台" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ getPlatformName(row.platform) }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="链接类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getLinkTypeTagType(row.linkType)">
              {{ getLinkTypeName(row.linkType) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="sortOrder" label="排序" width="80" sortable="custom" />
        <el-table-column prop="priority" label="优先级" width="80" sortable="custom" />
        
        <el-table-column label="统计" width="120">
          <template #default="{ row }">
            <div class="stats">
              <div>展示: {{ row.viewCount || 0 }}</div>
              <div>点击: {{ row.clickCount || 0 }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editBanner(row)">编辑</el-button>
            <el-button size="small" @click="viewStats(row)">统计</el-button>
            <el-button size="small" type="danger" @click="deleteBanner(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑轮播图' : '新增轮播图'"
      width="800px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入轮播图标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="场景" prop="scene">
              <el-select v-model="form.scene" placeholder="选择展示场景">
                <el-option label="首页" value="home" />
                <el-option label="发现页" value="discover" />
                <el-option label="搜索主页" value="search-main" />
                <el-option label="话题搜索" value="search-topic" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="轮播图片" prop="image">
          <div class="image-upload">
            <el-upload
              class="upload-demo"
              :action="uploadUrl"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleImageSuccess"
              :on-error="handleImageUploadError"
              :before-upload="beforeImageUpload"
            >
              <img v-if="form.image" :src="getFullImageUrl(form.image)" class="uploaded-image" />
              <el-icon v-else class="upload-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">建议尺寸：750x400px，支持jpg、png格式</div>
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="链接类型" prop="linkType">
              <el-select v-model="form.linkType" placeholder="选择链接类型" @change="onLinkTypeChange">
                <el-option label="外部链接" value="url">
                  <span>外部链接</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">跳转到外部网站</span>
                </el-option>
                <el-option label="帖子详情" value="post">
                  <span>帖子详情</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">跳转到指定帖子</span>
                </el-option>
                <el-option label="话题详情" value="topic">
                  <span>话题详情</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">跳转到指定话题</span>
                </el-option>
                <el-option label="活动详情" value="event">
                  <span>活动详情</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">跳转到指定活动</span>
                </el-option>
                <el-option label="页面跳转" value="page">
                  <span>页面跳转</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">跳转到应用内页面</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="平台" prop="platform">
              <el-select v-model="form.platform" placeholder="选择展示平台">
                <el-option label="全部" value="all" />
                <el-option label="APP" value="app" />
                <el-option label="Web" value="web" />
                <el-option label="管理后台" value="admin" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 链接配置区域 -->
        <el-card class="link-config-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>{{ getLinkTypeTitle() }}</span>
              <el-tag :type="getCurrentLinkTypeTagType()" size="small">{{ getLinkTypeDescription() }}</el-tag>
            </div>
          </template>

          <!-- 外部链接配置 -->
          <div v-if="form.linkType === 'url'">
            <el-form-item label="网站地址" prop="linkValue">
              <el-input
                v-model="form.linkValue"
                placeholder="请输入完整的网站地址，如：https://www.example.com"
                @blur="validateUrl"
              >
                <template #prepend>
                  <el-icon><Link /></el-icon>
                </template>
                <template #append>
                  <el-button
                    v-if="form.linkValue && isValidUrl(form.linkValue)"
                    @click="previewUrl"
                    type="primary"
                    size="small"
                  >
                    预览
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
            <div class="form-tip">
              <el-icon><InfoFilled /></el-icon>
              <span>支持 http:// 和 https:// 开头的网址，如果不包含协议会自动添加 https://</span>
            </div>
          </div>

          <!-- 帖子详情配置 -->
          <div v-else-if="form.linkType === 'post'">
            <el-form-item label="帖子ID" prop="linkValue">
              <el-input
                v-model="form.linkValue"
                placeholder="请输入帖子的唯一标识ID"
              >
                <template #prepend>
                  <el-icon><Document /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <div class="form-tip">
              <el-icon><InfoFilled /></el-icon>
              <span>点击轮播图将跳转到指定帖子的详情页面</span>
            </div>
          </div>

          <!-- 话题详情配置 -->
          <div v-else-if="form.linkType === 'topic'">
            <el-form-item label="话题ID" prop="linkValue">
              <el-input
                v-model="form.linkValue"
                placeholder="请输入话题的唯一标识ID"
              >
                <template #prepend>
                  <el-icon><ChatDotRound /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <div class="form-tip">
              <el-icon><InfoFilled /></el-icon>
              <span>点击轮播图将跳转到指定话题的详情页面</span>
            </div>
          </div>

          <!-- 活动详情配置 -->
          <div v-else-if="form.linkType === 'event'">
            <el-form-item label="活动ID" prop="linkValue">
              <el-input
                v-model="form.linkValue"
                placeholder="请输入活动的唯一标识ID"
              >
                <template #prepend>
                  <el-icon><Calendar /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <div class="form-tip">
              <el-icon><InfoFilled /></el-icon>
              <span>点击轮播图将跳转到指定活动的详情页面</span>
            </div>
          </div>

          <!-- 页面跳转配置 -->
          <div v-else-if="form.linkType === 'page'">
            <el-form-item label="页面路径" prop="linkValue">
              <el-input
                v-model="form.linkValue"
                placeholder="请输入应用内页面路径，如：/pages/user/profile"
              >
                <template #prepend>
                  <el-icon><Files /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <div class="form-tip">
              <el-icon><InfoFilled /></el-icon>
              <span>点击轮播图将跳转到应用内的指定页面</span>
            </div>
          </div>
        </el-card>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序权重" prop="sortOrder">
              <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-input-number v-model="form.priority" :min="0" :max="999" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间">
              <el-date-picker
                v-model="form.startTime"
                type="datetime"
                placeholder="选择开始时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间">
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                placeholder="选择结束时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 统计对话框 -->
    <el-dialog v-model="statsDialogVisible" title="轮播图统计" width="600px">
      <div v-if="currentStats" class="stats-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="轮播图标题">{{ currentStats.title }}</el-descriptions-item>
          <el-descriptions-item label="总展示次数">{{ currentStats.totalViews }}</el-descriptions-item>
          <el-descriptions-item label="总点击次数">{{ currentStats.totalClicks }}</el-descriptions-item>
          <el-descriptions-item label="点击率">{{ currentStats.clickRate }}%</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentStats.createdAt) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Link, InfoFilled, Document, ChatDotRound, Calendar, Files } from '@element-plus/icons-vue'
import api from '@/utils/api'
import { formatDate, formatImageUrl } from '@/utils/format'
import { SERVER_BASE_URL } from '@/config'

export default {
  name: 'BannerManagement',
  components: {
    Plus,
    Refresh
  },
  setup() {
    // 响应式数据
    const loading = ref(false)
    const banners = ref([])
    const dialogVisible = ref(false)
    const statsDialogVisible = ref(false)
    const isEdit = ref(false)
    const currentStats = ref(null)
    const formRef = ref(null)

    // 筛选条件
    const filters = reactive({
      scene: '',
      platform: '',
      status: '',
      keyword: ''
    })

    // 分页
    const pagination = reactive({
      page: 1,
      limit: 20,
      total: 0
    })

    // 排序
    const sort = reactive({
      field: 'createdAt',
      order: 'desc'
    })

    // 表单数据
    const form = reactive({
      id: null,
      title: '',
      image: '',
      scene: 'home',
      platform: 'all',
      linkType: 'url',
      linkValue: '',
      sortOrder: 0,
      priority: 0,
      startTime: null,
      endTime: null,
      status: 'active'
    })

    // 表单验证规则
    const formRules = {
      title: [
        { required: true, message: '请输入轮播图标题', trigger: 'blur' },
        { min: 1, max: 100, message: '标题长度在 1 到 100 个字符', trigger: 'blur' }
      ],
      image: [
        { required: true, message: '请上传轮播图片', trigger: 'change' }
      ],
      scene: [
        { required: true, message: '请选择展示场景', trigger: 'change' }
      ],
      platform: [
        { required: true, message: '请选择展示平台', trigger: 'change' }
      ],
      linkType: [
        { required: true, message: '请选择链接类型', trigger: 'change' }
      ],
      linkValue: [
        { required: true, message: '请输入链接值', trigger: 'blur' }
      ]
    }

    // 上传配置
    const uploadUrl = computed(() => `${SERVER_BASE_URL}/api/upload/banner`)
    const uploadHeaders = computed(() => ({
      'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
    }))

    // 方法
    const loadBanners = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          sortField: sort.field,
          sortOrder: sort.order,
          ...filters
        }

        const response = await api.content.getBanners(params)
        banners.value = response.data.banners || []
        pagination.total = response.data.total || 0
      } catch (error) {
        console.error('加载轮播图失败:', error)
        ElMessage.error('加载轮播图失败')
      } finally {
        loading.value = false
      }
    }

    const refreshData = () => {
      pagination.page = 1
      loadBanners()
    }

    const searchBanners = () => {
      pagination.page = 1
      loadBanners()
    }

    const resetFilters = () => {
      Object.assign(filters, {
        scene: '',
        platform: '',
        status: '',
        keyword: ''
      })
      searchBanners()
    }

    const handleSortChange = ({ prop, order }) => {
      sort.field = prop || 'createdAt'
      sort.order = order === 'ascending' ? 'asc' : 'desc'
      loadBanners()
    }

    const handleSizeChange = (size) => {
      pagination.limit = size
      pagination.page = 1
      loadBanners()
    }

    const handleCurrentChange = (page) => {
      pagination.page = page
      loadBanners()
    }

    const showCreateDialog = () => {
      isEdit.value = false
      resetForm()
      dialogVisible.value = true
    }

    const editBanner = (banner) => {
      isEdit.value = true
      Object.assign(form, {
        ...banner,
        startTime: banner.startTime || null,
        endTime: banner.endTime || null
      })
      dialogVisible.value = true
    }

    const resetForm = () => {
      Object.assign(form, {
        id: null,
        title: '',
        image: '',
        scene: 'home',
        platform: 'all',
        linkType: 'url',
        linkValue: '',
        sortOrder: 0,
        priority: 0,
        startTime: null,
        endTime: null,
        status: 'active'
      })
      if (formRef.value) {
        formRef.value.clearValidate()
      }
    }

    const submitForm = async () => {
      if (!formRef.value) return

      try {
        await formRef.value.validate()

        const data = { ...form }
        if (isEdit.value) {
          await api.content.updateBanner(data.id, data)
          ElMessage.success('更新轮播图成功')
        } else {
          await api.content.createBanner(data)
          ElMessage.success('创建轮播图成功')
        }

        dialogVisible.value = false
        loadBanners()
      } catch (error) {
        console.error('保存轮播图失败:', error)
        ElMessage.error('保存轮播图失败')
      }
    }

    const toggleStatus = async (banner) => {
      try {
        await api.content.updateBanner(banner.id, {
          status: banner.status
        })
        ElMessage.success('状态更新成功')
      } catch (error) {
        console.error('更新状态失败:', error)
        ElMessage.error('更新状态失败')
        // 回滚状态
        banner.status = banner.status === 'active' ? 'inactive' : 'active'
      }
    }

    const deleteBanner = async (banner) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除轮播图"${banner.title}"吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        await api.content.deleteBanner(banner.id)
        ElMessage.success('删除成功')
        loadBanners()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除轮播图失败:', error)
          ElMessage.error('删除轮播图失败')
        }
      }
    }

    const viewStats = async (banner) => {
      try {
        const response = await api.content.getBannerStats(banner.id)
        currentStats.value = response.data
        statsDialogVisible.value = true
      } catch (error) {
        console.error('获取统计数据失败:', error)
        ElMessage.error('获取统计数据失败')
      }
    }

    // 图片URL处理函数
    const getFullImageUrl = (url) => {
      return formatImageUrl(url, SERVER_BASE_URL)
    }

    // 上传相关方法
    const handleImageSuccess = (response) => {
      console.log('上传成功响应:', response)
      if (response.success && response.data && response.data.url) {
        form.image = response.data.url
        ElMessage.success('图片上传成功')
        console.log('设置图片URL:', response.data.url)
      } else {
        console.error('上传响应格式错误:', response)
        ElMessage.error('图片上传失败：响应格式错误')
      }
    }

    const handleImageUploadError = (error) => {
      console.error('上传失败:', error)
      ElMessage.error('图片上传失败')
    }

    const beforeImageUpload = (file) => {
      const isJPGOrPNG = file.type === 'image/jpeg' || file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isJPGOrPNG) {
        ElMessage.error('只能上传 JPG/PNG 格式的图片!')
        return false
      }
      if (!isLt2M) {
        ElMessage.error('图片大小不能超过 2MB!')
        return false
      }
      return true
    }

    const handleImageError = (event) => {
      event.target.src = '/placeholder-image.png'
    }

    // 辅助方法
    const getSceneName = (scene) => {
      const sceneMap = {
        home: '首页',
        discover: '发现页',
        'search-main': '搜索主页',
        'search-topic': '话题搜索'
      }
      return sceneMap[scene] || scene
    }

    const getSceneTagType = (scene) => {
      const typeMap = {
        home: 'primary',
        discover: 'success',
        'search-main': 'info',
        'search-topic': 'warning'
      }
      return typeMap[scene] || ''
    }

    const getPlatformName = (platform) => {
      const platformMap = {
        all: '全部',
        app: 'APP',
        web: 'Web',
        admin: '管理后台'
      }
      return platformMap[platform] || platform
    }

    const getLinkTypeName = (linkType) => {
      const typeMap = {
        url: '外部链接',
        post: '帖子详情',
        topic: '话题详情',
        event: '活动详情',
        page: '页面跳转'
      }
      return typeMap[linkType] || linkType
    }

    const getLinkTypeTagType = (linkType) => {
      const typeMap = {
        url: 'primary',
        post: 'success',
        topic: 'warning',
        event: 'info',
        page: 'danger'
      }
      return typeMap[linkType] || ''
    }

    const getLinkValuePlaceholder = () => {
      const placeholderMap = {
        url: '请输入完整的URL地址',
        post: '请输入帖子ID',
        topic: '请输入话题ID',
        event: '请输入活动ID',
        page: '请输入页面路径'
      }
      return placeholderMap[form.linkType] || '请输入链接值'
    }

    // 获取链接类型标题
    const getLinkTypeTitle = () => {
      const titleMap = {
        url: '外部链接配置',
        post: '帖子详情配置',
        topic: '话题详情配置',
        event: '活动详情配置',
        page: '页面跳转配置'
      }
      return titleMap[form.linkType] || '链接配置'
    }

    // 获取链接类型描述
    const getLinkTypeDescription = () => {
      const descMap = {
        url: '跳转到外部网站',
        post: '跳转到指定帖子',
        topic: '跳转到指定话题',
        event: '跳转到指定活动',
        page: '跳转到应用内页面'
      }
      return descMap[form.linkType] || '链接跳转'
    }

    // 获取当前表单链接类型标签类型
    const getCurrentLinkTypeTagType = () => {
      const typeMap = {
        url: 'warning',
        post: 'primary',
        topic: 'success',
        event: 'info',
        page: 'default'
      }
      return typeMap[form.linkType] || 'default'
    }

    // 链接类型改变处理
    const onLinkTypeChange = () => {
      form.linkValue = '' // 清空链接值
    }

    // URL验证
    const isValidUrl = (url) => {
      try {
        new URL(url.startsWith('http') ? url : 'https://' + url)
        return true
      } catch {
        return false
      }
    }

    // 验证URL格式
    const validateUrl = () => {
      if (form.linkType === 'url' && form.linkValue) {
        if (!isValidUrl(form.linkValue)) {
          ElMessage.warning('请输入有效的网址格式')
        }
      }
    }

    // 预览URL
    const previewUrl = () => {
      if (form.linkValue) {
        const url = form.linkValue.startsWith('http') ? form.linkValue : 'https://' + form.linkValue
        window.open(url, '_blank')
      }
    }



    // 生命周期
    onMounted(() => {
      loadBanners()
    })

    return {
      // 数据
      loading,
      banners,
      dialogVisible,
      statsDialogVisible,
      isEdit,
      currentStats,
      formRef,
      filters,
      pagination,
      sort,
      form,
      formRules,
      uploadUrl,
      uploadHeaders,

      // 方法
      getFullImageUrl,
      loadBanners,
      refreshData,
      searchBanners,
      resetFilters,
      handleSortChange,
      handleSizeChange,
      handleCurrentChange,
      showCreateDialog,
      editBanner,
      resetForm,
      submitForm,
      toggleStatus,
      deleteBanner,
      viewStats,
      handleImageSuccess,
      handleImageUploadError,
      beforeImageUpload,
      handleImageError,
      getSceneName,
      getSceneTagType,
      getPlatformName,
      getLinkTypeName,
      getLinkTypeTagType,
      getLinkValuePlaceholder,
      getLinkTypeTitle,
      getLinkTypeDescription,
      getCurrentLinkTypeTagType,
      onLinkTypeChange,
      isValidUrl,
      validateUrl,
      previewUrl,
      formatDate
    }
  }
}
</script>

<style scoped>
.banner-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-section {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.banner-preview {
  width: 80px;
  height: 45px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
}

.banner-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stats {
  font-size: 12px;
  color: #606266;
}

.stats div {
  margin-bottom: 2px;
}

.pagination-section {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.image-upload {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.upload-demo {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.upload-demo:hover {
  border-color: #409eff;
}

.uploaded-image {
  width: 200px;
  height: 120px;
  object-fit: cover;
  display: block;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
  width: 200px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
}

.stats-content {
  padding: 20px 0;
}

.dialog-footer {
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .filter-section .el-form {
    flex-direction: column;
  }

  .filter-section .el-form-item {
    margin-right: 0;
    margin-bottom: 15px;
  }
}

/* 链接配置卡片样式 */
.link-config-card {
  margin: 20px 0;
  border: 1px solid #e4e7ed;
}

.link-config-card :deep(.el-card__header) {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-weight: 500;
  color: #303133;
}

/* 表单提示样式 */
.form-tip {
  display: flex;
  align-items: center;
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
  color: #1e40af;
  font-size: 13px;
}

.form-tip .el-icon {
  margin-right: 6px;
  color: #3b82f6;
}

/* 选择器选项样式优化 */
:deep(.el-select-dropdown__item) {
  height: auto !important;
  line-height: 1.4 !important;
  padding: 12px 20px !important;
}

:deep(.el-select-dropdown__item span:last-child) {
  margin-top: 2px;
}
</style>
