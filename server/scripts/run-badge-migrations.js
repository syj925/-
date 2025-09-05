const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../config/logger');

// 初始化数据库连接
const sequelize = new Sequelize(
  config.database.database,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    pool: config.database.pool,
    define: config.database.define,
    timezone: config.database.timezone,
    logging: (sql) => {
      if (config.env === 'development') {
        logger.debug(sql);
      }
    }
  }
);

/**
 * 运行徽章相关的数据库迁移
 */
async function runBadgeMigrations() {
  try {
    console.log('🚀 开始运行徽章数据库迁移...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    const queryInterface = sequelize.getQueryInterface();

    console.log('📋 创建badges表...');
    
    // 检查badges表是否已存在
    const badgesTableExists = await queryInterface.showAllTables()
      .then(tables => tables.includes('badges'));

    if (!badgesTableExists) {
      // 执行badges表迁移
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
        auto_grant: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: '是否自动授予'
        },
        grant_condition: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: '自动授予条件配置（JSON格式）'
        },
        sort_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: '排序值'
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive'),
          allowNull: false,
          defaultValue: 'active',
          comment: '徽章状态'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
          comment: '创建时间'
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
          comment: '更新时间'
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
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

      console.log('✅ badges表创建成功');

      // 插入初始徽章数据
      console.log('📝 插入初始徽章数据...');
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
      
      console.log('✅ 初始徽章数据插入成功');
    } else {
      console.log('ℹ️  badges表已存在，跳过创建');
    }

    console.log('📋 创建user_badges表...');
    
    // 检查user_badges表是否已存在
    const userBadgesTableExists = await queryInterface.showAllTables()
      .then(tables => tables.includes('user_badges'));

    if (!userBadgesTableExists) {
      // 执行user_badges表迁移
      await queryInterface.createTable('user_badges', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
          comment: '用户徽章关联ID'
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE',
          comment: '用户ID'
        },
        badge_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'badges',
            key: 'id'
          },
          onDelete: 'CASCADE',
          comment: '徽章ID'
        },
        granted_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
          comment: '授予时间'
        },
        granted_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL',
          comment: '授予者ID，null表示系统自动授予'
        },
        is_visible: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: '用户是否选择显示此徽章'
        },
        display_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: '用户自定义显示顺序'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
          comment: '创建时间'
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
          comment: '更新时间'
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: '删除时间（软删除）'
        }
      }, {
        comment: '用户徽章关联表'
      });

      // 创建唯一约束和索引
      await queryInterface.addConstraint('user_badges', {
        fields: ['user_id', 'badge_id'],
        type: 'unique',
        name: 'unique_user_badge'
      });
      
      await queryInterface.addIndex('user_badges', ['user_id'], {
        name: 'idx_user_badges_user_id'
      });
      
      await queryInterface.addIndex('user_badges', ['badge_id'], {
        name: 'idx_user_badges_badge_id'
      });
      
      await queryInterface.addIndex('user_badges', ['granted_at'], {
        name: 'idx_user_badges_granted_at'
      });

      await queryInterface.addIndex('user_badges', ['user_id', 'is_visible'], {
        name: 'idx_user_badges_user_visible'
      });

      await queryInterface.addIndex('user_badges', ['user_id', 'display_order'], {
        name: 'idx_user_badges_user_order'
      });

      console.log('✅ user_badges表创建成功');
    } else {
      console.log('ℹ️  user_badges表已存在，跳过创建');
    }

    console.log('🎉 徽章数据库迁移完成！');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runBadgeMigrations()
    .then(() => {
      console.log('✅ 迁移脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 迁移脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { runBadgeMigrations };


