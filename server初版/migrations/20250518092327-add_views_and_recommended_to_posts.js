'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // 添加isRecommended字段
      await queryInterface.addColumn('posts', 'is_recommended', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: '是否管理员推荐'
      });
    } catch (error) {
      console.log('添加is_recommended字段失败，可能已存在:', error.message);
    }

    try {
      // 创建post_views表
      await queryInterface.createTable('post_views', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        post_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'posts',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        ip_address: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      });

      // 添加索引
      await queryInterface.addIndex('post_views', ['post_id']);
      await queryInterface.addIndex('post_views', ['user_id']);
      await queryInterface.addIndex('post_views', ['created_at']);
    } catch (error) {
      console.log('创建post_views表失败，可能已存在:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // 删除isRecommended字段
      await queryInterface.removeColumn('posts', 'is_recommended');
    } catch (error) {
      console.log('删除is_recommended字段失败:', error.message);
    }
    
    try {
      // 删除post_views表
      await queryInterface.dropTable('post_views');
    } catch (error) {
      console.log('删除post_views表失败:', error.message);
    }
  }
};
