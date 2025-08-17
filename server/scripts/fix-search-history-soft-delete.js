const { sequelize } = require('../src/models');

async function fixSearchHistorySoftDelete() {
  try {
    console.log('检查搜索历史表的软删除问题...');

    // 1. 检查表结构
    const [tableStructure] = await sequelize.query('DESCRIBE search_histories');
    console.log('\n表结构:');
    tableStructure.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key} ${col.Default || ''}`);
    });

    // 2. 检查软删除记录
    const [softDeletedRecords] = await sequelize.query(`
      SELECT id, user_id, keyword, type, created_at, updated_at, deleted_at 
      FROM search_histories 
      WHERE deleted_at IS NOT NULL
    `);
    
    console.log(`\n找到 ${softDeletedRecords.length} 条软删除记录:`);
    softDeletedRecords.forEach(record => {
      console.log(`ID: ${record.id}, 用户: ${record.user_id}, 关键词: ${record.keyword}, 删除时间: ${record.deleted_at}`);
    });

    if (softDeletedRecords.length > 0) {
      console.log('\n开始清理软删除记录...');
      
      // 3. 物理删除软删除的记录
      const [deleteResult] = await sequelize.query(`
        DELETE FROM search_histories WHERE deleted_at IS NOT NULL
      `);
      
      console.log(`✅ 成功删除 ${deleteResult.affectedRows} 条软删除记录`);
    }

    // 4. 验证清理结果
    const [finalCheck] = await sequelize.query(`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted 
      FROM search_histories
    `);
    
    console.log('\n清理后的统计:');
    console.log('总记录数:', finalCheck[0].total);
    console.log('软删除记录数:', finalCheck[0].deleted);

    // 5. 测试插入一条记录
    console.log('\n测试插入记录...');
    const testUserId = '650b875e-9c4f-43a1-8f27-82285784bf36';
    const testKeyword = '测试关键词';
    
    try {
      await sequelize.query(`
        INSERT INTO search_histories (user_id, keyword, type, created_at, updated_at) 
        VALUES (?, ?, 'all', NOW(), NOW())
      `, {
        replacements: [testUserId, testKeyword]
      });
      console.log('✅ 测试插入成功');
      
      // 清理测试记录
      await sequelize.query(`
        DELETE FROM search_histories 
        WHERE user_id = ? AND keyword = ?
      `, {
        replacements: [testUserId, testKeyword]
      });
      console.log('✅ 测试记录已清理');
      
    } catch (error) {
      console.error('❌ 测试插入失败:', error.message);
    }

  } catch (error) {
    console.error('修复失败:', error);
  } finally {
    await sequelize.close();
  }
}

fixSearchHistorySoftDelete();