const { sequelize } = require('../src/models');
const logger = require('../config/logger');

async function recreateTagsTable() {
  try {
    logger.info('开始重建标签表...');

    // 获取查询接口
    const queryInterface = sequelize.getQueryInterface();
    
    // 删除现有表
    try {
      await queryInterface.dropTable('tags');
      logger.info('已删除现有标签表');
    } catch (error) {
      logger.info('标签表不存在，继续创建...');
    }
    
    // 导入迁移文件
    const migration = require('../src/migrations/20250127-create-tags-table.js');
    
    // 执行迁移
    await migration.up(queryInterface, sequelize.constructor);
    
    logger.info('标签表重建成功！');
    
    // 验证表是否创建成功
    const tables = await queryInterface.showAllTables();
    if (tables.includes('tags')) {
      logger.info('标签表创建成功，已添加初始数据');
      
      // 查询插入的数据
      const [results] = await sequelize.query('SELECT COUNT(*) as count FROM tags');
      logger.info(`标签表中已有 ${results[0].count} 条记录`);
    } else {
      logger.error('标签表创建失败');
    }
    
  } catch (error) {
    logger.error('标签表重建失败:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
}

// 运行迁移
if (require.main === module) {
  recreateTagsTable();
}

module.exports = recreateTagsTable;


