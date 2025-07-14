const { Badge, UserBadge, sequelize } = require('../models/associations');

/**
 * 同步Badge和UserBadge表
 */
async function syncBadgeTables() {
  try {
    console.log('开始同步Badge和UserBadge表...');
    
    // 同步Badge表
    await Badge.sync({ alter: true });
    console.log('Badge表同步完成');
    
    // 同步UserBadge表
    await UserBadge.sync({ alter: true });
    console.log('UserBadge表同步完成');
    
    // 创建初始标签
    const initialBadges = [
      {
        name: '校园达人',
        description: '活跃于校园社区的资深用户',
        color: '#4A90E2',
        status: true
      },
      {
        name: '优质创作者',
        description: '发布多篇高质量内容的用户',
        color: '#F5A623',
        status: true
      },
      {
        name: '官方认证',
        description: '经过平台认证的官方账号',
        color: '#D0021B',
        status: true
      }
    ];
    
    // 检查并创建初始标签
    for (const badgeData of initialBadges) {
      const existingBadge = await Badge.findOne({
        where: { name: badgeData.name }
      });
      
      if (!existingBadge) {
        await Badge.create(badgeData);
        console.log(`创建初始标签: ${badgeData.name}`);
      } else {
        console.log(`标签已存在: ${badgeData.name}`);
      }
    }
    
    console.log('Badge和UserBadge表同步和初始化完成!');
    process.exit(0);
  } catch (error) {
    console.error('同步Badge和UserBadge表失败:', error);
    process.exit(1);
  }
}

// 执行同步
syncBadgeTables(); 