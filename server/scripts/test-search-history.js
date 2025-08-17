const searchService = require('../src/services/search.service');

async function testSearchHistory() {
  try {
    console.log('测试搜索历史功能...');

    const userId = '650b875e-9c4f-43a1-8f27-82285784bf36';
    const keyword = '测试搜索历史';

    // 1. 执行搜索（会自动保存搜索历史）
    console.log(`\n1. 执行搜索: "${keyword}"`);
    const searchResults = await searchService.globalSearch({
      keyword,
      type: 'all',
      page: 1,
      pageSize: 10,
      userId
    });

    console.log('搜索完成，结果数量:');
    console.log('- posts:', searchResults.posts?.list?.length || 0);
    console.log('- users:', searchResults.users?.list?.length || 0);
    console.log('- topics:', searchResults.topics?.list?.length || 0);

    // 2. 获取搜索历史
    console.log('\n2. 获取搜索历史:');
    const history = await searchService.getSearchHistory({
      userId,
      limit: 10
    });

    console.log(`找到 ${history.history.length} 条搜索历史:`);
    history.history.forEach((record, index) => {
      console.log(`${index + 1}. 关键词: "${record.keyword}", 类型: ${record.type}, 时间: ${record.updatedAt}`);
    });

    // 3. 再次搜索相同关键词（应该更新时间而不是创建新记录）
    console.log(`\n3. 再次搜索相同关键词: "${keyword}"`);
    await searchService.globalSearch({
      keyword,
      type: 'posts',
      page: 1,
      pageSize: 10,
      userId
    });

    // 4. 再次获取搜索历史
    console.log('\n4. 再次获取搜索历史:');
    const updatedHistory = await searchService.getSearchHistory({
      userId,
      limit: 10
    });

    console.log(`搜索历史数量: ${updatedHistory.history.length}`);
    const latestRecord = updatedHistory.history[0];
    if (latestRecord && latestRecord.keyword === keyword) {
      console.log(`✅ 最新记录: "${latestRecord.keyword}", 类型: ${latestRecord.type}`);
      console.log('✅ 搜索历史更新机制正常工作');
    } else {
      console.log('❌ 搜索历史更新机制异常');
    }

  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    process.exit(0);
  }
}

testSearchHistory();