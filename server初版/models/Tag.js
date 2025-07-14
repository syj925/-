/**
 * 标签模型
 * 用于存储系统标签信息
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  /**
   * 定义Tag模型
   */
  const Tag = sequelize.define('Tag', {
    // 标签ID
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 标签名称
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    // 标签分类 - interest(兴趣爱好), skill(专业技能), major(学院专业), grade(年级), other(其他)
    category: {
      type: DataTypes.ENUM('interest', 'skill', 'major', 'grade', 'other'),
      defaultValue: 'interest',
      allowNull: false
    },
    // 标签描述
    description: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    // 标签颜色
    color: {
      type: DataTypes.STRING(20),
      defaultValue: '#2196f3',
      allowNull: false
    },
    // 使用次数
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'usage_count'
    },
    // 状态 - normal(普通), hot(热门), disabled(已禁用)
    status: {
      type: DataTypes.ENUM('normal', 'hot', 'disabled'),
      defaultValue: 'normal',
      allowNull: false
    },
    // 排序顺序
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order'
    },
    // 创建人ID
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'creator_id',
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    // 模型选项
    sequelize,
    modelName: 'Tag',
    tableName: 'tags',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: 'tags_name_index',
        fields: ['name']
      },
      {
        name: 'tags_category_index',
        fields: ['category']
      },
      {
        name: 'tags_status_index',
        fields: ['status']
      },
      {
        name: 'tags_creator_id_index',
        fields: ['creator_id']
      }
    ]
  });

  /**
   * 定义关联关系
   * @param {Object} models - 所有模型的集合
   */
  Tag.associate = (models) => {
    // 标签与用户的多对多关系 (用户兴趣)
    if (models.User) {
      Tag.belongsToMany(models.User, {
        through: 'user_tags',
        foreignKey: 'tag_id',
        otherKey: 'user_id',
        as: 'users'
      });
    }

    // 标签与帖子的多对多关系
    if (models.Post) {
      Tag.belongsToMany(models.Post, {
        through: 'post_tags',
        foreignKey: 'tag_id',
        otherKey: 'post_id',
        as: 'posts'
      });
    }

    // 标签与创建者的关系 - 已在 associations.js 中集中定义
    // if (models.User) {
    //   Tag.belongsTo(models.User, {
    //     foreignKey: 'creatorId',
    //     as: 'creator'
    //   });
    // }
  };

  return Tag;
}; 