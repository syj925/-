'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('badges', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        comment: '徽章ID'
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '徽章名称'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '徽章描述'
      },
      color: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: '#4A90E2',
        comment: '徽章颜色（十六进制）'
      },
      icon: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '徽章图标名称或路径'
      },
      type: {
        type: Sequelize.ENUM('achievement', 'interest', 'system'),
        allowNull: false,
        defaultValue: 'achievement',
        comment: '徽章类型：achievement=成就徽章, interest=兴趣标签, system=系统标签'
      },
      rarity: {
        type: Sequelize.ENUM('common', 'rare', 'epic', 'legendary'),
        allowNull: false,
        defaultValue: 'common',
        comment: '稀有度：common=普通, rare=稀有, epic=史诗, legendary=传奇'
      },
      autoGrant: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'auto_grant',
        comment: '是否自动授予'
      },
      grantCondition: {
        type: Sequelize.JSON,
        allowNull: true,
        field: 'grant_condition',
        comment: '自动授予条件配置（JSON格式）'
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'sort_order',
        comment: '排序值'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
        comment: '徽章状态'
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
        comment: '删除时间（软删除）'
      }
    }, {
      comment: '用户徽章定义表'
    });

    // 创建索引
    await queryInterface.addIndex('badges', ['name'], {
      name: 'idx_badges_name'
    });
    
    await queryInterface.addIndex('badges', ['type'], {
      name: 'idx_badges_type'
    });
    
    await queryInterface.addIndex('badges', ['status'], {
      name: 'idx_badges_status'
    });
    
    await queryInterface.addIndex('badges', ['sort_order'], {
      name: 'idx_badges_sort_order'
    });

    await queryInterface.addIndex('badges', ['type', 'status'], {
      name: 'idx_badges_type_status'
    });

    // 插入初始徽章数据
    await queryInterface.bulkInsert('badges', [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        name: '校园达人',
        description: '活跃在校园社区的用户，经常参与话题讨论和内容分享',
        color: '#FF6B35',
        icon: '🌟',
        type: 'achievement',
        rarity: 'rare',
        auto_grant: true,
        grant_condition: JSON.stringify({ type: 'post_count', value: 50 }),
        sort_order: 1,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        name: '优质博主',
        description: '发布高质量内容，获得社区用户广泛认可的博主',
        color: '#4ECDC4',
        icon: '👑',
        type: 'achievement',
        rarity: 'epic',
        auto_grant: true,
        grant_condition: JSON.stringify({ type: 'like_count', value: 500 }),
        sort_order: 2,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        name: '话题专家',
        description: '在特定话题领域表现突出，具有专业知识和见解',
        color: '#45B7D1',
        icon: '🎓',
        type: 'achievement',
        rarity: 'rare',
        auto_grant: false,
        grant_condition: null,
        sort_order: 3,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        name: '新手上路',
        description: '刚加入校园社区的用户，欢迎来到我们的大家庭',
        color: '#96CEB4',
        icon: '🌱',
        type: 'achievement',
        rarity: 'common',
        auto_grant: true,
        grant_condition: JSON.stringify({ type: 'register_days', value: 1 }),
        sort_order: 10,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440014',
        name: '月度之星',
        description: '当月最活跃、最受欢迎的用户',
        color: '#FFEAA7',
        icon: '🏆',
        type: 'achievement',
        rarity: 'legendary',
        auto_grant: false,
        grant_condition: null,
        sort_order: 5,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440015',
        name: '学习达人',
        description: '热爱学习，经常分享学习心得和资源',
        color: '#6C5CE7',
        icon: '📚',
        type: 'interest',
        rarity: 'common',
        auto_grant: false,
        grant_condition: null,
        sort_order: 11,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440016',
        name: '运动健将',
        description: '热爱运动，积极参与各种体育活动',
        color: '#00B894',
        icon: '⚽',
        type: 'interest',
        rarity: 'common',
        auto_grant: false,
        grant_condition: null,
        sort_order: 12,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440017',
        name: '摄影爱好者',
        description: '热爱摄影，经常分享美丽的校园风景',
        color: '#FD79A8',
        icon: '📷',
        type: 'interest',
        rarity: 'common',
        auto_grant: false,
        grant_condition: null,
        sort_order: 13,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('badges');
  }
};


