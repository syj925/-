const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Follow = sequelize.define(
    'Follow',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
        allowNull: false
      },
      follower_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      following_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      }
    },
    {
      tableName: 'follows',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['follower_id']
        },
        {
          fields: ['following_id']
        },
        {
          // 创建复合唯一索引，确保用户只能关注同一用户一次
          unique: true,
          fields: ['follower_id', 'following_id']
        }
      ]
    }
  );

  // 定义关联关系
  Follow.associate = models => {
    // 关注者与用户是多对一关系
    Follow.belongsTo(models.User, {
      foreignKey: 'follower_id',
      as: 'follower'
    });

    // 被关注者与用户是多对一关系
    Follow.belongsTo(models.User, {
      foreignKey: 'following_id',
      as: 'following'
    });
  };

  return Follow;
}; 