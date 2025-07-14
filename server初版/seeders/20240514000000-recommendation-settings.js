'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('settings', [
      {
        key: 'likeWeight',
        value: '2.0',
        description: '推荐算法中点赞的权重系数',
        type: 'number',
        is_system: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'commentWeight',
        value: '3.0',
        description: '推荐算法中评论的权重系数',
        type: 'number',
        is_system: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'collectionWeight',
        value: '4.0',
        description: '推荐算法中收藏的权重系数',
        type: 'number',
        is_system: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'viewWeight',
        value: '0.5',
        description: '推荐算法中浏览量的权重系数',
        type: 'number',
        is_system: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'timeDecayDays',
        value: '10',
        description: '推荐算法中时间衰减的半衰期(天)',
        type: 'number',
        is_system: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'maxAgeDays',
        value: '30',
        description: '推荐算法中内容的最大持续天数',
        type: 'number',
        is_system: true,
        created_at: now,
        updated_at: now
      },
      {
        key: 'maxAdminRecommended',
        value: '5',
        description: '首页显示的管理员推荐内容的最大数量',
        type: 'number',
        is_system: true,
        created_at: now,
        updated_at: now
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('settings', {
      key: {
        [Sequelize.Op.in]: [
          'likeWeight',
          'commentWeight',
          'collectionWeight',
          'viewWeight',
          'timeDecayDays',
          'maxAgeDays',
          'maxAdminRecommended'
        ]
      }
    }, {});
  }
}; 