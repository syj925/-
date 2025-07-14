/**
 * 认证相关工具函数
 */

/**
 * 显示登录模态框
 */
export function showAuthModal() {
  // 检查当前页面是否已经是登录页
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const currentPath = currentPage ? currentPage.route : '';
  
  if (currentPath.includes('login') || currentPath.includes('register')) {
    return; // 已在登录相关页面，不需要显示模态框
  }
  
  uni.showModal({
    title: '登录提示',
    content: '请先登录后再操作',
    confirmText: '去登录',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        uni.navigateTo({
          url: '/pages/login/login'
        });
      }
    }
  });
} 