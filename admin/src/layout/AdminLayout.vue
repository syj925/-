<template>
  <el-container class="admin-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'" 
              :class="['sidebar-container', {'is-collapse': isCollapse}]">
      <div class="logo-container">
        <img src="@/assets/vue.svg" alt="校园墙" class="logo">
        <h2 v-if="!isCollapse">校园墙管理系统</h2>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        :collapse="isCollapse"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        
        <el-sub-menu index="/user">
          <template #title>
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </template>
          <el-menu-item index="/user/list">用户列表</el-menu-item>
          <el-menu-item index="/user/audit">用户审核</el-menu-item>
          <el-menu-item index="/user/rejection-logs">拒绝记录</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="/content">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>内容管理</span>
          </template>
          <el-menu-item index="/content/posts">帖子管理</el-menu-item>
          <el-menu-item index="/content/comments">评论管理</el-menu-item>
          <el-menu-item index="/content/audit">内容审核</el-menu-item>
          <el-menu-item index="/content/banners">轮播图管理</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="/topics">
          <template #title>
            <el-icon><ChatDotRound /></el-icon>
            <span>话题管理</span>
          </template>
          <el-menu-item index="/topics/list">话题列表</el-menu-item>
          <el-menu-item index="/topics/pending-images">待审核图片</el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/event">
          <el-icon><Calendar /></el-icon>
          <span>活动管理</span>
        </el-menu-item>
        
        <el-sub-menu index="/label">
          <template #title>
            <el-icon><PriceTag /></el-icon>
            <span>标签管理</span>
          </template>
          <el-menu-item index="/label/tags">标签管理</el-menu-item>
          <el-menu-item index="/label/badges">徽章管理</el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/collection">
          <el-icon><Star /></el-icon>
          <span>收藏夹管理</span>
        </el-menu-item>
        
        <el-sub-menu index="/emoji">
          <template #title>
            <el-icon><Picture /></el-icon>
            <span>表情管理</span>
          </template>
          <el-menu-item index="/emoji/packs">表情包管理</el-menu-item>
          <el-menu-item index="/emoji/audit">表情审核</el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/message">
          <el-icon><Message /></el-icon>
          <span>消息系统</span>
        </el-menu-item>
        
        <el-menu-item index="/category">
          <el-icon><Collection /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        
        <el-menu-item index="/statistics">
          <el-icon><TrendCharts /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
        
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
        
        <el-menu-item index="/logs">
          <el-icon><List /></el-icon>
          <span>操作日志</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <!-- 主体区域 -->
    <el-container>
      <el-header height="var(--header-height)" class="header">
        <div class="header-left">
          <el-icon class="fold-icon" @click="toggleSidebar">
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index" :to="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="avatar-container">
              <el-avatar :size="36" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
              <span class="username">管理员</span>
              <el-icon><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { 
  Odometer, User, Document, Collection, 
  TrendCharts, Setting, List, Fold, Expand,
  CaretBottom, ChatDotRound, Calendar, PriceTag,
  Star, Message, Discount
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

// 侧边栏折叠状态
const isCollapse = ref(false);
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value;
};

// 当前激活的菜单项
const activeMenu = computed(() => {
  return route.path;
});

// 面包屑导航
const breadcrumbs = computed(() => {
  const { path, meta, matched } = route;
  // 根据路由meta信息生成面包屑
  const result = [
    { path: '/dashboard', title: '首页' }
  ];
  
  if (path !== '/dashboard') {
    // 处理嵌套路由的面包屑
    matched.forEach((match) => {
      if (match.meta && match.meta.title && match.path !== '/') {
        // 避免重复添加相同的面包屑
        const existing = result.find(item => item.path === match.path);
        if (!existing) {
          result.push({ path: match.path, title: match.meta.title });
        }
      }
    });
  }
  
  return result;
});

// 用户操作处理
const handleCommand = (command) => {
  if (command === 'logout') {
    // 清除登录状态
    localStorage.removeItem('admin_token');
    // 可选：如果不想清除"记住我"的信息，可以保留 admin_saved_login
    
    // 显示退出成功提示
    ElMessage.success('退出登录成功');
    
    // 跳转到登录页
    router.push('/login');
  } else if (command === 'profile') {
    // 跳转到个人信息页
    ElMessage.info('个人信息功能开发中');
  } else if (command === 'password') {
    // 打开修改密码对话框
    ElMessage.info('修改密码功能开发中');
  }
};
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.sidebar-container {
  background-color: var(--sidebar-bg);
  transition: width 0.28s;
  height: 100%;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 1001;
  width: var(--sidebar-width);
}

.sidebar-container.is-collapse {
  width: var(--sidebar-collapsed-width);
}

.logo-container {
  height: var(--header-height);
  padding: 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3649;
}

.logo {
  width: 32px;
  height: 32px;
  margin-right: 12px;
}

.logo-container h2 {
  color: #fff;
  font-size: 16px;
  margin: 0;
  font-weight: 600;
  white-space: nowrap;
}

/* Header styles */
.header {
  background-color: var(--header-bg);
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--content-padding-right) 0 var(--content-padding);
  position: relative;
  height: var(--header-height);
}

.header-left {
  display: flex;
  align-items: center;
}

.fold-icon {
  font-size: 20px;
  cursor: pointer;
  margin-right: 20px;
}

.header-right {
  display: flex;
  align-items: center;
}

.avatar-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin: 0 8px;
  color: var(--text-regular);
}

/* Main content area */
.main-content {
  padding: 0;
  margin-left: var(--sidebar-width);
  transition: margin-left 0.28s;
  width: calc(100% - var(--sidebar-width));
  overflow-x: hidden;
}

.is-collapse ~ .el-container .main-content {
  margin-left: var(--sidebar-collapsed-width);
  width: calc(100% - var(--sidebar-collapsed-width));
}

@media (max-width: 768px) {
  .sidebar-container {
    transform: translateX(-100%);
    z-index: 1002;
  }

  .sidebar-container.is-collapse {
    transform: translateX(0);
    width: var(--sidebar-width);
  }

  .main-content {
    margin-left: 0 !important;
    width: 100% !important;
  }
}
</style> 