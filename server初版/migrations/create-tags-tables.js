/**
 * 创建标签相关表的迁移脚本
 */
const { DataTypes } = require('sequelize');

module.exports = {
  /**
   * 执行迁移
   * @param {import('sequelize').QueryInterface} queryInterface - Sequelize查询接口
   * @param {import('sequelize')} Sequelize - Sequelize构造函数
   */
  up: async (queryInterface, Sequelize) => {
    console.log('开始执行标签表迁移...');

    // 创建tags表
    await queryInterface.createTable('tags', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      category: {
        type: DataTypes.ENUM('interest', 'skill', 'major', 'grade', 'other'),
        defaultValue: 'interest',
        allowNull: false
      },
      description: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      color: {
        type: DataTypes.STRING(20),
        defaultValue: '#2196f3',
        allowNull: false
      },
      usage_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      status: {
        type: DataTypes.ENUM('normal', 'hot', 'disabled'),
        defaultValue: 'normal',
        allowNull: false
      },
      sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      creator_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    });

    console.log('标签表创建成功');

    // 创建user_tags关联表
    await queryInterface.createTable('user_tags', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tag_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tags',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // 添加唯一约束，防止重复关联
    await queryInterface.addConstraint('user_tags', {
      type: 'unique',
      fields: ['user_id', 'tag_id'],
      name: 'user_tag_unique'
    });

    console.log('用户标签关联表创建成功');

    // 创建post_tags关联表
    await queryInterface.createTable('post_tags', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      post_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'posts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tag_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tags',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // 添加唯一约束，防止重复关联
    await queryInterface.addConstraint('post_tags', {
      type: 'unique',
      fields: ['post_id', 'tag_id'],
      name: 'post_tag_unique'
    });

    console.log('帖子标签关联表创建成功');
    console.log('标签相关表迁移完成');
  },

  /**
   * 回滚迁移
   * @param {import('sequelize').QueryInterface} queryInterface - Sequelize查询接口
   * @param {import('sequelize')} Sequelize - Sequelize构造函数
   */
  down: async (queryInterface, Sequelize) => {
    console.log('开始回滚标签表迁移...');

    // 删除表，注意删除顺序，先删除关联表，再删除主表
    await queryInterface.dropTable('post_tags');
    await queryInterface.dropTable('user_tags');
    await queryInterface.dropTable('tags');

    console.log('标签相关表回滚完成');
  }
}; 