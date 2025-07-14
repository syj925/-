/**
 * 快速修复评论点赞数脚本
 * 
 * 这个脚本用于修复comments表中的likes计数字段，使其与likes表中的实际记录数同步
 * 不需要通过API调用，可以直接在服务器上运行
 */

const { sequelize, Comment, Like } = require('../models/associations');

async function fixCommentLikes() {
  try {
    console.log('开始修复评论点赞数...');
    
    // 获取所有评论
    const comments = await Comment.findAll();
    console.log(`总共找到 ${comments.length} 条评论`);
    
    let fixed = 0;
    let unchanged = 0;
    
    // 遍历所有评论
    for (const comment of comments) {
      try {
        // 查询实际点赞数
        const actualLikes = await Like.count({
          where: {
            target_type: 'comment',
            target_id: comment.id
          }
        });
        
        // 如果点赞数不一致，进行更新
        if (comment.likes !== actualLikes) {
          console.log(`修复评论ID ${comment.id}: ${comment.likes} -> ${actualLikes}`);
          comment.likes = actualLikes;
          await comment.save();
          fixed++;
        } else {
          unchanged++;
        }
      } catch (error) {
        console.error(`处理评论 ${comment.id} 时出错:`, error.message);
      }
    }
    
    console.log(`修复完成! 已修复 ${fixed} 条评论，${unchanged} 条评论无需修改`);
    
  } catch (error) {
    console.error('修复评论点赞数失败:', error);
  } finally {
    // 关闭数据库连接
    try {
      await sequelize.close();
      console.log('数据库连接已关闭');
    } catch (error) {
      console.error('关闭数据库连接失败:', error);
    }
  }
}

// 执行修复
fixCommentLikes()
  .then(() => {
    console.log('点赞数修复脚本执行完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('执行修复脚本时发生错误:', error);
    process.exit(1);
  }); 