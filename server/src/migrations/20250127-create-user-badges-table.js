'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_badges', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        comment: '用户徽章关联ID'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: '用户ID'
      },
      badgeId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'badge_id',
        references: {
          model: 'badges',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: '徽章ID'
      },
      grantedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'granted_at',
        comment: '授予时间'
      },
      grantedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'granted_by',
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: '授予者ID，null表示系统自动授予'
      },
      isVisible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_visible',
        comment: '用户是否选择显示此徽章'
      },
      displayOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'display_order',
        comment: '用户自定义显示顺序'
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_badges');
  }
};


