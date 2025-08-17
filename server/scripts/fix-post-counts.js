/**
 * 修复帖子计数字段脚本
 * 重新计算所有帖子的like_count、favorite_count、comment_count
 */

const { sequelize } = require('../config/database');
const { Post, Like, Favorite, Comment } = require('../src/models');

async function fixPostCounts() {
  console.log('🔧 开始修复帖子计数字段...');
  
  try {
    // 开启事务
    const transaction = await sequelize.transaction();
    
    try {
      // 获取所有帖子
      const posts = await Post.findAll({
        attributes: ['id'],
        raw: true,
        transaction
      });
      
      console.log(`📊 找到 ${posts.length} 个帖子需要修复`);
      
      let fixedCount = 0;
      
      for (const post of posts) {
        const postId = post.id;
        
        // 计算实际的点赞数
        const likeCount = await Like.count({
          where: {
            target_id: postId,
            target_type: 'post'
          },
          transaction
        });
        
        // 计算实际的收藏数
        const favoriteCount = await Favorite.count({
          where: {
            post_id: postId
          },
          transaction
        });
        
        // 计算实际的评论数
        const commentCount = await Comment.count({
          where: {
            post_id: postId
          },
          transaction
        });
        
        // 更新帖子计数
        await Post.update({
          like_count: likeCount,
          favorite_count: favoriteCount,
          comment_count: commentCount
        }, {
          where: { id: postId },
          transaction
        });
        
        fixedCount++;
        
        if (fixedCount % 100 === 0) {
          console.log(`✅ 已修复 ${fixedCount}/${posts.length} 个帖子`);
        }
      }
      
      // 提交事务
      await transaction.commit();
      
      console.log(`🎉 修复完成！共修复了 ${fixedCount} 个帖子的计数字段`);
      
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixPostCounts()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = fixPostCounts;
