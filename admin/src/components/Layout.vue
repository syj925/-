<template>
  <div class="layout">
    <el-container class="layout-container">
      <!-- 侧边栏 -->
      <el-aside width="220px" class="aside">
        <div class="logo">
          <h2>校园墙管理系统</h2>
        </div>
        
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          background-color="#304156"
          text-color="#fff"
          active-text-color="#409EFF"
          router
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          
          <el-sub-menu index="1">
            <template #title>
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </template>
            <el-menu-item index="/user/list">用户列表</el-menu-item>
            <el-menu-item index="/user/audit">用户审核</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="2">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>内容管理</span>
            </template>
            <el-menu-item index="/content/posts">帖子管理</el-menu-item>
            <el-menu-item index="/content/comments">评论管理</el-menu-item>
            <el-menu-item index="/content/audit">内容审核</el-menu-item>
          </el-sub-menu>
          
          <el-menu-item index="/statistics">
            <el-icon><TrendCharts /></el-icon>
            <span>数据统计</span>
          </el-menu-item>
          
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <!-- 主体区域 -->
      <el-container>
        <!-- 顶部导航栏 -->
        <el-header class="header">
          <div class="header-left">
            <el-icon class="toggle-sidebar" @click="toggleSidebar"><Fold /></el-icon>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-if="currentPath">{{ currentPath }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="header-right">
            <el-dropdown trigger="click" @command="handleCommand">
              <span class="user-dropdown">
                <el-avatar size="small" src="https://img01.yzcdn.cn/vant/cat.jpeg"></el-avatar>
                <span>管理员</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                  <el-dropdown-item command="settings">设置</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <!-- 内容区域 -->
        <el-main class="main">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
        
        <el-footer class="footer">
          <div class="footer-content">
            <p>© 2023 校园墙管理系统</p>
          </div>
        </el-footer>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { Odometer, User, Document, TrendCharts, Setting, Fold, ArrowDown } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();

// 当前激活的菜单
const activeMenu = computed(() => route.path);

// 当前路径名称
const currentPath = computed(() => {
  const pathMap = {
    '/dashboard': '仪表盘',
    '/user/list': '用户列表',
    '/user/audit': '用户审核',
    '/content/posts': '帖子管理',
    '/content/comments': '评论管理',
    '/content/audit': '内容审核',
    '/statistics': '数据统计',
    '/settings': '系统设置'
  };
  return pathMap[route.path] || '';
});

// 切换侧边栏
const toggleSidebar = () => {
  // 这里可以实现侧边栏的收缩/展开功能
  console.log('Toggle sidebar');
};

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm(
      '确定要退出登录吗?',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      // 清除登录状态
      localStorage.removeItem('admin-token');
      // 跳转到登录页
      router.push('/login');
    }).catch(() => {
      // 取消操作
    });
  } else if (command === 'profile') {
    router.push('/profile');
  } else if (command === 'settings') {
    router.push('/settings');
  }
};
</script>

<style scoped>
.layout {
  height: 100vh;
  overflow: hidden;
}

.layout-container {
  height: 100%;
}

/* 侧边栏样式 */
.aside {
  background-color: #304156;
  color: #fff;
  height: 100%;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #263445;
}

.logo h2 {
  color: #fff;
  font-size: 18px;
  margin: 0;
  white-space: nowrap;
}

.el-menu-vertical {
  border-right: none;
}

/* 顶部导航栏样式 */
.header {
  background-color: #fff;
  color: #333;
  line-height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
}

.toggle-sidebar {
  font-size: 20px;
  margin-right: 20px;
  cursor: pointer;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-dropdown span {
  margin: 0 5px;
}

/* 内容区域样式 */
.main {
  background-color: #f5f7fa;
  overflow-y: auto;
  padding: 20px;
}

/* 底部样式 */
.footer {
  background-color: #fff;
  color: #606266;
  text-align: center;
  line-height: 60px;
  border-top: 1px solid #e6e6e6;
}

.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.footer-content p {
  margin: 0;
  font-size: 14px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 