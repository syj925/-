/**
 * 文件上传相关API
 */

// 导入配置和URL工具
import appConfig from '@/config';
import { UrlUtils } from '@/utils';

export default (http) => ({
  /**
   * 上传图片
   * @param {String} filePath 本地文件路径
   * @returns {Promise}
   */
  uploadImage: (filePath) => {
    // 获取BASE_URL
    let BASE_URL = '';
    
    // 尝试从http配置获取
    if (http && http.config && http.config.baseURL) {
      BASE_URL = http.config.baseURL;
      console.log('从http.config获取BASE_URL:', BASE_URL);
    } 
    // 如果无法从http获取，尝试从配置获取
    else {
      BASE_URL = appConfig.getBestServer();
      console.log('从配置获取BASE_URL:', BASE_URL);
    }
    
    // 确保BASE_URL不为空
    if (!BASE_URL) {
      console.error('BASE_URL未定义，无法构建上传URL');
      return Promise.reject({ errMsg: 'BASE_URL未定义' });
    }
    
    // 构建完整的上传URL
    const uploadUrl = BASE_URL + '/api/upload/image';
    
    console.log('准备上传图片到:', uploadUrl);
    console.log('当前环境:', process.env.NODE_ENV);
    
    // 检测当前平台
    let platform = 'unknown';
    // #ifdef H5
    platform = 'h5';
    // #endif
    // #ifdef APP-PLUS
    platform = 'app';
    // #endif
    // #ifdef MP
    platform = 'mp';
    // #endif
    console.log('当前平台:', platform);
    
    return new Promise((resolve, reject) => {
      // 创建上传任务
      const uploadTask = uni.uploadFile({
        url: uploadUrl,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${uni.getStorageSync('token')}`
        },
        timeout: appConfig.getTimeout(), // 使用配置中的超时设置
        success: (res) => {
          try {
            console.log('上传响应状态码:', res.statusCode);
            console.log('上传响应数据:', res.data);
            
            // 检查状态码
            if (res.statusCode < 200 || res.statusCode >= 300) {
              console.error('上传请求状态码错误:', res.statusCode);
              uni.showToast({
                title: `上传失败，状态码：${res.statusCode}`,
                icon: 'none'
              });
              reject({
                errMsg: `uploadFile:fail statusCode: ${res.statusCode}`,
                statusCode: res.statusCode,
                data: res.data
              });
              return;
            }
            
            const data = JSON.parse(res.data);
            if (data.code === 0 && data.data) {
              // 确保返回的URL是完整的绝对URL
              if (data.data.url) {
                data.data.url = UrlUtils.ensureAbsoluteUrl(data.data.url);
              }
              
              console.log('上传成功, 返回数据:', data.data);
              resolve(data.data);
            } else {
              console.error('上传失败, 服务器返回错误:', data);
              uni.showToast({
                title: data.msg || '上传失败',
                icon: 'none'
              });
              reject(data);
            }
          } catch (error) {
            console.error('解析上传响应失败:', error, res);
            reject({
              errMsg: '解析响应失败',
              originalError: error,
              originalResponse: res
            });
          }
        },
        fail: (err) => {
          console.error('文件上传失败:', err);
          
          // 处理不同类型的错误
          let errorMsg = '文件上传失败';
          if (err.errMsg.includes('timeout')) {
            errorMsg = '上传超时，请检查网络连接';
          } else if (err.errMsg.includes('statusCode: null')) {
            errorMsg = '无法连接到服务器，请检查网络设置';
          }
          
          uni.showToast({
            title: errorMsg,
            icon: 'none'
          });
          
          reject(err);
        },
        complete: () => {
          console.log('上传请求已完成');
        }
      });
      
      // 监听上传进度
      uploadTask.onProgressUpdate((res) => {
        console.log('上传进度:', res.progress);
        // 这里可以添加进度条逻辑
      });
    });
  }
}); 