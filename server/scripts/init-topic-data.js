const { Topic } = require('../src/models');

/**
 * 初始化话题测试数据
 */
async function initTopicData() {
  try {
    console.log('开始初始化话题测试数据...');

    // 检查是否已有话题数据
    const existingTopics = await Topic.count();
    if (existingTopics > 0) {
      console.log(`已存在 ${existingTopics} 个话题，跳过初始化`);
      return;
    }

    // 创建测试话题数据（使用完整字段结构）
    const topicsData = [
      {
        name: '校园生活',
        description: '分享校园日常生活的点点滴滴',
        post_count: 156,
        view_count: 2340,
        hot_score: 95.6,
        is_hot: true,
        status: 'active'
      },
      {
        name: '学习交流',
        description: '学习心得、考试经验、学术讨论',
        post_count: 89,
        view_count: 1567,
        hot_score: 78.3,
        is_hot: true,
        status: 'active'
      },
      {
        name: '社团活动',
        description: '各种社团活动、招新信息、活动回顾',
        post_count: 67,
        view_count: 1234,
        hot_score: 65.2,
        is_hot: false,
        status: 'active'
      },
      {
        name: '美食推荐',
        description: '校园美食、周边餐厅推荐',
        post_count: 123,
        view_count: 2890,
        hot_score: 87.4,
        is_hot: true,
        status: 'active'
      },
      {
        name: '失物招领',
        description: '丢失和拾获物品信息发布',
        post_count: 34,
        view_count: 567,
        hot_score: 32.1,
        is_hot: false,
        status: 'active'
      },
      {
        name: '二手交易',
        description: '校内二手物品买卖交换',
        post_count: 78,
        view_count: 1456,
        hot_score: 58.9,
        is_hot: false,
        status: 'active'
      },
      {
        name: '兼职信息',
        description: '校内外兼职工作信息分享',
        post_count: 45,
        view_count: 890,
        hot_score: 42.3,
        is_hot: false,
        status: 'active'
      },
      {
        name: '运动健身',
        description: '运动打卡、健身交流、体育活动',
        post_count: 56,
        view_count: 1123,
        hot_score: 51.7,
        is_hot: false,
        status: 'active'
      },
      {
        name: '情感树洞',
        description: '心情分享、情感倾诉、心理健康',
        post_count: 92,
        view_count: 1678,
        hot_score: 72.8,
        is_hot: false,
        status: 'active'
      },
      {
        name: '技术分享',
        description: '编程技术、软件工具、IT资讯',
        post_count: 38,
        view_count: 756,
        hot_score: 38.9,
        is_hot: false,
        status: 'active'
      }
    ];

    // 批量创建话题
    const createdTopics = await Topic.bulkCreate(topicsData);
    
    console.log(`✅ 成功创建 ${createdTopics.length} 个话题：`);
    createdTopics.forEach(topic => {
      console.log(`- ${topic.name}: ${topic.description}`);
    });

    console.log('\n🎉 话题测试数据初始化完成！');
    console.log('现在您可以访问话题页面测试功能：');
    console.log('- 话题列表: http://localhost:8080/pages/topic/list');
    console.log('- API测试: http://localhost:3000/api/topics');

  } catch (error) {
    console.error('❌ 初始化话题数据失败:', error);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    await initTopicData();
    process.exit(0);
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { initTopicData };
