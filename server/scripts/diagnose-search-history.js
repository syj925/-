/**
 * 诊断搜索历史数据脚本
 */

const { SearchHistory, sequelize } = require('../src/models');
const logger = require('../config/logger');

async function diagnoseSearchHistory() {
  try {
    logger.info('开始诊断搜索历史数据...');

    // 查看所有搜索历史记录
    const allRecords = await SearchHistory.findAll({
      order: [['id', 'ASC']]
    });

    logger.info(`总共有 ${allRecords.length} 条搜索历史记录`);
    
    // 显示所有记录的详细信息
    allRecords.forEach(record => {
      logger.info(`ID: ${record.id}, 用户: ${record.userId}, 关键词: "${record.keyword}", 类型: ${record.type}, 创建: ${record.createdAt}, 更新: ${record.updatedAt}`);
    });

    // 按关键词分组查看数据
    const groupedData = {};
    allRecords.forEach(record => {
      const key = `${record.userId}-${record.keyword}`;
      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push({
        id: record.id,
        keyword: record.keyword,
        type: record.type,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      });
    });

    logger.info(`分组后共有 ${Object.keys(groupedData).length} 个关键词组`);
    
    // 显示重复数据
    Object.keys(groupedData).forEach(key => {
      const records = groupedData[key];
      logger.info(`关键词组 ${key}: ${records.length} 条记录`);
      if (records.length > 1) {
        logger.info(`  ❌ 重复关键词组: ${key}`);
        records.forEach(record => {
          logger.info(`    ID: ${record.id}, 关键词: "${record.keyword}", 类型: ${record.type}, 更新时间: ${record.updatedAt}`);
        });
      } else {
        logger.info(`  ✅ 正常关键词组: ${key}`);
      }
    });

    // 查找重复的记录组合（使用原生SQL）
    const duplicates = await sequelize.query(`
      SELECT 
        user_id, 
        keyword, 
        COUNT(*) as count,
        GROUP_CONCAT(id ORDER BY updated_at DESC) as ids,
        GROUP_CONCAT(type ORDER BY updated_at DESC) as types,
        MAX(updated_at) as latest_updated
      FROM search_histories 
      GROUP BY user_id, keyword 
      HAVING COUNT(*) > 1
      ORDER BY user_id, keyword
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    logger.info(`SQL查询发现 ${duplicates.length} 组重复记录`);
    duplicates.forEach(duplicate => {
      logger.info(`用户: ${duplicate.user_id}, 关键词: "${duplicate.keyword}", 数量: ${duplicate.count}`);
      logger.info(`  IDs: ${duplicate.ids}, 类型: ${duplicate.types}`);
    });

  } catch (error) {
    logger.error('诊断搜索历史失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  diagnoseSearchHistory()
    .then(() => {
      logger.info('搜索历史诊断脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('搜索历史诊断脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { diagnoseSearchHistory };
