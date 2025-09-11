const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    'Message',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('comment', 'like', 'favorite', 'system', 'follow', 'mention', 'reply', 'private'),
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      sender_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      receiver_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      post_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'posts',
          key: 'id'
        }
      },
      comment_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'comments',
          key: 'id'
        }
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      sub_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '系统消息子类型：announcement, event, reminder, warning等'
      }
    },
    {
      tableName: 'messages',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['sender_id']
        },
        {
          fields: ['receiver_id']
        },
        {
          fields: ['post_id']
        },
        {
          fields: ['comment_id']
        },
        {
          fields: ['type']
        },
        {
          fields: ['is_read']
        },
        {
          fields: ['created_at']
        },
        {
          // 创建复合索引，用于查询用户的未读消息
          fields: ['receiver_id', 'is_read', 'created_at']
        }
      ]
    }
  );

  // 定义关联关系
  Message.associate = models => {
    // 消息与发送者是多对一关系
    Message.belongsTo(models.User, {
      foreignKey: 'sender_id',
      as: 'sender'
    });

    // 消息与接收者是多对一关系
    Message.belongsTo(models.User, {
      foreignKey: 'receiver_id',
      as: 'receiver'
    });

    // 消息与帖子是多对一关系
    Message.belongsTo(models.Post, {
      foreignKey: 'post_id',
      as: 'post'
    });

    // 消息与评论是多对一关系
    Message.belongsTo(models.Comment, {
      foreignKey: 'comment_id',
      as: 'comment'
    });