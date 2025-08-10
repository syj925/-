'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('banners', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        comment: '轮播图ID'
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '轮播图标题'
      },
      image: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: '轮播图片URL'
      },
      linkType: {
        type: Sequelize.ENUM('url', 'post', 'topic', 'event', 'page'),
        defaultValue: 'url',
        field: 'link_type',
        comment: '链接类型'
      },
      linkValue: {
        type: Sequelize.STRING(255),
        allowNull: true,
        field: 'link_value',
        comment: '链接值'
      },
      targetId: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'target_id',
        comment: '目标资源ID'
      },
      scene: {
        type: Sequelize.ENUM('home', 'discover', 'search-main', 'search-topic'),
        defaultValue: 'home',
        comment: '展示场景'
      },
      platform: {
        type: Sequelize.ENUM('app', 'web', 'admin', 'all'),
        defaultValue: 'all',
        comment: '展示平台'
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        field: 'sort_order',
        comment: '排序权重'
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '优先级'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active',
        comment: '状态'
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'start_time',
        comment: '开始时间'
      },
      endTime: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'end_time',
        comment: '结束时间'
      },
      clickCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        field: 'click_count',
        comment: '点击次数'
      },
      viewCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        field: 'view_count',
        comment: '展示次数'
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '标签（JSON数组）'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'created_at',
        comment: '创建时间'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'updated_at',
        comment: '更新时间'
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'deleted_at',
        comment: '删除时间'
      }
    }, {
      comment: '轮播图表'
    });

    // 创建索引
    await queryInterface.addIndex('banners', ['scene', 'platform', 'status'], {
      name: 'idx_banners_scene_platform_status'
    });
    
    await queryInterface.addIndex('banners', ['sort_order', 'priority'], {
      name: 'idx_banners_sort_priority'
    });
    
    await queryInterface.addIndex('banners', ['start_time', 'end_time'], {
      name: 'idx_banners_time_range'
    });

    await queryInterface.addIndex('banners', ['status'], {
      name: 'idx_banners_status'
    });

    await queryInterface.addIndex('banners', ['scene'], {
      name: 'idx_banners_scene'
    });

    // 插入演示数据
    await queryInterface.bulkInsert('banners', [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: '欢迎来到校园墙',
        image: '/uploads/banners/welcome-banner.jpg',
        link_type: 'page',
        link_value: '/pages/about/index',
        scene: 'home',
        platform: 'all',
        sort_order: 1,
        priority: 10,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: '发现热门话题',
        image: '/uploads/banners/topics-banner.jpg',
        link_type: 'page',
        link_value: '/pages/topic/list',
        scene: 'discover',
        platform: 'all',
        sort_order: 1,
        priority: 8,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        title: '搜索发现更多',
        image: '/uploads/banners/search-banner.jpg',
        link_type: 'page',
        link_value: '/pages/search/index',
        scene: 'search-main',
        platform: 'all',
        sort_order: 1,
        priority: 6,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        title: '热门话题推荐',
        image: '/uploads/banners/topic-promo-banner.jpg',
        link_type: 'page',
        link_value: '/pages/topic/list',
        scene: 'search-topic',
        platform: 'all',
        sort_order: 1,
        priority: 4,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('banners');
  }
};
