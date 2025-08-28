const { Post } = require('./src/models');

async function checkData() {
  try {
    // 检查帖子总数和推荐分数情况
    const totalPosts = await Post.count({ where: { status: 'published' } });
    const autoRecommended = await Post.count({ where: { status: 'published', auto_recommended: true } });
    const manualRecommended = await Post.count({ where: { status: 'published', is_recommended: true } });
    
    // 检查推荐分数分布
    const scoreStats = await Post.findAll({
      where: { status: 'published' },
      attributes: ['id', 'title', 'recommend_score', 'auto_recommended', 'is_recommended', 'score_updated_at'],
      order: [['recommend_score', 'DESC']],
      limit: 10
    });
    
    console.log('📊 推荐数据统计:');
    console.log('总帖子数:', totalPosts);
    console.log('算法推荐数:', autoRecommended);
    console.log('手动推荐数:', manualRecommended);
    console.log('');
    console.log('📈 前10个帖子的推荐分数:');
    scoreStats.forEach(post => {
      console.log(`ID:${post.id} | 分数:${post.recommend_score} | 算法推荐:${post.auto_recommended} | 手动推荐:${post.is_recommended} | 更新时间:${post.score_updated_at} | 标题:${post.title?.slice(0,30)}`);
    });
    
    // 检查最新的帖子
    console.log('');
    console.log('📝 最新发布的5个帖子:');
    const latestPosts = await Post.findAll({
      where: { status: 'published' },
      attributes: ['id', 'title', 'recommend_score', 'auto_recommended', 'is_recommended', 'score_updated_at', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    latestPosts.forEach(post => {
      console.log(`ID:${post.id} | 创建时间:${post.created_at} | 分数:${post.recommend_score} | 算法推荐:${post.auto_recommended} | 标题:${post.title?.slice(0,30)}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 检查失败:', error);
    process.exit(1);
  }
}

checkData();
