const { Post } = require('./src/models');
const calculator = require('./src/services/recommendation-score-calculator.js');

async function debugCalculation() {
  try {
    console.log('🔍 调试推荐分数计算逻辑...');
    
    // 1. 获取推荐设置
    const settings = await calculator.getRecommendationSettings();
    console.log('📊 当前推荐设置:');
    console.log(JSON.stringify(settings, null, 2));
    console.log('');
    
    // 2. 获取一个真实的帖子
    const post = await Post.findOne({
      where: { status: 'published' },
      include: [
        {
          model: require('./src/models').PostImage,
          as: 'images',
          attributes: ['id']
        },
        {
          model: require('./src/models').Topic,
          as: 'topics',
          attributes: ['id'],
          through: { attributes: [] }
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    if (!post) {
      console.log('❌ 没有找到帖子');
      return;
    }
    
    console.log('📝 测试帖子信息:');
    console.log('ID:', post.id);
    console.log('标题:', post.title);
    console.log('点赞数:', post.like_count);
    console.log('评论数:', post.comment_count);
    console.log('收藏数:', post.favorite_count);
    console.log('浏览数:', post.view_count);
    console.log('图片数:', post.images ? post.images.length : 0);
    console.log('话题数:', post.topics ? post.topics.length : 0);
    console.log('内容长度:', post.content ? post.content.length : 0);
    console.log('创建时间:', post.created_at);
    console.log('');
    
    // 3. 手动计算分数（模拟算法逻辑）
    const now = new Date();
    
    // 基础互动分数
    const baseScore = 
      (post.like_count || 0) * (settings.likeWeight || 0) +
      (post.comment_count || 0) * (settings.commentWeight || 0) +
      (post.favorite_count || 0) * (settings.collectionWeight || 0) +
      (post.view_count || 0) * (settings.viewWeight || 0);
    
    console.log('🧮 分数计算详情:');
    console.log('点赞分数:', (post.like_count || 0), '×', (settings.likeWeight || 0), '=', (post.like_count || 0) * (settings.likeWeight || 0));
    console.log('评论分数:', (post.comment_count || 0), '×', (settings.commentWeight || 0), '=', (post.comment_count || 0) * (settings.commentWeight || 0));
    console.log('收藏分数:', (post.favorite_count || 0), '×', (settings.collectionWeight || 0), '=', (post.favorite_count || 0) * (settings.collectionWeight || 0));
    console.log('浏览分数:', (post.view_count || 0), '×', (settings.viewWeight || 0), '=', (post.view_count || 0) * (settings.viewWeight || 0));
    console.log('基础分数:', baseScore);
    
    // 时间衰减
    const ageInDays = (now - new Date(post.created_at)) / (1000 * 60 * 60 * 24);
    const timeFactor = Math.exp(-ageInDays / (settings.timeDecayDays || 10));
    console.log('帖子年龄(天):', ageInDays.toFixed(2));
    console.log('时间衰减因子:', timeFactor.toFixed(4));
    
    // 新帖保护
    const isNewPost = ageInDays < 1;
    const hasMinimalInteraction = (post.like_count + post.comment_count + post.favorite_count) < 3;
    const newPostBonus = (isNewPost && hasMinimalInteraction) ? (settings.newPostBonus || 0) : 0;
    console.log('是否新帖:', isNewPost);
    console.log('互动较少:', hasMinimalInteraction);
    console.log('新帖保护加分:', newPostBonus);
    
    // 质量加分
    let qualityBonus = 0;
    if (post.images && post.images.length > 0) {
      qualityBonus += (settings.imageBonus || 0);
    }
    if (post.content && post.content.length > 100) {
      qualityBonus += (settings.contentBonus || 0);
    }
    if (post.topics && post.topics.length > 0) {
      qualityBonus += (settings.topicBonus || 0);
    }
    console.log('质量加分:', qualityBonus);
    
    // 最终分数
    const finalScore = (baseScore * timeFactor + newPostBonus + qualityBonus);
    console.log('');
    console.log('🎯 最终计算:');
    console.log('(基础分数 × 时间衰减 + 新帖保护 + 质量加分)');
    console.log(`(${baseScore} × ${timeFactor.toFixed(4)} + ${newPostBonus} + ${qualityBonus}) = ${finalScore.toFixed(2)}`);
    console.log('分数阈值:', settings.scoreThreshold);
    console.log('是否达到推荐标准:', finalScore >= settings.scoreThreshold ? '✅ 是' : '❌ 否');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 调试失败:', error);
    process.exit(1);
  }
}

debugCalculation();
