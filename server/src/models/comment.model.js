const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    'Comment',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true
        }
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
      },
      reply_to: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'comments',
          key: 'id'
        }
      },
      root_comment_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'comments',
          key: 'id'
        },
        comment: '根评论ID，用于快速查找评论树'
      },
      reply_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '回复层级：0为顶级评论，1为一级回复，以此类推'
      },
      reply_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '回复数量'
      },
      mentioned_users: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '@提到的用户列表'
      },
      like_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: DataTypes.ENUM('normal', 'deleted', 'pending', 'rejected'),
        allowNull: false,
        defaultValue: 'normal',
        comment: 'normal: 正常, deleted: 已删除, pending: 待审核, rejected: 已拒绝'
      },
      is_anonymous: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否匿名评论'
      },
      images: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: '评论图片列表（普通图片）'
      },
      emoji_image: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: '图片表情（单个，与普通图片互斥）: { id, url, name }'
      }
    },
    {
      tableName: 'comments',
      timestamps: true,
      underscored: true,
      paranoid: true, // 启用软删除
      indexes: [
        {
          fields: ['user_id']
        },
        {
          fields: ['post_id']
        },
        {
          fields: ['reply_to']
        },
        {
          fields: ['root_comment_id']
        },
        {
          fields: ['reply_level']
        },
        {
          fields: ['post_id', 'reply_level', 'created_at']
        },
        {
          fields: ['created_at']
        }
      ]
    }
  );

  // 定义关联关系
  Comment.associate = models => {
    // 评论与用户是多对一关系
    Comment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'author'
    });

    // 评论与帖子是多对一关系
    Comment.belongsTo(models.Post, {
      foreignKey: 'post_id',
      as: 'post'
    });

    // 评论与评论是多对一关系（回复关系）
    Comment.belongsTo(models.Comment, {
      foreignKey: 'reply_to',
      as: 'parentComment'
    });

    // 评论与评论是一对多关系（回复关系）
    Comment.hasMany(models.Comment, {
      foreignKey: 'reply_to',
      as: 'replies'
    });

    // 评论与根评论的关系
    Comment.belongsTo(models.Comment, {
      foreignKey: 'root_comment_id',
      as: 'rootComment'
    });

    // 根评论与所有子评论的关系
    Comment.hasMany(models.Comment, {
      foreignKey: 'root_comment_id',
      as: 'allReplies'
    });

    // 评论与点赞是一对多关系
    Comment.hasMany(models.Like, {
      foreignKey: 'target_id',
      scope: {
        target_type: 'comment'
      },
      as: 'likes',
      constraints: false
    });
  };

  return Comment;
}; 