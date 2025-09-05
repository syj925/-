<script>
import appConfig from './config';
import configUpdateManager from '@/utils/configUpdateManager';
import { useFollowStore } from './stores/followStore';

export default {
  globalData: {
    $api: null,
    serverConfig: null,
    forceRefresh: false,
    isFirstLaunch: true  // 标记是否首次启动
  },
  onLaunch: function () {
    console.log('App Launch')
    // 将API实例保存到globalData中
    this.globalData.$api = this.$api;
    // 将配置保存到globalData中
    this.globalData.serverConfig = appConfig;
    
    // 初始化
    this.initApp();
    
    // 确保应用启动时停止所有可能的下拉刷新
    uni.stopPullDownRefresh();
  },
  onShow: function () {
    console.log('App Show')

    // 确保每次应用显示时停止所有可能的下拉刷新
    uni.stopPullDownRefresh();

    // 如果是首次启动，跳过检查（已在onLaunch中处理）
    if (this.globalData.isFirstLaunch) {
      this.globalData.isFirstLaunch = false;
      console.log('🚀 首次启动，跳过onShow中的配置检查');
      return;
    }

    // App从后台回到前台时，检查是否需要更新配置
    console.log('🔄 从后台返回，检查配置更新...');
    setTimeout(async () => {
      try {
        const hasUpdate = await configUpdateManager.checkForUpdates();
        if (hasUpdate) {
          console.log('🎉 从后台返回，配置已更新');
          uni.$emit('validationRulesUpdated');
        }
      } catch (error) {
        console.error('后台返回检查配置失败:', error);
      }
    }, 1000); // 延迟1秒检查
  },
  onHide: function () {
    console.log('App Hide')
  },
  methods: {
    // 初始化应用
    async initApp() {
      // 获取系统信息
      const systemInfo = uni.getSystemInfoSync();
      // 存储状态栏高度，适配刘海屏
      uni.setStorageSync('statusBarHeight', systemInfo.statusBarHeight);
      // 存储安全区域
      if (systemInfo.safeArea) {
        uni.setStorageSync('safeAreaBottom', systemInfo.safeArea.bottom);
      }

      // 初始化服务器设置
      this.initServerConfig();

      // 初始化关注状态管理
      this.initFollowStore();

      // 检查配置文件更新
      this.checkConfigUpdates();
    },
    
    // 初始化服务器配置
    initServerConfig() {
      // 检查是否有服务器设置
      const userServer = appConfig.getUserServer();
      if (userServer) {
        console.log('使用用户自定义服务器:', userServer);
      } else {
        // 使用最佳服务器
        const bestServer = appConfig.getBestServer();
        console.log('使用最佳服务器:', bestServer);
      }
      
      // 确保http配置中有正确的baseURL
      if (this.$api && this.$api.http) {
        console.log('当前API服务器地址:', this.$api.http.config.baseURL);
      }
    },

    // 初始化关注状态管理
    async initFollowStore() {
      try {
        // 检查用户是否已登录
        const token = uni.getStorageSync('token');
        if (!token) {
          console.log('用户未登录，跳过关注状态初始化');
          return;
        }
        
        const followStore = useFollowStore();
        
        // 检查是否需要初始化
        if (!followStore.isInitialized) {
          console.log('🚀 开始初始化关注状态...');
          await followStore.initializeFollowData();
          console.log('✅ 关注状态初始化完成');
        } else {
          console.log('关注状态已初始化，跳过');
        }
      } catch (error) {
        console.error('初始化关注状态失败:', error);
      }
    },

    // 检查配置文件更新
    async checkConfigUpdates() {
      try {
        console.log('🚀 应用启动，开始检查配置更新...');

        // 先初始化间隔设置（独立获取，不影响版本检查）
        setTimeout(async () => {
          try {
            await configUpdateManager.checkAndUpdateInterval();
            console.log('📅 间隔设置初始化完成');
          } catch (error) {
            console.warn('间隔设置初始化失败:', error);
          }
        }, 1000); // 1秒后获取间隔设置

        // H5模式特殊处理：检查是否刚刚刷新页面
        // #ifdef H5
        const isH5Refresh = !sessionStorage.getItem('campus_wall_session_started');
        if (isH5Refresh) {
          sessionStorage.setItem('campus_wall_session_started', 'true');
          console.log('🌐 H5模式首次启动或刷新，延长检查延迟');

          // H5刷新时延长检查时间，避免重复强制更新提示
          setTimeout(async () => {
            const hasUpdate = await configUpdateManager.checkForUpdates();
            if (hasUpdate) {
              console.log('🎉 配置文件已更新到最新版本');
              uni.$emit('validationRulesUpdated');
            }
          }, 5000); // H5模式延迟5秒
          return;
        }
        // #endif

        // 异步检查更新，不阻塞应用启动
        setTimeout(async () => {
          const hasUpdate = await configUpdateManager.checkForUpdates();

          if (hasUpdate) {
            console.log('🎉 配置文件已更新到最新版本');

            // 可以在这里通知用户配置已更新
            // 或者触发相关组件重新加载验证规则
            uni.$emit('validationRulesUpdated');
          }
        }, 3000); // 延迟3秒检查，确保间隔设置已获取

      } catch (error) {
        console.error('检查配置更新失败:', error);
        // 不影响应用正常启动
      }
    }
  }
}
</script>

<style lang="scss">
/* 引入样式文件 */
@import './styles/reset.scss';
@import './styles/common.scss';
@import './static/styles/iconfont.scss';

/* 全局样式 */
page {
  background-color: #F8F9FE;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
}

/* 隐藏scroll-view滚动条 */
::-webkit-scrollbar {
  width: 0;
  height: 0;
  background-color: transparent;
}
</style>
