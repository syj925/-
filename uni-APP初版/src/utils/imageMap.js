/**
 * 图片映射表 - 中文名称到英文名称的映射
 * 用于替换项目中的中文图片路径为英文路径
 */
export const imageMap = {
  // static/icons目录
  '关注.png': 'follow.png',
  '分享.png': 'share.png',
  '失物招领.png': 'lost-found.png',
  '学习交流.png': 'study-exchange.png',
  '我的帖子.png': 'my-posts.png',
  '招聘信息.png': 'recruitment.png',
  '更多.png': 'more.png',
  '校园活动.png': 'campus-activity.png',
  '粉丝.png': 'fans.png',
  '获赞.png': 'likes.png',
  '评论小.png': 'comment-small.png',
  '我的页_我的收藏.png': 'my-favorites.png',
  '设置.png': 'settings.png',

  // src/static/icons目录
  'icon_左退出.png': 'icon_back.png',
  '向下.png': 'arrow-down.png',
  '密码.png': 'password.png',
  '收藏.png': 'favorite.png',
  '账号.png': 'account.png',

  // src/static/images目录
  '_意见反馈.png': 'feedback.png',
  '关于我们.png': 'about-us.png',
  '清除缓存.png': 'clear-cache.png',
  '黑名单管理.png': 'blacklist-manage.png',
  '账号安全.png': 'account-security.png',
  '隐私设置.png': 'privacy-settings.png',

  // 其他可能在代码中引用的中文图片
  '系统通知.png': 'system-notification.png',
  'empty-message.png': 'empty-message.png', // 已经是英文，保持不变
};

/**
 * 获取映射后的图片路径
 * @param {string} path 原始图片路径
 * @returns {string} 映射后的图片路径
 */
export function getMappedImagePath(path) {
  if (!path) return path;
  
  // 提取文件名
  const fileName = path.split('/').pop();
  
  // 检查是否有映射关系
  if (imageMap[fileName]) {
    return path.replace(fileName, imageMap[fileName]);
  }
  
  // 如果没有映射关系，返回原始路径
  return path;
}

export default { imageMap, getMappedImagePath }; 