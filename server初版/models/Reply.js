const { DataTypes } = require('sequelize');

/**
 * Reply模型定义 - 用于评论的回复
 * @param {import('sequelize').Sequelize} sequelize - Sequelize实例
 * @returns {import('sequelize').Model} - Reply模型
 */
module.exports = (sequelize, DataTypes) => {
  const Reply = sequelize.define('Reply', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '回复内容'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '回复用户ID',
      field: 'user_id'
    },
    commentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '所属评论ID',
      field: 'comment_id'
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '父级回复ID，如果是对评论的回复则为null',
      field: 'parent_id'
    },
    replyToUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '被回复用户ID，如果是回复评论则为评论作者ID',
      field: 'reply_to_user_id'
    },
    likes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '点赞数'
    },
    status: {
      type: DataTypes.ENUM('normal', 'hidden'),
      defaultValue: 'normal',
      comment: '状态：normal-正常，hidden-隐藏'
    }
  }, {
    tableName: 'replies',
    paranoid: true, // 软删除
    underscored: true, // 将驼峰命名转换为下划线
    timestamps: true, // 添加 createdAt 和 updatedAt
    indexes: [
      {
        name: 'idx_reply_comment_id',
        fields: ['comment_id']
      },
      {
        name: 'idx_reply_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_reply_parent_id',
        fields: ['parent_id']
      }
    ]
  });

  /**
   * 模型关联关系
   * @param {Object} models - 所有模型
   */
  Reply.associate = function(models) {
    // 回复与用户的关系
    Reply.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // 回复与评论的关系
    Reply.belongsTo(models.Comment, {
      foreignKey: 'comment_id',
      as: 'comment'
    });

    // 回复与被回复用户的关系
    Reply.belongsTo(models.User, {
      foreignKey: 'reply_to_user_id',
      as: 'replyToUser'
    });

    // 回复的自关联（父子回复）
    Reply.belongsTo(Reply, {
      foreignKey: 'parent_id',
      as: 'parent'
    });
    
    Reply.hasMany(Reply, {
      foreignKey: 'parent_id',
      as: 'children'
    });

    // 回复与点赞的关系
    if (models.Like) {
      Reply.hasMany(models.Like, {
        foreignKey: 'target_id',
        scope: {
          target_type: 'reply'
        },
        as: 'replyLikes'
      });
    }
  };

  return Reply;
}; 