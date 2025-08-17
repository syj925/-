const searchService = require('../src/services/search.service');

async function testSearchAPI() {
    try {
        console.log('测试搜索API...');

        // 测试搜索关键词"某某"
        const keyword = '某某';
        console.log(`\n测试搜索关键词: "${keyword}"`);

        const results = await searchService.globalSearch({
            keyword,
            type: 'all',
            page: 1,
            pageSize: 10,
            userId: '650b875e-9c4f-43a1-8f27-82285784bf36' // 使用实际的用户ID
        });

        console.log('\n搜索结果结构:');
        console.log('- posts:', results.posts ? `${results.posts.list?.length || 0} 条` : '无');
        console.log('- users:', results.users ? `${results.users.list?.length || 0} 条` : '无');
        console.log('- topics:', results.topics ? `${results.topics.list?.length || 0} 条` : '无');

        if (results.posts?.list?.length > 0) {
            console.log('\n帖子结果示例:');
            console.log(JSON.stringify(results.posts.list[0], null, 2));
        }

        if (results.users?.list?.length > 0) {
            console.log('\n用户结果示例:');
            console.log(JSON.stringify(results.users.list[0], null, 2));
        }

        if (results.topics?.list?.length > 0) {
            console.log('\n话题结果示例:');
            console.log(JSON.stringify(results.topics.list[0], null, 2));
        }

        // 检查数据库中的用户数据
        const { sequelize } = require('../src/models');
        const [userCheck] = await sequelize.query('SELECT id, username, nickname FROM users WHERE username LIKE "%某某%" OR nickname LIKE "%某某%"');
        console.log('\n数据库中匹配"某某"的用户:');
        userCheck.forEach(user => {
            console.log(`ID: ${user.id}, Username: ${user.username}, Nickname: ${user.nickname}`);
            console.log(`是否为当前用户: ${user.id === '650b875e-9c4f-43a1-8f27-82285784bf36'}`);
        });

        // 测试不提供userId的搜索
        console.log('\n\n测试不提供userId的搜索:');
        const noUserResults = await searchService.globalSearch({
            keyword: '某某',
            type: 'all',
            page: 1,
            pageSize: 10,
            userId: null // 不提供用户ID
        });

        console.log('不提供userId的搜索结果:');
        console.log('- posts:', noUserResults.posts ? `${noUserResults.posts.list?.length || 0} 条` : '无');
        console.log('- users:', noUserResults.users ? `${noUserResults.users.list?.length || 0} 条` : '无');
        console.log('- topics:', noUserResults.topics ? `${noUserResults.topics.list?.length || 0} 条` : '无');

        // 测试一个更通用的关键词
        console.log('\n\n测试通用关键词: "测试"');
        const testResults = await searchService.globalSearch({
            keyword: '测试',
            type: 'all',
            page: 1,
            pageSize: 10,
            userId: '650b875e-9c4f-43a1-8f27-82285784bf36'
        });

        console.log('\n"测试"搜索结果:');
        console.log('- posts:', testResults.posts ? `${testResults.posts.list?.length || 0} 条` : '无');
        console.log('- users:', testResults.users ? `${testResults.users.list?.length || 0} 条` : '无');
        console.log('- topics:', testResults.topics ? `${testResults.topics.list?.length || 0} 条` : '无');

    } catch (error) {
        console.error('测试失败:', error);
    } finally {
        process.exit(0);
    }
}

testSearchAPI();