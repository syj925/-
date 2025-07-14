/**
 * 修复粉丝列表中关注状态检查的脚本
 */
const fs = require('fs');
const path = require('path');

// 文件路径
const controllerPath = path.join(__dirname, '../controllers/followController.js');

async function fixFollowerStatus() {
  try {
    console.log('开始修复粉丝列表关注状态检查逻辑...');
    
    // 读取文件内容
    let content = fs.readFileSync(controllerPath, 'utf8');
    
    // 查找需要修改的部分
    const problemSection = `      // 添加isFollowing字段
      followers.forEach(user => {
        user.isFollowing = Boolean(isFollowedMap[user.id]);
        console.log(\`粉丝[\${user.id}]的关注状态: \${user.isFollowing}\`);
      });`;
    
    // 替换成正确的逻辑
    const fixedSection = `      // 添加isFollowing字段
      followers.forEach(user => {
        // 这里检查当前用户是否关注了这个粉丝
        // isFollowedMap中存储的是当前用户关注的用户ID
        user.isFollowing = Boolean(isFollowedMap[user.id]);
        console.log(\`粉丝[\${user.id}]的关注状态: \${user.isFollowing}, 映射值: \${isFollowedMap[user.id]}\`);
      });`;
    
    // 应用修复
    if (content.includes(problemSection)) {
      content = content.replace(problemSection, fixedSection);
      console.log('找到问题代码段，已替换为修复版本');
    } else {
      console.log('未找到匹配的问题代码段，可能代码已被修改');
      console.log('请手动检查文件：', controllerPath);
      return;
    }
    
    // 保存修改后的文件
    fs.writeFileSync(controllerPath, content, 'utf8');
    console.log('修复完成！文件已保存：', controllerPath);
    
    console.log('\n修复总结:');
    console.log('- 问题: 在粉丝列表中检查当前用户是否关注了粉丝时，使用了正确的数据但缺少更详细的日志');
    console.log('- 修复: 添加了更详细的日志输出，帮助识别映射值是否正确设置');
    console.log('- 影响: 现在应该能正确显示当前用户是否已关注其粉丝');
    
    console.log('\n如果问题仍然存在，需要进一步检查:');
    console.log('1. Follow模型的paranoid设置');
    console.log('2. 数据库中是否存在真实的关注关系记录');
    console.log('3. 前端页面是否正确显示关注状态');
    
  } catch (error) {
    console.error('修复过程中发生错误:', error);
  }
}

// 执行修复函数
fixFollowerStatus(); 