require('dotenv').config();
const { Category } = require('../src/models');
const logger = require('../config/logger');

/**
 * 创建分类
 */
async function createCategories() {
  try {
    logger.info('开始创建分类数据');
    
    // 查询已存在的分类
    const existingCategories = await Category.findAll();
    logger.info(`当前已有 ${existingCategories.length} 个分类`);
    
    // 如果已经有分类数据，则跳过
    if (existingCategories.length > 0) {
      logger.info('分类数据已存在，无需创建');
      return;
    }
    
    // 创建基础分类
    const categories = [
      { id: 1, name: '综合', icon: 'general', sort: 0 },
      { id: 2, name: '学习', icon: 'study', sort: 1 },
      { id: 3, name: '生活', icon: 'life', sort: 2 },
      { id: 4, name: '娱乐', icon: 'entertainment', sort: 3 },
      { id: 5, name: '其他', icon: 'other', sort: 4 },
    ];
    
    // 批量创建分类
    await Category.bulkCreate(categories);
    
    logger.info('分类创建成功');
    
    // 再次查询确认
    const newCategories = await Category.findAll();
    logger.info(`当前共有 ${newCategories.length} 个分类`);
    console.log(newCategories.map(cat => ({ id: cat.id, name: cat.name })));
    
  } catch (err) {
    logger.error('创建分类失败:', err);
  } finally {
    process.exit();
  }
}

// 执行函数
createCategories(); 