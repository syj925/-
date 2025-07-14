<template>
  <view></view>
</template>

<script>
export default {
  onLoad(options) {
    // 获取当前页面参数
    const id = options.id;
    
    if (id) {
      // 重定向到新的帖子详情页
      uni.redirectTo({
        url: `/pages/post/detail?id=${id}`,
        fail: (err) => {
          console.error('重定向失败:', err);
          // 如果重定向失败，提示用户
          uni.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
          
          // 回退到首页
                  setTimeout(() => {
                    uni.navigateBack();
                  }, 1500);
              }
            });
          } else {
      // 没有ID参数，返回首页
            uni.showToast({
        title: '参数错误',
              icon: 'none'
      });
      
      setTimeout(() => {
      uni.navigateBack();
      }, 1500);
    }
  }
}
</script>

<style>
</style> 