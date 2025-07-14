const { DataTypes } = require('sequelize');

/**
 * Category模型定义
 * @param {import('sequelize').Sequelize} sequelize - Sequelize实例
 * @returns {import('sequelize').Model} - Category模型
 */
module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '分类名称'
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '分类描述'
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '分类图标'
    },
    bgColor: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '背景颜色，例如 rgba(74, 144, 226, 0.1)',
      field: 'bg_color'
    },
    type: {
      type: DataTypes.ENUM('post', 'topic', 'event'),
      defaultValue: 'post',
      comment: '分类类型: post-帖子分类, topic-话题分类, event-活动分类'
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序，数字越小越靠前'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态: active-启用, inactive-禁用'
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '父分类ID，为空表示一级分类',
      field: 'parent_id'
    }
  }, {
    tableName: 'categories',
    paranoid: true, // 软删除
    underscored: true, // 将驼峰命名转换为下划线
    timestamps: true, // 添加 createdAt 和 updatedAt
    indexes: [
      {
        name: 'idx_category_type_status',
        fields: ['type', 'status']
      },
      {
        name: 'idx_category_parent_id',
        fields: ['parent_id']
      },
      {
        name: 'idx_category_sort',
        fields: ['sort']
      }
    ]
  });

  /**
   * 模型关联关系
   * @param {Object} models - 所有模型
   */
  Category.associate = function(models) {
    // 分类与帖子的关联关系
    if (models.Post) {
      Category.hasMany(models.Post, {
        foreignKey: 'category_id',
        as: 'posts'
      });
    }

    // 自关联：父子分类
    Category.hasMany(Category, {
      foreignKey: 'parent_id',
      as: 'children'
    });
    Category.belongsTo(Category, {
      foreignKey: 'parent_id',
      as: 'parent'
    });
  };

  return Category;
}; 