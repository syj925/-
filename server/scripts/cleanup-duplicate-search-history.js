const { sequelize } = require('../src/models');

async function cleanupDuplicateSearchHistory() {
    try {
        console.log('开始清理重复的搜索历史记录...');

        // 创建临时表，只保留每个用户每个关键词的最新记录
        const createTempQuery = `
      CREATE TEMPORARY TABLE temp_search_histories AS
      SELECT s1.*
      FROM search_histories s1
      INNER JOIN (
        SELECT user_id, keyword, MAX(updated_at) as max_updated_at
        FROM search_histories
        GROUP BY user_id, keyword
      ) s2 ON s1.user_id = s2.user_id 
           AND s1.keyword = s2.keyword 
           AND s1.updated_at = s2.max_updated_at
    `;

        await sequelize.query(createTempQuery);
        console.log('✅ 创建临时表成功');

        // 清空原表
        await sequelize.query('DELETE FROM search_histories');
        console.log('✅ 清空原表成功');

        // 从临时表恢复数据
        await sequelize.query(`
      INSERT INTO search_histories (id, user_id, keyword, type, created_at, updated_at)
      SELECT id, user_id, keyword, type, created_at, updated_at
      FROM temp_search_histories
    `);
        console.log('✅ 恢复数据成功');

        // 检查清理后的重复记录
        const checkQuery = `
      SELECT user_id, keyword, COUNT(*) as count 
      FROM search_histories 
      GROUP BY user_id, keyword 
      HAVING count > 1
    `;

        const [duplicates] = await sequelize.query(checkQuery);

        if (duplicates.length === 0) {
            console.log('✅ 清理完成，没有重复记录了');

            // 创建唯一约束
            try {
                await sequelize.query('ALTER TABLE search_histories ADD UNIQUE INDEX search_histories_user_id_keyword (user_id, keyword)');
                console.log('✅ 成功创建唯一约束');
            } catch (error) {
                console.error('❌ 创建唯一约束失败:', error.message);
            }
        } else {
            console.log('❌ 仍有重复记录:');
            duplicates.forEach(row => {
                console.log(`用户: ${row.user_id}, 关键词: ${row.keyword}, 重复次数: ${row.count}`);
            });
        }

        // 显示最终记录数
        const [countResult] = await sequelize.query('SELECT COUNT(*) as total FROM search_histories');
        console.log(`最终搜索历史记录数: ${countResult[0].total}`);

    } catch (error) {
        console.error('清理失败:', error);
    } finally {
        await sequelize.close();
    }
}

cleanupDuplicateSearchHistory();