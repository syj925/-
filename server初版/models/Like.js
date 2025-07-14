/**
 * 点赞模型
 * 用于记录用户对帖子和评论的点赞行为
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  /**
   * 定义Like模型
   */
  const Like = sequelize.define('Like', {
    // 点赞ID
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
    // 类型 (帖子或评论)
    targetType: {
      type: DataTypes.ENUM('post', 'comment'),
      allowNull: false,
      field: 'target_type'
    },
    // 目标ID (帖子ID或评论ID)
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'target_id'
    },
    // 虚拟字段 - 帖子ID
    postId: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.targetType === 'post' ? this.targetId : null;
      },
      set(value) {
        if (value) {
          this.setDataValue('targetType', 'post');
          this.setDataValue('targetId', value);
        }
      }
    },
    // 虚拟字段 - 评论ID
    commentId: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.targetType === 'comment' ? this.targetId : null;
      },
      set(value) {
        if (value) {
          this.setDataValue('targetType', 'comment');
          this.setDataValue('targetId', value);
        }
      }
    }
  }, {
    // 模型选项
    sequelize,
    modelName: 'Like',
    tableName: 'likes',
    underscored: true,
    timestamps: true,
    indexes: [
      // 复合索引，提高查询性能并确保用户只能点赞一次
      {
        name: 'likes_user_target_index',
        unique: true,
        fields: ['user_id', 'target_type', 'target_id']
      },
      {
        name: 'likes_user_id_index',
        fields: ['user_id']
      }
    ]
  });

  /**
   * 定义关联关系
   * @param {Object} models - 所有模型的集合
   */
  Like.associate = (models) => {
    // 一个点赞属于一个用户
    Like.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Like;
}; 