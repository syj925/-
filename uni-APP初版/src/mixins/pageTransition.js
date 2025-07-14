// 页面过渡动画混入
export default {
  // 页面显示动画
  onShow() {
    // 开启动画
    this.$nextTick(() => {
      this.startPageAnimation();
    });
  },
  
  // 页面隐藏
  onHide() {
    // 重置页面状态，便于下次显示动画
    this.resetPageAnimation();
  },
  
  methods: {
    // 开始页面动画
    startPageAnimation() {
      // 获取当前页面路径
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (!currentPage) return;
      
      const currentPath = `/${currentPage.route}`;
      
      // 获取页面根元素
      const pageEl = document.querySelector('.page-container') || document.querySelector('.container');
      if (!pageEl) return;
      
      // 根据不同页面设置不同动画
      let animationType = this.getAnimationType(currentPath);
      
      // 添加动画类
      pageEl.classList.add(`animate-${animationType}`);
    },
    
    // 重置页面动画
    resetPageAnimation() {
      const pageEl = document.querySelector('.page-container') || document.querySelector('.container');
      if (!pageEl) return;
      
      // 移除所有可能的动画类
      pageEl.classList.remove('animate-fadeIn', 'animate-slideUp', 'animate-slideLeft', 'animate-slideRight', 'animate-scaleIn');
    },
    
    // 根据路径获取合适的动画类型
    getAnimationType(path) {
      const animationMap = {
        '/pages/index/index': 'fadeIn', // 首页淡入
        '/pages/message/message': 'slideLeft', // 消息页从右向左滑入
        '/pages/post-detail/post-detail': 'scaleIn', // 帖子详情缩放入场
        '/pages/publish/publish': 'slideUp', // 发布页从下向上滑入
        '/pages/profile/profile': 'slideLeft', // 个人资料从右向左滑入
        '/pages/settings/settings': 'slideLeft', // 设置页从右向左滑入
        '/pages/search/search': 'fadeIn', // 搜索页淡入
        '/pages/login/login': 'fadeIn', // 登录页淡入
        '/pages/register/register': 'slideLeft', // 注册页从右向左滑入
      };
      
      // 返回匹配的动画类型，默认使用淡入动画
      return animationMap[path] || 'fadeIn';
    }
  }
}; 