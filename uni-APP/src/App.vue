<script>
import appConfig from './config';

export default {
  globalData: {
    $api: null,
    serverConfig: null,
    forceRefresh: false
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
  },
  onHide: function () {
    console.log('App Hide')
  },
  methods: {
    // 初始化应用
    initApp() {
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
