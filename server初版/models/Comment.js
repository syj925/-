/**
 * 评论模型
 * 用于存储用户对帖子、话题等内容的评论
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  /**
   * 定义Comment模型
   */
  const Comment = sequelize.define('Comment', {
    // 评论ID
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 评论内容
    content: {
      type: DataTypes.TEXT,
      allowNull: false
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
      allowNull: true,
      field: 'post_id',
      references: {
        model: 'posts',
        key: 'id'
      }
    },
    // 点赞数
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // 父评论ID（用于回复）
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_id'
    },
    // 是否匿名评论
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_anonymous'
    },
    // 状态
    status: {
      type: DataTypes.ENUM('active', 'hidden', 'deleted'),
      defaultValue: 'active'
    }
  }, {
    // 模型选项
    sequelize,
    modelName: 'Comment',
    tableName: 'comments',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: 'comments_user_id_index',
        fields: ['user_id']
      },
      {
        name: 'comments_post_id_index',
        fields: ['post_id']
      },
      {
        name: 'comments_parent_id_index',
        fields: ['parent_id']
      },
      {
        name: 'comments_status_index',
        fields: ['status']
      }
    ]
  });

  /**
   * 定义关联关系
   * @param {Object} models - 所有模型的集合
   */
  Comment.associate = (models) => {
    // 一个评论属于一个用户
    Comment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'author'
    });

    // 一个评论属于一个帖子 - 关联已在 associations.js 中集中管理
    // Comment.belongsTo(models.Post, {
    //   foreignKey: 'postId',
    //   as: 'post'
    // });

    // 评论与父评论的关联
    Comment.belongsTo(models.Comment, {
      foreignKey: 'parentId',
      as: 'parentComment'
    });

    // 评论与子评论的关联
    Comment.hasMany(models.Comment, {
      foreignKey: 'parentId',
      as: 'replies'
    });

    // 评论的点赞关系
    Comment.hasMany(models.Like, {
      foreignKey: 'commentId',
      as: 'commentLikes'
    });

    // 评论与回复的关联
    if (models.Reply) {
      Comment.hasMany(models.Reply, {
        foreignKey: 'commentId',
        as: 'commentReplies'
      });
    }
  };

  return Comment;
}; 