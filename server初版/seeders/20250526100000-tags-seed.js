'use strict';

/**
 * 标签种子数据
 * 用于初始化标签数据
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const adminId = 1; // 假设管理员用户ID为1
    
    // 兴趣爱好标签
    const interestTags = [
      { name: '阅读', category: 'interest', color: '#1976D2', description: '爱好阅读各类书籍' },
      { name: '旅行', category: 'interest', color: '#4CAF50', description: '热爱探索新的地方' },
      { name: '音乐', category: 'interest', color: '#9C27B0', description: '音乐爱好者' },
      { name: '摄影', category: 'interest', color: '#FF5722', description: '热爱摄影艺术' },
      { name: '电影', category: 'interest', color: '#795548', description: '电影爱好者' },
      { name: '游戏', category: 'interest', color: '#607D8B', description: '游戏玩家' },
      { name: '烹饪', category: 'interest', color: '#FF9800', description: '喜欢下厨' },
      { name: '健身', category: 'interest', color: '#F44336', description: '保持健康生活方式' },
      { name: '绘画', category: 'interest', color: '#3F51B5', description: '艺术创作' },
      { name: '编程', category: 'interest', color: '#009688', description: '编写代码' },
    ];
    
    // 专业技能标签
    const skillTags = [
      { name: 'Java', category: 'skill', color: '#E65100', description: '掌握Java编程语言' },
      { name: 'Python', category: 'skill', color: '#1565C0', description: '掌握Python编程语言' },
      { name: '前端开发', category: 'skill', color: '#00796B', description: '网页前端技术栈' },
      { name: '数据分析', category: 'skill', color: '#6A1B9A', description: '数据处理与分析能力' },
      { name: '机器学习', category: 'skill', color: '#AD1457', description: 'AI与机器学习' },
      { name: '设计', category: 'skill', color: '#283593', description: 'UI/UX设计技能' },
      { name: '营销', category: 'skill', color: '#2E7D32', description: '市场营销策略' },
      { name: '管理', category: 'skill', color: '#4E342E', description: '项目或团队管理' },
    ];
    
    // 学院专业标签
    const majorTags = [
      { name: '计算机科学', category: 'major', color: '#0277BD', description: '计算机科学与技术' },
      { name: '软件工程', category: 'major', color: '#558B2F', description: '软件设计与开发' },
      { name: '人工智能', category: 'major', color: '#6D4C41', description: 'AI与机器智能' },
      { name: '电子信息', category: 'major', color: '#F57F17', description: '电子信息工程' },
      { name: '数学', category: 'major', color: '#1A237E', description: '数学与应用数学' },
      { name: '物理', category: 'major', color: '#006064', description: '物理学' },
      { name: '化学', category: 'major', color: '#4A148C', description: '化学相关专业' },
      { name: '生物', category: 'major', color: '#33691E', description: '生命科学' },
      { name: '经济学', category: 'major', color: '#827717', description: '经济学相关专业' },
      { name: '管理学', category: 'major', color: '#BF360C', description: '管理学相关专业' },
    ];
    
    // 年级标签
    const gradeTags = [
      { name: '大一', category: 'grade', color: '#2962FF', description: '大学一年级' },
      { name: '大二', category: 'grade', color: '#00B8D4', description: '大学二年级' },
      { name: '大三', category: 'grade', color: '#00C853', description: '大学三年级' },
      { name: '大四', category: 'grade', color: '#FFEA00', description: '大学四年级' },
      { name: '研一', category: 'grade', color: '#FF6D00', description: '研究生一年级' },
      { name: '研二', category: 'grade', color: '#DD2C00', description: '研究生二年级' },
      { name: '研三', category: 'grade', color: '#AA00FF', description: '研究生三年级' },
      { name: '博士', category: 'grade', color: '#6200EA', description: '博士研究生' },
    ];
    
    // 合并所有标签并添加通用属性
    const allTags = [...interestTags, ...skillTags, ...majorTags, ...gradeTags].map((tag, index) => ({
      ...tag,
      status: index % 10 === 0 ? 'hot' : 'normal', // 每10个标签设置1个为热门
      usage_count: Math.floor(Math.random() * 100), // 随机使用次数
      sort_order: index,
      creator_id: adminId,
      created_at: now,
      updated_at: now
    }));
    
    // 将所有标签插入数据库
    await queryInterface.bulkInsert('tags', allTags, {});
  },

  down: async (queryInterface, Sequelize) => {
    // 删除所有标签数据
    await queryInterface.bulkDelete('tags', null, {});
  }
}; 