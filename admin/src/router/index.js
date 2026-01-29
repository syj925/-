import { createRouter, createWebHistory } from 'vue-router';

// 布局组件
import AdminLayout from '@/layout/AdminLayout.vue';

// 路由配置
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: AdminLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'odometer' }
      },
      {
        path: 'user',
        name: 'User',
        redirect: '/user/list',
        meta: { title: '用户管理', icon: 'user' },
        children: [
          {
            path: 'list',
            name: 'UserList',
            component: () => import('@/views/user/UserList.vue'),
            meta: { title: '用户列表' }
          },
          {
            path: 'audit',
            name: 'UserAudit',
            component: () => import('@/views/user/UserAudit.vue'),
            meta: { title: '用户审核' }
          },
          {
            path: 'rejection-logs',
            name: 'RejectionLogs',
            component: () => import('@/views/user/RejectionLogs.vue'),
            meta: { title: '拒绝记录' }
          }
        ]
      },
      {
        path: 'content',
        name: 'Content',
        redirect: '/content/posts',
        meta: { title: '内容管理', icon: 'document' },
        children: [
          {
            path: 'posts',
            name: 'PostsList',
            component: () => import('@/views/content/PostsList.vue'),
            meta: { title: '帖子管理' }
          },
          {
            path: 'comments',
            name: 'CommentsList',
            component: () => import('@/views/content/CommentsList.vue'),
            meta: { title: '评论管理' }
          },
          {
            path: 'audit',
            name: 'ContentAudit',
            component: () => import('@/views/content/ContentAudit.vue'),
            meta: { title: '内容审核' }
          },
          {
            path: 'banners',
            name: 'BannersList',
            component: () => import('@/views/BannerManagement.vue'),
            meta: { title: '轮播图管理' }
          }
        ]
      },
      {
        path: 'topics',
        redirect: '/topics/list',
        name: 'TopicManage',
        meta: { title: '话题管理', icon: 'el-icon-collection-tag' },
        children: [
          {
            path: 'list',
            component: () => import('@/views/topic/TopicList.vue'),
            name: 'TopicList',
            meta: { title: '话题列表' }
          },
          {
            path: 'edit/:id',
            component: () => import('@/views/topic/TopicEdit.vue'),
            name: 'TopicEdit',
            meta: { title: '编辑话题', activeMenu: '/topics/list' },
            hidden: true
          },
          {
            path: 'create',
            component: () => import('@/views/topic/TopicCreate.vue'),
            name: 'TopicCreate',
            meta: { title: '创建话题', activeMenu: '/topics/list' },
            hidden: true
          },
          {
            path: 'pending-images',
            component: () => import('@/views/topic/PendingImagesList.vue'),
            name: 'PendingImagesList',
            meta: { title: '待审核图片' }
          }
        ]
      },
      {
        path: 'event',
        name: 'Event',
        redirect: '/event/list',
        meta: { title: '活动管理', icon: 'calendar' },
        children: [
          {
            path: 'list',
            name: 'EventList',
            component: () => import('@/views/event/EventList.vue'),
            meta: { title: '活动列表' }
          },
          {
            path: 'registrations/:id',
            name: 'EventRegistrations',
            component: () => import('@/views/event/EventRegistrations.vue'),
            meta: { title: '报名管理', activeMenu: '/event/list' },
            props: true,
            hidden: true
          }
        ]
      },
      {
        path: 'label',
        name: 'Label',
        redirect: '/label/tags',
        meta: { title: '标签管理', icon: 'price-tag' },
        children: [
          {
            path: 'tags',
            name: 'TagManagement',
            component: () => import('@/views/tag/TagManagement.vue'),
            meta: { title: '标签管理' }
          },
          {
            path: 'badges',
            name: 'BadgeManagement',
            component: () => import('@/views/badge/BadgeManagement.vue'),
            meta: { title: '徽章管理' }
          }
        ]
      },
      // {
      //   path: 'collection',
      //   name: 'Collection',
      //   component: () => import('@/views/collection/CollectionManagement.vue'),
      //   meta: { title: '收藏夹管理', icon: 'star' }
      // },
      {
        path: 'emoji',
        name: 'Emoji',
        redirect: '/emoji/packs',
        meta: { title: '表情管理', icon: 'picture' },
        children: [
          {
            path: 'packs',
            name: 'EmojiPacks',
            component: () => import('@/views/emoji/EmojiPackManagement.vue'),
            meta: { title: '表情包管理' }
          },
          {
            path: 'audit',
            name: 'EmojiAudit',
            component: () => import('@/views/emoji/EmojiAudit.vue'),
            meta: { title: '表情审核' }
          }
        ]
      },
      {
        path: 'message',
        name: 'Message',
        component: () => import('@/views/message/MessageManagement.vue'),
        meta: { title: '消息系统', icon: 'message' }
      },
      {
        path: 'category',
        name: 'Category',
        component: () => import('@/views/CategoryManagement.vue'),
        meta: { title: '分类管理', icon: 'collection' }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/Statistics.vue'),
        meta: { title: '数据统计', icon: 'trend-charts' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '系统设置', icon: 'setting' }
      },
      {
        path: 'logs',
        name: 'OperationLog',
        component: () => import('@/views/OperationLog.vue'),
        meta: { title: '操作日志', icon: 'list' }
      }
    ]
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// 全局前置守卫 - 权限验证
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 校园墙管理系统` : '校园墙管理系统';
  
  // 判断路由是否需要登录权限
  const isAuthenticated = localStorage.getItem('admin_token');
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false);
  
  if (requiresAuth && !isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router; 