'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 先检查并更新现有的综合分类为全部
    const existingCategories = await queryInterface.sequelize.query(
      'SELECT * FROM categories WHERE id = 1',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    if (existingCategories.length > 0) {
      // 更新现有分类从"综合"到"全部"
      await queryInterface.sequelize.query(
        'UPDATE categories SET name = "全部", sort = 1 WHERE id = 1'
      );
    } else {
      // 如果不存在则创建"全部"分类
      await queryInterface.bulkInsert('categories', [{
        id: 1,
        name: '全部',
        icon: 'all',
        sort: 1,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
    
    // 添加其他分类
    await queryInterface.bulkInsert('categories', [
      {
        name: '活动',
        icon: 'activity',
        sort: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: '求助',
        icon: 'help',
        sort: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: '失物招领',
        icon: 'lost',
        sort: 4,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: '二手市场',
        icon: 'market',
        sort: 5,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: '招聘兼职',
        icon: 'recruit',
        sort: 6,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: '情感',
        icon: 'emotion',
        sort: 7,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    // 保留ID为1的分类，将其恢复为"综合"
    await queryInterface.sequelize.query(
      'UPDATE categories SET name = "综合", sort = 0 WHERE id = 1'
    );
    
    // 删除其他添加的分类
    await queryInterface.sequelize.query(
      'DELETE FROM categories WHERE id > 1'
    );
  }
};
