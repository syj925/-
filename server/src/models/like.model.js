const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Like = sequelize.define(
    'Like',
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
      target_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      target_type: {
        type: DataTypes.ENUM('post', 'comment'),
        allowNull: false
      }
    },
    {
      tableName: 'likes',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['user_id']
        },
        {
          fields: ['target_id']
        },
        {
          fields: ['target_type']
        },
        {
          // 创建复合唯一索引，确保用户只能对同一目标点赞一次
          unique: true,
          fields: ['user_id', 'target_id', 'target_type']
        }
      ]
    }
  );

  // 定义关联关系
  Like.associate = models => {
    // 点赞与用户是多对一关系
    Like.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // 点赞与帖子是多对一关系（多态）
    Like.belongsTo(models.Post, {
      foreignKey: 'target_id',
      constraints: false,
      as: 'post'
    });

    // 点赞与评论是多对一关系（多态）
    Like.belongsTo(models.Comment, {
      foreignKey: 'target_id',
      constraints: false,
      as: 'comment'
    });
  };

  return Like;
}; 