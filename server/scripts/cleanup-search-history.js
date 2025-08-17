/**
 * 清理搜索历史重复记录脚本
 * 移除重复的搜索历史，只保留最新的记录
 */

const { SearchHistory, sequelize } = require('../src/models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

async function cleanupDuplicateSearchHistory() {
  try {
    logger.info('开始清理重复的搜索历史记录...');

    // 使用事务确保数据一致性
    await sequelize.transaction(async (transaction) => {
      // 查找所有重复的记录组合（按用户和关键词分组，忽略类型）
      const duplicates = await sequelize.query(`
        SELECT 
          user_id, 
          keyword, 
          COUNT(*) as count,
          MIN(id) as first_id,
          MAX(id) as latest_id,
          MAX(updated_at) as latest_updated
        FROM search_histories 
        GROUP BY user_id, keyword 
        HAVING COUNT(*) > 1
        ORDER BY user_id, keyword
      `, {
        type: sequelize.QueryTypes.SELECT,
        transaction
      });

      logger.info(`发现 ${duplicates.length} 组重复记录`);

      if (duplicates.length === 0) {
        logger.info('没有发现重复记录，无需清理');
        return;
      }

      let totalRemoved = 0;

      // 处理每组重复记录
      for (const duplicate of duplicates) {
        const { user_id, keyword, count, latest_id } = duplicate;
        
        logger.info(`处理重复记录: 用户=${user_id}, 关键词="${keyword}", 重复数=${count}`);

        // 删除除了最新记录之外的所有重复记录
        const deleteResult = await SearchHistory.destroy({
          where: {
            userId: user_id,
            keyword: keyword,
            id: { [Op.ne]: latest_id }
          },
          transaction
        });

        totalRemoved += deleteResult;
        logger.info(`删除了 ${deleteResult} 条重复记录，保留最新记录 ID: ${latest_id}`);
      }

      logger.info(`清理完成，总计删除 ${totalRemoved} 条重复记录`);
    });

    // 验证清理结果
    const remainingDuplicates = await sequelize.query(`
      SELECT user_id, keyword, COUNT(*) as count
      FROM search_histories 
      GROUP BY user_id, keyword 
      HAVING COUNT(*) > 1
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    if (remainingDuplicates.length === 0) {
      logger.info('✅ 验证通过：已无重复记录');
    } else {
      logger.warn(`⚠️  仍有 ${remainingDuplicates.length} 组重复记录`);
    }

  } catch (error) {
    logger.error('清理搜索历史重复记录失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanupDuplicateSearchHistory()
    .then(() => {
      logger.info('搜索历史清理脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('搜索历史清理脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { cleanupDuplicateSearchHistory };
