// 临时脚本：清除前端缓存的服务器地址
// 在浏览器控制台中运行此脚本

console.log('开始清除缓存的服务器地址...');

// 清除localStorage中的服务器相关缓存
try {
  localStorage.removeItem('user_server_url');
  localStorage.removeItem('best_server_ip');
  localStorage.removeItem('uni-id-token');
  localStorage.removeItem('uni-id-token-expired');
  console.log('✅ localStorage缓存已清除');
} catch (error) {
  console.error('❌ 清除localStorage失败:', error);
}

// 清除sessionStorage中的缓存
try {
  sessionStorage.clear();
  console.log('✅ sessionStorage缓存已清除');
} catch (error) {
  console.error('❌ 清除sessionStorage失败:', error);
}

// 如果是uni-app环境，清除uni.storage
if (typeof uni !== 'undefined') {
  try {
    uni.removeStorageSync('user_server_url');
    uni.removeStorageSync('best_server_ip');
    uni.removeStorageSync('token');
    console.log('✅ uni.storage缓存已清除');
  } catch (error) {
    console.error('❌ 清除uni.storage失败:', error);
  }
}

console.log('🎉 缓存清除完成！请刷新页面。');

// 自动刷新页面
setTimeout(() => {
  location.reload();
}, 1000);
