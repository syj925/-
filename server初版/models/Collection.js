/**
 * 收藏模型
 * 用于记录用户对帖子的收藏行为
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  /**
   * 定义Collection模型
   */
  const Collection = sequelize.define('Collection', {
    // 收藏ID
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 用户ID
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // 帖子ID
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'post_id',
      references: {
        model: 'posts',
        key: 'id'
      }
    },
    // 自定义收藏夹名称（可选）
    name: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    // 模型选项
    sequelize,
    modelName: 'Collection',
    tableName: 'collections',
    underscored: true,
    timestamps: true,
    indexes: [
      // 复合索引，提高查询性能并确保用户只能收藏一次
      {
        name: 'collections_user_post_index',
        unique: true,
        fields: ['user_id', 'post_id']
      },
      {
        name: 'collections_user_id_index',
        fields: ['user_id']
      },
      {
        name: 'collections_post_id_index',
        fields: ['post_id']
      }
    ]
  });

  /**
   * 定义关联关系
   * @param {Object} models - 所有模型的集合
   */
  Collection.associate = (models) => {
    // 一个收藏属于一个用户
    Collection.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // 一个收藏属于一个帖子
    Collection.belongsTo(models.Post, {
      foreignKey: 'postId',
      as: 'post'
    });
  };

  return Collection;
}; 