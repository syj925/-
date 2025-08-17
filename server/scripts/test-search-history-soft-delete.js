const { SearchHistory } = require('../src/models');

async function testSearchHistorySoftDelete() {
  try {
    console.log('测试搜索历史软删除功能...');

    const userId = '650b875e-9c4f-43a1-8f27-82285784bf36';
    const testKeyword = '测试软删除';

    // 1. 创建一条测试记录
    console.log('\n1. 创建测试记录...');
    const record = await SearchHistory.create({
      userId,
      keyword: testKeyword,
      type: 'all'
    });
    console.log(`✅ 创建记录成功，ID: ${record.id}`);

    // 2. 查询记录（应该能找到）
    console.log('\n2. 查询记录...');
    const foundRecord = await SearchHistory.findByPk(record.id);
    console.log(`✅ 找到记录: ${foundRecord ? foundRecord.keyword : '未找到'}`);

    // 3. 软删除记录
    console.log('\n3. 软删除记录...');
    await record.destroy();
    console.log('✅ 软删除完成');

    // 4. 再次查询记录（应该找不到，因为启用了软删除）
    console.log('\n4. 再次查询记录（应该找不到）...');
    const notFoundRecord = await SearchHistory.findByPk(record.id);
    console.log(`结果: ${notFoundRecord ? '仍然找到' : '未找到（正常）'}`);

    // 5. 使用paranoid: false查询（应该能找到软删除的记录）
    console.log('\n5. 使用paranoid: false查询软删除记录...');
    const softDeletedRecord = await SearchHistory.findByPk(record.id, { paranoid: false });
    console.log(`结果: ${softDeletedRecord ? '找到软删除记录（正常）' : '未找到'}`);
    if (softDeletedRecord) {
      console.log(`deleted_at: ${softDeletedRecord.deleted_at}`);
    }

    // 6. 测试唯一约束（应该可以创建相同的记录，因为软删除的记录被忽略）
    console.log('\n6. 测试唯一约束（创建相同关键词的记录）...');
    try {
      const newRecord = await SearchHistory.create({
        userId,
        keyword: testKeyword,
        type: 'posts'
      });
      console.log(`✅ 成功创建相同关键词的记录，ID: ${newRecord.id}`);
      
      // 清理测试记录
      await newRecord.destroy();
      console.log('✅ 清理测试记录完成');
    } catch (error) {
      console.error('❌ 创建相同关键词记录失败:', error.message);
    }

    // 7. 物理删除软删除的记录
    console.log('\n7. 物理删除软删除记录...');
    if (softDeletedRecord) {
      await softDeletedRecord.destroy({ force: true });
      console.log('✅ 物理删除完成');
    }

  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    process.exit(0);
  }
}

testSearchHistorySoftDelete();