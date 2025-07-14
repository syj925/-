/**
 * 检查categories表数据
 */
const db = require('./models');

async function checkCategories() {
  try {
    console.log('直接查询数据库中的分类数据...');
    
    // 使用原始SQL查询
    const [results] = await db.sequelize.query('SELECT * FROM categories');
    
    console.log('数据库中的分类记录数量:', results.length);
    console.log('分类记录详情:', JSON.stringify(results, null, 2));
    
    // 特别检查status字段
    console.log('\n状态字段分析:');
    const statusMap = {};
    results.forEach(category => {
      const status = category.status;
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    console.log('状态字段分布:', statusMap);
    
    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error);
    process.exit(1);
  }
}

checkCategories(); 