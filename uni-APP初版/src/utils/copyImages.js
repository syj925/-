/**
 * 图片复制重命名脚本
 * 用于将中文图片名称复制为英文名称
 */

const fs = require('fs');
const path = require('path');

// 图片映射
const imageMap = {
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
  '系统通知.png': 'system-notification.png'
};

// 目录映射
const directoryMappings = [
  { source: 'static/icons', target: 'static/icons-en' },
  { source: 'static/images', target: 'static/images-en' },
  { source: 'src/static/icons', target: 'src/static/icons-en' },
  { source: 'src/static/images', target: 'src/static/images-en' }
];

// 复制单个文件
function copyFile(sourcePath, targetPath) {
  try {
    const data = fs.readFileSync(sourcePath);
    fs.writeFileSync(targetPath, data);
    console.log(`复制成功: ${sourcePath} -> ${targetPath}`);
    return true;
  } catch (err) {
    console.error(`复制失败: ${sourcePath} -> ${targetPath}`);
    console.error(err.message);
    return false;
  }
}

// 递归扫描目录
function scanDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);
    const imagesFound = [];
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // 递归扫描子目录
        const subDirImages = scanDirectory(filePath);
        imagesFound.push(...subDirImages);
      } else if (Object.keys(imageMap).includes(file)) {
        // 找到匹配的图片文件
        imagesFound.push({ path: filePath, name: file });
      }
    });
    
    return imagesFound;
  } catch (err) {
    console.error(`扫描目录失败: ${dir}`);
    console.error(err.message);
    return [];
  }
}

// 创建目录
function createDirectories() {
  directoryMappings.forEach(mapping => {
    const targetDir = mapping.target;
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`创建目录: ${targetDir}`);
      }
    } catch (err) {
      console.error(`创建目录失败: ${targetDir}`);
      console.error(err.message);
    }
  });
}

// 复制并重命名图片
function copyAndRenameImages() {
  // 首先创建目标目录
  createDirectories();
  
  // 扫描所有目录寻找中文图片
  let allImages = [];
  directoryMappings.forEach(mapping => {
    if (fs.existsSync(mapping.source)) {
      const images = scanDirectory(mapping.source);
      allImages = allImages.concat(images);
    }
  });
  
  // 复制并重命名找到的图片
  console.log(`\n找到 ${allImages.length} 个需要重命名的图片文件。\n`);
  
  let successCount = 0;
  allImages.forEach(image => {
    const chineseFileName = image.name;
    const englishFileName = imageMap[chineseFileName];
    
    if (!englishFileName) {
      console.warn(`警告: 没有找到 ${chineseFileName} 的英文名映射`);
      return;
    }
    
    // 确定目标路径
    let targetPath = '';
    for (const mapping of directoryMappings) {
      if (image.path.includes(mapping.source)) {
        targetPath = image.path.replace(mapping.source, mapping.target);
        break;
      }
    }
    
    if (!targetPath) {
      targetPath = image.path.replace(chineseFileName, englishFileName);
    } else {
      targetPath = targetPath.replace(chineseFileName, englishFileName);
    }
    
    // 复制文件
    const success = copyFile(image.path, targetPath);
    if (success) successCount++;
  });
  
  console.log(`\n完成! 成功复制重命名 ${successCount} / ${allImages.length} 个图片文件。`);
}

// 执行
copyAndRenameImages(); 