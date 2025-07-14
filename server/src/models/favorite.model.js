const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Favorite = sequelize.define(
    'Favorite',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
        allowNull: false
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      post_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'posts',
          key: 'id'
        }
      }
    },
    {
      tableName: 'favorites',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['user_id']
        },
        {
          fields: ['post_id']
        },
        {
          // 创建复合唯一索引，确保用户只能收藏同一帖子一次
          unique: true,
          fields: ['user_id', 'post_id']
        }
      ]
    }
  );

  // 定义关联关系
  Favorite.associate = models => {
    // 收藏与用户是多对一关系
    Favorite.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // 收藏与帖子是多对一关系
    Favorite.belongsTo(models.Post, {
      foreignKey: 'post_id',
      as: 'post'
    });
  };

  return Favorite;
}; 